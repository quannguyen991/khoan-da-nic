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

const fs = require('node:fs');
const path = require('node:path');

const express = require('express');
const { analyze, toHopDong } = require('./src/analysis/pipeline');
const { CAU_HOI } = require('./src/bo-hoi-nhanh');
const { trichTinHieu } = require('./src/analysis/llm-extractor');
const { layCauHinh } = require('./src/ai/fable-client');
const { dungSafetyCard } = require('./src/safety-card');
const { dungTrang } = require('./src/safety-card-page');
const { layKeHoachPhucHoi } = require('./src/analysis/recovery-adapters');
const { taoSuKien, timHoSoCoTheGop, dungCauHoiGop, tinHieuCase, baLop, GIAI_DOAN } = require('./src/journey-engine');
const { buocTiepTheo } = require('./src/kich-ban-di-tiep');
const { tinLuaDao } = require('./src/tin-lua-dao');
const TK = require('./src/tai-khoan');
const KP = require('./src/khoan-proof');
const KY = require('./src/khoan-proof-ky');
const VR = require('./src/verified-request');
const TC = require('./src/trusted-circle');
const { taoKho, traNguCanh } = require('./src/intel-radar');
const { moKho } = require('./src/vault-store');
const { canDangNhap } = require('./src/auth');
const {
  layCauHinhVapid, chuanHoaDangKy, chuanHoaDangKyNative, LOAI_DANG_KY,
} = require('./src/push');

const CONG = Number(process.env.PORT) || 8089;
const GIOI_HAN_VAN_BAN = 5000;          // §6.10
const GIOI_HAN_TEP = 5 * 1024 * 1024;   // §6.10 — 5MB
const CUA_SO_RATE = 60_000;
const SO_LUOT_TOI_DA = 30;

// Cho phép test chạy mà không gọi ra gateway thật.
const KHONG_GOI_AI = process.env.KHOAN_DA_KHONG_GOI_AI === '1';

/**
 * LỖI AI GẦN NHẤT — để chẩn đoán được bản đang chạy thật mà không cần vào log.
 *
 * ⚠️ §6.9 — CHỈ MÃ LỖI VÀ MÃ TRẠNG THÁI HTTP. Tuyệt đối không giữ nội dung
 * người dùng, không giữ khoá, không giữ thân yêu cầu. `providerMessage` của nhà
 * cung cấp có thể chứa nguyên văn lời nhắc nên KHÔNG được đưa vào đây — nó chỉ
 * đi vào log máy chủ.
 *
 * Vì sao cần: khi bản công khai trả "Lượt này AI không trả lời được", không có
 * cách nào biết vì khoá sai, hết quota, hay tên model sai — mà ba nguyên nhân đó
 * cần ba cách sửa khác nhau.
 */
let loiAiGanNhat = null;

/** Lượt AI gần nhất CHẠY ĐƯỢC: nhận mấy tín hiệu, loại mấy, vì sao. */
let chanDoanAiGanNhat = null;

const app = express();
app.disable('x-powered-by');   // §6.8 — không rò phiên bản

/**
 * §6.8 — security headers.
 *
 * ⚠️ `worker-src 'self'` khai TƯỜNG MINH vì một số trình duyệt không rơi về
 * `default-src` cho service worker. Đây là làm chặt và làm rõ, KHÔNG phải nới.
 *
 * ⚠️ NHƯNG ĐỪNG TƯỞNG DÒNG NÀY LÀ THUỐC CHỮA. Ghi lại để người sau khỏi mất
 * thời gian: khi service worker không đăng ký được kèm thông báo
 * `An unknown error occurred when fetching the script` — trong khi
 * `fetch('/sw.js')` trả 200 đúng content-type — thì CSP là nghi phạm đầu tiên,
 * và đo 16/8/2026 cho thấy nó KHÔNG phải nguyên nhân: thêm `worker-src` xong
 * vẫn hỏng, và một service worker RỖNG cũng hỏng y hệt.
 *
 * Nguyên nhân lúc đó là môi trường trình duyệt chặn đăng ký (trình duyệt trong
 * ứng dụng, chế độ ẩn danh, hoặc cờ tắt SW). Cách tách bạch nhanh: nạp một
 * service worker rỗng — rỗng mà cũng hỏng thì lỗi KHÔNG nằm ở mã của bạn.
 *
 * ⚠️ `connect-src 'self'` — §12 cấm cho model gọi mạng trực tiếp trong đường
 * phân tích rủi ro. Khai ở đây là chặn ở tầng trình duyệt, không chỉ ở tầng
 * quy ước: kể cả ai đó lỡ nhét một lượt fetch tới gateway vào mã frontend thì
 * trình duyệt cũng chặn.
 *
 * ⚠️ `img-src` KHÔNG mở cho https: bên ngoài. Ảnh từ máy chủ lạ là một lượt gọi
 * ra ngoài mỗi lần bác mở app — đủ để bên đó biết bác đang dùng Khoan Đã.
 * Giao diện hiện còn vài ảnh mẫu từ unsplash.com; chúng sẽ bị chặn, và ĐÓ LÀ
 * HÀNH VI ĐÚNG — cần thay bằng ảnh cục bộ chứ không phải nới CSP.
 *
 * ⚠️⚠️ BA HEADER NÀY TỪNG BỊ GỠ MẤT, VÀ KHỐI CHÚ THÍCH Ở TRÊN VẪN NẰM LẠI.
 * Đo 18/8/2026: cả tệp chỉ còn `x-content-type-options`, trong khi 20 dòng chú
 * thích vẫn mô tả một CSP không tồn tại. Một chú thích mồ côi như vậy còn tệ hơn
 * không có chú thích — người đọc mã tin rằng chỗ đó đã được bảo vệ.
 *
 * ⚠️ HAI CẤU HÌNH, VÌ VITE Ở CHẾ ĐỘ PHÁT TRIỂN CHÈN SCRIPT INLINE và mở
 * WebSocket cho HMR. Bản chạy thật (`NODE_ENV=production`) dùng chính sách chặt;
 * bản phát triển nới đúng hai thứ đó và KHÔNG nới `img-src` / `font-src` /
 * `connect-src` ra ngoài `'self'` — hai cái sau mới là đường rò rỉ.
 */
const LA_BAN_CHAY_THAT = process.env.NODE_ENV === 'production';

const CSP = [
  "default-src 'self'",
  LA_BAN_CHAY_THAT ? "script-src 'self'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "worker-src 'self'",              // ⚠️ thiếu dòng này là service worker chết
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  LA_BAN_CHAY_THAT ? "connect-src 'self'" : "connect-src 'self' ws: wss:",
  "object-src 'none'",
  "base-uri 'none'",
  /*
   * ⚠️ `'self'` CHỨ KHÔNG PHẢI `'none'` — VÌ KHUNG ĐIỆN THOẠI LÀ MỘT <iframe>
   * CÙNG NGUỒN.
   *
   * Trên màn hình rộng, `src/khung-dien-thoai.ts` bọc app trong một iframe 390px
   * để media query của Tailwind thấy đúng bề rộng điện thoại. Với `'none'`,
   * trình duyệt chặn thẳng iframe đó — và chặn **không báo gì cho người dùng**:
   * khung vẫn vẽ ra đủ viền máy, bên trong trống trơn. Đo 20/8/2026, chỉ có
   * console nói "violates frame-ancestors 'none'".
   *
   * `'self'` vẫn chặn đúng thứ cần chặn: trang của kẻ khác **không** nhúng được
   * app này vào để lừa bác bấm nhầm (clickjacking). Chỉ chính tên miền này mới
   * nhúng được chính nó.
   *
   * ⚠️ `x-frame-options` ở dưới PHẢI ĐỔI THEO. Nó là header cũ nhưng trình
   * duyệt vẫn tôn trọng; để `DENY` thì nó chặn iframe bất kể CSP nói gì.
   */
  "frame-ancestors 'self'",
].join('; ');

app.use((req, res, next) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'SAMEORIGIN');   // đi cặp với frame-ancestors 'self' ở trên
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('content-security-policy', CSP);

  /*
   * ⚠️ HSTS — CHỈ KHI CHẠY THẬT, VÀ ĐÂY LÀ LÝ DO PHẢI CÓ ĐIỀU KIỆN.
   *
   * Header này bảo trình duyệt "từ nay chỉ nói chuyện với tên miền này qua
   * HTTPS" và nhớ trong một năm. Gửi nó từ máy dev chạy `http://localhost` là
   * tự khoá chính mình: trình duyệt sẽ từ chối mọi lần mở localhost sau đó,
   * kể cả của dự án khác cùng cổng, và gỡ ra phải vào tận trang cấu hình nội
   * bộ của trình duyệt.
   *
   * Với app này HSTS không phải trang trí: bản APK gọi sang máy chủ qua mạng
   * di động ở nơi công cộng, và một lần bị hạ cấp xuống http là toàn bộ nội
   * dung tin nhắn bác gửi đi kiểm nằm trần trên đường truyền.
   */
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
  }

  /*
   * Máy chủ này không cần camera, micro, vị trí hay cảm biến nào. Khai ra để
   * nếu có ngày một tệp tĩnh bị chèn mã lạ, nó cũng không xin được những thứ đó.
   */
  res.setHeader('permissions-policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');

  next();
});

/**
 * ─────────────────── CORS ───────────────────
 *
 * ⚠️ CẦN VÌ BẢN APK, VÀ ĐO ĐƯỢC 16/8/2026 LÀ THIẾU HẲN.
 *
 * Trong APK, Capacitor phục vụ giao diện ở origin `https://localhost`, còn máy
 * chủ nằm ở một tên miền khác. Đó là gọi KHÁC ORIGIN. Không có header CORS thì
 * WebView vẫn GỬI được yêu cầu — máy chủ trả 200 đàng hoàng — nhưng trình duyệt
 * VỨT phản hồi. Nhìn từ phía máy chủ mọi thứ đều xanh; nhìn từ phía người dùng
 * là mọi lượt kiểm đều lỗi. Kiểu hỏng này không có chỗ nào báo.
 *
 * ⚠️ DANH SÁCH ĐÓNG, KHÔNG DÙNG `*`.
 * `/api/proof/*` nhận token qua header `authorization`. Mở `*` là cho bất kỳ
 * trang web nào người dùng đang mở gọi sang đây kèm token của họ.
 *
 * ⚠️ KHÔNG bật `credentials`. Không có cookie phiên nào ở đây — danh tính đi
 * bằng Bearer token, mà token thì trang lạ không đọc được.
 */
const ORIGIN_CHO_PHEP = new Set([
  'https://localhost',        // Capacitor Android (androidScheme: https)
  'capacitor://localhost',    // Capacitor iOS
  'http://localhost:8089',    // chạy gộp một tiến trình
  'http://localhost:3000',    // Vite lúc phát triển
  ...(process.env.KHOAN_DA_ORIGIN_THEM || '').split(',').map((s) => s.trim()).filter(Boolean),
]);

app.use((req, res, next) => {
  const o = req.headers.origin;
  if (o && ORIGIN_CHO_PHEP.has(o)) {
    res.setHeader('access-control-allow-origin', o);
    res.setHeader('vary', 'Origin');
    res.setHeader('access-control-allow-headers', 'content-type, authorization');
    res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
    res.setHeader('access-control-max-age', '600');
  }
  // Preflight: trả sớm, đừng để nó rơi xuống handler thật.
  if (req.method === 'OPTIONS') return res.sendStatus(o && ORIGIN_CHO_PHEP.has(o) ? 204 : 403);
  return next();
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
 * ⚠️ CHỈ RÚT `vanBan`, `anh` VÀ BỐN TRƯỜNG GHI ÂM. KHÔNG trải `...req.body`.
 *
 * §4.3 — bốn trường nguồn ghi âm: `ghiAm`, `ghiAmConfidence`, `ghiAmFailed`,
 * `ghiAmMaLoi`. Vẫn RÚT TỪNG TRƯỜNG. `nguonGhiAm` là một object DỰNG LẠI từ bốn
 * trường đã rút, không phải một lát cắt của `req.body` — trải nó là an toàn.
 *
 * ⚠️ Cả bốn đều do người gọi tự khai, nên cả bốn phải CHỈ TĂNG cảnh giác:
 *  · `ghiAm` chỉ thêm vào `daKiem`, mà `daKiem` không vào công thức điểm
 *  · `ghiAmFailed` / `ghiAmConfidence` thấp chỉ thêm `chuaKiem`
 *  · `ghiAmMaLoi` chỉ CHỌN mã `chuaKiem` nào, không đổi điểm
 * Hàng rào: test/ghi-am-khong-ha-muc.test.js — 445 mẫu × 8 tổ hợp, và
 * test/ghi-am-than-yeu-cau.test.js đo QUA HTTP chứ không chỉ gọi hàm (§5.2).
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
const KHOA_BO_HOI_NHANH = new Set(CAU_HOI.map((c) => c.ma));

function locTraLoiBoHoiNhanh(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const sach = {};
  for (const [k, v] of Object.entries(raw)) {
    if (KHOA_BO_HOI_NHANH.has(k) && typeof v === 'boolean') {
      sach[k] = v;
    }
  }
  return Object.keys(sach).length > 0 ? sach : undefined;
}

/**
 * TRẠNG THÁI MÁY — nguồn đầu vào thứ năm, chỉ bản APK gửi.
 *
 * ⚠️ LỌC THÀNH BA TRƯỜNG, ĐÚNG KIỂU, KHÔNG GIỮ GÌ KHÁC.
 *
 * Bản APK cố tình KHÔNG gửi tên ứng dụng lên đây (xem `tomTatChoMayChu` bên
 * `src/native.ts`) — danh sách app đã cài là dấu vân tay rất mạnh của một
 * người. Bộ lọc này là hàng rào thứ hai cho đúng điều đó: kể cả khi ai đó sửa
 * frontend để gửi tên app lên, máy chủ vẫn vứt đi trước khi chạm tới bộ luật,
 * và không có đường nào để nó lọt vào nhật ký (§6.9).
 *
 * ⚠️ NGƯỜI GỌI TỰ KHAI, NÊN CHỈ ĐƯỢC LÀM TĂNG CẢNH GIÁC (§4.2).
 * `soUngDungLa: 0` KHÔNG trừ điểm, KHÔNG hạ mức, KHÔNG sinh tín hiệu "an toàn"
 * — nó chỉ khiến `daKiem` có thêm `trang_thai_may`, mà `daKiem` không nằm trong
 * công thức điểm. Hàng rào: test §4.2 "máy sạch KHÔNG hạ mức".
 *
 * Nếu có ngày ai đó muốn cho máy sạch trừ điểm cho đỡ báo động giả: đó chính là
 * câu thần chú §12 nói tới. Kẻ lừa đảo chỉ cần dặn nạn nhân gỡ app trước khi
 * kiểm, và cả hệ thống tự hạ mức giúp chúng.
 */
function locTrangThaiMay(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  if (typeof raw.docDuoc !== 'boolean') return undefined;
  const so = Number(raw.soUngDungLa);
  return {
    docDuoc: raw.docDuoc,
    soUngDungLa: Number.isFinite(so) && so > 0 ? Math.min(Math.floor(so), 50) : 0,
    coCaiTrongTuan: raw.coCaiTrongTuan === true,
  };
}

async function xuLyPhanTich(req, res) {
  const {
    vanBan, anh, ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi,
    traLoiBoHoiNhanh: traLoiBoHoiNhanhRaw,
    trangThaiMay: trangThaiMayRaw,
  } = req.body || {};

  const traLoiBoHoiNhanh = locTraLoiBoHoiNhanh(traLoiBoHoiNhanhRaw);
  const trangThaiMay = locTrangThaiMay(trangThaiMayRaw);

  // §6.10 — giới hạn kích thước, báo lỗi rõ, KHÔNG âm thầm cắt.
  if (typeof anh === 'string' && anh.length > GIOI_HAN_TEP) {
    return res.status(413).json({ maLoi: 'FILE_TOO_LARGE' });
  }
  if (typeof vanBan === 'string' && vanBan.length > GIOI_HAN_VAN_BAN) {
    // §6.8 — KHÔNG phản chiếu nội dung người dùng vào phản hồi.
    return res.status(400).json({ maLoi: 'INPUT_TOO_LONG', toiDa: GIOI_HAN_VAN_BAN });
  }
  const coVanBan = typeof vanBan === 'string' && vanBan.trim().length > 0;
  /**
   * §4.3 — GHI ÂM HỎNG CŨNG LÀ MỘT ĐẦU VÀO.
   *
   * Trả 400 "thiếu đầu vào" cho lượt chỉ có ghi âm hỏng là biến một trạng thái
   * CẦN NÓI RA thành một lỗi im lặng — bác bấm ghi, không nghe được, rồi màn
   * hình báo "thiếu đầu vào" như thể bác chưa làm gì. Đúng dạng lỗi §4.3.
   */
  const coBoHoiNhanh = Boolean(traLoiBoHoiNhanh && Object.keys(traLoiBoHoiNhanh).length > 0);
  /**
   * §4.3 — GHI ÂM HỎNG CŨNG LÀ MỘT ĐẦU VÀO.
   * §15.8 — BỘ HỎI NHANH CŨNG LÀ MỘT ĐẦU VÀO ĐẦY ĐỦ.
   *
   * Trả 400 "thiếu đầu vào" cho lượt chỉ có ghi âm hỏng hoặc chỉ có bộ hỏi nhanh
   * là biến một trạng thái CẦN NÓI RA thành một lỗi im lặng — bác bấm trả lời,
   * rồi màn hình báo "thiếu đầu vào" như thể bác chưa làm gì. Đúng dạng lỗi §4.3.
   */
  if (!coVanBan && !anh && !ghiAm && !coBoHoiNhanh) {
    return res.status(400).json({ maLoi: 'THIEU_DAU_VAO' });
  }
  const nguonGhiAm = { ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi };

  /**
   * §6.10 — BỘ LUẬT CHẠY TRƯỚC, xử lý các ca hiển nhiên mà KHÔNG cần gọi AI.
   * §6.10 (8.13): "Có direct critical signal, hoặc điểm đã ≥45 từ tín hiệu chắc
   * chắn ⇒ KHÔNG hỏi thêm trước khi cảnh báo. Can thiệp trước."
   *
   * Đây vừa là kiểm soát chi phí, vừa là chuyện an toàn: bắt người đang bị kẻ
   * lừa đảo thúc trên điện thoại ngồi chờ gateway là đánh đổi sai. 60 giây đã
   * mất thì không lấy lại được.
   */
  const soBo = analyze({ vanBan: coVanBan ? vanBan : '', anh, traLoiBoHoiNhanh, trangThaiMay, ...nguonGhiAm });
  if (soBo.overrides.length > 0) {
    return res.json(toHopDong(soBo));
  }

  // §6.1 bước 6 — gọi lớp trích tín hiệu. Hỏng thì rơi về bộ luật, KHÔNG sập.
  let llmSignals = [];
  let aiError = null;
  const epLoi = KHONG_GOI_AI ? req.body?._epLoiAi : null;

  /**
   * ⚠️ MÔ HÌNH KHÔNG NHÌN ĐƯỢC ẢNH THÌ PHẢI KHAI RA, KHÔNG GỬI RỒI IM.
   *
   * Mô hình chỉ-đọc-chữ nhận khối `image_url` rồi lặng lẽ bỏ qua nó. Nếu cứ gửi
   * thì `unreadableInputFloor()` thấy có trường `anh` và khai `daKiem:
   * ['anh_ocr']` — màn hình nói "đã đọc chữ trong ảnh" về một tấm ảnh chưa ai
   * nhìn. §4.3, và là loại chỉ lộ ra khi đổi mô hình chứ không lộ khi chạy test
   * bằng văn bản.
   *
   * Nên: không có thị giác ⇒ KHÔNG gửi ảnh đi, và báo `ocrFailed` để tầng sàn
   * khai `khong_doc_duoc_anh`. Bác thấy đúng một câu: "Khoan Đã chưa đọc được
   * chữ trong ảnh".
   */
  const cauHinhAi = layCauHinh();
  const moHinhDocDuocAnh = cauHinhAi.coThiGiac;
  const anhBiBoQua = Boolean(anh) && !moHinhDocDuocAnh;

  if (epLoi) {
    aiError = epLoi;
  } else if (!KHONG_GOI_AI && cauHinhAi.daCauHinh && (coVanBan || (anh && moHinhDocDuocAnh))) {
    const kq = await trichTinHieu(coVanBan ? vanBan : '', {
      anh: moHinhDocDuocAnh ? anh : undefined,
    });
    llmSignals = kq.signals;
    aiError = kq.loi;
    if (kq.loi) {
      // §6.7 — lỗi vứt mất nguyên nhân là sự cố không chẩn đoán được.
      // Chỉ vào log, và KHÔNG kèm nội dung người dùng (§6.9).
      console.error('[ai]', kq.loi, kq.chiTiet?.providerStatus || '',
        kq.chiTiet?.providerMessage || '');
      loiAiGanNhat = {
        ma: kq.loi,
        trangThaiNhaCungCap: kq.chiTiet?.providerStatus ?? null,
        // ⚠️ 200 ký tự đầu của thông báo nhà cung cấp. Nó mô tả LỖI CẤU HÌNH
        // (khoá sai, model không tồn tại, hết quota) chứ không phải nội dung
        // người dùng — nhưng vẫn cắt ngắn để không vô tình mang gì theo.
        moTa: typeof kq.chiTiet?.providerMessage === 'string'
          ? kq.chiTiet.providerMessage.slice(0, 200) : null,
      };
    } else {
      /**
       * ⚠️ "AI CHẠY XONG" KHÔNG CÓ NGHĨA LÀ "AI TRÍCH ĐƯỢC GÌ".
       *
       * Đo 18/8/2026: sau khi vá timeout, `aiDaChay: true` nhưng `maLyDo: []`
       * cho một tin nhắn giả danh công an rõ ràng. Nhìn từ ngoài giống hệt lúc
       * AI hỏng, mà nguyên nhân hoàn toàn khác — và ba nguyên nhân khả dĩ cần
       * ba cách sửa khác nhau:
       *   · model trả rỗng            → lời nhắc hoặc mức suy luận
       *   · model trả, bị loại evidence → trích dẫn không khớp bản gốc
       *   · model trả, sai lược đồ    → mã không có trong registry
       *
       * `rejected` phân biệt được ba ca đó. §6.9 — CHỈ ĐẾM VÀ MÃ LÝ DO, không
       * bao giờ đưa `quote` ra ngoài: trích dẫn LÀ nội dung người dùng.
       */
      const boLoc = {};
      for (const r of kq.rejected || []) {
        const ly = r?.lyDo || 'khong_ro';
        boLoc[ly] = (boLoc[ly] || 0) + 1;
      }
      loiAiGanNhat = null;
      chanDoanAiGanNhat = {
        soTinHieuNhan: kq.signals?.length || 0,
        soTinHieuBiLoai: (kq.rejected || []).length,
        lyDoLoai: boLoc,
      };
    }
  } else {
    aiError = 'AI_NOT_CONFIGURED';
  }

  const envelope = analyze({
    vanBan: coVanBan ? vanBan : '', anh, llmSignals, aiError, traLoiBoHoiNhanh, trangThaiMay,
    // Ảnh có mà không mô hình nào nhìn ⇒ "chưa đọc được", không phải "đã đọc".
    ...(anhBiBoQua ? { ocrFailed: true } : {}),
    ...nguonGhiAm,
  });
  return res.json(toHopDong(envelope));
}

app.post('/api/analyze', chanPhanTich, xuLyPhanTich);
app.post('/api/phan-tich', chanPhanTich, xuLyPhanTich);   // §5.2 — alias, cùng handler

/**
 * ─────────────────── KẾT QUẢ SƠ BỘ, TRẢ NGAY ───────────────────
 *
 * CHỈ TẦNG LUẬT. Không gọi AI. Trả về dưới 50ms.
 *
 * VÌ SAO CẦN — ĐO ĐƯỢC 15/8/2026: gateway mất 25,6–35s một lượt (5 phép đo,
 * trung vị 31,6s, 2/5 chạm trần 35s). Người đang bị kẻ lừa đảo thúc trên điện
 * thoại phải nhìn màn chờ nửa phút. §6.10 nói thẳng đó là đánh đổi sai.
 *
 * ⚠️ HẠ TRẦN TIMEOUT KHÔNG PHẢI CÁCH VÁ. Đã đo: trần 12s làm hỏng 100% lượt
 * gọi, và recall rơi từ 67,6% về mức chỉ-bộ-luật 3,8%. Chờ nhanh mà mù thì tệ
 * hơn chờ lâu mà thấy.
 *
 * ⚠️⚠️ TÍNH CHẤT AN TOÀN KHIẾN ĐƯỜNG NÀY DÙNG ĐƯỢC:
 * §4.2 nói tầng AI CHỈ BẬT CỜ, và mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác.
 * Hệ quả: mức của kết quả cuối LUÔN ≥ mức sơ bộ. Không bao giờ có chuyện hiện
 * "Nguy hiểm cao" rồi hạ xuống "Chưa thấy dấu hiệu" — chiều đó bị cấm bởi bộ
 * luật, không phải bởi ước lệ.
 * Hàng rào: test/so-bo-khong-cao-hon-ket-qua.test.js chạy 445 mẫu.
 *
 * ⚠️ NHƯNG GIAO DIỆN VẪN KHÔNG ĐƯỢC HIỆN NHÃN TRẤN AN SỚM. `aiDaChay:false` ở
 * đây là thật, và §HĐ đã buộc frontend hiện dòng "lượt này không có AI đọc"
 * cùng cỡ chữ. Frontend chỉ hiện NHÃN sớm khi nhãn sơ bộ là CAO; mức thấp hơn
 * thì hiện tín hiệu đã thấy và trạng thái "đang đọc kỹ hơn", KHÔNG hiện nhãn.
 */
app.post('/api/analyze/so-bo', chanPhanTich, (req, res) => {
  /**
   * ⚠️ BỐN TRƯỜNG GHI ÂM VÀ BỘ HỎI NHANH PHẢI CÓ Ở CẢ HAI ĐƯỜNG.
   *
   * Đường này mù với ghi âm / bộ hỏi nhanh còn `/api/analyze` thì không ⇒ sơ bộ ra "Chưa thấy
   * dấu hiệu rủi ro" trong khi kết quả cuối có `chuaKiem` hoặc mức CAO. Người dùng đọc màn
   * hình đầu tiên rồi cất điện thoại. Hàng rào: ca so-bo trong
   * test/ghi-am-than-yeu-cau.test.js và test/so-bo-khong-cao-hon-ket-qua.test.js.
   */
  const {
    vanBan, anh, ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi,
    traLoiBoHoiNhanh: traLoiBoHoiNhanhRaw,
    trangThaiMay: trangThaiMayRaw,
  } = req.body || {};

  const traLoiBoHoiNhanh = locTraLoiBoHoiNhanh(traLoiBoHoiNhanhRaw);
  /*
   * ⚠️ RÚT Ở ĐÂY NỮA, KHÔNG DÙNG CHUNG BIẾN VỚI `xuLyPhanTich` — LỖI ĐO 19/8/2026.
   *
   * Route này là handler RIÊNG, không nằm trong `xuLyPhanTich`. Khi thêm nguồn
   * đầu vào `trangThaiMay`, biến được khai bên kia nhưng dòng gọi `analyze()` ở
   * đây cũng được sửa theo — nên nó tham chiếu một tên không tồn tại và ném
   * `ReferenceError` ⇒ HTTP 500.
   *
   * Hỏng đúng chỗ tệ nhất: `/api/analyze/so-bo` LÀ đường dự phòng mà giao diện
   * gọi khi `/api/analyze` lỗi. Cả hai cùng chết thì màn kết quả rơi về
   * `khongGoiDuocMayChu` — bác thấy "chưa gửi đi kiểm được" và không có cách nào
   * biết là do một biến chưa khai.
   */
  const trangThaiMay = locTrangThaiMay(trangThaiMayRaw);

  if (typeof anh === 'string' && anh.length > GIOI_HAN_TEP) {
    return res.status(413).json({ maLoi: 'FILE_TOO_LARGE' });
  }
  if (typeof vanBan === 'string' && vanBan.length > GIOI_HAN_VAN_BAN) {
    return res.status(400).json({ maLoi: 'INPUT_TOO_LONG', toiDa: GIOI_HAN_VAN_BAN });
  }
  const coVanBan = typeof vanBan === 'string' && vanBan.trim().length > 0;
  const coBoHoiNhanh = Boolean(traLoiBoHoiNhanh && Object.keys(traLoiBoHoiNhanh).length > 0);
  if (!coVanBan && !anh && !ghiAm && !coBoHoiNhanh) return res.status(400).json({ maLoi: 'THIEU_DAU_VAO' });

  return res.json(toHopDong(analyze({
    vanBan: coVanBan ? vanBan : '', anh, ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi, traLoiBoHoiNhanh, trangThaiMay,
  })));
});

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

/**
 * ══════════ TÀI KHOẢN THẬT ══════════
 *
 * ⚠️ §5.3 · §6.9 — KHÔNG ĐƯỜNG NÀO Ở ĐÂY ĐƯỢC GÁC `/api/analyze`.
 * Tài khoản chỉ mở thêm vòng tròn gia đình, cảnh báo người thân, quy tắc chung.
 * Chưa đăng nhập vẫn kiểm được tin nhắn — hàng rào ở `auth.js`.
 *
 * ⚠️ §11 — ĐĂNG NHẬP SAI TRẢ VỀ ĐÚNG MỘT MÃ, dù số có tồn tại hay không.
 * Phân biệt hai ca là dựng sẵn một máy dò xem số nào đang dùng Khoan Đã.
 */
const taiKhoan = (fn) => async (req, res) => {
  try {
    return res.json(await fn(req));
  } catch (e) {
    if (e instanceof TK.LoiTaiKhoan) {
      /*
       * 429 cho ca phải chờ, 401 cho ca sai thông tin, 400 cho ca đầu vào hỏng.
       *
       * ⚠️ `THU_LAI_SAU` PHẢI LÀ 429, KHÔNG PHẢI 400. Bốn trăm nghĩa là "bác
       * gửi sai", và giao diện sẽ hiện một câu kiểu "dữ liệu không hợp lệ" cho
       * một người vừa gõ đúng mọi thứ, chỉ hơi vội. Kèm `giay` để màn hình nói
       * được điều duy nhất có ích lúc đó: chờ bao lâu nữa.
       */
      if (e.ma === 'THU_LAI_SAU') {
        return res.status(429).json({ maLoi: e.ma, giay: e.giay ?? 5 });
      }
      const http = e.ma === 'SAI_SO_HOAC_MAT_KHAU' || e.ma === 'SAI_MAT_KHAU_CU' ? 401 : 400;
      return res.status(http).json({ maLoi: e.ma });
    }
    console.error('[tai-khoan]', e?.message);
    return res.status(500).json({ maLoi: 'LOI_MAY_CHU' });
  }
};

app.post('/api/tai-khoan/dang-ky', chanProof, taiKhoan(async (req) => {
  const kho = await KP.khoChung();
  const hs = await TK.dangKy(kho, req.body ?? {});
  return { hoSo: hs, ...(await KP.capPhien(hs.id)) };
}));

app.post('/api/tai-khoan/dang-nhap', chanProof, taiKhoan(async (req) => {
  const kho = await KP.khoChung();
  const hs = await TK.dangNhap(kho, req.body ?? {});
  return { hoSo: hs, ...(await KP.capPhien(hs.id)) };
}));

/** ⚠️ Đăng xuất phải HUỶ token ở máy chủ, không chỉ để máy khách quên nó đi. */
app.post('/api/tai-khoan/dang-xuat', chanProof, taiKhoan(async (req) => ({
  daHuy: await KP.huyPhien(req.headers.authorization),
})));

app.get('/api/tai-khoan/toi', chanDoc, canPhien, taiKhoan(async (req) => {
  const kho = await KP.khoChung();
  const hs = await TK.layHoSo(kho, req.taiKhoanId);
  if (!hs) throw new TK.LoiTaiKhoan('KHONG_CO_TAI_KHOAN');
  /*
   * ⚠️ NÓI RA RẰNG ẢNH ĐẠI DIỆN KHÔNG NẰM Ở ĐÂY.
   * §6.9 giữ ảnh trên máy; giao diện phải cho bác biết điều đó chứ không để bác
   * tưởng ảnh đã được lưu ở máy chủ rồi mất khi đổi máy.
   */
  return { hoSo: hs, chiTrenMay: TK.HO_SO_TREN_MAY };
}));

app.patch('/api/tai-khoan/toi', chanProof, canPhien, taiKhoan(async (req) => {
  const kho = await KP.khoChung();
  return { hoSo: await TK.suaHoSo(kho, req.taiKhoanId, req.body ?? {}) };
}));

app.post('/api/tai-khoan/doi-mat-khau', chanProof, canPhien, taiKhoan(async (req) => {
  const kho = await KP.khoChung();
  return { xong: await TK.doiMatKhau(kho, req.taiKhoanId, req.body ?? {}) };
}));

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
 * ─────────────────── KÝ MỘT YÊU CẦU CỤ THỂ ───────────────────
 *
 * ⚠️ `chuTaiKhoanId` LẤY TỪ PHIÊN, KHÔNG TỪ THÂN YÊU CẦU. Cho người gọi tự khai
 * chủ tài khoản là cho họ tạo yêu cầu nhân danh nhà người khác.
 */
app.post('/api/proof/yeu-cau/tao', chanProof, canPhien, proof(async (req) => {
  const y = await KY.taoYeuCau({
    chuTaiKhoanId: req.taiKhoanId,
    caseId: req.body?.caseId,
    khoangTien: req.body?.khoangTien,   // KHOẢNG, không phải số chính xác (§6.9)
    hanhDong: req.body?.hanhDong,
    nguoiYeuCau: req.body?.nguoiYeuCau,
  });
  // Không trả `nonce` ra ngoài: nó nằm trong payload đã băm, người ký không cần.
  const { nonce, ...raNgoai } = y;
  void nonce;
  return raNgoai;
}));

/** Cả hai đầu cùng hỏi trạng thái ở đây. Không có gì bí mật trong phản hồi. */
app.get('/api/proof/yeu-cau/:yeuCauId', chanProof, canPhien,
  proof((req) => KY.docYeuCau(req.params.yeuCauId)));

/**
 * Người con ký — XÁC NHẬN hoặc TỪ CHỐI, cả hai đều được ký.
 *
 * ⚠️ §11 — phản hồi chỉ nói AI ĐÃ KÝ. Không nói yêu cầu tốt hay xấu: tài khoản
 * của Minh vẫn có thể bị chiếm quyền, VÀ dạng lạm dụng tài chính người cao tuổi
 * phổ biến nhất là do người trong nhà gây ra.
 */
app.post('/api/proof/yeu-cau/:yeuCauId/ky', chanProof, canPhien,
  proof((req) => KY.xacMinhChuKy({
    yeuCauId: req.params.yeuCauId,
    taiKhoanId: req.taiKhoanId,
    quyetDinh: req.body?.quyetDinh,
    phanHoi: req.body?.phanHoi,
  })));

/**
 * VERIFIED REQUEST — CHIỀU KIỂM.
 *
 * ⚠️ "KHÔNG TÌM THẤY" LÀ TRẠNG THÁI BÌNH THƯỜNG, không phải tín hiệu lừa đảo.
 * Hầu như không ai dùng tính năng này nên nó bật cả với yêu cầu THẬT. Frontend
 * phải hiện đúng câu "Khoan Đã chưa tìm thấy yêu cầu đã xác thực từ …" — KHÔNG
 * được thành "… không hề gửi yêu cầu này", vì app không biết điều đó.
 *
 * Route này KHÔNG trả nhãn rủi ro. Nó trả trạng thái hiểu biết, và frontend gọi
 * /api/analyze riêng như mọi khi.
 */
app.get('/api/proof/chieu-kiem/:caseId', chanProof, canPhien,
  proof((req) => VR.traYeuCauDaKy({
    chuTaiKhoanId: req.taiKhoanId, caseId: req.params.caseId,
  })));

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
 * TIN LỪA ĐẢO TỪ BÁO THẬT.
 *
 * ⚠️ §11 — MỖI TIN MANG TÊN BÁO VÀ ĐƯỜNG DẪN GỐC. Danh sách tin cứng trước đây
 * không có nguồn nào; đó đúng là "cảnh báo không có nguồn" mà §11 cấm.
 *
 * ⚠️ §4.3 — `chuaLayDuoc` KHÔNG RỖNG THÌ FRONTEND PHẢI HIỆN.
 * Mất mạng, báo đổi địa chỉ, đường hầm chết — cả ba đều cho danh sách rỗng.
 * Trả `[]` trơn là để màn hình nói "dạo này không có vụ lừa đảo nào".
 *
 * ⚠️ KHÔNG CHẶN ĐƯỜNG PHÂN TÍCH (§6.7). Có bộ nhớ đệm 30 phút trên đĩa và hạn
 * giờ 8 giây mỗi tờ báo; không lượt `/api/analyze` nào chờ ở đây.
 */
app.get('/api/tin-lua-dao', chanDoc, async (req, res) => {
  const d = await tinLuaDao();
  return res.json({
    tin: d.tin,
    luc: d.luc,
    chuaLayDuoc: d.chuaLayDuoc,
    tuDem: d.tuDem,
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

/**
 * ⚠️ ĐƯỜNG NÀY KHÔNG PHẢI MỘT PHẦN CỦA §HĐ, VÀ CỐ Ý KHÔNG PHẢI.
 *
 * Nói cho người dùng biết AI chạy Ở ĐÂU là chuyện quan trọng, nhưng thêm một
 * trường vào phản hồi của `/api/analyze` là ĐỔI HỢP ĐỒNG — mà §HĐ ghi rõ "đổi
 * hợp đồng này = phải báo cho cả hai bên". Nên nó đi bằng một cửa riêng.
 *
 * §11 — không lộ khoá, không lộ địa chỉ máy chủ. Chỉ nói ba điều người dùng có
 * quyền biết: AI có chạy không, chạy ở đâu, và nội dung của họ có rời máy không.
 */
app.get('/api/suc-khoe', (req, res) => {
  const c = layCauHinh();
  const chay = c.daCauHinh && !KHONG_GOI_AI;
  res.json({
    ok: true,
    // §11 — nói thật AI có cấu hình hay không. KHÔNG lộ khoá, không lộ base URL.
    aiCauHinh: chay,
    /**
     * ⚠️ CHỈ TÊN BIẾN, TUYỆT ĐỐI KHÔNG GIÁ TRỊ — §6.9.
     *
     * Thêm 20/8/2026 sau khi mất gần một tiếng đoán mò: deploy báo thành công,
     * đúng commit, mà `aiCauHinh` vẫn false. Từ bên ngoài không có cách nào
     * phân biệt ba ca: người vận hành chưa đặt biến, đặt sai TÊN, hay đặt đúng
     * mà nền tảng chưa nạp.
     *
     * Ba ca đó cần ba cách sửa khác nhau, và §4.3 nói đúng chuyện này: không
     * đo được thì phải nói ra là không đo được, đừng để người ta đoán.
     *
     * `true` ở đây chỉ có nghĩa "biến này có giá trị khác rỗng". Không lộ giá
     * trị, không lộ độ dài, không lộ vài ký tự đầu — một khoá lộ bốn ký tự đầu
     * vẫn là một khoá đã bắt đầu rò.
     */
    bienDaDat: Object.fromEntries(
      ['LLM_API_BASE', 'LLM_API_KEY', 'RISK_LLM_MODEL', 'GEMINI_API_KEY',
       'LLM_DU_PHONG_BASE', 'LLM_DU_PHONG_MODEL', 'NODE_ENV']
        .map((k) => [k, Boolean(process.env[k])]),
    ),
    model: chay ? c.model : null,
    /**
     * `tren_may_nguoi_dung`      — người dùng chạy cả app lẫn mô hình trên máy
     *                              của mình; nội dung KHÔNG rời khỏi máy.
     * `tren_may_chu_tu_van_hanh` — mô hình chạy cùng máy chủ này; nội dung rời
     *                              khỏi máy người dùng nhưng KHÔNG sang bên thứ ba.
     * `gateway` / `gemini`       — nội dung được gửi tới một công ty khác.
     * `khong_chay`               — chỉ có tầng luật, và giao diện phải nói ra.
     */
    noiChay: chay ? c.noiChay : 'khong_chay',
    /** Có sang BÊN THỨ BA không. Khác với "có rời khỏi máy người dùng không". */
    noiDungSangBenThuBa: chay ? !c.laCucBo : false,
    /** Mô hình có nhìn được ảnh không — quyết định ảnh vào daKiem hay chuaKiem. */
    coThiGiac: chay ? c.coThiGiac : false,
    /** Lỗi AI gần nhất, chỉ mã và trạng thái. `null` = lượt gần nhất chạy tốt. */
    loiAiGanNhat,
    /** Lượt chạy được gần nhất: nhận mấy tín hiệu, loại mấy, vì sao loại. */
    chanDoanAiGanNhat,
  });
});

/**
 * ─────────────────── THÔNG BÁO ĐẨY ───────────────────
 *
 * ⚠️ §11 — KHÔNG BAO GIỜ NÓI "ĐÃ GỬI CHO NGƯỜI THÂN" KHI CHƯA XÁC NHẬN ĐƯỢC.
 * Web Push không cho biết thông báo đã tới máy hay chưa; nó chỉ cho biết máy
 * chủ đẩy đã NHẬN. `src/push.js` có sẵn mã `PUSH_DELIVERY_UNKNOWN` cho đúng
 * chuyện đó — đừng viết chữ nào mạnh hơn nó ở tầng trên.
 *
 * ⚠️ §12 — không bật đồng bộ mặc định. Người dùng phải CHỦ ĐỘNG bật thông báo;
 * không có đường nào ở đây tự đăng ký thay họ.
 *
 * ⚠️ §6.9 — bản ghi đăng ký KHÔNG được mang nội dung tin nhắn. `moKho()` đã bọc
 * hàng rào trường cấm, nhưng ở đây cũng chỉ lưu đúng endpoint + khoá.
 */
const BANG_PUSH = 'push_dang_ky';

app.get('/api/push/khoa-cong-khai', chanDoc, (req, res) => {
  const v = layCauHinhVapid();
  // Chưa cấu hình ⇒ nói thật là chưa, để giao diện không bảo người dùng "đã bật".
  res.json({ khoaCongKhai: v.daCauHinh ? v.congKhai : null });
});

/**
 * ⚠️ HAI LOẠI ĐĂNG KÝ. Trình duyệt gửi khuôn Web Push; bản APK (Capacitor chạy
 * trong WebView, KHÔNG có Web Push) gửi `{loai:'native', token}` của FCM.
 *
 * Rẽ nhánh phải nằm Ở ĐÂY, không chỉ trong `src/push.js` — đây mới là cửa bản
 * APK gõ vào đầu tiên. Ép token FCM qua `chuanHoaDangKy` thì route trả 400 và
 * bác không bao giờ bật được thông báo, còn log máy chủ trông vẫn bình thường.
 * Hàng rào: test/push-trong-apk.test.js
 */
app.post('/api/push/dang-ky', chanDoc, async (req, res) => {
  try {
    const tho = req.body?.dangKy;
    const laNative = tho?.loai === LOAI_DANG_KY.native;
    const dk = laNative ? chuanHoaDangKyNative(tho) : chuanHoaDangKy(tho);
    const kho = await moKho();
    // Khoá theo endpoint (web) hoặc token (native): cùng một máy đăng ký lại thì
    // ghi đè, không nhân bản.
    await kho.luu(BANG_PUSH, laNative ? dk.token : dk.endpoint, dk);
    return res.json({ daDangKy: true });
  } catch (e) {
    return res.status(400).json({ maLoi: e?.ma || 'DANG_KY_KHONG_HOP_LE' });
  }
});

/**
 * ─────────────────── GIAO DIỆN ───────────────────
 *
 * Phục vụ bản dựng frontend từ CHÍNH máy chủ này. Một tiến trình, một origin.
 *
 * ⚠️ VÌ SAO GỘP LẠI CHỨ KHÔNG CHẠY HAI CỔNG:
 *
 * ① WEBAUTHN. `rpID` phải khớp origin trình duyệt thấy. Chạy hai cổng thì phải
 *    nhớ khai cả `localhost:3000` lẫn `localhost:8089` vào danh sách origin, và
 *    quên một cái là MỌI chữ ký bị từ chối kèm thông báo trông y hệt "người
 *    dùng bấm sai". Cùng origin thì cả lớp lỗi đó biến mất.
 *
 * ② §6.10 — app phải chạy được khi RÚT MẠNG. Hai tiến trình là hai thứ có thể
 *    chết lệch nhau; người dùng thấy giao diện lên nhưng mọi lượt kiểm đều lỗi.
 *
 * ⚠️ ĐẶT SAU MỌI ROUTE `/api`. Đặt trước là `express.static` nuốt hết đường API
 * và trả `index.html` cho `/api/analyze` — frontend nhận HTML, `JSON.parse` ném
 * lỗi, và thông báo cuối cùng tới người dùng chẳng liên quan gì tới nguyên nhân.
 *
 * ⚠️ KHÔNG CÓ BẢN DỰNG THÌ NÓI RA, đừng trả trang trắng. §6.7.
 */
const DUONG_GIAO_DIEN = process.env.KHOAN_DA_GIAO_DIEN
  || path.join(__dirname, 'public', 'app');

/**
 * ⚠️ SÀN TIẾP CẬN §4.4 PHẢI PHỤC VỤ ĐƯỢC — VÀ NÓ TỪNG KHÔNG.
 *
 * `tokens.css` và `vung-cham-san.css` nằm ở `public/`, không nằm trong bản dựng
 * giao diện (`public/app/`). Trước khi có khối này, SPA catch-all nuốt chúng và
 * trả `index.html` — tức HTTP **200** kèm `content-type: text/html`.
 *
 * Đó tệ hơn 404: trình duyệt nhận HTML ở chỗ chờ CSS, âm thầm không áp gì, và
 * sàn 52px/56px/14px biến mất mà KHÔNG có lỗi ở bất kỳ đâu. §4.4 gọi tên
 * `vung-cham-san.css` đích danh và nói nó phải nằm trong APP_SHELL của service
 * worker — mà đệm một trang HTML dưới tên tệp CSS thì đệm luôn cả cái hỏng.
 *
 * Khai TƯỜNG MINH từng tệp, không mount cả `public/`: mount cả thư mục là phơi
 * thêm thứ chưa ai rà.
 * Hàng rào: test/vo-ung-dung.test.js kiểm cả mã trạng thái LẪN content-type.
 */
/**
 * ─────────────────── TẢI APK ───────────────────
 *
 * Có tệp thì mở đường tải; không có thì KHÔNG có route (404 thật, không phải
 * một trang trắng giả vờ).
 *
 * ⚠️ ĐÂY LÀ ĐƯỜNG CÔNG KHAI KHI CHẠY QUA TUNNEL. Ai có địa chỉ cũng tải được.
 * Chấp nhận được với bản `debug` để cài thử trong nhóm, nhưng:
 *  · KHÔNG đặt bản `release` đã ký ở đây
 *  · Tắt bằng `KHOAN_DA_KHONG_PHAT_APK=1` khi không còn cần
 *
 * ⚠️ `Content-Disposition: attachment` để Android tải xuống chứ không cố mở
 * trong trình duyệt. Thiếu nó thì một số máy hiện tệp nhị phân ra màn hình.
 */
const DUONG_APK = path.join(__dirname, 'khoan-da.apk');
if (fs.existsSync(DUONG_APK) && process.env.KHOAN_DA_KHONG_PHAT_APK !== '1') {
  app.get('/khoan-da.apk', chanDoc, (req, res) => {
    res.setHeader('content-type', 'application/vnd.android.package-archive');
    res.setHeader('content-disposition', 'attachment; filename="khoan-da.apk"');
    res.sendFile(DUONG_APK);
  });
}

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
