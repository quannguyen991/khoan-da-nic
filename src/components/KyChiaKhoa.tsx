import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import {
  dangChoToiKy, layDeBaiKy, kyYeuCau, batDauDangKyPasskey, xacNhanDangKyPasskey, type YeuCauChoKy,
} from '../tai-khoan';
import { NHAN_KHOANG, NHAN_VIEC, NHAN_AI_BAO } from '../lib/chia-khoa';

/**
 * ═════ CHÌA KHOÁ THỨ HAI — thẻ ở máy CON (Phần 5, 23/9/2026) ═════
 *
 * Bố mẹ nhờ xác nhận một khoản chuyển ⇒ thông báo đẩy mở `/?view=guardian&xacNhan=<id>`.
 * Thẻ này cũng tự hỏi danh sách đang chờ, nên KHÔNG cần thông báo đẩy mới thấy.
 * Ký bằng passkey (Khoan Proof) — đề bài lấy từ máy chủ, trình duyệt ký, máy
 * chủ đối chiếu. Máy con chưa có passkey thì tạo ngay tại đây (một lần).
 *
 * ⚠️ §11 — "Xác nhận" nghĩa là NGƯỜI CON ĐÃ KÝ, không có nghĩa khoản chuyển an toàn.
 * ⚠️ §6.9 — con chỉ thấy khoảng tiền, việc, ai bảo. Không số chính xác, không người nhận.
 */
export function KyChiaKhoa({ t, coPhien, soBoMe }: { t: (s: string) => string; coPhien: boolean; soBoMe?: string }) {
  const [ds, setDs] = useState<YeuCauChoKy[]>([]);
  const [dangLam, setDangLam] = useState<string | null>(null);
  const [ketQua, setKetQua] = useState<Record<string, { quyetDinh: 'XAC_NHAN' | 'TU_CHOI'; cumTu: string }>>({});
  const [loi, setLoi] = useState<string | null>(null);
  const [idTuThongBao] = useState<string | null>(() => {
    try { return new URLSearchParams(window.location.search).get('xacNhan'); } catch { return null; }
  });

  useEffect(() => {
    if (!coPhien) return;
    let huy = false;
    const tai = () => dangChoToiKy().then((r) => { if (!huy) setDs(r.yeuCau); }).catch(() => undefined);
    void tai();
    const id = window.setInterval(() => { void tai(); }, 10000);
    return () => { huy = true; window.clearInterval(id); };
  }, [coPhien]);

  const ky = async (y: YeuCauChoKy, quyetDinh: 'XAC_NHAN' | 'TU_CHOI') => {
    setLoi(null);
    setDangLam(y.yeuCauId);
    try {
      let de = await layDeBaiKy(y.yeuCauId);
      if (de.canDangKy) {
        const tuyChonDk = await batDauDangKyPasskey();
        await xacNhanDangKyPasskey(await startRegistration({ optionsJSON: tuyChonDk }));
        de = await layDeBaiKy(y.yeuCauId);
      }
      if (!de.tuyChon) throw new Error('KHONG_CO_DE_BAI');
      const phanHoi = await startAuthentication({ optionsJSON: de.tuyChon });
      const r = await kyYeuCau(y.yeuCauId, quyetDinh, phanHoi);
      setKetQua((c) => ({ ...c, [y.yeuCauId]: { quyetDinh, cumTu: r.cumTu } }));
    } catch (e: any) {
      setLoi(e?.name === 'NotAllowedError'
        ? t('Máy chưa ký. Anh/chị bấm lại và dùng vân tay hoặc khoá màn hình.')
        : e?.ma === 'YEU_CAU_HET_HAN'
          ? t('Yêu cầu đã hết hạn. Anh/chị gọi cho bố mẹ.')
          : t('Chưa ký được. Anh/chị gọi thẳng cho bố mẹ.'));
    } finally {
      setDangLam(null);
    }
  };

  const daXong = Object.entries(ketQua);
  const hien = ds.filter((y) => !ketQua[y.yeuCauId]);
  if (!coPhien || (hien.length === 0 && daXong.length === 0 && !idTuThongBao)) return null;

  return (
    <section aria-labelledby="gd-chia-khoa" className="rounded-[24px] border-2 border-[#2e1065] bg-white p-5 flex flex-col gap-4">
      <h2 id="gd-chia-khoa" className="text-[20px] font-black text-[#2e1065] leading-snug flex items-center gap-2">
        <KeyRound size={22} aria-hidden="true" /> {t('Bố mẹ nhờ anh/chị xác nhận')}
      </h2>
      <p className="text-[15px] font-bold text-slate-700 leading-snug">
        {t('Chỉ xác nhận khi anh/chị đã gọi nói chuyện với bố mẹ.')}
      </p>
      {soBoMe && (
        <a href={`tel:${soBoMe.replace(/\s/g, '')}`} className="w-full min-h-[56px] rounded-[18px] bg-[#6d28d9] text-white font-black text-[17px] px-3 leading-snug flex items-center justify-center">
          {t('Gọi bố mẹ trước')}
        </a>
      )}

      {hien.length === 0 && daXong.length === 0 && (
        <p className="text-[15px] text-slate-700 leading-snug">{t('Không còn yêu cầu nào đang chờ. Có thể đã hết hạn hoặc đã được trả lời.')}</p>
      )}

      {hien.map((y) => (
        <div key={y.yeuCauId} className={`rounded-[18px] border-2 p-4 flex flex-col gap-2 ${y.yeuCauId === idTuThongBao ? 'border-rose-700' : 'border-slate-300'}`}>
          <p className="text-[18px] font-black text-slate-900 leading-snug">
            {y.tenBoMe || t('Bố mẹ')} · {t(NHAN_VIEC[y.hanhDong])} · {t(NHAN_KHOANG[y.khoangTien])}
          </p>
          <p className="text-[15px] text-slate-700">{t('Ai bảo chuyển:')} {t(NHAN_AI_BAO[y.nguoiYeuCau])}</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={dangLam !== null} onClick={() => { void ky(y, 'TU_CHOI'); }} className="min-h-[56px] rounded-[18px] bg-rose-700 text-white font-black text-[17px] px-2 leading-snug disabled:opacity-60">
              {t('Từ chối')}
            </button>
            <button type="button" disabled={dangLam !== null} onClick={() => { void ky(y, 'XAC_NHAN'); }} className="min-h-[56px] rounded-[18px] border-2 border-[#6d28d9] text-[#2e1065] font-black text-[17px] px-2 leading-snug disabled:opacity-60">
              {t('Xác nhận')}
            </button>
          </div>
          {dangLam === y.yeuCauId && (
            <p role="status" className="text-[15px] font-bold text-[#2e1065] leading-snug">{t('Máy đang hỏi vân tay hoặc khoá màn hình…')}</p>
          )}
        </div>
      ))}

      {daXong.map(([id, kq]) => (
        <div key={id} role="status" className="rounded-[18px] bg-slate-100 p-4 flex flex-col gap-1">
          <p className="text-[17px] font-black text-slate-900 leading-snug">
            {kq.quyetDinh === 'XAC_NHAN' ? t('Anh/chị đã ký xác nhận.') : t('Anh/chị đã ký từ chối.')}
          </p>
          <p className="text-[16px] font-bold text-slate-800">{t('Cụm từ đối chiếu:')} {kq.cumTu}</p>
          <p className="text-[15px] text-slate-700 leading-snug">{t('Đọc cụm từ này cho bố mẹ nghe. Máy bố mẹ hiện đúng cụm từ đó.')}</p>
        </div>
      ))}

      {loi && <p role="alert" className="text-[15px] font-bold text-rose-800 leading-snug">{loi}</p>}
    </section>
  );
}
