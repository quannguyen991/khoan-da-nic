# Bộ tin lừa đảo báo chí trích nguyên văn (gom 21/11/2026)

Tệp: `bao-chi-21-11-2026.jsonl`, gồm 31 mẫu tiếng Việt. Mỗi dòng là một JSON, theo cùng khuôn với `eval/dataset`.

## Bộ này là gì

Đây là lời và tin nhắn của kẻ lừa đảo có thật, được báo chí hoặc cơ quan công an trích lại nguyên văn: SMS, tin Zalo/Facebook, lời trong cuộc gọi và chữ trên trang web giả. Người nhận không tự chuyển tiếp các mẫu này, nên bộ này khác `eval/mau-that`. Dùng nó để đo app trên dữ liệu ngoài đời mà bộ luật chưa từng được chỉnh theo.

## Cách gom

- Lấy bài từ trang tìm kiếm của VnExpress, Tuổi Trẻ, Thanh Niên, VietNamNet, VTV, từ mục cảnh báo của tinnhiemmang.vn (Cục An toàn thông tin) và một số bài lẻ (trang Công an An Giang, Công an Hà Tĩnh, Luật sư Việt Nam, CafeF, Người Quan Sát, 24HMoney, Sài Gòn Giải Phóng).
- Đọc văn bản thô của bài và chỉ giữ câu mà bài đặt trong ngoặc kép, ghi rõ là lời hoặc tin của kẻ gian. Bỏ lời nạn nhân, lời công an và những câu bài chỉ tóm tắt.
- Giữ nguyên chữ, kể cả không dấu và lỗi chính tả. Một số chỗ đã che: link thành `[liên kết đã ẩn]`, số tài khoản và tên chủ tài khoản thành `[số đã che]`, tên người thật hoặc tên xưng trong tin thành chữ viết tắt (A, H, T). Tên cơ quan, ngân hàng bị mạo danh và số tiền giữ nguyên.
- Chỉ bc-002 nối hai đoạn trích của cùng một tin bằng dấu `…`. Lý do được ghi ở `ghi_chu`.
- Báo ít khi trích trọn câu, nên nhiều vụ chỉ có cụm 2–5 chữ và đã bị bỏ. Không đủ mẫu năm 2025–2026 nên bộ lấy thêm 9 mẫu năm 2022 (tinnhiemmang.vn, Pháp Luật TP.HCM, VnExpress).

## Số mẫu theo thủ đoạn (`ho`)

| ho | số mẫu |
|---|---|
| gia_danh_ngan_hang | 7 |
| phat_nguoi | 4 |
| vay_tien | 3 |
| gia_danh_bhxh | 2 |
| gia_danh_cong_an | 2 |
| gia_danh_nha_mang | 2 |
| vneid | 2 |
| tinh_cam | 2 |
| nhan_nham | 2 |
| bat_coc_online | 1 |
| viec_nhe_luong_cao | 1 |
| lay_lai_tien | 1 |
| gia_danh_dien_luc | 1 |
| trung_thuong | 1 |

- Theo năm đăng: 22 mẫu năm 2025–2026, 9 mẫu năm 2022.
- Theo `muc_do`: 14 CAO, 17 NGHI_NGO.
- Còn thiếu hoặc rất mỏng: đầu tư/chứng khoán, giao hàng/COD, người thân cấp cứu, thuế. Báo chỉ trích cụm ngắn cho các thủ đoạn này.

## Nhãn chưa có người duyệt

`muc_do` do AI gán theo luật sau. Mẫu là CAO nếu chính câu trích có yêu cầu chuyển tiền, đọc OTP, đưa mật khẩu hay thông tin, cài app hoặc bấm link. Mẫu là NGHI_NGO nếu câu trích chỉ là mồi hoặc lời dọa, chưa có yêu cầu. Chưa có người duyệt nhãn. Mọi mẫu đều đặt `toi_da` = CAO vì đều là lừa đảo thật.

## Kiểm trùng với `eval/dataset`

So `noi_dung` với mọi `eval/dataset/*.jsonl` (571 dòng lúc kiểm), bằng tỉ lệ khớp ký tự sau khi chuẩn hoá. Đã loại **3 mẫu** trùng hoặc gần trùng trên 80%, nên trong tệp thiếu các id sau:

- bc-001 (phạt nguội VnExpress), trùng `real-vi-007`
- bc-010 (Zalo bị chiếm mượn 30 triệu), trùng `real-vi-013`
- bc-033 ("con bị tai nạn đang cấp cứu…"), trùng `real-vi-037`

Một số mẫu khác cũng vượt 0,8, nhưng chỉ vì chứa trọn một câu rất ngắn của `07-vi-cau-ngan` (ví dụ "nộp tiền điện cho tháng này"). Các mẫu đó không trùng nội dung nên được giữ.

## Kết quả đo lần đầu (21/11/2026, luật 1.6.4 + AI qwen3.8-flash, 31 lượt gọi mới)

- 14 tin nhãn CAO: 3 báo đỏ, 4 báo vàng, **7 không báo gì**.
- 17 tin nhãn NGHI_NGO: 4 báo vàng, **13 không báo gì** (nhiều mẫu chỉ là mảnh câu báo trích).
- Bỏ sót rơi vào ba nhóm: phạt nguội; SMS giả ngân hàng/nhà mạng có đường link (link đã che nên mất tín hiệu link);
  tín hiệu AI trả về bị loại khỏi `daNhan` (ví dụ bc-004, bc-024: AI trả 2 tín hiệu, giữ lại 0; cả hai là tin không dấu).
- Chưa sửa luật theo bộ này. Nếu sửa thì bộ này thành bộ hồi quy, không còn là số ngoài mẫu.

## Sau khi vá (luật 1.6.5, vi-VN@1.3.1, 21/11/2026)

Mẫu mới cho phạt nguội, "nếu không phải bạn thì bấm link" / link đổi mật khẩu, huỷ dịch vụ (nhận cả `https://`, `www`),
doạ mất lương hưu, "trong 3 giờ"; bộ kiểm dấu bỏ qua chỗ che "[…]". Không đổi trọng số, ngưỡng, tổ hợp.
Đo lại bằng câu trả lời AI đã lưu đệm (cùng model, cùng lời nhắc, 0 lượt gọi mới):

| | 1.6.4 | 1.6.5 |
|---|---|---|
| 14 tin CAO: báo đỏ / vàng / không báo | 3 / 4 / 7 | 5 / 7 / 2 |
| 17 tin NGHI_NGO được báo động | 4 | 5 |
| Bộ chính 531: báo đỏ nhầm tin lành | 8/169 | 8/169 |
| Bộ kiem-moi 70 | 37/40, 0/30 | 37/40, 0/30 |

Từ đây bộ này là **bộ hồi quy**, không còn là số ngoài mẫu. Hai tin CAO còn sót: bc-023 (đổi điểm lấy iPhone qua link)
và bc-032 (mảnh câu, không có yêu cầu rõ).
