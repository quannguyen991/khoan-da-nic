'use strict';
/**
 * ĐO TẦNG QUÉT TIN NHẮN ĐẾN (R1–R21) — và ghi kết quả cho `/transparency`.
 *
 * ══════════ VÌ SAO PHẢI CÓ TỆP NÀY ══════════
 *
 * `eval/khoanbench.js` KHÔNG hề chạm `backend/src/detect/` — đã kiểm, không một
 * lời gọi nào. Nó chỉ đo đường "bác dán nội dung vào ô kiểm tra".
 *
 * Nghĩa là trước hôm nay, toàn bộ 21 luật và hơn 500 cụm nhận dạng của luồng
 * "tự quét tin nhắn đến" KHÔNG có một con số nào được công bố. Trang minh bạch
 * hiện sáu dòng đỏ của nửa kia, và im lặng hoàn toàn về nửa này — trong khi đây
 * mới là nửa mà người dùng không phải thao tác gì.
 *
 * Im lặng về một nửa sản phẩm cũng là một dạng nói không đủ sự thật.
 *
 * ══════════ ⚠️ ĐỌC TRƯỚC KHI TRÍCH CON SỐ RA NGOÀI ══════════
 *
 * Bộ mẫu này CHỈ CÓ 86 tin, và các luật R được chỉnh TRÊN CHÍNH NÓ. Con số đẹp
 * ở đây phần lớn là đo lại chính bài mình đã học thuộc — nguy cơ khớp quá mức
 * là thật và phải nói ra, không phải một dòng chú thích nhỏ.
 *
 * So sánh: `khoanbench` chạy trên 531 mẫu. Con số của hai bộ đo KHÔNG so sánh
 * trực tiếp được với nhau, và đừng gộp chúng thành một chỉ số chung.
 *
 * §11 cấm "gọi bản dựng là ĐÃ ĐO khi mới chỉ là MỤC TIÊU". Ở đây nó đã đo thật,
 * nhưng đo trên một bộ mẫu nhỏ và tự soạn — nên tệp kết quả mang sẵn cờ cảnh
 * báo, và trang minh bạch BẮT BUỘC in chúng ra cạnh con số.
 *
 * Chạy: node eval/do-tang-quet.js [--ghi]
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const GOC = path.join(__dirname, '..');
const { analyze } = require(path.join(GOC, 'backend', 'src', 'detect'));

const THU_TU = ['CHUA_THAY', 'NGHI_NGO', 'CAO'];
const bac = (n) => THU_TU.indexOf(n);

function docMau(ten) {
  const p = path.join(GOC, 'test', 'fixtures', 'tin-nhan', ten);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function nhanCua(tin) {
  const r = analyze({
    nguon: tin.nguon || 'sms',
    nguoiGui: tin.nguoiGui || '',
    noiDung: tin.noiDung || '',
    thoiDiem: 1,
  }, { danhBa: tin.danhBa || [] });
  return r.nhan || r.san || 'CHUA_THAY';
}

function do_() {
  const luaDao = docMau('lua-dao.json').tin;
  const lanh = docMau('binh-thuong.json').tin;

  const raLuaDao = luaDao.map((t) => ({ t, nhan: nhanCua(t) }));
  const raLanh = lanh.map((t) => ({ t, nhan: nhanCua(t) }));

  // Bắt được = đạt ÍT NHẤT nhãn tối thiểu mà bộ mẫu khai cho tin đó.
  const batDuoc = raLuaDao.filter(({ t, nhan }) => bac(nhan) >= bac(t.mongDoiToiThieu));
  // Vượt trần = tin lành bị chấm CAO hơn mức bộ mẫu cho phép.
  const vuotTran = raLanh.filter(({ t, nhan }) => bac(nhan) > bac(t.toiDa));

  const caoLuaDao = raLuaDao.filter(({ nhan }) => nhan === 'CAO').length;
  const caoLanh = raLanh.filter(({ nhan }) => nhan === 'CAO').length;
  const tongCao = caoLuaDao + caoLanh;

  return {
    // Có bao nhiêu tin nguy hiểm được nhận ra, ở mức bộ mẫu đòi.
    batDuoc: batDuoc.length / luaDao.length,
    // Trong những tin bị chấm CAO, bao nhiêu phần là nguy hiểm thật.
    precisionCao: tongCao === 0 ? null : caoLuaDao / tongCao,
    // Tin lành bị chấm CAO — §4.6: báo động giả làm người dùng gỡ ứng dụng.
    baoDoNhamTrenTinLanh: caoLanh / lanh.length,
    // Tin lành vượt trần đã khai (kể cả chỉ lên NGHI_NGO).
    vuotTranTinLanh: vuotTran.length / lanh.length,
    soMau: { luaDao: luaDao.length, lanh: lanh.length, tong: luaDao.length + lanh.length },
    sot: raLuaDao
      .filter(({ t, nhan }) => bac(nhan) < bac(t.mongDoiToiThieu))
      .map(({ t, nhan }) => ({ id: t.id, mong: t.mongDoiToiThieu, ra: nhan })),
    baoOan: vuotTran.map(({ t, nhan }) => ({ id: t.id, tran: t.toiDa, ra: nhan })),
  };
}

/**
 * ══════ PHÉP ĐO THỨ HAI: BỘ 571 MẪU CỦA KHOANBENCH ══════
 *
 * 86 mẫu ở trên là bộ mà luật R được chỉnh trên đó. Đo lại chính nó thì ra
 * 100% cả bốn chỉ số — đúng như dự đoán, và một mình con số đó không nói được
 * gì về sản phẩm ngoài đời.
 *
 * Bộ này lớn gấp 6,6 lần và luật KHÔNG được khớp vào từng mẫu của nó.
 *
 * ⚠️ NHƯNG NÓ KHÔNG PHẢI BỘ GIỮ RIÊNG SẠCH, và phải nói thẳng: R11–R20 được
 * dựng SAU KHI xem họ nào trượt trên chính bộ này. Không mẫu nào bị khớp riêng,
 * nhưng hướng thiết kế thì có nhìn vào đây. Gọi nó là "giữ riêng hoàn toàn" là
 * nói quá.
 *
 * ⚠️ VÀ ĐÂY LÀ MỘT CÁI SÀN, KHÔNG PHẢI HIỆU NĂNG THẬT. Bộ mẫu này không có
 * trường người gửi, nên ba luật mạnh nhất của tầng quét — R9 (số di động xưng
 * danh tổ chức), R10 (link + người gửi lạ), R21 (người lạ đòi tiền) — KHÔNG BAO
 * GIỜ nổ được ở đây. Ngoài đời tin nhắn nào cũng có người gửi.
 */
function doBoLon() {
  const thuMuc = path.join(GOC, 'eval', 'dataset');
  if (!fs.existsSync(thuMuc)) return null;
  const tep = fs.readdirSync(thuMuc).filter((t) => t.endsWith('.jsonl')).sort();
  if (tep.length === 0) return null;

  let nguyHiem = 0; let batDuoc = 0;
  let lanh = 0; let baoDoNham = 0; let vuotTran = 0;
  let caoDung = 0; let caoSai = 0;

  for (const t of tep) {
    const dong = fs.readFileSync(path.join(thuMuc, t), 'utf8').split('\n').filter((d) => d.trim());
    for (const d of dong) {
      let m; try { m = JSON.parse(d); } catch { continue; }
      const noiDung = m.noi_dung || m.noiDung;
      if (typeof noiDung !== 'string' || !noiDung.trim()) continue;

      // KHÔNG có người gửi trong bộ này — xem khối ghi chú trên.
      const nhan = nhanCua({ nguon: m.kenh || 'sms', nguoiGui: '', noiDung });

      const mong = m.muc_do || m.mucDo;
      const tran = m.toi_da || m.toiDa;

      if (mong && mong !== 'CHUA_THAY') {
        nguyHiem += 1;
        if (bac(nhan) >= bac(mong)) batDuoc += 1;
        if (nhan === 'CAO') caoDung += 1;
      } else {
        lanh += 1;
        if (nhan === 'CAO') { baoDoNham += 1; caoSai += 1; }
        if (tran && bac(nhan) > bac(tran)) vuotTran += 1;
      }
    }
  }

  const tongCao = caoDung + caoSai;
  return {
    batDuoc: nguyHiem ? batDuoc / nguyHiem : null,
    precisionCao: tongCao ? caoDung / tongCao : null,
    baoDoNhamTrenTinLanh: lanh ? baoDoNham / lanh : null,
    vuotTranTinLanh: lanh ? vuotTran / lanh : null,
    soMau: { nguyHiem, lanh, tong: nguyHiem + lanh },
  };
}

function commitSha() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: GOC, encoding: 'utf8' }).trim();
  } catch { return null; }
}

function bao() {
  const k = do_();
  return {
    metadata: {
      commitSha: commitSha(),
      boMau: 'test/fixtures/tin-nhan',
      chayLuc: null,   // người gọi đóng dấu; giữ hàm này thuần để test lại được
      khongGoiAi: true,
      khongGoiMang: true,
    },
    chiSo: k,
    boLon: doBoLon(),
    /**
     * ⚠️ BA CỜ NÀY PHẢI ĐI CÙNG CON SỐ, KHÔNG ĐƯỢC TÁCH RA.
     * Trang minh bạch in chúng ngay cạnh bảng; ai trích số mà bỏ cờ là đang
     * nói quá về sản phẩm.
     */
    canhBao: [
      'khong_co_mau_that',
      'bo_mau_nho',
      'luat_chinh_tren_chinh_bo_mau_nay',
      'khong_so_sanh_voi_khoanbench',
      'bo_lon_khong_co_nguoi_gui',
    ],
  };
}

module.exports = { do_, bao };

if (require.main === module) {
  const b = bao();
  b.metadata.chayLuc = new Date().toISOString();
  const k = b.chiSo;
  const pt = (x) => (x === null ? '—' : `${(x * 100).toFixed(1)}%`);
  console.log('');
  console.log('  TẦNG QUÉT TIN NHẮN ĐẾN — %d mẫu (%d lừa đảo · %d lành)',
    k.soMau.tong, k.soMau.luaDao, k.soMau.lanh);
  console.log('  ' + '─'.repeat(58));
  console.log('  bắt được ca nguy hiểm       : %s', pt(k.batDuoc));
  console.log('  precision của nhãn CAO      : %s', pt(k.precisionCao));
  console.log('  báo đỏ nhầm trên tin lành   : %s', pt(k.baoDoNhamTrenTinLanh));
  console.log('  vượt trần trên tin lành     : %s', pt(k.vuotTranTinLanh));
  if (k.sot.length) console.log('  sót: %s', k.sot.map((x) => `${x.id}(${x.mong}→${x.ra})`).join(' '));
  if (k.baoOan.length) console.log('  báo oan: %s', k.baoOan.map((x) => `${x.id}(${x.tran}→${x.ra})`).join(' '));
  const L = b.boLon;
  if (L) {
    console.log('');
    console.log('  BỘ 571 MẪU CỦA KHOANBENCH — %d mẫu (%d nguy hiểm · %d lành)',
      L.soMau.tong, L.soMau.nguyHiem, L.soMau.lanh);
    console.log('  ' + '─'.repeat(58));
    console.log('  bắt được ca nguy hiểm       : %s', pt(L.batDuoc));
    console.log('  precision của nhãn CAO      : %s', pt(L.precisionCao));
    console.log('  báo đỏ nhầm trên tin lành   : %s', pt(L.baoDoNhamTrenTinLanh));
    console.log('  vượt trần trên tin lành     : %s', pt(L.vuotTranTinLanh));
    console.log('  ' + '─'.repeat(58));
    console.log('  ⚠️  Bộ này KHÔNG có trường người gửi, nên R9/R10/R21 không bao');
    console.log('      giờ nổ được ở đây. Đây là SÀN của phần đọc nội dung.');
  }
  console.log('  ' + '─'.repeat(58));
  console.log('  ⚠️  86 mẫu, tự soạn, và luật được chỉnh trên chính bộ mẫu này.');
  console.log('      Không so sánh trực tiếp với con số của khoanbench (531 mẫu).');
  console.log('');

  if (process.argv.includes('--ghi')) {
    const p = path.join(GOC, 'eval', 'results', 'tang-quet.json');
    fs.writeFileSync(p, `${JSON.stringify(b, null, 2)}\n`, 'utf8');
    console.log('  đã ghi %s\n', path.relative(GOC, p));
  } else {
    console.log('  Thêm --ghi để xuất eval/results/tang-quet.json\n');
  }
}
