import { useEffect, useState } from 'react';
import { ChevronLeft, PhoneCall, Landmark, ExternalLink } from 'lucide-react';
import { SO_NGAN_HANG, tra, type Lang } from '../catalog';
import { locDanhBa, soDeGoi, type SoNganHang } from '../lib/danh-ba-ngan-hang';

/**
 * SỐ TỔNG ĐÀI NGÂN HÀNG — để sẵn trong app, bác tự bấm.
 *
 * ⚠️ KỊCH BẢN HỎNG TỆ NHẤT CỦA CẢ SẢN PHẨM: hiện một số sai, bác bấm gọi, và đầu
 * dây bên kia là kẻ lừa đảo. Nên:
 *   · Số chỉ lấy từ `public/config/support-directory.json`, qua `locDanhBa` — mục
 *     đã duyệt, có tên người duyệt, nguồn là trang của chính ngân hàng.
 *   · Mỗi ngân hàng ghi nguồn và ngày kiểm lại NGAY CẠNH số.
 *   · KHÔNG BAO GIỜ lấy số từ tin nhắn bác dán vào.
 *
 * ⚠️ Người dùng chốt 17/9/2026: không mở app ngân hàng, không tự gọi. Chỉ có nút
 * `tel:` do bác bấm.
 *
 * ⚠️ §4.3 — "chưa tải được" KHÁC "không có số nào". Hai trạng thái, hai câu.
 */

type TrangThai = { kieu: 'dang_tai' } | { kieu: 'loi' } | { kieu: 'xong'; ds: SoNganHang[] };

const thay = (mau: string, o: Record<string, string>): string =>
  Object.entries(o).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), mau);

/** "2026-09-17" → "17/09/2026". Sai định dạng thì trả nguyên chuỗi — không đoán ngày. */
const ngayHien = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

export function DanhSachSoNganHang({ lang, kieu }: { lang: Lang; kieu: 'sang' | 'toi' }) {
  const [tt, setTt] = useState<TrangThai>({ kieu: 'dang_tai' });

  useEffect(() => {
    let huy = false;
    fetch('/config/support-directory.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => { if (!huy) setTt({ kieu: 'xong', ds: locDanhBa(d) }); })
      .catch(() => { if (!huy) setTt({ kieu: 'loi' }); });
    return () => { huy = true; };
  }, []);

  const toi = kieu === 'toi';
  const chuPhu = toi ? 'text-white/90' : 'text-slate-700';

  return (
    <div className="flex flex-col gap-3">
      <p className={`text-[15px] font-semibold leading-relaxed ${toi ? 'text-white' : 'text-[#1e1b4b]'}`}>
        {tra(SO_NGAN_HANG, 'HUONG_DAN', lang)}
      </p>

      {tt.kieu === 'dang_tai' && (
        <p className={`text-[15px] ${chuPhu}`}>{tra(SO_NGAN_HANG, 'DANG_TAI', lang)}</p>
      )}
      {tt.kieu === 'loi' && (
        <p className={`text-[16px] font-bold leading-snug ${toi ? 'text-white' : 'text-red-800'}`} role="status">
          {tra(SO_NGAN_HANG, 'LOI', lang)}
        </p>
      )}
      {tt.kieu === 'xong' && tt.ds.length === 0 && (
        <p className={`text-[16px] font-bold leading-snug ${toi ? 'text-white' : 'text-[#1e1b4b]'}`} role="status">
          {tra(SO_NGAN_HANG, 'RONG', lang)}
        </p>
      )}

      {tt.kieu === 'xong' && tt.ds.map((nh) => (
        <div
          key={nh.id}
          className={toi
            ? 'rounded-2xl bg-black/35 border border-white/25 p-3.5'
            : 'rounded-[20px] bg-white border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] p-3.5'}
        >
          <p className={`font-black text-[16px] leading-snug mb-2 ${toi ? 'text-white' : 'text-[#1e1b4b]'}`}>{nh.ten}</p>
          <div className="flex flex-col gap-2">
            {nh.so.map((so) => (
              <a
                key={so}
                href={`tel:${soDeGoi(so)}`}
                className={`w-full min-h-[56px] px-4 rounded-2xl font-black text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
                  toi ? 'bg-white text-slate-900' : 'bg-[#1e1b4b] text-white'
                }`}
              >
                <PhoneCall size={20} className="shrink-0" aria-hidden="true" />
                <span>{thay(tra(SO_NGAN_HANG, 'GOI', lang) ?? '', { so })}</span>
              </a>
            ))}
          </div>
          <a
            href={nh.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 min-h-[52px] flex items-center gap-1.5 text-[14px] font-semibold leading-snug underline underline-offset-2 ${chuPhu}`}
          >
            <span className="[overflow-wrap:anywhere]">
              {thay(tra(SO_NGAN_HANG, 'NGUON', lang) ?? '', { tenMien: nh.tenMien, ngay: ngayHien(nh.ngayXacMinh) })}
            </span>
            <ExternalLink size={16} className="shrink-0" aria-hidden="true" />
          </a>
        </div>
      ))}
    </div>
  );
}

export function ManSoNganHang({
  setView, t, lang,
}: {
  setView: (v: any) => void;
  t: (s: string) => string;
  lang: Lang;
}) {
  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <button
        type="button"
        onClick={() => setView('family')}
        className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#1e1b4b] font-bold text-[15px]"
      >
        <ChevronLeft size={22} aria-hidden="true" />
        {t('Quay lại')}
      </button>
      <h1 className="text-[24px] font-black text-[#1e1b4b] mt-2 mb-3 leading-snug flex items-center gap-2">
        <Landmark size={24} aria-hidden="true" />
        {tra(SO_NGAN_HANG, 'TIEU_DE', lang)}
      </h1>
      <DanhSachSoNganHang lang={lang} kieu="sang" />
    </div>
  );
}
