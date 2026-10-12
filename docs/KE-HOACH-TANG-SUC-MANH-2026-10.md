# KẾ HOẠCH TĂNG SỨC MẠNH CHO KHOAN ĐÃ

> Ngày lập: 13/10/2026. Căn cứ: `eval/results/latest.json`, mã nguồn nhánh hiện tại,
> các báo cáo tra cứu app và ngân hàng ngày 12/10 (`DANH-GIA-20-Y-TUONG.md`, `TINH-NANG-KHA-THI.md`).
> Trạng thái: **đề xuất, chưa làm.** Các mục đánh dấu ❓ cần quyết định của chủ dự án.

---

## 0. Đọc trước: vì sao app chưa đủ thuyết phục

| Điểm yếu | Bằng chứng trong repo |
|---|---|
| **Nhận dạng dựa vào người dùng dán chữ** | App không nghe cuộc gọi (đúng thiết kế). Lúc đang gọi, bác không dán được gì. Lần chạy `--ghi`/`--ai` không có kịch bản nào "bác đang nghe điện thoại" |
| **Tầng luật một mình chỉ bắt 29,4%** tin nguy hiểm | `node eval/run.js`, 30/9/2026 (rule 1.6.3, 571 mẫu) |
| **Số 82,6% có AI là số trên bộ tự soạn, luật được chỉnh trên chính bộ đó** | `latest.json` (rule 1.6.1, phát lại từ đệm AI, `tinHieuGoiMoi: 0`) |
| **Không có mẫu thật** | `eval/mau-that/` trống; `/transparency` hiện cờ `khong_co_mau_that` |
| **Quyết định dừng ở "gọi con", chưa đụng tới bước tiền** | `intervention-ladder.js`: PAUSE_60S / VERIFY_PATH chỉ là màn hình; không có hành động cụ thể cho từng kịch bản |
| **Thiếu kịch bản** | Chỉ thấy tên kịch bản: giả danh công an, tuyển dụng, giao hàng, người thân, ngân hàng, trúng thưởng, thuế, dịch vụ thiết yếu, hỗ trợ kỹ thuật, đầu tư, cấp cứu. **Chưa thấy:** tình cảm qua mạng (romance), vay tín dụng đen, BHXH/lương hưu giả, cộng tác viên làm nhiệm vụ, tiền ảo (chỉ có "đầu tư lợi nhuận cao đảm bảo") |

**Hệ quả:** muốn "quyết định mạnh hơn" thì phải (a) có thêm tín hiệu đúng lúc người dùng đang gọi, (b) biến mức cao thành một việc cụ thể làm ngay, (c) đo được bằng mẫu thật. Chỉ tăng độ nhạy mà không đo sẽ kéo theo báo nhầm, và §4.2 + bằng chứng Akesson cho thấy báo nhầm làm người dùng mệt và tắt cảnh báo.

---

## 1. Nguyên tắc không được phá

- **AI không quyết mức.** Mọi tín hiệu mới đi qua `decision-engine.js` (§4.2).
- **Chỉ làm tăng cảnh giác.** Không thêm cụm nào hạ mức vô điều kiện (§12).
- **Không có nhãn "An toàn".** Mức thấp luôn là "Chưa thấy dấu hiệu rủi ro" kèm phần chưa kiểm được (§4.1, §4.3).
- **Không hứa chặn cuộc gọi hay giao dịch** (§11, §12).
- **Không quyền mới nếu chưa hỏi chủ dự án** (xem mục 5).
- **Không đổi ngưỡng 20/45/69, không đổi 10 chốt chặn** nếu chưa hỏi (§12). Kế hoạch này **không** đổi chúng.
- **Ô không tick ≠ "không có"** (§4.3). Câu hỏi 5 mục chỉ thêm tín hiệu khi bác tick.

---

## 2. Các ý được chọn (xếp theo giá trị / công sức)

### A. Bảng hỏi "Bác có được yêu cầu những việc này không?" — **ưu tiên 1**

**Vấn đề:** lúc đang gọi, bác không dán được tin. Bảng hỏi bằng nút to cho phép bác trả lời nhanh bằng một chạm.

**Cơ chế:** 5 câu có/không, mỗi câu một nút lớn (≥56px):
1. Người gọi có bảo bác đọc mã (OTP) không?
2. Có bảo bác chuyển tiền / "tài khoản an toàn" không?
3. Có bảo bác giữ bí mật, đừng nói với con không?
4. Có bảo bác cài app hoặc cho xem màn hình không?
5. Có doạ (công an, toà, mất tiền ngay) không?

- Tick ≥1 câu thuộc nhóm nguy hiểm → tín hiệu `present` do người dùng khai, nguồn `bang_hoi`, **không qua AI**, đi vào bộ luật như tín hiệu thường.
- Không tick → không có tín hiệu nào. Không hiện "không có" (§4.3).
- Câu chữ tránh trách móc: "Có ai bảo bác…", không "bác đã…".

**Quyền cần:** không có. **Đo:** tỷ lệ tick, tỷ lệ báo nhầm trên tin lành (phải đo trước khi bật).
**Rủi ro:** người dùng tick bừa khi hoảng. Mitigation: tick chỉ tăng cảnh giác, không kết luận; hiển thị "bác đã trả lời: …" để bác sửa.
**Công sức:** nhỏ–vừa (một màn + một nhánh tín hiệu + test + eval mới).

### B. Từ khoá gia đình xoay theo thời gian — **ưu tiên 2**

**Vấn đề:** kẻ giả giọng con cháu. Bác cần một cách xác nhận **không cần mạng và không cần app của người gọi**.

**Cơ chế:** khi cài, con và bác cùng nhập một từ khoá (hoặc quét QR trực tiếp). Từ khoá **đổi theo ngày, tính trên máy**, không gửi lên máy chủ. Khi có người nhận là con mà đòi tiền, bác hỏi từ khoá hôm nay.

- Có thể làm cục bộ hoàn toàn (`TINH-NANG-KHA-THI.md` mục D có ý tương tự).
- Nút trong app: "Hỏi từ khoá con" hiện từ khoá đúng của hôm nay trên máy bác, **chỉ khi bác đang nghi ngờ**.

**Quyền cần:** không có. **Đo:** diễn tập với người nhà (không đo được trên người lạ trước giai đoạn C).
**Rủi ro:** quên từ khoá lúc hoảng. Mitigation: nhắc trong diễn tập định kỳ (ROLESafe cho thấy hiệu quả tan sau ~1 tháng, nên phải nhắc lại).
**Công sức:** vừa (lưu trữ, xoay khoá, QR, một màn).

### C. Banner trong cuộc gọi kéo dài — **ưu tiên 3**

**Vấn đề:** phần "lúc đang gọi" của kịch bản.

**Cơ chế:** khi `TheoDoiCuocGoi` thấy cuộc gọi kéo dài trên 3 phút (không cần biết số), hiện dải nổi (đã có `PopupDeManHinh`): "Đang gọi: đừng đọc mã, đừng chuyển tiền. Gọi con?" + nút "Tôi ổn". Không phụ thuộc số lạ, không đọc app nào đang mở.

**Quyền cần:** không có mới (`READ_PHONE_STATE`, `SYSTEM_ALERT_WINDOW` đã khai).
**Đo:** tỷ lệ bấm "Tôi ổn" theo độ dài cuộc gọi. **Rủi ro:** báo nhầm cuộc gọi gia đình dài. Mitigation: nút "Tôi ổn" và ghi nhận để chỉnh ngưỡng.
**Công sức:** nhỏ.

### D. Mức cao biến thành việc cụ thể — **ưu tiên 4** (mạnh hơn mà không đổi ngưỡng)

**Vấn đề:** hiện mức cao chủ yếu nói "dừng lại". Cần việc tiếp theo rõ ràng theo kịch bản.

**Cơ chế:** với mỗi `hoKichBan` đã có, màn hình hiện **3 bước** cố định:
- Bước 1: dừng — không chuyển tiền, không đọc mã hôm nay.
- Bước 2: gọi người tin cậy (số đã lưu, một chạm).
- Bước 3: nếu đã chuyển: mở "72 giờ đầu" (đã có).

Đây là nội dung catalog, không đổi quyết định. Không có chữ "chặn".

**Đo:** tỷ lệ bác bấm bước 2 (trong diễn tập). **Công sức:** nhỏ (catalog + một màn).

### E. Câu trả lời mẫu trong thông báo tin nhắn — **ưu tiên 5**

Từ báo cáo app (ý "thanh phản đòn"), chỉ lấy phần **gợi ý**:
- Khi thông báo tin nhắn từ app nhắn tin (đã có `DocThongBao` nghe đúng các app đã liệt kê) có dấu hiệu, hiện thẻ nổi với 2–3 câu trả lời mẫu. Bác **tự copy và dán**. App không gửi thay bác.
- Ví dụ mẫu: "Tôi sẽ đến công an phường trực tiếp, không làm qua điện thoại."

**Không làm:** trợ năng (đọc chữ app khác), tự gửi, tự chặn liên hệ, tự chụp đoạn chat gửi nhóm gia đình.
**Quyền cần:** không mới. **Đo:** tỷ lệ bác copy mẫu. **Công sức:** vừa.

### F. Lời nhắn sẵn của con — **ưu tiên 6**

Con ghi một câu ngắn (ví dụ: "Bố ơi, con đang ở nhà, đừng chuyển tiền"). Khi có mức cao, app phát đúng câu đó **cho bác nghe trên máy bác**, không phát vào cuộc gọi. Không dùng để giả giọng con, và con biết mình đã ghi gì. **Công sức:** nhỏ.

### G. Mở rộng kịch bản — **ưu tiên 7** (quan trọng nhất cho "nhận dạng đủ")

Thêm kịch bản chưa có, mỗi kịch bản có ≥30 mẫu do người viết ở nguồn công khai (Bộ Công an, NCA, tinnhiemmang), **không có danh tính người cụ thể** (§12):
- Tình cảm qua mạng (romance) — người "quen" trên mạng nhờ chuyển tiền.
- Vay tín dụng đen qua app/Zalo — đe doạ, nhắn tin cho người thân.
- BHXH/lương hưu giả — "cập nhật hồ sơ", "hoàn tiền bảo hiểm".
- Cộng tác viên làm nhiệm vụ — "like, đặt cọc để nhận hoa hồng".
- Tiền ảo — chuyển USDT, "sàn" giả.

**Đo:** eval theo từng kịch bản (recall, báo nhầm). **Công sức:** lớn (chủ yếu viết và gán nhãn mẫu).

### H. Mẫu thật có đồng ý — **ưu tiên 8** (không phải tính năng nhưng là thứ thuyết phục nhất)

Mục tiêu 25–40 tin thật có đồng ý, xoá thông tin nhận dạng, hai người gán nhãn độc lập (công cụ `scripts/kiem-mau-that.js` đã có). Đây là số duy nhất ban giám khảo tin được hơn số tự soạn.

---

## 3. Ý đã loại hoặc cần chủ dự án quyết

| Ý | Quyết định | Lý do |
|---|---|---|
| Quét số lạ bằng vai trò lọc cuộc gọi (CallScreeningService) | ❌ Loại | Là chặn cuộc gọi (§11) |
| Đọc nhật ký cuộc gọi để biết số | ❌ Loại | Quyền đã bỏ từ đầu (`PERMISSIONS-AND-POLICY.md`) |
| Phát hiện app ngân hàng đang mở (xem sử dụng app) | ❌ Loại | Quyền nhạy cảm, Play soi kỹ, vượt mô hình quyền riêng tư |
| Cuộc gọi giả, còi vào cuộc gọi | ❌ Loại | Lừa người già bằng thủ đoạn kẻ gian dùng |
| VPN chặn mạng | ❌ Loại | Là chặn; §4.6 |
| Chế độ "gia đình quản trị" kiểu Truecaller (người quản trị nhận cảnh báo, cúp máy hộ) | ❓ **Cần chủ dự án quyết** | Đổi mô hình quyền riêng tư (§12). Dễ thành "tự bật cảnh báo thay chủ tài khoản" |
| Số điện thoại lừa đảo dùng chung cộng đồng | ❓ **Cần quyết** | Cần cơ chế pháp lý và đạo đức; §12 cấm quy kết cá nhân; chỉ nhận mẫu/tactic |
| Đổi ngưỡng 20/45/69 hoặc thêm chốt chặn thứ 11 | ❓ **Cần quyết** | §12 |

---

## 4. Lộ trình và cổng

| Giai đoạn | Nội dung | Thời gian dự kiến | Cổng đi tiếp |
|---|---|---|---|
| **A** | Bảng hỏi 5 câu (A), banner cuộc gọi (C), việc cụ thể cho mức cao (D) | 2–3 tuần | Test + test "không có nhãn an toàn" + test "ô không tick không tạo tín hiệu" + eval không tụt recall và báo nhầm trên bộ hiện có |
| **B** | Từ khoá gia đình (B), câu trả lời mẫu (E), lời nhắn con (F) | 2–3 tuần | Diễn tập với 2 gia đình; ghi nhận tỷ lệ bấm |
| **C** | Mở rộng 5 kịch bản (G), eval theo kịch bản | 3–4 tuần | Mỗi kịch bản ≥30 mẫu; báo nhầm trên tin lành không tăng quá mốc hiện tại |
| **D** | Thử với 5–10 người cao tuổi ngoài gia đình (T1, T2) + 25 mẫu thật (H) | song song từ giai đoạn B | Có số, dù nhỏ, trước khi nói "đã kiểm chứng" |

**Điều không được nói ở bất kỳ cổng nào:** "giảm lừa đảo X%", "đã cứu N người", "chắc chắn nhận ra". Số đo luôn gắn nhãn đã đo / mục tiêu.

**Mục tiêu [MỤC TIÊU], không phải kết quả:** recall mức cao trên mẫu thật ≥ 80%; báo nhầm mức cao ≤ 3% trên tin lành; tỷ lệ bấm "Tôi ổn" theo dõi ở mọi lần.

---

## 5. Cần chủ dự án trả lời

1. Có chấp nhận bảng hỏi 5 câu (A) làm nguồn tín hiệu mới không? (Thêm tín hiệu = đổi bộ luật, cần chạy lại eval.)
2. Chế độ quản trị gia đình (mục 3): **không làm**, hay làm với đồng ý rõ ràng của bác và có nhật ký?
3. Có làm số lừa đảo dùng chung không, và ai duyệt?
4. Ưu tiên giai đoạn D (thử người thật) trước hay sau giai đoạn C?

---

*Kế hoạch này không thay đổi mã nguồn. Mọi thay đổi bộ luật phải đi kèm eval chạy lại và được ghi vào `CHANGELOG` của luật.*
