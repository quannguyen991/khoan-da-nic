import { useEffect, useState } from 'react';
import { Landmark, ExternalLink } from 'lucide-react';
import { CANH_BAO_CHINH_THUC, tra, type Lang } from '../catalog';
import { api } from '../api-goc';

/**
 * CẢNH BÁO CHÍNH THỨC — Ra-đa đưa cảnh báo của công an và cơ quan nhà nước tới
 * đúng người đang gặp đúng thủ đoạn ấy.
 *
 * Kẻ gian dựa vào thẩm quyền giả ("tôi là công an"). Thứ cân lại được là chính
 * cơ quan đó, trên trang `.gov.vn` của họ, đã nói trước rằng kiểu gọi này là lừa.
 *
 * ⚠️ KHÔNG ĐỔI MỨC RỦI RO (§4.2). Khối này hiện SAU khi bộ luật đã quyết, và chỉ
 * đọc `hoKichBan` + `maLyDo` bộ luật trả về.
 *
 * ⚠️ KHÔNG HIỆN Ở MỨC "CHƯA THẤY DẤU HIỆU". Một cảnh báo của công an ngay dưới
 * dòng đó làm người đọc tưởng hệ thống đang cảnh báo — tức là sản phẩm tự tạo ra
 * một cảnh báo mà bộ luật không hề đưa ra. Chỉ `CAO` và `NGHI_NGO` mới gọi máy chủ.
 *
 * ⚠️ CHỈ GỬI MÃ, KHÔNG GỬI NỘI DUNG TIN NHẮN. Máy chủ cũng từ chối nội dung.
 *
 * ⚠️ KHÔNG TIN MÙ MÁY CHỦ. Đường dẫn được kiểm lại ở đây: phải là `https` trên tên
 * miền `.gov.vn`. Đây là chỗ một đường dẫn thành nút bấm trước mắt người đang bị
 * lừa — nếu kho bị đầu độc thì lớp này là lớp chặn cuối.
 *
 * Lỗi mạng, máy chủ lỗi, không có cảnh báo nào khớp: KHÔNG HIỆN GÌ. Đây là phần
 * thêm, không phải kết quả phân tích.
 */

type CanhBao = {
  id: string;
  coQuan: string;
  ngayCongBo: string | null;
  tomTat: string;
  tenMien: string;
  sourceUrl: string;
};

/** Hai là đủ — máy chủ cũng cắt ở hai. Nhiều hơn thì người đang hoảng không đọc hết. */
const TOI_DA = 2;

const thay = (mau: string, o: Record<string, string>): string =>
  Object.entries(o).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), mau);

/** Tên miền nếu đường dẫn là `https` trên `.gov.vn`; không thì `null`. */
function tenMienGovVn(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    // `https://bocongan.gov.vn@evil.com` trông như Bộ Công an, tên miền thật là evil.com.
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    return u.hostname.endsWith('.gov.vn') ? u.hostname : null;
  } catch {
    return null;
  }
}

function locCanhBao(tho: unknown, lang: Lang): CanhBao[] {
  if (!Array.isArray(tho)) return [];
  const ra: CanhBao[] = [];
  for (const x of tho) {
    if (!x || typeof x !== 'object') continue;
    const m = x as Record<string, unknown>;
    const tenMien = tenMienGovVn(m.sourceUrl);
    const tomTat = lang === 'en' ? m.tomTatEn : m.tomTat;
    // Thiếu tóm tắt đúng ngôn ngữ thì bỏ, đừng hiện chữ của ngôn ngữ kia.
    if (!tenMien || typeof tomTat !== 'string' || !tomTat.trim()) continue;
    if (typeof m.id !== 'string' || typeof m.coQuan !== 'string' || !m.coQuan.trim()) continue;
    ra.push({
      id: m.id,
      coQuan: m.coQuan,
      ngayCongBo: typeof m.ngayCongBo === 'string' ? m.ngayCongBo : null,
      tomTat,
      tenMien,
      sourceUrl: m.sourceUrl as string,
    });
  }
  return ra.slice(0, TOI_DA);
}

/** "2025-09-24" → "24/09/2025" (vi) · "24 September 2025" (en). Sai định dạng thì `null`. */
function ngayHien(iso: string | null, lang: Lang): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(
    lang === 'en' ? 'en-GB' : 'vi-VN',
    lang === 'en'
      ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' },
  ).format(d);
}

export function CanhBaoChinhThuc({
  nhan, hoKichBan, maLyDo, lang,
}: {
  nhan: string | null;
  hoKichBan: string | null;
  maLyDo: string[];
  lang: Lang;
}) {
  const [ds, setDs] = useState<CanhBao[]>([]);
  const duocHien = nhan === 'CAO' || nhan === 'NGHI_NGO';

  /*
   * ⚠️ PHỤ THUỘC VÀO CHUỖI MÃ, KHÔNG VÀO MẢNG. Màn cảnh báo dựng lại mỗi giây vì
   * đồng hồ đếm ngược, và `result?.maLyDo ?? []` là một mảng MỚI mỗi lần dựng.
   * Phụ thuộc vào mảng thì mỗi giây gọi máy chủ một lần.
   */
  const khoaMa = maLyDo.join(',');

  useEffect(() => {
    if (!duocHien || (!hoKichBan && !khoaMa)) { setDs([]); return; }
    let huy = false;
    fetch(api('/api/ra-da'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoKichBan, maLyDo: khoaMa ? khoaMa.split(',') : [] }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!huy) setDs(locCanhBao(d?.canhBao, lang)); })
      .catch(() => { /* mất mạng ⇒ khối này không hiện, không phải lỗi cần báo */ });
    return () => { huy = true; };
  }, [duocHien, hoKichBan, khoaMa, lang]);

  if (!duocHien || ds.length === 0) return null;

  return (
    <section className="w-full bg-black/30 border border-white/20 rounded-[22px] px-4 py-4 mb-2 backdrop-blur-md">
      <div className="flex items-start gap-2 mb-3">
        <Landmark size={20} className="text-white/90 shrink-0 mt-0.5" aria-hidden="true" />
        <h3 className="text-white font-black text-[17px] leading-snug">
          {tra(CANH_BAO_CHINH_THUC, 'TIEU_DE', lang)}
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        {ds.map((c, i) => {
          const ngay = ngayHien(c.ngayCongBo, lang);
          return (
            <div key={c.id} className={i > 0 ? 'pt-4 border-t border-white/20' : ''}>
              {/* Nguồn đứng TRƯỚC nội dung — §11: cảnh báo không có nguồn là cảnh báo không được viết. */}
              <p className="text-white font-bold text-[15px] leading-snug">{c.coQuan}</p>
              {ngay && (
                <p className="text-white/85 text-[14px] leading-snug mt-0.5">
                  {thay(tra(CANH_BAO_CHINH_THUC, 'CONG_BO', lang) ?? '', { ngay })}
                </p>
              )}
              <p className="text-white font-semibold text-[16px] leading-relaxed mt-2">{c.tomTat}</p>
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full min-h-[52px] px-4 py-2 rounded-2xl border-2 border-white/80 text-white font-bold text-[15px] leading-snug flex items-center justify-center gap-2 text-center active:scale-[0.98] transition-transform"
              >
                {/* Hiện tên miền để bác tự thấy đây là trang .gov.vn, không phải tin lời app. */}
                <span className="[overflow-wrap:anywhere]">
                  {thay(tra(CANH_BAO_CHINH_THUC, 'DOC_BAN_GOC', lang) ?? '', { tenMien: c.tenMien })}
                </span>
                <ExternalLink size={18} className="shrink-0" aria-hidden="true" />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
