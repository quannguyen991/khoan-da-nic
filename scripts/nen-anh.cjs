'use strict';
/**
 * §7.4 — NÉN ẢNH SANG `.webp` TRƯỚC KHI COMMIT.
 *
 * Bản `.png` gốc từ cổng nặng ~500KB–1,4MB mỗi ảnh và đã bị `.gitignore` chặn
 * (`public/assets/3d/*.png`). Chỉ `.webp` được commit.
 *
 * Giữ **kênh alpha** — nền ứng dụng là dải tím loang, ảnh nền trắng sẽ lòi hộp.
 *
 * Dùng:
 *   npm run nen-anh            # nén mọi .png còn sót trong public/assets/3d
 *   npm run nen-anh -- --kiem  # chỉ kiểm kê, không ghi gì
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const { DANH_MUC } = require('./danh-muc-anh.cjs');

const THU_MUC = path.join(__dirname, '..', 'public', 'assets', '3d');
const CHAT_LUONG = 82;
const KHO_MAC_DINH = 256;

/**
 * Nén một tệp. Kẹp theo **cạnh dài**, không phóng to ảnh nhỏ hơn đích.
 * @returns {Promise<{byteVao:number, byteRa:number, rong:number, cao:number}>}
 */
async function nenMot(duongVao, duongRa, khoRong = KHO_MAC_DINH) {
  const byteVao = fs.statSync(duongVao).size;
  const anh = sharp(duongVao).resize({
    width: khoRong,
    height: khoRong,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const { data, info } = await anh
    .webp({ quality: CHAT_LUONG, alphaQuality: 100, effort: 6 })
    .toBuffer({ resolveWithObject: true });
  fs.writeFileSync(duongRa, data);
  return { byteVao, byteRa: data.length, rong: info.width, cao: info.height };
}

async function main() {
  const chiKiem = process.argv.includes('--kiem');
  if (!fs.existsSync(THU_MUC)) {
    console.log('Chưa có public/assets/3d — chạy `npm run tao-anh` trước.');
    return;
  }

  const khoRongTheoId = Object.fromEntries(DANH_MUC.map((m) => [m.id, m.khoRong]));
  const png = fs.readdirSync(THU_MUC).filter((f) => f.endsWith('.png'));
  const webp = fs.readdirSync(THU_MUC).filter((f) => f.endsWith('.webp'));

  if (chiKiem) {
    const tong = webp.reduce((s, f) => s + fs.statSync(path.join(THU_MUC, f)).size, 0);
    console.log(`${webp.length} .webp (${(tong / 1024).toFixed(0)}KB tổng) · ${png.length} .png chưa nén`);
    const thieu = DANH_MUC.filter((m) => !webp.includes(`${m.id}.webp`));
    if (thieu.length) console.log('Thiếu: ' + thieu.map((m) => m.id).join(', '));
    return;
  }

  if (!png.length) { console.log('Không có .png nào cần nén.'); return; }

  for (const f of png) {
    const id = f.replace(/\.png$/, '');
    const kq = await nenMot(
      path.join(THU_MUC, f),
      path.join(THU_MUC, `${id}.webp`),
      khoRongTheoId[id] || KHO_MAC_DINH,
    );
    console.log(`✓ ${id.padEnd(20)} ${(kq.byteVao / 1024).toFixed(0)}KB → ${(kq.byteRa / 1024).toFixed(0)}KB  ${kq.rong}×${kq.cao}`);
  }
}

if (require.main === module) main();

module.exports = { nenMot };
