# Video Khoan Đã (EN) v3 — bóc tách tính năng + quy trình phân tích; 28 cảnh ngắn, nhịp nhanh.
# Chạy: python gen.py  (đọc assets/vo/durations.json do make_vo.py tạo)
import os, json, math
from narr import NARR

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
OV = 0.6
LEAD, GAP, TAIL = 0.25, 0.15, 0.30
DUR = json.load(open('assets/vo/durations.json'))

INK, SUB, W, SOFT = '#141032', '#4b4670', '#ffffff', '#d9ceff'

# (id, theme, free, hero, Dn, kiểu vào, nhãn mốc nhạc)
SPEC = [
 ('c01', 'dark',  ['R', 'T', 'B'], False, 5.4, 'none',  ''),
 ('c02', 'red',   ['T', 'B'],      False, 4.0, 'zoom',  ''),
 ('c03', 'deep',  ['T', 'B'],      False, 3.6, 'wipe',  ''),
 ('c04', 'peach', ['T', 'B'],      False, 4.6, 'iris:50:50', ''),
 ('c05', 'light', ['L', 'R', 'T', 'B'], True, 4.6, 'zoom', 'reveal'),
 ('c06', 'sky',   ['T', 'B'],      False, 5.4, 'focus', ''),
 ('c07', 'light', ['T', 'B'],      False, 4.2, 'wipe',  ''),
 ('c08', 'peach', ['T', 'B'],      False, 3.6, 'sweep', ''),
 ('c08a', 'sky',   ['T', 'B'],      False, 5.5, 'focus', ''),
 ('c08b', 'mint',  ['T', 'B'],      False, 5.7, 'wipe',  ''),
 ('c08c', 'deep',  ['T', 'B'],      False, 4.5, 'zoom',  ''),
 ('c08d', 'peach', ['T', 'B'],      False, 7.6, 'sweep', ''),
 ('c10', 'dark',  ['T', 'B'],      False, 5.4, 'focus', 'tech'),
 ('c11', 'deep',  ['T', 'B'],      False, 4.2, 'wipe',  ''),
 ('c12', 'dark',  ['T', 'B'],      False, 4.8, 'zoom',  ''),
 ('c13', 'deep',  ['T', 'B'],      False, 4.6, 'focus', ''),
 ('c14', 'dark',  ['T', 'B'],      False, 4.8, 'iris:20:50', ''),
 ('c15', 'red',   ['T', 'B'],      False, 4.0, 'sweep', ''),
 ('c16', 'red',   ['T', 'B'],      False, 3.4, 'zoom',  ''),
 ('c18', 'red',   ['T', 'B'],      False, 6.2, 'wipe',  ''),
 ('c20', 'peach', ['T', 'B', 'R'], False, 5.2, 'sweep', ''),
 ('c21', 'sky',   ['T', 'B'],      False, 4.0, 'focus', ''),
 ('c24', 'mint',  ['T', 'B'],      False, 5.0, 'iris:50:100', 'outcome'),
 ('c25', 'mint',  ['T', 'B'],      False, 3.8, 'focus', ''),
 ('c27', 'deep',  ['T', 'B'],      False, 5.6, 'zoom',  ''),
 ('c28', 'light', ['L', 'R', 'T', 'B'], True, 3.6, 'sweep', 'end'),
]

SCENES, t = [], 0.0
for sid, theme, free, hero, Dn, kind, mark in SPEC:
    cues = NARR[sid]
    ds = [DUR[f'{sid}_c{k + 1}'] for k in range(len(cues))]
    D = LEAD + sum(ds) + GAP * (len(ds) - 1) + TAIL
    D = min(max(D, Dn * 0.78), Dn * 1.5)
    if sid == 'c28': D += 0.8
    K = Dn / D
    offs, c = [], LEAD
    for d in ds:
        offs.append(c); c += d + GAP
    SCENES.append(dict(id=sid, theme=theme, free=free, hero=hero, Dn=Dn, kind=kind, mark=mark, D=D, K=K, start=t, cues=cues, ds=ds, offs=offs))
    t += D
TOTAL = round(t, 2)
LAST = len(SCENES) - 1

PRE = r"""
const master = gsap.timeline({ paused: true });
const tl = gsap.timeline();
master.add(tl, 0);
tl.timeScale(__K__);
const Q = s => document.querySelector(s);
const QA = s => [...document.querySelectorAll(s)];
function split(sel){const el=Q(sel);const txt=el.textContent;el.textContent='';const out=[];
  txt.split(' ').forEach((w,i,a)=>{const W=document.createElement('span');W.className='w';
    [...w].forEach(c=>{const s=document.createElement('span');s.className='ch';s.textContent=c;W.appendChild(s);out.push(s)});
    el.appendChild(W);if(i<a.length-1)el.appendChild(document.createTextNode(' '))});return out}
function count(sel,from,to,t,dur,fmt,ease){const o={v:from};Q(sel).textContent=fmt(from);
  tl.to(o,{v:to,duration:dur,ease:ease||'power3.out',onUpdate:()=>{Q(sel).textContent=fmt(o.v)}},t)}
function twinkle(sel,t,hold){tl.fromTo(sel,{scale:0,rotation:-70,opacity:0},{scale:1,rotation:0,opacity:1,duration:.5,ease:'back.out(2.2)'},t);
  tl.to(sel,{scale:0,rotation:70,opacity:0,duration:.6,ease:'power2.in'},t+(hold||.8))}
function rise(sel,t,o){o=o||{};tl.fromTo(sel,{opacity:0,y:o.y||50,scale:o.s||1,filter:'blur(14px)'},{opacity:1,y:0,scale:1,filter:'blur(0px)',duration:o.d||.7,ease:o.e||'power3.out',stagger:o.st||0},t)}
function flipChars(sel,t,o){o=o||{};const els=split(sel);
  tl.fromTo(els,{opacity:0,rotationX:-100,y:60,transformPerspective:800,transformOrigin:'50% 100%'},{opacity:1,rotationX:0,y:0,duration:o.d||.7,ease:'back.out(1.6)',stagger:o.st||.03},t)}
function flipEl(sel,t,o){o=o||{};tl.fromTo(sel,{opacity:0,rotationX:-80,y:50,transformPerspective:900,transformOrigin:'50% 100%'},{opacity:1,rotationX:0,y:0,duration:o.d||.7,ease:'back.out(1.5)'},t)}
function fly(sel,t,o){o=o||{};tl.fromTo(sel,{opacity:0,x:o.x===undefined?420:o.x,y:o.y||0,rotationY:o.ry===undefined?-55:o.ry,rotationX:o.rx||0,scale:o.s||.85,transformPerspective:1500},
  {opacity:1,x:0,y:0,rotationY:0,rotationX:0,scale:1,duration:o.d||.8,ease:o.e||'expo.out',stagger:o.st||0},t)}
function bob(sel,t,dur,amp){tl.to(sel,{y:'-='+(amp||10),duration:dur||1.4,ease:'sine.inOut',yoyo:true,repeat:1},t)}
function pulse(sel,t,sc){tl.fromTo(sel,{scale:1},{scale:sc||1.06,duration:.25,ease:'power2.out',yoyo:true,repeat:1,immediateRender:false},t)}
function hlg(sel,t,d){tl.fromTo(sel,{backgroundPosition:'0% 0'},{backgroundPosition:'100% 0',duration:d||2.2,ease:'sine.inOut'},t)}

function ttl(sel,t,kind,o){o=o||{};
  if(kind==='mask') tl.fromTo(sel,{clipPath:'inset(0px 0px 900px 0px)',y:70,opacity:1},{clipPath:'inset(0px 0px -60px 0px)',y:0,duration:o.d||.85,ease:'power3.out'},t);
  else if(kind==='type') tl.fromTo(sel,{clipPath:'inset(0px 900px 0px 0px)',opacity:1},{clipPath:'inset(0px -60px 0px 0px)',duration:o.d||.9,ease:'steps(22)'},t);
  else if(kind==='slam') tl.fromTo(sel,{opacity:0,scale:2.3,filter:'blur(16px)',transformOrigin:'0% 50%'},{opacity:1,scale:1,filter:'blur(0px)',duration:.45,ease:'power4.out'},t);
  else if(kind==='slide') tl.fromTo(sel,{opacity:0,x:-520,skewX:24},{opacity:1,x:0,skewX:0,duration:.8,ease:'power4.out'},t);
  else if(kind==='drop') tl.fromTo(sel,{opacity:0,y:-300},{opacity:1,y:0,duration:.95,ease:'bounce.out'},t);
  else if(kind==='zoomout') tl.fromTo(sel,{opacity:0,scale:.35,filter:'blur(14px)',transformOrigin:'0% 50%'},{opacity:1,scale:1,filter:'blur(0px)',duration:.8,ease:'back.out(1.4)'},t);
  else if(kind==='skew') tl.fromTo(sel,{opacity:0,y:90,skewY:8,filter:'blur(10px)'},{opacity:1,y:0,skewY:0,filter:'blur(0px)',duration:.8,ease:'expo.out'},t);
  else flipEl(sel,t,o);}
function ent(sel,t,kind,o){o=o||{};let f,to;
  if(kind==='zig'){f={opacity:0,x:i=>i%2?780:-780,skewX:i=>i%2?-16:16};to={opacity:1,x:0,skewX:0,duration:.75,ease:'power4.out'};}
  else if(kind==='drop'){f={opacity:0,y:-460};to={opacity:1,y:0,duration:.95,ease:'bounce.out'};}
  else if(kind==='pop'){f={opacity:0,scale:0};to={opacity:1,scale:1,duration:.6,ease:'back.out(2.6)'};}
  else if(kind==='wipe'){f={opacity:0,clipPath:'inset(-80px 1100px -80px -80px)'};to={opacity:1,clipPath:'inset(-80px -80px -80px -80px)',duration:.8,ease:'power3.inOut'};}
  else if(kind==='wipeup'){f={opacity:0,clipPath:'inset(1100px -80px -80px -80px)',y:80};to={opacity:1,clipPath:'inset(-80px -80px -80px -80px)',y:0,duration:.9,ease:'power3.out'};}
  else if(kind==='swing'){f={opacity:0,rotation:-75,y:-60,transformOrigin:'0% 0%'};to={opacity:1,rotation:0,y:0,duration:1.1,ease:'elastic.out(1,.55)'};}
  else if(kind==='zoom'){f={opacity:0,scale:2.4,filter:'blur(18px)'};to={opacity:1,scale:1,filter:'blur(0px)',duration:.7,ease:'power3.out'};}
  else if(kind==='slam'){f={opacity:0,scale:1.9};to={opacity:1,scale:1,duration:.32,ease:'power4.out'};}
  else if(kind==='flipx'){f={opacity:0,rotationX:-100,transformOrigin:'50% 0%',transformPerspective:900};to={opacity:1,rotationX:0,duration:.8,ease:'back.out(1.5)'};}
  else if(kind==='spiral'){f={opacity:0,rotation:140,scale:.15};to={opacity:1,rotation:0,scale:1,duration:.9,ease:'back.out(1.4)'};}
  else if(kind==='scatter'){f={opacity:0,x:i=>[-760,560,-340,820,-620][i%5],y:i=>[-320,420,-520,300,520][i%5],rotation:i=>[-40,30,-22,46,-36][i%5],scale:.7};to={opacity:1,x:0,y:0,rotation:0,scale:1,duration:.85,ease:'power3.out'};}
  else {f={opacity:0,y:420};to={opacity:1,y:0,duration:1,ease:'elastic.out(1,.6)'};}
  to.stagger=o.st||0; tl.fromTo(sel,f,to,t);}
"""

def entrance(kind, p, OVK):
    w = f"#{p}wrap"
    if kind == 'none': return ''
    if kind == 'focus':
        return f"tl.fromTo('{w}',{{opacity:0,filter:'blur(22px)',scale:1.06}},{{opacity:1,filter:'blur(0px)',scale:1,duration:{OVK:.2f},ease:'power2.out'}},0);"
    if kind.startswith('iris'):
        _, x, y = kind.split(':')
        return f"tl.fromTo('{w}',{{clipPath:'circle(0% at {x}% {y}%)'}},{{clipPath:'circle(150% at {x}% {y}%)',duration:{OVK * 1.1:.2f},ease:'power2.inOut'}},0);"
    if kind == 'sweep':
        return (f"tl.fromTo('{w}',{{opacity:0,filter:'blur(12px)'}},{{opacity:1,filter:'blur(0px)',duration:{OVK * .8:.2f},ease:'power2.out'}},{OVK * .12:.2f});"
                f"tl.fromTo('#{p}leak',{{x:-1100}},{{x:2500,duration:{OVK * 1.3:.2f},ease:'power2.inOut'}},0);"
                f"tl.fromTo('#{p}leak',{{opacity:0}},{{opacity:1,duration:{OVK * .4:.2f},ease:'power1.out'}},0);"
                f"tl.to('#{p}leak',{{opacity:0,duration:{OVK * .5:.2f},ease:'power1.in'}},{OVK * .65:.2f});")
    if kind == 'zoom':
        return f"tl.fromTo('{w}',{{opacity:0,scale:1.45,filter:'blur(20px)'}},{{opacity:1,scale:1,filter:'blur(0px)',duration:{OVK * 1.1:.2f},ease:'power3.out'}},0);"
    if kind == 'wipe':
        return f"tl.fromTo('{w}',{{clipPath:'polygon(0% 0%,0% 0%,-30% 100%,-30% 100%)'}},{{clipPath:'polygon(0% 0%,135% 0%,105% 100%,-30% 100%)',duration:{OVK * 1.05:.2f},ease:'power3.inOut'}},0);"
    return ''

# ---------------------------------------------------------------- icon + thành phần
IC = {
 'mic': '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
 'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
 'phone-in': '<path d="M16 2v6h6"/><path d="m22 2-6 6"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
 'phone-off': '<path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="22" x2="2" y1="2" y2="22"/>',
 'shield-alert': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
 'card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
 'lock': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
 'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
 'help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
 'warn': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
 'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
 'bank': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
 'scissors': '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="M14.47 14.48 20 20"/><path d="M8.12 8.12 12 12"/>',
 'braces': '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
 'cpu': '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2"/>',
 'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 'scale': '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7a4 4 0 0 0 6 0z"/><path d="M19 7l-3 7a4 4 0 0 0 6 0z"/>',
 'check': '<path d="M20 6 9 17l-5-5"/>',
 'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
 'scan': '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>',
 'message': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
 'plug-off': '<path d="M9 2v6"/><path d="M15 2v6"/><path d="M12 17v5"/><path d="M5 8h14"/><path d="M6 11V8h12v3a6 6 0 0 1-12 0Z"/><line x1="2" x2="22" y1="2" y2="22"/>',
}
def ic(name, stroke='currentColor', size=None):
    st = f' style="width:{size}px;height:{size}px"' if size else ''
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="{stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"{st}>{IC[name]}</svg>'

def spark(id, x, y, size=56, color='#ffffff'):
    return (f'<svg id="{id}" class="sp" style="left:{x}px;top:{y}px;width:{size}px;height:{size}px;opacity:0" viewBox="0 0 24 24">'
            f'<path fill="{color}" d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z"/></svg>')

def head(kicker, title, x=200, y=190, w=760, size=108, dark=False, hl=None):
    kc = SOFT if dark else '#5a2cc4'
    tc = W if dark else INK
    t = title if hl is None else title.replace(hl, f'<span class="{"hlw" if dark else "hl"}">{hl}</span>')
    return (f'<div id="§hk" class="kicker abs" style="left:{x}px;top:{y}px;color:{kc}">{kicker}</div>'
            f'<div id="§ht" class="t abs" style="left:{x}px;top:{y + 60}px;width:{w}px;font-size:{size}px;color:{tc}">{t}</div>')

def rail(n, dark=True):
    segs = ''
    for i in range(1, 8):
        if i < n: bg = '#8f6dff'
        elif i == n: bg = 'linear-gradient(90deg,#ff7ad9,#8f6dff)'
        else: bg = 'rgba(255,255,255,.22)'
        segs += f'<div id="§rl{i}" style="width:200px;height:12px;border-radius:8px;background:{bg}"></div>'
    return (f'<div id="§rail" class="abs" style="left:200px;top:96px;display:flex;gap:14px;align-items:center">{segs}'
            f'<span class="label" style="margin-left:14px;font-size:30px;font-weight:600;color:{SOFT}">STEP {n} / 7</span></div>')

S = {}


# ================================================================= c01 hook
S['c01'] = dict(
 html=('<svg class="abs" style="left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">'
       + ''.join(f'<circle id="§r{i}" cx="1500" cy="540" r="250" fill="none" stroke="#d9c8ff" stroke-width="5" style="transform-box:fill-box;transform-origin:center;opacity:0"/>' for i in range(5))
       + '</svg>'
       '<div id="§call" class="abs" style="left:1260px;top:290px;width:480px;border-radius:56px;background:rgba(255,255,255,.96);padding:44px 40px 40px;text-align:center;font-family:Outfit;box-shadow:0 36px 90px rgba(20,10,70,.4)">'
       f'<div style="width:140px;height:140px;border-radius:50%;margin:0 auto;background:#e7e2f7;display:flex;align-items:center;justify-content:center"><div style="width:76px;height:76px">{ic("user", "#6a6490")}</div></div>'
       '<div style="font-size:44px;font-weight:700;color:#141032;margin-top:24px;white-space:nowrap">Unknown number</div>'
       '<div style="display:flex;align-items:center;justify-content:center;gap:14px;font-size:36px;font-weight:500;color:#4b4670;margin-top:6px"><span id="§cd" style="width:24px;height:24px;border-radius:50%;background:#d6203b;display:inline-block"></span>calling…</div>'
       f'<div style="display:flex;justify-content:center;gap:56px;margin-top:34px"><div style="width:120px;height:120px;border-radius:50%;background:#d6203b;display:flex;align-items:center;justify-content:center"><div style="width:58px;height:58px">{ic("phone-off", "#fff")}</div></div>'
       f'<div style="width:120px;height:120px;border-radius:50%;background:#0c9068;display:flex;align-items:center;justify-content:center"><div style="width:58px;height:58px">{ic("phone", "#fff")}</div></div></div></div>'
       '<div class="abs" style="left:200px;top:290px;color:#fff;width:1040px">'
       '<div id="§l1" class="t" style="font-size:112px;white-space:nowrap">“This is the police.”</div>'
       '<div id="§l2" class="t" style="font-size:112px;white-space:nowrap">“Do not hang up.”</div>'
       '<div id="§l3" class="t" style="font-size:112px;white-space:nowrap">“Tell no one.”</div>'
       '<div id="§l4" class="t hlw" style="font-size:126px;margin-top:22px">Transfer now.</div></div>'
       + spark('§sp1', 760, 860, 60) + spark('§sp2', 1180, 250, 44, '#ffd3f6') + spark('§sp3', 1790, 840, 52, '#cfe8ff')),
 js="""
tl.to('#§call',{keyframes:{x:[0,-9,9,-7,7,-4,4,0]},duration:.7,ease:'none'},.3);
tl.to('#§call',{keyframes:{x:[0,-9,9,-7,7,-4,4,0]},duration:.7,ease:'none'},1.8);
tl.fromTo('#§cd',{scale:1},{scale:1.55,duration:.4,yoyo:true,repeat:6,ease:'sine.inOut'},.2);
[.2,.9,1.6,2.3,3.0].forEach((t,i)=>tl.fromTo('#§r'+i,{scale:.15,opacity:.75},{scale:3.3,opacity:0,duration:2.0,ease:'power1.out'},t));
const B=split('#§l2'),C=split('#§l3');
const op={opacity:0,rotationX:-100,y:60,transformPerspective:800,transformOrigin:'50% 100%'},to={opacity:1,rotationX:0,y:0,duration:.6,ease:'back.out(1.5)',stagger:.025};
tl.fromTo(B,op,to,1.4); tl.fromTo(C,op,to,2.0);
tl.fromTo('#§l4',{opacity:0,scale:.8,y:50,filter:'blur(22px)',rotationX:-60,transformPerspective:900},{opacity:1,scale:1,y:0,rotationX:0,filter:'blur(0px)',duration:.9,ease:'expo.out'},2.7);
hlg('#§l4',2.7,2.2);
twinkle('#§sp1',3.2); twinkle('#§sp2',3.5); twinkle('#§sp3',3.8);
""")

# ================================================================= c02 losses
S['c02'] = dict(
 html=('<div id="§k" class="kicker" style="position:absolute;left:0;width:1920px;top:190px;text-align:center;color:#d9ceff">Recorded losses · Jan–Nov 2025</div>'
       '<svg class="abs" style="left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080"><circle id="§sw" cx="960" cy="480" r="260" fill="none" stroke="#ff9be8" stroke-width="6" style="transform-box:fill-box;transform-origin:center;opacity:0"/></svg>'
       '<div id="§n" class="t" style="position:absolute;left:0;width:1920px;top:250px;text-align:center;font-size:420px;font-weight:800;letter-spacing:-.04em;line-height:1;color:#fff;white-space:nowrap">0</div>'
       '<div id="§u" class="t" style="position:absolute;left:0;width:1920px;top:690px;text-align:center;font-size:110px"><span class="hlw">billion VND</span></div>'
       '<div id="§s" class="label" style="position:absolute;left:0;width:1920px;top:830px;text-align:center;font-size:32px;color:#d9ceff">Source: Ministry of Public Security</div>'
       + spark('§sp1', 330, 300, 60) + spark('§sp2', 1500, 260, 50, '#ffd3f6') + spark('§sp3', 1420, 740, 40, '#cfe8ff')),
 js="""
rise('#§k',.2,{y:24,d:.5}); count('#§n',0,6000,.3,1.9,v=>Math.round(v).toLocaleString('en-US')+'+');
tl.fromTo('#§n',{opacity:0,rotationX:-70,y:90,transformPerspective:900,transformOrigin:'50% 100%'},{opacity:1,rotationX:0,y:0,duration:.8,ease:'back.out(1.4)'},.25);
tl.fromTo('#§sw',{scale:.3,opacity:.8},{scale:3.4,opacity:0,duration:1.6,ease:'power2.out'},1.9);
tl.fromTo('#§n',{scale:1.06},{scale:1,duration:.5,ease:'back.out(2)',immediateRender:false},2.1);
flipEl('#§u',1.7,{d:.7}); rise('#§s',2.2,{y:20,d:.5});
twinkle('#§sp1',2.0); twinkle('#§sp2',2.3); twinkle('#§sp3',2.6);
""")

# ================================================================= c03 report 32%
def dotgrid():
    out = ''
    for i in range(100):
        r, c = divmod(i, 10)
        out += f'<div id="§d{i}" style="position:absolute;left:{c * 56}px;top:{r * 56}px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.18)"></div>'
    return out
S['c03'] = dict(
 html=('<div id="§k" class="kicker abs" style="left:200px;top:170px;color:#d9ceff">Victims who report it</div>'
       f'<div class="abs" style="left:200px;top:260px;width:560px;height:560px">{dotgrid()}</div>'
       '<div id="§p" class="t" style="position:absolute;left:880px;top:300px;font-size:380px;font-weight:800;letter-spacing:-.04em;line-height:1;color:#fff;white-space:nowrap">0%</div>'
       '<div id="§pl" class="t" style="position:absolute;left:890px;top:660px;font-size:84px;color:#fff;width:800px">of victims <span class="hlw">report it</span></div>'
       '<div id="§ps" class="label" style="position:absolute;left:890px;top:790px;font-size:32px;color:#d9ceff">NCA survey · 60,300 people · Dec 2025</div>'
       + spark('§sp1', 1600, 230, 56) + spark('§sp2', 1700, 780, 40, '#ffd3f6')),
 js="""
rise('#§k',.2,{y:24,d:.5});
tl.fromTo(QA('[id^="§d"]').filter(e=>/§d\\d+$/.test(e.id)),{scale:0,opacity:0},{scale:1,opacity:1,duration:.3,stagger:.006,ease:'back.out(2)'},.2);
const lit=[];for(let i=0;i<32;i++)lit.push(Q('#§d'+i));
tl.to(lit,{backgroundColor:'#ff6fd6',boxShadow:'0 0 22px rgba(255,111,214,.9)',duration:.25,stagger:.045,ease:'power2.out'},1.0);
count('#§p',0,32,1.0,1.5,v=>Math.round(v)+'%');
tl.fromTo('#§p',{opacity:0,x:80},{opacity:1,x:0,duration:.6,ease:'power3.out'},.9);
flipEl('#§pl',1.9,{d:.7}); rise('#§ps',2.3,{y:20,d:.5});
twinkle('#§sp1',2.2); twinkle('#§sp2',2.6);
""")

# ================================================================= c04 gap
S['c04'] = dict(
 html=('<div class="abs" style="left:200px;top:210px;width:1000px">'
       '<div style="position:relative;display:inline-block"><div id="§b1" class="t thin" style="font-size:84px;white-space:nowrap;color:#4b4670">They don’t lack knowledge.</div>'
       '<div id="§st" class="strike" style="left:0;top:50px;width:100%"></div></div>'
       '<div id="§b2" class="t" style="font-size:170px;margin-top:34px">They lack</div>'
       '<div id="§b3" class="t" style="font-size:170px"><span class="hl">60 seconds</span></div>'
       '<div id="§b4" class="t thin" style="font-size:60px;margin-top:24px;color:#4b4670">— and someone to ask.</div></div>'
       '<svg class="abs" style="left:1130px;top:230px" width="560" height="560" viewBox="0 0 320 320">'
       '<defs><linearGradient id="§tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a34d6"/><stop offset="1" stop-color="#b85cff"/></linearGradient></defs>'
       '<g id="§ticks"></g>'
       '<circle cx="160" cy="160" r="112" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="16"/>'
       '<circle id="§arc" cx="160" cy="160" r="112" fill="none" stroke="url(#§tg)" stroke-width="16" stroke-linecap="round" transform="rotate(-90 160 160)" stroke-dasharray="703.7" stroke-dashoffset="0"/>'
       '<text id="§tn" x="160" y="190" text-anchor="middle" font-size="104" font-weight="800" fill="#141032" font-family="Outfit">60</text></svg>'
       + spark('§sp1', 1650, 250, 50) + spark('§sp2', 1180, 760, 38, '#ffd3f6')),
 js="""
const NS='http://www.w3.org/2000/svg';const G=Q('#§ticks');const ticks=[];
for(let i=0;i<60;i++){const a=(i*6-90)*Math.PI/180;const l=document.createElementNS(NS,'line');
  l.setAttribute('x1',160+Math.cos(a)*134);l.setAttribute('y1',160+Math.sin(a)*134);
  l.setAttribute('x2',160+Math.cos(a)*(i%5==0?152:146));l.setAttribute('y2',160+Math.sin(a)*(i%5==0?152:146));
  l.setAttribute('stroke','#723fd9');l.setAttribute('stroke-width',i%5==0?4:2.4);l.setAttribute('stroke-linecap','round');G.appendChild(l);ticks.push(l)}
rise('#§b1',.4,{y:34,d:.5});
tl.fromTo('#§st',{scaleX:0,transformOrigin:'0% 50%'},{scaleX:1,duration:.4,ease:'power3.out'},1.1);
tl.to('#§b1',{opacity:.35,duration:.4},1.4);
flipEl('#§b2',1.7,{d:.7}); flipEl('#§b3',2.0,{d:.8}); hlg('#§b3 .hl',2.0,2.0);
rise('#§b4',3.0,{y:30,d:.6});
tl.fromTo(ticks,{opacity:0},{opacity:1,duration:.25,stagger:.01},1.7);
tl.fromTo('#§arc',{strokeDashoffset:0},{strokeDashoffset:703.7,duration:2.4,ease:'none'},2.2);
tl.to(ticks,{opacity:.14,duration:.2,stagger:.04},2.2);
count('#§tn',60,0,2.2,2.4,v=>Math.round(v),'none');
twinkle('#§sp1',2.0); twinkle('#§sp2',2.8);
""")

# ================================================================= c05 reveal
S['c05'] = dict(
 html=('<div id="§halo" class="abs" style="left:700px;top:40px;width:520px;height:520px;border-radius:50%;border:5px solid rgba(255,255,255,.7);opacity:0"></div>'
       '<img id="§logo" class="abs" src="assets/logo-512.png" style="left:770px;top:110px;width:380px;height:380px;border-radius:88px;opacity:0;box-shadow:0 40px 100px rgba(114,63,217,.45)">'
       '<div id="§wm" class="t" style="position:absolute;left:0;width:1920px;top:520px;text-align:center;font-size:140px">Khoan Đã</div>'
       '<div id="§sub" class="t thin" style="position:absolute;left:0;width:1920px;top:690px;text-align:center;font-size:48px;color:#3a3560">Vietnamese for “hold on”</div>'
       '<div style="position:absolute;left:0;width:1920px;top:770px;text-align:center;font-size:76px;display:flex;justify-content:center;gap:34px">'
       '<span id="§g1" class="t"><span class="hl">Pause.</span></span><span id="§g2" class="t"><span class="hl">Verify.</span></span><span id="§g3" class="t"><span class="hl">Protect.</span></span></div>'
       + spark('§sp1', 640, 200, 60) + spark('§sp2', 1230, 180, 48, '#ffd3f6') + spark('§sp3', 560, 480, 40, '#cfe8ff')
       + spark('§sp4', 1290, 450, 56) + spark('§sp5', 900, 90, 36, '#ffd3f6')),
 js="""
tl.fromTo('#§logo',{opacity:0,scale:.3,rotation:-14,y:80},{opacity:1,scale:1,rotation:0,y:0,duration:.9,ease:'back.out(1.8)'},.3);
tl.fromTo('#§halo',{opacity:.9,scale:.7},{opacity:0,scale:1.6,duration:1.2,ease:'power2.out'},.5);
tl.to('#§logo',{y:-14,duration:1.4,yoyo:true,repeat:1,ease:'sine.inOut'},1.3);
flipChars('#§wm',1.0,{st:.045});
rise('#§sub',1.7,{y:30,d:.6});
['#§g1','#§g2','#§g3'].forEach((s,i)=>tl.fromTo(s,{opacity:0,y:60,scale:.6,rotationX:-70,transformPerspective:800},{opacity:1,y:0,scale:1,rotationX:0,duration:.6,ease:'back.out(2)'},2.2+i*.28));
['#§sp1','#§sp2','#§sp3','#§sp4','#§sp5'].forEach((s,i)=>twinkle(s,.6+i*.16));
""")

# ================================================================= c06 four buttons
PILLS = [('purple', 'mic', '#6a34d6', 'Talk to me'), ('green', 'phone', '#067a55', 'Add Contact'), ('red', 'shield-alert', '#c01c1c', 'Emergency'), ('blue', 'phone-in', '#1d4ed8', 'Someone calling you?')]
S['c06'] = dict(
 html=(head('The app', 'One screen. Four big buttons.', y=130, w=1560, size=100, hl='Four big')
       + ''.join(f'<div id="§p{i + 1}" class="ui-pill ui-{c} abs" style="left:{200 + (i % 2) * 780}px;top:{440 + (i // 2) * 200}px;width:740px;font-size:46px;padding:0 40px 0 24px;gap:28px"><div class="ui-ic">{ic(n, col)}</div>{lab}</div>' for i, (c, n, col, lab) in enumerate(PILLS))
       + spark('§sp1', 840, 130, 50) + spark('§sp2', 1790, 860, 44, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.5}); ttl('#§ht',.35,'mask',{d:.8}); hlg('#§ht .hl',.5,2.0);
ent(['#§p1','#§p2','#§p3','#§p4'],.5,'zig',{st:.32});
['#§p1','#§p2','#§p3','#§p4'].forEach((p,i)=>{ 
  tl.fromTo(p,{boxShadow:'0 26px 60px rgba(40,20,90,.28)'},{boxShadow:'0 30px 90px rgba(255,255,255,.7)',duration:.35,yoyo:true,repeat:1,immediateRender:false},1.5+i*.5);
  bob(p,2.4+i*.12,1.1,8); });
twinkle('#§sp1',1.6); twinkle('#§sp2',2.6);
""")

# ================================================================= c07 options
OPTS = [('card', '#b91c1c', '#fde3e3', 'Transfer or withdraw money'), ('lock', '#a85a00', '#ffefc9', 'Give an OTP or password'),
        ('download', '#6a34d6', '#efe5ff', 'Install an app or tap a link'), ('file', '#1d4ed8', '#e0ebff', 'Send ID or document photos'), ('help', '#334155', '#e8ebf2', 'I am not sure / something else')]
S['c07'] = dict(
 html=(head('Someone is calling?', 'What are they asking you to do?', y=130, w=1560, size=92, hl='asking')
       + ''.join(f'<div id="§o{i + 1}" class="ui-opt abs" style="left:{200 + i * 309}px;top:380px;width:284px;height:440px;flex-direction:column;justify-content:center;text-align:center;gap:26px;padding:24px 18px;font-size:38px;border-radius:44px"><div class="oi" style="background:{bg}">{ic(n, col)}</div>{lab}</div>' for i, (n, col, bg, lab) in enumerate(OPTS))
       + spark('§sp1', 840, 110, 50) + spark('§sp2', 1790, 880, 44, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.5}); ttl('#§ht',.35,'type',{d:.8}); hlg('#§ht .hl',.5,2.0);
ent(['#§o1','#§o2','#§o3','#§o4','#§o5'],.5,'scatter',{st:.15});
tl.to(['#§o1','#§o3','#§o4','#§o5'],{opacity:.35,scale:.96,duration:.4,ease:'power2.out'},2.0);
tl.to('#§o2',{scale:1.1,y:-26,duration:.45,ease:'back.out(2)'},2.0);
tl.fromTo('#§o2',{boxShadow:'0 22px 56px rgba(60,30,130,.22)'},{boxShadow:'0 0 0 10px rgba(255,200,60,.9),0 30px 80px rgba(255,170,0,.5)',duration:.5,yoyo:true,repeat:3,ease:'sine.inOut',immediateRender:false},2.1);
twinkle('#§sp1',1.4); twinkle('#§sp2',2.6);
""")

# ================================================================= c08 yes / no
S['c08'] = dict(
 html=(head('Then two questions', 'Yes or no.', y=380, w=640, size=132, hl='no')
       + '<div id="§bn" class="ui-banner abs" style="left:860px;top:80px;width:860px;font-size:46px;padding:28px 44px">Whatever happens: do not read out any code.</div>'
       '<div id="§q1" class="ui-qcard abs" style="left:860px;top:280px;width:860px;padding:30px 44px"><div class="ql">Let me ask you:</div><div class="qt" style="font-size:48px">Are they asking you to transfer, deposit, or withdraw money?</div></div>'
       '<div id="§q2" class="ui-qcard abs" style="left:860px;top:280px;width:860px;opacity:0;padding:30px 44px"><div class="ql">Let me ask you:</div><div class="qt" style="font-size:48px">Are they telling you not to hang up, to stay on the line?</div></div>'
       '<div id="§pg" class="ui-prog abs" style="left:860px;top:582px;width:860px"><i id="§pgi" style="width:50%"></i></div>'
       '<div id="§yes" class="ui-yes abs" style="left:860px;top:634px;width:860px;height:120px;font-size:46px">Yes, that is what they said</div>'
       '<div id="§no" class="ui-no abs" style="left:860px;top:776px;width:860px;height:96px;font-size:38px">No, not that</div>'
       + spark('§sp1', 840, 110, 50) + spark('§sp2', 1790, 700, 44, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.5}); ttl('#§ht',.35,'slam',{d:.8}); hlg('#§ht .hl',.5,2.0);
ent('#§bn',.4,'drop');
ent('#§q1',.6,'swing');
tl.fromTo('#§pg',{opacity:0,scaleX:.2},{opacity:1,scaleX:1,duration:.5,ease:'power3.out'},.9);
ent('#§yes',1.0,'pop');
ent('#§no',1.2,'wipe');
pulse('#§yes',1.8,1.05);
tl.to('#§q1',{rotationX:-90,opacity:0,duration:.4,ease:'power2.in',transformPerspective:1300},2.3);
tl.fromTo('#§q2',{rotationX:90,opacity:0,transformPerspective:1300},{rotationX:0,opacity:1,duration:.5,ease:'back.out(1.6)',immediateRender:false},2.6);
tl.to('#§pgi',{width:'100%',duration:.5,ease:'power2.inOut'},2.6);
pulse('#§yes',3.3,1.05);
twinkle('#§sp1',1.4); twinkle('#§sp2',3.0);
""")

# ================================================================= 4 cảnh tính năng đặc biệt (Android, đối chiếu mã nguồn app)
def TT(sid, k, extra=0):
    sc = next(s for s in SCENES if s['id'] == sid)
    return round((sc['offs'][k] + extra) * sc['K'], 2)
def DD(sid, k):
    sc = next(s for s in SCENES if s['id'] == sid)
    return round(sc['ds'][k] * sc['K'], 2)
def fill(js, sid):
    return (js.replace('__A__', str(TT(sid, 0))).replace('__B__', str(TT(sid, 1) if len(next(s for s in SCENES if s['id'] == sid)['offs']) > 1 else 0))
            .replace('__DA__', str(DD(sid, 0))))

# ---- c08a: bong bóng luôn nằm trên màn hình + dải đỏ khi mức CAO
S['c08a'] = dict(
 html=(head('Always there', 'A bubble that stays.', y=300, w=720, size=100, hl='stays.')
       + '<div id="§c1" class="chip abs" style="left:200px;top:670px;font-size:38px">Round button, always in the corner</div>'
       '<div id="§c2" class="chip abs" style="left:200px;top:770px;font-size:38px">Red strip only when risk is high</div>'
       '<div id="§ph" class="abs" style="left:1130px;top:120px;width:420px;height:740px;border:12px solid #141032;border-radius:60px;background:#f1edff;box-shadow:0 50px 100px rgba(20,16,50,.35)">'
       '<div class="abs" style="left:0;top:0;width:396px;height:716px;border-radius:48px;overflow:hidden">'
       '<div class="abs" style="left:28px;top:44px;width:230px;height:60px;border-radius:18px;background:#cfc4f5"></div>'
       + ''.join(f'<div class="abs" style="left:28px;top:{160 + i * 120}px;width:56px;height:56px;border-radius:50%;background:#d9ceff"></div><div class="abs" style="left:104px;top:{164 + i * 120}px;width:{240 - (i % 2) * 40}px;height:20px;border-radius:10px;background:#e0d8fa"></div><div class="abs" style="left:104px;top:{200 + i * 120}px;width:150px;height:20px;border-radius:10px;background:#e8e1fb"></div>' for i in range(5))
       + '<div id="§st" class="abs" style="left:14px;top:30px;width:368px;border-radius:26px;background:#c00000;padding:16px 22px;color:#fff;font-family:Outfit;opacity:0;box-shadow:0 14px 30px rgba(120,0,0,.4)">'
       '<div style="font-size:32px;font-weight:800">High risk</div><div style="font-size:28px;font-weight:500;margin-top:2px">Look first, then decide.</div>'
       '<div style="display:flex;gap:12px;margin-top:12px"><span style="background:#fff;color:#a50013;border-radius:999px;padding:8px 26px;font-size:28px;font-weight:700">Open</span><span style="border:3px solid #fff;border-radius:999px;padding:5px 22px;font-size:28px;font-weight:700">I am OK</span></div></div></div>'
       '<div id="§bb" class="abs" style="right:-44px;top:340px;width:108px;height:108px;border-radius:50%;background:#fff;box-shadow:0 14px 34px rgba(60,30,130,.45);display:flex;align-items:center;justify-content:center;opacity:0">'
       '<img src="assets/logo-512.png" style="width:86px;height:86px;border-radius:26px"></div></div>'
       + spark('§sp1', 1020, 150, 50) + spark('§sp2', 1650, 800, 44, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.5}); ttl('#§ht',.35,'slide',{d:.8}); hlg('#§ht .hl',.5,2.0);
ent('#§ph',.4,'bounce');
tl.fromTo('#§bb',{opacity:0,scale:0},{opacity:.95,scale:1,duration:.5,ease:'back.out(2.4)'},__A__+.1);
rise('#§c1',__A__+.4,{y:30,d:.6});
tl.to('#§bb',{y:-180,duration:.6,ease:'power2.inOut'},__A__+1.0); tl.to('#§bb',{y:110,duration:.7,ease:'power2.inOut'},__A__+1.7); tl.to('#§bb',{y:0,duration:.5,ease:'power2.out'},__A__+2.5);
tl.fromTo('#§st',{opacity:0,y:-160},{opacity:1,y:0,duration:.6,ease:'back.out(1.6)'},__B__+.2);
tl.to('#§st',{keyframes:{x:[0,-9,9,-7,7,0]},duration:.5,ease:'none'},__B__+.9);
rise('#§c2',__B__+.4,{y:30,d:.6});
twinkle('#§sp1',1.4); twinkle('#§sp2',__B__+.8);
""")
S['c08a']['js'] = fill(S['c08a']['js'], 'c08a')

# ---- c08b: chạm nút nổi → chụp màn hình đang xem → đi kiểm
S['c08b'] = dict(
 html=(head('Tap to check', 'Check what you are looking at.', y=290, w=720, size=92, hl='looking at.')
       + '<div id="§c1" class="chip abs" style="left:200px;top:700px;font-size:38px">One picture. Not saved on the phone.</div>'
       '<div id="§m1" class="cardl abs" style="left:1000px;top:260px;width:720px;padding:36px 40px;font-family:Outfit">'
       '<div style="display:flex;align-items:center;gap:24px"><img src="assets/logo-512.png" style="width:100px;height:100px;border-radius:28px"><div style="font-size:46px;font-weight:700;color:#141032">Khoan Đã</div></div>'
       f'<div id="§mb" style="margin-top:28px;display:flex;align-items:center;gap:22px;background:linear-gradient(100deg,#6a34d6,#8f5cf0);color:#fff;border-radius:999px;height:120px;padding:0 40px;font-size:48px;font-weight:700"><div style="width:62px;height:62px;flex:none">{ic("scan", "#fff")}</div>Check this screen</div>'
       '<div style="margin-top:20px;display:flex;align-items:center;justify-content:center;height:96px;border-radius:999px;border:4px solid #cdbdf7;font-size:40px;font-weight:600;color:#141032">Open Khoan Đã</div></div>'
       '<div id="§m2" class="abs" style="left:1000px;top:260px;width:720px;border-radius:44px;background:#f3f1f8;padding:44px 44px 36px;font-family:Outfit;box-shadow:0 36px 90px rgba(60,30,130,.28);opacity:0">'
       '<div style="font-size:48px;font-weight:700;line-height:1.15;color:#141032">Allow Khoan Đã to capture your screen?</div>'
       '<div style="font-size:32px;font-weight:500;color:#6a6490;margin-top:14px">Your phone asks every time.</div>'
       '<div style="display:flex;justify-content:flex-end;align-items:center;gap:36px;margin-top:34px"><span style="font-size:42px;font-weight:600;color:#6a6490">Cancel</span>'
       '<span id="§go" style="background:#6a34d6;color:#fff;border-radius:999px;padding:20px 48px;font-size:44px;font-weight:700">Start now</span></div></div>'
       '<div id="§m3" class="cardl abs" style="left:1000px;top:260px;width:720px;padding:36px 40px;font-family:Outfit;opacity:0">'
       '<div style="position:relative;height:300px;border-radius:28px;background:#eee9ff;overflow:hidden">'
       '<div class="abs" style="left:34px;top:34px;width:420px;border-radius:26px;background:#fff;padding:20px 26px;font-size:36px;font-weight:600;line-height:1.2;color:#141032;box-shadow:0 12px 30px rgba(60,30,130,.15)">Your account is locked. Verify now</div>'
       '<div class="abs" style="left:34px;top:190px;width:300px;height:22px;border-radius:11px;background:#d9ceff"></div><div class="abs" style="left:34px;top:232px;width:220px;height:22px;border-radius:11px;background:#e3dcfb"></div>'
       '<div id="§fl" class="abs" style="left:0;top:0;width:100%;height:100%;background:#fff;opacity:0"></div></div>'
       '<div style="font-size:46px;font-weight:700;color:#141032;margin-top:28px">Checking this picture…</div>'
       '<div style="height:16px;border-radius:8px;background:#e6defb;margin-top:20px;overflow:hidden"><div id="§bar" style="width:100%;height:100%;border-radius:8px;background:linear-gradient(90deg,#8f6dff,#ff6fd6);transform-origin:0 50%"></div></div></div>'
       + spark('§sp1', 940, 200, 50) + spark('§sp2', 1650, 820, 44, '#ffffff')),
 js="""
rise('#§hk',.2,{y:24,d:.5}); ttl('#§ht',.35,'skew',{d:.8}); hlg('#§ht .hl',.5,2.0);
ent('#§m1',__A__+.1,'zoom');
pulse('#§mb',__A__+1.2,1.06);
tl.to('#§m1',{opacity:0,y:-40,scale:.94,duration:.35,ease:'power2.in'},__A__+1.8);
ent('#§m2',__A__+1.9,'flipx');
rise('#§c1',__B__+.3,{y:30,d:.6});
pulse('#§go',__B__+.8,1.1);
tl.to('#§m2',{opacity:0,scale:1.05,duration:.3,ease:'power2.in'},__B__+1.5);
ent('#§m3',__B__+1.6,'wipe');
tl.fromTo('#§fl',{opacity:.9},{opacity:0,duration:.5,ease:'power2.out',immediateRender:false},__B__+1.75);
tl.fromTo('#§bar',{scaleX:0},{scaleX:1,duration:1.6,ease:'power1.inOut'},__B__+2.1);
twinkle('#§sp1',1.4); twinkle('#§sp2',__B__+1.8);
""")
S['c08b']['js'] = fill(S['c08b']['js'], 'c08b')

# ---- c08c: có mã (OTP) tới lúc đang gọi → máy tự cảnh báo
S['c08c'] = dict(
 html=(head('Automatic', 'A code arrives mid-call.', y=280, w=760, size=96, dark=True, hl='mid-call.')
       + '<div id="§c1" class="chip abs" style="left:200px;top:640px;font-size:38px">The code stays on your phone</div>'
       '<div id="§c2" class="chip abs" style="left:200px;top:740px;font-size:38px">Only while a call is on</div>'
       f'<div id="§cp" class="abs" style="left:960px;top:200px;width:760px;height:120px;border-radius:999px;background:#0c9068;color:#fff;font-family:Outfit;display:flex;align-items:center;gap:22px;padding:0 40px;font-size:46px;font-weight:700"><div style="width:56px;height:56px;flex:none">{ic("phone", "#fff")}</div>On a call · 02:14</div>'
       f'<div id="§sm" class="cardl abs" style="left:960px;top:350px;width:760px;padding:26px 36px;font-family:Outfit;display:flex;align-items:center;gap:26px"><div style="flex:none;width:84px;height:84px;border-radius:50%;background:#e0ebff;display:flex;align-items:center;justify-content:center"><div style="width:44px;height:44px">{ic("message", "#1d4ed8")}</div></div>'
       '<div><div style="font-size:32px;font-weight:600;color:#6a6490">Messages</div><div style="font-size:46px;font-weight:700;color:#141032">Your code is ••••••</div></div></div>'
       f'<div id="§al" class="abs" style="left:960px;top:520px;width:760px;border-radius:44px;background:#fff;padding:34px 40px;font-family:Outfit;box-shadow:0 0 0 6px #ff6b81,0 36px 90px rgba(0,0,0,.45);opacity:0">'
       f'<div style="display:flex;align-items:center;gap:22px"><div style="flex:none;width:92px;height:92px;border-radius:50%;background:#ffe0e6;display:flex;align-items:center;justify-content:center"><div style="width:52px;height:52px">{ic("shield-alert", "#b91c1c")}</div></div>'
       '<div style="font-size:50px;font-weight:800;line-height:1.1;color:#141032">Do not read this code to anyone</div></div>'
       '<div style="font-size:34px;font-weight:500;line-height:1.25;color:#4b4670;margin-top:20px">A code arrived while you are on a call. Anyone who calls and asks for a code is a scammer.</div></div>'
       + spark('§sp1', 900, 170, 50, '#ffd3f6') + spark('§sp2', 1690, 860, 40, '#cfe8ff')),
 js="""
rise('#§hk',.2,{y:24,d:.5}); ttl('#§ht',.35,'drop',{d:.8}); hlg('#§ht .hlw',.5,2.0);
ent('#§cp',.5,'wipe');
ent('#§sm',__A__+1.0,'drop');
ent('#§al',__A__+2.0,'slam');
tl.to('#§al',{keyframes:{x:[0,-10,10,-8,8,-4,0]},duration:.5,ease:'none'},__A__+2.8);
rise('#§c1',__A__+2.4,{y:30,d:.6}); rise('#§c2',__A__+2.8,{y:30,d:.6});
twinkle('#§sp1',1.4); twinkle('#§sp2',__A__+2.6);
""")
S['c08c']['js'] = fill(S['c08c']['js'], 'c08c')

# ---- c08d: úp máy 1,3 giây / lắc ba nhịp → mở màn cầu cứu (không tự gọi, không tự nhắn)
S['c08d'] = dict(
 html=(head('Panic gesture', 'No time to tap?', y=130, w=1500, size=100, hl='tap?')
       + '<div id="§pa" class="cardl abs" style="left:200px;top:380px;width:760px;height:220px;display:flex;align-items:center;gap:36px;padding:0 44px;font-family:Outfit">'
       '<div style="flex:none;width:150px;height:170px;display:flex;align-items:center;justify-content:center"><div id="§ga" style="width:84px;height:146px;border-radius:16px;border:6px solid #141032;background-color:#8f5cf0"></div></div>'
       '<div><div style="font-size:68px;font-weight:800;color:#141032">Face down</div><div style="font-size:48px;font-weight:600;color:#5a2cc4"><span id="§ta">0.0 s</span> <span style="color:#6a6490;font-weight:500">of 1.3 s</span></div></div>'
       f'<div id="§ka" style="margin-left:auto;width:72px;height:72px;border-radius:50%;background:#2fd3a2;display:flex;align-items:center;justify-content:center;opacity:0"><div style="width:44px;height:44px">{ic("check", "#06382a")}</div></div></div>'
       '<div id="§pb" class="cardl abs" style="left:200px;top:640px;width:760px;height:220px;display:flex;align-items:center;gap:36px;padding:0 44px;font-family:Outfit">'
       '<div style="flex:none;width:150px;height:170px;display:flex;align-items:center;justify-content:center"><div id="§gb" style="width:84px;height:146px;border-radius:16px;border:6px solid #141032;background-color:#8f5cf0"></div></div>'
       '<div><div style="font-size:68px;font-weight:800;color:#141032">Shake</div><div style="display:flex;align-items:center;gap:14px;font-size:48px;font-weight:600;color:#5a2cc4"><span>3 times</span>'
       + ''.join(f'<i id="§k{i}" style="display:inline-block;width:30px;height:30px;border-radius:50%;background:#d9ceff"></i>' for i in (1, 2, 3))
       + '</div></div></div>'
       '<div id="§rc" class="abs" style="left:1040px;top:360px;width:680px;border-radius:56px;background:#fff;padding:40px 44px 40px;font-family:Outfit;box-shadow:0 0 0 6px #ff9fb0,0 40px 100px rgba(60,30,130,.3)">'
       f'<div style="display:flex;align-items:center;gap:22px"><div style="flex:none;width:76px;height:76px">{ic("shield-alert", "#b91c1c")}</div><div style="font-size:60px;font-weight:800;color:#141032">Need help now?</div></div>'
       f'<div id="§rb1" style="margin-top:28px;display:flex;align-items:center;justify-content:center;gap:22px;height:112px;border-radius:999px;background:linear-gradient(100deg,#c01c1c,#df2c2c);color:#fff;font-size:48px;font-weight:700"><div style="width:52px;height:52px;flex:none">{ic("phone", "#fff")}</div>Call family</div>'
       '<div style="margin-top:20px;display:flex;align-items:center;justify-content:center;height:96px;border-radius:999px;border:4px solid #cdbdf7;font-size:38px;font-weight:600;color:#141032">I am OK, close this screen</div></div>'
       '<div id="§nt" class="chip abs" style="left:1040px;top:800px;font-size:36px">Works while the app is open</div>'
       + spark('§sp1', 940, 150, 50) + spark('§sp2', 1690, 330, 44, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.5}); ttl('#§ht',.35,'mask',{d:.8}); hlg('#§ht .hl',.5,2.0);
ent(['#§pa','#§pb'],.5,'zig',{st:.3});
tl.fromTo('#§ga',{rotationX:0},{rotationX:180,transformPerspective:600,duration:.5,ease:'power2.inOut'},__A__+1.2);
tl.to('#§ga',{backgroundColor:'#2a2450',duration:.2},__A__+1.4);
count('#§ta',0,1.3,__A__+1.8,1.3,v=>v.toFixed(1)+' s','none');
tl.fromTo('#§ka',{opacity:0,scale:0},{opacity:1,scale:1,duration:.4,ease:'back.out(3)'},__A__+3.2);
const SH=__A__+__DA__-1.8;
tl.to('#§gb',{keyframes:{x:[0,-22,22,-22,22,-22,22,0]},duration:1.2,ease:'none'},SH);
[0,1,2].forEach(i=>tl.to('#§k'+(i+1),{backgroundColor:'#6a34d6',scale:1.25,duration:.2,ease:'back.out(3)'},SH+.1+i*.4));
ent('#§rc',__B__+.1,'spiral');
tl.to('#§rc',{keyframes:{x:[0,-10,10,-8,8,0]},duration:.4,ease:'none'},__B__+.95);
pulse('#§rb1',__B__+1.5,1.05);
rise('#§nt',__B__+.9,{y:30,d:.6});
twinkle('#§sp1',1.4); twinkle('#§sp2',__B__+1.2);
""")
S['c08d']['js'] = fill(S['c08d']['js'], 'c08d')

# ================================================================= c09 pipeline overview
STEPS = [('scissors', 'Split'), ('braces', 'Patterns'), ('cpu', 'AI flags'), ('search', 'Evidence'), ('scale', 'Rules'), ('eye-off', 'Unread floor'), ('shield-alert', 'Verdict')]
S['c09'] = dict(
 html=('<div id="§k" class="kicker" style="position:absolute;left:0;width:1920px;top:150px;text-align:center;color:#d9ceff">Behind every tap</div>'
       '<div id="§t" class="t" style="position:absolute;left:0;width:1920px;top:210px;text-align:center;font-size:120px;color:#fff">A <span class="hlw">seven-step</span> analysis</div>'
       '<div class="abs" style="left:264px;top:560px;width:1392px;height:8px;border-radius:6px;background:rgba(255,255,255,.2)"><div id="§ln" style="width:100%;height:100%;border-radius:6px;background:linear-gradient(90deg,#8f6dff,#ff6fd6);transform-origin:0 50%"></div></div>'
       + ''.join(f'<div id="§n{i + 1}" class="node" style="left:{179 + i * 232}px;top:480px;width:170px;height:170px;background:linear-gradient(160deg,#3b2f7a,#24195a);border:3px solid #6f5fd0;flex-direction:column;gap:6px;color:#fff;box-shadow:0 20px 50px rgba(0,0,0,.35)">'
                 f'<div style="width:70px;height:70px">{ic(n, "#d9c8ff")}</div><div style="font-size:28px;font-weight:800;color:#ff9be8">{i + 1}</div></div>'
                 f'<div id="§m{i + 1}" class="label" style="position:absolute;left:{139 + i * 232}px;top:680px;width:250px;text-align:center;font-size:34px;font-weight:600;color:#fff">{lab}</div>' for i, (n, lab) in enumerate(STEPS))
       + '<div id="§pk" class="abs" style="left:250px;top:550px;width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:0 0 30px 10px rgba(255,150,230,.9)"></div>'
       + spark('§sp1', 330, 330, 52) + spark('§sp2', 1540, 330, 44, '#ffd3f6')),
 js="""
rise('#§k',.2,{y:24,d:.5}); flipEl('#§t',.3,{d:.8});
tl.fromTo('#§ln',{scaleX:0},{scaleX:1,duration:1.6,ease:'power2.inOut'},.5);
for(let i=1;i<=7;i++){ tl.fromTo('#§n'+i,{opacity:0,y:80,rotationX:-80,scale:.6,transformPerspective:1000},{opacity:1,y:0,rotationX:0,scale:1,duration:.55,ease:'back.out(1.8)'},.5+i*.2);
  rise('#§m'+i,.7+i*.2,{y:20,d:.4}); }
tl.fromTo('#§pk',{x:0,opacity:1},{x:1392,duration:2.0,ease:'power2.inOut'},1.5);
tl.to('#§pk',{opacity:0,duration:.3},3.4);
for(let i=1;i<=7;i++) tl.fromTo('#§n'+i,{boxShadow:'0 20px 50px rgba(0,0,0,.35)'},{boxShadow:'0 0 40px rgba(255,111,214,.9)',duration:.25,yoyo:true,repeat:1,immediateRender:false},1.6+(i-1)*.27);
twinkle('#§sp1',1.2); twinkle('#§sp2',2.4);
""")

# ---- khung chung cho 7 bước
def step(n, title, hl=None):
    return (rail(n) + head(f'Step {n}', title, y=170, w=1300, size=92, dark=True, hl=hl))

# ================================================================= c10 step 1: split & understand
S['c10'] = dict(
 html=(step(1, 'Split. Understand.', 'Understand.')
       + '<div id="§big" class="cardl abs" style="left:200px;top:430px;width:1520px;padding:34px 44px;font-family:Outfit"><div class="t mid" style="font-size:58px;line-height:1.2">This is the police. Read me the OTP now. Never share your OTP with anyone.</div></div>'
       + '<div id="§cut1" class="abs" style="left:560px;top:410px;width:6px;height:170px;border-radius:4px;background:#ff6fd6;opacity:0;box-shadow:0 0 24px #ff6fd6"></div>'
       '<div id="§cut2" class="abs" style="left:1120px;top:410px;width:6px;height:170px;border-radius:4px;background:#ff6fd6;opacity:0;box-shadow:0 0 24px #ff6fd6"></div>'
       + ''.join(f'<div id="§r{i + 1}" class="cardl abs" style="left:200px;top:{430 + i * 150}px;width:1100px;padding:28px 44px;font-family:Outfit;opacity:0"><div class="t mid" style="font-size:58px">{txt}</div></div>'
                 f'<div id="§g{i + 1}" class="abs" style="left:1340px;top:{438 + i * 150}px;display:flex;align-items:center;gap:18px;border-radius:999px;padding:20px 34px;font-family:Outfit;font-weight:700;font-size:42px;background:{bg};color:{fg};opacity:0;white-space:nowrap">{tag}</div>'
                 for i, (txt, tag, bg, fg) in enumerate([('This is the police.', 'claims authority', '#ffe0e6', '#a50013'), ('Read me the OTP now.', 'asks for a code', '#ffe0e6', '#a50013'), ('Never share your OTP with anyone.', 'warning · negated', '#d9f7e8', '#005e31')]))
       + spark('§sp1', 1650, 260, 52) + spark('§sp2', 300, 880, 40, '#ffd3f6')),
 js="""
rise('#§rail',.1,{y:-20,d:.4}); rise('#§hk',.2,{y:24,d:.4}); flipEl('#§ht',.3,{d:.7});
tl.fromTo('#§big',{opacity:0,scale:.9,y:50},{opacity:1,scale:1,y:0,duration:.6,ease:'back.out(1.5)'},.7);
tl.fromTo('#§cut1',{opacity:0,scaleY:0},{opacity:1,scaleY:1,duration:.2},1.6); tl.fromTo('#§cut2',{opacity:0,scaleY:0},{opacity:1,scaleY:1,duration:.2},1.8);
tl.to('#§big',{opacity:0,scale:1.04,duration:.3},2.1); tl.to(['#§cut1','#§cut2'],{opacity:0,duration:.3},2.2);
[1,2,3].forEach(i=>{ tl.fromTo('#§r'+i,{opacity:0,y:-40,rotationX:-40,transformPerspective:1200},{opacity:1,y:0,rotationX:0,duration:.6,ease:'back.out(1.5)'},2.1+i*.2);
  tl.fromTo('#§g'+i,{opacity:0,x:-40,scale:.7},{opacity:1,x:0,scale:1,duration:.5,ease:'back.out(2)'},2.6+i*.3); });
twinkle('#§sp1',3.6); twinkle('#§sp2',4.2);
""")

# ================================================================= c11 step 2: pattern rules (no AI)
S['c11'] = dict(
 html=(step(2, 'Plain pattern rules.', 'pattern rules.')
       + '<div id="§msg" class="cardl abs" style="left:200px;top:370px;width:1520px;padding:26px 44px;font-family:Outfit"><div class="t mid" style="font-size:56px;line-height:1.25;white-space:nowrap;text-align:center">Read me the <span id="§h1" style="border-radius:10px;padding:0 8px">OTP code</span>, then <span id="§h2" style="border-radius:10px;padding:0 8px">transfer</span> <span id="§h3" style="border-radius:10px;padding:0 8px">now</span>.</div></div>'
       + ''.join(f'<div id="§rule{i + 1}" class="abs" style="left:{200 + i * 520}px;top:530px;width:480px;height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.25);border-radius:36px;font-family:Outfit;font-weight:700;font-size:44px;color:#fff;opacity:0">'
                 f'<div style="width:84px;height:84px;border-radius:22px;background:#8f6dff;display:flex;align-items:center;justify-content:center"><div style="width:50px;height:50px">{ic("braces", "#fff")}</div></div>{lab}'
                 f'<div id="§ck{i + 1}" style="position:absolute;right:22px;top:22px;width:56px;height:56px;border-radius:50%;background:#2fd3a2;display:flex;align-items:center;justify-content:center;opacity:0"><div style="width:36px;height:36px">{ic("check", "#06382a")}</div></div></div>'
                 for i, lab in enumerate(['asks for a code', 'asks for a transfer', 'adds urgency']))
       + f'<div id="§noai" class="abs" style="left:200px;top:776px;width:1520px;height:84px;border-radius:999px;background:linear-gradient(100deg,#3b2f7a,#24195a);border:3px solid #6f5fd0;display:flex;align-items:center;justify-content:center;gap:24px;font-family:Outfit;color:#fff;font-size:48px;font-weight:700"><div style="width:60px;height:60px;flex:none">{ic("plug-off", "#ffb0e6")}</div>Runs with no AI</div>'
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 1330, 880, 40, '#ffd3f6')),
 js="""
rise('#§rail',.1,{y:-20,d:.4}); rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'type',{d:.7});
ent('#§msg',.6,'wipe');
[['#§h1',1.3],['#§h2',1.8],['#§h3',2.3]].forEach(([h,t],i)=>{ tl.fromTo(h,{backgroundColor:'rgba(255,107,154,0)'},{backgroundColor:'rgba(255,107,154,.55)',duration:.3},t);
  ent('#§rule'+(i+1),t,'flipx');
  tl.fromTo('#§ck'+(i+1),{opacity:0,scale:0},{opacity:1,scale:1,duration:.4,ease:'back.out(3)'},t+.4); });
ent('#§noai',2.8,'wipe');

twinkle('#§sp1',2.8); twinkle('#§sp2',3.3);
""")

# ================================================================= c12 step 3: AI flags
S['c12'] = dict(
 html=(step(3, 'AI reads. It only flags.', 'only flags.')
       + '<div id="§orb" class="abs" style="left:810px;top:380px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9c8ff,#7a52ee 55%,#2a1766);box-shadow:0 0 80px rgba(143,109,255,.8)"></div>'
       f'<div class="abs" style="left:890px;top:460px;width:140px;height:140px">{ic("cpu", "#fff")}</div>'
       + ''.join(f'<div id="§ring{i}" class="abs" style="left:810px;top:380px;width:300px;height:300px;border-radius:50%;border:4px solid rgba(217,200,255,.7);opacity:0"></div>' for i in range(3))
       + ''.join(f'<div id="§f{i + 1}" class="abs" style="left:{x}px;top:{y}px;width:590px;display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.95);border-radius:999px;padding:14px 22px 14px 16px;font-family:Outfit;font-weight:600;font-size:36px;white-space:nowrap;color:#141032;opacity:0;box-shadow:0 18px 44px rgba(0,0,0,.3)">'
                 f'<div style="flex:none;width:60px;height:60px;border-radius:50%;background:{bg};display:flex;align-items:center;justify-content:center"><div style="width:36px;height:36px">{ic(icn, fg)}</div></div>{lab}'
                 f'<div style="margin-left:auto;border-radius:999px;padding:6px 18px;font-size:28px;font-weight:700;background:{pb};color:{pf}">{st}</div></div>'
                 for i, (lab, icn, bg, fg, st, pb, pf, x, y) in enumerate([('Fake authority', 'shield-alert', '#ffe0e6', '#a50013', 'present', '#ffe0e6', '#a50013', 200, 470), ('Asks for an OTP', 'lock', '#ffe0e6', '#a50013', 'present', '#ffe0e6', '#a50013', 1130, 470), ('Secrecy', 'eye-off', '#e8ebf2', '#475569', 'unknown', '#e8ebf2', '#475569', 665, 760)]))
       + '<div id="§ns" class="abs" style="left:1300px;top:790px;display:flex;align-items:center;gap:20px;font-family:Outfit"><span style="position:relative;display:inline-block;background:#2a2160;color:#b9aee8;border-radius:999px;padding:10px 26px;font-size:32px;font-weight:600">risk score<span class="strike" style="left:18px;right:18px;width:auto;top:21px;background:#ff6b81;height:8px"></span></span><span style="font-size:30px;color:#d9ceff">no such field</span></div>'
       + spark('§sp1', 700, 330, 50) + spark('§sp2', 1650, 860, 40, '#cfe8ff')),
 js="""
rise('#§rail',.1,{y:-20,d:.4}); rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'slam',{d:.7});
ent('#§orb',.5,'spiral');
[0,1,2].forEach(i=>tl.fromTo('#§ring'+i,{scale:.8,opacity:.8},{scale:1.9,opacity:0,duration:1.6,ease:'power1.out'},1.0+i*.55));
tl.to('#§orb',{scale:1.05,duration:.6,yoyo:true,repeat:3,ease:'sine.inOut'},1.2);
ent(['#§f1','#§f2','#§f3'],1.7,'pop',{st:.5});
tl.fromTo('#§ns',{opacity:0,y:20},{opacity:1,y:0,duration:.5},3.4);
twinkle('#§sp1',1.6); twinkle('#§sp2',3.6);
""")

# ================================================================= c13 step 4: evidence check
S['c13'] = dict(
 html=(step(4, 'Every flag needs a quote.', 'needs a quote.')
       + '<div id="§msg" class="cardl abs" style="left:200px;top:420px;width:1520px;padding:30px 44px;font-family:Outfit"><div class="t mid" style="font-size:58px;line-height:1.25"><span id="§q1" style="border-radius:10px;padding:0 8px">This is the police.</span> <span id="§q2" style="border-radius:10px;padding:0 8px">Read me the OTP.</span> Please stay calm.</div></div>'
       + ''.join(f'<div id="§fc{i + 1}" class="abs" style="left:{200 + i * 520}px;top:640px;width:480px;height:130px;display:flex;align-items:center;gap:20px;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.3);border-radius:34px;padding:0 26px;font-family:Outfit;font-weight:700;font-size:40px;color:#fff;opacity:0">{lab}'
                 f'<div id="§mk{i + 1}" style="margin-left:auto;width:64px;height:64px;border-radius:50%;background:{bg};display:flex;align-items:center;justify-content:center;opacity:0"><div style="width:40px;height:40px">{ic(icn, "#fff")}</div></div></div>'
                 for i, (lab, icn, bg) in enumerate([('Fake authority', 'check', '#2fd3a2'), ('Asks for an OTP', 'check', '#2fd3a2'), ('Secrecy', 'x', '#ff5a7a')]))
       + '<svg class="abs" style="left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" stroke="#ff9be8" stroke-width="5" stroke-dasharray="10 12" stroke-linecap="round"><path id="§ln1" d="M440 640 C440 600 600 610 600 550"/><path id="§ln2" d="M960 640 C960 600 1000 610 1010 550"/><path id="§ln3" d="M1480 640 C1480 580 1600 600 1600 560" stroke="#ff5a7a"/></svg>'
       '<div id="§drop" class="abs" style="left:1240px;top:800px;font-family:Outfit;font-weight:700;font-size:40px;color:#ffb0c0;opacity:0">no matching quote — flag dropped</div>'
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 300, 880, 40, '#ffd3f6')),
 js="""
rise('#§rail',.1,{y:-20,d:.4}); rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'slide',{d:.7});
ent('#§msg',.6,'zoom');
ent(['#§fc1','#§fc2','#§fc3'],1.25,'pop',{st:.25});
tl.fromTo('#§ln1',{strokeDasharray:'500 500',strokeDashoffset:500},{strokeDashoffset:0,duration:.6,ease:'power2.out'},1.9);
tl.fromTo('#§q1',{backgroundColor:'rgba(255,107,154,0)'},{backgroundColor:'rgba(47,211,162,.55)',duration:.3},2.1);
tl.fromTo('#§mk1',{opacity:0,scale:0},{opacity:1,scale:1,duration:.4,ease:'back.out(3)'},2.3);
tl.fromTo('#§ln2',{strokeDasharray:'500 500',strokeDashoffset:500},{strokeDashoffset:0,duration:.6,ease:'power2.out'},2.6);
tl.fromTo('#§q2',{backgroundColor:'rgba(255,107,154,0)'},{backgroundColor:'rgba(47,211,162,.55)',duration:.3},2.8);
tl.fromTo('#§mk2',{opacity:0,scale:0},{opacity:1,scale:1,duration:.4,ease:'back.out(3)'},3.0);
tl.fromTo('#§ln3',{strokeDasharray:'500 500',strokeDashoffset:500},{strokeDashoffset:0,duration:.5,ease:'power2.out'},3.3);
tl.fromTo('#§mk3',{opacity:0,scale:0},{opacity:1,scale:1,duration:.4,ease:'back.out(3)'},3.7);
tl.to('#§fc3',{keyframes:{x:[0,-12,12,-8,8,0]},duration:.5,ease:'none'},3.8);
tl.to('#§fc3',{opacity:.35,y:30,duration:.5,ease:'power2.in'},4.3);
tl.fromTo('#§drop',{opacity:0,y:20},{opacity:1,y:0,duration:.4},4.0);
twinkle('#§sp1',2.4); twinkle('#§sp2',3.0);
""")

# ================================================================= c14 step 5: fixed rules decide
def combos():
    out = ''
    for i in range(10):
        r, c = divmod(i, 5)
        out += (f'<div id="§c{i + 1}" class="abs" style="left:{c * 150}px;top:{r * 150}px;width:130px;height:130px;border-radius:30px;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-family:Outfit;font-weight:800;font-size:44px;color:#c9b4ff">{i + 1}</div>')
    return out
S['c14'] = dict(
 html=(step(5, 'Fixed rules decide.', 'decide.')
       + '<div id="§a" class="abs" style="left:200px;top:390px;width:560px;font-family:Outfit;color:#fff"><div id="§an" class="t" style="font-size:270px;font-weight:800;line-height:1">0</div><div style="font-size:54px;font-weight:700;margin-top:10px">signals</div><div class="label" style="font-size:30px;color:#d9ceff;margin-top:8px">each one present or unknown</div></div>'
       f'<div class="abs" style="left:895px;top:400px;width:730px;height:280px">{combos()}</div>'
       '<div id="§cl" class="label abs" style="left:895px;top:750px;font-size:42px;font-weight:700;color:#fff">10 critical combinations</div>'
       '<div id="§vd" class="abs" style="left:1430px;top:728px"><span class="pill" style="background:#a50013;color:#fff;font-size:54px">High risk</span></div>'
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 760, 830, 40, '#ffd3f6')),
 js="""
rise('#§rail',.1,{y:-20,d:.4}); rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'skew',{d:.7});
ent('#§a',.6,'slam'); count('#§an',0,58,.8,1.6,v=>Math.round(v));
ent(['#§c1','#§c2','#§c3','#§c4','#§c5','#§c6','#§c7','#§c8','#§c9','#§c10'],1.1,'scatter',{st:.07});
rise('#§cl',1.8,{y:20,d:.5});
tl.to('#§c3',{backgroundColor:'#ff5a7a',borderColor:'#ffd0d8',color:'#fff',boxShadow:'0 0 40px rgba(255,90,122,.95)',duration:.3},2.8);
tl.to('#§c7',{backgroundColor:'#ff5a7a',borderColor:'#ffd0d8',color:'#fff',boxShadow:'0 0 40px rgba(255,90,122,.95)',duration:.3},3.0);
tl.fromTo('#§vd',{opacity:0,scale:.5,y:30,rotationX:-60,transformPerspective:900},{opacity:1,scale:1,y:0,rotationX:0,duration:.7,ease:'back.out(2.2)'},3.5);
twinkle('#§sp1',3.8); twinkle('#§sp2',4.1);
""")

# ================================================================= c15 step 6: unreadable != fine
S['c15'] = dict(
 html=(step(6, 'Unreadable is never fine.', 'never fine.')
       + '<div id="§img" class="abs" style="left:200px;top:400px;width:600px;height:400px;border-radius:36px;background:linear-gradient(135deg,#5b4fa8,#3b2f7a);overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.4)">'
       '<div style="position:absolute;inset:0;filter:blur(26px);background:repeating-linear-gradient(0deg,rgba(255,255,255,.55) 0 18px,rgba(255,255,255,.08) 18px 44px)"></div>'
       '<div style="position:absolute;left:0;right:0;bottom:24px;text-align:center;font-family:Outfit;font-weight:700;font-size:36px;color:#fff">blurry screenshot</div></div>'
       f'<div id="§ar" class="abs" style="left:830px;top:545px;width:110px;height:110px;opacity:0"><svg viewBox="0 0 56 56" fill="none" stroke="#d9c8ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 28h40"/><path d="M32 14l15 14-15 14"/></svg></div>'
       '<div id="§bad" class="abs" style="left:980px;top:440px;opacity:0"><span class="ui-lab" style="background:#d9f7e8;color:#005e31;border:4px solid #7bc9a0;font-size:54px;padding:24px 52px">No clear risk signals found</span>'
       '<div id="§xx" class="abs" style="left:-10px;top:50%;height:10px;width:calc(100% + 20px);border-radius:6px;background:#ff5a7a;transform:rotate(-4deg);transform-origin:0 50%"></div></div>'
       f'<div id="§good" class="abs" style="left:980px;top:610px;opacity:0"><span class="ui-lab" style="background:#fdf0d9;color:#5a3a0a;border:5px solid #8b5a14;font-size:60px;padding:28px 58px"><div style="width:60px;height:60px">{ic("eye-off", "#5a3a0a")}</div>Could not check this</span></div>'
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 760, 800, 40, '#ffd3f6')),
 js="""
rise('#§rail',.1,{y:-20,d:.4}); rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'mask',{d:.7});
ent('#§img',.6,'swing');
tl.fromTo('#§ar',{opacity:0,x:-30},{opacity:1,x:0,duration:.4},1.3);
tl.fromTo('#§bad',{opacity:0,scale:.8,y:30},{opacity:1,scale:1,y:0,duration:.6,ease:'back.out(1.6)'},1.5);
tl.fromTo('#§xx',{scaleX:0},{scaleX:1,duration:.4,ease:'power3.out'},2.2);
tl.to('#§bad',{opacity:.35,duration:.4},2.4);
tl.fromTo('#§good',{opacity:0,scale:.7,y:40,rotationX:-50,transformPerspective:1000},{opacity:1,scale:1,y:0,rotationX:0,duration:.7,ease:'back.out(2)'},2.7);
tl.fromTo('#§good',{boxShadow:'0 0 0 rgba(255,180,60,0)'},{boxShadow:'0 0 60px rgba(255,180,60,.8)',duration:.6,yoyo:true,repeat:1,immediateRender:false},3.2);
twinkle('#§sp1',2.9); twinkle('#§sp2',3.4);
""")

# ================================================================= c16 step 7: verdict (exploded)
S['c16'] = dict(
 html=(rail(7) + head('Step 7', 'The verdict.', y=170, w=800, size=100, dark=True, hl='verdict.')
       + '<div id="§vc" class="abs" style="left:200px;top:340px;width:760px;height:540px;transform-style:preserve-3d">'
       '<div id="§vp" class="abs" style="left:0;top:0;width:760px;height:540px;border-radius:64px;background:linear-gradient(160deg,#b91c1c,#c92a2a);box-shadow:0 40px 90px rgba(0,0,0,.5)"></div>'
       f'<div id="§vi" class="abs" style="left:310px;top:26px;width:140px;height:140px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center"><div style="width:84px;height:84px">{ic("shield-alert", "#b91c1c")}</div></div>'
       '<div id="§v1" class="t abs" style="left:0;top:176px;width:760px;text-align:center;font-size:100px;font-weight:800;color:#fff">High risk</div>'
       '<div id="§v2" class="t abs" style="left:0;top:300px;width:760px;text-align:center;font-size:54px;font-weight:700;color:#fff">Please hang up now.</div>'
       f'<div id="§vb" class="ui-hung abs" style="left:50px;top:398px;height:112px;width:660px;background:#7f1313;border:4px solid rgba(255,255,255,.5)">{ic("phone-off")}I have hung up</div></div>'
       + ''.join(f'<div id="§rs{i + 1}" class="ui-reason abs" style="left:1040px;top:{410 + i * 150}px;width:680px;font-size:38px;padding:24px 36px 24px 30px;white-space:nowrap">{ic("warn")}{lab}</div>' for i, lab in enumerate(['Asks for an OTP', 'Asks for a money transfer', 'Insists you stay on the line']))
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 200, 900, 40, '#ffd3f6')),
 js="""
rise('#§rail',.1,{y:-20,d:.4}); rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'drop',{d:.7}); hlg('#§ht .hlw',.5,2);
tl.fromTo('#§vc',{opacity:0,scale:.8,rotationY:-10,transformPerspective:1600},{opacity:1,scale:1,rotationY:-16,rotationX:5,duration:.8,ease:'expo.out'},.5);
tl.to('#§vi',{z:50,duration:.8,ease:'power3.out'},.9); tl.to('#§v1',{z:90,duration:.8,ease:'power3.out'},.9);
tl.to('#§v2',{z:70,duration:.8,ease:'power3.out'},.9); tl.to('#§vb',{z:120,duration:.8,ease:'power3.out'},.9);
tl.to('#§vc',{rotationY:-6,rotationX:2,duration:1.6,ease:'sine.inOut'},1.8);
tl.to(['#§vi','#§v1','#§v2','#§vb'],{z:0,duration:.8,ease:'power3.inOut'},3.1);
tl.to('#§vc',{rotationY:0,rotationX:0,duration:.8,ease:'power3.inOut'},3.1);
ent(['#§rs1','#§rs2','#§rs3'],1.75,'zig',{st:.35});
pulse('#§vb',3.6,1.05);
twinkle('#§sp1',2.0); twinkle('#§sp2',3.0);
""")

# ================================================================= c17 same size
S['c17'] = dict(
 html=(head('Honest by design', 'Same size as the verdict.', y=130, w=1500, size=88, hl='verdict.')
       + '<div id="§va" class="abs" style="left:200px;top:370px;width:700px;height:430px;border-radius:56px;background:linear-gradient(160deg,#b91c1c,#c92a2a);color:#fff;text-align:center;font-family:Outfit;box-shadow:0 34px 80px rgba(150,10,10,.4)">'
       f'<div style="width:120px;height:120px;border-radius:50%;background:#fff;margin:40px auto 18px;display:flex;align-items:center;justify-content:center"><div style="width:66px;height:66px">{ic("shield-alert", "#b91c1c")}</div></div>'
       '<div style="font-size:90px;font-weight:800">High risk</div><div style="font-size:48px;font-weight:700;margin-top:6px">Please hang up now.</div></div>'
       '<div id="§vb" class="ui-nocheck abs" style="left:1000px;top:370px;width:720px;height:430px;padding:30px 44px">'
       f'<div class="nt" style="font-size:56px"><div style="width:64px;height:64px;flex:none">{ic("eye-off", "#5a3a0a")}</div>What I could NOT check</div>'
       '<ul style="padding:0"><li style="font-size:42px;margin:14px 0 0 40px">Khoan Đã could not hear the call</li><li style="font-size:42px;margin:14px 0 0 40px">No AI read the content this time</li></ul></div>'
       '<svg class="abs" style="left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" stroke="#723fd9" stroke-width="6" stroke-linecap="round"><path id="§br" d="M200 826 H1720"/><path d="M200 812 V840"/><path d="M1720 812 V840"/></svg>'
       '<div id="§eq" class="t abs" style="left:660px;width:600px;top:800px;text-align:center;font-size:38px;font-weight:700;color:#5a2cc4;background:#efe6ff;border-radius:999px;padding:6px 0">same size · same weight</div>'
       + spark('§sp1', 960, 330, 50) + spark('§sp2', 1790, 300, 40, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.4}); flipEl('#§ht',.3,{d:.7}); hlg('#§ht .hl',.5,2);
tl.fromTo('#§va',{opacity:0,x:-300,rotationY:50,transformPerspective:1500},{opacity:1,x:0,rotationY:0,duration:.8,ease:'expo.out'},.6);
tl.fromTo('#§vb',{opacity:0,x:300,rotationY:-50,transformPerspective:1500},{opacity:1,x:0,rotationY:0,duration:.8,ease:'expo.out'},.8);
tl.fromTo('#§br',{strokeDasharray:'1600 1600',strokeDashoffset:1600},{strokeDashoffset:0,duration:.8,ease:'power2.inOut'},1.6);
rise('#§eq',2.0,{y:20,d:.5});
tl.fromTo('#§vb',{boxShadow:'0 34px 80px rgba(100,60,10,.3)'},{boxShadow:'0 0 70px rgba(255,170,0,.8)',duration:.5,yoyo:true,repeat:1,immediateRender:false},2.2);
twinkle('#§sp1',1.4); twinkle('#§sp2',2.4);
""")

# ================================================================= c18 pause 60s
S['c18'] = dict(
 html=('<svg class="abs" style="left:200px;top:190px" width="580" height="580" viewBox="0 0 320 320">'
       '<g id="§ticks"></g><circle cx="160" cy="160" r="112" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="16"/>'
       '<circle id="§arc" cx="160" cy="160" r="112" fill="none" stroke="#ffd23f" stroke-width="16" stroke-linecap="round" transform="rotate(-90 160 160)" stroke-dasharray="703.7" stroke-dashoffset="0"/>'
       '<text id="§tn" x="160" y="188" text-anchor="middle" font-size="100" font-weight="800" fill="#fff" font-family="Outfit">60</text>'
       '<text x="160" y="228" text-anchor="middle" font-size="26" font-weight="600" fill="#ffe9a0" font-family="Outfit">seconds</text></svg>'
       '<div id="§k" class="kicker abs" style="left:200px;top:120px;color:#ffd3d9">If fear takes over</div>'
       '<div id="§pc" class="ui-pause abs" style="left:880px;top:150px;width:840px">'
       '<div class="p1">Let us pause for 60 seconds</div><div class="p2">Do not send money.</div>'
       '<div id="§say" class="ui-say"><div class="s0">If you are on the phone, say:</div>“Let me ask my family and call you back.”</div></div>'
       + spark('§sp1', 880, 120, 52, '#ffe0e6') + spark('§sp2', 1690, 900, 44, '#ffe0e6')),
 js="""
const NS='http://www.w3.org/2000/svg';const G=Q('#§ticks');const ticks=[];
for(let i=0;i<60;i++){const a=(i*6-90)*Math.PI/180;const l=document.createElementNS(NS,'line');
  l.setAttribute('x1',160+Math.cos(a)*134);l.setAttribute('y1',160+Math.sin(a)*134);
  l.setAttribute('x2',160+Math.cos(a)*(i%5==0?152:146));l.setAttribute('y2',160+Math.sin(a)*(i%5==0?152:146));
  l.setAttribute('stroke','#ffd3d9');l.setAttribute('stroke-width',i%5==0?4:2.4);l.setAttribute('stroke-linecap','round');G.appendChild(l);ticks.push(l)}
rise('#§k',.2,{y:24,d:.5});
tl.fromTo(ticks,{opacity:0},{opacity:1,duration:.25,stagger:.012},.4);
ent('#§pc',.6,'zoom');
tl.fromTo('#§arc',{strokeDashoffset:0},{strokeDashoffset:703.7,duration:5.4,ease:'none'},.8);
tl.to(ticks,{opacity:.15,duration:.2,stagger:.09},.8);
count('#§tn',60,0,.8,5.4,v=>Math.round(v),'none');
tl.fromTo('#§say',{opacity:0.25,scale:.96},{opacity:1,scale:1,duration:.6,ease:'back.out(1.6)'},3.2);
tl.fromTo('#§say',{boxShadow:'0 0 0 rgba(255,255,255,0)'},{boxShadow:'0 0 50px rgba(255,255,255,.55)',duration:.6,yoyo:true,repeat:3,immediateRender:false},3.4);
tl.to('#§pc',{y:-10,duration:1.4,yoyo:true,repeat:1,ease:'sine.inOut'},1.6);
twinkle('#§sp1',1.4); twinkle('#§sp2',4.2);
""")

# ================================================================= c19 AI down
S['c19'] = dict(
 html=('<div id="§k" class="kicker abs" style="left:200px;top:150px;color:#d9ceff">Resilience</div>'
       '<div id="§t" class="t abs" style="left:200px;top:210px;width:1500px;font-size:100px;color:#fff">If the AI is down, <span class="hlw">the rules still run.</span></div>'
       '<div id="§tg" class="abs" style="left:200px;top:450px;display:flex;align-items:center;gap:32px;font-family:Outfit"><span class="t" style="font-size:64px;color:#fff">AI</span>'
       '<div id="§sw" style="width:220px;height:112px;border-radius:70px;background:#6ce3a8;position:relative"><div id="§swk" style="position:absolute;top:10px;left:10px;width:92px;height:92px;border-radius:50%;background:#fff"></div></div></div>'
       + ''.join(f'<div id="§n{i + 1}" class="node" style="left:{200 + i * 225}px;top:610px;width:170px;height:170px;border-radius:38px;background:{"linear-gradient(160deg,#3b2f7a,#24195a)"};border:3px solid #6f5fd0;color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.35)"><div style="width:80px;height:80px">{ic(n, "#d9c8ff")}</div></div>' for i, n in enumerate(['scissors', 'braces', 'cpu', 'search', 'scale', 'eye-off', 'shield-alert']))
       + '<div id="§nt" class="label abs" style="left:200px;top:806px;font-size:40px;font-weight:600;color:#e9e2ff">…and says what it could not check.</div>'
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 800, 800, 40, '#ffd3f6')),
 js="""
rise('#§k',.2,{y:24,d:.4}); flipEl('#§t',.3,{d:.7}); hlg('#§t .hlw',.5,2);
tl.fromTo('#§tg',{opacity:0,x:-80},{opacity:1,x:0,duration:.6,ease:'power3.out'},.7);
for(let i=1;i<=7;i++) tl.fromTo('#§n'+i,{opacity:0,y:60,rotationX:-70,transformPerspective:1000},{opacity:1,y:0,rotationX:0,duration:.5,ease:'back.out(1.8)'},.8+i*.1);
tl.fromTo('#§swk',{x:110},{x:0,duration:.5,ease:'power3.inOut'},1.9); tl.to('#§sw',{backgroundColor:'#6b6592',duration:.5},1.9);
tl.to(['#§n3','#§n4'],{opacity:.25,scale:.9,duration:.4},2.0);
tl.to(['#§n2','#§n5','#§n7'],{boxShadow:'0 0 40px rgba(111,230,170,.95)',borderColor:'#6ce3a8',duration:.4},2.2);
rise('#§nt',2.5,{y:20,d:.6});
twinkle('#§sp1',2.4); twinkle('#§sp2',2.9);
""")

# ================================================================= c20 three labels
S['c20'] = dict(
 html=(head('Honest labels', 'Three. Never four.', y=150, w=1500, size=112, hl='Never four.')
       + f'<div id="§l1" class="ui-lab abs" style="left:200px;top:410px;width:880px;justify-content:center;background:#a50013;color:#fff"><div style="width:76px;height:76px">{ic("shield-alert", "#fff")}</div>High risk</div>'
       f'<div id="§l2" class="ui-lab abs" style="left:200px;top:560px;width:880px;justify-content:center;background:#fde9b0;color:#794e00"><div style="width:76px;height:76px">{ic("warn", "#794e00")}</div>Suspicious</div>'
       f'<div id="§l3" class="ui-lab abs" style="left:200px;top:710px;width:880px;justify-content:center;background:#d9f7e8;color:#005e31;border:4px solid #7bc9a0"><div style="width:76px;height:76px">{ic("check", "#005e31")}</div>No clear risk signals found</div>'
       '<div id="§l4" class="ui-lab abs" style="left:1180px;top:520px;width:540px;justify-content:center;text-align:center;border-radius:60px;background:rgba(255,255,255,.4);color:#4b4670;border:5px dashed #6b6592;font-weight:500;font-size:52px;padding:34px 40px">No fourth label.<br>No promises.</div>'
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 1000, 880, 40, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'type',{d:.7}); hlg('#§ht .hl',.5,2);
ent(['#§l1','#§l2','#§l3'],1.15,'zig',{st:.45});
[1,2,3].forEach(i=>{ 
  const s=document.createElement('div');s.className='sheen';s.style.left='-40%';s.style.top='-10%';s.style.height='120%';s.style.width='34%';Q('#§l'+i).appendChild(s);
  tl.fromTo(s,{x:0},{x:1400,duration:1.0,ease:'power2.inOut'},1.3+i*.45); });
ent('#§l4',3.2,'spiral');
twinkle('#§sp1',2.4); twinkle('#§sp2',3.6);
""")

# ================================================================= c21 family
S['c21'] = dict(
 html=(head('Family · Banks', 'One tap. Official numbers.', y=100, w=1500, size=100, hl='Official numbers.')
       + ''.join(f'<div id="§c{i + 1}" class="abs" style="left:200px;top:{310 + i * 260}px;width:740px;height:240px;border-radius:44px;background:#fff;box-shadow:0 26px 64px rgba(60,30,130,.22);display:flex;align-items:center;gap:30px;padding:0 36px 0 34px;font-family:Outfit">'
                 f'<div style="flex:none;width:112px;height:112px;border-radius:50%;background:linear-gradient(135deg,#8a62ee,#5a2cc4);color:#fff;font-weight:800;font-size:52px;display:flex;align-items:center;justify-content:center">{ini}</div>'
                 f'<div><div style="font-size:48px;font-weight:700;color:#141032">{nm}</div><div style="font-size:34px;font-weight:500;color:#6a6490;margin-top:4px">{rl}</div></div>'
                 f'<div id="§cl{i + 1}" class="ui-call" style="width:108px;height:108px">{ic("phone")}</div></div>'
                 for i, (ini, nm, rl) in enumerate([('D', 'Family contact 1', 'Daughter'), ('S', 'Family contact 2', 'Son')]))
       + '<div id="§bk" class="abs" style="left:1000px;top:310px;width:720px;height:520px;border-radius:44px;background:#fff;box-shadow:0 26px 64px rgba(60,30,130,.22);padding:34px 40px;font-family:Outfit">'
       '<div style="font-size:36px;font-weight:700;color:#5a2cc4;letter-spacing:.06em;text-transform:uppercase">Bank hotlines</div>'
       + ''.join(f'<div id="§r{i + 1}" style="margin-top:{14 if i == 0 else 16}px"><div style="font-size:42px;font-weight:700;color:#141032">{nm}</div>'
                 f'<div style="margin-top:10px;display:flex;align-items:center;justify-content:center;gap:20px;height:92px;border-radius:999px;background:#241d56;color:#fff;font-size:44px;font-weight:700"><div style="width:48px;height:48px;flex:none">{ic("phone", "#fff")}</div>Call {num}</div></div>'
                 for i, (nm, num) in enumerate([('Agribank', '1900 558818'), ('ACB', '1900 54 54 86')]))
       + '<div style="font-size:28px;font-weight:500;color:#4b4670;margin-top:22px;line-height:1.25">Sources: agribank.com.vn · acb.com.vn · checked 23/09/2026</div></div>'
       + '<div id="§ex" class="label abs" style="left:200px;top:824px;font-size:30px;font-weight:600;color:#4b4670;white-space:nowrap">Example contacts. Your family sets their own.</div>'
       + spark('§sp1', 1650, 150, 52) + spark('§sp2', 960, 870, 40, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'slide',{d:.7}); hlg('#§ht .hl',.5,2);
[1,2].forEach(i=>{ ent('#§c'+i,.5+i*.25,'drop');
  tl.fromTo('#§cl'+i,{scale:1,boxShadow:'0 14px 30px rgba(6,122,85,.4)'},{scale:1.18,boxShadow:'0 0 0 14px rgba(6,122,85,.25),0 14px 30px rgba(6,122,85,.4)',duration:.4,yoyo:true,repeat:2,ease:'sine.inOut',immediateRender:false},1.3+i*.2); });
ent('#§bk',.8,'wipeup');
[1,2].forEach(i=>rise('#§r'+i,1.2+i*.25,{y:24,d:.5}));
rise('#§ex',1.7,{y:20,d:.5});
twinkle('#§sp1',1.2); twinkle('#§sp2',2.2);
""")

# ================================================================= c22 bank numbers
S['c22'] = dict(
 html=(head('Bank hotlines', 'Official numbers only.', y=130, w=1500, size=96, hl='Official')
       + ''.join(f'<div id="§b{i + 1}" class="ui-bank abs" style="left:{200 + i * 780}px;top:330px;width:740px;box-sizing:border-box;height:400px"><div class="bn">{nm}</div><div class="bb"><div style="width:56px;height:56px">{ic("phone", "#fff")}</div>Call {num}</div><div class="bs">{src}</div></div>'
                 for i, (nm, num, src) in enumerate([('Agribank', '1900 558818', 'Source: www.agribank.com.vn · checked on 23/09/2026'), ('ACB', '1900 54 54 86', 'Source: acb.com.vn · checked on 23/09/2026')]))
       + '<div id="§nt" class="label abs" style="left:200px;top:772px;font-size:36px;font-weight:600;color:#4b4670">Never call back the number that called you.</div>'
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 900, 880, 40, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.4}); flipEl('#§ht',.3,{d:.7}); hlg('#§ht .hl',.5,2);
[1,2].forEach(i=>tl.fromTo('#§b'+i,{opacity:0,y:200,rotationX:-50,transformPerspective:1500},{opacity:1,y:0,rotationX:0,duration:.8,ease:'expo.out'},.6+i*.3));
rise('#§nt',1.9,{y:20,d:.5});
twinkle('#§sp1',1.4); twinkle('#§sp2',2.4);
""")

# ================================================================= c23 72h watch
S['c23'] = dict(
 html=(head('After a transfer', '72-hour watch.', y=130, w=1500, size=112, hl='72-hour')
       + '<div class="abs" style="left:200px;top:520px;width:1520px;height:48px;border-radius:26px;background:rgba(255,255,255,.55);overflow:hidden"><div id="§bar" style="width:100%;height:100%;border-radius:26px;background:linear-gradient(90deg,#8f6dff,#ff6fd6);transform-origin:0 50%"></div></div>'
       + ''.join(f'<div id="§tk{i}" class="abs" style="left:{[200, 706, 1212, 1460][i]}px;top:600px;width:{260 if i in (0, 3) else 200}px;margin-left:{-100 if i in (1, 2) else 0}px;text-align:{["left", "center", "center", "right"][i]};font-family:Outfit;font-weight:700;font-size:46px;color:#141032;opacity:0">{lab}</div>' for i, lab in enumerate(['Transfer', '24 h', '48 h', '72 h']))
       + f'<div id="§sh" class="abs" style="left:150px;top:440px;width:130px;height:130px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 40px rgba(114,63,217,.45)"><div style="width:76px;height:76px">{ic("shield-alert", "#723fd9")}</div></div>'
       '<div id="§nt" class="label abs" style="left:200px;top:760px;font-size:34px;font-weight:600;color:#8a3a00">Illustrative — real screen still to capture.</div>'
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 900, 860, 40, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.4}); flipEl('#§ht',.3,{d:.7}); hlg('#§ht .hl',.5,2);
tl.fromTo('#§bar',{scaleX:0},{scaleX:1,duration:2.2,ease:'power2.inOut'},.7);
tl.fromTo('#§sh',{x:0,scale:.6,opacity:0},{x:1490,scale:1,opacity:1,duration:2.2,ease:'power2.inOut'},.7);
[0,1,2,3].forEach(i=>tl.fromTo('#§tk'+i,{opacity:0,y:24},{opacity:1,y:0,duration:.4},.8+i*.6));
rise('#§nt',2.2,{y:16,d:.5});
twinkle('#§sp1',1.6); twinkle('#§sp2',2.6);
""")

# ================================================================= c24 outcome
S['c24'] = dict(
 html=('<div id="§o0" class="kicker abs" style="left:200px;top:140px;color:#3a3560">Target outcome</div>'
       '<div id="§o1" class="t abs" style="left:200px;top:200px;width:1100px;font-size:110px">More people <span class="hl">pause</span> before they transfer.</div>'
       '<div style="position:absolute;left:200px;top:470px;width:1520px;height:360px;border-bottom:4px solid #141032">'
       + ''.join(f'<div id="§br{i}" style="position:absolute;bottom:0;left:{40 + i * 350}px;width:230px;border-radius:26px 26px 0 0;background:linear-gradient(180deg,#b99bff,#723fd9)"></div>' for i in range(3))
       + '<div id="§br3" style="position:absolute;bottom:0;left:1090px;width:230px;border-radius:22px 22px 0 0;border:5px dashed #723fd9;border-bottom:0;background:repeating-linear-gradient(135deg,rgba(216,201,255,.8) 0 14px,rgba(244,238,255,.8) 14px 28px)"></div>'
       '<div id="§tgt" class="label" style="position:absolute;left:1350px;top:20px;font-size:38px;font-weight:700;color:#5a2cc4;line-height:1.2;width:180px">target —<br>measured in pilot</div></div>'
       '<div id="§note" class="label abs" style="left:200px;top:845px;font-size:28px;color:#3a3560">Illustrative shape, no values.</div>'
       + spark('§sp1', 1500, 250, 56) + spark('§sp2', 1400, 700, 44, '#ffffff')),
 js="""
rise('#§o0',.2,{y:24,d:.4}); ttl('#§o1',.3,'zoomout',{d:.9}); hlg('#§o1 .hl',.6,2);
[[0,80],[1,160],[2,250],[3,340]].forEach(([i,h],k)=>tl.fromTo('#§br'+i,{height:0},{height:h,duration:.8,ease:'back.out(1.4)'},1.3+k*.3));
tl.fromTo('#§tgt',{opacity:0,x:-20},{opacity:1,x:0,duration:.5},2.7); rise('#§note',2.9,{y:14,d:.4});
tl.fromTo('#§br3',{boxShadow:'0 0 0 rgba(114,63,217,0)'},{boxShadow:'0 0 40px rgba(114,63,217,.6)',duration:.6,yoyo:true,repeat:3,ease:'sine.inOut'},2.8);
twinkle('#§sp1',2.2); twinkle('#§sp2',3.4);
""")

# ================================================================= c25 SDG
S['c25'] = dict(
 html=(head('Expected contribution · to validate', 'Four goals.', y=130, w=1500, size=112, hl='goals.')
       + ''.join(f'<div id="§g{i + 1}" class="abs" style="left:{200 + i * 390}px;top:480px;width:340px;text-align:center;font-family:Outfit"><div style="width:230px;height:230px;border-radius:50%;margin:0 auto;background:linear-gradient(135deg,#6a34d6,#b85cff);color:#fff;font-weight:800;font-size:{110 if n < 10 else 92}px;display:flex;align-items:center;justify-content:center;box-shadow:0 24px 60px rgba(114,63,217,.4)">{n}</div><div class="t mid" style="font-size:42px;line-height:1.1;margin-top:26px">{lab}</div></div>'
                 for i, (n, lab) in enumerate([(1, 'Protect savings'), (3, 'Less fear, less isolation'), (10, 'Inclusion for people 60+'), (16, 'Fraud-resistant trust')]))
       + spark('§sp1', 1650, 250, 52) + spark('§sp2', 1000, 860, 40, '#ffffff')),
 js="""
rise('#§hk',.2,{y:24,d:.4}); ttl('#§ht',.3,'slide',{d:.7}); hlg('#§ht .hl',.5,2);
ent(['#§g1','#§g2','#§g3','#§g4'],1.1,'bounce',{st:.3});
[1,2,3,4].forEach(i=>{ 
  bob('#§g'+i,2.2+i*.1,1.0,10); });
twinkle('#§sp1',1.6); twinkle('#§sp2',2.8);
""")

# ================================================================= c26 bank layer
S['c26'] = dict(
 html=(head('Industry fit · banking and fintech', 'A warning layer before Confirm.', y=290, w=800, size=96, hl='Confirm.')
       + '<div id="§bk" class="cardl abs" style="left:1020px;top:200px;width:700px;height:560px;padding:40px;overflow:hidden">'
       '<div class="label" style="font-size:34px;font-weight:600;color:#4b4670">Transfer</div>'
       '<div class="label" style="font-size:30px;color:#6b6592;margin-top:18px">To · new beneficiary</div>'
       '<div class="t" style="font-size:76px;margin:6px 0 30px">50,000,000 ₫</div>'
       '<div data-layout-allow-overlap style="height:96px;border-radius:22px;background:#141032;color:#fff;font-size:42px;font-weight:600;display:flex;align-items:center;justify-content:center;font-family:Outfit">Confirm transfer</div>'
       '<div id="§ov" data-layout-allow-overlap style="position:absolute;left:0;top:0;width:100%;height:100%;background:#f9f7ff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">'
       '<svg width="170" height="170" viewBox="0 0 320 320"><defs><linearGradient id="§og" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b99bff"/><stop offset="1" stop-color="#f08bff"/></linearGradient></defs><rect x="62" y="52" width="78" height="216" rx="39" fill="url(#§og)"/><rect x="180" y="52" width="78" height="216" rx="39" fill="url(#§og)"/></svg>'
       '<div class="t" style="font-size:62px">Pause. Verify.</div><div class="label" style="font-size:34px;color:#4b4670">Someone you trust can look first.</div></div></div>'
       '<div id="§m2" class="label abs" style="left:200px;top:610px;font-size:30px;font-weight:600;color:#8a3a00">Concept sketch — not a real bank screen.</div>'
       + spark('§sp1', 940, 150, 50) + spark('§sp2', 1690, 780, 40, '#ffd3f6')),
 js="""
rise('#§hk',.2,{y:24,d:.4}); flipEl('#§ht',.3,{d:.8}); hlg('#§ht .hl',.5,2); rise('#§m2',1.0,{y:16,d:.5});
tl.fromTo('#§bk',{opacity:0,y:90,scale:.92,rotationY:-30,rotationX:8,transformPerspective:1400},{opacity:1,y:0,scale:1,rotationY:-6,rotationX:0,duration:.9,ease:'expo.out'},.5);
tl.fromTo('#§ov',{y:600},{y:0,duration:.8,ease:'power3.out'},1.8);
twinkle('#§sp1',2.2); twinkle('#§sp2',3.0);
""")

# ================================================================= c27 honest numbers
S['c27'] = dict(
 html=('<div id="§q0" class="kicker abs" style="left:200px;top:130px;color:#d9c8ff">Our honest numbers</div>'
       '<div id="§q1" class="t" style="position:absolute;left:192px;top:190px;font-size:300px;font-weight:800;letter-spacing:-.04em;color:#fff;line-height:1">0</div>'
       '<div id="§q2" class="t mid" style="position:absolute;left:200px;top:510px;font-size:62px;color:#fff">messages — written by us.</div>'
       '<div id="§q3" class="t" style="position:absolute;left:200px;top:610px;font-size:62px"><span class="hlw">0 real victim messages yet.</span></div>'
       '<div id="§q4" class="card abs" style="left:1010px;top:230px;width:718px;padding:36px 40px;border-radius:34px">'
       '<div style="display:flex;align-items:baseline;gap:22px"><div id="§q5" class="t" style="font-size:116px;color:#fff;font-weight:800">0.0%</div><div class="label" style="font-size:34px;color:#e2daff;line-height:1.15;width:260px">of scam messages flagged</div></div>'
       '<div style="display:flex;align-items:baseline;gap:22px;margin-top:26px"><div id="§q6" class="t" style="font-size:116px;color:#fff;font-weight:800">0.0%</div><div class="label" style="font-size:34px;color:#e2daff;line-height:1.15;width:260px">of ordinary messages wrongly marked High risk</div></div>'
       '<div class="label" style="font-size:28px;color:#d4c9f5;margin-top:22px;line-height:1.3">Internal test set · 24 Sep 2026<br><span style="color:#ffbd8a">Rules v1.6.1 — re-run before filming</span></div></div>'
       '<div id="§q7" class="t mid" style="position:absolute;left:200px;top:712px;font-size:42px;color:#fff;width:760px;line-height:1.15">Next: a pilot with older adults and their families.</div>'
       + spark('§sp1', 1680, 150, 52) + spark('§sp2', 880, 700, 40, '#ffd3f6')),
 js="""
rise('#§q0',.2,{y:24,d:.4}); count('#§q1',0,571,.3,1.3,v=>Math.round(v));
tl.fromTo('#§q1',{opacity:0,rotationX:-70,y:80,transformPerspective:900,transformOrigin:'0% 100%'},{opacity:1,rotationX:0,y:0,duration:.7,ease:'back.out(1.4)'},.3);
flipEl('#§q2',1.0,{d:.7}); flipEl('#§q3',1.5,{d:.7});
tl.fromTo('#§q4',{opacity:0,y:70,scale:.95,rotationY:35,transformPerspective:1300},{opacity:1,y:0,scale:1,rotationY:0,duration:.8,ease:'expo.out'},1.9);
count('#§q5',0,92.1,2.2,1.4,v=>v.toFixed(1)+'%'); count('#§q6',0,1.8,2.6,1.1,v=>v.toFixed(1)+'%');
rise('#§q7',3.6,{y:30,d:.6});
twinkle('#§sp1',2.7); twinkle('#§sp2',3.7);
""")

# ================================================================= c28 end
S['c28'] = dict(
 html=('<div id="§halo" class="abs" style="left:700px;top:65px;width:520px;height:520px;border-radius:50%;border:5px solid rgba(255,255,255,.7);opacity:0"></div>'
       '<img id="§logo" class="abs" src="assets/logo-512.png" style="left:770px;top:135px;width:380px;height:380px;border-radius:88px;opacity:0;box-shadow:0 40px 100px rgba(114,63,217,.45)">'
       '<div id="§wm" class="t" style="position:absolute;left:0;width:1920px;top:585px;text-align:center;font-size:156px">Khoan Đã</div>'
       '<div id="§tag" class="t" style="position:absolute;left:0;width:1920px;top:785px;text-align:center;font-size:70px"><span class="hl">Pause. Verify. Protect.</span></div>'
       '<div id="§url" class="t mid" style="position:absolute;left:0;width:1920px;top:885px;text-align:center;font-size:42px;color:#3a3560">khoan-da.onrender.com</div>'
       + spark('§sp1', 630, 180, 60) + spark('§sp2', 1240, 160, 48, '#ffd3f6') + spark('§sp3', 560, 460, 40, '#cfe8ff') + spark('§sp4', 1300, 430, 56)),
 js="""
tl.fromTo('#§logo',{opacity:0,scale:.3,rotation:-14,y:80},{opacity:1,scale:1,rotation:0,y:0,duration:.9,ease:'back.out(1.8)'},.3);
tl.fromTo('#§halo',{opacity:.9,scale:.7},{opacity:0,scale:1.6,duration:1.2,ease:'power2.out'},.5);
flipChars('#§wm',1.0,{st:.05});
rise('#§tag',1.8,{y:40,d:.8}); hlg('#§tag .hl',1.8,2.2);
rise('#§url',2.4,{y:24,d:.6});
['#§sp1','#§sp2','#§sp3','#§sp4'].forEach((s,i)=>twinkle(s,.7+i*.18));
tl.to('#§wrap',{scale:1.03,duration:3.0,ease:'sine.inOut'},1.6);
""")

# ---------------------------------------------------------------- ghi file
def write(path, text):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    open(path, 'w', encoding='utf-8').write(text)

def scene_file(sc):
    sid = sc['id']; p = sid + '-'; K = sc['K']; OVK = OV * K; Dn = sc['Dn']
    s = S[sid]
    leak = f'<div id="{p}leak" class="leak" style="opacity:0"></div>' if sc['kind'] == 'sweep' else ''
    last = sid == SCENES[-1]['id']
    exit_js = '' if last else (f"tl.to('#{p}wrap',{{opacity:0,filter:'blur(16px)',scale:.97,duration:{OVK:.2f},ease:'power2.in'}},{Dn:.2f});")
    js = (PRE.replace('__K__', f'{K:.4f}') + '\n' + entrance(sc['kind'], p, OVK) + '\n' + s['js'].replace('§', p) + '\n' + exit_js
          + f"\nwindow.__timelines['{sid}'] = master;\n")
    html = f"""<template>
<link rel="stylesheet" href="assets/kd.css">
<style>#root{{position:absolute;inset:0;overflow:hidden}}</style>
<div id="root" data-composition-id="{sid}" data-width="1920" data-height="1080">
<div id="{p}wrap" class="wrap">
{s['html'].replace('§', p)}
{leak}
</div></div>
<script>
{js}</script>
</template>
"""
    write(f'compositions/{sid}.html', html)

for sc in SCENES:
    scene_file(sc)

CUES, VOS = [], []
for sc in SCENES:
    for k, ((disp, say), d, off) in enumerate(zip(sc['cues'], sc['ds'], sc['offs'])):
        a = sc['start'] + off
        CUES.append((a, a + d + 0.10, disp))
        VOS.append((f"vo_{sc['id']}_c{k + 1}", f"assets/vo/{sc['id']}_c{k + 1}.wav", round(a, 2), d))

def caption_file():
    cues = ''.join(f'<div id="cap{i}" class="capcue"><span>{t}</span></div>' for i, (a, b, t) in enumerate(CUES))
    tw = ''.join(f"tl.fromTo('#cap{i}',{{opacity:0,y:12}},{{opacity:1,y:0,duration:.2,ease:'power2.out'}},{a:.2f});"
                 f"tl.to('#cap{i}',{{opacity:0,duration:.15,ease:'power1.in'}},{b - .15:.2f});" for i, (a, b, t) in enumerate(CUES))
    html = f"""<template>
<style>
#root{{position:absolute;inset:0}}
.capcue{{position:absolute;left:0;width:1920px;bottom:96px;display:flex;justify-content:center;opacity:0}}
.capcue span{{display:block;white-space:nowrap;font-family:"Outfit",sans-serif;font-weight:500;font-size:40px;line-height:1.25;color:#fff;background:rgba(20,16,50,.8);border-radius:18px;padding:12px 30px}}
</style>
<div id="root" data-composition-id="captions" data-width="1920" data-height="1080">
{cues}
</div>
<script>
const tl = gsap.timeline({{ paused: true }});
{tw}
window.__timelines['captions'] = tl;
</script>
</template>
"""
    write('compositions/captions.html', html)
caption_file()

hosts = []
for i, sc in enumerate(SCENES):
    D = sc['D'] + (OV if i < LAST else 0)
    hosts.append(f'<div id="{sc["id"]}" class="clip" data-composition-id="{sc["id"]}" data-composition-src="compositions/{sc["id"]}.html" '
                 f'data-start="{sc["start"]:.2f}" data-duration="{D:.2f}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index:{i + 2}"></div>')
hosts.append('<div id="captions" class="clip" data-composition-id="captions" data-composition-src="compositions/captions.html" '
             f'data-start="0" data-duration="{TOTAL}" data-track-index="2" data-track-kind="captions" data-width="1920" data-height="1080" style="z-index:100"></div>')

audios = []
for vid, src, a, d in VOS:
    audios.append(f'<audio id="{vid}" src="{src}" data-start="{a}" data-duration="{d}" data-track-index="4" data-volume="1"></audio>')
n = 0
def aud(src, start, dur, vol, fade=0.3, track=3):
    global n
    n += 1
    audios.append(f'<audio id="sfx{n}" src="assets/audio/{src}.mp3" data-start="{start:.2f}" data-duration="{dur}" data-track-index="{track}" data-volume="{vol}" data-fade-out="{fade}"></audio>')
for sc in SCENES[1:]:
    aud('whoosh', max(0, sc['start'] - 0.05), 1.0, 0.4, 0.4)
for sid, tt in (('c06', 0.6), ('c07', 0.6), ('c08', 0.8), ('c08a', 1.6), ('c08b', 1.4), ('c08d', 1.5), ('c10', 0.8), ('c11', 1.3), ('c12', 1.3), ('c13', 2.1), ('c14', 3.5), ('c16', 0.9), ('c20', 1.2), ('c21', 0.8), ('c24', 1.3), ('c25', 0.9)):
    sc = next(s for s in SCENES if s['id'] == sid)
    aud('tap', sc['start'] + tt / sc['K'], 0.4, 0.65, 0.05, 7)
for sid, tt in (('c08c', 2.6), ('c05', 0.4), ('c16', 3.5), ('c28', 0.4), ('c14', 3.6)):
    sc = next(s for s in SCENES if s['id'] == sid)
    aud('chime', sc['start'] + tt / sc['K'], 1.6, 0.4, 0.6, 6)
if os.path.exists('assets/audio/music.mp3'):
    audios.append(f'<audio id="music" src="assets/audio/music.mp3" data-start="0" data-duration="{TOTAL - 0.45:.2f}" data-track-index="5" data-volume="0.75" data-fade-in="2" data-fade-out="3"></audio>')

MODE = {'c08a': 3, 'c08b': 1, 'c08c': 2, 'c08d': 4, 'c01': 2, 'c02': 6, 'c03': 5, 'c04': 3, 'c05': 0, 'c06': 4, 'c07': 5, 'c08': 6, 'c09': 1, 'c10': 3, 'c11': 4, 'c12': 5, 'c13': 2, 'c14': 6, 'c15': 3, 'c16': 5, 'c17': 1, 'c18': 2, 'c19': 6, 'c20': 0, 'c21': 4, 'c22': 1, 'c23': 3, 'c24': 5, 'c25': 2, 'c26': 6, 'c27': 1, 'c28': 0}
world = dict(total=TOTAL, scenes=[dict(t0=round(s['start'], 2), theme=s['theme'], mode=MODE[s['id']], free=s['free'], hero=s['hero']) for s in SCENES])
index = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #0f0b26; }}
      #root {{ width: 100%; height: 100%; position: relative; font-family: "Outfit", sans-serif; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1920" data-height="1080">
      <canvas id="world" class="clip" data-start="0" data-duration="{TOTAL}" data-track-index="0" width="1920" height="1080" data-layout-ignore style="position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:0"></canvas>
      {chr(10).join('      ' + h for h in hosts).strip()}
      {chr(10).join('      ' + a for a in audios).strip()}
    </div>
    <script>window.WORLD = {json.dumps(world)};</script>
    <script type="module" src="assets/world.js"></script>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
"""
write('index.html', index)
marks = {s['mark']: round(s['start'], 2) for s in SCENES if s['mark']}
json.dump(dict(total=TOTAL, marks=marks, vo=[[a, d] for _, _, a, d in VOS], scenes=[dict(id=s['id'], start=round(s['start'], 2), D=round(s['D'], 2), K=round(s['K'], 3)) for s in SCENES]), open('timeline.json', 'w'), indent=1)
print('ok', len(SCENES), 'scenes, total', TOTAL, 's')
for s in SCENES:
    print(' ', s['id'], 'start', round(s['start'], 1), 'D', round(s['D'], 1), 'K', round(s['K'], 2))
