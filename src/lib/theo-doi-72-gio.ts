/**
 * BẢO VỆ 72 GIỜ — theo dõi sau khi bác lỡ chuyển tiền hoặc đọc mã.
 *
 * Màn "Bảo vệ 72 giờ" nói các bước cần làm, nhưng tới giờ nó biến mất khi bác rời
 * màn. Mà ba ngày sau sự cố mới là lúc kẻ gian quay lại lần hai — "nộp phí để lấy
 * lại tiền", "tài khoản vẫn đang bị điều tra". Tệp này giữ mốc bắt đầu để trang
 * chủ còn nhắc, và để bản Android hẹn được lời nhắc ở các mốc giờ.
 *
 * ⚠️ HÀM THUẦN THEO THỜI GIAN: mọi hàm nhận `bayGio` qua tham số, không tự đọc
 * đồng hồ — để test được và để hai nơi gọi cùng lúc ra cùng một kết quả.
 *
 * ⚠️ MỞ LẠI MÀN PHỤC HỒI KHÔNG ĐƯỢC ĐẶT LẠI ĐỒNG HỒ. Đang theo dõi thì giữ mốc cũ;
 * đặt lại mỗi lần mở là kéo dài vô hạn và các lời nhắc không bao giờ tới đúng mốc.
 *
 * ⚠️ §11 — KHÔNG HỨA LẤY LẠI ĐƯỢC TIỀN. Tệp này không có chữ hiển thị; câu nhắc
 * nằm ở catalog, viết theo khung "làm tăng khả năng xử lý".
 */

export const THOI_HAN_GIO = 72;
const MOT_GIO = 3_600_000;

/**
 * Mốc nhắc, tính bằng giờ sau khi bắt đầu. 2 giờ: đã gọi ngân hàng khoá tài khoản
 * chưa. 24 và 48: kẻ gian hay quay lại. 72: hết đợt theo dõi.
 */
export const MOC_NHAC_GIO: ReadonlyArray<number> = Object.freeze([2, 24, 48, 72]);

const KHOA = 'khoan_da_theo_doi_72h';

export interface TrangThaiTheoDoi {
  batDau: number;
  daQuaGio: number;
  conLaiGio: number;
}

function kho(): Storage | null {
  try {
    const g = globalThis as unknown as { localStorage?: Storage };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

function docBatDau(): number | null {
  const k = kho();
  if (!k) return null;
  try {
    const o = JSON.parse(k.getItem(KHOA) ?? 'null') as { batDau?: unknown } | null;
    return o && typeof o.batDau === 'number' && Number.isFinite(o.batDau) ? o.batDau : null;
  } catch {
    return null;
  }
}

const conHieuLuc = (batDau: number, bayGio: number) =>
  bayGio >= batDau && bayGio - batDau < THOI_HAN_GIO * MOT_GIO;

/** Bắt đầu theo dõi. Đang theo dõi thì GIỮ mốc cũ. Trả về mốc bắt đầu đang dùng. */
export function batDauTheoDoi(bayGio: number): number {
  const cu = docBatDau();
  if (cu !== null && conHieuLuc(cu, bayGio)) return cu;
  const k = kho();
  try { k?.setItem(KHOA, JSON.stringify({ batDau: bayGio })); } catch { /* kho đầy hoặc bị chặn */ }
  return bayGio;
}

/** Trạng thái hiện tại, hoặc `null` khi chưa theo dõi hay đã quá 72 giờ. KHÔNG ném. */
export function docTheoDoi(bayGio: number): TrangThaiTheoDoi | null {
  const batDau = docBatDau();
  if (batDau === null) return null;
  if (!conHieuLuc(batDau, bayGio)) {
    ketThucTheoDoi();
    return null;
  }
  const da = bayGio - batDau;
  return {
    batDau,
    daQuaGio: Math.floor(da / MOT_GIO),
    conLaiGio: Math.max(1, Math.ceil((THOI_HAN_GIO * MOT_GIO - da) / MOT_GIO)),
  };
}

export function ketThucTheoDoi(): void {
  try { kho()?.removeItem(KHOA); } catch { /* không có gì để xoá */ }
}

/** Các mốc nhắc còn ở TƯƠNG LAI, dạng mốc thời gian (ms). Mốc đã qua thì bỏ. */
export function cacMocConLai(batDau: number, bayGio: number): number[] {
  return MOC_NHAC_GIO.map((g) => batDau + g * MOT_GIO).filter((t) => t > bayGio);
}
