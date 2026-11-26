// Nền 3D điện ảnh: gradient sạch + lụa (silk ribbons) 3D chuyển động + vài khối kính. Mọi thứ là hàm của t (hf-seek).
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.181.2/+esm";
THREE.ColorManagement.enabled = false;

const WD = window.WORLD;                       // {total, scenes:[{t0,theme,free,hero}]}
const canvas = document.getElementById("world");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(1920, 1080, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.autoClear = false;

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const col = (h) => new THREE.Color(h);

// ---------- bảng màu: sạch, bão hoà, tương phản ----------
const PAL = {
  light: { base: "#f7f3ff", b1: "#ff9fe5", b2: "#a98bff", b3: "#8fc8ff", k: [0.80, 0.75, 0.55], rA: "#b79bff", rB: "#ffbdee", rC: "#a9d8ff", rAlpha: 0.60, glass: 0.7 },
  dark:  { base: "#08061c", b1: "#6a2cf0", b2: "#e0399f", b3: "#2a6cff", k: [0.85, 0.65, 0.55], rA: "#7a52ee", rB: "#d94ab5", rC: "#4a8bff", rAlpha: 0.55, glass: 0.8 },
  red:   { base: "#150410", b1: "#d41f46", b2: "#6a24d8", b3: "#ff8a3d", k: [0.85, 0.60, 0.45], rA: "#e04a68", rB: "#e8944d", rC: "#9a5ae0", rAlpha: 0.5, glass: 0.75 },
  deep:  { base: "#050b24", b1: "#1aa3b8", b2: "#4a3fe0", b3: "#2a6cff", k: [0.80, 0.70, 0.55], rA: "#3bb7c9", rB: "#6a5cf0", rC: "#4a8bff", rAlpha: 0.55, glass: 0.8 },
  peach: { base: "#fff6ee", b1: "#ffb199", b2: "#ffc978", b3: "#ff9fcf", k: [0.80, 0.70, 0.55], rA: "#ffa98a", rB: "#ffd28a", rC: "#ffb0d6", rAlpha: 0.60, glass: 0.7 },
  sky:   { base: "#f2f8ff", b1: "#8fc8ff", b2: "#a9a3ff", b3: "#9ff0e6", k: [0.80, 0.72, 0.55], rA: "#8fb8ff", rB: "#b9a8ff", rC: "#8fe6dc", rAlpha: 0.60, glass: 0.7 },
  mint:  { base: "#f6f3ff", b1: "#8ff0cf", b2: "#bba4ff", b3: "#ffe9a6", k: [0.78, 0.70, 0.55], rA: "#b79bff", rB: "#7fe3c4", rC: "#ffe08a", rAlpha: 0.60, glass: 0.7 },
};
const P = {};
for (const k in PAL) { const p = PAL[k]; P[k] = { base: col(p.base), b1: col(p.b1), b2: col(p.b2), b3: col(p.b3), k: p.k, rA: col(p.rA), rB: col(p.rB), rC: col(p.rC), rAlpha: p.rAlpha, glass: p.glass }; }

// ---------- nền shader: 7 kiểu nền khác nhau, chuyển mờ giữa hai kiểu ----------
const bgScene = new THREE.Scene();
const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const bgMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uBase: { value: new THREE.Color() }, uB1: { value: new THREE.Color() }, uB2: { value: new THREE.Color() }, uB3: { value: new THREE.Color() },
    uK: { value: new THREE.Vector3(0.8, 0.7, 0.5) }, uRes: { value: new THREE.Vector2(1920, 1080) }, uMd: { value: new THREE.Vector4(0, 0, 0, 0) }, uMix: { value: 1 } },
  vertexShader: "void main(){gl_Position=vec4(position.xy,0.,1.);}",
  fragmentShader: `
    precision highp float;
    uniform float uTime; uniform vec3 uBase; uniform vec3 uB1; uniform vec3 uB2; uniform vec3 uB3; uniform vec3 uK; uniform vec2 uRes; uniform vec4 uMd; uniform float uMix;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
    float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+7.1; a*=.5; } return s; }
    float lineD(float v){ float d=abs(fract(v+.5)-.5); return 1.-smoothstep(0.,fwidth(v)*1.5+.0015,d); }
    vec3 blobs(vec2 p,float asp,float t,float ks){
      vec2 c1=vec2((.5+.38*sin(t*.9))*asp,.5+.30*cos(t*.7));
      vec2 c2=vec2((.5+.40*cos(t*.6+1.7))*asp,.5+.34*sin(t*.8+.6));
      vec2 c3=vec2((.5+.36*sin(t*.5+3.1))*asp,.5+.30*cos(t*.9+2.2));
      vec3 c=uBase;
      float w1=exp(-pow(length(p-c1)*1.15,2.)*1.6)*uK.x*ks;
      float w2=exp(-pow(length(p-c2)*1.1,2.)*1.8)*uK.y*ks;
      float w3=exp(-pow(length(p-c3)*1.2,2.)*2.0)*uK.z*ks;
      c=mix(c,uB1,clamp(w1,0.,1.)); c=mix(c,uB2,clamp(w2,0.,1.)); c=mix(c,uB3,clamp(w3,0.,1.));
      return c; }
    vec3 kind(float m,float seed){
      vec2 uv=gl_FragCoord.xy/uRes; float asp=uRes.x/uRes.y; vec2 p=vec2(uv.x*asp,uv.y);
      float tt=uTime; float t=tt*.16+seed;
      float l=dot(uBase,vec3(.3,.59,.11));
      vec3 ink=mix(vec3(1.),uB2*.5+vec3(.08,.04,.2),smoothstep(.35,.65,l));
      float ia=mix(1.,.5,smoothstep(.35,.65,l));
      vec3 c;
      if(m<.5){ c=blobs(p,asp,t,1.); }
      else if(m<1.5){            // sàn lưới phối cảnh chạy về phía người xem
        c=blobs(p,asp,t,.7);
        float d=.56-uv.y;
        if(d>0.){ float z=1./max(d,.02); float u=(uv.x-.5)*asp*z*.45; float v=z*.5+tt*.45;
          float ln=max(lineD(u),lineD(v))*smoothstep(0.,.3,d);
          c=mix(c,ink,ia*ln*.34); c=mix(c,uB1,smoothstep(.0,.56,d)*.12); }
      } else if(m<2.5){          // sóng tròn lan toả (ra-đa)
        c=blobs(p,asp,t,.75);
        vec2 ce=vec2((.5+.18*sin(t*.7))*asp,.5+.12*cos(t*.9));
        float r=length(p-ce); float ph=r*3.2-tt*.5;
        float ring=pow(.5+.5*cos(ph*6.2832),10.);
        c=mix(c,ink,ia*ring*exp(-r*.7)*.42);
        c=mix(c,uB1,exp(-r*r*5.)*.25);
      } else if(m<3.5){          // dải cực quang chảy ngang
        c=blobs(p,asp,t,.45);
        for(int i=0;i<4;i++){ float fi=float(i);
          float y=.2+.2*fi+.07*sin(uv.x*3.2+tt*.35+fi*1.9+seed)+.035*sin(uv.x*7.-tt*.6+fi);
          float band=smoothstep(.16,0.,abs(uv.y-y));
          vec3 bc=mod(fi,3.)<.5?uB1:(mod(fi,3.)<1.5?uB2:uB3);
          c=mix(c,bc,band*.7); }
      } else if(m<4.5){          // chấm bán sắc, kích cỡ chạy theo sóng
        c=blobs(p,asp,t,.8);
        vec2 g=p*20.; vec2 id=floor(g); vec2 cl=fract(g)-.5;
        float w=.5+.5*sin(length(id/20.-vec2(.5*asp,.5))*5.-tt*.9+seed);
        float sz=.1+.3*w; float dd=length(cl);
        float dot_=1.-smoothstep(sz-.07,sz,dd);
        c=mix(c,ink,ia*dot_*.34*(.4+.6*w));
      } else if(m<5.5){          // tia sáng chéo quét ngang
        c=blobs(p,asp,t,.7);
        float a=uv.x*asp*.7+uv.y*.75;
        float b1=pow(.5+.5*sin(a*4.2-tt*.45+seed),4.);
        float b2=pow(.5+.5*sin(a*2.3+tt*.3+seed*1.7),6.);
        c=mix(c,uB3,b1*.4); c=mix(c,ink,ia*b2*.2);
      } else {                   // đường đồng mức như bản đồ địa hình
        c=blobs(p,asp,t,.75);
        float f=fbm(p*1.7+vec2(tt*.04,-tt*.025)+seed)*9.;
        c=mix(c,ink,ia*lineD(f)*.34);
      }
      return c; }
    void main(){
      vec3 c=kind(uMd.y,uMd.w);
      if(uMix<.999) c=mix(kind(uMd.x,uMd.z),c,uMix);
      vec2 uv=gl_FragCoord.xy/uRes; vec2 q=uv-.5; c*=1.-.28*dot(q,q)*1.6;
      c+= (hash(gl_FragCoord.xy+fract(uTime))-.5)*.022;
      gl_FragColor=vec4(c,1.);
    }`,
  depthTest: false, depthWrite: false, extensions: { derivatives: true },
});
bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

// ---------- cảnh 3D ----------
const scene = new THREE.Scene();
const FOV = 35, CAMZ = 14.5;
const camera = new THREE.PerspectiveCamera(FOV, 1920 / 1080, 0.1, 100);

// dải lụa: xoắn, có phản sáng theo pháp tuyến
function silk(opts) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPh: { value: opts.ph }, uW: { value: opts.w }, uAmp: { value: opts.amp }, uSp: { value: opts.sp },
      uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uAlpha: { value: 0.95 }, uTw: { value: opts.tw } },
    vertexShader: `uniform float uTime; uniform float uPh; uniform float uW; uniform float uAmp; uniform float uSp; uniform float uTw;
      varying vec3 vP; varying vec2 vUv;
      void main(){ vUv=uv; float x=position.x; float v=uv.y-.5;
        float t=uTime*uSp;
        vec3 c=vec3(x, sin(x*.32+t*.9+uPh)*uAmp+sin(x*.71-t*.6+uPh*1.7)*uAmp*.35, cos(x*.27+t*.7+uPh)*uAmp*1.1);
        float th=sin(x*.42+t*.8+uPh)*uTw+cos(x*.19-t*.5)*.6;
        vec3 off=vec3(0., cos(th), sin(th))*v*uW*(1.+.25*sin(x*.5+t));
        vec3 p=c+off; vP=p;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
    fragmentShader: `precision highp float; varying vec3 vP; varying vec2 vUv; uniform vec3 uA; uniform vec3 uB; uniform float uAlpha;
      void main(){
        vec3 n=normalize(cross(dFdx(vP),dFdy(vP))); if(!gl_FrontFacing) n=-n;
        vec3 L=normalize(vec3(-.4,.8,.7)); float d=clamp(dot(n,L),0.,1.);
        vec3 V=vec3(0.,0.,1.); float sp=pow(clamp(dot(reflect(-L,n),V),0.,1.),22.);
        float rim=1.-clamp(abs(n.z),0.,1.);
        vec3 base=mix(uA,uB,clamp(vUv.x*1.1+.15*n.y,0.,1.));
        vec3 c=base*(.55+.65*d)+vec3(1.)*sp*.55+uB*rim*.35;
        float edge=smoothstep(0.,.06,vUv.y)*smoothstep(1.,.94,vUv.y);
        float ends=smoothstep(0.,.07,vUv.x)*smoothstep(1.,.93,vUv.x);
        gl_FragColor=vec4(c,uAlpha*edge*ends); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, extensions: { derivatives: true },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(46, 1, 420, 40), m);
  scene.add(mesh);
  return { mesh, m, o: opts };
}
const ribs = [
  silk({ ph: 0.0, w: 2.2, amp: 0.6, sp: 0.4, tw: 0.9 }),
  silk({ ph: 2.3, w: 2.0, amp: 0.55, sp: 0.38, tw: 0.8 }),
  silk({ ph: 4.1, w: 5.0, amp: 1.5, sp: 0.4, tw: 1.5 }),
  silk({ ph: 5.5, w: 3.2, amp: 1.0, sp: 0.6, tw: 1.0 }),
];

// khối kính: thanh "tạm dừng" (cảnh hero) + vài vòng mảnh
const glassVS = `varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const glassFS = `precision highp float;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uAlpha; uniform float uSeed;
varying vec3 vN; varying vec3 vV;
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(vV);
  float fr=clamp(1.-abs(dot(n,v)),0.,1.); float rim=fr*fr*(3.-2.*fr);
  vec3 L=normalize(vec3(-.5,.7,.6)); float diff=clamp(dot(n,L),0.,1.);
  float spec=pow(clamp(dot(reflect(-L,n),v),0.,1.),40.);
  vec3 base=mix(uA,uB,clamp(diff*.8+.2*n.y+.3,0.,1.));
  vec3 iri=.5+.5*cos(6.2831*(fr*1.1+vec3(0.,.33,.67)+uSeed));
  vec3 c=mix(base,uC,rim*.75)+iri*rim*.3+vec3(spec)*.95;
  float a=clamp(uAlpha*(.5+.9*rim+.4*diff)+spec*.6,0.,1.);
  gl_FragColor=vec4(c,a);
}`;
function glass(g, seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uC: { value: new THREE.Color() }, uAlpha: { value: 0.8 }, uSeed: { value: seed } },
    vertexShader: glassVS, fragmentShader: glassFS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m); scene.add(mesh); return { mesh, m };
}
const capL = glass(new THREE.CapsuleGeometry(0.4, 1.8, 12, 40), 0.0);
const capR = glass(new THREE.CapsuleGeometry(0.4, 1.8, 12, 40), 0.2);
const rings = [glass(new THREE.TorusGeometry(1.3, 0.07, 24, 140), 0.4), glass(new THREE.TorusGeometry(0.8, 0.05, 24, 120), 0.6)];

// bụi sáng rất thưa
const NP = 70;
const pPos = new Float32Array(NP * 3), pRand = new Float32Array(NP * 3);
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pr = rng(11);
for (let i = 0; i < NP; i++) { pPos[i * 3] = (pr() - 0.5) * 20; pPos[i * 3 + 1] = (pr() - 0.5) * 10; pPos[i * 3 + 2] = -6 + pr() * 6; pRand[i * 3] = pr(); pRand[i * 3 + 1] = pr(); pRand[i * 3 + 2] = pr(); }
const pg = new THREE.BufferGeometry();
pg.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
pg.setAttribute("aRand", new THREE.BufferAttribute(pRand, 3));
const pm = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uC: { value: new THREE.Color("#ffffff") } },
  vertexShader: `uniform float uTime; attribute vec3 aRand; varying float vA;
    void main(){ vec3 p=position; p.y=mod(p.y+5.+uTime*(.1+aRand.x*.2),10.)-5.; vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
      gl_PointSize=(1.0+aRand.z*1.8)*(70./(-mv.z)); vA=.3+.7*(.5+.5*sin(uTime*(1.+aRand.x)+aRand.y*6.28)); }`,
  fragmentShader: `precision highp float; uniform vec3 uC; varying float vA; void main(){ float r=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,r); gl_FragColor=vec4(uC,a*a*vA*.7); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});


// ---------- bố cục lụa theo từng cảnh (khác nhau, nằm ở rìa) ----------
const S = WD.scenes;
const LAY = [ // mỗi cảnh: 4 dải {y, rz, z}; 2 dải gần nằm sát mép trên/dưới, 2 dải xa mờ để có chiều sâu
  [{ y: 4.3, rz: -0.10, z: -3 }, { y: -4.5, rz: 0.08, z: -4 }, { y: 1.8, rz: 0.22, z: -10 }, { y: -2.2, rz: -0.2, z: -9 }],
  [{ y: -4.5, rz: 0.08, z: -3 }, { y: 4.4, rz: -0.08, z: -4 }, { y: -1.6, rz: -0.22, z: -10 }, { y: 2.4, rz: 0.2, z: -9 }],
  [{ y: 4.2, rz: 0.12, z: -3 }, { y: -4.3, rz: -0.12, z: -4 }, { y: 0.6, rz: 0.16, z: -10 }, { y: -2.6, rz: -0.26, z: -9 }],
];
const layAt = (si, k) => LAY[si % LAY.length][k];

const tmp = new THREE.Color();
function themeAt(t) {
  let i = 0; for (let k = 0; k < S.length; k++) if (t >= S[k].t0 - 0.6) i = k;
  const s = ss(S[i].t0 - 0.6, S[i].t0 + 1.0, t);
  return { cur: P[S[i].theme], prev: P[S[Math.max(0, i - 1)].theme], s, i };
}
const mixc = (a, b, s) => new THREE.Color().copy(a).lerp(b, s);

function renderAt(t) {
  const { cur, prev, s, i } = themeAt(t);
  const pi = Math.max(0, i - 1);
  bgMat.uniforms.uTime.value = t;
  bgMat.uniforms.uMd.value.set(S[pi].mode || 0, S[i].mode || 0, pi * 2.3, i * 2.3);
  bgMat.uniforms.uMix.value = i === pi ? 1 : s;
  bgMat.uniforms.uBase.value.copy(prev.base).lerp(cur.base, s);
  bgMat.uniforms.uB1.value.copy(prev.b1).lerp(cur.b1, s);
  bgMat.uniforms.uB2.value.copy(prev.b2).lerp(cur.b2, s);
  bgMat.uniforms.uB3.value.copy(prev.b3).lerp(cur.b3, s);
  bgMat.uniforms.uK.value.set(prev.k[0] + (cur.k[0] - prev.k[0]) * s, prev.k[1] + (cur.k[1] - prev.k[1]) * s, prev.k[2] + (cur.k[2] - prev.k[2]) * s);
  const A = mixc(prev.rA, cur.rA, s), B = mixc(prev.rB, cur.rB, s), C = mixc(prev.rC, cur.rC, s);
  const t0 = S[i].t0;
  const k = ss(t0 - 0.7, t0 + 1.4, t);
  const rk = 0.15 + 0.85 * ((S[pi].mode ? 0 : 1) * (1 - s) + (S[i].mode ? 0 : 1) * s);  // lụa chỉ nổi ở cảnh nền mềm
  ribs.forEach((r, n) => {
    r.mesh.visible = n < 2;
    const a = layAt(pi, n), b = layAt(i, n);
    const y = a.y + (b.y - a.y) * k, rz = a.rz + (b.rz - a.rz) * k, z = a.z + (b.z - a.z) * k;
    r.mesh.position.set(Math.sin(t * 0.12 + n) * 1.2, y, z);
    r.mesh.rotation.set(0.1 * Math.sin(t * 0.1 + n), 0, rz + 0.05 * Math.sin(t * 0.2 + n * 2));
    const u = r.m.uniforms;
    u.uTime.value = t;
    const far = z < -6;
    u.uA.value.copy(n % 3 === 0 ? A : n % 3 === 1 ? B : C); u.uB.value.copy(n % 3 === 0 ? B : n % 3 === 1 ? C : A);
    u.uAlpha.value = (prev.rAlpha + (cur.rAlpha - prev.rAlpha) * s) * (far ? 0.26 : 1.0) * rk;
  });
  // khối kính
  const hero = !!S[i].hero, heroPrev = !!S[pi].hero;
  const hk = ss(t0 - 0.5, t0 + 1.2, t);
  const heroAmt = (hero ? hk : 0) + (heroPrev ? 1 - hk : 0) * (i === pi ? 0 : 1);
  const hv = Math.max(0, Math.min(1, hero ? (i === pi ? 1 : hk) : (heroPrev ? 1 - hk : 0)));
  [[capL, -1], [capR, 1]].forEach(([c, sd]) => {
    c.mesh.position.set(sd * (6.4 + (1 - hv) * 1.5), (sd < 0 ? 0.9 : -0.7) + Math.sin(t * 0.8 + sd) * 0.15, -2.6);
    c.mesh.scale.setScalar(Math.max(0.001, 1.35 * hv));
    c.mesh.rotation.set(0.1 * Math.sin(t * 0.5), t * 0.35 * sd, 0.45 * sd);
    const u = c.m.uniforms; u.uA.value.copy(sd < 0 ? A : B); u.uB.value.copy(sd < 0 ? B : C); u.uC.value.copy(C); u.uAlpha.value = (prev.glass + (cur.glass - prev.glass) * s);
  });
  rings.forEach((r, n) => {
    r.mesh.visible = false;
    const side = n ? -1 : 1;
    r.mesh.position.set(side * (6.4 - n * 0.6) + Math.sin(t * 0.4 + n) * 0.3, (n ? -3.2 : 3.0) + Math.cos(t * 0.5 + n) * 0.3, -2 - n);
    r.mesh.scale.setScalar(1.0 + 0.25 * Math.sin(t * 0.6 + n));
    r.mesh.rotation.set(t * 0.3 + n, t * 0.22, t * 0.15);
    const u = r.m.uniforms; u.uA.value.copy(A); u.uB.value.copy(B); u.uC.value.copy(C); u.uAlpha.value = (prev.glass + (cur.glass - prev.glass) * s) * 0.9;
  });
  pm.uniforms.uTime.value = t;
  pm.uniforms.uC.value.set((cur.base.r + cur.base.g + cur.base.b) > 1.5 ? "#ffffff" : "#e6d9ff");
  const push = Math.exp(-(t - t0) * 1.2) * (t >= t0 ? 1 : 0);
  camera.position.set(Math.sin(t * 0.15) * 0.8, Math.cos(t * 0.11) * 0.45, CAMZ + 1.4 * push);
  camera.lookAt(0, 0, 0);
  renderer.clear();
  renderer.render(bgScene, bgCam);
  renderer.clearDepth();
  renderer.render(scene, camera);
}
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
