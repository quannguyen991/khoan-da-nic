import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldAlert, Landmark, FileText } from 'lucide-react';
import { THEO_DOI_72_GIO, SO_NGAN_HANG, MAN_HO_SO, tra, type Lang } from '../catalog';
import { docTheoDoi, ketThucTheoDoi, MOC_NHAC_GIO, type TrangThaiTheoDoi } from '../lib/theo-doi-72-gio';
import { huyNhacTheoDoi72Gio, laApk } from '../native';

/**
 * BẢO VỆ 72 GIỜ — dải nhắc trên trang chủ và màn chi tiết.
 *
 * ⚠️ TRANG CHỦ KHÔNG CUỘN TRÊN ĐIỆN THOẠI. Một thẻ to ở đó đẩy ô kiểm tra ra
 * khỏi màn — đúng thứ bác cần nhất. Nên trang chủ chỉ có MỘT dải gọn; mọi thứ
 * khác nằm ở màn chi tiết.
 *
 * ⚠️ §11 — không hứa lấy lại tiền, không trách bác. Chữ ở catalog.
 */

const thay = (mau: string, o: Record<string, string>): string =>
  Object.entries(o).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), mau);

/** Chữ nạp xuống Android cho lời nhắc hẹn giờ — CÙNG thứ tự với `MOC_NHAC_GIO`. */
export function chuNhac72Gio(lang: Lang): { tieuDe: string; noiDung: string[] } {
  return {
    tieuDe: tra(THEO_DOI_72_GIO, 'TB_TIEU_DE', lang) ?? '',
    noiDung: MOC_NHAC_GIO.map((g) => tra(THEO_DOI_72_GIO, `TB_MOC_${g}`, lang) ?? ''),
  };
}

export function DaiTheoDoi72Gio({ lang, setView }: { lang: Lang; setView: (v: any) => void }) {
  // Đọc một lần lúc dựng: trang chủ dựng lại mỗi lần bác quay về.
  const [tt] = useState<TrangThaiTheoDoi | null>(() => docTheoDoi(Date.now()));
  if (!tt) return null;
  return (
    <button
      type="button"
      onClick={() => setView('theo_doi_72h')}
      className="mx-4 mt-2 min-h-[52px] px-3.5 py-2 rounded-2xl bg-rose-50 border-2 border-rose-700 text-rose-950 flex items-center gap-2.5 text-left active:scale-[0.98] transition-transform shrink-0"
    >
      <ShieldAlert size={20} className="text-rose-700 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="block font-black text-[15px] leading-snug">{tra(THEO_DOI_72_GIO, 'TIEU_DE', lang)}</span>
        <span className="block text-[14px] font-semibold leading-snug">
          {thay(tra(THEO_DOI_72_GIO, 'CON_LAI', lang) ?? '', { gio: String(tt.conLaiGio) })}
        </span>
      </span>
      <ChevronRight size={20} className="text-rose-700 shrink-0" aria-hidden="true" />
    </button>
  );
}

export function ManTheoDoi72Gio({
  setView, t, lang,
}: {
  setView: (v: any) => void;
  t: (s: string) => string;
  lang: Lang;
}) {
  const [tt, setTt] = useState<TrangThaiTheoDoi | null>(() => docTheoDoi(Date.now()));
  const [trenApk, setTrenApk] = useState(false);

  useEffect(() => {
    let huy = false;
    void laApk().then((co) => { if (!huy) setTrenApk(co); });
    return () => { huy = true; };
  }, []);

  const ketThuc = () => {
    ketThucTheoDoi();
    void huyNhacTheoDoi72Gio();
    setTt(null);
  };

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <button
        type="button"
        onClick={() => setView('home')}
        className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#1e1b4b] font-bold text-[15px]"
      >
        <ChevronLeft size={22} aria-hidden="true" />
        {t('Quay lại')}
      </button>

      <h1 className="text-[24px] font-black text-[#1e1b4b] mt-2 mb-1 leading-snug">
        {tra(THEO_DOI_72_GIO, 'TIEU_DE', lang)}
      </h1>

      {!tt && (
        <p className="text-[16px] text-slate-700 leading-relaxed mt-2">{tra(THEO_DOI_72_GIO, 'KHONG_THEO_DOI', lang)}</p>
      )}

      {tt && (
        <>
          <p className="text-[17px] font-bold text-rose-800 mb-4">
            {thay(tra(THEO_DOI_72_GIO, 'CON_LAI', lang) ?? '', { gio: String(tt.conLaiGio) })}
          </p>

          <ul className="flex flex-col gap-2 mb-4">
            {['NHAC_1', 'NHAC_2', 'NHAC_3'].map((k) => (
              <li key={k} className="bg-white border-2 border-[#1e1b4b] rounded-[18px] px-4 py-3 text-[16px] font-semibold text-[#1e1b4b] leading-snug">
                {tra(THEO_DOI_72_GIO, k, lang)}
              </li>
            ))}
          </ul>

          {trenApk && (
            <p className="text-[14px] text-slate-600 leading-snug mb-4">{tra(THEO_DOI_72_GIO, 'CO_NHAC_TREN_MAY', lang)}</p>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setView('so_ngan_hang')}
              className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] flex items-center justify-center gap-2"
            >
              <Landmark size={20} aria-hidden="true" />
              {tra(SO_NGAN_HANG, 'TIEU_DE', lang)}
            </button>
            <button
              type="button"
              onClick={() => setView('ho_so_vu_viec')}
              className="w-full min-h-[56px] rounded-[18px] bg-white border-2 border-[#1e1b4b] text-[#1e1b4b] font-black text-[17px] flex items-center justify-center gap-2"
            >
              <FileText size={20} aria-hidden="true" />
              {tra(MAN_HO_SO, 'TIEU_DE', lang)}
            </button>
            <button
              type="button"
              onClick={ketThuc}
              className="w-full min-h-[52px] rounded-[18px] border-2 border-slate-400 text-slate-700 font-bold text-[15px] mt-2"
            >
              {tra(THEO_DOI_72_GIO, 'KET_THUC', lang)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
