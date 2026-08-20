import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import browserslist from 'browserslist';
import {browserslistToTargets} from 'lightningcss';

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
  /**
   * ══════ MÀU PHẢI DỰNG CHO WEBVIEW CŨ, KHÔNG CHỈ CHO CHROME MỚI ══════
   *
   * ⚠️ TRIỆU CHỨNG: mở bản APK, sang màn Tìm kiếm hoặc bấm một popup thì TRẮNG
   * TINH — trắng cả thanh điều hướng tím. Trên trình duyệt máy tính không bao
   * giờ thấy, nên rất dễ tưởng là lỗi riêng của màn đó.
   *
   * NGUYÊN NHÂN: Tailwind v4 sinh màu bằng `oklch()` và trộn gradient bằng
   * `color-mix()`. Đo trên gói đã dựng 20/8/2026: 119 lần `oklch(`, 264 lần
   * `color-mix(`. Hai hàm này cần Chrome/WebView **111 trở lên**. WebView cũ hơn
   * coi cả khai báo là KHÔNG HỢP LỆ rồi VỨT ĐI — nền rơi về trong suốt, tức
   * trắng. Không lỗi, không cảnh báo, chỉ mất màu.
   *
   * Vì sao chỉ MỘT SỐ màn trắng: màu viết thẳng dạng hex (`bg-[#f8f4ff]`) dịch
   * ra hex nên vẫn sống; màu theo bảng của Tailwind (`purple-600`, `slate-50`)
   * mới dịch ra `oklch()`.
   *
   * ⚠️ `build.cssTarget` KHÔNG SỬA ĐƯỢC CHUYỆN NÀY — đã thử 20/8/2026 và số
   * `oklch(` không đổi. Nó chỉ điều khiển bộ nén của esbuild, mà esbuild không
   * chuyển đổi hàm màu. Phải dùng Lightning CSS.
   *
   * ⚠️ ĐỪNG NÂNG MỐC `chrome >= 87` LÊN CHO "GỌN". Người dùng của app là người
   * cao tuổi, và điện thoại của họ thường là máy cũ ba bốn năm — đúng nhóm có
   * WebView không được cập nhật.
   */
  const dichMau = browserslistToTargets(
    browserslist('chrome >= 87, android >= 87, ios_saf >= 13, firefox >= 78'),
  );

  return {
    plugins: [react(), tailwindcss(), phatHopDong()],
    css: {
      transformer: 'lightningcss' as const,
      lightningcss: {targets: dichMau},
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      cssMinify: 'lightningcss' as const,
      /*
       * ⚠️ MỐC DỰNG JAVASCRIPT CŨNG PHẢI HẠ THEO, KHÔNG CHỈ CSS.
       * Vite 6 mặc định nhắm `baseline-widely-available` (~Chrome 107). Máy của
       * người cao tuổi thường là máy cũ ba bốn năm với WebView không được cập
       * nhật; cú pháp mới hơn thì gói KHÔNG PHÂN TÍCH ĐƯỢC, và một gói nạp động
       * hỏng sẽ hiện ra đúng một khoảng trắng.
       */
      target: ['es2019', 'chrome87', 'safari14'],
      /**
       * ══════ MÀU PHẢI DỰNG CHO WEBVIEW CŨ, KHÔNG CHỈ CHO CHROME MỚI ══════
       *
       * ⚠️ TRIỆU CHỨNG: mở bản APK, sang màn Tìm kiếm hoặc bấm một popup thì
       * TRẮNG TINH — trắng cả thanh điều hướng tím. Trên trình duyệt máy tính
       * thì không bao giờ thấy, nên rất dễ tưởng là lỗi của riêng màn đó.
       *
       * NGUYÊN NHÂN: Tailwind v4 sinh màu bằng `oklch()` và trộn gradient bằng
       * `color-mix()`. Đo trên gói đã dựng 20/8/2026: 119 lần `oklch(`, 264 lần
       * `color-mix(`. Hai hàm này cần Chrome/WebView **111 trở lên**. WebView cũ
       * hơn coi cả khai báo là KHÔNG HỢP LỆ và VỨT ĐI — nền rơi về trong suốt,
       * tức trắng. Không lỗi, không cảnh báo, chỉ mất màu.
       *
       * Vì sao chỉ một số màn trắng: màu viết thẳng dạng hex (`bg-[#f8f4ff]`)
       * dịch ra hex nên vẫn sống; màu theo bảng của Tailwind (`purple-600`,
       * `slate-50`) mới dịch ra `oklch()`. Màn nào dựng bằng bảng màu thì trắng.
       *
       * `cssTarget` bảo Lightning CSS (bộ xử lý CSS của Vite) hạ cấp cú pháp màu
       * xuống dạng WebView cũ đọc được, kèm giá trị dự phòng. Sửa một dòng ở
       * tầng dựng, không đi vá từng lớp Tailwind trong 5.000 dòng JSX.
       *
       * ⚠️ ĐỪNG NÂNG MỐC NÀY LÊN CHO "GỌN". Người dùng của app là người cao
       * tuổi, và điện thoại của họ thường là máy cũ ba bốn năm — đúng nhóm có
       * WebView không được cập nhật.
       */
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
