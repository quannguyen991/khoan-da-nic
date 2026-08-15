# CHECKLIST NGHIỆM THU FRONTEND

> Rút từ `FRONTEND.md` (§2B.3, §FE0, §4.4, §11, §14.7, §14.8) cộng các mục bàn
> giao mới từ backend. Dùng để soi phần Gemini đã dựng.
>
> Nguyên tắc §10.3 của chính `FRONTEND.md`: **chỉ báo "xong" khi có SỐ ĐO.**
> Đánh dấu ✅ mà chưa mở trình duyệt đo thì đó là ✅ giả.

---

## 0 · TÌNH TRẠNG TRONG REPO BACKEND — đo lúc 20:45, 15/8

| Tệp | Trạng thái |
|---|---|
| `public/tokens.css` | ✅ có, 15.227 byte |
| `public/vung-cham-san.css` | ✅ có, 8.557 byte |
| `public/config/ma-hop-dong.json` | ✅ có, 182 mã |
| `public/config/support-directory.json` | ✅ có |
| `public/index.html` | ❌ **CHƯA CÓ** |
| `public/app.js` | ❌ **CHƯA CÓ** |
| `public/services.js` | ❌ **CHƯA CÓ** |
| `public/sw.js` | ❌ **CHƯA CÓ** |

⚠️ **`npm run check` đang hỏng** — script trỏ tới ba tệp JS chưa tồn tại.

⚠️ **Việc ghép hai nửa chưa xảy ra.** Đây là rủi ro lịch lớn nhất hiện tại. Ghép
sớm và ghép xấu vẫn hơn ghép muộn và ghép đẹp — vì lỗi ghép luôn nhiều hơn dự
kiến, và chúng chỉ lộ ra khi hai nửa gặp nhau thật.

---

## 1 · HAI MƯƠI HAI MÀN HÌNH

⚠️ Tiêu đề §2B.3 ghi *"Hai mươi màn hình"* nhưng **bảng có 22 dòng**. Khi soi
"đủ chưa" thì mẫu số là **22**, không phải 20.

### Tầng 1 — 11 màn, cắt cái nào cũng vỡ demo

| ☐ | Hash | Điểm phải kiểm riêng |
|---|---|---|
| ☐ | `#khan-cap` | Là `start_url`. 4 nút lớn · nút thứ 4 **khác màu + tách khoảng trắng** · có dòng "Tôi chỉ muốn xem hướng dẫn" |
| ☐ | `#kiem-tra` | **Một ô nhập duy nhất**, tự nhận diện loại. Không bắt chọn danh mục |
| ☐ | `#canh-bao` | Phiếu tin cậy. `chuaKiem` **cùng cỡ chữ với `nhan`** |
| ☐ | `#duoc-bao-ve` | Bỏ nav · 3 điều KHÔNG làm là **chữ tĩnh, không checkbox** · nút GỌI [TÊN THẬT + QUAN HỆ] · **tự đọc to khi vào** · lối thoát "Tôi ổn" |
| ☐ | `#chuyen-khoan` | Đối chiếu quy tắc gia đình |
| ☐ | `#vua-chuyen-tien` | Vào `RECOVERY`. **Không đếm ngược, không trách móc** |
| ☐ | `#goi-ngan-hang` | Chữ cực lớn · câu đọc trước · số liệu sẵn trên màn |
| ☐ | `#thoat-cuoc-goi` | Câu từ chối + cách cúp máy |
| ☐ | `#bao-ve-thiet-bi` | Khai đã cài app lạ ⇒ màn này hiện **ĐẦU TIÊN**, trước mọi màn khác |
| ☐ | `#trang-chu` | |
| ☐ | `#nguoi-than` | Mặc định khi ≥900px. **KHÔNG hiển thị nội dung thô của bố mẹ** |

### Tầng 2 — 11 màn

| ☐ | Hash | Điểm phải kiểm riêng |
|---|---|---|
| ☐ | `#onboarding` | Chọn xưng hô · **câu bất biến 7.2 nêu TRƯỚC cả tính năng** |
| ☐ | `#xac-minh` | Ưu tiên kênh chính thức |
| ☐ | `#kiem-tra-lien-ket` | Deterministic trước, AI sau. **Không tự mở link** |
| ☐ | `#hanh-trinh` | 8 giai đoạn + **dự đoán bước tiếp** ← xem mục 6 |
| ☐ | `#bang-chung` | |
| ☐ | `#bao-cao` | **Chỉ nhận tactic, không nhận danh tính cá nhân** |
| ☐ | `#gia-dinh` | 4 vai trò · thu hồi · audit |
| ☐ | `#ho-tro` | Mỗi mục có **nguồn + ngày + nút báo số sai** |
| ☐ | `#huong-dan` | Nơi **được** dùng linh vật |
| ☐ | `#quyen-rieng-tu` | Xuất / xoá dữ liệu |
| ☐ | `#lich-su` | |

☐ Tất cả là `<section class="view">` trong **MỘT** `public/index.html`, điều hướng
bằng hash. Không SPA framework, không router thư viện.

---

## 2 · BỐN LUẬT §HĐ — dễ vỡ nhất khi ghép

| ☐ | Luật | Cách kiểm |
|---|---|---|
| ☐ | `nhan` là **ENUM**, không so sánh bằng chuỗi tiếng Việt | grep mục 5 |
| ☐ | `maLyDo` là **MÃ**, frontend tra `ma-hop-dong.json` (182 mã) ra câu | Đổi sang tiếng Anh, kết luận **không được đổi** |
| ☐ | `chuaKiem` không rỗng ⇒ **hiển thị CÙNG CỠ CHỮ với `nhan`** | Đo `font-size` bằng DevTools, không đọc CSS |
| ☐ | `canThiep` quyết định **màn**, `nhan` quyết định **nhãn** — không suy cái này từ cái kia | Đọc code điều hướng |
| ☐ | `aiDaChay: false` ⇒ **PHẢI** hiện dòng "lượt này không có AI đọc" | Rút mạng, thử |

---

## 3 · SÀN TIẾP CẬN §4.4 — và bốn cái bẫy §FE0

Bốn lỗi ở §FE0 **đều đã xảy ra thật, đều CI xanh lúc xảy ra.** Test tĩnh không
thấy được — phải mở trình duyệt.

| ☐ | Sàn | Bẫy đã cắn |
|---|---|---|
| ☐ | Vùng chạm **52px** | ⚠️ `min-height` **vô tác dụng trên hộp `inline`**. Thẻ `<a>` rơi về `display: inline` ⇒ khai 70px mà thật ra 49px. Phải kèm `display: grid`/`flex` + `min-block-size` |
| ☐ | Nút chính **56px** | Phải là `max(56px, 3.5rem)`, **không phải `3.5rem` trần** — ở bậc chữ 15px thì rem chỉ ra 52,5px |
| ☐ | Cỡ chữ **14px** ở gốc 17px | |
| ☐ | Tương phản chữ **4.5:1** | |
| ☐ | Tương phản viền **3:1** | |
| ☐ | **Cấm `nowrap` trên mọi phần tử bấm được** | Đã cắn: 19 phần tử cụt trên một màn ở khổ 320px. Chính **tên sản phẩm** cụt trên 6/7 màn |
| ☐ | **Nhãn nút là chữ THẬT trong HTML** | Đã cắn **BA LẦN**. Lần ba: 5 màn chào là bitmap, 139/139 test xanh, mà **nút chỉnh cỡ chữ mất tác dụng đúng ở dòng chữ to nhất** |
| ☐ | **MỘT file CSS ứng dụng** + `vung-cham-san.css` nạp sau cùng | Đã cắn: 6 quy tắc ở 5 file tranh nhau một thuộc tính. Đó là cách 21 file CSS ra đời |
| ☐ | `line-height` ≥ 1.25, dùng token `--leading-*` | Dấu tiếng Việt xếp **cả trên lẫn dưới** (ế, ộ, ữ, ị, ặ) |
| ☐ | `vung-cham-san.css` nằm trong `APP_SHELL` của service worker | Sàn tiếp cận không được phụ thuộc vào mạng |

### Ma trận đo bắt buộc — §FE0 luật chung

**3 bậc cỡ chữ × khổ 320/375/768/1280 × cả hai ngôn ngữ = 24 tổ hợp.**

☐ Đã đo trên trình duyệt thật, không chỉ chạy test tĩnh.

---

## 4 · LỐI RA §4.6 · §9.9

| ☐ | Kiểm |
|---|---|
| ☐ | `#duoc-bao-ve` bỏ hết điều hướng **NHƯNG** luôn có "Tôi ổn, không có gì nguy hiểm" ở cuối |
| ☐ | Mỗi lần bấm nút đó được **ghi lại làm mẫu báo động giả** |
| ☐ | Màn chờ chữ ký Khoan Proof (nếu dựng) cũng có lối ra |

---

## 5 · CÂU CẤM §11 — chạy được bằng grep

Chạy trong thư mục frontend:

```bash
grep -rniE "an toàn|\bsafe\b|lấy lại được tiền|hoàn thiện 100|đã gửi cho người thân|đã đọc và hiểu|WCAG compliant" --include=*.{html,js,json,css} .
```

| ☐ | Cấm | Thay bằng |
|---|---|---|
| ☐ | **"An toàn" / "Safe"** cho mức thấp | "Chưa thấy dấu hiệu rủi ro" / "No clear risk signals found" |
| ☐ | Hứa **lấy lại được tiền** | "các bước làm tăng khả năng xử lý" |
| ☐ | **"đã gửi cho người thân"** khi mới mở bảng chia sẻ hệ điều hành | |
| ☐ | **"đã đọc và hiểu"** cho notification | |
| ☐ | Khẳng định một dấu hiệu **VẮNG MẶT** | Đã từng phủ nhận đúng dấu hiệu đang nằm trong tin nhắn |
| ☐ | **Quy kết cá nhân** | "Yêu cầu này có dấu hiệu thường gặp trong các vụ lừa đảo" |
| ☐ | **Trách móc người dùng** | Không "sao bác lại tin?" |
| ☐ | **"WCAG compliant"** | "mục tiêu WCAG 2.2 AA" |

☐ **Không có nhãn thứ tư.** Ba nhãn, đúng ba. "Nghiêm trọng" là tên **trạng thái
can thiệp** `PROTECTED_CRITICAL`, không phải nhãn rủi ro.

☐ Ba chuỗi nhãn đến từ `src/risk-labels.js`, **i18n không ghi đè được**.

☐ **Mọi** chuỗi người dùng đọc đến từ catalog — kể cả **ARIA label**,
notification, manifest shortcut, và chuỗi **đọc to**.

☐ Tên thương hiệu **"Khoan Đã" giữ nguyên tiếng Việt ở mọi locale**.

---

## 6 · MỘT LỖ HỞ GIỮA HAI NỬA — mới phát hiện

`FRONTEND.md` §2B.3 ghi màn `#hanh-trinh` là:

> *"8 giai đoạn, **dự đoán bước tiếp**"*

Nhưng backend **chưa hề có** hàm dự đoán bước tiếp. `src/journey-engine.js` chỉ
có `suyGiaiDoan()` — suy giai đoạn **hiện tại**. Không có endpoint nào trả về
bước kế tiếp.

**Nghĩa là frontend đang được đặc tả cho một API mà backend chưa dựng.** Nếu
Gemini đã dựng màn đó thì nó đang chạy bằng dữ liệu giả và sẽ trống rỗng lúc ghép.

☐ Kiểm xem `#hanh-trinh` phía Gemini đang lấy "bước tiếp" từ đâu.

→ Prompt 5 trong `PROMPT-BAN-GIAO.md` vá đúng chỗ này. Nó **không phải tính năng
mới** — nó là phần backend còn thiếu của một màn đã được đặc tả.

---

## 7 · TÁM TEST BẮT BUỘC CỦA TRANG NGƯỜI THÂN §14.8

Viết ĐỎ trước.

| ☐ | Test |
|---|---|
| ☐ | `#nguoi-than` **không hiển thị `noi_dung` thô** — quét cả DOM lẫn payload cảnh báo |
| ☐ | Cảnh báo chỉ mang **≤3 nhãn dấu hiệu** và số tiền **dạng khoảng** |
| ☐ | Vai người con **không bật được** cờ chia sẻ; chỉ máy chủ tài khoản đặt được |
| ☐ | Thu hồi quyền chạy được **không cần** bất kỳ trường xác nhận nào của người con |
| ☐ | Không nơi nào hiển thị `đã đọc và hiểu` hay tương đương |
| ☐ | Bề rộng chỉ đặt **mặc định**; công tắc đổi vai luôn hiện, đi được **cả hai chiều** |
| ☐ | Bốn trường của 14.5 đến từ **bảng tĩnh**; không đường nào cho LLM sinh chúng |
| ☐ | Màn 14.6 luôn có **cả hai câu**, cùng cỡ chữ |

### Phạm vi 24 giờ §14.7

☐ P0: khối B (Nói gì với bố mẹ) · A (thanh trạng thái) · C (hộp cảnh báo) ·
14.6 (gọi ngược) · D (cài đặt hộ, **không QR**) · E (trung tâm quyền)

☐ P1, cắt được: sinh QR ghép cặp · Web Push

☐ P2, **không làm**: xem hoạt động dạng thô của bố mẹ

---

## 8 · BÀN GIAO MỚI TỪ BACKEND

Ba thứ cần thêm vào catalog frontend nếu các prompt trong
`PROMPT-BAN-GIAO.md` được chạy:

| ☐ | Mục | Từ |
|---|---|---|
| ☐ | Mã `chuaKiem`: `chua_lien_lac_duoc_nguoi_than` | Prompt 3 |
| ☐ | Endpoint `GET /api/kich-ban/:hoKichBan` + catalog cho các `maBuoc` (VI + EN) | Prompt 5 |
| ☐ | Chuỗi "Yêu cầu đã được ký bởi tài khoản của [tên]" vào catalog i18n | Prompt 3 |

⚠️ Chuỗi thứ ba **tuyệt đối không** được viết thành "Giao dịch an toàn", "Yêu cầu
này hợp lệ", hay "Đã xác minh là người thân". App chỉ được nói **ai đã ký**,
không được nói yêu cầu đó tốt hay xấu — vì tài khoản người con có thể bị chiếm
quyền, và dạng lạm dụng tài chính người cao tuổi phổ biến nhất là do người trong
nhà gây ra.

---

## 9 · BA VIỆC ĐO CUỐI, TRƯỚC KHI GỌI LÀ XONG

| ☐ | Việc |
|---|---|
| ☐ | **Rút mạng** — app vẫn phân tích được bằng tầng luật, và **nói thật là AI không phản hồi** |
| ☐ | **Chưa đăng nhập** — `/api/analyze` vẫn chạy. §5.3 · §6.9: không gate chức năng kiểm tra cơ bản |
| ☐ | `npm run check` **xanh** — hiện đang hỏng vì thiếu 3 tệp JS |
