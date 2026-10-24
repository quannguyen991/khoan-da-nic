# Phase 1 — Trung tâm Bảo vệ

**Trạng thái:** đã tích hợp mã; chưa thử trên điện thoại Android thật.

## Đã làm

- Thêm Trung tâm Bảo vệ vào menu tác vụ. Màn này nối tới màn người thân, luồng SOS hiện có và trang cài đặt thông báo/quyền hiện có.
- Thêm màn Thoát cuộc gọi an toàn với câu nói phát bằng bộ đọc tiếng Việt hiện có, câu gợi ý để bác tự nói, hướng dẫn tự kết thúc cuộc gọi và đường gọi người thân/SOS.
- Thêm cử chỉ úp máy ổn định và lắc ba nhịp. Mỗi cử chỉ bật/tắt riêng, trạng thái chỉ lưu trong SharedPreferences trên điện thoại.
- Cử chỉ chỉ nghe khi Activity của Khoan Đã ở tiền cảnh và có accelerometer. Ứng dụng ngừng nghe khi rời tiền cảnh; không xin quyền cảm biến hay tạo dịch vụ nền.
- Cử chỉ chỉ rung nhẹ và mở màn cầu cứu. Không tự gọi, không tự nhắn SOS. Bác có thể hủy nhầm và tiếp tục dùng SOS/gọi người thân thủ công.
- Không thêm quyền Android mới. Dùng lại liên hệ gia đình, gọi điện, SMS, thông báo và màn SOS có sẵn.

## Cách thử thủ công

1. Dựng và cài APK debug lên máy Android có accelerometer.
2. Mở Menu tác vụ → Trung tâm Bảo vệ; bật riêng từng cử chỉ.
3. Khi app đang mở, úp điện thoại yên trên mặt phẳng khoảng 1,3 giây hoặc lắc ba nhịp qua lại.
4. Xác nhận màn cầu cứu mở và rung nhẹ; chọn “Tôi ổn, đóng màn này” để hủy.
5. Thử chuyển sang app khác rồi thao tác cử chỉ: Khoan Đã không nghe cảm biến ở nền.
6. Mở Thoát cuộc gọi an toàn, kiểm tra phát câu nói; thử gọi người thân và SOS qua các nút hiện có.
7. Từ Trung tâm Bảo vệ mở phần quyền/thông báo và xác nhận trang hiện có báo đúng trạng thái hệ thống.

## Giới hạn

- Chưa kiểm trên thiết bị thật và chưa đánh giá tỷ lệ nhận nhầm của cảm biến.
- Cử chỉ không hoạt động khi khóa màn hình, khi app ở nền, hoặc khi thiết bị thiếu accelerometer. Đây là giới hạn chủ ý để không chạy cảm biến nền liên tục.
- Android TTS có thể thiếu giọng Việt hoặc không phát được; màn hình báo điều đó và vẫn để nguyên câu chữ cho bác tự đọc.
- Hướng dẫn kết thúc cuộc gọi là thao tác thủ công. App không giả pin và không cúp cuộc gọi của ứng dụng khác.
- Danh bạ, quyền thông báo, gửi SMS dự phòng và SOS được tái sử dụng từ hệ thống hiện có; không thay đổi cách gửi hay quyền đồng ý đã thiết lập.
