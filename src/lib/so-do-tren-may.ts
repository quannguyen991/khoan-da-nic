/**
 * ═════ SỐ ĐO TRÊN MÁY NÀY — đọc lại hai bộ ghi hành vi ═════
 *
 * Thêm 25/9/2026. Từ 22/9 app đã tự ghi hai thứ, chỉ trên máy:
 *   · `ket-qua-can-thiep.ts` — sau màn cảnh báo, bác đã chọn việc gì;
 *   · `do-thoi-gian-toi-nguoi-that.ts` — bao nhiêu giây tới lúc chạm nút gọi.
 * Nhưng chưa chỗ nào đọc lại được việc đã chọn, nên buổi thử với người cao tuổi
 * (`nextgen-2026/5-KICH-BAN-THU-VOI-NGUOI-CAO-TUOI.md`) phải ghi tay.
 *
 * Tệp này làm hai việc: ĐẾM để hiện lên màn, và dựng một gói CHỈ CÓ MÃ để chính
 * người dùng bấm sao chép — đúng như ghi chú của module đo: "muốn dùng cho báo cáo
 * thì người dùng tự xuất ra".
 *
 * ⚠️ KHÔNG ĐƯỜNG RA MẠNG. Không `fetch`, không beacon, không đồng bộ — có test chặn.
 *    Sao chép vào bộ nhớ tạm là việc của màn hình, và chỉ khi bác bấm.
 * ⚠️ ĐẾM LẦN BẤM, KHÔNG ĐẾM VỤ. Một vụ có thể sinh hai bản ghi (bấm gọi, rồi "Con
 *    bảo là lừa đảo"), mà bản ghi không mang mã vụ. Nên ở đây KHÔNG có tỉ lệ nào:
 *    chia hai con đếm cho nhau là khai một phép đo chưa hề có (§11).
 * ⚠️ GÓI XUẤT KHÔNG MANG `maLyDo`. Chỉ mức, việc đã chọn và giờ — ít nhất có thể.
 * ⚠️ LỌC LẠI TRƯỚC KHI CHÉP. localStorage có thể đã bị sửa tay; mọi trường đi qua
 *    danh sách cho phép, và `kiemTraGoiSoDo` từ chối cả gói nếu còn thứ lạ.
 */

import { docKetQua, type BanGhiKetQua, type HanhDong } from './ket-qua-can-thiep';
import { docLuot, TRAN_HOP_LE_MS, type LuotDo } from './do-thoi-gian-toi-nguoi-that';

/** Thứ tự hiện trên màn: việc bảo vệ trước, lối ra và việc đã muộn sau. */
export const CAC_HANH_DONG: readonly HanhDong[] = [
  'bam_goi_nguoi_than', 'con_bao_lua_dao', 'con_bao_khong_sao', 'toi_on', 'da_lo_chuyen', 've_trang_chu',
];

const MUC_CAN_THIEP = ['TRUST_RECEIPT', 'VERIFY_PATH', 'PAUSE_60S', 'PROTECTED_CRITICAL', 'RECOVERY'];
const NHAN = ['CAO', 'NGHI_NGO', 'CHUA_THAY'];
const DANG_GIO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export interface DemHanhVi {
  soLanBam: number;
  theoHanhDong: Record<HanhDong, number>;
}

const laHanhDong = (x: unknown): x is HanhDong => CAC_HANH_DONG.includes(x as HanhDong);
const laMoc = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/**
 * Đếm theo từng việc. Chưa có bản ghi nào thì trả `null`, KHÔNG trả các số 0:
 * "chưa đo lần nào" và "đo rồi, ra 0" là hai trạng thái khác nhau (§4.3).
 */
export function demHanhVi(banGhi: BanGhiKetQua[] = docKetQua()): DemHanhVi | null {
  const hopLe = (Array.isArray(banGhi) ? banGhi : []).filter((b) => b && laHanhDong(b.hanhDong));
  if (hopLe.length === 0) return null;
  const theoHanhDong = Object.fromEntries(CAC_HANH_DONG.map((h) => [h, 0])) as Record<HanhDong, number>;
  for (const b of hopLe) theoHanhDong[b.hanhDong] += 1;
  return { soLanBam: hopLe.length, theoHanhDong };
}

export interface GoiSoDo {
  loai: 'khoan-da/so-do-tren-may';
  phienBan: 1;
  lapLuc: string;
  ketQua: { luc: string; canThiep: string | null; nhan: string | null; hanhDong: HanhDong }[];
  thoiGianToiLucBam: { luc: string; giay: number; nhan: 'CAO' | 'NGHI_NGO' }[];
}

const gio = (ms: number) => new Date(ms).toISOString();

/** Dựng gói để chép. Chỉ lấy đúng các trường liệt kê, lọc lại từng giá trị. */
export function dungGoiSoDo(
  banGhi: BanGhiKetQua[] = docKetQua(),
  luot: LuotDo[] = docLuot(),
  bayGio: number = Date.now(),
): GoiSoDo {
  return {
    loai: 'khoan-da/so-do-tren-may',
    phienBan: 1,
    lapLuc: gio(bayGio),
    ketQua: (Array.isArray(banGhi) ? banGhi : [])
      .filter((b) => b && laMoc(b.luc) && laHanhDong(b.hanhDong))
      .map((b) => ({
        luc: gio(b.luc),
        canThiep: MUC_CAN_THIEP.includes(b.canThiep as string) ? (b.canThiep as string) : null,
        nhan: NHAN.includes(b.nhan as string) ? (b.nhan as string) : null,
        hanhDong: b.hanhDong,
      })),
    thoiGianToiLucBam: (Array.isArray(luot) ? luot : [])
      .filter((l) => l && laMoc(l.batDau) && Number.isFinite(l.giayToiLucBam)
        && l.giayToiLucBam >= 0 && l.giayToiLucBam * 1000 <= TRAN_HOP_LE_MS)
      .map((l) => ({ luc: gio(l.batDau), giay: l.giayToiLucBam, nhan: l.nhan === 'NGHI_NGO' ? 'NGHI_NGO' : 'CAO' })),
  };
}

const dungKhoa = (o: unknown, khoa: string[]) => !!o && typeof o === 'object' && !Array.isArray(o)
  && Object.keys(o).length === khoa.length && khoa.every((k) => k in (o as object));

/**
 * Hàng rào cuối, đứng TRƯỚC khi chép — chuỗi đã vào bộ nhớ tạm là đã ra khỏi tầm
 * app. Chỉ nhận đúng hình dạng `GoiSoDo`; bất kỳ khoá thừa hay giá trị lạ nào là
 * từ chối cả gói, không chép một nửa.
 */
export function kiemTraGoiSoDo(goi: unknown): boolean {
  if (!dungKhoa(goi, ['loai', 'phienBan', 'lapLuc', 'ketQua', 'thoiGianToiLucBam'])) return false;
  const g = goi as GoiSoDo;
  if (g.loai !== 'khoan-da/so-do-tren-may' || g.phienBan !== 1 || !DANG_GIO.test(String(g.lapLuc))) return false;
  if (!Array.isArray(g.ketQua) || !Array.isArray(g.thoiGianToiLucBam)) return false;
  const kqDung = g.ketQua.every((b) => dungKhoa(b, ['luc', 'canThiep', 'nhan', 'hanhDong'])
    && DANG_GIO.test(String(b.luc))
    && (b.canThiep === null || MUC_CAN_THIEP.includes(b.canThiep))
    && (b.nhan === null || NHAN.includes(b.nhan))
    && laHanhDong(b.hanhDong));
  const doDung = g.thoiGianToiLucBam.every((l) => dungKhoa(l, ['luc', 'giay', 'nhan'])
    && DANG_GIO.test(String(l.luc))
    && typeof l.giay === 'number' && Number.isFinite(l.giay) && l.giay >= 0 && l.giay * 1000 <= TRAN_HOP_LE_MS
    && (l.nhan === 'CAO' || l.nhan === 'NGHI_NGO'));
  return kqDung && doDung;
}
