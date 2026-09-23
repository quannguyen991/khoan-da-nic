# Cầu dao gia đình + Chìa khoá thứ hai — thiết kế

Ngày 23/9/2026 · cho vòng tiếp theo của NextGen 2026 (còn khoảng 1 tuần)
Hướng đã chọn: **A (Cầu dao gia đình) + B (Chìa khoá thứ hai / két tiết kiệm)**

---

## 0. Vì sao phải làm lại

Đo trên màn thật 375×812 ngày 23/9/2026:

- Ở mức nguy hiểm nhất, nút gọi con nằm ở y=716–805 trên màn cao 812. Giữa màn là khối "CHƯA kiểm được" chữ 25px.
- Nút "Đang bị ai gọi?" cần 4 lần chạm mới ra lời dặn. Màn kết quả của nó dặn "tự gọi cho con cháu" nhưng không có nút gọi.
- Vòng đếm 60 giây chỉ để ngồi nhìn. Đọc to chỉ chạy khi người dùng bấm.
- Con cháu không nhận được gì từ hệ thống: thông báo đẩy chưa có, và route cảnh báo người thân chỉ dựng dữ liệu rồi trả về.
- Mọi cảnh báo chỉ hiện sau khi người già tự mở app và tự gửi nội dung đi kiểm. Tài liệu pitch tự ghi đây là rủi ro lớn nhất.

**Gốc của vấn đề.** Kẻ lừa thắng nhờ ba thứ: sợ hãi, cô lập ("không được nói với ai", "giữ máy") và gấp gáp. Chữ trên màn không phá được thứ nào trong ba thứ đó. Thứ phá được cả ba là **giọng người thân chen vào**.

**Định vị mới.** Khoan Đã là **cầu dao**, làm ba việc: ngắt đúng lúc, kéo người thân vào cuộc trong 60 giây, và nếu tiền đã đi thì dẫn làm ngay các việc của giờ vàng. Nhận diện chỉ là công tắc bật cầu dao.

> "Kẻ lừa đảo cần bác ở một mình. Khoan Đã không để bác một mình."

### Tiêu chí thành công (đo được, không phải cảm nhận)

| # | Tiêu chí | Cách đo |
|---|---|---|
| S1 | Ở mức CAO/PROTECTED_CRITICAL/PAUSE_60S, **đỉnh** nút gọi con nằm ở **nửa trên** màn 375×812 (top < 406px) | test DOM + đo bằng trình duyệt |
| S2 | Phần nhìn thấy khi chưa cuộn, trên nút gọi, có **≤ 25 chữ** | đếm chữ trong khung nhìn |
| S3 | Màn khẩn cấp **tự đọc to** câu lệnh trong ≤ 1 giây, không cần bấm | test gọi hàm đọc to khi màn gắn |
| S4 | APK: từ lúc màn đỏ hiện tới khi máy con đổ chuông là **1 chạm** | thử máy thật (bác thử) |
| S5 | Bố mẹ đã bật báo cho con → mức CAO làm máy con **nhận thông báo thật** trong ≤ 10 giây (khi có mạng) | thử 2 trình duyệt + log trạng thái gửi |
| S6 | APK: đang có cuộc gọi + tin OTP tới → màn cảnh báo **tự hiện**, không cần mở app | thử máy thật (bác thử) |
| S7 | Không câu nào hứa "an toàn", "đã chặn", "con đã đọc" (§11) | test quét chuỗi |

---

## 1. Ràng buộc giữ nguyên (không đổi, không hỏi lại)

- §HĐ: bảy trường, không thêm, không đổi. `nhan` và `canThiep` vẫn tách nhau.
- §HĐ luật 3: `chuaKiem` vẫn **cùng cỡ chữ với nhãn**. Chỉ đổi **vị trí**: xuống dưới nút gọi con. Hợp đồng quy định cỡ chữ, không quy định vị trí.
- §12: giữ nguyên 10 override, ngưỡng 20/45 và trần 69. Không có LLM judge. Không đổi privacy model.
- **App không tự gọi, không tự nhắn thay người dùng.** Tự báo cho con chỉ xảy ra khi **bố mẹ tự bật** công tắc trên máy mình. Mặc định là tắt.
- **Nội dung tin nhắn không rời khỏi máy.** Mọi thứ gửi cho con chỉ là **mã**: mức, họ kịch bản, loại sự kiện, hành động đã làm.
- Lời nhắn giọng của con **chỉ lưu trên máy bố mẹ** (bác chọn ngày 23/9).
- Sàn tiếp cận §4.4 giữ nguyên: vùng chạm 52/56px, chữ 14px, tương phản 4.5:1, cấm `nowrap` trên nút.
- Mọi chuỗi người dùng đọc, kể cả thông báo đẩy và lời đọc to, đi qua catalog i18n (vi + en).

---

## 2. Phần 1 — Màn khẩn cấp chỉ có một việc

**Áp dụng cho:** `WarningView` ở ba mức `PAUSE_60S`, `PROTECTED_CRITICAL` và `nhan = CAO`, cùng màn kết quả của bộ hỏi nhanh.

### 2.1 Bố cục mới (từ trên xuống)

1. **Một câu lệnh**, tối đa 8 chữ, cỡ lớn. Lấy từ việc an toàn tiếp theo đã có (`chonViecAnToan`), bản rút gọn:
   - "Cúp máy. Gọi con Minh."
   - "Đừng đọc mã cho ai."
   - "Đừng cài. Gọi con Minh."
   - "Gọi số in sau thẻ."
2. **Nút gọi con**, thật to, nằm ở nửa trên màn. Có tên người sẽ được gọi.
   - Chưa có số người thân thì nút chính là **gọi Cảnh sát 113** (số đã có trong `so-khan-cap.ts`), và câu lệnh không nhắc "gọi con cháu".
   - "Thêm số con cháu" nằm trong "Xem thêm". Mã cũ đã ghi lý do từ 19/9: bắt người đang bị giục điền một biểu mẫu là việc không ai làm được. *(Chốt lúc lập kế hoạch, 23/9.)*
3. **Nút thứ hai, nhỏ hơn:** "Phát lời nhắn của con" (nếu có ghi âm) hoặc "Đọc lại".
4. Nhãn mức (Nguy hiểm cao…) và các lý do: tối đa 3 dòng ngắn.
5. **Khối `chuaKiem`**, cùng cỡ chữ với nhãn (§HĐ luật 3), nằm ở đây, **dưới** các nút hành động.
6. "Xem thêm": 113, mật khẩu gia đình, 156, cảnh báo app trợ năng, "Tôi đã lỡ chuyển tiền".
7. "Tôi ổn, không có gì nguy hiểm" ở cuối (§4.6, vẫn ghi làm mẫu báo động giả).

**Bỏ hình tam giác trang trí** ở mức CAO. Vòng đếm 60 giây **thu nhỏ thành một dòng phụ** ("còn 45 giây"), không còn nằm ở trung tâm màn.

### 2.2 Tự nói thay vì bắt đọc
- Khi màn gắn: **tự đọc to** câu lệnh. Người dùng vừa chạm nút kiểm nên trình duyệt cho phép phát tiếng. Bản APK đọc bằng TTS máy (`DocVanBan`).
- Máy có lời nhắn giọng của con (Phần 2) thì **phát lời nhắn đó thay cho giọng máy**.
- Có nút tắt tiếng, và app chỉ tự phát một lần mỗi lượt. Phát lặp lại làm người ta hoảng thêm.
- Tự phát thất bại (trình duyệt chặn, máy im lặng) thì im lặng, không báo lỗi và không ghi lại, vì câu lệnh vẫn nằm trên màn. Nút "Đọc to" vẫn báo lỗi như cũ khi bác tự bấm. *(Chốt lúc lập kế hoạch, 23/9.)*

### 2.3 Khoảng dừng là để gọi, không phải để chờ
- Bấm nút gọi con → ghi hành động `bam_goi_nguoi_than` (đã có) → mở trình quay số. Bản APK gọi thẳng (Phần 4).
- Khi người dùng **quay lại app** (sự kiện `visibilitychange`, hoặc `resume` ở APK) sau khi đã bấm gọi, màn hỏi **đúng hai nút to**:
  - **"Con bảo là lừa đảo"** → sang màn "Việc tiếp theo". Chưa chuyển tiền: "Không nghe máy số đó nữa" và nút "Tôi đã lỡ chuyển tiền". Đã chuyển: luồng RECOVERY.
  - **"Con bảo không sao"** → ghi `con_bao_khong_sao` và về trang chủ. **Không hạ nhãn** (§4.2). Chỉ ghi lại để hiệu chỉnh, giống "Tôi ổn".
- Hết 60 giây mà chưa hành động thì giữ bậc leo thang đã có (thẻ "Đã qua 60 giây").

### 2.4 Nút "Đang bị ai gọi?"
- Chọn "Đưa mã OTP" → **ngay lần chạm đó** hiện một băng đỏ trên câu hỏi tiếp: "Dù thế nào: đừng đọc mã cho ai." Hai câu hỏi sau vẫn giữ để bộ luật có đủ tín hiệu (không đổi bộ luật).
- Làm tương tự với "Cài ứng dụng" ("Đừng cài gì trong lúc đang gọi.") và "Chuyển tiền" ("Chưa chuyển gì cả.").
- Màn kết quả: **thêm nút gọi con** (cùng thành phần với 2.1). Đổi nhãn nút "Cúp máy & dừng 60 giây" thành "Tôi đã cúp máy", vì app không cúp máy được.

### 2.5 Màn giới thiệu lần đầu
- Sửa câu nói quá "AI thông minh kiểm tra cuộc gọi, tin nhắn, đường link và giao dịch lạ" thành "Kiểm tin nhắn, đường link, ảnh chụp màn hình." (§11)
- Nút **"Con cháu cài giúp"** ở trang cuối được làm ở **Phần 2**, cùng lúc với luồng mà nó dẫn tới. *(Chốt lúc lập kế hoạch, 23/9.)*

### 2.6 Test
- `test/man-khan-cap-mot-viec.test.js`:
  - thứ tự trong mã nguồn: nút gọi đứng trước khối `chuaKiem`;
  - khối `chuaKiem` vẫn cùng lớp cỡ chữ với nhãn;
  - có gọi hàm đọc to khi màn gắn;
  - 156 không nằm trong khối chính.
- Cập nhật các test đang chốt bố cục cũ, nếu có (`man-khan-cap-khong-nhieu-chu`, `viec-an-toan-va-leo-thang`).
- Đo S1/S2 bằng trình duyệt ở 375×812 cho cả hai trường hợp: có số con và chưa có số.

---

## 3. Phần 2 — Con cài giúp bố mẹ

Người cài app cho người già thường là con cháu. Luồng này làm trên **máy bố mẹ**, con ngồi cạnh.

### 3.1 Các bước (mỗi màn một việc)
1. **Tài khoản cho bố mẹ:** đăng ký bằng số điện thoại của bố mẹ, hoặc đăng nhập nếu đã có. Dùng màn tài khoản sẵn có.
2. **Nối với máy con:**
   - Máy bố mẹ lấy mã 6 số (đã có).
   - Con nhập mã trên máy mình (đã có).
   - **Mới:** nối xong thì người con **tự vào danh sách người thân** (`familyMembers`) trên máy bố mẹ, lấy tên và số từ máy chủ. Nút gọi khẩn cấp có số ngay, không phải gõ lại.
3. **Ghi lời nhắn giọng** (tối đa 15 giây):
   - Dùng `MediaRecorder` và lưu **IndexedDB trên máy bố mẹ**, không gửi đi đâu.
   - Có câu mẫu gợi ý: "Mẹ ơi, con Minh đây. Ai bảo chuyển tiền hay đọc mã thì mẹ cúp máy, gọi con nhé."
   - Nghe lại, ghi lại, hoặc bỏ qua.
4. **Quy tắc báo cho con**, hai công tắc, **mặc định tắt**, bố mẹ tự bật:
   - "Báo cho con khi Khoan Đã thấy nguy hiểm cao."
   - (APK) "Báo cho con khi máy nhận mã OTP trong lúc đang có cuộc gọi."

   Quy tắc lưu ở máy chủ dưới tài khoản bố mẹ. **Chỉ phiên của bố mẹ đặt được** (§12).
5. **(APK) Cấp quyền:** gọi điện thẳng, đọc thông báo, hiện trên ứng dụng khác, trạng thái cuộc gọi. Mỗi quyền một màn, một câu giải thích vì sao cần.
6. **Diễn tập 30 giây:** con bấm "Thử" → màn khẩn cấp hiện với chữ "ĐÂY LÀ DIỄN TẬP" → bố mẹ tập bấm nút gọi con.

### 3.2 Không để cảnh báo im lặng tắt
- **Phiên tự gia hạn:** mỗi lần mở app, nếu phiên còn dưới 7 ngày thì máy chủ cấp phiên mới. Chỉ cần bố mẹ mở app ít nhất một lần mỗi tháng. Việc này thêm vào `layHoSo()`.
- **Dòng trạng thái trên máy bố mẹ** (Cài đặt → Nối với con cháu): "Đang báo được cho con: Minh ✓" hoặc lý do không báo được ("Phiên đã hết, nhờ con đăng nhập lại", "Con chưa bật nhận cảnh báo"). §4.3: "chưa báo được" không được trông giống "đã báo được".

### 3.3 Test
- Nối xong thì người con có trong `familyMembers`, không trùng lặp.
- Ghi âm không có đường nào gửi lên máy chủ: quét nguồn không có `fetch` nào mang blob âm thanh.
- Quy tắc mặc định tắt; phiên của con không đặt được quy tắc của bố mẹ (403).
- Phiên sắp hết thì được gia hạn.

---

## 4. Phần 3 — Cảnh báo thật tới máy con

### 4.1 Luồng
1. **Con bật nhận cảnh báo** trên màn Guardian bằng nút "Bật nhận cảnh báo của bố mẹ": xin quyền thông báo → đăng ký Web Push (VAPID) → `POST /api/push/dang-ky` (đã có, lưu vào kho). Không cần tạo tài khoản Firebase.
2. **Bố mẹ gặp mức CAO** (từ bất kỳ lượt kiểm nào) và đã bật quy tắc → máy bố mẹ gửi `POST /api/gia-dinh/bao-dong`.
   - Thân chỉ gồm **mã**: `{ nhan, canThiep, hoKichBan, loaiSuKien: 'ket_qua_kiem' | 'otp_trong_cuoc_goi' | 'cai_app_trong_cuoc_goi' }`.
   - Máy chủ kiểm enum, kiểm quy tắc của bố mẹ, rồi gửi push tới **mọi thành viên đã ghép** có đăng ký.
3. **Nội dung thông báo** do máy chủ soạn từ catalog, theo ngôn ngữ của **người nhận**. Ví dụ: "Mẹ Lan đang gặp tình huống nguy hiểm cao (giả danh công an). Gọi mẹ ngay." Có `requireInteraction` và rung ngắn (sw.js đã có).
4. **Bấm vào thông báo** → mở màn Guardian "Mẹ đang cần con" với một nút thật to "Gọi mẹ ngay" (`tel:`) và dòng thời gian trạng thái.
5. **Hai chiều:** mọi hành động trên máy bố mẹ (`bam_goi_nguoi_than`, `toi_on`, `da_lo_chuyen`, `con_bao_khong_sao`) được gửi lên dạng mã → push nhẹ tới con ("Mẹ đã bấm gọi con lúc 14:08", "Mẹ bấm 'Tôi ổn'").
6. **Leo thang:** 60 giây sau cảnh báo mà bố mẹ chưa hành động và chưa con nào bấm "Gọi mẹ ngay" → push lần hai. Có người kế tiếp trong vòng thì gửi cho người đó.
   - Phía con, bấm "Gọi mẹ ngay" gửi mã `con_da_bam_goi` lên máy chủ trước khi mở `tel:`, để app không báo lần hai.

### 4.2 Trung thực về trạng thái gửi (§9.4, §11)
- Máy bố mẹ chỉ hiện đúng ba loại câu:
  - "Đã gửi tới máy Minh" khi dịch vụ push nhận;
  - "Không xác nhận được đã tới máy Minh";
  - "Chưa gửi được — Minh chưa bật nhận cảnh báo".
- **Không bao giờ** "Minh đã thấy". "Đã mở" chỉ khi có sự kiện bấm thông báo, ghi audit.

### 4.3 Hạ tầng
- Thêm thư viện `web-push` (MIT). Khoá VAPID sinh tại chỗ, nằm trong `.env` (gitignored). **Bác tự đặt trên Render** (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- `/api/suc-khoe` thêm `pushCauHinh: true/false`, chỉ báo có hay không.
- Hẹn giờ leo thang giữ trong bộ nhớ, nên máy chủ khởi động lại là mất các hẹn đang chờ. Ghi rõ giới hạn này, không giả vờ bền.
- Chặn dội: cùng một bố mẹ, cùng loại sự kiện, gộp lại trong 30 giây. **Không** chặn theo tần suất kiểu 429 (§6.10: không chặn đường báo người thân).

### 4.4 Test
- `test/bao-dong-gia-dinh.test.js` qua HTTP thật:
  - quy tắc tắt → không gửi;
  - quy tắc bật → hàm gửi được gọi với đúng người nhận;
  - payload **không có** chữ nào từ tin nhắn;
  - enum lạ → 400;
  - phiên con → không đặt được quy tắc;
  - gộp 30 giây.
- Thay `web-push` bằng hàm giả trong test. Không gửi push thật từ test.

---

## 5. Phần 4 — Tự bật trên APK

### 5.1 Hai tổ hợp, chạy ngay trên máy
1. **Đang có cuộc gọi (hoặc vừa kết thúc ≤ 2 phút) + tin nhắn chứa mã OTP tới**
   - Nguồn: `TheoDoiCuocGoi` (trạng thái cuộc gọi) và `DocThongBao` (thông báo từ app tin nhắn, lọc tại máy bằng regex).
   - Kết quả: màn khẩn cấp tự mở, tự đọc to "Ai đang gọi mà xin mã này là lừa đảo. Đừng đọc mã."
2. **Đang có cuộc gọi + vừa cài app mới**
   - Nguồn: bộ nhận `PACKAGE_ADDED`, **đăng ký động trong foreground service**. Receiver khai trong manifest không nhận được sự kiện này trên Android 8 trở lên.
   - Kết quả: màn tự mở "Ai bảo bác cài app trong lúc đang gọi là lừa đảo."

### 5.2 Đây là lời nhắc, không phải kết luận
- Màn tự bật **không mang nhãn rủi ro** (§4.2: chỉ bộ luật ra nhãn). Nó mang câu lệnh, nút gọi con, "Tôi ổn", và nút "Kiểm tin này". Nút kiểm đi qua `/api/analyze` như mọi lượt; nội dung chỉ rời máy khi bác bấm.
- Nếu bố mẹ đã bật công tắc thứ hai ở mục 3.1, app gửi `bao-dong` với `loaiSuKien: 'otp_trong_cuoc_goi'`, **không kèm nội dung tin**.

### 5.3 Mở màn từ nền
- Dùng quyền "hiện trên ứng dụng khác" (đã có, bác bật tay). Android cho app có quyền này mở activity từ nền. `MainActivity` mở với `targetView` tương ứng. Không có quyền thì rơi về thông báo heads-up (đã có).

### 5.4 Gọi thẳng một chạm
- Thêm `CALL_PHONE` (bác duyệt ngày 23/9) và xin quyền ở bước 5 của Phần 2. Nút gọi con trên APK dùng `ACTION_CALL`. Bị từ chối quyền thì rơi về `ACTION_DIAL` như cũ.
- Sửa `PERMISSIONS-AND-POLICY.md`: bỏ `CALL_PHONE` khỏi danh sách "cố ý không xin", ghi rõ lý do và lúc dùng.

### 5.5 Kiểm thử
Máy này không có adb, nên bác thử trên máy thật. Cháu gửi kèm danh sách từng bước:
- đang gọi thì tự nhắn một tin chứa "Ma OTP cua ban la 123456";
- đang gọi thì cài một app bất kỳ;
- bấm gọi con: máy đổ chuông ngay hay mở màn quay số;
- tắt quyền hiện trên app khác thì còn heads-up không.

Test tự động chỉ phủ được phần JS và phần soát chuỗi, quyền trong manifest.

---

## 6. Phần 5 — Chìa khoá thứ hai + ngân hàng mô phỏng (hướng B)

### 6.0 Bật chìa khoá thứ hai
- Có màn "Chìa khoá thứ hai" trên **máy bố mẹ**: một công tắc (mặc định tắt) và một ngưỡng tiền (mặc định 10 triệu, chọn bằng nút: 5 / 10 / 20 / 50 triệu).
- Lưu ở máy chủ dưới tài khoản bố mẹ, chỉ phiên của bố mẹ đặt được. Giống quy tắc báo cho con ở mục 3.1.

### 6.1 Nhờ con xác nhận trước khi chuyển (chạy thật)
- **Máy bố mẹ:** Cài đặt → "Nhờ con xác nhận khoản chuyển". Chọn bằng nút, không gõ:
  - Khoảng tiền: dưới 5 triệu, 5–50 triệu, trên 50 triệu. Chỉ khoảng, không số chính xác (§6.9).
  - Ai bảo chuyển: người lạ, người quen, không rõ.
  - Việc: chuyển khoản hay rút tiền.

  Dùng `/api/proof/yeu-cau/tao` (đã có).
- **Máy con:** nhận push "Mẹ nhờ con xác nhận một khoản chuyển 5–50 triệu" → mở màn yêu cầu → **Xác nhận / Từ chối** bằng passkey (`/api/proof/yeu-cau/:id/ky`, đã có). Con chưa có passkey thì đăng ký lần đầu (`/api/proof/dang-ky/*`, đã có).
- **Máy bố mẹ thấy:** "Minh đã xác nhận lúc 14:08", "Minh từ chối", hoặc "Chưa có trả lời". **Không bao giờ** "an toàn": chữ ký chỉ nói *ai đã ký*, không nói khoản chuyển tốt hay xấu (chú thích §11 ở server.js).

### 6.2 Ngân hàng mô phỏng (chỉ để demo)
- Màn riêng "Ngân hàng mô phỏng". Có **băng "MÔ PHỎNG — ngân hàng thật chưa tích hợp"** luôn hiện, không nằm trong điều hướng chính. Vào từ Cài đặt → "Xem mô phỏng tích hợp ngân hàng".
- Người dùng nhập người nhận và số tiền, rồi bấm Xác nhận chuyển. Màn gọi `POST /api/chia-khoa-thu-hai/kiem { khoangTien, nguoiNhanMoi }`, không gửi tên hay số tài khoản.
- Gia đình đã bật chìa khoá thứ hai, khoản chuyển ≥ ngưỡng gia đình đặt, và người nhận mới → màn **giữ lệnh**: "Chờ con xác nhận", rồi tạo yêu cầu như 6.1. Con xác nhận thì mô phỏng chuyển xong. Con từ chối, hoặc 30 phút không có trả lời, thì lệnh bị huỷ.
- Câu trình bày với giám khảo: "Singapore đã có Money Lock (UOB, OCBC, DBS). Đây là cách một ngân hàng Việt có thể dùng Khoan Đã làm chìa khoá thứ hai." **Đề xuất hợp tác, không hứa chặn giao dịch** (§12).

### 6.3 Test
- Luồng tạo yêu cầu → ký → đọc trạng thái qua HTTP. Dùng máy xác thực giả sẵn có ở `test/helper/may-xac-thuc-gia`.
- Màn mô phỏng luôn có băng "MÔ PHỎNG".
- Không câu nào có chữ "an toàn" / "đã chặn".

---

## 7. Phần 6 — Tài liệu pitch + buổi thử với người cao tuổi

- **Sửa số lệch:** dùng 186 / 53 / 26 (khớp 90,2%). Bỏ 169/64/32 ở `2-QA-CHI-TIET.md:1337, 2205` và `3-GIAI-THICH-KY-THUAT-CHO-QUAN.md:294`. Sửa "0.4" thành "0.2". Bỏ số test cũ.
- **Sửa câu nói quá:**
  - câu chốt "hứa bác sẽ không chuyển tiền trong 60 giây tới" → "Bọn em không để bác một mình trong 60 giây đó";
  - "con nhận được cảnh báo" và "công tắc của con đã dùng được" → **chỉ viết khi Phần 3 đã chạy thật**.
- **Câu chuyện mới:** cầu dao ba bước + chìa khoá thứ hai + so sánh Android 16 và Money Lock của Singapore, có nguồn.
- **Kịch bản thử** với 5–10 người cao tuổi ngoài gia đình. Đo:
  - số giây từ lúc màn đỏ hiện tới lúc bấm gọi con;
  - có làm theo câu lệnh mà không cần ai giải thích không;
  - phản ứng khi báo nhầm.

  Chỉ đưa lên slide **số đã đo**.

---

## 8. Thứ tự làm (khoảng 1 tuần)

| Ngày | Việc | Phụ thuộc |
|---|---|---|
| 1 | Phần 1 (màn khẩn cấp, hỏi nhanh, giới thiệu) + test | — |
| 2 | Phần 2 (con cài giúp, ghi âm, quy tắc, gia hạn phiên) | Phần 1 |
| 3 | Phần 3 (Web Push thật, hai chiều, leo thang) | Phần 2; **bác đặt khoá VAPID trên Render** |
| 4 | Phần 4 (Java: cuộc gọi + OTP, cài app, CALL_PHONE) + dựng APK | Phần 1–3; **bác thử trên máy** |
| 5 | Phần 5 (chìa khoá thứ hai + ngân hàng mô phỏng) | Phần 3 |
| 6 | Phần 6 (tài liệu) + buổi thử với người cao tuổi | tất cả |
| 7 | Dự phòng, sửa lỗi từ buổi thử | — |

Mỗi phần xong đều chạy trọn `npm test`, `lint`, `build`, và kiểm trên trình duyệt ở khổ 375×812.

---

## 9. Rủi ro và giới hạn phải nói thật

- Web Push cần con **cho phép thông báo** và có mạng. iPhone chỉ nhận được khi đã "Thêm vào màn hình chính" (PWA).
- Hẹn giờ leo thang nằm trong bộ nhớ máy chủ. Render gói free ngủ và khởi động lại thì mất hẹn đang chờ.
- Hãng điện thoại (Xiaomi, Oppo…) có thể giết dịch vụ nền, làm tổ hợp "cuộc gọi + OTP" không chạy. Bác thử trên máy thật, và ghi đúng đời máy đã thử.
- Tổ hợp cuộc gọi + OTP có thể báo nhầm, ví dụ đang gọi cho người nhà thì mua hàng online. Câu lệnh viết theo dạng điều kiện ("Ai đang gọi *mà* xin mã này…"), không buộc tội ai.
- Chữ ký của con không chứng minh khoản chuyển an toàn: tài khoản con có thể bị chiếm, và lạm dụng tài chính người già hay đến từ người trong nhà.
- Không có ngân hàng thật nào tích hợp. Màn ngân hàng chỉ là mô phỏng.

## 10. Ngoài phạm vi

App không tự gọi hay tự nhắn thay người dùng, không chặn cuộc gọi, không chặn giao dịch thật. Không làm FCM cho app Android của con (con nhận qua trình duyệt). Không gửi nội dung tin nhắn cho con. Không có nhãn mới, không có override mới.
