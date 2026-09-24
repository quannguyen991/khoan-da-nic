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
import { QuaCauNoi } from './QuaCauNoi';

type Luot = { vai: 'bac' | 'chau'; noiDung: string };

const KHOA_DA_BAO_GIONG = 'khoan_da_da_bao_giong_ra_ngoai';

/** Ba trạng thái của cái vòng tròn to ở giữa. Không có trạng thái thứ tư. */
type TrangThai = 'cho' | 'nghe' | 'nghi';

export function TroLyNoi({
  t,
  lang,
  onVeTrangChu,
  onKiemTin,
  coThanhDuoi = false,
}: {
  t: (s: string) => string;
  lang: 'vi' | 'en';
  onVeTrangChu: () => void;
  /** Đưa đoạn chữ (hoặc ảnh) qua đúng đường phân tích chung — màn này không tự chấm. */
  onKiemTin: (noiDung: string, anh?: string | null) => void;
  /**
   * Chế độ siêu đơn giản có thanh "Quay lại" nằm ĐÈ lên đáy màn (absolute, ~95px).
   * Đo trên máy thật 24/9/2026: nó che mất cả hàng ô gõ chữ + gửi ảnh + gửi.
   * Có thanh thì chừa đáy cho nó.
   */
  coThanhDuoi?: boolean;
}) {
  const [trangThai, setTrangThai] = useState<TrangThai>('cho');
  const [lichSu, setLichSu] = useState<Luot[]>([]);
  const [canKiem, setCanKiem] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [micHong, setMicHong] = useState(false);
  const [nheDuocGiongNoi, setNheDuocGiongNoi] = useState(true);
  const [dangGo, setDangGo] = useState('');
  /**
   * §6.9 — ĐÃ BÁO "GIỌNG NÓI ĐI RA NGOÀI" CHƯA. Người dùng chọn 24/9/2026: dòng báo
   * thường trực ở đáy màn là thừa; chỉ báo tới lần ĐẦU bác bấm nói. §6.9 đòi nói rõ
   * TRƯỚC khi gửi — dòng này hiện ngay dưới nút micro, nên bác đọc nó trước lần bấm
   * đầu tiên. Cờ nhỏ trong localStorage (§6.9 cho phép "chỉ cờ nhỏ"), bị chặn thì
   * coi như CHƯA báo — thà báo thêm một lần còn hơn không báo.
   */
  const [daBaoGiong, setDaBaoGiong] = useState(() => {
    try { return localStorage.getItem(KHOA_DA_BAO_GIONG) === '1'; } catch { return false; }
  });

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
    // Bác đã thấy dòng báo ngay dưới nút này trước khi bấm — từ nay không cần nhắc.
    setDaBaoGiong(true);
    try { localStorage.setItem(KHOA_DA_BAO_GIONG, '1'); } catch { /* bị chặn thì lần sau báo lại */ }

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

  const dangNghe = trangThai === 'nghe';
  const dungNghe = () => { try { nhanRef.current?.stop(); } catch { /* đã dừng */ } };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      /*
        ═════ DỰNG LẠI 24/9/2026 — cùng một thế giới với màn "Bác kể đi" ═════
        Người dùng: "trang này trông hơi nhàm chán, cho thêm cái bong bóng nổi
        như ChatGPT… giống màn Bác kể đi". Bản trước là viền đen + bóng cứng,
        một ô chữ và một nút tròn — hai màn cùng việc "kể cho cháu" mà trông như
        hai app khác nhau. Nay dùng lại đúng quả cầu, nền và nút của màn đó.
      */
      className={`flex-1 flex flex-col w-full relative z-10 px-5 pt-3 overflow-y-auto bg-[radial-gradient(circle_at_50%_26%,rgba(196,181,253,0.5),transparent_42%)] ${coThanhDuoi ? 'pb-32' : 'pb-6'}`}
    >
      <div className="w-full flex items-center justify-between gap-3 mb-1 shrink-0">
        <button
          type="button"
          aria-label={t('Quay lại')}
          onClick={onVeTrangChu}
          className="w-[52px] h-[52px] rounded-full border border-white/80 bg-white/60 backdrop-blur-md flex items-center justify-center text-[#321379] shadow-[0_8px_22px_rgba(109,40,217,0.14)] active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="text-center text-[20px] font-black text-[#321379] leading-snug">{t('Nói cho cháu nghe')}</span>
        {/* Cân hai bên để tiêu đề nằm đúng giữa. */}
        <span className="w-[52px] shrink-0" aria-hidden="true" />
      </div>

      {/*
        Cả cụm (quả cầu → bong bóng → micro → ô gõ) nằm GIỮA màn theo chiều dọc
        bằng `mt-auto` ở đây + `mb-auto` ở dòng cuối. Bản trước đẩy ô gõ xuống sát
        đáy (một khoảng trống lớn ở giữa, và thanh "Quay lại" đè lên). Lề tự động
        về 0 khi nội dung dài hơn màn, nên không bị cắt đầu như `justify-center`.
      */}
      <div className="flex flex-col items-center w-full mt-auto pt-2">
        {/*
          QUẢ CẦU NỔI — cùng nhân vật với màn "Bác kể đi". Trôi nhẹ khi rảnh,
          vòng sóng khi đang nghe, quầng sáng thở khi đang nghĩ, XÁM VÀ ĐỨNG IM
          khi micro bị chặn (§4.3 — hỏng thì không được trông như đang chạy).
        */}
        <QuaCauNoi
          dangNghe={dangNghe}
          micHong={micHong}
          dangNghi={trangThai === 'nghi'}
          troiNoi
          coDuoi={false}
          className="w-[56vw] max-w-[260px] h-[24vh] min-h-[160px] max-h-[290px] mt-1"
        />

        {/*
          CÂU ĐANG DIỄN RA — to nhất màn, vì đây là thứ duy nhất bác cần đọc.
          Nay là BONG BÓNG THOẠI của chính quả cầu (đuôi chỉ lên), không phải một
          tấm thẻ đứng riêng. `aria-live` để TalkBack đọc ra mỗi lần nó đổi.
        */}
        <div className="relative w-full max-w-md mt-3 mb-5">
          <span
            aria-hidden="true"
            className={`absolute left-1/2 -top-2 -translate-x-1/2 w-5 h-5 rotate-45 rounded-[4px] border-l border-t ${
              micHong || loi ? 'bg-[#fff7ed] border-[#fdba74]' : 'bg-white border-white'
            }`}
          />
          <div
            aria-live="polite"
            className={`relative rounded-[28px] border px-5 py-4 shadow-[0_14px_36px_rgba(109,40,217,0.14)] ${
              micHong || loi ? 'bg-[#fff7ed] border-[#fdba74]' : 'bg-white/90 border-white backdrop-blur-sm'
            }`}
          >
            <p className={`text-center text-[21px] font-bold leading-[1.4] ${micHong || loi ? 'text-[#9a3412]' : 'text-[#321379]'}`}>
              {cauHienTai}
            </p>
          </div>
        </div>

        {/* Nút micro — cùng hình với màn "Bác kể đi": đổi hình, không đổi chỗ. */}
        <button
          type="button"
          data-vai-tro="nut-chinh"
          onClick={dangNghe ? dungNghe : batDauNghe}
          disabled={trangThai === 'nghi' || !nheDuocGiongNoi}
          aria-label={dangNghe ? t('Dừng nói') : t('Chạm để nói')}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
        >
          <span className={`w-[84px] h-[84px] rounded-full border border-white/90 shadow-[0_14px_34px_rgba(124,58,237,0.3)] flex items-center justify-center text-white ${
            dangNghe ? 'bg-gradient-to-b from-[#8b5cf6] to-[#5b21b6]' : 'bg-gradient-to-b from-[#a78bfa] to-[#7c3aed]'
          }`}>
            {trangThai === 'nghi'
              ? <Loader2 size={36} className="animate-spin" />
              : dangNghe ? <span className="w-8 h-8 rounded-lg bg-white" /> : <Mic size={36} strokeWidth={2.5} />}
          </span>
          <span className="text-[#321379] font-black text-[16px] leading-snug">
            {dangNghe ? t('Dừng nói') : t('Chạm để nói')}
          </span>
        </button>

        {/*
          §6.9 — bộ nghe của trình duyệt gửi tiếng nói RA NGOÀI, và app khai "không
          gửi gì" ở mọi màn khác. Giấu hẳn là một lời khai SAI. Nhưng một dòng thường
          trực ở đáy màn thì người dùng thấy thừa (24/9/2026) — nên chỉ hiện NGAY DƯỚI
          NÚT cho tới lần bấm đầu. Máy không nghe được giọng nói thì không có gì để báo.
        */}
        {nheDuocGiongNoi && !daBaoGiong && (
          <p className="w-full max-w-xs mt-2 text-center text-[14px] font-semibold text-slate-700 leading-snug">
            {t('Tiếng nói của bác được gửi ra ngoài để đổi thành chữ.')}
          </p>
        )}

        {/*
          NÚT DUY NHẤT DẪN TỚI KẾT LUẬN. Nó không tự bấm: một màn đỏ nhảy ra giữa
          câu chuyện làm bác giật mình, mà giật mình là thứ kẻ lừa đảo đang bán.
        */}
        {canKiem && (
          <button
            type="button"
            data-vai-tro="nut-chinh"
            onClick={() => onKiemTin(canKiem)}
            className="w-full max-w-md mt-4 min-h-[56px] rounded-full bg-amber-400 border border-amber-500 shadow-[0_12px_28px_rgba(217,119,6,0.28)] text-[#2e1065] font-black text-[19px] flex items-center justify-center gap-2 px-5 leading-snug active:scale-[0.98] transition-transform"
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
      <div className="w-full max-w-md mx-auto mt-6 shrink-0">
          {!nheDuocGiongNoi && (
          <p className="text-center text-[16px] font-bold text-[#6b3a05] leading-snug mb-2">
            {t('Máy của bác chưa nghe được giọng nói. Bác gõ giúp cháu vào ô dưới nhé.')}
          </p>
          )}
          <p className="text-center text-[15px] font-bold text-[#4c3a78] leading-snug mb-2">
            {t('Hoặc gõ chữ, hoặc gửi ảnh chụp màn hình.')}
          </p>
          {/* Một viên thuốc kính mờ chứa cả ba thứ — ô gõ, nút ảnh, nút gửi. */}
          <div className="flex items-center gap-2 rounded-full bg-white/80 border border-white shadow-[0_12px_30px_rgba(109,40,217,0.14)] backdrop-blur-md p-1.5">
            <input
              value={dangGo}
              onChange={(e) => setDangGo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && dangGo.trim()) { void gui(dangGo); setDangGo(''); } }}
              aria-label={t('Gõ điều bác muốn kể')}
              placeholder={t('Gõ chữ...')}
              className="flex-1 min-w-0 min-h-[56px] rounded-full bg-transparent px-4 text-[17px] text-[#1e1b4b] placeholder:text-[#6b5b95] outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]"
            />
            <button
              type="button"
              data-vai-tro="nut-chinh"
              aria-label={t('Chọn ảnh tình huống')}
              onClick={() => oAnhRef.current?.click()}
              className="w-14 h-14 rounded-full bg-[#f3eeff] border border-[#ddd0fb] text-[#5b21b6] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <ImageIcon size={24} />
            </button>
            <button
              type="button"
              data-vai-tro="nut-chinh"
              aria-label={t('Gửi')}
              onClick={() => { if (dangGo.trim()) { void gui(dangGo); setDangGo(''); } }}
              className="w-14 h-14 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9] text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(124,58,237,0.3)] active:scale-95 transition-transform"
            >
              <Send size={22} />
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

      {/* Neo đáy cho cụm giữa (`mt-auto` ở trên + `mb-auto` ở đây). Dòng §6.9 đã dời lên dưới nút micro. */}
      <div className="mb-auto" aria-hidden="true" />
    </motion.div>
  );
}
