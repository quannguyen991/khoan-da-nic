#!/usr/bin/env node
'use strict';
/**
 * TẠO KHOÁ KÝ BẢN PHÁT HÀNH — chạy MỘT LẦN trong đời app.
 *
 *   node scripts/tao-khoa-phat-hanh.js
 *
 * Sinh ra hai tệp, cả hai đều bị .gitignore chặn:
 *   android/khoan-da-phat-hanh.jks   — khoá
 *   android/keystore.properties       — mật khẩu (ngẫu nhiên, KHÔNG in ra màn hình)
 *
 * ⚠️ SAO LƯU CẢ HAI TỆP RA CHỖ RIÊNG (USB, Drive cá nhân). Chợ ứng dụng nhận bản
 * cập nhật chỉ khi nó được ký bằng ĐÚNG khoá đã ký bản đầu. Mất khoá = app trên
 * chợ đứng im mãi mãi, muốn sửa phải đăng một app mới với tên gói khác.
 *
 * ⚠️ KHÔNG BAO GIỜ GHI ĐÈ. Đã có khoá thì script dừng — ghi đè khoá đang dùng là
 * đúng cách làm mất khoá nói ở trên.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ANDROID = path.join(__dirname, '..', 'android');
const KHOA = path.join(ANDROID, 'khoan-da-phat-hanh.jks');
const THUOC_TINH = path.join(ANDROID, 'keystore.properties');
const BI_DANH = 'khoan-da';

if (fs.existsSync(KHOA) || fs.existsSync(THUOC_TINH)) {
  console.error('Đã có khoá phát hành — không tạo lại, không ghi đè.');
  console.error(`  ${KHOA}\n  ${THUOC_TINH}`);
  process.exit(1);
}

// Chặn khỏi git TRƯỚC khi có bí mật nào nằm trên đĩa.
for (const tep of [KHOA, THUOC_TINH]) {
  const r = spawnSync('git', ['check-ignore', '-q', tep], { cwd: path.join(__dirname, '..') });
  if (r.status !== 0) {
    console.error(`Tệp này KHÔNG bị .gitignore chặn — dừng: ${tep}`);
    process.exit(1);
  }
}

const matKhau = crypto.randomBytes(32).toString('base64url');

const kq = spawnSync('keytool', [
  '-genkeypair', '-noprompt',
  '-keystore', KHOA, '-storetype', 'PKCS12',
  '-alias', BI_DANH, '-keyalg', 'RSA', '-keysize', '4096',
  '-validity', '10000',
  // Không ghi tên thật của ai vào khoá: chứng chỉ này đi kèm mọi bản APK công khai.
  '-dname', 'CN=Khoan Da, C=VN',
  // `:env` — mật khẩu đi qua biến môi trường, không nằm trên dòng lệnh.
  '-storepass:env', 'KHOAN_DA_MAT_KHAU_KHOA',
  '-keypass:env', 'KHOAN_DA_MAT_KHAU_KHOA',
], { env: { ...process.env, KHOAN_DA_MAT_KHAU_KHOA: matKhau }, encoding: 'utf8' });

if (kq.status !== 0) {
  console.error('keytool lỗi:', kq.stderr || kq.error);
  process.exit(1);
}

fs.writeFileSync(THUOC_TINH, [
  '# Mật khẩu khoá phát hành Khoan Đã — KHÔNG commit, KHÔNG gửi qua chat.',
  '# Sao lưu tệp này CÙNG với khoan-da-phat-hanh.jks.',
  'storeFile=khoan-da-phat-hanh.jks',
  `storePassword=${matKhau}`,
  `keyAlias=${BI_DANH}`,
  `keyPassword=${matKhau}`,
  '',
].join('\n'), { mode: 0o600 });

console.log('Đã tạo khoá phát hành (mật khẩu không in ra):');
console.log(`  ${KHOA}\n  ${THUOC_TINH}`);
console.log('→ Sao lưu CẢ HAI tệp ra chỗ riêng ngay bây giờ.');
