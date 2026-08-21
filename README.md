# Khoan Đã

**A scam-awareness assistant for older people.**
Hold on. Verify. Then act.

*Khoan Đã* is Vietnamese for "hold on a moment" — the sentence someone needs to
hear before they transfer their savings to a stranger.

Built by **Nguyen Xuan Minh Quan**, 16, Hanoi, Vietnam.
Vietnamese version of this document: [README.vi.md](README.vi.md)

---

## The problem

Impersonating the police was the most common online scam in Vietnam in 2025,
according to a survey of 60,300 people by the National Cyber Security
Association (NCA), conducted 1–18 December 2025. Scammers now build fake offices,
wear uniforms, and make video calls to look convincing.

Three numbers explain why a tool has to intervene **before** the money moves:

| Figure | Source |
|---|---|
| Over **6,000 billion VND** lost to online scams in the first 11 months of 2025 | Ministry of Public Security |
| Only **32.12%** of victims reported it to the authorities; **12.03%** accepted the loss and did nothing | NCA, survey of 60,300 people, Dec 2025 |
| Victim rate in 2025 was **0.18%** (1 in 555), down from 0.45% in 2024 | NCA |

Two thirds of victims tell no one. Intervention after the money is gone barely
happens — which leaves one moment that matters: while the scammer is still on
the phone.

Older people are targeted for three reasons at once: a digital skills gap, living
alone often enough that a caring voice is welcome, and scammers who arrive
speaking exactly like family.

---

## How it works

A person pastes a message, speaks, or sends a screenshot. The app returns one of
three levels, the reasons behind it, and **what it could not check**.

### Two layers, and only one of them decides

```
AI layer          reads the text and raises FLAGS   (present | unknown)
                  it never returns a score or a level
        ↓
Rule engine       the ONLY thing that decides the level
                  deterministic, offline-capable, testable
```

The AI extracts signals with evidence quotes. A fixed rule engine turns signals
into a level. This is not a stylistic choice — it means the verdict can be
explained, tested, and reproduced, and that a model having a bad day cannot
invent a risk level or talk itself out of one.

The schema **forbids** the model from returning `riskScore`, `riskLabel`,
`critical`, `interventionLevel` or `safe`. If a model returns one, validation
rejects the response.

### Four rules that never bend

1. **Three levels, fixed wording.** `High risk` · `Suspicious` · `No clear risk
   signals found`. There is deliberately **no "Safe" label**, in any language.
   The system reports what it did not find in what it was given; it does not
   promise safety.
2. **Codes, not sentences.** The engine emits enum codes; display text is looked
   up in a catalog. Switching language cannot change a verdict.
3. **"Could not check" ≠ "checked, found nothing."** If the image was unreadable,
   the domain did not resolve, or no AI ran, the screen says so at the same text
   size as the verdict.
4. **Anything clever may only raise caution, never lower it.**

---

## Features

### Checking
- **Type, speak, or send a photo.** Speech recognition runs on the device where
  the platform supports it; the app says which one it used.
- **Message capture (Android).** With permission, the app reads new message
  notifications so one tap checks them instead of copying by hand. Content stays
  on the phone and is only sent for checking when the user taps.
- **Screenshots are transcribed first, then judged by the same rules.** The text
  inside an image goes through the identical rule engine as typed text, so a scam
  does not get a softer verdict for arriving as a picture. If the image cannot be
  read, the app says *that* — it never reports an unread image as one it checked.
- **QR and link inspection.** Domains are analysed deterministically — the app
  never opens a link on the user's behalf.
- **Quick questions.** While a call is happening, a short structured set of
  questions gathers signals without needing the message text.

### Intervening
The verdict decides the **label**; a separate ladder decides the **screen**:

| Intervention | What it does |
|---|---|
| `TRUST_RECEIPT` | Shows what was checked, what was not, and why |
| `VERIFY_PATH` | A safe way to verify, e.g. call the number on the back of the card |
| `PAUSE_60S` | A one-minute countdown with the family call button in reach |
| `PROTECTED_CRITICAL` | Strips navigation for genuinely critical combinations |
| `RECOVERY` | Steps that improve the chances of a case being handled |

Every screen, including the critical one, keeps an "I'm fine, nothing dangerous"
exit. A false alarm the user cannot escape is how an app gets uninstalled.

### Protecting, on Android
- **Overlay warning banner.** With the system overlay permission, a strip appears
  over whatever is on screen — including the call screen. It never covers the
  full screen, never takes input outside its own two buttons, and always has a
  dismiss button.
- **On-device pre-screening.** An arriving message showing two or more signals at
  once — a code request plus pressure, an agency name plus a transfer demand —
  raises a local prompt to check it. This runs entirely on the phone: no network
  call, no AI, and it deliberately produces no verdict of its own. It is a bell,
  not a scale; the rule engine still decides once the user taps.
- **Pinned notification.** One tap into the app, surviving reboot.
- **Long-call reminder.** Police-impersonation calls run for hours. After 25
  minutes the app asks one question: is someone telling you to transfer money?
  It does **not** listen to, record, or identify the call — it counts time.
- **Family password.** One phrase only the family knows, agreed out loud. Voices
  and faces can be faked; this cannot. The app stores only a hint, never the
  phrase, because the phone itself may be compromised.
- **Device check.** Flags side-loaded installs and unexpected accessibility
  services — two things present in most remote-control scams.

### For family
A guardian view lets adult children connect, receive alerts, and send a safety
reminder. Accounts link people; they are not required to check a message.

### Learning
A lesson module teaches the tactics rather than listing individual cases, plus
verified emergency numbers.

---

## Measurements

Numbers below are measured, not targets, and each one can be reproduced from this
repository. They are reported against two different sets, because the difference
between them is the point.

**Development set** — `test/du-lieu/`, reproduced with `npm test`. The rule
patterns were written and tuned against these scenarios, so read them as an upper
bound rather than as a forecast.

| Layer | Catches | False alarms | Set |
|---|---|---|---|
| Rule engine, Vietnamese | 80% | 0% | 100 scenarios (49 scam / 51 benign) |
| Rule engine, English | 70% | 0% | 200 scenarios (100 / 100) |

**Held-out set** — `eval/dataset/`, 497 labelled samples the patterns were never
tuned against. This is the number that predicts behaviour on a message nobody has
seen before. Reproduce with `node eval/khoanbench.js`, which prints this table:

| Layer | Recall | False alarms |
|---|---|---|
| Rule engine, Vietnamese | 14.4% | 3.3% |
| Rule engine, English | 6.1% | no benign English samples yet, so not measurable |
| Rule engine, mixed VI/EN | 11.4% | 0.0% |

**The two tables count different things, so read the definitions before comparing
them.** In the development table a scam counts as caught if it came back at
*Suspicious* or above. In the harness, `recall` is stricter: the sample must come
back at *High risk*. Under the looser definition the held-out set gives 34%
Vietnamese and 33% English; under the strict one the development set gives 49%
and 19%. Every one of those six numbers is reproducible from this repository, and
none of them is the single headline figure.

The distance between the two sets is what tuning on a set buys you. Publishing
only the flattering half is how a project ends up believing its own demo, so both
are here.

The rule layer is deliberately conservative — it fires only where it is certain,
and the AI layer covers the ambiguous remainder. The two error types are also not
priced the same: missing a scam costs one warning, while a false alarm teaches
someone to ignore the next warning, including the correct one. The thresholds are
asymmetric on purpose.

Three slices of the held-out set are worth naming, including the two that fail:

| Slice | Result |
|---|---|
| 110 benign messages containing the exact keywords a detector hunts for — "Mum, install the bank app from the Play Store", "transfer the money, don't tell grandma" | **4% false alarms.** A benign set of "the cat has been fed" would make a low false-alarm rate meaningless. |
| 35 published anti-scam warning articles | **20% wrongly flagged.** Teaching about fraud should not read as fraud. Open. |
| 40 Vietnamese messages typed without diacritics | **42% caught, 19% false alarms** — the weakest slice, and a common way real messages arrive. Open. |

Typical response times on the hosted demo: a clear impersonation scam returns in
**under one second** from the rule layer alone, without calling AI. Ambiguous
messages that need the AI layer return in about **3 seconds**. A screenshot takes
longer, because the image is transcribed before the rule engine sees it.

**59 contract tests** guard the invariants — the three labels, the absence of a
fourth, the touch-target and text-size floors, the security headers, the rule that
every user-facing string comes from the translation catalog, and the rule that an
input the app could not read may never be reported as an input it checked.

---

## Privacy

- Message content is not stored on the server. Case records keep extracted
  entities (phone numbers, domains, impersonated organisations) — enough to link
  a case, not enough to reconstruct a message.
- The app states where the AI ran, every time. If no AI ran, it says so.
- No third-party fonts, analytics, or trackers. The content security policy keeps
  `connect-src`, `font-src` and `img-src` on the app's own origin.
- Device-state checks send three numbers, never a list of installed apps.

---

## Accessibility

Floors are enforced in CSS that loads last and are guarded by tests:

| Item | Floor |
|---|---|
| Touch targets | 52px, primary buttons 56px |
| Text size | 14px at the smallest of three text scales |
| Text contrast | 4.5:1 |
| Non-text contrast | 3:1 |

Vietnamese is roughly 30% longer than English and stacks diacritics above and
below the line, so buttons are never sized to fit their label exactly and line
height never drops below 1.25. Target: WCAG 2.2 AA.

---

## Technology

| Layer | Stack |
|---|---|
| Frontend | React 19 · TypeScript (strict) · Vite 6 · Tailwind 4 · PWA + service worker |
| Backend | Node · Express · pure rule engine with no network dependency |
| Mobile | Capacitor + native Android (Java) for overlay, notifications, call state |
| AI | Any OpenAI-compatible model — local via Ollama, or a hosted gateway |
| Testing | 59 contract tests · 300 tuned scenarios · 497 held-out samples |

---

## Running it

```bash
npm install
npm run dev
```

```bash
npm test
```

Reproducing the held-out benchmark. The rule-only pass needs no API key and takes
a few seconds; `--ai` adds the extraction layer and needs one configured.

```bash
node eval/khoanbench.js
```

The harness prints the per-language table **before** any combined figure, on
purpose: an earlier version let Vietnamese fall 15.6 points behind while every
aggregate metric stayed green.

Building the Android app:

```bash
npm run build && npx cap sync android
```

---

## Repository map

| Path | Role |
|---|---|
| `backend/src/analysis/decision-engine.js` | The single place a risk level is decided |
| `backend/src/analysis/critical-overrides.js` | Combinations that force protected mode |
| `backend/src/analysis/locale-packs/` | Signal patterns per language |
| `backend/src/analysis/context-builder.js` | Sentence segmentation and speech-act classification |
| `src/catalog.ts` | Codes → display text, so language cannot change a verdict |
| `test/hop-dong.test.mjs` | Guards for every invariant above |
| `test/du-lieu/` | Tuned scenario sets, 300 samples |
| `eval/dataset/` | Held-out evaluation set, 497 labelled samples |
| `eval/khoanbench.js` | Benchmark harness — prints the per-language table before any total |
| `android/app/src/main/java/vn/khoanda/app/` | Native Android layer |

---

## Sustainable Development Goals

| SDG | Target | Link |
|---|---|---|
| **16** Peace and justice | 16.4 reduce illicit financial flows and organised crime | Online scams in Vietnam are run by organised groups; stopping the transfer cuts the flow at its source |
| **10** Reduced inequalities | 10.2 inclusion regardless of age | Older people are pushed out of digital life by fear of being scammed; this lowers the barrier instead of telling them to stay away |
| **3** Good health and well-being | 3.4 mental health | Losing a lifetime of savings causes lasting harm — the damage does not stop at money |
| **4** Quality education | 4.4 digital skills | The lesson module teaches how tactics work, not just individual warnings |

---

## Honest limits

- **The rule engine on its own misses most scams on unseen text** — 34% caught on
  the held-out set, against 80% on the set it was tuned against. That is the
  layer working as designed rather than a bug: it fires only where it is certain,
  keeps false alarms at 4% on the hardest benign slice, and leaves the ambiguous
  remainder to the AI layer. But a reader deserves the honest version of the
  sentence, so: on its own, it misses more than it catches.
- The AI layer needs a network connection. Without one, the rule engine still
  runs and the app says that no AI read the message.
- The app cannot block calls or bank transfers, and does not claim to. It
  intervenes with information and time.
- Nothing here recovers money that has already been sent. The recovery screen
  lists steps that improve the chances of a case being handled.

---

## Licence and credits

Statistics are attributed inline to the National Cyber Security Association and
the Ministry of Public Security. Any warning shown in the app carries its source.
The app never accuses a specific person of a crime — it reports that a request
shows signals commonly seen in scams.
