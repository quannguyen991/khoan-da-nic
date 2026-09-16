/**
 * HỒ SƠ VỤ VIỆC — tệp bác cầm tới ngân hàng và công an.
 *
 * Hôm nay sản phẩm dừng ở câu "gọi ngân hàng bằng số đúng". Nhưng người vừa mất
 * tiền, đang hoảng, gọi tổng đài và không nhớ nổi mình chuyển lúc mấy giờ, bao
 * nhiêu, vào đâu — mà tổng đài hỏi đúng những câu đó. Đây là tệp trả lời sẵn.
 *
 * ⚠️ KHÔNG TỰ ĐIỀN GÌ NGƯỜI DÙNG CHƯA KHAI.
 *
 * Số tiền, tên ngân hàng, mã giao dịch: app không biết. Chỗ nào chưa khai thì
 * ghi "chưa khai", không ghi 0 và không để trống. Một hồ sơ điền hộ là một hồ
 * sơ sai đưa cho công an — và người đọc nó không có cách nào biết chỗ nào là
 * lời khai, chỗ nào là máy đoán.
 *
 * ⚠️ KHÔNG CHỨA NỘI DUNG TIN NHẮN.
 *
 * Tệp này đi ra khỏi máy: sang email, sang máy in, sang tay người lạ ở quầy.
 * Nội dung bác kiểm có thể rất riêng tư — cùng lý do bảng của người con không
 * bao giờ hiện nội dung (§6.9). Hồ sơ chỉ mang: thời điểm, mức, mã dấu hiệu.
 *
 * ⚠️ MỐC THỜI GIAN LÀ LÚC BẤM KIỂM, KHÔNG PHẢI LÚC BỊ LỪA. App chỉ biết lúc
 * ngón tay chạm nút. Văn bản phải nói rõ điều đó, nếu không người đọc sẽ hiểu
 * thành thời điểm vụ việc xảy ra (§11).
 */

import { MA_LY_DO, CHUA_KIEM, NHAN, HO_SO_KHUNG, tra, type Lang } from '../catalog';

export interface MocVuViec {
  /** Mốc thời gian BẤM KIỂM trong ứng dụng. */
  luc: number;
  nhan: string;
  loai: string;
  maLyDo: string[];
  chuaKiem: string[];
}

/** Những gì CHÍNH NGƯỜI DÙNG khai. App không sinh ra trường nào ở đây. */
export interface KhaiBao {
  soTien?: number | null;
  nganHang?: string | null;
  luocChuyen?: number | null;
  maGiaoDich?: string | null;
}

export interface HoSo {
  taoLuc: number;
  moc: MocVuViec[];
  khai: Required<KhaiBao>;
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

function docMoc(ban: unknown): MocVuViec | null {
  if (!ban || typeof ban !== 'object') return null;
  const o = ban as Record<string, unknown>;
  const data = (o.data && typeof o.data === 'object' ? o.data : {}) as Record<string, unknown>;

  const luc = docMocThoiGian(o);
  const nhan = chuoi(o.risk) || chuoi(data.nhan);
  if (!nhan) return null;

  return {
    luc: luc ?? 0,
    nhan,
    loai: chuoi(o.type),
    // CHỈ MÃ. `noiDungGoc` và mọi trường nội dung khác cố ý không được đọc tới.
    maLyDo: Array.isArray(data.maLyDo) ? (data.maLyDo as unknown[]).map(chuoi).filter(Boolean) : [],
    chuaKiem: Array.isArray(data.chuaKiem) ? (data.chuaKiem as unknown[]).map(chuoi).filter(Boolean) : [],
  };
}

export function dungHoSo(
  lichSu: unknown[],
  khai: KhaiBao = {},
  taoLuc: number = Date.now(),
): HoSo {
  const moc = (Array.isArray(lichSu) ? lichSu : [])
    .map(docMoc)
    .filter((x): x is MocVuViec => !!x)
    .sort((a, b) => a.luc - b.luc);

  return {
    taoLuc,
    moc,
    khai: {
      soTien: typeof khai.soTien === 'number' ? khai.soTien : null,
      nganHang: chuoi(khai.nganHang) || null,
      luocChuyen: typeof khai.luocChuyen === 'number' ? khai.luocChuyen : null,
      maGiaoDich: chuoi(khai.maGiaoDich) || null,
    },
  };
}

const gio = (moc: number, lang: Lang): string => {
  if (!moc) return '—';
  const d = new Date(moc);
  const hai = (n: number) => String(n).padStart(2, '0');
  const ngay = `${hai(d.getDate())}/${hai(d.getMonth() + 1)}/${d.getFullYear()}`;
  const h = `${hai(d.getHours())}:${hai(d.getMinutes())}`;
  return lang === 'en' ? `${ngay} ${h}` : `${ngay} lúc ${h}`;
};

const soTienChu = (n: number, lang: Lang): string =>
  (lang === 'en' ? n.toLocaleString('en-US') : n.toLocaleString('de-DE'));

/**
 * Xuất ra văn bản thuần.
 *
 * ⚠️ VĂN BẢN THUẦN LÀ CHỦ Ý, không phải vì làm PDF khó. Tệp này phải đọc được
 * bằng mắt thường, dán được vào email, đọc được qua điện thoại cho tổng đài, và
 * mở được trên bất kỳ máy nào ở quầy giao dịch.
 */
export function xuatVanBan(hoSo: HoSo, lang: Lang = 'vi'): string {
  const c = (ma: string) => tra(HO_SO_KHUNG, ma, lang) ?? '';
  const chuaKhai = c('CHUA_KHAI');
  const d: string[] = [];

  d.push(c('TIEU_DE'));
  d.push('='.repeat(c('TIEU_DE').length));
  d.push(c('TAO_LUC').replace('{luc}', gio(hoSo.taoLuc, lang)));
  d.push('');
  d.push(c('KHONG_NOI_DUNG'));
  d.push('');

  // ── Phần 1: các lượt kiểm ───────────────────────────────────────────────
  d.push(c('PHAN_MOC'));
  d.push(c('GHI_CHU_MOC'));
  d.push('');
  if (hoSo.moc.length === 0) {
    d.push(`  ${c('KHONG_CO_MOC')}`);
  } else {
    for (const m of hoSo.moc) {
      const nhanChu = tra(NHAN, m.nhan, lang) ?? m.nhan;
      d.push(`  ${gio(m.luc, lang)} — ${nhanChu}`);
      for (const ma of m.maLyDo) {
        const cau = tra(MA_LY_DO, ma, lang);
        if (cau) d.push(`      · ${cau}`);
      }
    }
  }
  d.push('');

  // ── Phần 2: lời khai của chính người dùng ───────────────────────────────
  d.push(c('PHAN_KHAI'));
  d.push(c('GHI_CHU_KHAI'));
  d.push('');
  d.push(`  ${c('SO_TIEN')}: ${hoSo.khai.soTien === null ? chuaKhai : soTienChu(hoSo.khai.soTien, lang)}`);
  d.push(`  ${c('NGAN_HANG')}: ${hoSo.khai.nganHang ?? chuaKhai}`);
  d.push(`  ${c('LUC_CHUYEN')}: ${hoSo.khai.luocChuyen === null ? chuaKhai : gio(hoSo.khai.luocChuyen, lang)}`);
  d.push(`  ${c('MA_GIAO_DICH')}: ${hoSo.khai.maGiaoDich ?? chuaKhai}`);
  d.push('');

  // ── Phần 3: những thứ chưa kiểm được (§4.3) ─────────────────────────────
  const chuaKiemTatCa = [...new Set(hoSo.moc.flatMap((m) => m.chuaKiem))];
  d.push(c('PHAN_CHUA_KIEM'));
  d.push('');
  if (chuaKiemTatCa.length === 0) {
    d.push(`  ${c('KHONG_CO_CHUA_KIEM')}`);
  } else {
    for (const ma of chuaKiemTatCa) {
      const cau = tra(CHUA_KIEM, ma, lang);
      if (cau) d.push(`  · ${cau}`);
    }
  }
  d.push('');
  d.push('—'.repeat(40));
  d.push(c('GHI_CHU_CUOI'));

  return d.join('\n');
}
