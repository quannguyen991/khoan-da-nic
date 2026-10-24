# CÂU HỎI ĐỂ HỎI MENTOR — chuẩn bị cho vòng gặp mentor / giám khảo

Sắp theo nhóm. Mỗi câu kèm một dòng "vì sao hỏi câu này" để tự nhớ ý khi hỏi
trực tiếp — không cần đọc nguyên văn, hỏi bằng lời riêng cũng được.

---

## A. Kỹ thuật — kiến trúc "luật + AI"

1. **Ranh giới AI-chỉ-bật-cờ / luật-mới-quyết có phải là kiến trúc chuẩn cho
   bài toán "quyết định có hậu quả thật" không, hay có mô hình khác tốt hơn
   (ví dụ ensemble, calibration layer) mà bọn em chưa biết tên?**
   *Vì sao hỏi: đây là quyết định kiến trúc lớn nhất của dự án — muốn biết có
   đang tái phát minh một bánh xe đã có tên, hay đang đi đúng hướng người ta
   gọi là "guardrailed AI".*

2. **Khi một tầng luật regex phải phủ nhiều biến thể ngôn ngữ (viết tắt, viết
   không dấu, lỗi chính tả cố ý để né bộ lọc), có kỹ thuật nào thay thế cho
   việc viết tay hàng trăm mẫu không? (fuzzy matching, embedding similarity,
   fine-tune một classifier nhỏ...)**
   *Vì sao hỏi: bọn em đang duy trì ~600 mẫu regex tay, biết sẽ không scale
   mãi theo cách này.*

3. **Có công cụ/kỹ thuật chuẩn nào để phát hiện "quy tắc bị phá bởi một cụm từ
   hạ mức vô điều kiện" trước khi nó lọt ra production, thay vì phải tự tìm
   bằng tay như bọn em đang làm?**
   *Vì sao hỏi: đã có một lần thêm một cụm miễn trừ làm tụt hẳn một kịch bản
   giả danh công an xuống mức thấp — muốn biết ngành có công cụ fuzz-test luật
   không.*

4. **Với một sản phẩm càng thêm tín hiệu càng phải "chỉ được tăng cảnh giác,
   không bao giờ giảm" — có mô hình toán học nào đảm bảo tính đơn điệu
   (monotonicity) đó một cách hình thức, thay vì chỉ kiểm bằng test case?**

5. **Độ trễ LLM đổi mạnh theo gateway: từng thấy trung vị 6,5s, đuôi 27–35s; đo lại
   25/9/2026 trên máy chủ thật (47 lượt) thì trung vị 2,0s, chậm nhất 3,7s.
   Ngành thường xử lý bài toán "chờ AI mà vẫn phải phản hồi tức thì" như thế
   nào — streaming từng phần, speculative fallback, hay chấp nhận UX hai giai
   đoạn như bọn em đang làm (luật trả ngay, AI bổ sung sau)?**

6. **Bọn em đang dùng một gateway trung gian đổi được nhà cung cấp model —
   nhưng vẫn phụ thuộc một bên thứ ba duy nhất tại một thời điểm. Có kiến trúc
   multi-provider failover chuẩn cho sản phẩm an toàn không, và chi phí vận
   hành nó có đáng so với rủi ro downtime không?**

---

## B. Đo lường và đánh giá (eval)

7. **Bộ đánh giá của bọn em là 571 mẫu tự thu thập/tổng hợp, không phải benchmark
   công khai. Làm sao chứng minh với nhà đầu tư/giám khảo rằng con số đo được
   không tự đánh lừa (overfit vào chính tập mẫu mình viết)?**

8. **Có chuẩn ngành nào cho việc báo cáo recall/false-positive của một hệ thống
   phát hiện lừa đảo không (giống kiểu classification report chuẩn trong y tế
   hay tài chính), để bọn em trình bày đúng ngôn ngữ nhà đầu tư quen?**

9. **Khi mô hình nền (LLM) đổi phiên bản ngoài tầm kiểm soát của bọn em (nhà
   cung cấp âm thầm cập nhật), có cách nào phát hiện sớm việc điểm eval tụt
   do model đổi chứ không phải do mã bọn em đổi?**

---

## C. Bảo mật & quyền riêng tư

10. **Với dữ liệu nhạy cảm (nội dung tin nhắn nghi lừa đảo của người già) đi
    qua một LLM bên thứ ba, có checklist tuân thủ nào (GDPR-style, hoặc chuẩn
    Việt Nam — Nghị định 13/2023) bọn em cần làm ngay ở giai đoạn early-stage,
    trước khi có luật sư riêng?**

11. **Model chuyển giọng nói thành chữ chạy trên trình duyệt (Web Speech API)
    gửi âm thanh ra máy chủ của hãng trình duyệt — nằm ngoài tầm kiểm soát
    của app. Có cách nào minh bạch hoá luồng dữ liệu này với người dùng ở mức
    tốt hơn một dòng cảnh báo, mà vẫn không cần tự dựng hạ tầng speech-to-text
    riêng (tốn kém với một startup giai đoạn này)?**

12. **Threat model nào bọn em nên ưu tiên phòng trước: (a) kẻ lừa đảo cố tình
    "huấn luyện ngược" app bằng cách gửi hàng loạt câu để dò ngưỡng, hay
    (b) tấn công injection qua nội dung người dùng nhập (đã có hàng rào một
    phần), hay (c) một hướng khác bọn em chưa nghĩ tới?**

---

## D. Chi phí & khả năng mở rộng (scale)

13. **Với mô hình hiện tại (1 lượt phân tích = ít nhất 1 lệnh gọi LLM), chi phí
    biên trên mỗi người dùng hoạt động là bao nhiêu thì mô hình kinh doanh còn
    hợp lý? Có công thức/benchmark ngành nào cho tỷ lệ "chi phí AI / doanh thu"
    chấp nhận được ở early-stage không?**

14. **Nếu số người dùng tăng 100 lần trong một tháng (viral), kiến trúc hiện
    tại (Node + Express đơn, một gateway LLM) sẽ vỡ ở đâu trước tiên, và mức
    đầu tư hạ tầng tối thiểu để chịu được mức đó là gì?**

15. **Bọn em định để tầng luật chạy được cả khi mất mạng (offline-first một
    phần) — đây có phải hướng đúng cho thị trường vùng nông thôn/sóng yếu ở
    Việt Nam không, hay nên ưu tiên nguồn lực chỗ khác?**

---

## E. Sản phẩm & người dùng (người cao tuổi, thị trường Việt Nam)

16. **Người cao tuổi ít khi tự tải app mới — thường là con cháu cài hộ. Có mô
    hình phân phối nào (qua kênh gia đình, qua ngân hàng, qua tổ dân phố) mà
    startup khác từng làm thành công với nhóm người dùng khó tiếp cận trực
    tiếp tương tự không?**

17. **Đo UX cho người già khác đo UX thông thường ở điểm nào bọn em có thể
    đang bỏ sót — ngoài cỡ chữ và vùng chạm mà bọn em đã làm?**

18. **Có case study nào về sản phẩm an toàn/bảo vệ mà chính đối tượng cần bảo
    vệ lại là người từ chối dùng nó (vì cảm giác bị "giám sát" hoặc "bị coi là
    yếu đuối") không, và họ giải quyết bài toán tâm lý đó thế nào?**

---

## F. Mô hình kinh doanh & huy động vốn

19. **Với một sản phẩm mà giá trị cốt lõi là "ngăn mất tiền", mô hình định giá
    nào hợp lý hơn: thu phí trực tiếp người dùng cuối (vốn nhạy cảm về giá),
    hay B2B2C qua ngân hàng/bảo hiểm (nơi có ngân sách nhưng chu kỳ bán hàng
    dài)?**

20. **Ở vòng gọi vốn early-stage cho một sản phẩm an toàn xã hội (không thuần
    lợi nhuận), nhà đầu tư thường muốn thấy metric nào chứng minh traction —
    số người dùng hoạt động, số vụ lừa đảo chặn được, hay thứ khác?**

21. **Có nên định vị đây là sản phẩm fintech-adjacent (dễ gọi vốn hơn, nhiều
    nhà đầu tư quan tâm) hay giữ định vị social-impact/health-tech (đúng bản
    chất hơn nhưng ít quỹ chuyên biệt hơn ở Việt Nam)?**

---

## G. Câu hỏi ngược lại cho mentor (thể hiện đã suy nghĩ, không chỉ xin lời khuyên)

22. **Anh/chị đã từng thấy startup nào coi "độ chậm hơn nhưng đúng hơn" là lợi
    thế cạnh tranh thay vì bất lợi chưa — và họ truyền thông điều đó với thị
    trường thế nào?**

23. **Với kinh nghiệm của anh/chị, sai lầm phổ biến nhất của một đội kỹ thuật
    khi lần đầu đưa AI vào một sản phẩm có hậu quả thật (tiền, sức khoẻ, pháp
    lý) là gì?**

---

## Cách dùng danh sách này

- Không hỏi hết — chọn 3–4 câu **đúng chuyên môn của mentor cụ thể** (một
  mentor kỹ thuật thì hỏi nhóm A/B, mentor gọi vốn thì hỏi nhóm F).
- Câu 22–23 luôn nên hỏi cuối buổi, bất kể mentor nào — nó cho thấy nhóm đến
  để học chứ không chỉ để trình bày.
- Nếu mentor trả lời một điều **mâu thuẫn với ràng buộc đã chốt** trong
  `CLAUDE.md` §12 (ví dụ gợi ý bỏ tầng luật, dùng "LLM judge" thuần) — đó là
  ý kiến đáng ghi lại để cân nhắc, không phải lệnh phải làm theo ngay. Ghi lại
  và mang về thảo luận nội bộ trước khi đổi bất cứ gì.
