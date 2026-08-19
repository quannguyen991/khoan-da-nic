import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  Mic, 
  ArrowLeft, 
  Home, 
  Search, 
  ShieldAlert, 
  BookOpen, 
  User, 
  Settings,
  LogOut,
  Bell,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Database,
  Lock,
  Phone,
  PhoneCall,
  Plus,
  Download,
  Trash2,
  Image as ImageIcon,
  X,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Zap,
  QrCode,
  Globe,
  MessageSquare,
  Volume2,
  Bookmark,
  RotateCcw,
  FileText,
  LayoutGrid,
  Layers,
  Smartphone,
  Sliders,
  Maximize2,
  EyeOff, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Lang, t as translate } from './i18n';
/**
 * §HĐ luật 1 và 2 — MÃ → CHỮ chỉ đi qua tệp này.
 * Backend trả ENUM và MÃ; chữ tiếng Việt / tiếng Anh nằm ở `catalog.ts`, và
 * CHỈ ở đó. Hệ quả cố ý: đổi ngôn ngữ KHÔNG THỂ làm đổi kết luận.
 */
import { NHAN, MA_LY_DO, CHUA_KIEM, CHUA_LAY_TIN, NOI_CHAY_AI, tra, traNhieu, CHU_NATIVE , TRANG_THAI_MAY, NHAC_CUOC_GOI} from './catalog';
import { api } from './api-goc';
import {
  laApk, hienCanhBaoHeadsUp, hienPopupCanhBao, anPopup,
  datThongBaoThuongTruc, noiDungChiaSe, quyenPopup, xinQuyenPopup,
  ngheGiongNoi, dungNghe as dungNgheNative, coBoNghe, moCaiDatGiongNoi,
  quyenDocThongBao, xinQuyenDocThongBao, tinMoiNhat, xoaTinDaBat,
  trangThaiThuongTruc, trangThaiMay, tomTatChoMayChu, moCaiDatTroNang,
  napChuCuocGoi, trangThaiTheoDoiCuocGoi, datTheoDoiCuocGoi,
  type QuyenNative, type TrangThaiMay,
} from './native';
import { GuardianIntroView, GuardianAuthView, GuardianView } from './components/Guardian';
import { AppMenuModal } from './components/AppMenuModal';
import { MatKhauGiaDinh, docMatKhauGiaDinh } from './components/MatKhauGiaDinh';
import { FloatingQuickAccess } from './components/FloatingQuickAccess';
import { HoiNhanhView } from './components/HoiNhanh';
/**
 * MÀN BÀI HỌC TẢI RIÊNG — nó là phần chữ nặng nhất của app (bài học + bộ câu
 * hỏi + dữ liệu tình huống), mà bác chỉ mở khi rảnh, không phải lúc đang bị gọi.
 *
 * ⚠️ TUYỆT ĐỐI KHÔNG LÀM THẾ NÀY VỚI ĐƯỜNG KHẨN CẤP.
 * Màn hỏi nhanh, màn kết quả và bộ luật hiển thị phải nằm trong gói chính: một
 * gói tải trễ có thể không về kịp, hoặc không về, đúng lúc sóng tậm tịt. §6.7 —
 * giao diện không bao giờ được trắng vì một tệp không tải được.
 *
 * ⚠️ VÀ CHÍNH MÀN NÀY CŨNG PHẢI CÓ ĐƯỜNG HỎNG NÓI ĐƯỢC THÀNH LỜI.
 * Gói không về mà không ai bắt thì `Suspense` treo mãi ở khung chờ, và bác ngồi
 * nhìn một dòng "đang mở…" vĩnh viễn — đúng dạng lỗi §4.3, chỉ khác chỗ xảy ra.
 * Nên lỗi được bắt NGAY TRONG lượt `import()`: hỏng thì trả về một màn nói thẳng
 * là chưa tải được, kèm lối ra. Không cần lớp bắt lỗi riêng, và không có nhánh
 * nào im lặng.
 */
function KhongTaiDuocBaiHoc({ t, setView }: { t: any; setView: (v: ViewState) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-[18px] font-black text-[#1e1b4b] max-w-sm leading-snug">
        {t('Cháu chưa tải được phần bài học. Có thể mạng đang chập chờn.')}
      </p>
      <button
        data-vai-tro="nut-chinh"
        onClick={() => window.location.reload()}
        className="w-full max-w-xs py-3.5 px-4 bg-[#6d28d9] text-white font-black text-[16px] rounded-2xl active:scale-95"
      >
        {t('Thử lại')}
      </button>
      <button
        onClick={() => setView('home')}
        className="w-full max-w-xs py-3.5 px-4 bg-white text-[#6d28d9] border border-purple-200 font-bold text-[16px] rounded-2xl active:scale-95"
      >
        {t('Về trang chủ')}
      </button>
    </div>
  );
}

/**
 * ⚠️ KHAI KIỂU PROPS RÕ RÀNG CHO CẢ HAI NHÁNH.
 * `lazy()` phải biết component trả về nhận gì; để TypeScript tự suy từ một
 * `Promise` có hai nhánh (tải được / không tải được) thì nó rơi về
 * `IntrinsicAttributes` và mọi prop truyền vào đều báo lỗi.
 */
type PropsBaiHoc = {
  setView: (v: ViewState) => void;
  t: any;
  lang?: Lang;
  onTriggerEmergency?: () => void;
};

const LearnView = lazy<React.ComponentType<PropsBaiHoc>>(() => import('./components/Learn')
  .then((m) => ({ default: m.LearnView as React.ComponentType<PropsBaiHoc> }))
  .catch(() => ({ default: KhongTaiDuocBaiHoc as React.ComponentType<PropsBaiHoc> })));

function KhungTaiTre({ t, children }: { t: any; children: React.ReactNode }) {
  return (
    <Suspense
      fallback={(
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-[16px] font-semibold text-[#4c1d95]">{t('Đang mở phần bài học…')}</p>
        </div>
      )}
    >
      {children}
    </Suspense>
  );
}
import { EMERGENCY_NUMBERS } from './data/so-khan-cap';

export type ViewState = 'intro' | 'home' | 'voice' | 'phone' | 'link' | 'qr' | 'learn' | 'profile' | 'settings' | 'history' | 'family' | 'search' | 'login' | 'add_family' | 'warning' | 'guardian' | 'account' | 'privacy' | 'notifications' | 'device_data' | 'hoi_nhanh' | 'mat_khau_gia_dinh';

export interface HistoryRecord {
  id: number;
  title: string;
  type: 'call' | 'sms' | 'link' | 'image' | 'qr';
  risk: 'CAO' | 'NGHI_NGO' | 'CHUA_THAY';
  date: string;
  saved?: boolean;
  data: any;
}

/**
 * ⚠️ LỊCH SỬ BẮT ĐẦU RỖNG, VÀ ĐÓ LÀ CHỦ Ý.
 *
 * Bản trước cài sẵn ba bản ghi bịa — "Cuộc gọi tự xưng công an · Hôm nay 09:41",
 * "Trúng thưởng xe SH · Hôm qua", "Link ngân hàng · CHƯA_THẤY" — trình bày y
 * hệt lượt kiểm thật của chính bác, kèm những câu lý do không mã nào sinh ra.
 * Ba chuyện hỏng cùng lúc:
 *   · nói dối về chính người dùng ("hôm nay bác đã bị gọi") — §11;
 *   · một mục mức thấp khẳng định "tên miền chính thống, chứng chỉ SSL an toàn",
 *     tức hứa an toàn — §4.1 cấm;
 *   · `lyDo` là câu tự do, trong khi §HĐ luật 2 nói lý do đi bằng MÃ.
 *
 * Danh sách rỗng là một KẾT QUẢ trung thực, và màn Lịch sử đã có sẵn trạng thái
 * rỗng tử tế. Đừng lấp lại bằng ví dụ.
 */
const DEFAULT_HISTORY: HistoryRecord[] = [];

export default function App() {
  const [view, setView] = useState<ViewState>('intro');
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pinnedNotification, setPinnedNotification] = useState(() => localStorage.getItem('pinnedNotification') === 'true');
  /**
   * Vì sao công tắc thông báo không bật lên được. `null` = không có gì để nói.
   * §4.3 — giới hạn phải NÓI RA, không im lặng để bác tự đoán.
   */
  const [loiThongBaoNative, setLoiThongBaoNative] = useState<string | null>(null);

  /**
   * Có đang chạy trong bản APK không. `laApk()` phải hỏi cầu nối native nên nó
   * bất đồng bộ — giữ kết quả ở đây để giao diện dùng đồng bộ được.
   *
   * ⚠️ MẶC ĐỊNH `false`, KHÔNG PHẢI `true`. Đoán nhầm về phía "có native" là
   * hứa với bác những khả năng bản web không có (§4.3); đoán nhầm về phía
   * ngược lại chỉ là khiêm tốn thừa trong khoảnh khắc đầu.
   */
  /**
   * TRẠNG THÁI MÁY — giữ ở đây để màn cảnh báo nêu ĐÍCH DANH ứng dụng.
   *
   * ⚠️ BIẾN NÀY KHÔNG BAO GIỜ ĐƯỢC GỬI NGUYÊN LÊN MÁY CHỦ. Tên ứng dụng đã cài
   * là dấu vân tay rất mạnh của một người — nó lộ ngân hàng, bệnh, tôn giáo.
   * Thứ đi lên máy chủ là `tomTatChoMayChu()`: ba con số, không tên nào (§6.9).
   */
  const [mayCoUngDungLa, setMayCoUngDungLa] = useState<TrangThaiMay | null>(null);

  const [dangChayApk, setDangChayApk] = useState(false);
  useEffect(() => { void laApk().then(setDangChayApk); }, []);

  /**
   * ĐỌC LẠI TRẠNG THÁI MÁY MỖI LẦN APP TRỞ LẠI TIỀN CẢNH.
   *
   * ⚠️ KHÔNG CHỈ ĐỌC MỘT LẦN LÚC MỞ. Kịch bản cần bắt là: bác đang mở Khoan Đã,
   * kẻ lừa đảo giục cài app, bác chuyển sang cài rồi quay lại. Đúng lúc quay
   * lại là lúc thông tin thay đổi — và cũng là lúc duy nhất app còn cơ hội nói.
   */
  useEffect(() => {
    let huy = false;
    const doc = async () => {
      const t = await trangThaiMay();
      if (!huy) setMayCoUngDungLa(t);
    };
    void doc();
    const khiHien = () => { if (document.visibilityState === 'visible') void doc(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => { huy = true; document.removeEventListener('visibilitychange', khiHien); };
  }, []);

  /**
   * ĐỒNG BỘ CÔNG TẮC THEO SỰ THẬT, KHÔNG THEO localStorage.
   *
   * ⚠️ CHẠY LẠI MỖI LẦN APP TRỞ LẠI TIỀN CẢNH, không chỉ một lần lúc mở.
   * Ba việc đều xảy ra khi app đang ở nền và đều xoá mất thông báo: bác vào
   * Cài đặt hệ thống tắt thông báo của app, ROM dọn nền, hoặc máy khởi động
   * lại. Chỉ đọc một lần lúc dựng thì công tắc đứng yên ở trạng thái cũ và tiếp
   * tục khai một thứ không còn đúng.
   *
   * ⚠️ ĐỌC `dangHien`, KHÔNG PHẢI `daChon`. `daChon` là ý muốn của bác — nó
   * đúng kể cả khi thông báo đang bị chặn. `dangHien` mới là thứ bác thấy trên
   * thanh, và công tắc là thứ mô tả cái bác thấy (§4.3).
   */
  useEffect(() => {
    let huy = false;

    const dongBo = async () => {
      /*
       * ⚠️ HỎI TRẠNG THÁI TRÔNG CHỪNG CUỘC GỌI Ở ĐÂY, KHÔNG CHỈ TRONG MÀN CÀI ĐẶT.
       *
       * Lời gọi này có tác dụng phụ CỐ Ý: phía native, `trangThaiTheoDoiCuocGoi`
       * dựng lại service nếu bác đã chọn bật mà nó đã chết (ROM dọn nền, buộc
       * dừng app, broadcast khởi động bị chặn).
       *
       * Đặt nó trong `NhacCuocGoiDai` là chỉ chữa khi bác tình cờ đi vào đúng
       * màn Cài đặt thông báo — tức gần như không bao giờ. Ở đây thì mỗi lần
       * bác mở app là một lần service được dựng lại.
       */
      void trangThaiTheoDoiCuocGoi();

      const t = await trangThaiThuongTruc();
      if (huy || !t) return;   // null ⇒ bản web, không có gì để đồng bộ
      setPinnedNotification(t.dangHien);
      localStorage.setItem('pinnedNotification', String(t.dangHien));
      /*
       * Bác đã chọn bật mà nó không hiện ⇒ có thứ gì đó đang chặn. Nói ra, chứ
       * đừng lặng lẽ gạt công tắc về TẮT như thể bác chưa từng bật.
       */
      setLoiThongBaoNative(t.daChon && !t.dangHien ? 'BI_CHAN_SAU_KHI_BAT' : null);
    };

    void dongBo();
    const khiHien = () => { if (document.visibilityState === 'visible') void dongBo(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => { huy = true; document.removeEventListener('visibilitychange', khiHien); };
  }, []);
  const [historyItems, setHistoryItems] = useState<HistoryRecord[]>(() => {
    const saved = localStorage.getItem('khoan_da_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
    return DEFAULT_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('khoan_da_history', JSON.stringify(historyItems));
  }, [historyItems]);

  /**
   * Đường vào từ ngoài: `share_target` và các lối tắt của manifest.
   *
   * ⚠️ MỌI `url` KHAI TRONG `public/manifest.json` PHẢI CÓ NHÁNH XỬ LÝ Ở ĐÂY.
   * Lối tắt `/?view=guardian&tab=camera` từng không có nhánh nào: bác giữ biểu
   * tượng app, chọn "Quét ảnh màn hình", và app mở ra màn giới thiệu như thể
   * chưa bấm gì. Một lối tắt chết không báo lỗi — nó chỉ im lặng đi sai chỗ.
   *
   * Danh sách hợp lệ khai tường minh: `view` lạ thì bỏ qua, không `setView` một
   * chuỗi tuỳ ý lấy từ thanh địa chỉ.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const targetView = urlParams.get('view');
    const isChiaSe = urlParams.get('chia_se');
    const shareText = urlParams.get('text') || urlParams.get('title') || urlParams.get('url');

    const LOI_TAT_HOP_LE: Record<string, ViewState> = {
      hoi_nhanh: 'hoi_nhanh',
      guardian: 'guardian',
      learn: 'learn',
      search: 'search',
      history: 'history',
      family: 'family',
    };

    if (targetView === 'warning') {
      triggerEmergencyAlert();
    } else if (targetView && LOI_TAT_HOP_LE[targetView]) {
      setView(LOI_TAT_HOP_LE[targetView]);
    } else if (isChiaSe && shareText) {
      // Nội dung chia sẻ sang từ app khác (Zalo, tin nhắn…)
      handleAnalyze(shareText);
    }
  }, []);

  const [pinnedActionType, setPinnedActionType] = useState<'both' | 'app' | 'danger'>(() => {
    return (localStorage.getItem('pinnedActionType') as 'both' | 'app' | 'danger') || 'both';
  });

  const [userRole, setUserRole] = useState<'elder' | 'guardian'>(() => {
    const saved = localStorage.getItem('khoan_da_user_role');
    if (saved === 'elder' || saved === 'guardian') return saved;
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) return 'guardian';
    return 'elder';
  });

  const [isDesktopScreen, setIsDesktopScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('khoan_da_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isUltraZoomedOut] = useState<boolean>(false);

  const [showInAppBanner, setShowInAppBanner] = useState<boolean>(() => {
    return localStorage.getItem('showInAppBanner') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('showInAppBanner', String(showInAppBanner));
  }, [showInAppBanner]);

  useEffect(() => {
    localStorage.setItem('pinnedActionType', pinnedActionType);
  }, [pinnedActionType]);

  const sendRealNotification = async (type: 'both' | 'app' | 'danger' = pinnedActionType) => {
    if ('Notification' in window) {
      try {
        let perm = Notification.permission;
        if (perm !== 'granted') {
          perm = await Notification.requestPermission();
        }
        if (perm === 'granted') {
          const title = type === 'danger'
            ? '🚨 Khoan Đã: Cảnh giác khẩn cấp (SOS)'
            : type === 'app'
              ? '🛡️ Khoan Đã: Chạm để vào ứng dụng kiểm tra'
              : '🛡️ Khoan Đã: Trợ lý an toàn luôn túc trực';
          const body = type === 'danger'
            ? 'Bác nghi ngờ cuộc gọi hoặc bị giục chuyển tiền? Chạm vào đây để vào Cảnh giác an toàn 60s ngay!'
            : type === 'app'
              ? 'Chạm để mở ứng dụng Khoan Đã: quét ảnh, kiểm tra cuộc gọi và hỏi trợ lý AI.'
              : 'Thông báo thường trực: Chạm để vào ứng dụng kiểm tra hoặc kích hoạt cảnh giác khẩn cấp.';

          const noti = new Notification(title, {
            body,
            icon: '/logo.webp',
            badge: '/logo.webp',
            tag: 'khoan-da-ongoing-notification',
            requireInteraction: true,
            silent: false,
          });

          noti.onclick = (e) => {
            e.preventDefault();
            window.focus();
            if (type === 'danger') {
              triggerEmergencyAlert();
            } else {
              setView('home');
            }
            noti.close();
          };
        }
      } catch (e) {
        console.log('Notification API note:', e);
      }
    }
  };

  /**
   * ⚠️ CÔNG TẮC PHẢI THEO TRẠNG THÁI THẬT, KHÔNG THEO Ý MUỐN — §4.3.
   *
   * Bản trước lật công tắc rồi mới gửi, và không bao giờ đọc lại kết quả. Trong
   * APK điều đó hỏng nặng hơn ở web: WebView của Capacitor KHÔNG có Notification
   * API dùng được, nên `sendRealNotification` chạy xong êm ru mà thanh thông báo
   * trống trơn. Công tắc xanh, chữ ghi "Đang BẬT túc trực 24/7", và thực tế là
   * không có gì túc trực cả.
   *
   * Đó chính là dạng lỗi §4.3: không phải "không làm được" mà là "báo là làm
   * được trong khi không làm được". Bác tin có một lối tắt chờ sẵn lúc bị gọi
   * thúc — và lúc cần thì không có.
   *
   * Nay: APK đi đường native và ĐỌC LẠI `dangBat` mà lớp native trả về; công tắc
   * chỉ sáng khi Android xác nhận thông báo đã nằm trên thanh. Từ chối quyền là
   * một kết quả hợp lệ, không phải lỗi — công tắc ở lại TẮT.
   */
  const togglePinnedNotification = async () => {
    const next = !pinnedNotification;

    if (await laApk()) {
      const r = await datThongBaoThuongTruc(next);
      // `dangBat` là sự thật từ Android, không phải thứ vừa được yêu cầu.
      setPinnedNotification(r.dangBat);
      localStorage.setItem('pinnedNotification', String(r.dangBat));
      if (next && !r.dangBat) setLoiThongBaoNative(r.maLoi ?? 'CHUA_CO_QUYEN_THONG_BAO');
      else setLoiThongBaoNative(null);
      return;
    }

    setPinnedNotification(next);
    localStorage.setItem('pinnedNotification', String(next));
    if (next) {
      sendRealNotification(pinnedActionType);
    }
  };

  /**
   * ĐƯA CẢNH BÁO RA NGOÀI APP — hai lối, cùng một mức `CAO`.
   *
   * ⚠️ VÌ SAO CẦN CẢ HAI, KHÔNG PHẢI MỘT.
   *
   *  · Heads-up notification: chạy được ngay, không cần quyền đặc biệt nào
   *    ngoài POST_NOTIFICATIONS. Nhưng nó nằm ở thanh trên và tự ẩn sau vài
   *    giây — bác đang áp điện thoại vào tai thì không thấy.
   *  · Popup đè màn hình: thấy được kể cả khi bác đang trong cuộc gọi, nhưng
   *    cần `SYSTEM_ALERT_WINDOW` — một quyền phải tự vào Cài đặt bật, và phần
   *    lớn người dùng sẽ không bật.
   *
   * Nên: cái nào bật được thì chạy cái đó, không cái nào phụ thuộc cái nào.
   *
   * ⚠️ KHÔNG CÓ `await` NÀO Ở ĐÂY CHẶN ĐƯỜNG KIỂM (§6.7). Lượt phân tích đã
   * xong và màn kết quả đã hiện; hai lời gọi này chỉ là phần thêm ra ngoài. Một
   * cái hỏng, một cái treo, hay cả hai cùng chết — màn kết quả trong app vẫn
   * nguyên vẹn.
   */
  const canhBaoRaNgoaiApp = async () => {
    if (!(await laApk())) return;

    // Chữ đi từ catalog xuống — §11, lớp Java không tự soạn câu nào.
    void hienCanhBaoHeadsUp({
      tieuDe: tra(CHU_NATIVE, 'heads_up_tieu_de', lang) ?? '',
      noiDung: tra(CHU_NATIVE, 'heads_up_noi_dung', lang) ?? '',
    });

    /*
     * ⚠️ HỎI QUYỀN TRƯỚC, ĐỪNG GỌI RỒI BẮT LỖI. `hienPopupCanhBao` reject với
     * `CHUA_BAT_QUYEN_POPUP` khi chưa được cấp — bắt im rồi bỏ qua thì không ai
     * biết tính năng đang tắt. Hỏi trước để còn ghi lại được trạng thái thật.
     */
    if ((await quyenPopup()) !== 'da_bat') return;
    void hienPopupCanhBao({
      nhan: 'CAO',
      tieuDe: tra(CHU_NATIVE, 'popup_tieu_de', lang) ?? '',
      nutMo: tra(CHU_NATIVE, 'popup_nut_mo', lang) ?? '',
      nutOn: tra(CHU_NATIVE, 'popup_nut_on', lang) ?? '',
    });
  };

  const handleAnalyze = async (text: string, image?: string | null) => {
    if (!text.trim() && !image) return;
    setIsAnalyzing(true);
    let finalResult: any = null;

    try {
      const res = await fetch(api('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        /*
         * ⚠️ `tomTatChoMayChu` CHỨ KHÔNG PHẢI `mayCoUngDungLa`.
         * Hàm đó bỏ hết tên ứng dụng, chỉ còn ba con số. Nối thẳng biến kia vào
         * đây là gửi danh sách app của bác lên máy chủ — §6.9 cấm, và không ai
         * hỏi bác về chuyện đó.
         *
         * `undefined` khi chạy bản web ⇒ JSON.stringify bỏ trường này luôn, nên
         * backend biết là KHÔNG CÓ DỮ LIỆU chứ không phải "đã xem, máy sạch".
         */
        body: JSON.stringify({
          vanBan: text || '',
          anh: image || undefined,
          trangThaiMay: tomTatChoMayChu(mayCoUngDungLa),
        })
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      finalResult = { ...data, queryText: text, queryImage: image };
    } catch (err) {
      console.warn('Full AI route fallback to preliminary rule check:', err);
      try {
        const res2 = await fetch(api('/api/analyze/so-bo'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vanBan: text || '', anh: image || undefined })
        });
        const data2 = await res2.json();
        finalResult = { ...data2, queryText: text, queryImage: image };
      } catch (err2) {
        console.error(err2);
        /**
         * ⚠️ §4.3 — KHÔNG GỌI ĐƯỢC MÁY CHỦ THÌ NÓI ĐÚNG THẾ.
         *
         * Bản trước dựng ra một kết quả giả: `nhan: 'CAO'` kèm
         * `daKiem: ['van_ban','anh_ocr']` — tức KHẲNG ĐỊNH đã đọc văn bản và đã
         * đọc chữ trong ảnh, trong khi không một byte nào rời khỏi máy. Và
         * `maLyDo` để dạng chuỗi, trong khi §HĐ quy định `string[]`.
         *
         * Không có `nhan` ở đây là ĐÚNG: frontend không có quyền ra mức (§4.2).
         * Màn kết quả đọc `khongGoiDuocMayChu` và nói ra giới hạn đó.
         */
        finalResult = {
          khongGoiDuocMayChu: true,
          maLyDo: [],
          daKiem: [],
          chuaKiem: ['khong_goi_duoc_may_chu'],
          aiDaChay: false,
          queryText: text,
          queryImage: image,
        };
      }
    } finally {
      if (finalResult) {
        setAnalyzeResult(finalResult);
        /**
         * ⚠️ CHỈ MỨC `CAO` MỚI ĐƯỢC ĐÈ RA NGOÀI APP — và đây là ràng buộc an
         * toàn, không phải lựa chọn thẩm mỹ.
         *
         * Cho `NGHI_NGO` cũng đè popup + rung chuông thì bác học được đúng một
         * điều: vuốt bỏ cái dải đỏ đó. Đến lượt `CAO` thật — lúc có người đang
         * thúc chuyển tiền — bác cũng vuốt bỏ nốt, theo phản xạ đã được chính
         * app này dạy. §4.6: mỗi lần làm phiền sai là một lần bào mòn lần đúng.
         *
         * ⚠️ KHÔNG ĐỌC `canThiep` Ở ĐÂY. §HĐ luật 4: `canThiep` chọn MÀN HÌNH
         * bên trong app, `nhan` mới là mức rủi ro. Đây là quyết định "có làm
         * phiền ra ngoài app không" — nó đi theo mức, không theo màn hình.
         *
         * ⚠️ CẢ HAI ĐỀU IM LẶNG KHI KHÔNG PHẢI APK. `native.ts` trả về false
         * chứ không ném, nên bản web và PWA chạy qua đây không hề hấn gì.
         */
        if (finalResult.nhan === 'CAO') {
          /*
           * ⚠️ LƯU LẠI TRƯỚC KHI GỬI CẢNH BÁO RA NGOÀI.
           * Bấm heads-up có thể xảy ra sau khi app đã bị Android thu hồi bộ nhớ
           * — lúc đó `analyzeResult` trong React đã mất. Không lưu thì bác chạm
           * vào cảnh báo và nhận một màn hình trống, phải kiểm lại từ đầu đúng
           * lúc đang bị thúc.
           */
          try {
            localStorage.setItem('khoan_da_canh_bao_cao', JSON.stringify(finalResult));
          } catch {
            // Hết chỗ lưu (ảnh base64 lớn). Không sao — deep link rơi về trang
            // chủ, và §4.3 nói thà về trang chủ còn hơn dựng màn cảnh báo rỗng.
          }
          void canhBaoRaNgoaiApp();
        }
        /**
         * ⚠️ CHỈ GHI LỊCH SỬ KHI CÓ MỘT MỨC THẬT TỪ MÁY CHỦ.
         * Bản trước ghi `risk: finalResult.nhan || 'CAO'`, nên một lượt HỎNG
         * MẠNG cũng nằm lại trong lịch sử như một lượt "Nguy hiểm cao" đã kiểm.
         * Lịch sử là thứ người ta lật lại sau nhiều ngày — một dòng bịa ở đó
         * sống lâu hơn cả cái lỗi sinh ra nó.
         */
        if (finalResult.nhan) {
          const newHistItem: HistoryRecord = {
            id: Date.now(),
            title: text.trim() ? (text.length > 55 ? text.slice(0, 55) + '...' : text) : 'Ảnh chụp / Mã QR kiểm tra',
            type: image ? 'image' : text.toLowerCase().includes('gọi') ? 'call' : text.toLowerCase().includes('link') || text.toLowerCase().includes('http') ? 'link' : 'sms',
            risk: finalResult.nhan,
            date: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            saved: false,
            data: finalResult
          };
          setHistoryItems(prev => [newHistItem, ...prev.filter(item => item.id !== newHistItem.id)]);
        }
        setView('warning');
      }
      setIsAnalyzing(false);
    }
  };

  /**
   * ĐƯỜNG VÀO TỪ ANDROID: nút Chia sẻ, lối tắt giữ biểu tượng, và deep link của
   * chính thông báo cảnh báo.
   *
   * ⚠️ NGHE CẢ `visibilitychange`, KHÔNG CHỈ CHẠY MỘT LẦN LÚC DỰNG.
   * `launchMode="singleTask"` nghĩa là app đang chạy thì Android KHÔNG dựng lại
   * WebView — nó chỉ đưa cái đang có ra tiền cảnh. Chỉ đọc lúc dựng thì lần
   * chia sẻ THỨ HAI trở đi im lặng hoàn toàn: app hiện lên, không có gì xảy ra,
   * không lỗi. Người dùng kết luận là "lúc được lúc không", trong khi thật ra
   * nó hỏng đúng từ lần thứ hai.
   *
   * ⚠️ Ở BẢN WEB, `noiDungChiaSe()` trả `{ co: false }` và không ném — cùng một
   * mã nguồn chạy được ở cả ba nơi (§6.7).
   */
  useEffect(() => {
    let huy = false;

    const lay = async () => {
      if (!(await laApk())) return;

      /*
       * Bác đã ở trong app rồi thì dải popup đè màn hình không còn việc gì để
       * làm — để nguyên là che mất chính màn kết quả mà nó vừa gọi bác tới.
       */
      void anPopup();

      const d = await noiDungChiaSe();
      if (huy || !d.co) return;

      if (d.loiTat) {
        // Lối tắt là ĐIỀU HƯỚNG, không phải nội dung — không gửi đi phân tích.
        if (d.loiTat === 'canh-bao-dung-lai-60s' || d.loiTat === 'dung-lai-60s') {
          /*
           * §4.6 — chạm vào cảnh báo phải tới THẲNG màn Dừng 60s, không phải
           * trang chủ rồi tự tìm nút.
           */
          const daLuu = localStorage.getItem('khoan_da_canh_bao_cao');
          if (daLuu) {
            try {
              const kq = JSON.parse(daLuu);
              if (kq?.nhan === 'CAO') {
                setAnalyzeResult(kq);
                setView('warning');
                return;
              }
            } catch {
              localStorage.removeItem('khoan_da_canh_bao_cao');
            }
          }
          /*
           * ⚠️ KHÔNG DỰNG MÀN CẢNH BÁO VỚI DỮ LIỆU RỖNG — §4.3.
           * Không có kết quả lưu nghĩa là app đã bị đóng hẳn trước khi kịp lưu.
           * Hiện một màn "Nguy hiểm cao" trống là khẳng định một điều chưa hề
           * kiểm được. Về trang chủ, để bác kiểm lại.
           */
          setView('home');
          return;
        }
        setView(d.loiTat === 'dang-bi-goi' ? 'voice'
          : d.loiTat === 'goi-nguoi-than' ? 'family'
            : 'guardian');
        return;
      }

      /*
       * ⚠️ ẢNH HỎNG VẪN PHẢI GỬI ĐI — §4.3.
       * `maLoi` (ANH_QUA_LON / KHONG_DOC_DUOC_ANH) là thứ backend cần để đẩy
       * vào `chuaKiem`. Chặn ở đây là nuốt mất đúng thứ §4.3 sinh ra để nói:
       * bác chia sẻ một ảnh sang, app im lặng, và bác tưởng đã kiểm rồi.
       */
      if (d.vanBan || d.anh) {
        handleAnalyze(d.vanBan ?? '', d.anh ?? null);
      }
    };

    void lay();
    const khiHien = () => { if (document.visibilityState === 'visible') void lay(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => { huy = true; document.removeEventListener('visibilitychange', khiHien); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * AI ĐANG CHẠY Ở ĐÂU — §11 minh bạch.
   *
   * ⚠️ HỎI MÁY CHỦ, ĐỪNG ĐOÁN. Giao diện không có cách nào tự biết mô hình đang
   * chạy trên máy hay ở một trung tâm dữ liệu bên kia bán cầu; đoán rồi hiện ra
   * là lời khai sai về đúng thứ người dùng cần biết để quyết định có gõ nội dung
   * nhạy cảm vào hay không.
   *
   * Hỏng đường này thì để `null` và màn kết quả im lặng — thà không nói còn hơn
   * nói bừa (§4.3).
   */
  const [noiChayAi, setNoiChayAi] = useState<string | null>(null);

  useEffect(() => {
    let huy = false;
    fetch(api('/api/suc-khoe'))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!huy && d?.noiChay) setNoiChayAi(d.noiChay); })
      .catch(() => { /* không biết thì không nói */ });
    return () => { huy = true; };
  }, []);

  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'vi');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'normal');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFloatingBall, setShowFloatingBall] = useState(() => localStorage.getItem('showFloatingBall') !== 'false');
  const [isOutsideMode, setIsOutsideMode] = useState(false);
  const [familyMembers, setFamilyMembers] = useState(() => {
    const saved = localStorage.getItem('familyMembers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    /**
     * ⚠️ DANH SÁCH RỖNG. TRƯỚC ĐÂY Ở ĐÂY CÓ HAI NGƯỜI BỊA, KÈM SỐ ĐIỆN THOẠI THẬT.
     *
     * Bản trước dựng sẵn "Anh Nam (Con trai) — 0988888888" và "Chị Linh (Con
     * gái) — 0977777777" cho MỌI máy vừa cài app. Hai số đó là số thật của
     * người nào đó, và nút gọi chúng nằm ngay trang chủ, tên là "Gọi con cái".
     *
     * Hệ quả không phải là một danh sách mẫu trông cho đẹp. Nó là: một cụ đang
     * bị kẻ lừa đảo thúc, hoảng, bấm "Gọi con cái" — và máy quay số cho một
     * người lạ. Cụ tưởng đang gọi con mình. Người lạ nhận một cuộc gọi cầu cứu
     * từ người không quen. Không ai trong hai người hiểu chuyện gì đang xảy ra.
     *
     * ⚠️ ĐỪNG ĐẶT LẠI DỮ LIỆU MẪU Ở ĐÂY, kể cả số "trông có vẻ giả" như
     * 0000000000. Màn Vòng tròn gia đình đã có trạng thái rỗng tử tế, và một
     * danh sách rỗng là một lời khai TRUNG THỰC: bác chưa thêm ai cả.
     */
    return [];
  });

  /**
   * Nút "Dừng 60 giây" bác tự bấm.
   *
   * ⚠️ ĐÂY KHÔNG PHẢI MỘT KẾT QUẢ PHÂN TÍCH — bản trước đặt `nhan: 'CAO'` cho
   * nó, nên màn hình hiện "Nguy hiểm cao" về một nội dung chưa ai đọc, chỉ vì
   * bác bấm nút dừng. Mức rủi ro chỉ đến từ `decision-engine.js` (§4.2).
   *
   * `canThiep: 'PAUSE_60S'` là đúng vai: §HĐ luật 4 — `canThiep` quyết định MÀN
   * HÌNH, `nhan` quyết định NHÃN. Ở đây có màn, không có nhãn.
   */
  const triggerEmergencyAlert = () => {
    setAnalyzeResult({
      canThiep: 'PAUSE_60S',
      tuBamDung: true,
      maLyDo: [],
      daKiem: [],
      chuaKiem: [],
    });
    setView('warning');
  };

  useEffect(() => {
    localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
  }, [familyMembers]);

  useEffect(() => {
    const images = [
      "/logo.webp",
      "/minh-hoa-1.webp",
      "/minh-hoa-2.webp",
      "/minh-hoa-3.webp",
      "/minh-hoa-4.webp",
      "/minh-hoa-5.webp"
    ];
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  /**
   * §4.4 — BA BẬC CỠ CHỮ ĐI QUA THUỘC TÍNH, KHÔNG QUA INLINE STYLE.
   *
   * ⚠️ Bản cũ ghi `document.documentElement.style.fontSize`. Inline style thắng
   * mọi biểu định kiểu, kể cả `vung-cham-san.css` nạp sau cùng — nghĩa là cả hệ
   * bậc chữ và sàn 14px đều mất hiệu lực. Và bậc "nhỏ" đặt gốc 14px, thấp hơn
   * gốc 15px mà `--touch-target-primary` dựa vào, nên nút chính tụt dưới 56px.
   *
   * Giá trị thật của ba bậc nằm ở `src/index.css`, cạnh các token khác.
   */
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    const bac = fontSize === 'small' ? 'nho' : fontSize === 'large' ? 'lon' : 'vua';
    document.documentElement.setAttribute('data-bac-chu', bac);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('showFloatingBall', String(showFloatingBall));
  }, [showFloatingBall]);

  const t = (key: keyof typeof translations.vi) => translate(key, lang);

  return (
    <div className="w-full min-h-screen font-sans select-none bg-[#f8f4ff] md:bg-[#f0f9ff]">
      {/* Pinned Notification Banner (Active only if user enables in-app banner preview) */}
      {pinnedNotification && showInAppBanner && view !== 'notifications' && view !== 'intro' && view !== 'login' && view !== 'warning' && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-900 text-white px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-lg sticky top-0 z-[60] border-b border-purple-500/40 text-[14px] sm:text-sm font-medium select-none shrink-0"
        >
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
            <div className="truncate">
              <span className="font-extrabold text-white">🛡️ {t("Ghim cố định:")}</span>{' '}
              <span className="text-purple-200 hidden sm:inline">
                {pinnedActionType === 'app' 
                  ? t("Chạm để mở App ngay") 
                  : pinnedActionType === 'danger' 
                    ? t("Chạm để vào Cảnh giác nguy hiểm") 
                    : t("Luôn sẵn sàng vào App hoặc Cảnh giác 60s")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(pinnedActionType === 'both' || pinnedActionType === 'app') && (
              <button
                onClick={() => setView('home')}
                className="bg-white/20 hover:bg-white/30 text-white px-2.5 sm:px-3 py-1 rounded-xl font-bold text-[14px] sm:text-[14px] shadow-xs border border-white/20 flex items-center gap-1 active:scale-95 transition-transform"
                title={t("Vào màn hình chính")}
              >
                <Sparkles size={12} className="text-yellow-300" /> {t("Vào App")}
              </button>
            )}

            {(pinnedActionType === 'both' || pinnedActionType === 'danger') && (
              <button
                onClick={() => triggerEmergencyAlert()}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-2.5 sm:px-3 py-1 rounded-xl font-bold text-[14px] sm:text-[14px] shadow-sm border border-red-400 flex items-center gap-1 active:scale-95 transition-transform"
                title={t("Kích hoạt cảnh giác khẩn cấp")}
              >
                <ShieldAlert size={12} className="text-white animate-pulse" /> {t("Nguy hiểm (SOS)")}
              </button>
            )}

            <button aria-label={t("Cài đặt")}
              onClick={() => setView('notifications')}
              className="p-1 text-purple-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
              title={t("Tùy chỉnh thông báo cố định")}
            >
              <Settings size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading Overlay during AI Analysis */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 relative flex items-center justify-center mb-6">
            <div className="w-full h-full border-4 border-[#c084fc] border-t-transparent rounded-full animate-spin"></div>
            <ShieldCheck size={32} className="text-[#c084fc] absolute" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">{t("Khoan Đã đang đọc dữ liệu...")}</h3>
          <p className="text-purple-200 text-sm max-w-xs font-medium">{t("Hệ thống AI và bộ luật bảo vệ đang trích xuất tín hiệu, nhận diện dấu hiệu lừa đảo và kiểm tra an toàn cho bác.")}</p>
        </div>
      )}

      {/* MOBILE & TABLET & NORMAL ELDER MODE */}
      {!((isDesktopScreen && userRole !== 'elder') || userRole === 'guardian' || isUltraZoomedOut) ? (
        <div className="flex w-full h-[100dvh] max-h-[100dvh] flex-col relative overflow-hidden bg-[#f8f4ff] select-none touch-none overscroll-none
          md:max-w-3xl md:mx-auto md:my-auto md:h-[96vh] md:max-h-[1000px] md:rounded-[2.5rem] md:shadow-[0_25px_60px_rgba(76,29,149,0.18)] md:border-2 md:border-purple-200/80
          lg:max-w-none lg:mx-0 lg:my-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:rounded-none lg:border-0 lg:shadow-none">
          {/* Background ambient lighting */}
          <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-white opacity-60 rounded-full blur-3xl pointer-events-none select-none"></div>
          <div className="absolute bottom-1/4 right-[-20%] w-80 h-80 bg-[#d8b4fe] opacity-30 rounded-full blur-[80px] pointer-events-none select-none"></div>
          
          <AnimatePresence mode="wait">
            {view === 'intro' && <IntroView setView={setView} t={t} setUserRole={setUserRole} />}
            {view === 'home' && (
              <HomeView 
                setView={setView} 
                t={t} 
                onAnalyze={handleAnalyze} 
                isAnalyzing={isAnalyzing} 
                pinnedNotification={pinnedNotification} 
                togglePinnedNotification={togglePinnedNotification}
                onOpenMenu={() => setIsMenuOpen(true)}
                familyMembers={familyMembers}
                onTriggerEmergency={triggerEmergencyAlert}
              />
            )}
            {view === 'voice' && <VoiceView setView={setView} t={t} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />}
            {view === 'search' && <SearchView setView={setView} t={t} lang={lang} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />}
            {view === 'history' && <HistoryView setView={setView} t={t} lang={lang} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} historyItems={historyItems} setHistoryItems={setHistoryItems} setAnalyzeResult={setAnalyzeResult} />}
            {view === 'profile' && <ProfileView setView={setView} t={t} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}
            {view === 'family' && <FamilyView setView={setView} t={t} lang={lang} isLoggedIn={isLoggedIn} familyMembers={familyMembers} setFamilyMembers={setFamilyMembers} />}
            {view === 'learn' && <KhungTaiTre t={t}><LearnView setView={setView} t={t} lang={lang} onTriggerEmergency={triggerEmergencyAlert} /></KhungTaiTre>}
            {view === 'login' && <LoginView setView={setView} t={t} setIsLoggedIn={setIsLoggedIn} userRole={userRole} setUserRole={setUserRole} />}
            {view === 'add_family' && <AddFamilyView setView={setView} t={t} setFamilyMembers={setFamilyMembers} />}
            {view === 'mat_khau_gia_dinh' && <MatKhauGiaDinh setView={setView} t={t} />}
            {view === 'warning' && <WarningView setView={setView} t={t} lang={lang} result={analyzeResult} familyMembers={familyMembers} noiChayAi={noiChayAi} mayCoUngDungLa={mayCoUngDungLa} />}
            {view === 'guardian' && <GuardianView setView={setView} t={t} lang={lang} setUserRole={setUserRole} isDesktop={false} isLoggedIn={isLoggedIn} onAnalyze={handleAnalyze} familyMembers={familyMembers} onTriggerEmergency={triggerEmergencyAlert} />}
            {view === 'account' && <AccountView setView={setView} t={t} setIsLoggedIn={setIsLoggedIn} />}
            {view === 'privacy' && <PrivacyView setView={setView} t={t} />}
            {view === 'notifications' && (
              <NotificationsView 
                setView={setView} 
                t={t} 
                pinnedNotification={pinnedNotification} 
                togglePinnedNotification={togglePinnedNotification}
                pinnedActionType={pinnedActionType}
                setPinnedActionType={setPinnedActionType}
                onTriggerEmergency={triggerEmergencyAlert}
                onSendTestNotification={() => sendRealNotification(pinnedActionType)}
                loiThongBaoNative={loiThongBaoNative}
                dangChayApk={dangChayApk}
                onAnalyzeText={(txt) => handleAnalyze(txt)}
                lang={lang}
                showInAppBanner={showInAppBanner}
                setShowInAppBanner={setShowInAppBanner}
              />
            )}
            {view === 'device_data' && <DeviceDataView setView={setView} t={t} />}
            {view === 'hoi_nhanh' && <HoiNhanhView setView={setView} t={t} lang={lang} onTriggerEmergency={triggerEmergencyAlert} />}
            {view === 'settings' && (
              <SettingsView 
                setView={setView} 
                t={t} 
                lang={lang} 
                setLang={setLang} 
                fontSize={fontSize} 
                setFontSize={setFontSize} 
                isLoggedIn={isLoggedIn} 
                setIsLoggedIn={setIsLoggedIn} 
                pinnedNotification={pinnedNotification} 
                togglePinnedNotification={togglePinnedNotification}
                showFloatingBall={showFloatingBall}
                setShowFloatingBall={setShowFloatingBall}
                onOpenOutsideMode={() => setIsOutsideMode(true)}
              />
            )}
          </AnimatePresence>

          {/* Bottom Nav */}
          <AnimatePresence>
            {['home', 'search', 'history', 'family', 'profile'].includes(view) && (
              <motion.div
                /*
                  ⚠️ HIỆU ỨNG TRƯỢT CHỈ DÀNH CHO ĐIỆN THOẠI.
                  `y: 100` là "trượt lên từ đáy màn" — hợp lý với thanh nổi ở
                  dưới, vô nghĩa với thanh cố định ở đỉnh. Đo được trên máy tính:
                  thanh bị đẩy xuống 100px so với chỗ đáng ra nó phải nằm, vì
                  transform chưa về 0.

                  Đây là dạng nhẹ của bẫy đã ghi trong dự án: hiệu ứng không được
                  quyết định VỊ TRÍ hay việc nội dung có hiện hay không. Nó chỉ
                  được làm đẹp thêm cho thứ vốn đã đúng chỗ.
                */
                initial={isDesktopScreen ? false : { y: 100 }}
                animate={{ y: 0 }}
                exit={isDesktopScreen ? undefined : { y: 100 }}
                /*
                  ⚠️ HAI HÌNH DẠNG CHO HAI KHỔ MÀN.
                  Điện thoại: thanh nổi ở đáy, đúng tầm ngón cái.
                  Máy tính: thanh ngang bo tròn ở TRÊN CÙNG. Thanh nổi ở đáy trên
                  màn rộng vừa che mất phần dưới nội dung (lớp gradient phủ lên),
                  vừa bắt mắt phải đi từ giữa màn xuống tận đáy mỗi lần đổi mục —
                  còn trên máy tính thì chỗ người ta nhìn đầu tiên là đỉnh màn.
                */
                className="absolute bottom-0 left-0 w-full px-4 pb-6 pt-10 bg-gradient-to-t from-[#cfb8f8] via-[#e2d2f9]/80 to-transparent z-50 pointer-events-none
                  lg:static lg:order-first lg:w-full lg:h-auto lg:shrink-0 lg:px-8 lg:pt-5 lg:pb-3 lg:bg-none"
              >
                <div className="bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] rounded-full p-[6px] px-3 sm:px-4 flex justify-between items-center shadow-[0_15px_30px_rgba(90,30,160,0.3)] border border-white/20 h-16 sm:h-18 max-w-lg sm:max-w-xl mx-auto relative overflow-hidden pointer-events-auto
                  lg:justify-center lg:gap-2 lg:h-[4.25rem] lg:max-w-3xl lg:rounded-full lg:px-3 lg:shadow-[0_10px_28px_rgba(90,30,160,0.22)]">
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>
                  
                  {[
                    { id: 'home', icon: Home, label: t("Trang chủ") },
                    { id: 'search', icon: Search, label: t("Tìm kiếm") },
                    { id: 'history', icon: ShieldAlert, label: t("Lịch sử") },
                    { id: 'family', icon: BookOpen, label: t("Gia đình") },
                    { id: 'profile', icon: User, label: t("Hồ sơ") }
                  ].map(item => {
                    const isActive = view === item.id;
                    const Icon = item.icon;
                    return (
                      <button 
                        key={item.id}
                        onClick={() => setView(item.id as ViewState)} 
                        className={`relative z-10 transition-all duration-300 flex items-center justify-center rounded-full active:scale-95
                          lg:rounded-full lg:px-5 lg:h-[3.4rem] lg:gap-2.5 lg:w-auto ${
                          isActive
                            ? 'bg-white/25 shadow-[0_0_20px_rgba(255,255,255,0.4)] text-white px-3.5 sm:px-4 h-[3.25rem] sm:h-[3.6rem] lg:bg-white lg:text-[#6d28d9] lg:shadow-md'
                            : 'text-white/70 hover:text-white w-[3.25rem] h-[3.25rem] sm:w-[3.6rem] sm:h-[3.6rem] lg:text-white/85 lg:hover:bg-white/20 lg:w-auto'
                        }`}
                      >
                        <Icon size={24} fill={isActive && item.id !== 'search' ? "currentColor" : "none"} strokeWidth={isActive ? 2 : 2} />
                        {/*
                          Trên máy tính nhãn hiện thường trực — có chỗ, và người
                          cao tuổi đọc chữ nhanh hơn đoán biểu tượng. Trên điện
                          thoại mới cần giấu để vừa bề ngang.
                        */}
                        <span className="hidden lg:inline font-bold text-[15px]">{item.label}</span>
                        <AnimatePresence>
                          {isActive && (
                            <motion.span
                              initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                              animate={{ width: 'auto', opacity: 1, marginLeft: 6 }}
                              exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                              className="lg:hidden font-bold text-[14px] whitespace-nowrap overflow-hidden"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* DESKTOP GUARDIAN DASHBOARD (Optimized for Child / Guardian) */
        <div className="flex w-full min-h-screen relative flex-col bg-slate-50">
           {/* Desktop Topbar for Guardian */}
           <header className="flex items-center justify-between px-6 lg:px-12 py-3.5 relative z-20 bg-white border-b border-slate-200/80 shadow-2xs sticky top-0">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm text-white">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div>
                    <h1 className="font-black text-lg text-slate-900 leading-tight flex items-center gap-2">
                      Khoan Đã <span className="text-sky-700 text-[14px] font-extrabold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">Guardian</span>
                    </h1>
                    <p className="text-[14px] text-slate-500 font-medium">{t("Bảng điều khiển an toàn dành cho con cháu")}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => {
                     setUserRole('elder');
                     setView('home');
                   }} 
                   className="flex items-center gap-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-1.5 rounded-xl font-bold text-[14px] transition-colors shadow-2xs"
                 >
                   <Smartphone className="w-3.5 h-3.5" /> {t("Chuyển sang vai Bác (Người già)")}
                 </button>
                 <button onClick={() => setIsMenuOpen(true)} className="flex items-center gap-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl font-bold text-[14px] transition-colors">
                   <LayoutGrid className="w-3.5 h-3.5" /> {t("Menu")}
                 </button>
                 <button onClick={() => { if(isLoggedIn) { setIsLoggedIn(false); setView('login'); } else { setView('login'); } }} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-xl font-bold text-[14px] shadow-xs transition-opacity">
                   {isLoggedIn ? <><LogOut className="w-3.5 h-3.5" /> {t("Đăng xuất")}</> : <><UserCircle className="w-3.5 h-3.5" /> {t("Đăng nhập")}</>}
                 </button>
              </div>
           </header>

           {/* Render Guardian Views on Desktop */}
           <AnimatePresence mode="wait">
              {view === 'intro' && <GuardianIntroView setView={setView} setUserRole={setUserRole} />}
              {view === 'login' && <GuardianAuthView setView={setView} setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />}
              {view === 'hoi_nhanh' && <HoiNhanhView setView={setView} t={t} lang={lang} onTriggerEmergency={triggerEmergencyAlert} />}
              {view === 'learn' && <KhungTaiTre t={t}><LearnView setView={setView} t={t} lang={lang} onTriggerEmergency={triggerEmergencyAlert} /></KhungTaiTre>}
              {view !== 'intro' && view !== 'login' && view !== 'hoi_nhanh' && view !== 'learn' && (
                <GuardianView
                  setView={setView}
                  t={t}
                  lang={lang}
                  setUserRole={setUserRole}
                  isDesktop={true}
                  isLoggedIn={isLoggedIn}
                  onAnalyze={handleAnalyze}
                  familyMembers={familyMembers}
                  onTriggerEmergency={triggerEmergencyAlert}
                />
              )}
           </AnimatePresence>
        </div>
      )}

      {/* Full App Menu & Quick Launcher Modal */}
      <AppMenuModal 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        setView={setView}
        t={t}
        pinnedNotification={pinnedNotification}
        togglePinnedNotification={togglePinnedNotification}
        familyMembers={familyMembers}
        onTriggerEmergency={triggerEmergencyAlert}
        onOpenOutsideMode={() => setIsOutsideMode(true)}
        showFloatingBall={showFloatingBall}
        setShowFloatingBall={setShowFloatingBall}
      />

      {/*
        ⚠️ NÚT NỔI PHẢI BIẾN MẤT KHI CÓ HỘP THOẠI ĐANG MỞ.

        Nó nổi trên mọi thứ theo đúng thiết kế, nên ở màn giới thiệu và màn chọn
        vai trò nó đè lên chính hộp thoại đang hỏi bác một câu — và câu trả lời
        nằm ngay dưới nó. Người dùng báo 19/8/2026 kèm ảnh chụp.

        Lý do sâu hơn để ẩn, không chỉ để dời chỗ: nút này là lối tắt QUÉT NHANH.
        Ở màn chưa chọn xong vai trò thì chưa có gì để quét, và ở màn menu thì đã
        có sẵn mục quét trong danh sách. Một nút không làm được việc gì mà vẫn
        nằm chắn đường là thứ khiến bác chạm nhầm rồi lạc.
      */}
      {view !== 'intro' && view !== 'login' && !isMenuOpen && (
      <FloatingQuickAccess
        setView={setView}
        t={t}
        onAnalyze={handleAnalyze}
        onTriggerEmergency={triggerEmergencyAlert}
        familyMembers={familyMembers}
        isOutsideMode={isOutsideMode}
        setIsOutsideMode={setIsOutsideMode}
        showFloatingBall={showFloatingBall}
        setShowFloatingBall={setShowFloatingBall}
      />
      )}
    </div>
  );
}

// --- Home View ---
function HomeView({ 
  setView, 
  t, 
  onAnalyze, 
  isAnalyzing,
  pinnedNotification,
  togglePinnedNotification,
  onOpenMenu,
  familyMembers,
  onTriggerEmergency
}: { 
  setView: (v: ViewState) => void, 
  t: any, 
  onAnalyze?: (text: string, image?: string | null) => void,
  isAnalyzing?: boolean,
  pinnedNotification?: boolean,
  togglePinnedNotification?: () => void,
  onOpenMenu?: () => void,
  familyMembers?: any[],
  onTriggerEmergency?: () => void
}) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showQuickCallModal, setShowQuickCallModal] = useState(false);
  const fileInputRefMobile = useRef<HTMLInputElement>(null);
  const fileInputRefDesktop = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitAnalysis = () => {
    if ((inputText.trim() || selectedImage) && onAnalyze) {
      onAnalyze(inputText, selectedImage);
    } else if (inputText.trim() || selectedImage) {
      setView('warning');
    }
  };

  const handleCallFamily = () => {
    if (familyMembers && familyMembers.length > 0) {
      setShowQuickCallModal(true);
    } else {
      setView('family');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col w-full relative z-10 pt-2 sm:pt-4 md:pt-16 pb-20 md:pb-12 md:overflow-y-auto overflow-hidden justify-between h-full select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-0 md:px-12"
    >
      {/* Hidden file inputs */}
      <input 
        id="mobile-image-upload"
        type="file"
        hidden 
        ref={fileInputRefMobile} 
        accept="image/*" 
        onChange={handleImageChange} 
      />
      <input 
        type="file"
        hidden 
        ref={fileInputRefDesktop} 
        accept="image/*" 
        onChange={handleImageChange} 
      />

      {/* Mobile & Tablet Top Header with Menu and Actions */}
      {/*
        ⚠️ TRÊN MÁY TÍNH HAI NÚT NÀY RA SÁT HAI MÉP.
        `max-w-2xl mx-auto` kẹp cả hàng vào giữa 672px, nên trên màn rộng "Menu
        tác vụ" và "Ghim tin" dồn vào nhau giữa màn — trông như hai nút rời rạc
        thả giữa khoảng trống. Ở khổ điện thoại thì kẹp là đúng, nên chỉ nới từ
        `lg` trở lên.
      */}
      <div className="pt-2 sm:pt-4 px-4 sm:px-6 lg:px-8 z-50 flex items-center justify-between pointer-events-auto shrink-0 select-none max-w-2xl lg:max-w-none mx-auto w-full">
        <button 
          onClick={onOpenMenu}
          className="p-2 sm:p-2.5 px-3.5 sm:px-5 bg-white/90 hover:bg-white rounded-2xl shadow-sm backdrop-blur-md active:scale-95 transition-all text-[#6d28d9] flex items-center gap-2 border border-purple-200"
          title={t("Menu tính năng & Truy cập nhanh")}
        >
          <LayoutGrid size={18} strokeWidth={2.5} className="text-[#6d28d9]" />
          <span className="text-[14px] sm:text-sm font-black text-[#5b21b6]">{t("Menu tác vụ")}</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button 
            onClick={togglePinnedNotification} 
            title={t("Bật/Tắt ghim thông báo cảnh giác")}
            className={`p-2 sm:p-2.5 px-3 rounded-2xl shadow-sm backdrop-blur-md active:scale-95 transition-all flex items-center gap-1.5 ${pinnedNotification ? 'bg-red-500 text-white animate-pulse' : 'bg-white/80 text-[#6d28d9] border border-purple-100'}`}
          >
            <Bell size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline text-[14px] font-bold">{pinnedNotification ? t("Đang ghim") : t("Ghim tin")}</span>
          </button>
          <button aria-label={t("Cài đặt")} onClick={() => setView('settings')} className="p-2 sm:p-2.5 bg-white/80 hover:bg-white rounded-2xl shadow-sm backdrop-blur-md active:scale-95 transition-all text-[#6d28d9] border border-purple-100">
            <Settings size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3 mb-0.5 shrink-0 select-none">
        <img src="/logo.webp" alt="Khoan Đã Logo" draggable={false} className="h-7 w-7 sm:h-9 sm:w-9 object-contain drop-shadow-sm rounded-xl pointer-events-none select-none" />
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#321379] tracking-tight">{t("Khoan Đã")}</h1>
      </div>

      {/*
        ⚠️ HAI TIÊU ĐỀ, MỖI KHỔ MÀN MỘT CÁI — VÀ CÁI NÀY TỪNG THIẾU `md:hidden`.
        Hệ quả trên máy tính: hiện CẢ HAI, thành ra hỏi hai lần cùng một câu
        ("Hãy kể tình huống của Bác" rồi "Bác đang cần kiểm tra điều gì?").
        Người cao tuổi đọc chậm, và hai câu hỏi chồng nhau làm họ dừng lại tìm
        xem phải trả lời cái nào.
      */}
      <h2 className="md:hidden text-center text-[1.85rem] sm:text-3xl leading-[1.18] font-black text-[#2e1065] px-4 shrink-0 select-none" dangerouslySetInnerHTML={{__html: t("Hãy kể tình huống<br />của Bác")}}></h2>
      
      <div className="hidden md:flex flex-col items-center text-center mb-8 relative z-20">
         <h2 className="text-5xl font-black text-[#2e1065] tracking-tight mb-4">{t("Bác đang cần kiểm tra điều gì?")}</h2>
         {/*
           ⚠️ DÒNG PHỤ ĐỀ ĐÃ BỎ — 19/8/2026, và có hai lý do chứ không phải một.

           Thẩm mỹ: nó lặp lại đúng ý câu hỏi ngay phía trên, và trên máy tính
           nó đẩy khối nhập xuống thấp.

           §11: nó kết thúc bằng "giúp bác NHẬN DIỆN AN TOÀN" — một lời hứa app
           không giữ được. App chỉ nói *chưa thấy dấu hiệu trong thứ bác đưa*, và
           câu chữ ở màn chính không được mạnh hơn câu chữ ở màn kết quả.
         */}
      </div>

      {/*
        HAI KHOI NHAP DESKTOP DA GO — 19/8/2026, theo anh chup ban cong khai.

        Man chinh tung dung CA HAI duong nhap cung luc tren may tinh:
          - o lon "Hay ke tinh huong... / Tai anh len / Phan tich ngay" + 5 nut nhanh
          - khoi linh vat + ba nut tron (Khan cap - Cham de noi - Goi con cai) + o chat

        Hai khoi lam dung mot viec, nen khoi duoi bi day xuong va DE LEN ba the
        tin o cuoi trang. Voi nguoi cao tuoi, hai o nhap canh nhau con te hon
        chuyen de: ho dung lai de chon xem phai go vao dau.

        Giu khoi linh vat vi no moi la thu dac trung cua app - ba nut tron to, co
        nhan chu, va nut giua la NOI chu khong phai go. O lon kia chi la mot thanh
        tim kiem nhu moi trang web khac.
      */}
      {/* Desktop News Section */}
      <div className="hidden md:flex flex-col relative z-20 max-w-5xl mx-auto w-full md:order-3 md:mt-10">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#7e22ce]" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-[#2e1065]">{t("Cập nhật thông tin")}</h3>
                  <p className="text-[15px] text-[#4b5563] leading-snug">{t("Cảnh báo và kiến thức giúp bác phòng tránh lừa đảo hiệu quả.")}</p>
               </div>
            </div>
            <button onClick={() => setView('learn')} className="flex items-center gap-1 text-sm font-semibold text-[#7e22ce] bg-white px-4 py-2 rounded-full shadow-sm hover:bg-gray-50">
               {t("Xem tất cả")} <ChevronRight className="w-4 h-4" />
            </button>
         </div>

         <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-white/50 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setView('learn')}>
               <div className="inline-block px-3 py-1 bg-red-50 text-red-600 font-bold text-[14px] rounded-full mb-4">{t("Cảnh báo")}</div>
               <h4 className="text-lg font-bold text-[#2e1065] mb-2 leading-tight group-hover:text-[#7e22ce] transition-colors">{t("Chiêu giả danh công an yêu cầu chuyển tiền")}</h4>
               <p className="text-sm text-[#6b7280] line-clamp-3 mb-6">{t("Các đối tượng mạo danh cơ quan chức năng, gây áp lực yêu cầu chuyển tiền để 'xác minh'.")}</p>
               <div className="flex items-center text-sm font-bold text-[#7e22ce] mt-auto">
                  {t("Xem chi tiết")} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
               <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 pointer-events-none">
                 <ShieldAlert className="w-full h-full text-red-500" />
               </div>
            </div>
            
            <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-white/50 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setView('learn')}>
               <div className="inline-block px-3 py-1 bg-orange-50 text-orange-600 font-bold text-[14px] rounded-full mb-4">{t("Thủ đoạn mới")}</div>
               <h4 className="text-lg font-bold text-[#2e1065] mb-2 leading-tight group-hover:text-[#7e22ce] transition-colors">{t("Link nhận quà khuyến mãi đánh cắp tài khoản")}</h4>
               <p className="text-sm text-[#6b7280] line-clamp-3 mb-6">{t("Đường link giả mạo trang uy tín, đánh cắp thông tin đăng nhập và chiếm quyền tài khoản.")}</p>
               <div className="flex items-center text-sm font-bold text-[#7e22ce] mt-auto">
                  {t("Xem chi tiết")} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
               <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 pointer-events-none">
                 <svg className="w-full h-full text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
               </div>
            </div>
            
            <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-white/50 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setView('learn')}>
               <div className="inline-block px-3 py-1 bg-green-50 text-green-600 font-bold text-[14px] rounded-full mb-4">{t("Mới")}</div>
               <h4 className="text-lg font-bold text-[#2e1065] mb-2 leading-tight group-hover:text-[#7e22ce] transition-colors">{t("Mạo danh người thân nhắn vay gấp")}</h4>
               <p className="text-sm text-[#6b7280] line-clamp-3 mb-6">{t("Kẻ gian chiếm tài khoản mạng xã hội, nhắn tin vay tiền người thân, bạn bè.")}</p>
               <div className="flex items-center text-sm font-bold text-[#7e22ce] mt-auto">
                  {t("Xem chi tiết")} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
               <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 pointer-events-none">
                 <User className="w-full h-full text-green-500" />
               </div>
            </div>
         </div>
      </div>


      {/* Mobile & Tablet Mascot Area - LARGER MASCOT */}
      <div className="relative flex-1 w-full flex items-center justify-center z-10 my-auto min-h-0 select-none pointer-events-none px-4 md:order-1 md:flex-none md:my-2">
        <motion.div 
          animate={{ y: [-6, 6, -6] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          className="relative w-full max-w-[380px] sm:max-w-[440px] md:max-w-[500px] max-h-[40vh] sm:max-h-[44vh] cursor-pointer active:scale-95 transition-transform flex items-center justify-center pointer-events-auto select-none"
          onClick={() => setView('voice')}
        >
          <img 
            src="/minh-hoa-1.webp" 
            alt="Mascot" 
            draggable={false}
            className="w-full h-auto max-h-[38vh] sm:max-h-[42vh] object-contain drop-shadow-2xl relative z-10 scale-135 sm:scale-140 md:scale-145 pointer-events-none select-none"
          />
        </motion.div>
      </div>

      {/* Mobile & Tablet Input Area & Action Task Controls */}
      <div className="flex flex-col items-center w-full z-20 mt-auto shrink-0 select-none max-w-2xl mx-auto md:order-2 md:mt-0">
        {/* Action Buttons Row: Emergency | Mic | Call Family - LARGER & TOUCH FRIENDLY */}
        <div className="relative flex items-center justify-center gap-5 sm:gap-8 md:gap-10 w-full mb-3.5 sm:mb-4 px-4">
          {/* Emergency Button (Left) */}
          <button 
            type="button"
            onClick={() => onTriggerEmergency?.()}
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform group pointer-events-auto select-none"
            title={t("Kích hoạt cảnh giác khẩn cấp")}
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full bg-gradient-to-b from-[#f87171] via-[#ef4444] to-[#dc2626] border-[3px] border-white/90 shadow-[0_8px_20px_rgba(239,68,68,0.4),inset_0_2px_6px_rgba(255,255,255,0.7)] flex items-center justify-center text-white overflow-hidden group-hover:scale-105 transition-transform">
              <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent rounded-t-full pointer-events-none"></div>
              <ShieldAlert size={28} className="text-white relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform sm:w-8 sm:h-8" />
            </div>
            <span className="text-[#b91c1c] font-black text-[14px] sm:text-sm md:text-base tracking-tight whitespace-nowrap drop-shadow-2xs">
              {t("Khẩn cấp")}
            </span>
          </button>

          {/* Center Mic Button - BIG & PROMINENT */}
          <div className="relative flex flex-col items-center">
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#c084fc]/35 blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            ></motion.div>
            
            <button 
              onClick={() => setView('voice')} 
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-b from-[#b886f8] via-[#8c52f4] to-[#6724d5] border-[3.5px] border-white/90 shadow-[0_10px_25px_rgba(90,30,160,0.35),inset_0_4px_10px_rgba(255,255,255,0.8)] flex flex-col items-center justify-center active:scale-95 transition-transform group overflow-hidden pointer-events-auto"
            >
              <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-white/45 to-transparent rounded-t-full pointer-events-none"></div>
              <div className="text-white mb-1 relative z-10 drop-shadow-md">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="currentColor"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                  <line x1="8" x2="16" y1="22" y2="22"/>
                </svg>
              </div>
              
              <div className="flex items-center justify-center gap-[3px] h-3 mb-1 relative z-10">
                {[0.4, 0.8, 0.5, 1, 0.6].map((val, i) => (
                  <motion.div
                    key={i}
                    className="w-[2.5px] sm:w-[3px] bg-white rounded-full opacity-95"
                    animate={{ height: `${val * 9}px` }}
                    transition={{ repeat: Infinity, duration: 1 + i * 0.1, ease: "easeInOut" }}
                  />
                ))}
              </div>
              <span className="text-white font-black text-[14px] sm:text-sm md:text-base tracking-wide relative z-10 drop-shadow-md">{t("Chạm để nói")}</span>
            </button>
          </div>

          {/* Call Family Button (Right) */}
          <button 
            type="button"
            onClick={handleCallFamily}
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform group pointer-events-auto select-none"
            title={t("Gọi điện cho con cái")}
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full bg-gradient-to-b from-[#4ade80] via-[#22c55e] to-[#16a34a] border-[3px] border-white/90 shadow-[0_8px_20px_rgba(34,197,94,0.4),inset_0_2px_6px_rgba(255,255,255,0.7)] flex items-center justify-center text-white overflow-hidden group-hover:scale-105 transition-transform">
              <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent rounded-t-full pointer-events-none"></div>
              <PhoneCall size={26} className="text-white relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform sm:w-7 sm:h-7" />
            </div>
            <span className="text-[#15803d] font-black text-[14px] sm:text-sm md:text-base tracking-tight whitespace-nowrap drop-shadow-2xs">
              {t("Gọi con cái")}
            </span>
          </button>
        </div>

        {/* Selected image preview on mobile & tablet */}
        {selectedImage && (
          <div className="w-full px-4 sm:px-6 mb-2 pointer-events-auto">
            <div className="flex items-center gap-3 p-2 bg-purple-100/90 backdrop-blur-md rounded-2xl border border-purple-300">
              <img src={selectedImage} alt="Preview" draggable={false} className="w-11 h-11 sm:w-12 sm:h-12 object-cover rounded-xl border border-purple-400 shrink-0 select-none" />
              <div className="flex-1 overflow-hidden">
                <p className="text-[14px] sm:text-sm font-bold text-purple-900 truncate">{t("Ảnh đã sẵn sàng kiểm tra")}</p>
                <p className="text-[14px] sm:text-[14px] text-purple-700 truncate">{t("Bấm nút gửi tím để AI phân tích")}</p>
              </div>
              <button aria-label={t("Đóng")} 
                onClick={() => setSelectedImage(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded-full text-purple-700 shadow-sm shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Text and Image Input Area */}
        <div className="w-full px-4 sm:px-6 mb-2 sm:mb-3 pointer-events-auto">
          <div className="relative flex items-center bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 pl-3 pr-2 shadow-sm border border-purple-200 focus-within:ring-3 ring-[#c084fc]/50 transition-all">
             <button 
               type="button"
               onClick={() => fileInputRefMobile.current?.click()}
               className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl sm:rounded-2xl transition-colors shrink-0 ${selectedImage ? 'bg-[#7e22ce] text-white shadow-xs' : 'text-[#6d28d9] hover:bg-[#f3e8ff]'}`}
               title={t("Chọn ảnh tình huống")}
             >
               <ImageIcon size={20} className="sm:w-6 sm:h-6" />
             </button>
             <input 
                 type="text" 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder={t("Nhập hoặc bấm máy ảnh gửi hình...")} 
                 className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[#311068] placeholder:text-[#311068]/60 font-semibold text-[14px] sm:text-sm md:text-base"
                 onKeyDown={(e) => { if(e.key === 'Enter') submitAnalysis(); }}
              />
             <button 
               onClick={submitAnalysis} 
               disabled={isAnalyzing}
               className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#d8b4fe] flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform shrink-0 disabled:opacity-50"
             >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" x2="11" y1="2" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
             </button>
          </div>
        </div>
      </div>

      {/* Quick Call Family Modal */}
      <AnimatePresence>
        {showQuickCallModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm pointer-events-auto select-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-purple-100 flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#2e1065] text-base leading-tight">{t("Gọi nhanh cho con cái")}</h3>
                    <p className="text-[14px] text-gray-500 font-medium">{t("Bác hãy chạm để gọi trực tiếp")}</p>
                  </div>
                </div>
                <button aria-label={t("Đóng")} 
                  onClick={() => setShowQuickCallModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto py-1">
                {familyMembers && familyMembers.length > 0 ? (
                  familyMembers.map((member: any) => (
                    <a
                      key={member.id}
                      href={`tel:${member.phone}`}
                      className="flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-50 to-green-50/50 hover:from-purple-100 hover:to-green-100/70 border border-purple-100 rounded-2xl active:scale-[0.98] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {/*
                          ⚠️ ẢNH ĐẠI DIỆN KHÔNG TẢI TỪ MÁY CHỦ LẠ.
                          Mỗi ảnh từ unsplash.com là một lượt gọi ra ngoài mỗi
                          lần bác mở app — đủ để bên đó biết bác đang dùng Khoan
                          Đã, và biết vào lúc nào. CSP của máy chủ khai
                          `img-src 'self' data:` nên chúng sẽ bị chặn; đó là
                          hành vi ĐÚNG, nên chỗ này thay bằng chữ cái đầu tên.
                        */}
                        <span className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-purple-200 text-purple-900 font-black text-[18px] flex items-center justify-center shrink-0">
                          {(member.name || '?').trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="text-left">
                          <p className="font-extrabold text-[#2e1065] text-[15px] group-hover:text-purple-900 transition-colors">
                            {member.name}
                          </p>
                          <p className="text-[14px] font-semibold text-green-700">
                            {member.phone}
                          </p>
                        </div>
                      </div>

                      <div className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md shadow-green-500/20 group-hover:scale-105 transition-transform">
                        <PhoneCall size={20} />
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm font-medium">
                    {t("Chưa có số người thân được lưu.")}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setShowQuickCallModal(false);
                    setView('family');
                  }}
                  className="flex-1 py-2.5 px-3 bg-purple-100 hover:bg-purple-200 text-[#5b21b6] font-bold text-[14px] rounded-xl transition-colors text-center"
                >
                  {t("Quản lý danh bạ")}
                </button>
                <button
                  onClick={() => setShowQuickCallModal(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[14px] rounded-xl transition-colors"
                >
                  {t("Đóng")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Voice View ---
function VoiceView({ 
  setView, 
  t,
  onAnalyze,
  isAnalyzing
}: { 
  setView: (v: ViewState) => void, 
  t: any,
  onAnalyze?: (text: string, image?: string | null) => void,
  isAnalyzing?: boolean
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [micVolume, setMicVolume] = useState<number[]>([10, 16, 24, 30, 36, 30, 24, 16, 10]);
  const [speechApiSupported, setSpeechApiSupported] = useState(true);

  /**
   * ĐƯỜNG NGHE CỦA BẢN APK — và đây là một KHÁC BIỆT VỀ QUYỀN RIÊNG TƯ, không
   * phải một chi tiết kỹ thuật.
   *
   * `webkitSpeechRecognition` của trình duyệt GỬI TIẾNG NÓI RA MÁY CHỦ của hãng
   * (Google/Microsoft) để đổi thành chữ — và vì nó không đi qua `fetch`, CSP
   * `connect-src 'self'` không thấy và không chặn được. Bộ nghe native của
   * Android thì chạy TRÊN MÁY.
   *
   * Nên hai đường này khác nhau ở đúng cái người dùng cần biết: tiếng nói có rời
   * khỏi máy hay không. Dòng cảnh báo bên dưới bám theo `nguonNghe`, không bám
   * theo "có nghe được hay không" — nói sai chiều nào cũng là lời khai sai.
   *
   * `dang_do` = chưa hỏi xong máy. Chưa biết thì chưa khẳng định gì (§4.3).
   */
  const [nguonNghe, setNguonNghe] = useState<'dang_do' | 'trinh_duyet' | 'tren_may' | 'khong_co'>('dang_do');
  const dangNgheNativeRef = useRef(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const smoothedVolumesRef = useRef<number[]>(new Array(9).fill(8));
  const restartTimeoutRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);

  useEffect(() => {
    isComponentMounted.current = true;

    /*
     * ⚠️ HỎI MÁY, ĐỪNG SUY TỪ `window.SpeechRecognition`.
     * Trong APK, WebView KHÔNG có `webkitSpeechRecognition` — suy theo nó thì
     * app kết luận "máy bác không nghe được chữ" trong khi Android ngay dưới đó
     * có bộ nghe chạy trên máy, tốt hơn hẳn về quyền riêng tư. Đó là §4.3 lộn
     * ngược: khai THIẾU một khả năng đang có, và đẩy bác sang gõ tay không cần
     * thiết.
     */
    void (async () => {
      if (await laApk()) {
        const co = await coBoNghe();
        if (!isComponentMounted.current) return;
        // `'chua_ro'` ⇒ chưa hỏi được ROM. Cho đi tiếp: lượt nghe thật sẽ trả
        // về mã lỗi cụ thể, và đó là thông tin đúng hơn một lời đoán ở đây.
        setNguonNghe(co === false ? 'khong_co' : 'tren_may');
        setSpeechApiSupported(co !== false);
        return;
      }
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!isComponentMounted.current) return;
      setNguonNghe(SR ? 'trinh_duyet' : 'khong_co');
      setSpeechApiSupported(!!SR);
    })();

    // Auto-start recording & microphone stream with smooth initialization
    startRecording();

    return () => {
      isComponentMounted.current = false;
      stopRecording();
    };
  }, []);

  const initAudioVisualizer = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        if (!isComponentMounted.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!analyserRef.current || !isComponentMounted.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          const step = Math.floor(dataArray.length / 9) || 1;
          const nextVols: number[] = [];

          for (let i = 0; i < 9; i++) {
            const rawVal = dataArray[i * step] || 0;
            // Target height between 6px and 42px
            const targetPx = Math.max(6, Math.round((rawVal / 255) * 42));
            // Exponential smoothing for buttery visual transition
            const currentSmoothed = smoothedVolumesRef.current[i] || 8;
            const smoothed = Math.round(currentSmoothed * 0.55 + targetPx * 0.45);
            smoothedVolumesRef.current[i] = smoothed;
            nextVols.push(smoothed);
          }

          setMicVolume(nextVols);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      }
    } catch (err: any) {
      console.warn('Microphone stream notice:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Trình duyệt chưa được cấp quyền Micro. Bác hãy bấm "Cho phép" để ghi âm giọng nói trực tiếp.');
      }
    }
  };

  const startRecording = () => {
    setErrorMessage(null);
    setIsRecording(true);
    setDuration(0);

    // Init Web Audio Visualizer
    initAudioVisualizer();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    /*
     * ⚠️ BẢN APK ĐI ĐƯỜNG NATIVE VÀ DỪNG Ở ĐÂY.
     *
     * Bộ nghe Android là MỘT LƯỢT: bắt đầu → nói → nó tự chốt hoặc bác bấm dừng
     * → trả về chữ. Không có luồng chữ tạm như Web Speech API, nên không có
     * `interimText` — sóng âm vẫn nhảy theo micro thật, và chữ hiện ra một lần
     * khi lượt nghe chốt.
     *
     * ⚠️ KHÔNG `await` Ở ĐÂY. `startRecording` được gọi từ `useEffect` lúc vào
     * màn; chờ ở đây là treo cả màn hình trong lúc bộ nghe khởi động (§6.7).
     */
    if (nguonNghe === 'tren_may') {
      dangNgheNativeRef.current = true;
      void ngheGiongNoi('vi-VN').then((kq) => {
        if (!isComponentMounted.current) return;
        dangNgheNativeRef.current = false;
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // Nghe được chữ — kể cả khi lượt bị cắt giữa chừng, phần nghe được vẫn dùng.
        if (kq.vanBan) setTranscript(kq.vanBan);

        /*
         * ⚠️ §4.3 — HỎNG THÌ NÓI RA, VÀ NÓI KÈM LỐI ĐI TIẾP.
         * `CHUA_TAI_MODEL` là ca phổ biến nhất ở Việt Nam: máy chưa tải gói
         * tiếng Việt ngoại tuyến. App KHÔNG tự tải được (Android không có API),
         * nên thứ duy nhất làm được là đưa bác tới đúng màn Cài đặt.
         */
        if (kq.ghiAmFailed && !kq.vanBan) {
          setErrorMessage(
            kq.maLoi === 'CHUA_TAI_MODEL'
              ? t("Máy bác chưa tải bộ nghe tiếng Việt. Bác bấm nút bên dưới để mở Cài đặt, tải xong rồi quay lại — hoặc gõ chữ cũng được.")
              : kq.maLoi === 'CHUA_CHO_QUYEN_MICRO'
                ? t("Máy chưa cho Khoan Đã dùng micro. Bác gõ chữ hoặc gửi ảnh giúp cháu nhé.")
                : t("Lượt nghe này chưa xong. Bác thử lại, hoặc gõ chữ cũng được."),
          );
        }
      });
      return;
    }

    // Init Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'vi-VN';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
        };

        recognition.onresult = (event: any) => {
          let finalAccumulated = '';
          let interimAccumulated = '';

          for (let i = 0; i < event.results.length; i++) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalAccumulated += transcriptChunk + ' ';
            } else {
              interimAccumulated += transcriptChunk;
            }
          }

          if (finalAccumulated.trim()) {
            setTranscript(prev => {
              const combined = (finalAccumulated).trim();
              return combined;
            });
          }
          setInterimText(interimAccumulated);
        };

        recognition.onerror = (event: any) => {
          // Benign errors like 'no-speech' or 'aborted' are ignored gracefully
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
          }
          console.warn('Speech recognition notice:', event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('Vui lòng cho phép quyền truy cập Micro trên trình duyệt để nhận diện giọng nói.');
          }
        };

        recognition.onend = () => {
          // Auto-restart seamlessly when still recording
          if (isComponentMounted.current && recognitionRef.current) {
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = setTimeout(() => {
              try {
                if (isComponentMounted.current && recognitionRef.current) {
                  recognition.start();
                }
              } catch (e) {}
            }, 300);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition start error:', e);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    /*
     * ⚠️ "DỪNG" PHẢI CHỐT LƯỢT NGHE, KHÔNG CHỈ TẮT MICRO.
     * Lượt native đang treo chờ `onResults`; không gọi `dungNghe` thì nó nằm
     * chờ tới khi hạn giờ cắt, và bác bấm Dừng rồi vẫn thấy màn hình như đang
     * nghe. Đây đúng là lỗi đã phải vá ba lần ở bản trước.
     */
    if (dangNgheNativeRef.current) {
      dangNgheNativeRef.current = false;
      void dungNgheNative();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {}
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAnalyzeVoice = (textOverride?: string) => {
    stopRecording();
    const fullText = (textOverride || transcript || interimText).trim() || "Số điện thoại lạ tự xưng công an thông báo tài khoản có liên quan đến vụ án ma túy và rửa tiền, yêu cầu chuyển 50 triệu vào tài khoản an toàn để bảo lãnh điều tra";
    if (onAnalyze) {
      onAnalyze(fullText, null);
    } else {
      setView('warning');
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const sampleScenarios = [
    {
      title: '👮 Công an dọa phong tỏa tài sản & yêu cầu chuyển tiền',
      text: 'Số lạ tự xưng cán bộ điều tra công an thông báo tài khoản của bác liên quan đến đường dây rửa tiền, yêu cầu chuyển gấp 50 triệu vào tài khoản tạm giữ an toàn trong 15 phút để bảo lãnh.'
    },
    {
      title: '🏦 Ngân hàng dọa khóa thẻ & yêu cầu đọc mã OTP',
      text: 'Có người gọi tự xưng tổng đài ngân hàng báo có giao dịch 20 triệu vừa phát sinh, yêu cầu bác đọc ngay mã OTP gửi về điện thoại để hủy giao dịch.'
    },
    {
      title: '🎁 Thông báo trúng thưởng xe SH nộp trước thuế',
      text: 'Chúc mừng bác đã trúng thưởng giải đặc biệt xe máy SH và 100 triệu đồng từ chương trình tri ân khách hàng, yêu cầu bác nạp trước 3 triệu phí vận chuyển.'
    },
    {
      title: '🏥 Con cấp cứu ở viện yêu cầu chuyển tiền gấp',
      text: 'Số lạ gọi tự xưng bác sĩ bệnh viện cấp cứu, báo tin con của bác vừa bị tai nạn nguy kịch, yêu cầu chuyển ngay 30 triệu tiền viện phí mổ cấp cứu.'
    },
    {
      title: '📦 Bưu điện báo có bưu kiện cấm phạt tiền',
      text: 'Tổng đài bưu điện thông báo bác có bưu phẩm chuyển ra nước ngoài chứa tài liệu cấm, yêu cầu chuyển 15 triệu để xác minh không bị khởi tố.'
    },
    {
      title: '💰 Việc nhẹ lương cao xem video kiếm tiền',
      text: 'Mời bác tham gia làm cộng tác viên online xem video trên mạng xã hội, chỉ cần nạp 2 triệu tiền cọc để nhận hoa hồng 500 nghìn mỗi ngày.'
    }
  ];

  const currentDisplayText = transcript + (interimText ? (transcript ? ' ' : '') + interimText : '');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col h-full w-full relative z-10 p-4 sm:p-5 overflow-y-auto"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between pt-2 sm:pt-4 mb-2">
        <button aria-label={t("Quay lại")} onClick={() => { stopRecording(); setView('home'); }} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#4c1d95] shadow-sm active:scale-95 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <span className="font-extrabold text-[#321379] text-[16px] block">{t("Ghi âm tình huống cuộc gọi")}</span>
          <span className="text-[14px] text-purple-600 font-semibold">{t("Tự động nhận diện giọng nói mượt mà")}</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Main Recording Graphic */}
      <div className="flex flex-col items-center justify-center w-full my-2">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-2">
          {/* Animated Glow Halo */}
          <motion.div 
            animate={isRecording ? { scale: [1, 1.3, 1], opacity: [0.35, 0.75, 0.35] } : { scale: 1, opacity: 0.2 }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className={`w-full h-full rounded-full absolute blur-xl ${isRecording ? 'bg-red-400' : 'bg-purple-300'}`}
          />
          
          <button aria-label={t("Bấm để nói")} 
            onClick={handleToggle}
            className={`w-24 h-24 sm:w-26 sm:h-26 rounded-full flex items-center justify-center shadow-xl relative z-10 transition-all active:scale-95 ${
              isRecording 
                ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white ring-4 ring-red-300/60 shadow-red-500/40 animate-pulse' 
                : 'bg-gradient-to-tr from-[#8b5cf6] to-[#6d28d9] text-white ring-4 ring-purple-200 shadow-purple-500/30'
            }`}
            title={isRecording ? t("Chạm để tạm dừng") : t("Chạm để tiếp tục nói")}
          >
            <Mic size={38} className="text-white drop-shadow-sm sm:w-11 sm:h-11" />
          </button>
        </div>

        {/* Live Timer and status */}
        <div className="flex items-center gap-2 mb-2">
          {isRecording ? (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          ) : (
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          )}
          <span className="font-extrabold text-[16px] sm:text-[18px] text-[#1e1b4b]">
            {isRecording ? `${t("Đang nghe bác nói")} (${formatTime(duration)})` : t("Đã tạm dừng ghi âm")}
          </span>
        </div>

        {/*
          §4.3 — MÁY KHÔNG NGHE ĐƯỢC THÌ PHẢI NÓI RA.

          ⚠️ LỖI ĐÃ TÌM THẤY 18/8/2026: `speechApiSupported` được ĐẶT thành
          `false` khi trình duyệt không có `SpeechRecognition`, nhưng không màn
          hình nào đọc tới nó. Nghĩa là trên máy không nhận được giọng nói, bác
          vẫn thấy đúng dòng "Đang nghe bác nói" như mọi lần — hỏng mà nhìn y hệt
          lúc bình thường. Đó là câu hỏi §4.3 đặt ra cho mọi nguồn đầu vào:
          "hỏng thì người dùng thấy gì?"

          Sóng âm vẫn nhảy vì nó đọc âm lượng micro, không phải chữ nhận ra được —
          nên nó lại càng trông như đang hoạt động. Dòng này là chỗ nói thật.
        */}
        {!speechApiSupported && (
          <div className="w-full max-w-md bg-amber-50 border-2 border-amber-400 rounded-2xl px-4 py-3 my-2">
            <p className="text-[16px] font-bold text-amber-900 leading-snug">
              {t("Máy của bác chưa chuyển được lời nói thành chữ. Cháu vẫn ghi âm, nhưng chưa đọc được nội dung — bác gõ hoặc gửi ảnh giúp cháu nhé.")}
            </p>
          </div>
        )}

        {/*
          ⚠️⚠️ MỘT ĐƯỜNG RA NGOÀI MÀ HÀNG RÀO CỦA CHÍNH APP KHÔNG NHÌN THẤY.

          `webkitSpeechRecognition` (Web Speech API) trên Chrome và Edge KHÔNG
          chạy trên máy: nó gửi âm thanh lên máy chủ của hãng trình duyệt để
          chuyển thành chữ. Và vì nó không đi qua `fetch`, `connect-src 'self'`
          trong CSP KHÔNG chặn được, cũng không thấy được.

          Nghĩa là app khai "nội dung không rời khỏi máy" ở mọi màn khác, nhưng
          riêng cái nút này thì tiếng nói của bác đi ra một công ty thứ ba. Giấu
          chuyện đó đi là đúng dạng lỗi §4.3, chỉ khác chỗ xảy ra — và nó tệ hơn,
          vì đây là lời khai SAI chứ không phải lời khai THIẾU.

          ⚠️ ĐỪNG GỠ DÒNG NÀY khi nào phần nghe còn chạy bằng Web Speech API.
          Gỡ được khi và chỉ khi chuyển sang bộ nghe chạy trên máy (bản APK có
          plugin native, hoặc Whisper cục bộ).
        */}
        {nguonNghe === 'trinh_duyet' && (
          <div className="w-full max-w-md bg-slate-100 border-2 border-slate-400 rounded-2xl px-4 py-3 my-2">
            <p className="text-[16px] font-bold text-slate-900 leading-snug">
              {t("Phần nghe này dùng dịch vụ của trình duyệt: tiếng nói của bác được gửi ra ngoài để đổi thành chữ.")}
            </p>
            <p className="text-[14px] font-medium text-slate-700 leading-snug mt-1">
              {t("Những phần khác của Khoan Đã không gửi gì ra ngoài. Bác không muốn thì gõ chữ hoặc gửi ảnh cũng được.")}
            </p>
          </div>
        )}

        {/*
          ⚠️ NÓI RA CẢ KHI TIN TỐT — VÀ CHỈ KHI NÓ ĐÚNG.
          Bộ nghe của Android chạy trên máy: tiếng nói không rời khỏi thiết bị.
          Đây là khác biệt thật giữa bản cài đặt và bản web, và là lý do đáng để
          bác cài bản APK. Nhưng dòng này bám theo `nguonNghe === 'tren_may'` —
          hiện nó ở bản web là lời khai SAI, tệ hơn cả im lặng (§11).
        */}
        {nguonNghe === 'tren_may' && (
          <div className="w-full max-w-md bg-emerald-50 border-2 border-emerald-500 rounded-2xl px-4 py-3 my-2">
            <p className="text-[16px] font-bold text-emerald-900 leading-snug">
              {t("Phần nghe này chạy ngay trên máy của bác. Tiếng nói không gửi đi đâu cả.")}
            </p>
          </div>
        )}

        {/* Live Audio Waveform based on real microphone volume with smooth curves */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 h-10 px-5 py-1.5 bg-purple-50/90 backdrop-blur-sm rounded-full border border-purple-200/80 shadow-inner my-1">
            {micVolume.map((height, i) => (
              <motion.div
                key={i}
                className="w-1.5 rounded-full transition-all duration-100 ease-out"
                style={{ 
                  height: `${height}px`,
                  backgroundColor: height > 22 ? '#7c3aed' : height > 14 ? '#9333ea' : '#c084fc'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[14px] text-amber-900 mb-2 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
          {/*
            ⚠️ §6.7 — NÓI RA GIỚI HẠN THÌ PHẢI KÈM LỐI ĐI TIẾP.
            "Máy bác chưa có bộ nghe tiếng Việt" mà dừng ở đó là bỏ bác giữa
            đường: bác không biết tải ở đâu, và app thì KHÔNG tự tải được —
            Android không có API nào cho phép. Thứ duy nhất làm được là mở đúng
            màn Cài đặt.
          */}
          {nguonNghe === 'tren_may' && (
            <button
              onClick={() => { void moCaiDatGiongNoi(); }}
              className="mt-2.5 w-full min-h-[52px] px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold rounded-xl text-[15px] transition-all"
            >
              {t("Mở Cài đặt để tải bộ nghe")}
            </button>
          )}
        </div>
      )}

      {/* Transcript Text Box */}
      <div className="w-full bg-white rounded-2xl p-3.5 shadow-sm border border-[#e9d5ff] mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[14px] font-bold text-[#6d28d9] flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500 animate-spin" /> {t("Lời nói đang nhận diện:")}
          </span>
          {currentDisplayText && (
            <button 
              onClick={() => {
                setTranscript('');
                setInterimText('');
              }} 
              className="text-[14px] text-gray-500 hover:text-red-500 font-semibold px-2 py-0.5 rounded-md hover:bg-red-50 transition-colors"
            >
              {t("Xóa lời nói")}
            </button>
          )}
        </div>

        <textarea 
          value={currentDisplayText}
          onChange={(e) => {
            setTranscript(e.target.value);
            setInterimText('');
          }}
          placeholder={isRecording ? t("Đang lắng nghe... Bác hãy nói nội dung cuộc gọi hoặc tin nhắn...") : t("Bấm Micro để tiếp tục nói...")}
          rows={3}
          className="w-full bg-[#f8f4ff] rounded-xl p-2.5 text-[14px] text-[#311068] font-medium outline-none border border-transparent focus:border-[#c084fc] resize-none leading-relaxed"
        />

        <div className="mt-1.5 flex items-center justify-between text-[14px] text-emerald-700 font-bold">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {isRecording ? t("Đang nhận diện trực tiếp qua Micro") : t("Đã thu nhận lời nói")}
          </span>
          <span className="text-purple-600 font-semibold">{currentDisplayText.length} {t("ký tự")}</span>
        </div>
      </div>

      {/* Quick Situation Scenarios */}
      <div className="w-full mb-3">
        <span className="text-[14px] font-bold text-[#4c1d95] block mb-1.5">{t("Hoặc chọn tình huống mẫu để thử nhanh:")}</span>
        <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {sampleScenarios.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(sc.text);
                setInterimText('');
                handleAnalyzeVoice(sc.text);
              }}
              className="text-left bg-white/90 hover:bg-purple-50 p-2.5 rounded-xl border border-purple-100 shadow-2xs text-[14px] text-[#1e1b4b] font-medium flex items-center justify-between active:scale-98 transition-all group"
            >
              <span className="font-bold truncate mr-2 text-slate-800 group-hover:text-purple-900">{sc.title}</span>
              <span className="text-[14px] text-purple-700 bg-purple-100 group-hover:bg-purple-200 px-2 py-0.5 rounded-md font-bold shrink-0">{t("Thử ngay")}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-2 mt-auto pb-2">
        <button 
          onClick={() => handleAnalyzeVoice()}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white py-3.5 rounded-2xl font-bold text-[15px] shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 hover:opacity-95"
        >
          <ShieldCheck size={20} />
          <span>{isAnalyzing ? t("Đang phân tích dữ liệu...") : t("Phân tích an toàn ngay")}</span>
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handleToggle} 
            className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 border ${
              isRecording 
                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                : 'bg-white border-[#e9d5ff] text-[#4c1d95]'
            }`}
          >
            <Mic size={14} />
            <span>{isRecording ? t("Tạm dừng mic") : t("Bật lại mic")}</span>
          </button>
          <button 
            onClick={() => { 
              setTranscript(''); 
              setInterimText('');
              startRecording(); 
            }} 
            className="flex-1 bg-white border border-[#e9d5ff] text-[#6d28d9] py-2.5 rounded-xl font-bold text-[14px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <RotateCcw size={13} />
            <span>{t("Nói lại từ đầu")}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- History View ---
function HistoryView({
  setView,
  t,
  lang = 'vi',
  isLoggedIn,
  setIsLoggedIn,
  historyItems,
  setHistoryItems,
  setAnalyzeResult
}: {
  setView: (v: ViewState) => void,
  t: any,
  lang?: Lang,
  isLoggedIn: boolean,
  setIsLoggedIn: (v: boolean) => void,
  historyItems: HistoryRecord[],
  setHistoryItems: React.Dispatch<React.SetStateAction<HistoryRecord[]>>,
  setAnalyzeResult: (data: any) => void
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'saved'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredItems = (historyItems || []).filter(item => {
    if (activeTab === 'high' && item.risk !== 'CAO') return false;
    if (activeTab === 'saved' && !item.saved) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return item.title.toLowerCase().includes(q) || (item.data?.lyDo && item.data.lyDo.toLowerCase().includes(q));
    }
    return true;
  });

  const toggleSave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryItems(prev => prev.map(item => item.id === id ? { ...item, saved: !item.saved } : item));
  };

  const deleteItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleOpenItem = (item: HistoryRecord) => {
    if (item.data) {
      setAnalyzeResult(item.data);
      setView('warning');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col w-full relative z-10 pt-6 md:pt-16 pb-24 lg:pb-10 px-4 md:px-12 lg:px-16 overflow-y-auto"
    >
      <div className="md:hidden flex flex-col items-center mb-4">
         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xs mb-1.5 border border-purple-100">
            <ShieldAlert size={22} className="text-[#6d28d9]" />
         </div>
         <h2 className="text-[22px] font-black text-[#1e1b4b] text-center leading-tight">{t("Lịch sử cảnh báo")}</h2>
      </div>

      <div className="hidden md:flex flex-col items-center text-center mb-8 max-w-2xl mx-auto">
         <h2 className="text-4xl font-black text-[#2e1065] tracking-tight mb-2">{t("Lịch sử cảnh báo & vụ việc")}</h2>
         <p className="text-lg text-[#6b7280]">{t("Theo dõi các cuộc gọi, tin nhắn hoặc liên kết đáng ngờ đã được phân tích.")}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/80 md:bg-white md:shadow-sm md:w-[420px] md:mx-auto backdrop-blur-md rounded-2xl p-1 mb-3 shadow-2xs border border-purple-100/60">
        <button 
          onClick={() => setActiveTab('all')} 
          className={`flex-1 py-2 rounded-xl font-bold text-[14px] transition-all ${activeTab === 'all' ? 'bg-[#7e22ce] text-white shadow-sm' : 'text-[#6d28d9] hover:bg-white/50'}`}
        >
          {t("Tất cả")} ({historyItems.length})
        </button>
        <button 
          onClick={() => setActiveTab('high')} 
          className={`flex-1 py-2 rounded-xl font-bold text-[14px] transition-all ${activeTab === 'high' ? 'bg-red-600 text-white shadow-sm' : 'text-red-600 hover:bg-red-50'}`}
        >
          {/* Tab lọc cũng dùng đúng nhãn của catalog — cùng một mức, cùng một chữ. */}
          {tra(NHAN, 'CAO', lang)} ({historyItems.filter(i => i.risk === 'CAO').length})
        </button>
        <button 
          onClick={() => setActiveTab('saved')} 
          className={`flex-1 py-2 rounded-xl font-bold text-[14px] transition-all ${activeTab === 'saved' ? 'bg-[#7e22ce] text-white shadow-sm' : 'text-[#6d28d9] hover:bg-white/50'}`}
        >
          {t("Đã lưu")} ({historyItems.filter(i => i.saved).length})
        </button>
      </div>

      {/* Search inside history */}
      <div className="w-full max-w-4xl mx-auto mb-3">
        <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-purple-100 shadow-2xs">
          <Search size={15} className="text-gray-400" />
          <input 
            type="text" 
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t("Tìm trong lịch sử...")}
            className="flex-1 bg-transparent text-[14px] text-[#1e1b4b] outline-none font-medium"
          />
          {searchFilter && (
            <button aria-label={t("Đóng")} onClick={() => setSearchFilter('')} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      <div className="flex flex-col gap-2.5 max-w-4xl mx-auto w-full md:grid md:grid-cols-2">
        {filteredItems.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-10 bg-white/70 rounded-3xl border border-purple-100 shadow-2xs text-center p-6">
            <ShieldCheck size={38} className="text-[#c084fc] mb-2 opacity-60" />
            <h4 className="font-bold text-[#1e1b4b] text-[15px] mb-1">{t("Chưa có bản ghi nào")}</h4>
            <p className="text-[14px] text-gray-500 max-w-xs mb-3">{t("Bác bấm micro hoặc quét ảnh ở trang chủ để kiểm tra an toàn.")}</p>
            <button 
              onClick={() => setView('home')} 
              className="px-5 py-2 bg-[#8b5cf6] text-white font-bold rounded-xl text-[14px] shadow-sm active:scale-95 transition-transform"
            >
              {t("Kiểm tra ngay")}
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const isHigh = item.risk === 'CAO';
            const isSuspicious = item.risk === 'NGHI_NGO';
            return (
              <div 
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="bg-white rounded-2xl p-3 flex gap-3 items-center shadow-2xs border border-purple-100/70 hover:shadow-xs hover:border-purple-200 transition-all cursor-pointer group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isHigh ? 'bg-red-50 text-red-600 border border-red-200' : isSuspicious ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                  {item.type === 'call' ? (
                    <Phone size={18} />
                  ) : item.type === 'image' ? (
                    <ImageIcon size={18} />
                  ) : item.type === 'link' ? (
                    <Globe size={18} />
                  ) : (
                    <MessageSquare size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#1e1b4b] text-[14px] leading-snug truncate mb-1 group-hover:text-[#7e22ce] transition-colors">
                    {t(item.title) || item.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {/*
                      ⚠️ §4.1 — BA NHÃN NGUYÊN VĂN, TRA TỪ CATALOG.
                      Bản trước hiện `t("An toàn")` cho mức thấp: nhãn thứ tư bị
                      cấm TUYỆT ĐỐI, kèm dấu tích xanh — đọc thành "đã kiểm, ổn
                      rồi". Hệ thống chỉ nói *chưa thấy dấu hiệu trong thông tin
                      bác cung cấp*; nó không hứa an toàn. Và "Nguy cơ cao" /
                      "Nghi vấn" cũng không phải chữ của §4.1.
                    */}
                    <span className={`px-1.5 py-0.5 rounded text-[14px] font-extrabold flex items-center gap-1 ${isHigh ? 'bg-red-100 text-red-800' : isSuspicious ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
                      {isHigh ? <AlertOctagon size={12} /> : isSuspicious ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                      {tra(NHAN, item.risk, lang) ?? item.risk}
                    </span>
                    <span className="text-gray-500 text-[14px] font-medium">{t(item.date) || item.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button 
                    onClick={(e) => toggleSave(item.id, e)}
                    title={item.saved ? t("Bỏ lưu") : t("Lưu")}
                    className={`p-1.5 rounded-lg transition-colors ${item.saved ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-purple-600'}`}
                  >
                    <Bookmark size={16} fill={item.saved ? "currentColor" : "none"} />
                  </button>
                  <button aria-label={t("Xoá")} 
                    onClick={(e) => deleteItem(item.id, e)}
                    title={t("Xóa")}
                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {historyItems.length > 0 && (
        <div className="max-w-4xl mx-auto w-full mt-4 flex justify-end">
          <button 
            onClick={() => setHistoryItems([])}
            className="text-[14px] text-gray-400 hover:text-red-500 font-semibold flex items-center gap-1 py-1"
          >
            <Trash2 size={13} /> {t("Xóa toàn bộ")}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// --- Family View ---
function FamilyView({ 
  setView, 
  t, 
  lang = 'vi',
  isLoggedIn, 
  familyMembers,
  setFamilyMembers
}: { 
  setView: (v: ViewState) => void, 
  t: any, 
  lang?: Lang,
  isLoggedIn: boolean, 
  familyMembers: any[],
  setFamilyMembers: React.Dispatch<React.SetStateAction<any[]>>
}) {
  const emergencyList = EMERGENCY_NUMBERS[lang] || EMERGENCY_NUMBERS['vi'];
  const topEmergencies = emergencyList.slice(0, 4);

  /**
   * ⚠️ KHÔNG CÓ SỐ DỰ PHÒNG. Trước đây thiếu số thì rơi về '0988888888' —
   * nghĩa là kể cả khi bác đã xoá hết danh bạ, nút gọi vẫn quay số cho một
   * người lạ. Thà không làm gì còn hơn gọi nhầm người trong lúc khẩn cấp.
   */
  const handleCall = (phone?: string) => {
    if (!phone || !phone.trim()) return;
    window.open(`tel:${phone.trim()}`, '_self');
  };

  const handleSms = (member: any) => {
    const text = lang === 'en'
      ? `[WAIT A MOMENT - SOS] I just encountered a suspicious scam situation. Please call me back right away!`
      : `[KHOAN ĐÃ - CẦU CỨU] Bố/Mẹ vừa gặp tình huống nghi vấn lừa đảo. Con gọi lại kiểm tra giúp bố/mẹ nhé!`;
    if (!member?.phone || !String(member.phone).trim()) return;
    window.open(`sms:${String(member.phone).trim()}?body=${encodeURIComponent(text)}`, '_self');
  };

  const handleDeleteMember = (id: number) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col w-full relative z-10 pt-6 md:pt-16 pb-24 lg:pb-10 px-4 md:px-12 lg:px-16 overflow-y-auto"
    >
      {/* Mobile Header */}
      <div className="md:hidden flex flex-col items-center mb-4">
         <div className="w-10 h-10 bg-gradient-to-tr from-[#8b5cf6] to-[#c084fc] rounded-2xl flex items-center justify-center shadow-sm mb-1.5 border border-white">
            <BookOpen size={20} className="text-white" fill="currentColor" />
         </div>
         <h2 className="text-[22px] font-black text-[#1e1b4b] text-center leading-tight">{t("Gia đình & Người thân")}</h2>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex flex-col items-center text-center mb-10 relative z-20">
         <h2 className="text-4xl font-black text-[#2e1065] tracking-tight mb-3">{t("Người thân đồng hành cùng bác")}</h2>
         <p className="text-lg text-[#6b7280]">{t("Lưu người thân tin cậy để gọi nhanh, nhờ xác minh và nhận hỗ trợ khi cần.")}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8 max-w-5xl mx-auto w-full">
        {/* Left Column - Contact List */}
        <div className="flex-1 bg-transparent md:bg-white md:rounded-[2rem] md:p-6 md:shadow-sm md:border border-white/50">
          {/*
            ⚠️ XẾP DỌC KHI HẸP — ba nút từng ĐÈ LÊN TÊN người thân.
            Hàng ngang gồm tên + "Gọi" + "Báo tin" + thùng rác cần khoảng 420px
            mới đủ; dưới mức đó tên bị nút phủ lên và bác không biết mình sắp gọi
            cho ai. Tên xuống một dòng riêng thì không bao giờ bị che, và nút vẫn
            giữ đủ chiều cao vùng chạm.
          */}
          <div className="flex flex-col gap-2.5">
            {familyMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 shadow-2xs border border-purple-100">
                <div className="w-12 h-12 rounded-xl bg-purple-100 overflow-hidden border border-purple-200 shrink-0">
                   {/* `avatar` giờ là MÃ MÀU, không phải đường dẫn ảnh — xem AddFamilyView. */}
                   <div
                     className="w-full h-full flex items-center justify-center font-black text-[18px] text-white"
                     style={{ backgroundColor: member.avatar && member.avatar.startsWith('#') ? member.avatar : '#7e22ce' }}
                   >
                     {(member.name || '?').trim().charAt(0).toUpperCase()}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#1e1b4b] text-[16px] leading-snug">{member.name}</h3>
                  <p className="text-purple-700 font-semibold text-[14px] mt-0.5">{t(member.relation) || member.relation} • {member.phone || '0988 *** 888'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                   <button 
                     onClick={() => handleCall(member.phone)}
                     className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-transform"
                     title={t("Gọi ngay")}
                   >
                      <Phone size={16} />
                      <span>{t("Gọi")}</span>
                   </button>
                   <button 
                     onClick={() => handleSms(member)}
                     className="flex-1 sm:flex-none px-4 py-2.5 bg-[#7e22ce] hover:bg-[#6b21a8] text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-transform"
                     title={t("Gửi tin nhắn nhờ hỗ trợ")}
                   >
                      <MessageSquare size={16} />
                      <span>{t("Báo tin")}</span>
                   </button>
                   <button aria-label={t("Xoá")} 
                     onClick={() => handleDeleteMember(member.id)}
                     className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                     title={t("Xóa")}
                   >
                     <Trash2 size={15} />
                   </button>
                </div>
              </div>
            ))}

            <button onClick={() => setView('add_family')} className="w-full mt-1 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-2xl font-bold text-[14px] shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
               <Plus size={18} strokeWidth={2.5} /> {t("Thêm người thân")}
            </button>
          </div>
        </div>

        {/* Right Column - Quick Support Cards */}
        <div className="flex flex-col gap-3 md:w-[380px]">
           <div className="bg-white rounded-2xl p-4 shadow-2xs border border-purple-100">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[14px] font-black text-[#2e1065] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-red-600" />
                  {lang === 'en' ? 'Emergency & Anti-Scam Hotlines' : t("Số khẩn cấp quốc gia")}
                </h3>
                <span className="text-[14px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {lang === 'en' ? 'Global' : 'Việt Nam'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                 {topEmergencies.map((item) => (
                   <button 
                     key={item.id}
                     onClick={() => handleCall(item.phone.replace(/[^0-9+]/g, ''))}
                     className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100 text-left transition-all border border-purple-100 active:scale-95 group"
                   >
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center font-black text-[14px] shrink-0 group-hover:bg-red-600 transition-colors">
                         {item.phone.length > 5 ? 'SOS' : item.phone}
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <h4 className="font-bold text-[#1e1b4b] text-[14px] truncate">{item.name}</h4>
                         <p className="text-[14px] text-purple-700 font-semibold truncate">{item.tag || item.description}</p>
                      </div>
                   </button>
                 ))}
              </div>

              {/* Link to Full Learn & Hotline View */}
              <button 
                onClick={() => setView('learn')}
                className="w-full mt-3 py-2.5 px-3 bg-gradient-to-r from-amber-500/15 via-purple-100 to-indigo-100 border border-amber-300 text-[#2e1065] rounded-xl font-bold text-[14px] flex items-center justify-between active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-600 shrink-0" />
                  <span>{lang === 'en' ? 'View all lessons & worldwide hotlines' : 'Xem cẩm nang bẫy lừa & tất cả hotline'}</span>
                </div>
                <ChevronRight size={16} className="text-purple-600" />
              </button>
           </div>

           <div className="bg-purple-50/70 rounded-2xl p-3 border border-purple-100 flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-[#7e22ce] shrink-0" />
              <p className="text-[14px] text-purple-900 font-medium leading-tight">
                {t("Danh bạ lưu an toàn trên máy của bác, bảo mật tuyệt đối.")}
              </p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}


// --- Account View ---
function AccountView({ setView, t, setIsLoggedIn }: { setView: (v: ViewState) => void, t: any, setIsLoggedIn: (v: boolean) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-start overflow-hidden px-6 pt-12"
    >
      <button aria-label={t("Quay lại")} 
        onClick={() => setView('profile')}
        className="absolute top-6 left-6 p-2 bg-white/60 rounded-full shadow-sm text-[#6d28d9] active:scale-95 transition-all"
      >
        <ChevronLeft size={24} />
      </button>
      <h2 className="text-3xl font-black text-[#3b1d7d] mt-2 mb-10">{t("Tài khoản")}</h2>
      
      <div className="w-full max-w-[360px] flex flex-col gap-4">
         <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#f3e8ff]">
            <h3 className="font-bold text-[#1e1b4b] mb-4 text-[16px]">{t("Thông tin cá nhân")}</h3>
            <div className="flex flex-col gap-3">
               <div>
                  <label className="text-[14px] text-[#6b7280] font-medium">{t("Họ và tên")}</label>
                  <p className="font-bold text-[#1e1b4b] text-[15px]">Bác An</p>
               </div>
               <div>
                  <label className="text-[14px] text-[#6b7280] font-medium">{t("Số điện thoại")}</label>
                  <p className="font-bold text-[#1e1b4b] text-[15px]">0987 *** 321</p>
               </div>
            </div>
         </div>
         
         <button onClick={() => { setIsLoggedIn(false); setView('home'); }} className="w-full py-4 bg-white text-[#ef4444] rounded-[20px] font-bold text-[16px] shadow-sm border border-[#fee2e2] active:bg-[#fef2f2] transition-colors mt-4">
           {t("Đăng xuất")}
         </button>
      </div>
    </motion.div>
  );
}

// --- Privacy View ---
function PrivacyView({ setView, t }: { setView: (v: ViewState) => void, t: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-start overflow-hidden px-6 pt-12"
    >
      <button aria-label={t("Quay lại")} 
        onClick={() => setView('profile')}
        className="absolute top-6 left-6 p-2 bg-white/60 rounded-full shadow-sm text-[#6d28d9] active:scale-95 transition-all"
      >
        <ChevronLeft size={24} />
      </button>
      <h2 className="text-3xl font-black text-[#3b1d7d] mt-2 mb-10">{t("Quyền riêng tư")}</h2>
      
      <div className="w-full max-w-[360px] flex flex-col gap-4">
         <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#f3e8ff]">
            <h3 className="font-bold text-[#1e1b4b] mb-4 text-[16px]">{t("Quản lý dữ liệu")}</h3>
            <div className="flex flex-col gap-4">
               <button className="flex items-center gap-3 active:scale-95 transition-transform text-left">
                  <div className="w-10 h-10 rounded-full bg-[#f3e8ff] flex items-center justify-center text-[#6d28d9]">
                    <Download size={20} />
                  </div>
                  <div>
                    <span className="block font-bold text-[#1e1b4b] text-[15px]">{t("Xuất dữ liệu")}</span>
                    <span className="block text-[14px] text-[#6b7280]">{t("Tải xuống toàn bộ lịch sử kiểm tra")}</span>
                  </div>
               </button>
               <div className="w-full h-[1px] bg-[#f1f5f9]"></div>
               <button className="flex items-center gap-3 active:scale-95 transition-transform text-left">
                  <div className="w-10 h-10 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#ef4444]">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <span className="block font-bold text-[#ef4444] text-[15px]">{t("Xóa dữ liệu")}</span>
                    <span className="block text-[14px] text-[#6b7280]">{t("Xóa vĩnh viễn tài khoản và lịch sử")}</span>
                  </div>
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

// --- Notifications View ---
/**
 * CỬA SỔ NỔI CỦA BẢN APK — quyền `SYSTEM_ALERT_WINDOW`.
 *
 * ══════════ VÌ SAO ĐÁNG LÀM RIÊNG MỘT KHỐI ══════════
 *
 * Đây là thứ DUY NHẤT trong app hiện ra được khi bác đang nghe điện thoại.
 * Thông báo heads-up bị màn hình cuộc gọi che; app thì bác không mở được vì tay
 * đang cầm máy áp vào tai. Kẻ lừa đảo biết điều đó — cả kịch bản giả danh công
 * an đều diễn ra TRONG một cuộc gọi đang nối, và chúng dặn "đừng tắt máy".
 *
 * Một dải chữ đè lên chính màn hình cuộc gọi là cách duy nhất chen được vào.
 *
 * ⚠️ QUYỀN NÀY KHÔNG XIN BẰNG HỘP THOẠI ĐƯỢC. Android bắt người dùng tự vào
 * Cài đặt bật, và cố tình làm nó khó — vì đây cũng chính là quyền phần mềm độc
 * hại dùng để vẽ đè lên màn hình ngân hàng. Nên: nói thật là phải đi mấy bước,
 * đưa thẳng tới màn Cài đặt, rồi ĐỌC LẠI trạng thái khi bác quay về.
 *
 * ⚠️ §4.3 — ĐỌC LẠI KHI QUAY VỀ, ĐỪNG GIẢ ĐỊNH ĐÃ BẬT. Bấm nút mở Cài đặt rồi
 * coi như xong là dạng lỗi quen thuộc: bác có thể đã bật, có thể bấm nhầm, có
 * thể ROM không có màn đó. Ba ca khác nhau, và chỉ đọc lại mới phân biệt được.
 */
function CuaSoNoiNative({ t }: { t: any }) {
  const [quyen, setQuyen] = useState<QuyenNative>('chua_bat');
  const [dangThu, setDangThu] = useState(false);

  const doLai = () => { void quyenPopup().then(setQuyen); };

  useEffect(() => {
    doLai();
    // Bác đi sang Cài đặt hệ thống rồi quay về ⇒ app trở lại tiền cảnh ⇒ đọc lại.
    const khiHien = () => { if (document.visibilityState === 'visible') doLai(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => document.removeEventListener('visibilitychange', khiHien);
  }, []);

  /**
   * ⚠️ NÚT THỬ LÀ BẮT BUỘC, KHÔNG PHẢI TIỆN NGHI.
   * Không có nó thì lần đầu tiên bác nhìn thấy dải cảnh báo này là giữa một vụ
   * lừa đảo thật — lúc đang hoảng, và không biết nó là cái gì. Thấy trước một
   * lần trong lúc bình tĩnh là biết nó vô hại và biết nút tắt nằm đâu.
   */
  const thu = async () => {
    setDangThu(true);
    try {
      await hienPopupCanhBao({
        nhan: 'CAO',
        tieuDe: t("Đây là dải cảnh báo — bác đang xem thử"),
        nutMo: t("Mở Khoan Đã"),
        nutOn: t("Tôi ổn, tắt đi"),
      });
      // Tự tắt sau 5 giây để bản thử không nằm lại trên màn hình bác.
      setTimeout(() => { void anPopup(); setDangThu(false); }, 5000);
    } catch {
      setDangThu(false);
      doLai();
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white rounded-[26px] p-5 shadow-lg border border-purple-400/50 mb-5 relative overflow-hidden">
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-xl bg-purple-500/30 border border-purple-300/40 flex items-center justify-center text-purple-200 shrink-0">
          <Maximize2 size={20} />
        </div>
        <div>
          <h3 className="font-extrabold text-[15px] text-white leading-tight">
            {t("Dải cảnh báo đè lên màn hình")}
          </h3>
          <p className="text-[14px] text-purple-200 leading-snug">
            {t("Hiện được cả khi bác đang nghe điện thoại.")}
          </p>
        </div>
      </div>

      <p className="text-[14px] text-purple-100/90 leading-relaxed mb-3">
        {t("Khi Khoan Đã thấy dấu hiệu nguy hiểm cao, một dải chữ hiện đè lên màn hình bác đang dùng — kể cả màn hình cuộc gọi. Dải này luôn có nút tắt.")}
      </p>

      {quyen === 'da_bat' ? (
        <>
          <div className="flex items-center gap-2 mb-3 p-3 bg-emerald-400/15 border border-emerald-300/40 rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="text-[14px] font-extrabold text-emerald-100">{t("Máy bác đã cho phép")}</span>
          </div>
          <button
            onClick={thu}
            disabled={dangThu}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 disabled:opacity-60 text-white font-extrabold rounded-xl text-[14px] flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Sparkles size={15} />
            <span>{dangThu ? t("Đang hiện thử…") : t("Xem thử một lần")}</span>
          </button>
        </>
      ) : quyen === 'khong_ho_tro' ? (
        /*
         * ⚠️ §4.3 — "MÁY NÀY KHÔNG LÀM ĐƯỢC" KHÁC "CHƯA BẬT".
         * Gộp hai ca thành một nút "Bật ngay" là đẩy bác đi tìm một thứ không
         * tồn tại trên máy của mình, rồi tự trách là mình làm sai.
         */
        <div className="p-3.5 bg-white/10 border border-white/20 rounded-2xl">
          <p className="text-[14px] text-purple-100 leading-relaxed">
            {t("Máy này chưa dùng được dải cảnh báo. Các phần khác của Khoan Đã vẫn chạy bình thường.")}
          </p>
        </div>
      ) : (
        <>
          <div className="p-3.5 bg-amber-400/15 border border-amber-300/40 rounded-2xl mb-3">
            <p className="text-[14px] text-amber-100 leading-relaxed">
              {t("Chưa bật. Bấm nút dưới đây, máy sẽ mở màn Cài đặt — bác tìm dòng Khoan Đã rồi gạt sang bật, xong quay lại đây.")}
            </p>
          </div>
          <button
            onClick={() => { void xinQuyenPopup(); }}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-[#3b1f00] font-extrabold rounded-xl text-[14px] flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Sparkles size={15} />
            <span>{t("Mở Cài đặt để bật")}</span>
          </button>
        </>
      )}
    </div>
  );
}

/**
 * TỰ BẮT TIN NHẮN ĐẾN — quyền đọc thông báo.
 *
 * ══════════ ĐÂY LÀ QUYỀN NHẠY CẢM NHẤT TRONG APP ══════════
 *
 * `BIND_NOTIFICATION_LISTENER_SERVICE` đọc được MỌI thông báo trên máy. Lớp
 * native đã thu hẹp hết mức: chỉ lấy từ 7 app nhắn tin, giữ tối đa 20 tin,
 * TRONG BỘ NHỚ, không ghi ra tệp và không gửi đi đâu (§6.9).
 *
 * ⚠️ VÀ NÓ KHÔNG TỰ KIỂM. Tin bắt được nằm chờ tới khi bác BẤM. Tự gửi mọi tin
 * nhắn đến máy chủ ngay khi nhận là biến một tính năng trợ giúp thành một đường
 * ống dữ liệu — §12 cấm tự bật thay chủ tài khoản, và tinh thần ở đây là như
 * nhau: máy không quyết định thay bác.
 *
 * ⚠️ NÓI THẲNG APP ĐỌC ĐƯỢC GÌ, TRƯỚC KHI XIN. Không "để Khoan Đã bảo vệ bác
 * tốt hơn" rồi im chuyện nó đọc thông báo. Bác phải biết mình đang cho phép gì.
 */
function DocTinNhanNative({ t, onAnalyze }: { t: any; onAnalyze?: (text: string) => void }) {
  const [quyen, setQuyen] = useState<QuyenNative>('chua_bat');
  const [dangLay, setDangLay] = useState(false);
  const [khongCoTin, setKhongCoTin] = useState(false);

  const doLai = () => { void quyenDocThongBao().then(setQuyen); };

  useEffect(() => {
    doLai();
    const khiHien = () => { if (document.visibilityState === 'visible') doLai(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => document.removeEventListener('visibilitychange', khiHien);
  }, []);

  const kiemTinMoi = async () => {
    setDangLay(true);
    setKhongCoTin(false);
    try {
      const tin = await tinMoiNhat();
      /*
       * ⚠️ §4.3 — "CHƯA BẮT ĐƯỢC TIN NÀO" KHÁC "TIN NÀY KHÔNG SAO".
       * Không có tin thì nói KHÔNG CÓ TIN, đừng gửi chuỗi rỗng đi kiểm rồi hiện
       * "Chưa thấy dấu hiệu rủi ro" — đó là trả lời một câu chưa ai hỏi, và câu
       * trả lời đó nghe như một lời bảo đảm.
       */
      if (!tin?.co || !tin.noiDung) {
        setKhongCoTin(true);
        return;
      }
      onAnalyze?.(tin.noiDung);
    } finally {
      setDangLay(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 shadow-md border border-[#e9d5ff] mb-5">
      <h3 className="font-black text-[16px] text-[#311068] mb-1 flex items-center gap-2">
        <Bell size={18} className="text-[#6d28d9]" />
        {t("Tự bắt tin nhắn đến")}
      </h3>

      {/*
        Nói đủ ba điều TRƯỚC khi xin: đọc gì, giữ bao lâu, có gửi đi không.
      */}
      <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
        {t("Khoan Đã đọc thông báo tin nhắn mới (Tin nhắn, Zalo, Messenger…) để bác chạm một cái là kiểm được ngay, không phải chép tay. Tin chỉ nằm trong máy bác và chỉ được gửi đi kiểm khi bác bấm.")}
      </p>

      {quyen === 'da_bat' ? (
        <>
          <div className="flex items-center gap-2 mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="text-[14px] font-extrabold text-emerald-900">{t("Đang bật")}</span>
          </div>

          {khongCoTin && (
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl mb-3">
              <p className="text-[14px] text-slate-700 leading-snug">
                {t("Chưa bắt được tin nhắn nào. Bác thử sau khi có tin mới đến nhé.")}
              </p>
            </div>
          )}

          <button
            onClick={kiemTinMoi}
            disabled={dangLay}
            className="w-full min-h-[52px] px-4 mb-2.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:opacity-95 active:scale-95 disabled:opacity-60 text-white font-extrabold rounded-xl text-[15px] transition-all"
          >
            {dangLay ? t("Đang lấy…") : t("Kiểm tin nhắn mới nhất")}
          </button>

          {/*
            ⚠️ §6.9 — LỐI XOÁ PHẢI Ở NGAY ĐÂY, KHÔNG CHÔN TRONG CÀI ĐẶT SÂU.
            Bác cho app đọc tin nhắn thì bác phải rút lại được dễ như lúc cho.
          */}
          <button
            onClick={() => { void xoaTinDaBat(); setKhongCoTin(false); }}
            className="w-full min-h-[52px] px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl text-[14px] transition-all"
          >
            {t("Xoá các tin đã bắt")}
          </button>
        </>
      ) : quyen === 'khong_ho_tro' ? (
        <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-2xl">
          <p className="text-[14px] text-slate-700 leading-relaxed">
            {t("Máy này chưa dùng được phần đọc thông báo. Bác vẫn gõ chữ hoặc gửi ảnh để kiểm bình thường.")}
          </p>
        </div>
      ) : (
        <>
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl mb-3">
            <p className="text-[14px] text-amber-900 leading-relaxed">
              {t("Chưa bật. Bấm nút dưới đây, máy mở màn Cài đặt — bác tìm dòng Khoan Đã rồi gạt sang bật, xong quay lại đây.")}
            </p>
          </div>
          <button
            onClick={() => { void xinQuyenDocThongBao(); }}
            className="w-full min-h-[52px] px-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:opacity-95 active:scale-95 text-[#3b1f00] font-extrabold rounded-xl text-[15px] transition-all"
          >
            {t("Mở Cài đặt để bật")}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * NHẮC KHI CUỘC GỌI KÉO DÀI — công tắc và lời giải trình.
 *
 * ⚠️ MÀN NÀY PHẢI NÓI TRƯỚC KHI XIN, VÀ NÓI ĐỦ BA ĐIỀU.
 *
 * Bác sắp cho một ứng dụng quyền biết mình có đang gọi điện hay không. Đó là
 * một quyền nghe rất đáng sợ nếu không giải thích, và đáng sợ đúng — nhiều app
 * xin nó để làm chuyện khác hẳn. Nên phải nói thẳng ba điều app KHÔNG làm:
 * không nghe, không ghi âm, không biết số nào.
 *
 * Giấu ba điều đó đi để bác dễ bấm đồng ý hơn là một cách để có thêm người
 * dùng, và là cách chắc chắn nhất để mất họ lúc họ đọc kỹ.
 */
function NhacCuocGoiDai({ t, lang }: { t: any; lang: Lang }) {
  const [dangBat, setDangBat] = useState(false);
  const [coQuyen, setCoQuyen] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const doLai = () => {
    void trangThaiTheoDoiCuocGoi().then((r) => {
      if (!r) return;
      setDangBat(r.dangBat);
      setCoQuyen(r.coQuyen);
    });
  };

  useEffect(() => {
    doLai();
    const khiHien = () => { if (document.visibilityState === 'visible') doLai(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => document.removeEventListener('visibilitychange', khiHien);
  }, []);

  const lat = async () => {
    const muon = !dangBat;
    setLoi(null);

    /*
     * ⚠️ NẠP CHỮ TRƯỚC KHI BẬT — §11.
     * Service sẽ cần chữ lúc app đã đóng. Nạp sau khi bật thì có một khoảng
     * thời gian service chạy mà không có gì để hiện, và nó im lặng bỏ qua lời
     * nhắc đầu tiên — đúng lời nhắc quan trọng nhất.
     */
    if (muon) {
      await napChuCuocGoi({
        tieuDe: tra(NHAC_CUOC_GOI, 'tieu_de', lang) ?? '',
        noiDung: tra(NHAC_CUOC_GOI, 'noi_dung', lang) ?? '',
        nutMo: tra(NHAC_CUOC_GOI, 'nut_mo', lang) ?? '',
        nutOn: tra(NHAC_CUOC_GOI, 'nut_on', lang) ?? '',
      });
    }

    const r = await datTheoDoiCuocGoi(muon);
    setDangBat(r.dangBat);
    if (muon && !r.dangBat) setLoi(r.maLoi ?? 'KHONG_BAT_DUOC');
    doLai();
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 shadow-md border border-[#e9d5ff] mb-5">
      <h3 className="font-black text-[16px] text-[#311068] mb-1 flex items-center gap-2">
        <PhoneCall size={18} className="text-[#6d28d9]" />
        {t('Nhắc khi cuộc gọi kéo dài')}
      </h3>

      <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
        {t('Các vụ lừa đảo giả danh công an thường kéo dài hàng giờ trong một cuộc gọi, và bác được dặn là không được tắt máy. Sau 25 phút, Khoan Đã hiện một dòng hỏi bác: có ai đang bảo bác chuyển tiền không?')}
      </p>

      {/*
        ⚠️ BA DÒNG NÀY KHÔNG ĐƯỢC RÚT GỌN. Chúng là lý do bác đồng ý — hoặc từ
        chối — một cách hiểu chuyện. Bỏ chúng đi để màn hình gọn hơn là lấy mất
        của bác thứ duy nhất giúp bác quyết định đúng.
      */}
      <ul className="flex flex-col gap-1 mb-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
        <li className="text-[14px] text-slate-700 leading-snug">{t('· Khoan Đã KHÔNG nghe cuộc gọi.')}</li>
        <li className="text-[14px] text-slate-700 leading-snug">{t('· KHÔNG ghi âm, không lưu lại gì.')}</li>
        <li className="text-[14px] text-slate-700 leading-snug">{t('· KHÔNG biết ai đang gọi cho bác — chỉ đếm thời gian.')}</li>
      </ul>

      {loi && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl mb-3">
          <p className="text-[14px] text-amber-900 leading-snug">
            {loi === 'CHUA_CO_QUYEN_CUOC_GOI'
              ? t('Máy chưa cho Khoan Đã biết lúc nào bác đang gọi điện. Bác vào Cài đặt của máy › Ứng dụng › Khoan Đã › Quyền › Điện thoại để bật.')
              : t('Máy chưa cho Khoan Đã chạy nền. Một số điện thoại cần bật thêm trong phần Tiết kiệm pin.')}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between p-3.5 bg-purple-50 rounded-2xl border border-purple-200">
        <span className="text-[15px] font-extrabold text-[#311068]">
          {dangBat ? t('Đang trông chừng') : t('Đang tắt')}
        </span>
        <button
          onClick={lat}
          aria-label={dangBat ? t('Tắt nhắc cuộc gọi dài') : t('Bật nhắc cuộc gọi dài')}
          className={`w-16 h-9 rounded-full transition-colors relative shadow-inner p-1 ${dangBat ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <motion.div
            className="w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-emerald-700"
            animate={{ x: dangBat ? 28 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {dangBat ? <CheckCircle2 size={16} /> : null}
          </motion.div>
        </button>
      </div>

      {dangBat && !coQuyen && (
        <p className="text-[14px] text-amber-800 leading-snug mt-2">
          {t('Bác đã bật, nhưng máy vừa rút quyền — lời nhắc sẽ không hiện.')}
        </p>
      )}
    </div>
  );
}

function NotificationsView({ 
  setView, 
  t, 
  pinnedNotification, 
  togglePinnedNotification,
  pinnedActionType = 'both',
  setPinnedActionType,
  onTriggerEmergency,
  onSendTestNotification,
  showInAppBanner,
  setShowInAppBanner,
  loiThongBaoNative,
  dangChayApk,
  onAnalyzeText,
  lang = 'vi'
}: { 
  setView: (v: ViewState) => void, 
  t: any, 
  pinnedNotification?: boolean, 
  togglePinnedNotification?: () => void,
  pinnedActionType?: 'both' | 'app' | 'danger',
  setPinnedActionType?: (type: 'both' | 'app' | 'danger') => void,
  onTriggerEmergency?: () => void,
  onSendTestNotification?: () => void,
  showInAppBanner?: boolean,
  setShowInAppBanner?: (val: boolean) => void,
  /** Vì sao công tắc không bật lên được. `null` = không có gì để nói (§4.3). */
  loiThongBaoNative?: string | null,
  /** Bản APK hay bản web — hai nơi có khả năng KHÁC NHAU, và phải nói khác nhau. */
  dangChayApk?: boolean,
  /** Gửi một đoạn chữ đi kiểm — dùng cho tin nhắn bắt được từ thông báo. */
  onAnalyzeText?: (text: string) => void,
  /** §11 — chữ nạp xuống lớp native phải theo đúng ngôn ngữ bác đang dùng. */
  lang?: Lang
}) {
  const [testSentToast, setTestSentToast] = useState(false);
  const [pipActiveToast, setPipActiveToast] = useState(false);

  const handleTestNotification = () => {
    if (onSendTestNotification) {
      onSendTestNotification();
    }
    setTestSentToast(true);
    setTimeout(() => setTestSentToast(false), 3500);
  };

  const handleLaunchPipFromSettings = async () => {
    try {
      // @ts-ignore
      if (window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === 'function') {
        // @ts-ignore
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 340,
          height: 240,
        });
        const pipDoc = pipWindow.document;
        pipDoc.title = 'Khoan Đã • Cửa sổ nổi';
        pipDoc.body.innerHTML = `
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            .badge-live {
              background: rgba(16, 185, 129, 0.2);
              border: 1px solid #10b981;
              color: #6ee7b7;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 99px;
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
            }
            .btn-camera { background: linear-gradient(135deg, #7e22ce, #9333ea); border-color: #c084fc; }
            .btn-danger { background: linear-gradient(135deg, #b91c1c, #dc2626); border-color: #f87171; }
            .btn-voice { background: linear-gradient(135deg, #4338ca, #6366f1); border-color: #a5b4fc; }
            .btn-home { background: linear-gradient(135deg, #15803d, #16a34a); border-color: #86efac; }
          </style>
          <div class="header">
            <strong style="font-size: 12px;">🛡️ Khoan Đã Nổi Ngoài OS</strong>
            <span class="badge-live">🟢 Đang nổi</span>
          </div>
          <div class="grid-btns">
            <button id="pipCam" class="btn btn-camera"><span>📸 Quét Ảnh / QR</span></button>
            <button id="pipSos" class="btn btn-danger"><span>🚨 Dừng 60s SOS</span></button>
            <button id="pipVoice" class="btn btn-voice"><span>🎙️ Giọng Nói</span></button>
            <button id="pipHome" class="btn btn-home"><span>🏠 Mở Ứng Dụng</span></button>
          </div>
          <div style="font-size: 9px; color: #d8b4fe; text-align: center; margin-top: 4px;">
            Luôn hiển thị trên mọi ứng dụng và màn hình desktop
          </div>
        `;
        const cam = pipDoc.getElementById('pipCam');
        if (cam) cam.onclick = () => { window.focus(); setView('home'); };
        const sos = pipDoc.getElementById('pipSos');
        if (sos) sos.onclick = () => { window.focus(); if (onTriggerEmergency) onTriggerEmergency(); else setView('warning'); };
        const voi = pipDoc.getElementById('pipVoice');
        if (voi) voi.onclick = () => { window.focus(); setView('voice'); };
        const hom = pipDoc.getElementById('pipHome');
        if (hom) hom.onclick = () => { window.focus(); setView('home'); };

        setPipActiveToast(true);
        setTimeout(() => setPipActiveToast(false), 4000);
      } else {
        // Trigger simulation
        setView('home');
      }
    } catch (e) {
      console.warn('PiP launch:', e);
      setView('home');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      /*
        ⚠️ `[&>*]:shrink-0` — KHÔNG PHẢI TRANG TRÍ. LỖI ĐO ĐƯỢC 19/8/2026 TRÊN
        MÁY THẬT (máy ảo Android 14, 360dp).

        Đây là một hộp `flex flex-col` CÓ CUỘN. Trong flex, con mặc định
        `flex-shrink: 1` — nghĩa là khi tổng chiều cao của chúng vượt quá hộp,
        trình duyệt KHÔNG cho cuộn trước, mà NÉN các con lại cho vừa.

        Với thẻ có `overflow-hidden`, nén không làm chữ tràn ra — nó CẮT SẠCH
        nội dung bên trong. Kết quả đo được: hai thẻ "Nhắc cảnh giác" và "Dải
        cảnh báo đè lên màn hình" teo thành hai dải cao chừng 60px, mất cả mô
        tả lẫn NÚT BẬT nằm trong đó. Thẻ vẫn ở đúng chỗ, tiêu đề vẫn đọc được,
        nên nhìn qua tưởng là thiết kế cố ý.

        Hệ quả thật: không có đường nào bật được dải cảnh báo đè màn hình — nút
        đã bị cắt mất. Tính năng có, mã chạy, mà người dùng không với tới được.

        ⚠️ ĐỪNG GỠ. Thêm thẻ mới vào màn này thì nó tự động được bảo vệ; gỡ ra
        là lỗi quay lại, và nó quay lại một cách IM LẶNG.
      */
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-start overflow-y-auto [&>*]:shrink-0 px-4 sm:px-6 pt-10 pb-28"
    >
      {/* Top Bar */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-4">
        <button 
          onClick={() => setView('profile')}
          className="p-2.5 bg-white/80 rounded-2xl shadow-sm text-[#6d28d9] active:scale-95 transition-all flex items-center gap-1 font-bold text-[14px]"
        >
          <ChevronLeft size={20} />
          <span>{t("Quay lại")}</span>
        </button>
        <span className="text-[14px] font-extrabold text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
          {t("Cài đặt thông báo")}
        </span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-[#3b1d7d] mb-1 text-center">
        {t("Thông báo & Cửa sổ nổi")}
      </h2>
      <p className="text-[14px] sm:text-sm text-purple-800/80 mb-5 text-center max-w-xs font-medium">
        {t("Ghim cố định trên khay hệ thống để truy cập tức thì hoặc kích hoạt cảnh giác khi gặp nguy hiểm")}
      </p>

      {/* Toast Alert: Notification Sent */}
      <AnimatePresence>
        {testSentToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-[420px] mb-4 bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center gap-2.5 text-[14px] font-bold"
          >
            <CheckCircle2 size={18} className="shrink-0 text-emerald-200" />
            <span>{t("Đã gửi thông báo thử nghiệm! Bác hãy kiểm tra thanh thông báo của máy.")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert: PiP Launched */}
      <AnimatePresence>
        {pipActiveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-[420px] mb-4 bg-purple-700 text-white p-3.5 rounded-2xl shadow-lg flex items-center gap-2.5 text-[14px] font-bold"
          >
            <Sparkles size={18} className="shrink-0 text-amber-300" />
            <span>Đã bật Cửa Sổ Nổi ngoài màn hình! Bác có thể dùng đồng thời khi mở app khác.</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. Main Ongoing Notification Feature Card */}
      <div className="w-full max-w-[420px] bg-gradient-to-br from-purple-950 via-indigo-950 to-[#2e1065] rounded-[28px] p-5 sm:p-6 shadow-xl border border-purple-400/40 text-white mb-5 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Zap size={26} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white leading-tight">{t("Nhắc cảnh giác trên thanh thông báo")}</h3>
              {/*
                ⚠️ §11 — HAI NƠI CHẠY, HAI KHẢ NĂNG KHÁC NHAU, HAI CÂU KHÁC NHAU.

                Bản web: `new Notification()` sống theo trang. Đóng trình duyệt
                là mất. Bản APK: `ThongBaoThuongTruc` là ongoing notification
                thật của Android, có `setOngoing(true)` — nó ở lại kể cả khi app
                đã đóng hẳn.

                Dùng chung một câu thì một trong hai luôn là lời khai sai. Nói
                "chỉ hiện khi còn mở" ở bản APK là hạ thấp thứ mình làm được;
                nói "luôn ở đó" ở bản web là hứa một thứ không có — và cái sau
                mới là cái nguy hiểm, vì bác tin có một lối tắt chờ sẵn.
              */}
              <span className="inline-block text-[14px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-300/30 mt-0.5">
                {dangChayApk ? t("Ở lại cả khi đã đóng app") : t("Chỉ hiện khi Khoan Đã còn mở")}
              </span>
            </div>
          </div>
        </div>

        <p className="text-[14px] text-purple-200 leading-relaxed mb-4 relative z-10">
          {/*
            ⚠️ §11 — NÓI ĐÚNG THỨ `new Notification()` LÀM ĐƯỢC.
            Câu cũ ghi thông báo "luôn ở nguyên trên thanh thông báo, không bị
            xoá hay trôi mất". Notification API của trình duyệt KHÔNG làm được
            điều đó: đóng tab hoặc tắt trình duyệt là thông báo biến mất, và nó
            không ghim được.

            Thông báo tồn tại khi app đã đóng cần Push API + service worker +
            khoá VAPID. `backend/src/push.js` đã dựng sẵn phần máy chủ, nhưng
            frontend chưa nối vào — nên tới khi nối xong, câu chữ ở đây phải nói
            đúng cái đang có.
          */}
          {dangChayApk
            ? t("Khi được bật, Khoan Đã giữ một dòng trên thanh thông báo để bác chạm vào là mở được app ngay. Dòng này ở lại kể cả khi app đã đóng.")
            : t("Khi được bật, Khoan Đã hiện một thông báo để bác chạm vào là mở được app ngay. Thông báo này chỉ còn khi Khoan Đã đang mở — đóng trình duyệt là nó mất.")}
        </p>

        {/*
          ⚠️ §4.3 — BẬT HỤT PHẢI NÓI RA, KHÔNG ĐƯỢC IM LẶNG QUAY VỀ TẮT.
          Công tắc tự nhảy về vị trí cũ mà không giải thích thì bác chỉ thấy
          "bấm mãi không được" và kết luận app hỏng. Lý do thật — Android chưa
          cho quyền gửi thông báo — kèm luôn đường đi tiếp (§6.7).
        */}
        {loiThongBaoNative && (
          <div className="mt-3 p-3.5 bg-amber-400/15 border border-amber-300/40 rounded-2xl relative z-10">
            {/*
              ⚠️ HAI CA KHÁC NHAU, HAI CÂU KHÁC NHAU — §4.3.

              `CHUA_CO_QUYEN_THONG_BAO`: bác vừa bấm bật và máy từ chối ngay.
              `BI_CHAN_SAU_KHI_BAT`: bác ĐÃ bật thành công trước đó, nhưng bây
              giờ nó không còn trên thanh nữa — ai đó tắt thông báo của app
              trong Cài đặt, hoặc ROM chặn ở tầng riêng của hãng.

              Ca thứ hai nguy hiểm hơn và dễ bị nuốt hơn: không có thao tác nào
              của bác gây ra nó, nên nếu app im lặng gạt công tắc về TẮT thì bác
              sẽ nghĩ mình quên bật — chứ không nghĩ là có thứ gì đó đã tắt nó.
            */}
            <p className="text-[15px] font-bold text-amber-100 leading-snug">
              {loiThongBaoNative === 'BI_CHAN_SAU_KHI_BAT'
                ? t("Lối tắt đã tắt mất. Bác bật lại thì nó chưa ở trên thanh thông báo.")
                : t("Chưa bật được: máy chưa cho Khoan Đã gửi thông báo.")}
            </p>
            <p className="text-[14px] text-amber-200/90 leading-relaxed mt-1">
              {t("Bác vào Cài đặt của máy › Ứng dụng › Khoan Đã › Thông báo và bật lên, rồi quay lại bấm công tắc này.")}
            </p>
          </div>
        )}

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-white/10 rounded-2xl border border-white/15 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${pinnedNotification ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'}`}></span>
            <span className="text-[14px] font-extrabold text-white">
              {pinnedNotification ? t("Đang BẬT túc trực 24/7") : t("Đang TẮT")}
            </span>
          </div>
          <button 
            onClick={togglePinnedNotification}
            className={`w-16 h-9 rounded-full transition-colors relative shadow-inner p-1 ${pinnedNotification ? 'bg-emerald-500' : 'bg-white/30'}`}
          >
            <motion.div 
              className="w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-emerald-700"
              animate={{ x: pinnedNotification ? 28 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {pinnedNotification ? <CheckCircle2 size={16} /> : null}
            </motion.div>
          </button>
        </div>

        {/*
          ⚠️ CHỈ NÓI BA ĐIỀU NÀY Ở BẢN APK, VÀ CHỈ KHI ĐANG BẬT THẬT.

          Cả ba đều là thứ chỉ bản cài đặt làm được, và cả ba đều đã đo được
          trên máy: `FLAG_NO_CLEAR` chống nút "Xoá tất cả" của ROM, `setOngoing`
          chống vuốt lẻ, `KhoiDongLai` dựng lại sau khi khởi động máy và sau khi
          cập nhật app.

          Hiện ba dòng này ở bản web là hứa ba thứ không tồn tại — Notification
          API của trình duyệt mất sạch khi đóng tab. Và hiện chúng lúc công tắc
          đang TẮT là mô tả một trạng thái không có thật.

          `pinnedNotification` ở đây đã được đồng bộ theo `dangHien` từ Android,
          không phải theo localStorage — nên "đang bật" ở đây là đang bật thật.
        */}
        {dangChayApk && pinnedNotification && !loiThongBaoNative && (
          <div className="mt-3 p-3.5 bg-emerald-400/15 border border-emerald-300/40 rounded-2xl relative z-10">
            <p className="text-[15px] font-bold text-emerald-100 leading-snug mb-1.5">
              {t("Dòng nhắc đã được ghim cố định")}
            </p>
            <ul className="space-y-1">
              <li className="text-[14px] text-emerald-50/90 leading-relaxed">
                {t("· Không vuốt mất được, kể cả khi bác bấm Xoá tất cả thông báo.")}
              </li>
              <li className="text-[14px] text-emerald-50/90 leading-relaxed">
                {t("· Tắt máy rồi bật lại, Khoan Đã tự đặt nó về chỗ cũ.")}
              </li>
              <li className="text-[14px] text-emerald-50/90 leading-relaxed">
                {t("· Muốn bỏ thì gạt công tắc ở ngay trên — luôn tắt được.")}
              </li>
            </ul>
          </div>
        )}
      </div>

      {/*
        2. CỬA SỔ NỔI — HAI ĐƯỜNG HOÀN TOÀN KHÁC NHAU, KHÔNG PHẢI MỘT TÍNH NĂNG
        CÓ HAI GIAO DIỆN.

        · Bản web dùng `documentPictureInPicture`: CHỈ có trên Chrome/Edge máy
          tính, và cửa sổ đó nổi trên các cửa sổ khác CỦA MÁY TÍNH.
        · Bản APK dùng `SYSTEM_ALERT_WINDOW`: nổi đè lên app khác trên điện
          thoại, kể cả màn hình cuộc gọi đến — đúng lúc bác cần nhất.

        ⚠️ ĐỪNG GỘP HAI THỨ NÀY LÀM MỘT DÒNG CHỮ. Chúng khác nhau ở chỗ quan
        trọng nhất: cái nào chạy được trên máy bác đang cầm. Gộp lại là hứa với
        người dùng điện thoại một thứ bản web không có (§11).
      */}
      {dangChayApk ? (
        <CuaSoNoiNative t={t} />
      ) : (
      <div className="w-full max-w-[420px] bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white rounded-[26px] p-5 shadow-lg border border-purple-400/50 mb-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/30 border border-purple-300/40 flex items-center justify-center text-purple-200 shrink-0">
              <Maximize2 size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-[15px] text-white leading-tight">{t("Cửa sổ nổi — chỉ trên máy tính")}</h3>
              <p className="text-[14px] text-purple-200">{t("Chrome hoặc Edge trên máy tính. Điện thoại chưa có cửa sổ nổi.")}</p>
            </div>
          </div>
        </div>

        <p className="text-[14px] text-purple-100/90 leading-relaxed mb-3">
          {/*
            ⚠️ §11 — CỬA SỔ NỔI CHỈ CHẠY TRÊN MÁY TÍNH.
            `documentPictureInPicture` là API thật, và mã đã kiểm tra hỗ trợ
            trước khi gọi. Nhưng nó CHỈ có trên Chrome/Edge bản máy tính —
            Android và iOS không có API này.

            Câu cũ hứa "luôn nổi trên mọi ứng dụng khác ngoài điện thoại", tức
            hứa đúng thứ web không làm được. Nổi đè lên app khác trên Android cần
            quyền `SYSTEM_ALERT_WINDOW`, chỉ app cài đặt mới xin được — đó là lý
            do bản APK tồn tại.
          */}
          {t("Trên máy tính, cửa sổ nhỏ này nổi trên các cửa sổ khác để bác bấm nhanh. Trên điện thoại, web chưa làm được việc đó — cần bản cài đặt.")}
        </p>

        <button
          onClick={handleLaunchPipFromSettings}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-extrabold rounded-xl text-[14px] flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Sparkles size={15} />
          <span>{t("Mở cửa sổ nổi")}</span>
        </button>
      </div>
      )}

      {/*
        3. TỰ BẮT TIN NHẮN ĐẾN — CHỈ CÓ Ở BẢN CÀI ĐẶT.
        Web không có cách nào đọc thông báo của app khác, và cũng không nên có.
        Hiện khối này ở bản web là bày ra một tính năng không tồn tại (§11).
      */}
      {dangChayApk && <DocTinNhanNative t={t} onAnalyze={onAnalyzeText} />}

      {/*
        Chỉ bản APK. Web không có cách nào biết máy đang gọi điện, và cũng không
        nên có — bày ra công tắc này ở bản web là hứa một thứ không tồn tại.
      */}
      {dangChayApk && <NhacCuocGoiDai t={t} lang={lang} />}

      {/* 4. Action Mode Selector */}
      <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 shadow-md border border-[#e9d5ff] mb-5">
        <h3 className="font-black text-[16px] text-[#311068] mb-1 flex items-center gap-2">
          <Sliders size={18} className="text-[#6d28d9]" />
          {t("Chọn hành động khi bấm vào thông báo:")}
        </h3>
        <p className="text-[14px] text-slate-500 mb-4">
          {t("Bác có thể tùy chọn để chạm vào sẽ mở ứng dụng hoặc bật ngay cảnh giác khẩn cấp:")}
        </p>

        <div className="space-y-3">
          {/* Option 1: Dual mode (Recommended) */}
          <div 
            onClick={() => setPinnedActionType?.('both')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
              pinnedActionType === 'both' 
                ? 'bg-purple-50/80 border-purple-600 shadow-sm' 
                : 'bg-gray-50/70 border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
              pinnedActionType === 'both' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-400'
            }`}>
              {pinnedActionType === 'both' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-[14px] text-[#1e1b4b]">{t("Chế độ Kép thông minh")}</span>
                <span className="text-[14px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full border border-amber-300">{t("Khuyên dùng")}</span>
              </div>
              <p className="text-[14px] text-slate-600 mt-1 leading-snug">
                {t("Trên thông báo có sẵn cả 2 nút: [🏠 Vào App] và [🚨 Báo nguy hiểm SOS] để bác chọn bất cứ lúc nào.")}
              </p>
            </div>
          </div>

          {/* Option 2: Quick App Access */}
          <div 
            onClick={() => setPinnedActionType?.('app')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
              pinnedActionType === 'app' 
                ? 'bg-purple-50/80 border-purple-600 shadow-sm' 
                : 'bg-gray-50/70 border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
              pinnedActionType === 'app' ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-400'
            }`}>
              {pinnedActionType === 'app' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div className="flex-1">
              <span className="font-extrabold text-[14px] text-[#1e1b4b] block">{t("Mở ứng dụng ngay (Trang chủ)")}</span>
              <p className="text-[14px] text-slate-600 mt-1 leading-snug">
                {t("Chạm vào thông báo sẽ mở ngay màn hình chính Khoan Đã để hỏi trợ lý AI, chụp ảnh quét lừa đảo hoặc kiểm tra tin nhắn.")}
              </p>
            </div>
          </div>

          {/* Option 3: Danger / Emergency Alert */}
          <div 
            onClick={() => setPinnedActionType?.('danger')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
              pinnedActionType === 'danger' 
                ? 'bg-red-50/80 border-red-600 shadow-sm' 
                : 'bg-gray-50/70 border-gray-200 hover:border-red-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
              pinnedActionType === 'danger' ? 'border-red-600 bg-red-600 text-white' : 'border-gray-400'
            }`}>
              {pinnedActionType === 'danger' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div className="flex-1">
              <span className="font-extrabold text-[14px] text-[#1e1b4b] block">{t("Báo động & Cảnh giác khẩn cấp (Nguy hiểm 60s)")}</span>
              <p className="text-[14px] text-slate-600 mt-1 leading-snug">
                {t("Chạm vào thông báo sẽ mở ngay chế độ Cảnh báo Rủi ro cao 60 giây, dừng ngay chuyển tiền và hiện phím gọi người thân.")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. In-App Banner Setting Toggle */}
      {setShowInAppBanner && (
        <div className="w-full max-w-[420px] bg-white rounded-[24px] p-4 shadow-sm border border-[#e9d5ff] mb-5 flex items-center justify-between">
          <div className="flex flex-col pr-2">
            <span className="font-bold text-[#1e1b4b] text-[14px]">Hiển thị thanh ghim bên trong Web App</span>
            <span className="text-[#64748b] text-[14px]">Bật nếu muốn xem dải tím trên đầu trang web, tắt nếu chỉ muốn thông báo bên ngoài máy</span>
          </div>
          <button
            onClick={() => setShowInAppBanner(!showInAppBanner)}
            className={`w-12 h-7 rounded-full relative transition-colors shadow-inner shrink-0 ${showInAppBanner ? 'bg-[#8b5cf6]' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${showInAppBanner ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>
      )}

      {/* 5. Live Interactive Notification Preview Drawer */}
      <div className="w-full max-w-[420px] bg-slate-900 text-white rounded-[26px] p-5 shadow-lg border border-slate-700 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-extrabold text-purple-300 flex items-center gap-1.5">
            <Smartphone size={15} />
            {t("Mô phỏng thanh thông báo trên điện thoại")}
          </span>
          <span className="text-[14px] font-bold bg-purple-900/80 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full">
            {t("Bấm thử trực tiếp")}
          </span>
        </div>

        {/* The Notification Item on Lockscreen/Tray */}
        <div className="bg-white/95 text-slate-900 rounded-2xl p-4 shadow-md border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-700 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck size={14} />
              </div>
              <span className="font-black text-[14px] text-purple-950 uppercase tracking-wide">{t("Khoan Đã • Bảo vệ thường trực")}</span>
            </div>
            <span className="text-[14px] text-slate-400 font-medium">{t("Bây giờ • Ghim")}</span>
          </div>

          <p className="text-[14px] text-slate-700 font-medium leading-relaxed mb-3">
            {pinnedActionType === 'app'
              ? t("🛡️ Trợ lý túc trực: Chạm để mở ứng dụng Khoan Đã kiểm tra an toàn bất cứ lúc nào.")
              : pinnedActionType === 'danger'
                ? t("🚨 Cảnh giác khẩn cấp: Chạm khi gặp cuộc gọi lạ, bị giục chuyển tiền hoặc đe dọa!")
                : t("🛡️ Luôn ghim cố định: Chạm [Mở App] để vào kiểm tra hoặc [Nguy hiểm SOS] khi bị đe dọa.")}
          </p>

          {/* Action Buttons in Notification */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setView('home')}
              className="py-2 px-3 bg-purple-100 hover:bg-purple-200 active:scale-95 text-[#5b21b6] font-extrabold rounded-xl text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Home size={14} />
              <span>{t("🏠 Mở ứng dụng")}</span>
            </button>

            <button
              onClick={() => {
                if (onTriggerEmergency) {
                  onTriggerEmergency();
                } else {
                  setView('warning');
                }
              }}
              className="py-2 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold rounded-xl text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-red-500/30"
            >
              <ShieldAlert size={14} />
              <span>{t("🚨 Nguy hiểm SOS")}</span>
            </button>
          </div>
        </div>

        {/* Test Trigger Button */}
        <button
          onClick={handleTestNotification}
          className="w-full mt-3 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-purple-200 font-bold rounded-xl text-[14px] flex items-center justify-center gap-2 border border-white/15 transition-all"
        >
          <Bell size={14} className="text-amber-300" />
          <span>{t("🔔 Bắn thử thông báo thật ra máy")}</span>
        </button>
      </div>

      {/* 6. Other Standard Alert Toggles */}
      <div className="w-full max-w-[420px] bg-white rounded-[24px] p-5 shadow-sm border border-[#f3e8ff]">
        <h4 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider mb-4">{t("Các thông báo an toàn khác")}</h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col pr-2">
              <span className="font-bold text-[#1e1b4b] text-[14px]">{t("Cảnh báo rủi ro tức thì")}</span>
              <span className="text-[#64748b] text-[14px]">{t("Thông báo chuông khi phát hiện bẫy lừa đảo")}</span>
            </div>
            <div className="w-12 h-7 bg-[#8b5cf6] rounded-full relative shadow-inner shrink-0">
              <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
          
          <div className="w-full h-[1px] bg-[#f1f5f9]"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col pr-2">
              <span className="font-bold text-[#1e1b4b] text-[14px]">{t("Thông báo từ người thân")}</span>
              <span className="text-[#64748b] text-[14px]">{t("Nhận tin nhắn hỗ trợ từ con cháu")}</span>
            </div>
            <div className="w-12 h-7 bg-[#8b5cf6] rounded-full relative shadow-inner shrink-0">
              <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
          
          <div className="w-full h-[1px] bg-[#f1f5f9]"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col pr-2">
              <span className="font-bold text-[#1e1b4b] text-[14px]">{t("Cập nhật thủ đoạn mới")}</span>
              <span className="text-[#64748b] text-[14px]">{t("Bản tin cảnh giác phòng chống tội phạm")}</span>
            </div>
            <div className="w-12 h-7 bg-[#8b5cf6] rounded-full relative shadow-inner shrink-0">
              <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Device Data View ---
function DeviceDataView({ setView, t }: { setView: (v: ViewState) => void, t: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-start overflow-hidden px-6 pt-12"
    >
      <button aria-label={t("Quay lại")} 
        onClick={() => setView('profile')}
        className="absolute top-6 left-6 p-2 bg-white/60 rounded-full shadow-sm text-[#6d28d9] active:scale-95 transition-all"
      >
        <ChevronLeft size={24} />
      </button>
      <h2 className="text-3xl font-black text-[#3b1d7d] mt-2 mb-10 text-center">{t("Dữ liệu thiết bị")}</h2>
      
      <div className="w-full max-w-[360px] bg-white rounded-[20px] p-5 shadow-sm border border-[#f3e8ff]">
         <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-3">
               <Database size={32} className="text-[#8b5cf6]" />
            </div>
            <span className="font-black text-[#1e1b4b] text-[24px]">24.5 MB</span>
            <span className="text-[#64748b] text-[14px]">{t("Dung lượng đã sử dụng")}</span>
         </div>
         
         <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-[14px]">
               <span className="text-[#64748b]">{t("Lịch sử kiểm tra (Lưu tạm)")}</span>
               <span className="font-bold text-[#1e1b4b]">12.0 MB</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
               <span className="text-[#64748b]">{t("Bộ nhớ cache hệ thống")}</span>
               <span className="font-bold text-[#1e1b4b]">8.5 MB</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
               <span className="text-[#64748b]">{t("Cài đặt & Tùy chọn")}</span>
               <span className="font-bold text-[#1e1b4b]">4.0 MB</span>
            </div>
         </div>
         
         <div className="w-full h-[1px] bg-[#f1f5f9] my-6"></div>
         
         <button className="w-full py-4 bg-[#f8f4ff] text-[#6d28d9] rounded-[16px] font-bold text-[15px] active:bg-[#f3e8ff] transition-colors">
            {t("Xóa bộ nhớ đệm")}
         </button>
      </div>
    </motion.div>
  );
}

// --- Profile View ---
function ProfileView({ setView, t, isLoggedIn, setIsLoggedIn }: { setView: (v: ViewState) => void, t: any, isLoggedIn: boolean, setIsLoggedIn: (v: boolean) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col w-full relative z-10 pt-10 pb-24 px-5 overflow-y-auto"
    >
      <div className="flex flex-col items-center mb-6">
         <h2 className="text-[28px] font-black text-[#1e1b4b] text-center">{t("Hồ sơ của bác")}</h2>
      </div>

      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white/60 rounded-3xl border border-white shadow-sm mt-4">
           <User size={48} className="text-[#c084fc] mb-4 opacity-50" />
           <p className="text-[#3b1d7d] font-bold text-lg mb-2">{t("Chưa có dữ liệu")}</p>
           <p className="text-center text-[#6d28d9]/70 text-sm font-medium px-8 mb-6">{t("Vui lòng đăng nhập để xem thông tin")}</p>
           <button onClick={() => setView('login')} className="px-8 py-3 bg-gradient-to-r from-[#9333ea] to-[#7e22ce] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">
             {t("Đăng nhập")}
           </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[28px] p-5 flex gap-5 items-center shadow-sm border border-[#f3e8ff] mb-6">
            <div className="w-[84px] h-[84px] rounded-full bg-[#f3e8ff] overflow-hidden border-[3px] border-[#d8b4fe]">
               {/* Ảnh cục bộ / biểu tượng — không gọi ra máy chủ lạ. Xem CSP `img-src`. */}
               <div className="w-full h-full flex items-center justify-center text-[#7e22ce]">
                 <UserCircle size={52} />
               </div>
            </div>
            <div className="flex-1">
              {/*
                ⚠️ KHÔNG DỰNG SẴN MỘT CÁI TÊN. Bản trước hiện cứng "Nguyễn Văn
                An" cho mọi máy — bác mở màn hồ sơ và thấy tên người lạ ở chỗ
                đáng lẽ là tên mình. Với người cao tuổi, chuyện đó không đọc ra
                là "dữ liệu mẫu"; nó đọc ra là máy đang nhầm mình với ai khác.

                Chưa có tên thì nói chưa có. Ô nhập tên nằm ngay trong màn Tài
                khoản bên dưới.
              */}
              <h3 className="font-extrabold text-[#1e1b4b] text-[22px] mb-1">
                {t("Bác chưa đặt tên")}
              </h3>
              <div className="inline-flex items-center gap-1.5 bg-[#f3e8ff] text-[#7e22ce] px-3 py-1.5 rounded-lg text-[14px] font-bold">
                 <Lock size={14} /> {t("Thiết bị hiện tại")}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <div onClick={() => setView('account')} className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-[#f3e8ff] active:bg-[#f8f4ff] cursor-pointer transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center text-white shadow-sm">
                   <User size={24} fill="currentColor" />
                 </div>
                 <span className="font-bold text-[#1e1b4b] text-[17px]">{t("Tài khoản")}</span>
               </div>
               <ChevronRight className="text-[#c084fc]" />
             </div>
             
             <div onClick={() => setView('privacy')} className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-[#f3e8ff] active:bg-[#f8f4ff] cursor-pointer transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center text-white shadow-sm">
                   <ShieldCheck size={24} fill="currentColor" />
                 </div>
                 <span className="font-bold text-[#1e1b4b] text-[17px]">{t("Quyền riêng tư")}</span>
               </div>
               <ChevronRight className="text-[#c084fc]" />
             </div>
             
             <div onClick={() => setView('notifications')} className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-[#f3e8ff] active:bg-[#f8f4ff] cursor-pointer transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center text-white shadow-sm">
                   <Bell size={24} fill="currentColor" />
                 </div>
                 <span className="font-bold text-[#1e1b4b] text-[17px]">{t("Thông báo")}</span>
               </div>
               <ChevronRight className="text-[#c084fc]" />
             </div>
             
             <div onClick={() => setView('device_data')} className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-[#f3e8ff] active:bg-[#f8f4ff] cursor-pointer transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center text-white shadow-sm">
                   <Database size={24} fill="currentColor" />
                 </div>
                 <span className="font-bold text-[#1e1b4b] text-[17px]">{t("Dữ liệu trên thiết bị")}</span>
               </div>
               <ChevronRight className="text-[#c084fc]" />
             </div>
          </div>

          <button className="w-full mt-6 py-4 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-[20px] font-bold text-[16px] shadow-lg shadow-[#8b5cf6]/30 flex items-center justify-center gap-2 active:scale-95 transition-transform">
             <Settings size={20} /> {t("Chỉnh sửa hồ sơ")}
          </button>
        </>
      )}
    </motion.div>
  );
}

// --- Settings View ---
function SettingsView({ 
  setView, 
  t, 
  lang, 
  setLang, 
  fontSize, 
  setFontSize, 
  isLoggedIn, 
  setIsLoggedIn, 
  pinnedNotification, 
  togglePinnedNotification,
  showFloatingBall,
  setShowFloatingBall,
  onOpenOutsideMode
}: { 
  setView: (view: ViewState) => void, 
  t: any, 
  lang: Lang, 
  setLang: (l:Lang)=>void, 
  fontSize: string, 
  setFontSize: (s:string)=>void, 
  isLoggedIn: boolean, 
  setIsLoggedIn: (v:boolean)=>void, 
  pinnedNotification?: boolean, 
  togglePinnedNotification?: () => Promise<void> | void,
  showFloatingBall?: boolean,
  setShowFloatingBall?: (v: boolean) => void,
  onOpenOutsideMode?: () => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-start overflow-y-auto [&>*]:shrink-0 px-6 pt-12 pb-24"
    >
      <button aria-label={t("Quay lại")} 
        onClick={() => setView('home')}
        className="absolute top-6 left-6 p-2 bg-white/60 rounded-full shadow-sm text-[#6d28d9] active:scale-95 transition-all"
      >
        <ChevronLeft size={24} />
      </button>

      <h2 className="text-3xl font-black text-[#3b1d7d] mt-2 mb-8">{t("Cài đặt")}</h2>

      {/*
        MẬT KHẨU GIA ĐÌNH — đặt TRÊN CÙNG màn Cài đặt, không chôn xuống dưới.

        Đây là tính năng rẻ nhất và mạnh nhất trong cả app: nó không cần AI,
        không cần mạng, không xin quyền nào, và là thứ duy nhất ở đây mà một
        cuộc gọi video giả mặt con cháu không vượt qua được. Thứ tự trên màn
        hình là một lời phát biểu về mức quan trọng — để nó ở đáy là nói rằng
        nó phụ.
      */}
      <button
        onClick={() => setView('mat_khau_gia_dinh')}
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 shadow-md border-2 border-emerald-200 mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
          <Users size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[16px] text-[#311068] leading-snug">{t("Mật khẩu gia đình")}</h3>
          <p className="text-[14px] text-slate-600 leading-snug mt-0.5">
            {t("Câu chỉ nhà mình biết — chống giả giọng, giả mặt")}
          </p>
        </div>
        <ChevronRight size={20} className="text-emerald-600 shrink-0" />
      </button>

      {/* Floating Assistive Ball & Outside Mode Card */}
      <div className="w-full max-w-[360px] bg-gradient-to-br from-purple-900 to-indigo-950 rounded-3xl p-5 shadow-md border border-purple-400/30 text-white mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200">
            <Layers size={22} />
          </div>
          <div>
            {/*
              ⚠️ §11 — HAI CÂU NÀY TỪNG HỨA MỘT THỨ KHÔNG TỒN TẠI.

              Bản trước ghi "Bóng trợ năng NỔI NGOÀI MÀN HÌNH" và "Chụp ảnh /
              Quét tức thì KHI Ở APP KHÁC". Nút tròn đó là một phần tử React
              trong chính trang này — `FloatingQuickAccess.tsx` không gọi một
              lượt native nào. Đóng app là nó biến mất cùng app.

              Nổi đè lên app khác cần `SYSTEM_ALERT_WINDOW` và một View của
              Android (`PopupDeManHinh` làm đúng việc đó cho dải cảnh báo). Nút
              này chưa đi qua đường ấy.

              Hứa sai ở đây không phải lỗi thẩm mỹ: bác đọc xong tin rằng lúc
              đang ở Zalo mà thấy tin lạ thì có sẵn một nút để chạm. Lúc cần thì
              không có nút nào — và bác sẽ nghĩ mình bấm sai chỗ.
            */}
            <h3 className="font-extrabold text-[15px] text-white">{t("Nút tròn quét nhanh")}</h3>
            <span className="text-[14px] text-purple-300 font-semibold">{t("Nổi ở góc, trong lúc dùng Khoan Đã")}</span>
          </div>
        </div>

        <p className="text-[14px] text-purple-200 leading-relaxed mb-4">
          {t("Một nút tròn nổi ở góc màn hình khi bác đang mở Khoan Đã — chạm là quét ảnh hoặc mã QR ngay, không phải đi tìm menu. Nút này chỉ có trong Khoan Đã; ra ngoài app thì không còn.")}
        </p>

        {setShowFloatingBall && (
          <div className="flex items-center justify-between pt-3 border-t border-white/10 mb-3">
            <span className="text-[14px] font-bold text-white">
              {showFloatingBall ? t("Đang bật bóng trợ năng") : t("Đang tắt")}
            </span>
            <button 
              onClick={() => setShowFloatingBall(!showFloatingBall)}
              className={`w-12 h-7 rounded-full transition-colors relative p-0.5 ${showFloatingBall ? 'bg-emerald-500' : 'bg-white/30'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${showFloatingBall ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        )}

        {onOpenOutsideMode && (
          <button
            onClick={onOpenOutsideMode}
            className="w-full py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 border border-white/20"
          >
            <Smartphone size={15} /> {t("Thử màn hình khóa / Màn hình ngoài")}
          </button>
        )}
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-sm border border-[#e9d5ff] mb-6">
        <h3 className="text-xl font-bold text-[#4c1d95] mb-4">{t("Cỡ chữ")}</h3>
        <div className="flex justify-between items-center bg-[#f3e8ff] p-2 rounded-2xl">
          <button 
            onClick={() => setFontSize('small')}
            className={`flex-1 py-3 rounded-xl font-bold text-[15px] transition-all ${fontSize === 'small' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("Nhỏ")}
          </button>
          <button 
            onClick={() => setFontSize('normal')}
            className={`flex-1 py-3 rounded-xl font-bold text-[15px] mx-2 transition-all ${fontSize === 'normal' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("Vừa")}
          </button>
          <button 
            onClick={() => setFontSize('large')}
            className={`flex-1 py-3 rounded-xl font-bold text-[15px] transition-all ${fontSize === 'large' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("Lớn")}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-sm border border-[#e9d5ff] mb-6">
        <h3 className="text-xl font-bold text-[#4c1d95] mb-4">{t("Ngôn ngữ")}</h3>
        <div className="flex justify-between items-center bg-[#f3e8ff] p-2 rounded-2xl">
          <button 
            onClick={() => setLang('vi')}
            className={`flex-1 py-3 rounded-xl font-bold text-[15px] transition-all ${lang === 'vi' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("Tiếng Việt")}
          </button>
          <button 
            onClick={() => setLang('en')}
            className={`flex-1 py-3 rounded-xl font-bold text-[15px] ml-2 transition-all ${lang === 'en' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("English")}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[360px] mb-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-[#e9d5ff] shadow-sm flex flex-col overflow-hidden">
           <div 
             onClick={() => setView('notifications')}
             className="p-5 flex items-center justify-between border-b border-[#e9d5ff] cursor-pointer hover:bg-white/80 active:bg-purple-50 transition-colors"
           >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-[#6d28d9]">
                  <Bell size={22} />
                </div>
                <div>
                  <span className="font-bold text-[#311068] text-[16px] block">{t("Thông báo cảnh báo")}</span>
                  <span className="text-[14px] text-purple-700 font-semibold">
                    {pinnedNotification ? t("🛡️ Đang ghim cố định") : t("Tùy chỉnh thông báo")}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-purple-400" />
           </div>
           
           {isLoggedIn ? (
             <div onClick={() => setIsLoggedIn(false)} className="p-5 flex items-center gap-3 cursor-pointer active:bg-red-50 transition-colors">
                <LogOut size={22} className="text-[#ef4444]" />
                <span className="font-bold text-[#ef4444] text-[16px]">{t("Đăng xuất")}</span>
             </div>
           ) : (
             <div onClick={() => setView('login')} className="p-5 flex items-center gap-3 cursor-pointer active:bg-green-50 transition-colors">
                <User size={22} className="text-[#10b981]" />
                <span className="font-bold text-[#10b981] text-[16px]">{t("Đăng nhập")}</span>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Intro View ---
function IntroView({ 
  setView, 
  t,
  setUserRole 
}: { 
  setView: (view: ViewState) => void; 
  t: any;
  setUserRole?: (role: 'elder' | 'guardian') => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRoleModal, setShowRoleModal] = useState(true);

  const slides = [
    {
      logo: true,
      title: t("Khoan Đã"),
      desc: t("Cùng bác an toàn trong thế giới số"),
      image: "/minh-hoa-1.webp",
      button: t("Tiếp tục"),
    },
    {
      logo: false,
      title: t("Chào bác!"),
      desc: t("Khoan Đã đồng hành giúp bác nhận diện và xử lý rủi ro an toàn, dễ dàng."),
      image: "/minh-hoa-3.webp",
      button: t("Tiếp tục"),
    },
    {
      logo: true,
      title: t("Kiểm tra nhanh, phát hiện sớm"),
      desc: t("AI thông minh kiểm tra cuộc gọi, tin nhắn, đường link và giao dịch lạ."),
      image: "/minh-hoa-2.webp",
      button: t("Tiếp tục"),
    },
    {
      logo: false,
      title: t("Xử lý đơn giản, hướng dẫn rõ"),
      desc: t("Hướng dẫn bác từng bước xử lý an toàn và không bị thúc ép chuyển tiền."),
      image: "/minh-hoa-4.webp",
      button: t("Tiếp tục"),
    },
    {
      logo: true,
      title: t("Gia đình luôn bên cạnh"),
      desc: t("Kết nối nhanh người thân để được hỗ trợ và kiểm tra an tâm."),
      image: "/minh-hoa-5.webp",
      button: t("Bắt đầu sử dụng"),
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      if (setUserRole) setUserRole('elder');
      setView('home');
    }
  };

  const handleSelectRole = (role: 'elder' | 'guardian') => {
    if (setUserRole) setUserRole(role);
    setShowRoleModal(false);
    if (role === 'guardian') {
      setView('guardian');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col justify-between overflow-hidden select-none touch-none overscroll-none"
    >
      {/* Initial Role Selection Dialog */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-100 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 mb-2">
                <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              {/*
                ⚠️ MÀN NÀY CHỈ HỎI MỘT CÂU. Càng ít chữ càng tốt.
                Bản trước có năm khối chữ cho một lựa chọn hai nút: lời chào,
                câu hướng dẫn, hai dòng mô tả tính năng bị cắt cụt giữa chừng,
                và một dòng trấn an. Người phải đọc hết chỗ đó chính là người
                khó đọc nhất — và họ đọc nó trước khi thấy app làm được gì.
                Mô tả tính năng thuộc về lúc dùng, không thuộc màn hỏi tên vai.
              */}
              <h3 className="text-xl font-black text-[#1e1b4b] mb-5">{t("Ai đang dùng máy này?")}</h3>

              <div className="w-full space-y-3 mb-4">
                {/* Option 1: Elder */}
                <button
                  onClick={() => handleSelectRole('elder')}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-2 border-purple-200 flex items-center gap-3.5 text-left transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm">
                    👵
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-base text-purple-950">{t("Bác / bố mẹ")}</h4>
                    <p className="text-[14px] text-purple-800 font-medium mt-0.5">
                      {t("Chữ to, dễ bấm")}
                    </p>
                  </div>
                </button>

                {/* Option 2: Guardian (Child) */}
                <button
                  onClick={() => handleSelectRole('guardian')}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border-2 border-sky-200 flex items-center gap-3.5 text-left transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm">
                    🛡️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-base text-sky-950">{t("Con cháu")}</h4>
                    <p className="text-[14px] text-sky-800 font-medium mt-0.5">
                      {t("Trông chừng giúp bố mẹ")}
                    </p>
                  </div>
                </button>
              </div>

              <span className="text-[14px] text-slate-400">{t("Đổi lại lúc nào cũng được")}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Action Bar */}
      <div className="w-full flex justify-end items-center px-5 pt-4 pb-1 relative z-20 shrink-0 min-h-[44px] pointer-events-auto">
        {currentSlide < slides.length - 1 && (
          <button 
            onClick={() => {
              if (setUserRole) setUserRole('elder');
              setView('home');
            }} 
            className="text-[#6d28d9] font-bold text-[14px] active:scale-95 transition-transform bg-white/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-2xs border border-purple-100"
          >
            {t("Bỏ qua")}
          </button>
        )}
      </div>

      {/* Decorative ambient background */}
      <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-white rounded-full blur-3xl pointer-events-none select-none"></div>
      <div className="absolute bottom-[20%] right-[-20%] w-80 h-80 bg-[#d8b4fe]/25 rounded-full blur-3xl pointer-events-none select-none"></div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 overflow-hidden min-h-0 pointer-events-none select-none">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full flex flex-col items-center justify-center text-center my-auto pointer-events-none select-none"
          >
            <div className="mb-1 shrink-0">
              <h2 className="text-[24px] sm:text-[30px] font-black text-[#2e1065] leading-tight tracking-tight">
                {slides[currentSlide]?.title}
              </h2>
              <p className="text-[14px] sm:text-[14px] text-[#6b7280] font-medium mt-1 max-w-xs mx-auto leading-snug">
                {slides[currentSlide]?.desc}
              </p>
            </div>

            <div className="flex-1 w-full flex items-center justify-center min-h-0 max-h-[62vh] my-1">
              <motion.img 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                src={slides[currentSlide]?.image} 
                alt="Mascot illustration" 
                draggable={false}
                className="h-[45vh] max-h-[450px] w-auto max-w-[95%] sm:max-w-[480px] object-contain drop-shadow-[0_25px_50px_rgba(109,40,217,0.25)] scale-135 sm:scale-145 pointer-events-none select-none my-auto"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls Area - Guaranteed visible on all mobile viewports */}
      <div className="w-full px-6 pb-6 pt-2 flex flex-col items-center relative z-20 shrink-0 pointer-events-auto">
        {/* Step dots */}
        <div className="flex gap-2 mb-3.5">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-7 bg-[#7e22ce]' : 'w-2 bg-[#e9d5ff]'}`} 
            />
          ))}
        </div>

        {/* Continue button */}
        <button 
          onClick={handleNext} 
          className="w-full max-w-sm bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white py-3.5 rounded-2xl font-bold text-[16px] shadow-[0_8px_20px_rgba(109,40,217,0.25)] active:scale-95 transition-transform"
        >
          {slides[currentSlide]?.button}
        </button>
      </div>
    </motion.div>
  );
}

// --- Search View ---
/**
 * TIN LỪA ĐẢO GẦN ĐÂY — CHỈ CHUYỂN TIẾP TIÊU ĐỀ VÀ LIÊN KẾT CỦA BÁO.
 *
 * ⚠️ BA LUẬT, LẤY TỪ `src/tin-lua-dao.js`:
 *  · §11 — không tin nào được thiếu NGUỒN. Tin không có tên báo + đường dẫn thì
 *    không hiện; ở đây lọc lần nữa, vì một tin thiếu nguồn lọt qua là đúng thứ
 *    §11 cấm.
 *  · §4.3 — "chưa lấy được tin" KHÁC "không có tin nào". Danh sách rỗng KHÔNG
 *    được đọc thành "dạo này yên ổn".
 *  · §12 — không tóm tắt lại, không quy kết cá nhân. Ai muốn biết thì bấm sang
 *    báo đọc.
 */
function TinLuaDaoGanDay({ t, lang = 'vi' }: { t: any, lang?: Lang }) {
  const [tin, setTin] = useState<any[] | null>(null);
  const [chuaLayDuoc, setChuaLayDuoc] = useState<string[]>([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    let huy = false;
    (async () => {
      try {
        const res = await fetch(api('/api/tin-lua-dao'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        if (huy) return;
        // Lọc lần hai: thiếu tiêu đề, tên báo hoặc liên kết ⇒ không hiện.
        setTin((d.tin ?? []).filter((x: any) => x?.tieuDe && x?.nguon && x?.lienKet));
        setChuaLayDuoc(d.chuaLayDuoc ?? []);
      } catch {
        if (!huy) { setTin([]); setChuaLayDuoc(['khong_lay_duoc_tin_moi']); }
      } finally {
        if (!huy) setDangTai(false);
      }
    })();
    return () => { huy = true; };
  }, []);

  const cauChuaLayDuoc = traNhieu(CHUA_LAY_TIN, chuaLayDuoc, lang);

  return (
    <div className="w-full md:hidden mt-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-[#1e1b4b] text-[15px]">{t("Cảnh báo mới")}</h3>
      </div>

      {dangTai ? (
        <div className="bg-white rounded-2xl p-4 border border-purple-100 text-[14px] text-gray-600">
          {t("Đang lấy tin từ các báo…")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(tin ?? []).map((x: any) => (
            <a
              key={x.lienKet}
              href={x.lienKet}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-3 flex gap-2.5 shadow-2xs border border-purple-100 items-start"
            >
              <span className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <FileText size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-[#1e1b4b] text-[14px] leading-snug">{x.tieuDe}</span>
                {/* Nguồn luôn đi kèm — §11. */}
                <span className="block text-gray-600 text-[14px] font-semibold mt-0.5">{x.nguon}</span>
              </span>
            </a>
          ))}

          {/*
            §4.3 — nói ra chỗ mù. Rỗng vì chưa lấy được KHÁC rỗng vì không có tin,
            và câu chữ ở đây phải phân biệt được hai chuyện đó.
          */}
          {(tin ?? []).length === 0 && cauChuaLayDuoc.length === 0 && (
            <div className="bg-white rounded-2xl p-4 border border-purple-100 text-[14px] text-gray-700">
              {t("Chưa có tin nào lấy về được lúc này.")}
            </div>
          )}

          {cauChuaLayDuoc.length > 0 && (
            <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-3.5">
              <p className="text-[14px] font-black text-slate-800 mb-1 flex items-center gap-1.5">
                <EyeOff size={16} /> {t("Những thứ chưa kiểm được")}
              </p>
              <ul className="flex flex-col gap-1">
                {cauChuaLayDuoc.map((cau) => (
                  <li key={cau} className="text-[14px] text-slate-800 leading-snug">• {cau}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchView({
  setView,
  t,
  lang = 'vi',
  onAnalyze,
  isAnalyzing
}: {
  setView: (v: ViewState) => void,
  t: any,
  lang?: Lang,
  onAnalyze?: (text: string, image?: string | null) => void,
  isAnalyzing?: boolean
}) {
  const [searchInput, setSearchInput] = useState('');
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSearchImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunSearch = (customText?: string) => {
    const textToSend = customText || searchInput;
    if ((textToSend.trim() || searchImage) && onAnalyze) {
      onAnalyze(textToSend, searchImage);
    } else if (textToSend.trim() || searchImage) {
      setView('warning');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col w-full relative z-10 pt-6 md:pt-16 pb-24 lg:pb-10 px-4 md:px-12 lg:px-16 overflow-y-auto"
    >
      <input 
        type="file"
        hidden 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleImageUpload} 
      />

      <div className="md:hidden flex flex-col items-center mb-4">
         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xs mb-1.5 border border-purple-100">
            <Search size={22} className="text-[#6d28d9]" />
         </div>
         <h2 className="text-[22px] font-black text-[#1e1b4b] text-center leading-tight">{t("Kiểm tra an toàn")}</h2>
      </div>

      <div className="hidden md:flex flex-col items-center text-center mb-10 relative z-20">
         <h2 className="text-4xl font-black text-[#2e1065] tracking-tight mb-2">{t("Bác muốn kiểm tra điều gì?")}</h2>
         <p className="text-lg text-[#6b7280]">{t("Nhập nội dung, đường link hoặc chọn ảnh để AI phân tích an toàn.")}</p>
      </div>
      
      {/* Search Input Box */}
      <div className="w-full max-w-2xl mx-auto mb-4">
          {searchImage && (
            <div className="flex items-center gap-2 p-2 bg-purple-100/90 backdrop-blur-md rounded-2xl border border-purple-300 mb-2.5">
              <img src={searchImage} alt="Preview" className="w-10 h-10 object-cover rounded-xl border border-purple-400 shrink-0" />
              <div className="flex-1 overflow-hidden">
                <p className="text-[14px] font-bold text-purple-900 truncate">{t("Ảnh đính kèm đã sẵn sàng")}</p>
                <p className="text-[14px] text-purple-700 truncate">{t("Bấm nút kính lúp để quét")}</p>
              </div>
              <button aria-label={t("Đóng")} 
                onClick={() => setSearchImage(null)}
                className="w-7 h-7 flex items-center justify-center bg-white rounded-full text-purple-700 shadow-2xs shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="relative flex items-center bg-white rounded-2xl p-1.5 pl-2 pr-1.5 shadow-2xs border border-purple-100 focus-within:ring-2 ring-[#c084fc]/50 transition-all">
             <button 
               type="button"
               onClick={() => fileInputRef.current?.click()}
               className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0 ${searchImage ? 'bg-[#7e22ce] text-white shadow-xs' : 'text-[#6d28d9] hover:bg-[#f3e8ff]'}`}
               title={t("Chọn ảnh")}
             >
               <ImageIcon size={18} />
             </button>
             <input 
                 type="text" 
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
                 placeholder={t("Nhập link, số ĐT, tin nhắn...")} 
                 className="flex-1 bg-transparent border-none outline-none px-2.5 py-2 text-[#311068] placeholder:text-[#311068]/50 font-medium text-[14px]"
                 onKeyDown={(e) => { if(e.key === 'Enter') handleRunSearch(); }}
              />
             <button 
               onClick={() => handleRunSearch()}
               disabled={isAnalyzing}
               className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white shadow-xs active:scale-95 transition-transform shrink-0 disabled:opacity-50"
             >
                {isAnalyzing ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search size={16} strokeWidth={2.5} />
                )}
             </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-3 md:hidden">
             <button 
               onClick={() => {
                 setSearchInput("Tôi nhận được mã QR yêu cầu quét để nhận quà tri ân");
                 handleRunSearch("Tôi nhận được mã QR yêu cầu quét để nhận quà tri ân");
               }}
               className="flex flex-col items-center justify-center bg-white rounded-2xl p-2.5 shadow-2xs border border-purple-100 active:scale-95 transition-transform"
             >
               <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-1 text-blue-600">
                 <QrCode size={18} />
               </div>
               <span className="text-[#3b1d7d] font-bold text-[14px] text-center">{t("Mã QR")}</span>
             </button>
             
             <button 
               onClick={() => {
                 setSearchInput("Có người gửi link khuyến mãi trúng thưởng yêu cầu đăng nhập");
                 handleRunSearch("Có người gửi link khuyến mãi trúng thưởng yêu cầu đăng nhập");
               }}
               className="flex flex-col items-center justify-center bg-white rounded-2xl p-2.5 shadow-2xs border border-purple-100 active:scale-95 transition-transform"
             >
               <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center mb-1 text-purple-600">
                 <Globe size={18} />
               </div>
               <span className="text-[#3b1d7d] font-bold text-[14px] text-center">{t("Link web")}</span>
             </button>
             
             <button 
               onClick={() => {
                 setSearchInput("Số điện thoại lạ gọi tự xưng công an yêu cầu chuyển tiền vào tài khoản an toàn");
                 handleRunSearch("Số điện thoại lạ gọi tự xưng công an yêu cầu chuyển tiền vào tài khoản an toàn");
               }}
               className="flex flex-col items-center justify-center bg-white rounded-2xl p-2.5 shadow-2xs border border-purple-100 active:scale-95 transition-transform"
             >
               <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center mb-1 text-emerald-600">
                 <Phone size={18} />
               </div>
               <span className="text-[#3b1d7d] font-bold text-[14px] text-center">{t("Cuộc gọi")}</span>
             </button>
          </div>
      </div>

      {/* Desktop Grid Options */}
      {/*
        ⚠️ BA THẺ NÀY TỪNG VỠ CHỮ DỌC TRÊN MÁY TÍNH — mỗi từ một dòng.

        Nguyên nhân: lưới 3 cột nằm BÊN TRONG khung app vốn bị kẹp `max-w-3xl`,
        nên mỗi cột chỉ còn ~200px; thẻ lại xếp NGANG (icon 80px + chữ), phần
        chữ còn ~90px và tiếng Việt bị bẻ từng từ xuống dòng.

        Vá hai đầu: khung app rộng ra ở `lg:` trở lên, và thẻ xếp DỌC thay vì
        ngang. Xếp dọc còn hợp hơn với chữ tiếng Việt — nó dài hơn tiếng Anh
        khoảng 30%, nên đừng thiết kế hộp vừa khít chữ (§4.5).
      */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 w-full mb-8">
         <div onClick={() => handleRunSearch("Cuộc gọi tự xưng cơ quan chức năng hoặc công an điều tra")} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-purple-100 flex flex-col gap-3 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group text-left min-w-0">
            <div className="w-14 h-14 bg-[#f3e8ff] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
               <Phone className="w-7 h-7 text-[#7e22ce] relative z-10" />
               <div className="absolute inset-0 bg-gradient-to-tr from-[#c084fc]/20 to-transparent"></div>
            </div>
            <div className="min-w-0">
               <h3 className="font-bold text-[18px] text-[#2e1065] mb-1">{t("Cuộc gọi lạ")}</h3>
               <p className="text-[15px] text-[#4b5563] leading-snug">{t("Kể lại nội dung cuộc gọi để được kiểm tra.")}</p>
            </div>
         </div>

         <div onClick={() => handleRunSearch("Tin nhắn thông báo tài khoản ngân hàng bị khóa hoặc yêu cầu ấn vào link")} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-purple-100 flex flex-col gap-3 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group text-left min-w-0">
            <div className="w-14 h-14 bg-[#f3e8ff] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
               <MessageSquare className="w-7 h-7 text-[#7e22ce] relative z-10" />
               <div className="absolute inset-0 bg-gradient-to-tr from-[#c084fc]/20 to-transparent"></div>
            </div>
            <div className="min-w-0">
               <h3 className="font-bold text-[18px] text-[#2e1065] mb-1">{t("Tin nhắn đáng ngờ")}</h3>
               <p className="text-[15px] text-[#4b5563] leading-snug">{t("Dán nội dung hoặc gửi ảnh chụp tin nhắn.")}</p>
            </div>
         </div>

         <div onClick={() => handleRunSearch("Đường link nhận quà hoặc yêu cầu quét mã QR nạp tiền")} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-purple-100 flex flex-col gap-3 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group text-left min-w-0">
            <div className="w-14 h-14 bg-[#f3e8ff] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
               <Globe className="w-7 h-7 text-[#7e22ce] relative z-10" />
               <div className="absolute inset-0 bg-gradient-to-tr from-[#c084fc]/20 to-transparent"></div>
            </div>
            <div className="min-w-0">
               <h3 className="font-bold text-[18px] text-[#2e1065] mb-1">{t("Link hoặc mã QR")}</h3>
               <p className="text-[15px] text-[#4b5563] leading-snug">{t("Kiểm tra trước khi bấm mở để tránh rủi ro.")}</p>
            </div>
         </div>
      </div>

      {/*
        TIN LỪA ĐẢO — LẤY TỪ BÁO THẬT, QUA `/api/tin-lua-dao`.

        ⚠️ HAI TIN CỨNG ĐÃ GỠ 18/8/2026. Bản trước viết thẳng "Giả mạo công an
        gọi điện yêu cầu chuyển tiền · 2 giờ trước · Cảnh báo đỏ" kèm ảnh minh
        hoạ tải từ unsplash.com. §11 cấm cảnh báo KHÔNG CÓ NGUỒN, và mốc thời
        gian "2 giờ trước" là bịa về một chuyện chưa ai kiểm.

        `src/tin-lua-dao.js` đã dựng sẵn đúng cho việc này: mỗi tin bắt buộc có
        tên báo và đường dẫn gốc, tin thiếu nguồn bị loại, và khi không lấy được
        thì phong bì mang `chuaLayDuoc` — vì §4.3: "không lấy được tin" KHÁC
        "hôm nay không có vụ lừa đảo nào".
      */}
      <TinLuaDaoGanDay t={t} lang={lang} />
    </motion.div>
  );
}

// --- Login View ---
function LoginView({ 
  setView, 
  t, 
  setIsLoggedIn,
  userRole,
  setUserRole 
}: { 
  setView: (v: ViewState) => void; 
  t: any; 
  setIsLoggedIn: (v: boolean) => void;
  userRole?: 'elder' | 'guardian';
  setUserRole?: (role: 'elder' | 'guardian') => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'elder' | 'guardian'>(userRole || 'elder');

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsLoggedIn(true);
      if (setUserRole) setUserRole(selectedRole);
      if (selectedRole === 'guardian') {
        setView('guardian');
      } else {
        setView('home');
      }
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-center px-6"
    >
      <button aria-label={t("Quay lại")} 
        onClick={() => setView(selectedRole === 'guardian' ? 'guardian' : 'home')}
        className="absolute top-6 left-6 p-2 bg-white/60 rounded-full shadow-sm text-[#6d28d9] active:scale-95 transition-all"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="w-20 h-20 mb-3">
        <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
      </div>
      <h2 className="text-[28px] font-black text-[#1e1b4b] mb-1">{t("Khoan Đã")}</h2>
      <p className="text-[#6d28d9]/80 text-[14px] font-semibold mb-6 text-center">{t("Cùng bác an toàn trong thế giới số")}</p>

      {/* Role Selection Segmented Control */}
      <div className="w-full max-w-sm mb-6 bg-white/80 p-1.5 rounded-2xl border border-purple-200/80 shadow-xs flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedRole('elder')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all ${
            selectedRole === 'elder'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>👵</span>
          <span>{t("Bác (Người già)")}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole('guardian')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all ${
            selectedRole === 'guardian'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🛡️</span>
          <span>{t("Con cháu (Guardian)")}</span>
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3.5">
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white border border-[#e9d5ff] text-[#1e1b4b] py-3.5 rounded-2xl font-bold text-[15px] shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#6d28d9] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("Đăng nhập bằng Google")}
            </>
          )}
        </button>

        <button 
          onClick={handleLogin}
          disabled={loading}
          className={`w-full text-white py-3.5 rounded-2xl font-bold text-[15px] shadow-md flex items-center justify-center gap-2.5 active:scale-95 transition-transform ${
            selectedRole === 'guardian' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-[#8b5cf6] hover:bg-[#7c3aed]'
          }`}
        >
          <Phone size={20} />
          {t("Đăng nhập bằng Số điện thoại")}
        </button>
      </div>
    </motion.div>
  );
}

// --- Add Family View ---
function AddFamilyView({ setView, t, setFamilyMembers }: { setView: (v: ViewState) => void, t: any, setFamilyMembers: any }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Con trai');

  /**
   * ⚠️ CHỌN MÀU, KHÔNG TẢI ẢNH NGƯỜI LẠ TỪ INTERNET.
   * Năm ảnh cũ là ảnh chân dung người thật lấy từ unsplash.com, gán cho "con
   * trai" / "con gái" của bác. Vừa là một lượt gọi ra ngoài mỗi lần mở màn này,
   * vừa là dán mặt một người xa lạ lên tên người thân trong nhà.
   */
  const mauAvatar = ['#7e22ce', '#b45309', '#047857', '#1d4ed8', '#be123c'];
  const [mauDaChon, setMauDaChon] = useState(mauAvatar[0]);

  const handleSave = () => {
    if (name.trim() && phone.trim()) {
      setFamilyMembers((prev: any) => [
        ...prev,
        {
          id: Date.now(),
          name: name.trim(),
          phone: phone.trim(),
          relation: relation.trim() || 'Người thân tin cậy',
          avatar: mauDaChon
        }
      ]);
      setView('family');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col pt-8 px-5 overflow-y-auto"
    >
      <div className="flex items-center mb-6 relative">
        <button aria-label={t("Quay lại")} 
          onClick={() => setView('family')}
          className="p-2 bg-white/70 rounded-full shadow-sm text-[#6d28d9] active:scale-95 transition-all absolute left-0"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-[20px] font-black text-[#1e1b4b] text-center w-full">{t("Thêm người thân mới")}</h2>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e9d5ff] flex flex-col gap-4 max-w-md mx-auto w-full">
        <div>
          <label className="text-[14px] font-bold text-[#6d28d9] mb-1.5 block">{t("Chọn ảnh đại diện")}</label>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {mauAvatar.map((mau, idx) => (
              <button
                key={mau}
                type="button"
                aria-label={`${t("Chọn ảnh đại diện")} ${idx + 1}`}
                onClick={() => setMauDaChon(mau)}
                style={{ backgroundColor: mau }}
                className={`w-12 h-12 rounded-full shrink-0 border-2 transition-all ${mauDaChon === mau ? 'border-[#1e1b4b] ring-2 ring-[#c084fc] scale-105' : 'border-gray-200 opacity-60'}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-[14px] font-bold text-[#6d28d9] mb-1 block">{t("Họ và tên")}</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#f3e8ff] rounded-2xl px-4 py-3 text-[#311068] font-bold outline-none border border-transparent focus:border-[#c084fc] transition-colors text-[15px]"
            placeholder={t("Ví dụ: Nguyễn Văn An")}
          />
        </div>

        <div>
          <label className="text-[14px] font-bold text-[#6d28d9] mb-1 block">{t("Số điện thoại")}</label>
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[#f3e8ff] rounded-2xl px-4 py-3 text-[#311068] font-bold outline-none border border-transparent focus:border-[#c084fc] transition-colors text-[15px]"
            placeholder={t("Ví dụ: 0988 123 456")}
          />
        </div>

        <div>
          <label className="text-[14px] font-bold text-[#6d28d9] mb-1 block">{t("Mối quan hệ")}</label>
          <div className="grid grid-cols-3 gap-2">
            {['Con trai', 'Con gái', 'Cháu', 'Vợ / Chồng', 'Anh em', 'Hàng xóm'].map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => setRelation(rel)}
                className={`py-2 rounded-xl text-[14px] font-bold border transition-all ${relation === rel ? 'bg-[#7e22ce] text-white border-[#7e22ce]' : 'bg-[#f8f4ff] text-[#4c1d95] border-purple-100 hover:bg-purple-100'}`}
              >
                {t(rel)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="my-6 flex gap-3 max-w-md mx-auto w-full">
        <button 
          onClick={() => setView('family')}
          className="flex-1 bg-white text-[#6d28d9] border border-[#e9d5ff] py-3.5 rounded-2xl font-bold text-[15px] shadow-sm active:scale-95 transition-transform"
        >
          {t("Hủy")}
        </button>
        <button 
          onClick={handleSave}
          disabled={!name.trim() || !phone.trim()}
          className="flex-1 bg-[#8b5cf6] disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-[15px] shadow-md active:scale-95 transition-transform"
        >
          {t("Lưu người thân")}
        </button>
      </div>
    </motion.div>
  );
}


/**
 * MÀN KẾT QUẢ — §HĐ SỐNG HAY CHẾT Ở ĐÂY.
 *
 * Bốn luật của hợp đồng, không luật nào được bỏ:
 *  1. `nhan` là ENUM. Chữ hiển thị tra từ `catalog.ts`, không mã cứng ở đây.
 *  2. `maLyDo` là MÃ. Câu tiếng Việt/Anh cũng tra từ catalog.
 *  3. `chuaKiem` KHÔNG RỖNG ⇒ BẮT BUỘC HIỆN, CÙNG CỠ CHỮ VỚI NHÃN.
 *  4. `canThiep` quyết định MÀN HÌNH, `nhan` quyết định NHÃN. Hai thứ khác nhau.
 *
 * ⚠️ BA LỖI ĐÃ VÁ Ở ĐÂY 18/8/2026 — ĐỪNG DỰNG LẠI:
 *
 *  · Nhãn `t("An toàn")` cho mức `CHUA_THAY`. §4.1 cấm TUYỆT ĐỐI nhãn thứ tư và
 *    mọi biến thể của "An toàn" / "Safe". Hệ thống chỉ nói *chưa thấy dấu hiệu
 *    trong thông tin bác cung cấp* — nó KHÔNG HỨA an toàn.
 *  · `chuaKiem` và `aiDaChay` không được đọc tới. Một lượt mà AI không hề chạy
 *    hiện ra y hệt một lượt đã đọc kỹ và không thấy gì. Đó là §4.3, dạng lỗi đặc
 *    trưng của sản phẩm này.
 *  · Câu đọc to nói "Chưa thấy dấu hiệu lừa đảo" — khẳng định một dấu hiệu là
 *    VẮNG MẶT, §11 cấm.
 *
 * ⚠️ KHÔNG `initial={{ opacity: 0 }}` TRÊN KHỐI GỐC CỦA MÀN NÀY.
 * `requestAnimationFrame` treo khi khung hình không được vẽ (màn tắt, chế độ
 * tiết kiệm pin) — đã đo được cả app trắng trơn. Hiệu ứng chỉ được DỜI CHỖ.
 */
function WarningView({
  setView,
  t,
  lang = 'vi',
  result,
  familyMembers,
  noiChayAi,
  mayCoUngDungLa
}: {
  setView: (v: ViewState) => void,
  t: any,
  lang?: Lang,
  result?: any,
  familyMembers?: any[],
  /**
   * Ứng dụng đang xem và bấm được thay bác — đọc thẳng từ Android.
   * ⚠️ Dữ liệu này KHÔNG đến từ máy chủ và KHÔNG đi lên máy chủ (§6.9).
   */
  mayCoUngDungLa?: TrangThaiMay | null,
  /** 'cuc_bo' | 'gateway' | 'gemini' | 'khong_chay' — từ /api/suc-khoe. */
  noiChayAi?: string | null
}) {
  const nhan: string | undefined = result?.nhan;
  const canThiep: string | undefined = result?.canThiep;
  const khongGoiDuoc = result?.khongGoiDuocMayChu === true;
  const tuBamDung = result?.tuBamDung === true;

  const laCao = nhan === 'CAO';
  const laNghiNgo = nhan === 'NGHI_NGO';
  const laChuaThay = nhan === 'CHUA_THAY';

  /**
   * §HĐ luật 4 — MÀN theo `canThiep`. Mức `PROTECTED_CRITICAL` bỏ bớt điều hướng
   * và luôn phải có lối ra (§4.6, dưới cùng màn hình).
   */
  const laKhanCap = canThiep === 'PROTECTED_CRITICAL';

  /**
   * ỨNG DỤNG BÁC ĐÃ NÓI "TÔI TỰ CÀI" — nhớ theo TÊN GÓI, không phải một công
   * tắc tắt-hết.
   *
   * ⚠️ NHỚ THEO TỪNG ỨNG DỤNG LÀ RÀNG BUỘC AN TOÀN, KHÔNG PHẢI TIỆN NGHI.
   * Một cái công tắc "đừng nhắc nữa" sẽ tắt luôn cảnh báo cho ứng dụng lừa đảo
   * được cài SAU đó — tức là bác tự tay vô hiệu hoá đúng thứ cần nhất, bằng một
   * thao tác trông hoàn toàn vô hại. Nhớ theo gói thì app lạ mới xuất hiện vẫn
   * được nêu.
   */
  /**
   * ⚠️ ĐỌC MỘT LẦN LÚC DỰNG MÀN, KHÔNG THEO DÕI LIÊN TỤC.
   * Đây là màn hình bác nhìn khi đang bị thúc; nó không nên đổi nội dung giữa
   * chừng vì một thay đổi ở màn khác.
   */
  const [matKhauNha] = useState(() => docMatKhauGiaDinh());

  const [daBoQua, setDaBoQua] = useState<string[]>(() => {
    try {
      const t = JSON.parse(localStorage.getItem('khoan_da_tro_nang_tu_cai') || '[]');
      return Array.isArray(t) ? t : [];
    } catch {
      return [];
    }
  });
  const dangNgo = (mayCoUngDungLa?.dangNgo ?? []).filter((u) => !daBoQua.includes(u.goi));
  const boQuaNhungCaiNay = () => {
    const moi = Array.from(new Set([...daBoQua, ...dangNgo.map((u) => u.goi)]));
    setDaBoQua(moi);
    try {
      localStorage.setItem('khoan_da_tro_nang_tu_cai', JSON.stringify(moi));
    } catch {
      // Không lưu được thì lần sau hỏi lại — phiền, nhưng không sai.
    }
  };

  // Đồng hồ 60 giây: chỉ chạy khi thật sự có gì đó để dừng lại.
  const initialTime = (laChuaThay || khongGoiDuoc) ? 0 : 60;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Nhãn NGUYÊN VĂN §4.1, tra từ catalog. Không có nhãn thứ tư.
  const nhanChu = nhan ? tra(NHAN, nhan, lang) : null;
  const lyDo = traNhieu(MA_LY_DO, result?.maLyDo ?? [], lang);

  /**
   * §HĐ luật 3 + `aiDaChay`.
   * `aiDaChay === false` mà `ai_khong_chay` chưa có trong `chuaKiem` thì thêm —
   * §HĐ đòi frontend PHẢI hiện dòng "lượt này không có AI đọc". Lọc trùng để
   * không nói hai lần cùng một chuyện.
   */
  const maChuaKiem: string[] = [...(result?.chuaKiem ?? [])];
  if (result && result.aiDaChay === false && !maChuaKiem.includes('ai_khong_chay')) {
    maChuaKiem.push('ai_khong_chay');
  }
  const chuaKiem = traNhieu(CHUA_KIEM, maChuaKiem, lang);

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const isEn = lang === 'en';
    /**
     * ⚠️ CÂU ĐỌC TO PHẢI NÓI ĐÚNG NHỮNG GÌ MÁY LÀM ĐƯỢC.
     * Không khẳng định dấu hiệu nào VẮNG MẶT (§11), và nếu có `chuaKiem` thì
     * đọc luôn — người phải nghe thay vì đọc chính là người dễ bỏ sót nhất phần
     * "chưa kiểm được".
     */
    const phanDau = khongGoiDuoc
      ? (isEn ? 'This could not be sent for checking.' : 'Nội dung này chưa gửi đi kiểm được.')
      : nhanChu
        ? `${isEn ? 'Result' : 'Kết quả'}: ${nhanChu}.`
        : (isEn ? 'Pause for sixty seconds.' : 'Bác dừng lại sáu mươi giây.');

    const phanKhuyen = laChuaThay
      ? (isEn
        ? 'Please still do not read out any code and do not transfer money.'
        : 'Bác vẫn đừng đọc mã nào và đừng chuyển tiền.')
      : (isEn
        ? 'Do not transfer money and do not read out any code. Please call your family.'
        : 'Bác đừng chuyển tiền và đừng đọc mã nào. Bác gọi cho con cháu nhé.');

    const phanChuaKiem = chuaKiem.length > 0
      ? ` ${isEn ? 'What I could not check' : 'Những thứ cháu chưa kiểm được'}: ${chuaKiem.join('. ')}.`
      : '';

    const utterance = new SpeechSynthesisUtterance(`${phanDau} ${phanKhuyen}${phanChuaKiem}`);
    utterance.lang = isEn ? 'en-US' : 'vi-VN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  /**
   * ⚠️ MÀU CHỈ LÀ PHỤ (§4.4) — chữ và biểu tượng mới là chính. Người cao tuổi có
   * tỉ lệ mù màu cao, nên không mức nào được phân biệt CHỈ bằng màu.
   *
   * `#b91c1c` chứ không `#dc2626`: chữ trắng trên `#dc2626` chỉ đạt 4,53:1, sát
   * mép sàn 4,5:1 và trượt ngay khi ai đó chỉnh sáng lên.
   */
  const bgColor = laCao
    ? 'from-[#b91c1c] to-[#7f1d1d]'
    : laNghiNgo
      ? 'from-[#b45309] to-[#78350f]'
      : laChuaThay
        ? 'from-[#047857] to-[#064e3b]'
        : 'from-[#4c1d95] to-[#2e1065]';

  const firstContact = (familyMembers && familyMembers.length > 0)
    ? familyMembers[0]
    : { name: t('Người thân'), phone: '' };

  const handleCallRelative = () => {
    if (!firstContact.phone) { setView('family'); return; }
    window.open(`tel:${firstContact.phone}`, '_self');
  };

  /**
   * ⚠️ §11 — KHÔNG NÓI "đã gửi cho người thân". Hàm này MỞ ứng dụng tin nhắn;
   * người bấm Gửi là bác. Nút cũng ghi đúng như vậy.
   *
   * ⚠️ Nội dung tin KHÔNG kèm nguyên văn tin nhắn bác nhận được: nó có thể chứa
   * số tài khoản, mã, hoặc tên người — đẩy sang máy khác là mở rộng phạm vi rò
   * rỉ mà không ai yêu cầu.
   */
  const handleSendSos = () => {
    if (!firstContact.phone) { setView('family'); return; }
    const nhanTin = nhanChu ?? (lang === 'en' ? 'needs checking' : 'cần kiểm lại');
    const text = lang === 'en'
      ? `[Khoan Đã] I just got something that Khoan Đã marked: ${nhanTin}. Please call me back.`
      : `[Khoan Đã] Bố/mẹ vừa nhận được một nội dung, Khoan Đã ghi là: ${nhanTin}. Con gọi lại cho bố/mẹ nhé.`;
    window.open(`sms:${firstContact.phone}?body=${encodeURIComponent(text)}`, '_self');
  };

  return (
    <motion.div
      animate={{ scale: 1 }}
      initial={{ scale: 0.98 }}
      className={`absolute inset-0 z-[100] bg-gradient-to-b ${bgColor} flex flex-col items-center justify-between px-5 py-6 overflow-y-auto`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-20%] w-96 h-96 bg-white/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-96 h-96 bg-black/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col items-center z-10 w-full mt-1 max-w-md">
        <div className="flex items-center justify-between w-full mb-2 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-white" />
            <span className="text-white font-black text-[16px]">Khoan Đã</span>
          </div>

          <button
            onClick={handleToggleSpeak}
            aria-label={t('Đọc to')}
            className={`px-3.5 py-2 rounded-full text-[14px] font-extrabold flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm ${isSpeaking ? 'bg-amber-300 text-amber-950' : 'bg-white/20 text-white hover:bg-white/30 active:scale-95'}`}
          >
            <Volume2 size={16} />
            {isSpeaking ? t('Đang đọc...') : t('Đọc to')}
          </button>
        </div>
      </div>

      {/* Center Main Card & Explanations */}
      <div className="flex flex-col items-center z-10 w-full my-auto max-w-md">
        <div className="relative w-24 h-28 flex items-center justify-center mb-2">
          <svg className="w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.4)] relative z-10" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M100 10L20 40V100C20 150 50 190 100 230C150 190 180 150 180 100V40L100 10Z" fill={laCao ? '#b91c1c' : laNghiNgo ? '#b45309' : laChuaThay ? '#047857' : '#5b21b6'} stroke="#ffffff" strokeWidth="3" />
            {(laCao || laNghiNgo || (!nhan && !laChuaThay)) ? (
              <>
                <path d="M100 55V140" stroke="white" strokeWidth="20" strokeLinecap="round" />
                <circle cx="100" cy="180" r="12" fill="white" />
              </>
            ) : (
              /*
                ⚠️ KHÔNG DÙNG DẤU TÍCH ✓ CHO MỨC THẤP. Dấu tích đọc là "xong rồi,
                ổn rồi" — đúng thứ §4.1 cấm hứa. Dùng dấu chấm hỏi: đã xem, chưa
                kết luận được gì.
              */
              <>
                <path d="M75 85c0-14 11-25 25-25s25 11 25 25c0 18-25 15-25 35" stroke="white" strokeWidth="17" strokeLinecap="round" fill="none" />
                <circle cx="100" cy="175" r="12" fill="white" />
              </>
            )}
          </svg>
        </div>

        {/* NHÃN — nguyên văn §4.1 */}
        <h1 className="text-[25px] font-black text-white text-center leading-tight mb-1 drop-shadow-sm tracking-tight">
          {khongGoiDuoc
            ? t('Chưa gửi đi kiểm được')
            : tuBamDung
              ? t('Bác dừng lại 60 giây đã')
              : (nhanChu ?? t('Chưa có kết quả'))}
        </h1>
        <p className="text-[16px] font-semibold text-white/95 mb-3 text-center leading-snug">
          {khongGoiDuoc
            ? t('Mạng không đi được nên chưa có gì được kiểm cả.')
            : laCao
              ? t('Bác đừng chuyển tiền, đừng đọc mã nào.')
              : laNghiNgo
                ? t('Bác hỏi lại người thân trước khi làm gì tiếp.')
                : laChuaThay
                  ? t('Chưa thấy dấu hiệu trong thông tin bác gửi. Bác vẫn đừng đọc mã cho ai.')
                  : t('Bác thở một hơi. Không có gì gấp tới mức không chờ được một phút.')}
        </p>

        {/* Lý do — tra từ MÃ, §HĐ luật 2 */}
        {lyDo.length > 0 && (
          <ul className="w-full flex flex-col gap-1.5 mb-2">
            {lyDo.slice(0, 8).map((cau) => (
              <li key={cau} className="px-3.5 py-2 bg-black/30 rounded-xl text-white font-semibold text-[16px] border border-white/15 flex items-start gap-2 backdrop-blur-xs leading-snug">
                <AlertTriangle size={18} className="text-amber-300 shrink-0 mt-0.5" />
                <span>{cau}</span>
              </li>
            ))}
          </ul>
        )}

        {/*
          MẬT KHẨU GIA ĐÌNH — CHỐNG DEEPFAKE BẰNG THỨ KHÔNG CẦN AI.

          ⚠️ CHỈ HIỆN Ở MỨC CAO. Đây là một câu lệnh cho bác làm ngay ("hỏi họ
          câu đó đi"), không phải một mẹo hay. Hiện ở mọi mức thì nó thành nền,
          và lúc cần thật thì bác đọc lướt qua như mọi lần trước (§4.6).

          ⚠️ APP KHÔNG BIẾT MẬT KHẨU, NÊN KHÔNG KIỂM HỘ ĐƯỢC — và điều đó là cố
          ý. Xem chú thích đầu `MatKhauGiaDinh.tsx`: nếu nó nằm trong máy thì nó
          lộ ngay trong đúng kịch bản mà nó sinh ra để chống.

          Chưa lập thì rủ bác lập — nhưng KHÔNG chen vào giữa lúc khẩn cấp bằng
          một biểu mẫu. Chỉ một dòng, và bấm được lúc bác rảnh.
        */}
        {laCao && (
          <div className="w-full bg-emerald-950/55 border-2 border-emerald-400/60 rounded-2xl p-4 backdrop-blur-md mb-2">
            <div className="flex items-start gap-2 mb-1.5">
              <Users size={20} className="text-emerald-300 shrink-0 mt-0.5" />
              <h3 className="text-white font-black text-[17px] leading-snug">
                {matKhauNha
                  ? t('Hỏi họ mật khẩu gia đình')
                  : t('Nhà bác chưa có mật khẩu gia đình')}
              </h3>
            </div>
            {matKhauNha ? (
              <>
                <p className="text-emerald-50 text-[15px] leading-relaxed">
                  {t('Người nhà thật trả lời được ngay. Giọng nói và khuôn mặt bây giờ làm giả được, còn câu này thì không.')}
                </p>
                {matKhauNha.goiY && (
                  <p className="text-emerald-100/90 text-[14px] leading-relaxed mt-1.5">
                    {t('Câu nhắc:')} <strong>{matKhauNha.goiY}</strong>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-emerald-50 text-[15px] leading-relaxed mb-3">
                  {t('Một câu chỉ nhà mình biết, để lần sau ai xưng là con cháu thì bác hỏi ngay. Làm mất hai phút.')}
                </p>
                <button
                  onClick={() => setView('mat_khau_gia_dinh')}
                  className="w-full min-h-[52px] px-4 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-[#04301f] font-extrabold rounded-xl text-[16px] transition-all"
                >
                  {t('Lập mật khẩu gia đình')}
                </button>
              </>
            )}
          </div>
        )}

        {/*
          BƯỚC ③ CỦA KỊCH BẢN — ỨNG DỤNG ĐANG XEM VÀ BẤM THAY BÁC.

          ⚠️ CHỈ HIỆN KHI CÓ THẬT, VÀ CHỈ NÊU ỨNG DỤNG KHÔNG ĐẾN TỪ CHỢ CHÍNH
          THỨC. `native.ts` đã lọc app cài sẵn và app từ CH Play / GetApps /
          Galaxy Store ra khỏi `dangNgo` — TalkBack là mắt của người khiếm thị,
          và một cảnh báo sai ở đây khiến bác tắt mất thứ mình cần.

          ⚠️ TÊN ỨNG DỤNG CHỈ SỐNG TRONG MÁY. Nó tới từ plugin native, không
          từ `result` của máy chủ, và không có đường nào đi ngược lên (§6.9).

          ⚠️ KHÔNG GỌI NÓ LÀ PHẦN MỀM ĐỘC HẠI (§11). App biết ba điều: tên, có
          phải cài sẵn không, cài từ đâu. Từ đó tới "đây là mã độc" là một bước
          nhảy không dữ liệu nào ở đây đỡ được.
        */}
        {dangNgo.length > 0 && (
          <div className="w-full bg-amber-950/60 border-2 border-amber-400/60 rounded-2xl p-4 backdrop-blur-md mb-2">
            <div className="flex items-start gap-2 mb-2">
              <Smartphone size={20} className="text-amber-300 shrink-0 mt-0.5" />
              <h3 className="text-white font-black text-[17px] leading-snug">
                {tra(TRANG_THAI_MAY, 'tieu_de', lang)}
              </h3>
            </div>

            <ul className="flex flex-col gap-1.5 mb-2.5">
              {dangNgo.slice(0, 4).map((u) => (
                <li key={u.goi} className="px-3 py-2 bg-black/35 rounded-xl border border-white/15">
                  <span className="block text-white font-bold text-[16px] leading-snug">{u.ten}</span>
                  <span className="block text-amber-100/90 text-[14px] leading-snug mt-0.5">
                    {tra(TRANG_THAI_MAY, u.nguonCai === 'khong_ro' ? 'khong_ro' : 'tu_tep', lang)}
                    {u.vuaCai ? ` · ${tra(TRANG_THAI_MAY, 'vua_cai', lang)}` : ''}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-amber-50 text-[15px] leading-relaxed mb-3">
              {tra(TRANG_THAI_MAY, 'giai_thich', lang)}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => { void moCaiDatTroNang(); }}
                className="w-full min-h-[52px] px-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-[#3b1f00] font-extrabold rounded-xl text-[16px] transition-all"
              >
                {tra(TRANG_THAI_MAY, 'nut_cai_dat', lang)}
              </button>
              {/*
                §4.6 — LỐI RA. Bác tự cài một ứng dụng trợ năng thật (bàn phím,
                trình đọc màn hình tải ngoài) là chuyện có thật. Không có nút này
                thì mỗi lần kiểm bác lại phải đọc lại đúng cảnh báo đó, và đó là
                cách nhanh nhất để dạy bác bỏ qua nó.
              */}
              <button
                onClick={boQuaNhungCaiNay}
                className="w-full min-h-[52px] px-4 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold rounded-xl text-[15px] border border-white/25 transition-all"
              >
                {tra(TRANG_THAI_MAY, 'nut_tu_cai', lang)}
              </button>
            </div>
          </div>
        )}

        {/*
          §HĐ luật 3 — CÙNG CỠ CHỮ VỚI NHÃN, KHÔNG PHẢI CHÚ THÍCH NHỎ.
          "Không kiểm được" KHÁC "đã kiểm, không thấy gì" (§4.3). Khối này là chỗ
          duy nhất trên màn nói ra giới hạn của lượt kiểm — nó không được nhỏ hơn,
          mờ hơn, hay nằm dưới nếp gấp.
        */}
        {chuaKiem.length > 0 && (
          <div className="w-full bg-black/45 border-2 border-white/40 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <EyeOff size={20} className="text-white shrink-0" />
              <span className="text-[16px] font-black text-white">
                {t('Những thứ cháu CHƯA kiểm được')}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {chuaKiem.map((cau) => (
                <li key={cau} className="text-[16px] text-white font-medium leading-snug">• {cau}</li>
              ))}
            </ul>
          </div>
        )}

        {/*
          §11 — NÓI THẬT AI CHẠY Ở ĐÂU.

          Đây là thứ người dùng có quyền biết trước khi gõ một tin nhắn có tên,
          số tài khoản hay tên người thân vào. Ba trạng thái, ba câu khác nhau,
          và câu nào cũng đọc thẳng từ cấu hình đang chạy chứ không phải từ một
          hằng số ai đó đặt lúc viết mã.

          ⚠️ Không biết thì IM LẶNG, đừng đoán. `/api/suc-khoe` hỏng thì
          `noiChayAi` là `null` và khối này không hiện — thà thiếu còn hơn sai.
        */}
        {noiChayAi && tra(NOI_CHAY_AI, noiChayAi, lang) && (
          <div className={`w-full mt-2 rounded-xl px-3.5 py-2.5 border-2 ${
            noiChayAi.startsWith('tren_may') ? 'bg-black/35 border-emerald-300/70' : 'bg-black/35 border-white/30'
          }`}>
            <p className="text-[14px] font-bold text-white leading-snug">
              {noiChayAi.startsWith('tren_may') ? '🔒 ' : ''}{tra(NOI_CHAY_AI, noiChayAi, lang)}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons Optimized for Elderly */}
      <div className="w-full max-w-md z-10 flex flex-col items-center gap-2.5 mt-auto pt-2">
        {timeLeft > 0 && (
          <div className="w-full bg-black/35 border border-white/20 rounded-2xl p-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-white text-[14px] font-bold mb-1.5 px-1">
              <span>{t('Dừng lại bình tĩnh:')}</span>
              <span className="text-amber-200 font-mono text-[16px] font-black">{timeLeft}s</span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-300 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((initialTime - timeLeft) / initialTime) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleCallRelative}
          data-vai-tro="nut-chinh"
          className="w-full py-4 px-4 rounded-2xl font-black text-[17px] bg-amber-300 text-amber-950 shadow-[0_6px_20px_rgba(245,158,11,0.4)] border-2 border-amber-200 flex flex-col items-center justify-center gap-0.5 active:scale-98 transition-all hover:brightness-105"
        >
          <span className="flex items-center gap-2">
            <PhoneCall size={22} />
            <span>{t('GỌI NGAY CHO CON CHÁU')}</span>
          </span>
          {firstContact.phone && (
            <span className="text-[14px] font-bold text-amber-900/80">
              {firstContact.name} ({firstContact.phone})
            </span>
          )}
        </button>

        {/* ⚠️ "Soạn tin", KHÔNG phải "đã gửi" — §11. */}
        <button
          onClick={handleSendSos}
          className="w-full py-3 px-3 rounded-2xl font-black text-[16px] bg-white text-slate-900 shadow-md border border-white/40 flex items-center justify-center gap-2 active:scale-98 transition-all hover:bg-slate-50"
        >
          <MessageSquare size={18} className="text-slate-700" />
          <span>{t('Soạn tin nhắn cho con cháu')}</span>
        </button>

        {/*
          §4.6 — NGUYÊN TẮC LUÔN CÓ LỐI RA.
          Mức PROTECTED_CRITICAL bỏ hết điều hướng, NHƯNG luôn phải có dòng "Tôi
          ổn, không có gì nguy hiểm" ở cuối màn hình. Nếu bộ luật báo động giả mà
          người dùng bị kẹt trong màn khẩn cấp, họ sẽ hoảng và gỡ ứng dụng.

          ⚠️ KHÔNG viết "Bác đã an toàn" ở nút này (§4.1 · §11): app không biết
          điều đó, và bấm một cái nút không làm ai an toàn hơn.
        */}
        <button
          onClick={() => setView('home')}
          className="w-full py-3 rounded-2xl font-bold text-[16px] bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-sm backdrop-blur-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
        >
          <span>{laKhanCap ? t('Tôi ổn, không có gì nguy hiểm') : t('Về trang chủ')}</span>
        </button>
      </div>
    </motion.div>
  );
}
