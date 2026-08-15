# PROMPT BÀN GIAO — Khoan Proof + kịch bản đi tiếp

> Copy từng khối một, theo đúng thứ tự. **Đừng gộp hai prompt vào một tin nhắn.**
> Mỗi prompt kết thúc bằng một cổng dừng — để nguyên cái cổng đó.
>
> Theo `DOC-DAU-TIEN.md`: **đừng dán cả `BACKEND.md` vào tin nhắn**. Các prompt
> dưới đây chỉ đưa đường dẫn và số dòng.

## Thứ tự và quỹ giờ

| # | Prompt | Giờ | Phụ thuộc |
|---|---|---:|---|
| 0 | Chẩn đoán 20 ca gọi hụt | 0,5 | — |
| 1 | Vá lỗ `verifiedRelationship` | 0,75 | — |
| 2 | Khoan Proof A — passkey + ghép cặp | 2,5 | 1 |
| 3 | Khoan Proof B — ký yêu cầu + xác minh | 2,5 | 2 |
| 4 | Verified Request — chiều kiểm | 1,5 | 3 |
| 5 | Kịch bản đi tiếp | 2,0 | — (chạy song song được) |

**Prompt 1 phải chạy trước prompt 2.** Dựng Khoan Proof lên trên một lá cờ đang
hở là dựng nhà trên nền chưa vá.

**Prompt 5 độc lập** — nếu có hai người thì làm song song.

---

## PROMPT 0 — Chẩn đoán 20 ca gọi hụt

*Không sửa gì. Chỉ đọc và báo cáo.*

````
Đọc CLAUDE.md trước.

Bộ đánh giá ở eval/results/latest.json (commit 560d4e2) cho:
  dangerousRecall 65,3% · tutDuoiMucDo 31,0%
  CAO → CHUA_THAY: 20 mẫu
  CAO → NGHI_NGO: 54 mẫu

Việc của bạn: mở eval/results/chi-tiet.jsonl, lọc ra 20 mẫu có nhãn thật CAO
nhưng máy ra CHUA_THAY. Với mỗi mẫu, in:

  id · họ · nội dung (cắt 120 ký tự) · điểm · maLyDo máy tìm được
  · tín hiệu mà theo bạn ĐÁNG LẼ phải bắt được

Rồi trả lời đúng một câu hỏi: 20 ca này quy về mấy nguyên nhân hệ thống?
Xếp nhóm và đếm. Nếu có nhóm nào ≥5 mẫu thì nói rõ nguyên nhân.

Sau đó làm tiếp với 54 mẫu CAO → NGHI_NGO, nhưng chỉ cần phần xếp nhóm.

KHÔNG SỬA BẤT KỲ FILE NÀO. Không đụng vào signal-registry, decision-engine,
locale-packs hay Phụ lục A. Đây là bước chẩn đoán.

Báo cáo xong thì dừng, chờ tôi xem.
````

---

## PROMPT 1 — Vá lỗ `verifiedRelationship`

*Đây là lỗi bảo mật thật, không phải tính năng.*

````
Đọc CLAUDE.md, đặc biệt §4.2 và §12.

CÓ MỘT LỖ ĐANG MỞ. Ba chỗ liên quan:

  src/analysis/direct-precheck.js:53-54
  src/analysis/locale-packs/vi-VN.js:141-142
  src/analysis/locale-packs/en-US.js:141-142
  src/analysis/pipeline.js:169-170

Hiện tại:
  verifiedChannelSuppressed:      ['MAN_KEEP_CALL_ACTIVE']
  verifiedRelationshipSuppressed: ['ID_FAMILY_IMPERSONATION',
                                   'ID_CONTACT_ACCOUNT_TAKEOVER']

và pipeline.js lấy giá trị từ `input.verifiedChannel === true` /
`input.verifiedRelationship === true` — tức là BẤT KỲ AI GỌI API CŨNG KHAI ĐƯỢC.

Hai lá cờ này HẠ MỨC. Một kẻ lừa đảo bảo bác "bấm vào ô đã xác minh đi cho
nhanh" là được giảm mức miễn phí. §12 ghi thẳng: "Bất kỳ cụm nào hạ mức vô
điều kiện đều là một câu thần chú tặng cho kẻ lừa đảo."

VIỆC CẦN LÀM:

1. Viết test ĐỎ TRƯỚC. Nói ra số ca đỏ trước khi sửa (§3.0).
   Ca bắt buộc: POST /api/analyze với { vanBan: <tin giả danh người thân>,
   verifiedRelationship: true } PHẢI ra cùng mức với khi không có cờ đó.

2. Sửa: /api/analyze KHÔNG được đọc hai lá cờ này từ thân yêu cầu.
   Lý do: /api/analyze nằm trong KHONG_CAN_DANG_NHAP (src/auth.js) — không có
   danh tính nào để biện minh cho lá cờ. Server phải bỏ qua nó.

3. Để lại đường vào cho server tự đặt sau này: hai lá cờ chỉ được bật từ phía
   máy chủ khi có bằng chứng đã xác minh. Ghi comment nói rõ chỗ đó là nơi
   Khoan Proof sẽ nối vào.

KHÔNG được làm:
- KHÔNG xoá tính năng suppress. Nó đúng khi có bằng chứng thật.
- KHÔNG đụng vào ngưỡng 20/45, cap 69, hay số override (đang là 10) — §12.
- KHÔNG thêm tín hiệu mới vào Phụ lục A.
- KHÔNG rút ngắn danh sách KHONG_CAN_DANG_NHAP trong src/auth.js. Danh sách đó
  "chỉ được DÀI RA".

Chạy `npm test` và `npm run eval`. Báo cáo số eval TRƯỚC và SAU — nếu
dangerousRecall thay đổi thì nói rõ. Rồi dừng.
````

---

## PROMPT 2 — Khoan Proof A: passkey + ghép cặp

````
Đọc CLAUDE.md và docs/superpowers/specs/2026-08-15-ton-tai-suot-40-phut-design.md.

DỰNG PHẦN NỀN của Khoan Proof: đăng ký passkey và ghép cặp thiết bị.

BỐI CẢNH — Khoan Proof là gì:
Khi có tin "mẹ ơi con đổi số, chuyển cho con 20 triệu", bác bấm "Xác minh yêu
cầu này". Tài khoản người con đã ghép cặp nhận đúng nội dung yêu cầu, xác nhận
hoặc từ chối bằng passkey (Windows Hello / vân tay / Face ID). Chữ ký được ràng
buộc với đúng yêu cầu đó. Prompt này chỉ làm phần ĐĂNG KÝ và GHÉP CẶP.

RÀNG BUỘC KỸ THUẬT PHẢI BIẾT TRƯỚC:

- WebAuthn ĐÒI SECURE CONTEXT. server.js:262 hiện là `app.listen(cong)` — HTTP
  trần, cổng 8089.
    http://localhost:8089        → CHẠY ĐƯỢC (localhost là secure context)
    http://192.168.x.x:8089      → KHÔNG. credentials.create() ném lỗi.
  Demo sẽ chạy HAI TAB TRÊN MỘT MÁY qua localhost. ĐỪNG dựng HTTPS, đừng dựng
  tunnel — hết giờ và chết khi rút mạng.

- Nếu WebAuthn không dùng được trên máy đang chạy, PHẢI BÁO NGAY, đừng giả lập
  chữ ký. Chữ ký giả lập là thứ tệ nhất có thể đưa vào sản phẩm này.

HẠ TẦNG ĐÃ CÓ, DÙNG LẠI, ĐỪNG VIẾT MỚI:
- src/auth.js — taoMaGhep(): mã 6 số, crypto.randomInt, hạn 10 phút, dùng một
  lần. Đây là đường ghép cặp, §9.8: mã do CHỦ TÀI KHOẢN sinh.
- src/trusted-circle.js — vòng tròn gia đình.
- src/vault-store.js — moKho(), kiemTruongCam(), TRUONG_CAM.
- package.json đã có `pg`.

VIỆC CẦN LÀM:

1. Cài @simplewebauthn/server và @simplewebauthn/browser. Đừng tự viết CBOR/COSE
   parser — không đủ giờ và dễ sai.

2. Viết test ĐỎ TRƯỚC, nói ra số ca đỏ.

3. Bốn endpoint, tất cả ĐỀU CẦN ĐĂNG NHẬP:
     POST /api/proof/dang-ky/bat-dau     → tuỳ chọn đăng ký
     POST /api/proof/dang-ky/xac-nhan    → lưu credential
     POST /api/proof/ghep/bat-dau        → chủ tài khoản sinh mã 6 số
     POST /api/proof/ghep/xac-nhan       → người con nhập mã, gắn credential

4. Cấu hình WebAuthn:
     rpID: 'localhost'  ·  origin: 'http://localhost:8089'
     userVerification: 'required'   ← bắt buộc, để có sinh trắc học
     Lưu credentialID, publicKey, counter.

RÀNG BUỘC BẮT BUỘC:
- KHÔNG thêm '/api/proof/*' vào KHONG_CAN_DANG_NHAP trong src/auth.js.
  Nhưng cũng TUYỆT ĐỐI KHÔNG bắt đăng nhập cho /api/analyze — §5.3 và §6.9:
  "KHÔNG gate chức năng kiểm tra cơ bản". Rút mạng, chưa đăng nhập, app VẪN phải
  phân tích được bằng tầng luật.
- §12 cấm "bật đồng bộ máy chủ mặc định". Khoan Proof là TUỲ CHỌN, chỉ chạy khi
  người dùng chủ động ghép cặp. Mặc định app vẫn là localStorage.
- §9.8 — chủ tài khoản thu hồi quyền bất cứ lúc nào, KHÔNG cần người con đồng ý.
  Làm luôn endpoint thu hồi trong prompt này.
- Không ghi log khoá riêng, mã ghép, hay bất kỳ trường nào trong TRUONG_CAM.

CHƯA LÀM Ở PROMPT NÀY: ký yêu cầu, xác minh chữ ký, cụm từ hiển thị. Đó là
prompt 3.

Chạy `npm test`. Báo cáo, rồi dừng.
````

---

## PROMPT 3 — Khoan Proof B: ký yêu cầu + xác minh

*Đây là phần lõi. Đọc kỹ ba ghi chú thiết kế.*

````
Đọc CLAUDE.md. Phần nền Khoan Proof đã xong ở prompt trước.

DỰNG PHẦN LÕI: ký một yêu cầu cụ thể, xác minh chữ ký, hiện kết quả hai đầu.

LUỒNG:
  1. Bác bấm "Xác minh yêu cầu này" trên một kết quả phân tích.
  2. Server tạo bản ghi yêu cầu, ràng buộc: caseId · khoảng số tiền · hành động
     được yêu cầu · người yêu cầu · hạn 3 phút · nonce chống phát lại.
  3. Tab người con nhận, HIỆN ĐÚNG NỘI DUNG ĐÓ, ký bằng passkey (xác nhận hoặc
     từ chối — cả hai đều được ký).
  4. Server xác minh chữ ký, tiêu thụ nonce.
  5. Cả hai máy hiện CÙNG một cụm từ, ví dụ "Lá Tím 47".

BA GHI CHÚ THIẾT KẾ — ĐỌC KỸ, ĐÂY LÀ CHỖ DỄ LÀM SAI NHẤT:

① RÀNG BUỘC CHỮ KÝ VÀO ĐÚNG YÊU CẦU.
   challenge = SHA-256 trên payload chuẩn hoá (caseId, khoangTien, hanhDong,
   nguoiYeuCau, hetHan, nonce). Chữ ký WebAuthn phủ authenticatorData và
   SHA-256(clientDataJSON), mà clientDataJSON chứa challenge — nên chữ ký ràng
   được vào payload.
   ⚠️ GIỚI HẠN PHẢI GHI VÀO COMMENT: authenticator KHÔNG hiển thị nội dung giao
   dịch. Extension txAuthSimple đã bị bỏ khỏi WebAuthn. Việc hiện đúng nội dung
   là trách nhiệm của GIAO DIỆN app, không phải của thiết bị. Đừng viết comment
   hay chữ hiển thị nào ngụ ý thiết bị đã xác nhận nội dung.

② CỤM TỪ PHẢI SINH RA TỪ CHỮ KÝ ĐÃ XÁC MINH.
   HMAC(khoá máy chủ, chữ ký đã verify) → tra vào một danh sách từ TĨNH.
   ⚠️ KHÔNG sinh cụm từ từ caseId. Sinh từ caseId thì nó chỉ chứng minh hai máy
   đang xem cùng bản ghi — không chứng minh gì về chữ ký, và nó HIỆN RA ĐƯỢC
   TRƯỚC KHI xác minh xong. Như thế là sân khấu, không phải bằng chứng.
   Cụm từ là thứ ĐỂ HIỆN, không phải bí mật. Không dùng nó làm token.

③ HẾT HẠN MÀ KHÔNG AI TRẢ LỜI — ĐÂY LÀ §4.3.
   Im lặng KHÔNG phải "không sao", cũng KHÔNG phải "đã từ chối".
   Hết hạn ⇒ đẩy mã vào `chuaKiem` (ví dụ 'chua_lien_lac_duoc_nguoi_than') và
   sàn tối thiểu NGHI_NGO. Thêm ca vào unreadableInputFloor() trong
   src/analysis/pipeline.js — §4.3 ghi rõ: "Thêm nguồn đầu vào mới nào thì THÊM
   CA vào đó."
   ⚠️ ĐỪNG NHẦM với §9.4 "im lặng = gửi". Hai cơ chế ngược nhau.

KẾT QUẢ NỐI VÀO BỘ LUẬT THẾ NÀO:
- Ký XÁC NHẬN ⇒ server (không phải client) đặt verifiedRelationship = true.
  Đây chính là chỗ prompt 1 đã chừa sẵn.
- Ký TỪ CHỐI ⇒ đẩy tín hiệu LÀM TĂNG mức, không giảm.
- Hết hạn ⇒ sàn NGHI_NGO như trên.
- Mọi đường đều đi qua src/analysis/decision-engine.js. KHÔNG tạo đường quyết
  định thứ hai. KHÔNG thêm override thứ 11 (§12).

CHỮ HIỂN THỊ — §11, KHÔNG ĐƯỢC SAI MỘT CHỮ:
  ✅ "Yêu cầu đã được ký bởi tài khoản của Minh"
  ❌ "Giao dịch an toàn"       ❌ "Yêu cầu này hợp lệ"
  ❌ "Đã xác minh là người thân"
  Lý do: tài khoản hoặc thiết bị của Minh vẫn có thể bị chiếm quyền. VÀ dạng lạm
  dụng tài chính người cao tuổi phổ biến nhất là do người trong nhà gây ra — nên
  chữ ký hợp lệ KHÔNG chứng minh yêu cầu là chính đáng. App chỉ được nói ai đã
  ký, không được nói yêu cầu đó tốt hay xấu.

§HĐ:
- KHÔNG thêm trường mới vào phản hồi POST /api/analyze.
- `chuaKiem` là string[] nên thêm mã mới vào đó là hợp hình dạng — NHƯNG frontend
  phải có mục catalog cho mã đó. GHI RA thành một dòng bàn giao rõ ràng cho phía
  frontend, đừng để họ tự phát hiện.
- `canThiep` vẫn đúng NĂM giá trị. Không thêm giá trị thứ sáu.

§4.6 — màn chờ chữ ký PHẢI có lối ra "Tôi ổn, không có gì nguy hiểm".

Viết test ĐỎ TRƯỚC, nói ra số ca đỏ. Ca bắt buộc:
  - chữ ký cho caseId khác PHẢI bị từ chối
  - phát lại nonce đã dùng PHẢI bị từ chối
  - chữ ký quá hạn PHẢI bị từ chối
  - hết hạn không ai trả lời KHÔNG ĐƯỢC ra nhãn thấp
  - cụm từ KHÔNG tính ra được trước khi verify thành công

Chạy `npm test` và `npm run eval`. Báo cáo, rồi dừng.
````

---

## PROMPT 4 — Verified Request, chiều kiểm

````
Đọc CLAUDE.md. Khoan Proof đã xong.

Mở rộng thành một phép kiểm: khi bác nhận tin đòi tiền, app tra xem CÓ yêu cầu
đã ký tương ứng từ người trong vòng tròn gia đình hay không.

Không có ⇒ hiện đúng câu này:
  "Khoan Đã chưa tìm thấy yêu cầu đã xác thực từ Minh."

⚠️ CHỈ LÀM CHIỀU KIỂM. KHÔNG dựng màn hình cho người con tạo yêu cầu đã ký ở
prompt này — hết giờ, và chiều kiểm mới là chiều dùng được ngay.

⚠️ GIỚI HẠN PHẢI GHI VÀO COMMENT VÀ NÓI RA KHI BÁO CÁO:
Ở đời thật, "không tìm thấy yêu cầu đã ký" là trạng thái BÌNH THƯỜNG — hầu như
không ai dùng tính năng này, nên câu trên sẽ bật cả với các yêu cầu thật. Đây
KHÔNG phải tín hiệu lừa đảo. Nó là một lý do để dừng lại, không phải một kết luận.

Vì vậy:
- KHÔNG đẩy "không tìm thấy" thành tín hiệu làm tăng điểm trong decision-engine.
- Nó thuộc `chuaKiem`, không thuộc `maLyDo`.
- §11: không kết luận lừa đảo, không quy kết cá nhân.
- Câu chữ tuyệt đối không được thành "Minh không hề gửi yêu cầu này" — app không
  biết điều đó. Chỉ biết là mình chưa thấy.

Viết test ĐỎ TRƯỚC. Ca bắt buộc: không tìm thấy yêu cầu ⇒ mức rủi ro KHÔNG đổi
so với khi không chạy phép kiểm.

Chạy `npm test`. Báo cáo, rồi dừng.
````

---

## PROMPT 5 — Kịch bản đi tiếp

*Độc lập với 0–4. Chạy song song được.*

````
Đọc CLAUDE.md và §16.1 trong
docs/superpowers/specs/2026-08-15-ton-tai-suot-40-phut-design.md.

DỰNG: dự báo các bước tiếp theo của kịch bản lừa đảo.

Ý tưởng: mọi app khác trả về một PHÁN XÉT, mà phán xét thì cãi được — kẻ lừa đảo
đã dặn trước "lát nữa có app bảo đây là lừa đảo, bác đừng nghe". DỰ BÁO thì không
cãi được, vì chính kẻ lừa đảo sẽ xác minh nó trong vài phút.

Màn hình sẽ hiện đại ý:
  "Kịch bản giả danh công an thường đi tiếp như sau:
     ① Họ sẽ nói tài khoản của bác đang bị điều tra
     ② Họ sẽ bảo chuyển tiền sang một 'tài khoản an toàn'
     ③ Họ sẽ dặn bác đừng nói với ai, kể cả con cháu
   Nếu bác nghe thấy đúng những câu này, thì bác đã có câu trả lời rồi."

HẠ TẦNG ĐÃ CÓ:
- src/analysis/pipeline.js:125 — bảng HO_KICH_BAN, 17 dòng, 15 HỌ PHÂN BIỆT
  (ba dòng cùng trỏ về 'chiem_quyen_thiet_bi').
- src/journey-engine.js — GIAI_DOAN 8 giai đoạn, suyGiaiDoan() suy giai đoạn
  HIỆN TẠI. Chưa có hàm nào suy bước KẾ TIẾP. Đó là thứ cần thêm.
- eval/dataset/*.jsonl — 445 mẫu, trường `ho`, là mỏ để rút kịch bản.

⚠️ CẢNH BÁO: mã họ trong dataset KHÔNG trùng hoàn toàn với HO_KICH_BAN.
   Dataset có 'gia_nguoi_than', HO_KICH_BAN có 'gia_danh_nguoi_than'.
   Dataset có 'dau_tu', HO_KICH_BAN có 'du_dau_tu_loi_nhuan_cao'.
   ĐỪNG giả định hai không gian tên này giống nhau. Lập bảng đối chiếu trước, và
   in ra họ nào không khớp được.

VIỆC CẦN LÀM:

1. Viết test ĐỎ TRƯỚC, nói ra số ca đỏ.

2. Tệp mới src/kich-ban-di-tiep.js — HÀM THUẦN. Không mạng, không AI, không đọc
   đồng hồ (truyền thời điểm qua tham số).
       buocTiepTheo(hoKichBan, giaiDoanHienTai) → [{ maBuoc, tinHieuSeThay }]
   - Trả về MÃ, không trả câu tiếng Việt (§HĐ luật 2). Frontend tra catalog.
   - Chỉ trả bước CHƯA xảy ra. Dự báo một bước đã xảy ra là vô nghĩa.
   - TỐI ĐA BA bước. Người đang hoảng không nhớ nổi bốn.

3. Nội dung bảng RÚT TỪ 445 mẫu đã có, theo trường `ho`. Đây là việc ĐỌC DỮ
   LIỆU, không phải việc suy đoán. Họ nào dữ liệu không đủ thì để trống — đừng bịa.

4. Đường ra: GET /api/kich-ban/:hoKichBan?giaiDoan=...
   ⚠️ KHÔNG thêm trường vào phản hồi POST /api/analyze. Frontend đã cầm sẵn
   hoKichBan từ §HĐ, nó tự gọi tiếp. Không phải đàm phán lại hợp đồng.
   Endpoint này THUẦN ĐỌC, không nhận nội dung người dùng.

CHỮ NGHĨA — §11:
  ✅ "Kịch bản này THƯỜNG đi tiếp như sau"
  ❌ "Họ SẼ nói..."          ❌ "Chắc chắn bước tiếp theo là..."
  ❌ "Chưa thấy họ đòi OTP"  ← khẳng định một dấu hiệu VẮNG MẶT, §11 cấm thẳng.
     Đây là chỗ tính năng này dễ trượt nhất vì bản chất nó đang liệt kê các bước.
  ❌ Gọi một cá nhân là kẻ lừa đảo.

RÀNG BUỘC:
- Hạng mục này nằm SAU decision-engine và CHỈ ĐỂ HIỂN THỊ. Nó KHÔNG BAO GIỜ được
  đụng vào `nhan` hay điểm số (§4.2).
- Không thêm tín hiệu vào Phụ lục A. Không thêm override.
- Chạy được khi mất mạng và mất AI.

TEST BẮT BUỘC — quan trọng hơn cả:
  Chạy toàn bộ 445 mẫu HAI LƯỢT: một lượt không có tính năng này, một lượt có.
  KHÔNG MẪU NÀO được ra mức thấp hơn lượt trước. Đây là §4.2 phát biểu thành một
  phép đo chạy được.

Chạy `npm test` và `npm run eval`. Báo cáo, rồi dừng.
````

---

## Ba việc nhớ nói với phía frontend

Hợp đồng §HĐ không đổi hình dạng, nhưng có ba mã mới cần catalog:

1. Mã mới trong `chuaKiem` — `chua_lien_lac_duoc_nguoi_than` (prompt 3).
2. Endpoint mới `GET /api/kich-ban/:hoKichBan` + các `maBuoc` cần catalog tiếng
   Việt và tiếng Anh (prompt 5).
3. Chuỗi *"Yêu cầu đã được ký bởi tài khoản của Minh"* phải vào catalog i18n,
   **không mã cứng** — §4.1 áp cho mọi chuỗi người dùng đọc, kể cả ARIA label.
