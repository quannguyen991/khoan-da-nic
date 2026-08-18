# Chạy AI ngay trên máy — hướng dẫn từng bước

> Làm xong bước này, **nội dung tin nhắn không còn được gửi cho một công ty thứ
> ba nào nữa** — nó chỉ đi tới hạ tầng do chính nhóm vận hành.

## Vì sao

| | Gateway (đang dùng) | Tự vận hành (sau khi làm) |
|---|---|---|
| Nội dung tin nhắn | gửi sang một công ty thứ ba | chỉ tới máy chủ của nhóm |
| Ai đọc được | nhà cung cấp mô hình | không ai ngoài nhóm |
| Mất mạng ra Internet | không kiểm được | vẫn chạy trong mạng nội bộ |
| Năng lượng | đánh thức một trung tâm dữ liệu mỗi lượt | chạy trên GPU sẵn có |
| Chi phí mỗi lượt | tính tiền theo token | 0 đồng |

> ⚠️ **CÂU CHỮ PHẢI ĐÚNG VỚI CÁI ĐANG XẢY RA.**
> "Không rời khỏi máy" chỉ đúng khi người dùng chạy **cả app lẫn mô hình** trên
> máy của họ. Khi mô hình chạy trên máy chủ và người dùng vào từ điện thoại, nội
> dung **có** rời khỏi máy họ — chỉ là không sang công ty khác. App phân biệt hai
> trường hợp này và mặc định dùng câu yếu hơn; có test chặn ở
> `test/hop-dong.test.mjs`.

## Hai máy thật, hai cấu hình

### Máy chủ HoaiDuc — nơi chạy chính

| | |
|---|---|
| CPU | Intel i5-13400F · 10 nhân/16 luồng (Raptor Lake) — **không có iGPU**, nên không dùng OpenVINO trên iGPU được |
| GPU | **NVIDIA RTX 3060 · 12 GB VRAM** |
| RAM | 32 GB @ 5200 MT/s, 2 kênh |
| Mạng | Tailscale — `100.119.71.89` |
| Đã có sẵn | **Ollama + `qwen2.5:7b` (4,7 GB)** và `bge-m3` (embedding, 1,2 GB) |

12 GB VRAM cho phép chạy **mô hình 7B** — đọc tiếng Việt tốt hơn hẳn 3B, và đó
đúng là chỗ bài toán này cần nhất.

### Laptop — máy yếu hơn, vẫn phải chạy được

RTX 3050 Ti **4 GB**. Không gánh nổi 7B; dùng `qwen2.5:3b-instruct-q4_K_M` (~2 GB).

### Vì sao giữ cả hai

Đây chính là câu trả lời cho dòng *"select components; very specific to solution"*
trong rubric — và nó là sự thật kiểm được, không phải cách nói:

> Cùng một giải pháp, **tự chọn mô hình theo phần cứng sẵn có**: máy 12 GB chạy
> 7B, máy 4 GB chạy 3B, máy không có GPU rơi về tầng luật và **nói rõ là lượt này
> không có AI đọc**. Không máy nào bị loại ra khỏi giải pháp.

## Chọn mô hình theo VRAM, không chọn theo tên

| Mô hình | Cỡ tệp | 12 GB | 4 GB | Tiếng Việt |
|---|---|---|---|---|
| `qwen2.5:7b` | ~4,7 GB | ✅ **dùng cái này** | ❌ tràn, rơi xuống CPU rất chậm | tốt |
| `qwen2.5:3b-instruct-q4_K_M` | ~2,0 GB | ✅ | ✅ **dùng cái này** | khá |
| `gemma2:2b-instruct-q4_K_M` | ~1,6 GB | ✅ | ✅ | tạm |

## Mở cổng Ollama trên HoaiDuc

Ollama trên HoaiDuc mặc định chỉ nghe `127.0.0.1`, nên máy khác không gọi tới
được. Chạy **trên chính máy HoaiDuc**:

```powershell
[Environment]::SetEnvironmentVariable('OLLAMA_HOST', '100.119.71.89:11434', 'User')
```

Rồi thoát Ollama ở khay hệ thống và mở lại — biến môi trường chỉ được đọc lúc
khởi động.

> ⚠️ **ĐỪNG đặt `0.0.0.0`.** Ollama **không có xác thực**: ai gọi tới cũng chạy
> được mô hình trên GPU của bạn. Đặt đúng địa chỉ Tailscale nghĩa là chỉ các máy
> trong tailnet gọi được, và không có gì lọt ra Internet.

Kiểm tra trên HoaiDuc:

```powershell
curl.exe http://100.119.71.89:11434/api/tags
```

## Trỏ Khoan Đã sang HoaiDuc

Tạo `.env` ở thư mục gốc dự án:

```
LLM_CUC_BO=1
LLM_CUC_BO_BASE=http://100.119.71.89:11434/v1
LLM_CUC_BO_MODEL=qwen2.5:7b
LLM_TIMEOUT_MS=35000
```

Chạy lại máy chủ rồi kiểm tra:

```bash
curl http://localhost:3000/api/suc-khoe
```

Phải thấy `"noiChay":"tren_may_chu_tu_van_hanh"`.

> ⚠️ **Vì sao KHÔNG phải `tren_may_nguoi_dung`.** Mô hình chạy trên máy chủ của
> nhóm, còn người dùng vào từ điện thoại qua mạng — nội dung **vẫn rời khỏi máy
> họ**, chỉ là không sang một công ty thứ ba. Hai chuyện khác nhau, và app nói
> đúng chuyện đang xảy ra. Chỉ đặt `LLM_CHAY_TREN_MAY_NGUOI_DUNG=1` khi người
> dùng thật sự chạy cả app lẫn mô hình trên máy của chính họ.

## Đo để có số đưa vào bài thi

Đừng viết "chạy nhanh" — viết số. Đo ba thứ, mỗi thứ 3 lượt rồi lấy trung vị:

1. **Thời gian một lượt kiểm.** Mở tab Network trong trình duyệt, xem `/api/analyze`.
2. **VRAM dùng.** `nvidia-smi` trong lúc đang chạy — cột `Memory-Usage`.
3. **Có bắt đúng không.** Thử 5 tin nhắn lừa đảo và 5 tin nhắn lành, đếm số lần đúng.

Ghi lại cả **con số của đường gateway** để so sánh. Bảng hai cột là thứ giám khảo
đọc được trong 5 giây.

## Khi nào KHÔNG dùng đường cục bộ

Mô hình 3B yếu hơn hẳn mô hình lớn trên gateway. Nếu đo thấy nó bỏ sót nhiều:

- Giữ **cả hai đường**: cục bộ là mặc định, gateway là dự phòng khi máy yếu.
- Đó cũng là câu trả lời hay hơn cho rubric: giải pháp **tự chọn thiết bị theo
  máy người dùng**, chứ không ép mọi người phải có GPU.

Và dù chọn đường nào — **tầng luật vẫn chạy trước, dưới 50ms, không cần AI**.
Đó là lý do app không bao giờ im lặng kể cả khi không có mô hình nào.
