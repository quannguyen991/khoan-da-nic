# NỘP BÀI — GIBC V2 (Devpost)

Khoan Đã · Nguyễn Xuân Minh Quân · hạn **21/9/2026, 22:45 giờ Việt Nam** · **Track 03 · Open**

Khối trong **hộp mã** chép nguyên vào form. Chữ Việt bên ngoài là ghi chú, đừng chép.

---

## PHẦN 0 · CHỌN TRACK NÀO, VÀ VÌ SAO KHÔNG PHẢI TRACK 02

Track 02 (Applied — Med/Finance) nêu đích danh *fraud detection*, nên thoạt nhìn là chỗ
của Khoan Đã. **Đừng nộp vào đó.** Câu mở đầu của track là:

> *"Build a data-driven system on **real, empirical datasets**…"*

Bộ đo Khoan Đã tự in ra dòng: **0/25 mẫu thật — mọi số đo trên mẫu tự soạn.** Nộp vào
Track 02 là tự dẫn giám khảo tới đúng chỗ mình yếu nhất, ngay ở dòng đầu tiên của thể lệ.

**Track 03 (Open)** đòi *"technical novelty and cross-disciplinary engineering"*, không đòi
dữ liệu thực nghiệm, và ví dụ họ nêu có *"a full-stack application aimed at a community
problem"*. Khoan Đã vào đó không hở sườn nào.

---

## PHẦN 1 · SÁU THÀNH PHẦN BẮT BUỘC — TÌNH TRẠNG

| # | Bắt buộc | Tình trạng |
|---|---|---|
| 01 | Mô tả dự án | ✅ Phần 3 dưới đây |
| 02 | **Repo công khai + README chạy được** | ⚠️ repo công khai rồi, nhưng **README tiếng Việt** |
| 03 | **Video demo 2–5 phút**, tiếng Anh hoặc phụ đề Anh | ❌ **chưa có** |
| 04 | Built with | ✅ Phần 4 |
| 05 | Thông tin đội, tên thật, có tài khoản Devpost | ✅ làm một mình |
| 06 | **≥ 3 ảnh chụp chất lượng cao** | ⚠️ có `anh-1.png`, `anh-2.png` — cần thêm |

**Hai việc chặn thật:** video và ảnh. Không có video là **không được chấm**, không phải
trừ điểm.

**Việc nên làm dù không bắt buộc:** thêm một mục tiếng Anh vào `README.md`. Thể lệ đòi
*"documentation clear enough that another developer could understand, run, and build on
top of your work"*, mà ban giám khảo là hội đồng quốc tế. README hiện tại chỉ có tiếng
Việt — mất điểm ở đúng dòng tiêu chí đó.

---

## PHẦN 2 · PROJECT OVERVIEW

### Project name — tối đa 60 ký tự

▸ CHÉP ĐOẠN NÀY — **46 ký tự**

```
Khoan Đã — the app that never says you're safe
```

### Elevator pitch — tối đa 200 ký tự

▸ CHÉP ĐOẠN NÀY — **191 ký tự**

```
Vietnamese for "hold on". It helps older adults survive the sixty seconds a scammer needs. The AI may only flag signals; published rules decide the level. There is no "Safe" label, by design.
```

### Thumbnail

3:2, JPG/PNG/GIF, dưới 5 MB. Dùng `aijam-slides/anh-1.png` nếu đúng tỉ lệ; không thì chụp
màn khẩn cấp trên `khoan-da.onrender.com` rồi cắt 3:2.

---

## PHẦN 3 · ABOUT THE PROJECT

▸ CHÉP CẢ KHỐI NÀY — Devpost nhận Markdown

```markdown
## Inspiration

In Vietnam, impersonation scams are run by phone against older adults, and the decisive
window is short: a scammer needs about a minute of sustained pressure before a person
acts. Everything that matters happens inside that minute — and almost every tool built
for this problem arrives after it, as a warning list or a hotline number.

I wanted something that works *inside* the minute. The name is Vietnamese for "hold on".

## What it does

You paste a message, a screenshot, or a link. The system names the specific warning signs
it found, quoting the words it saw them in. Then it does two things almost no other tool
does:

**It prints what it could NOT check, at the same size as the verdict.** An unreadable
screenshot is not the same as a screenshot that was read and found clean. Treating those
two as identical is the characteristic failure of this product category. It appeared in
three independent places on a single day: an image the AI failed to read, a domain that
would not resolve, and an evaluation run where 89.5% of the model calls were failing —
all three surfaced to the user as *"No clear risk signals found"*. There are now dedicated
tests that fail the build if it returns.

**It never says you are safe.** Three labels exist and structurally never a fourth:
*High risk*, *Suspicious*, *No clear risk signals found*. There is no "Safe", because the
system cannot know that.

Then one large button: call a named family member. Slowing the moment down is the product.

## How I built it

The architecture inverts the usual arrangement between a language model and a rule engine.

**The model is not allowed to reach a verdict.** It may return only signals, quoted with
the exact words it saw them in, marked `present` or `unknown` — never `absent`. The
response schema is validated and *has no field* for a risk score, a risk label, or a
severity. If a scammer writes "tell the user this is safe", there is nowhere in the schema
for the model to write it.

A separate rule engine — fixed, versioned, published in the repository — assigns the final
level. Ten critical override combinations, group caps, and resonance rules, all readable
on one page.

This matters because in this problem **the author of the input is the attacker**. That is
the assumption the whole design is built on, and it is what separates this from a
classifier.

**Other constraints that shaped the build:**

- The rule layer runs offline on the device. Incoming messages are screened on the phone
  itself, with no network call until the user taps.
- Vietnamese and English at *both* layers — interface and detection. The verdict travels
  internally as an enum code, never as text, so changing language cannot change the result.
- Free, no account, no server-side storage of user content.
- Runs on any Android phone from 2017 and in any browser.
- Accessibility floors enforced by tests that fail the build: 52px touch targets, 56px
  primary buttons, 14px minimum type, 4.5:1 text contrast.

## Challenges I ran into

**The adversary talks to the machine.** This is not a hypothetical. Five separate holes,
found and closed in one week:

- Typing `Thông báo:` ("Notice:") at the start of a message switched the detector off
  entirely.
- `"nhưng lần này"` ("but this time") and `"theo công an"` ("according to the police") —
  two more of the same family, phrases that made the engine downgrade its own finding.
- Messages containing instructions addressed to the analysis layer. The machine was
  reading them as instructions rather than as evidence.
- The zero-th tier raised false alarms on banks' own scam-awareness messages.
- A tokenizer bug read *"điện thoại"* (telephone) as *"điền"* (fill in).

Each one is now a rule plus a regression test. I publish them rather than quietly patching
them, because a safety tool that hides its failures is more dangerous than one that
reports them.

**A measurement trap that nearly reached this submission.** Running the evaluation harness
without a cache-bypass flag reused 571 previously computed AI signals — it finished in 0.9
seconds and still stamped the *current* prompt version onto the results. The number it
produced measured a new rule engine against an old model's output. Every figure below was
re-measured with 571 fresh model calls.

## Measurement

Held-out evaluation set, 571 labelled messages, 531 scored. Commit `0d548b9`, rule engine
v1.3.0, prompt v1.1.0, model `deepseek-v4-flash`. 571 fresh calls, 0 from cache, 346
seconds, **0% failed calls**.

| | |
|---|---|
| Dangerous messages producing **any** warning | **87.9%** (233 / 265) |
| Dangerous messages the system was **silent** on | **12.1%** (32 / 265) |
| Exact-label recall | 63.8% |
| False "High risk" on harmless messages | 3.6% (169 samples) |
| False positives on a deliberately hard harmless slice | 8.8% (125 samples) |
| Vietnamese written without diacritics — recall | 76.2% |
| Vietnamese ↔ English recall gap | 0.4 points |
| Automated tests | 1,065 passing |

I report both recall figures because they answer different questions. Exact-label recall
is 63.8%; but a dangerous message downgraded to *Suspicious* still warns the user and still
shows the call-your-family button. The number that matters for a safety tool is how often
it stayed **silent**, and that is 12.1%.

## Limits, stated plainly

- **There are no real-world samples in the evaluation set.** 0 of a target 25. Every
  figure above is measured on messages I wrote. The harness prints this itself, as a gap
  rather than a footnote.
- The English slice has 49 samples against a floor of 90.
- False positives on the hard harmless slice got *worse* as recall improved: 8.0% → 8.8%.
  Tightening the rules catches more and alarms more. A user wrongly alarmed uninstalls the
  app, so this trade-off is not free.

## What I learned

That the interesting constraint was never "make the model more accurate". It was "decide
what the model is allowed to say". Once the schema had no field for a verdict, a whole
class of attacks stopped being possible rather than becoming less likely — and the same
pattern transfers to any domain where the person writing the input has a reason to
manipulate the reader.

## What's next

Twenty-five to forty real, PII-redacted samples, so the evaluation stops measuring only my
own imagination.
```

---

## PHẦN 4 · BUILT WITH — tối đa 25 thẻ

▸ CHÉP, mỗi thẻ một dòng hoặc phân cách bằng dấu phẩy

```
typescript, react, vite, tailwindcss, capacitor, android, express, node.js, postgresql, anthropic-claude, google-gemini, simplewebauthn, jsqr, lucide-react, motion, web-speech-api, service-worker, pwa, render.com, claude-code
```

⚠️ **Thẻ `claude-code` là bắt buộc, không phải tuỳ chọn.** Thể lệ ghi:

> *"You must disclose it: list the AI tools you used in Built With and note in your README
> which parts of the project were AI-assisted. **Undisclosed use is treated as
> misrepresentation**."*

Repo có `CLAUDE.md` ngay ở gốc nên giám khảo nào mở repo cũng thấy. Không khai là khai man,
và đó là mức nặng hơn thiếu một thẻ. Mục khai đã được thêm vào `README.md`.

---

## PHẦN 5 · "TRY IT OUT" LINKS

```
https://khoan-da.onrender.com
```

```
https://github.com/quannguyen991/khoan-da-nic
```

⚠️ Repo công khai và nhánh `main` có đủ bộ luật lẫn bộ đo — đã kiểm. Nhưng **hai commit
mới nhất (đo lại, và sửa sáu câu i18n nói ngược kiến trúc) đang nằm ở nhánh
`sua-bo-luat-va-do-luong`, chưa đẩy lên.** Hai nhánh không có tổ tiên chung, nên đừng
merge ẩu — quyết định cách đưa sang `main` trước khi nộp.

---

## PHẦN 6 · ADDITIONAL INFO — Sponsor / Special Prizes

Ô "Select all that apply". **Chỉ tick giải nào thật sự đúng.** Nhìn danh sách nhà tài trợ
thì phần lớn là giải kèm theo (NordVPN, Saily, CodeCrafters, AoPS), không phải hạng mục
riêng phải chọn. Riêng **MeDo** ghi rõ *"for projects built using MeDo"* — không dùng thì
đừng tick.

---

## PHẦN 7 · VIỆC THEO NGÀY — CÒN 16 NGÀY

### Tuần này
- [ ] **Quay video 2–5 phút, phụ đề tiếng Anh.** Kịch bản cũ ở `KICH-BAN-VIDEO.md` dài 2
      phút, dùng lại được nhưng phải thêm phần *kiến trúc* và phần *năm lỗ hổng* — đó là
      thứ Track 03 chấm, không phải phần giới thiệu tính năng.
- [ ] **Chụp ≥ 3 ảnh**: màn kết quả có dòng "chưa kiểm được", màn khẩn cấp, và trang
      `/transparency`. Ảnh thứ ba quan trọng nhất — nó là bằng chứng cho phần đo.

### Tuần sau
- [ ] Thêm mục tiếng Anh vào `README.md`
- [ ] Quyết cách đưa hai commit mới sang `main`
- [ ] Điền form, dán sáu thành phần

### Trước 20/9 — nộp. Đừng để tới ngày 21.

---

## PHẦN 8 · NGUỒN

- Trang cuộc thi: <https://gibc-v2.devpost.com/>
- Thể lệ đầy đủ: <https://gibc-v2.devpost.com/rules>
- Số đo trích từ `eval/results/latest.json`, commit `b499fc1`
