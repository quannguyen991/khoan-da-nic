# Bộ mở rộng — 80 mẫu kịch bản 2026 (30/10/2026)

`mo-rong-30-10-2026.jsonl` — 80 mẫu **tự soạn**: 63 tin lừa đảo (VNeID, chuẩn hoá SIM,
điện lực, phạt nguội, BHXH, hoàn thuế, giấy triệu tập, giả con tai nạn / ở đồn công an,
sinh trắc học ngân hàng, đầu tư bot AI / tình cảm dẫn dắt, xuất khẩu lao động, từ thiện giả,
giải hạn, thuê tài khoản, chia sẻ màn hình, giả giám đốc, phishing email, các đoạn hội thoại
nhiều lượt, bản không dấu, bản tiếng Anh) và 17 tin lành gần giống (OTP thật, biến động số dư,
câu khuyến cáo, tin gia đình, nhắc lịch khám, biên lai chuyển khoản…).

Chạy: `node eval/run.js --bo mo-rong` (chỉ bộ luật). Không vào `npm run eval`, không vào `latest.json`.

## ⚠️ Đây KHÔNG phải số đo độc lập

- **Mẫu do máy soạn, nhãn do máy gán, chưa người nào duyệt.** `nguon = tai_dung`.
- **Luật đã được thêm SAU KHI nhìn bộ này** (rule 1.6.4 / `vi-VN@1.3.0`): mỗi cụm mới sinh ra từ một
  mẫu bị bỏ sót cụ thể. Con số trên bộ này chỉ trả lời "sửa luật lần sau có làm tụt lại không".
- **18 mẫu bị hạ sàn `muc_do` từ CAO xuống NGHI_NGO sau khi đo.** Lý do: bộ luật chia tín hiệu theo
  nhóm có trần, nên một kênh đòi hỏi đơn lẻ (nhập OTP trên link, chuyển tiền không kèm doạ/bí mật)
  không tự lên CAO — đó là thiết kế đã duyệt (§12), không phải lỗi. Nhưng việc hạ nhãn sau khi thấy
  kết quả là đúng thứ làm con số đẹp giả; mỗi mẫu đó có ghi chú `NHAN: NGHI_NGO la SAN`. Người duyệt
  nên xem lại xem có mẫu nào thật sự đáng CAO.
- Không đưa con số này lên slide như độ chính xác của sản phẩm (§11).

## Số đo lúc thêm (chỉ bộ luật, không AI)

| Bộ | Trước | Sau |
|---|---|---|
| `mo-rong` (80 mẫu) | 45/80 đạt, 17 mẫu lành 0 báo oan | 69/80 đạt, 0 báo oan (kèm hạ sàn 18 mẫu, xem trên) |
| Bộ chính 571 (531 mẫu chấm) | 256/531 | 257/531; **0 mẫu lành đổi mức** |
| Bộ ChatGPT `doi-chung` 153 | 75/153 | 75/153; 0 mẫu đổi |

Còn 11 mẫu bị bỏ sót khi chỉ có bộ luật — chủ yếu tin chỉ có **một đường link** và không có đòi
hỏi nào khác (phạt nguội, tem điện tử, giấy phép lái xe, khảo sát nhận quà, xem video), giá rẻ
bất thường (vé máy bay, iPhone, thuê nhà), và dụ cho mượn tài khoản. Các ca này cần AI trích tín
hiệu hoặc ngữ cảnh ngoài một tin (link thật, tên miền); không vá bằng cụm từ vì sẽ báo oan tin lành.

---

## Lượt 2 — `mo-rong-2-30-10-2026.jsonl` (56 mẫu, cùng ngày)

Soạn **trước khi** chỉnh luật lượt này và **không hạ nhãn sau khi đo**, nên chặt hơn lượt 1. Họ mới: BHYT giả,
đổi tiền Tết, trúng thưởng livestream, nhà mạng tặng data, vé sự kiện, xuất khẩu lao động / chạy trường,
mua vàng online, nhắc nợ giả, giả kiểm sát viên, mượn căn cước, thuốc chữa khỏi hoàn toàn, đa cấp, đất nền,
QR giảm giá, tống tiền clip, hotline giả, thẻ cào cho "con", Facebook bản quyền giả, nhận hàng hộ, nhận tiền
hộ, cuộc gọi tự động bấm phím, virus giả, thừa kế nước ngoài, thẻ hết hạn, xoá nợ xấu, giả giáo viên, vay app,
bốn đoạn hội thoại, bản không dấu, bản tiếng Anh — và 15 tin lành gần giống (OTP thật, biến động số dư, **bài dặn
thật của công an**, nhắc tiêm chủng, quảng cáo tiết kiệm, tuyển dụng nói rõ không thu phí…).

| | Trước chỉnh luật | Sau |
|---|---|---|
| Đạt | 39/56 | **42/56** |
| Tin lành báo oan | 1 | 0 |

⚠️ 42/56 **không độc lập**: hai cụm mới (mượn/thuê căn cước, nhắc nợ giả) được thêm sau khi thấy `m2-008`, `m2-010` bị bỏ sót.
Chỉ nhãn là không bị sửa sau khi đo.

**Còn 14 mẫu bị bỏ sót khi chỉ có bộ luật** — gần hết là kiểu "chuyển khoản / cọc trước" đứng một mình (14 điểm,
dưới ngưỡng 20): đổi tiền Tết, vé concert, vàng giá rẻ, đất nền giữ chỗ, bill giả, nhận tiền hộ, cuộc gọi tự
động. Phân biệt chúng với một cuộc mua bán thật cần ngữ cảnh ngoài một tin (người bán, giá thị trường) — không
vá bằng cụm từ.

### Hai lỗ có sẵn (không phải do lượt này) tìm thấy khi soạn lượt 2

1. **Bài dặn thật của công an báo NGHI_NGO/CAO oan.** "Gần đây có hiện tượng giả danh công an… yêu cầu chuyển
   tiền vào tài khoản tạm giữ. Công an không bao giờ làm việc qua điện thoại và không yêu cầu chuyển tiền." —
   loại tin hay được chuyển vào nhóm Zalo của người lớn tuổi. Thêm khung "hiện tượng giả danh" và để bộ bắt phủ
   định nhìn qua "yêu cầu / đòi / hỏi".
2. **Một câu thần chú có sẵn trên bản đã commit.** "Công an không yêu cầu chuyển tiền, **bác cứ gửi** 50 triệu
   vào tài khoản tạm giữ này, đừng nói ai." ra **CHUA_THAY** vì khung "không yêu cầu" nuốt cả vế lệnh phía sau —
   chữ "cứ" chen giữa người nghe và động từ làm lối thoát `LENH_TRUC_TIEP` trượt. Đã thêm "cứ"; test chiều kẻ
   gian nằm ở `test/kich-ban-2026-10.test.js`.

### Số đo toàn bộ (chỉ bộ luật), so với bản đã commit

Trên 860 mẫu (bộ chính 571 + ChatGPT 153 + hai bộ mở rộng): **14 mẫu được nâng mức — cả 14 là tin lừa đảo và
nằm trong trần cho phép; 0 tin lành bị nâng; 1 tin bị hạ — chính bài dặn thật của công an nói trên.**
