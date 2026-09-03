# PROMPT ĐỂ DÁN VÀO GEMINI — DỰNG PHẦN "LÚC ĐANG BỊ GỌI"

*Soạn 17/8/2026. Chép nguyên khối từ dấu `---` xuống dưới vào ô chat đầu tiên.*

---

Tôi đang làm **Khoan Đã** — app chống lừa đảo cho người cao tuổi Việt Nam. Dự án
đã chạy được: 736 test backend xanh, 55 test frontend xanh, APK 10,7 MB cài được.
**Bạn tiếp quản, không phải bắt đầu lại.** Đừng dựng lại thứ đang chạy.

Đợt này làm **một việc duy nhất**: cho app tác động được **đúng lúc kẻ lừa đảo
đang gọi cho bác**, chứ không phải sau khi cúp máy.

## 0 · Đọc năm tệp này trước khi viết dòng mã nào, đúng thứ tự

| # | Tệp | Vì sao |
|---|---|---|
| 1 | `D:\KHOAN-DA-24H\CLAUDE.md` | Hợp đồng ràng buộc §HĐ / §4 / §11 / §12. **Đây là luật, không phải gợi ý.** |
| 2 | `D:\KHOAN-DA-24H\BAN-GIAO.md` | Bản đồ dự án + **danh sách bẫy đã dẫm** kèm số đo |
| 3 | `docs\superpowers\specs\2026-08-15-truy-cap-nhanh-luc-bi-goi-design.md` | **§15 — thiết kế của đúng đợt này, 700 dòng, đã được chủ dự án duyệt 15/8.** Không thiết kế lại. |
| 4 | `src\analysis\pipeline.js` | Đường phân tích chính |
| 5 | `src\bo-hoi-nhanh.js` | Bộ luật của bộ hỏi nhanh — **đã viết xong**, chỉ thiếu đường vào |

Hai thư mục, hai repo git riêng:

```
D:\KHOAN-DA-24H\                 backend Node + Express, cổng 8089
D:\trợ-lý-ảo-khoan-đã (1)\       frontend React + Vite + Capacitor (Android)
```

Frontend `npm run build` ghi thẳng vào `D:\KHOAN-DA-24H\public\app\`.

## 1 · Sáu điều tôi cần bạn giữ

**① Chú thích `⚠️` trong mã là tài liệu, không phải rác.** Mỗi cái là một lỗi đã
xảy ra thật kèm số đo và ngày tháng. Đừng "dọn dẹp", đừng rút gọn. Chúng là lý do
mã trông như vậy.

**② §4.3 là dạng lỗi đặc trưng của dự án** — đã xuất hiện hơn mười lần ở những chỗ
hoàn toàn khác nhau, luôn cùng một hình dạng: một thứ *chưa đo được* hiện ra y hệt
một thứ *đã đo và không sao*. Mỗi lần bạn thêm một nguồn đầu vào, hãy hỏi:
***"hỏng thì người dùng thấy gì?"*** Nếu câu trả lời là *"giống hệt lúc bình
thường"* thì đó là bug, không phải tính năng.

**③ §4.2 — mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm.**
`src/analysis/decision-engine.js` là **bộ luật duy nhất** ra mức. Android và React
**không được tự chấm điểm**, chỉ được đẩy `SIGNAL_ID` vào đó.

**④ Trước khi tin một con số, kiểm bộ đo bằng một ca đã biết kết quả.** Dự án này
đã nhiều lần bị chính công cụ đo lừa: bộ eval hỏng 89,5% lượt gọi vẫn báo "không
thấy rủi ro"; một test bọc assertion trong `if` nên **xanh mà không kiểm gì**;
`npm test` của frontend ghi cứng một tệp nên **13 test chưa bao giờ chạy**.

**⑤ Đừng tự đổi những thứ trong §12** — ba nhãn rủi ro, ngưỡng 20/45, cap 69, số
lượng critical override (10), privacy model, Rule Engine, năm giá trị `canThiep`.
Thấy cần đổi thì **dừng lại và hỏi tôi**, đừng làm rồi báo sau.

**⑥ Sửa xong thì ĐO, đừng suy luận.** Backend `npm test`, frontend `npm test`.
Đụng tầng phát hiện thì chạy thêm eval và cho tôi **hai con số: báo oan và bỏ sót**.

---

## 2 · BỐN LỖ ĐÃ ĐO ĐƯỢC — đây chính là việc

Tôi đã đối chiếu mã ngày 17/8/2026. Bốn chỗ dưới đây là **sự thật đã kiểm**, không
phải phỏng đoán. Bạn xác minh lại từng chỗ trước khi sửa.

### Lỗ ①  — Bộ hỏi nhanh **chết ở cửa HTTP**

`src/analysis/pipeline.js:399` đọc `input.traLoiBoHoiNhanh`:

```js
const boHoiNhanh = input.traLoiBoHoiNhanh
  ? tinHieuTuTraLoi(input.traLoiBoHoiNhanh) : [];
```

Nhưng `server.js:212` chỉ rút sáu trường, **không có trường đó**:

```js
const { vanBan, anh, ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi } = req.body || {};
```

⇒ **Bộ luật hỏi nhanh đã viết xong, có test, và chưa bao giờ chạy được qua mạng.**
Đây là lỗ rẻ nhất và đắt giá nhất trong cả đợt.

### Lỗ ②  — Frontend không có một dòng nào cho bộ hỏi nhanh

`grep -rn "chuyen_tien\|doi_otp\|cai_ung_dung\|khong_ro" "D:\trợ-lý-ảo-khoan-đã (1)\src"`
⇒ **0 kết quả.** Thư mục `src/components/` có 11 tệp, không tệp nào là màn hỏi nhanh.

### Lỗ ③  — `manifest.webmanifest` thiếu `share_target`

Có `shortcuts`, **không có `share_target`**. §15.10 xếp `share_target` là **P0**.

### Lỗ ④  — Không có `CallScreeningService`

`android/app/src/main/java/vn/khoanda/app/` có 8 tệp Java. Không tệp nào đụng tới
cuộc gọi đến.

---

## 3 · SÁU VIỆC — làm đúng thứ tự này

Thứ tự đã xếp theo **cắt được**: việc 1–2 là xương sống, việc 5–6 cắt trước nếu
hụt thời gian. **Đừng làm song song. Xong việc nào chạy test việc đó.**

---

### VIỆC 1 — Mở cửa `traLoiBoHoiNhanh` ở `/api/analyze`  · backend · ~2 giờ

**Sửa `server.js` ở HAI CHỖ** — đây là phần dễ làm sót nhất của cả đợt:

| Dòng | Hàm | Route |
|---|---|---|
| **212** | `xuLyPhanTich` | `/api/analyze` và `/api/phan-tich` |
| **313** | handler sơ bộ | `/api/analyze/so-bo` |

⚠️⚠️ **PHẢI SỬA CẢ HAI.** Ngay trên dòng 313 có chú thích viết sẵn, nguyên văn:
*"BỐN TRƯỜNG GHI ÂM PHẢI CÓ Ở CẢ HAI ĐƯỜNG. Đường này mù với ghi âm còn
`/api/analyze` thì không ⇒ sơ bộ ra 'Chưa thấy dấu hiệu rủi ro' trong khi kết quả
cuối có `chuaKiem`. Người dùng đọc màn hình đầu tiên rồi cất điện thoại."* Bộ hỏi
nhanh là nguồn thứ năm và dẫm đúng vào cái bẫy đó. Hàng rào có sẵn:
`test/so-bo-khong-cao-hon-ket-qua.test.js`.

Rút thêm **một trường**, `traLoiBoHoiNhanh`, và truyền vào `analyze()` ở cả hai.

⚠️ **RÚT TỪNG TRƯỜNG. TUYỆT ĐỐI KHÔNG `...req.body`.** Chú thích dài ngay trên
hàm đó giải thích vì sao: trải `req.body` là mở đường cho `verifiedChannel` /
`verifiedRelationship` — **hai lá cờ DUY NHẤT có thể hạ mức** — đi vào từ người
lạ. `/api/analyze` nằm trong `KHONG_CAN_DANG_NHAP`.

⚠️ **Lọc khoá.** Chỉ nhận các khoá nằm trong `cauHoiNhanh` của
`public/config/ma-hop-dong.json` (8 mã), và chỉ nhận giá trị boolean. Khoá lạ ⇒ bỏ
im lặng, **không** báo lỗi (§6.8 cấm phản chiếu nội dung người dùng).

⚠️ **Sửa cả hàng rào `THIEU_DAU_VAO`** — cũng ở **hai chỗ**, `server.js:231` và
`server.js:322`:

```js
if (!coVanBan && !anh && !ghiAm) return res.status(400).json({ maLoi: 'THIEU_DAU_VAO' });
```

Lượt **chỉ có bộ hỏi nhanh, không có chữ nào** là ca chính đáng nhất của đợt này —
bác đang áp điện thoại vào tai, không gõ được gì. Hiện tại nó bị trả 400.

**Hai tệp KHÔNG được đụng vào — chúng đã xong rồi:**

- `src/analysis/co-dinh-cuoc-goi.js:76` **đã** xử lý `traLoiBoHoiNhanh` và ghi rõ
  *"BỘ HỎI NHANH LUÔN GIỮ"*.
- `src/analysis/pipeline.js:204` **đã** đẩy `bo_hoi_nhanh` vào `daKiem`, kèm chú
  thích *"nó KHÔNG PHẢI `nghe_cuoc_goi`"*. `bo_hoi_nhanh` cũng đã có sẵn trong
  danh sách `daKiem` của `ma-hop-dong.json`.

Thêm lần nữa ở đâu đó là nhân đôi im lặng.

**Test viết ĐỎ trước, đo QUA HTTP chứ không chỉ gọi hàm** (§5.2 — dự án đã bị cắn
đúng chỗ này):

1. `POST /api/analyze` với `{traLoiBoHoiNhanh:{ho_bao_chuyen_tien_hoac_rut_tien:true,
   ho_xin_ma_trong_tin_nhan:true}}`, **không có `vanBan`** ⇒ **không** trả 400, và
   `nhan === 'CAO'` (CO-01: OTP + chuyển tiền).
2. Trả lời **hết bằng `false`** ⇒ `daKiem` **không** chứa `ghi_am`, và `chuaKiem`
   **vẫn** chứa `chua_nghe_duoc_cuoc_goi`. *(§15.9 test 1)*
3. Trả lời hết bằng `false` **không hạ mức** so với lượt y hệt không gửi trường
   này — so trên cùng một `vanBan`. *(§4.2)*
4. Gửi kèm `verifiedRelationship: true` ⇒ **bị bỏ**, mức không đổi.
5. Gửi khoá lạ `{xyz: true}` ⇒ 200, không rò `xyz` ra phản hồi.
6. **`/api/analyze/so-bo` và `/api/analyze` cho cùng một `traLoiBoHoiNhanh` ⇒ sơ
   bộ KHÔNG được nhẹ hơn kết quả cuối.** Mở rộng
   `test/so-bo-khong-cao-hon-ket-qua.test.js` thay vì viết tệp mới.

**Lệnh đo:**
```bash
cd D:\KHOAN-DA-24H && npm test
```

---

### VIỆC 2 — Màn hỏi nhanh 4 nhánh  · frontend · ~1 ngày

**Đây là thứ tác động lúc đang bị gọi mà KHÔNG cần quyền nào, chạy cả trên PWA lẫn
APK, offline, dưới 1 giây.** §15.10 xếp **P0**.

**Thiết kế đã có ở §15.11.1** — đọc mục đó, đừng tự nghĩ lại. Tóm tắt:

```
Người ta đang yêu cầu bác làm gì?

  💸 Chuyển tiền      🔐 Đưa mã OTP
  📱 Cài ứng dụng     🪪 Gửi giấy tờ
  ❓ Tôi không rõ
```

Chọn xong hỏi **2–3 câu CÓ/KHÔNG thuộc đúng nhánh đó**, không bắt đi hết 8 câu.
Rút thời gian ra kết luận từ ~20 giây xuống ~8 giây.

**Tệp mới:** `src/components/HoiNhanh.tsx`.

⚠️ **KHÔNG chép cứng danh sách mã vào TypeScript.** Đọc từ
`public/config/ma-hop-dong.json` — nó có sẵn `nhanhHanhDong` (5 mã) và
`cauHoiNhanh` (8 mã), sinh tự động từ `src/bo-hoi-nhanh.js` bằng
`scripts/xuat-hop-dong.js`. Chép cứng là hai bản phân kỳ im lặng.

⚠️ **Chữ hiển thị đi qua `catalog.ts`**, không mã cứng chuỗi nào — kể cả ARIA
label (§4.1).

⚠️ **`api.ts` LIỆT KÊ TỪNG TRƯỜNG**, không trải `...input`. Giữ đúng lối đang có.

**Bốn luật không được phá:**

| | |
|---|---|
| Nhánh `❓ Tôi không rõ` | **bắt buộc có**, và **không bao giờ** dẫn thẳng tới mức thấp — nó sang bộ hỏi đầy đủ 8 câu. *(§15.16 test 12)* Người không diễn đạt được mình đang gặp chuyện gì là người **cần giúp nhất**. |
| Trả lời "KHÔNG" | **không trừ điểm.** Nó nghĩa là *"chưa thấy dấu hiệu này trong điều bác kể"*, không phải bằng chứng vắng mặt. |
| Màu | **không có màu xanh lá cho trạng thái kết luận** *(§15.16 test 13)*. Ba nhãn ở `src/risk-labels.js`, không thêm nhãn thứ tư, không có chữ "An toàn". |
| Chấm điểm | React **không tự ra mức**. Gửi `traLoiBoHoiNhanh` về `/api/analyze` và hiển thị thứ máy chủ trả. |

**Sàn tiếp cận (§4.4) — có test chặn, sẽ đỏ nếu làm sai:**
- Nút chính **phải khai `data-vai-tro="nut-chinh"`**, không chỉ `min-h-[56px]` của
  Tailwind — `public/vung-cham-san.css` nạp **sau cùng** và áp sàn **theo vai**.
- Không `white-space: nowrap` trên nút.
- Không ghi `style.fontSize` — inline style vô hiệu hoá cả hệ bậc chữ.
- Hiệu ứng **chỉ được dời chỗ**. Không `initial={{ opacity: 0 }}`: `rAF` treo khi
  màn tắt hoặc chế độ tiết kiệm pin, và đã đo được **cả app trắng trơn**.

**Test:** thêm vào `giao-dien.test.mjs`. Nhớ dùng `boChuThich()` trước khi soi —
chú thích trong mã **cố ý** nhắc lại nguyên văn đoạn hỏng để giải thích, soi cả
chú thích thì test đỏ vì chính tài liệu của nó.

---

### VIỆC 3 — `share_target`  · frontend · ~2 giờ

Thêm vào `public/manifest.webmanifest`. Bác đang đọc tin nhắn trong Zalo, bấm
"Chia sẻ" → chọn Khoan Đã → app mở thẳng màn kết quả. §15.10 xếp **P0**.

Nhận cả `text` và `title`. Nhận ảnh nếu làm được (`files` + `enctype:
multipart/form-data`) — `NhanChiaSe.java` đã xử phần APK, đọc nó trước.

⚠️ Đổi manifest thì **kiểm service worker có dọn cache cũ không**. §3.3 của
`docs/TINH-NANG-KHA-THI.md`: SW phục vụ bản cũ sau khi cập nhật là lỗi im lặng.

---

### VIỆC 4 — `CallScreeningService`: thẻ "số này bác chưa lưu"  · Android · ~1,5 ngày

**Tệp mới:** `android/app/src/main/java/vn/khoanda/app/QuetCuocGoi.java`.

Đăng ký `CallScreeningService` + xin `RoleManager.ROLE_CALL_SCREENING`. Đây là API
Google **thiết kế đúng cho việc này** — không phải lách qua Trợ năng. Chính sách
Play cấm dùng `AccessibilityService` cho mục đích không phải trợ năng từ 2017.

**Chuông reo → hiện thẻ đè, chữ rất to, TRƯỚC khi bác bắt máy:**

> ## Số này bác chưa lưu
> Bác chưa lưu số nào của công an, toà án hay ngân hàng.
> **Nếu họ xưng là mấy nơi đó — cúp máy.**

⚠️⚠️ **BỐN ĐIỀU CẤM — đọc §15.5 và §15.7, mỗi điều đều có lý do đã đo:**

**① Một chiều. Ngoài danh bạ ⇒ hiện thẻ. Trong danh bạ ⇒ IM LẶNG.**
Tuyệt đối không có câu *"Đây là con gái bác, yên tâm"*. Giả số thì giả được thành
đúng số con trai bác — lúc đó khớp danh bạ **còn nguy hơn**. §4.2: mọi thứ thêm
vào chỉ được làm tăng cảnh giác.

**② KHÔNG chặn, KHÔNG tự cúp.** Làm được về kỹ thuật; §12 cấm *"tự hứa chặn cuộc
gọi"*. Và §15.5.2 giải thích vì sao chặn vốn dĩ **không đáng làm**: kẻ lừa đảo đổi
SIM mỗi ngày và phần lớn dùng số giả; chặn "số tổng đài Vietcombank" thì lần sau
ngân hàng thật gọi cũng bị chặn; chặn nhầm thì bệnh viện gọi, con gọi từ số lạ,
bác đều không nhận được. Gọi `respondToCall()` cho qua, chỉ hiện thẻ.

**③ KHÔNG dùng `getCallerNumberVerificationStatus()`.** Nó đọc STIR/SHAKEN của nhà
mạng — **Viettel · VinaPhone · MobiFone chưa triển khai**. Nó trả "chưa xác minh"
cho **mọi cuộc gọi**, kể cả con gái bác gọi về. Cảnh báo hiện suốt thì vài hôm là
thành hình nền.

**④ KHÔNG có danh sách số lừa đảo từ báo cáo người dùng.** §12 cấm quy kết cá nhân
từ báo cáo, mà số điện thoại **là** danh tính cá nhân. Và tự nó cũng hỏng: số bị
thu hồi rồi cấp lại, ai cũng báo được thì sẽ có người báo bậy.

**Thẻ giả danh tổ chức** (§15.10, P2) — nếu số gọi đến **trùng** một số trong
`public/config/support-directory.json`, thẻ **không được trấn an**. Phải nói:

> Số hiện ra trùng tổng đài Vietcombank — **nhưng số hiện ra giả được.**
> Đừng lấy nó làm bằng chứng. Muốn chắc thì cúp máy, rồi bác tự gọi lại.

Mọi số hiển thị **phải đi qua `src/analysis/verified-institution-registry.js`**.
Tệp đó tự ghi là *"module nguy hiểm nhất trong backend"* vì **số không nguồn bị
loại thẳng** — một hotline bịa còn tệ hơn không có hotline nào.

**Không có role / bác từ chối cấp ⇒ hiện đúng trạng thái đó trong app**, không im
lặng bỏ qua. §4.3.

⚠️ **`ROLE_CALL_SCREENING` chỉ MỘT app giữ được.** Máy demo có Truecaller / Zalo
giữ vai đó thì phải gỡ trước. Ghi việc này vào hướng dẫn cài đặt.

---

### VIỆC 5 — Bong bóng nổi lúc đang gọi  · Android · ~1 ngày · **cắt được**

**Thiết kế đầy đủ ở §15.3** — đọc trước, đừng tự nghĩ. Tóm tắt bắt buộc:

- Chỉ xuất hiện **khi có cuộc gọi đang diễn ra**. Hết cuộc gọi thì biến mất.
- Hình khiên, **72px**, dính mép màn hình, kéo được, nửa trong suốt.
- **Không có chữ ở trạng thái thu gọn** — chữ nhỏ trên bong bóng là chữ không ai
  đọc được, nó chỉ làm bong bóng to ra và che mất màn hình cuộc gọi.
- **Giữ 1 giây ⇒ ẩn hết cuộc gọi này.** Đây là §4.6 — luôn phải có lối ra.
- Chạm ⇒ mở thẳng màn hỏi nhanh của VIỆC 2.

`PopupDeManHinh.java` đã có và đã nối (`hienPopupCanhBao` trong `native.ts`).
**Mở rộng nó, đừng viết lớp thứ hai.** `SYSTEM_ALERT_WINDOW` đã khai sẵn trong
`AndroidManifest.xml`.

⚠️ **Lỗ hổng phải khai thẳng với ban giám khảo, đừng giấu** (§15.5.3): từ Android
12 app tự bảo vệ được không cho ai vẽ đè lên mình (`setHideOverlayWindows`), và
**app ngân hàng gần như đều bật**. Nghĩa là đè lên màn hình cuộc gọi thì chạy tốt,
**đè lên app ngân hàng thì không**. **Không hứa gì về khúc chuyển tiền.**

---

### VIỆC 6 — Quét sức khoẻ thiết bị  · Android · ~1 ngày · **cắt trước tiên**

⚠️ **Việc này CHƯA CÓ SPEC.** Phần dưới là bản thiết kế sơ bộ. Gặp chỗ nào mâu
thuẫn với §HĐ thì **dừng lại và hỏi tôi**, đừng tự quyết.

**Ý:** thay vì *đi xin* quyền Trợ năng như kẻ lừa đảo vẫn làm, app **báo cáo xem
ai khác đang giữ quyền đó**. Cùng một API, ngược chiều đạo đức.

**Tệp mới:** `QuetSucKhoeMay.java`.

⚠️ **Tài liệu `docs/DANH-GIA-20-Y-TUONG.md` §2 SAI hai dòng — đừng chép:**

| Tài liệu ghi | Thực tế |
|---|---|
| `Settings.canDrawOverlays()` → "app nào vẽ đè được" | **chỉ trạng thái của chính app mình**, không liệt kê app khác |
| `PackageManager.canRequestPackageInstalls()` → "cài từ nguồn không rõ" | **cũng chỉ của chính mình** — từ API 26 quyền này là per-app |

**Đọc được thật, không cần quyền mới:**

| Cần biết | API |
|---|---|
| App nào đang bật Trợ năng | `Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES` |
| Tên dễ đọc của chúng | `AccessibilityManager.getEnabledAccessibilityServiceList(FEEDBACK_ALL_MASK)` → `getResolveInfo()` → `loadLabel(pm)` |
| App nào đang làm device admin | `DevicePolicyManager.getActiveAdmins()` |
| Chế độ nhà phát triển / ADB | `Settings.Global.DEVELOPMENT_SETTINGS_ENABLED` · `ADB_ENABLED` |
| Chính Khoan Đã cài từ đâu | `getInstallSourceInfo()` (API 30+) |

⚠️ Lấy tên dễ đọc hỏng thì **hiện tên gói thô, đừng giấu dòng đó đi**. Giấu là
đúng §4.3.

**Nối vào bộ luật:** `DEV_ACCESSIBILITY_PERMISSION` và `DEV_REMOTE_CONTROL_APP`
**đã có sẵn** trong `src/analysis/signal-registry.js` — kiểm bằng `laTinHieu()`
trước khi dùng. §12 cấm thêm tín hiệu mới. Android **chỉ gửi `SIGNAL_ID` về**,
không tự ra mức.

⚠️⚠️ **CHỖ NÀY PHẢI HỎI TÔI TRƯỚC KHI LÀM.** Bản web không quét được máy, nên
theo §4.3 nó **bắt buộc** phải ra một mã `chuaKiem`. Nhưng danh sách `chuaKiem`
trong `public/config/ma-hop-dong.json` có **16 mã và không mã nào hợp** — không có
`chua_quet_duoc_may`. Thêm mã mới là **đổi §HĐ**, mà §HĐ nói rõ *"đổi hợp đồng này
= phải báo cho cả hai bên"*. **Dừng lại, hỏi tôi, đừng tự thêm.**

---

## 4 · BẢY BẪY ĐÃ DẪM — áp cho đúng đợt này

Mỗi cái là một lỗi **đã xảy ra thật**, mất từ vài chục phút tới vài giờ để tìm.

**① Bỏ dấu làm ranh giới ngữ nghĩa biến mất.** `chớ` (đừng) và `cho` (giới từ) bỏ
dấu đều thành `cho`, nên từ `cho` trong danh sách phủ định đã **nuốt tín hiệu ở
mọi câu có "cho"**: *"nộp 20tr **cho** cục thuế"*. Người dùng báo lỗi này 16/8.
**Cụm ngắn và phổ biến, viết ở dạng bỏ dấu, là bẫy.**

**② Hiệu ứng không được quyết định nội dung có hiện hay không.**
`requestAnimationFrame` **treo** khi khung hình không được vẽ. Đã đo:
`AnimatePresence mode="wait"` ở bộ định tuyến gốc ⇒ chạm nút điều hướng **không có
gì xảy ra, vĩnh viễn**.

**③ `min-h-0` trên flex item.** Thiếu nó thì item không co được, `overflow-y-auto`
không bao giờ kích hoạt, rồi khung cha cắt cụt. Và `sticky` khi bị ghim **vẫn giữ
chỗ ở vị trí gốc** ⇒ chồng lên khối đứng trước.

**④ `vung-cham-san.css` nạp SAU CÙNG và áp sàn THEO VAI.** Nút chỉ khai
`min-h-[56px]` của Tailwind bị quy tắc 52px ghi đè.

**⑤ Test không được chạm kho dữ liệu thật.** `moKho()` không tham số mở
`.du-lieu/khoan-da.sqlite` — kho **thật**. Triệu chứng: test **xanh khi chạy riêng,
đỏ khi chạy cả bộ**.

**⑥ Đường dẫn tiếng Việt phá Gradle.** `scripts/dung-apk.ps1` **phải lưu UTF-8 có
BOM**. PowerShell 5.1 đọc `.ps1` không BOM theo bảng mã ANSI và hằng chứa `ợ ý ả đ`
hỏng ngay lúc phân tích cú pháp. Lỗi báo ra là *"Cannot find path… does not exist"*,
nghe như thư mục bị xoá. Bản dựng chạy ở `D:\khoan-da-build` thuần ASCII.

**⑦ Web Push không chạy trong WebView của Capacitor trên Android.** Nếu việc nào
dựa vào thông báo đẩy thì phải qua FCM bằng plugin native, và Android 13+ đòi
`POST_NOTIFICATIONS` xin lúc chạy. Không xin thì thông báo **bị nuốt, không lỗi**.

---

## 5 · ĐỊNH NGHĨA "XONG"

Chỉ được nói xong khi **đủ cả năm**:

0. **Chạy `npm test` ở cả hai repo TRƯỚC KHI sửa gì và ghi lại hai con số baseline.**
   Đừng tin con số trong tài liệu — `BAN-GIAO.md` ghi 736 còn `PROMPT-CURSOR.md`
   ghi 791. Tự đo.
1. `cd D:\KHOAN-DA-24H && npm test` — xanh, và **số bài tăng lên** so với baseline.
2. `cd "D:\trợ-lý-ảo-khoan-đã (1)" && npm test` — xanh, số bài tăng so với baseline.
3. Test mới **đã từng đỏ** trước khi có mã. Cho tôi xem output lúc đỏ. Test xanh
   ngay từ đầu là test không kiểm gì — dự án đã bị đúng lỗi này.
4. Đụng tầng phát hiện ⇒ chạy eval, đưa **hai con số trước/sau: báo oan và bỏ sót**.
5. Đã cài APK lên **máy Android thật có SIM** và thử một cuộc gọi thật. Emulator
   không diễn được cảnh này.

```bash
cd D:\KHOAN-DA-24H && npm start
```

```bash
cd "D:\trợ-lý-ảo-khoan-đã (1)" && npm run build
```

```bash
powershell -File D:\KHOAN-DA-24H\scripts\dung-apk.ps1 -ApiGoc https://<địa-chỉ-máy-chủ>
```

---

## 6 · Cách tôi muốn bạn làm việc

- **Nói thẳng khi một yêu cầu của tôi mâu thuẫn với hợp đồng — hợp đồng thắng**,
  và ghi lại xung đột thay vì âm thầm làm theo.
- Đừng báo "xong" khi chưa chạy test.
- Đừng viết **"hoàn thiện 100%"** khi còn hạng mục chưa làm (§11 cấm).
- Đừng viết **"đã bảo vệ cuộc gọi"**, **"đã chặn"**, **"đã xác minh"**, **"an
  toàn"** ở bất kỳ chuỗi nào người dùng đọc, ở **cả hai** ngôn ngữ. §15.9 test 3
  chặn đúng bốn cụm này.
- Tiếng Việt trong mọi chuỗi hiển thị: gọi người dùng là **"bác"**, xưng **"cháu"**.
  Câu ngắn, không thuật ngữ. Nói chuyện với tôi thì bình thường.
- Gặp chỗ §12 cấm thì **dừng và hỏi**, đừng làm rồi báo sau.
