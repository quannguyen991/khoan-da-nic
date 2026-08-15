# ĐÁNH GIÁ 20 GỢI Ý ĐỘT PHÁ

> **Nguồn được đánh giá:** `Khoan_Da_Phan_Tich_Va_Goi_Y_Dot_Pha.pdf` (13 trang,
> tạo 16/8/2026, tự khai là *"sinh tự động ... bởi AI coding assistant"*).
>
> **Đánh giá ngày 16/8/2026**, đối chiếu với mã nguồn nhánh `main` commit `b11b27b`.
> Ràng buộc trích dẫn trong tài liệu này lấy từ `CLAUDE.md` (§4, §11, §12) và
> từ mã nguồn thật, không lấy từ PDF.

---

## 0. Đọc cái này trước — nền của PDF đã cũ

PDF tự viết ở trang cuối: *"Mọi số liệu và khuyến nghị cần được đối chiếu lại
với mã nguồn."* Đúng vậy. Ba chỗ sai:

| PDF ghi | Thực tế trong mã |
|---|---|
| "AI (Fable 5)" | `.env` → **`claude-sonnet-5`** |
| "6 Critical Override bất biến" | **10** — `CO-01…CO-10` trong `critical-overrides.js` |
| nhãn "Chưa thấy dấu hiệu rủi ro **rõ ràng**" | nhãn §4.1 là "Chưa thấy dấu hiệu rủi ro", không có "rõ ràng" |

⚠️ **Vì vậy bảng ưu tiên P0–P3 ở trang 12 của PDF không dùng được nguyên trạng.**
Bảng đó xếp #11 (Academy) là P0 khởi động đầu tiên — đánh giá dưới đây không đồng ý.

---

## 1. Bảng chốt

| # | Ý | Chốt | Ghi chú |
|---|---|---|---|
| 4 | Sức khoẻ thiết bị — quét chủ động | ✅✅ **làm** | ý mạnh nhất tài liệu · cần Android native |
| 15 | Drill mode — con giả lập cuộc gọi lừa | ✅✅ **làm** | rẻ nhất · demo được ngay |
| 7 | Bạn đồng hành sau vụ — chống tự trách | ✅✅ **làm** | bỏ phần chatbot LLM |
| 14 | Preventive mode — tăng cảnh giác theo giai đoạn | ✅ làm | hợp §4.2 |
| 9 | Micro-learning sau vụ việc | ✅ làm | nằm ngoài luồng khẩn cấp |
| 16 | Bank confirmation delay | ✅ **đã có trong kế hoạch** | = slide 8 · P3 |
| 17 | Transparency dashboard | ✅ **đã làm một phần** | `/transparency` đang chạy |
| 19 | Outcome-based metrics | ✅ **đã làm rồi** | = 2 chỉ số chính slide 10 |
| 20 | Mở rộng Đông Nam Á | ✅ **kiến trúc đã sẵn** | locale packs |
| 2 | Nghi thức xác minh 60s | ⚠️ sửa | giữ nghi thức · **bỏ phần khoá Accessibility** |
| 5 | Hotline đối chứng | ⚠️ sửa | có bản rẻ hơn và tốt hơn |
| 6 | Chế độ gọi cứu khẩn cấp | ⚠️ sửa | **bỏ ghi âm lén** |
| 11 | Khoan Đã Academy | ⚠️ hạ ưu tiên | bỏ "Chứng nhận Cảnh giác" |
| 12 | Empowerment model | ⚠️ sửa | **bỏ câu "tránh mất X triệu"** |
| 18 | Tích hợp MoMo / 113 / VN Post | ⚠️ để sau | việc bắt tay, không phải việc code |
| 1 | Voice fingerprint gia đình | ❌ bỏ | nửa "câu hỏi bí mật" thì giữ |
| 3 | Panic Button Bluetooth | ❌ bỏ | |
| 8 | Passive Voice Monitor | ❌ bỏ | |
| 10 | Bản đồ nhiệt khu vực | ❌ bỏ lúc này | |
| 13 | Ambient Assistance | ❌ bỏ | |

---

## 2. LÀM — bốn ý đáng đầu tư

### #4 — Sức khoẻ thiết bị chống lừa đảo ✅✅

**Vì sao đây là ý mạnh nhất:** nó là **mặt trái của #2 và #13**. Thay vì *đi xin*
quyền Trợ năng, nó **báo cáo xem ai khác đang giữ quyền đó**. Cùng một API,
ngược chiều đạo đức.

Điều này khớp với bộ luật sẵn có: `DEV_ACCESSIBILITY_PERMISSION` đã là tín hiệu
rủi ro trong nhóm `device`, và `CO-02` nổ ngay khi thấy `DEV_INSTALL_APK_UNKNOWN`
hoặc `DEV_REMOTE_CONTROL_APP`.

Trên Android native đọc được hết, **không cần quyền đặc biệt**:

| Cần biết | API |
|---|---|
| App nào đang bật Trợ năng | `Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES` |
| App nào vẽ đè được màn hình | `Settings.canDrawOverlays()` |
| Cài từ nguồn không rõ | `PackageManager.canRequestPackageInstalls()` |
| App nào đang làm device admin | `DevicePolicyManager.getActiveAdmins()` |

Hiển thị dạng đỏ/vàng/xanh, ngôn ngữ đời thường:
> *"Có 2 ứng dụng đang được phép xem màn hình bác. Nên gỡ."*

**Chặn:** cần bản Android native. Không làm được trên PWA hiện tại → giai đoạn 2.

### #15 — Drill mode (diễn tập) ✅✅

Người con gửi một tình huống giả lập, bố mẹ tập phản ứng, có phản hồi. Mô hình
diễn tập phòng cháy.

**Rẻ nhất trong cả danh sách**: nó chỉ là **bơm một đầu vào có sẵn qua đúng
pipeline đang chạy** — không cần module mới, không cần quyền mới, không cần
native. Và nó **quay demo rất đẹp**.

Điều kiện bắt buộc:
- Đồng ý lúc cài đặt, không bật ngầm.
- Kết thúc phải nói rõ **đây là diễn tập**, ngay lập tức.
- Không được làm thật đến mức gây hoảng loạn thật.

> ⚠️ Phần "dashboard sức khoẻ tài chính của bố mẹ" trong cùng gợi ý #15 thì
> **phải thiết kế theo hướng đồng thuận**: bác thấy đúng thứ con thấy, bật lúc
> cài đặt, bác tắt được bất cứ lúc nào. Xem §4 dưới đây.

### #7 — Bạn đồng hành sau vụ việc ✅✅

Cú xoay giọng *"Kẻ lừa đã tìm được bác"* thay cho *"Bác đã bị lừa"* đúng §11
(*không trách móc người dùng*). Gắn vào `recovery-adapters.js` đã có sẵn.

**Hai chỗ phải sửa so với PDF:**

1. **KHÔNG dùng LLM chat mở** với người vừa mất tiền. Dùng câu viết sẵn, kiểm thử
   được. §12: *"❌ Dùng nội dung người dùng làm prompt instruction."*
2. PDF ghi *"tư vấn tâm lý miễn phí (111, Hội Bảo trợ NCT)"* — **111 là tổng đài
   quốc gia bảo vệ TRẺ EM**, không phải người cao tuổi. Mọi số điện thoại phải đi
   qua `verified-institution-registry.js`; chính file đó tự ghi là *"module nguy
   hiểm nhất"* vì **số không nguồn bị loại thẳng**.

### #14 — Preventive mode ✅

*"Con tôi vừa đi xa"* → nâng cảnh giác một tuần. *"Tôi vừa vào nhóm đầu tư"* →
checklist 5 câu trước khi chuyển tiền.

Hợp kiến trúc gọn gàng: đây là một **cờ ngữ cảnh chỉ LÀM TĂNG cảnh giác**. §4.2
ghi đúng chữ đó — *"Mọi thứ thông minh thêm vào chỉ được LÀM TĂNG cảnh giác,
không bao giờ giảm."*

**Bỏ** phần *"theo dõi các cuộc gọi lạ"* — PWA không làm được.

### #9 — Micro-learning sau vụ việc ✅

Mở rộng mốc 24h đã có. Nằm **ngoài** luồng khẩn cấp, nên không phạm ranh giới
*"không tối ưu luồng khẩn cấp bằng engagement hay trò chơi hoá"*.

---

## 3. ĐÃ CÓ RỒI — đừng lên kế hoạch lại

| # | Đã có ở đâu |
|---|---|
| **16** Bank confirmation delay | đúng mô hình doanh thu chính — slide 8 và P3 |
| **17** Transparency dashboard | `/transparency` đang chạy, dựng bởi `safety-card-page.js`, **đọc được không cần JavaScript**. Phần "cộng đồng đóng góp quy tắc" đã có cổng duyệt ở `intel-store.js` |
| **19** Outcome-based metrics | đúng 2 chỉ số chính deck đã cam kết |
| **20** Đông Nam Á | `locale-pack-registry.js` + `locale-packs/` đã dựng cho việc này; `verified-institution-registry.js` đúng là pattern tái dùng |

**Một ý bổ sung dùng được từ #19:** đếm số lần chuyển
`PROTECTED_CRITICAL → TRUST_RECEIPT` — `intervention-ladder.js` đo được ngay.

---

## 4. SỬA TRƯỚC KHI DÙNG

### 4.1 Một lỗi giết ba ý cùng lúc — #2, #13, nửa #1

Cả ba đều dựa vào `AccessibilityService` / overlay để **chặn thao tác**. Bốn lý do
không được làm:

1. **Google Play cấm** dùng `AccessibilityService` cho mục đích không phải trợ
   năng — chính sách có từ 2017, app bị gỡ thật.
2. **App ngân hàng Việt Nam chủ động chặn overlay** (`FLAG_SECURE`,
   `filterTouchesWhenObscured`) đúng vì đó là kỹ thuật của kẻ lừa đảo.
3. **§12 cấm thẳng**: *"❌ Tự hứa chặn cuộc gọi / chặn giao dịch ngân hàng."*
4. **Nặng nhất**: nó tập cho người cao tuổi quen tay cấp đúng cái quyền mà kẻ lừa
   đảo cần. Sau khi quen bấm "Cho phép Trợ năng" vì Khoan Đã, kẻ lừa tiếp theo chỉ
   cần nói *"bác cấp quyền như hồi cài Khoan Đã ấy"*.

**#2 bỏ phần khoá đi thì còn lại một ý tốt** và làm được ngay: nghi thức xác minh
— gọi lại **số đã lưu trong Trusted Circle**, không phải số hiện trên màn hình,
hỏi một câu ngẫu nhiên trong bộ đã đăng ký. Thuần UX + dữ liệu sẵn có.

> Phải gọi đúng tên: đây là **nghi thức người dùng chọn làm**, KHÔNG phải khoá kỹ thuật.

### 4.2 #1 — voice fingerprint: bỏ nửa đầu, giữ nửa sau

**Không lấy được âm thanh đầu bên kia của cuộc gọi**: nguồn `VOICE_CALL` trên
Android bị chặn với app thường (cần quyền hệ thống); iOS không có cửa nào.

Còn nhận dạng giọng qua loa ngoài, trên đường truyền nén băng hẹp, với 3 câu mẫu —
**nhận nhầm con ruột thành giả mạo** là hỏng nặng hơn không có tính năng. Thêm nữa,
voiceprint là dữ liệu sinh trắc học, kéo theo nghĩa vụ pháp lý.

**Giữ nửa "câu hỏi bí mật xoay vòng"**, nhưng phải định vị đúng:

| | Câu hỏi ký ức | Khoan Proof (passkey) |
|---|---|---|
| Kẻ gian đã grooming lâu, biết chuyện nhà | ❌ trả lời được | ✅ vẫn không ký được |
| Deepfake giọng | ⚠️ tuỳ nó biết bao nhiêu | ✅ vô hiệu |
| Cần người con phản hồi ngay | ✅ không cần | ❌ cần |
| Cần ghép cặp trước | ✅ không cần | ❌ cần |

→ Câu hỏi ký ức là **tầng dự phòng** cho hai lỗ mà `khoan-proof.js` không bịt
(con chưa ghép cặp, con không nghe máy). **Không phải bản thay thế.**

Và: **không cho LLM sinh câu hỏi từ nội dung người dùng** (§12). Đây là kho câu
hỏi xoay vòng do người con nhập sẵn — **đừng gọi là "dynamic"**, §11 cấm thổi phồng.

### 4.3 #12 — bỏ câu gán số tiền

PDF đề xuất: *"Bác đã giúp mình tránh mất X triệu"*.

Slide 10 và P4 viết đúng ngược lại:
> *"Trì hoãn giao dịch ≠ ngăn chặn thành công. Chúng tôi không gọi con số này là
> 'số tiền đã cứu được'."*

**Giữ** cú xoay giọng từ nạn nhân sang người chủ động — đó là ý hay.
**Bỏ** phần gán số tiền. Nói *"Bác đã dừng lại và kiểm tra"*.

### 4.4 #5 — hotline: có bản rẻ hơn và tốt hơn

Ý đúng (bảo vệ câu bất biến chống mạo danh; `ID_KHOAN_DA_IMPERSONATION` đã là tín
hiệu thật trong sổ). Nhưng 1900-XXXX tốn tiền, cần người trực, và **hotline không
có người trực còn tệ hơn không có**.

Bản tốt hơn: **câu trả lời luôn luôn giống nhau**, nên không cần tổng đài. Một màn
trong app: *"Khoan Đã có gọi cho bác không?"* → *"KHÔNG. Khoan Đã không bao giờ
gọi điện hay nhắn riêng."*

**Giữ phần thẻ nhựa** — rẻ, hợp người cao tuổi, hoạt động khi mất mạng.

### 4.5 #6 — bỏ ghi âm lén

Ý duress mode chính đáng (app chống bạo lực gia đình dùng). Nhưng **ghi âm 30 giây
cuộc trò chuyện mà bên kia không biết là rủi ro pháp lý thật ở Việt Nam**.

Giữ: báo động im lặng + vị trí gửi Trusted Circle. Bỏ: ghi âm. Cần native → sau.

### 4.6 #11 — bỏ "Chứng nhận Cảnh giác"

Phần học thì được (app đã có mục Học hỏi với danh mục thủ đoạn). Nhưng **cấp chứng
nhận là rủi ro an toàn thật**: người vừa "thi đỗ" dễ tin vào phán đoán của chính
mình hơn, tức tự tin sai chỗ.

Và đây **không phải P0**. Nó là ý bị thương mại hoá nhiều nhất trong danh sách —
app an toàn nào cũng có mục học.

### 4.7 #10 và phần thống kê của #17 — cần lưu lượng thật

*"Tuần này quận bác có 5 ca lừa"* — chưa có người dùng thì mọi con số hiện ra đều
là bịa. §11 cấm thẳng: *"❌ số lượt báo cáo cộng đồng giả, cảnh báo không có nguồn."*

Thêm nữa, bản đồ nhiệt cần thu vị trí + dữ liệu vụ việc về máy chủ → **đổi privacy
model**, mà §12 liệt đó là quyết định không được tự đổi.

### 4.8 #18 — là việc bắt tay, không phải việc code

MoMo / ZaloPay / VNPay / Vietnam Post đều là chu kỳ bán dài.

❌ Riêng *"kết nối 113, 115: khi gọi cấp cứu → gửi kèm hồ sơ vụ việc"* thì **không
làm được** — không có cơ chế đính dữ liệu vào cuộc gọi khẩn cấp.

⚠️ **Không in tên đối tác cụ thể lên slide khi chưa có thoả thuận.**

### 4.9 #3 và #8 — mic nền: bỏ

- Android 11+ siết truy cập mic nền; Android 14 đòi `FOREGROUND_SERVICE_MICROPHONE`
  kèm thông báo thường trực. iOS gần như không cho.
- "Web Speech API" **không chạy trên thiết bị** — Chrome gửi âm thanh lên máy chủ
  Google. Vosk thì đúng là on-device nhưng cần app native + tải mô hình, và mô hình
  tiếng Việt còn yếu.
- Một app nghe liên tục trong nhà người cao tuổi là bề mặt tấn công lớn và là đòi
  hỏi lòng tin rất lớn.
- Nút BLE kéo theo sản xuất, chứng nhận, giá thành, pin, bảo hành — quá tầm cho đội
  ba người chưa qua pilot.

---

## 5. Thứ quan trọng hơn cả 20 ý

Không ý nào trong PDF chạm vào vấn đề lớn nhất lúc này.

`eval/results/latest.json` (15/8/2026, 445 mẫu, `claude-sonnet-5`):

| | |
|---|---|
| `dangerousRecall` | **64,3%** — mục tiêu ≥ 95% |
| `CAO → CHUA_THAY` | **23 mẫu** |

23 ca nguy hiểm bị máy xếp thành *"chưa thấy dấu hiệu rủi ro"*. Thêm tính năng khi
recall còn 64% làm sản phẩm **rộng hơn**, không làm nó **an toàn hơn** — với một
sản phẩm an toàn thì đó là đánh đổi sai.

`docs/superpowers/specs/PROMPT-BAN-GIAO.md` đã đặt đúng thứ tự: PROMPT 0 (chẩn đoán
20 ca gọi hụt) → PROMPT 1 (vá lỗ `verifiedRelationship`). **Giữ nguyên thứ tự đó.**

---

## 6. Nếu muốn đưa vào deck ngay

Chỉ thêm **một dòng** ở slide 10, nhánh sau pilot:

> *Quét sức khoẻ thiết bị · Diễn tập cùng người thân*

Hai ý #4 và #15 — cả hai đều kiểm chứng được và không hứa gì quá tay.

**Không đưa** #1, #2, #3, #8, #10, #13 vào bất kỳ tài liệu nào. Không phải vì khó,
mà vì mỗi cái hoặc tự mâu thuẫn với mô hình đe doạ của sản phẩm, hoặc chứa tuyên bố
kỹ thuật không thực hiện được — đúng chỗ giám khảo có chuyên môn sẽ hỏi vào.
