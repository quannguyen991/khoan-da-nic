# Phần 3 — Cảnh báo thật tới máy con · Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bố mẹ gặp mức CAO, và đã tự bật quy tắc ở Phần 2, thì **máy con nhận thông báo đẩy thật**. Con bấm vào là thấy màn "{tên} đang cần con" với một nút "Gọi ngay". Hai chiều: con thấy bố mẹ đã bấm gì. Quá 60 giây không ai phản ứng thì báo lần hai.

**Architecture:**
- Backend:
  - module `bao-dong-gia-dinh.js` (logic, tiêm phụ thuộc để test);
  - `gui-web-push.js` (cắm thư viện `web-push` vào điểm cắm `guiThat` đã có của `push.js`);
  - 7 route `/api/gia-dinh/*`.
- Frontend:
  - hàm gọi API trong `tai-khoan.ts`;
  - `lib/nhan-canh-bao.ts` (đăng ký Web Push trên máy con);
  - `WarningView` gửi báo động và hiện đúng trạng thái gửi;
  - Guardian có nút "Bật nhận cảnh báo" và màn "đang cần con";
  - màn ghép hiện ai đã bật nhận.

**Tech Stack:** `web-push` 3.x (VAPID, aes128gcm), Service Worker `public/sw.js` (đã có handler push/notificationclick), Express, `node --test`.

**Spec:** `docs/superpowers/specs/2026-09-23-cau-dao-gia-dinh-design.md` — mục 4 (Phần 3) và dòng trạng thái ở mục 3.2.

## Global Constraints

- **§12:** chưa có quy tắc thì không gửi gì, dù ở mức nào. Quy tắc mặc định tắt (Phần 2).
- **§6.9:** chỉ **mã** đi qua. Route chỉ đọc đúng các trường khai báo; trường lạ như `vanBan` bị bỏ. Test kiểm payload không chứa chữ nào của tin nhắn.
- **§9.4 / §11:** trạng thái chỉ có bốn loại: `DA_DAY_DI`, `PUSH_DELIVERY_UNKNOWN`, `CHUA_BAT_NHAN`, `CHUA_CAU_HINH_PUSH`. Không bao giờ "đã thấy", "đã đọc".
- **§6.10:** đường báo động **không** đặt bộ giới hạn tần suất. Chống dội bằng gộp 30 giây cho mỗi (bố mẹ, loại sự kiện).
- **VAPID_SUBJECT** là URL của app, **không** dùng email người dùng (nó bị gửi tới dịch vụ push bên thứ ba).
- Hẹn giờ leo thang nằm trong bộ nhớ, nên máy chủ khởi động lại là mất. Ghi rõ giới hạn này.
- Service worker không đăng ký ở bản dev (quyết định 20/9 trong `main.tsx`). Nhận push chỉ thử được trên bản dựng; bản dev báo `CHI_CO_BAN_DUNG`.
- Diễn tập (`dienTap`) không gửi báo động.
- CORS: route mới chỉ dùng GET/POST, không thêm phương thức.
- Không commit khi người dùng chưa bảo.

---

### Task 1: Backend — module báo động + gửi Web Push + routes

**Files:**
- Create: `backend/src/bao-dong-gia-dinh.js`, `backend/src/gui-web-push.js`
- Modify: `backend/server.js` (routes đặt sau `/api/tai-khoan/gia-han`; `/api/suc-khoe` thêm `pushCauHinh`)
- Modify: `backend/src/cong-dong-canh-giac.js` (export `TEN_HO`)
- Modify: `render.yaml` (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY `sync:false`; VAPID_SUBJECT = URL)
- Test: `test/bao-dong-gia-dinh.test.js`

**Interfaces:**
- Produces:
  - `POST /api/gia-dinh/nhan-canh-bao` với `{dangKy, lang}` → `{daBat, soMay}` (máy con)
  - `POST /api/gia-dinh/nhan-canh-bao/tat` với `{endpoint?}` → `{daTat}`
  - `GET /api/gia-dinh/tinh-trang-bao` → `{thanhVien:[{id, ten, coDangKy}]}` (máy bố mẹ)
  - `POST /api/gia-dinh/bao-dong` với `{loaiSuKien, nhan?, hoKichBan?}`; trả `{gui:false, lyDo}` hoặc `{gui:true, suKienId, ketQua:[{ten, trangThai}]}`
  - `POST /api/gia-dinh/trang-thai` với `{suKienId, hanhDong}` → `{daGhi}`
  - `GET /api/gia-dinh/su-kien/:id` → `{id, loaiSuKien, nhan, hoKichBan, luc, tenBoMe, hanhDong:[{ma, luc}], conDaGoi}`
  - `POST /api/gia-dinh/su-kien/:id/con-da-goi` → `{daGhi}`
  - Test tiêm được: `app.set('guiPushThay', fn)` và `app.set('henGioThay', fn)`

- [ ] **Step 1: Test đỏ** — `test/bao-dong-gia-dinh.test.js`

  Kịch bản chạy qua HTTP thật, bộ gửi giả ghi lại lượt gửi:
  1. Tạo hai tài khoản bố mẹ và con, rồi ghép với nhau.
  2. Con đăng ký nhận bằng một endpoint https giả.
  3. Quy tắc tắt → bố mẹ gửi báo động → `{gui:false, lyDo:'CHUA_BAT_QUY_TAC'}`, bộ gửi **không** được gọi.
  4. Bật quy tắc → gửi báo động kèm cả trường lạ `vanBan:'MẬT_KHẨU_BÍ_MẬT_123'`. Mong đợi:
     - `gui:true`, `ketQua=[{ten:'Minh thử', trangThai:'DA_DAY_DI'}]`;
     - bộ gửi được gọi 1 lần, payload có `tieuDe`, `noiDung`, `khan:true`, `duong` chứa `view=guardian&canhBao=`;
     - `JSON.stringify(payload)` **không** chứa `MẬT_KHẨU_BÍ_MẬT_123`.
  5. Gửi lại trong 30 giây → `lyDo:'DA_GOP'`, bộ gửi không được gọi thêm.
  6. `nhan:'NGHI_NGO'` với `ket_qua_kiem` → `gui:false` (chỉ mức CAO).
  7. Con đọc sự kiện → 200. Người ngoài vòng → 403. Con bấm "đã gọi" → 200.
  8. Leo thang: gọi callback đã bắt ở `henGioThay`:
     - khi chưa ai phản ứng → gửi thêm;
     - sự kiện thứ hai, bố mẹ cập nhật `bam_goi_nguoi_than` trước → callback **không** gửi.
  9. `hanhDong` lạ → 400. `loaiSuKien` lạ → 400.
  10. Máy bố mẹ đọc `tinh-trang-bao` → `[{ten:'Minh thử', coDangKy:true}]`.

- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: `gui-web-push.js`**, gồm `guiThatWebPush({dangKy, payload, vapid})`:
  - `webpush.sendNotification(dangKy, JSON.stringify(payload), { TTL: 600, urgency: payload.khan ? 'high' : 'normal', vapidDetails: {subject, publicKey, privateKey} })`;
  - thành công trả `{ok:true, status}`, lỗi trả `{ok:false, status, loi}`;
  - không ném ra ngoài.
- [ ] **Step 4: `bao-dong-gia-dinh.js`**, gồm `taoKhoSuKien()` và `taoBaoDong({kho, khoSuKien, capGhep, layHoSo, env, guiThat, henGio, bayGio})`:
  - trả về `{baoDong, leoThang, capNhat, conDaGoi, docSuKien, tinhTrang}`;
  - chữ vi/en do máy chủ soạn theo `lang` của từng máy nhận;
  - đăng ký hết hạn (404/410) thì tự gỡ.
- [ ] **Step 5: Routes** trong `server.js`. Mỗi request tạo một `taoBaoDong({...})` với `kho = await KP.khoChung()`. Kho sự kiện dùng chung một `taoKhoSuKien()`. `guiThat = req.app.get('guiPushThay') || guiThatWebPush`, `henGio = req.app.get('henGioThay') || setTimeout`.
- [ ] **Step 6:** `/api/suc-khoe` thêm `pushCauHinh: layCauHinhVapid().daCauHinh`. `render.yaml` thêm 3 biến.
- [ ] **Step 7: Chạy, thấy xanh**, cùng `npm test` (có hàng rào CORS).

### Task 2: Kiểm thư viện mã hoá thật (không phải bộ gửi giả)

> **Đổi lúc làm (23/9):** `web-push` luôn gọi HTTPS, kể cả với endpoint `http://` (lỗi TLS "wrong version number"). Vì vậy không dựng dịch vụ push giả bằng HTTP được. Cách kiểm thay thế:
> - kiểm bản tin bằng `webpush.generateRequestDetails` với **đúng** `tuyChonGui()` mà hàm gửi dùng, gồm header aes128gcm, JWT VAPID (`aud`, `sub` không phải email), TTL, Urgency, và thân đã mã hoá;
> - kiểm kết cục 201/410 bằng cách thay tạm `webpush.sendNotification`.
>
> Đường mạng thật thử trên bản đã deploy. Các bước dưới đây là bản trước khi phát hiện điều đó.

- [ ] Tạo test `test/gui-web-push-that.test.js`:
  - dựng một máy chủ HTTP cục bộ làm "dịch vụ push";
  - gọi `guiThatWebPush` với endpoint `http://127.0.0.1:<cổng>`. `web-push` cho phép http nếu gọi thẳng; hàm này nằm sau `chuanHoaDangKy` nên không vướng kiểm https;
  - khoá p256dh/auth lấy từ một cặp ECDH sinh bằng `crypto`;
  - kiểm máy chủ giả nhận `Content-Encoding: aes128gcm`, header `Authorization: vapid t=…, k=…`, `TTL: 600`, thân khác rỗng và không chứa chữ rõ;
  - kiểm hàm trả `{ok:true}` khi máy chủ giả trả 201, và `{ok:false, status:410}` khi trả 410.

### Task 3: Frontend — máy bố mẹ gửi báo động và hiện trạng thái thật

**Files:** `src/tai-khoan.ts` (7 hàm gọi API), `src/App.tsx` (`WarningView`), `src/i18n.ts`, test `test/bao-dong-gia-dinh-giao-dien.test.js`.

- [ ] `WarningView`:
  - `useEffect` chạy một lần khi `laCao && !laDienTap && !khongGoiDuoc && docPhien()`, gọi `guiBaoDong({loaiSuKien:'ket_qua_kiem', nhan:'CAO', hoKichBan})` rồi lưu vào state `baoDong`;
  - `ghiHanhDong`: sau `ghiKetQua`, nếu có `baoDong?.suKienId` thì gọi `guiTrangThaiBaoDong(id, hanhDong)`;
  - dưới dòng đếm giây: **một dòng** trạng thái (`DA_DAY_DI` → "Đã gửi tới máy {tên}"; `PUSH_DELIVERY_UNKNOWN` → "Chưa chắc đã tới máy {tên}"; `CHUA_BAT_NHAN` → "{tên} chưa bật nhận cảnh báo"; `CHUA_CAU_HINH_PUSH` → "Máy chủ chưa bật gửi cảnh báo"). Không có gì thì không hiện.
- [ ] Test (đọc nguồn):
  - diễn tập không gửi;
  - không câu nào có "đã thấy" / "đã đọc";
  - gửi đúng một lần mỗi lượt.

### Task 4: Frontend — máy con: bật nhận, màn "đang cần con"; máy bố mẹ thấy ai đã bật

**Files:** `src/lib/nhan-canh-bao.ts` (mới), `src/components/Guardian.tsx`, `src/components/GhepConChau.tsx`, `src/i18n.ts`.

- [ ] `batNhanCanhBao(lang)` trả `{ok:true}` hoặc `{ok:false, ma}`. Các mã lỗi:
  - `KHONG_HO_TRO` (không có PushManager: WebView APK, trình duyệt cũ);
  - `CHI_CO_BAN_DUNG` (bản dev chưa đăng ký service worker);
  - `BI_TU_CHOI` (người dùng từ chối quyền thông báo);
  - `MAY_CHU_CHUA_CAU_HINH` (máy chủ chưa có khoá công khai);
  - `LOI_DANG_KY`.
- [ ] Guardian khi đã nối thật:
  - thẻ "Nhận cảnh báo của bố mẹ trên máy này", có nút bật và câu trạng thái;
  - có `?canhBao=<id>` trên địa chỉ thì hiện thẻ "{tên} đang cần con" ở đầu màn, nút "Gọi ngay" gọi `baoConDaGoi(id)` rồi mở `tel:`, kèm dòng thời gian các hành động của bố mẹ.
- [ ] `ManGhepConChau`: mỗi người đã nối có dòng "Đang nhận cảnh báo" hoặc "Chưa bật nhận cảnh báo", lấy từ `docTinhTrangBao()`.
- [ ] Test (đọc nguồn):
  - "Gọi ngay" gọi `baoConDaGoi` **trước** khi mở `tel:`;
  - không có chữ "đã đọc", "đã thấy".

### Task 5: Kiểm

- [ ] `npm test`, `npm run lint`, `npm run build`.
- [ ] Trình duyệt (bản dev): trọn luồng máy bố mẹ với bộ gửi thật. Endpoint giả sẽ ra `PUSH_DELIVERY_UNKNOWN`. Kiểm dòng trạng thái đúng câu, và Guardian với `?canhBao=` hiện thẻ "đang cần con".
- [ ] Ghi rõ cho người dùng: **nhận push thật trên máy con phải thử trên web đã deploy**, sau khi đặt 3 biến VAPID trên Render.
