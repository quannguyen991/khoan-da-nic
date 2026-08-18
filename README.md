# Khoan Đã

**Trợ lý cảnh giác lừa đảo cho người cao tuổi Việt Nam.**
Dừng lại trước, kiểm sau, rồi hãy làm.

> Bài dự thi **Intel® Vietnam AI Impact Festival 2026** — bảng AI Changemakers (13–17 tuổi).

---

## Vấn đề

Người cao tuổi là nhóm bị nhắm nhiều nhất trong các vụ lừa đảo qua điện thoại và
tin nhắn ở Việt Nam: giả danh công an, "tài khoản an toàn", đòi mã OTP, dụ cài ứng
dụng lạ. Cái khó không phải là thiếu thông tin cảnh báo — mà là **lúc đang bị gọi,
người ta không có ai để hỏi trong 60 giây tiếp theo.**

> 📌 *Chỗ điền số liệu có nguồn: [ ] báo cáo Cục An toàn thông tin — Bộ TT&TT ·*
> *[ ] Cục A05 — Bộ Công an. Ghi rõ năm và đường dẫn.*

## Cách giải quyết

Ba đường vào, một bộ luật, và một nguyên tắc không đổi: **app không bao giờ nói
nó biết nhiều hơn thứ nó thật sự đọc được.**

| Đường vào | Dùng khi |
|---|---|
| **Bộ hỏi nhanh 4 nhánh** | Đang áp điện thoại vào tai, không gõ được. Chạm 1 lần, trả lời 2–3 câu CÓ/KHÔNG, ra kết luận trong ~8 giây |
| **Dán tin nhắn / chia sẻ từ Zalo** | Nhận được tin đáng ngờ |
| **Chụp ảnh màn hình · quét QR · nói ra** | Không biết gõ lại nội dung |

---

## Kiến trúc: AI đọc hiểu, luật cứng quyết định

```
Người dùng ──► Tầng luật (CPU, <50ms) ──┬──► đủ rõ  ──► Kết luận ngay, KHÔNG gọi AI
                                        │
                                        └──► cần đọc hiểu ──► LLM trích tín hiệu
                                                                     │
                                                       Bộ luật quy đổi ra mức
```

**Vì sao tách làm hai.** Một mô hình ngôn ngữ không được phép là thứ quyết định
người dùng có mất 50 triệu hay không: nó có thể bịa, và nó có thể bị chính tin
nhắn của kẻ lừa đảo dụ. Nên AI làm việc nó giỏi nhất — đọc hiểu tiếng Việt đời
thường, viết tắt, không dấu, lẫn tiếng lóng — còn quyết định cuối cùng đi qua một
bộ luật **kiểm tra được, giải thích được, và không thể bị dụ bằng câu chữ**.

**Và AI là không thể thiếu.** Đo trên bộ 445 mẫu: bỏ tầng AI đi, độ nhạy phát hiện
rơi từ **67,6% xuống 3,8%**. Không luật nào hay biểu thức chính quy nào đọc được
một câu người thật viết ra.

### Bốn luật bất biến

1. **Ba nhãn, không có nhãn thứ tư.** `Nguy hiểm cao` · `Nghi ngờ` ·
   `Chưa thấy dấu hiệu rủi ro`. **Không có nhãn "An toàn"** — hệ thống không hứa
   an toàn, nó chỉ nói chưa thấy dấu hiệu *trong thông tin được cung cấp*.
2. **"Không kiểm được" ≠ "đã kiểm, không thấy gì".** Mỗi kết quả đều mang danh
   sách `chuaKiem`, hiện **cùng cỡ chữ với nhãn**: chưa nghe được cuộc gọi, không
   đọc được ảnh, lượt này không có AI đọc…
3. **Mọi thứ thêm vào chỉ được làm TĂNG cảnh giác.** Trả lời "KHÔNG" trong bộ hỏi
   nhanh **không trừ điểm** — nó nghĩa là "chưa thấy dấu hiệu này", không phải
   bằng chứng vắng mặt.
4. **Luôn có lối ra.** Kể cả ở màn khẩn cấp, luôn có nút *"Tôi ổn, không có gì
   nguy hiểm"* — báo động giả mà không thoát được thì người ta gỡ ứng dụng.

---

## Chạy AI ngay trên máy

App nói giao thức OpenAI nên cắm thẳng vào **Ollama / llama.cpp / LM Studio**:

```bash
LLM_CUC_BO=1
LLM_CUC_BO_MODEL=qwen2.5:3b-instruct-q4_K_M
```

Khi đó **nội dung tin nhắn không rời khỏi máy**, và màn kết quả tự hiện dòng
🔒 *"AI chạy ngay trên máy này"*. Xem [HUONG-DAN-AI-CUC-BO.md](HUONG-DAN-AI-CUC-BO.md).

Mô hình 3B lượng tử hoá 4-bit được chọn **vì** GPU đích chỉ có 4 GB VRAM — ràng
buộc phần cứng quyết định lựa chọn mô hình, không phải ngược lại.

## Tiêu thụ năng lượng

Thiết kế để **giảm** số lượt gọi AI, không phải tăng:

- Tầng luật trả kết quả dưới 50ms; khi tín hiệu đã đủ rõ, máy chủ **kết luận
  luôn và không gọi mô hình lượt nào**.
- Hạ mức suy luận: token sinh ra giảm từ ~1.796 xuống ~427 mỗi lượt (−76%), thời
  gian từ 23,5s xuống 6,7s — mà độ nhạy còn **tăng** từ 62,5% lên 71,9%.
- **Không huấn luyện mô hình mới.**

## Quyền riêng tư

- Máy chủ **không lưu nội dung thô**. Bản ghi vụ việc chỉ mang thực thể đã trích.
- CSP `default-src 'self'` — không một ảnh, font hay lượt gọi nào ra máy chủ ngoài.
- Không đồng bộ tài khoản mặc định.
- ⚠️ **Một ngoại lệ được khai báo thẳng trong app:** nút nói dùng Web Speech API
  của trình duyệt, và API đó gửi âm thanh lên máy chủ của hãng trình duyệt. Màn
  ghi âm nói rõ điều này thay vì im lặng.

## Tiếp cận

Sàn cứng, có test chặn: vùng chạm ≥52px (nút chính ≥56px), cỡ chữ ≥14px ở cả ba
bậc 15/17/20px, tương phản 4,5:1, không cắt dấu tiếng Việt, nhãn ARIA cho nút chỉ
có biểu tượng, chạy được khi mất mạng.

---

## Công nghệ

| Tầng | Dùng gì |
|---|---|
| Giao diện | React 19 · TypeScript (strict) · Vite 6 · Tailwind 4 · PWA + service worker |
| Máy chủ | Node · Express · bộ luật thuần, không phụ thuộc mạng |
| AI | LLM qua giao thức OpenAI — chạy cục bộ (Ollama) hoặc qua gateway |
| Đo lường | Bộ eval 445 mẫu, 25 test tự động |

## Chạy thử

```bash
npm install
npm run dev
```

```bash
npm test
```

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `backend/src/analysis/decision-engine.js` | **Bộ luật duy nhất** ra mức rủi ro |
| `backend/src/analysis/critical-overrides.js` | 10 tổ hợp buộc vào chế độ bảo vệ |
| `backend/src/bo-hoi-nhanh.js` | Bộ hỏi nhanh lúc đang bị gọi |
| `src/catalog.ts` | Mã → chữ hiển thị (đổi ngôn ngữ không đổi được kết luận) |
| `src/config/ma-hop-dong.json` | Hợp đồng mã giữa hai nửa |
| `test/hop-dong.test.mjs` | Hàng rào cho các luật bất biến |

## Ghi nhận

Dự án dùng công cụ AI hỗ trợ trong quá trình phát triển. Các quyết định thiết kế
và ràng buộc an toàn — ba nhãn rủi ro, nguyên tắc "không kiểm được ≠ đã kiểm",
danh sách câu không được viết — do nhóm đặt ra và được ghi lại trong `CLAUDE.md`.
