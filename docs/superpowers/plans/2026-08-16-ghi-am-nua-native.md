# Ghi âm — nửa native (Kotlin, whisper.cpp, giao diện) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghi âm qua micro / nhận file, phiên âm bằng whisper.cpp trên máy, đẩy chữ vào `/api/analyze` — nửa JS đã sẵn sàng nhận.

**Architecture:** Plugin Capacitor tên `KhoanDaAudio` chạy trong tiến trình APK, gọi whisper.cpp qua JNI. Nó trả **chữ + độ tin cậy**, không trả kết luận nào về rủi ro. `native.ts` bọc nó bằng đúng khuôn `layCau()` đã có cho `NotificationListener` và popup.

**Tech Stack:** Kotlin/Java, Capacitor 6, whisper.cpp (JNI), Android SDK 24+.

**Spec:** `docs/superpowers/specs/2026-08-16-ghi-am-tren-may-design.md`

---

## ⚠️ ĐIỀU KIỆN TIÊN QUYẾT — CHƯA CÓ Ở MÁY HIỆN TẠI

Đo ngày 16/8/2026 trên máy đang phát triển:

```
ANDROID_HOME     = trống
ANDROID_SDK_ROOT = trống
java             = command not found
```

**Không task nào dưới đây verify được cho tới khi có Android SDK + JDK 17.**
Viết Kotlin rồi commit mà không dựng nổi là đúng thứ §11 gọi tên: gọi bản dựng
là "đã đo" khi mới chỉ là mục tiêu. Cài xong thì chạy lại `./gradlew assembleDebug`
trước khi bắt đầu Task 1.

## Nửa JS đã xong — đây là thứ nửa này phải khớp

Đã có trên nhánh `ghi-am-nua-js` (665 test xanh):

```js
POST /api/analyze {
  vanBan,             // chữ whisper phiên âm ra
  ghiAm,              // true
  ghiAmConfidence,    // number [0,1] — độ tin cậy THẤP NHẤT của các đoạn
  ghiAmFailed,        // boolean
  ghiAmMaLoi,         // 'CHUA_TAI_MODEL' | 'KHONG_CO_TIENG_NOI' | 'BI_CAT' | undefined
}
```

**Ba điều nửa native BẮT BUỘC làm đúng, nếu không sàn §4.3 thành trang trí:**

1. `ghiAmConfidence` phải là **`exp(avg_logprob)`**, chuẩn hoá **tại Kotlin**.
   whisper trả logprob luôn âm; đẩy thẳng số âm sang JS thì mọi lượt đều rơi
   dưới ngưỡng và mọi lượt đều báo "không nghe được".
2. Phải là **giá trị THẤP NHẤT trong các đoạn**, không phải trung bình. Trung
   bình che mất ca "nghe được 90%, nuốt đúng câu chuyển tiền".
3. Whisper hỏng ⇒ `ghiAmFailed: true` **kèm mã**, không gửi chuỗi rỗng. Gửi
   `vanBan: ''` với `ghiAmFailed` không đặt là đúng bẫy §4.3.

## Global Constraints

- **§4.2** — Kotlin **không** chấm điểm, **không** so keyword, **không** `emit_alert`.
  Một dòng `if (text.contains("OTP"))` là đường quyết định thứ hai. §12 cấm.
- **§6.9** — âm thanh **không rời khỏi máy**, và **xoá sau khi phiên âm**.
  Giữ `android:allowBackup="false"`.
- **§6.7** — không có native thì thoái lui im lặng, không ném lỗi, không chặn ô
  gõ văn bản.
- **§4.4** — nút ghi là nút chính: `--touch-target-primary` = `max(56px, 3.5rem)`.
  Không `white-space: nowrap`.
- **§4.1** — mọi chuỗi từ catalog i18n, **kể cả ARIA label**. Không mã cứng.
- **§12** — không viết lại giao diện bằng Compose. React + Capacitor giữ nguyên.
- **§15.9.1** — không ai được gỡ `chua_nghe_duoc_cuoc_goi` khỏi `chuaKiem`.

---

## Task 1: Plugin rỗng, dựng được, thoái lui đúng

Mục tiêu: có `KhoanDaAudio` gọi được từ JS và **trả "không hỗ trợ"** sạch sẽ, trước khi có whisper.

**Files:**
- Create: `android/app/src/main/java/vn/khoanda/app/GhiAmPlugin.java`
- Modify: `android/app/src/main/java/vn/khoanda/app/MainActivity.java` (đăng ký plugin)
- Modify: `src/native.ts` (thêm vào interface `CauNoi`)

**Interfaces:**
- Produces: `phienAmGhiAm(): Promise<KetQuaGhiAm | null>` trong `native.ts`, với
  ```ts
  type KetQuaGhiAm = {
    vanBan: string; doTinCayThapNhat: number;
    ghiAmFailed: boolean; maLoi?: 'CHUA_TAI_MODEL' | 'KHONG_CO_TIENG_NOI' | 'BI_CAT';
  };
  ```
  Trả `null` khi không chạy trong APK.

- [ ] **Step 1:** Viết `GhiAmPlugin.java` với một method `trangThaiBoNghe()` trả `{ daCo: false }`. Chưa có whisper, chưa có micro.
- [ ] **Step 2:** Đăng ký plugin trong `MainActivity.java`, theo đúng cách `KhoanDaPlugin` đang đăng ký.
- [ ] **Step 3:** `./gradlew assembleDebug` — chờ dựng được.
- [ ] **Step 4:** Thêm `trangThaiBoNghe` vào interface `CauNoi` trong `src/native.ts`, và một hàm bọc trả `'khong_ho_tro'` khi `layCau()` là `null`.
- [ ] **Step 5:** Chạy `npm run dev` ở dự án Vite, mở trên **trình duyệt** (không phải APK), xác nhận không có lỗi console và ô gõ văn bản vẫn dùng được. Đây là ca §6.7.
- [ ] **Step 6:** Commit.

---

## Task 2: Ghi micro ra WAV 16kHz mono

**Files:**
- Modify: `GhiAmPlugin.java`
- Modify: `android/app/src/main/AndroidManifest.xml` (thêm `RECORD_AUDIO`)

- [ ] **Step 1:** Thêm `<uses-permission android:name="android.permission.RECORD_AUDIO" />` kèm chú thích vì sao cần và vì sao **không** xin `CAPTURE_AUDIO_OUTPUT` (Android chặn, và §2 spec đã loại khỏi phạm vi).
- [ ] **Step 2:** Viết `batDauGhi()` / `dungGhi()` dùng `AudioRecord`, `MediaRecorder.AudioSource.MIC`, 16000Hz, mono, PCM 16-bit.
- [ ] **Step 3:** Ghi ra file tạm trong `context.getCacheDir()` — **không** ra bộ nhớ ngoài.
- [ ] **Step 4:** Dựng APK, cắm máy thật, ghi thử 10 giây, `adb pull` file ra nghe. Xác nhận đúng 16kHz mono.
- [ ] **Step 5:** Viết `xoaTepTam()` và gọi nó ở `finally`. Xác nhận bằng `adb shell ls` rằng cache trống sau mỗi lượt.
- [ ] **Step 6:** Commit.

---

## Task 3: whisper.cpp qua JNI

**Files:**
- Create: `android/app/src/main/cpp/` (whisper.cpp + `CMakeLists.txt`)
- Modify: `android/app/build.gradle` (externalNativeBuild)
- Modify: `GhiAmPlugin.java`

- [ ] **Step 1:** Thêm whisper.cpp làm submodule hoặc chép nguồn vào `cpp/`. Ghi lại **commit hash** đã dùng vào chú thích — bản dựng phải tái lập được.
- [ ] **Step 2:** `CMakeLists.txt` + `externalNativeBuild` trong `build.gradle`. Dựng cho `arm64-v8a` và `armeabi-v7a`.
- [ ] **Step 3:** `./gradlew assembleDebug` — chờ có `.so` trong APK.
- [ ] **Step 4:** Viết cầu JNI `phienAm(String duongDanWav, String duongDanModel)` trả JSON gồm **từng đoạn** với `avg_logprob` và `no_speech_prob`.
- [ ] **Step 5:** ⚠️ **Chuẩn hoá trong Kotlin, không phải trong JS:**

```java
// exp(avg_logprob) → [0,1], khớp thang NGUONG_GHI_AM = 0.5 bên JS.
// Đẩy thẳng logprob (luôn ÂM) sang JS thì mọi lượt đều dưới ngưỡng và mọi
// lượt đều báo "không nghe được" — hỏng-quá-nhiều trông như thận trọng nên
// sẽ không ai soi ra.
double doTinCayThapNhat = 1.0;
for (Doan d : doanList) {
    doTinCayThapNhat = Math.min(doTinCayThapNhat, Math.exp(d.avgLogprob));
}
```

⚠️ `Math.min` trên **các đoạn**, không phải trung bình. Xem spec §5.
- [ ] **Step 6:** Test trên máy thật với ba đoạn ghi: (a) tiếng Việt rõ, (b) nhiễu nặng, (c) im lặng. Ghi lại `doTinCayThapNhat` thực đo của cả ba vào chú thích — **số đo, không phải số ước lượng**.
- [ ] **Step 7:** Commit.

---

## Task 4: Ba mã lỗi, đúng mã cho đúng chỗ

**Files:** `GhiAmPlugin.java`, `src/native.ts`

- [ ] **Step 1:** Không có file model ⇒ `{ ghiAmFailed: true, maLoi: 'CHUA_TAI_MODEL' }`.
- [ ] **Step 2:** Mọi đoạn có `no_speech_prob` cao ⇒ `{ ghiAmFailed: true, maLoi: 'KHONG_CO_TIENG_NOI' }`. Ngưỡng đo trên máy thật rồi mới chốt, đừng chép từ tài liệu.
- [ ] **Step 3:** Đoạn ghi vượt trần thời lượng ⇒ cắt, và `maLoi: 'BI_CAT'` — **kèm** phần chữ đã phiên âm được, vì hỏng một phần là daKiem VÀ chuaKiem cùng lúc (spec §5.1).
- [ ] **Step 4:** whisper ném / hết bộ nhớ ⇒ `{ ghiAmFailed: true }` **không kèm mã** — bên JS rơi về `khong_nghe_duoc_ghi_am`.
- [ ] **Step 5:** Test bốn ca trên máy thật. Với mỗi ca, bắt gói `/api/analyze` (`adb logcat` hoặc proxy) và **xác nhận `chuaKiem` trả về đúng mã mong đợi**. Đây là chỗ nối hai nửa — không có ca này thì không ai biết chúng có khớp không.
- [ ] **Step 6:** Commit.

---

## Task 5: Onboarding tải model

**Files:** giao diện React ở `../trợ-lý-ảo-khoan-đã (1)/src/`

- [ ] **Step 1:** Màn tải model, hiện **dung lượng thật** và khuyên dùng Wi-Fi. Không viết "đang chuẩn bị" chung chung.
- [ ] **Step 2:** ⚠️ **Không chặn ô gõ văn bản.** Bác phải kiểm được tin nhắn ngay trong lúc model đang tải. Ca test: mở app lần đầu, dán một tin nhắn, xác nhận có kết quả **trước khi** tải xong.
- [ ] **Step 3:** Nút bỏ qua. Bỏ qua rồi thì nút ghi hiện trạng thái "chưa có bộ nghe" — **không biến mất im lặng**.
- [ ] **Step 4:** Tải hỏng ⇒ nói hỏng, cho thử lại. Không âm thầm chuyển sang "sẵn sàng".
- [ ] **Step 5:** Mọi chuỗi từ catalog i18n, kể cả ARIA label (§4.1).
- [ ] **Step 6:** Commit.

---

## Task 6: Nút ghi âm và ô tải file

**Files:** giao diện React

- [ ] **Step 1:** Nút ghi — `--touch-target-primary`, không `nowrap`, nhãn từ catalog.
- [ ] **Step 2:** Trạng thái đang ghi phải thấy được **không chỉ bằng màu** (tương phản 3:1, `test/non-text-contrast.test.js`).
- [ ] **Step 3:** Ô tải file âm thanh có sẵn — dùng `<input type="file" accept="audio/*">`, không cần quyền micro.
- [ ] **Step 4:** ⚠️ **Câu chữ §11.** Viết "đã nghe đoạn ghi âm bác gửi", **không** viết "đã nghe cuộc gọi". Không viết "không nghe thấy lời đe doạ" — đó là khẳng định VẮNG MẶT. Không hiện `doTinCay` như xác suất lừa đảo.
- [ ] **Step 5:** Chạy `npm run lint` (tsc) ở dự án Vite, và `node --test` ở repo này để xác nhận sàn a11y còn nguyên.
- [ ] **Step 6:** Commit.

---

## Task 7: Ca 3 — nói thay vì gõ

Tách hẳn khỏi sáu task trên: đây là **ô nhập liệu**, không phải nguồn phân tích.

**Files:** `GhiAmPlugin.java`, giao diện React

- [ ] **Step 1:** Dùng `android.speech.SpeechRecognizer` với `vi-VN` — **không** dùng whisper. Nó miễn phí, không tải model, và Android 12+ có `createOnDeviceSpeechRecognizer()` chạy hẳn trên máy.
- [ ] **Step 2:** ⚠️ Kết quả đi vào **ô văn bản để bác sửa trước khi gửi**, không gửi thẳng. Khác với whisper: đây là bác đang gõ, không phải bác đang nộp bằng chứng.
- [ ] **Step 3:** Vì thế **không** đặt `ghiAm: true` cho đường này. Nó là `vanBan` thuần. Đặt `ghiAm` ở đây là khai sai nguồn.
- [ ] **Step 4:** Không có `SpeechRecognizer` (máy thiếu Google app) ⇒ nút mic không hiện. Không báo lỗi.
- [ ] **Step 5:** Commit.

---

## Self-Review

**Spec coverage:**

| Mục spec | Task |
|---|---|
| §3.1 biên 1 — Kotlin không biết gì về rủi ro | Global Constraints + Task 3, 4 |
| §3.1 biên 3 — không native thì thoái lui | Task 1 Step 5 |
| §3.1 biên 4 — âm thanh không rời máy, xoá sau | Task 2 Step 3, 5 |
| §5 chuẩn hoá exp(), lấy min theo đoạn | Task 3 Step 5 |
| §6 ca 1–8 | Task 4 (ca 1,3,4,5,6), Task 3 (ca 2,8) |
| §7 onboarding tải model | Task 5 |
| §8 tiếp cận §4.4 | Task 6 Step 1, 2 |
| §9 câu chữ §11 | Task 6 Step 4 |
| §2 ca 3 nói thay vì gõ | Task 7 |

**Điều kiện dừng:** Task 3 Step 6 và Task 4 Step 5 là hai chỗ **phải đo trên máy
thật**. Không có máy thật thì dừng, đừng chép số từ tài liệu whisper rồi ghi vào
chú thích như thể đã đo — §11 gọi tên đúng việc đó.
