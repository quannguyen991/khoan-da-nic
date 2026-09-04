import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  ShieldAlert, 
  PhoneCall, 
  Mic, 
  X, 
  Sparkles, 
  Smartphone, 
  Layers,
  ChevronRight, 
  ArrowRight,
  Maximize2,
  CheckCircle2,
  Settings,
  Play,
} from 'lucide-react';
import { ViewState } from '../App';
import { laApk, quyenPopup, xinQuyenPopup, hienPopupCanhBao, anPopup, dayAppXuong } from '../native';

interface FloatingQuickAccessProps {
  setView: (view: ViewState) => void;
  t: (key: any) => string;
  /** Ngôn ngữ hiện tại — cần cho định dạng ngày giờ, không chỉ cho chữ. */
  lang?: string;
  onAnalyze: (text: string, image?: string | null) => void;
  onTriggerEmergency?: () => void;
  familyMembers?: any[];
  isOutsideMode: boolean;
  setIsOutsideMode: (val: boolean) => void;
  showFloatingBall: boolean;
  setShowFloatingBall: (val: boolean) => void;
}

export function FloatingQuickAccess({
  lang = 'vi',
  setView,
  t,
  onAnalyze,
  onTriggerEmergency,
  familyMembers = [],
  isOutsideMode,
  setIsOutsideMode,
  showFloatingBall,
  setShowFloatingBall
}: FloatingQuickAccessProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(() => {
    return localStorage.getItem('hasOverlayPermission') === 'true';
  });
  const [permissionSuccessToast, setPermissionSuccessToast] = useState(false);
  const [activeTabGuide, setActiveTabGuide] = useState<'android' | 'ios' | 'samsung' | 'pip'>('android');
  /*
   * Hướng dẫn theo từng dòng máy MẶC ĐỊNH ĐÓNG.
   * Bốn thẻ hệ điều hành × ba bước là mười hai đoạn chữ, trước đây hiện hết
   * ngay khi mở popup. Nhưng bác chỉ cần tới chúng KHI NÚT KIA KHÔNG ĂN — tức
   * là hiếm. Bày sẵn thứ hiếm dùng đè lên thứ hay dùng là đổi chỗ hai việc.
   */
  const [xemHuongDan, setXemHuongDan] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const primaryContact = familyMembers && familyMembers.length > 0
    ? familyMembers[0]
    /*
     * ⚠️ `null`, KHÔNG PHẢI MỘT SỐ MẶC ĐỊNH. Trước đây chỗ này rơi về
     * '0988888888' — số thật của một người lạ — và nút gọi nó nằm trong lối
     * tắt khẩn cấp. Chưa thêm người thân thì đưa bác đi thêm, đừng quay số bừa.
     */
    : null;

  // Sync permission to localStorage
  useEffect(() => {
    localStorage.setItem('hasOverlayPermission', String(hasPermission));
  }, [hasPermission]);

  // Request browser permissions (Notification / PiP)
  const handleRequestPermission = async () => {
    try {
      // 1. Request Notification Permission
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }

      // 2. Try Web Picture-in-Picture or Document PiP if available
      tryToLaunchPip();

      setHasPermission(true);
      setShowPermissionModal(false);
      setPermissionSuccessToast(true);
      setTimeout(() => setPermissionSuccessToast(false), 4500);
    } catch (err) {
      console.warn('Permission request:', err);
      setHasPermission(true);
      setShowPermissionModal(false);
    }
  };

  // Real OS-Level Floating Window via Document Picture-in-Picture API & Video PiP
  const tryToLaunchPip = async () => {
    try {
      // 1. Check Document PiP (Chrome 116+, Edge, Android Desktop/Chrome)
      // @ts-ignore
      if (window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === 'function') {
        // @ts-ignore
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 340,
          height: 240,
        });

        setIsPipActive(true);

        // Inject modern Tailwind-like styling and interactive controls inside Document PiP
        const pipDoc = pipWindow.document;
        pipDoc.title = 'Khoan Đã • Bong Bóng Nổi Ngoài Màn Hình';
        pipDoc.body.innerHTML = `
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background: linear-gradient(135deg, #1e1035 0%, #2e1065 50%, #3b0764 100%);
              color: white;
              padding: 12px;
              height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              user-select: none;
              overflow: hidden;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .title-wrap {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .badge-live {
              background: rgba(16, 185, 129, 0.2);
              border: 1px solid #10b981;
              color: #6ee7b7;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 99px;
              display: flex;
              align-items: center;
              gap: 4px;
            }
            .dot {
              width: 6px;
              height: 6px;
              background: #10b981;
              border-radius: 50%;
              animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
            .grid-btns {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 6px;
              flex: 1;
            }
            .btn {
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.15);
              color: white;
              padding: 8px;
              border-radius: 12px;
              font-weight: 700;
              font-size: 11px;
              cursor: pointer;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 3px;
              text-align: center;
              transition: all 0.15s ease;
            }
            .btn:active {
              transform: scale(0.95);
            }
            .btn-camera {
              background: linear-gradient(135deg, #7e22ce, #9333ea);
              border-color: #c084fc;
            }
            .btn-danger {
              background: linear-gradient(135deg, #b91c1c, #dc2626);
              border-color: #f87171;
            }
            .btn-voice {
              background: linear-gradient(135deg, #4338ca, #6366f1);
              border-color: #a5b4fc;
            }
            .btn-call {
              background: linear-gradient(135deg, #15803d, #16a34a);
              border-color: #86efac;
            }
            .footer {
              margin-top: 6px;
              font-size: 9px;
              color: #d8b4fe;
              text-align: center;
              opacity: 0.85;
            }
          </style>
          <div class="header">
            <div class="title-wrap">
              <span style="font-size: 14px;">🛡️</span>
              <strong style="font-size: 12px; letter-spacing: -0.2px;">{t('Khoan Đã đang nổi ngoài màn hình')}</strong>
            </div>
            <div class="badge-live">
              <span class="dot"></span>
              <span>{t('Đang nổi')}</span>
            </div>
          </div>
          <div class="grid-btns">
            <button id="pipScan" class="btn btn-camera">
              <span style="font-size: 16px;">📸</span>
              <span>{t('Quét ảnh hoặc màn hình')}</span>
            </button>
            <button id="pipSos" class="btn btn-danger">
              <span style="font-size: 16px;">🚨</span>
              <span>{t('Dừng 60 giây')}</span>
            </button>
            <button id="pipVoice" class="btn btn-voice">
              <span style="font-size: 16px;">🎙️</span>
              <span>{t('Kể tình huống')}</span>
            </button>
            <button id="pipCall" class="btn btn-call">
              <span style="font-size: 16px;">📞</span>
              <span>{t('Gọi con cháu')}</span>
            </button>
          </div>
          <div class="footer">
            Chạm bất kỳ nút nào để đưa Khoan Đã lên trên cùng kiểm tra
          </div>
        `;

        const scanBtn = pipDoc.getElementById('pipScan');
        if (scanBtn) {
          scanBtn.onclick = () => {
            window.focus();
            triggerCameraInput();
          };
        }

        const sosBtn = pipDoc.getElementById('pipSos');
        if (sosBtn) {
          sosBtn.onclick = () => {
            window.focus();
            handleEmergencyClick();
          };
        }

        const voiceBtn = pipDoc.getElementById('pipVoice');
        if (voiceBtn) {
          voiceBtn.onclick = () => {
            window.focus();
            handleVoiceClick();
          };
        }

        const callBtn = pipDoc.getElementById('pipCall');
        if (callBtn) {
          callBtn.onclick = () => {
            window.focus();
            handleCallClick();
          };
        }

        pipWindow.addEventListener('pagehide', () => {
          setIsPipActive(false);
        });
        return;
      }

      // 2. Fallback: HTML5 Video Picture-in-Picture (Mobile Chrome / Safari / Firefox PiP)
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1e1035';
          ctx.fillRect(0, 0, 320, 200);

          // Background styling
          const grad = ctx.createLinearGradient(0, 0, 320, 200);
          grad.addColorStop(0, '#3b0764');
          grad.addColorStop(1, '#1e1035');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 320, 200);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🛡️ KHOAN ĐÃ NỔI NGOÀI OS', 160, 60);

          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#d8b4fe';
          ctx.fillText('Luôn sẵn sàng bảo vệ bác trên mọi app', 160, 95);

          ctx.fillStyle = '#9333ea';
          ctx.fillRect(40, 120, 240, 45);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('📸 Chạm để Mở App Quét Ngay', 160, 148);
        }

        const stream = canvas.captureStream(10);
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPipActive(false);
        } else if (videoRef.current.requestPictureInPicture) {
          await videoRef.current.requestPictureInPicture();
          setIsPipActive(true);
        }
      }
    } catch (e) {
      console.warn('PiP launch note:', e);
      // If PiP is not supported in current frame, activate simulation or show guide
      setIsOutsideMode(true);
    }
  };

  const [loiPopup, setLoiPopup] = useState<null | 'web' | 'chua_bat' | 'hien' | 'chua_co_quyen' | 'thieu_chu' | 'rom_chan' | 'khong_phai_apk'>(null);

  const handleCameraScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setIsMenuOpen(false);
        setIsOutsideMode(false);
        setView('home');
        onAnalyze('', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCameraInput = () => {
    fileInputRef.current?.click();
  };

  const handleEmergencyClick = () => {
    setIsMenuOpen(false);
    setIsOutsideMode(false);
    if (onTriggerEmergency) {
      onTriggerEmergency();
    } else {
      setView('warning');
    }
  };

  /*
   * ══════ MỞ POPUP THẬT — KHÔNG VẼ LẠI MÀN HÌNH NỮA ══════
   *
   * Chỗ này trước đây bật một màn hình điện thoại GIẢ vẽ bằng div. Người
   * dùng phát hiện và nói thẳng: "pop up phải hiện hẳn ra bên ngoài như
   * messenger". Đúng. Giờ nút này gọi `PopupDeManHinh` thật.
   *
   * ⚠️ BA CẢNH, NÓI RÕ TẮNG CẢNH. §4.3 — gộp lại là đẩy bác đi tìm một thứ
   * không tồn tại trên máy của mình rồi tự trách là mình làm sai:
   *   1. Đang chạy trên web — trình duyệt KHÔNG cho vẽ đè lên app khác. Không
   *      có cách nào làm được, và nói thật thì hơn là vẽ một bản nhái.
   *   2. Có app nhưng chưa bật quyền — mở thẳng màn Cài đặt.
   *   3. Đã bật — bắn ra ngoài luôn, tự tắt sau 6 giây để bản thử không nằm lại.
   */
  const moPopupThat = async () => {
    setIsMenuOpen(false);
    if (!(await laApk())) { setLoiPopup('web'); return; }
    if ((await quyenPopup()) !== 'da_bat') { setLoiPopup('chua_bat'); return; }
    setLoiPopup(null);
    const ket = await hienPopupCanhBao({
      nhan: 'CAO',
      tieuDe: t('Đây là dải cảnh báo — bác đang xem thử'),
      nutMo: t('Mở Khoan Đã'),
      nutOn: t('Tôi ổn, tắt đi'),
    });
    /*
     * ⚠️ RỜI APP RA THÌ MỚI THẤY LÀ NÓ Ở NGOÀI APP.
     * Bấm nút này từ trong Khoan Đã thì dải vẽ đè lên chính Khoan Đã — có
     * hiện thật, nhưng trông hệt một thành phần của app. Người dùng báo
     * 21/8/2026 "pop up vẫn chưa hiện bên ngoài", và nhìn từ phía họ thì
     * không có cách nào phân biệt được. Xem `dayAppXuong` bên Java.
     */
    /*
     * ⚠️ CHỈ ĐẨY APP XUỐNG KHI DẢI THẬT SỰ ĐÃ HIỆN.
     * Đẩy xuống rồi mà không có gì trên màn hình thì bác chỉ thấy app tự
     * nhiên biến mất — tệ hơn là không làm gì.
     */
    if (ket !== 'hien') { setLoiPopup(ket); return; }
    await dayAppXuong();
    setTimeout(() => { void anPopup(); }, 6000);
  };

  const handleVoiceClick = () => {
    setIsMenuOpen(false);
    setIsOutsideMode(false);
    setView('voice');
  };

  const handleCallClick = () => {
    setIsMenuOpen(false);
    /*
     * ⚠️ CHƯA CÓ NGƯỜI THÂN THÌ ĐI THÊM, ĐỪNG QUAY SỐ BỪA.
     * Chỗ này từng rơi về '0988888888' — số thật của một người lạ.
     */
    if (!primaryContact?.phone) { setView('family'); return; }
    window.location.href = `tel:${primaryContact.phone}`;
  };

  // If user clicks floating ball but has not granted overlay permission yet
  const handleBallClick = () => {
    if (!hasPermission) {
      setShowPermissionModal(true);
    } else {
      setIsMenuOpen(prev => !prev);
    }
  };

  return (
    <>
      {/* Hidden File / Camera Input */}
      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleCameraScan}
      />

      {/* Hidden Canvas & Video for Real Web Picture-in-Picture Floating Mode */}
      <canvas ref={canvasRef} width={300} height={200} className="hidden" />
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* ========================================================
          TOAST: CẤP QUYỀN THÀNH CÔNG
      ======================================================== */}
      <AnimatePresence>
        {permissionSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 inset-x-4 z-[200] max-w-md mx-auto bg-emerald-700 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-3 select-none"
          >
            <div className="w-8 h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center shrink-0 shadow-sm font-black">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-extrabold text-[14px]">{t('Máy bác đã cho phép hiện bong bóng nổi.')}</p>
              <p className="text-[14px] text-emerald-100">{t('Khoan Đã sẽ nằm sẵn ở mép màn hình.')}</p>
            </div>
            <button aria-label={t("Đóng")}
              onClick={() => setPermissionSuccessToast(false)}
              className="p-1 rounded-full hover:bg-emerald-600 text-emerald-200"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          1. FLOATING ASSISTIVE BALL (NÚT TRỢ NĂNG NỔI KHOAN ĐÃ - DRAGGABLE)
      ======================================================== */}
      {showFloatingBall && !isOutsideMode && (
        <motion.div
          drag
          dragMomentum={false}
          /*
              ⚠️ `bottom-40`, KHÔNG PHẢI `bottom-24` — ĐO 19/8/2026.
              Ở 96px, nút ngồi đúng lên ô "Nhập hoặc bấm máy ảnh" của trang chủ,
              che mất chữ và cả nút máy ảnh bên trong ô. 160px đưa nó vào khoảng
              trống giữa hàng nút tròn và ô nhập.
              Đổi số này thì phải chụp lại trang chủ để xem nó rơi trúng cái gì.
            */
            className="fixed right-3 bottom-40 z-[90] select-none cursor-grab active:cursor-grabbing pointer-events-auto"
        >
          <div className="relative flex flex-col items-end">
            {/* Quick Access Menu Popover */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 15 }}
                  transition={{ duration: 0.2 }}
                  className="mb-3 w-76 sm:w-84 md:w-92 bg-white/98 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl border-2 border-purple-200 flex flex-col gap-3 relative z-50 text-left"
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b border-purple-100 pb-2">
                    <div className="flex items-center gap-2">
                      <img src="/logo.webp" alt="Logo" className="w-6 h-6 object-contain rounded-lg shadow-xs" />
                      <span className="font-black text-[#2e1065] text-sm sm:text-base">{t('Phím tắt Khoan Đã')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button aria-label={t("Cài đặt")}
                        onClick={() => setShowPermissionModal(true)}
                        className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-2xl text-[14px] flex items-center gap-1 font-bold"
                        title={t('Xem quyền và hướng dẫn')}
                      >
                        <Settings size={15} />
                      </button>
                      <button aria-label={t("Đóng")}
                        onClick={() => setIsMenuOpen(false)}
                        className="w-7 h-7 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center text-[14px] active:scale-95 transition-all"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* 1. In-Call Fast Question (8s) */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsOutsideMode(false);
                      setView('hoi_nhanh');
                    }}
                    className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-purple-950 via-[#3b0764] to-indigo-950 text-white rounded-2xl active:scale-98 transition-all border-2 border-purple-400/50 shadow-md shadow-purple-950/40 group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center shrink-0 border border-red-400 animate-pulse">
                      <PhoneCall size={22} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm leading-tight text-yellow-300">{t('Đang nghe điện thoại lạ')}</p>
                      <p className="text-[14px] text-purple-200 mt-0.5">{t('Hỏi nhanh để nhận ra bẫy')}</p>
                    </div>
                  </button>

                  {/* 2. Quick Camera Scan */}
                  <button
                    onClick={triggerCameraInput}
                    className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl active:scale-98 transition-all shadow-md shadow-purple-600/25 group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 group-hover:scale-105 transition-transform">
                      <Camera size={24} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm leading-tight">{t('Chụp ảnh để kiểm')}</p>
                      <p className="text-[14px] text-purple-100 opacity-90 mt-0.5">{t('Chụp màn hình hoặc mã QR để kiểm')}</p>
                    </div>
                  </button>

                  {/* 2. Emergency 60s */}
                  <button
                    onClick={handleEmergencyClick}
                    className="flex items-center gap-3.5 p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl active:scale-98 transition-colors border-2 border-red-200"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldAlert size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm leading-tight text-red-900">{t('Báo động khẩn cấp 60 giây')}</p>
                      <p className="text-[14px] text-red-600 mt-0.5">{t('Dừng việc chuyển tiền và gọi người giúp')}</p>
                    </div>
                  </button>

                  {/* 3. Voice Check */}
                  <button
                    onClick={handleVoiceClick}
                    className="flex items-center gap-3.5 p-3 bg-purple-50 hover:bg-purple-100 text-[#5b21b6] rounded-2xl active:scale-98 transition-colors border-2 border-purple-100"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[#7e22ce] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Mic size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm leading-tight text-[#3b0764]">{t('Chạm để nói')}</p>
                      <p className="text-[14px] text-purple-700 mt-0.5">{t('Kể lại cuộc gọi hoặc tin nhắn lạ')}</p>
                    </div>
                  </button>

                  {/* 4. Call Family */}
                  <button
                    onClick={handleCallClick}
                    className="flex items-center gap-3.5 p-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-2xl active:scale-98 transition-colors border-2 border-green-200"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <PhoneCall size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm leading-tight text-green-900">{t('Gọi ngay cho con cháu')}</p>
                      <p className="text-[14px] text-green-700 truncate mt-0.5">{primaryContact.name} ({primaryContact.phone})</p>
                    </div>
                  </button>

                  {/* 5. Real Picture-in-Picture / Floating Window Button (Always-on-top outside OS) */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      tryToLaunchPip();
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl text-[14px] font-black border transition-all active:scale-98 shadow-sm ${
                      isPipActive 
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-2 ring-emerald-400/40' 
                        : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-950 border-indigo-200'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-[14px] text-left">
                      <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Maximize2 size={16} className={isPipActive ? 'text-emerald-200' : 'text-white'} />
                      </div>
                      <div>
                        <p className="font-black text-[14px] leading-tight">
                          {isPipActive ? '🟢 Cửa sổ nổi đang bật ngoài OS' : '🌟 Đẩy Bong Bóng Ra Ngoài Màn Hình'}
                        </p>
                        <p className="text-[14px] text-indigo-700/80 font-medium">{t('Nổi đè lên các ứng dụng khác')}</p>
                      </div>
                    </span>
                    <span className="text-[14px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shadow-xs shrink-0">
                      {isPipActive ? 'Đang chạy' : 'Bật ngay'}
                    </span>
                  </button>

                  {/* 6. Dải cảnh báo THẬT đè lên màn hình — xem `moPopupThat` */}
                  <button
                    onClick={() => { void moPopupThat(); }}
                    className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-700 text-[14px] font-bold border border-gray-200 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-[14px] text-gray-800">
                      <Smartphone size={16} className="text-purple-600" />
                      {t('Hiện dải cảnh báo ra ngoài app')}
                    </span>
                    <ArrowRight size={15} className="text-gray-400" />
                  </button>

                  {loiPopup === 'web' && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-2xl">
                      <p className="text-[14px] text-amber-900 leading-snug font-medium">
                        {t('Trình duyệt không cho vẽ đè lên app khác. Phần này chỉ chạy được trên bản đã cài vào máy.')}
                      </p>
                    </div>
                  )}
                  {/*
                    ⚠️ ROM CHẶN LÀ MỘT CA RIÊNG, KHÔNG PHẢI "CHƯA BẬT".
                    `canDrawOverlays` trả true nhưng `addView` vẫn bị từ chối ⇒ máy
                    còn một công tắc thứ hai mà Android không cho đọc trạng thái.
                    Đưa bác đi bật lại cái đã bật là đẩy bác vào vòng lặp.
                  */}
                  {loiPopup === 'rom_chan' && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-2xl">
                      <p className="text-[14px] text-amber-900 leading-snug font-medium">
                        {t('Máy đã cho phép vẽ đè, nhưng hệ điều hành vẫn chặn. Máy Xiaomi, Oppo, Vivo, Realme còn một công tắc nữa tên “hiện cửa sổ khi chạy nền” — bác bật luôn dòng đó giúp cháu.')}
                      </p>
                    </div>
                  )}
                  {(loiPopup === 'chua_bat' || loiPopup === 'chua_co_quyen') && (
                    <button
                      onClick={() => { void xinQuyenPopup(); }}
                      className="p-2.5 bg-amber-50 border border-amber-300 rounded-2xl text-left"
                    >
                      <p className="text-[14px] text-amber-900 leading-snug font-medium">
                        {t('Máy chưa cho phép vẽ đè. Chạm vào đây để mở Cài đặt, tìm dòng Khoan Đã rồi gạt sang bật.')}
                      </p>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* The Main Floating Ball Icon */}
            <div className="relative group">
              <button
                onClick={handleBallClick}
                /*
                  ⚠️ 56px LÀ SÀN, KHÔNG PHẢI GỢI Ý — `--touch-target-primary` (§4.4).
                  Đừng hạ xuống nữa cho "gọn": nút này dành cho ngón tay run.

                  ⚠️ VÀ ĐỪNG TĂNG LÊN NỮA. Bản trước là 64px, lên 72px ở màn rộng,
                  cộng huy hiệu lấn ra hai góc, bóng đổ 35px và MỘT VÒNG `animate-ping`
                  nhấp nháy vĩnh viễn. Vùng nó chiếm thật là ~100px, và trên máy
                  360dp nó che mất nút "Xem thử một lần" ở màn Cài đặt cùng dòng
                  mô tả ở màn chọn vai trò. Người dùng báo 19/8/2026.

                  ⚠️ `animate-ping` ĐÃ BỎ HẲN, và không nên quay lại. Một quầng
                  sáng nhấp nháy không ngừng ở góc màn hình dạy người dùng đúng một
                  điều: bỏ qua chuyển động của app này. Đến lượt dải cảnh báo mức
                  CAO nhấp nháy thật, nó cũng bị bỏ qua theo (§4.6).
                */
                className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#7e22ce] via-[#9333ea] to-[#c084fc] p-0.5 shadow-[0_4px_16px_rgba(126,34,206,0.4)] border-2 border-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                title={hasPermission ? "Nút tròn quét nhanh của Khoan Đã" : "Nút tròn quét nhanh — máy chưa cho dùng máy ảnh"}
              >
                
                <div className="w-full h-full rounded-full bg-gradient-to-b from-white/30 to-transparent flex items-center justify-center relative z-10 overflow-hidden">
                  <img
                    src="/logo.webp"
                    alt={t('Phím tắt nhanh Khoan Đã')}
                    className="w-9 h-9 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                  />
                </div>

                {/* Little Camera Badge */}
                <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs z-20">
                  <Camera size={11} />
                </div>

                {/* Status Indicator */}
                {!hasPermission && (
                  /*
                    ⚠️ BỎ `animate-bounce`. Chấm này hiện SUỐT khi chưa cấp quyền
                    camera — tức là nó nảy không ngừng, mỗi lần bác mở app, ở mọi
                    màn hình. Với người cao tuổi, một dấu chấm than cam nhảy liên
                    tục đọc ra là "app đang hỏng", chứ không phải "còn một việc
                    nhỏ chưa làm". Tĩnh thì vẫn thấy, mà không hét vào mặt.
                  */
                  /*
                    ⚠️ CHẤM TRƠN, KHÔNG CÓ CHỮ — VÀ ĐÂY LÀ LÝ DO.

                    Bản trước nhét dấu "!" vào một chấm 16px, nên phải hạ cỡ chữ
                    xuống 10px để nó vừa. `test/hop-dong.test.mjs` chặn ngay: sàn
                    §4.4 là 14px, không có ngoại lệ cho "chữ chỉ là trang trí".

                    Sàn đó đúng, và cách sửa đúng không phải là làm chấm to lên —
                    một dấu chấm than to ở góc màn hình đọc ra là "app hỏng". Một
                    chấm cam trơn nói vừa đủ: còn một việc chưa xong. Nội dung
                    thật nằm ở nhãn của nút, nơi trình đọc màn hình lấy được.
                  */
                  <div
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white z-20"
                  />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================
          PERMISSION REQUEST & GUIDANCE MODAL
      ======================================================== */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 80, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 80, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto text-left"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 border-2 border-[#2e1065] flex items-center justify-center text-purple-700 shrink-0">
                    <Layers size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#2e1065]">{t('Bóng nổi Khoan Đã')}</h3>
                    <p className="text-[14px] text-purple-600 font-semibold">{t('Luôn ở góc màn hình')}</p>
                  </div>
                </div>
                <button aria-label={t("Đóng")}
                  onClick={() => setShowPermissionModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Description for elderly users */}
              {/*
                ⚠️ MỘT CÂU, KHÔNG PHẢI HAI ĐOẠN.
                Bản trước liệt kê "kể cả khi bác đang đọc tin nhắn SMS, lướt Zalo,
                Facebook hay ở màn hình chính" — bốn ví dụ cho một ý mà câu trước đã
                nói xong. Ví dụ chỉ giúp khi ý còn mơ hồ; ở đây nó chỉ dài thêm.
              */}
              <div className="bg-purple-50/80 border-2 border-[#2e1065] rounded-2xl p-3.5 mb-4 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[14px] text-purple-900 leading-relaxed font-medium">
                  {t('Gặp số lạ hay link lạ, chạm quả bóng là kiểm được ngay.')}
                </p>
              </div>

              {/* Main Action Button to Grant Permission & Activate PiP */}
              <button
                onClick={handleRequestPermission}
                className="w-full py-3.5 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all mb-4"
              >
                <Sparkles size={18} />
                {hasPermission ? t('Bật bóng nổi') : t('Cho phép hiện bóng')}
              </button>

              {/* Tabs for OS Guidance */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => setXemHuongDan((x) => !x)}
                  className="w-full flex items-center justify-between text-[14px] font-bold text-gray-700 py-2"
                >
                  <span>{t('Nút trên không ăn? Xem hướng dẫn')}</span>
                  <ChevronRight
                    size={16}
                    className={`text-purple-600 transition-transform ${xemHuongDan ? 'rotate-90' : ''}`}
                  />
                </button>
                {xemHuongDan && (<>
                <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-2xl mb-3 text-center text-[14px] font-bold text-gray-600">
                  <button
                    onClick={() => setActiveTabGuide('android')}
                    className={`py-1.5 rounded-lg transition-all ${activeTabGuide === 'android' ? 'bg-white text-purple-700 shadow-xs' : ''}`}
                  >
                    Android
                  </button>
                  <button
                    onClick={() => setActiveTabGuide('samsung')}
                    className={`py-1.5 rounded-lg transition-all ${activeTabGuide === 'samsung' ? 'bg-white text-purple-700 shadow-xs' : ''}`}
                  >
                    Samsung
                  </button>
                  <button
                    onClick={() => setActiveTabGuide('ios')}
                    className={`py-1.5 rounded-lg transition-all ${activeTabGuide === 'ios' ? 'bg-white text-purple-700 shadow-xs' : ''}`}
                  >
                    iPhone
                  </button>
                  <button
                    onClick={() => setActiveTabGuide('pip')}
                    className={`py-1.5 rounded-lg transition-all ${activeTabGuide === 'pip' ? 'bg-white text-purple-700 shadow-xs' : ''}`}
                  >
                    PiP
                  </button>
                </div>

                {/* Tab 1: Android generic */}
                {activeTabGuide === 'android' && (
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-[14px] text-gray-700 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[14px]">1</span>
                      <p>{t('Mở Cài đặt của điện thoại, rồi chọn mục Ứng dụng.')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[14px]">2</span>
                      <p>{t('Tìm và chọn Khoan Đã, hoặc trình duyệt Chrome.')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[14px]">3</span>
                      <p>{t('Gạt bật dòng Xuất hiện trên cùng, có máy ghi là Hiển thị trên ứng dụng khác.')}</p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Samsung */}
                {activeTabGuide === 'samsung' && (
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-[14px] text-gray-700 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[14px]">1</span>
                      <p>{t('Mở Cài đặt của Samsung, vào Ứng dụng, rồi bấm dấu ba chấm ở góc trên.')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[14px]">2</span>
                      <p>{t('Chọn Truy cập đặc biệt, rồi chọn Xuất hiện trên cùng.')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[14px]">3</span>
                      <p>{t('Gạt bật cho ứng dụng Khoan Đã.')}</p>
                    </div>
                  </div>
                )}

                {/* Tab 3: iPhone */}
                {activeTabGuide === 'ios' && (
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-[14px] text-gray-700 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[14px]">1</span>
                      <p>{t('Thêm vào màn hình chính: mở Safari, bấm nút Chia sẻ, rồi chọn Thêm vào màn hình chính.')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[14px]">2</span>
                      <p>{t('Nút AssistiveTouch: vào Cài đặt, Trợ năng, Cảm ứng, rồi bật AssistiveTouch.')}</p>
                    </div>
                  </div>
                )}

                {/* Tab 4: PiP Window */}
                {activeTabGuide === 'pip' && (
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-[14px] text-gray-700 space-y-2">
                    <p className="font-semibold text-purple-900">{t('Cửa sổ nổi')}</p>
                    <p>{t('Khoan Đã mở một khung nhỏ nổi trên màn hình, để bác vẫn thấy nó khi đang dùng app khác.')}</p>
                    <button
                      onClick={() => {
                        setShowPermissionModal(false);
                        tryToLaunchPip();
                      }}
                      className="w-full py-2 bg-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Play size={13} /> {t('Thử mở cửa sổ PiP')}
                    </button>
                  </div>
                )}
                </>)}
              </div>

              {/* Bottom Close */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[14px] text-gray-400">{hasPermission ? t('Đã được phép') : t('Chưa bật')}</span>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-[14px] font-bold"
                >
                  {t('Đóng')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        ══════ ĐÃ XOÁ "MÔ PHỎNG NGOÀI APP" — 351 DÒNG, 20/8/2026 ══════

        Khối cũ vẽ tay một màn hình điện thoại giả — đồng hồ, thanh thông báo,
        biểu tượng ứng dụng — rồi đặt "dải cảnh báo" lên trên.

        Người dùng nói thẳng hai lần, và đúng cả hai lần:
          "pop up đã hiện ra ngoài điện thoại thật đâu, tất cả chỉ là do bạn dựng
           1 cái giao diện như web thật"
          "pop up phải hiện hẳn ra bên ngoài như messenger"

        ⚠️ THÊM MỘT DÒNG "đây là mô phỏng" KHÔNG CỨU ĐƯỢC KHỐI NÀY. Đã thử —
        dải cảnh báo màu hổ phách vẫn đứng đó, và người dùng vẫn hỏi lại.
        Một thứ TRÔNG NHƯ tính năng thật thì không chứng minh được tính năng thật
        chạy được — nó chỉ tốn chỗ và gây hiểu nhầm. §11: không khai một việc
        chưa xảy ra.

        Popup THẬT chạy bằng `PopupDeManHinh.java` + quyền `SYSTEM_ALERT_WINDOW`,
        và giờ nút trong menu gọi THẮNG vào đó (xem `moPopupThat` ở trên).
        Không còn đường nào trong app dẫn tới một bản vẽ nữa.
      */}
    </>
  );
}
