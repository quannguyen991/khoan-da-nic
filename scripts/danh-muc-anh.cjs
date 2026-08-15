'use strict';
/**
 * DANH MỤC ẢNH SINH RA — §7.4.
 *
 * ⚠️ RÀNG BUỘC CHO MỌI MỤC TRONG FILE NÀY:
 *  - **Icon là icon, KHÔNG chứa chữ.** Model rất hay tự thêm nhãn chữ; mọi lời
 *    nhắc dưới đây đều kết bằng câu cấm chữ. Chữ trong ảnh ⇒ nút A/A+/A++ không
 *    phóng được (§7.6 — lỗi này đã quay lại BA lần).
 *  - Ảnh ở đây là **minh hoạ**, không bao giờ gánh nghĩa một mình. Mọi nhãn người
 *    dùng đọc là chữ thật trong HTML.
 *  - Nền trong suốt, vì nền ứng dụng là dải tím loang (§2B.4).
 *
 * ⚠️ ICON ĐIỀU HƯỚNG **KHÔNG** NẰM Ở ĐÂY. Thanh nav hiển thị ở 28px; §7.4 đòi
 * đọc được ở 24px và tương phản viền ≥3:1. Ảnh raster 3D bóng loáng không đạt
 * hai ngưỡng đó — nav dùng SVG nội tuyến trong `index.html`.
 */

/** Giữ giọng thị giác đồng nhất giữa 22 ảnh. */
const PHONG_CACH = [
  'glossy 3D claymation toy render, soft studio lighting, gentle shadows,',
  'thick rounded chunky forms with no thin details, friendly and warm,',
  'lavender purple and violet palette, bright fresh green accents,',
  'centered, isolated on a fully transparent background,',
].join(' ');

/** Câu cấm chữ — nối vào CUỐI mọi lời nhắc. Đừng bỏ. */
const CAM_CHU =
  'Absolutely no text, no letters, no words, no numbers, no labels, no captions, '
  + 'no watermark, no signature, no UI chrome anywhere in the image.';

/**
 * `khoRong` = cạnh dài của bản .webp giao cho trình duyệt.
 * Linh vật hiển thị tối đa ~18rem ⇒ 640px phủ được màn 2x.
 * Nhãn dán hiển thị 48–72px ⇒ 256px phủ được màn 3x.
 */
const DANH_MUC = [
  // ── LINH VẬT ──────────────────────────────────────────────────────────────
  // §7.5: linh vật CHỈ ở học hỏi, mẹo, onboarding, trang chủ.
  // CẤM ở #khan-cap và #duoc-bao-ve — hai màn đó phải trống, chỉ còn việc cần làm.
  {
    id: 'linh-vat-chao',
    khoRong: 640,
    dung: 'trang chủ (#trang-chu)',
    prompt: 'A single soft lavender-purple rounded blob character mascot, two small bright '
      + 'green leaves sprouting from the top of its head, large friendly dark eyes, soft pink '
      + 'blush cheeks, open happy smile, short stubby arms relaxed at its sides, standing '
      + 'upright on two small feet, seen from the front.',
  },
  {
    id: 'linh-vat-canh-bao',
    khoRong: 640,
    dung: 'kết quả rủi ro cao (#canh-bao, #chuyen-khoan)',
    prompt: 'A single soft lavender-purple rounded blob character mascot, two small bright '
      + 'green leaves sprouting from the top of its head, large worried eyes with raised '
      + 'eyebrows, soft pink blush cheeks, small open mouth in a gasp, one stubby arm raised '
      + 'forward palm-out in a clear STOP gesture, the other arm holding up a bright red '
      + 'rounded shield bearing a bold white exclamation mark symbol, standing upright.',
  },
  {
    id: 'linh-vat-an-tam',
    khoRong: 640,
    dung: 'kiểm tra link an toàn (#kiem-tra-lien-ket)',
    prompt: 'A single soft lavender-purple rounded blob character mascot, two small bright '
      + 'green leaves sprouting from the top of its head, large happy eyes, soft pink blush '
      + 'cheeks, cheerful open smile, hugging a large violet-purple rounded shield that has a '
      + 'simple white leaf shape on its face, standing upright.',
  },
  {
    id: 'linh-vat-ngoi-cho',
    khoRong: 640,
    dung: 'dừng 60 giây (PAUSE_60S)',
    prompt: 'A single soft lavender-purple rounded blob character mascot, two small bright '
      + 'green leaves sprouting from the top of its head, large calm gentle eyes, soft pink '
      + 'blush cheeks, small serene smile, sitting down cross-legged in a relaxed patient '
      + 'waiting pose with its stubby arms folded softly over its belly.',
  },

  // ── THƯƠNG HIỆU ───────────────────────────────────────────────────────────
  {
    id: 'khien-la',
    khoRong: 256,
    dung: 'logo ở đầu trang',
    prompt: 'A single violet-purple rounded shield emblem with a soft silver-white rim, and a '
      + 'simple clean white leaf shape centered on its face. Nothing else.',
  },

  // ── NHÃN DÁN KIỂM TRA NHANH (trang chủ) ───────────────────────────────────
  {
    id: 'st-dien-thoai',
    khoRong: 256,
    dung: 'ô "Số điện thoại"',
    prompt: 'A chunky purple telephone handset icon shape, with a small bright green circular '
      + 'badge holding a white checkmark tucked at its lower right.',
  },
  {
    id: 'st-lien-ket',
    khoRong: 256,
    dung: 'ô "Link"',
    prompt: 'Two interlocking chunky purple chain links forming a chain, with a small bright '
      + 'green circular badge holding a white checkmark tucked at the lower right.',
  },
  {
    id: 'st-ma-qr',
    khoRong: 256,
    dung: 'ô "Mã QR"',
    prompt: 'A chunky purple QR-code square tile with thick rounded corner brackets and a '
      + 'simple blocky pattern, with a small bright green circular badge holding a white '
      + 'checkmark tucked at the lower right.',
  },

  // ── NHÃN DÁN DẤU HIỆU RỦI RO ──────────────────────────────────────────────
  {
    id: 'st-khien-do',
    khoRong: 256,
    dung: 'biểu tượng cạnh nhãn "Nguy hiểm cao"',
    prompt: 'A single bright red rounded shield with a soft glossy surface and a bold white '
      + 'exclamation mark symbol centered on its face.',
  },
  {
    id: 'st-tam-giac-do',
    khoRong: 256,
    dung: 'biểu tượng cảnh báo phụ',
    prompt: 'A single bright red rounded-corner warning triangle with a soft glossy surface '
      + 'and a bold white exclamation mark symbol centered on its face.',
  },
  {
    id: 'st-qua-tang',
    khoRong: 256,
    dung: 'dấu hiệu "Hứa quà bất thường"',
    prompt: 'A small glossy gift box with a soft pink-red body and a lighter ribbon and bow '
      + 'wrapped around it.',
  },
  {
    id: 'st-o-khoa-do',
    khoRong: 256,
    dung: 'dấu hiệu "Có thể đánh cắp mật khẩu"',
    prompt: 'A chunky red padlock with a rounded body and a thick shackle, with a small red '
      + 'circular badge holding a white exclamation mark tucked at its lower right.',
  },
  {
    id: 'st-qua-cau-do',
    khoRong: 256,
    dung: 'dấu hiệu "Tên miền giả mạo"',
    prompt: 'A chunky red globe sphere with simple thick meridian and equator bands, with a '
      + 'small red circular badge holding a white exclamation mark tucked at its lower right.',
  },
  {
    id: 'st-hoan-tien-do',
    khoRong: 256,
    dung: 'dấu hiệu "Hứa hoàn tiền"',
    prompt: 'A red rounded-corner warning triangle with two thick white circular arrows '
      + 'chasing each other in a refund-cycle loop centered on its face.',
  },
  {
    id: 'st-gio-gap-do',
    khoRong: 256,
    dung: 'dấu hiệu "Yêu cầu chuyển gấp"',
    prompt: 'A red rounded-corner warning triangle with a chunky white stopwatch centered on '
      + 'its face and three short white speed lines streaking behind it.',
  },

  // ── NHÃN DÁN HÀNH ĐỘNG ────────────────────────────────────────────────────
  {
    id: 'st-vi-tien',
    khoRong: 256,
    dung: 'bước "Không chuyển tiền"',
    prompt: 'A chunky purple wallet with a rounded flap, and a single glossy gold coin '
      + 'peeking out from the top edge.',
  },
  {
    id: 'st-nguoi-than',
    khoRong: 256,
    dung: 'nút "Báo cho con cháu"',
    prompt: 'Two simple rounded white-and-purple people figures standing close together '
      + 'side by side, with a small soft red heart shape floating beside them.',
  },
  {
    id: 'st-chuong-do',
    khoRong: 256,
    dung: 'nút "Báo tin" ở vòng tròn gia đình',
    prompt: 'A chunky red alarm bell tilted mid-ring, with two short curved red motion lines '
      + 'on each side showing it shaking.',
  },
  {
    id: 'st-sach-hoc',
    khoRong: 256,
    dung: 'thẻ "Mẹo hôm nay" (#huong-dan)',
    prompt: 'A thick closed purple book lying at a slight angle with a violet ribbon bookmark, '
      + 'and a small violet-purple shield bearing a simple white leaf shape resting against '
      + 'its front cover.',
  },

  // ── NHÃN DÁN THẺ LỊCH SỬ ──────────────────────────────────────────────────
  {
    id: 'st-mu-cong-an',
    khoRong: 256,
    dung: 'thẻ "Cuộc gọi tự xưng công an" (#lich-su)',
    prompt: 'A dark navy-blue peaked officer cap with a small gold star badge on its front, '
      + 'and a small red circle holding a simple white telephone handset shape tucked at its '
      + 'lower right.',
  },
  {
    id: 'st-tin-nhan-qua',
    khoRong: 256,
    dung: 'thẻ "Tin nhắn trúng thưởng" (#lich-su)',
    prompt: 'A chunky purple rounded speech bubble containing three white dots, with a small '
      + 'pink gift box with a ribbon tucked at its lower right.',
  },
  {
    id: 'st-lien-ket-km',
    khoRong: 256,
    dung: 'thẻ "Link khuyến mãi" (#lich-su)',
    prompt: 'Two interlocking chunky purple chain links, with a small green price tag shape '
      + 'hanging off the lower right corner.',
  },
];

module.exports = { DANH_MUC, PHONG_CACH, CAM_CHU };
