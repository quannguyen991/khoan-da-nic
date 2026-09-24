'use strict';
/**
 * /gioi-thieu — TRANG GIỚI THIỆU KHOAN ĐÃ. Dựng HTML ở máy chủ, KHÔNG CẦN JavaScript.
 *
 * Người đọc chính là CON CHÁU 30–50 tuổi — người sẽ cài app giúp bố mẹ (PRODUCT.md).
 * Không nhắm quảng cáo thẳng vào người già: app tự xưng "bảo vệ bác" thì bác nghi.
 *
 * ⚠️ MỖI TÍNH NĂNG NÊU Ở ĐÂY ĐÃ ĐỐI CHIẾU VỚI CODE NGÀY 24/9/2026. Cố ý KHÔNG nêu:
 *   · quét mã QR (chưa làm), "Đi cùng bác", trợ lý gọi ngân hàng (chưa có màn);
 *   · kiểm ẢNH — máy chủ hiện không có AI đọc ảnh (`coThiGiac:false`), ảnh rơi vào
 *     "chưa kiểm". Bật AI đọc ảnh rồi mới được thêm lại;
 *   · số khẩn cấp là "đã xác minh" — mã nguồn còn ghi "nên được người duyệt đối chiếu".
 * Thêm hay bớt tính năng thì sửa trang này CÙNG commit. Trang giới thiệu nói quá là
 * lời hứa sai với đúng người đang tin mình nhất.
 *
 * ⚠️ MỌI CHUỖI NGƯỜI ĐỌC NẰM TRONG `CHU`, và `test/trang-gioi-thieu.test.js` chặn
 * việc hai ngôn ngữ lệch khoá nhau (cùng lý do với safety-card-page.js).
 *
 * ⚠️ NÚT TẢI APK KHÔNG TRỎ THẲNG VÀO TỆP. Nút ở phần mở đầu dẫn xuống mục cài đặt,
 * nơi có lời cảnh báo "Khoan Đã không bao giờ gửi link tải app" và các bước tắt lại
 * quyền cài từ nguồn không rõ. Chính bộ luật của app chấm tin mời tải .apk là CAO —
 * trang này không được dạy ngược điều app dạy.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Chứng chỉ ký bản phát hành (khoá tạo bằng scripts/tao-khoa-phat-hanh.js, CN=Khoan Da, C=VN). */
const VAN_TAY_CHUNG_CHI = '6a5ee25c2572d4dad07fb0bfce5fb640b01ae43f39d06c107eb5f02270f2812f';

const EMAIL_LIEN_HE = 'quannxm.sags@gmail.com';

const CHU = {
  vi: {
    tieuDeTrang: 'Khoan Đã — giúp bố mẹ dừng lại trước cuộc gọi lừa đảo',
    moTa: 'Ứng dụng cho cả nhà: bố mẹ kể lại hoặc dán tin nhắn lạ, Khoan Đã chỉ ra dấu hiệu lừa đảo, giữ bố mẹ lại 60 giây và kéo con cháu vào cuộc.',
    khauHieu: 'Dừng lại. Kiểm tra. Bảo vệ.',
    nhayNoiDung: 'Bỏ qua, tới nội dung chính',
    doiNgonNgu: 'English',
    doiNgonNguNhan: 'Xem trang này bằng tiếng Anh',
    veDau: 'Khoan Đã — về đầu trang giới thiệu',

    h1: 'Kẻ lừa đảo cần bố mẹ bạn vội. Khoan Đã giúp bố mẹ dừng lại.',
    dan: 'Bố mẹ kể lại chuyện vừa xảy ra hoặc dán tin nhắn lạ. Khoan Đã chỉ ra dấu hiệu lừa đảo, giữ bố mẹ lại 60 giây và kéo bạn vào cuộc.',
    nutWeb: 'Mở Khoan Đã trên web',
    nutAndroid: 'Cài bản Android cho bố mẹ',
    ghiNho: 'Miễn phí · Không quảng cáo · Tiếng Việt và tiếng Anh',

    mayNhan: 'Minh hoạ màn Nói cho cháu nghe',
    mayTieuDe: 'Nói cho cháu nghe',
    aiBac: 'Bác kể:',
    loiBac: 'Ngân hàng bảo chuyển tiền, không thì tài khoản bị khoá.',
    aiChau: 'Khoan Đã đáp:',
    loiDap1: 'Bác khoan chuyển tiền đã.',
    loiDap2: 'Bác ơi, ngân hàng gọi điện hay nhắn tin bảo vậy ạ?',
    mayNut: 'Kiểm tin này ngay',
    chuThichMay: 'Câu đầu do bộ luật cố định thêm vào ngay khi thấy dấu hiệu. Câu sau là AI trò chuyện, mỗi lần mỗi khác.',

    vdTieuDe: 'Người đang bị lừa sẽ không tự mở một ứng dụng',
    vdDoan1: 'Lừa đảo qua điện thoại thắng bằng hai thứ: sự gấp gáp và sự cô lập. “Phải làm ngay”, “đừng nói với ai”. Người đang bị ép như vậy không tự tìm đến một ứng dụng để hỏi.',
    vdDoan2: 'Nên Khoan Đã không chỉ là một ô để dán tin nhắn. Nó được chuẩn bị từ trước cùng con cháu, có mặt đúng lúc cuộc gọi đang diễn ra, và vẫn ở đó sau khi lỡ chuyển tiền.',

    truocTen: 'Trước',
    truocTieuDe: 'khi có cuộc gọi: bạn chuẩn bị cùng bố mẹ',
    truocDan: 'Một lần ngồi cùng bố mẹ, làm các việc này:',
    truoc1T: 'Lưu số của bạn',
    truoc1: 'Nút “Gọi người nhà” trên màn chính gọi thẳng cho bạn.',
    truoc2T: 'Nối máy bằng mã 6 số',
    truoc2: 'Bố mẹ lấy mã trong Cài đặt, bạn nhập trên máy mình. Khi bố mẹ bật “báo cho con”, bạn nhận cảnh báo lúc bố mẹ gặp tình huống nguy hiểm cao.',
    truoc3T: 'Đặt quy tắc nhà mình',
    truoc3: 'Tối đa ba câu do cả nhà tự viết. Lần tới gặp chuyện, Khoan Đã nhắc lại đúng câu đó.',
    truoc4T: 'Đặt mật khẩu gia đình',
    truoc4: 'Ai gọi xưng là con cháu mà không nói được mật khẩu thì dừng lại. App chỉ lưu câu nhắc, không lưu mật khẩu.',
    truoc5T: 'Học năm bài ngắn',
    truoc5: 'Các kiểu lừa hay gặp, mỗi bài có câu đố.',
    toQuyTac: 'Quy tắc nhà mình',
    quyTac1: 'Nhà mình không đọc mã OTP cho ai qua điện thoại.',
    quyTac2: 'Ai đòi chuyển tiền gấp thì gọi con trước đã.',
    viDuQuyTac: 'Ví dụ. Mỗi nhà tự viết quy tắc của mình.',
    maNoiMay: 'Mã nối máy',
    viDuMa: 'Ví dụ',

    trongTen: 'Trong',
    trongTieuDe: 'lúc đang bị gọi: Khoan Đã giữ bố mẹ lại',
    trong1T: 'Nói cho cháu nghe',
    trong1: 'Bố mẹ kể lại bằng giọng nói. Có dấu hiệu là app nhắc “khoan” ngay và đưa nút kiểm.',
    trong2T: 'Đang bị ai gọi?',
    trong2: 'Một câu hỏi: “Người ta đang yêu cầu bác làm gì?”, rồi vài câu Có hoặc Không. Bộ luật chấm, không cần gõ chữ.',
    trong3T: 'Khẩn cấp: dừng 60 giây',
    trong3: 'Đồng hồ đếm ngược, ba việc không làm, nút gọi bạn và gọi 113. Luôn có dòng “Tôi ổn, không có gì nguy hiểm” để thoát ra.',
    trong4T: 'Báo cho bạn',
    trong4: 'Nếu bố mẹ đã bật “báo cho con”, bạn nhận cảnh báo trên Chrome. Không ai phản ứng sau 60 giây thì báo lần hai.',
    trong5T: 'Báo ngay khi mã OTP về hoặc tiền đi ra',
    trong5: 'Trong lúc đang gọi, kể cả gọi qua Zalo hay Messenger. Nếu bố mẹ cho phép hiện trên ứng dụng khác, app tự mở màn dừng lại.',
    trong6T: 'Tự xem tin nhắn đến',
    trong6: 'Tin có từ hai dấu hiệu trở lên thì app hỏi bố mẹ có muốn kiểm không. Việc lọc chạy ngay trên máy, không gửi tin đi.',
    trong7T: 'Nhắc khi cuộc gọi kéo dài',
    trong7: 'Sau 25 phút, nếu bố mẹ bật.',
    chiAndroid: 'Bản Android',
    manDungNhan: 'Minh hoạ màn Khẩn cấp',
    giay: 'giây',
    dungTieuDe: 'Bác dừng lại 60 giây đã',
    dung1: 'Dừng cuộc gọi',
    dung2: 'Không chuyển tiền',
    dung3: 'Không đọc mã OTP',
    dungGoiCon: 'Gọi ngay cho con cháu',
    dungGoi113: 'Gọi cảnh sát 113',
    dungToiOn: 'Tôi ổn, không có gì nguy hiểm',

    sauTen: 'Sau',
    sauTieuDe: 'khi lỡ chuyển tiền: không để bố mẹ một mình',
    sau1T: 'Việc cần làm ngay',
    sau1: 'Bấm “Tôi đã lỡ chuyển tiền hoặc đọc mã rồi” để có các bước làm tăng khả năng xử lý, kèm số tổng đài của 11 ngân hàng đã được duyệt, có ghi nguồn.',
    sau2T: 'Theo dõi 72 giờ',
    sau2: 'Kẻ gian hay quay lại lần hai, kiểu “nộp phí để lấy lại tiền”. App nhắc ở các mốc 2, 24, 48 và 72 giờ. Bản Android nhắc cả khi app đã đóng.',
    sau3T: 'Nhớ vụ việc 14 ngày',
    sau3: 'Tin sau giống tin trước, app hỏi có phải cùng một người không. Phần nhớ này nằm trên máy.',
    sauMoc: ['2 giờ', '24 giờ', '48 giờ', '72 giờ'],
    sauMocNhan: 'Các mốc nhắc sau sự cố',
    sauKhongHua: 'Khoan Đã không hứa đòi lại được tiền. App giúp làm đúng việc, sớm nhất có thể.',

    qdTieuDe: 'AI chỉ trích dấu hiệu. Bộ luật cố định mới quyết mức rủi ro.',
    qdDoan: 'AI đọc tin và đánh dấu những gì nó thấy, như giả danh cơ quan, đòi chuyển tiền, đòi mã OTP. Mức rủi ro do một bộ luật viết sẵn tính ra, nên cùng một tin luôn cho cùng một kết luận, và đổi ngôn ngữ không làm đổi kết luận.',
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
    ssDan: 'Bản web mở được trên mọi máy, kể cả iPhone. Bản Android làm thêm những việc cần quyền của điện thoại.',
    ssCot: 'Tính năng',
    ssWeb: 'Web',
    ssAndroid: 'Android',
    ssCo: 'Có',
    ssKhong: 'Không',
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
      'Trên điện thoại của bố mẹ, mở trang này bằng Chrome rồi bấm “Tải tệp APK” bên dưới.',
      'Mở tệp vừa tải. Máy hỏi có cho Chrome cài ứng dụng không: bấm cho phép.',
      'Cài xong, tắt lại quyền đó: Cài đặt → Ứng dụng → Chrome → Cài ứng dụng không rõ nguồn. Tên mục có thể khác tuỳ máy.',
      'Mở Khoan Đã, chọn “Bác / bố mẹ”, rồi lưu số của bạn.',
      'Muốn app tự xem tin nhắn đến: Android 13 trở lên có thể báo “cài đặt bị hạn chế”. Vào Thông tin ứng dụng của Khoan Đã, bấm dấu ba chấm ở góc trên, chọn cho phép cài đặt bị hạn chế, rồi bật lại. Bạn làm giúp bố mẹ bước này, đừng hướng dẫn bố mẹ tự làm với ứng dụng khác.',
    ],
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

    dongTieuDe: 'Khoan Đã đang trong giai đoạn thử nghiệm',
    dongDoan: 'Dự án dự thi NextGen 2026. Chúng tôi chưa thử rộng với người cao tuổi ngoài gia đình. Nếu nhà bạn muốn dùng thử và góp ý, hãy viết cho chúng tôi.',
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

    h1: 'Scammers need your parents to hurry. Khoan Đã helps them pause.',
    dan: 'Your parents describe what just happened or paste a strange message. Khoan Đã points out scam signals, holds them for 60 seconds and pulls you in.',
    nutWeb: 'Open Khoan Đã on the web',
    nutAndroid: 'Install the Android app for them',
    ghiNho: 'Free · No ads · Vietnamese and English',

    mayNhan: 'Illustration of the Talk to me screen',
    mayTieuDe: 'Talk to me',
    aiBac: 'Parent says:',
    loiBac: 'The bank says transfer money or the account gets locked.',
    aiChau: 'Khoan Đã replies:',
    loiDap1: 'Hold off on that transfer.',
    loiDap2: 'Did the bank call you, or send a message?',
    mayNut: 'Check this now',
    chuThichMay: 'The first sentence is added by the fixed rules the moment they see a signal. The second is the AI conversation, different every time.',

    vdTieuDe: 'A person being scammed will not open an app on their own',
    vdDoan1: 'Phone scams win with two things: urgency and isolation. “Do it now.” “Don’t tell anyone.” Someone under that pressure does not go looking for an app to ask.',
    vdDoan2: 'So Khoan Đã is more than a box to paste messages into. It is set up in advance with the family, it is there while the call is happening, and it stays after money has gone.',

    truocTen: 'Before',
    truocTieuDe: 'the call: you set it up together',
    truocDan: 'One sitting with your parents covers all of this:',
    truoc1T: 'Save your number',
    truoc1: 'The “Call family” button on the main screen rings you directly.',
    truoc2T: 'Link phones with a 6-digit code',
    truoc2: 'Your parents get the code in Settings, you enter it on your phone. When they switch on “alert my family”, you are alerted when they hit a high-risk situation.',
    truoc3T: 'Write your family rules',
    truoc3: 'Up to three sentences the family writes itself. Next time something happens, Khoan Đã shows that exact sentence.',
    truoc4T: 'Set a family password',
    truoc4: 'Anyone calling as a relative who cannot say the password gets a pause. The app stores only the hint, never the password.',
    truoc5T: 'Five short lessons',
    truoc5: 'The common scam patterns, each with a quiz.',
    toQuyTac: 'Our family rules',
    quyTac1: 'We never read out an OTP code over the phone.',
    quyTac2: 'If anyone demands an urgent transfer, call your child first.',
    viDuQuyTac: 'Example. Each family writes its own.',
    maNoiMay: 'Linking code',
    viDuMa: 'Example',

    trongTen: 'During',
    trongTieuDe: 'the call: Khoan Đã holds them back',
    trong1T: 'Talk to me',
    trong1: 'Your parents describe it by voice. If there is a signal, the app says “hold off” at once and offers a check.',
    trong2T: 'Someone calling you?',
    trong2: 'One question, “What are you being asked to do?”, then a few yes-or-no answers. The rules decide; no typing needed.',
    trong3T: 'Emergency: Pause for 60 Seconds',
    trong3: 'A countdown, three things not to do, a button to call you and one for 113. “I am fine, nothing dangerous here” is always there as a way out.',
    trong4T: 'Alert you',
    trong4: 'If your parents switched on “alert my family”, you get an alert in Chrome. If nobody responds within 60 seconds, it alerts again.',
    trong5T: 'Warn when a code arrives or money leaves',
    trong5: 'During a call, including Zalo and Messenger calls. If your parents allowed display over other apps, the pause screen opens by itself.',
    trong6T: 'Screen incoming messages',
    trong6: 'A message with two or more signals gets a prompt asking whether to check it. Screening runs on the phone; nothing is sent.',
    trong7T: 'Long-call reminder',
    trong7: 'After 25 minutes, if switched on.',
    chiAndroid: 'Android app',
    manDungNhan: 'Illustration of the Emergency screen',
    giay: 'sec',
    dungTieuDe: 'Let us pause for 60 seconds',
    dung1: 'Hang up the call',
    dung2: 'Do not transfer money',
    dung3: 'Do not share the OTP code',
    dungGoiCon: 'Call family now',
    dungGoi113: 'Call police 113',
    dungToiOn: 'I am fine, nothing dangerous here',

    sauTen: 'After',
    sauTieuDe: 'money has gone: they are not left alone',
    sau1T: 'What to do right now',
    sau1: 'Tapping “I already sent money or read out a code” opens the steps that improve the chance of resolving it, with hotline numbers for 11 reviewed banks and their sources.',
    sau2T: '72-Hour Recovery Watch',
    sau2: 'Scammers often come back a second time, as in “pay a fee to get your money back”. The app reminds at 2, 24, 48 and 72 hours. The Android app reminds even when closed.',
    sau3T: 'Case memory for 14 days',
    sau3: 'When a new message looks like an earlier one, the app asks whether it is the same person. This memory stays on the phone.',
    sauMoc: ['2 hours', '24 hours', '48 hours', '72 hours'],
    sauMocNhan: 'Reminder points after an incident',
    sauKhongHua: 'Khoan Đã does not promise the money comes back. It helps do the right things, as early as possible.',

    qdTieuDe: 'AI only extracts signals. Fixed rules decide the risk level.',
    qdDoan: 'The AI reads the message and marks what it sees, such as someone impersonating an agency or demanding a transfer or an OTP code. A pre-written rulebook computes the risk level, so the same message always gets the same result, and switching language cannot change it.',
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
    ssDan: 'The web app opens on any phone, iPhone included. The Android app adds what needs phone permissions.',
    ssCot: 'Feature',
    ssWeb: 'Web',
    ssAndroid: 'Android',
    ssCo: 'Yes',
    ssKhong: 'No',
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
      'On your parent’s phone, open this page in Chrome and tap “Download the APK” below.',
      'Open the downloaded file. When the phone asks whether Chrome may install apps, allow it.',
      'After installing, switch that permission off again: Settings → Apps → Chrome → Install unknown apps. Menu names vary by phone.',
      'Open Khoan Đã, choose “Parent / grandparent”, then save your number.',
      'To screen incoming messages: Android 13 and later may say “restricted setting”. Open Khoan Đã’s App info, tap the three dots at the top, allow restricted settings, then switch it on again. Do this step for your parents; do not teach them to do it for other apps.',
    ],
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

    dongTieuDe: 'Khoan Đã is in its testing stage',
    dongDoan: 'A NextGen 2026 entry. We have not yet tested widely with older people outside our own families. If your family would like to try it and tell us what works, write to us.',
    chanSoDo: 'Published measurements',
    chanRiengTu: 'Privacy policy',
    chanMoApp: 'Open the app',
  },
};

/* ───────── APK: kích thước + mã băm, tính một lần cho mỗi phiên bản tệp ───────── */
let boNhoApk = null;
function docThongTinApk(duongApk, duongGradle = path.join(__dirname, '..', '..', 'android', 'app', 'build.gradle')) {
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
  khong: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
  cam: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
  mui: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  tai: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  canh: '<svg class="bt" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
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
  --giay:#fff; --vang:#fbbf24; --vang-dam:#b45309; --xanh:#2563eb;
  --do-nen:#fee2e2; --do-chu:#991b1b; --vang-nen:#fef3c7; --vang-chu:#854d0e; --la-nen:#dcfce7; --la-chu:#166534;
  --dem-chu:#f5f0ff; --dem-phu:#cdbef7;
  --cham:52px; --cham-chinh:max(56px,3.5rem); --le:16px;
  --bo:28px; --bo-vua:20px;
  --bong:0 18px 40px -18px rgba(46,16,101,.35),0 2px 6px rgba(46,16,101,.08);
  --ra:cubic-bezier(.16,1,.3,1);
}
*{box-sizing:border-box}
html{font-size:18px;-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (max-width:480px){html{font-size:17px}}
body{margin:0;font-family:"Quicksand",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-weight:500;color:var(--muc);line-height:1.6;
  background-color:var(--tim-nen);
  background-image:linear-gradient(to right,rgba(109,40,217,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(109,40,217,.07) 1px,transparent 1px);
  background-size:26px 26px}
h1,h2,h3{font-weight:700;line-height:1.28;text-wrap:balance;margin:0}
p{margin:0}
a{color:var(--muc-dam);text-underline-offset:3px}
:focus-visible{outline:3px solid var(--muc-dam);outline-offset:3px;border-radius:8px}
.an{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:normal}
.nhay{position:absolute;left:var(--le);top:-80px;z-index:10;background:var(--muc-dam);color:#fff;padding:12px 18px;border-radius:14px;min-height:var(--cham);display:inline-flex;align-items:center}
.nhay:focus{top:12px}
.khung{max-width:74rem;margin:0 auto;padding:0 var(--le)}
.bt{width:1.25em;height:1.25em;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}

/* đầu trang */
.dau{padding:14px 0}
.dau-trong{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.thuong-hieu{display:inline-flex;align-items:center;gap:10px;min-height:var(--cham);text-decoration:none;font-weight:700;font-size:1.15rem;color:var(--muc-dam)}
.thuong-hieu img{border-radius:12px}
.khau-hieu{color:var(--muc-phu);font-size:.9rem;flex:1 1 auto}
.nut-nho{display:inline-flex;align-items:center;min-height:var(--cham);padding:0 20px;border-radius:999px;border:2px solid var(--tim-vien);background:var(--giay);font-weight:700;text-decoration:none}

/* nút */
.nut{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:var(--cham-chinh);padding:14px 28px;border-radius:999px;font-weight:700;font-size:1.05rem;line-height:1.3;text-decoration:none;text-align:center;transition:transform .2s var(--ra),box-shadow .2s var(--ra)}
.nut:hover{transform:translateY(-2px)}
.nut:active{transform:translateY(0) scale(.98)}
.nut-chinh{color:var(--muc);background:linear-gradient(135deg,var(--tim-1),var(--tim-2));box-shadow:0 14px 30px -12px rgba(109,40,217,.55)}
.nut-phu{color:var(--muc);background:var(--giay);border:2px solid var(--tim-vien)}
.nut-vang{color:var(--muc);background:var(--vang);box-shadow:0 14px 30px -14px rgba(180,83,9,.6)}

/* mở đầu */
.mo-dau{padding:28px 0 72px}
.mo-dau-luoi{display:grid;gap:48px;align-items:center}
@media (min-width:900px){.mo-dau-luoi{grid-template-columns:1.15fr .85fr;gap:56px}.mo-dau{padding:48px 0 104px}}
.mo-dau h1{font-size:clamp(2.1rem,5.4vw,3.6rem);letter-spacing:-.02em;color:var(--muc-dam)}
.dan{font-size:1.2rem;color:var(--muc-phu);margin-top:22px;max-width:40ch}
.hang-nut{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}
.ghi-nho{margin-top:18px;color:var(--muc-phu);font-size:.9rem}

/* điện thoại minh hoạ */
.dien-thoai{margin:0;justify-self:center;width:min(100%,360px)}
.may{position:relative;border-radius:44px;border:10px solid var(--muc);background:radial-gradient(circle at 50% 22%,rgba(196,181,253,.6),transparent 46%),var(--tim-nen);padding:26px 18px 28px;box-shadow:var(--bong);display:flex;flex-direction:column;gap:14px;min-height:540px}
.may::before{content:"";position:absolute;top:8px;left:50%;width:84px;height:8px;border-radius:99px;background:var(--muc);transform:translateX(-50%);opacity:.9}
.may-tieu-de{text-align:center;font-weight:700;color:var(--muc-dam);margin-top:6px}
.qua-cau{width:112px;height:112px;margin:6px auto 4px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0,#e9dcff 18%,var(--tim-2) 52%,var(--tim) 100%);box-shadow:0 20px 40px -16px rgba(109,40,217,.6),inset 0 -8px 18px rgba(46,16,101,.25)}
.bong{padding:14px 16px;border-radius:22px;font-size:.95rem;line-height:1.5}
.bong-bac{align-self:flex-end;max-width:86%;background:var(--muc-dam);color:#fff;border-bottom-right-radius:8px}
.bong-chau{align-self:flex-start;max-width:92%;background:var(--giay);border:1px solid var(--tim-vien);border-bottom-left-radius:8px}
.bong-chau strong{display:block;color:var(--muc-dam)}
.may-nut{display:flex;align-items:center;justify-content:center;gap:8px;min-height:var(--cham-chinh);border-radius:999px;background:var(--vang);color:var(--muc);font-weight:700;margin-top:auto}
.chu-thich{margin-top:14px;font-size:.85rem;color:var(--muc-phu);text-align:center}
@media (prefers-reduced-motion:no-preference){
  .bong-bac{animation:hien .6s var(--ra) .25s both}
  .bong-chau{animation:hien .6s var(--ra) 1.35s both}
  .may-nut{animation:hien .5s var(--ra) 2.05s both}
}
@keyframes hien{from{opacity:0;transform:translateY(14px) scale(.97);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}

/* vấn đề */
.van-de{padding:72px 0;background:var(--giay);border-block:1px solid var(--tim-vien)}
.van-de-luoi{display:grid;gap:24px}
@media (min-width:900px){.van-de-luoi{grid-template-columns:1fr 1fr;gap:64px}}
.van-de h2{font-size:clamp(1.7rem,3.6vw,2.5rem);color:var(--muc-dam)}
.van-de p{font-size:1.1rem;color:var(--muc-phu)}
.van-de p+p{margin-top:16px}

/* ba hồi */
.hoi{padding:88px 0}
.hoi-dau{margin-bottom:40px}
.hoi h2{font-size:clamp(1.5rem,3.2vw,2.2rem);max-width:28ch}
.ten-hoi{display:block;font-size:clamp(3.6rem,11vw,6rem);line-height:1.25;letter-spacing:-.03em;color:var(--tim);margin-bottom:2px}
.hoi-luoi{display:grid;gap:40px;align-items:start}
@media (min-width:900px){.hoi-luoi{grid-template-columns:1.1fr .9fr;gap:64px}.hoi-dao .hoi-luoi{grid-template-columns:.9fr 1.1fr}.hoi-dao .hinh{order:-1}}
.dan-hoi{color:var(--muc-phu);margin-bottom:18px}
.viec{list-style:none;margin:0;padding:0;display:grid;gap:22px}
.viec h3{font-size:1.12rem;display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px}
.viec p{color:var(--muc-phu);margin-top:4px;max-width:58ch}
.the-android{display:inline-flex;align-items:center;min-height:30px;padding:2px 12px;border-radius:999px;font-size:.85rem;font-weight:700;background:var(--tim-nhat);color:var(--muc-dam)}

/* hồi Trước: tờ quy tắc */
.to-quy-tac{background:#fffdf4;border-radius:var(--bo-vua);padding:26px 24px 22px;box-shadow:var(--bong);transform:rotate(-1.2deg);border:1px solid #efe3b5;max-width:420px;justify-self:center;width:100%}
.to-quy-tac h3{font-size:1.2rem;color:var(--muc-dam)}
.to-quy-tac ul{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:12px}
.to-quy-tac li{display:flex;gap:10px;align-items:flex-start;font-size:1.02rem}
.to-quy-tac li .bt{color:var(--tim);margin-top:3px}
.vi-du{margin-top:16px;font-size:.85rem;color:var(--muc-phu)}
.ma-noi{margin-top:22px;padding-top:18px;border-top:1px dashed #e2d3a0}
.ma-noi p{font-size:.9rem;color:var(--muc-phu)}
.o-ma{display:flex;gap:8px;margin-top:8px}
.o-ma span{display:grid;place-items:center;width:42px;height:52px;border-radius:12px;background:var(--giay);border:2px solid var(--tim-vien);font-weight:700;font-size:1.3rem;color:var(--muc-dam)}

/* hồi Trong: dải tím đậm */
.hoi-trong{background:var(--muc-dam);color:var(--dem-chu);background-image:linear-gradient(to right,rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.05) 1px,transparent 1px);background-size:26px 26px}
.hoi-trong h2,.hoi-trong h3{color:#fff}
.hoi-trong .ten-hoi{color:var(--tim-2)}
.hoi-trong .viec p{color:var(--dem-phu)}
.hoi-trong .the-android{background:rgba(255,255,255,.14);color:#fff}
.man-dung{background:var(--tim-nen);color:var(--muc);border-radius:36px;padding:30px 22px 22px;box-shadow:0 30px 60px -24px rgba(0,0,0,.55);max-width:380px;width:100%;justify-self:center;text-align:center}
.vong{width:176px;height:176px;margin:0 auto;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--vang) 0 100%);position:relative;box-shadow:0 16px 34px -16px rgba(180,83,9,.55)}
.vong::after{content:"";position:absolute;inset:14px;border-radius:50%;background:var(--tim-nen)}
.vong span{position:relative;z-index:1;font-weight:700;font-size:3rem;line-height:1.1;color:var(--muc-dam)}
.vong small{display:block;font-size:.85rem;line-height:1.3;color:var(--muc-phu);margin-top:4px}
.man-dung h3{font-size:1.25rem;color:var(--muc-dam);margin-top:18px}
.ba-viec{list-style:none;padding:0;margin:16px 0 18px;display:grid;gap:8px;text-align:left}
.ba-viec li{display:flex;align-items:center;gap:10px;background:var(--giay);border:1px solid var(--tim-vien);border-radius:16px;padding:10px 14px;font-weight:700}
.ba-viec .bt{color:var(--do-chu)}
.gia-nut{display:flex;align-items:center;justify-content:center;min-height:var(--cham-chinh);border-radius:999px;font-weight:700;margin-top:10px;padding:10px 18px}
.gia-xanh{background:var(--xanh);color:#fff}
.gia-vang{background:var(--vang);color:var(--muc)}
.toi-on{display:block;margin-top:14px;color:var(--muc-phu);text-decoration:underline;text-underline-offset:3px;min-height:var(--cham);line-height:var(--cham)}

/* hồi Sau: mốc 72 giờ */
.moc{background:var(--giay);border-radius:var(--bo);padding:28px 24px;box-shadow:var(--bong);border:1px solid var(--tim-vien)}
.moc ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);position:relative}
.moc ol::before{content:"";position:absolute;left:12.5%;right:12.5%;top:13px;height:3px;background:linear-gradient(90deg,var(--tim-1),var(--tim-2));border-radius:3px}
.moc li{display:flex;flex-direction:column;align-items:center;gap:10px;font-weight:700;color:var(--muc-dam);text-align:center;font-size:.95rem}
.moc li::before{content:"";width:28px;height:28px;border-radius:50%;background:var(--giay);border:4px solid var(--tim);position:relative;z-index:1}
.khong-hua{margin-top:22px;padding:16px 18px;border-radius:18px;background:var(--tim-nhat);color:var(--muc);font-weight:700}

/* cách quyết định */
.quyet{padding:88px 0;background:var(--giay);border-block:1px solid var(--tim-vien)}
.quyet h2{font-size:clamp(1.6rem,3.4vw,2.4rem);color:var(--muc-dam);max-width:24ch}
.quyet .doan{margin-top:18px;font-size:1.08rem;color:var(--muc-phu);max-width:62ch}
.duong{list-style:none;padding:0;margin:36px 0 0;display:grid;gap:12px}
@media (min-width:760px){.duong{grid-template-columns:repeat(4,1fr);gap:0}}
.duong li{display:flex;align-items:center;gap:10px;font-weight:700}
.duong li span{flex:1;display:flex;align-items:center;min-height:64px;padding:12px 18px;border-radius:18px;background:var(--tim-nhat);color:var(--muc-dam)}
.duong li:nth-child(3) span{background:var(--muc-dam);color:#fff}
.duong .bt{color:var(--tim);margin:0 6px}
.duong li:last-child .bt{display:none}
@media (max-width:759px){.duong{gap:4px}.duong li{flex-direction:column;align-items:stretch;gap:4px}.duong li span{flex:none}.duong .bt{align-self:center;transform:rotate(90deg);margin:0}}
.ba-muc{margin-top:40px}
.ba-muc h3{font-size:1.1rem}
.chip-hang{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.chip{display:inline-flex;align-items:center;min-height:44px;padding:8px 18px;border-radius:999px;font-weight:700}
.chip-cao{background:var(--do-nen);color:var(--do-chu)}
.chip-nghi{background:var(--vang-nen);color:var(--vang-chu)}
.chip-chua{background:var(--la-nen);color:var(--la-chu)}
.khong-hua-2{margin-top:28px;color:var(--muc-phu);max-width:62ch}
.ket-luan{margin-top:14px;border-radius:var(--bo-vua);border:1px solid var(--tim-vien);background:var(--tim-nen);padding:20px 22px;max-width:560px}
.ket-luan .chip{font-size:1.15rem}
.ket-luan p{margin-top:12px;font-size:1.15rem;font-weight:700;color:var(--muc)}
.ket-luan p span{display:block;font-weight:500;color:var(--muc-phu)}
.link-lon{display:inline-flex;align-items:center;gap:8px;margin-top:28px;min-height:var(--cham);font-weight:700}

/* so sánh */
.so-sanh{padding:88px 0}
.so-sanh h2{font-size:clamp(1.6rem,3.4vw,2.4rem);color:var(--muc-dam)}
.so-sanh .doan{margin-top:14px;color:var(--muc-phu);max-width:60ch}
.bang-vo{margin-top:28px;overflow-x:auto;border-radius:var(--bo-vua);border:1px solid var(--tim-vien);background:var(--giay)}
table{width:100%;border-collapse:collapse}
th,td{padding:14px 16px;text-align:left;border-bottom:1px solid var(--tim-nhat);vertical-align:middle}
thead th{font-size:.9rem;color:var(--muc-phu);background:var(--tim-nen)}
td.o,th.o{text-align:center;width:6.5rem}
@media (max-width:560px){th,td{padding:12px 10px}td.o,th.o{width:4.2rem}}
td.o .bt{color:var(--tim);width:1.5em;height:1.5em}
td.o.khong .bt{color:#9a90b8}
tbody tr:last-child td{border-bottom:0}

/* cài đặt */
.cai{padding:88px 0;background:var(--tim-nhat)}
.cai h2{font-size:clamp(1.6rem,3.4vw,2.4rem);color:var(--muc-dam)}
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
.hop-tai .phu{margin-top:16px;color:var(--muc-phu);font-size:.95rem}
details{margin-top:18px;border-top:1px solid var(--tim-nhat);padding-top:12px}
summary{cursor:pointer;min-height:var(--cham);display:flex;align-items:center;font-weight:700}
.bam{font-family:ui-monospace,Consolas,monospace;font-size:.85rem;word-break:break-all;color:var(--muc);margin-top:4px;background:var(--tim-nen);padding:8px 10px;border-radius:10px}
.nhan-bam{margin-top:10px;font-size:.85rem;color:var(--muc-phu)}

/* không làm */
.khong-lam{padding:88px 0}
.khong-lam h2{font-size:clamp(1.6rem,3.4vw,2.4rem);color:var(--muc-dam)}
.khong-lam ul{list-style:none;padding:0;margin:28px 0 0;display:grid;gap:14px}
@media (min-width:900px){.khong-lam ul{grid-template-columns:1fr 1fr;column-gap:48px}}
.khong-lam li{display:flex;gap:12px;align-items:flex-start;font-size:1.05rem}
.khong-lam li .bt{color:var(--tim);margin-top:4px}

/* đóng */
.dong{padding:96px 0;background:linear-gradient(135deg,var(--tim-1),var(--tim-2));color:var(--muc)}
.dong h2{font-size:clamp(1.8rem,4vw,2.8rem);color:var(--muc);max-width:22ch}
.dong p{margin-top:16px;font-size:1.12rem;max-width:56ch}
.dong .hang-nut{margin-top:28px}
.dong .nut-phu{border-color:rgba(30,27,75,.25)}

.chan{padding:32px 0 48px;color:var(--muc-phu);font-size:.9rem}
.chan-trong{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center}
.chan a{display:inline-flex;align-items:center;min-height:var(--cham);font-weight:700}
.chan strong{color:var(--muc-dam)}
`;

function dungTrangGioiThieu(ngonNgu = 'vi', { apk = null } = {}) {
  const l = ngonNgu === 'en' ? 'en' : 'vi';
  const c = CHU[l];
  const t = (k) => esc(c[k]);
  const khac = l === 'vi' ? 'en' : 'vi';
  const goc = 'https://khoan-da.onrender.com';
  const duongTrang = l === 'en' ? '/gioi-thieu?lang=en' : '/gioi-thieu';
  const duongMinhBach = l === 'en' ? '/transparency?lang=en' : '/transparency';

  const viec = (ds) => ds.map(([k, android]) => `
        <li><h3>${t(`${k}T`)}${android ? ` <span class="the-android">${t('chiAndroid')}</span>` : ''}</h3><p>${t(k)}</p></li>`).join('');

  const hangSoSanh = c.ssHang.map(([ten, web, adr]) => {
    const o = (co) => `<td class="o${co ? '' : ' khong'}">${co ? BT.co : BT.khong}<span class="an">${esc(co ? c.ssCo : c.ssKhong)}</span></td>`;
    return `<tr><th scope="row">${esc(ten)}</th>${o(web)}${o(adr)}</tr>`;
  }).join('');

  const hopTai = apk ? `
        <div class="hop-tai">
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
THESIS: Trang đi theo trục Trước · Trong · Sau của chính sản phẩm; từ chối lưới thẻ tính năng giống nhau của trang app thông thường.
OWN-WORLD: tím #9e76ea→#ad8af0 của thanh điều hướng, mực #1e1b4b/#2e1065, nền kẻ ô 26px, Quicksand tự nạp, nút viên thuốc, vàng #fbbf24 cho việc khẩn, dải "Trong" tím đậm.
STORY: con cháu hiểu kẻ lừa đảo thắng nhờ gấp gáp và cô lập, thấy app chen vào đúng lúc đó, rồi mở web hoặc cài APK cho bố mẹ theo các bước có rào chắn.
FIRST VIEWPORT: tiêu đề lớn bên trái, hai nút (web, cài Android xuống mục cài), điện thoại minh hoạ bên phải với câu "Bác khoan chuyển tiền đã." hiện lần lượt.
FORM: cấu trúc 7/7 của danh sách, khoá seed 7186b074.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->
<a class="nhay" href="#noi-dung">${t('nhayNoiDung')}</a>
<header class="dau">
  <div class="khung dau-trong">
    <a class="thuong-hieu" href="${duongTrang}" aria-label="${t('veDau')}"><img src="/logo-192.png" width="44" height="44" alt=""><span>Khoan Đã</span></a>
    <span class="khau-hieu">${t('khauHieu')}</span>
    <a class="nut-nho" href="${khac === 'en' ? '/gioi-thieu?lang=en' : '/gioi-thieu'}" hreflang="${khac}" lang="${khac}" aria-label="${t('doiNgonNguNhan')}">${t('doiNgonNgu')}</a>
  </div>
</header>

<main id="noi-dung">
  <section class="mo-dau">
    <div class="khung mo-dau-luoi">
      <div>
        <h1>${t('h1')}</h1>
        <p class="dan">${t('dan')}</p>
        <div class="hang-nut">
          <a class="nut nut-chinh" href="/">${t('nutWeb')}</a>
          <a class="nut nut-phu" href="#android">${t('nutAndroid')}</a>
        </div>
        <p class="ghi-nho">${t('ghiNho')}</p>
      </div>
      <figure class="dien-thoai">
        <div class="may" role="group" aria-label="${t('mayNhan')}">
          <p class="may-tieu-de">${t('mayTieuDe')}</p>
          <div class="qua-cau" aria-hidden="true"></div>
          <p class="bong bong-bac"><span class="an">${t('aiBac')} </span>${t('loiBac')}</p>
          <p class="bong bong-chau"><span class="an">${t('aiChau')} </span><strong>${t('loiDap1')}</strong>${t('loiDap2')}</p>
          <span class="may-nut">${t('mayNut')}</span>
        </div>
        <figcaption class="chu-thich">${t('chuThichMay')}</figcaption>
      </figure>
    </div>
  </section>

  <section class="van-de" aria-labelledby="h-van-de">
    <div class="khung van-de-luoi">
      <h2 id="h-van-de">${t('vdTieuDe')}</h2>
      <div><p>${t('vdDoan1')}</p><p>${t('vdDoan2')}</p></div>
    </div>
  </section>

  <section class="hoi" aria-labelledby="h-truoc">
    <div class="khung">
      <div class="hoi-dau"><h2 id="h-truoc"><span class="ten-hoi">${t('truocTen')}</span>${t('truocTieuDe')}</h2></div>
      <div class="hoi-luoi">
        <div>
          <p class="dan-hoi">${t('truocDan')}</p>
          <ul class="viec">${viec([['truoc1'], ['truoc2'], ['truoc3'], ['truoc4'], ['truoc5']])}
          </ul>
        </div>
        <aside class="to-quy-tac hinh" aria-label="${t('toQuyTac')}">
          <h3>${t('toQuyTac')}</h3>
          <ul>
            <li>${BT.co}<span>${t('quyTac1')}</span></li>
            <li>${BT.co}<span>${t('quyTac2')}</span></li>
          </ul>
          <p class="vi-du">${t('viDuQuyTac')}</p>
          <div class="ma-noi">
            <p>${t('maNoiMay')} · ${t('viDuMa')}</p>
            <div class="o-ma" aria-hidden="true"><span>4</span><span>8</span><span>2</span><span>1</span><span>9</span><span>6</span></div>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section class="hoi hoi-trong hoi-dao" aria-labelledby="h-trong">
    <div class="khung">
      <div class="hoi-dau"><h2 id="h-trong"><span class="ten-hoi">${t('trongTen')}</span>${t('trongTieuDe')}</h2></div>
      <div class="hoi-luoi">
        <div>
          <ul class="viec">${viec([['trong1'], ['trong2'], ['trong3'], ['trong4'], ['trong5', true], ['trong6', true], ['trong7', true]])}
          </ul>
        </div>
        <figure class="man-dung hinh" role="group" aria-label="${t('manDungNhan')}">
          <div class="vong" aria-hidden="true"><span>60<small>${t('giay')}</small></span></div>
          <h3>${t('dungTieuDe')}</h3>
          <ul class="ba-viec">
            <li>${BT.cam}<span>${t('dung1')}</span></li>
            <li>${BT.cam}<span>${t('dung2')}</span></li>
            <li>${BT.cam}<span>${t('dung3')}</span></li>
          </ul>
          <span class="gia-nut gia-xanh">${t('dungGoiCon')}</span>
          <span class="gia-nut gia-vang">${t('dungGoi113')}</span>
          <span class="toi-on">${t('dungToiOn')}</span>
        </figure>
      </div>
    </div>
  </section>

  <section class="hoi" aria-labelledby="h-sau">
    <div class="khung">
      <div class="hoi-dau"><h2 id="h-sau"><span class="ten-hoi">${t('sauTen')}</span>${t('sauTieuDe')}</h2></div>
      <div class="hoi-luoi">
        <ul class="viec">${viec([['sau1'], ['sau2'], ['sau3']])}
        </ul>
        <div class="hinh">
          <div class="moc">
            <ol aria-label="${t('sauMocNhan')}">${c.sauMoc.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>
          </div>
          <p class="khong-hua">${t('sauKhongHua')}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="quyet" aria-labelledby="h-quyet">
    <div class="khung">
      <h2 id="h-quyet">${t('qdTieuDe')}</h2>
      <p class="doan">${t('qdDoan')}</p>
      <ol class="duong" aria-label="${t('qdBuocNhan')}">${c.qdBuoc.map((b) => `<li><span>${esc(b)}</span>${BT.mui}</li>`).join('')}</ol>
      <div class="ba-muc">
        <h3>${t('qdBaMuc')}</h3>
        <div class="chip-hang"><span class="chip chip-cao">${t('nhanCao')}</span><span class="chip chip-nghi">${t('nhanNghiNgo')}</span><span class="chip chip-chua">${t('nhanChuaThay')}</span></div>
      </div>
      <p class="khong-hua-2">${t('qdKhongHua')}</p>
      <div class="ket-luan" role="group" aria-label="${t('qdViDuNhan')}">
        <span class="chip chip-nghi">${t('nhanNghiNgo')}</span>
        <p>${t('qdChuaKiem')}<span>${t('qdChuaKiem1')}</span></p>
      </div>
      <a class="link-lon" href="${duongMinhBach}">${t('qdLink')} ${BT.mui}</a>
    </div>
  </section>

  <section class="so-sanh" aria-labelledby="h-so-sanh">
    <div class="khung">
      <h2 id="h-so-sanh">${t('ssTieuDe')}</h2>
      <p class="doan">${t('ssDan')}</p>
      <div class="bang-vo">
        <table>
          <thead><tr><th scope="col">${t('ssCot')}</th><th scope="col" class="o">${t('ssWeb')}</th><th scope="col" class="o">${t('ssAndroid')}</th></tr></thead>
          <tbody>${hangSoSanh}</tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="cai" id="android" aria-labelledby="h-cai">
    <div class="khung">
      <h2 id="h-cai">${t('caiTieuDe')}</h2>
      <div class="cai-luoi">
        <div>
          <div class="canh-bao">${BT.canh}<div><h3>${t('caiCanhBaoTieuDe')}</h3><p>${t('caiCanhBao')}</p></div></div>
          <ol class="buoc">${c.caiBuoc.map((b) => `<li><p>${esc(b)}</p></li>`).join('')}</ol>
        </div>${hopTai}
      </div>
    </div>
  </section>

  <section class="khong-lam" aria-labelledby="h-khong-lam">
    <div class="khung">
      <h2 id="h-khong-lam">${t('kkTieuDe')}</h2>
      <ul>${c.kk.map((k) => `<li>${BT.co}<span>${esc(k)}</span></li>`).join('')}</ul>
      <a class="link-lon" href="/chinh-sach-rieng-tu.html${l === 'en' ? '#en' : ''}">${t('kkLink')} ${BT.mui}</a>
    </div>
  </section>

  <section class="dong" aria-labelledby="h-dong">
    <div class="khung">
      <h2 id="h-dong">${t('dongTieuDe')}</h2>
      <p>${t('dongDoan')}</p>
      <div class="hang-nut">
        <a class="nut nut-vang" href="mailto:${EMAIL_LIEN_HE}">${esc(EMAIL_LIEN_HE)}</a>
        <a class="nut nut-phu" href="/">${t('nutWeb')}</a>
      </div>
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
</body>
</html>`;
}

module.exports = { dungTrangGioiThieu, docThongTinApk, CHU, VAN_TAY_CHUNG_CHI, EMAIL_LIEN_HE };
