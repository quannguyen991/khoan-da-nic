# Đưa Khoan Đã lên máy chủ HoaiDuc — từng bước

> Mục tiêu: app và mô hình AI chạy **cùng một máy**, nên không phải mở cổng của
> Ollama (vốn không có xác thực), không phải đụng tới SSH tunnel.
>
> Làm xong bước này thì màn kết quả tự hiện dòng 🔒 *"AI chạy trên máy chủ của
> Khoan Đã — nội dung không gửi cho công ty nào khác"*, và bạn có cảnh quay cho
> video: `nvidia-smi` chạy trên GPU của chính mình trong lúc app kiểm tin nhắn.

Ước lượng: **30–45 phút**, phần lớn là chờ tải.

---

## PHẦN A — Trên laptop này

### A1. Repo git hiện tại đã hỏng, phải khởi tạo lại

`git status` trả `unknown index entry format` — lịch sử cũ không đọc được nữa, và
không có cách sửa. Đổi tên nó đi (đừng xoá hẳn, phòng khi sau này cần):

```bash
cd "D:/trợ-lý-ảo-khoan-đã (3)"
mv .git .git-hong-18-8-2026
git init -b main
```

### A2. Kiểm tra không có gì nhạy cảm lọt vào

```bash
git add -A
git status --short | head -30
```

Nhìn danh sách và **xác nhận KHÔNG thấy**:

- `.env` — chứa khoá API
- `node_modules/`
- `assets/anh-goc/*.png` — 34 MB ảnh gốc, không cần để chạy

Ba thứ này đã nằm trong `.gitignore`. Nếu vẫn thấy chúng thì dừng lại, báo tôi.

### A3. Commit

```bash
git -c user.name="<tên bạn>" -c user.email="<email bạn>" commit -m "Khoan Đã — bản dự thi Intel AI Impact Festival 2026"
```

### A4. Tạo repo trên GitHub

Mở <https://github.com/new>:

| Ô | Điền |
|---|---|
| Repository name | `khoan-da` |
| Mô tả | Trợ lý cảnh giác lừa đảo cho người cao tuổi Việt Nam |
| Public / Private | **Public** ← quan trọng, rubric cho 2 điểm cho "open-sourced link" |
| Add README / .gitignore / license | **đừng tích cái nào** (đã có sẵn trong dự án) |

Bấm *Create repository*, rồi chạy (thay `<tên-github>`):

```bash
git remote add origin https://github.com/quannguyen991/khoan-da-nic.git
git push -u origin main
```

GitHub sẽ hỏi đăng nhập — dùng cửa sổ trình duyệt nó mở ra.

> ✅ Xong A4 là bạn đã có **1 trong 2 điểm** của dòng "deployment status" trong
> rubric, và một đường để giám khảo đọc mã nguồn.

---

## PHẦN B — Trên máy HoaiDuc

Vào máy đó (ngồi trực tiếp hoặc Remote Desktop). Mở **PowerShell**.

### B1. Kiểm tra Node.js

```powershell
node -v
```

- Ra `v20.x` hoặc mới hơn → sang B2.
- Báo lỗi "không nhận diện được lệnh" → cài Node LTS:

```powershell
winget install OpenJS.NodeJS.LTS
```

Cài xong **đóng PowerShell và mở lại**, rồi chạy `node -v` kiểm tra.

### B2. Kiểm tra Ollama và mô hình

```powershell
ollama list
```

Phải thấy `qwen2.5:7b`. Nếu không thấy:

```powershell
ollama pull qwen2.5:7b
```

### B3. Tải mã nguồn về

```powershell
cd $HOME
git clone https://github.com/quannguyen991/khoan-da-nic.git
cd khoan-da-nic
npm install
```

> ⚠️ Thư mục tạo ra tên là **`khoan-da-nic`** (theo tên repo), không phải
> `khoan-da`. Gõ `cd khoan-da` sẽ báo *"Cannot find path"*, và `npm install`
> chạy ở thư mục sai sẽ báo `ENOENT ... package.json` — nghe như thiếu tệp,
> thật ra chỉ là đứng nhầm chỗ.

`npm install` mất vài phút.

### B4. Tạo tệp cấu hình

```powershell
@"
LLM_CUC_BO=1
LLM_CUC_BO_BASE=http://127.0.0.1:11434/v1
LLM_CUC_BO_MODEL=qwen2.5:7b
LLM_TIMEOUT_MS=35000
PORT=3000
"@ | Out-File -Encoding utf8 .env
```

> ⚠️ `127.0.0.1` chứ không phải `100.119.71.89`. App và Ollama ở cùng máy nên gọi
> nội bộ — không cần mở cổng Ollama ra mạng, và như vậy an toàn hơn hẳn.

### B5. Chạy thử

```powershell
npm run dev
```

Đợi tới khi thấy `Server running on http://localhost:3000`. **Để nguyên cửa sổ
này**, đừng đóng.

Mở **một cửa sổ PowerShell thứ hai** và kiểm tra:

```powershell
curl.exe http://127.0.0.1:3000/api/suc-khoe
```

Kết quả phải có:

```json
"noiChay":"tren_may_chu_tu_van_hanh"
"model":"qwen2.5:7b"
```

Nếu ra `"noiChay":"khong_chay"` → Ollama chưa chạy. Mở Ollama lên rồi thử lại.

### B6. Cho máy khác gọi vào (để tôi đo và để quay video từ điện thoại)

PowerShell **quyền Administrator** (chuột phải → *Run as administrator*):

```powershell
New-NetFirewallRule -DisplayName "Khoan Da qua Tailscale" -Direction Inbound -Protocol TCP -LocalPort 3000 -RemoteAddress 100.64.0.0/10 -Action Allow
```

> `100.64.0.0/10` là dải riêng của Tailscale. Chỉ các máy trong tailnet của bạn
> gọi được — **không có gì hở ra Internet**.

---

## PHẦN C — Kiểm tra từ máy khác

Trên laptop (hoặc điện thoại đã cài Tailscale), mở:

```
http://100.119.71.89:3000
```

Thấy giao diện Khoan Đã là xong.

Thử dán một tin nhắn lừa đảo mẫu:

> Công an đây, tài khoản của bác liên quan đường dây rửa tiền. Bác chuyển 50 triệu
> vào tài khoản an toàn của cơ quan điều tra và đọc mã OTP vừa gửi về máy.

Màn kết quả phải hiện:

- Nhãn **Nguy hiểm cao**
- Các lý do: nhắc "tài khoản an toàn", đòi mã OTP, yêu cầu chuyển tiền…
- Khối **"Những thứ cháu CHƯA kiểm được"**
- Dòng 🔒 **"AI chạy trên máy chủ của Khoan Đã"**

Chụp lại màn hình này — đây là ảnh dùng cho bài thi.

---

## PHẦN D — Ba con số cần đo

Sau khi chạy được, đo và ghi lại. Đây là số đưa thẳng vào bài dự thi.

### D1. Thời gian một lượt kiểm

Trên laptop, chạy 3 lần rồi lấy số giữa:

```bash
curl -s -o /dev/null -w "%{time_total}s\n" -X POST http://100.119.71.89:3000/api/analyze \
  -H "content-type: application/json" \
  -d '{"vanBan":"Công an đây, bác chuyển 50 triệu vào tài khoản an toàn và đọc mã OTP"}'
```

### D2. VRAM mô hình chiếm

Trên HoaiDuc, **trong lúc** đang có lượt kiểm chạy:

```powershell
nvidia-smi
```

Ghi lại cột `Memory-Usage` — ví dụ `5.1GiB / 12.0GiB`. Con số này là bằng chứng
cho câu *"chọn mô hình 7B vì nó vừa trong 12 GB VRAM của GPU đích"*.

### D3. Bắt đúng bao nhiêu

Thử **10 tin nhắn**: 5 cái lừa đảo thật (tìm trên báo hoặc trong tin nhắn rác của
gia đình), 5 cái bình thường (tin ngân hàng thật, tin người thân). Đếm:

| | Máy chủ HoaiDuc (7B cục bộ) | Không có AI (chỉ tầng luật) |
|---|---|---|
| Bắt đúng bao nhiêu/5 tin lừa đảo | | |
| Báo oan bao nhiêu/5 tin lành | | |

Để đo cột phải, tạm đổi `.env` thành `LLM_CUC_BO=0` rồi chạy lại — app sẽ chỉ
dùng tầng luật.

**Bảng hai cột này là thứ giám khảo đọc trong 5 giây**, và nó chứng minh dòng
*"AI component creates impact not achievable through traditional software alone"*
bằng số đo của chính bạn, chứ không phải bằng con số 3,8%→67,6% đo từ trước.

---

## Nếu vướng ở đâu

Chụp màn hình lỗi rồi báo — đừng đoán. Ba lỗi hay gặp:

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| `npm install` lỗi | Node quá cũ. `node -v` phải ≥ 20 |
| `/api/suc-khoe` ra `khong_chay` | Ollama chưa bật, hoặc tên model trong `.env` sai chính tả |
| Máy khác không mở được `:3000` | Chưa chạy B6, hoặc PowerShell lúc chạy B6 không phải quyền admin |
