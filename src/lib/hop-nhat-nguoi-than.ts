/**
 * HỢP NHẤT NGƯỜI THÂN ĐÃ GHÉP VÀO DANH SÁCH GỌI KHẨN CẤP — Phần 2, 23/9/2026.
 *
 * Đo trước đó: ghép máy xong, số của con KHÔNG vào nút "Gọi con cháu" trên màn
 * khẩn cấp — bác phải tự gõ lại. Hàm này thêm người đã ghép (tên + số lấy từ máy
 * chủ) vào `familyMembers`, KHÔNG trùng số (so theo chữ số, bỏ dấu cách).
 *
 * ⚠️ CHỈ THÊM, KHÔNG XOÁ. Gỡ ghép trên máy chủ không tự xoá người khỏi danh bạ
 * khẩn cấp của bác: đó là số bác vẫn có thể cần gọi.
 */
export interface NguoiThanToiThieu {
  id: number;
  name: string;
  relation: string;
  phone: string;
  avatar?: string;
}

const chiSo = (s: string) => String(s ?? '').replace(/\D/g, '');

export function hopNhatNguoiThan<T extends NguoiThanToiThieu>(
  ds: T[],
  daGhep: { ten: string; so: string }[],
  taoId: () => number = () => Date.now(),
): T[] {
  const daCo = new Set(ds.map((n) => chiSo(n.phone)));
  const them: NguoiThanToiThieu[] = [];
  for (const g of daGhep) {
    const so = chiSo(g.so);
    if (!so || daCo.has(so)) continue;
    daCo.add(so);
    them.push({ id: taoId(), name: g.ten, relation: 'Người thân tin cậy', phone: g.so });
  }
  return them.length === 0 ? ds : [...ds, ...(them as T[])];
}
