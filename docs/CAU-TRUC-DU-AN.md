# CẤU TRÚC DỰ ÁN — KHOAN ĐÃ

> **Khảo sát ngày 16/8/2026** trên nhánh `main`, commit gần nhất `b11b27b`.
> Mọi con số trong tài liệu này được **đọc từ mã nguồn hoặc chạy thật**, không
> chép lại từ tài liệu khác. Chỗ nào là suy đoán đều ghi rõ.
>
> Tài liệu này **mô tả hiện trạng**, không phải đặc tả. Đặc tả nằm ở
> `BACKEND.md` / `FRONTEND.md`; ràng buộc thường trực nằm ở `CLAUDE.md`.

---

## 1. Sản phẩm là gì

Lớp hỗ trợ quyết định đặt giữa **một yêu cầu đáng ngờ** và **một quyết định có
thể mất tiền**. Không phải công cụ tra cứu danh tính.

Nguyên tắc kiến trúc chi phối toàn bộ mã nguồn:

| | |
|---|---|
| **AI chỉ bật cờ** | LLM trích tín hiệu kèm bằng chứng, **không** xuất mức rủi ro |
| **Bộ luật quyết định** | `src/analysis/decision-engine.js` là nơi duy nhất tính điểm và ra mức |
| **Không kiểm được ≠ an toàn** | thiếu dữ liệu phải hiện ra, không được im lặng thành "chưa thấy rủi ro" |
| **Song ngữ cùng tập tín hiệu** | VI và EN map về cùng `SIGNAL_ID`, một bộ luật duy nhất |

Ba nhãn cố định — nguồn sự thật ở `src/risk-labels.js`, i18n không ghi đè được:
`Nguy hiểm cao` · `Nghi ngờ` · `Chưa thấy dấu hiệu rủi ro`.
**Không có nhãn "An toàn".**

---

## 2. Công nghệ

| Tầng | Thực tế |
|---|---|
| Máy chủ | Node.js + Express — `server.js`, 538 dòng |
| Ngôn ngữ | JavaScript thuần (CommonJS), không TypeScript, không build ở backend |
| Lưu trữ | `src/vault-store.js` — Postgres nếu có `DATABASE_URL`, không thì bộ nhớ tạm |
| LLM | `src/ai/fable-client.js` — gateway openai-compatible, timeout 35s |
| Model đang cấu hình | **`claude-sonnet-5`** (`.env`), gateway `codex.hungnguyen.codes/v1` |
| Frontend | React SPA dựng bằng Vite — **mã nguồn NẰM NGOÀI repo** |
| Kiểm thử | `node --test` — 35 tệp, 510 ca |

> ⚠️ **Model**: một số tài liệu và slide ghi *Fable 5*. Cấu hình thật là
> `claude-sonnet-5`. `.env.example:3` ghi rõ lý do đã bỏ Fable: *"model đó chỉ
> về 1/6 lượt"*. Tên tệp `fable-client.js` là di sản, nội dung gọi Sonnet.

---

## 3. Cây thư mục

```
KHOAN-DA-24H/
├─ server.js                  Express — 22 route, phục vụ SPA ở public/app
├─ src/
│  ├─ ai/fable-client.js      cổng LLM (timeout 35s, mang cause/providerStatus)
│  ├─ analysis/               ĐƯỜNG PHÂN TÍCH RỦI RO — xem §4
│  └─ *.js                    tính năng sản phẩm — xem §6
├─ public/
│  ├─ app/                    ⚠️ BẢN DỰNG frontend (không phải mã nguồn)
│  ├─ tokens.css              thang chữ · màu · khoảng cách
│  ├─ vung-cham-san.css       sàn tiếp cận §4.4 (52/56/14px)
│  └─ config/                 support-directory.json · ma-hop-dong.json
├─ test/                      35 tệp · 510 ca
├─ test-utils/css.js          tiện ích phân tích CSS tĩnh cho hàng rào §4.4
├─ eval/                      bộ đánh giá + kết quả đã đo
├─ scripts/                   build · tạo ảnh · nén ảnh
└─ docs/superpowers/specs/    spec và prompt bàn giao
```

---

## 4. Đường phân tích rủi ro — `src/analysis/`

**Thứ tự pipeline không được đảo** (`pipeline.js`, §6.1):

```
đầu vào (văn bản · ảnh · URL)
   ↓
context-builder.js      dựng ngữ cảnh · CHỐNG BÁO ĐỘNG GIẢ (hàm thuần: không
                        mạng, không AI, không đồng hồ)
   ↓
direct-precheck.js      mẫu deterministic — CHẠY ĐƯỢC KHI MẤT AI
   ↓
llm-extractor.js        AI trích tín hiệu — KHÔNG biết trọng số
   ↓
evidence-validator.js   loại tín hiệu không trích được bằng chứng từ bản gốc
   ↓
decision-engine.js      ★ BỘ LUẬT DUY NHẤT — tính điểm, ra mức
   ↓
critical-overrides.js   CO-01…CO-10 — đè lên mọi kết quả
   ↓
trust-receipt-v2.js     phiếu tin cậy, dựng từ BẢNG ÁNH XẠ TĨNH
```

### 4.1 Bộ luật — các hằng số

Đọc từ `decision-engine.js`:

| Hằng | Giá trị |
|---|---|
| `THRESHOLD_SUSPICIOUS` | **20** |
| `THRESHOLD_HIGH` | **45** |
| `SCORE_CAP` | **69** |
| Số tổ hợp cộng hưởng | 10 |
| Số critical override | **10** (CO-01 … CO-10) |

### 4.2 Sổ tín hiệu — 58 tín hiệu, 8 nhóm

`signal-registry.js` (Phụ lục A):

| Nhóm | Số | Ví dụ |
|---|---:|---|
| `money` | 12 | `FIN_SAFE_ACCOUNT` · `FIN_RECOVERY_FEE` · `FIN_TRANSFER_REQUEST` |
| `identity` | 12 | `ID_AUTHORITY_IMPERSONATION` · `ID_FAMILY_IMPERSONATION` · `ID_KHOAN_DA_IMPERSONATION` |
| `manipulation` | 9 | `MAN_SECRECY` · `MAN_FEAR_THREAT` · `MAN_URGENCY` · `MAN_LOVE_BOMBING` |
| `offer` | 7 | `OFF_ADVANCE_FEE` · `OFF_INVESTMENT_GUARANTEE` · `OFF_ROMANCE_EMERGENCY` |
| `web` | 6 | `WEB_BRAND_DOMAIN_MISMATCH` · `WEB_PUNYCODE_IP_LITERAL` |
| `device` | 5 | `DEV_REMOTE_CONTROL_APP` · `DEV_ACCESSIBILITY_PERMISSION` · `DEV_INSTALL_APK_UNKNOWN` |
| `credential` | 4 | `CRED_OTP_SHARE` · `CRED_BANK_LOGIN` |
| `case` | 3 | `CASE_MULTI_CHANNEL_ESCALATION` · `CASE_STAGE_ESCALATION` |

### 4.3 Critical override — 10 tổ hợp

Hai tổ hợp nổ **thẳng từ văn bản**, không cần AI, vì `direct-precheck.js` bắt
được mẫu qua regex trong locale pack:

- **CO-03** `FIN_SAFE_ACCOUNT` — mẫu VI: `(tài khoản|ví)\s+(an toàn|bảo đảm|tạm giữ|phong toả)`
- **CO-06** `FIN_RECOVERY_FEE` + ngữ cảnh phục hồi

> Ca có critical override **trả về dưới 1 giây và không chạm tầng AI**
> (`fable-client.js:27`). Đây là ca an toàn nhất để demo — không phụ thuộc mạng.

### 4.4 Sàn "không kiểm được"

`unreadableInputFloor()` trong `pipeline.js`. Ảnh không đọc được, AI chết, tên
miền không phân giải — tất cả sinh mã `chuaKiem`, **không** rơi về
`CHUA_THAY`. Hàng rào: `test/unchecked-not-safe.test.js` ·
`test/unreadable-input-floor.test.js`.

### 4.5 Song ngữ

`locale-pack-registry.js` + `locale-packs/vi-VN.js` · `en-US.js`.
Registry chỉ **tra cứu**, không đổi scoring. Mở locale mới = thêm một pack,
không viết lại bộ luật.

---

## 5. Bề mặt API — `server.js`

| Route | Việc |
|---|---|
| `POST /api/analyze` · `/api/phan-tich` | phân tích chính (§HĐ) |
| `POST /api/analyze/so-bo` | phân tích sơ bộ |
| `GET  /api/kich-ban/:hoKichBan` | tra kịch bản theo họ lừa đảo |
| `POST /api/vu-viec/ung-vien` · `/api/vu-viec/gop` | bộ nhớ vụ việc |
| `GET  /api/ke-hoach-phuc-hoi` | kế hoạch phục hồi sau khi mất tiền |
| `POST /api/ra-da` | ra-đa thủ đoạn |
| `POST /api/canh-bao-nguoi-than` | đẩy cảnh báo tới Vòng tròn gia đình |
| `POST /api/proof/dang-ky/*` · `/api/proof/ghep/*` | Khoan Proof — passkey, ghép cặp |
| `POST /api/proof/yeu-cau/tao` · `/:id/ky` | tạo và ký một yêu cầu cụ thể |
| `GET  /api/proof/chieu-kiem/:caseId` | chiều kiểm — tra yêu cầu đã ký |
| `POST /api/proof/thu-hoi` | thu hồi ghép cặp |
| `GET  /transparency` | trang minh bạch (HTML thuần, **không cần JS**) |
| `GET  /api/safety-card` · `/api/suc-khoe` | dữ liệu minh bạch · health check |

Mọi đường không phải `/api` và không phải `/transparency` đều trả `index.html`
để React tự định tuyến.

---

## 6. Tính năng — `src/`

### 6.1 Đã có trong mã nguồn

| Module | Tính năng | Ghi chú |
|---|---|---|
| `risk-labels.js` | **Ba nhãn mức rủi ro** | nguồn sự thật, i18n không ghi đè |
| `intervention-ladder.js` | **Thang can thiệp 5 mức** | `canThiep` quyết định MÀN HÌNH, `nhan` quyết định NHÃN — hai thứ khác nhau |
| `trusted-circle.js` | **Vòng tròn gia đình** | quyền cuối thuộc về người cao tuổi |
| `push.js` | **Đẩy thông báo tới người thân** | §9.4 — trạng thái giao nhận phải nói thật |
| `journey-engine.js` | **Bộ nhớ vụ việc** — hành trình 8 giai đoạn | |
| `entity-extractor.js` | trích thực thể (số, tài khoản, tên miền) cho bộ nhớ vụ việc | |
| `khoan-proof.js` | **Khoan Proof — nền**: đăng ký passkey, ghép cặp thiết bị | WebAuthn |
| `khoan-proof-ky.js` | **Khoan Proof — lõi**: ký một yêu cầu cụ thể, xác minh chữ ký | |
| `verified-request.js` | **Chiều kiểm**: tra xem có yêu cầu đã ký thật không | |
| `intel-radar.js` | **Ra-đa thủ đoạn** — tầng runtime | KHÔNG được đụng vào mức rủi ro |
| `intel-store.js` | kho + **cổng duyệt** cho ra-đa | mục chưa duyệt không được trả ra |
| `blind-spot.js` | **máy dò điểm mù** — nguồn C của ra-đa | |
| `kich-ban-di-tiep.js` | **dự báo bước kế tiếp** của một họ lừa đảo | |
| `bo-hoi-nhanh.js` | **bộ hỏi nhanh lúc đang bị gọi** | kênh đầu vào riêng |
| `recovery-adapters.js` | **bộ thích ứng phục hồi** — GLOBAL + ít nhất một nước đã duyệt | |
| `verified-institution-registry.js` | **sổ tổ chức đã xác minh** | *"module nguy hiểm nhất"* — số không nguồn bị loại |
| `safety-card.js` · `safety-card-page.js` | **trang `/transparency`** | tách MỤC TIÊU khỏi ĐÃ ĐO |
| `link-shield.js` | **hàng rào SSRF** | không bao giờ tự mở link |
| `media-validation.js` | kiểm chữ ký tệp thật, giới hạn 5MB | chống giả mạo MIME |
| `auth.js` | đăng nhập / ghép cặp | **không gate chức năng kiểm tra cơ bản** |
| `vault-store.js` | lớp lưu trữ | Postgres hoặc bộ nhớ tạm |
| `version.js` | phiên bản từng tầng | để mọi số eval truy ngược được |

### 6.2 Ràng buộc cắt ngang

- `intel-radar.js` nhận **tactic / pattern**, không quy kết cá nhân.
- `intel-store.js` — mục **chưa duyệt** hoặc **không nguồn** tuyệt đối không trả ra.
- `khoan-proof.js` là **tuỳ chọn**; mặc định app vẫn localStorage, không đồng bộ máy chủ.
- Khoan Proof **không được đụng đường phân tích rủi ro** — rút mạng, chưa ghép cặp
  thì `/api/analyze` vẫn phải chạy bằng tầng luật.

---

## 7. Frontend — cần đọc kỹ

**Mã nguồn frontend không nằm trong repo này.** `package.json`:

```json
"dung-giao-dien": "npm --prefix \"../trợ-lý-ảo-khoan-đã (1)\" run build"
```

Nguồn ở thư mục anh em `../trợ-lý-ảo-khoan-đã (1)` — không được git theo dõi.
Thứ có trong repo là **bản dựng**: `public/app/index.html` +
`public/app/assets/index-*.{js,css}` (467KB JS · 61KB CSS, dựng 15/8/2026 23:56).

Các màn đã dựng (quan sát từ bản ghi màn hình, chưa đối chiếu mã nguồn):
trang chủ *"Bác đang gặp tình huống gì?"* · tạo tài khoản · thêm người thân
(tên · vai trò · số điện thoại) · **màn Nguy hiểm cao** kèm câu để đọc và nút
"Nghe đọc câu này" · **Dừng lại 60 giây** đếm ngược · gọi người thân / tổng đài
ngân hàng · bộ câu hỏi xác minh · mục Học hỏi (giả danh con cháu · shipper ·
OTP · APK · chia sẻ màn hình · đầu tư lợi nhuận cao).

---

## 8. Kiểm thử và đo lường

### 8.1 Bộ test

**35 tệp · 510 ca · 510 pass · 0 fail.** Chạy lại 11 lượt ngày 15–16/8/2026,
gồm 3 cặp chạy song song — đều xanh.

```bash
node --test
```

Nhóm chính: `decision-engine` · `critical-overrides` · `evidence-validator` ·
`signal-registry` · `pipeline` · `false-positive` · `unchecked-not-safe` ·
`unreadable-input-floor` · `risk-labels` · `api-contract` · `hop-dong-ma` ·
`trusted-circle` · `journey-engine` · `ra-da-thu-doan` · `url-analyzer` ·
`bao-mat-dau-vao` · `ranh-gioi-tu-unicode` · và 5 tệp hàng rào a11y.

### 8.2 Kết quả eval — ĐÃ ĐO

`eval/results/latest.json`, chạy **15/8/2026 20:29**, commit `1b1a6ea`,
model `claude-sonnet-5`, **445 mẫu** chấm trên dataset `d9b4a242f314`:

| Chỉ số | Đo được | Mục tiêu | |
|---|---:|---:|---|
| `dangerousRecall` | **64,3%** | ≥ 95% | ❌ còn xa |
| `highRiskFP` | **7,4%** | ≤ 8% | ✅ **đạt** |
| `tyLeDat` | 62,9% | — | |
| `tutDuoiMucDo` | 31,5% | — | |
| `vuotTranToiDa` | 5,6% | — | |

Ma trận nhầm đáng chú ý: **`CAO → CHUA_THAY` = 23 mẫu** · `CAO → NGHI_NGO` = 53.

```bash
npm run eval
```

> **510/510 test xanh là bằng chứng kỷ luật kỹ thuật, KHÔNG phải bằng chứng độ
> chính xác của AI.** Hai thứ này không được trộn.

---

## 9. Những chỗ mã nguồn và tài liệu đang lệch nhau

Liệt kê để xử, không phải để tranh luận.

| # | Lệch | Thực tế trong mã |
|---|---|---|
| 1 | Tài liệu/slide ghi model **Fable 5** | `.env` → `claude-sonnet-5` |
| 2 | Slide ghi **360/360 test · 34 tệp** | **510/510 · 35 tệp** |
| 3 | Slide P5 ghi **6 tổ hợp critical override** | **10** (CO-01…CO-10) |
| 4 | Slide/tài liệu ghi *"chưa có kết quả đo"* | `eval/results/latest.json` đã có số từ 15/8 |
| 5 | Tài liệu gọi sản phẩm là **PWA** | **không có service worker** ở đâu trong repo, bundle không đăng ký `serviceWorker` |

### 9.1 `npm run check` đang hỏng

```
"check": "node --check server.js && node --check public/app.js
          && node --check public/services.js && node --check public/sw.js"
```

Ba tệp `public/app.js` · `public/services.js` · `public/sw.js` **không còn tồn
tại** sau khi frontend chuyển sang SPA dựng sẵn. Lệnh báo `MODULE_NOT_FOUND`.

### 9.2 Sàn tiếp cận §4.4 — khai đúng nhưng không được nạp

- `public/vung-cham-san.css` và `public/tokens.css` **tồn tại và qua hết kiểm tra
  tĩnh** (16 ca trong 3 tệp test, không ca nào bị skip).
- Nhưng `public/app/index.html` **chỉ nạp `/assets/index-DkdgnYyA.css`** — không
  nạp `vung-cham-san.css`, không nạp `tokens.css`.
- CSS đã dựng có chứa `52px` (6 lần) và `56px` (2 lần) — tức đội frontend có mang
  giá trị sàn sang. Nhưng **không có custom property `--touch-target*`**, tức
  không phải cách khai theo VAI TRÒ mà §4.4 yêu cầu.
- Test đáng lẽ bắt được chuyện này thì **đang xanh mà không kiểm gì**:

```js
// test/font-size-floor.test.js:94
if (C.coTep('public/sw.js'))     { /* … */ }   // tệp không còn → bỏ qua
if (C.coTep('public/index.html')) { /* … */ }   // tệp không còn → bỏ qua
```

Cả hai nhánh đều không chạy, nên ca test **pass rỗng**. Đây đúng dạng lỗi §4.3
mà dự án cảnh giác nhất — chỉ khác là nó xảy ra với chính hàng rào.

### 9.3 `public/app/index.html` còn nguyên khung mẫu Google AI Studio

```html
<html lang="en">
<title>My Google AI Studio App</title>
<meta name="description" content="An application built with Google AI Studio." />
<meta property="og:title" content="My Google AI Studio App" />
```

Đây là chữ hiện trên tab trình duyệt và khi chia sẻ link. Sản phẩm là
Vietnam-first nhưng `lang="en"`.

### 9.4 Phụ thuộc mạng ngoài

`index.html` nạp font từ `fonts.googleapis.com` / `fonts.gstatic.com`. Hai hệ
quả: không mở được khi mất mạng, và Google thấy IP của mọi người dùng — trong khi
sản phẩm đang quảng bá *"dữ liệu lưu cục bộ"*.

### 9.5 Chưa có cấu hình triển khai

Không có `vercel.json` · `netlify.toml` · `Dockerfile` · `Procfile` · `.github/`.
Không có URL công khai nào trong mã. Hiện chỉ chạy `node server.js` ở máy.

---

## 10. Chưa làm được — nói thẳng

- Chưa thử với người cao tuổi thật.
- Chưa có dữ liệu vụ việc thật.
- Chưa kết luận độ chính xác của AI — mới có lần đo đầu (§8.2), recall còn xa mục tiêu.
- Chưa có đối tác pilot.
- Chưa chặn được cuộc gọi (cần app Android native) hoặc giao dịch ngân hàng (cần API ngân hàng).
- Chưa deploy.

---

## 11. Lệnh hay dùng

```bash
npm start                # chạy máy chủ
npm run dev              # chạy có --watch
node --test              # 510 ca
npm run eval             # bộ đánh giá chính
npm run eval:quocte      # khoanbench (trần 10% lượt hỏng)
npm run dung-giao-dien   # dựng frontend từ thư mục anh em
```

`npm run check` đang hỏng — xem §9.1.

---

## 12. Đọc tiếp

| Tệp | Nội dung |
|---|---|
| `CLAUDE.md` | ràng buộc thường trực — §HĐ hợp đồng BE↔FE, §4 bất biến, §11 câu cấm viết, §12 quyết định không được tự đổi |
| `BACKEND.md` | đặc tả backend đầy đủ |
| `FRONTEND.md` | đặc tả frontend |
| `DOC-DAU-TIEN.md` | đọc đầu tiên khi mới vào dự án |
| `docs/superpowers/specs/PROMPT-BAN-GIAO.md` | prompt bàn giao theo thứ tự, kèm quỹ giờ |
| `eval/results/latest.json` | **nguồn sự thật cho số ĐÃ ĐO** |
