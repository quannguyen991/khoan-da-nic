import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api-goc';
import { tinMoiNhat, appVuaCai, laApk } from './native';
import type { ManCanhBao } from './components/CanhBaoToanManHinh';

/**
 * VÒNG PHÁT HIỆN THỤ ĐỘNG — người dùng không phải thao tác gì.
 *
 * ══════════ ĐÂY LÀ NƠI "BỊ ĐỘNG" THÀNH "THỤ ĐỘNG" ══════════
 * Trước đợt này, tin bắt được nằm im trong bộ đệm native chờ bác CHỦ ĐỘNG bấm
 * kiểm. Người đang bị kẻ gian dồn ép là người ít có khả năng bấm nút nhất — nên
 * một bộ đệm chờ bấm gần như không cứu được ai. Hook này tự lấy, tự phân tích,
 * tự bật màn cảnh báo.
 *
 * ══════════ ⚠️ HẠN CHẾ ĐÃ BIẾT, PHẢI NÓI RA ══════════
 *
 * Bản này gọi `POST /api/detect` — TỨC LÀ CẦN MẠNG.
 *
 * Kiến trúc đã dựng để tầng 0 chạy offline (`backend/src/detect/` là JS thuần,
 * không phụ thuộc Express), nhưng việc NẠP nó thẳng vào gói của trình duyệt
 * chưa làm. Cho tới lúc đó, mất mạng là mất khả năng phát hiện thụ động — và
 * đó đúng là thứ `docs/kien-truc-hai-phia.md` mục 5.1 liệt kê là CÒN LẠI
 * ("Nối DocThongBao → detect.analyze() tự động — 2 ngày").
 *
 * ⚠️ ĐỪNG VIẾT "hoạt động cả khi mất mạng" vào bất kỳ tài liệu nào cho tới khi
 * việc đó xong. §11 cấm gọi một mục tiêu là đã đo; cùng logic cho "đã làm".
 *
 * ══════════ §12 — KHÔNG TỰ LÀM THAY NGƯỜI DÙNG ══════════
 * Hook này hiện màn hình và đề nghị. Nó KHÔNG tự gọi ai, KHÔNG tự gửi vị trí,
 * KHÔNG tự khoá máy. Nút gọi là do bác bấm.
 */

/** Nhịp lấy tin từ lớp native. Thưa vừa đủ để không tốn pin, dày vừa đủ để kịp. */
const NHIP_MS = 4000;

export interface VongTronToiThieu {
  chuTaiKhoanId: string;
  thanhVien: Array<{ id: string; vaiTro: string; daThuHoi?: boolean }>;
  quyTac?: unknown;
}

export interface CanhBaoThuDong {
  /** Payload màn cảnh báo, hoặc `null` khi không có gì để hiện. */
  man: ManCanhBao | null;
  /** Mã bản ghi trong bảng `canh_bao`, để ghi hành vi. */
  canhBaoId: string | null;
  dong: () => void;
  toiOn: () => void;
  goi: () => void;
  /** Cho màn cài đặt hiện trạng thái thật, không phải "đang bảo vệ bác". */
  dangCanh: boolean;
}

async function goiApi<T>(duong: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(api(duong), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    /*
     * §4.3 — mạng hỏng KHÔNG được biến thành "đã kiểm, không thấy gì".
     * Trả `null` để tầng gọi biết là CHƯA KIỂM ĐƯỢC, và nó im lặng thay vì
     * hiện một kết luận không có cơ sở.
     */
    return null;
  }
}

export function useCanhBaoThuDong({
  bat, vongTron, tenNguoiCaoTuoi, tenNguoiThan, onGoiNguoiThan,
}: {
  /** Bác đã bật tính năng chưa. Tắt là dừng hẳn, không có "chỉ lần này". */
  bat: boolean;
  vongTron: VongTronToiThieu | null;
  tenNguoiCaoTuoi?: string | null;
  tenNguoiThan?: string | null;
  /** Bác bấm nút chính. Tầng trên quyết định gọi điện hay mở màn báo người thân. */
  onGoiNguoiThan?: () => void;
}): CanhBaoThuDong {
  const [man, setMan] = useState<ManCanhBao | null>(null);
  const [canhBaoId, setCanhBaoId] = useState<string | null>(null);
  const [dangCanh, setDangCanh] = useState(false);

  /** Chặn hai lượt phân tích chồng nhau — và chặn cả việc bật đè lên màn đang hiện. */
  const dangChay = useRef(false);
  const manRef = useRef<ManCanhBao | null>(null);
  manRef.current = man;

  const phatCanhBao = useCallback(async (ketQua: any) => {
    if (!ketQua || ketQua.nhan === 'CHUA_THAY') return;
    if (!vongTron) return;

    const ra = await goiApi<any>('/api/detect/canh-bao', {
      ketQua,
      vongTron,
      tenNguoiCaoTuoi: tenNguoiCaoTuoi ?? null,
      tenNguoiThan: tenNguoiThan ?? null,
      // §6.9 — KHÔNG gửi nội dung. Công tắc chia sẻ mặc định TẮT và nằm ở backend.
    });
    if (!ra?.phat) return;
    setCanhBaoId(ra.canhBaoId ?? null);
    setMan(ra.nguoiCaoTuoi ?? null);
  }, [vongTron, tenNguoiCaoTuoi, tenNguoiThan]);

  useEffect(() => {
    if (!bat) { setDangCanh(false); return undefined; }
    let song = true;

    (async () => { setDangCanh(await laApk()); })();

    const nhip = window.setInterval(async () => {
      if (!song || dangChay.current) return;
      // Đang có màn cảnh báo trên màn hình thì đừng bật đè cái nữa.
      if (manRef.current) return;
      dangChay.current = true;
      try {
        /*
         * ⚠️ ỨNG DỤNG LẠ TRƯỚC, TIN NHẮN SAU.
         * Cài một app từ ngoài cửa hàng là tín hiệu mạnh hơn bất kỳ tin nhắn
         * nào, và nó thường xảy ra Ở CUỐI kịch bản — lúc kẻ gian sắp chiếm được
         * máy. Xử nó trước là giành lại vài giây ở đúng chỗ đắt nhất.
         */
        const dsApp = await appVuaCai();
        if (dsApp && dsApp.length > 0) {
          for (const a of dsApp) {
            const kq = await goiApi<any>('/api/detect/ung-dung', a);
            if (kq && kq.nhan !== 'CHUA_THAY') { await phatCanhBao(kq); break; }
          }
          if (manRef.current) return;
        }

        const tin = await tinMoiNhat();
        if (!tin?.co) return;

        const kq = await goiApi<any>('/api/detect', {
          nguon: 'thong_bao',
          nguoiGui: '',
          noiDung: tin.noiDung,
          thoiDiem: Date.now(),
          /*
           * §4.3 — chuyển tiếp mã hỏng của lớp native. "Đọc được một phần" phải
           * đi tới được bộ luật, nếu không thì một tin bị cắt cụt ra "chưa thấy
           * dấu hiệu rủi ro".
           */
          doTinCayDauVao: tin.maChuaKiem === 'chi_doc_duoc_mot_phan_tin' ? 0.3 : undefined,
        });
        await phatCanhBao(kq);
      } finally {
        dangChay.current = false;
      }
    }, NHIP_MS);

    return () => { song = false; window.clearInterval(nhip); };
  }, [bat, phatCanhBao]);

  const ghiHanhDong = useCallback((hanhDong: string) => {
    if (!canhBaoId) return;
    // Không chờ kết quả: đây là ghi nhận, không phải điều kiện để đóng màn.
    goiApi(`/api/detect/canh-bao/${canhBaoId}/${hanhDong}`, {});
  }, [canhBaoId]);

  const dong = useCallback(() => {
    setMan(null);
    setCanhBaoId(null);
  }, []);

  /**
   * §4.6 — mỗi lần bấm "Tôi ổn" là MỘT MẪU DỮ LIỆU BÁO ĐỘNG GIẢ.
   * Ghi lại trước rồi mới đóng màn. Chỉ đóng mà không ghi là vứt đi đúng thứ
   * cần để hiệu chỉnh ngưỡng.
   */
  const toiOn = useCallback(() => {
    ghiHanhDong('toi-on');
    dong();
  }, [ghiHanhDong, dong]);

  const goi = useCallback(() => {
    ghiHanhDong('goi');
    onGoiNguoiThan?.();
    dong();
  }, [ghiHanhDong, onGoiNguoiThan, dong]);

  return { man, canhBaoId, dong, toiOn, goi, dangCanh };
}
