'use strict';
/**
 * §2B.2 bước 11 — EVIDENCE PHẢI KHỚP BẢN GỐC.
 *
 * §6.4 / 18.9: evidence phải trích được ĐÚNG CHUỖI CON trên normalized text của
 * NGÔN NGỮ GỐC. KHÔNG dịch evidence trước khi validate — tiếng Anh phải khớp bản
 * tiếng Anh gốc, tiếng Việt khớp bản tiếng Việt gốc.
 *
 * Model trả một "câu trích" đã diễn giải lại mà không tồn tại trong nguồn thì
 * LOẠI TÍN HIỆU ĐÓ. Bản dịch chỉ được hiển thị như phụ chú, gắn nhãn
 * "Translated explanation", và KHÔNG thay thế evidence gốc.
 */

const { boDau, chuanHoa } = require('./context-builder');
const { scopeCuaTinHieu } = require('./signal-registry');

/**
 * ⚠️ TRÍCH DẪN PHẢI ĐI QUA ĐÚNG HÀM CHUẨN HOÁ ĐÃ DÙNG CHO VĂN BẢN.
 *
 * ĐO ĐƯỢC 15/8/2026 — LỖI ĐẮT NHẤT PHIÊN NÀY, −5,6 ĐIỂM RECALL.
 *
 * Trước đây chỗ này tự chuẩn hoá lấy: `toLowerCase()` + gộp khoảng trắng. Rồi
 * `chuanHoa()` bên context-builder được sửa để GỠ DẤU NGĂN HÀNG NGHÌN (vì tiền
 * Việt viết `1.200.000đ` và `[^.]{0,N}` trong cue bank bị dấu chấm chặn ngang).
 *
 * Hai hàm chuẩn hoá LỆCH NHAU ngay lập tức. Model trích nguyên văn
 * `"chú chuẩn bị 450.000đ tiền mặt"`, còn `doan.normalized` giờ là
 * `"chú chuẩn bị 450000đ tiền mặt"` — không khớp, tín hiệu bị LOẠI. Mà trích dẫn
 * chứa số tiền lại đúng là những tín hiệu nặng điểm nhất (FIN_TRANSFER_REQUEST,
 * FIN_CASH_COURIER, OFF_ADVANCE_FEE), nên điểm sụp thẳng: 69 → 6.
 *
 * Đo được 9/17 trích dẫn trên các mẫu tụt có chứa dấu ngăn.
 *
 * ⚠️ BÀI HỌC, KHÔNG PHẢI CHI TIẾT VẶT: hai bên của một phép so BẮT BUỘC dùng
 * CHUNG một hàm chuẩn hoá. Chép logic sang đây lần nữa là hẹn ngày lệch tiếp,
 * và kiểu lệch này IM LẶNG — tín hiệu biến mất chứ không ai báo lỗi.
 * Hàng rào: test/evidence-chuan-hoa-chung.test.js.
 */
const chuanHoaTrich = (quote) => chuanHoa(String(quote).replace(/\s+/g, ' '));

/**
 * Offset do gateway trả về hay lệch; thứ kiểm được là CHUỖI CON có thật hay không.
 * Nên ở đây chỉ kiểm sự tồn tại, không kiểm offset.
 */
function trichCoThat(quote, ctx) {
  if (typeof quote !== 'string' || !quote.trim()) return false;
  const q = chuanHoaTrich(quote);
  if (ctx.normalized.includes(q)) return true;
  // §6.13 — tiếng Việt không dấu cũng là bản gốc hợp lệ.
  return ctx.folded.includes(boDau(q));
}

/**
 * @param {object} signal  tín hiệu đã normalize
 * @param {object} ctx     kết quả buildContext() của NGÔN NGỮ GỐC
 */
function validateEvidence(signal, ctx) {
  // §6.4 — direct detector tự sinh evidence từ chính bản gốc, không qua tầng này.
  if (signal?.source === 'direct') return true;
  if (!signal || !Array.isArray(signal.evidence) || signal.evidence.length === 0) return false;
  return signal.evidence.some((e) => trichCoThat(e?.quote, ctx));
}

const locTheoEvidence = (signals = [], ctx) => signals.filter((s) => validateEvidence(s, ctx));

/**
 * Những đoạn CHỒNG LẤN với câu trích.
 *
 * ⚠️ Model rất hay trích một đoạn BẮC QUA ranh giới hai câu ("Tôi là công an.
 * Bác chuyển tiền ngay."). Tìm quote nằm gọn trong một đoạn thì không thấy gì cả
 * — đã đo: 29/30 tín hiệu bị loại oan trên mẫu nguy hiểm đều do lỗi này.
 * Nên phải xét cả chiều ngược lại: đoạn nằm trong quote.
 */
function doanChongLan(quote, ctx) {
  if (typeof quote !== 'string' || !quote.trim()) return [];
  // ⚠️ CÙNG hàm chuẩn hoá với `trichCoThat` — xem chú thích dài ở đó.
  const q = chuanHoaTrich(quote);
  const qf = boDau(q);
  return ctx.segments.filter((d) => d.normalized.includes(q) || d.folded.includes(qf)
    || q.includes(d.normalized) || qf.includes(d.folded));
}

/** Đoạn nào chứa câu trích này? Dùng để áp scope/speech act cho tín hiệu từ AI. */
const doanChuaTrich = (quote, ctx) => doanChongLan(quote, ctx)[0] || null;

/**
 * ⚠️ LỖI ĐÃ ĐO 15/8/2026 — hàng rào Phụ lục C chỉ bảo vệ direct-precheck,
 * KHÔNG bảo vệ đường AI. Mà AI mới là máy dò chính.
 *
 * Câu "Never share your OTP or verification code with anyone." được bộ luật
 * phân loại đúng là `warning_education`, direct-precheck im lặng — nhưng tín
 * hiệu AI cho ĐÚNG CÂU ĐÓ đi thẳng qua và ghi 25 điểm.
 *
 * Đây đúng dạng lỗi §9.1 mô tả: ĐƯỜNG DỰ PHÒNG AN TOÀN HƠN ĐƯỜNG CHÍNH.
 * Nên scope/speech act phải áp cho MỌI nguồn tín hiệu, không riêng nguồn nào.
 */
function locTheoScopeChiTiet(signals = [], ctx) {
  const giu = [];
  const loai = [];
  for (const s of signals) {
    if (s.source === 'direct' || s.source === 'deterministic') { giu.push(s); continue; }
    if (scopeCuaTinHieu(s.id) !== 'action') { giu.push(s); continue; }  // C.2 — 'any' lấy tất cả đoạn

    // Tín hiệu action-scope chỉ được nhận khi evidence chạm vào đoạn HÀNH ĐỘNG.
    const doan = (s.evidence || []).flatMap((e) => doanChongLan(e?.quote, ctx));
    if (doan.some((d) => d.actionable === true)) { giu.push(s); continue; }

    /**
     * ⚠️ §4.3 — "KHÔNG TRA ĐƯỢC" ≠ "ĐÃ TRA, KHÔNG HỢP LỆ".
     * Không định vị được câu trích thuộc đoạn nào thì KHÔNG được lấy sự mơ hồ đó
     * làm cớ để tắt cảnh báo. §4.2: mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác.
     * Đã đo: fail-closed ở đây làm mất 29 tín hiệu trên mẫu nguy hiểm thật.
     */
    if (doan.length === 0) { giu.push(s); continue; }

    // Ghi lại VÌ SAO bị loại — không có dòng này thì mọi chẩn đoán sau đều là đoán.
    loai.push({
      id: s.id,
      quote: s.evidence?.[0]?.quote ?? null,
      speechAct: doan.find(Boolean)?.speechAct ?? 'khong_tim_thay_doan',
    });
  }
  return { giu, loai };
}

const locTheoScope = (signals, ctx) => locTheoScopeChiTiet(signals, ctx).giu;

/**
 * ─────────── BẰNG CHỨNG PHẢI MANG DẤU HIỆU CỦA CHÍNH TÍN HIỆU ĐÓ ───────────
 *
 * ⚠️ LỖ HỔNG ĐÃ ĐO 18/8/2026 KHI CHẠY MÔ HÌNH NHỎ TẠI CHỖ (qwen2.5vl:7b).
 *
 * `trichCoThat()` ở trên kiểm câu trích CÓ TỒN TẠI trong bản gốc hay không. Nó
 * KHÔNG kiểm câu trích có ĐÚNG NGHĨA với nhãn được gán hay không. Mô hình nhỏ
 * khai thác đúng khe đó: lấy một câu có thật rồi dán sai nhãn lên. Evidence hợp
 * lệ, tín hiệu bịa, và không hàng rào nào ở giữa.
 *
 * Đo trên 5 tin nhắn LÀNH, mô hình 7B chạy cục bộ:
 *
 *   "BIDV: tài khoản vừa bị trừ 500.000đ, số dư còn 12.450.000đ"
 *       → FIN_RECOVERY_FEE, FIN_CRYPTO_TRANSFER, FIN_TRANSFER_REQUEST
 *         (tin nhắn không hề nhắc phí lấy lại tiền, cũng không nhắc tiền mã hoá)
 *   "Bệnh viện Bạch Mai nhắc lịch khám lại của bác vào 8h ngày 25/8"
 *       → FIN_TRANSFER_REQUEST   (không ai đòi tiền)
 *
 * Kết quả: **3 trên 5 tin nhắn lành bị báo động** — mà §4.6 ghi rõ người bị báo
 * oan sẽ hoảng rồi gỡ ứng dụng. Với app khuyên "đừng tin ai", báo oan đắt hơn
 * bỏ sót.
 *
 * ⚠️ HÀNG RÀO NÀY KHÔNG PHẢI MỘT CƠ CHẾ HẠ MỨC (§4.2). Nó không đụng tới điểm,
 * ngưỡng hay override. Nó chỉ nói: **một tín hiệu chỉ được tính khi bằng chứng
 * của nó mang dấu hiệu của chính nó** — cùng tinh thần với `trichCoThat()`, chỉ
 * chặt hơn một bậc.
 *
 * ⚠️ CHỈ ÁP CHO TÍN HIỆU CÓ MẪU TRONG LOCALE PACK (26/58 mã).
 * Tín hiệu không có mẫu thì KHÔNG có gì để đối chiếu, và im lặng loại nó đi là
 * tự bịt mắt mình — đúng thứ §4.3 cấm. Chúng đi qua như cũ.
 *
 * ⚠️ CÓ CÔNG TẮC, VÀ CÔNG TẮC MẶC ĐỊNH BẬT.
 * `KHOAN_DA_BANG_CHUNG_PHAI_KHOP_MAU=0` để tắt khi cần đo so sánh. Đừng tắt vĩnh
 * viễn mà không chạy lại cả hai con số: báo oan VÀ bỏ sót.
 */
function mauCuaTinHieu(pack, signalId) {
  const ds = pack?.directPatterns?.[signalId];
  return Array.isArray(ds) && ds.length > 0 ? ds : null;
}

function bangChungMangDauHieu(signal, ctx, pack) {
  const mauList = mauCuaTinHieu(pack, signal.id);
  if (!mauList) return true;                       // không có mẫu ⇒ không phán

  const trich = (signal.evidence || [])
    .map((e) => String(e?.quote || ''))
    .filter(Boolean);
  if (trich.length === 0) return true;             // ca này đã bị hàng rào khác lo

  // So trên CẢ bản có dấu lẫn bản bỏ dấu, đúng như direct-precheck làm.
  // Gỡ HẾT dấu ngăn hàng nghìn: `1.200.000đ` → `1200000đ`.
  /*
   * ⚠️ GIỐNG HỆT `NGAN_HANG_NGHIN` bên context-builder, kể cả `(?!\d)` chặn
   * ngày tháng. Hai tầng chuẩn hoá lệch nhau nghĩa là cùng một câu, tầng này
   * thấy tầng kia không — đúng loại lỗi vừa phải vá ngày 19/8/2026.
   */
  const goSoTien = (x) => x.replace(/(\d)[.,](?=\d{3}(?!\d))/g, '$1');
  const ungVien = trich.flatMap((q) => {
    const c = goSoTien(chuanHoaTrich(q));
    return [c, boDau(c)];
  });

  /**
   * ⚠️ NỚI `[^.]` THÀNH "KÝ TỰ BẤT KỲ" — VÁ 18/8/2026, SAU KHI ĐO THẤY LOẠI OAN.
   *
   * Cue bank viết cho việc QUÉT CẢ ĐOẠN VĂN, nên chúng dùng `[^.]{0,30}` để
   * regex không lan qua câu khác. Ở đây thì khác hẳn: chuỗi đem so là một TRÍCH
   * DẪN NGẮN mà model đã tự chọn ra, nên nguy cơ "lan man qua câu khác" không
   * tồn tại — còn ràng buộc kia thì gây hại thật.
   *
   * Đo được, tin nhắn lừa đảo THẬT:
   *   "Chi nap 1.200.000d lam nhiem vu cuoi la rut duoc ca von lan thuong"
   *   mẫu OFF_TASK_PREPAY: `(nạp|ứng)[^.]{0,30}(làm nhiệm vụ|…|rút (được|về))`
   *   → dấu chấm trong "1.200.000" chặn ngang ⇒ LOẠI OAN hai tín hiệu nặng,
   *     và cả tin nhắn tụt từ NGHI_NGO xuống CHUA_THAY.
   *
   * Đây đúng con bug mà chú thích ở đầu tệp đã kể (−5,6 điểm recall hồi 15/8),
   * quay lại bằng một cửa khác. Hai bên của một phép so phải cùng cách chuẩn hoá
   * — và cùng cả những ràng buộc đi kèm.
   */
  /**
   * ⚠️ `String.raw` LÀ BẮT BUỘC Ở ĐÂY. Viết `'[\s\S]'` trong chuỗi thường thì
   * JavaScript nuốt mất dấu gạch chéo và regex thành `[sS]` — nghĩa là "ký tự s
   * hoặc S", chứ không phải "ký tự bất kỳ". Đã đo: hàng rào im lặng không khớp
   * gì cả, và mọi tín hiệu có mẫu đều bị loại oan.
   */
  const noiChanCham = (mau) => mau.replace(/\[\^\.\]/g, String.raw`[\s\S]`);

  return mauList.some(({ pattern }) => {
    const bien = [pattern, boDau(pattern)].map(noiChanCham);
    return bien.some((mau) => {
      let re;
      try { re = new RegExp(mau, 'i'); } catch { return false; }
      return ungVien.some((chuoi) => re.test(chuoi));
    });
  });
}

/**
 * @returns {{giu: Array, loai: Array}} — `loai` ghi rõ vì sao, để chẩn đoán được.
 */
function locTheoDauHieu(signals = [], ctx, pack) {
  if (process.env.KHOAN_DA_BANG_CHUNG_PHAI_KHOP_MAU === '0') {
    return { giu: signals, loai: [] };
  }
  const giu = [];
  const loai = [];
  for (const s of signals) {
    if (s.source === 'direct' || s.source === 'deterministic'
        || s.source === 'user_confirmed' || s.source === 'device_state') {
      /*
       * Bốn nguồn này KHÔNG do model đoán, nên không có gì để đối chiếu với mẫu.
       *
       * `device_state` là quan sát đọc thẳng từ Android: có một ứng dụng đang
       * bật quyền trợ năng, cài từ ngoài chợ chính thức. Bằng chứng của nó là
       * một sự kiện của thiết bị, không phải một đoạn chữ trong tin nhắn — nên
       * bộ lọc "bằng chứng phải mang dấu hiệu" không áp dụng được, và ép nó qua
       * đó thì tín hiệu luôn bị loại.
       */
      giu.push(s); continue;
    }
    if (bangChungMangDauHieu(s, ctx, pack)) giu.push(s);
    else loai.push({ id: s.id, lyDo: 'bang_chung_khong_mang_dau_hieu' });
  }
  return { giu, loai };
}

module.exports = {
  validateEvidence, locTheoEvidence, locTheoScope, locTheoScopeChiTiet,
  locTheoDauHieu, bangChungMangDauHieu,
  trichCoThat, doanChuaTrich, doanChongLan,
};
