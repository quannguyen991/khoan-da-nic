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
const { guiCanhBao, chuanHoaDangKy, TRANG_THAI_GUI } = require('./push');
const QT = require('./quy-tac-bao');
const { TEN_HO } = require('./cong-dong-canh-giac');

const BANG_NHAN = 'push_nhan_canh_bao';
const TOI_DA_MAY = 5;
const GOP_MS = 30 * 1000;
const LEO_THANG_MS = 60 * 1000;
const GIU_SU_KIEN_MS = 24 * 60 * 60 * 1000;

const LOAI_SU_KIEN = Object.freeze(['ket_qua_kiem', 'otp_trong_cuoc_goi', 'cai_app_trong_cuoc_goi']);
const HANH_DONG = Object.freeze(['bam_goi_nguoi_than', 'toi_on', 'da_lo_chuyen', 'con_bao_lua_dao', 'con_bao_khong_sao', 've_trang_chu']);
const MA_HO = /^[a-z_]{1,60}$/;

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
  },
  en: {
    tieuDe: 'Khoan Đã — {ten} needs you',
    ket_qua_kiem: '{ten} is in a high-risk situation{ho}. Call now.',
    otp_trong_cuoc_goi: "{ten}'s phone just received a one-time code during a call. Call now.",
    cai_app_trong_cuoc_goi: "{ten}'s phone just installed a new app during a call. Call now.",
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

async function dangKyNhan(kho, taiKhoanId, dangKyTho, lang, bayGio = Date.now()) {
  let dk;
  try { dk = chuanHoaDangKy(dangKyTho); } catch (e) { throw new LoiBaoDong(e?.ma || 'DANG_KY_KHONG_HOP_LE'); }
  const ds = (await docDsNhan(kho, taiKhoanId)).filter((x) => x?.dangKy?.endpoint !== dk.endpoint);
  ds.push({ dangKy: dk, lang: chuanLang(lang), luc: bayGio });
  const giu = ds.slice(-TOI_DA_MAY);
  await kho.luu(BANG_NHAN, taiKhoanId, { ds: giu });
  return { daBat: true, soMay: giu.length };
}

async function tatNhan(kho, taiKhoanId, endpoint) {
  const ds = typeof endpoint === 'string' && endpoint
    ? (await docDsNhan(kho, taiKhoanId)).filter((x) => x?.dangKy?.endpoint !== endpoint)
    : [];
  await kho.luu(BANG_NHAN, taiKhoanId, { ds });
  return { daTat: true };
}

// ─────────────────── Sự kiện (bộ nhớ) ───────────────────

function taoKhoSuKien() {
  const ds = new Map();
  return {
    tao(ev) { ds.set(ev.id, ev); return ev; },
    lay(id) { return ds.get(id) || null; },
    ganDay(boMeId, loai, bayGio) {
      for (const [id, ev] of ds) {
        if (bayGio - ev.luc > GIU_SU_KIEN_MS) { ds.delete(id); continue; }
        if (ev.boMeId === boMeId && ev.loaiSuKien === loai && bayGio - ev.luc < GOP_MS) return ev;
      }
      return null;
    },
  };
}

// ─────────────────── Lõi ───────────────────

function taoBaoDong({
  kho, khoSuKien, capGhep, layHoSo, env = process.env, guiThat,
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
        const r = await guiCanhBao({ dangKy: may.dangKy, payload: soan(chuanLang(may.lang)), env, guiThat });
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
    const nhan = typeof vao?.nhan === 'string' ? vao.nhan : null;
    const hoKichBan = typeof vao?.hoKichBan === 'string' && MA_HO.test(vao.hoKichBan) ? vao.hoKichBan : null;
    // Quy tắc 1 là "nguy hiểm CAO" — kết quả kiểm ở mức khác không báo.
    if (loaiSuKien === 'ket_qua_kiem' && nhan !== 'CAO') return { gui: false, lyDo: 'KHONG_PHAI_MUC_CAO' };

    const quyTac = await QT.docQuyTac(kho, boMeId);
    const duocBao = loaiSuKien === 'ket_qua_kiem' ? quyTac.baoKhiCao : quyTac.baoKhiOtpTrongCuocGoi;
    if (!duocBao) return { gui: false, lyDo: 'CHUA_BAT_QUY_TAC' };

    const bayGioLuc = bayGio();
    const cu = khoSuKien.ganDay(boMeId, loaiSuKien, bayGioLuc);
    if (cu) return { gui: false, lyDo: 'DA_GOP', suKienId: cu.id };

    const ev = khoSuKien.tao({
      id: crypto.randomUUID(), boMeId, loaiSuKien, nhan, hoKichBan, luc: bayGioLuc,
      hanhDong: [], conDaGoi: false, daLeoThang: false,
    });
    const tenBoMe = await tenCua(boMeId);
    const ketQua = await guiChoThanhVien(boMeId, (lang) => soanCanhBao({ tenBoMe, loaiSuKien, hoKichBan, lang, suKienId: ev.id }));
    henGio(() => leoThang(ev.id), LEO_THANG_MS);
    return { gui: true, suKienId: ev.id, ketQua: ketQua.map(({ ten, trangThai }) => ({ ten, trangThai })) };
  }

  async function leoThang(suKienId) {
    const ev = khoSuKien.lay(suKienId);
    if (!ev || ev.daLeoThang || ev.conDaGoi || ev.hanhDong.length > 0) return false;
    ev.daLeoThang = true;
    const tenBoMe = await tenCua(ev.boMeId);
    await guiChoThanhVien(ev.boMeId, (lang) => soanLeoThang({ tenBoMe, lang, suKienId: ev.id }));
    return true;
  }

  async function capNhat(boMeId, suKienId, hanhDong) {
    if (!HANH_DONG.includes(hanhDong)) throw new LoiBaoDong('HANH_DONG_KHONG_HOP_LE');
    const ev = khoSuKien.lay(suKienId);
    if (!ev) throw new LoiBaoDong('KHONG_CO_SU_KIEN', 404);
    if (ev.boMeId !== boMeId) throw new LoiBaoDong('KHONG_PHAI_CUA_BAN', 403);
    ev.hanhDong.push({ ma: hanhDong, luc: bayGio() });
    const tenBoMe = await tenCua(boMeId);
    await guiChoThanhVien(boMeId, (lang) => soanCapNhat({ tenBoMe, hanhDong, lang, suKienId: ev.id }));
    return { daGhi: true };
  }

  async function laThanhVien(taiKhoanId, boMeId) {
    const { thanhVien } = await capGhep(boMeId);
    return thanhVien.some((t) => t.id === taiKhoanId);
  }

  async function conDaGoi(taiKhoanId, suKienId) {
    const ev = khoSuKien.lay(suKienId);
    if (!ev) throw new LoiBaoDong('KHONG_CO_SU_KIEN', 404);
    if (!(await laThanhVien(taiKhoanId, ev.boMeId))) throw new LoiBaoDong('KHONG_THUOC_VONG_TRON', 403);
    ev.conDaGoi = true;
    return { daGhi: true };
  }

  async function docSuKien(taiKhoanId, suKienId) {
    const ev = khoSuKien.lay(suKienId);
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

  return { baoDong, leoThang, capNhat, conDaGoi, docSuKien, tinhTrang, baoXinXacNhan };
}

module.exports = {
  BANG_NHAN, LOAI_SU_KIEN, HANH_DONG, CHUA_BAT_NHAN, LoiBaoDong, CHU,
  dangKyNhan, tatNhan, taoKhoSuKien, taoBaoDong, soanCanhBao,
};
