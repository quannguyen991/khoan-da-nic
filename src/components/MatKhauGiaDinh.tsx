import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Check, ShieldCheck, Trash2 } from 'lucide-react';

/**
 * MẬT KHẨU GIA ĐÌNH — thứ deepfake không vượt qua được.
 *
 * ══════════ VÌ SAO CẦN, KHI ĐÃ CÓ CẢ BỘ LUẬT VÀ AI ══════════
 *
 * Cả hệ thống phân tích của Khoan Đã đọc CHỮ. Một cuộc gọi video giả mặt con
 * cháu, giọng nhân bản từ ba mươi giây video trên mạng — không có chữ nào để
 * đọc, không có tin nhắn nào để dán vào ô kiểm.
 *
 * Cách chống rẻ nhất đã có từ trước khi có máy tính: một cụm từ cả nhà thống
 * nhất trước, không bao giờ gửi qua mạng. Kẻ giả mạo không biết nó, và không có
 * mô hình nào sinh ra nó được.
 *
 * ══════════ ⚠️ APP KHÔNG LƯU MẬT KHẨU. ĐÂY LÀ QUYẾT ĐỊNH, KHÔNG PHẢI THIẾU SÓT ══════════
 *
 * Lưu vào máy thì tiện hơn: app kiểm hộ, bác chỉ cần gõ vào. Nhưng đặt cạnh
 * chính tính năng "kiểm xem máy có đang bị điều khiển không" thì thấy ngay vì
 * sao không được: kịch bản lừa đảo phổ biến nhất ở Việt Nam kết thúc bằng việc
 * kẻ tấn công NHÌN ĐƯỢC MÀN HÌNH của nạn nhân.
 *
 * Nếu mật khẩu nằm trong máy, thứ duy nhất chống được deepfake sẽ lộ ngay trong
 * đúng kịch bản mà nó sinh ra để chống. App chỉ cần NHẮC bác hỏi — nó không cần
 * biết câu trả lời, và không nên biết.
 *
 * ⚠️ GỢI Ý THÌ LƯU, ĐÁP ÁN THÌ KHÔNG. Người cao tuổi quên là chuyện thật, và
 * "quên mất mật khẩu" mà không có lối ra thì tính năng chết. Gợi ý là câu chỉ
 * người trong nhà hiểu ("con vật nhà mình nuôi hồi ở quê"), đọc trộm cũng không
 * suy ra được đáp án.
 */

const KHOA = 'khoan_da_mat_khau_gia_dinh';

export interface MatKhauGiaDinhLuu {
  daLap: boolean;
  /** Câu gợi nhớ. KHÔNG PHẢI mật khẩu — xem chú thích đầu tệp. */
  goiY: string;
  ngayLap: number;
}

export function docMatKhauGiaDinh(): MatKhauGiaDinhLuu | null {
  try {
    const t = JSON.parse(localStorage.getItem(KHOA) || 'null');
    return t && t.daLap === true ? t : null;
  } catch {
    return null;
  }
}

export function MatKhauGiaDinh({
  setView, t,
}: {
  setView: (v: any) => void;
  t: any;
}) {
  const [daLuu, setDaLuu] = useState<MatKhauGiaDinhLuu | null>(() => docMatKhauGiaDinh());
  const [goiY, setGoiY] = useState('');
  const [buoc, setBuoc] = useState<1 | 2>(daLuu ? 2 : 1);

  const luu = () => {
    const m: MatKhauGiaDinhLuu = { daLap: true, goiY: goiY.trim(), ngayLap: Date.now() };
    try {
      localStorage.setItem(KHOA, JSON.stringify(m));
    } catch {
      // Không lưu được thì tính năng vẫn dùng được — nó nằm ở đầu người, không
      // ở trong máy. Chỉ mất phần nhắc lại gợi ý.
    }
    setDaLuu(m);
    setBuoc(2);
  };

  const xoa = () => {
    try {
      localStorage.removeItem(KHOA);
    } catch {
      // không sao
    }
    setDaLuu(null);
    setGoiY('');
    setBuoc(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 z-50 bg-[#f8f4ff] flex flex-col items-center justify-start overflow-y-auto [&>*]:shrink-0 px-4 sm:px-6 pt-10 pb-28"
    >
      <div className="w-full max-w-[420px] flex items-center justify-between mb-4">
        <button
          onClick={() => setView('settings')}
          className="min-h-[52px] px-3 bg-white/80 rounded-2xl shadow-sm text-[#6d28d9] active:scale-95 transition-all flex items-center gap-1 font-bold text-[15px]"
        >
          <ChevronLeft size={20} />
          <span>{t('Quay lại')}</span>
        </button>
      </div>

      <div className="w-full max-w-[420px] flex flex-col items-center text-center mb-5">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 mb-3">
          <Users size={32} />
        </div>
        <h2 className="text-2xl font-black text-[#3b1d7d] mb-1">{t('Mật khẩu gia đình')}</h2>
        <p className="text-[15px] text-purple-900/80 leading-relaxed">
          {t('Một câu chỉ nhà mình biết. Ai gọi điện xưng là con cháu mà không nói được câu đó, bác đừng làm theo.')}
        </p>
      </div>

      {buoc === 1 ? (
        <>
          {/*
            NGHI THỨC BA BƯỚC — cố ý không rút ngắn.

            Tính năng này chỉ hiệu quả nếu CẢ NHÀ cùng biết, nên màn hình phải
            nói rõ đây là việc làm cùng nhau, không phải một ô để bác điền một
            mình rồi xong.
          */}
          <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 shadow-md border border-[#e9d5ff] mb-5">
            <h3 className="font-black text-[17px] text-[#311068] mb-3">{t('Cách làm')}</h3>
            <ol className="flex flex-col gap-3">
              {[
                t('Gọi cả nhà lại — con cháu, vợ chồng, ai hay gọi điện cho bác.'),
                t('Cùng chọn MỘT câu dễ nhớ mà người ngoài không đoán được. Ví dụ: tên con chó nhà mình hồi ở quê.'),
                t('Nói miệng với nhau. ĐỪNG nhắn câu đó qua Zalo, tin nhắn hay email — nhắn là nó ra khỏi nhà mình.'),
              ].map((cau, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#7c3aed] text-white font-black text-[15px] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[15px] text-slate-700 leading-relaxed">{cau}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 shadow-md border border-[#e9d5ff] mb-5">
            <h3 className="font-black text-[17px] text-[#311068] mb-1">{t('Câu nhắc cho bác')}</h3>
            {/*
              ⚠️ Ô NÀY KHÔNG PHẢI CHỖ GÕ MẬT KHẨU. Nói thẳng ra, vì bác sẽ định
              gõ mật khẩu vào đây — đó là phản xạ tự nhiên với mọi ô nhập.
            */}
            <p className="text-[14px] text-slate-600 leading-relaxed mb-3">
              {t('Khoan Đã KHÔNG giữ mật khẩu của nhà bác. Bác chỉ ghi một câu để tự nhớ ra nó, người khác đọc được cũng không đoán ra.')}
            </p>
            <input
              value={goiY}
              onChange={(e) => setGoiY(e.target.value)}
              placeholder={t('Ví dụ: con vật nhà mình nuôi hồi ở quê')}
              maxLength={80}
              className="w-full min-h-[52px] px-4 rounded-2xl border-2 border-purple-200 bg-purple-50/50 text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <button
            onClick={luu}
            className="w-full max-w-[420px] min-h-[56px] px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 active:scale-95 text-white font-extrabold rounded-2xl text-[17px] flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Check size={20} />
            <span>{t('Cả nhà đã thống nhất xong')}</span>
          </button>
        </>
      ) : (
        <>
          <div className="w-full max-w-[420px] bg-emerald-50 border-2 border-emerald-400 rounded-[26px] p-5 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={22} className="text-emerald-700 shrink-0" />
              <h3 className="font-black text-[17px] text-emerald-900">{t('Nhà mình đã có mật khẩu')}</h3>
            </div>
            {daLuu?.goiY ? (
              <p className="text-[16px] text-emerald-900 leading-relaxed">
                {t('Câu nhắc của bác:')} <strong>{daLuu.goiY}</strong>
              </p>
            ) : (
              <p className="text-[15px] text-emerald-900/80 leading-relaxed">
                {t('Bác không ghi câu nhắc nào — chỉ cần nhớ trong đầu là đủ.')}
              </p>
            )}
          </div>

          <div className="w-full max-w-[420px] bg-white rounded-[26px] p-5 shadow-md border border-[#e9d5ff] mb-5">
            <h3 className="font-black text-[17px] text-[#311068] mb-2">{t('Khi nào dùng')}</h3>
            <ul className="flex flex-col gap-2 text-[15px] text-slate-700 leading-relaxed">
              <li>{t('· Có người gọi điện, xưng là con cháu, giục chuyển tiền.')}</li>
              <li>{t('· Gọi video mà mặt và giọng giống hệt người nhà — máy tính bây giờ làm giả được cả hai.')}</li>
              <li>{t('· Bác hỏi: mật khẩu nhà mình là gì? Người nhà thật trả lời được ngay.')}</li>
            </ul>
          </div>

          <button
            onClick={xoa}
            className="w-full max-w-[420px] min-h-[52px] px-4 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 font-bold rounded-2xl text-[15px] border-2 border-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 size={18} />
            <span>{t('Đổi mật khẩu khác')}</span>
          </button>
        </>
      )}
    </motion.div>
  );
}
