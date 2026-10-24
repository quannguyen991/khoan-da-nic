# Phiếu ghi nhận thay đổi và triển khai — Khoan Đã

**Ngày kiểm tra:** 15/10/2026  
**Nhánh:** `sua-bo-luat-va-do-luong`  
**Commit nền:** `96079dc` (`File bàn giao dự án Khoan Đã (13/10/2026)`)  
**Trạng thái phát hành:** Chưa commit các thay đổi mới, chưa đẩy lên `main`, chưa triển khai Render, chưa phát hành APK mới.

Tài liệu này ghi nhận phần mã và kiểm tra đang có trong working tree tại ngày trên. Đây là tình trạng tại repo trên máy phát triển, không phải xác nhận bản đang chạy trên máy chủ đã thay đổi.

## Thay đổi đã triển khai trong mã nguồn

### Trung tâm Bảo vệ

- Thêm mục **Trung tâm Bảo vệ** vào menu và nối tới hỗ trợ gia đình, SOS cùng phần quyền/thông báo sẵn có.
- Thêm màn **Thoát cuộc gọi an toàn**: câu nói mẫu có thể đọc bằng TTS trên máy, hướng dẫn tự kết thúc cuộc gọi và tự gọi lại qua số chính thức, cùng lối gọi người thân/SOS.
- Thêm hai cử chỉ cầu cứu tùy chọn: úp máy ổn định khoảng 1,3 giây hoặc lắc ba nhịp. Mỗi cử chỉ bật riêng; cài đặt nằm trong SharedPreferences trên thiết bị.
- Cử chỉ chỉ hoạt động khi ứng dụng đang ở tiền cảnh và thiết bị có accelerometer. Khi nhận cử chỉ, ứng dụng rung nhẹ và mở màn cầu cứu; người dùng vẫn tự quyết định gọi hay gửi tin. Không thêm quyền Android.

### Trợ lý phản hồi tại chỗ

- Sau khi có kết quả kiểm nội dung, thêm hướng dẫn dừng tương tác, câu trả lời trung tính để sao chép và bản tóm tắt có che một số mã/dãy số để người dùng xem lại.
- Người dùng tự chọn mở Android Sharesheet hoặc soạn SMS tới liên hệ đã lưu. Mở bảng chia sẻ/soạn tin không tự gửi; ảnh gốc không được đính kèm.
- Không thêm bộ chấm rủi ro riêng; kết quả vẫn dùng luồng phân tích hiện có.

### Bàn phím Android tùy chọn

- Thêm IME tiếng Việt riêng với nhập chữ/số, dấu bằng nhấn giữ nguyên âm, xóa, dấu câu, đổi bàn phím và câu mẫu.
- **Kiểm tra bản nháp** chỉ chạy sau thao tác và xác nhận của người dùng; chỉ lấy tối đa 500 ký tự trước con trỏ rồi mở ứng dụng để dùng bộ phân tích hiện có.
- Bàn phím không lưu lịch sử gõ, không đọc trường mật khẩu/PIN, không phân tích nền, không đọc nội dung đang hiển thị trong ứng dụng khác và không khóa giao dịch. Chỉ có trong APK Android; người dùng phải tự bật/chọn trong Cài đặt Android.

### Tệp và giao diện liên quan

- Nối các màn mới vào `src/App.tsx`, menu trong `src/components/AppMenuModal.tsx`, cầu nối native trong `src/native.ts`, và bổ sung chuỗi Việt/Anh ở `src/catalog.ts`.
- Bổ sung service bàn phím trong `AndroidManifest.xml`, phương thức plugin Android cho trạng thái/cử chỉ/cài đặt bàn phím, hai tệp giao diện IME và tên bàn phím Việt/Anh.
- Tạo tài liệu triển khai theo giai đoạn: `docs/PHASE-1-TRUNG-TAM-BAO-VE.md` và `docs/PHASE-2-3-5-IMPLEMENTATION.md`.

## Kiểm tra đã chạy ngày 15/10/2026

- `npm run lint`: đạt (`tsc --noEmit`).
- `npm test`: đạt **1.680/1.680**, không lỗi.
- `npm run build`: đạt; đã dựng frontend và `dist/server.cjs`.
- Build có cảnh báo hiện hữu về chunk frontend lớn và import Capacitor tĩnh/động; không làm build thất bại.

## Triển khai và kiểm thử thiết bị

- Thay đổi hiện chưa có commit mới. `HEAD` và `origin/main` vẫn ở `96079dc`; do đó chưa có lần tự triển khai Render nào từ thay đổi này.
- Chưa chạy `npm run build:apk` sau khi thêm mã Android, chưa cài thử APK mới trên điện thoại thật, và chưa kiểm tra cử chỉ/IME trên thiết bị. Bản web build không xác nhận mã Java Android đã biên dịch.
- Trước khi phát hành: dựng APK mới, thử bật/chọn bàn phím và kiểm tra ở ô thường lẫn ô mật khẩu/PIN; thử từng cử chỉ, chuyển app ra nền, hủy màn cầu cứu, TTS, Sharesheet và SMS soạn nháp; kiểm tra quyền/luồng đồng ý trên máy thật.

## Tài liệu chi tiết

- Trung tâm Bảo vệ và kịch bản thử: `docs/PHASE-1-TRUNG-TAM-BAO-VE.md`.
- Trợ lý phản hồi và bàn phím: `docs/PHASE-2-3-5-IMPLEMENTATION.md`.
- Hợp đồng, giới hạn sản phẩm và trạng thái nền trước: `docs/BAN-GIAO-DU-AN-2026-10.md`.
