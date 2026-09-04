import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldAlert, 
  Mic, 
  PhoneCall, 
  MessageSquare, 
  ShieldCheck, 
  Settings, 
  ChevronRight, 
  Sparkles,
  Zap,
  Camera,
  BookOpen
} from 'lucide-react';
import { ViewState, NguoiThan } from '../App';

interface AppMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (view: ViewState) => void;
  t: (key: any) => string;
  pinnedNotification?: boolean;
  togglePinnedNotification?: () => void;
  familyMembers?: NguoiThan[];
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

  /**
   * ⚠️ `null` KHI CHƯA CÓ AI — KHÔNG CÓ SỐ DỰ PHÒNG.
   *
   * Bản trước rơi về `{ name: 'Người thân', phone: '0988888888' }`. Đó là số
   * thật của một người lạ, và nút bấm nó tên là "Gọi Cho Con Cháu". Một cụ
   * đang hoảng bấm vào đấy sẽ gọi cho người không quen — và tin rằng mình vừa
   * gọi cho con.
   *
   * Chưa thêm ai thì đưa bác tới màn thêm người thân, đừng quay số bừa.
   */
  const firstContact = familyMembers && familyMembers.length > 0
    ? familyMembers[0]
    : null;

  const handleCall = () => {
    onClose();
    if (!firstContact?.phone) { setView('family'); return; }
    window.open(`tel:${firstContact?.phone}`, '_self');
  };

  const handleSosSms = () => {
    onClose();
    const text = `[KHOAN ĐÃ - CẦU CỨU] Bố/Mẹ đang gặp tình huống nghi ngờ lừa đảo. Con hãy gọi lại ngay cho bố mẹ nhé!`;
    if (!firstContact?.phone) { setView('family'); return; }
    window.open(`sms:${firstContact?.phone}?body=${encodeURIComponent(text)}`, '_self');
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
          /*
            ⚠️ KHÔNG BẮT ĐẦU Ở NGOÀI MÀN HÌNH.
            `initial={{ y: '100%' }}` đẩy tấm thẻ xuống dưới đáy rồi trông chờ
            hiệu ứng kéo nó về 0. Hiệu ứng nào không chạy — máy bật "giảm chuyển
            động", trang không được vẽ, hay WebView chặn requestAnimationFrame —
            thì tấm thẻ NẰM NGOÀI MÀN HÌNH VĨNH VIỄN. Người dùng bấm Menu tác vụ
            và thấy không có gì hiện ra, đo trên máy thật 20/8/2026.

            Đây đúng cái bẫy đã ghi trong `App.tsx` cho thanh điều hướng: hiệu
            ứng không được quyết định VỊ TRÍ hay việc nội dung có hiện hay không.
            Nó chỉ được làm đẹp thêm cho thứ vốn đã đúng chỗ.

            Giờ chỉ chạy độ mờ và một quãng trượt NGẮN (24px). Hiệu ứng hỏng thì
            tệ nhất là thẻ hiện ra không mượt — vẫn đọc được, vẫn bấm được.
          */
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
 className="relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl bg-[#fbf9fe] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden max-h-[92vh] flex flex-col z-10 border-[2.5px] border-[#2e1065] shadow-[3px_3px_0_#2e1065]"
        >
          {/* Header - Large & Bold */}
          <div className="px-6 py-4 sm:py-5 bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#8b5cf6] text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-2xl leading-tight">{t("Danh Mục Tác Vụ")}</h3>
                <p className="text-[14px] sm:text-sm text-purple-200 font-medium">{t("Bảo vệ & Hỗ trợ người cao tuổi 24/7")}</p>
              </div>
            </div>
            <button
              aria-label={t("Đóng")}
              onClick={onClose}
              title={t("Đóng menu")}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <X size={22} />
            </button>
          </div>

          {/*
            ⚠️ BẢY MỤC, KHÔNG PHẢI MƯỜI BA — RÚT GỌN 19/8/2026.

            Menu cũ có 13 mục trong 3 nhóm. Với người cao tuổi, một danh sách dài
            không phải là "nhiều lựa chọn" mà là một bài kiểm tra trí nhớ giữa
            lúc đang hoảng: phải đọc hết 13 dòng rồi mới quyết được bấm cái nào.

            ⚠️ KHÔNG MỤC NÀO BỊ MẤT ĐƯỜNG VÀO. Sáu mục gỡ khỏi đây đều còn lối
            khác, đã kiểm từng cái:
              · Lịch sử · Gia đình · Tra cứu   → thanh điều hướng
              · Bóng nổi · Mô phỏng màn khoá   → Cài đặt
              · Ghim thông báo · Quyền riêng tư → Hồ sơ (và nút "Ghim tin" ở đầu
                                                 màn chính)
            Trước khi gỡ thêm mục nào, kiểm nó còn đường vào nào không — gỡ một
            chức năng khỏi menu mà không còn lối khác là làm mất nó, im lặng.

            Thứ tự cũng có chủ đích: ba việc làm khi ĐANG LO đứng trên cùng, vì
            đó là lúc người ta mở menu này.
          */}

          <div className="overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-6">

            {/* ── Khi bác đang lo ─────────────────────────────────────── */}
            <div>
              <h4 className="flex items-center gap-2 text-[15px] font-black uppercase tracking-wide text-[#b91c1c] mb-3">
                <Zap size={18} /> {t("Khi bác đang lo")}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  data-vai-tro="nut-chinh"
                  onClick={handleEmergency}
                  className="bg-[#b91c1c] hover:bg-[#991b1b] text-white rounded-2xl p-4 flex items-center gap-3.5 text-left border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:scale-95 transition-transform"
                >
                  <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldAlert size={26} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-black text-[17px] leading-tight block">{t("Dừng lại 60 giây")}</span>
                    <span className="text-[14px] text-red-100 font-medium leading-snug block mt-0.5">
                      {t("Chưa làm gì vội. Đếm ngược rồi tính tiếp.")}
                    </span>
                  </span>
                </button>

                <button
                  data-vai-tro="nut-chinh"
                  onClick={handleCall}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-4 flex items-center gap-3.5 text-left border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:scale-95 transition-transform"
                >
                  <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <PhoneCall size={26} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-black text-[17px] leading-tight block">{t("Gọi Cho Con Cháu")}</span>
                    {/*
                      ⚠️ `firstContact?.name` — CÓ DẤU `?`, ĐỪNG BỎ.
                      `firstContact` là `null` khi bác chưa thêm người thân nào,
                      và đó là trạng thái MẶC ĐỊNH của app (dữ liệu mẫu bịa đã
                      bỏ từ lâu). Bản trước đọc thẳng thuộc tính `name` mà thiếu
                      dấu hỏi, nên ném TypeError; hàng rào lỗi chặn cả menu, và
                      bác bấm "Menu tác vụ" thì không vào được — báo 4/9/2026.
                    */}
                    <span className="text-[14px] text-emerald-100 font-medium block mt-0.5 truncate">
                      {firstContact?.name ?? t("Chưa có ai — bấm để thêm")}
                    </span>
                  </span>
                </button>

                {/*
                  ⚠️ §11 — "Soạn tin", KHÔNG phải "gửi tự động".
                  Nút này MỞ ứng dụng tin nhắn; người bấm Gửi là bác. Nhãn cũ ghi
                  "Gửi SMS tự động đến số người thân" — hứa một việc app không làm.
                */}
                <button
                  onClick={handleSosSms}
                  className="sm:col-span-2 bg-white hover:bg-purple-50 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] rounded-2xl p-4 flex items-center gap-3.5 text-left active:scale-95 transition-transform"
                >
                  <span className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <MessageSquare size={24} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-black text-[17px] text-[#1e1b4b] leading-tight block">{t("Soạn tin nhắn cho con cháu")}</span>
                    <span className="text-[14px] text-gray-600 font-medium block mt-0.5">
                      {t("Cháu mở sẵn tin, bác chỉ việc bấm Gửi")}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* ── Kiểm tra ngay ───────────────────────────────────────── */}
            <div>
              <h4 className="flex items-center gap-2 text-[15px] font-black uppercase tracking-wide text-[#6d28d9] mb-3">
                <ShieldCheck size={18} /> {t("Kiểm tra ngay")}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleGo('voice')}
                  className="bg-white hover:bg-purple-50 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] rounded-2xl p-4 flex items-center gap-3.5 text-left active:scale-95 transition-transform"
                >
                  <span className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Mic size={24} />
                  </span>
                  <span className="block min-w-0">
                    <span className="font-black text-[16px] text-[#1e1b4b] block leading-tight">{t("Chạm Để Nói")}</span>
                    <span className="text-[14px] text-gray-600 font-medium block leading-snug">{t("Kể lại cho AI kiểm tra")}</span>
                  </span>
                </button>

                <button
                  onClick={handlePickImage}
                  className="bg-white hover:bg-purple-50 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] rounded-2xl p-4 flex items-center gap-3.5 text-left active:scale-95 transition-transform"
                >
                  <span className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                    <Camera size={24} />
                  </span>
                  <span className="block min-w-0">
                    <span className="font-black text-[16px] text-[#1e1b4b] block leading-tight">{t("Quét Ảnh Chụp")}</span>
                    <span className="text-[14px] text-gray-600 font-medium block leading-snug">{t("Tin nhắn / Mã QR / Số tài khoản")}</span>
                  </span>
                </button>

                <button
                  onClick={() => handleGo('learn')}
                  className="bg-white hover:bg-amber-50 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] rounded-2xl p-4 flex items-center gap-3.5 text-left active:scale-95 transition-transform"
                >
                  <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <BookOpen size={24} />
                  </span>
                  <span className="block min-w-0">
                    <span className="font-black text-[16px] text-[#1e1b4b] block leading-tight">{t("Cẩm Nang & Hotline")}</span>
                    <span className="text-[14px] text-gray-600 font-medium block leading-snug">{t("Nhận diện bẫy lừa & số khẩn cấp")}</span>
                  </span>
                </button>
              </div>
            </div>

            {/* ── Cài đặt ─────────────────────────────────────────────── */}
            <button
              onClick={() => handleGo('settings')}
              className="shrink-0 bg-white hover:bg-gray-50 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] rounded-2xl p-4 flex items-center justify-between gap-3 active:scale-95 transition-transform"
            >
              <span className="flex items-center gap-3.5 min-w-0">
                <span className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                  <Settings size={24} />
                </span>
                <span className="block text-left min-w-0">
                  <span className="font-black text-[16px] text-[#1e1b4b] block leading-tight">{t("Cài Đặt")}</span>
                  <span className="text-[14px] text-gray-600 font-medium block leading-snug">
                    {t("Cỡ chữ, ngôn ngữ, bóng nổi ngoài màn hình")}
                  </span>
                </span>
              </span>
              <ChevronRight size={22} className="text-gray-400 shrink-0" />
            </button>
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
