# Kiểm tuyên bố Gemini (chỉ đọc mã, commit cf3c5a4)

## 1. Edge-first, 64 tín hiệu, <50ms, chỉ gọi AI ca mập mờ: SAI một phần
- ĐÚNG: có đúng 64 tín hiệu, 8 nhóm (nạp `backend/src/analysis/signal-registry.js`, đếm bằng node: SIGNALS=64, GROUPS=8).
- KHÔNG ĐÚNG "chạy cục bộ trên điện thoại": APK gọi máy chủ qua `src/api-goc.ts:21` (VITE_API_GOC, onrender). `/api/analyze` chạy ở `backend/server.js:615`. `src/canh-bao-thu-dong.ts:19-24,51-53` tự ghi: nạp tầng 0 vào gói giao diện "chưa làm", đừng viết "hoạt động khi mất mạng". Không tìm thấy mã tầng 0 trong src/ hay android/.
- KHÔNG ĐÚNG "chỉ gọi AI ca mập mờ": `server.js:502-505` chỉ bỏ qua AI khi đã có critical override; mọi ca còn lại, kể cả tin lành, đều gọi AI (`server.js:543`). Bỏ qua AI là do chốt chặn, không phải do "ca rõ ràng".
- "<50ms": chỉ là NGÂN SÁCH ghi trong comment (`backend/src/detect/index.js:7`, `tang-0.js:3`). Không có test hay số đo độ trễ bộ luật. Đã đo duy nhất: `eval/results/do-tre-render.json` (qua máy chủ, có AI): trung vị 2.042 ms, p90 3.184 ms; 1 lượt không AI = 236 ms (gồm mạng).
- Chắc chắn: cao.

## 2. Giảm 76% token, 1.796 → 427: CÓ SỐ, NHƯNG KHÔNG PHẢI SỐ ĐO CỦA "BỘ LỌC CỤC BỘ"
- Hai số chỉ nằm trong comment `backend/src/ai/fable-client.js:242` ("Số đo cũ trên gateway") và bản nháp `nextgen-2026/DIEN-FORM-DEVPOST.md:305`. Không có trong eval/results/*.
- Đó là số của việc hạ `reasoning_effort` (mặc định → low) trên cùng một lời nhắc, đo trước đây, một model gateway cũ. Không liên quan đến "bỏ qua AI". Cũng chính file này (dòng 250-262) ghi `low` sau đó vẫn hỏng, đổi sang `none`; `latest.json` dùng model deepseek-v4-flash-0731, không phải model của số 1.796/427.
- `eval/results/chi-tiet.jsonl`: 571 dòng, không có trường aiDaChay/token. Không tính được tỷ lệ bỏ qua AI hay token trung bình. `latest.json` chỉ ghi aiDaChay:true cho cả lượt.
- Chắc chắn: cao.

## 3. Siêu nhẹ, chạy mượt máy Android cũ: KHÔNG CÓ BẰNG CHỨNG
- `android/variables.gradle:2-4`: minSdk 22 (Android 5.1), target/compile 34. `khoan-da.apk` = 8.815.638 byte (~8,4 MB).
- Là web/PWA bọc Capacitor (`capacitor.config.json`, webDir dist). Không tìm thấy benchmark trên máy cũ, đo RAM/pin/FPS. "Kéo dài vòng đời thiết bị" không có cơ sở.
- Chỉ nói được: hỗ trợ từ Android 5.1, APK ~8,4 MB. Chắc chắn: cao.

## 4. "Không lưu nội dung, người thân chỉ nhận cảnh báo": ĐÚNG VỀ LƯU, SAI nếu hiểu là "nội dung không rời máy"
- Lưu: `vault-store.js:27-31` chặn ghi các trường noiDung/vanBan/anh/otp/soTaiKhoan... vào kho (chặn theo tên khoá, không quét giá trị). Chính sách riêng tư `public/chinh-sach-rieng-tu.html:93,125` khớp. Không thấy ghi nội dung ra file/DB/console; log lỗi AI cố ý không kèm nội dung (`server.js:~560`).
- Nội dung vẫn rời máy: toàn văn/ảnh gửi lên máy chủ khi bấm kiểm, rồi sang nhà cung cấp AI bên thứ ba (gateway/Gemini, `fable-client.js:155`); chính sách thừa nhận (dòng 93).
- Chỗ nội dung CÓ THỂ nằm lại: (a) `canh-bao-hai-phia.js:305-306` lưu `noiDung` nếu `chiaSeNoiDung===true` (mặc định tắt; kho `khoCanhBao` ở `server.js:1464`, cần xác nhận là RAM; hàng rào vault chặn khoá `noiDung` nếu đi qua vault); (b) `/api/vu-viec/*` trả thực thể trích ra (số điện thoại, số tài khoản, tên miền, số tiền) về máy, hồ sơ giữ ở máy; (c) bộ nhớ RAM của đọc-to-máy-chủ (`doc-to-may-chu.js`, chữ app tự soạn); (d) eval/cache và dataset chỉ là dữ liệu đo.
- Chắc chắn: trung bình-cao (chưa lần hết mọi route).

## 5. Share target, shortcut, widget: CÓ share + shortcut, KHÔNG widget
- Android: `AndroidManifest.xml` có intent-filter SEND text/plain và image/* (nhận chia sẻ từ Zalo/tin nhắn), deep link `khoanda://`, `android.app.shortcuts`→`res/xml/shortcuts.xml`. Có bong bóng nổi (`BongBongNoi`), nhận thông báo, bàn phím riêng.
- PWA `public/manifest.json:31-40` có `share_target` (GET `/?chia_se=1`) và `shortcuts` ("Hỏi Nhanh").
- Widget màn hình chính (AppWidgetProvider): không tìm thấy.

## Không được đưa vào hồ sơ
- "Chạy cục bộ/edge-first trên điện thoại", "hoạt động khi mất mạng".
- "<50ms" như số đã đo.
- "Chỉ gọi AI cho ca mập mờ" (thực tế: gọi AI trừ khi chốt chặn nổ).
- "Giảm 76% token / 1.796→427" gắn với bộ lọc cục bộ hoặc tiết kiệm năng lượng.
- "Siêu nhẹ, mượt máy cũ, kéo dài vòng đời thiết bị".
- "Nội dung không bao giờ rời máy".
- Widget màn hình chính.
