/* eslint-disable no-restricted-globals */
/**
 * SERVICE WORKER — vỏ ứng dụng, thông báo đẩy, và lối mở app từ thông báo.
 *
 * ══════════ BỐN RÀNG BUỘC CỨNG, ĐỌC TRƯỚC KHI SỬA ══════════
 *
 * ① §4.4 — `vung-cham-san.css` PHẢI nằm trong APP_SHELL.
 *    "Sàn tiếp cận không được phụ thuộc vào việc có mạng." Mất mạng mà vùng
 *    chạm tụt xuống dưới 52px là người cao tuổi bấm trượt đúng lúc cần bấm
 *    nhất. Đây là lý do tệp CSS đó được gọi tên đích danh trong §4.4.
 *
 * ② §4.3 — KHÔNG BAO GIỜ trả kết quả phân tích từ đệm.
 *    Một kết quả cũ hiện lại cho một tin nhắn mới là lời trấn an bịa. Mọi
 *    `/api/*` đi thẳng ra mạng; hỏng thì để hỏng, và giao diện nói thật là chưa
 *    kiểm được. "Không kiểm được" ≠ "đã kiểm, không thấy gì".
 *
 * ③ §6.9 — KHÔNG đệm nội dung người dùng. Không đệm thân yêu cầu POST, không
 *    ghi nội dung tin nhắn vào Cache Storage.
 *
 * ④ §11 — thông báo KHÔNG được nói "đã đọc và hiểu", không hứa đã chặn được gì.
 *    Chữ trong thông báo do MÁY CHỦ gửi xuống (đã qua catalog i18n), service
 *    worker chỉ hiển thị — nó KHÔNG tự soạn câu.
 */

const PHIEN_BAN = 'khoan-da-v3';   // ⚠️ ĐỔI SỐ NÀY MỖI LẦN ĐỔI APP_SHELL, nếu không máy cũ giữ vỏ cũ.
const KHO_VO = `vo-${PHIEN_BAN}`;

/**
 * ⚠️ `vung-cham-san.css` và `tokens.css` do phía backend phục vụ ở gốc.
 * Thiếu chúng thì §4.4 gãy khi mất mạng — xem ràng buộc ① ở trên.
 */
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/logo.webp',
  '/logo-192.png',
  '/tokens.css',
  '/vung-cham-san.css',
  /**
   * ⚠️ §15.11.1 — DANH SÁCH MÃ CỦA BỘ HỎI NHANH PHẢI CHẠY ĐƯỢC KHI MẤT MẠNG.
   * Màn hỏi nhanh là thứ bác mở lúc đang bị gọi; lúc đó sóng có thể tậm tịt.
   */
  '/config/ma-hop-dong.json',
  /**
   * ⚠️ §4.5 — font tiếng Việt.
   * Bản này bundle `@fontsource/be-vietnam-pro` qua Vite nên tệp `.woff2` nằm
   * trong `/assets/` với tên có băm, không có đường dẫn cố định để liệt kê ở
   * đây. Chúng được đệm động bởi nhánh "tài nguyên tĩnh" phía dưới, ngay lần
   * mở đầu tiên. Nếu sau này font chuyển sang đường dẫn cố định thì THÊM VÀO
   * ĐÂY — thiếu lát `vietnamese` là dấu tiếng Việt rơi về font dự phòng và chữ
   * nhảy chân.
   */
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const kho = await caches.open(KHO_VO);
    // ⚠️ `addAll` hỏng NGUYÊN LƯỢT nếu một tệp 404. Thêm từng tệp để một tệp
    // thiếu không kéo sập cả vỏ — nhưng vẫn ghi log, đừng nuốt im lặng.
    await Promise.all(APP_SHELL.map(async (d) => {
      try { await kho.add(new Request(d, { cache: 'reload' })); } catch (err) {
        console.warn('[sw] không đệm được', d, err?.message);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const ten = await caches.keys();
    await Promise.all(ten.filter((t) => t !== KHO_VO).map((t) => caches.delete(t)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // ⚠️ RÀNG BUỘC ② — mọi đường API đi THẲNG ra mạng, không đệm, không trả lại
  // kết quả cũ. Kết quả phân tích cũ cho một tin nhắn mới là trấn an bịa.
  if (url.pathname.startsWith('/api/')) return;

  // ⚠️ RÀNG BUỘC ③ — không đệm gì ngoài GET cùng gốc.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  /**
   * Điều hướng: mạng trước, đệm sau. Vỏ cũ còn hơn trang trắng (§6.7), nhưng
   * vỏ KHÔNG chứa kết luận nào — mọi kết luận vẫn phải đi qua mạng.
   */
  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await fetch(request); } catch {
        return (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  // Tài nguyên tĩnh: đệm trước cho nhanh, nền tự làm mới.
  e.respondWith((async () => {
    const daCo = await caches.match(request);
    const mang = fetch(request).then(async (r) => {
      if (r && r.ok) (await caches.open(KHO_VO)).put(request, r.clone());
      return r;
    }).catch(() => null);
    return daCo || (await mang) || Response.error();
  })());
});

/**
 * ─────────────── THÔNG BÁO ĐẨY ───────────────
 *
 * ⚠️ MÁY CHỦ GỬI XUỐNG CHỮ ĐÃ DỊCH. Service worker KHÔNG tự soạn câu — §4.1 nói
 * mọi chuỗi người dùng đọc, kể cả notification, phải đến từ catalog i18n.
 *
 * ⚠️ §11 — không "đã đọc và hiểu", không "đã chặn", không "an toàn".
 * Nếu payload thiếu chữ thì hiện câu trung tính nhất có thể và KHÔNG bịa mức
 * rủi ro: một thông báo nói sai mức còn tệ hơn không có thông báo.
 */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {}; }

  const tieuDe = d.tieuDe || 'Khoan Đã';
  const than = d.noiDung || 'Bác mở Khoan Đã để xem.';

  e.waitUntil(self.registration.showNotification(tieuDe, {
    body: than,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    lang: d.lang || 'vi',
    // ⚠️ `requireInteraction` cho ca khẩn: thông báo không tự biến mất trước khi
    // bác kịp nhìn. Người cao tuổi phản ứng chậm hơn thời gian hiện mặc định.
    requireInteraction: d.khan === true,
    tag: d.ma || 'khoan-da',
    renotify: true,
    data: { duong: d.duong || '/', ma: d.ma || null },
    // Rung: chỉ ở ca khẩn, và ngắn. Rung dài làm người ta hoảng thêm.
    vibrate: d.khan === true ? [200, 100, 200] : undefined,
  }));
});

/**
 * BẤM VÀO THÔNG BÁO ⇒ MỞ THẲNG APP, ĐÚNG MÀN HÌNH.
 *
 * Đã có cửa sổ mở thì ĐƯA CỬA SỔ ĐÓ LÊN rồi điều hướng, không mở thêm tab —
 * bác đang hoảng mà thấy ba cửa sổ Khoan Đã là thêm rối.
 */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const duong = e.notification?.data?.duong || '/';

  e.waitUntil((async () => {
    const ds = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of ds) {
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus();
        // `navigate` có thể không được hỗ trợ; báo qua message là đường dự phòng.
        try { await c.navigate(duong); } catch { c.postMessage({ loai: 'mo_duong', duong }); }
        return;
      }
    }
    await self.clients.openWindow(duong);
  })());
});
