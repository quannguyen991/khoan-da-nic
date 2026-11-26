import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  PhoneIncoming,
  PhoneOff,
  Mic,
  Send,
  Volume2,
  VolumeX,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Trash2,
  UserCheck,
  Settings,
  AlertTriangle,
  Users,
  BookOpen,
  Play,
  PhoneForwarded,
} from 'lucide-react';
import { api } from '../api-goc';
import { docTo, dungDocTo, laApk, ngheGiongNoi } from '../native';
import { docPhien } from '../tai-khoan';
import { NHAN, THU_KY_UI, TRUNG_TAM_BAO_VE, tra, type Lang } from '../catalog';

let phienTokenRam: string | null = null;
let dangXinToken: Promise<string | null> | null = null;

async function damBaoTokenPhienKhach(epCapMoi = false): Promise<string | null> {
  if (!epCapMoi) {
    try {
      const daLuu = localStorage.getItem('khoan_da_thu_ky_hmac');
      if (daLuu && daLuu.startsWith('tk1.')) return daLuu;
    } catch {
      if (phienTokenRam && phienTokenRam.startsWith('tk1.')) return phienTokenRam;
    }
  }
  if (dangXinToken) return dangXinToken;
  dangXinToken = (async () => {
    try {
      const r = await fetch(api('/api/thu-ky/phien-khach'), { method: 'POST' });
      if (!r.ok) return null;
      const d = await r.json();
      const tk = typeof d?.token === 'string' ? d.token : null;
      if (tk) {
        phienTokenRam = tk;
        try {
          localStorage.setItem('khoan_da_thu_ky_hmac', tk);
        } catch {
          // ignore
        }
      }
      return tk;
    } catch {
      return null;
    } finally {
      dangXinToken = null;
    }
  })();
  return dangXinToken;
}

async function layHeaderThuKy(coBody = false, epCapMoi = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (coBody) headers['content-type'] = 'application/json';
  try {
    const token = docPhien();
    if (token) {
      headers.authorization = `Bearer ${token}`;
      return headers;
    }
  } catch {
    // ignore
  }
  const tkKhach = await damBaoTokenPhienKhach(epCapMoi);
  if (tkKhach) headers['x-thu-ky-session'] = tkKhach;
  return headers;
}

async function goiThuKy(duong: string, init: RequestInit = {}, coBody = false): Promise<Response> {
  const h1 = await layHeaderThuKy(coBody, false);
  const r1 = await fetch(api(duong), { ...init, headers: { ...h1, ...(init.headers || {}) } });
  if (r1.status !== 401) return r1;
  const h2 = await layHeaderThuKy(coBody, true);
  return fetch(api(duong), { ...init, headers: { ...h2, ...(init.headers || {}) } });
}

interface LuotHoiThoai {
  vai: 'thu_ky' | 'nguoi_goi';
  noiDung: string;
  luc: number;
}

interface ThucTheCuocGoi {
  tenTuXung: string | null;
  donViTuXung: string | null;
  soTienDeCap: string | null;
  duongDanDeCap: string | null;
}

interface PhienCuocGoi {
  id: string;
  soNguoiGoi: string;
  giaLap: boolean;
  batDauLuc: number;
  trangThaiPhien: 'dang_hoat_dong' | 'ket_thuc' | 'chuyen_thang';
  trangThaiPhanLoai: 'nguoi_quen' | 'thong_thuong' | 'khan_cap' | 'dang_ngo' | 'khong_du_thong_tin' | 'loi_he_thong';
  nhanRuiRo?: 'CAO' | 'NGHI_NGO' | 'CHUA_THAY';
  caller_claim: string;
  purpose: string;
  signals: string[];
  urgency: string;
  confidence: string;
  diemRuiRo: number;
  hoKichBan: string | null;
  thucThe: ThucTheCuocGoi;
  giaiThichChoBac: string;
  summary: string;
  recommended_action: string;
  claimedBy: string | null;
  claimedAt: number | null;
  danhDau: 'hop_le' | 'dang_ngo' | 'khong_ro' | null;
  hoiThoai: LuotHoiThoai[];
  doTreTrungBinhMs: number;
  latencyListMs: number[];
}

interface NguoiHoTro {
  id: string;
  ten: string;
  dienThoai: string;
}

interface CauHinhThuKy {
  batTroLy: boolean;
  cheDo: 'so_la_qua_thu_ky' | 'chi_ghi_loi_nhan' | 'tat';
  nguoiHoTro: NguoiHoTro[];
  phamViChiaSe: 'chi_tom_tat' | 'tom_tat_va_ban_ghi';
  nhanLoiNhanQua: 'bac' | 'nguoi_than' | 'ca_hai';
  danhSachTinCay: string[];
}

interface ThongKeDoTre {
  tongLuot: number;
  medianMs: number;
  p90Ms: number;
  soLuotTren2000Ms: number;
}

interface KichBanItem {
  id: string;
  nhom: 'hop_le' | 'dang_ngo' | 'tinh_huong_kho';
  ten: string;
  soNguoiGoi: string;
  cacLuot: Array<{ loiNoi: string; khongNgheRo?: boolean; aiLoi?: boolean }>;
  kyVongTrangThai: string;
}

interface BoLuatInfo {
  phienBan: string;
  quyTacAnToan: Array<{ ma: string; ten: string; moTa: string }>;
  luatTinHieu: Array<{ ma: string; nhom: string; san?: string; tinHieuChuan?: string[]; moTa: string }>;
  congHuong: Array<{ ma: string; san?: string; hoKichBan: string; giaiThich: string }>;
}

interface KetQuaDanhGia {
  tongKichBan: number;
  soKichBanDat: number;
  tyLeDatPhanTram: number;
  recallDangNgoPhanTram: number;
  baoNhamHopLePhanTram: number;
  chiTiet: Array<{
    id: string;
    nhom: string;
    ten: string;
    dat: boolean;
    kyVong: string;
    thucTe: string;
    diemRuiRo: number;
    hoKichBan: string | null;
    signals: string[];
  }>;
}

function nhanTrangThai(tt: PhienCuocGoi['trangThaiPhanLoai'], lang: Lang = 'vi') {
  switch (tt) {
    case 'khan_cap':
      return { chu: tra(THU_KY_UI, 'TT_KHAN_CAP', lang) ?? '', mau: 'bg-red-700 text-white' };
    case 'dang_ngo':
      return { chu: tra(THU_KY_UI, 'TT_DANG_NGO', lang) ?? '', mau: 'bg-amber-700 text-white' };
    case 'thong_thuong':
      // §4.1 — Không dùng nền xanh lá đặc cho trạng thái chưa xác minh danh tính để tránh cảm giác "An toàn"
      return { chu: tra(THU_KY_UI, 'TT_THONG_THUONG', lang) ?? '', mau: 'bg-slate-700 text-white' };
    case 'nguoi_quen':
      return { chu: tra(THU_KY_UI, 'TT_NGUOI_QUEN', lang) ?? '', mau: 'bg-indigo-700 text-white' };
    case 'loi_he_thong':
      return { chu: tra(THU_KY_UI, 'TT_LOI_HE_THONG', lang) ?? '', mau: 'bg-slate-700 text-white' };
    default:
      return { chu: tra(THU_KY_UI, 'TT_CHUA_RO', lang) ?? '', mau: 'bg-slate-600 text-white' };
  }
}

function tenNhomKichBan(nhom: KichBanItem['nhom']) {
  if (nhom === 'hop_le') return '1. Cuộc gọi hợp lệ';
  if (nhom === 'dang_ngo') return '2. Cuộc gọi đáng ngờ (gồm kịch bản nhiều lượt)';
  return '3. Tình huống khó (phủ định, moi thông tin, mất AI, ồn)';
}

export function ThuKyNgheMay({
  onVeTrangChu,
  coThanhDuoi = false,
  lang = 'vi',
}: {
  onVeTrangChu: () => void;
  coThanhDuoi?: boolean;
  lang?: Lang;
}) {
  const [tab, setTab] = useState<'thu' | 'quan_ly' | 'bo_luat' | 'cai_dat'>('thu');
  const [cheDoXem, setCheDoXem] = useState<'bac' | 'con'>('bac');
  const [boLocDanhSach, setBoLocDanhSach] = useState<'tat_ca' | 'khan_cap' | 'dang_ngo' | 'chua_xu_ly'>('tat_ca');
  const [phienHienTai, setPhienHienTai] = useState<PhienCuocGoi | null>(null);
  const [danhSach, setDanhSach] = useState<PhienCuocGoi[]>([]);
  const [thongKeDoTre, setThongKeDoTre] = useState<ThongKeDoTre>({
    tongLuot: 0,
    medianMs: 0,
    p90Ms: 0,
    soLuotTren2000Ms: 0,
  });
  const [cauHinh, setCauHinh] = useState<CauHinhThuKy>({
    batTroLy: true,
    cheDo: 'so_la_qua_thu_ky',
    nguoiHoTro: [],
    phamViChiaSe: 'chi_tom_tat',
    nhanLoiNhanQua: 'ca_hai',
    danhSachTinCay: [],
  });
  const [boKichBan, setBoKichBan] = useState<KichBanItem[]>([]);
  const [boLuat, setBoLuat] = useState<BoLuatInfo | null>(null);
  const [ketQuaDanhGia, setKetQuaDanhGia] = useState<KetQuaDanhGia | null>(null);

  const [soThuNghiem, setSoThuNghiem] = useState('Số lạ (Thử nghiệm)');
  const [loiNoi, setLoiNoi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [dangNgheMic, setDangNgheMic] = useState(false);
  const [tuDongDoc, setTuDongDoc] = useState(true);
  const [giaLapLoiAi, setGiaLapLoiAi] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [thongBaoLuu, setThongBaoLuu] = useState<string | null>(null);

  const [tenMoi, setTenMoi] = useState('');
  const [sdtMoi, setSdtMoi] = useState('');
  const [soTinCayMoi, setSoTinCayMoi] = useState('');
  const recRef = useRef<any>(null);

  const taiDuLieu = async () => {
    try {
      const [resCh, resDs, resKb, resBl] = await Promise.all([
        goiThuKy('/api/thu-ky/cau-hinh'),
        goiThuKy('/api/thu-ky/cuoc-goi'),
        fetch(api('/api/thu-ky/kich-ban')),
        fetch(api('/api/thu-ky/bo-luat')),
      ]);
      if (resCh.ok) {
        const d = await resCh.json();
        if (d.cauHinh) setCauHinh(d.cauHinh);
      }
      if (resDs.ok) {
        const d = await resDs.json();
        if (Array.isArray(d.danhSach)) setDanhSach(d.danhSach);
        if (d.thongKeDoTre) setThongKeDoTre(d.thongKeDoTre);
      }
      if (resKb.ok) {
        const d = await resKb.json();
        if (Array.isArray(d.kichBan)) setBoKichBan(d.kichBan);
      }
      if (resBl.ok) {
        const d = await resBl.json();
        setBoLuat(d);
      }
    } catch {
      setLoi('Không kết nối được tới máy chủ Thư ký nghe máy hộ.');
    }
  };

  useEffect(() => {
    void taiDuLieu();
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        // ignore
      }
      dungDocTo();
    };
  }, []);

  const phatGiong = async (vanBan: string, batBuoc = false) => {
    if ((!tuDongDoc && !batBuoc) || !vanBan) return;
    dungDocTo();
    const kq = await docTo(vanBan, 'vi-VN');
    if (!kq.ok) {
      setLoi(
        kq.ma === 'MAY_CHUA_CO_GIONG'
          ? 'Máy chưa có giọng đọc tiếng Việt. Vui lòng kiểm tra cài đặt giọng nói.'
          : 'Không phát được giọng đọc trên thiết bị này.'
      );
    }
  };

  const batDauThu = async (soNguoiGoi = soThuNghiem || 'Số lạ (Thử nghiệm)') => {
    setLoi(null);
    setDangGui(true);
    try {
      const res = await goiThuKy(
        '/api/thu-ky/cuoc-goi/bat-dau',
        {
          method: 'POST',
          body: JSON.stringify({ soNguoiGoi, giaLap: true }),
        },
        true
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.ma || 'LOI');
      setPhienHienTai(data.phien);
      const chao = data.phien?.hoiThoai?.[0]?.noiDung;
      if (chao) phatGiong(chao);
      await taiDuLieu();
    } catch {
      setLoi('Chưa bắt đầu được cuộc gọi thử nghiệm.');
    } finally {
      setDangGui(false);
    }
  };

  const guiLuot = async (noiDung: string, khongNgheRo = false) => {
    if (!phienHienTai) return;
    setLoi(null);
    setDangGui(true);
    try {
      const res = await goiThuKy(
        `/api/thu-ky/cuoc-goi/${phienHienTai.id}/luot`,
        {
          method: 'POST',
          body: JSON.stringify({
            loiNoi: noiDung,
            khongNgheRo,
            tuyChon: { giaLapLoiAi },
          }),
        },
        true
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.ma || 'LOI');
      setPhienHienTai(data.phien);
      setLoiNoi('');
      if (data.loiDap) phatGiong(data.loiDap);
      await taiDuLieu();
    } catch {
      setLoi('Không gửi được lượt hội thoại.');
    } finally {
      setDangGui(false);
    }
  };

  const chayKichBan = async (kb: KichBanItem) => {
    setLoi(null);
    setDangGui(true);
    try {
      const res1 = await goiThuKy(
        '/api/thu-ky/cuoc-goi/bat-dau',
        {
          method: 'POST',
          body: JSON.stringify({ soNguoiGoi: kb.soNguoiGoi, giaLap: true }),
        },
        true
      );
      const d1 = await res1.json();
      if (!res1.ok) throw new Error('LOI');

      let phienMoi = d1.phien as PhienCuocGoi;
      let loiDapCuoi = '';
      for (const luot of kb.cacLuot) {
        const resLuot = await goiThuKy(
          `/api/thu-ky/cuoc-goi/${phienMoi.id}/luot`,
          {
            method: 'POST',
            body: JSON.stringify({
              loiNoi: luot.loiNoi,
              khongNgheRo: Boolean(luot.khongNgheRo),
              tuyChon: { giaLapLoiAi: giaLapLoiAi || Boolean(luot.aiLoi) },
            }),
          },
          true
        );
        const dLuot = await resLuot.json();
        if (!resLuot.ok) break;
        phienMoi = dLuot.phien;
        loiDapCuoi = dLuot.loiDap || '';
        if (dLuot.ketThuc) break;
      }

      setPhienHienTai(phienMoi);
      setTab('thu');
      if (loiDapCuoi) phatGiong(loiDapCuoi);
      await taiDuLieu();
    } catch {
      setLoi('Không chạy được kịch bản kiểm thử.');
    } finally {
      setDangGui(false);
    }
  };

  const chayDanhGiaBoLuat = async () => {
    setLoi(null);
    try {
      const res = await fetch(api('/api/thu-ky/danh-gia'), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setKetQuaDanhGia(data);
      }
    } catch {
      setLoi('Không chạy được đánh giá bộ luật.');
    }
  };

  const batMic = async () => {
    dungDocTo();
    if (await laApk()) {
      setDangNgheMic(true);
      try {
        const kq = await ngheGiongNoi('vi-VN');
        const text = !kq.ghiAmFailed ? (kq.vanBan || '').trim() : '';
        if (text) {
          if (phienHienTai && phienHienTai.trangThaiPhien === 'dang_hoat_dong') {
            void guiLuot(text, false);
          } else {
            setLoiNoi(text);
          }
        } else if (kq.ghiAmFailed && kq.maLoi !== 'DA_HUY' && kq.maLoi !== 'BI_CAT') {
          setLoi('Không nghe được giọng nói trên máy. Vui lòng kiểm tra quyền micro.');
        }
      } finally {
        setDangNgheMic(false);
      }
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setLoi('Trình duyệt hiện tại chưa hỗ trợ nhận giọng nói trực tiếp. Vui lòng gõ chữ hoặc chọn kịch bản.');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'vi-VN';
    rec.interimResults = false;
    rec.onstart = () => setDangNgheMic(true);
    rec.onend = () => setDangNgheMic(false);
    rec.onerror = () => {
      setDangNgheMic(false);
      setLoi('Không nghe được micro. Vui lòng kiểm tra quyền micro.');
    };
    rec.onresult = (ev: any) => {
      const text = ev?.results?.[0]?.[0]?.transcript || '';
      if (text) {
        if (phienHienTai && phienHienTai.trangThaiPhien === 'dang_hoat_dong') {
          void guiLuot(text, false);
        } else {
          setLoiNoi(text);
        }
      }
    };
    recRef.current = rec;
    rec.start();
  };

  const luuCauHinh = async (banMoi: CauHinhThuKy) => {
    setCauHinh(banMoi);
    try {
      const res = await goiThuKy(
        '/api/thu-ky/cau-hinh',
        {
          method: 'PUT',
          body: JSON.stringify(banMoi),
        },
        true
      );
      if (res.ok) {
        const d = await res.json();
        setCauHinh(d.cauHinh);
        setThongBaoLuu('Đã lưu thiết lập Thư ký nghe máy hộ.');
        setTimeout(() => setThongBaoLuu(null), 2500);
      }
    } catch {
      setLoi('Chưa lưu được cấu hình.');
    }
  };

  const nhanKiemTra = async (id: string) => {
    const res = await goiThuKy(
      `/api/thu-ky/cuoc-goi/${id}/nhan-kiem-tra`,
      {
        method: 'POST',
        body: JSON.stringify({ tenNguoiKiemTra: cauHinh.nguoiHoTro[0]?.ten || 'Con cháu' }),
      },
      true
    );
    if (res.ok) await taiDuLieu();
  };

  const danhDau = async (id: string, ketQua: 'hop_le' | 'dang_ngo' | 'khong_ro') => {
    const res = await goiThuKy(
      `/api/thu-ky/cuoc-goi/${id}/danh-dau`,
      {
        method: 'POST',
        body: JSON.stringify({ ketQua }),
      },
      true
    );
    if (res.ok) await taiDuLieu();
  };

  const xoaCuocGoi = async (id: string) => {
    const res = await goiThuKy(`/api/thu-ky/cuoc-goi/${id}/xoa`, { method: 'POST' }, false);
    if (res.ok) await taiDuLieu();
  };

  const danhSachLoc = danhSach.filter((item) => {
    if (boLocDanhSach === 'khan_cap') return item.trangThaiPhanLoai === 'khan_cap';
    if (boLocDanhSach === 'dang_ngo') return item.trangThaiPhanLoai === 'dang_ngo';
    if (boLocDanhSach === 'chua_xu_ly') return !item.danhDau && item.trangThaiPhanLoai !== 'nguoi_quen';
    return true;
  });

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${coThanhDuoi ? 'pb-28' : 'pb-10'}`}>
      {/* Thanh tiêu đề */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            dungDocTo();
            onVeTrangChu();
          }}
          className="min-h-[52px] min-w-[52px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-800"
          aria-label={tra(THU_KY_UI, 'QUAY_LAI', lang) ?? 'Quay lại'}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-slate-900 leading-snug">{tra(THU_KY_UI, 'TIEU_DE', lang)}</h1>
          <p className="text-sm text-slate-600">{tra(THU_KY_UI, 'PHU_DE', lang)}</p>
        </div>
        <button
          onClick={() => {
            if (tuDongDoc) dungDocTo();
            setTuDongDoc(!tuDongDoc);
          }}
          className="min-h-[52px] px-3 rounded-xl bg-indigo-50 text-indigo-800 font-semibold text-sm flex items-center gap-1.5"
        >
          {tuDongDoc ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{tuDongDoc ? tra(THU_KY_UI, 'DANG_BAT_TIENG', lang) : tra(THU_KY_UI, 'DANG_TAT_TIENG', lang)}</span>
        </button>
      </div>

      {/* Thanh chuyển tab */}
      <div className="px-4 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setTab('thu')}
          className={`min-h-[52px] px-3 rounded-xl font-bold text-sm border ${
            tab === 'thu'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-700 border-slate-300'
          }`}
        >
          {tra(THU_KY_UI, 'TAB_THU', lang)}
        </button>
        <button
          onClick={() => setTab('quan_ly')}
          className={`min-h-[52px] px-3 rounded-xl font-bold text-sm border ${
            tab === 'quan_ly'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-700 border-slate-300'
          }`}
        >
          {tra(THU_KY_UI, 'TAB_DANH_SACH', lang)} ({danhSach.length})
        </button>
        <button
          onClick={() => setTab('bo_luat')}
          className={`min-h-[52px] px-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-1.5 ${
            tab === 'bo_luat'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-700 border-slate-300'
          }`}
        >
          <BookOpen size={17} />
          <span>{tra(THU_KY_UI, 'TAB_BO_LUAT', lang)} ({boKichBan.length})</span>
        </button>
        <button
          onClick={() => setTab('cai_dat')}
          className={`min-h-[52px] px-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-1.5 ${
            tab === 'cai_dat'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-700 border-slate-300'
          }`}
        >
          <Settings size={17} />
          <span>{tra(THU_KY_UI, 'TAB_CAI_DAT', lang)}</span>
        </button>
      </div>

      {loi && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 text-sm font-medium flex items-center gap-2">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{loi}</span>
        </div>
      )}

      {thongBaoLuu && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{thongBaoLuu}</span>
        </div>
      )}

      {/* TAB 1: THỬ CUỘC GỌI MẪU */}
      {tab === 'thu' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-base text-slate-900">{tra(THU_KY_UI, 'PHONG_THU_TIEU_DE', lang)}</h2>
                <p className="text-sm text-slate-600">
                  {tra(THU_KY_UI, 'PHONG_THU_MO_TA', lang)}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giaLapLoiAi}
                  onChange={(e) => setGiaLapLoiAi(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>{tra(THU_KY_UI, 'THU_LOI_AI', lang)}</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={soThuNghiem}
                onChange={(e) => setSoThuNghiem(e.target.value)}
                placeholder="Số người gọi thử (vd: 0981...)"
                className="min-h-[52px] px-3 rounded-xl border border-slate-300 text-sm flex-1 min-w-[180px]"
              />
              <button
                onClick={() => void batDauThu(soThuNghiem)}
                disabled={dangGui}
                className="min-h-[56px] px-5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-base flex items-center gap-2"
              >
                <PhoneIncoming size={20} />
                <span>{tra(THU_KY_UI, 'BAT_DAU_CUOC_GOI', lang)}</span>
              </button>
              <button
                onClick={() => dungDocTo()}
                className="min-h-[56px] px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-sm flex items-center gap-2"
              >
                <PhoneOff size={18} />
                <span>{tra(THU_KY_UI, 'NGAT_LOI', lang)}</span>
              </button>
              <button
                onClick={() => {
                  const cau = tra(TRUNG_TAM_BAO_VE, 'DETERRENCE_LINE', lang) ?? '';
                  void phatGiong(cau, true);
                }}
                className="min-h-[56px] px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm flex items-center gap-2"
              >
                <Volume2 size={18} />
                <span>{tra(THU_KY_UI, 'PHAT_LOA_CANH_BAO', lang)}</span>
              </button>
            </div>

            {boKichBan.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">
                  Chạy nhanh kịch bản tiêu biểu (xem đủ {boKichBan.length} kịch bản ở tab Bộ luật):
                </p>
                <div className="flex flex-wrap gap-2">
                  {boKichBan.slice(0, 6).map((kb) => (
                    <button
                      key={kb.id}
                      onClick={() => void chayKichBan(kb)}
                      disabled={dangGui}
                      className="min-h-[52px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold text-left"
                    >
                      {kb.ten}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {phienHienTai && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-sm text-slate-500">Số gọi: {phienHienTai.soNguoiGoi}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        nhanTrangThai(phienHienTai.trangThaiPhanLoai, lang).mau
                      }`}
                    >
                      {nhanTrangThai(phienHienTai.trangThaiPhanLoai, lang).chu}
                    </span>
                    {phienHienTai.nhanRuiRo && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-sm font-bold ${
                          phienHienTai.nhanRuiRo === 'CAO'
                            ? 'bg-[#b91c1c] text-white'
                            : phienHienTai.nhanRuiRo === 'NGHI_NGO'
                              ? 'bg-amber-100 text-amber-900 border border-amber-400'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {tra(NHAN, phienHienTai.nhanRuiRo, lang)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <Clock size={16} />
                  <span>Độ trễ TB: {phienHienTai.doTreTrungBinhMs} ms</span>
                </div>
              </div>

              {/* Giải thích đời thường cho bác */}
              {phienHienTai.giaiThichChoBac && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-base text-amber-950 font-medium">
                  <div className="text-sm font-bold uppercase text-amber-800 mb-1">{tra(THU_KY_UI, 'GIAI_THICH_CHO_BAC', lang)}</div>
                  {phienHienTai.giaiThichChoBac}
                </div>
              )}

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {phienHienTai.hoiThoai.map((luot, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-base leading-relaxed ${
                      luot.vai === 'thu_ky'
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 mr-6'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 ml-6'
                    }`}
                  >
                    <div className="text-sm font-bold uppercase mb-1 text-slate-500">
                      {luot.vai === 'thu_ky' ? 'Thư ký tự động' : 'Người gọi'}
                    </div>
                    <p>{luot.noiDung}</p>
                  </div>
                ))}
              </div>

              {phienHienTai.trangThaiPhien === 'dang_hoat_dong' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={loiNoi}
                      onChange={(e) => setLoiNoi(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && loiNoi.trim()) void guiLuot(loiNoi, false);
                      }}
                      placeholder="Nhập lời người gọi nói..."
                      className="flex-1 min-h-[52px] px-4 rounded-xl border border-slate-300 text-base"
                    />
                    <button
                      onClick={batMic}
                      className={`min-h-[52px] min-w-[52px] px-3 rounded-xl font-bold flex items-center justify-center ${
                        dangNgheMic ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800'
                      }`}
                      aria-label="Nói bằng micro"
                    >
                      <Mic size={22} />
                    </button>
                    <button
                      onClick={() => void guiLuot(loiNoi, false)}
                      disabled={dangGui || !loiNoi.trim()}
                      className="min-h-[52px] px-4 rounded-xl bg-indigo-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={18} />
                      <span>Nói</span>
                    </button>
                  </div>
                  <button
                    onClick={() => void guiLuot('', true)}
                    disabled={dangGui}
                    className="min-h-[52px] px-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
                  >
                    Giả lập người gọi nói không rõ / ồn
                  </button>
                </div>
              )}

              {/* Chi tiết thực thể & tóm tắt */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-sm">
                <div className="font-bold text-slate-800">{tra(THU_KY_UI, 'TOM_TAT_GIA_DINH', lang)}</div>
                <p className="text-slate-900">{phienHienTai.summary}</p>
                {phienHienTai.thucThe &&
                  (phienHienTai.thucThe.tenTuXung ||
                    phienHienTai.thucThe.donViTuXung ||
                    phienHienTai.thucThe.soTienDeCap) && (
                    <div className="flex flex-wrap gap-2 pt-1 text-sm text-slate-700">
                      {phienHienTai.thucThe.tenTuXung && (
                        <span className="px-2.5 py-0.5 rounded bg-white border border-slate-300">
                          Tên tự xưng: <b>{phienHienTai.thucThe.tenTuXung}</b>
                        </span>
                      )}
                      {phienHienTai.thucThe.donViTuXung && (
                        <span className="px-2.5 py-0.5 rounded bg-white border border-slate-300">
                          Đơn vị: <b>{phienHienTai.thucThe.donViTuXung}</b>
                        </span>
                      )}
                      {phienHienTai.thucThe.soTienDeCap && (
                        <span className="px-2.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-900">
                          Số tiền: <b>{phienHienTai.thucThe.soTienDeCap}</b>
                        </span>
                      )}
                    </div>
                  )}
                {phienHienTai.signals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {phienHienTai.signals.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 text-sm font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DANH SÁCH CUỘC GỌI & TRANG QUẢN LÝ */}
      {tab === 'quan_ly' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setCheDoXem('bac')}
                  className={`min-h-[52px] px-4 rounded-xl font-bold text-sm ${
                    cheDoXem === 'bac' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tra(THU_KY_UI, 'GIAO_DIEN_BAC', lang)}
                </button>
                <button
                  onClick={() => setCheDoXem('con')}
                  className={`min-h-[52px] px-4 rounded-xl font-bold text-sm ${
                    cheDoXem === 'con' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tra(THU_KY_UI, 'QUAN_LY_CON_CHAU', lang)}
                </button>
              </div>
              <div className="text-sm text-slate-600 flex flex-wrap items-center gap-3">
                <span>Lượt: <b>{thongKeDoTre.tongLuot}</b></span>
                <span>Trung vị: <b>{thongKeDoTre.medianMs}ms</b></span>
                <span>P90: <b>{thongKeDoTre.p90Ms}ms</b></span>
                <span>&gt;2s: <b>{thongKeDoTre.soLuotTren2000Ms}</b></span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'tat_ca', ten: tra(THU_KY_UI, 'LOC_TAT_CA', lang) ?? 'Tất cả' },
                { id: 'chua_xu_ly', ten: tra(THU_KY_UI, 'LOC_CHUA_XAC_MINH', lang) ?? 'Chưa xác minh' },
                { id: 'khan_cap', ten: tra(THU_KY_UI, 'LOC_KHAN_CAP', lang) ?? 'Khẩn cấp' },
                { id: 'dang_ngo', ten: tra(THU_KY_UI, 'LOC_DANG_NGO', lang) ?? 'Đáng ngờ' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setBoLocDanhSach(f.id as any)}
                  className={`min-h-[52px] px-3 rounded-lg text-sm font-semibold border ${
                    boLocDanhSach === f.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  {f.ten}
                </button>
              ))}
            </div>
          </div>

          {danhSachLoc.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
              Không có cuộc gọi nào khớp bộ lọc. Hãy vào mục <b>"Thử cuộc gọi"</b> để tạo dữ liệu mẫu.
            </div>
          ) : (
            <div className="space-y-3">
              {danhSachLoc.map((item) => {
                const badge = nhanTrangThai(item.trangThaiPhanLoai, lang);
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${badge.mau}`}>
                          {badge.chu}
                        </span>
                        <div className="mt-1.5 text-base font-bold text-slate-900">
                          {item.soNguoiGoi} · {new Date(item.batDauLuc).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                      {item.claimedBy && (
                        <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-900 text-sm font-bold flex items-center gap-1">
                          <UserCheck size={14} />
                          {item.claimedBy} đang kiểm tra
                        </span>
                      )}
                    </div>

                    <p className="text-base text-slate-800 leading-relaxed">{item.summary}</p>
                    <p className="text-sm text-slate-500">
                      Lưu ý: Tóm tắt dựa trên lời người gọi tự xưng; trợ lý có thể nghe nhầm khi ồn.
                    </p>

                    {cheDoXem === 'con' && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                        {!item.claimedBy && (
                          <button
                            onClick={() => void nhanKiemTra(item.id)}
                            className="min-h-[52px] px-4 rounded-xl bg-blue-700 text-white font-bold text-sm flex items-center gap-1.5"
                          >
                            <UserCheck size={16} />
                            <span>{tra(THU_KY_UI, 'TOI_SE_KIEM_TRA', lang)}</span>
                          </button>
                        )}
                        <button
                          onClick={() => void danhDau(item.id, 'hop_le')}
                          className={`min-h-[52px] px-3 rounded-xl text-sm font-bold border ${
                            item.danhDau === 'hop_le'
                              ? 'bg-indigo-700 text-white border-indigo-700'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          {tra(THU_KY_UI, 'DA_KIEM_CHUNG', lang)}
                        </button>
                        <button
                          onClick={() => void danhDau(item.id, 'dang_ngo')}
                          className={`min-h-[52px] px-3 rounded-xl text-sm font-bold border ${
                            item.danhDau === 'dang_ngo'
                              ? 'bg-red-700 text-white border-red-700'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          {tra(THU_KY_UI, 'DANH_DAU_DANG_NGO', lang)}
                        </button>
                        <button
                          onClick={() => void danhDau(item.id, 'khong_ro')}
                          className={`min-h-[52px] px-3 rounded-xl text-sm font-bold border ${
                            item.danhDau === 'khong_ro'
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          {tra(THU_KY_UI, 'DANH_DAU_KHONG_RO', lang)}
                        </button>
                        <button
                          onClick={() => void xoaCuocGoi(item.id)}
                          className="min-h-[52px] px-3 rounded-xl bg-red-50 text-red-700 font-bold text-sm flex items-center gap-1 ml-auto"
                        >
                          <Trash2 size={16} />
                          <span>{tra(THU_KY_UI, 'XOA', lang)}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BỘ LUẬT & BỘ 30 KỊCH BẢN KIỂM THỬ (§7) */}
      {tab === 'bo_luat' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  Bộ luật Thư ký nghe máy hộ (v{boLuat?.phienBan || '1.2.0'})
                </h2>
                <p className="text-sm text-slate-600">
                  {boLuat?.quyTacAnToan.length || 5} quy tắc cứng · {boLuat?.luatTinHieu.length || 21} luật tín hiệu ·{' '}
                  {boLuat?.congHuong.length || 5} tổ hợp cộng hưởng · {boKichBan.length} kịch bản chuẩn (§7).
                </p>
              </div>
              <button
                onClick={() => void chayDanhGiaBoLuat()}
                className="min-h-[52px] px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm flex items-center gap-2"
              >
                <Play size={18} />
                <span>Chạy kiểm thử {boKichBan.length} kịch bản</span>
              </button>
            </div>

            {ketQuaDanhGia && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 space-y-2">
                <div className="font-bold text-base text-emerald-950">
                  Đạt {ketQuaDanhGia.soKichBanDat} / {ketQuaDanhGia.tongKichBan} kịch bản ({ketQuaDanhGia.tyLeDatPhanTram}%)
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-emerald-900">
                  <span>Recall đáng ngờ: <b>{ketQuaDanhGia.recallDangNgoPhanTram}%</b></span>
                  <span>Báo nhầm (FP) cuộc gọi hợp lệ: <b>{ketQuaDanhGia.baoNhamHopLePhanTram}%</b></span>
                </div>
                <div className="grid gap-1.5 max-h-60 overflow-y-auto pt-1">
                  {ketQuaDanhGia.chiTiet.map((c) => (
                    <div
                      key={c.id}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 ${
                        c.dat ? 'bg-white text-slate-800' : 'bg-red-100 text-red-900 font-bold'
                      }`}
                    >
                      <span>{c.dat ? '✔' : '✖'} {c.ten}</span>
                      <span className="text-sm font-mono">{c.thucTe} ({c.diemRuiRo}đ)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {boLuat && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <h3 className="font-bold text-base text-slate-900">5 Quy tắc An toàn Cứng (§1 & §5)</h3>
                <div className="space-y-2">
                  {boLuat.quyTacAnToan.map((qt) => (
                    <div key={qt.ma} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                      <div className="font-bold text-slate-900">{qt.ma} · {qt.ten}</div>
                      <p className="text-slate-700 mt-0.5">{qt.moTa}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <h3 className="font-bold text-base text-slate-900">
                  5 Tổ hợp Cộng hưởng đa tín hiệu & {boLuat.luatTinHieu.length} Luật Tín hiệu
                </h3>
                <div className="space-y-2">
                  {boLuat.congHuong.map((ch) => (
                    <div key={ch.ma} className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">
                      <div className="font-bold text-amber-950">{ch.ma} ({ch.hoKichBan})</div>
                      <p className="text-amber-900 mt-0.5">{ch.giaiThich}</p>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-2 pt-2 max-h-72 overflow-y-auto">
                  {boLuat.luatTinHieu.map((l) => (
                    <div key={l.ma} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                      <div className="font-bold text-slate-900">
                        {l.ma} {l.tinHieuChuan?.length ? `→ ${l.tinHieuChuan.join(', ')}` : ''}
                      </div>
                      <p className="text-slate-700 mt-0.5">{l.moTa}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {(['hop_le', 'dang_ngo', 'tinh_huong_kho'] as const).map((nhom) => {
            const dsNhom = boKichBan.filter((x) => x.nhom === nhom);
            return (
              <div key={nhom} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h3 className="font-bold text-base text-slate-900">{tenNhomKichBan(nhom)} ({dsNhom.length})</h3>
                <div className="space-y-2">
                  {dsNhom.map((kb) => (
                    <div key={kb.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-[220px]">
                        <div className="font-bold text-sm text-slate-900">{kb.ten}</div>
                        <div className="text-sm text-slate-600 mt-0.5">
                          Số: {kb.soNguoiGoi} · {kb.cacLuot.length} lượt · Kỳ vọng: <b>{kb.kyVongTrangThai}</b>
                        </div>
                      </div>
                      <button
                        onClick={() => void chayKichBan(kb)}
                        disabled={dangGui}
                        className="min-h-[52px] px-4 rounded-xl bg-indigo-700 text-white font-bold text-sm"
                      >
                        Chạy thử
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: THIẾT LẬP LẦN ĐẦU & QUYỀN KIỂM SOÁT */}
      {tab === 'cai_dat' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-900">{tra(THU_KY_UI, 'BAT_THU_KY_TIEU_DE', lang)}</h2>
                <p className="text-sm text-slate-600">
                  {tra(THU_KY_UI, 'BAT_THU_KY_MO_TA', lang)}
                </p>
              </div>
              <input
                type="checkbox"
                checked={cauHinh.batTroLy}
                onChange={(e) => void luuCauHinh({ ...cauHinh, batTroLy: e.target.checked })}
                className="w-6 h-6"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-sm text-slate-800">Cách xử lý cuộc gọi</label>
              <div className="grid gap-2">
                {[
                  { id: 'so_la_qua_thu_ky', ten: 'Người quen gọi trực tiếp, số lạ qua thư ký' },
                  { id: 'chi_ghi_loi_nhan', ten: 'Chỉ ghi lời nhắn cho mọi số lạ' },
                  { id: 'tat', ten: 'Tạm tắt thư ký' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() =>
                      void luuCauHinh({
                        ...cauHinh,
                        cheDo: opt.id as CauHinhThuKy['cheDo'],
                      })
                    }
                    className={`min-h-[52px] px-4 rounded-xl text-left font-semibold text-sm border ${
                      cauHinh.cheDo === opt.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    {opt.ten}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-sm text-slate-800">Cách nhận lời nhắn</label>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  { id: 'bac', ten: 'Thông báo cho bác' },
                  { id: 'nguoi_than', ten: 'Qua người thân' },
                  { id: 'ca_hai', ten: 'Cả hai' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() =>
                      void luuCauHinh({
                        ...cauHinh,
                        nhanLoiNhanQua: opt.id as CauHinhThuKy['nhanLoiNhanQua'],
                      })
                    }
                    className={`min-h-[52px] px-3 rounded-xl font-semibold text-sm border ${
                      cauHinh.nhanLoiNhanQua === opt.id
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    {opt.ten}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-sm text-slate-800">
                Phạm vi chia sẻ với người hỗ trợ (§2.1)
              </label>
              <div className="grid gap-2">
                <button
                  onClick={() => void luuCauHinh({ ...cauHinh, phamViChiaSe: 'chi_tom_tat' })}
                  className={`min-h-[52px] px-4 rounded-xl text-left font-semibold text-sm border ${
                    cauHinh.phamViChiaSe === 'chi_tom_tat'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  Mặc định: Chỉ chia sẻ lý do gọi và cảnh báo (không gửi toàn bộ nội dung)
                </button>
                <button
                  onClick={() => void luuCauHinh({ ...cauHinh, phamViChiaSe: 'tom_tat_va_ban_ghi' })}
                  className={`min-h-[52px] px-4 rounded-xl text-left font-semibold text-sm border ${
                    cauHinh.phamViChiaSe === 'tom_tat_va_ban_ghi'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  Chia sẻ cả tóm tắt và nội dung lời thoại
                </button>
              </div>
            </div>

            {/* Danh bạ tin cậy */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <PhoneForwarded size={18} />
                <span>Số tin cậy cho đi thẳng (khi hạ tầng hỗ trợ)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cauHinh.danhSachTinCay.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 text-sm font-semibold flex items-center gap-2">
                    {s}
                    <button
                      onClick={() =>
                        void luuCauHinh({
                          ...cauHinh,
                          danhSachTinCay: cauHinh.danhSachTinCay.filter((x) => x !== s),
                        })
                      }
                      className="text-red-700 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={soTinCayMoi}
                  onChange={(e) => setSoTinCayMoi(e.target.value)}
                  placeholder="Thêm SĐT người quen (vd: 0901234567)"
                  className="flex-1 min-h-[52px] px-3 rounded-xl border border-slate-300 text-sm"
                />
                <button
                  onClick={() => {
                    if (!soTinCayMoi.trim()) return;
                    const s = soTinCayMoi.trim();
                    setSoTinCayMoi('');
                    void luuCauHinh({
                      ...cauHinh,
                      danhSachTinCay: Array.from(new Set([...cauHinh.danhSachTinCay, s])),
                    });
                  }}
                  className="min-h-[52px] px-4 rounded-xl bg-blue-700 text-white font-bold text-sm"
                >
                  Thêm số
                </button>
              </div>
            </div>

            {/* Người hỗ trợ (tối đa 3) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <Users size={18} />
                <span>Người hỗ trợ (tối đa 3 người)</span>
              </div>
              {cauHinh.nguoiHoTro.map((ht) => (
                <div key={ht.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-bold text-sm">{ht.ten}</div>
                    <div className="text-sm text-slate-600">{ht.dienThoai}</div>
                  </div>
                  <button
                    onClick={() =>
                      void luuCauHinh({
                        ...cauHinh,
                        nguoiHoTro: cauHinh.nguoiHoTro.filter((x) => x.id !== ht.id),
                      })
                    }
                    className="min-h-[52px] px-3 rounded-lg text-red-700 font-semibold text-sm"
                  >
                    Gỡ
                  </button>
                </div>
              ))}
              {cauHinh.nguoiHoTro.length < 3 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <input
                    type="text"
                    value={tenMoi}
                    onChange={(e) => setTenMoi(e.target.value)}
                    placeholder="Tên con/cháu"
                    className="flex-1 min-w-[140px] min-h-[52px] px-3 rounded-xl border border-slate-300 text-sm"
                  />
                  <input
                    type="tel"
                    value={sdtMoi}
                    onChange={(e) => setSdtMoi(e.target.value)}
                    placeholder="Số điện thoại"
                    className="flex-1 min-w-[140px] min-h-[52px] px-3 rounded-xl border border-slate-300 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (!tenMoi.trim()) return;
                      const moi: NguoiHoTro = {
                        id: `ht-${Date.now()}`,
                        ten: tenMoi.trim(),
                        dienThoai: sdtMoi.trim(),
                      };
                      setTenMoi('');
                      setSdtMoi('');
                      void luuCauHinh({ ...cauHinh, nguoiHoTro: [...cauHinh.nguoiHoTro, moi] });
                    }}
                    className="min-h-[52px] px-4 rounded-xl bg-slate-900 text-white font-bold text-sm"
                  >
                    Thêm
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert size={16} />
              <span>{tra(THU_KY_UI, 'LUU_Y_HA_TANG_TIEU_DE', lang)}</span>
            </div>
            <p>
              {tra(THU_KY_UI, 'LUU_Y_HA_TANG_NOI_DUNG', lang)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
