/**
 * ═════ KẾT QUẢ CAN THIỆP — sau màn cảnh báo, bác đã LÀM gì? ═════
 *
 * Thêm 22/9/2026. Hai lý do, một là nghĩa vụ, một là thước đo:
 *
 * ① §4.6 BẮT BUỘC: "Mỗi lần bấm nút 'Tôi ổn, không có gì nguy hiểm' là một mẫu
 *    dữ liệu báo động giả — ghi lại để hiệu chỉnh ngưỡng." Trước hôm nay nút đó
 *    chỉ `setView('home')`, KHÔNG ghi gì. Nghĩa là mọi lần bộ luật báo oan đều
 *    biến mất không dấu vết, và ngưỡng 20/45 không bao giờ có dữ liệu để xem lại.
 *
 * ② Can thiệp có đổi được hành động không. `do-thoi-gian-toi-nguoi-that.ts` đo
 *    MỘT hành động (bấm gọi người thân, sau bao lâu). Module này ghi hành động
 *    NÀO được chọn — gọi người thân, lỡ chuyển rồi, bảo mình ổn, hay rời màn.
 *    Đó là câu trả lời cho "Khoan Đã có đổi được đường đi tiếp theo không",
 *    thứ mà một con số recall không trả lời được.
 *
 * ⚠️ CHỈ Ở LẠI TRONG MÁY. Không `fetch`, không beacon, không đồng bộ — cùng
 * nguyên tắc với module đo thời gian: đây là dữ liệu về lúc một người đang
 * hoảng. Có test chặn mọi đường ra mạng trong tệp này.
 *
 * ⚠️ KHÔNG LƯU NỘI DUNG. Chỉ MÃ: mức can thiệp, nhãn, mã lý do (§HĐ luật 2),
 * và mã hành động. Không một chữ nào của tin nhắn.
 *
 * ⚠️ TÊN NÓI ĐÚNG THỨ BIẾT ĐƯỢC. `bam_goi_nguoi_than` là "đã bấm nút gọi", KHÔNG
 * phải "đã gọi được" — máy không biết có ai nhấc máy (§11).
 */

const KHOA = 'khoan_da_ket_qua_can_thiep';
/** Đủ để thấy xu hướng báo oan, không phình vô hạn. */
export const TOI_DA_BAN_GHI = 100;

export type HanhDong =
  | 'bam_goi_nguoi_than'   // bấm nút gọi — KHÔNG biết có nối máy không
  | 'da_lo_chuyen'         // bác tự báo đã chuyển tiền / đọc mã
  | 'toi_on'               // §4.6 — mẫu báo động giả
  | 've_trang_chu'         // rời màn không chọn hành động bảo vệ nào
  | 'con_bao_lua_dao'      // gọi xong, bác bấm "Con bảo là lừa đảo"
  | 'con_bao_khong_sao';   // gọi xong, bác bấm "Con bảo không sao" — mẫu hiệu chỉnh, KHÔNG hạ nhãn

export interface BanGhiKetQua {
  luc: number;
  canThiep: string | null;
  nhan: string | null;
  /** Mã, không phải câu. Cắt 12 mã cho gọn. */
  maLyDo: string[];
  hanhDong: HanhDong;
}

const MA_HOP_LE = /^[A-Z][A-Z0-9_]{1,60}$/;
const MUC_HOP_LE = /^[A-Z][A-Z0-9_]{1,40}$/;

function doc(): BanGhiKetQua[] {
  try {
    const tho = localStorage.getItem(KHOA);
    const mang = tho ? JSON.parse(tho) : [];
    return Array.isArray(mang) ? mang : [];
  } catch {
    return [];   // kho hỏng hay bị chặn: bắt đầu lại, KHÔNG ném (màn cảnh báo không được sập vì chuyện đo)
  }
}

/**
 * Ghi một lượt. Không bao giờ ném — một phép đo hỏng không được làm hỏng nút
 * mà người đang hoảng vừa bấm.
 */
export function ghiKetQua(vao: {
  canThiep?: string | null;
  nhan?: string | null;
  maLyDo?: string[] | null;
  hanhDong: HanhDong;
}, luc: number = Date.now()): BanGhiKetQua | null {
  try {
    const banGhi: BanGhiKetQua = {
      luc,
      canThiep: vao.canThiep && MUC_HOP_LE.test(vao.canThiep) ? vao.canThiep : null,
      nhan: vao.nhan && MUC_HOP_LE.test(vao.nhan) ? vao.nhan : null,
      // Chỉ nhận thứ trông như MÃ. Một chuỗi có dấu cách hay dấu tiếng Việt là
      // nội dung lọt vào nhầm chỗ — bỏ, đừng lưu.
      maLyDo: (Array.isArray(vao.maLyDo) ? vao.maLyDo : []).filter((m) => typeof m === 'string' && MA_HOP_LE.test(m)).slice(0, 12),
      hanhDong: vao.hanhDong,
    };
    const moi = [banGhi, ...doc()].slice(0, TOI_DA_BAN_GHI);
    localStorage.setItem(KHOA, JSON.stringify(moi));
    return banGhi;
  } catch {
    return null;
  }
}

export function docKetQua(): BanGhiKetQua[] {
  return doc();
}

/**
 * Tóm tắt để HIỆU CHỈNH, không để khoe. `tyLeBaoOan` là tỷ lệ "Tôi ổn" trên các
 * lượt ở mức khẩn cấp — nó là số của BỘ LUẬT, không phải của người dùng.
 * Trả `null` khi chưa đủ mẫu: dưới 5 lượt thì một tỷ lệ chỉ là tiếng ồn, và
 * §11 cấm gọi một con số chưa đủ cơ sở là số đo.
 */
export function tomTatKetQua(banGhi: BanGhiKetQua[] = doc()) {
  const khanCap = banGhi.filter((b) => b.canThiep === 'PROTECTED_CRITICAL');
  const toiOn = khanCap.filter((b) => b.hanhDong === 'toi_on').length;
  return {
    tong: banGhi.length,
    soLuotKhanCap: khanCap.length,
    soLanToiOn: toiOn,
    tyLeBaoOan: khanCap.length >= 5 ? toiOn / khanCap.length : null,
    soLanBamGoi: banGhi.filter((b) => b.hanhDong === 'bam_goi_nguoi_than').length,
  };
}
