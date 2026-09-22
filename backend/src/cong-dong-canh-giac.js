'use strict';

/**
 * CỘNG ĐỒNG CẢNH GIÁC — bản đầu không lưu lời kể gốc.
 *
 * Dữ liệu đi vào chỉ tồn tại trong lượt xử lý: bộ phân tích trích mã thủ đoạn,
 * sau đó kho chỉ giữ bản tóm tắt an toàn và trạng thái duyệt. Không có tên,
 * số điện thoại, link, nội dung gốc hay id tài khoản người đăng.
 */
const crypto = require('node:crypto');
const { analyze } = require('./analysis/pipeline');
const { trichTinHieu } = require('./analysis/llm-extractor');

const MAX = 5000;
const MAX_POSTS = 200;
const kho = [];

/*
 * ⚠️ SỬA 22/9/2026 — `lua_dau_tu` KHÔNG PHẢI MỘT MÃ THẬT.
 *
 * `analyze()` ở `pipeline.js` không bao giờ trả `hoKichBan: 'lua_dau_tu'` —
 * mã thật là `du_dau_tu_loi_nhuan_cao` (xem `HO_KICH_BAN` cùng tệp, và
 * `src/catalog.ts` phía frontend dùng đúng mã đó). Hậu quả: MỌI bài đăng cộng
 * đồng về kịch bản dụ đầu tư đều rơi vào câu chung chung "Một tình huống có
 * dấu hiệu lừa đảo" thay vì gọi đúng tên — và không ai thấy gì bất thường, vì
 * câu chung chung vẫn đọc trơn tru. Đúng dạng lỗi §4.3: hỏng mà nhìn y hệt
 * lúc bình thường.
 *
 * Danh sách dưới đây liệt kê ĐỦ mọi mã `HO_KICH_BAN_MA` mà pipeline có thể
 * trả — thiếu một mã là lặp lại đúng lỗi trên ở một kịch bản khác.
 */
const TEN_HO = Object.freeze({
  gia_danh_cong_an: 'Giả danh công an / cơ quan nhà nước',
  gia_danh_co_quan_thue: 'Giả danh cơ quan thuế',
  gia_danh_ngan_hang: 'Giả danh ngân hàng',
  gia_danh_ho_tro_ky_thuat: 'Giả danh hỗ trợ kỹ thuật',
  gia_danh_ho_tro_lay_lai_tien: 'Giả danh bên nhận lấy lại tiền',
  gia_danh_nguoi_than: 'Giả danh người thân',
  bao_tin_nguoi_than_gap_nan: 'Báo tin người thân gặp nạn',
  tai_khoan_nguoi_than_bi_chiem: 'Tài khoản người thân bị chiếm',
  gia_danh_giao_hang: 'Giả danh giao hàng',
  gia_danh_dich_vu_thiet_yeu: 'Giả danh điện, nước, viễn thông',
  gia_danh_tuyen_dung: 'Giả danh bên tuyển dụng',
  lua_lay_lai_tien: 'Hứa lấy lại tiền đã mất',
  chiem_quyen_thiet_bi: 'Dụ cài ứng dụng hoặc chiếm quyền máy',
  du_dau_tu_loi_nhuan_cao: 'Mời đầu tư, lợi nhuận cao',
  lua_tinh_cam: 'Lừa tình cảm',
});

const TEN_MA = Object.freeze({
  FIN_TRANSFER_REQUEST: 'thúc chuyển tiền',
  FIN_SAFE_ACCOUNT: 'dụ chuyển vào tài khoản an toàn',
  CRED_OTP_SHARE: 'xin mã OTP hoặc mã xác thực',
  MAN_FEAR_THREAT: 'dùng đe doạ hoặc gây hoảng sợ',
  DEV_SCREEN_SHARE_BANKING: 'đòi chia sẻ màn hình ngân hàng',
  DEV_REMOTE_CONTROL_APP: 'dụ cài ứng dụng điều khiển máy',
});

function chuoi(v) { return typeof v === 'string' ? v.trim() : ''; }

function taoTomTat(ketQua) {
  const ho = chuoi(ketQua.hoKichBan);
  const ma = Array.isArray(ketQua.maLyDo) ? ketQua.maLyDo : [];
  const hanhVi = [...new Set(ma.map((x) => TEN_MA[x]).filter(Boolean))].slice(0, 3);
  const dau = hanhVi.length ? ` Có dấu hiệu ${hanhVi.join(', ')}.` : '';
  return `${TEN_HO[ho] || 'Một tình huống có dấu hiệu lừa đảo'} được hệ thống tổng hợp từ một chia sẻ ẩn danh.${dau}`;
}

async function taoBanChoDuyet(noiDung) {
  const vanBan = chuoi(noiDung).slice(0, MAX);
  if (vanBan.length < 12) throw new Error('NOI_DUNG_QUA_NGAN');

  // AI chỉ trích tín hiệu để bổ sung nhận diện; không được tự quyết mức rủi ro.
  // Nếu AI không sẵn sàng, bộ luật cục bộ vẫn tạo được hồ sơ chờ duyệt.
  let ai = null;
  try {
    ai = await Promise.race([
      trichTinHieu(vanBan, { sourceId: 'cong_dong' }),
      new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
  } catch { ai = null; }
  const ketQua = analyze({ vanBan });
  const maLyDo = [...new Set([
    ...(Array.isArray(ketQua.maLyDo) ? ketQua.maLyDo : []),
    ...(ai?.signals || []).filter((s) => s?.state === 'present').map((s) => s.id),
  ])].filter((x) => /^[A-Z][A-Z0-9_]{1,60}$/.test(x)).slice(0, 12);

  // Chỉ giữ mã đã chuẩn hoá. vanBan không được đưa vào object này.
  const ban = {
    id: crypto.randomUUID(),
    trangThai: 'cho_duyet',
    luc: Date.now(),
    hoKichBan: /^[a-z][a-z0-9_]{1,60}$/.test(ketQua.hoKichBan || '') ? ketQua.hoKichBan : null,
    maLyDo,
    tomTat: taoTomTat({ hoKichBan: ketQua.hoKichBan, maLyDo }),
    aiDaChay: ai?.aiDaChay === true,
  };
  kho.unshift(ban);
  if (kho.length > MAX_POSTS) kho.length = MAX_POSTS;
  return { ...ban };
}

function layDaDuyet() {
  return kho.filter((x) => x.trangThai === 'da_duyet').map(({ id, luc, tomTat, hoKichBan, maLyDo }) => ({
    id, luc, tomTat, hoKichBan, maLyDo,
  }));
}

function duyet(id, token) {
  const dungToken = process.env.KHOAN_DA_REVIEW_TOKEN;
  if (!dungToken || token !== dungToken) return null;
  const ban = kho.find((x) => x.id === id);
  if (!ban) return null;
  ban.trangThai = 'da_duyet';
  return { ...ban };
}

function layThongKe() {
  return {
    daDuyet: kho.filter((x) => x.trangThai === 'da_duyet').length,
    choDuyet: kho.filter((x) => x.trangThai === 'cho_duyet').length,
  };
}

module.exports = { taoBanChoDuyet, layDaDuyet, duyet, layThongKe, MAX };
