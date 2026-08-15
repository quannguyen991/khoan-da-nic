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
 * ⚠️ RATE_LIMITED KHÔNG được chặn nút gọi người thân, ngắt cuộc gọi hay luồng
 * phục hồi. Giới hạn tần suất là để kiểm soát chi phí, không phải để chặn người
 * đang gặp nguy — nên nó CHỈ áp lên route phân tích.
 */
const soLuot = new Map();
function gioiHanTanSuat(req, res, next) {
  const khoa = req.ip || 'khong_ro';
  const gio = Date.now();
  const muc = soLuot.get(khoa) || { dem: 0, moc: gio };
  if (gio - muc.moc > CUA_SO_RATE) { muc.dem = 0; muc.moc = gio; }
  muc.dem += 1;
  soLuot.set(khoa, muc);
  if (muc.dem > SO_LUOT_TOI_DA) return res.status(429).json({ maLoi: 'RATE_LIMITED' });
  return next();
}

/**
 * HANDLER DUY NHẤT cho cả hai route.
 * Trả về ĐÚNG bảy trường của §HĐ — không rò trường nội bộ ra ngoài.
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

app.post('/api/analyze', gioiHanTanSuat, xuLyPhanTich);
app.post('/api/phan-tich', gioiHanTanSuat, xuLyPhanTich);   // §5.2 — alias, cùng handler

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
