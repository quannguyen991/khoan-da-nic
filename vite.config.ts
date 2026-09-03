import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import fs from 'fs';

/**
 * MỘT BẢN `ma-hop-dong.json`, HAI ĐƯỜNG DÙNG.
 *
 * Danh sách mã của §HĐ được dùng ở hai chỗ và cả hai đều cần:
 *  · `src/components/HoiNhanh.tsx` import lúc dựng — màn hỏi nhanh phải hiện
 *    tức thì, không chờ một lượt `fetch` nào;
 *  · service worker đệm `/config/ma-hop-dong.json` để màn đó chạy khi mất mạng.
 *
 * ⚠️ ĐỪNG GIẢI BẰNG CÁCH ĐỂ HAI BẢN. Hai bản sẽ phân kỳ, và khi lệch thì
 * `locTraLoiBoHoiNhanh()` ở máy chủ BỎ IM LẶNG câu trả lời — không lỗi, không
 * cảnh báo, chỉ là một lượt bị chấm hụt.
 *
 * Nên bản gốc nằm ở `src/config/`, còn plugin này phát nó ra đúng URL mà service
 * worker chờ. Để tệp trong `public/` rồi import từ JavaScript thì Vite cảnh báo
 * đúng — nó là hai vai trò chồng lên một chỗ.
 */
const NOI_HOP_DONG = 'config/ma-hop-dong.json';

function phatHopDong() {
  const doc = () => fs.readFileSync(path.resolve(__dirname, 'src', NOI_HOP_DONG), 'utf8');
  return {
    name: 'khoan-da-phat-hop-dong',
    configureServer(may: any) {
      may.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.split('?')[0] !== `/${NOI_HOP_DONG}`) return next();
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(doc());
      });
    },
    generateBundle(this: any) {
      this.emitFile({ type: 'asset', fileName: NOI_HOP_DONG, source: doc() });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), phatHopDong()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      /**
       * TÁCH GÓI — VÌ NGƯỜI DÙNG CỦA APP NÀY DÙNG 3G GÓI RẺ.
       *
       * Một tệp 696 KB là toàn bộ app phải tải lại mỗi lần sửa một dòng chữ.
       * Tách ba thư viện ít đổi ra riêng thì lần cập nhật sau trình duyệt chỉ
       * tải phần mã của mình; ba gói kia lấy từ bộ nhớ đệm.
       *
       * ⚠️ CHỈ TÁCH THEO THƯ VIỆN, KHÔNG TÁCH ĐƯỜNG PHÂN TÍCH.
       * Màn hỏi nhanh, màn kết quả và bộ luật hiển thị phải nằm trong gói chính:
       * chúng là thứ bác mở lúc đang bị gọi, và một gói tải trễ có thể không về
       * kịp — hoặc không về, nếu sóng tậm tịt. §6.7: giao diện không bao giờ
       * được trắng vì một tệp không tải được.
       */
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
            motion: ['motion/react'],
            icon: ['lucide-react'],
          },
        },
      },
      // Ngưỡng cảnh báo: sau khi tách, gói nào còn vượt 400 KB là đáng xem lại.
      chunkSizeWarningLimit: 400,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
