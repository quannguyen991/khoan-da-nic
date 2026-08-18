'use strict';
/**
 * VERIFIED REQUEST — CHIỀU KIỂM.
 *
 * Khi bác nhận tin đòi tiền, app tra xem CÓ yêu cầu đã ký tương ứng từ người
 * trong vòng tròn gia đình hay không.
 *
 * ══════════════ GIỚI HẠN LỚN NHẤT — ĐỌC TRƯỚC KHI SỬA ══════════════
 *
 * Ở ĐỜI THẬT, "KHÔNG TÌM THẤY YÊU CẦU ĐÃ KÝ" LÀ TRẠNG THÁI **BÌNH THƯỜNG**.
 *
 * Hầu như không ai dùng tính năng này, nên câu đó sẽ bật cả với các yêu cầu
 * THẬT — con gái nhắn xin tiền thật cũng chẳng có chữ ký nào. Đây KHÔNG phải
 * tín hiệu lừa đảo. Nó là một lý do để DỪNG LẠI, không phải một kết luận.
 *
 * Nếu ai đó sau này thấy "tính năng chạy mà không ảnh hưởng gì tới điểm" rồi
 * định nối nó vào bộ luật cho "có tác dụng" — ĐỪNG. Nối vào là biến một trạng
 * thái bình thường thành một cáo buộc, và mọi tin nhắn của con cháu sẽ đỏ.
 *
 * Vì vậy:
 *   · KHÔNG đẩy "không tìm thấy" thành tín hiệu làm tăng điểm.
 *   · Nó thuộc `chuaKiem`, KHÔNG thuộc `maLyDo`.
 *   · §11: không kết luận lừa đảo, không quy kết cá nhân.
 *   · Câu chữ tuyệt đối không được thành "Minh không hề gửi yêu cầu này" — app
 *     KHÔNG BIẾT điều đó. Nó chỉ biết là mình CHƯA THẤY. Hai chuyện khác nhau,
 *     và đây đúng là §4.3 ở dạng câu chữ.
 *
 * ⚠️ CHỈ CÓ CHIỀU KIỂM. Màn cho người con TẠO yêu cầu đã ký chưa dựng — chiều
 * kiểm mới là chiều dùng được ngay.
 *
 * ⚠️ Tệp này KHÔNG chạm decision-engine. Nó trả về dữ liệu để `analyze()` đưa
 * vào `chuaKiem`, và một nhánh DUY NHẤT làm tăng mức: khi người thân đã ký
 * TỪ CHỐI — mà nhánh đó xử ở pipeline.js, không phải ở đây.
 */

const { layKho } = require('./khoan-proof');
const { BANG, MA_KET_QUA } = require('./khoan-proof-ky');

/**
 * MÃ CHIỀU KIỂM — frontend tra catalog. §HĐ luật 2.
 *
 * ⚠️ Tên mã mô tả TRẠNG THÁI HIỂU BIẾT CỦA APP, không mô tả hành vi của người
 * thân. `CHUA_THAY_...` chứ không phải `KHONG_GUI_...`.
 */
const MA_CHIEU_KIEM = Object.freeze({
  CHUA_THAY: 'chua_thay_yeu_cau_da_xac_thuc',
  DA_THAY_XAC_NHAN: 'YEU_CAU_DA_DUOC_KY_BOI_TAI_KHOAN',
  DA_THAY_TU_CHOI: 'TAI_KHOAN_DA_KY_TU_CHOI_YEU_CAU',
  DANG_CHO: 'DANG_CHO_TAI_KHOAN_KIA_KY',
});

/**
 * Tra xem vụ việc này có yêu cầu đã ký hay không.
 *
 * ⚠️ CHỈ TRA TRONG VÒNG CỦA CHÍNH `chuTaiKhoanId`. Không có lối nào đọc được
 * chữ ký của gia đình khác — kể cả khi biết đúng `caseId`.
 *
 * @param {object} p { chuTaiKhoanId, caseId }
 * @returns {{timThay:boolean, maKetQua:string, kyBoi?:string, cumTu?:string}}
 */
async function traYeuCauDaKy({ chuTaiKhoanId, caseId } = {}, { bayGio = Date.now() } = {}) {
  const chuaThay = { timThay: false, maKetQua: MA_CHIEU_KIEM.CHUA_THAY };
  if (typeof chuTaiKhoanId !== 'string' || typeof caseId !== 'string') return chuaThay;

  const kho = await layKho();
  if (typeof kho.liet !== 'function') return chuaThay;

  const hop = (await kho.liet(BANG.YEU_CAU))
    .filter((y) => y.chuTaiKhoanId === chuTaiKhoanId && y.caseId === caseId)
    // Mới nhất trước — một vụ việc có thể hỏi lại nhiều lượt.
    .sort((a, b) => (b.kyLuc || b.taoLuc || 0) - (a.kyLuc || a.taoLuc || 0));

  const daKy = hop.find((y) => y.trangThai === MA_KET_QUA.DA_KY_XAC_NHAN
    || y.trangThai === MA_KET_QUA.DA_KY_TU_CHOI);

  if (daKy) {
    return {
      timThay: true,
      maKetQua: daKy.trangThai,
      kyBoi: daKy.kyBoi,
      cumTu: daKy.cumTu,
    };
  }

  /**
   * §4.3 — CÒN ĐANG CHỜ KHÁC HẲN CHƯA TỪNG HỎI, và cả hai đều khác "đã trả lời".
   * Yêu cầu còn hạn mà chưa ai ký ⇒ ĐANG CHỜ. Quá hạn mà không ai ký ⇒ đó là
   * "chưa liên lạc được", xử ở khoan-proof-ky.js, không phải "chưa thấy".
   */
  const dangCho = hop.find((y) => y.trangThai === MA_KET_QUA.DANG_CHO_KY && bayGio <= y.hetHan);
  if (dangCho) return { timThay: false, maKetQua: MA_CHIEU_KIEM.DANG_CHO };

  return chuaThay;
}

/**
 * Đổi kết quả chiều kiểm thành ĐẦU VÀO cho `analyze()`.
 *
 * ⚠️ Chỉ có MỘT nhánh sinh ra thứ làm tăng mức: `DA_KY_TU_CHOI`. Ba nhánh còn
 * lại chỉ nói ra mình biết tới đâu, và không đụng vào điểm số (§4.2).
 */
function dauVaoTuKetQua(kq = {}) {
  if (kq.maKetQua === MA_KET_QUA.DA_KY_TU_CHOI) {
    return { xacMinhNguoiThan: 'DA_TU_CHOI' };
  }
  if (kq.maKetQua === MA_KET_QUA.DA_KY_XAC_NHAN) {
    return { xacMinhNguoiThan: 'DA_XAC_NHAN' };
  }
  // ⚠️ KHÔNG trả `xacMinhNguoiThan` ở đây. "Chưa thấy" và "đang chờ" KHÔNG phải
  // câu trả lời của người thân — gán chúng vào đó là bịa ra một lượt hỏi chưa
  // từng xảy ra. Chúng đi đường riêng, vào `chuaKiem`.
  return { chuaThayYeuCauDaXacThuc: true };
}

module.exports = { traYeuCauDaKy, dauVaoTuKetQua, MA_CHIEU_KIEM };
