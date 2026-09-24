'use strict';
/**
 * §2B.6 — MẪU THẬT (`nguon: "that"`): tin nhắn lừa đảo có người nhận thật.
 *
 * Đây là loại mẫu DUY NHẤT nói được app có bắt được lừa đảo ngoài đời hay
 * không — và cũng là loại mẫu DUY NHẤT có thể làm lộ danh tính một người thật.
 * Repo này công khai trên GitHub, nên:
 *
 *   - số điện thoại, số tài khoản, CCCD, email ⇒ LỖI, bộ đo TỪ CHỐI chạy;
 *   - liên kết còn bấm được (http://, www.) ⇒ LỖI — để link lừa đảo đang sống
 *     trong repo công khai là phát tán nó;
 *   - họ tên đầy đủ ⇒ CẢNH BÁO (tên đường "Lê Văn Lương" cũng khớp mẫu này),
 *     người duyệt phải tự nhìn;
 *   - thiếu `nguoi_duyet` / `ngay_nhan` / `dong_y: true` ⇒ LỖI. Giống số ngân
 *     hàng (scripts/duyet-so-ngan-hang.js): AI không tự tạo mẫu thật, phải có
 *     một NGƯỜI có tên đứng ra xác nhận đã che thông tin và người nhận đồng ý.
 *
 * Luật này chạy ở `napDataset()` cho MỌI mẫu `nguon: "that"`, ở bất kỳ thư mục
 * nào — không chỉ ở `eval/mau-that/` — để không có đường vòng.
 */

const SO_TIEN = /^\d{1,3}([.,]\d{3})+$/;
const CHUOI_SO = /\+?\d(?:[\s.-]?\d){7,}/g;
const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+\.[\p{L}.]{2,}/u;
const LIEN_KET_SONG = /\bhttps?:\/\/|\bwww\.[a-z0-9-]/i;
const HO_VIET = 'Nguyễn|Trần|Lê|Phạm|Hoàng|Huỳnh|Phan|Vũ|Võ|Đặng|Bùi|Đỗ|Hồ|Ngô|Dương|Lý|Đinh|Trương|Mai|Lương|Cao|Tạ|Đoàn|Vương|Trịnh';
// Họ + ≥ 2 chữ viết hoa, chữ cuối dài hơn 1 ký tự ("Nguyễn Văn A" là tên đã che).
const HO_TEN = new RegExp(`(?<![\\p{L}])(${HO_VIET})(\\s+\\p{Lu}\\p{Ll}*){1,2}\\s+\\p{Lu}\\p{Ll}+`, 'u');
const NGAY = /^\d{4}-\d{2}(-\d{2})?$/;

/**
 * @returns {{ loi: string[], canhBao: string[] }}
 */
function kiemMauThat(o) {
  const loi = [];
  const canhBao = [];
  const nd = String(o.noi_dung || '');

  for (const m of nd.match(CHUOI_SO) || []) {
    const t = m.trim();
    if (SO_TIEN.test(t)) continue;               // 50.000.000 là số tiền, không phải danh tính
    const chiSo = t.replace(/\D/g, '');
    if (chiSo.length >= 8) loi.push(`còn chuỗi số giống SĐT/số tài khoản/CCCD: "${t}" — thay bằng [số đã che]`);
  }
  if (EMAIL.test(nd)) loi.push('còn địa chỉ email — thay bằng [email đã che]');
  if (LIEN_KET_SONG.test(nd)) loi.push('còn liên kết bấm được — thay bằng [liên kết đã ẩn] hoặc viết hxxp / ten[.]vn');
  const ten = nd.match(HO_TEN);
  if (ten) canhBao.push(`có thể là họ tên thật: "${ten[0]}" — nếu đúng, đổi thành "${ten[1]} Văn A"`);

  if (typeof o.nguoi_duyet !== 'string' || o.nguoi_duyet.trim().length < 2) {
    loi.push('thiếu "nguoi_duyet" — tên NGƯỜI đã đọc lại và xác nhận đã che thông tin');
  }
  if (!NGAY.test(String(o.ngay_nhan || ''))) loi.push('thiếu "ngay_nhan" dạng YYYY-MM hoặc YYYY-MM-DD');
  if (o.dong_y !== true) loi.push('thiếu "dong_y": true — người nhận tin đồng ý cho dùng');

  return { loi, canhBao };
}

module.exports = { kiemMauThat };
