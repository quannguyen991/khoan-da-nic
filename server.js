'use strict';
/**
 * §2B.2 bước 9 — MÁY CHỦ. Express, cổng 8089.
 *
 * §5.2: `POST /api/phan-tich` là ALIAS của `POST /api/analyze` — CÙNG HANDLER,
 * không nhân đôi logic.
 * §6.7: giao diện KHÔNG BAO GIỜ được trắng màn hình vì lỗi AI. Bắt buộc.
 * §6.9: KHÔNG BAO GIỜ ghi nhật ký OTP, mật khẩu, PIN, nội dung tệp đầy đủ,
 *       số tài khoản đầy đủ — cho cả log máy chủ lẫn error tracking.
 */

require('dotenv').config();

const express = require('express');
const { analyze, toHopDong } = require('./src/analysis/pipeline');
const { trichTinHieu } = require('./src/analysis/llm-extractor');
const { layCauHinh } = require('./src/ai/fable-client');
const { dungSafetyCard } = require('./src/safety-card');
const { dungTrang } = require('./src/safety-card-page');
const { layKeHoachPhucHoi } = require('./src/analysis/recovery-adapters');
const { taoSuKien, timHoSoCoTheGop, dungCauHoiGop, tinHieuCase, baLop, GIAI_DOAN } = require('./src/journey-engine');
const { buocTiepTheo } = require('./src/kich-ban-di-tiep');
const KP = require('./src/khoan-proof');
const TC = require('./src/trusted-circle');
const { taoKho, traNguCanh } = require('./src/intel-radar');
const { moKho } = require('./src/vault-store');
const { canDangNhap } = require('./src/auth');

const CONG = Number(process.env.PORT) || 8089;
const GIOI_HAN_VAN_BAN = 5000;          // §6.10
const GIOI_HAN_TEP = 5 * 1024 * 1024;   // §6.10 — 5MB
const CUA_SO_RATE = 60_000;
const SO_LUOT_TOI_DA = 30;

// Cho phép test chạy mà không gọi ra gateway thật.
const KHONG_GOI_AI = process.env.KHOAN_DA_KHONG_GOI_AI === '1';

const app = express();
app.disable('x-powered-by');   // §6.8 — không rò phiên bản

// §6.8 — security headers.
app.use((req, res, next) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('content-security-policy',
    "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  next();
});

app.use(express.json({ limit: '8mb' }));

// §6.7 — JSON hỏng trả 400 có cấu trúc, KHÔNG 500 trắng trang.
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ maLoi: 'JSON_KHONG_HOP_LE' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ maLoi: 'FILE_TOO_LARGE' });
  }
  return next(err);
});

/**
 * §6.10 — giới hạn tần suất theo thiết bị/phiên.
 *
 * ⚠️ RATE_LIMITED KHÔNG được chặn nút gọi người thân, ngắt cuộc gọi hay luồng
 * phục hồi. Giới hạn tần suất là để kiểm soát chi phí, không phải để chặn người
 * đang gặp nguy.
 *
 * ⚠️ MỖI NHÓM ROUTE MỘT NGĂN ĐẾM RIÊNG — ĐO ĐƯỢC 15/8/2026 KHI DÙNG CHUNG.
 * Trước đây mọi route dùng CHUNG một bộ đếm. Hệ quả: một lượt ghép cặp Khoan
 * Proof (7–8 lượt gọi) ăn hết ngân sách, rồi `/api/analyze` trả 429 — đường
 * phân tích bị chặn bởi hoạt động của một tính năng phụ, đúng thứ dòng trên nói
 * KHÔNG được xảy ra. Test §5.3 bắt được, và nó bắt bằng cách trả 429 chứ không
 * phải 401 — đọc lướt thì tưởng lỗi test.
 *
 * Ngăn riêng ⇒ dù người dùng nghịch ghép cặp bao nhiêu lần, ô kiểm tin nhắn vẫn
 * còn nguyên 30 lượt.
 */
const soLuot = new Map();
const gioiHanTanSuat = (ngan) => function chan(req, res, next) {
  const khoa = `${ngan}|${req.ip || 'khong_ro'}`;
  const gio = Date.now();
  const muc = soLuot.get(khoa) || { dem: 0, moc: gio };
  if (gio - muc.moc > CUA_SO_RATE) { muc.dem = 0; muc.moc = gio; }
  muc.dem += 1;
  soLuot.set(khoa, muc);
  if (muc.dem > SO_LUOT_TOI_DA) return res.status(429).json({ maLoi: 'RATE_LIMITED' });
  return next();
};

const chanPhanTich = gioiHanTanSuat('phan_tich');
const chanProof = gioiHanTanSuat('proof');
const chanDoc = gioiHanTanSuat('doc');
const chanVuViec = gioiHanTanSuat('vu_viec');

/**
 * HANDLER DUY NHẤT cho cả hai route.
 * Trả về ĐÚNG bảy trường của §HĐ — không rò trường nội bộ ra ngoài.
 *
 * ⚠️ CHỈ RÚT `vanBan` VÀ `anh`. KHÔNG trải `...req.body`.
 *
 * §HĐ nói rõ thân yêu cầu chỉ có hai trường đó. Mọi trường khác người gọi gửi
 * kèm đều bị bỏ, đặc biệt là `verifiedChannel` / `verifiedRelationship` — hai
 * lá cờ DUY NHẤT có thể hạ mức. `/api/analyze` nằm trong `KHONG_CAN_DANG_NHAP`
 * nên không có danh tính nào biện minh cho chúng; xem chú thích dài ở
 * `analyze()` trong src/analysis/pipeline.js.
 *
 * ⚠️ Khoan Proof KHÔNG nối vào đây bằng cách đọc thêm trường từ `req.body`.
 * Nó đọc bản ghi chữ ký từ kho của máy chủ rồi truyền qua THAM SỐ THỨ HAI của
 * `analyze()`. Hàng rào: test/co-xac-minh-khong-tu-khai.test.js.
 */
async function xuLyPhanTich(req, res) {
  const { vanBan, anh } = req.body || {};

  // §6.10 — giới hạn kích thước, báo lỗi rõ, KHÔNG âm thầm cắt.
  if (typeof anh === 'string' && anh.length > GIOI_HAN_TEP) {
    return res.status(413).json({ maLoi: 'FILE_TOO_LARGE' });
  }
  if (typeof vanBan === 'string' && vanBan.length > GIOI_HAN_VAN_BAN) {
    // §6.8 — KHÔNG phản chiếu nội dung người dùng vào phản hồi.
    return res.status(400).json({ maLoi: 'INPUT_TOO_LONG', toiDa: GIOI_HAN_VAN_BAN });
  }
  const coVanBan = typeof vanBan === 'string' && vanBan.trim().length > 0;
  if (!coVanBan && !anh) {
    return res.status(400).json({ maLoi: 'THIEU_DAU_VAO' });
  }

  /**
   * §6.10 — BỘ LUẬT CHẠY TRƯỚC, xử lý các ca hiển nhiên mà KHÔNG cần gọi AI.
   * §6.10 (8.13): "Có direct critical signal, hoặc điểm đã ≥45 từ tín hiệu chắc
   * chắn ⇒ KHÔNG hỏi thêm trước khi cảnh báo. Can thiệp trước."
   *
   * Đây vừa là kiểm soát chi phí, vừa là chuyện an toàn: bắt người đang bị kẻ
   * lừa đảo thúc trên điện thoại ngồi chờ gateway là đánh đổi sai. 60 giây đã
   * mất thì không lấy lại được.
   */
  const soBo = analyze({ vanBan: coVanBan ? vanBan : '', anh });
  if (soBo.overrides.length > 0) {
    return res.json(toHopDong(soBo));
  }

  // §6.1 bước 6 — gọi lớp trích tín hiệu. Hỏng thì rơi về bộ luật, KHÔNG sập.
  let llmSignals = [];
  let aiError = null;
  const epLoi = KHONG_GOI_AI ? req.body?._epLoiAi : null;

  if (epLoi) {
    aiError = epLoi;
  } else if (!KHONG_GOI_AI && layCauHinh().daCauHinh && coVanBan) {
    const kq = await trichTinHieu(vanBan);
    llmSignals = kq.signals;
    aiError = kq.loi;
    if (kq.loi) {
      // §6.7 — lỗi vứt mất nguyên nhân là sự cố không chẩn đoán được.
      // Chỉ vào log, và KHÔNG kèm nội dung người dùng (§6.9).
      console.error('[ai]', kq.loi, kq.chiTiet?.providerStatus || '',
        kq.chiTiet?.providerMessage || '');
    }
  } else {
    aiError = 'AI_NOT_CONFIGURED';
  }

  const envelope = analyze({ vanBan: coVanBan ? vanBan : '', anh, llmSignals, aiError });
  return res.json(toHopDong(envelope));
}

app.post('/api/analyze', chanPhanTich, xuLyPhanTich);
app.post('/api/phan-tich', chanPhanTich, xuLyPhanTich);   // §5.2 — alias, cùng handler

/**
 * ─────────────────── KHOAN PROOF ───────────────────
 *
 * ⚠️ TẤT CẢ /api/proof/* ĐỀU CẦN ĐĂNG NHẬP — và KHÔNG được thêm vào
 * KHONG_CAN_DANG_NHAP. Ngược lại, /api/analyze TUYỆT ĐỐI KHÔNG được bắt đăng
 * nhập (§5.3, §6.9): rút mạng, chưa đăng nhập, app vẫn phải phân tích được bằng
 * tầng luật.
 *
 * ⚠️ DANH TÍNH LẤY TỪ TOKEN MÁY CHỦ CẤP, không từ header người gọi tự khai.
 * Cùng bài học với `verifiedChannel`/`verifiedRelationship`.
 */
function canPhien(req, res, next) {
  KP.docPhien(req.headers.authorization)
    .then((taiKhoanId) => {
      if (!taiKhoanId) return res.status(401).json({ maLoi: 'CHUA_DANG_NHAP' });
      req.taiKhoanId = taiKhoanId;
      return next();
    })
    .catch(() => res.status(401).json({ maLoi: 'CHUA_DANG_NHAP' }));
}

/** Bọc handler async, đổi LoiProof thành mã lỗi sạch. §6.8: không rò nội bộ. */
const proof = (fn) => async (req, res) => {
  try {
    return res.json(await fn(req));
  } catch (e) {
    if (e instanceof KP.LoiProof) {
      // Nguyên nhân gốc CHỈ vào log (§6.7 + §6.9) — không đưa ra phản hồi.
      if (e.chiTiet) console.error('[proof]', e.ma, e.chiTiet);
      return res.status(e.http).json({ maLoi: e.ma });
    }
    console.error('[proof]', e?.message);
    return res.status(500).json({ maLoi: 'LOI_MAY_CHU' });
  }
};

/**
 * ⚠️ ĐƯỜNG CẤP PHIÊN CHO DEMO. Mặc định ĐÓNG (404), chỉ mở khi
 * `KHOAN_DA_PHIEN_DEMO=1`. Đây CHƯA phải hệ đăng nhập: chưa có mật khẩu, chưa
 * có email, chưa có khôi phục tài khoản. Đừng gọi nó là đăng nhập trên slide.
 */
app.post('/api/proof/phien-demo', chanProof,
  proof((req) => KP.capPhienDemo(req.body?.taiKhoanId)));

app.post('/api/proof/dang-ky/bat-dau', chanProof, canPhien,
  proof((req) => KP.batDauDangKy(req.taiKhoanId)));

app.post('/api/proof/dang-ky/xac-nhan', chanProof, canPhien,
  proof((req) => KP.xacNhanDangKy(req.taiKhoanId, req.body?.phanHoi)));

app.post('/api/proof/ghep/bat-dau', chanProof, canPhien,
  proof((req) => KP.batDauGhep(req.taiKhoanId)));

app.post('/api/proof/ghep/xac-nhan', chanProof, canPhien,
  proof((req) => KP.xacNhanGhep(req.taiKhoanId, req.body?.ma)));

/** §9.8 — chủ tài khoản thu hồi bất cứ lúc nào, KHÔNG cần người con đồng ý. */
app.post('/api/proof/thu-hoi', chanProof, canPhien,
  proof((req) => KP.thuHoiGhep(req.taiKhoanId, req.body?.thanhVienId)));

/**
 * §16.1 — KỊCH BẢN ĐI TIẾP. Dự báo các bước kế tiếp của một họ lừa đảo.
 *
 * ⚠️ KHÔNG THÊM TRƯỜNG NÀO VÀO PHẢN HỒI POST /api/analyze.
 * Frontend đã cầm sẵn `hoKichBan` từ §HĐ, nó tự gọi tiếp. Không đàm phán lại
 * hợp đồng chỉ để tiết kiệm một lượt gọi.
 *
 * ⚠️ THUẦN ĐỌC. Route này KHÔNG nhận nội dung người dùng — chỉ hai mã enum trên
 * URL. Không ghi gì, không gọi AI, không chạm decision-engine. Mã lạ ⇒ mảng
 * rỗng, không phải lỗi: người dùng gõ sai URL cũng không được thấy màn đỏ.
 *
 * ⚠️ §4.2 — hạng mục này nằm SAU decision-engine và CHỈ ĐỂ HIỂN THỊ. Nó không
 * bao giờ được đụng vào `nhan` hay điểm số. Hàng rào:
 * test/kich-ban-khong-ha-muc.test.js chạy 445 mẫu hai lượt.
 */
app.get('/api/kich-ban/:hoKichBan', chanDoc, (req, res) => {
  const { hoKichBan } = req.params;
  // Thiếu `giaiDoan` ⇒ coi như mới bị tiếp cận: trả về từ bước sớm nhất. Đây là
  // lựa chọn AN TOÀN — thà dự báo thừa một bước đã qua còn hơn giấu bước sắp tới.
  const giaiDoan = typeof req.query.giaiDoan === 'string' && req.query.giaiDoan
    ? req.query.giaiDoan : GIAI_DOAN[0];

  return res.json({
    hoKichBan,
    giaiDoan,
    buoc: buocTiepTheo(hoKichBan, giaiDoan),
  });
});

/**
 * §6.11 — BỘ NHỚ VỤ VIỆC.
 *
 * ⚠️ §6.9 — máy chủ KHÔNG lưu nội dung thô. Sự kiện chỉ mang THỰC THỂ ĐÃ TRÍCH
 * (số điện thoại, tên miền, tổ chức bị giả danh) — đủ để ghép hồ sơ, không đủ
 * để dựng lại tin nhắn.
 *
 * ⚠️ §6.11 — route này KHÔNG TỰ GỘP. Nó trả về CÂU HỎI để người dùng quyết.
 */
app.post('/api/vu-viec/ung-vien', chanVuViec, async (req, res) => {
  const { vanBan, kenh, thoiDiem, hoSoDangMo } = req.body || {};
  if (typeof vanBan !== 'string' || !vanBan.trim()) {
    return res.status(400).json({ maLoi: 'THIEU_DAU_VAO' });
  }
  const moc = Number.isFinite(thoiDiem) ? thoiDiem : Date.now();
  const env = analyze({ vanBan });
  const sk = taoSuKien({ vanBan, envelope: env, kenh, thoiDiem: moc });
  const ungVien = timHoSoCoTheGop(sk, Array.isArray(hoSoDangMo) ? hoSoDangMo : [], moc);

  return res.json({
    // Thực thể đã trích — KHÔNG có nội dung thô ở đây.
    suKien: { kenh: sk.kenh ?? null, giaiDoan: sk.giaiDoan, thucThe: sk.thucThe },
    cauHoiGop: dungCauHoiGop(ungVien),
    baLop: baLop(ungVien?.hoSo ?? null, env),
  });
});

/**
 * Phụ lục A.8 — tín hiệu CASE_* CHỈ được tính SAU KHI người dùng xác nhận gộp.
 * Nên đây là route RIÊNG, và nó đòi cờ xác nhận rõ ràng.
 */
app.post('/api/vu-viec/gop', chanVuViec, async (req, res) => {
  const { vanBan, kenh, thoiDiem, hoSo, daXacNhanGop } = req.body || {};
  if (daXacNhanGop !== true) {
    return res.status(400).json({ maLoi: 'CHUA_XAC_NHAN_GOP' });
  }
  if (typeof vanBan !== 'string' || !vanBan.trim()) {
    return res.status(400).json({ maLoi: 'THIEU_DAU_VAO' });
  }
  const moc = Number.isFinite(thoiDiem) ? thoiDiem : Date.now();
  const env0 = analyze({ vanBan });
  const sk = taoSuKien({ vanBan, envelope: env0, kenh, thoiDiem: moc });
  const tinHieu = tinHieuCase(hoSo, sk, { daXacNhanGop: true });

  // Tín hiệu CASE_* đi qua ĐÚNG bộ luật như mọi tín hiệu khác.
  const env = analyze({ vanBan, llmSignals: tinHieu });
  return res.json({ ...toHopDong(env), tinHieuVuViec: tinHieu.map((t) => t.id) });
});

/**
 * §2B.5 · §9.6 — KẾ HOẠCH PHỤC HỒI.
 * Không cần đăng nhập: người vừa mất tiền mà gặp màn đăng nhập thì họ đóng app.
 */
app.get('/api/ke-hoach-phuc-hoi', (req, res) => {
  res.json(layKeHoachPhucHoi(req.query.nuoc));
});

/** Ra-đa: trả NGỮ CẢNH. §4.2 — không đụng vào mức rủi ro. */
const khoIntel = taoKho();
app.post('/api/ra-da', chanDoc, (req, res) => {
  const { vanBan } = req.body || {};
  if (typeof vanBan !== 'string' || !vanBan.trim()) {
    return res.status(400).json({ maLoi: 'THIEU_DAU_VAO' });
  }
  res.json(traNguCanh(khoIntel, analyze({ vanBan })));
});

/**
 * §9.4 — CẢNH BÁO NGƯỜI THÂN.
 * ⚠️ Trả về TRẠNG THÁI GIAO NHẬN TRUNG THỰC. Endpoint trả thành công KHÔNG
 * đồng nghĩa người thân đã thấy, và tuyệt đối không có "đã đọc và hiểu" (§11).
 */
/**
 * ⚠️ KHÔNG CÓ GIỚI HẠN TẦN SUẤT Ở ĐÂY, VÀ ĐÓ LÀ CHỦ Ý.
 *
 * §6.10 ghi thẳng: "RATE_LIMITED KHÔNG được chặn nút gọi người thân." Route
 * này TỪNG có `gioiHanTanSuat` — tức là bấm quá 30 lần trong một phút thì nút
 * báo cho con cháu ngừng hoạt động, đúng lúc người ta đang hoảng và bấm nhiều.
 * Tệ nhất có thể xảy ra khi bỏ giới hạn: người dùng làm phiền chính gia đình
 * mình. Tệ nhất khi giữ giới hạn: không ai trong nhà biết bác đang bị lừa.
 */
app.post('/api/canh-bao-nguoi-than', (req, res) => {
  const { vongTron, vanBan, soTien, huyLanNay, thoiDiem } = req.body || {};
  if (!vongTron || typeof vongTron !== 'object') {
    return res.status(400).json({ maLoi: 'THIEU_VONG_TRON' });
  }
  const env = analyze({ vanBan: typeof vanBan === 'string' ? vanBan : '' });
  const quyet = TC.nenTuDongCanhBao(vongTron, { canThiep: env.canThiep, huyLanNay: huyLanNay === true });
  if (!quyet.gui) return res.json({ daGui: false, lyDo: quyet.lyDo });

  const payload = TC.dungPayloadCanhBao(vongTron, {
    envelope: env, soTien, thoiDiem: Number.isFinite(thoiDiem) ? thoiDiem : Date.now(),
  });
  // Chưa có hạ tầng push thật ⇒ NÓI THẬT là không xác nhận được, không giả vờ.
  return res.json({
    daGui: true,
    nguoiNhanId: quyet.nguoiNhanId,
    payload,
    trangThai: TC.trangThaiGiaoNhan({ endpointOk: false, coSuKienMo: false }),
  });
});

/**
 * §5.3 — /transparency dựng HTML ở máy chủ, KHÔNG CẦN JavaScript phía trình duyệt.
 * §11 — chưa đo thì hiện "mục tiêu — chưa đo", không điền số mục tiêu vào cho đẹp.
 */
app.get('/transparency', (req, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.send(dungTrang());
});
app.get('/api/safety-card', (req, res) => res.json(dungSafetyCard()));

app.get('/api/suc-khoe', (req, res) => {
  const c = layCauHinh();
  res.json({
    ok: true,
    // §11 — nói thật AI có cấu hình hay không. KHÔNG lộ khoá, không lộ base URL.
    aiCauHinh: c.daCauHinh && !KHONG_GOI_AI,
    model: c.daCauHinh ? c.model : null,
  });
});

// §6.7 — mọi lỗi còn lại vẫn ra JSON có cấu trúc, không bao giờ trắng trang.
app.use((err, req, res, next) => {   // eslint-disable-line no-unused-vars
  console.error('[server]', err?.name, err?.message);
  res.status(500).json({ maLoi: 'LOI_MAY_CHU' });
});

function taoServer(cong = CONG) {
  return app.listen(cong, () => console.log(`Khoan Đã — máy chủ chạy ở cổng ${cong}`));
}

if (require.main === module) taoServer();

module.exports = { app, taoServer, CONG };
