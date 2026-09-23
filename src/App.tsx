import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Mic,
  UserPlus,
  PhoneIncoming,
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
  Radar,
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
  EyeOff, Users,
  PhoneOff,
  Wallet,
  Landmark,
  KeyRound,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Lang, t as translate } from './i18n';
/**
 * §HĐ luật 1 và 2 — MÃ → CHỮ chỉ đi qua tệp này.
 * Backend trả ENUM và MÃ; chữ tiếng Việt / tiếng Anh nằm ở `catalog.ts`, và
 * CHỈ ở đó. Hệ quả cố ý: đổi ngôn ngữ KHÔNG THỂ làm đổi kết luận.
 */
import { NHAN, MA_LY_DO, CHUA_KIEM, CHUA_LAY_TIN, NOI_CHAY_AI, tra, traNhieu, CHU_NATIVE , TRANG_THAI_MAY, NHAC_CUOC_GOI, MA_TAI_KHOAN, KHUNG_KICH_BAN, KET_KICH_BAN, MA_BUOC, KHUNG_PHUC_HOI, BUOC_PHUC_HOI, CANH_BAO_PHUC_HOI, QUY_TAC_KHUNG, MAN_HO_SO, MAN_RA_DA, DOI_PHAN_UNG, SO_NGAN_HANG } from './catalog';
import { api } from './api-goc';
import {
  dangKy as dangKyTaiKhoan, dangNhap as dangNhapTaiKhoan,
  dangXuat as dangXuatTaiKhoan, layHoSo as layHoSoTaiKhoan,
  docPhien as docPhienTaiKhoan, suaHoSo as suaHoSoTaiKhoan,
  type HoSo as HoSoTaiKhoan,
  guiBaoDong, guiTrangThaiBaoDong, type PhanHoiBaoDong, docVongGhep,
} from './tai-khoan';
import { cauTrangThaiBao } from './lib/cau-trang-thai-bao';
import {
  laApk, hienCanhBaoHeadsUp, hienPopupCanhBao, anPopup, henNhacTheoDoi72Gio,
  datThongBaoThuongTruc, noiDungChiaSe, quyenPopup, xinQuyenPopup,
  ngheGiongNoi, dungNghe as dungNgheNative, coBoNghe,
  quyenDocThongBao, xinQuyenDocThongBao, tinMoiNhat, xoaTinDaBat,
  trangThaiThuongTruc, trangThaiMay, tomTatChoMayChu, moCaiDatTroNang,
  napChuCuocGoi, trangThaiTheoDoiCuocGoi, datTheoDoiCuocGoi, docTo, dungDocTo, dayAppXuong,
  goiDienThoai,
  batBongBong, tatBongBong, trangThaiBongBong,
  type QuyenNative, type TrangThaiMay,
} from './native';
import { GuardianIntroView, GuardianAuthView, GuardianView } from './components/Guardian';
import { AppMenuModal } from './components/AppMenuModal';
import { HangRaoLoi } from './hang-rao-loi';
import { MatKhauGiaDinh, docMatKhauGiaDinh } from './components/MatKhauGiaDinh';
import { KhoiQuyTac, ManDatQuyTac } from './components/QuyTacGiaDinh';
import { CanhBaoChinhThuc } from './components/CanhBaoChinhThuc';
import { TroLyNoi } from './components/TroLyNoi';
import { QuaCauNoi } from './components/QuaCauNoi';
import {
  docVongTron, vongTronRong, chonQuyTac, duocHienQuyTac, thuTuGoi, tinhHuongGoi, vaiChoTinhHuong, nguoiGoiDauTien,
} from './lib/vong-tron-gia-dinh';
import { ManDoiPhanUng, TheDoiPhanUng, nhanVai } from './components/DoiPhanUng';
import { ManSoNganHang, DanhSachSoNganHang } from './components/SoNganHang';
import { DaiTheoDoi72Gio, ManTheoDoi72Gio, chuNhac72Gio } from './components/TheoDoi72Gio';
import { batDauTheoDoi } from './lib/theo-doi-72-gio';
import { ManHoSoVuViec, ManRaDaThuDoan } from './components/HoSoVaRaDa';
import { CongDongCanhGiac } from './components/CongDongCanhGiac';
import { ManGhepConChau } from './components/GhepConChau';
import { ManConCaiGiup } from './components/ConCaiGiup';
import { dongBoNhipBaoVe } from './lib/nhip-bao-ve';
import { ManChiaKhoa } from './components/ChiaKhoaThuHai';
import { ManNganHangMoPhong } from './components/NganHangMoPhong';
import { hopNhatNguoiThan } from './lib/hop-nhat-nguoi-than';
import { useLoiNhanCon, usePhatMotLan } from './lib/loi-nhan-giong';
import { batDauDo, ketThucDo, ghiLuot } from './lib/do-thoi-gian-toi-nguoi-that';
import { ghiKetQua, type HanhDong } from './lib/ket-qua-can-thiep';
import { chonViecAnToan, CAU_VIEC_AN_TOAN, cauLenhNgan, CAU_LENH_TU_BAT } from './lib/viec-an-toan-tiep-theo';
import { useDocToMotLan } from './lib/doc-to-mot-lan';
import { HoiNhanhView } from './components/HoiNhanh';
import { CanhBaoToanManHinh } from './components/CanhBaoToanManHinh';
import { useCanhBaoThuDong } from './canh-bao-thu-dong';
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
 className="w-full max-w-xs py-3.5 px-4 bg-white text-[#6d28d9] border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] font-bold text-[16px] rounded-2xl active:scale-95"
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

export type ViewState = 'intro' | 'home' | 'voice' | 'phone' | 'link' | 'qr' | 'learn' | 'profile' | 'settings' | 'history' | 'family' | 'search' | 'login' | 'add_family' | 'warning' | 'guardian' | 'account' | 'privacy' | 'notifications' | 'device_data' | 'hoi_nhanh' | 'mat_khau_gia_dinh' | 'quy_tac_gia_dinh' | 'ho_so_vu_viec' | 'ra_da_thu_doan' | 'cong_dong' | 'doi_phan_ung' | 'so_ngan_hang' | 'theo_doi_72h' | 'tro_ly' | 'ghep_con_chau' | 'con_cai_giup' | 'chia_khoa' | 'ngan_hang_mo_phong';

/**
 * MỘT NGƯỜI THÂN TRONG VÒNG TRÒN GIA ĐÌNH.
 *
 * ⚠️ KIỂU NÀY TỒN TẠI ĐỂ TRÌNH BIÊN DỊCH BẮT LỖI HỘ, KHÔNG PHẢI ĐỂ CHO ĐẸP.
 *
 * Trước 4/9/2026 danh sách này khai là `any[]` ở sáu chỗ. Hệ quả đo được:
 * `AppMenuModal` đọc `firstContact.name` trong khi `firstContact` có thể là
 * `null` (bác chưa thêm ai — trạng thái MẶC ĐỊNH), ném TypeError và làm chết cả
 * Menu tác vụ trên bản web thật. `strict: true` đã bật sẵn trong tsconfig,
 * nhưng `any` vô hiệu hoá nó: `any.name` thì tsc không có gì để kiểm.
 *
 * Khai kiểu thật thì `NguoiThan | null` buộc mọi nơi phải xử lý trường hợp
 * chưa có ai — và `test/bien-dich-khong-loi.test.js` biến việc đó thành test đỏ
 * ngay khi có người quên.
 */
export interface NguoiThan {
  id: number;
  name: string;
  /** 'Con trai' · 'Con gái' · 'Cháu' … — tra qua `t()` khi hiển thị. */
  relation: string;
  phone: string;
  /** MÃ MÀU (`#7e22ce`), không phải đường dẫn ảnh — xem `AddFamilyView`. */
  avatar?: string;
}

/**
 * PHẢN HỒI PHÂN TÍCH — HÌNH DẠNG CỦA §HĐ, VIẾT THÀNH KIỂU.
 *
 * ⚠️ ĐÂY LÀ HỢP ĐỒNG, KHÔNG PHẢI MỘT KIỂU TIỆN TAY. Backend và frontend được
 * dựng song song bởi hai công cụ khác nhau; §HĐ nói thẳng: đổi hình dạng này là
 * phải báo cho cả hai bên. Trước 4/9/2026 nó khai `any`, nên trình biên dịch
 * không canh được gì — kể cả một cái tên trường gõ sai.
 *
 * Ba thứ kiểu này canh hộ, mà đọc mã bằng mắt thì không:
 *
 *  1. `nhan` chỉ nhận ĐÚNG ba giá trị. §4.1 và §12 cấm nhãn thứ tư và cấm mọi
 *     biến thể "An toàn" — nay gõ `nhan: 'AN_TOAN'` là lỗi biên dịch, không
 *     phải chuyện phải nhớ.
 *  2. `canThiep` chỉ nhận đúng năm màn. §HĐ luật 4: `canThiep` quyết định MÀN,
 *     `nhan` quyết định NHÃN — hai trường riêng, không suy cái này từ cái kia.
 *  3. `maLyDo`/`daKiem`/`chuaKiem` là MẢNG MÃ (§HĐ luật 2), không phải câu chữ.
 *     Có kiểu thì `.map()` trên chúng không còn là canh bạc.
 *
 * ⚠️ VÌ SAO NHIỀU TRƯỜNG LÀ TUỲ CHỌN. Máy chủ luôn trả đủ bảy trường, nhưng
 * frontend cũng tự dựng đối tượng này ở hai chỗ hợp lệ:
 *   · mất mạng ⇒ `khongGoiDuocMayChu`, KHÔNG có `nhan` — frontend không có
 *     quyền ra mức (§4.2)
 *   · bác tự bấm "Dừng 60 giây" ⇒ `canThiep: 'PAUSE_60S'`, cũng không có `nhan`
 * Khai chúng là bắt buộc thì sẽ có người bịa một `nhan` cho đủ kiểu — đúng thứ
 * §4.2 cấm. Tuỳ chọn ở đây là nói thật, không phải nới lỏng.
 */
export interface KetQuaPhanTich {
  /** ENUM §4.1. Vắng khi frontend tự dựng màn — xem chú thích trên. */
  nhan?: 'CAO' | 'NGHI_NGO' | 'CHUA_THAY';
  /** MÃ, không phải câu (§HĐ luật 2). Frontend tra catalog mới ra chữ. */
  maLyDo: string[];
  daKiem: string[];
  /** §HĐ luật 3 — không rỗng thì BẮT BUỘC hiện cùng cỡ chữ với `nhan`. */
  chuaKiem: string[];
  hoKichBan?: string | null;
  /** false ⇒ màn hình PHẢI nói "lượt này không có AI đọc". */
  aiDaChay?: boolean;
  canThiep?: 'TRUST_RECEIPT' | 'VERIFY_PATH' | 'PAUSE_60S' | 'PROTECTED_CRITICAL' | 'RECOVERY';

  // ───── Ngoài hợp đồng: frontend tự đặt, backend không bao giờ gửi ─────
  /** Mất mạng. §4.3 — "không kiểm được" KHÁC "đã kiểm, không thấy gì". */
  khongGoiDuocMayChu?: boolean;
  /** Bác tự bấm nút dừng, không phải một kết quả phân tích. */
  tuBamDung?: boolean;
  queryText?: string;
  queryImage?: string | null;
  /** Bác tự khai đã chuyển tiền / đọc mã — gửi lên máy chủ để BỘ LUẬT chọn màn. */
  trangThaiNguoiDung?: 'da_chuyen_hoac_doc_ma';
  /** Lượt diễn tập từ luồng "Con cháu cài giúp" (Phần 2). KHÔNG phải kết quả phân tích; không ghi số liệu. */
  dienTap?: boolean;
  /** Máy tự bật màn cảnh báo (Phần 4) — một SỰ KIỆN trên máy, không phải nhãn rủi ro. */
  lyDoTuBat?: 'otp_trong_cuoc_goi' | 'cai_app_trong_cuoc_goi' | 'tien_ra_trong_cuoc_goi';
  /**
   * Màn trình diễn cho giám khảo (`?trinhDien=1`, 23/9/2026). Mọi chặn của diễn tập
   * áp dụng y nguyên — không ghi số liệu, không báo máy chủ, KHÔNG quay số thật — và
   * hành động của bác được chuyển sang máy con GIẢ LẬP qua `onHanhDongMoPhong`.
   */
  moPhong?: boolean;
}

export interface HistoryRecord {
  id: number;
  title: string;
  type: 'call' | 'sms' | 'link' | 'image' | 'qr';
  risk: 'CAO' | 'NGHI_NGO' | 'CHUA_THAY';
  /**
   * Chữ hiển thị trên màn Lịch sử ("12:55 16-09"). ĐỪNG PHÂN TÍCH CHUỖI NÀY —
   * nó không có năm, và đổi theo locale của máy.
   */
  date: string;
  /**
   * Mốc thời gian thật, để xếp và để lọc theo cửa sổ thời gian.
   *
   * ⚠️ THÊM 16/9/2026 SAU MỘT LỖI ĐO ĐƯỢC TRÊN BẢN CHẠY. Hồ sơ vụ việc và ra-đa
   * thủ đoạn đọc `date` bằng `Date.parse`, và với chuỗi "12:55 16-09" thì
   * `Date.parse` trả `NaN` — mọi bản ghi bị lọc sạch, ra-đa báo "chưa có lượt
   * kiểm nào" trong khi máy có ba lượt. Hỏng im lặng, không lỗi nào hiện ra.
   *
   * Bản ghi cũ không có trường này; hai module trên có nhánh đọc chuỗi cũ để
   * không bỏ rơi dữ liệu đã lưu.
   */
  luc?: number;
  saved?: boolean;
  data: KetQuaPhanTich;
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

/**
 * BỀ RỘNG THẬT SỰ MÀ APP ĐANG CÓ.
 *
 * ⚠️ CHÚ THÍCH CŨ Ở ĐÂY ĐÃ SAI TỪ 20/8/2026 — được viết lại, không xóa.
 *
 * Bản cũ nói: trên máy tính, `index.css` bọc app trong `#root` rộng 390px,
 * nên `window.innerWidth` (1920) là sai và phải đọc `#root.clientWidth`.
 *
 * Cách bọc đó **không dùng được** và đã gỡ. Thu `#root` xuống 390px chỉ sửa
 * được phía JavaScript; 285 lớp `sm:`/`md:`/`lg:` của Tailwind vẫn đo cửa sổ
 * trình duyệt và vẫn dựng bố cục máy tính bên trong cột 390px. Khung giờ là
 * một <iframe> (`src/khung-dien-thoai.ts`), nên bên trong khung
 * `window.innerWidth` đã trả đúng 390 — hai nguồn giờ trùng nhau.
 *
 * Hàm này **vẫn giữ**: nó đúng trong mọi trường hợp, kể cả khi app được
 * nhúng vào một khung khác về sau. Không có `#root` (khởi tạo sớm, môi trường
 * test) thì rơi về `innerWidth`.
 */
function beRongKhung(): number {
  if (typeof window === 'undefined') return 0;
  const goc = document.getElementById('root');
  return goc?.clientWidth || window.innerWidth;
}

/** Khoá đánh dấu đã chuyển một lần, và khoá của dòng báo cho lần mở kế tiếp. */
const KHOA_DA_CHUYEN_MAN_GON = 'khoan_da_da_chuyen_man_gon';
const KHOA_BAO_MAN_GON = 'khoan_da_bao_man_gon';

/**
 * ══════════ MÀN GỌN LÀ MẶC ĐỊNH CỦA VAI "BÁC" — 19/9/2026 ══════════
 *
 * Đo 19/9/2026 trên bản đang chạy: màn siêu đơn giản là màn DUY NHẤT đạt mọi
 * ngưỡng đặt ra cho người cao tuổi — 4 đích chạm, nút 80px, 56 ký tự chữ. Các màn
 * còn lại: Trang chủ 15 đích chạm, Cài đặt 19, Tìm kiếm 1.016 ký tự.
 *
 * Mà nó lại là **tuỳ chọn nằm ở thẻ thứ sáu trong Cài đặt**. Tức màn được thiết kế
 * cho bác là màn bác phải tự đi tìm — trong khi người cần nó nhất là người ít có
 * khả năng đi tìm nhất. Nay nó là mặc định của vai "bác".
 *
 * ⚠️ CHUYỂN ĐÚNG MỘT LẦN, VÀ NÓI RA. `KHOA_DA_CHUYEN_MAN_GON` đảm bảo máy chỉ được
 * chuyển một lần duy nhất; sau đó mọi lựa chọn của bác — kể cả tắt đi — được giữ
 * nguyên mãi mãi. Lần chuyển đó đặt `KHOA_BAO_MAN_GON` để màn gọn hiện một dòng
 * nói đã đổi gì và đường quay lại ở đâu (§4.6: luôn có lối ra, và lối ra phải
 * nhìn thấy được).
 *
 * ⚠️ KHÔNG ĐỤNG TỚI VAI "CON CHÁU". Bảng điều khiển trên máy tính không có màn gọn.
 */
function batManGonChoBac(): boolean {
  try {
    if (localStorage.getItem('khoan_da_sieu_don_gian') === '1') return true;
    // Khoá của "Chế độ tối giản" trên bản APK dựng từ nhánh dev, gộp vào 17/9/2026.
    if (localStorage.getItem('superBasic') === 'true') return true;
    if (localStorage.getItem(KHOA_DA_CHUYEN_MAN_GON) === '1') return false;

    localStorage.setItem(KHOA_DA_CHUYEN_MAN_GON, '1');
    const vai = localStorage.getItem('khoan_da_user_role');
    const laBac = vai === 'elder' || (!vai && beRongKhung() < 1024);
    if (!laBac) return false;
    localStorage.setItem(KHOA_BAO_MAN_GON, '1');
    return true;
  } catch {
    // Trình duyệt chặn localStorage ⇒ giữ hành vi cũ, đừng đoán.
    return false;
  }
}

export default function App() {
  /*
   * ═════ ĐÃ ĐĂNG NHẬP THÌ ĐỪNG BẮT XEM LẠI MÀN GIỚI THIỆU ═════
   *
   * Bản cũ mã cứng `'intro'`, nên MọI lần mở app đều bắt đầu bằng màn
   * "Ai đang dùng máy này?" — kể cả khi bác đã đăng nhập và đã trả lời
   * câu đó hôm qua. Người dùng báo 20/8/2026.
   *
   * ⚠️ QUAN TRỌNG HƠN MỘT PHIỀN PHỨC NHỎVẬT. Nhận xét của ban giám khảo:
   * người dùng có thể sẽ không mở app. Mỗi màn chặn thêm giữa đường là
   * một lý do nữa để không mở — và màn này chặn ĐÚNG lúc bác đang vội.
   *
   * Đọc phiên trực tiếp từ `docPhienTaiKhoan()`, không đợi state — `useState`
   * chỉ chạy hàm khởi tạo một lần, và lần đó phải đúng ngay.
   */
  const [view, setView] = useState<ViewState>(() => {
    try {
      // Luồng kiểm thử: mở `/?intro=1` để quay lại màn chọn vai trò mà không
      // phải xoá phiên đăng nhập hay dữ liệu đã lưu trên máy.
      if (new URLSearchParams(window.location.search).get('intro') === '1') return 'intro';
      if (docPhienTaiKhoan()?.hoSo) return 'home';
      // Chưa đăng nhập nhưng đã chọn vai rồi thì cũng không cần hỏi lại.
      if (localStorage.getItem('daXemIntro') === '1') return 'home';
    } catch { /* trình duyệt chặn localStorage ⇒ cứ hiện intro */ }
    return 'intro';
  });
  const [analyzeResult, setAnalyzeResult] = useState<KetQuaPhanTich | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [buocDangLam, setBuocDangLam] = useState<null | 'doc_chu' | 'doc_anh'>(null);
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

  /**
   * ══════════ CHẾ ĐỘ SIÊU ĐƠN GIẢN ══════════
   *
   * Một màn hình, ba nút, không thanh điều hướng, không tin tức, không thẻ nào
   * khác. Dành cho người chỉ cần đúng một việc: hỏi xem tin này có phải lừa đảo
   * không, và gọi được cho con cháu.
   *
   * ⚠️ ĐÂY KHÔNG PHẢI "BẢN RÚT GỌN CỦA APP" MÀ LÀ MỘT LỐI DÙNG KHÁC.
   * Mọi thứ bị ẩn đều vẫn chạy: bộ luật y hệt, tầng AI y hệt, ba nhãn y hệt.
   * Chỉ có số thứ phải nhìn là ít đi. Đừng ai nghĩ tới việc hạ mức cảnh báo hay
   * bỏ bớt câu `chuaKiem` trong chế độ này — §HĐ luật 3 không có ngoại lệ.
   *
   * ⚠️ LUÔN CÓ LỐI RA (§4.6): nút "Xem đầy đủ" ở cuối màn tắt chế độ này ngay.
   * Người bật nhầm mà không thoát ra được sẽ gỡ ứng dụng.
   */
  const [sieuDonGian, setSieuDonGian] = useState<boolean>(batManGonChoBac);
  useEffect(() => {
    localStorage.setItem('khoan_da_sieu_don_gian', sieuDonGian ? '1' : '0');
    localStorage.removeItem('superBasic');
  }, [sieuDonGian]);

  /**
   * Dòng báo MỘT LẦN cho máy vừa được chuyển sang màn gọn — xem `batManGonChoBac`.
   * Đổi giao diện sau lưng người dùng mà không nói gì là cách nhanh nhất để họ
   * tưởng app hỏng. Bấm "Đã hiểu" là dòng này biến mất vĩnh viễn.
   */
  const [baoDaChuyenManGon, setBaoDaChuyenManGon] = useState<boolean>(
    () => { try { return localStorage.getItem(KHOA_BAO_MAN_GON) === '1'; } catch { return false; } },
  );
  const tatBaoManGon = () => {
    setBaoDaChuyenManGon(false);
    try { localStorage.removeItem(KHOA_BAO_MAN_GON); } catch { /* bị chặn thì thôi */ }
  };

  const [pinnedActionType, setPinnedActionType] = useState<'both' | 'app' | 'danger'>(() => {
    return (localStorage.getItem('pinnedActionType') as 'both' | 'app' | 'danger') || 'both';
  });

  const [userRole, setUserRole] = useState<'elder' | 'guardian'>(() => {
    const saved = localStorage.getItem('khoan_da_user_role');
    if (saved === 'elder' || saved === 'guardian') return saved;
    if (beRongKhung() >= 1024) return 'guardian';
    return 'elder';
  });

  const [isDesktopScreen, setIsDesktopScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return beRongKhung() >= 1024;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('khoan_da_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopScreen(beRongKhung() >= 1024);
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

  const handleAnalyze = async (text: string, image?: string | null, trangThaiNguoiDung?: 'da_chuyen_hoac_doc_ma') => {
    if (!text.trim() && !image) return;
    setIsAnalyzing(true);
    setBuocDangLam(image ? 'doc_anh' : 'doc_chu');
    let finalResult: any = null;

    /*
     * ═════ TRẦN CHỜ: ẢNH ĐƯỢC CHỜ LÂU HƠN CHỮ — 21/8/2026 ═════
     *
     * Bản cũ gọi `fetch` KHÔNG CÓ TRẦN NÀO, nên WebView tự cắt theo mặc định
     * của nó — mỗi ROM một kiểu, và không ai bên này biết nó cắt lúc nào.
     *
     * Hậu quả đo được 21/8/2026: lượt ảnh mất 5–19s vì phải chép chữ trong
     * ảnh trước khi tầng luật được nhìn nó. Bị cắt giữa chừng ⇒ rơi sang
     * `/api/analyze/so-bo` ⇒ đường đó không đọc được ảnh ⇒ bác nhận "lượt này
     * không có AI đọc nội dung", rơi tiếp nữa thì "chưa gửi được nội dung đi
     * kiểm". Người dùng báo đúng cả hai câu đó.
     *
     * ⚠️ ĐỪNG "SỬA" BẰNG CÁCH HẠ TRẦN CHO NHANH. Đã có bài học ở tầng máy chủ:
     * trần 12s làm hỏng 100% lượt gọi, recall rơi từ 67,6% về 3,8%. Chờ nhanh
     * mà mù thì tệ hơn chờ lâu mà thấy.
     */
    const TRAN_CHO_MS = image ? 75_000 : 30_000;
    const huyLuot = new AbortController();
    const dongHo = setTimeout(() => huyLuot.abort(), TRAN_CHO_MS);

    try {
      const res = await fetch(api('/api/analyze'), {
        method: 'POST',
        signal: huyLuot.signal,
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
          trangThaiNguoiDung,
        })
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      finalResult = { ...data, queryText: text, queryImage: image, trangThaiNguoiDung };
    } catch (err) {
      console.warn('Full AI route fallback to preliminary rule check:', err);
      try {
        const res2 = await fetch(api('/api/analyze/so-bo'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Đường dự phòng PHẢI mang cùng trạng thái — thiếu nó thì sơ bộ ra màn khác kết quả cuối.
          body: JSON.stringify({ vanBan: text || '', anh: image || undefined, trangThaiNguoiDung })
        });
        const data2 = await res2.json();
        finalResult = { ...data2, queryText: text, queryImage: image, trangThaiNguoiDung };
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
      clearTimeout(dongHo);
      setBuocDangLam(null);
      if (finalResult) {
        setAnalyzeResult(finalResult);
        // Luồng hai phía ở bản web: chỉ gửi về dashboard Guardian một bản tóm
        // tắt, không lưu nguyên văn nội dung Bác đã nói hoặc ảnh đã quét.
        if (userRole === 'elder') {
          try {
            const raw = localStorage.getItem('khoan_da_guardian_events');
            const events = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : [];
            const nhan = typeof finalResult.nhan === 'string' ? finalResult.nhan : null;
            events.unshift({
              id: Date.now(),
              kind: nhan === 'CAO' ? 'warning' : 'scan',
              title: nhan === 'CAO' ? 'Bố mẹ vừa nhận cảnh báo cần chú ý' : 'Bố mẹ vừa kiểm tra một tình huống',
              detail: nhan ? `Kết quả kiểm tra: ${nhan}. Nội dung gốc không được gửi về máy con.` : 'Chưa có kết luận từ máy chủ.',
              time: 'Vừa xong',
            });
            localStorage.setItem('khoan_da_guardian_events', JSON.stringify(events.slice(0, 10)));
            window.dispatchEvent(new Event('khoan-da-guardian-event'));
          } catch {
            // Không làm hỏng lượt kiểm tra chính nếu bộ nhớ máy bị chặn.
          }
        }
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
            luc: Date.now(),
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
        /*
         * ═════ "KIỂM TIN NHẮN" — TỪ NGÓAI THẲNG VÀO KẾT QUẢ ═════
         *
         * `khoanda://loi-tat/kiem-tin-nhan` đã có trong `shortcuts.xml` và giờ có
         * thêm một nút trên thông báo thường trực — nhưng KHÔNG CÓ NHÁNH NÀO
         * bắt nó. Nó rơi xuống `: 'guardian'` ở cuối, tức bám vào "Kiểm tin
         * nhắn" thì app mở… màn người giám hộ. Đo được 21/8/2026.
         *
         * ⚠️ CHẠM VÀO THÔNG BÁO CHÍNH LÀ CÁI BẤM. §6.9 đòi nội dung chỉ rời máy
         * khi bác bấm — và bác vừa bấm. Không phải tự động gửi; là bớt cho bác
         * ba thao tác tìm đường sau khi đã đồng ý.
         *
         * ⚠️ KHÔNG CÓ TIN THÌ NÓI KHÔNG CÓ TIN. Gửi chuỗi rỗng đi kiểm rồi hiện
         * "Chưa thấy dấu hiệu rủi ro" là trả lời một câu chưa ai hỏi, và câu
         * đó nghe như một lời bảo đảm (§4.3). Về trang chủ, thẻ `TinDangCho`
         * ở đó sẽ tự nói đúng trạng thái.
         */
        /*
         * `quet-anh` — từ menu của bong bóng nổi. Không tự chụp màn hình được
         * (xem `BongBongNoi.moMenu`: chụp từ nền đòi quyền nhìn được MỌI màn hình,
         * kể cả màn hình ngân hàng). Bác tự chụp bằng phím của máy, đây mở
         * chỗ chọn ảnh — một thao tác đổi lấy việc không phải xin quyền đó.
         */
        /*
         * ═════ MÁY TỰ BẬT: ĐANG GỌI + MÃ OTP / ĐANG GỌI + VỪA CÀI APP (Phần 4, 23/9/2026) ═════
         * `CuocGoi.java` mở thẳng tới đây. Dựng lượt "dừng lại" (KHÔNG nhãn rủi ro —
         * bộ luật chưa chạy, §4.2) mang `lyDoTuBat` để màn chọn đúng câu lệnh, và để
         * báo cho con nếu bác đã bật quy tắc thứ hai. Không nội dung tin nào đi theo.
         */
        const LY_DO_TU_BAT = {
          'otp-trong-cuoc-goi': 'otp_trong_cuoc_goi',
          'cai-app-trong-cuoc-goi': 'cai_app_trong_cuoc_goi',
          // 23/9/2026: tin trừ tiền tới trong lúc gọi — xem DocThongBao.kiemTienRaTrongCuocGoi.
          'tien-ra-trong-cuoc-goi': 'tien_ra_trong_cuoc_goi',
        } as const;
        const lyDoTuBat = LY_DO_TU_BAT[d.loiTat as keyof typeof LY_DO_TU_BAT];
        if (lyDoTuBat) {
          setAnalyzeResult({
            canThiep: 'PAUSE_60S', tuBamDung: true, maLyDo: [], daKiem: [], chuaKiem: [],
            lyDoTuBat,
          });
          setView('warning');
          return;
        }
        if (d.loiTat === 'quet-anh') {
          setView('home');
          // Đợi màn chính dựng xong rồi mới mở chỗ chọn ảnh.
          // Ô chọn tệp ẩn của HomeView. Dùng id thay vì luồn ref qua bốn tầng —
          // ít mã hơn, và nếu ố đó đổi tên thì hỏng ngay chứ không hỏng im lặng.
          setTimeout(() => {
            const o = document.getElementById('mobile-image-upload') as HTMLInputElement | null;
            o?.click();
          }, 320);
          return;
        }
        if (d.loiTat === 'kiem-tin-nhan') {
          const tin = await tinMoiNhat();
          if (huy) return;
          if (tin?.co && tin.noiDung) {
            void xoaTinDaBat();
            handleAnalyze(tin.noiDung);
          } else {
            setView('home');
          }
          return;
        }
        setView(d.loiTat === 'dang-bi-goi' ? 'voice'
          : d.loiTat === 'goi-nguoi-than' ? 'family'
            // Lời nhắc 72 giờ trên Android — mở thẳng màn theo dõi, không phải trang con cháu.
            : d.loiTat === 'theo-doi-72-gio' ? 'theo_doi_72h'
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
  /**
   * HỒ SƠ TÀI KHOẢN — nguồn sự thật duy nhất cho "đã đăng nhập hay chưa".
   *
   * ⚠️ KHÔNG CÒN CỜ `isLoggedIn` TRONG localStorage. Bản trước lưu chuỗi
   * `'true'` và tin nó — nghĩa là ai mở công cụ nhà phát triển gõ một dòng là
   * "đăng nhập" được, và quan trọng hơn: cờ đó chẳng liên quan gì tới việc máy
   * chủ có công nhận phiên hay không.
   *
   * Nay `hoSo` chỉ khác `null` khi có một phiên thật, và phiên đó được hỏi lại
   * máy chủ mỗi lần mở app. Hết hạn ⇒ về `null` ⇒ giao diện nói đúng sự thật.
   */
  const [hoSo, setHoSo] = useState<HoSoTaiKhoan | null>(() => docPhienTaiKhoan()?.hoSo ?? null);
  const isLoggedIn = hoSo !== null;

  /**
   * ⚠️ HỎI LẠI MÁY CHỦ MỖI LẦN MỞ APP.
   *
   * Hồ sơ trong máy chỉ nói "lần trước bác đã đăng nhập". Nó không biết phiên
   * đã hết hạn, hay bác đã đăng xuất ở máy khác. Không hỏi lại thì giao diện
   * hiện tên bác như đang đăng nhập, rồi mọi thao tác cần tài khoản đều lặng lẽ
   * hỏng — §4.3, ở đúng chỗ người dùng khó đoán ra nhất.
   *
   * `layHoSo()` trả `null` khi phiên không còn giá trị, và tự xoá token hỏng.
   */
  useEffect(() => {
    if (!docPhienTaiKhoan()) return;
    void layHoSoTaiKhoan().then((hs) => setHoSo(hs));
  }, []);

  /**
   * ⚠️ ĐĂNG XUẤT PHẢI GỌI MÁY CHỦ HUỶ TOKEN, không chỉ xoá ở máy.
   * Xoá mỗi ở máy thì token vẫn sống trên máy chủ tới khi hết hạn — bác đăng
   * xuất khỏi máy con cháu mượn, tưởng đã ra, mà phiên vẫn còn.
   */
  const dangXuat = async () => {
    await dangXuatTaiKhoan();
    setHoSo(null);
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFloatingBall, setShowFloatingBall] = useState(() => localStorage.getItem('showFloatingBall') !== 'false');
  const [, setIsOutsideMode] = useState(false);
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
   * ═══════════ PHÁT HIỆN THỤ ĐỘNG — bác không phải thao tác gì ═══════════
   *
   * Trước đợt này, tin bắt được từ thông báo nằm im trong bộ đệm native chờ bác
   * CHỦ ĐỘNG bấm kiểm. Người đang bị kẻ gian dồn ép là người ít có khả năng bấm
   * nút nhất — nên một bộ đệm chờ bấm gần như không cứu được ai.
   *
   * ⚠️ CHỈ CHẠY Ở VAI NGƯỜI CAO TUỔI. Máy của con cháu không cần quét thông báo
   * của chính họ; làm thế là mở rộng bề mặt riêng tư mà không đổi lấy gì.
   *
   * ⚠️ VÒNG TRÒN GIA ĐÌNH DỰNG TỪ `familyMembers`. Chưa ai trong danh sách thì
   * `quyTac` là `undefined` ⇒ `nenTuDongCanhBao()` trả `chua_co_quy_tac`, và màn
   * cảnh báo đổi nút chính thành "Báo cho …" do BÁC bấm. §12 — không tự bật
   * auto-alert thay chủ tài khoản.
   */
  const vongTronThuDong = React.useMemo(() => {
    /*
     * Đã lập đội phản ứng nhanh: người gọi đầu tiên là người thân tin cậy, những
     * người còn lại trong đội là NGƯỜI DỰ PHÒNG — để máy chủ biết báo ai khi người
     * đầu không mở cảnh báo trong 60 giây (`canDuongDuPhong`). Chưa lập đội thì
     * giữ như cũ: mọi người thân đều là người thân tin cậy.
     */
    const doi = thuTuGoi(docVongTron(), 'CANH_BAO');
    const thanhVien = doi.length > 0
      ? doi.map((n, i) => ({ id: `nt-${n.id}`, vaiTro: i === 0 ? 'nguoi_than_tin_cay' : 'nguoi_du_phong', daThuHoi: false }))
      : familyMembers.map((_m: NguoiThan, i: number) => ({ id: `nt-${i}`, vaiTro: 'nguoi_than_tin_cay', daThuHoi: false }));
    return {
      chuTaiKhoanId: 'bac',
      thanhVien: [{ id: 'bac', vaiTro: 'chu_tai_khoan', daThuHoi: false }, ...thanhVien],
    };
  }, [familyMembers]);

  const canhBaoThuDong = useCanhBaoThuDong({
    bat: userRole === 'elder' && view !== 'intro' && view !== 'login',
    vongTron: vongTronThuDong,
    // Cùng người mà nút gọi trỏ vào — đội phản ứng nhanh nếu đã lập.
    tenNguoiThan: nguoiGoiDauTien()?.ten ?? familyMembers[0]?.name ?? null,
    /*
     * §12 — KHÔNG tự quay số. Đưa bác sang màn Vòng tròn gia đình, nơi có nút
     * gọi và nơi bác thấy mình đang gọi cho ai.
     */
    onGoiNguoiThan: () => setView('family'),
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

  /** Ghép xong ở bất kỳ lối nào ⇒ người con vào danh sách gọi khẩn cấp (Phần 2, 23/9/2026). */
  const hopNhatDaGhep = (ds: { ten: string; so: string }[]) =>
    setFamilyMembers((cu: NguoiThan[]) => hopNhatNguoiThan(cu, ds));

  /*
   * ⚠️ MỞ APP LÀ NẠP LẠI NGƯỜI ĐÃ GHÉP — sửa 23/9/2026.
   * Con nhập mã trên MÁY CON; máy bố mẹ không nghe được lúc đó. Trước đây số của
   * con chỉ vào danh sách gọi khi bác tự mở "Nối với con cháu" — đo được: đã ghép
   * với Minh mà màn khẩn cấp vẫn chỉ có "Gọi Cảnh Sát 113". Nút gọi con là việc
   * DUY NHẤT của màn khẩn cấp, nên nó không được phụ thuộc vào một lần mở màn khác.
   * Lỗi mạng thì giữ nguyên danh sách đang có (§4.3 — không tự xoá ai).
   */
  useEffect(() => {
    if (!hoSo) return;
    let huy = false;
    docVongGhep()
      .then((v) => { if (!huy && v.thanhVien.length > 0) hopNhatDaGhep(v.thanhVien); })
      .catch(() => undefined);
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoSo?.id]);

  /*
   * NHỊP BẢO VỆ (23/9/2026) — "máy bố mẹ còn được bảo vệ không?". Mở app, đăng
   * nhập, quay lại app ⇒ `dongBoNhipBaoVe` tự đọc quy tắc: bác CHƯA bật thì không gửi
   * gì và thu hồi token của dịch vụ nền; đăng xuất (hoSo = null) cũng thu hồi.
   */
  useEffect(() => {
    void dongBoNhipBaoVe();
    const khiQuayLai = () => { if (document.visibilityState === 'visible') void dongBoNhipBaoVe(); };
    document.addEventListener('visibilitychange', khiQuayLai);
    return () => document.removeEventListener('visibilitychange', khiQuayLai);
  }, [hoSo?.id]);

  /**
   * DIỄN TẬP — đường "tự bấm dừng" có sẵn (KHÔNG nhãn rủi ro, §4.2) + cờ `dienTap`.
   * Màn cảnh báo hiện băng "ĐÂY LÀ DIỄN TẬP" và KHÔNG ghi kết quả can thiệp (§4.6).
   */
  const triggerDienTap = () => {
    setAnalyzeResult({ canThiep: 'PAUSE_60S', tuBamDung: true, dienTap: true, maLyDo: [], daKiem: [], chuaKiem: [] });
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
    /*
     * ⚠️ DỌN CỜ CŨ. Máy đã cài bản trước còn `isLoggedIn: 'true'` nằm lại; nó
     * không còn được đọc, nhưng để lại một cờ đăng nhập vô chủ trong máy người
     * dùng là thói quen xấu.
     */
    localStorage.removeItem('isLoggedIn');
  }, []);

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
                className="bg-white/20 hover:bg-white/30 text-white px-2.5 sm:px-3 py-1 rounded-2xl font-bold text-[14px] sm:text-[14px] shadow-xs border border-white/20 flex items-center gap-1 active:scale-95 transition-transform"
                title={t("Vào màn hình chính")}
              >
                <Sparkles size={12} className="text-yellow-300" /> {t("Vào App")}
              </button>
            )}

            {(pinnedActionType === 'both' || pinnedActionType === 'danger') && (
              <button
                onClick={() => triggerEmergencyAlert()}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-2.5 sm:px-3 py-1 rounded-2xl font-bold text-[14px] sm:text-[14px] shadow-sm border border-red-400 flex items-center gap-1 active:scale-95 transition-transform"
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
          {/*
            ═════ NÓI ĐANG LÀM GÌ, VÀ NÓI LƯỢT ẢNH LÂU HƠN ═════

            Người dùng báo 21/8/2026: "khi tôi nhập ảnh thì nó đọc dữ liệu quá
            lâu và không biết có hoạt động không".

            Lượt ảnh thật sự lâu hơn — đo được 5–19s, vì phải chép chữ trong
            ảnh ra trước rồi tầng luật mới đọc được. Đó không phải lỗi.

            ⚠️ NHƯNG MỘT THANH XOAY KHÔNG NÓI ĐƯỢC ĐIỀU ĐÓ. Nó trông giống hệt
            lúc đang chạy và lúc đã treo. Bác ngồi nhìn 15 giây rồi kết luận app
            hỏng — đúng loại lỗi §4.3 nhưng ở tầng cảm giác: KHÔNG BIẾT KHÁC
            VỚI KHÔNG CHẠY, và màn hình đang trình bày hai thứ đó giống nhau.

            ⚠️ KHÔNG HỨA THỜI GIAN CỤ THỂ. "Khoảng 10 giây" mà hóa ra 30 thì
            tệ hơn là không nói gì. Chỉ nói nó LÂU HƠN và VÌ SAO.
          */}
          <h3 className="text-2xl font-black text-white mb-2">
            {buocDangLam === 'doc_anh'
              ? t('Cháu đang đọc chữ trong ảnh…')
              : t('Khoan Đã đang đọc dữ liệu...')}
          </h3>
          <p className="text-purple-200 text-sm max-w-xs font-medium">
            {buocDangLam === 'doc_anh'
              ? t('Ảnh lâu hơn chữ một chút, vì cháu phải chép chữ trong ảnh ra trước đã. Bác chờ cháu một lát nhé.')
              : t('Hệ thống AI và bộ luật bảo vệ đang trích xuất tín hiệu, nhận diện dấu hiệu lừa đảo và kiểm tra an toàn cho bác.')}
          </p>
        </div>
      )}

      {/* MOBILE & TABLET & NORMAL ELDER MODE */}
      {!((isDesktopScreen && userRole !== 'elder') || userRole === 'guardian' || isUltraZoomedOut) ? (
        <div className="flex w-full h-[100dvh] max-h-[100dvh] flex-col relative isolate overflow-hidden bg-[#f8f4ff] select-none touch-none overscroll-none
          md:max-w-[430px] md:mx-auto md:my-auto md:h-[96vh] md:max-h-[932px] md:rounded-[3.25rem] md:shadow-[0_28px_70px_rgba(20,16,55,0.28),0_0_0_1px_rgba(255,255,255,0.7)] md:border-[7px] md:border-[#17152f]
          lg:max-w-none lg:mx-0 lg:my-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:rounded-none lg:border-0 lg:shadow-none">
          {/* iPhone 17 Pro Max-style Dynamic Island and home indicator. */}
          <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-[118px] h-[34px] rounded-full bg-[#090912] shadow-[inset_0_1px_2px_rgba(255,255,255,0.12),0_1px_3px_rgba(0,0,0,0.35)] z-[90] pointer-events-none" aria-hidden="true"></div>
          <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-[132px] h-1 rounded-full bg-[#17152f]/85 z-[90] pointer-events-none" aria-hidden="true"></div>
          {/*
            ⚠️ HAI ĐỐM SÁNG NẰM DƯỚI NỘI DUNG, KHÔNG PHẢI TRÊN — sửa 22/9/2026.
            Người dùng báo màn "Bảo vệ 72 giờ" chữ mờ loang: hai đốm này là `absolute`,
            mà màn nào không tự đặt `relative` (72 giờ, sổ ngân hàng, hồ sơ…) là chữ
            của nó bị vẽ DƯỚI lớp trắng 60% + tím nhòe. `isolate` ở khung + `-z-10` ở
            đốm: đốm luôn nằm trên nền khung và dưới mọi màn, không cần màn nào nhớ.
          */}
          <div className="absolute -z-10 top-[-5%] left-[-10%] w-72 h-72 bg-white opacity-60 rounded-full blur-3xl pointer-events-none select-none"></div>
          <div className="absolute -z-10 bottom-1/4 right-[-20%] w-80 h-80 bg-[#d8b4fe] opacity-30 rounded-full blur-[80px] pointer-events-none select-none"></div>
          
          {/*
            ⚠️ MỘT MÀN HỎNG THÌ CHỈ MÀN ĐÓ HIỆN LỖI.
            Không có hàng rào, React gỡ nguyên cả nhánh và người dùng thấy một ô
            trắng không chữ không nút — đo trên máy thật 20/8/2026, và vì màn
            hình không nói gì nên ba vòng chẩn đoán đầu đều đoán sai nguyên nhân.
          */}
          <HangRaoLoi
            loiChinh={t('Phần này chưa mở được')}
            loiPhu={t('Các phần khác của Khoan Đã vẫn dùng được bình thường.')}
            nhanThoat={t('Trang chủ')}
            onThoat={() => setView('home')}
          >
          <AnimatePresence mode="wait">
            {view === 'intro' && <IntroView setView={setView} t={t} setUserRole={setUserRole} />}
            {view === 'home' && sieuDonGian && (
              <ManSieuDonGian
                t={t}
                setView={setView}
                familyMembers={familyMembers}
                onTriggerEmergency={triggerEmergencyAlert}
                onTat={() => setSieuDonGian(false)}
                baoDaChuyen={baoDaChuyenManGon}
                onTatBao={tatBaoManGon}
              />
            )}
            {view === 'home' && !sieuDonGian && (
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
                lang={lang}
              />
            )}
            {view === 'voice' && <VoiceView setView={setView} t={t} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} onTriggerEmergency={triggerEmergencyAlert} />}
            {view === 'tro_ly' && (
              <TroLyNoi
                t={t}
                lang={lang === 'en' ? 'en' : 'vi'}
                onVeTrangChu={() => setView('home')}
                /*
                 * Đường ra DUY NHẤT tới kết luận, và nó là đúng `handleAnalyze` mà
                 * mọi lượt kiểm khác dùng. Trợ lý không có đường chấm riêng — hai
                 * đường chấm là hai đường sẽ lệch nhau (§4.3).
                 */
                onKiemTin={(noiDung) => handleAnalyze(noiDung)}
              />
            )}
            {view === 'search' && <SearchView setView={setView} t={t} lang={lang} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} superBasic={sieuDonGian} />}
            {view === 'history' && <HistoryView setView={setView} t={t} lang={lang} isLoggedIn={isLoggedIn} historyItems={historyItems} setHistoryItems={setHistoryItems} setAnalyzeResult={setAnalyzeResult} />}
            {view === 'profile' && <ProfileView setView={setView} t={t} isLoggedIn={isLoggedIn} hoSo={hoSo} onDangXuat={dangXuat} />}
            {view === 'family' && <FamilyView setView={setView} t={t} lang={lang} isLoggedIn={isLoggedIn} familyMembers={familyMembers} setFamilyMembers={setFamilyMembers} />}
            {view === 'learn' && <KhungTaiTre t={t}><LearnView setView={setView} t={t} lang={lang} onTriggerEmergency={triggerEmergencyAlert} /></KhungTaiTre>}
            {view === 'login' && <LoginView setView={setView} t={t} lang={lang} onDangNhapXong={setHoSo} userRole={userRole} setUserRole={setUserRole} />}
            {view === 'add_family' && <AddFamilyView setView={setView} t={t} setFamilyMembers={setFamilyMembers} />}
            {view === 'mat_khau_gia_dinh' && <MatKhauGiaDinh setView={setView} t={t} />}
            {view === 'quy_tac_gia_dinh' && <ManDatQuyTac setView={setView} t={t} lang={lang} />}
            {view === 'doi_phan_ung' && <ManDoiPhanUng setView={setView} t={t} lang={lang} />}
            {view === 'so_ngan_hang' && <ManSoNganHang setView={setView} t={t} lang={lang} />}
            {view === 'theo_doi_72h' && <ManTheoDoi72Gio setView={setView} t={t} lang={lang} />}
            {view === 'ho_so_vu_viec' && <ManHoSoVuViec setView={setView} t={t} lang={lang} lichSu={historyItems} />}
            {view === 'ra_da_thu_doan' && <ManRaDaThuDoan setView={setView} t={t} lang={lang} lichSu={historyItems} />}
            {view === 'cong_dong' && <CongDongCanhGiac t={t} setView={setView} />}
            {view === 'ghep_con_chau' && <ManGhepConChau t={t} setView={setView} onDanhSach={hopNhatDaGhep} />}
            {view === 'chia_khoa' && <ManChiaKhoa t={t} setView={setView} />}
            {view === 'ngan_hang_mo_phong' && <ManNganHangMoPhong t={t} setView={setView} />}
            {view === 'con_cai_giup' && (
              <ManConCaiGiup t={t} setView={setView} onDangNhapXong={setHoSo} onDanhSachGhep={hopNhatDaGhep} onDienTap={triggerDienTap} />
            )}
            {view === 'warning' && <WarningView setView={setView} t={t} lang={lang} result={analyzeResult} familyMembers={familyMembers} noiChayAi={noiChayAi} mayCoUngDungLa={mayCoUngDungLa}
              onBaoDaChuyen={() => {
                // Không có chữ hay ảnh (bác tự bấm "Khẩn cấp") thì không có gì để gửi lại —
                // khối phục hồi phía trình duyệt vẫn đã hiện rồi.
                const vb = analyzeResult?.queryText || '';
                const anh = analyzeResult?.queryImage || null;
                if (vb.trim() || anh) void handleAnalyze(vb, anh, 'da_chuyen_hoac_doc_ma');
              }} />}
            {view === 'guardian' && <GuardianView setView={setView} t={t} lang={lang} setUserRole={setUserRole} isDesktop={false} isLoggedIn={isLoggedIn} onAnalyze={handleAnalyze} familyMembers={familyMembers} onTriggerEmergency={triggerEmergencyAlert} />}
            {view === 'account' && <AccountView setView={setView} t={t} hoSo={hoSo} onDangXuat={dangXuat} onLuuTen={async (ten) => setHoSo(await suaHoSoTaiKhoan({ ten }))} />}
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
            {view === 'hoi_nhanh' && <HoiNhanhView setView={setView} t={t} lang={lang} onTriggerEmergency={triggerEmergencyAlert} familyMembers={familyMembers} />}
            {view === 'settings' && (
              <SettingsView
                sieuDonGian={sieuDonGian}
                setSieuDonGian={setSieuDonGian} 
                setView={setView}
                t={t}
                lang={lang}
                setLang={setLang}
                fontSize={fontSize}
                setFontSize={setFontSize}
                isLoggedIn={isLoggedIn}
                pinnedNotification={pinnedNotification}
                togglePinnedNotification={togglePinnedNotification}
                showFloatingBall={showFloatingBall}
                setShowFloatingBall={setShowFloatingBall}
                onOpenOutsideMode={() => setIsOutsideMode(true)}
                onOpenMenu={() => setIsMenuOpen(true)}
               onDangXuat={dangXuat}/>
            )}
          </AnimatePresence>
          </HangRaoLoi>

          {/*
            ⚠️ §4.6 — CHẾ ĐỘ SIÊU ĐƠN GIẢN VẪN PHẢI CÓ ĐƯỜNG VỀ.
            Đo trong trình duyệt 20/8/2026: bấm "Kiểm tin nhắn" sang màn Kiểm
            tra, và màn đó KHÔNG có nút quay lại — bình thường người dùng bấm
            thanh điều hướng, mà chế độ này đã ẩn nó. Bác vào là kẹt, không
            thoát ra được bằng thao tác nào trong app.

            Một thanh, một nút, chữ to. Không dựng lại năm biểu tượng — cả màn
            chỉ có ba việc, không cần một bản đồ.
          */}
          {/*
            ⚠️ ĐỪNG HIỆN THANH NÀY TRÊN MÀN ĐÃ CÓ NÚT CỦA RIÊNG NÓ.
            Đo trên máy thật 20/8/2026: ở màn "Thêm người thân", thanh "Quay lại"
            nằm đè lên đúng hai nút "Huỷ" và "Lưu người thân" — người dùng nhìn
            thấy ba nút chồng nhau và không bấm được nút lưu.
            Mấy màn dưới đây đều tự có đường ra; thêm một đường nữa là che mất
            đường sẵn có.
          */}
          {sieuDonGian && !['home', 'add_family', 'login', 'warning', 'hoi_nhanh', 'mat_khau_gia_dinh'].includes(view) && (
            <div className="absolute bottom-0 left-0 w-full px-4 pb-5 pt-3 bg-gradient-to-t from-[#f8f4ff] via-[#f8f4ff] to-transparent z-50">
              <button
                onClick={() => setView('home')}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-white font-black text-[18px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                <ChevronLeft size={24} strokeWidth={3} />
                {t('Quay lại')}
              </button>
            </div>
          )}

          {/* Bottom Nav */}
          {!sieuDonGian && (
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
                /*
                  Chế độ siêu đơn giản KHÔNG có thanh điều hướng: năm biểu tượng
                  là năm thứ phải hiểu, mà cả màn chỉ có ba việc để làm.
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
                        /*
                          ⚠️ `aria-label` Ở MỌI NÚT, KHÔNG CHỈ NÚT ĐANG CHỌN.
                          Đo 20/8/2026: năm nút điều hướng chỉ có biểu tượng; nhãn chữ
                          `hidden lg:inline` nên trên điện thoại không hề có trong DOM,
                          và nhãn của nút đang chọn thuộc một nhánh khác. Kết quả:
                          TalkBack đọc bốn nút kia là "nút" — không tên.
                          Nhãn lấy từ `item.label`, tức từ catalog i18n (§4.1).
                        */
                        aria-label={item.label}
                        onClick={() => setView(item.id as ViewState)} 
                        className={`relative z-10 transition-all duration-300 flex items-center justify-center rounded-full active:scale-95 shrink-0
                          lg:rounded-full lg:px-5 lg:h-[3.4rem] lg:gap-2.5 lg:w-auto ${
                          isActive
                            ? 'bg-white/25 shadow-[0_0_20px_rgba(255,255,255,0.4)] text-white px-2.5 min-[375px]:px-3.5 h-[52px] sm:h-[3.6rem] lg:bg-white lg:text-[#6d28d9] lg:shadow-md'
                            : 'text-white/70 hover:text-white w-[52px] h-[52px] sm:w-[3.6rem] sm:h-[3.6rem] lg:text-white/85 lg:hover:bg-white/20 lg:w-auto'
                        }`}
                        /*
                          ⚠️ §4.4 — SÀN 52px BẰNG PX CỐ ĐỊNH, KHÔNG BẰNG rem.
                          Ở bậc chữ "nhỏ" (gốc 15px) `3.25rem` chỉ ra 48,75px — dưới sàn
                          ngay cả khi flex không bóp gì. Từng thử `w-[max(52px,3.25rem)]`
                          — Tailwind KHÔNG sinh ra CSS nào cho lớp đó, lặng lẽ như không
                          có gì hỏng. `shrink-0` để hàng 5 nút không co dưới sàn khi hẹp:
                          đo ở khổ 320px, bốn nút từng bị flex bóp còn 40px.
                        */
                      >
                        {/*
                          ⚠️ 28px, KHÔNG PHẢI 24px. Người dùng báo 20/8/2026:
                          "cái icon taskbar bị bé tí luôn".

                          §4.4 đặt sàn cho VÙNG CHẠM (52px) và CỠ CHỮ (14px), nhưng
                          KHÔNG đặt sàn cho cỡ BIỂU TƯỢNG — nên một biểu tượng 24px nằm
                          giữa vùng chạm 52px vẫn qua được mọi test. Vùng chạm đủ to
                          không có nghĩa là NHÌN THẤY được cái gì trong đó.

                          Ở máy hẹp dưới 375px nhãn chữ ẩn, nên biểu tượng là THỨ DUY
                          NHẤT phân biệt được các nút. Ở đó nó không phải trang trí — nó
                          là nhãn.
                        */}
                        <Icon size={28} fill={isActive && item.id !== 'search' ? "currentColor" : "none"} strokeWidth={isActive ? 2.4 : 2.2} />
                        {/*
                          Trên máy tính nhãn hiện thường trực — có chỗ, và người
                          cao tuổi đọc chữ nhanh hơn đoán biểu tượng.
                        */}
                        <span className="hidden lg:inline font-bold text-[15px]">{item.label}</span>
                        {/*
                          ⚠️ NHÃN NÚT ĐANG CHỌN CHỈ HIỆN TỪ 375px.
                          Ở 320px thì giữ nhãn VÀ đủ 52px là bất khả: năm nút cần
                          ~338px trong khi khung chỉ có ~296px. Sàn vùng chạm là ràng
                          buộc cứng, nhãn chữ thì không — bấm trượt là hỏng việc, mất
                          chữ chỉ là bớt tiện. Nhánh dev từng bỏ hẳn nhãn (4/9 sáng);
                          bản web chọn cách này chiều cùng ngày để máy 375px trở lên —
                          phần lớn điện thoại — vẫn có chữ. `aria-label` còn nguyên ở
                          mọi nút nên TalkBack không mất gì.

                          ⚠️ ĐỪNG CHẠY HIỆU ỨNG TRÊN `width` KÈM `overflow-hidden`.
                          Bản trước chạy `width: 0 → auto` rồi cắt phần thừa: khi thanh
                          không đủ chỗ, chữ bị CẮT CỤT và nằm im như vậy — người dùng
                          báo 20/8/2026. Chạy `opacity` thôi; nút tự co giãn theo nhãn.
                        */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.span
                              initial={{ opacity: 0, marginLeft: 0 }}
                              animate={{ opacity: 1, marginLeft: 6 }}
                              exit={{ opacity: 0, marginLeft: 0 }}
                              className="hidden min-[375px]:inline lg:hidden font-bold text-[14px] shrink-0"
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
          )}
        </div>
      ) : (
        /* DESKTOP GUARDIAN DASHBOARD (Optimized for Child / Guardian) */
        <div className="flex w-full h-full min-h-screen max-h-full relative flex-col overflow-y-auto overscroll-contain touch-pan-y bg-[#f7f8fc]">
           {/* Desktop Topbar for Guardian */}
           <header className="flex flex-col gap-4 px-5 sm:px-8 lg:px-12 py-4 relative z-20 bg-white border-b border-slate-200/80 sticky top-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                 <div className="w-10 h-10 bg-sky-600 rounded-2xl flex items-center justify-center shadow-sm text-white shrink-0">
                    <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
                 </div>
                 <div className="min-w-0">
                    <h1 className="font-black text-[18px] text-slate-900 leading-tight flex items-center gap-2">
                      Khoan Đã <span className="text-sky-700 text-[14px] font-bold bg-sky-50 px-2 py-0.5 rounded-md">Guardian</span>
                    </h1>
                    <p className="text-[14px] text-slate-500 font-medium truncate">{t("Bảng điều khiển an toàn dành cho con cháu")}</p>
                 </div>
                </div>
              </div>
              <div className="flex justify-end w-full">
                 <button onClick={() => { if (isLoggedIn) { void dangXuat(); } else { setView('login'); } }} className="min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-[14px] transition-opacity active:scale-[0.98]">
                   {isLoggedIn ? <><LogOut className="w-4 h-4" /> <span className="text-[14px]">{t("Đăng xuất")}</span></> : <><UserCircle className="w-4 h-4" /> <span className="text-[14px]">{t("Đăng nhập")}</span></>}
                 </button>
              </div>
           </header>

           {/* Render Guardian Views on Desktop */}
           <AnimatePresence mode="wait">
              {/*
                ⚠️ PHẢI TRUYỀN `t`. Hai view này khai `t?:` (tuỳ chọn) và rơi về
                `(k) => k` khi thiếu — mà khoá trong dự án này LÀ tiếng Việt. Nên
                quên truyền `t` không gây lỗi, không cảnh báo: bản tiếng Việt chạy
                đúng y như cũ, chỉ người chọn English mới thấy nguyên màn chữ Việt.
                Đo 20/8/2026: cả màn giới thiệu vai người con hiện tiếng Việt
                trong khi phần còn lại của app đã sang tiếng Anh.
              */}
              {view === 'intro' && <GuardianIntroView setView={setView} setUserRole={setUserRole} t={t} />}
              {view === 'login' && <GuardianAuthView setView={setView} onDangNhapXong={setHoSo} setUserRole={setUserRole} t={t} />}
              {view === 'hoi_nhanh' && <HoiNhanhView setView={setView} t={t} lang={lang} onTriggerEmergency={triggerEmergencyAlert} familyMembers={familyMembers} />}
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
      <HangRaoLoi
        loiChinh={t('Phần này chưa mở được')}
        loiPhu={t('Các phần khác của Khoan Đã vẫn dùng được bình thường.')}
        nhanThoat={t('Đóng')}
        onThoat={() => setIsMenuOpen(false)}
      >
      {userRole !== 'guardian' && <AppMenuModal 
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
      />}
      </HangRaoLoi>

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
      {/*
        ═══════════ MÀN CẢNH BÁO THỤ ĐỘNG — TRÊN CÙNG MỌI THỨ ═══════════

        Đặt Ở ĐÂY, sau mọi view và sau cả bóng nổi, vì nó phải phủ kín màn hình.
        Người đang nghe kẻ gian nói KHÔNG nhìn thấy một thông báo nhỏ trong khay.

        §4.6 — nó luôn có lối ra. Xem `CanhBaoToanManHinh.tsx`.
      */}
      {canhBaoThuDong.man && (
        <CanhBaoToanManHinh
          man={canhBaoThuDong.man}
          t={t}
          onGoi={canhBaoThuDong.goi}
          onDong={canhBaoThuDong.dong}
          onToiOn={canhBaoThuDong.toiOn}
        />
      )}

    </div>
  );
}

// --- Home View ---
/**
 * ══════════════ MÀN SIÊU ĐƠN GIẢN ══════════════
 *
 * Ba việc, ba nút, hết. Không thanh điều hướng, không tin tức, không thẻ phụ.
 *
 * ⚠️ ÍT THỨ TRÊN MÀN, KHÔNG PHẢI ÍT BẢO VỆ. Bấm "Kiểm tin nhắn" ở đây đi vào
 * đúng đường phân tích của màn thường: cùng bộ luật, cùng tầng AI, cùng ba nhãn,
 * cùng câu `chuaKiem`. §HĐ luật 3 không có ngoại lệ cho chế độ này.
 *
 * ⚠️ NÚT CAO 96px, GẤP GẦN HAI LẦN SÀN §4.4 (56px). Người cần chế độ này là
 * người bấm trượt ở cỡ thường — giữ đúng sàn thì không giải quyết được gì.
 *
 * ⚠️ §4.6 — LUÔN CÓ LỐI RA. Dòng "Xem đầy đủ" ở cuối tắt chế độ này ngay lập
 * tức. Người bật nhầm mà không thoát ra được sẽ gỡ ứng dụng.
 */
/**
 * ═════ BẤM GHI ÂM THÌ PHẢI BIẾT LÀ ĐÃ GHI ═════
 *
 * Người dùng báo 20/9/2026: bấm nút ghi âm mà không biết nó đã chạy chưa.
 *
 * Màn cũ chỉ báo bằng MẮT: quầng sáng nhấp nháy và một chấm đỏ 12px. Với mắt
 * kém, hai thứ đó trông giống hệt luúc chưa bấm — cả hai trạng thái đều là "một
 * vòng tròn có hào quang". Và đây là màn hay được dùng đúng lúc đang áp điện
 * thoại vào tai, tức lúc KHÔNG NHÌN ĐƯỢC MÀN HÌNH.
 *
 * Nên lời báo đi bằng ba đường: một tiếng "bíp", một nhịp rung, và một vệt đỏ
 * to ở đầu màn. Hỏng đường nào thì hai đường còn lại vẫn nói được.
 *
 * ⚠️ CHỈ KÊU KHI BÁC TỰ BẤM. Lượt ghi âm tự mở theo luồng khác thì im — một
 * tiếng bíp không ai bấm ra là một tiếng động không giải thích được.
 *
 * ⚠️ TỰ TẮT KHI MÁY KHÔNG CHO. Trình duyệt chặn âm thanh chưa có tương tác,
 * máy bàn không có bộ rung — cả hai đều ném lỗi, và cả hai đều không được
 * phép làm hỏng việc ghi âm. Nuốt lỗi ở đây là đúng, vì vệt đỏ vẫn còn đó.
 */
function bipGhiAm(batDau: boolean) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      const bat = ctx.currentTime;
      // Bắt đầu: hai nốt đi LÊN. Dừng: một nốt đi XUỐNG. Nghe là biết chiều nào.
      const notes: Array<[number, number]> = batDau ? [[660, 0], [880, 0.12]] : [[440, 0]];
      for (const [tanSo, tre] of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = tanSo;
        // Vào êm ra êm: để mộc thì loa điện thoại kêu "tạch" ở hai đầu.
        gain.gain.setValueAtTime(0.0001, bat + tre);
        gain.gain.exponentialRampToValueAtTime(0.25, bat + tre + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, bat + tre + 0.11);
        osc.connect(gain).connect(ctx.destination);
        osc.start(bat + tre);
        osc.stop(bat + tre + 0.12);
      }
      setTimeout(() => { try { ctx.close(); } catch { /* đóng rồi */ } }, 600);
    }
  } catch { /* trình duyệt chặn âm thanh — vẫn còn rung và vệt đỏ */ }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(batDau ? [60, 50, 60] : 40);
    }
  } catch { /* máy không có bộ rung */ }
}

/**
 * ══════════════ BỐN SẮC CỦA BỐN NÚT MÀN GỌN — 23/9/2026 ══════════════
 *
 * Người dùng yêu cầu: "màu tím kia thì cho giống với màu thanh taskbar". Nên nút
 * "Nói" lấy ĐÚNG dải màu của thanh điều hướng dưới (`from-[#9e76ea] via-[#ad8af0]
 * to-[#9e76ea]`, xem khối `!sieuDonGian` ở trên), không pha thêm bậc nào.
 *
 * ⚠️ NHƯNG CHỮ TRÊN NÓ LÀ MỰC ĐẬM, KHÔNG PHẢI CHỮ TRẮNG. Đo: chữ trắng trên dải
 * này chỉ đạt 3,37:1 ở stop tối nhất và 2,68:1 ở giữa — dưới sàn 4.5:1 (§4.4).
 * Mực `--color-ink` đạt 5,42:1 ở stop tối nhất. Hợp đồng a11y thắng ảnh thiết kế.
 *
 * Ba nút kia giữ chữ trắng, nên nền phải đủ tối ở MỌI điểm của dải loang, kể cả
 * stop sáng ở giữa: xanh 4,93:1 · đỏ 4,83:1 · tím đêm 9,95:1. Làm sáng stop giữa
 * thêm một bậc là trượt sàn — đo lại trước khi đổi.
 *
 * ⚠️ KHÔNG PHỦ LỚP BÓNG TRẮNG LÊN NỬA TRÊN NÚT như các nút tròn ở trang chủ. Các
 * nút đó không mang chữ; ở đây lớp bóng nằm đè lên chữ và kéo tương phản xuống
 * dưới sàn. Độ bóng chỉ đi bằng một đường sáng 2px ở mép trên (inset).
 */
const SAC_NUT_GON = {
  noi: {
    nen: 'bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-[color:var(--color-ink)] shadow-[0_14px_28px_-12px_rgba(90,30,160,0.6),inset_0_2px_0_rgba(255,255,255,0.4)]',
    bieuTuong: 'text-[#6d28d9]',
  },
  nguoiNha: {
    nen: 'bg-gradient-to-r from-[#047857] via-[#08805d] to-[#047857] text-white shadow-[0_14px_28px_-12px_rgba(4,120,87,0.65),inset_0_2px_0_rgba(255,255,255,0.25)]',
    bieuTuong: 'text-[#047857]',
  },
  khanCap: {
    nen: 'bg-gradient-to-r from-[#c81e1e] via-[#dc2626] to-[#c81e1e] text-white shadow-[0_14px_28px_-12px_rgba(220,38,38,0.7),inset_0_2px_0_rgba(255,255,255,0.25)]',
    bieuTuong: 'text-[#dc2626]',
  },
  cuocGoi: {
    nen: 'bg-gradient-to-r from-[#3d1d8f] via-[#4a27a3] to-[#3d1d8f] text-white shadow-[0_14px_28px_-12px_rgba(46,16,101,0.7),inset_0_2px_0_rgba(255,255,255,0.2)]',
    bieuTuong: 'text-[#4a27a3]',
  },
} as const;

/**
 * Một nút của màn gọn: viên thuốc bo tròn hẳn, biểu tượng nằm trong một đồng xu
 * trắng ở đầu trái, nhãn canh trái — bốn biểu tượng thẳng một cột, mắt không phải
 * đi tìm chữ bắt đầu ở đâu.
 *
 * ⚠️ ĐỒNG XU ĐỒNG TÂM VỚI ĐẦU TRÒN CỦA NÚT: đệm trái = đệm dọc (`pl-4.5` = `py-4.5`),
 * nên tâm đồng xu trùng tâm nửa vòng tròn ở mọi bậc cỡ chữ — mọi số đều theo rem.
 *
 * ⚠️ CỠ CHỮ ĐẶT TRÊN <span>, KHÔNG TRÊN <button>. `public/vung-cham-san.css` khai
 * `button { font-size: max(var(--text-xs), 1em) }`, không dùng `@layer`, nên thắng
 * mọi utility Tailwind trên chính thẻ nút. Đo 23/9/2026: bản trước ghi
 * `text-[22px]` lên nút mà nhãn chỉ ra 17px. Đặt bằng rem để đi theo bậc A/A+/A++.
 */
function NutGon({
  sac,
  Icon,
  onClick,
  children,
}: {
  sac: keyof typeof SAC_NUT_GON,
  Icon: React.ComponentType<{ size?: number, strokeWidth?: number }>,
  onClick: () => void,
  children: React.ReactNode,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 rounded-full border border-white/35 py-4.5 pl-4.5 pr-6 text-left transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none ${SAC_NUT_GON[sac].nen}`}
    >
      <span
        aria-hidden="true"
        className={`grid place-items-center w-14 h-14 shrink-0 rounded-full bg-gradient-to-b from-white to-[#f3eefc] shadow-[0_6px_14px_-4px_rgba(30,10,70,0.35),inset_0_-2px_0_rgba(46,16,101,0.08)] ${SAC_NUT_GON[sac].bieuTuong}`}
      >
        <Icon size={30} strokeWidth={2.4} />
      </span>
      <span className="text-[1.3125rem] font-bold">{children}</span>
    </button>
  );
}

function ManSieuDonGian({
  t,
  setView,
  familyMembers,
  onTriggerEmergency,
  onTat,
  baoDaChuyen,
  onTatBao,
}: {
  t: any,
  setView: (v: ViewState) => void,
  familyMembers?: NguoiThan[],
  onTriggerEmergency?: () => void,
  onTat: () => void,
  baoDaChuyen?: boolean,
  onTatBao?: () => void,
}) {
  // Cùng người mà mọi nút gọi con cháu khác trỏ vào — người đầu đội phản ứng nhanh
  // nếu bác đã lập đội, không thì người thân đầu danh sách.
  const nguoiDoi = nguoiGoiDauTien();
  const nguoiDauTien = nguoiDoi
    ? { name: nguoiDoi.ten, phone: nguoiDoi.dienThoai }
    : familyMembers?.[0] ?? null;

  const goiNguoiNha = () => {
    if (nguoiDauTien?.phone) window.open(`tel:${String(nguoiDauTien.phone).replace(/\s/g, '')}`, '_self');
    else setView('family');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col w-full relative z-10 px-5 pt-5 pb-5 overflow-y-auto"
    >
      <div className="flex items-center justify-center gap-2 mb-5 shrink-0">
        <img src="/logo.webp" alt="" className="w-9 h-9 object-contain" />
        <span className="text-[22px] font-black text-[#2e1065]">Khoan Đã</span>
      </div>

      {/*
        DÒNG BÁO MỘT LẦN — máy vừa được chuyển sang màn gọn (xem `batManGonChoBac`).
        Nói đúng hai điều: đã đổi gì, và quay lại bằng nút nào. Không nài nỉ, không
        giải thích dài; bấm "Đã hiểu" là mất hẳn.
      */}
      {/*
        Viền và bóng viết thẳng ra đây, không mượn lớp `border-[#2e1065]` /
        `shadow-[3px_3px_0_#2e1065]` rồi để `src/index.css` bẻ thành viền sáng —
        đọc mã phải thấy đúng thứ hiện trên màn.
      */}
      {baoDaChuyen && (
        <div className="mb-4 shrink-0 rounded-[28px] border border-amber-200/80 bg-amber-50 p-4 shadow-[0_12px_28px_-14px_rgba(109,40,217,0.35)]">
          <p className="text-[16px] font-bold text-[color:var(--color-ink)]">
            {t('Đã chuyển sang màn gọn. Bấm "Xem đầy đủ" để quay lại như cũ.')}
          </p>
          <button
            type="button"
            onClick={onTatBao}
            className="mt-3 w-full rounded-full border border-amber-200 bg-white py-3 font-bold text-[color:var(--color-ink)] shadow-[0_6px_14px_-8px_rgba(120,53,15,0.35)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
          >
            {t('Đã hiểu')}
          </button>
        </div>
      )}

      {/*
        ⚠️ CHIỀU CAO DỰNG BẰNG ĐỆM, KHÔNG BẰNG `min-height`.
        `public/vung-cham-san.css` khai `min-block-size: max(--touch-target,
        3.25rem)` cho mọi nút, và tệp đó nạp SAU CÙNG không dùng `@layer` nên
        thắng mọi utility của Tailwind — kể cả một giá trị LỚN HƠN. Đo 20/8/2026:
        `min-h-[96px]` bị ép xuống 55px. Đệm thì không đụng vào thuộc tính đó:
        `py-4.5` hai đầu + đồng xu `h-14` = 5.75rem, tức ~98px ở gốc 17px.
      */}
      <div className="flex flex-col gap-3.5 flex-1 justify-center [&>*]:shrink-0">
        {/*
          ⚠️ NÚT ĐẦU LÀ NÓI, KHÔNG PHẢI GÕ — thêm 20/9/2026.

          Chế độ này dựng cho người yếu nhất, nhưng trước hôm nay nó lại là chế độ
          DUY NHẤT không có đường nói: nút đầu là "Kiểm tin nhắn", tức gõ chữ
          hoặc gửi ảnh. Bác nào gõ được thì đã không cần màn gọn.

          ⚠️ VẪN BỐN NÚT. Bản đầu thêm nút này thành năm, và hàng rào
          `test/man-hinh-khong-trang.test.js` chặn lại ngay — trần "chỉ còn vài việc"
          là lý do tồn tại của cả chế độ này. Nên "Kiểm tin nhắn" không bị xoá mà
          chuyển vào TRONG màn trợ lý: gõ chữ, gửi ảnh và nói đều là một việc — kể
          cho cháu nghe chuyện gì đang xảy ra — chỉ khác cách kể.
        */}
        <NutGon sac="noi" Icon={Mic} onClick={() => setView('tro_ly')}>
          {t('Nói cho cháu nghe')}
        </NutGon>

        <NutGon sac="nguoiNha" Icon={PhoneCall} onClick={goiNguoiNha}>
          {nguoiDauTien?.name ? t('Gọi người nhà') : t('Thêm người thân')}
        </NutGon>

        <NutGon
          sac="khanCap"
          Icon={ShieldAlert}
          onClick={() => (onTriggerEmergency ? onTriggerEmergency() : setView('warning'))}
        >
          {t('Khẩn cấp')}
        </NutGon>

        {/*
          ⚠️ NÚT THỨ TƯ, THÊM 19/9/2026 — VÀ NÓ LÀ NÚT SỬA MỘT LỖI, KHÔNG PHẢI
          MỘT TÍNH NĂNG MỚI.

          Màn hỏi nhanh (`hoi_nhanh`) mang đúng câu §4.1 bắt buộc — "Người ta đang
          yêu cầu bác làm gì?" — và là màn hợp nhất cho tình huống ĐANG áp điện
          thoại vào tai. Trước đó lối vào duy nhất của nó nằm trong menu của nút
          tròn nổi, mà chính chế độ gọn này lại ẩn nút tròn đi. Nghĩa là chế độ
          dựng cho người yếu nhất là chế độ duy nhất không vào được màn tốt nhất
          cho họ.

          Bốn nút vẫn nằm trong ngưỡng "≤ 4 lựa chọn mỗi điểm quyết định".
        */}
        <NutGon sac="cuocGoi" Icon={PhoneIncoming} onClick={() => setView('hoi_nhanh')}>
          {t('Đang bị ai gọi?')}
        </NutGon>
      </div>

      {/* §4.6 — lối ra, luôn có, không giấu */}
      <button
        type="button"
        onClick={onTat}
        className="w-full mt-5 shrink-0 rounded-full border-2 border-[#e4d7ff] bg-white font-bold text-[#6d28d9] shadow-[0_8px_18px_-10px_rgba(90,30,160,0.45)] transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none"
      >
        {t('Xem đầy đủ')}
      </button>
    </motion.div>
  );
}

function HomeView({
  setView,
  t,
  onAnalyze,
  isAnalyzing,
  pinnedNotification,
  togglePinnedNotification,
  onOpenMenu,
  familyMembers,
  onTriggerEmergency,
  lang = 'vi'
}: {
  setView: (v: ViewState) => void,
  t: any,
  lang?: Lang,
  onAnalyze?: (text: string, image?: string | null) => void,
  isAnalyzing?: boolean,
  pinnedNotification?: boolean,
  togglePinnedNotification?: () => void,
  onOpenMenu?: () => void,
  familyMembers?: NguoiThan[],
  onTriggerEmergency?: () => void,
}) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showQuickCallModal, setShowQuickCallModal] = useState(false);

  /**
   * Phím Esc đóng hai lớp phủ của màn này — xem chú thích cùng nội dung ở
   * `AppMenuModal.tsx`. Không lớp nào trong app từng nghe phím này trước 19/9/2026.
   */
  useEffect(() => {
    if (!showQuickCallModal) return undefined;
    const khiBam = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowQuickCallModal(false); };
    window.addEventListener('keydown', khiBam);
    return () => window.removeEventListener('keydown', khiBam);
  }, [showQuickCallModal]);

  /*
   * ═════ BÀN PHÍM MỞ THÌ THU GỮI PHẦN TRANG TRÍ — 21/8/2026 ═════
   *
   * Màn chính cao đúng `100dvh` và `overflow-hidden`. Bàn phím bật lên chiếm
   * gần nửa màn, phần còn lại vẫn cố nhét đủ tiêu đề + linh vật + ba nút
   * tròn + ô nhập — nên chúng đè lên nhau. Người dùng báo 21/8/2026.
   *
   * ⚠️ KHÔNG CHO CUỘN ĐỂ CHỮA. Cuộn được thì bố cục vẫn vỡ, chỉ là bác phải
   * tự đẩy qua đống đè nhau. Cái đúng là BỚT THỨ ĐI: lúc đang gõ, thứ duy
   * nhất cần thấy là ô nhập và chữ mình vừa gõ. Linh vật và tiêu đề là phần
   * chào hỏi, không phải phần việc.
   *
   * ⚠️ BA NÚT TRÒN Ở LẠI. Chúng là việc, không phải trang trí — bác đang gõ
   * mà muốn chuyển sang gọi con cháu thì phải bấm được ngay.
   *
   * ⚠️ `visualViewport` CHỨ KHÔNG `window.innerHeight`. Trên Android WebView,
   * `innerHeight` KHÔNG đổi khi bàn phím bật (tùy `windowSoftInputMode`), nên
   * đo bằng nó là không bao giờ thấy bàn phím.
   */
  const [banPhimMo, setBanPhimMo] = useState(false);
  useEffect(() => {
    const vv = (window as any).visualViewport;
    if (!vv) return;
    const caoGoc = vv.height;
    const do_ = () => setBanPhimMo(vv.height < caoGoc * 0.75);
    vv.addEventListener('resize', do_);
    return () => vv.removeEventListener('resize', do_);
  }, []);
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
      <div className="pt-2 sm:pt-4 px-4 sm:px-6 lg:px-8 z-50 flex items-center justify-end pointer-events-auto shrink-0 select-none max-w-2xl lg:max-w-none mx-auto w-full">
        <button aria-label={t("Cài đặt")} onClick={() => setView('settings')} className="w-14 h-14 sm:w-16 sm:h-16 p-0 flex items-center justify-center bg-white/80 hover:bg-white rounded-2xl shadow-sm backdrop-blur-md active:scale-95 transition-all text-[#6d28d9]">
          <Settings size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/*
        BẢO VỆ 72 GIỜ — chỉ hiện khi đang có đợt theo dõi sau sự cố. MỘT dải gọn:
        trang chủ không cuộn trên điện thoại, thẻ to sẽ đẩy ô kiểm tra ra khỏi màn.
      */}
      <DaiTheoDoi72Gio lang={lang} setView={setView} />

      <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3 mb-0.5 shrink-0 select-none">
        <img src="/logo.webp" alt="Khoan Đã Logo" draggable={false} className="h-7 w-7 sm:h-9 sm:w-9 object-contain drop-shadow-sm rounded-2xl pointer-events-none select-none" />
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#321379] tracking-tight">{t("Khoan Đã")}</h1>
      </div>

      {/*
        ⚠️ HAI TIÊU ĐỀ, MỖI KHỔ MÀN MỘT CÁI — VÀ CÁI NÀY TỪNG THIẾU `md:hidden`.
        Hệ quả trên máy tính: hiện CẢ HAI, thành ra hỏi hai lần cùng một câu
        ("Hãy kể tình huống của Bác" rồi "Bác đang cần kiểm tra điều gì?").
        Người cao tuổi đọc chậm, và hai câu hỏi chồng nhau làm họ dừng lại tìm
        xem phải trả lời cái nào.
      */}
      <TinDangCho t={t} onAnalyze={onAnalyze} />

      <h2 className={`md:hidden text-center text-[1.85rem] sm:text-3xl leading-[1.18] font-black text-[#2e1065] px-4 shrink-0 select-none ${banPhimMo ? 'hidden' : ''}`} dangerouslySetInnerHTML={{__html: t("Hãy kể tình huống<br />của Bác")}}></h2>

      {/*
        ⚠️ BỐ CỤC ĐIỀU CHỈNH THEO Ý NGƯỜI DÙNG — 20/9/2026.
        Tiêu đề giữ hai dòng như bản cũ nhưng được đặt lên trước bong bóng để
        bác đọc câu hỏi trước rồi mới nhìn vào chỗ kể chuyện.
      */}
      <div className={`relative flex-1 w-full flex items-center justify-center z-10 my-auto min-h-0 select-none pointer-events-none px-4 md:order-1 md:flex-none md:my-2 ${banPhimMo ? 'hidden' : ''}`}>
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          className="relative w-full max-w-[420px] sm:max-w-[480px] md:max-w-[520px] max-h-[44vh] sm:max-h-[48vh] items-center justify-center pointer-events-auto select-none flex"
          onClick={() => setView('voice')}
        >
          <img
            src="/minh-hoa-1.webp"
            alt={t("Khoan Đã")}
            draggable={false}
            className="w-full h-[40vh] sm:h-[44vh] mx-auto max-w-[420px] sm:max-w-[480px] mascot-img object-contain drop-shadow-[0_25px_50px_rgba(109,40,217,0.25)]"
          />
        </motion.div>
      </div>

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
            <button type="button" className="w-full text-left bg-white rounded-[1.5rem] p-6 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] hover:shadow-[5px_5px_0_#2e1065] transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setView('learn')}>
               <div className="inline-block px-3 py-1 bg-red-50 text-red-600 font-bold text-[14px] rounded-full mb-4">{t("Cảnh báo")}</div>
               <h4 className="text-lg font-bold text-[#2e1065] mb-2 leading-tight group-hover:text-[#7e22ce] transition-colors">{t("Chiêu giả danh công an yêu cầu chuyển tiền")}</h4>
               <p className="text-sm text-[#6b7280] line-clamp-3 mb-6">{t("Các đối tượng mạo danh cơ quan chức năng, gây áp lực yêu cầu chuyển tiền để 'xác minh'.")}</p>
               <div className="flex items-center text-sm font-bold text-[#7e22ce] mt-auto">
                  {t("Xem chi tiết")} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
               <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 pointer-events-none">
                 <ShieldAlert className="w-full h-full text-red-500" />
               </div>
            </button>
            
            <button type="button" className="w-full text-left bg-white rounded-[1.5rem] p-6 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] hover:shadow-[5px_5px_0_#2e1065] transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setView('learn')}>
               <div className="inline-block px-3 py-1 bg-orange-50 text-orange-600 font-bold text-[14px] rounded-full mb-4">{t("Thủ đoạn mới")}</div>
               <h4 className="text-lg font-bold text-[#2e1065] mb-2 leading-tight group-hover:text-[#7e22ce] transition-colors">{t("Link nhận quà khuyến mãi đánh cắp tài khoản")}</h4>
               <p className="text-sm text-[#6b7280] line-clamp-3 mb-6">{t("Đường link giả mạo trang uy tín, đánh cắp thông tin đăng nhập và chiếm quyền tài khoản.")}</p>
               <div className="flex items-center text-sm font-bold text-[#7e22ce] mt-auto">
                  {t("Xem chi tiết")} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
               <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 pointer-events-none">
                 <svg className="w-full h-full text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
               </div>
            </button>
            
            <button type="button" className="w-full text-left bg-white rounded-[1.5rem] p-6 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] hover:shadow-[5px_5px_0_#2e1065] transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setView('learn')}>
               <div className="inline-block px-3 py-1 bg-green-50 text-green-600 font-bold text-[14px] rounded-full mb-4">{t("Mới")}</div>
               <h4 className="text-lg font-bold text-[#2e1065] mb-2 leading-tight group-hover:text-[#7e22ce] transition-colors">{t("Mạo danh người thân nhắn vay gấp")}</h4>
               <p className="text-sm text-[#6b7280] line-clamp-3 mb-6">{t("Kẻ gian chiếm tài khoản mạng xã hội, nhắn tin vay tiền người thân, bạn bè.")}</p>
               <div className="flex items-center text-sm font-bold text-[#7e22ce] mt-auto">
                  {t("Xem chi tiết")} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
               <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 pointer-events-none">
                 <User className="w-full h-full text-green-500" />
               </div>
            </button>
         </div>
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
              className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#c084fc]/35 blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            ></motion.div>
            
            {/*
              ⚠️ NÚT NỔI BẬT NHẤT TRANG CHỦ, VÀ NÓ TỪNG KHÔNG CÓ TÊN.
              Đo 19/9/2026: hộp 97×97px, không `aria-label`, không `title`, không
              chữ bên trong — trình đọc màn hình đọc ra đúng một từ "nút". Nhãn
              chữ nằm ở dòng DƯỚI nút, ngoài phần tử, nên không được ghép vào tên.
            */}
            <button
              onClick={() => setView('voice')}
              aria-label={t('Chạm để nói')}
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-b from-[#b886f8] via-[#8c52f4] to-[#6724d5] border-[3.5px] border-white/90 shadow-[0_10px_25px_rgba(90,30,160,0.35),inset_0_4px_10px_rgba(255,255,255,0.8)] flex flex-col items-center justify-center active:scale-95 transition-transform group overflow-hidden pointer-events-auto"
            >
              <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-white/45 to-transparent rounded-t-full pointer-events-none"></div>
              {/*
                ⚠️ ĐÃ BỎ THANH SÓNG ÂM DƯỚI MICRO (20/8/2026).
                Năm vạch nhấp nháy dưới biểu tượng micro trông như đang thu âm,
                trong khi nút này CHƯA thu gì — nó chỉ mở màn ghi âm. Một hiệu
                ứng mô tả trạng thái không có thật thì thà bỏ.
                Bỏ nó cũng lấy lại chỗ cho biểu tượng và chữ thở ra.
              */}
              <div className="text-white mt-1.5 mb-0.5 relative z-10 drop-shadow-md">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="currentColor"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                  <line x1="8" x2="16" y1="22" y2="22"/>
                </svg>
              </div>
              
            </button>

            {/*
              ═════ NHÃN RA NGOÀI VÒNG TRÒN — 20/8/2026 ═════

              Trước đây "Chạm để nói" nằm BÊN TRONG vòng tròn 96px, ngay dưới
              biểu tượng micro. Ảnh chụp của người dùng cho thấy chữ tràn ra khỏi
              mép vòng tròn và đè lên viền.

              §4.5 — tiếng Việt dài hơn tiếng Anh ~30%: "Tap to speak" 12 ký tự
              vừa, "Chạm để nói" 12 ký tự nhưng chữ Việt rộng hơn và còn mang dấu.
              Nhét chữ vào trong một hình TRÒN còn tệ hơn hình chữ nhật: bề ngang
              dùng được hẹp dần về hai đầu.

              ⚠️ HAI NÚT BÊN CẠNH ĐỀU ĐẶT NHÃN DƯỚI VÒNG TRÒN ("Khẩn cấp",
              "Gọi con cái"). Chỉ nút giữa làm khác — và nó là nút có chữ dài nhất.
              Để nhãn ra ngoài thì chữ có cả bề ngang của cột, và cả hàng đồng bộ.
            */}
            <span className="mt-2 text-[#4c1d95] font-black text-[14px] sm:text-base tracking-wide text-center leading-snug">
              {t("Chạm để nói")}
            </span>
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
              <img src={selectedImage} alt="Preview" draggable={false} className="w-11 h-11 sm:w-12 sm:h-12 object-cover rounded-2xl border border-purple-400 shrink-0 select-none" />
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

        {/*
          Text and Image Input Area

          ⚠️ `mb-7` CHỨ KHÔNG PHẢI `mb-2` — Ô NHẬP TỪNG DÍNH SÁT THANH ĐIỀU HƯỚNG.
          Thanh dưới là `absolute bottom-0` nên nó KHÔNG chiếm chỗ trong luồng bố
          cục; ô nhập bên trên không hề biết có nó và nằm đè lên tới sát mép. Với
          ngón tay người cao tuổi, hai vùng chạm dính nhau là bấm nhầm. Khoảng
          cách này cũng đẩy cả hàng "Khẩn cấp · Chạm để nói · Gọi con cái" lên
          theo, cho cả cụm thở ra.
        */}
        <div className="w-full px-4 sm:px-6 mb-7 sm:mb-8 pointer-events-auto">
          <div className="relative flex items-center bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 pl-3 pr-2 shadow-lg border border-white/60 focus-within:ring-3 ring-[#c084fc]/50 transition-all">
             {/*
               ⚠️ 56px, KHÔNG PHẢI 36px — sửa 19/9/2026.
               Đo trên trình duyệt thật: hộp cũ `w-9 h-9` ra 36,4 × 52,5px. Sàn
               §4.4 canh chiều cao nên chiều cao đạt, còn bề ngang thì không ai
               canh (nay `vung-cham-san.css` canh cả hai). Đây là nút nằm cạnh ô
               nhập, cỡ ngón tay người run — bấm trượt là không có gì xảy ra, và
               không-có-gì-xảy-ra đọc ra là "máy hỏng".
             */}
             <button
               type="button"
               onClick={() => fileInputRefMobile.current?.click()}
               className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-colors shrink-0 ${selectedImage ? 'bg-[#7e22ce] text-white shadow-xs' : 'text-[#6d28d9] hover:bg-[#f3e8ff]'}`}
               aria-label={t("Chọn ảnh tình huống")}
               title={t("Chọn ảnh tình huống")}
             >
               <ImageIcon size={24} />
             </button>
             <input 
                 type="text" 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder={t("Bác có thể nói hoặc gõ tin nhắn...")} 
                 className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[#311068] placeholder:text-[#311068]/60 font-semibold text-[14px] sm:text-sm md:text-base"
                 onKeyDown={(e) => { if(e.key === 'Enter') submitAnalysis(); }}
              />
             <button
               onClick={submitAnalysis}
               disabled={isAnalyzing}
               data-vai-tro="nut-chinh"
               aria-label={t("Kiểm tra ngay")}
               className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform shrink-0 disabled:opacity-50"
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
 className="w-full max-w-sm bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] flex flex-col"
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
                  familyMembers.map((member: NguoiThan) => (
                    <a
                      key={member.id}
                      href={`tel:${member.phone}`}
 className="flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-50 to-green-50/50 hover:from-purple-100 hover:to-green-100/70 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] rounded-2xl active:scale-[0.98] transition-all group"
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
                  className="flex-1 py-2.5 px-3 bg-purple-100 hover:bg-purple-200 text-[#5b21b6] font-bold text-[14px] rounded-2xl transition-colors text-center"
                >
                  {t("Quản lý danh bạ")}
                </button>
                <button
                  onClick={() => setShowQuickCallModal(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[14px] rounded-2xl transition-colors"
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
  isAnalyzing,
  onTriggerEmergency,
}: {
  setView: (v: ViewState) => void,
  t: any,
  onAnalyze?: (text: string, image?: string | null) => void,
  isAnalyzing?: boolean,
  /*
   * Hai thu nay chi de dung hang ba nut tron dung nhu trang chu.
   */
  onTriggerEmergency?: () => void,
}) {
  const [isRecording, setIsRecording] = useState(false);
  /**
   * `isRecording` là Ý ĐỊ NH — bác đã bấm. `micHong` là KẾT QUẢ — máy có cho
   * nghe không. Hai thứ này từng được coi là một, và hậu quả là màn hình báo
   * "Đang nghe bác nói" trong khi trình duyệt đã chặn micro từ đầu (§4.3).
   */
  const [micHong, setMicHong] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [duration, setDuration] = useState(0);
  const [micVolume, setMicVolume] = useState<number[]>([10, 16, 24, 30, 36, 30, 24, 16, 10]);
  const [messages, setMessages] = useState<Array<{ id: number; role: 'assistant' | 'user'; text: string; status?: 'error' }>>([
    { id: 1, role: 'assistant', text: 'Cháu nghe đây ạ, Bác cứ kể nhé.' },
  ]);
  const messageIdRef = useRef(2);
  const processedFinalRef = useRef('');
  const noSpeechTimeoutRef = useRef<any>(null);

  const themBaoLoiVaoHoiThoai = (text: string) => {
    setMessages(prev => {
      const message = `Chưa gửi được: ${text}`;
      if (prev.some(item => item.status === 'error')) return prev;
      return [...prev, { id: messageIdRef.current++, role: 'user', text: message, status: 'error' }];
    });
  };

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
    /*
     * ═════ DÒ NGUỒN NGHE XONG RỒI MỚI BẮT ĐẦU — 20/8/2026 ═════
     *
     * Bản cũ gọi `startRecording()` NGAY sau khối async này, tức chạy đồng bộ
     * trong khi `nguonNghe` vẫn còn là `'dang_do'`. Bên trong `startRecording`
     * có `if (nguonNghe === 'tren_may')` — điều kiện đó KHÔNG BAO GIỜ ĐÚNG ở
     * lần vào đầu tiên, nên trên bản APK bộ nghe native không hề khởi động.
     * Bác thấy một màn hình đang "ghi âm" mà không ai nghe cả.
     *
     * Nay chờ dò xong rồi truyền THẬT nguyên giá trị vào, không đọc qua state
     * — state ở đây vẫn là giá trị cũ của lượt render này.
     */
    void (async () => {
      let nguon: 'trinh_duyet' | 'tren_may' | 'khong_co';
      if (await laApk()) {
        const co = await coBoNghe();
        if (!isComponentMounted.current) return;
        // `'chua_ro'` ⇒ chưa hỏi được ROM. Cho đi tiếp: lượt nghe thật sẽ trả
        // về mã lỗi cụ thể, và đó là thông tin đúng hơn một lời đoán ở đây.
        nguon = co === false ? 'khong_co' : 'tren_may';
      } else {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!isComponentMounted.current) return;
        nguon = SR ? 'trinh_duyet' : 'khong_co';
      }
      setNguonNghe(nguon);
      startRecording(nguon);
    })();

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
      // Mất luồng micro là mất cả việc ghi, không chỉ mất sóng âm trang trí.
      setMicHong(true);
      setIsRecording(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        themBaoLoiVaoHoiThoai('Trình duyệt chưa được cấp quyền Micro. Bác hãy bấm "Cho phép" để ghi âm giọng nói trực tiếp.');
      }
    }
  };

  const startRecording = (nguon: typeof nguonNghe = nguonNghe) => {
    setMicHong(false);
    setIsRecording(true);
    setDuration(0);
    setInterimText('');
    processedFinalRef.current = '';
    setMessages(prev => prev.filter(item => item.status !== 'error'));
    if (noSpeechTimeoutRef.current) clearTimeout(noSpeechTimeoutRef.current);

    /*
     * ═════ TRÊN APK: KHÔNG ĐỤNG VÀO MICRO TỪ TẦNG WEB ═════
     *
     * `initAudioVisualizer()` gọi `getUserMedia()` — chỉ để VẼ SÓNG ÂM trang trí.
     * Nhưng trên APK, bộ nghe native cũng cần ĐÚNG cái micro đó.
     *
     * Đo được: hai bên giành micro, cộng thêm hai luồng xin quyền chạy song
     * song (`requestPermissionForAlias` của Capacitor và `onPermissionRequest`
     * của WebView). Người dùng báo 20/8/2026: "ấn vào phần ghi âm xong cấp
     * quyền thì bị out ra ngoài, cứ ấn vào voice là bị out".
     *
     * ⚠️ MỘT HIỆU ỨNG TRANG TRÍ KHÔNG ĐƯỢC LẤY MẤT TÍNH NĂNG CHÍNH. Sóng âm
     * chỉ để nhìn cho biết máy đang nghe; bộ nghe mới là việc thật. Trên APK
     * bỏ sóng, giữ nhịp đập bằng CSS — không ai mất gì.
     */
    if (nguon !== 'tren_may') initAudioVisualizer();

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
    if (nguon === 'tren_may') {
      dangNgheNativeRef.current = true;
      void ngheGiongNoi('vi-VN').then((kq) => {
        if (!isComponentMounted.current) return;
        dangNgheNativeRef.current = false;
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // Nghe được chữ — kể cả khi lượt bị cắt giữa chừng, phần nghe được vẫn dùng.
        if (noSpeechTimeoutRef.current) clearTimeout(noSpeechTimeoutRef.current);
        if (kq.vanBan) {
          setTranscript(kq.vanBan);
          setMessages(prev => [...prev, { id: messageIdRef.current++, role: 'user', text: kq.vanBan }]);
        }

        /*
         * ⚠️ §4.3 — HỎNG THÌ NÓI RA, VÀ NÓI KÈM LỐI ĐI TIẾP.
         * `CHUA_TAI_MODEL` là ca phổ biến nhất ở Việt Nam: máy chưa tải gói
         * tiếng Việt ngoại tuyến. App KHÔNG tự tải được (Android không có API),
         * nên thứ duy nhất làm được là đưa bác tới đúng màn Cài đặt.
         */
        if (kq.ghiAmFailed && !kq.vanBan) {
          themBaoLoiVaoHoiThoai(
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
            if (noSpeechTimeoutRef.current) clearTimeout(noSpeechTimeoutRef.current);
            const completeText = finalAccumulated.trim();
            const alreadyProcessed = processedFinalRef.current;
            const newText = alreadyProcessed && completeText.startsWith(alreadyProcessed)
              ? completeText.slice(alreadyProcessed.length).trim()
              : completeText;
            processedFinalRef.current = completeText;
            setTranscript(prev => {
              return completeText || prev;
            });
            if (newText) {
              setMessages(prev => [...prev, { id: messageIdRef.current++, role: 'user', text: newText }]);
            }
          }
          setInterimText(interimAccumulated);
        };

        recognition.onerror = (event: any) => {
          // Benign errors like 'no-speech' or 'aborted' are ignored gracefully
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
          }
          console.warn('Speech recognition notice:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed'
              || event.error === 'audio-capture') {
            setMicHong(true);
            setIsRecording(false);
          }
          if (event.error === 'not-allowed') {
            // Dùng lại đúng câu đã có trong catalog — cùng một sự việc thì cùng một câu.
            themBaoLoiVaoHoiThoai(t('Máy chưa cho Khoan Đã dùng micro. Bác gõ chữ hoặc gửi ảnh giúp cháu nhé.'));
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
    } else {
      setMicHong(true);
      setIsRecording(false);
      themBaoLoiVaoHoiThoai(t('Máy chưa chuyển được lời nói thành chữ. Bác gõ chữ hoặc gửi ảnh giúp cháu nhé.'));
      return;
    }

    noSpeechTimeoutRef.current = setTimeout(() => {
      if (!isComponentMounted.current || processedFinalRef.current) return;
      setMicHong(true);
      setIsRecording(false);
      themBaoLoiVaoHoiThoai(t('Chưa nhận được lời nói của Bác. Bác thử bật micro hoặc gõ chữ giúp cháu nhé.'));
      stopRecording();
    }, 8000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
      noSpeechTimeoutRef.current = null;
    }
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
    // Tiếng + rung phát TRƯỚC khi máy làm việc, để lời báo không phải đợi micro sẵn sàng.
    bipGhiAm(!isRecording);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /*
   * ⚠️ KHÔNG NGHE ĐƯỢC GÌ THÌ DỪNG LẠI, ĐỪNG BỊA MỘT CÂU.
   *
   * Bản cũ: nếu `transcript` rỗng thì rơi về MỘT KỊCH BẢN GIẢ DANH CÔNG AN
   * VIẾT SẲN, rồi gửi nó đi phân tích như thể bác vừa nói ra.
   *
   * Nghĩa là: bác bấm micro, máy không nghe được (thiếu gói tiếng Việt,
   * micro bị chặn, phòng ồn), và màn hình hiện "NGUY HIỂM CAO" về một vụ
   * lừa đảo CHƯA TỪNG XẢY RA VỚI BÁC.
   *
   * Đó là dạng lỗi tệ nhất mà sản phẩm này có thể mắc: không phải bỏ sót
   * một vụ lừa, mà là TỰ DỰNG RA một vụ rồi bảo là của họ. §4.3 và §11
   * đều cấm — "chưa nghe được" phải hiện ra là chưa nghe được.
   */
  const handleAnalyzeVoice = (textOverride?: string) => {
    stopRecording();
    const fullText = (textOverride || transcript || interimText).trim();
    if (!fullText) {
      themBaoLoiVaoHoiThoai(t('Cháu chưa nghe được câu nào. Bác thử nói lại, hoặc gõ chữ giúp cháu nhé.'));
      return;
    }
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

  /*
   * ⚠️ TIÊU ĐỀ NGẮN, VÀ CẢ NỘI DUNG CŨNG PHẢI TRA CATALOG.
   *
   * Tiêu đề cũ dài tới 52 ký tự nên bị `truncate` cắt cụt: "Công an dọa phong …",
   * "Ngân hàng dọa khó…" — thấy trong ảnh người dùng gửi 20/8/2026. Bác không
   * đọc được mình sắp thử tình huống nào.
   *
   * Phần `text` cũng phải dịch, dù nó KHÔNG hiện trên tấm thẻ: bấm vào là nó
   * chạy thẳng vào ô nội dung và ra màn kết quả. Để nguyên tiếng Việt thì người
   * chọn English bấm "Police impersonation" rồi nhận về một màn chữ Việt.
   */

  const currentDisplayText = transcript + (interimText ? (transcript ? ' ' : '') + interimText : '');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col h-full w-full relative z-10 px-4 sm:px-6 pt-3 pb-5 overflow-y-auto bg-[radial-gradient(circle_at_50%_28%,rgba(196,181,253,0.45),transparent_38%),linear-gradient(180deg,#fbf9ff_0%,#f1eaff_100%)]"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between pt-1 sm:pt-2 mb-2">
        <button aria-label={t("Quay lại")} onClick={() => { stopRecording(); setView('home'); }} className="w-12 h-12 rounded-full border border-white/80 bg-white/45 backdrop-blur-md flex items-center justify-center text-[#321379] shadow-[0_8px_22px_rgba(109,40,217,0.12)] active:scale-95 transition-transform shrink-0">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center text-[#321379] font-black text-[20px]">Bác kể đi</div>
        <button
          type="button"
          aria-label={t("Kích hoạt cảnh giác khẩn cấp")}
          onClick={() => { stopRecording(); onTriggerEmergency?.(); }}
          className="w-12 h-12 rounded-full border border-white/80 bg-white/45 backdrop-blur-md flex items-center justify-center text-[#7c3aed] shadow-[0_8px_22px_rgba(109,40,217,0.12)] active:scale-95 transition-transform shrink-0"
        >
          <ShieldAlert size={22} />
        </button>
      </div>

      {/*
        ═════ TIÊU ĐỀ CHÍNH LÀ TRẠNG THÁI — dựng lại 20/9/2026 theo ảnh thiết kế ═════

        Bản trước nói trạng thái ghi âm ở BA CHỖ khác nhau: một vệt đỏ, một chấm
        nhấp nháy, một dòng chữ nhỏ — cộng một tiêu đề "Ghi âm cuộc gọi" đứng im
        không nghe theo trạng thái nào. Bốn chỗ cho một sự thật là bốn chỗ có thể
        lệch nhau, và đã lệch thật: micro bị chặn mà vẫn hiện "ĐANG GHI ÂM".

        Nay chỉ còn MỘT chỗ, và nó là chỗ to nhất màn. Đọc được từ xa, đọc được
        bằng TalkBack (`aria-live`), và không có phiên bản nào khác để mâu thuẫn với.

        ⚠️ BA TRẠNG THÁI, KHÔNG PHẢI HAI. "Chưa bấm" và "bấm rồi mà máy không cho
        nghe" là hai chuyện khác hẳn nhau (§4.3). Gộp chúng là để bác ngồi nói vào
        một cái máy đã tắt.
      */}
      <div className="flex flex-col items-center w-full my-1">
        <QuaCauNoi
          dangNghe={isRecording && !micHong}
          micHong={micHong}
          coDuoi={false}
          className="w-[58vw] max-w-[250px] h-[23vh] sm:h-[27vh] my-0"
        />
        <p aria-live="polite" className={`text-center font-black text-[22px] leading-tight px-3 mt-1 mb-3 ${micHong ? 'text-[#6b3a05]' : 'text-[#4c1d95]'}`}>
          {/* Tương thích hợp đồng cũ: "Cháu đang nghe Bác" đã được rút gọn trên UI mới. */}
          {micHong ? t('Cháu chưa nghe được') : isRecording ? `${t('Tôi đang lắng nghe...')} · ${formatTime(duration)}` : t('Chạm để nói')}
        </p>

        <div className="w-full max-w-md flex flex-col gap-3 mb-3 px-1" aria-live="polite">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-[24px] px-5 py-3.5 text-[18px] sm:text-[19px] font-bold leading-snug shadow-sm border ${message.status === 'error'
                ? 'bg-[#fff7ed] border-[#fdba74] text-[#9a3412] rounded-br-md'
                : message.role === 'user'
                ? 'bg-[#ede9fe] border-[#c4b5fd] text-[#321379] rounded-br-md'
                : 'bg-white/85 border-white text-[#321379] rounded-bl-md'}`}>
                {message.text}
              </div>
            </div>
          ))}
          {interimText && (
            <div className="flex justify-end">
              <div className="max-w-[88%] rounded-[24px] rounded-br-md px-5 py-3.5 text-[18px] font-bold leading-snug bg-white/60 border border-dashed border-[#a78bfa] text-[#6d28d9] italic">
                {interimText}
              </div>
            </div>
          )}
        </div>

        {/*
          ═════ BA NÚT TRÒN — GIỐNG HỆT TRANG CHỦ, VÀ ĐÓ LÀ ĐIỂM ═════

          Cùng vị trí, cùng màu, cùng thứ tự — nên bác không phải học lại màn này. Chỉ
          nút giữa đổi hình: micro → ô vuông dừng. Đổi hình chứ không đổi chỗ là cách
          nói "vẫn cái nút ấy, bấm lại là dừng".

          ⚠️ HAI NÚT HAI BÊN KHÔNG PHẢI ĐỂ CHO ĐỦ BỐ CỤC. Bác đang áp điện thoại
          vào tai, nghe thấy điều đáng sợ — lúc đó bắt quay về trang chủ rồi tìm nút
          là thêm một lớp giữa bác và việc cần làm.
        */}
        <div className="flex items-center justify-center w-full mb-3">
          <button
            type="button"
            data-vai-tro="nut-chinh"
            onClick={handleToggle}
            aria-label={isRecording ? t("Dừng nghe") : t("Chạm để nói")}
            className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <span className={`w-[82px] h-[82px] sm:w-[92px] sm:h-[92px] rounded-full border border-white/90 shadow-[0_14px_34px_rgba(124,58,237,0.28)] flex items-center justify-center ${
              isRecording ? 'bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9]' : 'bg-gradient-to-b from-[#a78bfa] to-[#7c3aed]'
            }`}>
              {isRecording
                ? <span className="w-8 h-8 rounded-lg bg-white" />
                : <Mic size={38} className="text-white" />}
            </span>
            <span className="text-[#321379] font-black text-[15px] sm:text-[16px] leading-snug">
              {isRecording ? t("Dừng nghe") : t("Chạm để nói")}
            </span>
          </button>
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
              {t("Phần nghe chạy ngay trên máy. Tiếng nói không gửi đi đâu.")}
            </p>
          </div>
        )}

        {/* Live Audio Waveform based on real microphone volume with smooth curves */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 h-10 px-5 py-1.5 bg-purple-50/90 backdrop-blur-sm rounded-full border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]/80 shadow-inner my-1">
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

      {/*
        ⚠️ KHÔNG NÓI HAI LẦN CÙNG MỘT CÂU. Từ 20/9/2026 dòng phụ dưới tiêu đề đã
        mang đúng câu "máy chưa cho dùng micro", nên khối vàng này lặp y nguyên
        nó ngay bên dưới. Đo được trên màn thật: hai lần cùng một chữ, cách nhau
        160px. Người đọc chậm dừng lại tìm xem hai câu khác nhau chỗ nào — mà
        chúng không khác nhau chỗ nào cả.
        Các lỗi KHÁC (chưa tải bộ nghe, lượt nghe hỏng) vẫn hiện bình thường.
      */}
      <div className="w-full max-w-md mb-3 flex items-center justify-between gap-3 px-1">
        <input
          aria-label="Gõ lời bác nói"
          value={currentDisplayText}
          onChange={(e) => { setTranscript(e.target.value); setInterimText(''); }}
          placeholder="Gõ chữ..."
          className="min-w-0 w-full rounded-full bg-white/70 border border-white px-4 py-2.5 text-[15px] text-[#311068] outline-none focus:border-[#c084fc]"
        />
      </div>

      {/*
        ═════ ĐÃ BỎKHỐI "TÌNH HUỐNG MẪU ĐỂ THỬ NHANH" — 21/8/2026 ═════

        Màn này là nơi bác KỂ chuyện của mình. Một danh sách kịch bản soạn sẵn
        đặt ngay dưới ô ghi âm trộn hai thứ không được phép trộn: chuyện THẬT
        của bác, và chuyện BỊA để xem cho biết.

        ⚠️ BẤM NHẦM MỘT CÁI LÀ RA MỘT KẾT QUẢ "NGUY HIỂM CAO" VỀ MỘT VIỆC
        CHƯA TỪNG XẢY RA. Với người đang hoảng thì đó không phải một phiền
        phức nhỏ — đó là app tự dựng ra một vụ lừa đảo rồi bảo là của họ.

        Muốn xem kịch bản mẫu thì sang mục Bài học — ở đó chúng được dạy như
        bài học, không bị trình bày như kết quả kiểm tra của chính bác.
      */}

      {/* Action Buttons — hai lựa chọn rõ như màn trò chuyện tham chiếu. */}
      <div className="w-full flex flex-col gap-2.5 mt-auto pb-1">
        <div className="flex gap-3">
          <button
            onClick={handleToggle}
            className="flex-1 min-h-[62px] rounded-full bg-white/75 border border-white shadow-[0_10px_26px_rgba(109,40,217,0.12)] text-[#321379] font-black text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <MessageSquare size={21} className="text-[#7c3aed]" />
            <span>{isRecording ? t("Tạm dừng mic") : t("Kể tiếp")}</span>
          </button>
          <button
            onClick={() => handleAnalyzeVoice()}
            disabled={isAnalyzing}
            className="flex-1 min-h-[62px] rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-black text-[16px] flex items-center justify-center gap-2 shadow-[0_12px_28px_rgba(124,58,237,0.24)] active:scale-[0.98] disabled:opacity-60 transition-transform"
          >
            <ShieldCheck size={21} />
            <span>{isAnalyzing ? t("Đang phân tích dữ liệu...") : t("Kiểm tra ngay")}</span>
          </button>
        </div>
        <button
          onClick={() => {
            setTranscript('');
            setInterimText('');
            setMessages([{ id: 1, role: 'assistant', text: 'Cháu nghe đây ạ, Bác cứ kể nhé.' }]);
            messageIdRef.current = 2;
            startRecording();
          }}
          className="self-center text-[14px] font-bold text-[#8065ad] px-3 py-1.5 rounded-full hover:bg-white/60 active:scale-95 transition-all"
        >
          <span className="inline-flex items-center gap-1.5"><RotateCcw size={13} />{t("Nói lại từ đầu")}</span>
        </button>
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
  historyItems,
  setHistoryItems,
  setAnalyzeResult
}: {
  setView: (v: ViewState) => void,
  t: any,
  lang?: Lang,
  isLoggedIn: boolean,
  historyItems: HistoryRecord[],
  setHistoryItems: React.Dispatch<React.SetStateAction<HistoryRecord[]>>,
  setAnalyzeResult: (data: KetQuaPhanTich) => void
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'saved'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredItems = (historyItems || []).filter(item => {
    if (activeTab === 'high' && item.risk !== 'CAO') return false;
    if (activeTab === 'saved' && !item.saved) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      /*
       * ⚠️ TÌM TRÊN CÂU ĐÃ TRA, KHÔNG TÌM TRÊN MÃ (§HĐ luật 2).
       *
       * Bản trước viết `item.data?.lyDo` — KHÔNG CÓ TRƯỜNG NÀO TÊN VẬY. Hợp
       * đồng chỉ có `maLyDo`, và nó là MẢNG MÃ chứ không phải chuỗi, nên
       * `.toLowerCase()` cũng sai nốt. Hệ quả: `undefined && ...` luôn rơi về
       * false, tức nửa "tìm theo lý do" của ô này CHƯA BAO GIỜ CHẠY — không
       * báo lỗi, chỉ lặng lẽ không tìm ra. `data: any` giấu cả hai cái sai.
       *
       * Tra qua catalog rồi mới tìm, vì bác gõ chữ mình ĐANG THẤY trên màn
       * ("giả danh công an"), không gõ `CO_GIA_DANH_CO_QUAN`.
       */
      const cauLyDo = traNhieu(MA_LY_DO, item.data?.maLyDo ?? [], lang).join(' · ').toLowerCase();
      return item.title.toLowerCase().includes(q) || cauLyDo.includes(q);
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
         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-1.5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
            <ShieldAlert size={22} className="text-[#6d28d9]" />
         </div>
         <h2 className="text-[22px] font-black text-[#1e1b4b] text-center leading-tight">{t("Lịch sử cảnh báo")}</h2>
      </div>

      <div className="hidden md:flex flex-col items-center text-center mb-8 max-w-2xl mx-auto">
         <h2 className="text-4xl font-black text-[#2e1065] tracking-tight mb-2">{t("Lịch sử cảnh báo & vụ việc")}</h2>
         <p className="text-lg text-[#6b7280]">{t("Theo dõi các cuộc gọi, tin nhắn hoặc liên kết đáng ngờ đã được phân tích.")}</p>
      </div>

      {/* Tabs */}
      {/*
        ⚠️ CÙNG HÌNH DẠNG VỚI THANH ĐIỀU HƯỚNG DƯỚI CÙNG.
        Cùng `rounded-full`, cùng dải màu tím, cùng cách đánh dấu mục đang chọn.
        Hai dải điều khiển nằm trên một màn hình mà mỗi cái một kiểu thì bác phải
        học hai lần cùng một thao tác.

        Con số trong ngoặc chỉ hiện KHI KHÁC 0. "Tất cả (0) · Nguy hiểm cao (0) ·
        Đã lưu (0)" là ba con số không nói gì, chiếm đúng chỗ của nhãn.
      */}
      {/*
        ⚠️ `flex-auto` CHỨ KHÔNG PHẢI `flex-1` — BA NHÃN NÀY DÀI KHÁC NHAU.
        `flex-1` chia đều ba phần bằng nhau, mà "Nguy hiểm cao" dài gần gấp đôi
        "Tất cả" và "Đã lưu" nên nó vỡ thành hai dòng ngay ở khổ 375px (§4.5:
        tiếng Việt dài hơn tiếng Anh ~30%). `flex-auto` chia theo bề rộng chữ
        thật, nên nhãn dài được nhiều chỗ hơn nhãn ngắn.
      */}
      <div className="flex items-stretch bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] md:w-[420px] md:mx-auto rounded-full p-[6px] mb-3 border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065]">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-auto min-h-[44px] px-2 rounded-full font-bold text-[14px] leading-snug transition-all ${activeTab === 'all' ? 'bg-white text-[#6d28d9]' : 'text-white hover:bg-white/20'}`}
        >
          {t("Tất cả")}{historyItems.length > 0 ? ` (${historyItems.length})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('high')}
          className={`flex-auto min-h-[44px] px-2 rounded-full font-bold text-[14px] leading-snug transition-all ${activeTab === 'high' ? 'bg-red-600 text-white' : 'text-white hover:bg-white/20'}`}
        >
          {/* Tab lọc cũng dùng đúng nhãn của catalog — cùng một mức, cùng một chữ. */}
          {tra(NHAN, 'CAO', lang)}{historyItems.filter(i => i.risk === 'CAO').length > 0 ? ` (${historyItems.filter(i => i.risk === 'CAO').length})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-auto min-h-[44px] px-2 rounded-full font-bold text-[14px] leading-snug transition-all ${activeTab === 'saved' ? 'bg-white text-[#6d28d9]' : 'text-white hover:bg-white/20'}`}
        >
          {t("Đã lưu")}{historyItems.filter(i => i.saved).length > 0 ? ` (${historyItems.filter(i => i.saved).length})` : ''}
        </button>
      </div>

      {/* Search inside history */}
      <div className="w-full max-w-4xl mx-auto mb-3">
        <div className="bg-white rounded-2xl px-3 py-2 flex items-center gap-2 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] ">
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
          <div className="col-span-2 flex flex-col items-center justify-center py-10 bg-white/70 rounded-3xl border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] text-center p-6">
            <ShieldCheck size={38} className="text-[#c084fc] mb-2 opacity-60" />
            <h4 className="font-bold text-[#1e1b4b] text-[15px] mb-1">{t("Chưa có bản ghi nào")}</h4>
            <p className="text-[14px] text-gray-500 max-w-xs mb-3">{t("Bác bấm micro hoặc quét ảnh ở trang chủ để kiểm tra an toàn.")}</p>
            <button 
              onClick={() => setView('home')} 
              className="min-h-[52px] px-6 py-2.5 bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-white font-bold rounded-full text-[14px] shadow-sm active:scale-95 transition-transform"
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
 className="bg-white rounded-2xl p-3 flex gap-3 items-center border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]/70 hover: hover:border-purple-200 transition-all cursor-pointer group"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isHigh ? 'bg-red-50 text-red-600 border border-red-200' : isSuspicious ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
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
  familyMembers: NguoiThan[],
  setFamilyMembers: React.Dispatch<React.SetStateAction<NguoiThan[]>>
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

  const handleSms = (member: NguoiThan) => {
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
         <div className="w-11 h-11 bg-gradient-to-tr from-[#8b5cf6] to-[#c084fc] rounded-2xl flex items-center justify-center mb-2 border-[2.5px] border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
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
            {/*
              ⚠️ KHÔNG CÒN Ô CHỮ CÁI ĐẦU TÊN (avatar "A", "C").
              Bỏ 4/9/2026 theo yêu cầu người dùng. Nó chiếm 48px chiều ngang ở
              đúng khổ hẹp nhất mà không nói thêm điều gì: tên người thân đã nằm
              ngay cạnh, và một chữ "A" tô màu không giúp bác nhận ra con mình
              nhanh hơn dòng "Anh Nam (Con trai)". Bỏ đi thì tên và số điện thoại
              được cả chiều ngang, đỡ phải xuống dòng.

              ⚠️ `member.avatar` VẪN CÒN trong dữ liệu và trong màn "Thêm người
              thân" — đừng xoá nó ở đó, chỉ là màn này không vẽ ra nữa.

              Kiểu thẻ: viền dày + bóng đổ cứng, theo ảnh mẫu người dùng gửi.
              Dùng tím đậm `#2e1065` (đã có trong bảng màu app) thay vì đen
              tuyền — giữ được dấu ấn Khoan Đã. Viền dày cũng là thứ người mắt
              kém cần: ranh giới thẻ không còn phụ thuộc vào bóng mờ.
            */}
            {familyMembers.map((member) => {
              /*
                ⚠️ VÙNG CHẠM 52px NHƯNG HÌNH VẼ NHỎ — CỐ Ý.
                §4.4 đòi 52px cho mọi nút; bản trước `p-1.5` quanh icon 15px chỉ
                ra ~27px. Nhưng nút này XOÁ người thân, nên nó không được tranh
                chú ý với "Gọi"/"Báo tin": không viền, không bóng, chỉ một icon
                xám. `text-gray-300` cũ đạt 1,5:1 — dưới cả sàn 3:1 của WCAG
                1.4.11 cho hình phi văn bản; `slate-500` đạt 4,7:1.

                ⚠️ Ở KHỔ HẸP NÓ NẰM Ở GÓC TÊN, KHÔNG NẰM CÙNG HÀNG VỚI HAI NÚT
                CHÍNH. Đo ở 375px: để chung hàng thì 52px của nó cộng với hai nút
                `flex-1` làm chữ "Báo tin" vỡ thành hai dòng — đúng cái bẫy §4.5
                cảnh báo (tiếng Việt dài hơn ~30%, đừng dựng nút vừa khít chữ).
                Tách ra cũng bớt nguy cơ bấm nhầm nút xoá khi đang vội gọi.
              */
              const nutXoa = (themLop: string) => (
                <button aria-label={t("Xoá")}
                  onClick={() => handleDeleteMember(member.id)}
                  className={`w-[52px] h-[52px] shrink-0 items-center justify-center text-slate-500 hover:text-red-600 rounded-full transition-colors ${themLop}`}
                  title={t("Xóa")}
                >
                  <Trash2 size={18} />
                </button>
              );
              return (
                <div key={member.id} className="bg-white rounded-[20px] p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065]">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#1e1b4b] text-[17px] leading-snug">{member.name}</h3>
                      <p className="text-purple-700 font-semibold text-[14px] mt-0.5">{t(member.relation) || member.relation} • {member.phone || '0988 *** 888'}</p>
                    </div>
                    {nutXoa('flex sm:hidden -mt-1 -mr-1')}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                     <button
                       onClick={() => handleCall(member.phone)}
                       className="flex-1 sm:flex-none min-h-[52px] px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-bold text-[15px] flex items-center justify-center gap-1.5 border-[2.5px] border-[#064e3b] shadow-[2px_2px_0_#064e3b] active:scale-95 transition-transform"
                       title={t("Gọi ngay")}
                     >
                        <Phone size={16} className="shrink-0" />
                        <span>{t("Gọi")}</span>
                     </button>
                     <button
                       onClick={() => handleSms(member)}
                       className="flex-1 sm:flex-none min-h-[52px] px-4 py-2.5 bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-white rounded-full font-bold text-[15px] flex items-center justify-center gap-1.5 border-[2.5px] border-[#2e1065] shadow-[2px_2px_0_#2e1065] active:scale-95 transition-transform"
                       title={t("Gửi tin nhắn nhờ hỗ trợ")}
                     >
                        <MessageSquare size={16} className="shrink-0" />
                        <span>{t("Báo tin")}</span>
                     </button>
                     {nutXoa('hidden sm:flex')}
                  </div>
                </div>
              );
            })}

            <button onClick={() => setView('add_family')} className="w-full mt-1 min-h-[56px] py-3 bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-white rounded-full font-bold text-[15px] border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065] flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
               <Plus size={18} strokeWidth={2.5} /> {t("Thêm người thân")}
            </button>

            {/*
              ĐỘI PHẢN ỨNG NHANH — ngay dưới danh sách người thân, vì đội được lập
              TỪ chính danh sách này. Thẻ nói thật nút gọi đang trỏ vào ai.
            */}
            <TheDoiPhanUng setView={setView} lang={lang} />
          </div>
        </div>

        {/* Right Column - Quick Support Cards */}
        <div className="flex flex-col gap-3 md:w-[380px]">
           {/*
             SỐ TỔNG ĐÀI NGÂN HÀNG — để sẵn trong app, bác tự bấm (người dùng chốt
             17/9/2026). Đặt ĐẦU cột: sau một vụ lừa, đây là số bác cần nhất.
           */}
           <button
             type="button"
             onClick={() => setView('so_ngan_hang')}
             className="w-full min-h-[56px] bg-white rounded-[20px] p-3.5 border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065] flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
           >
             <span className="w-11 h-11 rounded-2xl bg-sky-100 border-2 border-[#2e1065] flex items-center justify-center text-sky-900 shrink-0">
               <Landmark size={22} aria-hidden="true" />
             </span>
             <span className="flex-1 min-w-0">
               <span className="block font-black text-[16px] text-[#1e1b4b] leading-snug">{tra(SO_NGAN_HANG, 'TIEU_DE', lang)}</span>
               <span className="block text-[14px] text-slate-600 leading-snug mt-0.5">{tra(SO_NGAN_HANG, 'MO_TA_THE', lang)}</span>
             </span>
             <ChevronRight size={20} className="text-sky-800 shrink-0" aria-hidden="true" />
           </button>
           <div className="bg-white rounded-[20px] p-4 border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065]">
              <div className="flex items-center justify-between mb-2.5 gap-2">
                <h3 className="text-[15px] font-black text-[#2e1065] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-red-600 shrink-0" />
                  {t("Số khẩn cấp")}
                </h3>
                <span className="text-[14px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border-2 border-[#2e1065] shrink-0">
                  {lang === 'en' ? 'Global' : 'Việt Nam'}
                </span>
              </div>
              
              {/*
                ⚠️ MỘT CỘT, KHÔNG `truncate`, VÀ CHỈ BA SỐ.

                Bản trước xếp 4 số thành lưới 2 cột rồi cắt cụt chữ bằng
                `truncate`. Ảnh người dùng gửi 20/8/2026: "Emergen…",
                "US FTC Fr…", "UK Actio…", "Australia …" — bác phải ĐOÁN mình
                sắp gọi cho ai. Với một nút gọi khẩn cấp thì đoán là hỏng.

                `truncate` không phải cách bớt chữ, nó là cách GIẤU chữ. Muốn
                bớt thì bớt SỐ MỤC, không bớt chữ của từng mục.

                Ba số một cột, mỗi hàng đủ rộng để tên hiện nguyên vẹn và tự
                xuống dòng khi cần — tiếng Việt dài hơn tiếng Anh ~30% (§4.5)
                nên phải chừa chỗ xuống dòng, không được nowrap.
              */}
              <div className="flex flex-col gap-2">
                 {topEmergencies.slice(0, 3).map((item) => (
                   <button
                     key={item.id}
                     onClick={() => handleCall(item.phone.replace(/[^0-9+]/g, ''))}
                     className="flex items-center gap-3 p-3 min-h-[52px] rounded-2xl bg-purple-50 hover:bg-purple-100 text-left transition-all border-2 border-[#2e1065] shadow-[2px_2px_0_#2e1065] active:scale-95 group"
                   >
                      <div className="w-11 h-11 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-[14px] shrink-0 border-2 border-[#2e1065] group-hover:bg-red-600 transition-colors">
                         {item.phone.length > 5 ? 'SOS' : item.phone}
                      </div>
                      <h4 className="flex-1 font-bold text-[#1e1b4b] text-[15px] leading-snug">{item.name}</h4>
                      <PhoneCall size={18} className="text-purple-700 shrink-0" />
                   </button>
                 ))}
              </div>

              {/* Link to Full Learn & Hotline View */}
              <button
                onClick={() => setView('learn')}
                className="w-full mt-3 py-2.5 px-3.5 min-h-[52px] bg-amber-100 border-[2.5px] border-[#2e1065] shadow-[2px_2px_0_#2e1065] text-[#2e1065] rounded-full font-bold text-[15px] flex items-center justify-between active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-600 shrink-0" />
                  <span>{t('Xem tất cả')}</span>
                </div>
                <ChevronRight size={16} className="text-purple-600" />
              </button>
           </div>

           <div className="bg-purple-50 rounded-[20px] p-3.5 border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065] flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-[#7e22ce] shrink-0" />
              <p className="text-[14px] text-purple-900 font-semibold leading-snug">
                {t("Danh bạ lưu an toàn trên máy của bác, bảo mật tuyệt đối.")}
              </p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}


// --- Account View ---
function AccountView({ setView, t, hoSo, onDangXuat, onLuuTen }: {
  setView: (v: ViewState) => void,
  t: any,
  hoSo: HoSoTaiKhoan | null,
  onDangXuat: () => Promise<void>,
  onLuuTen: (ten: string) => Promise<void>,
}) {
  /*
   * ⚠️ MÀN NÀY TỪNG KHÔNG LƯU GÌ CẢ.
   * Hai ô "Họ và tên" và "Số điện thoại" là `useState` thuần, không một lượt
   * gọi lưu trữ nào. Bác gõ tên mình, bấm ra, quay lại — trống trơn. Không lỗi,
   * không thông báo; bác chỉ nghĩ là mình chưa bấm đúng nút nào đó.
   *
   * Nay: tên lưu thật qua `PATCH /api/tai-khoan/toi`. Số điện thoại thì KHÔNG
   * sửa được — nó là khoá đăng nhập, đổi số là chuyện khác hẳn với sửa hồ sơ.
   */
  const [ten, setTen] = useState(hoSo?.ten ?? '');
  const [dangLuu, setDangLuu] = useState(false);
  const [xong, setXong] = useState(false);

  const luuTen = async () => {
    if (!ten.trim() || !hoSo) return;
    setDangLuu(true);
    setXong(false);
    try {
      await onLuuTen(ten.trim());
      setXong(true);
    } catch {
      // Không lưu được — ô vẫn giữ chữ bác vừa gõ để bấm lại, không xoá mất.
    } finally {
      setDangLuu(false);
    }
  };
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
         <div className="bg-white rounded-[20px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
            <h3 className="font-bold text-[#1e1b4b] mb-4 text-[16px]">{t("Thông tin cá nhân")}</h3>
            {/*
              ⚠️ HAI DÒNG NÀY TỪNG LÀ CHỮ CỨNG: "Bác An" và "0987 *** 321".
              Bác mở màn Tài khoản của mình và đọc được tên người khác cùng một
              số điện thoại không phải của mình — rồi tin rằng app đang giữ
              thông tin đó. Nay đọc từ hồ sơ thật của máy chủ.
            */}
            {!hoSo ? (
              <div className="flex flex-col gap-2">
                <p className="text-[15px] text-slate-600 leading-relaxed">
                  {t("Bác chưa đăng nhập nên chưa có thông tin nào ở đây.")}
                </p>
                <button
                  onClick={() => setView('login')}
                  className="w-full min-h-[52px] px-4 bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-white rounded-full font-extrabold text-[16px] border-[2.5px] border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:scale-95 transition-transform"
                >
                  {t("Đăng nhập")}
                </button>
              </div>
            ) : (
            <div className="flex flex-col gap-3">
               <div>
                  <label htmlFor="o-ten-tk" className="text-[14px] text-[#6b7280] font-medium block mb-1">{t("Họ và tên")}</label>
                  <div className="flex gap-2">
                    <input
                      id="o-ten-tk"
                      value={ten}
                      onChange={(e) => { setTen(e.target.value); setXong(false); }}
                      maxLength={60}
                      className="flex-1 min-h-[52px] px-3 rounded-2xl border-2 border-purple-200 bg-white text-[15px] font-bold text-[#1e1b4b] focus:outline-none focus:border-[#7c3aed]"
                    />
                    <button
                      onClick={() => void luuTen()}
                      disabled={dangLuu || !ten.trim() || ten.trim() === hoSo.ten}
                      className="min-h-[52px] px-4 bg-[#7c3aed] text-white rounded-2xl font-bold text-[15px] disabled:opacity-40 active:scale-95 transition-transform"
                    >
                      {dangLuu ? '…' : t("Lưu")}
                    </button>
                  </div>
                  {xong && (
                    <p className="text-[14px] text-emerald-700 font-bold mt-1">{t("Đã lưu")}</p>
                  )}
               </div>
               <div>
                  <label className="text-[14px] text-[#6b7280] font-medium">{t("Số điện thoại")}</label>
                  <p className="font-bold text-[#1e1b4b] text-[15px]">{hoSo.so}</p>
                  {/*
                    Số điện thoại là khoá đăng nhập nên không sửa ở đây. Nói ra
                    thay vì để một ô xám không bấm được — bác sẽ tưởng app hỏng.
                  */}
                  <p className="text-[14px] text-slate-500 leading-snug mt-0.5">
                    {t("Số này dùng để đăng nhập nên không đổi ở đây được.")}
                  </p>
               </div>
            </div>
            )}
         </div>
         
         <button onClick={() => { void onDangXuat().then(() => setView('home')); }} className="w-full min-h-[56px] px-4 bg-white text-[#ef4444] rounded-[20px] font-bold text-[16px] border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:bg-[#fef2f2] transition-colors mt-4">
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
         <div className="bg-white rounded-[20px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
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
/*
 * ══════ BONG BÓNG NỔI — NÚT TRÒN LUÔN NẰM TRÊN MÀN HÌNH ══════
 *
 * Giống AssistiveTouch của iPhone: một nút mờ ở mép màn hình, kéo được, chạm
 * vào là mở Khoan Đã. CÓ MẶT KỂ CẢ KHI BÁC ĐANG Ở APP KHÁC.
 *
 * ⚠️ ĐỪNG GỌI CHUNG LÀ "POPUP" VỚI DẢI CẢNH BÁO. Hai thứ khác hẳn nhau và
 * đã bị lẫn suốt nhiều vòng sửa — người dùng hỏi "làm sao để bật pop up" và
 * nhận được hướng dẫn về một tính năng khác:
 *   · dải cảnh báo — MÀU ĐỎonly khi bộ luật ra mức CAO, tự tắt sau vài giây
 *   · bong bóng     — nút mờ, LUÔN có, không mang cảnh báo gì cả
 * Hai thẻ riêng, hai tên riêng, đặt cạnh nhau để không ai nhầm nữa.
 *
 * ⚠️ ĐỌC TRẠNG THÁI TỪ SERVICE, KHÔNG NHỚ BẰNG localStorage. Công tắc nhớ
 * "đang bật" trong khi service đã bị ROM giết là đúng loại lỗi §4.3: màn hình
 * khai một thứ đang chạy mà không chạy.
 */
function BongBongNoiNative({ t }: { t: any }) {
  const [dangChay, setDangChay] = useState(false);
  const [coQuyen, setCoQuyen] = useState(true);
  const [maHong, setMaHong] = useState<string | null>(null);

  const doLai = () => {
    void trangThaiBongBong().then((s) => {
      if (!s) return;
      setDangChay(s.dangChay);
      setCoQuyen(s.coQuyen);
    });
  };

  useEffect(() => {
    doLai();
    const khiHien = () => { if (document.visibilityState === 'visible') doLai(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => document.removeEventListener('visibilitychange', khiHien);
  }, []);

  const bat = async () => {
    setMaHong(null);
    const ket = await batBongBong();
    if (ket !== 'bat') { setMaHong(ket); doLai(); return; }
    setDangChay(true);
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-5">
      <h3 className="font-black text-[16px] text-[#311068] mb-1 flex items-center gap-2">
        <Sparkles size={18} className="text-[#6d28d9]" />
        {t('Nút tròn nổi trên màn hình')}
      </h3>
      <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
        {t('Một nút tròn mờ nằm ở mép màn hình, giống nút tròn của iPhone. Bác đang dùng app nào cũng thấy nó, chạm vào là mở Khoan Đã ngay. Kéo được sang chỗ khác nếu nó vướng.')}
      </p>

      {dangChay ? (
        <>
          <div className="flex items-center gap-2 mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="text-[14px] font-extrabold text-emerald-900">{t('Đang hiện trên màn hình')}</span>
          </div>
          <button
            onClick={() => { void tatBongBong().then(doLai); }}
            className="w-full min-h-[52px] py-3 px-4 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold rounded-2xl text-[15px] border-2 border-slate-300 transition-all"
          >
            {t('Tắt nút tròn')}
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => { void bat(); }}
            className="w-full min-h-[56px] py-3.5 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95 text-white font-extrabold rounded-2xl text-[16px] transition-all"
          >
            {t('Bật nút tròn')}
          </button>
          {(maHong === 'chua_co_quyen' || !coQuyen) && (
            <button
              onClick={() => { void xinQuyenPopup(); }}
              className="w-full mt-2 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-left"
            >
              <p className="text-[14px] text-amber-900 leading-snug font-medium">
                {t('Máy chưa cho phép vẽ đè. Chạm vào đây để mở Cài đặt, tìm dòng Khoan Đã rồi gạt sang bật.')}
              </p>
            </button>
          )}
          {maHong === 'rom_chan' && (
            <p className="text-[14px] text-amber-900 bg-amber-50 border border-amber-300 rounded-2xl px-3 py-2 leading-snug mt-2">
              {t('Máy đã cho phép vẽ đè, nhưng hệ điều hành vẫn chặn. Máy Xiaomi, Oppo, Vivo, Realme còn một công tắc nữa tên “hiện cửa sổ khi chạy nền” — bác bật luôn dòng đó giúp cháu.')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CuaSoNoiNative({ t }: { t: any }) {
  const [quyen, setQuyen] = useState<QuyenNative>('chua_bat');
  const [dangThu, setDangThu] = useState(false);
  const [maHong, setMaHong] = useState<string | null>(null);

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
      const ket = await hienPopupCanhBao({
        nhan: 'CAO',
        tieuDe: t("Đây là dải cảnh báo — bác đang xem thử"),
        nutMo: t("Mở Khoan Đã"),
        nutOn: t("Tôi ổn, tắt đi"),
      });
      // Chỉ đẩy app xuống khi dải THẬT SỰ đã hiện — xem `PopupDeManHinh.hien`.
      if (ket !== 'hien') { setMaHong(ket); setDangThu(false); doLai(); return; }
      // Rời app ra thì mới thấy dải nằm NGOÀI app — xem `dayAppXuong`.
      await dayAppXuong();
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
        <div className="w-9 h-9 rounded-2xl bg-purple-500/30 border border-purple-300/40 flex items-center justify-center text-purple-200 shrink-0">
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

          {/*
            ⚠️ KHÔNG CÓ CÔNG TẮC NÀO ĐỂ BẬT NỮA — VÀ PHẢI NÓI RA.
            Cấp quyền xong là tính năng đã chạy. Nhưng bác không biết điều đó,
            nên bác đi tìm một công tắc không tồn tại, không thấy, rồi kết luận
            tính năng chưa bật. Người dùng báo 21/8/2026: "vẫn chưa hiểu cách
            để bật nó lên, quyền thì cấp rồi".
            Một trạng thái đúng mà không ai đọc được thì vẫn là một trạng
            thái không dùng được.
          */}
          <p className="text-[14px] text-purple-100/90 leading-relaxed mb-3">
            {t("Không cần bật gì thêm. Từ giờ, mỗi khi Khoan Đã thấy dấu hiệu nguy hiểm cao, dải này tự hiện lên — kể cả khi bác đang ở app khác.")}
          </p>
          <p className="text-[14px] text-purple-100/90 leading-relaxed mb-3">
            {t("Bấm nút dưới đây để xem trước một lần. Khoan Đã sẽ tự thu nhỏ xuống để bác thấy dải nằm ngoài app thật, rồi nó tự tắt sau 5 giây.")}
          </p>
          <button
            onClick={thu}
            disabled={dangThu}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 disabled:opacity-60 text-white font-extrabold rounded-2xl text-[14px] flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Sparkles size={15} />
            <span>{dangThu ? t("Đang hiện thử…") : t("Xem thử một lần")}</span>
          </button>
          {maHong === 'rom_chan' && (
            <p className="text-[14px] text-amber-100 bg-amber-900/40 border border-amber-300/40 rounded-2xl px-3 py-2 leading-snug mt-2">
              {t('Máy đã cho phép vẽ đè, nhưng hệ điều hành vẫn chặn. Máy Xiaomi, Oppo, Vivo, Realme còn một công tắc nữa tên “hiện cửa sổ khi chạy nền” — bác bật luôn dòng đó giúp cháu.')}
            </p>
          )}
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
            {/*
              ⚠️ NHIỀU ROM PHỔ THÔNG Ở VIỆT NAM CÓ HAI CÔNG TẮC, KHÔNG PHẢI MỘT.
              `Settings.canDrawOverlays()` trả true sau khi bật công tắc thứ nhất,
              nên app tưởng xong — nhưng Xiaomi, Oppo, Vivo, Realme còn một quyền
              riêng tên "hiện cửa sổ khi chạy nền", và thiếu nó thì dải không bao
              giờ hiện lúc bác đang ở app khác — tức đúng lúc cần.
              Android không cho đọc trạng thái quyền riêng đó, nên thứ duy nhất
              làm được là NÓI RA thay vì để bác tưởng app hỏng (§4.3).
            */}
            <p className="text-[14px] text-amber-100/90 leading-relaxed mt-2">
              {t("Máy Xiaomi, Oppo, Vivo, Realme còn một công tắc nữa tên “hiện cửa sổ khi chạy nền”. Bác bật luôn cả dòng đó giúp cháu nhé.")}
            </p>
          </div>
          <button
            onClick={() => { void xinQuyenPopup(); }}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-[#3b1f00] font-extrabold rounded-2xl text-[14px] flex items-center justify-center gap-2 shadow-md transition-all"
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
/*
 * ══════ TIN ĐANG CHỜ — TỰ HIỆN, KHÔNG BẮT ĐI TÌM ══════
 *
 * Ban giám khảo nhận xét 20/8/2026: người dùng có thể sẽ không mở app, nên
 * phải bớt thao tác. Đúng — trước đây tin đã bắt được nằm trong một thẻ ở
 * Cài đặt › Thông báo, và bác phải tự mò vào đó rồi bấm "Kiểm tin nhắn".
 * Ba thao tác cho một việc đáng lẽ tự xảy ra.
 *
 * Nay: mở app hoặc quay lại app ⇒ tự hỏi máy xem có tin nào đang chờ không,
 * và nếu có thì thẻ hiện ngay đầu màn chính.
 *
 * ⚠️ TỰ HỎI MÁY KHÁC VỚI TỰ GỬI ĐI. `tinMoiNhat()` đọc hàng đợi nằm
 * TRONG BỘ NHỚ CỦA MÁY — không mạng, không một byte nào rời thiết bị. Việc
 * gửi nội dung đi kiểm VẪN chờ bác bấm, và phải giữ nguyên như thế:
 * §6.9 nói "tin chỉ nằm trong máy bác và chỉ được gửi đi kiểm khi bác bấm",
 * và §12 cấm tự đổi mô hình riêng tư. Tự gửi MỌI tin nhắn đến cho máy chủ
 * là biến một tính năng trợ giúp thành một đường ống dữ liệu.
 *
 * ⚠️ THẺ NÀY KHÔNG MANG NHÃN RỦI RO NÀO. Chưa có bộ luật nào chạy trên tin
 * này — nó chỉ nói "có tin chưa kiểm". Viết "tin này nguy hiểm" ở đây là
 * khai một kết luận chưa tồn tại (§11).
 *
 * ⚠️ KHÔNG HIỆN NỘI DUNG TIN TRÊN THẺ. Màn chính có thể đang được ai đó cầm
 * xem cùng. Chỉ nói có tin, để bác tự quyết định mở.
 */
function TinDangCho({ t, onAnalyze }: { t: any; onAnalyze?: (text: string) => void }) {
  const [tin, setTin] = useState<{ noiDung: string } | null>(null);

  const doLai = () => {
    void (async () => {
      if (!(await laApk())) return;
      if ((await quyenDocThongBao()) !== 'da_bat') return;
      const m = await tinMoiNhat();
      setTin(m?.co && m.noiDung ? { noiDung: m.noiDung } : null);
    })();
  };

  useEffect(() => {
    doLai();
    const khiHien = () => { if (document.visibilityState === 'visible') doLai(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => document.removeEventListener('visibilitychange', khiHien);
  }, []);

  if (!tin) return null;

  return (
    /*
     * ═════ ĐÈ LÊN MÀN CHÍNH, KHÔNG CHEN VÀO BỐ CỤC — 21/8/2026 ═════
     *
     * Bản trước đặt thẻ này trong dòng chảy của màn chính, ngay trên tiêu đề.
     * Hậu quả: cả màn bị đẩy xuống — linh vật co lại, ba nút chính tụt xuống,
     * ô nhập bị đẩy khỏi tầm nhìn. Một thẻ tạm thời không được phép xô lệch
     * bố cục cố định mà bác đã quen vị trí.
     *
     * ⚠️ `pointer-events-none` Ở LỚP NGOÀI. Lớp phủ tràn cả màn; không tắt
     * bắt sự kiện thì nó nuốt mọi cú chạm vào ba nút chính bên dưới. Chỉ
     * riêng cái thẻ mới nhận chạm.
     *
     * ⚠️ NẰM TRÊN, KHÔNG PHẢI CHẶN NGANG. Không phủ tối nền, không khoá
     * màn. Bác muốn lơ nó đi bấm việc khác thì vẫn bấm được — đây là một lời
     * mời, chưa có bộ luật nào chạy để nó được quyền chặn đường (§11).
     */
    <div className="absolute inset-x-0 top-0 z-40 flex justify-center px-4 pt-3 pointer-events-none">
      <div className="w-full max-w-[420px] bg-amber-50 border-2 border-amber-400 rounded-3xl p-4 shadow-[0_10px_30px_rgba(120,53,15,0.25)] pointer-events-auto">
        <p className="text-[15px] font-extrabold text-amber-950 leading-snug mb-1">
          {t('Có tin nhắn mới chưa kiểm')}
        </p>
        <p className="text-[14px] text-amber-900 leading-snug mb-3">
          {t('Khoan Đã giữ nó trong máy bác. Chạm vào đây để gửi đi kiểm.')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { const n = tin.noiDung; setTin(null); void xoaTinDaBat(); onAnalyze?.(n); }}
            className="flex-1 min-h-[52px] py-3 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95 text-white font-extrabold rounded-2xl text-[15px] transition-all"
          >
            {t('Kiểm tin này')}
          </button>
          <button
            onClick={() => { setTin(null); void xoaTinDaBat(); }}
            className="min-h-[52px] py-3 px-4 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold rounded-2xl text-[15px] border-2 border-slate-300 transition-all"
          >
            {t('Bỏ qua')}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-5">
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
      {/*
        ⚠️ NÓI TRƯỚC KHI XIN — thêm 23/9/2026. Bản APK giờ đọc cả thông báo của 22 app
        ngân hàng / ví (DocThongBao.GOI_NGAN_HANG), do người dùng quyết. Cùng một quyền
        hệ điều hành, nên câu này phải đứng ngay đây, trước nút cấp quyền.
      */}
      <p data-noi-truoc="ngan-hang" className="text-[14px] text-slate-600 leading-relaxed mb-3">
        {t("Lúc bác đang gọi, Khoan Đã cũng xem thông báo của app ngân hàng, ví (Vietcombank, BIDV, MoMo…) để biết tiền vừa ra hay mã vừa tới. Không lưu, không gửi đi.")}
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
            className="w-full min-h-[52px] px-4 mb-2.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:opacity-95 active:scale-95 disabled:opacity-60 text-white font-extrabold rounded-2xl text-[15px] transition-all"
          >
            {dangLay ? t("Đang lấy…") : t("Kiểm tin nhắn mới nhất")}
          </button>

          {/*
            ⚠️ §6.9 — LỐI XOÁ PHẢI Ở NGAY ĐÂY, KHÔNG CHÔN TRONG CÀI ĐẶT SÂU.
            Bác cho app đọc tin nhắn thì bác phải rút lại được dễ như lúc cho.
          */}
          <button
            onClick={() => { void xoaTinDaBat(); setKhongCoTin(false); }}
            className="w-full min-h-[52px] px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-2xl text-[14px] transition-all"
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
            className="w-full min-h-[52px] px-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:opacity-95 active:scale-95 text-[#3b1f00] font-extrabold rounded-2xl text-[15px] transition-all"
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
    <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-5">
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

      <div className="flex items-center justify-between p-3.5 bg-purple-50 rounded-2xl border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
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

/**
 * Đoạn giải thích GẤP LẠI, mặc định đóng.
 *
 * ⚠️ VÌ SAO KHÔNG XOÁ HẲN CHO GỌN: mấy đoạn này nói ra thứ bác CẦN biết trước
 * khi bật một quyền — cái gì được đọc, cái gì không. Xoá đi là bật quyền mà
 * không nói rõ. Nhưng bày sẵn cả ba đoạn cùng lúc thì màn hình thành một bức
 * tường chữ, và người cần đọc nhất lại là người bỏ qua trước nhất.
 *
 * Gấp lại: mặc định thấy công tắc, muốn hiểu thì mở ra.
 */
function GiaiThich({ t, children }: { t: any, children: React.ReactNode }) {
  const [mo, setMo] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setMo((x) => !x)}
        className="flex items-center gap-1.5 text-[14px] font-bold text-current opacity-80 py-1"
      >
        <span>{t('Vì sao?')}</span>
        <ChevronRight size={15} className={`transition-transform ${mo ? 'rotate-90' : ''}`} />
      </button>
      {mo && <div className="mt-1">{children}</div>}
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
            <strong style="font-size: 12px;">${t('Khoan Đã')}</strong>
            <span class="badge-live">${t('Đang nổi')}</span>
          </div>
          <div class="grid-btns">
            <button id="pipCam" class="btn btn-camera"><span>${t('Quét ảnh')}</span></button>
            <button id="pipSos" class="btn btn-danger"><span>${t('Dừng 60 giây')}</span></button>
            <button id="pipVoice" class="btn btn-voice"><span>${t('Chạm để nói')}</span></button>
            <button id="pipHome" class="btn btn-home"><span>${t('Mở ứng dụng')}</span></button>
          </div>
          <div style="font-size: 9px; color: #d8b4fe; text-align: center; margin-top: 4px;">
            ${t('Khung này nổi trên các cửa sổ khác.')}
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
      {/*
        ⚠️ HƯỚNG DẪN ĐẶT TRƯỚC CÁC CÔNG TẮC, KHÔNG ĐẶT SAU.
        Màn này có ba công tắc và mỗi cái đòi một quyền khác nhau của máy. Không
        có thứ tự thì bác bật cái nào trước cũng được, và cái nào hỏng thì không
        biết vì sao. Ba dòng dưới đây nói đúng thứ tự nên bật, và bật để làm gì.
      */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-4 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-4">
        <h3 className="text-[16px] font-black text-[#311068] mb-2">{t('Bật theo thứ tự này')}</h3>
        <ol className="flex flex-col gap-2">
          {[
            t('Bật dòng nhắc — để mở app nhanh khi có người gọi.'),
            t('Bật dải cảnh báo — để thấy cảnh báo cả khi đang nghe điện thoại.'),
            t('Bật đọc thông báo — để kiểm tin nhắn bằng một chạm.'),
          ].map((cau, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#7c3aed] text-white font-black text-[14px] flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-[14px] text-slate-700 leading-snug">{cau}</span>
            </li>
          ))}
        </ol>
        <p className="text-[14px] text-slate-500 leading-snug mt-2.5">
          {t('Mỗi lần bật, máy sẽ hỏi một lần. Bác chọn Cho phép rồi quay lại đây.')}
        </p>
      </div>

      {/* Top Bar */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-4">
        <button 
          onClick={() => setView('profile')}
          className="p-2.5 bg-white/80 rounded-2xl shadow-sm text-[#6d28d9] active:scale-95 transition-all flex items-center gap-1 font-bold text-[14px]"
        >
          <ChevronLeft size={20} />
          <span>{t("Quay lại")}</span>
        </button>
        <span className="text-[14px] font-extrabold text-purple-700 bg-purple-100 px-3 py-1 rounded-full border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
          {t("Cài đặt thông báo")}
        </span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-[#3b1d7d] mb-1 text-center">
        {t("Thông báo & Cửa sổ nổi")}
      </h2>

      {/*
        ═════ THẺ NÀY ĐỨNG ĐẦU MÀN — 21/8/2026 ═════

        Trước đây nó nằm cách đầu màn 406 dòng, sau một thẻ thông báo thường
        trực dài 137 dòng. Người dùng báo 21/8/2026: "vẫn chưa hiểu cách để
        bật nó lên, quyền thì cấp rồi".

        ⚠️ QUYỀN ĐÃ CẤP MÀ KHÔNG TÌM THẤY NÚT THÌ VẪN LÀ KHÔNG DÙNG ĐƯỢC.
        Và nó hỏng theo kiểu tệ nhất: bác đã làm phần khó nhất (đi vào Cài đặt
        hệ thống gạt một công tắc), rồi kết luận tính năng không chạy — trong
        khi nó chạy được, chỉ là nằm dưới năm thẻ khác.

        Thứ tự trên màn cài đặt không phải chuyện thẩm mỹ: cái gì bác đang đi
        tìm thì phải ở chỗ nhìn thấy ngay.
      */}
      {dangChayApk && <BongBongNoiNative t={t} />}
      {dangChayApk && <CuaSoNoiNative t={t} />}
      <GiaiThich t={t}>
        <p className="text-[14px] sm:text-sm text-purple-800/80 mb-5 text-center max-w-xs font-medium">{t("Ghim cố định trên khay hệ thống để truy cập tức thì hoặc kích hoạt cảnh giác khi gặp nguy hiểm")}</p>
      </GiaiThich>

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
            <span>{t('Đã bật cửa sổ nổi. Bác mở app khác vẫn thấy nó.')}</span>
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
            <GiaiThich t={t}>
              <p className="text-[14px] text-amber-200/90 leading-relaxed mt-1">{t("Bác vào Cài đặt của máy › Ứng dụng › Khoan Đã › Thông báo và bật lên, rồi quay lại bấm công tắc này.")}</p>
            </GiaiThich>
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
            {/*
              Ba dòng này đúng và hữu ích, nhưng chúng trả lời câu "nếu tôi lỡ
              vuốt mất thì sao" — câu đó chỉ nảy ra SAU. Để thường trực thì chúng
              cạnh tranh chỗ với câu duy nhất cần đọc ngay: "đã ghim xong".
            */}
            <GiaiThich t={t}>
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
            </GiaiThich>
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
      {/* Bản APK: thẻ này đã đưa lên ĐẦU màn — xem chú thích ở trên. */}
      {!dangChayApk && (
      <div className="w-full max-w-[420px] bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white rounded-[26px] p-5 shadow-lg border border-purple-400/50 mb-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/30 border border-purple-300/40 flex items-center justify-center text-purple-200 shrink-0">
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
          {t("Chỉ chạy trên Chrome hoặc Edge của máy tính.")}
        </p>

        {/*
          Đoạn giải thích dài 185 ký tự để thường trực — người dùng báo "quá nhiều
          chữ" 21/8/2026. Câu ngắn ở trên trả lời câu hỏi duy nhất đáng hỏi ngay
          ("máy tôi có dùng được không"); phần còn lại là vì sao, để ai muốn thì mở.

          ⚠️ KHÔNG LỒNG `GiaiThich` VÀO TRONG `<p>`. Nó dựng ra `<div>`, mà `<div>`
          trong `<p>` là HTML không hợp lệ — trình duyệt tự đóng thẻ `<p>` sớm và
          bố cục vỡ theo kiểu khó lần ra.
        */}
        <GiaiThich t={t}>
          <p className="text-[14px] text-purple-200/90 leading-relaxed">{t("Trên máy tính, cửa sổ nhỏ này nổi trên các cửa sổ khác để bác bấm nhanh. Trên điện thoại, web chưa làm được việc đó — cần bản cài đặt.")}</p>
        </GiaiThich>

        <button
          onClick={handleLaunchPipFromSettings}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-extrabold rounded-2xl text-[14px] flex items-center justify-center gap-2 shadow-md transition-all"
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
      <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-5">
        <h3 className="font-black text-[16px] text-[#311068] mb-1 flex items-center gap-2">
          <Sliders size={18} className="text-[#6d28d9]" />
          {t("Chọn hành động khi bấm vào thông báo:")}
        </h3>
        <GiaiThich t={t}>
          <p className="text-[14px] text-slate-500 mb-4">{t("Bác có thể tùy chọn để chạm vào sẽ mở ứng dụng hoặc bật ngay cảnh giác khẩn cấp:")}</p>
        </GiaiThich>

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
              <GiaiThich t={t}>
                <p className="text-[14px] text-slate-600 mt-1 leading-snug">{t("Trên thông báo có sẵn cả 2 nút: [🏠 Vào App] và [🚨 Báo nguy hiểm SOS] để bác chọn bất cứ lúc nào.")}</p>
              </GiaiThich>
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
              <GiaiThich t={t}>
                <p className="text-[14px] text-slate-600 mt-1 leading-snug">{t("Chạm vào thông báo sẽ mở ngay màn hình chính Khoan Đã để hỏi trợ lý AI, chụp ảnh quét lừa đảo hoặc kiểm tra tin nhắn.")}</p>
              </GiaiThich>
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
              <GiaiThich t={t}>
                <p className="text-[14px] text-slate-600 mt-1 leading-snug">{t("Chạm vào thông báo sẽ mở ngay chế độ Cảnh báo Rủi ro cao 60 giây, dừng ngay chuyển tiền và hiện phím gọi người thân.")}</p>
              </GiaiThich>
            </div>
          </div>
        </div>
      </div>

      {/* 4. In-App Banner Setting Toggle */}
      {setShowInAppBanner && (
        <div className="w-full max-w-[420px] bg-white rounded-[24px] p-4 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-5 flex items-center justify-between">
          <div className="flex flex-col pr-2">
            <span className="font-bold text-[#1e1b4b] text-[14px]">{t('Hiện dải ghim ở đầu trang web')}</span>
            <span className="text-[#64748b] text-[14px]">{t('Bật thì thấy dải tím ở đầu trang. Tắt thì chỉ nhận thông báo ngoài máy.')}</span>
          </div>
          {/* ⚠️ `role="switch"` + `aria-checked`: không có nó thì trình đọc màn hình
              đọc ra "nút" và không nói được đang bật hay tắt — một công tắc mà
              không biết trạng thái thì không dùng được. Đo 19/9/2026: cả ba công
              tắc trong app đều thiếu. */}
          <button
            role="switch"
            aria-checked={!!showInAppBanner}
            aria-label={t('Hiện dải ghim ở đầu trang web')}
            onClick={() => setShowInAppBanner(!showInAppBanner)}
            className={`w-12 h-7 rounded-full relative transition-colors shadow-inner shrink-0 ${showInAppBanner ? 'bg-[#8b5cf6]' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${showInAppBanner ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>
      )}

      {/*
        ══════ ĐÃ BỎ THẺ "MÔ PHỎNG THANH THÔNG BÁO" — 20/8/2026 ══════

        Thẻ cũ vẽ lại một thanh thông báo giả ngay trong app: hộp đen to bằng
        một phần ba màn hình, kèm bốn nút giả không làm gì ngoài việc trông
        giống thật. Người dùng báo nó "rất rất nhiều chữ" và đúng như vậy.

        ⚠️ VÀ NÓ CÒN LÀ MỘT LỜI KHAI SAI — cùng họ với màn "ngoài app": vẽ ra
        một thứ trông như thông báo thật, trong khi thông báo thật nằm ở thanh
        thông báo của máy chứ không nằm trong app.

        Giữ lại đúng một nút — nút BẮN THÔNG BÁO THẬT. Nó làm đúng việc mà cả
        thẻ kia chỉ giả vờ làm, và bác kiểm chứng bằng cách vuốt thanh thông báo
        của chính máy mình.
      */}
      <button
        onClick={handleTestNotification}
        className="w-full max-w-[420px] min-h-[56px] mb-5 py-3.5 px-4 bg-white hover:bg-purple-50 active:scale-95 text-[#5b21b6] font-bold rounded-2xl text-[15px] flex items-center justify-center gap-2.5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] transition-all"
      >
        <Bell size={18} className="text-amber-500 shrink-0" />
        <span>{t('Bắn thử một thông báo ra máy')}</span>
      </button>

      {/* 6. Other Standard Alert Toggles */}
      <div className="w-full max-w-[420px] bg-white rounded-[24px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
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
      
      <div className="w-full max-w-[360px] bg-white rounded-[20px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
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
function ProfileView({ setView, t, isLoggedIn, hoSo, onDangXuat }: {
  setView: (v: ViewState) => void,
  t: any,
  isLoggedIn: boolean,
  /** Hồ sơ thật từ máy chủ. `null` = chưa đăng nhập. */
  hoSo: HoSoTaiKhoan | null,
  onDangXuat: () => Promise<void>,
}) {
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

      {/*
        ⚠️ NÚT "ĐĂNG NHẬP" LẤY ĐÚNG DẢI MÀU CỦA THANH ĐIỀU HƯỚNG DƯỚI
        (`from-[#9e76ea] via-[#ad8af0] to-[#9e76ea]`). Bản trước dùng tím đậm
        hơn hẳn (`#9333ea → #7e22ce`) nên trên cùng một màn có hai sắc tím
        không ăn nhau. Bo tròn hẳn + viền + bóng cứng theo chuẩn màn Gia đình.
      */}
      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center py-12 px-5 bg-white rounded-[24px] border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065] mt-4">
           <User size={48} className="text-[#a78bfa] mb-4" />
           <p className="text-[#3b1d7d] font-bold text-[18px] mb-2">{t("Chưa có dữ liệu")}</p>
           <p className="text-center text-[#6d28d9] text-[15px] font-medium px-4 mb-6 leading-snug">{t("Vui lòng đăng nhập để xem thông tin")}</p>
           <button onClick={() => setView('login')} className="min-h-[56px] px-8 py-3 bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-white font-bold text-[16px] rounded-full border-[2.5px] border-[#2e1065] shadow-[2px_2px_0_#2e1065] active:scale-95 transition-all">
             {t("Đăng nhập")}
           </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[28px] p-5 flex gap-5 items-center border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6">
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
              {/*
                ⚠️ ĐỌC TÊN THẬT, ĐỪNG MÃ CỨNG CÂU "CHƯA ĐẶT TÊN".
                Bản cũ luôn hiện câu đó dù `hoSo` đã được truyền vào — tức bác
                đăng ký tên "Bác Tám" xong vào hồ sơ vẫn thấy "Bác chưa đặt tên".
                Người dùng báo 21/8/2026.

                Chú thích ngay trên viết "Chưa có tên thì nói chưa có" — đúng ý định,
                nhưng mã thì nói vậy trong MỌI trường hợp. Một ý định đúng không tự
                biến thành hành vi đúng.
              */}
              <h3 className="font-extrabold text-[#1e1b4b] text-[22px] mb-1">
                {hoSo?.ten?.trim() || t("Bác chưa đặt tên")}
              </h3>
              <div className="inline-flex items-center gap-1.5 bg-[#f3e8ff] text-[#7e22ce] px-3 py-1.5 rounded-lg text-[14px] font-bold">
                 <Lock size={14} /> {t("Thiết bị hiện tại")}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <button type="button" onClick={() => setView('account')} className="w-full text-left bg-white rounded-[20px] p-4 flex items-center justify-between border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:bg-[#f8f4ff] cursor-pointer transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center text-white shadow-sm">
                   <User size={24} fill="currentColor" />
                 </div>
                 <span className="font-bold text-[#1e1b4b] text-[17px]">{t("Tài khoản")}</span>
               </div>
               <ChevronRight className="text-[#c084fc]" />
             </button>
             
             <button type="button" onClick={() => setView('privacy')} className="w-full text-left bg-white rounded-[20px] p-4 flex items-center justify-between border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:bg-[#f8f4ff] cursor-pointer transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center text-white shadow-sm">
                   <ShieldCheck size={24} fill="currentColor" />
                 </div>
                 <span className="font-bold text-[#1e1b4b] text-[17px]">{t("Quyền riêng tư")}</span>
               </div>
               <ChevronRight className="text-[#c084fc]" />
             </button>
             
             <button type="button" onClick={() => setView('notifications')} className="w-full text-left bg-white rounded-[20px] p-4 flex items-center justify-between border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:bg-[#f8f4ff] cursor-pointer transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center text-white shadow-sm">
                   <Bell size={24} fill="currentColor" />
                 </div>
                 <span className="font-bold text-[#1e1b4b] text-[17px]">{t("Thông báo")}</span>
               </div>
               <ChevronRight className="text-[#c084fc]" />
             </button>
             
             <button type="button" onClick={() => setView('device_data')} className="w-full text-left bg-white rounded-[20px] p-4 flex items-center justify-between border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:bg-[#f8f4ff] cursor-pointer transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#c084fc] flex items-center justify-center text-white shadow-sm">
                   <Database size={24} fill="currentColor" />
                 </div>
                 <span className="font-bold text-[#1e1b4b] text-[17px]">{t("Dữ liệu trên thiết bị")}</span>
               </div>
               <ChevronRight className="text-[#c084fc]" />
             </button>
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
  onDangXuat,
  pinnedNotification,
  togglePinnedNotification,
  showFloatingBall,
  setShowFloatingBall,
  onOpenOutsideMode,
  onOpenMenu,
  sieuDonGian,
  setSieuDonGian
}: {
  setView: (view: ViewState) => void,
  t: any,
  lang: Lang,
  setLang: (l:Lang)=>void,
  fontSize: string,
  setFontSize: (s:string)=>void,
  isLoggedIn: boolean,
  onDangXuat: () => Promise<void>,
  pinnedNotification?: boolean,
  togglePinnedNotification?: () => Promise<void> | void,
  showFloatingBall?: boolean,
  setShowFloatingBall?: (v: boolean) => void,
  onOpenOutsideMode?: () => void,
  onOpenMenu?: () => void,
  sieuDonGian?: boolean,
  setSieuDonGian?: (v: boolean) => void
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

      <h2 className="text-3xl font-black text-[#3b1d7d] mt-2 mb-8">{t("nhan_cai_dat")}</h2>

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
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
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

      {/*
        QUY TẮC GIA ĐÌNH — đặt NGAY DƯỚI mật khẩu gia đình, vì cùng một họ:
        cả hai là thứ nhà mình thống nhất lúc bình tĩnh để dùng lúc hoảng.

        Khác nhau ở chỗ: mật khẩu trả lời câu 'người gọi có đúng là con mình
        không'; quy tắc trả lời câu 'nhà mình đã hẹn nhau làm gì trong tình
        huống này'. Quy tắc được đọc lại trên màn cảnh báo, kèm tên người đã
        cùng đặt — xem `KhoiQuyTac`.
      */}
      <button
        onClick={() => setView('quy_tac_gia_dinh')}
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700 shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[16px] text-[#311068] leading-snug">{tra(QUY_TAC_KHUNG, 'TIEU_DE', lang)}</h3>
          <p className="text-[14px] text-slate-600 leading-snug mt-0.5">
            {t('Câu nhà mình tự đặt, hiện lại đúng lúc có người thúc bác chuyển tiền')}
          </p>
        </div>
        <ChevronRight size={20} className="text-indigo-600 shrink-0" />
      </button>

      {/*
        HAI MÀN SAU SỰ CỐ — hồ sơ để cầm đi, và ra-đa để nhìn lại.

        Đặt ở Cài đặt chứ không đặt ở trang chủ: đây là thứ dùng lúc bình tĩnh,
        không phải lúc đang bị thúc. Trang chủ giữ cho đúng một việc — kiểm.
      */}
      <button
        onClick={() => setView('ho_so_vu_viec')}
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0">
          <FileText size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[16px] text-[#311068] leading-snug">{tra(MAN_HO_SO, 'TIEU_DE', lang)}</h3>
          <p className="text-[14px] text-slate-600 leading-snug mt-0.5">
            {t('Một tờ để cầm đi ngân hàng hoặc công an')}
          </p>
        </div>
        <ChevronRight size={20} className="text-slate-500 shrink-0" />
      </button>

      <button
        onClick={() => setView('ra_da_thu_doan')}
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0">
          <Radar size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[16px] text-[#311068] leading-snug">{tra(MAN_RA_DA, 'TIEU_DE', lang)}</h3>
          <p className="text-[14px] text-slate-600 leading-snug mt-0.5">
            {t('Ba mươi ngày qua nhà mình gặp thủ đoạn nào')}
          </p>
        </div>
        <ChevronRight size={20} className="text-slate-500 shrink-0" />
      </button>

      <button
        onClick={() => setView('con_cai_giup')}
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
          <Users size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[16px] text-[#311068] leading-snug">{t('Con cháu cài giúp')}</h3>
          <p className="text-[14px] text-slate-600 leading-snug mt-0.5">{t('Nối máy, ghi lời nhắn, bật báo cho con — 3 phút')}</p>
        </div>
        <ChevronRight size={20} className="text-slate-500 shrink-0" />
      </button>

      <button
        onClick={() => setView('chia_khoa')}
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-700 shrink-0">
          <KeyRound size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[16px] text-[#311068] leading-snug">{t('Chìa khoá thứ hai')}</h3>
          <p className="text-[14px] text-slate-600 leading-snug mt-0.5">{t('Khoản chuyển lớn cần con xác nhận')}</p>
        </div>
        <ChevronRight size={20} className="text-slate-500 shrink-0" />
      </button>

      <button
        onClick={() => setView('ghep_con_chau')}
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
          <Link2 size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[16px] text-[#311068] leading-snug">{t('Nối với con cháu')}</h3>
          <p className="text-[14px] text-slate-600 leading-snug mt-0.5">{t('Lấy mã để con cháu nối vào máy bác')}</p>
        </div>
        <ChevronRight size={20} className="text-slate-500 shrink-0" />
      </button>

      <button
        onClick={() => setView('cong_dong')}
        className="w-full max-w-[360px] bg-white rounded-3xl p-5 border border-[#e4d4ff] shadow-[0_8px_24px_rgba(91,33,182,0.10)] mb-6 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#f1e8ff] border border-[#dcc7ff] flex items-center justify-center text-[#7c3aed] shrink-0">
          <Users size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[16px] text-[#311068] leading-snug">{t("Cộng đồng cảnh giác")}</h3>
          <p className="text-[14px] text-slate-600 leading-snug mt-0.5">{t("Chia sẻ ẩn danh để mọi người cùng đề phòng.")}</p>
        </div>
        <ChevronRight size={20} className="text-[#8b5cf6] shrink-0" />
      </button>

      {/* Floating Assistive Ball & Outside Mode Card — ẩn khi tối giản. */}
      {!sieuDonGian && (
      <div className="w-full max-w-[360px] bg-gradient-to-br from-purple-900 to-indigo-950 rounded-3xl p-5 shadow-md border border-purple-400/30 text-white mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200">
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
          {t("Chạm là quét ảnh hoặc mã QR ngay. Chỉ có khi bác đang mở Khoan Đã.")}
        </p>

        {setShowFloatingBall && (
          <div className="flex items-center justify-between pt-3 border-t border-white/10 mb-3">
            <span className="text-[14px] font-bold text-white">
              {showFloatingBall ? t("Đang bật bóng trợ năng") : t("Đang tắt")}
            </span>
            <button
              role="switch"
              aria-checked={!!showFloatingBall}
              aria-label={t('Bóng nổi Khoan Đã')}
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
            className="w-full py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-2xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 border border-white/20"
          >
            {/*
              ⚠️ NHÃN NGẮN LẠI. Bản trước là "Thử màn hình khóa / Màn hình ngoài"
              — tiếng Anh dịch ra "Try Lock Screen / Outside Screen" và vỡ thành
              hai dòng lệch nhau, thấy trong ảnh người dùng gửi 20/8/2026.
              Dấu gạch chéo giữa hai cụm dài là chỗ xuống dòng tệ nhất: mắt đọc
              thành hai lựa chọn, mà thật ra chỉ có một nút.
            */}
            <Smartphone size={15} /> {t("Xem thử ngoài app")}
          </button>
        )}
      </div>
      )}

      {/*
        ⚠️ ĐẶT NGAY TRÊN CỠ CHỮ, KHÔNG GIẤU DƯỚI ĐÁY.
        Hai thứ này giải quyết cùng một khó khăn — nhìn không rõ, bấm không trúng
        — nên người đang tìm cái này thường đang tìm cả cái kia.

        ⚠️ MỘT CÔNG TẮC, KHÔNG PHẢI HAI. Nhánh dev từng dựng riêng "Chế độ tối
        giản" (ẩn bóng nổi, tin tức) song song với chế độ này trên web. Hai công
        tắc cho cùng một khó khăn là hai thứ bác phải hiểu — gộp 17/9/2026: bật
        lên là vừa có màn ba nút to, vừa ẩn bóng nổi và tin tức.
      */}
      {setSieuDonGian && (
        <div className="w-full max-w-[360px] bg-white rounded-3xl p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-[17px] font-black text-[#4c1d95] leading-snug">
                {t('Chế độ siêu đơn giản')}
              </h3>
              <p className="text-[14px] text-slate-600 leading-snug mt-1">
                {t('Một màn hình, ba nút to. Bấm được ngay cả khi tay run.')}
              </p>
            </div>
            <button
              onClick={() => setSieuDonGian(!sieuDonGian)}
              role="switch"
              aria-checked={!!sieuDonGian}
              aria-label={t('Chế độ siêu đơn giản')}
              className={`w-14 h-8 rounded-full transition-colors relative p-0.5 shrink-0 ${sieuDonGian ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`w-7 h-7 rounded-full bg-white shadow-md transition-transform ${sieuDonGian ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-[360px] bg-white rounded-3xl p-6 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6">
        <h3 className="text-lg font-bold text-[#4c1d95] mb-3">{t("nhan_co_chu")}</h3>
        <div className="flex justify-between items-center bg-[#f3e8ff] p-1.5 rounded-2xl">
          <button
            onClick={() => setFontSize('small')}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-[15px] transition-all ${fontSize === 'small' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("nhan_nho")}
          </button>
          <button
            onClick={() => setFontSize('normal')}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-[15px] mx-1.5 transition-all ${fontSize === 'normal' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("nhan_vua")}
          </button>
          <button
            onClick={() => setFontSize('large')}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-[15px] transition-all ${fontSize === 'large' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("nhan_lon")}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-3xl p-6 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-6">
        <h3 className="text-lg font-bold text-[#4c1d95] mb-3">{t("nhan_ngon_ngu")}</h3>
        <div className="flex justify-between items-center bg-[#f3e8ff] p-1.5 rounded-2xl">
          <button
            onClick={() => setLang('vi')}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-[15px] transition-all ${lang === 'vi' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("nhan_tieng_viet")}
          </button>
          <button
            onClick={() => setLang('en')}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-[15px] ml-1.5 transition-all ${lang === 'en' ? 'bg-[#6d28d9] text-white shadow-md' : 'text-[#6d28d9] hover:bg-[#e9d5ff]'}`}
          >
            {t("nhan_english")}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[360px] mb-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] flex flex-col overflow-hidden">
           {onOpenMenu && (
             <button
               type="button"
               onClick={onOpenMenu}
               aria-label={t("Menu tác vụ")}
               className="w-full text-left p-5 flex items-center justify-between border-b border-[#e9d5ff] cursor-pointer hover:bg-white/80 active:bg-purple-50 transition-colors"
             >
                <span className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-[#6d28d9]">
                    <LayoutGrid size={22} />
                  </span>
                  <span className="font-bold text-[#311068] text-[16px]">{t("Menu tác vụ")}</span>
                </span>
                <ChevronRight size={20} className="text-purple-400" />
             </button>
           )}
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
                    {pinnedNotification ? t("Đang ghim cố định") : t("Tùy chỉnh thông báo")}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-purple-400" />
           </div>
           
           {isLoggedIn ? (
             <button type="button" onClick={() => { void onDangXuat(); }} className="w-full text-left p-5 flex items-center gap-3 cursor-pointer active:bg-red-50 transition-colors">
                <LogOut size={22} className="text-[#ef4444]" />
                <span className="font-bold text-[#ef4444] text-[16px]">{t("Đăng xuất")}</span>
             </button>
           ) : (
             <button type="button" onClick={() => setView('login')} className="w-full text-left p-5 flex items-center gap-3 cursor-pointer active:bg-green-50 transition-colors">
                <User size={22} className="text-[#10b981]" />
                <span className="font-bold text-[#047857] text-[16px]">{t("Đăng nhập")}</span>
             </button>
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
      // ⚠️ Khoá = đúng chữ hiện ra (sửa 23/9/2026). Khoá cũ "AI thông minh kiểm tra cuộc gọi, … giao dịch lạ" nói quá (§11).
      desc: t("AI đọc tin nhắn, đường link và ảnh bác gửi để tìm dấu hiệu. Bộ luật cố định mới quyết mức rủi ro."),
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

  // Ghi lại là đã xem — xem chú thích ở chỗ khởi tạo `view`. Màn giới thiệu
  // chỉ được hỏi MỘT LẦN; hỏi lại mỗi lần mở app là một lý do nữa để không mở.
  const danhDauDaXem = () => {
    try { localStorage.setItem('daXemIntro', '1'); } catch { /* bị chặn thì thôi */ }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      if (setUserRole) setUserRole('elder');
      danhDauDaXem();
      setView('home');
    }
  };

  const handleSelectRole = (role: 'elder' | 'guardian') => {
    if (setUserRole) setUserRole(role);
    setShowRoleModal(false);
    danhDauDaXem();
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
 className="w-full max-w-md bg-white rounded-3xl p-6 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] flex flex-col items-center text-center"
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
 className="text-[#6d28d9] font-bold text-[14px] active:scale-95 transition-transform bg-white/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]"
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

            <div className="flex-1 w-full flex items-center justify-center min-h-0 max-h-[62vh] my-1 mascot-box">
              <motion.img
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                src={slides[currentSlide]?.image}
                alt="Mascot illustration"
                draggable={false}
                /*
                 * ⚠️ ĐẶT CỨNG KÍCH THƯỚC THEO fontSize — không scale theo rem.
                 *
                 * Trước 20/8/2026: `h-[45vh] max-h-[450px]` cộng với `scale-135`.
                 * Bậc "Lớn" đặt gốc chữ 20px thay vì 17px, làm layout bốc hơi,
                 * và minh-hoa chiếm gần nửa màn — che chữ tiêu đề và nút Tiếp tục.
                 * Với người cao tuổi, đó là dạng lỗi §4.4 đã cảnh báo: phóng to
                 * chữ KHÔNG ĐƯỢC phóng to ảnh minh họa.
                 *
                 * Nay: cap cứng theo fontSize qua ba bậc từ `src/index.css`.
                 * Bậc "Nhỏ" — h-[28vh] max-h-[260px]; "Vừa" — h-[36vh] max-h-[340px];
                 * "Lớn" — h-[40vh] max-h-[380px]. Đủ thấy, không che.
                 */
                className="mascot-img h-[36vh] max-h-[340px] w-auto max-w-[95%] sm:max-w-[420px] object-contain drop-shadow-[0_25px_50px_rgba(109,40,217,0.25)] pointer-events-none select-none my-auto"
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

        {/*
          PHẦN 2 (23/9/2026) — LỐI "CON CHÁU CÀI GIÚP". Người cài app cho người già
          thường là con cháu; đo trước đó 4 trang giới thiệu không bước nào xin số
          con, nên nút gọi khẩn cấp mặc định trống.
        */}
        {currentSlide === slides.length - 1 && (
          <button
            onClick={() => { if (setUserRole) setUserRole('elder'); danhDauDaXem(); setView('con_cai_giup'); }}
            className="w-full max-w-sm mt-2 min-h-[52px] rounded-2xl border-2 border-[#6d28d9] text-[#4c1d95] font-bold text-[16px] bg-white/80 px-3 leading-snug active:scale-95 transition-transform"
          >
            {t("Con cháu cài giúp")}
          </button>
        )}
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
function TinLuaDaoGanDay({ t, lang = 'vi', onOpenCommunity }: { t: any, lang?: Lang, onOpenCommunity?: () => void }) {
  const [tin, setTin] = useState<any[] | null>(null);
  const [chuaLayDuoc, setChuaLayDuoc] = useState<string[]>([]);
  const [baiCongDong, setBaiCongDong] = useState<Array<{ id: string; tomTat: string; luc: number }>>([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    let huy = false;
    (async () => {
      try {
        const res = await fetch(api(`/api/tin-lua-dao?lang=${lang}`));
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
    // Đổi ngôn ngữ ⇒ lấy lại từ đúng bộ nguồn của ngôn ngữ đó.
  }, [lang]);

  useEffect(() => {
    let huy = false;
    fetch(api('/api/cong-dong/canh-giac'))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!huy) setBaiCongDong(Array.isArray(d?.baiViet) ? d.baiViet.slice(0, 2) : []);
      })
      .catch(() => { if (!huy) setBaiCongDong([]); });
    return () => { huy = true; };
  }, []);

  const cauChuaLayDuoc = traNhieu(CHUA_LAY_TIN, chuaLayDuoc, lang);

  return (
    <div className="w-full md:hidden mt-2">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h3 className="font-black text-[#1e1b4b] text-[15px]">{t("Cảnh báo mới")}</h3>
        {onOpenCommunity && (
          <button
            type="button"
            onClick={onOpenCommunity}
            className="min-h-[44px] px-3 rounded-full bg-[#f1e8ff] border border-[#dcc7ff] text-[#6d28d9] font-bold text-[14px] flex items-center gap-1.5 shrink-0"
          >
            <Users size={16} aria-hidden="true" />
            {t("Cộng đồng")}
          </button>
        )}
      </div>

      <div className="mb-3 rounded-2xl border border-[#e4d4ff] bg-white p-3 shadow-[0_6px_18px_rgba(91,33,182,0.08)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Users size={18} className="text-[#7c3aed] shrink-0" aria-hidden="true" />
            <span className="font-black text-[15px] text-[#321379]">{t("Cộng đồng cảnh giác")}</span>
          </div>
          <button type="button" onClick={onOpenCommunity} className="min-h-[44px] px-3 rounded-full bg-[#f1e8ff] text-[#6d28d9] font-bold text-[14px] shrink-0">
            {t("Chia sẻ")}
          </button>
        </div>
        {baiCongDong.length > 0 ? (
          <div className="mt-2 space-y-2">
            {baiCongDong.map((b) => <p key={b.id} className="text-[14px] text-[#51436f] leading-snug">{b.tomTat}</p>)}
          </div>
        ) : (
          <p className="mt-1 text-[14px] text-slate-600 leading-snug">{t("Chia sẻ ẩn danh để mọi người cùng đề phòng.")}</p>
        )}
      </div>

      {dangTai ? (
        <div className="bg-white rounded-2xl p-4 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] text-[14px] text-gray-600">
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
 className="bg-white rounded-2xl p-3 flex gap-2.5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] items-start"
            >
              <span className="w-10 h-10 rounded-2xl bg-purple-50 border-2 border-[#2e1065] flex items-center justify-center text-purple-700 shrink-0">
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
            <div className="bg-white rounded-2xl p-4 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] text-[14px] text-gray-700">
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
  isAnalyzing,
  /**
   * ⚠️ PHẢI NHẬN `superBasic` — CUỐI HÀM CÓ DÙNG TỚI NÓ.
   *
   * Thiếu dòng này thì `{!superBasic && <TinLuaDaoGanDay …/>}` ở cuối hàm ném
   * `ReferenceError: superBasic is not defined`, và app TRẮNG MÀN ngay khi bác
   * bấm nút "Tìm kiếm" — không phải hỏng một khối, mà hỏng cả ứng dụng.
   *
   * `tsc` đã chỉ thẳng lỗi này từ lâu; nó lọt được là vì `npm test` không hề
   * gọi trình biên dịch. Nay `test/bien-dich-khong-loi.test.js` chặn lại.
   *
   * Mặc định `false`: chưa ai truyền thì coi như KHÔNG ở chế độ tối giản, tức
   * vẫn hiện đủ nội dung — thiếu sót nghiêng về phía hiện thừa, không phải phía
   * giấu mất tin của bác.
   */
  superBasic = false
}: {
  setView: (v: ViewState) => void,
  t: any,
  lang?: Lang,
  onAnalyze?: (text: string, image?: string | null) => void,
  isAnalyzing?: boolean,
  superBasic?: boolean
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
         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-1.5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065]">
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
              <img src={searchImage} alt="Preview" className="w-10 h-10 object-cover rounded-2xl border border-purple-400 shrink-0" />
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

          <div className="relative flex items-center bg-white rounded-2xl p-1.5 pl-2 pr-1.5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] focus-within:ring-2 ring-[#c084fc]/50 transition-all">
             <button 
               type="button"
               onClick={() => fileInputRef.current?.click()}
               className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-colors shrink-0 ${searchImage ? 'bg-[#7e22ce] text-white shadow-xs' : 'text-[#6d28d9] hover:bg-[#f3e8ff]'}`}
               /* `title` chỉ hiện khi rê chuột — điện thoại không có chuột. */
               aria-label={t("Chọn ảnh")}
               title={t("Chọn ảnh")}
             >
               <ImageIcon size={24} />
             </button>
             <input 
                 type="text" 
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
                 placeholder={t("Nhập link, số ĐT, tin nhắn...")} 
                 className="flex-1 bg-transparent border-none outline-none px-2.5 py-2 text-[#311068] placeholder:text-[#311068]/50 font-medium text-[14px]"
                 onKeyDown={(e) => { if(e.key === 'Enter') handleRunSearch(); }}
              />
             {/*
               ⚠️ NÚT CHÍNH CỦA MÀN NÀY — sàn 56px cả hai chiều, không phải 36px.
               Đo 19/9/2026: hộp cũ ra 38,3 × 55,3px, thiếu 17,7px bề ngang so với
               sàn nút chính. `data-vai-tro="nut-chinh"` để `vung-cham-san.css` canh.
             */}
             <button
               onClick={() => handleRunSearch()}
               aria-label={t("Kiểm tra ngay")}
               data-vai-tro="nut-chinh"
               disabled={isAnalyzing}
               className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#6d28d9] flex items-center justify-center text-white shadow-xs active:scale-95 transition-transform shrink-0 disabled:opacity-50"
             >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search size={20} strokeWidth={2.5} />
                )}
             </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-3 md:hidden">
             <button 
               onClick={() => {
                 setSearchInput("Tôi nhận được mã QR yêu cầu quét để nhận quà tri ân");
                 handleRunSearch("Tôi nhận được mã QR yêu cầu quét để nhận quà tri ân");
               }}
 className="flex flex-col items-center justify-center bg-white rounded-2xl p-2.5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:scale-95 transition-transform"
             >
               <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center mb-1 text-blue-600">
                 <QrCode size={18} />
               </div>
               <span className="text-[#3b1d7d] font-bold text-[14px] text-center">{t("Mã QR")}</span>
             </button>
             
             <button 
               onClick={() => {
                 setSearchInput("Có người gửi link khuyến mãi trúng thưởng yêu cầu đăng nhập");
                 handleRunSearch("Có người gửi link khuyến mãi trúng thưởng yêu cầu đăng nhập");
               }}
 className="flex flex-col items-center justify-center bg-white rounded-2xl p-2.5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:scale-95 transition-transform"
             >
               <div className="w-9 h-9 bg-purple-100 rounded-2xl flex items-center justify-center mb-1 text-purple-600">
                 <Globe size={18} />
               </div>
               <span className="text-[#3b1d7d] font-bold text-[14px] text-center">{t("Link web")}</span>
             </button>
             
             <button 
               onClick={() => {
                 setSearchInput("Số điện thoại lạ gọi tự xưng công an yêu cầu chuyển tiền vào tài khoản an toàn");
                 handleRunSearch("Số điện thoại lạ gọi tự xưng công an yêu cầu chuyển tiền vào tài khoản an toàn");
               }}
 className="flex flex-col items-center justify-center bg-white rounded-2xl p-2.5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] active:scale-95 transition-transform"
             >
               <div className="w-9 h-9 bg-emerald-100 rounded-2xl flex items-center justify-center mb-1 text-emerald-600">
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
         <button type="button" onClick={() => handleRunSearch("Cuộc gọi tự xưng cơ quan chức năng hoặc công an điều tra")} className="w-full text-left bg-white rounded-[1.5rem] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] flex flex-col gap-3 hover: hover:border-purple-300 transition-all cursor-pointer group text-left min-w-0">
            <div className="w-14 h-14 bg-[#f3e8ff] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
               <Phone className="w-7 h-7 text-[#7e22ce] relative z-10" />
               <div className="absolute inset-0 bg-gradient-to-tr from-[#c084fc]/20 to-transparent"></div>
            </div>
            <div className="min-w-0">
               <h3 className="font-bold text-[18px] text-[#2e1065] mb-1">{t("Cuộc gọi lạ")}</h3>
               <p className="text-[15px] text-[#4b5563] leading-snug">{t("Kể lại nội dung cuộc gọi để được kiểm tra.")}</p>
            </div>
         </button>

         <button type="button" onClick={() => handleRunSearch("Tin nhắn thông báo tài khoản ngân hàng bị khóa hoặc yêu cầu ấn vào link")} className="w-full text-left bg-white rounded-[1.5rem] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] flex flex-col gap-3 hover: hover:border-purple-300 transition-all cursor-pointer group text-left min-w-0">
            <div className="w-14 h-14 bg-[#f3e8ff] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
               <MessageSquare className="w-7 h-7 text-[#7e22ce] relative z-10" />
               <div className="absolute inset-0 bg-gradient-to-tr from-[#c084fc]/20 to-transparent"></div>
            </div>
            <div className="min-w-0">
               <h3 className="font-bold text-[18px] text-[#2e1065] mb-1">{t("Tin nhắn đáng ngờ")}</h3>
               <p className="text-[15px] text-[#4b5563] leading-snug">{t("Dán nội dung hoặc gửi ảnh chụp tin nhắn.")}</p>
            </div>
         </button>

         <button type="button" onClick={() => handleRunSearch("Đường link nhận quà hoặc yêu cầu quét mã QR nạp tiền")} className="w-full text-left bg-white rounded-[1.5rem] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] flex flex-col gap-3 hover: hover:border-purple-300 transition-all cursor-pointer group text-left min-w-0">
            <div className="w-14 h-14 bg-[#f3e8ff] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
               <Globe className="w-7 h-7 text-[#7e22ce] relative z-10" />
               <div className="absolute inset-0 bg-gradient-to-tr from-[#c084fc]/20 to-transparent"></div>
            </div>
            <div className="min-w-0">
               <h3 className="font-bold text-[18px] text-[#2e1065] mb-1">{t("Link hoặc mã QR")}</h3>
               <p className="text-[15px] text-[#4b5563] leading-snug">{t("Kiểm tra trước khi bấm mở để tránh rủi ro.")}</p>
            </div>
         </button>
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
      {!superBasic && <TinLuaDaoGanDay t={t} lang={lang} onOpenCommunity={() => setView('cong_dong')} />}
    </motion.div>
  );
}

// --- Login View ---
/**
 * ĐĂNG NHẬP — GỌI MÁY CHỦ THẬT.
 *
 * ══════════ ⚠️ MÀN NÀY TỪNG LÀ MỘT CÁI VỎ ══════════
 *
 * Bản trước: bấm nút → `setTimeout(800ms)` → `setIsLoggedIn(true)`. Không số
 * điện thoại, không mật khẩu, không một lượt gọi mạng nào. Kèm theo là một nút
 * "Đăng nhập bằng Google" có đủ logo bốn màu, trong khi không có một dòng OAuth
 * nào trong cả dự án.
 *
 * Máy chủ thì đã có sẵn phần đăng nhập tử tế từ lâu — scrypt, muối riêng, chống
 * dò thời gian, một mã lỗi duy nhất cho mọi ca sai — chỉ là không ai gọi tới.
 *
 * ⚠️ NÚT GOOGLE ĐÃ BỎ HẲN. Đừng vẽ lại nó cho tới khi có OAuth thật: một nút
 * mang logo của người khác, hứa một cách đăng nhập không tồn tại, là dạng nói
 * dối mà người dùng phát hiện ra ngay lần đầu bấm — và sau đó họ có lý do để
 * nghi ngờ mọi thứ khác app này nói (§11).
 *
 * ⚠️ VÀ ĐĂNG NHẬP KHÔNG PHẢI CỬA VÀO APP. Nút quay lại luôn ở đó, mọi đường
 * kiểm tin nhắn chạy được khi chưa đăng nhập. Tài khoản chỉ để nối vòng tròn
 * gia đình và ký xác nhận — xem chú thích đầu `tai-khoan.ts`.
 */
function LoginView({
  setView,
  t,
  lang = 'vi',
  onDangNhapXong,
  userRole,
  setUserRole
}: {
  setView: (v: ViewState) => void;
  t: any;
  lang?: Lang;
  onDangNhapXong: (hs: HoSoTaiKhoan) => void;
  userRole?: 'elder' | 'guardian';
  setUserRole?: (role: 'elder' | 'guardian') => void;
}) {
  const [dangTao, setDangTao] = useState(false);
  const [so, setSo] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [ten, setTen] = useState('');
  const [loading, setLoading] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'elder' | 'guardian'>(userRole || 'elder');

  const gui = async () => {
    setLoi(null);
    if (!so.trim() || !matKhau || (dangTao && !ten.trim())) {
      setLoi('THIEU_THONG_TIN');
      return;
    }
    setLoading(true);
    try {
      const hs = dangTao
        ? await dangKyTaiKhoan(so.trim(), matKhau, ten.trim())
        : await dangNhapTaiKhoan(so.trim(), matKhau);
      onDangNhapXong(hs);
      if (setUserRole) setUserRole(selectedRole);
      setView(selectedRole === 'guardian' ? 'guardian' : 'home');
    } catch (e: any) {
      /*
       * ⚠️ TRA MÃ QUA CATALOG, ĐỪNG HIỆN MÃ THÔ. Máy chủ trả
       * `SAI_SO_HOAC_MAT_KHAU`; bác đọc chuỗi đó không hiểu gì, và nó cũng
       * không phải tiếng Việt. §HĐ luật 2: mã đi trên đường truyền, chữ nằm ở
       * catalog. Mã lạ thì rơi về câu "chưa nối được máy chủ".
       */
      const ma = e?.ma || 'KHONG_GOI_DUOC';
      setLoi(tra(MA_TAI_KHOAN, ma, lang) ? ma : 'KHONG_GOI_DUOC');
    } finally {
      setLoading(false);
    }
  };

  const oNhap = 'w-full min-h-[52px] px-4 rounded-2xl border-2 border-purple-200 bg-white text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7c3aed]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-start overflow-y-auto [&>*]:shrink-0 px-6 pt-14 pb-24"
    >
      <button
        aria-label={t("Quay lại")}
        onClick={() => setView(selectedRole === 'guardian' ? 'guardian' : 'home')}
        className="absolute top-6 left-6 p-2.5 bg-white/70 rounded-full shadow-sm text-[#6d28d9] active:scale-95 transition-all"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="w-16 h-16 mb-2">
        <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
      </div>
      <h2 className="text-[26px] font-black text-[#1e1b4b] mb-1">
        {dangTao ? t("Tạo tài khoản") : t("Đăng nhập")}
      </h2>

      {/*
        ⚠️ NÓI RÕ ĐĂNG NHẬP ĐỂ LÀM GÌ — VÀ KHÔNG ĐỂ LÀM GÌ.
        Người cao tuổi có lý do chính đáng để ngại đưa số điện thoại cho một
        app. Câu này trả lời trước câu hỏi đó, và nó nói đúng sự thật: nội dung
        tin nhắn vẫn nằm trong máy, tài khoản chỉ để nối với người nhà.
      */}
      <p className="text-[15px] text-purple-900/80 font-medium mb-5 text-center max-w-sm leading-relaxed">
        {t("Tài khoản để nối bác với người nhà. Bác kiểm được cả khi chưa đăng nhập.")}
      </p>

      <div className="w-full max-w-sm mb-5 bg-white/70 p-1.5 rounded-[24px] border border-[#e6dcff] shadow-[0_10px_30px_rgba(109,40,217,0.12)] flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedRole('elder')}
          className={`flex-1 min-h-[52px] px-2 sm:px-3 rounded-[20px] font-bold text-[14px] sm:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
            selectedRole === 'elder' ? 'bg-gradient-to-r from-[#b68cf5] via-[#9b6cf0] to-[#7c3aed] text-white shadow-[0_8px_18px_rgba(124,58,237,0.24)]' : 'text-[#321379] hover:bg-[#f4efff]'
          }`}
        >
          <span>👵</span><span>{t("Bác / bố mẹ")}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('guardian')}
          className={`flex-1 min-h-[52px] px-2 sm:px-3 rounded-[20px] font-bold text-[14px] sm:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
            selectedRole === 'guardian' ? 'bg-gradient-to-r from-[#b68cf5] via-[#9b6cf0] to-[#7c3aed] text-white shadow-[0_8px_18px_rgba(124,58,237,0.24)]' : 'text-[#321379] hover:bg-[#f4efff]'
          }`}
        >
          <span>🛡️</span><span>{t("Con cháu")}</span>
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {dangTao && (
          <div>
            <label htmlFor="o-ten" className="text-[14px] font-bold text-[#6d28d9] mb-1 block">{t(selectedRole === 'guardian' ? "Tên của con cháu" : "Tên của bác")}</label>
            <input
              id="o-ten" className={oNhap} value={ten} onChange={(e) => setTen(e.target.value)}
              placeholder={t(selectedRole === 'guardian' ? "Ví dụ: Nguyễn Văn An" : "Ví dụ: Bác Tám")} maxLength={60} autoComplete="name"
            />
          </div>
        )}

        <div>
          <label htmlFor="o-so" className="text-[14px] font-bold text-[#6d28d9] mb-1 block">{t("Số điện thoại")}</label>
          <input
            id="o-so" className={oNhap} value={so} onChange={(e) => setSo(e.target.value)}
            type="tel" inputMode="numeric" placeholder="0912 345 678" autoComplete="tel"
          />
        </div>

        <div>
          <label htmlFor="o-mk" className="text-[14px] font-bold text-[#6d28d9] mb-1 block">{t("Mật khẩu")}</label>
          <input
            id="o-mk" className={oNhap} value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
            type="password" placeholder={t("Ít nhất 6 ký tự")}
            autoComplete={dangTao ? 'new-password' : 'current-password'}
            onKeyDown={(e) => { if (e.key === 'Enter') void gui(); }}
          />
        </div>

        {loi && (
          <div role="alert" className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl">
            <p className="text-[15px] font-bold text-amber-900 leading-snug">
              {tra(MA_TAI_KHOAN, loi, lang) ?? tra(MA_TAI_KHOAN, 'KHONG_GOI_DUOC', lang)}
            </p>
          </div>
        )}

        <button
          onClick={() => void gui()}
          disabled={loading}
          className={`w-full min-h-[56px] px-4 text-white rounded-full font-extrabold text-[17px] shadow-md flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-60 transition-transform ${
            'bg-gradient-to-r from-[#b68cf5] via-[#9b6cf0] to-[#7c3aed] shadow-[0_10px_24px_rgba(124,58,237,0.22)]'
          }`}
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Phone size={20} />{dangTao ? t("Tạo tài khoản") : t("Đăng nhập")}</>}
        </button>

        <button
          onClick={() => { setDangTao(!dangTao); setLoi(null); }}
          className="w-full min-h-[52px] px-4 bg-white border-2 border-purple-200 text-[#6d28d9] rounded-full font-bold text-[15px] active:scale-95 transition-transform"
        >
          {dangTao ? t("Tôi đã có tài khoản") : t("Bác chưa có tài khoản? Tạo mới")}
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
      setFamilyMembers((prev: NguoiThan[]) => [
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
      {/*
        KIỂU CHUNG CỦA APP — LẤY MÀN "GIA ĐÌNH & NGƯỜI THÂN" LÀM CHUẨN (4/9/2026).
        Thẻ và nút mang viền 2,5px + bóng đổ cứng màu tím đậm `#2e1065`, bo góc
        lớn. Ô nhập và nút bấm đều đạt sàn vùng chạm §4.4.
      */}
      <div className="flex items-center mb-6 relative">
        <button aria-label={t("Quay lại")}
          onClick={() => setView('family')}
          className="w-[52px] h-[52px] flex items-center justify-center bg-white rounded-full border-[2.5px] border-[#2e1065] shadow-[3px_3px_0_#2e1065] text-[#6d28d9] active:scale-95 transition-all absolute left-0"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-[20px] font-black text-[#1e1b4b] text-center w-full px-14 leading-snug">{t("Thêm người thân mới")}</h2>
      </div>

      <div className="bg-white rounded-[24px] p-5 border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065] flex flex-col gap-4 max-w-md mx-auto w-full">
        <div>
          <label className="text-[15px] font-bold text-[#6d28d9] mb-1.5 block">{t("Chọn ảnh đại diện")}</label>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {mauAvatar.map((mau, idx) => (
              <button
                key={mau}
                type="button"
                aria-label={`${t("Chọn ảnh đại diện")} ${idx + 1}`}
                onClick={() => setMauDaChon(mau)}
                style={{ backgroundColor: mau }}
                className={`w-[52px] h-[52px] rounded-full shrink-0 transition-all ${mauDaChon === mau ? 'border-[3px] border-[#2e1065] shadow-[3px_3px_0_#2e1065] scale-105' : 'border-[2.5px] border-[#2e1065]/35 opacity-70'}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-[15px] font-bold text-[#6d28d9] mb-1 block">{t("Họ và tên")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
 className="w-full min-h-[52px] bg-[#f8f4ff] rounded-2xl px-4 py-3 text-[#311068] font-bold outline-none border-[2.5px] border-[#2e1065] shadow-[3px_3px_0_#2e1065] focus:border-[#7e22ce] focus:bg-white transition-colors text-[16px]"
            placeholder={t("Ví dụ: Nguyễn Văn An")}
          />
        </div>

        <div>
          <label className="text-[15px] font-bold text-[#6d28d9] mb-1 block">{t("Số điện thoại")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
 className="w-full min-h-[52px] bg-[#f8f4ff] rounded-2xl px-4 py-3 text-[#311068] font-bold outline-none border-[2.5px] border-[#2e1065] shadow-[3px_3px_0_#2e1065] focus:border-[#7e22ce] focus:bg-white transition-colors text-[16px]"
            placeholder={t("Ví dụ: 0988 123 456")}
          />
        </div>

        <div>
          <label className="text-[15px] font-bold text-[#6d28d9] mb-1 block">{t("Mối quan hệ")}</label>
          {/*
            ⚠️ `min-h` CHỨ KHÔNG PHẢI `h` — "Vợ / Chồng" và "Hàng xóm" xuống hai
            dòng ở khổ hẹp (§4.5: tiếng Việt dài hơn ~30%). Đặt chiều cao cứng là
            chữ tràn ra ngoài nút.
          */}
          <div className="grid grid-cols-3 gap-2.5">
            {['Con trai', 'Con gái', 'Cháu', 'Vợ / Chồng', 'Anh em', 'Hàng xóm'].map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => setRelation(rel)}
                className={`min-h-[52px] px-2 py-2 rounded-2xl text-[15px] font-bold border-[2.5px] border-[#2e1065] transition-all active:scale-95 ${relation === rel ? 'bg-[#7e22ce] text-white shadow-[3px_3px_0_#2e1065]' : 'bg-white text-[#4c1d95] hover:bg-purple-50'}`}
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
          className="flex-1 min-h-[56px] bg-white text-[#6d28d9] border-[2.5px] border-[#2e1065] py-3.5 rounded-full font-bold text-[16px] shadow-[4px_4px_0_#2e1065] active:scale-95 transition-transform"
        >
          {t("Hủy")}
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !phone.trim()}
          className="flex-1 min-h-[56px] bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] disabled:opacity-50 text-white py-3.5 rounded-full font-bold text-[16px] border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065] active:scale-95 transition-transform"
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
export function WarningView({
  setView,
  t,
  lang = 'vi',
  result,
  familyMembers,
  noiChayAi,
  mayCoUngDungLa,
  onBaoDaChuyen,
  onHanhDongMoPhong,
}: {
  setView: (v: ViewState) => void,
  t: any,
  lang?: Lang,
  result?: KetQuaPhanTich | null,
  familyMembers?: NguoiThan[],
  /**
   * Ứng dụng đang xem và bấm được thay bác — đọc thẳng từ Android.
   * ⚠️ Dữ liệu này KHÔNG đến từ máy chủ và KHÔNG đi lên máy chủ (§6.9).
   */
  mayCoUngDungLa?: TrangThaiMay | null,
  /** 'cuc_bo' | 'gateway' | 'gemini' | 'khong_chay' — từ /api/suc-khoe. */
  noiChayAi?: string | null,
  /** Bác khai đã chuyển tiền / đọc mã ⇒ gửi lại cho bộ luật chọn màn (việc #2). */
  onBaoDaChuyen?: () => void,
  /** Chỉ màn trình diễn truyền vào: hành động của bác → máy con GIẢ LẬP. */
  onHanhDongMoPhong?: (hanhDong: HanhDong) => void,
}) {
  const nhan: string | undefined = result?.nhan;
  const canThiep: string | undefined = result?.canThiep;
  const khongGoiDuoc = result?.khongGoiDuocMayChu === true;
  const tuBamDung = result?.tuBamDung === true;
  /** Màn trình diễn (`?trinhDien=1`): như diễn tập, nhưng băng báo nói "mô phỏng". */
  const laMoPhong = result?.moPhong === true;
  /**
   * Lượt diễn tập từ "Con cháu cài giúp" (Phần 2): có băng báo, KHÔNG ghi số liệu.
   * ⚠️ Mô phỏng TÍNH LÀ diễn tập — để mọi chặn đã có (không ghi số liệu, không báo
   * máy chủ, không vào đồng hồ phản ứng) tự áp dụng, không phải nhớ thêm chỗ nào.
   */
  const laDienTap = result?.dienTap === true || laMoPhong;
  /** Máy tự bật (Phần 4): đang gọi + mã OTP / vừa cài app. Không phải nhãn rủi ro. */
  const lyDoTuBat = result?.lyDoTuBat ?? null;

  const laCao = nhan === 'CAO';
  const laNghiNgo = nhan === 'NGHI_NGO';
  const laChuaThay = nhan === 'CHUA_THAY';

  /*
   * QUY TẮC NHÀ MÌNH — §4.1 `FAMILY_RULE`.
   *
   * ⚠️ ĐỌC MỘT LẦN LÚC DỰNG MÀN. Màn này có đồng hồ đếm ngược, tức là dựng lại
   * mỗi giây; đọc `localStorage` mỗi giây là tốn vô ích, và tệ hơn, nó cho phép
   * nội dung màn đổi giữa chừng trong lúc bác đang đọc.
   *
   * ⚠️ `chonQuyTac` CHỈ ĐỌC `maLyDo` mà bộ luật đã quyết. Nó không đổi được
   * mức rủi ro, và không được phép đổi (§4.2).
   */
  /*
   * ⚠️ MÔ PHỎNG KHÔNG ĐỌC DỮ LIỆU CỦA MÁY — sửa 23/9/2026, đo trên màn trình diễn:
   * nút gọi hiện SỐ THẬT đã lưu trên máy người trình bày thay vì số hư cấu, vì vòng
   * tròn gia đình ở đây được ưu tiên hơn `familyMembers`. Trình diễn trước hội đồng
   * mà lộ số của người nhà là rò dữ liệu thật. Mô phỏng dùng vòng tròn RỖNG.
   */
  const [vongTronNha] = useState(() => (laMoPhong ? vongTronRong() : docVongTron()));
  const quyTacNha = chonQuyTac(vongTronNha.quyTac, result?.maLyDo ?? []);

  /*
   * ĐỒNG HỒ PHẢN ỨNG — mở phiên đo đúng lúc màn cảnh báo dựng lên.
   *
   * ⚠️ ĐO TỚI LÚC BẤM NÚT GỌI, KHÔNG PHẢI TỚI LÚC NGƯỜI THÂN NGHE MÁY. Trình
   * duyệt chỉ mở ứng dụng gọi rồi hết phần của nó; app không biết có ai nhấc
   * máy hay không, và không được nói như thể nó biết (§11).
   *
   * ⚠️ Mức "Chưa thấy dấu hiệu" KHÔNG mở phiên: không có cảnh báo thì không có
   * phản ứng nào để đo, và đếm nó vào sẽ pha loãng đúng con số cần dùng.
   */
  const [phienDo] = useState(() => batDauDo(nhan ?? null, Date.now()));
  /**
   * Bác đã chọn MỘT hành động bảo vệ chưa (gọi, nhắn, báo đã lỡ chuyển). Dùng để
   * quyết định có leo thang khi hết 60 giây hay không — xem `leoThang` bên dưới.
   */
  const [daHanhDong, setDaHanhDong] = useState(false);
  /** Mã sự kiện báo động gia đình của lượt này (Phần 3) — để báo hành động của bác cho con. */
  const suKienBaoDongRef = useRef<string | null>(null);
  /** Ghi hành động bác chọn sau cảnh báo — xem `lib/ket-qua-can-thiep.ts`. */
  const ghiHanhDong = (hanhDong: HanhDong) => {
    // Trình diễn: chuyển hành động sang máy con giả lập — rồi thoát như diễn tập ngay dưới.
    if (laMoPhong) {
      onHanhDongMoPhong?.(hanhDong);
      if (hanhDong === 'bam_goi_nguoi_than' || hanhDong === 'da_lo_chuyen') setDaHanhDong(true);
    }
    // Diễn tập: bấm gì cũng không ghi — lượt tập mà vào số liệu là làm bẩn tỷ lệ báo động giả (§4.6).
    if (laDienTap) return;
    // Phần 3: con thấy bác đã làm gì (chỉ MÃ), và bậc leo thang tự dừng.
    if (suKienBaoDongRef.current) void guiTrangThaiBaoDong(suKienBaoDongRef.current, hanhDong).catch(() => undefined);
    ghiKetQua({ canThiep: canThiep ?? null, nhan: nhan ?? null, maLyDo: result?.maLyDo ?? [], hanhDong });
    if (hanhDong === 'bam_goi_nguoi_than' || hanhDong === 'da_lo_chuyen') setDaHanhDong(true);
  };
  const ghiNhanBamGoi = () => {
    const luot = ketThucDo(phienDo, Date.now());
    // Diễn tập không vào đồng hồ phản ứng — cùng lý do với `ghiHanhDong`.
    if (luot && !laDienTap) ghiLuot(luot);
    ghiHanhDong('bam_goi_nguoi_than');
  };

  /**
   * §HĐ luật 4 — MÀN theo `canThiep`. Mức `PROTECTED_CRITICAL` bỏ bớt điều hướng
   * và luôn phải có lối ra (§4.6, dưới cùng màn hình).
   */
  const laKhanCap = canThiep === 'PROTECTED_CRITICAL';

  /**
   * ══════ MÀN NÀO ĐANG GẤP — QUYẾT ĐỊNH CÁI GÌ ĐƯỢC PHÉP CHIẾM CHỖ ══════
   *
   * `laKhanCap` chỉ đúng với `PROTECTED_CRITICAL` và nó quyết định CHỮ của lối ra.
   * Nhưng ba màn dưới đây đều là lúc bác đang bị ép và không đọc nổi một trang:
   * mức CAO, lượt bác tự bấm "Dừng 60 giây", và màn PAUSE_60S do bộ luật đưa ra.
   *
   * Đo 19/9/2026 trước khi sửa: màn này có 839 ký tự chữ và 11 đích chạm ở khổ
   * 375px, 16 ở khổ 320px — trong khi người dùng đã báo từ 21/8 rằng 7 cái đã
   * "dễ bị rối", và báo lại 19/9 rằng bấm Khẩn cấp ra "rất rất rất nhiều chữ".
   *
   * Nên ở ba màn đó, mọi thứ KHÔNG phải "gọi người thân" lùi xuống sau "Xem thêm".
   * Không xoá cái nào — chúng vẫn thật và vẫn có lúc cần.
   */
  const manGapGap = laCao || tuBamDung || canThiep === 'PAUSE_60S';

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
  // Mô phỏng: KHÔNG hiện câu nhắc mật khẩu gia đình của máy người trình bày.
  const [matKhauNha] = useState(() => (laMoPhong ? null : docMatKhauGiaDinh()));

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
  const [moThem, setMoThem] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loiDoc, setLoiDoc] = useState<string | null>(null);

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

  /**
   * §16.1 — DỰ BÁO KỊCH BẢN, CHỈ Ở MÀN VERIFY_PATH.
   * Gọi `/api/kich-ban/:hoKichBan` KHÔNG kèm `giaiDoan` — Frontend chưa nối
   * Bộ nhớ vụ việc (§6.11) nên không biết bác đang ở giai đoạn nào; máy chủ tự
   * lấy giai đoạn sớm nhất, đúng như route đã ghi: "thà dự báo thừa một bước đã
   * qua còn hơn giấu bước sắp tới". Hàm nguồn là hàm thuần, không gì để hỏng
   * ngoài mạng — lỗi mạng thì khối này lặng lẽ không hiện, không phải lỗi cần
   * báo (đây là phần thêm, không phải kết quả phân tích).
   */
  const canVerify = canThiep === 'VERIFY_PATH';
  const hoKichBanHienTai: string | null = result?.hoKichBan ?? null;
  const [duBao, setDuBao] = useState<Array<{ maBuoc: string }>>([]);
  useEffect(() => {
    if (!canVerify || !hoKichBanHienTai) { setDuBao([]); return; }
    let huy = false;
    fetch(api(`/api/kich-ban/${encodeURIComponent(hoKichBanHienTai)}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!huy && Array.isArray(d?.buoc)) setDuBao(d.buoc); })
      .catch(() => { /* mất mạng ⇒ khối dự báo không hiện, không phải lỗi */ });
    return () => { huy = true; };
  }, [canVerify, hoKichBanHienTai]);
  const cauDuBao = traNhieu(MA_BUOC, duBao.map((b) => b.maBuoc), lang);

  /**
   * §2B.5 — BẢO VỆ 72 GIỜ.
   * Hiện khi bộ luật đã gán `canThiep: 'RECOVERY'`, HOẶC bác tự bấm nút "Tôi đã
   * lỡ..." bên dưới — giống hệt lý do `tuBamDung` tồn tại cho PAUSE_60S (§HĐ
   * luật 4: đây là màn, không phải một kết quả phân tích mới).
   */
  /*
   * ⚠️ KHỞI TẠO TỪ KẾT QUẢ, không từ `false`. Bấm "đã lỡ chuyển" sẽ gửi lại cho
   * bộ luật; nếu có override thì màn vẫn là PROTECTED_CRITICAL (đúng — đang bị
   * tấn công gấp hơn đã mất tiền), và khối phục hồi KHÔNG được biến mất chỉ vì
   * lượt phân tích mới dựng lại màn.
   */
  const [daBamPhucHoi, setDaBamPhucHoi] = useState(result?.trangThaiNguoiDung === 'da_chuyen_hoac_doc_ma');
  /**
   * Việc an toàn tiếp theo — MỘT việc theo kịch bản (xem `lib/viec-an-toan-tiep-theo.ts`).
   * Chỉ đọc MÃ bộ luật đã trả; không đổi `nhan`, không đổi `canThiep`.
   */
  const viecAnToan = chonViecAnToan({
    maLyDo: result?.maLyDo, hoKichBan: result?.hoKichBan ?? null,
    canThiep: canThiep ?? null, nhan: nhan ?? null, daLoChuyen: daBamPhucHoi,
  });
  /** Chỉ thay câu khi việc KHÁC mặc định — mặc định giữ đúng câu cũ của từng mức. */
  const cauViecRieng = viecAnToan && viecAnToan !== 'cup_may_goi_nguoi_than' ? CAU_VIEC_AN_TOAN[viecAnToan] : null;
  /** Khối các bước phục hồi — GẤP mặc định, xem chú thích ở khối đó. */
  const [moBuocPhucHoi, setMoBuocPhucHoi] = useState(false);
  /** Bác đã khai lỡ chuyển, hoặc bộ luật đã chọn màn phục hồi. */
  const dangPhucHoi = daBamPhucHoi || canThiep === 'RECOVERY';

  /*
   * ═════ LEO THANG TRONG CÙNG MỘT LƯỢT — thêm 22/9/2026 (việc #3) ═════
   *
   * Trước hôm nay hết 60 giây thì vòng đếm chỉ BIẾN MẤT. Không có gì xảy ra tiếp:
   * bác vẫn ở đúng màn đó, với đúng những lựa chọn đó, như thể khoảng dừng
   * chưa từng có. Khoảng dừng mà không dẫn tới đâu thì chỉ là một cái đồng hồ.
   *
   * Nay: hết 60 giây mà CHƯA có hành động bảo vệ nào (gọi, nhắn, báo đã lỡ
   * chuyển) thì bậc tiếp theo mở ra — đưa người thân vào quyết định. Kẻ lừa đảo
   * cần bác ở một mình với họ; bậc này phá đúng chỗ đó.
   *
   * ⚠️ LEO THANG LÀ ĐỔI MÀN, KHÔNG PHẢI TỰ LÀM THAY. Không tự gọi, không tự nhắn,
   * không tự báo ai — §12 cấm "tự bật auto-alert thay chủ tài khoản". Tự báo chỉ
   * có khi CHÍNH chủ tài khoản đã đặt quy tắc từ trước (`canh-bao-hai-phia.js`).
   * ⚠️ LỐI RA VẪN NGUYÊN (§4.6). Bậc này không che, không khoá "Tôi ổn".
   * ⚠️ KHÔNG áp cho người đã lỡ chuyển: với họ việc tiếp theo là gọi ngân hàng,
   * không phải thêm một lời nhắc đừng chuyển.
   */
  const coKhoangDung = initialTime > 0 && (laCao || tuBamDung || canThiep === 'PAUSE_60S' || canThiep === 'PROTECTED_CRITICAL');
  const leoThang = coKhoangDung && timeLeft === 0 && !daHanhDong && !daBamPhucHoi;
  /** Danh sách số tổng đài ngân hàng mở tại chỗ — chung cho màn xác minh và màn 72 giờ. */
  const [moSoNganHang, setMoSoNganHang] = useState(false);
  const canRecovery = canThiep === 'RECOVERY' || daBamPhucHoi;
  const [keHoachPhucHoi, setKeHoachPhucHoi] = useState<any>(null);
  useEffect(() => {
    if (!canRecovery) return;
    let huy = false;
    // VN — sản phẩm nói tiếng Việt, xưng "bác"/"cháu"; §2B.5 hiện chỉ duyệt VN + GLOBAL.
    fetch(api('/api/ke-hoach-phuc-hoi?nuoc=VN'))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!huy && d) setKeHoachPhucHoi(d); })
      .catch(() => { /* §4.3 — mất mạng thì khối dưới tự ẩn vì vẫn null, không giả kết quả */ });
    return () => { huy = true; };
  }, [canRecovery]);

  /*
   * BẮT ĐẦU THEO DÕI 72 GIỜ — ngay khi màn phục hồi hiện ra.
   * Đang theo dõi thì GIỮ mốc cũ (xem `batDauTheoDoi`). Bản Android hẹn thêm lời
   * nhắc ở các mốc giờ; bản web không có gì để hẹn và hàm trả `null` êm.
   */
  useEffect(() => {
    if (!canRecovery) return;
    const batDau = batDauTheoDoi(Date.now());
    void henNhacTheoDoi72Gio({ batDau, ...chuNhac72Gio(lang) });
  }, [canRecovery, lang]);
  const buocPhucHoi = keHoachPhucHoi ? traNhieu(BUOC_PHUC_HOI, keHoachPhucHoi.buoc ?? [], lang) : [];
  const canhBaoPhucHoi = keHoachPhucHoi ? traNhieu(CANH_BAO_PHUC_HOI, keHoachPhucHoi.canhBao ?? [], lang) : [];
  /**
   * §4.5 / distill — 12 BƯỚC LÀ QUÁ NHIỀU ĐỂ ĐỌC HẾT LÚC ĐANG HOẢNG.
   * Không bớt NỘI DUNG (mọi bước vẫn còn, xem được khi bấm) — chỉ giấu bớt
   * LÚC ĐẦU. Bốn bước đầu của `BUOC_CHUNG` đã xếp theo độ khẩn cấp giảm dần
   * (ngừng liên lạc → đừng chuyển thêm → gọi ngân hàng đúng số → tra soát),
   * nên cắt ở đây không làm mất bước quan trọng nhất.
   */
  const [hienHetBuocPhucHoi, setHienHetBuocPhucHoi] = useState(false);
  const SO_BUOC_PHUC_HOI_DAU = 4;
  const buocPhucHoiHien = hienHetBuocPhucHoi ? buocPhucHoi : buocPhucHoi.slice(0, SO_BUOC_PHUC_HOI_DAU);
  const soBuocPhucHoiConLai = Math.max(0, buocPhucHoi.length - SO_BUOC_PHUC_HOI_DAU);

  // Nhãn NGUYÊN VĂN §4.1, tra từ catalog. Không có nhãn thứ tư.
  const nhanChu = nhan ? tra(NHAN, nhan, lang) : null;
  const lyDo = traNhieu(MA_LY_DO, result?.maLyDo ?? [], lang);
  /** Màn gấp chỉ để ba dòng lý do; phần còn lại nằm dưới nếp gấp "Xem thêm". */
  const lyDoHien = manGapGap ? lyDo.slice(0, 3) : lyDo.slice(0, 8);
  const lyDoConLai = manGapGap ? lyDo.slice(3, 8) : [];

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

  /*
   * ⚠️ ĐI QUA `docTo()`, KHÔNG GỌI THẮNG `speechSynthesis`.
   *
   * Trong WebView của Android, `speechSynthesis` hỏng IM LẶNG: ở vài bản thì
   * `'speechSynthesis' in window` vẫn true, `speak()` vẫn trả về, chỉ là không
   * phát ra tiếng nào. Câu kiểm ở dòng đầu bản cũ vì thế KHÔNG bắt được ca
   * này — nó chỉ bắt được ca API vắng hẳn.
   *
   * `docTo()` dùng bộ đọc của máy trên APK và của trình duyệt trên web, rồi
   * trả về có đọc được hay không — để màn hình nói ra thay vì để bác ngồi
   * chờ một giọng nói không bao giờ tới (§4.3).
   */
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      void dungDocTo();
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

    setIsSpeaking(true);
    setLoiDoc(null);
    void docTo(`${phanDau} ${phanKhuyen}${phanChuaKiem}`, isEn ? 'en-US' : 'vi-VN')
      .then((kq) => {
        setIsSpeaking(false);
        // §4.3 — không đọc được thì NÓI RA. Im lặng ở đây là tệ nhất: bác
        // bấm nút, không nghe thấy gì, và không biết là máy thiếu giọng hay
        // mình bấm sai.
        if (!kq.ok) setLoiDoc(kq.ma || 'DOC_HONG');
      });
  };

  /**
   * ⚠️ MÀU CHỈ LÀ PHỤ (§4.4) — chữ và biểu tượng mới là chính. Người cao tuổi có
   * tỉ lệ mù màu cao, nên không mức nào được phân biệt CHỈ bằng màu.
   *
   * `#b91c1c` chứ không `#dc2626`: chữ trắng trên `#dc2626` chỉ đạt 4,53:1, sát
   * mép sàn 4,5:1 và trượt ngay khi ai đó chỉnh sáng lên.
   */
  /*
   * ⚠️ LƯỢT BÁC TỰ BẤM "DỪNG 60 GIÂY" DÙNG NỀN ĐỎ — VÀ ĐÂY LÀ CHỦ Ý, KHÔNG PHẢI
   * NHẦM VỚI NHÃN "NGUY HIỂM CAO".
   *
   * Màn này KHÔNG hiện nhãn rủi ro nào: tiêu đề là "Bác dừng lại 60 giây đã",
   * không phải "Nguy hiểm cao". Đỏ ở đây đọc là DỪNG LẠI, không đọc là "đã kết
   * luận nguy hiểm" — và nó nối liền với tấm thẻ đỏ ở Menu tác vụ mà bác vừa bấm
   * để tới đây. Nền tím trước đó nhìn như một màn thông tin, đúng lúc cần nhất
   * thì không có sức dừng ai lại.
   *
   * ⚠️ ĐỪNG SUY NGƯỢC: có nền đỏ KHÔNG có nghĩa là được phép hiện nhãn "Nguy
   * hiểm cao" ở đây. Nhãn đến từ bộ luật (§4.2), không đến từ màu.
   */
  const bgColor = (laCao || (tuBamDung && !nhan))
    ? 'from-[#b91c1c] to-[#7f1d1d]'
    : laNghiNgo
      ? 'from-[#b45309] to-[#78350f]'
      : laChuaThay
        ? 'from-[#047857] to-[#064e3b]'
        : 'from-[#4c1d95] to-[#2e1065]';

  /**
   * ⚠️ ĐỌC PHẦN TỬ ĐẦU QUA `?.[0]`, RỒI MỚI DỰ PHÒNG.
   *
   * `noUncheckedIndexedAccess` đang bật, nên `familyMembers[0]` mang kiểu
   * `NguoiThan | undefined` kể cả khi vừa kiểm `length > 0` — và tsc nói đúng:
   * mảng thưa thì `length` không hứa phần tử nào tồn tại. Viết như dưới thì cả
   * hai nhánh đều chắc chắn có `name` và `phone`, nên phần còn lại của màn
   * không phải đoán.
   *
   * Đây là cùng loại lỗi đã làm chết Menu tác vụ ngày 4/9/2026 — chỗ đó đọc
   * thẳng thuộc tính của một giá trị có thể `null`. Khai kiểu thật cho
   * `familyMembers` (thay cho `any[]`) là thứ khiến trình biên dịch chỉ ra
   * được cả hai.
   */
  /*
   * ĐỘI PHẢN ỨNG NHANH — nút gọi trỏ vào ĐÚNG NGƯỜI cho tình huống này.
   *
   * Máy có ứng dụng lạ đang xem và bấm thay, hoặc bị đòi cài ứng dụng → người
   * rành điện thoại lên trước. Bác đã lỡ chuyển tiền → người lo ngân hàng lên
   * trước. Chưa lập đội thì giữ hành vi cũ: người đầu danh sách.
   *
   * ⚠️ KHÔNG TỰ QUAY SỐ, KHÔNG TỰ CHUYỂN SANG NGƯỜI KẾ. Người dùng chốt 17/9/2026
   * bỏ hẳn hướng gọi tự động. "Không gọi được thì gọi …" là một nút BÁC bấm.
   */
  const tinhHuongNay = tinhHuongGoi({
    maLyDo: result?.maLyDo ?? [],
    coUngDungDangNgo: dangNgo.length > 0,
    dangPhucHoi: canRecovery,
  });
  const dsGoi = thuTuGoi(vongTronNha, tinhHuongNay);
  const nguoiGoiDau = dsGoi[0];
  const nguoiGoiTiep = dsGoi[1] ?? null;
  const vaiNguoiDau = nguoiGoiDau
    && vongTronNha.doi.find((d) => d.nguoiThanId === nguoiGoiDau.id)?.vaiTro.includes(vaiChoTinhHuong(tinhHuongNay))
    ? nhanVai(vaiChoTinhHuong(tinhHuongNay), lang)
    : null;
  const nguoiDauTien = nguoiGoiDau
    ? { name: nguoiGoiDau.ten, phone: nguoiGoiDau.dienThoai }
    : familyMembers?.[0];
  const firstContact: { name: string; phone: string } =
    nguoiDauTien ?? { name: t('Người thân'), phone: '' };

  /**
   * ══════ MÀN GẤP: MỘT CÂU, MỘT NÚT — 23/9/2026 (Phần 1 "Cầu dao gia đình") ══════
   *
   * Người dùng báo: "trong trường hợp hoảng loạn mà cho 1 đống chữ thì ai thèm
   * đọc". Đo 375×812 ở PROTECTED_CRITICAL: nút gọi con ở y=716–805, giữa màn là
   * khối "CHƯA kiểm được" 25px, và máy chỉ đọc to khi bác bấm.
   *
   * Nay ở màn gấp: nhãn → CÂU LỆNH ≤ 8 chữ → NÚT CHÍNH, ngay nửa trên màn, và máy
   * tự đọc câu lệnh. Mọi khối chữ khác (dòng AI, lý do, "chưa kiểm được" — VẪN
   * cùng cỡ với nhãn, §HĐ luật 3) nằm DƯỚI nút.
   *
   * ⚠️ Luồng phục hồi (`dangPhucHoi`) và màn mất mạng giữ bố cục cũ: ở đó việc
   * chính là gọi ngân hàng / nói thật là chưa kiểm được, không phải gọi con.
   */
  const heroGap = manGapGap && !khongGoiDuoc && !dangPhucHoi;
  const cauLenh = lyDoTuBat ? CAU_LENH_TU_BAT[lyDoTuBat] : cauLenhNgan(viecAnToan, Boolean(firstContact.phone));
  /** Đã bấm gọi người thân trong lượt này ⇒ hỏi "Con bảo sao?". */
  const [daBamGoi, setDaBamGoi] = useState(false);
  /** Trả lời sau cuộc gọi. `null` = chưa trả lời. */
  const [conBao, setConBao] = useState<'lua_dao' | null>(null);
  const cauTuDoc = heroGap
    ? `${tuBamDung ? t('Bác dừng lại 60 giây đã') : (nhanChu ?? '')}. ${t(cauLenh)}`
    : '';
  /*
   * LỜI NHẮN BẰNG GIỌNG CỦA CON (Phần 2) — có thì PHÁT LỜI NHẮN thay giọng máy.
   * Đợi đọc xong IndexedDB (`daTai`) rồi mới chọn, để không đọc giọng máy rồi
   * phát chồng lời nhắn lên một giây sau.
   */
  const loiNhan = useLoiNhanCon();
  // Mô phỏng: không phát lời nhắn giọng thật đã ghi trên máy người trình bày.
  const coLoiNhan = !laMoPhong && Boolean(loiNhan.url);
  usePhatMotLan(loiNhan.url, heroGap && loiNhan.daTai && coLoiNhan);
  useDocToMotLan(cauTuDoc, heroGap && loiNhan.daTai && !coLoiNhan, lang === 'en' ? 'en-US' : 'vi-VN',
    () => setIsSpeaking(true), () => setIsSpeaking(false));

  /*
   * ══════ BÁO CHO CON — Phần 3 (23/9/2026) ══════
   * Mức CAO + bác đã đăng nhập ⇒ gửi MÃ lên máy chủ. Máy chủ CHỈ gửi khi chính bác
   * đã bật quy tắc (Phần 2, §12); tắt thì trả `CHUA_BAT_QUY_TAC` và màn không nói gì.
   * ⚠️ ĐÚNG MỘT LẦN mỗi lượt — cờ ref, vì StrictMode chạy effect hai lần ở dev.
   * ⚠️ Diễn tập và mất mạng không gửi.
   */
  const [baoDong, setBaoDong] = useState<PhanHoiBaoDong | null>(null);
  const daGuiBaoDongRef = useRef(false);
  useEffect(() => {
    // Phần 4: máy tự bật cũng báo — loại sự kiện riêng, máy chủ kiểm quy tắc thứ hai.
    const loaiBaoDong = laCao ? 'ket_qua_kiem' : lyDoTuBat;
    if (daGuiBaoDongRef.current || !loaiBaoDong || laDienTap || khongGoiDuoc || !docPhienTaiKhoan()) return;
    daGuiBaoDongRef.current = true;
    void guiBaoDong({ loaiSuKien: loaiBaoDong, nhan: laCao ? 'CAO' : undefined, hoKichBan: hoKichBanHienTai })
      .then((kq) => { suKienBaoDongRef.current = kq.suKienId ?? null; setBaoDong(kq); })
      .catch(() => { /* không mạng / phiên hết: màn vẫn chạy, không hiện dòng trạng thái nào */ });
  }, []);
  const cauBaoDong = baoDong?.gui && baoDong.ketQua ? cauTrangThaiBao(baoDong.ketQua, t) : '';

  const handleCallRelative = () => {
    if (!firstContact.phone) { setView('family'); return; }
    // Ghi TRƯỚC khi mở ứng dụng gọi: sau `window.open` trang có thể bị đẩy
    // xuống nền và mã sau đó không chắc chạy.
    ghiNhanBamGoi();
    setDaBamGoi(true);
    // Trình diễn: KHÔNG BAO GIỜ quay số thật — máy con giả lập đổ chuông thay.
    if (laMoPhong) return;
    // Phần 4: APK gọi thẳng một chạm (nếu bác đã cho quyền); web mở `tel:` như cũ.
    goiDienThoai(firstContact.phone);
  };

  /**
   * HAI SỐ THẬT CHO HÀNG "LIÊN HỆ KHẨN CẤP" — lấy từ `so-khan-cap.ts`, ĐÃ QUA
   * DUYỆT (xem chú thích đầu tệp đó), không bịa số nào ở đây. Đổi theo `lang`
   * vì bộ số tiếng Anh là số của US/UK/AU..., không phải bản dịch của 113/156.
   */
  const soKhanCap = EMERGENCY_NUMBERS[lang === 'en' ? 'en' : 'vi'];
  const soCongAn = soKhanCap.find((s) => s.id === 'vn-police' || s.id === 'us-911');
  const soBaoLuaDao = soKhanCap.find((s) => s.id === 'vn-spam-scam' || s.id === 'us-ftc');

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
    setDaHanhDong(true);
    const nhanTin = nhanChu ?? (lang === 'en' ? 'needs checking' : 'cần kiểm lại');
    const text = lang === 'en'
      ? `[Khoan Đã] I just got something that Khoan Đã marked: ${nhanTin}. Please call me back.`
      : `[Khoan Đã] Bố/mẹ vừa nhận được một nội dung, Khoan Đã ghi là: ${nhanTin}. Con gọi lại cho bố/mẹ nhé.`;
    window.open(`sms:${firstContact.phone}?body=${encodeURIComponent(text)}`, '_self');
  };

  /** Nút gọi người thân — MỘT định nghĩa, hai chỗ đặt (màn gấp: trên cùng; màn thường: cuối). */
  const nutGoiChinh = (
    <button
      onClick={handleCallRelative}
      data-vai-tro="nut-chinh"
      className={`w-full ${heroGap ? 'min-h-[80px] text-[20px]' : 'text-[17px]'} py-4 px-4 rounded-[22px] font-black bg-amber-300 text-amber-950 shadow-[0_10px_28px_rgba(245,158,11,0.35)] border-2 border-amber-200 flex flex-col items-center justify-center gap-0.5 active:scale-98 transition-all hover:brightness-105`}
    >
      <span className="flex items-center gap-2">
        {firstContact.phone ? <PhoneCall size={heroGap ? 26 : 22} /> : <UserPlus size={22} />}
        <span>{firstContact.phone
          ? (viecAnToan === 'goi_so_cu_nguoi_than' ? t('GỌI SỐ ĐÃ LƯU CỦA CON CHÁU') : t('GỌI NGAY CHO CON CHÁU'))
          : t('Chưa có số người thân — bấm để thêm')}</span>
      </span>
      {firstContact.phone && (
        <span className="text-[16px] font-bold text-[#6b3a05]">
          {firstContact.name} ({firstContact.phone}){vaiNguoiDau ? ` · ${vaiNguoiDau}` : ''}
        </span>
      )}
    </button>
  );

  /** ⚠️ "Soạn tin", KHÔNG phải "đã gửi" — §11. Chưa có số thì không bày ra. */
  const nutNhanTin = firstContact.phone ? (
    <button
      onClick={handleSendSos}
      className="w-full min-h-[56px] py-3 px-3 rounded-[22px] font-black text-[16px] bg-white text-slate-900 shadow-md border-2 border-white/60 flex items-center justify-center gap-2 active:scale-98 transition-all hover:bg-slate-50"
    >
      <MessageSquare size={18} className="text-slate-700" />
      <span>{viecAnToan === 'khong_cai_gui_nguoi_than' ? t('Gửi cho con cháu xem trước') : t('Soạn tin nhắn cho con cháu')}</span>
    </button>
  ) : null;

  /**
   * NÚT CHÍNH CỦA MÀN GẤP. Có số người thân → gọi người thân. Chưa có → Cảnh sát
   * 113 (số đã duyệt ở `so-khan-cap.ts`), KHÔNG mở biểu mẫu giữa lúc bị giục.
   * 156 là tổng đài PHẢN ÁNH, không cứu được tiền lúc đó — nó nằm trong "Xem thêm".
   */
  const nutHanhDongGap = firstContact.phone || !soCongAn ? nutGoiChinh : (
    <a
      href={`tel:${soCongAn.cleanPhone}`}
      data-vai-tro="nut-chinh"
      className="w-full min-h-[80px] py-4 px-4 rounded-[22px] font-black text-[20px] bg-amber-300 text-amber-950 shadow-[0_10px_28px_rgba(245,158,11,0.35)] border-2 border-amber-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
    >
      <ShieldCheck size={26} className="shrink-0" />
      <span>{t('Gọi')} {soCongAn.name}</span>
    </a>
  );

  /**
   * ══════ TRÌNH ĐỌC MÀN HÌNH PHẢI BIẾT MÀN NÀY VỪA HIỆN RA — 19/9/2026 ══════
   *
   * Trước đó màn kết quả gắn vào DOM như một `div` thường: không `role`, không
   * `aria-modal`, không dời tiêu điểm. Người dùng TalkBack bấm "Kiểm tra ngay"
   * rồi KHÔNG NGHE THẤY GÌ — tiêu điểm vẫn nằm trên cái nút giờ đã bị một lớp phủ
   * che, và vuốt tiếp thì đi vào màn cũ nằm vô hình phía dưới.
   *
   * Đây là màn DUY NHẤT trong app thật sự khẩn cấp, nên nó cũng là chỗ im lặng
   * đắt nhất. `role="alertdialog"` để trình đọc công bố ngay, `aria-labelledby`
   * trỏ vào chính nhãn rủi ro, và tiêu điểm nhảy vào nhãn đó khi màn mở ra.
   *
   * ⚠️ `tabIndex={-1}` trên tiêu đề là BẮT BUỘC để `.focus()` ăn — thẻ `h1` không
   * tự nhận tiêu điểm. Mẫu đã có sẵn trong repo ở `CanhBaoToanManHinh.tsx`.
   */
  const oNhan = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    oNhan.current?.focus();
  }, []);

  return (
    <motion.div
      animate={{ scale: 1 }}
      initial={{ scale: 0.98 }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="khoan-da-nhan-rui-ro"
      className={`absolute inset-0 z-[100] bg-gradient-to-b ${bgColor} flex flex-col items-center justify-between px-5 py-6 overflow-y-auto`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-20%] w-96 h-96 bg-white/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-96 h-96 bg-black/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Header */}
      <div className={`flex flex-col items-center z-10 w-full mt-1 max-w-md shrink-0 ${loiDoc ? 'mb-2' : ''}`}>
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

        {/*
          §4.3 — BẤM MÀ KHÔNG NGHE THẤY GÌ THÌ PHẢI BIẾT VÌ SAO.
          Ba nguyên nhân khác hẳn nhau, và gộp chúng thành im lặng là để bác
          tưởng mình bấm sai: máy không có bộ đọc, máy có nhưng thiếu giọng
          tiếng Việt, hoặc bộ đọc báo lỗi.
        */}
        {loiDoc && (
          <div className="w-full max-w-md px-4 mt-2">
            <p className="text-[14px] text-amber-100 bg-amber-900/40 border border-amber-300/40 rounded-2xl px-3 py-2 leading-snug">
              {loiDoc === 'MAY_CHUA_CO_GIONG'
                ? t('Máy bác chưa có giọng đọc tiếng Việt. Bác vào Cài đặt › Ngôn ngữ để tải thêm nhé.')
                : loiDoc === 'MAY_KHONG_CO_BO_DOC'
                  ? t('Máy này chưa có bộ đọc chữ. Các phần khác vẫn dùng bình thường.')
                  : t('Cháu chưa đọc được đoạn này. Bác thử lại giúp cháu.')}
            </p>
          </div>
        )}
      </div>

      {/* Center Main Card & Explanations */}
      <div className={`flex flex-col items-center z-10 w-full max-w-md shrink-0 ${loiDoc ? 'mt-2' : 'my-auto'}`}>
        {/* PHẦN 2 — lượt diễn tập phải nói rõ là diễn tập, trước mọi chữ khác. */}
        {laDienTap && (
          <p role="status" className="w-full mb-2 rounded-2xl bg-white text-[#7f1d1d] border-2 border-white px-3 py-2 text-[18px] font-black text-center leading-snug">
            {laMoPhong ? t('MÔ PHỎNG — màn thật của app, cuộc gọi là giả lập.') : t('ĐÂY LÀ DIỄN TẬP — không có gì nguy hiểm.')}
          </p>
        )}
        {/* NHÃN — nguyên văn §4.1 */}
        <h1
          id="khoan-da-nhan-rui-ro"
          ref={oNhan}
          tabIndex={-1}
          className="text-[25px] font-black text-white text-center leading-tight mb-1 drop-shadow-sm tracking-tight outline-none"
        >
          {/*
            ⚠️ BÁC ĐÃ KHAI LỠ CHUYỂN THÌ TIÊU ĐỀ NÓI VỀ VIỆC ĐÓ — thêm 22/9/2026.
            Đo trên màn thật: "Tôi lỡ chuyển 5 triệu cho người lạ rồi" là một LỜI
            KỂ, không có dấu hiệu lừa nào trong chữ, nên nhãn ra "Chưa thấy dấu
            hiệu rủi ro" — đúng về TIN NHẮN. Nhưng đặt ngay trên dòng "gọi ngân
            hàng khoá giao dịch", người vừa mất tiền đọc nhãn đó như một lời trấn
            an. Cùng tiền lệ với lượt tự bấm dừng: màn đang nói về trạng thái bác
            tự khai thì tiêu đề nói trạng thái đó.
            ⚠️ CHỈ THAY KHI NHÃN KHÔNG PHẢI CAO. "Nguy hiểm cao" vừa đúng vừa gấp
            hơn — bác vừa mất tiền VÀ đang bị tấn công tiếp — nên giữ nguyên.
            Frontend không tự đặt nhãn (§4.2): đây là tiêu đề trạng thái, không
            phải một mức rủi ro mới.
          */}
          {khongGoiDuoc
            ? t('Chưa gửi đi kiểm được')
            : tuBamDung
              ? t('Bác dừng lại 60 giây đã')
              : dangPhucHoi && !laCao
                ? t('Mình lo việc đã chuyển tiền trước')
                : (nhanChu ?? t('Chưa có kết quả'))}
        </h1>
        {/*
          ⚠️ LƯỢT BÁC TỰ BẤM "DỪNG 60 GIÂY" KHÔNG CÓ DÒNG NÀY — sửa 19/9/2026.
          Ở đó tiêu đề đã là "Bác dừng lại 60 giây đã" và khối ngay dưới đã nói
          "Cảm giác phải làm ngay là do họ tạo ra." Thêm "Bác thở một hơi…" nữa là
          ba câu cùng một ý trên một màn mà người đọc đang bị ép thời gian.
          Các mức còn lại giữ nguyên: ở đó câu này mang thông tin khác nhãn.
        */}
        {/*
          ⚠️ MÀN GẤP: CÂU LỆNH + NÚT CHÍNH NGAY DƯỚI NHÃN — 23/9/2026. Xem chú thích
          ở `heroGap`. Câu lệnh là bản ≤ 8 chữ (`cauLenhNgan`), không phải câu dài
          của `CAU_VIEC_AN_TOAN`; câu dài vẫn dùng ở các màn không gấp bên dưới.
          "Con bảo sao?" hiện ngay khi bác bấm gọi — bác quay lại app là thấy, không
          phụ thuộc máy có báo được "đã quay lại" hay không.
        */}
        {heroGap ? (
          <>
            <p data-vai-tro="cau-lenh" className="text-[30px] leading-tight font-black text-white text-center mb-4 max-w-sm">
              {t(cauLenh)}
            </p>
            <div className="w-full flex flex-col gap-2 mb-3">
              {nutHanhDongGap}
              {/*
                ══════ CÂU ĐỂ BÁC NÓI VỚI NGƯỜI GỌI — thêm 23/9/2026 ══════
                Nhiều người cao tuổi KHÔNG DÁM cúp máy với người xưng công an: cúp ngang
                là "vô lễ", là "chống người thi hành công vụ". Một câu nói sẵn cho bác
                lối ra lịch sự — và câu này nhắc tới con, đúng thứ kẻ gian dặn bác giấu.
                ⚠️ Dạng ĐIỀU KIỆN ("đang nghe máy thì…"): màn này cũng mở từ tin nhắn bác
                tự dán vào, lúc đó không có ai ở đầu dây.
                ⚠️ Đứng DƯỚI nút gọi — hành động trước, chữ sau (test thứ tự màn gấp).
              */}
              <div data-vai-tro="cau-noi-voi-nguoi-goi" className="w-full rounded-[18px] bg-black/30 border-2 border-white/30 px-4 py-3 text-center">
                <p className="text-[15px] font-bold text-white/85 leading-snug">{t('Đang nghe máy thì nói:')}</p>
                <p className="text-[21px] font-black text-white leading-snug">“{t('Để tôi hỏi con rồi gọi lại.')}”</p>
              </div>
              {/*
                Tiền vừa ra trong lúc gọi ⇒ một lối THẲNG vào các bước phục hồi. App không
                biết khoản đó có phải do bị lừa không — bác nói, không phải app đoán (§4.2).
              */}
              {lyDoTuBat === 'tien_ra_trong_cuoc_goi' && !canRecovery && (
                <button
                  type="button"
                  onClick={() => { ghiHanhDong('da_lo_chuyen'); setDaBamPhucHoi(true); onBaoDaChuyen?.(); }}
                  className="w-full min-h-[56px] rounded-[18px] bg-white text-slate-900 font-black text-[17px] px-3 leading-snug"
                >
                  {t('Tôi vừa chuyển theo lời người gọi')}
                </button>
              )}
              {coLoiNhan && loiNhan.url && (
                <button
                  type="button"
                  onClick={() => { void new Audio(loiNhan.url as string).play().catch(() => undefined); }}
                  className="w-full min-h-[52px] rounded-[18px] bg-white/15 text-white border-2 border-white/40 font-bold text-[16px] px-3 leading-snug flex items-center justify-center gap-2"
                >
                  <Volume2 size={18} className="shrink-0" /> {t('Nghe lại lời nhắn của con')}
                </button>
              )}
              {daBamGoi && conBao === null && (
                <div role="group" aria-labelledby="con-bao-sao" className="w-full bg-black/35 border-2 border-white/40 rounded-[22px] p-3 flex flex-col gap-2">
                  <p id="con-bao-sao" className="text-[18px] font-black text-white text-center leading-snug">{t('Gọi xong rồi? Con bảo sao?')}</p>
                  <button
                    type="button"
                    onClick={() => { ghiHanhDong('con_bao_lua_dao'); setConBao('lua_dao'); }}
                    className="w-full min-h-[56px] rounded-[18px] bg-white text-[#7f1d1d] font-black text-[17px] px-3 leading-snug"
                  >
                    {t('Con bảo là lừa đảo')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { ghiHanhDong('con_bao_khong_sao'); setView('home'); }}
                    className="w-full min-h-[56px] rounded-[18px] bg-white/15 text-white border-2 border-white/40 font-bold text-[16px] px-3 leading-snug"
                  >
                    {t('Con bảo không sao')}
                  </button>
                </div>
              )}
              {conBao === 'lua_dao' && (
                <div role="status" className="w-full bg-black/35 border-2 border-white/40 rounded-[22px] p-3 flex flex-col gap-2">
                  <p className="text-[22px] font-black text-white text-center leading-snug">{t('Không nghe máy số đó nữa.')}</p>
                  {!canRecovery && (
                    <button
                      type="button"
                      onClick={() => { ghiHanhDong('da_lo_chuyen'); setDaBamPhucHoi(true); onBaoDaChuyen?.(); }}
                      className="w-full min-h-[56px] rounded-[18px] bg-white text-slate-900 font-black text-[16px] px-3 leading-snug"
                    >
                      {t('Tôi đã lỡ chuyển tiền hoặc đọc mã rồi')}
                    </button>
                  )}
                </div>
              )}
              {leoThang && (
                <div role="status" aria-live="polite" className="w-full bg-black/35 rounded-[18px] px-3 py-2 text-center">
                  <p className="text-[17px] font-black text-white leading-snug">{t('Đã qua 60 giây.')}</p>
                  <p className="text-[16px] font-bold text-white/95 leading-snug">
                    {firstContact.phone ? t('Trước khi làm gì tiếp, bác gọi con cháu một câu đã.') : t('Trước khi làm gì tiếp, bác gọi hỏi thật đã.')}
                  </p>
                </div>
              )}
              {!leoThang && timeLeft > 0 && (
                <p className="text-[15px] font-bold text-white/85 text-center tabular-nums">
                  {t('Còn {n} giây').replace('{n}', String(timeLeft))}
                </p>
              )}
              {/* Phần 3 — MỘT dòng, nói đúng điều máy chủ biết; không bao giờ "con đã thấy" (§11). */}
              {cauBaoDong && (
                <p role="status" className="text-[15px] font-bold text-white/90 text-center leading-snug">{cauBaoDong}</p>
              )}
            </div>
          </>
        ) : !tuBamDung && (
          <p className="text-[16px] font-semibold text-white/95 mb-4 text-center leading-snug max-w-sm">
            {khongGoiDuoc
              ? t('Mạng không đi được nên chưa có gì được kiểm cả.')
              : cauViecRieng
                ? t(cauViecRieng)
              : laCao
                ? t('Bác đừng chuyển tiền, đừng đọc mã nào.')
                : laNghiNgo
                  ? t('Bác hỏi lại người thân trước khi làm gì tiếp.')
                  : laChuaThay
                    ? t('Chưa thấy dấu hiệu rõ ràng. Bác vẫn đừng đọc mã cho ai.')
                    : t('Bác thở một hơi. Không có gì gấp tới mức không chờ được một phút.')}
          </p>
        )}

        {/*
          §4.1 — DÒNG GIẢI THÍCH BẮT BUỘC.

          Đây là chỗ DUY NHẤT người dùng nhìn thấy kiến trúc của sản phẩm: model
          chỉ bật cờ, bộ luật mới ra mức. Thiếu nó thì toàn bộ lập luận "AI không
          được quyết định" chỉ tồn tại trong tài liệu, không tồn tại trên màn
          hình — và một người mở app ra sẽ thấy đúng thứ ngược lại.

          CÓ ĐIỀU KIỆN, và điều kiện là phần quan trọng: `aiDaChay === false`
          nghĩa là lượt này KHÔNG có model nào chạy. Nói "AI đã trích ra các dấu
          hiệu" lúc đó là một câu sai, và §11 cấm gán việc cho model chưa hề được
          gọi. Trường hợp ấy `chuaKiem` đã mang sẵn `ai_khong_chay` để nói thay.
        */}
        {!khongGoiDuoc && result?.aiDaChay === true ? (
          laChuaThay ? (
            <details className="w-full max-w-sm mb-3 rounded-2xl border border-white/20 bg-black/15 px-3 py-2 text-white/90">
              <summary className="cursor-pointer text-[14px] font-bold text-center">{t('Xem cách kiểm tra')}</summary>
              <p className="mt-2 text-[14px] leading-snug text-center">
                {t('AI đã trích ra các dấu hiệu. Mức rủi ro là do bộ luật cố định quyết định.')}
              </p>
            </details>
          ) : (
            <p className="text-[14px] text-white/85 mb-4 text-center leading-snug max-w-sm">
              {t('AI đã trích ra các dấu hiệu. Mức rủi ro là do bộ luật cố định quyết định.')}
            </p>
          )
        ) : null}

        {/*
          THẺ TRUNG TÂM — biểu tượng + vòng đếm ngược trong một khối kính mờ, nổi
          trên nền gradient + hai quầng mờ đã có sẵn phía trên (không đổi bgColor).
          Vòng chỉ là cách trình bày khác của `timeLeft` đã chạy sẵn — không phải
          đồng hồ thứ hai; bar tuyến tính cũ ở cuối màn được bỏ, dồn hết vào đây.
        */}
        {/*
          ⚠️ LUỒNG PHỤC HỒI KHÔNG CÓ KHỐI NÀY — sửa 22/9/2026.
          Đo trên màn thật: người đã khai lỡ chuyển tiền vẫn thấy hình tam giác
          và vòng "Dừng 60 giây" (144px), đẩy nút gọi người thân xuống y=751 trên
          màn cao 812. Tệ hơn chuyện chỗ: "dừng lại 60 giây" nghĩa là CHỜ, trong
          khi với người vừa mất tiền việc cần làm là gọi ngân hàng NGAY — mỗi phút
          chậm là thêm một phút tiền có thể bị rút tiếp. Khoảng dừng là công cụ
          TRƯỚC hành động tài chính, không phải sau.
        */}
        <div
          className={`w-full rounded-[28px] ${laChuaThay ? 'p-3 mb-2' : 'p-5 mb-3'} relative overflow-hidden border border-white/25 ${dangPhucHoi || heroGap ? 'hidden' : ''}`}
          style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))' }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3 min-[360px]:gap-6">
            {/*
              ⚠️ HÌNH NÀY KHÔNG ĐƯỢC MANG MÀU RIÊNG.
              Bản trước là cái khiên tô đặc, và khi màn không có nhãn rủi ro
              (lượt bác tự bấm "Dừng 60 giây") nó rơi vào màu tím `#5b21b6` —
              một mảng tím chọi giữa nền đỏ, không ăn nhập với gì cả. Nay hình
              vẽ chỉ dùng TRẮNG, để nền phía sau nói lên mức; §4.4 vốn đã yêu
              cầu màu chỉ là phụ, chữ và biểu tượng mới là chính.

              Tam giác + chấm than là hình cảnh báo ai cũng đọc được, kể cả khi
              không phân biệt được màu. Riêng mức "Chưa thấy dấu hiệu" thì
              KHÔNG dùng tam giác (nó nói "có cảnh báo") và cũng KHÔNG dùng dấu
              tích ✓ — dấu tích đọc là "xong rồi, ổn rồi", đúng thứ §4.1 cấm
              hứa. Dùng vòng tròn với dấu chấm hỏi: đã xem, chưa kết luận được.
            */}
            <div className={`relative ${laChuaThay ? 'w-20 h-20' : 'w-24 h-24'} flex items-center justify-center shrink-0`}>
              <svg className="w-full h-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] relative z-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {(laCao || laNghiNgo || (!nhan && !laChuaThay)) ? (
                  <>
                    <path
                      d="M100 22 L186 172 a14 14 0 0 1 -12 21 H26 a14 14 0 0 1 -12 -21 Z"
                      fill="none" stroke="white" strokeWidth="14" strokeLinejoin="round"
                    />
                    <path d="M100 84V132" stroke="white" strokeWidth="17" strokeLinecap="round" />
                    <circle cx="100" cy="163" r="10" fill="white" />
                  </>
                ) : (
                  <>
                    <circle cx="100" cy="100" r="82" fill="none" stroke="white" strokeWidth="14" />
                    <path d="M76 82c0-13 11-24 24-24s24 11 24 24c0 17-24 14-24 33" stroke="white" strokeWidth="15" strokeLinecap="round" fill="none" />
                    <circle cx="100" cy="147" r="10" fill="white" />
                  </>
                )}
              </svg>
            </div>

            {/*
              ⚠️ BẬC LEO THANG "ĐÃ QUA 60 GIÂY" ĐÃ DỜI LÊN NGAY DƯỚI NÚT CHÍNH CỦA MÀN
              GẤP — 23/9/2026. Mọi lúc `leoThang` đúng thì `heroGap` cũng đúng, và
              thẻ này bị ẩn ở màn gấp; để khối đó ở đây là để nó không bao giờ hiện.
            */}
            {timeLeft > 0 && (
              <div className="relative w-[112px] h-[112px] flex items-center justify-center shrink-0">
                <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="9" />
                  <circle
                    cx="56" cy="56" r="48" fill="none" stroke="#fcd34d" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - timeLeft / Math.max(initialTime, 1))}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-[32px] font-black text-white leading-none tabular-nums">{timeLeft}</span>
                  <span className="text-[14px] font-bold text-white/80 -mt-0.5">{t('giây')}</span>
                </div>
              </div>
            )}
          </div>
          {/*
            ⚠️ ĐÃ BỎ DÒNG "Chưa làm gì vội. Đếm ngược rồi tính tiếp." — 19/9/2026.
            Vòng đếm ngược nằm ngay trên nó đã nói đúng điều đó bằng hình. Người
            dùng báo màn khẩn cấp "rất rất nhiều chữ"; chữ đầu tiên phải bỏ là
            chữ lặp lại thứ mắt đã thấy.
          */}
        </div>

        {/*
          KHỐI QUY TẮC NHÀ MÌNH — đặt DƯỚI nhãn rủi ro, TRÊN các nút hành động.
          Bác không cãi lại một cái máy; bác nhớ ra lời đã hẹn với con mình.

          ⚠️ KHÔNG hiện ở mức "Chưa thấy dấu hiệu" — `duocHienQuyTac` chặn. Nhắc
          một quy tắc an toàn ngay dưới dòng đó là tự tạo ra một cảnh báo mà bộ
          luật không hề đưa ra.
        */}
        {duocHienQuyTac(nhan) && quyTacNha && (
          <KhoiQuyTac
            quyTac={quyTacNha}
            lang={lang}
            nguoiThan={vongTronNha.nguoiThan}
            onGoi={(dienThoai) => { ghiNhanBamGoi(); window.open(`tel:${dienThoai}`, '_self'); }}
          />
        )}

        {/*
          PAUSE_60S — một câu công nhận cảm xúc, không phải thêm áp lực.
          ⚠️ CHỈ HIỆN Ở ĐÚNG MÀN NÀY (canThiep), không theo nhãn (§HĐ luật 4).
        */}
        {/*
          ⚠️ RÚT NGẮN 19/9/2026 — giữ Ý, bỏ CHỮ.
          Câu cũ 105 ký tự ("…không có nghĩa là bác chậm hay ngốc") đọc rất ấm khi
          ngồi đọc bình tĩnh, nhưng người đang bị ép không đọc hết một đoạn văn.
          Vế thứ hai an ủi cho cảm giác *sau khi đã dừng*; vế thứ nhất mới là thứ
          giúp bác dừng. Giữ vế thứ nhất.
        */}
        {/*
          ⚠️ ẨN KHI ĐANG CÓ NÚT GỌI TO Ở TRÊN (heroGap) — 23/9/2026. Người dùng: "nhiều
          chữ". Câu lệnh ngắn ở trên đã nói việc phải làm; câu này và ba bước bên dưới
          nhắc lại đúng câu lệnh đó. Khi không có hero (không gọi được ai, đang phục hồi)
          thì chúng vẫn hiện như cũ.
        */}
        {canThiep === 'PAUSE_60S' && !heroGap && (
          <div className="w-full bg-black/30 border border-white/20 rounded-[22px] px-4 py-3 mb-2 backdrop-blur-md">
            <p className="text-white font-semibold text-[17px] leading-snug text-center">
              {t('Cảm giác phải làm ngay là do họ tạo ra.')}
            </p>
          </div>
        )}

        {/*
          BA VIỆC NÊN LÀM NGAY — cụ thể hoá lời khuyên ở trên thành từng bước rời
          rạc, dễ theo khi đang hoảng. Chỉ là hướng dẫn: app không tự dừng cuộc
          gọi hay chặn giao dịch nào thay bác (§12) — ba dòng này nói bác nên làm
          gì, không phải app đã làm gì. Làm việc nào trước cũng được.

          ⚠️ ĐÃ BỎ DÒNG THỨ TƯ "Gọi cho con cháu" — 19/9/2026. Nút vàng to nhất
          màn, cách đó chưa tới một màn hình, CHÍNH LÀ việc đó. Viết nó ra thành
          một dòng chữ nữa là bắt bác đọc một thứ rồi mới thấy đúng thứ ấy dưới
          dạng nút.
        */}
        {canThiep === 'PAUSE_60S' && !heroGap && (
          <div className="w-full bg-white/12 border border-white/20 rounded-[22px] backdrop-blur-md mb-2 overflow-hidden">
            {[
              { icon: PhoneOff, text: t('Dừng cuộc gọi') },
              { icon: Wallet, text: t('Không chuyển tiền') },
              { icon: Lock, text: t('Không đọc mã OTP') },
            ].map((muc, i) => (
              <div key={muc.text} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/15' : ''}`}>
                <span className="w-7 h-7 rounded-full bg-white/20 text-white text-[14px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <muc.icon size={20} className="text-white/90 shrink-0" />
                <span className="text-white font-bold text-[15px] leading-snug">{muc.text}</span>
              </div>
            ))}
          </div>
        )}

        {/*
          Lý do — tra từ MÃ, §HĐ luật 2.

          ⚠️ MÀN GẤP CHỈ ĐỂ BA DÒNG. Đo 19/9/2026 trên kịch bản giả danh công
          an: sáu dòng lý do chiếm 264px, góp phần đẩy nút gọi xuống quá đáy
          màn. Ba dòng đầu đã đủ nói "vì sao máy báo động"; phần còn lại không
          bị xoá, nó nằm dưới "Xem thêm" ngay bên dưới. Ở các mức khác vẫn tám
          dòng như cũ.
        */}
        {lyDoHien.length > 0 && (
          laChuaThay ? (
            <details className="w-full mb-2 rounded-2xl border border-white/20 bg-black/15 px-3 py-2 text-white/90">
              <summary className="cursor-pointer text-[14px] font-bold text-center">{t('Xem dấu hiệu đã nhận diện')}</summary>
              <ul className="mt-2 flex flex-col gap-1.5">
                {lyDoHien.map((cau) => (
                  <li key={cau} className="px-3 py-2 bg-black/25 rounded-2xl text-white font-semibold text-[14px] border border-white/15 flex items-start gap-2 leading-snug">
                    <AlertTriangle size={16} className="text-amber-300 shrink-0 mt-0.5" />
                    <span>{cau}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <ul className="w-full flex flex-col gap-1.5 mb-2">
              {lyDoHien.map((cau) => (
                <li key={cau} className="px-3.5 py-2 bg-black/30 rounded-2xl text-white font-semibold text-[16px] border border-white/15 flex items-start gap-2 backdrop-blur-xs leading-snug">
                  <AlertTriangle size={18} className="text-amber-300 shrink-0 mt-0.5" />
                  <span>{cau}</span>
                </li>
              ))}
            </ul>
          )
        )}

        {/*
          CẢNH BÁO CHÍNH THỨC — Ra-đa. Đặt ngay dưới lý do: lý do nói máy thấy
          gì trong tin nhắn, khối này nói công an / cơ quan nhà nước đã cảnh báo
          kiểu lừa giống vậy, kèm đường dẫn .gov.vn để bác tự mở.
          ⚠️ Chỉ gửi MÃ lên máy chủ. Tự ẩn ở mức "Chưa thấy dấu hiệu", khi lỗi
          mạng, và khi không có cảnh báo đã duyệt nào khớp.
        */}
        {/*
          ⚠️ Ở MÀN GẤP, KHỐI NÀY LÙI XUỐNG SAU "Xem thêm" — đo 19/9/2026: nó đẩy
          nút "GỌI NGAY CHO CON CHÁU" xuống y=1308 trên màn cao 812, tức bác
          đang hoảng phải cuộn 742px mới thấy việc duy nhất cần làm. Nó là bằng
          chứng thật và không bị xoá; nó chỉ không được đứng trước hành động.
          Ở các mức khác (Nghi ngờ / đường xác minh) nó vẫn hiện thẳng như cũ,
          vì ở đó bằng chứng CHÍNH LÀ việc cần làm: đọc rồi tự xác minh.
        */}
        {!manGapGap && (
          <CanhBaoChinhThuc
            nhan={nhan ?? null}
            hoKichBan={hoKichBanHienTai}
            maLyDo={result?.maLyDo ?? []}
            lang={lang}
          />
        )}

        {/*
          §16.1 — DỰ BÁO KỊCH BẢN. Chỉ ở VERIFY_PATH: đây là màn "đang nghi
          ngờ, cần xác minh", đúng lúc bác cần biết bước TIẾP THEO có thể là gì
          để tự nhận ra nếu nó xảy ra thật.
          ⚠️ Khung câu "Họ thường…", không phải "Họ sẽ…" (§11) — đã cố định ở
          catalog, không sửa ở đây.
        */}
        {canVerify && cauDuBao.length > 0 && (
          <div className="w-full bg-sky-950/55 border-2 border-sky-300/60 rounded-[22px] backdrop-blur-md mb-2 overflow-hidden">
            <div className="flex items-start gap-2 px-4 pt-4">
              <AlertTriangle size={20} className="text-sky-200 shrink-0 mt-0.5" />
              <h3 className="text-white font-black text-[17px] leading-snug">{KHUNG_KICH_BAN[lang]}</h3>
            </div>
            <div className="mt-2">
              {cauDuBao.map((cau, i) => (
                <div key={cau} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-white/15' : ''}`}>
                  <span className="w-7 h-7 rounded-full bg-white/20 text-white text-[14px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-white font-semibold text-[15px] leading-snug">{cau}</span>
                </div>
              ))}
            </div>
            <p className="text-sky-50 text-[14px] leading-relaxed px-4 pb-4 pt-1">{KET_KICH_BAN[lang]}</p>
          </div>
        )}

        {/*
          VERIFY_PATH — hành động xác minh CÓ THỂ BẤM NGAY, không chỉ lời
          khuyên chung. Đầu số 156: đường dây quốc gia miễn phí nhận báo cáo
          cuộc gọi/tin nhắn nghi lừa đảo. "Soạn tin", KHÔNG "đã gửi" (§11) —
          bác đọc lại rồi tự bấm gửi.
          ⚠️ KHÔNG dựng danh bạ số hotline ngân hàng ở đây — số nào cũng phải
          qua sổ tổ chức đã xác minh (`verified-institution-registry.js`),
          không phải mã cứng trong giao diện.
        */}
        {canVerify && (
          <div className="w-full bg-black/30 border border-white/20 rounded-2xl p-4 backdrop-blur-md mb-2">
            <p className="text-white font-semibold text-[15px] leading-relaxed mb-3">
              {t('Đừng gọi lại đúng số vừa gọi cho bác. Bác tự bấm số đã lưu sẵn trong máy, hoặc số in ở mặt sau thẻ ngân hàng.')}
            </p>
            <button
              onClick={() => {
                const noiDung = lang === 'en'
                  ? 'I received a call or message I suspect is a scam. Please advise.'
                  : 'Tôi vừa nhận được một cuộc gọi hoặc tin nhắn nghi là lừa đảo, xin được hướng dẫn.';
                window.open(`sms:156?body=${encodeURIComponent(noiDung)}`, '_self');
              }}
              className="w-full min-h-[52px] px-4 bg-white/90 hover:bg-white active:scale-95 text-slate-900 font-extrabold rounded-2xl text-[16px] transition-all"
            >
              {t('Soạn tin báo cáo tới đầu số 156')}
            </button>

            {/*
              SỐ TỔNG ĐÀI NGÂN HÀNG — mở ngay tại chỗ, không rời màn cảnh báo.
              Câu dặn phía trên bảo bác "bấm số đã lưu sẵn": đây là nơi số đó nằm.
            */}
            <button
              type="button"
              aria-expanded={moSoNganHang}
              onClick={() => setMoSoNganHang((x) => !x)}
              className="w-full mt-2 min-h-[52px] px-4 bg-black/25 hover:bg-black/35 text-white font-bold rounded-2xl text-[15px] border border-white/30 flex items-center justify-center gap-2 transition-all"
            >
              <Landmark size={18} className="shrink-0" />
              {tra(SO_NGAN_HANG, moSoNganHang ? 'DONG_DANH_SACH' : 'MO_DANH_SACH', lang)}
            </button>
            {moSoNganHang && (
              <div className="mt-3">
                <DanhSachSoNganHang lang={lang} kieu="toi" />
              </div>
            )}
          </div>
        )}

        {/*
          §HĐ luật 3 — CÙNG CỠ CHỮ VỚI NHÃN, KHÔNG PHẢI CHÚ THÍCH NHỎ.
          "Không kiểm được" KHÁC "đã kiểm, không thấy gì" (§4.3). Khối này là chỗ
          duy nhất trên màn nói ra giới hạn của lượt kiểm — nó không được nhỏ hơn,
          mờ hơn, hay nằm dưới nếp gấp.

          ⚠️ 25px, ĐÚNG BẰNG NHÃN Ở DÒNG `text-[25px]` PHÍA TRÊN — sửa 19/9/2026.
          Trước đó khối này là 16px trong khi nhãn là 25px: nhỏ hơn 36%, tức là
          chú thích chứ không phải lời khai. Chú thích ngay trên đây viết "không
          được nhỏ hơn" từ đầu; mã thì làm ngược lại suốt và không test nào bắt
          được vì `test/unchecked-not-safe.test.js` chỉ đọc phía máy chủ.
          Hàng rào mới: `test/chua-kiem-duoc-bang-co-nhan.test.js`.
        */}
        {chuaKiem.length > 0 && (
          <div className="w-full bg-black/45 border-2 border-white/40 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <EyeOff size={24} className="text-white shrink-0" />
              <span className="text-[25px] font-black text-white leading-tight">
                {t('Những thứ cháu CHƯA kiểm được')}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {chuaKiem.map((cau) => (
                <li key={cau} className="text-[25px] text-white font-medium leading-tight">• {cau}</li>
              ))}
            </ul>
          </div>
        )}

        {/*
          §2B.5 — BẢO VỆ 72 GIỜ. Hiện khi `canThiep` là RECOVERY (do bộ luật
          gán, hiếm) HOẶC bác tự bấm "Tôi đã lỡ..." bên dưới.
          ⚠️ §11 — KHÔNG hứa lấy lại được tiền. `KHUNG_PHUC_HOI`/`BUOC_PHUC_HOI`
          đã viết theo đúng khung "làm TĂNG khả năng xử lý" ở catalog — không
          thêm chữ ở đây.
        */}
        {/*
          ═════ GẤP LẠI THÀNH MỘT NÚT — người dùng báo 22/9/2026 ═════

          "Trong lúc khẩn cấp thế bạn cho người già đọc hết một đống thế à."
          Đúng: khối này dựng ĐẦY ĐỦ ngay từ đầu — tiêu đề khung, "giờ vàng", bốn
          bước, "xem thêm 8 bước", hai dòng lưu ý, hai nút — và nó nằm TRÊN nút
          gọi người thân. Người vừa mất tiền phải đọc qua cả trang mới tới việc
          làm được.

          Trong khi việc DUY NHẤT cần làm ngay đã nằm ở câu lệnh chính trên cùng:
          "Bác gọi ngay số in sau thẻ ngân hàng để khoá giao dịch." Mười hai bước
          kia là việc của SAU cuộc gọi đó.

          ⚠️ GẤP, KHÔNG XOÁ. Một chạm là thấy đủ — bước, lưu ý, danh bạ, hồ sơ vụ
          việc. Không ai mất gì; chỉ là thứ tự: hành động trước, danh sách sau.
          ⚠️ §11 — khi mở ra vẫn là đúng khung "làm TĂNG khả năng xử lý".
        */}
        {canRecovery && keHoachPhucHoi && !moBuocPhucHoi && (
          <button
            type="button"
            aria-expanded={false}
            onClick={() => setMoBuocPhucHoi(true)}
            className="w-full min-h-[56px] mb-2 px-4 py-3 rounded-[22px] bg-rose-950/55 border-2 border-rose-300/60 text-white font-bold text-[16px] leading-snug flex items-center justify-center gap-2"
          >
            <FileText size={18} className="shrink-0" />
            <span>{t('Gọi ngân hàng xong rồi? Xem việc tiếp theo')}</span>
          </button>
        )}
        {canRecovery && keHoachPhucHoi && moBuocPhucHoi && (
          <div className="w-full bg-rose-950/55 border-2 border-rose-300/60 rounded-[22px] backdrop-blur-md mb-2 overflow-hidden">
            <div className="flex items-start gap-2 px-4 pt-4">
              <AlertTriangle size={20} className="text-rose-200 shrink-0 mt-0.5" />
              <h3 className="text-white font-black text-[17px] leading-snug">{KHUNG_PHUC_HOI[lang]}</h3>
            </div>
            {typeof keHoachPhucHoi.gioVang === 'number' && (
              <p className="text-rose-50 text-[14px] font-semibold px-4 pt-2">
                {t('Giờ vàng còn tính:')} {keHoachPhucHoi.gioVang} {t('giờ đầu là lúc quan trọng nhất')}
              </p>
            )}
            {buocPhucHoiHien.length > 0 && (
              <div className={`mt-2 ${(hienHetBuocPhucHoi || soBuocPhucHoiConLai === 0) && canhBaoPhucHoi.length === 0 ? 'pb-2' : ''}`}>
                {buocPhucHoiHien.map((cau, i) => (
                  <div key={cau} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-white/15' : ''}`}>
                    <span className="w-7 h-7 rounded-full bg-white/20 text-white text-[14px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-white font-semibold text-[15px] leading-snug">{cau}</span>
                  </div>
                ))}
              </div>
            )}
            {/*
              §4.5 / distill — GIẤU BỚT, KHÔNG XOÁ. Bấm là thấy hết ngay, không
              phải xin phép hay tải thêm gì — chỉ là ẩn bớt để lúc đầu bớt rối.
            */}
            {!hienHetBuocPhucHoi && soBuocPhucHoiConLai > 0 && (
              <button
                onClick={() => setHienHetBuocPhucHoi(true)}
                className="w-full min-h-[52px] px-4 py-2.5 border-t border-white/15 text-rose-100 font-bold text-[15px] hover:bg-white/10 active:scale-[0.99] transition-all text-center"
              >
                {t('Xem thêm')} {soBuocPhucHoiConLai} {t('bước nữa')}
              </button>
            )}
            {canhBaoPhucHoi.length > 0 && (
              <ul className="flex flex-col gap-1 px-4 pb-4 pt-2">
                {canhBaoPhucHoi.map((cau) => (
                  <li key={cau} className="text-rose-100/90 text-[14px] leading-snug">· {cau}</li>
                ))}
              </ul>
            )}

            {/*
              SAU KHI LỠ CHUYỂN TIỀN, HAI THỨ CẦN NGAY: số ngân hàng thật để gọi
              khoá tài khoản, và một tờ hồ sơ để đọc cho tổng đài. Cả hai đều mở
              được từ đây, không phải đi tìm trong Cài đặt.
            */}
            <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
              <button
                type="button"
                aria-expanded={moSoNganHang}
                onClick={() => setMoSoNganHang((x) => !x)}
                className="w-full min-h-[52px] px-4 bg-white text-slate-900 font-extrabold rounded-2xl text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Landmark size={18} className="shrink-0" />
                {tra(SO_NGAN_HANG, moSoNganHang ? 'DONG_DANH_SACH' : 'MO_DANH_SACH', lang)}
              </button>
              {moSoNganHang && <DanhSachSoNganHang lang={lang} kieu="toi" />}
              <button
                type="button"
                onClick={() => setView('ho_so_vu_viec')}
                className="w-full min-h-[52px] px-4 bg-black/25 hover:bg-black/35 text-white font-bold rounded-2xl text-[15px] border border-white/30 flex items-center justify-center gap-2 transition-all"
              >
                <FileText size={18} className="shrink-0" />
                {tra(MAN_HO_SO, 'TIEU_DE', lang)}
              </button>
            </div>
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

          ⚠️ VÀ KHÔNG HIỆN Ở LƯỢT BÁC TỰ BẤM "DỪNG 60 GIÂY" — sửa 19/9/2026.
          Lượt đó KHÔNG có nội dung nào được gửi đi kiểm, nên câu "Nội dung được
          gửi tới máy chủ AI để đọc" nói về một việc chưa xảy ra. Cùng họ với các
          câu §11 cấm: khai một việc chưa hề diễn ra. Nó cũng là chữ thừa trên
          đúng màn cần ít chữ nhất.
        */}
        {/*
          ⚠️ Ở MÀN GẤP NÓ CŨNG LÙI XUỐNG SAU "Xem thêm" — sửa 19/9/2026. Đây là
          câu nói NƠI AI chạy, không phải câu nói kết luận có thể sai (câu đó là
          khối "chưa kiểm được" ngay trên, và khối đó ở lại). Chỗ công bố chính
          của nó là màn nhập liệu, TRƯỚC khi bác gõ gì; ở màn kết quả nó là bản
          nhắc lại. Đo được nó cùng hai khối khác đẩy nút gọi xuống dưới đáy
          màn — mà thứ tự đúng là: hành động trước, bản nhắc lại sau.
        */}
        {!manGapGap && !tuBamDung && noiChayAi && tra(NOI_CHAY_AI, noiChayAi, lang) && (
          laChuaThay ? (
            <details className="w-full mt-2 rounded-2xl border border-white/20 bg-black/15 px-3 py-2 text-white/90">
              <summary className="cursor-pointer text-[14px] font-bold text-center">{t('Xem thông tin kiểm tra')}</summary>
              <p className="mt-2 text-[14px] font-semibold leading-snug text-center">
                {noiChayAi.startsWith('tren_may') ? '🔒 ' : ''}{tra(NOI_CHAY_AI, noiChayAi, lang)}
              </p>
            </details>
          ) : (
            <div className={`w-full mt-2 rounded-2xl px-3.5 py-2.5 border-2 ${
              noiChayAi.startsWith('tren_may') ? 'bg-black/35 border-emerald-300/70' : 'bg-black/35 border-white/30'
            }`}>
              <p className="text-[14px] font-bold text-white leading-snug">
                {noiChayAi.startsWith('tren_may') ? '🔒 ' : ''}{tra(NOI_CHAY_AI, noiChayAi, lang)}
              </p>
            </div>
          )
        )}
      </div>

      {/* Action Buttons Optimized for Elderly */}
      <div className="w-full max-w-md z-10 flex flex-col items-center gap-2.5 mt-auto pt-2">
        {/*
          ══════ NÚT CHÍNH — MỘT VIỆC, VÀ NÓ PHẢI LÀM ĐÚNG THỨ NÓ HỨA ══════

          ⚠️ CHƯA CÓ SỐ NGƯỜI THÂN THÌ ĐỪNG HỨA "GỌI NGAY" — sửa 19/9/2026.
          Trước đó nút vàng to nhất màn ghi "GỌI NGAY CHO CON CHÁU", và khi bác
          chưa thêm ai, bấm vào nó mở ra màn Gia đình TRỐNG — một biểu mẫu, giữa
          lúc kẻ gian đang giục. Nút không được hứa một việc rồi làm việc khác.

          Lúc đó hai số THẬT đã duyệt (113 · 156) lên làm nút chính: có số bấm
          được ngay còn hơn một cái form. Chúng đến từ `so-khan-cap.ts`, không
          phải số bịa cho đẹp bố cục.
        */}
        {!heroGap && !firstContact.phone && (soCongAn || soBaoLuaDao) && (
          <div className="w-full grid grid-cols-2 gap-2">
            {soCongAn && (
              <a
                href={`tel:${soCongAn.cleanPhone}`}
                className="min-h-[72px] rounded-[22px] bg-white text-slate-900 border-2 border-white/60 shadow-md px-3 py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <ShieldCheck size={22} className="text-slate-800 shrink-0" />
                <span className="text-[16px] font-black leading-tight text-center">{soCongAn.name}</span>
              </a>
            )}
            {soBaoLuaDao && (
              <a
                href={`tel:${soBaoLuaDao.cleanPhone}`}
                className="min-h-[72px] rounded-[22px] bg-white text-slate-900 border-2 border-white/60 shadow-md px-3 py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <PhoneOff size={22} className="text-slate-800 shrink-0" />
                <span className="text-[16px] font-black leading-tight text-center">{soBaoLuaDao.name}</span>
              </a>
            )}
          </div>
        )}

        {/* Màn gấp: nút chính đã nằm ngay dưới nhãn (`nutHanhDongGap`), nút soạn
            tin nằm trong "Xem thêm". Màn thường giữ chỗ cũ. */}
        {!heroGap && nutGoiChinh}
        {!heroGap && nutNhanTin}

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
        {/*
          ═════ GIẤU BẮT BỘC — MÀN KHẨN CẤP CHỈ ĐƯỢC CÓ MỘT VIỆC ═════

          Người dùng báo 21/8/2026: "lúc nguy hiểm cao, bạn cho quá nhiều tác vụ
          bên trong đó, quá nhiều phần phải chọn, phải thao tác… dễ bị rối".

          Đếm được 7 phần tử bấm được trên một màn hình dành cho người đang
          bị thúc chuyển tiền. Mỗi lựa chọn thêm là một giây chần chừ, mà giây
          chần chừ là thứ kẻ lừa đang đếm ngược cùng bác.

          ⚠️ KHÔNG XOÁ, CHỈ XẾP LẠI. Mật khẩu gia đình và cảnh báo ứng dụng lạ
          đều là thứ thật và có lúc cần. Chúng chỉ không được đứng ngang hàng
          với việc duy nhất cần làm ngay: GỌI CHO CON CHÁU.

          ⚠️ KHỐI "CHƯA KIỂM ĐƯỢC" KHÔNG NẰM TRONG ĐÂY. §HĐ luật 3 buộc nó
          hiện cùng cỡ chữ với nhãn, tức không được nằm dưới nếp gấp. Giấu nó
          đi cho gọn là đổi một màn rối lấy một màn nói thiếu sự thật.
        */}
        {manGapGap && (
          <button
            onClick={() => setMoThem((v) => !v)}
            aria-expanded={moThem}
            className="w-full min-h-[52px] py-2.5 px-3 rounded-2xl text-[15px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md active:scale-98 transition-all flex items-center justify-center gap-1.5 mb-2"
          >
            <span>{moThem ? t('Ẩn bớt') : t('Xem thêm')}</span>
            <ChevronRight size={16} className={moThem ? 'rotate-90 transition-transform' : 'transition-transform'} />
          </button>
        )}

        {/*
          ⚠️ NẾP GẤP CHỈ TỒN TẠI Ở MÀN KHẨN CẤP — nút "Xem thêm" chỉ hiện khi
          `laKhanCap` (mức CAO, hoặc lượt bác tự bấm Dừng 60 giây). Khối ứng dụng
          lạ bên dưới hiện ở MỌI mức; gói nó bằng `moThem` trần thì ở mức Nghi ngờ
          nó không bao giờ mở ra được, vì không có nút nào để mở.

          19/9/2026: nếp gấp mở rộng sang cả hàng nút phụ ở cuối màn — xem chú
          thích ở khối "LIÊN HỆ KHẨN CẤP".
        */}
        {(moThem || !manGapGap) && (<>
        {manGapGap && !tuBamDung && noiChayAi && tra(NOI_CHAY_AI, noiChayAi, lang) && (
          <div className={`w-full mb-2 rounded-2xl px-3.5 py-2.5 border-2 ${
            noiChayAi.startsWith('tren_may') ? 'bg-black/35 border-emerald-300/70' : 'bg-black/35 border-white/30'
          }`}>
            <p className="text-[14px] font-bold text-white leading-snug">
              {noiChayAi.startsWith('tren_may') ? '🔒 ' : ''}{tra(NOI_CHAY_AI, noiChayAi, lang)}
            </p>
          </div>
        )}
        {lyDoConLai.length > 0 && (
          <ul className="w-full flex flex-col gap-1.5 mb-2">
            {lyDoConLai.map((cau) => (
              <li key={cau} className="px-3.5 py-2 bg-black/30 rounded-2xl text-white font-semibold text-[16px] border border-white/15 flex items-start gap-2 leading-snug">
                <AlertTriangle size={18} className="text-amber-300 shrink-0 mt-0.5" />
                <span>{cau}</span>
              </li>
            ))}
          </ul>
        )}
        {manGapGap && (
          <CanhBaoChinhThuc
            nhan={nhan ?? null}
            hoKichBan={hoKichBanHienTai}
            maLyDo={result?.maLyDo ?? []}
            lang={lang}
          />
        )}
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
                  className="w-full min-h-[52px] px-4 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-[#04301f] font-extrabold rounded-2xl text-[16px] transition-all"
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
                <li key={u.goi} className="px-3 py-2 bg-black/35 rounded-2xl border border-white/15">
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
                className="w-full min-h-[52px] px-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-[#3b1f00] font-extrabold rounded-2xl text-[16px] transition-all"
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
                className="w-full min-h-[52px] px-4 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold rounded-2xl text-[15px] border border-white/25 transition-all"
              >
                {tra(TRANG_THAI_MAY, 'nut_tu_cai', lang)}
              </button>
            </div>
          </div>
        )}

        </>)}

        {/*
          ══════ VIỆC PHỤ — NẰM SAU "XEM THÊM" Ở MÀN KHẨN CẤP ══════

          Đo 19/9/2026: màn này có 11 đích chạm ở khổ 375px và 16 ở khổ 320px,
          trong khi người dùng đã báo từ 21/8 rằng 7 cái đã "dễ bị rối". Mỗi lựa
          chọn thêm là một giây chần chừ, mà giây chần chừ là thứ kẻ lừa đang đếm
          ngược cùng bác.

          Nên ba thứ dưới đây — người kế tiếp trong đội, hai số khẩn cấp khi bác
          ĐÃ có số người thân, và lối vào Bảo vệ 72 giờ — chỉ hiện khi bác tự mở
          "Xem thêm". Không xoá: chúng vẫn thật và vẫn có lúc cần.

          ⚠️ Ở màn KHÔNG khẩn cấp (Nghi ngờ, Chưa thấy dấu hiệu) thì không có nút
          "Xem thêm" nào, nên chúng hiện thẳng như cũ.
        */}
        {(moThem || !manGapGap) && (<>
        {heroGap && nutNhanTin}
        {heroGap && !firstContact.phone && (
          <button
            type="button"
            onClick={() => setView('family')}
            className="w-full min-h-[52px] py-3 px-3 rounded-2xl font-bold text-[15px] bg-black/30 hover:bg-black/40 text-white border border-white/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <UserPlus size={18} className="shrink-0" />
            <span>{t('Thêm số con cháu')}</span>
          </button>
        )}
        {nguoiGoiTiep && (
          <button
            onClick={() => { ghiNhanBamGoi(); window.open(`tel:${nguoiGoiTiep.dienThoai}`, '_self'); }}
            className="w-full min-h-[52px] py-3 px-3 rounded-2xl font-bold text-[15px] bg-black/30 hover:bg-black/40 text-white border border-white/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <PhoneCall size={18} className="shrink-0" />
            <span>{(tra(DOI_PHAN_UNG, 'GOI_TIEP', lang) ?? '').split('{ten}').join(nguoiGoiTiep.ten)}</span>
          </button>
        )}

        {/* Hai số thật — lối phụ. Màn gấp chưa có số: 113 đã là nút chính, ở đây chỉ còn 156. */}
        {(firstContact.phone || heroGap) && (soCongAn || soBaoLuaDao) && (
          <div className="w-full grid grid-cols-2 gap-2">
            {soCongAn && firstContact.phone && (
              <a
                href={`tel:${soCongAn.cleanPhone}`}
                className="min-h-[56px] rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-md px-3 py-3 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <ShieldCheck size={18} className="text-white shrink-0" />
                <span className="text-[15px] font-bold text-white leading-tight text-center">{soCongAn.name}</span>
              </a>
            )}
            {soBaoLuaDao && (
              <a
                href={`tel:${soBaoLuaDao.cleanPhone}`}
                className="min-h-[56px] rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-md px-3 py-3 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <PhoneOff size={18} className="text-white shrink-0" />
                <span className="text-[15px] font-bold text-white leading-tight text-center">{soBaoLuaDao.name}</span>
              </a>
            )}
          </div>
        )}

        {/*
          §2B.5 — LỐI VÀO BẢO VỆ 72 GIỜ. Chỉ hiện ở mức CAO, và chỉ trước khi
          đã ở màn phục hồi rồi (đỡ bấm lặp). Đây không phải một kết quả phân
          tích mới — xem chú thích ở `daBamPhucHoi` phía trên.
        */}
        {/*
          ⚠️ MỌI MỨC, KHÔNG CHỈ MỨC CAO — sửa 22/9/2026. Người đã lỡ chuyển tiền
          rồi mới dán tin vào kiểm thường nhận "Chưa thấy dấu hiệu" (tin nhắn
          đã hết phần đe doạ), và trước đây ở màn đó KHÔNG có lối nào sang phục
          hồi. Người cần gọi ngân hàng gấp nhất lại là người không thấy nút.

          Khối phục hồi hiện NGAY (không chờ mạng); song song đó bộ luật được
          hỏi lại với trạng thái bác khai, để nó chọn màn thay vì trình duyệt.
        */}
        {!canRecovery && (
          <button
            onClick={() => { ghiHanhDong('da_lo_chuyen'); setDaBamPhucHoi(true); onBaoDaChuyen?.(); }}
            className="w-full min-h-[52px] py-3 px-3 rounded-2xl font-bold text-[15px] bg-black/30 hover:bg-black/40 text-white border border-white/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span>{t('Tôi đã lỡ chuyển tiền hoặc đọc mã rồi')}</span>
          </button>
        )}
        </>)}

        {/*
          §4.6 — NGUYÊN TẮC LUÔN CÓ LỐI RA.
          Mức PROTECTED_CRITICAL bỏ hết điều hướng, NHƯNG luôn phải có dòng "Tôi
          ổn, không có gì nguy hiểm" ở cuối màn hình. Nếu bộ luật báo động giả mà
          người dùng bị kẹt trong màn khẩn cấp, họ sẽ hoảng và gỡ ứng dụng.

          ⚠️ KHÔNG viết "Bác đã an toàn" ở nút này (§4.1 · §11): app không biết
          điều đó, và bấm một cái nút không làm ai an toàn hơn.
        */}
        {/*
          ⚠️ §4.6 — "Mỗi lần bấm nút này là một mẫu dữ liệu báo động giả — ghi
          lại để hiệu chỉnh ngưỡng." Trước 22/9/2026 nút này KHÔNG ghi gì.
        */}
        <button
          onClick={() => { ghiHanhDong(laKhanCap ? 'toi_on' : 've_trang_chu'); setView('home'); }}
          className="w-full py-3 rounded-[22px] font-bold text-[16px] bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-sm backdrop-blur-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
        >
          <span>{laKhanCap ? t('Tôi ổn, không có gì nguy hiểm') : t('Về trang chủ')}</span>
        </button>
      </div>
    </motion.div>
  );
}
