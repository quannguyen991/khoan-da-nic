import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ═════ LỜI NHẮN BẰNG GIỌNG CỦA CON — CHỈ NẰM TRÊN MÁY BỐ MẸ ═════
 * Phần 2 "Cầu dao gia đình", 23/9/2026. Người dùng chọn: "Chỉ trên máy bố mẹ".
 *
 * Kẻ lừa mượn uy "công an", "ngân hàng". Giọng của chính con mình có uy hơn — và
 * người đang hoảng không phải đọc chữ nào. Lời nhắn tự phát khi màn khẩn cấp hiện.
 *
 * ⚠️ KHÔNG CÓ ĐƯỜNG NÀO RA MẠNG. Không gửi lên máy chủ, không đồng bộ, không sao
 * lưu. Đổi máy thì phải ghi lại — giao diện nói thẳng điều đó. Có test quét nguồn
 * (`test/con-cai-giup.test.js`).
 * ⚠️ IndexedDB hỏng hay bị chặn (chế độ riêng tư) thì trả null — màn khẩn cấp
 * quay về giọng máy đọc câu lệnh, không sập.
 */
const TEN_DB = 'khoan-da-loi-nhan';
const KHO = 'loi_nhan';
const KHOA = 'con';

function moDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const r = indexedDB.open(TEN_DB, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(KHO); };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function luuLoiNhan(blob: Blob): Promise<boolean> {
  const db = await moDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(KHO, 'readwrite');
      tx.objectStore(KHO).put({ blob, luc: Date.now() }, KHOA);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

export async function docLoiNhan(): Promise<Blob | null> {
  const db = await moDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const r = db.transaction(KHO, 'readonly').objectStore(KHO).get(KHOA);
      r.onsuccess = () => resolve(r.result?.blob instanceof Blob ? r.result.blob : null);
      r.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function xoaLoiNhan(): Promise<void> {
  const db = await moDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(KHO, 'readwrite');
      tx.objectStore(KHO).delete(KHOA);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch { resolve(); }
  });
}

/** Lời nhắn hiện có, dạng URL phát được. `daTai=false` khi đang đọc IndexedDB. */
export function useLoiNhanCon(): { url: string | null; daTai: boolean; taiLai: () => void } {
  const [url, setUrl] = useState<string | null>(null);
  const [daTai, setDaTai] = useState(false);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    let huy = false;
    let taoRa: string | null = null;
    void docLoiNhan().then((blob) => {
      if (huy) return;
      if (blob) { taoRa = URL.createObjectURL(blob); setUrl(taoRa); } else setUrl(null);
      setDaTai(true);
    });
    return () => { huy = true; if (taoRa) URL.revokeObjectURL(taoRa); };
  }, [lan]);
  const taiLai = useCallback(() => setLan((x) => x + 1), []);
  return { url, daTai, taiLai };
}

/** Phát lời nhắn ĐÚNG MỘT LẦN khi `bat` đúng. Trình duyệt chặn thì im lặng (câu lệnh vẫn trên màn). */
export function usePhatMotLan(url: string | null, bat: boolean): void {
  const daPhat = useRef(false);
  useEffect(() => {
    if (!bat) { daPhat.current = false; return; }
    if (daPhat.current || !url) return;
    daPhat.current = true;
    try { void new Audio(url).play().catch(() => undefined); } catch { /* im lặng */ }
  }, [bat, url]);
}
