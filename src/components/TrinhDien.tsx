import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MessageSquare, Landmark, ShieldCheck, Phone, PhoneOff } from 'lucide-react';
import { WarningView, type KetQuaPhanTich, type NguoiThan, type ViewState } from '../App';
import { HoiNhanhView } from './HoiNhanh';
import { TheCanhBaoCon, CAU_LOAI_SU_KIEN } from './TheCanhBaoCon';
import { TraLoiHoiCon, type ApiTraLoiHoiCon } from './TraLoiHoiCon';
import type { ApiHoiCon } from './HoiCon';
import type { KetQuaHoiCon, TraLoiHoi } from '../tai-khoan';
import type { HanhDong } from '../lib/ket-qua-can-thiep';
import { t as dich, type Lang } from '../i18n';
import {
  moKenh, coKenh, tenKenhHopLe, MA_KICH_BAN, type MaKichBan, type TinTrinhDien, type VaiMay,
} from '../lib/kenh-trinh-dien';

/**
 * ══════════════ MÀN TRÌNH DIỄN CHO GIÁM KHẢO — `/?trinhDien=1` (23/9/2026) ══════════════
 *
 * Một máy tính, hai "điện thoại": bên trái máy của bác Lan, bên phải máy của Minh
 * (con). Bấm một tình huống là cả vòng chạy trong khoảng 30 giây — màn đỏ bật, máy
 * con đổ thông báo, con gọi lại — không cần gọi điện thật, không cần mạng hội trường.
 *
 * ⚠️ §11 — DẢI "MÔ PHỎNG" LUÔN HIỆN, và nói đúng cái gì là thật, cái gì là giả:
 *    màn hình là MÀN THẬT của app (WarningView, HoiNhanhView, TheCanhBaoCon,
 *    TraLoiHoiCon — cùng component bản thật dùng); cuộc gọi, tin nhắn và đường
 *    truyền giữa hai máy là giả lập (`lib/kenh-trinh-dien.ts`).
 * ⚠️ KHÔNG QUAY SỐ THẬT, KHÔNG GỌI MÁY CHỦ, KHÔNG GHI SỐ LIỆU: màn cảnh báo chạy với
 *    `moPhong` (mọi chặn của diễn tập), nút hỏi con và thẻ trả lời chạy trên bản
 *    giả lập. Số điện thoại hiện ra là số hư cấu ("09xx xxx 111").
 * ⚠️ Hai máy là hai <iframe> 390px — để các lớp `sm:`/`md:`/`lg:` thấy đúng bề rộng
 *    điện thoại, cùng lý do với `khung-dien-thoai.ts`.
 */

const SO_MINH = '09xx xxx 111';
const SO_BAC = '09xx xxx 222';
const GIA_DINH_BAC: NguoiThan[] = [{ id: 1, name: 'Minh', relation: 'Con trai', phone: SO_MINH }];

const NHAN_KICH_BAN: Record<MaKichBan, string> = {
  otp: '① Cuộc gọi + mã OTP',
  xung_con: '② Người gọi xưng là con',
  tien_ra: '③ Tiền vừa ra trong lúc gọi',
};
const MO_TA_KICH_BAN: Record<MaKichBan, string> = {
  otp: 'Bác Lan đang nghe một người xưng công an. Mã OTP vừa tới.',
  xung_con: 'Một số lạ gọi, xưng là con. Bác Lan mở Khoan Đã.',
  tien_ra: 'Đang trong cuộc gọi thì tiền vừa ra khỏi tài khoản.',
};
const XUNG_LA: Record<MaKichBan, string> = {
  otp: 'Xưng là: công an quận',
  xung_con: 'Xưng là: con trai, số mới',
  tien_ra: 'Xưng là: nhân viên ngân hàng',
};
const LY_DO_TU_BAT: Record<Exclude<MaKichBan, 'xung_con'>, NonNullable<KetQuaPhanTich['lyDoTuBat']>> = {
  otp: 'otp_trong_cuoc_goi',
  tien_ra: 'tien_ra_trong_cuoc_goi',
};

const dungT = (lang: Lang) => (k: string) => dich(k as never, lang);
const mmss = (giay: number) => `${String(Math.floor(giay / 60)).padStart(2, '0')}:${String(giay % 60).padStart(2, '0')}`;
const thay = (cau: string, ten: string) => cau.split('{ten}').join(ten);

// ─────────────────────────── Bảng điều khiển ───────────────────────────

export function ManTrinhDien() {
  const [lang, setLang] = useState<Lang>(() => (new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'vi'));
  const kenh = useMemo(() => Math.random().toString(36).slice(2, 12).padEnd(8, '0'), []);
  const kenhRef = useRef<ReturnType<typeof moKenh> | null>(null);
  const [dangChon, setDangChon] = useState<MaKichBan | null>(null);
  const t = dungT(lang);

  useEffect(() => {
    if (!coKenh()) return;
    const k = moKenh(kenh, () => undefined);
    kenhRef.current = k;
    return () => { k.dong(); kenhRef.current = null; };
  }, [kenh]);

  const chon = (ma: MaKichBan) => { setDangChon(ma); kenhRef.current?.gui({ loai: 'kich_ban', ma }); };
  const lamLai = () => { setDangChon(null); kenhRef.current?.gui({ loai: 'lam_lai' }); };
  const doiNgonNgu = () => { setDangChon(null); setLang((l) => (l === 'vi' ? 'en' : 'vi')); };
  const src = (vai: VaiMay) => `/?trinhDien=${vai}&kenh=${kenh}&lang=${lang}`;

  const nut = 'min-h-[52px] px-4 rounded-[16px] font-bold text-[16px] leading-snug border-2';
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f5f3ff] to-[#eef2ff] flex flex-col">
      <div role="note" data-mo-phong="luon-hien" className="sticky top-0 z-10 bg-amber-300 text-amber-950 border-b-2 border-amber-800 px-4 py-2 text-[15px] font-black text-center leading-snug">
        {t('MÔ PHỎNG — hai màn hình là màn thật của app; cuộc gọi, tin nhắn và đường truyền giữa hai máy là giả lập.')}
      </div>
      <header className="flex flex-wrap items-center gap-3 px-6 pt-3 pb-2">
        <h1 className="text-[22px] font-black text-[#2e1065] mr-auto leading-snug">{t('Khoan Đã — Trình diễn')}</h1>
        {MA_KICH_BAN.map((ma) => (
          <button key={ma} type="button" aria-pressed={dangChon === ma} onClick={() => chon(ma)}
            className={`${nut} ${dangChon === ma ? 'bg-[#6d28d9] text-white border-[#6d28d9]' : 'bg-white text-[#2e1065] border-[#6d28d9]'}`}>
            {t(NHAN_KICH_BAN[ma])}
          </button>
        ))}
        <button type="button" onClick={lamLai} className={`${nut} bg-white text-slate-800 border-slate-400`}>{t('Làm lại')}</button>
        <button type="button" onClick={doiNgonNgu} className={`${nut} bg-white text-slate-800 border-slate-400`}>{t('Xem bằng tiếng Anh')}</button>
      </header>
      {!coKenh() && (
        <p role="alert" className="px-6 text-[16px] font-bold text-rose-800">{t('Trình duyệt này không chạy được màn trình diễn. Dùng Chrome hoặc Edge bản mới.')}</p>
      )}
      <p className="px-6 min-h-[28px] text-[16px] text-slate-700 leading-snug">{dangChon ? t(MO_TA_KICH_BAN[dangChon]) : t('Chọn một tình huống ở trên.')}</p>
      <main className="flex-1 flex flex-wrap items-start justify-center gap-10 px-6 pb-6 pt-2">
        {(['bac', 'con'] as VaiMay[]).map((vai) => (
          <figure key={vai} className="flex flex-col items-center gap-2 m-0">
            <figcaption className="text-[16px] font-black text-[#2e1065]">{t(vai === 'bac' ? 'Máy của bác Lan' : 'Máy của Minh (con)')}</figcaption>
            <div className="box-content w-[390px] h-[min(844px,calc(100vh_-_200px))] min-h-[560px] rounded-[38px] bg-[#14122b] p-[10px] shadow-[0_30px_70px_-18px_rgba(30,27,58,0.55)]">
              <iframe key={`${vai}-${lang}`} src={src(vai)} title={t(vai === 'bac' ? 'Máy của bác Lan' : 'Máy của Minh (con)')}
                allow="autoplay" className="block w-full h-full border-0 rounded-[29px] bg-[#f8f4ff]" />
            </div>
          </figure>
        ))}
      </main>
    </div>
  );
}

// ─────────────────────────── Một máy (bên trong iframe) ───────────────────────────

export function MayTrinhDien({ vai }: { vai: VaiMay }) {
  const thamSo = new URLSearchParams(window.location.search);
  const lang: Lang = thamSo.get('lang') === 'en' ? 'en' : 'vi';
  const kenh = tenKenhHopLe(thamSo.get('kenh'));
  const t = dungT(lang);
  if (!kenh || !coKenh()) {
    return <p className="p-6 text-[16px] font-bold text-rose-800">{t('Trình duyệt này không chạy được màn trình diễn. Dùng Chrome hoặc Edge bản mới.')}</p>;
  }
  return vai === 'bac' ? <MayCuaBac t={t} lang={lang} kenh={kenh} /> : <MayCuaCon t={t} lang={lang} kenh={kenh} />;
}

type T = (k: string) => string;
type TrangThaiGoi = 'do_chuong' | 'dang_goi' | 'dang_noi';

function useKenh(kenh: string, khiCoTin: (tin: TinTrinhDien) => void) {
  const ref = useRef<ReturnType<typeof moKenh> | null>(null);
  const xuLy = useRef(khiCoTin);
  xuLy.current = khiCoTin;
  useEffect(() => {
    const k = moKenh(kenh, (tin) => xuLy.current(tin));
    ref.current = k;
    return () => { k.dong(); ref.current = null; };
  }, [kenh]);
  return (tin: TinTrinhDien) => ref.current?.gui(tin);
}

/** Tên hiển thị trong cuộc gọi giả lập. */
function ManGoi({ t, ten, kieu, trangThai, onNghe, onCup }: {
  t: T; ten: string; kieu: 'den' | 'di'; trangThai: TrangThaiGoi; onNghe?: () => void; onCup: () => void;
}) {
  const [giay, setGiay] = useState(0);
  useEffect(() => {
    if (trangThai !== 'dang_noi') return undefined;
    setGiay(0);
    const id = window.setInterval(() => setGiay((g) => g + 1), 1000);
    return () => window.clearInterval(id);
  }, [trangThai]);
  const tieuDe = thay(trangThai === 'dang_noi' ? t('Đang nói chuyện với {ten}') : kieu === 'den' ? t('{ten} đang gọi') : t('Đang gọi {ten}…'), ten);
  const doChuong = kieu === 'den' && trangThai === 'do_chuong';
  return (
    <div role="dialog" aria-label={tieuDe} className="absolute inset-0 z-[200] bg-[#0b1020] text-white flex flex-col items-center px-6 pt-20 pb-10">
      <p className="text-[14px] font-black text-amber-300">{t('MÔ PHỎNG')}</p>
      <p className="text-[28px] font-black mt-4 text-center leading-snug">{tieuDe}</p>
      {trangThai === 'dang_noi' && <p className="text-[18px] text-white/85 mt-2 tabular-nums">{mmss(giay)}</p>}
      <div className={`mt-auto w-full grid gap-3 ${doChuong ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button type="button" onClick={onCup} className="min-h-[64px] rounded-full bg-red-700 text-white font-black text-[18px] flex items-center justify-center gap-2">
          <PhoneOff size={22} aria-hidden="true" /> {doChuong ? t('Từ chối') : t('Kết thúc')}
        </button>
        {doChuong && onNghe && (
          <button type="button" onClick={onNghe} className="min-h-[64px] rounded-full bg-emerald-700 text-white font-black text-[18px] flex items-center justify-center gap-2">
            <Phone size={22} aria-hidden="true" /> {t('Nghe')}
          </button>
        )}
      </div>
    </div>
  );
}

function ManCho({ t, cau }: { t: T; cau: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#ede9fe] to-[#f8f4ff] px-6 text-center">
      <ShieldCheck size={52} className="text-[#6d28d9]" aria-hidden="true" />
      <p className="text-[22px] font-black text-[#2e1065] leading-snug">{t(cau)}</p>
      <p className="text-[15px] text-slate-700 leading-snug">{t('Chọn một tình huống ở bảng điều khiển.')}</p>
    </div>
  );
}

/** Màn cuộc gọi của điện thoại lúc tình huống bắt đầu — giả lập, không phải màn của Khoan Đã. */
function ManCuocGoiLa({ t, kichBan, onTiep }: { t: T; kichBan: MaKichBan; onTiep: () => void }) {
  const [giay, setGiay] = useState(372);
  const [hienTin, setHienTin] = useState(false);
  const tiep = useRef(onTiep);
  tiep.current = onTiep;
  useEffect(() => {
    const a = window.setInterval(() => setGiay((g) => g + 1), 1000);
    const b = window.setTimeout(() => setHienTin(true), 700);
    const c = window.setTimeout(() => tiep.current(), 2800);
    return () => { window.clearInterval(a); window.clearTimeout(b); window.clearTimeout(c); };
  }, []);
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#1f2937] to-[#0b1020] text-white flex flex-col items-center px-5 pt-24 pb-10">
      <p className="text-[15px] text-white/80 tabular-nums">{t('Cuộc gọi')} · {mmss(giay)}</p>
      <p className="text-[30px] font-black mt-2">{t('Số lạ')}</p>
      <p className="text-[17px] text-white/90 mt-1">{t(XUNG_LA[kichBan])}</p>
      {kichBan === 'xung_con' && (
        <p className="mt-8 rounded-[20px] bg-white/10 border border-white/25 p-4 text-[18px] leading-snug text-center">
          {t('“Mẹ ơi, con đây. Con đổi số, đang cần tiền gấp…”')}
        </p>
      )}
      {hienTin && kichBan !== 'xung_con' && (
        <div role="status" className="absolute top-3 inset-x-3 rounded-[20px] bg-white text-slate-900 p-3 shadow-xl">
          <p className="text-[14px] font-bold text-slate-700 flex items-center gap-1.5">
            {kichBan === 'otp' ? <MessageSquare size={16} aria-hidden="true" /> : <Landmark size={16} aria-hidden="true" />}
            {t(kichBan === 'otp' ? 'Tin nhắn' : 'Ngân hàng')} · {t('bây giờ')}
          </p>
          <p className="text-[16px] font-semibold leading-snug mt-1">
            {t(kichBan === 'otp' ? 'Mã OTP của bạn là 123456. Không chia sẻ mã này.' : 'TK …1234: -20.000.000 VND lúc 10:02.')}
          </p>
        </div>
      )}
      <button type="button" onClick={() => tiep.current()} className="mt-auto min-h-[56px] px-10 rounded-full bg-white/15 border-2 border-white/50 text-[17px] font-bold">
        {t('Tiếp')}
      </button>
    </div>
  );
}

// ─────────────────────────── Máy của bác ───────────────────────────

function MayCuaBac({ t, lang, kenh }: { t: T; lang: Lang; kenh: string }) {
  const [man, setMan] = useState<'cho' | 'cuoc_goi' | 'canh_bao' | 'hoi_nhanh'>('cho');
  const [kichBan, setKichBan] = useState<MaKichBan | null>(null);
  const [ketQua, setKetQua] = useState<KetQuaPhanTich | null>(null);
  const [phien, setPhien] = useState(0);
  const [goiDen, setGoiDen] = useState<TrangThaiGoi | null>(null);
  const [goiDi, setGoiDi] = useState<TrangThaiGoi | null>(null);
  const hoiRef = useRef<{ hoiId: string; hetHan: number; traLoi: { ten: string; traLoi: TraLoiHoi; luc: number }[] } | null>(null);

  const datLai = () => { hoiRef.current = null; setGoiDen(null); setGoiDi(null); setKetQua(null); setPhien((p) => p + 1); };
  const gui = useKenh(kenh, (tin) => {
    switch (tin.loai) {
      case 'kich_ban': datLai(); setKichBan(tin.ma); setMan('cuoc_goi'); break;
      case 'lam_lai': datLai(); setKichBan(null); setMan('cho'); break;
      case 'tra_loi':
        if (hoiRef.current?.hoiId === tin.hoiId) hoiRef.current.traLoi.push({ ten: 'Minh', traLoi: tin.traLoi, luc: tin.luc });
        break;
      case 'goi': if (tin.tu === 'con') setGoiDen('do_chuong'); break;
      case 'nghe': if (tin.tu === 'con') setGoiDi((g) => (g ? 'dang_noi' : g)); break;
      case 'cup': if (tin.tu === 'con') { setGoiDen(null); setGoiDi(null); } break;
      default: break;
    }
  });

  const goiMinh = () => { setGoiDi('dang_goi'); gui({ loai: 'goi', tu: 'bac' }); };
  const cup = () => { setGoiDen(null); setGoiDi(null); gui({ loai: 'cup', tu: 'bac' }); };

  const vaoKhoanDa = () => {
    if (!kichBan) return;
    if (kichBan === 'xung_con') { setMan('hoi_nhanh'); return; }
    const lyDoTuBat = LY_DO_TU_BAT[kichBan];
    setKetQua({ canThiep: 'PAUSE_60S', tuBamDung: true, maLyDo: [], daKiem: [], chuaKiem: [], lyDoTuBat, moPhong: true });
    setMan('canh_bao');
    // Như máy thật khi bác ĐÃ bật "báo cho con" — trong trình diễn coi như đã bật.
    gui({ loai: 'bao_dong', loaiSuKien: lyDoTuBat, luc: Date.now() });
  };

  const apiHoiCon: ApiHoiCon = {
    hoi: async () => {
      const hoiId = `trinh-dien-${Date.now()}`;
      const hetHan = Date.now() + 5 * 60 * 1000;
      hoiRef.current = { hoiId, hetHan, traLoi: [] };
      gui({ loai: 'hoi_con', hoiId, hetHan });
      return { hoiId, hetHan, guiToi: [{ ten: 'Minh', trangThai: 'DA_DAY_DI' }] };
    },
    doc: async (id: string): Promise<KetQuaHoiCon> => {
      const h = hoiRef.current;
      return {
        hoiId: id, tenBoMe: t('Bác Lan'), hetHan: h?.hetHan ?? 0, conHan: Date.now() <= (h?.hetHan ?? 0),
        traLoi: [...(h?.traLoi ?? [])], guiToi: [{ ten: 'Minh', trangThai: 'DA_DAY_DI' }],
      };
    },
    goi: () => goiMinh(),
  };

  const khiHanhDong = (ma: HanhDong) => {
    gui({ loai: 'hanh_dong', ma, luc: Date.now() });
    if (ma === 'bam_goi_nguoi_than') goiMinh();
  };
  const setView = (v: ViewState) => { if (v === 'home') { setMan('cho'); setKichBan(null); } };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#f8f4ff]">
      {man === 'cho' && <ManCho t={t} cau="Bác Lan đang ở nhà" />}
      {man === 'cuoc_goi' && kichBan && <ManCuocGoiLa key={phien} t={t} kichBan={kichBan} onTiep={vaoKhoanDa} />}
      {man === 'canh_bao' && ketQua && (
        <WarningView key={phien} setView={setView} t={t} lang={lang} result={ketQua} familyMembers={GIA_DINH_BAC}
          noiChayAi={null} mayCoUngDungLa={null} onBaoDaChuyen={() => undefined} onHanhDongMoPhong={khiHanhDong} />
      )}
      {man === 'hoi_nhanh' && (
        <div className="absolute inset-0 overflow-y-auto">
          <HoiNhanhView key={phien} setView={setView} t={t} lang={lang} familyMembers={GIA_DINH_BAC} hoiConApi={apiHoiCon}
            onTriggerEmergency={() => {
              setKetQua({ canThiep: 'PAUSE_60S', tuBamDung: true, maLyDo: [], daKiem: [], chuaKiem: [], moPhong: true });
              setMan('canh_bao');
            }} />
        </div>
      )}
      {goiDen && <ManGoi t={t} ten="Minh" kieu="den" trangThai={goiDen} onCup={cup}
        onNghe={() => { setGoiDen('dang_noi'); gui({ loai: 'nghe', tu: 'bac' }); }} />}
      {!goiDen && goiDi && <ManGoi t={t} ten="Minh" kieu="di" trangThai={goiDi} onCup={cup} />}
    </div>
  );
}

// ─────────────────────────── Máy của con ───────────────────────────

function VoCon({ t, children }: { t: T; children: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-slate-50">
      <p className="px-5 pt-5 pb-2 text-[15px] font-black text-sky-800">{t('Khoan Đã · Con cháu')}</p>
      <div className="px-4 pb-6 flex flex-col gap-4">{children}</div>
    </div>
  );
}

/** Thông báo đẩy giả lập trên màn khoá của máy con. Tự mở sau 2 giây, chạm để mở ngay. */
function ThongBaoGia({ t, tieuDe, noiDung, onMo }: { t: T; tieuDe: string; noiDung: string; onMo: () => void }) {
  const mo = useRef(onMo);
  mo.current = onMo;
  useEffect(() => {
    const id = window.setTimeout(() => mo.current(), 2000);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <button type="button" onClick={() => mo.current()} className="absolute top-3 inset-x-3 z-10 text-left rounded-[20px] bg-white text-slate-900 p-3 shadow-xl border border-slate-200 min-h-[52px]">
      <span className="block text-[14px] font-bold text-slate-700">Khoan Đã · {t('bây giờ')}</span>
      <span className="block text-[16px] font-black leading-snug mt-1">{tieuDe}</span>
      <span className="block text-[15px] leading-snug mt-0.5">{noiDung}</span>
    </button>
  );
}

function MayCuaCon({ t, lang, kenh }: { t: T; lang: Lang; kenh: string }) {
  const [man, setMan] = useState<'cho' | 'thong_bao' | 'the' | 'hoi'>('cho');
  const [loaiSuKien, setLoaiSuKien] = useState<string | undefined>(undefined);
  const [hanhDong, setHanhDong] = useState<{ ma: string; luc: number }[]>([]);
  const [thongBao, setThongBao] = useState<{ tieuDe: string; noiDung: string; toi: 'the' | 'hoi' } | null>(null);
  const [goiDen, setGoiDen] = useState<TrangThaiGoi | null>(null);
  const [goiDi, setGoiDi] = useState<TrangThaiGoi | null>(null);
  const [phien, setPhien] = useState(0);
  const hoiChoRef = useRef<{ hoiId: string; tenBoMe: string; hetHan: number }[]>([]);
  const tenBac = t('Bác Lan');

  const datLai = () => {
    hoiChoRef.current = []; setLoaiSuKien(undefined); setHanhDong([]); setThongBao(null);
    setGoiDen(null); setGoiDi(null); setPhien((p) => p + 1); setMan('cho');
  };
  const gui = useKenh(kenh, (tin) => {
    switch (tin.loai) {
      case 'kich_ban': case 'lam_lai': datLai(); break;
      case 'bao_dong':
        setLoaiSuKien(tin.loaiSuKien);
        setHanhDong([]);
        setThongBao({
          tieuDe: thay(t('{ten} đang cần anh/chị'), tenBac),
          noiDung: thay(t(CAU_LOAI_SU_KIEN[tin.loaiSuKien] ?? ''), tenBac),
          toi: 'the',
        });
        setMan('thong_bao');
        break;
      case 'hanh_dong': setHanhDong((ds) => [...ds, { ma: tin.ma, luc: tin.luc }]); break;
      case 'hoi_con':
        hoiChoRef.current = [{ hoiId: tin.hoiId, tenBoMe: tenBac, hetHan: tin.hetHan }];
        setThongBao({ tieuDe: thay(t('{ten} hỏi: có phải anh/chị đang gọi không?'), tenBac), noiDung: t('Mở để trả lời.'), toi: 'hoi' });
        setMan('thong_bao');
        break;
      case 'goi': if (tin.tu === 'bac') setGoiDen('do_chuong'); break;
      case 'nghe': if (tin.tu === 'bac') setGoiDi((g) => (g ? 'dang_noi' : g)); break;
      case 'cup': if (tin.tu === 'bac') { setGoiDen(null); setGoiDi(null); } break;
      default: break;
    }
  });

  const goiBac = () => { setGoiDi('dang_goi'); gui({ loai: 'goi', tu: 'con' }); };
  const cup = () => { setGoiDen(null); setGoiDi(null); gui({ loai: 'cup', tu: 'con' }); };
  const apiTraLoi: ApiTraLoiHoiCon = {
    dangCho: async () => ({ hoi: hoiChoRef.current }),
    traLoi: async (id: string, traLoi: TraLoiHoi) => {
      gui({ loai: 'tra_loi', hoiId: id, traLoi, luc: Date.now() });
      hoiChoRef.current = hoiChoRef.current.filter((h) => h.hoiId !== id);
      return { daGhi: true };
    },
    goiBoMe: () => goiBac(),
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-50">
      {(man === 'cho' || man === 'thong_bao') && <ManCho t={t} cau="Minh đang ở công ty" />}
      {man === 'thong_bao' && thongBao && (
        <ThongBaoGia key={phien} t={t} tieuDe={thongBao.tieuDe} noiDung={thongBao.noiDung} onMo={() => setMan(thongBao.toi)} />
      )}
      {man === 'the' && (
        <VoCon t={t}>
          <TheCanhBaoCon t={t} lang={lang === 'en' ? 'en' : 'vi'} tenBoMe={tenBac} loaiSuKien={loaiSuKien}
            hanhDong={hanhDong} soBoMe={SO_BAC} onGoiNgay={goiBac} />
        </VoCon>
      )}
      {man === 'hoi' && (
        <VoCon t={t}>
          <TraLoiHoiCon key={phien} t={t} coPhien soBoMe={SO_BAC} api={apiTraLoi} nhipMs={700} />
        </VoCon>
      )}
      {goiDen && <ManGoi t={t} ten={tenBac} kieu="den" trangThai={goiDen} onCup={cup}
        onNghe={() => { setGoiDen('dang_noi'); gui({ loai: 'nghe', tu: 'con' }); }} />}
      {!goiDen && goiDi && <ManGoi t={t} ten={tenBac} kieu="di" trangThai={goiDi} onCup={cup} />}
    </div>
  );
}
