import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

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
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.warn('[sw] không đăng ký được:', e?.message);
    });
  });
}
