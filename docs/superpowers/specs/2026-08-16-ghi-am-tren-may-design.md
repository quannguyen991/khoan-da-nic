# Ghi âm và phiên âm trên máy — thiết kế

Ngày 16/8/2026 · Trạng thái: chờ duyệt · Liên quan: §HĐ, §4.2, §4.3, §4.4, §6.7, §6.9, §12

---

## 1. Vấn đề

Khoan Đã hiện chỉ đọc được chữ và ảnh. Ba việc người dùng muốn làm mà chưa làm được:

1. Đang nghe cuộc gọi đáng ngờ → bật loa ngoài, bấm ghi qua micro.
2. Có sẵn đoạn ghi âm (người thân gửi, app khác ghi) → tải lên.
3. Nói vào máy thay vì gõ chữ — người già gõ chữ khó.

**Đo được 16/8/2026** (`node scripts/do-router-nghe-duoc.js`): router đang cấu
hình có **0/1 đường phiên âm**. `/audio/transcriptions` tồn tại nhưng không model
nào chạy (thử 13 tên); ở tầng hỏi thẳng, `gpt-5.4` và `gpt-5.4-mini` trả đúng chữ
`KHONG` với cả ba hình dạng payload. Tức phía máy chủ **không nghe được**.

Đây là lý do thiết kế đi đường trên máy, không phải vì sở thích kiến trúc.

## 2. Phạm vi

**Trong phạm vi:** ba ca dùng ở trên; plugin Kotlin phiên âm bằng whisper.cpp;
mã `chuaKiem` mới; onboarding tải model; hàng rào test.

**Ngoài phạm vi — và ghi rõ là ngoài phạm vi:**

- ❌ **Nghe thẳng luồng cuộc gọi.** Android 10+ chặn ghi `VOICE_CALL` cho app bên
  thứ ba. `pipeline.js:333` ép cứng `chua_nghe_duoc_cuoc_goi` vào `chuaKiem`
  **không ngoại lệ** (§15.9.1), và thiết kế này **không gỡ dòng đó**. Kể cả khi
  bác ghi được qua loa ngoài, Khoan Đã vẫn không nghe được cuộc gọi — nó nghe
  được cái micro đặt cạnh cuộc gọi. Hai việc khác nhau, và Phiếu tin cậy phải
  nói đúng cái thứ hai.
- ❌ Phiên âm trên đám mây. Giọng người dùng không rời khỏi máy (§6.9, §12).
- ❌ Viết lại giao diện bằng Kotlin/Compose. Giữ React + Capacitor (§12).
- ❌ Ghi âm nền / ghi âm tự động. Chỉ ghi khi người dùng chủ động bấm.

## 3. Kiến trúc

Ghi âm là **nguồn đầu vào thứ sáu**, không phải tính năng riêng. Nó đi vào đúng
`/api/analyze` mà văn bản và ảnh đang đi.

```
[Kotlin] KhoanDaAudio          ghi micro / nhận file  →  WAV 16kHz mono
   ↓ whisper.cpp (JNI, trên máy)
   ↓ { vanBan, doTinCay, doTinCayThapNhat, ghiAmFailed, maLoi }
[native.ts] phienAmGhiAm()     ← cầu 'KhoanDa' đã có sẵn
   ↓
POST /api/analyze  { vanBan, ghiAm, ghiAmConfidence, ghiAmFailed, ghiAmMaLoi }
   ↓
pipeline.js → unreadableInputFloor() → decision-engine → §HĐ
```

### 3.1 Bốn biên không được thủng

1. **Kotlin không biết gì về rủi ro.** Plugin trả chữ + độ tin cậy. Không
   keyword, không `emit_alert`, không `if (text.contains("OTP"))`. Đúng dòng
   cảnh báo đã có sẵn ở đầu `src/native.ts`: thêm một dòng `if` là tạo đường
   quyết định thứ hai, §12 cấm.
2. **Chữ phiên âm vào cùng cửa với `vanBan`.** Không có nhánh phân tích riêng
   cho âm thanh. Mọi luật, mọi override, mọi test hiện có áp dụng nguyên xi.
3. **Không có native thì im lặng thoái lui.** Trình duyệt và PWA vẫn chạy —
   `layCau()` trả `null`, nút ghi âm không hiện, không ném lỗi (§6.7).
4. **Âm thanh không rời khỏi máy và bị xoá sau khi phiên âm.** Giữ nguyên
   `allowBackup="false"` đã có trong manifest.

### 3.2 Bề mặt tấn công của thân yêu cầu

`xuLyPhanTich` trong `server.js` **cố ý chỉ rút `vanBan` và `anh`**, không trải
`...req.body`, vì trường tự khai từng là đường hạ mức (`verifiedChannel`,
`verifiedRelationship`). Thêm bốn trường ghi âm phải giữ đúng tính chất đó:

| Trường | Chiều tác động | Người gọi bịa được gì |
|---|---|---|
| `ghiAm: true` | thêm `ghi_am` vào `daKiem` | không hạ mức — `daKiem` không vào công thức điểm |
| `ghiAmFailed: true` | thêm `chuaKiem` | chỉ TĂNG cảnh giác |
| `ghiAmConfidence` thấp | thêm `chuaKiem` | chỉ TĂNG cảnh giác |
| `ghiAmMaLoi` | chọn mã `chuaKiem` nào | chỉ đổi mã, không đổi điểm |

**Không trường nào trong bốn trường này hạ được mức.** Đây là tính chất bắt buộc,
không phải quan sát tình cờ — hàng rào ở §6 dưới đây.

`ghiAmConfidence` phải bị kẹp về `[0,1]`; giá trị ngoài khoảng hoặc không phải số
⇒ coi như **hỏng**, không phải coi như tốt.

### 3.3 Chỗ hỏng sẵn phải sửa cùng lượt

`src/analysis/trust-receipt-v2.js:16` — bảng `NGUON` chỉ có `van_ban`, `anh_ocr`,
`url`. Dòng 48 lọc `daKiem` theo bảng đó. Nhưng `pipeline.js` đang đẩy vào
`daKiem` ba mã khác: `ghi_am` (dòng 52), `thong_bao_tin_nhan` (67),
`bo_hoi_nhanh` (83). **Cả ba bị Phiếu tin cậy vứt im lặng.**

Bảng `GIOI_HAN` đã có `khong_nghe_duoc_ghi_am` — đường hỏng đã nối, đường chạy
được thì chưa. Phiếu đang nói thiếu về thứ nó đã kiểm.

Chiều sai này **an toàn hơn** chiều §4.3 (khai ít hơn thực tế, không phải nhiều
hơn), nên không phải lỗi khẩn. Nhưng nó khiến Phiếu tin cậy nói sai, và ghi âm
sẽ rơi thẳng vào cùng cái hố nếu không sửa trước. Sửa: bổ sung ba mã vào `NGUON`,
kèm test chặn lệch giữa `NGUON` và `daKiem` mà `pipeline.js` sinh ra.

## 4. Hợp đồng §HĐ

**Không đổi hình dạng phản hồi.** Bảy trường của §HĐ giữ nguyên.

Hợp đồng **đã có sẵn** `daKiem: ['ghi_am']` và `chuaKiem:
['khong_nghe_duoc_ghi_am']` → giới hạn `ghi_am_khong_giai_ma_duoc`. Đường chạy
được không phải thêm mã nào.

Thêm **ba mã `chuaKiem`**, vì whisper-trên-máy đẻ ra ba kiểu hỏng khác nhau:

| Mã mới | Khi nào | Giới hạn ở Phiếu |
|---|---|---|
| `chua_tai_xong_model_nghe` | model chưa tải / tải hỏng | `chua_co_bo_nghe_tren_may` |
| `ghi_am_khong_co_tieng_noi` | ghi được nhưng không có giọng người | `ghi_am_khong_co_tieng_noi` |
| `chi_nghe_duoc_phan_dau` | đoạn ghi dài, bị cắt | `chi_doc_duoc_phan_dau` (đã có) |

Ba mã riêng chứ không gộp vào `khong_nghe_duoc_ghi_am`. §4.3 nói đúng chuyện đó:
gộp lại thì Phiếu nói "không giải mã được" trong khi thật ra là "bác chưa tải bộ
nghe" — hai việc khác nhau, cách xử lý khác nhau, và một trong hai bác tự sửa
được.

Cả ba mã phải khai vào `public/config/ma-hop-dong.json` và `scripts/xuat-hop-dong.js`.

## 5. Ngưỡng §4.3 — hai tầng

```js
const NGUONG_GHI_AM = 0.5;   // đối xứng với NGUONG_OCR đã có
```

⚠️ **Đơn vị.** whisper.cpp trả `avg_logprob` — một **log-xác suất, luôn âm**
(thường −0,1 đến −1,5). So thẳng nó với `0.5` là so hai đơn vị khác nhau và sẽ
luôn ra "hỏng". Plugin phải chuẩn hoá **ngay tại Kotlin** trước khi trả sang JS:

```
doTinCay = exp(avg_logprob)        // → [0,1], khớp thang của NGUONG_OCR
```

`exp(−0,69) ≈ 0,5`, nên ngưỡng 0,5 tương đương `avg_logprob ≈ −0,69`. JS chỉ
thấy thang `[0,1]` và không bao giờ phải biết logprob là gì.

whisper.cpp trả `avg_logprob` và `no_speech_prob` theo **từng đoạn**. Sàn đọc cả
hai, ở hai tầng:

- **Tầng đoạn** — bất kỳ đoạn nào dưới ngưỡng ⇒ bật `khong_nghe_duoc_ghi_am`,
  **kể cả khi trung bình cả bài vẫn cao**.
- **Tầng bài** — `no_speech_prob` cao đều ⇒ `ghi_am_khong_co_tieng_noi`.

**Vì sao phải có tầng đoạn.** Ca nguy hiểm nhất không phải phiên âm hỏng hẳn, mà
là phiên âm **hỏng một câu**. Whisper nghe được 90% đoạn ghi nhưng nuốt đúng câu
*"chuyển sang tài khoản an toàn"* thì bản chép còn lại trông sạch sẽ, luật cứng
không thấy gì, màn hình hiện "Chưa thấy dấu hiệu rủi ro". Đó chính xác là con bug
§4.3 mô tả, chỉ đổi nguồn. **Lấy trung bình cả bài sẽ che mất nó** — vì thế
plugin phải trả `doTinCayThapNhat`, không chỉ `doTinCay`.

Sàn **chỉ được làm tăng cảnh giác**. Ghi âm hỏng không bao giờ kéo tụt kết luận
đã có từ văn bản người dùng gõ. Đã có test chặn:
`test/unreadable-input-floor.test.js:50`.

### 5.1 Hỏng một phần là `daKiem` VÀ `chuaKiem` cùng lúc

`unreadableInputFloor()` hiện dùng `if/else` cho ghi âm (`pipeline.js:50-53`):
hoặc `ghi_am` vào `daKiem`, hoặc `khong_nghe_duoc_ghi_am` vào `chuaKiem`. **Nhị
phân này không đủ cho whisper.**

Ca thường gặp nhất là *nghe được phần lớn, hụt một đoạn*. Lúc đó cả hai đều đúng:
đã phiên âm được (nên `daKiem` phải có `ghi_am`, nếu không Phiếu tin cậy khai
thiếu — đúng lỗi §3.3), **và** có đoạn không nghe được (nên `chuaKiem` phải có
`khong_nghe_duoc_ghi_am`).

Nên nhánh ghi âm đổi từ `if/else` sang **hai điều kiện độc lập**:

```
có chữ phiên âm dùng được   ⇒ daKiem += 'ghi_am'
có đoạn dưới ngưỡng / lỗi   ⇒ chuaKiem += <mã tương ứng>
```

Hỏng hoàn toàn ⇒ chỉ nhánh dưới chạy, giống hành vi cũ. Đây **không phải** ngoại
lệ của §4.3 mà là dạng đầy đủ của nó: "đã kiểm được một phần" là trạng thái thứ
ba, và gộp nó về một trong hai đầu đều nói sai.

## 6. Trạng thái hỏng đầy đủ và hàng rào test

Mỗi trạng thái hỏng phải có **một ca test**, đúng ràng buộc thường trực ở
`src/analysis/pipeline.js:32`.

| # | Trạng thái | Mã `chuaKiem` |
|---|---|---|
| 1 | model chưa tải xong / tải hỏng | `chua_tai_xong_model_nghe` |
| 2 | whisper chạy nhưng có đoạn dưới ngưỡng | `khong_nghe_duoc_ghi_am` |
| 3 | whisper chạy, không có giọng người | `ghi_am_khong_co_tieng_noi` |
| 4 | đoạn ghi vượt trần thời lượng, bị cắt | `chi_nghe_duoc_phan_dau` |
| 5 | whisper ném lỗi / hết bộ nhớ | `khong_nghe_duoc_ghi_am` |
| 6 | file tải lên sai định dạng, không giải mã được | `khong_nghe_duoc_ghi_am` |
| 7 | `ghiAmConfidence` không phải số hoặc ngoài `[0,1]` | `khong_nghe_duoc_ghi_am` |
| 8 | **hỏng một phần** — nghe được phần lớn, hụt một đoạn | `khong_nghe_duoc_ghi_am` **và** `daKiem` vẫn có `ghi_am` (§5.1) |

**Quyền micro bị từ chối KHÔNG nằm trong bảng này** — và đó là chủ ý. Từ chối
quyền nghĩa là **không có đầu vào ghi âm nào cả**, nên không có gì để khai vào
sàn; giao diện chỉ đơn giản không có nút ghi. Cái phải chặn là ca ngược lại:
giao diện gửi `ghiAm: true` kèm chữ rỗng sau khi ghi hỏng — đó đúng là cái bẫy
§4.3, và ca test #7 chặn nó.

**Bổ sung vào test có sẵn:**

- `test/unreadable-input-floor.test.js` — bảy ca trên.
- `test/unchecked-not-safe.test.js` — ghi âm hỏng không bao giờ ra
  `CHUA_THAY` một mình mà không kèm `chuaKiem`.

**Test mới:**

- `test/ghi-am-khong-ha-muc.test.js` — chạy bộ mẫu, mỗi mẫu hai lượt (có và
  không có bốn trường ghi âm). Mức lượt sau **luôn ≥** lượt trước. Đây là hàng
  rào cho §3.2.
- `test/nguon-da-kiem-day-du.test.js` — mọi mã `pipeline.js` đẩy vào `daKiem`
  phải có trong `NGUON` của `trust-receipt-v2.js`. Chặn tái diễn §3.3.

## 7. Onboarding tải model

Model **base** (~140MB) tải lúc **cài đặt / mở app lần đầu**, không tải lúc bấm
ghi. Lý do: người đang bị kẻ lừa đảo thúc trên điện thoại không có 140MB thời
gian để chờ. Cùng lập luận với §6.10 — 60 giây đã mất thì không lấy lại được.

Ràng buộc màn hình tải:

- **Không chặn đường kiểm tin nhắn.** Bác phải gõ/dán được văn bản ngay trong lúc
  model đang tải. §6.7 — giao diện không bao giờ trắng vì một tính năng phụ.
- **Bỏ qua được**, và bỏ qua rồi vẫn tải lại được sau. Bỏ qua ⇒ nút ghi âm hiện
  trạng thái "chưa có bộ nghe", không biến mất im lặng.
- **Nói rõ dung lượng và khuyên dùng Wi-Fi.** Không nói "đang chuẩn bị" chung chung.
- Tải hỏng ⇒ nói hỏng, cho thử lại. Không âm thầm chuyển sang trạng thái "sẵn sàng".

Vì APK không nhét model (Play Store trần 200MB, và không nên có app 200MB cho
người già), trạng thái "chưa có model" là trạng thái **bình thường và lâu dài**,
không phải lỗi tạm. Mọi màn hình phải chịu được nó.

## 8. Tiếp cận §4.4

Nút ghi âm là **nút chính** → `--touch-target-primary`, tức `max(56px, 3.5rem)`.

- Không `white-space: nowrap` (`test/no-nowrap-on-controls.test.js` — danh sách nợ
  chỉ được NHỎ ĐI).
- Mọi chuỗi lấy từ catalog i18n, kể cả ARIA label. Không mã cứng (§4.1).
- Trạng thái đang ghi phải nhìn thấy được, không chỉ dựa vào màu (tương phản 3:1,
  `test/non-text-contrast.test.js`).
- Tiếng Việt dài hơn tiếng Anh ~30%; nút "Ghi âm cuộc gọi" / "Record the call"
  không được thiết kế vừa khít chữ (§4.5).

## 9. Câu chữ — §11

- ❌ Không viết "đã nghe cuộc gọi". Viết "đã nghe đoạn ghi âm bác gửi".
- ❌ Không viết "không nghe thấy lời đe doạ" — đó là khẳng định VẮNG MẶT, đúng
  câu §11 cấm. Phiếu chỉ liệt kê thứ ĐÃ THẤY và thứ CHƯA KIỂM ĐƯỢC.
- ❌ Không hiện `doTinCay` như xác suất lừa đảo (§6.4).
- ❌ Không trách người dùng khi ghi âm hỏng — không "bác ghi chưa rõ".

## 10. Thứ tự làm

1. Sửa `NGUON` trong `trust-receipt-v2.js` + `test/nguon-da-kiem-day-du.test.js`.
   Làm trước vì ghi âm sẽ rơi vào cùng cái hố.
2. Ba mã `chuaKiem` mới vào `ma-hop-dong.json`, `xuat-hop-dong.js`, `GIOI_HAN`.
3. `unreadableInputFloor()` — bảy ca, TDD, test trước.
4. `test/ghi-am-khong-ha-muc.test.js`.
5. Nới `xuLyPhanTich` nhận bốn trường ghi âm, giữ nguyên nguyên tắc không trải
   `req.body`.
6. Plugin Kotlin `KhoanDaAudio` + whisper.cpp JNI.
7. `phienAmGhiAm()` trong `native.ts`.
8. Giao diện: nút ghi, tải file, onboarding tải model.
9. Ca 3 (nói thay vì gõ) — dùng `SpeechRecognizer` sẵn có của Android, không
   dùng whisper. Nó là ô nhập liệu, không phải nguồn phân tích.

Bước 1–5 chạy được và test được **trước khi có một dòng Kotlin nào**. Đó là chủ ý:
sàn §4.3 phải đứng trước khi nguồn đầu vào tới.
