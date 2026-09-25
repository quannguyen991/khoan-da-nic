# CAN THIỆP, "LÀM NGAY" VÀ BỘ CHỈ SỐ — bản cho Khoan Đã

> Viết 25/9/2026. Ba phần dưới đây lấy từ một bản nghiên cứu bên ngoài: bảng năm mô hình can
> thiệp, mục "Urgency", và bảng KPI ba tầng. Tài liệu này đã đối chiếu từng phần với code và với
> `eval/results/latest.json` (đo 24/9/2026, bộ luật 1.6.1, 571 mẫu tự soạn, có AI).
>
> **Quy ước giữ nguyên như mục 5 của `4-CAU-CHUYEN-CAU-DAO-GIA-DINH.md`:** chỉ số nào có ngày đo
> mới được lên slide. Chỉ số chưa đo thì slide ghi *"đang đo"*, không ghi số dự đoán.

---

## 1. Khoan Đã nằm ở đâu trong năm mô hình can thiệp

Bảng bên ngoài so năm mô hình rồi kết luận "can thiệp tịnh tiến" là tối ưu. Kết luận đó đúng.
Nhưng cả bảng dựa trên một giả định sai với Khoan Đã: **khoảng dừng giữ được giao dịch lại.**
Khoan Đã không nằm trên đường chuyển tiền. Bác vẫn mở được app ngân hàng bất cứ lúc nào, và
§12 cấm hứa chặn giao dịch. Vì vậy vòng đếm 60 giây **không khoá thứ gì**. Nó chỉ là mốc để
mời người thân vào.

| Mô hình | Khoan Đã có dùng không | Trong app là gì | Phần không làm, và vì sao |
|---|---|---|---|
| Dừng cố định | Có, nhưng không khoá | Vòng 60 giây trên các màn mức Cao. Hết 60 giây mà bác chưa bấm gọi ai thì màn đổi sang: *"Đã qua 60 giây. Trước khi làm gì tiếp, bác gọi con cháu một câu đã."* | Bảng ngoài chê "người dùng chờ hết giờ rồi bấm tiếp". Chê vậy không áp vào đây, vì không có gì bị giữ lại để chờ. Nhược điểm thật của vòng đếm là đếm xong không dẫn tới đâu, và 22/9 đã sửa bằng bước leo thang |
| Dừng theo mức rủi ro | Có, nhưng đổi **màn hình**, không đổi **thời lượng** | Thang 5 mức (`backend/src/intervention-ladder.js`): Phiếu tin cậy → Đường xác minh → Dừng 60 giây → Bác đang được bảo vệ → Bảo vệ 72 giờ | Không dừng ở mức thấp: màn "Chưa thấy dấu hiệu" cố ý không có gì khẩn cấp. Báo oan đắt hơn, và dừng mọi tin thì chính app tự làm người dùng nhờn cảnh báo. Không dừng 120 giây, không khoá giao dịch (§12) |
| Dừng theo hành động | Có | Việc an toàn tiếp theo (`src/lib/viec-an-toan-tiep-theo.ts`): mỗi kịch bản đúng **một** việc, câu lệnh tối đa 8 chữ. Ví dụ: gọi số in sau thẻ, gọi lại số cũ của người thân, đừng cài gì, đừng đọc mã | Không có kiểu "làm xong mới mở khoá", vì không có gì bị khoá. Lối ra "Tôi ổn, không có gì nguy hiểm" luôn nằm ở cuối màn (§4.6) |
| Can thiệp tịnh tiến | Có, đây là khung chính | Nhận ra → một việc và nút gọi người thân → leo thang khi hết 60 giây → báo cho con (chỉ khi bác đã tự bật; con không phản hồi trong 60 giây thì báo người kế tiếp) → màn "Tiền vừa ra. Gọi con ngay." (bản APK, **chưa thử trên máy thật**) → phục hồi, theo dõi 72 giờ | — |
| Không hẹn giờ | Có, ở hai mức dưới | Phiếu tin cậy và Đường xác minh không có đồng hồ | Màn mức Cao **không đồng hồ** là một nhóm nên thử (mục 4), vì chưa ai đo được vòng 60 giây giúp tới đâu |

**Câu nói:**

> *"Khoan Đã không chọn một cột trong bảng. Mức rủi ro quyết định màn hình, mỗi màn chỉ giao
> một việc, và 60 giây là lúc mời người thân vào, không phải thời gian bắt bác chờ."*
>
> *"We don't pick one column. The risk level picks the screen, each screen asks for one action,
> and sixty seconds is when family is invited in — not a wait we impose."*

⚠️ **Bị hỏi "vì sao 60 giây" thì trả lời ngay:** *"Đó là tham số thiết kế ban đầu, chưa phải
con số khoa học. Trong app nó là mốc leo thang. Bọn em sẽ so nó với bản không có đồng hồ."*

---

## 2. Vì sao "làm ngay" nguy hiểm, và app làm gì với nó

### 2.1 Bằng chứng (đã kiểm nguồn 24–25/9/2026)

| Nguồn | Nói gì | Loại bằng chứng |
|---|---|---|
| FTC (Mỹ) — [How To Avoid a Scam](https://consumer.ftc.gov/articles/how-avoid-scam) | Kẻ gian ép làm ngay để nạn nhân không kịp nghĩ. Qua điện thoại, chúng còn bảo đừng cúp máy để nạn nhân không kiểm chứng được câu chuyện. FTC khuyên: dừng lại, kể với một người mình tin trước khi làm gì | Khuyến nghị chính thức |
| FTC — [How I'll Avoid a Scam: My Action Plan](https://consumer.ftc.gov/consumer-alerts/2025/11/use-action-plan-avoid-scams) (18/11/2025) | Tờ kế hoạch điền **từ trước**, có danh sách những người tin cậy sẽ gọi khi nghi bị lừa | Khuyến nghị chính thức. Cùng ý với "Quy tắc nhà mình" và "Vòng tròn gia đình" |
| UK Finance — [Take Five](https://www.takefive-stopfraud.org.uk/) | Ba bước: Dừng lại – Nghi vấn – Bảo vệ. *"Only criminals will try to rush or panic you."* | Khuyến nghị chính thức |
| Butavicius, Taib & Han (2022), *Computers & Security* 123:102937 | Thí nghiệm 472 người: bị ép thời gian thì nhận ra email lừa kém đi rõ rệt | Thực nghiệm. Trực tiếp với email lừa, gián tiếp với cuộc gọi |
| van Herk và cộng sự (2024), *Neurobiology of Stress* 31:100659 | Tổng quan 44 nghiên cứu: stress cấp tính làm suy giảm khả năng ra quyết định | Chỉ nói về cơ chế thần kinh, không có số đo hành vi |

**Được nói:** *"Thúc ép không chỉ là một dấu hiệu lừa đảo. Nó là cách lấy mất thời gian kiểm
tra của người bị lừa."* Có thực nghiệm 472 người và ba khuyến nghị chính thức đỡ câu này.

**Chưa được nói:** *"60 giây đủ để phá áp lực."* Chưa ai đo điều đó.

### 2.2 App làm gì với nó (đã có trong code)

1. **Nhận ra chiêu.** Nhóm "thao túng" có 11 tín hiệu, trong đó có bốn chiêu cắt người dùng
   khỏi thời gian và khỏi người thứ ba: *Thúc phải làm ngay* (`MAN_URGENCY`), *Bắt giữ máy,
   không cho tắt* (`MAN_KEEP_CALL_ACTIVE`, đúng chiêu FTC mô tả), *Dặn đừng nói với ai*
   (`MAN_SECRECY`), *Tách bác khỏi người thân* (`MAN_ISOLATION`).
2. **Gọi tên cảm giác đó.** Màn Dừng 60 giây có câu *"Cảm giác phải làm ngay là do họ tạo ra."*
   Câu này ẩn khi nút gọi lớn đã ở trên, để màn bớt chữ.
3. **Biến một quyết định thành một việc.** Màn chỉ có một câu lệnh tối đa 8 chữ và một nút.
4. **Đưa sẵn một câu để thoát cuộc gọi.** Ngay dưới nút gọi có dòng *"Đang nghe máy thì nói: 'Để
   tôi hỏi con rồi gọi lại.'"* Câu này có vì nhiều người cao tuổi không dám cúp máy ngang với
   người xưng công an, sợ bị cho là vô lễ.
5. **Đưa người thứ ba vào.** Nút gọi người thân nằm ở nửa trên màn. Hết 60 giây mà chưa gọi
   thì app leo thang.

**Câu nói:**

> *"Kẻ lừa đảo cần hai thứ: bác không có thời gian kiểm, và bác không hỏi ai. Khoan Đã trả lại
> cả hai: một việc cụ thể để làm ngay, và một người để hỏi."*
>
> *"A scammer needs two things: no time to check, and no one to ask. Khoan Đã gives both back —
> one thing to do right now, and one person to call."*

---

## 3. Bộ chỉ số — viết lại cho đúng với Khoan Đã

Bảng bên ngoài chia chỉ số làm ba tầng: hệ thống, hành vi, kinh tế. Cách chia đó đúng. Nhưng
trong bảng và danh sách "top 5" đi kèm có **năm chỉ số Khoan Đã không đo được, hoặc đo ra số sai
nghĩa**, và một chỉ số phải định nghĩa lại. Mục 3.4 nói từng cái.

Tình trạng hôm nay, tóm trong một câu: **tầng hệ thống đã đo. Tầng hành vi đã có dụng cụ đo trên
máy nhưng chưa có số. Tầng kinh tế mới có công thức.**

### 3.1 Tầng hệ thống — ĐÃ ĐO

Nguồn: `eval/results/latest.json`, đo 24/9/2026, bộ luật 1.6.1, 571 mẫu **tự soạn** gồm 265 tin
nguy hiểm, 97 tin nghi ngờ và 169 tin lành, có AI. Trang `/transparency` đọc đúng tệp này, nên
slide phải khớp với nó.

| Chỉ số | Cách tính | Kết quả |
|---|---|---|
| Tin nguy hiểm có cảnh báo | (Cao + Nghi ngờ) / tin nguy hiểm | **92,1%** (244/265) |
| Tin nguy hiểm ra đúng mức Cao | Cao / tin nguy hiểm | **82,6%** (219/265) |
| **Trấn an nhầm** | "Chưa thấy dấu hiệu" / tin nguy hiểm | **7,9%** (21/265) |
| Báo oan mức Cao | Cao / tin lành | **1,8%** (3/169) |
| Báo oan, tính mọi mức cảnh báo | (Cao + Nghi ngờ) / tin lành | **5,3%** (9/169) |
| Báo oan trên tin lành không được phép cảnh báo | có cảnh báo / 125 mẫu loại này | **3,2%** (4/125) |
| Lượt AI hỏng | lượt hỏng / tổng, trần 10% (§4.3) | **0** |
| Thời gian chạy lại cả bộ bằng tín hiệu AI đã lưu | tổng số giây | **4,2 giây** cho 571 tin, khoảng 7 ms mỗi tin kể cả khởi động |
| Thời gian trả lời có AI trên máy chủ thật (25/9/2026, 47 lượt) | trung vị / 90% / chậm nhất | **2,0 / 3,2 / 3,7 giây** |
| Chênh lệch Việt–Anh (ra đúng mức Cao) | Anh − Việt | **11,1 điểm** (tiếng Việt 80,1%, tiếng Anh 91,2%) |

- **Trấn an nhầm là chỉ số an toàn quan trọng nhất**, quan trọng hơn độ chính xác chung. Khi
  nói phải kèm: màn "Chưa thấy dấu hiệu" không bao giờ nói "an toàn", và phần chưa kiểm được
  (nếu có) hiện cùng cỡ chữ với nhãn.
- **Tiếng Anh chưa có mẫu tin lành nào**, nên báo oan tiếng Anh **chưa đo**. Phần tiếng Anh chỉ
  có 34 tin nguy hiểm, quá ít, đừng khoe con số 91,2%.
- **Mẫu thật: 0** trên mục tiêu 25. Mọi số trên đều đo trên mẫu tự soạn.
- **Độ trễ khi có AI — ĐÃ ĐO 25/9/2026** bằng `node scripts/do-tre-render.js --ghi`, gửi 48 tin
  mẫu tự soạn tới máy chủ thật (Render, model `deepseek-v4-flash-0731`) từ một máy ở Việt Nam, giãn
  2,3 giây giữa các lượt. 47 lượt có AI: **trung vị 2,0 giây, 90% dưới 3,2 giây, chậm nhất 3,7
  giây**, 0 lượt hỏng. Kết quả ở `eval/results/do-tre-render.json` (chỉ ghi id mẫu, không ghi nội
  dung). Chỉ 1 lượt tầng luật tự kết luận không cần AI (0,24 giây) — quá ít để nói gì. Số đo gồm cả
  đường mạng; đo từ nơi khác sẽ ra số khác, nên trích kèm ngày và nơi đo. Các số cũ "6,5 giây,
  đuôi 27–35 giây" là của gateway trước, đừng dùng nữa.

### 3.2 Tầng hành vi — dụng cụ ĐÃ CÓ trên máy, số CHƯA CÓ

Từ 22/9/2026, app tự ghi hai thứ. Cả hai **chỉ nằm trên máy, không gửi đi đâu**, và có test chặn
mọi đường ra mạng:

- `src/lib/ket-qua-can-thiep.ts` ghi bác đã chọn gì sau mỗi màn cảnh báo: bấm gọi người thân,
  báo đã lỡ chuyển, bấm "Tôi ổn", rời màn, "Con bảo là lừa đảo", "Con bảo không sao". Chỉ ghi
  mã, không một chữ nội dung tin nhắn. Giữ 100 lượt gần nhất.
- `src/lib/do-thoi-gian-toi-nguoi-that.ts` ghi số giây từ lúc màn cảnh báo hiện tới lúc chạm
  nút gọi. Trung vị và số lượt hiện ở màn Hồ sơ.

| Chỉ số | Định nghĩa cho Khoan Đã | Đo bằng | Trạng thái |
|---|---|---|---|
| **Tỉ lệ bấm gọi sau cảnh báo** | Trong các lượt hiện màn cảnh báo, bao nhiêu lượt kết thúc bằng bấm gọi người thân | mã `bam_goi_nguoi_than` và buổi thử | Chưa đo |
| **Thời gian tới lúc bấm** | Trung vị số giây từ màn cảnh báo tới lúc chạm nút gọi | `giayToiLucBam` và đồng hồ bấm tay ở buổi thử | Chưa đo |
| Tìm được lối ra khi báo nhầm | Người thử có tìm được "Tôi ổn" ở tình huống C không, mất bao lâu | `5-KICH-BAN-THU-VOI-NGUOI-CAO-TUOI.md`, tình huống C | Chưa đo |
| Tỉ lệ "Tôi ổn" | Số lần bấm "Tôi ổn" / số lượt màn khẩn cấp, cần từ 5 lượt trở lên (`tomTatKetQua`) | mã `toi_on` | Chỉ dùng để chỉnh ngưỡng |
| Tự báo "đã lỡ chuyển" | Số lần báo đã chuyển / số lượt cảnh báo | mã `da_lo_chuyen` | Người dùng tự khai, app không kiểm được |
| Rời màn không chọn gì | Số lần rời màn / số lượt cảnh báo | mã `ve_trang_chu` | Chưa đo |

⚠️ **Tên chỉ số phải nói đúng thứ đo được (§11).** "Bấm gọi" không có nghĩa là "đã gọi được",
vì máy không biết có ai nhấc máy hay không. Slide ghi *"bấm gọi người thân sau N giây"*, không
ghi *"liên lạc được với người thân"*.

⚠️ **Với 5–10 người thử, ghi dạng x/N kèm trung vị, không ghi phần trăm có số lẻ.** Mẫu câu:
*"x/N người bấm gọi trong 60 giây, trung vị y giây, N = …, thử ngày …"*

**Đọc số ở đâu (thêm 25/9/2026):** Cài đặt › Ra-đa nhà mình › **Số đo trên máy này** — đếm từng việc
đã bấm sau cảnh báo, kèm nút **"Sao chép số đo"** chỉ chép mã và giờ. Buổi thử dùng nút này thay cho
việc ghi tay hành động (vẫn giữ đồng hồ bấm tay), xem mục 5b của `5-KICH-BAN`. Ô này đếm **số lần
bấm, không phải số vụ**, và cố ý không tính tỉ lệ: bản ghi không mang mã vụ.

Câu này dùng được khi bị hỏi về quyền riêng tư: *"Bọn em đo hành vi mà không lấy dữ liệu ra khỏi
máy. Đó là dữ liệu về lúc một người đang hoảng, nên nó không có lý do gì để rời máy của họ."*

### 3.3 Tầng kinh tế — mới có công thức

| Chỉ số | Trạng thái |
|---|---|
| Chi phí AI mỗi lượt có gọi AI | Khoảng 3,8 đồng. Đây là **ước tính** từ bảng giá gateway và số token, chưa phải hoá đơn (xem `TRA-LOI-SAVING-VA-DOANH-THU.md`) |
| Chi phí tránh được ròng trên mỗi người | **Chưa có số.** Công thức: (xác suất mất tiền khi không dùng app − xác suất khi có app) × số tiền mất trung bình − chi phí vận hành. Hiệu hai xác suất đó chưa ai đo, nên lúc này mọi con số tiền đều là bịa (§11) |
| Số phút tổng đài khiếu nại lừa đảo trên 1.000 tài khoản 60+ | Chỉ số chính của đề xuất pilot 8 tuần với ngân hàng trong `TRA-LOI`. **Chưa có ngân hàng nào tham gia** |

### 3.4 Những chỉ số trong bảng ngoài phải đổi, và vì sao

| Bảng ngoài | Vấn đề với Khoan Đã | Thay bằng |
|---|---|---|
| **Độ chính xác cảnh báo** (Alert Precision) | Chỉ số này phụ thuộc tỉ lệ tin lừa ngoài đời, mà bộ mẫu không cho biết tỉ lệ đó. Ví dụ: vẫn giữ độ bắt 82,6% và báo oan 1,8%, và giả sử chỉ có tin lừa với tin lành. Nếu 1 trên 10 tin được kiểm là lừa đảo thì khoảng 84% cảnh báo mức Cao là đúng. Nếu 1 trên 100 thì chỉ còn khoảng 32%. Con số 92,8% tính trên bộ mẫu không phải con số ngoài đời | Báo oan trên tin lành (1,8%): số này không phụ thuộc tỉ lệ tin lừa |
| **Tỉ lệ dương tính giả** định nghĩa là "gián đoạn thao tác tài chính hợp lệ" | App không nhìn thấy thao tác tài chính nào | Giữ chỉ số, đổi định nghĩa thành báo oan trên **tin lành** (mục 3.1) |
| **Độ trễ < 300 ms** | Mốc 300 ms không có cơ sở. Thứ app cần thắng là vài giây trước khi bác đọc mã, không phải một cú chạm. "Màn hình ma sát" lại gợi ý app chặn thao tác, trong khi app không chặn | Tách làm hai số: tầng luật (4,2 giây cho 571 tin) và khi có AI (đo 25/9/2026 trên máy chủ thật: trung vị 2,0 giây, chậm nhất 3,7 giây) |
| **Tỉ lệ giữ màn, không bấm thoát** (Friction Completion) | Nếu coi bấm thoát là thất bại thì sẽ có sức ép giấu lối ra, trong khi §4.6 bắt lối ra luôn phải có. Mỗi lần bấm "Tôi ổn" là một mẫu báo động giả để chỉnh ngưỡng, không phải một lỗi của người dùng | Tỉ lệ "Tôi ổn" (để chỉnh ngưỡng) và việc tìm được lối ra khi báo nhầm |
| **Tỉ lệ giao dịch bị huỷ** (Drop-off Danger) | App không nhìn thấy giao dịch nào | Chỉ đo được trong pilot với ngân hàng hoặc thí nghiệm mô phỏng. Trong app có số gần nhất là tỉ lệ tự báo "đã lỡ chuyển", nhưng đó là chiều ngược lại và do người dùng tự khai |
| **Giữ chân người dùng 90 ngày** (trong top 5) | Chỉ số này sai cho một sản phẩm an toàn: app tốt thì không cần mở mỗi ngày. Thêm nữa, theo quyết định 23/9, "nhịp bảo vệ" chỉ lưu bản mới nhất, không lưu lịch sử | "Máy còn được bảo vệ sau 90 ngày": ba quyền vẫn bật, vẫn có người thân. Đo bằng buổi thử lặp lại hoặc trong pilot. Muốn lưu lịch sử nhịp thì phải đổi privacy model (§12), cần quyết riêng |

"Tỉ lệ thực hiện hành động an toàn" giữ lại, đổi tên thành "tỉ lệ bấm gọi sau cảnh báo" cho khớp
với thứ đo được. "Chi phí tránh được ròng" và "giảm tải khiếu nại" giữ lại ở dạng công thức và
chỉ số của pilot (mục 3.3).

### 3.5 Năm chỉ số nên lên slide (thay danh sách "top 5" của bảng ngoài)

1. **Tin nguy hiểm có cảnh báo: 92,1%.** Đo 24/9/2026 trên 571 mẫu tự soạn.
2. **Trấn an nhầm: 7,9%.** Cùng nguồn. Nói kèm: màn đó không bao giờ nói "an toàn".
3. **Báo oan mức Cao: 1,8%.** Cùng nguồn. Tiếng Anh chưa đo.
4. **Bấm gọi người thân sau màn cảnh báo: x/N, trung vị y giây.** Chưa có buổi thử thì ghi
   *"đang đo với N người cao tuổi"*.
5. **Số phút tổng đài khiếu nại trên 1.000 tài khoản 60+.** Ghi *"chỉ số của pilot ngân hàng,
   chưa có số"*.

**Không đưa lên slide:** độ chính xác cảnh báo tính trên bộ mẫu, chi phí tránh được có ghi số
tiền, giữ chân người dùng 90 ngày.

| Tiếng Việt | English |
|---|---|
| Tin nguy hiểm có cảnh báo | Scam messages that got a warning |
| Trấn an nhầm | False reassurance |
| Báo oan mức Cao | High-risk false alarms |
| Bấm gọi người thân sau cảnh báo | Tapped "call family" after a warning |
| Phút tổng đài khiếu nại / 1.000 tài khoản 60+ | Fraud-complaint call minutes per 1,000 accounts aged 60+ |

---

## 4. Đo tầng hành vi thế nào cho đúng

- Làm theo `5-KICH-BAN-THU-VOI-NGUOI-CAO-TUOI.md`: đóng vai một cuộc gọi, bấm giờ tới lúc người
  thử bấm gọi. **Không** đưa danh sách đáp án cho người thử chọn. Nhìn danh sách là biết đâu là
  câu đúng, nên nhóm nào cũng sẽ chọn "tự gọi kênh chính thức".
- Thử với 5–10 người là để **xem người thật có dùng được không**, chưa phải bằng chứng app hiệu
  quả. Nói đúng như vậy.
- Nếu sau này có đủ người để so sánh, chia 3 nhóm hợp hơn 4 nhóm: chỉ có cảnh báo chữ / màn hiện
  tại nhưng bỏ vòng đếm / màn hiện tại. Với 30 người một nhóm, sai số của chênh lệch giữa hai
  nhóm vào khoảng ±25 điểm (khoảng tin cậy 95%). Tức là chỉ thấy được chênh lệch lớn, và "không
  thấy chênh lệch" không có nghĩa là "hai bên bằng nhau".
- Nhóm không có vòng đếm phải chạy trên một bản mẫu riêng. Tên "Dừng 60 giây" và mã `PAUSE_60S`
  đã chốt trong hợp đồng (§HĐ, §4.1).

---

## 5. Không được nói (bổ sung cho §11)

- *"Khoan Đã tạm khoá / chặn giao dịch"*, *"màn hình ma sát chặn thao tác"*.
- *"Đã tiết kiệm X đồng"*, *"chi phí tránh được X đồng mỗi người"*.
- *"Độ chính xác cảnh báo 92,8%"*. Đó là số trên bộ mẫu, không phải ngoài đời.
- *"Người cao tuổi bấm gọi con trong N giây"* khi chưa có buổi thử (xem mục 6 của `5-KICH-BAN`).
- *"Đã gọi được cho người thân"*. Máy chỉ biết bác đã bấm nút gọi.
