/**
 * ═════ NHẮN SMS CHO CON KHI THÔNG BÁO ĐẨY KHÔNG TỚI ĐƯỢC — thêm 3/10/2026 (phương án B) ═════
 *
 * Máy bố mẹ (CHỈ bản Android) tự nhắn một tin SMS tới số người thân bác ĐÃ LƯU, khi:
 *   · máy chủ không với tới được (mất mạng dữ liệu, máy chủ ngủ), hoặc
 *   · máy chủ nhận nhưng KHÔNG máy con nào được đẩy tới (con chưa bật nhận, đăng ký hết hạn,
 *     chưa nối với ai, hoặc không xác nhận được).
 * Đã có máy con nhận được thông báo đẩy thì KHÔNG nhắn thêm (tốn tiền, dội con).
 *
 * Hàm ở đây thuần (chỉ có lời gọi ra ngoài qua tham số), để test được từng nhánh.
 *
 * ⚠️ §12 — HAI CÔNG TẮC, CẢ HAI DO BÁC BẬT, MẶC ĐỊNH TẮT:
 *    ① công tắc của MỨC (cao / đáng ngờ / chưa kiểm được / trong cuộc gọi) — quyết định có báo con không;
 *    ② `baoQuaSms` — quyết định có được dùng SMS làm đường dự phòng không.
 *    SMS chỉ gửi khi CẢ HAI cùng bật.
 * ⚠️ §6.9 — tin chỉ có TÊN của bác và MỨC. Không có nội dung tin bác nhận, không số tài khoản.
 * ⚠️ §11 — "Máy đã gửi" ≠ "con đã đọc". Câu trạng thái nói đúng điều máy biết.
 * ⚠️ Tốn tiền tin nhắn của bố mẹ ⇒ trần số tin mỗi giờ và gộp tin cùng loại.
 */
import { SMS_BAO_CON, TRANG_THAI_SMS, tra, type Lang } from '../catalog';
import type { PhanHoiBaoDong } from '../tai-khoan';
import type { KetQuaGuiSms } from '../native';
import type { BanSaoQuyTac } from './quy-tac-bao-dem';
import type { LoaiBaoCon } from './loai-bao-con';

/** Loại nào do công tắc nào quyết định — PHẢI khớp `QUY_TAC_THEO_LOAI` ở máy chủ (có test đối chiếu). */
export const QUY_TAC_THEO_LOAI: Record<LoaiBaoCon, keyof BanSaoQuyTac> = {
  ket_qua_kiem: 'baoKhiCao',
  ket_qua_nghi_ngo: 'baoKhiNghiNgo',
  chua_kiem_duoc: 'baoKhiChuaKiem',
  otp_trong_cuoc_goi: 'baoKhiOtpTrongCuocGoi',
  cai_app_trong_cuoc_goi: 'baoKhiOtpTrongCuocGoi',
  tien_ra_trong_cuoc_goi: 'baoKhiOtpTrongCuocGoi',
};

/** Trần: tối đa bấy nhiêu tin trong một giờ, và không nhắn lại cùng loại trong bấy nhiêu mili giây. */
export const TOI_DA_SMS_MOI_GIO = 5;
export const GOP_CUNG_LOAI_MS = 2 * 60 * 1000;
const MOT_GIO_MS = 60 * 60 * 1000;
export const TOI_DA_NGUOI_NHAN = 2;

export interface LienHe { ten?: string; dienThoai?: string; phone?: string }
export interface DongNhatKy { loai: string; luc: number }

export type KetQuaNhanSms =
  | { trangThai: 'khong_can' }
  | { trangThai: 'khong_co_so' }
  | { trangThai: 'dung_tran'; lyDo: 'gop' | 'gio' }
  | { trangThai: 'khong_phai_apk' }
  | { trangThai: KetQuaGuiSms | 'hon_hop'; ten: string[] };

/** Chỉ giữ chữ số và dấu `+` đầu; 8–16 ký tự mới là số thật. */
export function sachSo(so: unknown): string {
  const s = String(so ?? '').replace(/[^\d+]/g, '');
  const chuan = s.replace(/(?!^)\+/g, '');
  const soChu = chuan.replace(/\+/g, '');
  return soChu.length >= 8 && soChu.length <= 15 ? chuan : '';
}

/** Tối đa hai người đầu có số hợp lệ, không trùng số — cùng thứ tự với nút "Gọi ngay". */
export function chonNguoiNhan(ds: readonly LienHe[], toiDa = TOI_DA_NGUOI_NHAN): { ten: string; so: string }[] {
  const thay = new Set<string>();
  const ra: { ten: string; so: string }[] = [];
  for (const l of ds) {
    const so = sachSo(l?.dienThoai ?? l?.phone);
    if (!so || thay.has(so)) continue;
    thay.add(so);
    ra.push({ ten: String(l?.ten ?? '').trim(), so });
    if (ra.length >= toiDa) break;
  }
  return ra;
}

export function soanSms(loai: LoaiBaoCon, tenBoMe: string, lang: Lang): string {
  const ten = tenBoMe.trim() || (lang === 'en' ? 'Your parent' : 'Bố/mẹ');
  return (tra(SMS_BAO_CON, loai, lang) ?? '').split('{ten}').join(ten);
}

/**
 * Có NÊN nhắn SMS dự phòng không?
 * `phanHoi === null` nghĩa là KHÔNG tới được máy chủ (mất mạng, hết hạn chờ, 5xx).
 */
export function canGuiSms(vao: {
  loaiSuKien: LoaiBaoCon;
  quyTac: BanSaoQuyTac | null;
  phanHoi: PhanHoiBaoDong | null;
}): boolean {
  const q = vao.quyTac;
  if (!q || q.baoQuaSms !== true) return false;                       // ② chưa cho phép đường SMS
  if (q[QUY_TAC_THEO_LOAI[vao.loaiSuKien]] !== true) return false;    // ① mức này bác chưa bật báo
  if (vao.phanHoi === null) return true;                              // không tới được máy chủ
  if (vao.phanHoi.gui !== true) return false;                         // máy chủ quyết không báo (tắt / gộp)
  const ketQua = vao.phanHoi.ketQua ?? [];
  return !ketQua.some((k) => k.trangThai === 'DA_DAY_DI');           // có máy con được đẩy tới thì thôi
}

/** Trần số tin và gộp cùng loại. `nhatKy` là các lần ĐÃ nhắn, theo thời gian. */
export function dungTran(nhatKy: readonly DongNhatKy[], loai: string, bayGio: number): 'gop' | 'gio' | null {
  if (nhatKy.some((d) => d.loai === loai && bayGio - d.luc < GOP_CUNG_LOAI_MS && bayGio >= d.luc)) return 'gop';
  if (nhatKy.filter((d) => bayGio - d.luc < MOT_GIO_MS && bayGio >= d.luc).length >= TOI_DA_SMS_MOI_GIO) return 'gio';
  return null;
}

const KHOA_NHAT_KY = 'khoan_da_nhat_ky_sms_bao_con';

export function docNhatKySms(): DongNhatKy[] {
  try {
    const tho = JSON.parse(localStorage.getItem(KHOA_NHAT_KY) || '[]');
    return (Array.isArray(tho) ? tho : [])
      .filter((d): d is DongNhatKy => !!d && typeof d.loai === 'string' && typeof d.luc === 'number');
  } catch { return []; }
}

/** Chỉ lưu LOẠI và GIỜ — không số, không tên, không nội dung. Giữ 20 dòng mới nhất. */
export function ghiNhatKySms(dong: DongNhatKy): void {
  try {
    localStorage.setItem(KHOA_NHAT_KY, JSON.stringify([...docNhatKySms(), dong].slice(-20)));
  } catch { /* kho bị chặn: mất nhật ký thì trần không chặn được — chấp nhận, vẫn gộp trong phiên */ }
}

/**
 * Điều phối: quyết định → chọn người nhận → soạn → gửi → trả LỜI THẬT.
 * Mọi thứ bên ngoài (gửi SMS, nhật ký, giờ) truyền vào để test.
 */
export async function nhanSmsDuPhong(vao: {
  loaiSuKien: LoaiBaoCon;
  tenBoMe: string;
  lang: Lang;
  lienHe: readonly LienHe[];
  quyTac: BanSaoQuyTac | null;
  phanHoi: PhanHoiBaoDong | null;
  guiSms: (so: string, noiDung: string) => Promise<KetQuaGuiSms>;
  nhatKy?: readonly DongNhatKy[];
  ghiNhatKy?: (d: DongNhatKy) => void;
  bayGio?: number;
}): Promise<KetQuaNhanSms> {
  if (!canGuiSms({ loaiSuKien: vao.loaiSuKien, quyTac: vao.quyTac, phanHoi: vao.phanHoi })) return { trangThai: 'khong_can' };

  const nguoi = chonNguoiNhan(vao.lienHe);
  if (nguoi.length === 0) return { trangThai: 'khong_co_so' };

  const bayGio = vao.bayGio ?? Date.now();
  const tran = dungTran(vao.nhatKy ?? docNhatKySms(), vao.loaiSuKien, bayGio);
  if (tran) return { trangThai: 'dung_tran', lyDo: tran };

  const noiDung = soanSms(vao.loaiSuKien, vao.tenBoMe, vao.lang);
  const ketQua: { ten: string; kq: KetQuaGuiSms }[] = [];
  for (const n of nguoi) {
    let kq: KetQuaGuiSms;
    try { kq = await vao.guiSms(n.so, noiDung); } catch { kq = 'loi_gui'; }
    if (kq === 'khong_phai_apk') return { trangThai: 'khong_phai_apk' };
    ketQua.push({ ten: n.ten, kq });
  }
  // Ghi nhật ký khi ĐÃ THỬ gửi (kể cả lỗi): lỗi lặp lại không được thành vòng lặp tốn tiền.
  (vao.ghiNhatKy ?? ghiNhatKySms)({ loai: vao.loaiSuKien, luc: bayGio });

  const khac = new Set(ketQua.map((k) => k.kq));
  const ten = ketQua.map((k) => k.ten).filter(Boolean);
  return { trangThai: khac.size === 1 ? ketQua[0]!.kq : 'hon_hop', ten };
}

/**
 * Câu hiện trên màn bố mẹ — nói đúng điều máy BIẾT. `null` = không hiện gì (không cần / không phải APK).
 * ⚠️ "Máy đã gửi" ≠ "con đã đọc" (§11).
 */
export function cauTrangThaiSms(kq: KetQuaNhanSms, lang: Lang): string | null {
  const t = (khoa: string, ten: string[] = []) =>
    (tra(TRANG_THAI_SMS, khoa, lang) ?? '').split('{ten}').join(ten.join(' · ') || (lang === 'en' ? 'your family' : 'con cháu'));
  switch (kq.trangThai) {
    case 'khong_can': case 'khong_phai_apk': case 'dung_tran': return null;
    case 'khong_co_so': return t('KHONG_CO_SO');
    case 'da_gui': return t('DA_GUI', kq.ten);
    case 'khong_co_quyen': return t('KHONG_CO_QUYEN');
    case 'khong_xac_nhan': return t('KHONG_XAC_NHAN', kq.ten);
    case 'hon_hop': case 'loi_gui': return t('LOI_GUI', kq.ten);
    default: return null;
  }
}
