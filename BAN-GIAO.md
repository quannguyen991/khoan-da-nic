# KHOAN ĐÃ — BÀN GIAO

*Cập nhật 16/8/2026. Đọc file này trước, rồi đọc `CLAUDE.md`.*

---

## 0. Đọc theo thứ tự nào

| # | Tệp | Vì sao |
|---|---|---|
| 1 | **`CLAUDE.md`** (gốc repo backend) | Bốn khối ràng buộc §HĐ / §4 / §11 / §12 chép nguyên văn. **Đây là hợp đồng, không phải gợi ý.** Sửa gì trái nó thì dừng lại và hỏi chủ dự án. |
| 2 | `BAN-GIAO.md` (file này) | Bản đồ dự án + danh sách bẫy đã dẫm |
| 3 | `src/analysis/pipeline.js` | Đường phân tích chính, từ đầu vào tới phong bì §HĐ |
| 4 | `src/analysis/direct-precheck.js` | Nơi mẫu regex gặp văn bản. Nhiều bẫy nhất. |
| 5 | `src/vault-store.js` | Lưu trữ + hàng rào trường cấm §6.9 |
| 6 | `../trợ-lý-ảo-khoan-đã (1)/src/App.tsx` | Toàn bộ giao diện app của bác |

**Chú thích trong mã là tài liệu chính.** Mỗi chỗ có `⚠️` là một lỗi đã xảy ra
thật, kèm số đo. Đừng "dọn dẹp" chúng — chúng là lý do mã trông như vậy.

---

## 1. Dự án là gì

App chống lừa đảo cho **người cao tuổi Việt Nam**. Bác dán tin nhắn / kể tình
huống / quét QR / chia sẻ ảnh chụp màn hình vào, app trả về ba mức rủi ro và
hướng dẫn từng bước.

**Hai nửa, hai thư mục, hai repo git riêng:**

```
D:\KHOAN-DA-24H\                 backend Node + Express, cổng 8089
D:\trợ-lý-ảo-khoan-đã (1)\       frontend React + Vite + Capacitor (Android)
```

Frontend `npm run build` ghi thẳng vào `D:\KHOAN-DA-24H\public\app\`, nên máy
chủ phục vụ cả API lẫn giao diện trên **một tiến trình, một origin**.

---

## 2. Ba luật quyết định mọi thứ

### §HĐ — hợp đồng giữa hai nửa

`POST /api/analyze` trả về **đúng bảy trường**:

```js
{ nhan, maLyDo, daKiem, chuaKiem, hoKichBan, aiDaChay, canThiep }
```

- `nhan` là **ENUM** (`CAO|NGHI_NGO|CHUA_THAY`). Chữ hiển thị chỉ có ở
  `frontend/src/catalog.ts`. Backend **không bao giờ** trả chuỗi tiếng Việt.
- `maLyDo` là **MÃ**, không phải câu. Nhờ vậy đổi ngôn ngữ **không thể** làm
  đổi kết luận.
- `chuaKiem` không rỗng ⇒ frontend **bắt buộc** hiện nó **cùng cỡ chữ với
  `nhan`**. Đây là ràng buộc an toàn, không phải thẩm mỹ.
- `canThiep` quyết định **màn hình**, `nhan` quyết định **nhãn**. Hai thứ khác
  nhau, không suy cái này từ cái kia.

### §4.2 — AI chỉ bật cờ, LUẬT CỨNG mới quyết định

Lớp AI trả tín hiệu `present | unknown` — **không có `absent`**. Lược đồ Zod
**cấm** các trường `riskScore`, `riskLabel`, `critical`, `interventionLevel`,
`safe`. `src/analysis/decision-engine.js` là **bộ luật duy nhất** ra mức.

> **Mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm.**

### §4.3 — "KHÔNG KIỂM ĐƯỢC" ≠ "ĐÃ KIỂM, KHÔNG THẤY GÌ"

**Đây là dạng lỗi đặc trưng của dự án. Nó đã xuất hiện hơn mười lần ở những
chỗ hoàn toàn khác nhau.** Mỗi lần đều cùng một hình dạng: một thứ *chưa đo
được* hiện ra y hệt một thứ *đã đo và không sao*.

Đã gặp ở: ảnh không đọc được · tên miền không phân giải · bộ eval hỏng 89,5%
lượt gọi · AI không chạy · ghi âm cụt · cầu nối native không trả lời · kho dữ
liệu là `Map` trong RAM · lấy tin báo thất bại · camera bị từ chối.

**Thêm nguồn đầu vào mới nào thì THÊM CA vào đó**, và thêm test.

---

## 3. Bản đồ mã

### Backend `D:\KHOAN-DA-24H\`

```
server.js                     Express: CSP, CORS đóng, rate limit theo NGĂN RIÊNG
src/analysis/
  pipeline.js                 ★ đường chính: đầu vào → tín hiệu → luật → phong bì §HĐ
  direct-precheck.js          ★ regex gặp văn bản. Hàng rào phủ định ở đây.
  decision-engine.js          bộ luật DUY NHẤT ra mức. Ngưỡng 20/45, cap 69.
  critical-overrides.js       10 override, §12 cấm đổi số lượng
  context-builder.js          chuẩn hoá, bỏ dấu, cắt câu, khung giáo dục
  evidence-validator.js       đối chiếu trích dẫn của AI với văn bản gốc
  locale-packs/vi-VN.js       ★ mẫu tiếng Việt
  co-dinh-cuoc-goi.js         có dính cuộc gọi không (quyết định chuaKiem)
src/
  vault-store.js              ★ Postgres → SQLite → bộ nhớ tạm, + hàng rào §6.9
  tai-khoan.js                đăng ký / đăng nhập / hồ sơ, scrypt
  khoan-proof.js              passkey WebAuthn + ghép cặp thiết bị
  trusted-circle.js           vòng tròn gia đình, 4 ràng buộc chống lạm dụng
  tin-lua-dao.js              RSS 5 báo thật
eval/dataset/*.jsonl          497 mẫu (485 dài + 12 câu ngắn)
test/                         736 test
```

### Frontend `D:\trợ-lý-ảo-khoan-đã (1)\`

```
src/
  App.tsx                     ★ ~1950 dòng, toàn bộ app của bác
  api.ts                      lớp gọi §HĐ. LIỆT KÊ TỪNG TRƯỜNG, không trải ...input
  catalog.ts                  ★ MÃ → câu. Ba nhãn rủi ro nguyên văn ở đây.
  native.ts                   cầu nối Capacitor. MỌI hàm có hạn giờ.
  components/
    KetQua.tsx                màn kết quả — nơi §HĐ chạm vào mắt người dùng
    GhiAm.tsx                 ghi âm bằng bộ nghe TRÊN MÁY
    QuetQR.tsx                quét QR (BarcodeDetector → jsQR)
    DangNhap.tsx              đăng ký / đăng nhập thật
    TheHoSo.tsx               hồ sơ, ảnh đại diện CHỈ nằm trên máy
    TinLuaDao.tsx             tin từ báo thật
    Guardian.tsx              bảng của người con — ứng dụng KHÁC, quyền KHÁC
  giao-dien.test.mjs          ★ 55 test hàng rào giao diện
android/app/src/main/java/vn/khoanda/app/
  KhoanDaPlugin.java          cầu nối
  DocThongBao.java            đọc thông báo (§15.4)
  PopupDeManHinh.java         popup đè màn hình
  NgheGiongNoi.java           bộ nghe TRÊN MÁY, không đám mây
  NhanChiaSe.java             nhận ảnh chụp màn hình chia sẻ vào
```

---

## 4. Chạy dự án

```bash
# Backend (cổng 8089) — phục vụ cả API lẫn giao diện
cd D:\KHOAN-DA-24H && npm start
```

```bash
# Frontend: dựng vào public/app của backend
cd "D:\trợ-lý-ảo-khoan-đã (1)" && npm run build
```

```bash
# Test
cd D:\KHOAN-DA-24H && npm test
```

```bash
# Dựng APK (đọc kỹ ba cái bẫy ở đầu file script)
powershell -File D:\KHOAN-DA-24H\scripts\dung-apk.ps1 -ApiGoc https://<địa-chỉ-máy-chủ>
```

**Biến môi trường** (`.env` ở backend): `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`,
`DATABASE_URL` (tuỳ chọn — không có thì dùng SQLite ở `.du-lieu/`).

---

## 5. ⚠️ BẪY ĐÃ DẪM — ĐỌC TRƯỚC KHI SỬA

Mỗi mục dưới đây là một lỗi **đã xảy ra thật**, mất từ vài chục phút tới vài
giờ để tìm. Chúng đều có test chặn; nếu test đỏ ở những chỗ này thì **đọc chú
thích trước khi sửa test**.

### 5.1 Bỏ dấu làm ranh giới ngữ nghĩa biến mất

Ba lần, ba chỗ khác nhau:

- `chớ` (đừng) và `cho` (giới từ) → cùng là `cho`. Từ `cho` nằm trong danh sách
  phủ định đã **nuốt tín hiệu ở mọi câu có "cho"**: *"nộp 20tr **cho** cục
  thuế"*, *"đọc mã OTP **cho** tôi"*. Người dùng báo lỗi này 16/8.
- `nhan qua` (nhận quà) khớp trúng *"phạm **nhân qua** nguy kịch"* — một tin
  hiến máu lọt vào danh sách cảnh báo lừa đảo.
- `đừng` và `dụng` → cùng là `dung`. Khung giáo dục `dung…nhe` khớp trúng
  *"mở ứng **DỤNG** ngân hàng rồi bật chia sẻ màn hình **NHÉ**"* — một câu lừa
  đảo bị xếp là giáo dục.

> **Cụm ngắn và phổ biến, viết ở dạng bỏ dấu, là bẫy.** Cụm phải cụ thể tới
> mức chỉ đúng ý định mới trúng.

### 5.2 Hiệu ứng không được quyết định nội dung có hiện hay không

`requestAnimationFrame` **treo** khi khung hình không được vẽ: app chạy nền,
màn tắt, chế độ tiết kiệm pin. Đã đo được:

- `AnimatePresence mode="wait"` ở bộ định tuyến gốc ⇒ chạm nút điều hướng
  **không có gì xảy ra**, vĩnh viễn.
- 16 chỗ `initial={{ opacity: 0 }}` ⇒ một nhịp treo là **cả app trắng trơn**.
- `initial={{ scale: 0.95 }}` trên trang chủ ⇒ đo được `clientHeight` 812
  trong khi chiều cao thật 771 — đúng tỉ lệ 0,95.

Luật: hiệu ứng **chỉ được dời chỗ**. Hỏng thì nội dung lệch vài pixel, vẫn
đọc được nguyên vẹn.

### 5.3 `min-height` trên flex item — hai bẫy ngược nhau

- Thiếu `min-h-0` ⇒ item **không co được** (mặc định `min-height: auto`), nên
  `overflow-y-auto` không bao giờ kích hoạt, rồi khung cha `overflow-hidden`
  cắt cụt.
- `sticky` khi bị ghim **vẫn giữ chỗ ở vị trí gốc nhưng được vẽ ở vị trí
  ghim** ⇒ nó chồng thẳng lên khối đứng trước. Đã dùng để "sửa" ô nhập bị
  che, và tạo ra lỗi ô nhập đè lên nút micro.

### 5.4 `vung-cham-san.css` nạp SAU CÙNG và áp sàn THEO VAI

Nút chỉ khai `min-h-[56px]` của Tailwind bị quy tắc 52px ghi đè. Nút chính
**phải khai `data-vai-tro="nut-chinh"`**.

### 5.5 Cỡ chữ

`tokens.css` đổi bậc bằng `html[data-font-size]` (15/17/20px). **Không ghi
`style.fontSize`** — inline style thắng mọi selector và vô hiệu hoá cả hệ.
Mọi cỡ chữ khai bằng **rem** (gốc thiết kế 17px), kèm sàn `max(14px, …)`.

### 5.6 Bộ test không được chạm vào kho dữ liệu thật

`moKho()` không tham số mở tệp `.du-lieu/khoan-da.sqlite` — kho **thật**. Test
gọi nó sẽ ghi lẫn vào tài khoản người dùng, và các tệp test chạy song song rò
trạng thái sang nhau. Triệu chứng: một bài test **xanh khi chạy riêng, đỏ khi
chạy cả bộ**. Chặn bằng `NODE_TEST_CONTEXT` (Node tự đặt).

### 5.7 Đường dẫn tiếng Việt phá Gradle

`scripts/dung-apk.ps1` **phải lưu UTF-8 có BOM**. PowerShell 5.1 đọc `.ps1`
không BOM theo bảng mã ANSI, và hằng chứa `ợ ý ả đ` hỏng ngay lúc phân tích
cú pháp. Lỗi báo ra là *"Cannot find path … does not exist"*, nghe như thư mục
bị xoá. Bản dựng chạy ở `D:\khoan-da-build` thuần ASCII.

### 5.8 Test canh hàng rào phải bỏ chú thích trước khi soi

Chú thích trong mã **cố ý** nhắc lại nguyên văn đoạn hỏng để giải thích. Soi
cả chú thích thì test đỏ vì chính tài liệu của nó, và cách "sửa" duy nhất là
xoá lời giải thích đi. Dùng `boChuThich()` trong `giao-dien.test.mjs`.

### 5.9 Đo lường tự lừa mình

Đã xảy ra nhiều lần:

- Bộ eval hỏng 89,5% lượt gọi vẫn ra "chưa thấy dấu hiệu rủi ro" → thêm trần
  10% lượt hỏng.
- Bộ nhớ đệm eval không đổi khoá khi mã đổi → tưởng đã đo bản mới.
- `test/font-size-floor.test.js` bọc assertion trong `if (coTep(x))` → **xanh
  mà không kiểm gì**.
- `npm test` của frontend ghi cứng một tệp → 13 test **chưa bao giờ chạy**.

> Trước khi tin một con số: **kiểm bộ đo bằng một ca đã biết kết quả.**

---

## 6. Trạng thái hiện tại

**Đã đo được** (16/8/2026, 445 mẫu, `reasoning_effort: low`, `claude-sonnet-5`):

| Chỉ số | Giá trị |
|---|---|
| Recall | 73,7 % |
| FP mức cao | 6,1 % |
| Pass | 67,4 % |
| Parity VI↔EN | 16,6 (ngưỡng ≤3,0 — **chưa đạt**) |

Tầng luật đơn thuần, không AI, trên 485 mẫu: **báo oan 12/164 · bỏ sót
250/321**. (Tầng AI làm phần lớn công việc còn lại.)

**Test:** 736 backend · 55 frontend · tất cả xanh.

**APK:** 10,7 MB.

---

## 7. Việc còn dang dở

| Việc | Ghi chú |
|---|---|
| **Parity VI↔EN 16,6** | Ngưỡng ≤3,0. Hồi quy từ lúc đổi `reasoning_effort: low`; đã chấp nhận vì recall tuyệt đối tăng ở cả ba ngôn ngữ. Cần xem lại. |
| **Thông báo + popup chưa nối vào luồng thật** | Kênh `IMPORTANCE_HIGH` và `PopupDeManHinh` đã dựng và biên dịch được, nhưng **chưa có chỗ nào gọi chúng khi kết quả là `CAO`**. Xem `native.ts → dungKenhCanhBao/hienPopupCanhBao`. |
| **13 mẫu `warn-*` báo oan** | Nội dung DẠY về lừa đảo bị nhận là lừa đảo. `KHUNG_GIAO_DUC` chưa đủ. |
| **Câu chuyển tiền trần trụi** | *"chuyển 50 triệu cho tài khoản này"* = 14 điểm, dưới ngưỡng 20. **Không hạ ngưỡng** (§12 cấm). Cần tín hiệu "số tiền lớn + tài khoản vô danh". |
| **22 mẫu quà tặng không có `hoKichBan`** | `OFF_PRIZE_GIFT` tồn tại nhưng thiếu dòng `HO_KICH_BAN`. |
| **Chưa chạy trên máy thật** | Đường micro chỉ test được trên điện thoại thật. |
| **Mã chết bản desktop** | ~5 khối `className="hidden …"` trong `App.tsx`, còn sót từ lúc bỏ bản máy tính. |

---

## 8. Những thứ TUYỆT ĐỐI không tự đổi (§12)

Muốn đổi thì **dừng lại và hỏi chủ dự án**, đừng làm rồi báo sau.

- Ba nhãn rủi ro, hay thêm nhãn thứ tư, hay thêm nhãn "an toàn"
- Số lượng critical override (**10**), ngưỡng **20/45**, cap **69**
- Privacy model, hay bật đồng bộ máy chủ mặc định
- Thay Rule Engine bằng "LLM judge" / model ensemble / agent autonomous
- Thêm cụm từ nào **hạ mức vô điều kiện** — *"bất kỳ cụm nào hạ mức vô điều
  kiện đều là một câu thần chú tặng cho kẻ lừa đảo"*
- Cho model gọi tool / network trực tiếp trong đường risk analysis
- Dùng nội dung người dùng làm prompt instruction
- Xoá `CLAUDE.md`

**Nếu ảnh thiết kế mâu thuẫn với hợp đồng a11y / privacy / security — HỢP
ĐỒNG THẮNG.** Ghi lại xung đột thay vì âm thầm làm theo ảnh.
