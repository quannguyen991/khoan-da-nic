'use strict';
/**
 * /gioi-thieu — TRANG GIỚI THIỆU KHOAN ĐÃ, dạng KỂ CHUYỆN KHI CUỘN (25/9/2026).
 *
 * Người đọc chính là CON CHÁU 30–50 tuổi — người sẽ cài app giúp bố mẹ (PRODUCT.md).
 * Người dùng muốn: "đừng nhồi nhét hết vào một lần, cho mọi người kéo xuống xem dần
 * dần, tạo storytelling" (tham chiếu: trang About của The IELTS Dictionary). Nên mỗi
 * màn hình MỘT ý, chuyển động theo cuộn:
 *   mở đầu → dải chữ chạy → một cuộc gọi (ghim, từng câu hiện) → "Khoan đã." (màn
 *   trợ lý thật) → 60 giây (số đếm theo cuộn, màn Khẩn cấp thật) → bạn biết kịp →
 *   chuẩn bị một lần (tích lần lượt, màn Quy tắc thật) → sau khi lỡ chuyển (mốc 72
 *   giờ sáng dần, màn phục hồi thật) → cách app quyết định → web/Android → cài → đóng.
 *
 * ⚠️ KHÔNG CÓ JS VẪN ĐỦ NỘI DUNG. Mọi trạng thái "ẩn chờ hiện" chỉ bật khi script chạy
 * và thêm lớp `dong` vào <html>; `prefers-reduced-motion` ⇒ không thêm lớp đó.
 *
 * ⚠️ MỖI TÍNH NĂNG NÊU Ở ĐÂY ĐÃ ĐỐI CHIẾU VỚI CODE. Cố ý KHÔNG nêu: quét mã QR (chưa
 * làm), kiểm ẢNH (máy chủ chưa có AI đọc ảnh), "Đi cùng bác", số khẩn cấp "đã xác
 * minh". Thêm/bớt tính năng thì sửa trang này CÙNG commit.
 *
 * ⚠️ MỌI CHUỖI NGƯỜI ĐỌC NẰM TRONG `CHU` (test chặn hai ngôn ngữ lệch khoá).
 *
 * ⚠️ NÚT TẢI APK KHÔNG TRỎ THẲNG VÀO TỆP. Nút ở phần mở đầu dẫn xuống mục cài đặt, nơi
 * có cảnh báo "Khoan Đã không bao giờ gửi link tải app" và bước tắt lại quyền cài từ
 * nguồn không rõ — chính bộ luật của app chấm tin mời tải .apk là CAO.
 *
 * Ảnh: linh vật sẵn có (public/minh-hoa-*.webp). Ảnh AI tạo bằng
 * scripts/tao-anh-gioi-thieu.py nằm ở public/anh-gioi-thieu/ — có tệp thì trang tự
 * dùng (máy chủ truyền danh sách), chưa có thì dùng linh vật. Ảnh KHÔNG có chữ.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Chứng chỉ ký bản phát hành (khoá tạo bằng scripts/tao-khoa-phat-hanh.js, CN=Khoan Da, C=VN). */
const VAN_TAY_CHUNG_CHI = '6a5ee25c2572d4dad07fb0bfce5fb640b01ae43f39d06c107eb5f02270f2812f';
const EMAIL_LIEN_HE = 'quannxm.sags@gmail.com';

/** Ảnh AI có thể có (public/anh-gioi-thieu/<ten>.webp). Máy chủ báo tệp nào đang có. */
const ANH_AI = ['mo-dau', 'cuoc-goi', 'khoan-da', 'con-chau', 'truoc', 'sau'];

const CHU = {
  vi: {
    tieuDeTrang: 'Khoan Đã — giúp bố mẹ dừng lại trước cuộc gọi lừa đảo',
    moTa: 'Ứng dụng cho cả nhà: bố mẹ kể lại hoặc dán tin nhắn lạ, Khoan Đã chỉ ra dấu hiệu lừa đảo, giữ bố mẹ lại 60 giây và kéo con cháu vào cuộc.',
    khauHieu: 'Dừng lại. Kiểm tra. Bảo vệ.',
    nhayNoiDung: 'Bỏ qua, tới nội dung chính',
    doiNgonNgu: 'English',
    doiNgonNguNhan: 'Xem trang này bằng tiếng Anh',
    veDau: 'Khoan Đã — về đầu trang giới thiệu',

    h1a: 'Kẻ lừa đảo cần bố mẹ bạn vội.',
    h1b: 'Khoan Đã giúp bố mẹ dừng lại.',
    dan: 'Một ứng dụng cho cả nhà: giữ bố mẹ lại đúng lúc cuộc gọi đang ép, và kéo bạn vào cuộc.',
    nutWeb: 'Mở Khoan Đã trên web',
    nutAndroid: 'Cài bản Android cho bố mẹ',
    ghiNho: 'Miễn phí · Không quảng cáo · Tiếng Việt và tiếng Anh',
    cuonXuong: 'Kéo xuống để xem chuyện gì xảy ra',
    chay: ['Dừng lại', 'Kiểm tra', 'Bảo vệ', 'Khoan Đã'],

    c1TieuDe: 'Chín giờ sáng, điện thoại của bố reo.',
    c1Loi: [
      '“Tôi là cán bộ công an.”',
      '“Tài khoản của ông liên quan đến một vụ án.”',
      '“Chuyển hết tiền sang tài khoản tạm giữ, ngay bây giờ.”',
      '“Không được nói với ai, kể cả con cái.”',
    ],
    c1Ket: 'Gấp gáp và cô lập. Kẻ lừa đảo chỉ cần hai thứ đó.',
    c1Ghi: 'Kịch bản dựng lại để minh hoạ.',

    c2TieuDe: 'Khoan đã.',
    c2Doan: 'Bố mẹ mở Khoan Đã và kể lại bằng giọng nói. Có dấu hiệu, câu đầu tiên luôn là một lời nhắc dừng lại, kèm nút kiểm ngay.',
    c2Phu: 'Lời nhắc đó do bộ luật cố định thêm vào, không chờ AI. Phần trò chuyện sau đó mới là AI.',
    capTroLy: 'Màn “Nói cho cháu nghe” thật. Bác vừa kể: “Ngân hàng bảo chuyển tiền, không thì tài khoản bị khoá.”',
    duLieuMau: 'Chụp từ app thật. Dữ liệu mẫu: người thân tên Lan.',

    c3TieuDe: '60 giây để cơn vội qua đi.',
    giay: 'giây',
    c3Diem: [
      'Một nút ở màn chính là tới màn Khẩn cấp.',
      'Gọi ngay cho bạn, hoặc gọi 113.',
      'Một câu nói sẵn: “Để tôi hỏi con rồi gọi lại.”',
    ],
    capKhanCap: 'Màn Khẩn cấp thật. Luôn có nút về trang chủ để thoát ra.',

    c4TieuDe: 'Và bạn biết kịp.',
    c4Doan: 'Khi bố mẹ bật “báo cho con”, gặp tình huống nguy hiểm cao là bạn nhận cảnh báo trên Chrome. Không ai phản ứng sau 60 giây thì báo lần hai.',
    c4Phu: 'Bạn chỉ nhận mức cảnh báo, không đọc được tin nhắn của bố mẹ. Báo cho con tắt sẵn, và chỉ bố mẹ bật được, trên chính máy của mình.',

    c5TieuDe: 'Chuẩn bị một lần, cùng bố mẹ.',
    c5Dan: 'Trước khi có cuộc gọi nào:',
    c5Viec: [
      ['Lưu số của bạn', 'Nút “Gọi người nhà” gọi thẳng cho bạn.'],
      ['Nối máy bằng mã 6 số', 'Bố mẹ lấy mã trong Cài đặt, bạn nhập trên máy mình.'],
      ['Đặt quy tắc nhà mình', 'Tối đa ba câu, Khoan Đã nhắc lại đúng lúc cần.'],
      ['Đặt mật khẩu gia đình', 'Ai xưng là con cháu mà không nói được thì dừng lại.'],
      ['Học năm bài ngắn', 'Các kiểu lừa hay gặp, mỗi bài có câu đố.'],
    ],
    capQuyTac: 'Màn “Quy tắc nhà mình” thật, sau khi đặt một quy tắc cùng con.',

    c6TieuDe: 'Lỡ chuyển rồi? Bố mẹ không phải một mình.',
    c6Doan: 'Bấm “Tôi đã lỡ chuyển tiền hoặc đọc mã rồi”: app nhắc ngay dừng cuộc gọi, không chuyển thêm, rồi chỉ từng bước làm tăng khả năng xử lý, kèm số tổng đài của 11 ngân hàng đã được duyệt.',
    c6Phu: 'Kẻ gian hay quay lại lần hai, kiểu “nộp phí để lấy lại tiền”. App nhắc ở các mốc sau sự cố; bản Android nhắc cả khi app đã đóng.',
    c6Moc: ['2 giờ', '24 giờ', '48 giờ', '72 giờ'],
    c6MocNhan: 'Các mốc nhắc sau sự cố',
    capPhucHoi: 'Màn thật sau khi bấm “Tôi đã lỡ chuyển tiền hoặc đọc mã rồi”, rồi “Xem việc tiếp theo”.',

    qdTieuDe: 'AI chỉ trích dấu hiệu. Bộ luật cố định mới quyết mức rủi ro.',
    qdDoan: 'Cùng một tin luôn cho cùng một kết luận, và đổi ngôn ngữ không làm đổi kết luận.',
    qdBuoc: ['Tin nhắn hoặc lời kể', 'AI đánh dấu dấu hiệu', 'Bộ luật cố định', 'Một trong ba mức'],
    qdBuocNhan: 'Đường đi của một lượt kiểm',
    qdBaMuc: 'Chỉ có ba mức',
    nhanCao: 'Nguy hiểm cao',
    nhanNghiNgo: 'Nghi ngờ',
    nhanChuaThay: 'Chưa thấy dấu hiệu rủi ro',
    qdKhongHua: 'Không mức nào hứa rằng bố mẹ đã hết nguy hiểm. Cái gì chưa kiểm được, app ghi ngay dưới kết luận, cùng cỡ chữ:',
    qdViDuNhan: 'Ví dụ một kết luận',
    qdChuaKiem: 'Những thứ cháu CHƯA kiểm được',
    qdChuaKiem1: 'Chưa nghe được cuộc gọi',
    qdLink: 'Xem số đo công khai của bộ luật',

    ssTieuDe: 'Bản web hay bản Android?',
    ssWebTen: 'Bản web — mở trên mọi máy, kể cả iPhone',
    ssAndroidTen: 'Bản Android làm thêm',
    ssHang: [
      ['Kiểm tin nhắn, nói cho cháu nghe', true, true],
      ['Đang bị ai gọi?, Khẩn cấp, dừng 60 giây', true, true],
      ['Quy tắc nhà mình, mật khẩu gia đình, bài học', true, true],
      ['Nối máy với con cháu, báo cho con', true, true],
      ['Tự xem tin nhắn đến', false, true],
      ['Cảnh báo đè lên màn hình, kể cả lúc đang gọi', false, true],
      ['Báo khi mã OTP về hoặc tiền đi ra trong lúc gọi', false, true],
      ['Nhắc khi cuộc gọi kéo dài', false, true],
      ['Nhắc 72 giờ cả khi app đã đóng', false, true],
    ],

    caiTieuDe: 'Cài bản Android cho bố mẹ',
    caiCanhBaoTieuDe: 'Chỉ tải ở đúng trang này',
    caiCanhBao: 'Khoan Đã chưa có trên CH Play. Khoan Đã không bao giờ gửi link tải ứng dụng qua tin nhắn, Zalo hay cuộc gọi. Ai gửi cho bố mẹ bạn một link “Khoan Đã” là giả.',
    caiBuoc: [
      'Trên điện thoại của bố mẹ, mở trang này bằng Chrome rồi bấm “Tải tệp APK”.',
      'Mở tệp vừa tải. Máy hỏi có cho Chrome cài ứng dụng không: bấm cho phép.',
      'Cài xong, tắt lại quyền đó: Cài đặt → Ứng dụng → Chrome → Cài ứng dụng không rõ nguồn. Tên mục có thể khác tuỳ máy.',
      'Mở Khoan Đã, chọn “Bác / bố mẹ”, rồi lưu số của bạn.',
      'Muốn app tự xem tin nhắn đến: Android 13 trở lên có thể báo “cài đặt bị hạn chế”. Vào Thông tin ứng dụng của Khoan Đã, bấm dấu ba chấm ở góc trên, chọn cho phép cài đặt bị hạn chế, rồi bật lại. Bạn làm giúp bố mẹ bước này, đừng hướng dẫn bố mẹ tự làm với ứng dụng khác.',
    ],
    caiDiaChiNhan: 'Đang đọc trên máy tính? Gõ địa chỉ này vào Chrome trên điện thoại của bố mẹ:',
    caiNut: 'Tải tệp APK',
    caiPhienBan: 'Khoan Đã {v} · {kt}',
    caiMayCu: 'Máy đã cài bản thử trước đây thì gỡ bản cũ ra rồi mới cài bản này.',
    caiIphone: 'iPhone: dùng bản web, rồi bấm Chia sẻ, chọn Thêm vào màn hình chính.',
    caiKiemTep: 'Kiểm tệp (cho người rành kỹ thuật)',
    caiVanTay: 'Dấu vân tay chứng chỉ ký (SHA-256)',
    caiBamTep: 'Mã băm tệp (SHA-256)',
    caiChuaCo: 'Tệp cài đặt đang được cập nhật. Tạm thời bố mẹ dùng bản web nhé.',

    kkTieuDe: 'Những điều Khoan Đã cố ý không làm',
    kk: [
      'Không quảng cáo, không bán dữ liệu.',
      'Không điểm thưởng, không chuỗi ngày. Một ứng dụng phòng lừa đảo tốt không cần bố mẹ mở mỗi ngày.',
      'Con cháu không xem được nội dung tin nhắn của bố mẹ, chỉ nhận mức cảnh báo.',
      'Không đọc SMS, nhật ký cuộc gọi hay danh bạ. Không theo dõi vị trí.',
      'Không hứa chặn cuộc gọi hay chặn giao dịch.',
    ],
    kkLink: 'Đọc chính sách quyền riêng tư',

    dongTieuDe: 'Khoan Đã đang trong giai đoạn thử nghiệm.',
    dongDoan: 'Dự án dự thi NextGen 2026. Chúng tôi chưa thử rộng với người cao tuổi ngoài gia đình. Nếu nhà bạn muốn dùng thử và góp ý, hãy viết cho chúng tôi.',
    dongNutThu: 'Viết thư góp ý',
    chanSoDo: 'Số đo công khai',
    chanRiengTu: 'Chính sách quyền riêng tư',
    chanMoApp: 'Mở ứng dụng',
  },

  en: {
    tieuDeTrang: 'Khoan Đã — helps your parents pause before a scam call wins',
    moTa: 'An app for the whole family: your parents describe what happened or paste a strange message, Khoan Đã points out scam signals, holds them for 60 seconds and pulls you in.',
    khauHieu: 'Pause. Verify. Protect.',
    nhayNoiDung: 'Skip to main content',
    doiNgonNgu: 'Tiếng Việt',
    doiNgonNguNhan: 'View this page in Vietnamese',
    veDau: 'Khoan Đã — back to the top of the page',

    h1a: 'Scammers need your parents to hurry.',
    h1b: 'Khoan Đã helps them pause.',
    dan: 'An app for the whole family: it holds your parents back while the call is pushing them, and pulls you in.',
    nutWeb: 'Open Khoan Đã on the web',
    nutAndroid: 'Install the Android app for them',
    ghiNho: 'Free · No ads · Vietnamese and English',
    cuonXuong: 'Scroll to see what happens',
    chay: ['Pause', 'Verify', 'Protect', 'Khoan Đã'],

    c1TieuDe: 'Nine in the morning, your dad’s phone rings.',
    c1Loi: [
      '“This is the police.”',
      '“Your account is linked to a criminal case.”',
      '“Move all your money to a holding account, right now.”',
      '“Do not tell anyone, not even your children.”',
    ],
    c1Ket: 'Urgency and isolation. That is all a scammer needs.',
    c1Ghi: 'A re-enacted scenario, for illustration.',

    c2TieuDe: 'Hold on.',
    c2Doan: 'Your parents open Khoan Đã and describe it by voice. If there is a signal, the very first sentence is always a reminder to hold off, with a button to check right away.',
    c2Phu: 'That reminder is added by the fixed rules, without waiting for the AI. Only the conversation after it is AI.',
    capTroLy: 'The real Talk to me screen. The parent said: “The bank says transfer the money or my account gets locked.”',
    duLieuMau: 'Captured from the real app. Sample data: a family member named Lan.',

    c3TieuDe: '60 seconds for the rush to pass.',
    giay: 'sec',
    c3Diem: [
      'One tap on the main screen opens Emergency.',
      'Call you right away, or call the police.',
      'A ready-made line: “Let me ask my family and call you back.”',
    ],
    capKhanCap: 'The real Emergency screen. There is always a way back to the home screen.',

    c4TieuDe: 'And you find out in time.',
    c4Doan: 'When your parents switch on “alert my family”, you get an alert in Chrome whenever they hit a high-risk situation. If nobody responds within 60 seconds, it alerts again.',
    c4Phu: 'You receive the alert level only, never their messages. Alerts are off by default, and only your parents can switch them on, on their own phone.',

    c5TieuDe: 'Set it up once, together.',
    c5Dan: 'Before any call comes:',
    c5Viec: [
      ['Save your number', 'The “Call family” button rings you directly.'],
      ['Link phones with a 6-digit code', 'Your parents get the code in Settings; you enter it on yours.'],
      ['Write your family rules', 'Up to three sentences, shown again exactly when needed.'],
      ['Set a family password', 'Anyone calling as a relative who cannot say it gets a pause.'],
      ['Five short lessons', 'The common scam patterns, each with a quiz.'],
    ],
    capQuyTac: 'The real family rules screen, after setting one rule together with a child.',

    c6TieuDe: 'Money already gone? They are not alone.',
    c6Doan: 'Tapping “I already sent money or read out a code” first says: hang up, do not send more. Then it walks through the steps that improve the chance of resolving it, with hotline numbers for 11 reviewed banks.',
    c6Phu: 'Scammers often come back a second time, as in “pay a fee to get your money back”. The app reminds at set points after the incident; the Android app reminds even when closed.',
    c6Moc: ['2 hours', '24 hours', '48 hours', '72 hours'],
    c6MocNhan: 'Reminder points after an incident',
    capPhucHoi: 'The real screen after tapping “I already sent money or read out a code”, then “See what to do next”.',

    qdTieuDe: 'AI only extracts signals. Fixed rules decide the risk level.',
    qdDoan: 'The same message always gets the same result, and switching language cannot change it.',
    qdBuoc: ['A message or a story', 'AI marks the signals', 'Fixed rules', 'One of three levels'],
    qdBuocNhan: 'How one check flows',
    qdBaMuc: 'There are only three levels',
    nhanCao: 'High risk',
    nhanNghiNgo: 'Suspicious',
    nhanChuaThay: 'No clear risk signals found',
    qdKhongHua: 'No level promises your parents are out of danger. Whatever could not be checked is listed right under the result, in the same size:',
    qdViDuNhan: 'An example result',
    qdChuaKiem: 'What I could NOT check',
    qdChuaKiem1: 'Could not hear the call',
    qdLink: 'See the published measurements of the rules',

    ssTieuDe: 'Web app or Android app?',
    ssWebTen: 'The web app — opens on any phone, iPhone included',
    ssAndroidTen: 'The Android app adds',
    ssHang: [
      ['Check messages, Talk to me', true, true],
      ['Someone calling you?, Emergency, 60-second pause', true, true],
      ['Family rules, family password, lessons', true, true],
      ['Link phones with family, alert family', true, true],
      ['Screen incoming messages', false, true],
      ['Warning over other apps, including during calls', false, true],
      ['Warn when a code arrives or money leaves mid-call', false, true],
      ['Long-call reminder', false, true],
      ['72-hour reminders even when the app is closed', false, true],
    ],

    caiTieuDe: 'Install the Android app for your parents',
    caiCanhBaoTieuDe: 'Download only from this page',
    caiCanhBao: 'Khoan Đã is not on Google Play yet. Khoan Đã never sends app download links by message, Zalo or phone call. Anyone who sends your parents a “Khoan Đã” link is not us.',
    caiBuoc: [
      'On your parent’s phone, open this page in Chrome and tap “Download the APK”.',
      'Open the downloaded file. When the phone asks whether Chrome may install apps, allow it.',
      'After installing, switch that permission off again: Settings → Apps → Chrome → Install unknown apps. Menu names vary by phone.',
      'Open Khoan Đã, choose “Parent / grandparent”, then save your number.',
      'To screen incoming messages: Android 13 and later may say “restricted setting”. Open Khoan Đã’s App info, tap the three dots at the top, allow restricted settings, then switch it on again. Do this step for your parents; do not teach them to do it for other apps.',
    ],
    caiDiaChiNhan: 'Reading this on a computer? Type this address into Chrome on your parent’s phone:',
    caiNut: 'Download the APK',
    caiPhienBan: 'Khoan Đã {v} · {kt}',
    caiMayCu: 'If a test version was installed before, uninstall it first.',
    caiIphone: 'iPhone: use the web app, then tap Share and choose Add to Home Screen.',
    caiKiemTep: 'Verify the file (for technical readers)',
    caiVanTay: 'Signing certificate fingerprint (SHA-256)',
    caiBamTep: 'File hash (SHA-256)',
    caiChuaCo: 'The installer is being updated. Please use the web app for now.',

    kkTieuDe: 'What Khoan Đã deliberately does not do',
    kk: [
      'No ads, no selling data.',
      'No points, no streaks. A good anti-scam app does not need your parents to open it every day.',
      'Family members cannot read your parents’ messages; they only receive the alert level.',
      'No reading SMS, call logs or contacts. No location tracking.',
      'No promise to block calls or stop transactions.',
    ],
    kkLink: 'Read the privacy policy',

    dongTieuDe: 'Khoan Đã is in its testing stage.',
    dongDoan: 'A NextGen 2026 entry. We have not yet tested widely with older people outside our own families. If your family would like to try it and tell us what works, write to us.',
    dongNutThu: 'Write to us',
    chanSoDo: 'Published measurements',
    chanRiengTu: 'Privacy policy',
    chanMoApp: 'Open the app',
  },
};

/* ───────── APK: kích thước + mã băm, tính một lần cho mỗi phiên bản tệp ───────── */
let boNhoApk = null;
/**
 * ⚠️ `duongGradle` BẮT BUỘC, không mặc định theo `__dirname`: trên Render module này
 * bị esbuild gộp vào dist/server.cjs và `__dirname` thành `dist/` — mặc định cũ trỏ
 * ra ngoài repo, số phiên bản biến mất khỏi trang (đo 24/9/2026). Máy chủ truyền vào.
 */
function docThongTinApk(duongApk, duongGradle) {
  try {
    const st = fs.statSync(duongApk);
    const khoa = `${st.size}:${st.mtimeMs}`;
    if (boNhoApk && boNhoApk.khoa === khoa) return boNhoApk.giaTri;
    const bamTep = crypto.createHash('sha256').update(fs.readFileSync(duongApk)).digest('hex');
    let phienBan = null;
    try {
      const m = fs.readFileSync(duongGradle, 'utf8').match(/versionName\s+"([^"]+)"/);
      if (m) phienBan = m[1];
    } catch { /* không đọc được thì bỏ số phiên bản, không bịa */ }
    const giaTri = { kichThuocByte: st.size, bamTep, phienBan };
    boNhoApk = { khoa, giaTri };
    return giaTri;
  } catch {
    return null;
  }
}

const dinhDangMb = (byte, ngonNgu) => {
  const so = (byte / (1024 * 1024)).toFixed(1);
  return `${ngonNgu === 'vi' ? so.replace('.', ',') : so} MB`;
};
const chiaCap = (hex) => hex.toUpperCase().match(/.{2}/g).join(':');

/* ───────── Biểu tượng: nét vẽ tay cùng một độ dày, không dùng emoji ───────── */
const BT = {
  co: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  mui: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  xuong: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  tai: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  canh: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  goi: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
};

const PHONG_CHU = (() => {
  const VI = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
  const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const mat = (tap, dai, vung) => `@font-face{font-family:"Quicksand";font-style:normal;font-weight:${dai};font-display:swap;src:url(/phong-chu/quicksand-${tap}-${dai}-normal.woff2) format("woff2");unicode-range:${vung}}`;
  return [500, 700].flatMap((d) => [mat('vietnamese', d, VI), mat('latin-ext', d, LATIN_EXT), mat('latin', d, LATIN)]).join('\n');
})();

const CSS = `
${PHONG_CHU}
:root{
  color-scheme:light;
  --muc:#1e1b4b; --muc-dam:#2e1065; --muc-phu:#4a4270;
  --tim:#6d28d9; --tim-1:#9e76ea; --tim-2:#ad8af0; --tim-nhat:#efe7ff; --tim-nen:#f8f4ff; --tim-vien:#d9cbfb;
  --dem:#170d33; --dem-chu:#f5f0ff; --dem-phu:#cdbef7;
  --giay:#fff; --vang:#fbbf24; --vang-dam:#b45309;
  --do-nen:#fee2e2; --do-chu:#991b1b; --vang-nen:#fef3c7; --vang-chu:#854d0e; --la-nen:#dcfce7; --la-chu:#166534;
  --cham:52px; --cham-chinh:max(56px,3.5rem);
  --bo:28px; --bo-vua:20px;
  --bong:0 24px 60px -24px rgba(46,16,101,.35),0 2px 6px rgba(46,16,101,.08);
  --ra:cubic-bezier(.16,1,.3,1);
  --luoi:linear-gradient(to right,rgba(109,40,217,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(109,40,217,.07) 1px,transparent 1px);
}
*{box-sizing:border-box}
html{font-size:18px;-webkit-text-size-adjust:100%}
@media (max-width:480px){html{font-size:17px}}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
body{margin:0;font-family:"Quicksand",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-weight:500;color:var(--muc);line-height:1.6;background:var(--tim-nen) var(--luoi);background-size:26px 26px;overflow-x:hidden}
h1,h2,h3{font-weight:700;line-height:1.25;text-wrap:balance;margin:0;letter-spacing:-.015em}
p{margin:0}
a{color:var(--muc-dam);text-underline-offset:3px}
img{max-width:100%;height:auto;display:block}
:focus-visible{outline:3px solid var(--muc-dam);outline-offset:3px;border-radius:8px}
.an{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:normal}
.nhay{position:absolute;left:16px;top:-80px;z-index:20;background:var(--muc-dam);color:#fff;padding:12px 18px;border-radius:14px;min-height:var(--cham);display:inline-flex;align-items:center}
.nhay:focus{top:12px}
.khung{max-width:72rem;margin:0 auto;padding-inline:clamp(16px,5vw,56px)}
.bt{width:1.25em;height:1.25em;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}

/* thanh tiến độ đọc */
.tien-do{position:fixed;inset:0 0 auto 0;height:4px;z-index:30;pointer-events:none}
.tien-do span{display:block;height:100%;background:linear-gradient(90deg,var(--tim-1),var(--vang));transform-origin:0 50%;transform:scaleX(0)}

/* đầu trang */
.dau{position:relative;z-index:5;padding:14px 0}
.dau-trong{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.thuong-hieu{display:inline-flex;align-items:center;gap:10px;min-height:var(--cham);text-decoration:none;font-weight:700;font-size:1.15rem;color:var(--muc-dam)}
.thuong-hieu img{border-radius:12px}
.khau-hieu{color:var(--muc-phu);font-size:.9rem;flex:1 1 auto}
.nut-nho{display:inline-flex;align-items:center;min-height:var(--cham);padding:0 20px;border-radius:999px;border:2px solid var(--tim-1);background:var(--giay);font-weight:700;text-decoration:none}
@media (max-width:600px){.nut-nho{margin-left:auto}.khau-hieu{order:3;flex-basis:100%}}

/* nút */
.nut{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:var(--cham-chinh);padding:14px 28px;border-radius:999px;font-weight:700;font-size:1.05rem;line-height:1.3;text-decoration:none;text-align:center;transition:transform .25s var(--ra),box-shadow .25s var(--ra)}
.nut:hover{transform:translateY(-2px)}
.nut:active{transform:translateY(0) scale(.98)}
.nut-chinh{color:var(--muc);background:linear-gradient(135deg,var(--tim-1),var(--tim-2));box-shadow:0 14px 30px -12px rgba(109,40,217,.55)}
.nut-phu{color:var(--muc);background:var(--giay);border:2px solid var(--tim-1)}
.nut-dac{color:#fff;background:var(--muc-dam);box-shadow:0 14px 30px -14px rgba(30,27,75,.7)}
.hang-nut{display:flex;flex-wrap:wrap;gap:14px}

/* ── 1. mở đầu: một màn hình, một câu ── */
.mo-dau{min-height:calc(100svh - 80px);display:grid;align-items:center;padding:24px 0 56px}
.mo-dau-luoi{display:grid;gap:32px;align-items:center}
@media (min-width:900px){.mo-dau-luoi{grid-template-columns:1.25fr .75fr;gap:48px}}
.mo-dau h1{font-size:clamp(2.3rem,6vw,4.4rem);color:var(--muc-dam)}
.mo-dau h1 span{display:block}
.mo-dau h1 .h1b{color:var(--tim)}
.mo-dau .dan{font-size:1.2rem;color:var(--muc-phu);margin-top:22px;max-width:36ch}
.mo-dau .hang-nut{margin-top:30px}
.ghi-nho{margin-top:16px;color:var(--muc-phu);font-size:.9rem}
.linh-vat{justify-self:center;width:min(100%,500px)}
.cuon{display:inline-flex;align-items:center;gap:10px;margin-top:40px;color:var(--muc-phu);font-weight:700;min-height:var(--cham);text-decoration:none}
.cuon .bt{color:var(--tim)}

/* ── 2. dải chữ chạy ── */
.chay{background:var(--muc-dam);color:#fff;overflow:hidden;border-block:2px solid var(--muc)}
.chay-trong{display:flex;width:max-content;gap:0}
.chay-trong span{display:inline-flex;align-items:center;gap:28px;padding:22px 28px 22px 0;font-weight:700;font-size:clamp(1.3rem,3vw,2rem);line-height:1.3;flex:none}
.chay-trong span::after{content:"";width:12px;height:12px;border-radius:50%;background:var(--vang);flex:none}

/* ── chương chung ── */
.chuong{padding:clamp(64px,9vw,112px) 0}
.chuong-luoi{display:grid;gap:48px;align-items:center}
@media (min-width:900px){.chuong-luoi{grid-template-columns:1fr 1fr;gap:72px}.chuong-luoi.dao>:first-child{order:2}}
.to{font-size:clamp(2.4rem,7vw,5rem);color:var(--muc-dam)}
.vua{font-size:clamp(1.8rem,4.4vw,3rem);color:var(--muc-dam);max-width:18ch}
.lon{font-size:clamp(1.1rem,2vw,1.35rem);color:var(--muc);margin-top:22px;max-width:40ch}
.phu{color:var(--muc-phu);margin-top:14px;max-width:46ch}
.chu-thich{margin-top:14px;font-size:.85rem;color:var(--muc-phu);text-align:center;max-width:36ch;margin-inline:auto}
.chu-thich span{display:block;margin-top:4px}

/* màn THẬT (scripts/chup-man-that.mjs) trong vỏ máy */
.dien-thoai{margin:0;justify-self:center;--ti:.74;width:calc(390px * var(--ti) + 20px)}
@media (max-width:420px){.dien-thoai{--ti:.7}}
.vo-may{position:relative;overflow:hidden;border-radius:46px;border:10px solid var(--muc);background:#f8f4ff;box-shadow:var(--bong);width:calc(390px * var(--ti) + 20px);height:calc(844px * var(--ti) + 20px)}
.man-that{display:block;width:390px;height:844px;border:0;transform:scale(var(--ti));transform-origin:0 0;pointer-events:none}

/* ── 3. một cuộc gọi: ghim lại, từng câu hiện ── */
.cuoc-goi{background:var(--dem);color:var(--dem-chu);background-image:linear-gradient(to right,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.04) 1px,transparent 1px);background-size:26px 26px}
.cuoc-goi .ghim{padding:clamp(72px,10vw,120px) 0}
.cuoc-goi h2{font-size:clamp(1.8rem,4.4vw,3rem);color:#fff;max-width:18ch}
.cuoc-goi .hinh-goi{justify-self:center;width:min(100%,420px);filter:drop-shadow(0 30px 50px rgba(0,0,0,.45))}
.loi-lua{list-style:none;padding:0;margin:32px 0 0;display:grid;gap:14px}
.loi-lua li{font-size:clamp(1.15rem,2.3vw,1.55rem);font-weight:700;line-height:1.4;color:#fff;padding:14px 20px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);max-width:30ch}
.ket-loi{margin-top:28px;font-size:clamp(1.2rem,2.4vw,1.6rem);font-weight:700;color:var(--vang);max-width:26ch}
.ghi-kich-ban{margin-top:14px;font-size:.85rem;color:var(--dem-phu)}

/* ── 4. Khoan đã ── */
.khoan{background:var(--tim-nen)}

/* ── 5. 60 giây ── */
.sau-muoi{background:var(--giay);border-block:1px solid var(--tim-vien)}
.so-dem{display:flex;align-items:baseline;gap:10px;color:var(--tim);font-weight:700}
.so-dem b{font-size:clamp(4.5rem,14vw,9rem);line-height:1.2;font-variant-numeric:tabular-nums;letter-spacing:-.04em}
.so-dem span{font-size:1.4rem}
.diem{list-style:none;padding:0;margin:26px 0 0;display:grid;gap:14px}
.diem li{display:flex;gap:12px;align-items:flex-start;font-size:1.12rem}
.diem li .bt{color:var(--tim);margin-top:4px}

/* ── 6. bạn biết kịp ── */
.biet-kip{background:var(--tim-nhat)}
.biet-kip .linh-vat{width:min(100%,400px)}

/* ── 7. chuẩn bị ── */
.viec{list-style:none;margin:26px 0 0;padding:0;display:grid;gap:16px}
.viec li{display:grid;grid-template-columns:40px 1fr;gap:14px;align-items:start}
.o-tich{width:40px;height:40px;border-radius:12px;border:2px solid var(--tim-1);display:grid;place-items:center;color:transparent;background:var(--giay);transition:background .5s var(--ra),color .5s var(--ra),border-color .5s var(--ra)}
.o-tich .bt{width:1.1em;height:1.1em;stroke-width:3}
.viec h3{font-size:1.1rem}
.viec p{color:var(--muc-phu);margin-top:2px}
.viec li.tich .o-tich,:root:not(.dong) .viec .o-tich{background:var(--tim);border-color:var(--tim);color:#fff}

/* ── 8. sau khi lỡ chuyển ── */
.sau{background:var(--giay);border-block:1px solid var(--tim-vien)}
.moc{list-style:none;margin:30px 0 0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);position:relative;max-width:30rem}
.moc::before,.moc::after{content:"";position:absolute;left:12.5%;right:12.5%;top:13px;height:4px;border-radius:4px;background:var(--tim-nhat)}
.moc::after{background:linear-gradient(90deg,var(--tim-1),var(--tim));transform-origin:0 50%;transform:scaleX(var(--p,1))}
.moc li{display:flex;flex-direction:column;align-items:center;gap:10px;font-weight:700;color:var(--muc-dam);font-size:.95rem;text-align:center;position:relative;z-index:1}
.moc li::before{content:"";width:30px;height:30px;border-radius:50%;background:var(--giay);border:4px solid var(--tim);transition:background .4s var(--ra)}
.moc li.sang::before,:root:not(.dong) .moc li::before{background:var(--tim)}

/* ── 9. cách quyết định ── */
.quyet{background:var(--tim-nen)}
.duong{list-style:none;padding:0;margin:40px 0 0;display:grid;gap:10px}
@media (min-width:760px){.duong{grid-template-columns:repeat(4,1fr);gap:0}}
.duong li{display:flex;align-items:center;gap:10px;font-weight:700}
.duong li span{flex:1;display:flex;align-items:center;min-height:72px;padding:14px 18px;border-radius:18px;background:var(--giay);border:1px solid var(--tim-vien);color:var(--muc-dam)}
.duong li:nth-child(3) span{background:var(--muc-dam);color:#fff;border-color:var(--muc-dam)}
.duong .bt{color:var(--tim);margin:0 6px}
.duong li:last-child .bt{display:none}
@media (max-width:759px){.duong li{flex-direction:column;align-items:stretch;gap:4px}.duong .bt{align-self:center;transform:rotate(90deg);margin:0}}
.chip-hang{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.chip{display:inline-flex;align-items:center;min-height:44px;padding:8px 18px;border-radius:999px;font-weight:700}
.chip-cao{background:var(--do-nen);color:var(--do-chu)}
.chip-nghi{background:var(--vang-nen);color:var(--vang-chu)}
.chip-chua{background:var(--la-nen);color:var(--la-chu)}
.ba-muc{margin-top:48px;display:grid;gap:28px}
@media (min-width:900px){.ba-muc{grid-template-columns:1fr 1fr;gap:56px;align-items:start}}
.ba-muc h3{font-size:1.1rem}
.ket-luan{margin-top:14px;border-radius:var(--bo-vua);border:1px solid var(--tim-vien);background:var(--giay);padding:20px 22px}
.ket-luan .chip{font-size:1.1rem}
.ket-luan p{margin-top:12px;font-size:1.1rem;font-weight:700}
.ket-luan p span{display:block;font-weight:500;color:var(--muc-phu)}
.link-lon{display:inline-flex;align-items:center;gap:8px;margin-top:28px;min-height:var(--cham);font-weight:700}
.quyet .linh-vat{width:min(100%,280px);justify-self:start}

/* ── 10. web / Android ── */
.hai-ban{display:grid;gap:20px;margin-top:32px}
@media (min-width:900px){.hai-ban{grid-template-columns:1fr 1fr;gap:28px}}
.ban{background:var(--giay);border:1px solid var(--tim-vien);border-radius:var(--bo);padding:26px 24px}
.ban-android{background:var(--muc-dam);color:var(--dem-chu);border-color:var(--muc-dam)}
.ban h3{font-size:1.15rem}
.ban-android h3{color:#fff}
.ban ul{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:12px}
.ban li{display:flex;gap:10px;align-items:flex-start}
.ban li .bt{color:var(--tim);margin-top:3px}
.ban-android li .bt{color:var(--vang)}

/* ── 11. cài đặt ── */
.cai{background:var(--tim-nhat)}
.cai-luoi{display:grid;gap:36px;margin-top:28px}
@media (min-width:900px){.cai-luoi{grid-template-columns:1.2fr .8fr;gap:48px;align-items:start}}
.canh-bao{display:flex;gap:14px;background:var(--giay);border:2px solid var(--vang-dam);border-radius:var(--bo-vua);padding:20px}
.canh-bao .bt{color:var(--vang-dam);width:1.6em;height:1.6em;margin-top:2px}
.canh-bao h3{font-size:1.1rem}
.canh-bao p{margin-top:6px}
.buoc{list-style:none;counter-reset:b;padding:0;margin:28px 0 0;display:grid;gap:18px}
.buoc li{counter-increment:b;display:grid;grid-template-columns:48px 1fr;gap:14px;align-items:start}
.buoc li::before{content:counter(b);display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:var(--muc-dam);color:#fff;font-weight:700;font-size:1.2rem}
.buoc li p{padding-top:9px}
.hop-tai{background:var(--giay);border-radius:var(--bo);padding:26px 24px;box-shadow:var(--bong)}
.hop-tai .nut{width:100%}
.hop-tai .phien-ban{margin-top:12px;text-align:center;font-weight:700;color:var(--muc-phu)}
.hop-tai .phu{margin-top:16px;font-size:.95rem}
.dia-chi{margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid var(--tim-nhat)}
.dia-chi p{color:var(--muc-phu);font-size:.95rem}
.dia-chi .dia-chi-lon{margin-top:6px;font-size:1.3rem;font-weight:700;color:var(--muc-dam)}
.dia-chi-lon span{display:inline-block}
details{margin-top:18px;border-top:1px solid var(--tim-nhat);padding-top:12px}
summary{cursor:pointer;min-height:var(--cham);display:flex;align-items:center;font-weight:700}
.bam{font-family:ui-monospace,Consolas,monospace;font-size:.85rem;word-break:break-all;margin-top:4px;background:var(--tim-nen);padding:8px 10px;border-radius:10px}
.nhan-bam{margin-top:10px;font-size:.85rem;color:var(--muc-phu)}

/* ── 12. không làm ── */
.khong-lam ul{list-style:none;padding:0;margin:28px 0 0;display:grid;gap:14px}
@media (min-width:900px){.khong-lam ul{grid-template-columns:1fr 1fr;column-gap:48px}}
.khong-lam li{display:flex;gap:12px;align-items:flex-start;font-size:1.05rem}
.khong-lam li .bt{color:var(--tim);margin-top:4px}

/* ── 13. đóng ── */
.dong-trang{background:linear-gradient(135deg,var(--tim-1),var(--tim-2));color:var(--muc)}
.dong-trang .vua{color:var(--muc)}
.dong-trang p{margin-top:16px;font-size:1.12rem;max-width:52ch}
.dong-trang .hang-nut{margin-top:28px}
.dong-trang .nut-phu{border-color:var(--muc)}
.dong-trang .linh-vat{width:min(100%,380px)}

.chan{padding:32px 0 48px;color:var(--muc-phu);font-size:.9rem}
.chan-trong{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center}
.chan a{display:inline-flex;align-items:center;min-height:var(--cham);font-weight:700}
.chan strong{color:var(--muc-dam)}

/* ── ĐIỆN THOẠI: ảnh nhỏ làm biểu tượng đầu chương, nút hết bề ngang, bớt khoảng trống ── */
@media (max-width:899px){
  .mo-dau{min-height:0;padding:8px 0 44px}
  .mo-dau-luoi{gap:4px}
  .linh-vat,.mo-dau .linh-vat,.cuoc-goi .hinh-goi,.dong-trang .linh-vat,.quyet .linh-vat,.biet-kip .linh-vat{order:-1;justify-self:start;width:168px;margin:0 0 -4px -12px}
  .hang-nut{flex-direction:column;gap:12px}
  .hang-nut .nut{width:100%}
  .cuon{margin-top:28px}
  .chuong{padding:56px 0}
  .chuong-luoi{gap:28px}
  .cuoc-goi .ghim{padding:56px 0}
  .loi-lua{margin-top:24px}
  .dien-thoai{--ti:.66}
  .duong li span{min-height:56px}
  .dia-chi .dia-chi-lon{font-size:1.1rem}
}

/* ═════ CHUYỂN ĐỘNG — chỉ khi script chạy và người dùng không tắt chuyển động ═════ */
.dong [data-hien]{opacity:0;transform:translateY(32px);filter:blur(6px);transition:opacity 1s var(--ra),transform 1s var(--ra),filter 1s var(--ra)}
.dong [data-hien="trai"]{transform:translateX(-48px)}
.dong [data-hien="phai"]{transform:translateX(48px)}
.dong [data-hien="to"]{transform:scale(.92)}
.dong [data-hien].hien{opacity:1;transform:none;filter:none}
.dong [data-tre="1"]{transition-delay:.12s}.dong [data-tre="2"]{transition-delay:.24s}.dong [data-tre="3"]{transition-delay:.36s}.dong [data-tre="4"]{transition-delay:.48s}
.dong .mo-dau h1 span{animation:len 1.1s var(--ra) both}
.dong .mo-dau h1 .h1b{animation-delay:.55s}
.dong .linh-vat-troi{animation:troi 6s ease-in-out infinite}
.dong .chay-trong{animation:chay 34s linear infinite}
.dong .cuoc-goi[data-ghim]{height:320vh}
.dong .cuoc-goi .ghim{position:sticky;top:0;min-height:100svh;display:flex;align-items:center}
.dong [data-buoc]{opacity:.1;transform:translateY(10px);transition:opacity .6s var(--ra),transform .6s var(--ra)}
.dong [data-buoc].bat{opacity:1;transform:none}
.dong .cuon .bt{animation:nay 1.8s ease-in-out infinite}
@keyframes len{from{opacity:0;transform:translateY(40px);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
@keyframes troi{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes chay{to{transform:translateX(-50%)}}
@keyframes nay{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
@media (max-width:899px){.dong .cuoc-goi[data-ghim]{height:auto}.dong .cuoc-goi .ghim{position:static;min-height:0}}
`;

/*
 * Script duy nhất của trang. Không có nó trang vẫn đủ nội dung (xem ghi chú đầu tệp).
 * ⚠️ Chữ trong script cũng nằm trong HTML: đừng viết chữ người đọc thấy ở đây.
 */
const JS = `(function(){
  var d=document.documentElement;
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('khong-dong');return;}
  d.classList.add('dong');
  var io=new IntersectionObserver(function(ds){ds.forEach(function(e){if(e.isIntersecting){e.target.classList.add('hien');io.unobserve(e.target);}});},{rootMargin:'0px 0px -10% 0px',threshold:0.12});
  document.querySelectorAll('[data-hien]').forEach(function(el){io.observe(el);});
  var tien=document.querySelector('.tien-do span'),ghim=document.querySelector('[data-ghim]'),dem=document.querySelector('[data-dem]'),
      viec=document.querySelector('[data-viec]'),moc=document.querySelector('[data-moc]'),cho=false;
  function kep(x){return x<0?0:x>1?1:x;}
  function tienTrinh(el){var r=el.getBoundingClientRect(),h=innerHeight;return kep((h*0.85-r.top)/(r.height+h*0.35));}
  function ve(){
    cho=false;var h=innerHeight,dai=d.scrollHeight-h;
    if(tien)tien.style.transform='scaleX('+(dai>0?kep(scrollY/dai):0)+')';
    if(ghim){var r=ghim.getBoundingClientRect(),p=r.height>h?kep(-r.top/(r.height-h)):tienTrinh(ghim),
      buoc=ghim.querySelectorAll('[data-buoc]'),n=Math.ceil(p*(buoc.length+0.6));
      buoc.forEach(function(el,i){el.classList.toggle('bat',i<n);});}
    if(dem){var b=dem.querySelector('.so-dem b');if(b){var s=60-Math.round(tienTrinh(dem)*60);b.textContent=(s<10?'0':'')+s;}}
    if(viec){var li=viec.querySelectorAll('li'),k=Math.ceil(tienTrinh(viec)*1.5*li.length);li.forEach(function(el,i){el.classList.toggle('tich',i<k);});}
    if(moc){var q=kep(tienTrinh(moc)*1.6),m=moc.querySelectorAll('li');moc.style.setProperty('--p',q);m.forEach(function(el,i){el.classList.toggle('sang',q>=i/(m.length-1)-0.001);});}
  }
  addEventListener('scroll',function(){if(!cho){cho=true;requestAnimationFrame(ve);}},{passive:true});
  addEventListener('resize',ve);ve();
})();`;

function dungTrangGioiThieu(ngonNgu = 'vi', { apk = null, anh = [] } = {}) {
  const l = ngonNgu === 'en' ? 'en' : 'vi';
  const c = CHU[l];
  const t = (k) => esc(c[k]);
  const khac = l === 'vi' ? 'en' : 'vi';
  const goc = 'https://khoan-da.onrender.com';
  const duongTrang = l === 'en' ? '/gioi-thieu?lang=en' : '/gioi-thieu';
  const duongMinhBach = l === 'en' ? '/transparency?lang=en' : '/transparency';
  const coAnh = new Set(anh);

  /** Ảnh AI nếu đã tạo, không thì linh vật (768×512, nền trong). Trang trí: alt rỗng. */
  const hinh = (tenAi, linhVat, lop = '', tai = 'lazy') => (coAnh.has(tenAi)
    ? `<img class="${lop} anh-ai" src="/anh-gioi-thieu/${tenAi}.webp" alt="" width="1400" height="933" loading="${tai}" decoding="async">`
    : `<img class="${lop}" src="/minh-hoa-${linhVat}.webp" alt="" width="768" height="512" loading="${tai}" decoding="async">`);

  /** Màn thật chụp sẵn: iframe tĩnh (CSP cấm script ở /man-that), chữ mô tả nằm ở figcaption. */
  let daGhiMau = false;
  const manThat = (ten, khoaChu, hieu = '', tai = 'lazy') => {
    // "Chụp từ app thật, dữ liệu mẫu" ghi MỘT lần — lặp dưới cả bốn màn là chữ xám rườm rà.
    const mau = daGhiMau ? '' : `<span>${t('duLieuMau')}</span>`;
    daGhiMau = true;
    return `<figure class="dien-thoai"${hieu ? ` data-hien="${hieu}"` : ''}>
          <div class="vo-may"><iframe class="man-that" src="/man-that/${ten}.${l}.html" title="${t(khoaChu)}" width="390" height="844" loading="${tai}" tabindex="-1" aria-hidden="true" sandbox="allow-same-origin"></iframe></div>
          <figcaption class="chu-thich">${t(khoaChu)}${mau}</figcaption>
        </figure>`;
  };

  const dayChay = c.chay.map((x) => `<span>${esc(x)}</span>`).join('');
  const webCo = c.ssHang.filter((h) => h[1]).map((h) => `<li>${BT.co}<span>${esc(h[0])}</span></li>`).join('');
  const androidThem = c.ssHang.filter((h) => !h[1]).map((h) => `<li>${BT.co}<span>${esc(h[0])}</span></li>`).join('');

  const hopTai = apk ? `
        <div class="hop-tai" data-hien="phai">
          <div class="dia-chi"><p>${t('caiDiaChiNhan')}</p><p class="dia-chi-lon"><span>khoan-da.onrender.com</span><span>/gioi-thieu</span></p></div>
          <a class="nut nut-chinh" href="/khoan-da.apk" download>${BT.tai}<span>${t('caiNut')}</span></a>
          <p class="phien-ban">${esc(c.caiPhienBan.replace('{v}', apk.phienBan || '').replace('{kt}', dinhDangMb(apk.kichThuocByte, l)))}</p>
          <p class="phu">${t('caiMayCu')}</p>
          <p class="phu">${t('caiIphone')}</p>
          <details>
            <summary>${t('caiKiemTep')}</summary>
            <p class="nhan-bam">${t('caiVanTay')}</p>
            <p class="bam">${esc(chiaCap(VAN_TAY_CHUNG_CHI))}</p>
            <p class="nhan-bam">${t('caiBamTep')}</p>
            <p class="bam">${esc(apk.bamTep)}</p>
          </details>
        </div>` : `
        <div class="hop-tai">
          <p>${t('caiChuaCo')}</p>
          <p class="phu">${t('caiIphone')}</p>
          <a class="nut nut-phu" href="/">${t('nutWeb')}</a>
        </div>`;

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t('tieuDeTrang')}</title>
<meta name="description" content="${t('moTa')}">
<meta name="theme-color" content="#9e76ea">
<link rel="icon" href="/logo-192.png">
<link rel="canonical" href="${goc}${duongTrang}">
<link rel="alternate" hreflang="vi" href="${goc}/gioi-thieu">
<link rel="alternate" hreflang="en" href="${goc}/gioi-thieu?lang=en">
<meta property="og:type" content="website">
<meta property="og:title" content="${t('tieuDeTrang')}">
<meta property="og:description" content="${t('moTa')}">
<meta property="og:url" content="${goc}${duongTrang}">
<meta property="og:image" content="${goc}/logo-512.png">
<meta property="og:locale" content="${l === 'vi' ? 'vi_VN' : 'en_US'}">
<link rel="preload" href="/phong-chu/quicksand-vietnamese-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
</head>
<body>
<!--
THESIS: Kể một cuộc gọi lừa đảo theo nhịp cuộn — từng câu ép, rồi "Khoan đã.", rồi 60 giây, rồi con cháu vào cuộc. Từ chối trang tính năng xếp lưới.
OWN-WORLD: tím #9e76ea→#ad8af0, mực #1e1b4b/#2e1065, nền kẻ ô 26px, Quicksand tự nạp, linh vật quả cầu tím, dải chữ chạy, chương "cuộc gọi" nền đêm #170d33.
STORY: con cháu hiểu kẻ lừa thắng nhờ gấp gáp và cô lập, thấy màn thật của app chen vào đúng lúc, rồi mở web hoặc cài APK theo các bước có rào chắn.
FIRST VIEWPORT: hai dòng tiêu đề hiện lần lượt, linh vật trôi bên phải, hai nút, lời mời kéo xuống.
FORM: kể chuyện khi cuộn theo tham chiếu người dùng ghim (The IELTS Dictionary /about-tid); thay cấu trúc 7/7 khoá seed 7186b074.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->
<div class="tien-do" aria-hidden="true"><span></span></div>
<a class="nhay" href="#noi-dung">${t('nhayNoiDung')}</a>
<header class="dau">
  <div class="khung dau-trong">
    <a class="thuong-hieu" href="${duongTrang}" aria-label="${t('veDau')}"><img src="/logo-192.png" width="44" height="44" alt=""><span>Khoan Đã</span></a>
    <span class="khau-hieu">${t('khauHieu')}</span>
    <a class="nut-nho" href="${khac === 'en' ? '/gioi-thieu?lang=en' : '/gioi-thieu'}" hreflang="${khac}" lang="${khac}" aria-label="${t('doiNgonNguNhan')}">${t('doiNgonNgu')}</a>
  </div>
</header>

<main id="noi-dung">
  <section class="mo-dau" aria-labelledby="h-mo-dau">
    <div class="khung mo-dau-luoi">
      <div>
        <h1 id="h-mo-dau"><span>${t('h1a')}</span> <span class="h1b">${t('h1b')}</span></h1>
        <p class="dan" data-hien data-tre="2">${t('dan')}</p>
        <div class="hang-nut" data-hien data-tre="3">
          <a class="nut nut-chinh" href="/">${t('nutWeb')}</a>
          <a class="nut nut-phu" href="#android">${t('nutAndroid')}</a>
        </div>
        <p class="ghi-nho" data-hien data-tre="4">${t('ghiNho')}</p>
        <a class="cuon" href="#h-cuoc-goi">${BT.xuong}<span>${t('cuonXuong')}</span></a>
      </div>
      <div class="linh-vat" data-hien="to" data-tre="2">${hinh('mo-dau', 1, 'linh-vat-troi', 'eager')}</div>
    </div>
  </section>

  <div class="chay" aria-hidden="true"><div class="chay-trong">${dayChay}${dayChay}${dayChay}${dayChay}</div></div>

  <section class="van-de cuoc-goi" data-ghim aria-labelledby="h-cuoc-goi">
    <div class="ghim">
      <div class="khung chuong-luoi">
        <div class="hinh-goi">${hinh('cuoc-goi', 5)}</div>
        <div>
          <h2 id="h-cuoc-goi">${t('c1TieuDe')}</h2>
          <ol class="loi-lua">${c.c1Loi.map((x) => `<li data-buoc>${esc(x)}</li>`).join('')}</ol>
          <p class="ket-loi" data-buoc>${t('c1Ket')}</p>
          <p class="ghi-kich-ban">${t('c1Ghi')}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="chuong khoan" aria-labelledby="h-khoan">
    <div class="khung chuong-luoi">
      <div>
        <h2 id="h-khoan" class="to" data-hien="to">${t('c2TieuDe')}</h2>
        <p class="lon" data-hien data-tre="1">${t('c2Doan')}</p>
        <p class="phu" data-hien data-tre="2">${t('c2Phu')}</p>
      </div>
      ${manThat('tro-ly', 'capTroLy', 'phai')}
    </div>
  </section>

  <section class="chuong sau-muoi" data-dem aria-labelledby="h-60">
    <div class="khung chuong-luoi dao">
      <div>
        <p class="so-dem" aria-hidden="true"><b>60</b><span>${t('giay')}</span></p>
        <h2 id="h-60" class="vua" data-hien>${t('c3TieuDe')}</h2>
        <ul class="diem">${c.c3Diem.map((x, i) => `<li data-hien data-tre="${i + 1}">${BT.co}<span>${esc(x)}</span></li>`).join('')}</ul>
      </div>
      ${manThat('khan-cap', 'capKhanCap', 'trai')}
    </div>
  </section>

  <section class="chuong biet-kip" aria-labelledby="h-biet-kip">
    <div class="khung chuong-luoi">
      <div>
        <h2 id="h-biet-kip" class="vua" data-hien>${t('c4TieuDe')}</h2>
        <p class="lon" data-hien data-tre="1">${t('c4Doan')}</p>
        <p class="phu" data-hien data-tre="2">${t('c4Phu')}</p>
      </div>
      <div class="linh-vat" data-hien="phai">${hinh('con-chau', 4)}</div>
    </div>
  </section>

  <section class="chuong chuan-bi" aria-labelledby="h-chuan-bi">
    <div class="khung chuong-luoi dao">
      <div>
        <h2 id="h-chuan-bi" class="vua" data-hien>${t('c5TieuDe')}</h2>
        <p class="phu" data-hien data-tre="1">${t('c5Dan')}</p>
        <ul class="viec" data-viec>${c.c5Viec.map(([ten, mo]) => `<li><span class="o-tich" aria-hidden="true">${BT.co}</span><div><h3>${esc(ten)}</h3><p>${esc(mo)}</p></div></li>`).join('')}</ul>
      </div>
      ${manThat('quy-tac', 'capQuyTac', 'trai')}
    </div>
  </section>

  <section class="chuong sau" aria-labelledby="h-sau">
    <div class="khung chuong-luoi">
      <div>
        <h2 id="h-sau" class="vua" data-hien>${t('c6TieuDe')}</h2>
        <p class="lon" data-hien data-tre="1">${t('c6Doan')}</p>
        <ol class="moc" data-moc aria-label="${t('c6MocNhan')}">${c.c6Moc.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>
        <p class="phu" data-hien data-tre="2">${t('c6Phu')}</p>
      </div>
      ${manThat('phuc-hoi', 'capPhucHoi', 'phai')}
    </div>
  </section>

  <section class="chuong quyet" aria-labelledby="h-quyet">
    <div class="khung">
      <div class="chuong-luoi">
        <div>
          <h2 id="h-quyet" class="vua" data-hien>${t('qdTieuDe')}</h2>
          <p class="lon" data-hien data-tre="1">${t('qdDoan')}</p>
        </div>
        <div class="linh-vat" data-hien="phai">${hinh('khoan-da', 2)}</div>
      </div>
      <ol class="duong" aria-label="${t('qdBuocNhan')}">${c.qdBuoc.map((b, i) => `<li data-hien data-tre="${i + 1}"><span>${esc(b)}</span>${BT.mui}</li>`).join('')}</ol>
      <div class="ba-muc">
        <div data-hien>
          <h3>${t('qdBaMuc')}</h3>
          <div class="chip-hang"><span class="chip chip-cao">${t('nhanCao')}</span><span class="chip chip-nghi">${t('nhanNghiNgo')}</span><span class="chip chip-chua">${t('nhanChuaThay')}</span></div>
        </div>
        <div data-hien data-tre="1">
          <p class="phu">${t('qdKhongHua')}</p>
          <div class="ket-luan" role="group" aria-label="${t('qdViDuNhan')}">
            <span class="chip chip-nghi">${t('nhanNghiNgo')}</span>
            <p>${t('qdChuaKiem')}<span>${t('qdChuaKiem1')}</span></p>
          </div>
        </div>
      </div>
      <a class="link-lon" href="${duongMinhBach}">${t('qdLink')} ${BT.mui}</a>
    </div>
  </section>

  <section class="chuong so-sanh" aria-labelledby="h-so-sanh">
    <div class="khung">
      <h2 id="h-so-sanh" class="vua" data-hien>${t('ssTieuDe')}</h2>
      <div class="hai-ban">
        <div class="ban" data-hien><h3>${t('ssWebTen')}</h3><ul>${webCo}</ul></div>
        <div class="ban ban-android" data-hien data-tre="1"><h3>${t('ssAndroidTen')}</h3><ul>${androidThem}</ul></div>
      </div>
    </div>
  </section>

  <section class="chuong cai" id="android" aria-labelledby="h-cai">
    <div class="khung">
      <h2 id="h-cai" class="vua" data-hien>${t('caiTieuDe')}</h2>
      <div class="cai-luoi">
        <div>
          <div class="canh-bao" data-hien>${BT.canh}<div><h3>${t('caiCanhBaoTieuDe')}</h3><p>${t('caiCanhBao')}</p></div></div>
          <ol class="buoc">${c.caiBuoc.map((b) => `<li><p>${esc(b)}</p></li>`).join('')}</ol>
        </div>${hopTai}
      </div>
    </div>
  </section>

  <section class="chuong khong-lam" aria-labelledby="h-khong-lam">
    <div class="khung">
      <h2 id="h-khong-lam" class="vua" data-hien>${t('kkTieuDe')}</h2>
      <ul>${c.kk.map((k, i) => `<li data-hien data-tre="${(i % 2) + 1}">${BT.co}<span>${esc(k)}</span></li>`).join('')}</ul>
      <a class="link-lon" href="/chinh-sach-rieng-tu.html${l === 'en' ? '#en' : ''}">${t('kkLink')} ${BT.mui}</a>
    </div>
  </section>

  <section class="chuong dong-trang" aria-labelledby="h-dong">
    <div class="khung chuong-luoi">
      <div>
        <h2 id="h-dong" class="vua" data-hien>${t('dongTieuDe')}</h2>
        <p data-hien data-tre="1">${t('dongDoan')}</p>
        <div class="hang-nut" data-hien data-tre="2">
          <a class="nut nut-dac" href="/">${t('nutWeb')}</a>
          <a class="nut nut-phu" href="mailto:${EMAIL_LIEN_HE}">${t('dongNutThu')}</a>
        </div>
      </div>
      <div class="linh-vat" data-hien="to">${hinh('sau', 3)}</div>
    </div>
  </section>
</main>

<footer class="chan">
  <div class="khung chan-trong">
    <strong>Khoan Đã</strong><span>${t('khauHieu')}</span>
    <a href="/">${t('chanMoApp')}</a>
    <a href="${duongMinhBach}">${t('chanSoDo')}</a>
    <a href="/chinh-sach-rieng-tu.html${l === 'en' ? '#en' : ''}">${t('chanRiengTu')}</a>
    <a href="mailto:${EMAIL_LIEN_HE}">${esc(EMAIL_LIEN_HE)}</a>
  </div>
</footer>
<script>${JS}</script>
</body>
</html>`;
}

module.exports = { dungTrangGioiThieu, docThongTinApk, CHU, VAN_TAY_CHUNG_CHI, EMAIL_LIEN_HE, ANH_AI };
