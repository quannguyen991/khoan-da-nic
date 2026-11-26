# Nhạc nền v3, SÔI ĐỘNG KIỂU EDM: 128 BPM, trống chạy ngay từ giây đầu (không còn đoạn mở thưa gây buồn ngủ), bass 16 nhấp nhả,
# hợp âm stab lệch nhịp, LEAD có giai điệu dễ nhớ, snare dồn + riser + khoảng lặng trước cú drop, sidechain bơm mạnh, tự hạ nhỏ khi có giọng đọc.
# Tự tổng hợp (numpy), không bản quyền. Đọc timeline.json. Chạy: python make_music.py
import json, os, subprocess
import numpy as np
from scipy.signal import butter, lfilter
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
tlj = json.load(open(os.path.join(HERE, 'timeline.json')))
TOTAL = tlj['total'] + 1.0
SR = 44100
N = int(TOTAL * SR)
BPM = 128
BEAT = 60.0 / BPM
BAR = 4 * BEAT
M = tlj['marks']
T_REV, T_TECH, T_OUT, T_END = M['reveal'], M['tech'], M['outcome'], M['end']
G0 = T_REV % BAR
rng = np.random.default_rng(128)


def q(t): return G0 + np.ceil((t - G0) / BAR - 1e-9) * BAR
Q_TECH, Q_OUT = q(T_TECH), q(T_OUT)

def mid(m): return 440.0 * 2 ** ((m - 69) / 12)
def bp(x, lo, hi, o=2):
    b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], btype='band'); return lfilter(b, a, x)
def lp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2)); return lfilter(b, a, x)
def hp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), btype='high'); return lfilter(b, a, x)
def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= len(buf): return
    m = min(len(sig), len(buf) - i)
    if m > 0: buf[i:i + m] += sig[:m] * g


# ---------------- âm sắc ----------------
def mk_kick():
    n = int(0.36 * SR); t = np.arange(n) / SR
    f = 44 + 150 * np.exp(-t * 45)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t * 260) * 0.5
    return np.tanh((body + click) * 1.4)
KICK = mk_kick()

def mk_clap():
    n = int(0.3 * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for d in (0.0, 0.011, 0.024):
        j = int(d * SR); m = n - j
        x[j:] += bp(rng.standard_normal(m), 1000, 4200) * np.exp(-np.arange(m) / SR * 50)
    x += bp(rng.standard_normal(n), 900, 3200) * np.exp(-t * 14) * 0.55
    return x * 0.85
CLAP = mk_clap()

def mk_snare():
    n = int(0.25 * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28)
    nz = bp(rng.standard_normal(n), 1500, 7000) * np.exp(-t * 22)
    return (tone * 0.5 + nz) * 0.9
SNARE = mk_snare()

def mk_hat(open_=False):
    n = int((0.3 if open_ else 0.05) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 8000) * np.exp(-t * (14 if open_ else 90))
HAT, OHAT = mk_hat(), mk_hat(True)

def bass_note(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    saw = sum(np.sin(2 * np.pi * k * f * t) / k for k in range(1, 9))
    x = lp(saw, 480) * 0.5 + lp(saw, 2600) * np.exp(-t * 18) * 0.55 + np.sin(2 * np.pi * f * t) * 0.9
    return np.tanh(x * 1.5) * np.minimum(t / 0.003, 1) * np.exp(-t * 2.6) * np.clip((dur - t) / 0.02, 0, 1)

def lead(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for dt in (0.988, 1.0, 1.012):
        x += sum(np.sin(2 * np.pi * k * f * dt * t) / k for k in range(1, 11))
    x = lp(x, 4200) * 0.33
    env = (0.35 + 0.65 * np.exp(-t * 7)) * np.minimum(t / 0.004, 1) * np.clip((dur - t) / 0.05, 0, 1)
    return np.tanh(x * 1.6) * env

def stab(tones, dur=0.2):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for m in tones:
        f = mid(m)
        for dt in (0.993, 1.007):
            x += sum(np.sin(2 * np.pi * k * f * dt * t) / k for k in range(1, 8))
    x = lp(x, 3000) * 0.07
    return x * np.exp(-t * 11) * np.minimum(t / 0.003, 1)

def pad(tones, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for m in tones:
        f = mid(m)
        for dt in (0.996, 1.004):
            x += sum(np.sin(2 * np.pi * k * f * dt * t) / k for k in range(1, 6))
    x = lp(x, 1600) * 0.04
    return x * np.minimum(t / 0.4, 1) * np.clip((dur - t) / 0.3, 0, 1)

def riser(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; r = t / dur
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    for lo, hi, st in ((300, 900, 0.0), (900, 2500, 0.25), (2500, 6000, 0.5), (6000, 12000, 0.7)):
        out += bp(nz, lo, hi) * np.clip((r - st) / 0.25, 0, 1)
    gl = 220 * (2600 / 220) ** r
    out += np.sin(2 * np.pi * np.cumsum(gl) / SR) * 0.4
    return out * (r ** 2) * 0.6 * g

def impact(g=1.0):
    n = int(1.7 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-t * 7)) / SR) * np.exp(-t * 2.4) * 1.2
    boom += lp(rng.standard_normal(n), 700) * np.exp(-t * 10) * 0.7
    boom += hp(rng.standard_normal(n), 4500) * np.exp(-t * 2.0) * 0.4
    return boom * g


# ---------------- cấp năng lượng ----------------
def level(t):
    if t < T_REV - 2 * BAR: return 0       # mở: trống chạy, bass, stab (chưa có lead)
    if t < T_REV: return 1                 # dồn
    if t < Q_TECH: return 2                # drop
    if t < Q_OUT: return 3                 # phần công nghệ: đầy nhất
    if t < T_END: return 5                 # kết quả: nhẹ lại, tươi sáng
    return 4                               # kết

CH_MOODY = [(45, [57, 60, 64, 67]), (41, [57, 60, 65, 69]), (48, [55, 60, 64, 67]), (43, [59, 62, 65, 67])]   # Am F C G
CH_HOPE = [(41, [57, 60, 64, 69]), (48, [55, 60, 64, 71]), (43, [59, 62, 67, 71]), (45, [57, 60, 64, 71])]    # F C G Am
MOTIF = [[76, 81, 84, 81, 76, 81, 79, 76], [77, 81, 84, 81, 77, 81, 79, 77], [76, 79, 84, 79, 76, 79, 74, 76], [74, 79, 83, 79, 74, 79, 77, 79]]

def chord_i(t):
    bi = int(np.floor((t - G0) / BAR))
    return (CH_HOPE if Q_OUT <= t else CH_MOODY), bi % 4

drums = np.zeros(N)
bed = np.zeros(N)
kicks = []
step = BEAT / 4
k = int(np.floor((0 - G0) / step)) + 1
t = G0 + k * step
while t < TOTAL - 0.2:
    if t >= 0:
        lv = level(t)
        s16 = int(round((t - G0) / step)) % 16
        sub = s16 % 4
        CH, ci = chord_i(t)
        root, tones = CH[ci]
        mot = MOTIF[ci] if CH is CH_MOODY else MOTIF[[1, 2, 3, 0][ci]]
        build = T_REV - 2 * BAR <= t < T_REV
        # --- kick
        if lv in (0, 2, 3, 5) and sub == 0:
            place(drums, KICK, t, 1.0 if lv != 5 else 0.85); kicks.append(t)
        elif lv == 1 and sub == 0:
            place(drums, KICK, t, 0.9); kicks.append(t)
        elif lv == 3 and s16 == 14:
            place(drums, KICK, t, 0.75); kicks.append(t)
        # --- snare/clap
        if lv in (0, 2, 3, 5) and s16 in (4, 12):
            place(drums, CLAP, t, 0.8); place(drums, SNARE, t, 0.5)
        if build:
            ramp = 0.25 + 0.7 * (t - (T_REV - 2 * BAR)) / (2 * BAR)
            if t < T_REV - BAR:
                if s16 in (4, 12): place(drums, SNARE, t, ramp)
            elif t < T_REV - BAR / 2:
                if sub in (0, 2): place(drums, SNARE, t, ramp)
            else:
                place(drums, SNARE, t, ramp)
        # --- hat
        if lv in (0, 5):
            if sub == 2: place(drums, OHAT, t, 0.16)
            elif sub == 0 and lv == 0: place(drums, HAT, t, 0.12)
        elif lv in (2, 3):
            place(drums, HAT if sub != 2 else OHAT, t, (0.18 if sub != 2 else 0.2))
            if lv == 3 and sub in (1, 3): place(drums, HAT, t, 0.1)
        # --- bass 16 nhấp nhả
        if lv in (0, 2, 3, 5):
            pat = [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1] if lv in (0, 2, 3) else [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0]
            if pat[s16]:
                up = 12 if s16 in (7, 11, 15) else 0
                place(bed, bass_note(mid(root - 12 + up), step * 1.7), t, 0.95)
        elif lv == 1 and sub == 0:
            place(bed, bass_note(mid(root - 12), BEAT * 0.9), t, 0.8)
        # --- stab lệch nhịp
        if lv in (0, 2, 3, 5) and s16 in (2, 6, 10, 14):
            place(bed, stab(tones), t, 1.0 if lv != 0 else 0.6)
        # --- lead (giai điệu) từ lúc drop
        if lv in (2, 3, 5) and sub in (0, 2):
            note = mot[(s16 // 2) % 8]
            g = 0.26 if lv != 5 else 0.18
            place(bed, lead(mid(note), step * 3.2), t, g)
            if lv == 3 and sub == 0:      # lên quãng tám ở phần công nghệ
                place(bed, lead(mid(note + 12), step * 2.2), t + step, 0.1)
        # --- pad theo ô
        if s16 == 0 and lv in (0, 1, 2, 3, 5):
            place(bed, pad(tones, BAR + 0.2), t, 1.0)
    t += step

# khoảng lặng ngắn ngay trước cú drop và các mốc lớn, rồi mới đấm
def gap(t_hit, dur):
    i0 = max(0, int((t_hit - dur) * SR)); i1 = min(N, int(t_hit * SR))
    drums[i0:i1] *= 0.0; bed[i0:i1] *= 0.0

gap(T_REV, BEAT * 0.5); gap(Q_TECH, BEAT * 0.25); gap(Q_OUT, BEAT * 0.25); gap(T_END, BEAT * 0.25)
place(drums, riser(2 * BAR, 1.0), T_REV - 2 * BAR); place(drums, impact(1.1), T_REV); kicks.append(T_REV)
place(drums, riser(BAR, 0.9), Q_TECH - BAR); place(drums, impact(1.0), Q_TECH); kicks.append(Q_TECH)
place(drums, riser(BAR, 0.7), Q_OUT - BAR); place(drums, impact(0.8), Q_OUT); kicks.append(Q_OUT)
place(drums, riser(BAR, 0.8), T_END - BAR); place(drums, impact(1.1), T_END); kicks.append(T_END)
place(bed, pad([57, 60, 64, 72, 76], 5.0), T_END, 1.6)
place(bed, lead(mid(88), 2.5), T_END, 0.2)

# sidechain bơm mạnh
sc = np.ones(N)
for tk in kicks:
    i = int(tk * SR); m = min(int(0.28 * SR), N - i)
    if m > 0: sc[i:i + m] *= (1 - 0.8 * np.exp(-np.arange(m) / SR / 0.09))

def reverb(x):
    out = x.copy()
    for d, g in ((0.043, 0.28), (0.071, 0.22), (0.113, 0.16), (0.167, 0.1)):
        j = int(d * SR); out[j:] += x[:-j] * g
    return lp(out, 9000)

def echo(x, d, gains=(0.4, 0.2)):
    out = x.copy()
    for n_, g in enumerate(gains, 1):
        j = int(d * SR * n_); out[j:] += x[:-j] * g
    return out

bed = echo(reverb(bed), BEAT * 0.75) * sc
mono = drums + bed

# hạ nhỏ khi có giọng đọc
g = np.zeros(N)
for a, d in tlj.get('vo', []):
    i0 = max(0, int((a - 0.12) * SR)); i1 = min(N, int((a + d + 0.15) * SR))
    g[i0:i1] = 1.0
kk = int(0.22 * SR)
g = np.convolve(g, np.ones(kk) / kk, mode='same')
mono *= 1 - 0.5 * np.clip(g, 0, 1)

Lc = mono
Rc = np.roll(mono, 67) * 0.95 + mono * 0.05
st = np.stack([Lc, Rc], axis=1)
fade = np.ones(N)
fi = int(0.5 * SR); fo = int(2.6 * SR)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
st *= fade[:, None]
pk = np.max(np.abs(st)); st = np.tanh(st / pk * 1.35) * 0.9
os.makedirs(os.path.join(HERE, 'assets', 'audio'), exist_ok=True)
wav = os.path.join(HERE, 'assets', 'audio', 'music.wav')
wavfile.write(wav, SR, (st * 32767).astype(np.int16))
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-b:a', '192k', os.path.join(HERE, 'assets', 'audio', 'music.mp3')], check=True)
os.remove(wav)
print('music ok', round(TOTAL, 1), 's', BPM, 'BPM')
