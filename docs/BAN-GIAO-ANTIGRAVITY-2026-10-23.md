# KHOAN ĐÃ — BÀN GIAO CHO ANTIGRAVITY

**Ngày lập:** 23/10/2026
**Nhánh đang làm:** `sua-bo-luat-va-do-luong` · **HEAD:** `96079dc`
**Remote:** `origin` = `https://github.com/quannguyen991/khoan-da-nic.git`
**Trạng thái:** có thay đổi chưa commit. Không phải bản đã phát hành.

File này bổ sung cho `docs/BAN-GIAO-DU-AN-2026-10.md` (13/10/2026). Bản 13/10 là nguồn đầy đủ về kiến trúc, bẫy và việc còn treo. File này chỉ ghi lại những gì đã kiểm lại hôm nay và những chỗ cần biết trước khi sửa code.

---

## 1. Đọc theo thứ tự

1. `CLAUDE.md`: hợp đồng và ràng buộc cứng. Bốn khối §HĐ, §4, §11, §12 không được sửa. Muốn đổi thì dừng lại và hỏi chủ dự án.
2. `docs/BAN-GIAO-DU-AN-2026-10.md`: kiến trúc, bản đồ tệp, biến môi trường, triển khai, bẫy đã gặp, việc còn treo.
3. File này: trạng thái đo lại ngày 23/10 và danh sách thay đổi chưa commit.
4. `PRODUCT.md`: định vị, người dùng, giọng văn.

Không dùng `BAN-GIAO.md` (16/8) và `BAN-GIAO-CLAUDE.md` (22/9) làm nguồn trạng thái. Hai file này còn đúng về kiến trúc nhưng số liệu và đường dẫn đã cũ.

---

## 2. Trạng thái đo lại ngày 23/10/2026

| Hạng mục | Kết quả | Cách kiểm |
|---|---|---|
| Kiểm kiểu | **Đạt**, không lỗi | `npm run lint` (`tsc --noEmit`) |
| Bộ kiểm thử | **1.680 đạt, 0 lỗi, 0 bỏ qua** | `npm test`, chạy 2 lần, mỗi lần khoảng 53–69 giây |
| Dựng bản chạy thật | **Chưa chạy** trong lượt này | `npm run build` |
| Máy chủ Render, Neon, Firebase, khoá ký APK | **Chưa kiểm** trong lượt này | cần đăng nhập dịch vụ, làm bằng tay |
| Bộ đo | Không chạy lại. `eval/results/latest.json` giữ nguyên | xem mục 5 |

Các số liệu của sản phẩm (đã đo trên bộ tự soạn, không phải người dùng thật):

- Recall mức Cao: 82,6% (219/265).
- Báo nhầm mức Cao: 1,8% (3/169).
- Chỉ tầng luật, không AI: 29,4% (đo ngày 30/9/2026).

Mục tiêu trong `eval/run.js` (recall ≥ 95%, báo nhầm ≤ 3%) **chưa đạt**. Không ghi "đã đạt" trong bất kỳ tài liệu nào.

---

## 3. Thay đổi chưa commit

**10 tệp đã sửa** (`git diff --stat`: 401 dòng thêm, 3 dòng xoá):

- `.claude/launch.json`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/vn/khoanda/app/KhoanDaPlugin.java`
- `android/app/src/main/res/values/strings.xml`, `android/app/src/main/res/values-en/strings.xml`
- `docs/BAN-GIAO-DU-AN-2026-10.md`
- `src/App.tsx`, `src/catalog.ts`, `src/native.ts`, `src/components/AppMenuModal.tsx`

**15 mục chưa theo dõi** (`git status --short`, dòng `??`):

- Giao diện mới: `src/components/BanPhimKhoanDa.tsx`, `src/components/TroLyPhanHoiTaiCho.tsx`, `src/components/TrungTamBaoVe.tsx`
- Android: `KhoanDaKeyboardService.java`, `res/xml/keyboard_method.xml`
- Tài liệu: `docs/PHASE-1-TRUNG-TAM-BAO-VE.md`, `docs/PHASE-2-3-5-IMPLEMENTATION.md`, `docs/PHIEU-TRIEN-KHAI-2026-10-15.md`, `PROMPT-CODEX.md`, `BAN-GIAO-CLAUDE.md`
- Nextgen: `nextgen-2026/CAU-HOI-HOI-MENTOR.md`, `nextgen-2026/KHOAN-DA-Giai-thich-ky-thuat.docx`
- Thư mục: `.impeccable/`, `codebrain/`, `dtkn-2026/`

**Chưa rõ** các mục trên có được chủ dự án duyệt hay không. Không commit gộp chúng vào một lần. Hỏi chủ dự án trước.

---

## 4. Việc phải làm trước khi sửa tiếp (từ mục 10 của bản 13/10, chưa xác nhận đã làm)

1. **Thu hồi khoá dịch vụ Firebase đã lộ trong cuộc trò chuyện** (key id bắt đầu `f45d11a0`). Xoá khoá trên Google Cloud và xoá các tệp JSON đã tải về. Sau đó dán khoá mới vào `FCM_SERVICE_ACCOUNT` trên Render. **Không in, không dán, không commit giá trị khoá.**
2. **Sao lưu khoá ký APK** `android/khoan-da-phat-hanh.jks` và `android/keystore.properties` ra ngoài máy, ít nhất hai nơi. Hai tệp này bị `.gitignore` và chỉ có trên máy này. Mất khoá là không cập nhật được APK cho người đã cài.
3. Thử báo động trên hai điện thoại thật (cha mẹ dùng APK 1.7, con dùng web hoặc APK).
4. Xác nhận monitor UptimeRobot còn gọi `/healthz`.

---

## 5. Ràng buộc tóm tắt (nguồn đầy đủ là `CLAUDE.md`)

- **Không** có nhãn "An toàn", "Safe" hay biến thể. Ba nhãn cố định: `Nguy hiểm cao` · `Nghi ngờ` · `Chưa thấy dấu hiệu rủi ro`.
- AI chỉ trích tín hiệu `present` hoặc `unknown`. Không có `absent`. Không có các trường `riskScore`, `riskLabel`, `critical`, `interventionLevel`, `safe`.
- `src/analysis/decision-engine.js` là bộ luật duy nhất quyết định mức rủi ro. Thứ thêm vào chỉ được làm tăng cảnh giác.
- "Chưa kiểm được" không được hiển thị như "đã kiểm, không thấy gì".
- Không đổi hợp đồng `/api/analyze`, ngưỡng 20/45/69, 10 chốt chặn, privacy model. Không thay luật bằng "LLM judge".
- Không hứa chặn cuộc gọi, chặn giao dịch, lấy lại tiền. Không viết "đã gửi cho người thân" khi mới đẩy đi.
- Mọi chuỗi người dùng đọc phải đi qua i18n (`src/i18n.ts`, `src/catalog.ts`), không mã cứng.
- Chỗ nào chưa kiểm chứng: ghi `[CHƯA KIỂM]` hoặc `[MỤC TIÊU]`. Không ghi "đã đo" cho thứ chưa đo.

**Về commit và push:** bản 13/10 ghi chủ dự án đã cấp quyền commit và push vào `main` cho luồng làm việc gần đây. Quyền đó chỉ áp dụng cho các thay đổi trong luồng đó. Khi không chắc, hỏi lại trước khi commit.

---

## 6. Lệnh thường dùng

```bash
cd D:\KHOAN-DA-24H
npm install
npm run dev            # máy chủ dev, cổng PORT (mặc định 3000)
npm test               # 1.680 bài
npm run lint           # kiểm kiểu
npm run build          # vite build + esbuild
npm run check          # kiểm cú pháp
npm run eval           # chạy bộ đo, không ghi tệp
```

**Cẩn thận:** `npm run eval:ghi` ghi đè `eval/results/latest.json`, tệp mà trang `/transparency` đọc. Chỉ chạy khi chủ dự án đã quyết định đo lại. Không chạy lệnh này để "thử".

---

## 7. Bẫy hay gặp

Danh sách đầy đủ ở mục 12 của bản 13/10. Ba cái dễ dẫm nhất:

- **Heredoc, `sed`, `curl` trên Git Bash** làm hỏng dấu gạch chéo, dấu `\` và tiếng Việt. Sửa tệp có regex bằng công cụ Write/Edit. Đo API tiếng Việt bằng Python `urllib`.
- **`aiDaChay: false` không có nghĩa AI hỏng.** Chốt chặn bỏ qua AI là thiết kế.
- **Đường dẫn tài nguyên:** `esbuild` gói `server.ts` vào `dist/`, nên `__dirname` sai. Tính đường dẫn từ gốc repo.

---

## 8. Ghi chú riêng cho Antigravity

- Repo hiện **không có** tệp cấu hình riêng cho Antigravity (đã kiểm: không có `AGENTS.md`, `GEMINI.md`, `.agent`). Nếu Antigravity cần tệp quy tắc riêng, tạo tệp đó trỏ về `CLAUDE.md` và file này. Đừng chép ràng buộc sang tệp mới, vì sẽ lệch nhau.
- Mô hình AI **trong sản phẩm** (`deepseek-v4-flash-0731` qua cổng AI Box) không liên quan đến công cụ lập trình đang dùng để sửa code.
- Trả lời người dùng bằng tiếng Việt. Khi báo cáo, phân biệt rõ đã kiểm, chưa kiểm và mục tiêu.

---

## 9. Liên hệ

- Chủ dự án (liên hệ công khai trong chính sách riêng tư): quannxm.sags@gmail.com
- Tài khoản commit trên GitHub: `quannguyen991`.

---

*Ảnh chụp trạng thái ngày 23/10/2026. Khi có thay đổi lớn, cập nhật mục 2 và mục 3 trước tiên.*
