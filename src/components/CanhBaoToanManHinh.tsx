/*
 * ⚠️ `motion/react`, KHÔNG PHẢI `framer-motion`.
 * `package.json` khai `motion`; `framer-motion` chỉ có mặt như phụ thuộc bắc
 * cầu, nên nhập thẳng từ nó là dựa vào một thứ không ai hứa sẽ còn ở đó. App.tsx
 * và phần lớn mã dùng `motion/react` — theo số đông.
 */
import { motion } from 'motion/react';
import { Phone, X } from 'lucide-react';

/**
 * MÀN CẢNH BÁO TOÀN MÀN HÌNH — phía NGƯỜI CAO TUỔI.
 *
 * ══════════ VÌ SAO TOÀN MÀN HÌNH, KHÔNG PHẢI THÔNG BÁO NHỎ ══════════
 * Người đang nghe kẻ gian nói trên điện thoại KHÔNG nhìn thấy một thông báo nhỏ
 * trong khay. Họ đang bị dồn ép, đang tập trung vào giọng nói kia, và mỗi giây
 * do dự là một giây kẻ gian dùng để giục thêm.
 *
 * ══════════ ĐÚNG HAI NÚT. KHÔNG HƠN. ══════════
 * Không có "bỏ qua vĩnh viễn", không có "tìm hiểu thêm", không có menu, không
 * có nút chia sẻ. Mỗi lựa chọn thêm là một giây do dự.
 *
 * ⚠️ Danh sách nút đến TỪ MÁY CHỦ (`manNguoiCaoTuoi()` trong
 * `backend/src/canh-bao-hai-phia.js`), không phải dựng ở đây — để chỉ có MỘT
 * nơi quyết định màn khẩn cấp trông thế nào, và nơi đó có test canh.
 *
 * ══════════ §4.6 — LUÔN CÓ LỐI RA ══════════
 * Mức PROTECTED_CRITICAL bỏ hết điều hướng, NHƯNG luôn phải có dòng "Tôi ổn,
 * không có gì nguy hiểm" ở cuối màn hình. Nếu bộ luật báo động giả mà người
 * dùng bị kẹt trong màn khẩn cấp, họ sẽ hoảng và gỡ ứng dụng. Mỗi lần bấm nút
 * này là MỘT MẪU DỮ LIỆU BÁO ĐỘNG GIẢ — nó đi thẳng vào bảng `canh_bao` để
 * hiệu chỉnh ngưỡng.
 *
 * ══════════ §HĐ luật 3 — `chuaKiem` HIỆN CÙNG CỠ CHỮ VỚI NHÃN ══════════
 * Đây là ràng buộc AN TOÀN, không phải gợi ý thẩm mỹ. "Không kiểm được" mà hiện
 * nhỏ hơn kết luận là mời người đọc bỏ qua nó.
 *
 * ══════════ CỠ CHỮ ══════════
 * Dòng chính dùng `max(20px, var(--text-lg))`. Sàn 14px của repo là mức tối
 * thiểu TUYỆT ĐỐI cho mọi chữ; ở màn này phải to hơn nhiều. Viết bằng `max()`
 * vì ở bậc chữ nhỏ nhất (gốc 15px) thì `--text-lg` chỉ ra 19,7px.
 */

/** Payload từ `manNguoiCaoTuoi()`. Giữ đúng hình dạng, đừng tự thêm trường. */
export interface ManCanhBao {
  kieu: 'toan_man_hinh';
  nhan: 'CAO' | 'NGHI_NGO' | 'CHUA_THAY';
  dong1: string;
  dong2: string;
  maDong2: string;
  dong3: string;
  tenNguoiThan: string | null;
  chuaKiem: string[];
  hanhDong: string[];
  maLoiRa: string;
  canThiep: string;
}

/**
 * MÃ → KHOÁ i18n.
 *
 * §HĐ luật 2 — backend trả MÃ, frontend tra bảng ra câu. Điều này khiến đổi
 * ngôn ngữ KHÔNG THỂ làm đổi kết luận. Đừng so sánh bằng chuỗi tiếng Việt.
 *
 * ⚠️ GIÁ TRỊ Ở ĐÂY LÀ KHOÁ i18n, KHÔNG PHẢI CÂU ĐỂ HIỂN THỊ THẲNG.
 * Bộ i18n của repo dùng chính chuỗi tiếng Việt làm khoá, nên hai thứ trông
 * giống nhau — nhưng chúng phải đi qua `t()`, nếu không thì người chọn English
 * thấy một màn khẩn cấp bằng tiếng Việt. §4.1: mọi chuỗi người dùng đọc phải
 * đến từ catalog i18n, kể cả ARIA label.
 */
const CAU_DONG3: Record<string, string> = {
  da_gui_canh_bao_cho_nguoi_than: 'Cháu đã gửi cảnh báo cho {ten}.',
  nguoi_than_da_mo_canh_bao: '{ten} đã mở cảnh báo.',
  chua_gui_duoc_cho_nguoi_than: 'Cháu chưa gửi được cho {ten}. Bác gọi cho {ten} nhé.',
  chua_co_quy_tac_gia_dinh: 'Nhà mình chưa đặt người nhận cảnh báo.',
};

const CAU_GIAI_THICH: Record<string, string> = {
  R1: 'Tin này nói chuyện của cơ quan nhà nước nhưng đường link lại không phải trang chính thức.',
  R2: 'Tin này bảo bác cài một ứng dụng từ đường link — đây là cách kẻ gian chiếm quyền điều khiển điện thoại.',
  R3: 'Tin này xưng danh cơ quan nhưng dùng link rút gọn, mà cơ quan nhà nước thì không dùng link rút gọn.',
  R4: 'Đường link trong tin có tên gần giống trang thật nhưng không phải trang thật.',
  R5: 'Đường link trong tin dùng loại tên miền mà các vụ lừa đảo hay dùng.',
  R6: 'Tin này vừa đưa số tài khoản, vừa nêu số tiền, vừa giục bác làm ngay — ba thứ đi cùng nhau là dấu hiệu thường gặp trong các vụ lừa đảo.',
  R7: 'Tin này bảo bác đừng nói với ai. Việc thật thì không ai cấm bác hỏi người nhà.',
  R8: 'Tin này hỏi mã hoặc mật khẩu của bác. Ngân hàng và cơ quan nhà nước không bao giờ hỏi những thứ đó.',
  R9: 'Tin gửi từ một số điện thoại thường nhưng lại xưng là cơ quan hoặc ngân hàng.',
  R10: 'Tin có đường link và bác chưa từng lưu số người gửi này.',
  T2_DA_BAO_CAO: 'Đường link trong tin này đã từng bị báo cáo trong các vụ lừa đảo trước đó.',
  APP_LA: 'Vừa có một ứng dụng lạ được cài vào máy. Nếu ai đó đang hướng dẫn bác cài, bác dừng lại và gọi cho người nhà nhé.',
  KHONG_DOC_DUOC: 'Cháu chưa đọc được hết phần bác gửi, nên chưa kết luận được gì.',
  KHONG_KHOP: 'Cháu chưa thấy dấu hiệu rủi ro trong phần bác gửi. Nếu vẫn thấy chưa yên tâm, bác gọi cho người nhà nhé.',
};

/** Mã `chuaKiem` → câu. Thiếu mã nào thì hiện chính mã đó, đừng nuốt (§4.3). */
const CAU_CHUA_KIEM: Record<string, string> = {
  thong_bao_khong_co_noi_dung: 'Thông báo này không có nội dung để đọc.',
  chi_doc_duoc_mot_phan_tin: 'Cháu chỉ đọc được một phần tin này.',
  khong_mo_duoc_link: 'Cháu không mở được đường link trong tin.',
  khong_doc_duoc_anh: 'Cháu không đọc được ảnh bác gửi.',
  chua_nghe_duoc_cuoc_goi: 'Cháu không nghe được cuộc gọi.',
  khong_doc_duoc_ten_ung_dung: 'Cháu không đọc được tên ứng dụng vừa cài.',
  ai_khong_chay: 'Lượt này không có AI đọc.',
};

/** Chỉ ba nhãn. §4.1 — không có nhãn thứ tư, không có "An toàn". */
const MAU_NHAN: Record<string, string> = {
  CAO: '#dc2626',
  NGHI_NGO: '#d97706',
  CHUA_THAY: '#16a34a',
};

export function CanhBaoToanManHinh({
  man, t, onGoi, onDong, onToiOn,
}: {
  man: ManCanhBao;
  /**
   * ⚠️ PHẢI LÀ HÀM ĐÃ GẮN NGÔN NGỮ: `(k) => t(k, lang)`.
   * Component này cố ý KHÔNG nhận `lang` — có hai nguồn ngôn ngữ trong cùng
   * một màn là cách chắc chắn để một nửa màn hình đổi còn nửa kia thì không.
   */
  t: (k: string) => string;
  /** Gọi người thân, HOẶC gửi cảnh báo cho người thân khi chưa có quy tắc. */
  onGoi: () => void;
  onDong: () => void;
  /** §4.6 — mỗi lần bấm là một mẫu báo động giả. Ghi lại, đừng chỉ đóng màn. */
  onToiOn: () => void;
}) {
  const ten = man.tenNguoiThan || t('người nhà');
  const khoaDong3 = CAU_DONG3[man.dong3];
  const dong3 = khoaDong3 ? t(khoaDong3).split('{ten}').join(ten) : '';
  const khoaGiaiThich = CAU_GIAI_THICH[man.maDong2];
  /*
   * Rơi về `man.dong2` khi gặp mã lạ — máy chủ mới hơn frontend là chuyện sẽ
   * xảy ra, và lúc đó hiện câu tiếng Việt của máy chủ vẫn tốt hơn hiện mã trần.
   */
  const giaiThich = khoaGiaiThich ? t(khoaGiaiThich) : man.dong2;

  const laBaoCho = man.hanhDong[0] === 'bao_cho_nguoi_than';
  const nhanNutChinh = laBaoCho
    ? `${t('Báo cho')} ${ten}`
    : `${t('Gọi')} ${ten}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alertdialog"
      aria-modal="true"
      aria-label={t('Cảnh báo khẩn')}
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-white"
      style={{ padding: 'var(--space-card)' }}
    >
      <div className="flex flex-col gap-4 pt-6">
        {/* Dòng 1 — "Khoan đã!", chữ rất to. */}
        <h1
          data-vai-tro="tieu-de-lon"
          style={{
            fontSize: 'var(--text-4xl)',
            lineHeight: 'var(--leading-tight)',
            color: MAU_NHAN[man.nhan] || MAU_NHAN.NGHI_NGO,
            fontWeight: 800,
          }}
        >
          {t('Khoan đã!')}
        </h1>

        {/* Dòng 2 — một câu từ bộ phát hiện. Không phải danh sách. */}
        <p style={{ fontSize: 'max(20px, var(--text-lg))', lineHeight: 'var(--leading-normal)' }}>
          {giaiThich}
        </p>

        {/*
          §HĐ luật 3 — `chuaKiem` HIỆN CÙNG CỠ CHỮ VỚI NHÃN, không nhỏ hơn.
          Đây là ràng buộc an toàn. Đừng đổi sang `data-vai-tro="chu-phu"`.
        */}
        {man.chuaKiem.length > 0 && (
          <ul
            className="list-none m-0 p-0 flex flex-col gap-2"
            style={{ fontSize: 'max(20px, var(--text-lg))', lineHeight: 'var(--leading-normal)' }}
          >
            {man.chuaKiem.map((ma) => (
              <li key={ma}>· {CAU_CHUA_KIEM[ma] ? t(CAU_CHUA_KIEM[ma]) : ma}</li>
            ))}
          </ul>
        )}

        {/*
          Dòng 3 — cho bác biết mình KHÔNG MỘT MÌNH.
          §9.4 — câu nói ĐÚNG thứ hệ thống biết. "Đã gửi" khác "người thân đã
          mở", và cả hai đều khác "người thân đã đọc và hiểu" — câu cuối bị §11
          cấm và không có mã nào cho nó.
        */}
        {dong3 && (
          <p style={{ fontSize: 'max(20px, var(--text-lg))', lineHeight: 'var(--leading-normal)' }}>
            {dong3}
          </p>
        )}
      </div>

      {/* ĐÚNG HAI NÚT, to bằng nhau. */}
      <div data-vai-tro="nhom-nut" className="w-full">
        <button
          type="button"
          data-vai-tro="nut-chinh"
          onClick={onGoi}
          className="w-full rounded-2xl bg-red-600 text-white font-bold flex items-center justify-center gap-3 px-4"
          style={{ fontSize: 'max(20px, var(--text-lg))' }}
        >
          <Phone size={28} aria-hidden />
          <span>{nhanNutChinh}</span>
        </button>

        <button
          type="button"
          data-vai-tro="nut-chinh"
          onClick={onDong}
          className="w-full rounded-2xl border-2 border-neutral-800 bg-white font-bold flex items-center justify-center gap-3 px-4"
          style={{ fontSize: 'max(20px, var(--text-lg))' }}
        >
          <X size={28} aria-hidden />
          <span>{t('Đóng')}</span>
        </button>

        {/*
          §4.6 — LỐI RA. Ở mức PROTECTED_CRITICAL và PAUSE_60S thì nó là "Tôi ổn,
          không có gì nguy hiểm"; ở mức khác là quay lại trang chủ.

          ⚠️ ĐÂY LÀ NÚT THỨ BA, VÀ NÓ KHÔNG PHÁ LUẬT "ĐÚNG HAI NÚT".
          Hai nút trên là hai HÀNH ĐỘNG. Dòng này là LỐI THOÁT bắt buộc của §4.6
          — nó cố ý nhỏ hơn, nằm dưới cùng, và không cạnh tranh sự chú ý với nút
          gọi. Bỏ nó đi thì một báo động giả biến thành một cái bẫy.
        */}
        {man.maLoiRa === 'toi_on_khong_co_gi_nguy_hiem' && (
          <button
            type="button"
            onClick={onToiOn}
            className="w-full underline text-neutral-600 bg-transparent"
            style={{ fontSize: 'max(16px, var(--text-base))', paddingBlock: 'var(--space-3)' }}
          >
            {t('Tôi ổn, không có gì nguy hiểm')}
          </button>
        )}
      </div>
    </motion.div>
  );
}
