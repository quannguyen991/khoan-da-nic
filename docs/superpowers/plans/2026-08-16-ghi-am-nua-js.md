# Ghi âm — nửa JS (sàn, hợp đồng, hàng rào) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng sàn §4.3 và hợp đồng §HĐ cho nguồn đầu vào ghi âm, **trước khi** có một dòng Kotlin nào.

**Architecture:** Ghi âm là nguồn đầu vào thứ sáu, đi vào đúng `/api/analyze` mà văn bản và ảnh đang đi. Nửa này thuần Node — không chạm Android, không cần thiết bị. Nó nhận bốn trường (`ghiAm`, `ghiAmConfidence`, `ghiAmFailed`, `ghiAmMaLoi`) từ thân yêu cầu, đẩy qua `unreadableInputFloor()`, và đảm bảo bằng test rằng không trường nào trong bốn trường đó hạ được mức.

**Tech Stack:** Node ≥20, `node:test`, CommonJS. Không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-08-16-ghi-am-tren-may-design.md`

**Vì sao nửa này đi trước:** spec §10 — "sàn §4.3 phải đứng trước khi nguồn đầu vào tới". Nửa native (`docs/superpowers/plans/2026-08-16-ghi-am-nua-native.md`) cần Android SDK + Java, **máy hiện tại không có cả hai**, nên nó không verify được ở đây.

## Global Constraints

- **§4.2** — mọi thứ thêm vào chỉ được **LÀM TĂNG** cảnh giác, không bao giờ giảm. Không trường nào từ thân yêu cầu được hạ mức.
- **§4.3** — "không kiểm được" ≠ "đã kiểm, không thấy gì". Mỗi trạng thái hỏng một mã riêng.
- **§HĐ** — phản hồi đúng **bảy trường**: `nhan`, `maLyDo`, `daKiem`, `chuaKiem`, `hoKichBan`, `aiDaChay`, `canThiep`. Không thêm trường thứ tám.
- **§HĐ luật 2** — `maLyDo` và mọi mã khác là **MÃ**, không phải câu. Khớp `/^[a-z][a-z0-9_]+$/`.
- **§12** — không đổi ngưỡng 20/45, cap 69, hay 10 critical override.
- **§15.9.1** — `chua_nghe_duoc_cuoc_goi` luôn có trong `chuaKiem`, **không ngoại lệ**. `pipeline.js:333` giữ nguyên, không task nào được gỡ.
- **§6.9** — không log nội dung thô. Không `console.log(vanBan)`.
- Ngưỡng mới: `NGUONG_GHI_AM = 0.5`, đối xứng với `NGUONG_OCR = 0.5` đã có.
- Không thêm dependency npm.

---

## File Structure

| File | Trách nhiệm | Thao tác |
|---|---|---|
| `src/analysis/trust-receipt-v2.js` | bảng `NGUON` + `GIOI_HAN` của Phiếu tin cậy | Sửa |
| `test/nguon-da-kiem-day-du.test.js` | chặn lệch giữa `NGUON` và `daKiem` pipeline sinh ra | Tạo |
| `scripts/xuat-hop-dong.js` | danh sách mã xuất cho catalog i18n | Sửa |
| `public/config/ma-hop-dong.json` | sinh ra từ script trên | Sinh lại |
| `src/analysis/pipeline.js` | `unreadableInputFloor()` — nhánh ghi âm | Sửa |
| `test/unreadable-input-floor.test.js` | tám ca hỏng của ghi âm | Sửa |
| `test/ghi-am-khong-ha-muc.test.js` | 445 mẫu × 2 lượt, không mẫu nào tụt mức | Tạo |
| `server.js` | `xuLyPhanTich` nhận bốn trường ghi âm | Sửa |
| `test/ghi-am-than-yeu-cau.test.js` | thân yêu cầu bịa được gì và không bịa được gì | Tạo |

---

## Task 1: Vá lỗ `NGUON` của Phiếu tin cậy

**Vì sao trước tiên:** `pipeline.js` đang đẩy `ghi_am`, `thong_bao_tin_nhan`, `bo_hoi_nhanh` vào `daKiem` nhưng bảng `NGUON` chỉ có ba mã, nên dòng 48 vứt cả ba **im lặng**. Ghi âm sẽ rơi thẳng vào cùng cái hố. Spec §3.3.

**Files:**
- Modify: `src/analysis/trust-receipt-v2.js:16-20`
- Test: `test/nguon-da-kiem-day-du.test.js` (tạo mới)

**Interfaces:**
- Consumes: `MA_DA_KIEM` từ `scripts/xuat-hop-dong.js:39-44` (đã có, 7 mã)
- Produces: `NGUON` đầy đủ 7 mã, dùng bởi Task 3 và Task 4

- [ ] **Step 1: Viết test hỏng**

Tạo `test/nguon-da-kiem-day-du.test.js`:

```js
'use strict';
/**
 * §4.3 ở CHIỀU NGƯỢC LẠI — Phiếu tin cậy khai THIẾU thứ nó đã kiểm.
 *
 * `buildTrustReceipt` lọc `daKiem` theo bảng `NGUON`. Mã nào không có trong bảng
 * bị vứt IM LẶNG. Đã xảy ra với ba mã: ghi_am, thong_bao_tin_nhan, bo_hoi_nhanh.
 *
 * Chiều sai này an toàn hơn §4.3 (khai ít hơn thực tế, không phải nhiều hơn),
 * nhưng nó vẫn khiến Phiếu nói sai về thứ nó đã làm — và nguồn đầu vào mới nào
 * cũng sẽ rơi vào đúng cái hố này nếu không có hàng rào.
 */

const test = require('node:test');
const assert = require('node:assert');

const { buildTrustReceipt, NGUON } = require('../src/analysis/trust-receipt-v2');
const { MA_DA_KIEM } = require('../scripts/xuat-hop-dong');

test('mọi mã daKiem của hợp đồng đều có trong bảng NGUON', () => {
  const thieu = MA_DA_KIEM.filter((ma) => !NGUON[ma]);
  assert.deepStrictEqual(thieu, [],
    `Phiếu tin cậy sẽ vứt im lặng các mã: ${thieu.join(', ')}`);
});

test('bảng NGUON không chứa mã lạ ngoài hợp đồng', () => {
  const la = Object.keys(NGUON).filter((ma) => !MA_DA_KIEM.includes(ma));
  assert.deepStrictEqual(la, [], `NGUON có mã không nằm trong hợp đồng: ${la.join(', ')}`);
});

test('ghi_am đi qua được Phiếu tin cậy, không bị nuốt', () => {
  const phieu = buildTrustReceipt({
    nhan: 'CHUA_THAY', maLyDo: [], daKiem: ['van_ban', 'ghi_am'],
    chuaKiem: ['chua_nghe_duoc_cuoc_goi'], aiDaChay: true, overrides: [],
  });
  assert.ok(phieu.daKiem.includes('ghi_am'),
    'đã nghe được đoạn ghi âm mà Phiếu không khai là nói thiếu');
});
```

- [ ] **Step 2: Chạy để xác nhận test hỏng**

```bash
node --test test/nguon-da-kiem-day-du.test.js
```

Chờ: FAIL. Test 1 báo thiếu `ghi_am, thong_bao_tin_nhan, bo_hoi_nhanh`. Test 3 báo `ghi_am` bị nuốt. Cũng có thể FAIL vì `xuat-hop-dong.js` chưa export `MA_DA_KIEM` — nếu vậy sang Step 3 xử lý luôn.

- [ ] **Step 3: Export `MA_DA_KIEM`**

Trong `scripts/xuat-hop-dong.js`, tìm dòng `module.exports` ở cuối file. Nếu chưa export `MA_DA_KIEM` thì thêm vào. Nếu file chưa có `module.exports` nào thì thêm ở cuối file:

```js
module.exports = { ...(module.exports || {}), MA_DA_KIEM, MA_CHUA_KIEM };
```

⚠️ Đọc cuối file trước khi sửa — không đè lên export đang có.

- [ ] **Step 4: Vá bảng `NGUON`**

Trong `src/analysis/trust-receipt-v2.js`, thay khối dòng 15-20:

```js
/**
 * Bảng TĨNH: mã nguồn đầu vào → mã hiển thị. Không sinh động, không nội suy.
 *
 * ⚠️ PHẢI KHỚP `MA_DA_KIEM` trong scripts/xuat-hop-dong.js. Dòng lọc ở
 * `buildTrustReceipt` vứt IM LẶNG mọi mã không có ở đây — ba mã đã từng bị vứt
 * như thế (ghi_am, thong_bao_tin_nhan, bo_hoi_nhanh). Thêm nguồn đầu vào mới
 * thì THÊM VÀO ĐÂY. Hàng rào: test/nguon-da-kiem-day-du.test.js.
 */
const NGUON = Object.freeze({
  van_ban: 'van_ban',
  anh_ocr: 'anh_ocr',
  url: 'url',
  ghi_am: 'ghi_am',
  thong_bao_tin_nhan: 'thong_bao_tin_nhan',
  bo_hoi_nhanh: 'bo_hoi_nhanh',
  nguoi_than_xac_nhan: 'nguoi_than_xac_nhan',
});
```

- [ ] **Step 5: Chạy test, xác nhận qua**

```bash
node --test test/nguon-da-kiem-day-du.test.js
```

Chờ: PASS cả ba.

- [ ] **Step 6: Chạy toàn bộ test, xác nhận không vỡ gì**

```bash
node --test
```

Chờ: không có test nào chuyển từ pass sang fail so với trước Task 1.

- [ ] **Step 7: Commit**

```bash
git add src/analysis/trust-receipt-v2.js scripts/xuat-hop-dong.js test/nguon-da-kiem-day-du.test.js
git commit -m "Phiếu tin cậy vứt im lặng ba nguồn đã kiểm được"
```

---

## Task 2: Ba mã `chuaKiem` mới vào hợp đồng

**Files:**
- Modify: `src/analysis/trust-receipt-v2.js` (bảng `GIOI_HAN`)
- Modify: `scripts/xuat-hop-dong.js:46-62` (`MA_CHUA_KIEM`)
- Regenerate: `public/config/ma-hop-dong.json`

**Interfaces:**
- Consumes: `NGUON` đầy đủ từ Task 1
- Produces: ba mã `chua_tai_xong_model_nghe`, `ghi_am_khong_co_tieng_noi`, `chi_nghe_duoc_phan_dau` — dùng bởi Task 3

- [ ] **Step 1: Viết test hỏng**

Thêm vào cuối `test/nguon-da-kiem-day-du.test.js`:

```js
test('ba mã hỏng của ghi âm đều có giới hạn hiển thị ở Phiếu', () => {
  const { GIOI_HAN } = require('../src/analysis/trust-receipt-v2');
  for (const ma of ['chua_tai_xong_model_nghe', 'ghi_am_khong_co_tieng_noi',
    'chi_nghe_duoc_phan_dau', 'khong_nghe_duoc_ghi_am']) {
    assert.ok(GIOI_HAN[ma], `mã ${ma} không có giới hạn ⇒ Phiếu sẽ im lặng về nó`);
  }
});

test('ba mã hỏng của ghi âm KHÔNG gộp chung một giới hạn', () => {
  const { GIOI_HAN } = require('../src/analysis/trust-receipt-v2');
  // "chưa tải bộ nghe" và "không giải mã được" là hai việc khác nhau, và một
  // trong hai thì bác tự sửa được. Gộp lại là nói sai (§4.3).
  assert.notStrictEqual(GIOI_HAN.chua_tai_xong_model_nghe,
    GIOI_HAN.khong_nghe_duoc_ghi_am);
  assert.notStrictEqual(GIOI_HAN.ghi_am_khong_co_tieng_noi,
    GIOI_HAN.khong_nghe_duoc_ghi_am);
});
```

- [ ] **Step 2: Chạy để xác nhận hỏng**

```bash
node --test test/nguon-da-kiem-day-du.test.js
```

Chờ: FAIL — `mã chua_tai_xong_model_nghe không có giới hạn`.

- [ ] **Step 3: Thêm vào bảng `GIOI_HAN`**

Trong `src/analysis/trust-receipt-v2.js`, thêm ba dòng vào `GIOI_HAN` (sau dòng `khong_nghe_duoc_ghi_am`):

```js
  // §4.3 — BA KIỂU HỎNG KHÁC NHAU CỦA NGUỒN GHI ÂM, ba mã riêng.
  // Gộp lại thì Phiếu nói "không giải mã được" trong khi thật ra là "bác chưa
  // tải bộ nghe" — hai việc khác nhau, và một trong hai bác tự sửa được.
  chua_tai_xong_model_nghe: 'chua_co_bo_nghe_tren_may',
  ghi_am_khong_co_tieng_noi: 'ghi_am_khong_co_tieng_noi',
  chi_nghe_duoc_phan_dau: 'chi_doc_duoc_phan_dau',
```

- [ ] **Step 4: Thêm vào `MA_CHUA_KIEM`**

Trong `scripts/xuat-hop-dong.js`, thêm vào mảng `MA_CHUA_KIEM` (sau `'noi_dung_qua_dai'`):

```js
  // §4.3 — ba chỗ hỏng của nguồn ghi âm trên máy.
  'chua_tai_xong_model_nghe', 'ghi_am_khong_co_tieng_noi', 'chi_nghe_duoc_phan_dau',
```

- [ ] **Step 5: Sinh lại `ma-hop-dong.json`**

```bash
node scripts/xuat-hop-dong.js --ghi
```

- [ ] **Step 6: Xác nhận file đã có ba mã mới**

```bash
node -e "const j=require('./public/config/ma-hop-dong.json');const c=['chua_tai_xong_model_nghe','ghi_am_khong_co_tieng_noi','chi_nghe_duoc_phan_dau'];console.log(c.map(m=>m+': '+j.chuaKiem.includes(m)).join('\n'))"
```

Chờ: cả ba `true`.

- [ ] **Step 7: Chạy test**

```bash
node --test
```

Chờ: PASS toàn bộ.

- [ ] **Step 8: Commit**

```bash
git add src/analysis/trust-receipt-v2.js scripts/xuat-hop-dong.js public/config/ma-hop-dong.json test/nguon-da-kiem-day-du.test.js
git commit -m "Ba kiểu hỏng của ghi âm, ba mã riêng — không gộp"
```

---

## Task 3: Nhánh ghi âm trong `unreadableInputFloor()`

**Vì sao đây là task nặng nhất:** nhánh hiện tại là `if/else` nhị phân (`pipeline.js:50-53`). Ca thường gặp nhất của whisper — *nghe được phần lớn, hụt một đoạn* — không vừa cái khuôn đó. Spec §5.1.

**Files:**
- Modify: `src/analysis/pipeline.js:22-24` (thêm hằng), `:50-53` (nhánh ghi âm)
- Test: `test/unreadable-input-floor.test.js` (thêm ca)

**Interfaces:**
- Consumes: ba mã từ Task 2
- Produces: `unreadableInputFloor()` nhận `{ ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi }`; `NGUONG_GHI_AM` export từ `pipeline.js`

**Hợp đồng đầu vào của nhánh này:**

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `ghiAm` | truthy | có nguồn ghi âm trong lượt này |
| `ghiAmConfidence` | number `[0,1]` | độ tin cậy **THẤP NHẤT** trong các đoạn, đã chuẩn hoá `exp(avg_logprob)` bên Kotlin |
| `ghiAmFailed` | boolean | hỏng hoàn toàn, không ra chữ nào |
| `ghiAmMaLoi` | string \| undefined | `'CHUA_TAI_MODEL'` \| `'KHONG_CO_TIENG_NOI'` \| `'BI_CAT'` |

- [ ] **Step 1: Viết tám ca test hỏng**

Thêm vào `test/unreadable-input-floor.test.js`, trước dòng cuối:

```js
// ═══════════ §4.3 — NGUỒN ĐẦU VÀO THỨ SÁU: GHI ÂM TRÊN MÁY ═══════════
// Ràng buộc thường trực ở pipeline.js:32 — thêm nguồn mới thì THÊM CA VÀO ĐÂY.

test('ghi âm #1 — model chưa tải xong có mã RIÊNG, không gộp', () => {
  const san = unreadableInputFloor({ ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'CHUA_TAI_MODEL' });
  assert.ok(san.chuaKiem.includes('chua_tai_xong_model_nghe'));
  assert.ok(!san.chuaKiem.includes('khong_nghe_duoc_ghi_am'),
    'chưa tải bộ nghe KHÁC không giải mã được — bác tự sửa được cái đầu');
});

test('ghi âm #2 — có đoạn dưới ngưỡng ⇒ không im lặng', () => {
  const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo alo', ghiAmConfidence: 0.3 });
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('ghi âm #3 — không có tiếng người có mã riêng', () => {
  const san = unreadableInputFloor({ ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'KHONG_CO_TIENG_NOI' });
  assert.ok(san.chuaKiem.includes('ghi_am_khong_co_tieng_noi'));
});

test('ghi âm #4 — đoạn ghi bị cắt có mã riêng', () => {
  const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo', ghiAmConfidence: 0.9, ghiAmMaLoi: 'BI_CAT' });
  assert.ok(san.chuaKiem.includes('chi_nghe_duoc_phan_dau'));
});

test('ghi âm #5 — whisper ném lỗi ⇒ khong_nghe_duoc_ghi_am', () => {
  const san = unreadableInputFloor({ ghiAm: true, ghiAmFailed: true });
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('ghi âm #6 — file sai định dạng ⇒ vẫn ra mã, không im lặng', () => {
  const san = unreadableInputFloor({ ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'MA_LA_KHONG_BIET' });
  assert.ok(san.chuaKiem.length > 0, 'mã lỗi lạ không được rơi vào khoảng lặng');
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('ghi âm #7 — confidence KHÔNG PHẢI SỐ bị coi là HỎNG, không phải là tốt', () => {
  for (const bay of [undefined, null, 'cao', NaN, -1, 1.5, {}]) {
    const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo', ghiAmConfidence: bay });
    assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'),
      `ghiAmConfidence=${String(bay)} phải bị coi là hỏng`);
  }
});

test('ghi âm #8 — HỎNG MỘT PHẦN là daKiem VÀ chuaKiem CÙNG LÚC', () => {
  // Ca thường gặp nhất của whisper: nghe được phần lớn, hụt một đoạn.
  // Khai một trong hai đều nói sai (spec §5.1).
  const san = unreadableInputFloor({
    ghiAm: true, vanBan: 'bác chuyển tiền đi', ghiAmConfidence: 0.3,
  });
  assert.ok(san.daKiem.includes('ghi_am'), 'đã phiên âm được thì phải khai');
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'), 'hụt đoạn thì phải khai');
});

test('ghi âm — nghe tốt hoàn toàn thì KHÔNG sinh mã hỏng nào của ghi âm', () => {
  const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo bác ơi', ghiAmConfidence: 0.95 });
  assert.ok(san.daKiem.includes('ghi_am'));
  const maGhiAm = ['khong_nghe_duoc_ghi_am', 'chua_tai_xong_model_nghe',
    'ghi_am_khong_co_tieng_noi', 'chi_nghe_duoc_phan_dau'];
  assert.deepStrictEqual(san.chuaKiem.filter((m) => maGhiAm.includes(m)), []);
});

test('§15.9.1 — nghe được ghi âm KHÔNG gỡ chua_nghe_duoc_cuoc_goi', () => {
  // Ghi qua loa ngoài là nghe cái MICRO ĐẶT CẠNH cuộc gọi, không phải nghe
  // cuộc gọi. Phiếu tin cậy phải nói đúng cái thứ hai.
  const kq = analyze({ vanBan: 'alo bác ơi', ghiAm: true, ghiAmConfidence: 0.95 });
  assert.ok(kq.chuaKiem.includes('chua_nghe_duoc_cuoc_goi'));
});
```

- [ ] **Step 2: Chạy để xác nhận hỏng**

```bash
node --test test/unreadable-input-floor.test.js
```

Chờ: FAIL nhiều ca. Ca #8 đặc biệt phải fail vì `if/else` hiện tại không thể trả cả hai.

- [ ] **Step 3: Thêm hằng ngưỡng**

Trong `src/analysis/pipeline.js`, sau dòng `const NGUONG_OCR = 0.5;`:

```js
/**
 * §4.3 — NGƯỠNG GHI ÂM, đối xứng với NGUONG_OCR.
 *
 * ⚠️ ĐƠN VỊ: đây là thang [0,1], KHÔNG PHẢI logprob. whisper.cpp trả
 * `avg_logprob` luôn âm (−0,1 đến −1,5); plugin Kotlin chuẩn hoá bằng
 * `exp(avg_logprob)` TRƯỚC KHI trả sang JS. exp(−0,69) ≈ 0,5.
 * So thẳng logprob với 0.5 thì lượt nào cũng ra "hỏng".
 *
 * ⚠️ Giá trị nhận vào là độ tin cậy THẤP NHẤT trong các đoạn, không phải trung
 * bình. Whisper nghe được 90% mà nuốt đúng câu "chuyển sang tài khoản an toàn"
 * thì bản chép còn lại trông sạch sẽ — trung bình cả bài che mất đúng ca nguy
 * hiểm nhất.
 */
const NGUONG_GHI_AM = 0.5;

/** Mã lỗi plugin trả về → mã chuaKiem. Mã lạ rơi về khong_nghe_duoc_ghi_am. */
const MA_LOI_GHI_AM = Object.freeze({
  CHUA_TAI_MODEL: 'chua_tai_xong_model_nghe',
  KHONG_CO_TIENG_NOI: 'ghi_am_khong_co_tieng_noi',
  BI_CAT: 'chi_nghe_duoc_phan_dau',
});
```

- [ ] **Step 4: Thay nhánh ghi âm**

Trong `src/analysis/pipeline.js`, thay khối dòng 50-53:

```js
  /**
   * §4.3 — NGUỒN ĐẦU VÀO THỨ SÁU: GHI ÂM PHIÊN ÂM TRÊN MÁY.
   *
   * ⚠️ HAI ĐIỀU KIỆN ĐỘC LẬP, KHÔNG PHẢI if/else.
   * Ca thường gặp nhất của whisper là "nghe được phần lớn, hụt một đoạn" — lúc
   * đó CẢ HAI đều đúng: đã phiên âm được (daKiem), và có đoạn không nghe được
   * (chuaKiem). Nhị phân hoá nó là nói sai ở một trong hai đầu.
   */
  if (input.ghiAm) {
    const coChu = typeof input.vanBan === 'string' && input.vanBan.trim().length > 0;
    const doTinCay = input.ghiAmConfidence;
    // ⚠️ Không phải số / ngoài [0,1] ⇒ HỎNG, không phải ⇒ tốt. §4.3.
    const tinCayDuoc = typeof doTinCay === 'number' && Number.isFinite(doTinCay)
      && doTinCay >= NGUONG_GHI_AM && doTinCay <= 1;

    if (coChu && !input.ghiAmFailed) daKiem.push('ghi_am');

    if (input.ghiAmFailed === true || !coChu) {
      chuaKiem.push(MA_LOI_GHI_AM[input.ghiAmMaLoi] || 'khong_nghe_duoc_ghi_am');
    } else {
      if (!tinCayDuoc) chuaKiem.push('khong_nghe_duoc_ghi_am');
      if (MA_LOI_GHI_AM[input.ghiAmMaLoi]) chuaKiem.push(MA_LOI_GHI_AM[input.ghiAmMaLoi]);
    }
  }
```

⚠️ Nhánh này đặt **sau** nhánh `input.anh` và **trước** nhánh `input.thongBao`, giữ đúng thứ tự nguồn đầu vào của file.

- [ ] **Step 5: Export hằng mới**

Ở `module.exports` cuối `src/analysis/pipeline.js`, thêm `NGUONG_GHI_AM` và `MA_LOI_GHI_AM` vào danh sách export. Đọc dòng export hiện có trước khi sửa — không đè.

- [ ] **Step 6: Chạy test, xác nhận qua**

```bash
node --test test/unreadable-input-floor.test.js
```

Chờ: PASS toàn bộ, kể cả ca #8.

- [ ] **Step 7: Chạy toàn bộ test**

```bash
node --test
```

Chờ: không test nào chuyển pass → fail.

- [ ] **Step 8: Commit**

```bash
git add src/analysis/pipeline.js test/unreadable-input-floor.test.js
git commit -m "Hỏng một phần là đã kiểm VÀ chưa kiểm cùng lúc"
```

---

## Task 4: Hàng rào — ghi âm không hạ được mức

**Files:**
- Test: `test/ghi-am-khong-ha-muc.test.js` (tạo mới)

**Interfaces:**
- Consumes: `analyze()` từ `pipeline.js`, `napDataset()` từ `eval/lib/bo-danh-gia`
- Produces: không gì — đây là hàng rào thuần

- [ ] **Step 1: Viết test**

Tạo `test/ghi-am-khong-ha-muc.test.js`:

```js
'use strict';
/**
 * §4.2 PHÁT BIỂU THÀNH MỘT PHÉP ĐO CHẠY ĐƯỢC, cho nguồn ghi âm.
 *
 * "Mọi thứ thông minh thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm."
 *
 * Bốn trường ghi âm đến TỪ THÂN YÊU CẦU, tức người gọi bịa được. Nếu bịa được
 * một tổ hợp làm TỤT mức thì đó là câu thần chú tặng cho kẻ lừa đảo — cùng bài
 * học với "please hold" và "ch play" (§12).
 *
 * Chạy TOÀN BỘ 445 mẫu, mỗi mẫu nhiều lượt: một lượt không có trường ghi âm,
 * rồi từng tổ hợp ghi âm. KHÔNG LƯỢT NÀO được thấp hơn lượt gốc.
 *
 * ⚠️ CHỈ BỘ LUẬT — không gọi AI. Câu trả lời không được phụ thuộc gateway.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../src/analysis/pipeline');
const { napDataset } = require('../eval/lib/bo-danh-gia');

const BAC = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };

/** Mọi tổ hợp người gọi có thể bịa, kể cả tổ hợp "trông đẹp nhất". */
const TO_HOP = [
  { ten: 'nghe tốt hoàn toàn', o: { ghiAm: true, ghiAmConfidence: 1 } },
  { ten: 'hỏng hoàn toàn', o: { ghiAm: true, ghiAmFailed: true } },
  { ten: 'hụt một đoạn', o: { ghiAm: true, ghiAmConfidence: 0.3 } },
  { ten: 'chưa tải model', o: { ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'CHUA_TAI_MODEL' } },
  { ten: 'không tiếng người', o: { ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'KHONG_CO_TIENG_NOI' } },
  { ten: 'bị cắt', o: { ghiAm: true, ghiAmConfidence: 0.9, ghiAmMaLoi: 'BI_CAT' } },
  { ten: 'confidence rác', o: { ghiAm: true, ghiAmConfidence: 'cao' } },
  { ten: 'mã lỗi lạ', o: { ghiAm: true, ghiAmMaLoi: 'KHONG_TON_TAI' } },
];

const { mau, loi } = napDataset();

test('dữ liệu nạp được — nếu không thì mọi khẳng định dưới đây vô nghĩa', () => {
  assert.deepStrictEqual(loi, [], `dataset hỏng: ${loi[0]}`);
  assert.ok(mau.length >= 445, `chỉ có ${mau.length} mẫu, chờ ≥445`);
});

test('§4.2 — không tổ hợp ghi âm nào kéo tụt mức của 445 mẫu', () => {
  const tut = [];
  for (const m of mau) {
    const goc = analyze({ vanBan: m.vanBan });
    for (const { ten, o } of TO_HOP) {
      const sau = analyze({ vanBan: m.vanBan, ...o });
      if (BAC[sau.nhan] < BAC[goc.nhan]) {
        tut.push(`${m.id || '?'} · ${ten}: ${goc.nhan} → ${sau.nhan}`);
      }
    }
  }
  assert.deepStrictEqual(tut, [],
    `${tut.length} lượt tụt mức vì trường ghi âm:\n${tut.slice(0, 10).join('\n')}`);
});

test('§HĐ luật 2 — mọi mã chuaKiem sinh ra vẫn là MÃ, không phải câu', () => {
  for (const { o } of TO_HOP) {
    const kq = analyze({ vanBan: 'Bác chuyển tiền sang tài khoản an toàn ngay.', ...o });
    for (const ma of kq.chuaKiem) {
      assert.match(ma, /^[a-z][a-z0-9_]+$/, `chuaKiem phải là MÃ, gặp "${ma}"`);
    }
  }
});
```

- [ ] **Step 2: Chạy**

```bash
node --test test/ghi-am-khong-ha-muc.test.js
```

Chờ: PASS. **Nếu FAIL thì dừng lại** — nghĩa là có đường hạ mức thật, và đó là lỗi cần sửa ở Task 3, không phải nới test.

- [ ] **Step 3: Commit**

```bash
git add test/ghi-am-khong-ha-muc.test.js
git commit -m "445 mẫu × 8 tổ hợp ghi âm: không lượt nào tụt mức"
```

---

## Task 5: `server.js` nhận bốn trường ghi âm

**Vì sao cẩn thận:** `xuLyPhanTich` **cố ý** chỉ rút `vanBan` và `anh`, không trải `...req.body`, vì trường tự khai từng là đường hạ mức (`verifiedChannel`, `verifiedRelationship`). Spec §3.2.

**Files:**
- Modify: `server.js:196-221` (`xuLyPhanTich`), `:279-292` (`/api/analyze/so-bo`)
- Test: `test/ghi-am-than-yeu-cau.test.js` (tạo mới)

**Interfaces:**
- Consumes: `unreadableInputFloor()` đã nhận bốn trường (Task 3)
- Produces: `/api/analyze` và `/api/analyze/so-bo` nhận `{ vanBan, anh, ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi }`

- [ ] **Step 1: Viết test hỏng**

Tạo `test/ghi-am-than-yeu-cau.test.js`:

```js
'use strict';
/**
 * §3.2 spec — BỀ MẶT TẤN CÔNG CỦA THÂN YÊU CẦU.
 *
 * `xuLyPhanTich` cố ý KHÔNG trải `...req.body`. Thêm bốn trường ghi âm phải giữ
 * đúng tính chất đó: người gọi bịa được chúng, nên không trường nào được hạ mức,
 * và không trường nào được mở đường cho trường thứ năm lọt vào.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../src/analysis/pipeline');

test('trường lạ đi kèm ghi âm KHÔNG lọt vào phân tích', () => {
  const doc = 'Bác chuyển hết tiền sang tài khoản an toàn của Bộ Công an ngay.';
  const sach = analyze({ vanBan: doc });
  const banBiu = analyze({
    vanBan: doc, ghiAm: true, ghiAmConfidence: 1,
    verifiedChannel: true, verifiedRelationship: 'con_ruot', riskLabel: 'NO_SIGNS_FOUND',
  });
  assert.strictEqual(banBiu.nhan, sach.nhan,
    'trường tự khai đi ké trường ghi âm là đường hạ mức');
});

test('ghiAm không kèm chữ nào ⇒ không được khai là đã kiểm', () => {
  const kq = analyze({ vanBan: '', ghiAm: true, ghiAmConfidence: 1 });
  assert.ok(!kq.daKiem.includes('ghi_am'),
    'khai đã nghe được mà không có chữ nào là đúng bẫy §4.3');
  assert.ok(kq.chuaKiem.length > 0);
});

test('ghi âm hỏng một mình ⇒ nhãn KHÔNG được là CHUA_THAY', () => {
  const kq = analyze({ ghiAm: true, ghiAmFailed: true });
  assert.notStrictEqual(kq.nhan, 'CHUA_THAY',
    'không nghe được gì mà hiện "Chưa thấy dấu hiệu rủi ro" là đúng lỗi §4.3');
});
```

- [ ] **Step 2: Chạy để xác nhận hỏng**

```bash
node --test test/ghi-am-than-yeu-cau.test.js
```

Chờ: ca 2 và 3 có thể fail tuỳ hành vi hiện tại. Ghi lại ca nào fail.

- [ ] **Step 3: Nới `xuLyPhanTich`**

Trong `server.js`, thay dòng 197:

```js
  const { vanBan, anh, ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi } = req.body || {};
```

Và cập nhật chú thích khối trên nó — thêm vào sau dòng `⚠️ CHỈ RÚT vanBan VÀ anh`:

```
 * §4.3 — thêm bốn trường nguồn ghi âm: ghiAm, ghiAmConfidence, ghiAmFailed,
 * ghiAmMaLoi. Vẫn RÚT TỪNG TRƯỜNG, không trải `...req.body`.
 *
 * ⚠️ Cả bốn đều do người gọi tự khai, nên cả bốn phải CHỈ TĂNG cảnh giác:
 *  · ghiAm chỉ thêm vào daKiem, mà daKiem không vào công thức điểm
 *  · ghiAmFailed / ghiAmConfidence thấp chỉ thêm chuaKiem
 *  · ghiAmMaLoi chỉ CHỌN mã chuaKiem nào, không đổi điểm
 * Hàng rào: test/ghi-am-khong-ha-muc.test.js (445 mẫu × 8 tổ hợp).
```

- [ ] **Step 4: Cho phép ghi âm là đầu vào hợp lệ**

Trong `server.js`, thay khối kiểm đầu vào (dòng ~207-210):

```js
  const coVanBan = typeof vanBan === 'string' && vanBan.trim().length > 0;
  // §4.3 — ghi âm HỎNG cũng là một đầu vào. Trả 400 "thiếu đầu vào" cho lượt
  // ghi âm hỏng là biến một trạng thái CẦN NÓI RA thành một lỗi im lặng.
  if (!coVanBan && !anh && !ghiAm) {
    return res.status(400).json({ maLoi: 'THIEU_DAU_VAO' });
  }
```

- [ ] **Step 5: Truyền xuống `analyze()`**

Thay dòng `const soBo = analyze({ vanBan: coVanBan ? vanBan : '', anh });`:

```js
  const soBo = analyze({
    vanBan: coVanBan ? vanBan : '', anh,
    ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi,
  });
```

⚠️ Tìm **mọi** lượt gọi `analyze(` trong `server.js` ở cả hai route và cập nhật giống nhau — bỏ sót một chỗ thì `/api/analyze/so-bo` và `/api/analyze` cho kết quả khác nhau, và §HĐ nói sơ bộ phải ≤ kết quả cuối.

- [ ] **Step 6: Làm tương tự cho `/api/analyze/so-bo`**

Áp dụng đúng Step 3–5 cho handler ở dòng ~279.

- [ ] **Step 7: Kiểm cú pháp**

```bash
npm run check
```

Chờ: không lỗi.

- [ ] **Step 8: Chạy toàn bộ test**

```bash
node --test
```

Chờ: PASS toàn bộ.

- [ ] **Step 9: Commit**

```bash
git add server.js test/ghi-am-than-yeu-cau.test.js
git commit -m "Bốn trường ghi âm vào cửa /api/analyze, vẫn không trải req.body"
```

---

## Task 6: Chốt — chạy đủ hàng rào cũ

**Files:** không sửa file nào. Đây là cổng xác minh.

- [ ] **Step 1: Chạy toàn bộ test**

```bash
node --test
```

Chờ: PASS toàn bộ. Ghi lại con số pass/fail thực tế, **không phỏng đoán**.

- [ ] **Step 2: Xác nhận §4.3 và §15.9.1 còn nguyên**

```bash
node --test test/unchecked-not-safe.test.js test/unreadable-input-floor.test.js test/truy-cap-nhanh.test.js
```

Chờ: PASS.

- [ ] **Step 3: Xác nhận sàn tiếp cận không bị đụng**

```bash
node --test test/font-size-floor.test.js test/contrast.test.js test/no-nowrap-on-controls.test.js
```

Chờ: PASS. Nửa JS không đụng CSS nên phải y nguyên.

- [ ] **Step 4: Xác nhận hợp đồng xuất ra khớp**

```bash
node scripts/xuat-hop-dong.js > /dev/null && echo "hợp đồng xuất được"
```

- [ ] **Step 5: Commit nếu còn gì chưa commit**

```bash
git status --short
```

---

## Self-Review

**Spec coverage:**

| Mục spec | Task |
|---|---|
| §3.1 biên 2 — chữ phiên âm vào cùng cửa `vanBan` | Task 5 |
| §3.2 bề mặt tấn công thân yêu cầu | Task 4, Task 5 |
| §3.3 lỗ `NGUON` | Task 1 |
| §4 ba mã `chuaKiem` mới | Task 2 |
| §5 ngưỡng hai tầng | Task 3 |
| §5.1 hỏng một phần | Task 3 ca #8 |
| §6 tám trạng thái hỏng | Task 3 |
| §2 ngoài phạm vi — `pipeline.js:333` giữ nguyên | Task 3 ca §15.9.1 |

**Không có trong kế hoạch này (chủ ý):** §3.1 biên 1 và 4 (Kotlin), §7 onboarding, §8 a11y, §9 câu chữ — đều thuộc nửa native/giao diện, cần Android SDK. Xem `2026-08-16-ghi-am-nua-native.md`.

**Điều kiện dừng:** bất kỳ task nào làm test cũ chuyển pass → fail thì **dừng, không nới test cũ**. Test cũ là hàng rào của §4.3 và §4.2; sửa chúng để kế hoạch này chạy được là đúng thứ ba lần lỗi trước đã làm.
