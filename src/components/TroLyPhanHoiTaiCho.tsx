import { useMemo, useState } from 'react';
import { Check, Copy, MessageSquareText, Phone, Share2, ShieldAlert } from 'lucide-react';
import type { KetQuaPhanTich, NguoiThan, ViewState } from '../App';
import { MA_LY_DO, NHAN, TRUNG_TAM_BAO_VE as CHU, tra, traNhieu, type Lang } from '../catalog';

function cheThongTin(text: string): string {
  return text
    .replace(/(\b(?:otp|mã xác thực|ma xac thuc|mã giao dịch|ma giao dich|pin)\b\s*(?:là|la|:)?\s*)(\d{4,8})/gi, '$1••••')
    .replace(/\b\d{4,19}\b/g, (so) => `${so.slice(0, 2)}••••${so.slice(-2)}`);
}

export function TroLyPhanHoiTaiCho({
  result, lang, setView, familyMembers,
}: { result: KetQuaPhanTich; lang: Lang; setView: (view: ViewState) => void; familyMembers: NguoiThan[] }) {
  const [moBangChiaSe, setMoBangChiaSe] = useState(false);
  const [moHuongDan, setMoHuongDan] = useState(false);
  const [bao, setBao] = useState('');
  const chu = (ma: string) => tra(CHU, ma, lang) ?? '';
  const goc = result.queryText?.trim() ?? '';
  const daChe = useMemo(() => cheThongTin(goc), [goc]);
  const lyDo = Array.isArray(result.maLyDo) ? result.maLyDo : [];
  // Ưu tiên chỉ dựa vào mã của bộ phân tích chuẩn; component này không tự chấm rủi ro.
  const uuTienOtp = lyDo.some((ma) => ma === 'CRED_OTP_SHARE' || ma === 'CRED_PASSWORD_PIN');
  const uuTienGiaDinh = lyDo.some((ma) => ma.startsWith('ID_FAMILY_') || ma === 'ID_CONTACT_ACCOUNT_TAKEOVER');
  const uuTienNganHang = lyDo.some((ma) => ma === 'ID_BANK_IMPERSONATION' || ma === 'CRED_BANK_LOGIN');
  const uuTienDung = lyDo.some((ma) => ma.startsWith('FIN_') || ma.startsWith('ID_BANK_') || ma.startsWith('DEV_'));
  const mucDich = result.nhan ? tra(NHAN, result.nhan, lang) : null;
  const giaiThich = traNhieu(MA_LY_DO, lyDo, lang).slice(0, 3).join('; ');
  const nguoiThan = familyMembers.find((n) => n.phone?.trim()) ?? null;

  const noiDungChiaSe = [
    chu('EVIDENCE_NOTE'),
    `\n${chu('EVIDENCE_TIME')}: ${new Date().toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN')}`,
    daChe ? `\n\n${chu('EVIDENCE_MESSAGE')}:\n${daChe}` : '',
    `\n\n${chu('EVIDENCE_RESULT')}: ${mucDich ?? chu('EVIDENCE_UNAVAILABLE')}`,
    giaiThich ? `\n${chu('EVIDENCE_REASON')}: ${giaiThich}` : '',
    `\n${chu('EVIDENCE_LIMIT_NOTE')}`,
  ].join('');

  const saoChep = async (text: string, thongBao: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setBao(thongBao);
    } catch {
      setBao(chu('COPY_UNAVAILABLE'));
    }
  };

  const chiaSe = async () => {
    if (!navigator.share) {
      await saoChep(noiDungChiaSe, chu('EVIDENCE_COPIED'));
      return;
    }
    try {
      await navigator.share({ title: chu('EVIDENCE_TITLE'), text: noiDungChiaSe });
      setBao(chu('EVIDENCE_SHARED_SHEET'));
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setBao(chu('EVIDENCE_SHARE_FAILED'));
    }
  };

  const moTinNhanNguoiThan = () => {
    if (!nguoiThan) { setView('family'); return; }
    const phone = nguoiThan.phone.replace(/[^+\d]/g, '');
    if (!phone) { setView('family'); return; }
    window.location.href = `sms:${phone}?body=${encodeURIComponent(noiDungChiaSe)}`;
  };

  const loiTuChoi = lang === 'en'
    ? 'I will not share personal information or transfer money through messages. If this is an official request, please tell me how to verify it through the relevant authority. I will contact them using an official channel.'
    : 'Tôi không cung cấp thông tin cá nhân hoặc chuyển tiền qua tin nhắn. Nếu đây là yêu cầu chính thức, vui lòng hướng dẫn tôi xác minh qua cơ quan có thẩm quyền. Tôi sẽ tự liên hệ qua kênh chính thức.';
  const phanHoiCuoi = lang === 'en'
    ? 'I will not continue this conversation through this channel.'
    : 'Tôi không tiếp tục trao đổi qua kênh này.';

  return (
    <section className="mt-5 rounded-[22px] border-2 border-[#2e1065] bg-white p-4 text-[#1e1b4b] shadow-[3px_3px_0_#2e1065]">
      <div className="flex items-center gap-2">
        <MessageSquareText size={23} aria-hidden="true" />
        <h2 className="text-[20px] font-black leading-snug">{chu('IN_SITU_TITLE')}</h2>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed">{chu('IN_SITU_HELP')}</p>

      <div className="mt-3 rounded-xl border-2 border-red-800 bg-red-50 p-3">
        <p className="text-[14px] font-black uppercase tracking-wide text-red-900">{chu('PRIMARY_ACTION')}</p>
        <p className="mt-1 text-[16px] font-bold leading-relaxed text-red-950">{chu(uuTienOtp ? 'PRIMARY_OTP' : uuTienGiaDinh ? 'PRIMARY_FAMILY' : uuTienNganHang ? 'PRIMARY_BANK' : uuTienDung ? 'PRIMARY_STOP' : 'PRIMARY_REPLY')}</p>
        <button type="button" onClick={() => {
          if (uuTienOtp || uuTienGiaDinh) setView('family');
          else if (uuTienNganHang) setView('so_ngan_hang');
          else if (uuTienDung) setMoHuongDan(true);
          else void saoChep(loiTuChoi, chu('RESPONSE_COPIED'));
        }} className="mt-2 min-h-[48px] rounded-xl border border-red-900 bg-white px-3 py-2 text-[15px] font-black">{chu(uuTienOtp || uuTienGiaDinh ? 'OPEN_TRUSTED_CONTACTS' : uuTienNganHang ? 'OPEN_BANK_DIRECTORY' : uuTienDung ? 'STOP_CONTACT' : 'SAFE_REPLY')}</button>
      </div>

      <div className="mt-4 grid gap-3">
        <button type="button" onClick={() => void saoChep(loiTuChoi, chu('RESPONSE_COPIED'))}
          className={`min-h-[58px] rounded-2xl border-2 border-[#2e1065] px-4 py-3 text-left text-[16px] font-black leading-snug ${uuTienDung || (!uuTienOtp && !uuTienGiaDinh) ? 'bg-violet-800 text-white' : 'bg-white'}`}>
          <span className="flex items-center gap-2"><Copy size={20} aria-hidden="true" />{chu('SAFE_REPLY')}</span>
          <span className="mt-1 block text-[14px] font-medium">{loiTuChoi}</span>
        </button>

        <button type="button" onClick={() => setMoHuongDan((x) => !x)}
          className={`min-h-[58px] rounded-2xl border-2 border-[#2e1065] px-4 py-3 text-left text-[16px] font-black leading-snug ${uuTienDung ? 'bg-white' : 'bg-amber-100'}`}>
          <span className="flex items-center gap-2"><ShieldAlert size={20} aria-hidden="true" />{chu('STOP_CONTACT')}</span>
          <span className="mt-1 block text-[14px] font-medium">{chu('STOP_CONTACT_HELP')}</span>
        </button>
        {moHuongDan && <div className="rounded-xl bg-amber-50 p-3 text-[15px] leading-relaxed">
          <p>{chu('STOP_CONTACT_DETAIL')}</p>
          <button type="button" onClick={() => void saoChep(phanHoiCuoi, chu('RESPONSE_COPIED'))}
            className="mt-3 min-h-[48px] rounded-xl border border-amber-900 bg-white px-3 py-2 font-bold">{chu('FINAL_NEUTRAL_REPLY')}</button>
        </div>}

        <button type="button" onClick={() => setMoBangChiaSe(true)}
          className={`min-h-[58px] rounded-2xl border-2 border-[#2e1065] px-4 py-3 text-left text-[16px] font-black leading-snug ${uuTienOtp || uuTienGiaDinh ? 'bg-violet-800 text-white' : 'bg-white'}`}>
          <span className="flex items-center gap-2"><Share2 size={20} aria-hidden="true" />{chu('SEND_TO_FAMILY')}</span>
          <span className="mt-1 block text-[14px] font-medium">{chu('SEND_TO_FAMILY_HELP')}</span>
        </button>
      </div>

      {moBangChiaSe && <div className="mt-3 rounded-2xl border border-violet-300 bg-violet-50 p-3">
        <h3 className="text-[16px] font-black">{chu('EVIDENCE_TITLE')}</h3>
        <p className="mt-1 text-[14px] leading-relaxed">{chu('EVIDENCE_PRIVACY')}</p>
        <label className="mt-3 block text-[14px] font-bold">{chu('EVIDENCE_PREVIEW')}</label>
        <textarea readOnly value={noiDungChiaSe} className="mt-1 min-h-36 w-full rounded-xl border border-violet-300 bg-white p-3 text-[14px] leading-relaxed" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => void chiaSe()} className="min-h-[54px] rounded-xl bg-violet-800 px-3 py-2 font-black text-white"><Share2 size={19} className="mr-2 inline" aria-hidden="true" />{chu('OPEN_SHARE_SHEET')}</button>
          {nguoiThan ? <button type="button" onClick={moTinNhanNguoiThan} className="min-h-[54px] rounded-xl border-2 border-[#2e1065] bg-white px-3 py-2 font-bold"><Phone size={19} className="mr-2 inline" aria-hidden="true" />{chu('OPEN_SAVED_CONTACT').replace('{ten}', nguoiThan.name)}</button>
            : <button type="button" onClick={() => setView('family')} className="min-h-[54px] rounded-xl border-2 border-[#2e1065] bg-white px-3 py-2 font-bold"><Phone size={19} className="mr-2 inline" aria-hidden="true" />{chu('OPEN_TRUSTED_CONTACTS')}</button>}
        </div>
      </div>}
      {uuTienOtp && <p className="mt-3 rounded-xl bg-red-50 p-3 text-[16px] font-black text-red-900">{chu('OTP_REMINDER')}</p>}
      {bao && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-[14px] font-bold text-emerald-900"><Check size={18} className="mr-1 inline" aria-hidden="true" />{bao}</p>}
    </section>
  );
}
