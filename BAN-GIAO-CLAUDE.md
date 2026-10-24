# KHOAN ĐÃ — FILE BÀN GIAO CHO CLAUDE

**Cập nhật:** 22/09/2026  
**Trạng thái:** đang có nhiều thay đổi chưa commit; chỉ làm việc trên localhost, chưa được tự ý commit hoặc push.

## 1. Cách tiếp quản bắt buộc

Đọc theo thứ tự:

1. `CLAUDE.md` — hợp đồng an toàn, không được tự sửa bốn khối §HĐ / §4 / §11 / §12.
2. `BAN-GIAO.md` — bản đồ dự án và các bẫy đã gặp.
3. File này — trạng thái công việc mới nhất.
4. `THAM-KHAO-DAY-DU.md`, `QA-BAN-GIAM-KHAO-v2.md` — định vị sản phẩm.
5. `docs/CAU-TRUC-DU-AN.md` — kiến trúc.
6. `backend/src/analysis/pipeline.js` và `backend/src/analysis/decision-engine.js` — luồng phân tích và bộ luật duy nhất ra mức rủi ro.

Trả lời bằng tiếng Việt. Trước khi sửa, kiểm tra working tree vì các thay đổi hiện tại thuộc về chủ dự án.

## 2. Mục tiêu sản phẩm

Khoan Đã là app hỗ trợ người cao tuổi Việt Nam nhận diện dấu hiệu lừa đảo. Người dùng có thể nhập tin nhắn, kể tình huống, gửi ảnh/QR hoặc dùng giọng nói. AI chỉ trích tín hiệu; bộ luật cố định mới quyết định nhãn rủi ro và hướng can thiệp.

Không được:

- thêm nhãn “An toàn”;
- để AI tự quyết định mức rủi ro;
- đổi hợp đồng `/api/analyze`;
- tự bật gửi dữ liệu lên máy chủ hoặc đồng bộ danh tính;
- tự commit/push;
- gọi một mục tiêu hoặc con số cũ là kết quả đã đo.

## 3. Những phần đã làm trong source Khoan Đã

Working tree hiện có các nhóm thay đổi chính sau:

### Backend và bộ luật

- `backend/server.js`: thêm/cập nhật API trợ lý hội thoại và các luồng liên quan.
- `backend/src/analysis/context-builder.js`: chuẩn hoá ngữ cảnh đầu vào.
- `backend/src/analysis/direct-precheck.js`: sửa lớp nhận diện tín hiệu và các ranh giới tiếng Việt.
- `backend/src/analysis/locale-packs/vi-VN.js`, `en-US.js`: bổ sung mẫu ngôn ngữ.
- `backend/src/tro-ly-noi.js`: trợ lý hội thoại; model có thể hỏi lại, giải thích và đưa nội dung cần kiểm tra, nhưng không được trả nhãn rủi ro.
- `backend/src/cong-dong-canh-giac.js`: luồng cộng đồng cảnh giác, cần kiểm tra kỹ privacy và nguồn dữ liệu trước khi mở rộng.

### Frontend

- `src/App.tsx`: nhiều thay đổi giao diện và luồng trang chính.
- `src/components/TroLyNoi.tsx`: màn trò chuyện/ghi âm với Khoan Đã.
- `src/components/QuaCauNoi.tsx`: quả cầu micro thay cho linh vật ở luồng nói.
- `src/components/CongDongCanhGiac.tsx`: màn cộng đồng cảnh giác.
- `src/components/Guardian.tsx`: màn phía con/guardian.
- `src/components/AppMenuModal.tsx`, `DoiPhanUng.tsx`, `HoSoVaRaDa.tsx`, `Learn.tsx`, `QuyTacGiaDinh.tsx`, `SoNganHang.tsx`, `TheoDoi72Gio.tsx`, `ThuTinhHuong.tsx`: đã chỉnh nhiều bố cục và nội dung.
- `src/i18n.ts`: bổ sung catalog chữ; mọi chuỗi người dùng đọc phải tiếp tục đi qua i18n.
- `src/main.tsx`, `src/index.css`, `public/vung-cham-san.css`, `src/native.ts`: thay đổi hệ giao diện, accessibility và native bridge.

### Test mới/chỉnh

Đã có thêm hoặc sửa các test liên quan tới:

- va chạm dấu tiếng Việt;
- trợ lý không được kết luận rủi ro;
- ghi âm và trạng thái lời nói;
- màn khẩn cấp ít chữ;
- màn hình không trắng;
- các ràng buộc giao diện/accessibility.

Các tệp test mới đáng chú ý:

```text
test/va-cham-dau-tieng-viet.test.js
test/tro-ly-khong-ket-luan.test.js
test/bao-ghi-am-noi-that.test.js
test/man-khan-cap-khong-nhieu-chu.test.js
```

## 4. Việc đang làm dở và cần sửa tiếp

### Ưu tiên cao

1. Chạy toàn bộ test hiện tại trước khi sửa thêm:

```bash
npm install
npm run lint
npm test
npm run build
```

2. Kiểm tra API trợ lý hội thoại: model chỉ được trả lời tự nhiên, hỏi lại và đưa `canKiem`; không được tạo `nhan`, `riskScore`, `safe` hoặc mức can thiệp.
3. Kiểm tra luồng cộng đồng: bài đăng phải ẩn danh, không lộ danh tính; AI chỉ tổng hợp nội dung, không tự quy kết cá nhân và không tự gửi dữ liệu ra ngoài nếu chưa có quyết định privacy rõ ràng.
4. Kiểm tra màn Guardian bằng thao tác vuốt/scroll và các nút gửi tin nhắn mẫu.
5. Kiểm tra đọc tiếng Việt/TTS: nếu không có giọng đọc hoặc việc đọc thất bại, giao diện phải nói rõ trạng thái chưa kiểm tra được, không hiển thị như đã đọc thành công.

### Các vấn đề UX còn cần rà soát

- Chatbot CodeBrain/tra cứu codebase từng trả lời sai ý định khi câu hỏi có cả từ chung như “dự án” và từ chuyên biệt như “luật”. Nếu tiếp tục sửa, phải ưu tiên cụm chuyên biệt và đối chiếu bằng chứng từ code.
- Không dùng danh sách Q&A hardcode làm nguồn sự thật. Nếu cần tốc độ, tạo knowledge card từ index/AST sau khi quét project; bộ Q&A chỉ nên dùng làm regression test.
- Các thông báo “đã gửi”, “đã đọc”, “đã an toàn” phải phản ánh trạng thái thật, không chỉ trạng thái UI.
- Không tin tuyệt đối ảnh chụp agent khi kiểm tra animation; dùng DOM/computed style và số đo thật.

## 5. Lệnh chạy localhost

Project Khoan Đã hiện dùng server/Vite theo cấu hình trong `package.json`:

```bash
cd D:\KHOAN-DA-24H
npm run dev
```

Các cổng có thể đang được dùng bởi các phiên test cũ. Kiểm tra tiến trình/cổng trước khi kết luận localhost hỏng. Không tự kill tiến trình không rõ nguồn.

## 6. CodeBrain — workspace phân tích riêng

`D:\KHOAN-DA-24H\codebrain` là app riêng, không phải source runtime của Khoan Đã. Nó đọc source Khoan Đã và tạo bản đồ codebase trong bộ nhớ. Không trộn file của CodeBrain vào các luồng an toàn của Khoan Đã.

CodeBrain hiện có:

- scan folder/file thật;
- AST parsing JS/TS/JSX/TSX;
- graph structure/architecture/feature;
- explorer, inspector, code context;
- tra cứu local nhanh theo intent và relationship;
- giao diện dark code observatory;
- AI Box đã từng được nối thử nhưng mặc định tra cứu nhanh hiện ưu tiên index local để tránh độ trễ mạng.

Chạy riêng:

```bash
cd D:\KHOAN-DA-24H\codebrain
npm run dev
```

Mở `http://localhost:5174`. Không đưa API key trong `.env.local` vào commit hoặc tài liệu công khai.

## 7. Quy tắc làm việc cho Claude

- Không bắt đầu lại dự án và không reset các thay đổi chưa commit.
- Đọc test trước khi sửa logic.
- Nếu sửa hợp đồng, privacy model, nhãn rủi ro, threshold hoặc Rule Engine: dừng và hỏi chủ dự án.
- Sau mỗi thay đổi quan trọng, chạy test/lint/build và ghi kết quả thực tế.
- Khi chưa thể xác minh một quan hệ hoặc kết quả, dùng `Unknown`/`Potential`, không bịa.
- Không ghi commit message hay thực hiện commit nếu chủ dự án chưa yêu cầu.

## 8. Checklist trước khi bàn giao tiếp

- [ ] Đọc `CLAUDE.md` và `BAN-GIAO.md`.
- [ ] Ghi lại working tree trước khi sửa.
- [ ] Chạy test liên quan và toàn bộ test nếu đủ thời gian.
- [ ] Test thủ công desktop/mobile trên localhost.
- [ ] Kiểm tra trạng thái lỗi, timeout, từ chối quyền và mất mạng.
- [ ] Không để lộ secret/API key.
- [ ] Báo rõ phần nào đã xác minh, phần nào mới là đề xuất.
