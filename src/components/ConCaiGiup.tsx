import { useEffect, useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import type { ViewState } from '../App';
import {
  docPhien, dangKy, dangNhap, docQuyTacBao, datQuyTacBao, LoiTaiKhoan,
  type HoSo, type NguoiDaGhep, type QuyTacBao,
} from '../tai-khoan';
import { ManGhepConChau } from './GhepConChau';
import { GhiLoiNhan } from './GhiLoiNhan';
import { laApk } from '../native';

/**
 * ═════ CON CHÁU CÀI GIÚP — làm trên MÁY BỐ MẸ, con ngồi cạnh ═════
 * Phần 2 "Cầu dao gia đình", 23/9/2026.
 *
 * Người cài app cho người già thường là con cháu. Đo trước đó: màn giới thiệu 4
 * trang không bước nào xin số con, nên nút gọi khẩn cấp mặc định TRỐNG.
 *
 * Năm bước, mỗi màn một việc, bước nào (trừ tài khoản) cũng bỏ qua được:
 *   tai_khoan → noi_may → loi_nhan → quy_tac → dien_tap
 *
 * ⚠️ §12 — công tắc "báo cho con" MẶC ĐỊNH TẮT, bố mẹ tự bật.
 * ⚠️ Lời nhắn giọng chỉ nằm trên máy này (người dùng chọn 23/9).
 * ⚠️ Bước nối máy NHÚNG đúng màn ghép đã có (`ManGhepConChau nhung`) — một luồng
 *    mã duy nhất, cùng lời dặn chống lừa đứng trên mã.
 */
type Buoc = 'tai_khoan' | 'noi_may' | 'loi_nhan' | 'quy_tac' | 'dien_tap';
const THU_TU: Buoc[] = ['tai_khoan', 'noi_may', 'loi_nhan', 'quy_tac', 'dien_tap'];

const LOI_TK: Record<string, string> = {
  SO_DA_DUOC_DANG_KY: 'Số này đã có tài khoản. Bấm "Đã có tài khoản? Đăng nhập" nhé.',
  SO_DIEN_THOAI_KHONG_HOP_LE: 'Số điện thoại chưa đúng.',
  THIEU_TEN: 'Cần nhập tên gọi của bố mẹ.',
  MAT_KHAU_QUA_NGAN: 'Mật khẩu cần ít nhất 6 ký tự.',
  SAI_SO_HOAC_MAT_KHAU: 'Số hoặc mật khẩu chưa đúng.',
  THU_LAI_SAU: 'Chờ một lát rồi thử lại nhé.',
};

export function ManConCaiGiup({ t, setView, onDangNhapXong, onDanhSachGhep, onDienTap }: {
  t: (s: string) => string;
  setView: (v: ViewState) => void;
  onDangNhapXong: (hs: HoSo) => void;
  onDanhSachGhep: (ds: NguoiDaGhep[]) => void;
  onDienTap: () => void;
}) {
  const [buoc, setBuoc] = useState<Buoc>(docPhien() ? 'noi_may' : 'tai_khoan');
  const [so, setSo] = useState('');
  const [ten, setTen] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [dangLam, setDangLam] = useState(false);
  const [quyTac, setQuyTac] = useState<QuyTacBao>({ baoKhiCao: false, baoKhiOtpTrongCuocGoi: false });
  const [daLuuQuyTac, setDaLuuQuyTac] = useState(false);
  /*
   * ⚠️ `laApk()` TRẢ PROMISE (phải hỏi cầu nối native). Viết `laApk() && …` thẳng
   * trong JSX là điều kiện LUÔN ĐÚNG — công tắc chỉ-APK sẽ hiện cả trên web. Hỏi
   * một lần lúc mở màn, cùng cách App.tsx làm (`dangChayApk`).
   */
  const [dangChayApk, setDangChayApk] = useState(false);
  useEffect(() => { void laApk().then(setDangChayApk).catch(() => setDangChayApk(false)); }, []);

  useEffect(() => {
    if (buoc !== 'quy_tac' || !docPhien()) return;
    void docQuyTacBao().then(setQuyTac).catch(() => undefined);
  }, [buoc]);

  const tiep = () => {
    const sau = THU_TU[THU_TU.indexOf(buoc) + 1];
    setLoi(null);
    if (sau) setBuoc(sau); else setView('home');
  };

  const vaoTaiKhoan = async (moi: boolean) => {
    setDangLam(true);
    setLoi(null);
    try {
      const hs = moi ? await dangKy(so, matKhau, ten) : await dangNhap(so, matKhau);
      onDangNhapXong(hs);
      setBuoc('noi_may');
    } catch (e) {
      const ma = e instanceof LoiTaiKhoan ? e.ma : '';
      setLoi(t(LOI_TK[ma] ?? 'Chưa kết nối được máy chủ. Thử lại sau nhé.'));
    } finally {
      setDangLam(false);
    }
  };

  const luuQuyTac = async (moi: QuyTacBao) => {
    setQuyTac(moi);
    setDaLuuQuyTac(false);
    setLoi(null);
    try {
      setQuyTac(await datQuyTacBao(moi));
      setDaLuuQuyTac(true);
    } catch {
      setLoi(t('Chưa lưu được. Kiểm tra mạng rồi thử lại.'));
    }
  };

  const o = 'w-full min-h-[56px] rounded-[18px] border-2 border-slate-300 focus:border-[#6d28d9] px-4 text-[18px] text-slate-900 outline-none';
  const nutChinh = 'w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] px-3 leading-snug disabled:opacity-60';
  const nutPhu = 'w-full min-h-[52px] rounded-[18px] border-2 border-slate-400 text-slate-700 font-bold text-[16px] px-3 leading-snug';
  const soBuoc = THU_TU.indexOf(buoc) + 1;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full overflow-y-auto">
      <button
        type="button"
        onClick={() => setView('home')}
        className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#1e1b4b] font-bold text-[15px]"
      >
        <ChevronLeft size={22} aria-hidden="true" /> {t('Quay lại')}
      </button>
      <p className="text-[15px] font-bold text-[#6d28d9] mt-1">{t('Bước {i}/5').replace('{i}', String(soBuoc))}</p>

      {buoc === 'tai_khoan' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Tài khoản cho bố mẹ')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Dùng số điện thoại của bố mẹ. Mật khẩu để con giữ giúp.')}</p>
          <label className="text-[15px] font-bold text-slate-700" htmlFor="cg-so">{t('Số điện thoại của bố mẹ')}</label>
          <input id="cg-so" inputMode="tel" autoComplete="tel" value={so} onChange={(e) => setSo(e.target.value)} className={o} />
          <label className="text-[15px] font-bold text-slate-700" htmlFor="cg-ten">{t('Tên gọi (để con cháu nhận ra)')}</label>
          <input id="cg-ten" value={ten} onChange={(e) => setTen(e.target.value)} className={o} />
          <label className="text-[15px] font-bold text-slate-700" htmlFor="cg-mk">{t('Mật khẩu')}</label>
          <input id="cg-mk" type="password" autoComplete="new-password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} className={o} />
          {loi && <p role="alert" className="text-[15px] font-bold text-rose-800 leading-snug">{loi}</p>}
          <button type="button" disabled={dangLam} onClick={() => { void vaoTaiKhoan(true); }} className={nutChinh}>{t('Tạo tài khoản')}</button>
          <button type="button" disabled={dangLam} onClick={() => { void vaoTaiKhoan(false); }} className={nutPhu}>{t('Đã có tài khoản? Đăng nhập')}</button>
        </section>
      )}

      {buoc === 'noi_may' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Nối với máy của con')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Trên máy con: mở Khoan Đã, chọn "Con cháu", nhập mã dưới đây. Nối xong, số của con tự vào nút gọi khẩn cấp.')}</p>
          <ManGhepConChau t={t} setView={setView} nhung onDanhSach={onDanhSachGhep} />
          <button type="button" onClick={tiep} className={nutChinh}>{t('Tiếp tục')}</button>
        </section>
      )}

      {buoc === 'loi_nhan' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Lời nhắn bằng giọng của con')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Khi có nguy hiểm cao, máy sẽ phát lời nhắn này thay cho giọng máy đọc.')}</p>
          <GhiLoiNhan t={t} />
          <button type="button" onClick={tiep} className={nutChinh}>{t('Tiếp tục')}</button>
        </section>
      )}

      {buoc === 'quy_tac' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Báo cho con khi có chuyện')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Chỉ báo mức nguy hiểm và loại tình huống. Nội dung tin nhắn không gửi đi đâu.')}</p>
          <label className="flex items-center gap-3 min-h-[56px] rounded-[18px] border-2 border-[#2e1065] px-4 py-3">
            <input
              type="checkbox"
              className="w-6 h-6 shrink-0"
              checked={quyTac.baoKhiCao}
              onChange={(e) => { void luuQuyTac({ ...quyTac, baoKhiCao: e.target.checked }); }}
            />
            <span className="text-[16px] font-bold text-[#1e1b4b] leading-snug">{t('Báo cho con khi Khoan Đã thấy nguy hiểm cao')}</span>
          </label>
          {dangChayApk && (
            <label className="flex items-center gap-3 min-h-[56px] rounded-[18px] border-2 border-[#2e1065] px-4 py-3">
              <input
                type="checkbox"
                className="w-6 h-6 shrink-0"
                checked={quyTac.baoKhiOtpTrongCuocGoi}
                onChange={(e) => { void luuQuyTac({ ...quyTac, baoKhiOtpTrongCuocGoi: e.target.checked }); }}
              />
              <span className="text-[16px] font-bold text-[#1e1b4b] leading-snug">{t('Báo cho con khi máy nhận mã OTP trong lúc đang có cuộc gọi')}</span>
            </label>
          )}
          {daLuuQuyTac && (
            <p role="status" className="text-[15px] font-bold text-emerald-800 flex items-center gap-1">
              <Check size={18} aria-hidden="true" /> {t('Đã lưu')}
            </p>
          )}
          {loi && <p role="alert" className="text-[15px] font-bold text-rose-800 leading-snug">{loi}</p>}
          <button type="button" onClick={tiep} className={nutChinh}>{t('Tiếp tục')}</button>
        </section>
      )}

      {buoc === 'dien_tap' && (
        <section className="flex flex-col gap-3 mt-2">
          <h1 className="text-[24px] font-black text-[#1e1b4b] leading-snug">{t('Tập một lần cho quen')}</h1>
          <p className="text-[16px] text-slate-700 leading-relaxed">{t('Bấm "Thử" để xem màn khẩn cấp. Bố mẹ tập bấm nút gọi con. Đây chỉ là diễn tập.')}</p>
          <button type="button" onClick={onDienTap} className={nutChinh}>{t('Thử')}</button>
          <button type="button" onClick={() => setView('home')} className={nutPhu}>{t('Xong')}</button>
        </section>
      )}

      {buoc !== 'tai_khoan' && buoc !== 'dien_tap' && (
        <button type="button" onClick={tiep} className="w-full min-h-[52px] mt-2 text-[15px] font-bold text-slate-600 underline">
          {t('Bỏ qua bước này')}
        </button>
      )}
    </div>
  );
}
