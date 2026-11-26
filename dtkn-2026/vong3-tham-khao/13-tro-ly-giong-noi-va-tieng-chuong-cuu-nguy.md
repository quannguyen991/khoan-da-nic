# 13 – TRỢ LÝ ÂM THANH TRẤN AN & TIẾNG CHUÔNG CỨU NGUY (VOICE ASSISTANT & AMBIENT CALL-BREAKER)

> **Dự án:** Khoan Đã (ShieldGen) — Đấu trường Khởi nghiệp 2026 (ĐTKN 2026)  
> **Chủ quyền thiết kế:** `@webproto`  
> **Cập nhật:** 24/11/2026 (Phiên chiều)  
> **Tài liệu gốc:** `C:\Users\admin\.gemini\antigravity\brain\b89f8e7c-e859-48a8-ad49-020d512fa79f\voice_and_ambient_callbreaker.md`  
> **Mã nguồn tương tác:** `D:\KHOAN-DA-24H\public\web-companion.html`

---

## 1. TỔNG QUAN TÍNH NĂNG ĐỘT PHÁ
Trong các vụ lừa đảo thao túng tâm lý (giả danh công an, đe dọa nợ cước, deepfake giọng con cái gặp nạn), người cao tuổi thường rơi vào trạng thái "đóng băng nhận thức" (cognitive freeze). Họ không thể đọc chữ trên màn hình và sợ hãi không dám cúp máy vì sợ "vô lễ với cơ quan chức năng".

Khoan Đã giải quyết triệt để vấn đề này bằng bộ đôi:
1. **Trợ Lý Âm Thanh Trấn An (Voice Audio Guidance):** Tự động phát giọng đọc trầm ấm 3 miền Bắc - Trung - Nam, xưng hô lễ phép ("Bác Năm ơi, bác bình tĩnh nhé, cháu là trợ lý Khoan Đã đây..."), giải thích bằng 1 câu ngắn gọn và chỉ dẫn gọi con cháu.
2. **Tiếng Chuông Cứu Nguy (Ambient Call-Breaker & Face-Saving Excuses):** Tự động phát âm thanh môi trường cực lớn ra loa ngoài (Chuông cửa dồn dập, Báo động khói bếp gas, Cuộc gọi chờ khẩn cấp, Còi sập nguồn pin). Người già có một "cớ ngoại cảnh bất khả kháng" để cúp máy ngay lập tức mà vẫn giữ trọn thể diện!

---

## 2. KỊCH BẢN THOẠI 3 MIỀN BẮC – TRUNG – NAM

- **Miền Bắc (Hà Nội):** *"Bác Năm ơi, bác bình tĩnh nhé, cháu là trợ lý Khoan Đã đây ạ. Tin nhắn này có dấu hiệu giả danh cơ quan Công an để lừa tiền bác đấy. Công an thật không bao giờ làm việc qua điện thoại hay yêu cầu chuyển tiền vào tài khoản an toàn đâu bác. Bác đừng làm theo họ. Bây giờ bác hãy cúp máy, rồi bấm nút xanh trên màn hình để gọi ngay cho con gái Hương nhé!"*
- **Miền Nam (Sài Gòn):** *"Bác Năm ơi, bác cứ bình tĩnh nghen, con là trợ lý Khoan Đã nè. Tin nhắn này giả danh cơ quan công an để lừa tiền đó bác ơi. Công an thiệt hổng có ai làm việc qua điện thoại hay kêu mình chuyển tiền vô tài khoản tạm giữ đâu. Bác khoan nghe lời họ nghen. Giờ bác cứ cúp máy đi, rồi bấm nút gọi liền cho con gái Hương giúp con nghen bác!"*
- **Miền Trung (Huế - Đà Nẵng):** *"Bác Năm ơi, bác cứ bình tĩnh nhe, cháu là trợ lý Khoan Đã đây nì. Tin nhắn ni có dấu hiệu giả danh công an lừa tiền đó bác. Công an thiệt không ai đòi chuyển tiền qua máy mô bác nợ. Bác chớ có chuyển tiền nghe. Chừ bác cúp máy đi, bấm nút gọi liền cho con gái Hương giúp cháu nghe bác!"*

---

## 3. BẢNG ÂM CỚ CÚP MÁY LỊCH SỰ (AMBIENT CALL-BREAKER)

| Loại âm thanh | Tần số tổng hợp (Web Audio API) | Kịch bản bác nói với kẻ lừa đảo rồi cúp máy |
|---|---|---|
| 🔔 **Chuông cửa dồn dập** | Dual Sine 659Hz (E5) -> 554Hz (C#5) | *"Bác xin lỗi, nhà bác có khách bấm chuông liên hồi ngoài cổng, bác phải ra mở cổng ngay, lát gọi lại nhé!"* |
| 🔥 **Bếp gas / Báo cháy** | Square Wave 3200Hz Piezo Pulses | *"Ôi chết rồi, nồi cá trên bếp của bác đang cháy khét bốc khói, bác phải chạy vào tắt bếp ngay!"* |
| 🏥 **Cuộc gọi chờ bệnh viện** | Telephony Call-Waiting 425Hz | *"Có cuộc gọi khẩn cấp từ bệnh viện / con gái đang gọi máy hai, bác phải nhấc máy này ngay!"* |
| 🪫 **Pin máy sắp sập nguồn** | Descending Sine 480Hz -> 160Hz | *"Máy bác hết pin chuẩn bị sập nguồn rồi, tít tít rồi đây này, lát sạc xong bác gọi lại..."* |

---

## 4. HƯỚNG DẪN DEMO 30 GIÂY TẠI SÂN KHẤU BUV
1. Bấm Preset *"🚨 Giả danh Công an"* -> Bấm *"Kiểm Tra Ngay"*.
2. Màn hình Dừng 60 Giây màu đỏ bùng nổ. Nhấn nút **"🔊 Nghe Trợ Lý Trấn An"** -> Giọng nói ấm áp cất lên ngắt cơn hoảng loạn.
3. Nhấn nút **"🔔 Tiếng Chuông Cửa Dồn Dập"** -> Âm thanh Ding-Dong vang vọng cả hội trường.
4. Founder chỉ vào màn hình: *"Đó là chiếc cớ lịch sự giúp cha mẹ chúng ta cúp máy an toàn mà không phải đôi co với kẻ lừa đảo!"*
