# PROMPT ĐỂ DÁN VÀO CURSOR

Chép nguyên khối dưới đây vào ô chat đầu tiên của Cursor.

---

Tôi đang làm **Khoan Đã** — app chống lừa đảo cho người cao tuổi Việt Nam.
Dự án đã chạy được và có 791 test xanh. Bạn tiếp quản, không phải bắt đầu lại.

## Trước khi viết dòng mã nào, đọc ba tệp này theo đúng thứ tự

1. `D:\KHOAN-DA-24H\CLAUDE.md` — hợp đồng ràng buộc. **Đây là luật, không phải
   gợi ý.** Bốn khối §HĐ / §4 / §11 / §12 được chép nguyên văn từ tài liệu gốc.
2. `D:\KHOAN-DA-24H\BAN-GIAO.md` — bản đồ dự án, trạng thái đo được, và **danh
   sách bẫy đã dẫm phải** kèm số đo.
3. `D:\KHOAN-DA-24H\src\analysis\pipeline.js` — đường phân tích chính.

Hai thư mục, hai repo git riêng:

```
D:\KHOAN-DA-24H\                 backend Node + Express, cổng 8089
D:\trợ-lý-ảo-khoan-đã (1)\       frontend React + Vite + Capacitor
```

## Sáu điều tôi cần bạn giữ

**① Chú thích `⚠️` trong mã là tài liệu, không phải rác.** Mỗi cái là một lỗi
đã xảy ra thật kèm số đo và ngày tháng. Đừng "dọn dẹp" chúng, đừng rút gọn
chúng. Chúng là lý do mã trông như vậy.

**② §4.3 là dạng lỗi đặc trưng của dự án này** — nó đã xuất hiện hơn mười lần
ở những chỗ hoàn toàn khác nhau, luôn cùng một hình dạng: một thứ *chưa đo
được* hiện ra y hệt một thứ *đã đo và không sao*. Mỗi khi bạn thêm một nguồn
đầu vào, một lượt gọi mạng, một lớp lưu trữ — hãy hỏi: *"hỏng thì người dùng
thấy gì?"* Nếu câu trả lời là "giống hệt lúc bình thường" thì đó là bug.

**③ §4.2 — mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm.**
Tầng AI chỉ bật cờ; `decision-engine.js` là bộ luật duy nhất ra mức. Đừng thêm
đường nào hạ mức.

**④ Trước khi tin một con số, kiểm bộ đo bằng một ca đã biết kết quả.** Dự án
này đã nhiều lần bị chính công cụ đo lừa: bộ eval hỏng 89,5% lượt gọi vẫn báo
"không thấy rủi ro"; một test bọc assertion trong `if` nên xanh mà không kiểm
gì; `npm test` ghi cứng một tệp nên 13 test chưa bao giờ chạy.

**⑤ Đừng tự đổi những thứ trong §12** — ba nhãn rủi ro, ngưỡng 20/45, số lượng
critical override, privacy model, Rule Engine. Thấy cần đổi thì **dừng lại và
hỏi tôi**, đừng làm rồi báo sau.

**⑥ Sửa xong thì ĐO, đừng suy luận.** Backend: `npm test` (736 bài). Frontend:
`npm test` (55 bài). Thay đổi ở tầng phát hiện thì chạy thêm so sánh trước/sau
trên `eval/dataset/*.jsonl` và cho tôi hai con số: **báo oan** và **bỏ sót**.

## Việc tôi muốn làm tiếp

*(sửa lại phần này theo ý bạn trước khi gửi)*

- Nối kênh thông báo `IMPORTANCE_HIGH` và popup đè màn hình vào luồng thật:
  khi kết quả là `CAO` thì gửi thông báo lên đầu danh sách và hiện popup. Hàm
  đã có ở `frontend/src/native.ts` (`dungKenhCanhBao`, `hienPopupCanhBao`)
  nhưng **chưa chỗ nào gọi**.
- Parity VI↔EN đang 16,6 (ngưỡng ≤3,0).
- 13 mẫu `warn-*` báo oan: nội dung DẠY về lừa đảo bị nhận là lừa đảo.

## Cách tôi muốn bạn làm việc

- Nói thẳng khi một yêu cầu của tôi mâu thuẫn với hợp đồng — **hợp đồng thắng**,
  và ghi lại xung đột thay vì âm thầm làm theo.
- Đừng báo "xong" khi chưa chạy test.
- Đừng viết "hoàn thiện 100%" khi còn hạng mục chưa làm (§11 cấm).
- Tiếng Việt, xưng "cháu", gọi tôi là "bác" trong mọi chuỗi hiển thị cho người
  dùng cuối. Còn nói chuyện với tôi thì bình thường.
