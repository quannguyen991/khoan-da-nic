import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { docNhipBaoVeBoMe, type TrangThaiBaoVeBoMe, type QuyenBaoVe } from '../tai-khoan';

/**
 * ══════ "MÁY BỐ MẸ CÒN ĐƯỢC BẢO VỆ KHÔNG?" — phía máy con (23/9/2026) ══════
 *
 * Hiện ĐÚNG điều máy bố mẹ đã báo về, kèm giờ báo. Quá 2 ngày không báo về thì nói
 * thẳng là CHƯA BIẾT — có thể máy đã tắt bảo vệ — và bảo gọi hỏi (§4.3: "không kiểm
 * được" không được trông giống "vẫn ổn").
 *
 * ⚠️ §11 — không "an toàn", không "được bảo vệ đầy đủ". Chỉ nói quyền nào đang bật/tắt.
 */
const QUA_LAU_MS = 48 * 60 * 60 * 1000;

const TEN_QUYEN: { khoa: keyof QuyenBaoVe; ten: string }[] = [
  { khoa: 'docThongBao', ten: 'Đọc thông báo (bắt mã OTP, tiền ra)' },
  { khoa: 'theoDoiCuocGoi', ten: 'Theo dõi cuộc gọi' },
  { khoa: 'hienTrenApp', ten: 'Hiện màn cảnh báo lên trên' },
];

export function TrangThaiBaoVeBoMeView({ t }: { t: (s: string) => string }) {
  const [ds, setDs] = useState<TrangThaiBaoVeBoMe[] | null>(null);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    let huy = false;
    const tai = () => docNhipBaoVeBoMe()
      .then((r) => { if (!huy) { setDs(r.boMe); setLoi(false); } })
      .catch(() => { if (!huy) setLoi(true); });
    void tai();
    const id = window.setInterval(() => { void tai(); }, 60_000);
    return () => { huy = true; window.clearInterval(id); };
  }, []);

  if (loi && !ds) return <p className="text-[14px] font-semibold text-slate-600">{t('Chưa tải được trạng thái bảo vệ.')}</p>;
  if (!ds || ds.length === 0) return null;

  // "20:13 23/09" — tự ghép, vì `toLocaleString('vi-VN')` cho ra "23-09", dễ đọc nhầm.
  const hai = (n: number) => String(n).padStart(2, '0');
  const gio = (luc: number) => {
    const d = new Date(luc);
    return `${hai(d.getHours())}:${hai(d.getMinutes())} ${hai(d.getDate())}/${hai(d.getMonth() + 1)}`;
  };

  return (
    <div className="flex flex-col gap-3 mb-5">
      {ds.map((bm) => {
        if (!bm.choXem) {
          return (
            <p key={bm.tenBoMe} className="text-[14px] font-semibold text-slate-600 leading-snug">
              {t('{ten} chưa bật cho anh/chị xem trạng thái bảo vệ.').split('{ten}').join(bm.tenBoMe)}
            </p>
          );
        }
        if (!bm.nhip) {
          return (
            <p key={bm.tenBoMe} className="text-[14px] font-semibold text-slate-600 leading-snug">
              {t('Máy {ten} chưa báo về lần nào.').split('{ten}').join(bm.tenBoMe)}
            </p>
          );
        }
        const quaLau = Date.now() - bm.nhip.luc > QUA_LAU_MS;
        const soNgay = Math.floor((Date.now() - bm.nhip.luc) / (24 * 60 * 60 * 1000));
        const dangTat = TEN_QUYEN.filter((q) => bm.nhip?.quyen[q.khoa] === false);
        return (
          <section key={bm.tenBoMe} aria-label={t('Bảo vệ tự bật')} className={`rounded-2xl border-2 p-4 flex flex-col gap-2 ${quaLau || dangTat.length > 0 ? 'border-amber-600 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-[15px] font-black text-slate-900 flex items-center gap-2 leading-snug">
              {quaLau || dangTat.length > 0
                ? <ShieldAlert size={18} className="text-amber-700 shrink-0" aria-hidden="true" />
                : <ShieldCheck size={18} className="text-[#6d28d9] shrink-0" aria-hidden="true" />}
              {t('Bảo vệ tự bật · báo về lúc {gio}').split('{gio}').join(gio(bm.nhip.luc))}
            </p>
            {quaLau && (
              <p role="status" className="text-[15px] font-bold text-amber-900 leading-snug">
                {t('{n} ngày chưa báo về. Có thể máy đã tắt bảo vệ — gọi hỏi bố mẹ.').split('{n}').join(String(soNgay))}
              </p>
            )}
            {!bm.nhip.laApk ? (
              <p className="text-[14px] font-semibold text-slate-700 leading-snug">{t('Bố mẹ đang dùng bản web — máy không tự bật được khi đang gọi.')}</p>
            ) : dangTat.length === 0 ? (
              <p className="text-[14px] font-semibold text-slate-700 leading-snug">{t('Cả ba quyền đang bật.')}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {dangTat.map((q) => (
                  <li key={q.khoa} className="text-[14px] font-bold text-amber-900 leading-snug">{t('Đang tắt:')} {t(q.ten)}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
