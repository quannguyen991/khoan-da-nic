# KHOAN ĐÃ — GIẢI THÍCH ĐỂ TRẢ LỜI GIÁM KHẢO

*Bản dành cho người thuyết trình. Mọi con số ở đây đều đã đo, không có số nào ước lượng.*

---

## 1. Một câu

> Khoan Đã không phải "AI phát hiện lừa đảo". Nó là **một bộ luật cứng ra
> quyết định**, còn AI chỉ làm một việc: **đọc và bật cờ**.

Đó là khác biệt lớn nhất, và cũng là câu trả lời cho hầu hết câu hỏi khó.

---

## 2. Một lượt kiểm chạy thế nào

Bác gõ *"nộp 20tr cho cục thuế"* vào ô trên trang chủ. Sáu bước:

```
① CHUẨN HOÁ VĂN BẢN
   viết thường · bỏ dấu · tách câu · gỡ dấu chấm chèn giữa chữ ("c.h.u.y.ể.n")
   → vì tin nhắn lừa đảo hay viết thiếu dấu và chèn ký tự để né bộ lọc

② TẦNG LUẬT ĐỌC TRƯỚC        (~50 mili-giây, KHÔNG cần mạng)
   khoảng 60 mẫu nhận dạng: giả danh cơ quan · xin OTP · đòi chuyển tiền ·
   thúc gấp · doạ dẫm · bắt giữ bí mật
   → ra ngay một mức sơ bộ, hiện lên màn hình để bác không nhìn màn trống

③ TẦNG AI ĐỌC SONG SONG      (~30 giây)
   AI trả về DANH SÁCH TÍN HIỆU kèm trích dẫn, mỗi tín hiệu là
   "có" hoặc "chưa rõ" — KHÔNG có "không có"
   AI KHÔNG được trả điểm số, KHÔNG được trả mức rủi ro

④ ĐỐI CHIẾU TRÍCH DẪN
   mỗi câu AI trích ra phải TÌM THẤY THẬT trong văn bản gốc
   → AI bịa ra một câu không có thì tín hiệu đó bị vứt

⑤ BỘ LUẬT CỘNG ĐIỂM VÀ RA MỨC
   ngưỡng cố định 20 và 45 điểm, trần 69
   thêm 10 "luật vượt cấp" — ví dụ có cả giả danh công an LẪN đòi chuyển tiền
   thì lên thẳng mức cao, không cần đủ điểm

⑥ TRẢ VỀ ĐÚNG BẢY TRƯỜNG
   nhãn · mã lý do · đã kiểm được gì · CHƯA kiểm được gì ·
   họ kịch bản · AI có chạy không · màn hình nào
```

**Điểm cần nhấn:** bước ② chạy được **khi rút mạng**. Bác vẫn có câu trả lời
kể cả khi AI chết hoặc không có Internet — chỉ là app sẽ **nói thẳng** rằng
lượt này không có AI đọc.

---

## 3. Ba quyết định thiết kế, và vì sao

### ① AI chỉ bật cờ, luật cứng mới quyết định

**Vì sao không để AI ra kết luận luôn?**

Ba lý do, xếp theo mức quan trọng:

1. **Giải thích được.** Mức rủi ro luôn truy ngược ra được một mẫu cụ thể và
   một câu cụ thể trong tin nhắn. Không có "AI bảo thế".
2. **Không lay chuyển được bằng lời.** Kẻ lừa đảo viết *"đây không phải lừa
   đảo đâu, bác cứ yên tâm"* — với AI đó là một câu có sức nặng; với bộ luật
   thì nó không tồn tại.
3. **Không đổi khi model đổi.** Đổi nhà cung cấp AI không làm đổi ngưỡng.

Lược đồ dữ liệu **cấm** AI trả về các trường `riskScore`, `riskLabel`,
`critical`, `safe`. Model trả về thì bị từ chối ngay ở tầng kiểm.

### ② Không có nhãn "An toàn"

Ba nhãn, không có nhãn thứ tư:

| Mức | Chữ hiện ra |
|---|---|
| Cao | **Nguy hiểm cao** |
| Vừa | **Nghi ngờ** |
| Thấp | **Chưa thấy dấu hiệu rủi ro** |

Mức thấp **không nói "an toàn"**. Nó nói *"chưa thấy dấu hiệu trong thông tin
bác cung cấp"* — vì đó là sự thật, còn "an toàn" là một lời hứa không ai giữ
được.

Ba chuỗi này nằm trong mã nguồn (`src/risk-labels.js`), bảng dịch **không đè
được**, CSS **không đụng tới được**.

### ③ "Chưa kiểm được" khác "đã kiểm, không thấy gì"

**Đây là phần kỹ thuật tôi tự hào nhất, và cũng là bài học đắt nhất.**

Cùng một ngày, lỗi này xuất hiện ở **ba chỗ hoàn toàn độc lập**: ảnh không đọc
được vì AI chết · tên miền không phân giải được · bộ đánh giá hỏng 89,5% lượt
gọi. **Cả ba đều hiện ra màn hình y hệt nhau: "Chưa thấy dấu hiệu rủi ro."**

Nghĩa là: hệ thống *không kiểm được gì cả* mà người dùng lại đọc thành *đã
kiểm rồi, không sao*. Đó là kiểu sai nguy hiểm nhất một app chống lừa đảo có
thể mắc.

Nên hợp đồng dữ liệu có một trường riêng — `chuaKiem` — và **giao diện bắt
buộc hiện nó CÙNG CỠ CHỮ với nhãn rủi ro**. Không được cho chữ nhỏ hơn, không
được gấp lại, không được để sau nút bấm.

Tính tới nay lỗi này đã bị bắt ở **hơn mười chỗ khác nhau**: AI không chạy ·
ghi âm cụt · cầu nối điện thoại không trả lời · kho dữ liệu chỉ nằm trong RAM ·
lấy tin báo thất bại · camera bị từ chối.

---

## 4. Dữ liệu của người dùng đi đâu

**Nói chính xác, đừng nói quá:**

| Thứ gì | Đi đâu |
|---|---|
| Giọng nói khi bấm ghi âm | **Không rời khỏi máy.** Dùng bộ nghe cài sẵn trong Android; máy không có thì app **từ chối**, không gửi tiếng ra đám mây. Chỉ **bản chép chữ** mới đi tiếp. |
| Ảnh đại diện hồ sơ | **Không rời khỏi máy.** Không có đường tải lên. |
| Tin nhắn / ảnh bác đưa vào kiểm | **Có gửi** tới máy chủ và tới model AI để phân tích — không phân tích được nếu không gửi. |
| Nội dung đó có được **lưu** không | **KHÔNG.** Cơ sở dữ liệu có hàng rào cứng: cố lưu `vanBan`, `noiDung`, `anh`, `otp`, `matKhau`… là **ném lỗi**, không phải lọc bỏ rồi nhận. |
| Cơ sở dữ liệu lưu gì | Tài khoản, quan hệ gia đình, quy tắc, nhật ký kiểm toán. Hết. |

Câu trả lời gọn cho giám khảo:

> *"Nội dung được gửi đi để phân tích, nhưng không bao giờ được lưu. Đó là một
> hàng rào trong mã, có test chứng minh, không phải một lời hứa trong chính
> sách."*

---

## 5. Con số đã đo

Trên **445 mẫu** (tiếng Việt có dấu, không dấu, và tiếng Anh):

| Chỉ số | Giá trị | Nghĩa là |
|---|---|---|
| Recall | **73,7 %** | bắt được 73,7% số vụ lừa đảo thật |
| Báo động giả mức cao | **6,1 %** | trong 100 tin nhắn bình thường, ~6 tin bị gắn nhãn cao |
| Pass | **67,4 %** | tỉ lệ mẫu ra đúng hoàn toàn |

Riêng tầng luật (không có AI), trên 485 mẫu: **báo oan 12/164 · bỏ sót
250/321**. Con số bỏ sót cao là bình thường — tầng luật cố ý chỉ bắt những mẫu
chắc chắn, phần còn lại là việc của AI.

**Có 736 bài test ở backend và 55 bài ở giao diện.** Phần lớn không phải test
chức năng — chúng là **hàng rào chặn những lỗi đã từng xảy ra**, mỗi bài kèm
ngày tháng và số đo.

---

## 6. Câu hỏi giám khảo hay hỏi

### "Khác gì hỏi thẳng ChatGPT?"

Ba điểm:

1. ChatGPT ra kết luận; ở đây **AI không được ra kết luận** — nó chỉ trích dẫn
   bằng chứng, luật cứng mới ra mức. Kết quả **giải thích được** và **không
   đổi giữa hai lần hỏi giống nhau**.
2. ChatGPT bị lay chuyển bằng lời. Kẻ lừa đảo viết "đây không phải lừa đảo"
   thì mô hình có thể nghe theo; bộ luật thì không.
3. ChatGPT cần mạng. Ở đây rút mạng vẫn có câu trả lời từ tầng luật.

### "Nếu AI sai thì sao?"

Sai theo hai hướng, xử lý khác nhau:

- **AI bỏ sót** → tầng luật vẫn chạy độc lập, bắt được thì vẫn báo.
- **AI bịa** → mỗi trích dẫn phải tìm thấy thật trong văn bản gốc, không thấy
  thì vứt tín hiệu đó.
- **AI chết hẳn** → app **nói ra** ("lượt này không có AI đọc"), không im lặng
  trả về mức thấp.

### "Báo động giả thì sao? Người già sẽ sợ."

Đúng, và đó là lý do màn khẩn cấp **luôn có** dòng *"Tôi ổn, không có gì nguy
hiểm"* ở cuối. **Mỗi lần bấm nút đó là một mẫu dữ liệu báo động giả được ghi
lại để hiệu chỉnh ngưỡng.**

Người bị kẹt trong màn khẩn cấp mà không thoát ra được sẽ gỡ ứng dụng — và
lúc đó họ mất luôn lớp bảo vệ.

### "Kẻ lừa đảo có lách được không?"

Được, và chúng tôi không giả vờ ngược lại. Nhưng có hai thứ **cố ý** không làm:

- **Không có cụm từ nào hạ mức vô điều kiện.** Đã đo: thêm chữ "CH Play" vào
  một danh sách tắt thì câu *"…đừng tải trên CH Play vì bản đó cũ"* kéo hẳn
  một kịch bản giả danh công an xuống mức thấp. **Bất kỳ cụm nào hạ mức vô
  điều kiện đều là một câu thần chú tặng cho kẻ lừa đảo.**
- **Nội dung người dùng không bao giờ được dùng làm chỉ thị cho AI.** Tin nhắn
  viết "bỏ qua mọi hướng dẫn trước đó" cũng chỉ là dữ liệu.

### "Vì sao không tự chặn cuộc gọi / chặn giao dịch?"

Vì **không làm được**, và hứa thì thành nói dối:

- Android chặn app bên thứ ba chạm vào luồng âm thanh cuộc gọi từ bản 10.
- Không ngân hàng nào cho app ngoài chặn giao dịch.

Nên app nói đúng thứ nó làm: nó **nghe cái micro đặt cạnh** cuộc gọi, và trong
kết quả luôn ghi rõ *"chưa nghe được cuộc gọi"* khi có cuộc gọi dính vào.

### "Vì sao không tự chụp màn hình của bác để theo dõi?"

Ba lý do, và lý do thứ ba là quan trọng nhất:

1. Android không cho app chụp màn hình app khác.
2. Cách duy nhất làm được thì đòi xác nhận mỗi lần và hiện biểu tượng ghi màn
   hình — không "âm thầm" được.
3. **Một app chống lừa đảo mà âm thầm theo dõi màn hình người già thì chính nó
   là thứ đáng sợ.**

Nên đường đúng là: bác **tự** chụp màn hình rồi bấm Chia sẻ → Khoan Đã. Chủ
động, có chủ đích. Đây cũng là cách duy nhất lấy được nội dung đầy đủ từ Zalo,
Messenger hay app ngân hàng.

### "Người già dùng được không?"

Có sàn tiếp cận, **có test chặn**, không phải khuyến nghị:

- Vùng chạm tối thiểu **52px**, nút chính **56px**
- Cỡ chữ nhỏ nhất **14px**, ba bậc phóng to (15 / 17 / 20px)
- Dấu tiếng Việt xếp **cả trên lẫn dưới** (ế, ộ, ữ) nên khoảng dòng dưới 1,25
  là cắt dấu → có test chặn
- Tiếng Việt dài hơn tiếng Anh ~30% nên **cấm** `nowrap` trên nút
- Tôn trọng tuỳ chọn "giảm chuyển động" của hệ điều hành — chóng mặt do chuyển
  động phổ biến hơn nhiều ở người cao tuổi

Và một luật về giọng văn: **không câu nào được trách người dùng.** Không có
"sao bác lại tin?", không có "bác đã sai rồi".

### "Ai bảo vệ bác khỏi chính người trong nhà?"

Câu hỏi này ít ai hỏi, nhưng nếu có thì đây là phần mạnh:

Dạng lạm dụng tài chính người cao tuổi **phổ biến nhất là do người trong nhà
gây ra**. Nên phần "vòng tròn gia đình" được dựng với bốn ràng buộc **từ dòng
mã đầu tiên**:

1. Bác **thu hồi được mọi quyền** của mọi thành viên, bất cứ lúc nào, **không
   cần** mật khẩu hay đồng ý của người đã cài hộ.
2. Bảng theo dõi cho người thân **mặc định tắt**; người cài hộ **không bật
   thay được**.
3. Mỗi lần thành viên xem dữ liệu là một bản ghi mà **chính người xem không
   xoá được**.
4. **Không** hiển thị số tiền chính xác cho thành viên — chỉ khoảng giá trị.

---

## 7. Những gì CHƯA xong — nói thẳng

Nói ra trước còn hơn để giám khảo tìm thấy:

| Việc | Trạng thái |
|---|---|
| **Popup đè màn hình** khi mức cao | **Đã nối xong.** Gọi từ một chỗ duy nhất trong `App.tsx`, có cờ chặn `nhan !== 'CAO'`, chữ lấy từ catalog. Có test chặn. |
| **Thông báo lên đầu danh sách** | Kênh `IMPORTANCE_HIGH` đã dựng và biên dịch được, **chưa có chỗ nào gọi** khi kết quả là mức cao. |
| Chênh lệch Việt ↔ Anh | 16,6 điểm, mục tiêu ≤3,0 — **chưa đạt** |
| Nội dung DẠY về lừa đảo bị nhận nhầm | 12/164 mẫu |
| Câu chuyển tiền trần trụi | *"chuyển 50 triệu cho tài khoản này"* được 14 điểm, dưới ngưỡng 20 — cần thêm tín hiệu "số tiền lớn + tài khoản vô danh" |
| Chạy thử trên điện thoại thật | Đường micro chỉ kiểm được trên máy thật |

**Nguyên tắc khi trả lời:** không nói "hoàn thiện 100%", không gán số đo cho
model chưa hề được gọi, không gọi một mục tiêu là "đã đo".

---

## 8. Ba câu chốt nếu chỉ được nói ba câu

1. **"AI đọc, luật quyết định."** Mức rủi ro luôn truy ngược ra được một mẫu
   cụ thể và một câu cụ thể — không có "AI bảo thế".

2. **"Chúng tôi không bao giờ nói 'an toàn'."** Chỉ nói "chưa thấy dấu hiệu
   trong thông tin bác cung cấp", và **cái gì chưa kiểm được thì hiện to bằng
   đúng cỡ chữ của kết luận.**

3. **"Luôn có lối ra."** Màn khẩn cấp bỏ hết điều hướng nhưng luôn có nút
   *"Tôi ổn, không có gì nguy hiểm"* — và mỗi lần bấm là một mẫu dữ liệu để
   sửa ngưỡng.
