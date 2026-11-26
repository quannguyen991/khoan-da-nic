# Phương án Deal vòng 3 — để đội cân nhắc

Ngày 19/11/2026. Tổng hợp từ hai nguồn độc lập: agent Claude (có tra cứu web) và Codex CLI (có tra cứu web).
Gemini CLI không chạy được (hết hạn mức miễn phí, báo thử lại sau khoảng 16 giờ).

**Mọi con số X, Y, post-money, xác suất dưới đây là giả định hoặc phán đoán, không phải số đo.**
Deal ở vòng này chỉ mang tính giả định theo luật chơi, không phải phát hành cổ phần thật.

## 0. Hai việc cần làm ngay, không phụ thuộc phương án

1. **Hỏi Ban Tổ chức về điểm mâu thuẫn trong đề.** Trang 3 viết quán quân là đội có "tổng giá trị đầu tư giả định cao nhất"; trang 6 viết quán quân là đội có "Post-money Valuation cao nhất". Hai cách xếp hạng cho chiến lược ngược nhau. Hỏi qua fanpage hoặc hotline trước 28/11/2026 (hạn nhận yêu cầu); BTC cam kết phản hồi trong 1 giờ.
2. **Nộp bài trước 22h30 ngày 26/11/2026** (đề yêu cầu nộp sớm tối thiểu 30 phút so với 23h00). Tên file: `[ĐTKN2026]_V3_[Tên đội]_Proposal`.

## 1. Công thức

Post-money = tổng tiền đầu tư ÷ tổng % cổ phần trao (tất cả Deal thành công); tổng % phải nhỏ hơn 50%; không chốt được Deal nào trong 3 phút thì kết quả = 0.
Post-money là một TỶ LỆ: 600 triệu/5%, 1,2 tỷ/10% và 3 tỷ/25% đều cho 12 tỷ. Quy mô X, Y quyết định Shark có dám gật không và còn chỗ để counter không.
Counter-offer gần như luôn làm post-money giảm (đòi thêm % hoặc cắt tiền). Nhận thêm một Deal có định giá ngầm thấp hơn mức hiện tại sẽ kéo post-money tổng xuống.

## 2. Hai trường phái, khác nhau rất xa

| | Claude agent | Codex |
|---|---|---|
| Neo vào đâu | Dải pre-seed Việt Nam/ASEAN (blog, Equidam) | Ngân sách đã nộp 68,8 triệu |
| Phương án chính | **1,5 tỷ cho 12%** → post-money **12,5 tỷ** | **68,8 triệu cho 2%** → post-money **3,44 tỷ** |
| Mở thấp | 700 triệu / 10% → 7 tỷ | 68,8 triệu / 5% → 1,376 tỷ |
| Mở cao | 3 tỷ / 15% → 20 tỷ; 5 tỷ / 15% → 33,3 tỷ (không khuyên) | 68,8 triệu / 1% → 6,88 tỷ (khó bảo vệ) |
| Giá sàn | 600 triệu, tối đa 20%, post tối thiểu 6 tỷ | 68,8 triệu, tối đa 6%, post tối thiểu ≈ 1,147 tỷ |
| Cần ngân sách mới? | Có: kế hoạch dùng 1,5 tỷ cho 18 tháng (chưa có báo giá) | Không: dùng đúng ngân sách đã nộp |
| Rủi ro chính | Bị coi là phóng đại vì chưa doanh thu, chưa thử thực địa | Điểm thấp nếu luật xếp theo post-money |

Cả hai đồng ý: không nên hỏi mức cao nhất; không có dữ liệu để ước lượng chắc xác suất bị Băng giá (con số 10%–65% của Claude agent là phán đoán).

### Năm phương án của Claude agent (phán đoán, không phải số đo)

| # | Câu công bố | Post-money | Xác suất Băng giá (phán đoán) | Sàn (tiền, %, post) |
|---|---|---|---|---|
| 1 | 300 triệu / 10% | 3 tỷ | ~10% | 150 triệu, 15%, 1,5 tỷ |
| 2 | 700 triệu / 10% | 7 tỷ | ~15–20% | 350 triệu, 15%, 3,5 tỷ |
| 3 | 1,5 tỷ / 12% | 12,5 tỷ | ~25–30% | 600 triệu, 20%, 6 tỷ |
| 4 | 3 tỷ / 15% | 20 tỷ | ~45% | 1,2 tỷ, 22%, 8 tỷ |
| 5 | 5 tỷ / 15% | 33,3 tỷ | ~60–65% | 2 tỷ, 25%, 10 tỷ |

Khung biện minh định giá (Claude agent): chi phí thay thế (5 người, hơn ba tháng làm liên tục, APK, 64 tín hiệu, 1.711 bài kiểm thử), mốc so sánh pre-seed, kịch bản thu nhập (kịch bản cơ sở 62,6 triệu/năm vẫn nhỏ hơn 1,5 tỷ, nên chân tài trợ nhóm và B2B2C phải gánh luận điểm, mà hai chân này chưa có thư ý định).

### Nguồn số liệu ngoài (đã nêu trong báo cáo của hai bên; chưa mở lại từng trang)

- Equidam (nền tảng định giá): trung vị pre-seed toàn cầu H2/2025 khoảng 5,61 triệu USD; riêng Đông Nam Á H1/2026 trung bình khoảng 3,84 triệu USD, pha loãng hàm ý khoảng 12,9%. Đây là số liệu của người dùng nền tảng, không phải giá giao dịch đã đóng, không đại diện Việt Nam.
- Carta (Mỹ): pha loãng trung vị vòng seed khoảng 20% (Q4/2024). Không phải chuẩn Việt Nam.
- NIC/VPCA/BCG: 57 giao dịch công nghệ ≤ 500.000 USD tại Việt Nam năm 2024 (thống kê số giao dịch, không phải định giá).
- Hai bên đều KHÔNG xác minh được mức định giá giao dịch Việt Nam riêng cho startup chưa doanh thu.

## 3. Đàm phán 3 phút (điểm chung)

- Mở bằng một câu rõ: "Theo luật chơi giả định, chúng tôi gọi X VNĐ cho Y% cổ phần, post-money giả định là Z."
- Khi bị counter: ghi tổng tiền và tổng % của mọi Shark rồi tính lại X ÷ Y trước khi gật.
- Chỉ nhận thêm Shark/Syndicate nếu định giá ngầm không thấp hơn post-money hiện tại.
- Còn khoảng 45 giây mà chưa có Deal thì gật Deal tốt nhất đang có (kể cả dưới sàn), vì kết quả 0 tệ hơn mọi Deal.
- Câu giữ trung thực: "Đây là mức chào theo luật chơi để tài trợ các mốc kiểm chứng, không phải chúng em tuyên bố đã có định giá thị trường."

## 4. Rủi ro Shark sẽ nhắm (hai bên trùng nhau)

- Chưa doanh thu, chưa thử thực địa, chưa khảo sát khách hàng; người trả tiền (con cháu) chưa được hỏi.
- Bộ đo 82,6% đã dùng để chỉnh luật, đo trên bản 1.6.1, chưa kiểm độc lập.
- Đội dưới 18 tuổi, chưa pháp nhân: ai nắm cổ phần, ai chịu trách nhiệm. Câu trả lời an toàn: Deal chỉ là giả định; cổ phần thật chỉ phát hành sau khi có pháp nhân do người lớn đại diện và có tư vấn pháp lý.
- Ngân hàng tự làm (SIMO, cảnh báo giao dịch): Khoan Đã chỉ bổ sung ở khoảng dừng trước khi mở app ngân hàng và liên hệ người thân.
- Dữ liệu cá nhân (Luật 91/2025/QH15, hiệu lực 01/01/2026): nội dung gửi lên máy chủ để phân tích, "không ghi vào kho" khác với "không xử lý dữ liệu".
- Codex đề nghị bỏ số SAM 5,4 triệu (nhân tỷ lệ đô thị toàn dân với số người 60+ là phép tính thô).
