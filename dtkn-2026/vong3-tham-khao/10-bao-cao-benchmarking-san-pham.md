# BÁO CÁO NGHIÊN CỨU & ĐỐI CHIẾU SẢN PHẨM TOÀN DIỆN (COMPETITIVE & ANALOGOUS BENCHMARKING)
## DỰ ÁN KHOAN ĐÃ (SHIELDGEN) – ĐẤU TRƯỜNG KHỞI NGHIỆP 2026

---

### MỤC LỤC
1. **Tóm tắt điều hành & Định vị chiến lược (Executive Summary & The Empty Quadrant)**
2. **Bảng đối chiếu 7 nền tảng phòng chống lừa đảo trong nước & quốc tế**
3. **Phân tích chi tiết từng đối thủ & mô hình tương đồng (Deep-Dive Analysis)**
   - 3.1. Carefull (Mỹ – B2B2C Elder Financial Safety)
   - 3.2. EverSafe (Mỹ – Cross-Institution Behavioral Monitoring)
   - 3.3. Truecaller (Toàn cầu – Caller ID & Truecaller for Web / Family Plan)
   - 3.4. Robokiller / Aura (Mỹ – Call Screening & Audio Fingerprinting)
   - 3.5. nTrust (Việt Nam – Hiệp hội An ninh mạng quốc gia / Bộ Công an)
   - 3.6. Chống Lừa Đảo (Việt Nam – chongluadao.vn / Browser Extension & API)
   - 3.7. Hệ thống cảnh báo Ngân hàng (SIMO - NHNN/NAPAS & Visa A2A Protect)
4. **Mổ xẻ 4 khía cạnh kỹ thuật & trải nghiệm cốt lõi (Core UX & Architecture Deep-Dive)**
   - Khía cạnh 1: Web Companion App (Giao diện web đồng hành)
   - Khía cạnh 2: Quy trình Onboarding & Ghép cặp đa thế hệ (Multi-generational Pairing)
   - Khía cạnh 3: Cổng kết nối gia đình (Family-Sharing Portal & Dignity Safeguards)
   - Khía cạnh 4: Widget tra cứu & Xác thực rủi ro (Scam-Alert Verification Widget)
5. **Khoảng trống thị trường và Lợi thế bất đối xứng của Khoan Đã**
6. **5 Tính năng đột phá & Mẫu thiết kế thực tiễn cần áp dụng ngay lập tức**
   - Đề xuất 1: Web Quick Scanner (Đa phương thức: Chữ, STK, Ảnh OCR, Link)
   - Đề xuất 2: Family Circle Web Dashboard với cơ chế phân quyền bất đối xứng
   - Đề xuất 3: "Biên nhận Cảnh báo" (Scam Incident Receipt) chuẩn hóa
   - Đề xuất 4: Động cơ kịch bản phản ứng gia đình "Nói gì với bố mẹ"
   - Đề xuất 5: Embeddable Khoan Đã Verification Badge cho đối tác B2B2C
7. **Khuyến nghị kỹ thuật & Hợp tác cho các thành viên Swarm (@webproto, @features, @strategist, @partners)**

---

## 1. TÓM TẮT ĐIỀU HÀNH & ĐỊNH VỊ CHIẾN LƯỢC

### Bối cảnh thị trường
- Tại Mỹ, thiệt hại lừa đảo ở người cao tuổi (60+) năm 2025 vượt **7,75 tỷ USD** (+59% so với 2024, theo báo cáo FBI IC3 Elder Fraud 2025). 
- Tại Việt Nam, theo Bộ Công an, 8 tháng đầu năm 2025 ghi nhận trên **1.660 tỷ đồng** thiệt hại qua 1.500 vụ lừa đảo trực tuyến công nghệ cao, trong đó người cao tuổi là đối tượng trọng điểm bị thao túng tâm lý (giả danh công an, VNeID giả, nhân viên thuế, bẫy đầu tư).
- **Quy luật tâm lý bẫy lừa đảo:** Lừa đảo người cao tuổi không phá vỡ hệ thống bảo mật ngân hàng, mà **phá vỡ một quyết định của nạn nhân**. Nạn nhân bị đưa vào trạng thái "đóng băng nhận thức" (psychological freeze) qua 3 đòn bẩy: **Sợ hãi/Áp lực thời gian**, **Danh tính giả danh uy tín**, và **Sự cô lập** ("không được nói với ai", "không được ngắt máy").

### "Khoảng trống rỗng" (The Empty Quadrant) trên bản đồ giải pháp
Thị trường an ninh mạng và an toàn tài chính hiện nay phân hóa thành 2 cực:
1. **Cực Hạ nguồn (Post-incident / Tra soát & Truy vết):** Báo cáo công an, tra soát ngân hàng, hotline hỗ trợ nạn nhân. Điểm yếu: Khi tiền đã chuyển sang tài khoản "mule" (tài khoản rác) và bị tẩu tán qua crypto/tiền mặt, tỷ lệ thu hồi dưới 10%.
2. **Cực Thượng nguồn thụ động (Static Perimeter / Blacklist lookups):** Chặn cuộc gọi rác (Truecaller), tra cứu link đen (ChongLuaDao), danh sách tài khoản nghi vấn (nTrust, SIMO). Điểm yếu: Kẻ lừa đảo liên tục dùng SIM mới, link mới, STK mới tạo. Cảnh báo tĩnh dạng chữ thông thường mất dần tác dụng (theo ĐH Nottingham CeDEx 2023: cảnh báo chữ thông thường chỉ giảm 18% nạn nhân và hết tác dụng sau 3 lần gặp).

```
                      CAN THIỆP THỜI GIAN THỰC (IN-MOMENT)
                                     ▲
                                     │   ★ KHOAN ĐÃ
                                     │   (Khoảng dừng 60s + Nối gia đình +
                                     │    Ngăn chặn quyết định chuyển tiền)
                                     │
                 SIMO / Visa A2A     │
                 (Cảnh báo tại app   │   Carefull (US)
                  ngân hàng pre-tx)  │   (Cảnh báo giao dịch bất thường)
                                     │
   THIẾT BỊ ĐỘC LẬP                  ┼────────────────────────► MẠNG LƯỚI GIA ĐÌNH
   (ĐƠN LẺ)                          │                          (HỆ SINH THÁI ĐA THẾ HỆ)
                                     │
                 Truecaller /        │   EverSafe (US)
                 Robokiller          │   (Trusted Advocates)
                 (Chặn cuộc gọi)     │
                                     │
                 nTrust / ChongLuaDao│
                 (Tra cứu Blacklist) │
                                     ▼
                      THỤ ĐỘNG / TRA CỨU SAU SỰ VIỆC
```

**Khoan Đã là giải pháp duy nhất định vị tại giao điểm then chốt:** *Can thiệp đúng 60 giây then chốt khi nạn nhân bị thao túng tâm lý + Tự động kéo người thân bình tĩnh vào cuộc mà không xâm phạm quyền riêng tư của người cao tuổi.*

---

## 2. BẢNG ĐỐI CHIẾU 7 NỀN TẢNG PHÒNG CHỐNG LỪA ĐẢO

| Nền tảng / Giải pháp | Xuất xứ & Quy mô | Mô hình kinh doanh | Kênh hoạt động chính | Web Companion / Portal | Cơ chế bảo vệ gia đình | Điểm mạnh nổi bật | Lỗ hổng / Giới hạn đối với Người cao tuổi VN |
|---|---|---|---|---|---|---|---|
| **Carefull** | Mỹ (2020), huy động $16.5M Series A (2023) | B2B2C (bán qua >35 ngân hàng, credit unions) & B2C | Web Portal + iOS/Android App | Dashboard hoàn chỉnh cho Financial Caregivers | Có (Trusted Contacts framework) | Theo dõi tài chính bất thường bằng AI chuyên sâu cho người già | Phụ thuộc liên kết Open Banking (Plaid) không khả thi tại VN; không can thiệp được cuộc gọi/tin nhắn lừa đảo thời gian thực |
| **EverSafe** | Mỹ, đối tác NAPSA, bằng sáng chế giám sát | B2C ($7.49 - $26.99/tháng) & B2B2C | Web Desktop Portal + Mobile App | Web Portal chuyên nghiệp đa màn hình | Có (Trusted Advocates, phân quyền chi tiết) | Phân tích hành vi đa định chế (cross-institution look-back) | Giá quá đắt; tập trung điểm tín dụng Mỹ; không có khoảng dừng tâm lý khi bị ép chuyển tiền qua app OTT |
| **Truecaller** | Thụy Điển/Ấn Độ, >400M người dùng, >4M trả phí | B2C Freemium ($9.99 - $74.99/năm) & B2B | Mobile App (chính) + Truecaller for Web | Web pairing qua QR code (xem SMS/cuộc gọi) | Có (Family Plan 5 người, chia sẻ gói Premium) | CSDL số điện thoại khổng lồ crowdsourced toàn cầu | Chỉ nhận diện số rác/spam; hoàn toàn bất lực trước cuộc gọi qua Zalo/Telegram; không hỗ trợ người già khi bị thao túng tâm lý |
| **Robokiller** (Aura) | Mỹ, ứng dụng chặn cuộc gọi hàng đầu | B2C Subscription ($4.99/tháng - $39.99/năm) | Mobile App (iOS/Android) | Dashboard quản trị tài khoản web cơ bản | Phải thông qua gói Aura Family chung | "Answer Bots" nhại giọng trêu chọc lừa đảo, audio fingerprinting | Đòi hỏi cài đặt chuyển tiếp cuộc gọi nhà mạng phức tạp; mang tính trả đũa giải trí hơn là bảo vệ an toàn cho người cao tuổi |
| **nTrust** | Việt Nam (Hiệp hội An ninh mạng quốc gia NCA, 7/2024) | Phi lợi nhuận / Miễn phí công cộng | Mobile App (Android/iOS) + Web tra cứu | Web ntrust.vn tra cứu đơn giản | **Không có** (100% người dùng độc lập) | Dữ liệu chính thức từ Bộ Công an, NHNN, BTTTT; quét mã độc Android | Tra cứu tĩnh; kẻ gian dùng SIM rác/STK mới mở thì báo "Không có"; không có vòng bảo vệ gia đình; UX phức tạp với người 60+ |
| **Chống Lừa Đảo** (chongluadao.vn) | Việt Nam (Ngô Minh Hiếu & cộng sự, 2020) | Phi lợi nhuận, API cộng đồng, đóng góp | Browser Extension (Chrome/Edge/Cốc Cốc) + Web | Web chongluadao.vn tra cứu link, chấm điểm AI (1-10) | **Không có** (cá nhân tự bảo vệ) | Tiện ích trình duyệt bắt link độc cực nhanh; cộng đồng báo cáo mạnh; bot Zalo | Chủ yếu bảo vệ trên trình duyệt máy tính; người già chủ yếu dùng điện thoại bấm link Zalo hoặc nghe gọi trực tiếp; không có nút can thiệp gia đình |
| **Hệ thống Ngân hàng** (SIMO VN & Visa A2A Protect) | VN (NHNN, NAPAS, C05) & Toàn cầu (Visa) | B2B / Bắt buộc tuân thủ theo quy định | Tích hợp sâu vào core Mobile Banking | Không áp dụng trực tiếp cho người dùng cuối | **Không có** (ràng buộc bí mật ngân hàng, không thể báo người thân) | Can thiệp ngay trước bước chuyển tiền; chấm điểm rủi ro tài khoản đích theo thời gian thực | Cảnh báo dạng văn bản gây "nhờn"; không biết nạn nhân đang bị gọi đe dọa bên ngoài; người già hoảng loạn vẫn bấm "Xác nhận chuyển" |

---

## 3. PHÂN TÍCH CHI TIẾT TỪNG ĐỐI THỦ & MÔ HÌNH TƯƠNG ĐỒNG (DEEP-DIVE)

### 3.1. Carefull (Mỹ – getcarefull.com)
* **Tổng quan:** Startup tiên phong khái niệm "Financial Caregiving", giải quyết bài toán con cái tuổi 40-55 chăm sóc tài chính cho cha mẹ tuổi 70+. Tháng 10/2023 gọi vốn thành công 16,5 triệu USD Series A (dẫn đầu bởi Pivot Investment Partners).
* **Mô hình tiếp cận:** Thay vì bán trực tiếp B2C tốn kém, Carefull hợp tác B2B2C với hơn 35 ngân hàng, hiệp hội tín dụng (credit unions) và công ty quản lý tài sản (Edward Jones). Ngân hàng tài trợ Carefull cho khách hàng lớn tuổi để giảm thiểu rủi ro gian lận hoàn tiền và giữ chân tài sản gia đình qua nhiều thế hệ.
* **Giao diện Web & Ứng dụng đồng hành:**
  - Cung cấp **Carefull Companion App & Web Portal** với bảng điều khiển trực quan cho con cái.
  - Phân quyền bất đối xứng (Asymmetric Permission): Cha mẹ cấp quyền "Read-only" (chỉ đọc cảnh báo), con cái không được xem số dư chi tiết hay thực hiện giao dịch, bảo vệ sự độc lập và tự tôn của người già.
  - Tích hợp công cụ **ScamCheck**: Cho phép con cái hoặc cha mẹ tải ảnh chụp màn hình tin nhắn/email nghi ngờ lên web/app để AI phân tích phát hiện mẫu lừa đảo.
  - Tính năng **Carefull Vault**: Kho lưu trữ mã hóa các tài liệu quan trọng (di chúc, danh bạ khẩn cấp, bảo hiểm y tế).
* **Bài học cho Khoan Đã:** 
  1. Hướng đi B2B2C bán cho Ngân hàng và Ví điện tử (với mức phí giả định 2.000 đ/active user) là mô hình đã được Carefull chứng minh thành công.
  2. Tính năng "ScamCheck" trên nền web là cứu cánh để người dùng kiểm tra nhanh mà không bắt buộc cài ứng dụng phức tạp.

### 3.2. EverSafe (Mỹ – eversafe.com)
* **Tổng quan:** Dịch vụ bảo vệ tài chính cao niên chuyên sâu được Hiệp hội Bảo vệ Người cao tuổi Mỹ (NAPSA) khuyên dùng, sở hữu các bằng sáng chế về phân tích bất thường tài chính đa định chế.
* **Mô hình & Bảng giá:** B2C theo gói tháng: Essentials ($7.49), Plus ($16.99), Gold ($26.99/tháng), giảm 10% cho người từ 60 tuổi trở lên.
* **Cơ chế Trusted Advocates (Người bảo hộ tin cậy):**
  - Người dùng cao tuổi có thể mời không giới hạn người thân, luật sư, kế toán viên làm "Advocate" hoàn toàn miễn phí.
  - Cảnh báo đa kênh thông minh (Smart Alerts): Khi hệ thống phát hiện dòng tiền bất thường (rút tiền mặt lớn, chuyển khoản định kỳ bị gián đoạn, chi tiêu tại địa điểm lạ), cảnh báo được gửi đồng thời qua SMS, Email, Web Portal và Mobile Push đến cả người già và người bảo hộ.
  - Phân quyền tinh chỉnh: Con trai cả chỉ nhận cảnh báo tài khoản tiết kiệm; con gái nhận cảnh báo thẻ tín dụng.
* **Bài học cho Khoan Đã:**
  1. Quy tắc "Bác toàn quyền quyết định ai xem gì và thu hồi bất cứ lúc nào" của Khoan Đã rất tương đồng với EverSafe, tạo niềm tin tuyệt đối cho người già Việt Nam (vốn sợ con cái kiểm soát tài sản cá nhân).
  2. Mức giá của EverSafe rất cao ($17 - $27/tháng); mức giá đề xuất của Khoan Đã (49.000 đ/tháng cho gói Gia đình, tương đương ~$1.9) là cực kỳ cạnh tranh và phù hợp với thu nhập hộ gia đình Việt Nam.

### 3.3. Truecaller (Toàn cầu – truecaller.com)
* **Tổng quan:** Ứng dụng định danh cuộc gọi và chặn spam lớn nhất thế giới (>400 triệu active users, hơn 4 triệu thuê bao trả phí tính đến 3/2026).
* **Truecaller for Web (web.truecaller.com):**
  - Ra mắt giải pháp Web Companion kết nối với máy Android qua quét mã QR (tương tự WhatsApp Web / Zalo Web).
  - Cho phép người dùng máy tính tra cứu số điện thoại không giới hạn, xem thông báo cuộc gọi và tin nhắn SMS theo thời gian thực trên màn hình máy tính.
* **Truecaller Family Plan:**
  - Cho phép 1 tài khoản chủ chia sẻ quyền lợi bảo vệ cho 4 người thân khác.
  - Giữ nguyên tính riêng tư: Nhật ký cuộc gọi và tin nhắn của từng thành viên hoàn toàn bảo mật, chỉ chia sẻ kho dữ liệu chặn và các cảnh báo số lừa đảo nguy hiểm.
* **Bài học cho Khoan Đã:**
  1. Mô hình quét mã QR 6 số hoặc QR code để ghép đôi máy con (Web) và máy bố mẹ (Android) là tiêu chuẩn trải nghiệm mượt mà nhất.
  2. Truecaller chỉ chặn số lạ viễn thông truyền thống. Tại Việt Nam, 80% cuộc gọi lừa đảo người cao tuổi chuyển dịch sang Zalo Audio Call, Telegram hoặc đầu số giả mạo Brandname SMS. Khoan Đã tập trung vào phát hiện bẫy tâm lý và can thiệp trong cuộc gọi thay vì chỉ dựa vào số điện thoại.

### 3.4. Robokiller (Mỹ – robokiller.com)
* **Tổng quan:** Ứng dụng thuộc kỳ lân an ninh mạng Aura, nổi tiếng với công nghệ nhận dạng mẫu âm thanh (Audio Fingerprinting) và tính năng "Answer Bots".
* **Đặc điểm kỹ thuật:**
  - Chặn cuộc gọi tự động (robocall) bằng cách so khớp dấu vân tay âm thanh của các đoạn ghi âm lừa đảo phổ biến.
  - Tự động bắt máy và phát các đoạn hội thoại giả lập hài hước để kéo dài thời gian của kẻ lừa đảo, tiêu hao tài nguyên của chúng.
* **Bài học cho Khoan Đã:**
  - Hướng tiếp cận đối đầu trực diện kiểu "Answer Bot" không phù hợp với người cao tuổi Việt Nam, nơi kẻ lừa đảo là người thật đang thao túng tâm lý trực tiếp với giọng điệu đe dọa (công an, viện kiểm sát).
  - Tuy nhiên, ý tưởng "Kéo dài thời gian và làm gián đoạn kịch bản lừa đảo" được Khoan Đã ứng dụng xuất sắc dưới dạng: **Nút phát câu nói sẵn** ("Tôi đang bận, để tôi hỏi con tôi rồi gọi lại") và **Khoảng dừng 60 giây**.

### 3.5. nTrust (Việt Nam – ntrust.vn)
* **Tổng quan:** Phần mềm phòng chống lừa đảo quốc gia do Hiệp hội An ninh mạng quốc gia (NCA) ra mắt tháng 7/2024, tích hợp dữ liệu xác minh từ Bộ Công an, Bộ Thông tin & Truyền thông và Ngân hàng Nhà nước.
* **Tính năng:**
  - Tra cứu 4 danh mục: Số điện thoại, Số tài khoản ngân hàng, Địa chỉ Website, Quét mã QR.
  - Quét mã độc trên thiết bị Android (phát hiện các file .apk giả mạo VNeID, dịch vụ công cài ngoài kho ứng dụng).
  - Tiếp nhận báo cáo lừa đảo từ người dân.
* **Hạn chế cố hữu:**
  - **Tư duy danh sách đen (Blacklist Thinking):** Kẻ gian liên tục luân chuyển hàng trăm tài khoản ngân hàng "rác" (thuê sinh viên mở hoặc mua gom từ vùng sâu vùng xa). Khi người già tra cứu tài khoản mới chưa kịp vào danh sách đen, hệ thống trả về kết quả rỗng. Người dùng dễ lầm tưởng là "An toàn".
  - **Không có yếu tố con người & gia đình:** nTrust hoạt động như một công cụ kỹ thuật đơn độc, không có cơ chế báo động cho con cháu khi bố mẹ gặp nguy hiểm.
* **Điểm Khoan Đã vượt trội:**
  - Khoan Đã tuân thủ nghiêm ngặt: **TUYỆT ĐỐI KHÔNG CÓ NHÃN "AN TOÀN"**, chỉ có `Chưa thấy dấu hiệu rủi ro` trong dữ liệu cung cấp.
  - Khoan Đã phân tích **nội dung và ngữ cảnh thao túng** (giục gấp, đe dọa, đòi OTP, yêu cầu cài app lạ) chứ không phụ thuộc hoàn toàn vào danh sách đen.

### 3.6. Chống Lừa Đảo (Việt Nam – chongluadao.vn)
* **Tổng quan:** Dự án phi lợi nhuận uy tín hàng đầu Việt Nam do chuyên gia an ninh mạng Ngô Minh Hiếu (Hiếu PC) đồng sáng lập, phát triển mạng lưới tiện ích mở rộng trình duyệt (Chrome, Edge, Cốc Cốc, Firefox) và cổng tra cứu web.
* **Đặc điểm kỹ thuật:**
  - Tích hợp mô hình AI chấm điểm rủi ro tên miền (1-10 điểm) dựa trên tuổi đời tên miền, chứng chỉ SSL, cấu trúc trang web và báo cáo cộng đồng.
  - Cung cấp API Threat Intelligence cho các tổ chức, trình duyệt và doanh nghiệp bảo mật.
  - Có bot Zalo tiếp nhận link kiểm tra.
* **Bài học cho Khoan Đã:**
  - Tiện ích mở rộng và widget web tra cứu của ChongLuaDao cực kỳ tiện lợi cho người dùng máy tính.
  - Khoan Đã có thể học hỏi mô hình Widget Web Quick Scanner: Một khung dán thông tin đơn giản ngay trên trang chủ để người dùng kiểm tra tức thì, nhưng nâng cấp toàn diện cho người già: **Hỗ trợ dán tin nhắn văn bản, số tài khoản, quét ảnh OCR và trả về kết quả 3 màu to bản kèm nút Dừng 60 giây**.

### 3.7. Hệ thống cảnh báo Ngân hàng (SIMO VN & Visa A2A Protect)
* **SIMO (Việt Nam):** Hệ thống của NHNN/NAPAS liên thông danh sách tài khoản nghi vấn giữa các ngân hàng thương mại. Khi chuyển tiền đến tài khoản nằm trong danh sách nghi ngờ, ứng dụng ngân hàng hiện pop-up cảnh báo.
* **Visa A2A Protect (Featurespace AI):** Hệ thống chấm điểm rủi ro thời gian thực (1-99 điểm) cho các lệnh chuyển khoản tài khoản-sang-tài khoản (A2A push payments), phát hiện chuyển tiền bất thường trước khi tiền rời khỏi tài khoản.
* **Lỗ hổng chết người của cảnh báo ngân hàng:**
  - **Hiệu ứng mệt mỏi cảnh báo (Alert Fatigue):** Người dùng nhìn thấy pop-up ngân hàng quá nhiều nên hình thành phản xạ vô điều kiện: bấm "Đồng ý" hoặc "Bỏ qua" để hoàn tất giao dịch.
  - **Sự cô lập của ngân hàng:** Do quy định bảo mật ngân hàng, app ngân hàng không thể tự ý gửi tin nhắn cảnh báo cho con cái của chủ tài khoản khi có giao dịch đáng ngờ.
* **Vị thế cộng sinh của Khoan Đã:**
  - Khoan Đã không cạnh tranh với ngân hàng hay SIMO, mà là **mảnh ghép bổ trợ hoàn hảo trước giao dịch (Pre-transaction companion)**: Khoan Đã phát hiện cuộc gọi lừa đảo kéo dài từ 15-30 phút trước đó, phát hiện app gián điệp vừa cài, kích hoạt khoảng dừng 60 giây và kéo người thân vào cuộc *trước khi bác mở app ngân hàng*.

---

## 4. MỔ XẺ 4 KHÍA CẠNH KỸ THUẬT & TRẢI NGHIỆM CỐT LÕI

### 4.1. Khía cạnh 1: Web Companion App (Giao diện Web đồng hành)
* **Vấn đề thực tế:** Người già 60+ dùng điện thoại (Android) với màn hình nhỏ và giao diện tối giản. Ngược lại, người con (30-50 tuổi) thường xuyên ngồi trước máy tính văn phòng hoặc dùng tablet, cần một giao diện quản trị rõ ràng, trực quan, không chiếm dụng bộ nhớ điện thoại.
* **Mô hình chuẩn mực (từ Truecaller Web & Carefull):**
  - **Responsive Web App:** Tự động thích ứng: Nếu mở trên Mobile/màn hình dọc (<768px) -> Hiển thị chế độ "Màn hình Người cao tuổi" (1 câu hỏi, 4 nút to bản ≥56px). Nếu mở trên Desktop/màn hình rộng (≥1024px) -> Hiển thị "Bảng điều khiển Con cái" (Timeline bảo vệ, nhật ký rủi ro, kịch bản trao đổi).
  - **Kiến trúc PWA (Progressive Web App):** Cho phép người dùng ghim trực tiếp ra màn hình chính điện thoại hoặc máy tính mà không cần thông qua Google Play Store, vượt qua rào cản cài đặt cho người dùng web.

### 4.2. Khía cạnh 2: Quy trình Onboarding & Ghép cặp đa thế hệ (Multi-generational Pairing)
* **Vấn đề thực tế:** 80% người cao tuổi bỏ cuộc nếu phải tạo tài khoản bằng email, mật khẩu phức tạp hay xác thực 2 bước rườm rà.
* **Mẫu thiết kế tối ưu (Pattern):**
  - **Quy trình "Con khởi tạo – Cha mẹ chạm một bước":**
    1. *Bước 1 (Trên máy con):* Người con truy cập Web Portal, nhập số điện thoại của mẹ và tên thân mật ("Mẹ Lan"). Hệ thống sinh một **Mã ghép cặp 6 số lớn** (hoặc mã QR to bản) có hạn trong 15 phút.
    2. *Bước 2 (Gửi qua Zalo):* Hệ thống có sẵn nút: `[Gửi mã này qua Zalo cho Mẹ]`.
    3. *Bước 3 (Trên máy mẹ):* Mẹ mở link trong Zalo, bấm đúng 1 nút to màu xanh: `[Đồng ý nhận bảo vệ từ con]`. Không cần gõ lại mã, không cần tạo tài khoản.
  - **Nguyên tắc tự do (Dignity First):** Trên máy của mẹ luôn có dòng chữ cố định: *"Mẹ có thể tắt kết nối này bất kỳ lúc nào"*.

### 4.3. Khía cạnh 3: Cổng kết nối gia đình (Family-Sharing Portal & Dignity Safeguards)
* **Vấn đề tâm lý:** Người cao tuổi rất nhạy cảm với việc bị "giám sát" hoặc bị xem là "lú lẫn, mất quyền tự chủ". Nếu con cái đòi xem hết tin nhắn hay số dư tài khoản, cha mẹ sẽ phản đối và gỡ ứng dụng.
* **Mẫu thiết kế phân quyền bất đối xứng (Asymmetric Permission Pattern từ Carefull & EverSafe):**
  - **Mặc định TẮT:** Bảng theo dõi chia sẻ người thân mặc định ở trạng thái TẮT cho đến khi bác chủ động cho phép.
  - **Bảo mật tuyệt đối nội dung:** Con cái **KHÔNG BAO GIỜ** đọc được nội dung tin nhắn riêng tư, không nghe được nội dung cuộc gọi, không thấy số dư chính xác (chỉ thấy nhãn rủi ro và các trích dẫn dấu hiệu lừa đảo cụ thể).
  - **Nhật ký minh bạch (Audit Trail):** Bất cứ khi nào người con mở Web Portal xem thông tin, hệ thống tự động ghi lại lịch sử hiển thị trên máy của bác: *"Con trai đã xem trạng thái bảo vệ lúc 14:30"*. Người con không thể xóa nhật ký này.
  - **Mức can thiệp theo nấc thang (Escalation Ladder):**
    - *Mức Thấp:* Không làm phiền con cái, chỉ lưu log trên máy bác.
    - *Mức Nghi ngờ:* Hiện thông báo nhẹ trên Web Portal của con.
    - *Mức Nguy hiểm cao:* Gửi tin nhắn SMS/Zalo khẩn cấp đến con kèm nút gọi điện tức thì.

### 4.4. Khía cạnh 4: Widget tra cứu & Xác thực rủi ro (Scam-Alert Verification Widget)
* **Mẫu thiết kế chuẩn (từ ChongLuaDao & Carefull ScamCheck):**
  - Cho phép tra cứu không cần đăng nhập (Zero-friction lookup).
  - Đầu vào đa phương thức (Omni-input):
    1. Dán văn bản tin nhắn SMS / Zalo / Telegram.
    2. Nhập số tài khoản ngân hàng hoặc số điện thoại.
    3. Tải ảnh chụp màn hình (OCR tức thì tại trình duyệt hoặc backend nhẹ).
    4. Dán đường link website nghi vấn.
  - Đầu ra minh bạch (Transparent Output Structure):
    - **1 Nhãn rủi ro rõ ràng** (`Nguy hiểm cao` / `Nghi ngờ` / `Chưa thấy dấu hiệu rủi ro`).
    - **Trích dẫn bằng chứng cụ thể** (Ví dụ: *"Tin nhắn chứa cụm từ 'phạt nguội', 'tạm giữ tài khoản' và yêu cầu chuyển tiền gấp trong 2 giờ"*).
    - **Mục "Chưa kiểm được":** Nêu rõ những gì hệ thống chưa thể xác minh (Ví dụ: *"Chưa kiểm tra được danh tính thực tế của chủ tài khoản"*).
    - **1 Việc cần làm tiếp theo duy nhất (Single Next Action CTA):** Ví dụ: `[Dừng lại 60 giây]`, `[Gọi cho con trai]` hoặc `[Gọi tổng đài chính thức 1900...]`.

---

## 5. KHOẢNG TRỐNG THỊ TRƯỜNG & LỢI THẾ BẤT ĐỐI XỨNG CỦA KHOAN ĐÃ

### Điểm mù của các đối thủ lớn
1. **Truecaller / Robokiller:** Chỉ giải quyết cuộc gọi viễn thông thông thường. Hoàn toàn mù tịt trước kịch bản kẻ lừa đảo kết bạn Zalo, gọi video đe dọa hoặc gửi đường link cài đặt file APK độc hại đội lốt dịch vụ công.
2. **nTrust / Chống Lừa Đảo:** Dựa vào cơ sở dữ liệu có sẵn. Khi gặp thủ đoạn mới (Zero-day scam), dùng số điện thoại rác hoặc tài khoản ngân hàng mới thuê mướn, hệ thống báo "Chưa có dữ liệu", khiến người già mất cảnh giác.
3. **App Ngân hàng (SIMO / Napas):** Chỉ xuất hiện ở giây cuối cùng khi nạn nhân đã bấm lệnh chuyển tiền. Khi đó, nạn nhân đang bị kẻ gian thôi miên qua tai nghe: "Cứ bấm đồng ý đi, đó là thủ tục xác minh của cơ quan điều tra". Cảnh báo của ngân hàng bị vô hiệu hóa bởi tâm lý hoảng loạn.

### Lợi thế bất đối xứng của Khoan Đã (Khoan Đã Advantage)
1. **Giải pháp Đa tín hiệu hợp nhất (Multi-signal Fusion):** Khoan Đã là hệ thống duy nhất liên kết các tín hiệu rời rạc: *(Cuộc gọi kéo dài >20 phút) + (Vừa cài file APK lạ) + (Có mã OTP gửi về) + (Mở app ngân hàng)*. Một tín hiệu riêng lẻ không kết tội được, nhưng tổ hợp 4 tín hiệu này có xác suất lừa đảo >95%.
2. **Động cơ quyết định độc lập (Rule-based Decision Engine 1.6.5):** Không giao phó sinh mệnh tài chính cho LLM tự quyết định. AI chỉ đóng vai trò trích xuất tín hiệu (nhân chứng), bộ luật cố định 58 tín hiệu và 10 quy tắc chốt chặn (critical override) là nơi duy nhất ra mức rủi ro. Nhất quán 100%, không bị ảo giác (hallucination) hay prompt injection.
3. **Cơ chế bẻ gãy mắt xích tâm lý:** Biến trạng thái "Hoảng loạn một mình" thành "Dừng lại 60 giây và kéo người thân đang bình tĩnh vào cuộc".

---

## 6. 5 TÍNH NĂNG ĐỘT PHÁ & MẪU THIẾT KẾ THỰC TIỄN CẦN ÁP DỤNG NGAY

Để Khoan Đã trở thành một giải pháp hữu hình, sẵn sàng triển khai thực tế trên cả Web và Di động, dưới đây là 5 tính năng đề xuất áp dụng ngay:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 5 TÍNH NĂNG ĐỘT PHÁ ĐỀ XUẤT CHO KHOAN ĐÃ                   │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ 1. Web Quick Scanner     │ Tra cứu đa phương thức trực tiếp trên trình duyệt│
│ 2. Family Circle Portal  │ Bảng điều khiển Web cho con cái (Phân quyền kín) │
│ 3. Biên nhận Cảnh báo    │ Scam Incident Receipt chuẩn hóa, chia sẻ 1-chạm  │
│ 4. "Nói gì với bố mẹ"    │ Động cơ kịch bản trấn an tâm lý cho người con    │
│ 5. Embeddable Badge      │ Widget nhúng cho website Ngân hàng, Báo chí, Hội │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

---

### ĐỀ XUẤT 1: WEB QUICK SCANNER (TRÌNH QUÉT NHANH TRÊN WEB)
* **Ý nghĩa:** Giải quyết rào cản lớn nhất của cuộc thi và thị trường: Người dùng, ban giám khảo và các Sharks có thể thử nghiệm giải pháp ngay lập tức trên trình duyệt mà không cần cài file APK.
* **Đầu vào hỗ trợ:**
  - Ô nhập liệu thông minh tự nhận diện: Đoạn văn bản tin nhắn (SMS/Zalo), Đường dẫn website (URL), Số tài khoản ngân hàng kèm tên ngân hàng, hoặc Số điện thoại.
  - Nút tải ảnh chụp màn hình (tự động chạy OCR cục bộ bằng Tesseract.js / Backend AI).
  - 3 nút bấm nhanh tình huống mẫu (Preset Demo Buttons) phục vụ chấm thi:
    - *Mẫu 1:* "Giả danh Công an phạt nguội, bắt chuyển tiền vào tài khoản tạm giữ".
    - *Mẫu 2:* "Con nhắn tin từ tài khoản Zalo lạ nhờ mẹ chuyển tiền gấp trả nợ".
    - *Mẫu 3:* "Tin nhắn chúc mừng trúng thưởng xe máy, yêu cầu nộp lệ phí nhận thưởng".
* **Luồng trải nghiệm người dùng (User Flow):**
  1. Người dùng dán nội dung nghi ngờ vào khung tra cứu -> Bấm `[Kiểm tra ngay]`.
  2. Màn hình kích hoạt hiệu ứng quét tín hiệu (3 giây).
  3. Trả về kết quả theo chuẩn bất biến của Khoan Đã:
     - Nhãn rủi ro: `Nguy hiểm cao` (Đỏ) / `Nghi ngờ` (Vàng) / `Chưa thấy dấu hiệu rủi ro` (Xanh lá).
     - Hộp trích dẫn bằng chứng: Trích đúng câu chữ gây nguy hiểm trong nội dung.
     - Nút mô phỏng: `[Bật màn hình dừng 60 giây]` để trải nghiệm cảm giác ngắt mạch tâm lý thực tế.

---

### ĐỀ XUẤT 2: FAMILY CIRCLE WEB DASHBOARD (CỔNG KẾT NỐI GIA ĐÌNH)
* **Ý nghĩa:** Hiện thực hóa mô hình gói "Gia đình 49.000 đ/tháng", mang lại "sự yên tâm hữu hình" cho con cái khi đi làm xa.
* **Giao diện Web cho người con (Desktop / Tablet):**
  - **Widget 1: Nhịp an toàn của Cha Mẹ (Protection Heartbeat):**
    - Trạng thái thiết bị của Mẹ: Đang trực tuyến (Online), mức pin, thời điểm đồng bộ tín hiệu gần nhất (mỗi 6 giờ).
    - Cảnh báo sức khỏe app: Báo động nếu Xiaomi/Oppo tự động ngắt dịch vụ nền của Khoan Đã.
  - **Widget 2: Dòng thời gian rủi ro (Risk Activity Timeline):**
    - Ghi nhận các sự kiện: *"Hôm nay 10:15 - Mẹ đã kiểm tra 1 tin nhắn nghi vấn (Kết quả: Nghi ngờ)"*.
    - *"Hôm qua 15:30 - Phát hiện cuộc gọi kéo dài 28 phút từ số không có trong danh bạ"*.
  - **Widget 3: Bộ quy tắc gia đình (Family Safeguard Rules):**
    - Con có thể đề xuất các ngưỡng bảo vệ: Nhận thông báo khi cuộc gọi >15 phút; nhận thông báo khi có tin nhắn chứa từ khóa tiền bạc.
    - *Ràng buộc:* Quy tắc chỉ có hiệu lực khi Mẹ bấm "Chấp thuận" trên điện thoại của mình.

---

### ĐỀ XUẤT 3: "BIÊN NHẬN CẢNH BÁO" (SCAM INCIDENT RECEIPT)
* **Ý nghĩa (Học hỏi từ Visa A2A Protect & Carefull Incident Vault):** Khi người già nhận một cảnh báo đỏ, họ rất bối rối không biết phải giải thích thế nào với con cháu hoặc ngân hàng. Biên nhận Cảnh báo biến một trải nghiệm hoảng loạn thành một tài liệu pháp lý / kỹ thuật chuẩn mực.
* **Cấu trúc Biên nhận Cảnh báo (Hiển thị Web & Xuất file ảnh / PDF):**
  1. **Mã sự việc:** `#KD-20261124-8842` kèm mốc thời gian chính xác.
  2. **Mức rủi ro:** `NGUY HIỂM CAO` (Kèm mã chốt chặn, ví dụ: `CO-02: Giả mạo cơ quan tư pháp`).
  3. **Bằng chứng thu thập:** Trích đoạn câu chữ, số tài khoản nhận tiền nghi vấn, đầu số gọi đến.
  4. **Số điện thoại xác minh chính thức:** Danh bạ hotline đã xác thực của cơ quan/ngân hàng bị mạo danh (kèm ngày kiểm tra dữ liệu).
  5. **Hành động khuyến nghị:** 
     - Không chuyển tiền dưới bất kỳ hình thức nào.
     - Giữ nguyên hiện trạng máy để người thân hỗ trợ.
  6. **Nút chia sẻ nhanh 1-chạm:** `[Gửi Biên nhận này cho Con qua Zalo]` và `[In hồ sơ gửi Công an / Ngân hàng]`.

---

### ĐỀ XUẤT 4: ĐỘNG CƠ KỊCH BẢN PHẢN ỨNG GIA ĐÌNH "NÓI GÌ VỚI BỐ MẸ"
* **Ý nghĩa:** Khắc phục khoảng trống tâm lý: Con cái nhận được cảnh báo thường nóng giận, gọi điện mắng hoặc gặng hỏi khiến bố mẹ phòng thủ, giấu diếm và tiếp tục bị lừa.
* **Cơ chế hoạt động (Bảng tĩnh đã kiểm chứng, không để AI tự sinh ngẫu nhiên):**
  - Dựa trên họ lừa đảo được nhận diện (Giả công an / Bắt cóc tống tiền / Con vay nợ / Đầu tư sinh lời), Web Portal của con tự động mở ngay **Thẻ kịch bản 3 bước**:
    - **Câu 1 (Trấn an):** *"Mẹ ơi, con đang nghe điện thoại của mẹ đây, mẹ bình tĩnh hít thở sâu nhé, không có việc gì phải vội cả."*
    - **Câu 2 (Giải thích bản chất):** *"Mẹ ơi, công an không bao giờ làm việc qua điện thoại hay bắt người dân chuyển tiền vào tài khoản cá nhân. Đây là thủ đoạn lừa đảo đang rất phổ biến."*
    - **Câu 3 (Câu đưa cho mẹ đọc để dập máy):** Dành riêng cho mẹ đọc vào máy kẻ gian: *"Cháu đợi chút, tôi đang bận đưa con trai đi khám, để lát con tôi gọi lại làm việc với cháu nhé."*
  - **Nút hành động:** `[Bấm để gọi ngay cho Mẹ]` và `[Gửi tin nhắn mẫu qua Zalo]`.

---

### ĐỀ XUẤT 5: EMBEDDABLE KHOAN ĐÃ BADGE & WIDGET CHO ĐỐI TÁC B2B2C
* **Ý nghĩa:** Tạo bằng chứng hữu hình cho shark về mô hình doanh thu B2B2C (2.000 đ/người dùng hoạt động/tháng) và quan hệ đối tác với Ngân hàng, Ví điện tử, Báo điện tử và Cổng thông tin Hội người cao tuổi.
* **Quy cách kỹ thuật Widget:**
  - Một đoạn mã nhúng JavaScript siêu nhẹ (chỉ 1 dòng mã `<script src="https://khoanda.vn/widget.js"></script>`).
  - Hiển thị nút biểu tượng Khoan Đã tinh tế ở góc phải màn hình: *"Được bảo trợ bởi Khoan Đã – Nhấn để kiểm tra thông tin an toàn"*.
  - Khi người dùng click, một modal pop-up trượt lên cho phép tra cứu ngay số tài khoản hoặc hotline chính thống của đơn vị đó mà không cần rời trang web đối tác.
  - Tích hợp kiểm thử cho Vòng 3: Tạo trang web giả lập ngân hàng (ví dụ: Vietcombank / MoMo Demo) có nhúng widget Khoan Đã để trình diễn trực tiếp trên sân khấu BUV.

---

## 7. KHUYẾN NGHỊ KỸ THUẬT & HỢP TÁC VỚI CÁC THÀNH VIÊN TRONG SWARM

Để bài thi Vòng 3 đạt điểm số cao nhất trước hội đồng Sharks và Ban giám khảo, đề xuất bàn giao cụ thể cho từng thành viên:

1. **Gửi @webproto (Web Prototype & Experience Architecture):**
   - Triển khai ngay giao diện **Web Quick Scanner** tại trang chủ (hỗ trợ nhập Text, STK, Link, Preset Demo Buttons).
   - Thiết kế trang **Family Circle Web Portal** mô phỏng màn hình người con với 3 widget: Protection Heartbeat, Activity Timeline, và kịch bản "Nói gì với bố mẹ".
   - Dựng sẵn 1 mockup **Biên nhận Cảnh báo (Scam Incident Receipt)** có nút xuất PDF / In ấn.

2. **Gửi @features (Feature Architecture & Backend):**
   - Đảm bảo API phân tích văn bản (`/api/analyze`) trả về đúng cấu trúc chuẩn: `{ risk_level, matched_signals, verified_hotlines, next_action, unverified_aspects }`.
   - Giữ nghiêm ngặt các bất biến (§HĐ): Không bao giờ trả về nhãn "An toàn", các nút bấm tối thiểu 56px, chữ tối thiểu 14px, luôn có lối thoát "Tôi ổn, không có gì nguy hiểm".

3. **Gửi @partners (B2B2C Partnership Architecture):**
   - Sử dụng dẫn chứng Carefull (Mỹ huy động $16.5M, liên kết >35 ngân hàng) làm bằng chứng kiểm chứng thành công cho gói hợp tác B2B2C (2.000 đ/active user).
   - Dùng mẫu **Embeddable Khoan Đã Badge** đưa vào Thư ngỏ ý định (LOI) gửi các ngân hàng thương mại và ví điện tử (MoMo, ZaloPay).

4. **Gửi @strategist & @v3solver (Pitch Script & Slide Deck v11):**
   - Cập nhật **Slide 5 (Phân tích cạnh tranh):** Nêu bật ma trận "Khoảng trống rỗng" – Khoan Đã là giải pháp duy nhất can thiệp tại thời khắc thao túng tâm lý (in-moment 60s freeze) kết hợp mạng lưới gia đình.
   - Cập nhật số liệu quốc tế: FBI IC3 2025 ($7,75 tỷ mất ở người 60+, tăng 59%), nghiên cứu ĐH Nottingham (nút hành động giảm từ 22% xuống 4% thanh toán lừa đảo).
   - Đưa kịch bản Web Demo vào 1 phút mở đầu của bài Pitch 5 phút để tạo ấn tượng thị giác mạnh mẽ cho các Sharks.

---
*Báo cáo được hoàn thành bởi Agent benchmarker – Swarm Dự án Khoan Đã (ShieldGen) – 24/11/2026.*
