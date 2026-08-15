# TÍNH NĂNG KHẢ THI — LÀM ĐƯỢC TRÊN STACK HIỆN TẠI

> Lọc từ 20 gợi ý (`Khoan_Da_Phan_Tich_Va_Goi_Y_Dot_Pha.pdf`) và kế hoạch APK.
> Giữ lại **những cái làm được ngay**: không cần quyền mới, không đổi privacy
> model, không phá ràng buộc nào trong `CLAUDE.md`.
>
> **Đối chiếu mã nguồn 16/8/2026, commit `d35dad3`.** Mỗi mục ghi rõ dựa trên
> module nào đã có, để không xây lại thứ đang chạy.
>
> ⚠️ **Đang có phiên khác đóng gói APK bằng Capacitor.** Hai tính năng dưới đây
> sẽ **hỏng im lặng** trong APK nếu không xử — xem **§3**. Đọc §3 trước khi code.

---

## 0. ĐỌC TRƯỚC — thứ tự

Chín tính năng dưới đây **đều xếp sau** bốn việc chặn:

1. Sửa `test/font-size-floor.test.js` (đang pass rỗng)
2. Sửa thứ tự nạp `vung-cham-san.css` (đang bị bundle đè)
3. Deploy + CI (slide 11/12 đang chờ QR)
4. PROMPT 0 / PROMPT 1 — 9 ca `CAO → CHUA_THAY`, lỗ `verifiedRelationship`

Recall đang **73,7%**. Làm tính năng trước khi đóng 9 ca bỏ lọt là làm sản phẩm
rộng hơn chứ không an toàn hơn.

---

## 1. BẢNG TÓM TẮT

| # | Tính năng | Công | Chỗ làm | Dựa trên module có sẵn | APK? |
|---|---|---|---|---|---|
| A | **Drill mode** — diễn tập cùng người thân | TB | BE + FE | `bo-hoi-nhanh.js` · `trusted-circle.js` · `push.js` | ⚠️ §3.2 |
| B | Màn "Khoan Đã có gọi cho bác không?" | **rất thấp** | FE | — | ✅ |
| C | Đọc câu thành tiếng (TTS) | thấp | FE | *(chưa có trong bản dựng)* | ⚠️ §3.1 |
| D | Câu hỏi ký ức xoay vòng | thấp | BE + FE | `vault-store.js` · `trusted-circle.js` | ✅ |
| E | Nghi thức xác minh — gọi lại số đã lưu | thấp | FE | `trusted-circle.js` · `bo-hoi-nhanh.js` | ✅ |
| F | Preventive mode — cờ ngữ cảnh | TB | BE + FE | `context-builder.js` · `decision-engine.js` | ✅ |
| G | Bạn đồng hành sau vụ việc | thấp | BE + FE | `recovery-adapters.js` | ✅ |
| H | Nhật ký bài học | TB | BE + FE | mốc 24h đã có | ✅ |
| I | Đổi giọng văn "trao quyền" | **rất thấp** | FE | — | ✅ |

**Nếu chỉ làm được ba cái: B → E → A.** B rẻ nhất và chặn đúng rủi ro của thành
công. E có sẵn hết dữ liệu, chỉ thiếu màn hình. A đắt hơn nhưng là thứ duy nhất
xây **phản xạ**, và quay demo đẹp nhất.

Sau, khi có bản Android native đầy đủ: **#4 quét sức khoẻ thiết bị** (§4).

---

## 2. CHI TIẾT

### A. Drill mode — diễn tập cùng người thân ⭐

**Tình huống.** Người con lo bố mẹ sập bẫy "con đổi số". Dặn dò thì vô ích — bác
gật đầu rồi quên, và lúc thật thì tim đập nhanh, không nhớ gì.

**Bác thấy gì.** Con chọn kịch bản, bấm gửi. Bác nhận một tin *trông như thật*:

> *"Mẹ ơi con đổi số mới. Mẹ chuyển giúp con 20 triệu, gấp lắm, con đang kẹt."*

Bác xử lý như thật — bấm kiểm tra, gọi lại, hoặc làm theo. Xong mới hiện tổng kết:

> **Đây là bài diễn tập.** Trong tin vừa rồi có 3 dấu hiệu: số lạ · xưng là con ·
> giục gấp kèm đòi chuyển tiền. Lần sau bác gọi lại số cũ đã lưu nhé.

**Vì sao chặn được.** Biết về lừa đảo ≠ phản xạ được lúc bị lừa. Diễn tập xây
**phản xạ**, giống diễn tập phòng cháy — không ai đọc sách rồi thoát được đám cháy.

**Lợi ích ít ai để ý.** Hiện tại người con cài app xong là hết việc. Drill mode
cho họ một hành động lặp lại, có ý nghĩa — mà người con mới là người trả tiền.

**Vì sao rẻ.** Không cần module mới. `src/bo-hoi-nhanh.js` đã có đúng khuôn mẫu:
trong file ghi rõ *"Mọi câu trả lời đẩy `maLyDo` vào CÙNG `decision-engine`"*.
Drill mode chỉ là **bơm một đầu vào qua đúng pipeline đang chạy**.

| Phần | Việc |
|---|---|
| BE | Endpoint tạo phiên diễn tập; cờ `laDienTap` đi xuyên suốt phiên |
| FE | Màn con chọn kịch bản · màn bác nhận · màn tổng kết |

**⚠️ Chỗ dễ sai nhất.** Phiên diễn tập **tuyệt đối không được lẫn vào dữ liệu đo
thật**:

- không ghi vào bộ nhớ vụ việc (`journey-engine.js`)
- không tính vào hai chỉ số chính ở slide 10
- không đẩy vào ra-đa (`intel-store.js`)

Lẫn vào là thổi phồng chỉ số cam kết với ban giám khảo bằng dữ liệu giả — đúng
thứ §11 cấm. **Viết test chặn chuyện này TRƯỚC khi viết tính năng.**

**Ràng buộc.** Đồng ý lúc cài đặt · kết thúc phải nói rõ là diễn tập, ngay lập
tức · không làm thật đến mức gây hoảng loạn thật.

---

### B. Màn "Khoan Đã có gọi cho bác không?" ⭐ rẻ nhất

**Tình huống.** Đây là vấn đề của **thành công**. App càng nổi tiếng, kẻ lừa càng
mạo danh nó:

> *"Chào bác, em là nhân viên Khoan Đã. Hệ thống phát hiện tài khoản bác có rủi
> ro. Bác đọc mã OTP để em khoá giúp."*

Mọi thương hiệu an toàn đều bị mạo danh. Sản phẩm đã lường trước —
`ID_KHOAN_DA_IMPERSONATION` là tín hiệu có thật trong sổ.

**Bác thấy gì.** Một mục cố định ngoài màn chính. Bấm vào, một màn, chữ rất to:

> ## KHÔNG.
> Khoan Đã không bao giờ gọi điện hay nhắn riêng để xin tiền, mã OTP hay mật khẩu.

**Vì sao rẻ đến vậy.** Câu trả lời **không bao giờ đổi**. Nên không cần tổng đài,
không cần máy chủ, không cần mạng, không có gì để sai. Bác kiểm được **ngay trong
lúc kẻ lừa còn đang trên máy**.

Đây là bản tốt hơn của ý "hotline 1900-XXXX" trong PDF — vì hotline không có
người trực còn tệ hơn không có. Kèm được thì in ra thẻ nhựa phát lúc cài: rẻ, hợp
người cao tuổi, chạy cả khi máy đã bị chiếm.

---

### C. Đọc câu thành tiếng (TTS)

**Đã kiểm: bản dựng hiện tại KHÔNG có TTS.** Bundle `index-CXer9L3S.js` (467KB)
không chứa `speechSynthesis`, `SpeechSynthesisUtterance` hay chuỗi "Nghe đọc".
(Bản ghi màn hình tháng 7 có nút "Nghe đọc câu này" — tính năng đó không còn
trong bản dựng hôm nay.)

**Tình huống.** Màn `PROTECTED_CRITICAL` đã có sẵn câu để bác nói:

> *"Tôi không chuyển tiền. Tôi sẽ tự gọi lại bằng số chính thức. Xin phép dừng
> cuộc gọi."*

Nhưng đúng lúc đó bác đang bị quát vào tai, tay run, mắt mờ. **Đọc một câu dài
trên màn hình lúc hoảng loạn là việc khó.**

**Bác thấy gì.** Nút "Nghe đọc câu này". Điện thoại đọc lên, bác **nói theo**.

**Vì sao.** Nhắc lại thứ vừa nghe dễ hơn nhiều so với đọc chữ khi đang run. Và
người cao tuổi mắt kém thì đây là khác biệt giữa dùng được và không.

**Giới hạn.** Giọng đọc phụ thuộc thiết bị. **Chữ phải luôn hiển thị đầy đủ**,
tiếng nói chỉ là thêm. Không bao giờ để nội dung chỉ tồn tại ở dạng âm thanh.

> Đây là `SpeechSynthesis` — phần **NÓI**. Không đụng `SpeechRecognition` (phần
> **NGHE**): nó gửi âm thanh lên máy chủ Google, phá privacy model.

**⚠️ Trong APK Capacitor thì khác — đọc §3.1 trước khi làm.**

---

### D. Câu hỏi ký ức xoay vòng

**Tình huống.** AI nhái giọng. Bác nghe đúng giọng con:

> *"Mẹ ơi con gây tai nạn, người ta bắt đền, mẹ chuyển gấp 50 triệu…"*

Giọng thật 100%. Không cách nào phân biệt bằng tai.

**Bác thấy gì.** Bấm "Xác minh người này" → app hiện **một câu ngẫu nhiên** từ kho
con đã nhập lúc cài:

> **Hỏi người đang gọi:** *"Chú chó nhà mình nuôi năm ngoái tên gì?"*
> *(chạm để xem đáp án)*

**Vì sao chặn được.** AI sao chép được **giọng**, không sao chép được **ký ức
chung**. Câu xoay vòng nên không moi trước được.

**Chi tiết thiết kế quan trọng.** App phải cho xem **cả đáp án** (ẩn, chạm mới
hiện). Chỉ hiện câu hỏi là chưa đủ — lúc hoảng loạn người ta dễ chấp nhận một câu
trả lời nghe *có vẻ* đúng. Phải để bác **đối chiếu**, không phải **phán đoán**.

**Giới hạn — lý do nó chỉ là tầng dự phòng.** Nếu kẻ lừa đã nuôi con mồi vài
tháng, hoặc nhà mình đăng hết lên Facebook, chúng có thể biết.

| | Câu hỏi ký ức | Khoan Proof (`khoan-proof.js`) |
|---|---|---|
| Kẻ gian đã grooming lâu | ❌ trả lời được | ✅ vẫn không ký được |
| Con chưa ghép cặp | ✅ vẫn dùng được | ❌ không dùng được |
| Con không nghe máy lúc 2h sáng | ✅ vẫn dùng được | ❌ không dùng được |

Nó bịt đúng hai lỗ mà passkey không bịt. Chỉ vậy thôi.

**Ràng buộc.** KHÔNG cho LLM sinh câu hỏi từ nội dung người dùng (§12) · **đừng
gọi là "dynamic"**, đây là kho xoay vòng do người nhập (§11 cấm thổi phồng) · ký
ức gia đình là PII nặng, lưu cục bộ và nói rõ điều đó.

---

### E. Nghi thức xác minh — gọi lại số đã lưu ⭐

**Tình huống.** Đây là mắt xích tinh vi nhất của giả danh công an:

> *"Bác không tin thì cứ gọi lại số 024.3xxx.xxx để xác minh."*

Bác gọi. Có người bắt máy, xưng công an, xác nhận. **Vì đó là đồng bọn.** Bác yên
tâm và chuyển tiền.

**Bác thấy gì.** App nói thẳng:

> **Đừng gọi số họ đưa.** Gọi số này:
> 📞 Minh Anh (con gái) — 0986 123 456 · *bác đã lưu ngày 12/8*
> 📞 Vietcombank — 1900 545413 · *số chính thức đã xác minh*

**Vì sao chặn được.** Cả vụ lừa đảo phụ thuộc vào việc **bác xác minh qua kênh do
chúng kiểm soát**. Cắt vòng lặp đó là xong. Không cần công nghệ gì — chỉ cần danh
sách số bác đã lưu từ trước, lúc còn tỉnh táo.

`trusted-circle.js` giữ số người thân, `verified-institution-registry.js` giữ số
tổ chức đã xác minh. **Dữ liệu có sẵn cả**, chỉ thiếu màn hình nói đúng câu này
đúng lúc.

> Đây là phần còn lại sau khi cắt bỏ ý "khoá chuyển tiền bằng Accessibility".
> Gọi đúng tên: **nghi thức bác chọn làm**, không phải khoá kỹ thuật. Đừng viết
> "chặn chuyển tiền" ở bất kỳ đâu.

---

### F. Preventive mode — cờ ngữ cảnh theo giai đoạn nguy cơ

**Tình huống.** Lừa đảo bám theo **biến cố đời người**. Con vừa đi nước ngoài →
*"con kẹt ở sân bay"*. Vừa mất chồng → lừa tình. Vừa vào nhóm đầu tư → lùa gà.

**Bác thấy gì.** Con (hoặc bác) khai một sự kiện. App nâng cảnh giác trong 7 ngày
và hiện checklist hợp cảnh trước khi chuyển tiền.

**⚠️ Đây là chỗ dễ làm sai nhất, và sai thì nguy hiểm.**

Cách sai — nghe rất hợp lý: *"App biết con thật sự đang ở nước ngoài, nên tin
nhắn xin tiền từ nước ngoài **bớt** đáng ngờ."*

**Tuyệt đối không.** §4.2 viết rõ: *"Mọi thứ thông minh thêm vào chỉ được LÀM
TĂNG cảnh giác, không bao giờ giảm."* Biết con đang đi xa phải làm tin nhắn xin
tiền **đáng ngờ hơn** — vì đó chính là lúc kẻ lừa nhắm vào, chứ không phải bằng
chứng ngoại phạm.

| Phần | Việc |
|---|---|
| BE | Cờ trong `context-builder.js`, cộng điểm ở `decision-engine.js` |
| FE | Màn khai giai đoạn, hiển thị cờ đang bật + nút tắt |

**Ràng buộc.** Cờ **chỉ cộng, không bao giờ trừ** — viết test chứng minh · cờ
**có hạn** (ví dụ 7 ngày) rồi tự tắt · bác tắt được bất cứ lúc nào · bỏ phần
*"theo dõi các cuộc gọi lạ"* trong PDF, không làm được.

---

### G. Bạn đồng hành sau vụ việc

**Tình huống.** Bác vừa mất 200 triệu. Cảm giác đầu tiên không phải giận kẻ lừa —
mà là **xấu hổ**. *"Sao mình ngu thế."* Nên bác giấu, không kể con.

**Chính sự im lặng đó làm vụ thứ hai thành công.** Kẻ lừa quay lại:

> *"Chúng tôi là đơn vị hỗ trợ thu hồi tiền bị lừa. Bác đóng trước 10 triệu phí
> hồ sơ…"*

Bộ luật đã biết mô thức này — `FIN_RECOVERY_FEE` và `CO-06`. Nhưng phần **con
người** thì chưa ai đỡ.

**Bác thấy gì.** Câu viết sẵn, không phán xét:

> *Kẻ lừa đã tìm được bác. Việc này không phải lỗi của bác — chúng làm việc này
> cả năm, chuyên nghiệp lắm.*

Rồi các bước cụ thể, kèm số điện thoại đã xác minh.

`src/analysis/recovery-adapters.js` **đã có sẵn `CUM_TU_CAM`** (danh sách cụm từ
cấm) — hàng rào ngôn ngữ đã dựng, chỉ cần thêm nội dung.

**Hai ràng buộc.** KHÔNG dùng LLM chat mở với người vừa mất tiền — câu viết sẵn,
kiểm thử được (§12) · **mọi số điện thoại phải qua
`verified-institution-registry.js`**, file đó tự ghi là *"module nguy hiểm nhất"*
vì số không nguồn bị loại thẳng.

> ⚠️ PDF gợi ý số **111** — đó là tổng đài quốc gia bảo vệ **TRẺ EM**, không phải
> người cao tuổi. Đừng chép.

---

### H. Nhật ký bài học

3 ngày sau, 7 ngày sau, app hỏi lại nhẹ nhàng: *"Có ai liên lạc lại không? Bác xử
lý thế nào?"* Dần dựng thành nhật ký cá nhân — sau 3–6 tháng bác nhìn lại thấy
mình đã học được gì.

Biến một vụ đau thành trí nhớ dùng được, và cho gia đình một thứ chung để nói
chuyện.

**Ràng buộc.** Nằm **ngoài** luồng khẩn cấp — sản phẩm đã tuyên bố không tối ưu
luồng khẩn cấp bằng engagement hay trò chơi hoá. Nếu làm phần "Academy" thì **bỏ
"Chứng nhận Cảnh giác"**: người vừa "thi đỗ" dễ tin vào phán đoán của chính mình
hơn, tức tự tin sai chỗ.

---

### I. Đổi giọng văn "trao quyền"

Nhỏ nhưng thật. *"Bác đang gặp nguy hiểm!"* làm người ta **đông cứng** — và người
đông cứng thì làm theo lời kẻ đang chỉ đạo.

*"Bác vừa dừng lại và kiểm tra."* ghi nhận việc bác **đã làm đúng**. Bác thấy
mình làm được, và lần sau còn dùng.

Chỉ đổi chữ, không đổi logic.

**❌ Không gán số tiền.** PDF đề xuất *"Bác đã giúp mình tránh mất X triệu"* —
slide 10 và P4 viết ngược lại: *"Trì hoãn giao dịch ≠ ngăn chặn thành công. Chúng
tôi không gọi con số này là 'số tiền đã cứu được'."*

---

## 3. ⚠️ CHÚ Ý KHI ĐÓNG GÓI APK (Capacitor)

Bản APK phục vụ giao diện ở origin `https://localhost` (Android) và
`capacitor://localhost` (iOS) — xem commit `d35dad3`. Nó chạy trong **Android
System WebView**, **không phải Chrome**. Hai tính năng trên bị ảnh hưởng, và
**cả hai đều hỏng IM LẶNG** — đúng dạng lỗi dự án đã bị cắn nhiều lần.

### 3.1 TTS (tính năng C) — `speechSynthesis` trong WebView

`window.speechSynthesis` **có tồn tại** trong WebView, nên `if (window.speechSynthesis)`
sẽ trả về `true`. Nhưng `getVoices()` thường trả **mảng rỗng** và gọi `speak()`
**không phát ra tiếng, không ném lỗi nào**.

Nghĩa là: nút "Nghe đọc câu này" hiện ra bình thường, bác bấm, không có gì xảy
ra, không có thông báo lỗi. Đúng lúc bác cần nhất.

**Phải làm:**

1. **Đừng kiểm tra bằng sự tồn tại của API.** Kiểm bằng `getVoices()` có giọng
   tiếng Việt hay không, và có sự kiện `voiceschanged` không.
2. **Trong APK, dùng plugin TTS native của Capacitor** (gọi engine TTS của
   Android), không dùng Web Speech API.
3. **Không có giọng thì ẨN NÚT**, đừng hiện nút chết. Chữ vẫn phải đọc được đầy đủ.
4. **Test trên máy thật**, không tin emulator và càng không tin trình duyệt desktop.

### 3.2 Thông báo đẩy (tính năng A phụ thuộc vào đây)

Drill mode cần: con gửi → **bác nhận được thông báo**. `src/push.js` hiện là
**Web Push**.

**Web Push không chạy trong WebView của Capacitor trên Android.** Phải qua **FCM
bằng plugin native**. Nếu drill mode dựng trên Web Push thì chạy ngon trên
trình duyệt và **im lặng không tới** trong APK.

Việc này cũng ảnh hưởng cảnh báo Vòng tròn gia đình đang có — kiểm luôn.

Và Android 13+ đòi quyền `POST_NOTIFICATIONS` xin lúc chạy. Không xin thì thông
báo bị nuốt, cũng không lỗi.

### 3.3 Service worker trong APK

App đã có `public/app/sw.js`. Trong APK, tài nguyên nằm sẵn trong gói nên cache
của SW phần lớn thừa — nhưng có một rủi ro thật: **SW phục vụ bản cũ sau khi cập
nhật app**. Kiểm việc nâng phiên bản có dọn cache cũ không.

### 3.4 Hai lỗ đã được vá — đừng vá lại

Commit `d35dad3` đã xử:

- **CORS**: danh sách **đóng** bốn origin, không phải `*`. Có test riêng chặn việc
  "sửa nhanh bằng dấu sao". `/api/proof/*` nhận token qua header `authorization` —
  mở `*` là cho bất kỳ trang nào gọi sang kèm token người dùng.
- **WebAuthn**: đã thêm `https://localhost` và `capacitor://localhost`. `rpID` vẫn
  là `localhost` cho cả bốn origin nên **không nới lỏng gì về mật mã**.

⚠️ `capacitor.config` đặt `androidScheme: https` **là cố ý**: `https://localhost`
là secure context nên passkey dùng được trong APK. **Đổi sang `http` là mất
passkey.**

### 3.5 Nhắc lại — phát APK cho ai

| Cách phát | Đối tượng | |
|---|---|---|
| Google Play | người dùng cuối | ✅ chuẩn |
| Firebase App Distribution | nội bộ / beta | ⚠️ chỉ đội, không phát cho người cao tuổi |
| Tải APK trực tiếp | người dùng cuối | ❌ đúng hành vi `WEB_NONOFFICIAL_APP_SOURCE` gắn cờ |

Dạy người ta đừng cài APK lạ rồi tự phát APK lạ thì không đứng được.

---

## 4. SAU — cần Android native đầy đủ

### #4 — Quét sức khoẻ thiết bị

Ý mạnh nhất trong cả 20 gợi ý. Chi tiết ở `docs/DANH-GIA-20-Y-TUONG.md` §2.

Nó là **mặt trái** của mấy ý overlay: thay vì *đi xin* quyền Trợ năng, nó **báo
cáo xem ai khác đang giữ quyền đó**. Đọc được không cần quyền đặc biệt:

`Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES` · `Settings.canDrawOverlays()` ·
`PackageManager.canRequestPackageInstalls()` · `DevicePolicyManager.getActiveAdmins()`

Hiển thị đỏ/vàng/xanh, ngôn ngữ đời thường: *"Có 2 ứng dụng đang được phép xem
màn hình bác. Nên gỡ."*

Đây là **lý do chính đáng duy nhất** để làm bản Android — không phải ghi âm cuộc gọi.

---

## 5. KHÔNG LÀM — đừng nhặt lại

| Ý | Lý do một câu |
|---|---|
| Ghi âm / phân tích cuộc gọi real-time | App thường không lấy được audio cuộc gọi — `VOICE_CALL` cần `CAPTURE_AUDIO_OUTPUT` (signature\|privileged) |
| Whisper on-device cho low-latency | Whisper không phải streaming ASR — sai công cụ |
| Cloud STT (FPT / Google) | Gửi giọng ra ngoài — §12 cấm đổi privacy model |
| Overlay chặn app ngân hàng | Play cấm · bank chặn overlay · §12 cấm hứa chặn giao dịch |
| Voice fingerprint chống deepfake | Nhận nhầm con ruột thành giả mạo còn tệ hơn không có |
| Passive Voice Monitor / mic nền | Android siết mic nền · bề mặt tấn công lớn |
| Panic button Bluetooth | Sản xuất · chứng nhận · bảo hành — quá tầm |
| Bản đồ nhiệt khu vực | Chưa có người dùng ⇒ mọi số hiện ra là bịa (§11) |
| Port bộ luật sang Kotlin | Hai bản phân kỳ im lặng — 634 test chỉ phủ bản JS |
| Fine-tune Claude | Claude không có fine-tuning |
| `SpeechRecognition` (phần NGHE) | Chrome gửi âm thanh lên máy chủ Google |
| Phát APK cho người dùng cuối | Đúng hành vi `WEB_NONOFFICIAL_APP_SOURCE` gắn cờ |

---

## 6. BA RÀNG BUỘC ÁP CHO MỌI TÍNH NĂNG TRÊN

1. **Không tính năng nào được tự ra mức rủi ro.** `src/analysis/decision-engine.js`
   là bộ luật duy nhất (§4.2). Mọi thứ mới chỉ được đẩy `SIGNAL_ID` vào đó —
   đúng cách `bo-hoi-nhanh.js` đang làm.
2. **Không cụm từ nào được hạ mức vô điều kiện** (§12). Thêm gì cũng chỉ được làm
   tăng cảnh giác.
3. **Ba nhãn không đổi:** `Nguy hiểm cao` · `Nghi ngờ` · `Chưa thấy dấu hiệu rủi ro`.
   Không thêm nhãn thứ tư, không có chữ "An toàn" ở bất kỳ đâu.
