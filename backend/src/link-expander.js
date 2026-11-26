'use strict';
/**
 * §6.8 — GIẢI MÃ LINK RÚT GỌN AN TOÀN (CHỈ HEADER, CHỐNG SSRF Ở MỖI HOP).
 *
 * Tách khỏi `link-shield.js` (hàm thuần không mạng) và `url-analyzer.js` (thuần đọc chuỗi).
 * Chỉ kích hoạt cho danh sách tên miền rút gọn cố định (`RUT_GON`), tối đa `SO_HOP_TOI_DA`
 * bước nhảy, kiểm tra `kiemUrl` + phân giải DNS chặn IP nội bộ ở MỖI hop, `redirect: 'manual'`
 * và không bao giờ tải/đọc body trang đích.
 */

const dns = require('node:dns').promises;
const { kiemUrl, laIpNoiBo, laIpv6NoiBo, SO_HOP_TOI_DA } = require('./link-shield');
const { trichUrlChiTiet, docHostname, layRegistrableDomain, RUT_GON } = require('./analysis/url-analyzer');

const SO_LINK_TOI_DA = 2;
const TIMEOUT_HOP_MS = 1500;

async function kiemDnsAnToan(hostname, lookupFn) {
  if (!hostname) return { ok: false, lyDo: 'khong_co_hostname' };
  if (laIpNoiBo(hostname) || laIpv6NoiBo(hostname)) {
    return { ok: false, lyDo: 'ip_noi_bo' };
  }
  try {
    const kq = await lookupFn(hostname, { all: true });
    const ds = Array.isArray(kq) ? kq : [kq];
    if (ds.length === 0) return { ok: false, lyDo: 'dns_rong' };
    for (const item of ds) {
      const ip = String(item?.address || '');
      if (!ip || laIpNoiBo(ip) || laIpv6NoiBo(ip)) {
        return { ok: false, lyDo: 'dns_tro_ve_ip_noi_bo' };
      }
    }
    return { ok: true, lyDo: null };
  } catch {
    return { ok: false, lyDo: 'dns_that_bai' };
  }
}

async function bocMotLink(urlBanDau, { fetchFn, lookupFn, timeoutMs }) {
  const urlChuan = /^[a-z][a-z0-9+.-]*:\/\//i.test(urlBanDau) ? urlBanDau : `https://${urlBanDau}`;
  let hienTai = urlChuan;
  const hopList = [hienTai];

  for (let hop = 0; hop < SO_HOP_TOI_DA; hop += 1) {
    const kUrl = kiemUrl(hienTai);
    if (!kUrl.choPhep) {
      return { goc: urlBanDau, dich: null, hopList, biChan: kUrl.lyDo };
    }
    const kDns = await kiemDnsAnToan(kUrl.hostname, lookupFn);
    if (!kDns.ok) {
      return { goc: urlBanDau, dich: null, hopList, biChan: kDns.lyDo };
    }

    let res;
    try {
      res = await fetchFn(hienTai, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res && (res.status === 405 || res.status === 501)) {
        await res.body?.cancel?.().catch(() => undefined);
        res = await fetchFn(hienTai, {
          method: 'GET',
          redirect: 'manual',
          headers: { Range: 'bytes=0-0' },
          signal: AbortSignal.timeout(timeoutMs),
        });
      }
    } catch {
      return { goc: urlBanDau, dich: hop > 0 ? hienTai : null, hopList, biChan: 'loi_ket_noi' };
    }

    await res?.body?.cancel?.().catch(() => undefined);
    const status = Number(res?.status || 0);
    const loc = res?.headers?.get ? res.headers.get('location') : res?.headers?.location;
    if (status >= 300 && status < 400 && loc) {
      let tiepTheo;
      try {
        tiepTheo = new URL(loc, hienTai).toString();
      } catch {
        return { goc: urlBanDau, dich: null, hopList, biChan: 'location_khong_hop_le' };
      }
      const kTiep = kiemUrl(tiepTheo);
      if (!kTiep.choPhep) {
        return { goc: urlBanDau, dich: null, hopList, biChan: kTiep.lyDo };
      }
      hopList.push(tiepTheo);
      hienTai = tiepTheo;
      continue;
    }

    return {
      goc: urlBanDau,
      dich: hop > 0 ? hienTai : null,
      hopList,
      biChan: null,
    };
  }

  return { goc: urlBanDau, dich: hienTai, hopList, biChan: 'qua_nhieu_hop' };
}

async function bocLinkRutGonAnToan(vanBan = '', opts = {}) {
  const { docDuoc } = trichUrlChiTiet(String(vanBan || ''));
  const ungVien = docDuoc.filter((u) => {
    const h = docHostname(u);
    return h && RUT_GON.has(layRegistrableDomain(h));
  }).slice(0, SO_LINK_TOI_DA);

  if (ungVien.length === 0) return { urlMoRong: [], chiTiet: [] };
  if (opts.khongGoiMang) return { urlMoRong: [], chiTiet: [] };

  const fetchFn = opts.fetchFn || globalThis.fetch;
  const lookupFn = opts.lookupFn || dns.lookup;
  const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : TIMEOUT_HOP_MS;
  if (typeof fetchFn !== 'function') return { urlMoRong: [], chiTiet: [] };

  const chiTiet = await Promise.all(
    ungVien.map((u) => bocMotLink(u, { fetchFn, lookupFn, timeoutMs })),
  );
  const urlMoRong = [...new Set(chiTiet.map((c) => c.dich).filter(Boolean))];
  return { urlMoRong, chiTiet };
}

module.exports = { bocLinkRutGonAnToan, bocMotLink, kiemDnsAnToan, SO_LINK_TOI_DA };
