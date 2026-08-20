import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  ShieldAlert, 
  Home,
  PhoneCall, 
  Mic, 
  X, 
  Sparkles, 
  Smartphone, 
  Layers,
  ChevronRight, 
  AlertTriangle,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  Settings,
  Play,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { ViewState } from '../App';

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
  const [activeSimApp, setActiveSimApp] = useState<'home' | 'zalo' | 'sms' | 'call'>('home');
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
              <strong style="font-size: 12px; letter-spacing: -0.2px;">Khoan Đã Nổi Ngoài OS</strong>
            </div>
            <div class="badge-live">
              <span class="dot"></span>
              <span>Đang nổi</span>
            </div>
          </div>
          <div class="grid-btns">
            <button id="pipScan" class="btn btn-camera">
              <span style="font-size: 16px;">📸</span>
              <span>Quét Ảnh / Màn Hình</span>
            </button>
            <button id="pipSos" class="btn btn-danger">
              <span style="font-size: 16px;">🚨</span>
              <span>Dừng 60s (SOS)</span>
            </button>
            <button id="pipVoice" class="btn btn-voice">
              <span style="font-size: 16px;">🎙️</span>
              <span>Kể Tình Huống</span>
            </button>
            <button id="pipCall" class="btn btn-call">
              <span style="font-size: 16px;">📞</span>
              <span>Gọi Con Cái</span>
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
              <p className="font-extrabold text-[14px]">Đã cấp quyền Bong bóng nổi!</p>
              <p className="text-[14px] text-emerald-100">Khoan Đã sẽ luôn hiện nổi sẵn sàng ở mép màn hình chính.</p>
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
                      <span className="font-black text-[#2e1065] text-sm sm:text-base">Phím Tắt Khoan Đã</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button aria-label={t("Cài đặt")}
                        onClick={() => setShowPermissionModal(true)}
                        className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-xl text-[14px] flex items-center gap-1 font-bold"
                        title="Xem quyền & hướng dẫn"
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
                      <p className="font-black text-sm leading-tight text-yellow-300">Đang nghe điện thoại lạ (8s)</p>
                      <p className="text-[14px] text-purple-200 mt-0.5">Hỏi nhanh nhận diện bẫy ngay</p>
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
                      <p className="font-black text-sm leading-tight">Chụp ảnh quét ngay</p>
                      <p className="text-[14px] text-purple-100 opacity-90 mt-0.5">Chụp màn hình / QR để AI kiểm tra tức thì</p>
                    </div>
                  </button>

                  {/* 2. Emergency 60s */}
                  <button
                    onClick={handleEmergencyClick}
                    className="flex items-center gap-3.5 p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl active:scale-98 transition-colors border-2 border-red-200"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldAlert size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm leading-tight text-red-900">Báo động Khẩn cấp 60s</p>
                      <p className="text-[14px] text-red-600 mt-0.5">Dừng thao tác chuyển tiền & gọi hỗ trợ</p>
                    </div>
                  </button>

                  {/* 3. Voice Check */}
                  <button
                    onClick={handleVoiceClick}
                    className="flex items-center gap-3.5 p-3 bg-purple-50 hover:bg-purple-100 text-[#5b21b6] rounded-2xl active:scale-98 transition-colors border-2 border-purple-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#7e22ce] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Mic size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm leading-tight text-[#3b0764]">Chạm để nói tình huống</p>
                      <p className="text-[14px] text-purple-700 mt-0.5">Kể lại cuộc gọi hoặc tin nhắn lạ</p>
                    </div>
                  </button>

                  {/* 4. Call Family */}
                  <button
                    onClick={handleCallClick}
                    className="flex items-center gap-3.5 p-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-2xl active:scale-98 transition-colors border-2 border-green-200"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <PhoneCall size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm leading-tight text-green-900">Gọi ngay cho con cháu</p>
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
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Maximize2 size={16} className={isPipActive ? 'text-emerald-200' : 'text-white'} />
                      </div>
                      <div>
                        <p className="font-black text-[14px] leading-tight">
                          {isPipActive ? '🟢 Cửa sổ nổi đang bật ngoài OS' : '🌟 Đẩy Bong Bóng Ra Ngoài Màn Hình'}
                        </p>
                        <p className="text-[14px] text-indigo-700/80 font-medium">Nổi đè lên mọi ứng dụng (Always-on-top PiP)</p>
                      </div>
                    </span>
                    <span className="text-[14px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shadow-xs shrink-0">
                      {isPipActive ? 'Đang chạy' : 'Bật ngay'}
                    </span>
                  </button>

                  {/* 6. Simulate Outside Phone Screen Mode */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsOutsideMode(true);
                    }}
                    className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 text-[14px] font-bold border border-gray-200 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-[14px] text-gray-800">
                      <Smartphone size={16} className="text-purple-600" />
                      Mô phỏng Màn hình Điện thoại Ngoài App
                    </span>
                    <ArrowRight size={15} className="text-gray-400" />
                  </button>
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
                    alt="Khoan Đã Fast Shortcut"
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
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
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
              <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3.5 mb-4 flex items-start gap-2">
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
                <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl mb-3 text-center text-[14px] font-bold text-gray-600">
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
                      <p>Vào <span className="font-bold">Cài đặt (Settings)</span> của điện thoại → Chọn mục <span className="font-bold">Ứng dụng</span>.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[14px]">2</span>
                      <p>Tìm và chọn <span className="font-bold">Khoan Đã</span> (hoặc trình duyệt Chrome).</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center shrink-0 text-[14px]">3</span>
                      <p>Bật công tắc <span className="font-bold text-purple-700">"Xuất hiện trên cùng"</span> (hoặc <em>Hiển thị trên ứng dụng khác / Draw over other apps</em>).</p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Samsung */}
                {activeTabGuide === 'samsung' && (
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-[14px] text-gray-700 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[14px]">1</span>
                      <p>Mở <span className="font-bold">Cài đặt Samsung</span> → <span className="font-bold">Ứng dụng</span> → Bấm dấu 3 chấm góc trên.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[14px]">2</span>
                      <p>Chọn <span className="font-bold">Truy cập đặc biệt (Special access)</span> → <span className="font-bold">Xuất hiện trên cùng</span>.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[14px]">3</span>
                      <p>Gạt BẬT cho ứng dụng <span className="font-bold text-blue-700">Khoan Đã</span>.</p>
                    </div>
                  </div>
                )}

                {/* Tab 3: iPhone */}
                {activeTabGuide === 'ios' && (
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-[14px] text-gray-700 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[14px]">1</span>
                      <p><span className="font-bold">Thêm vào màn hình chính:</span> Mở Safari, bấm nút <span className="font-bold">Chia sẻ 📤</span> → chọn <span className="font-bold">"Thêm vào MH chính" (Add to Home Screen)</span>.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[14px]">2</span>
                      <p><span className="font-bold">Nút AssistiveTouch:</span> Vào Cài đặt → Trợ năng → Cảm ứng → Bật AssistiveTouch và gán chạm 2 lần để mở nhanh Khoan Đã.</p>
                    </div>
                  </div>
                )}

                {/* Tab 4: PiP Window */}
                {activeTabGuide === 'pip' && (
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-[14px] text-gray-700 space-y-2">
                    <p className="font-semibold text-purple-900">Tính năng Cửa Sổ Nổi Trực Tiếp (Picture-in-Picture):</p>
                    <p>Ứng dụng sử dụng công nghệ PiP hiện đại để tạo một khung cửa sổ nhỏ luôn nổi trên màn hình điện thoại khi bác thoát ra ngoài.</p>
                    <button
                      onClick={() => {
                        setShowPermissionModal(false);
                        tryToLaunchPip();
                      }}
                      className="w-full py-2 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 mt-2"
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
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[14px] font-bold"
                >
                  {t('Đóng')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          2. OUTSIDE APP SIMULATION (MÔ PHỎNG NGOÀI MÀN HÌNH ĐIỆN THOẠI)
      ======================================================== */}
      <AnimatePresence>
        {isOutsideMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 20%, #312e81 0%, #0f172a 70%, #020617 100%)'
            }}
          >
            {/* Top Status Bar & Exit Button */}
            <div className="w-full px-5 pt-3 pb-2 flex items-center justify-between text-[14px] text-slate-300 relative z-30">
              <span className="font-semibold tracking-wider">
                {new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-purple-900/90 border border-purple-400/50 rounded-full text-[14px] text-purple-200 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t('Màn hình mô phỏng')}
                </span>
                <button
                  onClick={() => setIsOutsideMode(false)}
                  className="p-1.5 px-3 bg-white/20 hover:bg-white/30 rounded-full text-white text-[14px] font-bold active:scale-95 transition-all flex items-center gap-1"
                >
                  <X size={14} /> {t('Về app')}
                </button>
              </div>
            </div>

            {/*
              ══════ NÓI THẲNG ĐÂY LÀ MÔ PHỎNG — §11 ══════

              ⚠️ MÀN NÀY DO KHOAN ĐÃ TỰ VẼ RA, NÓ KHÔNG PHẢI MÀN HÌNH THẬT CỦA MÁY.
              Đồng hồ, biểu tượng ứng dụng, thanh thông báo — tất cả đều là hình
              vẽ trong app. Người dùng phát hiện 20/8/2026 và nói đúng: nhãn cũ
              ghi "Ngoài app" khiến người xem tưởng popup đang thật sự hiện ra
              ngoài điện thoại.

              Đó là cùng một họ lỗi với "đã gửi cho người thân" khi mới chỉ mở
              bảng chia sẻ (§11): khai một việc chưa xảy ra.

              ⚠️ POPUP THẬT CÓ TỒN TẠI, và nó chạy bằng `PopupDeManHinh` với
              quyền `SYSTEM_ALERT_WINDOW`. Nhưng nó KHÔNG phải màn này. Chỗ xem
              popup thật là Cài đặt › Dải cảnh báo › Xem thử một lần.

              ⚠️ ĐỪNG XOÁ DÒNG NÀY CHO GỌN. Không có nó thì màn mô phỏng lại trở
              thành một lời khai sai.
            */}
            <div className="w-full px-4 pt-2 z-30">
              <div className="bg-amber-100/95 border border-amber-400 rounded-2xl px-3 py-2">
                <p className="text-[14px] font-bold text-amber-950 leading-snug">
                  {t('Đây là màn hình mô phỏng do Khoan Đã vẽ ra để bác xem thử.')}
                </p>
                <p className="text-[14px] text-amber-900 leading-snug mt-0.5">
                  {t('Muốn xem dải cảnh báo thật hiện ra ngoài app: vào Cài đặt › Dải cảnh báo › Xem thử một lần.')}
                </p>
              </div>
            </div>

            {/* Pinned Khoan Đã Shortcut Notification Banner Outside Phone */}
            <div className="w-full px-4 pt-1 z-30">
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full bg-white/95 text-slate-900 rounded-3xl p-3.5 shadow-2xl border border-purple-200 backdrop-blur-xl flex flex-col gap-2.5"
              >
                <div 
                  onClick={() => {
                    setIsOutsideMode(false);
                    setView('home');
                  }}
                  className="flex items-center justify-between cursor-pointer hover:opacity-90 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-2">
                    <img src="/logo.webp" alt="Logo" className="w-6 h-6 rounded-lg object-contain shadow-xs" />
                    <div>
                      {/*
                        ⚠️ TÊN NGẮN. "Khoan Đã - Bảo Vệ Thường Trực" xuống ba dòng
                        trong dải thông báo hẹp; dòng phụ bên dưới đã nói đúng
                        việc chạm vào thì được gì, nên phần "Bảo Vệ Thường Trực"
                        chỉ lặp lại điều người đọc vừa thấy.
                      */}
                      <h4 className="font-black text-[14px] text-[#2e1065] leading-none">Khoan Đã</h4>
                      <p className="text-[14px] text-purple-700 font-medium">{t('Chạm để mở')}</p>
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    {t('Ghim')}
                  </span>
                </div>

                {/* Instant Action Buttons on the Notification */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-purple-100">
                  <button
                    onClick={() => {
                      setIsOutsideMode(false);
                      setView('home');
                    }}
                    className="flex flex-col items-center justify-center p-2 bg-purple-50 hover:bg-purple-100 text-[#5b21b6] rounded-2xl active:scale-95 transition-all border border-purple-200"
                  >
                    <Home size={17} className="mb-0.5" />
                    <span className="font-extrabold text-[14px] leading-tight">{t('Mở app')}</span>
                  </button>

                  <button
                    onClick={triggerCameraInput}
                    className="flex flex-col items-center justify-center p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl active:scale-95 transition-all shadow-md shadow-purple-500/20 group"
                  >
                    <Camera size={17} className="mb-0.5 group-hover:scale-110 transition-transform" />
                    <span className="font-extrabold text-[14px] leading-tight">{t('Chụp ảnh')}</span>
                  </button>

                  <button
                    onClick={handleVoiceClick}
                    className="flex flex-col items-center justify-center p-2 bg-purple-100 hover:bg-purple-200 text-[#5b21b6] rounded-2xl active:scale-95 transition-all"
                  >
                    <Mic size={17} className="mb-0.5" />
                    <span className="font-bold text-[14px] leading-tight">{t('Ghi âm')}</span>
                  </button>

                  <button
                    onClick={handleEmergencyClick}
                    className="flex flex-col items-center justify-center p-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl active:scale-95 transition-all shadow-md shadow-red-500/20"
                  >
                    <ShieldAlert size={17} className="mb-0.5" />
                    <span className="font-extrabold text-[14px] leading-tight">SOS 60s</span>
                  </button>
                </div>
              </motion.div>
            </div>

            {/* App Switching Simulator Tabs */}
            <div className="px-4 mt-2 z-30">
              {/*
                ⚠️ NHÃN NGẮN VÀ CÙNG HÌNH DẠNG VỚI THANH ĐIỀU HƯỚNG.
                Bốn nhãn cũ — "MH Chính", "SMS Lạ", "Zalo Giả Mạo", "Cuộc Gọi Lạ"
                — vỡ xuống hai dòng trên khổ 390px, thấy trong ảnh người dùng gửi
                20/8/2026. "Lạ" và "Giả Mạo" là phần thân của tấm thẻ nói rồi,
                nhắc lại trên nhãn chỉ tốn chỗ.
              */}
              <div className="flex items-center justify-center gap-1 p-[5px] bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] rounded-full border border-white/20 text-[14px] font-bold">
                <button
                  onClick={() => setActiveSimApp('home')}
                  className={`flex-1 px-2 py-1.5 rounded-full transition-all ${activeSimApp === 'home' ? 'bg-white text-[#6d28d9] shadow-sm' : 'text-white/85'}`}
                >
                  {t('Màn chính')}
                </button>
                <button
                  onClick={() => setActiveSimApp('sms')}
                  className={`flex-1 px-2 py-1.5 rounded-full transition-all ${activeSimApp === 'sms' ? 'bg-white text-[#6d28d9] shadow-sm' : 'text-white/85'}`}
                >
                  SMS
                </button>
                <button
                  onClick={() => setActiveSimApp('zalo')}
                  className={`flex-1 px-2 py-1.5 rounded-full transition-all ${activeSimApp === 'zalo' ? 'bg-white text-[#6d28d9] shadow-sm' : 'text-white/85'}`}
                >
                  Zalo
                </button>
                <button
                  onClick={() => setActiveSimApp('call')}
                  className={`flex-1 px-2 py-1.5 rounded-full transition-all ${activeSimApp === 'call' ? 'bg-white text-[#6d28d9] shadow-sm' : 'text-white/85'}`}
                >
                  {t('Cuộc gọi')}
                </button>
              </div>
            </div>

            {/* Phone Lockscreen/Homescreen Middle Area */}
            <div className="flex-1 px-4 flex flex-col justify-center gap-3 relative z-20 my-auto overflow-y-auto py-2">
              {activeSimApp === 'home' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-5xl font-light text-white/90">
                      {new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[14px] text-purple-200/80 font-medium mt-1">
                      {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>

                  {/* App Grid on Phone Screen */}
                  <div className="grid grid-cols-4 gap-4 px-4 py-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-13 h-13 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-md">
                        <MessageSquare size={24} />
                      </div>
                      <span className="text-[14px] text-white/80 font-medium">{t('Tin nhắn')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-13 h-13 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
                        <PhoneCall size={24} />
                      </div>
                      <span className="text-[14px] text-white/80 font-medium">{t('Danh bạ')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-13 h-13 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md">
                        <Globe size={24} />
                      </div>
                      <span className="text-[14px] text-white/80 font-medium">{t('Trình duyệt')}</span>
                    </div>
                    <div 
                      onClick={() => {
                        setIsOutsideMode(false);
                        setView('home');
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 flex items-center justify-center text-white shadow-lg border border-purple-300 ring-2 ring-purple-400/50">
                        <img src="/logo.webp" alt="Logo" className="w-9 h-9 object-contain" />
                      </div>
                      <span className="text-[14px] text-amber-300 font-bold">Khoan Đã</span>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl text-center text-[14px] text-purple-200">
                    {t('Kéo quả bóng đi bất cứ đâu trên màn hình.')}
                  </div>
                </div>
              )}

              {activeSimApp === 'sms' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 border border-red-500/40 text-left shadow-2xl space-y-3"
                >
                  <div className="flex items-center justify-between text-[14px] text-red-300 border-b border-slate-700/60 pb-2">
                    <span className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={14} className="text-red-400" /> {t('Tin nhắn từ số lạ')}
                    </span>
                    <span className="text-[14px] text-slate-400">{t('Vừa nhận')}</span>
                  </div>
                  <div className="p-3 bg-slate-800/90 rounded-2xl text-[14px] text-slate-200 leading-relaxed border border-slate-700">
                    {t('"THÔNG BÁO TỪ BỘ CÔNG AN: Bác có liên quan đường dây rửa tiền. Chuyển 50 triệu vào tài khoản 098… để điều tra, nếu không sẽ bị tạm giam trong 24h!"')}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={triggerCameraInput}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-[14px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                    >
                      <Camera size={13} /> {t('Kiểm tin này')}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeSimApp === 'zalo' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 border border-blue-500/40 text-left shadow-2xl space-y-3"
                >
                  <div className="flex items-center justify-between text-[14px] text-blue-300 border-b border-slate-700/60 pb-2">
                    <span className="flex items-center gap-1.5 font-bold">
                      <MessageSquare size={14} className="text-blue-400" /> {t('Zalo: xin tiền gấp')}
                    </span>
                    <span className="text-[14px] text-slate-400">{t('1 phút trước')}</span>
                  </div>
                  <div className="p-3 bg-slate-800/90 rounded-2xl text-[14px] text-slate-200 leading-relaxed border border-slate-700">
                    {t('"Mẹ ơi con bị tai nạn đang cấp cứu, điện thoại con hỏng nên nhắn nick này. Mẹ chuyển gấp 20 triệu vào tài khoản 1903… VCB giúp con."')}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleEmergencyClick}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-[14px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                    >
                      <ShieldAlert size={13} /> {t('Báo động')}
                    </button>
                    <button
                      onClick={handleCallClick}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-xl text-[14px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                    >
                      <PhoneCall size={13} /> {t('Gọi số thật')}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeSimApp === 'call' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 border border-amber-500/40 text-left shadow-2xl space-y-3"
                >
                  <div className="flex items-center justify-between text-[14px] text-amber-300 border-b border-slate-700/60 pb-2">
                    <span className="flex items-center gap-1.5 font-bold">
                      <PhoneCall size={14} className="text-amber-400 animate-pulse" /> {t('Xưng là nhân viên điện lực')}
                    </span>
                    <span className="text-[14px] text-amber-400 font-bold">{t('Đang đổ chuông')}</span>
                  </div>
                  <div className="p-3 bg-slate-800/90 rounded-2xl text-[14px] text-slate-200 leading-relaxed border border-slate-700">
                    {t('"Tiền điện tháng này nhà mình chưa đóng, 2 tiếng nữa sẽ bị cắt điện. Bác đọc mã OTP vừa gửi về máy để gia hạn…"')}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={handleVoiceClick}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-[14px] font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                    >
                      <Mic size={13} /> {t('Kể lại')}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Draggable Floating Bubble on Simulated Screen */}
            <motion.div
              drag
              dragMomentum={false}
              className="fixed right-4 bottom-28 z-50 cursor-grab active:cursor-grabbing select-none"
            >
              <button
                onClick={() => {
                  setIsOutsideMode(false);
                  setView('home');
                }}
                className="relative w-15 h-15 rounded-full bg-gradient-to-tr from-[#7e22ce] via-[#9333ea] to-[#c084fc] p-0.5 shadow-[0_10px_35px_rgba(126,34,206,0.7)] border-2 border-white flex items-center justify-center active:scale-90 transition-transform group"
                title="Bấm để vào app Khoan Đã"
              >
                <span className="absolute -inset-1 rounded-full bg-purple-400 opacity-50 animate-ping pointer-events-none"></span>
                <div className="w-full h-full rounded-full bg-gradient-to-b from-white/30 to-transparent flex items-center justify-center overflow-hidden">
                  <img src="/logo.webp" alt="Logo" className="w-9 h-9 object-contain" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full border border-white flex items-center justify-center text-white shadow-xs">
                  <Camera size={11} />
                </div>
              </button>
            </motion.div>

            {/* Bottom Dock / Home Bar */}
            <div className="w-full pb-6 pt-2 flex flex-col items-center justify-center relative z-20">
              <button
                onClick={() => {
                  setIsOutsideMode(false);
                  setView('home');
                }}
                className="px-6 py-2.5 bg-white text-[#2e1065] rounded-full font-black text-[14px] shadow-xl active:scale-95 transition-transform flex items-center gap-2"
              >
                <img src="/logo.webp" alt="Logo" className="w-4 h-4 object-contain" />
                {t('Mở Khoan Đã')}
              </button>
              <div className="w-32 h-1 bg-white/40 rounded-full mt-3"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
