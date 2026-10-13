> **Trạng thái:** đề xuất từ quy trình nghiên cứu, chưa thẩm định pháp lý toàn văn. Thông tin CV 6190/NHNN-TT chỉ lấy từ báo chí, chưa đọc bản gốc. Chưa viết mã.

# Hướng đi đề xuất: Luật nới chậm (siết ngay, nới sau 24 giờ)

## 0. Tóm tắt

- **Hướng:** một luật duy nhất cho tiền của người cao tuổi. Mọi thay đổi làm yếu lớp bảo vệ (tăng hạn mức, thêm người nhận, đổi số nhận cảnh báo) có hiệu lực sau 24 giờ. Mọi thay đổi làm mạnh lên (giảm hạn mức, bật lại bảo vệ) có hiệu lực ngay. Chuyển vượt ngưỡng tới người nhận chưa có trong danh sách đã khai từ trước bị giữ 24 giờ.
- **Ngăn chặn ở đâu:** trước khi chuyển (luật đặt sẵn lúc bình tĩnh) và ngay lúc lệnh (ngân hàng giữ 24 giờ). Sau khi tiền đã tới người nhận, hướng này không có tác dụng.
- **Ai quyết:** luật cố định. Bác đặt ngưỡng một lần lúc bình tĩnh, ngân hàng thực thi. Không có AI và không có người thân trong đường quyết định.
- **Cần gì:** một ngân hàng thực thi luật. Khoan Đã không tự giữ được tiền, và phần Khoan Đã làm riêng rất mỏng.
- **Thẩm định:** chưa đủ. Chỉ #6 và #9 được thẩm định pháp lý và kỹ thuật. Hướng này lấy lõi từ #9 và #13, và vá đúng lỗ hổng mà thẩm định của #9 đã nêu: thiếu độ trễ khi nới lỏng. #13, #11 và #8 chưa có thẩm định riêng.
- **Nói thẳng:** đây không phải cơ chế mới. Singapore, DBS, Monzo và Apple đã có từng mảnh. Chỗ mới là ghép đúng ba bước của kịch bản lừa đảo (nới hạn mức, thêm người nhận, chuyển gấp) và không đòi bác thao tác khi đang hoảng. Muốn thành "đột phá" thì phải có ngân hàng thực thi và có số đo, hiện chưa có cả hai.

## 1. Cơ chế (bản đặc tả cho ngân hàng)

| Mã | Luật | Hiệu lực |
|---|---|---|
| R1 Siết ngay | Giảm hạn mức, xoá người nhận, bật lại bảo vệ | Ngay |
| R2 Nới chờ 24 giờ | Tăng hạn mức, thêm người nhận vào danh sách, đổi số hoặc email nhận cảnh báo, giảm hoặc tắt bảo vệ | 24 giờ. Gửi thông báo tới địa chỉ đăng ký cũ và mới |
| R3 Người nhận mới giữ 24 giờ | Chuyển trên ngưỡng tới người chưa có trong danh sách đã có hiệu lực từ 24 giờ trước | Giữ 24 giờ, thông báo tới địa chỉ đăng ký. Hết giờ tự nhả nếu không bị hủy |
| R4 Cộng dồn | Ngưỡng tính trên tổng 24 giờ của mọi người nhận, không tính theo từng lệnh | Áp dụng cho mọi lệnh |
| R5 Hủy có kiểm soát | Chỉ hủy qua kênh đã đăng ký từ trước, có xác minh mạnh của ngân hàng. Người thân không duyệt và không hủy | Theo quy trình ngân hàng |

R2 không áp cho vòng tròn gia đình (xem mục 6).

Trong `backend/src/trusted-circle.js`, mã quy tắc `khong_chuyen_tren_nguong_cho_nguoi_moi` (dòng 155) đã có cùng logic với R3. Khác biệt là hiện nay nó chỉ gửi cảnh báo cho người thân, không giữ tiền. Dòng 143–145 ghi rõ điều này. Hướng mới chuyển phần giữ tiền sang ngân hàng.

## 2. Năm câu hỏi bắt buộc

| Câu hỏi | Trả lời |
|---|---|
| Chặn ở đâu? | Trước khi chuyển: luật R1 và R2 đặt sẵn. Lúc lệnh: ngân hàng giữ theo R3 và R4 trong 24 giờ. Sau khi chuyển: không có tác dụng trong thiết kế này. |
| AI hay bác quyết? | Không AI. Luật cố định. Bác đặt ngưỡng một lần lúc bình tĩnh, ngân hàng thực thi. Nếu có AI, nó chỉ được thêm cảnh báo, không tham gia giữ tiền (§4.2). |
| Con cần làm gì? | Không bắt buộc. Có thể cùng bác đặt luật một lần lúc rảnh. Nhận thông báo nếu bác bật. Không có quyền duyệt, không có quyền dừng. |
| Cần quyền mới không? | Không quyền Android mới. Dùng kênh đẩy và thông báo đã có. Chuyển tiếp thông báo ngân hàng qua quyền nghe thông báo (do người dùng bật) là tuỳ chọn, và còn rủi ro (mục 8). |
| Cần đối tác, pháp lý gì? | Ngân hàng (R1 đến R5, cộng trạng thái có chữ ký). Pháp nhân để ký: ghi chú nội bộ cho biết đội chưa có, đây là điều kiện chặn Cổng 1. Luật sư (mục 8). |
| Vi phạm luật cứng? | Không, nếu làm đúng. Ba điểm rủi ro: §9.8 luật 1 (nếu áp R2 cho vòng tròn gia đình); §12 (lưu trạng thái giữ hoặc số tài khoản trên máy chủ mà chưa hỏi); §11 (dùng chữ "chặn" hoặc "đã đặt" khi ngân hàng chưa xác nhận). |

## 3. Kẻ lừa lách thế nào

| Cách lách | Luật có chặn không | Lỗ hổng còn lại |
|---|---|---|
| Chuyển ngay dưới ngưỡng | Không giữ | Ngưỡng do bác đặt. Nếu quá cao thì vô nghĩa |
| Chia nhỏ nhiều lệnh | R4 cộng dồn | Chia nhỏ qua nhiều ngày vẫn lọt nếu cửa sổ 24 giờ không đủ |
| Dùng người nhận đã có trong danh sách (tài khoản trung chuyển đã được khai) | Không miễn ngưỡng, chỉ được miễn R3 | Danh sách có thể bị dùng. Thêm người vào danh sách phải chờ 24 giờ |
| Dụ bác tăng hạn mức trước | R2 chờ 24 giờ, nếu bật thì người thân được báo | Lừa đảo kéo nhiều ngày thì có thể chuẩn bị trước |
| Dụ bác đổi số nhận thông báo | R2 chờ 24 giờ, báo cả số cũ và số mới | Chiếm tài khoản thì khó bị phát hiện |
| Mở tài khoản mới | Không, nếu luật chỉ áp cho tài khoản cũ | Cần luật mặc định cho tài khoản mới (chưa kiểm) |
| Ví, thẻ cào, tiền mặt, tiền số | Ngoài phạm vi | Đây là lỗ hổng lớn, không khắc phục được trong hướng này |
| Ra quầy | Phụ thuộc quy định quầy | Chưa kiểm. Nếu quầy đổi ngay thì phải ghi là lỗ hổng |
| Dụ bác hủy khoản đang giữ | R5 yêu cầu kênh đã đăng ký | Đây là lỗ hổng lớn nhất. Dụ hủy là cách lách chính. Đo bằng khiếu nại và báo cáo của người thân |
| Chờ 24 giờ | Không chặn | Chấp nhận. Thông báo người thân là cách duy nhất làm tăng chi phí cho kẻ lừa |

## 4. Bằng chứng: có gì, thiếu gì

- **Hướng chính sách đã có ở Việt Nam:** CV 6190/NHNN-TT (theo báo chí). Khoảng chờ tối thiểu 24 giờ cho chuyển tới người nhận chưa nhận đủ từ khách trong 12 tháng, hạn 1/3/2027. Chưa đọc bản gốc. Ngày ban hành mâu thuẫn (14/7 hoặc 20/7). Theo báo chí, văn bản không có R1, R2 và R4, và không quy định thông báo người đăng ký.
- **Gần nhất về cơ chế:** DBS giữ 12 giờ khi thêm người nhận, nâng hạn mức hoặc đổi email và số điện thoại, và gửi cảnh báo tới địa chỉ đăng ký (năm và hiệu lực CHƯA KIỂM, chưa có số hiệu quả). Singapore (ABS) giữ 24 giờ khi rút quá 50% số dư. Không có đánh giá độc lập. MAS thừa nhận nhiều khoản bị gắn cờ là hợp lệ. Apple trễ 1 giờ cho thay đổi làm yếu bảo vệ, không có số.
- **Gần nhất về người thân:** Monzo giữ khoản vượt hạn mức để người tin cậy xem xét, và có lối vượt bằng selfie. CPF chỉ thông báo, không giữ. Carlin, Umar và Yi (JFE 2023) cho thấy luật bang Mỹ cho phép liên hệ người chỉ định và tạm giữ khoản chi nghi ngờ đi kèm giảm báo cáo lạm dụng tài chính người cao tuổi. Nghiên cứu đo số báo cáo, không đo tiền mất. Bản đã xuất bản CHƯA KIỂM.
- **Cảnh báo chữ có tác dụng yếu và phai:** RCT của DeLiema giảm khoảng 5 điểm phần trăm (2026) và phai theo thời gian. Akesson (2023) cho thấy nút hành động được thiết kế lại mạnh hơn cảnh báo chữ, nhưng là thí nghiệm trực tuyến và các số 22%→4% CHƯA KIỂM.
- **Tác động đo được mạnh nhất:** hoàn tiền bắt buộc ở Anh giảm khoảng 21% thiệt hại trong phạm vi (ước tính từ bản tóm tắt). Đây là tác động của trách nhiệm ngân hàng, không phải của luật nới chậm.
- **Thiếu:** không có RCT nào đo việc giữ một lần chuyển bị ép và tiền không mất ở người từ 70 tuổi. Hướng này có cơ chế hợp lý và có tiền lệ chính sách, nhưng chưa có bằng chứng hiệu quả riêng.

## 5. Khác gì các app hiện có và các hướng đã bị loại

- **Truecaller, nTrust, iCallme, Scamio:** chưa kiểm từng sản phẩm trong lượt này. Theo mô tả chung, phần lớn tập trung vào nhận diện số gọi, lọc tin hoặc cảnh báo nội dung, không giữ tiền. Nếu đúng, khác biệt là hướng này không đứng ở bước cảnh báo.
- **Monzo Trusted Contacts:** gần nhất về ý tưởng. Khác ở chỗ hướng này không để người thân xem xét hoặc duyệt, và không có lối vượt bằng selfie. Lối vượt chỉ là xác minh mạnh của ngân hàng.
- **CPF Trusted Contact:** chỉ thông báo. Hướng này thêm việc giữ tiền ở tầng ngân hàng.
- **Các hướng bị loại theo thẩm định:**
  - Duyệt bắt buộc của người tin cậy (RBI): phụ thuộc người con đang bận và thiếu quyền pháp lý.
  - "Hàng rào đảo" có chìa khoá dừng: bác phải xác minh khi đang hoảng.
  - Trần lũy kế trong app: không có điểm thực thi trên máy, không hứa được.
  - Két tách tiền: vẫn là sản phẩm ngân hàng. Giữ làm bổ sung, không làm lõi.
  - Quầy gọi người gác: phụ thuộc quy định quầy chưa kiểm.
  - Khoá trễ trong app: không chạm đường tiền. Device Admin đã bị loại, và trùng với §9.8.

## 6. Phần app làm được và phần cần đối tác

**App làm được ngay, không cần đối tác và không cần quyền mới:**
1. Đặt luật lúc bình tĩnh, gắn nhãn "tự khai, ngân hàng chưa xác nhận". Dùng logic `datQuyTac` đã có.
2. Hướng dẫn bác tìm đúng mục cài đặt trong app ngân hàng. App không đọc cài đặt ngân hàng, bác tự xác nhận.
3. Thông báo người thân (opt-in) khi ngân hàng báo có khoản đang giữ. Dùng kênh đẩy và `bao-dong-gia-dinh.js` đã có (chưa đọc chi tiết trong lượt này). Payload theo §6.9: không có nội dung, số tài khoản hay OTP.
4. Màn "đang giữ / chưa xác nhận" có nút "Tôi ổn", và ghi lại các lần báo động giả.
5. Diễn tập kịch bản "bị giục nới hạn", đo lại ở tuần 0, 1 và 4. Không ghi là hiệu quả.

Phần này không giữ được tiền. Nó chỉ giúp người thân biết đúng lúc khi ngân hàng đã giữ.

**Cần ngân hàng:**
- Giữ tiền thật theo R3 và R4. Áp R2 cho thay đổi hạn mức, người nhận và số nhận thông báo. Áp cùng luật cho tài khoản mới và cho kênh quầy (chưa kiểm).
- Gửi thông báo tới địa chỉ đăng ký khi bắt đầu giữ, không qua app.
- Trạng thái giữ phải có chữ ký của ngân hàng và cần bộ xác minh riêng. `khoan-proof` hiện chỉ xác minh passkey của thiết bị, không kiểm được chữ ký ngân hàng.
- Pháp nhân để ký. Đây là điều kiện chặn Cổng 1.

**Giới hạn cứng:**
- R2 không áp cho vòng tròn gia đình. `trusted-circle.js` dòng 14 và 75–80 (§9.8 luật 1) cho chủ tài khoản thu hồi quyền của thành viên bất cứ lúc nào, không cần xác nhận. Áp độ trễ cho việc đó là đổi luật, phải hỏi chủ dự án.
- Hệ quả đã biết: kẻ lừa có thể dụ bác gỡ người thân ngay. Phải ghi rõ đây là lỗ hổng, không được che.
- Phần giữ tiền nằm ở ngân hàng. App không được nói khác.

## 7. Quyết định cần chủ dự án (§12)

1. **Giữ §9.8 luật 1 (khuyến nghị).** Luật nới chậm không áp cho vòng tròn gia đình. Nếu muốn áp, đó là đổi luật.
2. **Không lưu trạng thái giữ hay số tài khoản trên máy chủ (khuyến nghị).** Nếu cần, đó là đổi mô hình riêng tư và phải hỏi.
3. **Theo đuổi đối tác ngân hàng và thành lập pháp nhân hay không.** Không có pháp nhân thì không vào được Cổng 1.
4. **Ngưỡng mặc định và việc cho phép bác tự đặt.** Không đưa con số nào vào copy trước khi có dữ liệu.
5. **Không dùng Device Admin, không đọc cài đặt ngân hàng, không thêm quyền mới.**

## 8. Pháp lý cần luật sư xác nhận

- CV 6190: bản gốc, ngày ban hành, và có cho phép ngân hàng áp độ trễ dài hơn (R2) và cộng dồn (R4) không.
- Trách nhiệm khi giữ lệnh quá thời hạn (BLDS 2015, Điều 351 và 360, nguồn tư vấn, chưa kiểm). Điều khoản giới hạn trách nhiệm phải kiểm với luật bảo vệ người tiêu dùng.
- NĐ 356/2025: lịch sử giao dịch và trạng thái giữ là dữ liệu nhạy cảm theo tóm tắt, cần đồng ý riêng. Thông báo người thân là xử lý dữ liệu của người không ký gì với app.
- Ủy quyền: thiết kế chỉ thông báo người thân, không cho họ quyền hủy. Nếu sau này cho họ quyền yêu cầu ngân hàng dừng, cần ủy quyền bằng văn bản từ trước.
- Phân phối: quyền nghe thông báo trên APK ngoài store (Android 13 trở lên) có thể bị giới hạn. Enhanced Confirmation (Android 15) chưa kiểm. Xác minh nhà phát triển toàn cầu 2027, Việt Nam chưa thấy trong đợt đầu (CHƯA KIỂM). Khai báo tính năng tài chính trên Play chưa kiểm.

## 9. Lộ trình theo cổng và chỉ số đo

**Cổng 0 (không cần đối tác, 4 đến 6 tuần):**
- Chốt năm quyết định ở mục 7.
- Luật sư xác nhận mục 8.
- Viết hàm quy tắc thuần, không AI, không đọc đồng hồ hệ thống, theo kiểu `trusted-circle.js`, kèm kiểm thử.
- Copy qua kiểm §4.1, §4.3 và §11.
- Chỉ đo hạ tầng trên dữ liệu tự soạn. Không ghi hiệu quả.

**Cổng 1 (cần pháp nhân và thư ý định từ một ngân hàng):** chế độ bóng (shadow) 8 đến 12 tuần. Ngân hàng ghi "sẽ giữ" nhưng không giữ. Đo tỷ lệ khoản hợp lệ sẽ bị ảnh hưởng.

**Cổng 2 (thí điểm có kiểm soát):** người tự nguyện, giữ thật, quy mô nhỏ. Đo tỷ lệ hủy, khiếu nại và "Tôi ổn". Dừng nếu khoản hợp lệ bị giữ vượt ngưỡng đặt trước.

**Cổng 3 (đánh giá so sánh):** triển khai bậc thang theo chi nhánh hoặc nhóm, có đồng ý đạo đức. Chỉ sau cổng này mới được nói về hiệu quả.

**Chỉ số:**
- *Tiến trình* (đo được từ Cổng 0): số người bật luật, số lần đổi luật, số thông báo người thân đã mở (không gọi là "đã đọc"), tỷ lệ "Tôi ổn" trong khoảng giữ.
- *Kết quả* (cần ngân hàng và đối chứng): tỷ lệ khoản bị giữ mà chủ tài khoản hủy, tỷ lệ khoản hợp lệ bị giữ (chi phí), khiếu nại, số khoản lừa đảo báo lại sau khi giữ.
- *Cỡ mẫu:* lừa đảo hiếm theo từng người. Pilot nhỏ không đủ để chứng minh ngăn được mất tiền.
- *Ngưỡng dừng:* [MỤC TIÊU, chưa đặt]. Chủ dự án và ngân hàng phải đặt trước khi chạy.

## 10. Luật cứng và điều không được hứa

**Luật cứng:**
- §4.1: giữ ba nhãn. Trạng thái "đang giữ" không dùng chữ "an toàn".
- §4.2: không AI trong đường giữ tiền. AI nếu có chỉ thêm cảnh báo.
- §4.3: chỉ hiện "ngân hàng đã giữ" khi ngân hàng xác nhận bằng trạng thái có chữ ký. Còn lại hiện "chưa xác nhận", kèm câu nói rõ không có nghĩa là không có khoản nào đang giữ.
- §4.6: "Tôi ổn" có ở mọi màn giữ.
- §11: không dùng "chặn", "bảo vệ được" hay "đã đặt" khi chưa xác nhận. Không hứa lấy lại tiền.
- §12: không đổi §9.8, không đổi ngưỡng 20/45/69 và chốt 10. Không dùng LLM làm giám khảo. Không để người thân duyệt. Không thêm cụm hạ mức vô điều kiện.

**Không được hứa:** ngăn mất tiền; ngân hàng sẽ giữ (khi chưa xác nhận); người thân dừng được giao dịch; giảm lừa đảo bằng số liệu của nước khác; chống được kẻ chờ đủ 24 giờ hoặc kẻ đổi sang kênh khác.

**Copy mẫu:**
- Khi chưa xác nhận: "Bác đã đặt quy tắc. Khoan Đã chưa thấy ngân hàng xác nhận quy tắc này."
- Khi ngân hàng báo đang giữ: "Ngân hàng đang giữ khoản này đến [giờ] theo quy tắc bác đã chọn. Tôi ổn."
- Khi không thấy trạng thái: "Chúng tôi không thấy khoản đang giữ trong thông tin nhận được. Điều này không có nghĩa là không có khoản nào đang giữ."
- Muốn hủy: "Muốn hủy, bác gọi số đã đăng ký với ngân hàng từ trước."

## 11. Rủi ro và điều kiện thất bại

- **Ngân hàng chỉ làm mức tối thiểu của CV 6190.** Khi đó phần app thành cảnh báo. Đây là khả năng cao nhất.
- **Hủy khi bị dụ.** Nếu tỷ lệ hủy sau dụ dỗ cao, hướng này thất bại. Đo bằng khiếu nại và báo cáo của người thân.
- **Kẻ lừa đổi kênh:** ví, thẻ cào, tiền mặt, tiền số, tài khoản mới, quầy. Hiệu quả dịch chuyển sang kênh khác, tổng thiệt hại không giảm.
- **Giữ nhầm việc gấp** (viện phí, thuốc). Người cao tuổi bị trễ, khiếu nại, bỏ dùng dịch vụ.
- **Tự chủ:** trong một nghiên cứu định tính 2025 với 12 nạn nhân, một số người thấy việc giữ tiền là xâm phạm quyền tự quyết.
- **Mệt vì thông báo:** người thân bỏ qua như các cảnh báo khác.
- **Ngân hàng từ chối** vì rủi ro trách nhiệm khi giữ lệnh quá thời hạn.
- **Thiếu pháp nhân.** Không vào được đối tác, hướng này dừng ở tài liệu.
- **Dữ liệu:** nếu sau này lưu trạng thái giữ hoặc số tài khoản trên máy chủ mà chưa hỏi, vi phạm §12.

## 12. Ghi chú thẩm định và kiểm chứng

- Hướng này cần chạy lại thẩm định pháp lý và kỹ thuật trước khi chốt.
- CV 6190: ngày ban hành mâu thuẫn, chưa đọc bản gốc. CLAUDE.md chưa nhắc văn bản này.
- CLAUDE.md ghi Monzo "giữ đến khi người tin cậy xác nhận". Nguồn nghiên cứu cho thấy đó là xem xét và có thể không đồng ý, không phải phủ quyết. Không dùng cách nói đó cho hướng này.
- Singapore 24 giờ là safeguard của ngành ABS, MAS phối hợp, không phải quy định của MAS. Ghi đúng khi viết tài liệu hoặc copy.
- Các số 22%→4% và 57%→50% của Akesson, cùng nhận định "tan sau một tháng" của ROLESafe, vẫn CHƯA KIỂM. Không dùng.
- Lượt này chỉ đọc code (`trusted-circle.js`, `intervention-ladder.js`, và danh sách module backend), chưa chạy kiểm thử. Các hàm nêu ở mục 9 là đề xuất, chưa viết.
