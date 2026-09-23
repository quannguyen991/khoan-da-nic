import { api } from './api-goc';

/**
 * TÀI KHOẢN — lớp gọi API thật của máy chủ.
 *
 * ══════════ ⚠️ ĐĂNG NHẬP DÙNG ĐỂ LÀM GÌ, VÀ KHÔNG DÙNG ĐỂ LÀM GÌ ══════════
 *
 * DÙNG cho danh tính: ai là ai trong vòng tròn gia đình, ai ký xác nhận "đúng
 * là con gửi tin này" trong Khoan Proof. Những việc đó cần hai bên biết nhau,
 * và không có cách nào làm chúng hoàn toàn trong máy.
 *
 * KHÔNG DÙNG để đồng bộ nội dung. Tin nhắn bác dán vào kiểm, ảnh bác chụp,
 * lịch sử kiểm — tất cả vẫn nằm trong máy như trước. §12 cấm thẳng việc bật
 * đồng bộ máy chủ mặc định, và đăng nhập KHÔNG phải là cái cớ để mở nó.
 *
 * ⚠️ VÀ TUYỆT ĐỐI KHÔNG CHẶN ĐƯỜNG KIỂM. `/api/analyze` không bao giờ đòi
 * token — rút mạng, chưa đăng nhập, hết hạn phiên thì bác vẫn phải kiểm được
 * tin nhắn. Đó là §5.3 và §6.9, và cũng là lẽ thường: một người đang bị thúc
 * chuyển tiền không có mười lăm giây để nhớ mật khẩu.
 *
 * ══════════ ⚠️ TOKEN NẰM Ở localStorage — BIẾT RÕ CÁI GIÁ ══════════
 *
 * Nó đọc được bằng JavaScript, nên một lỗ XSS là mất phiên. Cookie `httpOnly`
 * an toàn hơn về mặt đó, nhưng bản APK chạy ở origin `https://localhost` và
 * gọi sang một tên miền khác — cookie bên thứ ba bị WebView chặn, tức đường
 * đăng nhập sẽ chết im lặng trên đúng bản mà người dùng thật cài.
 *
 * Đánh đổi có ý thức: chấp nhận localStorage, và bù bằng CSP không cho chạy
 * script bên ngoài (`script-src 'self'` khi chạy thật), phiên có hạn, và đăng
 * xuất HUỶ token ở máy chủ chứ không chỉ xoá ở máy.
 */

const KHOA_TOKEN = 'khoan_da_phien';

export interface HoSo {
  id: string;
  ten: string;
  so: string;
  vai: string;
  taoLuc: number;
}

interface PhienLuu {
  token: string;
  hetHanLuc: number;
  hoSo: HoSo;
}

export class LoiTaiKhoan extends Error {
  ma: string;
  /** Số giây phải chờ, chỉ có ở mã `THU_LAI_SAU`. */
  giay?: number;
  constructor(ma: string, giay?: number) {
    super(ma);
    this.ma = ma;
    this.giay = giay;
  }
}

export function docPhien(): PhienLuu | null {
  try {
    const t = JSON.parse(localStorage.getItem(KHOA_TOKEN) || 'null');
    if (!t?.token || !t?.hoSo) return null;
    /*
     * ⚠️ KIỂM HẠN NGAY Ở MÁY. Không kiểm thì giao diện hiện tên bác như đang
     * đăng nhập, rồi mọi lượt gọi trả 401 mà không ai hiểu vì sao — bác thấy
     * app "tự nhiên hỏng" chứ không thấy "phiên đã hết hạn".
     */
    if (typeof t.hetHanLuc === 'number' && Date.now() > t.hetHanLuc) {
      localStorage.removeItem(KHOA_TOKEN);
      return null;
    }
    return t as PhienLuu;
  } catch {
    return null;
  }
}

function luuPhien(p: PhienLuu | null) {
  try {
    if (p) localStorage.setItem(KHOA_TOKEN, JSON.stringify(p));
    else localStorage.removeItem(KHOA_TOKEN);
  } catch {
    // Không lưu được (chế độ riêng tư, hết chỗ) — phiên chỉ sống tới khi đóng
    // app. Vẫn dùng được, chỉ là lần sau phải đăng nhập lại.
  }
}

async function goi(duong: string, tuyChon: RequestInit = {}, kemToken = false) {
  const dau: Record<string, string> = { 'Content-Type': 'application/json' };
  if (kemToken) {
    const p = docPhien();
    if (p) dau.Authorization = `Bearer ${p.token}`;
  }
  const r = await fetch(api(duong), { ...tuyChon, headers: { ...dau, ...(tuyChon.headers as any) } });
  const than = await r.json().catch(() => ({}));

  if (!r.ok) {
    /*
     * ⚠️ 401 ⇒ XOÁ PHIÊN Ở MÁY LUÔN. Máy chủ đã coi token này là không còn giá
     * trị (hết hạn, hoặc bác đăng xuất ở máy khác). Giữ lại chỉ để giao diện
     * tiếp tục vẽ ra một trạng thái đăng nhập không tồn tại (§4.3).
     */
    if (r.status === 401) luuPhien(null);
    throw new LoiTaiKhoan(than?.maLoi || `HTTP_${r.status}`, than?.giay);
  }
  return than;
}

export async function dangKy(soDienThoai: string, matKhau: string, ten: string): Promise<HoSo> {
  const t = await goi('/api/tai-khoan/dang-ky', {
    method: 'POST',
    body: JSON.stringify({ soDienThoai, matKhau, ten }),
  });
  luuPhien({ token: t.token, hetHanLuc: t.hetHanLuc, hoSo: t.hoSo });
  return t.hoSo;
}

export async function dangNhap(soDienThoai: string, matKhau: string): Promise<HoSo> {
  const t = await goi('/api/tai-khoan/dang-nhap', {
    method: 'POST',
    body: JSON.stringify({ soDienThoai, matKhau }),
  });
  luuPhien({ token: t.token, hetHanLuc: t.hetHanLuc, hoSo: t.hoSo });
  return t.hoSo;
}

/**
 * ⚠️ GỌI MÁY CHỦ HUỶ TOKEN, RỒI MỚI XOÁ Ở MÁY — và xoá kể cả khi gọi hỏng.
 *
 * Chỉ xoá ở máy thì token vẫn còn giá trị trên máy chủ tới khi hết hạn. Bác
 * đăng xuất ở máy con cháu mượn, tưởng đã ra, mà phiên vẫn sống.
 *
 * Ngược lại, mạng hỏng không được biến thành "không đăng xuất được" — bác bấm
 * đăng xuất là phải ra khỏi máy này, còn phần huỷ ở máy chủ thì token cũng sẽ
 * hết hạn theo thời gian.
 */
export async function dangXuat(): Promise<void> {
  try {
    await goi('/api/tai-khoan/dang-xuat', { method: 'POST' }, true);
  } catch {
    // Máy chủ không nghe được. Vẫn xoá ở máy.
  }
  luuPhien(null);
}

/**
 * Hỏi máy chủ xem phiên còn giá trị không, và lấy hồ sơ mới nhất.
 *
 * ⚠️ `null` = KHÔNG CÒN ĐĂNG NHẬP, và đó là một kết quả bình thường. Đừng để
 * nó ném ra ngoài: màn hình gọi hàm này lúc mở app, mà một ngoại lệ ở đó sẽ
 * chặn cả app chỉ vì phiên hết hạn.
 */
export async function layHoSo(): Promise<HoSo | null> {
  if (!docPhien()) return null;
  // Phần 2 (23/9/2026): phiên còn dưới 7 ngày thì đổi token mới — xem `giaHanNeuSapHet`.
  await giaHanNeuSapHet();
  try {
    const t = await goi('/api/tai-khoan/toi', {}, true);
    const p = docPhien();
    if (p && t?.hoSo) luuPhien({ ...p, hoSo: t.hoSo });
    return t?.hoSo ?? null;
  } catch {
    return null;
  }
}

export async function suaHoSo(thayDoi: { ten?: string }): Promise<HoSo> {
  const t = await goi('/api/tai-khoan/toi', {
    method: 'PATCH',
    body: JSON.stringify(thayDoi),
  }, true);
  const p = docPhien();
  if (p && t?.hoSo) luuPhien({ ...p, hoSo: t.hoSo });
  return t.hoSo;
}

export async function doiMatKhau(matKhauCu: string, matKhauMoi: string): Promise<void> {
  await goi('/api/tai-khoan/doi-mat-khau', {
    method: 'POST',
    body: JSON.stringify({ matKhauCu, matKhauMoi }),
  }, true);
}

/*
 * ══════════ GHÉP BỐ MẸ ↔ CON CHÁU — thêm 22/9/2026 ══════════
 *
 * Bố mẹ (chủ tài khoản) lấy mã 6 số, đọc cho con cháu; con cháu nhập mã ở màn
 * Guardian. Mã hạn 10 phút, dùng một lần; máy chủ chỉ giữ bản băm của mã.
 *
 * ⚠️ GHÉP CHỈ CHO BIẾT "AI LÀ AI" — tên và số điện thoại của nhau. Không có
 * pin, vị trí, hay lịch sử kiểm nào đi theo: nội dung vẫn nằm trên máy bố mẹ
 * (§12 — không đổi privacy model). Màn Guardian phải nói đúng điều đó.
 * ⚠️ Chủ tài khoản thu hồi được bất cứ lúc nào, không cần con cháu đồng ý.
 */

export interface NguoiDaGhep {
  id: string;
  ten: string;
  so: string;
  ghepLuc: number;
}

export interface VongGhep {
  /** Những người TÔI đã cho mã (tôi là bố mẹ). */
  thanhVien: NguoiDaGhep[];
  /** Những người đã cho TÔI mã (tôi là con cháu). */
  chuTaiKhoan: NguoiDaGhep[];
}

export async function layMaGhep(): Promise<{ ma: string; hetHanSauGiay: number }> {
  return goi('/api/proof/ghep/bat-dau', { method: 'POST', body: '{}' }, true);
}

export async function nhapMaGhep(ma: string): Promise<void> {
  await goi('/api/proof/ghep/xac-nhan', { method: 'POST', body: JSON.stringify({ ma }) }, true);
}

export async function docVongGhep(): Promise<VongGhep> {
  const t = await goi('/api/proof/ghep', {}, true);
  return { thanhVien: t?.thanhVien ?? [], chuTaiKhoan: t?.chuTaiKhoan ?? [] };
}

export async function thuHoiNguoiDaGhep(thanhVienId: string): Promise<void> {
  await goi('/api/proof/thu-hoi', { method: 'POST', body: JSON.stringify({ thanhVienId }) }, true);
}

/*
 * ══════════ GIA HẠN PHIÊN — Phần 2, 23/9/2026 ══════════
 * Phiên sống 30 ngày. Hết là mọi cảnh báo cho con LẶNG LẼ ngừng (§4.3). `layHoSo`
 * chạy mỗi lần mở app, nên gọi ở đó: còn dưới 7 ngày thì đổi token mới.
 * ⚠️ Hỏng mạng thì thôi, KHÔNG đăng xuất — phiên cũ vẫn còn hạn.
 */
export async function giaHanNeuSapHet(bayGio: number = Date.now()): Promise<boolean> {
  const p = docPhien();
  if (!p || typeof p.hetHanLuc !== 'number') return false;
  if (p.hetHanLuc - bayGio > 7 * 24 * 60 * 60 * 1000) return false;
  try {
    const t = await goi('/api/tai-khoan/gia-han', { method: 'POST', body: '{}' }, true);
    if (t?.token) { luuPhien({ ...p, token: t.token, hetHanLuc: t.hetHanLuc }); return true; }
  } catch { /* giữ phiên cũ */ }
  return false;
}

/* ══════════ QUY TẮC "BÁO CHO CON" — Phần 2 ══════════ */
export interface QuyTacBao {
  baoKhiCao: boolean;
  baoKhiOtpTrongCuocGoi: boolean;
}

export async function docQuyTacBao(): Promise<QuyTacBao> {
  const t = await goi('/api/gia-dinh/quy-tac-bao', {}, true);
  return { baoKhiCao: t?.baoKhiCao === true, baoKhiOtpTrongCuocGoi: t?.baoKhiOtpTrongCuocGoi === true };
}

export async function datQuyTacBao(q: Partial<QuyTacBao>): Promise<QuyTacBao> {
  const t = await goi('/api/gia-dinh/quy-tac-bao', { method: 'PUT', body: JSON.stringify(q) }, true);
  return { baoKhiCao: t?.baoKhiCao === true, baoKhiOtpTrongCuocGoi: t?.baoKhiOtpTrongCuocGoi === true };
}

/*
 * ══════════ BÁO ĐỘNG GIA ĐÌNH — Phần 3, 23/9/2026 ══════════
 * Chỉ MÃ đi qua các hàm này (§6.9). Trạng thái gửi chỉ có bốn loại, không có
 * "đã thấy" (§9.4, §11). Xem `backend/src/bao-dong-gia-dinh.js`.
 */
export type TrangThaiGuiBao = 'DA_DAY_DI' | 'PUSH_DELIVERY_UNKNOWN' | 'CHUA_BAT_NHAN' | 'CHUA_CAU_HINH_PUSH' | 'DANG_KY_HET_HAN';

export interface PhanHoiBaoDong {
  gui: boolean;
  lyDo?: string;
  suKienId?: string;
  ketQua?: { ten: string; trangThai: TrangThaiGuiBao }[];
}

export interface SuKienBaoDong {
  id: string;
  loaiSuKien: 'ket_qua_kiem' | 'otp_trong_cuoc_goi' | 'cai_app_trong_cuoc_goi' | 'tien_ra_trong_cuoc_goi';
  nhan: string | null;
  hoKichBan: string | null;
  luc: number;
  tenBoMe: string;
  hanhDong: { ma: string; luc: number }[];
  conDaGoi: boolean;
}

export async function guiBaoDong(vao: {
  loaiSuKien: SuKienBaoDong['loaiSuKien'];
  nhan?: string;
  hoKichBan?: string | null;
}): Promise<PhanHoiBaoDong> {
  return goi('/api/gia-dinh/bao-dong', { method: 'POST', body: JSON.stringify(vao) }, true);
}

export async function guiTrangThaiBaoDong(suKienId: string, hanhDong: string): Promise<void> {
  await goi('/api/gia-dinh/trang-thai', { method: 'POST', body: JSON.stringify({ suKienId, hanhDong }) }, true);
}

export async function dangKyNhanCanhBao(dangKy: unknown, lang: string): Promise<{ daBat: boolean; soMay: number }> {
  return goi('/api/gia-dinh/nhan-canh-bao', { method: 'POST', body: JSON.stringify({ dangKy, lang }) }, true);
}

export async function tatNhanCanhBao(endpoint?: string): Promise<void> {
  await goi('/api/gia-dinh/nhan-canh-bao/tat', { method: 'POST', body: JSON.stringify({ endpoint }) }, true);
}

export async function docTinhTrangBao(): Promise<{ thanhVien: { id: string; ten: string; coDangKy: boolean }[] }> {
  return goi('/api/gia-dinh/tinh-trang-bao', {}, true);
}

export async function docSuKienBaoDong(id: string): Promise<SuKienBaoDong> {
  return goi(`/api/gia-dinh/su-kien/${encodeURIComponent(id)}`, {}, true);
}

export async function baoConDaGoi(id: string): Promise<void> {
  await goi(`/api/gia-dinh/su-kien/${encodeURIComponent(id)}/con-da-goi`, { method: 'POST', body: '{}' }, true);
}

/*
 * ══════════ CHÌA KHOÁ THỨ HAI — Phần 5, 23/9/2026 ══════════
 * Chỉ MÃ khoảng tiền đi lên máy chủ — không số tiền, không người nhận (§6.9).
 * Xác nhận chỉ cho biết AI ĐÃ KÝ, không nói khoản chuyển an toàn (§11).
 */
export type MaKhoangTien = 'duoi_5' | '5_10' | '10_20' | '20_50' | 'tren_50';
export interface CaiDatChiaKhoa { bat: boolean; nguong: 5 | 10 | 20 | 50 }
export interface YeuCauChoKy {
  yeuCauId: string; tenBoMe: string; khoangTien: MaKhoangTien;
  hanhDong: 'chuyen_khoan' | 'rut_tien'; nguoiYeuCau: 'nguoi_la' | 'nguoi_quen' | 'khong_ro'; hetHan: number;
}
/** Mã trạng thái của Khoan Proof — xem `MA_KET_QUA` ở `backend/src/khoan-proof-ky.js`. */
export const TRANG_THAI_KY = Object.freeze({
  DA_XAC_NHAN: 'YEU_CAU_DA_DUOC_KY_BOI_TAI_KHOAN',
  DA_TU_CHOI: 'TAI_KHOAN_DA_KY_TU_CHOI_YEU_CAU',
  DANG_CHO: 'DANG_CHO_TAI_KHOAN_KIA_KY',
  HET_HAN: 'CHUA_LIEN_LAC_DUOC_NGUOI_THAN',
});

export async function docChiaKhoa(): Promise<CaiDatChiaKhoa> {
  return goi('/api/gia-dinh/chia-khoa', {}, true);
}
export async function datChiaKhoa(vao: Partial<CaiDatChiaKhoa>): Promise<CaiDatChiaKhoa> {
  return goi('/api/gia-dinh/chia-khoa', { method: 'PUT', body: JSON.stringify(vao) }, true);
}
export async function kiemChiaKhoa(khoangTien: MaKhoangTien, nguoiNhanMoi: boolean): Promise<CaiDatChiaKhoa & { canXacNhan: boolean }> {
  return goi('/api/chia-khoa/kiem', { method: 'POST', body: JSON.stringify({ khoangTien, nguoiNhanMoi }) }, true);
}
export async function nhoConXacNhan(vao: Pick<YeuCauChoKy, 'khoangTien' | 'hanhDong' | 'nguoiYeuCau'>): Promise<{ yeuCauId: string; hetHan: number }> {
  return goi('/api/chia-khoa/yeu-cau', { method: 'POST', body: JSON.stringify(vao) }, true);
}
export async function docTrangThaiYeuCau(id: string): Promise<{ trangThai: string; cumTu?: string; hetHan: number }> {
  return goi(`/api/proof/yeu-cau/${encodeURIComponent(id)}`, {}, true);
}
export async function dangChoToiKy(): Promise<{ yeuCau: YeuCauChoKy[] }> {
  return goi('/api/chia-khoa/dang-cho', {}, true);
}
export async function layDeBaiKy(id: string): Promise<{ canDangKy: boolean; tuyChon?: any }> {
  return goi(`/api/chia-khoa/yeu-cau/${encodeURIComponent(id)}/tuy-chon`, {}, true);
}
export async function kyYeuCau(id: string, quyetDinh: 'XAC_NHAN' | 'TU_CHOI', phanHoi: unknown): Promise<{ maKetQua: string; cumTu: string }> {
  return goi(`/api/proof/yeu-cau/${encodeURIComponent(id)}/ky`, { method: 'POST', body: JSON.stringify({ quyetDinh, phanHoi }) }, true);
}
export async function batDauDangKyPasskey(): Promise<any> {
  return goi('/api/proof/dang-ky/bat-dau', { method: 'POST', body: '{}' }, true);
}
export async function xacNhanDangKyPasskey(phanHoi: unknown): Promise<unknown> {
  return goi('/api/proof/dang-ky/xac-nhan', { method: 'POST', body: JSON.stringify({ phanHoi }) }, true);
}

// ─────────── "Có phải con đang gọi không?" (23/9/2026) ───────────

export type TraLoiHoi = 'CO' | 'KHONG';
export interface KetQuaHoiCon {
  hoiId: string; tenBoMe: string; hetHan: number; conHan: boolean;
  traLoi: { ten: string; traLoi: TraLoiHoi; luc: number }[];
  guiToi: { ten: string; trangThai: string }[];
}
/** Máy bố mẹ: hỏi mọi người con đã ghép. `guiToi` nói THẬT ai đã được báo tới. */
export async function hoiConDangGoi(): Promise<{ hoiId: string; hetHan: number; guiToi: { ten: string; trangThai: string }[] }> {
  return goi('/api/gia-dinh/hoi-con', { method: 'POST', body: '{}' }, true);
}
export async function docHoiCon(id: string): Promise<KetQuaHoiCon> {
  return goi(`/api/gia-dinh/hoi-con/${encodeURIComponent(id)}`, {}, true);
}
/** Máy con: câu hỏi đang chờ mình trả lời. */
export async function hoiConDangCho(): Promise<{ hoi: { hoiId: string; tenBoMe: string; hetHan: number }[] }> {
  return goi('/api/gia-dinh/hoi-con/dang-cho', {}, true);
}
export async function traLoiHoiCon(id: string, traLoi: TraLoiHoi): Promise<{ daGhi: boolean }> {
  return goi(`/api/gia-dinh/hoi-con/${encodeURIComponent(id)}/tra-loi`, { method: 'POST', body: JSON.stringify({ traLoi }) }, true);
}
