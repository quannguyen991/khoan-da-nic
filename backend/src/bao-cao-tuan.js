'use strict';
/**
 * BÁO CÁO TUẦN — gửi cho người thân, KỂ CẢ TUẦN KHÔNG CÓ SỰ KIỆN GÌ.
 *
 * ══════════ VẤN ĐỀ ĐANG GIẢI ══════════
 * App này bình thường im lặng hàng tháng. Người trả tiền quên mất mình đang trả
 * cho cái gì rồi huỷ gói. Báo cáo tuần là bằng chứng định kỳ rằng nó vẫn đang
 * canh — nên tuần yên ả PHẢI được nói ra thành lời, chứ không phải im lặng.
 *
 * ══════════ §4.3 QUYẾT ĐỊNH TOÀN BỘ THIẾT KẾ TỆP NÀY ══════════
 *
 * "Tuần này không có gì đáng ngại" là một câu NGUY HIỂM, và nó nguy hiểm theo
 * đúng cách §4.3 mô tả. Nếu quyền đọc thông báo bị hệ thống thu hồi hôm thứ Ba
 * và không ai biết, thì bốn ngày cuối tuần KHÔNG CÓ GÌ ĐƯỢC QUÉT — mà báo cáo
 * vẫn nói "không có gì đáng ngại". Đó không phải là một tuần yên ả; đó là một
 * tuần mù, và hai thứ đó phải nói khác nhau.
 *
 * Nên câu "tuần yên ả" CHỈ được phát khi ĐỘ PHỦ SÓNG ĐẦY ĐỦ. Có khoảng trống
 * thì báo cáo nói ra khoảng trống — và nói TRƯỚC con số, vì con số đọc trong
 * một tuần mù là con số gây hiểu nhầm.
 *
 * ⚠️ §11 — KHÔNG dùng chữ "an toàn". Báo cáo mô tả VIỆC ĐÃ LÀM (đã quét bao
 * nhiêu, thấy gì), không hứa hẹn trạng thái.
 *
 * HÀM THUẦN. Không mạng, không đồng hồ ẩn — mọi mốc thời gian truyền vào.
 */

const { tongHop } = require('./canh-bao-hai-phia');
const { chiSoCanhGiac, baoCaoChoNguoiThan, xuHuong } = require('./dien-tap');

const TUAN_MS = 7 * 86_400_000;

/** Tần suất. `tat` là một lựa chọn hợp lệ — người thân tắt được. */
const TAN_SUAT = Object.freeze(['tuan', 'hai_tuan', 'thang', 'tat']);

const KHOANG_THEO_TAN_SUAT = Object.freeze({
  tuan: TUAN_MS, hai_tuan: 2 * TUAN_MS, thang: 30 * 86_400_000,
});

/**
 * ĐỘ PHỦ SÓNG — bao nhiêu phần của kỳ báo cáo thật sự được canh.
 *
 * @param {Array} khoangMu  [{tu, den, ly}] — đoạn KHÔNG canh được: quyền bị thu
 *                          hồi, service bị hệ thống kill, máy tắt nguồn.
 */
function doPhuSong({ tu, den, khoangMu = [] }) {
  const tong = Math.max(0, den - tu);
  if (tong === 0) return { tong: 0, muMs: 0, tyLe: 0, khoang: [] };

  // Gộp các đoạn mù chồng lên nhau, nếu không sẽ đếm trùng.
  const doan = khoangMu
    .map((k) => ({ tu: Math.max(k.tu, tu), den: Math.min(k.den, den), ly: k.ly }))
    .filter((k) => k.den > k.tu)
    .sort((a, b) => a.tu - b.tu);

  const gop = [];
  for (const d of doan) {
    const cuoi = gop[gop.length - 1];
    if (cuoi && d.tu <= cuoi.den) {
      cuoi.den = Math.max(cuoi.den, d.den);
      if (!cuoi.ly.includes(d.ly)) cuoi.ly.push(d.ly);
    } else {
      gop.push({ tu: d.tu, den: d.den, ly: [d.ly] });
    }
  }

  const muMs = gop.reduce((t, d) => t + (d.den - d.tu), 0);
  return { tong, muMs, tyLe: (tong - muMs) / tong, khoang: gop };
}

/**
 * Tóm tắt MỘT ca. §6.9 — không nội dung thô, không số tài khoản, không số
 * điện thoại. Người thân đọc mã + câu giải thích là đủ để biết chuyện gì.
 */
function tomTatCa(g) {
  return {
    thoiDiem: g.thoiDiem,
    nhan: g.nhan,
    maGiaiThich: g.maGiaiThich,
    luatKhopVoi: g.luatKhopVoi || [],
    nguon: g.nguon,
    nguoiThanDaDay: g.nguoiThanDaDay === true,
    nguoiThanDaBamGoi: g.nguoiThanDaBamGoi === true,
    ketQua: g.ketQua || 'chua_ro',
  };
}

/**
 * @param {object} p
 *   tu, den            mốc kỳ báo cáo
 *   canhBao            bản ghi `canh_bao` trong kỳ
 *   soLuotQuet         số tin/thông báo đã quét trong kỳ
 *   luotDienTap        lượt diễn tập trong kỳ
 *   trangThaiHeThong   { quyenDocThongBao, chayNen, dongBoGanNhat, phienBanLuat }
 *   khoangMu           [{tu, den, ly}]
 */
function dungBaoCaoTuan({
  tu, den, canhBao = [], soLuotQuet = 0, luotDienTap = [],
  trangThaiHeThong = {}, khoangMu = [],
} = {}) {
  const phuSong = doPhuSong({ tu, den, khoangMu });
  const d = tongHop(canhBao);

  const cao = canhBao.filter((g) => g.nhan === 'CAO').map(tomTatCa);
  const nghiNgo = canhBao.filter((g) => g.nhan === 'NGHI_NGO').map(tomTatCa);

  const dienTapGanNhat = luotDienTap.length
    ? baoCaoChoNguoiThan([...luotDienTap].sort((a, b) => b.guiLuc - a.guiLuc)[0])
    : null;

  /*
   * ⚠️ TRẠNG THÁI HỆ THỐNG NÓI ĐÚNG THỨ BIẾT ĐƯỢC.
   * `undefined` ⇒ `khong_do_duoc`, KHÔNG phải `false` và cũng KHÔNG phải `true`.
   * Đây là chỗ dễ nhất để một "chưa đo được" biến thành "vẫn tốt".
   */
  const batBuoc = (v) => (typeof v === 'boolean' ? (v ? 'con_hieu_luc' : 'da_mat') : 'khong_do_duoc');
  const heThong = {
    quyenDocThongBao: batBuoc(trangThaiHeThong.quyenDocThongBao),
    chayNen: batBuoc(trangThaiHeThong.chayNen),
    dongBoGanNhat: typeof trangThaiHeThong.dongBoGanNhat === 'number'
      ? trangThaiHeThong.dongBoGanNhat : null,
    phienBanLuat: trangThaiHeThong.phienBanLuat || null,
  };

  /*
   * ⚠️ CÂU "TUẦN YÊN Ả" CÓ ĐIỀU KIỆN — ĐỌC KHỐI §4.3 Ở ĐẦU TỆP.
   * Phủ sóng đủ (≥ 99% kỳ, và không mốc hệ thống nào đã mất) mới được nói.
   */
  const phuSongDu = phuSong.tyLe >= 0.99
    && heThong.quyenDocThongBao !== 'da_mat'
    && heThong.chayNen !== 'da_mat';

  const yenA = d.tong === 0;
  let maCauChinh;
  if (!yenA) maCauChinh = 'co_su_kien_trong_tuan';
  else if (phuSongDu) maCauChinh = 'tuan_nay_khong_co_gi_dang_ngai';
  else maCauChinh = 'tuan_nay_co_khoang_khong_canh_duoc';

  return {
    ky: { tu, den },
    maCauChinh,
    /*
     * §HĐ luật 3 áp cho cả báo cáo: khoảng mù phải hiện CÙNG CỠ CHỮ với con số,
     * không phải một dòng chú thích nhỏ ở cuối. Nên nó nằm ở gốc phong bì,
     * không nằm trong `heThong`.
     */
    khoangKhongCanhDuoc: phuSong.khoang.map((k) => ({ tu: k.tu, den: k.den, ly: k.ly })),
    tyLePhuSong: Math.round(phuSong.tyLe * 1000) / 1000,

    soLuotQuet,
    demTheoNhan: { cao: d.cao, nghiNgo: d.nghiNgo },
    ca: { cao, nghiNgo },
    giaoNhan: { daDay: d.daDay, daMo: d.daMo, daBamGoi: d.daBamGoi },
    ketQua: { that: d.that, baoNham: d.baoNham, chuaRo: d.chuaRo },
    /*
     * §4.6 — số lần bấm "Tôi ổn" là dữ liệu hiệu chỉnh ngưỡng, và người thân
     * nên thấy nó: nó nói "bố mẹ thấy app báo quá tay".
     */
    soLanBamToiOn: d.toiOn,

    dienTap: {
      ganNhat: dienTapGanNhat,
      chiSoCanhGiac: chiSoCanhGiac(luotDienTap),
      xuHuong: xuHuong(luotDienTap, { soTuan: 12, den }),
    },

    heThong,
  };
}

/** Kỳ báo cáo gần nhất theo tần suất. `tat` ⇒ null. */
function kyBaoCao(tanSuat, den) {
  if (!TAN_SUAT.includes(tanSuat) || tanSuat === 'tat') return null;
  const khoang = KHOANG_THEO_TAN_SUAT[tanSuat];
  return { tu: den - khoang, den };
}

/**
 * Có nên gửi kỳ này không. Tuần yên ả VẪN GỬI — đó là cả điểm của tính năng.
 * Chỉ `tat` mới không gửi.
 */
function nenGui({ tanSuat, guiLanTruoc = null, bayGio }) {
  if (!TAN_SUAT.includes(tanSuat)) return { gui: false, ly: 'tan_suat_khong_hop_le' };
  if (tanSuat === 'tat') return { gui: false, ly: 'nguoi_than_da_tat' };
  const khoang = KHOANG_THEO_TAN_SUAT[tanSuat];
  if (guiLanTruoc !== null && bayGio - guiLanTruoc < khoang) return { gui: false, ly: 'chua_toi_ky' };
  return { gui: true, ly: null };
}

/**
 * Hai đường gửi: email và push. Trả PAYLOAD, không tự gửi — §5.4 và cùng lý do
 * với `tang-2.js`: một module tự gọi mạng là một module không test được và là
 * một chỗ để dữ liệu rò ra mà không ai thấy trong sơ đồ.
 *
 * ⚠️ §9.4 — push của báo cáo tuần KHÔNG đổ chuông. Nó không khẩn cấp, và làm nó
 * kêu như cảnh báo thật là dạy người ta bỏ qua tiếng chuông thật.
 */
function dungBanGui(baoCao) {
  return {
    email: {
      maTieuDe: baoCao.maCauChinh,
      // Thân thư dựng ở tầng hiển thị từ mã + số. Backend KHÔNG dựng câu
      // (§HĐ luật 2) — đổi ngôn ngữ không được làm đổi nội dung báo cáo.
      duLieu: baoCao,
    },
    push: {
      maSuKien: 'bao_cao_dinh_ky',
      maCauChinh: baoCao.maCauChinh,
      soLuotQuet: baoCao.soLuotQuet,
      demTheoNhan: baoCao.demTheoNhan,
      doChuong: false,
      tuyChonHienThi: { requireInteraction: false, silent: true, tag: 'khoanda-bao-cao' },
    },
  };
}

module.exports = {
  dungBaoCaoTuan, doPhuSong, kyBaoCao, nenGui, dungBanGui, tomTatCa,
  TAN_SUAT, KHOANG_THEO_TAN_SUAT, TUAN_MS,
};
