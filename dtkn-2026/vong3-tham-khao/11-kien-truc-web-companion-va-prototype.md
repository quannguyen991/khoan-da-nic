# 11 – KIẾN TRÚC TRẢI NGHIỆM WEB ĐỒNG HÀNH & NGUYÊN MẪU SỐ (WEB COMPANION PROTOTYPE) — KHOAN ĐÃ

> **Dự án:** Khoan Đã (ShieldGen) — Đấu trường Khởi nghiệp 2026 (ĐTKN 2026)  
> **Tác giả:** `@webproto`  
> **Cập nhật:** 24/11/2026  
> **Tài liệu gốc:** `C:\Users\admin\.gemini\antigravity\brain\b89f8e7c-e859-48a8-ad49-020d512fa79f\web_companion_architecture.md`  
> **Mã nguồn nguyên mẫu tương tác:** `D:\KHOAN-DA-24H\public\web-companion.html`

---

## 1. TỔNG QUAN HỆ THỐNG TRẢI NGHIỆM WEB

Khoan Đã mở rộng từ ứng dụng Android Native (APK 8.4MB) sang hệ sinh thái Web Companion hoàn chỉnh với 3 phân hệ chủ lực:
1. **Web Quick Scanner (Trình Quét Nhanh Không Cài Đặt):**
   - Hỗ trợ đa dạng đầu vào (Omni-input): Văn bản tin nhắn (SMS/Zalo/Telegram), Số tài khoản ngân hàng, Kéo thả ảnh chụp màn hình OCR, Link URL.
   - Trang bị 4 nút Preset tình huống mẫu để Ban giám khảo (Sharks) thử nghiệm ngay trong 1 lần nhấp chuột.
   - Kích hoạt Màn hình Dừng 60 Giây (`PAUSE_60S` / `PROTECTED_CRITICAL`) trực tiếp trên web với đồng hồ đếm ngược, nhịp thở thư giãn, câu giải thích một dòng, kịch bản cúp máy êm thấm, và nút gọi người thân.
   - Hiển thị "Biên nhận Cảnh báo" (`TRUST_RECEIPT` / Khoan-Proof) có mã định danh có thể chia sẻ Zalo cho con cháu.

2. **Family Circle Web Portal (Cổng Thông Tin Vòng Tròn Gia Đình):**
   - Thiết kế chuẩn công thái học đáp ứng (Responsive Mobile & Desktop) cho con cái (25-45 tuổi).
   - "Nhịp bảo vệ" (Heartbeat): Theo dõi tình trạng máy bố mẹ (mức pin, trạng thái nền, quyền bảo vệ) mà KHÔNG xâm phạm quyền riêng tư (không đọc trộm SMS cá nhân, không nghe lén, không định vị GPS).
   - Dòng thời gian sự cố theo thời gian thực (Real-time Timeline).
   - "Chìa khoá thứ hai" (Two-Key Authorization): Phê duyệt từ xa các giao dịch chuyển tiền giá trị cao.
   - "Quy tắc an toàn gia đình" & Báo cáo an tâm tuần.

3. **Embeddable Khoan Đã Badge & Widget (Tiện Ích Nhúng Web B2B2C):**
   - 1 dòng mã JavaScript nhúng nhẹ (< 15KB) tích hợp vào các trang tin tức, diễn đàn hưu trí, sàn thương mại điện tử, và cổng từ thiện xã hội.
   - Cung cấp tiện ích tra cứu STK người bán / xác thực tài khoản tiếp nhận cứu trợ bão lũ chính thống.

---

## 2. BẢNG ĐẶC TẢ CÔNG THÁI HỌC NGƯỜI CAO TUỔI (§4.4)

| Thuộc tính UI | Giá trị chuẩn Khoan Đã | Lý do y sinh học người cao tuổi (60+) |
|---|---|---|
| **Vùng chạm nút chính** | **Tối thiểu 56px** (`--touch-target-primary`) | Giảm rung tay (tremor), dễ chạm trúng |
| **Vùng chạm nút phụ** | **Tối thiểu 52px** (`--touch-target`) | Tránh chạm nhầm giữa các nút điều khiển |
| **Cỡ chữ nhỏ nhất** | **Tối thiểu 14px** ở gốc 17px | Mắt lão thị, giảm khả năng điều tiết tiêu cự |
| **Cỡ chữ màn khẩn cấp** | **Tối thiểu 20px - 28px** | Đọc rõ ràng trong 1-2 giây đầu khi đang hoảng loạn |
| **Độ tương phản chữ** | **Tối thiểu 4.5:1** (WCAG AA) | Mắt người già giảm độ nhạy tương phản |
| **Lối thoát an toàn** | Luôn có nút "Tôi ổn" (§4.6) | Không giam người dùng trong màn hình chặn, chống hoảng loạn |
| **Từ ngữ cấm tuyệt đối** | ❌ "An toàn", ❌ "Safe", ❌ "Bác bị lừa rồi" | Giữ thể diện và sự tôn trọng người cao tuổi |

---

## 3. KỊCH BẢN DEMO 30–60 GIÂY DÀNH CHO PITCH SHARK TẠI BUV (29/11/2026)

- **Bước 1 (0-10s):** Chiếu mã QR và trang web `khoanda.vn/quet`. Mời Sharks quét bằng camera điện thoại.
- **Bước 2 (10-25s):** Bấm nút Preset "🚨 Giả danh Công an đòi chuyển tiền" -> Bấm "Kiểm Tra Ngay". Màn hình chuyển sang nền đỏ rực rỡ với đồng hồ đếm ngược 60s đập nhịp nhàng.
- **Bước 3 (25-40s):** Nhấn mạnh câu giải thích 1 dòng: "Công an không bao giờ đòi chuyển tiền qua mạng" và kịch bản đối phó: "Bác nói 'Tôi đang bận nấu cơm, lát gọi lại' rồi cúp máy".
- **Bước 4 (40-55s):** Chuyển sang Cổng Gia Đình: Người con ở công ty nhận cảnh báo ngay tức thì kèm 3 câu trấn an khi gọi về cho bố mẹ.
- **Bước 5 (55-60s):** Chuyển sang Tiện ích nhúng: Minh chứng khả năng nhân rộng quy mô và hợp tác B2B2C với ngân hàng, sàn TMĐT và quỹ từ thiện.
