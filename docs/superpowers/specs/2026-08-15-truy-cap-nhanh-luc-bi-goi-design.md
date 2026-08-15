## §15 — TRUY CẬP NHANH LÚC ĐANG BỊ GỌI / ĐANG NHẬN TIN

> Khối này trả lời đúng một câu hỏi: **lúc bác đang nghe kẻ lừa đảo nói, làm sao
> bác chạm được tới Khoan Đã?** Mọi tính năng trước đó đều giả định bác đã tự mở
> app — mà người tự mở app kiểm tra thì đã thoát khỏi trạng thái bị dẫn dắt rồi.
> Phần khó nhất đã xong trước khi app kịp giúp gì.
>
> ⚠️ Đọc §15.5 trước khi viết bất kỳ dòng chữ nào cho người dùng đọc. Nửa số ý
> tưởng ở khu vực này là **không làm được**, và hứa nhầm thì tệ hơn không có.

---

### 15.1 Ba chỗ chặn được, không phải một

```
Trước đó hàng tháng   →   Lúc đang gọi   →   Lúc chuyển tiền
   hạ hạn mức             §15 này            xem tên người nhận
   tập nghe               khó nhất            "có ai dặn nói dối
   phản xạ "Khoan đã"                          ngân hàng không?"
```

§15 chỉ lo khúc giữa — khúc **khó nhất và đắt nhất**. Đừng dồn hết công vào đây
rồi bỏ hai khúc kia, vì hai khúc kia **không cần bác nhớ ra app**.

---

### 15.2 Bốn bề mặt truy cập nhanh

Xếp theo mức **với tới được** trong lúc điện thoại đang áp vào tai:

| # | Bề mặt | PWA | Native | Số cử chỉ |
|---|---|---|---|---|
| A | Nút gắn trong thông báo | ⚠️ một phần | ✅ | kéo xuống → chạm |
| B | Ô trong bảng gạt nhanh | ❌ | ✅ | kéo xuống ×2 → chạm |
| C | **Bong bóng nổi + menu bật nhanh** | ❌ | ✅ | **chạm** |
| D | Phủ kín màn hình | ❌ | ✅ | tự hiện |

**C là bề mặt tốt nhất** — một cử chỉ, và nó nằm ngay trên màn hình cuộc gọi,
không phải kéo gì cả. Nhưng nó chỉ có ở bản native.

**Bản PWA chỉ có A, và A ở PWA yếu:** thông báo web **nằm lại được** trên thanh
thông báo vô thời hạn, nhưng **không khoá được** — vuốt một cái là mất, và không
có cách đáng tin nào tự dựng lại (`periodicSync` hỏng đúng với nhóm ít mở app).
Dựng lại mỗi lần mở app là đường duy nhất chắc chắn.

⚠️ **Không được dùng `notificationclose` để dựng lại ngay.** Vuốt đi mà nó mọc
lại là người dùng vào tắt sạch thông báo — mất luôn mọi thứ khác.

---

### 15.3 Bong bóng nổi + menu bật nhanh — thiết kế chi tiết

#### 15.3.1 Trạng thái thu gọn

- Chỉ xuất hiện **khi có cuộc gọi đang diễn ra**. Hết cuộc gọi thì biến mất.
- Hình khiên, **72px**, dính mép màn hình, kéo được, nửa trong suốt.
- **Không có chữ ở trạng thái thu gọn.** Chữ nhỏ trên bong bóng là chữ không ai
  đọc được — nó chỉ làm bong bóng to ra và che mất màn hình cuộc gọi.
- Giữ 1 giây → ẩn hết cuộc gọi này (§4.6, xem 15.3.4).

#### 15.3.2 Trạng thái mở

Chạm → mở ra dọc theo mép, **không** che số điện thoại và **không** che nút cúp
máy của hệ thống.

```
┌──────────────────────────────────┐
│ Khoan Đã không nghe được          │  ← §HĐ luật 3
│ cuộc gọi này.                     │     CÙNG cỡ chữ với mọi
│                                   │     dòng bên dưới
├──────────────────────────────────┤
│  🔴  HỌ ĐANG GIỤC TÔI            │  104px
├──────────────────────────────────┤
│  📞  GỌI CON                      │  104px
├──────────────────────────────────┤
│  🔊  ĐỌC TO LỜI TỪ CHỐI          │  104px
├──────────────────────────────────┤
│      Tôi ổn, ẩn đi                │  ≥52px
└──────────────────────────────────┘
```

**Thứ tự là cố ý.** Việc khẩn nhất trên cùng. Lối ra dưới cùng, nhỏ hơn nhưng
**không được nhỏ hơn 52px** (§4.4).

Ràng buộc §4.4 áp nguyên vào lớp phủ: `--touch-target-primary` là
`max(56px, 3.5rem)`, ba ô chính đặt **104px** theo biến thể siêu đơn giản §9.7.
`white-space: nowrap` **cấm** trên cả bốn ô — tiếng Việt dài hơn tiếng Anh ~30%,
"ĐỌC TO LỜI TỪ CHỐI" sẽ xuống hai dòng ở khổ 320px và **phải được phép** xuống.

`line-height` **không dưới 1.25** — dấu tiếng Việt xếp cả trên lẫn dưới.

#### 15.3.3 Ba nút làm gì

**🔴 HỌ ĐANG GIỤC TÔI** → mở bộ hỏi nhanh, **mỗi màn một câu**, chữ cực lớn, chỉ
CÓ / KHÔNG, **không bàn phím** (tay run, đang áp máy vào tai):

| Câu hỏi trên màn | Tín hiệu bật |
|---|---|
| Họ bảo bác **đừng cúp máy**? | `MAN_KEEP_CALL_ACTIVE` |
| Họ bảo **đừng nói với ai**? | `MAN_SECRECY` |
| Họ nói bác **sắp bị bắt / bị phạt**? | `MAN_FEAR_THREAT` |
| Họ bảo **chuyển tiền / rút tiền**? | `FIN_TRANSFER_REQUEST` |
| Họ xin **mã trong tin nhắn**? | `CRED_OTP_SHARE` |
| Họ nhắc **"tài khoản an toàn"**? | `FIN_SAFE_ACCOUNT` |
| Họ bảo **cài ứng dụng / bấm link**? | `DEV_INSTALL_APK_UNKNOWN` |
| **Có ai dặn bác nói gì với ngân hàng chưa?** | `MAN_SECRECY` + ghi chú vụ việc |

Câu cuối là câu mạnh nhất trong bảng: **không có giao dịch tử tế nào cần nói dối
ngân hàng.** Đặt nó ở vị trí thứ hai, không phải cuối.

⚠️ **Không thêm override thứ 11.** Bộ luật hiện có đã bắt trọn: OTP + chuyển
tiền là `CO-01`; "tài khoản an toàn" là `CO-03`; bí mật + đe doạ + chuyển tiền là
`CO-05`; cài app lạ là `CO-02`. Đây là **kênh đầu vào mới**, không phải mức can
thiệp thứ sáu.

**📞 GỌI CON** → `tel:` tới liên hệ tin cậy đã đặt trước. Nếu chưa đặt thì hiện
*"Bác chưa lưu số người thân"* + nút lưu — **không được im lặng**.

**🔊 ĐỌC TO LỜI TỪ CHỐI** → phát ra tiếng:

> *"Đây là hệ thống bảo vệ Khoan Đã. Chủ máy sẽ không đọc mã OTP và không chuyển
> tiền trong cuộc gọi này."*

⚠️ **Bên kia CHỈ nghe được nếu đang bật loa ngoài.** Áp máy vào tai thì chỉ bác
nghe. Nên trước khi phát, màn hình hiện một dòng: *"Bác bấm loa ngoài để họ nghe
được"* — và **không được viết bất kỳ chữ nào ngụ ý bên kia chắc chắn nghe thấy.**

Giá trị vẫn còn nguyên kể cả khi bên kia không nghe: một **giọng nói** dặn bác
làm gì thì dễ theo hơn chữ trên màn, lúc đang hoảng.

Câu chữ này không hứa gì, không tố ai, không xưng là đang giám sát cuộc gọi.

#### 15.3.4 Lối ra — §4.6

"Tôi ổn, ẩn đi" ẩn bong bóng **hết cuộc gọi này**, không phải vĩnh viễn.

Mỗi lần bấm là **một mẫu dữ liệu báo động giả** — ghi lại để hiệu chỉnh, giống
hệt `toi_on_khong_co_gi_nguy_hiem` ở `intervention-ladder.js`.

⚠️ Nếu bong bóng hiện mà không ẩn được, người dùng sẽ tắt quyền vẽ đè — và mất
luôn D. Lối ra **không phải phép lịch sự, nó là điều kiện sống của tính năng.**

---

### 15.4 Đọc thông báo tin nhắn — đường tự động DUY NHẤT

`NotificationListenerService` (native). Người dùng bật một lần trong
*Cài đặt → Thông báo → Quyền truy cập thông báo*.

Tin nhắn lừa đảo vừa rơi vào máy → app đọc → chấm điểm → cảnh báo.
**Bác không phải làm gì cả.** Đây là chỗ duy nhất trong toàn bộ thiết kế mà app
tự chạy tới chỗ bác, thay vì chờ bác nhớ ra nó.

#### 15.4.1 Bốn chỗ hỏng — PHẢI khai vào `chuaKiem`

| Chỗ hỏng | Mã |
|---|---|
| Tin dài, thông báo bị cắt | `chi_doc_duoc_mot_phan_tin` |
| Người dùng đang mở sẵn Zalo ⇒ không có thông báo | *(không thấy gì — không được kết luận gì)* |
| App chỉ hiện "Bạn có tin nhắn mới" | `thong_bao_khong_co_noi_dung` |
| Thông báo bị vuốt trước khi đọc | `thong_bao_da_bi_xoa` |

⚠️ **§4.3 — THÊM NGUỒN ĐẦU VÀO MỚI THÌ THÊM CA VÀO `unreadableInputFloor()`.**
Đây là nguồn thứ tư (sau văn bản, ảnh, URL). Ba trong bốn chỗ trên là *"không
đọc được"*, và **không đọc được ≠ đọc rồi, không thấy gì**. Im lặng ở đây là
đúng con bug đã xuất hiện ba lần trong cùng một ngày.

#### 15.4.2 Riêng tư — bốn ràng buộc chốt cứng từ dòng code đầu

Quyền này cho app thấy **tin nhắn riêng của bác với con cháu**. Đây là thứ nặng
nhất trong cả sản phẩm.

1. **Xử lý hoàn toàn trên máy.** Không nội dung nào rời khỏi điện thoại. Không
   ngoại lệ, không "chỉ gửi lúc lỗi", không telemetry.
2. **Chỉ đọc tin từ người KHÔNG có trong danh bạ.** Cắt phần lớn nhiễu, và để
   tin nhắn gia đình yên.
3. **Không lưu.** Đọc, chấm, quên. Chỉ giữ lại mã tín hiệu, không giữ chữ.
4. **Nói đủ ba câu trên ngay tại màn xin quyền**, cỡ chữ bình thường, không phải
   dòng mờ dưới cùng.

Làm ẩu chỗ này thì một app chống lừa đảo trở thành thứ đáng ngại hơn kẻ lừa đảo.

#### 15.4.3 Cảnh báo hiện ra trông thế nào

```
🔴  TIN NHẮN VỪA TỚI CÓ DẤU HIỆU LỪA ĐẢO
    · giả danh ngân hàng
    · đòi mã trong tin nhắn

    ĐỪNG BẤM VÀO ĐƯỜNG LINK

    [ Xem vì sao ]      [ Tôi ổn ]
```

**≤3 nhãn dấu hiệu**, đúng như ràng buộc cảnh báo ở §14.8. Không hiện lại nguyên
văn tin nhắn trong cảnh báo.

---

### 15.5 ĐƯỢC / KHÔNG ĐƯỢC — đọc trước khi viết chữ

| | Được | Ghi chú |
|---|---|---|
| Nghe âm thanh cuộc gọi | ❌ | **không có quyền để xin** — xem 15.5.1 |
| Ghi âm cuộc gọi | ❌ | như trên |
| Chặn cuộc gọi **đến** | ⚠️ được, **nhưng không làm** — 15.5.2 |
| Chặn cuộc gọi **đi** | ❌ | Android không cho |
| Tự cúp cuộc gọi đang nói | ⚠️ | phải làm **app Gọi điện mặc định** |
| Biết có cuộc gọi + số nào | ✅ | `CallScreeningService` |
| Nút gắn trong thông báo | ✅ | |
| Ô bảng gạt nhanh | ✅ | `TileService` |
| Bong bóng nổi / phủ màn hình | ✅ | `SYSTEM_ALERT_WINDOW` |
| Phủ lên **app ngân hàng** | ❌ | ngân hàng tự chặn — 15.5.3 |
| Đọc thông báo tin nhắn | ✅ | **trụ chính** |
| Đọc SMS trực tiếp | ⚠️ | Play duyệt rất khó |
| Chặn giao dịch ngân hàng | ❌ | **không app nào làm được** |

#### 15.5.1 Vì sao không nghe được cuộc gọi

Không phải "chưa xin quyền" mà là **không có quyền để xin**:

- Quyền cần là `CAPTURE_AUDIO_OUTPUT`, thuộc loại **`signature|privileged`** —
  chỉ cấp cho app ký bằng khoá hãng hoặc cài sẵn trong ROM. **Nó không bao giờ
  hiện thành hộp thoại xin quyền.** Người dùng có muốn cho cũng không có nút.
- Từ Android 10, khung âm thanh chặn thẳng app bên thứ ba lấy luồng thoại.
- Đường lách qua **Trợ năng**: chính sách Play cấm rõ từ 2022. Dùng là **gỡ app**.
- iOS: không, kể cả một phần trăm.

Còn **một chỗ chưa đo**: bật loa ngoài thì mic có bắt được tiếng trong phòng
không — cái này **khác nhau theo hãng máy**. Kiểm 15 phút trên máy thật trước
khi tin, và **đừng xây gì phụ thuộc vào nó**.

#### 15.5.2 Vì sao chặn được mà không chặn

§12 đang cấm *"tự hứa chặn cuộc gọi"*. **Giữ nguyên luật đó** — và không phải vì
lý do đạo đức, mà vì chặn cuộc gọi vốn dĩ **không đáng làm**:

- Chặn theo **số** — mà kẻ lừa đảo đổi SIM mỗi ngày, phần lớn còn dùng **số giả**.
- Chặn "số tổng đài Vietcombank" thì lần sau **ngân hàng thật gọi cũng bị chặn**.
- Chặn nhầm thì bệnh viện gọi, con gọi từ số lạ — bác đều không nhận được. Với
  người già cái hại này rất thật.
- Và chúng **bảo bác gọi lại** thường xuyên hơn tự gọi tới — mà cuộc gọi đi thì
  Android không cho chặn.

#### 15.5.3 Lỗ hổng phải khai với ban giám khảo

Từ Android 12, app **tự bảo vệ được, không cho ai vẽ đè lên mình**
(`setHideOverlayWindows`) — và **app ngân hàng gần như đều bật**, để chống đúng
loại tấn công vẽ đè.

Nghĩa là: **đúng lúc bác mở app ngân hàng chuẩn bị bấm chuyển tiền, tấm thẻ của
mình KHÔNG hiện lên được.** Vẽ đè lên màn hình cuộc gọi thì chạy tốt; đè lên app
ngân hàng thì không.

⚠️ **Không hứa gì về khúc chuyển tiền.** Khúc đó chặn bằng §15.1 cột phải — hạ
hạn mức trước, và dạy xem tên người nhận — chứ không chặn bằng phần mềm.

---

### 15.6 Chữ hiển thị — bản chuẩn

Tất cả đến từ catalog i18n, **kể cả** nhãn thông báo, nhãn ô gạt nhanh, ARIA
label và tên lối tắt trong manifest (§4.1). Không mã cứng chuỗi nào.

| Khoá | Tiếng Việt | English |
|---|---|---|
| `live.notif.title` | Khoan Đã | Khoan Đã |
| `live.notif.limit` | **Khoan Đã không nghe được cuộc gọi này.** | **Khoan Đã cannot hear this call.** |
| `live.notif.body` | Họ có đòi mã OTP · giục chuyển tiền · bảo giữ bí mật? | Are they asking for an OTP · urging a transfer · telling you to keep it secret? |
| `live.action.stop` | DỪNG NGAY | STOP NOW |
| `live.action.call` | GỌI CON | CALL FAMILY |
| `live.action.speak` | ĐỌC TO LỜI TỪ CHỐI | SAY IT OUT LOUD |
| `live.action.exit` | Tôi ổn, ẩn đi | I'm fine, hide this |
| `live.speak.line` | Đây là hệ thống bảo vệ Khoan Đã. Chủ máy sẽ không đọc mã OTP và không chuyển tiền trong cuộc gọi này. | This is the Khoan Đã protection system. This phone's owner will not read out an OTP or transfer money during this call. |
| `live.speaker.hint` | Bác bấm loa ngoài để họ nghe được | Turn on speakerphone so they can hear this |

**Tên thương hiệu "Khoan Đã" giữ nguyên tiếng Việt ở mọi locale.**

`live.notif.limit` **bắt buộc cùng cỡ chữ** với `live.notif.title` — §HĐ luật 3.

#### 15.6.1 Những câu KHÔNG ĐƯỢC VIẾT ở khu vực này

Bổ sung vào §11:

- ❌ **"Khoan Đã đang bảo vệ cuộc gọi"** — app không nghe, không chặn, không biết
  ai đang gọi. Câu này khiến bác **yên tâm hơn lúc chưa cài app**. Đó là làm hại.
- ❌ **"Số này đã xác minh"** / bất kỳ trạng thái xanh nào cho một cuộc gọi đến.
  Số hiện trên màn hình **giả được** — như địa chỉ người gửi ghi sau phong bì.
- ❌ **"Đã chặn cuộc gọi lừa đảo"** khi mới chỉ hiện một tấm thẻ.
- ❌ **Ba mức cảnh báo xám / vàng / đỏ.** Có ba mức tức là có mức nhẹ nhất, và
  mức nhẹ nhất **luôn** bị đọc thành "an toàn". Với bác 70 tuổi, *"chưa xác
  minh"* và *"chưa có thông tin"* là **cùng một câu**.
  → **Một tấm thẻ, một nội dung, mọi cuộc gọi ngoài danh bạ.** Tính an toàn nằm
  ở chỗ tấm thẻ **không đổi**.

#### 15.6.2 Biến thể DUY NHẤT được phép — thẻ giả danh tổ chức

Khi số hiện ra **trùng** một số trong `verified-institution-registry.js` (mục đã
`approved`):

> **Số hiện trên màn hình đúng bằng số tổng đài Vietcombank.**
> **Nhưng số hiện ra giả được.** Khoan Đã không biết ai đang gọi.
> Bác cúp máy, rồi tự gọi lại số in ở mặt sau thẻ.

Dùng sổ đăng ký **ngược lại** với trực giác: không phải để nói "an toàn", mà để
nói *"thứ trông đáng tin nhất chính là thứ hay bị giả nhất"*. Khớp §6.11 —
*không gọi lại số vừa gọi*.

⚠️ Hôm nay `support-directory.json` có `"institutions": []` — **chưa mục nào
được duyệt**. Thẻ này **chưa chạy được** cho tới khi có người mở trang chính
thức, chép số, điền `sourceUrl` + `verifiedAt`, đổi `reviewStatus` sang
`approved`. **Không được bịa số. Không được để model sinh số.**

---

### 15.7 Cái gì KHÔNG được đưa vào

- ❌ **Danh sách số lừa đảo từ báo cáo người dùng.** §12 cấm quy kết cá nhân từ
  báo cáo, mà số điện thoại **là** danh tính cá nhân. Và tự nó cũng hỏng: số bị
  thu hồi rồi cấp lại (số bị báo xấu năm ngoái năm nay là số của một cháu bé),
  kẻ lừa đảo đổi SIM mỗi ngày, và ai cũng báo cáo được thì sẽ có người báo bậy —
  báo số ngân hàng, số công an, hoặc số người họ đang có mâu thuẫn.
- ❌ **`getCallerNumberVerificationStatus()`** (Android 11+). Nó đọc kết quả
  STIR/SHAKEN của nhà mạng — **Viettel · VinaPhone · MobiFone chưa triển khai**.
  Nó sẽ trả "chưa xác minh" cho **mọi cuộc gọi**, kể cả con gái bác gọi về. Cảnh
  báo hiện suốt thì vài hôm là thành hình nền.
- ❌ **"Có trong danh bạ ⇒ yên tâm."** §4.2: mọi thứ thêm vào chỉ được **làm
  tăng** cảnh giác. Và giả số thì giả được thành đúng số con trai bác — lúc đó
  khớp danh bạ còn nguy hơn. Chỉ dùng một chiều: **ngoài danh bạ ⇒ hiện thẻ**.
- ❌ **Chấm điểm rủi ro trong app Android.** §4.2: `decision-engine.js` là **bộ
  luật duy nhất**. Thêm bộ thứ hai thì sớm muộn Android bảo vàng còn web bảo đỏ.
  Android chỉ được **chọn hiện thẻ nào** và **gửi tín hiệu về**, không được tự
  ra mức.

---

### 15.8 Hợp đồng — KHÔNG đổi §HĐ

Toàn bộ §15 là **kênh đầu vào mới**, không phải mức can thiệp mới.

- `canThiep` vẫn đúng **năm** giá trị. **Không thêm `LIVE_CALL`.**
- `nhan` vẫn là enum ba giá trị.
- Bong bóng / thẻ / bộ hỏi nhanh đều đẩy `maLyDo` vào cùng `POST /api/analyze`,
  và **cùng `decision-engine.js`** ra mức.
- `chuaKiem` **luôn** mang `chua_nghe_duoc_cuoc_goi` — đã ép sẵn ở
  `pipeline.js:169`. Không có ngoại lệ, kể cả khi bác trả lời hết bảng hỏi.
- `aiDaChay: false` cho toàn bộ đường bộ hỏi nhanh — chạy **offline, thuần luật,
  dưới 1 giây**. Không gọi mạng. Không chờ AI.

---

### 15.9 Test bắt buộc — viết ĐỎ trước

1. Bảng hỏi nhanh trả lời **hết bằng KHÔNG** vẫn **không** ra `daKiem` chứa
   `nghe_cuoc_goi`, và `chuaKiem` vẫn chứa `chua_nghe_duoc_cuoc_goi`
2. Thông báo bị cắt / rỗng ⇒ **không** ra nhãn thấp — mở rộng
   `test/unreadable-input-floor.test.js` cho nguồn thứ tư
3. Không chuỗi nào trong lớp phủ, thông báo, ô gạt nhanh chứa từ **"bảo vệ cuộc
   gọi"**, **"đã chặn"**, **"đã xác minh"**, **"an toàn"** — ở **cả hai** ngôn ngữ
4. `live.notif.limit` render **cùng `font-size`** với `live.notif.title`
5. Bốn ô của menu bật nhanh **không ô nào** dưới 52px, ba ô chính **≥104px**, ở
   bậc chữ nhỏ nhất (15px)
6. **Không** `white-space: nowrap` trên bốn ô — kiểm ở khổ 320px, bậc chữ A++,
   cả VI lẫn EN
7. Bấm "Tôi ổn, ẩn đi" ghi được mẫu báo động giả, và bong bóng **hiện lại ở cuộc
   gọi sau**
8. Đường đọc thông báo **không ghi nội dung tin nhắn ra bất kỳ log / storage /
   payload nào** — quét cả bộ nhớ lẫn network
9. Tin từ người **có trong danh bạ** không đi vào đường phân tích
10. Thẻ giả danh tổ chức **không render** khi `reviewStatus !== 'approved'`
11. Số tín hiệu không đổi khi đổi ngôn ngữ VI ⇄ EN, và `nhan` giống hệt nhau

---

### 15.10 Phạm vi

| Hạng mục | Bản PWA | Bản native | Ưu tiên |
|---|---|---|---|
| `share_target` — chia sẻ tin nhắn vào app | ✅ | ✅ | **P0** |
| Bộ hỏi nhanh không bàn phím | ✅ | ✅ | **P0** |
| Câu để đọc thẳng vào máy | ✅ | ✅ | **P0** |
| Lối tắt trong manifest (2 bản ngôn ngữ) | ✅ | — | P1 |
| Thông báo thường trú (yếu, vuốt là mất) | ⚠️ | — | P1 |
| Nút gắn trong thông báo | ⚠️ | ✅ | P1 |
| Ô bảng gạt nhanh | ❌ | ✅ | P2 |
| **Bong bóng nổi + menu bật nhanh** | ❌ | ✅ | **P2** |
| **Đọc thông báo tin nhắn** | ❌ | ✅ | **P2** |
| Thẻ giả danh tổ chức | ❌ | ✅ | P2 |
| Chặn cuộc gọi | ❌ | **không làm** | — |
| Tự cúp máy | ❌ | **không làm** | — |

**iOS không hỗ trợ `share_target` lẫn lối tắt manifest.** Nếu người dùng chính
dùng iPhone thì cả cột PWA rút lại còn bộ hỏi nhanh — cần biết trước khi ước
lượng.

#### 15.10.1 Hai quyết định của chủ dự án, không phải của Claude

Ghi lại vì §12 nói Claude không được tự đổi. **Cả hai đã được chủ dự án xác nhận
trực tiếp ngày 15/8/2026:**

1. ✅ **Bản native Android được phép làm** — đổi stack, thêm codebase Kotlin thứ
   hai bên cạnh PWA.
2. ✅ **Đọc thông báo tin nhắn được phép làm**, kèm **bốn ràng buộc §15.4.2**
   (trên máy · ngoài danh bạ · không lưu · nói thật lúc xin quyền). Đây là chạm
   vào privacy model — bốn ràng buộc kia là điều kiện của quyết định này, không
   phải khuyến nghị.

**Ba thứ vẫn giữ nguyên cấm:** chặn cuộc gọi · tự cúp máy · mọi lời hứa chặn
giao dịch ngân hàng.

Hai thứ **vẫn giữ nguyên cấm**: chặn cuộc gọi, và mọi lời hứa chặn giao dịch
ngân hàng.

#### 15.10.2 Phát hành — ràng buộc tự mình đặt cho mình

Bản native **phải lên Play Store, hoặc không phát hành.**

`CO-02` trong `critical-overrides.js:40` cho `DEV_INSTALL_APK_UNKNOWN` là override
tới thẳng `PROTECTED_CRITICAL`. Một sản phẩm dạy người già *"ai bảo cài file lạ
là lừa đảo"* mà tự phát file lạ thì **tự mâu thuẫn với chính bộ luật của nó**, và
mở đường cho kẻ giả danh Khoan Đã — đúng kịch bản `ID_KHOAN_DA_IMPERSONATION` đã
có trong bộ tín hiệu.

Ba quyền dưới đây đều bị Play soi kỹ, phải khai lý do, **tính bằng tuần**:
`SYSTEM_ALERT_WINDOW` · `NotificationListenerService` · `ROLE_CALL_SCREENING`.

---

### 15.11 Bốn bề mặt kích hoạt — hợp nhất từ *Tóm tắt điều hành*

Nguồn: `Tóm tắt điều hành.docx`, 15/8/2026. Bốn ý tưởng ở đó **không thay thế**
§15.2–15.4 mà **nối thêm bề mặt kích hoạt**. Năm chỗ mâu thuẫn với ràng buộc
đang có được ghi ở **§15.14** — đọc mục đó trước khi triển khai bất kỳ ý nào.

| # | Bề mặt | Ma sát | Thấy được | PWA | Native |
|---|---|---|---|---|---|
| 1 | Biểu tượng một chạm trên màn hình chính | 1 chạm + vài bước | cao | ✅ icon | ✅ icon + widget |
| 2 | **Cử chỉ phần cứng** (phím âm lượng / chạm lưng máy) | **1 cử chỉ, không cần nhìn** | — | ❌ | ⚠️ xem 15.11.2 |
| 3 | Nhắc định kỳ | 0 | trung bình | ✅ | ✅ |
| 4 | Khẩu hiệu cố định (ảnh nền / decal) | 0 | thấp–trung bình | ✅ | ✅ |

#### 15.11.1 Biểu tượng một chạm + hỏi theo nhánh hành động

Cải tiến so với §15.3.3: **hỏi hành động trước, hỏi dấu hiệu sau.**

```
Người ta đang yêu cầu bác làm gì?

  💸 Chuyển tiền      🔐 Đưa mã OTP
  📱 Cài ứng dụng     🪪 Gửi giấy tờ
  ❓ Tôi không rõ
```

Chọn xong mới hỏi 2–3 câu CÓ/KHÔNG **thuộc đúng nhánh đó**, thay vì bắt bác đi
hết 8 câu ở §15.3.3. Rút thời gian tới kết luận từ ~20 giây xuống ~8 giây.

Nhánh `❓ Tôi không rõ` **bắt buộc phải có**, và **không được dẫn tới mức thấp** —
nó dẫn về bộ hỏi đầy đủ §15.3.3. Người không diễn đạt được đang gặp chuyện gì
là người **cần giúp nhất**, không phải người ít rủi ro nhất.

Ánh xạ nhánh → tín hiệu:

| Nhánh | Tín hiệu bật ngay |
|---|---|
| 💸 Chuyển tiền | `FIN_TRANSFER_REQUEST` |
| 🔐 Đưa mã OTP | `CRED_OTP_SHARE` |
| 📱 Cài ứng dụng | `DEV_INSTALL_APK_UNKNOWN` |
| 🪪 Gửi giấy tờ | *(không tín hiệu — sang bộ hỏi đầy đủ)* |
| ❓ Không rõ | *(không tín hiệu — sang bộ hỏi đầy đủ)* |

**Quyết định 15/8/2026: KHÔNG thêm tín hiệu cho "gửi ảnh giấy tờ".**
`signal-registry.js` không có mục nào cho việc này, và **không thêm** — thêm là
đổi bảng điểm, kéo theo chạy lại eval và thêm ca âm. Nhánh 🪪 đi **cùng đường
với ❓**: sang bộ hỏi đầy đủ §15.3.3, để các dấu hiệu đi kèm trong cùng tin nhắn
(đòi phí · mạo danh · chuyển tiền) tự bắt.

⚠️ **Đây là lỗ hổng đã biết, ghi lại để không ai tưởng là đã phủ.** Tin nhắn chỉ
đòi ảnh căn cước mà **không kèm dấu hiệu nào khác** có thể ra mức thấp. Cạm bẫy
nếu sau này muốn vá: `neg-app-16` trong bộ eval — *"bác ra chi nhánh, mang theo
căn cước"* là ngân hàng thật làm đúng. Bắt theo chữ "căn cước" là báo động giả
ngay. Phải bắt theo hình dạng **GỬI ảnh đi xa** ≠ **MANG giấy ra quầy**.

**Widget màn hình chính**: chỉ bản native có. PWA chỉ có icon + lối tắt manifest.
iOS không có cả hai.

#### 15.11.2 Cử chỉ phần cứng — sửa lại cho đúng thực tế

Ý tưởng gốc là *"nhấn nút nguồn 3 lần"*. **Không làm được**, và lý do quan trọng:

- **Phím nguồn không được giao cho app.** `KEYCODE_POWER` do hệ thống nuốt. Không
  API nào cho app thường bắt.
- **Nhấn nguồn 5 lần đã là SOS khẩn cấp của Android** — trùng cử chỉ là cướp mất
  chức năng gọi cấp cứu. Không được đụng vào.
- Phím **âm lượng** thì `AccessibilityService` bắt được — nhưng khai một dịch vụ
  Trợ năng chỉ để nghe phím là **rủi ro chính sách Play**, và §15.5.1 đã nói
  Trợ năng là vùng Play soi rất gắt.

**Đường sạch, không cần quyền gì, không cần code gì:** dùng luôn cài đặt cử chỉ
**của chính hệ điều hành**, rồi viết hướng dẫn theo hãng máy.

| Máy | Cử chỉ có sẵn | Dùng được lúc đang gọi |
|---|---|---|
| iPhone | *Cài đặt → Trợ năng → Chạm → Chạm mặt lưng* → Phím tắt mở app | ✅ |
| Samsung | Modes and Routines / phím Bixby | ✅ |
| Xiaomi / Redmi | *Cài đặt → Phím tắt* → gán cử chỉ mở app | ✅ |
| Oppo / realme | *Cử chỉ & thao tác* → vẽ chữ / chạm 3 ngón | ✅ |
| Pixel | Quick Tap (chạm 2 lần mặt lưng) | ✅ |

⚠️ **"Chạm mặt lưng" trên iPhone là bề mặt kích hoạt DUY NHẤT hoạt động được
trên iOS trong lúc đang gọi.** iOS không có `share_target`, không có lối tắt
manifest, không có widget từ PWA, không vẽ đè được. Nếu người dùng chính dùng
iPhone thì đây là đường vào duy nhất — **ưu tiên viết hướng dẫn này trước.**

App **không lập trình gì** cho phần này. Việc của app là một màn hướng dẫn 4 ảnh,
người con làm hộ trong 30 giây. Chi phí gần bằng không, hiệu quả bằng đúng ý
tưởng gốc, và **không đụng vào Trợ năng.**

#### 15.11.3 Nhắc định kỳ — mỗi tuần, không phải mỗi ngày

Ý tưởng gốc đề xuất **hàng ngày**. Đổi thành **tối đa 1 lần/tuần**, vì:

- Thông báo nhắc và **cái nắm tay thường trú §15.2A dùng chung một tài nguyên**:
  quyền thông báo. Nhắc nhiều → người dùng tắt sạch → **mất luôn** bề mặt A.
  Đây là đánh đổi âm, không phải đánh đổi cân bằng.
- Chính tài liệu gốc cũng ghi nhược điểm này ("dễ quen thuộc và lờ nó đi").

Thông báo thường trú của §15.2A **không tính vào hạn mức này** vì nó im lặng,
không rung, không kêu.

Nội dung nhắc **phải đổi mỗi tuần** — một câu chuyện thật, 20 giây, một màn.
Lặp lại y nguyên là cách nhanh nhất để bị lờ.

❌ **KHÔNG làm "gọi điện tự động phát ghi âm cảnh báo".** Ý tưởng gốc có đề xuất
việc này. Lý do bác bỏ: **một cuộc gọi tự động phát giọng nói cho người già chính
xác là thứ kẻ lừa đảo đang làm.** Dạy bác tin cuộc gọi tự động là gỡ mất đúng
hàng rào mình đang dựng. Ngoài ra còn vướng luật viễn thông.

#### 15.11.4 Khẩu hiệu cố định

Chốt khẩu hiệu, **không đổi nữa** — đổi khẩu hiệu là mất hết công lặp lại:

> # LẠ – GẤP – TIỀN ⇒ KHOAN ĐÃ

Ba chữ, ba dấu hiệu, tên sản phẩm nằm luôn ở vế kết. Và **"Khoan đã" là câu người
ta nói ra miệng được** — đó là tài sản, không phải trùng hợp. Dạy phản xạ hai vế:
*nghe thấy đủ ba chữ → **nói to** "Khoan đã" → rồi mở Khoan Đã.* Nói ra tiếng là
mấu chốt, vì chính âm thanh đó cắt mạch bị dẫn dắt.

App sinh sẵn ba thứ, người con cài trong 2 phút:

1. **Ảnh nền màn khoá** — khẩu hiệu + số người con
2. **Tấm dán tủ lạnh** — file in A5
3. **Tấm bìa để cạnh thẻ ngân hàng trong ví** — cùng cỡ thẻ

Số 3 quan trọng nhất mà dễ bị bỏ qua: để lừa được, chúng **bắt buộc** phải bảo
bác lấy thẻ ra đọc số hoặc ra cây ATM. Tấm bìa nằm ngay đó **chặn đúng chỗ tay
bác đang đặt vào**.

> **Trước khi đọc số thẻ này cho ai:** gọi cho \_\_\_\_\_\_\_\_ — \_\_\_\_\_\_\_\_
> Ngân hàng và công an **không bao giờ** hỏi số thẻ qua điện thoại.

#### 15.11.5 Ghi âm giọng người thân

Lấy nguyên từ tài liệu gốc, giữ lại vì nó mạnh: người con thu sẵn một câu, app
phát khi vào màn khẩn cấp.

> *"Mẹ ơi, con đây. Mẹ đừng chuyển gì cả, đợi con gọi lại nhé."*

Giọng người ruột thịt phá trạng thái bị dẫn dắt tốt hơn mọi chữ trên màn hình.
Và nó **giải luôn bài toán chữ nhỏ khó đọc** lúc đang hoảng.

Ràng buộc: file nằm **trên máy**, không lên máy chủ. Thu lại được, xoá được, và
**chủ tài khoản xoá được** — §9.8 luật 1.

---

### 15.12 Chỉ số đo lường và thử nghiệm

Lấy từ tài liệu gốc, giữ nguyên vì đây là phần §15 đang thiếu.

| Chỉ số | Đo cái gì |
|---|---|
| Tỷ lệ nhớ quy tắc | Sau 1 tháng, bác còn nhắc lại được "LẠ – GẤP – TIỀN" không |
| Giảm hành vi rủi ro | Số lần **không** chuyển tiền / **không** đọc mã sau khi có cảnh báo |
| **Báo động giả** | Số lần bấm *"Tôi ổn, ẩn đi"* — §4.6 đã ghi lại sẵn |
| Tỷ lệ tắt thông báo | **Chỉ số cảnh báo sớm.** Tăng ⇒ nhắc quá nhiều, giảm tần suất ngay |
| Tỷ lệ chạm tới được | Trong tình huống giả lập, bao nhiêu % chạm được tới app |

**Thử nghiệm A/B** đề xuất: nhóm A có cử chỉ phần cứng §15.11.2, nhóm B chỉ có
icon. Giả lập một cuộc gọi lừa, đo **bao nhiêu người chạm được tới app** và **mất
bao lâu**. Đây là câu hỏi trung tâm của cả §15 — chưa đo thì mọi con số khác đều
là đoán.

⚠️ **Thử nghiệm với người thật thì phải nói trước đây là diễn tập.** Giả lập một
vụ lừa đảo lên người cao tuổi mà không báo là gây tổn thương thật.

⚠️ Số nào **chưa đo** thì không được đưa lên `/transparency`. §11: *"gọi bản dựng
là đã đo khi mới chỉ là mục tiêu"*. `eval/results/latest.json` là nguồn duy nhất
của số ĐÃ ĐO.

---

### 15.13 Bối cảnh: quầy ngân hàng

Tài liệu gốc nêu một tình huống §15 đang bỏ sót: **bác đã ra tới quầy giao dịch,
đang nghe điện thoại, chuẩn bị rút sổ tiết kiệm.** Nhân viên ngân hàng là hàng
rào cuối cùng — và kẻ lừa đảo **biết điều đó**, nên luôn dặn bác nói dối.

Vì vậy câu hỏi **"Có ai dặn bác nói gì với nhân viên ngân hàng chưa?"** ở
§15.3.3 phải nằm ở **vị trí thứ hai**, không phải cuối bảng. Không có giao dịch
tử tế nào cần nói dối ngân hàng — đây là dấu hiệu gần như không thể sai.

Kèm một màn in được, bác đưa cho giao dịch viên:

> **Tôi đang được một người hướng dẫn qua điện thoại để thực hiện giao dịch này.**
> Nhờ anh/chị hỏi kỹ giúp tôi.

---

### 15.14 Xung đột với *Tóm tắt điều hành* — năm chỗ phải sửa

Ghi lại thay vì âm thầm làm theo, theo §12.

**① Ba màu xanh / cam / đỏ — VI PHẠM §4.1.**
Tài liệu gốc mô tả nhánh *"Hiện trạng thái bình thường (màu xanh)"* khi không có
dấu hiệu nào. **Màu xanh = lời hứa an toàn**, mà hệ thống không có quyền hứa —
nó chỉ nói *"chưa thấy dấu hiệu trong thông tin bác cung cấp"*. Và với bác 70
tuổi, *"cam"* với *"chưa có thông tin"* là **cùng một câu**: "app kiểm rồi, chắc
không sao".
→ **Giữ đúng ba nhãn ở `src/risk-labels.js`. Không thêm mức thứ tư. Không có
trạng thái xanh.** Chi tiết §15.6.1.

**② "app đánh giá rủi ro" ngay trong luồng hỏi.**
Phải đi qua `decision-engine.js`. Màn hỏi chỉ **bật tín hiệu**, không tự ra mức —
§4.2, và §15.7 gạch cuối.

**③ Nhắc hàng ngày → mỗi tuần.** §15.11.3.

**④ Gọi điện tự động → bỏ hẳn.** §15.11.3.

**⑤ Trích dẫn không có nguồn thật.**
Tài liệu gốc mang các mã kiểu ` `[nguồn cần bổ sung — §15.14⑤]``, ` `[nguồn cần bổ sung — §15.14⑤]`` — đây là **mã
tham chiếu nội bộ của một công cụ nghiên cứu, không phải nguồn tra được**. §11
cấm *"cảnh báo không có nguồn"*.
→ Muốn giữ luận điểm nào thì **thay bằng URL thật + ngày truy cập**, hoặc bỏ số
liệu và giữ lại lập luận. **Không được bê nguyên các mã đó vào tài liệu sản
phẩm hay lên `/transparency`.**

---

### 15.15 Bổ sung vào bảng phạm vi §15.10

| Hạng mục | PWA | Native | Ưu tiên |
|---|---|---|---|
| Hỏi theo nhánh hành động (15.11.1) | ✅ | ✅ | **P0** |
| Khẩu hiệu + 3 file in/ảnh nền (15.11.4) | ✅ | ✅ | **P0** |
| Hướng dẫn cử chỉ phần cứng theo hãng (15.11.2) | ✅ | ✅ | **P0** — *chỉ là màn hướng dẫn* |
| Màn đưa giao dịch viên (15.13) | ✅ | ✅ | P1 |
| Ghi âm giọng người thân (15.11.5) | ✅ | ✅ | P1 |
| Nhắc mỗi tuần (15.11.3) | ✅ | ✅ | P1 |
| Widget màn hình chính | ❌ | ✅ | P2 |
| Bắt phím cứng bằng Trợ năng | ❌ | **không làm** | — |
| Gọi điện tự động | ❌ | **không làm** | — |

Ba hạng mục P0 mới đều **không cần quyền gì, không cần máy chủ, không cần
native** — và §15.11.2 còn **không cần code**. Đây là phần rẻ nhất và với tới
được nhiều người nhất trong toàn bộ §15.

---

### 15.16 Bổ sung test bắt buộc

12. Nhánh `❓ Tôi không rõ` **không bao giờ** dẫn tới `TRUST_RECEIPT` một mình —
    luôn sang bộ hỏi đầy đủ §15.3.3
13. Không màn nào trong §15 render màu xanh lá cho trạng thái kết luận
14. Chuỗi khẩu hiệu giống hệt nhau ở mọi bề mặt (ảnh nền · decal · onboarding ·
    màn khẩn cấp) — lệch một chữ là hỏng việc lặp lại
15. File ghi âm giọng người thân **không rời khỏi máy**, và chủ tài khoản xoá được
16. Không chuỗi nào trong repo chứa mẫu `【\d+†L\d+-L\d+】`
