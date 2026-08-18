import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldAlert, 
  Mic, 
  Search, 
  PhoneCall, 
  MessageSquare, 
  Bell, 
  Users, 
  ShieldCheck, 
  Settings, 
  Lock, 
  FileText, 
  ChevronRight, 
  Sparkles,
  Zap,
  Camera,
  Smartphone,
  Layers,
  BookOpen
} from 'lucide-react';
import { ViewState } from '../App';

interface AppMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (view: ViewState) => void;
  t: (key: any) => string;
  pinnedNotification?: boolean;
  togglePinnedNotification?: () => void;
  familyMembers?: any[];
  onTriggerEmergency?: () => void;
  onSelectImage?: () => void;
  onOpenOutsideMode?: () => void;
  showFloatingBall?: boolean;
  setShowFloatingBall?: (val: boolean) => void;
}

export function AppMenuModal({
  isOpen,
  onClose,
  setView,
  t,
  pinnedNotification,
  togglePinnedNotification,
  familyMembers = [],
  onTriggerEmergency,
  onSelectImage,
  onOpenOutsideMode,
  showFloatingBall = true,
  setShowFloatingBall
}: AppMenuModalProps) {
  if (!isOpen) return null;

  const firstContact = familyMembers && familyMembers.length > 0 
    ? familyMembers[0] 
    : { name: 'Người thân', phone: '0988888888' };

  const handleCall = () => {
    onClose();
    window.open(`tel:${firstContact.phone || '0988888888'}`, '_self');
  };

  const handleSosSms = () => {
    onClose();
    const text = `[KHOAN ĐÃ - CẦU CỨU] Bố/Mẹ đang gặp tình huống nghi ngờ lừa đảo. Con hãy gọi lại ngay cho bố mẹ nhé!`;
    window.open(`sms:${firstContact.phone || '0988888888'}?body=${encodeURIComponent(text)}`, '_self');
  };

  const handleGo = (view: ViewState) => {
    onClose();
    setView(view);
  };

  const handleEmergency = () => {
    onClose();
    if (onTriggerEmergency) {
      onTriggerEmergency();
    } else {
      setView('warning');
    }
  };

  const handlePickImage = () => {
    onClose();
    if (onSelectImage) {
      onSelectImage();
    } else {
      setView('home');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-md"
        />

        {/* Modal Sheet - Optimized for Mobile & iPad/Tablet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl bg-[#fbf9fe] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 border-2 border-purple-200/80"
        >
          {/* Header - Large & Bold */}
          <div className="px-6 py-4 sm:py-5 bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#8b5cf6] text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-2xl leading-tight">{t("Danh Mục Tác Vụ")}</h3>
                <p className="text-[14px] sm:text-sm text-purple-200 font-medium">{t("Bảo vệ & Hỗ trợ người cao tuổi 24/7")}</p>
              </div>
            </div>
            <button aria-label={t("Đóng")} 
              onClick={onClose}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 flex items-center justify-center text-white transition-all border border-white/20"
              title={t("Đóng menu")}
            >
              <X size={22} />
            </button>
          </div>

          {/* Body with spacious, large action cards */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-5 sm:space-y-6 text-[#1e1b4b]">
            
            {/* Section 1: TRUY CẬP NHANH KHẨN CẤP */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <Zap size={16} />
                </div>
                <span className="text-[14px] sm:text-sm font-black tracking-wider text-red-700 uppercase">
                  {t("Tác Vụ Khẩn Cấp & Cảnh Giác")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Emergency 60s warning */}
                <button
                  onClick={handleEmergency}
                  className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white shadow-md active:scale-98 hover:shadow-lg transition-all text-left group border border-white/20"
                >
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform border border-white/30">
                    <ShieldAlert size={28} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base sm:text-lg leading-tight text-white">{t("Báo Động Cảnh Giác")}</span>
                      <span className="text-[14px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                        60s
                      </span>
                    </div>
                    <p className="text-[14px] sm:text-sm text-red-100 mt-1 font-medium leading-snug">{t("Dừng mọi thao tác chuyển tiền & đếm ngược an toàn")}</p>
                  </div>
                </button>

                {/* Call family */}
                <button
                  onClick={handleCall}
                  className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 text-white shadow-md active:scale-98 hover:shadow-lg transition-all text-left group border border-white/20"
                >
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform border border-white/30">
                    <PhoneCall size={28} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-base sm:text-lg leading-tight text-white block">{t("Gọi Cho Con Cháu")}</span>
                    <p className="text-[14px] sm:text-sm text-emerald-100 mt-1 font-medium leading-snug truncate">
                      {firstContact.name}: {firstContact.phone}
                    </p>
                  </div>
                </button>

                {/* SOS SMS */}
                <button
                  onClick={handleSosSms}
                  className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border-2 border-red-200 shadow-2xs hover:bg-red-50/70 active:scale-98 transition-all text-left"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <MessageSquare size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-sm sm:text-base text-gray-900 leading-tight block">{t("Gửi Tin Nhắn Cầu Cứu (SOS)")}</span>
                    <span className="text-[14px] text-gray-500 font-medium">{t("Gửi SMS tự động đến số người thân")}</span>
                  </div>
                </button>

                {/* Pin Notification */}
                <button
                  onClick={() => {
                    if (togglePinnedNotification) togglePinnedNotification();
                  }}
                  className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border-2 shadow-2xs active:scale-98 transition-all text-left ${
                    pinnedNotification 
                      ? 'bg-purple-100 border-purple-400 text-purple-900' 
                      : 'bg-white border-gray-200 text-gray-800 hover:bg-purple-50/50'
                  }`}
                >
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${pinnedNotification ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-100 text-purple-700'}`}>
                    <Bell size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-sm sm:text-base leading-tight block">
                      {pinnedNotification ? t("Đang Ghim Cảnh Báo Ngoài MH") : t("Ghim Thông Báo Thường Trực")}
                    </span>
                    <span className="text-[14px] text-purple-700 font-medium">
                      {pinnedNotification ? t("Chạm để tắt ghim") : t("Luôn xuất hiện trên thanh thông báo")}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: CÔNG CỤ KIỂM TRA AN TOÀN AI */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-[14px] sm:text-sm font-black tracking-wider text-[#6d28d9] uppercase">
                  {t("Công Cụ Kiểm Tra An Toàn AI")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Voice check */}
                <button
                  onClick={() => handleGo('voice')}
                  className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border-2 border-purple-100 shadow-2xs hover:bg-purple-50/80 active:scale-98 transition-all text-left group"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Mic size={24} />
                  </div>
                  <div>
                    <span className="font-black text-sm sm:text-base text-[#1e1b4b] block leading-tight">{t("Chạm Để Nói")}</span>
                    <span className="text-[14px] text-purple-600 font-medium">{t("Kể lại cho AI kiểm tra")}</span>
                  </div>
                </button>

                {/* Image check */}
                <button
                  onClick={handlePickImage}
                  className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border-2 border-purple-100 shadow-2xs hover:bg-purple-50/80 active:scale-98 transition-all text-left group"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#be185d] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Camera size={24} />
                  </div>
                  <div>
                    <span className="font-black text-sm sm:text-base text-[#1e1b4b] block leading-tight">{t("Quét Ảnh Chụp")}</span>
                    <span className="text-[14px] text-pink-600 font-medium">{t("Tin nhắn / Mã QR / Số tài khoản")}</span>
                  </div>
                </button>

                {/* Situation search */}
                <button
                  onClick={() => handleGo('search')}
                  className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border-2 border-purple-100 shadow-2xs hover:bg-purple-50/80 active:scale-98 transition-all text-left group"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Search size={24} />
                  </div>
                  <div>
                    <span className="font-black text-sm sm:text-base text-[#1e1b4b] block leading-tight">{t("Tra Cứu Chiêu Trò")}</span>
                    <span className="text-[14px] text-cyan-600 font-medium">{t("Tìm số điện thoại & bẫy lừa")}</span>
                  </div>
                </button>

                {/* History */}
                <button
                  onClick={() => handleGo('history')}
                  className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border-2 border-purple-100 shadow-2xs hover:bg-purple-50/80 active:scale-98 transition-all text-left group"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#047857] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div>
                    <span className="font-black text-sm sm:text-base text-[#1e1b4b] block leading-tight">{t("Lịch Sử Đã Quét")}</span>
                    <span className="text-[14px] text-emerald-600 font-medium">{t("Xem lại kết quả phân tích")}</span>
                  </div>
                </button>

                {/* Scam Lessons & Emergency Hotlines */}
                <button
                  onClick={() => handleGo('learn')}
                  className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-50 to-indigo-50 border-2 border-amber-300/80 shadow-2xs hover:bg-amber-100/60 active:scale-98 transition-all text-left sm:col-span-2 md:col-span-2 group"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm sm:text-base text-[#2e1065] leading-tight">{t("Cẩm Nang Bẫy Lừa & Hotline")}</span>
                      <span className="text-[14px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                        {t("Mới & Quốc tế")}
                      </span>
                    </div>
                    <span className="text-[14px] text-amber-900/80 font-semibold">{t("Bài học thực chiến, nhận diện bẫy lừa & số điện thoại khẩn cấp")}</span>
                  </div>
                  <ChevronRight size={20} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Outside Mode Simulator */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenOutsideMode) onOpenOutsideMode();
                  }}
                  className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 shadow-2xs hover:bg-purple-100 active:scale-98 transition-all text-left sm:col-span-2 md:col-span-2 group"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#7e22ce] to-[#4c1d95] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Smartphone size={24} />
                  </div>
                  <div className="flex-1">
                    <span className="font-black text-sm sm:text-base text-[#2e1065] block leading-tight">{t("Mô Phỏng Ngoài Màn Hình Điện Thoại")}</span>
                    <span className="text-[14px] text-purple-700 font-medium">{t("Thực hành bấm bong bóng nổi khi gặp tin nhắn SMS / Zalo lạ")}</span>
                  </div>
                  <ChevronRight size={20} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Quick Assistive Floating Ball Toggle Card */}
            {setShowFloatingBall && (
              <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white flex items-center justify-between shadow-md border border-purple-400/30">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white/20 border border-white/30 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Layers size={24} />
                  </div>
                  <div>
                    <p className="font-black text-sm sm:text-base text-white leading-tight">{t("Bong Bóng Nổi Ngoài Màn Hình")}</p>
                    <p className="text-[14px] text-purple-200 mt-0.5">{t("Phím tròn Khoan Đã luôn sẵn sàng ở mép màn hình chính")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFloatingBall(!showFloatingBall)}
                  className={`w-14 h-8 sm:w-16 sm:h-9 rounded-full transition-colors relative p-1 shrink-0 ${showFloatingBall ? 'bg-emerald-500' : 'bg-white/30'}`}
                  title={t("Bật/Tắt bóng nổi")}
                >
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-md transition-transform ${showFloatingBall ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            )}

            {/* Section 3: GIA ĐÌNH & CÀI ĐẶT */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                  <Users size={16} />
                </div>
                <span className="text-[14px] sm:text-sm font-black tracking-wider text-[#6d28d9] uppercase">
                  {t("Gia Đình & Quản Trị")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleGo('family')}
                  className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-gray-200 text-center hover:bg-purple-50/60 active:scale-95 transition-all group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Users size={22} />
                  </div>
                  <span className="font-black text-[14px] sm:text-sm text-gray-900">{t("Người Thân")}</span>
                </button>

                <button
                  onClick={() => handleGo('guardian')}
                  className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-gray-200 text-center hover:bg-sky-50/60 active:scale-95 transition-all group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <ShieldCheck size={22} />
                  </div>
                  <span className="font-black text-[14px] sm:text-sm text-gray-900">Guardian</span>
                </button>

                <button
                  onClick={() => handleGo('settings')}
                  className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-gray-200 text-center hover:bg-amber-50/60 active:scale-95 transition-all group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Settings size={22} />
                  </div>
                  <span className="font-black text-[14px] sm:text-sm text-gray-900">{t("Cài Đặt")}</span>
                </button>

                <button
                  onClick={() => handleGo('privacy')}
                  className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-gray-200 text-center hover:bg-emerald-50/60 active:scale-95 transition-all group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Lock size={22} />
                  </div>
                  <span className="font-black text-[14px] sm:text-sm text-gray-900">{t("Bảo Mật")}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="py-3 px-6 bg-purple-50 border-t border-purple-100 text-center shrink-0">
            <span className="text-[14px] sm:text-sm font-bold text-purple-900 flex items-center justify-center gap-1.5">
              {t("🛡️ Khoan Đã luôn đồng hành bảo vệ bác trong mọi tình huống")}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
