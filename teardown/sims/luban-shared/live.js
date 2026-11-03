// 鲁班木鹊 as a page you drive: the bird runs in the middle, the panels read the same numbers that move it, buttons open
// the part doing the work. Left alone it tours itself; any click, drag, wheel or key hands control to the visitor and
// 25 s of quiet hands it back.
import * as THREE from 'three';
import {AERO, AREA, BAT_WH, CEIL, CG_MAC, createFlight, FLOOR, irradiance, MAC, MASS_G, MODE_NAME, PARTS, SOLAR_AREA, sunAt, VARIO_TRIGGER, AR} from './bird.js';
import {buildBird, COL} from './model.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const D2R = Math.PI / 180;
const IDLE = 25;

const CSS = `
:root{--bg:#efe6d6;--ink:#2b2118;--dim:rgba(43,33,24,.62);--mute:rgba(43,33,24,.4);--line:rgba(43,33,24,.14);--panel:rgba(250,245,234,.9);--ac:#d9482b;--blue:#2a5db0;--green:#3f7d4e}
html,body{background:var(--bg)}
#app{font-family:'Inter','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
#gl{touch-action:none;cursor:grab}#gl.drag{cursor:grabbing}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
.ui{position:absolute;inset:0;pointer-events:none}
.hd{position:absolute;left:0;right:0;top:0;height:64px;padding:14px 22px;display:flex;align-items:center;gap:16px;background:linear-gradient(var(--bg) 55%,transparent)}
.hd h1{margin:0;font-size:24px;font-weight:700;letter-spacing:.06em;display:flex;align-items:center;gap:10px}
.hd h1:before{content:'';width:6px;height:26px;background:var(--ac)}
.hd .sub{font-size:12px;color:var(--dim);letter-spacing:.08em}
.hd .clk{margin-left:auto;font-size:13px;color:var(--dim);text-align:right}
.chip{pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:8px;height:26px;padding:0 12px;border:1px solid var(--line);border-radius:4px;background:var(--panel);font:700 11px 'JetBrains Mono',monospace;letter-spacing:.08em;white-space:nowrap}
.chip i{width:7px;height:7px;border-radius:50%;background:var(--ac)}
.chip.on i{animation:bl 1.2s steps(2) infinite}@keyframes bl{50%{opacity:.15}}
.side{position:absolute;top:60px;bottom:112px;width:288px;display:flex;flex-direction:column;gap:10px;overflow:hidden}
.side.l{left:16px}.side.r{right:16px}
.pn{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:11px 13px;pointer-events:auto;backdrop-filter:blur(4px)}
.pn h3{margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--dim);display:flex;justify-content:space-between}
.pn h3 b{color:var(--ac);font-weight:700}
.row3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.k{font-size:10px;color:var(--mute);letter-spacing:.06em}
.v{font-size:22px;font-weight:600;line-height:1.15}.v small{font-size:11px;color:var(--dim);font-weight:400;margin-left:2px}
.pos{color:var(--green)}.neg{color:var(--ac)}
.bar{height:9px;background:rgba(43,33,24,.1);border-radius:2px;overflow:hidden;margin-top:5px}
.bar i{display:block;height:100%;background:var(--green);transition:background .3s}
canvas.ch{width:100%;display:block;margin-top:6px}
.mode{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.mode b{font-size:20px;letter-spacing:.06em}
.mode .dot{width:11px;height:11px;border-radius:50%;background:var(--ink)}
.wt{display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:11.5px;align-items:center}
.wt .bb{grid-column:1/3;height:3px;background:rgba(43,33,24,.1);margin-bottom:3px}.wt .bb i{display:block;height:100%;background:var(--bamboo,#c79a3c)}
.log{font-size:11px;line-height:1.45;color:var(--dim)}.log div{margin-bottom:3px}.log b{color:var(--ink);font-weight:600}
.co{position:absolute;pointer-events:none;width:176px;padding:5px 8px;border:1px solid var(--line);border-left:3px solid var(--ac);background:var(--panel);border-radius:3px;font-size:11.5px;line-height:1.35}
.co b{display:block;font-size:12.5px}.co span{color:var(--dim)}
svg.ln{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.ctl{position:absolute;left:0;right:0;bottom:0;height:112px;padding:10px 16px 12px;display:flex;gap:18px;align-items:flex-end;justify-content:center;background:linear-gradient(transparent,var(--bg) 40%)}
.grp{display:flex;flex-direction:column;gap:5px;pointer-events:auto}
.grp>label{font-size:10px;letter-spacing:.14em;color:var(--mute);font-weight:700}
.btns{display:flex;gap:4px;flex-wrap:wrap}
.bt{pointer-events:auto;cursor:pointer;height:30px;padding:0 11px;border:1px solid var(--line);border-radius:4px;background:var(--panel);color:var(--ink);font:600 12.5px inherit;font-family:inherit;white-space:nowrap}
.bt:hover{background:#fff}.bt.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.bt .kb{font:600 9px 'JetBrains Mono',monospace;opacity:.5;margin-left:5px}
.sl{display:flex;align-items:center;gap:8px;font-size:12px;height:30px}
.sl input{width:104px;accent-color:var(--ac)}
.sl span{min-width:42px;text-align:right}
.cap{position:absolute;left:50%;bottom:122px;transform:translateX(-50%);max-width:min(620px,52vw);padding:9px 16px;background:var(--ink);color:var(--bg);border-radius:4px;font-size:14px;line-height:1.5;text-align:center;opacity:0;transition:opacity .4s}
.cap.show{opacity:.94}
@media(max-width:1100px){.side{display:none}.co{display:none}.ctl{flex-wrap:wrap;height:auto;gap:8px}.cap{bottom:150px}}
`;

const HTML = `
<div class="ui">
<svg class="ln" id="ln"></svg><div id="cos"></div>
<div class="hd"><h1>鲁班木鹊</h1><div class="sub">LUBAN-QUE SR-1 · 太阳能追风飞鸟 · 翼展 1.5 M</div><div class="chip on" id="tour" style="margin-left:18px"></div><div class="clk mono" id="clk"></div></div>
<aside class="side l">
 <div class="pn"><h3>能量账本 <b id="ebal"></b></h3>
  <div class="row3"><div><div class="k">发电</div><div class="v mono" id="pS">0<small>W</small></div></div><div><div class="k">用电</div><div class="v mono" id="pL">0<small>W</small></div></div><div><div class="k">净</div><div class="v mono" id="pN">0<small>W</small></div></div></div>
  <div class="k" style="margin-top:9px;display:flex;justify-content:space-between"><span>电池 2S 800mAh</span><span class="mono" id="soc"></span></div><div class="bar"><i id="socb"></i></div>
  <canvas class="ch" id="chP" height="70"></canvas>
  <div class="k" style="margin-top:4px;display:flex;justify-content:space-between"><span>■ 光伏发电</span><span style="color:var(--ac)">— 全机用电</span></div>
  <div class="k mono" style="margin-top:6px" id="sunl"></div></div>
 <div class="pn" style="flex:1;overflow:hidden"><h3>重量账本 <b id="mass"></b></h3><div class="wt" id="wt"></div>
  <div class="k mono" style="margin-top:6px" id="cgl"></div></div>
</aside>
<aside class="side r">
 <div class="pn"><h3>飞控 ARDUPILOT SOARING</h3>
  <div class="mode"><span class="dot" id="mdot"></span><b id="mname"></b></div>
  <div class="row3"><div><div class="k">高度</div><div class="v mono" id="alt">0<small>m</small></div></div><div><div class="k">升降 VARIO</div><div class="v mono" id="vario">0<small>m/s</small></div></div><div><div class="k">滑翔比</div><div class="v mono" id="ld">0</div></div></div>
  <div class="row3" style="margin-top:6px"><div><div class="k">空速</div><div class="v mono" id="vel" style="font-size:16px">0<small>m/s</small></div></div><div><div class="k">坡度</div><div class="v mono" id="bank" style="font-size:16px">0<small>°</small></div></div><div><div class="k">下沉率</div><div class="v mono" id="sink" style="font-size:16px">0<small>m/s</small></div></div></div>
  <canvas class="ch" id="chA" height="64"></canvas></div>
 <div class="pn"><h3>热气流地图 <b id="mapn"></b></h3><canvas class="ch" id="map" height="200" style="margin-top:0"></canvas></div>
 <div class="pn" style="flex:1;overflow:hidden"><h3>飞行日志</h3><div class="log" id="log"></div></div>
</aside>
<div class="cap" id="cap"></div>
<div class="ctl" id="ctl"></div>
</div>`;

export const VIEWS = {
  hero: {name: '全貌', az: 38, el: 17, d: 3.0, t: [0.05, 0.06, 0]},
  top: {name: '俯视', az: 180, el: 84, d: 3.3, t: [-0.05, 0.05, 0]},
  side: {name: '侧视', az: 90, el: 5, d: 3.0, t: [0.0, 0.07, 0]},
  front: {name: '正面', az: 2, el: 7, d: 3.0, t: [0, 0.07, 0]},
  head: {name: '鸟头', az: 24, el: 12, d: 0.95, t: [0.43, 0.19, 0]},
  tail: {name: '尾翼', az: 205, el: 22, d: 1.5, t: [-0.55, 0.04, 0]},
};
const VKEYS = Object.keys(VIEWS);
const DISP = [
  ['skin', '蒙皮', 's'],
  ['xray', 'X 光', 'x'],
  ['explode', '爆炸', 'e'],
  ['labels', '标注', 'l'],
  ['glow', '光伏高亮', 'p'],
  ['cg', '重心', 'g'],
];

// ------------------------------------------------------------ the auto tour: explicit states, so it never drifts
const T = (t, view, set, text) => ({t, view, set, text});
const TOUR = [
  T(0, 'hero', {skin: 1, xray: 0, explode: 0, labels: 0, glow: 0, cg: 0}, () => `墨子记载公输子“削竹木以为鹊,成而飞之,三日不下”。这只木鹊翼展 1.5 m,总重 ${MASS_G} g。`),
  T(6, 'hero', {labels: 1}, () => '每个部件都标着重量和实时数字:它们和机身运动读的是同一个模型。'),
  T(12, 'top', {skin: 0, labels: 0}, () => '揭开蒙皮:11 片镂空巴尔沙翼肋,穿在火烤定型的竹篾主梁上。'),
  T(18, 'top', {skin: 1, glow: 1}, (f) => `翼面铺 ${SOLAR_AREA.toFixed(2)} m² 柔性单晶硅:此刻发电 ${f.pSolar.toFixed(1)} W,足够把飞行的耗电全包下来。`),
  T(25, 'head', {glow: 0, labels: 1, cg: 1}, () => `鸟头里的拇指相机(15 g)是配重:重心落在平均弦长前缘后 ${(CG_MAC * 100).toFixed(0)}%,头重才飞得稳。`),
  T(32, 'side', {labels: 1, cg: 0, xray: 1}, () => '穿透机身:电池、MPPT 稳压板和飞控,都藏在鸟腹里。'),
  T(39, 'hero', {xray: 0, explode: 1, labels: 0}, () => '爆炸图:翼、鸟头、尾、电子舱、动力舱,每一件都可以单独换。'),
  T(46, 'tail', {explode: 0, labels: 1}, () => 'V 型鸟尾只用两个 4.3 g 舵机,同时管升降和方向。'),
  T(53, 'hero', {labels: 1}, (f) => (f.mode === 'thermal' ? `正在追风:vario 超过 ${VARIO_TRIGGER} m/s,电机停转、桨叶收拢,靠热气流免费爬升。` : '电机以约 12 W 推着木鹊平飞,一旦 vario 超过 0.8 m/s 就会关停电机去追热气流。')),
];
const TOUR_LEN = 62;

export function runLive() {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const app = document.getElementById('app');
  const canvas = document.createElement('canvas');
  canvas.id = 'gl';
  app.appendChild(canvas);
  app.insertAdjacentHTML('beforeend', HTML);
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------ the scene
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: false});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.bg);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 50);
  scene.add(new THREE.HemisphereLight('#fff6e4', '#c9b48e', 1.15));
  const sunL = new THREE.DirectionalLight('#fff0d0', 2.2);
  sunL.castShadow = true;
  sunL.shadow.mapSize.set(2048, 2048);
  Object.assign(sunL.shadow.camera, {left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 0.1, far: 12});
  sunL.shadow.bias = -0.0004;
  sunL.shadow.normalBias = 0.01;
  scene.add(sunL, sunL.target);
  const GY = -0.62;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({opacity: 0.2}));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GY;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(4, 16, '#b9a47c', '#d6c6a4');
  grid.position.y = GY - 0.001;
  grid.material.transparent = true;
  grid.material.opacity = 0.4;
  scene.add(grid);

  const bird = buildBird();
  const pivot = new THREE.Group();
  pivot.rotation.order = 'ZXY';
  pivot.add(bird.root);
  scene.add(pivot);

  // airflow streaks and the rising thermal motes
  const NST = 70;
  const stPos = new Float32Array(NST * 6);
  const stSeed = Array.from({length: NST}, (_, i) => [((i * 0.6180339) % 1) * 3.4 - 1.7, -0.35 + ((i * 0.7548776) % 1) * 1.0, ((i * 0.5698402) % 1) * 1.8 - 0.9, 0.06 + ((i * 0.3247) % 1) * 0.08]);
  const stGeo = new THREE.BufferGeometry();
  stGeo.setAttribute('position', new THREE.BufferAttribute(stPos, 3));
  const streaks = new THREE.LineSegments(stGeo, new THREE.LineBasicMaterial({color: '#6b5a3e', transparent: true, opacity: 0.13}));
  streaks.frustumCulled = false;
  scene.add(streaks);
  const NM = 90;
  const moPos = new Float32Array(NM * 3);
  const moSeed = Array.from({length: NM}, (_, i) => [((i * 0.6180339) % 1) * Math.PI * 2, 0.25 + ((i * 0.7548776) % 1) * 0.8, ((i * 0.5698402) % 1)]);
  const moGeo = new THREE.BufferGeometry();
  moGeo.setAttribute('position', new THREE.BufferAttribute(moPos, 3));
  const dotTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.55, 'rgba(255,255,255,.9)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  const motes = new THREE.Points(moGeo, new THREE.PointsMaterial({color: COL.accent, size: 0.024, map: dotTex, transparent: true, opacity: 0, depthWrite: false}));
  motes.frustumCulled = false;
  scene.add(motes);

  // ------------------------------------------------------------ state
  let F = createFlight(11);
  let speed = 2;
  let tNow = 0;
  let spin = 0;
  const target = {skin: 1, xray: 0, explode: 0, labels: 1, glow: 0, cg: 0};
  const cur = {...target, labels: 0};
  let view = 'hero';
  const cam = {...VIEWS.hero, t: [...VIEWS.hero.t]};
  const off = {az: 0, el: 0, k: 1};
  let tourOn = true;
  let tourT0 = 0;
  let lastInput = 0;
  let lastText = '';

  // ------------------------------------------------------------ controls
  const ctl = $('ctl');
  const bt = {};
  const mkGroup = (label, inner) => {
    const g = document.createElement('div');
    g.className = 'grp';
    g.innerHTML = `<label>${label}</label>`;
    g.appendChild(inner);
    ctl.appendChild(g);
    return g;
  };
  const mkBtn = (txt, key, fn, id) => {
    const b = document.createElement('button');
    b.className = 'bt';
    b.innerHTML = key ? `${txt}<span class="kb">${key}</span>` : txt;
    b.addEventListener('click', () => {
      takeOver();
      fn();
    });
    if (id) bt[id] = b;
    return b;
  };
  const row = () => Object.assign(document.createElement('div'), {className: 'btns'});
  const vr = row();
  VKEYS.forEach((k, i) => vr.appendChild(mkBtn(VIEWS[k].name, i + 1, () => setView(k), 'v_' + k)));
  mkGroup('视角', vr);
  const dr = row();
  for (const [k, name, key] of DISP) dr.appendChild(mkBtn(name, key.toUpperCase(), () => toggle(k), 'd_' + k));
  mkGroup('拆解', dr);
  const er = document.createElement('div');
  er.className = 'btns';
  const slider = (label, min, max, step, val, fmt, apply) => {
    const d = document.createElement('div');
    d.className = 'sl';
    d.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><span class="mono"></span>`;
    const inp = d.querySelector('input');
    const out = d.lastChild;
    const upd = () => {
      out.textContent = fmt(+inp.value);
      apply(+inp.value);
    };
    inp.addEventListener('input', () => {
      takeOver();
      upd();
    });
    d.set = (v) => {
      inp.value = v;
      out.textContent = fmt(v);
    };
    out.textContent = fmt(val);
    return d;
  };
  const sTime = slider('时间', 6.5, 17.5, 0.05, F.hour, (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`, (h) => (F.hour = h));
  const sCloud = slider('云量', 0, 1, 0.01, F.cloud, (c) => `${Math.round(c * 100)}%`, (c) => (F.cloud = c));
  const envBox = document.createElement('div');
  envBox.style.cssText = 'display:flex;flex-direction:column;gap:0';
  envBox.append(sTime, sCloud);
  mkGroup('天气', envBox);
  const sp = row();
  [1, 2, 6, 20].forEach((n) => sp.appendChild(mkBtn(`${n}×`, '', () => (speed = n), 'sp' + n)));
  mkGroup('时间流速', sp);
  const cr = row();
  [[1.5, '本地记录'], [2, '5.8G 图传'], [4, '4G 图传']].forEach(([w, n]) => cr.appendChild(mkBtn(`${n} ${w}W`, '', () => (F.camW = w), 'cw' + w)));
  cr.appendChild(mkBtn('视觉找鸟', 'B', () => (F.vision = !F.vision), 'vision'));
  cr.appendChild(mkBtn('重新放飞', 'R', () => resetFlight(), 'reset'));
  mkGroup('相机 / 飞行', cr);

  const takeOver = () => {
    lastInput = tNow;
    if (tourOn) {
      tourOn = false;
      cam.az = cam.az; // keep where the tour left the camera
    }
  };
  const startTour = () => {
    tourOn = true;
    tourT0 = tNow;
    lastInput = tNow;
    Object.assign(off, {az: 0, el: 0, k: 1});
  };
  $('tour').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    lastInput = tNow;
    if (tourOn) takeOver();
    else startTour();
  });
  const setView = (k) => {
    view = k;
    Object.assign(off, {az: 0, el: 0, k: 1});
  };
  const toggle = (k) => (target[k] = target[k] ? 0 : 1);
  const resetFlight = () => {
    const keep = {hour: F.hour, cloud: F.cloud, camW: F.camW, vision: F.vision};
    F = createFlight(11);
    Object.assign(F, keep);
  };
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (/^[1-6]$/.test(k)) bt['v_' + VKEYS[+k - 1]].click();
    else if (DISP.some((d) => d[2] === k)) bt['d_' + DISP.find((d) => d[2] === k)[0]].click();
    else if (k === 'b') bt.vision.click();
    else if (k === 'r') bt.reset.click();
    else return;
    e.preventDefault();
  });
  addEventListener('pointerdown', (e) => {
    if (e.target === canvas) takeOver();
  });
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = {x: e.clientX, y: e.clientY};
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('drag');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    off.az -= (e.clientX - drag.x) * 0.4;
    off.el = clamp(off.el + (e.clientY - drag.y) * 0.3, -60, 80);
    drag = {x: e.clientX, y: e.clientY};
    lastInput = tNow;
  });
  const endDrag = () => {
    drag = null;
    canvas.classList.remove('drag');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    takeOver();
    off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.3, 2.4);
  }, {passive: false});

  // ------------------------------------------------------------ panels
  $('wt').innerHTML = PARTS.map((p) => `<span>${p.name}</span><span class="mono">${p.g} g</span><div class="bb"><i style="width:${(p.g / 215) * 100}%"></i></div>`).join('');
  $('mass').textContent = `${MASS_G} g`;
  $('cgl').textContent = `机翼 ${AREA.toFixed(3)} m² · 展弦比 ${AR.toFixed(1)} · 翼载 ${(MASS_G / AREA / 100).toFixed(1)} g/dm² · 重心 ${(CG_MAC * 100).toFixed(0)}% MAC`;

  const fitCanvas = (c, h) => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.clientWidth || 260;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    return [g, w, h];
  };
  const drawPower = () => {
    const [g, w, h] = fitCanvas($('chP'), 70);
    const H = F.hist;
    const maxP = 60;
    g.strokeStyle = 'rgba(43,33,24,.12)';
    g.lineWidth = 1;
    for (const p of [20, 40, 60]) {
      const y = h - (p / maxP) * (h - 4) - 2;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    if (H.length < 2) return;
    const X = (i) => (i / 149) * w + w * (1 - (H.length - 1) / 149);
    g.fillStyle = 'rgba(42,93,176,.28)';
    g.beginPath();
    g.moveTo(X(0), h);
    H.forEach((p, i) => g.lineTo(X(i), h - (Math.min(p.solar, maxP) / maxP) * (h - 4) - 2));
    g.lineTo(X(H.length - 1), h);
    g.fill();
    g.strokeStyle = COL.accent;
    g.lineWidth = 1.8;
    g.beginPath();
    H.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](X(i), h - (Math.min(p.load, maxP) / maxP) * (h - 4) - 2));
    g.stroke();
    g.fillStyle = 'rgba(43,33,24,.45)';
    g.font = "9px 'JetBrains Mono'";
    g.fillText('60 W', 2, 10);
  };
  const MODE_COL = {cruise: '#2b2118', thermal: COL.accent, glide: '#2a5db0'};
  const drawAlt = () => {
    const [g, w, h] = fitCanvas($('chA'), 64);
    const Y = (m) => h - 3 - (m / 450) * (h - 8);
    g.setLineDash([3, 3]);
    g.strokeStyle = 'rgba(43,33,24,.3)';
    for (const m of [FLOOR, CEIL]) {
      g.beginPath();
      g.moveTo(0, Y(m));
      g.lineTo(w, Y(m));
      g.stroke();
    }
    g.setLineDash([]);
    g.fillStyle = 'rgba(43,33,24,.45)';
    g.font = "9px 'JetBrains Mono'";
    g.fillText(`${CEIL} m 上限`, 2, Y(CEIL) - 2);
    g.fillText(`${FLOOR} m 电机接管`, 2, Y(FLOOR) - 2);
    const H = F.hist;
    if (H.length < 2) return;
    const X = (i) => (i / 149) * w + w * (1 - (H.length - 1) / 149);
    g.lineWidth = 2;
    for (let i = 1; i < H.length; i++) {
      g.strokeStyle = MODE_COL[H[i].mode];
      g.beginPath();
      g.moveTo(X(i - 1), Y(H[i - 1].h));
      g.lineTo(X(i), Y(H[i].h));
      g.stroke();
    }
  };
  const drawMap = () => {
    const [g, w, h] = fitCanvas($('map'), 200);
    const k = Math.min(w, h) / 760;
    const cx = w / 2;
    const cy = h / 2;
    const P = (x, y) => [cx + (x - F.x) * k, cy - (y - F.y) * k];
    g.fillStyle = 'rgba(43,33,24,.04)';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(43,33,24,.1)';
    for (let r = 100; r <= 300; r += 100) {
      g.beginPath();
      g.arc(cx, cy, r * k, 0, 7);
      g.stroke();
    }
    let strong = 0;
    for (const th of F.thermals) {
      const s = F.strength(th);
      const [x, y] = P(th.x, th.y);
      const gr = g.createRadialGradient(x, y, 0, x, y, th.R * k);
      gr.addColorStop(0, `rgba(217,72,43,${0.1 + 0.55 * (s / 3.8)})`);
      gr.addColorStop(1, 'rgba(217,72,43,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, th.R * k, 0, 7);
      g.fill();
      g.fillStyle = 'rgba(43,33,24,.55)';
      g.font = "9px 'JetBrains Mono'";
      g.fillText(`${s.toFixed(1)}`, x - 8, y + 3);
      if (s > 1.6) {
        strong++;
        for (let i = 0; i < 3; i++) {
          const a = tNow * 1.2 + (i * Math.PI * 2) / 3 + th.id;
          const bx = x + Math.cos(a) * th.R * k * 0.35;
          const by = y - Math.sin(a) * th.R * k * 0.35;
          g.strokeStyle = 'rgba(43,33,24,.7)';
          g.lineWidth = 1.2;
          g.beginPath();
          g.moveTo(bx - 4, by + 1);
          g.quadraticCurveTo(bx - 1.5, by - 3, bx, by);
          g.quadraticCurveTo(bx + 1.5, by - 3, bx + 4, by + 1);
          g.stroke();
        }
      }
    }
    $('mapn').textContent = `${strong} 处真鸟盘旋`;
    g.strokeStyle = MODE_COL[F.mode];
    g.lineWidth = 1.4;
    g.beginPath();
    F.trail.forEach(([x, y], i) => {
      const [px, py] = P(x, y);
      g[i ? 'lineTo' : 'moveTo'](px, py);
    });
    g.stroke();
    const [wx, wy] = P(F.wp[0], F.wp[1]);
    if (F.mode !== 'thermal' && wx > 4 && wx < w - 4 && wy > 4 && wy < h - 4) {
      g.strokeStyle = 'rgba(43,33,24,.6)';
      g.beginPath();
      g.moveTo(wx - 4, wy - 4);
      g.lineTo(wx + 4, wy + 4);
      g.moveTo(wx + 4, wy - 4);
      g.lineTo(wx - 4, wy + 4);
      g.stroke();
    }
    g.save();
    g.translate(cx, cy);
    g.rotate(-F.psi);
    g.fillStyle = COL.ink;
    g.beginPath();
    g.moveTo(8, 0);
    g.lineTo(-5, 5);
    g.lineTo(-2, 0);
    g.lineTo(-5, -5);
    g.fill();
    g.restore();
    g.fillStyle = 'rgba(43,33,24,.5)';
    g.font = "9px 'JetBrains Mono'";
    g.fillText('200 m', cx + 200 * k * 0.7 + 2, cy - 200 * k * 0.7);
  };

  // ------------------------------------------------------------ callouts
  const COS = [
    {id: 'spar', show: (c) => 1, title: '火烤竹篾主梁', sub: () => '28% 弦长 · 抗拉韧性', n: 0},
    {id: 'solar', show: (c) => c.skin, title: '柔性光伏层', sub: (f) => `${f.pSolar.toFixed(1)} W · ${(SOLAR_AREA).toFixed(2)} m²`},
    {id: 'rib', show: (c) => 1 - c.skin, title: '巴尔沙镂空翼肋', sub: () => '11 片 / 翼 · 1.4 mm'},
    {id: 'hoop', show: (c) => c.xray + c.explode, title: '竹圈机身', sub: () => '竹圈 + 龙骨 + 轻木蒙皮'},
    {id: 'battery', show: (c) => c.xray + c.explode, title: '2S 800 mAh 电池', sub: (f) => `${(f.soc * 100).toFixed(0)}% · ${(f.soc * BAT_WH).toFixed(1)} Wh`},
    {id: 'mppt', show: (c) => c.xray + c.explode, title: 'MPPT 稳压板', sub: (f) => `${f.pAvail.toFixed(1)} W 进电池`},
    {id: 'fc', show: (c) => c.xray + c.explode, title: '飞控 F405 Wing', sub: (f) => `vario ${f.vario.toFixed(1)} m/s`},
    {id: 'motor', show: () => 1, title: '折叠桨 · 无刷电机', sub: (f) => (f.motor ? `推进 ${f.pMotor.toFixed(1)} W` : '停转 0 W · 桨叶收拢')},
    {id: 'cam', show: () => 1, title: '拇指相机 · 鸟头配重', sub: (f) => `15 g · ${f.camW} W`},
    {id: 'tail', show: () => 1, title: 'V 型鸟尾', sub: () => '2 舵机 · 升降+方向'},
    {id: 'cg', show: (c) => c.cg, title: '重心 CG', sub: () => `${(CG_MAC * 100).toFixed(0)}% 平均弦长(25~30% 为宜)`},
  ];
  const cosEl = $('cos');
  const lnEl = $('ln');
  for (const c of COS) {
    c.el = document.createElement('div');
    c.el.className = 'co';
    c.el.innerHTML = '<b></b><span></span>';
    cosEl.appendChild(c.el);
    c.title_el = c.el.firstChild;
    c.sub_el = c.el.lastChild;
    c.title_el.textContent = c.title;
  }
  const pv = new THREE.Vector3();
  const layoutCallouts = (f) => {
    const w = innerWidth;
    const h = innerHeight;
    const L = [];
    const R = [];
    for (const c of COS) {
      const o = clamp(c.show(cur) * cur.labels, 0, 1);
      c.o = o;
      c.el.style.opacity = o;
      if (o < 0.02) continue;
      pv.copy(bird.world(c.id)).project(camera);
      c.p = [(pv.x * 0.5 + 0.5) * w, (-pv.y * 0.5 + 0.5) * h];
      // keep only labels whose part is in the middle of the frame
      if (pv.z > 1 || c.p[0] < 330 || c.p[0] > w - 330 || c.p[1] < 80 || c.p[1] > h - 180) {
        c.el.style.opacity = 0;
        c.o = 0;
        continue;
      }
      c.sub_el.textContent = c.sub(f);
      (c.p[0] < w / 2 ? L : R).push(c);
    }
    const lines = [];
    const stack = (col, x) => {
      col.sort((a, b) => a.p[1] - b.p[1]);
      let y = 84;
      for (const c of col) {
        y = Math.max(y, Math.min(h - 215, c.p[1] - 22));
        if (y > h - 205) {
          c.el.style.opacity = 0;
          continue;
        }
        c.el.style.left = `${x}px`;
        c.el.style.top = `${y}px`;
        const bx = x === 330 ? x + 176 : x;
        lines.push(`<polyline fill="none" stroke="rgba(43,33,24,${0.55 * c.o})" stroke-width="1" points="${bx},${y + 22} ${bx + (x === 330 ? 14 : -14)},${y + 22} ${c.p[0]},${c.p[1]}"/><circle cx="${c.p[0]}" cy="${c.p[1]}" r="3.4" fill="${COL.accent}" fill-opacity="${c.o}"/>`);
        y += 52;
      }
    };
    stack(L, 330);
    stack(R, w - 330 - 176);
    lnEl.innerHTML = lines.join('');
  };
  for (const c of COS) c.o = 0;

  // ------------------------------------------------------------ resize
  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  // ------------------------------------------------------------ the frame
  let last = performance.now();
  let panelN = 0;
  let tier = 0;
  const perf = {n: 0, sum: 0};
  const fmt = (x, d = 1) => x.toFixed(d);
  const frame = (now) => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    tNow += dt;
    if (!tourOn && tNow - lastInput > IDLE) startTour();
    // quality tiers: a laptop's integrated GPU drops the pixel ratio, then the shadow map
    if (tier < 2 && tNow > 1.5) {
      perf.n++;
      perf.sum += dt;
      if (perf.sum > 1.2) {
        if (perf.sum / perf.n > 0.03) {
          tier++;
          if (tier === 1) renderer.setPixelRatio(1);
          else {
            sunL.shadow.mapSize.set(1024, 1024);
            sunL.shadow.map?.dispose();
            sunL.shadow.map = null;
          }
          renderer.setSize(innerWidth, innerHeight, false);
        }
        perf.n = 0;
        perf.sum = 0;
      }
    }

    // the sim, in fixed 0.25 s sim steps
    let rem = dt * speed;
    while (rem > 1e-6) {
      const s = Math.min(0.25, rem);
      F.step(s);
      rem -= s;
    }

    // the tour
    let tourText = '';
    if (tourOn) {
      const c = (tNow - tourT0) % TOUR_LEN;
      let step = TOUR[0];
      for (const s of TOUR) if (s.t <= c) step = s;
      if (step.view !== view) setView(step.view);
      Object.assign(target, step.set);
      tourText = step.text(F);
      if (!target.labels) target.labels = 0;
    }
    for (const k in cur) cur[k] += (target[k] - cur[k]) * (1 - Math.exp(-dt / (k === 'explode' ? 0.35 : 0.22)));

    // pose the bird: bank and sink from the flight model, a little air in the wings
    const bank = F.bank + Math.sin(tNow * 1.3) * 0.025 + Math.sin(tNow * 3.1) * 0.01;
    const pitch = -Math.atan2(F.sink, F.v) * (F.mode === 'cruise' ? 0 : 1) + 0.04 + Math.sin(tNow * 0.9) * 0.012;
    pivot.rotation.set(pitch, 0, bank * 0.9);
    pivot.position.y = Math.sin(tNow * 1.7) * 0.012;
    spin += dt * 70 * Math.pow(F.foldK, 2);
    bird.pose({
      explode: cur.explode * cur.explode * (3 - 2 * cur.explode),
      skin: cur.skin,
      xray: cur.xray,
      cg: cur.cg,
      motor: F.foldK,
      spin,
      elev: 0.06 + Math.abs(bank) * 0.9,
      rud: clamp(F.omega * 0.9, -0.5, 0.5),
      glow: {solar: cur.glow * (0.12 + 0.5 * clamp(F.pAvail / 45, 0, 1)), motor: F.foldK > 0.5 ? 0.55 : 0},
    });

    // sun and the air
    const sun = sunAt(F.hour);
    const irr = irradiance(sun.elev, F.cloud);
    const gk = clamp((irr.dni * (1 - F.cloud * 0.4) + irr.dif) / 900, 0.15, 1);
    sunL.intensity = 0.8 + 1.7 * gk;
    const se = Math.max(sun.elev, 0.25);
    sunL.position.set(Math.cos(sun.az) * Math.cos(se) * 5, Math.sin(se) * 5 + 1, Math.sin(sun.az) * Math.cos(se) * 5);
    sunL.target.position.set(0, 0, 0);
    streaks.visible = cur.explode < 0.3;
    streaks.material.opacity = 0.13 * (1 - cur.explode);
    const vis = 0.5 + F.v * 0.12;
    for (let i = 0; i < NST; i++) {
      const [x0, y, z, len] = stSeed[i];
      const x = ((((x0 - tNow * vis * 1.3) % 3.4) + 3.4) % 3.4) - 1.7;
      stPos.set([x, y, z, x - len * 1.2, y, z], i * 6);
    }
    stGeo.attributes.position.needsUpdate = true;
    const mOn = F.mode === 'thermal' ? 1 : 0;
    motes.material.opacity += (0.7 * mOn - motes.material.opacity) * (1 - Math.exp(-dt / 0.5));
    motes.visible = motes.material.opacity > 0.02;
    for (let i = 0; i < NM; i++) {
      const [a, r, p] = moSeed[i];
      const yy = ((((p + tNow * (0.14 + F.climb * 0.05)) % 1) + 1) % 1) * 1.7 - 0.7;
      const ang = a + tNow * 0.5;
      moPos.set([Math.cos(ang) * r, yy, Math.sin(ang) * r], i * 3);
    }
    moGeo.attributes.position.needsUpdate = true;

    // the camera
    const V = VIEWS[view];
    const k = 1 - Math.exp(-dt / 0.3);
    let dAz = V.az + off.az - cam.az;
    dAz = ((((dAz + 180) % 360) + 360) % 360) - 180;
    cam.az += dAz * k;
    cam.el += (V.el + off.el - cam.el) * k;
    cam.d += (V.d * off.k - cam.d) * k;
    for (let i = 0; i < 3; i++) cam.t[i] += (V.t[i] - cam.t[i]) * k;
    const ex = cur.explode;
    const dd = cam.d * (1 + 0.28 * ex);
    const az = cam.az * D2R;
    const el = cam.el * D2R;
    // frame the bird in the space between the two side panels
    const shift = innerWidth > 1100 ? 0 : 0;
    camera.position.set(cam.t[0] + dd * Math.cos(el) * Math.cos(az), cam.t[1] + dd * Math.sin(el), cam.t[2] + dd * Math.cos(el) * Math.sin(az));
    camera.lookAt(cam.t[0], cam.t[1] + shift, cam.t[2]);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);

    layoutCallouts(F);

    // panels (every other frame)
    if (++panelN % 2 === 0) {
      const net = F.pSolar - F.pLoad;
      $('pS').innerHTML = `${fmt(F.pSolar)}<small>W</small>`;
      $('pL').innerHTML = `${fmt(F.pLoad)}<small>W</small>`;
      $('pN').innerHTML = `<span class="${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}${fmt(net)}</span><small>W</small>`;
      $('ebal').textContent = net >= 0 ? '正循环' : '放电中';
      $('soc').textContent = `${(F.soc * 100).toFixed(0)}% · ${(F.soc * BAT_WH).toFixed(1)}/${BAT_WH.toFixed(1)} Wh`;
      $('socb').style.width = `${F.soc * 100}%`;
      $('socb').style.background = F.soc < 0.2 ? COL.accent : '#3f7d4e';
      const hh = Math.floor(F.hour);
      const mm = Math.floor((F.hour % 1) * 60);
      $('sunl').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · 太阳高度 ${(sun.elev / D2R).toFixed(0)}° · 光照 ${(irr.dni + irr.dif).toFixed(0)} W/m² · 云 ${Math.round(F.cloud * 100)}%`;
      $('clk').textContent = `飞行 ${String(Math.floor(F.t / 60)).padStart(2, '0')}:${String(Math.floor(F.t % 60)).padStart(2, '0')} · ${speed}×`;
      $('mname').textContent = MODE_NAME[F.mode];
      $('mdot').style.background = MODE_COL[F.mode];
      $('alt').innerHTML = `${fmt(F.h, 0)}<small>m</small>`;
      $('vario').innerHTML = `<span class="${F.vario > VARIO_TRIGGER ? 'neg' : ''}">${F.vario >= 0 ? '+' : ''}${fmt(F.vario)}</span><small>m/s</small>`;
      $('ld').textContent = fmt(F.ld);
      $('vel').innerHTML = `${fmt(F.v)}<small>m/s</small>`;
      $('bank').innerHTML = `${fmt(Math.abs(F.bank) / D2R, 0)}<small>°</small>`;
      $('sink').innerHTML = `${fmt(F.sink, 2)}<small>m/s</small>`;
      $('log').innerHTML = F.notes.map((n) => `<div><b class="mono">${String(Math.floor(n.t / 60)).padStart(2, '0')}:${String(Math.floor(n.t % 60)).padStart(2, '0')}</b> ${n.s}</div>`).join('') || '<div>起飞,阳光巡航中……</div>';
      drawPower();
      drawAlt();
      drawMap();
      // active states on the buttons
      VKEYS.forEach((v) => bt['v_' + v].classList.toggle('on', view === v));
      for (const [d] of DISP) bt['d_' + d].classList.toggle('on', !!target[d]);
      [1, 2, 6, 20].forEach((n) => bt['sp' + n].classList.toggle('on', speed === n));
      [1.5, 2, 4].forEach((w) => bt['cw' + w].classList.toggle('on', F.camW === w));
      bt.vision.classList.toggle('on', F.vision);
      sTime.set(F.hour);
      const tc = $('tour');
      const want = tourOn ? '<i></i>自动巡游 · 点击接管' : '▶ 继续巡游';
      if (tc.dataset.s !== want) {
        tc.dataset.s = want;
        tc.innerHTML = want;
        tc.classList.toggle('on', tourOn);
      }
    }
    const cap = $('cap');
    if (tourText !== lastText) {
      lastText = tourText;
      if (tourText) cap.textContent = tourText;
    }
    cap.classList.toggle('show', !!tourText);
    if (!window.SIM_SHOWN) {
      window.SIM_SHOWN = true;
      dispatchEvent(new Event('simframe'));
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  window.LIVE = {
    get F() {
      return F;
    },
    target,
    setView,
    takeOver,
    set speed(v) {
      speed = v;
    },
  };
  void MAC;
}
