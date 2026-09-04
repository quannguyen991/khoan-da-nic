'use strict';
/**
 * BỘ MÁY PHÁT HIỆN LỪA ĐẢO — CỬA VÀO DUY NHẤT.
 *
 * ══════════════ KIẾN TRÚC BA TẦNG THEO NGÂN SÁCH ĐỘ TRỄ ══════════════
 *
 *   Tầng 0  luật cục bộ            < 50ms   offline hoàn toàn
 *   Tầng 1  phân tích URL, thực thể < 200ms  offline hoàn toàn
 *   Tầng 2  đối chiếu máy chủ       1–3s     BẤT ĐỒNG BỘ, KHÔNG CHẶN tầng 0
 *
 * NGUYÊN TẮC BẤT DI BẤT DỊCH: `analyze()` là ĐỒNG BỘ. Nó chạy tầng 0 và tầng 1
 * rồi trả về ngay. Không có `await` nào trong đường này, và đó là chủ đích —
 * một hàm async là một cánh cửa mở sẵn để ai đó nhét lời gọi mạng vào giữa
 * đường phát hiện, rồi cảnh báo im lặng không tới khi máy mất sóng.
 *
 * Tầng 2 nằm ở `tang-2.js`, là hàm RIÊNG, và nó chỉ NÂNG nhãn.
 *
 * ══════════════ VÌ SAO KHÔNG NẰM Ở `src/detect/` ══════════════
 * Bản đặc tả yêu cầu đặt module ở `src/detect/`, thuần TypeScript. Không làm
 * được, và lý do đã có test canh:
 *
 *   `test/bo-luat-khong-duoc-lech.test.js` — "src/ là thư mục FRONTEND. Mã
 *   backend viết bằng CommonJS đặt ở backend/src/. Trộn hai thứ vào một chỗ
 *   chính là cách bộ luật bị nhân bản lần trước."
 *
 * Lần nhân bản đó làm recall tiếng Việt của bản đang ship tụt từ 75,3% xuống
 * 32,9% trong khi mọi số đo vẫn xanh, vì bộ eval đo cây kia. §12 nói khi ảnh
 * thiết kế mâu thuẫn với hợp đồng thì HỢP ĐỒNG THẮNG, và ghi lại conflict thay
 * vì âm thầm làm theo. Đây là chỗ ghi.
 *
 * Yêu cầu THẬT phía sau chữ "src/detect/" vẫn được giữ nguyên vẹn: module này
 * KHÔNG phụ thuộc React, KHÔNG phụ thuộc Android, KHÔNG phụ thuộc Express, chạy
 * được trong Node để test, và dùng chung được cho cả app Android lẫn web.
 */

const { boLuat } = require('./bo-luat-store');
const { chuanHoaTin } = require('./chuan-hoa');
const { phanTichTang1 } = require('./tang-1');
const { chayTang0, nangNhan, che } = require('./tang-0');
const { dungGiaiThich } = require('./giai-thich');

const { decide } = require('../analysis/decision-engine');
const { evaluateOverrides } = require('../analysis/critical-overrides');
const { buildContext } = require('../analysis/context-builder');
const { directPrecheck } = require('../analysis/direct-precheck');
const { phanTichUrl } = require('../analysis/url-analyzer');
const { chonMuc } = require('../intervention-ladder');
const { nhanHopDong } = require('../risk-labels');

/** §HĐ — nhãn của bộ luật (`HIGH`…) sang nhãn hợp đồng (`CAO`…). */
const NHAN_TU_RISK = (riskLabel) => nhanHopDong(riskLabel);

/** Nguồn hợp lệ. Nguồn lạ KHÔNG bị từ chối — bị ghi là `khac` và vẫn phân tích. */
const NGUON = Object.freeze([
  'sms', 'zalo', 'messenger', 'thong_bao', 'nguoi_dung_dan', 'cai_dat_app', 'khac',
]);

/** Đồng hồ đơn điệu nếu có; `Date.now()` nếu không (Android WebView cũ). */
const dongHo = () => (typeof performance === 'object' && typeof performance.now === 'function'
  ? performance.now()
  : Date.now());

/**
 * @typedef {object} TinNhanDen
 * @property {'sms'|'zalo'|'messenger'|'thong_bao'|'nguoi_dung_dan'} nguon
 * @property {string} nguoiGui
 * @property {string} noiDung
 * @property {number} thoiDiem
 */

/**
 * @param {TinNhanDen} tin
 * @param {object} tuyChon  { danhBa: string[], ngonNgu: 'vi'|'en', doTinCayDauVao: number }
 * @returns {object} KetQuaPhanTich
 */
function analyze(tin = {}, tuyChon = {}) {
  const batDau = dongHo();
  const luat = boLuat();

  const noiDung = typeof tin.noiDung === 'string' ? tin.noiDung : '';
  const nguon = NGUON.includes(tin.nguon) ? tin.nguon : 'khac';

  const ban = chuanHoaTin(noiDung, luat);
  const tang1 = phanTichTang1(ban, luat);

  /**
   * §4.3 — "KHÔNG ĐỌC ĐƯỢC" ≠ "ĐÃ ĐỌC, KHÔNG THẤY GÌ".
   * Ba ca ở đây, và cả ba đều KHÔNG được ra "chưa thấy dấu hiệu rủi ro":
   *   · nội dung rỗng (thông báo bị cắt cụt, ảnh OCR hỏng)
   *   · tầng gọi tự khai độ tin cậy thấp (bản chép ghi âm, OCR)
   *   · URL có mà không phân tích nổi
   */
  const chuaKiem = [];
  if (!noiDung.trim()) chuaKiem.push('thong_bao_khong_co_noi_dung');
  if (typeof tuyChon.doTinCayDauVao === 'number' && tuyChon.doTinCayDauVao < 0.5) {
    chuaKiem.push('chi_doc_duoc_mot_phan_tin');
  }
  if (tang1.urlKhongDocDuoc.length > 0) chuaKiem.push('khong_mo_duoc_link');

  const danhBa = Array.isArray(tuyChon.danhBa) ? tuyChon.danhBa : [];
  const quen = danhBa.some((s) => chuanSoSanh(s) === chuanSoSanh(tin.nguoiGui));

  /**
   * ══════ DÙNG LẠI BỘ DÒ CANONICAL, KHÔNG VIẾT BẢN THỨ HAI ══════
   *
   * `directPrecheck` + `phanTichUrl` là hai bộ dò DETERMINISTIC đã có sẵn của
   * repo: hàm thuần, không mạng, không AI, chạy trên locale pack vi-VN/en-US.
   * Chúng bắt được cả 58 tín hiệu Phụ lục A — `FIN_SAFE_ACCOUNT`,
   * `MAN_FEAR_THREAT`, `CRED_OTP_SHARE`, `DEV_REMOTE_CONTROL_APP`… — thứ mà
   * hai mươi luật R1–R20 không bao giờ chép lại hết được.
   *
   * Đây chính là điều §4.2 đòi: một bộ luật, một bộ tín hiệu. R1–R20 KHÔNG thay
   * thế chúng, chỉ THÊM những mẫu mà luồng "thông báo đến" cần và luồng "người
   * dùng dán nội dung" không có (link ngoài allowlist, tên miền nhái, người gửi
   * là số di động xưng danh tổ chức).
   *
   * Chi phí: `buildContext` cắt câu và sinh biến thể OCR. Đo trong
   * `test/detect-hieu-nang.test.js` — vẫn nằm dưới ngân sách 200ms của tầng 0+1.
   */
  const ctx = buildContext(ban.goCheUrl, { sourceId: nguon });
  const tinHieuGoc = [
    ...directPrecheck(ctx, {}),
    ...phanTichUrl(ban.goCheUrl),
  ];
  const idGoc = [...new Set(tinHieuGoc.filter((s) => s.state === 'present').map((s) => s.id))];

  const t0 = chayTang0({ ban, tang1, luat, tin, quen, tinHieuGoc: idGoc });

  /**
   * ⚠️ BỘ LUẬT DUY NHẤT CHẤM ĐIỂM. Tầng 0 chỉ đưa tín hiệu vào.
   * Không có phép cộng điểm nào trong `backend/src/detect/`, và đừng thêm.
   */
  const tatCaTinHieu = [...new Set([...idGoc, ...t0.tinHieu])];
  const kq = decide(tatCaTinHieu.map((id) => ({ id, state: 'present' })));
  const overrides = evaluateOverrides(tatCaTinHieu, {});

  /**
   * ══════ HỢP NHẤT NHÃN — CHỈ NÂNG, KHÔNG BAO GIỜ HẠ (§4.2) ══════
   * Ba nguồn, lấy MAX:
   *   · bộ luật duy nhất  (`decide` → điểm → nhãn)
   *   · critical override (nổ ⇒ CAO, và ⇒ PROTECTED_CRITICAL)
   *   · sàn của tầng 0    (luật R1–R20 khai mức tối thiểu của mình)
   * Cộng thêm sàn §4.3: không đọc được thì không được nói "chưa thấy dấu hiệu".
   */
  let nhan = NHAN_TU_RISK(kq.riskLabel);
  if (overrides.length > 0) nhan = nangNhan(nhan, 'CAO');
  nhan = nangNhan(nhan, t0.san);
  if (chuaKiem.length > 0) nhan = nangNhan(nhan, 'NGHI_NGO');

  /**
   * ══════ SÀN CHO `canThiep` — VÀ VÌ SAO NÓ PHẢI CÓ ══════
   *
   * §HĐ luật 4: `canThiep` quyết định MÀN HÌNH, `nhan` quyết định NHÃN, và
   * không suy cái này từ cái kia. Đúng — nhưng cả hai đều phải nghe cùng một
   * sàn, nếu không chúng sẽ nói ngược nhau.
   *
   * ĐO ĐƯỢC 4/9/2026, và đây là lỗ hổng im lặng nhất của cả tính năng:
   *
   *   "Thông báo phạt nguội, nộp tại csgt-tracuu.top trước 24h."
   *   → nhan CAO (sàn của luật R1) · điểm 26 · canThiep VERIFY_PATH
   *
   * `nenTuDongCanhBao()` của `trusted-circle.js` lấy `canThiep` làm cổng
   * (`MUC_CHO_PHEP_AUTO_ALERT` = PAUSE_60S / PROTECTED_CRITICAL / RECOVERY).
   * VERIFY_PATH nằm ngoài cổng, nên NGƯỜI THÂN KHÔNG BAO GIỜ ĐƯỢC BÁO về một
   * tin đã bị gắn nhãn "Nguy hiểm cao". Màn hình đỏ, mà không ai được gọi.
   *
   * Sàn này KHÔNG suy từ `nhan`. Nó đọc thẳng `t0.san` — mức tối thiểu mà CHÍNH
   * LUẬT đã khai ("tin này đáng để dừng lại"), cùng nguồn đã nâng `nhan`. Hai
   * đường song song từ một nguyên nhân, đúng hình dạng `pipeline.js` đang dùng
   * cho critical override (nâng `riskLabel` lên HIGH, và `chonMuc` riêng rẽ đưa
   * `canThiep` lên PROTECTED_CRITICAL).
   *
   * ⚠️ CHỈ NÂNG. `PROTECTED_CRITICAL` và `RECOVERY` không bao giờ bị đụng tới.
   */
  const THU_TU_CAN_THIEP = ['TRUST_RECEIPT', 'VERIFY_PATH', 'PAUSE_60S', 'PROTECTED_CRITICAL'];
  const canThiepGoc = chonMuc({ score: kq.score, overrides });
  const sanCanThiep = { CAO: 'PAUSE_60S', NGHI_NGO: 'VERIFY_PATH' }[t0.san] || null;
  let canThiep = canThiepGoc;
  if (sanCanThiep && canThiepGoc !== 'RECOVERY') {
    const a = THU_TU_CAN_THIEP.indexOf(canThiepGoc);
    const b = THU_TU_CAN_THIEP.indexOf(sanCanThiep);
    if (b > a) canThiep = sanCanThiep;
  }

  const giai = dungGiaiThich(t0.khop, {
    ngonNgu: tuyChon.ngonNgu,
    khongDocDuoc: chuaKiem.length > 0,
  });

  return {
    // ── Đúng hình dạng bản đặc tả đòi ────────────────────────────────
    nhan,
    diem: kq.score,
    luatKhopVoi: t0.khop.map((k) => k.ma),
    giaiThich: giai.cau,
    thucThe: {
      urls: tang1.urls.map((u) => u.url),
      soTaiKhoan: tang1.soTaiKhoan,
      soTien: tang1.soTien,
    },
    doTre: Math.round((dongHo() - batDau) * 100) / 100,

    // ── Thêm, để nối được với phần còn lại của hệ thống ───────────────
    maGiaiThich: giai.ma,          // §HĐ luật 2 — mã để frontend tự dịch
    maLyDo: kq.maLyDo,             // tín hiệu canonical, KHÔNG phải câu
    tinHieu: tatCaTinHieu,
    overrides,
    canThiep,
    chuaKiem,
    nguon,
    nguoiGui: che(tin.nguoiGui),   // §6.9 — không giữ số nguyên vẹn
    thoiDiem: Number(tin.thoiDiem) || null,
    phienBanLuat: luat.phienBan,
    tangDaChay: ['tang_0', 'tang_1'],
    chiTietLuat: t0.khop,
    tenMien: tang1.urls.map((u) => u.reg),
  };
}

/** So số điện thoại bỏ khoảng trắng, dấu chấm, và tiền tố +84 / 0. */
function chuanSoSanh(s = '') {
  const t = String(s).replace(/[\s.()-]/g, '');
  return t.replace(/^\+?84/, '0');
}

module.exports = { analyze, NGUON, chuanSoSanh };
