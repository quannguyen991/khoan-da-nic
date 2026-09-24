# Mẫu thật — tin nhắn lừa đảo có người nhận thật

Đây là loại mẫu **duy nhất** nói được Khoan Đã có bắt được lừa đảo ngoài đời
hay không. Mọi mẫu khác trong `eval/dataset/` là tự soạn hoặc chép lại từ báo
chí. Hiện thư mục này **chưa có mẫu nào** — bộ đo in rõ điều đó
("KHÔNG CÓ MẪU NÀO nguon=that") và `/transparency` hiện cảnh báo
`khong_co_mau_that`. §2B.6 đặt mục tiêu 25–40 mẫu.

Mẫu ở đây **được tính vào bộ đo chính** (`npm run eval`), và được in riêng
thành số đếm: *"bắt đúng X trên Y tin nhắn thật nguy hiểm"*.

## Lấy mẫu từ đâu

- Người thân, hàng xóm, câu lạc bộ người cao tuổi **tự chuyển tiếp** tin họ đã
  nhận, và **đồng ý** cho dùng.
- Ảnh chụp màn hình thì chép lại phần chữ; không lưu ảnh vào repo.
- **Không** lấy từ nhóm Facebook / Zalo công khai khi chưa hỏi người đăng.
- **Không** để AI viết hộ hay "làm cho giống thật" — như thế là mẫu tự soạn.

## Che thông tin — bắt buộc

Repo này công khai. Trước khi thêm một dòng:

| Thứ trong tin | Thay bằng |
|---|---|
| Số điện thoại, số tài khoản, CCCD | `[số đã che]` |
| Email | `[email đã che]` |
| Liên kết (`https://…`, `www.…`) | `[liên kết đã ẩn]`, hoặc viết hỏng: `hxxps://ten-mien[.]vn` |
| Họ tên người nhận / người được nhắc tới | `Nguyễn Văn A`, `bà B` |
| Tên ngân hàng, cơ quan bị mạo danh | **giữ nguyên** — đó là tín hiệu cần đo |

Số tiền (`50.000.000đ`, `3 triệu`) giữ nguyên.

## Khuôn một dòng

Mỗi tệp `.jsonl`, mỗi dòng một mẫu:

```json
{"id":"that-2026-001","ho":"gia_danh_cong_an","kenh":"zalo","ngon_ngu":"vi","noi_dung":"…tin nhắn đã che…","muc_do":"CAO","toi_da":"CAO","nguon":"that","nguoi_duyet":"Tên người đã đọc lại","ngay_nhan":"2026-09","dong_y":true,"ghi_chu":"người nhận 72 tuổi, đã không chuyển tiền"}
```

- `muc_do` — mức **thấp nhất** app phải báo; `toi_da` — mức **cao nhất** còn chấp
  nhận. Tin lừa rõ ràng: `CAO`/`CAO`. Tin lành: `CHUA_THAY`/`CHUA_THAY`
  (hoặc `toi_da: NGHI_NGO` nếu tin đó đáng ngờ thật).
- `nguoi_duyet` — tên **một người** đã đọc lại, xác nhận đã che thông tin và nhãn
  đúng. AI không được điền trường này.
- `ngay_nhan` — `YYYY-MM` hoặc `YYYY-MM-DD`.
- `dong_y: true` — người nhận tin đồng ý cho dùng.
- `ho` — tra các họ kịch bản đang có trong `eval/dataset/*.jsonl`.

## Kiểm trước khi commit

```bash
node scripts/kiem-mau-that.js
```

Còn số điện thoại, số tài khoản, email, liên kết bấm được, hay thiếu người
duyệt ⇒ **lỗi**, và `npm run eval` cũng sẽ từ chối chạy. Họ tên đầy đủ ⇒
**cảnh báo** (tên đường như "Lê Văn Lương" cũng khớp), người duyệt tự nhìn lại.

## Đừng dùng mẫu thật để chỉnh luật

Mẫu thật là bài kiểm tra, không phải bài tập. Sửa bộ luật cho tới khi một mẫu
thật chuyển xanh thì con số đó mất giá trị — giống bộ đối chứng
`eval/doi-chung/` (xem README ở đó). Nếu một mẫu thật lộ ra lỗ hổng: viết một
mẫu **tự soạn** cùng thủ đoạn vào `eval/dataset/`, sửa luật trên mẫu tự soạn,
rồi xem mẫu thật có tự xanh không.
