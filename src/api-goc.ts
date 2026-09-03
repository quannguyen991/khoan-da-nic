/**
 * GỐC CỦA MỌI LƯỢT GỌI API.
 *
 * ⚠️ ĐƯỜNG DẪN TƯƠNG ĐỐI CHẾT TRONG APK, VÀ CHẾT IM LẶNG.
 *
 * Bản web chạy cùng origin với máy chủ nên `fetch('/api/analyze')` là đúng.
 * Nhưng trong APK, Capacitor phục vụ giao diện ở `https://localhost` — một
 * origin CHỈ CÓ TỆP TĨNH. `/api/analyze` ở đó trỏ vào hư không, và mọi lượt
 * kiểm đều lỗi mạng.
 *
 * Kiểu hỏng này không có chỗ nào báo: bản dựng vẫn xanh, app vẫn mở, chỉ là
 * bấm kiểm thì luôn ra "chưa gửi đi kiểm được". Nhìn từ máy chủ thì im lặng
 * hoàn toàn — vì chưa từng có lượt gọi nào tới.
 *
 * ⚠️ PHẢI LÀ `https://`. `androidScheme` của Capacitor đặt là https, nên gọi
 * sang một địa chỉ `http://` bị WebView chặn vì nội dung hỗn hợp — cũng im lặng.
 *
 * Đặt lúc dựng:  VITE_API_GOC=https://khoan-da.onrender.com npm run build
 * Bỏ trống ⇒ đường dẫn tương đối, đúng cho bản web.
 */
const GOC: string = ((import.meta as any).env?.VITE_API_GOC ?? '').replace(/\/+$/, '');

/** `api('/api/analyze')` → cùng origin ở bản web, sang máy chủ thật ở bản APK. */
export function api(duong: string): string {
  if (!GOC) return duong;
  return `${GOC}${duong.startsWith('/') ? duong : `/${duong}`}`;
}

/**
 * ⚠️ CÓ ĐANG TRỎ RA MỘT MÁY CHỦ KHÁC KHÔNG.
 * Dùng để giao diện nói thật khi bản APK chưa được cấu hình máy chủ — thà nói
 * ra còn hơn để bác bấm kiểm rồi nhận lỗi mạng không hiểu vì sao (§4.3).
 */
export const CO_MAY_CHU_RIENG = GOC !== '';
export const MAY_CHU_GOC = GOC;
