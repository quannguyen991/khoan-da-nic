# HAI CÂU GIÁM KHẢO HỎI — ĐỊNH VỊ "SAVING" VÀ DÒNG TIỀN

Ngày 19/9/2026 · dùng cho NextGen Innovator 2026 (*"Saving for the Future"*)

> Số nào có nguồn thì ghi nguồn; số nào là **giả định** thì ghi thẳng là giả định. Đừng bỏ
> nhãn đó khi đưa lên slide — giám khảo trừ điểm vì số bịa nặng hơn vì thiếu số.

---

## CÂU 1 — ĐỊNH VỊ LẠI KHÁI NIỆM "SAVING"

### Câu chốt

> **Tiết kiệm có hai nửa: phần tích lũy được, và phần giữ lại được. Việt Nam đã dựng xong
> nửa thứ nhất. Nửa thứ hai đang bỏ trống đúng ở nhóm có nhiều thứ để mất nhất.**

Tiếng Anh, dùng ngay ở slide đầu:

```
Saving has two halves: what you put in, and what you get to keep.
Vietnam built the first half — 232 million payment accounts, 89% of adults banked.
The second half has no product for the people with the most to lose.
No savings account pays 100% in sixty seconds. Not losing does.
```

Câu cuối là câu đáng nhớ nhất: **lãi suất tiết kiệm ~5%/năm, còn một cuộc gọi lừa đảo lấy
đi 100% trong vài phút.** Không sản phẩm tài chính nào sinh lời bằng việc không mất.

### Ba thứ được tiết kiệm — theo thứ tự đo được

| Tiết kiệm cái gì | Con số | Nguồn |
|---|---|---|
| **Tiền đã tích luỹ** — thứ mất là tiền để dành cả đời, không phải thu nhập tháng này | hơn **6.000 tỷ đồng** mất vì lừa đảo trực tuyến trong 11 tháng đầu 2025, **chỉ tính vụ đã trình báo**; chỉ ~32% nạn nhân đi trình báo | Bộ Công an; NCA khảo sát 60.300 người, 12/2025 |
| **60 giây** — đơn vị thật của sản phẩm không phải tiền, mà là thời gian | kẻ gian cần khoảng một phút ép liên tục trước khi nạn nhân bấm chuyển | mô tả kịch bản bốn bước, xem mục 2 tài liệu tóm tắt |
| **Điện toán** — cách dựng sản phẩm cũng là một dạng tiết kiệm | token mỗi lượt gọi **1.796 → 427 (−76%)**, thời gian **23,5s → 6,7s**, mà độ nhạy **tăng** 62,5% → 71,9%; tầng luật trả lời <50ms và **không gọi AI lượt nào** khi tín hiệu đã rõ; **không huấn luyện mô hình mới** | đo trong repo, mục "Tiêu thụ năng lượng" của README |

### Vì sao đây không phải gắn chủ đề cho có

Ba lập luận, dùng cái nào cũng được, đừng dùng cả ba trong một câu trả lời:

1. **Nửa giữ lại được là hạ tầng còn thiếu.** Quyết định 2345 của Ngân hàng Nhà nước bắt
   xác thực khuôn mặt cho giao dịch lớn — tức là ngành ngân hàng đã trả lời câu *"có đúng
   chủ tài khoản không"*. **Chưa ai trả lời câu "chủ tài khoản có đang bị ép không".**
   Khoan Đã làm đúng lớp đó. (Sau 2345, NHNN công bố số vụ gian lận giảm ~50%, tài khoản
   liên quan giảm ~72% — tín hiệu cho thấy can thiệp đúng lớp thì có tác dụng.)
2. **Tiết kiệm bị phá không chỉ mất tiền, mà mất cả người gửi tiền.** Người cao tuổi bị
   lừa một lần thường rút khỏi ngân hàng số, quay về tiền mặt. Mỗi vụ lừa đẩy lùi chính
   quá trình không tiền mặt mà cả nước đang xây.
3. **Rẻ nhất là thứ không phải làm lại.** Một vụ lừa đốt tài nguyên hai lần: lần một là
   tiền, lần hai là bộ máy xử lý hậu quả — tổng đài khiếu nại, hồ sơ công an, thẻ phát
   lại, những chuyến đi lại. Ngăn được là cắt cả hai. Đó là chỗ *"xanh"* thật của dự án.

⚠️ **Đừng tự nhận đây là dự án môi trường.** Nói thẳng: *"Phần xanh của bọn em là kỷ luật
tính toán — đo được, và đi ngược xu hướng cứ thêm mô hình, thêm token. Bọn em tăng độ
chính xác bằng cách BỚT quyền cho mô hình, không phải bằng cách thêm GPU."*

### Cho giám khảo THẤY ngay từ lần đầu (câu hỏi ở ảnh 1)

- **Slide 1, một dòng, không biểu đồ:** *"Mỗi năm, hơn 6.000 tỷ đồng tiền để dành rời khỏi
  các gia đình Việt Nam trong vài phút. Bọn em bán lại một phút đó."*
- **Demo 10 giây đầu:** đừng mở app. Mở **màn hình điện thoại**, để tin nhắn giả danh công
  an hiện ra, rồi để máy tự hỏi *"Bác có muốn kiểm tin nhắn này không?"*. Giám khảo thấy
  ngay thứ được tiết kiệm là **thao tác và thời gian**, trước khi thấy tính năng nào.
- **Trong app (đề xuất, CHƯA DỰNG — đừng nói là đã có):** hồ sơ vụ việc đã trích được số
  tiền kẻ gian yêu cầu. Thêm một dòng ở màn Gia đình: *"Trong 30 ngày qua, các tin bị chặn
  ở mức Nguy hiểm cao đòi tổng cộng N đồng."* Câu chữ phải là **"số tiền kẻ gian đòi"**,
  tuyệt đối không viết "bác đã tiết kiệm được N đồng" — app không biết bác có chuyển hay
  không (§11).

### Câu trả lời 30 giây khi bị hỏi thẳng

> *"Chủ đề là tiết kiệm cho tương lai. Với một người 70 tuổi, rủi ro lớn nhất với khoản
> tiết kiệm của họ không phải lạm phát hay lãi suất — mà là một cuộc gọi kéo dài ba mươi
> phút. Lãi suất trả 5% một năm; không mất trả 100% trong sáu mươi giây. Bọn em làm nửa
> còn lại của chữ tiết kiệm: phần giữ lại được."*

### Giới hạn phải tự nói

- Bọn em **không đo được số tiền đã cứu**. App không biết bác có chuyển hay không; nói
  "đã cứu X tỷ" là bịa. Thứ đo được là: có cảnh báo hay không (90,2% trên tin nguy hiểm),
  và im lặng bao nhiêu (9,8%) — đo ngày 16/9/2026 trên 571 mẫu tự soạn.
- Chưa có mẫu tin nhắn thật từ nạn nhân (0 trên mục tiêu 25).

---

## CÂU 2 — DÒNG LỢI NHUẬN ĐƯỢC TẠO RA NHƯ THẾ NÀO

### Nguyên tắc chặn trên, nói trước mọi thứ khác

> **Mọi tính năng cứu người miễn phí vĩnh viễn.** Kiểm tra, cảnh báo, dừng 60 giây, gọi
> người thân, các bước sau khi mất tiền. **Không tính năng nào quyết định việc bác có được
> cảnh báo hay không bị đặt sau trả phí.** Người đang gặp nguy không bao giờ là người trả tiền.

Câu này phải nói TRƯỚC khi nói giá, nếu không phần còn lại nghe như bán bảo hiểm sợ hãi.

### Bốn nguồn thu, xếp theo mức chắc chắn

| # | Ai trả | Trả cho cái gì | Tính giá theo | Trạng thái |
|---|---|---|---|---|
| 1 | **Ngân hàng / ví điện tử** | Lớp cảnh báo đặt ngay trước nút xác nhận chuyển tiền, cho nhóm khách hàng cao tuổi | mỗi tài khoản được bảo vệ / tháng | **Nguồn chính.** Chưa có hợp đồng, chưa có pilot |
| 2 | **Gia đình (con cái 30–50)** | Gói tiện lợi cho NGƯỜI VẬN HÀNH: nhiều bố mẹ trong một bảng, báo cáo tuần, ghép cặp máy để nhận cảnh báo, xuất hồ sơ vụ việc | mỗi gia đình / tháng | Giá là **giả định cần kiểm chứng** |
| 3 | **Bảo hiểm, nhà mạng** | Tín hiệu giảm rủi ro cho gói bảo hiểm gian lận; nhà mạng đang chịu sức ép về cuộc gọi lừa đảo | thoả thuận | **Giả thuyết**, chưa nói chuyện với ai |
| 4 | **Tài trợ công / CSR / giải thưởng** | Nuôi bản miễn phí, để bản miễn phí không phụ thuộc vào bản trả phí | theo chương trình | Đang có: Grand Prix AI-JAM US 2026 |

### Vì sao NGÂN HÀNG trả — ba khoản chi họ đang gánh

Bán cho ngân hàng không phải bán công nghệ, mà bán **ba khoản chi giảm đi**:

1. **Chi phí tổng đài khiếu nại** — dễ đo nhất: số phút mỗi cuộc gọi khiếu nại × số cuộc,
   trước và sau khi bật lớp cảnh báo.
2. **Bồi thường và mất uy tín** khi một vụ lên báo.
3. **Sức ép quy định** — sau QĐ 2345, ngân hàng nào cũng phải chứng minh đã làm gì cho
   nhóm khách hàng dễ tổn thương nhất.

⚠️ Ngân hàng **không mua một lời hứa**. Nên câu trả lời mạnh nhất không phải là giá, mà là
**cách đo**:

> **Pilot 8 tuần, một ngân hàng, một nhóm khách hàng ≥60 tuổi.** Chia A/B. Chỉ số chính:
> **số phút tổng đài khiếu nại lừa đảo trên 1.000 tài khoản cao tuổi**. Chỉ số phụ: số lượt
> giao dịch dừng lại sau khi cảnh báo hiện ra. Hết 8 tuần, nếu chỉ số chính không giảm,
> bọn em không thu tiền. Giá của giai đoạn sau đặt theo đúng phần chi phí đã giảm được.

Một câu đó trả lời cả "dòng tiền ở đâu" lẫn "làm sao chứng minh" — và nó cho thấy đội
không bịa con số mình chưa có.

### Kinh tế đơn vị — phần này đã đo

- **Chi phí AI ước tính ~3,8 đồng mỗi lượt kiểm có gọi AI** (tính từ bảng giá gateway và
  số token đo được; **chưa phải hoá đơn thật**).
- Lượt có tín hiệu rõ **không gọi AI lượt nào** — tầng luật trả lời dưới 50ms trên CPU.
- Chạy mô hình cục bộ (3B lượng tử 4-bit trên GPU 4 GB) thì chi phí biên gần như chỉ còn
  tiền điện — và đó cũng là câu trả lời cho phần "xanh".

⇒ **Biên lợi nhuận gộp không phải vấn đề của mô hình này.** Chi phí thật nằm ở niềm tin,
tuân thủ và hỗ trợ người dùng, không nằm ở suy luận AI. Nói đúng như vậy thì giám khảo
hiểu ngay đội biết mình đang bán gì.

### Một kịch bản minh hoạ — ĐỌC KÈM GIẢ ĐỊNH, ĐỪNG ĐỌC NHƯ DỰ BÁO

```
Giả định (chưa xác nhận với bất kỳ ngân hàng nào):
  · một ngân hàng có 500.000 tài khoản khách hàng từ 60 tuổi
  · giá 2.000 đ / tài khoản / tháng
⇒ 12 tỷ đồng / năm / ngân hàng.

Cả hai con số đều là giả định để cho thấy CÁCH tính, không phải doanh thu dự kiến.
Số thật phải ra từ pilot ở trên.
```

### Bọn em từ chối kiếm tiền bằng những cách này — nói ra là được điểm

- **Không quảng cáo, không bán dữ liệu.** Bán dữ liệu của nhóm đang bị nhắm tới là làm
  đúng việc mà sản phẩm sinh ra để chống.
- **Không tính phí tính năng cứu người**, kể cả khi điều đó làm doanh thu đẹp hơn.
- **Không thu phí theo vụ "đã cứu"** — nghe hấp dẫn nhưng không chứng minh được vụ nào
  thật sự bị ngăn, và một mô hình doanh thu dựa trên con số không kiểm chứng được sẽ hỏng
  đúng lúc bị soi kỹ nhất.

### Câu trả lời 30 giây khi bị hỏi thẳng

> *"Người dùng cuối không trả tiền — người đang bị lừa không bao giờ là khách hàng. Tiền
> đến từ ngân hàng: họ đã trả rất nhiều cho câu hỏi 'có đúng chủ tài khoản không', nhưng
> chưa ai trả lời 'chủ tài khoản có đang bị ép không'. Bọn em bán đúng lớp đó, tính theo
> mỗi tài khoản cao tuổi được bảo vệ mỗi tháng, và bọn em đề nghị một pilot 8 tuần đo bằng
> số phút tổng đài khiếu nại — không giảm thì không thu tiền. Nguồn phụ là gói gia đình bán
> cho con cái, đúng như Life360 đã chứng minh ở Mỹ: 489,5 triệu USD doanh thu năm 2025 với
> 2,8 triệu gia đình trả phí. Điều đó chứng minh có thị trường, chưa chứng minh người Việt
> sẽ trả — nên bọn em coi ngân hàng là nguồn chính."*

### `[CẦN ĐỘI ĐIỀN]` trước khi lên slide

- Giá gói gia đình định thử là bao nhiêu, và thử với bao nhiêu gia đình.
- Chi phí thật mỗi người dùng mỗi tháng (gồm hỗ trợ, không chỉ AI).
- Số tiền muốn xin và dùng vào việc gì (nếu form có mục gọi vốn/tài trợ).

---

## BA CÂU CÒN LẠI TRONG ẢNH — TRẢ LỜI NGẮN

**"Giám khảo biết mình đang tiết kiệm gì ngay từ lần đầu bằng cách nào?"**
Xem mục *Cho giám khảo THẤY ngay từ lần đầu* ở trên: một dòng ở slide 1 + 10 giây demo bắt
đầu từ **màn hình điện thoại**, không phải từ app.

**"Vấn đề privacy của người dùng"**
Trả lời bằng thứ đã viết ra và kiểm được, không bằng lời hứa:

- Tài liệu `PERMISSIONS-AND-POLICY.md` công khai trong repo: thang quyền, dữ liệu nào rời
  máy và **lúc nào**, và những quyền bọn em **từ chối** xin — không xin đọc SMS, không xin
  danh bạ, không dùng dịch vụ trợ năng (vì chính bộ dò của app coi trợ năng lạ là **dấu
  hiệu lừa đảo** — cảnh báo về một quyền rồi lặng lẽ dùng nó thì lời cảnh báo mất nghĩa).
- Tin nhắn bắt được từ thông báo **được sàng lọc ngay trên máy, không mạng, không AI** và
  **chỉ rời máy khi bác bấm**. Tuần trước bọn em tự phát hiện một đoạn mã làm trái điều
  này và đã tắt nó, kèm test làm đỏ bản dựng nếu mã và cam kết lệch nhau lần nữa.
- **Người thân không bao giờ thấy nội dung tin nhắn của bố mẹ** — chỉ thấy mức rủi ro,
  loại tình huống, bác đã làm gì, và cần gọi ngay hay theo dõi. Lý do: lạm dụng tài chính
  người cao tuổi phần lớn đến từ chính người trong nhà.
- Nói thẳng phần KHÔNG riêng tư: **nội dung cần phân tích có được gửi tới dịch vụ AI**, và
  app nói ra điều đó. Ai muốn tuyệt đối thì chạy mô hình cục bộ, màn kết quả hiện dòng
  🔒 *"AI chạy ngay trên máy này"*.

**"Người cao tuổi mù công nghệ thì dùng được không?"**
Đây là câu hỏi đúng nhất trong ba câu, và nó đã đổi thiết kế sản phẩm:

- **Bác không phải mở app.** Tin đến mang hai dấu hiệu trở lên thì máy tự hỏi; kết quả
  Nguy hiểm cao thì dải cảnh báo đè lên màn hình đang dùng, kể cả màn cuộc gọi; bong bóng
  nổi ở mép màn hình cho ba việc.
- **Chế độ siêu đơn giản:** một màn, ba nút cao 90px, không thanh điều hướng.
- **Sàn tiếp cận có test chặn bản dựng:** vùng chạm ≥52px, nút chính ≥56px, chữ ≥14px,
  tương phản 4,5:1, không cắt dấu tiếng Việt.
- **Người cài không phải người dùng.** Con cháu cài và cấu hình; ẩn dụ dùng khi pitch:
  *máy trợ thính — con mua, con chỉnh, bố mẹ đeo.*
- Giới hạn phải nói: **chưa thử với người cao tuổi ngoài gia đình bọn em.** Đó là rủi ro
  lớn nhất còn lại, và bọn em nói nó ra trước khi giám khảo hỏi.
