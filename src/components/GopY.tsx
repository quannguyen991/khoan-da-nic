import { useState } from 'react';
import { ChevronLeft, Copy, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import type { ViewState } from '../App';

/**
 * Hộp thư nhận góp ý — đúng địa chỉ đã công khai trong chính sách riêng tư
 * (`public/chinh-sach-rieng-tu.html`).
 *
 * Góp ý KHÔNG được gửi lên máy chủ. Thư mở trong ứng dụng email của người dùng
 * (hoặc được sao chép), nên không có kho dữ liệu góp ý mới và không đổi mô hình
 * riêng tư. Nếu sau này muốn lưu góp ý trên máy chủ, đó là quyết định riêng.
 */
export const EMAIL_GOP_Y = 'quannxm.sags@gmail.com';

type VaiTro = 'bac' | 'con' | 'khac';

const VAI_TRO: { ma: VaiTro; nhan: string }[] = [
  { ma: 'bac', nhan: 'Bác' },
  { ma: 'con', nhan: 'Con cháu' },
  { ma: 'khac', nhan: 'Người khác' },
];

const GIOI_HAN = 500;

function Oqa({ nhan, gia, doi }: { nhan: string; gia: string; doi: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[15px] font-black text-[#321379] mb-2">{nhan}</span>
      <textarea
        value={gia}
        onChange={(e) => doi(e.target.value.slice(0, GIOI_HAN))}
        rows={3}
        aria-label={nhan}
        className="w-full min-h-[96px] rounded-2xl border border-[#dcc7ff] bg-[#fcfaff] p-3 text-[15px] text-[#321379] outline-none focus:ring-2 focus:ring-[#c4a7ff] resize-none"
      />
      <span className="block text-right text-[14px] text-slate-500 mt-1">
        {gia.length}/{GIOI_HAN}
      </span>
    </label>
  );
}

export function GopY({ t, setView }: { t: (s: string) => string; setView: (v: ViewState) => void }) {
  const [vaiTro, setVaiTro] = useState<VaiTro | null>(null);
  const [mucDe, setMucDe] = useState<number | null>(null);
  const [huuIch, setHuuIch] = useState('');
  const [khoHieu, setKhoHieu] = useState('');
  const [mongMuon, setMongMuon] = useState('');
  const [thongBao, setThongBao] = useState<string | null>(null);

  const coYKien = Boolean(mucDe || huuIch.trim() || khoHieu.trim() || mongMuon.trim());

  const noiDung = (): string => {
    const dong: string[] = [];
    const vai = VAI_TRO.find((v) => v.ma === vaiTro);
    if (vai) dong.push(`${t('Bạn là')}: ${t(vai.nhan)}`);
    if (mucDe) dong.push(`${t('Mức dễ dùng')}: ${mucDe}/5`);
    if (huuIch.trim()) dong.push(`${t('Điều bạn thấy hữu ích nhất')}:\n${huuIch.trim()}`);
    if (khoHieu.trim()) dong.push(`${t('Điều khó hiểu hoặc khó chịu')}:\n${khoHieu.trim()}`);
    if (mongMuon.trim()) dong.push(`${t('Bạn muốn Khoan Đã thêm gì?')}:\n${mongMuon.trim()}`);
    return dong.join('\n\n');
  };

  const hrefThu = `mailto:${EMAIL_GOP_Y}?subject=${encodeURIComponent(t('Góp ý Khoan Đã'))}&body=${encodeURIComponent(noiDung())}`;

  const saoChep = async () => {
    try {
      await navigator.clipboard.writeText(noiDung());
      setThongBao(t('Đã sao chép. Bác dán vào email hoặc tin nhắn rồi gửi nhé.'));
    } catch {
      setThongBao(t('Chưa sao chép được. Bác chọn chữ và sao chép bằng tay nhé.'));
    }
  };

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto overflow-y-auto">
      <button type="button" onClick={() => setView('home')} className="min-h-[52px] flex items-center gap-1 text-[#321379] font-bold text-[15px]">
        <ChevronLeft size={22} aria-hidden="true" /> {t('Quay lại')}
      </button>

      <div className="flex items-center gap-3 mt-2 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-[#f1e8ff] text-[#7c3aed] flex items-center justify-center">
          <MessageSquare size={25} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-[24px] font-black text-[#321379] leading-tight">{t('Góp ý cho Khoan Đã')}</h1>
          <p className="text-[14px] text-slate-600">{t('Cho biết ý kiến để sửa cho dễ dùng hơn.')}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#e4d4ff] shadow-[0_10px_30px_rgba(91,33,182,0.10)] p-4 mt-5 space-y-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-[#7c3aed] shrink-0 mt-0.5" size={22} aria-hidden="true" />
          <p className="text-[14px] text-[#51436f] leading-relaxed">
            {t('Đừng ghi số điện thoại, số tài khoản hay tên người thân. Chỉ ghi ý kiến.')}
          </p>
        </div>

        <fieldset>
          <legend className="text-[15px] font-black text-[#321379] mb-2">{t('Bạn là ai?')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {VAI_TRO.map((v) => (
              <button
                key={v.ma}
                type="button"
                aria-pressed={vaiTro === v.ma}
                onClick={() => setVaiTro(v.ma)}
                className={`min-h-[52px] rounded-2xl border text-[15px] font-bold ${
                  vaiTro === v.ma ? 'bg-[#7c3aed] border-[#7c3aed] text-white' : 'bg-[#fcfaff] border-[#dcc7ff] text-[#321379]'
                }`}
              >
                {t(v.nhan)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[15px] font-black text-[#321379] mb-2">{t('Dễ dùng đến mức nào?')}</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={mucDe === n}
                aria-label={`${n}/5`}
                onClick={() => setMucDe(n)}
                className={`flex-1 min-h-[52px] rounded-2xl border text-[16px] font-black ${
                  mucDe === n ? 'bg-[#7c3aed] border-[#7c3aed] text-white' : 'bg-[#fcfaff] border-[#dcc7ff] text-[#321379]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[14px] text-slate-600 mt-1">
            <span>{t('Khó dùng')}</span>
            <span>{t('Dễ dùng')}</span>
          </div>
        </fieldset>

        <Oqa nhan={t('Điều bạn thấy hữu ích nhất')} gia={huuIch} doi={setHuuIch} />
        <Oqa nhan={t('Điều khó hiểu hoặc khó chịu')} gia={khoHieu} doi={setKhoHieu} />
        <Oqa nhan={t('Bạn muốn Khoan Đã thêm gì?')} gia={mongMuon} doi={setMongMuon} />

        <div className="flex flex-col gap-2">
          <a
            href={hrefThu}
            aria-disabled={!coYKien}
            onClick={(e) => {
              if (!coYKien) e.preventDefault();
            }}
            className={`min-h-[52px] rounded-full flex items-center justify-center gap-2 font-bold text-white ${
              coYKien ? 'bg-gradient-to-r from-[#9e76ea] to-[#7c3aed]' : 'bg-[#b8a6e0] pointer-events-none'
            }`}
          >
            <Mail size={18} aria-hidden="true" /> {t('Gửi bằng email')}
          </a>
          <button
            type="button"
            onClick={saoChep}
            disabled={!coYKien}
            className="min-h-[52px] rounded-full border border-[#dcc7ff] bg-white text-[#5b21b6] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Copy size={18} aria-hidden="true" /> {t('Sao chép nội dung')}
          </button>
          <p className="text-[14px] text-slate-600 leading-snug">
            {t('Gửi tới')}: <span className="font-bold break-all">{EMAIL_GOP_Y}</span>
          </p>
          <p className="text-[14px] text-slate-600 leading-snug">
            {t('Thư sẽ mở trong ứng dụng email của bác. Khoan Đã không lưu ý kiến này trên máy chủ.')}
          </p>
        </div>

        {thongBao && <p className="text-[14px] font-bold text-[#5b21b6] leading-snug">{thongBao}</p>}
      </div>
    </div>
  );
}
