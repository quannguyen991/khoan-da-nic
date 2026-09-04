'use strict';
/**
 * DIỄN TẬP — gửi một tin nhắn lừa đảo GIẢ LẬP để luyện phản xạ, và đo mức độ
 * cảnh giác theo thời gian.
 *
 * ══════════════ BỐN RÀNG BUỘC ĐẠO ĐỨC — VI PHẠM LÀ HỎNG SẢN PHẨM ══════════════
 *
 * 1. PHẢI ĐƯỢC BÁO TRƯỚC VÀ ĐÃ ĐỒNG Ý. Không có phiếu đồng ý thì `phatBai()`
 *    TỪ CHỐI, không phải "gửi rồi xin lỗi sau". Tắt được bất cứ lúc nào, và tắt
 *    là tắt ngay lượt kế — không có kỳ hạn, không có "chỉ còn một bài nữa".
 *
 * 2. TUYỆT ĐỐI KHÔNG DÙNG NỘI DUNG GÂY HOẢNG SỢ. Không tin giả về tai nạn, bệnh
 *    tật, người thân gặp nạn, bị bắt giữ. Hàng rào là `test/dien-tap.test.js`,
 *    quét CHÍNH thư viện kịch bản — không phải kiểm bằng mắt.
 *
 *    ⚠️ ĐÂY LÀ CHỖ NGƯỢC ĐỜI NHẤT CỦA CẢ TÍNH NĂNG, VÀ NÓ CÓ CHỦ Ý: những kịch
 *    bản NGUY HIỂM NHẤT ngoài đời (giả danh công an doạ bắt, báo con cấp cứu)
 *    lại là những kịch bản KHÔNG ĐƯỢC PHÉP diễn tập. Một bài tập gây hoảng sợ
 *    thật cho một người 70 tuổi có thể gây hại thật — huyết áp, tim mạch — và
 *    không con số nào trong hồ sơ dự thi đáng đổi lấy điều đó.
 *
 * 3. MẮC BẪY THÌ KHÔNG CHÊ TRÁCH. Không có chữ "sai", "thất bại", "bị lừa",
 *    "đáng lẽ". Giọng bắt buộc: "Đây là bài diễn tập. Tin thật cũng trông y như
 *    vậy. Dấu hiệu nhận biết là…" rồi KHEN vì đã tham gia. §11 cấm trách móc
 *    người dùng, và ở đây nó còn phản tác dụng: người xấu hổ sẽ giấu lần sau.
 *
 * 4. KHÔNG BAO GIỜ ĐÒI NHẬP GÌ THẬT. Trang diễn tập KHÔNG có ô nhập liệu nào.
 *    Có hàng rào riêng: `trangGiaiThich` chỉ được mang mã trang, và test kiểm
 *    rằng không kịch bản nào khai `oNhap`.
 *
 * HÀM THUẦN + MỘT KHO. Không mạng, không đồng hồ ẩn — `bayGio` truyền vào.
 */

/** Họ kịch bản được phép diễn tập. Danh sách này CỐ Ý NGẮN. */
const HO_KICH_BAN = Object.freeze([
  'phat_nguoi', 'khoa_tai_khoan_ngan_hang', 'trung_thuong', 'hoan_thue', 'giao_hang',
]);

/**
 * Họ BỊ CẤM diễn tập — dù chúng có thật và nguy hiểm ngoài đời.
 * Đừng thêm cái nào vào `HO_KICH_BAN` mà chưa đọc ràng buộc 2 ở trên.
 */
const HO_BI_CAM = Object.freeze([
  'gia_danh_cong_an', 'nguoi_than_gap_nan', 'cap_cuu', 'benh_tat', 'bi_bat_giu',
  'toa_an', 'tong_tien', 'ngoai_tinh',
]);

/**
 * THƯ VIỆN KỊCH BẢN. `doKho` 1 → 3: bắt đầu dễ, tinh vi dần khi bác đã quen.
 *
 * ⚠️ `noiDung` LÀ TIN GIẢ LẬP, và nó phải trông THẬT thì bài tập mới có nghĩa.
 * Nhưng nó KHÔNG được doạ. Đọc lại ràng buộc 2 trước khi thêm kịch bản.
 *
 * ⚠️ `link` LÀ ĐƯỜNG DẪN NỘI BỘ CỦA CHÍNH APP, không phải tên miền ngoài.
 * Nếu đăng ký một tên miền thật để làm "mồi" thì (a) tên miền đó sẽ bị chính bộ
 * luật của mình chấm là rủi ro, (b) một ngày nào đó nó hết hạn và rơi vào tay
 * người khác — lúc đó ta đang dạy bác bấm vào một tên miền của kẻ lạ.
 */
const KICH_BAN = Object.freeze([
  {
    ma: 'DT-01', ho: 'giao_hang', doKho: 1,
    noiDung: 'Đơn hàng của bác đang chờ giao. Bác xác nhận địa chỉ tại {link} để shipper gọi lại nhé.',
    link: '/dien-tap/DT-01',
    dauHieu: ['nguoi_gui_la', 'co_link_la', 'khong_noi_ro_don_nao'],
    goiYNoiChuyen: 'Nhà mình thống nhất: đơn hàng nào cũng mở trong app mua hàng, không bấm link trong tin nhắn.',
  },
  {
    ma: 'DT-02', ho: 'trung_thuong', doKho: 1,
    noiDung: 'Chúc mừng bác là khách hàng may mắn tuần này! Bác nhận quà tại {link} trước Chủ nhật ạ.',
    link: '/dien-tap/DT-02',
    dauHieu: ['qua_tang_bat_ngo', 'ep_thoi_gian', 'co_link_la'],
    goiYNoiChuyen: 'Con nói với bố mẹ: không ai tự nhiên tặng quà cho người lạ. Có quà thật thì họ gọi điện, không bắt bấm link.',
  },
  {
    ma: 'DT-03', ho: 'phat_nguoi', doKho: 2,
    noiDung: 'Thông báo: xe của bác có thông tin vi phạm chưa xử lý. Bác tra cứu tại {link}.',
    link: '/dien-tap/DT-03',
    dauHieu: ['mao_danh_co_quan', 'link_khong_phai_gov_vn', 'nguoi_gui_la'],
    goiYNoiChuyen: 'Bố mẹ nhớ: tra phạt nguội chỉ ở csgt.vn. Link nào khác, kể cả trông giống, cũng gọi cho con trước.',
  },
  {
    ma: 'DT-04', ho: 'hoan_thue', doKho: 2,
    noiDung: 'Bác có một khoản hoàn thuế chưa nhận. Bác kiểm tra thông tin tại {link} ạ.',
    link: '/dien-tap/DT-04',
    dauHieu: ['mao_danh_co_quan', 'tien_bat_ngo', 'co_link_la'],
    goiYNoiChuyen: 'Cơ quan thuế không nhắn tin bảo bấm link. Có gì bố mẹ hỏi con, hoặc ra chi cục thuế hỏi trực tiếp.',
  },
  {
    ma: 'DT-05', ho: 'khoa_tai_khoan_ngan_hang', doKho: 3,
    noiDung: 'Ngân hàng thông báo: tài khoản của bác cần cập nhật thông tin trước ngày mai. Bác cập nhật tại {link}.',
    link: '/dien-tap/DT-05',
    dauHieu: ['mao_danh_ngan_hang', 'ep_thoi_gian', 'link_khong_phai_trang_ngan_hang'],
    goiYNoiChuyen: 'Ngân hàng không bao giờ nhắn link để cập nhật tài khoản. Bố mẹ cứ gọi số in trên thẻ là chắc nhất.',
  },
  {
    ma: 'DT-06', ho: 'khoa_tai_khoan_ngan_hang', doKho: 3,
    noiDung: 'Bác ơi bên em là nhân viên hỗ trợ, bác vào {link} để em kiểm tra giúp bác giao dịch hôm qua nhé.',
    link: '/dien-tap/DT-06',
    dauHieu: ['xung_danh_nhan_vien', 'nguoi_gui_la', 'co_link_la'],
    goiYNoiChuyen: 'Ai xưng nhân viên ngân hàng gọi tới, bố mẹ cứ cúp máy rồi gọi lại tổng đài. Người thật không phiền đâu.',
  },
]);

const BANG_KICH_BAN = new Map(KICH_BAN.map((k) => [k.ma, k]));

/** Hành vi ghi được sau mỗi bài. Thứ tự KHÔNG có nghĩa là thứ hạng. */
const HANH_VI = Object.freeze([
  'da_gui', 'da_mo', 'da_bam_link', 'da_goi_nguoi_than', 'da_bao_la_lua_dao', 'khong_phan_ung',
]);

/** Tần suất mặc định: 1 bài / 2 tuần. Người thân chỉnh được. */
const CHU_KY_MAC_DINH_NGAY = 14;
const CHU_KY_TOI_THIEU_NGAY = 7;

class LoiDienTap extends Error {
  constructor(ma) { super(ma); this.name = 'LoiDienTap'; this.ma = ma; }
}

/**
 * ⚠️ PHIẾU ĐỒNG Ý LÀ CỔNG CỨNG, KHÔNG PHẢI TUỲ CHỌN.
 * Không có nó thì không có bài diễn tập nào rời khỏi hàm này.
 */
function kiemDongY(phieu) {
  if (!phieu || phieu.dongYDienTap !== true) return { duoc: false, ly: 'chua_dong_y_dien_tap' };
  if (phieu.daTat === true) return { duoc: false, ly: 'nguoi_dung_da_tat' };
  if (!phieu.baoTruocLuc) return { duoc: false, ly: 'chua_bao_truoc' };
  return { duoc: true, ly: null };
}

function taoKhoDienTap() {
  const luot = new Map();
  return {
    them(l) { luot.set(l.id, l); return l; },
    lay: (id) => luot.get(id) || null,
    tatCa: () => [...luot.values()],
    cuaNguoi: (nguoiId) => [...luot.values()].filter((l) => l.nguoiId === nguoiId),
    capNhat(id, vaLai) {
      const l = luot.get(id);
      if (!l) return null;
      const moi = { ...l, ...vaLai };
      luot.set(id, moi);
      return moi;
    },
    xoaHet: () => luot.clear(),
  };
}

/**
 * Chọn kịch bản kế tiếp: bắt đầu từ dễ, chỉ tăng độ khó khi bác đã có ít nhất
 * hai lượt xử lý ĐÚNG ở bậc hiện tại (gọi người thân, hoặc báo là lừa đảo).
 *
 * ⚠️ KHÔNG TĂNG ĐỘ KHÓ SAU MỘT LƯỢT MẮC BẪY. Đẩy độ khó lên sau khi người ta
 * vừa vấp là dạy họ rằng cố gắng cũng vô ích.
 */
function chonKichBan(lichSu = []) {
  const daDung = new Set(lichSu.map((l) => l.kichBanMa));
  let bac = 1;
  for (const b of [1, 2]) {
    const oBac = lichSu.filter((l) => (BANG_KICH_BAN.get(l.kichBanMa)?.doKho ?? 1) === b);
    const dung = oBac.filter((l) => l.daGoiNguoiThan || l.daBaoLaLuaDao).length;
    if (oBac.length > 0 && dung >= 2) bac = b + 1;
  }
  const ungVien = KICH_BAN.filter((k) => k.doKho <= bac && !daDung.has(k.ma));
  const chon = (ungVien.length ? ungVien : KICH_BAN.filter((k) => k.doKho <= bac))
    .sort((a, b) => b.doKho - a.doKho || a.ma.localeCompare(b.ma))[0];
  return chon || KICH_BAN[0];
}

/** Đã tới kỳ chưa. Không có lượt nào ⇒ tới kỳ ngay. */
function toiKy(lichSu = [], bayGio = Date.now(), chuKyNgay = CHU_KY_MAC_DINH_NGAY) {
  if (lichSu.length === 0) return true;
  const ganNhat = Math.max(...lichSu.map((l) => l.guiLuc || 0));
  return bayGio - ganNhat >= chuKyNgay * 86_400_000;
}

let demLuot = 0;

/**
 * PHÁT MỘT BÀI DIỄN TẬP.
 * @returns {{phat:boolean, ly?:string, luot?:object, tin?:object}}
 */
function phatBai({ nguoiId, phieuDongY, kho, bayGio = Date.now(), chuKyNgay, kichBanMa = null }) {
  const cong = kiemDongY(phieuDongY);
  if (!cong.duoc) return { phat: false, ly: cong.ly };

  const chuKy = Math.max(Number(chuKyNgay) || CHU_KY_MAC_DINH_NGAY, CHU_KY_TOI_THIEU_NGAY);
  const lichSu = kho.cuaNguoi(nguoiId);
  if (!kichBanMa && !toiKy(lichSu, bayGio, chuKy)) return { phat: false, ly: 'chua_toi_ky' };

  const kb = kichBanMa ? BANG_KICH_BAN.get(kichBanMa) : chonKichBan(lichSu);
  if (!kb) throw new LoiDienTap('KICH_BAN_KHONG_TON_TAI');
  if (HO_BI_CAM.includes(kb.ho)) throw new LoiDienTap('HO_KICH_BAN_BI_CAM');

  demLuot += 1;
  const luot = kho.them({
    id: `dt_${bayGio.toString(36)}_${demLuot.toString(36)}`,
    nguoiId,
    kichBanMa: kb.ma,
    ho: kb.ho,
    doKho: kb.doKho,
    guiLuc: bayGio,
    daMo: false, moLuc: null,
    daBamLink: false, bamLinkLuc: null,
    daGoiNguoiThan: false, goiLuc: null,
    daBaoLaLuaDao: false, baoLuc: null,
  });

  return {
    phat: true,
    luot,
    tin: {
      laDienTap: true,                 // KHÔNG BAO GIỜ bỏ cờ này khỏi payload
      kichBanMa: kb.ma,
      noiDung: kb.noiDung.replace('{link}', kb.link),
      link: kb.link,
    },
  };
}

/** Ghi hành vi. Mỗi hành vi ghi kèm mốc thời gian để tính "bao lâu sau khi nhận". */
function ghiHanhVi(kho, luotId, hanhVi, luc = Date.now()) {
  if (!HANH_VI.includes(hanhVi)) throw new LoiDienTap(`HANH_VI_LA:${hanhVi}`);
  const map = {
    da_mo: { daMo: true, moLuc: luc },
    da_bam_link: { daBamLink: true, bamLinkLuc: luc },
    da_goi_nguoi_than: { daGoiNguoiThan: true, goiLuc: luc },
    da_bao_la_lua_dao: { daBaoLaLuaDao: true, baoLuc: luc },
    khong_phan_ung: {},
    da_gui: {},
  };
  return kho.capNhat(luotId, map[hanhVi]);
}

/** Bao lâu sau khi nhận thì bác phản ứng (ms), null nếu chưa phản ứng gì. */
function doTrePhanUng(l) {
  const moc = [l.moLuc, l.bamLinkLuc, l.goiLuc, l.baoLuc].filter((x) => typeof x === 'number');
  return moc.length ? Math.min(...moc) - l.guiLuc : null;
}

/**
 * ═══════════════ CHỈ SỐ CẢNH GIÁC ═══════════════
 *
 * Thang 0–100. Trọng số CỐ Ý lệch về phía "gọi cho người thân":
 *
 *   gọi người thân     +100   ← HÀNH VI ĐÚNG NHẤT, cần khuyến khích nhất
 *   báo là lừa đảo      +85   ← nhận ra, nhưng tự xử lý một mình
 *   mở, không bấm gì    +55   ← thận trọng, chưa chủ động
 *   không phản ứng      +45   ← có thể là cảnh giác, có thể là chưa thấy tin
 *   có bấm link          +5   ← mắc bẫy
 *
 * ⚠️ VÌ SAO "GỌI NGƯỜI THÂN" ĐƯỢC ĐIỂM CAO HƠN "TỰ NHẬN RA":
 * cả sản phẩm dựa trên một ý — người cao tuổi KHÔNG PHẢI MỘT MÌNH. Kẻ lừa đảo
 * luôn tìm cách cô lập nạn nhân (xem `MAN_ISOLATION`, `MAN_SECRECY`), nên thói
 * quen gọi cho con cháu là hàng rào bền hơn mọi khả năng nhận diện cá nhân. Đo
 * cái gì thì được cái đó, nên ta đo đúng thứ muốn nuôi.
 *
 * ⚠️ "KHÔNG PHẢN ỨNG" KHÔNG ĐƯỢC CHẤM CAO. Nó mơ hồ — có thể bác cảnh giác bỏ
 * qua, cũng có thể bác chưa nhìn thấy tin. §4.3 đúng ở đây như mọi chỗ khác:
 * không biết KHÁC đã kiểm và thấy ổn. Nên nó nằm dưới "mở mà không bấm".
 *
 * ⚠️ CÓ BẤM LINK KHÔNG PHẢI 0 ĐIỂM. Bác vẫn tham gia bài tập, và bài tập vẫn có
 * tác dụng. Cho 0 là nói "lượt này của bác vô giá trị" — đúng thứ ràng buộc 3
 * cấm.
 */
const DIEM_HANH_VI = Object.freeze({
  goi_nguoi_than: 100, bao_la_lua_dao: 85, mo_khong_bam: 55, khong_phan_ung: 45, bam_link: 5,
});

function hanhViChinh(l) {
  if (l.daGoiNguoiThan) return 'goi_nguoi_than';
  if (l.daBaoLaLuaDao) return 'bao_la_lua_dao';
  if (l.daBamLink) return 'bam_link';
  if (l.daMo) return 'mo_khong_bam';
  return 'khong_phan_ung';
}

/**
 * ⚠️ BẤM LINK ĐÈ LÊN VIỆC ĐÃ MỞ, NHƯNG *KHÔNG* ĐÈ LÊN VIỆC ĐÃ GỌI NGƯỜI THÂN.
 * Bác bấm link rồi thấy ngờ ngợ và gọi cho con — đó là một kết cục TỐT, và là
 * đúng thứ ta muốn dạy. Chấm nó như một lượt mắc bẫy là dạy sai.
 */
function chiSoCanhGiac(danhSach = []) {
  if (danhSach.length === 0) return null;
  const tong = danhSach.reduce((t, l) => t + DIEM_HANH_VI[hanhViChinh(l)], 0);
  return Math.round(tong / danhSach.length);
}

/** Chuỗi xu hướng theo tuần — dữ liệu cho biểu đồ, không phải kết luận. */
function xuHuong(danhSach = [], { soTuan = 12, den = Date.now() } = {}) {
  const TUAN = 7 * 86_400_000;
  const ra = [];
  for (let i = soTuan - 1; i >= 0; i -= 1) {
    const tu = den - (i + 1) * TUAN;
    const toi = den - i * TUAN;
    const trong = danhSach.filter((l) => l.guiLuc >= tu && l.guiLuc < toi);
    ra.push({
      tuTuan: tu,
      denTuan: toi,
      soBai: trong.length,
      // `null` là câu trả lời trung thực cho một tuần không có bài nào. Điền 0
      // vào đó là vẽ một cú tụt không có thật lên biểu đồ.
      chiSo: chiSoCanhGiac(trong),
    });
  }
  return ra;
}

/**
 * MÀN SAU BÀI TẬP. KHÔNG CHÊ TRÁCH, và không có ô nhập nào.
 * §HĐ luật 2 — trả MÃ, frontend tra bảng ra câu.
 */
function manGiaiThich(luotOrMa) {
  const ma = typeof luotOrMa === 'string' ? luotOrMa : luotOrMa?.kichBanMa;
  const kb = BANG_KICH_BAN.get(ma);
  if (!kb) throw new LoiDienTap('KICH_BAN_KHONG_TON_TAI');
  return {
    laDienTap: true,
    kichBanMa: kb.ma,
    ho: kb.ho,
    /*
     * Ba mã câu, theo đúng thứ tự bắt buộc của ràng buộc 3:
     *   1. nói rõ đây là diễn tập
     *   2. GỠ TỘI: "tin thật cũng trông y như vậy"
     *   3. chỉ dấu hiệu nhận biết
     * rồi mới tới lời khen. Khen trước khi gỡ tội thì nghe như an ủi.
     */
    maCau: ['day_la_bai_dien_tap', 'tin_that_cung_trong_y_nhu_vay', 'dau_hieu_nhan_biet'],
    dauHieu: kb.dauHieu,
    maKhen: 'cam_on_bac_da_tham_gia',
    // KHÔNG có ô nhập liệu nào. Đây là hằng số, không phải tuỳ chọn.
    coONhap: false,
  };
}

/** Báo cáo cho người thân sau mỗi bài: kết quả + một câu để nói chuyện. */
function baoCaoChoNguoiThan(luot) {
  const kb = BANG_KICH_BAN.get(luot.kichBanMa);
  return {
    kichBanMa: luot.kichBanMa,
    ho: luot.ho,
    doKho: luot.doKho,
    guiLuc: luot.guiLuc,
    hanhVi: hanhViChinh(luot),
    doTrePhanUngMs: doTrePhanUng(luot),
    diemLuot: DIEM_HANH_VI[hanhViChinh(luot)],
    goiYNoiChuyen: kb?.goiYNoiChuyen || null,
    /*
     * ⚠️ §11 — KHÔNG CÓ TRƯỜNG NÀO KIỂU `datHay` / `truot`.
     * Báo cáo cho con cháu mà chấm "bố mẹ trượt" là biến bài tập thành bài thi,
     * và biến người thân thành giám khảo. Chỉ có hành vi và một câu để nói.
     */
  };
}

module.exports = {
  KICH_BAN, HO_KICH_BAN, HO_BI_CAM, HANH_VI, DIEM_HANH_VI,
  CHU_KY_MAC_DINH_NGAY, CHU_KY_TOI_THIEU_NGAY, LoiDienTap,
  taoKhoDienTap, kiemDongY, chonKichBan, toiKy, phatBai, ghiHanhVi,
  chiSoCanhGiac, hanhViChinh, doTrePhanUng, xuHuong, manGiaiThich, baoCaoChoNguoiThan,
};
