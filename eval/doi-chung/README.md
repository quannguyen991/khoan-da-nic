# Bộ đối chứng — 153 mẫu ChatGPT (24/9/2026)

`chatgpt-157-24-9-2026.jsonl` — lấy từ bộ 157 dòng ChatGPT nghiên cứu sâu tin
lừa đảo nhắm người cao tuổi Việt Nam 2024–2026 (nguồn: Bộ Công an, công an
tỉnh, ngân hàng, báo chí; prompt ở `eval/dataset/PROMPT-CHATGPT-NGHIEN-CUU-TIN-LUA.md`).

## ⚠️ Đây KHÔNG phải số đo độc lập

Bộ luật 1.4.0 và 1.5.0 được chỉnh **nhìn vào chính bộ này**. Số trên bộ này
chỉ trả lời một câu: *sửa luật lần sau có làm tụt lại những gì đã vá không?*
Nó không nói được app bắt lừa đảo tốt đến đâu. Vì vậy:

- Bộ này **không** nằm trong `npm run eval` và **không** vào `latest.json`.
- Chạy riêng: `node eval/run.js --bo doi-chung` (thêm `--ai` để có AI,
  `--ghi` ghi ra `eval/results/doi-chung.json`).
- Không đưa con số từ bộ này lên slide như độ chính xác của sản phẩm.

## Đã sửa so với tệp gốc

| Việc | Mẫu | Lý do |
|---|---|---|
| Bỏ 4 mẫu | `poster_ngan_hang_qr_gia-1/2/3`, `hoan_thue_etax-3` | là câu **mô tả ảnh / tên miền**, không phải chữ trong tin — app không bao giờ nhận được câu đó |
| Hạ `nguyen_van` → `tai_dung` | `diem_thuong_ngan_hang-1`, `-4` | đã mở trang nguồn, không tìm thấy nguyên văn |

Mọi nhãn vẫn là `NHAN TU DONG-CAN NGUOI DUYET` — ChatGPT gán, chưa người nào duyệt.
Phân bố: 80 `CAO` · 37 `NGHI_NGO` · 36 `CHUA_THAY`, toàn tiếng Việt.

## Bộ độc lập còn thiếu

ChatGPT có tạo thêm một tệp 173 dòng (liên kết trong tệp .docx, SHA `12997d…`)
chưa tải về. Bộ đó **chưa ai nhìn**, nên nếu tải về thì để nguyên, chạy một lần
duy nhất, và **không** chỉnh luật theo nó — đó là số độc lập duy nhất có được
lúc này ngoài mẫu thật (`eval/mau-that/`).
