"use strict";
/**
 * KHÔNG MÀN NÀO ĐƯỢC SẬP KHI BÁC CHƯA THÊM NGƯỜI THÂN NÀO.
 *
 * Người dùng báo 4/9/2026: "nhiều khi ấn vào menu tác vụ nó cứ không vào được".
 * Đo trên bản web thật, console ném:
 *
 *     [hang-rao-loi] Cannot read properties of null (reading 'name')
 *
 * Danh sách người thân rỗng là trạng thái MẶC ĐỊNH của app (dữ liệu mẫu bịa đã
 * bị bỏ — xem chú thích `familyMembers` trong App.tsx). Mọi chỗ đọc
 * `firstContact?.phone`, riêng một chỗ đọc thẳng `firstContact.name` → ném
 * TypeError → hàng rào lỗi chặn cả menu → bác bấm mà không vào được.
 *
 * "Nhiều khi" là vì nó chỉ sập khi CHƯA có người thân: ai đã thêm con cháu rồi
 * thì không bao giờ gặp.
 *
 * ⚠️ VÀ NÓ KHÔNG CHỈ CÓ MỘT CHỖ. Khi khai kiểu thật cho `familyMembers`, trình
 * biên dịch chỉ ra CÙNG LỖI ĐÓ trong `FloatingQuickAccess` — dòng
 * `{primaryContact.name} ({primaryContact.phone})` của nút "Gọi ngay cho con
 * cháu", tức là bên trong LỐI TẮT KHẨN CẤP. Chỗ đó chưa ai kịp báo.
 *
 * Bài học: một lỗi tìm bằng mắt thì vá được một chỗ; cùng lỗi ấy tìm bằng
 * trình biên dịch thì vá được mọi chỗ. Hàng rào thật nằm ở test cuối tệp.
 *
 * ⚠️ KHÔNG DÙNG `new RegExp` VỚI CHUỖI MẪU Ở ĐÂY. Bản nháp đầu của tệp này viết
 * ``new RegExp(`\b${bien}\.`)`` — trong chuỗi mẫu `\b` là ký tự xoá lùi, nên mẫu
 * không khớp gì cả và test BÁO XANH TRONG KHI LỖI VẪN NGUYÊN. Một test đỗ vì
 * không tìm thấy gì còn tệ hơn không có test. Dưới đây chỉ dùng thao tác chuỗi
 * thường và regex viết thẳng.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const GOC = path.join(__dirname, "..");

const LA_KY_TU_TEN = /[A-Za-z0-9_$]/;

/** Đọc mã, đã bỏ dòng chú thích — chính chú thích cũng nhắc lại đoạn mã sai. */
function docMaThuc(tuongDoi) {
  return fs.readFileSync(path.join(GOC, tuongDoi), "utf8")
    .split("\n")
    .map((dong, i) => ({ so: i + 1, dong }))
    .filter(({ dong }) => {
      const t = dong.trim();
      return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
    });
}

function coTep(tuongDoi) {
  return fs.existsSync(path.join(GOC, tuongDoi)) ? false : `chưa có ${tuongDoi}`;
}

/**
 * `bien.thuocTinh` có mà KHÔNG phải `bien?.thuocTinh`.
 * Thao tác chuỗi thuần — không mẫu, không escape, không đỗ oan.
 */
function coDocThangThuocTinh(dong, bien) {
  let i = dong.indexOf(bien);
  while (i !== -1) {
    const truoc = i > 0 ? dong[i - 1] : "";
    const sau = dong.slice(i + bien.length);
    if (!LA_KY_TU_TEN.test(truoc) && sau.startsWith(".") && LA_KY_TU_TEN.test(sau[1] || "")) {
      return true;
    }
    i = dong.indexOf(bien, i + 1);
  }
  return false;
}

/**
 * Mỗi màn đọc người thân đầu tiên đều phải chịu được trường hợp KHÔNG CÓ AI.
 * Thêm màn mới đọc `familyMembers[0]` thì THÊM DÒNG VÀO ĐÂY.
 */
const CHO_DOC_NGUOI_DAU = [
  { tep: "src/components/AppMenuModal.tsx", bien: "firstContact" },
  { tep: "src/components/FloatingQuickAccess.tsx", bien: "primaryContact" },
];

for (const { tep, bien } of CHO_DOC_NGUOI_DAU) {
  test(`${tep}: không đọc thuộc tính của \`${bien}\` mà thiếu \`?.\``, { skip: coTep(tep) }, () => {
    const dongMa = docMaThuc(tep);

    const viPham = dongMa
      .filter(({ dong }) => coDocThangThuocTinh(dong, bien))
      .filter(({ dong }) => !dong.includes(`const ${bien}`))
      // Đã chặn bằng `if (!x?.phone) { ...; return; }` ngay trên thì dòng sau an
      // toàn — trình biên dịch xác nhận điều đó, test tĩnh không cần đoán lại.
      .filter(({ so }) => {
        const truoc = dongMa.find((d) => d.so === so - 1);
        return !(truoc && truoc.dong.includes(`!${bien}?.`));
      })
      .map(({ so, dong }) => `dòng ${so}: ${dong.trim()}`);

    assert.deepStrictEqual(viPham, [],
      `${bien} có thể là null khi bác chưa thêm người thân — đọc thẳng thuộc tính là làm sập cả màn`);
  });

  test(`${tep}: \`${bien}\` vẫn được phép là null — đó là mặc định, không phải lỗi`, { skip: coTep(tep) }, () => {
    const ma = fs.readFileSync(path.join(GOC, tep), "utf8");
    const dau = ma.indexOf(`const ${bien}`);
    assert.notStrictEqual(dau, -1, `không tìm thấy khai báo \`const ${bien}\``);
    assert.ok(ma.slice(dau, dau + 500).includes(": null"),
      "giữ nguyên `null` khi chưa có ai; đừng vá bằng cách bịa một người thân mặc định");
  });
}

/**
 * ⚠️ ĐÂY MỚI LÀ HÀNG RÀO THẬT.
 *
 * Hai test trên chỉ nhìn đúng hai tên biến ở đúng hai tệp, và chúng chỉ tồn tại
 * vì đã có người BÁO lỗi. Thứ tìm ra chỗ thứ hai — chỗ chưa ai báo — là trình
 * biên dịch, và nó chỉ làm được nhờ `familyMembers` mang kiểu thật: dưới
 * `noUncheckedIndexedAccess`, `familyMembers[0]` là `NguoiThan | undefined`, nên
 * MỌI nơi buộc phải xử lý trường hợp chưa có ai.
 *
 * Khai lại thành `any[]` thì tsc im lặng trở lại và cả lớp lỗi này tàng hình —
 * không có gì báo đỏ, kể cả hai test trên. Nên chính việc khai kiểu phải được
 * canh, chứ không chỉ hậu quả của nó.
 */
test("`familyMembers` phải mang kiểu thật, không được quay lại `any[]`", () => {
  const TEP = [
    "src/App.tsx",
    "src/components/AppMenuModal.tsx",
    "src/components/FloatingQuickAccess.tsx",
    "src/components/Guardian.tsx",
  ].filter((t) => fs.existsSync(path.join(GOC, t)));

  const khaiBao = TEP.flatMap((tep) =>
    docMaThuc(tep)
      .filter(({ dong }) => /familyMembers\??\s*:/.test(dong))
      .map(({ so, dong }) => ({ tep, so, dong: dong.trim() })));

  assert.ok(khaiBao.length >= 4,
    `chỉ thấy ${khaiBao.length} chỗ khai \`familyMembers\` — có tệp bị đổi tên hay xoá?`);

  const mo = khaiBao
    .filter(({ dong }) => /:\s*any\b/.test(dong))
    .map(({ tep, so, dong }) => `${tep}:${so} → ${dong}`);

  assert.deepStrictEqual(mo, [],
    "khai `any[]` là tắt đèn của trình biên dịch — dùng `NguoiThan[]`");
});
