# Khoan Đã

**Trợ lý cảnh giác lừa đảo cho người cao tuổi Việt Nam.**
Dừng lại trước, kiểm sau, rồi hãy làm.

*Khoan Đã* · *Pause. Verify. Protect.* — a scam-warning assistant for older adults in
Vietnam. Available in Vietnamese and English.

---

## Khoan Đã làm gì

Khi nhận một tin nhắn, cuộc gọi hay đường link đáng ngờ, bác dán nội dung vào app (hoặc
gửi ảnh chụp màn hình). Khoan Đã chỉ ra những dấu hiệu thường gặp trong các vụ lừa đảo,
trích đúng câu chữ đã thấy, rồi đưa ra một nút lớn: **gọi người thân đã chọn trước**.

Hai nguyên tắc không đổi:

- **Không bao giờ nói "an toàn".** Chỉ có ba mức: `Nguy hiểm cao` · `Nghi ngờ` ·
  `Chưa thấy dấu hiệu rủi ro`.
- **Nói rõ điều chưa kiểm được**, cùng cỡ chữ với kết quả. Ảnh không đọc được khác với
  ảnh đã đọc và không thấy gì.

## Tính năng

**Kiểm tra nhanh**
- Dán tin nhắn, chia sẻ từ Zalo, chụp ảnh màn hình, quét QR hoặc nói ra.
- Bộ hỏi nhanh vài câu CÓ/KHÔNG dành cho lúc đang nghe điện thoại, không cần gõ.
- Màn kết quả gọn, một việc cần làm tiếp theo, có nút chụp màn hình đi kiểm.

**Dừng 60 giây và Trung tâm Bảo vệ**
- Màn bảo vệ khi gặp tình huống nguy hiểm, luôn có lối thoát *"Tôi ổn, không có gì nguy hiểm"*.
- Cử chỉ cầu cứu, trợ lý trả lời tại chỗ và hỗ trợ bàn phím tiếng Việt.

**Cho gia đình**
- Đội phản ứng nhanh tối đa ba người thân, mỗi người một việc. Luôn là bác tự bấm gọi.
- Theo dõi 72 giờ sau sự cố, kèm lời nhắc và hồ sơ vụ việc để mang tới ngân hàng hoặc công an.
- Cảnh báo chính thức có đường dẫn tới trang `.gov.vn`, chỉ hiện khi đã có người duyệt.

**Trên Android**
- Hỏi *"Bác có muốn kiểm tin nhắn này không?"* khi tin đến có dấu hiệu đáng ngờ. Chưa gửi gì đi khi bác chưa bấm.
- Dải cảnh báo hiện lên màn hình và bong bóng nổi để kiểm nhanh.
- Quyền nào được xin và dữ liệu đi đâu: [PERMISSIONS-AND-POLICY.md](PERMISSIONS-AND-POLICY.md).

**Mới gần đây**
- Mở rộng bộ luật và bộ mẫu kịch bản lừa đảo 2026.
- Màn góp ý ngay trong app.
- Trang giới thiệu hai ngôn ngữ, mặc định tiếng Anh (`?lang=vi` cho bản Việt).
- Màn nghe giọng nói, mọi chữ đều đi qua catalog ngôn ngữ.
- Từ vựng mới được bổ sung theo quy trình có người duyệt trước khi nạp.

## Giới hạn, nói thẳng

- Cảnh báo **chưa gửi tới được máy người thân**. App giúp bác tự gọi.
- App **không chặn được** cuộc gọi hay giao dịch ngân hàng.
- App **không lấy lại được** tiền đã chuyển, chỉ giúp làm các bước tăng khả năng xử lý.
- Phần AI cần mạng. Mất mạng thì phần luật vẫn chạy và kết quả nói rõ lượt này không có AI đọc.

## Quyền riêng tư và tiếp cận

- Máy chủ không lưu nội dung thô. Không đồng bộ tài khoản mặc định.
- Vùng chạm lớn, chữ rõ, tương phản cao, hoạt động khi mất mạng. Mục tiêu WCAG 2.2 AA.

## Chạy thử

Cần Node 20 trở lên. Không cần khoá API để chạy bộ test.

```bash
npm install
npm run dev          # http://localhost:5173
npm test
npm run build:apk    # bản đóng gói Android
```

## Tài liệu

| Tệp | Nội dung |
|---|---|
| [PERMISSIONS-AND-POLICY.md](PERMISSIONS-AND-POLICY.md) | Quyền được xin, dữ liệu đi đâu, những gì app từ chối lấy |
| [HUONG-DAN-AI-CUC-BO.md](HUONG-DAN-AI-CUC-BO.md) | Chạy AI ngay trên máy |
| [CONTRIBUTORS.md](CONTRIBUTORS.md) | Người đóng góp |

## Ghi nhận

Dự án dùng **Claude Code (Anthropic)** làm trợ lý lập trình. Các quyết định thiết kế và
ràng buộc an toàn do tác giả đặt ra, được ghi trong `CLAUDE.md`.
