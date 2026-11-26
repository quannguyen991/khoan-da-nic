'use strict';
/**
 * ═════════ THƯ KÝ NGHE MÁY HỘ — KHOAN ĐÃ ═════════
 *
 * - Nói rõ ngay đầu cuộc gọi đây là trợ lý tự động.
 * - Không xác nhận danh tính người gọi chỉ dựa vào lời tự giới thiệu ("tự xưng...").
 * - Không tiết lộ địa chỉ, lịch sinh hoạt, thông tin tài chính của người được bảo vệ.
 * - Tối đa 1 câu hỏi làm rõ; không nghe rõ hỏi lại tối đa 1 lần.
 * - Phân tích rủi ro đi qua `pipeline.analyze()` / `decision-engine.js` duy nhất (§4.2).
 * - Lưu kho bền vững qua `vault-store` (đã loại bỏ `hoiThoai` thô theo §6.9).
 * - Cấp và kiểm chứng phiên khách bằng chữ ký HMAC để chống giả mạo header phiên.
 */

const crypto = require('node:crypto');
const { goiChat } = require('./ai/fable-client');
const {
  LOI_CHAO_MO_DAU,
  LOI_NHAN_DU_PHONG,
  danhGiaLuotCuocGoi,
  trichTinHieuThuKy,
} = require('./thu-ky-bo-luat');

const TRANG_THAI_CUOC_GOI = new Set([
  'nguoi_quen',
  'thong_thuong',
  'khan_cap',
  'dang_ngo',
  'khong_du_thong_tin',
  'loi_he_thong',
]);

const KET_QUA_XAC_MINH = new Set(['hop_le', 'dang_ngo', 'khong_ro']);
const CHE_DO_HOP_LE = new Set(['so_la_qua_thu_ky', 'chi_ghi_loi_nhan', 'tat']);
const PHAM_VI_CHIA_SE_HOP_LE = new Set(['chi_tom_tat', 'tom_tat_va_ban_ghi']);

// Khóa HMAC riêng cho phiên khách trong tiến trình (hoặc từ biến môi trường nếu chạy đa phiên bản).
const KHOA_HMAC_THU_KY = process.env.KHOAN_DA_THU_KY_SECRET || crypto.randomBytes(32).toString('hex');

function taoTokenPhienKhach(secret = KHOA_HMAC_THU_KY) {
  const id = crypto.randomBytes(12).toString('hex');
  const sig = crypto.createHmac('sha256', secret).update(id).digest('hex').slice(0, 24);
  return `tk1.${id}.${sig}`;
}

function xacMinhTokenPhienKhach(token = '', secret = KHOA_HMAC_THU_KY) {
  const s = String(token || '').trim();
  const m = /^tk1\.([a-f0-9]{24})\.([a-f0-9]{24})$/.exec(s);
  if (!m) return null;
  const [, id, sig] = m;
  const ky = crypto.createHmac('sha256', secret).update(id).digest('hex').slice(0, 24);
  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(ky, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

function chuanHoaSo(so = '') {
  return String(so).replace(/[^0-9+]/g, '').slice(0, 20);
}

function cheSoLuuKho(so = '') {
  const s = String(so || '').trim();
  if (!s || s === 'Số lạ' || s.includes('*')) return s.slice(0, 30) || 'Số lạ';
  const chiSo = s.replace(/\D/g, '');
  if (chiSo.length < 7) return s.slice(0, 24);
  return `${chiSo.slice(0, 4)}***${chiSo.slice(-3)}`;
}

function taoStoreThuKy({ khoaPhien = 'mac_dinh', kho = null } = {}) {
  let khoHienTai = kho;
  let daTaiKho = false;
  let cauHinh = {
    batTroLy: true,
    cheDo: 'so_la_qua_thu_ky',
    nguoiHoTro: [],
    phamViChiaSe: 'chi_tom_tat',
    nhanLoiNhanQua: 'ca_hai',
    danhSachTinCay: [],
    capNhatLuc: Date.now(),
  };

  const phienDangChay = new Map();
  const danhSachCuocGoi = [];
  const doTreMs = [];

  /**
   * §6.9 — Bản ghi xuống `vault-store` KHÔNG chứa hội thoại thô, không chứa số tài khoản/số tiền chi tiết.
   */
  function lamSachMucLuuKho(muc) {
    if (!muc || typeof muc !== 'object') return null;
    const {
      hoiThoai: _boHoiThoai,
      thucThe: _boThucThe,
      soNguoiGoi,
      ...phanAnToan
    } = muc;
    return {
      ...phanAnToan,
      soNguoiGoi: cheSoLuuKho(soNguoiGoi),
    };
  }

  function luuCauHinhVaoKho() {
    if (!khoHienTai || typeof khoHienTai.luu !== 'function') return;
    void khoHienTai.luu('thu_ky_cau_hinh', khoaPhien, layCauHinh()).catch(() => {});
  }

  function luuDanhSachVaoKho() {
    if (!khoHienTai || typeof khoHienTai.luu !== 'function') return;
    const danhSachSach = danhSachCuocGoi.slice(0, 100).map(lamSachMucLuuKho).filter(Boolean);
    void khoHienTai.luu('thu_ky_cuoc_goi', khoaPhien, danhSachSach).catch(() => {});
  }

  async function taiTuKho(khoMoi) {
    if (khoMoi) khoHienTai = khoMoi;
    if (daTaiKho || !khoHienTai || typeof khoHienTai.doc !== 'function') return;
    daTaiKho = true;
    try {
      const ch = await khoHienTai.doc('thu_ky_cau_hinh', khoaPhien);
      if (ch && typeof ch === 'object') {
        capNhatCauHinhKhongLuu(ch);
      }
      const ds = await khoHienTai.doc('thu_ky_cuoc_goi', khoaPhien);
      if (Array.isArray(ds) && danhSachCuocGoi.length === 0) {
        for (const item of ds) {
          if (item && typeof item === 'object' && item.id) {
            danhSachCuocGoi.push({
              ...item,
              nhanRuiRo: item.nhanRuiRo || 'CHUA_THAY',
              thucThe: item.thucThe || { tenTuXung: null, donViTuXung: null, soTienDeCap: null, duongDanDeCap: null },
              hoiThoai: [],
            });
          }
        }
      }
    } catch {
      // §6.7: lỗi đọc kho không làm sập phiên
    }
  }

  function layCauHinh() {
    return {
      ...cauHinh,
      nguoiHoTro: cauHinh.nguoiHoTro.map((x) => ({ ...x })),
      danhSachTinCay: [...cauHinh.danhSachTinCay],
    };
  }

  function capNhatCauHinhKhongLuu(duLieu = {}) {
    if (typeof duLieu.batTroLy === 'boolean') {
      cauHinh.batTroLy = duLieu.batTroLy;
    }
    if (CHE_DO_HOP_LE.has(duLieu.cheDo)) {
      cauHinh.cheDo = duLieu.cheDo;
    }
    if (PHAM_VI_CHIA_SE_HOP_LE.has(duLieu.phamViChiaSe)) {
      cauHinh.phamViChiaSe = duLieu.phamViChiaSe;
    }
    if (['bac', 'nguoi_than', 'ca_hai'].includes(duLieu.nhanLoiNhanQua)) {
      cauHinh.nhanLoiNhanQua = duLieu.nhanLoiNhanQua;
    }
    if (Array.isArray(duLieu.nguoiHoTro)) {
      cauHinh.nguoiHoTro = duLieu.nguoiHoTro
        .slice(0, 3)
        .filter((n) => n && typeof n.ten === 'string' && n.ten.trim())
        .map((n, idx) => ({
          id: String(n.id || `ht-${idx + 1}`),
          ten: n.ten.trim().slice(0, 60),
          dienThoai: chuanHoaSo(n.dienThoai || ''),
        }));
    }
    if (Array.isArray(duLieu.danhSachTinCay)) {
      cauHinh.danhSachTinCay = duLieu.danhSachTinCay
        .map((s) => chuanHoaSo(s))
        .filter(Boolean)
        .slice(0, 50);
    }
    cauHinh.capNhatLuc = Date.now();
    return layCauHinh();
  }

  function capNhatCauHinh(duLieu = {}) {
    const kq = capNhatCauHinhKhongLuu(duLieu);
    luuCauHinhVaoKho();
    return kq;
  }

  function kiemTraLaSoTinCay(soNguoiGoi = '') {
    const chuan = chuanHoaSo(soNguoiGoi);
    if (!chuan) return false;
    return cauHinh.danhSachTinCay.includes(chuan);
  }

  function trichTinHieuLoiThoai(vanBan = '') {
    return trichTinHieuThuKy(vanBan);
  }

  async function goiAiTomTatNeuCo(lichSuText, tuyChon = {}) {
    if (tuyChon.giaLapLoiAi) {
      throw new Error('AI_SERVICE_UNAVAILABLE');
    }
    if (!tuyChon.dungAi || typeof goiChat !== 'function') {
      return null;
    }
    const prompt = [
      'Bạn là bộ hiểu tình huống cho "Thư ký nghe máy hộ" của ứng dụng Khoan Đã.',
      'Hãy đọc lời người gọi trong <loi_goi> và trả về DUY NHẤT JSON hợp lệ:',
      '{"caller_claim": "...", "purpose": "...", "summary": "..."}',
      'QUY TẮC BẮT BUỘC:',
      '- Luôn dùng từ "Người gọi tự xưng..." cho caller_claim và summary.',
      '- Không bịa dữ kiện, không khẳng định danh tính thật, không nói "an toàn".',
      '- Không tiết lộ thông tin riêng tư.',
    ].join('\n');

    const ketQua = await goiChat(
      [
        { role: 'system', content: prompt },
        { role: 'user', content: `<loi_goi>\n${lichSuText.slice(0, 1500)}\n</loi_goi>` },
      ],
      { maxTokens: 220 }
    );
    const noiDung = ketQua && typeof ketQua.noiDung === 'string' ? ketQua.noiDung.trim() : '';
    if (!noiDung) return null;
    try {
      const sach = noiDung.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(sach);
      if (parsed && typeof parsed.summary === 'string') {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  }

  function batDauCuocGoi({ soNguoiGoi = 'Số lạ', giaLap = false } = {}) {
    const id = `cg_${crypto.randomUUID().slice(0, 8)}`;
    const laTinCay = kiemTraLaSoTinCay(soNguoiGoi);

    const phien = {
      id,
      soNguoiGoi: String(soNguoiGoi || 'Số lạ').slice(0, 40),
      giaLap: Boolean(giaLap),
      batDauLuc: Date.now(),
      trangThaiPhien: laTinCay && cauHinh.cheDo === 'so_la_qua_thu_ky' ? 'chuyen_thang' : 'dang_hoat_dong',
      soLuotHoiLaiKhongRo: 0,
      daHoiLamRo: false,
      hoiThoai: [
        {
          vai: 'thu_ky',
          noiDung: laTinCay ? 'Số trong danh bạ tin cậy, kết nối trực tiếp tới chủ máy.' : LOI_CHAO_MO_DAU,
          luc: Date.now(),
        },
      ],
      trangThaiPhanLoai: laTinCay ? 'nguoi_quen' : 'khong_du_thong_tin',
      nhanRuiRo: 'CHUA_THAY',
      callerClaim: laTinCay ? 'Số đã lưu trong danh bạ tin cậy (số hiển thị chưa chứng minh tuyệt đối danh tính)' : 'Chưa rõ',
      purpose: laTinCay ? 'Cuộc gọi từ số tin cậy' : '',
      signals: [],
      urgency: 'normal',
      confidence: 'low',
      diemRuiRo: 0,
      hoKichBan: null,
      thucThe: { tenTuXung: null, donViTuXung: null, soTienDeCap: null, duongDanDeCap: null },
      giaiThichChoBac: laTinCay ? 'Số này nằm trong danh bạ tin cậy do gia đình chọn.' : 'Đang chờ người gọi trình bày lý do.',
      summary: laTinCay ? 'Số được chọn là tin cậy, cho đi thẳng theo cấu hình.' : 'Cuộc gọi mới tiếp nhận, đang chờ người gọi trình bày.',
      recommendedAction: laTinCay ? 'connect_if_enabled' : 'wait_caller',
      claimedBy: null,
      claimedAt: null,
      danhDau: null,
      latencyListMs: [],
    };

    if (phienDangChay.size >= 200) {
      const cuNhat = phienDangChay.keys().next().value;
      if (cuNhat) phienDangChay.delete(cuNhat);
    }
    phienDangChay.set(id, phien);
    if (laTinCay) {
      luuHoanTat(phien);
    }
    return dinhDangPhien(phien);
  }

  function luuHoanTat(phien) {
    const daCo = danhSachCuocGoi.findIndex((x) => x.id === phien.id);
    const banLuu = dinhDangPhien(phien, true);
    if (daCo >= 0) {
      danhSachCuocGoi[daCo] = banLuu;
    } else {
      danhSachCuocGoi.unshift(banLuu);
      if (danhSachCuocGoi.length > 100) danhSachCuocGoi.pop();
    }
    luuDanhSachVaoKho();
  }

  function dinhDangPhien(phien, apDungQuyenChiaSe = false) {
    const chiaSeDayDu = !apDungQuyenChiaSe || cauHinh.phamViChiaSe === 'tom_tat_va_ban_ghi';
    return {
      id: phien.id,
      soNguoiGoi: phien.soNguoiGoi,
      giaLap: phien.giaLap,
      batDauLuc: phien.batDauLuc,
      trangThaiPhien: phien.trangThaiPhien,
      trangThaiPhanLoai: phien.trangThaiPhanLoai,
      nhanRuiRo: phien.nhanRuiRo || 'CHUA_THAY',
      caller_claim: phien.callerClaim,
      purpose: phien.purpose,
      signals: [...phien.signals],
      urgency: phien.urgency,
      confidence: phien.confidence,
      diemRuiRo: phien.diemRuiRo || 0,
      hoKichBan: phien.hoKichBan || null,
      thucThe: phien.thucThe || { tenTuXung: null, donViTuXung: null, soTienDeCap: null, duongDanDeCap: null },
      giaiThichChoBac: phien.giaiThichChoBac || '',
      summary: phien.summary,
      recommended_action: phien.recommendedAction,
      claimedBy: phien.claimedBy,
      claimedAt: phien.claimedAt,
      danhDau: phien.danhDau,
      daHoiLamRo: phien.daHoiLamRo,
      hoiThoai: chiaSeDayDu ? phien.hoiThoai.map((x) => ({ ...x })) : [],
      doTreTrungBinhMs: phien.latencyListMs.length
        ? Math.round(phien.latencyListMs.reduce((a, b) => a + b, 0) / phien.latencyListMs.length)
        : 0,
      latencyListMs: [...phien.latencyListMs],
    };
  }

  async function xuLyLuotNguoiGoi(id, { loiNoi = '', khongNgheRo = false, tuyChon = {} } = {}) {
    const t0 = Date.now();
    const phien = phienDangChay.get(id);
    if (!phien) {
      return { error: 'NOT_FOUND' };
    }
    if (phien.trangThaiPhien === 'ket_thuc' || phien.trangThaiPhien === 'chuyen_thang') {
      return { error: 'CALL_ALREADY_ENDED', phien: dinhDangPhien(phien) };
    }

    const vanBanSach = String(loiNoi || '').trim().slice(0, 1000);
    phien.hoiThoai.push({
      vai: 'nguoi_goi',
      noiDung: khongNgheRo ? '[Không nghe rõ / ồn]' : vanBanSach || '[Im lặng]',
      luc: Date.now(),
    });

    if (khongNgheRo || vanBanSach.length < 3) {
      const kqKhongRo = danhGiaLuotCuocGoi({
        toanBoLoiNguoiGoi: '',
        daHoiLamRo: phien.daHoiLamRo,
        soLuotHoiLaiKhongRo: phien.soLuotHoiLaiKhongRo,
        khongNgheRo: true,
      });
      if (kqKhongRo.tangLuotKhongRo) phien.soLuotHoiLaiKhongRo += 1;
      phien.trangThaiPhanLoai = kqKhongRo.trangThaiPhanLoai;
      phien.nhanRuiRo = kqKhongRo.nhanRuiRo;
      phien.urgency = kqKhongRo.urgency;
      phien.confidence = kqKhongRo.confidence;
      phien.diemRuiRo = kqKhongRo.diemRuiRo;
      phien.hoKichBan = kqKhongRo.hoKichBan;
      phien.thucThe = kqKhongRo.thucThe;
      phien.giaiThichChoBac = kqKhongRo.giaiThichChoBac;
      phien.signals = kqKhongRo.signals;
      phien.callerClaim = kqKhongRo.callerClaim;
      phien.purpose = kqKhongRo.purpose;
      phien.summary = kqKhongRo.summary;
      phien.recommendedAction = kqKhongRo.recommendedAction;
      if (kqKhongRo.ketThuc) {
        phien.trangThaiPhien = 'ket_thuc';
        luuHoanTat(phien);
      }
      const latencyMs = Math.max(1, Date.now() - t0);
      phien.latencyListMs.push(latencyMs);
      doTreMs.push(latencyMs);
      phien.hoiThoai.push({ vai: 'thu_ky', noiDung: kqKhongRo.loiDap, luc: Date.now() });
      return {
        loiDap: kqKhongRo.loiDap,
        ketThuc: phien.trangThaiPhien === 'ket_thuc',
        latencyMs,
        phien: dinhDangPhien(phien),
      };
    }

    const toanBoLoiNguoiGoi = phien.hoiThoai
      .filter((l) => l.vai === 'nguoi_goi' && !l.noiDung.startsWith('['))
      .map((l) => l.noiDung)
      .join(' ');

    let aiLoi = false;
    let aiTomTat = null;
    try {
      aiTomTat = await goiAiTomTatNeuCo(toanBoLoiNguoiGoi, tuyChon);
    } catch {
      aiLoi = true;
    }

    const kq = danhGiaLuotCuocGoi({
      toanBoLoiNguoiGoi,
      daHoiLamRo: phien.daHoiLamRo,
      soLuotHoiLaiKhongRo: phien.soLuotHoiLaiKhongRo,
      khongNgheRo: false,
      aiLoi,
      aiTomTat,
    });

    if (kq.tangHoiLamRo) phien.daHoiLamRo = true;
    phien.trangThaiPhanLoai = kq.trangThaiPhanLoai;
    phien.nhanRuiRo = kq.nhanRuiRo;
    phien.urgency = kq.urgency;
    phien.confidence = kq.confidence;
    phien.diemRuiRo = kq.diemRuiRo;
    phien.hoKichBan = kq.hoKichBan;
    phien.thucThe = kq.thucThe;
    phien.giaiThichChoBac = kq.giaiThichChoBac;
    phien.signals = kq.signals;
    phien.callerClaim = kq.callerClaim;
    phien.purpose = kq.purpose;
    phien.summary = kq.summary;
    phien.recommendedAction = kq.recommendedAction;

    if (kq.ketThuc) {
      phien.trangThaiPhien = 'ket_thuc';
      luuHoanTat(phien);
    }

    const loiDap = kq.loiDap;
    const latencyMs = Math.max(1, Date.now() - t0);
    phien.latencyListMs.push(latencyMs);
    doTreMs.push(latencyMs);
    if (doTreMs.length > 500) doTreMs.shift();
    phien.hoiThoai.push({ vai: 'thu_ky', noiDung: loiDap, luc: Date.now() });

    return {
      loiDap,
      ketThuc: phien.trangThaiPhien === 'ket_thuc',
      latencyMs,
      phien: dinhDangPhien(phien),
    };
  }

  function layDanhSachCuocGoi() {
    return danhSachCuocGoi.map((x) => ({
      ...x,
      hoiThoai: cauHinh.phamViChiaSe === 'tom_tat_va_ban_ghi' ? x.hoiThoai : [],
    }));
  }

  function nhanKiemTra(id, tenNguoiKiemTra = 'Người thân') {
    let muc = danhSachCuocGoi.find((x) => x.id === id);
    const phien = phienDangChay.get(id);
    if (!muc && phien) {
      luuHoanTat(phien);
      muc = danhSachCuocGoi.find((x) => x.id === id);
    }
    if (!muc) return null;
    if (!muc.claimedBy) {
      muc.claimedBy = String(tenNguoiKiemTra || 'Người thân').trim().slice(0, 50);
      muc.claimedAt = Date.now();
    }
    if (phien && !phien.claimedBy) {
      phien.claimedBy = muc.claimedBy;
      phien.claimedAt = muc.claimedAt;
    }
    luuDanhSachVaoKho();
    return { ...muc };
  }

  function danhDauCuocGoi(id, ketQua) {
    if (!KET_QUA_XAC_MINH.has(ketQua)) return null;
    let muc = danhSachCuocGoi.find((x) => x.id === id);
    const phien = phienDangChay.get(id);
    if (!muc && phien) {
      luuHoanTat(phien);
      muc = danhSachCuocGoi.find((x) => x.id === id);
    }
    if (!muc) return null;
    muc.danhDau = ketQua;
    if (phien) phien.danhDau = ketQua;
    luuDanhSachVaoKho();
    return { ...muc };
  }

  function xoaCuocGoi(id) {
    const idx = danhSachCuocGoi.findIndex((x) => x.id === id);
    phienDangChay.delete(id);
    if (idx < 0) return false;
    danhSachCuocGoi.splice(idx, 1);
    luuDanhSachVaoKho();
    return true;
  }

  function tinhThongKeDoTre() {
    if (doTreMs.length === 0) {
      return { tongLuot: 0, medianMs: 0, p90Ms: 0, soLuotTren2000Ms: 0 };
    }
    const sapXep = [...doTreMs].sort((a, b) => a - b);
    const mid = Math.floor(sapXep.length / 2);
    const medianMs = sapXep.length % 2 === 0 ? Math.round((sapXep[mid - 1] + sapXep[mid]) / 2) : sapXep[mid];
    const p90Idx = Math.min(sapXep.length - 1, Math.floor(sapXep.length * 0.9));
    return {
      tongLuot: sapXep.length,
      medianMs,
      p90Ms: sapXep[p90Idx],
      soLuotTren2000Ms: sapXep.filter((x) => x > 2000).length,
    };
  }

  return {
    layCauHinh,
    capNhatCauHinh,
    batDauCuocGoi,
    xuLyLuotNguoiGoi,
    layDanhSachCuocGoi,
    nhanKiemTra,
    danhDauCuocGoi,
    xoaCuocGoi,
    tinhThongKeDoTre,
    trichTinHieuLoiThoai,
    taiTuKho,
  };
}

function taoQuanLyStoreThuKy(gioiHanPhien = 500, kho = null) {
  const khoTheoPhien = new Map();

  function layStore(khoaPhien = 'mac_dinh') {
    const khoa = String(khoaPhien || 'mac_dinh').slice(0, 120);
    if (khoTheoPhien.has(khoa)) {
      const cu = khoTheoPhien.get(khoa);
      khoTheoPhien.delete(khoa);
      khoTheoPhien.set(khoa, cu);
      return cu;
    }
    const moi = taoStoreThuKy({ khoaPhien: khoa, kho });
    khoTheoPhien.set(khoa, moi);
    if (khoTheoPhien.size > gioiHanPhien) {
      const dau = khoTheoPhien.keys().next().value;
      if (dau) khoTheoPhien.delete(dau);
    }
    return moi;
  }

  return { layStore, soPhien: () => khoTheoPhien.size };
}

module.exports = {
  taoStoreThuKy,
  taoQuanLyStoreThuKy,
  taoTokenPhienKhach,
  xacMinhTokenPhienKhach,
  LOI_CHAO_MO_DAU,
  LOI_NHAN_DU_PHONG,
  TRANG_THAI_CUOC_GOI,
};
