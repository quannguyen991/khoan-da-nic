'use strict';
/**
 * ═════ BÁO ĐỘNG GIA ĐÌNH — cảnh báo THẬT tới máy con ═════
 * Phần 3 "Cầu dao gia đình", 23/9/2026.
 *
 * Đo trước hôm nay: con cháu KHÔNG nhận được gì từ hệ thống. `push.js` có đủ
 * đường nhưng không ai cắm nhà cung cấp; `/api/canh-bao-nguoi-than` chỉ dựng
 * payload rồi trả về.
 *
 * Luồng: bố mẹ gặp mức CAO (và ĐÃ TỰ BẬT quy tắc ở Phần 2) → máy bố mẹ gửi MÃ
 * lên đây → máy chủ soạn câu theo ngôn ngữ của TỪNG MÁY NHẬN → Web Push tới mọi
 * máy con đã bật nhận. Con bấm → màn "đang cần con" với nút gọi. 60 giây không ai
 * phản ứng → báo lần hai.
 *
 * ⚠️ §12 — không có quy tắc thì không gửi, dù ở mức gì. Mặc định quy tắc TẮT.
 * ⚠️ §6.9 — CHỈ MÃ đi qua đây: loại sự kiện, nhãn, họ kịch bản, hành động. Hàm
 *   chỉ đọc đúng các trường khai báo; trường lạ (kể cả `vanBan`) bị bỏ.
 * ⚠️ §9.4 / §11 — trạng thái chỉ có: đã đẩy đi / không xác nhận được / chưa bật
 *   nhận / máy chủ chưa cấu hình. KHÔNG có "con đã thấy".
 * ⚠️ §6.10 — không giới hạn tần suất; chống dội bằng GỘP 30 giây theo (bố mẹ, loại).
 * ⚠️ Hẹn giờ leo thang nằm trong BỘ NHỚ: máy chủ khởi động lại là mất hẹn đang
 *   chờ. Đó là giới hạn thật, ghi trong spec §9 — đừng gọi nó là bền.
 */
const crypto = require('node:crypto');
const {
  guiCanhBao, chuanHoaDangKy, chuanHoaDangKyNative, LOAI_DANG_KY, TRANG_THAI_GUI,
} = require('./push');

/** Khoá phân biệt một máy nhận: endpoint (Web Push) hoặc token (APK/FCM). */
const khoaMay = (dk) => (dk?.loai === LOAI_DANG_KY.native ? `fcm:${dk.token}` : dk?.endpoint);
const QT = require('./quy-tac-bao');
const { TEN_HO } = require('./cong-dong-canh-giac');

const BANG_NHAN = 'push_nhan_canh_bao';
const TOI_DA_MAY = 5;
const GOP_MS = 30 * 1000;
const LEO_THANG_MS = 60 * 1000;
const GIU_SU_KIEN_MS = 24 * 60 * 60 * 1000;
/** Bảng sự kiện trong kho chung — báo động, câu hỏi "hỏi con". */
const BANG_SU_KIEN = 'gia_dinh_su_kien';
/**
 * Khởi động lại mà có báo động CHƯA AI PHẢN ỨNG: hẹn leo thang lại nếu nó chưa cũ
 * quá 10 phút. Cũ hơn thì một lời "chưa ai gọi cho bác" tới muộn là lời nhắc sai
 * thời điểm — con đọc sẽ tưởng chuyện vừa xảy ra.
 */
const KHOI_PHUC_TOI_DA_MS = 10 * 60 * 1000;
/** "Có phải con đang gọi không?" — 5 phút: đủ để con cầm máy lên, cuộc gọi kia vẫn còn. */
const HAN_HOI_MS = 5 * 60 * 1000;
const TRA_LOI_HOI = Object.freeze(['CO', 'KHONG']);

const LOAI_SU_KIEN = Object.freeze(['ket_qua_kiem', 'otp_trong_cuoc_goi', 'cai_app_trong_cuoc_goi', 'tien_ra_trong_cuoc_goi']);
const HANH_DONG = Object.freeze(['bam_goi_nguoi_than', 'toi_on', 'da_lo_chuyen', 'con_bao_lua_dao', 'con_bao_khong_sao', 've_trang_chu']);
const MA_HO = /^[a-z_]{1,60}$/;
/** Ba nhãn của hợp đồng (§HĐ) — thứ DUY NHẤT được đi kèm một báo động. */
const NHAN_HOP_LE = Object.freeze(['CAO', 'NGHI_NGO', 'CHUA_THAY']);

/** Trạng thái mà giao diện nhận được. Thêm `CHUA_BAT_NHAN` cho người chưa có máy nào đăng ký. */
const CHUA_BAT_NHAN = 'CHUA_BAT_NHAN';
const THU_HANG = [TRANG_THAI_GUI.da_day_di, TRANG_THAI_GUI.khong_xac_nhan_duoc, TRANG_THAI_GUI.chua_cau_hinh, TRANG_THAI_GUI.het_han_dang_ky];

/*
 * CHỮ — máy chủ soạn sẵn theo ngôn ngữ NGƯỜI NHẬN (sw.js không tự soạn câu, §4.1).
 * ⚠️ §11: không "an toàn", không "đã chặn", không "đã thấy", không buộc tội ai.
 */
const TEN_HO_EN = Object.freeze({
  gia_danh_cong_an: 'police impersonation',
  gia_danh_co_quan_thue: 'tax office impersonation',
  gia_danh_ngan_hang: 'bank impersonation',
  gia_danh_ho_tro_ky_thuat: 'tech support impersonation',
  gia_danh_nguoi_than: 'family impersonation',
  bao_tin_nguoi_than_gap_nan: 'fake family emergency',
  tai_khoan_nguoi_than_bi_chiem: 'hijacked family account',
  chiem_quyen_thiet_bi: 'app install / remote control',
  lua_lay_lai_tien: 'fake money recovery',
  du_dau_tu_loi_nhuan_cao: 'high-return investment',
});

const CHU = Object.freeze({
  vi: {
    tieuDe: 'Khoan Đã — {ten} đang cần con',
    ket_qua_kiem: '{ten} đang gặp tình huống nguy hiểm cao{ho}. Gọi ngay.',
    otp_trong_cuoc_goi: 'Máy {ten} vừa nhận mã OTP trong lúc đang có cuộc gọi. Gọi ngay.',
    cai_app_trong_cuoc_goi: 'Máy {ten} vừa cài ứng dụng mới trong lúc đang có cuộc gọi. Gọi ngay.',
    tien_ra_trong_cuoc_goi: 'Tiền vừa ra khỏi tài khoản của {ten} trong lúc đang có cuộc gọi. Gọi ngay.',
    leo_thang: 'Chưa ai gọi {ten}. Gọi ngay.',
    tieuDeCapNhat: 'Khoan Đã — {ten}',
    bam_goi_nguoi_than: '{ten} đã bấm gọi người thân.',
    toi_on: '{ten} bấm "Tôi ổn, không có gì nguy hiểm".',
    da_lo_chuyen: '{ten} báo đã lỡ chuyển tiền hoặc đọc mã.',
    con_bao_lua_dao: '{ten} bấm "Con bảo là lừa đảo".',
    con_bao_khong_sao: '{ten} bấm "Con bảo không sao".',
    ve_trang_chu: '{ten} đã rời màn cảnh báo.',
    tieuDeXacNhan: 'Khoan Đã — {ten} nhờ con xác nhận',
    xin_xac_nhan: '{ten} nhờ con xác nhận một khoản {viec} {khoang} cho người nhận mới. Mở để xác nhận hoặc từ chối.',
    tieuDeHoiGoi: 'Khoan Đã — {ten} hỏi con',
    hoi_goi: '{ten} đang nghe một cuộc gọi xưng là con. Có phải con đang gọi không? Mở để trả lời.',
  },
  en: {
    tieuDe: 'Khoan Đã — {ten} needs you',
    ket_qua_kiem: '{ten} is in a high-risk situation{ho}. Call now.',
    otp_trong_cuoc_goi: "{ten}'s phone just received a one-time code during a call. Call now.",
    cai_app_trong_cuoc_goi: "{ten}'s phone just installed a new app during a call. Call now.",
    tien_ra_trong_cuoc_goi: "Money just left {ten}'s account during a call. Call now.",
    leo_thang: 'No one has called {ten} yet. Call now.',
    tieuDeCapNhat: 'Khoan Đã — {ten}',
    bam_goi_nguoi_than: '{ten} tapped "call family".',
    toi_on: '{ten} tapped "I\'m fine, nothing is wrong".',
    da_lo_chuyen: '{ten} reported sending money or reading out a code.',
    con_bao_lua_dao: '{ten} tapped "They said it\'s a scam".',
    con_bao_khong_sao: '{ten} tapped "They said it\'s fine".',
    ve_trang_chu: '{ten} left the warning screen.',
    tieuDeXacNhan: 'Khoan Đã — {ten} asks you to confirm',
    xin_xac_nhan: '{ten} asks you to confirm a {viec} of {khoang} to a new recipient. Open to confirm or decline.',
    tieuDeHoiGoi: 'Khoan Đã — {ten} is asking you',
    hoi_goi: '{ten} is on a call with someone saying they are you. Is it you calling? Open to answer.',
  },
});

/* Phần 5 — nhãn cho khoảng tiền và việc (mã → chữ theo ngôn ngữ người nhận). */
const CHU_KHOANG = Object.freeze({
  vi: { duoi_5: 'dưới 5 triệu', '5_10': '5–10 triệu', '10_20': '10–20 triệu', '20_50': '20–50 triệu', tren_50: 'trên 50 triệu' },
  en: { duoi_5: 'under 5 million VND', '5_10': '5–10 million VND', '10_20': '10–20 million VND', '20_50': '20–50 million VND', tren_50: 'over 50 million VND' },
});
const CHU_VIEC = Object.freeze({
  vi: { chuyen_khoan: 'chuyển khoản', rut_tien: 'rút tiền' },
  en: { chuyen_khoan: 'transfer', rut_tien: 'cash withdrawal' },
});

class LoiBaoDong extends Error {
  constructor(ma, http = 400) { super(ma); this.name = 'LoiBaoDong'; this.ma = ma; this.http = http; }
}

const chuanLang = (l) => (l === 'en' ? 'en' : 'vi');
const dien = (mau, thay) => Object.entries(thay).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), mau);

function tenHo(ho, lang) {
  if (!ho) return '';
  const ten = lang === 'en' ? TEN_HO_EN[ho] : TEN_HO[ho];
  return ten ? ` (${lang === 'en' ? ten : ten.toLowerCase()})` : '';
}

function duongMo(suKienId) { return `/?view=guardian&canhBao=${encodeURIComponent(suKienId)}`; }

function soanCanhBao({ tenBoMe, loaiSuKien, hoKichBan, lang, suKienId }) {
  const c = CHU[lang];
  return {
    tieuDe: dien(c.tieuDe, { ten: tenBoMe }),
    noiDung: dien(c[loaiSuKien], { ten: tenBoMe, ho: tenHo(hoKichBan, lang) }),
    khan: true,
    ma: `bao-dong-${suKienId}`,
    duong: duongMo(suKienId),
    lang,
  };
}

function soanLeoThang({ tenBoMe, lang, suKienId }) {
  const c = CHU[lang];
  return { tieuDe: dien(c.tieuDe, { ten: tenBoMe }), noiDung: dien(c.leo_thang, { ten: tenBoMe }), khan: true, ma: `bao-dong-${suKienId}`, duong: duongMo(suKienId), lang };
}

function soanCapNhat({ tenBoMe, hanhDong, lang, suKienId }) {
  const c = CHU[lang];
  return { tieuDe: dien(c.tieuDeCapNhat, { ten: tenBoMe }), noiDung: dien(c[hanhDong], { ten: tenBoMe }), khan: false, ma: `cap-nhat-${suKienId}`, duong: duongMo(suKienId), lang };
}

// ─────────────────── Đăng ký nhận (máy con) ───────────────────

async function docDsNhan(kho, taiKhoanId) {
  const b = await kho.doc(BANG_NHAN, taiKhoanId);
  return Array.isArray(b?.ds) ? b.ds : [];
}

/**
 * ⚠️ HAI HÌNH DẠNG ĐĂNG KÝ — sửa 24/9/2026. Trình duyệt gửi Web Push
 * `{endpoint, keys}`; bản APK gửi `{loai:'native', token}` (token FCM). Bản trước
 * ép cả hai qua khuôn Web Push nên máy con dùng APK nhận 400 `ENDPOINT_PHAI_LA_HTTPS`
 * và KHÔNG BAO GIỜ bật được nhận báo động.
 */
async function dangKyNhan(kho, taiKhoanId, dangKyTho, lang, bayGio = Date.now()) {
  let dk;
  try {
    dk = dangKyTho?.loai === LOAI_DANG_KY.native ? chuanHoaDangKyNative(dangKyTho) : chuanHoaDangKy(dangKyTho);
  } catch (e) { throw new LoiBaoDong(e?.ma || 'DANG_KY_KHONG_HOP_LE'); }
  const ds = (await docDsNhan(kho, taiKhoanId)).filter((x) => khoaMay(x?.dangKy) !== khoaMay(dk));
  ds.push({ dangKy: dk, lang: chuanLang(lang), luc: bayGio });
  const giu = ds.slice(-TOI_DA_MAY);
  await kho.luu(BANG_NHAN, taiKhoanId, { ds: giu });
  return { daBat: true, soMay: giu.length };
}

/** `endpoint`: endpoint Web Push HOẶC token FCM của máy cần tắt. Bỏ trống = tắt mọi máy. */
async function tatNhan(kho, taiKhoanId, endpoint) {
  const ds = typeof endpoint === 'string' && endpoint
    ? (await docDsNhan(kho, taiKhoanId))
      .filter((x) => x?.dangKy?.endpoint !== endpoint && x?.dangKy?.token !== endpoint)
    : [];
  await kho.luu(BANG_NHAN, taiKhoanId, { ds });
  return { daTat: true };
}

// ─────────────────── Sự kiện ───────────────────

/**
 * ⚠️ SỰ KIỆN NẰM TRONG KHO CHUNG (Postgres trên Render) — sửa 24/9/2026.
 *
 * Bản trước là một `Map` trong RAM. Chạy thử đầu-cuối: máy chủ khởi động lại (mỗi
 * lần deploy, mỗi lần Render đánh thức máy chủ đang ngủ) là MẤT HẾT — báo động
 * đang chờ con phản ứng, câu hỏi "có phải con đang gọi?", và hẹn giờ leo thang
 * 60 giây. Con bấm vào thông báo thì nhận 404 "không có sự kiện", bác hỏi con thì
 * câu trả lời rơi vào hư không.
 *
 * Không truyền `kho` ⇒ vẫn là bộ nhớ (cho test đơn vị). MỌI hàm đều async ở cả hai
 * bản, nên lõi chỉ có MỘT cách gọi. Đổi một sự kiện xong phải `luu(ev)` — sửa đối
 * tượng trong tay không còn tự ghi xuống đâu cả.
 */
function taoKhoSuKien({ kho } = {}) {
  let co;
  if (!kho) {
    const ds = new Map();
    co = {
      async tao(ev) { ds.set(ev.id, ev); return ev; },
      async lay(id) { return ds.get(id) || null; },
      async luu(ev) { ds.set(ev.id, ev); return ev; },
      async liet() { return [...ds.values()]; },
      async xoa(id) { ds.delete(id); },
    };
  } else {
    co = {
      async tao(ev) { await kho.luu(BANG_SU_KIEN, ev.id, ev); return ev; },
      async lay(id) { return typeof id === 'string' && id ? kho.doc(BANG_SU_KIEN, id) : null; },
      async luu(ev) { await kho.luu(BANG_SU_KIEN, ev.id, ev); return ev; },
      async liet() { return kho.liet(BANG_SU_KIEN); },
      async xoa(id) { await kho.xoa(BANG_SU_KIEN, id); },
    };
  }
  /** Sự kiện cùng loại trong 30 giây gần đây (để gộp); tiện tay dọn bản quá 24 giờ. */
  co.ganDay = async (boMeId, loai, bayGio) => {
    for (const ev of await co.liet()) {
      if (bayGio - ev.luc > GIU_SU_KIEN_MS) { await co.xoa(ev.id); continue; }
      if (ev.boMeId === boMeId && ev.loaiSuKien === loai && bayGio - ev.luc < GOP_MS) return ev;
    }
    return null;
  };
  return co;
}

// ─────────────────── Lõi ───────────────────

function taoBaoDong({
  kho, khoSuKien, capGhep, layHoSo, env = process.env, guiThat, guiThatNative,
  henGio = (fn, ms) => setTimeout(fn, ms), bayGio = () => Date.now(),
}) {
  const tenCua = async (id) => (await layHoSo(kho, id))?.ten || '';

  /** Gửi cho mọi thành viên đã ghép; trả trạng thái TỐT NHẤT của mỗi người. */
  async function guiChoThanhVien(boMeId, soan) {
    const { thanhVien } = await capGhep(boMeId);
    const ketQua = [];
    for (const tv of thanhVien) {
      const ten = await tenCua(tv.id);
      const ds = await docDsNhan(kho, tv.id);
      if (ds.length === 0) { ketQua.push({ id: tv.id, ten, trangThai: CHUA_BAT_NHAN }); continue; }
      let tot = null;
      const conSong = [];
      for (const may of ds) {
        const r = await guiCanhBao({ dangKy: may.dangKy, payload: soan(chuanLang(may.lang)), env, guiThat, guiThatNative });
        if (r.trangThai !== TRANG_THAI_GUI.het_han_dang_ky) conSong.push(may);
        if (tot === null || THU_HANG.indexOf(r.trangThai) < THU_HANG.indexOf(tot)) tot = r.trangThai;
      }
      if (conSong.length !== ds.length) await kho.luu(BANG_NHAN, tv.id, { ds: conSong });
      ketQua.push({ id: tv.id, ten, trangThai: tot });
    }
    return ketQua;
  }

  async function baoDong(boMeId, vao) {
    const loaiSuKien = vao?.loaiSuKien;
    if (!LOAI_SU_KIEN.includes(loaiSuKien)) throw new LoiBaoDong('LOAI_SU_KIEN_KHONG_HOP_LE');
    /*
     * ⚠️ SỬA 24/9/2026 — `nhan` là MÃ, không phải chữ (§HĐ luật 1, §6.9). Bản trước nhận
     * MỌI chuỗi khi loại sự kiện không phải `ket_qua_kiem`, lưu lại và trả nguyên văn
     * cho máy con: chạy thử gửi `nhan: "Mã OTP 482913 chuyển vào STK 0123456789"` và máy
     * con đọc được đúng câu đó. App chỉ gửi 'CAO' hoặc bỏ trống, nhưng luật "không nội
     * dung tin nhắn rời máy bố mẹ" phải được ép ở MÁY CHỦ, không trông vào client.
     */
    const nhan = NHAN_HOP_LE.includes(vao?.nhan) ? vao.nhan : null;
    const hoKichBan = typeof vao?.hoKichBan === 'string' && MA_HO.test(vao.hoKichBan) ? vao.hoKichBan : null;
    // Quy tắc 1 là "nguy hiểm CAO" — kết quả kiểm ở mức khác không báo.
    if (loaiSuKien === 'ket_qua_kiem' && nhan !== 'CAO') return { gui: false, lyDo: 'KHONG_PHAI_MUC_CAO' };

    const quyTac = await QT.docQuyTac(kho, boMeId);
    const duocBao = loaiSuKien === 'ket_qua_kiem' ? quyTac.baoKhiCao : quyTac.baoKhiOtpTrongCuocGoi;
    if (!duocBao) return { gui: false, lyDo: 'CHUA_BAT_QUY_TAC' };

    const bayGioLuc = bayGio();
    const cu = await khoSuKien.ganDay(boMeId, loaiSuKien, bayGioLuc);
    if (cu) return { gui: false, lyDo: 'DA_GOP', suKienId: cu.id };

    const ev = await khoSuKien.tao({
      id: crypto.randomUUID(), boMeId, loaiSuKien, nhan, hoKichBan, luc: bayGioLuc,
      hanhDong: [], conDaGoi: false, daLeoThang: false,
    });
    const tenBoMe = await tenCua(boMeId);
    const ketQua = await guiChoThanhVien(boMeId, (lang) => soanCanhBao({ tenBoMe, loaiSuKien, hoKichBan, lang, suKienId: ev.id }));
    henGio(() => leoThang(ev.id), LEO_THANG_MS);
    return { gui: true, suKienId: ev.id, ketQua: ketQua.map(({ ten, trangThai }) => ({ ten, trangThai })) };
  }

  async function leoThang(suKienId) {
    const ev = await khoSuKien.lay(suKienId);
    if (!ev || ev.daLeoThang || ev.conDaGoi || ev.hanhDong.length > 0) return false;
    ev.daLeoThang = true;
    // Ghi TRƯỚC khi gửi: hẹn giờ cũ và hẹn giờ khôi phục sau khởi động có thể cùng
    // nổ — ghi trước thì lượt thứ hai thấy `daLeoThang` và dừng, con không bị báo đôi.
    await khoSuKien.luu(ev);
    const tenBoMe = await tenCua(ev.boMeId);
    await guiChoThanhVien(ev.boMeId, (lang) => soanLeoThang({ tenBoMe, lang, suKienId: ev.id }));
    return true;
  }

  async function capNhat(boMeId, suKienId, hanhDong) {
    if (!HANH_DONG.includes(hanhDong)) throw new LoiBaoDong('HANH_DONG_KHONG_HOP_LE');
    const ev = await khoSuKien.lay(suKienId);
    if (!ev) throw new LoiBaoDong('KHONG_CO_SU_KIEN', 404);
    if (ev.boMeId !== boMeId) throw new LoiBaoDong('KHONG_PHAI_CUA_BAN', 403);
    ev.hanhDong.push({ ma: hanhDong, luc: bayGio() });
    await khoSuKien.luu(ev);
    const tenBoMe = await tenCua(boMeId);
    await guiChoThanhVien(boMeId, (lang) => soanCapNhat({ tenBoMe, hanhDong, lang, suKienId: ev.id }));
    return { daGhi: true };
  }

  async function laThanhVien(taiKhoanId, boMeId) {
    const { thanhVien } = await capGhep(boMeId);
    return thanhVien.some((t) => t.id === taiKhoanId);
  }

  async function conDaGoi(taiKhoanId, suKienId) {
    const ev = await khoSuKien.lay(suKienId);
    if (!ev) throw new LoiBaoDong('KHONG_CO_SU_KIEN', 404);
    if (!(await laThanhVien(taiKhoanId, ev.boMeId))) throw new LoiBaoDong('KHONG_THUOC_VONG_TRON', 403);
    ev.conDaGoi = true;
    await khoSuKien.luu(ev);
    return { daGhi: true };
  }

  async function docSuKien(taiKhoanId, suKienId) {
    const ev = await khoSuKien.lay(suKienId);
    if (!ev) throw new LoiBaoDong('KHONG_CO_SU_KIEN', 404);
    if (taiKhoanId !== ev.boMeId && !(await laThanhVien(taiKhoanId, ev.boMeId))) {
      throw new LoiBaoDong('KHONG_THUOC_VONG_TRON', 403);
    }
    return {
      id: ev.id, loaiSuKien: ev.loaiSuKien, nhan: ev.nhan, hoKichBan: ev.hoKichBan, luc: ev.luc,
      tenBoMe: await tenCua(ev.boMeId), hanhDong: ev.hanhDong.map((h) => ({ ma: h.ma, luc: h.luc })), conDaGoi: ev.conDaGoi,
    };
  }

  /**
   * Phần 5 — bố mẹ nhờ con xác nhận một khoản chuyển (chìa khoá thứ hai). Đây là
   * việc CHÍNH bố mẹ vừa bấm, nên không cần quy tắc báo (§12 chỉ cấm tự báo thay).
   * Chỉ mã khoảng tiền + việc — không số tiền, không người nhận (§6.9).
   */
  async function baoXinXacNhan(boMeId, { yeuCauId, khoangTien, hanhDong }) {
    const tenBoMe = await tenCua(boMeId);
    const ketQua = await guiChoThanhVien(boMeId, (lang) => ({
      tieuDe: dien(CHU[lang].tieuDeXacNhan, { ten: tenBoMe }),
      noiDung: dien(CHU[lang].xin_xac_nhan, {
        ten: tenBoMe, viec: CHU_VIEC[lang][hanhDong] || '', khoang: CHU_KHOANG[lang][khoangTien] || '',
      }),
      khan: true,
      ma: `xac-nhan-${yeuCauId}`,
      duong: `/?view=guardian&xacNhan=${encodeURIComponent(yeuCauId)}`,
      lang,
    }));
    return ketQua.map(({ ten, trangThai }) => ({ ten, trangThai }));
  }

  /** Máy bố mẹ: ai trong vòng đã bật nhận cảnh báo. */
  async function tinhTrang(boMeId) {
    const { thanhVien } = await capGhep(boMeId);
    const ra = [];
    for (const tv of thanhVien) ra.push({ id: tv.id, ten: await tenCua(tv.id), coDangKy: (await docDsNhan(kho, tv.id)).length > 0 });
    return { thanhVien: ra };
  }

  /*
   * ══════ "CÓ PHẢI CON ĐANG GỌI KHÔNG?" — thêm 23/9/2026 ══════
   *
   * Bản gia đình của tính năng "Revolut có đang gọi bạn không": có người gọi xưng
   * là con (giọng có thể giả bằng AI), bác bấm một nút, máy con đổ thông báo, con
   * bấm "Con đang gọi" hoặc "Không phải con". Kiểm qua KÊNH KHÁC, không tin kênh
   * đang gọi.
   *
   * ⚠️ Bác tự bấm ⇒ không cần quy tắc báo (§12 chỉ cấm tự báo thay chủ tài khoản).
   * ⚠️ §4.3 — hết 5 phút không ai trả lời là "chưa hỏi được", KHÔNG phải "không sao".
   * ⚠️ §11 — "Con đang gọi" chỉ nói con đã bấm thế, không nói cuộc gọi an toàn.
   * ⚠️ Không gửi số người đang gọi, không nội dung cuộc gọi — máy không biết cả hai.
   */
  async function hoiCon(boMeId) {
    const luc = bayGio();
    const ev = await khoSuKien.tao({
      id: crypto.randomUUID(), boMeId, loaiSuKien: 'hoi_goi', luc, hetHan: luc + HAN_HOI_MS, traLoi: [], guiToi: [],
    });
    const tenBoMe = await tenCua(boMeId);
    const ketQua = await guiChoThanhVien(boMeId, (lang) => ({
      tieuDe: dien(CHU[lang].tieuDeHoiGoi, { ten: tenBoMe }),
      noiDung: dien(CHU[lang].hoi_goi, { ten: tenBoMe }),
      khan: true,
      ma: `hoi-goi-${ev.id}`,
      duong: `/?view=guardian&hoiGoi=${encodeURIComponent(ev.id)}`,
      lang,
    }));
    ev.guiToi = ketQua.map(({ id, ten, trangThai }) => ({ id, ten, trangThai }));
    await khoSuKien.luu(ev);
    return { hoiId: ev.id, hetHan: ev.hetHan, guiToi: ketQua.map(({ ten, trangThai }) => ({ ten, trangThai })) };
  }

  async function layHoi(hoiId) {
    const ev = await khoSuKien.lay(hoiId);
    if (!ev || ev.loaiSuKien !== 'hoi_goi') throw new LoiBaoDong('KHONG_CO_CAU_HOI', 404);
    return ev;
  }

  async function traLoiHoi(taiKhoanId, hoiId, traLoi) {
    if (!TRA_LOI_HOI.includes(traLoi)) throw new LoiBaoDong('TRA_LOI_KHONG_HOP_LE');
    const ev = await layHoi(hoiId);
    if (!(await laThanhVien(taiKhoanId, ev.boMeId))) throw new LoiBaoDong('KHONG_THUOC_VONG_TRON', 403);
    if (bayGio() > ev.hetHan) throw new LoiBaoDong('CAU_HOI_DA_HET_HAN');
    ev.traLoi = ev.traLoi.filter((x) => x.id !== taiKhoanId);
    ev.traLoi.push({ id: taiKhoanId, traLoi, luc: bayGio() });
    await khoSuKien.luu(ev);
    return { daGhi: true };
  }

  async function docHoi(taiKhoanId, hoiId) {
    const ev = await layHoi(hoiId);
    if (taiKhoanId !== ev.boMeId && !(await laThanhVien(taiKhoanId, ev.boMeId))) {
      throw new LoiBaoDong('KHONG_THUOC_VONG_TRON', 403);
    }
    const traLoi = [];
    for (const x of ev.traLoi) traLoi.push({ ten: await tenCua(x.id), traLoi: x.traLoi, luc: x.luc });
    return {
      hoiId: ev.id, tenBoMe: await tenCua(ev.boMeId), hetHan: ev.hetHan, conHan: bayGio() <= ev.hetHan,
      traLoi, guiToi: ev.guiToi.map(({ ten, trangThai }) => ({ ten, trangThai })),
    };
  }

  /** Máy CON: câu hỏi đang chờ mình trả lời (mở app mà không qua thông báo vẫn thấy). */
  async function hoiDangCho(taiKhoanId) {
    const luc = bayGio();
    const ra = [];
    for (const ev of await khoSuKien.liet()) {
      if (ev.loaiSuKien !== 'hoi_goi' || luc > ev.hetHan) continue;
      if (ev.traLoi.some((x) => x.id === taiKhoanId)) continue;
      if (!(await laThanhVien(taiKhoanId, ev.boMeId))) continue;
      ra.push({ hoiId: ev.id, tenBoMe: await tenCua(ev.boMeId), hetHan: ev.hetHan });
    }
    return { hoi: ra };
  }

  /**
   * GỌI MỘT LẦN KHI MÁY CHỦ KHỞI ĐỘNG — hẹn lại leo thang cho báo động chưa ai phản
   * ứng. Hẹn giờ là `setTimeout`, không sống qua lần khởi động lại; sự kiện thì
   * có (nằm trong kho). Chưa đủ 60 giây: hẹn phần còn lại. Quá 60 giây mà chưa
   * quá 10 phút: leo thang ngay. Cũ hơn: bỏ qua (xem `KHOI_PHUC_TOI_DA_MS`).
   * @returns {Promise<number>} số hẹn giờ đã đặt lại
   */
  async function khoiPhucHenGio() {
    const luc = bayGio();
    let soHen = 0;
    for (const ev of await khoSuKien.liet()) {
      if (!ev || ev.loaiSuKien === 'hoi_goi' || !LOAI_SU_KIEN.includes(ev.loaiSuKien)) continue;
      if (ev.daLeoThang || ev.conDaGoi || (ev.hanhDong || []).length > 0) continue;
      const tuoi = luc - ev.luc;
      if (!(tuoi >= 0) || tuoi >= KHOI_PHUC_TOI_DA_MS) continue;
      henGio(() => leoThang(ev.id), Math.max(0, LEO_THANG_MS - tuoi));
      soHen += 1;
    }
    return soHen;
  }

  return {
    baoDong, leoThang, capNhat, conDaGoi, docSuKien, tinhTrang, baoXinXacNhan,
    hoiCon, traLoiHoi, docHoi, hoiDangCho, khoiPhucHenGio,
  };
}

module.exports = {
  BANG_NHAN, LOAI_SU_KIEN, HANH_DONG, CHUA_BAT_NHAN, LoiBaoDong, CHU, HAN_HOI_MS, TRA_LOI_HOI,
  dangKyNhan, tatNhan, taoKhoSuKien, taoBaoDong, soanCanhBao,
};
