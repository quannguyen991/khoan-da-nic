import { useState } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  PhoneOff,
  Home,
  ChevronLeft,
  Lock,
  Download,
  CreditCard,
  FileText,
  EyeOff,
} from 'lucide-react';
import { ViewState } from '../App';
import { api } from '../api-goc';
import maHopDong from '../config/ma-hop-dong.json';
import {
  Lang, NHAN, MAU_NHAN, CHUA_KIEM, MA_LY_DO,
  CAU_HOI_NHANH, NHANH_HANH_DONG, CAU_HOI_NHANH_KHUNG,
  tra, traNhieu,
} from '../catalog';
import { ghiKetQua } from '../lib/ket-qua-can-thiep';
import { useDocToMotLan } from '../lib/doc-to-mot-lan';
import { chonViecAnToan, cauLenhNgan } from '../lib/viec-an-toan-tiep-theo';
import { goiDienThoai } from '../native';
import { HoiCon, type ApiHoiCon } from './HoiCon';

/**
 * §15.11.1 — BỘ HỎI NHANH LÚC ĐANG BỊ GỌI.
 *
 * ⚠️ BỐN LUẬT CỦA MÀN NÀY, KHÔNG ĐƯỢC PHÁ:
 *
 *  1. React KHÔNG TỰ RA MỨC. Màn này gửi `traLoiBoHoiNhanh` về `/api/analyze`
 *     và hiển thị đúng thứ máy chủ trả. `src/analysis/decision-engine.js` là bộ
 *     luật duy nhất (§4.2).
 *  2. Trả lời "KHÔNG" KHÔNG TRỪ ĐIỂM. Nó nghĩa là "chưa thấy dấu hiệu này trong
 *     điều bác kể", không phải bằng chứng vắng mặt. Máy chủ đã lo đúng việc đó —
 *     `tinHieuTuTraLoi()` chỉ sinh tín hiệu từ câu trả lời CÓ.
 *  3. Nhánh "Tôi không rõ" KHÔNG BAO GIỜ dẫn thẳng tới mức thấp — nó sang bộ hỏi
 *     đầy đủ 8 câu. Người không diễn đạt được mình đang gặp chuyện gì là người
 *     CẦN GIÚP NHẤT.
 *  4. Không màu xanh lá cho trạng thái kết luận ở màn này (§15.16 test 13), và
 *     không có nhãn thứ tư. Ba nhãn nguyên văn nằm ở `catalog.ts`.
 *
 * ⚠️ TÍN HIỆU CỦA CHÍNH NHÁNH PHẢI ĐƯỢC GỬI ĐI — LỖI ĐÃ ĐO 18/8/2026.
 * `src/bo-hoi-nhanh.js:46` gắn cho mỗi nhánh một SIGNAL_ID riêng
 * (`chuyen_tien → FIN_TRANSFER_REQUEST`…), nhưng cửa HTTP chỉ nhận
 * `traLoiBoHoiNhanh` — tức chỉ nhận câu trả lời, không nhận nhánh. Bản trước
 * chọn nhánh xong không gửi gì về nó, và đo qua HTTP cho thấy:
 *
 *   nhánh "Đưa mã OTP" + CÓ cả hai câu, KHÔNG gửi tín hiệu nhánh
 *      → NGHI_NGO · VERIFY_PATH
 *   cùng lượt đó, CÓ gửi tín hiệu nhánh
 *      → CAO · PROTECTED_CRITICAL   (CO-01: OTP + chuyển tiền)
 *
 * Mất nguyên một bậc VÀ mất màn khẩn cấp, ở đúng kịch bản trung tâm của cả tính
 * năng. Cách vá không đụng tới §HĐ: mỗi nhánh trùng đúng một CÂU HỎI mang cùng
 * SIGNAL_ID, nên chọn nhánh = đặt sẵn câu đó thành `true`. Không mã mới, không
 * trường mới, không tự chấm điểm.
 */

/** Nhánh → câu hỏi mang CÙNG SIGNAL_ID. Xem `src/bo-hoi-nhanh.js:46`. */
const CAU_TUONG_DUONG_CUA_NHANH: Record<string, string | null> = {
  chuyen_tien: 'ho_bao_chuyen_tien_hoac_rut_tien',   // FIN_TRANSFER_REQUEST
  doi_otp: 'ho_xin_ma_trong_tin_nhan',               // CRED_OTP_SHARE
  cai_ung_dung: 'ho_bao_cai_ung_dung_hoac_bam_link', // DEV_INSTALL_APK_UNKNOWN
  // §15.11.1 — hai nhánh này CỐ Ý không mang tín hiệu nào, và sang bộ hỏi đầy đủ.
  gui_giay_to: null,
  khong_ro: null,
};

/**
 * Câu hỏi tiếp theo của từng nhánh — phải khớp `hoiTiep` trong
 * `src/bo-hoi-nhanh.js`. `null` nghĩa là đi hết cả 8 câu.
 */
const HOI_TIEP_CUA_NHANH: Record<string, string[] | null> = {
  chuyen_tien: ['ho_noi_sap_bi_bat_hoac_phat', 'co_ai_dan_noi_gi_voi_ngan_hang', 'ho_nhac_tai_khoan_an_toan'],
  doi_otp: ['ho_bao_chuyen_tien_hoac_rut_tien', 'ho_bao_dung_cup_may'],
  cai_ung_dung: ['ho_bao_dung_cup_may', 'ho_noi_sap_bi_bat_hoac_phat'],
  gui_giay_to: null,
  khong_ro: null,
};

const BIEU_TUONG_NHANH: Record<string, any> = {
  chuyen_tien: CreditCard,
  doi_otp: Lock,
  cai_ung_dung: Download,
  gui_giay_to: FileText,
  khong_ro: HelpCircle,
};

const MAU_VIEN_NHANH: Record<string, string> = {
  chuyen_tien: 'bg-red-50 text-red-700 border-red-200',
  doi_otp: 'bg-amber-50 text-amber-700 border-amber-200',
  cai_ung_dung: 'bg-purple-50 text-purple-700 border-purple-200',
  gui_giay_to: 'bg-blue-50 text-blue-700 border-blue-200',
  khong_ro: 'bg-slate-50 text-slate-700 border-slate-200',
};

/**
 * CÂU DẶN HIỆN NGAY TỪ LẦN CHẠM ĐẦU — 23/9/2026 (Phần 1 "Cầu dao gia đình").
 * Đo trước đó: chọn "Đưa mã OTP" (đã chắc chắn là lừa) vẫn phải trả lời thêm
 * hai câu mới thấy lời dặn. Hai câu đó vẫn hỏi — bộ luật cần đủ tín hiệu, KHÔNG
 * đổi bộ luật — nhưng lời dặn đứng TRÊN câu hỏi ngay từ đầu.
 */
const DAN_NGAY_CUA_NHANH: Record<string, string> = {
  doi_otp: 'Dù thế nào: đừng đọc mã cho ai.',
  cai_ung_dung: 'Đừng cài gì trong lúc đang gọi.',
  chuyen_tien: 'Chưa chuyển gì cả.',
};

/**
 * ⚠️ HÀNG RÀO CHỐNG PHÂN KỲ IM LẶNG.
 *
 * Danh sách mã là của backend (`public/config/ma-hop-dong.json`, sinh từ
 * `src/bo-hoi-nhanh.js`). Chữ hiển thị là của frontend. Nếu hai bên lệch nhau
 * một ký tự, `locTraLoiBoHoiNhanh()` ở `server.js` BỎ IM LẶNG câu đó: trả về
 * 200, không báo gì, và câu trả lời của bác biến mất khỏi phép tính.
 *
 * Nên chỗ nào lệch thì kêu lên ngay lúc chạy, ở console — chứ không đợi tới lúc
 * một lượt thật bị chấm hụt.
 */
const MA_CAU_HOI: string[] = maHopDong.cauHoiNhanh;
const MA_NHANH: string[] = maHopDong.nhanhHanhDong;

for (const ma of MA_CAU_HOI) {
  if (!CAU_HOI_NHANH[ma]) console.error(`[hop-dong] thiếu chữ cho câu hỏi nhanh: ${ma}`);
}
for (const ma of MA_NHANH) {
  if (!NHANH_HANH_DONG[ma]) console.error(`[hop-dong] thiếu chữ cho nhánh: ${ma}`);
}

export interface HoiNhanhProps {
  setView: (v: ViewState) => void;
  t: (key: string) => string;
  lang?: Lang;
  onTriggerEmergency?: () => void;
  /** Để màn kết quả có nút gọi THẲNG người thân (23/9/2026). */
  familyMembers?: { name: string; phone: string }[];
  /** Chỉ màn trình diễn truyền: nút "Hỏi con" chạy trên bản giả lập, không mạng. */
  hoiConApi?: ApiHoiCon;
}

type KetQua = {
  nhan?: string;
  maLyDo?: string[];
  daKiem?: string[];
  chuaKiem?: string[];
  aiDaChay?: boolean;
  canThiep?: string;
  /** Chỉ đặt khi KHÔNG gọi được máy chủ. Không phải một mức rủi ro. */
  khongGoiDuocMayChu?: boolean;
};

/**
 * NỀN SÁNG, CÙNG THẾ GIỚI VỚI TRANG CHỦ — 23/9/2026.
 * Người dùng: "nền màu này và thiết kế xấu quá". Ba bước của màn này từng nằm trên
 * ba nền tối khác nhau (#1e1035 · #2e1065 · slate-900) trong khi trang chủ và màn
 * gọn là tím nhạt — bấm "Đang bị ai gọi?" là như sang một app khác. Nay cả ba
 * bước dùng cùng một nền tím nhạt; màu mạnh chỉ còn ở chỗ mang ý nghĩa (nút đỏ,
 * khối kết quả).
 */
const NEN_MAN = 'min-h-full w-full bg-gradient-to-b from-[#f9f7ff] via-[#f4eeff] to-[#ebe2ff] text-[color:var(--color-ink)] flex flex-col p-5 pb-24 overflow-y-auto';
const NUT_TRON = 'grid place-items-center w-12 h-12 rounded-full bg-white border border-[#e9dcff] text-[color:var(--color-ink)] shadow-[0_6px_14px_-8px_rgba(90,30,160,0.45)] transition-transform duration-150 ease-out active:scale-95 motion-reduce:transition-none';

export function HoiNhanhView({ setView, t, lang = 'vi', onTriggerEmergency, familyMembers, hoiConApi }: HoiNhanhProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [questionQueue, setQuestionQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<KetQua | null>(null);

  const chu = (ma: string, bang = CAU_HOI_NHANH_KHUNG) => tra(bang, ma, lang) ?? '';

  const nguoiThanCoSo = familyMembers?.find((n) => n.phone);
  const soNguoiThan = nguoiThanCoSo?.phone ?? '';
  const tenNguoiThan = nguoiThanCoSo?.name ?? '';
  /*
   * ĐỌC TO MỘT LẦN KHI KẾT QUẢ LÀ CAO — 23/9/2026.
   * ⚠️ HOOK PHẢI Ở ĐẦU COMPONENT, trước mọi `if (result)`: đặt trong nhánh là
   * phá luật hook của React (thứ tự hook đổi giữa các lần dựng).
   */
  const laCaoKQ = !!result && !result.khongGoiDuocMayChu
    && (result.nhan === 'CAO' || result.canThiep === 'PROTECTED_CRITICAL');
  const cauDocKQ = laCaoKQ
    ? `${tra(NHAN, 'CAO', lang) ?? ''}. ${t(cauLenhNgan(
      chonViecAnToan({ maLyDo: result?.maLyDo, nhan: result?.nhan, canThiep: result?.canThiep }),
      Boolean(soNguoiThan),
    ))}`
    : '';
  useDocToMotLan(cauDocKQ, laCaoKQ, lang === 'en' ? 'en-US' : 'vi-VN');

  const handleSelectBranch = (branchMa: string) => {
    setSelectedBranch(branchMa);

    // ⚠️ Tín hiệu của CHÍNH nhánh — xem khối chú thích ở đầu tệp.
    const cauTuongDuong = CAU_TUONG_DUONG_CUA_NHANH[branchMa];
    const traLoiBanDau: Record<string, boolean> = cauTuongDuong ? { [cauTuongDuong]: true } : {};

    const hoiTiep = HOI_TIEP_CUA_NHANH[branchMa];
    // Nhánh không rõ / gửi giấy tờ ⇒ đi HẾT bộ hỏi, không rút gọn (§15.11.1).
    const queue = (hoiTiep ?? MA_CAU_HOI).filter((ma) => traLoiBanDau[ma] === undefined);

    setQuestionQueue(queue);
    setCurrentIndex(0);
    setAnswers(traLoiBanDau);

    if (queue.length === 0) void guiDiKiem(traLoiBanDau);
  };

  /**
   * Gửi về máy chủ và hiển thị đúng thứ máy chủ trả.
   *
   * ⚠️ HỎNG MẠNG THÌ NÓI LÀ HỎNG MẠNG — §4.3.
   * Bản trước, khi `fetch` lỗi, tự tính lấy một mức: `hasHighRisk` từ ba mã, rồi
   * `diem: 75` (cao hơn cả cap 69 của bộ luật). Đó là React tự ra mức, tức phá
   * §4.2, và nó hiện ra giống hệt một kết quả đã kiểm. Ở đây: không mức, không
   * điểm, chỉ nói thẳng là chưa gửi đi kiểm được.
   */
  const guiDiKiem = async (traLoi: Record<string, boolean>) => {
    setLoading(true);
    try {
      const res = await fetch(api('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traLoiBoHoiNhanh: traLoi }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch {
      setResult({ khongGoiDuocMayChu: true });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (isYes: boolean) => {
    const currentMa = questionQueue[currentIndex];
    /**
     * ⚠️ HẾT CÂU HỎI THÌ GỬI ĐI, ĐỪNG GHI MỘT KHOÁ RỖNG.
     * Không có câu nào ở vị trí này nghĩa là hàng đợi đã cạn (hoặc bị đặt lại
     * giữa chừng). Ghi `{undefined: true}` vào bảng trả lời thì máy chủ lọc bỏ
     * im lặng — câu trả lời của bác biến mất mà không ai báo.
     */
    if (!currentMa) {
      await guiDiKiem(answers);
      return;
    }

    const newAnswers = { ...answers, [currentMa]: isYes };
    setAnswers(newAnswers);

    if (currentIndex + 1 < questionQueue.length) setCurrentIndex(currentIndex + 1);
    else await guiDiKiem(newAnswers);
  };

  const handleReset = () => {
    setSelectedBranch(null);
    setQuestionQueue([]);
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
  };

  // ══════════════════ MÀN KẾT QUẢ ══════════════════
  if (result) {
    const nhan = result.nhan;
    const nhanChu = nhan ? tra(NHAN, nhan, lang) : null;
    const lyDo = traNhieu(MA_LY_DO, result.maLyDo ?? [], lang);

    /**
     * §HĐ luật 3 — `chuaKiem` KHÔNG RỖNG ⇒ BẮT BUỘC HIỆN, CÙNG CỠ CHỮ VỚI NHÃN.
     *
     * ⚠️ `aiDaChay === false` mà `ai_khong_chay` chưa nằm trong `chuaKiem` thì
     * phải tự thêm — §HĐ nói frontend PHẢI có dòng "lượt này không có AI đọc".
     * Thêm rồi lọc trùng, để không nói hai lần cùng một chuyện.
     */
    const maChuaKiem = [...(result.chuaKiem ?? [])];
    if (result.aiDaChay === false && !maChuaKiem.includes('ai_khong_chay')) {
      maChuaKiem.push('ai_khong_chay');
    }
    const chuaKiem = traNhieu(CHUA_KIEM, maChuaKiem, lang);

    const khongGoiDuoc = result.khongGoiDuocMayChu === true;
    const laCao = nhan === 'CAO';
    const laNghiNgo = nhan === 'NGHI_NGO';
    const laKhanCap = result.canThiep === 'PROTECTED_CRITICAL';

    // ⚠️ §15.16 test 13 — KHÔNG màu xanh lá cho kết luận ở màn này.
    // Nền ĐẶC để chữ trắng đạt sàn 4.5:1 trên nền trang sáng: đỏ 6,5:1 · nâu hổ phách 7:1 · tím 8,6:1.
    const khungMau = laCao
      ? 'bg-[#b91c1c] shadow-[0_18px_36px_-16px_rgba(185,28,28,0.75)]'
      : laNghiNgo
        ? 'bg-[#92400e] shadow-[0_18px_36px_-16px_rgba(146,64,14,0.7)]'
        : 'bg-[#5b21b6] shadow-[0_18px_36px_-16px_rgba(91,33,182,0.7)]';

    return (
      <div className={NEN_MAN}>
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={handleReset}
            aria-label={chu('hoi_lai')}
            className={NUT_TRON}
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-[15px] font-bold text-[color:var(--color-ink-2)]">
            {chu('ket_qua')}
          </span>
          <div className="w-12" />
        </div>

        <div className={`${khungMau} text-white rounded-[32px] p-6 mb-4 flex flex-col items-center text-center`}>
          <div
            aria-hidden="true"
            className={`w-16 h-16 rounded-full flex items-center justify-center bg-white mb-3 shadow-[0_6px_14px_-4px_rgba(0,0,0,0.3)] ${
              laCao ? 'text-[#b91c1c]' : laNghiNgo ? 'text-[#92400e]' : 'text-[#5b21b6]'
            }`}
          >
            {laCao ? <ShieldAlert size={36} /> : laNghiNgo ? <AlertTriangle size={36} /> : <HelpCircle size={36} />}
          </div>

          {/* Nhãn NGUYÊN VĂN từ catalog. Không có nhãn thứ tư, không có "An toàn". */}
          <h2
            className="text-[25px] font-black text-white mb-2 leading-tight"
            style={nhan ? { color: MAU_NHAN[nhan]?.chuTrenDac ?? '#ffffff' } : undefined}
          >
            {khongGoiDuoc
              ? tra(
                { MAT_KET_NOI: { vi: 'Cháu chưa gửi đi kiểm được', en: 'I could not send this to be checked' } },
                'MAT_KET_NOI',
                lang,
              )
              : nhanChu}
          </h2>

          {khongGoiDuoc ? (
            <p className="text-[16px] text-white leading-relaxed font-medium">
              {lang === 'en'
                ? 'The network did not go through, so nothing was checked. While it is unclear, please hang up and call your family yourself.'
                : 'Mạng không đi được nên chưa có gì được kiểm cả. Trong lúc chưa rõ, bác cúp máy rồi tự gọi cho con cháu nhé.'}
            </p>
          ) : (
            /*
              ⚠️ MỨC CAO CHỈ CÒN MỘT CÂU LỆNH — 23/9/2026. Câu dài bên dưới lặp lại
              đúng việc mà nút gọi ngay dưới thẻ này làm; người đang hoảng không
              đọc hết. Các mức khác giữ câu đầy đủ.
            */
            laCao ? (
              <p className="text-[22px] font-black text-white leading-snug">
                {lang === 'en' ? 'Please hang up now.' : 'Bác cúp máy ngay nhé.'}
              </p>
            ) : (
              <p className="text-[16px] text-white/95 leading-relaxed font-medium">
                {lang === 'en'
                  ? 'Do not transfer money and do not read out any code. Hang up and call your family yourself.'
                  : 'Bác đừng chuyển tiền và đừng đọc mã nào. Cúp máy rồi tự gọi cho con cháu.'}
              </p>
            )
          )}
        </div>

        {/*
          HÀNH ĐỘNG TRƯỚC, CHỮ SAU — 23/9/2026. Đo trước đó: màn này dặn "tự gọi cho
          con cháu" mà KHÔNG có nút gọi, và nút chính ghi "Cúp máy & dừng 60 giây"
          trong khi app không cúp máy được.
          ⚠️ Nút "Tôi đã cúp máy" dẫn sang màn khẩn cấp (câu lệnh + nút gọi, hoặc
          113 khi chưa có số) — không phải một lời hứa app làm thay.
        */}
        {(laCao || laKhanCap) && !khongGoiDuoc && (
          <div className="flex flex-col gap-3 mb-4">
            {soNguoiThan && (
              <button
                onClick={() => {
                  ghiKetQua({ canThiep: result.canThiep ?? null, nhan: nhan ?? null, maLyDo: result.maLyDo ?? [], hanhDong: 'bam_goi_nguoi_than' });
                  goiDienThoai(soNguoiThan);   // Phần 4: APK gọi thẳng một chạm; web mở `tel:`
                }}
                data-vai-tro="nut-chinh"
                className="w-full min-h-[80px] py-4 px-6 bg-amber-300 text-amber-950 font-black text-[20px] rounded-[32px] flex flex-col items-center justify-center gap-0.5 shadow-[0_14px_28px_-14px_rgba(180,83,9,0.6)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
              >
                <span className="flex items-center gap-2"><PhoneCall size={24} /> {t('GỌI NGAY CHO CON CHÁU')}</span>
                <span className="text-[16px] font-bold text-[#6b3a05]">{tenNguoiThan} ({soNguoiThan})</span>
              </button>
            )}
            <button
              onClick={() => (onTriggerEmergency ? onTriggerEmergency() : setView('warning'))}
              data-vai-tro="nut-chinh"
              className={`w-full min-h-[56px] py-4 px-6 ${soNguoiThan ? 'bg-white border-2 border-[#d9c6ff] text-[color:var(--color-ink)]' : 'bg-[#b91c1c] text-white shadow-[0_14px_28px_-12px_rgba(185,28,28,0.7)]'} font-black text-[18px] rounded-full flex items-center justify-center gap-2 transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none`}
            >
              <PhoneOff size={20} />
              <span>{t('Tôi đã cúp máy')}</span>
            </button>
          </div>
        )}

        {/* Lý do — MÃ tra ra câu, không phải câu do máy chủ gửi sang. */}
        {lyDo.length > 0 && (
          <ul className="flex flex-col gap-2 mb-4">
            {lyDo.map((cau) => (
              <li
                key={cau}
                className="bg-white border border-[#e9dcff] rounded-[24px] px-4 py-3 text-[16px] font-medium text-[color:var(--color-ink)] flex items-start gap-2.5 shadow-[0_8px_18px_-12px_rgba(90,30,160,0.35)]"
              >
                <AlertTriangle size={20} aria-hidden="true" className="text-[#b45309] shrink-0 mt-0.5" />
                <span>{cau}</span>
              </li>
            ))}
          </ul>
        )}

        {/*
          §HĐ luật 3 — CÙNG CỠ CHỮ VỚI NHÃN, không phải dòng chú thích nhỏ ở chân
          màn hình. "Không kiểm được" KHÁC "đã kiểm, không thấy gì" (§4.3), và
          bác phải đọc được nó mà không cần tìm.
        */}
        {chuaKiem.length > 0 && (
          <div className="bg-[color:var(--color-unchecked-bg)] border-2 border-[color:var(--color-unchecked-border)] text-[color:var(--color-unchecked-ink)] rounded-[28px] p-5 mb-4">
            {/*
              ⚠️ 25px, ĐÚNG BẰNG NHÃN (`h2 text-[25px]`) — sửa 23/9/2026. Trước đó
              khối này 16px ở màn này trong khi nhãn 25px: vi phạm §HĐ luật 3 mà
              không test nào bắt, vì test cũ chỉ đọc App.tsx. Hàng rào mới ở
              `test/man-khan-cap-mot-viec.test.js`. Khối vẫn nằm DƯỚI nút gọi.
            */}
            <div className="flex items-center gap-2 mb-2">
              <EyeOff size={24} aria-hidden="true" className="shrink-0" />
              <span className="text-[25px] font-black leading-tight">
                {lang === 'en' ? 'What I could NOT check' : 'Những thứ cháu CHƯA kiểm được'}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {chuaKiem.map((cau) => (
                <li key={cau} className="text-[25px] font-medium leading-tight">
                  • {cau}
                </li>
              ))}
            </ul>
            <p className="text-[15px] mt-2.5 leading-snug">{chu('nhac_gioi_han')}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-auto">
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-3.5 px-4 rounded-full border-2 border-[#e4d7ff] bg-white text-[#6d28d9] font-bold flex items-center justify-center gap-2 shadow-[0_8px_18px_-10px_rgba(90,30,160,0.4)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
          >
            <RotateCcw size={20} aria-hidden="true" />
            <span>{chu('hoi_lai')}</span>
          </button>

          {/*
            §4.6 — LUÔN CÓ LỐI RA. Kể cả ở màn khẩn cấp. Người bị kẹt trong màn
            báo động giả sẽ hoảng và gỡ ứng dụng.
          */}
          <button
            type="button"
            onClick={() => setView('home')}
            className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-[color:var(--color-ink)] font-bold flex items-center justify-center gap-2 shadow-[0_14px_28px_-12px_rgba(90,30,160,0.6),inset_0_2px_0_rgba(255,255,255,0.4)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
          >
            <Home size={20} aria-hidden="true" />
            <span>{chu('ve_trang_chu')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════ MÀN ĐANG HỎI ══════════════════
  if (selectedBranch && questionQueue.length > 0 && questionQueue[currentIndex]) {
    const currentMa = questionQueue[currentIndex];
    const cauHoi = tra(CAU_HOI_NHANH, currentMa, lang);
    const progressPercent = Math.round(((currentIndex + 1) / questionQueue.length) * 100);

    return (
      <div className={`${NEN_MAN} justify-between`}>
        <div>
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={handleReset}
              aria-label={chu('hoi_lai')}
              className={NUT_TRON}
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-[15px] font-bold text-[color:var(--color-ink-2)]">
              {chu('cau_so')
                .replace('{i}', String(currentIndex + 1))
                .replace('{n}', String(questionQueue.length))}
            </span>
            <div className="w-12" />
          </div>

          <div className="w-full h-2.5 bg-[#e9dcff] rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-[#9e76ea] to-[#6d28d9] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {selectedBranch && DAN_NGAY_CUA_NHANH[selectedBranch] && (
            <p role="status" className="w-full mb-4 rounded-[28px] bg-red-700 px-5 py-4 text-[20px] font-black text-white text-center [text-wrap:balance] shadow-[0_12px_24px_-14px_rgba(185,28,28,0.7)]">
              {t(DAN_NGAY_CUA_NHANH[selectedBranch])}
            </p>
          )}

          <div className="bg-white rounded-[32px] p-6 border border-[#e9dcff] shadow-[0_14px_30px_-16px_rgba(90,30,160,0.45)] mb-6">
            <span className="text-[15px] font-bold text-[#6d28d9] mb-2 block">
              {chu('tro_ly_hoi')}
            </span>
            <h2 className="text-[22px] sm:text-[25px] font-black text-[color:var(--color-ink)]">{cauHoi}</h2>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <button
            type="button"
            onClick={() => handleAnswer(true)}
            data-vai-tro="nut-chinh"
            disabled={loading}
            className="w-full py-5 px-6 rounded-full bg-gradient-to-r from-[#c81e1e] via-[#dc2626] to-[#c81e1e] text-white flex items-center justify-center shadow-[0_14px_28px_-12px_rgba(220,38,38,0.7),inset_0_2px_0_rgba(255,255,255,0.25)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none disabled:opacity-70"
          >
            <span className="text-[1.25rem] font-bold">{loading ? chu('dang_kiem') : chu('tra_loi_co')}</span>
          </button>

          {/*
            ⚠️ Trả lời KHÔNG không trừ điểm — máy chủ chỉ sinh tín hiệu từ câu CÓ.
            Nút này không được vẽ như một lối thoát "an toàn": trắng, viền tím,
            không xanh lá.
          */}
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            data-vai-tro="nut-chinh"
            disabled={loading}
            className="w-full py-4 px-6 rounded-full border-2 border-[#d9c6ff] bg-white text-[color:var(--color-ink)] flex items-center justify-center shadow-[0_8px_18px_-10px_rgba(90,30,160,0.4)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none disabled:opacity-70"
          >
            <span className="text-[1.125rem] font-bold">{loading ? chu('dang_kiem') : chu('tra_loi_khong')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════ MÀN CHỌN NHÁNH ══════════════════
  return (
    <div className={NEN_MAN}>
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => setView('home')}
          aria-label={chu('ve_trang_chu')}
          className={NUT_TRON}
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 text-red-700 rounded-full border border-red-200 text-[14px] font-bold">
          <PhoneCall size={16} aria-hidden="true" />
          <span>{chu('dang_nghe_may')}</span>
        </div>
        <div className="w-12" />
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-[25px] font-black text-[color:var(--color-ink)] mb-2">{chu('tieu_de')}</h1>
        <p className="text-[16px] text-[color:var(--color-ink-2)]">{chu('dan_dat')}</p>
      </div>

      {/* Người gọi xưng là con, cháu ⇒ hỏi con qua kênh khác, một chạm (23/9/2026). */}
      <HoiCon t={t} familyMembers={familyMembers} api={hoiConApi} nhipMs={hoiConApi ? 700 : undefined} />

      <div className="flex flex-col gap-3 mb-6">
        {MA_NHANH.map((ma) => {
          const IconComponent = BIEU_TUONG_NHANH[ma] ?? HelpCircle;
          const nhan = tra(NHANH_HANH_DONG, ma, lang);
          if (!nhan) return null;
          return (
            <button
              type="button"
              key={ma}
              onClick={() => handleSelectBranch(ma)}
              data-vai-tro="nut-chinh"
              className="w-full flex items-center gap-3 rounded-[32px] border border-[#e9dcff] bg-white py-3 pl-3 pr-4 text-left shadow-[0_10px_24px_-14px_rgba(90,30,160,0.45)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
            >
              <span
                aria-hidden="true"
                className={`grid place-items-center w-12 h-12 shrink-0 rounded-full border ${MAU_VIEN_NHANH[ma] ?? ''}`}
              >
                <IconComponent size={24} />
              </span>
              {/*
                Không mũi tên ở cuối: cả thẻ là nút, và mũi tên ăn mất ~34px khiến
                "Đưa mã OTP / Mật khẩu" gãy thành "Mật / khẩu" ở khổ 375px.
              */}
              <span className="flex-1 text-[1.0625rem] font-bold text-[color:var(--color-ink)] [text-wrap:balance]">{nhan}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-2">
        <button
          type="button"
          onClick={() => (onTriggerEmergency ? onTriggerEmergency() : setView('warning'))}
          className="w-full flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#c81e1e] via-[#dc2626] to-[#c81e1e] text-white py-4 px-6 text-center shadow-[0_14px_28px_-12px_rgba(220,38,38,0.7),inset_0_2px_0_rgba(255,255,255,0.25)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
        >
          <ShieldAlert size={24} aria-hidden="true" className="shrink-0" />
          <span className="text-[1.0625rem] font-bold">{chu('so_hai')}</span>
        </button>
      </div>
    </div>
  );
}
