# Khoan Đã: triển khai các luồng nhắn tin, bàn phím và trợ lý AI

## Đã nối vào ứng dụng

- Android `ACTION_SEND` văn bản/ảnh tiếp tục đi qua `/api/analyze` hiện có. Không thêm bộ chấm rủi ro thứ hai.
- Sau lượt kiểm có nội dung, màn kết quả có Trợ lý phản hồi tại chỗ: sao chép câu từ chối trung tính, hướng dẫn dừng tương tác, và chuẩn bị bản chia sẻ cho người thân.
- Bản chia sẻ có ghi chú thận trọng, thời điểm, mức trả về, giải thích từ các mã lý do chuẩn và văn bản có che dãy số. Ảnh gốc không được đính kèm. Chỉ khi người dùng bấm mới mở Android Sharesheet hoặc trình soạn SMS tới liên hệ đã lưu; mở bảng soạn không đồng nghĩa đã gửi.
- Bàn phím Android tùy chọn hỗ trợ gõ chữ, ký tự tiếng Việt qua nhấn giữ nguyên âm, số, xóa, dấu câu, đổi bàn phím, và chèn câu mẫu. Nó không lưu lịch sử gõ. Trường mật khẩu/PIN không được đọc.
- “Kiểm tra bản nháp” chỉ đọc tối đa 500 ký tự trước con trỏ sau thao tác người dùng. Hộp xác nhận hiển thị nội dung và giải thích việc chuyển sang luồng phân tích hiện có; xác nhận mới mở ứng dụng để kiểm.
- Trợ lý Nói hiện có trong ứng dụng đã cung cấp trò chuyện, đọc to, nghe giọng nói khi được hỗ trợ và nút chuyển câu chuyện sang cùng bộ phân tích chuẩn. Không dựng thêm một trợ lý AI thứ hai.
- Phase 4 đã có sẵn: NotificationListenerService lọc các ứng dụng được cho phép, chỉ cảnh báo OTP khi có ngữ cảnh cuộc gọi theo cơ chế hiện tại, không lưu/gửi mã OTP.

## Giới hạn và cách bật bàn phím

Trong APK Android, vào **Trung tâm Bảo vệ → Khoan Đã Keyboard → Mở Cài đặt bàn phím**, bật bàn phím, rồi quay lại chọn nó. Việc bật là tùy chọn của người dùng. Trên web/PWA bàn phím native không khả dụng.

Bàn phím không phân tích nội dung nền và không tạo cảnh báo rủi ro cục bộ. Việc đó giữ một nguồn kết luận duy nhất theo hợp đồng hiện tại của dự án. Kiểm tra bản nháp yêu cầu xác nhận và dùng dịch vụ phân tích hiện có; vì vậy cần mạng khi muốn có kết quả máy chủ. Bàn phím không khóa ứng dụng ngân hàng hay ngăn giao dịch.

OCR ảnh dùng đường chia sẻ ảnh đã có và backend hiện có. Không có chụp màn hình ngầm, MediaProjection, hoặc OCR chạy nền. Việc che dữ liệu trên bản chia sẻ là heuristic theo mẫu OTP và chuỗi số dài, không phải công cụ biên tập chứng cứ hoàn chỉnh; người dùng phải xem lại trước khi chia sẻ.

## Kiểm thử thủ công trên thiết bị

1. Cài APK, bật bàn phím trong Cài đặt Android, quay lại ứng dụng và chọn bàn phím.
2. Gõ tiếng Việt bằng cách nhấn giữ nguyên âm, thử xóa, dấu cách, Enter, đổi sang bàn phím khác và quay lại.
3. Tại ô văn bản bình thường, bấm **Kiểm tra bản nháp**. Hủy xác nhận và xác nhận; chỉ lượt xác nhận mới mở Khoan Đã.
4. Lặp lại ở ô mật khẩu/PIN; không có nội dung nào được đọc/kiểm tra.
5. Chia sẻ một tin nhắn vào Khoan Đã; kiểm tra câu trả lời, hướng dẫn ngừng tương tác và bản xem trước chia sẻ. Hủy Sharesheet để xác nhận chưa gửi.
6. Chia sẻ ảnh chụp màn hình do người dùng tự chụp; kiểm tra đường phân tích ảnh hiện có và xác nhận ảnh gốc không bị đính kèm vào gói chia sẻ gia đình.

APK đã build ở Phase 1 trước khi bổ sung này; cần chạy lại build sau thay đổi native và kiểm tra trên thiết bị thật trước khi phát hành. Thiết bị Android chưa được kết nối trong phiên làm việc.
