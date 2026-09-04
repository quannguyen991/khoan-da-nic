'use strict';
/**
 * CẢNH BÁO HAI PHÍA — một sự kiện, hai màn hình khác nhau.
 *
 * Khi bộ phát hiện ra CAO hoặc NGHI_NGO thì CẢ HAI bên cùng được báo, trong
 * CÙNG MỘT LƯỢT. Phía người thân KHÔNG phải chờ người cao tuổi bấm gì cả — đó
 * là điểm mấu chốt: người đang bị dồn ép trên điện thoại là người ít có khả
 * năng bấm nút nhất.
 *
 * ══════════════ VÌ SAO HAI DẠNG KHÁC NHAU ══════════════
 *
 * PHÍA NGƯỜI CAO TUỔI — toàn màn hình, ba dòng, đúng hai nút.
 *   Không phải thông báo nhỏ trong khay: người đang nghe kẻ gian nói không nhìn
 *   thấy thông báo nhỏ. Không có nút "bỏ qua vĩnh viễn", không có "tìm hiểu
 *   thêm", không có menu — mỗi lựa chọn thêm là một giây do dự trong lúc kẻ gian
 *   đang giục.
 *
 * PHÍA NGƯỜI THÂN — dữ kiện đầy đủ, một nút gọi.
 *   Họ tỉnh táo, họ cần biết chuyện gì. Nhãn CAO thì ĐỔ CHUÔNG như cuộc gọi
 *   đến, không phải push im lặng.
 *
 * ══════════════ BA XUNG ĐỘT VỚI HỢP ĐỒNG — ĐÃ GHI, KHÔNG ÂM THẦM LÀM THEO ══════════════
 *
 * §12: "Nếu một yêu cầu trong ảnh thiết kế mâu thuẫn với hợp đồng a11y /
 * privacy / security — HỢP ĐỒNG THẮNG. Ghi lại conflict thay vì âm thầm làm
 * theo ảnh." Ba chỗ:
 *
 *  (1) BẢN ĐẶC TẢ ĐÒI: gửi cho người thân "nội dung tin nhắn gốc".
 *      HỢP ĐỒNG NÓI: §6.9 và `dungPayloadCanhBao()` — payload cảnh báo KHÔNG
 *      mang nội dung thô. Push đi qua máy chủ của Google/Apple; nội dung tin
 *      nhắn của bác nằm trong đó là một bản sao dữ liệu nhạy cảm mà không ai
 *      xin phép.
 *      ĐÃ LÀM: push chỉ mang `canhBaoId` + nhãn + câu giải thích + thời điểm.
 *      Nội dung CHỈ được lưu vào bản ghi khi `chiaSeNoiDung` bật (mặc định TẮT),
 *      và người thân đọc được qua màn chi tiết sau khi mở app — không qua push.
 *
 *  (2) BẢN ĐẶC TẢ ĐÒI: báo đồng thời cho cả hai phía, luôn luôn.
 *      HỢP ĐỒNG NÓI: §12 — "❌ Tự bật auto-alert thay chủ tài khoản".
 *      ĐÃ LÀM: cổng là `nenTuDongCanhBao()` của `trusted-circle.js` — chủ tài
 *      khoản phải tự đặt quy tắc gia đình trước. Chưa đặt thì phía người cao
 *      tuổi vẫn hiện đủ, và nút chính đổi thành "Báo cho <tên>" — MỘT CHẠM,
 *      do bác bấm. Không im lặng bỏ qua, cũng không tự gửi thay bác.
 *
 *  (3) BẢN ĐẶC TẢ ĐÒI: hiện "Đã báo cho <tên người thân>."
 *      HỢP ĐỒNG NÓI: §9.4 và §11 — "đã gửi cho người thân" khi mới chỉ đẩy đi
 *      là nói quá; "đã đọc và hiểu" là câu bị cấm.
 *      ĐÃ LÀM: dòng thứ ba là MÃ trạng thái giao nhận, và mỗi trạng thái có câu
 *      riêng nói đúng thứ hệ thống biết. Xem `MA_DONG_BA`.
 *
 * ══════════════ TÔN TRỌNG QUYỀN TỰ CHỦ ══════════════
 * Không tự gửi vị trí. Không tự khoá máy. Không tự gọi ai. Sản phẩm chỉ báo và
 * đề nghị; người bấm luôn là người dùng.
 *
 * HÀM THUẦN + MỘT KHO. Không mạng ở đây — `guiPush` do tầng gọi cắm vào.
 */

const {
  nenTuDongCanhBao, timThanhVien, trangThaiGiaoNhan, TRANG_THAI_GIAO_NHAN,
} = require('./trusted-circle');

/** Kết quả thật của một cảnh báo. `chua_ro` là mặc định và là một giá trị HỢP LỆ. */
const KET_QUA = Object.freeze(['chua_ro', 'that', 'bao_nham']);

/**
 * Mã câu cho dòng thứ ba ở màn người cao tuổi.
 * §HĐ luật 2 — backend trả MÃ, frontend tra bảng ra câu. Đổi ngôn ngữ không
 * được làm đổi kết luận, và cũng không được làm đổi mức độ chắc chắn của câu.
 */
const MA_DONG_BA = Object.freeze({
  [TRANG_THAI_GIAO_NHAN.da_day_di]: 'da_gui_canh_bao_cho_nguoi_than',
  [TRANG_THAI_GIAO_NHAN.da_mo]: 'nguoi_than_da_mo_canh_bao',
  [TRANG_THAI_GIAO_NHAN.khong_xac_nhan_duoc]: 'chua_gui_duoc_cho_nguoi_than',
  chua_co_quy_tac: 'chua_co_quy_tac_gia_dinh',
});

/** Hai nút, không hơn. Mã hành động, không phải chữ hiển thị. */
const HANH_DONG_NGUOI_CAO_TUOI = Object.freeze(['goi_nguoi_than', 'dong']);
const HANH_DONG_KHI_CHUA_CO_QUY_TAC = Object.freeze(['bao_cho_nguoi_than', 'dong']);

/** Nhãn nào thì đổ chuông. Chỉ CAO. NGHI_NGO gom vào báo cáo cuối ngày. */
const NHAN_DO_CHUONG = new Set(['CAO']);

/** Hạn chờ xác nhận người thân đã nhận, trước khi tính đường dự phòng. */
const HAN_XAC_NHAN_MS = 60_000;

let demId = 0;
const sinhId = (thoiDiem) => {
  demId += 1;
  return `cb_${thoiDiem.toString(36)}_${demId.toString(36)}`;
};

/**
 * ════════ BẢNG `canh_bao` ════════
 * Đây chính là nguồn dữ liệu để chứng minh sản phẩm hoạt động — và cũng là
 * nguồn duy nhất để hiệu chỉnh ngưỡng (§4.6: mỗi lần bấm "Tôi ổn" là một mẫu
 * báo động giả, ghi lại để hiệu chỉnh).
 *
 * ⚠️ KHÔNG LƯU: số điện thoại thô, số tài khoản thô, OTP, evidence gốc.
 * Nội dung tin nhắn chỉ có mặt khi `chiaSeNoiDung` bật.
 */
function taoKhoCanhBao() {
  const banGhi = new Map();

  return {
    them(ghi) {
      banGhi.set(ghi.id, ghi);
      return ghi;
    },
    lay: (id) => banGhi.get(id) || null,
    tatCa: () => [...banGhi.values()],
    trongKhoang(tu, den) {
      return [...banGhi.values()].filter((g) => g.thoiDiem >= tu && g.thoiDiem < den);
    },
    capNhat(id, vaLai) {
      const g = banGhi.get(id);
      if (!g) return null;
      const moi = { ...g, ...vaLai };
      banGhi.set(id, moi);
      return moi;
    },
    coBaoNhieu: () => banGhi.size,
    xoaHet: () => banGhi.clear(),
  };
}

/**
 * MÀN NGƯỜI CAO TUỔI — toàn màn hình, ba dòng, đúng hai nút.
 *
 * ⚠️ CỠ CHỮ KHAI BẰNG MÃ VAI TRÒ, KHÔNG BẰNG SỐ PIXEL.
 * §4.4 đặt sàn ở `public/vung-cham-san.css` và nó khai theo VAI TRÒ. Nếu backend
 * trả `"20px"` thì có hai nguồn sự thật cho cỡ chữ, và bậc chữ của bác (15–22px)
 * không còn nhân lên được. `dongChinh` là vai trò; CSS quyết định con số.
 */
function manNguoiCaoTuoi(kq, { tenNguoiThan = null, trangThai = null, coQuyTac = true } = {}) {
  const maDongBa = coQuyTac
    ? (MA_DONG_BA[trangThai] || MA_DONG_BA[TRANG_THAI_GIAO_NHAN.khong_xac_nhan_duoc])
    : MA_DONG_BA.chua_co_quy_tac;

  return {
    kieu: 'toan_man_hinh',          // KHÔNG phải thông báo trong khay
    nhan: kq.nhan,
    dong1: 'khoan_da',              // "Khoan đã!" — chữ rất to
    dong2: kq.giaiThich,            // một câu, từ bộ phát hiện
    maDong2: kq.maGiaiThich,        // mã để frontend tự dịch (§HĐ luật 2)
    dong3: maDongBa,
    tenNguoiThan,
    /*
     * §4.3 — chuaKiem đi kèm và §HĐ luật 3 buộc frontend hiện nó CÙNG CỠ CHỮ
     * với nhãn. Không được rơi mất ở màn khẩn cấp, vì đây đúng là màn mà một
     * kết luận thiếu cơ sở gây hại nhất.
     */
    chuaKiem: kq.chuaKiem || [],
    hanhDong: coQuyTac ? HANH_DONG_NGUOI_CAO_TUOI : HANH_DONG_KHI_CHUA_CO_QUY_TAC,
    /*
     * §4.6 — LUÔN CÓ LỐI RA. Mức PROTECTED_CRITICAL bỏ hết điều hướng nhưng
     * dòng "Tôi ổn, không có gì nguy hiểm" phải còn. Mỗi lần bấm là một mẫu
     * báo động giả — `ghiNhanToiOn()` ghi lại để hiệu chỉnh ngưỡng.
     */
    maLoiRa: kq.canThiep === 'PROTECTED_CRITICAL' || kq.canThiep === 'PAUSE_60S'
      ? 'toi_on_khong_co_gi_nguy_hiem'
      : 'quay_lai_trang_chu',
    canThiep: kq.canThiep,
  };
}

/**
 * PUSH CHO NGƯỜI THÂN.
 *
 * ⚠️ KHÔNG CHỨA NỘI DUNG TIN NHẮN (xung đột (1) ở đầu tệp). Người thân mở app
 * mới thấy chi tiết, và chỉ thấy nội dung nếu bác đã bật chia sẻ.
 */
function pushNguoiThan(kq, { canhBaoId, tenNguoiCaoTuoi = null, thoiDiem }) {
  const doChuong = NHAN_DO_CHUONG.has(kq.nhan);
  return {
    maSuKien: 'canh_bao_hai_phia',
    canhBaoId,
    thoiDiem,
    nhan: kq.nhan,
    canThiep: kq.canThiep,
    hoKichBan: kq.hoKichBan || null,
    maGiaiThich: kq.maGiaiThich,
    tenNguoiCaoTuoi,
    /*
     * ĐỔ CHUÔNG NHƯ CUỘC GỌI ĐẾN — chỉ với nhãn CAO.
     *
     * ⚠️ GIỚI HẠN TRÌNH DUYỆT PHẢI ĐƯỢC GHI RA, KHÔNG ĐƯỢC HỨA SUÔNG:
     *   · `requireInteraction` — Chrome/Edge trên máy tính có; Firefox bỏ qua;
     *     Safari (macOS/iOS) KHÔNG hỗ trợ, thông báo tự tắt sau vài giây.
     *   · `silent: false` không đảm bảo phát âm thanh: hệ điều hành ở chế độ
     *     Không làm phiền / Focus vẫn nuốt.
     *   · `vibrate` chỉ có trên Android; iOS bỏ qua hoàn toàn.
     *   · iOS chỉ nhận Web Push khi trang đã được "Thêm vào màn hình chính".
     * Nên `doChuong` là YÊU CẦU gửi tới lớp hiển thị, KHÔNG phải lời hứa rằng
     * máy sẽ kêu. Trạng thái giao nhận vẫn theo §9.4: chưa có sự kiện mở thì
     * chỉ được nói "đã đẩy đi".
     */
    doChuong,
    tuyChonHienThi: doChuong
      ? { requireInteraction: true, silent: false, vibrate: [400, 200, 400, 200, 400], renotify: true, tag: `khoanda-cao-${canhBaoId}` }
      : { requireInteraction: false, silent: true, tag: 'khoanda-nghi-ngo' },
    /*
     * NGHI_NGO gom vào báo cáo cuối ngày thay vì bắn ngay từng cái. Một chuỗi
     * thông báo NGHI_NGO trong ngày dạy người ta tắt hết thông báo, rồi cái CAO
     * cũng chìm theo.
     */
    gomVaoBaoCaoNgay: !doChuong,
    hanhDong: ['goi_cho_bo_me_ngay', 'danh_dau_bao_nham'],
  };
}

/**
 * PHÁT CẢNH BÁO — cả hai phía, CÙNG MỘT LƯỢT.
 *
 * @param {object} kq        kết quả `detect.analyze()`
 * @param {object} vongTron  vòng tròn gia đình (`trusted-circle`)
 * @param {object} kho       kho `canh_bao`
 * @param {Function} guiPush async (payload, nguoiNhanId) => { endpointOk:boolean }
 * @param {object} tuyChon   { thoiDiem, tenNguoiCaoTuoi, tenNguoiThan, chiaSeNoiDung, noiDung, huyLanNay }
 */
async function phatCanhBao({ kq, vongTron, kho, guiPush, ...tuyChon }) {
  const thoiDiem = Number(tuyChon.thoiDiem) || Date.now();

  // Nhãn CHUA_THAY không phát cảnh báo — nhưng vẫn được đếm ở báo cáo tuần.
  if (kq.nhan === 'CHUA_THAY') {
    return { phat: false, ly: 'nhan_chua_thay', canhBaoId: null };
  }

  const cong = nenTuDongCanhBao(vongTron, {
    canThiep: kq.canThiep,
    huyLanNay: tuyChon.huyLanNay === true,
  });

  /*
   * ⚠️ CỔNG ĐÓNG KHÔNG CÓ NGHĨA LÀ IM LẶNG. Phía người cao tuổi VẪN hiện đủ.
   * Chỉ có việc gửi cho người thân là do bác bấm, chứ không tự động.
   */
  const nguoiNhanId = cong.gui ? cong.nguoiNhanId : null;
  const nguoiNhan = nguoiNhanId ? timThanhVien(vongTron, nguoiNhanId) : null;
  const id = sinhId(thoiDiem);

  let endpointOk = false;
  let loiGui = null;
  let payloadNguoiThan = null;

  if (cong.gui) {
    payloadNguoiThan = pushNguoiThan(kq, {
      canhBaoId: id, tenNguoiCaoTuoi: tuyChon.tenNguoiCaoTuoi ?? null, thoiDiem,
    });
    try {
      const ra = typeof guiPush === 'function' ? await guiPush(payloadNguoiThan, nguoiNhanId) : null;
      endpointOk = ra?.endpointOk === true;
      if (!endpointOk) loiGui = ra?.ma || 'PUSH_DELIVERY_UNKNOWN';
    } catch (e) {
      // §6.7 — `PUSH_DELIVERY_UNKNOWN` là TRẠNG THÁI HỢP LỆ, không phải lỗi cần giấu.
      endpointOk = false;
      loiGui = e?.ma || 'PUSH_DELIVERY_UNKNOWN';
    }
  }

  const trangThai = cong.gui
    ? trangThaiGiaoNhan({ endpointOk, coSuKienMo: false })
    : null;

  const ghi = kho.them({
    id,
    thoiDiem,
    nhan: kq.nhan,
    canThiep: kq.canThiep,
    diem: kq.diem,
    luatKhopVoi: kq.luatKhopVoi || [],
    maLyDo: kq.maLyDo || [],
    maGiaiThich: kq.maGiaiThich,
    nguon: kq.nguon,
    phienBanLuat: kq.phienBanLuat,
    // §6.9 — người gửi đã được che ở tầng phát hiện; không lưu bản thô.
    nguoiGuiDaChe: kq.nguoiGui ?? null,

    // Ai nhận được gì
    nguoiCaoTuoiDaHien: true,
    nguoiThanId: nguoiNhanId,
    nguoiThanDaDay: cong.gui ? endpointOk : false,
    nguoiThanDaMo: false,
    nguoiThanDaBamGoi: false,
    trangThaiGiaoNhan: trangThai,
    lyKhongGui: cong.gui ? loiGui : cong.lyDo,

    // Kết quả thật — điền sau, và `chua_ro` là câu trả lời trung thực nhất
    // cho phần lớn bản ghi.
    ketQua: 'chua_ro',
    nguoiCaoTuoiBamToiOn: false,

    // Nội dung: MẶC ĐỊNH KHÔNG LƯU.
    chiaSeNoiDung: tuyChon.chiaSeNoiDung === true,
    noiDung: tuyChon.chiaSeNoiDung === true ? (tuyChon.noiDung ?? null) : null,
  });

  return {
    phat: true,
    canhBaoId: id,
    nguoiCaoTuoi: manNguoiCaoTuoi(kq, {
      tenNguoiThan: tuyChon.tenNguoiThan ?? nguoiNhan?.ten ?? null,
      trangThai,
      coQuyTac: cong.gui,
    }),
    nguoiThan: payloadNguoiThan,
    lyKhongGuiNguoiThan: cong.gui ? null : cong.lyDo,
  };
}

/** Người thân mở cảnh báo. §9.4 — đây là sự kiện GHI AUDIT ĐƯỢC, nên nói được. */
const ghiNhanMo = (kho, id, luc = Date.now()) => kho.capNhat(id, {
  nguoiThanDaMo: true,
  moLuc: luc,
  trangThaiGiaoNhan: TRANG_THAI_GIAO_NHAN.da_mo,
});

/** Người thân bấm gọi. Đây là hành vi ĐÚNG cần khuyến khích nhất. */
const ghiNhanBamGoi = (kho, id, luc = Date.now()) => kho.capNhat(id, {
  nguoiThanDaBamGoi: true, bamGoiLuc: luc,
});

/**
 * §4.6 — người cao tuổi bấm "Tôi ổn, không có gì nguy hiểm".
 * ⚠️ KHÔNG hạ nhãn của bản ghi. Nhãn là thứ bộ luật đã kết luận; nút này ghi
 * lại BẤT ĐỒNG của người dùng, để hiệu chỉnh ngưỡng sau. Sửa nhãn tại đây là
 * xoá mất chính dữ liệu cần đo.
 */
const ghiNhanToiOn = (kho, id, luc = Date.now()) => kho.capNhat(id, {
  nguoiCaoTuoiBamToiOn: true, toiOnLuc: luc,
});

/** Người thân đánh dấu báo nhầm — dữ liệu cải thiện luật, vào thẳng kho. */
function danhDauKetQua(kho, id, ketQua, boi = null) {
  if (!KET_QUA.includes(ketQua)) throw new Error(`Kết quả không hợp lệ: ${ketQua}`);
  return kho.capNhat(id, { ketQua, ketQuaBoi: boi, ketQuaLuc: Date.now() });
}

/**
 * ĐƯỜNG DỰ PHÒNG KHI NGƯỜI THÂN KHÔNG NHẬN ĐƯỢC TRONG 60 GIÂY.
 *
 * ⚠️ CHƯA CẮM NHÀ CUNG CẤP NÀO — HÀM NÀY CHỈ QUYẾT ĐỊNH "CÓ CẦN HAY KHÔNG".
 * Nó KHÔNG gửi SMS, KHÔNG gọi tự động, và cố ý như vậy:
 *
 *   TODO(cắm nhà cung cấp SMS) — cần trước khi bật:
 *     · hợp đồng brandname với nhà mạng (SMS từ số thường sẽ bị lọc spam,
 *       và mỉa mai thay, chính nó lại trông giống tin lừa đảo)
 *     · người thân đồng ý nhận SMS, có đường tắt
 *     · giới hạn tần suất — 60 giây × nhiều lượt = một trận bão tin nhắn
 *   TODO(gọi tự động) — §12 cấm "tự hứa chặn cuộc gọi"; gọi tự động thay người
 *     dùng cần một lần bàn riêng với chủ tài khoản, KHÔNG tự bật.
 *
 * Trả về ĐỀ NGHỊ, để tầng gọi (hoặc con người) quyết định. Không tự làm.
 */
function canDuongDuPhong(banGhi, bayGio = Date.now()) {
  if (!banGhi) return { can: false, ly: 'khong_co_ban_ghi' };
  if (banGhi.nhan !== 'CAO') return { can: false, ly: 'chi_ap_cho_nhan_cao' };
  if (banGhi.nguoiThanDaMo) return { can: false, ly: 'nguoi_than_da_mo' };
  if (bayGio - banGhi.thoiDiem < HAN_XAC_NHAN_MS) return { can: false, ly: 'chua_qua_60_giay' };
  return {
    can: true,
    ly: banGhi.nguoiThanDaDay ? 'day_di_nhung_khong_co_xac_nhan_mo' : 'khong_day_di_duoc',
    deNghi: ['sms_du_phong', 'bao_nguoi_du_phong'],
    daCam: ['tu_dong_goi_thay_nguoi_dung'],   // §12
  };
}

/** Tổng hợp cho báo cáo — đếm thuần, không suy diễn. */
function tongHop(danhSach = []) {
  const d = { tong: danhSach.length, cao: 0, nghiNgo: 0, daDay: 0, daMo: 0, daBamGoi: 0, baoNham: 0, that: 0, chuaRo: 0, toiOn: 0 };
  for (const g of danhSach) {
    if (g.nhan === 'CAO') d.cao += 1;
    if (g.nhan === 'NGHI_NGO') d.nghiNgo += 1;
    if (g.nguoiThanDaDay) d.daDay += 1;
    if (g.nguoiThanDaMo) d.daMo += 1;
    if (g.nguoiThanDaBamGoi) d.daBamGoi += 1;
    if (g.nguoiCaoTuoiBamToiOn) d.toiOn += 1;
    if (g.ketQua === 'bao_nham') d.baoNham += 1;
    else if (g.ketQua === 'that') d.that += 1;
    else d.chuaRo += 1;
  }
  return d;
}

module.exports = {
  taoKhoCanhBao, phatCanhBao, manNguoiCaoTuoi, pushNguoiThan,
  ghiNhanMo, ghiNhanBamGoi, ghiNhanToiOn, danhDauKetQua,
  canDuongDuPhong, tongHop,
  KET_QUA, MA_DONG_BA, NHAN_DO_CHUONG, HAN_XAC_NHAN_MS,
  HANH_DONG_NGUOI_CAO_TUOI, HANH_DONG_KHI_CHUA_CO_QUY_TAC,
};
