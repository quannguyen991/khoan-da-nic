# KHOAN ĐÃ — THƯ MỤC MANG VÀO PHÒNG THI

> Chép nguyên thư mục này vào máy ở phòng thi. Đây là **tài liệu**, không phải mã
> nguồn — repo bắt đầu từ số 0.

## Trong này có gì

| Tệp | Cho ai | Dùng thế nào |
|---|---|---|
| **`BACKEND.md`** | **Claude Code** | Bộ luật · pipeline · API · đánh giá. **Đưa đường dẫn, đừng dán cả file** |
| **`FRONTEND.md`** | **Gemini** | Màn hình · chữ hiển thị · tiếp cận · trang người thân |
| `THAM-KHAO-DAY-DU.md` | tra khi cần | Bản đầy đủ trước khi tách. Chỉ mở khi hai file kia không trả lời được |
| `eval/dataset/*.jsonl` | bộ đánh giá | 445 mẫu, 8 tệp. Chép thẳng vào repo mới |
| `eval/dataset/GHI-CHU-mau-kho.md` | người kiểm nhãn | Giải thích **vì sao** từng mẫu khó tồn tại |
| `eval/dataset/nguon-mo-60-mau-goc.docx` | đối chiếu | Bản gốc có link nguồn của 60 mẫu nguồn mở |

**Hai nửa nối nhau bằng `§HĐ`** — có ở đầu **cả hai** file, giống hệt nhau. Đó là
hình dạng dữ liệu `POST /api/analyze` trả về. Bên nào cũng code theo đúng nó;
frontend dùng hàm giả cho tới khi backend xong. **Đổi §HĐ phải báo cả hai bên.**

### ⚠️ Xây code NGAY TRONG thư mục này — được, và tiện hơn

`eval/dataset/` đã đúng đường dẫn mà `BACKEND.md` mong đợi, nên khỏi phải copy
lại. Nhưng **đúng một việc bắt buộc trước khi `git init`**:

> **`BACKEND.md` và `THAM-KHAO-DAY-DU.md` in nguyên văn khoá API thật.**
> Nếu build ngay ở đây, `git add .` ở bước khởi tạo sẽ cuốn cả hai vào lịch sử
> git. Cả hai file đã có dòng gitignore riêng — Claude sẽ tạo đúng khi làm theo
> §2B.1. Chỉ cần **kiểm bằng `git status` trước khi commit đầu tiên**: `BACKEND.md`,
> `FRONTEND.md`, `THAM-KHAO-DAY-DU.md` không được xuất hiện trong danh sách theo dõi.

---

## Bộ dữ liệu — 445 mẫu

| Tệp | Mẫu | Nội dung |
|---|---:|---|
| `01-vi-scam-b` | 60 | giao hàng · OTP/PIN · tình cảm · lấy lại tiền · trúng thưởng |
| `02-vi-scam-a` | 60 | **công an · ngân hàng · người thân · tuyển CTV · đầu tư** |
| `03-en-scam` | 45 | tiếng Anh |
| `05-mixed` | 50 | trộn Việt–Anh |
| `06-negatives` | 110 | **tin lành trông đáng ngờ** — 74 mẫu báo động là sai hẳn |
| `07-warning` | 35 | cảnh báo · giáo dục · kể chuyện cũ |
| `08-injection` | 25 | cố ý đánh lừa AI |
| `09-nguon-mo` | 60 | chuyển biên từ 58 bài báo/công an còn truy được |

Chín trường cố định:
`id · ho · kenh · ngon_ngu · noi_dung · muc_do · toi_da · nguon · ghi_chu`

- `muc_do` — nhãn đúng · `toi_da` — mức cao nhất còn tha thứ được
- `nguon` — `tai_dung` (máy sinh) · `nguon_mo` (chuyển biên, có link) · `that` (nguyên văn)

### ⚠️ Hai việc chưa xong

1. **Chưa có tệp `10-that.jsonl`.** Lục tin nhắn rác máy mình và máy bố mẹ, che số
   điện thoại/tài khoản/tên, đặt `nguon:"that"`. 25–40 mẫu, nửa tiếng. Đây là thứ
   duy nhất không AI nào tạo hộ được.
2. **Nhãn của `09-nguon-mo` do máy suy**, mỗi dòng có dấu `NHAN TU DONG-CAN NGUOI
   DUYET`. Đọc lại 60 dòng, ~15 phút. Bỏ bước này là vi phạm chính kỷ luật của dự
   án: *kiểm nhãn trước khi sửa máy dò*.

### Khi in kết quả

In **ba con số riêng** theo `nguon`. Với `that` thì in **số đếm**, không in phần
trăm — *"bắt đúng 27/28 tin nhắn thật"* nặng hơn *"95%"*.

Và luôn kèm chữ **"đo trên bộ mẫu tự soạn"** cho phần `tai_dung`.
Với `nguon_mo` nói đúng là *"60 tình huống có thật, dẫn được 58 nguồn"* —
**không** nói *"60 tin nhắn thật thu từ nạn nhân"*.

---

# NĂM TIN NHẮN ĐẦU TIÊN CHO CLAUDE

Làm đúng thứ tự. Có cổng nghiệm thu ở tin nhắn 4 — **đừng bỏ qua**.

### 1 — việc đầu tiên KHÔNG phải viết code

```
Đọc D:\KHOAN-DA-24H\BACKEND.md từ đầu đến hết §4.

Việc đầu tiên, trước mọi dòng code: tạo CLAUDE.md ở gốc repo, chép NGUYÊN VĂN
§4 (ràng buộc bất biến), §11 (câu không được viết), §12 (quyết định không được
tự thay) và khối §HĐ. Không tóm tắt, không diễn đạt lại.

Lý do: prompt này sẽ trôi khỏi ngữ cảnh sau vài giờ, còn CLAUDE.md được nạp
lại mỗi lượt.

Xong thì báo, chưa làm gì thêm.
```

### 2 — khởi tạo

```
Đọc §2, §2B.1, §2B.2 trong BACKEND.md.

Khởi tạo repo NGAY TRONG thư mục hiện tại theo đúng §2B.1. Chỉ cài dependency
cần cho tầng 0. Chưa dựng server, chưa dựng giao diện.

Trước khi git init: tạo .gitignore đúng như §2B.1, PHẢI có ba dòng
BACKEND.md / FRONTEND.md / THAM-KHAO-DAY-DU.md — hai file đầu chứa khoá API
thật. Sau khi git init, chạy git status và cho tôi xem — ba file đó không
được nằm trong danh sách theo dõi.

Lưu ý §2: repo TRỐNG VỀ CODE. Mọi câu "đã có trong mã nguồn" và mọi tham chiếu
file:dòng trong tài liệu đều KHÔNG áp dụng. Các tệp .md và eval/dataset/ đã có
sẵn trong thư mục là TÀI LIỆU MANG THEO, không phải code cũ cần giữ tương thích.
```

### 3 — tầng 0, đây là cả sản phẩm

```
Đọc §6, Phụ lục A, B, C trong BACKEND.md.

Dựng tầng 0 theo đúng thứ tự §2B.2 bước 2–8. Trọng số lấy từ Phụ lục A,
cap nhóm và cộng hưởng từ Phụ lục B, speech act và phủ định từ Phụ lục C.

Theo §3.0: viết test ĐỎ TRƯỚC cho tầng 0, và nói ra số ca đỏ.
Bốn ca ở §C.3 là bắt buộc.

Chưa dựng server, chưa dựng giao diện.
```

### 4 — CỔNG NGHIỆM THU, không được bỏ qua

```
Chép eval/dataset/ vào repo. Chạy pipeline bằng node trên 6 mẫu sau:

  vi-congan-01     → phải ra CAO
  neg-app-01       → phải ra CHUA_THAY   ("mẹ tải app ngân hàng trên CH Play")
  neg-ep-01        → KHÔNG được ra CAO   ("chuyển tiền... đừng nói với bà nội")
  warn-01          → phải ra CHUA_THAY   (cảnh báo của công an)
  inj-01           → phải ra CAO         (tiêm nhiễm)
  vi-nguoithan-06  → phải ra CAO

In nhãn, điểm và mã lý do của từng mẫu. Nếu có mẫu sai thì DỪNG và báo,
đừng sửa trước khi tôi xem.
```

Sáu mẫu này chọn có chủ đích. Đáng chú ý nhất là cặp **`neg-ep-01` và
`vi-nguoithan-06`** — hai câu **cấu trúc gần giống hệt nhau, nhãn ngược nhau**.
Chúng đo xem bộ luật phân biệt bằng **ngữ cảnh** hay chỉ khớp từ khoá.

### 5 — server + API

```
Đọc §2B.2 bước 9–11 và §HĐ.

Dựng server + POST /api/analyze trả ĐÚNG hình dạng ở §HĐ.
Thêm alias POST /api/phan-tich dùng chung handler.

Tầng AI là TUỲ CHỌN: rút mạng thì app vẫn phải chạy bằng tầng luật.
Cấu hình nhà cung cấp ở §7.0.
```

Sau đó mới `npm run eval` trên 445 mẫu.

---

# BA ĐIỀU ĐỪNG LÀM

**Đừng dán cả `BACKEND.md` vào một tin nhắn.** ~27k token ở lượt đầu làm loãng chỉ
dẫn. Đưa đường dẫn, bảo đọc từng mục theo từng bước.

**Đừng gộp "dựng luôn cả server và giao diện".** Tầng 0 phải chạy được bằng `node`
trước. Đó là phần ăn điểm hạng mục AI, và là phần duy nhất không cắt được.

**Đừng để Claude đụng vào giao diện.** Thấy nó bắt đầu viết HTML thì cắt ngay —
phần đó của Gemini, hai bên ghép bằng §HĐ.

---

# LỊCH 24 GIỜ, RÚT GỌN

```
 0,0–0,5   CLAUDE.md + khởi tạo + THỬ HOTSPOT HAI MÁY NGAY
 0,5–3     tầng 0: bộ luật · 10 override · sàn nhãn · test đỏ trước
 3–4       ⛳ cổng nghiệm thu 6 mẫu
 4–6       server + /api/analyze
 6–9       tầng AI (tuỳ chọn) + ghép giao diện của Gemini
 9–12      trang người thân + "Nói gì với bố mẹ" + im lặng=gửi
12–14      luồng đã chuyển tiền + trợ lý gọi ngân hàng
14–15,5    chạy 445 mẫu, in bảng theo từng họ VÀ theo `nguon`
15,5–16    QUAY BẢN GHI MÀN HÌNH DỰ PHÒNG (lúc còn tỉnh)
16–18      chỉ sửa lỗi, không thêm gì
18         🧊 ĐÓNG BĂNG — tạo nhánh `demo-freeze`
18–21      ca ngủ luân phiên. NGƯỜI THUYẾT TRÌNH NGỦ ĐỦ 3 TIẾNG
21–23      tập demo ≥4 lượt, trong đó 1 lượt RÚT MẠNG
23–24      đệm. Không mở editor
```

**Luật vận hành số 1: sau giờ 18 không thêm tính năng.** Viết ra giấy, dán lên
màn hình. Lúc giờ 19 có người nói *"thêm cái này 10 phút thôi"* — cái đó là thứ
giết đội thi.

**Mạng:** wifi hội trường thường chặn hai máy thấy nhau. Demo hai máy dùng
**hotspot của chính bạn**, và **thử ngay ở giờ thứ nhất, không phải giờ 22**.
Dự phòng: hai tab cùng một máy đồng bộ qua `localStorage`.
