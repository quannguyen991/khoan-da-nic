# Khoan Đã — video giới thiệu (tiếng Anh) · storyboard

> **Bản Studio (dựng thật):** thư mục `studio/` là project HyperFrames — 14 cảnh con + 1 track phụ đề + hiệu ứng âm thanh,
> phông **Outfit**, nền Flow, màn hình app thật. Xem: `cd studio && npx hyperframes preview --background` → http://localhost:3003.
> Sửa nội dung ở `studio/gen.py` rồi chạy `python gen.py` (sinh lại `index.html` + `compositions/`). Chưa render MP4.
> Việc còn lại của bản Studio: nhạc nền (cần đăng nhập HeyGen), giọng đọc của đội, số đo mới, màn hình chụp độ phân giải cao.

> Mở **`design-board.html`** để xem 14 khung có chuyển động (một tệp, ảnh đã nhúng sẵn).
> Mỗi khung có nút ↻ Replay; nút ▶ Play all chạy hết từ F01 đến F14.
> `frame.md` là hệ thiết kế; `flow-prompts.md` là các prompt đã chạy trên Google Flow.

**Thông số giả định (đổi được):** 1920×1080 · 30 fps · ≈120 giây · lời dẫn tiếng Anh ≈295 từ
(2,5 từ/giây) · phụ đề tiếng Anh cháy vào hình · nhạc nền không lời. Giọng đọc là giọng
người của đội — thể lệ cuộc thi chưa nêu có cấm giọng AI hay không, kiểm trước khi quyết.

## Ba hướng kể chuyện (chọn sẵn A, đã dựng)

| | Hướng | Vật dẫn | Ghi chú |
|---|---|---|---|
| **A** ✅ | **"Sáu mươi giây"** — một khoảnh khắc trong ngày: cuộc gọi → một câu hỏi → nhãn → khoảng dừng | một chuỗi thao tác thật xuyên suốt: *Give an OTP* → *High risk* | Đã dựng. Hợp video tham khảo số 4 (chữ động + màn hình thật). |
| B | **"Nhân chứng và quan toà"** — cả phim là một sơ đồ AI/luật đi qua một tin nhắn | tin nhắn lừa đảo chạy qua hai tầng | Chỉ hợp nếu cuộc thi chấm nặng phần kỹ thuật. F08 là bản rút gọn của hướng này. |
| C | **"Chữ mang lập luận"** — toàn chữ khổng lồ cắt theo nhịp, màn hình chỉ hiện 3 lần | câu *Pause. Verify. Protect.* | Mạnh về nhịp, yếu về chứng cứ. |

## Bảng phân cảnh

| # | Giây | Hình | Lời dẫn (EN) | Nguồn hình |
|---|---|---|---|---|
| F01 | 0–6 | Chữ gõ trên nền tím đêm, vòng gợn như chuông điện thoại | It starts with a phone call. "We are the police. Your account is linked to a crime. Do not hang up. Do not tell your family." | Flow + dựng |
| F02 | 6–16 | Số 6.000+ đếm lên · vòng tròn 32% | In Vietnam, impersonating the police is the most common phone scam. Over six thousand billion dong lost in eleven months of 2025, and only a third of victims report it. | Flow + dựng |
| F03 | 16–24 | Câu bị gạch → "60 seconds" + vòng đếm ngược | Older people are not uninformed. They are short of sixty seconds, and someone to ask. | Flow + dựng |
| F04 | 24–30 | Hai thanh "tạm dừng" → logo thật → tên + khẩu hiệu | This is Khoan Đã, Vietnamese for "hold on". Pause. Verify. Protect. | Flow + logo thật |
| F05 | 30–40 | Điện thoại phẳng, con trỏ chạm 3 lần | A person on a call cannot type. So the app asks one question: what are you being asked to do? Three taps, no typing. | **App thật** (4 màn) |
| F06 | 40–52 | Kết quả *High risk* → hộp *What I could NOT check* được khoanh | The answer: high risk, hang up now. And right below, at the same size, what it could not check. Unchecked never means fine. | **App thật** (2 màn) |
| F07 | 52–60 | Màn Dừng 60 giây trên nền đỏ khẩn | If fear takes over: a sixty second pause, and one sentence to say. Let me ask my family and call you back. | **App thật** |
| F08 | 60–78 | Sơ đồ phẳng: AI đọc → kiểm bằng chứng → luật cố định quyết | Here is the technology. AI reads the message and raises flags, but it has no field to give a risk score. A fixed rule engine decides, so the same input always gives the same answer. If the AI is down, the rule layer still runs. | Dựng (vector) |
| F09 | 78–86 | Màn Lịch sử + ba nhãn | Three labels only. High risk. Suspicious. No clear risk signals found. Never a fourth. | **App thật** + dựng |
| F10 | 86–96 | Danh bạ ngân hàng · Người thân · thanh 72 giờ | Around that pause: family one tap away, official bank numbers with their source and date, and a seventy-two hour watch after a transfer. | **App thật** (2 màn) + thanh 72h *chưa có màn thật* |
| F11 | 96–106 | Biểu đồ mục tiêu (không có số) · 4 dòng SDG | What we expect: more people pausing before the transfer. We will measure that in a pilot with older adults and their families. | Flow + dựng |
| F12 | 106–113 | Màn xác nhận chuyển tiền *(phác thảo, không phải ngân hàng thật)* + lớp tạm dừng | It protects savings and trust in digital banking, and gives banks a warning layer before the confirm button — with rules running first, so fewer AI calls. | Flow + dựng |
| F13 | 113–119 | 571 · 92,1% · 1,8% | Our test set has five hundred seventy-one messages we wrote ourselves, and no real victim messages yet. That is our next step. | Flow + dựng |
| F14 | 119–120+ | Logo + tên + URL, giữ 3 giây | Khoan Đã. Pause. Verify. Protect. | Flow + logo thật |

*Lời dẫn F12 nằm giữa F11 và F13 trong bản đọc liền; tổng khớp ≈295 từ. Nếu vượt 120 giây,
cắt F12 trước (giữ F11 và F13).*

## Đối chiếu ba mục bắt buộc

| Yêu cầu | Khung |
|---|---|
| Bối cảnh + giới thiệu dự án (vấn đề, mục tiêu) | F01–F04 |
| Giải quyết vấn đề bằng công nghệ đổi mới | F05–F09 (thao tác thật) · F08 (AI chỉ bật cờ, luật cố định quyết) |
| Kết quả kỳ vọng (bền vững, ngành trọng tâm) | F11 (mục tiêu + SDG 1·3·10·16) · F12 (ngân hàng/fintech, ít lượt gọi AI) · F13 |
| *Thêm tính năng, màn thao tác* | F05–F07, F09, F10 (4 màn kết quả + khẩn cấp + danh bạ + người thân) |

## Việc phải làm trước khi quay / dựng thật

1. **Chạy lại bộ đo** (`eval`) — `latest.json` ghi bộ luật v1.6.1 (24/9) mà repo đã lên 1.6.4. Số
   92,1% / 1,8% chỉ dùng được sau khi chạy lại và đọc số mới. Model ghi trong báo cáo cũng phải khớp
   với những gì được nói ra (§11).
2. **Chụp lại màn hình ở độ phân giải cao** (hiện 375×812; render 1080p cần ≥ 3× pixel ratio).
3. **Chụp bằng hồ sơ Việt Nam.** Bản tiếng Anh đang hiện *Call Emergency 911* và hotline Mỹ/Anh
   (màn F07, F10). Câu chuyện là Việt Nam: dùng hồ sơ VN (113, hotline ngân hàng Việt) hoặc cắt khỏi khung.
4. **Chụp màn "theo dõi 72 giờ"** (`theo_doi_72h`) để thay thanh vẽ ở F10.
5. **Xoá lịch sử** trước khi chụp màn Lịch sử (đang có 3 mục thử).
6. **Xác nhận nguồn "phổ biến nhất"** (giả danh công an) — câu này lấy từ `KICH-BAN-VIDEO.md`, chưa
   có nguồn kèm theo. Hai số còn lại đã kiểm: 6.000+ tỷ (Bộ Công an, 11 tháng 2025) và 32% (NCA, 60.300 người, 12/2025).
7. **Không dùng** "Grand Prix AI-JAM US 2026" hay số 442 tỷ USD của GASA nếu chưa kiểm nguồn — hai câu đó chỉ nằm trong tài liệu nội bộ.

## Xung đột đã ghi (hợp đồng thắng ảnh thiết kế)

- Yêu cầu người dùng: **không người giả, không 3D** → hợp đồng và yêu cầu cùng chiều. 6 ảnh đã tạo trên Flow
  theo hướng đó (bà cụ, hai mẹ con, bàn tay quanh cây non, máy 3D, điện thoại đổ chuông, nền 3D) **bị loại**.
- CLAUDE.md §3.4 cấm chữ nướng vào ảnh và dùng ảnh sinh để làm *màn hình sản phẩm* → mọi màn hình trong phim là ảnh chụp app thật;
  Flow chỉ làm nền gradient không chữ.
- Linh vật 3D của app (màn đầy đủ) **không dùng** trong phim.
- Không có chữ "safe" ở bất kỳ khung nào, kể cả bị gạch.
