#!/usr/bin/env node
'use strict';
/**
 * ĐO ĐỘ TRỄ THẬT CỦA /api/analyze TRÊN MÁY CHỦ ĐANG CHẠY.
 *
 *   node scripts/do-tre-render.js                    đo, in kết quả, KHÔNG ghi tệp
 *   node scripts/do-tre-render.js --ghi              ghi eval/results/do-tre-render.json
 *   node scripts/do-tre-render.js --url http://localhost:3000 --so 20
 *
 * Vì sao có tệp này: tài liệu pitch từng ghi "trung vị 6,5 giây, đuôi 27–35 giây"
 * mà repo không có tệp số đo nào đi kèm. Số không có tệp đo là số chưa đo (§11).
 *
 * ⚠️ TÁCH HAI ĐƯỜNG. Lượt có AI (`aiDaChay: true`) và lượt tầng luật tự kết luận
 * (`aiDaChay: false` — tin nổ tổ hợp chốt chặn thì bỏ qua AI, do thiết kế). Gộp hai
 * đường vào một trung vị là ra một con số không mô tả đường nào.
 * ⚠️ LƯỢT ĐẦU TÍNH RIÊNG. Gói free của Render ngủ khi vắng khách; lượt đánh thức
 * đo thời gian khởi động máy chủ, không đo phân tích.
 * ⚠️ GIÃN ≥ 2,3 GIÂY giữa hai lượt: máy chủ giới hạn 30 lượt/phút.
 * ⚠️ CHỈ GỬI MẪU TỰ SOẠN trong eval/dataset — không bao giờ gửi eval/mau-that.
 * ⚠️ TỆP KẾT QUẢ CHỈ GHI ID MẪU, không ghi nội dung tin.
 * ⚠️ Số đo gồm cả đường mạng từ máy chạy script tới máy chủ — đúng thứ người dùng
 * chờ, nhưng đổi theo nơi đo. Tệp kết quả ghi rõ đo từ đâu thì mới so được.
 */

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const co = (c) => process.argv.includes(c);
const thamSo = (ten, macDinh) => {
  const i = process.argv.indexOf(ten);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : macDinh;
};

const URL_GOC = String(thamSo('--url', 'https://khoan-da.onrender.com')).replace(/\/+$/, '');
const SO_LUOT = Math.max(6, Number(thamSo('--so', 48)) || 48);
const GIAN_CACH_MS = 2300;
const TRAN_CHO_MS = 90_000;
const THU_MUC_MAU = path.join(__dirname, '..', 'eval', 'dataset');
const TEP_KET_QUA = path.join(__dirname, '..', 'eval', 'results', 'do-tre-render.json');

/** Tỉ lệ ba nhóm trong mẫu gửi đi. Tin lành nhiều nhất vì đó là đường AI hay chạy nhất. */
const TI_LE = { CHUA_THAY: 0.5, NGHI_NGO: 0.25, CAO: 0.25 };

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

function napMau() {
  const theoMuc = { CHUA_THAY: [], NGHI_NGO: [], CAO: [] };
  for (const tep of fs.readdirSync(THU_MUC_MAU).filter((f) => f.endsWith('.jsonl')).sort()) {
    for (const dong of fs.readFileSync(path.join(THU_MUC_MAU, tep), 'utf8').split(/\r?\n/)) {
      if (!dong.trim()) continue;
      let m;
      try { m = JSON.parse(dong); } catch { continue; }
      if (!m || typeof m.noi_dung !== 'string' || !theoMuc[m.muc_do]) continue;
      theoMuc[m.muc_do].push({ id: m.id, mucDo: m.muc_do, ngonNgu: m.ngon_ngu, noiDung: m.noi_dung });
    }
  }
  // Chọn TẤT ĐỊNH: sắp theo id rồi lấy cách đều. Chạy lại là gửi đúng bộ cũ.
  const chon = [];
  for (const [muc, ds] of Object.entries(theoMuc)) {
    ds.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const can = Math.max(1, Math.round(SO_LUOT * TI_LE[muc]));
    const buoc = ds.length / can;
    for (let i = 0; i < can && i * buoc < ds.length; i += 1) chon.push(ds[Math.floor(i * buoc)]);
  }
  return chon;
}

async function goi(duong, tuyChon = {}) {
  const ctl = new AbortController();
  const hen = setTimeout(() => ctl.abort(), TRAN_CHO_MS);
  const t0 = performance.now();
  try {
    const r = await fetch(`${URL_GOC}${duong}`, { ...tuyChon, signal: ctl.signal });
    const than = await r.json().catch(() => null);
    return { ms: Math.round(performance.now() - t0), status: r.status, than };
  } catch (e) {
    return { ms: Math.round(performance.now() - t0), status: e?.name === 'AbortError' ? 'het_gio' : 'loi_mang', than: null };
  } finally {
    clearTimeout(hen);
  }
}

const phanTich = (vanBan) => goi('/api/analyze', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ vanBan }),
});

function thongKe(ds) {
  if (ds.length === 0) return null;
  const s = [...ds].sort((a, b) => a - b);
  const vi = (p) => s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)];
  const giua = Math.floor(s.length / 2);
  const trungVi = s.length % 2 ? s[giua] : (s[giua - 1] + s[giua]) / 2;
  return { soLuot: s.length, trungViMs: Math.round(trungVi), p90Ms: vi(0.9), nhanhNhatMs: s[0], chamNhatMs: s[s.length - 1] };
}

(async () => {
  const mau = napMau();
  console.log(`Đo ${URL_GOC} · ${mau.length} lượt · giãn ${GIAN_CACH_MS} ms`);

  // Lượt đánh thức: tính riêng, không vào thống kê.
  const sucKhoe = await goi('/api/suc-khoe');
  const danhThuc = await phanTich('Chiều nay con qua đón mẹ đi khám nhé.');
  console.log(`  sức khoẻ ${sucKhoe.status} (${sucKhoe.ms} ms) · lượt đánh thức ${danhThuc.status} (${danhThuc.ms} ms)`);
  if (sucKhoe.status !== 200) {
    console.error('Máy chủ không trả lời /api/suc-khoe — dừng, không đo gì.');
    process.exit(1);
  }

  const luot = [];
  let lanTruoc = performance.now();
  for (const [i, m] of mau.entries()) {
    const cho = GIAN_CACH_MS - (performance.now() - lanTruoc);
    if (cho > 0) await ngu(cho);
    lanTruoc = performance.now();
    let kq = await phanTich(m.noiDung);
    if (kq.status === 429) {
      // Chạm trần lượt/phút: chờ hết một phút rồi thử lại đúng một lần.
      await ngu(61_000);
      lanTruoc = performance.now();
      kq = await phanTich(m.noiDung);
    }
    const aiDaChay = kq.than && typeof kq.than.aiDaChay === 'boolean' ? kq.than.aiDaChay : null;
    luot.push({ id: m.id, mucDo: m.mucDo, ngonNgu: m.ngonNgu, ms: kq.ms, status: kq.status, aiDaChay, nhan: kq.than?.nhan ?? null });
    console.log(`  ${String(i + 1).padStart(2)}/${mau.length} ${m.id.padEnd(28)} ${String(kq.status).padEnd(8)} ${String(kq.ms).padStart(6)} ms  ai=${aiDaChay}`);
  }

  const hopLe = luot.filter((l) => l.status === 200);
  const ketQua = {
    thoiDiem: new Date().toISOString(),
    mayChu: URL_GOC,
    doTu: 'máy chạy script (ghi rõ nơi đo khi trích số này)',
    model: sucKhoe.than?.model ?? null,
    noiChay: sucKhoe.than?.noiChay ?? null,
    tranChoMs: sucKhoe.than?.tranChoMs ?? null,
    luotDanhThucMs: danhThuc.ms,
    soLuotGui: luot.length,
    soLuotHong: luot.length - hopLe.length,
    coAi: thongKe(hopLe.filter((l) => l.aiDaChay === true).map((l) => l.ms)),
    khongAi: thongKe(hopLe.filter((l) => l.aiDaChay === false).map((l) => l.ms)),
    luot,
  };

  console.log('\nCó AI     :', ketQua.coAi);
  console.log('Không AI  :', ketQua.khongAi);
  console.log('Lượt hỏng :', ketQua.soLuotHong, '· model máy chủ báo:', ketQua.model);

  if (co('--ghi')) {
    fs.writeFileSync(TEP_KET_QUA, `${JSON.stringify(ketQua, null, 2)}\n`);
    console.log(`Đã ghi ${path.relative(process.cwd(), TEP_KET_QUA)}`);
  }
})();
