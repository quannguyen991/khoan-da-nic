'use strict';
/**
 * PHÂN TÍCH CHUỖI MÃ QR / VIETQR (EMVCo TLV + CRC-16/CCITT) TRONG PIPELINE CHÍNH.
 *
 * - 100% tất định, không gọi mạng (§6.8).
 * - Chỉ phát tín hiệu chuẩn trong `signal-registry.js` và khai `khongDocDuoc` khi mã
 *   VietQR thiếu hoặc sai CRC Tag 63 (§4.2, §4.3).
 */

const { boDau } = require('./context-builder');

const RE_CHUOI_EMV = /\b000201[0-9A-Za-z\s._/-]{16,600}/g;
const RE_SCHEME_NGUY_HIEM = /\b(?:javascript|vbscript|intent|itms-services):[^\s]+/i;

function tinhCrc16Ccitt(bytes) {
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= (bytes[i] ?? 0) << 8;
    for (let b = 0; b < 8; b += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function docTLV(chuoi) {
  const kq = Object.create(null);
  const buf = Buffer.from(String(chuoi || ''), 'utf8');
  let i = 0;
  while (i + 4 <= buf.length) {
    const tag = buf.subarray(i, i + 2).toString('utf8');
    const lenStr = buf.subarray(i + 2, i + 4).toString('utf8');
    if (!/^\d{2}$/.test(lenStr)) break;
    const len = Number.parseInt(lenStr, 10);
    if (!Number.isFinite(len) || len < 0 || i + 4 + len > buf.length) break;
    kq[tag] = buf.subarray(i + 4, i + 4 + len).toString('utf8');
    i += 4 + len;
  }
  return kq;
}

function kiemTraTag63Crc(chuoi) {
  const idx = chuoi.lastIndexOf('6304');
  if (idx < 0 || idx + 8 !== chuoi.length) return null;
  const crcTrongMa = chuoi.slice(idx + 4).toUpperCase();
  if (!/^[0-9A-F]{4}$/.test(crcTrongMa)) return false;
  const payloadBytes = Buffer.from(chuoi.slice(0, idx + 4), 'utf8');
  return tinhCrc16Ccitt(payloadBytes) === crcTrongMa;
}

/**
 * Phân tích mọi chuỗi VietQR hoặc URI nguy hiểm trong văn bản/QR đầu vào.
 * @returns {{ signals: Array<object>, qrKhongToanVen: boolean }}
 */
function phanTichChuoiQr(vanBan = '') {
  const text = String(vanBan || '').slice(0, 6000).trim();
  if (!text) return { signals: [], qrKhongToanVen: false };

  const ra = new Map();
  let qrKhongToanVen = false;

  const them = (id, quote) => {
    if (!ra.has(id)) {
      const trich = String(quote || id).slice(0, 80);
      ra.set(id, {
        id,
        state: 'present',
        source: 'deterministic',
        confidence: 1.0,
        evidence: [{ quote: trich, start: 0, end: trich.length, sourceId: 'qr' }],
      });
    }
  };

  const khopScheme = text.match(RE_SCHEME_NGUY_HIEM);
  if (khopScheme) {
    them('WEB_NONOFFICIAL_APP_SOURCE', khopScheme[0]);
    if (/^intent:/i.test(khopScheme[0]) || /\.apk/i.test(khopScheme[0])) {
      them('DEV_INSTALL_APK_UNKNOWN', khopScheme[0]);
    }
  }

  RE_CHUOI_EMV.lastIndex = 0;
  const dsEmv = text.match(RE_CHUOI_EMV) || [];
  for (const raw of dsEmv) {
    const chuoi = raw.trim();
    const crcHopLe = kiemTraTag63Crc(chuoi);
    const goc = docTLV(chuoi);
    const tag62 = goc['62'] ? docTLV(goc['62']) : {};
    const noiDung = tag62['08'] ? tag62['08'].trim() : '';
    const soTien = goc['54'] ? Number.parseFloat(goc['54']) : NaN;

    // §4.3 — thiếu Tag 63 hoặc sai CRC là chưa kiểm chứng được tính toàn vẹn mã QR
    if (crcHopLe === null || crcHopLe === false) {
      qrKhongToanVen = true;
    }
    if (crcHopLe === false) {
      them('WEB_QR_TO_LOGIN_PAYMENT', 'CRC_TAG63_MISMATCH');
      them('FIN_TRANSFER_MEMO_MISMATCH', 'CRC_TAG63_MISMATCH');
    }

    if (Number.isFinite(soTien) && soTien > 0) {
      them('WEB_QR_TO_LOGIN_PAYMENT', `VIETQR_AMOUNT:${Math.round(soTien)}`);
    }

    if (noiDung) {
      const kd = boDau(noiDung).toLowerCase();
      if (/\b(tam giu|tai khoan an toan|bao lanh|chung minh vo toi)\b/.test(kd)) {
        them('FIN_SAFE_ACCOUNT', noiDung);
        them('FIN_TRANSFER_REQUEST', noiDung);
        them('WEB_QR_TO_LOGIN_PAYMENT', noiDung);
      }
      if (/\b(phat nguoi|vi pham giao thong|khoi to|toa an|lenh bat)\b/.test(kd)) {
        them('ID_AUTHORITY_IMPERSONATION', noiDung);
        them('MAN_FEAR_THREAT', noiDung);
        them('FIN_TRANSFER_REQUEST', noiDung);
        them('WEB_QR_TO_LOGIN_PAYMENT', noiDung);
      }
      if (/\b(phi ho so|thu hoi von|tien coc|giai ngan|nang han muc|mo khoa)\b/.test(kd)) {
        them('FIN_RECOVERY_FEE', noiDung);
        them('OFF_ADVANCE_FEE', noiDung);
        them('FIN_TRANSFER_REQUEST', noiDung);
        them('WEB_QR_TO_LOGIN_PAYMENT', noiDung);
      }
    }
  }

  return { signals: [...ra.values()], qrKhongToanVen };
}

module.exports = {
  phanTichChuoiQr,
  tinhCrc16Ccitt,
  kiemTraTag63Crc,
  docTLV,
};
