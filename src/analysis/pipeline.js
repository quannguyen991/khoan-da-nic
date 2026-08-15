'use strict';
/**
 * §6.1 — THỨ TỰ PIPELINE, KHÔNG ĐƯỢC ĐẢO.
 * §4.3 — SÀN ĐẦU VÀO KHÔNG ĐỌC ĐƯỢC: unreadableInputFloor().
 * §HĐ  — hợp đồng backend ↔ frontend: toHopDong().
 *
 * §4.2: AI chỉ bật cờ. File này KHÔNG quyết định mức — decision-engine mới quyết.
 * §5.4: file này không import provider SDK.
 */

const { buildContext } = require('./context-builder');
const { directPrecheck } = require('./direct-precheck');
const { decide } = require('./decision-engine');
const { evaluateOverrides } = require('./critical-overrides');
const { locTheoEvidence, locTheoScopeChiTiet } = require('./evidence-validator');
const { phanTichUrl, trichUrl } = require('./url-analyzer');
const { laTinHieu } = require('./signal-registry');
const { nhanHopDong } = require('../risk-labels');
const { chonMuc } = require('../intervention-ladder');
const { tinHieuTuTraLoi } = require('../bo-hoi-nhanh');

const GIOI_HAN_VAN_BAN = 5000;      // §6.10
const NGUONG_CHAP_NHAN_LLM = 0.72;  // §6.4 — 0.55–0.71 → unknown; < 0.55 → drop
const NGUONG_OCR = 0.5;

/**
 * §4.3 — NGƯỠNG GHI ÂM, đối xứng với NGUONG_OCR.
 *
 * ⚠️ ĐƠN VỊ: thang [0,1], KHÔNG PHẢI logprob. whisper.cpp trả `avg_logprob`
 * luôn ÂM (−0,1 đến −1,5); plugin Kotlin chuẩn hoá bằng `exp(avg_logprob)`
 * TRƯỚC KHI trả sang JS. exp(−0,69) ≈ 0,5. So thẳng logprob với 0.5 thì lượt
 * nào cũng ra "hỏng", và không ai nhận ra vì hỏng-quá-nhiều trông như thận trọng.
 *
 * ⚠️ Giá trị nhận vào là độ tin cậy THẤP NHẤT trong các đoạn, KHÔNG phải trung
 * bình. Whisper nghe được 90% mà nuốt đúng câu "chuyển sang tài khoản an toàn"
 * thì bản chép còn lại trông sạch sẽ, luật cứng không thấy gì, và màn hình hiện
 * "Chưa thấy dấu hiệu rủi ro". Trung bình cả bài che mất đúng ca nguy hiểm nhất.
 */
const NGUONG_GHI_AM = 0.5;

/** Mã lỗi plugin trả về → mã chuaKiem. Mã lạ rơi về khong_nghe_duoc_ghi_am. */
const MA_LOI_GHI_AM = Object.freeze({
  CHUA_TAI_MODEL: 'chua_tai_xong_model_nghe',
  KHONG_CO_TIENG_NOI: 'ghi_am_khong_co_tieng_noi',
  BI_CAT: 'chi_nghe_duoc_phan_dau',
  /**
   * §4.3 — MÁY PHIÊN ÂM ĐƯỢC NHƯNG KHÔNG CHẤM ĐIỂM.
   *
   * `SpeechRecognizer` của Android không bắt buộc trả `CONFIDENCE_SCORES`, và
   * bộ nghe trên máy thường bỏ trống. Lúc đó ta CÓ chữ nhưng KHÔNG có số đo.
   *
   * Đây là ca §4.3 tinh tế nhất của cả tính năng, và nó có hai cách sai:
   *  · coi như tốt (điểm 1.0)  → "đã kiểm, không thấy gì" trong khi chưa đo
   *  · coi như không nghe được → nói sai, vì rõ ràng đã giải mã ra chữ
   * Nên nó có mã RIÊNG, nói đúng thứ đã xảy ra: nghe được, chưa đo được độ tin.
   */
  KHONG_DO_DUOC_DO_TIN_CAY: 'ghi_am_khong_do_duoc_do_tin_cay',
});

/**
 * §4.3 — "KHÔNG KIỂM ĐƯỢC" ≠ "ĐÃ KIỂM, KHÔNG THẤY GÌ".
 *
 * Ảnh không đọc được vì AI chết, tên miền không phân giải được, bộ eval hỏng —
 * cả ba đều từng hiện ra "Chưa thấy dấu hiệu rủi ro". Sàn này chặn điều đó.
 *
 * ⚠️ THÊM NGUỒN ĐẦU VÀO MỚI NÀO (video, ghi âm, tệp khác) THÌ THÊM CA VÀO ĐÂY.
 */
function unreadableInputFloor(input = {}) {
  const daKiem = [];
  const chuaKiem = [];

  if (typeof input.vanBan === 'string' && input.vanBan.trim()) {
    if (input.vanBan.length > GIOI_HAN_VAN_BAN) chuaKiem.push('noi_dung_qua_dai');
    else daKiem.push('van_ban');
  }

  if (input.anh) {
    const hong = input.ocrFailed === true
      || (typeof input.ocrConfidence === 'number' && input.ocrConfidence < NGUONG_OCR);
    if (hong) chuaKiem.push('khong_doc_duoc_anh');
    else daKiem.push('anh_ocr');
  }

  /**
   * §4.3 — NGUỒN ĐẦU VÀO THỨ SÁU: GHI ÂM PHIÊN ÂM TRÊN MÁY.
   *
   * ⚠️ HAI ĐIỀU KIỆN ĐỘC LẬP, KHÔNG PHẢI if/else.
   * Ca thường gặp nhất của whisper là "nghe được phần lớn, hụt một đoạn". Lúc đó
   * CẢ HAI đều đúng: đã phiên âm được (daKiem), VÀ có đoạn không nghe được
   * (chuaKiem). Nhị phân hoá nó là nói sai ở một trong hai đầu — khai thiếu thì
   * Phiếu giấu công đã làm, khai thừa thì Phiếu giấu chỗ mù.
   *
   * ⚠️ `ghiAmConfidence` không phải số / ngoài [0,1] ⇒ HỎNG, không phải ⇒ tốt.
   * Đây là §4.3 ở dạng ngắn nhất: thiếu số đo KHÁC đo rồi thấy tốt.
   */
  if (input.ghiAm) {
    const coChu = typeof input.vanBan === 'string' && input.vanBan.trim().length > 0;
    const doTinCay = input.ghiAmConfidence;
    const tinCayDuoc = typeof doTinCay === 'number' && Number.isFinite(doTinCay)
      && doTinCay >= NGUONG_GHI_AM && doTinCay <= 1;
    const maLoi = MA_LOI_GHI_AM[input.ghiAmMaLoi];

    if (coChu && input.ghiAmFailed !== true) daKiem.push('ghi_am');

    if (input.ghiAmFailed === true || !coChu) {
      chuaKiem.push(maLoi || 'khong_nghe_duoc_ghi_am');
    } else {
      if (maLoi) chuaKiem.push(maLoi);
      /**
       * ⚠️ `KHONG_DO_DUOC_DO_TIN_CAY` ĐÃ nói đúng chuyện thiếu số đo rồi. Thêm
       * `khong_nghe_duoc_ghi_am` vào nữa là nói sai — máy đã giải mã ra chữ.
       * Mọi mã lỗi KHÁC thì vẫn cộng dồn: bị cắt mà đoạn còn lại cũng mờ là
       * HAI chuyện, và giấu một trong hai là giấu chỗ mù.
       */
      if (!tinCayDuoc && input.ghiAmMaLoi !== 'KHONG_DO_DUOC_DO_TIN_CAY') {
        chuaKiem.push('khong_nghe_duoc_ghi_am');
      }
    }
  }

  /**
   * §15.4.1 — NGUỒN ĐẦU VÀO THỨ TƯ: đọc thông báo tin nhắn (native Android).
   *
   * §4.3 gọi tên đích danh: "THÊM NGUỒN ĐẦU VÀO MỚI NÀO THÌ THÊM CA VÀO ĐÂY."
   * Ba trong bốn chỗ hỏng của nguồn này là "KHÔNG ĐỌC ĐƯỢC", và không đọc được
   * KHÁC đọc rồi không thấy gì. Im lặng ở đây là đúng con bug đã xuất hiện ba
   * lần trong cùng một ngày.
   */
  if (input.thongBao) {
    if (input.thongBaoBiCat === true) chuaKiem.push('chi_doc_duoc_mot_phan_tin');
    else if (input.thongBaoKhongCoNoiDung === true) chuaKiem.push('thong_bao_khong_co_noi_dung');
    else if (input.thongBaoDaBiXoa === true) chuaKiem.push('thong_bao_da_bi_xoa');
    else daKiem.push('thong_bao_tin_nhan');
  }

  if (Array.isArray(input.urlUnresolved) && input.urlUnresolved.length > 0) {
    chuaKiem.push('khong_mo_duoc_link');
  } else if (Array.isArray(input.url) && input.url.length > 0) {
    daKiem.push('url');
  }

  /**
   * §15.9.1 — bộ hỏi nhanh LÀ một nguồn đã kiểm được: bác đã trả lời.
   * ⚠️ Nhưng nó KHÔNG PHẢI `nghe_cuoc_goi`. Khoan Đã vẫn không nghe được cuộc
   * gọi, và `chuaKiem` vẫn mang `chua_nghe_duoc_cuoc_goi` — không có ngoại lệ,
   * kể cả khi bác trả lời hết bảng hỏi (§15.8).
   */
  if (input.traLoiBoHoiNhanh && Object.keys(input.traLoiBoHoiNhanh).length > 0) {
    daKiem.push('bo_hoi_nhanh');
  }

  /**
   * §16.3 — NGUỒN ĐẦU VÀO THỨ NĂM: XÁC MINH BẰNG CHỮ KÝ CỦA NGƯỜI THÂN.
   *
   * §4.3 gọi tên đích danh: "THÊM NGUỒN ĐẦU VÀO MỚI NÀO THÌ THÊM CA VÀO ĐÂY."
   *
   * ⚠️ BA TRẠNG THÁI, KHÔNG PHẢI HAI. Chỗ này chính là §4.3 ở dạng thuần khiết
   * nhất mà dự án gặp tới giờ:
   *   DA_XAC_NHAN            → đã kiểm, có trả lời
   *   DA_TU_CHOI             → đã kiểm, có trả lời (và là trả lời XẤU)
   *   HET_HAN_KHONG_TRA_LOI  → CHƯA KIỂM ĐƯỢC. Không phải "không sao", cũng
   *                            không phải "đã từ chối".
   *
   * ⚠️ ĐỪNG NHẦM VỚI §9.4 "im lặng = gửi". §9.4 nói: người thân không phản đối
   * trong X phút thì CỨ GỬI cảnh báo — im lặng ngả về phía AN TOÀN HƠN. Ở đây
   * ngược lại: im lặng ngả về phía CHƯA BIẾT. Cùng chữ "im lặng", ngược hướng.
   * Hợp nhất hai cơ chế này là tạo ra đúng con bug §4.3 mô tả.
   */
  if (input.xacMinhNguoiThan === 'HET_HAN_KHONG_TRA_LOI') {
    chuaKiem.push('chua_lien_lac_duoc_nguoi_than');
  } else if (input.xacMinhNguoiThan === 'DA_XAC_NHAN'
    || input.xacMinhNguoiThan === 'DA_TU_CHOI') {
    daKiem.push('nguoi_than_xac_nhan');
  }

  /**
   * VERIFIED REQUEST — CHIỀU KIỂM. Tra xem có yêu cầu đã ký tương ứng không.
   *
   * ⚠️ "KHÔNG TÌM THẤY" LÀ TRẠNG THÁI **BÌNH THƯỜNG**, KHÔNG PHẢI TÍN HIỆU.
   * Hầu như không ai dùng tính năng này, nên nó bật cả với yêu cầu THẬT — con
   * gái nhắn xin tiền thật cũng chẳng có chữ ký nào.
   *
   * Nên nó nằm ở `chuaKiem` chứ KHÔNG BAO GIỜ ở `maLyDo`, và KHÔNG có sàn nào
   * gắn với nó. Đây là chỗ khác hẳn `chua_lien_lac_duoc_nguoi_than` ngay trên:
   * ở đó người dùng ĐÃ CHỦ ĐỘNG HỎI mà không ai đáp — im lặng có nghĩa; ở đây
   * chưa ai hỏi ai cả, im lặng là mặc định của thế giới.
   */
  if (input.chuaThayYeuCauDaXacThuc === true) {
    chuaKiem.push('chua_thay_yeu_cau_da_xac_thuc');
  }

  if (input.aiError) chuaKiem.push('ai_khong_phan_hoi');

  return { daKiem, chuaKiem };
}

/**
 * §6.4 — chỉ nhận `present` khi confidence ≥ 0.72 VÀ evidence hợp lệ.
 * Lược đồ CẤM `riskScore` / `riskLabel` / `critical` / `interventionLevel` / `safe`
 * — ở đây chúng bị BỎ QUA hoàn toàn, model không có đường nào tự quyết mức.
 */
function nhanTinHieuLLM(llmSignals = []) {
  const ra = [];
  for (const s of llmSignals) {
    if (!s || !laTinHieu(s.id)) continue;
    if (!Array.isArray(s.evidence) || s.evidence.length === 0) continue;
    const c = typeof s.confidence === 'number' ? s.confidence : 0;
    if (c < 0.55) continue;                              // drop
    const state = (s.state === 'present' && c >= NGUONG_CHAP_NHAN_LLM)
      ? 'present' : 'unknown';                           // 0.55–0.71 → unknown
    ra.push({
      id: s.id,
      state,
      source: 'llm',
      confidence: c,
      evidence: s.evidence.slice(0, 3),
    });
  }
  return ra;
}

/** §6.1 bước 8 — merge theo ID, direct thắng, provenance giữ nguyên. */
function ghepTinHieu(direct, llm) {
  const theoId = new Map();
  for (const s of llm) theoId.set(s.id, s);
  for (const s of direct) theoId.set(s.id, s);   // direct ghi đè: confidence 1.0
  return [...theoId.values()];
}

/** Bảng TĨNH: tín hiệu danh tính → họ kịch bản, để tra mẫu "Nói gì với bố mẹ". */
const HO_KICH_BAN = [
  ['ID_AUTHORITY_IMPERSONATION', 'gia_danh_cong_an'],
  ['ID_TAX_BENEFIT_IMPERSONATION', 'gia_danh_co_quan_thue'],
  ['ID_BANK_IMPERSONATION', 'gia_danh_ngan_hang'],
  ['ID_TECH_SUPPORT_IMPERSONATION', 'gia_danh_ho_tro_ky_thuat'],
  ['ID_RECOVERY_SUPPORT_IMPERSONATION', 'gia_danh_ho_tro_lay_lai_tien'],
  ['ID_FAMILY_IMPERSONATION', 'gia_danh_nguoi_than'],
  ['ID_FAMILY_EMERGENCY_THIRD_PARTY', 'bao_tin_nguoi_than_gap_nan'],
  ['ID_CONTACT_ACCOUNT_TAKEOVER', 'tai_khoan_nguoi_than_bi_chiem'],
  ['ID_DELIVERY_IMPERSONATION', 'gia_danh_giao_hang'],
  ['ID_UTILITY_IMPERSONATION', 'gia_danh_dich_vu_thiet_yeu'],
  ['ID_EMPLOYER_JOB_IMPERSONATION', 'gia_danh_tuyen_dung'],
  ['FIN_RECOVERY_FEE', 'lua_lay_lai_tien'],
  ['DEV_REMOTE_CONTROL_APP', 'chiem_quyen_thiet_bi'],
  ['DEV_INSTALL_APK_UNKNOWN', 'chiem_quyen_thiet_bi'],
  ['DEV_SCREEN_SHARE_BANKING', 'chiem_quyen_thiet_bi'],
  ['OFF_INVESTMENT_GUARANTEE', 'du_dau_tu_loi_nhuan_cao'],
  ['OFF_ROMANCE_EMERGENCY', 'lua_tinh_cam'],
];

function chonHoKichBan(ids) {
  const tap = new Set(ids);
  for (const [id, ho] of HO_KICH_BAN) if (tap.has(id)) return ho;
  return null;
}

/**
 * §HĐ luật 4 — canThiep quyết định MÀN HÌNH, nhan quyết định NHÃN.
 * Không suy cái này từ cái kia.
 *
 * §6.2 — PROTECTED_CRITICAL CHỈ đến từ critical override, không bao giờ từ điểm số.
 */
const chonCanThiep = chonMuc;   // một nguồn sự thật duy nhất: intervention-ladder

/**
 * ⚠️⚠️ HAI LÁ CỜ DUY NHẤT TRONG TOÀN BỘ ĐƯỜNG PHÂN TÍCH CÓ THỂ *HẠ* MỨC.
 *
 * `verifiedChannel` tắt `MAN_KEEP_CALL_ACTIVE`; `verifiedRelationship` tắt
 * `ID_FAMILY_IMPERSONATION` và `ID_CONTACT_ACCOUNT_TAKEOVER`.
 *
 * TRƯỚC 15/8/2026 CHÚNG ĐỌC TỪ `input` — tức từ THÂN YÊU CẦU HTTP. Mà
 * `/api/analyze` nằm trong `KHONG_CAN_DANG_NHAP` (src/auth.js): không có danh
 * tính nào để biện minh cho lá cờ, ai gọi API cũng khai được. Một kẻ lừa đảo
 * bảo bác "bấm ô đã xác minh đi cho nhanh" là được giảm mức miễn phí.
 *
 * §12: "Bất kỳ cụm nào hạ mức vô điều kiện đều là một câu thần chú tặng cho kẻ
 * lừa đảo." Lá cờ tự khai cũng là một câu thần chú, chỉ khác là viết bằng JSON.
 *
 * NAY CHÚNG NẰM Ở THAM SỐ THỨ HAI. `input` là dữ liệu người dùng và có thể đến
 * thẳng từ `req.body`; `nguCanhTinCay` thì KHÔNG BAO GIỜ được dựng từ `req.body`.
 * Tách làm hai tham số biến điều đó thành chuyện CẤU TRÚC chứ không phải kỷ luật
 * — không ai vô tình trải `...req.body` vào tham số thứ hai được.
 *
 * ⚠️ ĐÂY LÀ CHỖ KHOAN PROOF NỐI VÀO. Khi có chữ ký passkey đã xác minh, tầng
 * route đọc bản ghi chữ ký từ KHO CỦA MÁY CHỦ rồi dựng đối tượng này. Không
 * bao giờ đọc từ thân yêu cầu, kể cả khi đã đăng nhập — người đăng nhập vẫn có
 * thể là kẻ lừa đảo đang ngồi cạnh bác.
 *
 * Xoá tính năng suppress KHÔNG phải cách vá. Nó đúng khi có bằng chứng thật.
 * @param {object} nguCanhTinCay  CHỈ do máy chủ dựng. Không từ req.body.
 */
function docNguCanhTinCay(nguCanhTinCay) {
  const n = nguCanhTinCay && typeof nguCanhTinCay === 'object' ? nguCanhTinCay : {};
  return {
    verifiedChannel: n.verifiedChannel === true,
    verifiedRelationship: n.verifiedRelationship === true,
  };
}

function analyze(input = {}, nguCanhTinCay = {}) {
  const quaDai = typeof input.vanBan === 'string' && input.vanBan.length > GIOI_HAN_VAN_BAN;
  const vanBan = quaDai ? '' : (input.vanBan || '');

  // §6.1 bước 3 — có URL thì phân tích DETERMINISTIC. KHÔNG tự mở link.
  const urlList = trichUrl(vanBan);
  const san = unreadableInputFloor({ ...input, url: urlList });

  const ctx = buildContext(vanBan, { sourceId: 'van_ban' });
  const direct = directPrecheck(ctx, docNguCanhTinCay(nguCanhTinCay));
  const web = phanTichUrl(vanBan);

  /**
   * ⚠️ "AI ĐÃ ĐỌC, KHÔNG THẤY GÌ" ≠ "AI KHÔNG CHẠY" — §4.3, LẦN THỨ NĂM.
   *
   * Trước đây điều kiện có thêm `input.llmSignals.length > 0`. Hệ quả: một tin
   * nhắn LÀNH, nơi AI chạy đúng và trả về không tín hiệu nào, ra `aiDaChay:
   * false` — và §HĐ buộc frontend hiện "Lượt này không có AI đọc nội dung".
   *
   * Đo được 16/8/2026 qua HTTP: "Chào bác, mai cháu qua chơi ăn cơm nhé."
   * → 4,8 giây gọi AI thật, 0 tín hiệu, `aiDaChay:false`. App nói dối về chính
   * việc nó vừa làm.
   *
   * Trớ trêu: `aiDaChay` là trường §HĐ sinh ra ĐÚNG ĐỂ phân biệt hai chuyện đó,
   * và nó lại tự nhầm. Danh sách rỗng là một KẾT QUẢ, không phải một sự vắng mặt.
   *
   * Nay chỉ hỏi: tầng AI có chạy xong mà không lỗi không? `aiError` đã phân biệt
   * mọi ca không chạy được (chưa cấu hình khoá, timeout, mạng, khoá hết hạn).
   */
  const aiDaChay = Array.isArray(input.llmSignals) && !input.aiError;
  // §6.1 bước 7 — validate evidence TRƯỚC khi merge. Trích bịa thì loại tín hiệu.
  // Hai hàng rào, cùng thứ tự §6.1 bước 7: evidence phải có thật, RỒI scope/
  // speech act phải cho phép. Bỏ hàng rào thứ hai là để AI đi vòng qua Phụ lục C.
  const sauEvidence = aiDaChay ? locTheoEvidence(nhanTinHieuLLM(input.llmSignals), ctx) : [];
  const scope = locTheoScopeChiTiet(sauEvidence, ctx);
  const llm = scope.giu;

  /**
   * §15.8 · §6.10 — tín hiệu từ BỘ HỎI NHANH.
   * `source=user_confirmed`, `confidence=1.0`. Chúng BỔ SUNG, không xoá direct
   * signal đã có, và đi qua ĐÚNG bộ luật như mọi tín hiệu khác.
   * Đường này chạy OFFLINE, thuần luật — không chạm tới tầng AI.
   */
  const boHoiNhanh = input.traLoiBoHoiNhanh
    ? tinHieuTuTraLoi(input.traLoiBoHoiNhanh) : [];

  /**
   * §16.3 — NGƯỜI ĐƯỢC NÊU TÊN ĐÃ KÝ **TỪ CHỐI**.
   *
   * "Tôi không gửi yêu cầu này" từ chính tài khoản bị mượn danh là bằng chứng
   * mạnh nhất có thể có cho `ID_FAMILY_IMPERSONATION` — một tín hiệu ĐÃ CÓ
   * trong Phụ lục A. §12 cấm thêm tín hiệu mới, và ở đây không cần thêm.
   *
   * ⚠️ CHỈ CÓ NHÁNH LÀM TĂNG. Không có nhánh nào ở đây làm giảm: "đã xác nhận"
   * đi đường khác hẳn (tham số `nguCanhTinCay`, và chỉ TẮT được vài tín hiệu
   * chứ không trừ điểm). §4.2.
   *
   * `source='signed_denial'` — cùng hạng với `user_confirmed` của bộ hỏi nhanh:
   * con người đã trả lời, không phải model đoán.
   */
  const kyTuChoi = input.xacMinhNguoiThan === 'DA_TU_CHOI' ? [{
    id: 'ID_FAMILY_IMPERSONATION',
    state: 'present',
    source: 'signed_denial',
    confidence: 1.0,
    evidence: [{
      quote: 'DA_TU_CHOI', start: 0, end: 11, sourceId: 'khoan_proof',
    }],
  }] : [];

  const signals = ghepTinHieu([...direct, ...web, ...boHoiNhanh, ...kyTuChoi], llm);
  const nhanDuoc = signals.filter((s) => s.state === 'present').map((s) => s.id);

  const kq = decide(signals);
  const overrides = evaluateOverrides(nhanDuoc, {
    caseContext: input.caseContext,
    recoveryContext: input.recoveryContext,
  });

  // §4.3 — sàn: KHÔNG nguồn nào đọc được thì nhãn KHÔNG được là "chưa thấy".
  // Sàn chỉ LÀM TĂNG cảnh giác, không bao giờ giảm (§4.2).
  let riskLabel = kq.riskLabel;
  if (overrides.length > 0) riskLabel = 'HIGH';
  else if (san.daKiem.length === 0 && riskLabel === 'NO_SIGNS_FOUND') riskLabel = 'SUSPICIOUS';
  /**
   * §16.3 — SÀN CHO CA "HỎI NGƯỜI THÂN MÀ KHÔNG AI TRẢ LỜI".
   *
   * ⚠️ SÀN NÀY ÁP KỂ CẢ KHI VĂN BẢN ĐỌC ĐƯỢC — khác hẳn sàn ngay trên, thứ chỉ
   * chạy khi KHÔNG nguồn nào đọc được. Lý do: người dùng đã CHỦ ĐỘNG bấm "xác
   * minh yêu cầu này", tức là chính họ thấy có gì đó đáng ngờ. Không ai trả lời
   * mà app hạ xuống "chưa thấy dấu hiệu" là biến một câu hỏi chưa có lời đáp
   * thành một lời trấn an. Đúng con bug §4.3 mô tả, chỉ khác nguồn đầu vào.
   */
  if (san.chuaKiem.includes('chua_lien_lac_duoc_nguoi_than') && riskLabel === 'NO_SIGNS_FOUND') {
    riskLabel = 'SUSPICIOUS';
  }

  const chuaKiem = [...san.chuaKiem];
  // Mọi lượt chỉ có văn bản đều chưa nghe được cuộc gọi — nói ra, đừng im lặng.
  if (!chuaKiem.includes('chua_nghe_duoc_cuoc_goi')) chuaKiem.push('chua_nghe_duoc_cuoc_goi');

  const envelope = {
    nhan: nhanHopDong(riskLabel),
    maLyDo: kq.maLyDo,
    daKiem: san.daKiem,
    chuaKiem,
    hoKichBan: chonHoKichBan(nhanDuoc),
    aiDaChay,
    canThiep: chonCanThiep({ score: kq.score, overrides, caseContext: input.caseContext }),

    // ── Nội bộ: KHÔNG thuộc §HĐ. Server phải gọi toHopDong() trước khi trả ra. ──
    riskLabel,
    score: kq.score,
    baseScore: kq.baseScore,
    groupScores: kq.groupScores,
    appliedSynergies: kq.appliedSynergies,
    overrides,
    signals,
    language: ctx.language,
    activePacks: ctx.activePacks,
    // Chẩn đoán: tín hiệu AI bị hàng rào scope loại, kèm speech act của đoạn.
    loaiBoScope: scope.loai,
    speechActs: ctx.segments.map((d) => d.speechAct),
  };
  if (quaDai) envelope.loi = 'INPUT_TOO_LONG';
  return envelope;
}

/** §HĐ — ĐÚNG bảy trường. Không tự thêm, không tự đổi tên, không tự đổi kiểu. */
function toHopDong(envelope) {
  return {
    nhan: envelope.nhan,
    maLyDo: envelope.maLyDo,
    daKiem: envelope.daKiem,
    chuaKiem: envelope.chuaKiem,
    hoKichBan: envelope.hoKichBan,
    aiDaChay: envelope.aiDaChay,
    canThiep: envelope.canThiep,
  };
}

/** Mọi mã họ kịch bản backend có thể phát ra — frontend cần nhãn cho từng mã. */
const HO_KICH_BAN_MA = Object.freeze([...new Set(HO_KICH_BAN.map(([, ho]) => ho))]);

module.exports = {
  analyze, toHopDong, chonCanThiep, unreadableInputFloor,
  nhanTinHieuLLM, chonHoKichBan, HO_KICH_BAN_MA,
  NGUONG_GHI_AM, MA_LOI_GHI_AM,
};
