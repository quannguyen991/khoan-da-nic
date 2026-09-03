# KHOAN ĐÃ — FRONTEND (màn hình · chữ hiển thị · tiếp cận)

> **File này dành cho **Gemini** (hoặc bất kỳ công cụ nào dựng giao diện).** Nửa còn lại nằm ở file kia; hai bên nối nhau bằng
> **§HĐ** ngay dưới. Đọc §HĐ và §4 trước khi gõ dòng đầu tiên.
>
> Nhiệm vụ: dựng toàn bộ giao diện: HTML một trang, CSS, điều hướng bằng hash, chữ hiển thị hai ngôn ngữ. **Không dựng bộ luật** — mọi kết luận rủi ro đến từ §HĐ.
>
> Cuộc thi: **24 giờ, build từ số 0, không mang mã nguồn vào.**

---

## §HĐ — HỢP ĐỒNG GIỮA BACKEND VÀ FRONTEND

> **Đây là thứ duy nhất nối hai nửa lại với nhau.** Backend và frontend được dựng
> SONG SONG bởi hai công cụ khác nhau. Bên nào cũng code dựa trên đúng hình dạng
> dưới đây — frontend dùng hàm giả trả dữ liệu mẫu cho tới khi backend xong.
>
> **Đổi hợp đồng này = phải báo cho cả hai bên.** Không tự thêm trường, không tự
> đổi tên trường, không tự đổi kiểu.

```js
// Backend cung cấp. Frontend tiêu thụ.
POST /api/analyze   { vanBan?: string, anh?: string /* base64 */ }
     → {
         nhan:       'CAO' | 'NGHI_NGO' | 'CHUA_THAY',   // ENUM, không phải chữ hiển thị
         maLyDo:     string[],   // ['CO_GIA_DANH_CO_QUAN', 'FIN_TRANSFER_REQUEST']
         daKiem:     string[],   // ['van_ban'] · ['anh_ocr'] · ['url']
         chuaKiem:   string[],   // ['chua_nghe_duoc_cuoc_goi', 'khong_mo_duoc_link']
         hoKichBan:  string|null,// 'gia_danh_cong_an' — để tra mẫu "Nói gì với bố mẹ"
         aiDaChay:   boolean,    // false ⇒ frontend PHẢI hiện dòng "lượt này không có AI đọc"
         canThiep:   'TRUST_RECEIPT' | 'VERIFY_PATH' | 'PAUSE_60S' | 'PROTECTED_CRITICAL' | 'RECOVERY'
       }
```

**Bốn luật của hợp đồng, không bên nào được phá:**

1. `nhan` là **ENUM**. Chữ tiếng Việt / tiếng Anh nằm ở catalog của frontend.
   Backend **không bao giờ** trả chuỗi hiển thị. Frontend **không bao giờ** so
   sánh bằng chuỗi tiếng Việt.
2. `maLyDo` là **MÃ**, không phải câu. Frontend tra bảng để ra câu. Điều này khiến
   đổi ngôn ngữ **không thể** làm đổi kết luận.
3. `chuaKiem` **không rỗng ⇒ frontend BẮT BUỘC hiển thị nó cùng cỡ chữ với `nhan`.**
   Đây là ràng buộc an toàn, không phải gợi ý thẩm mỹ — xem §4.3.
4. `canThiep` quyết định **màn hình**, `nhan` quyết định **nhãn**. Hai thứ khác nhau.
   Không suy cái này từ cái kia.

**Trong lúc chờ backend**, frontend dùng hàm giả:

```js
async function phanTichGia(vanBan) {
  if (/otp|mã|chuyển tiền|tài khoản an toàn/i.test(vanBan))
    return { nhan:'CAO', maLyDo:['CO_GIA_DANH_CO_QUAN','FIN_TRANSFER_REQUEST'],
             daKiem:['van_ban'], chuaKiem:['chua_nghe_duoc_cuoc_goi'],
             hoKichBan:'gia_danh_cong_an', aiDaChay:false, canThiep:'PROTECTED_CRITICAL' };
  return { nhan:'CHUA_THAY', maLyDo:[], daKiem:['van_ban'],
           chuaKiem:['chua_nghe_duoc_cuoc_goi'], hoKichBan:null,
           aiDaChay:false, canThiep:'TRUST_RECEIPT' };
}
```

---

## §2 — CHỈ CÓ MỘT ĐƯỜNG: BUILD TỪ ZERO

Điều kiện thi: **24 giờ, nhốt trong khu vực thi, KHÔNG được mang mã nguồn hay
demo dựng sẵn vào.** Chỉ được mang tài liệu.

Nghĩa là **repo TRỐNG ở giờ G**. Câu dưới đây đè lên mọi chỗ khác trong file:

> Mọi câu *"đã có trong mã nguồn"*, *"đang chạy"*, *"chưa cắm"*, *"refactor"*,
> *"migrate"*, *"rotate khoá đã lộ"*, *"chụp số test baseline"*, và **mọi tham
> chiếu tới số dòng của một file có sẵn** (`server.js:425`, `tokens.css:3-4`…)
> đều đọc là **KHÔNG ÁP DỤNG**. Đó là dấu vết của bản trước. Đừng đi tìm file đó,
> đừng chạy `npm test` để "đo mốc" — chưa có test nào cả.

Trạng thái duy nhất có nghĩa trong file này là ba giá trị:
**`P0`** dựng trong 24 giờ · **`P1`** nếu còn giờ · **`KHÔNG`** không dựng.

Đi thẳng tới **§2B**.

---

## §4 — RÀNG BUỘC BẤT BIẾN (không được phá, không được "tối ưu")

### 4.1 Ba nhãn mức rủi ro — nguyên văn

| Mức | Chuỗi hiển thị | Màu |
|---|---|---|
| Cao | `Nguy hiểm cao` | đỏ |
| Vừa | `Nghi ngờ` | vàng/cam |
| Thấp | `Chưa thấy dấu hiệu rủi ro` | xanh lá |

Tiếng Anh: `High risk` · `Suspicious` · `No clear risk signals found`.

**Bảng ánh xạ tên hiển thị VI → EN (18.1).** Khái niệm canonical **không đổi**
theo ngôn ngữ; chỉ chữ hiển thị đổi:

| Tiếng Việt | English | Canonical (không dịch) |
|---|---|---|
| Dừng 60 giây | Pause for 60 Seconds | `PAUSE_60S` |
| Phiếu tin cậy | Trust Receipt | `TRUST_RECEIPT` |
| Đường xác minh | Verify Safely | `VERIFY_PATH` |
| Bác đang được bảo vệ | Protected Mode | `PROTECTED_CRITICAL` |
| Vòng tròn gia đình | Trusted Circle | `TRUSTED_CIRCLE` |
| Quy tắc gia đình | Trusted Safety Rules | `FAMILY_RULE` |
| Nhớ cả vụ việc | Case Memory / Scam Journey | `SAFETY_CASE` / `JOURNEY_GRAPH` |
| Ra-đa thủ đoạn | Threat Radar | `THREAT_RADAR` |
| Trợ lý cuộc gọi ngân hàng | Bank Call Assistant | `BANK_CALL_ASSISTANT` |
| Bảo vệ 72 giờ | 72-Hour Recovery Watch | `RECOVERY_72H` |
| Đi cùng bác | Stay With Me | `TRUSTED_SUPPORT_SESSION` |

**Tên thương hiệu "Khoan Đã" giữ nguyên tiếng Việt ở mọi locale.** Mọi chuỗi
khác người dùng đọc — kể cả **ARIA label**, notification, manifest shortcut và
hướng dẫn phục hồi — phải đến từ catalog i18n, không mã cứng.

Copy tiếng Anh bắt buộc: `Pause. Verify. Protect.` (tagline) · `What are you
being asked to do?` (màn một câu hỏi) · `AI extracted the signals. The final risk
level was determined by fixed safety rules.` (dòng giải thích trong Trust Receipt).
**Không copy nào được buộc tội một người cụ thể** — dùng *"This request shows
signals commonly seen in scams."* **Không copy nào được trách móc người dùng.**

**TUYỆT ĐỐI KHÔNG có nhãn "An toàn" / "Safe" / bất kỳ biến thể nào.** Hệ thống
chỉ nói *"chưa thấy dấu hiệu trong thông tin bác cung cấp"* — nó **không hứa**
an toàn. Không có nhãn thứ tư tên "Nghiêm trọng"; "Nghiêm trọng" là tên của
**trạng thái can thiệp** `PROTECTED_CRITICAL`, không phải nhãn rủi ro.

Nguồn sự thật là **code**: `src/risk-labels.js` giữ ba chuỗi này, i18n **không ghi
đè được**, CSS không đụng tới được — và đừng tạo đường nào để đụng.

`riskLabel` trong dữ liệu là **enum trung tính** `HIGH | SUSPICIOUS | NO_SIGNS_FOUND`;
chữ tiếng Việt và tiếng Anh chỉ là bảng hiển thị. Đừng dùng chuỗi tiếng Việt làm
khoá logic — đổi ngôn ngữ sẽ làm vỡ so sánh.

### 4.2 AI chỉ bật cờ, LUẬT CỨNG mới quyết định

- Lớp AI trả **tín hiệu** `present | unknown` kèm evidence. Không có `absent`.
- Lược đồ **cấm** các trường: `riskScore`, `riskLabel`, `critical`,
  `interventionLevel`, `safe`. Model trả về thì Zod phải reject.
- `src/analysis/decision-engine.js` — **bộ luật duy nhất** — mới tính điểm và ra mức.
- **Mọi thứ thông minh thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm.**

### 4.3 "KHÔNG KIỂM ĐƯỢC" ≠ "ĐÃ KIỂM, KHÔNG THẤY GÌ"

Đây là **dạng lỗi đặc trưng của sản phẩm này**, đã xuất hiện ở ba chỗ độc lập
trong cùng một ngày. Ảnh không đọc được vì AI chết, tên miền không phân giải
được, bộ eval hỏng 89,5% lượt gọi — cả ba đều hiện ra "Chưa thấy dấu hiệu rủi ro".

Sàn đã đặt ở tầng dùng chung: `unreadableInputFloor()` trong
`src/analysis/pipeline.js`, `deterministicUrlVerdict()` trong `server.js`, trần
10% lượt hỏng trong `eval/khoanbench.js`. Hàng rào:
`test/unchecked-not-safe.test.js` + `test/unreadable-input-floor.test.js`.

> **Thêm nguồn đầu vào mới nào (video, ghi âm, tệp khác) thì THÊM CA vào đó.**

### 4.4 Sàn tiếp cận — có test chặn

| Thứ | Sàn | Test chặn |
|---|---|---|
| Vùng chạm | **52px** (`--touch-target`) | `test/font-size-floor.test.js` |
| Nút chính | **56px** (`--touch-target-primary`) | nt |
| Cỡ chữ | **14px** ở gốc 17px (`--text-xs`) | nt |
| Tương phản chữ | 4.5:1 | `test/contrast.test.js` |
| Tương phản viền | 3:1 (WCAG 1.4.11) | `test/non-text-contrast.test.js` |
| `white-space: nowrap` trên nút | cấm | `test/no-nowrap-on-controls.test.js` |
| Chữ nướng vào ảnh | cấm | `test/no-baked-text-screens.test.js` |

- `--touch-target-primary` là `max(56px, 3.5rem)`, **không phải `3.5rem` trần** —
  ở bậc chữ nhỏ nhất (15px) rem trần chỉ ra 52,5px, tức vi phạm.
- Sàn thực thi ở `public/vung-cham-san.css`, **nạp sau cùng**, khai theo VAI TRÒ.
  File này nằm trong `APP_SHELL` của service worker — sàn tiếp cận không được
  phụ thuộc vào việc có mạng.
- `test/no-nowrap-on-controls.test.js` mang **danh sách nợ chốt 12/8/2026** gồm
  21 selector. Danh sách chỉ được phép **NHỎ ĐI**; có test riêng chặn việc nó
  lớn thêm.

### 4.5 Tiếng Việt

- Dài hơn tiếng Anh ~30% → đừng thiết kế nút vừa khít chữ.
- Dấu xếp **cả trên lẫn dưới** (ế, ộ, ữ, ị, ặ) → `line-height` dưới 1.25 là cắt
  dấu. Dùng token `--leading-*`.
- Giọng văn: gọi người dùng theo **xưng hô đã chọn** (mặc định "bác"), xưng
  "cháu". Câu ngắn. Không thuật ngữ.

### 4.6 Nguyên tắc luôn có lối ra

Mức `PROTECTED_CRITICAL` bỏ hết điều hướng, **nhưng luôn phải có** dòng
"Tôi ổn, không có gì nguy hiểm" ở cuối màn hình. Nếu bộ luật báo động giả,
người dùng bị kẹt trong màn khẩn cấp sẽ hoảng và gỡ ứng dụng. Mỗi lần bấm nút
này là một mẫu dữ liệu báo động giả — ghi lại để hiệu chỉnh ngưỡng.

---

## §11 — NHỮNG CÂU KHÔNG ĐƯỢC VIẾT

- ❌ **"An toàn" / "Safe"** cho mức thấp → dùng "Chưa thấy dấu hiệu rủi ro" /
  "No clear risk signals found"
- ❌ hứa **lấy lại được tiền** → dùng "các bước làm tăng khả năng xử lý"
- ❌ **"Hoàn thiện 100%"** khi còn hạng mục chưa làm
- ❌ **"đã gửi cho người thân"** khi mới chỉ mở bảng chia sẻ của hệ điều hành
- ❌ **"đã đọc và hiểu"** cho notification
- ❌ khẳng định một dấu hiệu cụ thể là **VẮNG MẶT** trong nội dung (ví dụ
  *"Chưa thấy lời đe doạ hay xin mã OTP"* — đã từng phủ nhận đúng dấu hiệu đang
  nằm trong tin nhắn)
- ❌ số lượt báo cáo cộng đồng **giả**, cảnh báo **không có nguồn**
- ❌ **quy kết một cá nhân là tội phạm** từ một báo cáo → dùng "Yêu cầu này có
  dấu hiệu thường gặp trong các vụ lừa đảo"
- ❌ **trách móc người dùng** — không "sao bác lại tin?", không "bác đã sai rồi"
- ❌ tuyên bố **"WCAG compliant"** trước khi chạy đủ kiểm tra tự động + thủ công
  → nói "mục tiêu WCAG 2.2 AA"
- ❌ gán số liệu eval cho **model chưa hề được gọi**. Model đang cấu hình cho máy
  chủ là chuyện khác với model đã tạo ra con số.
- ❌ gọi bản dựng là **"đã đo"** khi mới chỉ là **mục tiêu**. `eval/results/latest.json`
  là thứ `/transparency` đọc để biết số nào ĐÃ ĐO.

---

## §FE0 — BỐN LỖI GIAO DIỆN DỰ ÁN NÀY ĐÃ CẮN, ĐỌC TRƯỚC KHI DỰNG

Bốn lỗi dưới đây đều **đã xảy ra thật**, đều **CI xanh lúc xảy ra**, và đều gây
hỏng đúng nhóm người dùng cần được bảo vệ nhất. Đây không phải lo xa.

**1. Nướng chữ vào ảnh — quay lại BA lần.** Lần thứ ba có **5 màn chào ship dưới
dạng bitmap**: tiêu đề, nội dung, nhãn nút đều là pixel; chữ thật đẩy sang
`.visually-hidden`; bên trên là 9 `<button>` rỗng ruột đè lên. 139/139 test xanh.
Hậu quả không phải xấu — hậu quả là **nút chỉnh cỡ chữ mất tác dụng đúng ở dòng
chữ to nhất trang**, tức hàng rào tiếp cận quan trọng nhất bị vô hiệu.
→ **Nhãn nút phải là chữ thật trong HTML.** Icon không bao giờ đứng một mình.

**2. `white-space: nowrap` trên nút.** Đo ở khổ 320px bậc chữ lớn nhất: nhãn
*"Người thân dùng số mới"* cần 277px trong hộp 174px → **19 phần tử bị cắt cụt**
trên một màn, gồm cả ô nhập và dòng dặn "đừng nhập mã OTP". Chính **tên sản phẩm**
cũng cụt trên 6/7 màn.
→ **Cấm `nowrap` trên mọi phần tử bấm được.** Nhãn tiếng Việt dài hơn tiếng Anh
~30%; và có nhãn tiếng Anh còn dài hơn tiếng Việt (*"Impersonation detection"* vs
*"Phát hiện giả mạo"*) nên đừng ghim số cột lưới theo một ngôn ngữ — dùng
`auto-fit` + `minmax(min(…, 100%), 1fr)`.

**3. `min-height` không có tác dụng trên hộp `inline`.** Sàn vùng chạm khai đúng
70px mà phần tử vẫn cao 49px, vì thẻ `<a>` rơi về `display: inline`.
→ Sàn vùng chạm phải đi kèm `display: grid` (hoặc `flex`), và dùng
`min-block-size: max(52px, …)`. **Một sàn khai mà không có hiệu lực còn tệ hơn
không khai** — nó làm người đọc CSS tưởng chỗ đó đã được bảo vệ.

**4. Sáu quy tắc ở năm file cùng tranh nhau một thuộc tính.** Vá một dòng chữ mất
bốn lượt sửa sai chỗ, vì quy tắc thắng nằm ở file thứ năm.
→ **Bản 24 giờ chỉ có MỘT file CSS ứng dụng** (cộng một file sàn tiếp cận nạp sau
cùng). Đừng thêm file mỗi lần cần sửa gấp — đó chính là cách 21 file CSS ra đời.

> **Luật chung rút ra:** mọi số đo phải kiểm **trên trình duyệt**, ở **3 bậc cỡ
> chữ × khổ 320/375/768/1280 × cả hai ngôn ngữ**. Test tĩnh không nhìn thấy bố cục.

---

### 3.0 ⚠️ CHẾ ĐỘ 24 GIỜ — ĐỌC TRƯỚC 3.1

Các skill dưới đây viết cho công việc bình thường, nơi một cổng dừng-chờ-duyệt là
rẻ. **Trong 24 giờ nhốt kín thì nó giết lịch trình:** §2B.2 có 18 hạng mục build;
mười tám lần dừng chờ duyệt là không kịp tầng 1.

| Skill | Trong bản 24 giờ |
|---|---|
| `superpowers:brainstorming` | **BỎ cổng chờ duyệt.** Thiết kế đã chốt trong file này. Chỉ gọi khi gặp quyết định file này KHÔNG nói tới — và khi đó hỏi bằng **một câu**, không dựng cả phiên thiết kế |
| `superpowers:test-driven-development` | **GIỮ, nhưng CHỈ cho TẦNG 0** (bộ luật · 10 override · sàn nhãn · scope/negation · 4 ca bẫy §C.3). Tầng 1 và 2 nghiệm thu bằng số đo trình duyệt ở §10 |
| `superpowers:verification-before-completion` | **GIỮ nguyên.** Rẻ nhất, đắt giá nhất |
| `superpowers:systematic-debugging` | Gọi khi một bug tốn quá 15 phút. Không gọi cho mọi bug |
| Skill giao diện (`ui-ux-pro-max` · `impeccable` · `design-system` · `frontend-design`) | **Gọi đúng MỘT lần**, đầu tầng 1, để chốt bố cục. Không gọi lại cho từng màn |
| `/code-review` · `/security-review` · `/simplify` | **Chạy đúng MỘT lượt ở giờ 16–18**, trước khi đóng băng |

**Hai thứ không bao giờ bỏ, dù chạy ở công cụ nào:**

1. Test tầng 0 phải **ĐỎ trên bản chưa sửa** trước khi làm xanh — và **nói ra số ca đỏ**.
2. **Không báo "xong" khi chưa có số đo.** `npm test` xanh và HTTP 200 đều không
   chứng minh giao diện đúng, cũng không chứng minh tầng AI đang sống.

### 2B.3 Hai mươi màn hình + hash route

Mọi màn là một `<section class="view">` trong **một** `public/index.html`, điều
hướng bằng hash. Không SPA framework, không router thư viện.

| Hash | Màn | Tầng | Vai trò |
|---|---|---|---|
| `#nguoi-than` | **Trang người thân (khổ máy tính)** | **1** | **Xem §14.** Mặc định khi bề rộng ≥900px. Bàn ứng phó của người con: kiểm hộ · Nói gì với bố mẹ · hộp cảnh báo · cài đặt hộ · trung tâm quyền. **KHÔNG hiển thị nội dung thô của bố mẹ.** |
| `#khan-cap` | Màn một câu hỏi | **1** | `start_url`. 4 nút lớn, nút thứ 4 khác màu + tách khoảng trắng. Có dòng "Tôi chỉ muốn xem hướng dẫn" dẫn vào trang chủ. |
| `#kiem-tra` | Nhập / dán / tải ảnh | **1** | Một ô nhập duy nhất. **Tự nhận diện loại** — không bắt chọn danh mục. |
| `#duoc-bao-ve` | Bác đang được bảo vệ | **1** | `PROTECTED_CRITICAL`. Bỏ nav. 3 điều KHÔNG làm (chữ tĩnh, **không checkbox**) · nút GỌI [TÊN THẬT + QUAN HỆ] · "Tôi đã chuyển tiền rồi" khác màu · lối thoát "Tôi ổn". **Không linh vật, không đếm ngược, không phủ đỏ toàn màn.** Tự đọc to khi vào. |
| `#chuyen-khoan` | Tôi sắp chuyển tiền | **1** | Đối chiếu quy tắc gia đình. |
| `#vua-chuyen-tien` | Tôi đã chuyển tiền rồi | **1** | Vào `RECOVERY`. Không đếm ngược, không trách móc. |
| `#goi-ngan-hang` | Trợ lý cuộc gọi ngân hàng | **1** | Chữ cực lớn. Câu đọc trước + số liệu sẵn trên màn. "Đã gọi xong" → ghi timeline. |
| `#trang-chu` | Trang chủ đầy đủ | **1** | |
| `#thoat-cuoc-goi` | Có người đang gọi tôi | **1** | Câu từ chối, cách cúp máy. |
| `#xac-minh` | Đường xác minh | 2 | Theo loại tình huống, ưu tiên kênh chính thức. |
| `#canh-bao` | Cảnh báo / kết quả | **1** | Phiếu tin cậy. |
| `#kiem-tra-lien-ket` | Kiểm tra link/QR | 2 | Deterministic trước, AI sau. **Không tự mở link.** |
| `#hanh-trinh` | Vụ việc + dòng thời gian | 2 | 8 giai đoạn, dự đoán bước tiếp. |
| `#lich-su` | Lịch sử | 2 | |
| `#bang-chung` | Trung tâm bằng chứng | 2 | "Giữ lại toàn bộ những gì bác vừa đưa cho Khoan Đã". |
| `#bao-cao` | Báo cáo thủ đoạn | 2 | **Chỉ nhận tactic, không nhận danh tính cá nhân.** |
| `#gia-dinh` | Vòng tròn gia đình | 2 | 4 vai trò, thu hồi, audit. |
| `#bao-ve-thiet-bi` | Thiết bị có thể bị theo dõi | **1** | Khai đã cài app lạ / chia sẻ màn hình → màn này hiện **đầu tiên**. |
| `#ho-tro` | Danh bạ hỗ trợ | 2 | Mỗi mục có nguồn + ngày + nút báo số sai. |
| `#huong-dan` | Học hỏi | 2 | Nơi **được** dùng linh vật. |
| `#quyen-rieng-tu` | Quyền riêng tư | 2 | Xuất / xoá dữ liệu. |
| `#onboarding` | Onboarding | 2 | Chọn xưng hô. **Câu bất biến 7.2 nêu ở đây, trước cả tính năng.** |

Phụ trợ (không phải view): `#situation` · `#tin-nhan-la` · `#toast`.

### 2B.4 Design tokens — `tokens.css`, 119 token, 15 nhóm

Làm **trước mọi CSS khác**. Đây là nguồn sự thật cho màu, thang chữ, khoảng
cách, vùng chạm.

**BẢNG MÀU: TÍM LOANG — chốt 14/8/2026.**

> ⚠️ **Đọc kỹ trước khi dựng, vì đây là chỗ dễ hiểu nhầm.** Kho mã tham chiếu
> **đã là tím sẵn** — `tokens.css` dùng OKLCH hue **292/298** (tím/violet), không
> phải xanh. Chữ "Trust Blue" trong `README.md` và `theme_color: #155eef` trong
> manifest là **hai mẩu lạc hậu còn sót**, không phản ánh bảng màu thật.
>
> Việc cần làm **không phải** đổi tím — mà là **(a)** thêm dải **loang**,
> **(b)** dọn ba mẩu lam còn sót.

Viết bằng **OKLCH**, không phải hex. Lý do không phải sở thích: OKLCH giữ độ
sáng cảm nhận đều nhau khi đổi hue, nên hạ/nâng một bậc là dự đoán được — hex
thì không. Toàn bộ giá trị dưới đây đã đo tương phản trên **cả ba stop** của dải
loang, ngày 14/8/2026.

```css
:root {
  /* ---- Nền và mặt ---- */
  --color-paper:     oklch(98%   0.012 298);  /* #f9f7ff */
  --color-surface:   oklch(99.4% 0.004 298);  /* #fdfdff — mặt thẻ */
  --color-surface-2: oklch(96.2% 0.022 298);  /* #f4f0ff — thẻ chìm */

  /* ---- Chữ ---- */
  --color-ink:   oklch(20% 0.065 285);  /* #141032 — 14,66:1 ở stop tối nhất */
  --color-ink-2: oklch(39% 0.06  285);  /* #424064 —  7,84:1 */
  --color-muted: oklch(51% 0.04  285);  /* #63637d —  4,67:1 ← sát sàn, đừng nhạt thêm */

  /* ---- Tím thương hiệu ---- */
  --color-accent:       oklch(52% 0.22 292);  /* #723fd9 — 4,92:1 ở stop tối nhất */
  --color-accent-hover: oklch(45% 0.23 292);  /* #601dc6 */
  --color-accent-soft:  oklch(93% 0.055 298); /* #ece1ff — NỀN, cấm đặt chữ lên */

  /* ---- Ba mức rủi ro. Màu là phụ; chữ + biểu tượng mới là chính (§4.4) ---- */
  --color-danger:  oklch(45% 0.19 25);   /* #a50013 — "Nguy hiểm cao" */
  --color-warning: oklch(46% 0.11 78);   /* #794e00 — "Nghi ngờ" */
  --color-success: oklch(42% 0.11 155);  /* #005e31 — "Chưa thấy dấu hiệu rủi ro" */

  /* ---- BA STOP CỦA DẢI LOANG ---- */
  --color-onboarding-canvas-top:    oklch(98% 0.012 298);  /* #f9f7ff */
  --color-onboarding-canvas-mid:    oklch(96% 0.030 298);  /* #f4eeff */
  --color-onboarding-canvas-bottom: oklch(93% 0.045 298);  /* #ebe2ff ← MỐC SÀN */

  --gradient-paper:
    radial-gradient(120% 80% at 15%  0%, var(--color-onboarding-canvas-mid)    0%, transparent 60%),
    radial-gradient(100% 70% at 85% 15%, var(--color-onboarding-canvas-bottom) 0%, transparent 55%),
    linear-gradient(180deg, var(--color-onboarding-canvas-top) 0%, var(--color-onboarding-canvas-mid) 100%);
}

body {
  background-color: var(--color-paper);      /* lót: gradient hỏng thì vẫn ra tím nhạt */
  background-image: var(--gradient-paper);
  background-attachment: fixed;              /* dải KHÔNG trôi theo cuộn */
  background-repeat: no-repeat;
}
```

**`background-attachment: fixed` là bắt buộc, không phải thẩm mỹ.** Dải mà trôi
theo cuộn thì nền đổi màu ngay dưới chân chữ đang đọc — đúng cách làm chữ khó
đọc với người mắt kém.

**Stop tối nhất `#ebe2ff` là MỐC mà mọi sàn tương phản phải đạt**, vì chữ có thể
rơi trúng bất kỳ điểm nào của dải. Đo được ở stop đó:

| Token | Trên `#ebe2ff` | Sàn |
|---|---:|---|
| `--color-ink` | 14,66:1 | 4,5 ✓ |
| `--color-ink-2` | 7,84:1 | 4,5 ✓ |
| `--color-muted` | **4,67:1** | 4,5 ✓ *(sát sàn)* |
| `--color-accent` | 4,92:1 | 4,5 ✓ |
| `--color-danger` | 6,46:1 | 4,5 ✓ |
| `--color-rule` | **2,96:1** | 3,0 ✗ **PHẢI SỬA** |

**Làm stop cuối tối thêm một bậc là `--color-muted` và `--color-rule` trượt sàn.**

### Ba mẩu lam còn sót — dọn cùng lúc với việc thêm dải loang

| Chỗ | Đang là | Đổi thành | Vì sao |
|---|---|---|---|
| `--color-rule` | `oklch(62% 0.035 298)` | **`oklch(60% 0.04 298)`** | 2,96:1 ở stop tối nhất, hụt sàn viền. Ở 60% là **3,22:1**. |
| `--color-border-tinted` | `oklch(60% 0.055 **240**)` | **`oklch(60% 0.055 298)`** | hue 240 = lam, lạc giữa 292/298. Sau đổi: **3,24:1** |
| `--color-border-interactive` | `oklch(58% 0.09 **250**)` | **`oklch(58% 0.09 292)`** | nt. Sau đổi: **3,55:1** |

Hai token viền **không dùng làm chữ hay nền ở bất kỳ đâu** (ghi rõ trong comment
của `tokens.css`), nên đổi hue là an toàn.

Và ba nơi ngoài CSS — quên thì thanh trạng thái điện thoại vẫn xanh trong khi
app đã tím:

```json
// public/manifest.webmanifest
"theme_color":      "#723fd9",
"background_color": "#f9f7ff"
```

```html
<!-- public/index.html, trong <head> -->
<meta name="theme-color" content="#723fd9">
```

Biểu tượng PWA cũng phải vẽ lại theo tím — §7, nhớ ràng buộc **icon không chứa chữ**.

⚠️ **Sau khi áp dải loang, `npm test` xanh KHÔNG đủ.** `test/contrast.test.js`
tính trên `--color-paper` phẳng, nó **không biết** nền đã thành gradient. Phải đo
tay trên trình duyệt ở cả ba bậc chữ × 5 khổ màn hình, và ở **vùng tối nhất của
dải** — xem §10.

| Nhóm | Số | Bắt buộc |
|---|---|---|
| `--color-*` | 56 | Ba màu mức rủi ro như trên. Tương phản chữ **4.5:1**, viền **3:1**. |
| `--space-*` | 17 | |
| `--text-*` | 9 | `--text-xs` **≥ 14px** ở gốc 17px |
| `--ease-*` | 6 | tôn trọng `prefers-reduced-motion` |
| `--radius-*` | 5 | |
| `--leading-*` | 5 | **không dưới 1.25** — dấu tiếng Việt xếp cả trên lẫn dưới |
| `--duration-*` / `--dur-*` | 5 / 3 | |
| `--shadow-*` | 3 | |
| `--root-*` | 3 | ba bậc chữ **A / A+ / A++**, gốc nhỏ nhất **15px** |
| `--touch-target` | 1 | **52px** |
| `--touch-target-primary` | 1 | **`max(56px, 3.5rem)`** — không phải `3.5rem` trần |
| `--font-display` / `--font-body` | 2 | `"Inter Variable", "Be Vietnam Pro", system-ui, sans-serif` |
| `--reading-*` `--content-*` `--bottom-*` | 3 | |

⚠️ `--touch-target-primary`: ở bậc chữ nhỏ nhất (15px) thì `3.5rem` chỉ ra
**52,5px** — vi phạm sàn nút chính. Phải dùng `max()`.

⚠️ Font phục vụ **cục bộ** qua express static từ `node_modules/@fontsource*`.
**Không** link `fonts.googleapis.com` / `gstatic.com` — mâu thuẫn với câu "dữ
liệu của bác nằm trên máy của bác" và làm hỏng chế độ ngoại tuyến.

## §6 — HỢP ĐỒNG GIAO DIỆN

### 6.5 Thang can thiệp 5 mức

| Mức nội bộ | Nhãn rủi ro | Điều kiện | Người dùng thấy |
|---|---|---|---|
| `TRUST_RECEIPT` | Chưa thấy dấu hiệu rủi ro | mọi lần phân tích | Phiếu tin cậy |
| `VERIFY_PATH` | Nghi ngờ | 20–44 | Đường xác minh + hotline đã kiểm chứng |
| `PAUSE_60S` | Nguy hiểm cao | 45–69 | Đếm ngược 60s, câu từ chối, nút gọi người thân |
| `PROTECTED_CRITICAL` | Nguy hiểm cao | **chỉ** critical override | Bỏ nav, 3 điều không làm, GỌI [TÊN], lối thoát |
| `RECOVERY` | — | người dùng tự khai đã chuyển | Trợ lý gọi NH, checklist, bảo vệ 72h |

### 6.6 Máy trạng thái frontend (17.6) — **CHƯA CÓ, xem hạng mục 6**

Trạng thái hợp lệ: `EMERGENCY_HOME · CAPTURE · ANALYZING · CLARIFYING ·
RESULT_LOW · RESULT_SUSPICIOUS · PAUSE_60S · PROTECTED_CRITICAL · RECOVERY ·
OFFLINE_DEGRADED · ERROR_RECOVERABLE`.

- Chuyển trạng thái phải nằm trong **một** module reducer. Không để DOM event
  handler tự đổi nhiều màn độc lập.
- Mỗi state có `enter()` / `exit()`. Countdown, speech synthesis, media stream
  và `AbortController` **phải dừng khi exit**.
- Nút Back phải map rõ state; không quay từ recovery vào màn critical cũ.
- **Đổi ngôn ngữ KHÔNG phải là một transition.** Bấm VI↔EN giữ nguyên state hiện
  tại và toàn bộ dữ liệu của nó: SafetyCase, nội dung đã nhập, countdown đang
  chạy, trusted contact đã chọn, kết quả phân tích. **Không reset state, không
  gửi lại request, không chạy lại AI chỉ vì đổi locale** (19.2). Trust Receipt
  localize từ **reason code**, nên đổi ngôn ngữ không thể làm đổi lý do đã quyết.

### 6.15 Metadata ngôn ngữ trên giao diện (18.19)

- `<html lang="vi">` mặc định; **đổi thành `lang="en"` khi người dùng chuyển EN**,
  và đổi lại khi quay về. Screen reader đọc sai ngôn ngữ là lỗi tiếp cận thật.
- Text resize **200% zoom trình duyệt** + ba bậc A/A+/A++ **không cắt chữ, không
  giấu điều khiển**.
- Mọi hành động tương tác **tới được bằng bàn phím** và có focus nhìn thấy rõ.
- Tiêu đề có cấp bậc ngữ nghĩa, label đầy đủ, thông báo trạng thái được đọc lên.
  **Rủi ro không được truyền đạt chỉ bằng màu.**
- Copy lỗi ngắn, có hành động, **không lộ stack trace hay chi tiết nhà cung cấp**.
- Plain English: **một hành động một câu**; tránh thuật ngữ như *"heuristic"*,
  *"credential exfiltration"* trong giao diện người dùng.
- Không giả định sản phẩm ngân hàng, cấu trúc gia đình, quy trình cảnh sát hay
  đơn vị tiền tệ của một nước cụ thể **trừ khi country profile đã được chọn**.

---

## §7 — ẢNH VÀ ICON

### 7.4 Ràng buộc cho MỌI ảnh sinh ra

- **Icon là icon — KHÔNG chứa chữ.** Model rất hay tự thêm nhãn chữ vào icon;
  phải nói rõ trong lời nhắc là *không có chữ*. Chữ trong ảnh ⇒ nút A/A+/A++
  không phóng được.
- **Icon truyền đạt rủi ro phải LUÔN đi kèm chữ thật trong HTML**, không bao giờ
  đứng một mình — người cao tuổi có tỉ lệ mù màu và đục thuỷ tinh thể cao.
- Phải đọc được ở **24px**, rõ ở cả nền sáng lẫn nền tối.
- Tương phản viền với nền **≥ 3:1** — `test/non-text-contrast.test.js` sẽ chặn.
- **Nén sang `.webp`** trước khi commit (`scripts/nen-anh.cjs`). Bản `.png` gốc
  đã bị `.gitignore` chặn vì nặng ~1,4 MB/ảnh.
- Ảnh minh hoạ kẹp bằng `rem` và kẹp **`max-block-size`**, KHÔNG kẹp chiều rộng.
  Ảnh trong `assets/onboarding-*` là ảnh dọc 942×1672 — kẹp theo chiều rộng thì
  ở bậc A++ vẫn cao 355px trên màn 640px và đẩy nút ra ngoài 60px.

### 7.5 Linh vật — nơi được và không được

**KHÔNG đặt linh vật ở màn `#khan-cap` và màn "Bác đang được bảo vệ".** Hai màn
đó phải trống, chỉ còn việc cần làm. Linh vật chỉ dùng ở phần học hỏi, mẹo định
kỳ và onboarding.

### 7.6 ⚠️ Chỗ dự án đã hỏng BA LẦN — đọc kỹ

Lỗi chữ-nướng-vào-ảnh quay lại **ba lần**, CI xanh **cả ba lần**. Lần thứ ba có
**5 màn chào ship dưới dạng bitmap**: tiêu đề, nội dung, nhãn nút đều là pixel,
chữ thật đẩy sang `.visually-hidden`, bên trên là 9 `<button>` rỗng ruột đè lên
— 139/139 test vẫn xanh.

Hậu quả không phải xấu giao diện. Hậu quả là **nút chỉnh cỡ chữ mất tác dụng
đúng ở dòng chữ to nhất trang** — hàng rào tiếp cận quan trọng nhất bị vô hiệu,
với đúng nhóm người dùng cần nó nhất.

**TUYỆT ĐỐI KHÔNG:**
- cắt ảnh làm nền cho một màn hình
- đặt `<button>` rỗng ruột, trong suốt, đè lên ảnh
- đẩy chữ thật xuống `.visually-hidden` rồi để ảnh gánh phần nhìn
- đo ảnh bằng `dvh` / `vh` / `vw`

Mọi chữ người dùng đọc **PHẢI là chữ thật trong HTML**, phóng được bằng A/A+/A++.
Nhãn nút phải là chữ trong thẻ.

**KHI ẢNH THAM CHIẾU MÂU THUẪN VỚI RÀNG BUỘC TIẾP CẬN — RÀNG BUỘC THẮNG.**
Ví dụ ảnh vẽ nút cao 40px, nút chỉ có icon không chữ, chữ nhỏ hơn 14px: **không
làm theo ảnh**. Dừng lại, báo rõ chỗ mâu thuẫn, đề xuất cách giữ tinh thần thiết
kế mà vẫn đạt ngưỡng.

### 7.9 Ảnh minh hoạ lấy từ thư mục này phải kẹp đúng cách

Ảnh đợt 27/7 và 3/8 là ảnh **dọc 941×1672**. Kẹp theo chiều rộng thì ở bậc A++
vẫn cao 355px trên màn 640px và **đẩy nút ra ngoài 60px**.

**Kẹp `max-block-size` bằng `rem`, KHÔNG kẹp chiều rộng, KHÔNG dùng `dvh`/`vh`/`vw`.**
Nén sang `.webp` trước khi commit (`npm run nen-anh`) — bản `.png` gốc ~1,5–2,4 MB
mỗi ảnh và đã bị `.gitignore` chặn.

---

## §9 — ĐẶC TẢ MÀN HÌNH

### 9.2 Câu bất biến chống mạo danh chính Khoan Đã

Hễ một thương hiệu chống lừa đảo được người cao tuổi biết tới, kẻ lừa đảo sẽ dùng
chính cái tên đó. Rủi ro này **lớn dần theo mức độ thành công của sản phẩm**.

Dòng cố định ở chân **mọi** màn, trong Phiếu tin cậy, và nêu **trong onboarding
trước cả khi giới thiệu tính năng** — nguyên văn:

> "Khoan Đã không bao giờ chủ động gọi điện hoặc nhắn riêng để yêu cầu thao tác
> nhạy cảm. Không bao giờ xin tiền, mã OTP, mật khẩu hay yêu cầu cài thêm ứng
> dụng. Ai tự xưng là nhân viên Khoan Đã và yêu cầu thao tác nhạy cảm, bác hãy
> dừng lại và xác minh qua kênh chính thức."

Kèm **một câu** giới hạn trách nhiệm, viết dễ hiểu, **không phải văn bản pháp lý**:

> "Khoan Đã hỗ trợ nhận diện dấu hiệu lừa đảo. Khoan Đã không thay quyết định của
> bác, và không bảo đảm phát hiện được mọi hình thức lừa đảo."

Ca kiểm thử: *"cháu là nhân viên Khoan Đã, bác cài giúp app"* → bật
`ID_KHOAN_DA_IMPERSONATION`. Cả hai câu phải hiện ở cả hai ngôn ngữ và **không bị
cắt chữ** ở bậc A++ / khổ 320px.

⚠️ **KHÔNG tự nâng tín hiệu này thành critical override thứ 11.**

### 9.6 Trợ lý cuộc gọi ngân hàng

Đối thủ đưa cái số hotline rồi dừng — mà đó mới đúng là lúc nạn nhân sụp đổ.

Nút "Gọi ngân hàng" **không** dẫn tới trình quay số mà tới màn đồng hành:

- Câu mở đầu soạn sẵn, đọc được ngay
- **Bốn số liệu chữ cực lớn**: số tiền · thời điểm · tài khoản nhận · mã giao dịch
- Bấm "Đã gọi xong" → ghi vào dòng thời gian vụ việc = hồ sơ trình báo sau này

⚠️ **Màn này KHÔNG che số.** Quy tắc chung: *che khi dữ liệu RỜI khỏi máy; không
che khi chỉ hiện trên máy của chính chủ.* Đây là màn sinh ra để **đọc số cho tổng
đài** — người vừa mất tiền, tay run, không nhớ nổi. Che ở đây là làm hỏng đúng
mục đích của màn.

Trường chưa nhập hiện *"bác chưa nhập — nói với tổng đài là bác sẽ đọc sau"*,
tuyệt đối không in `xxx` hay `****`.

Số tổng đài **chỉ** lấy từ `public/config/support-directory.json`, mỗi mục kèm
nguồn + ngày kiểm. Chưa xác minh được thì **không render nút gọi**, thay bằng
*"Khoan Đã chưa xác minh được số tổng đài của ngân hàng này. Bác lấy số in ở mặt
sau thẻ."* **Cấm lấy số từ nội dung người dùng gửi lên. Cấm để model sinh số.**

### 9.7 Ba chế độ hỗ trợ người ít dùng công nghệ

**Cảnh báo thiết bị có thể bị theo dõi — P0.** Người dùng khai đã cài app lạ, đã
bật Trợ năng, hoặc đã chia sẻ màn hình → màn hình **đầu tiên** hiện:
*"Điện thoại của bác có thể đang bị theo dõi. Bác hãy dùng điện thoại của người
thân để tiếp tục."*

**Chế độ siêu đơn giản — P1.** KHÔNG phải màn riêng, mà là **biến thể hiển thị của
`#khan-cap`**: giữ đủ **bốn** nút, chỉ ẩn nav, nút cao 104px, chữ 26px. Bật mặc
định khi khai tuổi ≥70 hoặc người con bật hộ; tắt được trong cài đặt.
⚠️ Bỏ bớt xuống hai nút là **cắt mất luồng phục hồi** — không làm.

**Giọng nói — P1.** Nhận sai thì **hiện văn bản đã nghe cho sửa, không im lặng
đoán**. Từ chối quyền micro phải có lối gõ chữ thay thế. Giọng nói đi qua **cùng
sàn §4.3**: transcript rỗng ⇒ không được ra nhãn thấp.

### 9.8 Quyền cuối thuộc về người cao tuổi

Toàn bộ thiết kế mặc định gia đình là an toàn. Nhưng **dạng lạm dụng tài chính
người cao tuổi phổ biến nhất lại do chính người trong nhà gây ra**. Nếu người cài
hộ là người có vấn đề, sản phẩm này biến thành **công cụ giám sát tài chính trao
cho đúng người không nên có**, kèm cả danh sách người thân và thói quen chi tiêu.

Bốn ràng buộc, dựng **từ dòng code đầu tiên**, không vá sau:

1. Chủ tài khoản **thu hồi được mọi quyền của mọi thành viên, bất cứ lúc nào,
   KHÔNG cần** mật khẩu hay xác nhận của người đã cài hộ
2. Bảng theo dõi cho người thân **MẶC ĐỊNH TẮT**; người cài hộ **không bật thay được**
3. Mỗi lần thành viên xem dữ liệu ghi một bản ghi mà **chính người xem không xoá được**
4. **Không hiển thị số tiền chính xác** cho thành viên — chỉ khoảng giá trị

Đây vừa là ràng buộc đạo đức vừa là **slide mạnh nhất** của phần quyền riêng tư.
Giám khảo chắc chắn hỏi *"thế nếu chính người con là kẻ lạm dụng thì sao?"* — bốn
dòng trên là câu trả lời, và nó chỉ có sức nặng khi đã dựng sẵn.

### 9.9 Lối ra bắt buộc

Mức `PROTECTED_CRITICAL` bỏ hết điều hướng, **nhưng luôn phải có** dòng
*"Tôi ổn, không có gì nguy hiểm"* ở cuối màn.

Lý do kỹ thuật: bộ luật báo động giả mà người dùng bị kẹt trong màn khẩn cấp thì
sẽ hoảng và gỡ ứng dụng.

Lý do vận hành: mỗi lần bấm là **một mẫu dữ liệu báo động giả**. Ghi
`{ thời điểm, mã override, mức, điểm }` vào `localStorage`, tối đa 100 bản ghi,
**không lưu nội dung**.

⚠️ **KHÔNG dòng mã nào được đọc nhật ký này lúc chạy.** Nó chỉ để CON NGƯỜI đọc
khi hiệu chỉnh bằng tay giữa hai phiên bản. Ngưỡng 20/45 và mọi trọng số là hằng
số trong mã. **Không nhánh nào được hạ mức cảnh báo dựa trên hành vi của chính
người đang có thể bị thao túng.**

Bấm nút này **không xoá kết quả**; ghi `userDismissedAt`; quay lại trong 24 giờ
thì hiện lại màn bảo vệ.

---

## §14 — TRANG NGƯỜI THÂN: GIAO DIỆN MÁY TÍNH LÀ CỦA NGƯỜI CON

### 14.0 Vì sao có mục này

Bản trước dựng **một giao diện cho mọi người**, rồi kéo giãn ra cho vừa màn hình
máy tính. Kết quả là màn hình rộng không có lý do tồn tại: nó chỉ là bản điện
thoại phóng to.

Sự thật về người dùng thì khác hẳn:

| | Bố mẹ | Người con |
|---|---|---|
| Thiết bị | điện thoại, gần như luôn luôn | **máy tính, trong giờ làm việc** |
| Trạng thái | đang hoảng, tay run, có người thúc | đang bận, có 30 giây giữa hai cuộc họp |
| Việc cần làm | bấm **một** nút | đọc nhanh, gọi, và **biết phải nói gì** |

Nên: **khổ điện thoại phục vụ bố mẹ · khổ máy tính phục vụ người con.**
Cùng một URL, cùng một `index.html`, cùng một service worker.

Điều này cũng vá đúng lỗ hổng lớn nhất của sản phẩm: web app **không thể** tự bật
lên đúng lúc bố mẹ bị ép. Nhưng người con thì **đang ngồi trước máy tính cả ngày**
— và hành vi "bố mẹ chuyển tiếp cho con hỏi *cái này có thật không*" là hành vi
**đã có sẵn**, không phải hành vi phải dạy.

### 14.1 Trang người thân KHÔNG PHẢI bảng giám sát

Đây là ràng buộc đạo đức, không phải lựa chọn sản phẩm. Lý do nằm ở 7.3:
**dạng lạm dụng tài chính người cao tuổi phổ biến nhất là do chính người trong
nhà gây ra.** Nếu người cài hộ là người có vấn đề, một bảng giám sát đầy đủ biến
sản phẩm thành công cụ cho đúng người không nên có.

Nên trang này là **bàn ứng phó**, không phải bảng theo dõi. Nó làm đúng hai việc:

1. **Khi có cảnh báo** → giúp con gọi được, và biết nói gì
2. **Khi bố mẹ chuyển tiếp một tin lạ** → trả lời nhanh, kèm câu để nhắn lại

Năm ràng buộc dưới đây là **bất biến**, không được nới:

| # | Ràng buộc |
|---|---|
| 1 | **Mặc định KHÔNG chia sẻ gì cả.** Chưa có đồng ý của chủ tài khoản thì trang này trống, chỉ có phần cài đặt hộ |
| 2 | **Người cài hộ KHÔNG bật được** quyền theo dõi thay bố mẹ. Bật phải do chính máy bố mẹ xác nhận |
| 3 | **Chủ tài khoản thu hồi bất cứ lúc nào**, không cần đồng ý hay mật khẩu của người con |
| 4 | **Không bao giờ hiển thị nội dung thô** bố mẹ đã kiểm. Chỉ: thời điểm · mức · tối đa 3 nhãn dấu hiệu |
| 5 | **Số tiền chỉ hiện dạng KHOẢNG** (`DUOI_5TR`…), không bao giờ hiện con số chính xác |

Ràng buộc 4 quan trọng hơn nó nghe. Bố mẹ có thể đang kiểm một tin nhắn **rất
riêng tư** — lừa tình cảm, hoặc chuyện vay mượn trong nhà. Cho con đọc nguyên văn
là lấy đi phẩm giá của người mình đang bảo vệ, và sẽ khiến bố mẹ **thôi không dùng
app nữa**. Con thấy *"14:08 · Nguy hiểm cao · giả danh cơ quan · đòi chuyển tiền
· thúc ép"* là đủ để gọi.

### 14.2 Chọn vai — khổ màn hình là MẶC ĐỊNH, không phải khoá

```
Chưa ghép cặp:
  bề rộng ≥ 900px  →  mặc định #nguoi-than
  bề rộng < 900px  →  mặc định #khan-cap

Đã ghép cặp (quét QR xong):
  vai lưu trong localStorage, bề rộng KHÔNG còn quyết định nữa
```

Bắt buộc: **luôn có công tắc nhìn thấy được** ở góc trên — `Tôi là bố mẹ | Tôi là
người thân` — và lựa chọn được nhớ lại. Lý do: con có thể mở trên điện thoại, bố
mẹ có thể dùng máy tính bảng. Đoán sai vai mà không cho đổi là **nhốt người đang
hoảng vào màn hình quản trị**.

⚠️ Cấm suy vai từ user-agent, từ IP, hay từ ngôn ngữ hệ thống. **Chỉ bề rộng, và
chỉ như một mặc định.**

### 14.3 Bố cục — MỘT trang, năm khối, không điều hướng

Route: `#nguoi-than`. Không menu, không tab, không trang con. Người con cuộn một
lần là thấy hết.

```
┌─ A. THANH TRẠNG THÁI ────────────────────────────────────────┐
│  Bình thường:  "Chưa có cảnh báo nào."                        │
│  Có việc:      "⚠️ Mẹ đang ở màn hình bảo vệ — 14:08"         │
│                [ GỌI MẸ NGAY ]                                │
└──────────────────────────────────────────────────────────────┘
┌─ B. KIỂM HỘ  ← việc dùng hằng ngày, đặt CAO NHẤT ────────────┐
│  [ Dán tin nhắn bố mẹ vừa chuyển tiếp cho bạn... ]            │
│  → nhãn + tối đa 3 dấu hiệu + phần "chưa kiểm được"          │
│  → NÓI GÌ VỚI BỐ MẸ  (14.5)                                   │
└──────────────────────────────────────────────────────────────┘
┌─ C. HỘP CẢNH BÁO ────────────────────────────────────────────┐
│  Thẻ mỗi cảnh báo: thời điểm · mức · ≤3 nhãn dấu hiệu         │
│  [ GỌI NGAY ]  [ 3 câu nên nói ]  [ Tôi đã gọi được rồi ]     │
│  KHÔNG có nội dung thô. KHÔNG có số tiền chính xác.           │
└──────────────────────────────────────────────────────────────┘
┌─ D. CÀI ĐẶT HỘ ──────────────────────────────────────────────┐
│  hồ sơ bố mẹ · xưng hô · tối đa 3 liên hệ · MỘT quy tắc       │
│  → sinh mã QR để bố mẹ quét một lần                           │
└──────────────────────────────────────────────────────────────┘
┌─ E. TRUNG TÂM QUYỀN ─────────────────────────────────────────┐
│  Bố mẹ đang chia sẻ: <liệt kê từng mục> · hết hạn: <ngày>     │
│  "Bố mẹ có thể thu hồi bất cứ lúc nào mà không cần bạn        │
│   đồng ý. Bạn không bật được quyền thay bố mẹ."               │
│  Nhật ký truy cập — bạn KHÔNG xoá được các dòng này.          │
└──────────────────────────────────────────────────────────────┘
```

Thứ tự này cố ý: **B nằm trên C.** Cảnh báo thì hiếm; chuyển tiếp hỏi hộ thì
thường xuyên. Đặt việc hiếm lên đầu là làm trang này thành trang chết.

Khối E hiển thị **kể cả khi trống**, và câu trong đó là **chữ tĩnh, luôn hiện**.
Nó nói với người con rằng ranh giới này có thật — đó chính là điều làm sản phẩm
khác một app giám sát.

### 14.4 Cảnh báo tới nơi bằng cách nào

Thứ tự thử, rơi tầng chứ không hỏng:

```
1. Web Push  (nếu người con đã cấp quyền)          — P1
2. Trang đang mở → cập nhật ngay                    — P0
3. Không có gì ở trên → khi mở trang, đọc hàng đợi  — P0
```

**P0 chỉ cần tầng 2 và 3.** Tầng 1 là P1 — Web Push cần HTTPS, VAPID và quyền
trình duyệt, ba thứ dễ hỏng nhất trong 24 giờ.

Demo hai máy dùng **hotspot của chính đội**, không dùng wifi hội trường (wifi hội
trường thường bật client isolation, hai máy cùng mạng vẫn không thấy nhau). Dự
phòng: hai tab trên cùng một máy, đồng bộ bằng `localStorage` + sự kiện `storage`.

⚠️ **Không được ghi "đã gửi cho người thân" khi mới chỉ đẩy vào hàng đợi.** Ba
mức trạng thái, và mức thứ ba KHÔNG BAO GIỜ hiển thị:
`đã đẩy đi` · `người thân đã mở` · ~~`đã đọc và hiểu`~~.

### 14.5 "NÓI GÌ VỚI BỐ MẸ" — tính năng trung tâm của trang này

Người con biết đó là lừa đảo không khó. Cái khó là bốn thứ:
mẹ sẽ **thấy xấu hổ** nếu bị nói thẳng · mẹ **tin "chú công an" hơn tin con** ·
kẻ lừa đảo **đang nói** ở đầu dây bên kia · con **đang ở công ty**.

Sau mỗi kết quả từ mức `Nghi ngờ` trở lên, hiện đúng bốn thứ, sinh từ **bảng
TĨNH trong mã** theo họ kịch bản đã nhận ra. **Cấm để LLM sinh bốn trường này.**

| # | Nội dung | Ràng buộc |
|---|---|---|
| ① | **Tin nhắn gửi ngay** — có nút Chia sẻ | ≤200 chữ · không phán xét · **đúng MỘT hành động** |
| ② | **Ba câu nói khi gọi** | phải có một câu **đổ lỗi cho thủ đoạn, không đổ lỗi cho mẹ** |
| ③ | **Một câu để MẸ nói với kẻ lừa đảo** | cho bố mẹ lối thoát không phải đối đầu |
| ④ | **Số tổng đài chính thức để gọi lại** | từ `support-directory.json`, kèm nguồn + ngày. **Không có nguồn thì không hiện** |

Mẫu cho họ *giả danh cơ quan công quyền* — chép nguyên văn vào mã:

> **①** *"Mẹ ơi, con vừa kiểm tra rồi. Tin này giả mẹ ạ. Mẹ tắt máy giúp con, đừng bấm gì cả. Con gọi mẹ ngay bây giờ."*
>
> **②** *"Cái này lừa cả người trẻ mẹ ạ, chỗ con vừa có người mất tiền."* · *"Mẹ không làm gì sai cả, người ta cố tình làm mẹ sợ thôi."* · *"Con xử lý được, mẹ đừng nghe máy nữa nhé."*
>
> **③** *"Tôi không quyết định chuyện tiền một mình. Tôi sẽ gọi lại sau."*
>
> **④** Công an phường nơi cư trú · tổng đài ngân hàng in ở mặt sau thẻ

Câu ② thứ hai là câu quan trọng nhất trong toàn bộ tính năng. **Không câu nào
được trách móc bố mẹ** — người xấu hổ là người giấu chuyện, và người giấu chuyện
là người mất tiếp lần hai.

### 14.6 Xác thực cuộc gọi ngược

Con bấm `Tôi đang gọi cho mẹ` → máy bố mẹ hiện:

> **"Anh Minh Quân — con trai — vừa bấm gọi cho bác lúc 14:08 TỪ TRONG ỨNG DỤNG."**
> Khoan Đã không nhìn thấy cuộc gọi trên máy bác nên **không thể xác nhận ai đang
> gọi**. Bác hãy hỏi một chuyện chỉ hai mẹ con biết trước khi nói tiếp.

Hai câu, và câu thứ hai **bắt buộc cùng cỡ chữ với câu thứ nhất**. App không nhìn
thấy cuộc gọi đến — nói như thể nó bảo lãnh được danh tính là vi phạm §11.

Bố mẹ chưa cài gì thì rơi về **mã gia đình**: một từ hai mẹ con hẹn trước, app
nhắc người con chèn vào tin nhắn. Không cần công nghệ, và trung thực hơn mọi lời
hứa phát hiện giọng giả.

### 14.7 Phạm vi cho bản 24 giờ

| Khối | Ưu tiên | Ghi chú |
|---|---|---|
| B — Kiểm hộ + **Nói gì với bố mẹ** | **P0** | Bảng mẫu tĩnh, ~45 phút. Đây là đỉnh cảm xúc của demo |
| A — Thanh trạng thái | **P0** | Đọc từ hàng đợi cục bộ |
| C — Hộp cảnh báo | **P0** | Cục bộ; demo dựng sẵn 2 thẻ mẫu |
| 14.6 — Gọi ngược | **P0** | ~20 dòng |
| D — Cài đặt hộ (không QR) | **P0** | Form + localStorage |
| E — Trung tâm quyền | **P0** | Phần lớn là chữ tĩnh, và là slide đạo đức |
| D — sinh QR ghép cặp | P1 | |
| 14.4 tầng 1 — Web Push | P1 | Cắt đầu tiên nếu trễ |
| Xem hoạt động dạng thô của bố mẹ | **P2** | Cần máy chủ. Và cần cân nhắc lại 14.1 trước khi làm |

### 14.8 Test bắt buộc — viết ĐỎ trước

1. `#nguoi-than` **không hiển thị `noi_dung` thô** của bất kỳ lần kiểm nào — quét
   cả DOM lẫn payload cảnh báo
2. Cảnh báo chỉ mang **≤3 nhãn dấu hiệu** và số tiền **dạng khoảng**
3. Vai người con **không bật được** cờ chia sẻ; chỉ máy chủ tài khoản đặt được
4. Thu hồi quyền chạy được **không cần** bất kỳ trường xác nhận nào của người con
5. Không nơi nào hiển thị chuỗi `đã đọc và hiểu` hay tương đương
6. Bề rộng chỉ đặt **mặc định**; công tắc đổi vai luôn hiện và đi được **cả hai chiều**
7. Bốn trường của 14.5 đến từ **bảng tĩnh**; không đường nào cho LLM sinh chúng
8. Màn 14.6 luôn có **cả hai câu**, cùng cỡ chữ

---

## §10 — QUY TRÌNH BẮT BUỘC SAU MỖI HẠNG MỤC

```bash
npm test
```

```bash
npm run check
```

Nếu có đổi lời nhắc, đổi model, đổi registry, đổi trọng số hoặc đổi ngưỡng:

```bash
npm run eval && npm run eval:quocte
```

**Rồi mở `localhost:8089` và ĐO BẰNG SỐ, không tin mắt:**

- có phần tử nào **tràn ngang** không
- có hai phần tử nào **ĐÈ LÊN NHAU** không — dùng `element.checkVisibility()`,
  **không** dùng `offsetParent`. Một `<details>` đã đóng vẫn giữ hình chữ nhật cũ
  của con → báo chồng lấn giả.
- vùng chạm nào **< 52px**
- chữ nào **< 14px**
- chữ nào **bị cắt**

**Đo ở CẢ 3 BẬC CỠ CHỮ (A / A+ / A++) và 5 khổ màn hình: 320 · 360 · 375 · 768 ·
1280 px.** Rất nhiều lỗi chỉ xuất hiện ở A++ trên máy nhỏ. Đo **cả hai ngôn ngữ**.

**Đoạn đo — dán thẳng vào DevTools console.** Dùng khi công cụ không có trình
duyệt tích hợp. Chạy lại ở mỗi bậc chữ × mỗi khổ màn hình:

```js
(() => {
  const vis = el => el.checkVisibility?.({ contentVisibilityAuto: true,
    opacityProperty: true, visibilityProperty: true }) ?? false;
  const els = [...document.querySelectorAll('body *')].filter(vis);
  const r = el => el.getBoundingClientRect();

  const tran = els.filter(el => { const b = r(el);
    return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1); });

  const nho = els.filter(el => el.childNodes.length &&
    [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) &&
    parseFloat(getComputedStyle(el).fontSize) < 14);

  const cham = els.filter(el => {
    if (!el.matches('a,button,input,select,textarea,[role=button],[tabindex]')) return false;
    const b = r(el); return b.width > 0 && Math.min(b.width, b.height) < 52; });

  const cat = els.filter(el => el.scrollWidth > el.clientWidth + 1 &&
    getComputedStyle(el).overflowX !== 'auto' &&
    getComputedStyle(el).overflowX !== 'scroll');

  const de = []; const box = els.filter(el => r(el).width > 8 && r(el).height > 8);
  for (let i = 0; i < box.length; i++) for (let j = i + 1; j < box.length; j++) {
    if (box[i].contains(box[j]) || box[j].contains(box[i])) continue;
    const a = r(box[i]), b = r(box[j]);
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox > 4 && oy > 4) de.push([box[i], box[j]]);
  }

  console.table({
    'tràn ngang':      tran.length,
    'chữ < 14px':      nho.length,
    'vùng chạm < 52px': cham.length,
    'chữ bị cắt':      cat.length,
    'cặp đè lên nhau': de.length
  });
  return { tran, nho, cham, cat, de };
})();
```

**Cả năm số phải bằng 0.** Khác 0 thì biến trả về chứa đúng phần tử — soi bằng
`$0` hoặc `console.log(kq.tran)`.

Đổi bậc chữ và khổ màn hình bằng:

```js
document.documentElement.dataset.fontSize = 'small';   // 'small' | 'medium' | 'large'
```

### 10.1 Khi sửa xong mà trình duyệt không đổi

Đừng kết luận vội. Hai thủ phạm quen thuộc:

- **Service worker** đang phục vụ CSS/HTML cũ — gỡ SW và xoá cache.
- **HTTP cache** giữ `styles.css` (link không kèm query) — thay `<link>` bằng URL
  có `?bust=`.

Kiểm bằng cách so cái server trả về (`curl`) với cái trang đang **thật sự** dùng.

### 10.2 Trước khi sửa một thuộc tính CSS

**Dự án có 21 file CSS trong `public/`.** Một thuộc tính có thể bị khai ở sáu
chỗ khác nhau. **Liệt kê MỌI quy tắc chạm vào nó ở MỌI file, rồi mới sửa cái
thắng** — dùng `grep -rn "<thuộc-tính>" public/*.css` trước, đừng sửa ngay. Vá dòng
tagline mất bốn lượt sửa sai chỗ: `styles.css` đặt `display:none` dưới 30rem,
`khoan-da-2026.css` bật lại ở ba chỗ (một trong đó là quy tắc TOÀN CỤC kèm
`!important` nằm sau hai lần ẩn có chủ đích), cuối cùng `mobile-clay.css` thắng
bằng `:root body .topbar …`. **Sửa cái đầu tiên tìm thấy là sửa vào chỗ không có
tác dụng.**

Và: **`min-height` không có tác dụng trên hộp `inline`.** Một sàn khai mà không
có hiệu lực còn tệ hơn không khai — nó làm người đọc CSS tưởng chỗ đó đã được
bảo vệ.

### 10.3 Chỉ báo "xong" khi có SỐ ĐO

Không báo xong bằng "trông có vẻ ổn". Gọi `superpowers:verification-before-completion`.

---

## §12 — NHỮNG QUYẾT ĐỊNH CLAUDE KHÔNG ĐƯỢC TỰ THAY

Nếu thấy cần đổi, **dừng lại và hỏi**. Đừng làm rồi báo sau.

- ❌ Đổi framework / frontend stack / route chính
- ❌ Đổi ba nhãn rủi ro, thêm nhãn thứ tư, hay thêm nhãn "an toàn"
- ❌ Đổi số lượng critical override (đang là **10** ở canonical), ngưỡng
  **20/45**, cap **69**
- ❌ Đổi privacy model, hay bật đồng bộ máy chủ mặc định
- ❌ Thay Rule Engine bằng **"LLM judge"**, model ensemble, hay agent autonomous
- ❌ Tự hứa chặn cuộc gọi / chặn giao dịch ngân hàng
- ❌ Tự bật auto-alert thay chủ tài khoản
- ❌ Tự thu thập / scrape danh tính người bị tố lừa đảo. Ra-đa nhận **tactic /
  pattern**, không quy kết cá nhân từ một báo cáo.
- ❌ Dùng nội dung người dùng làm prompt instruction
- ❌ Cho model gọi tool / network trực tiếp trong đường risk analysis
- ❌ Tạo vector DB / RAG cho việc phát hiện lừa đảo
- ❌ Thêm cụm từ nào **hạ mức vô điều kiện**. Đã đo: thêm `"ch play"` vào danh
  sách tắt thì câu *"…đừng tải trên CH Play vì bản đó cũ"* làm tụt hẳn một kịch
  bản giả danh công an xuống mức thấp. **Bất kỳ cụm nào hạ mức vô điều kiện đều
  là một câu thần chú tặng cho kẻ lừa đảo** — cùng bài học với "please hold".
- ❌ Xoá `CLAUDE.md` hoặc chữ "Claude" khi nó chỉ Claude Code / coding agent
- ❌ Đổi image model sang Fable 5, hoặc dùng `gpt-image-1.5` trong đường risk

**Nếu một yêu cầu trong ảnh thiết kế mâu thuẫn với hợp đồng a11y/privacy/security
— HỢP ĐỒNG THẮNG.** Ghi lại conflict thay vì âm thầm làm theo ảnh.

---

