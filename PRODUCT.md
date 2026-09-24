# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Bác (người cao tuổi, 60+)** — người được bảo vệ. Dùng điện thoại Android là chính, quen Zalo, ít quen thao tác app. Lúc bị lừa đang áp máy vào tai, gấp gáp, không tự mở app nào.
- **Con cháu (30–50 tuổi)** — người cài đặt và "vận hành": cài app cho bố mẹ, ghép máy, nhận báo động, thường dùng máy tính. Là người đọc chính của mọi trang giới thiệu.
- **Người trả tiền (định hướng, chưa có hợp đồng)** — ngân hàng và gia đình. Người trả tiền không bao giờ là người đang gặp nguy.

## Product Purpose

Hệ thống an toàn cho **cả gia đình** trước lừa đảo qua điện thoại và tin nhắn, không phải một bộ dò. Nó mua **60 giây** cho bác dừng lại và **kéo một người thân vào cuộc** — hai thứ đánh thẳng vào sự gấp gáp và sự cô lập mà kẻ lừa đảo dựa vào. Thành công = bác không làm theo yêu cầu trong lúc bị ép, và con cháu biết kịp.

## Positioning

- **AI chỉ bật cờ, bộ luật cố định mới quyết mức rủi ro.** Không có "LLM judge"; mọi thứ thông minh thêm vào chỉ làm tăng cảnh giác.
- **Trước · trong · sau:** bài học, quy tắc và mật khẩu gia đình từ trước; can thiệp lúc đang bị gọi; các bước xử lý và nhắc 72 giờ sau khi lỡ chuyển tiền.
- **Hai người dùng, một địa chỉ** — ẩn dụ máy trợ thính: con mua, con chỉnh, bố mẹ đeo.
- **"Không kiểm được" ≠ "đã kiểm, không thấy gì"** — luôn nói rõ cái chưa kiểm.

## Operating Context

Web tại khoan-da.onrender.com (PWA) và bản Android (Capacitor, cùng giao diện web, thêm lớp native: đọc thông báo tin nhắn, cảnh báo đè màn hình kể cả trong cuộc gọi, nhắc cuộc gọi dài, cảnh báo mã OTP đến trong lúc gọi). Bản Android chưa có trên chợ ứng dụng; cài bằng tệp APK tải từ chính trang của dự án. Dự thi NextGen 2026 (thuyết trình tiếng Anh). Trang `/transparency` công khai số đo.

## Capabilities and Constraints

- Ba nhãn rủi ro duy nhất (enum `CAO` / `NGHI_NGO` / `CHUA_THAY`): "Nguy hiểm cao", "Nghi ngờ", "Chưa thấy dấu hiệu rủi ro". Không có nhãn "An toàn"/"Safe" dưới bất kỳ hình thức nào.
- Song ngữ Việt/Anh ở cả giao diện lẫn tầng dò tìm; mọi chuỗi người đọc đi qua catalog.
- Không hứa chặn cuộc gọi, chặn giao dịch, hay lấy lại tiền. Không quy kết một cá nhân là tội phạm.
- Quyền riêng tư: nội dung chỉ rời máy khi bác bấm kiểm; máy chủ không lưu nội dung thô; không đọc SMS, nhật ký cuộc gọi, danh bạ; không dùng dịch vụ trợ năng. Máy chủ và dịch vụ AI đặt ngoài Việt Nam.
- Chưa có pháp nhân: Zalo OA, Zalo Mini App (phát hành), Galaxy Store đều đang tắc vì lý do này.

## Brand Commitments

- Tên "Khoan Đã" giữ nguyên tiếng Việt ở mọi ngôn ngữ.
- Giọng: gọi người dùng là "bác" (theo xưng hô đã chọn), xưng "cháu"; câu ngắn, không thuật ngữ; không trách móc người dùng.
- Khẩu hiệu tiếng Anh bắt buộc: "Pause. Verify. Protect."
- Logo: `public/logo-512.png` (khiên tím, lá trắng).

## Evidence on Hand

- Số đo bộ luật: `eval/results/latest.json`, hiện ở `/transparency` — đo trên **mẫu do đội tự soạn** (bộ chính 571 mẫu) và bộ đối chứng 157 mẫu; chỉ nói "đã đo" với số có trong tệp đó.
- **Chưa có:** người dùng thật, thử nghiệm với người cao tuổi ngoài gia đình, mẫu tin lừa thật (0/25), lời chứng thực, đối tác, số lượt tải. Không được bịa bất kỳ thứ nào trong số này.

## Product Principles

1. Luôn có lối ra — màn khẩn cấp nào cũng có "Tôi ổn, không có gì nguy hiểm".
2. Không gamification, không bảng giám sát bố mẹ, không quảng cáo: app an toàn tốt thì không phải app ngày nào cũng mở.
3. Làm được ở mức không cấp quyền gì; mỗi quyền thêm phải nói rõ nó mua được gì và tốn gì.
4. Nói thật cái chưa kiểm được, cùng cỡ chữ với kết luận.

## Accessibility & Inclusion

Mục tiêu WCAG 2.2 AA (chưa tuyên bố đạt). Sàn có test chặn: vùng chạm 52px, nút chính 56px, chữ tối thiểu 14px ở gốc 17px, tương phản chữ 4.5:1, viền 3:1, cấm `white-space: nowrap` trên nút, cấm chữ nướng vào ảnh. Tiếng Việt có dấu trên dưới: `line-height` không dưới 1.25.
