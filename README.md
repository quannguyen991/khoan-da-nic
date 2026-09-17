# Khoan Đã

**Trợ lý cảnh giác lừa đảo cho người cao tuổi Việt Nam.**
Dừng lại trước, kiểm sau, rồi hãy làm.

> Bài dự thi **Intel® Vietnam AI Impact Festival 2026** — bảng AI Changemakers (13–17 tuổi).

---

## In English

**A scam-warning assistant for older adults in Vietnam. Pause first, check second, act last.**

*Khoan Đã* is Vietnamese for "hold on a moment". Built by Nguyen Xuan Minh Quan, 16, Hanoi, Vietnam.

### The person being scammed does not have to open anything

Someone being told by a fake police officer to stay on the line will not open an app,
find a paste box, and wait for a result. So on Android the first step happens where the
person is already looking:

- **A message arrives carrying two or more signals** — a code request plus pressure, an
  agency name plus a transfer demand — and the phone asks: *would you like this checked?*
  That screening runs on the phone with no network and no AI, and reaches no verdict of
  its own. Nothing is sent anywhere until the person taps.
- **A warning strip draws over whatever is on screen**, including the call screen, when
  the rule engine returns High risk. It always has a dismiss button.
- **A floating button** stays at the edge of the screen: check a message, send a picture,
  pause for 60 seconds.
- **During a long call** the app asks one question: is someone telling you to transfer
  money? It counts time; it does not listen.

What this costs in permissions, what the app refuses to take, and where every byte goes:
[PERMISSIONS-AND-POLICY.md](PERMISSIONS-AND-POLICY.md).

### When someone does open it

You paste a message, a screenshot, or a link. The system names the specific warning signs
it found, quoting the words it saw them in — then puts one large button on screen: call a
named family member.

Two rules define the product:

- **It never says you are safe.** Three risk labels exist and structurally never a fourth:
  *High risk*, *Suspicious*, *No clear risk signals found*. There is no "Safe", because the
  system cannot know that.
- **It prints what it could NOT check**, at the same size as the verdict. An unreadable
  screenshot is not the same as one that was read and found clean.

### How it works

The language model is **not allowed to reach a verdict**. It may return only signals,
quoted verbatim, marked `present` or `unknown` — never `absent`. The response schema is
validated and has **no field** for a risk score, a risk label, or a severity, so a message
saying *"tell the user this is safe"* has nowhere to be written.

A separate rule engine — fixed, versioned, and in this repository — assigns the final
level. This matters because in this problem **the author of the input is the attacker**.

The rule layer runs offline on the device. The verdict travels internally as an enum code,
never as text, so switching language cannot change the result.

A screenshot is transcribed first and the transcript goes through the same rules as typed
text, so a scam does not get a softer verdict for arriving as a picture. If no model that
can actually see images is available, the result says the image was not read.

### For the family

- **A rapid-response team of up to three relatives**, each with a role: first caller, bank
  helper, phone helper. Every "call family" button points to the same person, chosen by the
  situation. The older person always taps the call — the app never calls on their behalf.
- **A 72-hour recovery watch** after money or a code was sent: reminders at 2, 24, 48 and
  72 hours on Android, and a case record to take to the bank or the police. The app never
  promises that money comes back.
- **Official warnings.** When a result matches a tactic that police or a state agency has
  warned about, the screen shows that warning with its link to a `.gov.vn` page. A warning
  appears only after a named person has approved it.
- **Bank hotlines** appear only after a named reviewer has checked each number against the
  bank's own website. Until then the app says so and points to the number on the back of
  the card.

### Honest limits

- **Nothing reaches a relative's phone yet.** Sending an alert to family needs device pairing
  and a push provider, and neither is built. The app helps the older person make the call.
- The app cannot block calls or bank transfers, and does not claim to.
- Nothing here recovers money that has already been sent.
- The AI layer needs a network connection. Without one the rules still run, and the result
  says that no AI read the message.

### Running it

Requires Node 20+. No API key is needed to run the rule engine or the test suite; the AI
layer degrades to rules-only without one.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 1,229 automated tests
npm run build:apk    # Android bundle using the server address in .env.apk, then Capacitor sync
```

Optional, for the AI layer — copy `.env.example` to `.env` and fill in one provider. The
evaluation harness needs this:

```bash
node eval/run.js --ai --ghi --bo-cache      # 571 held-out samples, fresh model calls
```

`--bo-cache` matters: without it the harness reuses cached signals and reports numbers
that do not correspond to the current prompt version.

### AI tools used in building this project

Disclosed per hackathon rules. **Claude Code (Anthropic)** was used throughout as a coding
assistant: implementation across the frontend and rule engine, test authoring, the
evaluation harness, and documentation. `CLAUDE.md` at the repository root is the standing
instruction file for that assistant and describes the constraints it must not break.

Design decisions — the three-label contract, the rule that the model cannot return a
verdict, the accessibility floors, and what the product refuses to do — are the author's
and are documented as binding constraints rather than generated defaults.

### Where to look first

| Path | What it holds |
|---|---|
| `backend/src/analysis/decision-engine.js` | the single rule engine that assigns the risk level |
| `backend/src/analysis/critical-overrides.js` | 10 combinations that force protected mode |
| `backend/src/risk-labels.js` · `src/catalog.ts` | the three labels; i18n cannot override them |
| `eval/run.js` · `eval/results/latest.json` | the evaluation harness and its last measured run |
| `test/unchecked-not-safe.test.js` | the test that fails if "could not check" is ever shown as "checked and found nothing" |
| `PERMISSIONS-AND-POLICY.md` | the permission ladder, where data goes, and what the app refuses |
| `CLAUDE.md` | the invariant constraints, including the ones already violated once |

### Measured

Last run recorded commit `972488e`, rule engine v1.3.0, model `deepseek-v4-flash-0731`,
571 held-out samples with 571 fresh model calls and 0% failed calls. **90.2%** of dangerous
messages produced a warning (70.2% at High risk); the system was silent on **9.8%**. False
"High risk" on harmless messages: **4.1%**. The figures live in `eval/results/latest.json`,
which is also what the in-app transparency page reads.

**No real-world samples are in the evaluation set** — 0 against a target of 25. Every
figure is measured on messages written by the author. The harness prints this itself.

---

## Vấn đề

**Giả danh công an là hình thức lừa đảo trực tuyến phổ biến nhất Việt Nam năm
2025** — theo khảo sát 60.300 người của Hiệp hội An ninh mạng Quốc gia (NCA),
thực hiện 1–18/12/2025. Kẻ lừa đảo nay dựng cả phòng làm việc giả, mặc đồng phục
và gọi video để tăng độ tin cậy.

Ba con số nói rõ vì sao cần một công cụ can thiệp **trước** lúc mất tiền:

| Số liệu | Nguồn |
|---|---|
| Thiệt hại do lừa đảo trực tuyến **hơn 6.000 tỷ đồng** trong 11 tháng đầu 2025 | Bộ Công an |
| **Chỉ 32,12%** nạn nhân trình báo cơ quan chức năng; **12,03%** chấp nhận mất, không làm gì | NCA, khảo sát 60.300 người, 12/2025 |
| Tỷ lệ nạn nhân 2025 là **0,18%** (1/555 người), giảm từ 0,45% năm 2024 | NCA |

Hai phần ba nạn nhân không báo với ai. Nghĩa là **can thiệp sau khi mất tiền gần
như không xảy ra** — chỉ còn cách chặn ở đúng lúc kẻ lừa đảo đang gọi.

Người cao tuổi dễ bị nhắm vì ba lý do cùng lúc: khoảng cách kỹ năng số, thường
sống một mình và ít giao tiếp nên dễ tin một giọng nói quan tâm, và kẻ lừa đảo
tiếp cận bằng đúng giọng điệu người nhà. Ở Mỹ, thiệt hại ở nhóm trên 60 tuổi năm
2024 là **2,4 tỷ USD, tăng 26,3%** so với năm trước (FTC) — đây không phải vấn đề
riêng của Việt Nam.

Và cái khó không phải thiếu thông tin cảnh báo — mà là **lúc đang bị gọi, người ta
không có ai để hỏi trong 60 giây tiếp theo.**

> **Nguồn** *(truy cập 18/8/2026 — nên kiểm lại trước khi nộp, số liệu có thể được
> cập nhật)*:
> · [Hiệp hội An ninh mạng Quốc gia — khảo sát an ninh mạng 2025](https://antoanthongtin.vn/tin/nguoi-dung-viet-nam-thiet-hai-hon-6000-ty-dong-do-lua-dao-truc-tuyen-trong-nam-2025)
> · [Báo Chính phủ — Dự báo 2026: mức độ tinh vi của lừa đảo trực tuyến sẽ tăng](https://baochinhphu.vn/du-bao-nam-2026-muc-do-tinh-vi-cua-cac-hinh-thuc-lua-dao-truc-tuyen-se-tang-102260107101756364.htm)
> · [VnEconomy — Ngăn chặn lừa đảo tài chính nhắm vào người cao tuổi](https://vneconomy.vn/bao-ve-nguoi-cao-tuoi-truoc-nguy-co-lua-dao-tai-chinh-online.htm)

## Cách giải quyết

Ba đường vào, một bộ luật, và một nguyên tắc không đổi: **app không bao giờ nói
nó biết nhiều hơn thứ nó thật sự đọc được.**

| Đường vào | Dùng khi |
|---|---|
| **Bộ hỏi nhanh 4 nhánh** | Đang áp điện thoại vào tai, không gõ được. Chạm 1 lần, trả lời 2–3 câu CÓ/KHÔNG, ra kết luận trong ~8 giây |
| **Dán tin nhắn / chia sẻ từ Zalo** | Nhận được tin đáng ngờ |
| **Chụp ảnh màn hình · quét QR · nói ra** | Không biết gõ lại nội dung |

**Người đang bị lừa không phải tự mở app.** Trên Android:

- Tin nhắn đến mang từ hai dấu hiệu trở lên — đòi mã kèm thúc ép, tên cơ quan kèm đòi
  chuyển tiền — máy hỏi *"Bác có muốn kiểm tin nhắn này không?"*. Bước sàng lọc chạy
  ngay trên máy, không mạng, không AI, không tự kết luận; chưa gửi gì đi khi bác chưa bấm.
- Kết quả **Nguy hiểm cao** thì dải cảnh báo hiện đè lên màn hình đang dùng, kể cả màn
  cuộc gọi, và luôn có nút tắt.
- Bong bóng nổi ở mép màn hình: kiểm tin nhắn, gửi ảnh đi kiểm, dừng 60 giây.
- Cuộc gọi kéo dài bất thường thì app hỏi đúng một câu: có ai đang bảo bác chuyển tiền
  không? App chỉ đếm thời gian, không nghe nội dung.

Quyền nào được xin, dữ liệu nào đi đâu, và những gì app từ chối lấy:
[PERMISSIONS-AND-POLICY.md](PERMISSIONS-AND-POLICY.md).

**Cho gia đình:** đội phản ứng nhanh tối đa ba người, mỗi người một việc (gọi đầu tiên,
lo ngân hàng, lo điện thoại) — mọi nút "gọi con cháu" trỏ cùng một người theo tình huống,
và luôn là bác tự bấm gọi; theo dõi 72 giờ sau sự cố với lời nhắc ở mốc 2 · 24 · 48 · 72
giờ; cảnh báo chính thức có đường dẫn tới trang `.gov.vn`, chỉ hiện khi đã có người duyệt
ký tên; số tổng đài ngân hàng chỉ hiện sau khi có người đối chiếu với trang chính thức
của ngân hàng.

**Chưa làm được, nói thẳng:** cảnh báo chưa gửi tới được máy người thân (cần ghép cặp
máy và dịch vụ đẩy thông báo); app không chặn được cuộc gọi hay giao dịch; không lấy lại
được tiền đã chuyển.

---

## Kiến trúc: AI đọc hiểu, luật cứng quyết định

```
Người dùng ──► Tầng luật (CPU, <50ms) ──┬──► đủ rõ  ──► Kết luận ngay, KHÔNG gọi AI
                                        │
                                        └──► cần đọc hiểu ──► LLM trích tín hiệu
                                                                     │
                                                       Bộ luật quy đổi ra mức
```

**Vì sao tách làm hai.** Một mô hình ngôn ngữ không được phép là thứ quyết định
người dùng có mất 50 triệu hay không: nó có thể bịa, và nó có thể bị chính tin
nhắn của kẻ lừa đảo dụ. Nên AI làm việc nó giỏi nhất — đọc hiểu tiếng Việt đời
thường, viết tắt, không dấu, lẫn tiếng lóng — còn quyết định cuối cùng đi qua một
bộ luật **kiểm tra được, giải thích được, và không thể bị dụ bằng câu chữ**.

**Và AI là không thể thiếu.** Đo trên bộ 445 mẫu: bỏ tầng AI đi, độ nhạy phát hiện
rơi từ **67,6% xuống 3,8%**. Không luật nào hay biểu thức chính quy nào đọc được
một câu người thật viết ra.

### Bốn luật bất biến

1. **Ba nhãn, không có nhãn thứ tư.** `Nguy hiểm cao` · `Nghi ngờ` ·
   `Chưa thấy dấu hiệu rủi ro`. **Không có nhãn "An toàn"** — hệ thống không hứa
   an toàn, nó chỉ nói chưa thấy dấu hiệu *trong thông tin được cung cấp*.
2. **"Không kiểm được" ≠ "đã kiểm, không thấy gì".** Mỗi kết quả đều mang danh
   sách `chuaKiem`, hiện **cùng cỡ chữ với nhãn**: chưa nghe được cuộc gọi, không
   đọc được ảnh, lượt này không có AI đọc…
3. **Mọi thứ thêm vào chỉ được làm TĂNG cảnh giác.** Trả lời "KHÔNG" trong bộ hỏi
   nhanh **không trừ điểm** — nó nghĩa là "chưa thấy dấu hiệu này", không phải
   bằng chứng vắng mặt.
4. **Luôn có lối ra.** Kể cả ở màn khẩn cấp, luôn có nút *"Tôi ổn, không có gì
   nguy hiểm"* — báo động giả mà không thoát được thì người ta gỡ ứng dụng.

---

## Chạy AI ngay trên máy

App nói giao thức OpenAI nên cắm thẳng vào **Ollama / llama.cpp / LM Studio**:

```bash
LLM_CUC_BO=1
LLM_CUC_BO_MODEL=qwen2.5:3b-instruct-q4_K_M
```

Khi đó **nội dung tin nhắn không rời khỏi máy**, và màn kết quả tự hiện dòng
🔒 *"AI chạy ngay trên máy này"*. Xem [HUONG-DAN-AI-CUC-BO.md](HUONG-DAN-AI-CUC-BO.md).

Mô hình 3B lượng tử hoá 4-bit được chọn **vì** GPU đích chỉ có 4 GB VRAM — ràng
buộc phần cứng quyết định lựa chọn mô hình, không phải ngược lại.

## Tiêu thụ năng lượng

Thiết kế để **giảm** số lượt gọi AI, không phải tăng:

- Tầng luật trả kết quả dưới 50ms; khi tín hiệu đã đủ rõ, máy chủ **kết luận
  luôn và không gọi mô hình lượt nào**.
- Hạ mức suy luận: token sinh ra giảm từ ~1.796 xuống ~427 mỗi lượt (−76%), thời
  gian từ 23,5s xuống 6,7s — mà độ nhạy còn **tăng** từ 62,5% lên 71,9%.
- **Không huấn luyện mô hình mới.**

## Quyền riêng tư

- Máy chủ **không lưu nội dung thô**. Bản ghi vụ việc chỉ mang thực thể đã trích.
- CSP `default-src 'self'` — không một ảnh, font hay lượt gọi nào ra máy chủ ngoài.
- Không đồng bộ tài khoản mặc định.
- ⚠️ **Một ngoại lệ được khai báo thẳng trong app:** nút nói dùng Web Speech API
  của trình duyệt, và API đó gửi âm thanh lên máy chủ của hãng trình duyệt. Màn
  ghi âm nói rõ điều này thay vì im lặng.

## Tiếp cận

Sàn cứng, có test chặn: vùng chạm ≥52px (nút chính ≥56px), cỡ chữ ≥14px ở cả ba
bậc 15/17/20px, tương phản 4,5:1, không cắt dấu tiếng Việt, nhãn ARIA cho nút chỉ
có biểu tượng, chạy được khi mất mạng.

---

## Công nghệ

| Tầng | Dùng gì |
|---|---|
| Giao diện | React 19 · TypeScript (strict) · Vite 6 · Tailwind 4 · PWA + service worker |
| Máy chủ | Node · Express · bộ luật thuần, không phụ thuộc mạng |
| AI | LLM qua giao thức OpenAI — chạy cục bộ (Ollama) hoặc qua gateway |
| Đo lường | Bộ eval 571 mẫu giữ riêng, 1.229 test tự động |

## Chạy thử

```bash
npm install
npm run dev
```

```bash
npm test
```

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `backend/src/analysis/decision-engine.js` | **Bộ luật duy nhất** ra mức rủi ro |
| `backend/src/analysis/critical-overrides.js` | 10 tổ hợp buộc vào chế độ bảo vệ |
| `backend/src/bo-hoi-nhanh.js` | Bộ hỏi nhanh lúc đang bị gọi |
| `src/catalog.ts` | Mã → chữ hiển thị (đổi ngôn ngữ không đổi được kết luận) |
| `src/config/ma-hop-dong.json` | Hợp đồng mã giữa hai nửa |
| `test/hop-dong.test.mjs` | Hàng rào cho các luật bất biến |
| `PERMISSIONS-AND-POLICY.md` | Thang quyền, dữ liệu đi đâu, những gì app từ chối lấy |

## Mục tiêu Phát triển Bền vững

Khoan Đã hướng tới bốn chỉ tiêu SDG của Liên Hợp Quốc:

| SDG | Chỉ tiêu | Liên hệ |
|---|---|---|
| **16** Hoà bình, công lý | 16.4 giảm dòng tiền bất hợp pháp và tội phạm có tổ chức | Lừa đảo trực tuyến ở Việt Nam do các nhóm có tổ chức thực hiện; chặn ở phía nạn nhân là cắt dòng tiền tại nguồn |
| **10** Giảm bất bình đẳng | 10.2 hoà nhập cho mọi lứa tuổi | Người cao tuổi bị đẩy ra khỏi thế giới số vì sợ bị lừa; app hạ rào cản thay vì bảo họ tránh xa |
| **3** Sức khoẻ và hạnh phúc | 3.4 sức khoẻ tinh thần | Mất tiền tiết kiệm cả đời gây sang chấn kéo dài — hậu quả không dừng ở tiền |
| **4** Giáo dục chất lượng | 4.4 kỹ năng số | Module Bài học dạy nhận diện chiêu trò, không chỉ cảnh báo từng vụ |

## Con đường đưa tới người dùng

1. **PWA** — cài từ trình duyệt, không qua cửa hàng ứng dụng, không cần tài khoản.
2. **Con cháu cài cho bố mẹ** — đây là con đường thật: người cao tuổi hiếm khi tự
   tìm app, nhưng con cháu tìm hộ. Bảng điều khiển cho con cháu phục vụ đúng việc đó.
3. **Hội người cao tuổi, tổ dân phố, thư viện phường** — nơi đã có sẵn niềm tin và
   có người hướng dẫn trực tiếp.
4. **Mã nguồn mở** — bất kỳ ai cũng kiểm được bộ luật quyết định mức rủi ro. Với
   một app nói "đừng tin ai", việc tự nó kiểm chứng được là điều kiện cần.

Chi phí vận hành gần bằng không khi chạy mô hình cục bộ, nên không phụ thuộc vào
nguồn tài trợ để tiếp tục sống.

## Ghi nhận

Dự án dùng công cụ AI hỗ trợ trong quá trình phát triển. Các quyết định thiết kế
và ràng buộc an toàn — ba nhãn rủi ro, nguyên tắc "không kiểm được ≠ đã kiểm",
danh sách câu không được viết — do nhóm đặt ra và được ghi lại trong `CLAUDE.md`.
