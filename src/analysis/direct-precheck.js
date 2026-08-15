'use strict';
/**
 * §2B.2 bước 4 — MẪU DETERMINISTIC. CHẠY ĐƯỢC KHI MẤT AI.
 *
 * §6.1 bước 2: bắt critical phrase TRƯỚC khi gọi model.
 * §6.4: direct detector có `source=direct`, `confidence=1.0`,
 *       KHÔNG đi qua ngưỡng LLM.
 *
 * Hàm thuần. Không mạng, không AI.
 */

const { segmentsForScope, boDau } = require('./context-builder');
const { layPack } = require('./locale-pack-registry');
const { laTinHieu } = require('./signal-registry');

/**
 * Phủ định ở cấp CỤM — hàng rào thứ hai sau speech act.
 * "Bác cứ bình tĩnh, không cần gấp đâu." — cụm `gấp` bị `không cần` phủ định.
 *
 * ⚠️ "chuyển tiền ngay không sẽ bị bắt giữ" KHÔNG phải phủ định: ở đây `không`
 * nghĩa là "nếu không". Nên bỏ qua khi giữa chúng có `sẽ` hoặc dấu phẩy.
 */
/**
 * ⚠️ VIẾT KHÔNG DẤU và so trên bản đã bỏ dấu.
 *
 * Từ khi cue bank chạy được trên tiếng Việt không dấu, hàng rào phủ định cũng
 * phải chạy trên đó — nếu không thì "khong can gap" không được nhận là phủ định
 * và MAN_URGENCY bật oan. Đúng lỗi đối xứng với chuyện cue bank có dấu.
 *
 * Hệ quả tốt: không dấu là ASCII nên `\b` hoạt động đúng.
 */
const PHU_DINH = /(khong|dung|chang|cho|never|do not|cannot)\s*(can|phai|nen|duoc|bao gio)?\s*$/;
const KHONG_PHAI_PHU_DINH = /[,;]|\bse\b|\bthi\b/;

function laPhuDinh(text, viTri) {
  const truoc = boDau(text.slice(Math.max(0, viTri - 16), viTri));
  const m = PHU_DINH.exec(truoc);
  if (!m) return false;
  // Chỉ xét đoạn GIỮA từ phủ định và cụm. Dấu phẩy đứng TRƯỚC từ phủ định là
  // chuyện khác: "Bác cứ bình tĩnh, không cần gấp đâu." vẫn là phủ định thật.
  return !KHONG_PHAI_PHU_DINH.test(truoc.slice(m.index));
}

/** C.5 — danh sách tắt vô điều kiện, so trên bản KHÔNG DẤU. */
function biTatVoDieuKien(pack, signalId, folded) {
  const cum = pack.suppressors?.[signalId];
  if (!cum) return false;
  return cum.some((c) => folded.includes(c));
}

/** C.4 — hai cơ chế tắt CÓ ĐIỀU KIỆN. Khác hẳn danh sách trên. */
function biTatCoDieuKien(pack, signalId, opts) {
  if (opts.verifiedChannel && pack.verifiedChannelSuppressed?.includes(signalId)) return true;
  if (opts.verifiedRelationship && pack.verifiedRelationshipSuppressed?.includes(signalId)) return true;
  return false;
}

/**
 * @param {object} ctx   kết quả buildContext()
 * @param {object} opts  { verifiedChannel, verifiedRelationship }
 * @returns {Array} tín hiệu direct, đã dedup theo canonical SIGNAL_ID
 */
function directPrecheck(ctx, opts = {}) {
  const ra = new Map();

  for (const tenPack of ctx.activePacks) {
    const pack = layPack(tenPack);
    if (!pack) continue;

    for (const [signalId, mauList] of Object.entries(pack.directPatterns)) {
      if (!laTinHieu(signalId)) continue;                 // tín hiệu lạ: bỏ qua
      if (ra.has(signalId)) continue;                      // dedup: đã bắt rồi
      if (biTatCoDieuKien(pack, signalId, opts)) continue;

      for (const mau of mauList) {
        const re = new RegExp(mau.pattern, 'i');
        /**
         * ⚠️ TIẾNG VIỆT KHÔNG DẤU LÀ CA THẬT, KHÔNG PHẢI CA HIẾM.
         *
         * SMS lừa đảo ở Việt Nam rất hay viết không dấu. Cue bank có dấu nên
         * chúng trượt sạch: đo được câu "Bac chuyen het tien sang tai khoan an
         * toan cua Bo Cong an ngay" chỉ 7 điểm, trong khi bản có dấu được 61.
         *
         * `boDau()` chỉ gỡ dấu tổ hợp và đổi đ→d — mọi ký tự cú pháp regex đều
         * là ASCII nên không bị đụng tới. Bỏ dấu CẢ MẪU LẪN VĂN BẢN rồi so.
         */
        const mauKhongDau = boDau(mau.pattern);
        const reKhongDau = mauKhongDau === mau.pattern ? null : new RegExp(mauKhongDau, 'i');
        const doanList = segmentsForScope(ctx, mau.scope);

        let batDuoc = null;
        for (const doan of doanList) {
          if (biTatVoDieuKien(pack, signalId, doan.folded)) continue;

          // Khớp trên bản chuẩn hoá trước; nếu trượt thì thử các biến thể OCR.
          const ungVien = [
            { chuoi: doan.normalized, re },
            ...(reKhongDau ? [{ chuoi: doan.folded, re: reKhongDau }] : []),
            ...doan.ocrVariants.map((c) => ({ chuoi: c, re: reKhongDau || re })),
          ];
          for (const { chuoi, re: reDung } of ungVien) {
            const m = reDung.exec(chuoi);
            if (!m) continue;
            if (laPhuDinh(chuoi, m.index)) continue;
            batDuoc = {
              quote: m[0],
              start: m.index,
              end: m.index + m[0].length,
              sourceId: ctx.sourceId,
              segmentIndex: doan.index,
            };
            break;
          }
          if (batDuoc) break;
        }

        if (batDuoc) {
          ra.set(signalId, {
            id: signalId,
            state: 'present',
            source: 'direct',
            confidence: 1.0,        // direct KHÔNG đi qua ngưỡng LLM (§6.4)
            evidence: [batDuoc],
          });
          break;
        }
      }
    }
  }

  return [...ra.values()];
}

module.exports = { directPrecheck, laPhuDinh };
