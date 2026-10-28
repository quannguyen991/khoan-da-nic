import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gopY = readFileSync(path.join(GOC, 'src/components/GopY.tsx'), 'utf8');
const chinhSach = readFileSync(path.join(GOC, 'public/chinh-sach-rieng-tu.html'), 'utf8');

/**
 * Góp ý KHÔNG được rời máy: màn này chỉ mở thư (mailto) hoặc sao chép. Nếu sau này
 * ai đó thêm fetch/api() vào đây, đó là một luồng dữ liệu mới — phải hỏi lại trước.
 */
test('góp ý không gọi mạng: GopY.tsx không có fetch() hay api()', () => {
  assert.ok(!/\bfetch\(/.test(gopY), 'GopY.tsx gọi fetch — góp ý sẽ rời máy');
  assert.ok(!/\bapi\(/.test(gopY), 'GopY.tsx gọi api() — góp ý sẽ rời máy');
});

test('địa chỉ nhận góp ý đã được công khai trong chính sách riêng tư', () => {
  const m = gopY.match(/EMAIL_GOP_Y = '([^']+)'/);
  assert.ok(m, 'thiếu hằng EMAIL_GOP_Y');
  assert.ok(chinhSach.includes(m[1]), 'địa chỉ góp ý không có trong chính sách riêng tư');
});
