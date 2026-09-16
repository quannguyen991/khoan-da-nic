/**
 * VÒNG TRÒN GIA ĐÌNH — nền dữ liệu cho `TRUSTED_CIRCLE` và `FAMILY_RULE` (§4.1).
 *
 * ⚠️ MODULE NÀY TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỔI MỨC RỦI RO.
 *
 * Nó là tầng hiển thị. Bộ luật ở `backend/src/analysis/decision-engine.js` là
 * nơi DUY NHẤT quyết định mức (§4.2), và nó không biết tệp này tồn tại. Có test
 * chặn việc backend import module này: `test/quy-tac-khong-doi-muc.test.js`.
 *
 * Lý do ràng buộc đó gắt đến vậy: quy tắc ở đây do NGƯỜI DÙNG tự viết. Mở một
 * đường cho nội dung người dùng chạm vào điểm rủi ro là mở đúng cái cửa mà §12
 * đã đóng lại sau bài học `"ch play"` — một cụm từ hạ mức vô điều kiện là một
 * câu thần chú tặng cho kẻ lừa đảo.
 *
 * ⚠️ KHÔNG CHỮ HIỂN THỊ TRONG TỆP NÀY. Mẫu quy tắc chỉ mang MÃ; câu tiếng Việt
 * và tiếng Anh nằm ở catalog i18n (§HĐ luật 2), nên đổi ngôn ngữ không đổi dữ
 * liệu. Có test chặn chữ tiếng Việt lọt vào đây.
 *
 * ⚠️ KHÔNG DỮ LIỆU MẪU. Danh sách rỗng là một lời khai trung thực: bác chưa
 * thêm ai cả. Bài học ở `App.tsx` — hai người bịa kèm số điện thoại thật của
 * người lạ, nằm sau nút "Gọi con cái" — không được lặp lại ở đây.
 */

export const PHIEN_BAN = 1;

const KHOA = 'khoan_da_vong_tron';

/**
 * Khoá cũ, do `App.tsx` ghi thẳng. Đọc để di trú, và KHÔNG XOÁ.
 *
 * Giữ lại vì người dùng có thể quay về bản đang cài trước đó: xoá khoá cũ nghĩa
 * là họ mở app lên và danh sách người thân trống trơn, đúng thứ hỏng đắt nhất
 * mà di trú sinh ra.
 */
const KHOA_CU = 'familyMembers';

/** Ba quy tắc là đủ. Một danh sách mười điều là một danh sách không ai nhớ. */
export const TOI_DA_QUY_TAC = 3;

/** Dài hơn thì không ai đọc hết trong lúc bị thúc ép. */
export const TOI_DA_KY_TU_CAU = 120;

export type MaQuyTac =
  | 'KHONG_CHUYEN_KHI_DANG_NGHE_MAY'
  | 'KHONG_DOC_MA_OTP'
  | 'GOI_LAI_TRUOC_KHI_CHUYEN'
  | 'KHONG_CAI_UNG_DUNG_LA'
  | 'TUY_CHINH';

export interface NguoiThan {
  id: string;
  ten: string;
  quanHe: string;
  dienThoai: string;
}

export interface QuyTacGiaDinh {
  id: string;
  ma: MaQuyTac;
  /** Câu do gia đình tự viết, hoặc bản đã sửa của một mẫu. */
  cau: string;
  /** Tên người thân đã cùng đặt. `null` thì khối quy tắc không hiện dòng đó. */
  nguoiCungDat: string | null;
  ngayDat: number;
  /** Tiền tố mã tín hiệu khiến quy tắc này được ưu tiên. Rỗng = hợp mọi cảnh báo. */
  hopVoi: string[];
}

export interface VongTron {
  phienBan: number;
  nguoiThan: NguoiThan[];
  quyTac: QuyTacGiaDinh[];
  capNhat: number;
}

/**
 * Mẫu quy tắc — CHỈ MÃ. Chữ nằm ở catalog.
 *
 * `hopVoi` nối quy tắc với họ tín hiệu, để lúc cảnh báo còn chọn được câu đúng
 * chuyện đang xảy ra: đang bị đòi mã thì nhắc quy tắc về mã, chứ không nhắc quy
 * tắc về cài ứng dụng.
 */
export const MAU_QUY_TAC: ReadonlyArray<{ ma: MaQuyTac; hopVoi: string[] }> = Object.freeze([
  { ma: 'KHONG_CHUYEN_KHI_DANG_NGHE_MAY', hopVoi: ['FIN_'] },
  { ma: 'KHONG_DOC_MA_OTP', hopVoi: ['CRED_'] },
  { ma: 'GOI_LAI_TRUOC_KHI_CHUYEN', hopVoi: ['FIN_TRANSFER_REQUEST'] },
  { ma: 'KHONG_CAI_UNG_DUNG_LA', hopVoi: ['DEV_'] },
]);

const hopVoiCuaMa = (ma: MaQuyTac): string[] =>
  MAU_QUY_TAC.find((m) => m.ma === ma)?.hopVoi ?? [];

/**
 * Lấy kho lưu mà KHÔNG ném.
 *
 * `localStorage` có thể không tồn tại (dựng sẵn phía máy chủ, WebView tắt lưu
 * trữ) hoặc ném khi trình duyệt chặn cookie bên thứ ba. Ném trong lúc dựng state
 * nghĩa là màn trắng — mất cả ứng dụng chứ không chỉ mất danh sách.
 */
function kho(): Storage | null {
  try {
    const g = globalThis as unknown as { localStorage?: Storage };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

function docJson(khoa: string): unknown {
  const k = kho();
  if (!k) return null;
  try {
    const s = k.getItem(khoa);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

let demId = 0;
function sinhId(): string {
  demId += 1;
  try {
    const c = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c?.randomUUID) return c.randomUUID();
  } catch { /* rơi xuống mốc thời gian */ }
  return `id-${Date.now()}-${demId}`;
}

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '');

function vongTronRong(): VongTron {
  return { phienBan: PHIEN_BAN, nguoiThan: [], quyTac: [], capNhat: 0 };
}

function chuanHoaNguoiThan(v: unknown): NguoiThan | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  // Chấp cả hình dạng cũ (`name`/`relation`/`phone`) lẫn mới.
  const ten = chuoi(o.ten) || chuoi(o.name);
  const quanHe = chuoi(o.quanHe) || chuoi(o.relation);
  const dienThoai = chuoi(o.dienThoai) || chuoi(o.phone);
  if (!ten && !dienThoai) return null;
  return { id: chuoi(o.id) || sinhId(), ten, quanHe, dienThoai };
}

function chuanHoaQuyTac(v: unknown): QuyTacGiaDinh | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const cau = chuoi(o.cau).slice(0, TOI_DA_KY_TU_CAU);
  if (!cau) return null;
  const ma = (chuoi(o.ma) || 'TUY_CHINH') as MaQuyTac;
  return {
    id: chuoi(o.id) || sinhId(),
    ma,
    cau,
    nguoiCungDat: chuoi(o.nguoiCungDat) || null,
    ngayDat: typeof o.ngayDat === 'number' ? o.ngayDat : 0,
    hopVoi: Array.isArray(o.hopVoi) ? (o.hopVoi as unknown[]).map(chuoi).filter(Boolean) : hopVoiCuaMa(ma),
  };
}

/**
 * Đọc vòng tròn. KHÔNG BAO GIỜ ném, kể cả khi dữ liệu hỏng hoàn toàn.
 *
 * Chưa có dữ liệu mới thì di trú từ khoá cũ. Không có gì cả thì trả vòng tròn
 * rỗng — một trạng thái bình thường, không phải lỗi.
 */
export function docVongTron(): VongTron {
  const thoNew = docJson(KHOA);
  if (thoNew && typeof thoNew === 'object') {
    const o = thoNew as Record<string, unknown>;
    const nguoiThan = Array.isArray(o.nguoiThan)
      ? (o.nguoiThan as unknown[]).map(chuanHoaNguoiThan).filter((x): x is NguoiThan => !!x)
      : [];
    const quyTac = Array.isArray(o.quyTac)
      ? (o.quyTac as unknown[]).map(chuanHoaQuyTac).filter((x): x is QuyTacGiaDinh => !!x)
      : [];
    return {
      phienBan: PHIEN_BAN,
      nguoiThan,
      quyTac: quyTac.slice(0, TOI_DA_QUY_TAC),
      capNhat: typeof o.capNhat === 'number' ? o.capNhat : 0,
    };
  }

  const thoCu = docJson(KHOA_CU);
  if (Array.isArray(thoCu)) {
    return {
      phienBan: PHIEN_BAN,
      nguoiThan: (thoCu as unknown[]).map(chuanHoaNguoiThan).filter((x): x is NguoiThan => !!x),
      quyTac: [],
      capNhat: 0,
    };
  }

  return vongTronRong();
}

/** Ghi. Không ném khi kho đầy hoặc bị chặn — mất bản lưu vẫn hơn mất ứng dụng. */
export function ghiVongTron(vt: VongTron): void {
  const k = kho();
  if (!k) return;
  try {
    k.setItem(KHOA, JSON.stringify({ ...vt, phienBan: PHIEN_BAN, capNhat: Date.now() }));
  } catch { /* kho đầy hoặc bị chặn */ }
}

export interface KetQuaThem {
  ok: boolean;
  vongTron: VongTron;
  /** Mã lý do khi `ok === false`. Chữ hiển thị nằm ở catalog. */
  lyDo?: 'QUA_NHIEU' | 'CAU_RONG';
}

/** Thêm một quy tắc. Trả về vòng tròn MỚI, không sửa tại chỗ. */
export function themQuyTac(
  vt: VongTron,
  moi: { ma: MaQuyTac; cau: string; nguoiCungDat: string | null },
): KetQuaThem {
  const cau = chuoi(moi.cau).trim().slice(0, TOI_DA_KY_TU_CAU);
  if (!cau) return { ok: false, vongTron: vt, lyDo: 'CAU_RONG' };
  if (vt.quyTac.length >= TOI_DA_QUY_TAC) return { ok: false, vongTron: vt, lyDo: 'QUA_NHIEU' };

  const quyTac: QuyTacGiaDinh = {
    id: sinhId(),
    ma: moi.ma,
    cau,
    nguoiCungDat: moi.nguoiCungDat || null,
    ngayDat: Date.now(),
    hopVoi: hopVoiCuaMa(moi.ma),
  };
  return { ok: true, vongTron: { ...vt, quyTac: [...vt.quyTac, quyTac] } };
}

/** Xoá một quy tắc theo id. Trả về vòng tròn MỚI. */
export function xoaQuyTac(vt: VongTron, id: string): VongTron {
  return { ...vt, quyTac: vt.quyTac.filter((q) => q.id !== id) };
}

/**
 * Chọn quy tắc để hiện trên màn cảnh báo.
 *
 * ⚠️ HÀM THUẦN, CHỈ ĐỌC. Nó nhận `maLyDo` mà bộ luật đã quyết, và không hề
 * chạm vào mức rủi ro. Đổi thứ tự ưu tiên ở đây chỉ đổi CÂU ĐƯỢC NHẮC, không
 * bao giờ đổi việc có cảnh báo hay không.
 *
 * Trả `null` là đường đi bình thường: phần lớn người dùng chưa đặt quy tắc nào
 * trong lần dùng đầu.
 */
export function chonQuyTac(
  quyTac?: QuyTacGiaDinh[] | null,
  maLyDo?: string[] | null,
): QuyTacGiaDinh | null {
  if (!Array.isArray(quyTac) || quyTac.length === 0) return null;
  const ma = Array.isArray(maLyDo) ? maLyDo : [];

  const khop = quyTac.filter(
    (q) => Array.isArray(q.hopVoi) && q.hopVoi.some((tienTo) => ma.some((m) => m.startsWith(tienTo))),
  );
  if (khop.length > 0) {
    return khop.reduce((a, b) => (b.ngayDat > a.ngayDat ? b : a));
  }
  // Không khớp thì vẫn nhắc: một câu của gia đình vẫn hơn không có câu nào.
  return quyTac[0] ?? null;
}

/**
 * Có được hiện khối quy tắc ở mức này không.
 *
 * ⚠️ MỨC THẤP NHẤT: KHÔNG. Nhắc một quy tắc an toàn ngay dưới dòng "chưa thấy
 * dấu hiệu rủi ro" làm người đọc hiểu là hệ thống đang cảnh báo — tức là sản
 * phẩm tự tạo ra một cảnh báo mà bộ luật không hề đưa ra.
 */
export function duocHienQuyTac(nhan?: string | null): boolean {
  return nhan === 'CAO' || nhan === 'NGHI_NGO';
}
