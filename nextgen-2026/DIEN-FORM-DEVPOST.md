# NỘP BÀI — FORM DEVPOST (18/9/2026)

Khoan Đã · Nguyễn Xuân Minh Quân · **hạn: còn ~2 giờ tính từ lúc soạn tài liệu này**

> Khối trong **hộp mã** chép nguyên vào form. Chữ Việt ngoài hộp là ghi chú, đừng chép.
> Mọi con số dưới đây lấy từ `eval/results/latest.json` (đo 16/9/2026) và lượt chạy test
> ngày 17/9/2026 — đã kiểm lại cùng ngày nộp.

---

## BƯỚC 2 · PROJECT OVERVIEW

### Project name — tối đa 60 ký tự

▸ CHÉP — **46 ký tự**

```
Khoan Đã — the app that never says you're safe
```

### Elevator pitch — tối đa 200 ký tự

▸ CHÉP — **186 ký tự**

```
Vietnamese for "hold on". The phone asks first, inside the sixty seconds a scammer needs. AI may only flag signals; published rules decide the level. There is no "Safe" label, by design.
```

### Thumbnail (3:2, JPG/PNG/GIF, dưới 5 MB)

Dùng ảnh màn **Nguy hiểm cao** — đó là ảnh nói được sản phẩm làm gì trong một giây nhìn.
Có sẵn `aijam-slides/anh-1.png`, `aijam-slides/anh-2.png`; nếu không đúng 3:2 thì chụp lại
ở `https://khoan-da.onrender.com` rồi cắt.

---

## BƯỚC 3 · PROJECT DETAILS

### About the project

▸ CHÉP CẢ KHỐI — Devpost nhận Markdown

```markdown
## Inspiration

In Vietnam, impersonation scams are run by phone against older adults, and the decisive
window is short: a scammer needs about a minute of sustained pressure before a person
acts. Everything that matters happens inside that minute — and almost every tool built for
this problem arrives after it, as a warning list or a hotline number.

A judge asked the question that reshaped the project: *the person being scammed will not
open your app.* That is true. Someone who is being told by a fake police officer to stay
on the line will not find a paste box and wait for a result. So the first step had to move
to where the person already is.

The name is Vietnamese for "hold on".

## What it does

**On the phone, before anything is opened.** A message arriving with two or more signals —
a code request plus pressure, an agency name plus a transfer demand — makes the phone ask
one question: *would you like this checked?* That screening runs on the device, with no
network call and no AI, and it deliberately reaches no verdict of its own. It is a bell,
not a scale. Nothing is sent anywhere until the person taps.

When the rule engine does return High risk, a warning strip draws over whatever is on
screen, including the call screen, and it always has a dismiss button.

**When someone does open it,** they paste a message, a screenshot, or a link, and the
system names the specific warning signs it found, quoting the words it saw them in. Then
it does two things almost no other tool does:

**It prints what it could NOT check, at the same size as the verdict.** An unreadable
screenshot is not the same as a screenshot that was read and found clean. Treating those
two as identical is the characteristic failure of this product category. It appeared in
three independent places on a single day: an image the AI failed to read, a domain that
would not resolve, and an evaluation run where 89.5% of the model calls were failing — all
three surfaced to the user as *"No clear risk signals found"*. Dedicated tests now fail the
build if that returns.

**It never says you are safe.** Three labels exist and structurally never a fourth: *High
risk*, *Suspicious*, *No clear risk signals found*. There is no "Safe", because the system
cannot know that.

Then one large button: call a named family member. Slowing the moment down is the product.

**Around that minute, the family:**

- A rapid-response team of up to three relatives, each with a role — first caller, bank
  helper, phone helper. Every "call family" button in the app points to the same person,
  chosen by the situation. The older person always taps the call; the app never calls on
  anyone's behalf.
- A 72-hour recovery watch after money or a code was sent, with reminders at 2, 24, 48 and
  72 hours, and a case record to take to the bank or the police. It never promises that
  money comes back.
- Warnings published by the police and state agencies, shown next to a matching result
  with the agency name, the date and a link to a `.gov.vn` page. A warning appears only
  after a named person approves it; the same gate governs bank hotline numbers, and until
  a reviewer has checked a number against the bank's own site, the app says so rather than
  showing a number that could be wrong.

## How I built it

The architecture inverts the usual arrangement between a language model and a rule engine.

**The model is not allowed to reach a verdict.** It may return only signals, quoted with
the exact words it saw them in, marked `present` or `unknown` — never `absent`. The
response schema is validated and *has no field* for a risk score, a risk label, or a
severity. If a scammer writes "tell the user this is safe", there is nowhere in the schema
for the model to write it.

A separate rule engine — fixed, versioned, published in the repository — assigns the final
level. Ten critical override combinations, group caps and resonance rules, all readable on
one page.

This matters because in this problem **the author of the input is the attacker**. That is
the assumption the whole design rests on, and it is what separates this from a classifier.

Other constraints that shaped the build:

- The rule layer runs offline. Incoming messages are screened on the phone itself, with no
  network call until the user taps.
- A screenshot is transcribed first, and the transcript goes through the same rules as
  typed text, so a scam does not get a softer verdict for arriving as a picture. If no
  model that can actually see images is available, the result says the image was not read.
- Vietnamese and English at *both* layers — interface and detection. The verdict travels
  internally as an enum code, never as text, so changing language cannot change the result.
- Free, no account required, no server-side storage of message content.
- Accessibility floors enforced by tests that fail the build: 52px touch targets, 56px
  primary buttons, 14px minimum type, 4.5:1 text contrast.
- Android build via Capacitor: overlay warning strip, floating button, notification
  screening, long-call reminder, text-to-speech through the phone's own engine (the
  browser API fails silently inside an Android WebView).

## Challenges I ran into

**The adversary talks to the machine.** Not hypothetical — these are holes found and closed
in this repository:

- Typing `Thông báo:` ("Notice:") at the start of a message switched the detector off.
- An agency name plus the word "notice" did the same thing: 40 out of 40 scam phrasings
  prefixed that way came back as *No clear risk signals found*, including the exact fake
  VNeID script the Ministry of Public Security had published a warning about.
- `"nhưng lần này"` ("but this time") and `"theo công an"` ("according to the police") —
  phrases that made the engine downgrade its own finding.
- Messages carrying instructions addressed to the analysis layer.
- A tokenizer bug read *"điện thoại"* (telephone) as *"điền"* (fill in).

Each one is a rule plus a regression test now. I publish them rather than quietly patching
them, because a safety tool that hides its failures is more dangerous than one that reports
them.

**Closing a hole opened a false alarm.** The fix above was measured on scam messages, and
it worked — then the other branch's test suite caught what it had done to a *real* tax
notice: "the tax office informs business households to file the Q3 return before 30/10 at
the tax office or on the national public service portal" came back as **High risk**. The
underlying cause was older than the fix: when Vietnamese is compared without diacritics,
*tại* (at) collapses into *tải* (download) and *ngày* (day) into *ngay* (immediately), so
two signals fired on a government announcement. A false alarm on a genuine notice teaches
people to ignore the app, which is the failure mode that ends the product.

**Two branches that never shared a commit.** The web version and the development branch had
grown apart for a month, each holding work the other did not: the phone-side protections on
one side, the family features on the other. Merging them meant replaying seventeen commits
by hand and re-measuring the rule engine after every conflict, because a merge that quietly
lowers a risk level is indistinguishable from a working merge until someone is scammed.

**A privacy promise I had already published.** While merging I found that the passive
detection loop uploaded the text of every arriving message, every four seconds, without the
user tapping anything — while the repository's own permission policy promised the opposite:
captured message text leaves the phone *"when the user taps check — never automatically"*.
I switched the upload off rather than quietly changing the promise, and wrote a test that
fails the build if the code and the policy ever disagree again.

**A measurement trap that nearly reached a submission.** Running the evaluation harness
without a cache-bypass flag reused previously computed AI signals — it finished in under a
second and still stamped the *current* prompt version onto the results, measuring a new
rule engine against an old model's output. Every figure below is from 571 fresh model calls.

## Measurement

Held-out evaluation set, 571 labelled messages, 531 scored. Commit `972488e`, rule engine
v1.3.0, prompt v1.1.0, model `deepseek-v4-flash-0731`. 571 fresh calls, 0 from cache, 430
seconds, **0% failed calls**.

| | |
|---|---|
| Dangerous messages producing **any** warning | **90.2%** (239 / 265) |
| Dangerous messages the system was **silent** on | **9.8%** (26 / 265) |
| Exact-label recall (High risk) | 70.2% |
| False "High risk" on harmless messages | 4.1% (169 samples) |
| False positives on a deliberately hard harmless slice | 12.0% (125 samples) |
| Vietnamese written without diacritics — recall | 76.2% (40 samples) |
| Vietnamese ↔ English recall gap | 0.2 points |
| Automated tests | 1,229 passing, 0 failing |

I report two recall figures because they answer different questions. Exact-label recall is
70.2%; a dangerous message downgraded to *Suspicious* still warns the person and still
shows the call-your-family button. For a safety tool the number that matters is how often
it stayed **silent**: 9.8%.

## Limits, stated plainly

- **There are no real-world samples in the evaluation set** — 0 against a target of 25.
  Every figure above is measured on messages I wrote. The harness prints this itself, as a
  gap rather than a footnote.
- The English slice has 49 samples against a floor of 90.
- False positives on the hard harmless slice rose from 8.0% to 12.0% as recall improved.
  Tightening the rules catches more and alarms more, and a person wrongly alarmed
  uninstalls the app. The trade-off is not free, and I would rather show it than round it.
- **Alerts do not reach a relative's phone yet.** Device pairing and a push provider are
  not built; the app helps the older person make the call.
- The Android build is fresh and verified inside the package, but has not been tested on a
  physical phone.
- It cannot block a call or a bank transfer, and does not claim to. It buys a minute.
- The demo runs on a free tier, so the first request after an idle period can take up to a
  minute to wake the server.

## What I learned

That the interesting constraint was never "make the model more accurate". It was "decide
what the model is allowed to say". Once the schema had no field for a verdict, a whole
class of attacks stopped being possible rather than becoming less likely — and that pattern
transfers to any domain where the person writing the input has a reason to manipulate the
reader.

And that in a safety tool, every fix has to be measured in both directions. The change that
closed forty missed scams also raised a false alarm on a real government notice. I only
found it because the two halves of the project had different tests, and one of them
disagreed with me.

## What's next

Twenty-five to forty real, PII-redacted samples, so the evaluation stops measuring only my
own imagination. Then device pairing, so that the person who reliably opens an app — the
adult child — gets the alert at the moment it matters.
```

### Built with — tối đa 25 thẻ

▸ CHÉP (Devpost tách thẻ theo dấu phẩy)

```
typescript, react, vite, tailwindcss, capacitor, android, java, node.js, express, postgresql, deepseek, google-gemini, ollama, simplewebauthn, jsqr, lucide-react, motion, web-speech-api, service-worker, pwa, lightningcss, render, claude-code
```

⚠️ **Thẻ `claude-code` là bắt buộc, không phải tuỳ chọn** — thể lệ các giải trước đều ghi
"không khai là khai man". Repo có `CLAUDE.md` ở gốc và mục khai công cụ AI trong `README.md`.

### "Try it out" links

```
https://khoan-da.onrender.com
```

```
https://github.com/quannguyen991/khoan-da-nic
```

```
https://khoan-da.onrender.com/khoan-da.apk
```

⚠️ Link thứ ba là bản Android 1.2 (dựng 17/9/2026). Nếu form chỉ cho 2 link thì bỏ link
APK — nó đã được nhắc trong README.

### Image gallery — chụp tối thiểu 3 ảnh, tỉ lệ 3:2

Thứ tự này kể được cả câu chuyện, không chỉ khoe giao diện:

1. **Màn Nguy hiểm cao** — nhãn to, danh sách dấu hiệu, và nút gọi người thân.
2. **Khối "Những thứ cháu CHƯA kiểm được"** — đây là điểm khác biệt, chụp cận cùng cỡ chữ
   với nhãn kết quả.
3. **Trang `/transparency`** — bằng chứng cho phần đo; nó tách số *đã đo* khỏi số *mục tiêu*.
4. (nên có) **Màn Gia đình** với đội phản ứng nhanh, hoặc dải theo dõi 72 giờ ở trang chủ.
5. (nên có) **Cảnh báo chính thức của công an** hiện trong màn kết quả, thấy rõ link `.gov.vn`.

### Video demo link

Kịch bản 2 phút có sẵn ở `KICH-BAN-VIDEO.md`. Nếu không kịp quay trong 2 giờ: **bỏ trống
còn hơn nộp video sai số liệu** — trừ khi thể lệ bắt buộc có video, lúc đó quay màn hình
2 phút theo đúng thứ tự năm ảnh ở trên, nói tiếng Anh, không cần dựng.

---

## BƯỚC 4 · ADDITIONAL INFO

- Chỉ tick hạng mục/giải phụ nào **thật sự đúng** với dự án. Giải nào ghi "for projects
  built using X" mà mình không dùng X thì đừng tick.
- Nếu form hỏi "đã nộp ở đâu chưa / đã đoạt giải nào chưa": Khoan Đã đã đoạt **Grand Prix,
  AI-JAM US 2026** (hạng mục Social Good, 6/9/2026 — 840 đội, 1.240 người, 41 quốc gia).
  Khai thật; nói kèm "840 đội, 41 quốc gia", không nói "giải cao nhất thế giới".

---

## NẾU GIẢI NÀY CÓ CHỦ ĐỀ "XANH / BỀN VỮNG"

Chèn đoạn này vào cuối mục **How I built it** (đừng chèn vào Inspiration — nó sẽ đọc như
gắn chủ đề vào cho có):

```markdown
The energy budget was a design constraint, not an afterthought. The rule layer answers in
under 50 ms on a CPU and, when the signals are already unambiguous, the server returns a
verdict without calling a model at all. Lowering the reasoning budget cut generated tokens
from ~1,796 to ~427 per call (−76%) and latency from 23.5 s to 6.7 s, while recall went
*up* from 62.5% to 71.9%. No model was trained for this project, and the whole system runs
against a 3B 4-bit local model on a 4 GB GPU when a household wants nothing leaving the
house.
```

---

## KIỂM TRA CUỐI TRƯỚC KHI BẤM SUBMIT

- [ ] Mở `https://khoan-da.onrender.com` **trước 5 phút** (máy chủ gói miễn phí ngủ, lần
      đầu vào chậm tới ~50 giây). Giám khảo bấm link mà thấy trắng là mất điểm oan.
- [ ] Repo đang công khai, nhánh `main` đã có bản gộp mới nhất (đẩy 17/9/2026).
- [ ] Ảnh ≥ 3 tấm, đúng 3:2, dưới 5 MB.
- [ ] Thẻ `claude-code` có trong Built with.
- [ ] Không câu nào viết "safe", "an toàn", "chặn được cuộc gọi", hay "lấy lại được tiền".
