/**
 * ═════════ BỘ SÀNG LỌC TẦNG 0 TẠI MÁY (100% OFFLINE TYPESCRIPT) ═════════
 *
 * Thực thi mục 5.1 của `docs/kien-truc-hai-phia.md` & `src/canh-bao-thu-dong.ts`:
 * - Chạy hoàn toàn trên thiết bị người dùng (trình duyệt / APK WebView) dưới 10ms.
 * - KHÔNG gửi nội dung tin nhắn (`noiDung`) lên máy chủ (§6.9 & PERMISSIONS-AND-POLICY.md).
 * - Tải và nhớ đệm gói từ khóa từ `GET /api/detect/bo-luat` khi có mạng (chỉ nhận bản có
 *   `phienBan` mới hơn, hợp nhất chỉ theo chiều TĂNG cảnh giác §4.2), đồng thời luôn có
 *   gói mặc định đóng gói sẵn để chạy ngay cả khi máy bật lần đầu lúc mất sóng.
 * - Tách riêng khỏi `backend/src/analysis/` (`src/` chỉ chứa TypeScript giao diện theo
 *   `test/bo-luat-khong-duoc-lech.test.js`).
 */

import { api } from '../api-goc';

export interface GoiLuatCucBo {
  phienBan: string;
  maoDanh: string[];
  allowlistTenMien: string[];
  allowlistHauTo: string[];
  duoiMienRuiRo: string[];
  caiApp: string[];
  biMat: string[];
  maXacThucYeuCau: string[];
  maXacThucDoiTuong: string[];
}

export interface KetQuaSangLocTaiMay {
  coDauHieu: boolean;
  nhanDeXuat: 'CAO' | 'NGHI_NGO' | 'CHUA_THAY';
  canThiep: 'PROTECTED_CRITICAL' | 'PAUSE_60S' | 'VERIFY_PATH' | 'TRUST_RECEIPT';
  luatKhopVoi: string[];
  maLyDo: string[];
  maGiaiThich: string | null;
  hoKichBan: string | null;
  phienBanLuat: string;
}

const KHOA_CACHE_LUAT = 'khoan_da_bo_luat_tang_0_v1';

const GOI_MAC_DINH: GoiLuatCucBo = {
  phienBan: '2026.09.05+1',
  maoDanh: [
    'công an', 'cảnh sát', 'viện kiểm sát', 'tòa án', 'toà án', 'bộ công an',
    'phạt nguội', 'csgt', 'chi cục thuế', 'tổng cục thuế', 'bảo hiểm xã hội',
    'bhxh', 'vneid', 'vssid', 'etax', 'điện lực', 'evn',
    'vietnampost', 'vnpost', 'viettel post', 'giao hàng nhanh', 'giao hàng tiết kiệm',
    'hải quan', 'hoàn thuế', 'cắt điện', 'chuyển tiền đối ứng',
  ],
  allowlistTenMien: [
    'dichvucong.gov.vn', 'bocongan.gov.vn', 'csgt.vn', 'gdt.gov.vn', 'thuedientu.gdt.gov.vn',
    'baohiemxahoi.gov.vn', 'evn.com.vn', 'evnhanoi.vn', 'evnspc.vn',
    'vietcombank.com.vn', 'bidv.com.vn', 'vietinbank.vn', 'agribank.com.vn',
    'techcombank.com.vn', 'mbbank.com.vn', 'vpbank.com.vn', 'acb.com.vn',
    'tpbank.vn', 'sacombank.com.vn', 'hdbank.com.vn', 'vib.com.vn',
    'msb.com.vn', 'ocb.com.vn', 'shb.com.vn', 'seabank.com.vn',
    'momo.vn', 'zalopay.vn', 'vnpay.vn', 'viettelmoney.vn',
    'vietnampost.vn', 'vnpost.vn', 'viettelpost.com.vn', 'ghn.vn', 'ghtk.vn', 'shopee.vn',
  ],
  allowlistHauTo: ['gov.vn', 'chinhphu.vn'],
  duoiMienRuiRo: [
    'top', 'xyz', 'vip', 'icu', 'buzz', 'click', 'link', 'tk', 'ml', 'ga', 'cf', 'gq', 'loan',
    'rest', 'cyou', 'shop', 'online', 'site', 'website', 'space', 'fun', 'live', 'work',
    'monster', 'quest', 'sbs', 'cfd', 'bond', 'pro', 'store', 'life', 'help', 'asia',
  ],
  caiApp: ['cài đặt file', 'tải ứng dụng', 'cài app', 'file apk', '.apk', 'quyền trợ năng', 'anydesk', 'teamviewer', 'ultraview'],
  biMat: ['giữ bí mật', 'không được nói', 'đừng nói với ai', 'đừng cho ai biết', 'không báo gia đình'],
  maXacThucYeuCau: ['đọc', 'gửi', 'cung cấp', 'nhập', 'cho tôi', 'nhắn', 'cho em', 'cho cháu'],
  maXacThucDoiTuong: ['mã otp', 'otp', 'mã xác thực', 'mã xác nhận', 'mật khẩu', 'mã pin', 'mã cvv'],
};

function boDau(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function hopMang(a: string[], b: unknown): string[] {
  const them = Array.isArray(b) ? b.filter((x): x is string => typeof x === 'string') : [];
  return Array.from(new Set([...a, ...them.map((x) => x.trim().toLowerCase()).filter(Boolean)]));
}

let goiDangDung: GoiLuatCucBo | null = null;

export function layGoiLuatCucBo(): GoiLuatCucBo {
  if (goiDangDung) return goiDangDung;
  try {
    const raw = localStorage.getItem(KHOA_CACHE_LUAT);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.phienBan === 'string' && p.phienBan >= GOI_MAC_DINH.phienBan) {
        goiDangDung = {
          phienBan: p.phienBan,
          maoDanh: hopMang(GOI_MAC_DINH.maoDanh, p.maoDanh),
          allowlistTenMien: hopMang(GOI_MAC_DINH.allowlistTenMien, p.allowlistTenMien),
          allowlistHauTo: hopMang(GOI_MAC_DINH.allowlistHauTo, p.allowlistHauTo),
          duoiMienRuiRo: hopMang(GOI_MAC_DINH.duoiMienRuiRo, p.duoiMienRuiRo),
          caiApp: hopMang(GOI_MAC_DINH.caiApp, p.caiApp),
          biMat: hopMang(GOI_MAC_DINH.biMat, p.biMat),
          maXacThucYeuCau: hopMang(GOI_MAC_DINH.maXacThucYeuCau, p.maXacThucYeuCau),
          maXacThucDoiTuong: hopMang(GOI_MAC_DINH.maXacThucDoiTuong, p.maXacThucDoiTuong),
        };
        return goiDangDung;
      }
    }
  } catch {
    // ignore storage errors
  }
  goiDangDung = GOI_MAC_DINH;
  return goiDangDung;
}

export async function dongBoBoLuatTang0(): Promise<boolean> {
  try {
    const r = await fetch(api('/api/detect/bo-luat'));
    if (!r.ok) return false;
    const d = await r.json();
    if (!d || typeof d.phienBan !== 'string') return false;
    const hienTai = layGoiLuatCucBo();
    if (d.phienBan < hienTai.phienBan) return false;
    const hop: GoiLuatCucBo = {
      phienBan: d.phienBan,
      maoDanh: hopMang(hienTai.maoDanh, d.maoDanh?.cum),
      allowlistTenMien: hopMang(hienTai.allowlistTenMien, d.allowlist?.tenMien),
      allowlistHauTo: hopMang(hienTai.allowlistHauTo, d.allowlist?.hauToChinhThuc),
      duoiMienRuiRo: hopMang(hienTai.duoiMienRuiRo, d.duoiMienRuiRo?.duoi),
      caiApp: hopMang(hienTai.caiApp, d.cum?.caiApp),
      biMat: hopMang(hienTai.biMat, d.cum?.biMat),
      maXacThucYeuCau: hopMang(hienTai.maXacThucYeuCau, d.cum?.doiMaXacThuc?.veYeuCau),
      maXacThucDoiTuong: hopMang(hienTai.maXacThucDoiTuong, d.cum?.doiMaXacThuc?.veDoiTuong),
    };
    goiDangDung = hop;
    try {
      localStorage.setItem(KHOA_CACHE_LUAT, JSON.stringify(hop));
    } catch {
      // ignore
    }
    return true;
  } catch {
    return false;
  }
}

function trichTenMienTaiMay(vanBan: string): Array<{ url: string; host: string; laApk: boolean }> {
  const kq: Array<{ url: string; host: string; laApk: boolean }> = [];
  const re = /\b(?:https?:\/\/)?((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24})(\/[^\s<>"')\]]*)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(vanBan)) !== null) {
    const host = (m[1] || '').toLowerCase().replace(/\.$/, '');
    const full = m[0].replace(/[.,;:!?)]+$/, '');
    if (!host) continue;
    kq.push({ url: full, host, laApk: /\.apk(\?|#|$)/i.test(full) });
  }
  return kq;
}

function trongAllowlist(host: string, luat: GoiLuatCucBo): boolean {
  return (
    luat.allowlistTenMien.some((d) => host === d || host.endsWith(`.${d}`)) ||
    luat.allowlistHauTo.some((h) => host === h || host.endsWith(`.${h}`))
  );
}

/**
 * Sàng lọc tin nhắn bắt từ thông báo NGAY TRÊN MÁY (không gửi nội dung lên server).
 */
export function sangLocTinDenTaiMay(noiDung: string, luat = layGoiLuatCucBo()): KetQuaSangLocTaiMay {
  const goc = String(noiDung || '').trim();
  const kd = boDau(goc);
  const urls = trichTenMienTaiMay(goc);
  const luatKhop: string[] = [];
  const maLyDo: string[] = [];

  const coMaoDanh = luat.maoDanh.some((c) => kd.includes(boDau(c)));
  const coLinkNgoai = urls.some((u) => !trongAllowlist(u.host, luat));
  const coApk = urls.some((u) => u.laApk) || luat.caiApp.some((c) => kd.includes(boDau(c)));
  const coBiMat = luat.biMat.some((c) => kd.includes(boDau(c)));
  const coDuoiRuiRo = urls.some((u) => {
    const duoi = u.host.split('.').pop() || '';
    return luat.duoiMienRuiRo.includes(duoi);
  });

  // Kiểm tra đòi OTP cục bộ có hàng rào phủ định (tránh báo nhầm SMS cảnh báo của ngân hàng)
  let coDoiOtp = false;
  const laCanhBaoNganHang = /\b(khong chia se|khong cung cap|tuyet doi khong|canh bao|khuyen cao)\b/.test(kd);
  if (!laCanhBaoNganHang) {
    const coDt = luat.maXacThucDoiTuong.some((d) => kd.includes(boDau(d)));
    const coYc = luat.maXacThucYeuCau.some((y) => kd.includes(boDau(y)));
    if (coDt && coYc) coDoiOtp = true;
  }

  if (coMaoDanh && coLinkNgoai) {
    luatKhop.push('R1');
    maLyDo.push('ID_AUTHORITY_IMPERSONATION', 'WEB_BRAND_DOMAIN_MISMATCH');
  }
  if (coApk && (urls.length > 0 || /\b(apk|anydesk|teamviewer|ultraview|tro nang)\b/.test(kd))) {
    luatKhop.push('R2');
    maLyDo.push('DEV_INSTALL_APK_UNKNOWN');
  }
  if (coDoiOtp) {
    luatKhop.push('R8');
    maLyDo.push('CRED_OTP_SHARE');
  }
  if (coDuoiRuiRo) {
    luatKhop.push('R5');
  }
  if (coBiMat) {
    luatKhop.push('R7');
    maLyDo.push('MAN_SECRECY');
  }

  const lenCao = luatKhop.includes('R1') || luatKhop.includes('R2') || luatKhop.includes('R8') || (coBiMat && coMaoDanh);
  const lenNghiNgo = !lenCao && (luatKhop.length > 0);
  const nhanDeXuat = lenCao ? 'CAO' : lenNghiNgo ? 'NGHI_NGO' : 'CHUA_THAY';

  return {
    coDauHieu: nhanDeXuat !== 'CHUA_THAY',
    nhanDeXuat,
    canThiep: luatKhop.includes('R2') || luatKhop.includes('R8')
      ? 'PROTECTED_CRITICAL'
      : nhanDeXuat === 'CAO'
        ? 'PAUSE_60S'
        : nhanDeXuat === 'NGHI_NGO'
          ? 'VERIFY_PATH'
          : 'TRUST_RECEIPT',
    luatKhopVoi: luatKhop,
    maLyDo: Array.from(new Set(maLyDo)),
    maGiaiThich: luatKhop[0] || null,
    hoKichBan: coApk ? 'chiem_quyen_thiet_bi' : coMaoDanh ? 'gia_danh_cong_an' : null,
    phienBanLuat: luat.phienBan,
  };
}
