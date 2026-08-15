'use strict';
/**
 * ⚠️⚠️ CHỈ DÙNG TRONG TEST. KHÔNG BAO GIỜ ĐƯỢC require TỪ src/ HAY server.js.
 *
 * Đây là một MÁY XÁC THỰC (authenticator) dựng bằng WebCrypto để kiểm rằng
 * đường xác minh của máy chủ CHẤP NHẬN một chữ ký ĐÚNG — chứ không phải nó đang
 * từ chối tất cả mọi thứ và ta nhầm tưởng "hàng rào chặt".
 *
 * Vì sao cần: một hàm `verify()` luôn ném lỗi trông y hệt một hàm `verify()`
 * chặt chẽ. Test chỉ ném rác vào rồi thấy 400 thì KHÔNG phân biệt được hai thứ
 * đó. Đúng cùng một họ lỗi với §4.3: "không kiểm được" ≠ "đã kiểm, không thấy".
 *
 * ⚠️ ĐÂY KHÔNG PHẢI "GIẢ LẬP CHỮ KÝ TRONG SẢN PHẨM". Chữ ký ở đây là chữ ký
 * ECDSA P-256 THẬT, sinh bằng khoá thật, và máy chủ xác minh nó bằng đúng đường
 * xác minh mà trình duyệt sẽ đi. Thứ được thay thế là PHẦN CỨNG, không phải phép
 * toán. Sản phẩm không có đường nào gọi tới tệp này — có test chặn.
 */

const crypto = require('node:crypto');
const { isoCBOR, isoBase64URL } = require('@simplewebauthn/server/helpers');

const { subtle } = crypto.webcrypto;

const b64u = (buf) => isoBase64URL.fromBuffer(new Uint8Array(buf));
const noi = (...phan) => Buffer.concat(phan.map((p) => Buffer.from(p)));

/**
 * COSE_Key cho ES256 (P-256):
 *   1:2 (kty EC2) · 3:-7 (alg ES256) · -1:1 (crv P-256) · -2:x · -3:y
 * Khoá là SỐ NGUYÊN, nên phải encode bằng Map chứ không phải object.
 */
function coseTuJwk(jwk) {
  return isoCBOR.encode(new Map([
    [1, 2], [3, -7], [-1, 1],
    [-2, isoBase64URL.toBuffer(jwk.x)],
    [-3, isoBase64URL.toBuffer(jwk.y)],
  ]));
}

/** Chữ ký WebAuthn dùng định dạng DER; WebCrypto trả raw r||s. Đổi sang DER. */
function rawSangDer(raw) {
  const nua = raw.length / 2;
  const dungSo = (b) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i += 1;
    const c = b.subarray(i);
    return c[0] & 0x80 ? noi(Buffer.from([0]), c) : c;
  };
  const r = dungSo(Buffer.from(raw.subarray(0, nua)));
  const s = dungSo(Buffer.from(raw.subarray(nua)));
  const than = noi(Buffer.from([0x02, r.length]), r, Buffer.from([0x02, s.length]), s);
  return noi(Buffer.from([0x30, than.length]), than);
}

const AAGUID = Buffer.alloc(16);   // 'none' attestation ⇒ aaguid toàn 0

/**
 * @param {object} opts { rpID, origin }
 * @returns máy xác thực có `dangKy(challenge)` và `ky(challenge, ...)`
 */
async function taoMayXacThuc({ rpID = 'localhost', origin = 'http://localhost:8089' } = {}) {
  const cap = await subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'],
  );
  const jwk = await subtle.exportKey('jwk', cap.publicKey);
  const credId = crypto.randomBytes(32);
  const rpIdHash = crypto.createHash('sha256').update(rpID).digest();
  let dem = 0;

  const dungAuthData = ({ coAttested }) => {
    // UP (0x01) | UV (0x04) | AT (0x40 nếu có attested credential data)
    const co = Buffer.from([coAttested ? 0x45 : 0x05]);
    const bd = Buffer.alloc(4);
    bd.writeUInt32BE(dem, 0);
    if (!coAttested) return noi(rpIdHash, co, bd);

    const doDai = Buffer.alloc(2);
    doDai.writeUInt16BE(credId.length, 0);
    return noi(rpIdHash, co, bd, AAGUID, doDai, credId, coseTuJwk(jwk));
  };

  const dungClientData = (type, challenge) => Buffer.from(JSON.stringify({
    type, challenge, origin, crossOrigin: false,
  }), 'utf8');

  return {
    credId,

    /** Phản hồi ĐĂNG KÝ — dạng `navigator.credentials.create()` trả về. */
    dangKy(challenge) {
      const clientDataJSON = dungClientData('webauthn.create', challenge);
      const authData = dungAuthData({ coAttested: true });
      const attestationObject = Buffer.from(isoCBOR.encode(new Map([
        ['fmt', 'none'], ['attStmt', new Map()], ['authData', new Uint8Array(authData)],
      ])));
      return {
        id: b64u(credId),
        rawId: b64u(credId),
        type: 'public-key',
        clientExtensionResults: {},
        response: {
          clientDataJSON: b64u(clientDataJSON),
          attestationObject: b64u(attestationObject),
        },
      };
    },

    /** Phản hồi XÁC THỰC — dạng `navigator.credentials.get()` trả về. */
    async ky(challenge, { originKhac, demKhac } = {}) {
      dem = typeof demKhac === 'number' ? demKhac : dem + 1;
      const clientDataJSON = dungClientData('webauthn.get', challenge);
      if (originKhac) {
        // Cố ý ký trên một origin khác — để test đòi máy chủ TỪ CHỐI.
        const xau = Buffer.from(JSON.stringify({
          type: 'webauthn.get', challenge, origin: originKhac, crossOrigin: false,
        }), 'utf8');
        return this._ky(xau, challenge);
      }
      return this._ky(clientDataJSON, challenge);
    },

    async _ky(clientDataJSON, challenge) {
      void challenge;
      const authData = dungAuthData({ coAttested: false });
      const bam = crypto.createHash('sha256').update(clientDataJSON).digest();
      const raw = new Uint8Array(await subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' }, cap.privateKey, noi(authData, bam),
      ));
      return {
        id: b64u(credId),
        rawId: b64u(credId),
        type: 'public-key',
        clientExtensionResults: {},
        response: {
          clientDataJSON: b64u(clientDataJSON),
          authenticatorData: b64u(authData),
          signature: b64u(rawSangDer(raw)),
          userHandle: null,
        },
      };
    },
  };
}

module.exports = { taoMayXacThuc };
