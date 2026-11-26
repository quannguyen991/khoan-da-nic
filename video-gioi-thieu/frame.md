---
name: Khoan Đã — video giới thiệu (EN)
version: 0.1
canvas: { width: 1920, height: 1080, fps: 30, aspect: "16:9" }
colors:
  paper:        "#f9f7ff"   # tokens.css --color-paper
  paper-mid:    "#f4eeff"
  paper-deep:   "#ebe2ff"   # stop tối nhất của dải loang — mốc tương phản
  surface:      "#fdfdff"   # mặt thẻ UI
  ink:          "#141032"   # chữ chính
  ink-2:        "#424064"
  accent:       "#723fd9"   # tím thương hiệu — chỉ tô MỘT từ mỗi dòng
  accent-soft:  "#ece1ff"   # nền, cấm đặt chữ lên
  night:        "#141032"   # nền tối cho cảnh công nghệ
  night-lift:   "#301f66"
  danger:       "#a50013"   # chỉ dùng cho nhãn "High risk" — màu của app thật
  warning:      "#794e00"
  success:      "#005e31"   # chỉ cho nhãn "No clear risk signals found"
typography:
  display: { family: "Inter", weight: 700, size: "96px (8.9% chiều cao)", tracking: "-2%", leading: 1.1 }
  body:    { family: "Inter", weight: 500, size: "40px", tracking: "0", leading: 1.3 }
  caption: { family: "Inter", weight: 600, size: "34px", note: "phụ đề cháy vào hình, nền tối 70%, ở 1/3 dưới" }
  ui:      { family: "ảnh chụp thật của app — không dựng lại chữ" }
spacing: { margin: 96, safe-action: "90%", safe-title: "80%" }
motion:
  enter: "cubic-bezier(0.16, 1, 0.3, 1)  — 0.5 s"
  camera: "cubic-bezier(0.65, 0, 0.35, 1) — 0.4–0.6 s, có motion blur"
  type: "gõ từng chữ có con trỏ nhấp nháy, 0.06 s/ký tự"
  rule: "mỗi shot đúng MỘT chuyển động chính; thứ khác đứng yên"
components:
  chip:   { radius: 999, fill: "#ffffff", shadow: "0 8px 24px rgba(114,63,217,.16)", text: "nhãn lấy NGUYÊN từ app thật" }
  card:   { radius: 28, fill: "#fdfdff", shadow: "0 24px 60px rgba(20,16,50,.14)", note: "thẻ đặc, KHÔNG kính mờ" }
  phone:  { note: "ảnh chụp thật, hiển thị phẳng 2D, không nghiêng 3D" }
---

# Khoan Đã — frame.md (video giới thiệu, tiếng Anh)

## Tổng quan

Hướng thiết kế rút ra từ video tham khảo thứ tư (Supahub / Zelios): **chữ động cỡ lớn
là nhân vật chính**, một từ tô tím mỗi dòng, màn hình sản phẩm đặt giữa các cú chữ,
nền xen kẽ **lavender sáng** và **tím đêm**. Đổi lại ba thứ họ có mà ta **không** lấy:

1. Không nhân vật, không mặt người, không dựng hình 3D — người dùng đã loại thẳng.
   Con người trong phim chỉ hiện ra qua **lời thoại và chữ**, không qua hình.
2. Không nghiêng giao diện 3D (luật của skill HyperFrames: giao diện sản phẩm luôn phẳng).
3. Không kính mờ, không hạt sáng, không quầng sáng trang trí.

Tím loang ở đây **là màu thương hiệu thật** (`tokens.css`, hue 292/298) và khớp video
tham khảo — nên nó được phép dù skill mặc định cấm "gradient tím". Dải loang chỉ dùng
làm **nền**, không làm đồ vật.

## Bốn "thế giới" (mỗi cảnh một nền, nhưng chữ và tím giữ nguyên)

| Thế giới | Nền | Dùng ở |
|---|---|---|
| Lavender sáng | `paper → paper-deep`, hai quầng hồng-tím mờ | mở đầu, giải pháp, kết quả mong đợi |
| Tím đêm | `night → night-lift`, ánh sáng tím rơi ở góc phải trên | cảnh công nghệ (AI = nhân chứng, luật = quan toà) |
| Màn hình thật | `paper` phẳng + thẻ app thật ở giữa | cảnh thao tác |
| Đỏ khẩn | màu đỏ của chính màn "Dừng 60 giây" | một shot duy nhất, đừng kéo dài |

## Luật bố cục

- Hero của mỗi shot ≥ 40% chiều cao khung. Điện thoại chụp thật **phóng 1,6–2×**, chữ
  trong ảnh ≥ 26px ở 1080p sau khi phóng.
- Chữ dài ≤ 6 từ một dòng, một dòng trên màn một lúc; giữ ≈ 0,3 s/từ + 0,5 s.
- Con trỏ to (4–7% khung), đi vào từ ngoài khung, bấm xong thì cảnh kế tiếp xảy ra
  ngay trên cùng khung hình đó.
- Chip nhãn (OTP · money transfer · stay on the line) lấy **đúng chữ** từ màn kết quả
  thật; không bịa nhãn.
- Logo: tệp `public/logo-512.png`, đáp ở 5–10% cuối phim, bằng cách **vẽ ra** (hai thanh
  "tạm dừng" trượt vào thành khiên), không dán góc.

## BANNED cho phim này

Người giả / mặt người · dựng 3D, đất sét, linh vật · kính mờ · hạt sáng · quầng
sáng · "An toàn / Safe / protected / guaranteed" · hứa chặn cuộc gọi · hứa lấy lại
tiền · mọi con số chưa có trong `eval/results/latest.json` hay bảng nguồn đã kiểm ·
logo ghim góc · ba thẻ xếp hàng ngang.
