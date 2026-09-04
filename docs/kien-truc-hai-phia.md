# Kiến trúc hai phía — phát hiện thụ động cho người cao tuổi

*Bản 4/9/2026. Khảo sát, không sửa mã.*

> **Câu hỏi phải trả lời trước khi viết tính năng:** PWA không đọc được tin nhắn đến,
> không đọc được thông báo của app khác, không phát hiện được app lạ vừa cài. Toàn bộ
> nhóm "phát hiện thụ động" đòi một thành phần Android thật. Tài liệu này chốt xem
> thành phần đó là gì.
>
> **Phát hiện đầu tiên, và nó làm đổi cả câu hỏi:** thành phần đó **đã tồn tại và đã
> được dựng** trong repo này. Phần lớn tài liệu dưới đây vì thế là *ghi lại một quyết
> định đã ra*, kèm những gì còn thiếu — chứ không phải chọn lại từ đầu.

---

## 1. Phía người cao tuổi làm được gì trên PWA hôm nay

Chia làm hai cột, vì đây chính là chỗ hay bị nói quá.

### 1.1 Chạy được trong trình duyệt thuần (PWA, không cần APK)

| Việc | Đường vào | Ghi chú |
|---|---|---|
| Dán / gõ một đoạn văn bản rồi kiểm | `POST /api/analyze` | Đường chính, có từ đầu |
| Gửi ảnh chụp màn hình để OCR | `POST /api/analyze` (`anh` base64) | OCR hỏng ⇒ `chuaKiem` (§4.3) |
| Quét mã QR | `jsqr` trong trình duyệt | Camera qua `getUserMedia` |
| Trả lời bộ hỏi nhanh | `src/bo-hoi-nhanh.js` | Khi không có nội dung để dán |
| Xem Phiếu tin cậy, Đường xác minh, Quy tắc gia đình | trong app | |
| Nhận Web Push | `backend/src/push.js` | **Chưa cấu hình khoá VAPID** — đường đi đã dựng, hàm gửi thật trả `CHUA_CAU_HINH_PUSH` |
| Chạy khi mất mạng | service worker + `APP_SHELL` | Chỉ vỏ app; đường phân tích vẫn cần máy chủ |

### 1.2 KHÔNG chạy được trong trình duyệt thuần

Đây là danh sách quyết định toàn bộ tài liệu này:

- **Đọc tin nhắn SMS đến.** Không có API web nào cho việc này.
- **Đọc thông báo của app khác** (Zalo, Messenger, app ngân hàng). Không có API web nào.
- **Biết một ứng dụng vừa được cài.** Không có API web nào.
- **Chạy nền liên tục.** Service worker bị hệ điều hành kill tuỳ ý; không có bảo đảm nào.
- **Đổ chuông như cuộc gọi đến.** `requireInteraction` bị Safari bỏ qua hoàn toàn,
  Firefox bỏ qua một phần; `vibrate` chỉ có trên Android.

> **Một tính năng nằm trong danh sách 1.2 mà được mô tả như đã có là một lời hứa
> không giữ được.** §11 cấm gọi một mục tiêu là "đã đo"; cùng logic áp cho "đã làm".

### 1.3 Những gì bản APK hiện tại ĐÃ có

Repo đã có `android/` với Capacitor, và một plugin native tự viết
(`android/app/src/main/java/vn/khoanda/app/`):

| Tệp | Việc |
|---|---|
| `DocThongBao.java` | `NotificationListenerService` — **đã có**, lọc theo 7 app nhắn tin, đệm 20 tin **trong bộ nhớ**, không ghi ra tệp, không ghi log |
| `KhoanDaPlugin.java` | Cầu nối Capacitor: trạng thái quyền, mở đúng màn cài đặt, lấy tin đã bắt, popup nổi, nghe giọng nói, nhận nội dung chia sẻ, theo dõi cuộc gọi |
| `TheoDoiCuocGoi.java` | Foreground service, `FOREGROUND_SERVICE_SPECIAL_USE` |
| `KhoiDongLai.java` | `BOOT_COMPLETED` — sống lại sau khi khởi động máy |
| `PopupDeManHinh.java` | `SYSTEM_ALERT_WINDOW` — bóng nổi |
| `NhanChiaSe.java` | `ACTION_SEND` — bác chia sẻ tin nhắn vào Khoan Đã |

**Còn thiếu ba thứ, và cả ba đều nằm trong phạm vi các PROMPT sau:**

1. Không có `BroadcastReceiver` cho `PACKAGE_ADDED` ⇒ chưa phát hiện được app lạ vừa cài.
2. Tin bắt được nằm im trong bộ đệm chờ bác **chủ động bấm kiểm** ⇒ đây vẫn là phát
   hiện *bị động*, chưa phải *thụ động*. Chưa có đường tự phân tích và tự cảnh báo.
3. Chưa có bộ luật chạy **tại máy**: mỗi lượt kiểm đều gọi `POST /api/analyze`. Mất
   mạng là mất cả khả năng phát hiện.

> ⚠️ **Ghi chú thật thà:** khối bình luận đầu `DocThongBao.java` khai rằng tệp
> **chưa từng qua `javac`** trên máy dựng vì máy đó không có JDK/Android SDK. Trạng
> thái đó có thể đã đổi (đã có `khoan-da.apk` 12,8 MB trong repo) nhưng **phải kiểm
> lại bằng cách tìm chuỗi trong `classes*.dex`, không tin bản dựng báo thành công** —
> bước dex hay kẹt `UP-TO-DATE` dù `javac` đã chạy lại.

---

## 2. Kiến trúc tách đôi

```
        NGƯỜI CAO TUỔI (điện thoại)              NGƯỜI THÂN (máy tính / điện thoại)
   ┌───────────────────────────────────┐      ┌─────────────────────────────────┐
   │  APK Capacitor                    │      │  PWA / web                       │
   │  ├─ WebView: giao diện Khoan Đã   │      │  ├─ Vòng tròn gia đình           │
   │  ├─ DocThongBao (native)          │      │  ├─ Nói gì với bố mẹ             │
   │  ├─ NhanAppMoi (native, CẦN THÊM) │      │  ├─ Báo cáo tuần                 │
   │  └─ backend/src/detect (JS)  ◄────┼──┐   │  └─ Nhận Web Push                │
   │       tầng 0 + tầng 1, OFFLINE    │  │   └─────────────────────────────────┘
   └───────────────┬───────────────────┘  │                    ▲
                   │ tầng 2 (bất đồng bộ) │ CÙNG MỘT MÃ         │ Web Push
                   ▼                      │                    │
        ┌──────────────────────────────────────────────────────┴──┐
        │  Node/Express — backend/                                 │
        │  /api/detect · /api/detect/verify · /api/detect/bo-luat  │
        │  /api/detect/canh-bao · /api/bao-cao-tuan                │
        └──────────────────────────────────────────────────────────┘
```

**Điểm mấu chốt:** `backend/src/detect/` là JavaScript thuần, không phụ thuộc React,
không phụ thuộc Android, không phụ thuộc Express. Cùng một tệp chạy được ở cả ba nơi —
trong WebView của APK, trong Node của máy chủ, và trong `node --test`. Đó là lý do
tầng 0 phát cảnh báo được khi mất mạng.

### 2.1 So sánh ba phương án

#### (a) Capacitor bọc PWA hiện tại + plugin native ← **ĐANG DÙNG**

| | |
|---|---|
| **Ưu** | Đã dựng xong và có APK. Một bộ mã giao diện cho cả hai phía — sửa một chỗ, cả hai nơi cùng đổi. `backend/src/detect/` chạy thẳng trong WebView, không phải viết lại bộ luật bằng Kotlin. Plugin native đã có sẵn sáu tệp. |
| **Nhược** | WebView **không có Web Push** — đã đo, và đã có hàng rào `test/push-trong-apk.test.js`; phải đi đường FCM native với hình dạng đăng ký khác hẳn. Hiệu năng WebView kém hơn native trên máy giá rẻ, mà đó đúng là máy nhóm người dùng này dùng. Cập nhật Capacitor/Gradle là một loại bảo trì riêng. |
| **Rủi ro riêng của repo này** | Đường dẫn tiếng Việt làm hỏng classpath của Gradle wrapper trên Windows; bước dex hay kẹt `UP-TO-DATE`. Cả hai đã cắn một lần. |

#### (b) App Android riêng (Kotlin) gọi chung API

| | |
|---|---|
| **Ưu** | Hiệu năng và độ tin cậy nền tốt nhất. FCM là đường chính thống. Kiểm soát vòng đời service tốt hơn. |
| **Nhược** | **Phải viết lại giao diện cho phía người cao tuổi** — mà giao diện đó chính là phần đã đầu tư nhiều nhất (sàn tiếp cận 52/56px, ba nhãn rủi ro, 1.346 khoá i18n, `vung-cham-san.css`). Và §4.4 khai sàn tiếp cận theo VAI TRÒ trong CSS; dựng lại bằng XML/Compose là dựng lại cả bộ hàng rào. **Hoặc phải chép bộ luật sang Kotlin — đúng thứ `test/bo-luat-khong-duoc-lech.test.js` sinh ra để chặn**, và lần nhân bản trước đã làm recall tiếng Việt của bản ship tụt từ 75,3% xuống 32,9% mà không số đo nào phát hiện. |
| **Kết luận** | Không đáng, trừ khi (a) chết vì hiệu năng — mà điều đó chưa được đo. |

#### (c) TWA (Trusted Web Activity)

| | |
|---|---|
| **Ưu** | Nhẹ nhất, gần như không phải bảo trì. |
| **Nhược** | **Loại thẳng.** TWA chỉ là một tab Chrome toàn màn hình — nó **không cho phép** thêm `NotificationListenerService` hay `BroadcastReceiver` của riêng mình. Nó không giải được đúng bài toán đang bàn. |

### 2.2 Chốt

**Giữ (a).** Không phải vì nó tốt nhất trên giấy, mà vì:

1. Nó đã chạy, và thời gian còn lại tới 15/10 ngắn.
2. Nó là phương án DUY NHẤT giữ được **một bộ luật** — điều kiện của §4.2, và là bài
   học đắt nhất repo này đã trả.
3. Nhược điểm lớn nhất (thiếu Web Push) đã được nhận diện, đã có đường FCM native
   dựng sẵn trong `push.js`, và đã có test chặn việc ép token FCM qua khuôn Web Push.

**Ghi lại để không phải bàn lại:** nếu sau này đo được WebView chậm tới mức tầng 0 vượt
ngân sách 200ms trên máy thật, thì phương án là **chuyển riêng `backend/src/detect/`
sang một thư viện Kotlin sinh tự động từ cùng bộ luật JSON** — chứ không phải viết lại
bộ luật bằng tay.

---

## 3. Ranh giới API giữa app Android và backend

### 3.1 Xử lý TẠI MÁY, không gửi đi đâu

| Việc | Ở đâu |
|---|---|
| Chuẩn hoá, gỡ che URL, bỏ dấu, ký tự đồng hình | `detect/chuan-hoa.js` |
| Toàn bộ luật R1–R10 | `detect/tang-0.js` |
| Phân tích URL, thực thể, tên miền nhái | `detect/tang-1.js` |
| Chấm điểm và ra nhãn | `analysis/decision-engine.js` |
| Critical override | `analysis/critical-overrides.js` |
| Phát hiện app lạ vừa cài | `detect/ung-dung-la.js` |

**Toàn bộ nhóm này chạy offline.** Mất mạng, mất máy chủ, mất AI — tầng 0 vẫn báo được.

### 3.2 Endpoint cần thêm (đã thêm trong đợt này)

| Đường | Chiều | Dữ liệu ĐI LÊN | Ghi chú |
|---|---|---|---|
| `POST /api/detect` | máy → chủ | nội dung, người gửi | **Chỉ cho luồng web.** APK gọi `detect.analyze()` tại máy, không đi đường này |
| `POST /api/detect/verify` | máy → chủ | **tên miền + BĂM số tài khoản** | §6.9 — không có nội dung tin nhắn. Băm SHA-256 tính tại máy |
| `GET /api/detect/bo-luat` | chủ → máy | — | Bộ luật có `phienBan`; máy cache lại. Chiêu lừa đổi hằng tuần |
| `POST /api/detect/ung-dung` | máy → chủ | tên gói, tên hiển thị, nguồn cài | Không mang dữ liệu riêng tư của bác |
| `POST /api/detect/canh-bao` | máy → chủ | kết quả + vòng tròn | **Không giới hạn tần suất** (§6.10) |
| `POST /api/detect/canh-bao/:id/:hanhDong` | máy → chủ | `mo` · `goi` · `toi-on` · `ket-qua` | Dữ liệu hiệu chỉnh ngưỡng (§4.6) |
| `POST /api/dien-tap/phat` | chủ → máy | — | Phiếu đồng ý là cổng cứng |
| `GET /api/bao-cao-tuan` | chủ → người thân | — | Gửi kể cả tuần yên ả |

### 3.3 Dữ liệu KHÔNG BAO GIỜ đi lên (mặc định)

- **Toàn văn tin nhắn.** Có công tắc cho bác bật để cải thiện hệ thống, **mặc định TẮT**,
  và mặc định đó nằm trong `dungPayloadTang2()` chứ không ở tầng gọi — để chỉ có một chỗ
  quên là được.
- **Số tài khoản dạng thô.** Chỉ đi ở dạng băm SHA-256.
- **Số điện thoại người gửi.** Bị che ngay ở tầng phát hiện (`che()`).
- **Danh bạ, ảnh, vị trí.** Không có đường nào gửi.

---

## 4. Rào cản chính sách cửa hàng — CẦN KIỂM TRA TRƯỚC

> ⚠️ **Mục này chỉ NÊU RA những gì phải kiểm, không khẳng định quy định cụ thể.**
> Chính sách cửa hàng đổi thường xuyên và câu chữ mới là thứ có hiệu lực. Mỗi dòng dưới
> đây phải được đọc lại **trên trang chính sách hiện hành** trước khi nộp bản đầu tiên.

1. **Quyền đọc thông báo (`BIND_NOTIFICATION_LISTENER_SERVICE`).** Cần kiểm: có phải
   khai báo mục đích không, có phải qua vòng duyệt riêng không, có yêu cầu video minh
   hoạ luồng dùng không, và mục đích của app có nằm trong nhóm được chấp nhận không.
   Đây là quyền nhạy cảm nhất của cả app — nó đọc được **mọi** thông báo trên máy.
2. **Nhóm quyền SMS/Call Log.** Chúng tôi **cố ý không dùng** `READ_SMS`. Cần kiểm lại
   rằng lựa chọn notification listener đúng là đường ít ma sát hơn, và rằng
   `READ_PHONE_STATE` (đang dùng cho `TheoDoiCuocGoi`) không rơi vào nhóm bị hạn chế.
3. **`SYSTEM_ALERT_WINDOW`** (bóng nổi) và **`FOREGROUND_SERVICE_SPECIAL_USE`.** Cần
   kiểm yêu cầu giải trình cho từng cái, và xem `specialUse` subtype đang khai có được
   chấp nhận không.
4. **`QUERY_ALL_PACKAGES` / `PACKAGE_ADDED`.** Nếu tính năng "phát hiện app lạ" cần
   nhìn danh sách gói, phải kiểm xem có rơi vào nhóm quyền hạn chế không, và có cách
   nào làm mà **không** cần quyền đó không (chỉ nghe broadcast, không liệt kê).
5. **Phát hành APK ngoài cửa hàng.** Repo hiện phục vụ `khoan-da.apk` qua HTTP. Việc
   này chấp nhận được để thử trong nhóm, nhưng **mỉa mai thay, nó đúng là hành vi mà
   luật R2 của chính chúng tôi gắn nhãn CAO**. Trước khi công khai: hoặc lên cửa hàng,
   hoặc ghi rõ trong tài liệu vì sao đây là ngoại lệ và làm sao người dùng kiểm chứng
   được bản tải về (chữ ký, mã băm công bố).
6. **Nội dung chống lừa đảo.** Cần kiểm chính sách về app "bảo mật/chống lừa đảo" —
   một số cửa hàng đòi bằng chứng tổ chức đứng sau, hoặc cấm các tuyên bố hiệu quả
   không chứng minh được. §11 của chúng tôi đã cấm những tuyên bố đó rồi, nên phần này
   nhiều khả năng thuận, nhưng vẫn phải đọc.

---

## 5. Ước lượng công sức

Đơn vị: **ngày công của một người đã quen repo này**. Không tính thời gian chờ duyệt cửa hàng.

### 5.1 Phương án (a) — Capacitor, đường đang đi

| Hạng mục | Ngày công | Ghi chú |
|---|---:|---|
| `backend/src/detect/` tầng 0+1+2, bộ luật cập nhật được, test, fixtures | **3** | ✅ *đã xong đợt này* |
| Cảnh báo hai phía + bảng `canh_bao` + endpoint | **2** | ✅ *đã xong đợt này* |
| Diễn tập + chỉ số cảnh giác + báo cáo tuần | **2** | ✅ *đã xong đợt này* |
| `NhanAppMoi.java` — `PACKAGE_ADDED` receiver + luồng cấp quyền | 1,5 | còn lại |
| Nối `DocThongBao` → `detect.analyze()` tự động (thay vì chờ bác bấm) | 2 | còn lại |
| Màn cảnh báo toàn màn hình phía người cao tuổi (React) | 1,5 | còn lại |
| FCM: khoá, đăng ký native, đổ chuông, đo giao nhận | 3 | còn lại — **phụ thuộc tài khoản Firebase** |
| Luồng cấp quyền do NGƯỜI THÂN thực hiện, có ảnh chụp từng bước | 2 | còn lại |
| Đo pin, đo hiệu năng trên máy thật giá rẻ | 1,5 | còn lại |
| Kiểm thử thủ công theo kịch bản (mục 6) | 2 | còn lại |
| Hồ sơ chính sách cửa hàng | 2 | còn lại |
| **Tổng còn lại** | **≈ 15,5** | |

### 5.2 Phương án (b) — app Kotlin riêng

Cộng thêm vào 15,5 ngày ở trên:

| Hạng mục | Ngày công |
|---|---:|
| Dựng lại giao diện phía người cao tuổi bằng Compose (kèm sàn tiếp cận §4.4) | 12 |
| Dựng lại i18n (1.346 khoá) và hàng rào ba nhãn rủi ro | 4 |
| Sinh thư viện luật cho Kotlin từ JSON + hàng rào chống lệch hai bản | 6 |
| **Tổng thêm** | **≈ 22** |

### 5.3 Phương án (c) — TWA

Không ước lượng: nó không giải được bài toán.

---

## 6. Kiểm thử thủ công — kịch bản bắt buộc

Phần logic thuần đã có test tự động (`test/detect-*.test.js`, `test/canh-bao-hai-phia.test.js`,
`test/ung-dung-la.test.js`). Phần **native thì không** — máy dựng không có Android SDK.
Danh sách dưới đây phải chạy tay trên **máy thật**, và ghi lại kết quả kèm phiên bản
Android + hãng máy.

### 6.1 Quyền đọc thông báo

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| 1 | Cài mới, chưa cấp quyền | App nói rõ chưa canh được — **không** nói "đang bảo vệ" |
| 2 | Người thân cấp quyền theo hướng dẫn từng bước | Trạng thái đổi trong ≤ 3 giây, không cần khởi động lại |
| 3 | Vào Cài đặt hệ thống tắt quyền | App phát hiện trong ≤ 60 giây và **báo cho NGƯỜI THÂN**, không báo cho bác |
| 4 | Khởi động lại máy | Service sống lại; nếu không, báo cho người thân |
| 5 | Bật Tiết kiệm pin / Doze | Ghi lại: bao lâu thì service bị kill, trên hãng nào |

### 6.2 Bắt tin và phân tích

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| 6 | SMS giả danh CSGT có link `.top` | Màn toàn màn hình, nhãn CAO, ≤ 3 giây kể từ khi thông báo hiện |
| 7 | Cùng tin đó khi **bật chế độ máy bay** | **Vẫn báo** — đây là phép thử của cả kiến trúc |
| 8 | Tin OTP thật của ngân hàng | **Không** báo gì |
| 9 | Cùng một tin do cả Zalo lẫn app SMS bắn thông báo | Phân tích **một lần**, không báo hai lần |
| 10 | Thông báo của chính Khoan Đã | Bỏ qua |
| 11 | Thông báo nhạc / game / hệ thống | Bỏ qua |
| 12 | Thông báo bị cắt cụt (`…`) | `chuaKiem` có `chi_doc_duoc_mot_phan_tin`, **không** ra "chưa thấy dấu hiệu" |
| 13 | Thông báo rỗng | Như trên |

### 6.3 Ứng dụng lạ

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| 14 | Cài app từ CH Play | Không báo |
| 15 | Cài app từ tệp `.apk` tải tay | Báo CAO **ngay**, cả hai phía |
| 16 | App tự cập nhật qua CH Play | Không báo |
| 17 | Người thân cài app bệnh viện trong cửa sổ thiết lập | Không báo (danh sách trắng) |
| 18 | Thêm vào danh sách trắng **sau** cửa sổ thiết lập | Bị từ chối, và báo cho người thân |

### 6.4 Hai phía

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| 19 | Nhãn CAO, người thân online | Máy người thân **đổ chuông**; ghi lại hãng máy + trình duyệt nào không kêu |
| 20 | Nhãn CAO, máy người thân tắt mạng | Bác thấy "chưa gửi được cho …" — **không** thấy "đã báo cho …" |
| 21 | Nhãn NGHI_NGO | Push im, gom vào báo cáo ngày |
| 22 | Chưa đặt quy tắc gia đình | Bác thấy nút "Báo cho …"; **không** tự gửi |
| 23 | Bấm "Tôi ổn, không có gì nguy hiểm" ở màn PROTECTED_CRITICAL | Thoát được; bản ghi giữ nguyên nhãn |
| 24 | Người thân bấm "Đánh dấu là báo nhầm" | Vào `canh_bao.ketQua = bao_nham` |

### 6.5 Pin và hiệu năng

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| 25 | Chạy 24 giờ ở chế độ dùng bình thường | Ghi số % pin của app trong Cài đặt → Pin |
| 26 | Bắn 100 thông báo liên tiếp | Không ANR, không rớt tin |
| 27 | Đo `doTre` trên máy thật (Android 10, RAM 2GB) | Ghi số thật; **đừng trích số đo trên máy dựng** |

> **Cách đo pin:** `adb shell dumpsys batterystats --charged vn.khoanda.app` sau một chu
> kỳ 24 giờ, và `Cài đặt → Pin → Mức dùng pin theo ứng dụng` để đối chiếu bằng con số
> người dùng thật nhìn thấy. **Ghi cả hai**, vì chúng hay lệch nhau.

---

## 7. Những gì tài liệu này CỐ Ý không hứa

- Không hứa chặn được cuộc gọi. (§12)
- Không hứa chặn được giao dịch ngân hàng. (§12)
- Không hứa app sẽ luôn chạy nền — nhà sản xuất Trung Quốc (Xiaomi, Oppo, Vivo) có bộ
  quản lý pin riêng và **sẽ** kill service. Cách xử lý là *phát hiện được và báo cho
  người thân*, không phải giả vờ rằng nó không xảy ra.
- Không hứa đọc được nội dung cuộc gọi. `chua_nghe_duoc_cuoc_goi` là câu nói thật về
  giới hạn đó, và nó phải ở lại.
