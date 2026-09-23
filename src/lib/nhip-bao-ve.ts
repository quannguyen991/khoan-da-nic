import { docPhien, docQuyTacBao, guiNhipBaoVe, type NhipBaoVe, type QuyenBaoVe } from '../tai-khoan';
import { laApk, quyenDocThongBao, quyenPopup, trangThaiTheoDoiCuocGoi, datNhipBaoVeNative, type QuyenNative } from '../native';
import { api } from '../api-goc';

/**
 * ══════ "MÁY BỐ MẸ CÒN ĐƯỢC BẢO VỆ KHÔNG?" — phía máy bố mẹ (23/9/2026) ══════
 *
 * Mở app / quay lại app: nếu CHÍNH bác đã bật "cho con xem", báo một nhịp (ba quyền,
 * bật/tắt) và trao token cho dịch vụ nền của APK để nó báo tiếp mỗi 6 giờ — kể cả
 * khi bác không mở app. Nhịp ngừng tới là tín hiệu cho con: "N ngày chưa báo về".
 *
 * ⚠️ §12 — ĐỌC QUY TẮC TRƯỚC. Chưa bật thì không một byte trạng thái nào rời máy,
 *    và native được bảo xoá token đã giữ.
 * ⚠️ Chỉ bool. Không tin nhắn, không vị trí, không pin, không danh sách ứng dụng.
 * ⚠️ Bản web không có quyền native nào ⇒ `null`, KHÔNG phải `false` (§4.3: "không có
 *    để báo" khác "đang tắt").
 */

/** Không báo dày hơn thế này khi bác mở/đóng app liên tục. */
const NHIP_TOI_THIEU_MS = 10 * 60 * 1000;
let lanGuiCuoi = 0;

const sangBool = (q: QuyenNative): boolean | null => (q === 'da_bat' ? true : q === 'chua_bat' ? false : null);

export async function thuThapNhip(nguon: NhipBaoVe['nguon'] = 'mo_app'): Promise<NhipBaoVe> {
  const khong: QuyenBaoVe = { docThongBao: null, theoDoiCuocGoi: null, hienTrenApp: null };
  if (!(await laApk())) return { nguon, laApk: false, quyen: khong };
  const [doc, popup, cuocGoi] = await Promise.all([quyenDocThongBao(), quyenPopup(), trangThaiTheoDoiCuocGoi()]);
  return {
    nguon,
    laApk: true,
    quyen: {
      docThongBao: sangBool(doc),
      hienTrenApp: sangBool(popup),
      theoDoiCuocGoi: cuocGoi ? cuocGoi.dangBat && cuocGoi.coQuyen : null,
    },
  };
}

/** `ep` = báo ngay, bỏ qua nhịp tối thiểu (vừa bật/tắt công tắc). */
export async function dongBoNhipBaoVe({ ep = false }: { ep?: boolean } = {}): Promise<void> {
  const phien = docPhien();
  if (!phien) { await datNhipBaoVeNative({ bat: false }); return; }
  if (!ep && Date.now() - lanGuiCuoi < NHIP_TOI_THIEU_MS) return;
  lanGuiCuoi = Date.now();

  let bat = false;
  try {
    bat = (await docQuyTacBao()).choConXemBaoVe;
  } catch {
    return; // Không đọc được quy tắc ⇒ không đoán; lần mở sau thử lại.
  }
  await datNhipBaoVeNative(bat ? { bat: true, token: phien.token, duong: api('/api/gia-dinh/nhip-bao-ve') } : { bat: false });
  if (!bat) return;
  try {
    await guiNhipBaoVe(await thuThapNhip('mo_app'));
  } catch { /* mất mạng: lần mở sau */ }
}
