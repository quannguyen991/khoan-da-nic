import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Phone, 
  MessageSquare, 
  Sliders, 
  Sparkles, 
  BatteryMedium, 
  Wifi, 
  MapPin, 
  AlertTriangle, 
  Send,
  Smartphone,
  EyeOff,
  Info
} from 'lucide-react';
import { ViewState } from '../App';
import { api } from '../api-goc';
import { dangNhap as dangNhapTaiKhoan, type HoSo as HoSoTaiKhoan } from '../tai-khoan';
import { MA_TAI_KHOAN } from '../catalog';
import { Lang, NHAN, CHUA_KIEM, MA_LY_DO, tra, traNhieu } from '../catalog';
import { ThuTinhHuong } from './ThuTinhHuong';

/**
 * Hình dạng §HĐ mà `/api/analyze` trả về. Frontend KHÔNG thêm trường nào, và
 * KHÔNG bao giờ tự đặt `nhan` — trừ `khongGoiDuocMayChu`, vốn không phải một
 * mức rủi ro mà là lời khai "chưa gửi đi kiểm được" (§4.3).
 */
type KetQuaKiem = {
  nhan?: string;
  maLyDo?: string[];
  chuaKiem?: string[];
  aiDaChay?: boolean;
  canThiep?: string;
  khongGoiDuocMayChu?: boolean;
};

// --- Guardian Intro (Role selection & Setup) ---
export function GuardianIntroView({ 
  setView, 
  setUserRole,
  t
}: { 
  setView: (v: ViewState) => void; 
  setUserRole?: (role: 'elder' | 'guardian') => void;
  t?: (key: string) => string;
}) {
  const tr = (k: string) => (t ? t(k) : k);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 flex flex-col items-center justify-center w-full px-6 py-12 max-w-4xl mx-auto text-center"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-sky-500/20 text-white">
        <ShieldCheck size={36} />
      </div>

      <span className="text-[14px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 border border-sky-200 px-3 py-1 rounded-full mb-3">
        {tr("Bảng điều khiển cho con cháu")}
      </span>

      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">
        Khoan Đã <span className="text-sky-600">Guardian</span>
      </h1>

      <p className="text-slate-600 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
        {tr("Chỗ để con cháu theo sát bố mẹ từ xa: nhận cảnh báo lừa đảo sớm và nhắc trước khi bố mẹ bắt máy số lạ. Khoan Đã không chặn cuộc gọi.")}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        <button
          onClick={() => {
            if (setUserRole) setUserRole('guardian');
            setView('guardian');
          }}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <ShieldCheck size={18} className="text-sky-400" />
          {tr("Vào Dashboard ngay")}
        </button>

        <button
          onClick={() => {
            if (setUserRole) setUserRole('elder');
            setView('home');
          }}
          className="w-full bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 py-3.5 px-6 rounded-2xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Smartphone size={18} />
          {tr("Chuyển sang vai Bác (Người già)")}
        </button>
      </div>
    </motion.div>
  );
}

// --- Guardian Auth View ---
export function GuardianAuthView({ 
  setView, 
  onDangNhapXong,
  setUserRole,
  t
}: { 
  setView: (v: ViewState) => void; 
  /** Gọi khi máy chủ đã công nhận phiên. `null` nghĩa là chưa đăng nhập. */
  onDangNhapXong: (hs: HoSoTaiKhoan | null) => void;
  setUserRole?: (role: 'elder' | 'guardian') => void;
  t?: (key: string) => string;
}) {
  const [phone, setPhone] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tr = (k: string) => (t ? t(k) : k);

  /**
   * ⚠️ MÀN NÀY TỪNG LÀ MỘT CÁI VỎ, GIỐNG HỆT `LoginView`.
   * `setTimeout(600ms)` rồi `setIsLoggedIn(true)` — một ô số điện thoại không
   * đi tới đâu, không mật khẩu, không lượt gọi mạng nào. Nay gọi máy chủ thật.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoi(null);
    if (!phone.trim() || !matKhau) { setLoi('THIEU_THONG_TIN'); return; }
    setLoading(true);
    try {
      const hs = await dangNhapTaiKhoan(phone.trim(), matKhau);
      onDangNhapXong(hs);
      if (setUserRole) setUserRole('guardian');
      setView('guardian');
    } catch (err: any) {
      setLoi(err?.ma || 'KHONG_GOI_DUOC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex-1 flex flex-col items-center justify-center w-full px-6 py-10 max-w-md mx-auto"
    >
      <div className="w-full bg-white rounded-3xl p-8 shadow-xl border border-sky-100">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600">
            <ShieldCheck size={28} />
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-900 text-center mb-1">{tr("Đăng nhập Guardian")}</h2>
        <p className="text-[14px] text-slate-500 text-center mb-6">{tr("Kết nối để quản lý và bảo vệ thiết bị của Bố/Mẹ")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">{tr("Số điện thoại của bạn")}</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={tr("Ví dụ: 0988 123 456")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          {/*
            ⚠️ Ô MẬT KHẨU — TRƯỚC ĐÂY MÀN NÀY KHÔNG CÓ.
            Chỉ một ô số điện thoại, và bấm là vào thẳng. Tức bất kỳ ai cầm máy
            cũng mở được bảng điều khiển theo dõi bố mẹ bằng cách gõ một số bất kỳ.
          */}
          <div>
            <label htmlFor="g-mk" className="text-[14px] font-bold text-slate-600 mb-1.5 block">{tr("Mật khẩu")}</label>
            <input
              id="g-mk"
              type="password"
              required
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              autoComplete="current-password"
              className="w-full min-h-[52px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[16px] font-medium text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          {loi && (
            <div role="alert" className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl">
              <p className="text-[15px] font-bold text-amber-900 leading-snug">
                {tra(MA_TAI_KHOAN, loi, 'vi') ?? tra(MA_TAI_KHOAN, 'KHONG_GOI_DUOC', 'vi')}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 active:scale-95 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              tr("Đăng nhập & Tiếp tục")
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              if (setUserRole) setUserRole('elder');
              setView('home');
            }}
            className="text-[14px] font-bold text-purple-700 hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <Smartphone size={14} /> {tr("Chuyển sang giao diện Người cao tuổi")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Streamlined Minimalist Guardian Dashboard ---
export function GuardianView({
  setView,
  t,
  lang = 'vi',
  isDesktop = true,
  isLoggedIn = true,
  onAnalyze,
  familyMembers,
  onTriggerEmergency,
  setUserRole
}: {
  setView: (v: ViewState) => void;
  t: any;
  lang?: Lang;
  isDesktop?: boolean;
  isLoggedIn?: boolean;
  onAnalyze?: (text: string, image?: string | null) => void;
  familyMembers?: any[];
  onTriggerEmergency?: () => void;
  setUserRole?: (r: 'elder' | 'guardian') => void;
}) {
  const tr = (k: string) => (t ? t(k) : k);

  /**
   * ⚠️ ĐÂY LÀ DỮ LIỆU MẪU CỦA BẢN XEM THỬ, KHÔNG PHẢI SỐ ĐO THẬT.
   *
   * Chưa có đường nào nối máy của bố mẹ về đây: không endpoint trạng thái thiết
   * bị, không đồng bộ pin/sóng/vị trí, và §12 giữ nguyên privacy model — không
   * bật đồng bộ máy chủ mặc định. Màn hình PHẢI nói ra điều đó (§4.3): một bảng
   * "pin 88% · tại nhà · đang an toàn" trông y hệt số đo thật là đúng dạng lỗi
   * mà cả dự án này được dựng để tránh.
   *
   * Băng thông báo ngay đầu màn là chỗ nói ra. Đừng gỡ nó đi trước khi có đường
   * dữ liệu thật.
   */
  /*
   * ⚠️ RỖNG, KHÔNG PHẢI DỮ LIỆU MẪU.
   *
   * Bản trước để sẵn "Bố Nguyễn Văn An · 0912 345 678 · 4G Viettel". Màn này
   * dành cho người con đang muốn biết bố mẹ có an toàn không — và ba dòng đó
   * trả lời câu hỏi ấy bằng thông tin bịa. Hai băng cảnh báo bên dưới đã nói
   * "máy của bố mẹ chưa nối vào đây", nhưng một cái tên cụ thể nằm ngay trên
   * đầu màn thì mạnh hơn mọi lời cải chính đặt ở dưới.
   */
  const [parentData] = useState<{ name: string; phone: string; network: string } | null>(null);

  // Protection Toggles
  const [rules, setRules] = useState({
    blockUnknown: true,
    monitorTransfer: true,
    pinNotification: true,
  });

  // Fast AI Situation Check Input
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<KetQuaKiem | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [sentAlertToast, setSentAlertToast] = useState(false);

  const toggleRule = (key: keyof typeof rules) => {
    setRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * §4.2 — BỘ LUẬT DUY NHẤT LÀ `src/analysis/decision-engine.js`.
   *
   * ⚠️ BẢN TRƯỚC TỰ CHẤM ĐIỂM NGAY TRONG TRÌNH DUYỆT: một chuỗi `text.includes()`
   * rồi tự đặt CAO / NGHI_NGO / CHUA_THAY, kèm câu "An toàn: Chưa phát hiện dấu
   * hiệu lừa đảo phổ biến" — vừa là nhãn thứ tư bị §4.1 cấm tuyệt đối, vừa là
   * một kết luận KHÔNG ai kiểm. Và đây là màn con cháu nhìn để yên tâm về bố mẹ,
   * nên nó là chỗ tệ nhất để đặt một kết luận bịa.
   *
   * Giờ nó hỏi đúng đường mà bác dùng: `/api/analyze`, rồi hiện đúng thứ máy chủ
   * trả — kể cả `chuaKiem`.
   */
  const handleQuickAiCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    setIsChecking(true);
    setQueryResult(null);
    try {
      const res = await fetch(api('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vanBan: queryInput }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setQueryResult(await res.json());
    } catch {
      // §4.3 — hỏng mạng thì nói là hỏng mạng, KHÔNG đoán lấy một mức.
      setQueryResult({ khongGoiDuocMayChu: true });
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * ⚠️ §11 CẤM CÂU "đã gửi cho người thân" KHI MỚI CHỈ MỞ BẢNG CHIA SẺ.
   * Bản trước chỉ bật một toast "Đã gửi lời nhắc an toàn đến điện thoại của Bố!"
   * mà không gửi gì cả. Giờ nó mở đúng ứng dụng tin nhắn, và câu chữ chỉ nói
   * đúng chuyện đã xảy ra: cửa sổ soạn tin đã mở, người bấm Gửi là con cháu.
   */
  const sendSafetyReminderToParent = () => {
    /*
     * ⚠️ CHƯA NỐI MÁY NÀO THÌ KHÔNG NHẮN ĐI ĐÂU CẢ.
     * Trước đây chỗ này lấy số từ dữ liệu mẫu — tức bấm "Nhắc bố mẹ" sẽ mở
     * cửa sổ soạn tin gửi tới một số bịa. Người con tưởng đã nhắc được.
     */
    if (!parentData?.phone) return;
    const so = parentData.phone.replace(/\s/g, '');
    const noiDung = tr('Bố/mẹ ơi, có ai gọi hỏi tiền hay hỏi mã thì bố/mẹ cúp máy rồi gọi lại cho con nhé.');
    window.open(`sms:${so}?body=${encodeURIComponent(noiDung)}`, '_self');
    setSentAlertToast(true);
    setTimeout(() => setSentAlertToast(false), 4000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Toast Notification when reminder sent */}
      <AnimatePresence>
        {sentAlertToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 text-[14px] font-bold"
          >
            <MessageSquare size={16} className="text-sky-400" />
            {tr("Đã mở ứng dụng tin nhắn. Anh/chị bấm Gửi trong đó nhé.")}
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        §4.3 — BĂNG NÀY PHẢI Ở LẠI CHO TỚI KHI CÓ ĐƯỜNG DỮ LIỆU THẬT.
        Một bảng điều khiển hiện "pin 88% · tại nhà · đang an toàn" mà không có
        máy nào gửi số về là một lời trấn an không ai kiểm. Đây là màn con cháu
        nhìn để yên tâm — nó phải nói thật về việc nó biết được gì.
      */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <Info size={20} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[16px] font-semibold text-amber-900 leading-snug">
            {tr("Bản xem thử: máy của bố mẹ chưa được nối vào đây. Những con số dưới đây là ví dụ, không phải trạng thái thật.")}
          </p>
        </div>

        {/*
          ⚠️ ĐỔI VAI PHẢI LUÔN THẤY ĐƯỢC, KHÔNG CHỈ Ở MÀN ĐẦU.
          Vai được lưu vào máy, nên ai lỡ chọn nhầm "Người cao tuổi" trên máy
          tính sẽ mắc kẹt trong giao diện điện thoại phóng to và không biết
          đường ra. Đó chính là màn hình người dùng gửi ảnh báo lỗi.
        */}
        {setUserRole && (
          <button
            onClick={() => { setUserRole('elder'); setView('home'); }}
            className="shrink-0 px-4 py-3 bg-white border-2 border-purple-300 hover:bg-purple-50 text-purple-800 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Smartphone size={18} />
            {tr("Xem giao diện của bác")}
          </button>
        )}
      </div>

      {/* Main 4-Card Responsive Grid - Minimalist & Low Text */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Card 1: LIVE PARENT STATUS & QUICK CONTACT (Cols: 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            {/* Header row */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full h-3 w-3 bg-slate-400" />
                <span className="text-[14px] font-black uppercase tracking-wider text-slate-600">
                  {tr("Máy của bố mẹ")}
                </span>
              </div>
              <span className="text-[14px] font-bold text-slate-500">
                {tr("Chưa nối")}
              </span>
            </div>

            {/* Parent Profile & Live Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 border-2 border-purple-200 shadow-sm shrink-0 flex items-center justify-center text-purple-700">
                  <Smartphone size={28} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900">
                    {parentData?.name ?? tr('Chưa nối máy nào')}
                  </h3>
                  <p className="text-[14px] font-semibold text-slate-500">
                    {parentData?.phone ?? tr('Thêm máy của bố mẹ để theo dõi')}
                  </p>
                  {/*
                    ⚠️ §4.1 CẤM TUYỆT ĐỐI nhãn "An toàn" / "Safe". Bản trước gắn
                    huy hiệu xanh "Đang an toàn" ngay dưới tên bố mẹ, trong khi
                    KHÔNG có số đo nào chống lưng cho câu đó.
                  */}
                  <div className="inline-flex items-center gap-1 text-[14px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md mt-1">
                    <EyeOff size={14} /> {tr("Khoan Đã chưa đọc được gì từ máy này")}
                  </div>
                </div>
              </div>

              {/* Ví dụ hiển thị — có nhãn "ví dụ" ngay trên, xem băng ở đầu màn. */}
              <div className="flex items-center gap-3 bg-slate-50 border border-dashed border-slate-300 p-2.5 rounded-2xl shrink-0">
                <div className="flex items-center gap-1 text-[14px] font-bold text-slate-500">
                  <BatteryMedium size={16} className="text-slate-400" />
                  <span>—</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-1 text-[14px] font-bold text-slate-500">
                  <Wifi size={16} className="text-slate-400" />
                  <span>—</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-1 text-[14px] font-bold text-slate-500">
                  <MapPin size={16} className="text-slate-400" />
                  <span>—</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          {/*
            ⚠️ XẾP DỌC, KHÔNG XẾP BA CỘT.
            Ở khổ 390px, lưới 3 cột cho mỗi ô ~110px — "Gửi nhắc an toàn" dịch ra
            "Send Safety Reminder" vỡ thành BA dòng, "SOS Alarm" hai dòng, thấy
            trong ảnh người dùng gửi 20/8/2026. Tiếng Việt dài hơn tiếng Anh ~30%
            (§4.5) nên ô hẹp là hỏng ở cả hai thứ tiếng, chỉ khác chỗ vỡ.
            Ba hàng dọc: nhãn nằm trọn một dòng, vùng chạm rộng hết bề ngang.
          */}
          <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 sm:grid sm:grid-cols-3 sm:gap-2.5">
            <a
              href={parentData?.phone ? `tel:${parentData.phone.replace(/\s/g, '')}` : undefined}
              aria-disabled={!parentData?.phone}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-1.5 transition-transform"
            >
              <Phone size={14} className="text-sky-400" />
              {tr("Gọi điện")}
            </a>

            <button
              onClick={sendSafetyReminderToParent}
              className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 border border-sky-200 rounded-xl font-bold text-[14px] flex items-center justify-center gap-1.5 transition-transform"
            >
              <MessageSquare size={14} />
              {tr("Gửi nhắc an toàn")}
            </button>

            <button
              onClick={() => {
                if (onTriggerEmergency) onTriggerEmergency();
                else setView('warning');
              }}
              className="py-2.5 px-3 bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 border border-red-200 rounded-xl font-bold text-[14px] flex items-center justify-center gap-1.5 transition-transform"
            >
              <ShieldAlert size={14} className="text-red-600" />
              {tr("Báo động SOS")}
            </button>
          </div>
        </div>

        {/* Card 2: REMOTE PROTECTION TOGGLES (Cols: 5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-[14px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sliders size={14} className="text-sky-600" />
                {tr("Công tắc bảo vệ cốt lõi")}
              </span>
              <span className="text-[14px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                {tr("Quy tắc bảo vệ")}
              </span>
            </div>

            {/* 3 Core Toggles */}
            <div className="space-y-3.5">
              {/* Toggle 1: Block Unknown Numbers */}
              <div 
                onClick={() => toggleRule('blockUnknown')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors border border-slate-100"
              >
                {/*
                  ⚠️ §12 CẤM TỰ HỨA CHẶN CUỘC GỌI. Bản trước ghi "Chặn số lạ
                  ngoài danh bạ". Khoan Đã KHÔNG chặn và cố ý không chặn: kẻ lừa
                  đảo đổi SIM mỗi ngày và phần lớn dùng số giả, còn chặn nhầm thì
                  bệnh viện gọi hay con gọi từ số lạ đều không tới được. Việc app
                  làm là HIỆN THẺ NHẮC trước khi bác bắt máy.
                */}
                <div>
                  <h4 className="font-bold text-slate-900 text-[14px] sm:text-sm">{tr("Nhắc khi có số lạ gọi")}</h4>
                  <p className="text-[14px] text-slate-500">{tr("Hiện thẻ nhắc trước khi bắt máy. Khoan Đã không chặn cuộc gọi.")}</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${rules.blockUnknown ? 'bg-sky-600' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${rules.blockUnknown ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              {/* Toggle 2: Large Transfer Alert */}
              <div 
                onClick={() => toggleRule('monitorTransfer')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors border border-slate-100"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-[14px] sm:text-sm">{tr("Cảnh báo chuyển khoản > 5 triệu")}</h4>
                  <p className="text-[14px] text-slate-500">{tr("Nhắc dừng 60s trước khi xác nhận")}</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${rules.monitorTransfer ? 'bg-sky-600' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${rules.monitorTransfer ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              {/* Toggle 3: Pinned Lockscreen Alert */}
              <div 
                onClick={() => toggleRule('pinNotification')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors border border-slate-100"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-[14px] sm:text-sm">{tr("Ghim nút cảnh giác trên máy bố mẹ")}</h4>
                  <p className="text-[14px] text-slate-500">{tr("Hiển thị thanh công cụ khẩn cấp liên tục")}</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${rules.pinNotification ? 'bg-sky-600' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${rules.pinNotification ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>

          {/*
            §4.3 — BA CÔNG TẮC NÀY CHƯA NỐI VÀO ĐÂU, VÀ PHẢI NÓI RA.
            Chúng bật/tắt được nên trông y hệt công tắc thật; im lặng để vậy là
            để con cháu tin rằng bố mẹ đang được bảo vệ bởi thứ chưa tồn tại.
          */}
          <p className="text-[14px] text-slate-600 font-medium text-center mt-3 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2">
            {tr("Ba công tắc trên chưa nối được với máy của bố mẹ — chúng cho thấy dự định, không phải trạng thái đang chạy.")}
          </p>
        </div>

        {/* Card 3: RECENT SECURITY INCIDENTS (Cols: 6) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="text-[14px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-500" />
              {tr("Nhật ký sự vụ gần đây")}
            </span>
          </div>

          {/*
            ⚠️ BA MỤC BỊA ĐÃ GỠ — 18/8/2026.
            Bản trước viết cứng ba dòng nhật ký ("Đã chặn cuộc gọi tự xưng Công
            an" · "Đã quét link Zalo nghi ngờ" · "An toàn · Trước khi chuyển
            tiền") và trình bày như việc đã xảy ra với bố mẹ. Ba lỗi cùng lúc:
            dữ liệu bịa hiện như thật, "đã chặn" là lời hứa §12 cấm, và "An toàn"
            là nhãn §4.1 cấm tuyệt đối.

            Rỗng là một KẾT QUẢ và nó trung thực. Khi có đường dữ liệu thật thì
            đổ vào đây, đừng lấp chỗ trống bằng ví dụ.
          */}
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
            <EyeOff size={28} className="text-slate-400 mb-2" />
            <p className="text-[16px] font-bold text-slate-700 mb-1">
              {tr("Chưa có sự vụ nào được ghi")}
            </p>
            <p className="text-[14px] text-slate-500 leading-snug max-w-xs">
              {tr("Máy của bố mẹ chưa nối vào đây nên Khoan Đã chưa đọc được gì. Đây không phải là đã kiểm và thấy ổn.")}
            </p>
          </div>
        </div>

        {/* Card 4: FAST SITUATION AI CHECK (Cols: 6) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-[14px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-600" />
                {tr("Quét nhanh tình huống / Số điện thoại")}
              </span>
              <span className="text-[14px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                AI
              </span>
            </div>

            <form onSubmit={handleQuickAiCheck} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => {
                    setQueryInput(e.target.value);
                    if (queryResult) setQueryResult(null);
                  }}
                  placeholder={tr("Nhập tin nhắn, số điện thoại hoặc tình huống bố mẹ gặp phải...")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-24 py-3 text-[14px] font-medium text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!queryInput.trim() || isChecking}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-[14px] font-bold transition-all flex items-center gap-1"
                >
                  {isChecking ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{tr("Kiểm tra")}</span>
                      <Send size={12} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/*
              KẾT QUẢ TỪ MÁY CHỦ — nhãn nguyên văn từ catalog, lý do tra từ MÃ.

              §HĐ luật 3: `chuaKiem` không rỗng ⇒ BẮT BUỘC hiện, cùng cỡ chữ với
              nhãn. Đây là màn con cháu đọc rồi yên tâm — giấu phần "chưa kiểm
              được" ở đây là giấu đúng chỗ nguy hiểm nhất.
            */}
            {queryResult && (() => {
              const nhan = queryResult.nhan;
              const laCao = nhan === 'CAO';
              const laNghiNgo = nhan === 'NGHI_NGO';
              const khongGoiDuoc = queryResult.khongGoiDuocMayChu === true;

              const maChuaKiem = [...(queryResult.chuaKiem ?? [])];
              if (queryResult.aiDaChay === false && !maChuaKiem.includes('ai_khong_chay')) {
                maChuaKiem.push('ai_khong_chay');
              }
              const chuaKiem = traNhieu(CHUA_KIEM, maChuaKiem, lang);
              const lyDo = traNhieu(MA_LY_DO, queryResult.maLyDo ?? [], lang);

              return (
                <motion.div
                  animate={{ y: 0 }}
                  initial={{ y: 5 }}
                  className={`mt-3 p-3.5 rounded-2xl border-2 text-[16px] font-medium flex flex-col gap-2 ${
                    khongGoiDuoc
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : laCao
                        ? 'bg-red-50 border-red-400 text-red-950'
                        : laNghiNgo
                          ? 'bg-amber-50 border-amber-400 text-amber-950'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {laCao ? (
                      <ShieldAlert size={20} className="text-red-700 shrink-0 mt-0.5" />
                    ) : laNghiNgo ? (
                      <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
                    ) : (
                      <Info size={20} className="text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <p className="font-black text-[18px] leading-snug">
                      {khongGoiDuoc
                        ? tr('Chưa gửi đi kiểm được — mạng không đi.')
                        : (nhan ? tra(NHAN, nhan, lang) : tr('Chưa có kết quả'))}
                    </p>
                  </div>

                  {lyDo.length > 0 && (
                    <ul className="pl-1 flex flex-col gap-1">
                      {lyDo.slice(0, 6).map((cau) => (
                        <li key={cau} className="text-[16px] leading-snug">• {cau}</li>
                      ))}
                    </ul>
                  )}

                  {chuaKiem.length > 0 && (
                    <div className="border-t-2 border-slate-300 pt-2 mt-1">
                      <p className="text-[16px] font-black mb-1 flex items-center gap-1.5">
                        <EyeOff size={18} /> {tr('Những thứ chưa kiểm được')}
                      </p>
                      <ul className="pl-1 flex flex-col gap-1">
                        {chuaKiem.map((cau) => (
                          <li key={cau} className="text-[16px] leading-snug">• {cau}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 text-[14px] text-slate-500">
            <span>💡 {tr("Tin tức lừa đảo")}</span>
            <button
              type="button"
              onClick={() => {
                setQueryInput('Số lạ gọi yêu cầu chuyển tiền gấp để nộp phạt bưu kiện');
              }}
              className="text-purple-700 font-bold hover:underline"
            >
              {tr("Thử các tình huống mẫu")}
            </button>
          </div>
        </div>

      </div>

      {/*
        KHU THỬ TÌNH HUỐNG — lý do bản máy tính tồn tại.

        Người cao tuổi hiếm khi ngồi máy tính; con cháu thì có. Chỗ này để họ tự
        kiểm chứng app trước khi bảo bố mẹ tin nó — và để thấy cả chỗ app làm
        chưa tốt, không chỉ chỗ nó làm được.
      */}
      <ThuTinhHuong t={tr} lang={lang} />
    </div>
  );
}
