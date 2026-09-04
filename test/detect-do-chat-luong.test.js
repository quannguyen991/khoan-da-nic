'use strict';
/**
 * ĐO CHẤT LƯỢNG BỘ PHÁT HIỆN — BẢNG SỐ, KHÔNG PHẢI CẢM GIÁC.
 *
 * ⚠️ CỔNG CỨNG: precision của nhãn CAO ≥ 0,98.
 *
 * Vì sao đúng con số này, và vì sao nó nghiêm hơn recall: báo động giả ở mức
 * CAO là thứ giết niềm tin nhanh nhất với người cao tuổi. §4.6 nói thẳng — bị
 * kẹt trong màn khẩn cấp vì một báo động giả thì người ta hoảng và GỠ ỨNG DỤNG.
 * Một lần bỏ sót còn cứu được ở lượt sau; một lần gỡ app thì không.
 *
 * Nên: thà gắn NGHI_NGO nhiều còn hơn gắn CAO sai một lần.
 *
 * ⚠️ ĐỪNG "SỬA" TEST NÀY KHI NÓ ĐỎ. Nó đỏ nghĩa là một luật vừa được nới rộng
 * và vừa bắt oan một tin nhắn lành. Sửa luật, hoặc thêm ca vào tập bình thường
 * để mô tả đúng thứ vừa xảy ra — đừng hạ ngưỡng.
 *
 * ⚠️ SỐ IN RA LÀ SỐ ĐO TRÊN TẬP CỐ ĐỊNH NÀY, KHÔNG PHẢI SỐ ĐO NGOÀI ĐỜI.
 * §11 cấm gọi một mục tiêu là "đã đo". 60 mẫu là bộ hồi quy, không phải bộ
 * đánh giá thống kê — đừng trích con số này ra hồ sơ như thể nó là tỷ lệ thật.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/detect');
const { LUAT } = require('../backend/src/detect/tang-0');
const { datLai } = require('../backend/src/detect/bo-luat-store');

const LUA_DAO = require('./fixtures/tin-nhan/lua-dao.json');
const BINH_THUONG = require('./fixtures/tin-nhan/binh-thuong.json');

const THU = ['CHUA_THAY', 'NGHI_NGO', 'CAO'];
const NGUONG_PRECISION_CAO = 0.98;

function chay() {
  datLai();
  const luaDao = LUA_DAO.tin.map((t) => ({ t, r: analyze(t) }));
  const binhThuong = BINH_THUONG.tin.map((t) => ({ t, r: analyze(t) }));
  return { luaDao, binhThuong };
}

function dungBang({ luaDao, binhThuong }) {
  const theoLuat = new Map(LUAT.map((l) => [l.ma, { ma: l.ma, ten: l.ten, lua: 0, lanh: 0 }]));
  for (const { r } of luaDao) for (const m of r.luatKhopVoi) theoLuat.get(m).lua += 1;
  for (const { r } of binhThuong) for (const m of r.luatKhopVoi) theoLuat.get(m).lanh += 1;

  const caoLua = luaDao.filter(({ r }) => r.nhan === 'CAO').length;
  const caoLanh = binhThuong.filter(({ r }) => r.nhan === 'CAO').length;
  const batDuoc = luaDao.filter(({ r }) => r.nhan !== 'CHUA_THAY').length;

  return {
    theoLuat: [...theoLuat.values()],
    caoLua,
    caoLanh,
    batDuoc,
    tongLua: luaDao.length,
    tongLanh: binhThuong.length,
    precisionCao: caoLua + caoLanh === 0 ? 1 : caoLua / (caoLua + caoLanh),
    recallCao: caoLua / luaDao.length,
    recallChung: batDuoc / luaDao.length,
  };
}

function inBang(b) {
  const d = [];
  d.push('');
  d.push('┌──── ĐO BỘ PHÁT HIỆN — tập cố định, không phải số đo ngoài đời ────');
  d.push(`│ tập lừa đảo: ${b.tongLua} tin   ·   tập bình thường: ${b.tongLanh} tin`);
  d.push('├── TỪNG LUẬT ─────────────────────────────────────────────────────');
  d.push('│  mã   khớp/lừa  khớp/lành   tên luật');
  for (const l of b.theoLuat) {
    const canhBao = l.lanh > 0 ? ' ⚠' : '  ';
    d.push(`│ ${l.ma.padEnd(4)} ${String(l.lua).padStart(6)}  ${String(l.lanh).padStart(8)}${canhBao} ${l.ten}`);
  }
  d.push('├── NHÃN CAO ──────────────────────────────────────────────────────');
  d.push(`│  bắt đúng (lừa đảo → CAO) : ${b.caoLua}/${b.tongLua}`);
  d.push(`│  BÁO ĐỎ OAN (lành → CAO)  : ${b.caoLanh}/${b.tongLanh}`);
  d.push(`│  precision CAO            : ${b.precisionCao.toFixed(4)}  (cổng ≥ ${NGUONG_PRECISION_CAO})`);
  d.push(`│  recall CAO               : ${b.recallCao.toFixed(4)}`);
  d.push(`│  recall chung (CAO+NGHI)  : ${b.recallChung.toFixed(4)}`);
  d.push('└──────────────────────────────────────────────────────────────────');
  d.push('');
  // eslint-disable-next-line no-console
  console.log(d.join('\n'));
}

test('BẢNG ĐO — mỗi luật khớp bao nhiêu ca, precision, recall', () => {
  const b = dungBang(chay());
  inBang(b);
  assert.ok(b.theoLuat.length === 10, 'phải có đúng mười luật R1–R10');
});

test('CỔNG CỨNG — precision của nhãn CAO ≥ 0,98 trên tập bình thường', () => {
  const kq = chay();
  const b = dungBang(kq);
  const oan = kq.binhThuong.filter(({ r }) => r.nhan === 'CAO')
    .map(({ t, r }) => `\n    ${t.id} — ${r.luatKhopVoi.join(',')} — ${t.viSao}`);

  assert.ok(
    b.precisionCao >= NGUONG_PRECISION_CAO,
    `precision CAO = ${b.precisionCao.toFixed(4)} < ${NGUONG_PRECISION_CAO}.`
    + `\n  Báo đỏ oan:${oan.join('')}`
    + '\n  ĐỪNG hạ ngưỡng. Siết luật lại, hoặc hạ luật đó xuống NGHI_NGO.',
  );
});

test('KHÔNG tin lành nào được ra CAO', () => {
  // Nói lại cổng trên bằng lời phẳng, để thông báo lỗi chỉ đúng một tin.
  for (const { t, r } of chay().binhThuong) {
    assert.notStrictEqual(
      r.nhan, 'CAO',
      `${t.id} bị báo đỏ oan (${r.luatKhopVoi.join(',')}). Vì sao tin này lành: ${t.viSao}`,
    );
  }
});

test('mỗi tin lành không được vượt trần nhãn đã khai', () => {
  for (const { t, r } of chay().binhThuong) {
    assert.ok(
      THU.indexOf(r.nhan) <= THU.indexOf(t.toiDa),
      `${t.id}: ra ${r.nhan}, trần là ${t.toiDa} (${r.luatKhopVoi.join(',')}). ${t.viSao}`,
    );
  }
});

test('mỗi tin lừa đảo phải đạt ít nhất mức đã khai', () => {
  for (const { t, r } of chay().luaDao) {
    assert.ok(
      THU.indexOf(r.nhan) >= THU.indexOf(t.mongDoiToiThieu),
      `${t.id}: ra ${r.nhan}, cần ít nhất ${t.mongDoiToiThieu}.`
      + `\n  nội dung: ${t.noiDung}`
      + `\n  luật khớp: ${r.luatKhopVoi.join(',') || '(không luật nào)'}`
      + `\n  tín hiệu: ${r.maLyDo.join(',') || '(không tín hiệu nào)'}`,
    );
  }
});

test('mỗi luật phải bắt được ít nhất một ca trong tập lừa đảo', () => {
  // Một luật không bắt được ca nào là luật chết: hoặc mẫu sai, hoặc thiếu ca
  // trong bộ fixture. Cả hai đều phải sửa, không được để im.
  const b = dungBang(chay());
  const chet = b.theoLuat.filter((l) => l.lua === 0).map((l) => l.ma);
  assert.deepStrictEqual(chet, [], `luật không bắt được ca nào: ${chet.join(', ')}`);
});

test('§11 — câu giải thích không được kể ra thứ VẮNG MẶT, không được quy kết cá nhân', () => {
  const { CAU } = require('../backend/src/detect/giai-thich');
  const CAM = [
    /an toàn/i, /\bsafe\b/i,
    /chưa thấy (?:lời|dấu hiệu) (?:đe doạ|đe dọa|nào khác)/i,
    /kẻ lừa đảo là/i, /người này là/i, /this person is/i,
    /bác đã sai/i, /sao bác lại/i,
  ];
  for (const [ma, ban] of Object.entries(CAU)) {
    for (const ngonNgu of ['vi', 'en']) {
      const s = ban[ngonNgu];
      assert.ok(typeof s === 'string' && s.length > 0, `${ma}.${ngonNgu} thiếu`);
      for (const re of CAM) {
        assert.ok(!re.test(s), `${ma}.${ngonNgu} vi phạm §11 (${re}): "${s}"`);
      }
    }
  }
});

test('câu giải thích là MỘT câu, không phải danh sách gạch đầu dòng', () => {
  for (const { r } of chay().luaDao) {
    assert.ok(!r.giaiThich.includes('\n'), `giải thích xuống dòng: ${r.giaiThich}`);
    assert.ok(!/^[-•*]/.test(r.giaiThich.trim()), `giải thích là gạch đầu dòng: ${r.giaiThich}`);
    assert.ok(r.giaiThich.length <= 200, `giải thích quá dài (${r.giaiThich.length}): ${r.giaiThich}`);
    assert.ok(!/\bR\d\b|allowlist|domain|regex|mismatch/i.test(r.giaiThich),
      `giải thích viết kiểu kỹ thuật: ${r.giaiThich}`);
  }
});
