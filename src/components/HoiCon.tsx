import { useEffect, useState } from 'react';
import { UserCheck, Phone } from 'lucide-react';
import { docPhien, hoiConDangGoi, docHoiCon, type KetQuaHoiCon } from '../tai-khoan';
import { goiDienThoai } from '../native';

/**
 * ═════ "CÓ PHẢI CON ĐANG GỌI KHÔNG?" — nút của BỐ MẸ (23/9/2026) ═════
 *
 * Có người gọi xưng là con, cháu (giọng có thể giả bằng AI). Bác bấm một nút, máy
 * con đổ thông báo, con bấm Có/Không. Kiểm qua KÊNH KHÁC — không tin kênh đang gọi.
 * Bản gia đình của "Revolut có đang gọi bạn không?".
 *
 * ⚠️ §4.3 — chưa ai trả lời / hết hạn / chưa gửi tới được ⇒ nói đúng thế, và đưa
 *    việc an toàn nhất: cúp máy, gọi lại số của con đã lưu. KHÔNG bao giờ "không sao".
 * ⚠️ §11 — "Minh bấm: đúng Minh đang gọi" chỉ thuật lại việc con bấm. Không "an toàn".
 */
const TOI_DUOC = ['DA_DAY_DI', 'PUSH_DELIVERY_UNKNOWN'];

export function HoiCon({ t, familyMembers }: { t: (s: string) => string; familyMembers?: { name: string; phone: string }[] }) {
  const [hoiId, setHoiId] = useState<string | null>(null);
  const [hetHan, setHetHan] = useState(0);
  const [khongToiAi, setKhongToiAi] = useState(false);
  const [kq, setKq] = useState<KetQuaHoiCon | null>(null);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState(false);
  const [bayGio, setBayGio] = useState(Date.now());
  const con = familyMembers?.find((n) => n.phone);

  useEffect(() => {
    if (!hoiId) return;
    let huy = false;
    const tai = () => docHoiCon(hoiId).then((r) => { if (!huy) setKq(r); }).catch(() => undefined);
    void tai();
    const id = window.setInterval(() => { setBayGio(Date.now()); void tai(); }, 3000);
    return () => { huy = true; window.clearInterval(id); };
  }, [hoiId]);

  if (docPhien() === null) return null;

  const hoi = async () => {
    setDangGui(true); setLoi(false);
    try {
      const r = await hoiConDangGoi();
      setHoiId(r.hoiId); setHetHan(r.hetHan); setBayGio(Date.now());
      setKhongToiAi(!r.guiToi.some((g) => TOI_DUOC.includes(g.trangThai)));
    } catch { setLoi(true); } finally { setDangGui(false); }
  };

  const nutGoiLai = con && (
    <button type="button" onClick={() => goiDienThoai(con.phone)}
      className="w-full min-h-[56px] rounded-[18px] bg-white text-[#2e1065] font-black text-[17px] px-3 leading-snug flex items-center justify-center gap-2">
      <Phone size={20} aria-hidden="true" /> {t('Gọi số của {ten} đã lưu').replace('{ten}', con.name)}
    </button>
  );

  if (!hoiId) {
    return (
      <div className="flex flex-col gap-2 mb-5">
        <button type="button" onClick={() => { void hoi(); }} disabled={dangGui} data-vai-tro="nut-chinh"
          className="w-full min-h-[64px] rounded-[20px] bg-[#6d28d9] text-white font-black text-[18px] px-4 leading-snug flex items-center justify-center gap-3 border-2 border-white/30 disabled:opacity-60">
          <UserCheck size={26} aria-hidden="true" className="shrink-0" /> {t('Họ xưng là con? Hỏi con ngay')}
        </button>
        {loi && <p role="alert" className="text-[15px] font-bold text-amber-200 leading-snug">{t('Chưa hỏi được. Bác cúp máy, gọi lại số của con đã lưu.')}</p>}
        {loi && nutGoiLai}
      </div>
    );
  }

  const khong = kq?.traLoi.filter((x) => x.traLoi === 'KHONG') ?? [];
  const co = kq?.traLoi.filter((x) => x.traLoi === 'CO') ?? [];
  const conLai = Math.max(0, Math.round((hetHan - bayGio) / 1000));
  const hetGio = kq ? !kq.conHan : conLai === 0;

  if (khong.length > 0) {
    return (
      <div role="alert" className="rounded-[20px] bg-red-700 p-4 mb-5 flex flex-col gap-3">
        {khong.map((x) => (
          <p key={x.ten} className="text-[20px] font-black leading-snug">{t('{ten} bấm: không phải {ten} gọi.').split('{ten}').join(x.ten)}</p>
        ))}
        <p className="text-[24px] font-black leading-snug">{t('Bác cúp máy đi.')}</p>
        {nutGoiLai}
      </div>
    );
  }
  if (co.length > 0) {
    return (
      <div role="status" className="rounded-[20px] bg-white/10 border-2 border-white/30 p-4 mb-5 flex flex-col gap-2">
        {co.map((x) => (
          <p key={x.ten} className="text-[20px] font-black leading-snug">{t('{ten} bấm: đúng {ten} đang gọi.').split('{ten}').join(x.ten)}</p>
        ))}
        <p className="text-[15px] text-purple-100 leading-snug">{t('Dù vậy, bác chưa chuyển tiền hay đọc mã nhé.')}</p>
      </div>
    );
  }
  if (khongToiAi || hetGio) {
    return (
      <div role="alert" className="rounded-[20px] bg-amber-300 text-amber-950 p-4 mb-5 flex flex-col gap-3">
        <p className="text-[19px] font-black leading-snug">
          {khongToiAi ? t('Máy con chưa nhận được câu hỏi.') : t('Con chưa trả lời.')}
        </p>
        <p className="text-[17px] font-bold leading-snug">{t('Bác cúp máy, gọi lại số của con đã lưu.')}</p>
        {nutGoiLai}
      </div>
    );
  }
  const phut = Math.floor(conLai / 60);
  const giay = String(conLai % 60).padStart(2, '0');
  return (
    <div role="status" aria-live="polite" className="rounded-[20px] bg-white/10 border-2 border-white/30 p-4 mb-5 flex flex-col gap-1">
      <p className="text-[19px] font-black leading-snug">{t('Đang hỏi con…')}</p>
      <p className="text-[15px] font-bold text-purple-100 tabular-nums">{t('Còn {t}').replace('{t}', `${phut}:${giay}`)}</p>
    </div>
  );
}
