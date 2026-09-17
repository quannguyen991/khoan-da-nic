# Đội phản ứng nhanh, số tổng đài ngân hàng, theo dõi 72 giờ — thiết kế

Ngày 17/9/2026 · trạng thái: đã lên web thật cùng ngày (gộp vào `main`), có trong APK 1.2 — APK chưa thử trên máy thật

## Quyết định người dùng đã chốt

- **Bỏ hẳn gọi tự động thay bác.** Mọi nút gọi do bác bấm. "Chuyển sang người thứ hai"
  là một nút bác bấm, hoặc người dự phòng nhận thông báo rồi tự gọi.
- **Bỏ mở app ngân hàng.**
- **Số tổng đài ngân hàng chỉ để sẵn trong app** để bác tự bấm.

## 1. Đội phản ứng nhanh

- Bác chọn tối đa **3 người** trong danh sách người thân, xếp thứ tự gọi.
- Mỗi người nhận 0–3 việc: `NGUOI_GOI` (gọi đầu tiên khi có cảnh báo),
  `HO_TRO_NGAN_HANG`, `HO_TRO_THIET_BI`.
- Thứ tự gọi theo tình huống (`thuTuGoi`): lỡ chuyển tiền → người lo ngân hàng lên
  trước; máy có ứng dụng lạ hoặc tín hiệu `DEV_*` → người lo điện thoại lên trước;
  còn lại → người gọi. Người ngoài đội không chen vào. Chưa lập đội → giữ hành vi cũ.
- Mọi nút "gọi con cháu" (màn cảnh báo, menu tác vụ, nút tròn nổi, cảnh báo thụ động)
  trỏ **cùng một người**.
- Màn cảnh báo có thêm nút **"Không gọi được? Gọi {người kế}"**.
- Dữ liệu chỉ nằm trên máy (`khoan_da_vong_tron`). Không đổi mức rủi ro.

Sửa kèm hai lỗi nền: id người thân dạng số bị sinh lại mỗi lần đọc; danh sách người
thân trong vòng tròn không cập nhật sau lần lưu quy tắc đầu tiên. Nay người thân
luôn đọc từ khoá `familyMembers` của App.

## 2. Số tổng đài ngân hàng

- Nguồn: `public/config/support-directory.json` — đọc tĩnh để có cả khi mất mạng.
- Mục chỉ hiện khi: `approved`, có `reviewedBy`, có `verifiedAt`, số chỉ gồm chữ số,
  và `sourceUrl` là `https` trên **đúng tên miền chính thức** của ngân hàng.
- Máy chủ (`verified-institution-registry.js`) và giao diện (`danh-ba-ngan-hang.ts`)
  lọc theo cùng luật; test giữ hai bên cho ra cùng danh sách.
- Mục chờ duyệt không mang số nào. Số lên tệp qua `scripts/duyet-so-ngan-hang.js`,
  cùng lúc với tên người duyệt. Gỡ số → số biến mất ngay, ghi vào `_da_go`.
- Hiện ở: màn riêng (thẻ ở màn Gia đình), mở tại chỗ trên màn Đường xác minh và màn
  Bảo vệ 72 giờ. Chưa có số nào được duyệt thì nói thẳng, và dặn gọi số sau thẻ.

## 3. Theo dõi 72 giờ

- Vào màn phục hồi → bắt đầu theo dõi (mở lại không đặt lại đồng hồ).
- Trang chủ: một dải gọn "Đang theo dõi 72 giờ · còn N giờ" → màn chi tiết: ba lời
  nhắc, số ngân hàng, hồ sơ vụ việc, kết thúc theo dõi.
- Android: `NhacTheoDoi72Gio` hẹn lời nhắc ở mốc **2 · 24 · 48 · 72 giờ**
  (`setAndAllowWhileIdle`, không cần quyền báo thức chính xác), dựng lại sau khi khởi
  động máy. Chữ do tầng web nạp xuống qua catalog.

## 4. Thông báo cho người thân (máy chủ, chưa có đường gửi thật)

- Push mang thêm `canLamGi` (`goi_ngay` | `theo_doi`), `maCauThongBao`, và
  `nguoiCaoTuoiDaLam`. `tinhTrangChoNguoiThan` trả đúng bốn thứ: mức, loại tình
  huống, bác đã làm gì, cần gọi ngay hay theo dõi — không điểm, không nội dung.
- `canDuongDuPhong` trả `nguoiDuPhongIds`; vẫn cấm gọi tự động.
- Sửa lỗi: màn của bác gửi `goi` — mã của người thân — nên báo cáo đếm nhầm là người
  thân đã gọi. Nay bác gửi `bac-goi`.

## Chưa làm

- **Gửi thật** cho người thân: cần ghép cặp máy, đăng ký push, nhà cung cấp push/SMS,
  và quyết định đồng bộ danh sách người thân lên máy chủ (phải để người dùng tự bật).
- Gộp các cảnh báo sau đó vào cùng một vụ ở giao diện — máy chủ đã có bộ nhớ vụ việc
  14 ngày, giao diện chưa gọi.
- Nút "báo số sai" trên danh bạ ngân hàng.
