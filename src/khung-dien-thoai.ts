/**
 * ══════════════ KHUNG ĐIỆN THOẠI CHO NGƯỜI XEM TRÊN MÁY TÍNH ══════════════
 *
 * Trên màn hình rộng, app không trải hết màn hình mà nằm trong một khung
 * 390×844 căn giữa — đúng thứ bác sẽ thấy trên điện thoại.
 *
 * ⚠️ VÌ SAO PHẢI LÀ <iframe>, KHÔNG PHẢI MỘT KHỐI `div` RỘNG 390px.
 *
 * Bản đầu tiên bọc app trong `#root { width: 390px }`. CSS đó chạy đúng: khung
 * đúng 390px, bo góc đúng, viền máy đúng. Nhưng app thì vỡ nát — chữ rơi dọc
 * từng ký tự một, ảnh linh vật biến mất, thanh điều hướng dưới cùng bị đẩy lên
 * đầu màn hình.
 *
 * Nguyên nhân: app có **285 lớp `sm:` / `md:` / `lg:` của Tailwind**, và mỗi
 * lớp đó là một `@media (min-width: …)`. Media query đo **cửa sổ trình duyệt**,
 * KHÔNG đo khối chứa. Ở màn hình 1280px thì toàn bộ bố cục máy tính bật lên —
 * lưới nhiều cột, thanh ngang, chữ cỡ lớn — rồi bị nhồi vào một cột rộng 390px.
 *
 * Hỏng theo kiểu dễ đổ lỗi nhầm: CSS khung đúng, JavaScript cũng đúng, chỉ là
 * hai bên đang trả lời hai câu hỏi khác nhau. Trước đó đã có `beRongKhung()`
 * đọc `#root.clientWidth` để chữa phía JavaScript — nó chữa được phần của nó,
 * nhưng **JavaScript không với tới được media query**. Sửa CSS bằng JS là ngõ cụt.
 *
 * `<iframe>` thì có **viewport riêng**. Rộng 390px nghĩa là media query bên
 * trong thấy 390px, nên `lg:` tắt, `md:` tắt, `sm:` tắt — app chạy đúng như
 * trên điện thoại thật. Không phải sửa một lớp Tailwind nào.
 *
 * ⚠️ KHÔNG SỬA BẰNG CÁCH GỠ CÁC LỚP `sm:`/`md:`/`lg:`. 285 chỗ, và gỡ xong thì
 * người dùng máy tính bảng thật mất bố cục thật của họ.
 *
 * ⚠️ THUỘC TÍNH `allow` LÀ BẮT BUỘC, KHÔNG PHẢI CHO ĐẸP. Màn chính có nút
 * "Bấm để nói" dùng micro. Thiếu `allow="microphone"` thì trong iframe nút đó
 * chết lặng — và nó chết đúng kiểu khó truy: không báo lỗi, chỉ không nghe.
 *
 * ⚠️ SÀN TIẾP CẬN KHÔNG ĐỔI (§4.4). Khung 390px là kích thước điện thoại thật,
 * nên vùng chạm 52px và cỡ chữ 14px vẫn đúng nghĩa — không phải thu nhỏ ảnh.
 */

/** Dưới ngưỡng này thì đang là điện thoại/máy tính bảng thật — không đóng khung. */
const NGUONG_RONG = 900;

/** Tham số đánh dấu "đây là bản chạy bên trong khung", để nó không tự bọc lại. */
const DAU_TRONG_KHUNG = 'khung';

/** App bên trong nhận đúng kích thước điện thoại, không phải kích thước cửa sổ. */
const RONG = 390;
const CAO = 844;

function dangOTrongKhung(): boolean {
  // `window.top` có thể ném lỗi nếu khác nguồn — ở đây luôn cùng nguồn, nhưng
  // bọc lại cho chắc: nghi ngờ thì coi như đang ở trong khung và không bọc nữa.
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  return new URLSearchParams(window.location.search).has(DAU_TRONG_KHUNG);
}

function nenDongKhung(): boolean {
  return window.innerWidth >= NGUONG_RONG;
}

/**
 * Địa chỉ cho app bên trong: giữ nguyên đường dẫn, tham số và neo của địa chỉ
 * hiện tại, chỉ thêm dấu `khung`.
 *
 * ⚠️ PHẢI GIỮ TOÀN BỘ THAM SỐ CŨ. App đọc `targetView` và nội dung chia sẻ sang
 * từ ứng dụng khác qua query string; nuốt mất chúng là nuốt mất lối tắt từ
 * thông báo thường trực.
 */
function diaChiBenTrong(): string {
  const u = new URL(window.location.href);
  u.searchParams.set(DAU_TRONG_KHUNG, '1');
  return u.pathname + u.search + u.hash;
}

/*
 * ⚠️ KHÔNG DÙNG DẤU BACKTICK TRONG KHỐI NÀY — KỂ CẢ TRONG CHÚ THÍCH CSS.
 * Đây là template literal; một dấu backtick lạc vào là đóng chuỗi giữa chừng.
 * Đo 20/8/2026: viết `content-box` trong chú thích làm esbuild báo
 * "Expected ; but found content" — lỗi trỏ vào dòng chú thích nên rất dễ tưởng
 * là lỗi của CSS chứ không phải của chuỗi. Dùng dấu nháy đơn thay thế.
 */
const CSS_KHUNG = `
  html, body { height: 100%; margin: 0; overflow: hidden; }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(1200px 800px at 50% -10%, #ede9fe 0%, transparent 60%),
      linear-gradient(160deg, #f5f3ff 0%, #eef2ff 50%, #faf5ff 100%);
  }
  .kd-vo-may {
    position: relative;
    flex: 0 0 auto;
    /* ⚠️ 'content-box' ĐỂ VIỀN MÁY KHÔNG ĂN VÀO MÀN HÌNH.
       Tailwind đặt 'box-sizing: border-box' cho mọi phần tử, nên 'width: 390px'
       cộng padding 10px hai bên cho ra màn hình chỉ còn 370px — đo được
       20/8/2026. 390px là bề rộng iPhone thật và là mốc bố cục của app;
       lệch 20px đủ để các hàng nút sát nhau bị xuống dòng. */
    box-sizing: content-box;
    width: ${RONG}px;
    /* Laptop 13" cao chưa tới 844px sau khi trừ thanh trình duyệt. Để cứng
       844px thì đáy bị cắt, và thứ bị cắt đầu tiên là thanh điều hướng. */
    height: min(${CAO}px, calc(100vh - 60px));
    border-radius: 38px;
    background: #14122b;
    padding: 10px;
    box-shadow:
      0 0 0 2px #3b3663,
      0 30px 70px -18px rgba(30, 27, 58, 0.55);
  }
  .kd-man-hinh {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 29px;
    background: #f8f4ff;
  }
  /* Loa thoại — chỉ là chi tiết trang trí, không nhận chuột. */
  .kd-loa {
    position: absolute;
    top: 17px;
    left: 50%;
    transform: translateX(-50%);
    width: 62px;
    height: 5px;
    border-radius: 999px;
    background: #2c2850;
    pointer-events: none;
  }
`;

/**
 * Bọc trang hiện tại thành khung điện thoại.
 *
 * @returns `true` nếu đã bọc — người gọi PHẢI dừng, đừng gắn React vào trang
 *          ngoài. Trang ngoài chỉ là cái vỏ máy; app thật sống trong iframe.
 */
export function dungKhungDienThoai(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (dangOTrongKhung()) return false;

  /*
   * Kéo cửa sổ qua lại ngưỡng thì nạp lại — vì "có khung hay không" quyết định
   * ngay từ lúc dựng trang, không đổi tại chỗ được. Chỉ nạp lại khi trạng thái
   * ĐÁNG LẼ phải khác trạng thái hiện tại, nếu không sẽ nạp lại vô tận.
   */
  const dangCoKhung = nenDongKhung();
  let hen: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(hen);
    hen = window.setTimeout(() => {
      if (nenDongKhung() !== dangCoKhung) window.location.reload();
    }, 250);
  });

  if (!dangCoKhung) return false;

  const kieu = document.createElement('style');
  kieu.textContent = CSS_KHUNG;
  document.head.appendChild(kieu);

  const vo = document.createElement('div');
  vo.className = 'kd-vo-may';

  const khung = document.createElement('iframe');
  khung.className = 'kd-man-hinh';
  khung.src = diaChiBenTrong();
  khung.title = 'Khoan Đã';
  // Micro cho nút "Bấm để nói", camera cho việc gửi ảnh chụp màn hình.
  khung.allow = 'microphone; camera; clipboard-read; clipboard-write';

  const loa = document.createElement('div');
  loa.className = 'kd-loa';

  vo.appendChild(khung);
  vo.appendChild(loa);

  document.body.replaceChildren(vo);
  return true;
}
