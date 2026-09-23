import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { ViewState } from '../App';
import { docPhien, kiemChiaKhoa, nhoConXacNhan } from '../tai-khoan';
import { khoangTuSo, NHAN_KHOANG, NHAN_AI_BAO } from '../lib/chia-khoa';
import { ChoConXacNhan } from './ChiaKhoaThuHai';

/**
 * ═════ NGÂN HÀNG MÔ PHỎNG — cho giám khảo thấy "chìa khoá thứ hai" chen vào đâu ═════
 *
 * ⚠️ §12 — KHÔNG phải ngân hàng thật, KHÔNG chặn giao dịch thật nào. Dải
 * "MÔ PHỎNG" luôn hiện, dính trên cùng, không tắt được.
 * ⚠️ §6.9 — tên người nhận và số tiền CHÍNH XÁC chỉ nằm trong state của màn này.
 * Lên máy chủ chỉ có MÃ khoảng tiền (`khoangTuSo`) và cờ "người nhận mới".
 */
type Buoc = 'nhap' | 'can_xac_nhan' | 'dang_cho' | 'khong_can';

export function ManNganHangMoPhong({ t, setView }: { t: (s: string) => string; setView: (v: ViewState) => void }) {
  const daDangNhap = docPhien() !== null;
  const [nguoiNhan, setNguoiNhan] = useState('');
  const [soTrieu, setSoTrieu] = useState('');
  const [nguoiMoi, setNguoiMoi] = useState(true);
  const [aiBao, setAiBao] = useState<'nguoi_la' | 'nguoi_quen' | 'khong_ro'>('nguoi_la');
  const [buoc, setBuoc] = useState<Buoc>('nhap');
  const [cho, setCho] = useState<{ yeuCauId: string; hetHan: number } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const khoang = khoangTuSo(Number(soTrieu.replace(',', '.')));

  const bamChuyen = async () => {
    setLoi(null);
    if (!khoang || !nguoiNhan.trim()) { setLoi(t('Bác nhập người nhận và số tiền trước.')); return; }
    try {
      const r = await kiemChiaKhoa(khoang, nguoiMoi);
      setBuoc(r.canXacNhan ? 'can_xac_nhan' : 'khong_can');
    } catch { setLoi(t('Chưa kiểm được. Kiểm tra mạng rồi thử lại.')); }
  };

  const nhoCon = async () => {
    setLoi(null);
    if (!khoang) return;
    try {
      setCho(await nhoConXacNhan({ khoangTien: khoang, hanhDong: 'chuyen_khoan', nguoiYeuCau: aiBao }));
      setBuoc('dang_cho');
    } catch (e: any) {
      setLoi(e?.ma === 'CHUA_NOI_VOI_AI' ? t('Bác chưa nối với con nào. Vào "Con cháu cài giúp" trước nhé.') : t('Chưa gửi được. Kiểm tra mạng rồi thử lại.'));
    }
  };

  const lamLai = () => { setBuoc('nhap'); setCho(null); setLoi(null); };
  const oNhap = 'w-full min-h-[52px] rounded-[14px] border-2 border-slate-400 px-3 text-[17px] text-slate-900 bg-white';
  const nutChinh = 'w-full min-h-[56px] rounded-[18px] bg-[#6d28d9] text-white font-black text-[17px] px-3 leading-snug';
  const chip = (chon: boolean) => `min-h-[52px] px-3 rounded-[16px] border-2 font-bold text-[16px] leading-snug ${chon ? 'bg-[#6d28d9] text-white border-[#6d28d9]' : 'bg-white text-[#2e1065] border-slate-300'}`;

  return (
    <div className="pb-24 max-w-xl mx-auto w-full overflow-y-auto">
      <div role="note" data-mo-phong="luon-hien" className="sticky top-0 z-10 bg-amber-300 text-amber-950 border-b-2 border-amber-800 px-4 py-3 text-[16px] font-black leading-snug text-center">
        {t('MÔ PHỎNG — ngân hàng thật chưa tích hợp Khoan Đã')}
      </div>
      <div className="p-4 flex flex-col gap-3">
        <button type="button" onClick={() => setView('chia_khoa')} className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#2e1065] font-bold text-[15px] self-start">
          <ChevronLeft size={22} aria-hidden="true" /> {t('Quay lại')}
        </button>
        <h1 className="text-[22px] font-black text-slate-900 leading-snug">{t('Ngân hàng mẫu · Chuyển khoản')}</h1>
        <p className="text-[15px] text-slate-700 leading-relaxed">{t('Tên người nhận và số tiền chỉ nằm trên máy này.')}</p>

        {!daDangNhap && (
          <button type="button" onClick={() => setView('con_cai_giup')} className={nutChinh}>{t('Con cháu cài giúp')}</button>
        )}

        {daDangNhap && buoc === 'nhap' && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-[15px] font-bold text-slate-700">{t('Người nhận')}</span>
              <input value={nguoiNhan} onChange={(e) => setNguoiNhan(e.target.value)} className={oNhap} autoComplete="off" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[15px] font-bold text-slate-700">{t('Số tiền (triệu đồng)')}</span>
              <input value={soTrieu} onChange={(e) => setSoTrieu(e.target.value)} inputMode="decimal" className={oNhap} />
            </label>
            {khoang && <p className="text-[15px] text-slate-700">{t('Lên máy chủ chỉ có khoảng:')} {t(NHAN_KHOANG[khoang])}</p>}
            <label className="flex items-center gap-3 min-h-[52px]">
              <input type="checkbox" className="w-6 h-6 shrink-0 accent-[#6d28d9]" checked={nguoiMoi} onChange={(e) => setNguoiMoi(e.target.checked)} />
              <span className="text-[16px] font-bold text-slate-800 leading-snug">{t('Lần đầu chuyển cho người này')}</span>
            </label>
            <button type="button" onClick={() => { void bamChuyen(); }} className={nutChinh}>{t('Chuyển')}</button>
          </>
        )}

        {buoc === 'can_xac_nhan' && (
          <div className="flex flex-col gap-3 rounded-[18px] border-2 border-[#2e1065] p-4">
            <p className="text-[20px] font-black text-[#2e1065] leading-snug">{t('Khoản này cần con xác nhận.')}</p>
            <p className="text-[15px] font-bold text-slate-700">{t('Ai bảo bác chuyển?')}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(NHAN_AI_BAO) as (keyof typeof NHAN_AI_BAO)[]).map((k) => (
                <button key={k} type="button" aria-pressed={aiBao === k} onClick={() => setAiBao(k)} className={chip(aiBao === k)}>{t(NHAN_AI_BAO[k])}</button>
              ))}
            </div>
            <button type="button" onClick={() => { void nhoCon(); }} className="w-full min-h-[56px] rounded-[18px] bg-[#6d28d9] text-white font-black text-[17px] px-3 leading-snug">
              {t('Gửi cho con')}
            </button>
            <button type="button" onClick={lamLai} className="w-full min-h-[52px] rounded-[18px] border-2 border-slate-400 text-slate-700 font-bold text-[16px] px-3 leading-snug">
              {t('Thôi, không chuyển nữa')}
            </button>
          </div>
        )}

        {buoc === 'dang_cho' && cho && (
          <>
            <ChoConXacNhan t={t} yeuCauId={cho.yeuCauId} hetHan={cho.hetHan} />
            <button type="button" onClick={lamLai} className="w-full min-h-[52px] rounded-[18px] border-2 border-slate-400 text-slate-700 font-bold text-[16px] px-3 leading-snug">
              {t('Thôi, không chuyển nữa')}
            </button>
          </>
        )}

        {buoc === 'khong_can' && (
          <div className="flex flex-col gap-3 rounded-[18px] border-2 border-slate-400 p-4">
            <p className="text-[17px] font-bold text-slate-800 leading-snug">{t('Khoản này không cần con xác nhận.')}</p>
            <button type="button" onClick={lamLai} className="w-full min-h-[52px] rounded-[18px] border-2 border-slate-400 text-slate-700 font-bold text-[16px] px-3 leading-snug">
              {t('Làm lại')}
            </button>
          </div>
        )}

        {loi && <p role="alert" className="text-[15px] font-bold text-rose-800 leading-snug">{loi}</p>}
      </div>
    </div>
  );
}
