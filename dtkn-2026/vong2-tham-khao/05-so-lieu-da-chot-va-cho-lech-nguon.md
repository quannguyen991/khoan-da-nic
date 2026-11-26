# Sổ số liệu cho Proposal v7 (chốt 11/11/2026)

Nguồn tổng hợp: Deep research của ChatGPT (46 trích dẫn, mốc 10/11/2026), agent tra cứu, và dữ liệu eval của chính app.
Mọi số bên dưới là số **các công cụ tra cứu báo lại**; đội chưa tự mở từng nguồn gốc. Trước khi nộp, nên mở lại ít nhất các nguồn đánh dấu (!).

## Đã dùng trong slide

| Số liệu | Giá trị | Nguồn (theo công cụ tra cứu) | Ghi chú |
|---|---|---|---|
| Thiệt hại 11 tháng 2025 | trên 6.000 tỷ đồng, số vụ giảm hơn 30% | Bộ Công an, 15/12/2025 | số ước tính |
| Cả năm 2025 | hơn 4.200 vụ, trên 8.000 tỷ đồng | lãnh đạo A05 qua VTV 24/4/2026, VTC | (!) chưa thấy trang Bộ Công an có đúng bộ số này |
| 6 tháng đầu 2026 | 959 vụ, ≈1.500 tỷ; vụ giảm 56%, thiệt hại giảm 38% | A05 qua VnExpress 21/8/2026 | chưa có số cả năm 2026 |
| Cảnh báo ngân hàng (SIMO) | ≈4,6 triệu cảnh báo; hơn 1,5 triệu khách dừng/hủy; hơn 5.200 tỷ | Cục ATTT/OneTouch 16/10/2026 | nguồn nói rõ không phải toàn bộ là lừa đảo |
| Công văn 6190/NHNN-TT | khách đăng ký ngưỡng + thời gian chờ; mặc định 400 triệu, tối thiểu 24 giờ khi thuộc diện áp dụng; hạn 1/3/2027 | VTV 17/7/2026, Báo Đồng Nai 31/7/2026 | (!) ngày ký chưa xác minh, các báo ghi khác nhau; chưa thấy toàn văn trên NHNN |
| Thử nghiệm Open Banking Anh | khoảng 9.000–10.000 người, mô phỏng, cảnh báo theo rủi ro giảm mạnh tỷ lệ hoàn tất giao dịch lừa đảo | SSRN, Nottingham CEDEx 2023-08 | xem mục "chỗ lệch" |
| CPF Singapore | Trusted Contact từ 2/2026 | CPF Board 2/2026 | không có số giảm thiệt hại riêng |
| 14,2 triệu người 60+ | | GSO, điều tra giữa kỳ 2024 | |
| 64 tín hiệu; 82,6% bắt, 1,8% báo nhầm; 531 tin | | `backend/src/version.js` (registry 1.2.0), `eval/results/latest.json` | đo ở **luật 1.6.1**; luật hiện tại 1.6.4 chưa đo lại; bộ mẫu đã dùng để chỉnh luật |

## Đã bỏ khỏi slide, vì không xác minh được
- "20 triệu đồng mỗi vụ": Bộ Công an công bố theo **vụ việc**, không theo nạn nhân (chia ra ~1,56–1,9 tỷ/vụ, vô nghĩa với một nạn nhân).
- Tỷ lệ nạn nhân từ 60 tuổi trở lên ở Việt Nam: không có số công khai.
- "61,4% người 60+ dùng Internet" (NSO): các lượt tra cứu không xác minh lại được.
- "+25% thiệt hại ở Mỹ (FTC)" và "442 tỷ USD (GASA)": số nước ngoài, bỏ khỏi thân bài cho gọn.
- Bảng chấm ●◐○ tự đánh giá đối thủ: thay bằng bảng mô tả chức năng.
- "Scamio" là chatbot của Bitdefender (nước ngoài), không phải sản phẩm Việt Nam.

## Chỗ các nguồn lệch nhau
- **Warwick/Open Banking:** agent tra cứu ghi "hơn 13.000 người, nút hủy/hoãn giảm 54%"; Deep research ghi "≈9.000 người (bản 2026) / gần 10.000 (bản trước), giảm tới ≈94% trong một kịch bản, còn ≈4% hoàn tất". Hai bên khác nhau ở cả cỡ mẫu và mức giảm, nên slide chỉ nói định tính ("giảm mạnh") và cỡ mẫu "khoảng 9.000–10.000". **Cần mở bài gốc trước khi nói con số cụ thể khi tranh biện.**
- **Điểm chấm thử hồ sơ v6:** Codex 44/100 (biết v6 vi phạm hình thức), ChatGPT 70/100 (không biết). Không dùng làm căn cứ.

## Nguồn vốn (kiểm 10/11/2026)
- Blue Ocean Student Entrepreneur Competition: học sinh THPT, cá nhân hoặc đội ≤5 người, hạn pitch 21/2/2027. Đã đưa vào slide làm ví dụ.
- Diamond Challenge 2027: đội **2–4 người**, hạn 14/1/2027. Đội 5 người có thể không đủ điều kiện; chưa đưa vào slide.
- Conrad Challenge: Phase 1 đã qua, vào muộn chưa xác minh được.
- UNDP RE:ACT (thành viên 18–35 tuổi) và VSIC (18–23 tuổi): không phù hợp đội dưới 18.
- Pháp lý (Bộ luật Dân sự Điều 21, Luật Doanh nghiệp Điều 17): người chưa thành niên không thành lập/quản lý doanh nghiệp. **Cần luật sư hoặc mentor đối chiếu.**

## Các con số do chính bản v7 đặt ra (đội phải xác nhận là mục tiêu của mình)
- Mốc gia đình dùng thử: 100–200 (3 tháng), ≈1.000 (6 tháng), 3.000–5.000 (12 tháng).
- Kịch bản tài chính: tỷ lệ trả phí 3% / 6% / 10% của 1.000 / 3.000 / 5.000 gia đình.
- Cơ cấu ngân sách 68,8 triệu: 20 / 14 / 9 / 8 / 7,8 / 6 / 4; ba đợt giải ngân 20 / 28 / 20,8.
- Thử nghiệm có đối chứng với người 60+ vào tháng 1–3, các chỉ số 1–6 và mốc đo.
- Nút truy cập nhanh và luồng chia sẻ tin nhắn vào app: ghi là "thử", cần kiểm app có làm được không.
