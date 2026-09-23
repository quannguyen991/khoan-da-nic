# Permissions, privacy and platform policy

How Khoan Đã reaches a person who will never open it, and what it refuses to do
to get there.

This document exists because of one review comment: *users may not open the app*.
That is correct, and it is the hardest problem in the product. Everything below is
the answer.

---

## The tension, stated plainly

Protection that requires the user to act will not fire. An 82-year-old being told
by a fake police officer to stay on the line and transfer money is not going to
open an app, find the paste box, and wait for a result. If the app only works when
opened, it does not work.

Protection that fires without the user acting requires the app to watch. Watching
means permissions, and the permissions that see the most are the same permissions
malware wants. The most capable route — an `AccessibilityService` reading every
screen — is the route remote-control fraud already uses.

So the design question is not *how much can we watch*. It is: **how much
protection can we deliver per unit of permission, and where do we stop.**

---

## Where we stop

### We do not use an AccessibilityService, and we will not

An `AccessibilityService` can read the content of every screen in every app. It
would make this product dramatically more capable. We refuse it, for a reason that
is not squeamishness:

**Our own detector treats an unexpected accessibility service as a scam
indicator.** The signal is `DEV_ACCESSIBILITY_PERMISSION`, and the device check
raises `UNG_DUNG_TRO_NANG_LA` for unrecognised accessibility apps and
`UNG_DUNG_TRO_NANG_VUA_CAI_TRONG_TUAN` for one installed in the last seven days.
Remote-control fraud runs on exactly that permission: the scammer talks the victim
through enabling it, then drives the banking app.

An app that warns you about a permission while quietly using it has destroyed the
warning. We would rather ship a weaker detector than a self-contradicting one.

### We do not read SMS, call logs, or contacts

`READ_SMS`, `READ_CALL_LOG` and `READ_CONTACTS` are not in our manifest and are
not planned. They are restricted permissions on Google Play, they require a
declared and reviewed use case, and — more importantly — they are not necessary.
Notification access reaches the same messages at a fraction of the exposure, and
does so through a channel the user can inspect and revoke in system settings.

### We do not record or analyse call audio

Android has fenced third-party access to the call audio stream since version 10.
We say so rather than implying otherwise. The long-call reminder counts elapsed
time; it does not listen, record, or identify who is calling.

---

## The permission ladder

The app must be useful at level 0. Every rung above states what it buys and what
it costs, and any rung can be declined without breaking the ones below it.

| Level | Permission | What it adds | Cost to the user |
|---|---|---|---|
| **0** | none | Share a message into the app from any other app · family password · lessons · verified emergency numbers · QR and link checks | nothing |
| **1** | `POST_NOTIFICATIONS` | Pinned one-tap shortcut, alerts the user can actually see | a notification in the shade |
| **2** | Notification access | **On-device pre-screening.** An arriving message carrying two or more signals raises a local prompt to check it | the app can read notification text, so it must be trusted not to send it |
| **3** | `SYSTEM_ALERT_WINDOW` | The warning strip that appears over the call screen — the only surface that reaches a person mid-scam. Since 23/9/2026 it also lets the app **open its own warning screen** when a code arrives or an app is installed during a call (Android only allows background activity starts to apps holding this permission) | the same permission malware uses to draw over banking apps |
| **4** | `READ_PHONE_STATE` | Long-call reminder after 25 minutes · **code-during-call**, **install-during-call** and **money-out-during-call** warnings (see below). Money-out reads the bank's balance-change SMS in the messaging apps already listed and, since 23/9/2026 (owner's decision), notifications from a **fixed list of 22 Vietnamese bank and e-wallet apps** (package names verified on Google Play; see `GOI_NGAN_HANG` in `DocThongBao.java`). Bank-app notifications are checked only for money-out or a one-time code during a call, then discarded — never queued, logged or sent; amount never leaves the phone | call state only; no number, no log. Internet calls (Zalo, Messenger, Viber) are seen through the phone's **audio mode** (`AudioManager.getMode()`, no permission needed) — the app still does not know which app or who is calling |
| **4b** | `CALL_PHONE` | The "call family" button rings the saved number in **one tap** instead of opening the dial pad | the app can place a call — **only to a number the user saved, only when the user taps**; declined ⇒ the button opens the dial pad as before |
| **5** | Guardian link | An adult child receives alerts | the real risk here is not the platform — see below |
| ✗ | `READ_SMS`, `AccessibilityService` | would see everything | **refused, on the record** |

Level 2 is the rung that answers the review comment. It is also the rung where the
privacy promise has to be exact, so:

**Pre-screening runs entirely on the phone.** No network call, no AI, no byte
leaving the device. It uses a small set of local patterns and requires **two or
more** signals before it says anything — a code request *plus* pressure, an agency
name *plus* a transfer demand. One signal alone is not worth interrupting someone
for: a genuine bank SMS contains the word OTP too.

**One exception to the two-signal rule — a code during a call (added 23/9/2026).** A
message carrying a one-time code is normal. The same message arriving **while the
phone is on a call** (or within two minutes after) is the core move of the
impersonation scam: a bank never phones to ask for a code. In that case one signal
is enough, and the app opens its warning screen by itself. It still reads only
*whether* a call is active — never the number — and the text stays on the phone.
The wording is conditional ("anyone who calls and asks for a code is a scammer"),
never an accusation, and "I'm fine" is always on screen.

**Pre-screening produces no verdict.** It cannot say "high risk", because no rule
engine has run. It says *this looks worth checking* and offers one tap. It is a
bell, not a scale. The deterministic engine still decides, and only after the user
taps.

**The prompt never quotes the message.** Notifications are visible on a locked
screen to anyone holding the phone. Copying the content into an alert would move
the user's message somewhere more exposed than where it already was.

---

## What crosses the network, and when

| Data | Leaves the device? | Trigger |
|---|---|---|
| Message text the user typed or pasted | yes | the user taps check |
| Text captured from a notification | yes | **the user taps check** — never automatically |
| A screenshot the user chose | yes | the user taps check |
| Extracted entities (phone number, domain, impersonated organisation) | stored server-side | only for a case the user opened |
| Full message content | **never stored** | writing `vanBan`, `noiDung`, `anh`, `otp` or `matKhau` to the store throws, rather than silently dropping the field |
| List of installed apps | **never sent** | the device check sends three counts, not an inventory |
| Speech | **never leaves the phone** | recognition runs on-device where the platform supports it, and the app states which engine it used |
| Alert to family (risk level, scenario type, or "code during a call"; later, which button the owner pressed) | **codes only** — never message content | only if the **account owner** switched alerts on, on their own phone (off by default) |
| A family member's recorded voice message | **never leaves the phone** | recorded on the parent's phone during setup, stored there only |

The gap between rows two and three is the whole privacy model. The app may *see* a
message arriving, and may screen it locally. It may not *send* it. Automatic
screening and automatic uploading are different things, and conflating them would
turn a safety feature into a data pipeline.

---

## Protecting the user from their own family

The most common form of elder financial abuse comes from inside the household. A
monitoring feature built without that in mind becomes a tool for the abuser. The
Trusted Circle carries four constraints from its first commit:

1. **The account owner can revoke any member at any moment** — without that
   member's password, and without their consent.
2. **The monitoring dashboard defaults to off,** and whoever set up the phone
   cannot switch it on on the owner's behalf.
3. **Every time a member views data, an audit entry is written that the viewer
   cannot delete.**
4. **Members see value ranges, never exact amounts,** and never the raw content of
   a check — only the time, the level, and at most three signals.

Someone checking a romance scam, or a loan from a relative, deserves to keep that
private. Stripping that dignity is the fastest way to make them stop using the app,
which leaves them with no protection at all.

---

## Platform policy obligations

We do not claim a policy review has been passed. These are the obligations we know
apply, and the state of each.

| Obligation | State |
|---|---|
| Prominent in-app disclosure before requesting notification access, naming what is read and whether it is transmitted | **done** — the request screen states all three: what is read, how long it is kept, whether it is sent |
| Data Safety declaration matching actual behaviour | **to write** — the table above is the source for it |
| A privacy policy URL reachable without installing | **to publish** |
| Justification for `SYSTEM_ALERT_WINDOW` | **written** — used only for a dismissible strip, never full-screen, never capturing input outside its own two buttons |
| Restricted-permission declarations | **not applicable** — we request none |
| Foreground service type declared and matching its use | `FOREGROUND_SERVICE_SPECIAL_USE`, **to re-check** against current requirements |

The permissions actually declared today, in full:

```
CALL_PHONE · CAMERA · INTERNET · POST_NOTIFICATIONS · READ_PHONE_STATE
RECORD_AUDIO · SYSTEM_ALERT_WINDOW · FOREGROUND_SERVICE
FOREGROUND_SERVICE_SPECIAL_USE · RECEIVE_BOOT_COMPLETED
+ BIND_NOTIFICATION_LISTENER_SERVICE (a service binding, granted in system settings)
```

`RECORD_AUDIO` is used only while the user is speaking into the app on the voice
screen. It is not used in the background, and not used during calls.

---

## What this still does not solve

The most reliable protection is not on the phone at all. It is a hold on the
transfer at the bank, and a warning on the call at the carrier. Neither is
something a phone app can do, and neither is something we can build alone.

What this app does is narrower, and we would rather state it exactly: **it buys
sixty seconds, and it pulls a family member into the room.** For a scam that
depends on isolation and urgency, those two things are most of the defence. They
are not all of it.
