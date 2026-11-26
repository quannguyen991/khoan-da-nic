'use strict';
/**
 * ═════════ BỘ LUẬT THƯ KÝ NGHE MÁY HỘ v1.2.0 — KHOAN ĐÃ ═════════
 *
 * Kiến trúc tuân thủ tuyệt đối §4.2, §4.1, §11 và §12 của `CLAUDE.md`
 * (cùng mô hình với `backend/src/detect/tang-0.js`):
 * - KHÔNG tạo bộ chấm điểm thứ hai: không giữ trọng số riêng, không tự cộng điểm thưởng.
 * - Mỗi luật lời thoại chỉ làm 2 việc:
 *     1) Ánh xạ sang `SIGNAL_IDS` chuẩn của `signal-registry.js` để giao toàn quyền
 *        tính điểm, trần nhóm và tổ hợp cộng hưởng cho `pipeline.analyze()` / `decision-engine.js`.
 *     2) Khai sàn đơn điệu (`san`: `CHUA_THAY` -> `NGHI_NGO` -> `CAO`) theo hướng CHỈ TĂNG cảnh giác.
 * - KHÔNG có nhánh phủ định nào tắt `pipeline.analyze()` toàn cục (§12): kiểm tra phủ định
 *   xét ngữ pháp cục bộ trên văn bản còn dấu để không ăn nhầm "dùng / dụng / chưa".
 * - Trả kèm `nhanRuiRo` thuộc đúng 3 enum chuẩn (`CAO`, `NGHI_NGO`, `CHUA_THAY`).
 */

const { analyze } = require('./analysis/pipeline');
const { laTinHieu } = require('./analysis/signal-registry');

const PHIEN_BAN_LUAT_THU_KY = '1.2.0';

const THU_TU_NHAN = Object.freeze(['CHUA_THAY', 'NGHI_NGO', 'CAO']);
const nangNhan = (a, b) => (THU_TU_NHAN.indexOf(b) > THU_TU_NHAN.indexOf(a) ? b : a);

const LOI_CHAO_MO_DAU =
  'Xin chào. Đây là trợ lý tự động hỗ trợ tiếp nhận cuộc gọi. Anh chị vui lòng cho biết tên và lý do gọi ạ.';

const LOI_CHUA_NGHE_RO_LAN_1 =
  'Xin lỗi, trợ lý chưa nghe rõ. Anh chị vui lòng nói lại ngắn gọn tên và lý do gọi ạ.';

const LOI_NHAN_DU_PHONG =
  'Xin lỗi, hệ thống tiếp nhận đang gặp sự cố hoặc chưa nghe rõ. Lời nhắn của anh chị đã được ghi nhận để gia đình kiểm tra lại sau.';

const LOI_TU_CHOI_THONG_TIN_RIENG =
  'Trợ lý không có quyền cung cấp địa chỉ, lịch sinh hoạt hay thông tin cá nhân của chủ máy. Anh chị vui lòng để lại tên, đơn vị và lý do liên hệ để gia đình kiểm tra.';

const BO_QUY_TAC_AN_TOAN = Object.freeze([
  {
    ma: 'TK-QT-01',
    ten: 'Khai báo trợ lý tự động',
    moTa: 'Nói rõ ngay đầu cuộc gọi đây là trợ lý tự động, không giả giọng người thân hay cơ quan.',
  },
  {
    ma: 'TK-QT-02',
    ten: 'Bảo vệ thông tin riêng tư',
    moTa: 'Không cung cấp địa chỉ, lịch sinh hoạt, thông tin tài chính hoặc dữ liệu riêng; gắn cờ ngay khi người gọi cố hỏi.',
  },
  {
    ma: 'TK-QT-03',
    ten: 'Không tự xác minh danh tính',
    moTa: 'Không khẳng định danh tính thật/giả chỉ dựa vào lời tự giới thiệu; luôn ghi "Người gọi tự xưng...".',
  },
  {
    ma: 'TK-QT-04',
    ten: 'Một bộ luật duy nhất & không hứa an toàn',
    moTa: 'Phán quyết đi qua decision-engine.js duy nhất; không tắt luật toàn cục theo câu phủ định; không dùng chữ "an toàn".',
  },
  {
    ma: 'TK-QT-05',
    ten: 'Ưu tiên khẩn cấp & dự phòng lỗi',
    moTa: 'Việc cấp cứu/tai nạn báo người kiểm tra ngay; không nghe rõ hỏi lại tối đa 1 lần; AI lỗi dùng lời nhắn dự phòng.',
  },
]);

const CO_DAU_TIENG_VIET = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function boDauCoBan(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Kiểm tra phủ định CỤC BỘ ngay trước cụm khớp, ưu tiên văn bản CÓ DẤU để:
 * - Không bao giờ nhầm "dùng / áp dụng" thành "đừng" (lỗi bỏ dấu cũ).
 * - Không coi "chưa" ("bác chưa chuyển tiền phạt") là phủ định an toàn.
 * - Chỉ xét cửa sổ 30 ký tự cùng mệnh đề (không vượt qua dấu chấm/phẩy/; /nhưng/mà/chỉ cần).
 */
function coPhuDinhCucBo(vanBanGoc, viTriKhop) {
  if (viTriKhop <= 0) return false;
  const doanTruocGoc = vanBanGoc.slice(Math.max(0, viTriKhop - 56), viTriKhop).toLowerCase();
  // Nếu có từ chuyển ý hoặc ngắt mệnh đề giữa từ phủ định và hành động => KHÔNG phủ định hành động sau
  const menhDeGanNhat = doanTruocGoc.split(/[.,;!?]|\b(?:nhưng|nhung|mà|ma|chỉ|chi|rồi|roi|sau đó|sau do)\b/i).pop() || '';
  // "nếu không nộp phạt" là câu đe dọa điều kiện, KHÔNG PHẢI câu phủ định an toàn!
  if (/\b(?:nếu|neu|kẻo|keo)\s+(?:không|khong)\b/i.test(menhDeGanNhat)) {
    return false;
  }
  if (CO_DAU_TIENG_VIET.test(vanBanGoc)) {
    return /(?:^|[^\p{L}\p{N}])(không|đừng|chớ|miễn|không cần|không hề|không phải|không đòi|không bao giờ)\s+(?:cần\s+|phải\s+|hỏi\s+|xin\s+|đọc\s+|yêu cầu\s+)?(?:(?:đọc|gửi|chuyển|nộp|bấm)\s+(?:otp|mã|tiền|link)\s+(?:hay|hoặc)\s+)?$/iu.test(
      menhDeGanNhat
    );
  }
  return /(?:^|[^a-z0-9])(khong|cho|mien|khong can|khong he|khong phai|khong doi|khong bao gio)\s+(?:can\s+|phai\s+|hoi\s+|xin\s+|doc\s+|yeu cau\s+)?(?:(?:doc|gui|chuyen|nop|bam)\s+(?:otp|ma|tien|link)\s+(?:hay|hoac)\s+)?$/i.test(
    boDauCoBan(menhDeGanNhat)
  );
}

function khopKhongBiPhuDinhCucBo(vanBanGoc, khongDau, regexKhongDau) {
  const flags = regexKhongDau.flags.includes('g') ? regexKhongDau.flags : `${regexKhongDau.flags}g`;
  const re = new RegExp(regexKhongDau.source, flags);
  let m;
  while ((m = re.exec(khongDau)) !== null) {
    if (!coPhuDinhCucBo(vanBanGoc, m.index)) {
      return true;
    }
  }
  return false;
}

/**
 * Mỗi mục ánh xạ từ mẫu thoại sang `tinHieuChuan` (`SIGNAL_IDS`) và sàn đơn điệu `san`.
 * Tuyệt đối không chứa `trongSo` riêng (§4.2).
 */
const BO_LUAT_TIN_HIEU = Object.freeze([
  {
    ma: 'TK_CHUYEN_TIEN',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['FIN_TRANSFER_REQUEST'],
    san: 'NGHI_NGO',
    moTa: 'Đề cập chuyển tiền, nộp phí, tiền cọc, đóng phạt hoặc chuyển khoản',
    mau: /\b(chuyen tien|chuyen khoan|nop tien|dong phi|tien coc|nop phat|thanh toan phi|dong vien phi)\b/i,
    xetPhuDinhCucBo: true,
  },
  {
    ma: 'TK_TAI_KHOAN_AN_TOAN',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['FIN_SAFE_ACCOUNT', 'FIN_TRANSFER_REQUEST'],
    san: 'CAO',
    moTa: 'Yêu cầu chuyển tiền vào "tài khoản tạm giữ", "tài khoản an toàn" hoặc "tài khoản bảo lãnh"',
    mau: /\b(tai khoan tam giu|tai khoan an toan|tai khoan bao lanh|tai khoan xac minh|tai khoan co quan)\b/i,
  },
  {
    ma: 'TK_OTP_MAT_KHAU',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['CRED_OTP_SHARE'],
    san: 'CAO',
    moTa: 'Xin mã OTP, mã xác thực, mật khẩu hoặc mã PIN',
    mau: /\b(otp|ma xac thuc|ma xac nhan|doc ma|cho xin ma|mat khau|ma pin)\b/i,
    xetPhuDinhCucBo: true,
  },
  {
    ma: 'TK_CAI_APP_TRO_NANG',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['DEV_INSTALL_APK_UNKNOWN', 'DEV_REMOTE_CONTROL_APP'],
    san: 'CAO',
    moTa: 'Dụ cài ứng dụng lạ, file APK, bật trợ năng, điều khiển từ xa hoặc chia sẻ màn hình',
    mau: /\b(cai app|cai ung dung|tai app|tai file|tai ung dung|apk|vneid moi|vssid moi|etax|dich vu cong gia|tro nang|chia se man hinh|ultraview|teamviewer|anydesk|doi esim|chuan hoa thue bao)\b/i,
  },
  {
    ma: 'TK_TRUY_CAP_LINK',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['WEB_QR_TO_LOGIN_PAYMENT'],
    san: 'NGHI_NGO',
    moTa: 'Yêu cầu bấm link, truy cập đường dẫn lạ hoặc quét mã QR để xác minh, nhận quà hoặc cập nhật',
    mau: /\b(bam link|vao link|bam vao duong dan|truy cap link|truy cap trang|duong dan|quet qr|quet ma qr|http:\/\/|https:\/\/)\b/i,
    xetPhuDinhCucBo: true,
  },
  {
    ma: 'TK_DE_DOA_PHAP_LY',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['MAN_FEAR_THREAT'],
    san: 'NGHI_NGO',
    moTa: 'Đe dọa bắt giữ, khởi tố, phong tỏa tài khoản, phạt nguội, tòa án, cắt điện hoặc khóa SIM',
    mau: /\b(bat giu|khoi to|lenh bat|phong toa|truy to|phat tu|bi khoa tai khoan|cong an bat|toa an trieu tap|vu an|cat dien|khoa sim|khoa the|phat nguoi|cuong che|ngung luong huu|khoa giao dich)\b/i,
  },
  {
    ma: 'TK_GIU_BI_MAT',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['MAN_SECRECY'],
    san: 'NGHI_NGO',
    moTa: 'Ép giữ bí mật, cấm nói với con cháu hoặc người thân trong gia đình',
    mau: /\b(giu bi mat|khong duoc noi|dung noi voi ai|khong bao gia dinh|im lang|dung cho con chau biet|chi hai nguoi|dung ke voi ai)\b/i,
  },
  {
    ma: 'TK_THE_QUA_TANG_TIEN_AO',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['FIN_GIFT_CARD_PAYMENT', 'FIN_CRYPTO_TRANSFER'],
    san: 'CAO',
    moTa: 'Yêu cầu mua thẻ cào, thẻ quà tặng hoặc tiền mã hóa (USDT/Bitcoin)',
    mau: /\b(the cao|the qua tang|gift card|usdt|bitcoin|tien ao|tien ma hoa)\b/i,
  },
  {
    ma: 'TK_VIEC_NHE_HOA_HONG',
    nhom: 'nguy_hiem',
    tinHieuChuan: ['OFF_TASK_PREPAY'],
    san: 'NGHI_NGO',
    moTa: 'Mời chào làm nhiệm vụ online, nhận hoa hồng cao hoặc nạp tiền hoàn vốn',
    mau: /\b(hoa hong|viec nhe luong cao|lam nhiem vu|chot don|tang thu nhap|nap truoc rut sau)\b/i,
  },
  {
    ma: 'TK_MOI_THONG_TIN_RIENG',
    nhom: 'rieng_tu',
    tinHieuChuan: ['CRED_ID_BIOMETRIC_DOCS'],
    san: 'NGHI_NGO',
    moTa: 'Cố tình hỏi địa chỉ nhà, tình trạng ở một mình, số dư, sinh trắc học hoặc số CCCD',
    mau: /\b(dia chi nha|nha bac o dau|bac o nha mot minh|o mot minh a|co ai o nha khong|lich sinh hoat|trong tai khoan co bao nhieu|so du bao nhieu|doc so cccd|chup cccd|hai mat cccd|2 mat cccd|so can cuoc|quay video khuon mat|(gui|chup|cap nhat|xac thuc)\s+sinh trac hoc[^.]{0,20}(zalo|link|online|qua mang))\b/i,
  },
  {
    ma: 'TK_EP_THOI_GIAN',
    nhom: 'ap_luc',
    tinHieuChuan: ['MAN_URGENCY'],
    san: 'CHUA_THAY',
    moTa: 'Thúc ép xử lý gấp trong vài phút, không cho thời gian kiểm chứng',
    mau: /\b(ngay lap tuc|trong \d+ phut|gap lam roi|keo tre|het han ngay|hom nay la han chot)\b/i,
  },
  {
    ma: 'TK_CAM_CUP_MAY',
    nhom: 'ap_luc',
    tinHieuChuan: ['MAN_KEEP_CALL_ACTIVE'],
    san: 'NGHI_NGO',
    moTa: 'Cấm cúp máy, ép giữ liên lạc liên tục để cô lập người nghe',
    mau: /\b(khong duoc cup may|khong duoc tat may|giu may lien tuc|dung tat dien thoai)\b/i,
  },
  {
    ma: 'TK_KHAN_CAP_Y_TE',
    nhom: 'khan_cap',
    tinHieuChuan: [],
    san: 'CHUA_THAY',
    moTa: 'Báo tai nạn, cấp cứu, nhập viện, đột quỵ, cháy nhà hoặc sự cố gia đình',
    mau: /\b(cap cuu|tai nan|nhap vien|benh vien|nguy kich|dot quy|chay nha|su co gia dinh|phong mo)\b/i,
  },
  {
    ma: 'TK_GIA_DANH_CO_QUAN',
    nhom: 'danh_xung',
    tinHieuChuan: ['ID_AUTHORITY_IMPERSONATION'],
    san: 'CHUA_THAY',
    moTa: 'Tự xưng công an, viện kiểm sát, tòa án, thuế, bảo hiểm xã hội, điện lực',
    mau: /\b(cong an|canh sat|vien kiem sat|toa an|bo cong an|cuc thue|bao hiem xa hoi|bhxh|bhyt|so tu phap|dieu tra|dien luc|evn)\b/i,
  },
  {
    ma: 'TK_GIA_DANH_NGAN_HANG',
    nhom: 'danh_xung',
    tinHieuChuan: ['ID_BANK_IMPERSONATION'],
    san: 'CHUA_THAY',
    moTa: 'Tự xưng ngân hàng, ví điện tử, thẻ tín dụng',
    mau: /\b(ngan hang|vietcombank|bidv|agribank|techcombank|mb bank|vietinbank|vpbank|acb|the tin dung|momo|zalopay)\b/i,
  },
  {
    ma: 'TK_GIA_DANH_CON_CHAU',
    nhom: 'danh_xung',
    tinHieuChuan: ['ID_FAMILY_IMPERSONATION'],
    san: 'CHUA_THAY',
    moTa: 'Tự xưng con cháu, người thân trong nhà',
    mau: /\b(con day|chau day|me oi|bo oi|ba oi|ong oi|con la|chau la|con doi so)\b/i,
  },
  {
    ma: 'TK_GIAO_HANG',
    nhom: 'thong_thuong',
    tinHieuChuan: ['ID_DELIVERY_IMPERSONATION'],
    san: 'CHUA_THAY',
    moTa: 'Tự xưng giao hàng, shipper, bưu điện',
    mau: /\b(giao hang|shipper|buu dien|buu pham|don hang|viettel post|ghn|ghtk|j&t)\b/i,
  },
  {
    ma: 'TK_Y_TE_LICH_KHAM',
    nhom: 'thong_thuong',
    tinHieuChuan: [],
    san: 'CHUA_THAY',
    moTa: 'Phòng khám hoặc bệnh viện nhắc lịch khám định kỳ',
    mau: /\b(lich kham|tai kham|phong kham|kham dinh ky|xet nghiem)\b/i,
  },
  {
    ma: 'TK_SUA_CHUA_DICH_VU',
    nhom: 'thong_thuong',
    tinHieuChuan: [],
    san: 'CHUA_THAY',
    moTa: 'Thợ sửa chữa điện nước, internet hẹn giờ qua nhà',
    mau: /\b(sua dien|sua nuoc|tho sua|lap mang|bao tri|dieu hoa)\b/i,
  },
  {
    ma: 'TK_HEN_GAP_HOI_THAM',
    nhom: 'thong_thuong',
    tinHieuChuan: [],
    san: 'CHUA_THAY',
    moTa: 'Hẹn gặp, hỏi thăm, họp tổ dân phố hoặc hội người cao tuổi',
    mau: /\b(hen gap|hoi tham|hang xom|hop to dan pho|to truong|hoi nguoi cao tuoi|duong sinh|khao sat)\b/i,
  },
  {
    ma: 'TK_GOI_NHAM',
    nhom: 'thong_thuong',
    tinHieuChuan: [],
    san: 'CHUA_THAY',
    moTa: 'Gọi nhầm số hoặc xin lỗi gọi nhầm',
    mau: /\b(nham so|goi nham|xin loi nham)\b/i,
  },
]);

/**
 * Mẫu giải thích tình huống (CHỈ phục vụ câu chữ giải thích và phân họ kịch bản,
 * TUYỆT ĐỐI KHÔNG cộng điểm ngoài `decision-engine.js` — §4.2).
 */
const CONG_HUONG_THU_KY = Object.freeze([
  {
    ma: 'CH_CO_QUAN_TIEN',
    yeuCau: ['TK_GIA_DANH_CO_QUAN'],
    kemMotTrong: ['TK_CHUYEN_TIEN', 'TK_TAI_KHOAN_AN_TOAN', 'TK_DE_DOA_PHAP_LY'],
    san: 'CAO',
    hoKichBan: 'gia_danh_cong_an',
    giaiThich: 'Cơ quan Công an, Tòa án, Điện lực hay Bảo hiểm không làm việc đòi chuyển tiền hoặc đe dọa qua điện thoại.',
  },
  {
    ma: 'CH_NGAN_HANG_OTP',
    yeuCau: ['TK_GIA_DANH_NGAN_HANG'],
    kemMotTrong: ['TK_OTP_MAT_KHAU', 'TK_TRUY_CAP_LINK', 'TK_CAI_APP_TRO_NANG'],
    san: 'CAO',
    hoKichBan: 'gia_danh_ngan_hang',
    giaiThich: 'Ngân hàng không gọi điện hỏi mã OTP, mật khẩu hay yêu cầu bấm vào đường dẫn lạ.',
  },
  {
    ma: 'CH_CON_CHAU_TAI_NAN_TIEN',
    yeuCau: ['TK_GIA_DANH_CON_CHAU', 'TK_KHAN_CAP_Y_TE'],
    kemMotTrong: ['TK_CHUYEN_TIEN', 'TK_GIU_BI_MAT'],
    san: 'CAO',
    hoKichBan: 'gia_danh_nguoi_than',
    giaiThich: 'Cuộc gọi có dấu hiệu thường gặp khi mạo danh người thân báo tai nạn để đòi tiền gấp. Hãy gọi lại vào số cũ của con cháu.',
  },
  {
    ma: 'CH_GIAO_HANG_LINK',
    yeuCau: ['TK_GIAO_HANG'],
    kemMotTrong: ['TK_TRUY_CAP_LINK', 'TK_CHUYEN_TIEN', 'TK_CAI_APP_TRO_NANG'],
    san: 'NGHI_NGO',
    hoKichBan: 'gia_danh_giao_hang',
    giaiThich: 'Giao hàng thông thường không yêu cầu bấm đường dẫn lạ hay cài ứng dụng ngoài cửa hàng để nhận đơn.',
  },
  {
    ma: 'CH_CO_LAP_TAM_LY',
    yeuCau: ['TK_CAM_CUP_MAY'],
    kemMotTrong: ['TK_DE_DOA_PHAP_LY', 'TK_GIU_BI_MAT', 'TK_CAI_APP_TRO_NANG'],
    san: 'CAO',
    hoKichBan: 'chiem_quyen_thiet_bi',
    giaiThich: 'Yêu cầu giữ máy liên tục và cấm hỏi ý kiến người nhà là dấu hiệu gây áp lực tâm lý thường gặp trong các vụ lừa đảo.',
  },
]);

function trichThucTheCuocGoi(vanBan = '') {
  const goc = String(vanBan || '');
  const matchTen = goc.match(/(?:tôi là|em là|cháu là|con là|mình là)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2})/);
  const matchTien = goc.match(/(\d+(?:[.,]\d+)?\s*(?:triệu|tr|nghìn|ngàn|k|tỷ|đồng|đ|vnđ))/i);
  const matchUrl = goc.match(/https?:\/\/[^\s]+/i);
  const matchDonVi = goc.match(/(?:bên|ở|từ|công tác tại)\s+([^,.;!?]{3,35})/i);

  return {
    tenTuXung: matchTen ? matchTen[1].trim() : null,
    donViTuXung: matchDonVi ? matchDonVi[1].trim() : null,
    soTienDeCap: matchTien ? matchTien[1].trim() : null,
    duongDanDeCap: matchUrl ? matchUrl[0].trim() : null,
  };
}

/**
 * Hàng rào lọc đầu ra (§1 & §4.1 & §11):
 * - Cấm từ "an toàn", "yên tâm", "chắc chắn thật", "lấy lại được tiền".
 * - Cấm làm lộ chuỗi số giống CCCD (12 số) hoặc số tài khoản/thẻ dài.
 */
function locLoiDapThuKy(loiDap = '') {
  const van = String(loiDap || '').trim();
  if (!van) return LOI_NHAN_DU_PHONG;

  const cam = /\b(an toan|yen tam|chac chan that|lay lai duoc tien|khong phai lua dao|da xac minh danh tinh)\b/i;
  const loSoNhayCam = /\b\d{10,16}\b/;
  if (cam.test(boDauCoBan(van)) || loSoNhayCam.test(van)) {
    return 'Trợ lý đã ghi nhận thông tin để chủ máy và người thân tự kiểm tra lại qua kênh chính thức.';
  }
  return van;
}

function trichTinHieuThuKy(vanBan = '') {
  const goc = String(vanBan || '');
  const khongDau = boDauCoBan(goc).toLowerCase();
  const maTinHieu = [];
  let sanThuKy = 'CHUA_THAY';

  for (const luat of BO_LUAT_TIN_HIEU) {
    const khop = luat.xetPhuDinhCucBo
      ? khopKhongBiPhuDinhCucBo(goc, khongDau, luat.mau)
      : luat.mau.test(khongDau);
    if (khop) {
      maTinHieu.push(luat.ma);
      sanThuKy = nangNhan(sanThuKy, luat.san || 'CHUA_THAY');
    }
  }

  let hoKichBan = null;
  let giaiThichCongHuong = null;
  const congHuongKichHoat = [];

  for (const ch of CONG_HUONG_THU_KY) {
    const duYeuCau = ch.yeuCau.every((m) => maTinHieu.includes(m));
    const coKem = ch.kemMotTrong.some((m) => maTinHieu.includes(m));
    if (duYeuCau && coKem) {
      congHuongKichHoat.push(ch.ma);
      sanThuKy = nangNhan(sanThuKy, ch.san || 'NGHI_NGO');
      if (!hoKichBan) {
        hoKichBan = ch.hoKichBan;
        giaiThichCongHuong = ch.giaiThich;
      }
    }
  }

  // §4.2 & §12 — LUÔN chạy bộ luật duy nhất (`pipeline.analyze`), KHÔNG BAO GIỜ tắt theo phủ định.
  // Ánh xạ thêm các tín hiệu thoại đã bắt sang kênh `tinHieuVuViec` (chỉ tăng cảnh giác) khi không bị phủ định cục bộ.
  const tinHieuChuanTuThoai = [];
  for (const m of maTinHieu) {
    const def = BO_LUAT_TIN_HIEU.find((x) => x.ma === m);
    if (!def) continue;
    // Chỉ truyền tín hiệu danh xưng sang khi đi kèm ít nhất một tín hiệu hành động/áp lực để không đẩy cuộc gọi bình thường
    const laDanhXungDonDoc = def.nhom === 'danh_xung' || def.nhom === 'thong_thuong';
    if (laDanhXungDonDoc && !maTinHieu.some((k) => {
      const d2 = BO_LUAT_TIN_HIEU.find((x) => x.ma === k);
      return d2 && (d2.nhom === 'nguy_hiem' || d2.nhom === 'rieng_tu' || d2.nhom === 'ap_luc');
    })) {
      continue;
    }
    for (const sigId of def.tinHieuChuan || []) {
      if (laTinHieu(sigId)) {
        tinHieuChuanTuThoai.push({
          id: sigId,
          state: 'present',
          evidence: [{ quote: m, start: 0, end: m.length, sourceId: 'thu_ky' }],
        });
      }
    }
  }

  const phanTichLuatChinh = goc.trim().length > 0
    ? analyze({ vanBan: goc, tinHieuVuViec: tinHieuChuanTuThoai })
    : null;

  const nhanHopNhat = nangNhan(phanTichLuatChinh?.nhan || 'CHUA_THAY', sanThuKy);
  const diemChinh = phanTichLuatChinh?.score || 0;

  const tinHieuNguy = maTinHieu.filter((m) => {
    const def = BO_LUAT_TIN_HIEU.find((x) => x.ma === m);
    return def && (def.nhom === 'nguy_hiem' || def.nhom === 'rieng_tu');
  });

  const coApLuc = maTinHieu.includes('TK_EP_THOI_GIAN') || maTinHieu.includes('TK_CAM_CUP_MAY');
  const laKhanCap = maTinHieu.includes('TK_KHAN_CAP_Y_TE');
  const moiThongTinRieng = maTinHieu.includes('TK_MOI_THONG_TIN_RIENG');
  const thucThe = trichThucTheCuocGoi(goc);

  let callerClaim = 'Người gọi chưa nêu rõ đơn vị hoặc danh tính';
  if (maTinHieu.includes('TK_GIA_DANH_CO_QUAN')) {
    callerClaim = 'Người gọi tự xưng cơ quan chức năng / công an / đơn vị dịch vụ công';
  } else if (maTinHieu.includes('TK_GIA_DANH_NGAN_HANG')) {
    callerClaim = 'Người gọi tự xưng nhân viên ngân hàng / ví điện tử';
  } else if (maTinHieu.includes('TK_GIAO_HANG')) {
    callerClaim = 'Người gọi tự xưng giao hàng / bưu điện';
  } else if (maTinHieu.includes('TK_GIA_DANH_CON_CHAU')) {
    callerClaim = 'Người gọi tự xưng người thân / con cháu';
  } else if (laKhanCap) {
    callerClaim = 'Người gọi báo tình huống khẩn cấp / bệnh viện';
  } else if (maTinHieu.includes('TK_Y_TE_LICH_KHAM')) {
    callerClaim = 'Người gọi tự xưng phòng khám / bệnh viện';
  } else if (maTinHieu.includes('TK_SUA_CHUA_DICH_VU')) {
    callerClaim = 'Người gọi tự xưng thợ sửa chữa / dịch vụ kỹ thuật';
  }

  return {
    maTinHieu,
    tinHieuNguy,
    congHuongKichHoat,
    nhanRuiRo: nhanHopNhat,
    diemRuiRo: diemChinh,
    hoKichBan: hoKichBan || phanTichLuatChinh?.hoKichBan || null,
    giaiThichCongHuong,
    thucThe,
    coApLuc,
    laKhanCap,
    moiThongTinRieng,
    callerClaim,
    phanTichLuatChinh,
  };
}

function chonCauHoiLamRo(trich) {
  if (trich.maTinHieu.includes('TK_GIAO_HANG')) {
    return 'Anh chị vui lòng cho biết đơn vị giao hàng và lời nhắn ngắn gọn cho chủ máy ạ.';
  }
  if (trich.maTinHieu.includes('TK_GIA_DANH_CO_QUAN') || trich.maTinHieu.includes('TK_GIA_DANH_NGAN_HANG')) {
    return 'Anh chị vui lòng cho biết rõ tên đơn vị công tác, nội dung cần trao đổi và cách liên hệ chính thức ạ.';
  }
  if (trich.maTinHieu.includes('TK_GIA_DANH_CON_CHAU')) {
    return 'Anh chị vui lòng nói rõ tên người gọi và việc cần nhắn lại ạ.';
  }
  return 'Anh chị vui lòng nói rõ tên, đơn vị và lý do cụ thể cần liên hệ ạ.';
}

function danhGiaLuotCuocGoi({
  toanBoLoiNguoiGoi = '',
  daHoiLamRo = false,
  soLuotHoiLaiKhongRo = 0,
  khongNgheRo = false,
  aiLoi = false,
  aiTomTat = null,
} = {}) {
  const vanBanSach = String(toanBoLoiNguoiGoi || '').trim();

  if (khongNgheRo || vanBanSach.length < 3) {
    if (soLuotHoiLaiKhongRo === 0) {
      return {
        ketThuc: false,
        tangLuotKhongRo: true,
        tangHoiLamRo: false,
        trangThaiPhanLoai: 'khong_du_thong_tin',
        nhanRuiRo: 'NGHI_NGO',
        urgency: 'normal',
        confidence: 'low',
        diemRuiRo: 0,
        hoKichBan: null,
        thucThe: { tenTuXung: null, donViTuXung: null, soTienDeCap: null, duongDanDeCap: null },
        giaiThichChoBac: 'Trợ lý chưa nghe rõ nên đang hỏi lại người gọi một lần.',
        signals: [],
        callerClaim: 'Chưa rõ (âm thanh không rõ)',
        purpose: '',
        summary: 'Chưa nghe rõ lời người gọi, đã hỏi lại một lần.',
        recommendedAction: 'ask_repeat',
        loiDap: locLoiDapThuKy(LOI_CHUA_NGHE_RO_LAN_1),
      };
    }
    return {
      ketThuc: true,
      tangLuotKhongRo: true,
      tangHoiLamRo: false,
      trangThaiPhanLoai: 'khong_du_thong_tin',
      nhanRuiRo: 'NGHI_NGO',
      urgency: 'needs_review',
      confidence: 'low',
      diemRuiRo: 0,
      hoKichBan: null,
      thucThe: { tenTuXung: null, donViTuXung: null, soTienDeCap: null, duongDanDeCap: null },
      giaiThichChoBac: 'Cuộc gọi quá ồn hoặc không rõ nên đã lưu lại để gia đình kiểm tra lại.',
      signals: ['khong_nghe_ro'],
      callerClaim: 'Chưa xác minh được',
      purpose: 'Không nghe rõ hai lần',
      summary: 'Cuộc gọi chưa xác minh được do không nghe rõ hai lần; cần người hỗ trợ kiểm tra.',
      recommendedAction: 'notify_for_review',
      loiDap: locLoiDapThuKy(LOI_NHAN_DU_PHONG),
    };
  }

  const trich = trichTinHieuThuKy(vanBanSach);
  const coTinHieuLuatChinh =
    trich.nhanRuiRo === 'CAO' || trich.nhanRuiRo === 'NGHI_NGO';

  const signals = Array.from(new Set([
    ...trich.tinHieuNguy,
    ...trich.maTinHieu.filter((m) => m === 'TK_EP_THOI_GIAN' || m === 'TK_CAM_CUP_MAY'),
    ...(trich.phanTichLuatChinh?.maLyDo || []),
  ]));

  const coDauHieuDangNgo =
    trich.tinHieuNguy.length > 0 ||
    coTinHieuLuatChinh ||
    (trich.coApLuc && (trich.maTinHieu.includes('TK_GIA_DANH_CO_QUAN') || trich.maTinHieu.includes('TK_GIA_DANH_CON_CHAU')));

  if (trich.moiThongTinRieng && trich.tinHieuNguy.every((m) => m === 'TK_MOI_THONG_TIN_RIENG')) {
    return {
      ketThuc: true,
      tangLuotKhongRo: false,
      tangHoiLamRo: false,
      trangThaiPhanLoai: 'dang_ngo',
      nhanRuiRo: trich.nhanRuiRo === 'CAO' ? 'CAO' : 'NGHI_NGO',
      urgency: 'needs_review',
      confidence: 'medium',
      diemRuiRo: trich.diemRuiRo,
      hoKichBan: trich.hoKichBan || 'moi_thong_tin_rieng',
      thucThe: trich.thucThe,
      giaiThichChoBac: 'Người lạ hỏi địa chỉ nhà, tình trạng ở một mình hoặc thông tin cá nhân/tài khoản. Trợ lý đã từ chối tiết lộ.',
      signals: Array.from(new Set([...signals, 'TK_MOI_THONG_TIN_RIENG'])),
      callerClaim: trich.callerClaim,
      purpose: 'Hỏi thông tin riêng tư (địa chỉ / sinh hoạt / tài chính)',
      summary: `${trich.callerClaim} và hỏi thông tin riêng tư. Trợ lý đã từ chối cung cấp và lưu lại để gia đình kiểm tra.`,
      recommendedAction: 'notify_trusted_contact',
      loiDap: locLoiDapThuKy(LOI_TU_CHOI_THONG_TIN_RIENG),
    };
  }

  if (aiLoi && !coDauHieuDangNgo && !trich.laKhanCap) {
    return {
      ketThuc: true,
      tangLuotKhongRo: false,
      tangHoiLamRo: false,
      trangThaiPhanLoai: 'loi_he_thong',
      nhanRuiRo: 'NGHI_NGO',
      urgency: 'needs_review',
      confidence: 'low',
      diemRuiRo: 0,
      hoKichBan: null,
      thucThe: trich.thucThe,
      giaiThichChoBac: 'Mạng hoặc bộ tóm tắt AI gặp trục trặc tạm thời nên trợ lý đã giữ lời nhắn để gia đình kiểm tra.',
      signals: ['loi_he_thong_ai'],
      callerClaim: trich.callerClaim,
      purpose: 'Chờ kiểm tra do gián đoạn dịch vụ AI',
      summary: 'Dịch vụ AI mất kết nối giữa cuộc gọi; đã phát lời nhắn dự phòng và lưu sự kiện để người hỗ trợ kiểm tra.',
      recommendedAction: 'notify_trusted_contact',
      loiDap: locLoiDapThuKy(LOI_NHAN_DU_PHONG),
    };
  }

  if (trich.laKhanCap && coDauHieuDangNgo) {
    const tongHopTinHieu = Array.from(new Set([...signals, 'TK_KHAN_CAP_Y_TE']));
    return {
      ketThuc: true,
      tangLuotKhongRo: false,
      tangHoiLamRo: false,
      trangThaiPhanLoai: 'dang_ngo',
      nhanRuiRo: 'CAO',
      urgency: 'needs_review',
      confidence: 'high',
      diemRuiRo: trich.diemRuiRo,
      hoKichBan: trich.hoKichBan || 'gia_danh_nguoi_than',
      thucThe: trich.thucThe,
      giaiThichChoBac:
        trich.giaiThichCongHuong ||
        'Cuộc gọi vừa báo sự cố khẩn cấp vừa kèm yêu cầu chuyển tiền hoặc giữ bí mật. Khoan làm theo — hãy gọi lại số cũ của người thân.',
      signals: tongHopTinHieu,
      callerClaim: trich.callerClaim,
      purpose: 'Báo tai nạn / khẩn cấp kèm yêu cầu chuyển tiền hoặc giữ bí mật',
      summary: `${trich.callerClaim}, báo tình huống khẩn cấp nhưng kèm dấu hiệu đáng ngờ (${tongHopTinHieu.join(', ')}). Cần người thân kiểm tra và gọi lại qua số cũ ngay.`,
      recommendedAction: 'notify_trusted_contact',
      loiDap: locLoiDapThuKy(
        'Trợ lý đã ghi nhận thông tin khẩn cấp để gia đình kiểm tra lại ngay qua kênh liên lạc chính thức.'
      ),
    };
  }

  if (trich.laKhanCap) {
    return {
      ketThuc: true,
      tangLuotKhongRo: false,
      tangHoiLamRo: false,
      trangThaiPhanLoai: 'khan_cap',
      nhanRuiRo: 'NGHI_NGO',
      urgency: 'emergency',
      confidence: 'medium',
      diemRuiRo: trich.diemRuiRo,
      hoKichBan: 'bao_tin_nguoi_than_gap_nan',
      thucThe: trich.thucThe,
      giaiThichChoBac: 'Người gọi báo việc cấp cứu/bệnh viện. Trợ lý không tự kết luận thật giả — cần gia đình kiểm tra qua số chính thức ngay.',
      signals: ['TK_KHAN_CAP_Y_TE'],
      callerClaim: trich.callerClaim,
      purpose: 'Báo tình huống khẩn cấp / y tế / sự cố gia đình',
      summary: `${trich.callerClaim} và đề cập việc khẩn cấp. Không tự kết luận thật giả — cần con người kiểm tra và kết nối ngay.`,
      recommendedAction: 'urgent_human_review',
      loiDap: locLoiDapThuKy(
        'Trợ lý đã ghi nhận đây là việc khẩn cấp để báo cho chủ máy và người thân kiểm tra. Anh chị vui lòng giữ liên lạc qua kênh chính thức.'
      ),
    };
  }

  if (coDauHieuDangNgo) {
    const nhanCuoi = trich.nhanRuiRo === 'CAO' ? 'CAO' : 'NGHI_NGO';
    return {
      ketThuc: true,
      tangLuotKhongRo: false,
      tangHoiLamRo: false,
      trangThaiPhanLoai: 'dang_ngo',
      nhanRuiRo: nhanCuoi,
      urgency: 'needs_review',
      confidence: nhanCuoi === 'CAO' ? 'high' : 'medium',
      diemRuiRo: trich.diemRuiRo,
      hoKichBan: trich.hoKichBan || 'yeu_cau_nhay_cam',
      thucThe: trich.thucThe,
      giaiThichChoBac:
        trich.giaiThichCongHuong ||
        'Cuộc gọi có dấu hiệu thường gặp trong các vụ lừa đảo (tiền bạc, mã xác thực, cài ứng dụng hoặc đường dẫn lạ). Khoan làm theo, hãy hỏi người thân trước.',
      signals,
      callerClaim: trich.callerClaim,
      purpose: trich.maTinHieu.includes('TK_GIA_DANH_CO_QUAN')
        ? 'Đề cập vụ việc cơ quan chức năng kèm yêu cầu nhạy cảm'
        : 'Đề cập yêu cầu nhạy cảm cần xác minh',
      summary: aiTomTat?.summary
        ? `${aiTomTat.summary} (Cần xác minh qua kênh chính thức, AI có thể nghe nhầm).`
        : `${trich.callerClaim} và đề cập yêu cầu nhạy cảm (${signals.join(', ')}). Cần xác minh qua kênh chính thức.`,
      recommendedAction: 'notify_trusted_contact',
      loiDap: locLoiDapThuKy(
        trich.moiThongTinRieng
          ? LOI_TU_CHOI_THONG_TIN_RIENG
          : 'Trợ lý đã ghi nhận lời nhắn để gia đình kiểm tra lại. Gia đình sẽ tự liên hệ qua kênh chính thức nếu cần.'
      ),
    };
  }

  if (trich.maTinHieu.includes('TK_GOI_NHAM')) {
    return {
      ketThuc: true,
      tangLuotKhongRo: false,
      tangHoiLamRo: false,
      trangThaiPhanLoai: 'thong_thuong',
      nhanRuiRo: 'CHUA_THAY',
      urgency: 'normal',
      confidence: 'medium',
      diemRuiRo: 0,
      hoKichBan: null,
      thucThe: trich.thucThe,
      giaiThichChoBac: 'Người gọi báo nhầm số và xin lỗi.',
      signals: ['TK_GOI_NHAM'],
      callerClaim: 'Người gọi báo nhầm số',
      purpose: 'Gọi nhầm số',
      summary: 'Người gọi thông báo gọi nhầm số và xin lỗi.',
      recommendedAction: 'deliver_message',
      loiDap: locLoiDapThuKy('Không sao ạ, trợ lý xin phép kết thúc cuộc gọi. Chào anh chị.'),
    };
  }

  const coHenTrucTiepTaiQuay = /\b(tai quay|ra tru so|ghe chi nhanh|lay ket qua truc tiep)\b/i.test(
    boDauCoBan(vanBanSach)
  );
  const laThongThuongRo =
    trich.maTinHieu.includes('TK_GIAO_HANG') ||
    trich.maTinHieu.includes('TK_Y_TE_LICH_KHAM') ||
    trich.maTinHieu.includes('TK_SUA_CHUA_DICH_VU') ||
    trich.maTinHieu.includes('TK_HEN_GAP_HOI_THAM') ||
    trich.maTinHieu.includes('TK_GIA_DANH_CON_CHAU') ||
    coHenTrucTiepTaiQuay;

  if (!daHoiLamRo && (!laThongThuongRo || vanBanSach.split(/\s+/).length < 7)) {
    return {
      ketThuc: false,
      tangLuotKhongRo: false,
      tangHoiLamRo: true,
      trangThaiPhanLoai: 'khong_du_thong_tin',
      nhanRuiRo: 'CHUA_THAY',
      urgency: 'normal',
      confidence: 'low',
      diemRuiRo: 0,
      hoKichBan: null,
      thucThe: trich.thucThe,
      giaiThichChoBac: 'Trợ lý đang hỏi thêm một câu để làm rõ người gọi cần việc gì.',
      signals: [],
      callerClaim: trich.callerClaim,
      purpose: '',
      summary: `${trich.callerClaim}; trợ lý đang hỏi thêm một câu làm rõ mục đích.`,
      recommendedAction: 'ask_clarify',
      loiDap: locLoiDapThuKy(chonCauHoiLamRo(trich)),
    };
  }

  // §11 — TUYỆT ĐỐI KHÔNG khẳng định tín hiệu cụ thể là vắng mặt ("chưa thấy tiền/OTP").
  return {
    ketThuc: true,
    tangLuotKhongRo: false,
    tangHoiLamRo: false,
    trangThaiPhanLoai: 'thong_thuong',
    nhanRuiRo: 'CHUA_THAY',
    urgency: 'normal',
    confidence: 'medium',
    diemRuiRo: trich.diemRuiRo,
    hoKichBan: null,
    thucThe: trich.thucThe,
    giaiThichChoBac: 'Chưa thấy dấu hiệu rủi ro rõ ràng trong lời nhắn vừa ghi nhận; trợ lý không xác minh được danh tính thật chỉ qua lời nói.',
    signals: trich.maTinHieu.filter((m) =>
      ['TK_GIAO_HANG', 'TK_Y_TE_LICH_KHAM', 'TK_SUA_CHUA_DICH_VU', 'TK_HEN_GAP_HOI_THAM'].includes(m)
    ),
    callerClaim: trich.callerClaim,
    purpose: trich.maTinHieu.includes('TK_GIAO_HANG') ? 'Giao hàng / bưu phẩm' : 'Trao đổi thông thường',
    summary:
      aiTomTat?.summary ||
      `${trich.callerClaim}: "${vanBanSach.slice(0, 140)}". Chưa xác minh danh tính người gọi.`,
    recommendedAction: 'deliver_message',
    loiDap: locLoiDapThuKy('Trợ lý đã ghi lại lời nhắn để chủ máy kiểm tra sau ạ. Xin cảm ơn.'),
  };
}

module.exports = {
  PHIEN_BAN_LUAT_THU_KY,
  BO_QUY_TAC_AN_TOAN,
  BO_LUAT_TIN_HIEU,
  CONG_HUONG_THU_KY,
  LOI_CHAO_MO_DAU,
  LOI_CHUA_NGHE_RO_LAN_1,
  LOI_NHAN_DU_PHONG,
  LOI_TU_CHOI_THONG_TIN_RIENG,
  coPhuDinhCucBo,
  locLoiDapThuKy,
  trichThucTheCuocGoi,
  trichTinHieuThuKy,
  danhGiaLuotCuocGoi,
};
