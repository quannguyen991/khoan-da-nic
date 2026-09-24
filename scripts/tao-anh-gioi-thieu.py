#!/usr/bin/env python3
"""
TẠO ẢNH MINH HOẠ cho trang /gioi-thieu bằng API ảnh cấu hình trong .env
(IMAGE_API_BASE / IMAGE_API_KEY / IMAGE_MODEL — cổng tương thích OpenAI).

    python scripts/tao-anh-gioi-thieu.py            # tạo ảnh còn thiếu
    python scripts/tao-anh-gioi-thieu.py --lai ten  # tạo lại một ảnh

⚠️ ẢNH KHÔNG CÓ CHỮ (CLAUDE.md §4.4 cấm chữ nướng vào ảnh): mọi lời nhắc đều ghi
"no text". Chữ của trang nằm trong HTML, dịch được, đọc được bằng trình đọc màn hình.
⚠️ KHÔNG LOGO NGÂN HÀNG / CÔNG AN THẬT, KHÔNG NGƯỜI THẬT (§12, §11): nhân vật là
hoạt hình 3D, linh vật là quả cầu tím của Khoan Đã (public/minh-hoa-1.webp).
⚠️ KHOÁ KHÔNG BAO GIỜ ĐƯỢC IN RA. Đây chỉ là ảnh trang trí cho trang giới thiệu —
KHÔNG dùng model ảnh trong đường chấm rủi ro (§12).

Đầu ra: public/anh-gioi-thieu/<ten>.webp (≤ 1400px, ~80–160 KB).
"""
import base64, io, json, os, sys, time, urllib.request
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
RA = GOC / 'public' / 'anh-gioi-thieu'

def doc_env():
    env = {}
    for dong in (GOC / '.env').read_text(encoding='utf-8').splitlines():
        if '=' in dong and not dong.lstrip().startswith('#'):
            k, v = dong.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env

PHONG_CACH = (
    'Soft 3D clay illustration, friendly and calm, rounded shapes, pastel lavender and '
    'purple palette (#9e76ea, #ad8af0, #efe7ff) with small warm amber accents (#fbbf24), '
    'gentle studio lighting, clean simple composition, generous empty space, plain very '
    'light lavender background. Absolutely no text, no letters, no numbers, no logos, '
    'no brand marks, no watermarks anywhere in the image. Characters are stylized 3D '
    'cartoon people of Vietnamese appearance, not photorealistic, not real individuals.'
)
LINH_VAT = (
    'The mascot is a small round lavender-purple blob creature with two green sprout '
    'leaves on top of its head, big glossy dark eyes, pink cheeks, a white oval belly, '
    'short arms and legs, holding a small white-and-purple shield with a leaf emblem.'
)

ANH = {
    'mo-dau': f'{LINH_VAT} It stands beside a smiling Vietnamese grandmother in her late '
              'sixties who holds a smartphone calmly; the mascot gently raises one hand as if '
              'saying "wait a moment". Warm, reassuring mood. Wide composition.',
    'cuoc-goi': 'A worried Vietnamese grandfather in his seventies sits alone at a small '
                'table at home, pressing a smartphone to his ear; the phone glows with an '
                'uneasy red light, long shadows, the room slightly dim and tense, a wall clock '
                'without numbers. Feeling of pressure and isolation. Wide composition.',
    'khoan-da': f'{LINH_VAT} It stands in the center holding up its shield, one palm raised '
                'in a calm "stop" gesture, a soft protective purple glow spreading around it '
                'like a bubble. Peaceful, steady mood. Square composition.',
    'con-chau': 'A Vietnamese woman in her thirties at a desk with a laptop looks at her '
                'smartphone which shows a soft purple alert glow; she is already reaching to '
                'call her parent, caring and alert expression. Wide composition.',
    'truoc': 'A Vietnamese adult son sits on a sofa beside his elderly mother, both looking at '
             'her smartphone together as he helps her set it up; warm afternoon light, a cup of '
             'tea on the table, family closeness. Wide composition.',
    'sau': f'{LINH_VAT} It holds a checklist clipboard (blank lines only, no writing) next to '
           'a round clock without numbers and a small calendar without numbers, looking '
           'supportive and steady. Square composition.',
}
KICH_THUOC = {'khoan-da': '1024x1024', 'sau': '1024x1024'}

def tao(ten, env):
    than = {
        'model': env.get('IMAGE_MODEL') or 'gpt-image-1.5',
        'prompt': f'{ANH[ten]} {PHONG_CACH}',
        'size': KICH_THUOC.get(ten, '1536x1024'),
        'n': 1,
    }
    yc = urllib.request.Request(
        env['IMAGE_API_BASE'].rstrip('/') + '/images/generations',
        data=json.dumps(than).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {env["IMAGE_API_KEY"]}'},
    )
    t0 = time.time()
    with urllib.request.urlopen(yc, timeout=300) as r:
        d = json.loads(r.read().decode())
    muc = d['data'][0]
    if muc.get('b64_json'):
        tho = base64.b64decode(muc['b64_json'])
    else:
        with urllib.request.urlopen(muc['url'], timeout=120) as r2:
            tho = r2.read()
    from PIL import Image
    im = Image.open(io.BytesIO(tho)).convert('RGB')
    im.thumbnail((1400, 1400))
    RA.mkdir(parents=True, exist_ok=True)
    dich = RA / f'{ten}.webp'
    im.save(dich, 'WEBP', quality=80, method=6)
    print(f'  {ten}: {im.size[0]}x{im.size[1]}, {dich.stat().st_size // 1024} KB, {time.time() - t0:.0f}s', flush=True)

if __name__ == '__main__':
    env = doc_env()
    for k in ('IMAGE_API_BASE', 'IMAGE_API_KEY'):
        if not env.get(k):
            sys.exit(f'Thiếu {k} trong .env')
    chon = sys.argv[sys.argv.index('--lai') + 1:] if '--lai' in sys.argv else [
        t for t in ANH if not (RA / f'{t}.webp').exists()]
    if '--chi' in sys.argv:
        chon = sys.argv[sys.argv.index('--chi') + 1:]
    for ten in chon:
        try:
            tao(ten, env)
        except urllib.error.HTTPError as e:
            print(f'  {ten}: HTTP {e.code} {e.read().decode(errors="replace")[:300]}', flush=True)
        except Exception as e:
            print(f'  {ten}: LỖI {type(e).__name__}: {str(e)[:200]}', flush=True)
