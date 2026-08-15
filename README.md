# Khoan Đã

Trợ lý chống lừa đảo cho người cao tuổi. Backend + giao diện, chạy bằng **một**
tiến trình ở **một** cổng.

## Chạy

```bash
npm run gop
```

Dựng lại giao diện rồi khởi động máy chủ. Mở **`http://localhost:8089`**.

Đã có bản dựng rồi thì chỉ cần:

```bash
node server.js
```

Muốn thử phần Khoan Proof (ký bằng passkey) thì bật đường cấp phiên demo:

```bash
KHOAN_DA_PHIEN_DEMO=1 node server.js
```

> ⚠️ **Mở qua `localhost`, không mở qua địa chỉ IP trong mạng LAN.**
> WebAuthn chỉ chạy ở *secure context*. `http://192.168.x.x:8089` không phải
> secure context và `credentials.create()` sẽ ném lỗi — không có cách nào vòng
> qua, kể cả khai thêm origin.

## Vì sao gộp làm một tiến trình

Giao diện dựng vào `public/app/`, máy chủ phục vụ thẳng từ đó.

1. **WebAuthn.** `rpID` phải khớp origin trình duyệt thấy. Chạy hai cổng thì
   phải nhớ khai cả `:3000` lẫn `:8089`, và quên một cái là **mọi** chữ ký bị từ
   chối kèm thông báo trông y hệt "người dùng bấm sai".
2. **§6.10 — app phải chạy được khi rút mạng.** Hai tiến trình là hai thứ có thể
   chết lệch nhau; người dùng thấy giao diện lên nhưng mọi lượt kiểm đều lỗi.

`express.static` đặt **sau** mọi route `/api`. Đặt trước là nó nuốt hết đường API
và trả `index.html` cho `/api/analyze` — frontend nhận HTML, `JSON.parse` ném
lỗi, và thông báo tới người dùng chẳng liên quan gì tới nguyên nhân.

## Phát triển giao diện

Sửa giao diện thì chạy riêng để có hot-reload:

```bash
npm run dev --prefix "../trợ-lý-ảo-khoan-đã (1)"
```

Vite proxy `/api` sang cổng 8089, nên backend vẫn phải chạy. Máy chủ chấp nhận
cả hai origin `localhost` nên passkey vẫn dùng được ở chế độ này.

## Kiểm

```bash
npm test
```

```bash
npm run eval -- --ai --song-song 1
```

> ⚠️ **`--song-song 1`.** Gateway hiện tại mất ~25s một lượt; chạy song song làm
> hỏng phép đo bằng `AI_NETWORK` / `AI_TIMEOUT` chứ không phải hỏng sản phẩm.
> Người dùng thật gửi từng yêu cầu một.
>
> ⚠️ Bộ đánh giá **từ chối công bố số** khi tỉ lệ lượt hỏng vượt trần — cả trần
> tổng lẫn trần từng lô. Đó là hành vi đúng, không phải lỗi: một lượt hỏng đọc
> thành "chưa thấy dấu hiệu rủi ro" là đúng con bug §4.3 mô tả.

`eval/results/latest.json` là thứ `/transparency` đọc để biết số nào **đã đo**.
Xoá tệp đó thì trang tự chuyển về "mục tiêu — chưa đo".

## Ranh giới

| | |
|---|---|
| `src/analysis/decision-engine.js` | **bộ luật duy nhất** ra mức rủi ro |
| tầng AI | chỉ bật cờ `present` / `unknown`, không bao giờ ra mức |
| `src/risk-labels.js` | ba nhãn, i18n không ghi đè được |
| `public/config/ma-hop-dong.json` | mọi mã backend phát ra, để frontend dựng catalog |

Ràng buộc thường trực nằm ở [CLAUDE.md](CLAUDE.md). Bốn khối trong đó chép
nguyên văn từ `BACKEND.md`; muốn đổi thì hỏi người dùng trước.
