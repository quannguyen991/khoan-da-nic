import { useEffect, useState } from 'react';
import {
  ArrowLeft, BellRing, Check, Hand, HeartHandshake, Phone, PhoneOff,
  Keyboard, Settings2, ShieldAlert, Smartphone, Volume2, X,
} from 'lucide-react';
import type { ViewState } from '../App';
import { TRUNG_TAM_BAO_VE as CHU, tra, type Lang } from '../catalog';
import { datCuChiCuuGiu, docCauCuuGiu, trangThaiCuChiCuuGiu } from '../native';

type TrangThai = { hoTro: boolean; dangBat: boolean; latMay: boolean; lacMay: boolean; dangLangNghe: boolean };

const macDinh: TrangThai = { hoTro: false, dangBat: false, latMay: false, lacMay: false, dangLangNghe: false };

export function TrungTamBaoVe({
  setView, lang, onTriggerEmergency, initialSafeExit = false,
}: {
  setView: (view: ViewState) => void;
  lang: Lang;
  onTriggerEmergency: () => void;
  initialSafeExit?: boolean;
}) {
  const [trangThai, setTrangThai] = useState<TrangThai>(macDinh);
  const [loi, setLoi] = useState('');
  const [manThoat, setManThoat] = useState(initialSafeExit);
  const [dangDoc, setDangDoc] = useState(false);
  const [loiDoc, setLoiDoc] = useState(false);
  const chu = (ma: string) => tra(CHU, ma, lang) ?? '';
  const phatCau = async (noiDung: string) => {
    const ok = await docCauCuuGiu(noiDung);
    setDangDoc(ok);
    setLoiDoc(!ok);
  };

  const capNhat = async () => {
    const kq = await trangThaiCuChiCuuGiu();
    if (kq) setTrangThai(kq);
  };
  useEffect(() => { void capNhat(); }, []);

  const doiCuChi = async (khoa: 'latMay' | 'lacMay', bat: boolean) => {
    setLoi('');
    const kq = await datCuChiCuuGiu({ [khoa]: bat });
    if (!kq) { setLoi(chu('GESTURE_APK_ONLY')); return; }
    setTrangThai(kq);
  };

  const khungThe = 'rounded-[22px] border-2 border-[#2e1065] bg-white p-4 shadow-[3px_3px_0_#2e1065]';
  const nut = 'min-h-[56px] w-full rounded-2xl border-2 border-[#2e1065] bg-white px-4 py-3 text-left text-[16px] font-bold text-[#1e1b4b] active:bg-violet-50';

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-4 text-[#1e1b4b]">
      <button type="button" onClick={() => setView('home')} className="mb-3 flex min-h-[52px] items-center gap-2 font-bold">
        <ArrowLeft size={22} aria-hidden="true" />{chu('BACK')}
      </button>
      <h1 className="text-[26px] font-black leading-snug">{manThoat ? chu('SAFE_EXIT_TITLE') : chu('CENTER_TITLE')}</h1>

      {manThoat ? (
        <>
          <p className="mt-3 rounded-2xl border-2 border-amber-800 bg-amber-50 p-4 text-[20px] font-black leading-snug text-amber-950">{chu('SAFE_EXIT_LINE')}</p>
          <button type="button" onClick={() => { void phatCau(chu('SAFE_EXIT_LINE')); }} className={`${nut} mt-3 flex items-center justify-center gap-2 bg-violet-800 text-white`}>
            <Volume2 size={22} aria-hidden="true" />{dangDoc ? chu('SPEAK_AGAIN') : chu('SPEAK_FOR_ME')}
          </button>
          <p className="mt-3 text-[16px] leading-relaxed">{chu('SAFE_EXIT_LIMIT')}</p>
          <div className="mt-4 grid gap-3">
            {['SAFE_REPLY_1', 'SAFE_REPLY_2', 'SAFE_REPLY_3', 'SAFE_REPLY_4'].map((ma) => (
              <button key={ma} type="button" onClick={() => { void phatCau(chu(ma)); }} className={nut}>{chu(ma)}</button>
            ))}
          </div>
          {loiDoc && <p role="status" className="mt-3 text-[15px] font-bold text-amber-900">{chu('TTS_UNAVAILABLE')}</p>}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setView('family')} className={`${nut} flex items-center justify-center gap-2 bg-emerald-800 text-white`}><Phone size={20} aria-hidden="true" />{chu('CALL_TRUSTED')}</button>
            <button type="button" onClick={onTriggerEmergency} className={`${nut} flex items-center justify-center gap-2 bg-red-800 text-white`}><ShieldAlert size={20} aria-hidden="true" />SOS</button>
          </div>
          <button type="button" onClick={() => { setDangDoc(false); setManThoat(false); }} className={`${nut} mt-3 flex items-center justify-center gap-2`}><Check size={20} aria-hidden="true" />{chu('RETURN_TO_CENTER')}</button>
        </>
      ) : (
        <>
          <p className="mt-1 text-[16px] leading-relaxed text-slate-700">{chu('CENTER_SUBTITLE')}</p>
          {trangThai.dangLangNghe && <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-emerald-800 bg-emerald-50 p-4 text-[15px] leading-relaxed"><Check size={22} className="mt-0.5 shrink-0" aria-hidden="true" />{chu('GESTURE_FOREGROUND')}</div>}
          {!trangThai.hoTro && <div role="status" className="mt-4 rounded-2xl border-2 border-amber-800 bg-amber-50 p-4 text-[15px] leading-relaxed">{chu('GESTURE_UNAVAILABLE')}</div>}

          <section className={`${khungThe} mt-4`}>
            <h2 className="flex items-center gap-2 text-[19px] font-black"><Smartphone size={22} aria-hidden="true" />{chu('GESTURE_TITLE')}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{chu('GESTURE_HELP')}</p>
            <label className="mt-4 flex min-h-[56px] cursor-pointer items-center justify-between gap-3 border-t border-slate-200 pt-3 text-[16px] font-bold">
              <span>{chu('GESTURE_FACE_DOWN')}</span><input type="checkbox" className="h-6 w-6 accent-violet-800" checked={trangThai.latMay} disabled={!trangThai.hoTro} onChange={(e) => void doiCuChi('latMay', e.target.checked)} />
            </label>
            <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3 border-t border-slate-200 pt-3 text-[16px] font-bold">
              <span>{chu('GESTURE_SHAKE')}</span><input type="checkbox" className="h-6 w-6 accent-violet-800" checked={trangThai.lacMay} disabled={!trangThai.hoTro} onChange={(e) => void doiCuChi('lacMay', e.target.checked)} />
            </label>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-700">{chu('GESTURE_PRIVACY')}</p>
            {loi && <p role="status" className="mt-2 text-[14px] font-bold text-amber-900">{loi}</p>}
          </section>

          <section className={`${khungThe} mt-4`}>
            <h2 className="flex items-center gap-2 text-[19px] font-black"><PhoneOff size={22} aria-hidden="true" />{chu('SAFE_EXIT_TITLE')}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{chu('SAFE_EXIT_HELP')}</p>
            <button type="button" onClick={() => setManThoat(true)} className={`${nut} mt-3 flex items-center justify-center gap-2 bg-violet-800 text-white`}><Volume2 size={20} aria-hidden="true" />{chu('OPEN_SAFE_EXIT')}</button>
          </section>

          <section className={`${khungThe} mt-4`}>
            <h2 className="flex items-center gap-2 text-[19px] font-black"><Keyboard size={22} aria-hidden="true" />{chu('KEYBOARD_TITLE')}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{chu('KEYBOARD_HELP')}</p>
            <button type="button" onClick={() => setView('ban_phim')} className={`${nut} mt-3 flex items-center justify-center gap-2`}><Settings2 size={20} aria-hidden="true" />{chu('KEYBOARD_SETUP_TITLE')}</button>
          </section>

          <section className={`${khungThe} mt-4`}>
            <h2 className="flex items-center gap-2 text-[19px] font-black"><HeartHandshake size={22} aria-hidden="true" />{chu('FAMILY_TITLE')}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{chu('FAMILY_HELP')}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setView('family')} className={nut}><Settings2 size={20} className="mr-2 inline" aria-hidden="true" />{chu('MANAGE_CONTACTS')}</button>
              <button type="button" onClick={onTriggerEmergency} className="min-h-[56px] rounded-2xl border-2 border-[#2e1065] bg-red-800 px-4 py-3 text-[16px] font-black text-white"><BellRing size={20} className="mr-2 inline" aria-hidden="true" />{chu('OPEN_SOS')}</button>
            </div>
          </section>

          <section className={`${khungThe} mt-4`}>
            <h2 className="flex items-center gap-2 text-[19px] font-black"><Settings2 size={22} aria-hidden="true" />{chu('PERMISSION_TITLE')}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{chu('PERMISSION_HELP')}</p>
            <button type="button" onClick={() => setView('notifications')} className={`${nut} mt-3 flex items-center justify-center gap-2`}><Settings2 size={20} aria-hidden="true" />{chu('OPEN_PERMISSIONS')}</button>
          </section>

          <p className="mt-4 rounded-2xl bg-violet-100 p-4 text-[15px] font-bold leading-relaxed">{chu('THREE_STEPS')}</p>
        </>
      )}
    </main>
  );
}

export function ManCuuGiu({ setView, onTriggerEmergency }: { setView: (view: ViewState) => void; onTriggerEmergency: () => void }) {
  const [dangDoc, setDangDoc] = useState(false);
  const [loiDoc, setLoiDoc] = useState(false);
  const lang: Lang = (() => { try { return localStorage.getItem('lang') === 'en' ? 'en' : 'vi'; } catch { return 'vi'; } })();
  const chu = (ma: string) => tra(CHU, ma, lang) ?? '';
  const phatCau = async () => {
    const ok = await docCauCuuGiu(chu('SAFE_EXIT_LINE'));
    setDangDoc(ok);
    setLoiDoc(!ok);
  };
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-5 pb-24 pt-8 text-[#1e1b4b]">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-800"><Hand size={36} aria-hidden="true" /></div>
      <h1 className="text-[30px] font-black leading-snug">{chu('RESCUE_TITLE')}</h1>
      <p className="mt-2 text-[18px] leading-relaxed">{chu('RESCUE_HELP')}</p>
      <button type="button" onClick={() => void phatCau()} className="mt-5 min-h-[64px] rounded-2xl border-2 border-[#2e1065] bg-violet-800 px-4 py-3 text-[18px] font-black text-white"><Volume2 size={22} className="mr-2 inline" aria-hidden="true" />{dangDoc ? chu('SPEAK_AGAIN') : chu('SPEAK_FOR_ME')}</button>
      {loiDoc && <p role="status" className="mt-2 text-[15px] font-bold text-amber-900">{chu('TTS_UNAVAILABLE')}</p>}
      <button type="button" onClick={() => setView('family')} className="mt-3 min-h-[64px] rounded-2xl border-2 border-[#2e1065] bg-emerald-800 px-4 py-3 text-[18px] font-black text-white"><Phone size={22} className="mr-2 inline" aria-hidden="true" />{chu('CALL_TRUSTED')}</button>
      <button type="button" onClick={onTriggerEmergency} className="mt-3 min-h-[64px] rounded-2xl border-2 border-[#2e1065] bg-red-800 px-4 py-3 text-[18px] font-black text-white"><ShieldAlert size={22} className="mr-2 inline" aria-hidden="true" />{chu('OPEN_SOS')}</button>
      <button type="button" onClick={() => setView('home')} className="mt-4 flex min-h-[56px] items-center justify-center gap-2 font-bold"><X size={20} aria-hidden="true" />{chu('CANCEL_RESCUE')}</button>
    </main>
  );
}
