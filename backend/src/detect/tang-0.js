'use strict';
/**
 * TẦNG 0 — LUẬT CỤC BỘ. Ngân sách < 50ms. Chạy OFFLINE HOÀN TOÀN.
 *
 * ════════════════════ NGUYÊN TẮC BẤT DI BẤT DỊCH ════════════════════
 * TẦNG 0 ĐƯỢC PHÉP PHÁT CẢNH BÁO MỘT MÌNH. Không bao giờ chờ mạng, không bao
 * giờ chờ mô hình rồi mới báo. Tầng 1 và tầng 2 chỉ tinh chỉnh — và chỉ được
 * tinh chỉnh theo hướng TĂNG.
 *
 * ════════════════════ QUAN HỆ VỚI BỘ LUẬT DUY NHẤT ════════════════════
 * ⚠️ ĐỌC KỸ: TỆP NÀY KHÔNG PHẢI BỘ LUẬT THỨ HAI.
 *
 * §4.2 nói `decision-engine.js` là bộ luật DUY NHẤT tính điểm và ra mức. Repo
 * này đã trả giá một lần vì bộ luật bị nhân bản (xem `bo-luat-khong-duoc-lech.test.js`:
 * recall tiếng Việt của bản đang ship tụt từ 75,3% xuống 32,9% mà không số đo
 * nào phát hiện ra). Nên mỗi luật R1–R10 ở đây làm ĐÚNG HAI việc:
 *
 *   1. BẬT TÍN HIỆU canonical (`SIGNAL_IDS` của Phụ lục A) — rồi để
 *      `decision-engine.decide()` chấm điểm và ra nhãn. Điểm số, ngưỡng 20/45,
 *      cap 69 KHÔNG được nhắc tới ở đây, một lần nào.
 *
 *   2. KHAI MỘT SÀN (`san`) — mức TỐI THIỂU mà luật đó đòi.
 *      Sàn CHỈ ĐƯỢC NÂNG, không bao giờ hạ. Đây đúng cơ chế `unreadableInputFloor()`
 *      đã dùng trong `pipeline.js`, và đúng câu §4.2: "Mọi thứ thông minh thêm
 *      vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm."
 *
 * Vì sao cần sàn chứ không chỉ dựa vào điểm: một tin "phạt nguội" trỏ tới
 * `csgt-tracuu.top` chỉ bật được `ID_AUTHORITY_IMPERSONATION` (10 điểm) — không
 * có tín hiệu WEB nào cho "link ngoài allowlist" trong Phụ lục A, vì phụ lục
 * được viết cho luồng người dùng DÁN nội dung, không cho luồng thông báo đến.
 * 10 điểm ra "chưa thấy dấu hiệu rủi ro" cho đúng cái tin nhắn nguy hiểm nhất
 * đang lưu hành ở Việt Nam. Sàn là chỗ vá, và nó vá theo hướng an toàn.
 *
 * ════════════════════ HÀM THUẦN ════════════════════
 * Không mạng, không DB, không LLM, không đồng hồ hệ thống.
 */

const { timCum, timMoiCum } = require('./chuan-hoa');
const { laTinHieu } = require('../analysis/signal-registry');
const { boDau } = require('../analysis/context-builder');
const { laPhuDinh } = require('../analysis/direct-precheck');

/** Ba mức, xếp theo độ cảnh giác tăng dần. Dùng để lấy MAX, không bao giờ MIN. */
const THU_TU_NHAN = Object.freeze(['CHUA_THAY', 'NGHI_NGO', 'CAO']);
const nangNhan = (a, b) => (THU_TU_NHAN.indexOf(b) > THU_TU_NHAN.indexOf(a) ? b : a);

/**
 * Đầu số di động Việt Nam sau quy hoạch 2018. Brandname (VIETCOMBANK, CSGT) và
 * đầu số dịch vụ KHÔNG khớp mẫu này — đó chính là điều LUẬT R9 dựa vào.
 */
const RE_SO_DI_DONG = /^(?:\+?84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])\d{7}$/;

const laSoDiDong = (nguoiGui = '') => RE_SO_DI_DONG.test(String(nguoiGui).replace(/[\s.-]/g, ''));

/** Người gửi là brandname chữ (VIETCOMBANK, VNPT) — không phải số. */
const laBrandname = (nguoiGui = '') => /[a-zA-Z]/.test(String(nguoiGui)) && !/^\+?\d/.test(String(nguoiGui).trim());

/**
 * ══════════════════════════ BẢNG LUẬT R1 – R10 ══════════════════════════
 *
 * Mỗi luật: `khop(bối cảnh)` trả về `null` hoặc `{ bangChung, tinHieu?, san? }`.
 * `san` mặc định lấy từ `sanMacDinh` của luật; luật nào cần nâng sàn theo ngữ
 * cảnh thì trả `san` riêng.
 */
const LUAT = Object.freeze([
  {
    ma: 'R1',
    ten: 'Mạo danh cơ quan + link ngoài danh sách chính thức',
    sanMacDinh: 'CAO',
    /**
     * LUẬT QUAN TRỌNG NHẤT, độ chính xác gần như tuyệt đối.
     * Lý do nó mạnh: một tin nhắn CSGT thật không bao giờ trỏ tới tên miền
     * ngoài gov.vn. Không có ngoại lệ hợp pháp nào cho vế này.
     */
    khop({ ban, tang1, luat }) {
      const cum = timCum(ban, luat.maoDanh);
      if (!cum) return null;
      const ngoai = tang1.urls.filter((u) => !u.trongAllowlist);
      if (ngoai.length === 0) return null;
      return {
        bangChung: { cum, tenMien: ngoai.map((u) => u.reg) },
        tinHieu: ['ID_AUTHORITY_IMPERSONATION',
          ...(ngoai.some((u) => u.lechThuongHieu) ? ['WEB_BRAND_DOMAIN_MISMATCH'] : [])],
      };
    },
  },

  {
    ma: 'R2',
    ten: 'Link tải APK / mời cài ứng dụng ngoài cửa hàng',
    sanMacDinh: 'CAO',
    /**
     * KHÔNG CÓ NGOẠI LỆ. Đây là chiêu chiếm quyền điều khiển điện thoại đang
     * phổ biến nhất: cài xong là kẻ gian đọc được màn hình, đọc được OTP, và
     * chuyển tiền bằng chính app ngân hàng của bác.
     *
     * Tín hiệu `DEV_INSTALL_APK_UNKNOWN` làm nổ critical override CO-02, nên ca
     * này còn đi thẳng lên `PROTECTED_CRITICAL` chứ không chỉ là nhãn CAO.
     */
    khop({ ban, tang1, luat }) {
      const apk = tang1.urls.filter((u) => u.laApk && !u.laKhoChinhThuc);
      const moiCai = timCum(ban, luat.caiApp);
      const coLinkNgoaiKho = tang1.urls.some((u) => !u.laKhoChinhThuc);
      if (apk.length === 0 && !(moiCai && coLinkNgoaiKho)) return null;
      return {
        bangChung: {
          apk: apk.map((u) => u.url),
          cum: moiCai || null,
        },
        tinHieu: ['DEV_INSTALL_APK_UNKNOWN', 'WEB_NONOFFICIAL_APP_SOURCE'],
      };
    },
  },

  {
    ma: 'R3',
    ten: 'Link rút gọn đi kèm mạo danh cơ quan',
    sanMacDinh: 'CAO',
    /** Cơ quan nhà nước không dùng link rút gọn. Không một cơ quan nào. */
    khop({ ban, tang1, luat }) {
      const rutGon = tang1.urls.filter((u) => u.laRutGon);
      if (rutGon.length === 0) return null;
      const cum = timCum(ban, luat.maoDanh);
      if (!cum) return null;
      return {
        bangChung: { cum, tenMien: rutGon.map((u) => u.reg) },
        tinHieu: ['WEB_SHORTENER_REDIRECT', 'ID_AUTHORITY_IMPERSONATION'],
      };
    },
  },

  {
    ma: 'R4',
    ten: 'Tên miền nhái tổ chức thật',
    sanMacDinh: 'CAO',
    /**
     * Hai đường vào: lệch thương hiệu (tên hãng trong hostname mà eTLD+1 không
     * phải của hãng) và nhái theo khoảng cách chỉnh sửa ≤ 2.
     */
    khop({ tang1 }) {
      const nhai = tang1.urls.filter((u) => u.lechThuongHieu || u.nhaiGan);
      if (nhai.length === 0) return null;
      return {
        bangChung: {
          tenMien: nhai.map((u) => u.reg),
          giong: nhai.map((u) => u.nhaiGan?.giong || u.lechThuongHieu).filter(Boolean),
        },
        tinHieu: ['WEB_BRAND_DOMAIN_MISMATCH'],
      };
    },
  },

  {
    ma: 'R5',
    ten: 'Đuôi tên miền rủi ro',
    sanMacDinh: 'NGHI_NGO',
    /** Nâng lên CAO khi đi kèm từ khoá mạo danh — R1 thường đã bắt, đây là lưới hai. */
    khop({ ban, tang1, luat }) {
      const ruiRo = tang1.urls.filter((u) => u.duoiRuiRo || u.laPunycode || u.laIp);
      if (ruiRo.length === 0) return null;
      const cum = timCum(ban, luat.maoDanh);
      return {
        bangChung: { tenMien: ruiRo.map((u) => u.reg), cum: cum || null },
        tinHieu: ruiRo.some((u) => u.laPunycode || u.laIp) ? ['WEB_PUNYCODE_IP_LITERAL'] : [],
        san: cum ? 'CAO' : 'NGHI_NGO',
      };
    },
  },

  {
    ma: 'R6',
    ten: 'Bộ ba tiền bạc: số tài khoản + số tiền + ép thời gian',
    sanMacDinh: 'CAO',
    /**
     * ⚠️ SỐ TÀI KHOẢN PHẢI CÓ NGỮ CẢNH TÀI KHOẢN ĐỨNG GẦN (xem `tang-1.js`).
     * Một dãy 10 chữ số trần trụi trong tin nhắn thật thường là mã đơn hàng hay
     * mã vận đơn. Nhận bừa là báo đỏ oan cho mọi thông báo giao hàng — và §4.6
     * nói thẳng: báo động giả làm người dùng gỡ ứng dụng.
     */
    khop({ ban, tang1, luat }) {
      if (tang1.soTaiKhoan.length === 0) return null;
      if (tang1.soTien.length === 0) return null;
      const cum = timCum(ban, luat.apLucThoiGian);
      if (!cum) return null;
      return {
        bangChung: { soTaiKhoan: tang1.soTaiKhoan, soTien: tang1.soTien, cum },
        tinHieu: ['FIN_TRANSFER_REQUEST', 'MAN_URGENCY'],
      };
    },
  },

  {
    ma: 'R7',
    ten: 'Yêu cầu giữ bí mật',
    sanMacDinh: 'NGHI_NGO',
    /**
     * ⚠️ SAI KHÁC CÓ CHỦ Ý SO VỚI BẢN ĐẶC TẢ — GHI LẠI Ở ĐÂY ĐỂ KHÔNG AI "SỬA".
     *
     * Đặc tả viết R7 → CAO không điều kiện, với lý do đúng: xui giấu người nhà
     * là dấu hiệu đặc trưng nhất của lừa đảo giả danh công an.
     *
     * Nhưng cùng bản đặc tả đó đặt một cổng CỨNG: precision của nhãn CAO ≥ 0,98
     * trên tập tin nhắn bình thường, kèm câu "thà gắn NGHI_NGO nhiều còn hơn
     * gắn CAO sai một lần". Hai yêu cầu này đụng nhau ở đúng một chỗ: câu
     * "mẹ giữ bí mật hộ con nhé, con định làm bất ngờ cho bố" — bí mật thật,
     * lừa đảo thì không.
     *
     * Bộ luật của repo đã đo và chốt đúng hình dạng này rồi. Ba tổ hợp cộng
     * hưởng có `MAN_SECRECY` (`secrecy+fear+transfer`, `secrecy+isolation+transfer`)
     * ĐỀU đòi thêm một vế "yêu cầu hành động", kèm ghi chú nguyên văn trong
     * `decision-engine.js`: "Sức ép đơn thuần — doạ, giữ máy, xui giấu người
     * nhà — KHÔNG tự nó nâng mức. Đó là chỗ phân biệt tin nhắn lừa đảo với một
     * người thật đang lo lắng."
     *
     * Nên: bí mật ĐƠN ĐỘC → NGHI_NGO. Bí mật + một vế hành động (tiền, mã,
     * thiết bị, link) → CAO. Tín hiệu `MAN_SECRECY` vẫn bật trong CẢ HAI ca,
     * nên bộ luật duy nhất vẫn nhận đủ dữ kiện để tự cộng hưởng.
     */
    khop({ ban, tang1, luat, tinHieuGoc }) {
      const cum = timCum(ban, luat.biMat);
      if (!cum) return null;
      /*
       * "Vế hành động" gồm cả tín hiệu canonical mà `directPrecheck` bắt được —
       * "chuyển hết tiền sang tài khoản an toàn" không có CON SỐ nào nhưng là
       * yêu cầu chuyển tiền rõ ràng nhất trong cả bộ mẫu. Nhìn con số thôi thì
       * bỏ sót đúng kịch bản giả danh công an kinh điển.
       */
      const coTinHieuHanhDong = (tinHieuGoc || [])
        .some((id) => /^(FIN_|CRED_|DEV_)/.test(id));
      const coHanhDong = coTinHieuHanhDong
        || tang1.soTaiKhoan.length > 0
        || tang1.soTien.length > 0
        || tang1.urls.length > 0
        || Boolean(timCum(ban, luat.maXacThucDoiTuong))
        || Boolean(timCum(ban, luat.caiApp));
      return {
        bangChung: { cum },
        tinHieu: ['MAN_SECRECY'],
        san: coHanhDong ? 'CAO' : 'NGHI_NGO',
      };
    },
  },

  {
    ma: 'R8',
    ten: 'Hỏi mã OTP / mật khẩu / số thẻ',
    sanMacDinh: 'CAO',
    /**
     * ⚠️ CHỖ DỄ BÁO OAN NHẤT TRONG CẢ BỘ LUẬT, và nó báo oan vào đúng tin nhắn
     * phổ biến nhất mà người cao tuổi nhận: SMS OTP THẬT của ngân hàng.
     *
     *   "Ma OTP cua quy khach la 482913. Khong chia se ma nay cho bat ky ai."
     *
     * Tin này CHỨA "mã OTP". Bắt theo từ khoá là mọi giao dịch ngân hàng thật
     * đều nổ đỏ, và sau ba lần như thế thì bác tắt app.
     *
     * ⚠️ CÁCH VÁ ĐÚNG LÀ ĐÒI THÊM VẾ YÊU CẦU, KHÔNG PHẢI THÊM CỤM TẮT.
     * §12 cấm thêm bất kỳ cụm nào hạ mức vô điều kiện — nếu ta tắt luật khi thấy
     * "không chia sẻ mã này cho bất kỳ ai" thì kẻ lừa đảo chỉ cần chép đúng câu
     * đó vào tin của chúng là tắt được bộ phát hiện. Đúng bài học "please hold"
     * và "ch play" đã ghi trong §12.
     *
     * Nên điều kiện là NGỮ PHÁP chứ không phải từ điển: phải có một VẾ YÊU CẦU
     * (đọc / gửi / cung cấp / nhập / cho tôi) đứng gần một VẾ ĐỐI TƯỢNG (mã OTP
     * / mật khẩu / số thẻ). Tin nhắn OTP thật chỉ có vế đối tượng.
     */
    khop({ ban, luat }) {
      const doiTuong = timMoiCum(ban, luat.maXacThucDoiTuong);
      if (doiTuong.length === 0) return null;

      // Khoảng cách: vế yêu cầu phải nằm trong 40 ký tự quanh vế đối tượng.
      const viTri = (cum) => {
        const i = ban.khongDau.indexOf(boDau(cum));
        return i >= 0 ? i : ban.thap.indexOf(cum);
      };
      for (const dt of doiTuong) {
        const iDt = viTri(dt);
        if (iDt < 0) continue;
        for (const yc of luat.maXacThucYeuCau) {
          const iYc = viTri(yc);
          if (iYc < 0) continue;
          /**
           * ⚠️ HÀNG RÀO PHỦ ĐỊNH — VÀ NÓ CỨU ĐÚNG TIN NHẮN DẠY NGƯỜI TA CẢNH GIÁC.
           *
           * ĐO ĐƯỢC 4/9/2026: cảnh báo chống lừa đảo của chính Agribank —
           *   "Agribank canh bao: khong cung cap ma OTP, mat khau cho bat ky ai."
           * → có vế yêu cầu ("cung cấp") đứng ngay cạnh vế đối tượng ("mã OTP"),
           * nên R8 nổ CAO vào một tin hoàn toàn lành. Ngân hàng nào cũng gửi tin
           * dạng này, nên đây không phải ca hiếm mà là ca HÀNG THÁNG.
           *
           * Đây là NGỮ PHÁP, không phải danh sách tắt: `laPhuDinh` của
           * `direct-precheck.js` xét chuỗi ngay trước vị trí khớp, và nó đã được
           * hiệu chỉnh kỹ (khối ghi chú "chớ vs cho" trong tệp đó). Dùng lại một
           * bản, không viết bản thứ hai — hai hàng rào phủ định lệch nhau là
           * cách chắc chắn nhất để một trong hai bị bỏ quên.
           *
           * ⚠️ KHÔNG PHẢI CỬA SAU CỦA §12. §12 cấm thêm CỤM TỪ hạ mức vô điều
           * kiện ("please hold", "ch play"). Hàng rào này không nhận cụm nào từ
           * bộ luật cập nhật được từ xa — nó chỉ đọc cấu trúc câu, nên kẻ lừa
           * đảo không thể chép một câu thần chú vào tin để tắt nó.
           */
          if (laPhuDinh(ban.khongDau, iYc)) continue;
          if (Math.abs(iYc - iDt) <= 40) {
            const laThe = /thẻ|cvv|card/.test(dt);
            const laMatKhau = /mật khẩu|pin|password/.test(dt);
            return {
              bangChung: { yeuCau: yc, doiTuong: dt },
              tinHieu: [laThe ? 'CRED_CARD_SECRET' : laMatKhau ? 'CRED_PASSWORD_PIN' : 'CRED_OTP_SHARE'],
            };
          }
        }
      }
      return null;
    },
  },

  {
    ma: 'R9',
    ten: 'Người gửi là số di động thường nhưng xưng danh tổ chức',
    sanMacDinh: 'NGHI_NGO',
    /**
     * Ngân hàng và cơ quan nhà nước gửi SMS qua brandname (VIETCOMBANK, CSGT),
     * không gửi từ một số 09x. Một số di động tự xưng là ngân hàng là mâu thuẫn
     * ngay trong siêu dữ liệu — nhìn thấy được mà không cần đọc nội dung.
     *
     * Đặt NGHI_NGO chứ không CAO: người thật cũng nói "anh ở bên bảo hiểm gọi
     * cho chị" và đôi khi đúng là nhân viên thật gọi từ máy riêng.
     */
    khop({ ban, luat, tin }) {
      if (!laSoDiDong(tin.nguoiGui)) return null;
      const cum = timCum(ban, luat.xungDanhToChuc) || timCum(ban, luat.maoDanh);
      if (!cum) return null;
      return { bangChung: { nguoiGui: che(tin.nguoiGui), cum }, tinHieu: [] };
    },
  },

  {
    ma: 'R10',
    ten: 'Có link mà người gửi lạ',
    sanMacDinh: 'NGHI_NGO',
    /**
     * LƯỚI AN TOÀN CUỐI CÙNG — đúng yêu cầu "tin nhắn đến có link là phải cảnh
     * báo". Đặt ở NGHI_NGO chứ không CAO để không làm nhiễu: mã giảm giá, thông
     * báo giao hàng, tin của trường học đều có link và đều vô hại.
     *
     * ⚠️ "LẠ" NGHĨA LÀ KHÔNG NẰM TRONG DANH BẠ TIN CẬY MÀ TẦNG GỌI TRUYỀN VÀO,
     * KHÔNG PHẢI "chưa từng nhắn tin". Không có danh bạ ⇒ coi là lạ. Mặc định
     * nghiêng về phía cảnh giác, vì §4.3: không biết ≠ đã kiểm và thấy ổn.
     */
    khop({ tang1, tin, quen }) {
      if (tang1.urls.length === 0) return null;
      if (quen) return null;
      return {
        bangChung: { tenMien: tang1.urls.map((u) => u.reg), nguoiGui: che(tin.nguoiGui) },
        tinHieu: [],
      };
    },
  },
]);

/**
 * §6.9 — số điện thoại người gửi KHÔNG được ghi nguyên vào bằng chứng, vì bằng
 * chứng đi vào nhật ký cảnh báo và có thể đi lên máy chủ ở tầng 2.
 */
function che(s = '') {
  const t = String(s);
  if (t.length <= 4) return t;
  return `${t.slice(0, 3)}${'*'.repeat(Math.max(0, t.length - 5))}${t.slice(-2)}`;
}

/**
 * Chạy toàn bộ tầng 0.
 *
 * @param {object} boiCanh { ban, tang1, luat, tin, quen }
 * @returns {{ khop: Array, san: string, tinHieu: string[] }}
 */
function chayTang0(boiCanh) {
  const khop = [];
  const tinHieu = new Set();
  let san = 'CHUA_THAY';

  for (const l of LUAT) {
    let kq = null;
    try {
      kq = l.khop(boiCanh);
    } catch {
      /*
       * ⚠️ MỘT LUẬT NỔ KHÔNG ĐƯỢC LÀM CHẾT CẢ TẦNG 0.
       * Tầng 0 là thứ DUY NHẤT chạy được khi mất mạng và mất AI. Nếu một luật
       * mới có lỗi và ném ngoại lệ, chín luật còn lại vẫn phải phát hiện được.
       * Nuốt ngoại lệ ở đây là nuốt theo hướng an toàn: luật hỏng thì coi như
       * không khớp, chứ không phải coi như đã kiểm và thấy sạch.
       */
      kq = null;
    }
    if (!kq) continue;

    const sanLuat = kq.san || l.sanMacDinh;
    san = nangNhan(san, sanLuat);
    for (const id of kq.tinHieu || []) if (laTinHieu(id)) tinHieu.add(id);

    khop.push({ ma: l.ma, ten: l.ten, san: sanLuat, bangChung: kq.bangChung });
  }

  return { khop, san, tinHieu: [...tinHieu] };
}

module.exports = {
  chayTang0, LUAT, THU_TU_NHAN, nangNhan, laSoDiDong, laBrandname, che,
};
