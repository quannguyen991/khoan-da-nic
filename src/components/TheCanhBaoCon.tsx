import { Phone } from 'lucide-react';
import { cauNoiVoiBoMe } from '../lib/cau-noi-voi-bo-me';

/*
 * PHẦN 3 (23/9/2026) — CÂU CHO MÀN "ĐANG CẦN". Mã → khoá catalog.
 * ⚠️ §11 — không "đã thấy", "đã đọc", "an toàn"; không buộc tội ai.
 */
export const CAU_LOAI_SU_KIEN: Record<string, string> = {
  ket_qua_kiem: 'Khoan Đã thấy tình huống nguy hiểm cao trên máy {ten}.',
  otp_trong_cuoc_goi: 'Máy {ten} vừa nhận mã OTP trong lúc đang có cuộc gọi.',
  cai_app_trong_cuoc_goi: 'Máy {ten} vừa cài ứng dụng mới trong lúc đang có cuộc gọi.',
  tien_ra_trong_cuoc_goi: 'Tiền vừa ra khỏi tài khoản của {ten} trong lúc đang có cuộc gọi.',
};
export const CAU_HANH_DONG: Record<string, string> = {
  bam_goi_nguoi_than: 'Đã bấm gọi người thân',
  toi_on: 'Bấm "Tôi ổn, không có gì nguy hiểm"',
  da_lo_chuyen: 'Báo đã lỡ chuyển tiền hoặc đọc mã',
  con_bao_lua_dao: 'Bấm "Con bảo là lừa đảo"',
  con_bao_khong_sao: 'Bấm "Con bảo không sao"',
  ve_trang_chu: 'Đã rời màn cảnh báo',
};

/**
 * ═════ THẺ "{TÊN} ĐANG CẦN ANH/CHỊ" — máy CON (tách khỏi Guardian 23/9/2026) ═════
 *
 * Mở từ thông báo đẩy: thẻ đỏ đứng đầu màn, MỘT nút "Gọi ngay", ba câu để nói khi
 * bố mẹ nhấc máy, và dòng thời gian bố mẹ đã bấm gì (chỉ MÃ, §6.9).
 *
 * Tách ra để màn trình diễn dùng ĐÚNG thẻ này với dữ liệu giả lập — không vẽ lại
 * một bản "trông giống" (§11: màn trình diễn nói "màn thật của app").
 *
 * `hanhDong`: `null` = chưa tải được chi tiết (ẩn dòng thời gian); `[]` = chưa có phản hồi.
 */
export function TheCanhBaoCon({ t, lang, tenBoMe, loaiSuKien, hanhDong, soBoMe, onGoiNgay, loiTai = false }: {
  t: (s: string) => string;
  lang: 'vi' | 'en';
  tenBoMe: string;
  loaiSuKien?: string;
  hanhDong: { ma: string; luc: number }[] | null;
  soBoMe?: string;
  onGoiNgay: () => void;
  loiTai?: boolean;
}) {
  return (
    <section role="alert" aria-labelledby="gd-can-con" className="rounded-[24px] bg-red-700 text-white p-5 flex flex-col gap-3 shadow-[0_14px_35px_rgba(185,28,28,0.35)]">
      <h2 id="gd-can-con" className="text-[22px] font-black leading-snug">
        {t('{ten} đang cần anh/chị').split('{ten}').join(tenBoMe)}
      </h2>
      {loaiSuKien && CAU_LOAI_SU_KIEN[loaiSuKien] && (
        <p className="text-[16px] font-semibold leading-snug">
          {t(CAU_LOAI_SU_KIEN[loaiSuKien] as string).split('{ten}').join(tenBoMe)}
        </p>
      )}
      {soBoMe ? (
        <button
          type="button"
          onClick={onGoiNgay}
          data-vai-tro="nut-chinh"
          className="w-full min-h-[64px] rounded-[18px] bg-amber-300 text-amber-950 font-black text-[20px] flex items-center justify-center gap-2 px-3 leading-snug"
        >
          <Phone size={24} aria-hidden="true" /> {t('Gọi ngay')} ({soBoMe})
        </button>
      ) : (
        <p className="text-[15px] font-bold leading-snug">{t('Chưa có số của bố mẹ trên máy này.')}</p>
      )}
      {/* Ba câu cho lúc bố mẹ nhấc máy: một việc · đổ lỗi cho thủ đoạn · trấn an. Xem lib/cau-noi-voi-bo-me. */}
      <div className="rounded-[18px] bg-white text-slate-900 p-4 flex flex-col gap-2">
        <p className="text-[15px] font-bold text-red-800 leading-snug">{t('Bố mẹ nghe máy thì nói:')}</p>
        <ol className="flex flex-col gap-2 text-[18px] font-bold leading-snug list-none">
          {cauNoiVoiBoMe(loaiSuKien).map((c) => <li key={c}>“{t(c)}”</li>)}
        </ol>
      </div>
      {loiTai && <p className="text-[14px] font-semibold leading-snug">{t('Không tải được chi tiết. Vẫn gọi được.')}</p>}
      {hanhDong && (
        <ul className="flex flex-col gap-1 text-[15px] font-semibold leading-snug">
          {hanhDong.length === 0 ? (
            <li>{t('Chưa có phản hồi từ máy bố mẹ.')}</li>
          ) : hanhDong.map((h) => (
            <li key={`${h.ma}-${h.luc}`}>
              {new Date(h.luc).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })} · {t(CAU_HANH_DONG[h.ma] ?? h.ma)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
