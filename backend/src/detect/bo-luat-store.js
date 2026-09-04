'use strict';
/**
 * BỘ LUẬT CẬP NHẬT ĐƯỢC TỪ XA — kho chứa và luật hợp nhất.
 *
 * VÌ SAO PHẢI TÁCH RA KHỎI MÃ: chiêu lừa đổi hằng tuần. Nếu từ khoá nằm trong
 * mã nguồn thì mỗi lần thêm một cụm mới, bác phải cập nhật app — mà phần lớn
 * người cao tuổi không bao giờ cập nhật app. Bộ luật phải đi được một mình.
 *
 * ⚠️ BA RÀNG BUỘC KHÔNG ĐƯỢC PHÁ:
 *
 * 1. LUÔN CÓ BẢN MẶC ĐỊNH ĐÓNG GÓI SẴN. Lần chạy đầu tiên, máy bay, mất mạng,
 *    máy chủ chết — tầng 0 vẫn phải phát hiện được. Bản từ xa là thứ LÀM TỐT
 *    HƠN, không phải thứ bắt buộc phải có.
 *
 * 2. BẢN TỪ XA CHỈ ĐƯỢC NHẬN KHI `phienBan` LỚN HƠN. So bằng chuỗi thứ tự từ
 *    điển trên định dạng `YYYY.MM.DD+n` — mọi bản đều cùng độ dài trường nên so
 *    chuỗi là đúng. Không có đường nào để một bản cũ (hoặc một bản rỗng) đè lên
 *    bản đang chạy.
 *
 * 3. §4.2 — BỘ LUẬT TỪ XA CHỈ ĐƯỢC LÀM TĂNG CẢNH GIÁC.
 *    Hợp nhất là PHÉP HỢP của danh sách cụm từ, KHÔNG phải phép thay thế.
 *    Nếu bản từ xa được phép XOÁ cụm khỏi `maoDanh`, thì một máy chủ bị chiếm
 *    (hoặc một tệp cấu hình gõ nhầm) có thể tắt cả bộ phát hiện mà không ai
 *    thấy — đúng cùng một bài học với "please hold" và "ch play" ở §12: bất kỳ
 *    đường nào hạ mức vô điều kiện đều là câu thần chú tặng cho kẻ lừa đảo.
 *
 *    NGOẠI LỆ DUY NHẤT, VÀ CÓ LÝ DO: `allowlist` và `khoAppChinhThuc` được
 *    phép MỞ RỘNG. Thêm một tên miền chính thức vào allowlist là hạ cảnh giác
 *    — nhưng đó là cách duy nhất để sửa một báo động giả khi ngân hàng đổi tên
 *    miền, và §4.6 nói thẳng báo động giả làm người dùng gỡ ứng dụng. Nên nó
 *    được phép, và nó được GHI LẠI trong `nhatKyHopNhat()` để kiểm toán.
 *
 * HÀM THUẦN + MỘT Ô NHỚ. Không mạng ở đây: `capNhatTuXa()` nhận SẴN dữ liệu đã
 * tải về. Ai tải là việc của tầng gọi (máy chủ, hoặc Android). Tách như vậy để
 * test chạy được không cần mạng, và để §12 "không cho model gọi network trong
 * đường risk analysis" không bị lách qua cửa sau.
 */

const MAC_DINH = require('./bo-luat-mac-dinh.json');

/** Bản đang dùng. Bắt đầu bằng bản đóng gói sẵn — không bao giờ là null. */
let dangDung = chuanHoaGoi(MAC_DINH);
let nhatKy = [];

/** Hợp hai mảng chuỗi, giữ thứ tự bản gốc trước, bỏ trùng, bỏ rỗng. */
function hop(a = [], b = []) {
  const ra = [];
  const thay = new Set();
  for (const x of [...a, ...b]) {
    const s = typeof x === 'string' ? x.trim().toLowerCase() : '';
    if (!s || thay.has(s)) continue;
    thay.add(s);
    ra.push(s);
  }
  return ra;
}

/**
 * Đưa một gói luật (mặc định hoặc từ xa) về đúng hình dạng phẳng mà tầng 0 và
 * tầng 1 tiêu thụ. Làm ở đây một lần thay vì để mỗi luật tự đào vào JSON.
 */
function chuanHoaGoi(g = {}) {
  const cum = g.cum || {};
  return Object.freeze({
    phienBan: String(g.phienBan || '0000.00.00+0'),
    nguon: String(g.nguon || 'khong-ro'),
    capNhatLuc: g.capNhatLuc || null,

    maoDanh: Object.freeze(hop(g.maoDanh?.cum)),
    allowlistHauTo: Object.freeze(hop(g.allowlist?.hauToChinhThuc)),
    allowlistTenMien: Object.freeze(hop(g.allowlist?.tenMien)),
    thuongHieu: Object.freeze((g.thuongHieu?.muc || []).map((m) => Object.freeze({
      ten: String(m.ten || '').toLowerCase(),
      domains: Object.freeze(hop(m.domains)),
    })).filter((m) => m.ten && m.domains.length)),
    duoiMienRuiRo: Object.freeze(hop(g.duoiMienRuiRo?.duoi)),
    rutGon: Object.freeze(hop(g.rutGon?.tenMien)),
    khoAppChinhThuc: Object.freeze(hop(g.khoAppChinhThuc?.tenMien)),

    caiApp: Object.freeze(hop(cum.caiApp)),
    apLucThoiGian: Object.freeze(hop(cum.apLucThoiGian)),
    biMat: Object.freeze(hop(cum.biMat)),
    maXacThucYeuCau: Object.freeze(hop(cum.doiMaXacThuc?.veYeuCau)),
    maXacThucDoiTuong: Object.freeze(hop(cum.doiMaXacThuc?.veDoiTuong)),
    xungDanhToChuc: Object.freeze(hop(cum.xungDanhToChuc?.cum)),
    nguCanhSoTaiKhoan: Object.freeze(hop(cum.soTaiKhoan?.nguCanh)),

    dongHinh: Object.freeze({ ...(g.dongHinh?.bang || {}) }),
  });
}

/**
 * §4.2 — HỢP NHẤT CHỈ THÊM, KHÔNG BỚT.
 * Trả về gói mới; KHÔNG sửa gói cũ tại chỗ.
 */
function hopNhat(cu, moi) {
  const themVao = {};
  const gop = (ten, a, b) => {
    const ra = hop(a, b);
    const them = ra.filter((x) => !a.includes(x));
    if (them.length) themVao[ten] = them;
    return Object.freeze(ra);
  };

  // Thương hiệu hợp theo TÊN: cùng tên thì hợp danh sách domain (chỉ nới rộng).
  const theoTen = new Map(cu.thuongHieu.map((m) => [m.ten, [...m.domains]]));
  for (const m of moi.thuongHieu) {
    theoTen.set(m.ten, hop(theoTen.get(m.ten) || [], m.domains));
  }
  const thuongHieu = Object.freeze([...theoTen.entries()]
    .map(([ten, domains]) => Object.freeze({ ten, domains: Object.freeze(domains) })));

  return Object.freeze({
    phienBan: moi.phienBan,
    nguon: moi.nguon,
    capNhatLuc: moi.capNhatLuc,

    maoDanh: gop('maoDanh', cu.maoDanh, moi.maoDanh),
    // Hai danh sách DUY NHẤT được phép nới rộng theo hướng hạ cảnh giác.
    allowlistHauTo: gop('allowlistHauTo', cu.allowlistHauTo, moi.allowlistHauTo),
    allowlistTenMien: gop('allowlistTenMien', cu.allowlistTenMien, moi.allowlistTenMien),
    thuongHieu,
    duoiMienRuiRo: gop('duoiMienRuiRo', cu.duoiMienRuiRo, moi.duoiMienRuiRo),
    rutGon: gop('rutGon', cu.rutGon, moi.rutGon),
    khoAppChinhThuc: gop('khoAppChinhThuc', cu.khoAppChinhThuc, moi.khoAppChinhThuc),

    caiApp: gop('caiApp', cu.caiApp, moi.caiApp),
    apLucThoiGian: gop('apLucThoiGian', cu.apLucThoiGian, moi.apLucThoiGian),
    biMat: gop('biMat', cu.biMat, moi.biMat),
    maXacThucYeuCau: gop('maXacThucYeuCau', cu.maXacThucYeuCau, moi.maXacThucYeuCau),
    maXacThucDoiTuong: gop('maXacThucDoiTuong', cu.maXacThucDoiTuong, moi.maXacThucDoiTuong),
    xungDanhToChuc: gop('xungDanhToChuc', cu.xungDanhToChuc, moi.xungDanhToChuc),
    nguCanhSoTaiKhoan: gop('nguCanhSoTaiKhoan', cu.nguCanhSoTaiKhoan, moi.nguCanhSoTaiKhoan),

    dongHinh: Object.freeze({ ...cu.dongHinh, ...moi.dongHinh }),
    __themVao: Object.freeze(themVao),
  });
}

/** Bộ luật đang hiệu lực. Luôn trả về một gói hợp lệ, không bao giờ null. */
const boLuat = () => dangDung;

/**
 * Nhận một gói luật đã tải về.
 * @returns {{nhan:boolean, ly:string, phienBan:string, themVao?:object}}
 */
function capNhatTuXa(goiThoi) {
  if (!goiThoi || typeof goiThoi !== 'object') {
    return { nhan: false, ly: 'GOI_KHONG_HOP_LE', phienBan: dangDung.phienBan };
  }
  const moi = chuanHoaGoi(goiThoi);

  if (!/^\d{4}\.\d{2}\.\d{2}\+\d+$/.test(moi.phienBan)) {
    return { nhan: false, ly: 'PHIEN_BAN_SAI_DINH_DANG', phienBan: dangDung.phienBan };
  }
  if (soSanhPhienBan(moi.phienBan, dangDung.phienBan) <= 0) {
    return { nhan: false, ly: 'KHONG_MOI_HON', phienBan: dangDung.phienBan };
  }

  const truoc = dangDung;
  dangDung = hopNhat(truoc, moi);
  const ghi = {
    luc: new Date().toISOString(),
    tu: truoc.phienBan,
    den: dangDung.phienBan,
    nguon: dangDung.nguon,
    themVao: dangDung.__themVao,
  };
  nhatKy = [...nhatKy.slice(-19), ghi];
  return { nhan: true, ly: 'DA_HOP_NHAT', phienBan: dangDung.phienBan, themVao: ghi.themVao };
}

/**
 * `2026.09.04+1` vs `2026.09.04+10` — so chuỗi thuần sẽ ra sai vì "+1" < "+10"
 * theo từ điển chỉ đúng ngẫu nhiên. Tách phần số ra so bằng số.
 */
function soSanhPhienBan(a, b) {
  const tach = (s) => {
    const [ngay, lan] = String(s).split('+');
    return [ngay, Number(lan) || 0];
  };
  const [nA, lA] = tach(a);
  const [nB, lB] = tach(b);
  if (nA !== nB) return nA < nB ? -1 : 1;
  if (lA !== lB) return lA < lB ? -1 : 1;
  return 0;
}

/** Quay về bản đóng gói sẵn. Dùng trong test, và khi nghi bộ luật từ xa hỏng. */
function datLai() {
  dangDung = chuanHoaGoi(MAC_DINH);
  nhatKy = [];
  return dangDung;
}

/** Kiểm toán: đã nhận những gì, từ đâu, thêm cụm nào. */
const nhatKyHopNhat = () => [...nhatKy];

module.exports = {
  boLuat, capNhatTuXa, datLai, nhatKyHopNhat,
  chuanHoaGoi, hopNhat, soSanhPhienBan, MAC_DINH,
};
