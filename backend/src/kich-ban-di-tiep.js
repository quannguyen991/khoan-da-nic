'use strict';
/**
 * §16.1 — KỊCH BẢN ĐI TIẾP. Dự báo các bước kế tiếp của một họ lừa đảo.
 *
 * VÌ SAO DỰ BÁO CHỨ KHÔNG PHẢI PHÁN XÉT:
 * Mọi app khác trả về một PHÁN XÉT, mà phán xét thì cãi được — kẻ lừa đảo đã
 * dặn trước "lát nữa có app bảo đây là lừa đảo, bác đừng nghe". Dự báo thì
 * không cãi được, vì chính kẻ lừa đảo sẽ xác minh nó trong vài phút.
 *
 * ⚠️ HẠNG MỤC NÀY NẰM SAU decision-engine VÀ CHỈ ĐỂ HIỂN THỊ.
 * Nó KHÔNG BAO GIỜ được đụng vào `nhan` hay điểm số (§4.2). Không thêm tín hiệu
 * vào Phụ lục A, không thêm override. Hàng rào: test/kich-ban-khong-ha-muc.test.js
 * chạy 445 mẫu hai lượt và đòi không mẫu nào tụt mức.
 *
 * ⚠️ HÀM THUẦN. Không mạng, không AI, không đọc đồng hồ. Chạy được khi mất mạng.
 *
 * ⚠️ §HĐ luật 2 — TRẢ VỀ MÃ, KHÔNG TRẢ CÂU. Frontend tra catalog để ra chữ.
 * Điều đó khiến đổi ngôn ngữ không thể làm đổi nội dung dự báo.
 *
 * ─── NGUỒN NỘI DUNG ───
 * Bảng dưới đây RÚT TỪ 445 mẫu trong eval/dataset/, đọc theo trường `ho`. Đây là
 * việc đọc dữ liệu, không phải việc suy đoán. Họ nào dữ liệu không đủ thì để
 * trống và khai ra ở `HO_CHUA_CO_DU_LIEU` — KHÔNG bịa.
 *
 * ─── §11, CHỖ TÍNH NĂNG NÀY DỄ TRƯỢT NHẤT ───
 * Bản chất nó đang LIỆT KÊ CÁC BƯỚC, nên rất dễ trượt sang khẳng định một dấu
 * hiệu VẮNG MẶT ("chưa thấy họ đòi OTP") — thứ §11 cấm thẳng. Nên:
 *   · mã bước luôn mô tả điều CÓ THỂ XẢY RA, không bao giờ điều chưa xảy ra;
 *   · frontend phải dùng khung "kịch bản này THƯỜNG đi tiếp như sau", không phải
 *     "họ SẼ nói"; ràng buộc đó ghi ở catalog, và test chặn tên mã ở đây.
 */

const { GIAI_DOAN } = require('./journey-engine');

/**
 * MÃ BƯỚC — danh sách đóng. Frontend cần một mục catalog VI + EN cho từng mã.
 * Đặt tên theo HÀNH VI CỦA KẺ LỪA ĐẢO, không theo cảm xúc của người dùng.
 */
const MA_BUOC = Object.freeze({
  // Tiếp cận / dựng lòng tin
  TU_XUNG_CO_QUAN_TO_TUNG: 'TU_XUNG_CO_QUAN_TO_TUNG',
  TU_XUNG_NHAN_VIEN_NGAN_HANG: 'TU_XUNG_NHAN_VIEN_NGAN_HANG',
  TU_XUNG_HO_TRO_KY_THUAT: 'TU_XUNG_HO_TRO_KY_THUAT',
  BAO_DOI_SO_DIEN_THOAI: 'BAO_DOI_SO_DIEN_THOAI',
  NHAN_MINH_LA_NGUOI_QUEN: 'NHAN_MINH_LA_NGUOI_QUEN',
  BAO_CO_KIEN_HANG: 'BAO_CO_KIEN_HANG',
  BAO_TRUNG_THUONG_NHAN_QUA: 'BAO_TRUNG_THUONG_NHAN_QUA',
  MOI_VIEC_NHE_LUONG_CAO: 'MOI_VIEC_NHE_LUONG_CAO',
  MOI_VAO_NHOM_LOP_HOC: 'MOI_VAO_NHOM_LOP_HOC',
  NHAC_LAI_VU_DA_BI_LUA: 'NHAC_LAI_VU_DA_BI_LUA',
  XAY_DUNG_TINH_CAM_TU_XA: 'XAY_DUNG_TINH_CAM_TU_XA',
  NHO_QUET_MA_QR: 'NHO_QUET_MA_QR',
  CAM_KET_LOI_NHUAN_BAO_TOAN_VON: 'CAM_KET_LOI_NHUAN_BAO_TOAN_VON',
  CHO_LAM_NHIEM_VU_NHO_TRA_TIEN_THAT: 'CHO_LAM_NHIEM_VU_NHO_TRA_TIEN_THAT',
  NOI_DA_TIM_THAY_TIEN: 'NOI_DA_TIM_THAY_TIEN',

  // Gây áp lực
  NOI_BAC_DANG_BI_DIEU_TRA: 'NOI_BAC_DANG_BI_DIEU_TRA',
  DOA_BAT_GIU_KHOI_TO: 'DOA_BAT_GIU_KHOI_TO',
  BAO_TAI_KHOAN_CO_GIAO_DICH_LA: 'BAO_TAI_KHOAN_CO_GIAO_DICH_LA',
  DOA_KHOA_TAI_KHOAN: 'DOA_KHOA_TAI_KHOAN',
  BAO_MAY_NHIEM_VIRUS: 'BAO_MAY_NHIEM_VIRUS',
  NOI_HANG_BI_GIU_O_KHO: 'NOI_HANG_BI_GIU_O_KHO',
  KE_CHUYEN_KHAN_CAP: 'KE_CHUYEN_KHAN_CAP',
  DAT_HAN_CHOT_RAT_GAP: 'DAT_HAN_CHOT_RAT_GAP',

  // Cô lập
  CAM_KE_CHO_NGUOI_NHA: 'CAM_KE_CHO_NGUOI_NHA',
  XIN_DUNG_KE_CHO_NGUOI_KHAC: 'XIN_DUNG_KE_CHO_NGUOI_KHAC',
  BAT_GIU_MAY_LIEN_TUC: 'BAT_GIU_MAY_LIEN_TUC',

  // Đòi hành động
  DOI_CHUYEN_SANG_TAI_KHOAN_AN_TOAN: 'DOI_CHUYEN_SANG_TAI_KHOAN_AN_TOAN',
  DOI_CHUYEN_TIEN_TAI_KHOAN_LA: 'DOI_CHUYEN_TIEN_TAI_KHOAN_LA',
  DOI_DOC_MA_XAC_MINH: 'DOI_DOC_MA_XAC_MINH',
  DOI_DANG_NHAP_QUA_DUONG_DAN: 'DOI_DANG_NHAP_QUA_DUONG_DAN',
  DOI_SO_THE_VA_MA_CVV: 'DOI_SO_THE_VA_MA_CVV',
  DOI_CAI_UNG_DUNG_THEO_DUONG_DAN: 'DOI_CAI_UNG_DUNG_THEO_DUONG_DAN',
  DOI_CAI_UNG_DUNG_DIEU_KHIEN_TU_XA: 'DOI_CAI_UNG_DUNG_DIEU_KHIEN_TU_XA',
  DOI_CHIA_SE_MAN_HINH_NGAN_HANG: 'DOI_CHIA_SE_MAN_HINH_NGAN_HANG',
  DOI_PHI_UNG_TRUOC: 'DOI_PHI_UNG_TRUOC',
  DOI_NAP_VON_BAN_DAU: 'DOI_NAP_VON_BAN_DAU',
  DOI_RUT_TIEN_MAT_TAI_ATM: 'DOI_RUT_TIEN_MAT_TAI_ATM',
  DOI_GIAO_TIEN_MAT_TAN_NHA: 'DOI_GIAO_TIEN_MAT_TAN_NHA',
  DOI_MUA_THE_CAO: 'DOI_MUA_THE_CAO',

  // Móc thêm — quay lại sau khi đã lấy được lần đầu
  DOI_NAP_THEM_DE_RUT_DUOC: 'DOI_NAP_THEM_DE_RUT_DUOC',
  DOI_NANG_GOI_DE_TANG_HOA_HONG: 'DOI_NANG_GOI_DE_TANG_HOA_HONG',
  DOI_NAP_LAI_VI_THAO_TAC_SAI: 'DOI_NAP_LAI_VI_THAO_TAC_SAI',
  DOI_NOP_THUE_PHI_DE_RUT: 'DOI_NOP_THUE_PHI_DE_RUT',
});

const B = MA_BUOC;
const b = (maBuoc, giaiDoan, tinHieuSeThay) => Object.freeze({
  maBuoc, giaiDoan, tinHieuSeThay: Object.freeze(tinHieuSeThay),
});

/**
 * BẢNG KỊCH BẢN. Khoá là mã họ trong `HO_KICH_BAN` của src/analysis/pipeline.js
 * — cùng không gian tên với trường `hoKichBan` trong §HĐ.
 *
 * Mỗi bước phải TRUY NGƯỢC ĐƯỢC về mẫu trong dataset. Comment ghi câu gốc.
 */
const KICH_BAN = Object.freeze({
  /**
   * 32 mẫu: ho=gia_danh_cong_an (12) · authority_impersonation (14)
   *         · gia_danh_co_quan (6)
   */
  gia_danh_cong_an: Object.freeze([
    // "Tôi là điều tra viên Phòng Cảnh sát kinh tế." · "Đây là Viện kiểm sát nhân dân."
    b(B.TU_XUNG_CO_QUAN_TO_TUNG, 'tao_long_tin', ['ID_AUTHORITY_IMPERSONATION']),
    // "Căn cước của bà đang đứng tên một tài khoản có dòng tiền rửa từ đường dây ma tuý."
    b(B.NOI_BAC_DANG_BI_DIEU_TRA, 'gay_ap_luc', ['MAN_FEAR_THREAT', 'MAN_COVER_STORY']),
    // "Ông có một lệnh bắt tạm giam đã được ký, hiệu lực từ chiều nay."
    b(B.DOA_BAT_GIU_KHOI_TO, 'gay_ap_luc', ['MAN_FEAR_THREAT']),
    // "Bà mà kể cho con trai bà là bà bị khởi tố thêm tội tiết lộ bí mật."
    b(B.CAM_KE_CHO_NGUOI_NHA, 'co_lap', ['MAN_SECRECY', 'MAN_ISOLATION']),
    // "chú giữ máy đấy nhé, ko được tắt"
    b(B.BAT_GIU_MAY_LIEN_TUC, 'co_lap', ['MAN_KEEP_CALL_ACTIVE']),
    // "chuyển sang tài khoản tạm giữ do cơ quan điều tra chỉ định"
    b(B.DOI_CHUYEN_SANG_TAI_KHOAN_AN_TOAN, 'doi_hanh_dong',
      ['FIN_SAFE_ACCOUNT', 'FIN_TRANSFER_REQUEST', 'FIN_ORG_CLAIM_PERSONAL_ACCOUNT']),
    // "hệ thống vừa gửi một mã sáu số về máy cô. Cô đọc mã đó cho tôi"
    b(B.DOI_DOC_MA_XAC_MINH, 'doi_hanh_dong', ['CRED_OTP_SHARE']),
    // "Bác tải ứng dụng Bộ Công an theo đường dẫn tôi gửi rồi đăng nhập"
    b(B.DOI_CAI_UNG_DUNG_THEO_DUONG_DAN, 'doi_hanh_dong',
      ['DEV_INSTALL_APK_UNKNOWN', 'WEB_NONOFFICIAL_APP_SOURCE']),
    // "chú ra cây ATM rút hết tiền ra rồi tôi hướng dẫn nộp"
    b(B.DOI_RUT_TIEN_MAT_TAI_ATM, 'doi_hanh_dong', ['FIN_CASH_COURIER']),
  ]),

  /** 22 mẫu: ho=gia_danh_ngan_hang (18) · bank_impersonation (4) */
  gia_danh_ngan_hang: Object.freeze([
    // "Em gọi từ trung tâm thẻ ạ."
    b(B.TU_XUNG_NHAN_VIEN_NGAN_HANG, 'tao_long_tin', ['ID_BANK_IMPERSONATION']),
    // "Tài khoản của cô vừa có giao dịch 43 triệu ở nước ngoài lúc 2 giờ sáng."
    b(B.BAO_TAI_KHOAN_CO_GIAO_DICH_LA, 'gay_ap_luc', ['MAN_COVER_STORY']),
    // "Tài khoản của quý khách đã bị tạm khoá… quá hạn sẽ bị huỷ."
    b(B.DOA_KHOA_TAI_KHOAN, 'gay_ap_luc', ['MAN_FEAR_THREAT', 'MAN_URGENCY']),
    // "Vui lòng đăng nhập tại [đường dẫn] trong 24h để mở khoá."
    b(B.DOI_DANG_NHAP_QUA_DUONG_DAN, 'doi_hanh_dong',
      ['CRED_BANK_LOGIN', 'WEB_BRAND_DOMAIN_MISMATCH']),
    // "Vui lòng cập nhật số thẻ, ngày hết hạn và ba số ở mặt sau."
    b(B.DOI_SO_THE_VA_MA_CVV, 'doi_hanh_dong', ['CRED_CARD_SECRET']),
    // "cô bật chia sẻ màn hình rồi mở ứng dụng ngân hàng lên"
    b(B.DOI_CHIA_SE_MAN_HINH_NGAN_HANG, 'doi_hanh_dong', ['DEV_SCREEN_SHARE_BANKING']),
    // "chuyển tạm số dư sang một tài khoản bảo vệ do bên em cấp"
    b(B.DOI_CHUYEN_SANG_TAI_KHOAN_AN_TOAN, 'doi_hanh_dong',
      ['FIN_SAFE_ACCOUNT', 'FIN_TRANSFER_REQUEST']),
    // "Chú chuyển trước 1.500.000đ phí phát hành."
    b(B.DOI_PHI_UNG_TRUOC, 'doi_hanh_dong', ['OFF_ADVANCE_FEE', 'FIN_TRANSFER_REQUEST']),
  ]),

  /** 18 mẫu: ho=gia_nguoi_than (12) · gia_nguoi_than_tinh_cam (6) */
  gia_danh_nguoi_than: Object.freeze([
    // "Mẹ ơi con đổi số mới rồi, số cũ hỏng sim."
    b(B.BAO_DOI_SO_DIEN_THOAI, 'tiep_can', ['ID_FAMILY_IMPERSONATION']),
    // "Cháu là bạn cùng phòng của anh Nam."
    b(B.NHAN_MINH_LA_NGUOI_QUEN, 'tao_long_tin', ['ID_FAMILY_EMERGENCY_THIRD_PARTY']),
    // "Anh ấy bị tai nạn xe đang cấp cứu." · "cháu đang bị công an giữ ở phường"
    b(B.KE_CHUYEN_KHAN_CAP, 'gay_ap_luc', ['MAN_COVER_STORY', 'MAN_URGENCY']),
    // "mẹ đừng kể với bố nhé, con không muốn bố lo"
    b(B.XIN_DUNG_KE_CHO_NGUOI_KHAC, 'co_lap', ['MAN_SECRECY']),
    // "mẹ chuyển giúp con 35 triệu vào số 9999 8888 7777"
    b(B.DOI_CHUYEN_TIEN_TAI_KHOAN_LA, 'doi_hanh_dong',
      ['FIN_TRANSFER_REQUEST', 'FIN_NEW_RECIPIENT', 'FIN_RECIPIENT_NAME_MISMATCH']),
  ]),

  /** 4 mẫu: ho=family_emergency. Mỏng — chỉ giữ bước có mẫu đỡ. */
  bao_tin_nguoi_than_gap_nan: Object.freeze([
    b(B.NHAN_MINH_LA_NGUOI_QUEN, 'tao_long_tin', ['ID_FAMILY_EMERGENCY_THIRD_PARTY']),
    b(B.KE_CHUYEN_KHAN_CAP, 'gay_ap_luc', ['MAN_COVER_STORY', 'MAN_URGENCY']),
    b(B.DOI_CHUYEN_TIEN_TAI_KHOAN_LA, 'doi_hanh_dong',
      ['FIN_TRANSFER_REQUEST', 'FIN_NEW_RECIPIENT']),
    b(B.DOI_MUA_THE_CAO, 'doi_hanh_dong', ['FIN_GIFT_CARD_PAYMENT']),
  ]),

  /** 6 mẫu: ho=chiem_tk_mang_xa_hoi */
  tai_khoan_nguoi_than_bi_chiem: Object.freeze([
    b(B.NHAN_MINH_LA_NGUOI_QUEN, 'tao_long_tin', ['ID_CONTACT_ACCOUNT_TAKEOVER']),
    b(B.KE_CHUYEN_KHAN_CAP, 'gay_ap_luc', ['MAN_COVER_STORY', 'MAN_URGENCY']),
    b(B.DOI_CHUYEN_TIEN_TAI_KHOAN_LA, 'doi_hanh_dong',
      ['FIN_TRANSFER_REQUEST', 'FIN_NEW_RECIPIENT']),
    b(B.DOI_DOC_MA_XAC_MINH, 'doi_hanh_dong', ['CRED_OTP_SHARE']),
  ]),

  /**
   * 35 mẫu: ho=delivery_customs_fee (17) · phi_giao_hang_luu_kho (12)
   *         · phi_giao_hang_mua_sam (6)
   */
  gia_danh_giao_hang: Object.freeze([
    // "A large package in your name arrived from overseas."
    b(B.BAO_CO_KIEN_HANG, 'tiep_can', ['ID_DELIVERY_IMPERSONATION']),
    // "Your parcel is held for a storage fee." · "or it gets sent back tonite"
    b(B.NOI_HANG_BI_GIU_O_KHO, 'gay_ap_luc', ['MAN_COVER_STORY', 'MAN_SCARCITY_PRESSURE']),
    // "dont hang up driver cant release box without security check"
    b(B.BAT_GIU_MAY_LIEN_TUC, 'co_lap', ['MAN_KEEP_CALL_ACTIVE']),
    // "transfer payment to test account… to schedule delivery today"
    b(B.DOI_PHI_UNG_TRUOC, 'doi_hanh_dong', ['OFF_ADVANCE_FEE', 'FIN_TRANSFER_REQUEST']),
    // "code just sent to ur phone read all 6 digits now"
    b(B.DOI_DOC_MA_XAC_MINH, 'doi_hanh_dong', ['CRED_OTP_SHARE']),
    // "Install the tracking app from parcel-release.invalid"
    b(B.DOI_CAI_UNG_DUNG_THEO_DUONG_DAN, 'doi_hanh_dong',
      ['DEV_INSTALL_APK_UNKNOWN', 'WEB_NONOFFICIAL_APP_SOURCE']),
  ]),

  /** 22 mẫu: ho=tuyen_ctv (12) · tuyen_ctv_viec_lam (6) · task_job_scam (4) */
  gia_danh_tuyen_dung: Object.freeze([
    // "Tuyen CTV lam viec tai nha, thu nhap 500k-1tr/ngay, khong can kinh nghiem."
    b(B.MOI_VIEC_NHE_LUONG_CAO, 'tiep_can', ['ID_EMPLOYER_JOB_IMPERSONATION']),
    // "Nhiệm vụ đầu tiên chị ứng 300.000đ tiền đơn hàng, hệ thống hoàn lại."
    b(B.CHO_LAM_NHIEM_VU_NHO_TRA_TIEN_THAT, 'tao_long_tin', ['OFF_TASK_PREPAY']),
    // "ko het slot bay h"
    b(B.DAT_HAN_CHOT_RAT_GAP, 'gay_ap_luc', ['MAN_SCARCITY_PRESSURE', 'MAN_URGENCY']),
    // "Muốn nhận nhiệm vụ trả cao thì cô nạp vốn khởi điểm 2 triệu vào ví hệ thống."
    b(B.DOI_NAP_VON_BAN_DAU, 'doi_hanh_dong', ['OFF_TASK_PREPAY', 'FIN_TRANSFER_REQUEST']),
    // "Đơn của chị bị lỗi hệ thống nên chưa rút được. Chị cần nạp thêm 4.800.000đ."
    b(B.DOI_NAP_THEM_DE_RUT_DUOC, 'moc_them',
      ['FIN_REPEATED_TRANSFER_PRESSURE', 'FIN_TRANSFER_REQUEST']),
    // "Chị nâng lên gói Bạc bằng cách nạp 8 triệu, hoa hồng tăng gấp ba."
    b(B.DOI_NANG_GOI_DE_TANG_HOA_HONG, 'moc_them',
      ['OFF_CONTRACT_EXIT_UPSELL', 'FIN_REPEATED_TRANSFER_PRESSURE']),
    // "Lệnh rút của chị bị treo do thao tác sai cú pháp. Chị nạp lại đúng số tiền."
    b(B.DOI_NAP_LAI_VI_THAO_TAC_SAI, 'moc_them', ['FIN_REPEATED_TRANSFER_PRESSURE']),
  ]),

  /** 31 mẫu: ho=dau_tu (12) · crypto_investment (13) · tuyen_sinh_dau_tu_khac (6) */
  du_dau_tu_loi_nhuan_cao: Object.freeze([
    // "Chú tham gia lớp học đầu tư miễn phí của bên cháu không ạ."
    b(B.MOI_VAO_NHOM_LOP_HOC, 'tiep_can', ['OFF_HIGH_VALUE_CONTRACT']),
    // "Sàn bên em cam kết lợi nhuận 20% mỗi tháng, có hợp đồng bảo hiểm vốn."
    b(B.CAM_KET_LOI_NHUAN_BAO_TOAN_VON, 'tao_long_tin', ['OFF_INVESTMENT_GUARANTEE']),
    // "Anh chuyển vốn vào ví hệ thống trước 14h để kịp phiên."
    b(B.DAT_HAN_CHOT_RAT_GAP, 'gay_ap_luc', ['MAN_SCARCITY_PRESSURE', 'MAN_URGENCY']),
    // "cô chỉ cần nạp 50 triệu vốn ban đầu là hệ thống tự chạy"
    b(B.DOI_NAP_VON_BAN_DAU, 'doi_hanh_dong',
      ['FIN_TRANSFER_REQUEST', 'FIN_CRYPTO_TRANSFER']),
    // "Để rút, cô cần nộp trước 12% thuế thu nhập là 40.800.000đ."
    b(B.DOI_NOP_THUE_PHI_DE_RUT, 'moc_them',
      ['OFF_ADVANCE_FEE', 'FIN_REPEATED_TRANSFER_PRESSURE']),
  ]),

  /**
   * 22 mẫu: ho=phi_lay_lai_tien (12) · phi_lay_lai_tien_vay_app (6)
   *         · recovery_scam (4)
   * ⚠️ ĐÂY LÀ HỌ NGUY HIỂM NHẤT VỚI NGƯỜI ĐÃ MẤT TIỀN MỘT LẦN.
   */
  lua_lay_lai_tien: Object.freeze([
    // "Anh từng báo bị lừa tiền qua mạng phải không?"
    b(B.NHAC_LAI_VU_DA_BI_LUA, 'tiep_can', ['ID_RECOVERY_SUPPORT_IMPERSONATION']),
    // "Hồ sơ của bác đã truy ra được dòng tiền." · "tiền của chú tìm thấy r nha"
    b(B.NOI_DA_TIM_THAY_TIEN, 'tao_long_tin', ['MAN_COVER_STORY']),
    // "trễ là bên kia rút mất"
    b(B.DAT_HAN_CHOT_RAT_GAP, 'gay_ap_luc', ['MAN_URGENCY', 'MAN_SCARCITY_PRESSURE']),
    // "bác chuyển trước 1.500.000đ phí mở lệnh"
    b(B.DOI_PHI_UNG_TRUOC, 'doi_hanh_dong', ['FIN_RECOVERY_FEE', 'OFF_ADVANCE_FEE']),
    // "Cô cài ứng dụng 'Thu hồi tài sản' tại khoiphuc-tien.invalid rồi bật chia sẻ màn hình."
    b(B.DOI_CHIA_SE_MAN_HINH_NGAN_HANG, 'doi_hanh_dong',
      ['DEV_SCREEN_SHARE_BANKING', 'DEV_INSTALL_APK_UNKNOWN']),
    // "Chiều nay nhân viên pháp lý sẽ tới nhận 10 triệu tiền mặt làm khoản bảo chứng."
    b(B.DOI_GIAO_TIEN_MAT_TAN_NHA, 'doi_hanh_dong', ['FIN_CASH_COURIER']),
  ]),

  /** Cùng nguồn dữ liệu với `lua_lay_lai_tien` — hai tín hiệu khác nhau, một kịch bản. */
  gia_danh_ho_tro_lay_lai_tien: Object.freeze([
    b(B.NHAC_LAI_VU_DA_BI_LUA, 'tiep_can', ['ID_RECOVERY_SUPPORT_IMPERSONATION']),
    b(B.NOI_DA_TIM_THAY_TIEN, 'tao_long_tin', ['MAN_COVER_STORY']),
    b(B.DAT_HAN_CHOT_RAT_GAP, 'gay_ap_luc', ['MAN_URGENCY', 'MAN_SCARCITY_PRESSURE']),
    b(B.DOI_PHI_UNG_TRUOC, 'doi_hanh_dong', ['FIN_RECOVERY_FEE', 'OFF_ADVANCE_FEE']),
    b(B.DOI_CHIA_SE_MAN_HINH_NGAN_HANG, 'doi_hanh_dong',
      ['DEV_SCREEN_SHARE_BANKING', 'DEV_INSTALL_APK_UNKNOWN']),
    b(B.DOI_GIAO_TIEN_MAT_TAN_NHA, 'doi_hanh_dong', ['FIN_CASH_COURIER']),
  ]),

  /** 16 mẫu: ho=lua_tinh_cam (12) · romance_scam (4) */
  lua_tinh_cam: Object.freeze([
    b(B.XAY_DUNG_TINH_CAM_TU_XA, 'tao_long_tin', ['MAN_LOVE_BOMBING']),
    // "vali quà chú gửi đang bị cơ quan nước ngoài giữ"
    b(B.KE_CHUYEN_KHAN_CAP, 'gay_ap_luc', ['OFF_ROMANCE_EMERGENCY', 'MAN_URGENCY']),
    // "họ yêu cầu đóng tiền bảo lãnh trong hôm nay"
    b(B.DOI_PHI_UNG_TRUOC, 'doi_hanh_dong', ['OFF_ADVANCE_FEE', 'FIN_TRANSFER_REQUEST']),
    b(B.DOI_CHUYEN_TIEN_TAI_KHOAN_LA, 'doi_hanh_dong',
      ['FIN_TRANSFER_REQUEST', 'FIN_NEW_RECIPIENT']),
  ]),

  /** 15 mẫu: ho=tech_support */
  gia_danh_ho_tro_ky_thuat: Object.freeze([
    b(B.TU_XUNG_HO_TRO_KY_THUAT, 'tao_long_tin', ['ID_TECH_SUPPORT_IMPERSONATION']),
    b(B.BAO_MAY_NHIEM_VIRUS, 'gay_ap_luc', ['MAN_COVER_STORY', 'MAN_URGENCY']),
    b(B.DOI_CAI_UNG_DUNG_DIEU_KHIEN_TU_XA, 'doi_hanh_dong',
      ['DEV_REMOTE_CONTROL_APP', 'DEV_ACCESSIBILITY_PERMISSION']),
    b(B.DOI_CHIA_SE_MAN_HINH_NGAN_HANG, 'doi_hanh_dong', ['DEV_SCREEN_SHARE_BANKING']),
    b(B.DOI_PHI_UNG_TRUOC, 'doi_hanh_dong', ['OFF_ADVANCE_FEE']),
  ]),

  /** 6 mẫu: ho=qr_app_doc_chia_se_man_hinh */
  chiem_quyen_thiet_bi: Object.freeze([
    // "Nhờ bạn bình chọn cho cháu giúp mình. Quét mã QR này rồi đăng nhập."
    b(B.NHO_QUET_MA_QR, 'tiep_can', ['WEB_QR_TO_LOGIN_PAYMENT']),
    // "mã chỉ còn hiệu lực hai phút nên làm ngay nhé"
    b(B.DAT_HAN_CHOT_RAT_GAP, 'gay_ap_luc', ['MAN_URGENCY', 'MAN_SCARCITY_PRESSURE']),
    b(B.DOI_DANG_NHAP_QUA_DUONG_DAN, 'doi_hanh_dong',
      ['CRED_BANK_LOGIN', 'WEB_BRAND_DOMAIN_MISMATCH']),
    b(B.DOI_CAI_UNG_DUNG_THEO_DUONG_DAN, 'doi_hanh_dong',
      ['DEV_INSTALL_APK_UNKNOWN', 'DEV_ACCESSIBILITY_PERMISSION']),
    b(B.DOI_CHIA_SE_MAN_HINH_NGAN_HANG, 'doi_hanh_dong', ['DEV_SCREEN_SHARE_BANKING']),
  ]),
});

/**
 * ⚠️ HAI KHÔNG GIAN TÊN KHÁC NHAU — ĐỪNG GIẢ ĐỊNH CHÚNG GIỐNG NHAU.
 *
 * Dataset dùng `gia_nguoi_than`, HO_KICH_BAN dùng `gia_danh_nguoi_than`.
 * Dataset dùng `dau_tu`, HO_KICH_BAN dùng `du_dau_tu_loi_nhuan_cao`.
 *
 * Bảng này CHỈ để truy nguồn: mỗi họ kịch bản rút từ những họ dataset nào. Nó
 * KHÔNG chạy trong đường phân tích — `hoKichBan` vẫn do `chonHoKichBan()` trong
 * pipeline.js quyết, từ tín hiệu, đúng như §HĐ.
 */
const doiChieuHoDataset = Object.freeze({
  gia_danh_cong_an: 'gia_danh_cong_an',
  authority_impersonation: 'gia_danh_cong_an',
  gia_danh_co_quan: 'gia_danh_cong_an',
  gia_danh_ngan_hang: 'gia_danh_ngan_hang',
  bank_impersonation: 'gia_danh_ngan_hang',
  gia_nguoi_than: 'gia_danh_nguoi_than',
  gia_nguoi_than_tinh_cam: 'gia_danh_nguoi_than',
  family_emergency: 'bao_tin_nguoi_than_gap_nan',
  chiem_tk_mang_xa_hoi: 'tai_khoan_nguoi_than_bi_chiem',
  delivery_customs_fee: 'gia_danh_giao_hang',
  phi_giao_hang_luu_kho: 'gia_danh_giao_hang',
  phi_giao_hang_mua_sam: 'gia_danh_giao_hang',
  tuyen_ctv: 'gia_danh_tuyen_dung',
  tuyen_ctv_viec_lam: 'gia_danh_tuyen_dung',
  task_job_scam: 'gia_danh_tuyen_dung',
  dau_tu: 'du_dau_tu_loi_nhuan_cao',
  crypto_investment: 'du_dau_tu_loi_nhuan_cao',
  tuyen_sinh_dau_tu_khac: 'du_dau_tu_loi_nhuan_cao',
  phi_lay_lai_tien: 'lua_lay_lai_tien',
  phi_lay_lai_tien_vay_app: 'lua_lay_lai_tien',
  recovery_scam: 'lua_lay_lai_tien',
  lua_tinh_cam: 'lua_tinh_cam',
  romance_scam: 'lua_tinh_cam',
  tech_support: 'gia_danh_ho_tro_ky_thuat',
  qr_app_doc_chia_se_man_hinh: 'chiem_quyen_thiet_bi',
});

/**
 * HỌ KỊCH BẢN CÓ TRONG HỢP ĐỒNG NHƯNG KHÔNG CÓ MẪU NÀO TRONG DATASET.
 * Để TRỐNG, không bịa. Muốn lấp thì phải soạn mẫu trước, không phải soạn bảng.
 */
const HO_CHUA_CO_DU_LIEU = Object.freeze([
  'gia_danh_co_quan_thue',        // không họ dataset nào
  'gia_danh_dich_vu_thiet_yeu',   // không họ dataset nào (điện, nước, viễn thông)
]);

/**
 * ⚠️ KHOẢNG TRỐNG NGƯỢC LẠI — BÁO ĐỂ NGƯỜI KHÁC QUYẾT, KHÔNG TỰ LẤP.
 *
 * 22 mẫu trong dataset (`trung_thuong_ho_tro` 12 · `trung_thuong_tro_cap` 6
 * · `prize_support` 4) là họ TRÚNG THƯỞNG / NHẬN QUÀ. Tín hiệu `OFF_PRIZE_GIFT`
 * có trong Phụ lục A, nhưng KHÔNG có dòng nào trong `HO_KICH_BAN` trỏ về nó —
 * nên `hoKichBan` của cả 22 mẫu này ra `null`, và màn dự báo trống trơn.
 *
 * Thêm một dòng vào `HO_KICH_BAN` là đổi giá trị mà §HĐ phát ra, và frontend cần
 * mục catalog mới. Nên GHI RA ĐÂY thay vì tự thêm.
 */
const KHOANG_TRONG_DA_BIET = Object.freeze([
  Object.freeze({
    hoDataset: Object.freeze(['trung_thuong_ho_tro', 'trung_thuong_tro_cap', 'prize_support']),
    soMau: 22,
    tinHieuDaCo: 'OFF_PRIZE_GIFT',
    thieu: 'HO_KICH_BAN chưa có dòng nào trỏ về họ trúng thưởng / nhận quà',
  }),
]);

const CHI_SO_GIAI_DOAN = new Map(GIAI_DOAN.map((g, i) => [g, i]));
const TOI_DA_BUOC = 3;   // người đang hoảng không nhớ nổi bốn

/**
 * @param {string|null} hoKichBan      mã họ, đúng không gian tên §HĐ
 * @param {string|null} giaiDoanHienTai một trong GIAI_DOAN
 * @returns {Array<{maBuoc:string, giaiDoan:string, tinHieuSeThay:string[]}>}
 *          tối đa BA bước CHƯA xảy ra, theo thứ tự giai đoạn. Không biết ⇒ [].
 */
function buocTiepTheo(hoKichBan, giaiDoanHienTai) {
  if (typeof hoKichBan !== 'string' || typeof giaiDoanHienTai !== 'string') return [];

  const bang = KICH_BAN[hoKichBan];
  if (!bang) return [];

  const moc = CHI_SO_GIAI_DOAN.get(giaiDoanHienTai);
  if (moc === undefined) return [];

  return bang
    // CHỈ bước chưa xảy ra. Dự báo một bước đã qua là vô nghĩa và làm mất lòng tin.
    .filter((x) => CHI_SO_GIAI_DOAN.get(x.giaiDoan) > moc)
    .slice(0, TOI_DA_BUOC)
    // Sao chép sâu: người gọi nghịch mảng trả về không được làm hỏng bảng gốc.
    .map((x) => ({ maBuoc: x.maBuoc, giaiDoan: x.giaiDoan, tinHieuSeThay: [...x.tinHieuSeThay] }));
}

/** Mọi mã bước backend có thể phát ra — frontend cần nhãn VI + EN cho từng mã. */
const MA_BUOC_DA_DUNG = Object.freeze([...new Set(
  Object.values(KICH_BAN).flat().map((x) => x.maBuoc),
)].sort());

module.exports = {
  buocTiepTheo,
  KICH_BAN,
  MA_BUOC,
  MA_BUOC_DA_DUNG,
  doiChieuHoDataset,
  HO_CHUA_CO_DU_LIEU,
  KHOANG_TRONG_DA_BIET,
  TOI_DA_BUOC,
};
