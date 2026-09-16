import { useState } from 'react';
import { ShieldCheck, Phone, Trash2, ChevronLeft } from 'lucide-react';
import { QUY_TAC_MAU, QUY_TAC_KHUNG, tra, type Lang } from '../catalog';
import {
  docVongTron, ghiVongTron, themQuyTac, xoaQuyTac,
  MAU_QUY_TAC, TOI_DA_KY_TU_CAU, TOI_DA_QUY_TAC,
  type QuyTacGiaDinh as QuyTac, type MaQuyTac, type NguoiThan,
} from '../lib/vong-tron-gia-dinh';

/**
 * QUY TẮC GIA ĐÌNH — `FAMILY_RULE` (§4.1).
 *
 * Một cảnh báo do máy phát ra phải thắng được một người đang nói thẳng vào tai
 * bác, có thẩm quyền giả, và đang thúc. Cuộc đấu đó không cân sức.
 *
 * Thứ cân sức được là một câu CHÍNH GIA ĐÌNH đã tự đặt lúc bình tĩnh, đọc lại
 * đúng lúc nguy hiểm, kèm tên người đã cùng đặt. Bác không cãi lại một cái máy;
 * bác nhớ ra lời đã hẹn với con mình.
 *
 * ⚠️ KHỐI NÀY KHÔNG ĐỔI MỨC RỦI RO. Nó chỉ hiện sau khi bộ luật đã quyết
 * (§4.2). Có test chặn: `test/quy-tac-khong-doi-muc.test.js`.
 *
 * ⚠️ KHÔNG HIỆN Ở MỨC "CHƯA THẤY DẤU HIỆU". Nhắc một quy tắc an toàn ngay dưới
 * dòng đó làm người đọc tưởng hệ thống đang cảnh báo — tức là sản phẩm tự tạo
 * ra một cảnh báo mà bộ luật không hề đưa ra. Chỗ gọi phải kiểm bằng
 * `duocHienQuyTac(nhan)`.
 */

const ngayGon = (moc: number): string => {
  const d = new Date(moc);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const thay = (mau: string, o: Record<string, string>): string =>
  Object.entries(o).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), mau);

export function KhoiQuyTac({
  quyTac, lang, nguoiThan, onGoi,
}: {
  quyTac: QuyTac | null;
  lang: Lang;
  nguoiThan?: NguoiThan[];
  /** Gọi người đã cùng đặt quy tắc. Không truyền thì không hiện nút gọi. */
  onGoi?: (dienThoai: string, ten: string) => void;
}) {
  if (!quyTac) return null;

  const tieuDe = tra(QUY_TAC_KHUNG, 'TIEU_DE', lang) ?? '';
  const nguoi = quyTac.nguoiCungDat
    ? (nguoiThan ?? []).find((n) => n.ten === quyTac.nguoiCungDat) ?? null
    : null;

  const dongNgay = quyTac.nguoiCungDat
    ? thay(tra(QUY_TAC_KHUNG, 'DAT_NGAY_CUNG', lang) ?? '', {
      ngay: ngayGon(quyTac.ngayDat), ten: quyTac.nguoiCungDat,
    })
    : thay(tra(QUY_TAC_KHUNG, 'DAT_NGAY', lang) ?? '', { ngay: ngayGon(quyTac.ngayDat) });

  return (
    <div className="w-full bg-white/15 border-2 border-white/35 rounded-[22px] px-4 py-4 mb-2 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={18} className="text-white/90 shrink-0" aria-hidden="true" />
        <span className="text-white/90 font-bold text-[14px] uppercase tracking-wide">{tieuDe}</span>
      </div>

      {/*
        Câu của gia đình là thứ to nhất trong khối. Mọi thứ khác ở đây chỉ để
        nói cho bác biết câu đó từ đâu ra.
      */}
      <p className="text-white font-black text-[19px] leading-snug">{quyTac.cau}</p>

      <p className="text-white/85 text-[14px] mt-2 leading-snug">{dongNgay}</p>

      {/*
        Nút gọi CHỈ hiện khi người cùng đặt có thật trong danh bạ của bác. Hiện
        một nút gọi trỏ vào khoảng không là đúng dạng lỗi đã gây hại một lần rồi
        — xem chú thích `familyMembers` trong App.tsx.
      */}
      {nguoi && onGoi && (
        <button
          type="button"
          onClick={() => onGoi(nguoi.dienThoai, nguoi.ten)}
          className="mt-3 w-full min-h-[56px] rounded-[18px] bg-white text-[#1e1b4b] font-black text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Phone size={20} aria-hidden="true" />
          <span>{nguoi.ten}</span>
        </button>
      )}
    </div>
  );
}

/**
 * MÀN ĐẶT QUY TẮC — ba bước, mỗi bước một màn, không cuộn.
 *
 * ⚠️ Mẫu tồn tại vì màn hình trắng là màn hình không ai điền. Nhưng câu được
 * lưu là câu BÁC ĐÃ SỬA, không phải câu mẫu — một quy tắc viết bằng giọng nhà
 * mình mới có sức nặng lúc bị thúc ép.
 */
export function ManDatQuyTac({
  setView, t, lang, nguoiThan,
}: {
  setView: (v: any) => void;
  t: (s: string) => string;
  lang: Lang;
  nguoiThan?: NguoiThan[];
}) {
  const [vongTron, setVongTron] = useState(() => docVongTron());
  const [buoc, setBuoc] = useState<1 | 2 | 3 | 4>(1);
  const [ma, setMa] = useState<MaQuyTac>('KHONG_CHUYEN_KHI_DANG_NGHE_MAY');
  const [cau, setCau] = useState('');
  const [nguoiCungDat, setNguoiCungDat] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const danhSach = nguoiThan ?? vongTron.nguoiThan;
  const conCho = vongTron.quyTac.length < TOI_DA_QUY_TAC;

  const chonMau = (m: MaQuyTac) => {
    setMa(m);
    // Điền sẵn câu mẫu để bác SỬA, không bắt bác viết từ màn trắng.
    setCau(m === 'TUY_CHINH' ? '' : (tra(QUY_TAC_MAU, m, lang) ?? ''));
    setBuoc(2);
  };

  /*
   * ⚠️ NHẬN NGƯỜI CÙNG ĐẶT LÀM THAM SỐ, KHÔNG ĐỌC TỪ STATE.
   *
   * Bản đầu gọi `setNguoiCungDat(ten); luu();` trong cùng một lần bấm. React
   * cập nhật state ở lần dựng SAU, nên `luu` đọc phải giá trị cũ và ghi
   * `nguoiCungDat: null`. Đo trên bản chạy thật 16/9/2026: chọn "Lan · con
   * gái" xong, bản lưu trong localStorage vẫn là `"nguoiCungDat": null`.
   *
   * Hỏng đó im lặng và ăn đúng phần quan trọng nhất của tính năng: câu quy tắc
   * mất tên người đã cùng đặt, tức là mất luôn lý do nó có sức nặng lúc bác bị
   * thúc ép.
   */
  const luu = (nguoi: string | null) => {
    const kq = themQuyTac(vongTron, { ma, cau, nguoiCungDat: nguoi });
    if (!kq.ok) {
      setLoi(tra(QUY_TAC_KHUNG, kq.lyDo === 'QUA_NHIEU' ? 'QUA_NHIEU' : 'CAU_RONG', lang));
      return;
    }
    ghiVongTron(kq.vongTron);
    setVongTron(kq.vongTron);
    setLoi(null);
    setBuoc(4);
  };

  const xoa = (id: string) => {
    const moi = xoaQuyTac(vongTron, id);
    ghiVongTron(moi);
    setVongTron(moi);
  };

  const Dau = ({ ve }: { ve: () => void }) => (
    <button
      type="button"
      onClick={ve}
      className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#1e1b4b] font-bold text-[15px]"
    >
      <ChevronLeft size={22} aria-hidden="true" />
      {t('Quay lại')}
    </button>
  );

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <Dau ve={() => (buoc === 1 ? setView('home') : setBuoc(1))} />

      <h1 className="text-[24px] font-black text-[#1e1b4b] mt-2 mb-1 leading-snug">
        {tra(QUY_TAC_KHUNG, 'TIEU_DE', lang)}
      </h1>

      {/* Quy tắc đã có — hiện trước, vì phần lớn lần vào lại là để xem lại. */}
      {vongTron.quyTac.length > 0 && buoc === 1 && (
        <div className="mb-5 mt-3 flex flex-col gap-2">
          {vongTron.quyTac.map((q) => (
            <div key={q.id} className="bg-white border-2 border-[#1e1b4b] rounded-[18px] px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[16px] text-[#1e1b4b] leading-snug">{q.cau}</p>
                <p className="text-[14px] text-slate-600 mt-1">
                  {q.nguoiCungDat
                    ? thay(tra(QUY_TAC_KHUNG, 'DAT_NGAY_CUNG', lang) ?? '', { ngay: ngayGon(q.ngayDat), ten: q.nguoiCungDat })
                    : thay(tra(QUY_TAC_KHUNG, 'DAT_NGAY', lang) ?? '', { ngay: ngayGon(q.ngayDat) })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => xoa(q.id)}
                aria-label={t('Xoá')}
                className="min-h-[52px] min-w-[52px] flex items-center justify-center text-slate-500"
              >
                <Trash2 size={20} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {buoc === 1 && conCho && (
        <div className="flex flex-col gap-2 mt-2">
          {MAU_QUY_TAC.map((m) => (
            <button
              key={m.ma}
              type="button"
              onClick={() => chonMau(m.ma)}
              className="w-full min-h-[56px] text-left px-4 py-3 rounded-[18px] bg-white border-2 border-[#1e1b4b] font-bold text-[16px] text-[#1e1b4b] leading-snug active:scale-[0.99] transition-transform"
            >
              {tra(QUY_TAC_MAU, m.ma, lang)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => chonMau('TUY_CHINH')}
            className="w-full min-h-[56px] px-4 py-3 rounded-[18px] border-2 border-dashed border-[#1e1b4b] font-bold text-[16px] text-[#1e1b4b]"
          >
            {tra(QUY_TAC_MAU, 'TUY_CHINH', lang)}
          </button>
        </div>
      )}

      {buoc === 1 && !conCho && (
        <p className="text-[15px] text-slate-700 mt-3 leading-relaxed">
          {tra(QUY_TAC_KHUNG, 'QUA_NHIEU', lang)}
        </p>
      )}

      {buoc === 2 && (
        <div className="mt-3">
          <textarea
            value={cau}
            onChange={(e) => setCau(e.target.value.slice(0, TOI_DA_KY_TU_CAU))}
            rows={3}
            className="w-full rounded-[18px] border-2 border-[#1e1b4b] p-4 text-[17px] font-semibold text-[#1e1b4b] leading-snug"
          />
          <p className="text-[14px] text-slate-600 mt-1 text-right tabular-nums">
            {cau.length}/{TOI_DA_KY_TU_CAU}
          </p>
          <button
            type="button"
            onClick={() => setBuoc(3)}
            disabled={cau.trim().length === 0}
            className="mt-3 w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] disabled:opacity-40"
          >
            {t('Tiếp tục')}
          </button>
        </div>
      )}

      {buoc === 3 && (
        <div className="mt-3">
          <p className="text-[17px] font-bold text-[#1e1b4b] mb-3 leading-snug">
            {tra(QUY_TAC_KHUNG, 'AI_CUNG_DAT', lang)}
          </p>
          <div className="flex flex-col gap-2">
            {danhSach.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => { setNguoiCungDat(n.ten); luu(n.ten); }}
                className="w-full min-h-[56px] text-left px-4 py-3 rounded-[18px] bg-white border-2 border-[#1e1b4b] font-bold text-[16px] text-[#1e1b4b]"
              >
                {n.ten}{n.quanHe ? ` · ${n.quanHe}` : ''}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setNguoiCungDat(null); luu(null); }}
              className="w-full min-h-[56px] px-4 py-3 rounded-[18px] border-2 border-[#1e1b4b] font-bold text-[16px] text-[#1e1b4b]"
            >
              {tra(QUY_TAC_KHUNG, 'BO_QUA', lang)}
            </button>
          </div>
          {loi && <p className="text-[15px] text-red-700 font-bold mt-3">{loi}</p>}
        </div>
      )}

      {buoc === 4 && (
        <div className="mt-4">
          <div className="bg-white border-2 border-[#1e1b4b] rounded-[22px] px-4 py-4">
            <p className="text-[19px] font-black text-[#1e1b4b] leading-snug">{cau}</p>
            {/*
              Đọc lại ĐÚNG thứ vừa được lưu, kèm tên người cùng đặt. Đây cũng là
              chỗ bắt lỗi rẻ nhất: nếu tên biến mất ở màn này thì nó cũng biến
              mất trong bản lưu — đúng lỗi đã gặp ngày 16/9/2026.
            */}
            <p className="text-[15px] text-slate-600 mt-2 leading-snug">
              {nguoiCungDat
                ? thay(tra(QUY_TAC_KHUNG, 'DAT_NGAY_CUNG', lang) ?? '', { ngay: ngayGon(Date.now()), ten: nguoiCungDat })
                : thay(tra(QUY_TAC_KHUNG, 'DAT_NGAY', lang) ?? '', { ngay: ngayGon(Date.now()) })}
            </p>
          </div>
          <p className="text-[16px] text-slate-700 mt-3 leading-relaxed">
            {tra(QUY_TAC_KHUNG, 'DA_LUU', lang)}
          </p>
          <button
            type="button"
            onClick={() => { setCau(''); setNguoiCungDat(null); setBuoc(1); }}
            className="mt-4 w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px]"
          >
            {t('Xong')}
          </button>
        </div>
      )}
    </div>
  );
}
