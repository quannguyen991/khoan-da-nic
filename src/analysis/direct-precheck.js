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

const { segmentsForScope } = require('./context-builder');
const { layPack } = require('./locale-pack-registry');
const { laTinHieu } = require('./signal-registry');

/**
 * Phủ định ở cấp CỤM — hàng rào thứ hai sau speech act.
 * "Bác cứ bình tĩnh, không cần gấp đâu." — cụm `gấp` bị `không cần` phủ định.
 *
 * ⚠️ "chuyển tiền ngay không sẽ bị bắt giữ" KHÔNG phải phủ định: ở đây `không`
 * nghĩa là "nếu không". Nên bỏ qua khi giữa chúng có `sẽ` hoặc dấu phẩy.
 */
const PHU_DINH = /(không|đừng|chẳng|chớ|never|do not|cannot)\s*(cần|phải|nên|được|bao giờ)?\s*$/;

function laPhuDinh(text, viTri) {
  const truoc = text.slice(Math.max(0, viTri - 16), viTri);
  const m = PHU_DINH.exec(truoc);
  if (!m) return false;
  // Chỉ xét đoạn GIỮA từ phủ định và cụm. Dấu phẩy đứng TRƯỚC từ phủ định là
  // chuyện khác: "Bác cứ bình tĩnh, không cần gấp đâu." vẫn là phủ định thật.
  const giua = truoc.slice(m.index);
  return !/[,;]|\bsẽ\b|\bthì\b/.test(giua);
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
        const doanList = segmentsForScope(ctx, mau.scope);

        let batDuoc = null;
        for (const doan of doanList) {
          if (biTatVoDieuKien(pack, signalId, doan.folded)) continue;

          // Khớp trên bản chuẩn hoá trước; nếu trượt thì thử các biến thể OCR.
          const ungVien = [doan.normalized, ...doan.ocrVariants];
          for (const chuoi of ungVien) {
            const m = re.exec(chuoi);
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
