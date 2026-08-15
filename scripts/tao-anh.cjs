'use strict';
/**
 * §7.4 — SINH ẢNH MINH HOẠ (linh vật · nhãn dán · khiên thương hiệu).
 *
 * ⚠️ PHẠM VI: script này CHỈ tạo tài sản hình ảnh. Nó **không nằm trong đường
 * risk analysis** — không đụng OCR, Risk Signal Engine, Rule Engine hay xác
 * thực link (§12). Chạy tay, kết quả commit dưới dạng `.webp`.
 *
 * ⚠️ MODEL: `.env` ghim `IMAGE_MODEL=gpt-image-1.5`. Đo 15/8/2026 trên
 * `codex.hungnguyen.codes`: model đó trả **HTTP 503 `model_not_found`**
 * ("No available channel ... under group claude & codex"). Cổng chỉ còn
 * **`gpt-image-2`**. Script tự rơi về `gpt-image-2` và IN RA dòng báo — không
 * âm thầm đổi. Nạp lại kênh cho 1.5 thì nó tự dùng lại 1.5.
 *
 * Dùng:
 *   npm run tao-anh                    # sinh những ảnh CHƯA có .webp
 *   npm run tao-anh -- --lam-lai       # sinh lại tất cả
 *   npm run tao-anh -- --chi linh-vat-chao,khien-la
 *   npm run tao-anh -- --song-song 2   # giảm nếu cổng chặn
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { DANH_MUC, PHONG_CACH, CAM_CHU } = require('./danh-muc-anh.cjs');
const { nenMot } = require('./nen-anh.cjs');

const BASE = process.env.IMAGE_API_BASE;
const KEY = process.env.IMAGE_API_KEY;
const MODEL_GHIM = process.env.IMAGE_MODEL || 'gpt-image-1.5';
const MODEL_DU_PHONG = 'gpt-image-2';

const THU_MUC = path.join(__dirname, '..', 'public', 'assets', '3d');
const KHO_SINH = '1024x1024';
const SO_LAN_THU = 3;

const co = (c) => process.argv.includes(c);
const lay = (c, mac) => {
  const i = process.argv.indexOf(c);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : mac;
};

const LAM_LAI = co('--lam-lai');
const SONG_SONG = Math.max(1, Number(lay('--song-song', '3')) || 3);
const CHI = lay('--chi', '').split(',').map((s) => s.trim()).filter(Boolean);

/** Model thực sự dùng — quyết định MỘT lần ở đầu lượt chạy, rồi in ra. */
let modelDangDung = MODEL_GHIM;

function loiNhac(muc) {
  return `${PHONG_CACH} ${muc.prompt} ${CAM_CHU}`;
}

async function goiMot(muc, model) {
  const r = await fetch(`${BASE}/images/generations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model,
      prompt: loiNhac(muc),
      size: KHO_SINH,
      n: 1,
      background: 'transparent',
      output_format: 'webp',   // cổng hiện bỏ qua và trả PNG — nen-anh.cjs lo phần còn lại
    }),
  });

  const txt = await r.text();
  let j;
  try { j = JSON.parse(txt); } catch { throw new Error(`HTTP ${r.status} — phản hồi không phải JSON`); }
  if (j.error) {
    const e = new Error(j.error.message || 'lỗi không rõ');
    e.ma = j.error.code;
    throw e;
  }

  const d = (j.data && j.data[0]) || {};
  if (d.b64_json) return Buffer.from(d.b64_json, 'base64');
  if (d.url) return Buffer.from(await (await fetch(d.url)).arrayBuffer());
  throw new Error('phản hồi không có b64_json lẫn url');
}

/** Kiểm tra model ghim còn sống không. Chạy MỘT lần, trước khi vào vòng. */
async function chonModel() {
  try {
    const r = await fetch(`${BASE}/models`, { headers: { authorization: `Bearer ${KEY}` } });
    const j = await r.json();
    const co1 = (j.data || []).some((m) => m.id === MODEL_GHIM);
    if (co1) return MODEL_GHIM;
    const co2 = (j.data || []).some((m) => m.id === MODEL_DU_PHONG);
    if (co2) {
      console.log(`⚠️  Cổng KHÔNG có "${MODEL_GHIM}". Rơi về "${MODEL_DU_PHONG}".`);
      console.log('    Đây là ràng buộc của cổng, không phải lựa chọn thẩm mỹ.\n');
      return MODEL_DU_PHONG;
    }
  } catch { /* cổng không cho liệt kê — cứ thử model ghim */ }
  return MODEL_GHIM;
}

async function sinhMot(muc) {
  const dichWebp = path.join(THU_MUC, `${muc.id}.webp`);
  if (!LAM_LAI && fs.existsSync(dichWebp)) {
    console.log(`⏭  ${muc.id} — đã có, bỏ qua`);
    return { id: muc.id, trangThai: 'bo_qua' };
  }

  for (let lan = 1; lan <= SO_LAN_THU; lan++) {
    const t0 = Date.now();
    try {
      const buf = await goiMot(muc, modelDangDung);
      const goc = path.join(THU_MUC, `${muc.id}.png`);   // .gitignore chặn — chủ đích
      fs.writeFileSync(goc, buf);
      const kq = await nenMot(goc, dichWebp, muc.khoRong);
      const giay = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`✓  ${muc.id.padEnd(20)} ${giay}s  ${(kq.byteVao / 1024).toFixed(0)}KB → ${(kq.byteRa / 1024).toFixed(0)}KB webp ${kq.rong}×${kq.cao}`);
      return { id: muc.id, trangThai: 'xong', ...kq };
    } catch (e) {
      const cuoi = lan === SO_LAN_THU;
      console.log(`${cuoi ? '✗' : '↻'}  ${muc.id.padEnd(20)} lần ${lan}/${SO_LAN_THU}: ${e.message.slice(0, 110)}`);
      if (cuoi) return { id: muc.id, trangThai: 'hong', loi: e.message };
      await new Promise((r) => setTimeout(r, 2500 * lan));
    }
  }
  return { id: muc.id, trangThai: 'hong' };
}

/** Chạy `viec` với trần đồng thời — cổng đã bóp thì đừng dội thêm. */
async function chayTheoLan(danhSach, tran, viec) {
  const ketQua = [];
  let chiSo = 0;
  const chay = async () => {
    while (chiSo < danhSach.length) {
      const i = chiSo++;
      ketQua[i] = await viec(danhSach[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(tran, danhSach.length) }, chay));
  return ketQua;
}

async function main() {
  if (!BASE || !KEY) {
    console.error('Thiếu IMAGE_API_BASE / IMAGE_API_KEY trong .env — dừng.');
    process.exit(1);
  }
  fs.mkdirSync(THU_MUC, { recursive: true });

  const canLam = CHI.length ? DANH_MUC.filter((m) => CHI.includes(m.id)) : DANH_MUC;
  if (!canLam.length) {
    console.error(`Không mục nào khớp --chi "${CHI.join(',')}"`);
    process.exit(1);
  }

  modelDangDung = await chonModel();
  console.log(`Cổng : ${BASE}`);
  console.log(`Model: ${modelDangDung}`);
  console.log(`Sinh : ${canLam.length} ảnh, song song ${SONG_SONG}, ~57s mỗi ảnh\n`);

  const t0 = Date.now();
  const kq = await chayTheoLan(canLam, SONG_SONG, sinhMot);

  const xong = kq.filter((r) => r.trangThai === 'xong').length;
  const boQua = kq.filter((r) => r.trangThai === 'bo_qua').length;
  const hong = kq.filter((r) => r.trangThai === 'hong');
  console.log(`\n${xong} xong · ${boQua} bỏ qua · ${hong.length} hỏng · ${((Date.now() - t0) / 1000 / 60).toFixed(1)} phút`);
  if (hong.length) {
    console.log('Hỏng: ' + hong.map((h) => h.id).join(', '));
    console.log(`Chạy lại: npm run tao-anh -- --chi ${hong.map((h) => h.id).join(',')}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
