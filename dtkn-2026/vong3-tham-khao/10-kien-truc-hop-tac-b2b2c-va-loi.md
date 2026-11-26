# 10 – KIẾN TRÚC ĐỐI TÁC B2B2C, MÔ HÌNH GO-TO-MARKET VÀ BỘ HỒ SƠ LOI / PILOT (KHOAN ĐÃ)

> **CẬP NHẬT 26/11/2026 tối (slide v13, bản nộp chính thức) — số dưới đây nếu khác thì theo khối này:**
> - Gói Gia đình: **giá sàn 29.000 đ/tháng** hoặc **299.000 đ/năm** (thay 49.000 / 399.000). Khảo sát của đội 19–26/11/2026: **100 người** (71 con cháu, 29 phụ huynh hoặc người lớn tuổi; phiếu không có nhóm 60+, nhóm tuổi cao nhất là "từ 45"), 91% ở Hà Nội và TP.HCM. Trong 71 con cháu: 32,4% chọn 29.000 đ, 22,5% chọn 49.000 đ, 31,0% dưới 20.000 đ, 14,1% chỉ dùng miễn phí.
> - Tỷ lệ trả phí giả định **10%** (giả định thận trọng, đội chốt lần cuối tối 26/11). Khảo sát: 54,9% con cháu (39/71) chọn trả 29.000 hoặc 49.000 đ; đó là ý định, chưa phải trả thật, nên mô hình chỉ lấy 10%. Biểu đồ tròn mức sẵn sàng trả nằm ở ô H2 trang 5.
> - Kinh tế đơn vị (giả định): biên 24.000 đ/hộ/tháng; tiếp cận quy về hộ trả phí ≈ 200.000 đ; hoàn vốn ≈ 8 tháng (≈ 17 tháng nếu chỉ 5%). Gói năm 299.000 đ: hoàn chi phí tiếp cận ngay tháng 1, dư ≈ 39.000 đ/hộ sau chi phí phục vụ năm đầu.
> - Doanh thu 18 tháng: gói gia đình 86 triệu (gồm tài trợ: 236 triệu); chạy năm T18 ≈ 414 triệu; 58% doanh thu T18 từ tài trợ nhóm. Năm 3 kịch bản cơ sở ≈ 3,1 tỷ/năm (chưa có đối tác cấp phép ≈ 1,9 tỷ).
> - VC năm 5 không đổi: 3,8–10,5 tỷ (500.000–1 triệu người qua đối tác; gốc 1 triệu: 6,3–10,5 tỷ); độ nhạy 250.000 / 500.000 / 1.000.000 người: 2,5 / 3,8 / 6,3 tỷ. Deal giữ **1 tỷ / 10%** (10 tỷ).
> - Gói Doanh nghiệp/Chi nhánh (tài trợ nhóm): từ 50 hộ, 20.000 đ/hộ/tháng = 1 triệu/tháng; hộ được tài trợ tính riêng, không đếm trùng.
> - Đo nội bộ 26/11/2026 (luật 1.6.7): 1.740 bài kiểm thử, 0 lỗi; 931 lượt đo trên 5 bộ mẫu (891 tin gốc + 40 biến thể bỏ dấu).
> - Số khảo sát trên slide: 90% phụ huynh/người lớn tuổi đã từng nhận cuộc gọi, tin lừa (26/29), chỉ 17% nói sẽ hỏi con cháu (5/29); 73% con cháu lo lắng (52/71); 52% muốn được báo ngay về máy mình (37/71); 86% sẵn sàng giới thiệu (86/100).

> **Dự án:** Khoan Đã (ShieldGen) – Giải pháp bảo vệ tài chính và tạo khoảng dừng tâm lý 60 giây cho người cao tuổi (60+) trước lừa đảo trực tuyến.  
> **Tài liệu chiến lược thương mại hóa & Hợp tác:** Phục vụ Vòng 3 Chung kết Đấu trường Khởi nghiệp (ĐTKN 2026) tại BUV (29/11/2026).  
> **Nguyên tắc xuyên suốt (§HĐ):** Mọi số liệu do đội tự tính toán là **GIẢ ĐỊNH** (ghi rõ). Tuân thủ nghiêm ngặt nguyên tắc trung thực: KHÔNG bao giờ dùng nhãn "An toàn" (chỉ dùng "Chưa thấy dấu hiệu rủi ro"), KHÔNG hứa chặn cuộc gọi hay giao dịch, KHÔNG hứa lấy lại tiền. Đội dưới 18 tuổi cần người lớn bảo trợ pháp lý.

---

## MỤC LỤC
1. **Định vị Chiến lược & Điểm chạm B2B2C: Khoảng trống "Tiền chuyển khoản" (Pre-Transfer Gap)**
2. **Kiến trúc Hợp tác Ngân hàng Thương mại & FinTech (MoMo, ZaloPay, VCB, TCB, NAPAS)**
   - 2.1. Tại sao Ngân hàng cần Khoan Đã (Khoảng trống của Sinh trắc học & QĐ 2345)
   - 2.2. Ba mô hình tích hợp kỹ thuật (SDK White-label, API Gateway, Dual-layer)
   - 2.3. Tuân thủ Pháp lý, An toàn Thông tin & Quyền riêng tư (Nghị định 13/2023/NĐ-CP)
   - 2.4. Khung Kinh tế & Bảo vệ Mức giá 2.000 đ/người dùng/tháng
3. **Mô hình Hợp tác Tổ chức Xã hội & Đoàn thể (Hội Người cao tuổi, Hội Phụ nữ, Đoàn Thanh niên, Trường học)**
   - 3.1. Phân vai 4 trụ cột cộng đồng
   - 3.2. Quy trình "Diễn tập 60 giây" (Offline-to-Online Workshop 45 phút)
   - 3.3. Cơ chế Tài trợ Nhóm 20.000 đ/hộ/tháng (CSR & Ngân sách phúc lợi)
4. **Bảo vệ Ma trận 4 Tầng Giá (Pricing Tier Defense) & Kinh tế Đơn vị (Unit Economics)**
5. **Mẫu Thư Ý định Hợp tác Chuẩn mực (Ready-to-Use 1-Page LOI Template)**
6. **Điều khoản Chương trình Thí điểm (Pilot Proposal Terms: 3 tháng / 1.000 hộ)**
7. **Dàn ý Pitch Deck B2B dành cho Ngân hàng & Đối tác Doanh nghiệp (8 Slide Master)**
8. **Bộ Thẻ Tranh biện (Battle Cards) với Sharks về Bài toán Đối tác & Hệ sinh thái**

---

## 1. ĐỊNH VỊ CHIẾN LƯỢC & ĐIỂM CHẠM B2B2C: KHOẢNG TRỐNG "PRE-TRANSFER"

### 1.1. Thực trạng nghịch lý của phòng chống lừa đảo 2026
Theo Ngân hàng Nhà nước (đến 28/9/2026), hơn **1,9 triệu lượt khách hàng** đã dừng hoặc hủy giao dịch khi hệ thống ngân hàng đưa ra cảnh báo. Điều này chứng minh một sự thật khoa học: **Khoảng dừng nhận thức (Cognitive Pause) có hiệu quả cứu tiền vượt trội**.

Tuy nhiên, các giải pháp ngân hàng hiện nay (SIMO, Căn cước công dân gắn chip, Xác thực sinh trắc học khuôn mặt theo Quyết định 2345/QĐ-NHNN) gặp phải một **điểm mù tâm lý chí mạng**:
- **Sinh trắc học chỉ xác thực "Ai là người thực hiện", KHÔNG xác thực "Tại sao người đó chuyển tiền"**. Khi người cao tuổi bị thao túng tâm lý (bị dọa lệnh bắt giam giả mạo, bị cô lập bằng yêu cầu "không được nói cho ai", hoặc bị thúc ép bởi FOMO đầu tư), họ **chính là người tự nguyện đưa mặt vào quét sinh trắc học** và bấm chuyển khoản.
- Cảnh báo của app ngân hàng chỉ xuất hiện ở **bước cuối cùng** (trong luồng giao dịch), khi người già đã bị kích động cực độ và trong trạng thái hoảng loạn ("đường hầm nhận thức" - cognitive tunneling).

```
[ KẺ LỪA ĐẢO ] 
      │ (Gọi điện / SMS / Zalo dọa nạt, thao túng tâm lý)
      ▼
┌─────────────────────────────────────────────────────────────┐
│ KHOẢNG TRỐNG TÂM LÝ 60 GIÂY (PRE-TRANSFER COGNITIVE GAP)    │
│  - Người già run sợ, chưa mở app ngân hàng                   │
│  - Chưa chạm đến lớp sinh trắc học của ngân hàng            │
│  ===> ĐÂY LÀ NƠI KHOAN ĐÃ CAN THIỆP:                        │
│       * Màn dừng 60 giây cưỡng chế suy nghĩ chậm            │
│       * Gọi người thân (con cháu) 1-chạm xác thực           │
│       * Đưa người thứ ba vào cuộc trước khi tiền rời túi    │
└─────────────────────────────────────────────────────────────┘
      │ (Nếu không có Khoan Đã: tự mở app ngân hàng)
      ▼
[ APP NGÂN HÀNG / VÍ ]
      │ (Quét khuôn mặt QĐ 2345 -> Nạn nhân tự quét -> MẤT TIỀN)
      ▼
[ TÀI KHOẢN KẺ GIAN ]
```

### 1.2. Vị thế của Khoan Đã: "Lớp đệm bổ trợ, không phải đối thủ"
Khoan Đã không cố gắng thay thế hệ thống lõi hay app ngân hàng. Khoan Đã đóng vai trò là **"Seatbelt & Airbag" (Dây an toàn & Túi khí)**:
1. Đứng ở **hệ điều hành (OS layer)**: Bắt tín hiệu clipboard (copy số tài khoản lạ, cú pháp chuyển tiền), phát hiện tin nhắn tống tiền / mạo danh VNeID, kích hoạt trước khi mở app ngân hàng.
2. Hoặc **nhúng vào app ngân hàng/ví (SDK layer)**: Trở thành chế độ "Bảo vệ Người cao tuổi / Chế độ Gia đình" (Senior Safety Mode) trong VCB Digibank, MoMo, Techcombank Mobile.

---

## 2. KIẾN TRÚC HỢP TÁC NGÂN HÀNG & FINTECH (MoMo, ZaloPay, VCB, Techcombank, NAPAS)

### 2.1. Động lực Hợp tác từ phía Ngân hàng & FinTech
Tại sao các định chế tài chính lớn phải quan tâm đến một giải pháp độc lập như Khoan Đã?
1. **Tuân thủ Pháp lý & Áp lực Cơ quan Quản lý (NHNN & A05):** Công văn 6190/NHNN-TT (20/7/2026) và các chỉ thị thắt chặt phòng chống lừa đảo đặt trách nhiệm bảo vệ khách hàng lên các tổ chức cung ứng dịch vụ thanh toán.
2. **Cắt giảm Chi phí Khiếu nại & Xử lý Khủng hoảng (Dispute Costs):** Mỗi vụ việc người già bị lừa rút sạch sổ tiết kiệm hàng tỷ đồng gây tốn kém trung bình từ 3.000.000 – 10.000.000 đ chi phí tiếp nhận điều tra, tra soát liên ngân hàng, giải trình cơ quan công an và nguy cơ tổn hại danh tiếng truyền thông nghiêm trọng.
3. **Chỉ số ESG & Trách nhiệm Xã hội (Social Banking):** Giúp ngân hàng ghi điểm tuyệt đối trong các báo cáo phát triển bền vững và tài chính toàn diện (Financial Inclusion) cho người cao tuổi.

### 2.2. Ba Mô hình Tích hợp Kỹ thuật (Technical Integration Paths)

#### Mô hình A: White-label "Khoan Đã Pause SDK" (Nhúng trực tiếp vào Mobile Banking / Ví)
- **Cơ chế hoạt động:** Ngân hàng tích hợp `KhoanDaSafeTransferSDK` vào ứng dụng di động (iOS/Android). Khi phát hiện tài khoản thuộc phân khúc người lớn tuổi (trên 60 tuổi) hoặc kích hoạt "Giao diện thân thiện / Chế độ Cha Mẹ":
  - Luồng chuyển tiền đến số tài khoản mới (chưa có trong danh bạ thụ hưởng) với số tiền vượt ngưỡng quy định (ví dụ > 5.000.000 đ) sẽ kích hoạt **Khoan Đã Pause Modal**.
  - Modal đếm ngược bắt buộc 60 giây, hiển thị 3 câu hỏi cảnh báo trực quan chữ lớn (≥ 16px): *"Có ai đang gọi điện giục bác chuyển tiền không?"*, *"Có ai xưng là Công an / Tòa án yêu cầu giữ bí mật không?"*.
  - Nút gọi khẩn cấp cho "Người giám hộ tài chính" (con cái đã liên kết qua Family Circle) ngay trên giao diện chuyển khoản.
- **Ưu điểm:** Độ phủ tức thì 100% người dùng của ngân hàng; không yêu cầu người già phải cài thêm app ngoài.

#### Mô hình B: Pre-Transfer Risk Intelligence API (Cổng API Xác thực Rủi ro)
- **Cơ chế hoạt động:** Hệ thống ngân hàng kết nối API hai chiều với Khoan Đã Engine:
  - **Endpoint Gửi:** `POST /api/v1/pre-transfer/evaluate` gửi metadata giao dịch (số tài khoản đích đã mã hóa hash, nội dung chuyển khoản, thời gian dừng màn hình).
  - Khoan Đã Engine quét qua 64 tín hiệu hành vi + luật tri thức (bộ luật vi-VN@1.6.5) + danh sách cảnh báo NAPAS/Cục ATTT để trả về điểm rủi ro và mã điều khiển: `PAUSE_60S_REQUIRED`, `CONFIRM_FAMILY`, hoặc `PROCEED_NORMAL`.
  - **Endpoint Phản hồi:** `POST /api/v1/pre-transfer/callback` ghi nhận trạng thái người dùng (họ có dừng lại hay bấm "Tôi ổn" để tiếp tục).

#### Mô hình C: Dual-Layer Ecosystem (App độc lập đồng hành + API Bridge)
- **Cơ chế hoạt động:** Người dùng cài app Khoan Đã độc lập. Khi phát hiện clipboard chứa số tài khoản vừa copy từ tin nhắn rác hoặc cuộc gọi nghi vấn, Khoan Đã đẩy cảnh báo nổi (floating bubble). Đồng thời, nếu người dùng mở app ngân hàng đối tác, một Intent/DeepLink an toàn sẽ thông báo cho app ngân hàng tạm hoãn luồng quét vân tay trong 60 giây.

```
                    KIẾN TRÚC TÍCH HỢP B2B2C NGÂN HÀNG
  ┌─────────────────────────────────────────────────────────────┐
  │                   NGƯỜI DÙNG CAO TUỔI (60+)                  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ Thực hiện chuyển khoản
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ APP NGÂN HÀNG / VÍ ĐIỆN TỬ (VCB / MoMo / Techcombank / ZaloPay)│
  │                                                             │
  │   [Giao dịch chuyển khoản mới > Ngưỡng quy tắc]             │
  │                            │                                │
  │                            ▼                                │
  │       ┌──────────────────────────────────────────────┐      │
  │       │ Khoan Đã Client SDK (White-label Interface)  │      │
  │       │  - Màn dừng 60 giây (Chữ ≥ 16px, Nút ≥ 56px) │      │
  │       │  - 3 câu hỏi gỡ rối tâm lý                   │      │
  │       │  - Nút gọi khẩn cấp cho Con/Cháu (1-tap)    │      │
  │       └──────────────────────┬───────────────────────┘      │
  └──────────────────────────────┼──────────────────────────────┘
                                 │ HTTPS / mTLS (gRPC / REST)
                                 │ Hash SHA-256 (Zero-PII)
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    KHOAN ĐÃ ENTERPRISE GATEWAY              │
  │  - Engine 64 tín hiệu + 26 hiệp đồng + Bộ luật 1.6.5        │
  │  - Kết nối NAPAS Fraud Blacklist & Cục ATTT               │
  │  - Cơ chế ghi nhận xác thực gia đình (Family Auth Ping)     │
  └─────────────────────────────────────────────────────────────┘
```

### 2.3. Tuân thủ Pháp lý, An toàn Thông tin & Quyền Riêng tư
Để được Khối Công nghệ & Khối Rủi ro của ngân hàng phê duyệt, Khoan Đã thiết kế kiến trúc tuân thủ nghiêm ngặt:
1. **Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân:**
   - **Nguyên tắc Không lưu trữ PII (Zero Personally Identifiable Information):** Khoan Đã **KHÔNG BAO GIỜ** thu thập, ghi nhận hay lưu trữ số tài khoản ngân hàng đầy đủ, số dư, tên chủ tài khoản, mã PIN, OTP hay mật khẩu đăng nhập.
   - Dữ liệu gửi lên kiểm tra được băm một chiều (One-way Hash SHA-256 kèm Salt) tại thiết bị trước khi truyền.
   - Nội dung tin nhắn/văn bản quét OCR chỉ xử lý trên bộ nhớ tạm (In-memory Ephemeral Processing), giải phóng ngay sau khi trả kết quả, không lưu log văn bản thô vào database.
2. **Tiêu chuẩn An toàn Đường truyền:** Mã hóa mTLS (Mutual TLS 1.3), ký số giao dịch bằng HMAC-SHA256, API token xoay vòng (rotating bearer tokens).
3. **Cơ chế Fail-Open (Không làm nghẽn giao dịch cốt lõi):** Nếu máy chủ Khoan Đã gặp sự cố hoặc timeout quá 1.500ms, hệ thống tự động rơi về trạng thái mặc định của ngân hàng (Fail-safe open), không chặn đứng dòng tiền của khách hàng bình thường.

### 2.4. Bảo vệ Mức giá 2.000 đ/người dùng hoạt động/tháng (Pricing Defense)
Khi đối chất với Sharks về việc *"Tại sao ngân hàng chịu trả 2.000 đ/tháng/người dùng?"*, sử dụng các luận cứ vững chắc sau:
- **So sánh với Chi phí Thu hút Khách hàng (CAC) và Giữ chân (Retention):** Ngân hàng chi trả từ 150.000 – 300.000 đ để có một tài khoản kích hoạt mới. 2.000 đ/tháng chỉ tương đương **24.000 đ/năm (bằng 0,08% số dư bình quân 30 triệu/sổ tiết kiệm)**.
- **Tiền lệ Thành công Toàn cầu (Analogous Benchmark):** **Carefull (Mỹ)** – Nền tảng B2B2C bảo vệ tài chính cho người cao tuổi đã huy động **16,5 triệu USD Series A (10/2023)**, ký hợp đồng thành công với **hơn 35 tổ chức tài chính** (ngân hàng thương mại và quỹ tín dụng tại Mỹ) theo đúng mô hình thu phí trên mỗi tài khoản bảo vệ.
- **Mô hình tính toán thực tế cho một Ngân hàng cỡ trung (1.000.000 khách hàng 60+):**
  - Doanh thu B2B: 1.000.000 × 2.000 đ = 2 tỷ đ/tháng (24 tỷ đ/năm).
  - Giá trị ngân hàng nhận lại: Giảm thiểu ít nhất 20-40 vụ lừa đảo quy mô lớn (trung bình 300 - 500 triệu/vụ = 6 - 20 tỷ đồng tiền của khách hàng không bị bốc hơi khỏi ngân hàng sang các tài khoản rác ngân hàng khác), giữ vững tiền gửi CASA và tín nhiệm thương hiệu.

---

## 3. MÔ HÌNH HỢP TÁC TỔ CHỨC XÃ HỘI & ĐOÀN THỂ CỘNG ĐỒNG

Khác với các ứng dụng công nghệ thông thường đốt tiền chạy quảng cáo Facebook/Google (CAC lên đến 150.000 - 300.000 đ mà không chạm được người già), **kênh tiếp cận tự nhiên và rẻ nhất của Khoan Đã chính là các Tổ chức Xã hội có sẵn**.

### 3.1. Phân vai 4 Trụ cột Cộng đồng (Grassroots Ecosystem)

| Tổ chức | Quy mô & Hiện diện | Vai trò trong Phễu Phân phối | Giá trị Khoan Đã đem lại cho Họ |
|---|---|---|---|
| **Hội Người cao tuổi (HNCT)** | 14,2 triệu người 60+; chi hội tại 100% tổ dân phố/thôn xóm | Điểm chạm trực tiếp; bảo trợ uy tín để người già tin tưởng cài đặt | Nội dung sinh hoạt thiết thực, thực hiện đề án Chuyển đổi số người cao tuổi |
| **Hội Phụ nữ (HLHPN)** | Mạng lưới tại từng cụm dân cư; "người giữ tay hòm chìa khóa" | Vận động các gia đình, người mẹ, người bà; lan tỏa văn hóa bảo vệ tài chính | Bảo vệ bình yên gia đình, ngăn chặn cảnh mất sạch tiền dưỡng già |
| **Đoàn Thanh niên (ĐTN)** | Lực lượng "Tổ công nghệ số cộng đồng" tại từng phường/xã | Lực lượng xung kích "cầm tay chỉ việc", hỗ trợ cài đặt APK và thiết lập vòng gia đình | Công trình thanh niên cụ thể, chỉ tiêu hỗ trợ kỹ năng số cộng đồng |
| **Trường học & Ban phụ huynh (PTA)** | Hàng chục triệu học sinh, phụ huynh | Kênh "Chiến dịch Con cháu bảo vệ Ông bà" (Homework assignment ý nghĩa) | Giáo dục đạo hiếu, trách nhiệm thế hệ số, gắn kết gia đình |

### 3.2. Quy trình "Diễn tập 60 giây" (O2O Workshop 45 phút)
Một buổi hướng dẫn tại Tổ dân phố / Chi hội Người cao tuổi được đóng gói chuẩn hóa:
- **Thời lượng:** 45 phút (ghép vào 1 tiết sinh hoạt định kỳ chi hội, không làm phiền thêm giờ).
- **Chi phí tổ chức:** Khoảng **1.000.000 đ / buổi** (nước uống, tài liệu in chữ lớn, hỗ trợ 2 tình nguyện viên Đoàn thanh niên).
- **Kết quả đầu ra:** **50 hộ gia đình kích hoạt app và kết nối vòng con cháu** ngay tại chỗ.
  $$\text{Chi phí tiếp cận (CAC cơ sở)} = \frac{1.000.000 \text{ đ}}{50 \text{ hộ}} = 20.000 \text{ đ/hộ kích hoạt}$$

```
                KỊCH BẢN BUỔI HƯỚNG DẪN 45 PHÚT
  ┌─────────────────────────────────────────────────────────────┐
  │ PHÚT 00 - 15: "VẠCH TRẦN 3 CHIÊU LỪA ĐẢO NĂM 2026"         │
  │ - Chiêu 1: Giả danh VNeID / Công an / Viện kiểm sát dọa án. │
  │ - Chiêu 2: Bẫy "nâng cấp tài khoản lương hưu / BHXH".       │
  │ - Chiêu 3: Tin nhắn giả con cháu xin tiền khẩn cấp.         │
  ├─────────────────────────────────────────────────────────────┤
  │ PHÚT 15 - 30: "CẦM TAY CHỈ VIỆC & CÀI ĐẶT TẠI CHỖ"          │
  │ - Đội tình nguyện viên hỗ trợ từng bác cài đặt trong 3 phút. │
  │ - Đặt font chữ cực đại (≥ 16px), ghim widget ngoài màn hình. │
  │ - Điền số điện thoại con cháu làm "Người bảo hộ 1-chạm".    │
  ├─────────────────────────────────────────────────────────────┤
  │ PHÚT 30 - 45: "DIỄN TẬP TÌNH HUỐNG THẬT (MOCK DRILL)"       │
  │ - Gửi một tin nhắn thử nghiệm có kịch bản lừa đảo mẫu.       │
  │ - Hướng dẫn bác nhấn quét -> Màn đỏ dừng 60 giây hiện lên.  │
  │ - Bác bấm nút gọi thử cho con -> Điện thoại con reo báo động.│
  │ - Bác bấm nút "Tôi ổn" để tắt màn hình sau khi bình tĩnh.   │
  └─────────────────────────────────────────────────────────────┘
```

### 3.3. Cơ chế Gói Tài trợ Nhóm 20.000 đ/hộ/tháng (B2B Community Sponsorship)
- **Ai là người trả tiền?**
  1. Doanh nghiệp địa phương hoặc chi nhánh ngân hàng trên địa bàn tài trợ như một hoạt động CSR (Trách nhiệm xã hội) có thương hiệu: *"Chương trình Vì Nụ Cười Người Cao Tuổi – Đồng hành bởi Ngân hàng X"*.
  2. Doanh nghiệp mua gói phúc lợi nhân viên: Doanh nghiệp chi 240.000 đ/năm/nhân viên để bảo vệ cha mẹ của cán bộ nhân viên, giúp nhân viên yên tâm công tác.
  3. Quỹ khuyến học / Quỹ chăm sóc người cao tuổi của phường, xã trích ngân sách sự nghiệp.
- **Quy mô hợp đồng:** Tối thiểu 50 hộ/hợp đồng (1.000.000 đ/tháng = 12.000.000 đ/năm).
- **Tính ổn định:** Doanh thu trả trước theo năm hoặc quý, tỷ lệ rời bỏ (churn rate) cực thấp (< 5%/năm), tạo chân kiềng tài chính vững chắc trước khi mở rộng bán lẻ B2C.

---

## 4. BẢO VỆ MA TRẬN 4 TẦNG GIÁ & KINH TẾ ĐƠN VỊ (PRICING TIER DEFENSE)

### 4.1. Ma trận 4 Tầng Giá Khoan Đã

| Tầng | Tên Gói | Giá Niêm Yết | Đối Tượng Trả | Tính Năng & Quyền Hạn | Cơ Sở Định Giá |
|---|---|---|---|---|---|
| **Tier 1** | **Cứu người (Free Forever)** | **0 đ** | *Miễn phí trọn đời* | Quét link/SMS/OCR; màn dừng 60s; gọi khẩn cấp 1-chạm; nút "Tôi ổn" | **Nguyên tắc đạo đức:** Phần cứu tính mạng tài sản không khóa sau paywall. Tạo phễu SOM. |
| **Tier 2** | **Gia đình (Family Care)** | **29.000 đ/tháng** hoặc **299.000 đ/năm** (v13; bản cũ 49.000 / 399.000) | Con cháu (30–45t) mua bảo vệ cha mẹ | Tối đa 4 người cao tuổi; Quy tắc gia đình; Báo động 3 cấp độ; Báo cáo an tâm tuần | Rẻ hơn Mr. Number (69k/1 máy); 49k bảo vệ **cả nhà 4 người** (≈ 12k/người/tháng). |
| **Tier 3** | **Tài trợ Nhóm (Community)** | **20.000 đ/hộ/tháng** (từ 50 hộ) | Tổ chức, Doanh nghiệp, Hội đoàn (CSR) | Đầy đủ quyền Gói Gia đình; tặng kèm 1 buổi tập huấn & diễn tập 60s tại chỗ | Giá sỉ chiết khấu 59%; thu tiền trước theo năm (240k/hộ/năm); không tốn chi phí digital ads. |
| **Tier 4** | **Lớp dừng Đối tác (B2B2C)** | **2.000 đ/active user/tháng** | Ngân hàng, Ví điện tử, Nhà mạng | White-label SDK nhúng luồng chuyển tiền; Cổng API cảnh báo NAPAS/Cục ATTT | Rẻ bằng 1/100 chi phí xử lý khiếu nại; tiền lệ Carefull Mỹ 16,5M USD với 35+ ngân hàng. |

### 4.2. Bảo vệ Kinh tế Đơn vị (Unit Economics Defense) trước Chất vấn của Sharks

```
      PHÂN TÍCH KINH TẾ ĐƠN VỊ 1 HỘ TRẢ PHÍ (BẢN CŨ 49.000 Đ; v13 = 29.000 Đ, XEM ĐẦU FILE)
  ┌─────────────────────────────────────────────────────────────┐
  │ DOANH THU THUÊ BAO HÀNG THÁNG (ARPU)             49.000 đ   │
  │ Trừ Chi phí Phục vụ Trực tiếp (COGS):                        │
  │   - Máy chủ Cloud / Container:           2.000 đ            │
  │   - Chi phí API LLM (Qwen/DeepSeek):     2.000 đ            │
  │   - Chi phí Viễn thông / SMS OTP dự phòng: 1.000 đ          │
  │ TỔNG CHI PHÍ PHỤC VỤ (COGS)                      - 5.000 đ   │
  ├─────────────────────────────────────────────────────────────┤
  │ LÃI GỘP MỖI THÁNG TRÊN MỖI HỘ (GROSS PROFIT)     44.000 đ   │
  │ (Tỷ suất lợi nhuận gộp: 89,8%)                              │
  └─────────────────────────────────────────────────────────────┘
```

#### Phép tính Thời gian Hoàn vốn CAC (CAC Payback Period):
1. **Chi phí kích hoạt 1 hộ gia đình qua kênh hội đoàn:** 20.000 đ/hộ.
2. **Kịch bản Cơ sở (BẢN CŨ 6%; v13 dùng 10%, khảo sát 55% là ý định, xem đầu file):**
   - Số hộ cần tiếp cận để có 1 hộ trả phí: $1 \div 6\% \approx 16,67 \text{ hộ}$.
   - Chi phí tiếp cận quy về 1 hộ trả phí ($CAC_{\text{paid}}$): $16,67 \times 20.000 \text{ đ} \approx 333.333 \text{ đ}$.
   - Thời gian hoàn vốn:
     $$\text{Thời gian hoàn vốn} = \frac{CAC_{\text{paid}}}{\text{Lãi gộp tháng}} = \frac{333.333 \text{ đ}}{44.000 \text{ đ}} \approx \mathbf{7,6 \text{ tháng (≈ 8 tháng)}}$$
3. **Kịch bản Thận trọng (Tỷ lệ chuyển đổi chỉ đạt 3%):**
   - $CAC_{\text{paid}} = 20.000 \div 3\% \approx 666.667 \text{ đ}$.
   - Thời gian hoàn vốn: $666.667 \div 44.000 \approx \mathbf{15,1 \text{ tháng}}$.
   - *Kết luận:* Ngay cả khi tỷ lệ chuyển đổi tụt xuống 3%, dự án vẫn thu hồi vốn tiếp cận trong vòng 15 tháng (nằm trọn vẹn trong vòng đời sử dụng LTV dự kiến > 36 tháng của một hộ gia đình có người cao tuổi).
4. **Kịch bản Khách hàng Trả trước Cả năm (399.000 đ/năm):**
   - Dòng tiền ròng thu ngay: $399.000 - (12 \times 5.000) = 339.000 \text{ đ}$.
   - Hoàn vốn ngay lập tức ở **Tháng 1**, loại bỏ hoàn toàn rủi ro lưu động.

---

## 5. MẪU THƯ Ý ĐỊNH HỢP TÁC CHUẨN MỰC (1-PAGE LOI TEMPLATE)

*Mẫu văn bản được thiết kế tinh gọn trên đúng 1 trang A4, không phát sinh nghĩa vụ tài chính hay pháp lý bắt buộc, bảo vệ an toàn cho đội học sinh và người bảo trợ.*

```markdown
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập – Tự do – Hạnh phúc
---------***---------

THƯ Ý ĐỊNH HỢP TÁC (LETTER OF INTENT - LOI)
(V/v: Thử nghiệm giải pháp bảo vệ an toàn số và tạo khoảng dừng cho người cao tuổi)

Số: ....../2026/LOI-KD
..., ngày ... tháng ... năm 2026

KÍNH GỬI: BAN ĐIỀU HÀNH DỰ ÁN KHOAN ĐÃ (SHIELDGEN)
- Đại diện Người lớn Bảo trợ Pháp lý: [Họ và tên Giáo viên / Phụ huynh bảo trợ]
- Chức vụ / Đơn vị công tác: [Trường / Cơ quan]
- Số điện thoại liên hệ: [Số điện thoại] - Email: [Email]

BÊN BÀY TỎ Ý ĐỊNH (ĐỐI TÁC):
- Tên đơn vị / tổ chức: ............................................................................
- Địa chỉ trụ sở: ...................................................................................
- Người đại diện: ...................................................................................
- Chức vụ: .........................................................................................
- Điện thoại: ........................................ Email: .......................................

CĂN CỨ NHU CẦU VÀ MỤC TIÊU:
Sau khi tìm hiểu về Dự án Khoan Đã – Ứng dụng hỗ trợ phòng ngừa lừa đảo trực tuyến cho người cao tuổi thông qua cơ chế tạo khoảng dừng nhận thức 60 giây và kết nối xác thực người thân một chạm (tuân thủ nguyên tắc không can thiệp trái phép, không thu thập dữ liệu nhạy cảm trái phép, phần cứu người miễn phí trọn đời).

HAI BÊN CÙNG BÀY TỎ Ý ĐỊNH HỢP TÁC VỚI CÁC NỘI DUNG SAU:

Điều 1. Phạm vi và Hình thức Phối hợp Dự kiến (Đánh dấu chọn các mục phù hợp):
[ ] 1. Thử nghiệm Cộng đồng: Đồng ý tạo điều kiện để Nhóm dự án tổ chức ..... buổi tập huấn kỹ năng số và diễn tập 60 giây thoát bẫy lừa cho khoảng ..... hội viên / người cao tuổi trong thời gian từ tháng .../2026 đến tháng .../2027.
[ ] 2. Thử nghiệm Tài trợ Phúc lợi: Quan tâm xem xét thí điểm Gói Tài trợ Nhóm bảo vệ cha mẹ của cán bộ nhân viên / hội viên (quy mô dự kiến: ..... hộ gia đình, với mức phí tham khảo 20.000 đ/hộ/tháng sau thời gian thử nghiệm miễn phí).
[ ] 3. Kiểm thử Độc lập & Cố vấn Chuyên môn: Đồng ý để chuyên gia / phòng kỹ thuật của đơn vị thực hiện kiểm thử độc lập độ nhạy và tỷ lệ cảnh báo nhầm của Khoan Đã trên bộ dữ liệu giả lập do đơn vị tự chuẩn bị.
[ ] 4. Khảo sát Tích hợp Kỹ thuật (Ngân hàng / FinTech): Phối hợp nghiên cứu tiền khả thi phương án tích hợp Khoan Đã Pause SDK / API vào luồng chuyển khoản an toàn cho khách hàng ưu tiên / người cao tuổi.

Điều 2. Nguyên tắc và Điều kiện Thử nghiệm:
1. Tính chất Tự nguyện: Mọi người cao tuổi và gia đình tham gia đều được phổ biến rõ ràng, có hướng dẫn bằng văn bản chữ lớn và tham gia trên tinh thần hoàn toàn tự nguyện.
2. Bảo vệ Dữ liệu: Tuyệt đối không thu thập mật khẩu, mã OTP, số dư hay dữ liệu cá nhân nhạy cảm của người tham gia theo Nghị định 13/2023/NĐ-CP.
3. Người lớn Giám sát: Mọi hoạt động tiếp xúc thực địa của nhóm học sinh đều có Người lớn bảo trợ đi cùng và chịu trách nhiệm điều phối.

Điều 3. Tính chất Pháp lý của Thư Ý định:
1. Thư này là văn bản ghi nhận sự quan tâm và thiện chí hợp tác ban đầu giữa hai bên, HOÀN TOÀN KHÔNG TẠO RA NGHĨA VỤ PHÁP LÝ RÀNG BUỘC và KHÔNG PHÁT SINH NGHĨA VỤ TÀI CHÍNH BẮT BUỘC cho bất kỳ bên nào.
2. Các cam kết triển khai chính thức (nếu có) sẽ được ký kết bằng Hợp đồng / Thỏa thuận hợp tác riêng biệt sau khi hoàn thành giai đoạn thử nghiệm.
3. Quyền công bố thông tin trong cuộc thi ĐTKN 2026:
   [ ] ĐỒNG Ý cho phép Nhóm Khoan Đã nêu tên và đưa bản chụp Thư này vào hồ sơ dự thi.
   [ ] KHÔNG ĐỒNG Ý nêu tên công khai (chỉ sử dụng số liệu ẩn danh phục vụ thống kê).

ĐẠI DIỆN ĐƠN VỊ / TỔ CHỨC                      ĐẠI DIỆN NGƯỜI LỚN BẢO TRỢ
  (Ký, ghi rõ họ tên và đóng dấu nếu có)              (Ký và ghi rõ họ tên)
```

---

## 6. ĐIỀU KHOẢN CHƯƠNG TRÌNH THÍ ĐIỂM (PILOT PROPOSAL TERMS)
**Tên chương trình:** *Chiến dịch "Khoan Đã 60 Giây – 1.000 Mái Nhà Bình Yên"*  
**Quy mô thí điểm:** 1.000 hộ gia đình có người cao tuổi (60+) tại 2–3 địa bàn quận/huyện hoặc 1 doanh nghiệp / đối tác ngân hàng thí điểm.  
**Thời gian:** 03 tháng (90 ngày) hoàn toàn miễn phí.

### 6.1. Mục tiêu Chương trình Thí điểm
1. **Kiểm chứng Công nghệ Thực tế (Technical Proof):**
   - Đạt tỷ lệ cài đặt thành công và cấu hình người thân ≥ 90% tại các buổi hướng dẫn.
   - Tỷ lệ báo động nhầm (False Alarm Rate) trên thiết bị thực tế duy trì ở mức kiểm soát được (< 5%), không gây phiền toái cho cuộc sống thường nhật.
2. **Kiểm chứng Tác động Nhận thức & Hành vi (Behavioral Proof):**
   - Tối thiểu **80% người cao tuổi** hoàn thành tốt bài diễn tập 60 giây (dừng lại khi thấy màn đỏ, không tự ý bấm chuyển tiền giả lập).
   - Tối thiểu **70% con cháu** xác nhận cảm thấy an tâm hơn về tài chính của bố mẹ sau 30 ngày kích hoạt.
3. **Chuyển đổi Thương mại (Commercial Conversion):**
   - Đạt tỷ lệ tối thiểu 30–50% các tổ chức tài trợ đồng ý chuyển tiếp sang Hợp đồng Tài trợ Nhóm chính thức (20.000 đ/hộ/tháng) sau khi kết thúc 3 tháng miễn phí.

### 6.2. Lộ trình Triển khai 3 Tháng (Timeline & Deliverables)

```
┌────────────────────────────────────────────────────────────────────────┐
│ THÁNG 1: KHỞI ĐỘNG, TẬP HUẤN & THIẾT LẬP VÒNG GIA ĐÌNH                 │
│ - Tuần 1-2: Tiếp xúc cơ sở, chốt danh sách 1.000 hộ tham gia.          │
│ - Tuần 3-4: Tổ chức 20 buổi hướng dẫn (50 hộ/buổi) tại các chi hội.    │
│   Bàn giao tài liệu in chữ lớn, cài app, lưu số người thân 1-chạm.     │
├────────────────────────────────────────────────────────────────────────┤
│ THÁNG 2: DIỄN TẬP TÌNH HUỐNG & ĐO LƯỜNG TƯƠNG TÁC THỰC TẾ              │
│ - Phát động "Tuần lễ Diễn tập Gia đình": Gửi 2 kịch bản mô phỏng an toàn│
│   để kiểm tra phản xạ dừng 60 giây của người dùng.                     │
│ - Gửi Báo cáo An tâm Tuần (Weekly Digest) đầu tiên qua Zalo cho con cái.│
│ - Khảo sát giữa kỳ (CSAT) mức độ hài lòng của 100 hộ ngẫu nhiên.       │
├────────────────────────────────────────────────────────────────────────┤
│ THÁNG 3: TỔNG KẾT TÁC ĐỘNG (SROI), ĐÁNH GIÁ & CHUYỂN ĐỔI HỢP ĐỒNG      │
│ - Xuất Báo cáo Tác động Xã hội (SROI Report) gửi đơn vị đối tác:       │
│   Tổng số cảnh báo đỏ đã phát, số cuộc gọi con cháu thành công.        │
│ - Đề xuất phương án duy trì: Ký Hợp đồng Tài trợ Nhóm (20k/hộ/tháng)   │
│   hoặc hỗ trợ gia đình nâng cấp Gói Gia đình (399k/năm).               │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.3. Trách nhiệm của các Bên trong Thí điểm
- **Trách nhiệm của Đội ngũ Khoan Đã:**
  - Cung cấp miễn phí 1.000 tài khoản đầy đủ tính năng Gói Gia đình trong 3 tháng.
  - Chuẩn bị toàn bộ học liệu, slide trình chiếu chữ lớn và cử tình nguyện viên hướng dẫn tận tay.
  - Vận hành máy chủ ổn định, bảo mật 100% dữ liệu theo NĐ 13/2023/NĐ-CP.
  - Cung cấp đường dây nóng kỹ thuật hỗ trợ con cháu xử lý thắc mắc trong 24/7.
- **Trách nhiệm của Đơn vị Đối tác (Hội đoàn / Doanh nghiệp):**
  - Cung cấp địa điểm sinh hoạt (nhà văn hóa tổ dân phố, hội trường).
  - Thông báo và mời hội viên / cán bộ nhân viên tham dự buổi tập huấn.
  - Cùng nhóm đánh giá tính hữu ích và phản hồi thực tế sau 90 ngày.

---

## 7. DÀN Ý PITCH DECK B2B DÀNH CHO NGÂN HÀNG & ĐỐI TÁC DOANH NGHIỆP (8 SLIDE MASTER)

*Cấu trúc bài thuyết trình chuyên nghiệp được thiết kế để Giám đốc Khối Quản trị Rủi ro (CRO), Giám đốc Khối Khách hàng Cá nhân, hoặc các Sharks có hệ sinh thái Ngân hàng/FinTech gật đầu ngay lập tức.*

### Slide 1: Bối cảnh Khủng hoảng & Khoảng trống Sinh trắc học
- **Tiêu đề:** *Quyết định 2345 & Nghịch lý Lừa đảo: Khi Nạn nhân Tự nguyện Quét Khuôn mặt.*
- **Nội dung trọng tâm:** Số liệu thiệt hại lừa đảo 2025 (> 8.000 tỷ). 1,9 triệu lượt hủy chuyển tiền cho thấy khoảng dừng có tác dụng. Nhưng sinh trắc học không ngăn được thao túng tâm lý. Ngân hàng đang thiếu một "Lớp dừng nhận thức" trước khi khách hàng bấm chuyển tiền.

### Slide 2: Giải pháp Khoan Đã White-Label SDK
- **Tiêu đề:** *Khoan Đã Pause SDK: 60 Giây Bảo Vệ Khách Hàng Cao Tuổi Ngay Trong Ứng Dụng Ngân Hàng.*
- **Nội dung trọng tâm:** Mockup màn hình chuyển tiền MoMo / VCB Digibank hiện lên Khoan Đã Pause Modal chữ lớn khi phát hiện chuyển khoản bất thường. 3 câu hỏi gỡ rối tâm lý + Nút gọi con cháu xác minh tức thì.

### Slide 3: Kiến trúc Kỹ thuật & Bảo mật Cấp Ngân hàng
- **Tiêu đề:** *Zero-PII Architecture: An toàn Tuyệt đối, Không Chạm Dữ liệu Khách hàng.*
- **Nội dung trọng tâm:** Sơ đồ luồng dữ liệu băm SHA-256. Không lưu số tài khoản, không lưu OTP. Cơ chế Fail-Safe (Timeout 1.500ms tự động mở luồng). Tuân thủ 100% Nghị định 13/2023/NĐ-CP và Thông tư 18/2024/TT-NHNN.

### Slide 4: Giá trị Kinh tế cho Ngân hàng (ROI & Risk Reduction)
- **Tiêu đề:** *Chi Phí 2.000 đ/Tháng Để Tiết Kiệm Hàng Trăm Tỷ Chi Phí Khiếu Nại & Rút Tiền.*
- **Nội dung trọng tâm:** So sánh 2.000 đ/tháng/user với chi phí xử lý khiếu nại (Dispute Cost > 500k/vụ). Ngăn chặn dòng tiền CASA bị rút chạy sang tài khoản lừa đảo ngoài hệ thống.

### Slide 5: Uy tín Thương hiệu & Báo cáo ESG
- **Tiêu đề:** *Ngân hàng Tiên phong Trách nhiệm Xã hội: Bảo vệ Thế hệ Dựng xây Đất nước.*
- **Nội dung trọng tâm:** Điểm thưởng ESG (Social Banking). Chứng minh ngân hàng không chỉ chạy theo lợi nhuận mà thực sự chăm lo cho người cao tuổi và tài chính toàn diện.

### Slide 6: Nghiên cứu Điển cứu (Case Study): Bài học từ Carefull (Mỹ)
- **Tiêu đề:** *Mô hình Đã Được Chứng Minh Toàn Cầu: Carefull & 35+ Tổ chức Tài chính.*
- **Nội dung trọng tâm:** Carefull huy động Series A 16,5 triệu USD (10/2023), hợp tác với hàng chục ngân hàng Mỹ để bảo vệ người già. Khoan Đã là đơn vị tiên phong bản địa hóa sâu sắc mô hình này tại Việt Nam.

### Slide 7: Lộ trình Thí điểm Không Rủi ro (Zero-Risk Pilot Roadmap)
- **Tiêu đề:** *Chương trình Sandbox Thí điểm: 3 Tháng, 1 Phân khúc Khách hàng Cao tuổi.*
- **Nội dung trọng tâm:** Thử nghiệm trong môi trường Sandbox hoặc 1 chi nhánh ngân hàng với 1.000 khách hàng 60+. Cam kết không làm gián đoạn hệ thống lõi. Đánh giá tỷ lệ dừng giao dịch lừa đảo trước khi ký hợp đồng mở rộng.

### Slide 8: Lời Kêu gọi Hành động (Call to Action)
- **Tiêu đề:** *Cùng Kiến tạo Kỷ nguyên Ngân hàng Số Nhân văn.*
- **Nội dung trọng tâm:** Ký kết Thư Ý định Hợp tác (LOI) kỹ thuật. Thành lập tổ công tác chung nghiên cứu giải pháp tích hợp SDK.

---

## 8. BỘ THẺ TRANH BIỆN (BATTLE CARDS) VỚI SHARKS VỀ ĐỐI TÁC & HỆ SINH THÁI

### Battle Card 1: Shark hỏi: *"Ngân hàng to như Vietcombank, Techcombank thừa kỹ sư, tại sao họ không tự làm mà phải mua của các em?"*
- **Chiến thuật đáp (30 giây):**
  > *"Thưa Shark, ngân hàng có thừa nguồn lực làm công nghệ giao dịch, nhưng có 3 lý do họ chọn tích hợp thay vì tự xây:*  
  > *Thứ nhất, **khoảng cách tâm lý:** Khách hàng bị lừa thường đang nghi ngờ cả nhân viên ngân hàng (kẻ lừa đảo dọa 'nhân viên ngân hàng thông đồng'). Một giải pháp độc lập mang tính xã hội và gia đình như Khoan Đã tạo sự tin cậy trung lập cao hơn.*  
  > *Thứ hai, **hệ sinh thái xuyên nền tảng:** Ngân hàng chỉ bảo vệ được bên trong app của họ; Khoan Đã bảo vệ ở tầng ngoài (tin nhắn, Zalo, link độc) trước khi người già mở app ngân hàng.*  
  > *Thứ ba, **tiền lệ quốc tế:** Tại Mỹ, các ngân hàng hàng đầu vẫn chọn tích hợp **Carefull** (vừa gọi 16,5 triệu USD) thay vì tự xây, vì giải pháp chuyên biệt về người cao tuổi đòi hỏi nghiên cứu hành vi tâm lý chuyên sâu chứ không chỉ là bài toán viết mã."*

### Battle Card 2: Shark hỏi: *"Các em là học sinh cấp 3, làm sao bước chân vào gặp Tổng Giám đốc Ngân hàng hay Chủ tịch Hội Người cao tuổi để chốt hợp đồng?"*
- **Chiến thuật đáp (30 giây):**
  > *"Thưa Shark, chúng em biết rõ giới hạn tuổi tác của mình, và đó chính là lý do chúng em đứng đây tìm kiếm **Hệ sinh thái của Sharks**:*  
  > *Về mặt sản phẩm, chúng em đã làm xong phần khó nhất của học sinh: bộ luật 1.6.5, app Android chạy thật, và cơ chế bảo vệ không lưu dữ liệu.*  
  > *Nhưng để bước vào ngân hàng hay đoàn thể cấp tỉnh, chúng em cần cánh cửa kết nối của Shark. Chúng em có Người lớn bảo trợ pháp lý và hội đồng cố vấn đi cùng trong mọi cuộc đàm phán.*  
  > *Nếu Shark cam kết mở cánh cửa gặp Khối Rủi ro của 1 ngân hàng đối tác hoặc Hội Người cao tuổi, đó chính là giá trị hệ sinh thái lớn hơn cả 1 tỷ tiền mặt mà chúng em trân trọng quy đổi vào định giá đêm nay."*

### Battle Card 3: Shark hỏi: *"Tại sao lại thu phí B2B 2.000 đ/tháng mà không bán đứt bản quyền SDK một lần?"*
- **Chiến thuật đáp (25 giây):**
  > *"Thưa Shark, phòng chống lừa đảo không phải một phần mềm đóng gói tĩnh, mà là một **cuộc chiến trí tuệ liên tục thay đổi** (Continuous Threat Intelligence).*  
  > *Kẻ lừa đảo đổi kịch bản mỗi tuần: từ phạt nguội sang dọa VNeID rồi đến lương hưu. Mức phí 2.000 đ/tháng/người dùng là chi phí duy trì để Khoan Đã liên tục cập nhật bộ luật tri thức, vận hành hạ tầng phân tích thời gian thực và kết nối dữ liệu lừa đảo mới nhất. Bán đứt sẽ khiến sản phẩm lỗi thời sau 6 tháng; mô hình SaaS/Licensing định kỳ giúp dòng tiền dự án bền vững và nhà đầu tư có doanh thu định kỳ trọn đời (ARR)."*

### Battle Card 4: Shark hỏi: *"Nếu nTrust của Hiệp hội An ninh mạng Quốc gia đang phát miễn phí, làm sao các em bán được gói Tài trợ Nhóm 20.000 đ cho các hội đoàn?"*
- **Chiến thuật đáp (30 giây):**
  > *"Dạ thưa Shark, nTrust là nỗ lực rất tuyệt vời của Hiệp hội trong việc truy vết số tài khoản và quét mã độc. Tuy nhiên, **nTrust chỉ phục vụ người biết dùng công nghệ và tự tra cứu**.*  
  > *Người già 60+ khi bị dọa thì tay run, mắt mờ, không nhớ ra mở nTrust để kiểm tra. Khoan Đã khác biệt hoàn toàn ở **vòng kết nối gia đình** và **màn dừng ép buộc 60 giây**: con cái được nhận báo động, và người già được bấm nút gọi con ngay lập tức.*  
  > *Tổ chức trả 20.000 đ không phải để mua một bộ quét virus, mà là **mua một giải pháp an tâm gia đình trọn gói**, kèm một buổi diễn tập hướng dẫn tận tay tại chỗ cho hội viên."*

---

## 9. KẾ HOẠCH HÀNH ĐỘNG TRIỂN KHAI TỨC THÌ (TRƯỚC 26/11 & 29/11)

| Mốc Thời Gian | Đầu Việc Cụ Thể | Người Thực Hiện | Mục Tiêu Nghiệm Thu |
|---|---|---|---|
| **24/11 - 25/11** | In 5 bản Thư Ý định (LOI) theo mẫu Mục 5; liên hệ Chi hội Người cao tuổi & 1 Doanh nghiệp quen biết để ký kết | Đội dự án + Người lớn bảo trợ | Có ít nhất **1–2 bản LOI ký thật** có chữ ký/đóng dấu để chụp ảnh đưa vào hồ sơ |
| **25/11 (Trước 22h)** | Đưa số liệu LOI đã ký vào Slide 8 & Slide 11 của Proposal v11 | Phụ trách Slide (`build-v10.py` / `build-v11.py`) | Slide hiển thị bằng chứng đối tác thực tế, xóa bỏ điểm yếu "chưa có đối tác" |
| **26/11 (23h00)** | Nộp hồ sơ Proposal v11 chính thức cho Ban Tổ chức ĐTKN 2026 | Trưởng nhóm | Đúng hạn thể lệ, không bị trừ điểm nộp muộn |
| **27/11 - 28/11** | Luyện tập Battle Cards Mục 8, đo giờ phản xạ 20-30s cho từng câu hỏi | Cả đội | Thuộc làu lập luận định giá, bảo vệ mức giá 49k/20k/2k và đối tác B2B |
| **29/11** | Chung kết ĐTKN 2026 tại BUV: Thuyết trình 5 phút + Đàm phán 3 phút | Đại diện thuyết trình | Chốt Deal thành công với định giá Post-money dẫn đầu cuộc thi |

---
*Tài liệu được biên soạn đồng bộ với Proposal v10/v11 và Bộ tài liệu Thẩm định Nguồn ĐTKN 2026.*
