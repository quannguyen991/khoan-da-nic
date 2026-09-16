/**
 * RA-ĐA NHÀ MÌNH — ba mươi ngày qua nhà này gặp những thủ đoạn nào.
 *
 * ⚠️ ĐỪNG NHẦM VỚI RA-ĐA THỦ ĐOẠN Ở BACKEND (§5.3).
 *
 * `backend/src/intel-store.js` + `intel-radar.js` là hệ nhận tin thủ đoạn từ
 * NGUỒN NGOÀI: có cổng duyệt, có tên người duyệt, từ chối mọi trường danh tính,
 * và trả ngữ cảnh bên cạnh kết quả phân tích.
 *
 * Tệp này làm việc ngược lại: đọc LỊCH SỬ CỦA CHÍNH MÁY NÀY, đếm theo họ kịch
 * bản, rồi sinh một gói chia sẻ sạch để người dùng tự quyết định gửi đi. Không
 * đọc kho intel, không ghi vào kho intel.
 *
 * ⚠️ RA-ĐA NHẬN THỦ ĐOẠN, KHÔNG NHẬN NGƯỜI (§12).
 *
 * Một bản chia sẻ lọt ra số điện thoại là một lời tố cáo công khai nhắm vào một
 * số máy — mà số đó rất có thể là số bị giả mạo của một người hoàn toàn vô can.
 * Kẻ lừa đảo đổi số mỗi ngày; người bị mạo danh thì không đổi được số của mình.
 *
 * Vì vậy gói chia sẻ chỉ được chứa ba loại giá trị:
 *   · MÃ dấu hiệu      — chữ in hoa, số và gạch dưới
 *   · TÊN họ kịch bản  — chữ thường, số và gạch dưới
 *   · SỐ ĐẾM           — số nguyên
 *
 * Mọi thứ khác bị `kiemTraAnToanChiaSe` chặn. Hàm đó là hàng rào cuối, và nó
 * chặn theo kiểu DANH SÁCH TRẮNG: cái gì không nằm trong ba loại trên thì
 * không đi được, kể cả khi hôm nay chưa ai nghĩ ra cách nhét nó vào.
 *
 * ⚠️ MODULE NÀY KHÔNG TỰ GỬI GÌ ĐI. Không `fetch`, không địa chỉ máy chủ. Máy
 * chủ ra-đa CHƯA ĐƯỢC DỰNG, và câu "làm sao chặn người gửi rác vào ra-đa" vẫn
 * chưa có lời đáp — nên bước này dừng ở chỗ sinh ra một gói sạch để người dùng
 * tự quyết định chia sẻ hay không.
 *
 * ⚠️ MỐC THỜI GIAN CHỈ TỚI TUẦN. Giờ chính xác của một lượt kiểm là dữ liệu về
 * sinh hoạt của một người cụ thể; tuần là đủ để thấy xu hướng thủ đoạn.
 */

const NGAY = 24 * 60 * 60 * 1000;

/** Cửa sổ mặc định: 30 ngày. Đủ dài để thấy xu hướng, đủ ngắn để còn đúng. */
export const SO_NGAY_MAC_DINH = 30;

const MAU_MA = /^[A-Z][A-Z0-9_]*$/;
const MAU_HO = /^[a-z][a-z0-9_]*$/;
const MAU_TUAN = /^\d{4}-W\d{2}$/;

export interface DemTheoHo { ho: string; soLan: number }
export interface DemTheoDauHieu { ma: string; soLan: number }

export interface TomTatRaDa {
  tuNgay: number;
  denNgay: number;
  tongLuot: number;
  theoHo: DemTheoHo[];
  theoDauHieu: DemTheoDauHieu[];
}

export interface GoiChiaSe {
  tuan: string;
  ho: DemTheoHo[];
  dauHieu: DemTheoDauHieu[];
}

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * Đọc mốc thời gian của một bản ghi lịch sử.
 *
 * ⚠️ `date` LÀ CHỮ HIỂN THỊ, KHÔNG PHẢI MỐC. App lưu "12:55 16-09" —
 * `Date.parse` trả `NaN`, và mọi bản ghi bị lọc sạch mà không có lỗi nào hiện
 * ra. Đo được trên bản chạy 16/9/2026: ra-đa báo "chưa có lượt kiểm nào" trong
 * khi máy đang có ba lượt.
 *
 * Thứ tự đọc: `luc` (bản ghi mới) → `Date.parse` (định dạng ISO) → chuỗi cũ
 * "HH:MM DD-MM" (suy năm hiện tại). Không đọc được thì trả `null`, và chỗ gọi
 * phải quyết định làm gì — chứ không lặng lẽ coi là 1970.
 */
function docMocThoiGian(o: Record<string, unknown>): number | null {
  if (typeof o.luc === 'number' && Number.isFinite(o.luc)) return o.luc;

  const tho = typeof o.date === 'string' ? o.date : '';
  if (!tho) return null;

  const iso = Date.parse(tho);
  if (Number.isFinite(iso)) return iso;

  // "12:55 16-09" — giờ:phút ngày-tháng, không có năm.
  const m = tho.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, gio, phut, ngay, thang] = m;
    const nam = new Date().getFullYear();
    const moc = new Date(nam, Number(thang) - 1, Number(ngay), Number(gio), Number(phut));
    return Number.isFinite(moc.getTime()) ? moc.getTime() : null;
  }
  return null;
}

/**
 * Gom lịch sử trong máy thành bức tranh thủ đoạn.
 *
 * Chỉ đọc ba trường: thời điểm, họ kịch bản, mã dấu hiệu. Không đọc tiêu đề,
 * không đọc nội dung — kể cả khi bản ghi có mang theo.
 */
export function tomTat(
  lichSu: unknown[],
  bayGio: number = Date.now(),
  soNgay: number = SO_NGAY_MAC_DINH,
): TomTatRaDa {
  const tuNgay = bayGio - soNgay * NGAY;
  const demHo = new Map<string, number>();
  const demMa = new Map<string, number>();
  let tongLuot = 0;

  for (const ban of Array.isArray(lichSu) ? lichSu : []) {
    if (!ban || typeof ban !== 'object') continue;
    const o = ban as Record<string, unknown>;
    const luc = docMocThoiGian(o);
    if (luc === null || luc < tuNgay || luc > bayGio) continue;

    const data = (o.data && typeof o.data === 'object' ? o.data : {}) as Record<string, unknown>;
    tongLuot += 1;

    const ho = chuoi(data.hoKichBan);
    if (MAU_HO.test(ho)) demHo.set(ho, (demHo.get(ho) ?? 0) + 1);

    const ds = Array.isArray(data.maLyDo) ? (data.maLyDo as unknown[]).map(chuoi) : [];
    for (const ma of ds) {
      if (MAU_MA.test(ma)) demMa.set(ma, (demMa.get(ma) ?? 0) + 1);
    }
  }

  const xep = <T>(m: Map<string, number>, khoa: 'ho' | 'ma'): T[] => [...m.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k, n]) => ({ [khoa]: k, soLan: n }) as unknown as T);

  return {
    tuNgay,
    denNgay: bayGio,
    tongLuot,
    theoHo: xep<DemTheoHo>(demHo, 'ho'),
    theoDauHieu: xep<DemTheoDauHieu>(demMa, 'ma'),
  };
}

/** `2026-09-16` → `2026-W38`. Tuần ISO, đủ thô để không lộ sinh hoạt. */
function tuanIso(moc: number): string {
  const d = new Date(moc);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const thu = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - thu);
  const dauNam = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const so = Math.ceil((((t.getTime() - dauNam.getTime()) / NGAY) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(so).padStart(2, '0')}`;
}

/**
 * Dựng gói chia sẻ. Đây là thứ DUY NHẤT được phép rời khỏi máy — và chỉ rời khi
 * chính người dùng bấm chia sẻ.
 */
export function dungGoiChiaSe(tt: TomTatRaDa, bayGio: number = Date.now()): GoiChiaSe {
  return {
    tuan: tuanIso(bayGio),
    ho: tt.theoHo.filter((h) => MAU_HO.test(h.ho)).map((h) => ({ ho: h.ho, soLan: h.soLan })),
    dauHieu: tt.theoDauHieu.filter((d) => MAU_MA.test(d.ma)).map((d) => ({ ma: d.ma, soLan: d.soLan })),
  };
}

export interface KetQuaKiem { ok: boolean; viPham: string[] }

/**
 * HÀNG RÀO CUỐI trước khi bất cứ thứ gì rời khỏi máy.
 *
 * ⚠️ CHẶN THEO DANH SÁCH TRẮNG, KHÔNG PHẢI THEO DANH SÁCH ĐEN.
 *
 * Danh sách đen chỉ chặn được những cách nhét dữ liệu mà hôm nay mình nghĩ ra.
 * Danh sách trắng chặn cả những cách mình chưa nghĩ ra: gói chỉ được có đúng ba
 * khoá, mỗi giá trị phải khớp đúng một khuôn mẫu, thừa một trường là hỏng.
 */
export function kiemTraAnToanChiaSe(goi: unknown): KetQuaKiem {
  const viPham: string[] = [];
  if (!goi || typeof goi !== 'object') return { ok: false, viPham: ['GOI_KHONG_HOP_LE'] };

  const o = goi as Record<string, unknown>;
  const khoaThua = Object.keys(o).filter((k) => !['tuan', 'ho', 'dauHieu'].includes(k));
  if (khoaThua.length) viPham.push(`KHOA_THUA:${khoaThua.join(',')}`);

  if (!MAU_TUAN.test(chuoi(o.tuan))) viPham.push('TUAN_SAI_DINH_DANG');

  const kiemDanhSach = (ds: unknown, khoa: 'ho' | 'ma', mau: RegExp, ten: string) => {
    if (!Array.isArray(ds)) { viPham.push(`${ten}_KHONG_PHAI_DANH_SACH`); return; }
    for (const m of ds) {
      if (!m || typeof m !== 'object') { viPham.push(`${ten}_PHAN_TU_LA`); continue; }
      const p = m as Record<string, unknown>;
      const thua = Object.keys(p).filter((k) => k !== khoa && k !== 'soLan');
      if (thua.length) viPham.push(`${ten}_KHOA_THUA:${thua.join(',')}`);
      if (!mau.test(chuoi(p[khoa]))) viPham.push(`${ten}_GIA_TRI_LA:${String(p[khoa]).slice(0, 24)}`);
      if (typeof p.soLan !== 'number' || !Number.isInteger(p.soLan) || p.soLan < 0) {
        viPham.push(`${ten}_SO_LAN_KHONG_PHAI_SO`);
      }
    }
  };

  kiemDanhSach(o.ho, 'ho', MAU_HO, 'HO');
  kiemDanhSach(o.dauHieu, 'ma', MAU_MA, 'DAU_HIEU');

  return { ok: viPham.length === 0, viPham };
}
