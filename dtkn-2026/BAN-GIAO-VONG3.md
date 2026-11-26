# BÀN GIAO: Hồ sơ vòng 3, Đấu trường Khởi nghiệp 2026 (đội Khoan Đã)

Cập nhật: 21/11/2026. Viết cho phiên làm việc mới, đọc hết trước khi làm.

## 0. Cập nhật 21/11/2026 (phiên sau): đã có bản v9

- `build-v9.py` → `proposal-v9.html` → `draft-v9.pdf` (12 trang, 0,44 MB). **v8 giữ nguyên** (bản đang gửi đội). Đội chọn bản nào để nộp; nếu chọn v9 thì đổi tên `draft-v9.pdf` thành `[ĐTKN2026]_V3_ShieldGen_Proposal.pdf`.
- Đã kiểm nguồn ngoài: `vong3-tham-khao/04-kiem-nguon.md`. Đã sửa: bỏ "4.200 vụ" (không xác minh được); 1,5 triệu lượt là của NHNN, không phải Cục An toàn thông tin, nay dùng số mới 1,9 triệu (NHNN, đến 28/9/2026); Công văn 6190 ngày 20/7/2026 nói về hạn mức và thời gian chờ, không phải SIMO; ngày VnExpress là 22/8.
- Đã sửa các lỗi ở mục 6: câu chưa có nguồn ở trang 2, nhãn 28,7 ở trang 9, đơn vị SOM ở trang 3. Đổi "commit" và "widget" sang tiếng Việt. Trang 8 trước đây vẽ thanh "báo đỏ nhầm" phóng to 10 lần, nay đã vẽ đúng tỷ lệ.
- Business: trang 11 thành "Lộ trình & định hướng" (3 chặng: gia đình → nhúng vào ngân hàng, ví, nhà mạng → nền tảng phòng ngừa). Trang 9 có kinh tế đơn vị (biên 24.000 đ, hoàn vốn ≈ 14 tháng, nếu 3% trả phí thì ≈ 28 tháng) và tỷ trọng tài trợ nhóm 70%. Trang 10 thêm "trước Cổng 1 chỉ giải ngân 80 triệu" và quyền nhà đầu tư (báo cáo quý, ưu tiên vòng sau). Trang 8 có mục tiêu giả định cho từng chỉ số.
- Chấm lại: Haiku 60, Sonnet 62, Codex 58 (trước là 56/62/57). Chi tiết ở `vong3-tham-khao/cham-diem/05-cham-v9.md`. Sau lượt chấm đã sửa thêm vài điểm nhỏ nhưng chưa chấm lại.
- Kịch bản `02-...md` đã theo v9: bỏ số "dưới 1,4 tỷ", nói 8,7 triệu, thêm "đổi điều khoản thay vì đổi giá" trong đàm phán.
- Đề bài text và prompt chấm đã chép vào `vong3-tham-khao/de-bai-vong3.txt` và `vong3-tham-khao/cham-diem/`. Không còn phụ thuộc scratchpad cũ.
- **Lượt 2 (cùng ngày):** thêm bằng chứng thứ cấp (`vong3-tham-khao/06-bang-chung-thu-cap.md`: Nottingham 22% → 4%, FBI IC3, EverSafe/Truecaller/Carefull) và số đo ngoài mẫu. Điểm v9b: Haiku 56, Sonnet 62, Codex 63; Sonnet lần đầu chịu đầu tư (300 triệu / 10–12%).
- **Bộ đo:** DeepSeek `deepseek-v4-flash-0731` đã **không còn trên ai-box** (503 model_not_found), nên tầng AI của app thật đang hỏng cho tới khi đổi `RISK_LLM_MODEL` trong `.env` và deploy lại (chưa làm, cần chủ dự án quyết). Số trên slide đo với `qwen3.8-flash` qua biến môi trường. Bộ chính: 217/265 báo đỏ, 21 bỏ sót (7,9%), 8/169 báo đỏ nhầm (4,7%; DeepSeek cũ là 1,8%). Bộ mới `eval/kiem-moi/` (70 tin Codex soạn, nhãn máy, chưa người duyệt): 37/40 báo đỏ, 0 bỏ sót, 0/30 báo nhầm. Đã thêm `'kiem-moi'` vào `BO_RIENG` trong `eval/run.js` (chưa commit). `latest.json` không đổi.
- **Khảo sát:** `khao-sat/` có phiếu Google Form cho con cháu, kịch bản phỏng vấn và thử luồng cho người 60+, tin nhắn gửi, và `tong-hop.py` (CSV Google Forms → `ket-qua.json` + câu cho slide). Đây là việc tăng điểm nhiều nhất còn lại.
- Deal vẫn là 400 triệu / 10% (quyết định của đội; ba giám khảo AI chào 0,4–1,5 tỷ định giá).

**Cập nhật chiều 21/11/2026 (lượt 3):**
- Đo app trên 31 tin lừa có thật do báo chí trích (`eval/bao-chi/`): luật 1.6.4 bỏ sót 7/14 tin nặng. Đã vá thành **luật 1.6.5** (vi-VN@1.3.1): phạt nguội, "nếu không phải bạn thì bấm link", link đổi mật khẩu/huỷ dịch vụ (nhận cả `https://`), doạ mất lương hưu, "trong 3 giờ"; bộ kiểm dấu bỏ qua chỗ che "[…]". Còn sót 2/14. Bộ chính 531: báo nhầm giữ 8/169, recall giữ 81,9%. 1.711/1.711 bài kiểm thử qua. Bộ bao-chi từ nay là bộ hồi quy.
- Commit 89895f1 đã push lên `main` và `sua-bo-luat-va-do-luong`; Render chạy luật 1.6.5 (kiểm `/api/safety-card`).
- **Model:** `deepseek-v4-flash-0731` chỉ trả 503 với khoá trên máy dev. Máy chủ Render vẫn gọi được nó (`aiDaChay: true`, 21/11). `.env` máy dev đã sang `qwen3.8-flash`; `render.yaml` ghi qwen nhưng biến đặt trên trang Render đang giữ 0731. Số trên slide đo bằng qwen; muốn khớp thì đổi biến `RISK_LLM_MODEL` trên trang Render.
- Slide v9: trang 3, 4, 5, 8, 10, 12 sửa thêm (xem `vong3-tham-khao/cham-diem/05-cham-v9.md`). Sonnet 67, Codex 63.
- Kịch bản: câu nói trang 5 và câu hỏi 5, 8 mới về lỗ hổng tin thật.
- **Bản v10** (`build-v10.py`, `draft-v10.pdf`): sắp đúng thứ tự 8 mục của đề (Cạnh tranh trước Tác động; Saving gộp vào Tác động), thêm trang đi thị trường & tăng trưởng, trang 11 thành cổng mở khoá bằng chỉ số kinh doanh. Codex 62 (v9c 62–63), Sonnet 66. Kịch bản phần A đã viết lại theo v10. **Đề xuất nộp v10** (đổi tên thành `[ĐTKN2026]_V3_ShieldGen_Proposal.pdf`).

**Cập nhật 24/11/2026:**
- Mentor nhận xét mức gọi vốn cũ "khá an toàn, chưa tối ưu". Đội chốt **1 tỷ / 10% (post-money 10 tỷ)**, Gói Gia đình **49.000 đ/tháng hoặc 399.000 đ/năm**, lõi dừng 60 giây miễn phí. Lập luận định giá (phương pháp VC 4,2–11,2 tỷ, Berkus, so sánh, nấc nhượng 10 → 7 → 5 → sàn 3 tỷ): `vong3-tham-khao/07-lap-luan-post-money-10-ty.md` (có bản .docx).
- Đã sửa `build-v10.py` theo mức mới và chép `draft-v10.pdf` thành `[ĐTKN2026]_V3_ShieldGen_Proposal.pdf`. `build-v8.py` cũng đã sửa theo 1 tỷ, PDF ở `draft-v8.pdf`. Kịch bản `02-...md` đã đổi câu công bố, nấc nhượng, hỏi đáp số 2–3.
- Các mục "Deal 400 triệu / 10%" ở phần dưới là **lịch sử**, không còn dùng.
- Chưa chấm lại bằng agent sau khi đổi mức.

## 1. Nhiệm vụ còn lại

Hoàn thiện slide vòng 3 (bản nộp) và chuẩn bị chung kết. Hạn nộp slide: **23h00 26/11/2026** (đội nên nộp trước 22h30). Chung kết: **29/11/2026**, Trường Đại học Anh Quốc Việt Nam BUV, tối thiểu 2 thành viên có mặt.

Việc còn mở:
1. Có bằng chứng thật về người dùng (phỏng vấn, thử luồng). Đây là việc tác động điểm nhiều nhất. **Không được tự điền số liệu.**
2. Cập nhật slide sau khi có số thật (trang 5, 8, 9, 10).
3. Chốt câu trả lời của BTC về hệ sinh thái (xem mục 5).
4. Kịch bản 5 phút và luyện đàm phán 3 phút với người đóng Shark.

## 2. Đề bài vòng 3 (tóm tắt có đủ điều kiện quan trọng)

Nguồn đầy đủ: `[ĐTKN'26] ĐỀ BÀI CHI TIẾT VÒNG 3.pdf` (ở `D:\`). Bản text đã trích: `D:\ClaudeTemp\claude\035ffcbe8eac11e8\a2858fdd-7ac2-403d-b18d-e52495d77e45\scratchpad\de-v3.txt`.

**Chủ đề:** Saving for the Future, Kiến tạo kỷ nguyên xanh. Saving = nhận diện giá trị đang bị bỏ ngỏ và chuyển hóa thành giải pháp lợi ích lâu dài; nguồn lực gồm thời gian, tri thức, công nghệ, dữ liệu, tài chính, giá trị văn hóa, nguồn lực cộng đồng (không chỉ năng lượng).

**Hồ sơ (Proposal):**
- PDF 16:9, tối đa 10 MB; tối đa 10 trang nội dung; **1 slide Business Model ở đầu (bắt buộc)**; phụ lục tối đa 1 slide ở cuối, không link ngoài.
- Không hình ảnh, tên, thông tin thành viên. Chỉ tiếng Việt (thuật ngữ được giữ tiếng Anh).
- Tên file: `[ĐTKN2026]_V3_[Tên đội]_Proposal`. Chỉ nhận lần nộp đầu, không sửa sau nộp.
- Nội dung bắt buộc (8 mục): Business Model; Vấn đề & khoảng trống; Nghiên cứu thị trường & khách hàng; Giải pháp; Cạnh tranh; Đo lường tác động; Tài chính; Nhu cầu vốn & kế hoạch huy động.
- Trễ: sau 23h00 trừ 10%, sau 23h15 trừ 15%, sau 23h30 không nhận.

**Vòng chung kết (Top 7):** thuyết trình 5 phút (Elevator Pitch) từ Proposal đã hoàn thiện; sau đó **3 phút Investment Q&A & Negotiation** với Hội đồng đầu tư (Sharks).

**Luật chơi "The Power Shift":**
- Đội công bố: "Chúng tôi gọi X VNĐ cho Y% cổ phần."
- Mỗi Shark có quỹ giả định 10 tỷ VNĐ. Shark có thể Accept, Counter-offer, Syndicate (nhiều Shark cùng vào), hoặc Băng giá (No Deal).
- Đội được chấp nhận, đàm phán, từ chối offer, hoặc nhận Deal từ Shark khác. Chỉ No Deal khi không chấp nhận Deal nào.
- **Post-money Valuation = Tổng tiền đầu tư ÷ Tổng % cổ phần trao (tất cả Deal thành công).** Tổng % phải dưới 50%, nếu không Deal không được công nhận.
- Không chốt Deal nào trong 3 phút = kết quả **0**.
- **Quán quân = đội có Post-money cao nhất.** Đề có một chỗ mâu thuẫn ở trang 3 ("tổng giá trị đầu tư cao nhất") — đã được BTC làm rõ là post-money.
- Mức đầu tư chỉ là giả định, không phát sinh quan hệ pháp lý thật.

## 3. Trạng thái hiện tại

**Đội:** 5 học sinh dưới 18 tuổi, chưa có pháp nhân, chưa có doanh thu, chưa thử thực địa. Tên đội đăng ký vòng 1 là **ShieldGen** (đối chiếu từng ký tự với email xác nhận trước khi nộp).

**Deal đã chọn: 400 triệu VNĐ cho 10% cổ phần (định giá giả định 4 tỷ).**
- Mức nhượng bộ nấc 1: 300 triệu cho 10% (3 tỷ).
- Sàn đề xuất: định giá không dưới 2 tỷ (ví dụ 300 triệu cho 15%); tổng cổ phần trao tối đa 15–20%.
- Quy tắc còn khoảng 45 giây mà chưa có Deal: nhận Deal tốt nhất đang có.
- Đây là quyết định của đội, không phải của AI. Nếu đổi, sửa hai dòng `DEAL_X_TRIEU` và `DEAL_Y_PCT` trong `build-v8.py`.

**File sản phẩm (nằm trong `D:\KHOAN-DA-24H\dtkn-2026\`):**
- `build-v8.py` — bộ dựng slide vòng 3 (nguồn sự thật).
- `proposal-v8.html` — bản HTML có hoạt họa (IntersectionObserver); PDF tắt hoạt họa khi in.
- `[ĐTKN2026]_V3_ShieldGen_Proposal.pdf` — **bản đang gửi đội** (12 trang, ~0,43 MB, 16:9).
- `vong3-tham-khao/01-phuong-an-deal.md` — bảng phương án Deal (nguồn Claude + Codex).
- `vong3-tham-khao/02-kich-ban-5-phut-va-hoi-dap.md` — kịch bản 5 phút, câu công bố Deal, 10 câu hỏi Shark, mục F về trả lời BTC.
- `vong3-tham-khao/03-tranh-luan-muc-deal.md` — tranh luận ba bên về mức Deal.
- `build-v6.py` — chỉ được `build-v8.py` đọc lại phần HEAD CSS và hàm vẽ; **không sửa**.

**Cách dựng lại PDF:**
```bash
cd D:\KHOAN-DA-24H\dtkn-2026
PYTHONIOENCODING=utf-8 python build-v8.py
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="<đường dẫn scratchpad>/v.pdf" "file:///D:/KHOAN-DA-24H/dtkn-2026/proposal-v8.html"
```
Phải đặt `PYTHONIOENCODING=utf-8` (Windows console lỗi với tiếng Việt). Sau đó kiểm 12 trang bằng PyMuPDF (`pymupdf`), render PNG để xem.

**Cấu trúc 12 trang hiện tại:** 1 Business Model · 2 Vấn đề & khoảng trống · 3 Thị trường & khách hàng · 4 Giải pháp · 5 Bằng chứng sản phẩm · 6 Saving for the Future (7 nguồn lực → 5 giá trị) · 7 Cạnh tranh · 8 Đo lường tác động · 9 Tài chính · 10 Nhu cầu vốn & huy động · 11 Lộ trình & rủi ro · 12 Phụ lục.

**Điểm các giám khảo AI (không phải Shark thật, không phải dữ liệu thị trường):**
- Vòng 3 bản đầu: Haiku 58, Sonnet 66, Codex 61.
- Sau khi sửa khoảng trống và số liệu: Haiku 56, Sonnet 62, Codex 57.
- Cả ba nói cùng một điểm yếu: thiếu bằng chứng người dùng và chưa có số đo tác động. Sửa chữ không đẩy được điểm lên đáng kể.
- Ba giám khảo cũng tự chào mức thấp (150–500 triệu, định giá 1–2 tỷ), thấp hơn mức 400 triệu/10% đội đã chọn.

## 4. Quy tắc bắt buộc (không được vi phạm)

1. **Không bịa số liệu.** Không điền form thay phỏng vấn, không viết số đo tác động giả, không ghi "đã tham gia" khi chưa có. Trang 8 hiện ghi "đã tham gia: 0 người; kế hoạch: 30".
2. **Không nói "an toàn"** cho mức rủi ro thấp (chỉ dùng "chưa thấy dấu hiệu rủi ro trong thông tin đã cung cấp").
3. **Không hứa** chặn cuộc gọi, chặn giao dịch, lấy lại tiền.
4. **Mọi con số do đội tự đặt phải ghi "giả định"** trên slide.
5. **Không gắn tên người** vào tài liệu nộp. Không link `http` trong slide.
6. **Không dùng số 61,4% người 60+ dùng Internet** (đã bỏ vì không xác minh được).
7. **Không dùng bộ đo chỉ bằng bộ luật để thay số 82,6%.** Số 82,6% đo có lớp AI. Chạy chế độ chỉ bộ luật cho recall khoảng 33%, không so sánh được.

## 5. Việc còn mở (theo thứ tự ưu tiên)

1. **Phỏng vấn thật** 10–15 người (5–8 người 60+, 5–8 con cháu 30–45 tuổi). Hỏi: lo lắng về chuyển tiền không; chọn 0 / 29.000 / 49.000 đ; có tin dùng app không. Ghi số người và kết quả thật, kể cả khi ít. Đội tự làm; AI không thay được. Có thể soạn form HTML hoặc phiếu giấy nếu đội yêu cầu.
2. **Thử luồng với 3–5 người 60+** có người lớn bảo trợ. Ghi bước nào họ không làm được.
3. **Hỏi BTC** qua fanpage/hotline (trước 28/11): giá trị hệ sinh thái quy đổi có cộng vào **tử số** của post-money không, và có phải công bố tỷ lệ cổ phần đi kèm không. Câu hỏi sẵn: mục F trong `02-kich-ban...md`.
4. **Cài APK** lên 1–2 máy thật và thử các luồng nói trên slide trang 4: nhấn giữ biểu tượng, dòng thanh thông báo, bong bóng nổi, màn đỏ 60 giây, gọi người thân.
5. **Kiểm nguồn số liệu ngoài** trước khi nộp: A05 (8.000 tỷ, 4.200 vụ năm 2025; 959 vụ, 1.500 tỷ, −56% vụ, −38% thiệt hại 6 tháng 2026), Cục An toàn thông tin (1,5 triệu lượt, 5.200 tỷ), GSO (14,2 triệu người 60+), Công văn 6190/NHNN-TT (ngày ký chưa xác minh), thử nghiệm Anh (Nottingham/Warwick, số người các nguồn lệch nhau). Nếu chưa kiểm được, ghi "qua báo chí" hoặc bỏ.
6. **Chấm lại** sau khi có số thật (Haiku, Sonnet, Codex, cùng prompt `prompt-regrade.txt`).
7. **Kịch bản đàm phán:** tập 3 phút với người đóng Shark, đo giờ.

## 6. Lỗi đã biết và chưa sửa

- Trang 2 có dòng "phần lớn xử lý hiện nay nằm ở đây" chưa có nguồn. Nên bỏ hoặc dẫn nguồn.
- Trang 3 TAM/SAM đếm theo người, SOM đếm theo hộ. Đã ghi chú nhưng vẫn dễ gây nhầm.
- Trang 9 nhãn "+ tài trợ nhóm: 28,7" là tổng (8,7 + 20) trong tháng 18. Nên ghi rõ.
- Trang 9 định giá 4 tỷ ≈ 12× doanh thu chạy năm có tài trợ và 38× chỉ gói gia đình. Chú thích đã nêu đây là nhà đầu tư mua tiềm năng.
- Số đo nội bộ (531 tin, 1.711 test) đo trên luật 1.6.1; sản phẩm hiện là 1.6.4, chưa đo lại.
- Các phép tính đã kiểm khớp: 531 = 265 + 169 + 97; 400 triệu ÷ 10% = 4 tỷ; 5.000 × 6% × 29.000 = 8,7 triệu/tháng; tổng vốn 100 + 80 + 60 + 60 + 60 + 40 = 400 triệu.
- Word/PDF "Proposal văn bản" cũ (`Proposal-van-ban-day-du-V2.docx`) đã lỗi thời; không bắt buộc cho vòng 3.

## 7. Bối cảnh cần biết

- Việc dựng slide dựa trên thể lệ và trả lời BTC đã nhận. Đừng quay lại mô hình "gọi 5 tỷ"; đã bị ba giám khảo AI bác.
- Chiến lược đã thống nhất với đội: mở 400 triệu/10%, nhượng bộ 300 triệu/10%, sàn định giá 2 tỷ.
- Trước đó đội từng có bản vòng 2 (12 trang, `[ĐTKN2026]_V2_ShieldGen_Proposal.pdf`) nộp không đổi; vòng 3 là bản khác, không ghi đè vòng 2.
- Khi mở phiên mới: đọc file này, `dtkn-2026\vong3-tham-khao\*.md`, rồi chạy `build-v8.py` để xác nhận PDF khớp `proposal-v8.html`.
