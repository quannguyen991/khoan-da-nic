/**
 * ═════ KẾT QUẢ NÀO THÌ BÁO CHO CON, VÀ BÁO LOẠI GÌ — thêm 3/10/2026 ═════
 *
 * Chủ dự án muốn con được báo ở ba mức:
 *   · nguy hiểm CAO            → `ket_qua_kiem`      (cảnh báo gấp)
 *   · có dấu hiệu (NGHI_NGO)   → `ket_qua_nghi_ngo`  (cảnh báo gấp)
 *   · chưa kiểm được           → `chua_kiem_duoc`    (tin nhắn đơn giản)
 *
 * Hàm này CHỈ chọn LOẠI để gửi. Việc có gửi thật hay không do MÁY CHỦ quyết, theo ba công
 * tắc riêng của bố mẹ (mặc định TẮT — §12). Máy này không đọc, không đoán công tắc.
 *
 * ⚠️ §6.9 — chỉ trả MÃ. Không có chữ nào của tin nhắn đi qua đây.
 * ⚠️ §4.2 — hàm không đụng tới nhãn rủi ro; nó chỉ ĐỌC nhãn mà bộ luật đã trả.
 */

export type LoaiBaoCon =
  | 'ket_qua_kiem' | 'ket_qua_nghi_ngo' | 'chua_kiem_duoc'
  | 'otp_trong_cuoc_goi' | 'cai_app_trong_cuoc_goi' | 'tien_ra_trong_cuoc_goi';

/**
 * Mã "chưa kiểm được" mà BÁC LÀ NGƯỜI GỬI THỨ KHÔNG ĐỌC ĐƯỢC: ảnh, link, ghi âm, tin quá dài/quá
 * ngắn, thông báo rỗng, AI không trả lời kịp.
 *
 * ⚠️ KHÔNG nằm trong danh sách này, có chủ đích:
 *   · `chua_nghe_duoc_cuoc_goi`, `chua_xem_duoc_trang_thai_may`, `chua_thay_yeu_cau_da_xac_thuc`,
 *     `chua_lien_lac_duoc_nguoi_than` — dòng khai báo giới hạn của sản phẩm, có mặt ở nhiều
 *     lượt bình thường. Tính chúng thì mọi tin lành có nhắc "cuộc gọi" đều đánh thức con.
 *   · `ai_khong_chay` — chuyện của máy chủ (model hỏng, hết hạn mức), không phải thứ bác gửi.
 *     Vẫn hiện trên màn của bác; chỉ là không đáng một thông báo cho con mỗi lượt.
 *   · `chua_tai_xong_model_nghe`, `khong_goi_duoc_may_chu` — trạng thái máy, và mất mạng thì
 *     cũng không có đường nào để báo.
 */
export const MA_KHONG_DOC_DUOC: readonly string[] = [
  'khong_doc_duoc_anh',
  'khong_mo_duoc_link',
  'khong_nghe_duoc_ghi_am',
  'ghi_am_khong_co_tieng_noi',
  'chi_nghe_duoc_phan_dau',
  'ghi_am_khong_do_duoc_do_tin_cay',
  'noi_dung_qua_dai',
  'noi_dung_qua_ngan',
  'chi_doc_duoc_mot_phan_tin',
  'thong_bao_khong_co_noi_dung',
  'thong_bao_da_bi_xoa',
  'ai_khong_phan_hoi',
];

export interface VaoBaoCon {
  nhan?: string | null;
  /** Mã lý do bộ luật đã trả. RỖNG nghĩa là nhãn không đến từ dấu hiệu nào (xem `chonLoaiBaoCon`). */
  maLyDo?: readonly string[] | null;
  chuaKiem?: readonly string[] | null;
  /** Máy tự bật khi đang gọi (OTP / cài app / tiền ra). Không phải nhãn rủi ro. */
  lyDoTuBat?: 'otp_trong_cuoc_goi' | 'cai_app_trong_cuoc_goi' | 'tien_ra_trong_cuoc_goi' | null;
}

export interface QuyetDinhBaoCon {
  loaiSuKien: LoaiBaoCon;
  /** Chỉ có với hai loại kết quả có nhãn. */
  nhan?: 'CAO' | 'NGHI_NGO';
}

/**
 * Thứ tự ưu tiên: CAO > NGHI_NGO có dấu hiệu > sự kiện máy tự bật > chưa kiểm được > không báo.
 *
 * ⚠️ NGHI_NGO KHÔNG PHẢI LÚC NÀO CŨNG LÀ "CÓ DẤU HIỆU". Sàn §4.3 của bộ luật NÂNG nhãn lên
 * NGHI_NGO khi một thứ không đọc được (ảnh hỏng, nội dung quá dài, ghi âm hụt) để màn hình
 * không nói "Chưa thấy dấu hiệu rủi ro" về thứ chưa ai xem. Ca đó là "chưa kiểm được", không
 * phải "đáng ngờ": đo trên bộ luật thật, `maLyDo` RỖNG và `chuaKiem` có mã không-đọc-được.
 * Báo con "cảnh báo gấp, đáng ngờ" cho ca này là nói sai và dạy con nhờn thông báo. Nghi ngờ
 * THẬT luôn có ít nhất một mã lý do.
 */
export function chonLoaiBaoCon(vao: VaoBaoCon): QuyetDinhBaoCon | null {
  const khongDocDuoc = (vao.chuaKiem ?? []).some((m) => MA_KHONG_DOC_DUOC.includes(m));
  if (vao.nhan === 'CAO') return { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' };
  if (vao.nhan === 'NGHI_NGO') {
    const nhanChiDoSan = (vao.maLyDo ?? []).length === 0 && khongDocDuoc;
    return nhanChiDoSan ? { loaiSuKien: 'chua_kiem_duoc' } : { loaiSuKien: 'ket_qua_nghi_ngo', nhan: 'NGHI_NGO' };
  }
  if (vao.lyDoTuBat) return { loaiSuKien: vao.lyDoTuBat };
  // Kết quả CHƯA THẤY mà có thứ không đọc được: "chưa thấy" ở đây là "chưa xem hết".
  if (vao.nhan === 'CHUA_THAY' && khongDocDuoc) return { loaiSuKien: 'chua_kiem_duoc' };
  return null;
}
