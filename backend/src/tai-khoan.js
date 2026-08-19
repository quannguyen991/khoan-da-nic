/**
 * TÀI KHOẢN — ĐĂNG KÝ, ĐĂNG NHẬP, HỒ SƠ.
 *
 * ══════════ NĂM RÀNG BUỘC QUYẾT ĐỊNH THIẾT KẾ NÀY ══════════
 *
 * ① §5.3 · §6.9 — KHÔNG BẮT ĐĂNG NHẬP ĐỂ KIỂM TIN NHẮN.
 *    Tài khoản CHỈ mở thêm những thứ cần quan hệ nhiều thiết bị: vòng tròn gia
 *    đình, cảnh báo người thân, quy tắc chung. Người đang bị kẻ lừa đảo thúc
 *    trên điện thoại mà gặp màn đăng nhập thì họ đóng app. `auth.js` giữ danh
 *    sách route không bao giờ đòi đăng nhập; danh sách đó chỉ được DÀI RA.
 *
 * ② MẬT KHẨU KHÔNG BAO GIỜ RỜI KHỎI HÀM NÀY DƯỚI DẠNG ĐỌC ĐƯỢC.
 *    `vault-store.js` có `matKhau` và `password` trong `TRUONG_CAM` — kho sẽ
 *    NÉM LỖI nếu ai đó cố lưu. Đó là hàng rào, không phải quy ước. Ở đây chỉ
 *    lưu `bam` (scrypt) và `muoi`.
 *
 * ③ §11 — KHÔNG NÓI TÀI KHOẢN NÀO TỒN TẠI.
 *    Đăng nhập sai trả về CÙNG MỘT MÃ dù số điện thoại có tồn tại hay không.
 *    Nói "số này chưa đăng ký" là tặng cho kẻ lừa đảo một máy dò danh sách
 *    khách hàng — đúng nhóm người chúng đang nhắm tới.
 *
 * ④ ẢNH HỒ SƠ KHÔNG LÊN MÁY CHỦ. Xem `HO_SO_TREN_MAY` bên dưới.
 *
 * ⑤ SO SÁNH CHỐNG ĐO THỜI GIAN, và LUÔN chạy hết một lượt băm kể cả khi không
 *    tìm thấy tài khoản — nếu không, thời gian phản hồi tự nó tiết lộ số nào
 *    đã đăng ký.
 */

'use strict';

const crypto = require('node:crypto');

const BANG = 'tai_khoan';
const BANG_SO = 'tai_khoan_theo_so';

/** scrypt — chậm có chủ đích. Tham số theo khuyến nghị hiện hành. */
const SCRYPT = { N: 16384, r: 8, p: 1, dkLen: 32 };

/**
 * ⚠️ ẢNH ĐẠI DIỆN NẰM TRÊN MÁY, KHÔNG LƯU Ở MÁY CHỦ — CÓ CHỦ ĐÍCH.
 *
 * §6.9 nói nội dung của người dùng không rời khỏi máy, và `anh` nằm thẳng trong
 * `TRUONG_CAM` của kho. Một tấm ảnh chân dung người cao tuổi là dữ liệu sinh
 * trắc học ở dạng thô nhất; gửi nó lên máy chủ để làm đẹp màn hồ sơ là đánh đổi
 * tệ.
 *
 * Hệ quả trung thực: đổi sang máy khác thì ảnh không theo sang. Giao diện PHẢI
 * nói điều đó ra, không được để bác tưởng ảnh đã được lưu ở đâu đó.
 */
const HO_SO_TREN_MAY = Object.freeze(['anhDaiDien']);

class LoiTaiKhoan extends Error {
  constructor(ma) { super(ma); this.name = 'LoiTaiKhoan'; this.ma = ma; }
}

/** Chuẩn hoá số điện thoại Việt Nam về một dạng duy nhất để tra. */
function chuanHoaSo(s) {
  const chiSo = String(s ?? '').replace(/[^\d+]/g, '');
  if (/^\+84\d{9}$/.test(chiSo)) return `0${chiSo.slice(3)}`;
  if (/^84\d{9}$/.test(chiSo)) return `0${chiSo.slice(2)}`;
  return chiSo;
}

const soHopLe = (s) => /^0\d{9}$/.test(s);

function bam(matKhau, muoi) {
  return crypto.scryptSync(String(matKhau), muoi, SCRYPT.dkLen, SCRYPT).toString('base64');
}

/**
 * ⚠️ MẬT KHẨU TỐI THIỂU 6 KÝ TỰ, KHÔNG ĐÒI HOA/SỐ/KÝ TỰ ĐẶC BIỆT.
 *
 * Quy tắc phức tạp làm người cao tuổi viết mật khẩu ra giấy dán lên máy — thứ
 * đó nguy hiểm hơn một mật khẩu đơn giản. Và §5.3 nói tài khoản không gác chức
 * năng kiểm tra, nên thiệt hại khi lộ một tài khoản là có giới hạn.
 */
function kiemMatKhau(mk) {
  if (typeof mk !== 'string' || mk.length < 6) throw new LoiTaiKhoan('MAT_KHAU_QUA_NGAN');
  if (mk.length > 200) throw new LoiTaiKhoan('MAT_KHAU_QUA_DAI');
}

const VAI = Object.freeze(['nguoi_dung', 'nguoi_than']);

/**
 * Đăng ký.
 *
 * ⚠️ TRẢ VỀ HỒ SƠ CÔNG KHAI, KHÔNG TRẢ BẢN GHI KHO. Bản ghi kho có `bam` và
 * `muoi`; lỡ tay trả nguyên bản ghi ra HTTP là lộ hết.
 */
async function dangKy(kho, { ten, soDienThoai, matKhau, vai = 'nguoi_dung' }, bayGio = Date.now()) {
  const so = chuanHoaSo(soDienThoai);
  if (!soHopLe(so)) throw new LoiTaiKhoan('SO_DIEN_THOAI_KHONG_HOP_LE');
  if (typeof ten !== 'string' || !ten.trim()) throw new LoiTaiKhoan('THIEU_TEN');
  if (!VAI.includes(vai)) throw new LoiTaiKhoan('VAI_KHONG_HOP_LE');
  kiemMatKhau(matKhau);

  if (await kho.doc(BANG_SO, so)) throw new LoiTaiKhoan('SO_DA_DUOC_DANG_KY');

  const id = crypto.randomUUID();
  const muoi = crypto.randomBytes(16).toString('base64');

  /*
   * ⚠️ TÊN TRƯỜNG LÀ `bam`, KHÔNG PHẢI `matKhau`.
   * `vault-store.js` ném lỗi với `matKhau`/`password`. Đó là hàng rào cố ý:
   * nếu ai đó sau này lưu mật khẩu thô, kho từ chối chứ không im lặng nhận.
   */
  const banGhi = {
    id, ten: ten.trim().slice(0, 80), so, vai,
    bam: bam(matKhau, muoi), muoi,
    taoLuc: bayGio,
  };

  await kho.luu(BANG, id, banGhi);
  await kho.luu(BANG_SO, so, { id });
  await kho.themAudit({ viec: 'dang_ky', taiKhoanId: id, luc: bayGio });

  return hoSoCongKhai(banGhi);
}

/**
 * CHỐNG DÒ MẬT KHẨU — BACKOFF LUỸ TIẾN THEO SỐ ĐIỆN THOẠI.
 *
 * ══════════ ⚠️ VÌ SAO RATE LIMIT THEO IP KHÔNG ĐỦ ══════════
 *
 * ĐO ĐƯỢC 19/8/2026: thử sai 12 lần liên tiếp, không bị chặn lần nào. Giới hạn
 * tần suất của máy chủ là 30 lượt/phút/IP và dùng CHUNG cho cả nhóm Khoan Proof,
 * nên với một số điện thoại cụ thể, kẻ tấn công thử được ~43.000 mật khẩu mỗi
 * ngày. Mật khẩu tối thiểu 6 ký tự — mà `123456` đi qua được — thì danh sách
 * mật khẩu phổ biến dò xong trong vài phút.
 *
 * Và đếm theo IP thì đổi IP là bộ đếm về 0. Đếm theo SỐ ĐIỆN THOẠI thì không.
 *
 * ══════════ ⚠️ VÌ SAO KHÔNG KHOÁ CỨNG TÀI KHOẢN ══════════
 *
 * "Sai 5 lần thì khoá 15 phút" là cách quen thuộc, và nó mở ra một cửa khác:
 * kẻ xấu biết số của bác chỉ cần gõ sai 5 lần là bác không đăng nhập được nữa,
 * lặp lại vô hạn. Với app này, người bị khoá có thể là người đang cần nó nhất.
 *
 * Backoff luỹ tiến chặn được máy dò mà không cho ai khoá được ai: bác gõ nhầm
 * hai ba lần vẫn vào bình thường, còn máy dò thì mỗi lần phải chờ tới một phút.
 *
 * ⚠️ ĐẾM CẢ SỐ CHƯA ĐĂNG KÝ. Chỉ đếm số có thật thì thời gian phản hồi khác
 * nhau giữa hai ca, và chênh lệch đó tự nó nói cho kẻ dò biết số nào đang dùng
 * Khoan Đã — đúng thứ mà mã lỗi gộp ở dưới sinh ra để giấu.
 */
const CHO_SAI = new Map();
const TRE_GIAY = [0, 0, 2, 5, 15, 30, 60];

function treBaoLau(soLanSai) {
  return TRE_GIAY[Math.min(soLanSai, TRE_GIAY.length - 1)] * 1000;
}

function kiemCho(so, bayGio) {
  const m = CHO_SAI.get(so);
  if (!m) return;
  const can = treBaoLau(m.soLanSai);
  const daCho = bayGio - m.lanCuoi;
  if (daCho < can) {
    const e = new LoiTaiKhoan('THU_LAI_SAU');
    e.giay = Math.ceil((can - daCho) / 1000);
    throw e;
  }
}

function ghiSai(so, bayGio) {
  const m = CHO_SAI.get(so) || { soLanSai: 0, lanCuoi: 0 };
  m.soLanSai += 1;
  m.lanCuoi = bayGio;
  CHO_SAI.set(so, m);
  /*
   * Dọn bản ghi cũ để Map không phình mãi. Một số bị bỏ quên nửa tiếng thì
   * coi như chưa từng sai — người dùng thật quay lại sau bữa cơm không đáng
   * phải chờ thêm.
   */
  if (CHO_SAI.size > 5000) {
    for (const [k, v] of CHO_SAI) {
      if (bayGio - v.lanCuoi > 30 * 60 * 1000) CHO_SAI.delete(k);
    }
  }
}

/**
 * Đăng nhập.
 *
 * ⚠️ MỘT MÃ LỖI DUY NHẤT CHO MỌI CA SAI. Phân biệt "số chưa đăng ký" với "sai
 * mật khẩu" là dựng sẵn một máy dò xem số nào đang dùng Khoan Đã — danh sách
 * người cao tuổi quan tâm tới lừa đảo là thứ kẻ lừa đảo rất muốn có.
 */
async function dangNhap(kho, { soDienThoai, matKhau }, bayGio = Date.now()) {
  const so = chuanHoaSo(soDienThoai);
  kiemCho(so, bayGio);
  const tro = await kho.doc(BANG_SO, so);
  const banGhi = tro ? await kho.doc(BANG, tro.id) : null;

  /*
   * ⚠️ LUÔN CHẠY HẾT MỘT LƯỢT BĂM, KỂ CẢ KHI KHÔNG CÓ TÀI KHOẢN.
   * Thoát sớm thì lượt "số không tồn tại" trả về sau ~0ms còn lượt "sai mật
   * khẩu" mất ~100ms. Chênh lệch đó tự nó là câu trả lời.
   */
  const muoi = banGhi?.muoi ?? 'muoi-gia-de-ton-dung-tung-ay-thoi-gian';
  const thu = bam(matKhau ?? '', muoi);

  if (!banGhi) { ghiSai(so, bayGio); throw new LoiTaiKhoan('SAI_SO_HOAC_MAT_KHAU'); }

  const a = Buffer.from(thu);
  const b = Buffer.from(banGhi.bam);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    ghiSai(so, bayGio);
    await kho.themAudit({ viec: 'dang_nhap_that_bai', taiKhoanId: banGhi.id, luc: bayGio });
    throw new LoiTaiKhoan('SAI_SO_HOAC_MAT_KHAU');
  }

  CHO_SAI.delete(so);          // vào được rồi thì quên hết lần sai trước
  await kho.themAudit({ viec: 'dang_nhap', taiKhoanId: banGhi.id, luc: bayGio });
  return hoSoCongKhai(banGhi);
}

/** Hồ sơ đưa ra ngoài — KHÔNG có `bam`, KHÔNG có `muoi`. */
function hoSoCongKhai(b) {
  return { id: b.id, ten: b.ten, so: b.so, vai: b.vai, taoLuc: b.taoLuc };
}

async function layHoSo(kho, id) {
  const b = await kho.doc(BANG, id);
  return b ? hoSoCongKhai(b) : null;
}

/**
 * Sửa hồ sơ.
 *
 * ⚠️ CHỈ NHẬN ĐÚNG NHỮNG TRƯỜNG LIỆT KÊ. Nhận cả object rồi trộn vào là mở
 * đường cho ai đó tự nâng `vai` của mình lên, hoặc ghi đè `bam`.
 */
async function suaHoSo(kho, id, { ten, vai }, bayGio = Date.now()) {
  const b = await kho.doc(BANG, id);
  if (!b) throw new LoiTaiKhoan('KHONG_CO_TAI_KHOAN');

  const moi = { ...b };
  if (typeof ten === 'string' && ten.trim()) moi.ten = ten.trim().slice(0, 80);
  if (vai !== undefined) {
    if (!VAI.includes(vai)) throw new LoiTaiKhoan('VAI_KHONG_HOP_LE');
    moi.vai = vai;
  }

  await kho.luu(BANG, id, moi);
  await kho.themAudit({ viec: 'sua_ho_so', taiKhoanId: id, luc: bayGio });
  return hoSoCongKhai(moi);
}

/**
 * Đổi mật khẩu — ĐÒI MẬT KHẨU CŨ.
 * Không đòi thì bất kỳ ai mượn được máy đang mở đều khoá vĩnh viễn tài khoản
 * của chủ nhà. Với người cao tuổi, chiếc máy hay nằm trong tay người khác.
 */
async function doiMatKhau(kho, id, { matKhauCu, matKhauMoi }, bayGio = Date.now()) {
  const b = await kho.doc(BANG, id);
  if (!b) throw new LoiTaiKhoan('KHONG_CO_TAI_KHOAN');
  kiemMatKhau(matKhauMoi);

  const a = Buffer.from(bam(matKhauCu ?? '', b.muoi));
  const c = Buffer.from(b.bam);
  if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) {
    throw new LoiTaiKhoan('SAI_MAT_KHAU_CU');
  }

  const muoi = crypto.randomBytes(16).toString('base64');
  await kho.luu(BANG, id, { ...b, muoi, bam: bam(matKhauMoi, muoi) });
  await kho.themAudit({ viec: 'doi_mat_khau', taiKhoanId: id, luc: bayGio });
  return true;
}

module.exports = {
  dangKy, dangNhap, layHoSo, suaHoSo, doiMatKhau,
  chuanHoaSo, soHopLe, hoSoCongKhai,
  LoiTaiKhoan, VAI, BANG, BANG_SO, HO_SO_TREN_MAY,
};
