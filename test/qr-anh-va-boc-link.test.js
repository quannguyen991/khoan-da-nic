'use strict';

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';

const { bocLinkRutGonAnToan } = require('../backend/src/link-expander');
const { analyze } = require('../backend/src/analysis/pipeline');
const { app } = require('../backend/server');

test('§6.8 — link-expander bóc được link rút gọn trỏ tới APK giả thương hiệu qua mock header-only', async () => {
  const kq = await bocLinkRutGonAnToan('Bác bấm https://bit.ly/vneid-demo để cập nhật', {
    lookupFn: async () => [{ address: '93.184.216.34' }],
    fetchFn: async (url) => {
      if (url.startsWith('https://bit.ly/')) {
        return {
          status: 302,
          headers: { get: (k) => (k.toLowerCase() === 'location' ? 'https://vneid-capnhat.top/app.apk' : null) },
          body: { cancel: async () => {} },
        };
      }
      return {
        status: 200,
        headers: { get: () => null },
        body: { cancel: async () => {} },
      };
    },
  });

  assert.deepStrictEqual(kq.urlMoRong, ['https://vneid-capnhat.top/app.apk']);
  assert.strictEqual(kq.chiTiet[0].biChan, null);

  const r = analyze({ vanBan: 'Bác bấm https://bit.ly/vneid-demo', urlMoRong: kq.urlMoRong });
  assert.ok(r.maLyDo.includes('WEB_BRAND_DOMAIN_MISMATCH'), `[${r.maLyDo}]`);
  assert.ok(r.maLyDo.includes('WEB_NONOFFICIAL_APP_SOURCE'), `[${r.maLyDo}]`);
  assert.strictEqual(r.nhan, 'NGHI_NGO');

  const rCao = analyze({ vanBan: 'Bác cài ứng dụng VNeID qua link https://bit.ly/vneid-demo tôi gửi để cập nhật', urlMoRong: kq.urlMoRong });
  assert.strictEqual(rCao.nhan, 'CAO');
});

test('§6.8 — link-expander chặn SSRF khi DNS trả về IP nội bộ hoặc hop chuyển hướng trỏ metadata', async () => {
  const kqDnsNoiBo = await bocLinkRutGonAnToan('https://bit.ly/noi-bo', {
    lookupFn: async () => [{ address: '127.0.0.1' }],
    fetchFn: async () => { throw new Error('Không được phép gọi mạng khi DNS nội bộ'); },
  });
  assert.deepStrictEqual(kqDnsNoiBo.urlMoRong, []);
  assert.strictEqual(kqDnsNoiBo.chiTiet[0].biChan, 'dns_tro_ve_ip_noi_bo');

  const kqMetadata = await bocLinkRutGonAnToan('https://tinyurl.com/meta', {
    lookupFn: async () => [{ address: '93.184.216.34' }],
    fetchFn: async () => ({
      status: 302,
      headers: { get: () => 'http://169.254.169.254/latest/meta-data/' },
      body: { cancel: async () => {} },
    }),
  });
  assert.deepStrictEqual(kqMetadata.urlMoRong, []);
  assert.strictEqual(kqMetadata.chiTiet[0].biChan, 'metadata_endpoint');
});

test('qrChuoi gửi kèm văn bản qua HTTP /api/analyze và /api/analyze/so-bo vẫn kích hoạt kiểm tra QR & URL', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    for (const duong of ['/api/analyze', '/api/analyze/so-bo']) {
      const res = await fetch(`http://127.0.0.1:${port}${duong}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vanBan: 'Bác xem giúp ảnh biên lai này nhé',
          qrChuoi: 'https://vietconbank-login.top/xacminh.apk',
        }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.nhan, 'NGHI_NGO');
      assert.ok(body.maLyDo.includes('WEB_BRAND_DOMAIN_MISMATCH'), `[${body.maLyDo}]`);
      assert.ok(body.maLyDo.includes('WEB_NONOFFICIAL_APP_SOURCE'), `[${body.maLyDo}]`);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('mở rộng thương hiệu Việt Nam: phát hiện giả mạo MoMo, eTax, EVN, ViettelPost, HDBank', () => {
  const cases = [
    { vanBan: 'Nhận quà từ MoMo tại https://momo-nhanthuong.top/nhan' },
    { vanBan: 'Hoàn thuế eTax tại https://etax-hoanthue.online/kiemtra' },
    { vanBan: 'EVN thông báo cắt điện, xem tại https://evn-thanhtoan.xyz/bill' },
    { vanBan: 'ViettelPost giao hàng thất bại, xác nhận tại https://viettelpost-giaohang.shop/don' },
    { vanBan: 'HDBank yêu cầu xác thực tại https://hdbank-baomat.site/login' },
    { vanBan: 'Xác thực TCB tại https://tcb-xacthuc.top/otp' },
    { vanBan: 'Đồng bộ BHXH tại https://bhxh-capnhat.online/ho-so' },
  ];
  for (const c of cases) {
    const r = analyze(c);
    assert.ok(r.maLyDo.includes('WEB_BRAND_DOMAIN_MISMATCH'), `Thiếu WEB_BRAND_DOMAIN_MISMATCH cho: ${c.vanBan} -> [${r.maLyDo}]`);
  }

  const rShort = analyze({ vanBan: 'Bác bấm vào https://t.ly/check-nhanh để nhận tiền' });
  assert.ok(rShort.maLyDo.includes('WEB_SHORTENER_REDIRECT'));

  const rExe = analyze({ vanBan: 'Tải file cấu hình tại https://vneid-capnhat.top/profile.mobileconfig' });
  assert.ok(rExe.maLyDo.includes('WEB_NONOFFICIAL_APP_SOURCE'));

  const rVssid = analyze({ vanBan: 'Cơ quan thông báo VssID của bác bị tạm dừng, cập nhật đồng bộ ngay tại https://vssid-capnhat.top' });
  assert.ok(rVssid.maLyDo.includes('ID_TAX_BENEFIT_IMPERSONATION'));

  const rShip = analyze({ vanBan: 'ViettelPost thông báo đơn hàng lưu kho sai địa chỉ, đóng phí nhận hoàn tiền tại https://viettelpost-donhang.shop' });
  assert.ok(rShip.maLyDo.includes('ID_DELIVERY_IMPERSONATION'));

  const rTask = analyze({ vanBan: 'Hệ thống báo sai thao tác bị đóng băng, bác cần nạp thêm tiền làm lại đơn mới rút được' });
  assert.ok(rTask.maLyDo.includes('OFF_TASK_PREPAY'));
});
