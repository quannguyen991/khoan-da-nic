'use strict';
/**
 * §6.11 — TRÍCH THỰC THỂ CHO BỘ NHỚ VỤ VIỆC.
 *
 * "Trích thực thể mỗi đầu vào: số điện thoại · tổ chức bị giả danh · tên miền ·
 * app được yêu cầu cài · số tài khoản nhận · số tiền · hành động được yêu cầu."
 *
 * HÀM THUẦN, XÁC ĐỊNH. §6.11: việc ghép hồ sơ "KHÔNG DO AI QUYẾT ĐỊNH".
 * Không mạng, không AI, không đồng hồ.
 */

const { trichUrl, layRegistrableDomain } = require('./url-analyzer');

// ⚠️ Số Việt Nam: 10 chữ số bắt đầu bằng 0, hoặc +84. Không bắt số tài khoản
// (12–16 chữ số) vào đây — hai loại thực thể khác nhau, gộp là ghép hồ sơ sai.
const RE_DIEN_THOAI = /(?:\+84|0)(?:\d[ .-]?){8,9}\d/g;
const RE_SO_TAI_KHOAN = /\b\d{9,19}\b/g;
const RE_TIEN = /\b\d{1,3}(?:[.,]\d{3})+\s*(?:đ|vnd|đồng)?\b|\b\d+\s*(?:triệu|tỷ|nghìn|k)\b|\$\s?\d[\d,.]*/gi;

const APP_DIEU_KHIEN = [
  'anydesk', 'teamviewer', 'ultraviewer', 'quicksupport', 'airdroid',
  'rustdesk', 'supremo', 'splashtop',
];

const TO_CHUC = [
  ['cong_an', /công an|cảnh sát|điều tra viên|bộ công an|c06/i],
  ['vien_kiem_sat', /viện kiểm sát/i],
  ['toa_an', /toà án|tòa án/i],
  ['co_quan_thue', /(chi cục|cơ quan|cục)\s+thuế/i],
  ['bao_hiem_xa_hoi', /bảo hiểm xã hội/i],
  ['ngan_hang', /vietcombank|bidv|vietinbank|techcombank|agribank|ngân hàng/i],
  ['dich_vu_cong', /dịch vụ công/i],
  ['khoan_da', /khoan đã/i],
];

const HANH_DONG = [
  // "chuyển 50 triệu vào số tài khoản" — số tiền chen giữa động từ và bổ ngữ,
  // nên không thể đòi hai từ đứng cạnh nhau.
  ['chuyen_tien', /chuyển\s+(tiền|khoản)|chuyển[^.]{0,26}(tài khoản|triệu|đồng|tiền)|transfer|wire/i],
  ['doc_otp', /mã otp|\botp\b|mã xác thực/i],
  // "cài AnyDesk" — tên app đứng ngay sau động từ, không có chữ "app" nào cả.
  ['cai_app', /(cài|tải)\s+(app|ứng dụng|phần mềm|[a-z][a-z0-9]{2,})|install/i],
  ['chia_se_man_hinh', /chia sẻ màn hình|screen ?shar/i],
  ['dang_nhap_ngan_hang', /đăng nhập.{0,20}ngân hàng|log ?in.{0,20}bank/i],
  ['nhan_tien_mat', /tiền mặt|cash/i],
  ['dong_phi', /đóng phí|nộp phí|\bfee\b/i],
];

const chuanSo = (s) => s.replace(/[^\d+]/g, '');

/**
 * @param {string} vanBan
 * @returns {{dienThoai:string[], toChuc:string[], tenMien:string[], app:string[],
 *            soTaiKhoan:string[], soTien:string[], hanhDong:string[]}}
 */
function trichThucThe(vanBan = '') {
  const t = String(vanBan);
  const thap = t.toLowerCase();

  const dienThoai = [...new Set((t.match(RE_DIEN_THOAI) || []).map(chuanSo))]
    .filter((s) => s.replace('+', '').length >= 9 && s.replace('+', '').length <= 12);

  // Số tài khoản: loại bỏ những chuỗi đã được nhận là số điện thoại.
  const dtTho = new Set(dienThoai);
  const soTaiKhoan = [...new Set((t.match(RE_SO_TAI_KHOAN) || []).map(chuanSo))]
    .filter((s) => s.length >= 9 && !dtTho.has(s) && !dtTho.has(`0${s}`));

  const tenMien = [...new Set(trichUrl(t).map((u) => {
    try { return layRegistrableDomain(new URL(u).hostname); } catch { return null; }
  }).filter(Boolean))];

  return {
    dienThoai,
    soTaiKhoan,
    tenMien,
    app: APP_DIEU_KHIEN.filter((a) => thap.includes(a)),
    toChuc: TO_CHUC.filter(([, re]) => re.test(t)).map(([ma]) => ma),
    soTien: [...new Set((t.match(RE_TIEN) || []).map((s) => s.trim().toLowerCase()))],
    hanhDong: HANH_DONG.filter(([, re]) => re.test(t)).map(([ma]) => ma),
  };
}

/**
 * §6.11 — "trùng ít nhất MỘT thực thể".
 * ⚠️ `soTien` và `hanhDong` KHÔNG dùng để ghép hồ sơ: hai vụ khác nhau rất dễ
 * cùng nhắc "5 triệu" hoặc cùng đòi chuyển tiền. Ghép theo chúng là gộp nhầm.
 */
const TRUONG_GHEP = ['dienThoai', 'soTaiKhoan', 'tenMien', 'app', 'toChuc'];

function thucTheTrung(a, b) {
  const trung = [];
  for (const truong of TRUONG_GHEP) {
    for (const v of a[truong] || []) {
      if ((b[truong] || []).includes(v)) trung.push({ truong, giaTri: v });
    }
  }
  return trung;
}

module.exports = { trichThucThe, thucTheTrung, TRUONG_GHEP, APP_DIEU_KHIEN };
