# Vòng tròn gia đình — thiết kế

Ngày 16/9/2026 · trạng thái: đã chốt vòng B, các vòng sau còn phác

## Vấn đề

Khoan Đã dừng ở chỗ nhận ra mối nguy rồi đưa người dùng tới một nút gọi. Phần
sau đó — gia đình làm gì, nói gì, chuẩn bị gì — nằm ngoài sản phẩm.

Hệ quả đo được trong chính mã nguồn hôm nay:

- `familyMembers` là một mảng trong `localStorage`, dựng thẳng trong `App.tsx`,
  không có lược đồ, không có phiên bản.
- `TRUSTED_CIRCLE` và `FAMILY_RULE` có tên canonical trong CLAUDE.md §4.1 nhưng
  **không tồn tại trong mã**.
- Màn cảnh báo nói bằng giọng của hệ thống. Không có chỗ nào nói bằng giọng của
  chính gia đình đó.

## Ý tưởng trung tâm

Một cảnh báo do máy phát ra phải thắng được một người đang nói trực tiếp vào tai
nạn nhân, có thẩm quyền giả, và đang thúc ép. Cuộc đấu đó không cân sức.

Thứ cân sức được là **một câu chính gia đình đã tự đặt ra lúc bình tĩnh**, được
đọc lại đúng lúc nguy hiểm, kèm tên người đã cùng đặt câu đó.

> *Quy tắc nhà mình — bác đặt ngày 12/9 cùng chị Lan:*
> **"Nhà mình không bao giờ chuyển tiền khi đang nghe điện thoại."**
> [ Gọi chị Lan ]

Khác biệt không nằm ở công nghệ. Nó nằm ở chỗ câu đó **không phải máy nói**, và
người bị thúc ép nhận ra giọng của con mình.

## Bốn vòng

| Vòng | Tên | Kết quả chính | Trạng thái |
|---|---|---|---|
| **B** | Quy tắc gia đình + nền dữ liệu vòng tròn | Gia đình tự đặt 1–3 quy tắc; quy tắc hiện lại đúng lúc cảnh báo | ✅ **xong 16/9** |
| **A** | Đồng hồ phản ứng | Số giây từ lúc cảnh báo hiện tới lúc **bấm** gọi — máy không biết ai nhấc máy | ✅ **xong 16/9** |
| **C** | Hồ sơ vụ việc xuất ra được | Một tệp văn bản cầm tới ngân hàng và công an | ✅ **xong 16/9** |
| **D** | Ra-đa thủ đoạn | Đếm thủ đoạn trong máy; gói chia sẻ chỉ có mã và số đếm. **Máy chủ gom giữa các nhà chưa dựng** | ⚠️ **một nửa** |

B đi trước vì cả A, C, D đều đọc cùng một mô hình dữ liệu mà B dựng ra.

---

# VÒNG B — QUY TẮC GIA ĐÌNH

## Ràng buộc bất biến

Mọi thứ dưới đây phải đúng, nếu không thì không làm:

1. **Quy tắc gia đình KHÔNG BAO GIỜ đổi mức rủi ro.** Nó là tầng hiển thị. Bộ
   luật không được đọc nó (§4.2). Có test chặn việc `decision-engine.js` hay
   `pipeline.js` import module này.
2. **Không quy tắc nào hạ mức.** Kể cả quy tắc do người dùng tự viết. Đây là
   cùng một bài học với `"ch play"` ở §12 — bất kỳ đường nào cho phép nội dung
   người dùng làm giảm cảnh giác đều là một câu thần chú tặng cho kẻ lừa đảo.
3. **Không dữ liệu mẫu.** Danh sách rỗng là một lời khai trung thực. Bài học số
   điện thoại bịa ở `App.tsx:900` áp dụng nguyên văn.
4. **Chữ hiển thị đến từ catalog i18n**, cả tiếng Việt lẫn tiếng Anh (§HĐ luật 2).
5. **Sàn tiếp cận §4.4** áp cho mọi màn mới: vùng chạm 52px, nút chính 56px, chữ
   từ 14px, tương phản 4,5:1.
6. **Không trách người dùng, không hứa hẹn** (§11). Quy tắc viết ở thể khẳng
   định của gia đình, không ở thể ra lệnh của hệ thống.

## Mô hình dữ liệu

Một module duy nhất: `src/lib/vong-tron-gia-dinh.ts`. Không ai đọc
`localStorage` cho việc này ngoài module đó.

```ts
export const PHIEN_BAN = 1;

export interface NguoiThan {
  id: string;
  ten: string;
  quanHe: string;          // "con gái", "cháu", "hàng xóm" — người dùng tự viết
  dienThoai: string;
}

export type MaQuyTac =
  | 'KHONG_CHUYEN_KHI_DANG_NGHE_MAY'
  | 'KHONG_DOC_MA_OTP'
  | 'GOI_LAI_TRUOC_KHI_CHUYEN'
  | 'KHONG_CAI_UNG_DUNG_LA'
  | 'TUY_CHINH';

export interface QuyTacGiaDinh {
  id: string;
  ma: MaQuyTac;
  /** Câu gia đình tự viết. Với mã khác TUY_CHINH thì đây là bản đã sửa của mẫu. */
  cau: string;
  /** Tên người thân đã cùng đặt. Hiện lại lúc cảnh báo để câu có chủ. */
  nguoiCungDat: string | null;
  ngayDat: number;
  /** Mã tín hiệu khiến quy tắc này được chọn để hiện. Rỗng = hợp mọi cảnh báo. */
  hopVoi: string[];
}

export interface VongTron {
  phienBan: number;
  nguoiThan: NguoiThan[];
  quyTac: QuyTacGiaDinh[];
  capNhat: number;
}
```

**Di trú từ dữ liệu đang có.** Khoá `familyMembers` hiện tại giữ mảng
`{ name, relation, phone }`. Module đọc khoá cũ, chuyển sang lược đồ mới, ghi
sang khoá `khoan_da_vong_tron`, và **giữ nguyên khoá cũ** để bản đang cài không
mất dữ liệu nếu người dùng quay về bản trước. Mật khẩu gia đình **không đụng
tới** — nó đã có khoá riêng và đang chạy đúng.

## Bốn quy tắc mẫu

Người dùng chọn từ mẫu rồi sửa lời, hoặc tự viết. Mẫu tồn tại vì màn hình trắng
là màn hình không ai điền.

| Mã | Câu mẫu | Hợp với tín hiệu |
|---|---|---|
| `KHONG_CHUYEN_KHI_DANG_NGHE_MAY` | "Nhà mình không chuyển tiền khi đang nghe điện thoại." | `FIN_*` |
| `KHONG_DOC_MA_OTP` | "Nhà mình không đọc mã trong tin nhắn cho bất kỳ ai." | `CRED_*` |
| `GOI_LAI_TRUOC_KHI_CHUYEN` | "Trước khi chuyển quá [số tiền], gọi lại cho [tên] đã." | `FIN_TRANSFER_REQUEST` |
| `KHONG_CAI_UNG_DUNG_LA` | "Nhà mình không cài ứng dụng do người lạ chỉ." | `DEV_*` |

Tối đa **ba quy tắc**. Đây là ràng buộc thiết kế, không phải giới hạn kỹ thuật:
một danh sách mười điều là một danh sách không ai nhớ.

## Chọn quy tắc nào để hiện

Hàm thuần, không mạng, không đồng hồ:

```ts
chonQuyTac(quyTac: QuyTacGiaDinh[], maLyDo: string[]): QuyTacGiaDinh | null
```

1. Quy tắc có `hopVoi` khớp tiền tố mã tín hiệu trong `maLyDo` → ưu tiên.
2. Nhiều quy tắc cùng khớp → lấy quy tắc đặt gần đây nhất.
3. Không quy tắc nào khớp → lấy quy tắc đầu tiên, vì một câu của gia đình vẫn
   hơn không có câu nào.
4. Chưa có quy tắc nào → trả `null`, màn cảnh báo giữ nguyên như hiện tại.

`null` phải là một đường đi bình thường, không phải ngoại lệ. Phần lớn người
dùng sẽ ở trạng thái đó trong lần dùng đầu.

## Nơi quy tắc xuất hiện

| Màn | Hiện gì | Điều kiện |
|---|---|---|
| Cảnh báo `CAO` và `PROTECTED_CRITICAL` | Khối quy tắc, đặt **dưới** nhãn rủi ro và **trên** nút gọi | có quy tắc |
| `PAUSE_60S` | Cùng khối, trong lúc đếm ngược | có quy tắc |
| `NGHI_NGO` | Cùng khối, cỡ chữ nhỏ hơn | có quy tắc |
| `CHUA_THAY` | **Không hiện** | — |

Không hiện ở mức thấp nhất vì nhắc một quy tắc an toàn ngay dưới dòng "chưa thấy
dấu hiệu" làm người đọc hiểu nhầm là hệ thống đang cảnh báo.

Khối quy tắc gồm ba phần, theo đúng thứ tự: câu của gia đình · dòng "bác đặt
ngày ___ cùng ___" · nút gọi đúng người đó nếu người đó có trong danh sách.

## Màn đặt quy tắc

Ba bước, mỗi bước một màn, không cuộn:

1. **Chọn mẫu hoặc tự viết** — bốn thẻ mẫu, một ô "tự viết".
2. **Sửa lời cho giống nhà mình** — ô nhập, tối đa 120 ký tự, có đếm ký tự.
3. **Ai cùng đặt quy tắc này?** — chọn từ danh sách người thân, hoặc bỏ qua.

Sau khi lưu: một màn xác nhận đọc lại đúng câu vừa đặt, kèm câu
*"Lần tới gặp chuyện, Khoan Đã sẽ nhắc lại đúng câu này."*

## Kiểm thử

| Test | Chặn điều gì |
|---|---|
| `vong-tron-schema.test.js` | đọc dữ liệu hỏng, thiếu trường, sai phiên bản |
| `vong-tron-di-tru.test.js` | di trú `familyMembers` mất người hoặc mất số |
| `quy-tac-khong-doi-muc.test.js` | `decision-engine.js` / `pipeline.js` import module vòng tròn |
| `chon-quy-tac.test.js` | chọn sai quy tắc; `null` không được ném lỗi |
| `quy-tac-i18n.test.js` | chuỗi mã cứng không qua catalog |
| `quy-tac-khong-hien-muc-thap.test.js` | khối quy tắc lọt vào màn `CHUA_THAY` |

Sàn tiếp cận đã có test chung, màn mới tự động nằm trong phạm vi đó.

---

# CÁC VÒNG SAU — PHÁC THẢO

## Vòng A — rút ngắn thời gian tới người thật

Đo **số giây từ lúc cảnh báo hiện ra tới lúc người dùng bấm gọi**, lưu tại máy,
không gửi đi. Chỉ số này là thứ bán được cho ngân hàng, vì nó nói về hành vi chứ
không nói về mô hình. Cần quyết: đo tới lúc *bấm gọi* hay tới lúc *có người nghe
máy* — máy không biết cuộc gọi có được nhận hay không, nên nhiều khả năng chỉ đo
được tới lúc bấm, và **phải ghi rõ giới hạn đó** thay vì gọi nó là "thời gian
tới người thân".

## Vòng C — hồ sơ vụ việc

Gom những gì đã có (`khoan_da_history`, cửa sổ 14 ngày, `RECOVERY`) thành một tệp
xuất ra được: mốc thời gian, mức rủi ro từng lượt, dấu hiệu, số tiền người dùng
tự khai. Ràng buộc: **không tự điền gì người dùng chưa khai**, và tệp phải đọc
được bằng mắt thường chứ không chỉ bằng máy.

## Vòng D — ra-đa thủ đoạn

Chia sẻ **mã tín hiệu và họ kịch bản**, không chia sẻ nội dung, không chia sẻ số
điện thoại, không quy kết cá nhân (§12). Cần máy chủ và cần trả lời được câu
"làm sao chặn người gửi rác vào ra-đa" trước khi viết dòng mã đầu tiên.


---

# BA VÒNG SAU — ĐÃ DỰNG NGÀY 16/9/2026

## Vòng A — đồng hồ phản ứng

`src/lib/do-thoi-gian-toi-nguoi-that.ts` · 11 phép thử

Mở phiên đo khi màn cảnh báo dựng lên (chỉ mức CAO và NGHI_NGO), đóng phiên khi
người dùng bấm nút gọi. Bỏ lượt nào dài quá 15 phút — màn để mở qua bữa cơm
không nói gì về phản ứng.

**Tên trường là `giayToiLucBam`, có test chặn các tên như `toiNguoiThan`,
`daNgheMay`, `answered`.** Trình duyệt chỉ mở ứng dụng gọi rồi hết phần của nó;
gọi con số này là "thời gian tới người thân" là khai một việc app không làm được.

Số đo ở lại trong máy: có test chặn `fetch`, `sendBeacon`, `XMLHttpRequest`.

## Vòng C — hồ sơ vụ việc

`src/lib/ho-so-vu-viec.ts` · 12 phép thử · màn `ho_so_vu_viec`

Xuất văn bản thuần ba phần: các lượt đã kiểm · lời khai của chính người dùng ·
những thứ chưa kiểm được. Tải về bằng blob, không đi qua máy chủ nào.

Hai ràng buộc có test riêng: **không tự điền** (chưa khai thì ghi "chưa khai",
không ghi 0) và **không chứa nội dung tin nhắn** (kể cả khi lịch sử có lưu).

## Vòng D — ra-đa thủ đoạn

`src/lib/ra-da-thu-doan.ts` · 12 phép thử · màn `ra_da_thu_doan`

Đếm thủ đoạn trong 30 ngày, xếp theo số lần. Gói chia sẻ chỉ có ba khoá: tuần,
họ kịch bản, mã dấu hiệu — mốc thời gian **chỉ tới tuần**.

`kiemTraAnToanChiaSe` chặn theo **danh sách trắng**: khoá lạ, giá trị không khớp
khuôn mẫu, số đếm không phải số nguyên — đều bị từ chối. Danh sách đen chỉ chặn
được những cách nhét dữ liệu hôm nay mình nghĩ ra.

**Chưa dựng máy chủ gom ra-đa giữa các nhà**, và màn hình nói thẳng điều đó. Câu
"làm sao chặn người gửi rác vào ra-đa" vẫn chưa có lời đáp.

## Ba lỗi tìm được nhờ chạy thử trên bản thật

1. **Chọn người cùng đặt quy tắc xong, bản lưu vẫn `nguoiCungDat: null`** —
   `luu()` đọc state React chưa kịp cập nhật. Sửa: nhận người làm tham số.
2. **Ra-đa báo "chưa có lượt kiểm nào" trong khi máy có ba lượt** — app lưu
   `date` là chữ hiển thị "12:55 16-09", `Date.parse` trả `NaN`, mọi bản ghi bị
   lọc sạch. Sửa: thêm trường `luc`, và đọc được cả chuỗi cũ. Có test hồi quy.
3. **Chép thất bại lại báo "bản chia sẻ có thứ không hợp lệ"** — app nói sai về
   dữ liệu của chính người dùng. Sửa: tách hai trường hợp, và khi máy chặn chép
   thì hiện bản chữ để chép tay.
