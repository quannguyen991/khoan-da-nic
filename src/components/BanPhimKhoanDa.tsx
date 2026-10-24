import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Keyboard, Settings2, ShieldAlert } from 'lucide-react';
import type { ViewState } from '../App';
import { TRUNG_TAM_BAO_VE as CHU, tra, type Lang } from '../catalog';
import { chonBanPhimKhoanDa, laApk, moCaiDatBanPhimKhoanDa, trangThaiBanPhimKhoanDa } from '../native';

export function BanPhimKhoanDa({ setView, lang }: { setView: (view: ViewState) => void; lang: Lang }) {
  const [apk, setApk] = useState(false);
  const [bat, setBat] = useState<boolean | null>(null);
  const [loi, setLoi] = useState('');
  const chu = (ma: string) => tra(CHU, ma, lang) ?? '';
  const capNhat = async () => {
    const la = await laApk(); setApk(la);
    setBat(la ? await trangThaiBanPhimKhoanDa() : false);
  };
  useEffect(() => {
    void capNhat();
    const khiHien = () => { if (document.visibilityState === 'visible') void capNhat(); };
    document.addEventListener('visibilitychange', khiHien);
    return () => document.removeEventListener('visibilitychange', khiHien);
  }, []);
  const caiDat = async () => {
    setLoi('');
    if (!await moCaiDatBanPhimKhoanDa()) setLoi(chu('KEYBOARD_SETTINGS_FAILED'));
  };
  const chon = async () => {
    setLoi('');
    if (!bat) { setLoi(chu('KEYBOARD_ENABLE_FIRST')); return; }
    if (!await chonBanPhimKhoanDa()) setLoi(chu('KEYBOARD_PICKER_FAILED'));
  };
  const nut = 'min-h-[56px] w-full rounded-2xl border-2 border-[#2e1065] px-4 py-3 text-left text-[16px] font-bold';
  return <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-4 text-[#1e1b4b]">
    <button type="button" onClick={() => setView('trung_tam_bao_ve')} className="mb-3 flex min-h-[52px] items-center gap-2 font-bold"><ArrowLeft size={22} aria-hidden="true" />{chu('BACK')}</button>
    <h1 className="text-[26px] font-black leading-snug">{chu('KEYBOARD_TITLE')}</h1>
    <p className="mt-2 text-[16px] leading-relaxed">{chu('KEYBOARD_HELP')}</p>
    <div role="status" className={`mt-4 rounded-2xl border-2 p-4 text-[16px] font-bold ${bat ? 'border-emerald-800 bg-emerald-50' : 'border-amber-800 bg-amber-50'}`}>
      {bat === null ? chu('KEYBOARD_STATUS_UNKNOWN') : bat ? <><Check size={20} className="mr-2 inline" aria-hidden="true" />{chu('KEYBOARD_ENABLED')}</> : apk ? chu('KEYBOARD_DISABLED') : chu('KEYBOARD_APK_ONLY')}
    </div>
    <section className="mt-4 rounded-[22px] border-2 border-[#2e1065] bg-white p-4 shadow-[3px_3px_0_#2e1065]">
      <h2 className="flex items-center gap-2 text-[19px] font-black"><Keyboard size={22} aria-hidden="true" />{chu('KEYBOARD_SETUP_TITLE')}</h2>
      <p className="mt-2 text-[15px] leading-relaxed">{chu('KEYBOARD_PRIVACY')}</p>
      <button type="button" disabled={!apk} onClick={() => void caiDat()} className={`${nut} mt-3 flex items-center gap-2 bg-violet-800 text-white disabled:opacity-50`}><Settings2 size={20} aria-hidden="true" />{chu('KEYBOARD_OPEN_SETTINGS')}</button>
      <button type="button" disabled={!apk} onClick={() => void chon()} className={`${nut} mt-3 flex items-center gap-2 disabled:opacity-50`}><Keyboard size={20} aria-hidden="true" />{chu('KEYBOARD_SELECT')}</button>
    </section>
    <section className="mt-4 rounded-[22px] border border-amber-800 bg-amber-50 p-4">
      <h2 className="flex items-center gap-2 text-[17px] font-black"><ShieldAlert size={20} aria-hidden="true" />{chu('KEYBOARD_LIMIT_TITLE')}</h2>
      <p className="mt-2 text-[15px] leading-relaxed">{chu('KEYBOARD_LIMIT')}</p>
    </section>
    {loi && <p role="status" className="mt-3 rounded-xl bg-amber-100 p-3 font-bold">{loi}</p>}
  </main>;
}
