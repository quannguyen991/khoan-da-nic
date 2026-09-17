import { useState } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown, UserMinus, UserPlus, Users, ChevronRight, Check } from 'lucide-react';
import { DOI_PHAN_UNG, tra, type Lang } from '../catalog';
import {
  docVongTron, ghiVongTron, themVaoDoi, boKhoiDoi, doiVaiTro, doiThuTu,
  VAI_TRO_DOI, TOI_DA_DOI, type VaiTroDoi, type VongTron, type NguoiThan,
} from '../lib/vong-tron-gia-dinh';

/**
 * ĐỘI PHẢN ỨNG NHANH — màn lập đội.
 *
 * Bác chọn trước, lúc bình tĩnh, tối đa ba người và việc của từng người. Lúc có
 * cảnh báo, nút gọi trỏ vào đúng người cho tình huống đó; nút thứ hai là "không
 * gọi được thì gọi …". Người bấm luôn là bác.
 *
 * ⚠️ KHÔNG TỰ GỌI THAY BÁC — người dùng chốt ngày 17/9/2026. Không có tuỳ chọn
 * nào ở màn này bật được việc đó, và đừng thêm.
 *
 * ⚠️ DỮ LIỆU CHỈ NẰM TRÊN MÁY. Đội không đồng bộ lên máy chủ (§12 — không bật
 * đồng bộ mặc định). Người trong đội không được quyền xem gì của bác.
 */

const KHOA_VAI: Record<VaiTroDoi, string> = {
  NGUOI_GOI: 'VAI_NGUOI_GOI',
  HO_TRO_NGAN_HANG: 'VAI_HO_TRO_NGAN_HANG',
  HO_TRO_THIET_BI: 'VAI_HO_TRO_THIET_BI',
};

export function nhanVai(vai: VaiTroDoi, lang: Lang): string {
  return tra(DOI_PHAN_UNG, KHOA_VAI[vai], lang) ?? '';
}

export function ManDoiPhanUng({
  setView, t, lang,
}: {
  setView: (v: any) => void;
  t: (s: string) => string;
  lang: Lang;
}) {
  const [vt, setVt] = useState<VongTron>(() => docVongTron());
  const [loi, setLoi] = useState<string | null>(null);

  const luu = (moi: VongTron) => {
    ghiVongTron(moi);
    setVt(moi);
  };

  const theoId = (id: string): NguoiThan | undefined => vt.nguoiThan.find((n) => n.id === id);
  const ngoaiDoi = vt.nguoiThan.filter((n) => !vt.doi.some((d) => d.nguoiThanId === n.id));
  const quanHe = (n: NguoiThan) => (n.quanHe ? (t(n.quanHe) || n.quanHe) : '');

  const them = (id: string) => {
    const kq = themVaoDoi(vt, id);
    if (!kq.ok) {
      setLoi(kq.lyDo === 'DAY' ? tra(DOI_PHAN_UNG, 'DAY', lang) : null);
      return;
    }
    setLoi(null);
    luu(kq.vongTron);
  };

  const nutNho = 'min-h-[52px] min-w-[52px] rounded-2xl border-2 border-[#1e1b4b] bg-white text-[#1e1b4b] flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform';

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

      <h1 className="text-[24px] font-black text-[#1e1b4b] mt-2 mb-1 leading-snug">
        {tra(DOI_PHAN_UNG, 'TIEU_DE', lang)}
      </h1>
      <p className="text-[15px] text-slate-700 leading-relaxed mb-4">
        {tra(DOI_PHAN_UNG, 'MO_TA', lang)}
      </p>

      {vt.nguoiThan.length === 0 && (
        <div className="bg-white border-2 border-[#1e1b4b] rounded-[18px] p-4">
          <p className="text-[16px] text-[#1e1b4b] font-semibold leading-snug mb-3">
            {tra(DOI_PHAN_UNG, 'CHUA_CO_NGUOI', lang)}
          </p>
          <button
            type="button"
            onClick={() => setView('add_family')}
            className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] flex items-center justify-center gap-2"
          >
            <UserPlus size={20} aria-hidden="true" />
            {tra(DOI_PHAN_UNG, 'THEM_NGUOI_THAN', lang)}
          </button>
        </div>
      )}

      {vt.doi.length > 0 && (
        <h2 className="text-[18px] font-black text-[#1e1b4b] mb-2">{tra(DOI_PHAN_UNG, 'THU_TU_GOI', lang)}</h2>
      )}
      <div className="flex flex-col gap-3">
        {vt.doi.map((tv, i) => {
          const n = theoId(tv.nguoiThanId);
          if (!n) return null;
          return (
            <div key={tv.nguoiThanId} className="bg-white border-2 border-[#1e1b4b] rounded-[20px] p-3.5">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-[#1e1b4b] text-white font-black text-[17px] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[17px] text-[#1e1b4b] leading-snug">
                    {n.ten}{quanHe(n) ? ` · ${quanHe(n)}` : ''}
                  </p>
                  <p className={`text-[14px] leading-snug mt-0.5 ${n.dienThoai.trim() ? 'text-slate-600' : 'text-red-700 font-bold'}`}>
                    {n.dienThoai.trim() ? n.dienThoai : tra(DOI_PHAN_UNG, 'KHONG_SO', lang)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-3">
                {VAI_TRO_DOI.map((vai) => {
                  const co = tv.vaiTro.includes(vai);
                  return (
                    <button
                      key={vai}
                      type="button"
                      aria-pressed={co}
                      onClick={() => luu(doiVaiTro(vt, tv.nguoiThanId, vai))}
                      className={`w-full min-h-[52px] px-3 rounded-2xl border-2 text-left font-bold text-[15px] leading-snug flex items-center gap-2 transition-colors ${
                        co ? 'bg-[#1e1b4b] border-[#1e1b4b] text-white' : 'bg-white border-slate-400 text-[#1e1b4b]'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${co ? 'border-white' : 'border-slate-500'}`}>
                        {co && <Check size={16} aria-hidden="true" />}
                      </span>
                      {nhanVai(vai, lang)}
                    </button>
                  );
                })}
                {tv.vaiTro.length === 0 && (
                  <p className="text-[14px] text-slate-600 leading-snug">{tra(DOI_PHAN_UNG, 'CHUA_CO_VAI', lang)}</p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  aria-label={tra(DOI_PHAN_UNG, 'GOI_SOM_HON', lang) ?? ''}
                  disabled={i === 0}
                  onClick={() => luu(doiThuTu(vt, tv.nguoiThanId, -1))}
                  className={nutNho}
                >
                  <ChevronUp size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={tra(DOI_PHAN_UNG, 'GOI_SAU', lang) ?? ''}
                  disabled={i === vt.doi.length - 1}
                  onClick={() => luu(doiThuTu(vt, tv.nguoiThanId, 1))}
                  className={nutNho}
                >
                  <ChevronDown size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => { setLoi(null); luu(boKhoiDoi(vt, tv.nguoiThanId)); }}
                  className="flex-1 min-h-[52px] px-3 rounded-2xl border-2 border-slate-400 bg-white text-slate-700 font-bold text-[15px] flex items-center justify-center gap-1.5"
                >
                  <UserMinus size={18} aria-hidden="true" />
                  {tra(DOI_PHAN_UNG, 'BO_KHOI_DOI', lang)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {ngoaiDoi.length > 0 && (
        <>
          <h2 className="text-[18px] font-black text-[#1e1b4b] mt-6 mb-2">{tra(DOI_PHAN_UNG, 'NGOAI_DOI', lang)}</h2>
          <div className="flex flex-col gap-2">
            {ngoaiDoi.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => them(n.id)}
                className="w-full min-h-[56px] px-4 py-3 rounded-[18px] bg-white border-2 border-[#1e1b4b] text-left flex items-center gap-3 active:scale-[0.99] transition-transform"
              >
                <UserPlus size={20} className="text-[#1e1b4b] shrink-0" aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-[16px] text-[#1e1b4b] leading-snug">
                    {n.ten}{quanHe(n) ? ` · ${quanHe(n)}` : ''}
                  </span>
                  <span className="block text-[14px] text-slate-600 leading-snug">{tra(DOI_PHAN_UNG, 'THEM_VAO_DOI', lang)}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {loi && <p className="text-[15px] text-red-700 font-bold mt-3 leading-snug" role="alert">{loi}</p>}
      {vt.doi.length >= TOI_DA_DOI && ngoaiDoi.length > 0 && !loi && (
        <p className="text-[14px] text-slate-600 mt-3 leading-snug">{tra(DOI_PHAN_UNG, 'DAY', lang)}</p>
      )}
    </div>
  );
}

/**
 * Thẻ tóm tắt ở màn Gia đình — nói thật nút gọi đang trỏ vào ai.
 * Đọc kho lúc dựng: màn Gia đình dựng lại khi bác quay về từ màn lập đội.
 */
export function TheDoiPhanUng({ setView, lang }: { setView: (v: any) => void; lang: Lang }) {
  const vt = docVongTron();
  if (vt.nguoiThan.length === 0) return null;
  const ten = vt.doi
    .map((d) => vt.nguoiThan.find((n) => n.id === d.nguoiThanId)?.ten)
    .filter((x): x is string => !!x);

  return (
    <button
      type="button"
      onClick={() => setView('doi_phan_ung')}
      className="w-full mt-1 min-h-[56px] bg-white rounded-[20px] p-3.5 border-[2.5px] border-[#2e1065] shadow-[4px_4px_0_#2e1065] flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      <span className="w-11 h-11 rounded-2xl bg-indigo-100 border-2 border-[#2e1065] flex items-center justify-center text-indigo-800 shrink-0">
        <Users size={22} aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-black text-[16px] text-[#1e1b4b] leading-snug">{tra(DOI_PHAN_UNG, 'TIEU_DE', lang)}</span>
        <span className="block text-[14px] text-slate-600 leading-snug mt-0.5">
          {ten.length > 0 ? ten.map((x, i) => `${i + 1}. ${x}`).join(' · ') : tra(DOI_PHAN_UNG, 'CHUA_LAP_DOI', lang)}
        </span>
      </span>
      <ChevronRight size={20} className="text-indigo-700 shrink-0" aria-hidden="true" />
    </button>
  );
}
