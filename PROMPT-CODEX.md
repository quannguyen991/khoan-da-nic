# PROMPT BÀN GIAO CHO CODEX

Chép nguyên khối dưới đây vào ô chat đầu tiên của Codex. Viết ngày **20/9/2026**.

---

Tôi đang làm **Khoan Đã** — app chống lừa đảo cho người cao tuổi Việt Nam.
Dự án đã chạy được, **1.272 test xanh**, và đang có **một đống việc chưa commit**.
Bạn tiếp quản, không phải bắt đầu lại.

Trả lời tôi bằng **tiếng Việt**, kể cả tóm tắt và commit message.

---

## ① Đọc trước khi viết dòng mã nào — theo đúng thứ tự này

| # | Tệp | Vì sao |
|---|---|---|
| 1 | `CLAUDE.md` | **Đây là luật, không phải gợi ý.** Bốn khối §HĐ / §4 / §11 / §12 chép nguyên văn từ `BACKEND.md`. Đọc hết, đừng lướt. |
| 2 | `BAN-GIAO.md` | Bản đồ dự án + danh sách bẫy đã dẫm kèm số đo. |
| 3 | `THAM-KHAO-DAY-DU.md` và `QA-BAN-GIAM-KHAO-v2.md` | **Định vị sản phẩm nằm ở đây, KHÔNG nằm ở `CLAUDE.md`.** Bỏ qua hai tệp này là mô tả sai dự án. |
| 4 | `docs/CAU-TRUC-DU-AN.md` | Cấu trúc thư mục. |
| 5 | `backend/src/analysis/pipeline.js` | Đường phân tích chính. |
| 6 | `backend/src/analysis/decision-engine.js` | **Bộ luật duy nhất ra mức rủi ro.** |

Sau đó, tuỳ việc mà đọc thêm:

```
backend/src/analysis/direct-precheck.js     khớp mẫu tầng luật (vừa sửa lớn 19/9)
backend/src/analysis/context-builder.js     chuẩn hoá đầu vào, bỏ dấu, tách đoạn
backend/src/analysis/locale-packs/vi-VN.js  mẫu tiếng Việt  (~600 mẫu)
backend/src/analysis/locale-packs/en-US.js  mẫu tiếng Anh   — §6.10 buộc hai pack phủ CÙNG tập tín hiệu
backend/src/analysis/llm-extractor.js       tầng AI — chỉ bật cờ, không ra mức
backend/src/tro-ly-noi.js                   trợ lý hội thoại (MỚI, chưa commit)
src/App.tsx                                 ~7.600 dòng, gần hết giao diện
src/components/                             màn tách riêng
src/i18n.ts                                 catalog chữ — MỌI chuỗi người đọc phải qua đây
public/vung-cham-san.css                    sàn tiếp cận, nạp SAU CÙNG, thắng mọi utility
public/sw.js                                service worker
test/                                       106 tệp test, đọc tên là biết nó canh gì
eval/                                       bộ đo — xem §⑥ bên dưới
```

**Chú thích `⚠️` trong mã là tài liệu, không phải rác.** Mỗi cái là một lỗi đã
xảy ra thật, kèm số đo và ngày tháng. Đừng "dọn dẹp", đừng rút gọn. Chúng là lý
do mã trông như vậy. Bạn thêm sửa gì thì cũng viết chú thích cùng kiểu: **đo
được gì, ngày nào, và vì sao cách làm hiển nhiên lại sai**.

---

## ② Chạy thế nào — đo lại hôm nay 20/9/2026

```bash
npm install
npm run dev            # Vite + backend TRÊN CÙNG MỘT CỔNG (server.ts)
```

`server.ts` mount `backend/server.js` rồi mới gắn Vite ở middleware mode. Nghĩa
là **`/api/*` chạy sẵn trên đúng cổng đó**, không cần khởi động máy chủ thứ hai,
không cần proxy. Cổng lấy từ `process.env.PORT`, mặc định 3000.

> ⚠️ Tôi đã mất một vòng vì tưởng phải chạy backend riêng và thêm một `proxy`
> vào `vite.config.ts`. Kiểm bằng cách tắt hẳn backend rời: `/api/suc-khoe` trên
> cổng dev vẫn trả 200. Cái proxy đã gỡ. **Đừng thêm lại.**

Các lệnh khác:

```bash
npm test               # 1.272 ca — phải xanh hết trước khi commit
npm run lint           # tsc --noEmit
npm run build          # vite build + esbuild server
npm run eval           # bộ đo nội bộ
npm run eval:quocte    # KhoanBench — xem §⑥
npm run build:apk      # APK (dùng .env.apk)
node backend/server.js # CHỈ khi muốn API mà không cần frontend (cổng PORT trong .env)
```

`.env` giữ khoá LLM. **Không commit, không dán ra ngoài, không đưa lên Render.**
`VITE_API_GOC` chỉ có trong `.env.apk` — bản web dùng đường dẫn tương đối.

---

## ③ Trạng thái git — CHƯA COMMIT GÌ CẢ

Nhánh hiện tại: **`sua-bo-luat-va-do-luong`**. Nhánh triển khai là `main`
(Render tự dựng lại khi `main` đổi). Đẩy `sua-bo-luat-va-do-luong:main` là
fast-forward — lịch sử hai nhánh đã nối tay hôm 17/9.

Toàn bộ việc dưới đây **đang nằm trong cây làm việc, chưa commit**. Chủ dự án
muốn xem trên localhost trước. **Đừng tự commit, đừng tự đẩy lên — chỉ làm khi
được bảo.**

**Tệp mới**

| Tệp | Là gì |
|---|---|
| `backend/src/tro-ly-noi.js` | Trợ lý hội thoại: gọi model, lọc đầu ra theo §11, trả `{loiDap, canKiem}`. **Không** trả mức rủi ro. |
| `src/components/TroLyNoi.tsx` | Màn "Nói cho cháu nghe" — nói / gõ / gửi ảnh. |
| `src/components/QuaCauNoi.tsx` | Quả cầu micro (SVG) thay linh vật ở trang chủ. |
| `test/va-cham-dau-tieng-viet.test.js` | 15 ca canh va chạm dấu. |
| `test/tro-ly-khong-ket-luan.test.js` | 16 ca canh ranh giới "model nói chuyện, bộ luật ra mức". |
| `test/bao-ghi-am-noi-that.test.js` | 5 ca canh lời báo trạng thái ghi âm. |
| `test/man-khan-cap-khong-nhieu-chu.test.js` | 6 ca canh màn khẩn cấp. |

**Tệp sửa** — `backend/server.js` (thêm `POST /api/tro-ly`), `direct-precheck.js`,
`context-builder.js`, hai locale pack, `src/App.tsx`, `src/main.tsx`,
`src/i18n.ts`, `src/index.css`, `public/vung-cham-san.css`, tám component, hai
tệp test.

---

## ④ Bốn việc lớn vừa làm — để bạn không làm lại

**A. Va chạm dấu tiếng Việt (tầng luật).** Bỏ dấu làm nhiều từ khác hẳn nhau
rụng vào cùng một chuỗi: gặp/gấp, khăn/khẩn, ngày/ngay, tại/tải, chuyện/chuyển,
bác/bạc. Đo được ba câu **lành** đều nổ `MAN_URGENCY`. Vá bằng ba thứ:

- `boThanh()` — bỏ riêng năm thanh điệu, giữ dấu tạo chữ (ă â ê ô ơ ư đ);
- `chuanDauThanh()` — nối hai lối đặt dấu ("toà án" / "tòa án");
- luật hẹp: bản bỏ dấu **chỉ** dùng để đọc chữ KHÔNG DẤU. Thiếu dấu thì tha,
  **đổi** dấu thì không.

Kết quả trên 571 mẫu: bỏ 42 mã lý do sai, thêm 22 mã đúng, khớp nhãn 225→227.

**B. `\b` của JavaScript không coi chữ có dấu là chữ.** Không có cờ `u`, `\w`
chỉ là `[A-Za-z0-9_]`, nên `(chia sẻ)\b` **chưa bao giờ** khớp. Lỗi này sống
được nhiều tháng vì nhánh bỏ dấu gánh hộ. Đã có `bienDich()` viết lại `\b` bằng
bộ chữ tiếng Việt, và `test/ranh-gioi-tu-unicode.test.js` canh các pack.

**C. Trợ lý nói.** Chủ dự án chọn bản hội thoại LLM đầy đủ. Ranh giới đã chốt và
**không được dịch chuyển**: model nghe, hỏi lại, giải thích, an ủi; khi lời bác
kể có tình huống cần chấm, nó chỉ chép vào `canKiem`, rồi frontend đưa chuỗi đó
qua **đúng `/api/analyze`** mà mọi lượt kiểm khác đi. Model không nhìn thấy điểm,
không nhìn thấy nhãn. Có hàng rào đọc ĐẦU RA (§11) vì lời nhắc chỉ là đề nghị.

**D. Giao diện.** Quả cầu micro thay linh vật ở trang chủ; màn nghe dựng lại
theo ảnh thiết kế (tiêu đề = trạng thái, quả cầu, ba nút tròn); màn khẩn cấp cắt
từ 722 xuống 302 ký tự và kéo nút "GỌI NGAY" từ y=1308 lên y=682 trên màn cao
812; một hệ thẻ duy nhất (sticker: viền dày + bóng cứng).

---

## ⑤ Bẫy đã dẫm — đọc kỹ, mỗi cái tốn ít nhất một vòng

**① Service worker đệm cả mã nguồn ở bản dev.** `public/sw.js` đệm tài nguyên
tĩnh "đệm trước, nền tự làm mới", và trên máy chủ dev thì `/src/App.tsx` cũng là
tài nguyên tĩnh cùng gốc. Máy chủ trả mã mới, trình duyệt hiện giao diện hôm
trước. Đã vá: `src/main.tsx` chỉ đăng ký SW khi `PROD`, và ở `DEV` thì tự gỡ +
xoá kho đệm. **Nếu vẫn thấy giao diện cũ: Ctrl+Shift+R một lần.**

**② `requestAnimationFrame` đóng băng trong khung xem của agent.** Đo được **0
khung/giây**. Framer-motion đứng giữa chừng ở `opacity: 0.38`, nên mọi ảnh chụp
đều nhợt nhạt. **Đừng kết luận màu sắc từ ảnh chụp trong khung agent** — đo bằng
DOM (`getComputedStyle`, `getBoundingClientRect`), hoặc gỡ opacity bằng tay
trước khi chụp.

**③ Heredoc của Bash nuốt dấu gạch chéo.** Viết regex hay chuỗi `\u` qua
`<<'PY'` thì nó hỏng âm thầm — test vẫn xanh mà không canh gì cả. **Viết script
ra tệp bằng công cụ ghi tệp, rồi chạy tệp đó.**

**④ `curl` trên Git Bash làm hỏng tiếng Việt.** Đã mất 5 vòng vá một bug không
tồn tại. **Gọi API bằng Python `urllib`**, và đặt `PYTHONIOENCODING=utf-8`.

**⑤ Tệp nguồn dùng CRLF.** Script vá tệp phải đọc `newline=''`, chuyển về `\n`,
sửa, rồi ghi lại CRLF. Không thì mọi phép tìm-thay đều trượt.

**⑥ StrictMode chạy effect hai lần.** Cờ `conSong.current = false` đặt trong hàm
dọn sẽ không được bật lại ở lần mount thứ hai — màn đứng mãi ở "đang nghĩ" dù
máy chủ trả 200. Đặt lại `true` ở ĐẦU effect.

**⑦ `vung-cham-san.css` nạp sau cùng và không dùng `@layer`,** nên nó thắng mọi
utility của Tailwind — kể cả giá trị LỚN HƠN. `min-h-[96px]` từng bị ép xuống
55px. Muốn nút cao hơn thì dùng **đệm**, đừng dùng `min-height`.

---

## ⑥ Bộ đo — số trong `latest.json` ĐÃ CŨ

`eval/results/latest.json` là thứ trang `/transparency` đọc để biết số nào **đã
đo**. Bản hiện tại:

```
commit 972488e · model deepseek-v4-flash-0731 · 571 mẫu
dangerousRecall 70,2% · highRiskFP 4,1%
```

**Nó chạy TRƯỚC các thay đổi bộ luật hôm 19–20/9.** §11 cấm gọi một bản dựng là
"đã đo" khi mới chỉ là mục tiêu, và cấm gán số eval cho model chưa hề được gọi.
Nên: **chạy lại `npm run eval:quocte` rồi mới trích số**, và nếu số tụt thì nói
thẳng chứ đừng chọn con số đẹp hơn.

---

## ⑦ Việc còn treo — bốn cái chờ CHỦ DỰ ÁN quyết, đừng tự làm

1. **Nút tròn nổi đè lên ô nhập ở trang chủ.** Đo được nó che 12px trên cùng của
   nút Gửi (nút nổi y 583–642, ô nhập bắt đầu y 623). Trang chủ không còn chỗ
   trống nào đủ 59px. Ảnh thiết kế không có nút này, nhưng nó đang là **lối vào
   duy nhất** của màn `hoi_nhanh` ở chế độ đầy đủ — ẩn đi là dựng lại đúng cái
   lỗ đã vá cho màn gọn hôm 19/9.
2. **Tên các mục thanh điều hướng.** Ảnh thiết kế ghi Khám phá / Bảo vệ / Kiến
   thức / Cá nhân; hiện là Tìm kiếm / Lịch sử / Gia đình / Hồ sơ. Đổi tên tab là
   đổi đường chính — §12 buộc phải hỏi.
3. **Tự gửi nội dung thông báo lên máy chủ.** Hiện tắt cứng bằng
   `TU_GUI_TIN_NHAN_LEN_MAY_CHU = false` trong `src/canh-bao-thu-dong.ts`. Bật
   lên là đổi privacy model — §12 cấm tự quyết.
4. **Tám số tổng đài ngân hàng, 0 số đã được người duyệt.** Cảnh báo và số điện
   thoại phải có một **con người có tên** duyệt. AI không được tự duyệt thay.

Và ba mẫu trong bộ dữ liệu tụt mức sau khi sửa va chạm dấu — `vi-trungthuong-08`,
`real-vi-039`, `bc-mau-nhi-03`. Cả ba trước đây ra đúng mức nhờ một tín hiệu
**sai** (ví dụ "Một chương trình…" khớp "mở" nên nổ `DEV_ACCESSIBILITY_PERMISSION`).
Nay chúng có tín hiệu đúng nhưng chưa đủ điểm. Đẩy lên được thì phải đụng trọng
số hoặc ngưỡng 20/45 — **§12 cấm**, nên tôi dừng ở đó. Muốn xử lý thì viết thêm
**mẫu thật**, đừng nới ngưỡng.

---

## ⑧ Sáu điều tôi cần bạn giữ

**① §4.3 là dạng lỗi đặc trưng của dự án này.** Nó đã xuất hiện hơn mười lần ở
những chỗ hoàn toàn khác nhau, luôn cùng một hình dạng: một thứ *chưa đo được*
hiện ra y hệt một thứ *đã đo và không sao*. Mỗi khi thêm một nguồn đầu vào, một
lượt gọi mạng, một lớp đệm — hỏi: **"hỏng thì người dùng thấy gì?"** Nếu câu
trả lời là "giống hệt lúc bình thường" thì đó là bug, và phải thêm ca kiểm.

**② §4.2 — mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác.** Tầng AI chỉ bật cờ;
`decision-engine.js` là bộ luật duy nhất ra mức. Không thêm đường nào hạ mức.
Đặc biệt: **không thêm cụm từ nào hạ mức vô điều kiện** — đã đo, thêm `"ch play"`
vào danh sách tắt làm tụt hẳn một kịch bản giả danh công an.

**③ §4.1 — ba nhãn, không có nhãn thứ tư, và KHÔNG BAO GIỜ có nhãn "An toàn".**
Mọi chuỗi người đọc phải đến từ `src/i18n.ts`, kể cả `aria-label`, notification,
manifest shortcut.

**④ Đo trước khi nói.** Đừng viết "đã sửa", "nhanh hơn", "chính xác hơn" nếu
chưa có số. Nếu không đo được thì nói là chưa đo. §11 cấm gọi mục tiêu là số đo.

**⑤ Chạy `npm test` trước mỗi lần báo xong.** 1.272 ca. Có ca sẽ đỏ đúng lúc bạn
làm hỏng một ràng buộc an toàn — đọc thông điệp của nó, đừng sửa ca kiểm cho
xanh. Nếu ràng buộc thật sự đổi thì sửa ca kiểm **và ghi lý do vào chú thích**.

**⑥ Không commit, không đẩy lên khi chưa được bảo.** Đang có nhiều việc chưa
commit; chủ dự án muốn xem trên localhost trước. `main` là nhánh chạy thật —
đẩy lên là người dùng thật thấy ngay.

---

## ⑨ Giọng văn khi viết cho người dùng cuối

Gọi người dùng theo xưng hô đã chọn (mặc định **"bác"**), tự xưng **"cháu"**.
Câu ngắn. Không thuật ngữ. Không trách móc — không có câu nào kiểu "sao bác lại
tin". Tiếng Việt dài hơn tiếng Anh ~30% nên đừng thiết kế nút vừa khít chữ, và
`line-height` dưới 1,25 là cắt dấu (ế, ộ, ữ, ị, ặ).
