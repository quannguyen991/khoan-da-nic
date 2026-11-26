# BÁO CÁO NGHIÊN CỨU CÔNG NGHỆ CHỐNG LỪA ĐẢO TOÀN CẦU 2025/2026 & BẢN THIẾT KẾ ĐỘT PHÁ CHO KHOAN ĐÃ (SHIELDGEN)
## TÀI LIỆU CHIẾN LƯỢC CHO VÒNG 3 ĐẤU TRƯỜNG KHỞI NGHIỆP 2026

---

### MỤC LỤC
1. **Tóm tắt điều hành: Sự chuyển dịch mô hình chống lừa đảo toàn cầu 2025–2026**
2. **Mổ xẻ 4 đỉnh cao công nghệ & khung pháp lý quốc tế:**
   - 2.1. Singapore ScamShield (IMDA / Cảnh sát Quốc gia / GovTech): Tầng tin cậy chính phủ & AI phân loại đa kênh.
   - 2.2. Nhật Bản (Cơ quan Cảnh sát Quốc gia NPA & Hệ thống ATM Ngân hàng): Camera AI thị giác máy tính & Phanh gián đoạn giao dịch khi đang nghe điện thoại (*Tokushu Sagi*).
   - 2.3. Mỹ (Carefull / Aura / LifeLock): Cảm biến vi mô chiếm đoạt tài khoản (Account Takeover) & Viễn trắc hành vi bảo vệ người cao tuổi.
   - 2.4. Vương quốc Anh (Payment Systems Regulator - PSR Mandatory Reimbursement): Cơ chế hoàn tiền bắt buộc 50:50, ngoại lệ người yếu thế & Vai trò của bằng chứng phần mềm.
3. **4 Tính năng "Vũ khí Huỷ diệt" (Killer Features) thiết kế riêng cho bối cảnh Việt Nam**
   - Tính năng 1: **In-Call Banking Co-Pilot & Acoustic Freeze** (Phanh tâm lý đa trạng thái: Đang nghe máy + Mở app ngân hàng).
   - Tính năng 2: **VietQR Semantic Deep-Inspector** (Bóc tách ngữ nghĩa mã VietQR & Phát hiện tài khoản rác).
   - Tính năng 3: **Biên nhận Biến cố Số 72H (Forensic Incident Receipt)** (Chuỗi bằng chứng pháp lý bảo vệ nạn nhân theo chuẩn PSR).
   - Tính năng 4: **Chìa khóa Thứ hai / Vòng Kim Cô Tài chính (Dual-Key Family Co-Sign)** (Giải quyết nghịch lý sinh trắc học QĐ 2345).
4. **Luận cứ chiến lược hạ gục Sharks tại Vòng Chung kết BUV**

---

## 1. TÓM TẮT ĐIỀU HÀNH: SỰ CHUYỂN DỊCH MÔ HÌNH TOÀN CẦU 2025–2026

Giai đoạn 2020–2024, các giải pháp an ninh mạng chủ yếu dựa vào **danh sách đen (Blacklist)**, **chặn cuộc gọi rác (Spam Filtering)** và **tuyên truyền nhận thức**. Tuy nhiên, bước sang 2025–2026, các tổ chức tội phạm xuyên quốc gia đã nâng cấp thủ đoạn với Deepfake AI, kịch bản thao túng tâm lý chuyên sâu qua OTT (Zalo, Telegram, WhatsApp) và tài khoản ngân hàng rác mở tự động (Mule accounts).

Thế giới đã tạo ra 4 bước ngoặt mang tính cách mạng:
1. **Từ "Chặn tĩnh" sang "Gián đoạn hành vi thời gian thực (Behavioral Interruption)":** Nhật Bản dùng AI camera nhận diện cử chỉ nghe điện thoại ngay tại cây ATM để khoá giao dịch tức thì.
2. **Từ "Cảnh báo một mình" sang "Tầng bảo trợ thể chế & Gia đình":** Singapore ScamShield và Carefull (Mỹ) tạo ra mạng lưới liên kết chặt chẽ giữa chính quyền, ngân hàng và người thân bảo hộ.
3. **Từ "Trách nhiệm nạn nhân" sang "Trách nhiệm chia sẻ ngân hàng (50:50 Shared Liability)":** Luật PSR của Vương quốc Anh (có hiệu lực 07/10/2024) buộc ngân hàng chuyển và ngân hàng nhận chia đều chi phí bồi thường (tối đa £85.000) trong vòng 5 ngày làm việc, trừ khi chứng minh được lỗi cẩu thả nghiêm trọng (Gross Negligence) – và người cao tuổi được miễn trừ lỗi này!
4. **Nghịch lý sinh trắc học:** Nhận diện khuôn mặt (FaceID / Quyết định 2345 tại Việt Nam) chỉ xác nhận **danh tính**, không xác nhận **ý chí tự do**. Nạn nhân bị đe dọa vẫn tự tay quét khuôn mặt để chuyển tiền.

**Khoan Đã (ShieldGen) tích hợp trọn vẹn 4 tinh hoa này để trở thành giải pháp phòng thủ hành vi đầu tiên tại Việt Nam.**

---

## 2. MỔ XẺ 4 ĐỈNH CAO CÔNG NGHỆ & KHUNG PHÁP LÝ QUỐC TẾ

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      4 HÌNH MẪU ĐỘT PHÁ TOÀN CẦU 2025-2026                       │
├────────────────────┬────────────────────┬───────────────────┬────────────────────┤
│ SINGAPORE          │ NHẬT BẢN           │ HOA KỲ            │ VƯƠNG QUỐC ANH     │
│ ScamShield Suite   │ ATM AI Camera      │ Carefull / Aura   │ PSR Reimbursement  │
├────────────────────┼────────────────────┼───────────────────┼────────────────────┤
│ Tầng tin cậy CP,   │ Phát hiện nghe     │ Viễn trắc hành vi │ Bồi thường 50:50,  │
│ AI OCR màn hình,   │ điện thoại tại cây │ tài chính người   │ bằng chứng số giải │
│ kênh cảnh báo bot  │ ATM -> Khóa lệnh   │ già, phân quyền mở│ cứu người yếu thế  │
└────────────────────┴────────────────────┴───────────────────┴────────────────────┘
```

### 2.1. SINGAPORE SCAMSHIELD (IMDA / SPF / GovTech)
* **Bản chất hệ thống:** ScamShield là hệ sinh thái phòng chống lừa đảo cấp quốc gia của Singapore, kết hợp giữa Cơ quan Phát triển Truyền thông Infocomm (IMDA), Lực lượng Cảnh sát Singapore (SPF), Hội đồng Phòng chống Tội phạm Quốc gia (NCPC) và đơn vị công nghệ chính phủ Open Government Products (OGP).
* **Kiến trúc công nghệ nổi bật 2025/2026:**
  - **Tầng tin cậy chính phủ (Government Trust Tier):** Quản lý nghiêm ngặt Singapore SMS Sender ID Registry (SSIR). Bất kỳ tin nhắn nào mạo danh cơ quan công quyền đều bị chặn từ cấp độ trạm phát sóng viễn thông.
  - **Bộ phân loại AI trên thiết bị (On-Device AI Classifier):** Thay vì chỉ dựa vào số điện thoại, ScamShield sử dụng mô hình học máy phân tích cấu trúc ngôn ngữ và văn phong hối thúc, giục giã trong tin nhắn.
  - **Giải pháp tiếp nhận đa kênh qua OTT:** Do các ứng dụng OTT (WhatsApp, Telegram) mã hoá đầu cuối (E2EE) không thể tự động can thiệp, ScamShield cung cấp tính năng cho phép người dân **chụp ảnh màn hình cuộc trò chuyện và gửi vào app/bot**. AI OCR tự động trích xuất nội dung, đối chiếu mẫu thủ đoạn và trả lời trong 3 giây.
* **Bài học cho Việt Nam:** Người cao tuổi Việt Nam chủ yếu bị dẫn dụ qua Zalo/Telegram. Khoan Đã không thể và không nên xâm phạm mã hoá Zalo, mà giải quyết bằng **cơ chế chụp ảnh màn hình 1 chạm + bong bóng nổi Android + Web Quick Scanner**.

---

### 2.2. NHẬT BẢN: ATM AI CAMERA & PHANH GIÁN ĐOẠN GIAO DỊCH (Tokushu Sagi)
* **Bối cảnh:** Tội phạm lừa đảo đặc biệt (*Tokushu Sagi*, đặc biệt là chiêu thức *Ore-ore sagi* - "Con đây mẹ ơi") gây thiệt hại hàng trăm triệu USD mỗi năm tại Nhật. Nạn nhân là các cụ già bị kẻ gian gọi điện thoại liên tục, hướng dẫn ra cây ATM để chuyển tiền "phí bảo hiểm / tiền bảo lãnh".
* **Đột phá công nghệ của Cảnh sát & Ngân hàng Nhật (Hitachi / Fujitsu / OKI):**
  - **AI Computer Vision Camera tại ATM:** Camera tích hợp sâu tại cây ATM không chỉ dùng để ghi hình an ninh, mà chạy mô hình AI nhận diện tư thế và hành vi người dùng theo thời gian thực.
  - **Quy tắc kích hoạt phanh khẩn cấp:** Nếu AI phát hiện khách hàng **vừa thao tác trên màn hình ATM vừa áp điện thoại lên tai** (hoặc chăm chú nhìn màn hình điện thoại đang sáng), hệ thống lập tức đánh giá là **Nguy cơ lừa đảo cực cao (High Risk)**.
  - **Phản ứng can thiệp:** Cây ATM tự động **đóng băng giao dịch (Freeze Transaction)**, màn hình chuyển sang video cảnh báo toàn phần cỡ lớn do người nổi tiếng/cảnh sát nói: *"CẢNH BÁO! Bạn đang bị lừa đảo qua điện thoại! Hãy cúp máy ngay lập tức!"*, đồng thời còi báo động tại quầy reo lên để nhân viên ngân hàng trực tiếp chạy ra hỗ trợ.
* **Bài học cho Khoan Đã:** Đây chính là bản sao vật lý của triết lý Khoan Đã! Khoan Đã tái hiện trải nghiệm này ngay trên smartphone: Khi điện thoại của bác **đang trong cuộc gọi bất thường + bác mở ứng dụng ngân hàng**, Khoan Đã sẽ hiện ngay màn hình **Khoan Đã 60 giây**, ngắt đứt sợi dây thao túng của kẻ lừa đảo.

---

### 2.3. HOA KỲ: CAREFULL / AURA / LIFELOCK – VIỄN TRẮC HÀNH VI & BẢO VỆ NGƯỜI CAO TUỔI
* **Bối cảnh:** FBI IC3 ghi nhận người 60+ tại Mỹ mất 7,75 tỷ USD năm 2025. Carefull huy động 16,5 triệu USD Series A để xây dựng nền tảng "Financial Caregiving", trong khi Aura và LifeLock chi phối thị trường bảo vệ danh tính gia đình.
* **Cơ chế tín hiệu chiếm đoạt tài khoản (Account Takeover - ATO Signals):**
  - **Phân tích hành vi lệch chuẩn (Behavioral Baseline Anomaly):** Không kiểm tra số tiền cố định, mà học thói quen của người già: Bác thường chỉ chuyển tiền cho con vào ngày 5 hàng tháng, số tiền dưới 3 triệu. Một lệnh chuyển 50 triệu lúc 21h tối vào một tài khoản ngân hàng số mới mở lập tức kích hoạt báo động đỏ.
  - **Phân quyền bất đối xứng (Asymmetric Permissions):** Bác giữ quyền tự chủ cao nhất. Con cái được cấp quyền "Giám sát viên tin cậy" (Trusted Advocate), chỉ nhìn thấy tín hiệu cảnh báo rủi ro chứ không được xem sao kê chi tiết hay can thiệp số dư, xoá bỏ định kiến "con cái muốn dòm ngó tài sản cha mẹ".
  - **ScamCheck Portal:** Công cụ web cho phép con cái cùng cha mẹ kiểm tra nhanh mọi đường link, hóa đơn thanh toán giả mạo hay email tống tiền.
* **Bài học cho Khoan Đã:** 
  - Đưa mô hình Family Circle vào Khoan Đã: Con cái quản lý trên Web Dashboard, cha mẹ dùng app Android cực kỳ tối giản.
  - Tôn trọng quyền tự chủ của người cao tuổi: Bác có quyền tắt chia sẻ bất cứ lúc nào, luôn có nút thoát "Tôi ổn".

---

### 2.4. VƯƠNG QUỐC ANH: PSR MANDATORY REIMBURSEMENT MODEL (Luật có hiệu lực 07/10/2024)
* **Quy định mang tính bước ngoặt của Cơ quan Quản lý Hệ thống Thanh toán (PSR):**
  - **Bồi thường bắt buộc trong 5 ngày:** Nạn nhân của các vụ lừa đảo thanh toán đẩy được ủy quyền (APP Scams - Authorized Push Payment) phải được hoàn tiền trong vòng 5 ngày làm việc.
  - **Mức trần bồi thường:** Lên tới **£85.000** (khoảng 2,8 tỷ đồng) cho mỗi vụ việc.
  - **Chia đôi trách nhiệm (50:50 Split):** Chi phí bồi thường được **chia đều 50% cho ngân hàng gửi và 50% cho ngân hàng nhận (nơi chứa tài khoản rác của kẻ lừa đảo)**. Điều này tạo áp lực kinh tế khổng lồ buộc tất cả ngân hàng phải thanh lọc tài khoản rác.
* **Ngoại lệ Tiêu chuẩn cẩn trọng (Standard of Caution) & Người yếu thế:**
  - Ngân hàng chỉ được từ chối bồi thường nếu chứng minh được khách hàng phạm lỗi **"Cẩu thả nghiêm trọng" (Gross Negligence)**.
  - **ĐIỀU KHOẢN ĐẶC BIỆT CHO NGƯỜI CAO TUỔI (VULNERABLE CONSUMERS):** Tiêu chuẩn cẩu thả nghiêm trọng **KHÔNG ÁP DỤNG cho người yếu thế** (người già bị suy giảm nhận thức, chịu áp lực tinh thần, khủng hoảng gia đình). Ngân hàng BẮT BUỘC PHẢI BỒI THƯỜNG 100%!
* **Vai trò sinh tử của Bằng chứng Phần mềm (Software Evidence):**
  - Để đòi quyền lợi bồi thường hoặc yêu cầu ngân hàng phong toả tài khoản trong 30 phút vàng, nạn nhân phải chứng minh: *Tôi đã bị thao túng tâm lý, tôi đã chịu áp lực đe doạ.*
  - Báo cáo biến cố, nhật ký cuộc gọi và bản lưu cảnh báo từ phần mềm bảo vệ chính là **tài liệu pháp lý số** giúp các cơ quan điều tra và ngân hàng hoàn tất thủ tục bồi thường.

---

## 3. 4 TÍNH NĂNG "VŨ KHÍ HUỶ DIỆT" THIẾT KẾ RIÊNG CHO VIỆT NAM

Dựa trên nghiên cứu 4 đỉnh cao thế giới, đây là 4 tính năng được nội địa hoá hoàn hảo cho các "đặc sản lừa đảo" tại Việt Nam (Zalo, VietQR, Telegram, SIM rác):

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   4 TÍNH NĂNG ĐỘT PHÁ NỘI ĐỊA HÓA CỦA KHOAN ĐÃ                  │
├──────────────────────────┬───────────────────────────────────────────────────────┤
│ 1. In-Call Banking Co-Pilot│ Bắt trạng thái: Đang nghe máy Zalo/SIM + Mở app bank│
│ 2. VietQR Semantic Check │ Bóc tách BIN, STK, Nội dung chuyển khoản nhạy cảm     │
│ 3. Biên nhận Biến cố 72H │ Hồ sơ pháp lý số chuẩn hóa theo PSR gửi Công an/Bank  │
│ 4. Chìa khóa Thứ hai     │ Xác nhận kép gia đình cho giao dịch >5 triệu          │
└──────────────────────────┴───────────────────────────────────────────────────────┘
```

---

### TÍNH NĂNG 1: IN-CALL BANKING CO-PILOT & ACOUSTIC FREEZE
*(Phanh tâm lý cuộc gọi & Giao dịch đồng thời – Học hỏi từ AI Camera ATM Nhật Bản)*

* **Giải quyết bài toán Việt Nam:** Kẻ lừa đảo đóng giả công an/viện kiểm sát luôn yêu cầu: *"Bác không được cúp máy, vừa nghe vừa mở app ngân hàng ra chuyển tiền vào tài khoản tạm giữ để thanh tra"*. Nạn nhân bị cô lập hoàn toàn.
* **Cơ chế hoạt động:**
  1. **Lắng nghe trạng thái thiết bị (Không đọc nội dung thoại để bảo mật):** Dịch vụ nền Android của Khoan Đã chỉ giám sát 2 trạng thái: (1) `isCallActive == true` (cuộc gọi viễn thông hoặc cuộc gọi VoIP Zalo/Telegram kéo dài >10 phút) VÀ (2) Người dùng mở một ứng dụng nằm trong `BANKING_APP_WHITELIST` (Vietcombank, Techcombank, BIDV, MB, MoMo, ZaloPay).
  2. **Kích hoạt Phanh Khẩn Cấp:** Ngay khi app ngân hàng vừa bật lên, Khoan Đã lập tức phủ một lớp màn hình bán phần:
     - **Dòng chữ cực lớn:** *"Khoan Đã! Bác đang vừa nghe điện thoại vừa mở ngân hàng! Cơ quan nhà nước KHÔNG BAO GIỜ yêu cầu chuyển tiền qua điện thoại."*
     - **Bộ đếm ngược 60 giây bắt buộc.**
     - **Nút "Cứu nguy" phát chuông giả:** Bác có thể bấm để app phát tiếng còi báo cháy hoặc chuông cửa reo vang, giúp bác có cớ lịch sự nói vào máy kẻ gian: *"Nhà tôi có khách bấm chuông, tôi phải ra mở cửa đã!"* và dập máy.
     - **Nút gọi khẩn cấp cho con trai/con gái 1-chạm.**

---

### TÍNH NĂNG 2: VIETQR SEMANTIC DEEP-INSPECTOR
*(Quét sâu ngữ nghĩa mã VietQR & Tài khoản rác – Học hỏi từ ScamShield & SIMO)*

* **Giải quyết bài toán Việt Nam:** Kẻ lừa đảo ngày nay không đọc số tài khoản dài dòng mà gửi một mã ảnh **VietQR** qua Zalo với nội dung chuyển khoản được mã hoá sẵn. Người già dùng chức năng quét QR trong app ngân hàng và bấm chuyển mà không đọc kỹ nội dung.
* **Cơ chế hoạt động:**
  1. **Bóc tách chuẩn EMVCo của VietQR:** Khi người dùng chụp ảnh màn hình hoặc chia sẻ ảnh VietQR vào Web Quick Scanner / App Khoan Đã, hệ thống giải mã chuỗi ký tự tiêu chuẩn:
     - Tag 38: Thông tin tài khoản thụ hưởng (Mã định danh ngân hàng BIN + Số tài khoản).
     - Tag 53: Loại tiền tệ (704 = VND).
     - Tag 54: Số tiền giao dịch.
     - Tag 62: Nội dung chuyển khoản (Purpose of Transaction).
  2. **Động cơ phân tích 3 lớp:**
     - *Lớp 1 (Từ khoá bẫy tâm lý):* Quét Tag 62 tìm các mẫu: "nop phat nguoi", "tam giu", "xac minh tai khoan", "phi nhan thuong", "hoan tat ho so".
     - *Lớp 2 (Đối chiếu SIMO / nTrust):* Tra cứu tức thì số tài khoản thụ hưởng với CSDL tài khoản rác/nghi vấn gian lận.
     - *Lớp 3 (Ngân hàng số mới thành lập):* Cảnh báo nếu tài khoản thụ hưởng thuộc các đầu số ngân hàng số thường bị lợi dụng để mở tài khoản ảo.
  3. **Kết quả trả về:** Hiển thị trực quan: Tên chủ tài khoản, ngân hàng, số tiền, và nhãn cảnh báo đỏ nếu phát hiện dấu hiệu lừa đảo, kèm hotline chính thức của ngân hàng đó.

---

### TÍNH NĂNG 3: BIÊN NHẬN BIẾN CỐ SỐ 72H (TAMPER-EVIDENT FORENSIC INCIDENT RECEIPT)
*(Chuỗi bằng chứng pháp lý bảo vệ nạn nhân theo tinh thần PSR – Anh Quốc)*

* **Giải quyết bài toán Việt Nam:** Khi người già bị lừa hoặc suýt bị lừa, họ hoảng loạn, xóa tin nhắn vì sợ con mắng, đến ngân hàng trình báo thì nhân viên không tiếp nhận vì thiếu bằng chứng.
* **Cơ chế hoạt động:**
  1. Khi một phiên rủi ro mức `Nguy hiểm cao` xảy ra, Khoan Đã tự động lập một **Hồ sơ Biến cố Số (Digital Incident Dossier)** mã hoá cục bộ:
     - Mã số hồ sơ: `#KD-VN-202611-XXXX`.
     - Dấu thời gian (Timestamp) chính xác đến từng giây.
     - Tóm tắt cuộc gọi: Thời lượng, đầu số hoặc tên hiển thị trên Zalo.
     - Trích đoạn bằng chứng lừa đảo đã phát hiện (ví dụ: yêu cầu chuyển tiền gấp vào tài khoản lạ).
     - Mã quy tắc chốt chặn vi phạm (Critical Override `CO-01`..`CO-10`).
  2. **Định dạng chuẩn nộp cơ quan chức năng:**
     - Cho phép xuất file PDF/Ảnh 1-chạm chuẩn mẫu: **"Phiếu Ghi Nhận Sự Cố Nghi Vấn Gian Lận Công Nghệ Cao"**.
     - Có sẵn thông tin liên hệ khẩn cấp: Hotline A05 Bộ Công an, Đường dây nóng Phòng An ninh mạng Công an tỉnh/thành phố, và Tổng đài Tra soát Ngân hàng liên quan.
  3. **Bằng chứng giải cứu người yếu thế:** Bác cầm biên nhận này đến ngân hàng là bằng chứng thép chứng minh giao dịch bị thao túng tâm lý ngoài ý muốn, hỗ trợ thủ tục tra soát và kích hoạt bảo hiểm an tâm số.

---

### TÍNH NĂNG 4: CHÌA KHÓA THỨ HAI / VÒNG KIM CÔ TÀI CHÍNH (DUAL-KEY FAMILY CO-SIGN)
*(Xác nhận kép gia đình cho giao dịch lớn – Học hỏi từ Carefull & Quyết định 2345)*

* **Giải quyết bài toán Việt Nam:** Quyết định 2345/QĐ-NHNN bắt buộc sinh trắc học với giao dịch >10 triệu đồng, nhưng hoàn toàn vô hiệu khi kẻ lừa đảo đang thôi miên người già qua điện thoại.
* **Cơ chế hoạt động:**
  1. **Quy tắc thỏa thuận tự nguyện 2 thế hệ:** Trong gói Gia đình, cha mẹ và con cái cài đặt một ngưỡng an toàn (ví dụ: bất kỳ giao dịch nào >5.000.000 VNĐ thực hiện trong hoặc ngay sau cuộc gọi số lạ).
  2. **Cửa sổ xác nhận 15 phút (15-Minute Co-Signing Window):**
     - Khi giao dịch vượt ngưỡng được khởi tạo, hệ thống gửi một thông báo đẩy khẩn cấp (Push Alert) kèm tin nhắn Zalo đến người con: *"Bố đang chuẩn bị chuyển 15.000.000 đ tới STK ngân hàng lạ. Bố mẹ đã bật chế độ bảo vệ kép. Nhấn để gọi bố hoặc xác nhận an toàn."*
     - Trên máy của bố, màn hình hiển thị lời nhắn ấm áp: *"Giao dịch này đang chờ con trai xem cùng bác. Bác uống một ngụm nước ấm, con trai sẽ gọi lại cho bác ngay nhé!"*
  3. **Bẻ gãy mắt xích "Gấp gáp & Cô lập":** Kẻ lừa đảo không thể duy trì kịch bản hoảng loạn khi người con lập tức gọi điện can thiệp.

---

## 4. LUẬN CỨ CHIẾN LƯỢC HẠ GỤC SHARKS TẠI VÒNG CHUNG KẾT BUV (29/11/2026)

Khi trình bày trước các Sharks, đội ngũ Khoan Đã có thể sử dụng trọn vẹn 3 luận cứ quốc tế đắt giá này:

1. **Vũ khí đập tan câu hỏi: "Tại sao ngân hàng không tự làm mà phải cần Khoan Đã?":**
   - *"Thưa các Shark, ngân hàng bị trói buộc bởi 2 giới hạn: Bí mật ngân hàng (không thể tự tiện nhắn tin cho con cái của khách hàng) và 'Điểm mù viễn thông' (app ngân hàng không thể biết khách hàng đang nghe cuộc gọi đe dọa trên Zalo hay vừa bị cài file APK gián điệp). Khoan Đã chính là chiếc Camera AI ATM của Nhật Bản thu nhỏ vào chiếc điện thoại, đứng ngoài để bảo vệ quyết định của người dùng trước khi họ bước vào quầy giao dịch số."*
2. **Vũ khí bảo vệ định giá 10 tỷ (Post-money):**
   - *"Tại Mỹ, Carefull chỉ làm phần mềm giám sát tài chính gia đình B2B2C cho ngân hàng đã được định giá hàng chục triệu USD và huy động 16,5 triệu USD. Tại Anh, luật PSR 2024 buộc các ngân hàng phải chịu 50% trách nhiệm bồi thường, biến việc phòng ngừa lừa đảo từ chi phí CSR thành bài toán sống còn về lợi nhuận. Thị trường Việt Nam với 14,2 triệu người cao tuổi và hàng nghìn tỷ đồng thiệt hại mỗi năm là mỏ vàng chưa được khai phá cho mô hình bảo trợ gia đình B2B2C của Khoan Đã."*
3. **Vũ khí thuyết phục người dùng trả tiền (49k/tháng):**
   - *"Con cái không mua một phần mềm diệt virus; con cái mua **Sự an tâm từ xa và Chìa khóa bảo vệ dưỡng già cho cha mẹ**. Với tính năng Vòng Kim Cô Tài Chính và Biên Nhận Biến Cố Số, 49.000 đ/tháng là cái giá quá rẻ để bảo vệ sổ tiết kiệm cả đời của bố mẹ."*

---
*Báo cáo được hoàn thành bởi Agent benchmarker – Swarm Dự án Khoan Đã (ShieldGen) – 24/11/2026.*
