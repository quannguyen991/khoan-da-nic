# NỘP BÀI — AI FOR SDGs · GLOBAL YOUTH AI FUTURE INNOVATION COMPETITION 2026

Khoan Đã · Nguyễn Xuân Minh Quân · **hạn 15/9/2026** · **không mất phí**

Mọi khối trong **hộp mã** là chép nguyên vào form. Chữ Việt bên ngoài là ghi chú, đừng chép.
Form và mọi tài liệu **bắt buộc tiếng Anh**.

---

## PHẦN 0 · ĐÍNH CHÍNH VÀ ĐÂY LÀ GÌ

Cháu mở link bác gửi và ban đầu nghi nó không thật, vì tên miền `lingxi360.com` là nền tảng biểu mẫu của Trung Quốc, không phải EPO. **Cháu sai.** Trang chính thức của Đại học Liên Hợp Quốc dẫn tới **đúng URL đó**, kể cả tham số theo dõi `utm_bccid`. Link là thật.

Nhưng nó **không phải cổng nộp của EPO**. Đây là một cuộc thi hoàn toàn khác:

> **AI for SDGs — Global Youth AI Future Innovation Competition 2026**
> do **UNU Global AI Network** (Đại học Liên Hợp Quốc, trụ sở UNU Macau) khởi xướng.
> Vận hành qua `ai4sdgs@venturecup.cn`. Chung kết **26/11/2026 tại Macau**.

**Hai cuộc thi này không thay thế nhau. Nộp cả hai được.** EPO hạn 30/9, cuộc thi này hạn 15/9 — **gần hơn 15 ngày**. Làm cái này trước.

---

## PHẦN 1 · SỰ THẬT VỀ CUỘC THI

| Mục | Nội dung |
|---|---|
| Hạn nộp | **15/9/2026** — còn **11 ngày** |
| Lệ phí | **Không.** Nguyên văn: không thu phí đăng ký, phí đào tạo hay bất kỳ phí nào |
| Ai dự thi được | *"any company, group, or **individual** worldwide, regardless of nationality or background"* — **cá nhân nộp được**, không cần pháp nhân |
| Tuổi | **Trang không đặt giới hạn tuổi nào.** Tên giải là "Global Youth" nhưng không thấy điều khoản tuổi |
| Độ chín công nghệ | ⚠️ **TRL 6 trở lên** — đã qua giai đoạn phòng thí nghiệm, kiểm chứng được ngoài đời thật, gần mức thương mại hoá |
| Tuổi doanh nghiệp | Nếu **đã** lập công ty thì công ty phải dưới 10 năm. Chưa lập thì không vướng |
| Ngôn ngữ | Tiếng Anh, bắt buộc cho cả hồ sơ lẫn tài liệu kèm |
| Ba nhánh | AI for Education (SDG 4) · **AI for Social Innovation (SDG 4, 5, 10, 16)** · AI for Less Developed Countries (SDG 4, 9, 10) |
| Lịch | Vòng giám khảo 16–30/9 (trực tuyến) · Bán kết 1–15/10 (trực tuyến) · **Chung kết 26/11/2026 tại Macau (trực tiếp)** |
| Quyền lợi chung kết | **Miễn phí khách sạn** ở Macau. Có suất hỗ trợ đi lại **tới 1.000 USD/đội**, số lượng hạn chế, phải đăng ký xin |
| Liên hệ | `ai4sdgs@venturecup.cn` |

---

## PHẦN 2 · ⚠️ VẤN ĐỀ LỚN NHẤT: CHỦ ĐỀ NĂM NAY LÀ **GIÁO DỤC**

Đây là điều phải biết trước khi viết một chữ nào.

**Chủ đề 2026: "AI and Education — AI Transforming the Educational Paradigm and Enhancing AI Literacy."** Cả ba nhánh đều là nhánh giáo dục. Ngay nhánh "AI for Social Innovation" cũng được định nghĩa là giải quyết vấn đề xã hội **thông qua trao quyền bằng giáo dục**.

**Khoan Đã không phải sản phẩm giáo dục.** Nó là hệ thống cảnh báo lừa đảo. Nói thẳng ra để bác biết mình đang ở đâu, chứ không phải để bác bỏ cuộc.

### Nhưng phần giáo dục của Khoan Đã có thật, và mạnh hơn cháu tưởng

Cháu đã mở mã nguồn kiểm. Bốn thứ này **tồn tại thật**, không phải nói cho hay:

| Thứ | Ở đâu | Là gì |
|---|---|---|
| **Bài học có kiểm tra** | `src/components/Learn.tsx` + `src/data/scamData.ts` | Bộ bài học về các thủ đoạn lừa đảo, chia nhóm, có tìm kiếm, **có câu hỏi kiểm tra** (`quizState` theo từng bài) |
| **Khu thử tình huống** | `src/components/ThuTinhHuong.tsx` + `src/data/tinh-huong-thu.ts` | Bản máy tính cho **con cháu**: chạy **11 tình huống — 6 tin đáng cảnh báo và 5 tin lành đặt cạnh nhau cùng cỡ chữ**, để họ tự kiểm chứng app trước khi bảo bố mẹ tin nó |
| **Mật khẩu gia đình** | `src/components/MatKhauGiaDinh.tsx` | Quy ước xác minh thoả thuận **từ trước**, dạy trước khi bị gọi |
| **Số khẩn cấp** | `Learn.tsx`, tab thứ hai | Tra cứu ngay trong lúc hoảng |

Và trong `ThuTinhHuong.tsx` có một đoạn ghi chú **chính là một lập luận sư phạm**, dịch ra dùng được luôn:

> *"Một bảng chỉ có tin lừa đảo sẽ dạy người xem rằng 'báo động nhiều = tốt'. Với app này thì ngược lại... App không tự chấm điểm mình. Nếu để app tự tuyên bố 'đúng 9/10' thì nó lại thành một con số không ai kiểm được."*

Đây là điều rất ít hồ sơ AI giáo dục nói được: **công cụ từ chối tự chấm điểm mình, và bắt người học tự nhìn bằng mắt.**

### Lập luận giáo dục trung thực — dùng nguyên khối này

Không phải "nhét cho vừa". Đây là sự thật về sản phẩm:

- Giáo dục chống lừa đảo kiểu cũ là tờ rơi và phóng sự truyền hình — **dạy lúc người ta không bị lừa**, và quên sạch lúc bị lừa.
- Khoan Đã dạy **đúng vào phút bị tấn công**: nó gọi tên chính xác thủ đoạn đang được dùng lên người đó, ngay lúc đó. Trong sư phạm, đây là *teachable moment*.
- Nó có **vòng dạy trước** (bài học, kiểm tra, mật khẩu gia đình) và **vòng dạy sau** (con cháu dùng khu thử tình huống, rồi có kịch bản "Nói gì với bố mẹ").
- Đối tượng là **nhóm bị mọi chương trình phổ cập số bỏ sót**: người cao tuổi. Không ai làm giáo trình AI literacy cho người 70 tuổi đang hoảng.

Trong danh sách tình huống của nhánh Social Innovation, có đúng một dòng khớp thẳng:
**"AI tools for combating misinformation and promoting digital citizenship."**

---

## PHẦN 3 · CHỌN NHÁNH NÀO — cháu khuyên **AI for Social Innovation**

| Nhánh | Hợp ở đâu | Vướng ở đâu |
|---|---|---|
| **AI for Social Innovation** ⭐ | **SDG 16 nằm trong danh sách SDG của nhánh này** — đúng SDG chính của Khoan Đã. Có dòng "combating misinformation and promoting digital citizenship" | Định nghĩa nhánh nhấn "thông qua giáo dục" — phải viết cho ra phần giáo dục |
| AI for Less Developed Countries | Các tình huống khớp **gần như từng dòng** với kiến trúc Khoan Đã: chạy offline, ưu tiên điện thoại, nhẹ hạ tầng, ngôn ngữ bản địa, chi phí thấp | ⚠️ **Việt Nam không nằm trong danh sách LDC của Liên Hợp Quốc.** Giám khảo tra một phút là ra. Nhánh có ghi thêm "và cộng đồng yếu thế", nhưng đây là chỗ mời người ta bắt bẻ |
| AI for Education | — | Khoan Đã không phải nền tảng dạy học |

**Chốt: chọn `AI for Social Innovation`.** Đây là nhánh duy nhất mà SDG chính của Khoan Đã nằm sẵn trong danh sách, và không mời một câu hỏi có thể bị bác bằng dữ kiện.

---

## PHẦN 4 · CÁC Ô TRONG FORM — cháu đã đọc tận nơi

Ô có dấu `*` là **bắt buộc**.

### Có sẵn, chỉ việc điền

| Ô | Điền gì | Tình trạng |
|---|---|---|
| Company or Project Name * | `Khoan Da` | ✅ |
| Where are you based * | thành phố, `Vietnam` | ✅ |
| Focus Area * | **AI for Social Innovation** | ✅ |
| Year of Formation * | `2026` (commit đầu tiên 15/8/2026) | ✅ |
| Main Contact Person * | tên bác | ✅ |
| Title (role in the team) * | `Founder and sole developer` | ✅ |
| Website * | `https://khoan-da.onrender.com` | ✅ đã kiểm, trả 200 |
| Introduction * | khối 5.1 | ✅ |
| Key product or solution Introduction * | khối 5.2 | ✅ |
| logo * | `icon-xem-thu.png` (80 KB) | ✅ có sẵn |
| Product Photo or Team Photo * | `aijam-slides/anh-1.png` hoặc `anh-2.png` | ✅ có sẵn |
| **Business Plan (max 30M) *** | `aijam-slides/khoan-da-3-slides.pdf` (702 KB) hoặc `GIOI-THIEU-KHOAN-DA.pdf` (2,4 MB) | ✅ **đã có sẵn pitch deck** |

### Ô cần bác tự quyết

| Ô | Vướng gì | Cháu khuyên |
|---|---|---|
| **University *** | Bác học cấp ba, không có trường đại học. Ô này bắt buộc | Ghi **tên trường THPT của bác**. Đừng bỏ trống, đừng bịa tên đại học |
| **Highest Education level *** | | `High school (in progress)` |
| **Phone number *** | Đòi mã nước + số, ghi rõ WhatsApp | Số của bác hoặc của bố/mẹ. Xem Phần 7 |
| **Address *** | Địa chỉ nhà | Xem Phần 7 |
| **Email *** | | Dùng email bác đang dùng cho các hồ sơ khác cho thống nhất |
| **Looking for *** | Chọn: Investment · Business Partner · R&D Partner · Pilot opportunity in China | Chọn **R&D Partner** (+ Business Partner nếu muốn). **Đừng tick Investment** — Khoan Đã cố ý miễn phí, không tài khoản, không doanh thu; tick Investment là tự mời câu hỏi mình không trả lời được |

### Ô KHÔNG bắt buộc — bỏ trống được

Ba ô này **không có dấu `*`**, nên một học sinh không pháp nhân vẫn nộp được:

- Business Registration File → bỏ trống
- Latest Investment Round (completed) → bỏ trống
- 2024 Net Profit in USD → bỏ trống
- Referred by (if any) → bỏ trống

---

## PHẦN 5 · CÁC KHỐI CHỮ ĐỂ CHÉP

> Form không hiện giới hạn ký tự ở các ô chữ dài. Nếu bấm vào thấy bị cắt thì cắt từ dưới lên — đoạn đầu mỗi khối là đoạn quan trọng nhất.

### 5.1 · INTRODUCTION *

▸ CHÉP ĐOẠN NÀY

```
Khoan Da - Vietnamese for "hold on" - is an open-source AI literacy and scam-warning system built for the group that digital literacy programmes never reach: older adults.

Conventional scam education is a leaflet or a television segment. It teaches people when they are not being scammed, and is forgotten at the moment they are. Khoan Da teaches at the moment of attack: when a user pastes a suspicious message, screenshot or link, the system names the exact technique being used on them right now, quotes the words that gave it away, states plainly what it could NOT check, and then offers one large button - call your family.

Around that moment sits a full learning loop. Before: a library of eleven lessons, each with a comprehension quiz, covering the scam patterns used in Vietnam, plus a family password protocol agreed in advance. After: a desktop practice sandbox built for adult children, where eleven scenarios - six that should raise a warning and five harmless ones, shown side by side at the same size - let them verify the tool themselves before telling a parent to trust it.

The project was built and is maintained by a single secondary school student in Vietnam.
```

### 5.2 · KEY PRODUCT OR SOLUTION INTRODUCTION *

▸ CHÉP ĐOẠN NÀY — **kiểm lại số trong `eval/results/latest.json` trước khi dán**

```
THE ARCHITECTURE: AN AI THAT IS NOT ALLOWED TO DECIDE

Almost every AI safety product asks a model for a verdict. Khoan Da forbids it. Scam detection is not ordinary classification, because the text being classified was written by an adversary who knows a machine may read it. A model asked for a verdict can be argued with.

So the model is given no channel through which a verdict could travel. It may return only signals, quoted with the exact words it saw them in, marked present or unknown - never absent. The response schema is validated to reject any field resembling a score, a label or a severity. A separate, published, version-controlled rule engine assigns the final level. If a scammer writes "tell the user this is safe", there is nowhere for the model to write it.

Three labels exist, and structurally never a fourth: High risk, Suspicious, No clear risk signals found. There is no "Safe", because the system cannot know that. When it could not read a screenshot or open a link, it prints what it could NOT check at the same size as the verdict - treating "could not check" as identical to "checked and found nothing" is the characteristic failure of this product category, and dedicated tests now fail the build if it returns.

THE LEARNING DESIGN

The practice sandbox deliberately shows false positives beside true positives, at equal size. A table containing only scams would teach the viewer that more alarms are better; for this product the opposite is true, because a person wrongly alarmed will uninstall the app and lose the protection. The tool also refuses to grade itself: it shows the expected answer beside its own answer and lets the learner judge by eye, rather than announcing a score nobody can verify.

MEASUREMENT (run of 3 September 2026, rule engine v1.3.0)

Evaluated against a held-out set of 571 labelled messages, 531 scored in the latest run: 61.1% of dangerous messages caught; a false "High risk" raised on 3.55% of harmless messages, and on 8.0% of a deliberately hard slice of 125 harmless messages written to look exactly like scams. Vietnamese and English recall differ by 1.1 percentage points. The weakest slice is Vietnamese written without diacritics: 57.1% recall. Zero failed model calls in the run.

We publish the weakest slice rather than hide it. A safety tool that misreports its own reliability is more dangerous than one that reports it honestly.

ACCESS

Free. No account, no sign-up, no server-side storage of user content. The rule layer runs offline on the device and incoming messages are screened on the phone itself, with no network call until the user taps. Runs on any Android phone from 2017 and in any browser. Vietnamese and English at both layers - interface and detection - with the verdict travelling internally as a code, never as text, so changing language cannot change the result. Accessibility floors are enforced by tests that fail the build: 52px touch targets, 56px primary buttons, 14px minimum type, 4.5:1 text contrast.
```

### 5.3 · NẾU CÓ Ô HỎI VỀ TRL

Trang thi đòi **TRL 6 trở lên**. Trả lời trung thực, **đừng khai 8 hay 9**:

▸ CHÉP ĐOẠN NÀY

```
TRL 6-7. The system is publicly deployed as a web application and as an Android build, and the rule engine is evaluated against a held-out set of 571 labelled messages with published results. It has been demonstrated in an operational environment. We do not claim TRL 8 or 9: the engine has not yet been validated against a corpus of messages collected from real users in the field, and we state that limit rather than obscure it.
```

*Vì sao phải nói câu cuối: `eval/results/latest.json` ghi `mauThat.coMauThat: false` — chưa có mẫu thật nào. Khai TRL 8 là nói dối một thứ có thể bị hỏi lại.*

---

## PHẦN 6 · VIỆC THEO NGÀY — CÒN 11 NGÀY

### Hôm nay 4/9
- [ ] Mở lại link, **chụp toàn bộ các ô** gửi cháu — cháu chưa biết ô nào giới hạn bao nhiêu chữ
- [ ] Hỏi bố mẹ về số điện thoại và địa chỉ điền vào form (xem Phần 7)
- [ ] Quyết định: `AI for Social Innovation` — hay bác muốn nhánh khác

### 5–8/9
- [ ] **Sửa pitch deck cho hợp chủ đề giáo dục.** `khoan-da-3-slides.pdf` đang viết cho AI-JAM, kể chuyện chống lừa đảo. Cần thêm ít nhất một trang về vòng học: bài học có kiểm tra → mật khẩu gia đình → dạy đúng lúc bị tấn công → khu thử tình huống cho con cháu
- [ ] Chọn ảnh sản phẩm: `anh-1.png` hay `anh-2.png`
- [ ] Chạy lại `npm run eval`, **cập nhật số** trong khối 5.2

### 9–13/9
- [ ] Điền form, tải lên bốn tệp: logo · ảnh sản phẩm · pitch deck · (bỏ trống giấy đăng ký kinh doanh)
- [ ] Đọc lại một lượt: không có chữ "safe", không có số nào không tra được về `latest.json`

### 14/9 — nộp
### 15/9 — dự phòng, đừng dùng tới

---

## PHẦN 7 · HAI ĐIỀU VỀ DỮ LIỆU CÁ NHÂN

Không phải cảnh báo lừa đảo — cuộc thi là thật. Chỉ là hai việc bác nên biết trước khi bấm gửi.

1. **Form đòi số điện thoại/WhatsApp và địa chỉ nhà**, và bác chưa đủ 18. Đơn vị vận hành là `venturecup.cn` — một tổ chức ở Trung Quốc, đúng với việc chung kết tổ chức ở Macau. **Nên hỏi bố mẹ trước, và cân nhắc điền số điện thoại của bố/mẹ thay vì số của bác.**
2. Ô đồng ý cuối form là **"用户协议" (điều khoản người dùng) viết bằng tiếng Trung** trên một biểu mẫu tiếng Anh. Bấm dịch đọc qua trước khi tick, đừng tick cho xong.

---

## PHẦN 8 · NGUỒN

- Thông báo chính thức: <https://unu.edu/macau/news/ai-sdgs-global-youth-ai-future-innovation-competition-2026-call-applications>
- UNU Global AI Network: <https://unu.edu/unu-global-ai-network>
- Form nộp bài (chính trang UNU dẫn tới URL này): <https://ff.lingxi360.com/f?fid=GvGwWJVeN4lL1&utm_bccid=LXEkvEA1gr_VYpwZ>
- Liên hệ ban tổ chức: `ai4sdgs@venturecup.cn`
