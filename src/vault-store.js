'use strict';
/**
 * §5.3 — LỚP LƯU TRỮ. Ba nền, chọn theo thứ tự:
 *
 *   ① Postgres  — khi có `DATABASE_URL`
 *   ② SQLite    — MẶC ĐỊNH. `node:sqlite` có sẵn trong Node 22+, tệp nằm ở
 *                 `.du-lieu/khoan-da.sqlite` (đổi bằng `SQLITE_PATH`)
 *   ③ Bộ nhớ tạm — LỐI CUỐI CÙNG, và luôn kèm cờ `canhBao`
 *
 * ⚠️ ĐỪNG ĐƯA BỘ NHỚ TẠM TRỞ LẠI LÀM MẶC ĐỊNH — ĐO ĐƯỢC 16/8/2026.
 * Nó nhận mọi lệnh ghi, báo thành công, rồi mất sạch khi khởi động lại. Đó là
 * §4.3 ở tầng lưu trữ: "chưa lưu được" hiện ra y hệt "đã lưu xong". Triệu chứng
 * người dùng thấy là "dữ liệu vẫn y hệt dữ liệu mẫu", không kèm lỗi nào.
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

// ─────────────────── SQLite ───────────────────

/**
 * KHO SQLITE — MẶC ĐỊNH KHI KHÔNG CÓ `DATABASE_URL`.
 *
 * ⚠️ VÌ SAO THÊM TẦNG NÀY — ĐO ĐƯỢC 16/8/2026.
 *
 * `DATABASE_URL` không đặt ⇒ kho rơi về `Map` trong RAM. Nghĩa là tài khoản,
 * vòng tròn gia đình, quy tắc, nhật ký audit đều BIẾN MẤT mỗi lần khởi động
 * lại máy chủ. Người dùng thấy "dữ liệu vẫn y hệt dữ liệu mẫu" và không có
 * cách nào biết vì sao — không lỗi, không cảnh báo, mọi lệnh ghi đều báo
 * thành công.
 *
 * §9.8.3 nói nhật ký audit CHỈ ĐƯỢC GHI THÊM và người xem KHÔNG XOÁ ĐƯỢC. Một
 * nhật ký bay hơi khi khởi động lại thì không thực hiện được lời hứa đó.
 *
 * `node:sqlite` có sẵn trong Node 22+ — không thêm phụ thuộc, không cần cài
 * dịch vụ, không cần mật khẩu. Và nó hợp với §6.9 hơn một máy chủ từ xa: dữ
 * liệu nằm trong một tệp trên chính máy chạy.
 *
 * Postgres vẫn được ưu tiên nếu ai đó đặt `DATABASE_URL`.
 */
function taoSqlite(duongDan) {
  // eslint-disable-next-line global-require
  const { DatabaseSync } = require('node:sqlite');
  // eslint-disable-next-line global-require
  const fs = require('node:fs');
  // eslint-disable-next-line global-require
  const path = require('node:path');

  fs.mkdirSync(path.dirname(duongDan), { recursive: true });
  const db = new DatabaseSync(duongDan);

  /*
   * WAL: đọc không chặn ghi. Máy chủ này đọc nhiều hơn ghi rất nhiều.
   * `foreign_keys` bật sẵn cho tương lai — SQLite mặc định TẮT, và đó là một
   * bất ngờ khó chịu nếu sau này thêm khoá ngoại rồi tưởng nó đang có tác dụng.
   */
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS kho (
      bang TEXT NOT NULL, khoa TEXT NOT NULL, du_lieu TEXT NOT NULL,
      PRIMARY KEY (bang, khoa)
    );
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT, du_lieu TEXT NOT NULL
    );
  `);

  const cauLuu = db.prepare(
    'INSERT INTO kho(bang,khoa,du_lieu) VALUES(?,?,?) '
    + 'ON CONFLICT(bang,khoa) DO UPDATE SET du_lieu = excluded.du_lieu',
  );
  const cauDoc = db.prepare('SELECT du_lieu FROM kho WHERE bang=? AND khoa=?');
  const cauXoa = db.prepare('DELETE FROM kho WHERE bang=? AND khoa=?');
  const cauLiet = db.prepare('SELECT du_lieu FROM kho WHERE bang=?');
  const cauAudit = db.prepare('INSERT INTO audit(du_lieu) VALUES(?)');
  const cauDocAudit = db.prepare('SELECT du_lieu FROM audit ORDER BY id');

  return {
    loai: 'sqlite',
    duongDan,
    async luu(ten, khoa, giaTri) { cauLuu.run(ten, khoa, JSON.stringify(giaTri)); return giaTri; },
    async doc(ten, khoa) {
      const r = cauDoc.get(ten, khoa);
      return r ? JSON.parse(r.du_lieu) : null;
    },
    async xoa(ten, khoa) { return cauXoa.run(ten, khoa).changes > 0; },
    async liet(ten) { return cauLiet.all(ten).map((x) => JSON.parse(x.du_lieu)); },
    // §9.8.3 — chỉ INSERT. Không có DELETE nào chạm tới bảng audit.
    async themAudit(banGhi) { cauAudit.run(JSON.stringify(banGhi)); },
    async docAudit() { return cauDocAudit.all().map((x) => JSON.parse(x.du_lieu)); },
    async dong() { db.close(); },
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
      // §6.7 — DB không lên KHÔNG được làm sập sản phẩm. Rơi về SQLite và NÓI
      // RA, để không ai tưởng đang nối tới Postgres.
      try {
        nen = taoSqlite(env.SQLITE_PATH || './.du-lieu/khoan-da.sqlite');
        nen.canhBao = 'DB_UNAVAILABLE';
        nen.nguyenNhan = e.message;
      } catch (e2) {
        nen = taoBoNhoTam();
        nen.canhBao = 'CHI_CO_BO_NHO_TAM';
        nen.nguyenNhan = `${e.message} · ${e2.message}`;
      }
    }
  } else {
    /*
     * ⚠️ KHÔNG RƠI THẲNG VỀ BỘ NHỚ TẠM NỮA.
     * Bộ nhớ tạm nhận mọi lệnh ghi và báo thành công, rồi mất sạch khi khởi
     * động lại. Đó là §4.3 ở tầng lưu trữ: "chưa lưu được" hiện ra y hệt "đã
     * lưu xong". Nay nó là lối cuối cùng, và luôn kèm cờ cảnh báo.
     */
    try {
      nen = taoSqlite(env.SQLITE_PATH || './.du-lieu/khoan-da.sqlite');
    } catch (e) {
      nen = taoBoNhoTam();
      nen.canhBao = 'CHI_CO_BO_NHO_TAM';
      nen.nguyenNhan = e.message;
    }
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

module.exports = { moKho, taoBoNhoTam, taoSqlite, kiemTruongCam, TRUONG_CAM, LoiLuuTru };
