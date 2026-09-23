import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Trash2 } from 'lucide-react';
import { luuLoiNhan, docLoiNhan, xoaLoiNhan } from '../lib/loi-nhan-giong';

/**
 * GHI LỜI NHẮN CỦA CON — tối đa 15 giây, lưu TRÊN MÁY BỐ MẸ (IndexedDB).
 * Phần 2 "Cầu dao gia đình", 23/9/2026.
 *
 * ⚠️ Không đường nào ra mạng — xem `lib/loi-nhan-giong.ts` và test quét nguồn.
 * ⚠️ Không có micro / bị từ chối quyền thì NÓI RA lý do, không im lặng (§4.3).
 */
const TOI_DA_GIAY = 15;

export function GhiLoiNhan({ t, onDaLuu }: { t: (s: string) => string; onDaLuu?: () => void }) {
  const [trangThai, setTrangThai] = useState<'san_sang' | 'dang_ghi' | 'da_co' | 'loi'>('san_sang');
  const [giay, setGiay] = useState(0);
  const [loi, setLoi] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const ghiRef = useRef<MediaRecorder | null>(null);
  const hen = useRef<number | undefined>(undefined);

  useEffect(() => {
    let taoRa: string | null = null;
    void docLoiNhan().then((b) => {
      if (b) { taoRa = URL.createObjectURL(b); setUrl(taoRa); setTrangThai('da_co'); }
    });
    return () => { if (taoRa) URL.revokeObjectURL(taoRa); window.clearInterval(hen.current); };
  }, []);

  const batDau = async () => {
    setLoi(null);
    try {
      const luong = await navigator.mediaDevices.getUserMedia({ audio: true });
      const manh: Blob[] = [];
      const ghi = new MediaRecorder(luong);
      ghi.ondataavailable = (e) => { if (e.data.size > 0) manh.push(e.data); };
      ghi.onstop = async () => {
        luong.getTracks().forEach((tr) => tr.stop());
        window.clearInterval(hen.current);
        const blob = new Blob(manh, { type: ghi.mimeType || 'audio/webm' });
        const ok = await luuLoiNhan(blob);
        if (!ok) {
          setLoi(t('Máy chưa cho lưu lời nhắn. Màn khẩn cấp sẽ dùng giọng máy đọc.'));
          setTrangThai('loi');
          return;
        }
        setUrl((cu) => { if (cu) URL.revokeObjectURL(cu); return URL.createObjectURL(blob); });
        setTrangThai('da_co');
        onDaLuu?.();
      };
      ghiRef.current = ghi;
      ghi.start();
      setGiay(0);
      setTrangThai('dang_ghi');
      const batDauLuc = Date.now();
      hen.current = window.setInterval(() => {
        const g = Math.floor((Date.now() - batDauLuc) / 1000);
        setGiay(g);
        if (g >= TOI_DA_GIAY && ghi.state === 'recording') ghi.stop();
      }, 250);
    } catch {
      setLoi(t('Chưa dùng được micro. Cho phép micro trong cài đặt máy rồi thử lại.'));
      setTrangThai('loi');
    }
  };

  const dung = () => { if (ghiRef.current?.state === 'recording') ghiRef.current.stop(); };
  const xoa = async () => {
    await xoaLoiNhan();
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setTrangThai('san_sang');
    onDaLuu?.();
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[16px] text-slate-700 leading-relaxed">
        {t('Câu gợi ý: "Mẹ ơi, con đây. Ai bảo chuyển tiền hay đọc mã thì mẹ cúp máy, gọi con nhé."')}
      </p>
      {trangThai === 'dang_ghi' ? (
        <button
          type="button"
          onClick={dung}
          className="w-full min-h-[56px] rounded-[18px] bg-red-700 text-white font-black text-[17px] flex items-center justify-center gap-2 px-3 leading-snug"
        >
          <Square size={20} aria-hidden="true" /> {t('Dừng ghi')} ({giay}/{TOI_DA_GIAY}s)
        </button>
      ) : (
        <button
          type="button"
          onClick={() => { void batDau(); }}
          className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] flex items-center justify-center gap-2 px-3 leading-snug"
        >
          <Mic size={20} aria-hidden="true" /> {trangThai === 'da_co' ? t('Ghi lại') : t('Bấm để ghi (tối đa 15 giây)')}
        </button>
      )}
      {trangThai === 'da_co' && url && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { void new Audio(url).play().catch(() => undefined); }}
            className="flex-1 min-h-[52px] rounded-[18px] border-2 border-[#2e1065] text-[#1e1b4b] font-bold text-[16px] flex items-center justify-center gap-2 px-3 leading-snug"
          >
            <Play size={18} aria-hidden="true" /> {t('Nghe lại')}
          </button>
          <button
            type="button"
            onClick={() => { void xoa(); }}
            className="min-h-[52px] px-4 rounded-[18px] border-2 border-rose-700 text-rose-800 font-bold text-[16px] flex items-center justify-center gap-2 leading-snug"
          >
            <Trash2 size={18} aria-hidden="true" /> {t('Xoá')}
          </button>
        </div>
      )}
      {loi && <p role="alert" className="text-[15px] font-bold text-rose-800 leading-snug">{loi}</p>}
      <p className="text-[14px] text-slate-600 leading-snug">{t('Lời nhắn chỉ lưu trên máy này. Đổi máy thì cần ghi lại.')}</p>
    </div>
  );
}
