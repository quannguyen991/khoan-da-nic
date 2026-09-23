# CÂU CHUYỆN MỚI — CẦU DAO GIA ĐÌNH

> Viết 23/9/2026, sau khi làm xong Phần 1–5 của `docs/superpowers/specs/2026-09-23-cau-dao-gia-dinh-design.md`.
> **Chỉ kể những gì đã chạy.** Cột "Trạng thái" ở mục 3 là thứ người thuyết trình phải
> nhìn trước khi nói. Số nào chưa đo ở buổi thử (mục 5) thì **không đưa lên slide**.

---

## 1. Chuyển trọng tâm: từ "đọc tin nhắn" sang "không để bác một mình"

Người đang hoảng không đọc một đoạn văn. Bản cũ dừng bác 60 giây rồi đưa cả màn chữ —
khoảng dừng có, nhưng không có việc gì để làm trong khoảng dừng đó.

Bản mới làm ba việc, theo thứ tự:

1. **Một câu, một nút.** Màn đỏ còn một câu lệnh ngắn (≤ 12 chữ, máy đọc to một lần)
   và **một nút gọi con** nằm ở nửa trên màn hình. Nếu con đã ghi lời nhắn bằng giọng
   mình, máy phát giọng con thay cho giọng máy.
2. **Con biết ngay.** Nếu bác đã tự bật "báo cho con", máy con đổ thông báo, thấy bác
   vừa bấm gì, một nút "Gọi ngay". Con không gọi được trong 60 giây thì báo người kế tiếp.
3. **Chìa khoá thứ hai.** Khoản chuyển lớn cho người nhận mới cần con ký xác nhận
   bằng passkey trên máy con. Hai máy hiện cùng một cụm từ đối chiếu.

**Cơ chế là người nhà, không phải chặn kỹ thuật.** Khoan Đã không chặn cuộc gọi, không
chặn giao dịch, không nối với ngân hàng nào. Nó rút ngắn thời gian từ lúc bác nghi ngờ
tới lúc bác nghe giọng con.

---

## 2. Cầu dao ba bước

| Bước | Chuyện gì xảy ra | Ai bật |
|---|---|---|
| ① **Nhận ra** | Mức Cao từ bộ luật, **hoặc** (bản APK) đang gọi điện mà có tin nhắn chứa mã OTP, **hoặc** đang gọi điện mà có ứng dụng mới được cài | Luôn bật. Hai tổ hợp "đang gọi" chỉ có ở APK và cần quyền đọc thông báo |
| ② **Ngắt** | Màn một việc: câu lệnh ngắn + nút gọi con (gọi thẳng một chạm trên APK) + giọng con | Luôn bật |
| ③ **Nối** | Máy con nhận cảnh báo, thấy trạng thái theo thời gian thực; leo thang sau 60 giây | **Chỉ khi bác đã bật "báo cho con"** (§12 — không tự báo thay chủ tài khoản) |

Chìa khoá thứ hai đứng riêng: **bác tự bật**, tự chọn ngưỡng 5 / 10 / 20 / 50 triệu,
mặc định tắt.

---

## 3. Tính năng — trạng thái thật

| Tính năng | Trạng thái | Ghi chú phải nói |
|---|---|---|
| Màn khẩn cấp một việc (câu ngắn, nút gọi ở trên, đọc to một lần) | ✅ chạy | |
| Lời nhắn bằng giọng con | ✅ chạy | Chỉ lưu trên máy bố mẹ, không lên máy chủ |
| "Con cháu cài giúp" — 5 bước, có diễn tập | ✅ chạy | Diễn tập không ghi gì, không báo ai |
| Nối bố mẹ ↔ con bằng mã 6 số | ✅ chạy | |
| Cảnh báo tới máy con (Web Push), leo thang 60 giây | ✅ code chạy, ⚠️ **trên web thật cần khoá VAPID ở Render** | iPhone chỉ nhận khi đã "Thêm vào màn hình chính". Máy chủ ngủ thì mất hẹn leo thang đang chờ |
| Tự bật màn khi đang gọi (cả Zalo, Messenger) + OTP / cài app mới / tin trừ tiền ≥ 1 triệu | ✅ code + APK đã dựng, ⚠️ **chưa thử trên máy thật** | Xiaomi/Oppo có thể giết dịch vụ nền. Tin trừ tiền đọc SMS biến động số dư và thông báo của 22 app ngân hàng/ví đã xác minh (đọc xong bỏ, không lưu). Chỉ nói "đã chạy trên máy X" sau khi thử |
| "Có phải con đang gọi không?" — bác hỏi, con bấm Có/Không | ✅ chạy | Cần con đã bật nhận cảnh báo; chưa bật thì màn bác nói thật và đưa nút gọi lại số đã lưu |
| Gọi thẳng một chạm (CALL_PHONE) | ✅ APK | Web thì mở trình quay số |
| Số tổng đài 11 ngân hàng lớn (Vietcombank, BIDV, VietinBank, Agribank, Techcombank, ACB, Sacombank, VPBank, MB, TPBank, HDBank) | ✅ đã duyệt 23/9/2026 | Mỗi số đối chiếu từng chữ số với trang của chính ngân hàng, có người duyệt đứng tên; hiện nguồn và ngày kiểm ngay dưới số. Chỉ số cho khách cá nhân |
| Chìa khoá thứ hai (passkey) | ✅ chạy, ⚠️ **cần `KHOAN_DA_RP_ID` đúng tên miền** | Chữ ký của con **không chứng minh** khoản chuyển an toàn |
| Màn ngân hàng mô phỏng | ✅ chạy | Luôn có dải "MÔ PHỎNG". **Không ngân hàng thật nào tích hợp** |
| Ba công tắc bảo vệ ở màn con cháu | ⚠️ chỉ giao diện | Đừng giới thiệu |

---

## 4. So sánh với các hãng lớn (có nguồn)

**Android 16 (Google, 2025).** Trong lúc đang gọi điện, Android 16 chặn bật quyền "cài
ứng dụng không rõ nguồn", chặn bật dịch vụ trợ năng cho ứng dụng mới, và không cho tắt
Play Protect; Google còn thử nghiệm cảnh báo khi người dùng mở ứng dụng ngân hàng trong
lúc chia sẻ màn hình với người lạ.
Nguồn: [Google Security Blog — What's New in Android Security and Privacy in 2025](https://security.googleblog.com/2025/05/whats-new-in-android-security-privacy-2025.html) ·
[Google Security Blog — in-call scam protection cho ứng dụng tài chính (12/2025)](https://security.googleblog.com/2025/12/android-expands-pilot-in-call-scam-protection-financial-apps.html) ·
[Android Police](https://www.androidpolice.com/phone-by-google-scam-detection-enhancements/)

**Money Lock (Singapore, từ 11/2023).** DBS/POSB, OCBC, UOB cho khách tự khoá một phần
tiền: tiền đã khoá không chuyển online được, muốn mở phải tới quầy xác minh.
Nguồn: [Gutzy Asia](https://gutzy.asia/2023/11/27/singaporean-banks-dbs-ocbc-and-uob-introduce-money-locking-features-in-response-to-scams) ·
[The Independent SG](https://theindependent.sg/uob-ocbc-and-dbs-introduce-account-lock-features-to-protect-clients-from-scammers/)

**Khoan Đã nằm ở đâu:**

| | Android 16 | Money Lock | Khoan Đã |
|---|---|---|---|
| Ai dựng | Hãng hệ điều hành | Ngân hàng | Gia đình, không cần ngân hàng |
| Chặn gì | Thao tác nguy hiểm trên máy khi đang gọi | Chuyển online số tiền đã khoá | **Không chặn** — gọi người nhà vào ngay lúc đó |
| Người nhà có biết không | Không | Không | **Có**, nếu bác bật |
| Có ở Việt Nam hôm nay | Tuỳ đời máy, tuỳ hãng | Không | Có (web + APK) |

Câu nói: *"Android 16 khoá máy, Money Lock khoá tiền. Bọn em khoá khoảng trống giữa bác
và con — cái mà kẻ lừa đảo cần nhất là bác đừng gọi cho ai."*

⚠️ Đừng nói Khoan Đã "làm được việc của Android 16" — bản APK phát hiện **tổ hợp** (đang
gọi + OTP / cài app) rồi hiện màn, nó **không chặn** thao tác nào.

---

## 4b. Màn trình diễn trước hội đồng

Mở **`https://khoan-da.onrender.com/?trinhDien=1`** trên laptop (Chrome hoặc Edge, màn 1080p là
đẹp nhất). Hai điện thoại đứng cạnh nhau: trái là máy bác Lan, phải là máy Minh (con). Dải vàng
**"MÔ PHỎNG"** luôn ở trên cùng — đừng che, đừng cắt khỏi ảnh chụp.

| Nút | Chuyện xảy ra | Bấm gì tiếp |
|---|---|---|
| ① Cuộc gọi + mã OTP | Máy bác: màn cuộc gọi "công an" + tin OTP → máy tự bật màn đỏ. Máy Minh: thông báo → thẻ "Bác Lan đang cần anh/chị" + ba câu để nói | Bên trái bấm **Gọi ngay cho con cháu** → bên phải **Nghe** → hai máy "đang nói chuyện" → **Kết thúc** → bên trái bấm **Con bảo là lừa đảo** → bên phải hiện dòng thời gian |
| ② Người gọi xưng là con | Máy bác: số lạ "Mẹ ơi, con đây…" → màn "Đang bị ai gọi?" | Bên trái **Họ xưng là con? Hỏi con ngay** → bên phải **Không phải con** → bên trái hiện "Minh bấm: không phải Minh gọi. Bác cúp máy đi." |
| ③ Tiền vừa ra trong lúc gọi | Máy bác: tin ngân hàng trừ 20 triệu → màn "Tiền vừa ra. Gọi con ngay." | Bên trái **Tôi vừa chuyển theo lời người gọi** → màn phục hồi, có số tổng đài 11 ngân hàng |

- **"Xem bằng tiếng Anh"** đổi cả hai máy sang tiếng Anh — dùng khi thuyết trình bằng tiếng Anh.
- **Không cần mạng hội trường** để hai máy nói với nhau (chúng nối trong trình duyệt). Nhưng trang
  phải tải được — mở thử một lần ở nơi có mạng trước giờ thi.
- **Nói đúng khi giới thiệu:** *"Two phones, one laptop. The screens are the real app; the calls
  and the link between the phones are simulated so the demo can't fail on stage."*
- Màn trình diễn **không quay số, không gọi máy chủ, không đọc dữ liệu trên máy**: số hiện ra là
  số hư cấu (09xx xxx 111). Bấm nhầm nút gọi ngân hàng trong màn phục hồi thì máy tính có thể hỏi
  mở ứng dụng gọi — bỏ qua.

---

## 5. Số liệu được phép đưa lên slide

| Số | Nguồn | Ngày |
|---|---|---|
| 90,2% tin lừa đảo được cảnh báo (186 Cao + 53 Nghi ngờ trên 265) | `eval/results/latest.json` | lần đo mới nhất |
| 4,1% tin bình thường bị báo nhầm mức Cao (7/169) | nt | nt |
| Lệch recall Việt–Anh 0,2 điểm phần trăm | nt | nt |
| Số giây từ màn đỏ tới lúc bấm gọi | **chưa đo** — xem `5-KICH-BAN-THU-VOI-NGUOI-CAO-TUOI.md` | — |

Số buổi thử chưa có thì slide ghi *"đang đo với N người cao tuổi"*, không ghi số dự đoán.

---

## 6. Câu chốt

> **"Bọn em không hứa chặn được cuộc gọi lừa đảo. Bọn em không để bác một mình trong 60 giây đó."**

*"We do not promise to block scam calls. We promise this person will not be alone in those 60 seconds."*
