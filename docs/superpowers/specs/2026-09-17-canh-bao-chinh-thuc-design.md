# Cảnh báo chính thức trong Ra-đa — thiết kế

Ngày 17/9/2026 · trạng thái: đã làm xong mã, **6/6 cảnh báo đã duyệt** (người duyệt `quannguyen991`, 17/9/2026)

## Vấn đề

Công an các cấp và cơ quan nhà nước đăng cảnh báo về từng thủ đoạn lừa đảo lên
trang của họ. Cảnh báo đó tốn công viết, nhưng không tới được người cần đọc vào
đúng lúc họ gặp đúng thủ đoạn ấy.

Khung Ra-đa ở backend (`intel-store.js`, `intel-radar.js`) đã có cổng duyệt và
đã chặn danh tính, nhưng:

1. Kho nằm trong bộ nhớ, khởi động là rỗng.
2. Kho dùng mã thủ đoạn làm khoá — hai tỉnh cùng cảnh báo một kiểu thì đè nhau.
3. Mục chỉ có mã và đường dẫn, không có gì để hiển thị.
4. Bộ chặn chuỗi số dài chặn cả đường dẫn có mã bài 10 chữ số của trang Bộ Công an.
5. Giao diện chưa gọi `/api/ra-da` ở đâu cả.

## Quyết định đã chốt với người dùng

- **Nguồn:** chỉ trang của công an và cơ quan nhà nước — tên miền `.gov.vn`. Không
  lấy báo chí đưa tin lại.
- **Duyệt:** mọi mục vào kho ở `cho_duyet`. Chỉ con người duyệt, và phải ghi tên.
  Máy không duyệt thay.

## Ràng buộc bất biến

1. Ra-đa **không đổi mức rủi ro** (§4.2). Test hiện có tiếp tục canh.
2. Không trường danh tính nào (§12). Test hiện có tiếp tục canh.
3. Mọi cảnh báo phải có nguồn truy ngược được (§11).
4. **Chỉ `sourceUrl` được miễn bộ chặn chuỗi số dài**, và chỉ khi nó là `https` trên
   tên miền `.gov.vn`. Mọi trường khác vẫn bị quét như cũ. Riêng trong `sourceUrl`
   vẫn chặn số di động (10 chữ số bắt đầu bằng 0).
5. `tomTat` và `tomTatEn` tối đa **160 ký tự**, viết bằng lời của mình — không chép
   nội dung bài.
6. Không hiện ở mức `CHUA_THAY`. Gọi lỗi thì không hiện gì.
7. Tên người duyệt **không bao giờ** ra tới người dùng.

## Dữ liệu

`backend/data/canh-bao-chinh-thuc.json`. Ngày 17/9/2026 đã đọc lại từng trang để
đối chiếu tóm tắt. Lần đọc lại bắt được một câu sai: bản nháp tóm tắt của Lâm Đồng
viết "việc thu hồi tài sản chỉ do công an thực hiện" — bài gốc không nói vậy. Đã sửa.

| id | Thủ đoạn | Mã họ | Đơn vị ra cảnh báo | Ngày |
|---|---|---|---|---|
| `soc-trang-gia-danh-cong-an-2025-02` | giả danh công an | `gia_danh_cong_an` | Công an tỉnh Sóc Trăng | 20/02/2025 |
| `bca-vneid-gia-mao-2025-07` | cài ứng dụng VNeID giả | `chiem_quyen_thiet_bi` | Bộ Công an | 05/07/2025 |
| `quang-tri-vneid-gia-mao-2025-07` | cài ứng dụng VNeID giả | `chiem_quyen_thiet_bi` | Công an tỉnh Quảng Trị | 07/07/2025 |
| `lam-dong-lay-lai-tien-2025-09` | hỗ trợ lấy lại tiền | `gia_danh_ho_tro_lay_lai_tien` | PC02, Công an tỉnh Lâm Đồng | 24/09/2025 |
| `hung-yen-lay-lai-tien-2025-09` | giúp lấy lại tiền | `gia_danh_ho_tro_lay_lai_tien` | Công an phường Trần Hưng Đạo | 05/09/2025 |
| `antv-mao-danh-nhnn-2024-08` | mạo danh NHNN gửi link | `gia_danh_ngan_hang` | Truyền hình CAND (ANTV) | 24/08/2024 |

**Mã họ phải là họ có thật trong `HO_KICH_BAN` của `pipeline.js`** — không thì không
bao giờ khớp họ. Bản nháp đầu đặt `cai_ung_dung_gia_mao`, một họ bộ luật không hề
phát ra. Có test chặn.

**Dấu hiệu liên quan chỉ ghi dấu hiệu ĐẶC TRƯNG của thủ đoạn**, không ghi dấu hiệu
chung như `CRED_OTP_SHARE`. Ghi dấu hiệu chung thì một tin giả danh ngân hàng đòi
OTP sẽ kéo theo cảnh báo "lấy lại tiền" — đúng nguồn, sai chuyện.

Việc duyệt được ghi ngay trong tệp: `"duyet": { "boi": "<tên>", "luc": "<ngày>" }`.
Lúc nạp, mục đi qua `kho.them()` rồi mới qua `kho.duyet(id, boi)` — tức là **vẫn đi
qua đúng cổng duyệt**, không có đường nào nạp thẳng trạng thái đã duyệt. Từ chối thì
mục rời danh sách phát hành và được ghi vào `daTuChoi` kèm người từ chối và lý do.

## Xếp hạng

Mỗi dấu hiệu trùng được **2 điểm**, trùng họ kịch bản được **1**, bằng điểm thì mới
nhất trước, lấy **tối đa 2**.

Đếm số dấu hiệu trùng, không chỉ hỏi có/không: tin "tôi bên công an kinh tế, hỗ trợ
lấy lại tiền, bác nộp phí hồ sơ" ra họ `gia_danh_cong_an` (dấu hiệu giả danh công an
đứng đầu bảng họ). Hỏi có/không thì cảnh báo công an chung chung thắng và cảnh báo
lấy lại tiền rơi khỏi hai chỗ hiển thị. Đo trên bộ luật thật ngày 17/9/2026.

## Thay đổi mã

| Tệp | Thay đổi |
|---|---|
| `intel-store.js` | khoá theo `id ?? maThuDoan`; `kiemSourceUrl()` đọc bằng `new URL` (`https`, không tên đăng nhập, `.gov.vn`, không số di động); miễn quét số dài cho riêng `sourceUrl` nguồn A; kiểm `id`, `tomTat`/`tomTatEn` ≤ 160, `ngayCongBo` dạng `YYYY-MM-DD`; thêm `napTuDuLieu()` |
| `intel-radar.js` | `traNguCanh` trả thêm `canhBao[]` chỉ gồm trường hiển thị; thêm `docMaRaDa(body)` |
| `server.js` | nạp tệp lúc khởi động bằng `require` (esbuild gói vào bản dựng; hỏng thì kho rỗng, không sập); `/api/ra-da` nhận **mã**, không nhận nội dung |
| `scripts/duyet-canh-bao.js` | `--liet-ke`, `<id> "<tên>"`, `--tu-choi <id> "<tên>" "<lý do>"`; không đứng tên duyệt được mục không hợp lệ |
| `src/components/CanhBaoChinhThuc.tsx` | khối trên màn cảnh báo, ngay dưới danh sách lý do; tự kiểm lại `https` + `.gov.vn`; bỏ mục thiếu tóm tắt đúng ngôn ngữ |
| `src/catalog.ts` | `CANH_BAO_CHINH_THUC`, cả hai ngôn ngữ |

## API

`POST /api/ra-da  { hoKichBan: string|null, maLyDo: string[] }`

Nhận **mã**, không nhận nội dung tin nhắn. Giao diện đã có mã từ kết quả phân tích,
nên tin nhắn không phải lên máy chủ lần thứ hai, và cảnh báo khớp đúng với kết quả
người dùng đang nhìn thấy. Chỉ gửi nội dung (không mã) → `400 THIEU_MA`.

## Cố ý không làm ở bản này

- Tự động quét trang web lấy cảnh báo mới.
- Tự hết hạn cảnh báo cũ. Thủ đoạn hay lặp lại; ngày công bố luôn được hiện.
