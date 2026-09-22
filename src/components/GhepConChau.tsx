import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Link2, ShieldAlert, UserMinus, Users } from 'lucide-react';
import type { ViewState } from '../App';
import { docPhien, docVongGhep, layMaGhep, thuHoiNguoiDaGhep, LoiTaiKhoan, type NguoiDaGhep } from '../tai-khoan';

/**
 * ══════════ NỐI VỚI CON CHÁU — màn của BỐ MẸ (chủ tài khoản) ══════════
 *
 * Bác lấy mã 6 số, đọc cho con cháu; con cháu nhập ở màn Guardian. Thêm 22/9/2026.
 *
 * ⚠️ MÃ NÀY TRÔNG Y HỆT MÃ OTP — VÀ KẺ LỪA ĐẢO SẼ XIN NÓ Y HỆT.
 * "Bác đọc giúp cháu cái mã 6 số trong app" là đúng câu mà cả sản phẩm này dạy
 * bác KHÔNG làm theo. Nếu kẻ gian lấy được mã, chúng thành "con cháu" trong vòng
 * tròn và thấy tên, số của bác. Nên:
 *   · Mã KHÔNG tự hiện — bác phải bấm lấy, và lời dặn nằm NGAY TRÊN mã.
 *   · Lời dặn nói rõ: chỉ đọc khi con cháu đang ở cạnh, hoặc BÁC tự gọi cho con
 *     bằng số đã lưu — không bao giờ cho người gọi đến hay nhắn tin xin.
 *   · Danh sách người đã nối luôn hiện ở dưới, kèm nút thu hồi một chạm (§9.8:
 *     chủ tài khoản thu hồi không cần ai đồng ý). Lỡ nối nhầm thì gỡ ngay được.
 *
 * ⚠️ §11 — KHÔNG NÓI "con cháu đã theo dõi được máy bác". Nối chỉ cho hai bên
 * biết tên và số của nhau; pin, vị trí, tin nhắn không đi đâu cả.
 */

const LOI: Record<string, string> = {
  CHUA_DANG_NHAP: 'Bác cần đăng nhập lại.',
  THU_LAI_SAU: 'Bác chờ một lát rồi thử lại nhé.',
};

function chuLoi(e: unknown): string {
  const ma = e instanceof LoiTaiKhoan ? e.ma : '';
  return LOI[ma] ?? 'Chưa kết nối được máy chủ. Bác thử lại sau nhé.';
}

export function ManGhepConChau({ t, setView }: { t: (s: string) => string; setView: (v: ViewState) => void }) {
  const daDangNhap = docPhien() !== null;
  const [ma, setMa] = useState<string | null>(null);
  const [hetHanLuc, setHetHanLuc] = useState(0);
  const [conLai, setConLai] = useState(0);
  const [ds, setDs] = useState<NguoiDaGhep[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangLam, setDangLam] = useState(false);

  const taiDs = useCallback(async () => {
    try {
      setDs((await docVongGhep()).thanhVien);
    } catch (e) {
      // §4.3 — không tải được thì nói là không tải được, KHÔNG vẽ "chưa nối ai".
      setDs(null);
      setLoi(chuLoi(e));
    }
  }, []);

  useEffect(() => { if (daDangNhap) void taiDs(); }, [daDangNhap, taiDs]);

  useEffect(() => {
    if (!ma) return;
    const dem = () => {
      const giay = Math.max(0, Math.round((hetHanLuc - Date.now()) / 1000));
      setConLai(giay);
      if (giay === 0) setMa(null);
    };
    dem();
    const id = window.setInterval(dem, 1000);
    return () => window.clearInterval(id);
  }, [ma, hetHanLuc]);

  // Con cháu nhập mã xong thì danh sách phải tự hiện người mới — hỏi lại vài giây một lần khi mã còn sống.
  useEffect(() => {
    if (!ma) return;
    const id = window.setInterval(() => { void taiDs(); }, 5000);
    return () => window.clearInterval(id);
  }, [ma, taiDs]);

  const layMa = async () => {
    setDangLam(true);
    setLoi(null);
    try {
      const r = await layMaGhep();
      setMa(r.ma);
      setHetHanLuc(Date.now() + r.hetHanSauGiay * 1000);
    } catch (e) {
      setLoi(chuLoi(e));
    } finally {
      setDangLam(false);
    }
  };

  const thuHoi = async (id: string) => {
    setLoi(null);
    try {
      await thuHoiNguoiDaGhep(id);
      await taiDs();
    } catch (e) {
      setLoi(chuLoi(e));
    }
  };

  const phut = Math.floor(conLai / 60);
  const giay = String(conLai % 60).padStart(2, '0');

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full overflow-y-auto">
      <button
        type="button"
        onClick={() => setView('settings')}
        className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#1e1b4b] font-bold text-[15px]"
      >
        <ChevronLeft size={22} aria-hidden="true" /> {t('Quay lại')}
      </button>

      <h1 className="text-[24px] font-black text-[#1e1b4b] mt-2 mb-1 leading-snug">{t('Nối với con cháu')}</h1>
      <p className="text-[16px] text-slate-700 leading-relaxed mb-4">
        {t('Con cháu sẽ thấy tên và số điện thoại của bác để gọi khi cần. Tin nhắn, vị trí, pin của máy bác không gửi đi đâu.')}
      </p>

      {!daDangNhap ? (
        <div className="bg-white border-2 border-[#2e1065] rounded-[18px] p-4">
          <p className="text-[16px] font-semibold text-[#1e1b4b] leading-snug mb-3">{t('Bác cần có tài khoản để nối với con cháu.')}</p>
          <button
            type="button"
            onClick={() => setView('login')}
            className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px]"
          >
            {t('Đăng nhập hoặc tạo tài khoản')}
          </button>
        </div>
      ) : (
        <>
          {/* Lời dặn ĐỨNG TRƯỚC mã, không phải sau — xem chú thích đầu tệp. */}
          <div role="note" className="flex gap-3 bg-rose-50 border-2 border-rose-700 rounded-[18px] p-4 mb-3">
            <ShieldAlert size={22} className="text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[16px] font-bold text-rose-950 leading-snug">
              {t('Chỉ đọc mã cho con cháu đang ngồi cạnh bác, hoặc khi bác tự gọi cho con bằng số đã lưu. Ai gọi đến hay nhắn tin xin mã này thì đó là lừa đảo.')}
            </p>
          </div>

          {ma ? (
            <div className="bg-white border-2 border-[#2e1065] shadow-[3px_3px_0_#2e1065] rounded-[18px] p-5 mb-3 text-center" aria-live="polite">
              <p className="text-[15px] font-bold text-slate-700 mb-1">{t('Mã nối của bác')}</p>
              <p className="text-[44px] font-black text-[#1e1b4b] leading-tight tracking-[0.2em] tabular-nums" aria-label={ma.split('').join(' ')}>{ma}</p>
              <p className="text-[15px] font-semibold text-slate-700 mt-1">
                {t('Còn hiệu lực')} {phut}:{giay} · {t('Dùng được một lần')}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={layMa}
              disabled={dangLam}
              className="w-full min-h-[56px] mb-3 rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Link2 size={20} aria-hidden="true" /> {t('Lấy mã để con cháu nhập')}
            </button>
          )}

          {loi && <p role="alert" className="text-[15px] font-bold text-rose-800 mb-3">{t(loi)}</p>}

          <h2 className="flex items-center gap-2 text-[18px] font-black text-[#1e1b4b] mt-5 mb-2">
            <Users size={20} aria-hidden="true" /> {t('Đang nối với')}
          </h2>
          {ds === null ? (
            <p className="text-[15px] text-slate-600">{t('Chưa tải được danh sách.')}</p>
          ) : ds.length === 0 ? (
            <p className="text-[15px] text-slate-600">{t('Chưa nối với ai.')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ds.map((n) => (
                <li key={n.id} className="bg-white border-2 border-[#2e1065] rounded-[18px] px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-black text-[#1e1b4b] leading-snug break-words">{n.ten}</p>
                    <p className="text-[15px] font-semibold text-slate-700">{n.so}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => thuHoi(n.id)}
                    className="min-h-[52px] px-3 rounded-[14px] border-2 border-rose-700 text-rose-800 font-bold text-[15px] flex items-center gap-1.5 shrink-0"
                  >
                    <UserMinus size={18} aria-hidden="true" /> {t('Gỡ nối')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
