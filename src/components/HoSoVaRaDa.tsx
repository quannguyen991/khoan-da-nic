import { useState } from 'react';
import { ChevronLeft, Copy, Download, Radar, FileText, Timer } from 'lucide-react';
import {
  MAN_HO_SO, MAN_RA_DA, MAN_DONG_HO, HO_KICH_BAN, tra, type Lang,
} from '../catalog';
import { dungHoSo, xuatVanBan, type KhaiBao } from '../lib/ho-so-vu-viec';
import { tomTat, dungGoiChiaSe, kiemTraAnToanChiaSe } from '../lib/ra-da-nha-minh';
import { thongKe } from '../lib/do-thoi-gian-toi-nguoi-that';

/**
 * HAI MÀN: hồ sơ vụ việc và ra-đa thủ đoạn.
 *
 * Cả hai chỉ ĐỌC dữ liệu đã có trong máy và trình bày lại. Không màn nào gọi
 * mạng, không màn nào tự gửi gì đi.
 */

const chep = async (van: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(van);
    return true;
  } catch {
    return false;
  }
};

const Dau = ({ ve, chu }: { ve: () => void; chu: string }) => (
  <button
    type="button"
    onClick={ve}
    className="min-h-[52px] min-w-[52px] flex items-center gap-1 text-[#1e1b4b] font-bold text-[15px]"
  >
    <ChevronLeft size={22} aria-hidden="true" />
    {chu}
  </button>
);

// ══════════════════════ HỒ SƠ VỤ VIỆC ══════════════════════

export function ManHoSoVuViec({
  setView, t, lang, lichSu,
}: {
  setView: (v: any) => void;
  t: (s: string) => string;
  lang: Lang;
  lichSu: unknown[];
}) {
  const [khai, setKhai] = useState<KhaiBao>({});
  const [van, setVan] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);

  const dungVan = () => {
    const hs = dungHoSo(lichSu, khai, Date.now());
    setVan(xuatVanBan(hs, lang));
    setDaChep(false);
  };

  /*
   * ⚠️ TẢI VỀ BẰNG BLOB, KHÔNG GỬI LÊN ĐÂU CẢ. Tệp sinh ra trong máy và ở lại
   * trong máy. Đây là hồ sơ về một vụ bác bị lừa — nó không có lý do gì để đi
   * qua máy chủ của bọn mình trên đường tới ngân hàng của bác.
   */
  const taiVe = () => {
    if (!van) return;
    try {
      const b = new Blob([van], { type: 'text/plain;charset=utf-8' });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u;
      a.download = 'ho-so-vu-viec.txt';
      a.click();
      URL.revokeObjectURL(u);
    } catch { /* trình duyệt chặn tải thì vẫn còn nút chép */ }
  };

  const O = ({ nhan, gt, dat, so }: {
    nhan: string; gt: string; dat: (v: string) => void; so?: boolean;
  }) => (
    <label className="block mb-3">
      <span className="block text-[15px] font-bold text-[#1e1b4b] mb-1">{nhan}</span>
      <input
        type={so ? 'tel' : 'text'}
        inputMode={so ? 'numeric' : 'text'}
        value={gt}
        onChange={(e) => dat(e.target.value)}
        className="w-full min-h-[52px] rounded-[16px] border-2 border-[#1e1b4b] px-4 text-[17px] text-[#1e1b4b]"
      />
    </label>
  );

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <Dau ve={() => setView('home')} chu={t('Quay lại')} />

      <h1 className="text-[24px] font-black text-[#1e1b4b] mt-2 mb-1 flex items-center gap-2">
        <FileText size={24} aria-hidden="true" />
        {tra(MAN_HO_SO, 'TIEU_DE', lang)}
      </h1>
      <p className="text-[15px] text-slate-700 leading-relaxed mb-4">
        {tra(MAN_HO_SO, 'MO_TA', lang)}
      </p>

      <O
        nhan={tra(MAN_HO_SO, 'O_SO_TIEN', lang) ?? ''}
        gt={khai.soTien != null ? String(khai.soTien) : ''}
        dat={(v) => setKhai({ ...khai, soTien: v.replace(/\D/g, '') ? Number(v.replace(/\D/g, '')) : null })}
        so
      />
      <O
        nhan={tra(MAN_HO_SO, 'O_NGAN_HANG', lang) ?? ''}
        gt={khai.nganHang ?? ''}
        dat={(v) => setKhai({ ...khai, nganHang: v })}
      />
      <O
        nhan={tra(MAN_HO_SO, 'O_MA_GD', lang) ?? ''}
        gt={khai.maGiaoDich ?? ''}
        dat={(v) => setKhai({ ...khai, maGiaoDich: v })}
      />

      <p className="text-[14px] text-slate-600 leading-snug mb-4">
        {tra(MAN_HO_SO, 'GHI_CHU_KHAI', lang)}
      </p>

      <button
        type="button"
        onClick={dungVan}
        className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px]"
      >
        {tra(MAN_HO_SO, 'NUT_XEM', lang)}
      </button>

      {van && (
        <div className="mt-4">
          <pre className="whitespace-pre-wrap break-words bg-white border-2 border-[#1e1b4b] rounded-[18px] p-4 text-[14px] leading-relaxed text-[#1e1b4b]">
            {van}
          </pre>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={async () => setDaChep(await chep(van))}
              className="flex-1 min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[16px] flex items-center justify-center gap-2"
            >
              <Copy size={20} aria-hidden="true" />
              {tra(MAN_HO_SO, 'NUT_CHEP', lang)}
            </button>
            <button
              type="button"
              onClick={taiVe}
              className="flex-1 min-h-[56px] rounded-[18px] border-2 border-[#1e1b4b] text-[#1e1b4b] font-black text-[16px] flex items-center justify-center gap-2"
            >
              <Download size={20} aria-hidden="true" />
              {tra(MAN_HO_SO, 'NUT_TAI', lang)}
            </button>
          </div>
          {daChep && (
            <p className="text-[15px] font-bold text-emerald-700 mt-2">
              {tra(MAN_HO_SO, 'DA_CHEP', lang)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════ RA-ĐA THỦ ĐOẠN ══════════════════════

export function ManRaDaThuDoan({
  setView, t, lang, lichSu,
}: {
  setView: (v: any) => void;
  t: (s: string) => string;
  lang: Lang;
  lichSu: unknown[];
}) {
  const [tt] = useState(() => tomTat(lichSu, Date.now()));
  const [tkDo] = useState(() => thongKe());
  const [thongBao, setThongBao] = useState<string | null>(null);
  /** Bản chữ hiện ra khi máy không cho chép tự động, để bác chép tay. */
  const [banChu, setBanChu] = useState<string | null>(null);

  /*
   * ⚠️ KIỂM TRƯỚC KHI CHÉP, KHÔNG CHÉP RỒI KIỂM.
   *
   * Khi chuỗi đã nằm trong bộ nhớ tạm thì nó đã rời khỏi tầm kiểm soát của app
   * — bác có thể dán nó vào bất cứ đâu ngay giây sau. Hàng rào phải đứng TRƯỚC.
   */
  const chiaSe = async () => {
    const goi = dungGoiChiaSe(tt, Date.now());
    const kq = kiemTraAnToanChiaSe(goi);
    if (!kq.ok) {
      // Hàng rào chặn: dữ liệu có vấn đề thật, không chép gì cả.
      setBanChu(null);
      setThongBao(tra(MAN_RA_DA, 'BI_CHAN', lang));
      return;
    }
    const van = JSON.stringify(goi, null, 1);
    const ok = await chep(van);
    if (ok) {
      setBanChu(null);
      setThongBao(tra(MAN_RA_DA, 'DA_CHEP', lang));
      return;
    }
    /*
     * ⚠️ MÁY KHÔNG CHO CHÉP ≠ DỮ LIỆU BỊ CHẶN.
     *
     * Bản đầu gộp hai chuyện này vào một câu, và câu đó nói rằng bản chia sẻ
     * của bác "có thứ không hợp lệ" — một lời khai sai về dữ liệu của chính
     * người dùng. Đo được trên bản chạy 16/9/2026: trình duyệt trả
     * NotAllowedError, app hiện câu bị chặn, trong khi gói hoàn toàn sạch.
     */
    setBanChu(van);
    setThongBao(tra(MAN_RA_DA, 'KHONG_CHEP_DUOC', lang));
  };

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto">
      <Dau ve={() => setView('home')} chu={t('Quay lại')} />

      <h1 className="text-[24px] font-black text-[#1e1b4b] mt-2 mb-1 flex items-center gap-2">
        <Radar size={24} aria-hidden="true" />
        {tra(MAN_RA_DA, 'TIEU_DE', lang)}
      </h1>
      <p className="text-[15px] text-slate-700 leading-relaxed mb-4">
        {tra(MAN_RA_DA, 'MO_TA', lang)}
      </p>

      {tt.theoHo.length === 0 ? (
        <p className="text-[16px] text-slate-700 bg-white border-2 border-[#1e1b4b] rounded-[18px] p-4">
          {tra(MAN_RA_DA, 'KHONG_CO', lang)}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tt.theoHo.map((h) => {
            const cao = tt.theoHo[0]?.soLan || 1;
            return (
              <div key={h.ho} className="bg-white border-2 border-[#1e1b4b] rounded-[18px] px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold text-[16px] text-[#1e1b4b] leading-snug">
                    {tra(HO_KICH_BAN, h.ho, lang) ?? h.ho}
                  </span>
                  <span className="text-[15px] font-black text-[#1e1b4b] tabular-nums shrink-0">
                    {h.soLan} {tra(MAN_RA_DA, 'SO_LAN', lang)}
                  </span>
                </div>
                {/* Thanh chỉ để so sánh tương đối; con số mới là thứ đọc được. */}
                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-[#1e1b4b]"
                    style={{ width: `${Math.round((h.soLan / cao) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Đồng hồ phản ứng (vòng A) ── */}
      <div className="mt-6 bg-white border-2 border-[#1e1b4b] rounded-[18px] px-4 py-4">
        <h2 className="text-[16px] font-black text-[#1e1b4b] flex items-center gap-2 mb-2">
          <Timer size={20} aria-hidden="true" />
          {tra(MAN_DONG_HO, 'TIEU_DE', lang)}
        </h2>
        {tkDo ? (
          <>
            <p className="text-[22px] font-black text-[#1e1b4b] leading-snug">
              {(tra(MAN_DONG_HO, 'TRUNG_VI', lang) ?? '').replace('{giay}', String(tkDo.trungVi))}
            </p>
            <p className="text-[14px] text-slate-600 mt-1">
              {(tra(MAN_DONG_HO, 'SO_LUOT', lang) ?? '').replace('{so}', String(tkDo.soLuot))}
            </p>
          </>
        ) : (
          <p className="text-[15px] text-slate-700 leading-snug">
            {tra(MAN_DONG_HO, 'CHUA_DO', lang)}
          </p>
        )}
        <p className="text-[14px] text-slate-600 mt-2 leading-snug">
          {tra(MAN_DONG_HO, 'GIOI_HAN', lang)}
        </p>
      </div>

      {/* ── Chia sẻ ── */}
      <div className="mt-6">
        <button
          type="button"
          onClick={chiaSe}
          disabled={tt.theoHo.length === 0}
          className="w-full min-h-[56px] rounded-[18px] bg-[#1e1b4b] text-white font-black text-[17px] disabled:opacity-40"
        >
          {tra(MAN_RA_DA, 'NUT_CHIA_SE', lang)}
        </button>
        {thongBao && (
          <p className="text-[15px] font-bold text-emerald-700 mt-2">{thongBao}</p>
        )}
        {banChu && (
          <pre className="mt-2 whitespace-pre-wrap break-words select-all bg-white border-2 border-[#1e1b4b] rounded-[18px] p-3 text-[14px] leading-relaxed text-[#1e1b4b]">
            {banChu}
          </pre>
        )}
        <p className="text-[14px] text-slate-600 mt-3 leading-snug">
          {tra(MAN_RA_DA, 'GIAI_THICH_CHIA_SE', lang)}
        </p>
        <p className="text-[14px] text-slate-600 mt-2 leading-snug">
          {tra(MAN_RA_DA, 'CHUA_CO_MAY_CHU', lang)}
        </p>
      </div>
    </div>
  );
}
