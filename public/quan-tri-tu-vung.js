/* Trang duyệt từ vựng — chỉ cho người quản trị. Mã duyệt chỉ nằm trong sessionStorage của tab này. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var LOI = {
    KHONG_GOI_DUOC: 'Mã duyệt sai, hoặc máy chủ chưa đặt KHOAN_DA_REVIEW_TOKEN.',
    TIN_HIEU_KHONG_DUOC_PHEP: 'Loại tín hiệu này không được phép.',
    THIEU_NGUON: 'Thiếu tên nguồn hoặc đường dẫn https.',
    CUM_DO_DAI_KHONG_HOP_LE: 'Cụm phải dài 8–60 ký tự.',
    CUM_CO_KY_TU_LA: 'Cụm có ký tự lạ.',
    CUM_CHI_MOT_TU: 'Cụm phải có ít nhất 2 từ.',
    CUM_GIONG_CANH_BAO_HOAC_PHU_DINH: 'Cụm có từ phủ định hoặc giọng cảnh báo (không, đừng, cảnh báo…). Bị chặn để không hạ mức.',
    CUM_NAM_TRONG_TIN_LANH: 'Cụm nằm trong một tin lành của bộ mẫu, nạp vào sẽ gây báo nhầm.',
    CUM_KHONG_NAM_TRONG_TRICH_DAN: 'Cụm không nằm nguyên văn trong đoạn trích.',
    THIEU_TRICH_DAN: 'Thiếu đoạn trích.',
    TRANG_THAI_KHONG_DUYET_DUOC: 'Cụm này không ở trạng thái duyệt được.',
    TRANG_THAI_KHONG_DOI_DUOC: 'Không đổi được trạng thái này.',
    KHONG_THAY_UNG_VIEN: 'Không thấy cụm này.',
    DA_DAY: 'Đã đủ số mẫu tối đa. Hãy gỡ bớt.',
    KHONG_GOI_AI: 'Máy chủ đang tắt AI.',
    LOI_MAY_CHU: 'Lỗi máy chủ.'
  };
  var tin = function (s, loi) { var e = $('thongBao'); e.textContent = s; e.style.color = loi ? 'var(--do)' : 'var(--xanh)'; };
  var mem = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } return null; };
  var token = function () { return $('token').value.trim(); };

  function goi(duong, phuongThuc, than) {
    return fetch(duong, {
      method: phuongThuc || 'GET',
      headers: { 'content-type': 'application/json', 'x-khoan-da-review-token': token() },
      body: than ? JSON.stringify(than) : undefined
    }).then(function (r) { return r.json().catch(function () { return { ok: false, maLoi: 'LOI_MAY_CHU' }; }); });
  }
  var cauLoi = function (d) { return (LOI[d.maLoi] || d.maLoi || 'Lỗi') + (d.chiTiet ? ' (' + d.chiTiet + ')' : ''); };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function nut(chu, cls, lam) { var b = el('button', cls, chu); b.type = 'button'; b.addEventListener('click', lam); return b; }

  function hanhDong(u, loai) {
    return function () {
      tin('Đang xử lý…');
      goi('/api/admin/tu-vung/' + u.id + '/' + loai, 'POST').then(function (d) {
        if (!d.ok) return tin(cauLoi(d), true);
        tin('Xong.'); tai();
      });
    };
  }

  function the(u) {
    var d = el('div', 'the');
    d.appendChild(el('div', 'cum', '“' + u.cum + '”'));
    var nhan = el('div', 'tt');
    nhan.appendChild(el('span', 'nhan', u.tinHieu));
    nhan.appendChild(el('span', 'nhan ' + (u.ai && u.ai.daChay ? (u.ai.quyetDinh === 'nen_xem' ? 'ok' : 'canh') : 'canh'),
      u.ai && u.ai.daChay ? 'AI: ' + (u.ai.quyetDinh === 'nen_xem' ? 'nên xem' : 'bỏ') : 'Chưa qua AI'));
    nhan.appendChild(el('span', 'nhan', u.tu === 'thu_thap' ? 'từ quét báo' : 'nhập tay'));
    d.appendChild(nhan);
    if (u.ai && u.ai.lyDo) d.appendChild(el('p', 'tt', 'Lý do của AI: ' + u.ai.lyDo));
    if (u.ai && u.ai.loi) d.appendChild(el('p', 'tt', 'AI chưa trả lời được (' + u.ai.loi + ').'));
    if (u.trichBao) d.appendChild(el('p', 'tt', 'Trích: ' + u.trichBao));
    var p = el('p', 'tt', 'Nguồn: ');
    var a = el('a', null, u.nguon.ten); a.href = u.nguon.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; p.appendChild(a);
    d.appendChild(p);
    var h = el('div', 'hang');
    if (u.trangThai === 'cho_duyet' || u.trangThai === 'cho_ai') {
      h.appendChild(nut('Nạp vào bộ luật', 'chinh', hanhDong(u, 'duyet')));
      h.appendChild(nut('Từ chối', 'nguy', hanhDong(u, 'tu-choi')));
      if (u.trangThai === 'cho_ai') h.appendChild(nut('Cho AI xem lại', '', hanhDong(u, 'ai')));
    } else if (u.trangThai === 'da_nap') {
      h.appendChild(nut('Gỡ', 'nguy', hanhDong(u, 'go')));
    } else if (u.trangThai === 'ai_loai') {
      h.appendChild(nut('Vẫn từ chối hẳn', 'nguy', hanhDong(u, 'tu-choi')));
    }
    if (h.children.length) d.appendChild(h);
    return d;
  }

  function ve(id, ds, rong) {
    var c = $(id); c.textContent = '';
    if (!ds.length) c.appendChild(el('p', 'phu', rong));
    ds.forEach(function (u) { c.appendChild(the(u)); });
  }

  function tai() {
    mem('token', token());
    goi('/api/admin/tu-vung').then(function (d) {
      if (!d.ok) return tin(cauLoi(d), true);
      var theo = function (t) { return d.ungVien.filter(function (u) { return t.indexOf(u.trangThai) >= 0; }); };
      var a = theo(['cho_duyet']), b = theo(['cho_ai']), c = theo(['da_nap']);
      ve('choDuyet', a, 'Chưa có cụm nào chờ.'); ve('choAi', b, 'Không có.'); ve('daNap', c, 'Chưa nạp cụm nào.');
      ve('daLoai', theo(['ai_loai', 'tu_choi', 'tu_dong_loai', 'da_go']), 'Trống.');
      $('dem1').textContent = '(' + a.length + ')'; $('dem2').textContent = '(' + b.length + ')'; $('dem3').textContent = '(' + c.length + ')';
      var s = $('fTinHieu');
      if (!s.options.length) d.tinHieuChoPhep.forEach(function (t) { var o = document.createElement('option'); o.value = t; o.textContent = t; s.appendChild(o); });
      tin('Đã tải.');
    }).catch(function () { tin('Không nối được máy chủ.', true); });
  }

  $('token').value = mem('token') || '';
  $('tai').addEventListener('click', tai);
  $('quet').addEventListener('click', function () {
    tin('Đang quét báo, có thể mất một lúc…');
    goi('/api/admin/tu-vung/thu-thap', 'POST').then(function (d) {
      if (!d.ok) return tin(cauLoi(d), true);
      var k = d.ketQua || {};
      tin(k.daChay ? 'Quét xong: ' + (k.ungVien || 0) + ' cụm mới từ ' + (k.tinMoi || 0) + ' bài.' : 'AI chưa chạy được (' + (k.loi || '?') + '), chưa quét.', !k.daChay);
      tai();
    });
  });
  $('gui').addEventListener('click', function () {
    goi('/api/admin/tu-vung/de-xuat', 'POST', {
      cum: $('fCum').value, tinHieu: $('fTinHieu').value,
      nguon: { ten: $('fNguonTen').value, url: $('fNguonUrl').value }, trichBao: $('fTrich').value
    }).then(function (d) {
      if (!d.ok) return tin(cauLoi(d), true);
      tin(d.trung ? 'Cụm này đã có.' : 'Đã đề xuất, AI đang xem trước.'); $('fCum').value = ''; tai();
    });
  });
  if ($('token').value) tai();
})();
