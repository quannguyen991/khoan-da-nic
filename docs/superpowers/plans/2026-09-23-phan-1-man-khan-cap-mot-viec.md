# Phần 1 — Màn khẩn cấp chỉ có một việc · Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ở mức CAO / PAUSE_60S / lượt tự bấm dừng, màn cảnh báo chỉ còn một câu lệnh ngắn và một nút gọi to ở nửa trên màn, tự đọc to khi hiện. Làm tương tự cho màn kết quả "Đang bị ai gọi?". Sửa câu nói quá ở màn giới thiệu.

**Architecture:** Không đổi bộ luật và không đổi hợp đồng §HĐ. Mọi thay đổi nằm ở tầng hiển thị:
- `WarningView` (src/App.tsx) có thêm biến `heroGap`. Khi biến này đúng, nút chính và câu lệnh được đưa lên ngay dưới nhãn, còn vòng đếm và hình tam giác bị ẩn.
- `HoiNhanhView` có câu dặn hiện ngay từ lần chạm đầu và có nút gọi trên màn kết quả.
- Thêm hai tệp nhỏ trong `src/lib`: câu lệnh ngắn, và hook đọc to một lần.

**Tech Stack:** React 19 + TypeScript + Tailwind, test bằng `node --test` (đọc mã nguồn và bundle bằng esbuild), i18n ở `src/i18n.ts`.

**Spec:** `docs/superpowers/specs/2026-09-23-cau-dao-gia-dinh-design.md` — mục 2 (Phần 1).

## Global Constraints

- §HĐ bảy trường giữ nguyên. Khối `chuaKiem` **cùng cỡ chữ với nhãn**: nhãn 25px thì `chuaKiem` 25px. Chỉ được đổi vị trí, xuống dưới nút gọi.
- Không đụng `backend/src/analysis/*`: giữ 10 override, ngưỡng 20/45, trần 69.
- App không tự gọi, không tự nhắn. Đọc to tự động chỉ **nói**, không làm gì khác.
- Mọi chuỗi người dùng đọc đi qua `t()`, có trong cả `translations.vi` lẫn `translations.en`.
- Không có chữ "an toàn" / "Safe" / "đã chặn" trong câu mới.
- Sàn §4.4: vùng chạm ≥ 52px (nút chính ≥ 56px), chữ ≥ 14px, không `whitespace-nowrap` trên nút, `leading` ≥ 1.25.
- Tệp `src/App.tsx` và `src/i18n.ts` dùng CRLF. Sửa bằng Edit tool, hoặc script Python có `newline=''`. **Không dùng heredoc** cho regex (xem memory "heredoc nuốt dấu gạch chéo").
- Không commit khi người dùng chưa bảo.

---

### Task 1: Câu lệnh ngắn (≤ 8 chữ) cho từng việc an toàn

**Files:**
- Modify: `src/lib/viec-an-toan-tiep-theo.ts` (thêm vào cuối tệp)
- Modify: `src/i18n.ts` (thêm 8 khoá vi + en)
- Test: `test/cau-lenh-ngan.test.js` (mới)

**Interfaces:**
- Produces: `CAU_LENH_NGAN: Record<ViecAnToan, string>`, `CAU_LENH_KHI_CHUA_CO_SO: Partial<Record<ViecAnToan, string>>`, `cauLenhNgan(viec: ViecAnToan | null, coSoNguoiThan: boolean): string`. Chuỗi trả về là **khoá catalog**; người gọi bọc bằng `t()`.

- [ ] **Step 1: Viết test đỏ** — `test/cau-lenh-ngan.test.js`

```js
'use strict';
/**
 * CÂU LỆNH NGẮN — dòng chữ to nhất trên màn khẩn cấp (Phần 1, 23/9/2026).
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const RA = path.join(GOC, 'node_modules', '.goi-test-vong-tron');

function goi(nguon, ten) {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(RA, { recursive: true });
  const ra = path.join(RA, ten);
  esbuild.buildSync({ entryPoints: [nguon], bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent' });
  return require(ra);
}
const V = goi(path.join(GOC, 'src', 'lib', 'viec-an-toan-tiep-theo.ts'), 'cau-lenh-ngan.cjs');
const { translations } = goi(path.join(GOC, 'src', 'i18n.ts'), 'i18n-cau-lenh.cjs');

const tatCa = () => [...Object.values(V.CAU_LENH_NGAN), ...Object.values(V.CAU_LENH_KHI_CHUA_CO_SO)];

test('mỗi việc an toàn có đúng một câu lệnh ngắn', () => {
  for (const viec of ['goi_ngan_hang_phuc_hoi', 'khong_cai_gui_nguoi_than', 'goi_so_cu_nguoi_than', 'goi_so_sau_the', 'khong_doc_ma', 'cup_may_goi_nguoi_than']) {
    assert.ok(V.CAU_LENH_NGAN[viec], `thiếu câu lệnh cho ${viec}`);
  }
});

test('câu lệnh ngắn tối đa 8 chữ — người đang hoảng không đọc hết câu dài', () => {
  for (const cau of tatCa()) {
    const soChu = cau.trim().split(/\s+/).length;
    assert.ok(soChu <= 8, `"${cau}" có ${soChu} chữ`);
  }
});

test('mọi câu lệnh ngắn có trong CẢ HAI catalog (§4.1)', () => {
  for (const cau of tatCa()) {
    assert.ok(translations.vi[cau], `thiếu bản tiếng Việt: "${cau}"`);
    assert.ok(translations.en[cau] && translations.en[cau] !== cau, `thiếu bản tiếng Anh: "${cau}"`);
  }
});

test('§11 — không hứa an toàn, không bịa số', () => {
  for (const cau of tatCa()) {
    assert.ok(!/an toàn|chắc chắn|đã chặn|lấy lại được/i.test(cau), `câu vượt quá điều app biết: "${cau}"`);
    assert.ok(!/\d/.test(cau), `câu tự đưa ra một con số: "${cau}"`);
  }
});

test('chưa có số người thân thì câu lệnh KHÔNG bảo "gọi con cháu" — nút chính lúc đó là 113', () => {
  for (const viec of Object.keys(V.CAU_LENH_NGAN)) {
    assert.ok(!/con cháu/i.test(V.cauLenhNgan(viec, false)), `${viec} khi chưa có số: "${V.cauLenhNgan(viec, false)}"`);
  }
  assert.strictEqual(V.cauLenhNgan(null, true), V.CAU_LENH_NGAN.cup_may_goi_nguoi_than,
    'lượt tự bấm dừng (không có mã nào) dùng câu mặc định');
});
```

- [ ] **Step 2: Chạy, thấy đỏ**

Run: `node --test test/cau-lenh-ngan.test.js`
Expected: FAIL — `V.CAU_LENH_NGAN` undefined.

- [ ] **Step 3: Viết mã** — thêm vào cuối `src/lib/viec-an-toan-tiep-theo.ts`

```ts
/**
 * CÂU LỆNH NGẮN — dòng chữ to nhất trên màn khẩn cấp, và là câu máy tự đọc to.
 * Thêm 23/9/2026 (Phần 1 "Cầu dao gia đình").
 *
 * ⚠️ TỐI ĐA 8 CHỮ, có test đếm. Người đang bị ép không đọc hết một câu dài;
 * `CAU_VIEC_AN_TOAN` ở trên vẫn là bản đầy đủ cho các màn không gấp.
 *
 * ⚠️ CHƯA CÓ SỐ NGƯỜI THÂN THÌ KHÔNG BẢO "GỌI CON CHÁU". Nút chính lúc đó là
 * Cảnh sát 113; câu lệnh bảo gọi một người không có số là sai với nút ngay dưới.
 */
export const CAU_LENH_NGAN: Record<ViecAnToan, string> = {
  goi_ngan_hang_phuc_hoi: 'Gọi ngay số in sau thẻ ngân hàng.',
  khong_cai_gui_nguoi_than: 'Đừng cài gì. Gọi con cháu.',
  goi_so_cu_nguoi_than: 'Gọi lại số cũ của người thân.',
  goi_so_sau_the: 'Cúp máy. Gọi số sau thẻ.',
  khong_doc_ma: 'Đừng đọc mã cho ai.',
  cup_may_goi_nguoi_than: 'Cúp máy. Gọi con cháu ngay.',
};

export const CAU_LENH_KHI_CHUA_CO_SO: Partial<Record<ViecAnToan, string>> = {
  khong_cai_gui_nguoi_than: 'Đừng cài gì. Cúp máy ngay.',
  cup_may_goi_nguoi_than: 'Cúp máy. Đừng chuyển tiền.',
};

/** Khoá catalog của câu lệnh — người gọi bọc bằng `t()`. `null` (lượt tự bấm dừng) dùng câu mặc định. */
export function cauLenhNgan(viec: ViecAnToan | null, coSoNguoiThan: boolean): string {
  const v: ViecAnToan = viec ?? 'cup_may_goi_nguoi_than';
  const thay = coSoNguoiThan ? undefined : CAU_LENH_KHI_CHUA_CO_SO[v];
  return thay ?? CAU_LENH_NGAN[v];
}
```

- [ ] **Step 4: Thêm 8 khoá i18n.** Dùng script `them-i18n.py` (Task 0 bên dưới) với cặp vi → en:

```json
{
  "Gọi ngay số in sau thẻ ngân hàng.": "Call the number on the back of your bank card now.",
  "Đừng cài gì. Gọi con cháu.": "Don't install anything. Call your family.",
  "Gọi lại số cũ của người thân.": "Call your relative's saved number.",
  "Cúp máy. Gọi số sau thẻ.": "Hang up. Call the number on your card.",
  "Đừng đọc mã cho ai.": "Do not read out any code.",
  "Cúp máy. Gọi con cháu ngay.": "Hang up. Call your family now.",
  "Đừng cài gì. Cúp máy ngay.": "Don't install anything. Hang up now.",
  "Cúp máy. Đừng chuyển tiền.": "Hang up. Do not send money."
}
```

- [ ] **Step 5: Chạy, thấy xanh**

Run: `node --test test/cau-lenh-ngan.test.js`
Expected: PASS 5/5.

### Task 0 (dùng chung): script thêm khoá i18n

**Files:** Create `C:\Users\admin\AppData\Local\Temp\claude\D--KHOAN-DA-24H\5136ce9a-bd82-40dd-8be4-d71f7786cde1\scratchpad\them-i18n.py`

```python
# -*- coding: utf-8 -*-
"""Thêm khoá vào CẢ HAI catalog của src/i18n.ts. Dùng: python them-i18n.py cap.json
cap.json = { "câu tiếng Việt": "English", ... }. Khoá đã có thì bỏ qua (không ghi đè)."""
import io, json, sys
CR, LF = chr(13), chr(10)
p = 'D:/KHOAN-DA-24H/src/i18n.ts'
raw = io.open(p, encoding='utf-8', newline='').read()
crlf = (CR + LF) in raw
s = raw.replace(CR + LF, LF)
cap = json.load(io.open(sys.argv[1], encoding='utf-8'))
MOC_VI = '    "Đăng ẩn danh": "Đăng ẩn danh",'
MOC_EN = '    "Đăng ẩn danh": "Posted anonymously",'
assert s.count(MOC_VI) == 1 and s.count(MOC_EN) == 1, 'mốc i18n đã đổi'
vi, en = [], []
for k, v in cap.items():
    kk = json.dumps(k, ensure_ascii=False)
    if ('    %s:' % kk) in s:
        continue
    vi.append('    %s: %s,' % (kk, kk))
    en.append('    %s: %s,' % (kk, json.dumps(v, ensure_ascii=False)))
if vi:
    s = s.replace(MOC_VI, MOC_VI + LF + LF.join(vi), 1)
    s = s.replace(MOC_EN, MOC_EN + LF + LF.join(en), 1)
io.open(p, 'w', encoding='utf-8', newline='').write(s.replace(LF, CR + LF) if crlf else s)
print('them', len(vi), 'bo qua', len(cap) - len(vi))
```

---

### Task 2: Hook đọc to một lần

**Files:**
- Create: `src/lib/doc-to-mot-lan.ts`
- Test: `test/man-khan-cap-mot-viec.test.js` (mới, dùng chung cho Task 2–5)

**Interfaces:**
- Consumes: `docTo(chu: string, ngonNgu?: string): Promise<{ ok: boolean; ma?: string }>` từ `src/native.ts:926`.
- Produces: `useDocToMotLan(cau: string, bat: boolean, ngonNgu: string, khiBatDau?: () => void, khiXong?: () => void): void`.

- [ ] **Step 1: Viết test đỏ** — tạo `test/man-khan-cap-mot-viec.test.js` với phần đầu:

```js
'use strict';
/**
 * PHẦN 1 "CẦU DAO GIA ĐÌNH" — MÀN KHẨN CẤP CHỈ CÓ MỘT VIỆC (23/9/2026).
 * Người dùng báo: "trong trường hợp hoảng loạn mà cho 1 đống chữ thì ai thèm đọc".
 * Đo trước khi sửa (375×812, PROTECTED_CRITICAL): nút gọi con ở y=716–805,
 * giữa màn là khối "CHƯA kiểm được" 25px; đọc to chỉ khi bấm.
 * ⚠️ Test đọc mã nguồn. Đo hình học làm trên trình duyệt (xem kế hoạch, Task 7).
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8');
const APP = doc('src', 'App.tsx');
const HOOK = doc('src', 'lib', 'doc-to-mot-lan.ts');

test('hook đọc to: một lần mỗi lượt, không gọi mạng, chỉ nói', () => {
  assert.match(HOOK, /useRef\(false\)/, 'phải có cờ "đã đọc" để không đọc lặp mỗi lần dựng lại');
  assert.match(HOOK, /docTo\(/, 'phải đi qua docTo() — speechSynthesis trần hỏng im lặng trong WebView');
  const khongChuThich = HOOK.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/fetch\(|window\.open|tel:|sms:/.test(khongChuThich), 'hook đọc to chỉ được NÓI, không làm gì khác (§12)');
});
```

- [ ] **Step 2: Chạy, thấy đỏ**

Run: `node --test test/man-khan-cap-mot-viec.test.js`
Expected: FAIL — ENOENT `doc-to-mot-lan.ts`.

- [ ] **Step 3: Viết mã** — `src/lib/doc-to-mot-lan.ts`

```ts
import { useEffect, useRef } from 'react';
import { docTo } from '../native';

/**
 * ═════ ĐỌC TO MỘT LẦN KHI MÀN KHẨN CẤP HIỆN — thêm 23/9/2026 ═════
 *
 * Đo trước đó: câu lệnh chỉ được đọc khi bác BẤM nút "Đọc to". Người đang hoảng
 * không bấm. Hook này đọc đúng MỘT câu (câu lệnh ngắn) ngay khi màn hiện.
 *
 * ⚠️ MỘT LẦN MỖI LƯỢT. Đọc lặp lại làm người ta hoảng thêm. `bat` về false (màn
 * đóng, kết quả bị xoá) thì cờ được đặt lại cho lượt sau.
 *
 * ⚠️ HỎNG THÌ IM LẶNG. Trình duyệt chặn phát tiếng hay máy thiếu giọng đọc thì
 * câu lệnh VẪN nằm trên màn; nút "Đọc to" vẫn báo lỗi như cũ khi bác tự bấm.
 *
 * ⚠️ CHỈ NÓI. Không gọi, không nhắn, không mạng (§12). `cau` phải đến từ catalog.
 */
export function useDocToMotLan(
  cau: string,
  bat: boolean,
  ngonNgu: string,
  khiBatDau?: () => void,
  khiXong?: () => void,
): void {
  const daDoc = useRef(false);
  useEffect(() => {
    if (!bat) { daDoc.current = false; return; }
    if (daDoc.current || !cau.trim()) return;
    daDoc.current = true;
    khiBatDau?.();
    void docTo(cau, ngonNgu).then(() => khiXong?.(), () => khiXong?.());
  }, [bat, cau, ngonNgu]);
}
```

- [ ] **Step 4: Chạy, thấy xanh**

Run: `node --test test/man-khan-cap-mot-viec.test.js`
Expected: PASS 1/1.

---

### Task 3: WarningView — câu lệnh + nút chính lên nửa trên, "Con bảo sao?", tự đọc to

**Files:**
- Modify: `src/lib/ket-qua-can-thiep.ts:32-36` (thêm hai mã hành động)
- Modify: `src/App.tsx`:
  - import (dòng có `chonViecAnToan`)
  - sau `const firstContact` (~dòng 7028): thêm `heroGap`, `cauLenh`, state, `useDocToMotLan`
  - `handleCallRelative` (~7030)
  - sau `handleSendSos` (~7063): thêm `nutGoiChinh`, `nutNhanTin`, `nutHanhDongGap`
  - khối headline (~7173)
  - thẻ biểu tượng (~7233)
  - khối `leoThang` cũ (~7272)
  - vùng nút cuối (~7698–7749)
  - nếp gấp thứ hai (~7948–7981)
- Modify: `test/viec-an-toan-va-leo-thang.test.js` (2 test chốt bố cục cũ)
- Modify: `src/i18n.ts` (7 khoá)
- Test: `test/man-khan-cap-mot-viec.test.js` (thêm test)

**Interfaces:**
- Consumes: `cauLenhNgan` (Task 1), `useDocToMotLan` (Task 2).
- Produces: `HanhDong` có thêm `'con_bao_lua_dao' | 'con_bao_khong_sao'`. Phần 3 sẽ gửi các mã này cho con.

- [ ] **Step 1: Viết test đỏ** — nối vào `test/man-khan-cap-mot-viec.test.js`

```js
test('màn gấp có biến heroGap: gấp + có kết quả + chưa ở luồng phục hồi', () => {
  assert.match(APP, /const heroGap = manGapGap && !khongGoiDuoc && !dangPhucHoi;/);
});

test('thứ tự trên màn gấp: câu lệnh → nút chính → (dòng AI, lý do, "chưa kiểm được")', () => {
  const iLenh = APP.indexOf('data-vai-tro="cau-lenh"');
  const iNut = APP.indexOf('{nutHanhDongGap}');
  const iAi = APP.indexOf("t('AI đã trích ra các dấu hiệu. Mức rủi ro là do bộ luật cố định quyết định.')");
  const iChuaKiem = APP.indexOf("t('Những thứ cháu CHƯA kiểm được')");
  assert.ok(iLenh > 0 && iNut > 0 && iAi > 0 && iChuaKiem > 0, 'thiếu một mốc — đổi chữ thì sửa cả test');
  assert.ok(iLenh < iNut, 'câu lệnh phải đứng ngay trên nút');
  assert.ok(iNut < iAi && iNut < iChuaKiem, 'nút chính phải đứng TRƯỚC mọi khối chữ giải thích — hành động trước, chữ sau');
});

test('câu lệnh là câu ngắn đã kiểm đếm chữ, không phải câu dài', () => {
  assert.match(APP, /const cauLenh = cauLenhNgan\(viecAnToan, Boolean\(firstContact\.phone\)\);/);
  const i = APP.indexOf('data-vai-tro="cau-lenh"');
  assert.match(APP.slice(i, i + 300), /\{t\(cauLenh\)\}/);
});

test('màn gấp tự đọc to câu lệnh một lần', () => {
  assert.match(APP, /useDocToMotLan\(cauTuDoc, heroGap,/);
});

test('chưa có số người thân: nút chính là 113, 156 KHÔNG nằm ở khối chính', () => {
  const i = APP.indexOf('const nutHanhDongGap');
  const khoi = APP.slice(i, APP.indexOf(');', APP.indexOf('</a>', i)) + 2);
  assert.match(khoi, /soCongAn/, 'nút chính khi chưa có số phải là Cảnh sát 113');
  assert.ok(!/soBaoLuaDao/.test(khoi), '156 là tổng đài phản ánh, không cứu được tiền lúc đó — nó thuộc "Xem thêm"');
});

test('"Con bảo không sao" chỉ ghi lại và về trang chủ — KHÔNG hạ nhãn (§4.2)', () => {
  const i = APP.indexOf("t('Con bảo không sao')");
  assert.ok(i > 0);
  const khoi = APP.slice(APP.lastIndexOf('<button', i), i);
  assert.match(khoi, /ghiHanhDong\('con_bao_khong_sao'\); setView\('home'\);/);
  assert.ok(!/setAnalyzeResult|nhan:|riskLabel/.test(khoi));
});

test('bấm gọi người thân mở câu hỏi "Con bảo sao?"', () => {
  const i = APP.indexOf('const handleCallRelative = () => {');
  assert.match(APP.slice(i, i + 400), /setDaBamGoi\(true\)/);
});

test('hai mã hành động mới có trong kiểu HanhDong', () => {
  const lib = doc('src', 'lib', 'ket-qua-can-thiep.ts');
  assert.match(lib, /'con_bao_lua_dao'/);
  assert.match(lib, /'con_bao_khong_sao'/);
});
```

- [ ] **Step 2: Chạy, thấy đỏ**

Run: `node --test test/man-khan-cap-mot-viec.test.js`
Expected: FAIL ở các test mới.

- [ ] **Step 3: Thêm mã hành động** — `src/lib/ket-qua-can-thiep.ts`, thay khối `export type HanhDong`:

```ts
export type HanhDong =
  | 'bam_goi_nguoi_than'   // bấm nút gọi — KHÔNG biết có nối máy không
  | 'da_lo_chuyen'         // bác tự báo đã chuyển tiền / đọc mã
  | 'toi_on'               // §4.6 — mẫu báo động giả
  | 've_trang_chu'         // rời màn không chọn hành động bảo vệ nào
  | 'con_bao_lua_dao'      // gọi xong, bác bấm "Con bảo là lừa đảo"
  | 'con_bao_khong_sao';   // gọi xong, bác bấm "Con bảo không sao" — mẫu hiệu chỉnh, KHÔNG hạ nhãn
```

- [ ] **Step 4: Import** — `src/App.tsx`, dòng import `chonViecAnToan, CAU_VIEC_AN_TOAN` đổi thành:

```ts
import { chonViecAnToan, CAU_VIEC_AN_TOAN, cauLenhNgan } from './lib/viec-an-toan-tiep-theo';
import { useDocToMotLan } from './lib/doc-to-mot-lan';
```

- [ ] **Step 5: Biến và state** — ngay sau khối `const firstContact: {...} = nguoiDauTien ?? {...};` thêm:

```tsx
  /**
   * ══════ MÀN GẤP: MỘT CÂU, MỘT NÚT — 23/9/2026 (Phần 1 "Cầu dao gia đình") ══════
   *
   * Người dùng báo: "trong trường hợp hoảng loạn mà cho 1 đống chữ thì ai thèm
   * đọc". Đo 375×812 ở PROTECTED_CRITICAL: nút gọi con ở y=716–805, giữa màn là
   * khối "CHƯA kiểm được" 25px, và đọc to chỉ khi bấm.
   *
   * Nay ở màn gấp: nhãn → CÂU LỆNH ≤ 8 chữ → NÚT CHÍNH, ngay nửa trên màn, và máy
   * tự đọc câu lệnh. Mọi khối chữ khác (dòng AI, lý do, "chưa kiểm được" — VẪN
   * cùng cỡ với nhãn, §HĐ luật 3) nằm DƯỚI nút.
   *
   * ⚠️ Luồng phục hồi (`dangPhucHoi`) và màn mất mạng giữ bố cục cũ: ở đó việc
   * chính là gọi ngân hàng / nói thật là chưa kiểm được, không phải gọi con.
   */
  const heroGap = manGapGap && !khongGoiDuoc && !dangPhucHoi;
  const cauLenh = cauLenhNgan(viecAnToan, Boolean(firstContact.phone));
  /** Đã bấm gọi người thân trong lượt này ⇒ hỏi "Con bảo sao?". */
  const [daBamGoi, setDaBamGoi] = useState(false);
  /** Trả lời sau cuộc gọi. `null` = chưa trả lời. */
  const [conBao, setConBao] = useState<'lua_dao' | null>(null);
  const cauTuDoc = heroGap
    ? `${tuBamDung ? t('Bác dừng lại 60 giây đã') : (nhanChu ?? '')}. ${t(cauLenh)}`
    : '';
  useDocToMotLan(cauTuDoc, heroGap, lang === 'en' ? 'en-US' : 'vi-VN',
    () => setIsSpeaking(true), () => setIsSpeaking(false));
```

- [ ] **Step 6: `handleCallRelative`** — thêm `setDaBamGoi(true);` ngay sau `ghiNhanBamGoi();`:

```tsx
  const handleCallRelative = () => {
    if (!firstContact.phone) { setView('family'); return; }
    // Ghi TRƯỚC khi mở ứng dụng gọi: sau `window.open` trang có thể bị đẩy
    // xuống nền và mã sau đó không chắc chạy.
    ghiNhanBamGoi();
    setDaBamGoi(true);
    window.open(`tel:${firstContact.phone}`, '_self');
  };
```

- [ ] **Step 7: Ba khối JSX dùng chung** — ngay sau khối `const handleSendSos = () => {...};` thêm:

```tsx
  /** Nút gọi người thân — MỘT định nghĩa, hai chỗ đặt (màn gấp: trên cùng; màn thường: cuối). */
  const nutGoiChinh = (
    <button
      onClick={handleCallRelative}
      data-vai-tro="nut-chinh"
      className={`w-full ${heroGap ? 'min-h-[80px] text-[20px]' : 'text-[17px]'} py-4 px-4 rounded-[22px] font-black bg-amber-300 text-amber-950 shadow-[0_10px_28px_rgba(245,158,11,0.35)] border-2 border-amber-200 flex flex-col items-center justify-center gap-0.5 active:scale-98 transition-all hover:brightness-105`}
    >
      <span className="flex items-center gap-2">
        {firstContact.phone ? <PhoneCall size={heroGap ? 26 : 22} /> : <UserPlus size={22} />}
        <span>{firstContact.phone
          ? (viecAnToan === 'goi_so_cu_nguoi_than' ? t('GỌI SỐ ĐÃ LƯU CỦA CON CHÁU') : t('GỌI NGAY CHO CON CHÁU'))
          : t('Chưa có số người thân — bấm để thêm')}</span>
      </span>
      {firstContact.phone && (
        <span className="text-[16px] font-bold text-[#6b3a05]">
          {firstContact.name} ({firstContact.phone}){vaiNguoiDau ? ` · ${vaiNguoiDau}` : ''}
        </span>
      )}
    </button>
  );

  /** ⚠️ "Soạn tin", KHÔNG phải "đã gửi" — §11. Chưa có số thì không bày ra. */
  const nutNhanTin = firstContact.phone ? (
    <button
      onClick={handleSendSos}
      className="w-full min-h-[56px] py-3 px-3 rounded-[22px] font-black text-[16px] bg-white text-slate-900 shadow-md border-2 border-white/60 flex items-center justify-center gap-2 active:scale-98 transition-all hover:bg-slate-50"
    >
      <MessageSquare size={18} className="text-slate-700" />
      <span>{viecAnToan === 'khong_cai_gui_nguoi_than' ? t('Gửi cho con cháu xem trước') : t('Soạn tin nhắn cho con cháu')}</span>
    </button>
  ) : null;

  /**
   * NÚT CHÍNH CỦA MÀN GẤP. Có số người thân → gọi người thân. Chưa có → Cảnh sát
   * 113 (số đã duyệt ở `so-khan-cap.ts`), KHÔNG mở biểu mẫu giữa lúc bị giục.
   * 156 là tổng đài PHẢN ÁNH, không cứu được tiền lúc đó — nó nằm trong "Xem thêm".
   */
  const nutHanhDongGap = firstContact.phone || !soCongAn ? nutGoiChinh : (
    <a
      href={`tel:${soCongAn.cleanPhone}`}
      data-vai-tro="nut-chinh"
      className="w-full min-h-[80px] py-4 px-4 rounded-[22px] font-black text-[20px] bg-amber-300 text-amber-950 shadow-[0_10px_28px_rgba(245,158,11,0.35)] border-2 border-amber-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
    >
      <ShieldCheck size={26} className="shrink-0" />
      <span>{t('Gọi')} {soCongAn.name}</span>
    </a>
  );
```

- [ ] **Step 8: Khối headline → câu lệnh + nút chính ở màn gấp.** Thay toàn bộ khối `{!tuBamDung && (<p className="text-[16px] font-semibold text-white/95 mb-4 text-center leading-snug max-w-sm">…</p>)}`, giữ nguyên chú thích phía trên nó, bằng:

```tsx
        {heroGap ? (
          <>
            <p data-vai-tro="cau-lenh" className="text-[30px] leading-tight font-black text-white text-center mb-4 max-w-sm">
              {t(cauLenh)}
            </p>
            <div className="w-full flex flex-col gap-2 mb-3">
              {nutHanhDongGap}
              {daBamGoi && conBao === null && (
                <div role="group" aria-labelledby="con-bao-sao" className="w-full bg-black/35 border-2 border-white/40 rounded-[22px] p-3 flex flex-col gap-2">
                  <p id="con-bao-sao" className="text-[18px] font-black text-white text-center leading-snug">{t('Gọi xong rồi? Con bảo sao?')}</p>
                  <button
                    type="button"
                    onClick={() => { ghiHanhDong('con_bao_lua_dao'); setConBao('lua_dao'); }}
                    className="w-full min-h-[56px] rounded-[18px] bg-white text-[#7f1d1d] font-black text-[17px] px-3 leading-snug"
                  >
                    {t('Con bảo là lừa đảo')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { ghiHanhDong('con_bao_khong_sao'); setView('home'); }}
                    className="w-full min-h-[56px] rounded-[18px] bg-white/15 text-white border-2 border-white/40 font-bold text-[16px] px-3 leading-snug"
                  >
                    {t('Con bảo không sao')}
                  </button>
                </div>
              )}
              {conBao === 'lua_dao' && (
                <div role="status" className="w-full bg-black/35 border-2 border-white/40 rounded-[22px] p-3 flex flex-col gap-2">
                  <p className="text-[22px] font-black text-white text-center leading-snug">{t('Không nghe máy số đó nữa.')}</p>
                  {!canRecovery && (
                    <button
                      type="button"
                      onClick={() => { ghiHanhDong('da_lo_chuyen'); setDaBamPhucHoi(true); onBaoDaChuyen?.(); }}
                      className="w-full min-h-[56px] rounded-[18px] bg-white text-slate-900 font-black text-[16px] px-3 leading-snug"
                    >
                      {t('Tôi đã lỡ chuyển tiền hoặc đọc mã rồi')}
                    </button>
                  )}
                </div>
              )}
              {leoThang && (
                <div role="status" aria-live="polite" className="w-full bg-black/35 rounded-[18px] px-3 py-2 text-center">
                  <p className="text-[17px] font-black text-white leading-snug">{t('Đã qua 60 giây.')}</p>
                  <p className="text-[16px] font-bold text-white/95 leading-snug">
                    {firstContact.phone ? t('Trước khi làm gì tiếp, bác gọi con cháu một câu đã.') : t('Trước khi làm gì tiếp, bác gọi hỏi thật đã.')}
                  </p>
                </div>
              )}
              {!leoThang && timeLeft > 0 && (
                <p className="text-[15px] font-bold text-white/85 text-center tabular-nums">
                  {t('Còn {n} giây').replace('{n}', String(timeLeft))}
                </p>
              )}
            </div>
          </>
        ) : !tuBamDung && (
          <p className="text-[16px] font-semibold text-white/95 mb-4 text-center leading-snug max-w-sm">
            {khongGoiDuoc
              ? t('Mạng không đi được nên chưa có gì được kiểm cả.')
              : cauViecRieng
                ? t(cauViecRieng)
              : laCao
                ? t('Bác đừng chuyển tiền, đừng đọc mã nào.')
                : laNghiNgo
                  ? t('Bác hỏi lại người thân trước khi làm gì tiếp.')
                  : laChuaThay
                    ? t('Chưa thấy dấu hiệu rõ ràng. Bác vẫn đừng đọc mã cho ai.')
                    : t('Bác thở một hơi. Không có gì gấp tới mức không chờ được một phút.')}
          </p>
        )}
```

- [ ] **Step 9: Thẻ biểu tượng ẩn ở màn gấp, bỏ khối `leoThang` cũ.**
  - Trong `className` của thẻ, đổi `${dangPhucHoi ? 'hidden' : ''}` thành `${dangPhucHoi || heroGap ? 'hidden' : ''}`.
  - Xoá nguyên khối `{leoThang && ( <div role="status" … className="w-full basis-full flex flex-col gap-2"> … </div> )}` bên trong thẻ. Khối mới đã nằm ở Step 8, và mọi trường hợp `leoThang` đúng thì `heroGap` cũng đúng.

- [ ] **Step 10: Vùng nút cuối.** Thay khối từ `{!firstContact.phone && (soCongAn || soBaoLuaDao) && (` (lưới 113/156 khi chưa có số) tới hết nút "Soạn tin nhắn" bằng:

```tsx
        {!heroGap && !firstContact.phone && (soCongAn || soBaoLuaDao) && (
          <div className="w-full grid grid-cols-2 gap-2">
            {soCongAn && (
              <a
                href={`tel:${soCongAn.cleanPhone}`}
                className="min-h-[72px] rounded-[22px] bg-white text-slate-900 border-2 border-white/60 shadow-md px-3 py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <ShieldCheck size={22} className="text-slate-800 shrink-0" />
                <span className="text-[16px] font-black leading-tight text-center">{soCongAn.name}</span>
              </a>
            )}
            {soBaoLuaDao && (
              <a
                href={`tel:${soBaoLuaDao.cleanPhone}`}
                className="min-h-[72px] rounded-[22px] bg-white text-slate-900 border-2 border-white/60 shadow-md px-3 py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <PhoneOff size={22} className="text-slate-800 shrink-0" />
                <span className="text-[16px] font-black leading-tight text-center">{soBaoLuaDao.name}</span>
              </a>
            )}
          </div>
        )}

        {!heroGap && nutGoiChinh}
        {!heroGap && nutNhanTin}
```

  Giữ nguyên các khối chú thích dài phía trên lưới: chúng giải thích quyết định 19/9.

- [ ] **Step 11: Nếp gấp thứ hai ("Việc phụ").** Ngay sau `{(moThem || !manGapGap) && (<>` thứ **hai** (khối có `nguoiGoiTiep`), chèn:

```tsx
        {heroGap && nutNhanTin}
        {heroGap && !firstContact.phone && (
          <button
            type="button"
            onClick={() => setView('family')}
            className="w-full min-h-[52px] py-3 px-3 rounded-2xl font-bold text-[15px] bg-black/30 hover:bg-black/40 text-white border border-white/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <UserPlus size={18} className="shrink-0" />
            <span>{t('Thêm số con cháu')}</span>
          </button>
        )}
```

  và đổi lưới 113/156 trong nếp gấp đó:

```tsx
        {/* Hai số thật — lối phụ. Màn gấp chưa có số: 113 đã là nút chính, ở đây chỉ còn 156. */}
        {(firstContact.phone || heroGap) && (soCongAn || soBaoLuaDao) && (
          <div className="w-full grid grid-cols-2 gap-2">
            {soCongAn && firstContact.phone && (
```

  Phần còn lại của lưới giữ nguyên, chỉ thêm điều kiện `&& firstContact.phone` cho ô 113.

- [ ] **Step 12: Cập nhật hai test chốt bố cục cũ** — `test/viec-an-toan-va-leo-thang.test.js`. Thay test `'leo thang KHÔNG tự gọi, không tự nhắn — chỉ đưa nút cho bác bấm (§12)'` bằng:

```js
test('leo thang KHÔNG tự gọi, không tự nhắn — chỉ NÓI; nút gọi đã nằm ngay trên nó (§12)', () => {
  const i = APP.indexOf('{leoThang && (');
  assert.ok(i > 0, 'không tìm thấy khối leo thang');
  const khoi = APP.slice(i, APP.indexOf('{!leoThang && timeLeft > 0 && (', i));
  assert.ok(khoi.length > 0 && khoi.length < 1500, 'khối leo thang phải đứng ngay trước dòng đếm giây');
  assert.ok(!/window\.open|tel:|sms:|fetch\(|useEffect/.test(khoi),
    '§12 cấm "tự bật auto-alert thay chủ tài khoản" — bậc leo thang chỉ được nói, không được tự làm');
  const iNut = APP.indexOf('{nutHanhDongGap}');
  assert.ok(iNut > 0 && iNut < i, 'nút gọi của màn gấp phải đứng NGAY TRÊN bậc leo thang');
});
```

  và trong test `'luồng phục hồi KHÔNG có vòng "Dừng 60 giây"…'` đổi regex thành:

```js
  assert.match(APP, /relative overflow-hidden border border-white\/25 \$\{dangPhucHoi \|\| heroGap \? 'hidden' : ''\}/,
    'người vừa mất tiền mà thấy "dừng 60 giây" là bị bảo CHỜ, trong khi việc cần làm là gọi ngân hàng ngay');
```

- [ ] **Step 13: 7 khoá i18n** (chạy `them-i18n.py`):

```json
{
  "Gọi xong rồi? Con bảo sao?": "Done calling? What did they say?",
  "Con bảo là lừa đảo": "They said it's a scam",
  "Con bảo không sao": "They said it's fine",
  "Không nghe máy số đó nữa.": "Do not answer that number again.",
  "Còn {n} giây": "{n} seconds left",
  "Trước khi làm gì tiếp, bác gọi hỏi thật đã.": "Before doing anything else, call and check first.",
  "Thêm số con cháu": "Add a family number"
}
```

- [ ] **Step 14: Chạy, thấy xanh**

Run: `node --test test/man-khan-cap-mot-viec.test.js test/viec-an-toan-va-leo-thang.test.js test/man-khan-cap-khong-nhieu-chu.test.js && npx tsc --noEmit`
Expected: tất cả PASS, tsc không lỗi.

---

### Task 4: Màn "Đang bị ai gọi?" — dặn ngay, nút gọi, §HĐ luật 3, tự đọc to

**Files:**
- Modify: `src/components/HoiNhanh.tsx`
- Modify: `src/App.tsx` (hai chỗ `<HoiNhanhView … />` truyền thêm `familyMembers={familyMembers}`)
- Modify: `src/i18n.ts` (4 khoá)
- Test: `test/man-khan-cap-mot-viec.test.js` (thêm test)

**Interfaces:**
- Consumes: `cauLenhNgan`, `chonViecAnToan` (Task 1), `useDocToMotLan` (Task 2), `ghiKetQua` (`src/lib/ket-qua-can-thiep.ts`).
- Produces: `HoiNhanhProps.familyMembers?: { name: string; phone: string }[]`.

- [ ] **Step 1: Viết test đỏ** — nối vào `test/man-khan-cap-mot-viec.test.js`

```js
const HOI = doc('src', 'components', 'HoiNhanh.tsx');

test('hỏi nhanh: chọn "Đưa mã OTP" là thấy ngay "đừng đọc mã" — không đợi hỏi xong', () => {
  assert.match(HOI, /doi_otp: 'Dù thế nào: đừng đọc mã cho ai\.'/);
  assert.match(HOI, /cai_ung_dung: 'Đừng cài gì trong lúc đang gọi\.'/);
  assert.match(HOI, /chuyen_tien: 'Chưa chuyển gì cả\.'/);
  const iDan = HOI.indexOf('DAN_NGAY_CUA_NHANH[selectedBranch]');
  const iCau = HOI.indexOf("chu('tro_ly_hoi')");
  assert.ok(iDan > 0 && iDan < iCau, 'câu dặn phải đứng TRÊN câu hỏi');
});

test('hỏi nhanh: màn kết quả có nút gọi con cháu, và không còn hứa "Cúp máy & dừng 60 giây"', () => {
  assert.match(HOI, /t\('GỌI NGAY CHO CON CHÁU'\)/);
  assert.ok(!HOI.includes('Cúp máy & dừng 60 giây'), 'app không cúp máy được — nút không được hứa việc đó');
  assert.match(HOI, /t\('Tôi đã cúp máy'\)/);
});

test('hỏi nhanh: §HĐ luật 3 — "chưa kiểm được" cùng cỡ chữ với nhãn', () => {
  const coNhan = Number(/<h2\s+className="text-\[(\d+)px\] font-black text-white/.exec(HOI)[1]);
  const i = HOI.indexOf("'Những thứ cháu CHƯA kiểm được'");
  const khoi = HOI.slice(HOI.lastIndexOf('{chuaKiem.length > 0 && (', i), HOI.indexOf('</ul>', i));
  const coChu = [...khoi.matchAll(/text-\[(\d+)px\]/g)].map((m) => Number(m[1]));
  assert.ok(coChu.length >= 2);
  assert.deepStrictEqual(coChu.filter((c) => c < coNhan), [], `nhãn ${coNhan}px mà "chưa kiểm được" có ${coChu.join(', ')}px`);
});

test('hỏi nhanh: kết quả CAO tự đọc to một lần; hook gọi ở ĐẦU component, không trong nhánh if', () => {
  const iHook = HOI.indexOf('useDocToMotLan(');
  const iIf = HOI.indexOf('if (result) {');
  assert.ok(iHook > 0 && iHook < iIf, 'hook đặt trong nhánh if là phá luật hook của React');
});
```

- [ ] **Step 2: Chạy, thấy đỏ**

Run: `node --test test/man-khan-cap-mot-viec.test.js`
Expected: FAIL ở 4 test mới.

- [ ] **Step 3: Props, import, hằng số, hook** — `src/components/HoiNhanh.tsx`
  - Thêm import:

```ts
import { ghiKetQua } from '../lib/ket-qua-can-thiep';
import { useDocToMotLan } from '../lib/doc-to-mot-lan';
import { chonViecAnToan, cauLenhNgan } from '../lib/viec-an-toan-tiep-theo';
```

  - Thêm hằng số ngay sau `MAU_VIEN_NHANH`:

```ts
/**
 * CÂU DẶN HIỆN NGAY TỪ LẦN CHẠM ĐẦU — 23/9/2026.
 * Đo trước đó: chọn "Đưa mã OTP" (đã chắc chắn là lừa) vẫn phải trả lời thêm
 * hai câu mới thấy lời dặn. Hai câu đó vẫn hỏi (bộ luật cần đủ tín hiệu, không
 * đổi bộ luật), nhưng lời dặn đứng TRÊN câu hỏi ngay từ đầu.
 */
const DAN_NGAY_CUA_NHANH: Record<string, string> = {
  doi_otp: 'Dù thế nào: đừng đọc mã cho ai.',
  cai_ung_dung: 'Đừng cài gì trong lúc đang gọi.',
  chuyen_tien: 'Chưa chuyển gì cả.',
};
```

  - `HoiNhanhProps` thêm `familyMembers?: { name: string; phone: string }[];`. Hàm đổi chữ ký thành `export function HoiNhanhView({ setView, t, lang = 'vi', onTriggerEmergency, familyMembers }: HoiNhanhProps)`.
  - Ngay sau `const chu = …`, thêm (ở đầu component, **trước** mọi `if`):

```ts
  const soNguoiThan = familyMembers?.find((n) => n.phone)?.phone ?? '';
  const tenNguoiThan = familyMembers?.find((n) => n.phone)?.name ?? '';
  // Đọc to MỘT lần khi kết quả là CAO — hook phải ở đầu component (luật hook của React).
  const laCaoKQ = !!result && !result.khongGoiDuocMayChu && (result.nhan === 'CAO' || result.canThiep === 'PROTECTED_CRITICAL');
  const cauDocKQ = laCaoKQ
    ? `${tra(NHAN, 'CAO', lang) ?? ''}. ${t(cauLenhNgan(chonViecAnToan({ maLyDo: result?.maLyDo, nhan: result?.nhan, canThiep: result?.canThiep }), Boolean(soNguoiThan)))}`
    : '';
  useDocToMotLan(cauDocKQ, laCaoKQ, lang === 'en' ? 'en-US' : 'vi-VN');
```

- [ ] **Step 4: Câu dặn trên màn đang hỏi.** Chèn ngay trước `<div className="bg-white text-slate-900 rounded-3xl p-6 …">` (thẻ câu hỏi):

```tsx
          {selectedBranch && DAN_NGAY_CUA_NHANH[selectedBranch] && (
            <p role="status" className="w-full mb-4 rounded-2xl bg-red-600 border-2 border-red-300 px-4 py-3 text-[20px] font-black text-white text-center leading-snug">
              {t(DAN_NGAY_CUA_NHANH[selectedBranch])}
            </p>
          )}
```

- [ ] **Step 5: Màn kết quả.**
  - Khi `laCao`, bỏ đoạn dài và chỉ giữ một dòng lệnh. Thay khối `<>{laCao && (<p …>…Bác cúp máy ngay nhé.…</p>)}<p …>…Bác đừng chuyển tiền…</p></>` bằng:

```tsx
            laCao ? (
              <p className="text-[22px] font-black text-white leading-snug">
                {lang === 'en' ? 'Please hang up now.' : 'Bác cúp máy ngay nhé.'}
              </p>
            ) : (
              <p className="text-[16px] text-white/95 leading-relaxed font-medium">
                {lang === 'en'
                  ? 'Do not transfer money and do not read out any code. Hang up and call your family yourself.'
                  : 'Bác đừng chuyển tiền và đừng đọc mã nào. Cúp máy rồi tự gọi cho con cháu.'}
              </p>
            )
```

  - Ngay sau thẻ kết quả (sau `</div>` của `${khungMau}`), **trước** danh sách lý do, chèn nhóm hành động:

```tsx
        {(laCao || laKhanCap) && !khongGoiDuoc && (
          <div className="flex flex-col gap-3 mb-4">
            {soNguoiThan && (
              <button
                onClick={() => {
                  ghiKetQua({ canThiep: result.canThiep ?? null, nhan: nhan ?? null, maLyDo: result.maLyDo ?? [], hanhDong: 'bam_goi_nguoi_than' });
                  window.open(`tel:${soNguoiThan}`, '_self');
                }}
                data-vai-tro="nut-chinh"
                className="w-full min-h-[80px] py-4 px-4 bg-amber-300 text-amber-950 font-black text-[20px] rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 border-amber-200 shadow-lg active:scale-95"
              >
                <span className="flex items-center gap-2"><PhoneCall size={24} /> {t('GỌI NGAY CHO CON CHÁU')}</span>
                <span className="text-[16px] font-bold text-[#6b3a05]">{tenNguoiThan} ({soNguoiThan})</span>
              </button>
            )}
            <button
              onClick={() => (onTriggerEmergency ? onTriggerEmergency() : setView('warning'))}
              data-vai-tro="nut-chinh"
              className={`w-full min-h-[56px] py-4 px-6 ${soNguoiThan ? 'bg-white/15 border border-white/30' : 'bg-red-600 shadow-lg shadow-red-600/40'} active:scale-95 text-white font-black text-[18px] rounded-2xl flex items-center justify-center gap-2`}
            >
              <PhoneOff size={20} />
              <span>{t('Tôi đã cúp máy')}</span>
            </button>
          </div>
        )}
```

  - Xoá khối `{laKhanCap && (<button … 'Cúp máy & dừng 60 giây' …>)}` cũ trong nhóm `mt-auto`. Nhóm hành động mới đã thay nó.
  - Khối `chuaKiem`: đổi `text-[16px]` của tiêu đề và của từng dòng thành `text-[25px]`, `EyeOff size={20}` thành `size={24}`, `leading-snug` của từng dòng thành `leading-tight`.

- [ ] **Step 6: App truyền `familyMembers`** — hai chỗ `<HoiNhanhView setView={setView} t={t} lang={lang} onTriggerEmergency={triggerEmergencyAlert} />` thêm ` familyMembers={familyMembers}`.

- [ ] **Step 7: 4 khoá i18n**

```json
{
  "Dù thế nào: đừng đọc mã cho ai.": "Whatever happens: do not read out any code.",
  "Đừng cài gì trong lúc đang gọi.": "Do not install anything during the call.",
  "Chưa chuyển gì cả.": "Do not send anything yet.",
  "Tôi đã cúp máy": "I have hung up"
}
```

- [ ] **Step 8: Chạy, thấy xanh**

Run: `node --test test/man-khan-cap-mot-viec.test.js && npx tsc --noEmit`
Expected: PASS, tsc sạch.

---

### Task 5: Màn giới thiệu không nói quá (§11)

> **Đổi lúc làm (23/9):** chữ HIỆN RA đã đúng từ trước. Catalog dịch khoá cũ thành "AI đọc tin nhắn, đường link và ảnh bác gửi để tìm dấu hiệu. Bộ luật cố định mới quyết mức rủi ro.". Chỉ **khoá** trong mã là nói quá. Nên cách sửa là đổi khoá thành đúng chữ hiện ra, ở App.tsx và cả hai catalog, và **giữ nguyên câu hiển thị**. Test kiểm khoá cũ không còn và khoá mới có mặt. Các bước dưới đây là bản trước khi phát hiện điều đó.

**Files:**
- Modify: `src/App.tsx` (slide 2 của `IntroView`, ~dòng 5678)
- Modify: `src/i18n.ts` (thêm khoá mới, gỡ khoá cũ ở cả hai catalog)
- Test: `test/man-khan-cap-mot-viec.test.js`

- [ ] **Step 1: Viết test đỏ**

```js
test('§11 — màn giới thiệu không hứa "kiểm tra cuộc gọi" hay "giao dịch": app không nghe được cuộc gọi, không thấy giao dịch', () => {
  assert.ok(!/t\("AI thông minh kiểm tra cuộc gọi/.test(APP));
  assert.match(APP, /t\("Kiểm tin nhắn, đường link và ảnh chụp màn hình\."\)/);
});
```

- [ ] **Step 2: Chạy, thấy đỏ.** Run: `node --test test/man-khan-cap-mot-viec.test.js`. Expected: FAIL.
- [ ] **Step 3: Sửa.**
  - Trong `IntroView`, đổi `desc: t("AI thông minh kiểm tra cuộc gọi, tin nhắn, đường link và giao dịch lạ."),` thành `desc: t("Kiểm tin nhắn, đường link và ảnh chụp màn hình."),`.
  - Thêm khoá `{"Kiểm tin nhắn, đường link và ảnh chụp màn hình.": "Checks messages, links and screenshots."}` bằng `them-i18n.py`.
  - Gỡ dòng khoá cũ ở cả hai catalog bằng Edit tool.
- [ ] **Step 4: Chạy, thấy xanh.** Expected: PASS.

---

### Task 6: Kiểm toàn bộ + đo trên trình duyệt (tiêu chí S1, S2, S3)

- [ ] **Step 1:** `npm test` → mọi test PASS, và số test tăng đúng bằng số test đã thêm. `npm run lint` → sạch. `npm run build` → xong.
- [ ] **Step 2:** Khởi động lại máy chủ dev nếu backend có đổi (Phần 1 không đổi backend, Vite nạp nóng là đủ). Giả lập viewport 375×812.
- [ ] **Step 3: Có số con.** Đặt `localStorage.familyMembers = [{id:1,name:'Minh',relation:'Con trai',phone:'0988000222'}]` rồi kiểm tin giả danh công an.
  - Đo: top của `[data-vai-tro="nut-chinh"]` < 406 (S1).
  - Đo: số chữ nằm trên nút ≤ 25 (S2).
  - Trước khi gửi, thay tạm `window.speechSynthesis.speak` bằng hàm ghi lại câu, để xác nhận máy tự đọc câu lệnh (S3).
- [ ] **Step 4: Chưa có số con.** Như Step 3 nhưng `familyMembers = []`: nút chính là "Gọi Cảnh Sát 113", câu lệnh không có chữ "con cháu", 156 chỉ có trong "Xem thêm".
- [ ] **Step 5: Bấm gọi con** → hiện "Gọi xong rồi? Con bảo sao?" → bấm "Con bảo là lừa đảo" → hiện "Không nghe máy số đó nữa." và nút "Tôi đã lỡ chuyển…".
- [ ] **Step 6: "Đang bị ai gọi?" → "Đưa mã OTP".**
  - Câu hỏi đầu có băng "Dù thế nào: đừng đọc mã cho ai."
  - Trả lời CÓ hai lần → màn kết quả có nút "GỌI NGAY CHO CON CHÁU" ở trên danh sách lý do.
  - Khối "chưa kiểm được" 25px.
- [ ] **Step 7:** Chụp ảnh màn gấp, có số và không số. Trả viewport về desktop. Dọn `familyMembers` về `[]`.
- [ ] **Step 8:** Báo lại cho người dùng kèm số đo trước/sau. **Không commit** trừ khi người dùng bảo.
