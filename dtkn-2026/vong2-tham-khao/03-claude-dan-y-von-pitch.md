# Phương án hoàn thiện Proposal V2 – Khoan Đã

Một số điểm dưới đây dựa trên kiến thức của tôi, chưa kiểm tra lại với văn bản gốc. Tôi đánh dấu **[cần xác minh]** ở những chỗ đó.

---

## A) DÀN Ý PROPOSAL V2

**Cấu trúc:** 1 slide Business Model (đứng đầu, không tính trang) + 10 trang nội dung + 1 slide phụ lục = 12 slide. Bìa và mục lục nếu có thì làm tối giản và không tính trang. Hãy hỏi lại BTC xem Business Model phải là slide đầu tiên tuyệt đối hay được đứng sau bìa. Cách an toàn nhất là bỏ bìa riêng và để tên dự án nằm trên chính slide Business Model.

**Tên file:** theo mẫu `[TKN2026]_V2_[Tên đội]_Proposal`. Đề bắt buộc có tên đội, nên "ShieldGen" trong tên file có thể chính là tên đã đăng ký ở vòng 1. Hãy kiểm tra lại với BTC xem tên nào được chấp nhận. Trong nội dung slide thì chỉ dùng "Khoan Đã" và không ghi thông tin thành viên.

### Slide 0 – Business Model (không tính trang)
**Tiêu đề:** "Người cao tuổi dùng miễn phí, gia đình trả phí, và mỗi lần dừng 60 giây là một khoản tiền tích luỹ được giữ lại."
- Canvas gọn 6 khối: khách hàng (người 60+ và con cháu), giá trị (dừng 60s, biết dấu hiệu, gọi người thân một chạm), kênh (hội người cao tuổi, trường học, cộng đồng), doanh thu (gói Pro 29–49k/tháng/gia đình; B2B là hướng sau), chi phí chính, đối tác.
- Một dòng ghi rõ "giả thuyết chưa kiểm chứng, sẽ kiểm trong pilot".
- Một dòng ghi rõ giới hạn: không chặn cuộc gọi, không chặn giao dịch.
- **Ghi điểm:** Khả thi 30% (mô hình tạo doanh thu) và điều kiện hợp lệ.

### Trang 1 – Vấn đề & khoảng trống (mục 2)
**Tiêu đề:** "Kẻ lừa đảo cần đúng một thứ: nạn nhân không kịp nghĩ và không kịp hỏi ai."
- Một cảnh dựng lại từ các mẫu thật, có ghi rõ là minh hoạ.
- Số liệu: Bộ Công an ~6.000 tỷ đồng trong 11 tháng đầu 2025; 14,2 triệu người 60+ (GSO 2024); 61,4% dùng Internet (NSO 2024).
- Khoảng trống: các công cụ hiện có chủ yếu chặn số hoặc gắn nhãn sau cuộc gọi. Ít công cụ nào can thiệp đúng lúc người dùng sắp chuyển tiền và nối họ với người thân.
- **Ghi điểm:** Phù hợp vấn đề & thị trường 20%.
- **Cắt:** bỏ GASA 442 tỷ USD và FTC +25% khỏi thân bài. Chúng là số liệu nước ngoài, làm loãng thông điệp. Đưa vào phụ lục nếu cần.

### Trang 2 – Khách hàng & thị trường (mục 3)
**Tiêu đề:** "Khách hàng trả tiền là con cháu, người hưởng lợi là cha mẹ, và ta bắt đầu từ 10.000 gia đình."
- Hai chân dung: người 60+ (người dùng) và con cháu 25–45 tuổi (người trả tiền, người nhận cảnh báo).
- Phễu TAM → SAM → SOM 10.000 gia đình, ghi rõ từng bước lọc.
- 3 kênh tiếp cận đầu tiên: hội người cao tuổi, trường học (qua học sinh), cộng đồng khu phố.
- Chỉ nên có số liệu nào dẫn được nguồn. Số nào là ước tính thì ghi "ước tính".
- **Ghi điểm:** Phù hợp thị trường 20%; Khả thi (quy mô).

### Trang 3 – Giải pháp: cách hoạt động (mục 4)
**Tiêu đề:** "Từ chạm đầu tiên đến cuộc gọi cho con: 4 bước, 60 giây."
- Luồng: "Đang bị ai gọi?" → chọn việc người gọi đòi → vài câu CÓ/KHÔNG (hoặc dán tin nhắn/link/ảnh) → mức rủi ro.
- 3 mức: Nguy hiểm cao / Nghi ngờ / Chưa thấy dấu hiệu rủi ro. Không có nhãn "An toàn".
- Mức cao: màn đỏ đếm 60 giây, báo tối đa 5 người thân, luôn có nút "Tôi ổn".
- 3–4 ảnh chụp màn hình thật của app. Phụ lục màn hình cũ hợp nhất vào đây.
- **Ghi điểm:** Sáng tạo 20%; Hình thức 10%.

### Trang 4 – Vì sao đáng tin (mục 4, phần 2)
**Tiêu đề:** "Luật cố định quyết định, AI chỉ nhặt tín hiệu, và chúng tôi nói trước những gì không làm."
- Kiến trúc: AI trích xuất tín hiệu, bộ luật 64 tín hiệu quyết định, nên có thể kiểm tra và giải thích được.
- Bằng chứng: app chạy thật (PWA + APK); 531 mẫu nội bộ, bắt 82,6%, báo nhầm 1,8%. Ghi thẳng trên slide: "bộ mẫu đã dùng để chỉnh luật, chưa kiểm độc lập".
- Quyền riêng tư: không lưu nội dung tin nhắn, người thân chỉ nhận cảnh báo.
- 4 cam kết "không": không chặn cuộc gọi, không chặn giao dịch, không hứa lấy lại tiền, không gắn nhãn "an toàn".
- **Ghi điểm:** Khả thi; Sáng tạo; phần phòng thủ khi tranh biện, vì tự nêu giới hạn trước làm giảm sức công kích của đối phương.

### Trang 5 – Phân tích cạnh tranh (mục 5)
**Tiêu đề:** "Công cụ hiện có chặn số hoặc gắn nhãn, còn Khoan Đã giữ người dùng lại đúng lúc họ sắp chuyển tiền."
- Bảng so sánh theo chức năng có thể kiểm chứng (chặn cuộc gọi, tra số, can thiệp lúc quyết định, báo người thân, thiết kế cho người cao tuổi, không cần quyền cuộc gọi). Mỗi ô ghi sự thật, không chấm điểm tự đánh giá.
- Nhóm đối thủ gián tiếp: cảnh báo của ngân hàng/ví, tuyên truyền của cơ quan chức năng, con cháu nhắc bằng miệng.
- Lợi thế có thể bị sao chép không? Nêu rõ: tính năng thì có, còn kho mẫu Việt Nam và cộng đồng gia đình thì khó. Thừa nhận phần nào dễ bị sao chép.
- **Ghi điểm:** Sáng tạo; Phù hợp thị trường.
- **Cắt:** bỏ cách chấm sao/✓✗ tự đánh giá cho Truecaller/Google/Scamio. Giám khảo sẽ hỏi "ai chấm?".

### Trang 6 – Đo lường tác động (mục 6)
**Tiêu đề:** "Chúng tôi đo việc người dùng thực sự làm, không đo số tiền mà chúng tôi không nhìn thấy."
- Khung chuỗi: đầu vào → đầu ra → kết quả → tác động.
- 6–8 chỉ số, mốc 3/6/12 tháng (chi tiết ở phần C).
- Dòng "giá trị saving" và cost avoidance chuyển về đây, dưới dạng ước tính có điều kiện.
- Ghi rõ cách chống tự thổi phồng.
- **Ghi điểm:** Tác động 20%; Khả thi.

### Trang 7 – Tài chính (mục 7)
**Tiêu đề:** "Khoảng 200 gia đình trả phí là bù được ngân sách vận hành 15 tháng."
- Ba kịch bản doanh thu (thận trọng/cơ sở/lạc quan), có giả định tỷ lệ chuyển đổi từ gia đình hoạt động sang gói Pro.
- Đơn giá, chi phí biến đổi (SMS/push, hạ tầng), điểm hoà vốn. Kiểm tra: 200 × 29k × 12 ≈ 69,6 triệu, khớp với ngân sách 68,8 triệu.
- Ghi rõ biến số nhạy cảm nhất là tỷ lệ chuyển đổi.
- **Ghi điểm:** Khả thi 30% (doanh thu, tài chính).
- **Cắt:** bỏ "mỗi vụ chặn tránh mất 21,5 triệu" khỏi vai trò lập luận hoà vốn chính. Đó là cost avoidance, không phải doanh thu. Chuyển sang slide tác động, dưới dạng giả định.

### Trang 8 – Nhu cầu vốn & kế hoạch huy động (mục 8)
**Tiêu đề:** "Cần khoảng 69 triệu đồng trong 15 tháng, chia 3 đợt, mỗi đợt gắn với một mốc chứng minh."
- Bảng 3 giai đoạn: số tiền, dùng vào đâu, mốc cần đạt.
- Nguồn theo thứ tự ưu tiên và điều kiện (chi tiết ở phần D).
- Giải thích vì sao chưa gọi vốn đầu tư: đội chưa có pháp nhân, chưa kiểm chứng giả thuyết.
- **Ghi điểm:** Khả thi (đảm bảo tài chính); lấp ô trống bị thiếu.

### Trang 9 – Lộ trình 15 tháng & mở rộng
**Tiêu đề:** "Mở rộng từng bước: kiểm thử độc lập trước, pilot cộng đồng sau, rồi mới tính chuyện ngân hàng."
- Gantt gọn 3 giai đoạn, mỗi giai đoạn có điều kiện "đi tiếp hay dừng".
- Phân công theo vai trò (không ghi tên người).
- Hướng mở rộng: người thân đã cài thì thêm người dùng; đối tác hội người cao tuổi; B2B sau khi có dữ liệu.
- **Ghi điểm:** Khả thi và khả năng mở rộng 30%.

### Trang 10 – Rủi ro & cách giảm
**Tiêu đề:** "Ba rủi ro lớn nhất, và việc chúng tôi làm để không trở thành một trong số đó."
- Rủi ro báo nhầm/bỏ sót: kiểm thử độc lập, theo dõi báo nhầm, luôn có lối thoát.
- Rủi ro dữ liệu cá nhân và pháp lý: không lưu nội dung, đối chiếu quy định bảo vệ dữ liệu cá nhân **[cần xác minh văn bản hiện hành]**.
- Rủi ro người dùng ỷ lại vì tưởng app "bảo vệ hoàn toàn": thông điệp "chưa thấy dấu hiệu ≠ an toàn".
- Rủi ro đội vị thành niên: pháp nhân bảo trợ, người giám hộ.
- **Ghi điểm:** Khả thi; phòng thủ khi tranh biện.

### Phụ lục (1 slide, tự đủ nội dung trên slide)
- Công thức tính chính (hoà vốn, cost avoidance), nguồn số liệu dạng danh sách ngắn (tên nguồn, năm, không link). Chữ nhỏ nhưng phải đọc được.

### Bảng CẮT/GỘP từ v6 (17 trang)

| v6 | Xử lý | Vì sao |
|---|---|---|
| Business Model | Giữ, đưa lên đầu, không tính trang | Bắt buộc |
| Vấn đề, Khách hàng, Thị trường | Gộp thành trang 1 + 2 | Tách vấn đề và khách hàng, bỏ trùng |
| Giải pháp, Giá trị saving | Giải pháp tách thành trang 3 + 4; saving gộp vào trang 6 | Saving là hệ quả, không cần slide riêng |
| Cạnh tranh | Giữ (trang 5), bỏ chấm điểm tự đánh giá | Giảm điểm yếu khi tranh biện |
| Cost avoidance | Gộp vào trang 6 | Là chỉ số tác động, không phải tài chính |
| Tài chính | Giữ (trang 7), tách rõ doanh thu và cost avoidance | Điểm mạnh nhất của Khả thi |
| Triển khai | Trang 9 | Giữ |
| Rủi ro | Trang 10 | Giữ |
| Cảm ơn | Cắt | Không ghi điểm, chiếm slide |
| 4 phụ lục | Còn 1: cách tính + nguồn | Đề cho tối đa 1 |
| Phụ lục Đội ngũ có TÊN | Cắt hoàn toàn | Vi phạm quy định |
| Phụ lục Màn hình | Chuyển vào trang 3 | Màn hình là bằng chứng giải pháp |
| Dòng nháp "cần kiểm lại" | Xoá | Mất chuyên nghiệp |
| "mọi thao tác chuyển tiền được tạm dừng" | Sửa thành "chúng tôi không chặn giao dịch; chỉ tạo một khoảng dừng để người dùng tự quyết định" | Trái nguyên tắc tự đặt, dễ bị tranh biện bắt lỗi |
| MỚI: Đo lường tác động; Nhu cầu vốn | Trang 6 và 8 | Hai mục bắt buộc đang thiếu |

---

## B) KHUNG "SAVING FOR THE FUTURE"

### Ba cách đóng khung

**Cách 1 – "Sáu mươi giây bị bỏ ngỏ".** Khoảng thời gian giữa lúc nghe cuộc gọi và lúc chuyển tiền là nguồn lực không ai quản lý. Kẻ lừa đảo khai thác nó để ép quyết định, còn Khoan Đã biến nó thành thời gian suy nghĩ.
- **Mạnh:** cụ thể, có thể đo (số lần dừng đủ 60s), khớp slogan, khớp bản chất sản phẩm, và không phải gượng ép.
- **Yếu:** nghe hơi "nhỏ" so với chủ đề năng lượng/xanh.

**Cách 2 – "Tiền tích luỹ cả đời của người cao tuổi".** Cái được bảo toàn là tài sản tích luỹ nhiều thập kỷ.
- **Mạnh:** dễ chạm cảm xúc.
- **Yếu:** đội không thấy giao dịch, nên chứng minh "đã giữ lại bao nhiêu tiền" rất khó và dễ bị bắt bẻ.

**Cách 3 – "Dữ liệu mẫu lừa đảo cộng đồng" + niềm tin gia đình.** Tri thức về thủ đoạn đang nằm rải rác trong từng gia đình và từng nạn nhân. Gom lại thành kho mẫu dùng chung, kết hợp mạng lưới người thân.
- **Mạnh:** có tính tích luỹ và mở rộng dài hạn.
- **Yếu:** chưa đủ sức làm trục chính. Kho mẫu còn nhỏ (531 mẫu) và ý nghĩa sẽ rõ hơn khi có dữ liệu thật.

### Chọn cách nào

**Chọn Cách 1 làm trục, và dùng Cách 2 và 3 làm hệ quả.** Câu chủ đạo:

> "Nguồn lực bị bỏ ngỏ là 60 giây trước khi chuyển tiền. Khi giữ được 60 giây ấy, ta giữ được khoản tiền tích luỹ cả đời, và mỗi mẫu lừa đảo được gặp lại thành tri thức chung."

Lý do chọn: Cách 1 là điều đội làm được và đo được. Hai cách còn lại cần dữ liệu mà đội chưa có.

### Nối trung thực với Luật 110/2025/QH15 và "kỷ nguyên xanh"

- **Đừng nói** dự án "thực thi" hay "tuân thủ" Luật 110. Luật chủ yếu nói về tiết kiệm, chống lãng phí trong quản lý và sử dụng nguồn lực công, tài sản, tài nguyên, thời gian. Hãy đối chiếu điều khoản cụ thể trước khi trích dẫn bất cứ điều nào **[cần xác minh]**.
- **Có thể nói:** tinh thần "tiết kiệm, chống lãng phí" cũng áp dụng cho nguồn lực xã hội. Khoản tiền bị lừa mất là nguồn lực quốc gia thất thoát (~6.000 tỷ trong 11 tháng đầu 2025), cộng thêm chi phí điều tra, xử lý hậu quả. Phòng ngừa từ đầu rẻ hơn xử lý sau.
- **"Xanh":** đừng gượng ép nói giảm CO₂ hay năng lượng, vì không thật. Nếu BTC hay đối thủ hỏi, câu trả lời trung thực là: "Chúng tôi hiểu 'xanh' là bền vững và bao trùm, tức là chuyển đổi số mà người cao tuổi không bị bỏ lại hay mất tài sản. Dự án không có đóng góp trực tiếp về năng lượng và chúng tôi không tuyên bố điều đó."
- Có thể nhắc thêm một dòng: thay vì xử lý hậu quả, phòng ngừa giúp tiết kiệm chi phí cho gia đình và xã hội. Đây là lập luận về hiệu quả sử dụng nguồn lực, không phải lập luận xanh.

---

## C) ĐO LƯỜNG TÁC ĐỘNG

### Khung đo

| Tầng | Ý nghĩa | Ví dụ trong dự án |
|---|---|---|
| Đầu vào | Nguồn lực bỏ ra | Số gia đình cài, số buổi hướng dẫn, ngân sách |
| Đầu ra | Điều app thực sự làm | Số lần hiện màn đỏ, số lần đếm đủ 60s |
| Kết quả | Hành vi thay đổi | % gọi người thân, % dừng chuyển tiền (tự báo cáo), điểm nhận diện lừa đảo |
| Tác động | Lợi ích dài hạn | Giảm thiệt hại ước tính (có điều kiện), tăng tự tin dùng dịch vụ số |

Điểm cốt lõi: đội không thấy giao dịch ngân hàng. Vì vậy tác động tài chính chỉ là **ước tính có điều kiện**, dựa trên hành vi đo được và khảo sát tự báo cáo.

### 8 chỉ số cụ thể

| # | Chỉ số | Cách đo | Tầng |
|---|---|---|---|
| 1 | Số lần màn đỏ được kích hoạt / người dùng hoạt động / tháng | Sự kiện ẩn danh trong app (chỉ đếm, không lưu nội dung) | Đầu ra |
| 2 | % lần đếm đủ 60s (không thoát sớm) | Sự kiện: bắt đầu đếm vs. kết thúc đếm | Đầu ra |
| 3 | % bấm "Tôi ổn" | Sự kiện nút. Hỏi thêm 1 chạm tuỳ chọn: "Cảnh báo này có đúng không?" để phân biệt người tự tin với báo nhầm | Đầu ra / chất lượng |
| 4 | % cảnh báo mà người thân mở trong 5 phút; % người dùng bấm gọi người thân | Sự kiện: thông báo gửi/mở; nút gọi | Kết quả |
| 5 | % người dùng tự báo "đã không chuyển tiền sau khi dùng Khoan Đã" | Hỏi 1 câu sau mỗi lần màn đỏ (tuỳ chọn); khảo sát gọi điện cho mẫu nhỏ có đồng ý | Kết quả |
| 6 | Điểm nhận diện lừa đảo trước/sau | Bài 8 tình huống ngắn, làm trước khi dùng và sau 4–6 tuần, so sánh cặp cùng người | Kết quả |
| 7 | Số gia đình kích hoạt đủ ít nhất 1 người thân + giữ chân 30 ngày | Dữ liệu tài khoản | Đầu vào / kết quả |
| 8 | Tỷ lệ báo nhầm do người dùng gắn cờ + độ chính xác trên bộ mẫu độc lập | Nút "Báo sai"; bộ mẫu kiểm thử giữ riêng, chưa dùng chỉnh luật | Chất lượng |

**Chỉ số ước tính thiệt hại tránh được (tầng tác động):** dùng số vụ người dùng tự khai đã dừng, nhân với khoảng giá trị tham chiếu (đừng dùng một con số 20 triệu duy nhất), nhân thêm hệ số quy cho app. Vì không có nhóm đối chứng, đặt hệ số khiêm tốn, ví dụ 30–50% **[giả định của đội, nêu rõ]**. Luôn trình bày dạng khoảng, không dạng một con số.

### Mốc theo thời gian (là mục tiêu, không phải cam kết)

| Mốc | Quy mô | Chất lượng | Hành vi |
|---|---|---|---|
| 3 tháng | Pilot 100–200 gia đình; ≥30 phản hồi khảo sát | Kiểm thử độc lập đầu tiên trên bộ mẫu giữ riêng; công bố kết quả dù thấp | Đo được chỉ số 1–4 ổn định |
| 6 tháng | ~1.000 gia đình | Báo nhầm có quy trình theo dõi | Khảo sát trước/sau trên ≥100 người; có số đầu tiên cho chỉ số 5–6 |
| 12 tháng | 3.000–5.000 gia đình (thấp hơn SOM 10.000) | Kiểm thử độc lập lần 2 | Ước tính tác động dạng khoảng; xét chuyển đổi sang Pro (kiểm tra con số hoà vốn ~200 gia đình) |

SOM 10.000 gia đình trong 15 tháng khá tham vọng cho một đội chưa có pháp nhân. Mốc 12 tháng nên đặt thấp hơn SOM, để giám khảo thấy đội biết phân biệt thị trường tiềm năng và mục tiêu thực.

### Cách tránh tự thổi phồng

1. **Đăng ký chỉ số trước** (ghi trên slide: định nghĩa, mẫu số, cách đo) để không đổi cách tính khi kết quả không đẹp.
2. **Tách rõ** "đo được" (đầu ra), "tự báo cáo" (kết quả), "ước tính" (tác động). Ghi nhãn bên cạnh từng con số.
3. **Không dùng** 82,6% như độ chính xác ngoài thực tế. Nó là kết quả nội bộ trên bộ mẫu đã dùng chỉnh luật, nên gọi là "chặn trên", rồi báo cáo số kiểm thử độc lập khi có.
4. **Công bố cả số xấu:** báo nhầm, tỷ lệ bấm "Tôi ổn", người dùng rời đi.
5. **Hệ số quy cho app** thấp hơn mức bạn tin, vì không có đối chứng.
6. **Nhờ bên thứ ba** (hội người cao tuổi, trường, mentor) xem lại phương pháp khảo sát.
7. **Đạo đức dữ liệu:** có đồng ý rõ ràng của người dùng, không thu thông tin nhận dạng không cần thiết; với đội vị thành niên, nên có người giám hộ hoặc pháp nhân bảo trợ đứng sau.

---

## D) NHU CẦU VỐN & HUY ĐỘNG VỐN

### Số tiền theo giai đoạn

Giữ tổng khoảng 69 triệu đồng cho 15 tháng, khớp ngân sách hiện có. Điều chỉnh lại cơ cấu: hiện 61% dành cho truyền thông (~42 triệu) là quá nặng cho một dự án cần chứng minh tác động và kiểm chứng. Giám khảo sẽ hỏi vì sao đa số tiền đi vào quảng cáo.

**Đề xuất cơ cấu lại 68,8 triệu:**

| Hạng mục | Số tiền (triệu đ) | Tỷ lệ | Ghi chú |
|---|---|---|---|
| Truyền thông & tiếp cận cộng đồng | 20,0 | 29% | Giảm từ ~42 triệu, ưu tiên kênh miễn phí/hợp tác |
| Pilot cộng đồng (buổi hướng dẫn, in ấn, đi lại) | 14,0 | 20% | Gắn với hội người cao tuổi, trường học |
| Hạ tầng & vận hành (cloud, thông báo, tài khoản phát hành app) | 9,0 | 13% | |
| Kiểm thử độc lập & mở rộng kho mẫu | 8,0 | 12% | Cải thiện độ tin cậy |
| Dự phòng | 7,8 | 11% | |
| Pháp lý & bảo mật dữ liệu | 6,0 | 9% | Tư vấn quy định dữ liệu cá nhân |
| Khảo sát & đánh giá tác động | 4,0 | 6% | |
| **Tổng** | **68,8** | **100%** | |

**Chia 3 đợt gắn với mốc:**

| Giai đoạn | Số tiền | Mục tiêu giải ngân | Mốc để mở đợt tiếp |
|---|---|---|---|
| Đợt 1 (tháng 0–3) | ~20 triệu | Kiểm thử độc lập, pháp lý, pilot 100–200 gia đình | Có kết quả kiểm thử độc lập, ≥30 phản hồi |
| Đợt 2 (tháng 3–9) | ~28 triệu | Mở rộng pilot ~1.000 gia đình, khảo sát trước/sau | Số liệu hành vi đủ ổn định, giữ chân 30 ngày đạt mục tiêu |
| Đợt 3 (tháng 9–15) | ~20 triệu | Mở rộng, thử thu phí Pro | Có số đầu tiên về chuyển đổi trả phí |

Giai đoạn sau 15 tháng (cần pháp nhân, vốn lớn hơn, mở rộng B2B) chưa nên đưa số cụ thể vào hồ sơ. Chỉ nói rõ điều kiện kích hoạt.

### Nguồn vốn khả thi tại Việt Nam, theo thứ tự ưu tiên

Tôi không nêu tên quỹ cụ thể nếu không chắc. Với mọi nguồn, hãy kiểm tra điều kiện thực tế, đặc biệt giới hạn độ tuổi người nhận.

| # | Nguồn | Phù hợp vì | Điều kiện / rủi ro |
|---|---|---|---|
| 1 | **Giải thưởng cuộc thi** (ĐTKN và các cuộc thi khởi nghiệp học sinh/sinh viên) | Không cần pháp nhân, không pha loãng vốn, và có uy tín cho vòng sau | Số tiền không chắc chắn, thường thấp; giá trị giải ĐTKN **[cần xác minh]**. Chỉ giải quyết đợt 1 |
| 2 | **Người giám hộ/gia đình góp vốn** | Nhanh, ít thủ tục nhất | Nên ghi là hỗ trợ hoặc cho mượn có văn bản, tránh hứa chia lợi nhuận. Đội vị thành niên chưa tự ký hợp đồng được. Rủi ro: lẫn lộn tài chính gia đình với dự án |
| 3 | **Pháp nhân bảo trợ** (trường, CLB, tổ chức phi lợi nhuận, doanh nghiệp xã hội đồng ý đứng ra) | Giải quyết vấn đề chưa có pháp nhân: nhận tiền, ký thoả thuận, đứng tên pilot | Cần thoả thuận rõ quyền sở hữu sản phẩm và vai trò. Rủi ro: tổ chức bảo trợ đòi quyền kiểm soát; cần luật sư xem trước **[cần xác minh]** |
| 4 | **Hội người cao tuổi, Đoàn/Hội, tổ chức phi lợi nhuận** | Phù hợp nhất cho pilot: họ có kênh tiếp cận. Dạng hỗ trợ thường là hiện vật (địa điểm, người tổ chức), ít khi là tiền mặt | Cần thư ngỏ ý hợp tác, quy trình nội bộ chậm; không nên chờ họ trả tiền |
| 5 | **Chương trình CSR/phòng chống lừa đảo của ngân hàng** | Ngân hàng đang truyền thông chống lừa đảo, có động cơ hợp tác | Rủi ro xung đột lợi ích (đội muốn độc lập), yêu cầu tuân thủ, tốc độ chậm. Phù hợp hơn ở giai đoạn sau, khi đã có số liệu pilot |
| 6 | **Quỹ/chương trình ươm tạo khởi nghiệp** | Hỗ trợ cố vấn, đôi khi có tiền | Nhiều chương trình yêu cầu pháp nhân hoặc độ tuổi tối thiểu; cần xác minh điều kiện từng chương trình trước khi nộp **[cần xác minh]**. Không nên đưa tên cụ thể vào hồ sơ khi chưa chắc |
| 7 | **Crowdfunding cộng đồng** | Có thể tạo cộng đồng ủng hộ | Khung pháp lý tại Việt Nam chưa rõ ràng cho nhiều hình thức; đội vị thành niên khó đứng tên; rủi ro uy tín nếu quản lý quỹ không minh bạch **[cần xác minh]**. Hoãn đến khi có pháp nhân |

**Không nên gọi vốn cổ phần (angel/VC) ở giai đoạn này.** Đội chưa có pháp nhân, chưa kiểm chứng giả thuyết, và đội dưới 18 tuổi sẽ vướng điều kiện pháp lý. Slide nên nói rõ: "Chúng tôi chủ động không gọi vốn cổ phần trước khi có pháp nhân và dữ liệu pilot". Điều đó thể hiện sự trưởng thành, không phải điểm yếu.

**Về pháp nhân:** hãy hỏi luật sư hoặc mentor về điều kiện thành lập doanh nghiệp/hộ kinh doanh cho người dưới 18 tuổi và vai trò của người giám hộ **[cần xác minh]**. Slide chỉ cần cho thấy đội biết rủi ro này và có phương án (pháp nhân bảo trợ ngay, tự lập khi đủ điều kiện).

---

## E) KỊCH BẢN PITCH 3 PHÚT (~410 từ)

**[0:00–0:30] Mở bằng một khoảnh khắc**
"Ba giờ chiều. Điện thoại của một bà cụ reo: 'Tôi là công an. Tài khoản bà dính đường dây rửa tiền. Chuyển tiền ngay, đừng nói với ai.' Tim bà đập nhanh, ngón tay đã mở app ngân hàng. Con gái bà ở cách đó mười cây số, nhưng không ai biết chuyện này. Đây là tình huống chúng em dựng lại từ các mẫu lừa đảo có thật. Thứ kẻ lừa đảo cần nhất là bà không kịp nghĩ."

**[0:30–1:00] Vấn đề**
"Bộ Công an ghi nhận khoảng 6.000 tỷ đồng bị lừa mất trong 11 tháng đầu năm 2025. Việt Nam có 14,2 triệu người trên 60 tuổi, hơn 61% đã dùng Internet. Họ có tiền tích luỹ cả đời, nhưng thiếu sáu mươi giây bình tĩnh và một người để hỏi. Đó là nguồn lực đang bị bỏ ngỏ."

**[1:00–1:50] Giải pháp**
"Chúng em làm Khoan Đã. Bà bấm 'Đang bị ai gọi?', chọn việc người kia đòi, trả lời vài câu có hoặc không. Một bộ luật cố định với 64 tín hiệu, không phải AI đoán mò, quyết định mức rủi ro. Nếu nguy hiểm cao, màn hình đỏ đếm sáu mươi giây, báo tới tối đa năm người thân, và bà gọi con một chạm. Bà luôn có nút 'Tôi ổn' để thoát. Chúng em không bao giờ gắn nhãn 'an toàn', không chặn giao dịch, không lưu nội dung tin nhắn."

**[1:50–2:25] Bằng chứng & mô hình**
"App đã chạy thật trên web và Android. Thử nội bộ trên 531 mẫu, bắt 82,6%, báo nhầm 1,8%. Chúng em nói thẳng: bộ mẫu này đã dùng để chỉnh luật, nên việc đầu tiên là kiểm thử độc lập. Người cao tuổi dùng miễn phí, con cháu trả gói gia đình từ 29 nghìn đồng một tháng. Khoảng hai trăm gia đình trả phí là xấp xỉ bù được ngân sách mười lăm tháng."

**[2:25–2:50] Tác động**
"Chúng em đo việc có thật: bao nhiêu lần người dùng dừng đủ sáu mươi giây, bao nhiêu lần gọi người thân, và khảo sát trước sau khi dùng. Mục tiêu mười hai tháng là ba đến năm nghìn gia đình, và chúng em sẽ công bố cả số xấu."

**[2:50–3:00] Kêu gọi**
"Chúng em cần ba điều: một đơn vị bảo trợ pháp lý, hội người cao tuổi để thử cùng bà con, và một đối tác kiểm thử độc lập. Xin cùng chúng em tạo một khoảng dừng, trước khi quá muộn."

**Lưu ý khi tập:** đọc thử bấm giờ; nếu vượt 3:00 thì cắt đoạn "Tác động" xuống một câu. Không nhắc tên thành viên. Nên chuẩn bị sẵn câu trả lời cho: "531 mẫu đã dùng chỉnh luật thì 82,6% có nghĩa gì?", "Làm sao biết app giữ được tiền khi không thấy giao dịch?", "Vì sao con cháu phải trả tiền?".

---

## F) ĐIỂM KHÁC BIỆT NÊN NHẤN VÀ ĐIỂM NÊN GIẢM NHẸ

### 5 điểm khác biệt có thật

1. **Luật cố định quyết định, AI chỉ trích xuất tín hiệu.** Giải thích được, kiểm tra được, ít rủi ro AI "bịa" mức cảnh báo. Đây là câu trả lời tốt cho mọi câu hỏi về độ tin cậy.
2. **Không bao giờ có nhãn "An toàn".** "Chưa thấy dấu hiệu rủi ro" khác "an toàn". Điều này tránh ảo giác an toàn nguy hiểm hơn cả việc không có app.
3. **Luôn có lối thoát "Tôi ổn".** Tôn trọng quyền tự quyết của người cao tuổi, không biến app thành công cụ kiểm soát.
4. **Can thiệp đúng lúc quyết định, kèm nối với người thân một chạm.** Giá trị nằm ở khoảng dừng và kết nối, không phải ở việc chặn.
5. **Tự đặt giới hạn công khai** (không chặn cuộc gọi, không chặn giao dịch, không hứa lấy lại tiền, không lưu nội dung, không quy kết cá nhân). Hiếm đội nào làm vậy. Nó biến điểm yếu thành uy tín, và rất hợp với phần phòng thủ (25%).

### 3 điểm nên ẩn hoặc giảm nhẹ

"Giảm nhẹ" nghĩa là không đặt làm lập luận chính, không phải giấu. Nếu bị hỏi thì phải trả lời thẳng.

1. **Con số cost avoidance 21,5 triệu/vụ.** Đó là giả định, không phải doanh thu và không có đối chứng. Giữ ở phụ lục và slide tác động dưới dạng khoảng, đừng dùng làm lập luận hoà vốn chính.
2. **Bảng tự chấm so sánh với Truecaller/Google/Scamio.** Dễ bị hỏi "ai chấm, tiêu chí nào?". Thay bằng bảng chức năng khách quan.
3. **Doanh thu B2B với ngân hàng/ví như một nguồn thu gần hạn, và cơ cấu ngân sách 61% truyền thông.** B2B chưa có đối tác hay thử nghiệm nào, và khoản truyền thông lớn làm yếu thông điệp "hiệu quả sử dụng nguồn lực". Trình bày B2B là hướng sau khi có dữ liệu, và cơ cấu lại ngân sách như ở phần D.

**Điều không được giảm nhẹ:** việc 531 mẫu đã dùng để chỉnh luật và 82,6% chưa kiểm độc lập. Hãy tự nói trước. Giám khảo khó tính sẽ hỏi ngay, và tự nêu trước sẽ được điểm hơn bị bắt lỗi.

---

**Việc nên làm theo thứ tự trước hạn 13/11 23h00:** (1) sửa các vi phạm hình thức (phụ lục, tên thành viên, dòng nháp, câu "tạm dừng giao dịch"); (2) viết trang 6 và 8, vì đây là hai mục bắt buộc còn thiếu; (3) cơ cấu lại trang 7 để tách doanh thu khỏi cost avoidance; (4) kiểm tra PDF ≤10MB và đúng tên file; (5) nộp sớm, vì chỉ nhận lần đầu và không sửa sau khi nộp.
