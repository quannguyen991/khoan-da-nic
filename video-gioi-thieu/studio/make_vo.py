# Tạo giọng đọc cục bộ (Kokoro) cho từng câu; ghi assets/vo/durations.json. Chạy: python make_vo.py
import os, json, subprocess, sys
from narr import NARR
HERE = os.path.dirname(os.path.abspath(__file__))
env = dict(os.environ, HYPERFRAMES_PYTHON=os.path.join(HERE, '.venv-tts', 'Scripts', 'python.exe'))
dur_path = os.path.join(HERE, 'assets', 'vo', 'durations.json')
durs = json.load(open(dur_path)) if os.path.exists(dur_path) else {}
os.makedirs(os.path.join(HERE, 'assets', 'vo'), exist_ok=True)
for sid, cues in NARR.items():
    for k, (disp, say) in enumerate(cues):
        name = f'{sid}_c{k + 1}'
        out = os.path.join(HERE, 'assets', 'vo', name + '.wav')
        if name in durs and os.path.exists(out):
            continue
        r = subprocess.run(['npx', '--yes', 'hyperframes', 'tts', say, '-o', out, '--voice', 'af_heart', '--speed', '1.15', '--json'],
                           cwd=HERE, env=env, capture_output=True, text=True, shell=True)
        try:
            j = json.loads(r.stdout.strip().splitlines()[-1])
            durs[name] = round(float(j['durationSeconds']), 3)
        except Exception as e:
            print('FAIL', name, r.stdout[-300:], r.stderr[-300:]); sys.exit(1)
        json.dump(durs, open(dur_path, 'w'), indent=1)
        print(name, durs[name], flush=True)
print('done', len(durs))
