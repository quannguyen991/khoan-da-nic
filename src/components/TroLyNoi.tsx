/**
 * ═════════ TRỢ LÝ NÓI — MÀN CHỈ CẦN NÓI, KHÔNG CẦN GÕ ═════════
 *
 * Người dùng chốt 20/9/2026: "người già cũng chỉ cần nói". Đúng — mỗi ô nhập
 * chữ là một lý do nữa để không mở app, và bác nào gõ được thì đã gõ ở màn kiểm
 * tin nhắn rồi.
 *
 * ⚠️ MÀN NÀY NÓI CHUYỆN. NÓ KHÔNG KẾT LUẬN. Mức rủi ro vẫn do bộ luật ở máy chủ
 * chấm, qua đúng đường `/api/analyze` mà mọi lượt kiểm khác đi. Khi lời bác kể
 * có một tình huống cần chấm, máy chủ trả về `canKiem` và màn này mọc ra MỘT NÚT
 * để bác bấm — không tự nhảy sang màn đỏ giữa câu chuyện. Xem chú thích dài ở
 * `backend/src/tro-ly-noi.js` để biết vì sao ranh giới nằm ở đó.
 *
 * ⚠️ §4.3 — BA THỨ CÓ THỂ HỎNG, CẢ BA ĐỀU PHẢI NÓI RA:
 *   ① máy không có bộ nghe giọng nói      → hiện ô gõ chữ thay, nói rõ vì sao
 *   ② máy chặn micro                       → "KHÔNG NGHE ĐƯỢC", không giả vờ nghe
 *   ③ máy chủ / model không chạy            → câu cố định, và KHÔNG có lời khuyên
 * Im lặng ở bất kỳ ca nào là để bác ngồi nói vào một cái máy đã tắt.
 *
 * ⚠️ §6.9 — Web Speech API gửi tiếng nói RA NGOÀI. Dòng khai báo chuyện đó nằm
 * ngay trên màn, không giấu trong phần cài đặt.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowLeft, ShieldAlert, Loader2, Send, Image as ImageIcon } from 'lucide-react';
import { api } from '../api-goc';
import { docTo, dungDocTo } from '../native';

type Luot = { vai: 'bac' | 'chau'; noiDung: string };

/** Ba trạng thái của cái vòng tròn to ở giữa. Không có trạng thái thứ tư. */
type TrangThai = 'cho' | 'nghe' | 'nghi';

export function TroLyNoi({
  t,
  lang,
  onVeTrangChu,
  onKiemTin,
}: {
  t: (s: string) => string;
  lang: 'vi' | 'en';
  onVeTrangChu: () => void;
  /** Đưa đoạn chữ (hoặc ảnh) qua đúng đường phân tích chung — màn này không tự chấm. */
  onKiemTin: (noiDung: string, anh?: string | null) => void;
}) {
  const [trangThai, setTrangThai] = useState<TrangThai>('cho');
  const [lichSu, setLichSu] = useState<Luot[]>([]);
  const [canKiem, setCanKiem] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [micHong, setMicHong] = useState(false);
  const [nheDuocGiongNoi, setNheDuocGiongNoi] = useState(true);
  const [dangGo, setDangGo] = useState('');

  const nhanRef = useRef<any>(null);
  const oAnhRef = useRef<HTMLInputElement | null>(null);
  const conSong = useRef(true);
  const lichSuRef = useRef<Luot[]>([]);
  lichSuRef.current = lichSu;

  useEffect(() => {
    /*
     * ⚠️ ĐẶT LẠI `true` Ở ĐẦU EFFECT, KHÔNG CHỈ Ở LÚC KHAI BÁO.
     *
     * StrictMode của React 18 chạy effect HAI LẦN lúc dựng: mount → dọn → mount.
     * Lần dọn đó đặt cờ về `false`, và lần mount thứ hai không có gì đặt nó lại.
     * Đo 20/9/2026: máy chủ trả lời đúng 200 OK, mà màn hình đứng mãi ở "Cháu
     * đang nghĩ…" — vì mọi lời đáp về tới đều bị coi là "bác đã rời màn rồi".
     *
     * Đúng dạng lỗi §4.3 một lần nữa: thứ hỏng trông y hệt thứ đang chạy.
     */
    conSong.current = true;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setNheDuocGiongNoi(false);
    return () => {
      conSong.current = false;
      try { nhanRef.current?.stop(); } catch { /* đã dừng */ }
      dungDocTo();
    };
  }, []);

  /**
   * Gửi một câu lên máy chủ và đọc to lời đáp.
   *
   * ⚠️ ĐỌC TO ĐI QUA `docTo()`, KHÔNG GỌI THẲNG `speechSynthesis` — trong WebView
   * của Android bộ đọc của trình duyệt hỏng IM LẶNG. Cùng lý do đã ghi ở màn kết quả.
   */
  const gui = useCallback(async (cau: string) => {
    const sach = cau.trim();
    if (!sach) return;

    setLoi(null);
    setCanKiem(null);
    setLichSu((cu) => [...cu, { vai: 'bac', noiDung: sach }]);
    setTrangThai('nghi');

    try {
      const res = await fetch(api('/api/tro-ly'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loiNoi: sach, lichSu: lichSuRef.current, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (!conSong.current) return;

      const loiDap = String(data?.loiDap || '').trim();
      if (!loiDap) throw new Error('rong');

      setLichSu((cu) => [...cu, { vai: 'chau', noiDung: loiDap }]);
      setCanKiem(typeof data?.canKiem === 'string' && data.canKiem.trim() ? data.canKiem : null);
      setTrangThai('cho');
      void docTo(loiDap, lang === 'en' ? 'en-US' : 'vi-VN').catch(() => { /* máy không đọc được */ });
    } catch {
      if (!conSong.current) return;
      /*
       * §4.3 — mất mạng và model hỏng trông giống hệt nhau từ đây, và bác không
       * cần phân biệt. Thứ bác cần biết là: LƯỢT NÀY CHÁU KHÔNG NGHĨ ĐƯỢC.
       * Không kèm lời khuyên nào — một lời khuyên sinh ra từ lượt hỏng là lời bịa.
       */
      setLoi(t('Lượt này cháu chưa trả lời được. Bác thử nói lại giúp cháu nhé.'));
      setTrangThai('cho');
    }
  }, [lang, t]);

  const batDauNghe = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setNheDuocGiongNoi(false); return; }

    dungDocTo();          // bác nói chen vào thì cháu im
    setLoi(null);
    setMicHong(false);

    try {
      const nhan = new SR();
      nhan.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      nhan.interimResults = false;
      nhan.continuous = false;       // tự dừng khi bác im — bác không phải bấm lần hai

      nhan.onresult = (e: any) => {
        const cau = Array.from(e.results as any)
          .map((r: any) => r[0]?.transcript || '')
          .join(' ')
          .trim();
        if (cau) void gui(cau);
        else setTrangThai('cho');
      };
      nhan.onerror = (e: any) => {
        if (e?.error === 'no-speech' || e?.error === 'aborted') { setTrangThai('cho'); return; }
        // Máy chặn micro: KHÔNG được để cái vòng tròn nhấp nháy như đang nghe.
        setMicHong(true);
        setTrangThai('cho');
      };
      nhan.onend = () => { if (conSong.current) setTrangThai((tt) => (tt === 'nghe' ? 'cho' : tt)); };

      nhanRef.current = nhan;
      nhan.start();
      setTrangThai('nghe');
    } catch {
      setMicHong(true);
      setTrangThai('cho');
    }
  }, [gui, lang]);

  const luotCuoi = lichSu[lichSu.length - 1];
  const cauHienTai = loi
    || (micHong ? t('Cháu không nghe được. Máy chưa cho Khoan Đã dùng micro.') : null)
    || (trangThai === 'nghe' ? t('Cháu đang nghe bác nói…') : null)
    || (trangThai === 'nghi' ? t('Cháu đang nghĩ…') : null)
    || (luotCuoi?.vai === 'chau' ? luotCuoi.noiDung : t('Bác bấm nút tròn rồi kể cháu nghe.'));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col w-full relative z-10 px-5 pt-4 pb-6 overflow-y-auto"
    >
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button
          type="button"
          aria-label={t('Quay lại')}
          onClick={onVeTrangChu}
          className="w-[52px] h-[52px] rounded-2xl border-2 border-[#2e1065] bg-white flex items-center justify-center text-[#2e1065] shrink-0"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="text-[20px] font-black text-[#2e1065]">{t('Nói cho cháu nghe')}</span>
      </div>

      {/*
        CÂU ĐANG DIỄN RA — to nhất màn, vì đây là thứ duy nhất bác cần đọc.
        `aria-live` để TalkBack đọc ra mỗi lần nó đổi.
      */}
      <div
        aria-live="polite"
        className="w-full rounded-3xl border-2 border-[#2e1065] bg-white shadow-[3px_3px_0_#2e1065] px-5 py-5 mb-5 shrink-0"
      >
        <p className="text-[22px] font-bold text-[#1e1b4b] leading-[1.35]">{cauHienTai}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 flex-1">
        <button
          type="button"
          data-vai-tro="nut-chinh"
          onClick={trangThai === 'nghe' ? () => { try { nhanRef.current?.stop(); } catch { /* đã dừng */ } } : batDauNghe}
          disabled={trangThai === 'nghi' || !nheDuocGiongNoi}
          aria-label={trangThai === 'nghe' ? t('Dừng nói') : t('Chạm để nói')}
          className={`w-40 h-40 rounded-full border-2 border-[#2e1065] flex items-center justify-center text-white disabled:opacity-60 ${
            trangThai === 'nghe'
              ? 'bg-red-600 shadow-[6px_6px_0_#2e1065] animate-pulse'
              : 'bg-[#7c3aed] shadow-[6px_6px_0_#2e1065]'
          }`}
        >
          {trangThai === 'nghi'
            ? <Loader2 size={56} className="animate-spin" />
            : <Mic size={56} strokeWidth={2.5} />}
        </button>

        {/*
          NÚT DUY NHẤT DẪN TỚI KẾT LUẬN. Nó không tự bấm: một màn đỏ nhảy ra giữa
          câu chuyện làm bác giật mình, mà giật mình là thứ kẻ lừa đảo đang bán.
        */}
        {canKiem && (
          <button
            type="button"
            data-vai-tro="nut-chinh"
            onClick={() => onKiemTin(canKiem)}
            className="w-full min-h-[56px] rounded-[22px] bg-amber-400 border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] text-[#2e1065] font-black text-[19px] flex items-center justify-center gap-2 px-4 leading-snug"
          >
            <ShieldAlert size={24} className="shrink-0" />
            <span>{t('Kiểm tin này ngay')}</span>
          </button>
        )}
      </div>

      {/*
        ═════ GÕ CHỮ VÀ GỬI ẢNH NẰM NGAY ĐÂY, KHÔNG PHẢI MỘT MÀN KHÁC ═════

        Màn gọn từng có một nút riêng "Kiểm tin nhắn". Thêm nút nói vào thành
        năm nút, và hàng rào `test/man-hinh-khong-trang.test.js` chặn lại — trần
        "chỉ còn vài việc" là lý do tồn tại của cả chế độ gọn, không phải thẩm mỹ.

        Ba đường này vốn là MỘT việc: kể cho cháu nghe chuyện gì đang xảy ra.
        Chỉ khác cách kể. Gộp lại thì màn gọn về đúng bốn nút mà không mất đường
        nào — bác gõ được vẫn gõ, bác có ảnh chụp màn hình vẫn gửi.

        §4.3 — khi máy KHÔNG nghe được giọng nói, phần này vẫn là lối đi duy
        nhất còn lại, nên kèm theo một dòng nói rõ vì sao.
      */}
      <div className="w-full mt-5 shrink-0">
          {!nheDuocGiongNoi && (
          <p className="text-[16px] font-bold text-[#6b3a05] leading-snug mb-2">
            {t('Máy của bác chưa nghe được giọng nói. Bác gõ giúp cháu vào ô dưới nhé.')}
          </p>
          )}
          <p className="text-[15px] font-bold text-slate-700 leading-snug mb-2">
            {t('Hoặc gõ chữ, hoặc gửi ảnh chụp màn hình.')}
          </p>
          <div className="flex gap-2">
            <input
              value={dangGo}
              onChange={(e) => setDangGo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && dangGo.trim()) { void gui(dangGo); setDangGo(''); } }}
              aria-label={t('Gõ điều bác muốn kể')}
              className="flex-1 min-h-[56px] rounded-2xl border-2 border-[#2e1065] px-4 text-[17px] text-[#1e1b4b]"
            />
            <button
              type="button"
              data-vai-tro="nut-chinh"
              aria-label={t('Chọn ảnh tình huống')}
              onClick={() => oAnhRef.current?.click()}
              className="w-14 h-14 rounded-2xl bg-white border-2 border-[#2e1065] text-[#2e1065] flex items-center justify-center shrink-0"
            >
              <ImageIcon size={24} />
            </button>
            <button
              type="button"
              data-vai-tro="nut-chinh"
              aria-label={t('Gửi')}
              onClick={() => { if (dangGo.trim()) { void gui(dangGo); setDangGo(''); } }}
              className="w-14 h-14 rounded-2xl bg-[#7c3aed] border-2 border-[#2e1065] text-white flex items-center justify-center shrink-0"
            >
              <Send size={24} />
            </button>
          </div>
          {/*
            Ảnh KHÔNG đi qua trợ lý. Nó đi thẳng đường phân tích chung, vì đó là
            đường duy nhất biết đọc chữ trong ảnh và biết khai `anh_ocr` /
            `ocrFailed` cho đúng (§4.3). Trợ lý chỉ biết chữ.
          */}
          <input
            ref={oAnhRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const tep = e.target.files?.[0];
              e.target.value = '';
              if (!tep) return;
              const doc = new FileReader();
              doc.onload = () => onKiemTin('', String(doc.result || ''));
              doc.onerror = () => setLoi(t('Cháu chưa mở được ảnh này. Bác thử ảnh khác nhé.'));
              doc.readAsDataURL(tep);
            }}
          />
        </div>

      {/*
        §6.9 — bộ nghe của trình duyệt gửi tiếng nói RA NGOÀI, và app khai
        "không gửi gì" ở mọi màn khác. Giấu chuyện này đi là một lời khai SAI,
        tệ hơn một lời khai thiếu. Cùng câu chữ với màn ghi âm.
      */}
      <p className="text-[14px] font-semibold text-slate-700 leading-snug mt-5 shrink-0">
        {t('Tiếng nói của bác được gửi ra ngoài để đổi thành chữ.')}
      </p>
    </motion.div>
  );
}
