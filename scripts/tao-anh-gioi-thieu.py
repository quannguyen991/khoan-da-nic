#!/usr/bin/env python3
"""
TẠO ẢNH MINH HOẠ cho trang /gioi-thieu qua AI Box (home.ai-box.vn, cổng tương thích OpenAI).

    python scripts/tao-anh-gioi-thieu.py            # tạo các ảnh còn thiếu (song song)
    python scripts/tao-anh-gioi-thieu.py --lai      # tạo lại tất cả
    python scripts/tao-anh-gioi-thieu.py --chi cuoc-goi con-chau

Cấu hình: codebrain/.env.local (AIBOX_BASE_URL, AIBOX_API_KEY — tệp bị .gitignore chặn),
hoặc biến môi trường cùng tên. Model ảnh: AIBOX_IMAGE_MODEL, mặc định qwen-image-3.0-pro.

⚠️ CHỈ VẼ CẢNH CÓ NGƯỜI, KHÔNG VẼ LẠI LINH VẬT. Linh vật đã có ảnh chuẩn (public/linh-vat/,
từ public/minh-hoa-*.webp); lời nhắc bằng chữ không cho ra đúng con linh vật đó, và một
linh vật "na ná" ở trang giới thiệu là sai nhận diện thương hiệu.
⚠️ ẢNH KHÔNG CÓ CHỮ (CLAUDE.md §4.4): mọi lời nhắc ghi "no text". Chữ của trang nằm trong
HTML — dịch được, đọc được bằng trình đọc màn hình.
⚠️ KHÔNG NGƯỜI THẬT, KHÔNG LOGO NGÂN HÀNG / CÔNG AN, KHÔNG KẺ LỪA (§11, §12): nhân vật là
hoạt hình 3D; cảnh cuộc gọi chỉ có người NHẬN, không dựng hình người gọi. Không trách móc,
không làm người già trông ngờ nghệch.
⚠️ KHOÁ KHÔNG BAO GIỜ ĐƯỢC IN RA. Đây là ảnh trang trí — KHÔNG dùng model ảnh trong
đường chấm rủi ro (§12).

Thư viện chuẩn + Pillow. Cloudflare của AI Box chặn tên máy khách mặc định của Python
(lỗi 1010), nên gửi kèm User-Agent riêng.
Đầu ra: public/anh-gioi-thieu/<ten>.webp (1400px, ~90–170 KB).
"""
import io, json, os, sys, time, threading, urllib.request
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
RA = GOC / 'public' / 'anh-gioi-thieu'
UA = 'Mozilla/5.0 (compatible; khoan-da-tools/1.0)'
MODEL_MAC_DINH = 'qwen-image-3.0-pro'

PHONG_CACH = (
    'Soft 3D clay-style illustration, friendly and calm, rounded smooth shapes, gentle studio '
    'lighting, pastel lavender and purple palette (#9e76ea, #ad8af0, #efe7ff) with small warm '
    'amber accents (#fbbf24), clean simple composition, generous empty space. '
    'The people are stylized 3D cartoon characters of Vietnamese appearance, not photorealistic, '
    'not real individuals. Absolutely no text, no letters, no numbers, no logos, no brand marks, '
    'no watermarks, no screens showing readable content anywhere in the image.'
)

ANH = {
    'cuoc-goi': (
        'A Vietnamese grandfather in his seventies sits alone at a small wooden table at home, '
        'pressing a smartphone to his ear with a worried, uncertain expression; the phone glows '
        'with an uneasy red light on his face, the room around him slightly dim with long shadows, '
        'a plain wall clock without numbers behind him. Feeling of pressure and isolation, but '
        'dignified and sympathetic. Only one person in the scene. Wide 3:2 composition.'
    ),
    'con-chau': (
        'A Vietnamese woman in her thirties sits at a desk with a laptop, glancing at her smartphone '
        'which glows with a soft purple alert light; she is already reaching to call her parent, with '
        'a caring, alert and calm expression. Warm bright home office, a small plant on the desk. '
        'Only one person in the scene. Wide 3:2 composition.'
    ),
    'truoc': (
        'A Vietnamese adult son sits on a sofa beside his elderly mother, both smiling and looking at '
        'her smartphone together as he helps her set it up; warm afternoon light through a window, a '
        'cup of tea on a small table, a soft lavender blanket, family closeness and trust. '
        'Wide 3:2 composition.'
    ),
}
KICH_THUOC = '1536x1024'


def doc_cau_hinh():
    env = dict(os.environ)
    tep = GOC / 'codebrain' / '.env.local'
    if tep.exists():
        for dong in tep.read_text(encoding='utf-8').splitlines():
            if '=' in dong and not dong.lstrip().startswith('#'):
                k, v = dong.split('=', 1)
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env


def tai_xuong(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=180) as r:
        return r.read()


def tao(ten, cfg, ket_qua):
    base = (cfg.get('AIBOX_BASE_URL') or 'https://home.ai-box.vn/v1').rstrip('/')
    than = {
        'model': cfg.get('AIBOX_IMAGE_MODEL') or MODEL_MAC_DINH,
        'prompt': f'{ANH[ten]} {PHONG_CACH}',
        'size': KICH_THUOC,
        'n': 1,
    }
    yc = urllib.request.Request(
        base + '/images/generations', data=json.dumps(than).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {cfg["AIBOX_API_KEY"]}', 'User-Agent': UA},
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(yc, timeout=280) as r:
            d = json.loads(r.read().decode())
        muc = d['data'][0]
        tho = tai_xuong(muc['url']) if muc.get('url') else __import__('base64').b64decode(muc['b64_json'])
        from PIL import Image
        im = Image.open(io.BytesIO(tho)).convert('RGB')
        im.thumbnail((1400, 1400))
        RA.mkdir(parents=True, exist_ok=True)
        dich = RA / f'{ten}.webp'
        im.save(dich, 'WEBP', quality=82, method=6)
        ket_qua[ten] = f'{im.size[0]}x{im.size[1]}, {dich.stat().st_size // 1024} KB, {time.time() - t0:.0f}s'
    except urllib.error.HTTPError as e:
        ket_qua[ten] = f'HTTP {e.code} {e.read().decode(errors="replace")[:200]}'
    except Exception as e:
        ket_qua[ten] = f'LỖI {type(e).__name__}: {str(e)[:160]}'


if __name__ == '__main__':
    cfg = doc_cau_hinh()
    if not cfg.get('AIBOX_API_KEY'):
        sys.exit('Thiếu AIBOX_API_KEY (codebrain/.env.local hoặc biến môi trường).')
    if '--chi' in sys.argv:
        chon = [t for t in sys.argv[sys.argv.index('--chi') + 1:] if t in ANH]
    elif '--lai' in sys.argv:
        chon = list(ANH)
    else:
        chon = [t for t in ANH if not (RA / f'{t}.webp').exists()]
    if not chon:
        print('Không còn ảnh nào cần tạo (dùng --lai để tạo lại).')
        sys.exit(0)
    print(f'Tạo {len(chon)} ảnh bằng {cfg.get("AIBOX_IMAGE_MODEL") or MODEL_MAC_DINH}: {", ".join(chon)} (mỗi ảnh ~50 giây, chạy song song)', flush=True)
    kq = {}
    luong = [threading.Thread(target=tao, args=(t, cfg, kq)) for t in chon]
    for l in luong: l.start()
    for l in luong: l.join()
    for t in chon:
        print(f'  {t}: {kq.get(t)}', flush=True)
