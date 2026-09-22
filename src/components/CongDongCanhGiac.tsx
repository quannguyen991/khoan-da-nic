import { useEffect, useState } from 'react';
import { ChevronLeft, Users, ShieldCheck, Send, Sparkles } from 'lucide-react';
import { api } from '../api-goc';
import type { ViewState } from '../App';

type BaiViet = {
  id: string;
  luc: number;
  tomTat: string;
  hoKichBan: string | null;
  maLyDo: string[];
};

/**
 * ⚠️ `setView: (v: any) => void` BỊ ĐỔI SANG `ViewState` — SỬA 22/9/2026.
 * `any` vô hiệu hoá đúng thứ `tsconfig.json` bật `strict` để bắt (xem chú
 * thích ở kiểu `NguoiThan` trong `App.tsx`): gõ `setView('conf_dong')` sai
 * chính tả sẽ biên dịch xanh và im lặng không điều hướng đi đâu cả.
 */
export function CongDongCanhGiac({ t, setView }: { t: (s: string) => string; setView: (v: ViewState) => void }) {
  const [baiViet, setBaiViet] = useState<BaiViet[]>([]);
  const [noiDung, setNoiDung] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [thongBao, setThongBao] = useState<string | null>(null);

  useEffect(() => {
    fetch(api('/api/cong-dong/canh-giac'))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBaiViet(Array.isArray(d?.baiViet) ? d.baiViet : []))
      .catch(() => setBaiViet([]));
  }, []);

  const gui = async () => {
    if (noiDung.trim().length < 12 || dangGui) return;
    setDangGui(true);
    setThongBao(null);
    try {
      const r = await fetch(api('/api/cong-dong/canh-giac'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noiDung }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.maLoi || 'GUI_THAT_BAI');
      setNoiDung('');
      setThongBao(t('Đã nhận chia sẻ ẩn danh. AI đã tổng hợp; bài đang chờ duyệt trước khi hiện cho cộng đồng.'));
    } catch {
      setThongBao(t('Chưa gửi được lúc này. Bác thử lại khi mạng ổn định nhé.'));
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto overflow-y-auto">
      <button type="button" onClick={() => setView('home')} className="min-h-[52px] flex items-center gap-1 text-[#321379] font-bold text-[15px]">
        <ChevronLeft size={22} aria-hidden="true" /> {t('Quay lại')}
      </button>

      <div className="flex items-center gap-3 mt-2 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-[#f1e8ff] text-[#7c3aed] flex items-center justify-center">
          <Users size={25} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-[24px] font-black text-[#321379] leading-tight">{t('Cộng đồng cảnh giác')}</h1>
          <p className="text-[14px] text-slate-600">{t('Chia sẻ để mọi người cùng đề phòng')}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-[#e4d4ff] shadow-[0_10px_30px_rgba(91,33,182,0.10)] p-4 mt-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-[#7c3aed] shrink-0 mt-0.5" size={22} aria-hidden="true" />
          <p className="text-[14px] text-[#51436f] leading-relaxed">
            {t('Bài đăng hoàn toàn ẩn danh. Khoan Đã không lưu tên, số điện thoại, đường link hay nội dung gốc; chỉ giữ bản tóm tắt an toàn sau khi AI lọc và có người duyệt.')}
          </p>
        </div>
        <textarea
          value={noiDung}
          onChange={(e) => setNoiDung(e.target.value.slice(0, 5000))}
          placeholder={t("Bác gặp tình huống gì? Hãy kể ngắn gọn để mọi người cảnh giác...")}
          className="mt-4 w-full min-h-[128px] rounded-2xl border border-[#dcc7ff] bg-[#fcfaff] p-3 text-[15px] text-[#321379] outline-none focus:ring-2 focus:ring-[#c4a7ff] resize-none"
          aria-label={t("Kể lại tình huống")}
        />
        <div className="flex items-center justify-between mt-2 gap-3">
          <span className="text-[14px] text-slate-500">{noiDung.length}/5000</span>
          <button
            type="button"
            onClick={gui}
            disabled={noiDung.trim().length < 12 || dangGui}
            className="min-h-[52px] px-5 rounded-full bg-gradient-to-r from-[#9e76ea] to-[#7c3aed] text-white font-bold flex items-center gap-2 disabled:opacity-40"
          >
            <Send size={18} aria-hidden="true" /> {dangGui ? t('Đang tổng hợp…') : t('Gửi ẩn danh')}
          </button>
        </div>
        {thongBao && <p className="text-[14px] font-bold text-[#5b21b6] mt-3 leading-snug">{thongBao}</p>}
      </div>

      <div className="mt-7 flex items-center gap-2">
        <Sparkles size={20} className="text-[#7c3aed]" aria-hidden="true" />
        <h2 className="text-[18px] font-black text-[#321379]">{t('Cảnh báo đã được duyệt')}</h2>
      </div>
      {baiViet.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-[#faf7ff] border border-[#eadcff] p-4 text-[14px] text-slate-600 leading-relaxed">
          {t('Chưa có bài cảnh báo công khai. Những chia sẻ mới sẽ được ẩn danh, tổng hợp và kiểm duyệt trước khi xuất hiện ở đây.')}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {baiViet.map((b) => (
            <article key={b.id} className="rounded-2xl bg-white border border-[#e4d4ff] p-4 shadow-[0_6px_18px_rgba(91,33,182,0.08)]">
              <p className="text-[15px] text-[#321379] leading-relaxed">{b.tomTat}</p>
              <p className="text-[14px] text-slate-500 mt-2">{t('Đăng ẩn danh')} · {new Date(b.luc).toLocaleDateString('vi-VN')}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
