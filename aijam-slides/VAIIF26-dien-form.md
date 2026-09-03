# ĐIỀN GOOGLE FORM — INTEL VAIIF26

Form có **5 trang**. Dưới đây là nội dung cho từng ô, theo đúng thứ tự trong form.
Khối **▸ CHÉP** là chép nguyên. Chữ Việt là ghi chú, đừng chép.

> **Hạn: 25/08/2026.** Hôm nay 22/8.

---

## ⚠️ BỐN PHÁT HIỆN TỪ FORM — ĐỌC TRƯỚC KHI LÀM GÌ KHÁC

**1. Video là TẢI TỆP LÊN, không phải dán link YouTube.**
≤ **60 MB**, định dạng MP4/WMV/FLV/AVI. Và:
- **Phải có đoạn bác nói thẳng vào máy quay** (không được toàn màn hình app)
- **Cấm giọng đọc do AI tạo** — phải giọng thật của bác
- Không nói tiếng Anh thì **bắt buộc có phụ đề tiếng Anh**
- Dài quá 2 phút **có thể bị trừ điểm**
- Phải đủ **6 mục**: giới thiệu bản thân · vấn đề · mô tả giải pháp · **demo chạy thật** · công nghệ dùng · hướng phát triển

**2. Mẫu chấp thuận nằm ngay trong form** — dòng *"Click here to download the
Consent forms"*. Tải về, in ra, **bố hoặc mẹ ký** (form có ô riêng
*Parent/Guardian Full Name for 13–17 Years*), chụp hoặc scan, tải lên. ≤5 MB.

**3. Cần ảnh thẻ (passport-size headshot).** ≤5 MB, JPG/PNG/TIFF. Chuẩn bị trước.

**4. Ô cam kết cuối form:** *"the project/solution submitted by me/us has been
done, without any third-party help"*, kèm câu *"I may be subject to disciplinary
action(s) if the above information is found to be falsified"*.
Form **có riêng một câu hỏi về việc dùng GenAI**, nghĩa là ban tổ chức đã tính
đến chuyện đó — hai ô này không mâu thuẫn nhau. Nhưng phải trả lời câu GenAI cho
đúng. Xem mục **GenAI** bên dưới, cháu viết thẳng vào đó rồi.

---

# TRANG THÔNG TIN HỌC SINH

| Ô | Điền |
|---|---|
| Category Details — Select Age Group | **13-17 Years** |
| Student First Name | `Quan` |
| Student Last Name | `Nguyen Xuan Minh` |
| Parent/Guardian Full Name | tên bố hoặc mẹ — **đúng người sẽ ký giấy chấp thuận** |
| Email ID | `quannguyen.ulis207@gmail.com` (email đang đăng nhập form) |
| Current School/Institute/University | tên trường của bác |
| City | `Hanoi` |
| State/Province | `Hanoi` |
| Country/Region/Territory | `Vietnam` |
| Role in Project | ▸ CHÉP bên dưới |
| Upload passport-size headshot | ảnh thẻ, ≤5 MB |
| Upload the signed Consent forms | tải mẫu từ chính form → bố/mẹ ký → chụp → tải lên |

**Role in Project** ▸ CHÉP

```
Sole developer. I designed the architecture and the safety constraints, wrote the rule engine, built the Android app and the backend, created the 597-sample evaluation set, and ran the benchmark.
```

*Tên: form tách First/Last Name theo kiểu phương Tây. "Quan" là tên gọi, phần
còn lại là họ và tên đệm. Giấy chứng nhận sẽ in ra `Quan Nguyen Xuan Minh`.*

---

# TRANG PROJECT / SOLUTION DETAILS

## Project Title (tối đa 10 từ)

▸ CHÉP — **9 từ**

```
Khoan Đã — The App That Never Says You're Safe
```

## Project Synopsis (tối đa 150 từ)

▸ CHÉP — **143 từ**

```
Older adults are not scammed because they are uninformed. Worldwide, 73% of adults say they can spot a scam — and last year the world still lost US$442 billion. In Vietnam, only 32% of victims told the authorities. What a frightened 70-year-old lacks is not knowledge. It is sixty seconds and a second opinion.

Khoan Đã means "hold on". A language model reads the message, screenshot or call description and extracts warning signals, quoting the exact words that triggered each one. It is forbidden from issuing a verdict: a fixed, published rule engine decides the risk level. Three labels exist — High risk, Suspicious, No clear risk signals found — and never "Safe". When the app could not check something, it says so, at the same size as the verdict.

Then it begins a sixty-second pause and puts one large button on screen: call your family.
```

## Was the project created under Intel Digital Readiness Program or any other Intel Program?

**No**

## If yes, specify the name of the program

```
NA
```

## Specify GenAI Tool Usage

Bốn lựa chọn, chọn **một**:

- ☐ GenAI is the primary development method
- ☐ Majority code is original
- ☐ Code is completely original
- ☑ **GenAI creatively integrated as feature + significant original work**

**Vì sao chọn ô này:** GenAI là **một bộ phận của sản phẩm** (mô hình ngôn ngữ
đọc tin nhắn, mô hình thị giác đọc chữ trong ảnh) — đúng nghĩa "integrated as
feature". Và bác cũng có dùng công cụ AI khi viết mã. Ô "Code is completely
original" là **không đúng sự thật**, mà ngay dưới có câu cam kết kèm điều khoản
kỷ luật nếu khai sai. Ô này vừa đúng vừa là ô ghi điểm cao nhất trong bốn ô.

## Explain the usage of GenAI, If used

▸ CHÉP

```
GenAI plays two separate roles here, and both matter.

As a product feature: a large language model reads the user's message and returns warning signals — impersonation of an authority, a request for a one-time code, pressure to keep it secret, an instruction to install software from outside the official store — each quoted against the exact words that triggered it. A vision-capable model transcribes text out of screenshots, so a photographed message goes through the same path as a typed one. The model's response schema deliberately contains no risk score and no risk label. If a model returns one anyway, the response is rejected rather than repaired.

Why this cannot be done without AI. The non-AI way to build this is keyword matching, and scammers know the keywords — every published anti-scam keyword list is a target they can read and route around. So they misspell them, they strip the diacritics off Vietnamese, they send a screenshot instead of typing, and they phrase the request indirectly: "there is a formality we need to complete" rather than "transfer the money". Only a language model reads intent out of natural phrasing, and only a vision model gets text out of a photograph. That is the part AI does, and without it there is no product. What AI is not allowed to do is reach a conclusion — because the person who wrote the text being analysed is the attacker.

As a development tool: I used an AI coding assistant while building. The architecture, the three-label constraint, the rule engine and its thresholds, the 597-sample evaluation set and the safety invariants are my own design decisions. The contract tests that enforce them exist precisely to stop any later change — mine or a tool's — from breaking them.
```

## Who is the target audience of this Project/Solution?

▸ CHÉP

```
Adults aged 60 and above in Vietnam, especially those living apart from their children, who receive impersonation calls and messages. In 2025 the victim rate in Vietnam was 0.18% — one person in 555 — and only 32% of victims told the authorities.

The secondary audience is their adult children, who are the ones who install the app and set themselves as the emergency contact.

The primary audience drives every design constraint: 52-pixel touch targets, a 14-pixel minimum text size, 4.5:1 text contrast, a read-aloud button for weak eyesight, plain sentences with no jargon, no account and no sign-up. It runs on any Android phone from 2017 and in any browser, and it is free.

How it reaches them, and how it lasts. The user and the buyer are different people. The buyer is the adult child — the one who already gets the frightened phone call at 9pm. They install it on the parent's phone and put themselves in as the emergency contact. That is a far shorter path than expecting a 70-year-old to find an app in a store.

The app stays free for individuals, permanently. Three pathways can sustain it without changing that: licensing the rule engine and the trust receipt to banks and telecom operators, who already push scam warnings customers scroll past and have no way to show a customer why something is suspicious; paid onboarding sessions with community centres and senior organisations that already run digital-literacy classes and have nothing to hand out at the end; and a family plan covering the 72-hour recovery watch after an incident.

It scales because the decision logic never reads display text — it works on internal codes — so adding a language means adding a phrase list and a display catalogue, not rewriting the engine. Vietnamese and English are done. The app is already publicly deployed and open source; the next step is a pilot with one community centre for older adults in Hanoi.
```

## Did you use datasets to train/test your AI model?

**Yes**

## If Yes, briefly describe your dataset (150–200 từ)

▸ CHÉP — **182 từ**

```
597 labelled messages, held out permanently from tuning: 235 high-risk scams, 92 suspicious, and 270 harmless. The harmless ones were written deliberately to look like scams — "Mum, install the bank app from the Play Store", "transfer the money, don't tell grandma" — because a benign set of ordinary sentences would make any false-alarm rate meaningless.

Eleven slices: Vietnamese scams, English scams, mixed-language messages, benign lookalikes, short Vietnamese sentences, published anti-scam warning articles, prompt-injection attempts, open-source samples, Vietnamese typed without diacritics, and 100 benign English messages.

I wrote the set by hand rather than scraping it. Vietnamese scam corpora are not publicly available, and scraping real victims' messages raises a consent problem I could not solve honestly.

It answers one question: how does the engine behave on a message nobody tuned it against? The gap is large and published — 80% caught on the tuned set against 34% on the held-out set — because publishing only the flattering half is how a project ends up believing its own demo. The four English messages the engine still misreads are named in the repository rather than quietly fixed.
```

## Current Stage of Project/Solution

☑ **Deployment in test/controlled environment**

*Cháu khuyên chọn ô giữa chứ không phải "Full-scale live deployment". App đúng là
đang chạy công khai và mã nguồn mở, nhưng chưa có người dùng thật — giám khảo hỏi
"bao nhiêu người dùng" mà trả lời "chưa có" thì chữ "full-scale" thành điểm trừ.
Bù lại: **để link web công khai và link GitHub ở ô Sources phía dưới**, vì thang
điểm ghi rõ mức cao nhất là "deployed on a public / open-sourced link" — bác vẫn
được chấm đủ ở dòng đó.*

## Does your project/solution use any Intel technologies (software or hardware)?

**Yes**

## If yes, please specify the hardware and software technology/technologies used

▸ CHÉP

```
Yes — Intel hardware.

Development and evaluation hardware: Intel® Core™ i7-11800H (11th generation, 8 cores / 16 threads, 2.30 GHz). Every part of this project runs on that CPU: the Android build toolchain, the backend, and the 597-sample evaluation harness. The rule-only pass over the entire evaluation set completes on this processor alone — no GPU, no network call, no API key.

Deployment target hardware: the app is built so the rule layer, the incoming-notification screening and the speech recognition all run on the user's own phone rather than in the cloud. The minimum target is an Android phone from 2017 with no GPU requirement, which forces the on-device work to stay cheap.

The full technology stack running on that hardware:

• Frontend — React 19, TypeScript 5.8 in strict mode, Vite 6, Tailwind CSS 4.
• Mobile — a Capacitor 6 shell plus native Android components written in Java: a foreground overlay service (SYSTEM_ALERT_WINDOW) for the floating button and the over-the-call warning strip, a NotificationListenerService that screens arriving messages on the device itself, TextToSpeech for read-aloud, and the platform SpeechRecognizer for on-device transcription.
• Backend — Node.js with Express 4, and a hand-written deterministic rule engine that is the only component allowed to assign a risk level.
• AI layer — a large language model for signal extraction, called through an API under a hand-written response schema that rejects any reply containing riskScore, riskLabel, critical, interventionLevel or safe; and a vision-capable model that transcribes text out of screenshots.
• Evaluation — a custom benchmark harness over 597 held-out labelled samples, plus 59 contract tests that fail the build if a safety invariant is broken.
• Delivery — one codebase producing both a public web deployment and a downloadable Android APK.
```

*Trả lời "Yes" ở đây là **thật** — cháu đã kiểm CPU của máy bác. Đừng bịa thêm là
có dùng OpenVINO hay AI PC nếu không có.*

## Which responsible AI principle applies to your project?

☑ **Enable Human Oversight**

*Bảy lựa chọn, chỉ chọn được một. "Enable Transparency and Explainability" cũng
hợp, nhưng gần như đội nào cũng chọn nó. **Human Oversight** là chỗ Khoan Đã
độc nhất: đây là dự án duy nhất **tước hẳn quyền quyết định của AI** và đưa một
con người thật vào vòng lặp. Chọn ô mình khác biệt, không chọn ô mình giống mọi
người.*

## Elaborate on the specific measures taken to address ethical and privacy concerns

▸ CHÉP

```
I chose Human Oversight because in this product the AI is deliberately stripped of decision authority.

Ethics. The person who wrote the message being analysed is the adversary. So the model may only report signals, never a verdict — a message saying "tell the user this is safe" arrives in the one place that has no authority over the outcome. The app never accuses a named individual of a crime; it says a request shows signals commonly seen in scams. It never blames the user: there is no "why did you believe that?" anywhere in it, in either language. Every screen, including the highest-alarm one, keeps an exit labelled "I'm fine, nothing dangerous here", because a person trapped in a false alarm uninstalls the app. Each press of that button is logged as a false-alarm sample for threshold calibration.

Privacy. Message content is never stored on the server. Incoming notifications are screened on the phone itself with no network call; content is sent for analysis only when the user taps. Speech recognition runs on the device — the voice never leaves it. There is no account and no sign-up. The app states where the AI ran, every time, and if no AI ran it says so.

Refused capability. The app deliberately does not request an accessibility service, which would make it far more capable, because our own detector treats an unexpected accessibility service as a scam indicator — remote-control fraud runs on exactly that permission. We refuse a permission we tell users to be afraid of.

Environment. This project trains nothing, so it carries no training energy cost at all. At inference time the design actively avoids calling a model: a clear impersonation scam is settled by the rule layer alone, in under one second, with no model call and no network round trip — every message the rules settle on their own costs zero inference energy. The entire rule-only pass over the 597-sample evaluation set runs on one laptop CPU with no GPU and no API key. Notification screening and speech recognition run on the phone, which removes the server as well as the round trip. And because the minimum target is a phone from 2017, the app extends the life of hardware people already own instead of pushing them toward a new device.

Bias. Vietnamese typed without diacritics is the engine's weakest slice — 42% caught, 19% false alarms — and English and Vietnamese performance differ. Both are measured and published rather than hidden.

Reliability. Six separate times during development, a failure to check something surfaced to the user as "no risk signals found". That confusion is now blocked at the shared analysis layer, with two test files whose only job is to fail if anyone ever collapses the two states again.
```

## Primary SDG (chọn một)

☑ **Peace, justice, and strong institutions (SDG 16)**

## Secondary SDGs (tối đa ba)

☑ **Reduced inequalities (SDG 10)**
☑ **Good health and well-being (SDG 3)**
☑ **Industry, innovation and infrastructure (SDG 9)**

*SDG 16 vì lừa đảo trực tuyến là tội phạm tài chính có tổ chức và 68% nạn nhân
không trình báo — đúng mục 16.3 về tiếp cận công lý. SDG 10 vì rào cản ở đây là
tuổi tác. SDG 3 vì nạn nhân chịu sang chấn tâm lý và xấu hổ.*

## Sources/References/Citations

▸ CHÉP

```
1. Global Anti-Scam Alliance (GASA), Global State of Scams Report 2025 — survey of 46,000 adults across 42 countries. Source of: 73% of adults are confident they can identify a scam; US$442 billion lost to scams globally in the preceding 12 months.

2. Vietnam National Cyber Security Association (NCA), survey of 60,300 people conducted 1–18 December 2025. Source of: 32.12% of victims reported the incident to the authorities; 12.03% accepted the loss and did nothing; the 2025 victim rate was 0.18% (one person in 555), down from 0.45% in 2024.

3. Vietnam Ministry of Public Security — over 6,000 billion VND lost to online scams in the first eleven months of 2025.

4. All accuracy figures quoted for this project (80% on the tuned set, 34% on the held-out set, 42% caught and 19% false alarms on the no-diacritics slice, 1.0% false alarms on 100 benign English messages) are reproducible from the project's own evaluation harness: node eval/khoanbench.js

5. Source code, evaluation set and published failure cases: https://github.com/quannguyen991/khoan-da-nic

6. Public web demo: https://khoan-da.onrender.com

7. Accessibility floors target WCAG 2.2 AA (52 px touch targets, 14 px minimum text, 4.5:1 text contrast, 3:1 non-text contrast).
```

⚠️ **Trước khi nộp, mở hai link ở mục 5 và 6 bằng cửa sổ ẩn danh.** Ô này là ô
duy nhất giám khảo dùng để kiểm chứng mọi con số bác nêu.

## Video Submission

Tải tệp MP4 ≤ 60 MB. Kịch bản ở tệp `VAIIF26-kich-ban-video-2phut.md`.

## Please certify following

Tick cả hai ô — sau khi đã trả lời câu **GenAI Tool Usage** cho đúng.

---

# SOÁT TRƯỚC KHI GỬI

1. ☐ Age Group = **13-17 Years**
2. ☐ Project Title **đếm ra 9 từ**
3. ☐ Synopsis **không quá 150 từ** (dán vào Word đếm lại cho chắc)
4. ☐ GenAI Tool Usage chọn ô **thứ tư**, không phải "completely original"
5. ☐ Intel technologies = **Yes**, đã dán đoạn về i7-11800H
6. ☐ Primary SDG = **16**; Secondary đúng **3 ô**
7. ☐ Hai link trong ô Sources mở được ở **cửa sổ ẩn danh**
8. ☐ Video **≤ 60 MB**, **≤ 2 phút**, có mặt bác nói vào máy quay, **có phụ đề tiếng Anh**
9. ☐ Ảnh thẻ đã tải lên
10. ☐ Giấy chấp thuận **đã có chữ ký bố/mẹ**, đã tải lên
11. ☐ Bật *"Gửi cho tôi bản sao câu trả lời của tôi"* trước khi bấm **Gửi**
