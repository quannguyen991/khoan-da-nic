# Ảnh gốc — KHÔNG phục vụ ra web

Thư mục này giữ bản PNG gốc của toàn bộ ảnh, chuyển ra khỏi `public/` ngày
18/8/2026. Vite chỉ chép `public/` vào bản dựng, nên đặt ở đây là giữ được bản
gốc mà không đẩy 34 MB xuống máy người dùng.

## Vì sao

`public/` trước đó nặng **34 MB**: mười ảnh `ChatGPT Image ….png` (~2,2 MB mỗi
tấm), ba `mascot-*.png` (3,5 MB mỗi tấm) và `logo.png` 1,5 MB. Trong số đó chỉ
**sáu** tấm được mã dùng tới; ba mascot và năm ảnh `(6)`–`(10)` không chỗ nào
tham chiếu.

Người dùng của Khoan Đã là người cao tuổi, phần lớn dùng 3G/4G gói rẻ. Một
màn hình mở ra kéo theo vài MB ảnh là vài chục giây chờ — mà app này tồn tại
cho đúng lúc có người đang thúc bác chuyển tiền.

## Đã làm gì

| Gốc | Thành | Kích thước |
|---|---|---|
| `ChatGPT Image … (1)`–`(5)`, 1536×1024 | `public/minh-hoa-1..5.webp`, rộng 768 | 2,2 MB → ~32 KB |
| `logo.png`, 1254×1254 | `public/logo.webp` 512 · `logo-192.png` · `logo-512.png` | 1,5 MB → 43 KB / 56 KB / 308 KB |
| `(6)`–`(10)`, `mascot-1..3` | không dùng, chỉ lưu ở đây | — |

`public/` còn **640 KB**.

Manifest giữ icon **PNG** (192 và 512) vì trình cài đặt PWA của một số máy Android
cũ không nhận icon WebP; `<link rel="icon">` và ảnh trong giao diện thì dùng WebP.

## Muốn đổi ảnh

Sửa bản gốc ở đây rồi dựng lại, đừng sửa thẳng tệp trong `public/`:

```bash
ffmpeg -y -i "assets/anh-goc/<tên>.png" -vf "scale=768:-1:flags=lanczos" \
  -c:v libwebp -quality 82 -compression_level 6 "public/minh-hoa-N.webp"
```
