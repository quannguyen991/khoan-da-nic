import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {dungKhungDienThoai} from './khung-dien-thoai.ts';
import './index.css';

/**
 * KHUNG ĐIỆN THOẠI PHẢI QUYẾT ĐỊNH TRƯỚC KHI GẮN REACT.
 *
 * Trên màn hình rộng, trang ngoài chỉ là cái vỏ máy chứa một <iframe>; app
 * thật chạy bên trong iframe đó với viewport 390px. Gắn React vào cả hai chỗ
 * nghĩa là chạy hai bản app cùng lúc: hai service worker, hai bộ localStorage
 * ghi đè nhau, hai lần gọi `/api/analyze` cho một tin nhắn.
 *
 * `dungKhungDienThoai()` trả `true` khi nó đã thay nội dung trang bằng cái vỏ —
 * lúc đó `#root` không còn tồn tại nữa, nên đây không phải "tối ưu", mà là
 * điều kiện để dòng dưới không ném lỗi.
 */
if (!dungKhungDienThoai()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

/**
 * SERVICE WORKER — vỏ ứng dụng để app còn mở được khi mất mạng.
 *
 * ⚠️ §4.4 — `vung-cham-san.css` nằm trong `APP_SHELL` của `public/sw.js`:
 * "sàn tiếp cận không được phụ thuộc vào việc có mạng". Mất mạng mà vùng chạm
 * tụt dưới 52px là bác bấm trượt đúng lúc cần bấm nhất.
 *
 * ⚠️ §4.3 — service worker KHÔNG đệm `/api/*`. Một kết quả cũ hiện lại cho một
 * tin nhắn mới là lời trấn an bịa.
 *
 * ⚠️ ĐĂNG KÝ HỎNG THÌ GHI LOG, ĐỪNG NUỐT IM LẶNG. Đo 16/8/2026 ở dự án gốc:
 * `An unknown error occurred when fetching the script` xuất hiện trong khi
 * `fetch('/sw.js')` vẫn trả 200 — nguyên nhân là môi trường trình duyệt chặn
 * đăng ký (trình duyệt trong ứng dụng, ẩn danh, hoặc cờ tắt SW), KHÔNG phải CSP.
 * Cách tách bạch nhanh: nạp một service worker rỗng — rỗng mà cũng hỏng thì lỗi
 * không nằm ở mã của bạn.
 */
if ('serviceWorker' in navigator && document.getElementById('root')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.warn('[sw] không đăng ký được:', e?.message);
    });
  });
}
