"""Tổng hợp phiếu khảo sát con cháu từ CSV Google Forms → ket-qua.json + câu để đưa lên slide.

Chạy:  python khao-sat/tong-hop.py duong-dan/phieu.csv
Cột được nhận theo số thứ tự ở đầu câu hỏi ("1.", "2.", …), nên giữ nguyên câu chữ trong PHIEU-CON-CHAU.md.
Chỉ đếm, không ước lượng, không làm tròn lên. Ghi đủ n cho từng câu (người bỏ qua không tính).
"""
import csv
import json
import pathlib
import re
import sys
from collections import Counter
from datetime import date

sys.stdout.reconfigure(encoding='utf-8')
if len(sys.argv) < 2:
    sys.exit('Cần đường dẫn CSV: python khao-sat/tong-hop.py phieu.csv')

rows = list(csv.DictReader(open(sys.argv[1], encoding='utf-8-sig', newline='')))
cot = {}
for h in (rows[0].keys() if rows else []):
    m = re.match(r'\s*(\d+)\.', h or '')
    if m:
        cot[int(m.group(1))] = h


def gt(r, q):
    return (r.get(cot.get(q, ''), '') or '').strip()


tong = len(rows)
hop_le = [r for r in rows if gt(r, 2).lower().startswith('có')]
n = len(hop_le)


def dem(q, nhieu=False):
    c = Counter()
    k = 0
    for r in hop_le:
        v = gt(r, q)
        if not v:
            continue
        k += 1
        for x in ([s.strip() for s in re.split(r';\s*|,\s+', v)] if nhieu else [v]):   # Google Forms nối bằng ", "
            if x:
                c[x] += 1
    return k, dict(c.most_common())


def pct(a, b):
    return f'{a}/{b} ({a / b * 100:.0f}%)' if b else f'{a}/0'


def thang(q):
    xs = [int(gt(r, q)) for r in hop_le if gt(r, q).isdigit()]
    return len(xs), (sum(xs) / len(xs) if xs else None), sum(1 for x in xs if x >= 4)


kq = {'ngay': date.today().isoformat(), 'tong_phieu': tong, 'phieu_hop_le': n}
kq['c3_tung_nhan'] = dem(3)
kq['c4_lo'] = thang(4)
kq['c5_dang_lam'] = dem(5, True)
kq['c6_goi_hoi'] = dem(6)
kq['c7_huu_ich'] = thang(7)
kq['c8_muc_gia'] = dem(8)
kq['c9_ngai'] = dem(9, True)
kq['c10_dung_thu'] = dem(10)
kq['c11_de_lai_lien_he'] = sum(1 for r in hop_le if gt(r, 11))

k8, g = kq['c8_muc_gia']
tra = sum(v for a, v in g.items() if a.lower().startswith('trả'))
k3, t3 = kq['c3_tung_nhan']
nhan = sum(v for a, v in t3.items() if a.lower().startswith('có'))
k10, t10 = kq['c10_dung_thu']
co10 = t10.get('Có', 0)
k4, tb4, cao4 = kq['c4_lo']
kq['cau_slide'] = [
    f'Khảo sát trực tuyến {kq["ngay"]}, n = {n} người có bố mẹ/ông bà 60+ (mạng quen biết, không đại diện).',
    f'{pct(nhan, k3)} cho biết bố mẹ/ông bà từng nhận cuộc gọi hoặc tin nhắn nghi lừa đảo trong 12 tháng.',
    f'{pct(cao4, k4)} lo ở mức 4–5/5.',
    f'{pct(tra, k8)} chọn trả phí (29.000 đ trở lên); đây là ý định, chưa phải doanh thu.',
    f'{pct(co10, k10)} muốn đăng ký dùng thử; {kq["c11_de_lai_lien_he"]} người để lại liên hệ.',
]

out = pathlib.Path(__file__).with_name('ket-qua.json')
out.write_text(json.dumps(kq, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Tổng {tong} phiếu, hợp lệ (có bố mẹ/ông bà 60+) {n}. Ghi {out}')
for s in kq['cau_slide']:
    print(' •', s)
