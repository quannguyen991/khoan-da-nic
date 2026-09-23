# Phần 2 — Con cháu cài giúp bố mẹ · Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Luồng "Con cháu cài giúp" trên máy bố mẹ, làm trong khoảng 3 phút:
- tạo hoặc đăng nhập tài khoản;
- nối máy bằng mã 6 số, và **số của con tự vào nút gọi khẩn cấp**;
- ghi lời nhắn giọng của con, **lưu trên máy bố mẹ**, và lời nhắn **tự phát** khi màn khẩn cấp hiện;
- bật quy tắc "báo cho con" (lưu ở máy chủ, mặc định tắt);
- diễn tập màn khẩn cấp.

Phiên đăng nhập tự gia hạn để cảnh báo không tắt lặng sau 30 ngày.

**Architecture:**
- Backend thêm hai route `GET/PUT /api/gia-dinh/quy-tac-bao` và `POST /api/tai-khoan/gia-han`, cùng một module nhỏ `quy-tac-bao.js`.
- Frontend thêm ba tệp lib (lời nhắn IndexedDB, hợp nhất người thân, phiên), hai component (`GhiLoiNhan`, `ConCaiGiup`), và sửa `ManGhepConChau` để nhúng được vào luồng mới.
- `WarningView`: có lời nhắn thì phát lời nhắn thay giọng máy; lượt diễn tập có băng "ĐÂY LÀ DIỄN TẬP" và không ghi số liệu.

**Tech Stack:** React + TS, IndexedDB, MediaRecorder, Express, kho `kho(bang,khoa,du_lieu)` (SQLite/Postgres), `node --test`.

**Spec:** `docs/superpowers/specs/2026-09-23-cau-dao-gia-dinh-design.md` — mục 3 (Phần 2). Bước 5 "cấp quyền APK" chuyển sang Phần 4 (cùng chỗ với CALL_PHONE). Dòng trạng thái "đang báo được cho con" có đủ nghĩa khi Phần 3 có đăng ký push, nên cũng làm ở Phần 3.

## Global Constraints

- Lời nhắn giọng **không bao giờ rời máy**: không `fetch`, `XMLHttpRequest`, `sendBeacon`, hay `FormData` nào mang blob âm thanh. Có test quét nguồn.
- Quy tắc báo **mặc định tắt**. Chỉ phiên của chính chủ tài khoản đọc hoặc đặt được quy tắc của mình (§12: không tự bật auto-alert thay chủ tài khoản).
- Diễn tập **không mang nhãn rủi ro**: dùng đường "tự bấm dừng" (`tuBamDung`) có sẵn, cộng cờ `dienTap`. Diễn tập **không ghi** kết quả can thiệp, để không làm bẩn số liệu báo động giả (§4.6).
- Không đổi §HĐ, không đổi bộ luật. Chuỗi mới đi qua `t()`, có đủ vi và en. Sàn §4.4.
- Không commit khi người dùng chưa bảo.

---

### Task 1: Backend — quy tắc báo + gia hạn phiên

**Files:**
- Create: `backend/src/quy-tac-bao.js`
- Modify: `backend/server.js` (sau route `/api/proof/ghep`)
- Modify: `backend/src/khoan-proof.js` (export `docPhienDayDu`)
- Test: `test/quy-tac-bao-va-gia-han.test.js`

**Interfaces:**
- Produces:
  - `GET /api/gia-dinh/quy-tac-bao` → `{ baoKhiCao: boolean, baoKhiOtpTrongCuocGoi: boolean }`
  - `PUT` cùng đường, thân là cùng hình dạng, trả về quy tắc đã lưu
  - `POST /api/tai-khoan/gia-han` → `{ token, hetHanLuc }`, và token cũ bị huỷ
  - `QT.docQuyTac(kho, taiKhoanId)` cho Phần 3 dùng

- [ ] **Step 1: Test đỏ** — `test/quy-tac-bao-va-gia-han.test.js`

```js
'use strict';
/**
 * PHẦN 2 — quy tắc "báo cho con" (lưu ở máy chủ, CHỈ chủ tài khoản đặt) và gia
 * hạn phiên (để cảnh báo không lặng lẽ tắt sau 30 ngày). 23/9/2026.
 */
const test = require('node:test');
const assert = require('node:assert');
process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');

async function moMayChu() {
  const sv = app.listen(0);
  await new Promise((r) => sv.once('listening', r));
  const goc = `http://127.0.0.1:${sv.address().port}`;
  const goi = async (method, duong, body, token) => {
    const r = await fetch(goc + duong, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { s: r.status, j: await r.json().catch(() => null) };
  };
  return { sv, goi };
}
const soMoi = (dau) => `${dau}${String(Date.now()).slice(-7)}`;

test('quy tắc báo: mặc định TẮT, chủ tài khoản bật được, người khác không đụng được', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const a = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('091'), matKhau: 'mat-khau-a1', ten: 'A thử' });
    const b = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('098'), matKhau: 'mat-khau-b1', ten: 'B thử' });
    assert.strictEqual(a.s, 200); assert.strictEqual(b.s, 200);

    const macDinh = await goi('GET', '/api/gia-dinh/quy-tac-bao', null, a.j.token);
    assert.deepStrictEqual(macDinh.j, { baoKhiCao: false, baoKhiOtpTrongCuocGoi: false }, '§12 — không tự bật báo thay chủ tài khoản');

    const dat = await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true, baoKhiOtpTrongCuocGoi: false }, a.j.token);
    assert.strictEqual(dat.s, 200);
    assert.strictEqual((await goi('GET', '/api/gia-dinh/quy-tac-bao', null, a.j.token)).j.baoKhiCao, true);
    assert.strictEqual((await goi('GET', '/api/gia-dinh/quy-tac-bao', null, b.j.token)).j.baoKhiCao, false,
      'quy tắc của A không được lan sang B');

    assert.strictEqual((await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: 'co' }, a.j.token)).s, 400, 'chỉ nhận true/false');
    assert.strictEqual((await goi('GET', '/api/gia-dinh/quy-tac-bao')).s, 401);
  } finally { sv.close(); }
});

test('gia hạn phiên: cấp token mới, token cũ bị huỷ', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const a = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('093'), matKhau: 'mat-khau-c1', ten: 'C thử' });
    const moi = await goi('POST', '/api/tai-khoan/gia-han', {}, a.j.token);
    assert.strictEqual(moi.s, 200);
    assert.ok(moi.j.token && moi.j.token !== a.j.token);
    assert.ok(moi.j.hetHanLuc > Date.now() + 29 * 24 * 3600 * 1000);
    assert.strictEqual((await goi('GET', '/api/tai-khoan/toi', null, moi.j.token)).s, 200);
    assert.strictEqual((await goi('GET', '/api/tai-khoan/toi', null, a.j.token)).s, 401, 'token cũ phải chết — hai token sống song song là nhân đôi chỗ rò');
    assert.strictEqual((await goi('POST', '/api/tai-khoan/gia-han', {})).s, 401);
  } finally { sv.close(); }
});
```

- [ ] **Step 2: Chạy, thấy đỏ.** Run: `node --test test/quy-tac-bao-va-gia-han.test.js`. Expected: FAIL (404 cho route mới).

- [ ] **Step 3: Module** — `backend/src/quy-tac-bao.js`

```js
'use strict';
/**
 * QUY TẮC "BÁO CHO CON" — do CHÍNH bố mẹ bật trên máy mình (Phần 2, 23/9/2026).
 *
 * ⚠️ §12 — "Tự bật auto-alert thay chủ tài khoản" bị cấm. Nên:
 *   · mặc định TẮT cả hai;
 *   · chỉ phiên của chủ tài khoản đọc/đặt được (route lấy id từ phiên, không từ thân);
 *   · chỉ nhận đúng true/false — không có giá trị thứ ba kiểu "mặc định bật".
 *
 * Phần 3 đọc quy tắc này trước khi gửi bất kỳ thông báo nào cho con.
 */
const BANG = 'quy_tac_bao';
const MAC_DINH = Object.freeze({ baoKhiCao: false, baoKhiOtpTrongCuocGoi: false });

class LoiQuyTac extends Error {
  constructor(ma) { super(ma); this.name = 'LoiQuyTac'; this.ma = ma; }
}

function chuanHoa(vao) {
  if (!vao || typeof vao !== 'object') throw new LoiQuyTac('QUY_TAC_KHONG_HOP_LE');
  const ra = {};
  for (const k of Object.keys(MAC_DINH)) {
    if (vao[k] === undefined) continue;
    if (typeof vao[k] !== 'boolean') throw new LoiQuyTac('QUY_TAC_KHONG_HOP_LE');
    ra[k] = vao[k];
  }
  return ra;
}

async function docQuyTac(kho, taiKhoanId) {
  const ban = await kho.doc(BANG, taiKhoanId);
  return {
    baoKhiCao: ban?.baoKhiCao === true,
    baoKhiOtpTrongCuocGoi: ban?.baoKhiOtpTrongCuocGoi === true,
  };
}

async function datQuyTac(kho, taiKhoanId, vao, bayGio = Date.now()) {
  const moi = { ...(await docQuyTac(kho, taiKhoanId)), ...chuanHoa(vao) };
  await kho.luu(BANG, taiKhoanId, { ...moi, capNhatLuc: bayGio });
  return moi;
}

module.exports = { BANG, MAC_DINH, LoiQuyTac, docQuyTac, datQuyTac };
```

- [ ] **Step 4: Routes** — `backend/server.js`, chèn ngay trước chú thích `/** §9.8 — chủ tài khoản thu hồi bất cứ lúc nào`:

```js
const QT = require('./src/quy-tac-bao');

/**
 * QUY TẮC "BÁO CHO CON" — Phần 2 (23/9/2026). Id lấy TỪ PHIÊN, không từ thân
 * yêu cầu: không ai đặt được quy tắc của nhà người khác (§12).
 */
app.get('/api/gia-dinh/quy-tac-bao', chanDoc, canPhien, async (req, res) => {
  try {
    return res.json(await QT.docQuyTac(await KP.khoChung(), req.taiKhoanId));
  } catch { return res.status(500).json({ maLoi: 'LOI_MAY_CHU' }); }
});

app.put('/api/gia-dinh/quy-tac-bao', chanProof, canPhien, async (req, res) => {
  try {
    return res.json(await QT.datQuyTac(await KP.khoChung(), req.taiKhoanId, req.body));
  } catch (e) {
    if (e instanceof QT.LoiQuyTac) return res.status(400).json({ maLoi: e.ma });
    return res.status(500).json({ maLoi: 'LOI_MAY_CHU' });
  }
});

/**
 * GIA HẠN PHIÊN — Phần 2 (23/9/2026). Phiên sống 30 ngày; hết là mọi cảnh báo cho
 * con LẶNG LẼ ngừng (§4.3: "chưa báo được" trông y hệt "đã báo"). Máy bố mẹ gọi
 * đường này khi phiên còn dưới 7 ngày. Cấp token MỚI rồi HUỶ token cũ — hai token
 * sống song song là nhân đôi chỗ rò.
 */
app.post('/api/tai-khoan/gia-han', chanProof, canPhien, async (req, res) => {
  try {
    const moi = await KP.capPhien(req.taiKhoanId);
    await KP.huyPhien(req.headers.authorization);
    return res.json(moi);
  } catch { return res.status(500).json({ maLoi: 'LOI_MAY_CHU' }); }
});
```

- [ ] **Step 5: Chạy, thấy xanh.** Run: `node --test test/quy-tac-bao-va-gia-han.test.js`. Expected: PASS 2/2.

---

### Task 2: Frontend lib — phiên tự gia hạn, quy tắc, hợp nhất người thân, lời nhắn

**Files:**
- Modify: `src/tai-khoan.ts` (thêm hàm, sửa `layHoSo`)
- Create: `src/lib/hop-nhat-nguoi-than.ts`
- Create: `src/lib/loi-nhan-giong.ts`
- Test: `test/con-cai-giup.test.js`

**Interfaces:**
- Produces:
  - `docQuyTacBao(): Promise<QuyTacBao>` và `datQuyTacBao(q: Partial<QuyTacBao>): Promise<QuyTacBao>`, với `QuyTacBao = { baoKhiCao: boolean; baoKhiOtpTrongCuocGoi: boolean }`
  - `giaHanNeuSapHet(bayGio?: number): Promise<boolean>`
  - `hopNhatNguoiThan(ds: NguoiThanToiThieu[], daGhep: {ten: string; so: string}[], taoId?: () => number): NguoiThanToiThieu[]`
  - `luuLoiNhan(blob: Blob): Promise<boolean>`, `docLoiNhan(): Promise<Blob | null>`, `xoaLoiNhan(): Promise<void>`
  - `useLoiNhanCon(): { url: string | null; daTai: boolean; taiLai: () => void }`
  - `usePhatMotLan(url: string | null, bat: boolean): void`

- [ ] **Step 1: Test đỏ** — `test/con-cai-giup.test.js`

```js
'use strict';
/**
 * PHẦN 2 "CON CHÁU CÀI GIÚP" — 23/9/2026.
 * Đo trước đó: màn giới thiệu 4 trang không bước nào xin số con, nên nút gọi khẩn
 * cấp mặc định TRỐNG; và ghép máy xong thì số của con KHÔNG vào nút đó.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (...p) => { const f = path.join(GOC, ...p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

function goi(nguon, ten) {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  const ra = path.join(GOC, 'node_modules', '.goi-test-vong-tron', ten);
  fs.mkdirSync(path.dirname(ra), { recursive: true });
  esbuild.buildSync({ entryPoints: [nguon], bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent' });
  return require(ra);
}

test('ghép xong: người con tự vào danh sách người thân, không trùng số', () => {
  const H = goi(path.join(GOC, 'src', 'lib', 'hop-nhat-nguoi-than.ts'), 'hop-nhat.cjs');
  let id = 100;
  const ds = [{ id: 1, name: 'Hoa', relation: 'Con gái', phone: '0911 222 333' }];
  const kq = H.hopNhatNguoiThan(ds, [{ ten: 'Hoa', so: '0911222333' }, { ten: 'Minh', so: '0988000222' }], () => ++id);
  assert.strictEqual(kq.length, 2, 'số đã có (khác cách viết) không được thêm lần hai');
  assert.deepStrictEqual(kq[1], { id: 101, name: 'Minh', relation: 'Người thân tin cậy', phone: '0988000222' });
  assert.strictEqual(H.hopNhatNguoiThan(kq, [{ ten: 'Minh', so: '0988000222' }], () => 999).length, 2, 'gọi lại không nhân bản');
  assert.strictEqual(H.hopNhatNguoiThan(ds, [], () => 1), ds, 'không có gì mới thì trả lại đúng mảng cũ (không dựng lại vô ích)');
});

test('lời nhắn giọng KHÔNG BAO GIỜ rời máy', () => {
  const nguon = boChuThich(doc('src', 'lib', 'loi-nhan-giong.ts') + doc('src', 'components', 'GhiLoiNhan.tsx'));
  assert.ok(nguon.length > 0, 'chưa có mã lời nhắn');
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|FormData|api\(/.test(nguon), 'bác chọn 23/9: lời nhắn CHỈ lưu trên máy bố mẹ');
  assert.match(nguon, /indexedDB\.open\(/);
});

test('phiên tự gia hạn khi còn dưới 7 ngày — cảnh báo cho con không được tắt lặng', () => {
  const tk = doc('src', 'tai-khoan.ts');
  assert.match(tk, /export async function giaHanNeuSapHet/);
  assert.match(tk, /7 \* 24 \* 60 \* 60 \* 1000/);
  const i = tk.indexOf('export async function layHoSo');
  assert.match(tk.slice(i, i + 600), /giaHanNeuSapHet\(/, 'layHoSo (chạy mỗi lần mở app) phải gọi gia hạn');
});
```

- [ ] **Step 2: Chạy, thấy đỏ.** Run: `node --test test/con-cai-giup.test.js`. Expected: FAIL.

- [ ] **Step 3: `src/lib/hop-nhat-nguoi-than.ts`**

```ts
/**
 * HỢP NHẤT NGƯỜI THÂN ĐÃ GHÉP VÀO DANH SÁCH GỌI KHẨN CẤP — Phần 2, 23/9/2026.
 *
 * Đo trước đó: ghép máy xong, số của con KHÔNG vào nút "Gọi con cháu" trên màn
 * khẩn cấp — bác phải tự gõ lại. Hàm này thêm người đã ghép (tên + số lấy từ máy
 * chủ) vào `familyMembers`, KHÔNG trùng số (so theo chữ số, bỏ dấu cách).
 *
 * ⚠️ CHỈ THÊM, KHÔNG XOÁ. Gỡ ghép trên máy chủ không tự xoá người khỏi danh bạ
 * khẩn cấp của bác: đó là số bác vẫn có thể cần gọi.
 */
export interface NguoiThanToiThieu {
  id: number;
  name: string;
  relation: string;
  phone: string;
  avatar?: string;
}

const chiSo = (s: string) => String(s ?? '').replace(/\D/g, '');

export function hopNhatNguoiThan<T extends NguoiThanToiThieu>(
  ds: T[],
  daGhep: { ten: string; so: string }[],
  taoId: () => number = () => Date.now(),
): T[] {
  const daCo = new Set(ds.map((n) => chiSo(n.phone)));
  const them: NguoiThanToiThieu[] = [];
  for (const g of daGhep) {
    const so = chiSo(g.so);
    if (!so || daCo.has(so)) continue;
    daCo.add(so);
    them.push({ id: taoId(), name: g.ten, relation: 'Người thân tin cậy', phone: g.so });
  }
  return them.length === 0 ? ds : [...ds, ...(them as T[])];
}
```

- [ ] **Step 4: `src/lib/loi-nhan-giong.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ═════ LỜI NHẮN BẰNG GIỌNG CỦA CON — CHỈ NẰM TRÊN MÁY BỐ MẸ ═════
 * Phần 2, 23/9/2026. Bác (người dùng) chọn: "Chỉ trên máy bố mẹ".
 *
 * Kẻ lừa mượn uy "công an", "ngân hàng". Giọng của chính con mình có uy hơn — và
 * người đang hoảng không phải đọc chữ nào. Lời nhắn tự phát khi màn khẩn cấp hiện.
 *
 * ⚠️ KHÔNG CÓ ĐƯỜNG NÀO RA MẠNG. Không fetch, không đồng bộ, không sao lưu. Đổi
 * máy thì phải ghi lại — giao diện nói thẳng điều đó. Có test quét nguồn.
 * ⚠️ IndexedDB hỏng hay bị chặn (chế độ riêng tư) thì trả null — màn khẩn cấp
 * quay về giọng máy đọc câu lệnh, không sập.
 */
const TEN_DB = 'khoan-da-loi-nhan';
const KHO = 'loi_nhan';
const KHOA = 'con';

function moDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const r = indexedDB.open(TEN_DB, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(KHO); };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function luuLoiNhan(blob: Blob): Promise<boolean> {
  const db = await moDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(KHO, 'readwrite');
      tx.objectStore(KHO).put({ blob, luc: Date.now() }, KHOA);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

export async function docLoiNhan(): Promise<Blob | null> {
  const db = await moDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const r = db.transaction(KHO, 'readonly').objectStore(KHO).get(KHOA);
      r.onsuccess = () => resolve(r.result?.blob instanceof Blob ? r.result.blob : null);
      r.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function xoaLoiNhan(): Promise<void> {
  const db = await moDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(KHO, 'readwrite');
      tx.objectStore(KHO).delete(KHOA);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch { resolve(); }
  });
}

/** Lời nhắn hiện có, dạng URL phát được. `daTai=false` khi đang đọc IndexedDB. */
export function useLoiNhanCon(): { url: string | null; daTai: boolean; taiLai: () => void } {
  const [url, setUrl] = useState<string | null>(null);
  const [daTai, setDaTai] = useState(false);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    let huy = false;
    let taoRa: string | null = null;
    void docLoiNhan().then((blob) => {
      if (huy) return;
      if (blob) { taoRa = URL.createObjectURL(blob); setUrl(taoRa); } else setUrl(null);
      setDaTai(true);
    });
    return () => { huy = true; if (taoRa) URL.revokeObjectURL(taoRa); };
  }, [lan]);
  const taiLai = useCallback(() => setLan((x) => x + 1), []);
  return { url, daTai, taiLai };
}

/** Phát lời nhắn ĐÚNG MỘT LẦN khi `bat` đúng. Trình duyệt chặn thì im lặng (câu lệnh vẫn trên màn). */
export function usePhatMotLan(url: string | null, bat: boolean): void {
  const daPhat = useRef(false);
  useEffect(() => {
    if (!bat) { daPhat.current = false; return; }
    if (daPhat.current || !url) return;
    daPhat.current = true;
    try { void new Audio(url).play().catch(() => undefined); } catch { /* im lặng */ }
  }, [bat, url]);
}
```

- [ ] **Step 5: `src/tai-khoan.ts`**
  - **Sửa `layHoSo`:** thêm `await giaHanNeuSapHet();` ngay sau dòng `if (!docPhien()) return null;`.
  - **Thêm vào cuối tệp:**

```ts
/*
 * ══════════ GIA HẠN PHIÊN — Phần 2, 23/9/2026 ══════════
 * Phiên sống 30 ngày. Hết là mọi cảnh báo cho con LẶNG LẼ ngừng (§4.3). `layHoSo`
 * chạy mỗi lần mở app, nên gọi ở đó: còn dưới 7 ngày thì đổi token mới.
 * ⚠️ Hỏng mạng thì thôi, KHÔNG đăng xuất — phiên cũ vẫn còn hạn.
 */
export async function giaHanNeuSapHet(bayGio: number = Date.now()): Promise<boolean> {
  const p = docPhien();
  if (!p || typeof p.hetHanLuc !== 'number') return false;
  if (p.hetHanLuc - bayGio > 7 * 24 * 60 * 60 * 1000) return false;
  try {
    const t = await goi('/api/tai-khoan/gia-han', { method: 'POST', body: '{}' }, true);
    if (t?.token) { luuPhien({ ...p, token: t.token, hetHanLuc: t.hetHanLuc }); return true; }
  } catch { /* giữ phiên cũ */ }
  return false;
}

/* ══════════ QUY TẮC "BÁO CHO CON" — Phần 2 ══════════ */
export interface QuyTacBao {
  baoKhiCao: boolean;
  baoKhiOtpTrongCuocGoi: boolean;
}

export async function docQuyTacBao(): Promise<QuyTacBao> {
  const t = await goi('/api/gia-dinh/quy-tac-bao', {}, true);
  return { baoKhiCao: t?.baoKhiCao === true, baoKhiOtpTrongCuocGoi: t?.baoKhiOtpTrongCuocGoi === true };
}

export async function datQuyTacBao(q: Partial<QuyTacBao>): Promise<QuyTacBao> {
  const t = await goi('/api/gia-dinh/quy-tac-bao', { method: 'PUT', body: JSON.stringify(q) }, true);
  return { baoKhiCao: t?.baoKhiCao === true, baoKhiOtpTrongCuocGoi: t?.baoKhiOtpTrongCuocGoi === true };
}
```

- [ ] **Step 6: Chạy, thấy xanh.** Run: `node --test test/con-cai-giup.test.js && npx tsc --noEmit`. Expected: 2/3 PASS. Test "lời nhắn không rời máy" cần `GhiLoiNhan.tsx`, nên xanh sau Task 3.

---

### Task 3: Ghi lời nhắn + nhúng màn ghép + luồng "Con cháu cài giúp"

**Files:**
- Create: `src/components/GhiLoiNhan.tsx`
- Create: `src/components/ConCaiGiup.tsx`
- Modify: `src/components/GhepConChau.tsx` (thêm props `nhung`, `onDanhSach`)
- Modify: `src/App.tsx`:
  - thêm `'con_cai_giup'` vào `ViewState`
  - render hai màn (`ghep_con_chau` truyền `onDanhSach`, và `con_cai_giup`)
  - `triggerDienTap`
  - nút ở trang giới thiệu cuối
  - thẻ trong Cài đặt
- Modify: `src/i18n.ts`
- Test: `test/con-cai-giup.test.js` (thêm)

**Interfaces:**
- Consumes: Task 2; `dangKy`, `dangNhap`, `docPhien`, `LoiTaiKhoan` (tai-khoan.ts); `laApk()` (native.ts).
- Produces:
  - `ManGhepConChau` props: `nhung?: boolean`, `onDanhSach?: (ds: NguoiDaGhep[]) => void`
  - `ManConCaiGiup({ t, setView, onDangNhapXong, onDanhSachGhep, onDienTap })`

- [ ] **Step 1: Test đỏ** — nối vào `test/con-cai-giup.test.js`

```js
test('luồng "Con cháu cài giúp" có đủ 5 bước, quy tắc báo mặc định tắt', () => {
  const w = doc('src', 'components', 'ConCaiGiup.tsx');
  assert.ok(w.length > 0, 'chưa có ConCaiGiup.tsx');
  for (const buoc of ["'tai_khoan'", "'noi_may'", "'loi_nhan'", "'quy_tac'", "'dien_tap'"]) assert.ok(w.includes(buoc), `thiếu bước ${buoc}`);
  assert.match(w, /useState<QuyTacBao>\(\{ baoKhiCao: false, baoKhiOtpTrongCuocGoi: false \}\)/, '§12 — công tắc báo mặc định TẮT');
  assert.match(w, /nhung/, 'bước nối máy phải nhúng đúng màn ghép đã có — không viết lại luồng mã');
});

test('ghép xong ở MỌI lối vào: người con vào danh sách gọi khẩn cấp', () => {
  const APP = doc('src', 'App.tsx');
  assert.match(APP, /<ManGhepConChau t=\{t\} setView=\{setView\} onDanhSach=\{hopNhatDaGhep\} \/>/);
  assert.match(APP, /const hopNhatDaGhep = /);
});

test('diễn tập đi đường "tự bấm dừng" (không nhãn rủi ro) và mang cờ dienTap', () => {
  const APP = doc('src', 'App.tsx');
  const i = APP.indexOf('const triggerDienTap = () => {');
  assert.ok(i > 0);
  const khoi = APP.slice(i, i + 400);
  assert.match(khoi, /tuBamDung: true/);
  assert.match(khoi, /dienTap: true/);
  assert.ok(!/nhan:/.test(khoi), 'diễn tập không được tự đặt nhãn rủi ro (§4.2)');
});

test('màn giới thiệu có lối "Con cháu cài giúp"', () => {
  const APP = doc('src', 'App.tsx');
  assert.match(APP, /t\("Con cháu cài giúp"\)/);
});
```

- [ ] **Step 2: Chạy, thấy đỏ.**

- [ ] **Step 3: `src/components/GhiLoiNhan.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Trash2 } from 'lucide-react';
import { luuLoiNhan, docLoiNhan, xoaLoiNhan } from '../lib/loi-nhan-giong';

/**
 * GHI LỜI NHẮN CỦA CON — tối đa 15 giây, lưu TRÊN MÁY BỐ MẸ (IndexedDB). Phần 2.
 * ⚠️ Không đường nào ra mạng — xem `lib/loi-nhan-giong.ts` và test quét nguồn.
 * ⚠️ Không có micro / bị từ chối quyền thì nói ra lý do, không im lặng (§4.3).
 */
const TOI_DA_GIAY = 15;

export function GhiLoiNhan({ t, onDaLuu }: { t: (s: string) => string; onDaLuu?: () => void }) {
  const [trangThai, setTrangThai] = useState<'san_sang' | 'dang_ghi' | 'da_co' | 'loi'>('san_sang');
  const [giay, setGiay] = useState(0);
  const [loi, setLoi] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const ghiRef = useRef<MediaRecorder | null>(null);
  const hen = useRef<number | undefined>(undefined);

  useEffect(() => {
    let taoRa: string | null = null;
    void docLoiNhan().then((b) => { if (b) { taoRa = URL.createObjectURL(b); setUrl(taoRa); setTrangThai('da_co'); } });
    return () => { if (taoRa) URL.revokeObjectURL(taoRa); window.clearInterval(hen.current); };
  }, []);

  const batDau = async () => {
    setLoi(null);
    try {
      const luong = await navigator.mediaDevices.getUserMedia({ audio: true });
      const manh: Blob[] = [];
      const ghi = new MediaRecorder(luong);
      ghi.ondataavailable = (e) => { if (e.data.size > 0) manh.push(e.data); };
      ghi.onstop = async () => {
        luong.getTracks().forEach((tr) => tr.stop());
        window.clearInterval(hen.current);
        const blob = new Blob(manh, { type: ghi.mimeType || 'audio/webm' });
        const ok = await luuLoiNhan(blob);
        if (!ok) { setLoi(t('Máy chưa cho lưu lời nhắn. Màn khẩn cấp sẽ dùng giọng máy đọc.')); setTrangThai('loi'); return; }
        setUrl((cu) => { if (cu) URL.revokeObjectURL(cu); return URL.createObjectURL(blob); });
        setTrangThai('da_co');
        onDaLuu?.();
      };
      ghiRef.current = ghi;
      ghi.start();
      setGiay(0);
      setTrangThai('dang_ghi');
      const batDauLuc = Date.now();
      hen.current = window.setInterval(() => {
        const g = Math.floor((Date.now() - batDauLuc) / 1000);
        setGiay(g);
        if (g >= TOI_DA_GIAY && ghi.state === 'recording') ghi.stop();
      }, 250);
    } catch {
      setLoi(t('Chưa dùng được micro. Cho phép micro trong cài đặt máy rồi thử lại.'));
      setTrangThai('loi');
    }
  };

  const dung = () => { if (ghiRef.current?.state === 'recording') ghiRef.current.stop(); };
  const xoa = async () => { await xoaLoiNhan(); if (url) URL.revokeObjectURL(url); setUrl(null); setTrangThai('san_sang'); onDaLuu?.(); };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[16px] text-slate-700 leading-relaxed">
        {t('Câu gợi ý: "Mẹ ơi, con đây. Ai bảo chuyển tiền hay đọc mã thì mẹ cúp máy, gọi con nhé."')}
      </p>
      {trangThai === 'dang_ghi' ? (
        <button type="button" onClick={dung}
          className="w-full min-h-[56px] rounded-[18px] bg-red-700 text-white font-black text-[17px] flex items-center justify-center gap-2">
          <Square size={20} aria-hidden="true" /> {t('Dừng ghi')} ({giay}/{TOI_DA_GIAY}s)
        </button>
      ) : (
        <button type="button" onClick={() => { void batDau(); }}
          className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] flex items-center justify-center gap-2">
          <Mic size={20} aria-hidden="true" /> {trangThai === 'da_co' ? t('Ghi lại') : t('Bấm để ghi (tối đa 15 giây)')}
        </button>
      )}
      {trangThai === 'da_co' && url && (
        <div className="flex gap-2">
          <button type="button" onClick={() => { void new Audio(url).play().catch(() => undefined); }}
            className="flex-1 min-h-[52px] rounded-[18px] border-2 border-[#2e1065] text-[#1e1b4b] font-bold text-[16px] flex items-center justify-center gap-2">
            <Play size={18} aria-hidden="true" /> {t('Nghe lại')}
          </button>
          <button type="button" onClick={() => { void xoa(); }}
            className="min-h-[52px] px-4 rounded-[18px] border-2 border-rose-700 text-rose-800 font-bold text-[16px] flex items-center justify-center gap-2">
            <Trash2 size={18} aria-hidden="true" /> {t('Xoá')}
          </button>
        </div>
      )}
      {loi && <p role="alert" className="text-[15px] font-bold text-rose-800">{loi}</p>}
      <p className="text-[14px] text-slate-600 leading-snug">{t('Lời nhắn chỉ lưu trên máy này. Đổi máy thì cần ghi lại.')}</p>
    </div>
  );
}
```

- [ ] **Step 4: `GhepConChau.tsx` nhúng được.**
  - Chữ ký: `export function ManGhepConChau({ t, setView, nhung = false, onDanhSach }: { t: (s: string) => string; setView: (v: ViewState) => void; nhung?: boolean; onDanhSach?: (ds: NguoiDaGhep[]) => void })`.
  - Trong `taiDs`: đổi `setDs((await docVongGhep()).thanhVien);` thành `const v = (await docVongGhep()).thanhVien; setDs(v); onDanhSach?.(v);`, và thêm `onDanhSach` vào mảng phụ thuộc của `useCallback`.
  - Khi `nhung`: không vẽ nút "Quay lại", `h1`, và đoạn giới thiệu. Bọc ba khối đó bằng `{!nhung && (<>…</>)}`. Đổi `className` của gốc thành `nhung ? 'w-full' : 'p-4 pb-24 max-w-xl mx-auto w-full overflow-y-auto'`.

- [ ] **Step 5: `src/components/ConCaiGiup.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import type { ViewState } from '../App';
import { docPhien, dangKy, dangNhap, docQuyTacBao, datQuyTacBao, LoiTaiKhoan, type HoSo, type NguoiDaGhep, type QuyTacBao } from '../tai-khoan';
import { ManGhepConChau } from './GhepConChau';
import { GhiLoiNhan } from './GhiLoiNhan';
import { laApk } from '../native';

/**
 * ═════ CON CHÁU CÀI GIÚP — làm trên MÁY BỐ MẸ, con ngồi cạnh. Phần 2, 23/9/2026 ═════
 *
 * Người cài app cho người già thường là con cháu. Đo trước đó: màn giới thiệu 4
 * trang không bước nào xin số con, nên nút gọi khẩn cấp mặc định TRỐNG.
 *
 * Năm bước, mỗi màn một việc, bước nào cũng bỏ qua được:
 *   tai_khoan → noi_may → loi_nhan → quy_tac → dien_tap
 *
 * ⚠️ §12 — công tắc "báo cho con" MẶC ĐỊNH TẮT, bố mẹ tự bật.
 * ⚠️ Lời nhắn giọng chỉ nằm trên máy này (bác chọn 23/9).
 */
type Buoc = 'tai_khoan' | 'noi_may' | 'loi_nhan' | 'quy_tac' | 'dien_tap';
const THU_TU: Buoc[] = ['tai_khoan', 'noi_may', 'loi_nhan', 'quy_tac', 'dien_tap'];

const LOI_TK: Record<string, string> = {
  SO_DA_DUOC_DANG_KY: 'Số này đã có tài khoản. Bấm "Đăng nhập" nhé.',
  SO_DIEN_THOAI_KHONG_HOP_LE: 'Số điện thoại chưa đúng.',
  THIEU_TEN: 'Cần nhập tên gọi của bác.',
  MAT_KHAU_QUA_NGAN: 'Mật khẩu cần ít nhất 6 ký tự.',
  SAI_SO_HOAC_MAT_KHAU: 'Số hoặc mật khẩu chưa đúng.',
  THU_LAI_SAU: 'Chờ một lát rồi thử lại nhé.',
};

export function ManConCaiGiup({ t, setView, onDangNhapXong, onDanhSachGhep, onDienTap }: {
  t: (s: string) => string;
  setView: (v: ViewState) => void;
  onDangNhapXong: (hs: HoSo) => void;
  onDanhSachGhep: (ds: NguoiDaGhep[]) => void;
  onDienTap: () => void;
}) {
  const [buoc, setBuoc] = useState<Buoc>(docPhien() ? 'noi_may' : 'tai_khoan');
  const [so, setSo] = useState('');
  const [ten, setTen] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [dangLam, setDangLam] = useState(false);
  const [quyTac, setQuyTac] = useState<QuyTacBao>({ baoKhiCao: false, baoKhiOtpTrongCuocGoi: false });
  const [daLuuQuyTac, setDaLuuQuyTac] = useState(false);

  useEffect(() => {
    if (buoc !== 'quy_tac' || !docPhien()) return;
    void docQuyTacBao().then(setQuyTac).catch(() => undefined);
  }, [buoc]);

  const tiep = () => {
    const i = THU_TU.indexOf(buoc);
    const sau = THU_TU[i + 1];
    if (sau) { setLoi(null); setBuoc(sau); } else setView('home');
  };

  const vaoTaiKhoan = async (moi: boolean) => {
    setDangLam(true); setLoi(null);
    try {
      const hs = moi ? await dangKy(so, matKhau, ten) : await dangNhap(so, matKhau);
      onDangNhapXong(hs);
      setBuoc('noi_may');
    } catch (e) {
      const ma = e instanceof LoiTaiKhoan ? e.ma : '';
      setLoi(t(LOI_TK[ma] ?? 'Chưa kết nối được máy chủ. Thử lại sau nhé.'));
    } finally { setDangLam(false); }
  };

  const luuQuyTac = async (moi: QuyTacBao) => {
    setQuyTac(moi); setDaLuuQuyTac(false); setLoi(null);
    try { setQuyTac(await datQuyTacBao(moi)); setDaLuuQuyTac(true); }
    catch { setLoi(t('Chưa lưu được. Kiểm tra mạng rồi thử lại.')); }
  };

  const o = 'w-full min-h-[56px] rounded-[18px] border-2 border-slate-300 focus:border-[#6d28d9] px-4 text-[18px] text-slate-900 outline-none';
  const nutChinh = 'w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] disabled:opacity-60';
  const nutPhu = 'w-full min-h-[52px] rounded-[18px] border-2 border-slate-400 text-slate-700 font-bold text-[16px]';
  const soBuoc = THU_TU.indexOf(buoc) + 1;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full overflow-y-auto">
      <button type="button" onClick={() => setView('home')} className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#1e1b4b] font-bold text-[15px]">
        <ChevronLeft size={22} aria-hidden="true" /> {t('Quay lại')}
      </button>
      <p className="text-[15px] font-bold text-[#6d28d9] mt-1">{t('Bước {i}/5').replace('{i}', String(soBuoc))}</p>

      {buoc === 'tai_khoan' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Tài khoản cho bố mẹ')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Dùng số điện thoại của bố mẹ. Mật khẩu để con giữ giúp.')}</p>
          <label className="text-[15px] font-bold text-slate-700" htmlFor="cg-so">{t('Số điện thoại của bố mẹ')}</label>
          <input id="cg-so" inputMode="tel" autoComplete="tel" value={so} onChange={(e) => setSo(e.target.value)} className={o} />
          <label className="text-[15px] font-bold text-slate-700" htmlFor="cg-ten">{t('Tên gọi (để con cháu nhận ra)')}</label>
          <input id="cg-ten" value={ten} onChange={(e) => setTen(e.target.value)} className={o} />
          <label className="text-[15px] font-bold text-slate-700" htmlFor="cg-mk">{t('Mật khẩu')}</label>
          <input id="cg-mk" type="password" autoComplete="new-password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} className={o} />
          {loi && <p role="alert" className="text-[15px] font-bold text-rose-800">{loi}</p>}
          <button type="button" disabled={dangLam} onClick={() => { void vaoTaiKhoan(true); }} className={nutChinh}>{t('Tạo tài khoản')}</button>
          <button type="button" disabled={dangLam} onClick={() => { void vaoTaiKhoan(false); }} className={nutPhu}>{t('Đã có tài khoản? Đăng nhập')}</button>
        </section>
      )}

      {buoc === 'noi_may' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Nối với máy của con')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Trên máy con: mở Khoan Đã, chọn "Con cháu", nhập mã dưới đây. Nối xong, số của con tự vào nút gọi khẩn cấp.')}</p>
          <ManGhepConChau t={t} setView={setView} nhung onDanhSach={onDanhSachGhep} />
          <button type="button" onClick={tiep} className={nutChinh}>{t('Tiếp tục')}</button>
        </section>
      )}

      {buoc === 'loi_nhan' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Lời nhắn bằng giọng của con')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Khi có nguy hiểm cao, máy sẽ phát lời nhắn này thay cho giọng máy đọc.')}</p>
          <GhiLoiNhan t={t} />
          <button type="button" onClick={tiep} className={nutChinh}>{t('Tiếp tục')}</button>
        </section>
      )}

      {buoc === 'quy_tac' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Báo cho con khi có chuyện')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Chỉ báo mức nguy hiểm và loại tình huống. Nội dung tin nhắn không gửi đi đâu.')}</p>
          <label className="flex items-center gap-3 min-h-[56px] rounded-[18px] border-2 border-[#2e1065] px-4 py-3">
            <input type="checkbox" className="w-6 h-6 shrink-0" checked={quyTac.baoKhiCao}
              onChange={(e) => { void luuQuyTac({ ...quyTac, baoKhiCao: e.target.checked }); }} />
            <span className="text-[16px] font-bold text-[#1e1b4b] leading-snug">{t('Báo cho con khi Khoan Đã thấy nguy hiểm cao')}</span>
          </label>
          {laApk() && (
            <label className="flex items-center gap-3 min-h-[56px] rounded-[18px] border-2 border-[#2e1065] px-4 py-3">
              <input type="checkbox" className="w-6 h-6 shrink-0" checked={quyTac.baoKhiOtpTrongCuocGoi}
                onChange={(e) => { void luuQuyTac({ ...quyTac, baoKhiOtpTrongCuocGoi: e.target.checked }); }} />
              <span className="text-[16px] font-bold text-[#1e1b4b] leading-snug">{t('Báo cho con khi máy nhận mã OTP trong lúc đang có cuộc gọi')}</span>
            </label>
          )}
          {daLuuQuyTac && <p role="status" className="text-[15px] font-bold text-emerald-800 flex items-center gap-1"><Check size={18} aria-hidden="true" /> {t('Đã lưu')}</p>}
          {loi && <p role="alert" className="text-[15px] font-bold text-rose-800">{loi}</p>}
          <button type="button" onClick={tiep} className={nutChinh}>{t('Tiếp tục')}</button>
        </section>
      )}

      {buoc === 'dien_tap' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Tập một lần cho quen')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Bấm "Thử" để xem màn khẩn cấp. Bố mẹ tập bấm nút gọi con. Đây chỉ là diễn tập.')}</p>
          <button type="button" onClick={onDienTap} className={nutChinh}>{t('Thử')}</button>
          <button type="button" onClick={() => setView('home')} className={nutPhu}>{t('Xong')}</button>
        </section>
      )}

      {buoc !== 'tai_khoan' && buoc !== 'dien_tap' && (
        <button type="button" onClick={tiep} className="w-full min-h-[52px] mt-2 text-[15px] font-bold text-slate-600 underline">{t('Bỏ qua bước này')}</button>
      )}
    </div>
  );
}
```

- [ ] **Step 6: `App.tsx` nối dây**
  - `ViewState`: thêm `| 'con_cai_giup'`.
  - Import: `import { ManConCaiGiup } from './components/ConCaiGiup';` và `import { hopNhatNguoiThan } from './lib/hop-nhat-nguoi-than';`.
  - Cạnh `triggerEmergencyAlert` thêm:

```tsx
  /** Ghép xong ở bất kỳ lối nào ⇒ người con vào danh sách gọi khẩn cấp (Phần 2). */
  const hopNhatDaGhep = (ds: { ten: string; so: string }[]) =>
    setFamilyMembers((cu: NguoiThan[]) => hopNhatNguoiThan(cu, ds));

  /**
   * DIỄN TẬP — đường "tự bấm dừng" có sẵn (không nhãn rủi ro, §4.2) + cờ `dienTap`.
   * Màn cảnh báo hiện băng "ĐÂY LÀ DIỄN TẬP" và KHÔNG ghi kết quả can thiệp.
   */
  const triggerDienTap = () => {
    setAnalyzeResult({ canThiep: 'PAUSE_60S', tuBamDung: true, dienTap: true, maLyDo: [], daKiem: [], chuaKiem: [] });
    setView('warning');
  };
```

  - Render: đổi `{view === 'ghep_con_chau' && <ManGhepConChau t={t} setView={setView} />}` thành `<ManGhepConChau t={t} setView={setView} onDanhSach={hopNhatDaGhep} />`, và thêm `{view === 'con_cai_giup' && <ManConCaiGiup t={t} setView={setView} onDangNhapXong={setHoSo} onDanhSachGhep={hopNhatDaGhep} onDienTap={triggerDienTap} />}`.
  - `KetQuaPhanTich` thêm `dienTap?: boolean;`.
  - `IntroView`: dưới nút "Tiếp tục / Bắt đầu sử dụng", khi `currentSlide === slides.length - 1`, thêm nút phụ:

```tsx
        {currentSlide === slides.length - 1 && (
          <button
            onClick={() => { if (setUserRole) setUserRole('elder'); danhDauDaXem(); setView('con_cai_giup'); }}
            className="w-full max-w-sm mt-2 min-h-[52px] rounded-2xl border-2 border-[#6d28d9] text-[#4c1d95] font-bold text-[16px] bg-white/80 active:scale-95 transition-transform"
          >
            {t("Con cháu cài giúp")}
          </button>
        )}
```

  - Cài đặt: thêm thẻ "Con cháu cài giúp" (chép kiểu thẻ "Nối với con cháu"), mô tả `t('Nối máy, ghi lời nhắn, bật báo cho con — 3 phút')`, `onClick={() => setView('con_cai_giup')}`.

- [ ] **Step 7: i18n** (một tệp JSON cho `them-i18n.py`), gồm mọi chuỗi mới ở Step 3–6.
- [ ] **Step 8: Chạy, thấy xanh.** Run: `node --test test/con-cai-giup.test.js && npx tsc --noEmit`.

---

### Task 4: Màn khẩn cấp — phát lời nhắn của con; băng diễn tập; diễn tập không ghi số liệu

**Files:**
- Modify: `src/App.tsx` (`WarningView`)
- Modify: `test/man-khan-cap-mot-viec.test.js` (regex `useDocToMotLan`)
- Test: `test/con-cai-giup.test.js` (thêm)

- [ ] **Step 1: Test đỏ**

```js
test('màn khẩn cấp: có lời nhắn của con thì PHÁT LỜI NHẮN, không đọc giọng máy', () => {
  const APP = doc('src', 'App.tsx');
  assert.match(APP, /const loiNhan = useLoiNhanCon\(\);/);
  assert.match(APP, /usePhatMotLan\(loiNhan\.url, heroGap && loiNhan\.daTai && coLoiNhan\);/);
  assert.match(APP, /useDocToMotLan\(cauTuDoc, heroGap && loiNhan\.daTai && !coLoiNhan,/);
});

test('diễn tập: có băng "ĐÂY LÀ DIỄN TẬP" và KHÔNG ghi kết quả can thiệp (§4.6)', () => {
  const APP = doc('src', 'App.tsx');
  assert.match(APP, /const laDienTap = result\?\.dienTap === true;/);
  assert.match(APP, /t\('ĐÂY LÀ DIỄN TẬP — không có gì nguy hiểm\.'\)/);
  const i = APP.indexOf('const ghiHanhDong = (hanhDong: HanhDong) => {');
  assert.match(APP.slice(i, i + 300), /if \(laDienTap\) return;/, 'lượt tập mà ghi vào sẽ làm bẩn tỷ lệ báo động giả');
});
```

- [ ] **Step 2: Sửa `WarningView`**
  - Import `useLoiNhanCon, usePhatMotLan` từ `./lib/loi-nhan-giong`.
  - Ngay đầu `WarningView`, sau `const tuBamDung = …`: `const laDienTap = result?.dienTap === true;`.
  - `ghiHanhDong`: thêm dòng đầu `if (laDienTap) return;`.
  - Chỗ gọi `useDocToMotLan` đổi thành:

```tsx
  const loiNhan = useLoiNhanCon();
  const coLoiNhan = Boolean(loiNhan.url);
  usePhatMotLan(loiNhan.url, heroGap && loiNhan.daTai && coLoiNhan);
  useDocToMotLan(cauTuDoc, heroGap && loiNhan.daTai && !coLoiNhan, lang === 'en' ? 'en-US' : 'vi-VN',
    () => setIsSpeaking(true), () => setIsSpeaking(false));
```

  - Dưới `{nutHanhDongGap}` (màn gấp): khi `coLoiNhan`, thêm nút phụ "Nghe lại lời nhắn của con":

```tsx
              {coLoiNhan && loiNhan.url && (
                <button type="button" onClick={() => { void new Audio(loiNhan.url as string).play().catch(() => undefined); }}
                  className="w-full min-h-[52px] rounded-[18px] bg-white/15 text-white border-2 border-white/40 font-bold text-[16px] px-3 flex items-center justify-center gap-2">
                  <Volume2 size={18} className="shrink-0" /> {t('Nghe lại lời nhắn của con')}
                </button>
              )}
```

  - Ngay trên `<h1 id="khoan-da-nhan-rui-ro"…>`, thêm băng diễn tập:

```tsx
        {laDienTap && (
          <p role="status" className="w-full mb-2 rounded-2xl bg-white text-[#7f1d1d] border-2 border-white px-3 py-2 text-[18px] font-black text-center leading-snug">
            {t('ĐÂY LÀ DIỄN TẬP — không có gì nguy hiểm.')}
          </p>
        )}
```

  - `test/man-khan-cap-mot-viec.test.js`: đổi `/useDocToMotLan\(cauTuDoc, heroGap,/` thành `/useDocToMotLan\(cauTuDoc, heroGap\b/`.

- [ ] **Step 3: i18n:** `"ĐÂY LÀ DIỄN TẬP — không có gì nguy hiểm."` → `"THIS IS A DRILL — nothing is wrong."`; `"Nghe lại lời nhắn của con"` → `"Play your family's message again"`.
- [ ] **Step 4: Chạy, thấy xanh:** `npm test`, `npm run lint`, `npm run build`.

---

### Task 5: Kiểm trên trình duyệt (375×812)

- [ ] Khởi động lại máy chủ dev, vì backend có route mới. Dùng SQLite tạm trong thư mục nháp.
- [ ] Mở `con_cai_giup` từ màn giới thiệu cuối (xoá `daXemIntro`).
  - Tạo tài khoản mẫu **trên máy chủ cục bộ**, không phải web thật.
  - Lấy mã nối. Ghép từ tài khoản thứ hai bằng API. Xác nhận `familyMembers` có người con.
- [ ] Bước lời nhắn: trình duyệt xem trước có thể không có micro, nên kiểm thông báo lỗi micro hiện đúng. Lưu một blob giả vào IndexedDB bằng JS để kiểm phần phát.
- [ ] Bước quy tắc: bật "nguy hiểm cao", tải lại, vẫn bật (đọc từ máy chủ).
- [ ] Diễn tập: bấm "Thử" → màn khẩn cấp có băng diễn tập, nút gọi con ở nửa trên. Có blob lời nhắn → `Audio.play` được gọi, `speechSynthesis.speak` không được gọi. `khoan_da_ket_qua_can_thiep` không có bản ghi mới.
- [ ] Dọn: `familyMembers` về `[]`, xoá IndexedDB `khoan-da-loi-nhan`, đăng xuất phiên mẫu. Trả viewport về desktop.
