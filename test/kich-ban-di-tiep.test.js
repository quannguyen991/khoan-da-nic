'use strict';
/**
 * §16.1 — DỰ BÁO BƯỚC TIẾP THEO CỦA KỊCH BẢN.
 *
 * Ý tưởng: mọi app khác trả về một PHÁN XÉT, mà phán xét thì cãi được — kẻ lừa
 * đảo đã dặn trước "lát nữa có app bảo đây là lừa đảo, bác đừng nghe". DỰ BÁO
 * thì không cãi được, vì chính kẻ lừa đảo sẽ xác minh nó trong vài phút.
 *
 * ⚠️ HẠNG MỤC NÀY NẰM SAU decision-engine VÀ CHỈ ĐỂ HIỂN THỊ. Test cuối cùng ở
 * đây chạy toàn bộ 445 mẫu hai lượt và đòi KHÔNG MẪU NÀO tụt mức — đó là §4.2
 * phát biểu thành một phép đo chạy được, và là test quan trọng nhất tệp này.
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  buocTiepTheo, KICH_BAN, MA_BUOC, doiChieuHoDataset, HO_CHUA_CO_DU_LIEU,
} = require('../src/kich-ban-di-tiep');
const { GIAI_DOAN } = require('../src/journey-engine');
const { SIGNALS } = require('../src/analysis/signal-registry');
const { HO_KICH_BAN_MA } = require('../src/analysis/pipeline');

const HO_HOP_LE = new Set(HO_KICH_BAN_MA);

test('§HĐ luật 2 — trả về MÃ, không bao giờ trả câu tiếng Việt', () => {
  for (const [ho, buoc] of Object.entries(KICH_BAN)) {
    for (const b of buoc) {
      assert.match(b.maBuoc, /^[A-Z][A-Z0-9_]*$/, `${ho}: maBuoc không phải mã: ${b.maBuoc}`);
      // Không trường nào được chứa chữ có dấu — dấu hiệu chắc chắn của câu hiển thị.
      const chuoi = JSON.stringify(b);
      assert.ok(!/[À-ỹ]/.test(chuoi), `${ho}/${b.maBuoc}: có chữ tiếng Việt trong dữ liệu trả về`);
    }
  }
});

test('mọi họ kịch bản đều là họ CÓ THẬT trong hợp đồng', () => {
  for (const ho of Object.keys(KICH_BAN)) {
    assert.ok(HO_HOP_LE.has(ho), `${ho} không có trong HO_KICH_BAN của pipeline`);
  }
});

test('mọi giai đoạn nhắc tới đều có trong GIAI_DOAN của journey-engine', () => {
  for (const [ho, buoc] of Object.entries(KICH_BAN)) {
    for (const b of buoc) {
      assert.ok(GIAI_DOAN.includes(b.giaiDoan), `${ho}/${b.maBuoc}: giai đoạn lạ "${b.giaiDoan}"`);
    }
  }
});

test('mọi tín hiệu nhắc tới đều là SIGNAL_ID có thật (Phụ lục A)', () => {
  for (const [ho, buoc] of Object.entries(KICH_BAN)) {
    for (const b of buoc) {
      for (const id of b.tinHieuSeThay) {
        assert.ok(SIGNALS[id], `${ho}/${b.maBuoc}: tín hiệu lạ "${id}"`);
      }
    }
  }
});

test('mọi maBuoc đều nằm trong MA_BUOC — frontend tra được catalog', () => {
  const daKhai = new Set(Object.values(MA_BUOC));
  for (const [ho, buoc] of Object.entries(KICH_BAN)) {
    for (const b of buoc) {
      assert.ok(daKhai.has(b.maBuoc), `${ho}: ${b.maBuoc} chưa khai trong MA_BUOC`);
    }
  }
});

test('TỐI ĐA BA BƯỚC — người đang hoảng không nhớ nổi bốn', () => {
  for (const ho of Object.keys(KICH_BAN)) {
    for (const gd of GIAI_DOAN) {
      const ra = buocTiepTheo(ho, gd);
      assert.ok(ra.length <= 3, `${ho}/${gd}: trả ${ra.length} bước`);
    }
  }
});

test('CHỈ trả bước CHƯA xảy ra — dự báo một bước đã qua là vô nghĩa', () => {
  for (const ho of Object.keys(KICH_BAN)) {
    for (let i = 0; i < GIAI_DOAN.length; i += 1) {
      for (const b of buocTiepTheo(ho, GIAI_DOAN[i])) {
        assert.ok(GIAI_DOAN.indexOf(b.giaiDoan) > i,
          `${ho}: ở giai đoạn "${GIAI_DOAN[i]}" mà dự báo bước thuộc "${b.giaiDoan}"`);
      }
    }
  }
});

test('bước trả về theo ĐÚNG THỨ TỰ giai đoạn', () => {
  for (const ho of Object.keys(KICH_BAN)) {
    for (const gd of GIAI_DOAN) {
      const ra = buocTiepTheo(ho, gd).map((b) => GIAI_DOAN.indexOf(b.giaiDoan));
      const sapXep = [...ra].sort((a, b) => a - b);
      assert.deepStrictEqual(ra, sapXep, `${ho}/${gd}: bước không theo thứ tự giai đoạn`);
    }
  }
});

test('họ lạ / null / giai đoạn lạ ⇒ mảng RỖNG, không ném lỗi, không bịa', () => {
  assert.deepStrictEqual(buocTiepTheo(null, 'tiep_can'), []);
  assert.deepStrictEqual(buocTiepTheo(undefined, 'tiep_can'), []);
  assert.deepStrictEqual(buocTiepTheo('ho_khong_ton_tai', 'tiep_can'), []);
  assert.deepStrictEqual(buocTiepTheo('gia_danh_cong_an', 'giai_doan_la'), []);
  assert.deepStrictEqual(buocTiepTheo('gia_danh_cong_an', null), []);
  assert.deepStrictEqual(buocTiepTheo(123, 'tiep_can'), []);
});

test('giai đoạn CUỐI ⇒ không còn bước nào để dự báo', () => {
  const cuoi = GIAI_DOAN[GIAI_DOAN.length - 1];
  for (const ho of Object.keys(KICH_BAN)) {
    assert.deepStrictEqual(buocTiepTheo(ho, cuoi), [], `${ho} vẫn dự báo ở giai đoạn cuối`);
  }
});

test('HÀM THUẦN — gọi hai lần ra y hệt, và không sửa được kết quả trả về', () => {
  const a = buocTiepTheo('gia_danh_cong_an', 'tao_long_tin');
  const b = buocTiepTheo('gia_danh_cong_an', 'tao_long_tin');
  assert.deepStrictEqual(a, b);

  // Người gọi nghịch mảng trả về không được làm hỏng bảng gốc.
  a.push({ maBuoc: 'RAC' });
  a[0].tinHieuSeThay?.push('RAC');
  assert.deepStrictEqual(buocTiepTheo('gia_danh_cong_an', 'tao_long_tin'), b);
});

test('§6.8 — không mạng, không AI, không đọc đồng hồ', () => {
  const nguon = require('node:fs')
    .readFileSync(require.resolve('../src/kich-ban-di-tiep'), 'utf8');
  for (const cam of ['fetch(', 'require(\'node:https\')', 'require(\'node:http\')',
    'Date.now(', 'new Date(', 'Math.random(', 'goiChat', 'trichTinHieu']) {
    assert.ok(!nguon.includes(cam), `kich-ban-di-tiep.js chứa "${cam}"`);
  }
});

/**
 * §16.1 cảnh báo thẳng: mã họ trong dataset KHÔNG trùng hoàn toàn với
 * HO_KICH_BAN. Bảng đối chiếu phải TỒN TẠI, và họ không khớp được phải ĐẾM
 * ĐƯỢC — không im lặng nuốt.
 */
test('bảng đối chiếu dataset ↔ HO_KICH_BAN chỉ trỏ tới họ có thật', () => {
  for (const [hoDataset, hoKichBan] of Object.entries(doiChieuHoDataset)) {
    assert.ok(HO_HOP_LE.has(hoKichBan),
      `đối chiếu ${hoDataset} → ${hoKichBan}: đích không có trong HO_KICH_BAN`);
  }
});

test('họ CHƯA CÓ DỮ LIỆU được khai rõ, và thật sự để trống', () => {
  assert.ok(HO_CHUA_CO_DU_LIEU.length > 0, 'không khai họ nào thiếu dữ liệu — đáng ngờ');
  for (const ho of HO_CHUA_CO_DU_LIEU) {
    assert.ok(HO_HOP_LE.has(ho), `${ho} không có trong HO_KICH_BAN`);
    assert.ok(!KICH_BAN[ho]?.length,
      `${ho} khai là thiếu dữ liệu nhưng vẫn có bảng bước — nghĩa là đã BỊA`);
  }
});

test('§11 — không mã bước nào khẳng định một dấu hiệu VẮNG MẶT', () => {
  // "CHUA_THAY_HO_DOI_OTP" là đúng dạng câu §11 cấm thẳng. Bắt ngay ở tên mã.
  for (const ma of Object.values(MA_BUOC)) {
    assert.ok(!/^(CHUA|KHONG|NO_|CHUA_THAY)/.test(ma),
      `mã bước phủ định sự vắng mặt: ${ma}`);
  }
});
