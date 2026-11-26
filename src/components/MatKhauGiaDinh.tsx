import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Check, ShieldCheck, Trash2, Eye, Sparkles } from 'lucide-react';
import { tinhTinHieuNgay, taoMaGiongGiaDinh } from '../lib/tin-hieu-ngay';
import { TOTEM_UI, tra, type Lang } from '../catalog';

/**
 * MẬT KHẨU GIA ĐÌNH & TÍN HIỆU ĐỔI MỖI NGÀY — thứ deepfake không vượt qua được.
 *
 * - Mật khẩu miệng: app KHÔNG lưu mật khẩu, chỉ lưu câu gợi nhớ (§12).
 * - Tín hiệu đổi mỗi ngày: 8 màu × 16 biểu tượng × 90 số kiểm = 11.520 tổ hợp,
 *   sinh hạt giống bằng CSPRNG, hỗ trợ cả nhấn giữ cảm ứng lẫn giữ phím Space/Enter (§4.4).
 */

const KHOA = 'khoan_da_mat_khau_gia_dinh';

export interface MatKhauGiaDinhLuu {
  daLap: boolean;
  goiY: string;
  ngayLap: number;
}

export function docMatKhauGiaDinh(): MatKhauGiaDinhLuu | null {
  try {
    const t = JSON.parse(localStorage.getItem(KHOA) || 'null');
    return t && t.daLap === true ? t : null;
  } catch {
    return null;
  }
}

export function MatKhauGiaDinh({
  setView,
  t,
  lang = 'vi',
}: {
  setView: (v: any) => void;
  t: any;
  lang?: Lang;
}) {
  const [daLuu, setDaLuu] = useState<MatKhauGiaDinhLuu | null>(() => docMatKhauGiaDinh());
  const [goiY, setGoiY] = useState('');
  const [buoc, setBuoc] = useState<1 | 2>(daLuu ? 2 : 1);
  const [seedNgay, setSeedNgay] = useState<string>(() => {
    try {
      let s = localStorage.getItem('khoan_da_totem_seed') || '';
      if (!s) {
        s = taoMaGiongGiaDinh();
        localStorage.setItem('khoan_da_totem_seed', s);
      }
      return s;
    } catch {
      return taoMaGiongGiaDinh();
    }
  });
  const [nhapSeed, setNhapSeed] = useState('');
  const [dangXemTotem, setDangXemTotem] = useState(false);
  const [dangXemSeed, setDangXemSeed] = useState(false);
  const totemHomNay = tinhTinHieuNgay(seedNgay, Date.now(), lang);
  const chuTotem = (ma: string) => tra(TOTEM_UI, ma, lang) ?? '';

  const luu = () => {
    const m: MatKhauGiaDinhLuu = { daLap: true, goiY: goiY.trim(), ngayLap: Date.now() };
    try {
      localStorage.setItem(KHOA, JSON.stringify(m));
    } catch {
      // Không lưu được thì tính năng vẫn dùng được
    }
    setDaLuu(m);
    setBuoc(2);
  };

  const xoa = () => {
    try {
      localStorage.removeItem(KHOA);
    } catch {
      // không sao
    }
    setDaLuu(null);
    setGoiY('');
    setBuoc(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-start overflow-y-auto [&>*]:shrink-0 px-4 sm:px-6 pt-10 pb-28"
    >
      <div className="w-full max-w-[420px] flex items-center justify-between mb-4">
        <button
          onClick={() => setView('settings')}
          className="min-h-[52px] px-3 bg-white/80 rounded-2xl shadow-sm text-[#6d28d9] active:scale-95 transition-all flex items-center gap-1 font-bold text-[15px]"
        >
          <ChevronLeft size={20} />
          <span>{t('Quay lại')}</span>
        </button>
      </div>

      <div className="w-full max-w-[420px] flex flex-col items-center text-center mb-5">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 mb-3">
          <Users size={32} />
        </div>
        <h2 className="text-2xl font-black text-[#3b1d7d] mb-1">{t('Mật khẩu gia đình')}</h2>
        <p className="text-[15px] text-purple-900/80 leading-relaxed">
          {t('Một câu chỉ nhà mình biết. Ai xưng là con cháu mà không nói được — đừng làm theo.')}
        </p>
      </div>

      {buoc === 1 ? (
        <>
          <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-5">
            <h3 className="font-black text-[17px] text-[#311068] mb-3">{t('Cách làm')}</h3>
            <ol className="flex flex-col gap-3">
              {[
                t('Gọi cả nhà lại: con cháu, vợ chồng.'),
                t('Chọn MỘT câu người ngoài không đoán được. Ví dụ: tên con chó hồi ở quê.'),
                t('Nói miệng thôi. ĐỪNG nhắn qua Zalo hay tin nhắn.'),
              ].map((cau, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#7c3aed] text-white font-black text-[15px] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[15px] text-slate-700 leading-relaxed">{cau}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-5">
            <h3 className="font-black text-[17px] text-[#311068] mb-1">{t('Câu nhắc cho bác')}</h3>
            <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
              {t('Khoan Đã KHÔNG giữ mật khẩu. Đây chỉ là câu nhắc cho bác.')}
            </p>
            <input
              value={goiY}
              onChange={(e) => setGoiY(e.target.value)}
              placeholder={t('Ví dụ: con vật nhà mình nuôi hồi ở quê')}
              maxLength={80}
              className="w-full min-h-[52px] px-4 rounded-2xl border-2 border-purple-200 bg-purple-50/50 text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <button
            onClick={luu}
            className="w-full max-w-[420px] min-h-[56px] px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 active:scale-95 text-white font-extrabold rounded-2xl text-[17px] flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Check size={20} />
            <span>{t('Cả nhà đã thống nhất xong')}</span>
          </button>
        </>
      ) : (
        <>
          <div className="w-full max-w-[420px] bg-emerald-50 border-2 border-emerald-400 rounded-[26px] p-5 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={22} className="text-emerald-700 shrink-0" />
              <h3 className="font-black text-[17px] text-emerald-900">{t('Nhà mình đã có mật khẩu')}</h3>
            </div>
            {daLuu?.goiY ? (
              <p className="text-[16px] text-emerald-900 leading-relaxed">
                {t('Câu nhắc của bác:')} <strong>{daLuu.goiY}</strong>
              </p>
            ) : (
              <p className="text-[15px] text-emerald-900/80 leading-relaxed">
                {t('Bác không ghi câu nhắc nào — chỉ cần nhớ trong đầu là đủ.')}
              </p>
            )}
          </div>

          <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mb-5">
            <h3 className="font-black text-[17px] text-[#311068] mb-2">{t('Khi nào dùng')}</h3>
            <ul className="flex flex-col gap-2 text-[15px] text-slate-700 leading-relaxed">
              <li>{t('· Có người gọi điện, xưng là con cháu, giục chuyển tiền.')}</li>
              <li>{t('· Gọi video mà mặt và giọng giống hệt người nhà — máy tính bây giờ làm giả được cả hai.')}</li>
              <li>{t('· Bác hỏi: mật khẩu nhà mình là gì? Người nhà thật trả lời được ngay.')}</li>
            </ul>
          </div>

          <button
            onClick={xoa}
            className="w-full max-w-[420px] min-h-[52px] px-4 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 font-bold rounded-2xl text-[15px] border-2 border-slate-200 flex items-center justify-center gap-2 transition-all mb-5"
          >
            <Trash2 size={18} />
            <span>{t('Đổi mật khẩu khác')}</span>
          </button>
        </>
      )}

      {/* Tín hiệu gia đình đổi mỗi ngày (Daily Family Totem — 11.520 tổ hợp, hỗ trợ cả bàn phím A11y) */}
      <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] mt-2 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#7c3aed] shrink-0" />
          <h3 className="font-black text-[17px] text-[#311068]">{chuTotem('TIEU_DE')}</h3>
        </div>
        <p className="text-[14px] text-slate-600 leading-relaxed">{chuTotem('MO_TA')}</p>

        <button
          type="button"
          aria-pressed={dangXemTotem}
          onPointerDown={() => setDangXemTotem(true)}
          onPointerUp={() => setDangXemTotem(false)}
          onPointerLeave={() => setDangXemTotem(false)}
          onPointerCancel={() => setDangXemTotem(false)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              setDangXemTotem(true);
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') setDangXemTotem(false);
          }}
          onBlur={() => setDangXemTotem(false)}
          style={
            dangXemTotem
              ? { backgroundColor: totemHomNay.mau.nenHex, color: totemHomNay.mau.maHex }
              : undefined
          }
          className="w-full min-h-[64px] px-4 py-3 rounded-2xl border-2 border-dashed border-[#7c3aed] bg-purple-50 text-[#311068] font-black text-[17px] flex items-center justify-center gap-2 select-none touch-none"
        >
          <Eye size={20} className="shrink-0" />
          <span>{dangXemTotem ? totemHomNay.chuoiHienThi : chuTotem('GIU_XEM_TOTEM')}</span>
        </button>

        <div className="text-[14px] text-slate-700 bg-slate-50 rounded-xl p-3 flex items-center justify-between gap-2">
          <button
            type="button"
            aria-pressed={dangXemSeed}
            onPointerDown={() => setDangXemSeed(true)}
            onPointerUp={() => setDangXemSeed(false)}
            onPointerLeave={() => setDangXemSeed(false)}
            onPointerCancel={() => setDangXemSeed(false)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setDangXemSeed(true);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ' || e.key === 'Enter') setDangXemSeed(false);
            }}
            onBlur={() => setDangXemSeed(false)}
            className="min-h-[52px] px-2 text-left flex items-center gap-1.5 select-none touch-none"
          >
            <Eye size={16} className="text-slate-500 shrink-0" />
            <span>
              {chuTotem('MA_GHEP_NHAN')}{' '}
              <b className="font-mono tracking-wider">{dangXemSeed ? seedNgay : '••••••••'}</b>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              const moi = taoMaGiongGiaDinh();
              setSeedNgay(moi);
              try {
                localStorage.setItem('khoan_da_totem_seed', moi);
              } catch {
                // ignore
              }
            }}
            className="min-h-[52px] px-3 rounded-xl bg-white border border-slate-300 font-bold text-slate-800 text-[14px] shrink-0"
          >
            {chuTotem('DOI_MA')}
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={nhapSeed}
            onChange={(e) => setNhapSeed(e.target.value.toUpperCase())}
            placeholder={chuTotem('NHAP_MA_PLACEHOLDER')}
            maxLength={12}
            className="flex-1 min-h-[52px] px-3 rounded-xl border border-slate-300 text-[14px] font-mono"
          />
          <button
            type="button"
            onClick={() => {
              const s = nhapSeed.trim().toUpperCase();
              if (s.length < 4) return;
              setSeedNgay(s);
              setNhapSeed('');
              try {
                localStorage.setItem('khoan_da_totem_seed', s);
              } catch {
                // ignore
              }
            }}
            className="min-h-[52px] px-4 rounded-xl bg-[#311068] text-white font-bold text-[14px]"
          >
            {chuTotem('DONG_BO')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
