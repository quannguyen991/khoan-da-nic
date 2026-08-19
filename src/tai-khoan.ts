import { api } from './api-goc';

/**
 * TÀI KHOẢN — lớp gọi API thật của máy chủ.
 *
 * ══════════ ⚠️ ĐĂNG NHẬP DÙNG ĐỂ LÀM GÌ, VÀ KHÔNG DÙNG ĐỂ LÀM GÌ ══════════
 *
 * DÙNG cho danh tính: ai là ai trong vòng tròn gia đình, ai ký xác nhận "đúng
 * là con gửi tin này" trong Khoan Proof. Những việc đó cần hai bên biết nhau,
 * và không có cách nào làm chúng hoàn toàn trong máy.
 *
 * KHÔNG DÙNG để đồng bộ nội dung. Tin nhắn bác dán vào kiểm, ảnh bác chụp,
 * lịch sử kiểm — tất cả vẫn nằm trong máy như trước. §12 cấm thẳng việc bật
 * đồng bộ máy chủ mặc định, và đăng nhập KHÔNG phải là cái cớ để mở nó.
 *
 * ⚠️ VÀ TUYỆT ĐỐI KHÔNG CHẶN ĐƯỜNG KIỂM. `/api/analyze` không bao giờ đòi
 * token — rút mạng, chưa đăng nhập, hết hạn phiên thì bác vẫn phải kiểm được
 * tin nhắn. Đó là §5.3 và §6.9, và cũng là lẽ thường: một người đang bị thúc
 * chuyển tiền không có mười lăm giây để nhớ mật khẩu.
 *
 * ══════════ ⚠️ TOKEN NẰM Ở localStorage — BIẾT RÕ CÁI GIÁ ══════════
 *
 * Nó đọc được bằng JavaScript, nên một lỗ XSS là mất phiên. Cookie `httpOnly`
 * an toàn hơn về mặt đó, nhưng bản APK chạy ở origin `https://localhost` và
 * gọi sang một tên miền khác — cookie bên thứ ba bị WebView chặn, tức đường
 * đăng nhập sẽ chết im lặng trên đúng bản mà người dùng thật cài.
 *
 * Đánh đổi có ý thức: chấp nhận localStorage, và bù bằng CSP không cho chạy
 * script bên ngoài (`script-src 'self'` khi chạy thật), phiên có hạn, và đăng
 * xuất HUỶ token ở máy chủ chứ không chỉ xoá ở máy.
 */

const KHOA_TOKEN = 'khoan_da_phien';

export interface HoSo {
  id: string;
  ten: string;
  so: string;
  vai: string;
  taoLuc: number;
}

interface PhienLuu {
  token: string;
  hetHanLuc: number;
  hoSo: HoSo;
}

export class LoiTaiKhoan extends Error {
  ma: string;
  /** Số giây phải chờ, chỉ có ở mã `THU_LAI_SAU`. */
  giay?: number;
  constructor(ma: string, giay?: number) {
    super(ma);
    this.ma = ma;
    this.giay = giay;
  }
}

export function docPhien(): PhienLuu | null {
  try {
    const t = JSON.parse(localStorage.getItem(KHOA_TOKEN) || 'null');
    if (!t?.token || !t?.hoSo) return null;
    /*
     * ⚠️ KIỂM HẠN NGAY Ở MÁY. Không kiểm thì giao diện hiện tên bác như đang
     * đăng nhập, rồi mọi lượt gọi trả 401 mà không ai hiểu vì sao — bác thấy
     * app "tự nhiên hỏng" chứ không thấy "phiên đã hết hạn".
     */
    if (typeof t.hetHanLuc === 'number' && Date.now() > t.hetHanLuc) {
      localStorage.removeItem(KHOA_TOKEN);
      return null;
    }
    return t as PhienLuu;
  } catch {
    return null;
  }
}

function luuPhien(p: PhienLuu | null) {
  try {
    if (p) localStorage.setItem(KHOA_TOKEN, JSON.stringify(p));
    else localStorage.removeItem(KHOA_TOKEN);
  } catch {
    // Không lưu được (chế độ riêng tư, hết chỗ) — phiên chỉ sống tới khi đóng
    // app. Vẫn dùng được, chỉ là lần sau phải đăng nhập lại.
  }
}

async function goi(duong: string, tuyChon: RequestInit = {}, kemToken = false) {
  const dau: Record<string, string> = { 'Content-Type': 'application/json' };
  if (kemToken) {
    const p = docPhien();
    if (p) dau.Authorization = `Bearer ${p.token}`;
  }
  const r = await fetch(api(duong), { ...tuyChon, headers: { ...dau, ...(tuyChon.headers as any) } });
  const than = await r.json().catch(() => ({}));

  if (!r.ok) {
    /*
     * ⚠️ 401 ⇒ XOÁ PHIÊN Ở MÁY LUÔN. Máy chủ đã coi token này là không còn giá
     * trị (hết hạn, hoặc bác đăng xuất ở máy khác). Giữ lại chỉ để giao diện
     * tiếp tục vẽ ra một trạng thái đăng nhập không tồn tại (§4.3).
     */
    if (r.status === 401) luuPhien(null);
    throw new LoiTaiKhoan(than?.maLoi || `HTTP_${r.status}`, than?.giay);
  }
  return than;
}

export async function dangKy(soDienThoai: string, matKhau: string, ten: string): Promise<HoSo> {
  const t = await goi('/api/tai-khoan/dang-ky', {
    method: 'POST',
    body: JSON.stringify({ soDienThoai, matKhau, ten }),
  });
  luuPhien({ token: t.token, hetHanLuc: t.hetHanLuc, hoSo: t.hoSo });
  return t.hoSo;
}

export async function dangNhap(soDienThoai: string, matKhau: string): Promise<HoSo> {
  const t = await goi('/api/tai-khoan/dang-nhap', {
    method: 'POST',
    body: JSON.stringify({ soDienThoai, matKhau }),
  });
  luuPhien({ token: t.token, hetHanLuc: t.hetHanLuc, hoSo: t.hoSo });
  return t.hoSo;
}

/**
 * ⚠️ GỌI MÁY CHỦ HUỶ TOKEN, RỒI MỚI XOÁ Ở MÁY — và xoá kể cả khi gọi hỏng.
 *
 * Chỉ xoá ở máy thì token vẫn còn giá trị trên máy chủ tới khi hết hạn. Bác
 * đăng xuất ở máy con cháu mượn, tưởng đã ra, mà phiên vẫn sống.
 *
 * Ngược lại, mạng hỏng không được biến thành "không đăng xuất được" — bác bấm
 * đăng xuất là phải ra khỏi máy này, còn phần huỷ ở máy chủ thì token cũng sẽ
 * hết hạn theo thời gian.
 */
export async function dangXuat(): Promise<void> {
  try {
    await goi('/api/tai-khoan/dang-xuat', { method: 'POST' }, true);
  } catch {
    // Máy chủ không nghe được. Vẫn xoá ở máy.
  }
  luuPhien(null);
}

/**
 * Hỏi máy chủ xem phiên còn giá trị không, và lấy hồ sơ mới nhất.
 *
 * ⚠️ `null` = KHÔNG CÒN ĐĂNG NHẬP, và đó là một kết quả bình thường. Đừng để
 * nó ném ra ngoài: màn hình gọi hàm này lúc mở app, mà một ngoại lệ ở đó sẽ
 * chặn cả app chỉ vì phiên hết hạn.
 */
export async function layHoSo(): Promise<HoSo | null> {
  if (!docPhien()) return null;
  try {
    const t = await goi('/api/tai-khoan/toi', {}, true);
    const p = docPhien();
    if (p && t?.hoSo) luuPhien({ ...p, hoSo: t.hoSo });
    return t?.hoSo ?? null;
  } catch {
    return null;
  }
}

export async function suaHoSo(thayDoi: { ten?: string }): Promise<HoSo> {
  const t = await goi('/api/tai-khoan/toi', {
    method: 'PATCH',
    body: JSON.stringify(thayDoi),
  }, true);
  const p = docPhien();
  if (p && t?.hoSo) luuPhien({ ...p, hoSo: t.hoSo });
  return t.hoSo;
}

export async function doiMatKhau(matKhauCu: string, matKhauMoi: string): Promise<void> {
  await goi('/api/tai-khoan/doi-mat-khau', {
    method: 'POST',
    body: JSON.stringify({ matKhauCu, matKhauMoi }),
  }, true);
}
