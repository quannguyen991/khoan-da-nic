import { useEffect, useState } from 'react';
import { ChevronLeft, KeyRound, Landmark } from 'lucide-react';
import type { ViewState } from '../App';
import {
  docPhien, docChiaKhoa, datChiaKhoa, nhoConXacNhan, docTrangThaiYeuCau, TRANG_THAI_KY,
  type CaiDatChiaKhoa, type MaKhoangTien,
} from '../tai-khoan';
import { NHAN_KHOANG, NHAN_VIEC, NHAN_AI_BAO, NGUONG } from '../lib/chia-khoa';

/**
 * ═════ CHÌA KHOÁ THỨ HAI — màn của BỐ MẸ (Phần 5 "Cầu dao gia đình", 23/9/2026) ═════
 *
 * Khoản chuyển lớn cho người nhận mới cần con xác nhận trên máy con (passkey,
 * Khoan Proof). Singapore có Money Lock ở ngân hàng; đây là lớp HỎI LẠI TRONG
 * GIA ĐÌNH, không phải tính năng ngân hàng.
 *
 * ⚠️ §12 — không hứa chặn giao dịch. Khoan Đã không nối với ngân hàng thật nào.
 * ⚠️ §11 — "đã xác nhận" chỉ nói NGƯỜI THÂN ĐÃ KÝ, không nói khoản chuyển an toàn.
 * ⚠️ §6.9 — chỉ khoảng tiền; không số chính xác, không người nhận.
 * ⚠️ Bật/tắt và ngưỡng do chính bố mẹ đặt, mặc định TẮT.
 */

/** Chờ con ký — dùng chung cho màn này và màn ngân hàng mô phỏng. */
export function ChoConXacNhan({ t, yeuCauId, hetHan, onXong }: {
  t: (s: string) => string;
  yeuCauId: string;
  hetHan: number;
  onXong?: (trangThai: string) => void;
}) {
  const [trangThai, setTrangThai] = useState<string>(TRANG_THAI_KY.DANG_CHO);
  const [cumTu, setCumTu] = useState<string | null>(null);
  const [conLai, setConLai] = useState(Math.max(0, Math.round((hetHan - Date.now()) / 1000)));

  useEffect(() => {
    let huy = false;
    const hoi = async () => {
      try {
        const r = await docTrangThaiYeuCau(yeuCauId);
        if (huy) return;
        setTrangThai(r.trangThai);
        if (r.cumTu) setCumTu(r.cumTu);
        if (r.trangThai !== TRANG_THAI_KY.DANG_CHO) onXong?.(r.trangThai);
      } catch { /* mạng chập chờn: hỏi lại lượt sau */ }
    };
    void hoi();
    const id = window.setInterval(() => {
      setConLai(Math.max(0, Math.round((hetHan - Date.now()) / 1000)));
      void hoi();
    }, 3000);
    return () => { huy = true; window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yeuCauId, hetHan]);

  if (trangThai === TRANG_THAI_KY.DA_XAC_NHAN) {
    return (
      <div role="status" className="rounded-[18px] border-2 border-emerald-700 bg-emerald-50 p-4 flex flex-col gap-2">
        <p className="text-[18px] font-black text-emerald-900 leading-snug">{t('Người thân đã xác nhận.')}</p>
        {cumTu && <p className="text-[16px] font-bold text-emerald-900 leading-snug">{t('Cụm từ đối chiếu:')} {cumTu}</p>}
        <p className="text-[15px] text-emerald-900 leading-snug">{t('Xác nhận chỉ cho biết người thân đã ký. Nếu còn lo, bác gọi con hỏi lại.')}</p>
      </div>
    );
  }
  if (trangThai === TRANG_THAI_KY.DA_TU_CHOI) {
    return (
      <div role="alert" className="rounded-[18px] border-2 border-rose-700 bg-rose-50 p-4">
        <p className="text-[18px] font-black text-rose-900 leading-snug">{t('Người thân đã từ chối. Bác đừng chuyển.')}</p>
      </div>
    );
  }
  if (trangThai === TRANG_THAI_KY.HET_HAN || conLai === 0) {
    return (
      <div role="alert" className="rounded-[18px] border-2 border-amber-700 bg-amber-50 p-4">
        <p className="text-[18px] font-black text-amber-900 leading-snug">{t('Chưa liên lạc được người thân. Bác chờ gọi được cho con rồi hãy tính.')}</p>
      </div>
    );
  }
  const phut = Math.floor(conLai / 60);
  const giay = String(conLai % 60).padStart(2, '0');
  return (
    <div role="status" aria-live="polite" className="rounded-[18px] border-2 border-[#2e1065] bg-white p-4 flex flex-col gap-1">
      <p className="text-[18px] font-black text-[#1e1b4b] leading-snug">{t('Đang chờ con xác nhận')}</p>
      <p className="text-[15px] font-bold text-slate-700 tabular-nums">{t('Còn {t}').replace('{t}', `${phut}:${giay}`)}</p>
      <p className="text-[15px] text-slate-700 leading-snug">{t('Trong lúc chờ, bác chưa chuyển gì cả.')}</p>
    </div>
  );
}

export function ManChiaKhoa({ t, setView }: { t: (s: string) => string; setView: (v: ViewState) => void }) {
  const daDangNhap = docPhien() !== null;
  const [caiDat, setCaiDat] = useState<CaiDatChiaKhoa | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [moForm, setMoForm] = useState(false);
  const [khoang, setKhoang] = useState<MaKhoangTien>('10_20');
  const [viec, setViec] = useState<'chuyen_khoan' | 'rut_tien'>('chuyen_khoan');
  const [aiBao, setAiBao] = useState<'nguoi_la' | 'nguoi_quen' | 'khong_ro'>('nguoi_la');
  const [dangCho, setDangCho] = useState<{ yeuCauId: string; hetHan: number } | null>(null);

  useEffect(() => {
    if (!daDangNhap) return;
    void docChiaKhoa().then(setCaiDat).catch(() => setLoi(t('Chưa tải được. Kiểm tra mạng rồi thử lại.')));
  }, [daDangNhap, t]);

  const doi = async (moi: Partial<CaiDatChiaKhoa>) => {
    setLoi(null);
    try { setCaiDat(await datChiaKhoa(moi)); } catch { setLoi(t('Chưa lưu được. Kiểm tra mạng rồi thử lại.')); }
  };

  const gui = async () => {
    setLoi(null);
    try {
      setDangCho(await nhoConXacNhan({ khoangTien: khoang, hanhDong: viec, nguoiYeuCau: aiBao }));
    } catch (e: any) {
      setLoi(e?.ma === 'CHUA_NOI_VOI_AI' ? t('Bác chưa nối với con nào. Vào "Con cháu cài giúp" trước nhé.') : t('Chưa gửi được. Kiểm tra mạng rồi thử lại.'));
    }
  };

  const chip = (chon: boolean) => `min-h-[52px] px-3 rounded-[16px] border-2 font-bold text-[16px] leading-snug ${chon ? 'bg-[#1e1b4b] text-white border-[#1e1b4b]' : 'bg-white text-[#1e1b4b] border-slate-300'}`;

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full overflow-y-auto">
      <button type="button" onClick={() => setView('settings')} className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#1e1b4b] font-bold text-[15px]">
        <ChevronLeft size={22} aria-hidden="true" /> {t('Quay lại')}
      </button>
      <h1 className="text-[24px] font-black text-[#1e1b4b] mt-2 mb-1 leading-snug flex items-center gap-2">
        <KeyRound size={24} aria-hidden="true" /> {t('Chìa khoá thứ hai')}
      </h1>
      <p className="text-[16px] text-slate-700 leading-relaxed mb-4">
        {t('Khoản chuyển lớn cho người nhận mới cần con xác nhận trên máy con. Khoan Đã không nối với ngân hàng — đây là lớp hỏi lại trong gia đình.')}
      </p>

      {!daDangNhap ? (
        <button type="button" onClick={() => setView('con_cai_giup')} className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] px-3 leading-snug">
          {t('Con cháu cài giúp')}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {caiDat && (
            <>
              <label className="flex items-center gap-3 min-h-[56px] rounded-[18px] border-2 border-[#2e1065] px-4 py-3">
                <input type="checkbox" className="w-6 h-6 shrink-0" checked={caiDat.bat} onChange={(e) => { void doi({ bat: e.target.checked }); }} />
                <span className="text-[16px] font-bold text-[#1e1b4b] leading-snug">{t('Bật chìa khoá thứ hai')}</span>
              </label>
              <p className="text-[15px] font-bold text-slate-700">{t('Cần con xác nhận từ')}</p>
              <div className="flex flex-wrap gap-2">
                {NGUONG.map((n) => (
                  <button key={n} type="button" aria-pressed={caiDat.nguong === n} onClick={() => { void doi({ nguong: n }); }} className={chip(caiDat.nguong === n)}>
                    {t('{n} triệu').replace('{n}', String(n))}
                  </button>
                ))}
              </div>
            </>
          )}

          {dangCho ? (
            <ChoConXacNhan t={t} yeuCauId={dangCho.yeuCauId} hetHan={dangCho.hetHan} />
          ) : !moForm ? (
            <button type="button" onClick={() => setMoForm(true)} className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] px-3 leading-snug">
              {t('Nhờ con xác nhận một khoản chuyển')}
            </button>
          ) : (
            <div className="flex flex-col gap-3 rounded-[18px] border-2 border-slate-300 p-4">
              <p className="text-[15px] font-bold text-slate-700">{t('Khoảng tiền')}</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(NHAN_KHOANG) as MaKhoangTien[]).map((k) => (
                  <button key={k} type="button" aria-pressed={khoang === k} onClick={() => setKhoang(k)} className={chip(khoang === k)}>{t(NHAN_KHOANG[k])}</button>
                ))}
              </div>
              <p className="text-[15px] font-bold text-slate-700">{t('Việc')}</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(NHAN_VIEC) as (keyof typeof NHAN_VIEC)[]).map((k) => (
                  <button key={k} type="button" aria-pressed={viec === k} onClick={() => setViec(k)} className={chip(viec === k)}>{t(NHAN_VIEC[k])}</button>
                ))}
              </div>
              <p className="text-[15px] font-bold text-slate-700">{t('Ai bảo bác chuyển?')}</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(NHAN_AI_BAO) as (keyof typeof NHAN_AI_BAO)[]).map((k) => (
                  <button key={k} type="button" aria-pressed={aiBao === k} onClick={() => setAiBao(k)} className={chip(aiBao === k)}>{t(NHAN_AI_BAO[k])}</button>
                ))}
              </div>
              <button type="button" onClick={() => { void gui(); }} className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] px-3 leading-snug">
                {t('Gửi cho con')}
              </button>
            </div>
          )}

          {loi && <p role="alert" className="text-[15px] font-bold text-rose-800 leading-snug">{loi}</p>}

          <button type="button" onClick={() => setView('ngan_hang_mo_phong')} className="w-full min-h-[52px] rounded-[18px] border-2 border-slate-400 text-slate-700 font-bold text-[16px] px-3 leading-snug flex items-center justify-center gap-2">
            <Landmark size={18} aria-hidden="true" /> {t('Xem mô phỏng tích hợp ngân hàng')}
          </button>
        </div>
      )}
    </div>
  );
}
