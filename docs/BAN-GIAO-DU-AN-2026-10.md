# KHOAN ĐÃ — FILE BÀN GIAO DỰ ÁN

**Ngày lập:** 13/10/2026 · **Nhánh:** `sua-bo-luat-va-do-luong` · **main:** `32b9789`
**Thay thế:** `BAN-GIAO.md` (16/8/2026) và `BAN-GIAO-CLAUDE.md` (22/9/2026). Hai file đó còn đúng về kiến trúc và các bẫy, nhưng trạng thái, đường dẫn và số liệu đã cũ. Đừng dùng chúng làm nguồn trạng thái.

Đọc theo thứ tự: file này → `CLAUDE.md` (hợp đồng, không phải gợi ý) → `PRODUCT.md` → các tài liệu ở mục 9.

---

## 1. Trạng thái nhanh (đo ngày 13/10/2026)

| Hạng mục | Trạng thái | Cách kiểm |
|---|---|---|
| Bộ kiểm thử | **1.680 đạt, 0 lỗi** | `npm test` (khoảng 72 giây) |
| Kiểm kiểu | Đạt | `npm run lint` (`tsc --noEmit`) |
| Máy chủ thật | Sống, `/healthz` trả `ok` | `https://khoan-da.onrender.com/healthz` |
| Model đang dùng | `deepseek-v4-flash-0731` qua cổng AI Box, không có thị giác | `/api/suc-khoe`: `model`, `coThiGiac: false` |
| Lưu trữ | Postgres (Neon), giữ được qua deploy | `/api/suc-khoe`: `kho.loai = postgres` |
| Báo động qua máy | Web Push (VAPID) và FCM đã cấu hình | `pushCauHinh: true`, `fcmCauHinh: true` |
| APK | **1.7** (`versionCode 8`), ký khoá phát hành, có SMS dự phòng | `android/app/build.gradle`, `khoan-da.apk` (8.815.638 byte) |
| Bộ đo (eval) | Số mới nhất đo trên **bộ tự soạn**, bản phát lại luật 1.6.1 | `eval/results/latest.json` |
| Mẫu thật | **0 / mục tiêu 25–40** | `eval/mau-that/` chỉ có README |
| Người cao tuổi ngoài gia đình đã dùng thử | **0** | chưa có |
| Thay đổi chưa commit | `.claude/launch.json` (đã sửa), các thư mục `.impeccable/`, `codebrain/`, `BAN-GIAO-CLAUDE.md`, `PROMPT-CODEX.md`, một số tệp `nextgen-2026/` không thuộc luồng chính | `git status` |

**Con số phải nói đúng khi trình bày:** recall mức Cao 82,6% (219/265) và báo nhầm mức Cao 1,8% (3/169) là số trên bộ tự soạn, bản phát lại luật 1.6.1, luật được chỉnh trên chính bộ đó. Chỉ tầng luật, không AI: 29,4% (đo 30/9/2026). Chưa có số nào đo trên người dùng thật.

---

## 2. Sản phẩm trong một trang

Người cao tuổi (bác) dán tin nhắn, kể tình huống, chụp ảnh hoặc nói vào. App trả về **một trong ba nhãn** và một hướng dẫn cụ thể.

- **Ba nhãn** (chỉ ba, không thêm, không có chữ "An toàn"): `Nguy hiểm cao` · `Nghi ngờ` · `Chưa thấy dấu hiệu rủi ro`. Tiếng Anh: `High risk` · `Suspicious` · `No clear risk signals found`.
- **Hợp đồng `/api/analyze` trả đúng bảy trường:** `nhan`, `maLyDo`, `daKiem`, `chuaKiem`, `hoKichBan`, `aiDaChay`, `canThiep`. `nhan` là enum; chữ hiển thị nằm ở `src/catalog.ts`. `chuaKiem` không rỗng thì giao diện bắt buộc hiện nó cùng cỡ chữ với nhãn.
- **Mức can thiệp** quyết định màn hình: `TRUST_RECEIPT`, `VERIFY_PATH`, `PAUSE_60S`, `PROTECTED_CRITICAL`, `RECOVERY`. Mức `PROTECTED_CRITICAL` chỉ đến từ 10 chốt chặn cố định.
- **Ngưỡng:** NGHI_NGO từ 20 điểm, CAO từ 45 điểm, trần 69. Đây là quyết định khoá. Đổi phải hỏi chủ dự án.
- **Các chức năng đã có:** dán/kiểm tin; chụp ảnh và QR (đọc ảnh cần đường dự phòng Gemini); trợ lý "Nói cho cháu nghe" (không kết luận rủi ro); màn khẩn cấp một việc (gọi con); báo cho con ở ba mức (công tắc riêng, mặc định tắt); SMS dự phòng từ máy bố mẹ; diễn tập; tra cứu tài khoản và tên miền; cảnh báo chính thức; theo dõi 72 giờ sau khi mất tiền; trang giới thiệu `/gioi-thieu`; trang minh bạch `/transparency`.

---

## 3. Kiến trúc và bản đồ tệp

```
server.ts                       khởi động: app ngoài, gắn backend, Vite (dev) hoặc dist/ (prod)
backend/server.js               toàn bộ API, CSP, giới hạn tần suất, /healthz, /transparency, /gioi-thieu
backend/src/analysis/           đường phân tích
  pipeline.js                   đầu vào → phong bì §HĐ (bảy trường). Nhiều bẫy.
  decision-engine.js            bộ luật DUY NHẤT tính điểm và ra mức (hàm thuần, không mạng)
  critical-overrides.js         10 chốt chặn CO-01…CO-10
  intervention-ladder.js        chọn mức can thiệp
  context-builder.js            ngữ cảnh lời nói (7 loại hành vi)
  direct-precheck.js            khớp mẫu regex. Nơi nhiều bẫy nhất.
  llm-extractor.js              lời nhắc AI + kiểm lược đồ (không có Zod; hàm tự viết)
  locale-packs/vi-VN.js, en-US.js   mẫu ngôn ngữ (version 1.2.1 / 1.1.1)
  signal-registry.js            64 tín hiệu, trần điểm từng nhóm
  version.js                    RULE 1.6.3 · REGISTRY 1.2.0 · PROMPT 1.4.0 · ANALYSIS 1.0.0
backend/src/ai/fable-client.js  gọi cổng AI: chuỗi đường, timeout, cầu dao
backend/src/vault-store.js      kho dữ liệu (Postgres/SQLite/RAM) + hàng rào trường cấm §6.9
backend/src/bao-dong-gia-dinh.js  báo cho con: gộp 30 giây, leo thang sau 60 giây (hẹn giờ trong RAM)
backend/src/push.js, gui-web-push.js, gui-fcm.js   đẩy thông báo
backend/src/khoan-proof.js, khoan-proof-ky.js, chia-khoa-thu-hai.js   passkey (WebAuthn)
backend/src/tro-ly-noi.js       trợ lý hội thoại + lưới luật ở đầu ra
backend/src/trang-gioi-thieu.js trang giới thiệu (server-rendered, song ngữ)
src/                            giao diện React + Tailwind + Capacitor
  catalog.ts, i18n.ts           chữ hiển thị (mọi chuỗi người dùng đọc đi qua đây)
  risk-labels.js                ba nhãn cố định, i18n không ghi đè được
public/                         tokens.css, vung-cham-san.css (sàn tiếp cận, nạp sau cùng), sw.js
android/                        Capacitor + các lớp native (DocThongBao, PopupDeManHinh, NhipBaoVe…)
eval/                           bộ đo: dataset/, results/, doi-chung/, mau-that/, run.js, khoanbench.js
test/                           135 tệp kiểm thử; nhiều tệp là hàng rào cho lỗi đặc trưng của sản phẩm
scripts/                        tiện ích: kiểm mẫu thật, tạo khoá phát hành, đo độ trễ, ảnh giới thiệu
nextgen-2026/                   tài liệu thi NextGen (Q&A, pitch, nguồn vốn)
docs/                           kế hoạch, đánh giá, tài liệu bàn giao (file này)
```

**Quy tắc đường dẫn:** `esbuild` gói `server.ts` vào `dist/`, nên `__dirname` trỏ tới `dist/`. Mọi đường dẫn tới tài nguyên phải tính từ gốc repo, không tính từ `__dirname`.

---

## 4. Ràng buộc cứng (đọc kỹ trước khi sửa)

Nguồn đầy đủ: `CLAUDE.md`. Tóm tắt những điều hay bị vi phạm nhất:

- **Không** nhãn "An toàn", "Safe" hay biến thể. Mức thấp chỉ là "Chưa thấy dấu hiệu rủi ro" kèm phần chưa kiểm được (§4.1, §4.3).
- **AI chỉ trích tín hiệu.** Không có `absent`. Không có trường `riskScore`, `riskLabel`, `critical`, `interventionLevel`, `safe`. Mọi thứ mới chỉ được làm tăng cảnh giác (§4.2).
- **Không kiểm được ≠ đã kiểm và không thấy gì.** Có sàn `unreadableInputFloor()` và test chặn (§4.3).
- **Mức cao luôn có lối ra** ("Tôi ổn, không có gì nguy hiểm") (§4.6).
- **Không hứa chặn cuộc gọi hay chặn giao dịch;** không hứa lấy lại tiền; không buộc tội một người cụ thể; không trách người dùng; không viết "đã gửi cho người thân" khi mới đẩy đi (§11).
- **Không tự bật auto-alert thay chủ tài khoản;** không đổi privacy model; không đổi ngưỡng 20/45/69 hoặc 10 chốt; không thay luật bằng "LLM judge"; không cho model gọi tool hay mạng trong đường phân tích rủi ro; không thêm cụm nào hạ mức vô điều kiện (§12).
- **Bất cứ thay đổi nào về §HĐ, §4, §11, §12 đều phải dừng và hỏi chủ dự án.**

### Quyền Android đã khai (APK 1.7; danh sách chính, xem `AndroidManifest.xml` để đủ)

`INTERNET`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `READ_PHONE_STATE`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, `SYSTEM_ALERT_WINDOW`, `RECORD_AUDIO`, `CAMERA` (không bắt buộc), `CALL_PHONE`, `SEND_SMS` (chỉ gửi, từ 1.7). Quyền nghe thông báo do người dùng bật trong Cài đặt hệ thống.

**Cố ý không xin:** `READ_SMS`, `RECEIVE_SMS`, `READ_CALL_LOG`, `READ_CONTACTS`, `AccessibilityService`, `QUERY_ALL_PACKAGES`, quyền xem sử dụng app, vai trò lọc cuộc gọi, quyền toàn bộ bộ nhớ, VPN. Lý do và danh sách bị loại: `docs/KE-HOACH-TANG-SUC-MANH-2026-10.md` mục 3 và `docs/HUONG-DOT-PHA-LUAT-NOI-CHAM-2026-10.md`.

---

## 5. Chạy trên máy

```bash
cd D:\KHOAN-DA-24H
npm install
npm run dev            # tsx server.ts; cổng lấy từ PORT, mặc định 3000
npm test               # 1.680 bài, khoảng 72 giây
npm run lint           # kiểm kiểu
npm run build          # vite build + esbuild → dist/server.cjs
npm start              # chạy bản đã dựng
npm run check          # kiểm cú pháp (scripts/kiem-cu-phap.js)
npm run eval           # chạy bộ đo, KHÔNG ghi tệp
npm run build:apk      # vite build --mode apk && npx cap sync android
```

**Cẩn thận:** `npm run eval:ghi` ghi đè `eval/results/latest.json`, tệp mà trang `/transparency` đọc. Chỉ chạy khi đã có quyết định về việc đo lại. Ghi chú: `eval:ghi` là bản đo đầy đủ, cần AI đang hoạt động.

**Biến môi trường** (giá trị KHÔNG có trong repo; đặt trong Render dashboard hoặc tệp `.env` cục bộ đã gitignore). Xem tên đang được đặt qua `/api/suc-khoe` (`bienDaDat`):

| Nhóm | Tên biến |
|---|---|
| AI | `LLM_API_BASE`, `LLM_API_KEY`, `RISK_LLM_MODEL`; đường hai: `LLM_API_BASE2`, `LLM_API_KEY2`, `RISK_LLM_MODEL2`; dự phòng cục bộ: `LLM_DU_PHONG_BASE`, `LLM_DU_PHONG_MODEL` (hiện **chưa đặt**); `LLM_TIMEOUT_MS` (hiện chưa đặt, mặc định trong mã); `GEMINI_API_KEY` (đọc ảnh, đọc to) |
| Dữ liệu | `DATABASE_URL` (Neon Postgres) |
| Đẩy thông báo | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `FCM_SERVICE_ACCOUNT` (dán toàn bộ tệp JSON khoá dịch vụ) |
| Passkey | `KHOAN_DA_RP_ID` (`khoan-da.onrender.com`), `KHOAN_DA_ORIGIN`, `KHOAN_DA_ORIGIN_THEM` |
| Khác | `NODE_ENV`; `KHOAN_DA_PHIEN_DEMO=1` mở phiên demo (mặc định đóng); `KHOAN_DA_KHONG_PHAT_APK=1` tắt tải APK |

**Không bao giờ** dán giá trị khoá vào chat, commit, tài liệu hay log. Chẩn đoán FCM chỉ trả đúng/sai và độ dài, không trả khoá.

---

## 6. Triển khai

- **Máy chủ:** Render, gói **miễn phí**, dịch vụ `khoan-da`. Cấu hình trong `render.yaml`: `buildCommand: npm ci && npm run build`, `startCommand: npm start`, `healthCheckPath: /healthz`.
- **Deploy:** Render tự triển khai khi có commit mới trên `main`. Lệnh đẩy đang dùng: `git push -q origin sua-bo-luat-va-do-luong:main && git push -q origin sua-bo-luat-va-do-luong`.
- **Khởi động lạnh:** gói miễn phí ngủ sau khoảng 15 phút. Đã đo: lượt đầu 15 giây, các lượt sau 0,3–0,8 giây, khi có dịch vụ ngoài gọi `/healthz` định kỳ. **Cần xác nhận lại** monitor UptimeRobot còn chạy (không có cấu hình nào trong repo).
- **Cơ sở dữ liệu:** Neon, bật qua `DATABASE_URL`. Neon gói miễn phí tự về 0 sau 5 phút không dùng.
- **Gateway AI:** `home.ai-box.vn`, bên thứ ba. Nội dung tin được gửi qua cổng này tới model khi bác bấm kiểm. Đổi cổng phải kê khai lại theo thể lệ cuộc thi.
- **Trang tĩnh:** `/gioi-thieu` (song ngữ, mặc định tiếng Anh, `?lang=vi` cho tiếng Việt), `/chinh-sach-rieng-tu.html`, `/transparency`, `/khoan-da.apk`.

---

## 7. Android và khoá ký

- `android/app/build.gradle`: `applicationId vn.khoanda.app`, `versionCode 8`, `versionName "1.7"`, `minSdk`/`targetSdk` lấy từ `variables.gradle` (targetSdk 34 ở các bản trước).
- **Khoá ký phát hành:** `android/khoan-da-phat-hanh.jks` và `android/keystore.properties`. Cả hai bị `.gitignore` chặn, và **hiện chỉ có trên máy này**. Chứng chỉ: `CN=Khoan Da`, SHA-256 `6a5ee25c…2812f` (xem đủ trong `apksigner` output của bản phát hành). **Mất khoá là không cập nhật được APK cho người đã cài.** Script `scripts/tao-khoa-phat-hanh.js` từ chối ghi đè khoá đã có.
- **Firebase:** `android/app/google-services.json` (gitignore). Đã dựng bản APK có FCM từ 1.6.
- **Phát hành:** APK chưa lên chợ nào. CH Play cần 25 USD một lần; Galaxy Store và Zalo Mini App cần pháp nhân. Link APK trực tiếp chỉ nằm ở trang `/gioi-thieu` có cảnh báo; không được phát tán trực tiếp (xem `DANH-GIA-KE-HOACH-APK.md`).
- **Cài thử:** bản 1.7 đã thử trên máy ảo Android 14 (gửi SMS một phần và nhiều phần). **Chưa** thử gửi SMS thật qua SIM và chưa thử trên điện thoại thật.

---

## 8. Bộ đo (eval)

| Tệp | Nội dung |
|---|---|
| `eval/dataset/*.jsonl` | 571 mẫu: 470 tiếng Việt, 49 tiếng Anh, 52 trộn. Nguồn: 487 tự soạn hoặc tái dựng, 72 nguồn mở, 5 biến thể, 5 đối chứng, 2 người dùng báo. **0 mẫu thật.** |
| `eval/doi-chung/` | 153 mẫu do ChatGPT gán nhãn, **chưa người duyệt**. README ghi rõ: không phải số đo độc lập, không đưa lên slide. |
| `eval/results/latest.json` | Kết quả mới nhất, đọc bởi `/transparency`. Luật 1.6.1, model `deepseek-v4-flash-0731`, `tinHieuGoiMoi: 0` (phát lại từ đệm AI). |
| `eval/results/do-tre-render.json` | Độ trễ: trung vị 2,0 giây, p90 3,2 giây (47 lượt, 24/9/2026). |

**Số để trình bày:** recall Cao 82,6% (CI khoảng 77,6–86,7%), báo nhầm Cao 1,8% (CI khoảng 0,6–5,1%), tiếng Việt 80,1% và tiếng Anh 91,2% (34 mẫu, không có tin lành tiếng Anh nào), lệch 11,1 điểm, chỉ tầng luật 29,4%. Mục tiêu [MỤC TIÊU] trong `eval/run.js`: recall ≥ 95% (Việt, Anh), báo nhầm ≤ 3%, lệch ≤ 3 điểm. **Chưa đạt.**

**Đã biết là có vấn đề:** luật được chỉnh trên chính bộ đo tự soạn, nên số đẹp hơn thực tế. Bộ ChatGPT lần đầu chỉ bắt được 41/83 ≈ 49%.

---

## 9. Tài liệu và nơi tìm

| Tài liệu | Dùng để làm gì |
|---|---|
| `CLAUDE.md` | Hợp đồng và luật cứng. Không tự sửa. |
| `PRODUCT.md` | Định vị, người dùng, giọng văn |
| `PERMISSIONS-AND-POLICY.md` | Quyền, dữ liệu rời máy, lý do không xin quyền |
| `THAM-KHAO-DAY-DU.md`, `QA-BAN-GIAM-KHAO-v2.md` | Định vị sản phẩm (đọc trước khi viết về sản phẩm) |
| `docs/KE-HOACH-TANG-SUC-MANH-2026-10.md` | Kế hoạch tăng sức mạnh, các ý đã loại, 4 câu hỏi chờ chủ dự án |
| `docs/HUONG-DOT-PHA-LUAT-NOI-CHAM-2026-10.md` | Hướng "luật nới chậm" đã thẩm định, cổng 0–3, quyết định §12 |
| `docs/DANH-GIA-20-Y-TUONG.md`, `docs/TINH-NANG-KHA-THI.md` | Đánh giá ý tưởng (tháng 8), có một số mục đã làm |
| `docs/PHIEU-TRIEN-KHAI-2026-10-15.md` | Ghi nhận thay đổi Trung tâm Bảo vệ, trợ lý tại chỗ, bàn phím và trạng thái build/phát hành ngày 15/10 |
| `docs/DANH-GIA-KE-HOACH-APK.md` | Phân phối APK |
| `nextgen-2026/7-QA-BAN-TO-CHUC-SONG-NGU.md`, `.pdf`, `7b-…md` | Q&A 100 câu song ngữ cho giám khảo (PDF 79 trang, bản lời thường). Số liệu ở đây là 1.637 test, APK 1.6 — **cần cập nhật sang 1.7 và 1.680.** |
| `nextgen-2026/8-NGUON-VON-NGAN-HANG-KHA-THI-TAC-DONG.pdf` | Nguồn vốn, ngân hàng, khả thi, kế hoạch triển khai, tác động (33 trang) |
| `nextgen-2026/research-*.md`, `scratchpad` | Kết quả tra cứu thô (không nằm trong repo; có thể mất khi dọn máy) |

**Bộ nhớ dự án** (ở `C:\Users\admin\.claude\projects\D--KHOAN-DA-24H\memory\`): ghi chú về hai repo, bẫy heredoc, bẫy curl tiếng Việt, aiDaChay, biến môi trường Render, sàn a11y, học tủ, phát hành APK, nguồn ngoài đã kiểm, pháp nhân và tuổi dưới 18.

---

## 10. Việc còn treo — chủ dự án cần làm

Theo mức ưu tiên:

1. **Thu hồi khoá dịch vụ Firebase đã bị lộ trong cuộc trò chuyện** (key id bắt đầu `f45d11a0`): xoá khoá trong Google Cloud, và xoá các tệp JSON khoá đã tải về trong `D:\` và thư mục Downloads. Sau đó dán khoá mới vào `FCM_SERVICE_ACCOUNT` trên Render.
2. **Sao lưu khoá ký APK** (`android/khoan-da-phat-hanh.jks` và `keystore.properties`) ra ngoài máy, ít nhất hai nơi.
3. **Thử báo động trên hai điện thoại thật:** cha mẹ (APK 1.7) và con (web hoặc APK). Đây là bằng chứng quan trọng nhất còn thiếu cho "Cầu dao gia đình".
4. **Xác nhận monitor UptimeRobot** gọi `/healthz` đang hoạt động. Xác nhận Health Check Path trên Render là `/healthz`.
5. **Cập nhật Q&A và tài liệu nguồn vốn** từ 1.6 / 1.637 test sang 1.7 / 1.680 test, và sửa các chỗ đã cũ được liệt kê trong `docs/…` (ví dụ "chưa ai làm", "Android giai đoạn 2", model `claude-fable-5`).
6. **Quyết định các câu hỏi §12:** (a) hướng luật nới chậm có đi tiếp không; (b) không áp độ trễ cho việc gỡ người thân khỏi vòng tròn gia đình (khuyến nghị giữ nguyên); (c) không lưu trạng thái giữ tiền trên máy chủ (khuyến nghị giữ nguyên); (d) có thành lập pháp nhân và tìm ngân hàng chạy thử không; (e) bốn câu ở mục 5 của kế hoạch tăng sức mạnh.
7. **Sửa `CLAUDE.md` về Monzo** (nếu được phép): CLAUDE.md ghi Monzo "giữ đến khi người tin cậy xác nhận"; nghiên cứu cho thấy Monzo chỉ để người tin cậy xem xét, không có quyền phủ quyết. Không sửa khi chưa có chỉ đạo, vì đây là một trong bốn khối khoá.
8. **Luật sư xác nhận** CV 6190/NHNN-TT (báo chí nói có khoảng chờ 24 giờ cho người nhận mới, hạn 1/3/2027, chưa đọc bản gốc), Luật BVDLCN 91/2025 và NĐ 356/2025 (dữ liệu nhạy cảm, chuyển xuyên biên giới cho gateway AI ngoài Việt Nam), và điều kiện pháp nhân khi có thành viên dưới 18 tuổi.
9. **Thời hạn cuộc thi:** Sáng tạo trẻ Hà Nội (đăng ký 5–10/10, đã qua; hỏi ban tổ chức còn nhận không); GASA đề cử 15/10; Techfest Hà Tĩnh 30/10 17h; I-Star 31/10 17h; Techfest quốc gia chung kết 13–15/11 (chưa rõ hạn nộp và pháp nhân); SV_STARTUP lần IX (thể lệ chưa ra).
10. **Mẫu thật và người dùng thật:** thu 25 tin lừa đảo thật có đồng ý, xoá thông tin nhận dạng, hai người gán nhãn độc lập. Thử với 5–10 người cao tuổi ngoài gia đình.

---

## 11. Giới hạn đã biết (chưa làm hoặc chưa đúng)

- **Nút "Mã QR"** chỉ điền sẵn một câu mô tả rồi kiểm bằng chữ. **Chưa quét camera thật.** Quyền CAMERA đã khai. Phải làm thật hoặc gỡ nút.
- **Màn ngân hàng trong "Chìa khoá thứ hai"** là **mô phỏng**, có dải "MÔ PHỎNG" không tắt được. Không nối ngân hàng thật, không chặn giao dịch.
- **Hai công tắc Guardian** ("chặn số lạ", "ghim thông báo") chưa nối với máy bố mẹ. Mặc định tắt. Giao diện nói rõ là chỉ thể hiện ý định.
- **Ra-đa thủ đoạn giữa các nhà:** chưa có máy chủ gom dữ liệu.
- **Phát hiện thụ động** cần mạng (`POST /api/detect`). Tầng luật chưa được nạp vào gói trình duyệt, nên mất mạng thì app chỉ mở được, không phân tích được.
- **Kiểm tra magic bytes ảnh** (`media-validation.js`) có mã nhưng **chưa được nối** vào `server.js`. Giới hạn thực tế hiện là độ dài chuỗi base64 (trên 5 triệu ký tự → 413).
- **Đọc ảnh:** model chính không có thị giác (`coThiGiac: false`). Ảnh chỉ đọc được khi có `GEMINI_API_KEY` và đường Gemini hoạt động. Nếu không có, ảnh báo "không đọc được" và nhãn bị nâng lên Nghi ngờ (không bao giờ "Chưa thấy").
- **Hẹn giờ 60 giây báo động** là `setTimeout` trong RAM. Mất khi máy chủ khởi động lại; có khôi phục lúc khởi động. Chưa phải hàng đợi bền.
- **Không có SLA** về thời gian hoạt động. Gói Render miễn phí. Chưa kiểm thử tải.
- **Tiếng Anh:** mẫu quá ít (34 tin nguy hiểm, 0 tin lành). Độ chính xác tiếng Anh chưa đo đáng tin.
- **iPhone:** chỉ dùng web (PWA), không có APK. Thông báo đẩy trên iOS chỉ khi thêm vào màn hình chính.
- **Đọc to qua Google** khi máy không có giọng Việt: chữ được gửi tới Google. Đã ghi trong chính sách riêng tư.
- **Lịch sử trên máy** lưu tiêu đề cắt 55 ký tự đầu của tin.
- **Một người viết mã.** Đây là rủi ro vận hành lớn nhất.

---

## 12. Bẫy đã gặp (đừng dẫm lại)

- **Heredoc và `sed` nuốt dấu gạch chéo và dấu `\`** trong regex và chuỗi escape: test vẫn xanh nhưng không kiểm được gì. Dùng công cụ Write/Edit cho mọi tệp có regex. (Ghi chú trong bộ nhớ.)
- **`curl` trên Git Bash làm hỏng tiếng Việt** khi gửi JSON. Đo API tiếng Việt bằng Python `urllib`. (Đã mất năm vòng vá cho một lỗi không tồn tại.)
- **`aiDaChay: false` không có nghĩa AI hỏng.** Chốt chặn bỏ qua AI là do thiết kế. Muốn kiểm AI thì dùng tin lành, không dùng tin lừa đảo.
- **Số đo trên bộ tự soạn bị coi là số thật:** mọi bản trình bày phải gắn nhãn đã đo / mục tiêu / giả định.
- **`esbuild` gói `server.ts` vào `dist/`:** `__dirname` sai. Đường dẫn tài nguyên tính từ gốc repo.
- **Vùng chạm và sàn a11y** nằm trong `vung-cham-san.css` không dùng `@layer`: Tailwind class `text-[..]` / `leading` / `min-h` trên `<button>` là mã chết. Kiểm bằng computed style.
- **`/healthz` phải đứng trước `express.json` và trước giới hạn tần suất.** Nếu đặt sau, dịch vụ gõ cửa giữ máy chủ sống có thể bị 429 hoặc bị chậm.
- **`X-Powered-By`** rò từ app ngoài; đã tắt ở `server.ts`.
- **Scaffold React ghi đè `package.json`** từng làm chết bộ test và bộ đo. Kiểm `package.json` trước khi tin `latest.json`.
- **Proxy AI luôn trả SSE** nếu không khai `stream: false`. Bộ đo khi đó hỏng, không phải model hỏng.
- **Bản Q&A và tài liệu cũ** từng ghi model `claude-fable-5` và 1.229 test. Đều sai với hiện tại.

---

## 13. Quy tắc làm việc

- Trả lời bằng tiếng Việt. Mọi chuỗi người dùng đọc phải đi qua i18n (`src/i18n.ts`, `src/catalog.ts`), không mã cứng.
- Trước khi sửa: `git status`, và đọc test liên quan. Không reset thay đổi chưa commit của người khác.
- Thay đổi về hợp đồng, nhãn, ngưỡng, chốt chặn, privacy model: **dừng và hỏi chủ dự án.**
- Sau mỗi thay đổi quan trọng: `npm test`, `npm run lint`, `npm run build`, và ghi kết quả thực tế vào báo cáo.
- Commit và push vào `main`: chủ dự án đã cấp quyền này cho các thay đổi trong luồng làm việc gần đây. Khi không chắc, hỏi lại.
- Không in, không commit, không dán secret. Không tải hay cài APK từ nguồn lạ.
- Chỗ nào chưa kiểm chứng: ghi `[CHƯA KIỂM]` hoặc `[MỤC TIÊU]`. Không ghi "đã đo" cho thứ chưa đo.

---

## 14. Liên hệ

- Chủ dự án (liên hệ công khai trong chính sách riêng tư): quannxm.sags@gmail.com
- Git: nhánh `main` trên `https://github.com/quannguyen991/khoan-da-nic`. Tài khoản commit: `quannguyen991`.

---

*File này là ảnh chụp trạng thái ngày 13/10/2026. Khi có thay đổi lớn, cập nhật mục 1 và mục 10 trước tiên.*
