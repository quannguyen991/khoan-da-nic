'use strict';
/**
 * §5.3 — LỚP LƯU TRỮ. Postgres nếu có `DATABASE_URL`, không thì bộ nhớ tạm.
 *
 * §6.9 — CÁI GÌ Ở ĐÂU:
 *   Postgres được lưu: account tối thiểu khi pairing, relationships, rules,
 *                      push subs, alert metadata, audit
 *   Postgres CẤM lưu:  raw scam text, raw file
 *
 * ⚠️ Ràng buộc mạnh nhất của module này là thứ nó TỪ CHỐI nhận. Nếu nội dung
 * thô lọt được vào đây thì mọi câu về quyền riêng tư trên slide đều sai.
 *
 * §9.8.3 — nhật ký audit CHỈ GHI THÊM. Không có hàm xoá, và đó là chủ đích.
 */

/** §6.9 — trường TUYỆT ĐỐI không được lưu ở tầng máy chủ. */
const TRUONG_CAM = Object.freeze([
  'noiDung', 'vanBan', 'rawText', 'noi_dung', 'content', 'message',
  'anh', 'file', 'tepDinhKem', 'evidence', 'quote',
  'otp', 'matKhau', 'password', 'pin', 'cvv', 'soTaiKhoan', 'accountNumber',
]);

class LoiLuuTru extends Error {
  constructor(ma, chiTiet) { super(ma); this.name = 'LoiLuuTru'; this.ma = ma; this.chiTiet = chiTiet; }
}

/**
 * Quét SÂU. Kẻ gọi có thể lồng nội dung thô vào một object con — chặn một tầng
 * là không đủ.
 */
function kiemTruongCam(o, duong = '') {
  if (o === null || typeof o !== 'object') return null;
  if (Array.isArray(o)) {
    for (let i = 0; i < o.length; i += 1) {
      const v = kiemTruongCam(o[i], `${duong}[${i}]`);
      if (v) return v;
    }
    return null;
  }
  for (const [k, v] of Object.entries(o)) {
    if (TRUONG_CAM.includes(k)) return `${duong}${duong ? '.' : ''}${k}`;
    const sau = kiemTruongCam(v, `${duong}${duong ? '.' : ''}${k}`);
    if (sau) return sau;
  }
  return null;
}

// ─────────────────── Bộ nhớ tạm ───────────────────

function taoBoNhoTam() {
  const bang = new Map();
  const layBang = (ten) => {
    if (!bang.has(ten)) bang.set(ten, new Map());
    return bang.get(ten);
  };
  return {
    loai: 'bo_nho_tam',
    async luu(ten, khoa, giaTri) { layBang(ten).set(khoa, giaTri); return giaTri; },
    async doc(ten, khoa) { return layBang(ten).get(khoa) ?? null; },
    async xoa(ten, khoa) { return layBang(ten).delete(khoa); },
    async liet(ten) { return [...layBang(ten).values()]; },
    async themAudit(banGhi) { layBang('_audit').set(String(layBang('_audit').size), banGhi); },
    async docAudit() { return [...layBang('_audit').values()]; },
    async dong() { bang.clear(); },
  };
}

// ─────────────────── Postgres ───────────────────

async function taoPostgres(url) {
  // eslint-disable-next-line global-require
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: url });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kho (
      bang TEXT NOT NULL, khoa TEXT NOT NULL, du_lieu JSONB NOT NULL,
      PRIMARY KEY (bang, khoa)
    );
    CREATE TABLE IF NOT EXISTS audit (
      id BIGSERIAL PRIMARY KEY, du_lieu JSONB NOT NULL
    );
  `);
  return {
    loai: 'postgres',
    async luu(ten, khoa, giaTri) {
      await pool.query(
        'INSERT INTO kho(bang,khoa,du_lieu) VALUES($1,$2,$3) '
        + 'ON CONFLICT (bang,khoa) DO UPDATE SET du_lieu = EXCLUDED.du_lieu',
        [ten, khoa, giaTri],
      );
      return giaTri;
    },
    async doc(ten, khoa) {
      const r = await pool.query('SELECT du_lieu FROM kho WHERE bang=$1 AND khoa=$2', [ten, khoa]);
      return r.rows[0]?.du_lieu ?? null;
    },
    async xoa(ten, khoa) {
      const r = await pool.query('DELETE FROM kho WHERE bang=$1 AND khoa=$2', [ten, khoa]);
      return r.rowCount > 0;
    },
    async liet(ten) {
      const r = await pool.query('SELECT du_lieu FROM kho WHERE bang=$1', [ten]);
      return r.rows.map((x) => x.du_lieu);
    },
    // §9.8.3 — chỉ INSERT. Không có DELETE nào chạm tới bảng audit.
    async themAudit(banGhi) { await pool.query('INSERT INTO audit(du_lieu) VALUES($1)', [banGhi]); },
    async docAudit() {
      const r = await pool.query('SELECT du_lieu FROM audit ORDER BY id');
      return r.rows.map((x) => x.du_lieu);
    },
    async dong() { await pool.end(); },
  };
}

/**
 * @param {object} opts.env
 * @returns {Promise<object>} kho có chặn trường cấm ở mọi lối vào
 */
async function moKho({ env = process.env } = {}) {
  const url = env.DATABASE_URL;
  let nen;
  if (url) {
    try {
      nen = await taoPostgres(url);
    } catch (e) {
      // §6.7 — DB không lên KHÔNG được làm sập sản phẩm. Rơi về bộ nhớ tạm và
      // NÓI RA, để không ai tưởng dữ liệu đang được lưu bền.
      nen = taoBoNhoTam();
      nen.canhBao = 'DB_UNAVAILABLE';
      nen.nguyenNhan = e.message;
    }
  } else {
    nen = taoBoNhoTam();
  }

  // Bọc mọi lối ghi bằng hàng rào trường cấm.
  const luuGoc = nen.luu.bind(nen);
  const auditGoc = nen.themAudit.bind(nen);
  nen.luu = async (ten, khoa, giaTri) => {
    const viPham = kiemTruongCam(giaTri);
    if (viPham) throw new LoiLuuTru('TRUONG_BI_CAM_O_TANG_MAY_CHU', viPham);
    return luuGoc(ten, khoa, giaTri);
  };
  nen.themAudit = async (banGhi) => {
    const viPham = kiemTruongCam(banGhi);
    if (viPham) throw new LoiLuuTru('TRUONG_BI_CAM_O_TANG_MAY_CHU', viPham);
    return auditGoc(banGhi);
  };
  return nen;
}

module.exports = { moKho, taoBoNhoTam, kiemTruongCam, TRUONG_CAM, LoiLuuTru };
