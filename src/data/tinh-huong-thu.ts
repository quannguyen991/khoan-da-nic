/**
 * MƯỜI TÌNH HUỐNG ĐỂ THỬ — dùng cho khu "Thử tình huống" ở bản máy tính.
 *
 * ⚠️ ĐÂY LÀ TÌNH HUỐNG SOẠN ĐỂ THỬ, KHÔNG PHẢI VỤ VIỆC CÓ THẬT CỦA AI.
 * Chúng được viết lại theo các thủ đoạn đã được báo chí và cơ quan chức năng mô
 * tả công khai — không lấy từ tin nhắn của người dùng nào, không có số tài khoản
 * hay số điện thoại thật. §11: không bịa vụ việc rồi trình bày như đã xảy ra.
 *
 * ⚠️ NĂM TIN LÀNH CŨNG QUAN TRỌNG NGANG NĂM TIN LỪA.
 * Một bộ thử chỉ có tin lừa đảo sẽ khiến người ta tưởng app càng báo động nhiều
 * càng tốt. Nhưng §4.6 ghi rõ: người bị báo oan sẽ hoảng rồi gỡ ứng dụng — với
 * app này, báo oan đắt hơn bỏ sót. Nên bộ thử phải đo được CẢ HAI phía, và
 * người thử phải nhìn thấy cả hai cột.
 *
 * `mongDoi` là kỳ vọng của người soạn, KHÔNG phải đáp án đúng tuyệt đối. Nó ở
 * đây để người thử tự so, không phải để app tự chấm điểm mình.
 */

export type TinhHuongThu = {
  ma: string;
  nhom: 'lua_dao' | 'lanh';
  ten: string;
  noiDung: string;
  /** Người soạn kỳ vọng thấy gì. So bằng mắt, app không tự chấm. */
  mongDoi: 'CAO' | 'NGHI_NGO' | 'CHUA_THAY';
  /** Vì sao tình huống này đáng thử — hiện khi bấm vào dòng. */
  vaySao: string;
};

export const TINH_HUONG_THU: TinhHuongThu[] = [
  {
    ma: 'gia-danh-cong-an',
    nhom: 'lua_dao',
    ten: 'Giả danh công an, đòi chuyển vào "tài khoản an toàn"',
    noiDung: 'Chào bác, tôi là trung úy Nam ở Cục Cảnh sát điều tra. Tài khoản của bác liên quan đường dây rửa tiền. Bác giữ máy đừng cúp, đừng nói với con cháu, ra ngân hàng chuyển 50 triệu vào tài khoản an toàn của cơ quan rồi đọc mã OTP cho tôi xác minh.',
    mongDoi: 'CAO',
    vaySao: 'Giả danh công an là hình thức lừa đảo phổ biến nhất Việt Nam 2025. Tình huống này gộp bốn dấu hiệu nặng cùng lúc: giả danh cơ quan, "tài khoản an toàn", đòi mã OTP, cấm kể cho người nhà.',
  },
  {
    ma: 'viec-nhe-luong-cao',
    nhom: 'lua_dao',
    ten: 'Việc nhẹ lương cao, viết không dấu',
    noiDung: 'Chi oi ben em tuyen CTV lam nhiem vu don hang, hoa hong 15%. Chi nap 1.200.000d lam nhiem vu cuoi la rut duoc ca von lan thuong ngay a',
    mongDoi: 'NGHI_NGO',
    vaySao: 'Viết KHÔNG DẤU, lẫn tiếng lóng, và không giả danh ai cả. Đây là ca cho thấy vì sao cần AI đọc hiểu — không luật hay biểu thức chính quy nào bắt được kiểu này.',
  },
  {
    ma: 'trung-thuong',
    nhom: 'lua_dao',
    ten: 'Trúng thưởng, đòi nộp phí trước',
    noiDung: 'CHUC MUNG QUY KHACH da trung xe SH 150i tu chuong trinh tri an. Vui long nop 2.000.000d phi ho so van chuyen de nhan giai thuong trong hom nay.',
    mongDoi: 'NGHI_NGO',
    vaySao: 'Thông báo trúng thưởng đứng thứ hai trong các thủ đoạn phổ biến 2025. Dấu hiệu cốt lõi: quà giá trị lớn kèm một khoản phí phải nộp TRƯỚC.',
  },
  {
    ma: 'con-gap-nan',
    nhom: 'lua_dao',
    ten: 'Giả con cháu gặp nạn, cấm gọi lại',
    noiDung: 'Alo con đây, con bị tai nạn đang cấp cứu ở viện, mẹ chuyển gấp 30 triệu vào số tài khoản của bác sĩ này giúp con, đừng gọi lại con đang trong phòng mổ',
    mongDoi: 'CAO',
    vaySao: 'Đánh vào tình cảm và chặn luôn đường xác minh ("đừng gọi lại"). Đây là kịch bản khiến người ta hành động trước khi kịp nghĩ.',
  },
  {
    ma: 'gia-danh-dien-luc',
    nhom: 'lua_dao',
    ten: 'Giả danh điện lực, dụ cài app qua link lạ',
    noiDung: 'Thong bao: Hoa don dien thang nay cua quy khach qua han. Vui long tai ung dung tai link evn-thanhtoan.xyz de tra cuu va thanh toan trong 24h neu khong se bi cat dien.',
    mongDoi: 'NGHI_NGO',
    vaySao: 'Giả danh dịch vụ thiết yếu + tên miền lạ + hạn chót gấp. Cài app từ link lạ là đường dẫn tới chiếm quyền điện thoại.',
  },

  {
    ma: 'con-nhan-me',
    nhom: 'lanh',
    ten: 'Con nhắn mẹ về muộn',
    noiDung: 'Mẹ ơi chiều nay con về muộn, mẹ ăn cơm trước đừng chờ con nhé',
    mongDoi: 'CHUA_THAY',
    vaySao: 'Tin nhắn gia đình bình thường. Nếu app báo động ở đây thì bác sẽ mất niềm tin vào mọi cảnh báo sau đó.',
  },
  {
    ma: 'ngan-hang-that',
    nhom: 'lanh',
    ten: 'Ngân hàng báo biến động số dư',
    noiDung: 'BIDV: Tai khoan cua quy khach vua bi tru 500.000d. So du con lai 12.450.000d. Chi tiet tai BIDV SmartBanking.',
    mongDoi: 'CHUA_THAY',
    vaySao: 'Ca khó: có tên ngân hàng, có số tiền, viết không dấu — trông rất giống tin lừa đảo nhưng là tin thật. Đây là ca mô hình nhỏ hay báo oan nhất.',
  },
  {
    ma: 'lich-kham',
    nhom: 'lanh',
    ten: 'Bệnh viện nhắc lịch khám',
    noiDung: 'Benh vien Bach Mai nhac lich kham lai cua bac vao 8h ngay 25/8. Bac nho mang the BHYT va so kham benh.',
    mongDoi: 'CHUA_THAY',
    vaySao: 'Có mốc thời gian gấp và một yêu cầu ("nhớ mang…") — hai thứ dễ bị nhầm thành thúc ép và đòi giấy tờ.',
  },
  {
    ma: 'hang-da-giao',
    nhom: 'lanh',
    ten: 'Báo đơn hàng đã giao',
    noiDung: 'Shopee: Don hang cua ban da duoc giao thanh cong. Cam on ban da mua sam.',
    mongDoi: 'CHUA_THAY',
    vaySao: 'Tin thương mại điện tử thật. Thủ đoạn giả danh giao hàng rất phổ biến, nên đây là ca kiểm tra app có phân biệt được không.',
  },
  {
    ma: 'ba-mua-do',
    nhom: 'lanh',
    ten: 'Cháu nhờ bà mua đồ, sẽ gửi tiền lại',
    noiDung: 'Bà ơi mai con qua chơi, bà mua giúp con ít rau với thịt nhé, tối con gửi tiền lại bà',
    mongDoi: 'CHUA_THAY',
    vaySao: 'Ca khó nhất trong nhóm lành: có chữ "gửi tiền" và có người thân — đúng hai thành phần của kịch bản giả danh con cháu. Khác biệt nằm ở chỗ KHÔNG ai bị thúc và KHÔNG ai đòi gì.',
  },
];
