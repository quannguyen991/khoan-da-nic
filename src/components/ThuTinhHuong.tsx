import { useState } from 'react';
import { Play, Loader2, EyeOff, ChevronDown, ChevronUp, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { Lang, NHAN, MA_LY_DO, CHUA_KIEM, tra, traNhieu } from '../catalog';
import { TINH_HUONG_THU, TinhHuongThu } from '../data/tinh-huong-thu';
import { api } from '../api-goc';

/**
 * KHU THỬ TÌNH HUỐNG — bản máy tính, dành cho con cháu.
 *
 * Người cao tuổi hiếm khi ngồi máy tính; con cháu thì có. Màn này để họ **tự
 * kiểm chứng** app trước khi bảo bố mẹ tin nó: chạy mười tình huống, nhìn kết
 * quả cạnh nhau, thấy app đúng ở đâu và sai ở đâu.
 *
 * ⚠️ NĂM TIN LÀNH HIỆN NGANG HÀNG VỚI NĂM TIN LỪA, KHÔNG GIẤU ĐI.
 * Một bảng chỉ có tin lừa đảo sẽ dạy người xem rằng "báo động nhiều = tốt". Với
 * app này thì ngược lại: §4.6 ghi rõ người bị báo oan sẽ hoảng rồi gỡ ứng dụng.
 * Nên cột "báo oan" phải nằm ngay cạnh cột "bắt đúng", cùng cỡ chữ.
 *
 * ⚠️ APP KHÔNG TỰ CHẤM ĐIỂM MÌNH. `mongDoi` là kỳ vọng của người soạn, hiện ra
 * để người thử tự so bằng mắt. Nếu để app tự tuyên bố "đúng 9/10" thì nó lại
 * thành một con số không ai kiểm được — đúng thứ dự án này tránh.
 */

type KetQua = {
  nhan?: string;
  maLyDo?: string[];
  chuaKiem?: string[];
  aiDaChay?: boolean;
  canThiep?: string;
  giay?: number;
  loi?: string;
};

export function ThuTinhHuong({ t, lang = 'vi' }: { t: (k: string) => string; lang?: Lang }) {
  const [ketQua, setKetQua] = useState<Record<string, KetQua>>({});
  const [dangChay, setDangChay] = useState<string | null>(null);
  const [chayTatCa, setChayTatCa] = useState(false);
  const [moRong, setMoRong] = useState<string | null>(null);

  const chayMot = async (th: TinhHuongThu) => {
    setDangChay(th.ma);
    const batDau = performance.now();
    try {
      const res = await fetch(api('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vanBan: th.noiDung }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setKetQua((cu) => ({ ...cu, [th.ma]: { ...d, giay: (performance.now() - batDau) / 1000 } }));
    } catch {
      // §4.3 — hỏng thì nói là hỏng, đừng để ô trống trông như "đã chạy, không thấy gì".
      setKetQua((cu) => ({ ...cu, [th.ma]: { loi: 'khong_goi_duoc', giay: (performance.now() - batDau) / 1000 } }));
    } finally {
      setDangChay(null);
    }
  };

  const chayHet = async () => {
    setChayTatCa(true);
    setKetQua({});
    // Chạy tuần tự: mô hình chạy tại chỗ chỉ phục vụ một lượt một lúc, và bắn
    // song song mười lượt sẽ làm số đo thời gian mất hết ý nghĩa.
    for (const th of TINH_HUONG_THU) await chayMot(th);
    setChayTatCa(false);
  };

  const xong = Object.keys(ketQua).length;
  const lua = TINH_HUONG_THU.filter((x) => x.nhom === 'lua_dao');
  const lanh = TINH_HUONG_THU.filter((x) => x.nhom === 'lanh');
  const daBao = (ma: string) => ['CAO', 'NGHI_NGO'].includes(ketQua[ma]?.nhan || '');
  const batDung = lua.filter((x) => daBao(x.ma)).length;
  const baoOan = lanh.filter((x) => daBao(x.ma)).length;
  const daChay = (nhom: TinhHuongThu[]) => nhom.filter((x) => ketQua[x.ma]).length;

  const mauNhan = (nhan?: string) => (nhan === 'CAO'
    ? 'bg-red-100 text-red-900 border-red-300'
    : nhan === 'NGHI_NGO'
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : 'bg-slate-100 text-slate-800 border-slate-300');

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div>
          <h3 className="text-[18px] font-black text-slate-900">{t('Thử 10 tình huống')}</h3>
          <p className="text-[14px] text-slate-600 mt-0.5">
            {t('Tự kiểm chứng trước khi bảo bố mẹ tin. 5 tin lừa đảo và 5 tin bình thường.')}
          </p>
        </div>
        <button
          data-vai-tro="nut-chinh"
          onClick={chayHet}
          disabled={chayTatCa}
          className="px-5 py-3 bg-[#7e22ce] hover:bg-[#6b21a8] disabled:opacity-60 text-white rounded-2xl font-black text-[16px] flex items-center gap-2 shadow-md active:scale-95 transition-transform"
        >
          {chayTatCa ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
          <span>{chayTatCa ? `${t('Đang chạy')} ${xong}/10` : t('Chạy tất cả')}</span>
        </button>
      </div>

      {/*
        HAI CON SỐ, CÙNG CỠ CHỮ. Cột phải không được nhỏ hơn cột trái —
        xem chú thích ở đầu tệp.
      */}
      {xong > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-3.5">
            <p className="text-[14px] font-bold text-slate-600">{t('Bắt đúng tin lừa đảo')}</p>
            <p className="text-[24px] font-black text-slate-900">{batDung}<span className="text-[16px] font-bold text-slate-500">/{daChay(lua) || lua.length}</span></p>
          </div>
          <div className={`border-2 rounded-2xl p-3.5 ${baoOan > 0 ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-300'}`}>
            <p className="text-[14px] font-bold text-slate-600">{t('Báo oan tin bình thường')}</p>
            <p className="text-[24px] font-black text-slate-900">{baoOan}<span className="text-[16px] font-bold text-slate-500">/{daChay(lanh) || lanh.length}</span></p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {TINH_HUONG_THU.map((th) => {
          const kq = ketQua[th.ma];
          const mo = moRong === th.ma;
          const lyDo = traNhieu(MA_LY_DO, kq?.maLyDo ?? [], lang);
          const chuaKiem = traNhieu(CHUA_KIEM, kq?.chuaKiem ?? [], lang);
          const lechKyVong = kq?.nhan && kq.nhan !== th.mongDoi;

          return (
            <div key={th.ma} className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5">
                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[14px] font-black border ${
                  th.nhom === 'lua_dao' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}>
                  {th.nhom === 'lua_dao' ? t('Lừa đảo') : t('Bình thường')}
                </span>

                <span className="flex-1 min-w-0 text-[15px] font-bold text-slate-900 leading-snug">{th.ten}</span>

                {kq?.loi ? (
                  <span className="shrink-0 px-3 py-1.5 rounded-lg text-[14px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    {t('Chưa gửi đi kiểm được')}
                  </span>
                ) : kq?.nhan ? (
                  <span className={`shrink-0 px-3 py-1.5 rounded-lg text-[14px] font-black border ${mauNhan(kq.nhan)}`}>
                    {tra(NHAN, kq.nhan, lang)}
                  </span>
                ) : null}

                {kq?.giay !== undefined && !kq.loi && (
                  <span className="shrink-0 text-[14px] font-mono font-bold text-slate-500">{kq.giay.toFixed(1)}s</span>
                )}

                <span className="flex gap-2 shrink-0">
                  <button
                    onClick={() => chayMot(th)}
                    disabled={dangChay === th.ma || chayTatCa}
                    aria-label={t('Chạy lại')}
                    className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold text-[14px]"
                  >
                    {dangChay === th.ma ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => setMoRong(mo ? null : th.ma)}
                    aria-label={t('Xem chi tiết')}
                    className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800"
                  >
                    {mo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </span>
              </div>

              {mo && (
                <div className="border-t border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-[14px] font-black text-slate-600 mb-1">{t('Nội dung đem thử')}</p>
                    <p className="text-[15px] text-slate-900 leading-snug bg-white rounded-2xl p-3 border border-slate-200">{th.noiDung}</p>
                  </div>

                  <div>
                    <p className="text-[14px] font-black text-slate-600 mb-1">{t('Vì sao tình huống này đáng thử')}</p>
                    <p className="text-[15px] text-slate-800 leading-snug">{th.vaySao}</p>
                  </div>

                  {lyDo.length > 0 && (
                    <div>
                      <p className="text-[14px] font-black text-slate-600 mb-1">{t('Dấu hiệu tìm thấy')}</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {lyDo.map((c) => (
                          <li key={c} className="text-[14px] bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* §HĐ luật 3 — chuaKiem hiện ở mọi nơi có kết quả, không riêng màn của bác. */}
                  {chuaKiem.length > 0 && (
                    <div className="bg-white border-2 border-slate-300 rounded-2xl p-3">
                      <p className="text-[14px] font-black text-slate-800 mb-1 flex items-center gap-1.5">
                        <EyeOff size={16} /> {t('Những thứ chưa kiểm được')}
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {chuaKiem.map((c) => <li key={c} className="text-[14px] text-slate-800">• {c}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[14px]">
                    <span className="text-slate-600 font-bold">{t('Người soạn kỳ vọng')}:</span>
                    <span className={`px-2 py-0.5 rounded-lg font-bold border ${mauNhan(th.mongDoi)}`}>
                      {tra(NHAN, th.mongDoi, lang)}
                    </span>
                    {lechKyVong && (
                      <span className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <AlertTriangle size={15} /> {t('Kết quả khác kỳ vọng — đáng xem lại')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/*
        ⚠️ §11 — MƯỜI TÌNH HUỐNG NÀY LÀ VÍ DỤ SOẠN ĐỂ THỬ, không phải vụ việc có
        thật của ai. Dòng này phải ở lại: một danh sách trông như hồ sơ vụ việc
        mà không nói rõ nguồn gốc là đúng thứ §11 cấm.
      */}
      <div className="mt-4 flex items-start gap-2 text-[14px] text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl p-3">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p className="leading-snug">
          {t('Mười tình huống trên do nhóm soạn theo các thủ đoạn đã được báo chí và cơ quan chức năng mô tả công khai. Không lấy từ tin nhắn của ai, không chứa số tài khoản hay số điện thoại thật.')}
        </p>
      </div>

      {xong > 0 && baoOan > 0 && (
        <div className="mt-3 flex items-start gap-2 bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5">
          <ShieldAlert size={18} className="text-amber-800 shrink-0 mt-0.5" />
          <p className="text-[15px] text-amber-900 leading-snug font-medium">
            {t('Có tin bình thường bị báo động. Với người cao tuổi, báo oan đắt hơn bỏ sót — một app kêu nhầm vài lần sẽ bị gỡ trước khi kịp cứu ai.')}
          </p>
        </div>
      )}
    </div>
  );
}
