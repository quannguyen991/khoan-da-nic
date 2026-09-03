# GHI CHÚ NGUỒN — `11-bao-cao-100-kich-ban.jsonl`

> 66 mẫu, thêm ngày **2/9/2026**. Đọc trước khi dùng số đo của tệp này.

---

## Nguồn gốc — nói đúng thứ nó là

Bộ mẫu này **tái dựng** từ một báo cáo tổng hợp *"100 kịch bản tin nhắn và hội
thoại lừa đảo trực tuyến phổ biến tại Việt Nam"*, do người dùng cung cấp ngày
2/9/2026.

**`nguon` = `tai_dung`, KHÔNG PHẢI `nguon_mo`.** Đây là quyết định có chủ ý:

| Giá trị | Nghĩa trong dự án này |
|---|---|
| `nguon_mo` | chuyển biên từ nguồn công khai, **có URL tra ngược được** (xem `09-nguon-mo.jsonl`) |
| `tai_dung` | tự soạn / tái dựng theo thủ đoạn đã công bố |
| `that` | tin nhắn thật do đội thi tự gom, đã che PII |

Báo cáo nguồn **không kèm link cho từng kịch bản**, nên không đủ điều kiện làm
`nguon_mo`. Gán `nguon_mo` cho nó sẽ là nói quá về mức độ kiểm chứng — đúng thứ
§11 cấm. Nếu sau này tìm được nguồn gốc cho từng kịch bản (cảnh báo của ngân
hàng, Bộ Công an, báo chí), hãy sửa `nguon` **và** ghi URL vào `ghi_chu`.

**Bộ này KHÔNG lấp khoảng trống `nguon="that"`.** Khoảng trống đó vẫn là 0 mẫu.

---

## Nhãn do máy gán — chưa ai duyệt

Mọi mẫu mang cờ `NHAN TU DONG-CAN NGUOI DUYET` trong `ghi_chu`, giống 60 mẫu của
`09-nguon-mo.jsonl`.

> ⚠️ **Rủi ro cụ thể nếu bỏ qua bước duyệt:** gán nhãn sai theo hướng dễ (đặt
> `CAO` cho mọi thứ) sẽ làm recall trong báo cáo **tăng lên vì nhãn sai**, chứ
> không phải vì máy giỏi hơn. Đó là cách tự lừa mình khó phát hiện nhất, vì mọi
> con số vẫn trông hợp lý.

Người duyệt cần soát cột `muc_do` và `toi_da`, đặc biệt 6 mẫu đặt `NGHI_NGO`
(tiếp cận giai đoạn đầu, chưa đòi tiền) — ranh giới `NGHI_NGO` / `CAO` ở đó là
chỗ dễ tranh cãi nhất.

---

## Thành phần

| | Số mẫu |
|---|---:|
| Lừa đảo (`CAO` 48 + `NGHI_NGO` 6) | 54 |
| **Lành, đối chứng** (`CHUA_THAY`) | **12** |
| Cộng | 66 |

**Vì sao có 12 mẫu lành:** thêm mẫu lừa đảo mà không thêm mẫu lành thì recall
tăng còn báo động giả không ai đo được — bộ đo mất đúng khả năng phát hiện việc
luật mới bắt đầu kêu oan. Mỗi mẫu lành ở đây **cùng chủ đề** với một mẫu lừa đảo
trong tệp, và có **chi tiết neo** theo nguyên tắc 1 của `GHI-CHU-mau-kho.md`:

- `lanh-sim-01` — tin nhà mạng thật, cú pháp chính thức, không link, không đòi mã
- `lanh-bank-01` — SMS OTP thật, có sẵn câu *"không cung cấp mã này cho bất kỳ ai"*
- `lanh-bank-02` — thông báo sinh trắc học thật, chỉ dẫn tự làm trong app
- `lanh-nham-01` — chuyển nhầm thật: hướng dẫn ra ngân hàng tra soát, **không** đòi chuyển tay
- `lanh-thue-01` — tên miền `.gov.vn` đúng, không đòi tải app
- `lanh-recovery-01` — nội dung cảnh báo đúng, nói rõ không có dịch vụ lấy lại tiền

---

## 32 họ, trong đó ~20 họ HOÀN TOÀN MỚI

Trước khi thêm, bộ dữ liệu đã có 50 họ nhưng thiếu hẳn các mẫu hình sau:

| Họ mới | Vì sao đáng thêm |
|---|---|
| `mau_nhi` | tuyển mẫu nhí — không có mẫu nào trước đây |
| `cuop_sim` | chuẩn hoá thuê bao · nâng cấp 5G để cướp eSIM |
| `chuyen_huong_cuoc_goi` | mã USSD `**21*<số>#` — **cướp cả cuộc gọi đọc OTP của ngân hàng** |
| `gia_danh_bhxh` · `gia_danh_dien_luc` | dịch vụ công ngoài thuế/công an |
| `thu_thap_giay_to` | xin ảnh sổ đỏ, căn cước hai mặt |
| `khung_bo_doi_no` | đòi nợ qua danh bạ người không liên quan |
| `phat_nguoi_giao_thong` · `tong_dai_tu_dong` | phạt nguội · robocall toà án |
| `hang_rac_brushing` · `qr_qua_tang_giay` | gói hàng rác · mã QR gửi tận nhà (quishing) |
| `shipper_xin_otp` · `bill_gia_chiem_hang` | đền hàng đòi OTP · bill chuyển khoản giả |
| `xoa_no_xau_cic` · `tai_san_phat_mai` | xoá nợ CIC · xe ngân hàng thanh lý |
| `cuop_tk_telegram` · `chuyen_nham_ep_vay` | cướp Telegram · chuyển nhầm rồi ép vay nặng lãi |
| `deepfake_nguoi_than` | Deepfake video call · DeepVoice |
| `lua_coc_dat_cho` | combo du lịch · mã PNR giả · villa · hàng công nghệ |
| `lo_de_bao_so` · `dich_vu_ma_gia` | lô đề · "hacker mũ trắng" · kéo game về bờ |
| `qua_quoc_te_hai_quan` | mắt xích cuối của lừa đảo tình cảm |
| `sinh_trac_hoc` | mạo danh hỗ trợ Quyết định 2345/QĐ-NHNN |

`chuyen_huong_cuoc_goi` là họ đáng chú ý nhất về kỹ thuật: nạn nhân tự bấm một
mã USSD, và từ đó **mọi cuộc gọi — kể cả cuộc gọi đọc mã xác thực — chuyển thẳng
sang máy kẻ gian**. Không có link, không có app, không có gì để quét.
