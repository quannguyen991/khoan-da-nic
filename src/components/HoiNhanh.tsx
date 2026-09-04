import { useState } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
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

export function HoiNhanhView({ setView, t, lang = 'vi', onTriggerEmergency }: HoiNhanhProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [questionQueue, setQuestionQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<KetQua | null>(null);

  const chu = (ma: string, bang = CAU_HOI_NHANH_KHUNG) => tra(bang, ma, lang) ?? '';

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
    const khungMau = laCao
      ? 'bg-red-950/90 border-red-500'
      : laNghiNgo
        ? 'bg-amber-950/90 border-amber-500'
        : 'bg-purple-950/90 border-purple-500';

    return (
      <div className="min-h-full w-full bg-slate-900 text-white flex flex-col p-5 pb-24 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleReset}
            aria-label={chu('hoi_lai')}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-full text-slate-300"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="text-[14px] font-bold uppercase tracking-wider text-purple-300">
            {chu('ket_qua')}
          </span>
          <div className="w-8" />
        </div>

        <div className={`${khungMau} border-2 rounded-3xl p-6 mb-4 shadow-2xl flex flex-col items-center text-center`}>
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white mb-3 shadow-lg ${
              laCao ? 'bg-red-600' : laNghiNgo ? 'bg-amber-600' : 'bg-purple-600'
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
            <p className="text-[16px] text-purple-100 leading-relaxed font-medium">
              {lang === 'en'
                ? 'The network did not go through, so nothing was checked. While it is unclear, please hang up and call your family yourself.'
                : 'Mạng không đi được nên chưa có gì được kiểm cả. Trong lúc chưa rõ, bác cúp máy rồi tự gọi cho con cháu nhé.'}
            </p>
          ) : (
            <>
              {laCao && (
                <p className="text-[18px] font-black text-white mb-2">
                  {lang === 'en' ? 'Please hang up now.' : 'Bác cúp máy ngay nhé.'}
                </p>
              )}
              <p className="text-[16px] text-white/95 leading-relaxed font-medium">
                {lang === 'en'
                  ? 'Do not transfer money and do not read out any code. Hang up and call your family yourself.'
                  : 'Bác đừng chuyển tiền và đừng đọc mã nào. Cúp máy rồi tự gọi cho con cháu.'}
              </p>
            </>
          )}
        </div>

        {/* Lý do — MÃ tra ra câu, không phải câu do máy chủ gửi sang. */}
        {lyDo.length > 0 && (
          <ul className="flex flex-col gap-2 mb-4">
            {lyDo.map((cau) => (
              <li
                key={cau}
                className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-[16px] font-medium text-white flex items-start gap-2.5"
              >
                <AlertTriangle size={18} className="text-amber-300 shrink-0 mt-0.5" />
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
          <div className="bg-slate-800/90 border-2 border-slate-500 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <EyeOff size={20} className="text-slate-300 shrink-0" />
              <span className="text-[16px] font-black text-slate-100">
                {lang === 'en' ? 'What I could NOT check' : 'Những thứ cháu CHƯA kiểm được'}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {chuaKiem.map((cau) => (
                <li key={cau} className="text-[16px] text-slate-100 font-medium leading-snug">
                  • {cau}
                </li>
              ))}
            </ul>
            <p className="text-[14px] text-slate-300 mt-2.5 leading-snug">{chu('nhac_gioi_han')}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-auto">
          {laKhanCap && (
            <button
              onClick={() => (onTriggerEmergency ? onTriggerEmergency() : setView('warning'))}
              data-vai-tro="nut-chinh"
              className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/40"
            >
              <PhoneOff size={20} />
              <span>{lang === 'en' ? 'Hang up & pause 60 seconds' : 'Cúp máy & dừng 60 giây'}</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="w-full py-3.5 px-4 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-[16px] rounded-2xl flex items-center justify-center gap-2 border border-white/10"
          >
            <RotateCcw size={18} />
            <span>{chu('hoi_lai')}</span>
          </button>

          {/*
            §4.6 — LUÔN CÓ LỐI RA. Kể cả ở màn khẩn cấp. Người bị kẹt trong màn
            báo động giả sẽ hoảng và gỡ ứng dụng.
          */}
          <button
            onClick={() => setView('home')}
            className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-[16px] rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30"
          >
            <Home size={18} />
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
      <div className="min-h-full w-full bg-[#2e1065] text-white flex flex-col p-6 pb-20 justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleReset}
              aria-label={chu('hoi_lai')}
              className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full text-white"
            >
              <ChevronLeft size={22} />
            </button>
            <span className="text-[14px] font-bold text-purple-200">
              {chu('cau_so')
                .replace('{i}', String(currentIndex + 1))
                .replace('{n}', String(questionQueue.length))}
            </span>
            <div className="w-8" />
          </div>

          <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden mb-6 border border-purple-800">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl border-2 border-[#2e1065] mb-6">
            <span className="text-[14px] font-extrabold uppercase text-purple-700 tracking-wider mb-2 block">
              {chu('tro_ly_hoi')}
            </span>
            <h2 className="text-[22px] sm:text-[25px] font-black text-[#1e1b4b] leading-snug">{cauHoi}</h2>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleAnswer(true)}
            data-vai-tro="nut-chinh"
            disabled={loading}
            className="w-full py-5 px-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-[18px] rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-600/40 transition-transform disabled:opacity-70"
          >
            <span>{loading ? chu('dang_kiem') : chu('tra_loi_co')}</span>
          </button>

          {/*
            ⚠️ Trả lời KHÔNG không trừ điểm — máy chủ chỉ sinh tín hiệu từ câu CÓ.
            Nút này không được vẽ như một lối thoát "an toàn".
          */}
          <button
            onClick={() => handleAnswer(false)}
            data-vai-tro="nut-chinh"
            disabled={loading}
            className="w-full py-4 px-6 bg-white/15 hover:bg-white/25 active:scale-95 text-purple-100 font-bold text-[16px] rounded-2xl flex items-center justify-center gap-3 border border-white/20 transition-transform disabled:opacity-70"
          >
            <span>{loading ? chu('dang_kiem') : chu('tra_loi_khong')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════ MÀN CHỌN NHÁNH ══════════════════
  return (
    <div className="min-h-full w-full bg-[#1e1035] text-white flex flex-col p-5 pb-24 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setView('home')}
          aria-label={chu('ve_trang_chu')}
          className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full text-white"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-200 rounded-full border border-red-500/40 text-[14px] font-bold">
          <PhoneCall size={14} />
          <span>{chu('dang_nghe_may')}</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="mb-5 text-center">
        <h1 className="text-[25px] font-black text-white mb-1.5">{chu('tieu_de')}</h1>
        <p className="text-[14px] text-purple-200">{chu('dan_dat')}</p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {MA_NHANH.map((ma) => {
          const IconComponent = BIEU_TUONG_NHANH[ma] ?? HelpCircle;
          const nhan = tra(NHANH_HANH_DONG, ma, lang);
          if (!nhan) return null;
          return (
            <button
              key={ma}
              onClick={() => handleSelectBranch(ma)}
              data-vai-tro="nut-chinh"
              className="w-full p-4 bg-white/95 text-slate-900 rounded-2xl flex items-center justify-between border-2 border-[#2e1065]/50 shadow-md hover:bg-white active:scale-98 transition-all text-left"
            >
              <span className="flex items-center gap-3.5">
                <span
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${MAU_VIEN_NHANH[ma] ?? ''}`}
                >
                  <IconComponent size={24} />
                </span>
                <span className="font-extrabold text-[16px] text-[#1e1b4b] leading-tight">{nhan}</span>
              </span>
              <ArrowRight size={20} className="text-purple-700 shrink-0" />
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-2">
        <button
          onClick={() => (onTriggerEmergency ? onTriggerEmergency() : setView('warning'))}
          className="w-full py-3.5 px-4 bg-red-700 hover:bg-red-600 active:scale-95 text-white font-extrabold text-[16px] rounded-2xl flex items-center justify-center gap-2 border border-red-400 shadow-lg shadow-red-600/30"
        >
          <ShieldAlert size={18} />
          <span>{chu('so_hai')}</span>
        </button>
      </div>
    </div>
  );
}
