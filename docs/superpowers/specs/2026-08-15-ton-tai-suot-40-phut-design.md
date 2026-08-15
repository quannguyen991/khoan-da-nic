## §16 — TỒN TẠI SUỐT VỤ VIỆC, KHÔNG PHẢI TỒN TẠI 2 GIÂY

> Khối này trả lời một câu hỏi khác hẳn §15. §15 hỏi *"làm sao bác chạm tới được
> Khoan Đã lúc đang bị gọi"*. §16 hỏi: **"sau khi bác đã chạm tới rồi, app còn
> giúp được gì trong 38 phút còn lại của vụ lừa?"**
>
> ⚠️ Chưa có hạng mục nào ở đây được duyệt để dựng. Đây là ĐẶC TẢ, không phải
> lệnh dựng. Đọc §16.9 và §16.10 trước khi viết dòng code đầu tiên.

---

### 16.0 Vì sao khối này tồn tại

Một vụ giả danh công an kéo dài **30–60 phút**. Trong suốt thời gian đó kẻ lừa
đảo chiếm trọn sự chú ý của bác — nói liên tục, không cho cúp máy, không cho
nghĩ.

Còn app hiện tại làm gì? Trả một cái nhãn trong 2 giây rồi **im lặng cho tới hết
vụ**. Nó tham gia đúng 2 giây trên 40 phút.

Và nó chỉ tham gia được nếu bác **đã tự nghi ngờ trước** — tức là đúng cái điều
mà kẻ lừa đảo giỏi sẽ không bao giờ để xảy ra.

```
 phút 0        phút 2      phút 15         phút 35        phút 40
 ───┬────────────┬───────────┬───────────────┬──────────────┬───►
    │            │           │               │              │
 cuộc gọi    bác hỏi     ⟵ §16.2 ⟶      ⟵ §16.4 ⟶     tiền đi
 bắt đầu      app         quay lại        tên người
              │           giữa chừng      nhận lệch
         ⟵ §16.1 ⟶
          dự báo bước
          tiếp theo
              │
         ⟵ §16.3 ⟶
          câu thoát
          giữ thể diện
```

**Chỗ trống lớn nhất trong sản phẩm hiện tại là khoảng giữa phút 2 và phút 40.**
Không tính năng nào đang đứng ở đó.

#### Ràng buộc chung cho CẢ khối §16

Mọi hạng mục dưới đây phải thoả **cả năm** điều, không có ngoại lệ:

| # | Ràng buộc | Nguồn |
|---|---|---|
| 1 | Chỉ **làm tăng** cảnh giác. Không hạng mục nào hạ mức, kể cả gián tiếp | §4.2 |
| 2 | Nằm **sau** `decision-engine.js`. Không hạng mục nào đụng vào `nhan` | §4.2 |
| 3 | Chạy được **khi mất mạng và mất AI**. Bảng tĩnh, hàm thuần | §4.3 |
| 4 | Không thêm giá trị thứ sáu cho `canThiep`. Vẫn đúng **năm** | §HĐ |
| 5 | Luôn có lối ra "Tôi ổn, không có gì nguy hiểm" | §4.6 |

---

### 16.1 · ① Kịch bản đi tiếp — chuyển từ PHÁN XÉT sang DỰ BÁO

**Ưu tiên: P0 của khối này. Đây là hạng mục mạnh nhất trong cả §16.**

#### 16.1.1 Vấn đề

Mọi sản phẩm chống lừa đảo hiện có đều trả về một **phán xét**. Phán xét thì cãi
được — và kẻ lừa đảo **đã tiêm phòng trước**:

> *"Lát nữa ngân hàng, hoặc mấy cái app, sẽ bảo đây là lừa đảo. Bác đừng nghe.
> Bọn nó cũng nằm trong đường dây."*

Bác 70 tuổi đang bị dẫn dắt sẽ tin **người đang nói chuyện với mình**, không tin
cái app vừa mới gặp. Đây không phải vấn đề độ chính xác — bộ dò có đúng 100% thì
kết quả vẫn thế.

#### 16.1.2 Giải pháp

**Dự báo thì không cãi được** — và người xác minh nó chính là kẻ lừa đảo, trong
vòng vài phút.

```
Kịch bản giả danh công an thường đi tiếp như sau:

  ① Họ sẽ nói tài khoản của bác đang bị điều tra
  ② Họ sẽ bảo chuyển tiền sang một "tài khoản an toàn"
  ③ Họ sẽ dặn bác đừng nói với ai, kể cả con cháu

Nếu bác nghe thấy đúng những câu này, thì bác đã có câu trả lời rồi.
```

Mười phút sau kẻ lừa đảo nói đúng câu số ①. **Lòng tin lật ngay lập tức**, từ hắn
sang app. Đây là thứ mà một con số phần trăm không bao giờ làm được.

#### 16.1.3 Vì sao dựng được rẻ

Hạ tầng đã có sẵn 90%:

| Có sẵn | Ở đâu |
|---|---|
| `hoKichBan` — **15 họ** kịch bản | `src/analysis/pipeline.js:125` bảng `HO_KICH_BAN` |
| 8 giai đoạn hành trình + ánh xạ tĩnh | `src/journey-engine.js` `GIAI_DOAN` |
| 445 mẫu đã gán nhãn theo họ | `eval/dataset/*.jsonl` trường `ho` |

Cái còn thiếu **đúng một thứ**: `journey-engine.js` chỉ có `suyGiaiDoan()` —
suy ra giai đoạn **hiện tại**. Chưa hề có hàm nào suy ra bước **kế tiếp**.
Đã kiểm: không có logic dự báo nào trong `src/`.

#### 16.1.4 Thiết kế

**Tệp mới:** `src/kich-ban-di-tiep.js` — hàm thuần, không mạng, không AI, không
đọc đồng hồ.

```js
// Bảng TĨNH. Khoá: hoKichBan × giaiDoan hiện tại → các bước còn lại phía trước.
buocTiepTheo(hoKichBan, giaiDoanHienTai) → [{ maBuoc, tinHieuSeThay }]
```

- Trả về **mã**, không trả câu — §HĐ luật 2. Frontend tra catalog ra chữ.
- Chỉ trả các bước **chưa xảy ra**. Bước đã xảy ra rồi thì dự báo nó là vô nghĩa.
- Tối đa **ba bước**. Bốn bước trở lên thì bác không nhớ nổi, và xác suất trúng
  của bước thứ tư quá thấp để đáng in ra.

**Nội dung bảng lấy từ đâu:** rút từ 445 mẫu đã có, theo trường `ho`. Ví dụ
`gia_danh_cong_an` có 60 mẫu ở `02-vi-scam-a.jsonl` — đọc và xếp theo giai đoạn.
Đây là **việc đọc dữ liệu, không phải việc suy đoán**.

**Bảng mẫu cho `gia_danh_cong_an`** (ba họ còn lại làm tương tự):

| Giai đoạn hiện tại | Bước dự báo | Tín hiệu sẽ thấy |
|---|---|---|
| `tao_long_tin` | `noi_dang_bi_dieu_tra` | `MAN_FEAR_THREAT` |
| `tao_long_tin` | `doi_chuyen_tai_khoan_an_toan` | `FIN_SAFE_ACCOUNT` |
| `gay_ap_luc` | `doi_giu_bi_mat` | `MAN_SECRECY` |
| `gay_ap_luc` | `dan_noi_doi_ngan_hang` | `MAN_SECRECY` |
| `co_lap` | `doi_chuyen_tien_hoac_ma` | `FIN_TRANSFER_REQUEST` |
| `da_thuc_hien` | `quay_lai_gia_danh_ho_tro_lay_lai_tien` | `FIN_RECOVERY_FEE` |

Dòng cuối đáng chú ý: **người vừa bị lừa là người dễ bị lừa lần hai nhất**. Danh
sách nạn nhân được bán lại, và lần sau thường giả danh dịch vụ lấy lại tiền. Giai
đoạn `moc_them` trong `journey-engine.js` đã có sẵn khái niệm này.

#### 16.1.5 Đường ra — KHÔNG sửa §HĐ

Đây là điểm thiết kế quan trọng nhất của hạng mục.

> **Không thêm trường vào `POST /api/analyze`.** Làm **endpoint đọc riêng**:
> `GET /api/kich-ban/:hoKichBan?giaiDoan=...`
>
> Frontend đã cầm sẵn `hoKichBan` từ §HĐ. Nó tự gọi tiếp khi cần hiện thẻ này.
> Backend và frontend **không phải đàm phán lại hợp đồng** — đúng tinh thần §HĐ.

Endpoint này **thuần đọc**, không nhận nội dung người dùng, nên không phát sinh
bề mặt tấn công mới và không cần che dữ liệu.

#### 16.1.6 Chữ nghĩa — chỗ dễ vi phạm §11 nhất

| ❌ Không được viết | ✅ Viết thế này |
|---|---|
| "Họ **sẽ** nói…" | "Kịch bản này **thường** đi tiếp như sau" |
| "Chắc chắn bước tiếp theo là…" | "Nếu bác nghe thấy đúng những câu này…" |
| "Người này là kẻ lừa đảo" | "Yêu cầu này có dấu hiệu thường gặp trong các vụ lừa đảo" |

Và **tuyệt đối không** viết câu khẳng định một dấu hiệu là VẮNG MẶT — §11 đã ghi
rõ, và đây chính là chỗ dễ trượt: *"chưa thấy họ đòi OTP"* là câu cấm.

**Ước lượng: ~2 giờ backend** (bảng + hàm thuần + test) + 1 thẻ ở frontend.

---

### 16.2 · ④ Quay lại sau 15 phút — không phải 24 giờ

**Ưu tiên: P0 của khối này.**

#### 16.2.1 Vấn đề

§8.3 có *"Hỏi lại sau 24 giờ"* ở mức P1. **24 giờ là sai đơn vị.** Vụ lừa xong
trong 40 phút; hỏi lại sau một ngày là hỏi lại sau đám tang.

#### 16.2.2 Giải pháp

Bác hỏi ở phút thứ 5, ra `NGHI_NGO`, rồi quay về với cuộc gọi. **Phút thứ 15 app
quay lại:**

```
Cách đây 15 phút bác có hỏi cháu về một cuộc gọi.

Cuộc gọi đó còn đang diễn ra không?

        [  CÒN  ]        [  XONG RỒI  ]
```

Bấm **CÒN** ⇒ đẩy tín hiệu `MAN_KEEP_CALL_ACTIVE` vào **đúng
`decision-engine.js` đang có** — không phải một đường quyết định thứ hai.

**Vì sao "còn gọi sau 15 phút" tự nó là dấu hiệu:** công an thật không giữ máy
người dân 15 phút. Ngân hàng thật không giữ máy 15 phút. Cuộc gọi dài là **đặc
trưng cấu trúc của việc dẫn dắt**, vì kẻ lừa đảo phải giữ nạn nhân trong trạng
thái không được nghĩ và không được hỏi ai.

Tín hiệu này **đã tồn tại** trong `src/bo-hoi-nhanh.js` (`ho_bao_dung_cup_may` →
`MAN_KEEP_CALL_ACTIVE`), nên không phải thêm tín hiệu mới vào Phụ lục A.

#### 16.2.3 Thiết kế

- Hạ tầng đẩy thông báo **đã dựng xong** ở `src/push.js` (`guiCanhBao`,
  `chuanHoaDangKy`, `layCauHinhVapid`, `TRANG_THAI_GUI`). Hạng mục này chỉ thêm
  **một cái hẹn giờ và một câu hỏi**.
- Hẹn giờ đặt khi kết quả trả về ở mức `NGHI_NGO` hoặc `CAO`. **Không hẹn ở mức
  thấp** — hỏi lại người không có chuyện gì là cách nhanh nhất để họ tắt thông báo,
  và tắt rồi thì mất luôn mọi thứ khác (bài học đã ghi ở §15.2).
- Bấm **XONG RỒI** ⇒ không sinh tín hiệu, không hẹn tiếp. §4.6 — luôn có lối ra.
- Hẹn **đúng một lần**. Không có lần thứ hai, thứ ba.

#### 16.2.4 Điều KHÔNG được làm

> ⚠️ Không được ghi *"đã đọc và hiểu"* cho thông báo — §11 cấm thẳng.
> Không nhận được phản hồi thì trạng thái là **không biết**, không phải "bác ổn".

**Ước lượng: ~1,5 giờ.** Rẻ nhất trong cả khối vì hạ tầng có sẵn.

---

### 16.3 · ⑤ Câu thoát giữ thể diện — lời từ chối chính là bằng chứng

**Ưu tiên: P0 của khối này.**

#### 16.3.1 Vấn đề — và đây là chỗ hầu hết sản phẩm hiểu sai

Lý do thật khiến bác không cúp máy **không phải sợ, mà là phép lịch sự**.

Người Việt trên 60 tuổi sẽ không cúp máy giữa chừng với người tự xưng công an.
Bảo *"bác cúp máy đi"* là bảo họ làm một việc mà cả đời họ được dạy là hỗn — nên
họ **sẽ không làm**, và app mất luôn cơ hội.

#### 16.3.2 Giải pháp

Đừng bảo cúp máy. Đưa cho bác **một câu thoát mà người tử tế nào cũng chấp nhận**:

```
Bác nói đúng câu này:

  "Tôi đang có khách. Mười phút nữa tôi gọi lại số này."

Rồi bác cúp máy.
```

Công an thật, ngân hàng thật, con cháu thật — **đồng ý hết**. Kẻ lừa đảo **không
thể đồng ý**, vì mười phút là đủ để bác gọi cho con. Nên hắn sẽ từ chối, hoặc sẽ
nói *"không được, việc này gấp lắm"*.

Và màn hình **đã báo trước điều đó**:

```
Nếu họ không cho bác gọi lại sau mười phút,
thì bác đã có câu trả lời rồi.
```

Đây là **một phép thử hành vi cải trang thành phép lịch sự**. Bác không phải đối
đầu với ai, không phải tỏ ra nghi ngờ ai, không mất mặt — mà vẫn thu được đúng
thông tin cần thu.

#### 16.3.3 Khác gì `bo-hoi-nhanh.js`

| | `bo-hoi-nhanh.js` (§15.3.3) | §16.3 này |
|---|---|---|
| Hướng | Kênh **hỏi vào** — app hỏi bác | Kịch bản **nói ra** — bác nói với kẻ gọi |
| Sinh ra | `maLyDo` từ câu trả lời | Không sinh tín hiệu ở bước đưa câu |
| Kết quả | Ra mức rủi ro | Ra một phép thử ngoài đời |

Hai thứ bổ sung nhau. Câu thoát nên hiện **sau** bộ hỏi nhanh, ở màn kết quả.

#### 16.3.4 Thiết kế

- Bảng tĩnh theo `hoKichBan`. Mỗi họ **một câu thoát**, không phải ba — người
  đang hoảng không chọn được giữa ba câu.
- Trả về **mã**, frontend tra catalog. §HĐ luật 2.
- Bước hai (tuỳ chọn, nếu còn giờ): sau 10 phút hỏi *"Họ có cho bác gọi lại
  không?"* — trả lời **KHÔNG** ⇒ tín hiệu `MAN_URGENCY` + `MAN_KEEP_CALL_ACTIVE`.
  Gộp chung hạ tầng hẹn giờ với §16.2.
- Không mạng, không AI, không cơ sở dữ liệu.

#### 16.3.5 ⚠️ Không phải họ nào cũng có câu thoát

Câu thoát giả định **đang có một cuộc gọi để thoát ra**. Điều đó không đúng với
mọi họ trong 15 họ:

| Họ | Có câu thoát? |
|---|---|
| `gia_danh_cong_an` · `gia_danh_ngan_hang` · `gia_danh_ho_tro_ky_thuat` | ✅ — đúng bài toán |
| `gia_danh_giao_hang` · `gia_danh_tuyen_dung` | ⚠️ thường qua tin nhắn, không có cuộc gọi |
| `lua_tinh_cam` | ❌ — quan hệ kéo dài nhiều tuần. "Mười phút nữa tôi gọi lại" vô nghĩa |

**Họ nào không có câu thoát thì để trống, không bịa.** Bịa một câu thoát không
dùng được là dạy bác một phản xạ sai — tệ hơn không có gì. Bảng phải cho phép
`null`, và test phải chấp nhận `null` chứ không đòi đủ 15.

**Ước lượng: ~1 giờ.**

---

### 16.4 · ⑥ Tên người nhận không khớp danh tính tự xưng

**Ưu tiên: P1 — mạnh, nhưng đắt hơn và đụng vào Phụ lục A.**

#### 16.4.1 Vấn đề

Đây là hạng mục duy nhất chạm được vào **mười giây cuối trước khi tiền đi**.

#### 16.4.2 Giải pháp

Không cần blacklist, không cần API ngân hàng, không cần biết số tài khoản đó là
ai. Chỉ cần một mâu thuẫn **cấu trúc**:

```
Họ tự xưng là:      Kho bạc Nhà nước
Tên người nhận:     NGUYEN VAN A          ← một cá nhân

Cơ quan nhà nước không nhận tiền vào tài khoản mang tên một người.
```

**Vì sao mạnh:** nó **không né được bằng cách đổi câu chữ**. Kẻ lừa đảo viết lại
tin nhắn kiểu gì cũng được, nhưng tiền vẫn phải chảy vào một tài khoản mang tên
người thật. Đây là ràng buộc **vật lý của chính vụ lừa**, không phải đặc trưng
ngôn ngữ.

#### 16.4.3 Thiết kế

Đối chiếu hai thứ đã có:

- **Danh tính tự xưng** — đã nằm trong `maLyDo`: `ID_AUTHORITY_IMPERSONATION`,
  `ID_BANK_IMPERSONATION`, `ID_TAX_BENEFIT_IMPERSONATION`,
  `ID_UTILITY_IMPERSONATION`.
- **Tên người thụ hưởng** — đọc từ ảnh màn hình chuyển tiền. Đường ảnh + OCR đã
  có (`src/media-validation.js`, đường `anh` trong §HĐ).

Lệch loại (tổ chức tự xưng × cá nhân nhận) ⇒ tín hiệu mới trọng số cao.

#### 16.4.4 ⚠️ Ba việc phải hỏi trước khi dựng

1. **Thêm tín hiệu mới vào Phụ lục A là mở rộng bộ canonical.** §12 cấm đổi ngưỡng
   20/45, cap 69 và số override (10). Thêm `SIGNAL_ID` thứ 59 không nằm trong danh
   sách cấm, nhưng nó **đổi Phụ lục A** — cần duyệt rõ ràng, không tự làm.
2. **`maLyDo` có mã mới ⇒ frontend phải có mục catalog tương ứng.** Đây là điểm
   phối hợp hai bên duy nhất trong cả §16 — phải báo phía Gemini.
3. **Phải thêm ca vào sàn "chưa kiểm được"** — §4.3 ghi rõ: *"Thêm nguồn đầu vào
   mới nào thì THÊM CA vào đó."* Ảnh chuyển tiền không đọc được tên ⇒ **không được
   ra nhãn thấp**, và **không được** nói "tên người nhận khớp". Không đọc được thì
   nói là không đọc được.

#### 16.4.5 Chữ nghĩa

Câu *"Cơ quan nhà nước không nhận tiền vào tài khoản mang tên một người"* là phát
biểu về **thể chế**, không phải cáo buộc một cá nhân — nên hợp §11. Tuyệt đối
không viết *"NGUYEN VAN A là kẻ lừa đảo"*.

**Ước lượng: ~2,5 giờ**, chưa kể thời gian duyệt Phụ lục A.

---

### 16.5 · ⑦ Đọc to — app trở thành người thứ ba trong phòng

**Ưu tiên: P1. Rẻ bất thường so với giá trị.**

Hai lý do, **lý do thứ hai mới là lý do thật**.

**Thứ nhất — tiếp cận.** Bác 70 tuổi đang hoảng **không đọc nổi màn hình**. Chữ
to 17px cũng không cứu được: người hoảng mất khả năng đọc hiểu, không mất khả
năng nghe.

**Thứ hai — cơ chế phá vỡ.** Nếu bác đang bật loa ngoài, **kẻ lừa đảo cũng nghe
thấy**. Thứ phá vỡ một vụ lừa trong đời thật là *có người bước vào phòng*. Không
dựng được người thật, nhưng dựng được **một giọng nói thứ ba trong phòng** — bình
tĩnh, không hoảng, đọc đúng những gì đang xảy ra.

**Thiết kế:**

- `speechSynthesis` có sẵn trong trình duyệt, không cần thư viện, không cần mạng.
- ⚠️ **Bắt buộc do người dùng bấm nút.** Tự phát giữa cuộc gọi là làm bác giật
  mình — phản tác dụng, và vi phạm tinh thần §4.6.
- ⚠️ **Chữ đọc lên phải đến từ catalog i18n**, không mã cứng — §4.1 ghi rõ *"mọi
  chuỗi khác người dùng đọc… phải đến từ catalog i18n"*, và chuỗi đọc to là chuỗi
  người dùng nhận.
- Không đọc nội dung thô bác đã dán vào — có thể là chuyện rất riêng tư (§14.1,
  câu hỏi 8 của bản tóm tắt). Chỉ đọc **kết luận và việc cần làm**.

**Ước lượng: ~45 phút.**

---

### 16.6 · ⑧ Tấm thẻ đưa cho nhân viên ngân hàng

**Ưu tiên: P1.**

Nhân viên quầy là **hàng rào cuối cùng**, và kẻ lừa đảo **biết** nên luôn dặn bác
nói dối. `bo-hoi-nhanh.js` đã hỏi đúng câu đó và **đặt ở vị trí thứ hai** — thiết
kế này đã đúng, ghi chú §15.13 giải thích rõ vì sao.

Đi thêm một bước: sinh ra một màn hình để bác **chìa điện thoại cho nhân viên**,
thay vì phải tự diễn đạt.

```
Chào anh/chị.

Tôi đang được hướng dẫn từ xa qua điện thoại
để làm giao dịch này.

Nhờ anh/chị hỏi kỹ giúp tôi.
```

**Giá trị thật:** nó hoạt động **ngay cả khi bác đã bị thuyết phục hoàn toàn**.
Bác không cần tin app, không cần thừa nhận mình đang bị lừa — chỉ cần chìa cái
màn hình ra. Đây là hạng mục duy nhất trong §16 không đòi hỏi bác phải đồng ý với
app.

Chữ cỡ lớn, tương phản cao, không có nút nào khác trên màn hình đó.

**Ước lượng: ~1 giờ.**

---

### 16.7 · ② Hợp đồng với chính mình — để bác lúc tỉnh cãi với bác lúc hoảng

**Ưu tiên: P1, nặng frontend — cần phối hợp phía Gemini.**

`FAMILY_RULE` đã có làm nguyên liệu (§9.3, `src/trusted-circle.js`). Cái đột phá
là **thời điểm dùng** và **ai là người nói**.

Ở màn `PROTECTED_CRITICAL`, app **không tranh luận với người dùng**. Nó chỉ đưa
ra lời của chính họ:

```
Ngày 3/8, chính bác đã dặn:
"Trên 10 triệu thì gọi cho con gái trước."
```

**Vì sao mạnh:** vũ khí số một của kẻ lừa đảo là giai đoạn `co_lap` — chúng dựng
sẵn khung *"đừng nói với con cháu"*. Khi đó **mọi tiếng nói bên ngoài đều đã bị
vô hiệu hoá từ trước**. Tiếng nói duy nhất chưa bị nhiễm độc là tiếng nói của
chính bác, từ tuần trước.

Ràng buộc chống lạm dụng ở §9.8 vẫn nguyên giá trị: **quy tắc do chủ tài khoản
đặt**, người con **không đặt thay được**.

---

### 16.8 · ③ Gói bằng chứng đóng dấu thời gian

**Ưu tiên: P1, để cuối.**

Sau khi mất tiền, vấn đề thật không phải *"làm gì"* mà là **không ai soạn nổi tờ
trình cho ngân hàng lúc đang run**. `src/recovery-adapters.js` đã có các bước xử
lý, nhưng chưa có gói bằng chứng: mốc thời gian, thực thể đã trích, dòng thời
gian vụ việc — xuất ra dạng in được.

Giá trị thật cao. **Sức nặng demo thấp hơn hẳn §16.1**, nên xếp cuối.

⚠️ §11 — **không hứa lấy lại được tiền**. Chữ phải là *"các bước làm tăng khả năng
xử lý"*.

---

### 16.9 · NHỮNG CÂU KHÔNG ĐƯỢC VIẾT TRONG KHỐI NÀY

Bổ sung cho §11, riêng cho §16:

- ❌ **"Họ sẽ nói…"** → *"Kịch bản này thường đi tiếp như sau"*
- ❌ **"Bước tiếp theo chắc chắn là…"** → *"Nếu bác nghe thấy đúng những câu này"*
- ❌ **"Chưa thấy họ đòi OTP"** — khẳng định một dấu hiệu VẮNG MẶT. §11 cấm thẳng,
  và đây là chỗ §16.1 dễ trượt nhất vì bản chất nó đang liệt kê các bước.
- ❌ **"App đã cảnh báo bác rồi"** — trách móc người dùng. §11 cấm.
- ❌ **"Bác đã thoát rồi"** sau khi bấm XONG RỒI ở §16.2 — app không biết điều đó.
- ❌ **"Tên người nhận khớp"** khi OCR không đọc được — §4.3.
- ❌ Gọi tên một cá nhân là kẻ lừa đảo ở §16.4.

---

### 16.10 · CÁI GÌ KHÔNG LÀM, VÀ VÌ SAO

| Không làm | Vì sao |
|---|---|
| Cho AI sinh ra kịch bản dự báo | §4.2 · §12. Bảng tĩnh, người viết, có test. AI sinh dự báo là mở đúng cái cửa mà cả kiến trúc đang đóng |
| Thêm `canThiep` thứ sáu cho §16.2 | §HĐ. Vẫn đúng năm giá trị. §15.8 đã ghi bài học này |
| Thêm override thứ 11 | §12. Bộ luật hiện có đã bắt trọn — §15.3.3 đã kiểm |
| Tự động phát tiếng ở §16.5 | Làm bác giật mình giữa cuộc gọi. Phản tác dụng |
| Hỏi lại quá một lần ở §16.2 | Người bị hỏi nhiều lần sẽ tắt thông báo — mất luôn mọi thứ khác |
| Dựng lại thông báo khi bị vuốt đi | §15.2 đã ghi: người dùng sẽ vào tắt sạch |
| Đọc to nội dung thô bác đã dán | Có thể rất riêng tư. Chỉ đọc kết luận |
| Hứa chặn giao dịch ở §16.4 | §12. App **thấy** được mâu thuẫn, **không chặn** được gì |

---

### 16.11 · THỨ TỰ DỰNG VÀ ƯỚC LƯỢNG

#### Trước tiên — con voi trong phòng

`eval/results/latest.json` ở commit `560d4e2`:

| Chỉ số | Giá trị | Nghĩa là |
|---|---:|---|
| `dangerousRecall` | **65,3%** | Cứ 3 tin nguy hiểm thì gọi hụt khoảng 1 |
| `tutDuoiMucDo` | **31,0%** | Gần một phần ba mẫu rơi xuống dưới mức đúng |
| `CAO → CHUA_THAY` | **20 mẫu** | Rơi trúng đúng lỗi mà cả bài thuyết trình chống lại |
| `CAO → NGHI_NGO` | **54 mẫu** | |
| `highRiskFP` | 10,8% | |

**Đề xuất: 30 phút đọc 20 ca `CAO → CHUA_THAY` trong `eval/results/chi-tiet.jsonl`
TRƯỚC khi dựng bất cứ hạng mục nào ở §16.** Loại lỗi này thường quy về một hai
nguyên nhân hệ thống; vá được thì lời hơn bất cứ tính năng mới nào.

Đây là **chẩn đoán, không phải sửa** — đọc xong báo cáo lại, chưa đụng vào bộ luật.

#### Thứ tự đề xuất

| # | Hạng mục | Giờ | Đụng §HĐ? | Đụng Phụ lục A? |
|---|---|---:|---|---|
| 0 | Chẩn đoán 20 ca gọi hụt | 0,5 | không | không |
| 1 | §16.1 Kịch bản đi tiếp | 2,0 | **không** — endpoint đọc riêng | không |
| 2 | §16.2 Quay lại sau 15 phút | 1,5 | không | không — tín hiệu đã có |
| 3 | §16.3 Câu thoát giữ thể diện | 1,0 | không | không |
| | **Cộng bộ lõi** | **5,0** | | |
| 4 | §16.5 Đọc to | 0,75 | không | không |
| 5 | §16.6 Thẻ cho nhân viên ngân hàng | 1,0 | không | không |
| 6 | §16.4 Tên người nhận lệch | 2,5 | mã `maLyDo` mới | **có — cần duyệt** |
| 7 | §16.7 Hợp đồng với chính mình | — | không | không |
| 8 | §16.8 Gói bằng chứng | — | không | không |

**Ba hạng mục 1–3 kể chung MỘT câu chuyện** — đó mới là thứ ban giám khảo nhớ:

> *"App của chúng em không trả lời rồi biến mất. Nó dự báo bước tiếp theo, quay
> lại giữa chừng khi vụ việc còn đang diễn ra, và đưa cho bác một câu để thoát ra
> mà không mất mặt. Cả ba chạy offline, bằng bảng tĩnh, không có AI nào được phép
> can thiệp vào mức rủi ro."*

Ba tính năng rời thì đại trà. Ba tính năng cùng trả lời *"app sống được bao lâu
trong một vụ lừa"* thì không.

⚠️ **Luật vận hành số 1 vẫn nguyên hiệu lực:** sau giờ đóng băng không thêm gì.
§16.4 là hạng mục dễ ăn quá giờ nhất — nếu đã qua nửa quỹ giờ mà chưa xong 1–3
thì **bỏ §16.4**, không thương lượng.

---

### 16.12 · HÀNG RÀO KIỂM THỬ

Mỗi hạng mục dựng thì hàng rào tương ứng phải xanh. Đặt cùng quy ước tên với
`test/` hiện có.

| Tệp test | Chặn điều gì |
|---|---|
| `test/kich-ban-di-tiep.test.js` | Bảng đủ 15 họ · tối đa 3 bước · không trả bước đã xảy ra · **không hạng mục nào đổi `nhan`** |
| `test/hoi-lai-15-phut.test.js` | Chỉ hẹn ở `NGHI_NGO`/`CAO` · hẹn đúng một lần · bấm CÒN đẩy tín hiệu qua `decision-engine` · bấm XONG RỒI không sinh tín hiệu |
| `test/cau-thoat.test.js` | Mỗi `hoKichBan` **tối đa** một câu · `null` là hợp lệ (§16.3.5) · trả về mã chứ không trả câu |
| `test/ten-nguoi-nhan-lech.test.js` | OCR hỏng ⇒ **không** ra nhãn thấp và **không** nói "khớp" (§4.3) |
| Mở rộng `test/unchecked-not-safe.test.js` | Thêm ca cho nguồn đầu vào ảnh chuyển tiền |
| Mở rộng `test/hop-dong-ma.test.js` | Mã `maLyDo` mới của §16.4 có mục catalog |

**Một hàng rào chung, quan trọng hơn cả sáu cái trên:**

> `test/§16-khong-ha-muc.test.js` — chạy toàn bộ 445 mẫu **hai lượt**: một lượt
> không có §16, một lượt có đủ §16. **Không mẫu nào được ra mức thấp hơn lượt
> trước.** Đây là §4.2 phát biểu thành một phép đo chạy được.

---

### 16.13 · TÌNH TRẠNG

**Chưa hạng mục nào được duyệt để dựng.** Tài liệu này là đặc tả để đọc và chốt,
không phải lệnh dựng. Cần chốt ba việc trước khi viết code:

1. Danh sách hạng mục nào làm, hạng mục nào bỏ.
2. §16.4 có được phép thêm `SIGNAL_ID` thứ 59 vào Phụ lục A không (§12).
3. Có chạy bước 0 — chẩn đoán 20 ca gọi hụt — trước hay không.
