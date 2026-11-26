'use strict';
/**
 * ═════════ BỘ 30 KỊCH BẢN & DỮ LIỆU KIỂM THỬ THƯ KÝ NGHE MÁY HỘ (§7) ═════════
 *
 * Bao gồm 30 kịch bản có nhãn chuẩn chia thành 3 nhóm theo §7 của
 * `ke-hoach-thu-ky-nghe-may-ho.md`:
 *   1. Cuộc gọi hợp lệ (9 kịch bản)
 *   2. Cuộc gọi đáng ngờ — gồm kịch bản 2 lượt & 3 lượt (13 kịch bản)
 *   3. Tình huống khó — phủ định, nói vội/cấp cứu, moi thông tin, mất AI, không dấu (8 kịch bản)
 */

const { danhGiaLuotCuocGoi } = require('./thu-ky-bo-luat');

const BO_KICH_BAN_THU_KY = [
  // ────────── NHÓM 1: CUỘC GỌI HỢP LỆ (9) ──────────
  {
    id: 'hl-01',
    nhom: 'hop_le',
    ten: 'Con cháu gọi từ số mới báo việc nhà',
    soNguoiGoi: '0971***801',
    cacLuot: [
      { loiNoi: 'Mẹ ơi con là Minh đây, con mới đổi số, tối nay con ghé qua ăn cơm với bố mẹ nhé.' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN', 'TK_OTP_MAT_KHAU'],
  },
  {
    id: 'hl-02',
    nhom: 'hop_le',
    ten: 'Người giao hàng bưu điện đơn thuần',
    soNguoiGoi: '0904***811',
    cacLuot: [
      { loiNoi: 'Chào bác, em bên bưu điện giao hàng có kiện hàng gửi tới nhà bác, bác có ở nhà nhận không ạ?' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN', 'TK_TRUY_CAP_LINK'],
  },
  {
    id: 'hl-03',
    nhom: 'hop_le',
    ten: 'Bệnh viện gọi xác nhận lịch tái khám',
    soNguoiGoi: '0243***900',
    cacLuot: [
      { loiNoi: 'Chào bác, em gọi từ phòng khám nhắc bác sáng mai 8 giờ có lịch tái khám định kỳ ạ.' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN'],
  },
  {
    id: 'hl-04',
    nhom: 'hop_le',
    ten: 'Hàng xóm báo lịch họp tổ dân phố',
    soNguoiGoi: '0915***220',
    cacLuot: [
      { loiNoi: 'Chào bác, tôi là hàng xóm cạnh nhà gọi báo chiều nay tổ dân phố họp ở nhà văn hóa.' },
    ],
    kyVongTrangThai: 'thong_thuong',
  },
  {
    id: 'hl-05',
    nhom: 'hop_le',
    ten: 'Ngân hàng gọi theo lịch hẹn trước (nói rõ không chuyển tiền)',
    soNguoiGoi: '0283***100',
    cacLuot: [
      { loiNoi: 'Tôi là nhân viên ngân hàng gọi xác nhận lịch hẹn nhận thẻ mới tại quầy, không chuyển tiền và không cần OTP.' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN', 'TK_OTP_MAT_KHAU'],
  },
  {
    id: 'hl-06',
    nhom: 'hop_le',
    ten: 'Gọi nhầm số xin lỗi',
    soNguoiGoi: '0962***331',
    cacLuot: [
      { loiNoi: 'À xin lỗi tôi bấm nhầm số rồi, cảm ơn.' },
    ],
    kyVongTrangThai: 'thong_thuong',
  },
  {
    id: 'hl-07',
    nhom: 'hop_le',
    ten: 'Thợ sửa điện nước hẹn giờ qua bảo trì',
    soNguoiGoi: '0983***410',
    cacLuot: [
      { loiNoi: 'Chào bác, cháu là thợ sửa điều hòa bên cửa hàng hẹn chiều nay 3 giờ qua bảo trì theo lịch bác đã đặt.' },
    ],
    kyVongTrangThai: 'thong_thuong',
  },
  {
    id: 'hl-08',
    nhom: 'hop_le',
    ten: 'Tổ trưởng dân phố nhắc lịch sinh hoạt Hội người cao tuổi',
    soNguoiGoi: '0919***882',
    cacLuot: [
      { loiNoi: 'Bác ơi tôi là tổ trưởng dân phố gọi nhắc sáng chủ nhật hội người cao tuổi tập dưỡng sinh ngoài sân.' },
    ],
    kyVongTrangThai: 'thong_thuong',
  },
  {
    id: 'hl-09',
    nhom: 'hop_le',
    ten: 'Bác sĩ gọi hỏi thăm kết quả xét nghiệm (không đòi tiền/link)',
    soNguoiGoi: '0243***775',
    cacLuot: [
      { loiNoi: 'Chào bác, phòng khám gọi báo kết quả xét nghiệm máu của bác đã có, tuần sau bác ghé lấy nhé.' },
    ],
    kyVongTrangThai: 'thong_thuong',
  },

  // ────────── NHÓM 2: CUỘC GỌI ĐÁNG NGỜ (13) ──────────
  {
    id: 'dn-01',
    nhom: 'dang_ngo',
    ten: 'Giả danh công an đe dọa bắt giữ và đòi chuyển vào tài khoản tạm giữ',
    soNguoiGoi: '0981***204',
    cacLuot: [
      { loiNoi: 'Tôi là cán bộ Công an, bác liên quan vụ án rửa tiền cần chuyển tiền vào tài khoản tạm giữ ngay và giữ bí mật.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CHUYEN_TIEN', 'TK_TAI_KHOAN_AN_TOAN', 'TK_GIU_BI_MAT'],
  },
  {
    id: 'dn-02',
    nhom: 'dang_ngo',
    ten: 'Giả danh ngân hàng xin mã OTP khóa thẻ',
    soNguoiGoi: '0899***412',
    cacLuot: [
      { loiNoi: 'Em bên ngân hàng Vietcombank báo thẻ của bác sắp bị khóa, bác đọc mã OTP gửi về máy để em hủy giao dịch.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_OTP_MAT_KHAU'],
  },
  {
    id: 'dn-03',
    nhom: 'dang_ngo',
    ten: 'Mạo danh con cháu báo tai nạn, xin tiền gấp và dặn giữ bí mật',
    soNguoiGoi: '0345***778',
    cacLuot: [
      { loiNoi: 'Mẹ ơi con đây, con vừa bị tai nạn nhập viện cần chuyển tiền gấp 15 triệu đóng viện phí, đừng cho ai biết nhé.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CHUYEN_TIEN', 'TK_KHAN_CAP_Y_TE'],
  },
  {
    id: 'dn-04',
    nhom: 'dang_ngo',
    ten: 'Giả danh giao hàng dụ bấm đường link lạ',
    soNguoiGoi: '0908***991',
    cacLuot: [
      { loiNoi: 'Em bên shipper giao hàng đây, bác bấm link https://giaohang-vn-xacnhan.xyz để xác nhận nhận đơn nhé.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_TRUY_CAP_LINK'],
  },
  {
    id: 'dn-05',
    nhom: 'dang_ngo',
    ten: 'Giả danh cán bộ phường dụ cài app VNeID mới (APK)',
    soNguoiGoi: '0944***662',
    cacLuot: [
      { loiNoi: 'Chào bác, tôi bên công an phường hướng dẫn bác tải file APK cài app VNeID mới để đồng bộ dữ liệu.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CAI_APP_TRO_NANG'],
  },
  {
    id: 'dn-06',
    nhom: 'dang_ngo',
    ten: 'Kịch bản 2 lượt: Lượt 1 bình thường -> Lượt 2 đòi chuyển tiền điện lực',
    soNguoiGoi: '0918***505',
    cacLuot: [
      { loiNoi: 'Chào bác, tôi là cán bộ bên điện lực gọi trao đổi hồ sơ.' },
      { loiNoi: 'Hồ sơ của bác bị tính sai cước, bác phải chuyển khoản nộp phí 2 triệu trong 10 phút kẻo bị cắt điện.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CHUYEN_TIEN'],
  },
  {
    id: 'dn-07',
    nhom: 'dang_ngo',
    ten: 'Cấm cúp máy và đòi bật chia sẻ màn hình',
    soNguoiGoi: '0931***709',
    cacLuot: [
      { loiNoi: 'Bác bật chia sẻ màn hình ngay lập tức, không được cúp máy để bên tôi kiểm tra tài khoản.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CAI_APP_TRO_NANG', 'TK_CAM_CUP_MAY'],
  },
  {
    id: 'dn-08',
    nhom: 'dang_ngo',
    ten: 'Kịch bản 3 lượt: Lượt 1 chào hỏi -> Lượt 2 nói chung chung -> Lượt 3 dụ cài TeamViewer',
    soNguoiGoi: '0977***612',
    cacLuot: [
      { loiNoi: 'Alo tôi gọi gặp bác.' },
      { loiNoi: 'Tôi bên bộ phận hỗ trợ kỹ thuật bảo hiểm xã hội hướng dẫn bác cài TeamViewer để cập nhật thẻ BHYT.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CAI_APP_TRO_NANG'],
  },
  {
    id: 'dn-09',
    nhom: 'dang_ngo',
    ten: 'Giả danh Viện kiểm sát dọa khởi tố & bắt mua thẻ quà tặng / USDT',
    soNguoiGoi: '0888***301',
    cacLuot: [
      { loiNoi: 'Viện kiểm sát thông báo bác có lệnh khởi tố, hãy mua thẻ quà tặng hoặc chuyển USDT vào ví bảo lãnh ngay.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_DE_DOA_PHAP_LY', 'TK_THE_QUA_TANG_TIEN_AO'],
  },
  {
    id: 'dn-10',
    nhom: 'dang_ngo',
    ten: 'Giả danh ngân hàng dụ bấm link nâng cấp sinh trắc học',
    soNguoiGoi: '0902***718',
    cacLuot: [
      { loiNoi: 'Em bên Techcombank báo thẻ của bác bị khóa hôm nay là hạn chót, bác bấm vào đường dẫn để xác minh gấp.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_TRUY_CAP_LINK'],
  },
  {
    id: 'dn-11',
    nhom: 'dang_ngo',
    ten: 'Mời chào việc nhẹ lương cao, nạp tiền nhận hoa hồng',
    soNguoiGoi: '0399***114',
    cacLuot: [
      { loiNoi: 'Chào bác, bên em tuyển cộng tác viên chốt đơn làm nhiệm vụ tại nhà nhận hoa hồng 500 nghìn mỗi ngày.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_VIEC_NHE_HOA_HONG'],
  },
  {
    id: 'dn-12',
    nhom: 'dang_ngo',
    ten: 'Giả danh Cục Thuế đe dọa phong tỏa tài khoản',
    soNguoiGoi: '0911***245',
    cacLuot: [
      { loiNoi: 'Cục thuế gọi thông báo bác nợ thuế sẽ bị phong tỏa tài khoản nếu không nộp phạt ngay trong 15 phút.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CHUYEN_TIEN', 'TK_DE_DOA_PHAP_LY'],
  },
  {
    id: 'dn-13',
    nhom: 'dang_ngo',
    ten: 'Dặn không nói với ai và đọc mã PIN thẻ ngân hàng',
    soNguoiGoi: '0948***552',
    cacLuot: [
      { loiNoi: 'Bác tuyệt đối đừng nói với ai và đọc mã PIN thẻ ngân hàng để em kiểm tra hoàn tiền.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_OTP_MAT_KHAU', 'TK_GIU_BI_MAT'],
  },

  // ────────── NHÓM 3: TÌNH HUỐNG KHÓ (8) ──────────
  {
    id: 'kh-01',
    nhom: 'tinh_huong_kho',
    ten: 'Cấp cứu gia đình thật (nói vội, không đòi tiền/OTP)',
    soNguoiGoi: '0912***559',
    cacLuot: [
      { loiNoi: 'Alo bác ơi, cháu gọi từ bệnh viện Bạch Mai báo người nhà vừa bị tai nạn cần gia đình vào gấp!' },
    ],
    kyVongTrangThai: 'khan_cap',
  },
  {
    id: 'kh-02',
    nhom: 'tinh_huong_kho',
    ten: 'Cố tình moi địa chỉ nhà & hỏi bác có ở một mình không',
    soNguoiGoi: '0978***113',
    cacLuot: [
      { loiNoi: 'Tôi gọi kiểm tra nhân khẩu, bác cho hỏi địa chỉ nhà bác ở đâu và hiện giờ bác ở nhà một mình à?' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_MOI_THONG_TIN_RIENG'],
  },
  {
    id: 'kh-03',
    nhom: 'tinh_huong_kho',
    ten: 'Phủ định tiền nhưng cố tình moi số CCCD và số dư tài khoản',
    soNguoiGoi: '0965***309',
    cacLuot: [
      { loiNoi: 'Cháu không đòi chuyển tiền đâu, bác chỉ cần đọc số CCCD và trong tài khoản có bao nhiêu tiền thôi.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_MOI_THONG_TIN_RIENG'],
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN'],
  },
  {
    id: 'kh-04',
    nhom: 'tinh_huong_kho',
    ten: 'Không nghe rõ 2 lượt liên tiếp (ồn / hai người nói)',
    soNguoiGoi: 'Số lạ',
    cacLuot: [
      { loiNoi: '', khongNgheRo: true },
      { loiNoi: '', khongNgheRo: true },
    ],
    kyVongTrangThai: 'khong_du_thong_tin',
  },
  {
    id: 'kh-05',
    nhom: 'tinh_huong_kho',
    ten: 'Dịch vụ AI mất kết nối giữa cuộc gọi bình thường',
    soNguoiGoi: '0909***007',
    cacLuot: [
      { loiNoi: 'Chào bác, em gọi hỏi thăm lịch họp mặt cuối tuần của lớp cũ.', aiLoi: true },
    ],
    kyVongTrangThai: 'loi_he_thong',
  },
  {
    id: 'kh-06',
    nhom: 'tinh_huong_kho',
    ten: 'Lượt 1 nói ngắn chung chung -> Trợ lý hỏi 1 câu -> Lượt 2 rõ ràng hợp lệ',
    soNguoiGoi: '0987***654',
    cacLuot: [
      { loiNoi: 'Alo cho tôi gặp bác một chút.' },
      { loiNoi: 'Tôi là Hùng hàng xóm hẹn bác sáng mai đi tập dưỡng sinh cùng hội người cao tuổi.' },
    ],
    kyVongTrangThai: 'thong_thuong',
  },
  {
    id: 'kh-07',
    nhom: 'tinh_huong_kho',
    ten: 'Lời thoại không dấu đòi chuyển khoản vào tài khoản an toàn',
    soNguoiGoi: '0933***918',
    cacLuot: [
      { loiNoi: 'Toi ben cong an yeu cau bac chuyen khoan vao tai khoan an toan ngay lap tuc.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CHUYEN_TIEN', 'TK_TAI_KHOAN_AN_TOAN'],
  },
  {
    id: 'kh-08',
    nhom: 'tinh_huong_kho',
    ten: 'Nói phủ định cả chuyển tiền lẫn bấm link ("không cần bấm link")',
    soNguoiGoi: '0243***222',
    cacLuot: [
      { loiNoi: 'Em bên phòng khám báo bác tới lấy kết quả trực tiếp, không cần bấm link và không cần chuyển tiền trước.' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN', 'TK_TRUY_CAP_LINK'],
  },
  // ────────── MỞ RỘNG 20 KỊCH BẢN 2025–2026 (31–50) ──────────
  {
    id: 'hl-10',
    nhom: 'hop_le',
    ten: 'Công an phường mời ra trụ sở làm VNeID trực tiếp (không link, không tiền)',
    soNguoiGoi: '0243***601',
    cacLuot: [
      { loiNoi: 'Chào bác, tôi là cảnh sát khu vực gọi mời bác sáng thứ bảy mang căn cước ra trụ sở công an phường để làm VNeID trực tiếp, không cần chuyển tiền và không bấm link.' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN', 'TK_TRUY_CAP_LINK'],
  },
  {
    id: 'hl-11',
    nhom: 'hop_le',
    ten: 'Ngân hàng nhắc tới quầy cập nhật sinh trắc học (không gửi link/OTP)',
    soNguoiGoi: '0283***602',
    cacLuot: [
      { loiNoi: 'Chào bác, nhân viên Vietcombank gọi nhắc bác ghé chi nhánh gần nhất mang theo căn cước để cập nhật sinh trắc học, không cần đọc OTP hay bấm link.' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_OTP_MAT_KHAU', 'TK_TRUY_CAP_LINK'],
  },
  {
    id: 'hl-12',
    nhom: 'hop_le',
    ten: 'Shipper giao hàng thu tiền mặt khi nhận (COD)',
    soNguoiGoi: '0903***603',
    cacLuot: [
      { loiNoi: 'Bác ơi em shipper giao kiện hàng tới cổng rồi, bác ra kiểm tra hàng rồi thanh toán tiền mặt cho em nhé.' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN', 'TK_TRUY_CAP_LINK'],
  },
  {
    id: 'hl-13',
    nhom: 'hop_le',
    ten: 'BHXH phường nhắc lịch hẹn kiểm tra hồ sơ tại bộ phận một cửa',
    soNguoiGoi: '0243***604',
    cacLuot: [
      { loiNoi: 'Chào bác, cán bộ bảo hiểm xã hội phường nhắc bác sáng thứ năm tới lịch hẹn ra bộ phận một cửa nhận thẻ BHYT mới.' },
      { loiNoi: 'Dạ bác chỉ cần mang thẻ cũ tới quầy, không cần chuyển tiền và không cần gửi mã gì hết ạ.' },
    ],
    kyVongTrangThai: 'thong_thuong',
  },
  {
    id: 'hl-14',
    nhom: 'hop_le',
    ten: 'Con gái báo đã chuyển tiền biếu mẹ',
    soNguoiGoi: '0912***605',
    cacLuot: [
      { loiNoi: 'Mẹ ơi con là Hoa đây, con vừa gửi ít tiền biếu bố mẹ mua thuốc bổ, mẹ không phải chuyển lại cho con đâu.' },
    ],
    kyVongTrangThai: 'thong_thuong',
    kyVongTinHieuCam: ['TK_CHUYEN_TIEN'],
  },
  {
    id: 'hl-15',
    nhom: 'hop_le',
    ten: 'Thợ lắp mạng hẹn chiều qua kiểm tra đường truyền',
    soNguoiGoi: '0987***606',
    cacLuot: [
      { loiNoi: 'Chào bác, cháu là thợ lắp mạng hẹn 2 giờ chiều nay qua bảo trì đường truyền theo lịch bác hẹn hôm qua.' },
    ],
    kyVongTrangThai: 'thong_thuong',
  },
  {
    id: 'dn-14',
    nhom: 'dang_ngo',
    ten: 'Giả danh công an yêu cầu tải app VNeID mới qua link ngoài',
    soNguoiGoi: '0988***701',
    cacLuot: [
      { loiNoi: 'Tôi là cán bộ công an phường, hồ sơ VNeID của bác bị lỗi, bác bấm vào đường dẫn tôi gửi để tải VNeID mới và bật quyền trợ năng.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CAI_APP_TRO_NANG', 'TK_TRUY_CAP_LINK'],
  },
  {
    id: 'dn-15',
    nhom: 'dang_ngo',
    ten: 'Giả danh BHXH báo hoàn tiền BHYT và xin mã OTP',
    soNguoiGoi: '0977***702',
    cacLuot: [
      { loiNoi: 'Tôi bên bảo hiểm xã hội gọi thông báo bác được hoàn tiền BHYT, bác đọc mã OTP vừa gửi về máy để tôi làm thủ tục nhận tiền.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['ID_TAX_BENEFIT_IMPERSONATION', 'TK_OTP_MAT_KHAU'],
  },
  {
    id: 'dn-16',
    nhom: 'dang_ngo',
    ten: 'Giả danh CSGT báo phạt nguội và ép đóng phạt gấp',
    soNguoiGoi: '0966***703',
    cacLuot: [
      { loiNoi: 'Phòng CSGT thông báo xe của bác bị phạt nguội, bác phải nộp phạt ngay lập tức qua tài khoản cơ quan kẻo bị khởi tố.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CHUYEN_TIEN', 'TK_DE_DOA_PHAP_LY'],
  },
  {
    id: 'dn-17',
    nhom: 'dang_ngo',
    ten: 'Giả ngân hàng hỗ trợ sinh trắc học, đòi quay video khuôn mặt và chụp 2 mặt CCCD',
    soNguoiGoi: '0909***704',
    cacLuot: [
      { loiNoi: 'Em bên ngân hàng Vietcombank gọi hỗ trợ sinh trắc học kẻo bị khóa giao dịch, bác chụp hai mặt CCCD và quay video khuôn mặt gửi qua Zalo cho em.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_MOI_THONG_TIN_RIENG', 'TK_DE_DOA_PHAP_LY'],
  },
  {
    id: 'dn-18',
    nhom: 'dang_ngo',
    ten: 'Dụ quét mã QR nhận hoàn thuế rồi nhập OTP',
    soNguoiGoi: '0911***705',
    cacLuot: [
      { loiNoi: 'Chào bác, bên Cục Thuế gửi mã hoàn thuế, bác quét mã QR trong ảnh rồi nhập mã OTP để nhận tiền ngay.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_TRUY_CAP_LINK', 'TK_OTP_MAT_KHAU'],
  },
  {
    id: 'dn-19',
    nhom: 'dang_ngo',
    ten: 'Shipper báo gửi nhầm số tài khoản thu hộ, dụ bấm link hủy gói trừ tiền',
    soNguoiGoi: '0932***706',
    cacLuot: [
      { loiNoi: 'Bác ơi em bên giao hàng gửi nhầm số tài khoản thu hộ nên hệ thống sắp trừ tiền hàng tháng, bác bấm vào đường dẫn để hủy ngay lập tức.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_TRUY_CAP_LINK', 'TK_EP_THOI_GIAN'],
  },
  {
    id: 'dn-20',
    nhom: 'dang_ngo',
    ten: 'Tuyển CTV chốt đơn online nạp trước rút sau',
    soNguoiGoi: '0944***707',
    cacLuot: [
      { loiNoi: 'Bên em tuyển cộng tác viên làm nhiệm vụ chốt đơn tại nhà, hoa hồng cao, nạp trước rút sau và chuyển tiền vào tài khoản hệ thống.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_VIEC_NHE_HOA_HONG', 'TK_CHUYEN_TIEN'],
  },
  {
    id: 'dn-21',
    nhom: 'dang_ngo',
    ten: 'Deepfake giả con cháu gọi video mờ đòi chuyển tiền và giữ bí mật',
    soNguoiGoi: '0955***708',
    cacLuot: [
      { loiNoi: 'Mẹ ơi con đây, máy con hỏng nên gọi hơi mờ, mẹ chuyển tiền gấp lắm rồi giúp con và đừng nói với ai nhé.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CHUYEN_TIEN', 'TK_GIU_BI_MAT'],
  },
  {
    id: 'dn-22',
    nhom: 'dang_ngo',
    ten: 'Giả nhà mạng dọa khóa SIM ép đổi eSIM qua link',
    soNguoiGoi: '0965***709',
    cacLuot: [
      { loiNoi: 'Thông báo thuê bao chưa chuẩn hóa thông tin, sẽ bị khóa SIM sau 2 giờ, bác vào link để đổi eSIM ngay lập tức.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CAI_APP_TRO_NANG', 'TK_DE_DOA_PHAP_LY'],
  },
  {
    id: 'dn-23',
    nhom: 'dang_ngo',
    ten: 'Giả cơ quan thuế ép cài eTax APK và bật AnyDesk',
    soNguoiGoi: '0976***710',
    cacLuot: [
      { loiNoi: 'Tôi bên Cục Thuế hướng dẫn hoàn thuế, bác tải eTax file APK và cài AnyDesk để tôi hỗ trợ từ xa.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_CAI_APP_TRO_NANG', 'ID_TAX_BENEFIT_IMPERSONATION'],
  },
  {
    id: 'dn-24',
    nhom: 'dang_ngo',
    ten: 'Giả BHXH dọa ngừng lương hưu để moi số CCCD và ép chuyển phí',
    soNguoiGoi: '0986***711',
    cacLuot: [
      { loiNoi: 'Bên BHXH báo hồ sơ hưu trí của bác bị lỗi có thể ngừng lương hưu, bác đọc số CCCD và đóng phí xác minh ngay.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_DE_DOA_PHAP_LY', 'TK_MOI_THONG_TIN_RIENG'],
  },
  {
    id: 'kh-09',
    nhom: 'tinh_huong_kho',
    ten: 'Lời thoại không dấu dọa phạt nguội và đòi nộp phạt qua link',
    soNguoiGoi: '0938***712',
    cacLuot: [
      { loiNoi: 'Phong CSGT bao xe bac bi phat nguoi, bac bam vao link de nop phat ngay lap tuc.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_DE_DOA_PHAP_LY', 'TK_CHUYEN_TIEN'],
  },
  {
    id: 'kh-10',
    nhom: 'tinh_huong_kho',
    ten: 'Cuộc gọi 2 lượt: lượt 1 nói chung chung, lượt 2 mới lộ đòi USDT',
    soNguoiGoi: '0939***713',
    cacLuot: [
      { loiNoi: 'Chào bác, tôi gọi từ công ty muốn trao đổi với bác.' },
      { loiNoi: 'Bác nạp tiền mua USDT rồi chuyển vào ví này để nhận hoa hồng cao nhé.' },
    ],
    kyVongTrangThai: 'dang_ngo',
    kyVongTinHieuBatBuoc: ['TK_THE_QUA_TANG_TIEN_AO', 'TK_VIEC_NHE_HOA_HONG'],
  },
  {
    id: 'kh-11',
    nhom: 'tinh_huong_kho',
    ten: 'Người gọi báo tai nạn cấp cứu nhưng không đòi tiền hay thông tin riêng',
    soNguoiGoi: '0931***714',
    cacLuot: [
      { loiNoi: 'Alo bác ơi con bác vừa bị tai nạn đang ở phòng cấp cứu bệnh viện Bạch Mai, bác ra ngay nhé.' },
    ],
    kyVongTrangThai: 'khan_cap',
    kyVongTinHieuBatBuoc: ['TK_KHAN_CAP_Y_TE'],
  },
];

function chayDanhGiaBoLuatThuKy() {
  const ketQuaChiTiet = [];
  let dung = 0;

  let tongDangNgo = 0;
  let batDungDangNgo = 0;
  let tongHopLe = 0;
  let baoNhamHopLe = 0;

  for (const kb of BO_KICH_BAN_THU_KY) {
    let toanBo = '';
    let daHoiLamRo = false;
    let soLuotHoiLaiKhongRo = 0;
    let kqCuoi = null;

    for (const luot of kb.cacLuot) {
      if (!luot.khongNgheRo && luot.loiNoi) {
        toanBo = toanBo ? `${toanBo} ${luot.loiNoi}` : luot.loiNoi;
      }
      kqCuoi = danhGiaLuotCuocGoi({
        toanBoLoiNguoiGoi: toanBo,
        daHoiLamRo,
        soLuotHoiLaiKhongRo,
        khongNgheRo: Boolean(luot.khongNgheRo),
        aiLoi: Boolean(luot.aiLoi),
      });
      if (kqCuoi.tangHoiLamRo) daHoiLamRo = true;
      if (kqCuoi.tangLuotKhongRo) soLuotHoiLaiKhongRo += 1;
      if (kqCuoi.ketThuc) break;
    }

    let dat = kqCuoi && kqCuoi.trangThaiPhanLoai === kb.kyVongTrangThai;
    if (dat && Array.isArray(kb.kyVongTinHieuBatBuoc)) {
      for (const th of kb.kyVongTinHieuBatBuoc) {
        if (!kqCuoi.signals.includes(th)) dat = false;
      }
    }
    if (dat && Array.isArray(kb.kyVongTinHieuCam)) {
      for (const th of kb.kyVongTinHieuCam) {
        if (kqCuoi.signals.includes(th)) dat = false;
      }
    }

    if (kb.nhom === 'dang_ngo') {
      tongDangNgo += 1;
      if (kqCuoi?.trangThaiPhanLoai === 'dang_ngo') batDungDangNgo += 1;
    }
    if (kb.nhom === 'hop_le') {
      tongHopLe += 1;
      if (kqCuoi?.trangThaiPhanLoai === 'dang_ngo') baoNhamHopLe += 1;
    }

    if (dat) dung += 1;
    ketQuaChiTiet.push({
      id: kb.id,
      nhom: kb.nhom,
      ten: kb.ten,
      dat,
      kyVong: kb.kyVongTrangThai,
      thucTe: kqCuoi?.trangThaiPhanLoai || 'khong_co',
      diemRuiRo: kqCuoi?.diemRuiRo || 0,
      hoKichBan: kqCuoi?.hoKichBan || null,
      signals: kqCuoi?.signals || [],
      loiDapCuoi: kqCuoi?.loiDap || '',
    });
  }

  return {
    tongKichBan: BO_KICH_BAN_THU_KY.length,
    soKichBanDat: dung,
    tyLeDatPhanTram: Math.round((dung / BO_KICH_BAN_THU_KY.length) * 1000) / 10,
    recallDangNgoPhanTram: tongDangNgo ? Math.round((batDungDangNgo / tongDangNgo) * 1000) / 10 : 100,
    baoNhamHopLePhanTram: tongHopLe ? Math.round((baoNhamHopLe / tongHopLe) * 1000) / 10 : 0,
    chiTiet: ketQuaChiTiet,
  };
}

module.exports = {
  BO_KICH_BAN_THU_KY,
  chayDanhGiaBoLuatThuKy,
};
