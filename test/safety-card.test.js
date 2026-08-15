'use strict';
/**
 * §11 — BỀ MẶT TRUNG THỰC. Hai câu §11 cấm tuyệt đối đều rất dễ phạm ở đây:
 *   - gán số liệu eval cho MODEL CHƯA HỀ ĐƯỢC GỌI
 *   - gọi bản dựng là "ĐÃ ĐO" khi mới chỉ là MỤC TIÊU
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { dungSafetyCard, suThatKienTruc, MUC_TIEU } = require('../src/safety-card');
const { dungTrang } = require('../src/safety-card-page');

const tam = (ten) => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kd-')), ten);
const ghi = (o) => { const p = tam('latest.json'); fs.writeFileSync(p, JSON.stringify(o)); return p; };

const BAO_MAU = (ghiDe = {}) => ({
  metadata: {
    commitSha: 'abc1234', datasetVersion: 'ff00ff00', datasetSize: 445,
    aiDaChay: true, model: 'claude-sonnet-5', cheDo: 'bo_luat_va_ai', ...ghiDe.metadata,
  },
  chiSo: { highRiskFP: 0.02, fpTrenLatChat: 0, confusion: {}, ...ghiDe.chiSo },
  parity: {
    theoNgonNgu: { vi: { dangerousRecall: 0.96 }, en: { dangerousRecall: 0.95 } },
    lechRecall: 0.01, ...ghiDe.parity,
  },
  mauThat: { coMauThat: false, ...ghiDe.mauThat },
  tranHong: { vuotTran: false, ...ghiDe.tranHong },
});

// ─────────── §11 — chưa đo thì phải NÓI là chưa đo ───────────

test('§11 — không có latest.json ⇒ TOÀN BỘ về "mục tiêu — chưa đo"', () => {
  const the = dungSafetyCard(path.join(os.tmpdir(), 'khong-he-ton-tai-12345.json'));
  assert.strictEqual(the.daDo, false);
  assert.strictEqual(the.nguonDo, null);
  for (const c of the.chiSo) {
    assert.strictEqual(c.trangThai, 'muc_tieu_chua_do');
    assert.strictEqual(c.giaTri, null, 'chưa đo thì giá trị phải RỖNG, không phải số mục tiêu');
  }
  assert.ok(the.canhBao.includes('chua_co_phep_do_nao'));
});

test('§11 — xoá latest.json là HÀNH VI ĐÚNG, không phải lỗi cần vá', () => {
  const p = ghi(BAO_MAU());
  assert.strictEqual(dungSafetyCard(p).daDo, true);
  fs.unlinkSync(p);
  assert.strictEqual(dungSafetyCard(p).daDo, false, 'phải tự về trạng thái chưa đo');
});

test('§2B.6 — báo cáo THIẾU METADATA bị coi như chưa đo', () => {
  assert.strictEqual(dungSafetyCard(ghi(BAO_MAU({ metadata: { commitSha: null } }))).daDo, false);
  assert.strictEqual(dungSafetyCard(ghi(BAO_MAU({ metadata: { datasetVersion: null } }))).daDo, false);
});

test('§11 — JSON hỏng không làm sập, chỉ về trạng thái chưa đo', () => {
  const p = tam('latest.json');
  fs.writeFileSync(p, '{hỏng');
  assert.strictEqual(dungSafetyCard(p).daDo, false);
});

// ─────────── §11 — model chưa gọi thì để RỖNG ───────────

test('§11 — số đo khi KHÔNG có AI thì trường model phải RỖNG', () => {
  const the = dungSafetyCard(ghi(BAO_MAU({
    metadata: { aiDaChay: false, model: 'claude-sonnet-5', cheDo: 'chi_bo_luat' },
  })));
  assert.strictEqual(the.nguonDo.model, null,
    'model đang cấu hình cho máy chủ KHÁC model đã tạo ra con số');
  assert.ok(the.canhBao.includes('so_lieu_do_khi_khong_co_ai'));
});

test('§11 — có AI thì mới được ghi tên model', () => {
  const the = dungSafetyCard(ghi(BAO_MAU()));
  assert.strictEqual(the.nguonDo.model, 'claude-sonnet-5');
});

// ─────────── §6.14 · §2B.6 — cảnh báo bắt buộc ───────────

test('§6.14 — lệch parity quá 3 điểm phải sinh cảnh báo', () => {
  const the = dungSafetyCard(ghi(BAO_MAU({ parity: { lechRecall: 0.156 } })));
  assert.ok(the.canhBao.includes('lech_parity_vuot_3_diem'),
    'bản trước có tiếng Việt tụt 15,6 điểm mà mười ngưỡng vẫn xanh');
});

test('§2B.6 — không có mẫu thật phải sinh cảnh báo', () => {
  assert.ok(dungSafetyCard(ghi(BAO_MAU())).canhBao.includes('khong_co_mau_that'));
});

test('§4.3 — vượt trần lượt hỏng phải sinh cảnh báo', () => {
  const the = dungSafetyCard(ghi(BAO_MAU({ tranHong: { vuotTran: true } })));
  assert.ok(the.canhBao.includes('vuot_tran_luot_hong'));
});

// ─────────── Sự thật kiến trúc ───────────

test('Sự thật kiến trúc khớp code, không phải số chép tay', () => {
  const k = suThatKienTruc();
  assert.strictEqual(k.soTinHieu, 58);
  assert.strictEqual(k.soCriticalOverride, 10);
  assert.strictEqual(k.soToHopCongHuong, 10);
  assert.strictEqual(k.thangDiem, '0–69');
  assert.strictEqual(k.nguong, '20/45');
  assert.strictEqual(k.aiQuyetDinhMuc, false);
});

// ─────────── §5.3 — trang chạy không cần JavaScript ───────────

test('§5.3 — /transparency KHÔNG chứa thẻ script nào', () => {
  const html = dungTrang();
  assert.ok(!/<script/i.test(html), 'bề mặt trung thực không được phụ thuộc JS');
  assert.ok(html.startsWith('<!doctype html>'));
});

test('§11 — chưa đo thì CỘT "Đã đo" ghi "Mục tiêu — chưa đo", không phải một con số', () => {
  const html = dungTrang(dungSafetyCard(path.join(os.tmpdir(), 'khong-ton-tai-999.json')));

  const hang = html.match(/<tr class="chua-do">[\s\S]*?<\/tr>/g) || [];
  assert.ok(hang.length >= 6, 'phải có đủ hàng chỉ số');
  for (const h of hang) {
    const o = h.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
    assert.ok(o[1].includes('Mục tiêu — chưa đo'), `cột "Đã đo" sai: ${o[1]}`);
    assert.ok(!/<strong>/.test(h), 'chưa đo thì không được in số đậm như kết quả');
  }

  // Số mục tiêu ĐƯỢC PHÉP hiện, nhưng chỉ ở cột "Mục tiêu" và luôn kèm ≥ / ≤.
  for (const h of hang) {
    const o = h.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
    if (/[0-9]+\.[0-9]%/.test(o[0])) assert.match(o[0], /[≥≤]/);
  }
});

test('§11 — không có nhãn "An toàn"/"Safe", không tuyên bố WCAG compliant', () => {
  const html = dungTrang();
  assert.ok(!/\bWCAG[^<]{0,20}compliant/i.test(html));
  assert.ok(html.includes('mục tiêu'), 'phải nói là MỤC TIÊU WCAG 2.2 AA');
});

test('§6.8 — dữ liệu đưa vào trang được escape, không chèn HTML được', () => {
  const html = dungTrang(dungSafetyCard(ghi(BAO_MAU({
    metadata: { commitSha: '<script>alert(1)</script>' },
  }))));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('Mọi mục tiêu đều ghi rõ lấy từ điều nào của tài liệu', () => {
  for (const m of MUC_TIEU) assert.match(m.nguon, /^§/);
});
