import { useEffect, useRef } from 'react';
import { docTo } from '../native';

/**
 * ═════ ĐỌC TO MỘT LẦN KHI MÀN KHẨN CẤP HIỆN — thêm 23/9/2026 ═════
 *
 * Đo trước đó: câu lệnh chỉ được đọc khi bác BẤM nút "Đọc to". Người đang hoảng
 * không bấm. Hook này đọc đúng MỘT câu (câu lệnh ngắn) ngay khi màn hiện.
 *
 * ⚠️ MỘT LẦN MỖI LƯỢT. Đọc lặp lại làm người ta hoảng thêm. `bat` về false (màn
 * đóng, kết quả bị xoá) thì cờ được đặt lại cho lượt sau.
 *
 * ⚠️ HỎNG THÌ IM LẶNG. Trình duyệt chặn phát tiếng hay máy thiếu giọng đọc thì
 * câu lệnh VẪN nằm trên màn; nút "Đọc to" vẫn báo lỗi như cũ khi bác tự bấm.
 *
 * ⚠️ CHỈ NÓI. Không gọi, không nhắn, không mạng (§12). `cau` phải đến từ catalog.
 */
export function useDocToMotLan(
  cau: string,
  bat: boolean,
  ngonNgu: string,
  khiBatDau?: () => void,
  khiXong?: () => void,
): void {
  const daDoc = useRef(false);
  useEffect(() => {
    if (!bat) { daDoc.current = false; return; }
    if (daDoc.current || !cau.trim()) return;
    daDoc.current = true;
    khiBatDau?.();
    void docTo(cau, ngonNgu).then(() => khiXong?.(), () => khiXong?.());
  }, [bat, cau, ngonNgu]);
}
