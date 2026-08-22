/**
 * CẦU NỐI TỚI HAI TÍNH NĂNG NATIVE CỦA BẢN APK.
 *
 * ⚠️ MỌI HÀM Ở ĐÂY PHẢI CHẠY ĐƯỢC KHI KHÔNG CÓ NATIVE.
 * Cùng một mã nguồn chạy ở ba nơi: trình duyệt trên máy tính, PWA cài trên điện
 * thoại, và APK. Chỉ APK có plugin. Nên mọi thứ đều trả về "không hỗ trợ" một
 * cách bình thường, KHÔNG ném lỗi, KHÔNG chặn đường kiểm tin nhắn (§6.7).
 *
 * ⚠️ §4.2 — TẦNG NÀY KHÔNG QUYẾT ĐỊNH GÌ VỀ RỦI RO.
 * Nó lấy nội dung thô rồi đưa sang `/api/analyze`. Không có chỗ nào ở đây chấm
 * điểm hay xếp mức. Thêm một dòng `if (noiDung.includes('OTP'))` là tạo đường
 * quyết định thứ hai — §12 cấm.
 */

/**
 * ⚠️ KHAI TẠI CHỖ, KHÔNG IMPORT — ba nhãn của §4.1.
 * Bản này không có `src/api.ts`; giữ nguyên ENUM để §HĐ luật 1 không bị phá:
 * backend không bao giờ trả chuỗi hiển thị, và tầng này không bao giờ so sánh
 * bằng chuỗi tiếng Việt. Chữ hiện ra nằm ở `catalog.ts`.
 */
type Nhan = 'CAO' | 'NGHI_NGO' | 'CHUA_THAY';

interface CauNoi {
  dayAppXuong(): Promise<void>;
  docTo(o: { chu: string; ngonNgu: string }): Promise<{ xong: boolean }>;
  dungDocTo(): Promise<void>;
  trangThaiQuyenDocThongBao(): Promise<{ daBat: boolean }>;
  moCaiDatDocThongBao(): Promise<void>;
  /**
   * Quyền POST_NOTIFICATIONS (Android 13+).
   * Trước API 33 thì luôn `daBat: true` — không có quyền này để hỏi.
   */
  trangThaiQuyenThongBao(): Promise<{ daBat: boolean }>;
  /** Mở Cài đặt thông báo của app — nơi người dùng tự bật quyền. */
  moCaiDatThongBao(): Promise<void>;
  layTinMoiNhat(): Promise<{
    co: boolean; tuApp?: string; noiDung?: string; trangThai?: string; luc?: number;
  }>;
  xoaTinDaBat(): Promise<void>;
  trangThaiQuyenPopup(): Promise<{ daBat: boolean }>;
  moCaiDatPopup(): Promise<void>;
  hienPopup(o: { tieuDe: string; nutMo: string; nutOn: string }): Promise<void>;
  anPopup(): Promise<void>;
  /**
   * Heads-up notification khi mức CAO. Bấm vào → mở app vào màn Dừng 60s.
   * `daHien` phản ánh `getActiveNotifications()` — ROM chặn thì trả false.
   */
  hienCanhBaoHeadsUp(o: { tieuDe: string; noiDung: string }): Promise<{ daHien: boolean }>;
  anCanhBaoHeadsUp(): Promise<void>;
  /**
   * Lối tắt thường trực: bác đã chọn bật chưa, và nó có đang nằm trên thanh
   * thật không. Hai giá trị KHÁC NHAU — xem chú thích bên Java.
   */
  trangThaiThongBaoThuongTruc(): Promise<{ daChon: boolean; dangHien: boolean }>;
  napChuCuocGoi(o: {
    tieuDe: string; noiDung: string; nutMo: string; nutOn: string; phut?: number;
  }): Promise<void>;
  trangThaiTheoDoiCuocGoi(): Promise<{ coQuyen: boolean; dangBat: boolean }>;
  datTheoDoiCuocGoi(o: { bat: boolean }): Promise<{ dangBat: boolean; maLoi?: string }>;
  trangThaiMay(): Promise<{
    docDuoc: boolean;
    dichVuTroNang: { goi: string; ten: string; nguonCai: string; ngayCai: number }[];
  }>;
  moCaiDatTroNang(): Promise<void>;
  trangThaiBoNghe(): Promise<{ daCo: boolean; lyDo?: string; sdk?: number }>;
  moCaiDatGiongNoi(): Promise<void>;
  batDauNghe(o: { ngonNgu?: string }): Promise<{
    vanBan: string; doTinCayThapNhat: number; ghiAmFailed: boolean; maLoi?: string;
  }>;
  dungNghe(): Promise<void>;
}

/**
 * ⚠️ MỌI LỆNH GỌI NATIVE PHẢI CÓ HẠN GIỜ — LỖI ĐÃ MẮC 16/8/2026.
 *
 * Màn ghi âm kẹt vĩnh viễn ở dòng "Đang xem máy bác có nghe được không…" trên
 * máy thật. Nguyên nhân gốc không quan trọng bằng bài học: cầu nối native là
 * một tiến trình KHÁC, và không có gì bảo đảm nó trả lời. Một `await` không
 * hạn giờ ở đây là một màn hình treo bên kia — không lỗi, không nhật ký, không
 * cách nào bác thoát ra ngoài việc gỡ ứng dụng.
 *
 * Hết giờ ⇒ trả về giá trị "không biết" đã định sẵn. §4.3: KHÔNG BIẾT phải nói
 * ra được, chứ không được biến thành một vòng quay bất tận.
 */
const HAN_GIO_MS = 2500;

function hanGio<T>(viec: Promise<T>, khiHetGio: T, ms = HAN_GIO_MS): Promise<T> {
  return new Promise<T>((xong) => {
    const h = setTimeout(() => xong(khiHetGio), ms);
    viec.then(
      (v) => { clearTimeout(h); xong(v); },
      () => { clearTimeout(h); xong(khiHetGio); },
    );
  });
}

/**
 * ⚠️ NHỚ LỜI HỨA, KHÔNG NHỚ CỜ.
 *
 * Bản trước đặt `daThu = true` NGAY khi vào hàm, rồi mới `await`. Lượt gọi thứ
 * hai trong lúc lượt đầu còn đang chạy sẽ thấy cờ đã bật và trả về `cau` — lúc
 * đó vẫn là `null`. Tức là màn nào gọi sớm sẽ nhận "máy không có native" một
 * cách sai, vĩnh viễn, vì cờ không bao giờ được đặt lại.
 */
let cauHua: Promise<KetCau> | null = null;

/**
 * ⚠️ "KHÔNG CÓ NATIVE" KHÁC "CẦU NỐI KHÔNG TRẢ LỜI" — §4.3 ở tầng thiết bị.
 *
 * Chạy trên trình duyệt thì ta BIẾT CHẮC không có bộ nghe trên máy, và nói câu
 * đó ra là trung thực. Cầu nối hết giờ thì ta KHÔNG BIẾT GÌ CẢ — nói "máy bác
 * không có bộ nghe" lúc đó là bịa, và bác mất đường nói dù máy nghe được.
 * Gộp hai ca này vào một `null` là đúng con bug §4.3 mô tả.
 */
type KetCau =
  | { co: true; cau: CauNoi }
  | { co: false; vi: 'khong_native' | 'het_gio' };

/**
 * Nạp plugin nếu đang chạy trong APK.
 *
 * ⚠️ Import động, và nuốt lỗi. Trình duyệt thường không có `@capacitor/core`
 * trong bundle chạy được — nhưng kể cả có thì `registerPlugin` cũng trả về một
 * proxy ném lỗi khi gọi. Nên phải thử gọi thật mới biết.
 */
function layCau(): Promise<KetCau> {
  if (!cauHua) cauHua = hanGio(doCau(), { co: false, vi: 'het_gio' }, HAN_GIO_MS * 2);
  return cauHua;
}

async function doCau(): Promise<KetCau> {
  let c: CauNoi;
  try {
    const { registerPlugin, Capacitor } = await import('@capacitor/core');
    if (!Capacitor?.isNativePlatform?.()) return { co: false, vi: 'khong_native' };
    c = registerPlugin<CauNoi>('KhoanDa');
  } catch {
    // Không nạp được `@capacitor/core` ⇒ chắc chắn không phải APK.
    return { co: false, vi: 'khong_native' };
  }
  // Gọi thử một lượt: `registerPlugin` không ném cho tới khi thật sự gọi.
  // Lượt thử này CŨNG phải có hạn giờ — nó chính là chỗ từng treo.
  const thu = await hanGio(
    c.trangThaiQuyenPopup().then(() => 'oke' as const),
    'het_gio' as const,
  );
  return thu === 'oke' ? { co: true, cau: c } : { co: false, vi: 'het_gio' };
}

/**
 * Dạng rút gọn cho các đường không cần phân biệt lý do.
 *
 * ══════════ ⚠️ VÌ SAO TRẢ VỀ MỘT CÁI HỘP, KHÔNG TRẢ THẲNG PLUGIN ══════════
 *
 * ĐO ĐƯỢC 19/8/2026 TRÊN MÁY ẢO ANDROID 14 — logcat:
 *     Error: "KhoanDa.then()" is not implemented on android
 *
 * Bản trước viết `return k.co ? k.cau : null` trong một `async function`, tức
 * trả THẲNG đối tượng plugin ra khỏi một Promise. Và đó là cái bẫy:
 *
 *  ① `registerPlugin()` của Capacitor trả về một **Proxy**, bắt MỌI truy cập
 *     thuộc tính và biến nó thành một lời gọi sang tầng native.
 *  ② JavaScript, khi resolve một Promise, kiểm tra giá trị có phải "thenable"
 *     không — bằng cách ĐỌC thuộc tính `.then`.
 *  ③ Proxy trả về một hàm cho `.then` (nó trả hàm cho mọi tên), nên JS tưởng
 *     đây là một Promise và GỌI `c.then(resolve, reject)`.
 *  ④ Tầng native không có method tên `then` ⇒ ném ⇒ Promise bị reject.
 *
 * Hệ quả: `cauHoacNull()` KHÔNG BAO GIỜ resolve được. Mọi hàm dựa vào nó —
 * popup đè màn hình, thông báo, đọc tin nhắn, nghe giọng nói — đều rơi vào
 * `catch` và trả về "không hỗ trợ".
 *
 * ⚠️ VÀ NÓ HỎNG THEO ĐÚNG KIỂU §4.3 CẢNH BÁO. Không có màn hình đỏ nào. App
 * đơn giản kết luận "máy bác không có tính năng này" — một câu KHÔNG ĐÚNG, và
 * đổ cho thiết bị đúng thứ mà mã nguồn làm hỏng. Suốt thời gian đó bản APK vẫn
 * cài được, vẫn mở được, vẫn kiểm được tin nhắn; chỉ riêng phần native thì im.
 *
 * ⚠️ ĐỪNG "DỌN GỌN" BẰNG CÁCH BỎ CÁI HỘP ĐI. Cái hộp `{ cau }` là thứ duy nhất
 * ngăn JS chạm vào `.then` của proxy. Trả thẳng plugin ra khỏi bất kỳ `async`
 * hay `.then()` nào cũng làm sống lại đúng con bug này.
 */
async function cauHoacNull(): Promise<{ cau: CauNoi } | null> {
  const k = await layCau();
  return k.co ? { cau: k.cau } : null;
}

export const laApk = async () => (await layCau()).co;

// ═══════════ Đọc thông báo tin nhắn — §15.4 ═══════════

export type QuyenNative = 'da_bat' | 'chua_bat' | 'khong_ho_tro';

export async function quyenDocThongBao(): Promise<QuyenNative> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return 'khong_ho_tro';
  return (await c.trangThaiQuyenDocThongBao()).daBat ? 'da_bat' : 'chua_bat';
}

/** Mở màn Cài đặt hệ thống. Không có API nào tự cấp quyền này, và không nên có. */
export async function xinQuyenDocThongBao(): Promise<void> {
  (await cauHoacNull())?.cau.moCaiDatDocThongBao();
}

/**
 * ⚠️ 16/8/2026 — QUYỀN GỬI THÔNG BÁO (POST_NOTIFICATIONS).
 *
 * Tách riêng quyền đọc (`quyenDocThongBao`) vì đây là hai quyền khác nhau:
 *  - Đọc  → cần để lấy nội dung tin nhắn từ app khác.
 *  - Gửi  → cần để thông báo cố định + cảnh báo có thể hiện lên thanh trên.
 *
 * Thiếu quyền GỬI thì `ThongBaoThuongTruc.bat()` không ném gì cả — nó chỉ
 * im lặng không hiện. Đó chính là dạng §4.3 tệ nhất: báo là "bật được" trong
 * khi không bật được, và bác tin rằng có một lối tắt đang chờ lúc cần.
 *
 * Trước Android 13, `POST_NOTIFICATIONS` không tồn tại — `daBat` luôn `true`,
 * không có gì để kiểm. Tránh hỏi ở đó vì Capacitor sẽ trả DENIED vĩnh viễn.
 */
export async function quyenThongBao(): Promise<QuyenNative> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return 'khong_ho_tro';
  return (await c.trangThaiQuyenThongBao()).daBat ? 'da_bat' : 'chua_bat';
}

/** Mở màn Cài đặt thông báo của app để bác tự bật. */
export async function xinQuyenThongBao(): Promise<void> {
  (await cauHoacNull())?.cau.moCaiDatThongBao();
}

/**
 * Tin nhắn mới nhất bắt được.
 *
 * ⚠️ §4.3 — TRẢ VỀ CẢ `maChuaKiem`, KHÔNG CHỈ NỘI DUNG.
 * "Đọc được một phần" ≠ "đọc rồi, không thấy gì". Ba ca hỏng có ba mã riêng, và
 * `unreadableInputFloor()` bên backend đã có sẵn nhánh cho từng mã. Nuốt chúng
 * rồi chỉ trả chuỗi rỗng là đúng con bug §4.3 mô tả.
 */
export async function tinMoiNhat(): Promise<{
  co: boolean; noiDung: string; maChuaKiem: string | null;
} | null> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return null;

  const t = await c.layTinMoiNhat();
  if (!t.co) return { co: false, noiDung: '', maChuaKiem: null };

  // `doc_duoc` là ca duy nhất KHÔNG kèm mã chưa-kiểm.
  const maChuaKiem = t.trangThai && t.trangThai !== 'doc_duoc' ? t.trangThai : null;
  return { co: true, noiDung: t.noiDung || '', maChuaKiem };
}

export async function xoaTinDaBat(): Promise<void> {
  (await cauHoacNull())?.cau.xoaTinDaBat();
}

// ═══════════ Popup đè màn hình ═══════════

export async function quyenPopup(): Promise<QuyenNative> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return 'khong_ho_tro';
  return (await c.trangThaiQuyenPopup()).daBat ? 'da_bat' : 'chua_bat';
}

export async function xinQuyenPopup(): Promise<void> {
  (await cauHoacNull())?.cau.moCaiDatPopup();
}

/**
 * Hiện dải cảnh báo đè lên app đang dùng.
 *
 * ⚠️ CHỈ HIỆN KHI MỨC LÀ `CAO`. Đè lên màn hình của người ta là việc rất xâm
 * phạm; làm thế cho một kết quả `NGHI_NGO` là dạy người dùng bỏ qua nó, rồi lần
 * CAO thật họ cũng bỏ qua nốt.
 *
 * ⚠️ BA CHUỖI ĐỀU DO CHỖ GỌI TRA CATALOG i18n rồi truyền vào. Lớp native từ chối
 * hiện nếu thiếu chuỗi nào — §11: thà không hiện còn hơn hiện câu bịa.
 * `nutOn` là lối ra của §4.6, không được bỏ.
 */
export async function hienPopupCanhBao(p: {
  nhan: Nhan; tieuDe: string; nutMo: string; nutOn: string;
}): Promise<boolean> {
  if (p.nhan !== 'CAO') return false;
  const c = (await cauHoacNull())?.cau;
  if (!c) return false;
  try {
    await c.hienPopup({ tieuDe: p.tieuDe, nutMo: p.nutMo, nutOn: p.nutOn });
    return true;
  } catch {
    return false;   // quyền bị thu hồi, hoặc ROM chặn. App vẫn phải chạy (§6.7).
  }
}

export async function anPopup(): Promise<void> {
  (await cauHoacNull())?.cau.anPopup();
}

/**
 * Heads-up notification khi mức CAO. Bấm vào mở app vào màn Dừng 60s.
 *
 * ⚠️ CHỈ HIỆN KHI MỨC LÀ `CAO`. Nghi ngờ thì heads-up cũng đè — dạy bác bỏ qua,
 * và lượt CAO thật cũng bị bỏ qua theo. Tầng gọi phải cờ chặn trước khi gọi.
 *
 * ⚠️ BA THỨ BẮT BUỘC ĐỂ TẦNG NÀY NÓI RA ĐƯỢC: ROM chặn, kênh bị hạ, quyền thu hồi.
 * Gộp ba ca thành một thì app vẫn "chạy được" nhưng bác tin rằng mình được cảnh
 * báo trong khi không — §4.3 dạng thiết bị.
 */
export async function hienCanhBaoHeadsUp(p: {
  tieuDe: string; noiDung: string;
}): Promise<boolean> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return false;
  try {
    const r = await hanGio(
      c.hienCanhBaoHeadsUp({ tieuDe: p.tieuDe, noiDung: p.noiDung }),
      { daHien: false } as { daHien: boolean },
    );
    return r.daHien;
  } catch {
    return false;
  }
}

export async function anCanhBaoHeadsUp(): Promise<void> {
  (await cauHoacNull())?.cau.anCanhBaoHeadsUp();
}

// ═══════════ Nghe giọng nói — nguồn đầu vào thứ sáu (§4.3) ═══════════

/**
 * Kết quả một lượt nghe. Hình dạng này KHỚP ĐÚNG thứ `unreadableInputFloor()`
 * bên backend chờ — đổi ở đây thì đổi cả hai đầu.
 *
 * ⚠️ `doTinCayThapNhat = -1` nghĩa là MÁY KHÔNG CHẤM ĐIỂM, không phải "điểm
 * thấp". Backend có nhánh riêng cho ca đó: thiếu số đo KHÁC đo rồi thấy tốt.
 * Đừng "làm gọn" bằng cách đổi thành 1.0 hay 0.
 */
export interface KetQuaNghe {
  vanBan: string;
  doTinCayThapNhat: number;
  ghiAmFailed: boolean;
  maLoi?: string;
}

/**
 * Máy có bộ nghe CHẠY TRÊN MÁY không? Không có ⇒ không nghe, không rơi về đám mây.
 *
 * Ba kết quả, không phải hai:
 *   `true`     — có, đo được
 *   `false`    — không có, đo được
 *   `'chua_ro'`— HỎI KHÔNG TRẢ LỜI (hết giờ, hoặc không có native)
 *
 * ⚠️ ĐỪNG GỘP `'chua_ro'` VÀO `false`. Đó đúng là §4.3 ở tầng thiết bị: "không
 * đo được" khác "đo rồi, không có". Gộp lại thì màn ghi âm sẽ khẳng định chắc
 * nịch "máy bác không có bộ nghe" trong khi thật ra chỉ là cầu nối chậm — và
 * bác mất luôn đường nói, dù máy hoàn toàn nghe được.
 */
export type CoBoNghe = boolean | 'chua_ro';

export async function coBoNghe(): Promise<CoBoNghe> {
  const k = await layCau();
  // Trình duyệt / PWA: BIẾT CHẮC không có bộ nghe trên máy. Nói ra được.
  if (k.co !== true) return k.vi === 'khong_native' ? false : 'chua_ro';
  return hanGio(
    k.cau.trangThaiBoNghe().then((r) => r.daCo as CoBoNghe),
    'chua_ro' as CoBoNghe,
  );
}

/**
 * Nghe một lượt.
 *
 * ⚠️ §6.9 · §12 — GIỌNG KHÔNG RỜI KHỎI MÁY. Lớp native chỉ dùng
 * `createOnDeviceSpeechRecognizer`; máy không có bộ nghe thì TỪ CHỐI chứ không
 * rơi về bản đám mây. Đừng thêm đường dự phòng nào gửi tiếng ra ngoài.
 *
 * ⚠️ HỎNG THÌ TRẢ VỀ KẾT QUẢ HỎNG, KHÔNG NÉM LỖI. Tầng trên phải khai được ca
 * hỏng vào `chuaKiem` — nuốt lỗi rồi trả chuỗi rỗng là đúng con bug §4.3.
 */
/**
 * ⚠️ NÚT "DỪNG" KHÔNG ĐƯỢC PHỤ THUỘC VÀO VIỆC NATIVE CÓ TRẢ LỜI HAY KHÔNG.
 *
 * ĐO ĐƯỢC 16/8/2026 — người dùng báo LƯỢT THỨ BA: "ấn vào ghi âm rồi mà nó cứ
 * hiện cháu đang nghe, ấn dừng thì chả dừng được".
 *
 * Hai bản vá trước đều sửa ở TẦNG NATIVE: bản một gọi thêm `stopListening()`,
 * bản hai tự tay resolve lượt đang treo trong `KhoanDaPlugin.dungNghe`. Cả hai
 * đều đúng, và cả hai đều CÙNG MỘT ĐIỂM YẾU: giao diện chỉ rời khỏi màn "Cháu
 * đang nghe…" khi lời hứa `batDauNghe` được giải. Bất cứ thứ gì chặn đường đó —
 * `stopListening()` ném lỗi trong runnable UI (nuốt luôn phần resolve phía sau),
 * `SpeechRecognizer` chết mà không gọi `onError`, ROM chặn, cầu nối kẹt — đều
 * biến một cú chạm thành 45 giây đứng hình. Người dùng không chờ 45 giây; họ bấm
 * lại vài lần rồi thoát app, và với họ tính năng này là hỏng.
 *
 * Nên lượt nghe nay được CHỐT Ở TẦNG WEB. Native trả về thì dùng kết quả của
 * native (có phần chữ đã nghe được — tốt hơn). Native im lặng thì sau một khoảng
 * ân hạn ngắn, chính tầng này chốt lượt và khai `BI_CAT`.
 *
 * §4.3 — chốt bằng `BI_CAT`/`KHONG_CO_TIENG_NOI` chứ KHÔNG phải một kết quả
 * rỗng trông như "nghe rồi, không có gì". Bác dừng giữa chừng thì lượt đó CHƯA
 * HOÀN CHỈNH, và bộ luật phải biết điều đó.
 */
let chotLuotNghe: ((k: KetQuaNghe) => void) | null = null;

const NGHE_HONG = (maLoi: string): KetQuaNghe =>
  ({ vanBan: '', doTinCayThapNhat: -1, ghiAmFailed: true, maLoi });

/** Ân hạn cho native trả về kèm phần chữ đã nghe, trước khi tầng web tự chốt. */
const AN_HAN_DUNG_MS = 900;

/** Lưới cuối: bộ nghe chết mà không gọi `onError` thì lượt vẫn phải kết thúc. */
const TRAN_NGHE_MS = 45_000;

export async function ngheGiongNoi(ngonNgu = 'vi-VN'): Promise<KetQuaNghe> {
  const c = (await cauHoacNull())?.cau;
  if (!c) {
    return NGHE_HONG('CHUA_TAI_MODEL');
  }

  // Lượt cũ còn treo (bác bấm "Nói lại" khi lượt trước chưa chốt) ⇒ đóng nó
  // trước. Hai lượt cùng sống thì kết quả lượt cũ sẽ ghi đè lượt mới.
  chotLuotNghe?.(NGHE_HONG('BI_CAT'));

  return new Promise<KetQuaNghe>((traVe) => {
    let daChot = false;
    const chot = (k: KetQuaNghe) => {
      if (daChot) return;
      daChot = true;
      clearTimeout(luoiCuoi);
      if (chotLuotNghe === chot) chotLuotNghe = null;
      traVe(k);
    };
    /*
     * ⚠️ TRẦN 45 GIÂY. Nghe lâu là bình thường — bác kể một tình huống có thể
     * mất nửa phút. Nhưng KHÔNG có trần thì bộ nghe chết giữa chừng (không gọi
     * `onError`, đã xảy ra trên vài ROM) là màn hình đứng ở "Cháu đang nghe…"
     * vĩnh viễn. Hết trần ⇒ khai là hỏng, KHÔNG khai là "nghe rồi, không có gì".
     */
    const luoiCuoi = setTimeout(() => chot(NGHE_HONG('BI_CAT')), TRAN_NGHE_MS);
    chotLuotNghe = chot;

    c.batDauNghe({ ngonNgu }).then(
      (r) => chot(r),
      (e) => {
        // Người dùng từ chối quyền micro, hoặc bộ nghe chết giữa chừng.
        const ma = (e as { message?: string })?.message;
        // `CHUA_CHO_QUYEN_MICRO` không nằm trong MA_LOI_GHI_AM ⇒ backend rơi về
        // `khong_nghe_duoc_ghi_am`. Vẫn nói ra, không im lặng.
        chot({
          vanBan: '',
          doTinCayThapNhat: -1,
          ghiAmFailed: true,
          maLoi: ma && /^[A-Z_]+$/.test(ma) ? ma : undefined,
        });
      },
    );
  });
}

/**
 * Dừng lượt nghe đang chạy.
 *
 * ⚠️ HÀM NÀY LUÔN KẾT THÚC LƯỢT, kể cả khi native không trả lời gì. Xem chú
 * thích của `chotLuotNghe` ở trên để biết vì sao đó là điều kiện bắt buộc chứ
 * không phải phòng xa.
 */
export async function dungNghe(): Promise<void> {
  const chot = chotLuotNghe;

  // Hẹn giờ tự chốt ĐẶT TRƯỚC lượt gọi native — `cauHoacNull()` cũng có thể là
  // chỗ kẹt (cầu nối chưa dựng xong), và đặt sau nó là để nút Dừng lại phụ thuộc
  // vào đúng thứ nó phải độc lập.
  if (chot) setTimeout(() => chot(NGHE_HONG('BI_CAT')), AN_HAN_DUNG_MS);

  try {
    const c = (await cauHoacNull())?.cau;
    // Vẫn bảo native dừng: nó tắt micro (§6.9 — đừng giữ micro mở) và trả về
    // phần chữ đã nghe được. Về kịp trong ân hạn thì kết quả của nó thắng.
    await c?.dungNghe();
  } catch {
    // ROM chặn, quyền bị thu hồi, cầu nối chết — lượt vẫn đã được chốt ở trên.
  }
}

// ═══════════ Nhận chia sẻ · lối tắt · kênh thông báo ═══════════

/**
 * Nội dung bác chia sẻ vào Khoan Đã từ app khác, hoặc lối tắt vừa bấm.
 *
 * ⚠️ ANDROID KHÔNG CHO APP TỰ CHỤP MÀN HÌNH CỦA APP KHÁC, và đó là điều đúng.
 * `MediaProjection` làm được nhưng đòi xác nhận mỗi lần và hiện biểu tượng ghi
 * màn hình — dùng nó để "âm thầm theo dõi màn hình người già" vừa bất khả thi
 * vừa sai, và Play Store sẽ từ chối.
 *
 * Đường đúng: bác tự chụp màn hình rồi bấm Chia sẻ → Khoan Đã. Đây cũng là cách
 * duy nhất lấy được nội dung đầy đủ từ Zalo, Messenger, app ngân hàng — những
 * chỗ mà đọc thông báo chỉ thấy một dòng tóm tắt.
 */
export interface NoiDungChiaSe {
  co: boolean;
  vanBan?: string;
  /** data URI. Backend `/api/analyze` nhận đúng hình dạng này ở trường `anh`. */
  anh?: string;
  /** `dang-bi-goi` · `kiem-tin-nhan` · `goi-nguoi-than` */
  loiTat?: string;
  /** §4.3 — `ANH_QUA_LON` · `KHONG_DOC_DUOC_ANH`. Hỏng thì NÓI, không im. */
  maLoi?: string;
}

export async function noiDungChiaSe(): Promise<NoiDungChiaSe> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return { co: false };
  return hanGio(
    (c as unknown as { layNoiDungChiaSe(): Promise<NoiDungChiaSe> }).layNoiDungChiaSe(),
    { co: false },
  );
}

/**
 * Dựng kênh thông báo cảnh báo và ĐO LẠI mức thật của nó.
 *
 * ⚠️ `dungMuc: false` PHẢI ĐƯỢC NÓI RA CHO NGƯỜI DÙNG (§4.3).
 * Kênh thông báo trên Android KHÔNG sửa được sau khi tạo, và người dùng có thể
 * đã tự hạ mức trong Cài đặt. App không nâng lại được. Im lặng lúc đó là để bác
 * tin rằng mình sẽ được cảnh báo kịp, trong khi thông báo sẽ nằm im dưới đáy.
 */
export async function dungKenhCanhBao(): Promise<{ dungMuc: boolean; mucThat: number } | null> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return null;
  return hanGio(
    (c as unknown as { dungKenhCanhBao(): Promise<{ dungMuc: boolean; mucThat: number }> })
      .dungKenhCanhBao(),
    null as unknown as { dungMuc: boolean; mucThat: number },
  );
}

/**
 * Mở màn Cài đặt nhập liệu bằng giọng nói của Android.
 *
 * ⚠️ APP KHÔNG TỰ TẢI ĐƯỢC GÓI TIẾNG VIỆT NGOẠI TUYẾN — Android không có API
 * nào cho phép. §6.9 và §12 buộc giọng nói không rời khỏi máy, nên bộ nghe
 * phải là bộ chạy trên máy, và máy chưa có gói thì chịu.
 *
 * Thứ duy nhất làm được là đưa bác tới đúng chỗ để tự tải. Nói "máy bác chưa
 * có bộ nghe" rồi dừng lại là bỏ bác giữa đường.
 */
export async function moCaiDatGiongNoi(): Promise<boolean> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return false;
  try {
    await (c as unknown as { moCaiDatGiongNoi(): Promise<void> }).moCaiDatGiongNoi();
    return true;
  } catch {
    return false;   // ROM không có màn đó — §6.7, app vẫn chạy.
  }
}

// ═══════════ Thông báo thường trực ═══════════

const KEY_TT = 'khoanda.thongBaoThuongTruc';

/** Người dùng đã bật chưa (lưu trên máy — §12: mặc định TẮT). */
export const dangBatThongBaoThuongTruc = () => localStorage.getItem(KEY_TT) === '1';

/**
 * Bật/tắt dòng thông báo thường trực.
 *
 * ⚠️ TRẢ VỀ TRẠNG THÁI THẬT, KHÔNG PHẢI THỨ VỪA YÊU CẦU.
 * Android 13+ đòi quyền `POST_NOTIFICATIONS`. Chưa có quyền thì gửi thất bại,
 * và công tắc PHẢI ở lại vị trí cũ — tự bật rồi im lặng là để bác tin rằng có
 * một lối tắt đang chờ sẵn, trong khi không có gì cả (§4.3).
 */
/**
 * TRẠNG THÁI THẬT CỦA LỐI TẮT THƯỜNG TRỰC.
 *
 * ⚠️ ĐỌC CÁI NÀY, ĐỪNG ĐỌC localStorage — LỖI ĐO ĐƯỢC 19/8/2026.
 *
 * `dangBatThongBaoThuongTruc()` ngay dưới chỉ đọc localStorage, và localStorage
 * không biết gì về những chuyện xảy ra bên ngoài WebView: máy khởi động lại
 * (Android xoá sạch thông báo), app được cập nhật, người dùng tắt thông báo
 * trong Cài đặt hệ thống, ROM chặn ở tầng riêng của hãng.
 *
 * Sau mỗi ca đó, localStorage vẫn ghi `'1'` và công tắc vẫn xanh — trong khi
 * trên thanh thông báo không còn gì. Bác tin có một lối tắt chờ sẵn cho lúc bị
 * gọi thúc, và lúc cần thì không có. §4.3, ở đúng chỗ nguy hiểm nhất.
 *
 * `null` = không phải APK, hoặc cầu nối không trả lời. KHÔNG BIẾT thì nói không
 * biết, đừng bịa ra `false` — bản web không có tính năng này, mà "không có" và
 * "có nhưng đang tắt" là hai câu khác nhau.
 */
export async function trangThaiThuongTruc(): Promise<{
  daChon: boolean; dangHien: boolean;
} | null> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return null;
  try {
    return await hanGio(
      c.trangThaiThongBaoThuongTruc(),
      null as unknown as { daChon: boolean; dangHien: boolean },
    );
  } catch {
    return null;
  }
}

// ═══════════ Trạng thái máy — nguồn đầu vào thứ tư (§4.3) ═══════════

/** Một ứng dụng đang có thể xem và bấm thay người dùng. */
export interface UngDungXemVaBam {
  /** Tên hiển thị — CHỈ dùng trong máy, không gửi đi đâu (§6.9). */
  ten: string;
  goi: string;
  nguonCai: 'cai_san' | 'ch_play' | 'tu_tep' | 'khong_ro';
  /** Mốc thời gian cài (ms). 0 = không đọc được. */
  ngayCai: number;
  /** Cài trong 7 ngày qua — dấu hiệu mạnh hơn hẳn (§4.2: chỉ bật cờ). */
  vuaCai: boolean;
}

export interface TrangThaiMay {
  /**
   * ⚠️ `false` KHÔNG PHẢI "MÁY SẠCH". Nó là "chưa xem được".
   * Tầng gọi PHẢI đẩy `chua_xem_duoc_trang_thai_may` vào `chuaKiem` (§4.3).
   */
  docDuoc: boolean;
  /** Chỉ những ứng dụng ĐÁNG NÓI: không phải app cài sẵn của máy. */
  dangNgo: UngDungXemVaBam[];
  /** Tổng số dịch vụ trợ năng đang bật, kể cả app hệ thống. */
  tongSo: number;
}

const BAY_NGAY = 7 * 24 * 60 * 60 * 1000;

/**
 * ĐỌC TRẠNG THÁI MÁY.
 *
 * ⚠️ LỌC APP CÀI SẴN RA KHỎI `dangNgo` — VÀ ĐÂY LÀ PHẦN DỄ GÂY HẠI NHẤT.
 *
 * TalkBack là mắt của người khiếm thị. Bàn phím nào cũng cần đúng quyền này.
 * Nếu app đem chúng ra kể như một mối nguy, bác sẽ tắt đúng thứ mình cần —
 * và đó là một tác hại thật do app này gây ra, không phải do kẻ lừa đảo.
 *
 * Nên chỉ app KHÔNG cài sẵn và KHÔNG từ CH Play mới được nêu tên. `khong_ro`
 * cũng vào danh sách: không đọc được nguồn cài thì nói ra, đừng cho qua (§4.3).
 *
 * `null` = không phải APK. Bản web không có cách nào biết, và cũng không nên có.
 */
export async function trangThaiMay(): Promise<TrangThaiMay | null> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return null;
  try {
    const r = await hanGio(
      c.trangThaiMay(),
      { docDuoc: false, dichVuTroNang: [] },
    );
    const tat = r.dichVuTroNang ?? [];
    const bayGio = Date.now();
    return {
      docDuoc: r.docDuoc === true,
      tongSo: tat.length,
      dangNgo: tat
        .filter((m) => m.nguonCai !== 'cai_san' && m.nguonCai !== 'ch_play')
        .map((m) => ({
          ten: m.ten || m.goi,
          goi: m.goi,
          nguonCai: (m.nguonCai as UngDungXemVaBam['nguonCai']) ?? 'khong_ro',
          ngayCai: m.ngayCai ?? 0,
          vuaCai: m.ngayCai > 0 && bayGio - m.ngayCai < BAY_NGAY,
        })),
    };
  } catch {
    // Ném ⇒ chưa xem được. KHÔNG trả về danh sách rỗng với `docDuoc: true`.
    return { docDuoc: false, dangNgo: [], tongSo: 0 };
  }
}

/**
 * PHẦN DUY NHẤT ĐƯỢC PHÉP RỜI KHỎI MÁY.
 *
 * ⚠️ KHÔNG CÓ TÊN ỨNG DỤNG NÀO Ở ĐÂY, VÀ ĐÓ LÀ CHỦ Ý.
 *
 * Danh sách ứng dụng đã cài là một trong những dấu vân tay mạnh nhất của một
 * người: nó lộ ngân hàng bác dùng, tôn giáo, bệnh, xu hướng chính trị. Gửi nó
 * lên máy chủ để "phân tích cho chính xác hơn" là đánh đổi mà bác không hề được
 * hỏi — và §6.9 không cho đánh đổi đó.
 *
 * Bộ luật chỉ cần biết CÓ HAY KHÔNG và MỚI CÀI HAY CHƯA. Ba con số dưới đây đủ
 * để ra quyết định, và không con số nào chỉ về một người cụ thể.
 */
export function tomTatChoMayChu(t: TrangThaiMay | null): {
  docDuoc: boolean; soUngDungLa: number; coCaiTrongTuan: boolean;
} | undefined {
  if (!t) return undefined;   // bản web — không gửi trường này đi
  return {
    docDuoc: t.docDuoc,
    soUngDungLa: t.dangNgo.length,
    coCaiTrongTuan: t.dangNgo.some((m) => m.vuaCai),
  };
}

// ═══════════ Nhắc cuộc gọi dài ═══════════

/**
 * NẠP CHỮ CHO LỜI NHẮC — phải gọi TRƯỚC khi bật, và mỗi lần đổi ngôn ngữ.
 *
 * ⚠️ §11 — SERVICE CHẠY KHI APP ĐÃ ĐÓNG, nên lúc cần hiện lời nhắc thì không
 * còn tầng web nào để hỏi chữ. Chữ nằm sẵn trong SharedPreferences, đã qua
 * catalog i18n. Thiếu chữ ⇒ lớp native KHÔNG hiện gì.
 */
export async function napChuCuocGoi(o: {
  tieuDe: string; noiDung: string; nutMo: string; nutOn: string; phut?: number;
}): Promise<void> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return;
  try {
    await hanGio(c.napChuCuocGoi(o), undefined as unknown as void);
  } catch {
    // Không nạp được thì tính năng im lặng không hiện — đúng hơn là hiện bậy.
  }
}

/**
 * ⚠️ TRẢ VỀ CẢ `coQuyen`, KHÔNG CHỈ `dangBat`.
 * "Chưa bật bao giờ" và "đã bật nhưng máy vừa rút quyền" là hai câu khác nhau,
 * và giao diện phải nói được câu thứ hai chứ không lặng lẽ gạt công tắc về tắt.
 */
export async function trangThaiTheoDoiCuocGoi(): Promise<{
  coQuyen: boolean; dangBat: boolean;
} | null> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return null;
  try {
    return await hanGio(c.trangThaiTheoDoiCuocGoi(), null as unknown as {
      coQuyen: boolean; dangBat: boolean;
    });
  } catch {
    return null;
  }
}

export async function datTheoDoiCuocGoi(bat: boolean): Promise<{
  dangBat: boolean; maLoi?: string;
}> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return { dangBat: false, maLoi: 'KHONG_PHAI_APK' };
  try {
    return await hanGio(c.datTheoDoiCuocGoi({ bat }), { dangBat: false, maLoi: 'HET_GIO' });
  } catch {
    return { dangBat: false, maLoi: 'KHONG_BAT_DUOC' };
  }
}

/** Mở màn Cài đặt trợ năng của hệ điều hành. */
export async function moCaiDatTroNang(): Promise<void> {
  (await cauHoacNull())?.cau.moCaiDatTroNang();
}

export async function datThongBaoThuongTruc(bat: boolean): Promise<{
  dangBat: boolean; maLoi?: string;
}> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return { dangBat: false, maLoi: 'KHONG_HO_TRO' };
  try {
    const r = await hanGio(
      (c as unknown as { datThongBaoThuongTruc(o: { bat: boolean }): Promise<{ dangBat: boolean; maLoi?: string }> })
        .datThongBaoThuongTruc({ bat }),
      { dangBat: false, maLoi: 'HET_GIO' },
    );
    // Chỉ ghi nhớ khi máy chủ thật sự làm được.
    if (r.dangBat) localStorage.setItem(KEY_TT, '1');
    else localStorage.removeItem(KEY_TT);
    return r;
  } catch {
    return { dangBat: false, maLoi: 'KHONG_HO_TRO' };
  }
}

/**
 * VÌ SAO MÁY NÀY KHÔNG NGHE ĐƯỢC — LẤY LÝ DO CỤ THỂ.
 *
 * ⚠️ NGƯỜI DÙNG BÁO "GHI ÂM KHÔNG HOẠT ĐỘNG" BA LƯỢT LIÊN TIẾP, và không lượt
 * nào ta biết được VÌ SAO — màn chỉ hiện một câu chung chung. Ba nguyên nhân
 * hoàn toàn khác nhau, cần ba cách xử lý khác nhau, cùng dồn vào một câu:
 *
 *   ANDROID_QUA_CU  — máy dưới Android 13. Không sửa được, phải gõ chữ.
 *   MAY_CHUA_CAI    — máy chưa tải gói nghe ngoại tuyến. SỬA ĐƯỢC: mở Cài đặt.
 *   KHONG_HO_TRO    — đang chạy trên trình duyệt, không phải bản cài.
 *
 * Đây là §4.3 ở tầng chẩn đoán: gộp nhiều ca "không làm được" thành một thông
 * báo thì mất luôn thông tin cần để sửa, và mất luôn lối đi tiếp cho bác.
 */
export interface TinhTrangNghe {
  ngheDuoc: boolean;
  lyDo: 'CO' | 'ANDROID_QUA_CU' | 'MAY_CHUA_CAI' | 'KHONG_HO_TRO' | 'CHUA_RO';
  sdk?: number;
}

export async function tinhTrangNghe(): Promise<TinhTrangNghe> {
  const k = await layCau();
  if (k.co !== true) {
    return { ngheDuoc: false, lyDo: k.vi === 'khong_native' ? 'KHONG_HO_TRO' : 'CHUA_RO' };
  }
  const r = await hanGio(
    k.cau.trangThaiBoNghe().then((x) => ({
      ngheDuoc: x.daCo,
      lyDo: (x.lyDo ?? (x.daCo ? 'CO' : 'MAY_CHUA_CAI')) as TinhTrangNghe['lyDo'],
      sdk: x.sdk,
    })),
    { ngheDuoc: false, lyDo: 'CHUA_RO' } as TinhTrangNghe,
  );
  return r;
}



/*
 * ═════ ĐỌC TO — TRÊN APK DÙNG BỘ ĐỌC CỦA MÁY ═════
 *
 * `window.speechSynthesis` chạy trên Chrome nhưng KHÔNG chạy trong WebView của
 * Android — và nó hỏng IM LẶNG: ở vài bản WebView, `'speechSynthesis' in window`
 * vẫn true và `speak()` vẫn trả về bình thường, chỉ là không ai nghe thấy gì.
 * Người dùng báo 20/8/2026: "ấn cái read aloud thì nó chưa hoạt động ở app".
 *
 * ⚠️ ĐÂY LÀ TÍNH NĂNG TIẾP CẬN. Với người mắt kém hoặc đang hoảng không
 * đọc nổi chữ, đây là đường duy nhất để biết kết quả.
 *
 * Trả về `false` khi không đọc được, kèm mã lý do — để tầng giao diện nói
 * ra thay vì để bác ngồi chờ một giọng nói không bao giờ tới (§4.3).
 */
export async function docTo(chu: string, ngonNgu = 'vi-VN'): Promise<{ ok: boolean; ma?: string }> {
  const c = (await cauHoacNull())?.cau;
  if (!c) {
    // Không phải APK ⇒ dùng bộ đọc của trình duyệt, nơi nó thực sự chạy.
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return { ok: false, ma: 'MAY_KHONG_CO_BO_DOC' };
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(chu);
      u.lang = ngonNgu;
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
      return { ok: true };
    } catch { return { ok: false, ma: 'DOC_HONG' }; }
  }
  try {
    await c.docTo({ chu, ngonNgu });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, ma: String(e?.message || e?.code || 'DOC_HONG') };
  }
}

export async function dungDocTo(): Promise<void> {
  const c = (await cauHoacNull())?.cau;
  if (!c) { try { window.speechSynthesis?.cancel(); } catch { /* không sao */ } return; }
  try { await c.dungDocTo(); } catch { /* đã dừng rồi */ }
}


/**
 * Đẩy app xuống nền — xem chú thích ở `dayAppXuong` bên Java.
 * Dùng sau khi bắn dải cảnh báo thử, để bác thấy nó nằm NGOÀI app thật.
 * Ở bản web thì không làm gì — trình duyệt không tự thu nhỏ được.
 */
export async function dayAppXuong(): Promise<void> {
  const c = (await cauHoacNull())?.cau;
  if (!c) return;
  try { await c.dayAppXuong(); } catch { /* ROM chặn thì thôi */ }
}
