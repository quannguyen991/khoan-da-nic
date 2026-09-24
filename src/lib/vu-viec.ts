/**
 * ══════ BỘ NHỚ VỤ VIỆC TRÊN MÁY BÁC — §6.11, nối vào giao diện 24/9/2026 ══════
 *
 * Kẻ lừa hiếm khi đòi tiền ngay tin đầu. Bộ Công an (09/2026) và báo cáo nghiên cứu
 * đều ghi: kịch bản đi NHIỀU BƯỚC — "cán bộ khu vực cần cập nhật VNeID" hôm nay, "cài
 * ứng dụng theo link" hôm sau, "chuyển tiền xác minh" hôm sau nữa. Xét TỪNG TIN
 * riêng thì tin đầu chưa đòi gì, tin sau thiếu phần giả danh — cả hai đều lọt.
 *
 * Máy chủ có sẵn bộ máy gộp vụ (`backend/src/journey-engine.js`) từ trước, nhưng
 * giao diện CHƯA TỪNG gọi tới. Tệp này là phần nối.
 *
 * ⚠️ §6.9 — CHỈ LƯU MÃ VÀ THỰC THỂ, KHÔNG LƯU NỘI DUNG TIN. Mỗi sự kiện là: lúc
 * nào, giai đoạn nào, mã dấu hiệu nào; hồ sơ giữ số điện thoại / tài khoản / tên
 * miền để nhận ra lần sau. Nằm trên máy bác, 14 ngày thì tự bỏ.
 *
 * ⚠️ §6.11 — KHÔNG TỰ GỘP. Máy chủ trả câu hỏi; bác bấm "Đúng" mới gộp.
 * ⚠️ §4.2 — GỘP CHỈ LÀM TĂNG. Kết quả gộp thấp hơn kết quả gốc thì giữ gốc.
 */
import { api } from '../api-goc';

const KHOA = 'khoan_da_vu_viec';
const CUA_SO_MS = 14 * 24 * 60 * 60 * 1000;
const TOI_DA_HO_SO = 20;

export interface SuKienVuViec {
  thoiDiem: number;
  kenh: string | null;
  giaiDoan: string;
  maLyDo: string[];
}

export interface HoSoVuViec {
  id: string;
  taoLuc: number;
  capNhatLuc: number;
  thucThe: Record<string, string[]>;
  suKien: SuKienVuViec[];
  dong?: boolean;
}

export interface CauHoiGopVuViec {
  hoSo: HoSoVuViec;
  /** Vì sao nghi cùng vụ: trường trùng (dienThoai / soTaiKhoan / tenMien…). */
  viSao: Array<{ truong: string; giaTri: string }>;
  suKien: SuKienVuViec & { thucThe: Record<string, string[]> };
  vanBan: string;
  maLyDo: string[];
}

export function docHoSoVuViec(bayGio = Date.now()): HoSoVuViec[] {
  try {
    const ds = JSON.parse(localStorage.getItem(KHOA) || '[]');
    if (!Array.isArray(ds)) return [];
    return ds.filter((h) => h && typeof h.id === 'string' && bayGio - (h.capNhatLuc || 0) <= CUA_SO_MS);
  } catch {
    return [];
  }
}

function ghiHoSo(ds: HoSoVuViec[]): void {
  try {
    const gon = [...ds].sort((a, b) => b.capNhatLuc - a.capNhatLuc).slice(0, TOI_DA_HO_SO);
    localStorage.setItem(KHOA, JSON.stringify(gon));
  } catch { /* bị chặn bộ nhớ thì thôi — mất bộ nhớ vụ việc, không mất phân tích */ }
}

const coThucThe = (tt: Record<string, string[]> | undefined): boolean =>
  !!tt && Object.values(tt).some((v) => Array.isArray(v) && v.length > 0);

function gopThucThe(a: Record<string, string[]>, b: Record<string, string[]>): Record<string, string[]> {
  const ra: Record<string, string[]> = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    if (!Array.isArray(v)) continue;
    ra[k] = [...new Set([...(ra[k] || []), ...v])].slice(0, 20);
  }
  return ra;
}

/**
 * Ghi sự kiện vào hồ sơ `hoSoId` (bác đã xác nhận cùng vụ), hoặc mở hồ sơ mới.
 * Tin không có thực thể nào (không số, không tài khoản, không tên miền) thì không
 * mở hồ sơ mới — không có gì để nhận ra lần sau.
 */
export function ghiSuKien(suKien: CauHoiGopVuViec['suKien'], hoSoId: string | null, bayGio = Date.now()): void {
  const ds = docHoSoVuViec(bayGio);
  const sk: SuKienVuViec = {
    thoiDiem: suKien.thoiDiem || bayGio, kenh: suKien.kenh ?? null,
    giaiDoan: suKien.giaiDoan, maLyDo: suKien.maLyDo || [],
  };
  const hs = hoSoId ? ds.find((h) => h.id === hoSoId) : null;
  if (hs) {
    hs.suKien = [...hs.suKien, sk].slice(-30);
    hs.thucThe = gopThucThe(hs.thucThe, suKien.thucThe);
    hs.capNhatLuc = bayGio;
  } else {
    if (!coThucThe(suKien.thucThe)) return;
    ds.push({
      id: `vv-${bayGio.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      taoLuc: bayGio, capNhatLuc: bayGio, thucThe: suKien.thucThe, suKien: [sk],
    });
  }
  ghiHoSo(ds);
}

/** Xoá hết bộ nhớ vụ việc trên máy — bác có quyền, bất cứ lúc nào. */
export function xoaHoSoVuViec(): void {
  try { localStorage.removeItem(KHOA); } catch { /* không sao */ }
}

async function goi(duong: string, than: unknown): Promise<any> {
  const r = await fetch(api(duong), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(than),
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/**
 * Sau một lượt kiểm: hỏi máy chủ có vụ cũ nào trùng không.
 * Trả câu hỏi nếu CÓ và kết quả hiện tại chưa phải CAO (đã CAO thì gộp không
 * thêm được gì, hỏi chỉ làm bác mất thêm một chạm). Ngược lại tự ghi sự kiện.
 * Hỏng mạng thì im lặng — đây là phần THÊM, kết quả chính đã có rồi.
 */
export async function kiemVuViec(vanBan: string, ketQua: { nhan?: string; maLyDo?: string[] }):
  Promise<CauHoiGopVuViec | null> {
  const bayGio = Date.now();
  try {
    const hoSoDangMo = docHoSoVuViec(bayGio);
    const kq = await goi('/api/vu-viec/ung-vien', {
      vanBan, maLyDo: ketQua.maLyDo || [], hoSoDangMo, thoiDiem: bayGio,
    });
    const suKien = kq?.suKien;
    if (!suKien) return null;
    const hoi = kq?.cauHoiGop;
    /*
     * ⚠️ CHỈ HỎI KHI TRÙNG THỨ ĐỊNH DANH ĐƯỢC NGƯỜI GỬI: số điện thoại, số tài khoản,
     * tên miền. Máy chủ ghép cả khi chỉ trùng "cơ quan được nhắc tới" (cùng nhắc
     * "công an") — hai tin lạ nhau trong 14 ngày rất hay cùng nhắc công an, và hỏi
     * mỗi lần như vậy là dạy bác bấm "Không" theo phản xạ.
     */
    const trungManh = (hoi?.viSao || []).some((x: { truong: string }) => ['dienThoai', 'soTaiKhoan', 'tenMien'].includes(x.truong));
    const hoSo = hoi?.canHoi && trungManh ? hoSoDangMo.find((h) => h.id === hoi.hoSoUngVien) : null;
    if (hoSo && ketQua.nhan !== 'CAO') {
      return { hoSo, viSao: hoi.viSao || [], suKien, vanBan, maLyDo: ketQua.maLyDo || [] };
    }
    ghiSuKien(suKien, null, bayGio);
    return null;
  } catch {
    return null;
  }
}

/** Bác bấm "Đúng, cùng một người": xét cả vụ. Trả kết quả gộp (máy chủ), hoặc null nếu hỏng. */
export async function gopVuViec(cau: CauHoiGopVuViec): Promise<any | null> {
  try {
    const kq = await goi('/api/vu-viec/gop', {
      vanBan: cau.vanBan, maLyDo: cau.maLyDo, hoSo: cau.hoSo, daXacNhanGop: true, thoiDiem: Date.now(),
    });
    ghiSuKien(kq?.suKien ?? cau.suKien, cau.hoSo.id);
    return kq;
  } catch {
    ghiSuKien(cau.suKien, cau.hoSo.id);
    return null;
  }
}

/** Bác bấm "Không phải": ghi thành vụ riêng, không gộp. */
export function khongGopVuViec(cau: CauHoiGopVuViec): void {
  ghiSuKien(cau.suKien, null);
}

const BAC: Record<string, number> = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };

/**
 * ⚠️ §4.2 — CHỈ LÀM TĂNG. Kết quả gộp cao hơn thì lấy nhãn, màn can thiệp và lý
 * do của nó; bằng hay thấp hơn thì giữ nguyên kết quả gốc. `aiDaChay`, `daKiem`,
 * `chuaKiem` luôn giữ của lượt gốc — lượt gộp không gọi AI, và §HĐ luật 3 bắt
 * `chuaKiem` của lượt gốc phải còn nguyên trên màn.
 */
export function ghepKetQuaVuViec<T extends { nhan?: string; maLyDo?: string[] }>(goc: T, gop: any, ngayVuCu: number): T {
  if (!gop || typeof gop.nhan !== 'string') return goc;
  const cao = (BAC[gop.nhan] ?? -1) > (BAC[goc.nhan ?? ''] ?? -1);
  if (!cao) return { ...goc, daXetCaVu: ngayVuCu };
  return {
    ...goc,
    nhan: gop.nhan,
    canThiep: gop.canThiep,
    hoKichBan: gop.hoKichBan ?? (goc as any).hoKichBan ?? null,
    maLyDo: [...new Set([...(goc.maLyDo || []), ...(gop.maLyDo || [])])],
    daXetCaVu: ngayVuCu,
  };
}
