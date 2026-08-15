# ĐÁNH GIÁ KẾ HOẠCH APK & VOICE — GIỮ GÌ, BỎ GÌ

> **Nguồn được đánh giá:**
> `Khoan_Da_Bao_Cao_Tinh_Trang_Ke_Hoach_Phat_Trien.pdf` (10 trang) — phần 3–6.
> Kèm đính chính cho `Khoan_Da_Bao_Cao_Cap_Nhat_v3.pdf`.
>
> **Đối chiếu mã nguồn lúc 16/8/2026, commit `d35dad3`.** Mọi tuyên bố dưới đây
> đều kèm đường dẫn để tự kiểm. Đừng tin, hãy mở ra xem.

---

## 0. TRƯỚC HẾT — SỐ LIỆU ĐÃ ĐỔI QUA ĐÊM

Cả hai PDF đều dựa trên eval cũ. `eval/results/latest.json` đã được chạy lại
(commit `66e4bce`, ghi lúc 16/8 00:38):

| Chỉ số | PDF ghi | **Hiện tại** | |
|---|---:|---:|---|
| `dangerousRecall` | 64,3% | **73,7%** | ↑ 9,4 điểm |
| `highRiskFP` | 7,4% | **6,1%** | ↓ tốt hơn (trần 8%) |
| `CAO → CHUA_THAY` | 23 mẫu | **9 mẫu** | ↓ 61% |
| `CAO → NGHI_NGO` | 53 mẫu | **47 mẫu** | |
| `tutDuoiMucDo` | 31,5% | **26,5%** | |
| Test | 510 ca | **634 ca** | 634 pass · 0 fail |

Nguyên nhân theo git log: `2bb73d0` *"Đo đủ 445 mẫu ở mức suy luận low: recall
67.6% → 73.7%"* và `31c4b75` *"Vá lệch chuẩn hoá giữa trích dẫn và văn bản:
recall 58.7% → 67.6%"*.

**Bốn việc trong Phase 1 của PDF đã xong:**

| Việc | Trạng thái | Kiểm ở đâu |
|---|---|---|
| `lang="vi"` + title | ✅ xong | `public/app/index.html` → `<title>Khoan Đã</title>` |
| Bỏ Google Fonts | ✅ xong | đã tự chứa qua `/fonts.css` |
| Nạp accessibility CSS | ✅ xong (nhưng xem §4) | `/tokens.css` + `/vung-cham-san.css` |
| Service Worker / PWA | ✅ xong | `public/app/sw.js` + `manifest.webmanifest` (commit `0361b14`) |
| `npm run check` | ❌ **CÒN HỎNG** | vẫn trỏ `public/app.js` |
| Deployment config | ❌ **CHƯA CÓ** | không có vercel/netlify/Docker/CI |

---

## 1. ĐÍNH CHÍNH CHO BÁO CÁO v3

v3 phần lớn là nội dung `DANH-GIA-20-Y-TUONG.md` dựng lại — phần đó chuẩn.
Bốn chỗ cần sửa:

### 1.1 Sai số học ở trang 3

v3 viết: *"cứ 4 ca lừa đảo nguy hiểm thì có 1 ca hệ thống không phát hiện ra."*

Sai cả với số cũ lẫn số mới. Tính từ `latest.json` (`soNguyHiem = 213`):

| | Số | Tỷ lệ | Đọc đúng là |
|---|---:|---:|---|
| Bỏ lọt hẳn (`CAO → CHUA_THAY`) | 9 | 4,2% | ~1 trong 24 |
| Không đạt mức CAO (9 + 47) | 56 | 26,3% | ~1 trong 3,8 |

Không con nào ra "1 trong 4". Đây là loại số dễ bị bê thẳng lên slide — sửa
trước khi nó đi xa.

### 1.2 Phase 2 vẫn giữ "Port Rule Engine sang Kotlin" — PHẢI BỎ

Dòng này sống sót từ PDF kế hoạch và **chưa bao giờ được phản biện**. Đây là
dòng nguy hiểm nhất trong cả hai tài liệu. Xem §3.7.

### 1.3 "Sau khi Recall ≥ 80%" là ngưỡng tự đặt

Con số 80% không có trong `CLAUDE.md`, không có trong eval. Nó là một lựa chọn
hợp lý — nhưng phải ghi rõ **"cổng do đội tự chọn"**, đừng để người đọc tưởng
là chuẩn có sẵn. (Với recall hiện 73,7%, cổng này gần đạt.)

### 1.4 v3 chưa phản biện PDF thứ hai

v3 chỉ đánh giá PDF "20 ý tưởng". Toàn bộ phần 3–5 của PDF kế hoạch — Whisper,
ghi âm cuộc gọi, danh sách quyền, ngưỡng 0.72, fine-tune, mẫu regex — **không
được soi**. Đó chính là nội dung tài liệu này.

---

## 2. GIỮ — những thứ đáng lấy từ kế hoạch APK

### 2.1 Kiến trúc backend giữ nguyên ✅

Sơ đồ trang 6 ghi **"BACKEND (Giữ nguyên Node.js)"** với `/api/analyze`,
Khoan Proof, FCM. **Đây là quyết định đúng nhất trong cả tài liệu.**

Android gọi `/api/analyze`, không tự tính mức rủi ro. Phần chạy được khi mất
mạng thì `src/analysis/direct-precheck.js` đã có sẵn.

> ⚠️ Dòng này **mâu thuẫn với "Port Rule Engine sang Kotlin"** trong cùng tài
> liệu. Giữ sơ đồ, xoá dòng port.

### 2.2 Sàn tiếp cận mang sang Android ✅

Trang 6 ghi lớp giao diện: **Font 20sp+ · Touch 56dp+ · Material 3**. Đây là
§4.4 được mang đúng sang tầng Android (`--touch-target-primary` = 56px). Chi
tiết nhỏ nhưng cho thấy người viết có đọc ràng buộc.

### 2.3 Local-first cho tầng dữ liệu ✅

**Room Database + EncryptedSharedPreferences**, không đồng bộ mặc định. Khớp
`src/vault-store.js` và §12 (*"không bật đồng bộ máy chủ mặc định"*).

### 2.4 FCM push ✅

`src/push.js` (§2B.2 hạng mục 25) đã có. Android chỉ cần nối vào, không viết mới.

### 2.5 Review mẫu bỏ lọt ✅

*"Review 76 mẫu bỏ lọt"* — đúng hướng, và đúng thứ `PROMPT-BAN-GIAO.md`
PROMPT 0 đã đặt. **Cập nhật số: giờ là 56 mẫu** (9 bỏ lọt hẳn + 47 tụt xuống
NGHI_NGO). Ưu tiên 9 ca `CAO → CHUA_THAY` trước — đó là ca im lặng.

### 2.6 Locale pack VI: slang · viết tắt · lỗi gõ ✅

Đúng hướng. **Nhưng phải làm đúng chỗ và đúng cách** — xem §3.9 và §3.10.

### 2.7 Thêm mẫu dữ liệu ✅

*"Thêm 100+ mẫu từ báo chí/ngân hàng"* — làm được. Điều kiện: **tăng
`datasetVersion`** (`metadata.datasetVersion`, hiện `d9b4a242f314`) để số
trước–sau còn so được với nhau. Đổi dataset mà giữ nguyên version là làm hỏng
mọi so sánh về sau.

### 2.8 24h outcome → khai thác mẫu ✅ (không phải "retrain")

Vòng phản hồi 24h đã có. Dùng nó để **tìm mẫu bị bỏ lọt** thì đúng. Gọi là
"retrain model" thì sai — xem §3.8.

### 2.9 Vosk, không phải Whisper — nếu sau này thật sự cần ⚠️

Nếu có ngày làm nhận dạng từ khoá theo luồng, **Vosk mới là công cụ đúng** (nó
streaming). Whisper không phải. Xem §3.2. Ghi lại để sau này không chọn nhầm lần nữa.

### 2.10 CI/CD + deploy backend ✅ — CẦN NGAY

*"Setup CI/CD (GitHub Actions)"* và *"Deploy backend (Vercel/Railway/Render)"*
đang nằm ở Phase 4 (tuần 8–12). **Phải kéo lên tuần này**: slide 11 và 12 đã in
sẵn "Quét để tự thử", và repo vẫn chưa có cấu hình deploy nào.

### 2.11 Pilot với Hội NCT, 10–20 người ✅ — KÉO LÊN TRƯỚC

Đúng đối tác, đúng quy mô. Nhưng PDF xếp ở tuần 8–12, **sau** một dự án Android
4–8 tuần. Đây là việc **rẻ nhất và cho nhiều thông tin nhất** trong cả kế hoạch,
và là lỗ hổng deck tự nhận. Phải làm **trước** khi viết dòng Kotlin nào.

### 2.12 Firebase App Distribution — chỉ cho nội bộ ⚠️

Dùng để đội tự thử thì được. **Không** dùng để phát cho người cao tuổi — xem §3.6.

### 2.13 Lý do tồn tại của bản APK: #4 quét sức khoẻ thiết bị ✅

Nếu làm Android native, **đây mới là thứ đáng làm** — không phải ghi âm cuộc
gọi. Chi tiết ở `docs/DANH-GIA-20-Y-TUONG.md` §2.

---

## 3. BỎ — và lý do cụ thể

### 3.1 Tiền đề "phân tích voice trong cuộc gọi real-time" ❌

**App thường không ghi được âm thanh cuộc gọi trên Android.**
`AudioSource.VOICE_CALL` / `VOICE_DOWNLINK` cần `CAPTURE_AUDIO_OUTPUT` — quyền
`signature|privileged`, không cấp cho app bên thứ ba. Android 10 chặn hẳn ghi âm
cuộc gọi cho app thường; Google Play cấm dùng Accessibility API để lách.

⇒ Bảng trang 6 ghi Native Android cho *"Full API access / Continuous recording"*
đối với call recording là **sai**. Chỉ còn đường bật loa ngoài rồi thu qua mic —
một sản phẩm khác hẳn, yếu hơn nhiều, và phải nói đúng như vậy.

### 3.2 Whisper cho "low latency" — sai công cụ ❌

Yêu cầu ghi ở §3.1 của PDF là *"real-time, low latency"*. Whisper là
encoder-decoder chạy trên **cửa sổ 30 giây** — về cấu trúc nó không phải ASR
streaming. Vosk mới là streaming, và bảng lại xếp Vosk thấp hơn.

### 3.3 Bảng accuracy chưa đo trên tiếng Việt ❌

85–90% (base) / 90–93% (small) là số kiểu tiếng Anh. Tiếng Việt có thanh điệu,
phần huấn luyện tiếng Việt của Whisper mỏng, thực tế kém hơn đáng kể. Và
`whisper-base-vn.bin` trong code mẫu không phải một artifact chuẩn có sẵn.

**§11 cấm đúng chuyện này**: lập kế hoạch trên số chưa đo. Muốn đi đường này thì
đo trước, rồi mới xếp bảng.

### 3.4 Cloud STT backup (FPT AI / Google STT) ❌

Gửi giọng người dùng ra máy chủ ngoài. §12: *"❌ Đổi privacy model"*. Mâu thuẫn
trực tiếp với *"Dữ liệu lưu cục bộ"* trên slide 10.

### 3.5 Code Kotlin `detectScamKeywords` — tạo bộ luật thứ hai ❌

```kotlin
fun detectScamKeywords(text: String): ScamSignal {
    lower.contains("tài khoản an toàn") -> ScamSignal.CRITICAL
    lower.contains("công an")           -> ScamSignal.HIGH
```

Ba chuyện sai cùng lúc:

1. **§4.2** — `src/analysis/decision-engine.js` là *bộ luật duy nhất*. Đây là bộ
   luật thứ hai, nằm ngoài mọi test.
2. **Thang nhãn không khớp gì cả.** Sản phẩm có `CAO / NGHI_NGO / CHUA_THAY`
   (`src/risk-labels.js`) và 5 mức can thiệp (`src/intervention-ladder.js`).
   `CRITICAL/HIGH/MEDIUM/LOW` là taxonomy thứ ba, không ánh xạ về đâu.
3. **`contains("công an") → HIGH` phá `context-builder.js`** (Phụ lục C — chống
   báo động giả). Câu *"bố con làm công an"* thành HIGH. Toàn bộ công chống FP
   bị đổi lấy `String.contains`.

**Thiết kế đúng:** giọng nói → văn bản → `SIGNAL_ID` (58 mã có sẵn) → bộ luật
đang chạy. **Voice là một NGUỒN ĐẦU VÀO, không phải một tầng quyết định.**

### 3.6 Danh sách quyền §4.4 — chân dung spyware ❌

`RECORD_AUDIO` · `READ_PHONE_STATE` · `READ_CONTACTS` · `CALL_PHONE` ·
`SYSTEM_ALERT_WINDOW` · `FOREGROUND_SERVICE_MICROPHONE` · `USE_FULL_SCREEN_INTENT`

Một app cho người cao tuổi xin mic liên tục + overlay + trạng thái điện thoại +
danh bạ thì: khó qua Play review, **không phân biệt được với chính phần mềm mà
nó cảnh báo**, và không giải thích nổi cho bác 70 tuổi bằng giọng văn sản phẩm.

Mâu thuẫn với mô hình đe doạ của chính mình: `DEV_ACCESSIBILITY_PERMISSION`,
`DEV_REMOTE_CONTROL_APP`, `DEV_INSTALL_APK_UNKNOWN` đều là tín hiệu rủi ro, và
`CO-02` nổ critical khi thấy chúng.

Thêm nữa, Phase 4 đề xuất *"APK direct + Firebase App Distribution"* — **phát
APK ngoài store cho người dùng cuối** là đúng hành vi mà
`WEB_NONOFFICIAL_APP_SOURCE` gắn cờ. Dạy người ta đừng cài APK lạ rồi tự phát
APK lạ thì không đứng được.

### 3.7 "Port Rule Engine sang Kotlin" ❌❌ — dòng nguy hiểm nhất

Tạo **hai bản bộ luật an toàn bằng hai ngôn ngữ**, trong khi 634 test chỉ phủ
bản JavaScript. Hai bản sẽ phân kỳ, và phân kỳ trong bộ luật thì **im lặng** —
đúng dạng lỗi dự án sợ nhất.

Giữ bộ luật ở máy chủ. Android gọi `/api/analyze`. Ngoại tuyến thì đã có
`direct-precheck.js`.

### 3.8 "Fine-tune claude-sonnet-5" ❌ — không tồn tại

Claude không có fine-tuning. Dòng *"24h outcome → retrain model"* cũng vậy.
Thứ chỉnh được là **prompt, pattern, và luật** — không phải trọng số mô hình.

### 3.9 Mẫu regex trong §5.2 — tái tạo bug đã cắn 4 lần ❌

PDF đề xuất:

```js
/\b(gấp|lắm|rứa|xiết|zô)\b/gi
/\b(kịp thời|ngay lập tức|chớp nhoáng|tức tốc)\b/gi
/\b(con|mình)\s*(đây|đi|ạ)\b.*\b(bệnh viện|cảnh sát)\b/gi
```

Mở `test/ranh-gioi-tu-unicode.test.js`, dòng đầu:

> *"HÀNG RÀO CHO MỘT LỖI ĐÃ CẮN BỐN LẦN TRONG CÙNG MỘT DỰ ÁN. `\b` và `\w` của
> JavaScript CHỈ HIỂU ASCII... Bốn lần đó lần lượt làm câm
> `ID_AUTHORITY_IMPERSONATION`, `MAN_FEAR_THREAT`, khung giáo dục điều kiện, và
> bộ gỡ che chữ. **Mỗi lần đều IM LẶNG.**"*

Mọi mẫu trên đều có `\b` sát chữ có dấu — `gấp`, `lắm`, `kịp thời`, `đây`,
`bệnh viện`, `cảnh sát`. **Không mẫu nào khớp được.** Test sẽ bắt, nhưng đừng
viết lại nó ngay từ đầu.

### 3.10 Sai file ❌

Code mẫu ghi `// src/analysis/signal-registry.js`. Đếm thực tế:

| File | Số chỗ có `pattern` |
|---|---:|
| `src/analysis/locale-packs/vi-VN.js` | **49** |
| `src/analysis/signal-registry.js` | **0** |

Patterns nằm ở locale pack. `signal-registry.js` là sổ tín hiệu (ID · nhóm ·
trọng số). Nhét pattern tiếng Việt vào đó là phá đúng cái tách biệt làm nên
kiến trúc song ngữ (`locale-pack-registry.js`).

### 3.11 Hạ ngưỡng 0.72 → 0.65 ⚠️ — được thử, có điều kiện

Ngưỡng có thật, `src/analysis/pipeline.js:23`:

```js
const NGUONG_CHAP_NHAN_LLM = 0.72;  // §6.4 — 0.55–0.71 → unknown; < 0.55 → drop
```

Hạ xuống sẽ kéo tín hiệu từ `unknown` sang `present` — **tăng recall và tăng FP
cùng lúc**.

Hôm qua tôi khuyên đừng đụng vì biên FP chỉ còn 0,6 điểm. **Giờ khác**: FP đã
xuống 6,1%, biên tới trần 8% là **1,9 điểm**. Thử được. Điều kiện:

1. Chạy eval **trước và sau**, cùng `datasetVersion`.
2. FP vượt 8% ⇒ trả lại ngay, không thương lượng.
3. Ghi lại cả hai số vào `latest.json` để `/transparency` đọc được.

Nhưng **thử cái này SAU** khi đã xong 9 ca `CAO → CHUA_THAY`. Vá đúng nguyên
nhân trước, vặn ngưỡng sau — vặn ngưỡng chỉ là đổi recall lấy FP, không phải
sửa lỗi.

---

## 4. LỖI MỚI PHÁT HIỆN — sàn a11y vẫn chưa được bảo vệ

Đội đã nạp `vung-cham-san.css` vào `public/app/index.html` ✅. Nhưng:

```
line 20:  /fonts.css
line 26:  /tokens.css
line 27:  /vung-cham-san.css          ← sàn
line 29:  /assets/index-Dpu-4uXF.css  ← bundle 61KB nạp SAU sàn
```

**§4.4 đòi `vung-cham-san.css` nạp SAU CÙNG** để không gì đè được sàn. Hiện CSS
của bundle nạp sau nó, tức **đè được toàn bộ sàn tiếp cận**.

Và test đáng lẽ bắt được thì vẫn không bắt. `test/font-size-floor.test.js:94`
đọc `public/index.html` và `public/sw.js` — **hai tệp đó không tồn tại**:

| Test đọc | Có thật không | File thật nằm ở |
|---|---|---|
| `public/index.html` | ❌ KHÔNG CÓ | `public/app/index.html` |
| `public/sw.js` | ❌ KHÔNG CÓ | `public/app/sw.js` |

Cả hai nhánh `if (C.coTep(...))` đều bỏ qua ⇒ **ca test pass rỗng**, dù đang có
một vi phạm thứ tự cascade thật.

**Sửa:** trỏ test vào `public/app/index.html` và `public/app/sw.js`, đổi
`if (coTep)` thành assert cứng, rồi đưa `vung-cham-san.css` xuống sau bundle CSS
trong template. Làm test đỏ lên trước, rồi mới sửa — để biết chắc nó thật sự bắt.

---

## 5. THỨ TỰ ĐỀ NGHỊ

| # | Việc | Vì sao |
|---|---|---|
| 1 | Sửa `test/font-size-floor.test.js` trỏ đúng `public/app/` | mọi lời "đã test" §4.4 hiện chưa đáng tin |
| 2 | Đưa `vung-cham-san.css` xuống **sau** bundle CSS | vi phạm cascade đang tồn tại |
| 3 | Sửa `npm run check` (bỏ 3 ref chết) | việc 2 phút |
| 4 | **Deploy backend + CI** | slide 11/12 đang chờ QR |
| 5 | PROMPT 0 — 9 ca `CAO → CHUA_THAY` | ca im lặng, nguy hiểm nhất |
| 6 | PROMPT 1 — vá `verifiedRelationship` | lỗ đã biết |
| 7 | Locale pack VI: slang · lỗi gõ (đúng file, tránh `\b`) | recall |
| 8 | **Pilot 10–20 người cao tuổi** | rẻ nhất, nhiều thông tin nhất |
| 9 | Thử hạ ngưỡng 0.72 (đo trước–sau) | chỉ sau việc 5–7 |
| 10 | Quyết định về APK — phạm vi = #4 quét thiết bị | sau khi có dữ liệu pilot |

**Không làm, không viết vào tài liệu nào:** ghi âm cuộc gọi · Whisper on-device
cho low-latency · cloud STT · `detectScamKeywords` · danh sách quyền §4.4 của
PDF · phát APK cho người dùng cuối · port bộ luật sang Kotlin · fine-tune Claude.
