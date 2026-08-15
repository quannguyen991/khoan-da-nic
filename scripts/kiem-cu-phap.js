'use strict';
/**
 * KIỂM CÚ PHÁP MỌI TỆP JS CỦA REPO NÀY.
 *
 * ⚠️ VÌ SAO KHÔNG LIỆT KÊ TAY NỮA. `npm run check` cũ mã cứng bốn đường dẫn:
 * server.js, public/app.js, public/services.js, public/sw.js. Ba đường sau biến
 * mất khi giao diện dọn sang dự án Vite bên cạnh và `public/app/` thành thư mục
 * BẢN DỰNG (đã gitignore). Từ đó `npm run check` thoát mã 1 ở tệp thứ hai —
 * tức nó KHÔNG hề kiểm server.js lẫn src/, mà chỉ báo lỗi module không tồn tại.
 *
 * Một cổng kiểm tra luôn đỏ vì lý do vô can thì chẳng ai đọc nữa, và đó là lúc
 * nó thôi bảo vệ được thứ gì. Nên duyệt cây thay vì liệt kê tay: thêm tệp mới
 * không phải nhớ sửa chỗ này.
 *
 * KHÔNG kiểm giao diện — nó nằm ở dự án khác và có `npm run lint` riêng
 * (`tsc --noEmit`). Kiểm bản dựng của người khác là kiểm nhầm thứ.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const GOC = path.join(__dirname, '..');
const CAY = ['server.js', 'src', 'scripts', 'eval/lib'];
const BO_QUA = new Set(['node_modules', 'public', '.git', 'eval/results']);

function duyet(duong) {
  const that = path.join(GOC, duong);
  if (!fs.existsSync(that)) return [];
  if (fs.statSync(that).isFile()) return that.endsWith('.js') ? [that] : [];
  return fs.readdirSync(that).flatMap((ten) => (
    BO_QUA.has(ten) ? [] : duyet(path.join(duong, ten))
  ));
}

const tep = CAY.flatMap(duyet);
const hong = [];

for (const t of tep) {
  try {
    execFileSync(process.execPath, ['--check', t], { stdio: 'pipe' });
  } catch (e) {
    hong.push(`${path.relative(GOC, t)}\n${e.stderr?.toString().trim() || e.message}`);
  }
}

if (hong.length) {
  console.error(`\n✖ ${hong.length}/${tep.length} tệp sai cú pháp:\n\n${hong.join('\n\n')}\n`);
  process.exit(1);
}
console.log(`✔ ${tep.length} tệp JS đúng cú pháp`);
