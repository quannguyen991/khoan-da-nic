# Chấm lại bản v9 (21/11/2026)

Cùng prompt với các lần trước (`prompt-v9.txt`, gốc `prompt-regrade.txt`). Giám khảo là AI, không phải Shark thật; điểm chỉ để so sánh giữa các bản.

| Giám khảo | Bản v8 (sau sửa) | Bản v9 | Shark AI tự chào |
|---|---:|---:|---|
| Haiku | 56 | 60 | 200 triệu / 25% (0,8 tỷ) |
| Sonnet | 62 | 62 | 300 triệu / 20% (1,5 tỷ); 400 triệu nếu 25–30% |
| Codex | 57 | 58 | 80 triệu / 20% (0,4 tỷ) |
| Trung bình | 58,3 | 60,0 | |

Cả ba vẫn không nhận 400 triệu / 10%. Lý do chung: chưa có người dùng, doanh thu, pháp nhân.

## Đã sửa sau lượt chấm này (chưa chấm lại)
- Trang 4: nói rõ "AI trên máy chủ nhận tín hiệu; bộ luật 64 tín hiệu ra mức" (cả ba giám khảo chỉ ra điểm mâu thuẫn).
- Trang 5: "gần ba tháng" thay cho "hơn ba tháng" (15/8–12/11 là 89 ngày).
- Trang 9: thay ô "≈ 12×" bằng ô "70% doanh thu T18 đến từ tài trợ nhóm, chưa có thư ý định"; thêm độ nhạy 3% trả phí (≈ 28 tháng hoàn vốn); ghi rõ mô hình dùng giá thấp 29.000 đ. Bội số định giá chuyển xuống phụ lục.
- Trang 11: thêm rủi ro quyền Android; nói rõ nội dung gửi máy chủ để phân tích, không lưu.
- Trang 2: ghi chú số A05 và số Bộ Công an có thể khác phạm vi tính.
- Phụ lục: SAM ghi rõ giả định tỷ lệ thành thị của người 60+ bằng toàn dân.

## Chỉ đội làm được (cả ba giám khảo cùng nêu, là chỗ mất điểm lớn nhất)
1. Phỏng vấn 5–10 con cháu và 3–5 người 60+, ghi n thật.
2. Cho người 60+ thử luồng giả lập có giám sát.
3. Xin 1–2 thư bày tỏ quan tâm từ hội hoặc trường (tài trợ nhóm đang là 70% doanh thu kịch bản).
4. Đo lại bộ luật 1.6.4; nhờ người ngoài viết 30–50 tin mới chưa dùng để chỉnh luật.
5. Xin báo giá cho các khoản chi lớn.

## Lượt 2 (v9b, 21/11/2026, sau khi thêm bằng chứng)

Thêm: số đo ngoài mẫu (70 tin Codex soạn, luật chưa chỉnh theo: 37/40 báo đỏ, 0 bỏ sót, 0/30 báo nhầm); đo lại bộ chính trên luật 1.6.4 với AI Qwen 3.8 flash (DeepSeek đã ngừng trên ai-box); thí nghiệm Nottingham 22% → 4%; FBI IC3 người 60+; tham chiếu EverSafe, Truecaller, Carefull; giả thuyết H1–H3 có tiêu chí đạt.

| Giám khảo | v8 | v9 | v9b | Shark AI chào (v9b) |
|---|---:|---:|---:|---|
| Haiku | 56 | 60 | 56 | 200 triệu / 30% |
| Sonnet | 62 | 62 | 62 | **300 triệu / 10–12% (2,5–3 tỷ)**; nếu đội giữ 400/10% thì counter 400/15% |
| Codex | 57 | 58 | 63 | 80 triệu / 20%, chỉ cho Cổng 1 |
| Trung bình | 58,3 | 60,0 | 60,3 | |

Sau v9b đã sửa thêm (chưa chấm lại): trang 6 viết lại câu "đúng đề"; trang 10 ghi rõ cổ phần theo tiền đã giải ngân nếu dừng ở cổng.
Kết luận: phần chữ đã gần trần. Haiku dao động ±4 điểm giữa các lượt. Điểm chỉ lên rõ khi có khảo sát và thử luồng thật (`khao-sat/`).

## Lượt 3 (v9c, 21/11/2026, sau khi vá luật 1.6.5)

Thêm: SOM tính theo người lẫn hộ; đề cương thử nghiệm 30 người (chia ngẫu nhiên, người ghi không biết nhóm, tiêu chí đạt 20 điểm %); bảng doanh thu theo mốc T3–T18 ở phụ lục; đo trên 31 tin lừa có thật do báo chí trích (`eval/bao-chi`), lộ lỗ hổng, vá thành luật 1.6.5 (tin nặng bị sót 7/14 → 2/14, báo nhầm bộ chính giữ 8/169).

| Giám khảo | v8 | v9 | v9b | v9c | Shark AI chào (v9c) |
|---|---:|---:|---:|---:|---|
| Sonnet | 62 | 62 | 62 | **67** | 200 triệu / 10% (2 tỷ), giải ngân 80 triệu trước theo cổng |
| Codex | 57 | 58 | 63 | 63 | 80 triệu / 5% |

Codex bắt lỗi nguồn: bài Nottingham tự ghi hai cỡ mẫu ("khoảng 10.000" và 15.888), 22%→4% là riêng nhóm "Risk-based + CTA", thanh toán hợp lệ giảm 57%→50%. Đã sửa trang 4 (bỏ cỡ mẫu, thêm giá phải trả) sau lượt chấm này.
Cũng sửa sau lượt này (chưa chấm lại): H3 viết thành giả thuyết có tiêu chí đạt; SOM lấy hộ làm đơn vị chính; trang 10 ghi số cổ phần khi dừng ở từng cổng (2%, 6%).

## Bản v10 (21/11/2026): sắp đúng thứ tự 8 mục của đề, dồn trọng tâm kinh doanh

Đổi so với v9c: trang Saving gộp vào (6) Đo lường tác động; Cạnh tranh lên trước Tác động như đề; thêm trang (7) "Bán qua tổ chức, năm 3 thêm phí cấp phép" (ba dòng doanh thu, chi phí có một hộ 20.000 đ qua buổi hướng dẫn, kịch bản năm 3 ≈ 2,8 tỷ/năm, tiền lệ Carefull); trang 5 bớt chỉ số kỹ thuật; trang 11 thành "mỗi cổng mở khoá tiền bằng một chỉ số kinh doanh"; nhãn mỗi trang ghi số mục của đề.

| Lượt | Sonnet | Codex | Ghi chú |
|---|---:|---:|---|
| v9c (lần 2, đối chứng) | — | 62 | Codex chấm lại v9c để đo dao động |
| v10 bản đầu | 66 | 55 | Codex trừ vì so định giá với doanh thu năm 3 chưa kiểm chứng, quá tải chữ |
| v10b (sửa 3 chỗ lệch số) | — | 57 | Codex đọc nhầm luồng cổng |
| v10c (bỏ so định giá với năm 3, ghi rõ luồng cổng) | — | 62 | Shark Codex chào 80 triệu / 10% |

Sonnet xác nhận v10 đủ và đúng thứ tự 8 nội dung bắt buộc. Kết luận: v10 bằng điểm v9c với giám khảo AI nhưng đúng thứ tự đề và có phần đi thị trường; nên nộp v10.
Bài học: giám khảo AI trừ điểm khi đem định giá so với doanh thu dự báo chưa kiểm chứng; giữ năm 3 làm "kịch bản quy mô", không dùng để biện minh định giá.
