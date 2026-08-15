# KHOAN ĐÃ — RÀNG BUỘC THƯỜNG TRỰC

> Bốn khối dưới đây được **chép nguyên văn** từ `BACKEND.md` (§HĐ, §4, §11, §12).
> Không tóm tắt, không diễn đạt lại, không "tối ưu". File này được nạp lại mỗi
> lượt, còn prompt gốc sẽ trôi khỏi ngữ cảnh sau vài giờ.
>
> **Không sửa nội dung bốn khối này.** Muốn đổi thì dừng lại và hỏi người dùng.

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
