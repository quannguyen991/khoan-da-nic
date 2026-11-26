'use strict';
/**
 * ═════════ CÔNG CỤ KHỬ PII & KIỂM ĐỊNH LÁT CẮT MẪU THẬT (`eval/mau-that/`) ═════════
 *
 * §2B.6 & §6.9 & §11:
 * - TUYỆT ĐỐI KHÔNG tự tạo mẫu giả rồi gắn `nguon: "that"`.
 * - Mọi tin nhắn thật do tình nguyện viên / gia đình đóng góp PHẢI đi qua bộ khử PII
 *   tất định này trước khi ghi vào `eval/mau-that/*.jsonl` (che SĐT, CCCD, STK/thẻ,
 *   OTP, email, nhưng GIỮ NGUYÊN cấu trúc câu và tên miền đáng ngờ để bộ luật đo đúng).
 *
 * Cách dùng CLI:
 *   node scripts/khu-pii-mau-that.js --kiem-tra
 *   node scripts/khu-pii-mau-that.js --nhap duong-dan-tho.jsonl --ra eval/mau-that/01-dong-gop.jsonl
 */

const fs = require('node:fs');
const path = require('node:path');

const NHAN_HOP_LE = new Set(['CHUA_THAY', 'NGHI_NGO', 'CAO']);
const NGON_NGU_HOP_LE = new Set(['vi', 'en', 'mixed']);

/**
 * Khử PII tất định trên văn bản tin nhắn thật mà không làm hỏng tên miền hay số tiền.
 * @param {string} vanBan
 * @returns {{ vanBanDaChe: string, daChe: string[] }}
 */
function khuPiiVanBan(vanBan = '') {
  let s = String(vanBan || '');
  const daChe = new Set();

  // 1. Email cá nhân -> [EMAIL]
  s = s.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => {
    daChe.add('email');
    return '[EMAIL]';
  });

  // 2. Căn cước công dân 12 chữ số (bắt đầu bằng 001..096) -> [CCCD]
  s = s.replace(/\b0\d{11}\b/g, () => {
    daChe.add('cccd');
    return '[CCCD]';
  });

  // 3. Số điện thoại Việt Nam & quốc tế (+84 / 84 / 03|05|07|08|09...) -> [SĐT]
  // Không ăn nhầm chuỗi USSD (*21*...#) hay số tiền có đơn vị đ/triệu/k phía sau
  s = s.replace(/(?<!\*)(?:\+84|84|0)(?:3|5|7|8|9)(?:[\s.-]?\d){8}\b(?!\s*(?:đ|đồng|vnd|vnđ|k|tr|triệu))/gi, () => {
    daChe.add('sdt');
    return '[SĐT]';
  });

  // 4. Mã OTP / mã xác thực 6 chữ số đi ngay sau từ khóa OTP / mã -> [MÃ_OTP]
  s = s.replace(/(\b(?:otp|mã xác thực|mã xác nhận|mã xác minh|verification code|passcode)\b[^0-9]{0,20})\b\d{6}\b/gi, (_, tienTo) => {
    daChe.add('otp');
    return `${tienTo}[MÃ_OTP]`;
  });

  // 5. Số thẻ / số tài khoản ngân hàng dài (9–19 chữ số liền hoặc tách nhóm 4 số), không có đơn vị tiền tệ
  s = s.replace(/\b(?:\d{4}[\s-]){2,3}\d{3,4}\b(?!\s*(?:đ|đồng|vnd|vnđ))/gi, () => {
    daChe.add('stk');
    return '[STK]';
  });
  s = s.replace(/\b[1-9]\d{8,18}\b(?!\s*(?:đ|đồng|vnd|vnđ))/gi, () => {
    daChe.add('stk');
    return '[STK]';
  });

  return { vanBanDaChe: s, daChe: [...daChe] };
}

/**
 * Kiểm định một bản ghi mẫu thật theo đúng hợp đồng §2B.6.
 */
function kiemDinhBanGhiMauThat(muc, viTri = 0) {
  const loi = [];
  if (!muc || typeof muc !== 'object') return [`Dòng ${viTri}: không phải JSON object`];
  if (typeof muc.id !== 'string' || !muc.id.trim()) loi.push(`Dòng ${viTri}: thiếu id`);
  if (muc.nguon !== 'that') loi.push(`Dòng ${viTri} (${muc.id}): nguon phải là "that"`);
  if (!NHAN_HOP_LE.has(muc.muc_do)) loi.push(`Dòng ${viTri} (${muc.id}): muc_do không hợp lệ`);
  if (muc.toi_da && !NHAN_HOP_LE.has(muc.toi_da)) loi.push(`Dòng ${viTri} (${muc.id}): toi_da không hợp lệ`);
  if (!NGON_NGU_HOP_LE.has(muc.ngon_ngu)) loi.push(`Dòng ${viTri} (${muc.id}): ngon_ngu không hợp lệ`);
  if (typeof muc.noi_dung !== 'string' || muc.noi_dung.trim().length < 6) {
    loi.push(`Dòng ${viTri} (${muc.id}): noi_dung quá ngắn`);
  } else {
    const kqChe = khuPiiVanBan(muc.noi_dung);
    if (kqChe.daChe.length > 0) {
      loi.push(`Dòng ${viTri} (${muc.id}): còn sót PII chưa che (${kqChe.daChe.join(', ')})`);
    }
  }
  return loi;
}

function chuanHoaDongMauThat(mucTho, idx = 1) {
  const { vanBanDaChe, daChe } = khuPiiVanBan(mucTho.noi_dung || '');
  return {
    id: mucTho.id || `that-${String(idx).padStart(3, '0')}`,
    ho: mucTho.ho || 'chua_phan_ho',
    kenh: mucTho.kenh || 'sms',
    ngon_ngu: mucTho.ngon_ngu || 'vi',
    noi_dung: vanBanDaChe.trim(),
    muc_do: mucTho.muc_do || 'NGHI_NGO',
    toi_da: mucTho.toi_da || 'CAO',
    nguon: 'that',
    da_che_pii: true,
    loai_pii_da_che: daChe,
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const idxNhap = args.indexOf('--nhap');
  const idxRa = args.indexOf('--ra');

  if (idxNhap >= 0 && args[idxNhap + 1]) {
    const tepNhap = path.resolve(args[idxNhap + 1]);
    const tepRa = idxRa >= 0 && args[idxRa + 1]
      ? path.resolve(args[idxRa + 1])
      : path.join(__dirname, '..', 'eval', 'mau-that', '01-mau-that-da-che.jsonl');
    const dong = fs.readFileSync(tepNhap, 'utf8').split(/\r?\n/).filter((l) => l.trim());
    const ketQua = dong.map((l, i) => chuanHoaDongMauThat(JSON.parse(l), i + 1));
    const tatCaLoi = ketQua.flatMap((m, i) => kiemDinhBanGhiMauThat(m, i + 1));
    if (tatCaLoi.length > 0) {
      console.error('✖ Phát hiện lỗi kiểm định:\n' + tatCaLoi.join('\n'));
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(tepRa), { recursive: true });
    fs.writeFileSync(tepRa, ketQua.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8');
    console.log(`✔ Đã khử PII và ghi ${ketQua.length} mẫu thật vào ${tepRa}`);
  } else {
    const thuMuc = path.join(__dirname, '..', 'eval', 'mau-that');
    const dsTep = fs.existsSync(thuMuc)
      ? fs.readdirSync(thuMuc).filter((f) => f.endsWith('.jsonl'))
      : [];
    let tong = 0;
    const loi = [];
    for (const f of dsTep) {
      const lines = fs.readFileSync(path.join(thuMuc, f), 'utf8').split(/\r?\n/).filter(Boolean);
      lines.forEach((l, i) => {
        tong += 1;
        loi.push(...kiemDinhBanGhiMauThat(JSON.parse(l), i + 1));
      });
    }
    if (loi.length > 0) {
      console.error('✖ Lỗi PII / lược đồ trong eval/mau-that:\n' + loi.join('\n'));
      process.exit(1);
    }
    console.log(`✔ Kiểm tra eval/mau-that sạch PII (${tong} mẫu hiện có; sàn mục tiêu §2B.6: 25–40 mẫu thật).`);
  }
}

module.exports = {
  khuPiiVanBan,
  kiemDinhBanGhiMauThat,
  chuanHoaDongMauThat,
};
