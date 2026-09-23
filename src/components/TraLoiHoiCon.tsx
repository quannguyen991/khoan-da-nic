import { useEffect, useState, type ReactNode } from 'react';
import { Phone } from 'lucide-react';
import { hoiConDangCho, traLoiHoiCon, type TraLoiHoi } from '../tai-khoan';

/**
 * ═════ "CÓ PHẢI CON ĐANG GỌI KHÔNG?" — thẻ ở máy CON (23/9/2026) ═════
 *
 * Thông báo mở `/?view=guardian&hoiGoi=<id>`; thẻ cũng tự hỏi danh sách đang chờ nên
 * mở app thường vẫn thấy. Hai nút to, không gì khác. Bấm "Không phải con" thì việc
 * tiếp theo là gọi bố mẹ ngay — người đang nghe máy kia KHÔNG phải mình.
 */
/**
 * Việc thẻ này làm với bên ngoài. Mặc định là máy chủ thật; màn trình diễn
 * (`?trinhDien=1`) truyền bản GIẢ LẬP và `goiBoMe` thay cho liên kết `tel:` thật.
 */
export interface ApiTraLoiHoiCon {
  dangCho: () => Promise<{ hoi: { hoiId: string; tenBoMe: string; hetHan: number }[] }>;
  traLoi: (id: string, tl: TraLoiHoi) => Promise<unknown>;
  goiBoMe?: () => void;
}
const API_THAT: ApiTraLoiHoiCon = { dangCho: hoiConDangCho, traLoi: traLoiHoiCon };

export function TraLoiHoiCon({ t, coPhien, soBoMe, api, nhipMs = 5000 }: {
  t: (s: string) => string;
  coPhien: boolean;
  soBoMe?: string;
  api?: ApiTraLoiHoiCon;
  nhipMs?: number;
}) {
  const a = api ?? API_THAT;
  const [ds, setDs] = useState<{ hoiId: string; tenBoMe: string; hetHan: number }[]>([]);
  /** Câu đã trả lời trong phiên này — giữ lại để còn hiện nút gọi bố mẹ. */
  const [daXong, setDaXong] = useState<{ hoiId: string; tenBoMe: string; traLoi: TraLoiHoi }[]>([]);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    if (!coPhien) return;
    let huy = false;
    const tai = () => a.dangCho().then((r) => { if (!huy) setDs(r.hoi); }).catch(() => undefined);
    void tai();
    const id = window.setInterval(() => { void tai(); }, nhipMs);
    return () => { huy = true; window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coPhien]);

  const dangCho = ds.filter((h) => !daXong.some((x) => x.hoiId === h.hoiId));
  if (!coPhien || (dangCho.length === 0 && daXong.length === 0)) return null;

  const traLoi = async (h: { hoiId: string; tenBoMe: string }, tl: TraLoiHoi) => {
    setLoi(false);
    try {
      await a.traLoi(h.hoiId, tl);
      setDaXong((c) => [...c, { hoiId: h.hoiId, tenBoMe: h.tenBoMe, traLoi: tl }]);
    } catch { setLoi(true); }
  };
  const so = soBoMe?.replace(/\s/g, '');

  const the = (hoiId: string, tenBoMe: string, noiDung: ReactNode) => (
    <section key={hoiId} role="alert" aria-labelledby={`hoi-${hoiId}`} className="rounded-[24px] bg-red-700 text-white p-5 flex flex-col gap-3">
      <h2 id={`hoi-${hoiId}`} className="text-[22px] font-black leading-snug">
        {t('{ten} hỏi: có phải anh/chị đang gọi không?').split('{ten}').join(tenBoMe || t('Bố mẹ'))}
      </h2>
      {noiDung}
      {loi && <p className="text-[15px] font-bold leading-snug">{t('Chưa gửi được câu trả lời. Gọi thẳng cho bố mẹ.')}</p>}
    </section>
  );

  return (
    <>
      {dangCho.map((h) => the(h.hoiId, h.tenBoMe, (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { void traLoi(h, 'KHONG'); }}
            className="min-h-[64px] rounded-[18px] bg-amber-300 text-amber-950 font-black text-[18px] px-2 leading-snug">
            {t('Không phải con')}
          </button>
          <button type="button" onClick={() => { void traLoi(h, 'CO'); }}
            className="min-h-[64px] rounded-[18px] border-2 border-white text-white font-black text-[18px] px-2 leading-snug">
            {t('Con đang gọi')}
          </button>
        </div>
      )))}
      {daXong.map((x) => the(x.hoiId, x.tenBoMe, (
        <>
          <p className="text-[17px] font-bold leading-snug">
            {x.traLoi === 'KHONG' ? t('Đã báo bố mẹ: không phải anh/chị gọi.') : t('Đã báo bố mẹ: anh/chị đang gọi.')}
          </p>
          {x.traLoi === 'KHONG' && so && (a.goiBoMe ? (
            <button type="button" onClick={a.goiBoMe} className="w-full min-h-[64px] rounded-[18px] bg-amber-300 text-amber-950 font-black text-[20px] flex items-center justify-center gap-2 px-3 leading-snug">
              <Phone size={24} aria-hidden="true" /> {t('Gọi bố mẹ ngay')}
            </button>
          ) : (
            <a href={`tel:${so}`} className="w-full min-h-[64px] rounded-[18px] bg-amber-300 text-amber-950 font-black text-[20px] flex items-center justify-center gap-2 px-3 leading-snug">
              <Phone size={24} aria-hidden="true" /> {t('Gọi bố mẹ ngay')}
            </a>
          ))}
        </>
      )))}
    </>
  );
}
