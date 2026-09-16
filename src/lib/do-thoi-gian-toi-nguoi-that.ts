/**
 * ĐO THỜI GIAN TỪ CẢNH BÁO TỚI LÚC BẤM GỌI NGƯỜI THÂN.
 *
 * Đây là chỉ số duy nhất trong sản phẩm nói về HÀNH VI chứ không nói về mô
 * hình. "Bắt được 90% tin lừa đảo" là câu về phần mềm. "Sau cảnh báo mức cao,
 * bác bấm gọi con sau 12 giây" là câu về thứ thật sự đổi kết cục.
 *
 * ⚠️ TÊN NÓI ĐÚNG THỨ ĐO ĐƯỢC: `giayToiLucBam`.
 *
 * Máy KHÔNG biết cuộc gọi có ai nhấc máy hay không — trình duyệt chỉ mở ứng
 * dụng gọi rồi hết phần của nó. Gọi con số này là "thời gian tới người thân" là
 * khai một việc app không làm được (§11). Có test chặn các tên như
 * `toiNguoiThan`, `daNgheMay`, `answered`.
 *
 * ⚠️ SỐ ĐO Ở LẠI TRONG MÁY. Không `fetch`, không beacon, không đồng bộ. Đây là
 * dữ liệu về lúc một người đang hoảng — nó không có lý do gì để rời khỏi máy
 * của chính người đó. Muốn dùng cho báo cáo thì người dùng tự xuất ra.
 *
 * ⚠️ KHÔNG LƯU NỘI DUNG. Bản ghi có đúng ba trường: mốc bắt đầu, số giây, mức.
 */

const KHOA = 'khoan_da_do_thoi_gian';

/**
 * Quá mốc này thì bỏ lượt đo.
 *
 * Bác mở màn cảnh báo rồi đi nấu cơm, hai tiếng sau quay lại bấm gọi. Con số đó
 * không nói gì về phản ứng, và nó kéo trung vị đi rất xa. Bỏ một lượt đo thì
 * mất một mẫu; giữ nó thì hỏng cả phép đo.
 */
export const TRAN_HOP_LE_MS = 15 * 60 * 1000;

/** Giữ 50 lượt gần nhất. Đủ để có trung vị, không phình vô hạn. */
export const TOI_DA_BAN_GHI = 50;

export type NhanCanhBao = 'CAO' | 'NGHI_NGO';

export interface PhienDo {
  batDau: number;
  nhan: NhanCanhBao;
}

export interface LuotDo {
  batDau: number;
  /** Số giây từ lúc cảnh báo hiện tới lúc ngón tay chạm nút gọi. */
  giayToiLucBam: number;
  nhan: NhanCanhBao;
}

export interface ThongKeDo {
  soLuot: number;
  trungVi: number;
  nhanhNhat: number;
  chamNhat: number;
}

function kho(): Storage | null {
  try {
    const g = globalThis as unknown as { localStorage?: Storage };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Mở một phiên đo khi màn cảnh báo hiện ra.
 *
 * Mức thấp nhất trả `null`: không có cảnh báo thì không có phản ứng nào để đo,
 * và đếm nó vào sẽ pha loãng đúng con số mình cần.
 */
export function batDauDo(nhan: string | null | undefined, luc: number): PhienDo | null {
  if (nhan !== 'CAO' && nhan !== 'NGHI_NGO') return null;
  return { batDau: luc, nhan };
}

/** Đóng phiên đo lúc người dùng bấm gọi. `null` nghĩa là lượt này không tính. */
export function ketThucDo(phien: PhienDo | null | undefined, luc: number): LuotDo | null {
  if (!phien) return null;
  const cach = luc - phien.batDau;
  if (!Number.isFinite(cach) || cach < 0 || cach > TRAN_HOP_LE_MS) return null;
  return {
    batDau: phien.batDau,
    giayToiLucBam: Math.round(cach / 100) / 10,
    nhan: phien.nhan,
  };
}

export function docLuot(): LuotDo[] {
  const k = kho();
  if (!k) return [];
  try {
    const tho = JSON.parse(k.getItem(KHOA) || 'null');
    if (!Array.isArray(tho)) return [];
    return tho
      .filter((x): x is LuotDo => !!x && typeof x === 'object'
        && typeof (x as LuotDo).giayToiLucBam === 'number')
      .map((x) => ({
        batDau: typeof x.batDau === 'number' ? x.batDau : 0,
        giayToiLucBam: x.giayToiLucBam,
        nhan: x.nhan === 'NGHI_NGO' ? 'NGHI_NGO' : 'CAO',
      }));
  } catch {
    return [];
  }
}

export function ghiLuot(luot: LuotDo): void {
  const k = kho();
  if (!k) return;
  const ds = [...docLuot(), luot].slice(-TOI_DA_BAN_GHI);
  try {
    k.setItem(KHOA, JSON.stringify(ds));
  } catch { /* kho đầy hoặc bị chặn */ }
}

/**
 * Thống kê. Chưa có lượt nào thì trả `null`, KHÔNG trả 0.
 *
 * 0 giây là một con số. "Chưa đo lần nào" là một trạng thái khác hẳn. Trộn hai
 * thứ đó lại là lặp lại đúng lỗi §4.3 ở một chỗ mới: khai một phép đo chưa hề
 * xảy ra.
 */
export function thongKe(luot?: LuotDo[] | null): ThongKeDo | null {
  const ds = Array.isArray(luot) ? luot : docLuot();
  if (ds.length === 0) return null;

  const giay = ds.map((l) => l.giayToiLucBam).sort((a, b) => a - b);
  const giua = Math.floor(giay.length / 2);
  const trungVi = giay.length % 2 === 1
    ? (giay[giua] as number)
    : ((giay[giua - 1] as number) + (giay[giua] as number)) / 2;

  return {
    soLuot: ds.length,
    trungVi: Math.round(trungVi * 10) / 10,
    nhanhNhat: giay[0] as number,
    chamNhat: giay[giay.length - 1] as number,
  };
}
