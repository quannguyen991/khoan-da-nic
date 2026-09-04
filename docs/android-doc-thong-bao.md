# App Android companion — đọc thông báo và phát hiện app lạ

*Bản 4/9/2026. Kèm danh sách kiểm thử thủ công, vì phần native không test tự động được.*

> Đọc `docs/kien-truc-hai-phia.md` trước. Tài liệu này là phần thực thi của quyết định
> chốt ở đó: **giữ Capacitor, giữ một bộ luật**.

---

## 0. Vì sao notification listener chứ không phải quyền đọc SMS

Hai lý do, và cả hai đều quan trọng hơn sự tiện lợi:

1. **Bắt được cả Zalo và Messenger.** Phần lớn lừa đảo ở Việt Nam thực sự diễn ra ở
   đó, không phải ở SMS. Quyền `READ_SMS` mù hoàn toàn với hai app này.
2. **Không đụng vào nhóm quyền SMS bị cửa hàng hạn chế gắt.** Xem
   `docs/kien-truc-hai-phia.md` mục 4 — chúng ta chỉ *nêu* rằng phải kiểm chính sách
   hiện hành, không khẳng định điều khoản cụ thể.

Đánh đổi phải nói thật: notification listener **chỉ thấy thứ hiện ra trên thanh thông
báo**. Bác tắt thông báo của Zalo, hoặc mở app đọc tin trước khi thông báo kịp hiện, thì
Khoan Đã không thấy gì. Đó là giới hạn thật, và nó thuộc về §4.3 — app phải nói được
"chưa canh được", không được nói "không có gì".

---

## 1. Luồng cấp quyền — NGƯỜI THÂN làm, không phải bác

### 1.1 Vì sao

Đường vào nằm sâu trong Cài đặt hệ thống và **khác nhau ở mỗi hãng**. Trên máy Samsung
nó là `Cài đặt → Thông báo → Cài đặt nâng cao → Quyền truy cập thông báo`; trên Xiaomi
nó nằm trong `Cài đặt → Ứng dụng → Quyền → Quyền truy cập thông báo` và còn phải qua bộ
quản lý pin riêng của hãng. Không có đường tắt nào từ app đưa thẳng tới đúng ô cần bật —
`moCaiDatDocThongBao()` chỉ mở được *màn danh sách*, còn việc tìm "Khoan Đã" trong danh
sách vài chục app là việc của người thao tác.

Bắt một người 70 tuổi tự đi qua chuỗi đó, một mình, là thiết kế sai từ đầu.

### 1.2 Luồng đúng

Màn thiết lập chạy trên máy của bác, **do con cháu cầm máy thao tác**, bốn bước:

| Bước | Màn hình | Nội dung |
|---|---|---|
| 1 | Giới thiệu | Nói rõ Khoan Đã sẽ đọc thông báo của những app nào, và **không đọc app nào khác**. Nút: "Tôi là con/cháu, tôi cài giúp" |
| 2 | Ảnh chụp hướng dẫn | Ảnh chụp màn Cài đặt **của đúng hãng máy đang cầm** (`trangThaiMay()` đã trả về hãng máy — dùng nó để chọn bộ ảnh) |
| 3 | Mở Cài đặt | Gọi `xinQuyenDocThongBao()`; app KHÔNG tự bật được, người thao tác phải tự gạt |
| 4 | Xác nhận | Quay lại app, gọi `quyenDocThongBao()`. Chỉ khi trả `da_bat` mới báo xong |

> ⚠️ **Ảnh chụp hướng dẫn phải là ẢNH CÓ CHỮ THẬT, không phải chữ nướng vào ảnh.**
> §4.4 cấm chữ nướng vào ảnh, và có test chặn (`test/no-baked-text-screens.test.js`).
> Ảnh chụp màn Cài đặt của hệ điều hành thì được — nó là ảnh minh hoạ, không phải giao
> diện của ta. Nhưng **mọi chữ hướng dẫn của Khoan Đã phải là chữ HTML**, để nó phóng
> theo bậc chữ bác đã chọn.

### 1.3 Trạng thái phải nói thật

| Trạng thái | Màn chính của bác hiện gì |
|---|---|
| `da_bat` | Bình thường. **Không** hiện "đang bảo vệ bác" — xem §11 |
| `chua_bat` | "Chưa canh được tin nhắn đến" — bình thản, không doạ |
| `khong_ho_tro` | Bản web: nói rõ chỉ bản APK mới đọc được thông báo |

---

## 2. Xử lý HOÀN TOÀN TẠI MÁY ở tầng 0 và 1

```
Thông báo đến
   │
   ├─ DocThongBao.java        lọc THÔ: chỉ 7 app nhắn tin  (native, không log)
   │
   ├─ loc-thong-bao.js        lọc TINH + chống trùng       (JS, CÓ TEST)
   │
   ├─ detect.analyze()        tầng 0 + tầng 1              (JS, CÓ TEST)
   │     └─ decision-engine   bộ luật DUY NHẤT
   │
   ├─ [nếu CAO/NGHI_NGO] canh-bao-hai-phia.phatCanhBao()
   │
   └─ [tuỳ chọn] tầng 2 → POST /api/detect/verify
         chỉ gửi: tên miền + BĂM số tài khoản
```

**Không có bước nào trong chuỗi trên cần mạng, trừ tầng 2 — và tầng 2 không được chặn
tầng 0.** Đây là phép thử của cả kiến trúc: bật chế độ máy bay, gửi một tin giả danh
CSGT, màn cảnh báo vẫn phải hiện (kịch bản kiểm thử #7).

### 2.1 Công tắc "gửi toàn văn để cải thiện hệ thống"

- **Mặc định TẮT.**
- Mặc định nằm trong `dungPayloadTang2()` (`backend/src/detect/tang-2.js`), **không**
  ở tầng gọi — để chỉ có một chỗ quên là được, thay vì mỗi nơi gọi một mặc định.
- Có test chặn: `test/detect-tang-2.test.js` → *"§6.9 — payload MẶC ĐỊNH không mang
  toàn văn tin nhắn"*.
- Khi bật, màn cài đặt phải nói rõ: gửi cái gì, đi đâu, giữ bao lâu. Không được viết
  "giúp chúng tôi cải thiện dịch vụ" rồi thôi.

---

## 3. Lọc ồn

Hai tầng, cố ý không phải hai bản sao:

| Tầng | Ở đâu | Lọc gì |
|---|---|---|
| Thô | `DocThongBao.java` | Chỉ nhận 7 gói app nhắn tin. Thông báo của app nhạc không bao giờ rời khỏi tiến trình native |
| Tinh | `backend/src/detect/loc-thong-bao.js` | Gói ngân hàng, hạng mục Android (`transport`, `progress`, `navigation`, …), thông báo của chính Khoan Đã, thông báo rỗng |

> ⚠️ **Thông báo của chính Khoan Đã phải bị loại, nếu không là một vòng lặp:** cảnh báo
> sinh ra thông báo, thông báo sinh ra cảnh báo.

> ⚠️ **"Bỏ qua vì ồn" KHÁC "bỏ qua vì không đọc được".** `locThongBao()` trả về cờ
> `phaiKhai`. Thông báo rỗng từ một app nhắn tin là §4.3 nguyên bản: ta *biết* có một
> tin và *không đọc được* nó. Im lặng bỏ qua là biến "chưa đọc được" thành "không có gì".

---

## 4. Chống trùng

Zalo bắn thông báo, rồi app SMS của máy bắn lại cùng nội dung cách vài giây. Cửa sổ
**15 giây**, khoá = người gửi + băm nội dung đã chuẩn hoá.

> ⚠️ **KHOÁ KHÔNG ĐƯỢC CHỨA TÊN GÓI.** Cả điểm của việc chống trùng là cùng một tin đến
> qua *hai gói khác nhau*. Nhét gói vào khoá là vô hiệu hoá nó, và test
> `test/loc-thong-bao.test.js` ghim thẳng bất biến đó.

> ⚠️ **Bộ đệm chống trùng KHÔNG giữ nguyên văn tin nhắn.** Nó giữ băm FNV-1a 32 bit —
> đủ để so trùng trong 15 giây, không đủ để dựng lại nội dung. Bộ đệm sống trong bộ nhớ
> và có thể bị dump khi máy sập; giữ nguyên văn ở đó là dựng một kho dữ liệu nhạy cảm
> mà không ai xin phép (§6.9).

---

## 5. Ngân sách pin

### 5.1 Vì sao con số này quan trọng hơn vẻ ngoài

Trên máy Xiaomi/Oppo/Vivo, một app tốn pin sẽ bị bộ quản lý của hãng **kill vĩnh viễn**
và người dùng không được hỏi. Lúc đó app im lặng không canh nữa — đúng ca §4.3 tệ nhất,
vì màn chính vẫn trông bình thường.

### 5.2 Kiến trúc đã chọn để tiết kiệm

- `NotificationListenerService` là **event-driven**, không polling. Không có vòng lặp
  nào chạy nền.
- Tầng 0 + tầng 1 mất **~1,5ms** trên máy dựng (`test/detect-hieu-nang.test.js`).
  Ngay cả nếu máy thật chậm hơn 50 lần thì vẫn là 75ms cho mỗi thông báo.
- Tầng 2 là **tuỳ chọn và bất đồng bộ**, hạn 3 giây, không retry.
- `NhanAppMoi` là `BroadcastReceiver`, sống vài mili giây rồi chết.

### 5.3 Cách đo — BẮT BUỘC LÀM CẢ HAI

```bash
# 1. Số của hệ thống, sau một chu kỳ 24 giờ
adb shell dumpsys batterystats --charged vn.khoanda.app
```

```
# 2. Số người dùng thật nhìn thấy
Cài đặt → Pin → Mức dùng pin theo ứng dụng
```

**Ghi cả hai, vì chúng hay lệch nhau.** Con số của `batterystats` là thứ dùng để tối ưu;
con số trong Cài đặt là thứ quyết định bộ quản lý pin của hãng có kill app hay không, và
là thứ con cháu nhìn thấy khi đi tìm nguyên nhân máy hết pin nhanh.

> ⚠️ §11 — **chưa đo thì đừng ghi số.** Bản này chưa có số đo trên máy thật. Đừng viết
> "tốn dưới 1% pin/ngày" vào bất kỳ tài liệu nào cho tới khi có kết quả của mục 5.3.

---

## 6. Khi mất quyền hoặc service bị kill

### 6.1 Báo cho AI

| | |
|---|---|
| **Báo cho người thân** | ✅ Push + email + báo cáo tuần |
| **Báo cho người cao tuổi** | ❌ Không |

**Vì sao không báo cho bác:** bác **không sửa được**. Đường vào nằm sâu trong Cài đặt hệ
thống, trên máy Xiaomi/Oppo/Vivo còn phải qua bộ quản lý pin riêng của hãng. Một thông
báo "Khoan Đã đã mất quyền đọc thông báo" chỉ tạo lo lắng không giải quyết được — và tệ
hơn, nó dạy bác bỏ qua thông báo của Khoan Đã.

**Nhưng không được giấu hẳn:** màn chính của bác phải hiện "Chưa canh được tin nhắn
đến" một cách bình thản, thay vì hiện "Đang bảo vệ bác". §4.3 lại đúng ở đây.

### 6.2 Vào báo cáo tuần như một KHOẢNG MÙ

`suKienMatCanh()` sinh ra một mục có `laKhoangMu: true`; `khoangMuTuSuKien()` đổi nó
thành `khoangMu` cho `dungBaoCaoTuan()`. Hệ quả: câu **"Tuần này không có gì đáng ngại"
không được phát cho một tuần mù** — báo cáo sẽ nói `tuan_nay_co_khoang_khong_canh_duoc`
kèm đúng khoảng thời gian và lý do.

Đây là chỗ §4.3 dễ vỡ nhất của cả sản phẩm: một tuần mù cũng "không có sự kiện nào".

---

## 7. Trạng thái mã — cái gì đã chạy, cái gì chưa

| Thành phần | Trạng thái |
|---|---|
| `backend/src/detect/**` | ✅ Có test tự động, 100+ ca |
| `backend/src/canh-bao-hai-phia.js` | ✅ Có test |
| `backend/src/dien-tap.js`, `bao-cao-tuan.js` | ✅ Có test |
| `src/components/CanhBaoToanManHinh.tsx` | ⚠️ Có typecheck + test i18n; **chưa render trên máy thật** |
| `android/.../DocThongBao.java` | ⚠️ Đã có từ trước; xem ghi chú "chưa qua javac" ở đầu tệp |
| `android/.../NhanAppMoi.java` | ⚠️ **MỚI, CHƯA TỪNG QUA `javac`** |
| `KhoanDaPlugin.layAppMoi()` | ⚠️ **MỚI, CHƯA TỪNG QUA `javac`** |
| `AndroidManifest.xml` receiver `PACKAGE_ADDED` | ⚠️ **MỚI, chưa dựng lại APK** |

### 7.1 Dựng lại APK trên máy có SDK

```bash
cd android
export JAVA_OPTS="-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
java -classpath "gradle/wrapper/gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain assembleDebug
```

> ⚠️ **Classpath phải TƯƠNG ĐỐI.** JVM giải argv bằng bảng mã ANSI của Windows, và đường
> dẫn tiếng Việt làm hỏng classpath tuyệt đối.

> ⚠️ **Sau khi sửa Java, XOÁ thư mục dex trước khi dựng lại:**
> ```bash
> rm -rf android/app/build/intermediates/dex \
>        android/app/build/intermediates/project_dex_archive \
>        android/app/build/outputs/apk
> ```
> Bước dex hay kẹt `UP-TO-DATE` dù `javac` đã chạy lại, và APK sẽ mang mã Java cũ trong
> khi build vẫn báo thành công. Kiểm bằng cách tìm chuỗi trong **tất cả** `classes*.dex`
> (có 4 tệp, không phải 1):
> ```bash
> for f in android/app/build/intermediates/dex/**/classes*.dex; do
>   strings "$f" | grep -q NhanAppMoi && echo "có trong $f"
> done
> ```

---

## 8. Kiểm thử thủ công

Danh sách 27 kịch bản nằm ở `docs/kien-truc-hai-phia.md` mục 6. Chạy hết trước khi nói
bất kỳ hạng mục nào ở mục 7 là "xong".

**Ghi lại cho mỗi lần chạy:** hãng máy · phiên bản Android · phiên bản APK · phiên bản
bộ luật (`GET /api/detect/bo-luat` → `phienBan`). Thiếu bốn thứ đó thì kết quả không
tái lập được, và một kết quả không tái lập được thì không phải số đo.
