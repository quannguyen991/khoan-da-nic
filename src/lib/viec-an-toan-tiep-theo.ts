/**
 * ═════ VIỆC AN TOÀN TIẾP THEO (Next Safe Action) — thêm 22/9/2026 ═════
 *
 * Trước hôm nay mọi kịch bản ra CÙNG một câu và CÙNG một nút: "Bác đừng chuyển
 * tiền, đừng đọc mã nào" + "GỌI NGAY CHO CON CHÁU". Đúng, nhưng chưa trúng:
 *
 *   giả danh ngân hàng   → việc cần làm là cúp máy, gọi số in sau thẻ
 *   dụ cài ứng dụng      → việc cần làm là KHÔNG cài, gửi cho con cháu xem
 *   giả danh người thân  → việc cần làm là gọi SỐ CŨ đã lưu, hỏi mật khẩu nhà
 *   đã lỡ chuyển tiền    → "đừng chuyển" đã muộn; việc cần làm là gọi ngân hàng
 *
 * Hàm này CHỌN MỘT việc, không liệt kê năm lời khuyên. Người đang bị ép thời
 * gian làm được một việc, không làm được năm.
 *
 * ⚠️ KHÔNG PHẢI MỘT ĐƯỜNG RA MỨC. Hàm chỉ đọc MÃ mà bộ luật đã trả (§HĐ luật 2),
 * không đọc chữ, không gọi AI, và không đụng tới `nhan` hay `canThiep`. Đổi
 * việc an toàn không bao giờ đổi được kết luận (§4.2).
 *
 * ⚠️ KHÔNG BỊA SỐ ĐIỆN THOẠI. Danh bạ ngân hàng hiện có 0 số đã được người duyệt,
 * nên kịch bản ngân hàng dẫn tới "số in ở mặt sau thẻ" — kênh tin cậy bác đã có
 * sẵn trong ví, không phải một con số app tự đưa ra.
 */

export type ViecAnToan =
  | 'goi_ngan_hang_phuc_hoi'   // đã lỡ chuyển — gọi ngân hàng khoá giao dịch
  | 'khong_cai_gui_nguoi_than' // dụ cài app / chia sẻ màn hình / điều khiển từ xa
  | 'goi_so_cu_nguoi_than'     // giả danh người thân / tài khoản người thân bị chiếm
  | 'goi_so_sau_the'           // giả danh ngân hàng — cúp máy, gọi số sau thẻ
  | 'khong_doc_ma'             // xin mã OTP
  | 'cup_may_goi_nguoi_than';  // mặc định cho mọi cảnh báo còn lại

const NHOM_CHIEM_MAY = ['DEV_INSTALL_APK_UNKNOWN', 'DEV_REMOTE_CONTROL_APP', 'DEV_SCREEN_SHARE_BANKING', 'DEV_ACCESSIBILITY_PERMISSION'];
const NHOM_NGUOI_THAN = ['ID_FAMILY_IMPERSONATION', 'ID_FAMILY_EMERGENCY_THIRD_PARTY', 'ID_CONTACT_ACCOUNT_TAKEOVER'];
const NHOM_NGAN_HANG = ['ID_BANK_IMPERSONATION', 'CRED_BANK_LOGIN'];

const HO_CHIEM_MAY = ['chiem_quyen_thiet_bi'];
const HO_NGUOI_THAN = ['gia_danh_nguoi_than', 'bao_tin_nguoi_than_gap_nan', 'tai_khoan_nguoi_than_bi_chiem'];
const HO_NGAN_HANG = ['gia_danh_ngan_hang'];

/**
 * ⚠️ THỨ TỰ LÀ QUYẾT ĐỊNH, KHÔNG PHẢI NGẪU NHIÊN.
 *  1. Đã mất tiền đứng đầu: mọi lời "đừng làm" sau đó đều đã muộn.
 *  2. Chiếm quyền máy đứng thứ hai: ứng dụng điều khiển từ xa rút được tiền
 *     TRONG LÚC bác còn đang đọc màn này — nó gấp hơn mọi kịch bản khác.
 *  3. Người thân và ngân hàng: đổi KÊNH gọi là việc cần làm, không đổi người gọi.
 *  4. OTP một mình: câu lệnh hẹp nhất và rõ nhất.
 *
 * `null` ⇒ không có cảnh báo ⇒ không có việc gì để giục. Màn "Chưa thấy dấu
 * hiệu" không được mọc ra một nút khẩn cấp (§4.6: báo oan đắt hơn bỏ sót).
 */
export function chonViecAnToan(vao: {
  maLyDo?: string[] | null;
  hoKichBan?: string | null;
  canThiep?: string | null;
  nhan?: string | null;
  daLoChuyen?: boolean;
}): ViecAnToan | null {
  const ma = new Set(Array.isArray(vao.maLyDo) ? vao.maLyDo : []);
  const ho = vao.hoKichBan || '';
  const co = (ds: string[]) => ds.some((x) => ma.has(x));

  if (vao.daLoChuyen || vao.canThiep === 'RECOVERY') return 'goi_ngan_hang_phuc_hoi';

  const coCanhBao = vao.nhan === 'CAO' || vao.nhan === 'NGHI_NGO'
    || vao.canThiep === 'PAUSE_60S' || vao.canThiep === 'PROTECTED_CRITICAL';
  if (!coCanhBao) return null;

  if (co(NHOM_CHIEM_MAY) || HO_CHIEM_MAY.includes(ho)) return 'khong_cai_gui_nguoi_than';
  if (co(NHOM_NGUOI_THAN) || HO_NGUOI_THAN.includes(ho)) return 'goi_so_cu_nguoi_than';
  if (co(NHOM_NGAN_HANG) || HO_NGAN_HANG.includes(ho)) return 'goi_so_sau_the';
  if (ma.has('CRED_OTP_SHARE')) return 'khong_doc_ma';
  return 'cup_may_goi_nguoi_than';
}

/**
 * Câu lệnh chính, tra catalog bằng khoá này (§4.1 — không mã cứng chữ ở màn).
 * Mỗi câu: MỘT việc, động từ đứng đầu, không giải thích.
 */
export const CAU_VIEC_AN_TOAN: Record<ViecAnToan, string> = {
  goi_ngan_hang_phuc_hoi: 'Bác gọi ngay số in sau thẻ ngân hàng để khoá giao dịch.',
  khong_cai_gui_nguoi_than: 'Bác đừng cài gì, đừng bấm link. Gửi cho con cháu xem trước.',
  goi_so_cu_nguoi_than: 'Bác gọi lại số cũ đã lưu của người thân để hỏi thật.',
  goi_so_sau_the: 'Bác cúp máy, rồi gọi số in ở mặt sau thẻ ngân hàng.',
  khong_doc_ma: 'Bác đừng đọc mã cho ai, kể cả người xưng là ngân hàng.',
  cup_may_goi_nguoi_than: 'Bác đừng chuyển tiền, đừng đọc mã nào.',
};
