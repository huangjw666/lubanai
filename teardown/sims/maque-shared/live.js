// 鲁班木鹊 as a page you drive: the bird runs in the middle, every panel reads the same numbers that move
// the parts, buttons open the subsystem doing the work. Left alone it tours itself; any click, drag, wheel
// or key hands control to the visitor, and 25 s of quiet hands it back.
import * as THREE from 'three';
import {AR, AREA, AERO, BAT_WH, CEIL, CG_MAC, createFlight, FLOOR, irradiance, MASS_G, MODE_NAME, PARTS, SOLAR_AREA, sunAt, VARIO_TRIGGER} from './bird.js';
import {buildBird, COL} from './model.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const D2R = Math.PI / 180;
const IDLE = 25;

const CSS = `
:root{--bg:#f0e7d6;--paper:#fbf5e9;--ink:#241c14;--dim:rgba(36,28,20,.64);--mute:rgba(36,28,20,.4);--line:rgba(36,28,20,.13);--ac:#c8452a;--blue:#2b5c8a;--green:#3f7d4e;--bamboo:#c79a3c}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:var(--bg);overflow:hidden}
#app{position:fixed;inset:0;font-family:'Inter','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
#gl{display:block;width:100%;height:100%;cursor:grab;touch-action:none}#gl.drag{cursor:grabbing}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
.ui{position:absolute;inset:0;pointer-events:none}
.hd{position:absolute;left:0;right:0;top:0;height:62px;padding:0 20px;display:flex;align-items:center;gap:14px;background:linear-gradient(var(--bg) 58%,rgba(240,231,214,0));z-index:3}
.seal{width:34px;height:34px;border-radius:3px;background:var(--ac);color:#fff6e8;display:grid;place-items:center;font-size:19px;font-weight:700;letter-spacing:0;box-shadow:0 1px 0 rgba(0,0,0,.12)}
.hd h1{margin:0;font-size:21px;font-weight:700;letter-spacing:.1em}
.hd .sub{font-size:10.5px;letter-spacing:.16em;color:var(--dim);margin-top:2px}
.hd .grow{flex:1}
.chip{pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:7px;height:26px;padding:0 11px;border:1px solid var(--line);border-radius:3px;background:var(--paper);font:700 10.5px 'JetBrains Mono',monospace;letter-spacing:.08em;white-space:nowrap;color:var(--ink)}
.chip i{width:6px;height:6px;border-radius:50%;background:var(--ac)}
.chip.on i{animation:bl 1.15s steps(2) infinite}@keyframes bl{50%{opacity:.15}}
.clk{font-size:12.5px;color:var(--dim);text-align:right;line-height:1.35}
.clk b{color:var(--ink);font-weight:600}
.side{position:absolute;top:66px;bottom:104px;width:292px;display:flex;flex-direction:column;gap:9px;z-index:2}
.side.l{left:18px}.side.r{right:18px}
.side{overflow-y:auto;overflow-x:hidden;scrollbar-width:none;-ms-overflow-style:none}
.side::-webkit-scrollbar{display:none}
.pn{background:var(--paper);border:1px solid var(--line);border-radius:5px;padding:10px 12px 11px;pointer-events:auto;box-shadow:0 1px 2px rgba(60,40,20,.04)}
.pn h3{margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:.16em;color:var(--dim);display:flex;justify-content:space-between;align-items:baseline}
.pn h3 b{color:var(--ac);font-weight:700;letter-spacing:.06em}
.r3{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.k{font-size:9.5px;color:var(--mute);letter-spacing:.05em}
.v{font-size:21px;font-weight:600;line-height:1.18;letter-spacing:-.01em}.v small{font-size:10px;color:var(--dim);font-weight:400;margin-left:2px}
.v.sm{font-size:15px}
.pos{color:var(--green)}.neg{color:var(--ac)}
.bar{height:8px;background:rgba(36,28,20,.09);border-radius:1px;overflow:hidden;margin-top:4px}
.bar i{display:block;height:100%;background:var(--green)}
canvas.ch{width:100%;display:block;margin-top:7px}
.wt{display:grid;grid-template-columns:1fr auto;gap:3px 8px;font-size:11px;align-items:center}
.wt .bb{grid-column:1/3;height:2px;background:rgba(36,28,20,.09)}.wt .bb i{display:block;height:100%;background:var(--bamboo)}
.wt b{font-weight:600}.wt span{color:var(--dim)}
.plist{display:flex;flex-direction:column;gap:1px;margin-top:2px}
.prow{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;padding:4px 5px;margin:0 -5px;border-radius:3px;cursor:pointer;font-size:11.5px;border:1px solid transparent}
.prow:hover{background:rgba(200,69,42,.06)}
.prow.on{background:rgba(200,69,42,.09);border-color:rgba(200,69,42,.32)}
.prow .nm{display:flex;align-items:center;gap:6px;white-space:nowrap}
.prow .nm:before{content:'';width:5px;height:5px;border-radius:50%;border:1px solid var(--mute)}
.prow.on .nm:before{background:var(--ac);border-color:var(--ac)}
.prow .lv{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim);white-space:nowrap}
.mode{display:flex;align-items:center;gap:9px;margin-bottom:7px}
.mode b{font-size:19px;letter-spacing:.05em;font-weight:600}
.mode .dot{width:9px;height:9px;border-radius:50%;background:var(--ink)}
.log{font-size:10.5px;line-height:1.5;color:var(--dim);overflow:hidden}
.log div{margin-bottom:4px;display:flex;gap:6px}.log b{color:var(--ac);font-weight:600;flex:none}
.co{position:absolute;pointer-events:none;width:168px;padding:4px 7px;border:1px solid var(--line);border-left:2px solid var(--ac);background:rgba(251,245,233,.94);border-radius:2px;font-size:11px;line-height:1.3;transition:opacity .25s}
.co b{display:block;font-size:12px;font-weight:600}.co span{color:var(--dim);font-size:10px}
svg.ln{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.ctl{position:absolute;left:0;right:0;bottom:0;height:100px;padding:8px 14px 10px;display:flex;gap:14px;align-items:flex-end;justify-content:center;background:linear-gradient(rgba(240,231,214,0),var(--bg) 42%);z-index:2}
.grp{display:flex;flex-direction:column;gap:4px;pointer-events:auto}
.grp>label{font-size:9px;letter-spacing:.15em;color:var(--mute);font-weight:700}
.btns{display:flex;gap:3px}
.bt{pointer-events:auto;cursor:pointer;height:27px;padding:0 8px;border:1px solid var(--line);border-radius:3px;background:var(--paper);color:var(--ink);font:600 12px inherit;font-family:inherit;white-space:nowrap;transition:background .15s,color .15s}
.bt:hover{background:#fffdf6;border-color:rgba(36,28,20,.28)}
.bt.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.bt .kb{font:600 8px 'JetBrains Mono',monospace;opacity:.45;margin-left:4px}
.bt.on .kb{opacity:.55}
.sl{display:flex;align-items:center;gap:7px;font-size:11px;height:27px}
.sl input{width:92px;accent-color:var(--ac)}
.sl span{min-width:38px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:10.5px}
.cap{position:absolute;left:50%;bottom:112px;transform:translateX(-50%);max-width:min(620px,54vw);padding:8px 15px;background:var(--ink);color:#f7efdd;border-radius:3px;font-size:13.5px;line-height:1.55;text-align:center;opacity:0;transition:opacity .5s;z-index:2;box-shadow:0 4px 18px rgba(40,25,10,.18)}
.cap.show{opacity:.95}
.ktip{position:absolute;right:18px;bottom:106px;font-size:9.5px;color:var(--mute);letter-spacing:.06em;font-family:'JetBrains Mono',monospace}
@media(max-height:900px){.side .pn{flex:0 0 auto !important}}
@media(max-height:830px){.wt .bb{display:none}#cgl{display:none}#pnote{display:none}.pn h3{margin-bottom:6px}}
@media(max-height:880px){.pn{padding:8px 11px 9px}.wt{font-size:10.5px;gap:2px 8px}.prow{padding:3px 4px;font-size:11px}.v{font-size:19px}.mode b{font-size:17px}}
@media(max-width:1560px){[data-g="时间流速"]{display:none}}
@media(max-width:1330px){[data-g="相机 / 飞行"]{display:none}}
@media(max-width:1460px){.side{width:264px}.ctl{gap:10px;padding:8px 10px}.bt{height:26px;padding:0 7px;font-size:11.5px}.bt .kb{display:none}.sl input{width:76px}.sl{font-size:10.5px}.grp>label{font-size:8.5px;letter-spacing:.1em}.cap{max-width:min(560px,50vw);font-size:12.5px}}
@media(max-width:1240px){.side{display:none}.co{display:none}.ctl{height:auto;flex-wrap:wrap;gap:8px}.cap{bottom:156px}.ktip{display:none}}
`;

const HTML = `
<div class="ui">
<svg class="ln" id="ln"></svg><div id="cos"></div>
<header class="hd">
  <div class="seal">鹊</div>
  <div><h1>鲁班木鹊</h1><div class="sub">LUBAN-QUE SR-1 · 太阳能追风木鹊 · 翼展 1.5 M · 全机 530 g</div></div>
  <div class="grow"></div>
  <div class="chip on" id="tour"></div>
  <div class="clk mono" id="clk"></div>
</header>
<aside class="side l">
  <div class="pn"><h3>能量账本 <b id="ebal"></b></h3>
    <div class="r3">
      <div><div class="k">光伏发电</div><div class="v mono" id="pS">0<small>W</small></div></div>
      <div><div class="k">全机用电</div><div class="v mono" id="pL">0<small>W</small></div></div>
      <div><div class="k">净功率</div><div class="v mono" id="pN">0<small>W</small></div></div>
    </div>
    <div class="k" style="margin-top:8px;display:flex;justify-content:space-between"><span>2S 800 mAh · 5.9 Wh</span><span class="mono" id="soc"></span></div>
    <div class="bar"><i id="socb"></i></div>
    <canvas class="ch" id="chP" height="66"></canvas>
    <div class="k mono" id="sunl" style="margin-top:5px;line-height:1.4"></div>
  </div>
  <div class="pn"><h3>重量账本 <b id="mass"></b></h3><div class="wt" id="wt"></div>
    <div class="k mono" id="cgl" style="margin-top:6px;line-height:1.4"></div>
  </div>
  <div class="pn" style="flex:1;display:flex;flex-direction:column"><h3>拆解清单 <b>点一行单独打开</b></h3><div class="plist" id="plist"></div>
    <div class="k" id="pnote" style="margin-top:auto;line-height:1.4"></div>
  </div>
</aside>
<aside class="side r">
  <div class="pn"><h3>飞控 ARDUPILOT SOARING</h3>
    <div class="mode"><span class="dot" id="mdot"></span><b id="mname"></b><span class="k mono" id="mnote" style="margin-left:auto"></span></div>
    <div class="r3">
      <div><div class="k">高度</div><div class="v mono" id="alt">0<small>m</small></div></div>
      <div><div class="k">升降率</div><div class="v mono" id="vario">0<small>m/s</small></div></div>
      <div><div class="k">滑翔比</div><div class="v mono" id="ld">0</div></div>
    </div>
    <div class="r3" style="margin-top:5px">
      <div><div class="k">空速</div><div class="v sm mono" id="vel">0<small>m/s</small></div></div>
      <div><div class="k">坡度</div><div class="v sm mono" id="bank">0<small>°</small></div></div>
      <div><div class="k">下沉率</div><div class="v sm mono" id="sink">0<small>m/s</small></div></div>
    </div>
    <canvas class="ch" id="chA" height="62"></canvas>
  </div>
  <div class="pn"><h3>热气流地图 <b id="mapn"></b></h3><canvas class="ch" id="map" height="196" style="margin-top:0"></canvas></div>
  <div class="pn" style="flex:1;display:flex;flex-direction:column"><h3>飞行日志</h3><div class="log" id="log"></div></div>
</aside>
<div class="cap" id="cap"></div>
<div class="ktip">拖动旋转 · 滚轮缩放 · ESC 取消隔离 · 读数为设计估算</div>
<div class="ctl" id="ctl"></div>
</div>`;

export const VIEWS = {
  hero: {name: '全貌', az: 32, el: 23, d: 2.2, t: [-0.1, 0.07, 0]},
  top: {name: '俯视', az: 180, el: 86, d: 2.4, t: [-0.05, 0.02, 0]},
  side: {name: '侧视', az: 88, el: 4, d: 2.1, t: [-0.06, 0.1, 0]},
  front: {name: '正面', az: 4, el: 8, d: 2.05, t: [0.02, 0.1, 0]},
  head: {name: '鸟头', az: 34, el: 12, d: 0.86, t: [0.32, 0.16, 0]},
  tail: {name: '尾翼', az: 210, el: 22, d: 1.15, t: [-0.5, 0.06, 0]},
};
const VKEYS = Object.keys(VIEWS);
const DISP = [
  ['skin', '蒙皮', 's'],
  ['xray', 'X 光', 'x'],
  ['explode', '爆炸', 'e'],
  ['labels', '标注', 'l'],
  ['glow', '光伏', 'p'],
  ['cg', '重心', 'g'],
];

const REGIONS = [
  {id: 'wings', name: '双翼 · 光伏蒙皮', parts: ['wingR', 'wingL'], live: (f) => `${SOLAR_AREA.toFixed(2)} m² · ${f.pSolar.toFixed(0)} W`, note: '12 片巴尔沙翼肋穿在火烤竹篾主梁上，上表面贴柔性单晶硅，翼尖 7 根指状羽把翼展拉到 1.5 m。'},
  {id: 'body', name: '竹圈机身', parts: ['body'], live: () => '8 圈 + 龙骨', note: '8 道竹圈撑住轻木蒙皮，三根竹篾龙骨从头贯穿到尾，腹下开一块可拆检修板。'},
  {id: 'head', name: '鸟头 · 拇指相机', parts: ['head'], live: (f) => `15 g · ${f.camW} W`, note: '相机装在眉心，替掉原本要塞的配重铅块——重心因此落在平均弦长 29% 处，头重才飞得稳。'},
  {id: 'tail', name: '尾羽 · 舵面', parts: ['tail'], live: (f) => `坡度 ${(Math.abs(f.bank) / D2R).toFixed(0)}°`, note: '尾羽本身就是舵面：两片外侧尾羽同向偏是升降，反向偏是方向，两个 4.3 g 舵机就够，背后不必再多一片垂尾。'},
  {id: 'elec', name: '电子舱', parts: ['elec'], live: (f) => `${(f.soc * 100).toFixed(0)}% · ${(f.soc * BAT_WH).toFixed(1)} Wh`, note: 'MPPT 把翼面电压抬到 8.4 V 给电池充电，F405 Wing 读气压计算升降率，决定要不要关电机去追气流。'},
  {id: 'motor', name: '动力组 · 折叠桨', parts: ['motor'], live: (f) => (f.motor ? `${f.pMotor.toFixed(1)} W` : '停转 · 桨已收'), note: '电机停在脊背上，两片桨叶靠离心力张开；一断电就顺着气流贴回机身，滑翔时不添一点阻力。'},
  {id: 'cg', name: '重心 CG', parts: ['cg'], live: () => `${(CG_MAC * 100).toFixed(0)}% MAC`, note: '重心在平均弦长前缘之后 29%，正落在 25%~30% 的稳定区间里：这是手掷试飞时唯一要反复调的数。'},
];

// ------------------------------------------------------------ the tour, explicit states so it never drifts
const T = (t, view, set, text) => ({t, view, set, text});
const TOUR = [
  T(0, 'hero', {skin: 1, xray: 0, explode: 0, labels: 0, glow: 0, cg: 0, solo: []}, () => '《墨子·鲁问》：公输子削竹木以为鹊，成而飞之，三日不下。这只木鹊翼展 1.5 m，全机 530 g。'),
  T(7, 'hero', {labels: 1}, () => '它不扇翅膀。翅膀固定成滑翔翼型，动力来自脊背上一副折叠桨——这是“三日不下”唯一算得过来的方案。'),
  T(15, 'hero', {skin: 0, labels: 0}, () => '揭掉蒙皮：每侧 16 片镂空巴尔沙翼肋，穿在一根火烤定型的竹篾主梁上，翼尖 5 根指状羽。'),
  T(23, 'top', {skin: 1, glow: 1}, (f) => `翼面铺 ${SOLAR_AREA.toFixed(2)} m² 柔性单晶硅：此刻发电 ${f.pSolar.toFixed(0)} W，全机只用 ${f.pLoad.toFixed(0)} W——白天是正循环。`),
  T(31, 'head', {glow: 0, labels: 1, cg: 1}, () => '鸟头里的拇指相机不只是眼睛，它是配重：15 g 压在最前面，重心才落在平均弦长 29% 处。'),
  T(39, 'side', {labels: 1, cg: 0, xray: 1}, (f) => `透过机身：电池 ${(f.soc * BAT_WH).toFixed(1)} Wh、MPPT、飞控都塞在鸟腹里，一根线都不外露。`),
  T(47, 'hero', {xray: 0, explode: 1, labels: 1}, () => '爆炸图：双翼、机身、鸟头、尾羽、电子舱、动力组——每一件都能单独拆下来换。'),
  T(55, 'tail', {explode: 0, labels: 1}, () => '尾羽本身就是舵面：两片外侧尾羽同向偏是升降、反向偏是方向，两个 4.3 g 舵机全包了。'),
  T(62, 'hero', {labels: 1, solo: []}, (f) => (f.mode === 'thermal' ? `正在追风：升降率 ${f.vario.toFixed(1)} m/s 超过 ${VARIO_TRIGGER}，电机停转、桨叶收拢，靠热气流免费爬升。` : '平飞时电机只吃十几瓦；一旦气压计读到 0.8 m/s 的上升气流，它就关掉电机去盘气流。')),
];
const TOUR_LEN = 70;

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

  // ------------------------------------------------------------ scene
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.bg);
  scene.fog = new THREE.Fog(COL.bg, 6.5, 13);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 40);

  scene.add(new THREE.HemisphereLight('#fff8e9', '#c8b189', 1.05));
  const key = new THREE.DirectionalLight('#fff1d2', 2.3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -1.3, right: 1.3, top: 1.3, bottom: -1.3, near: 0.1, far: 14});
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.012;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.45);
  fill.position.set(-3, 2, -3);
  scene.add(fill);

  const GY = -0.55;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShadowMaterial({opacity: 0.17}));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GY;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(3.2, 16, '#b6a17a', '#d8c8a6');
  grid.position.y = GY - 0.002;
  grid.material.transparent = true;
  grid.material.opacity = 0.32;
  scene.add(grid);

  const bird = buildBird();
  const pivot = new THREE.Group();
  pivot.rotation.order = 'ZXY';
  pivot.add(bird.root);
  scene.add(pivot);

  // air streaks + thermal motes
  const NST = 64;
  const stPos = new Float32Array(NST * 6);
  const stSeed = Array.from({length: NST}, (_, i) => [((i * 0.6180339) % 1) * 3.2 - 1.6, -0.32 + ((i * 0.7548776) % 1) * 0.95, ((i * 0.5698402) % 1) * 1.6 - 0.8, 0.05 + ((i * 0.3247) % 1) * 0.075]);
  const stGeo = new THREE.BufferGeometry();
  stGeo.setAttribute('position', new THREE.BufferAttribute(stPos, 3));
  const streaks = new THREE.LineSegments(stGeo, new THREE.LineBasicMaterial({color: '#6b5a3e', transparent: true, opacity: 0.12}));
  streaks.frustumCulled = false;
  scene.add(streaks);

  const NM = 80;
  const moPos = new Float32Array(NM * 3);
  const moSeed = Array.from({length: NM}, (_, i) => [((i * 0.6180339) % 1) * Math.PI * 2, 0.22 + ((i * 0.7548776) % 1) * 0.7, ((i * 0.5698402) % 1)]);
  const moGeo = new THREE.BufferGeometry();
  moGeo.setAttribute('position', new THREE.BufferAttribute(moPos, 3));
  const dotTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.5, 'rgba(255,255,255,.85)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  const motes = new THREE.Points(moGeo, new THREE.PointsMaterial({color: COL.accent, size: 0.02, map: dotTex, transparent: true, opacity: 0, depthWrite: false}));
  motes.frustumCulled = false;
  scene.add(motes);

  // ------------------------------------------------------------ state
  const newFlight = () => {
    const f = createFlight(11);
    for (let i = 0; i < 200; i++) f.step(0.5);
    return f;
  };
  let F = newFlight();
  let speed = 2;
  let tNow = 0;
  let spin = 0;
  const target = {skin: 1, xray: 0, explode: 0, labels: 0, glow: 0, cg: 0, solo: []};
  const cur = {skin: 1, xray: 0, explode: 0, labels: 0, glow: 0, cg: 0};
  let solo = [];
  let view = 'hero';
  const cam = {...VIEWS.hero, t: [...VIEWS.hero.t]};
  const off = {az: 0, el: 0, k: 1};
  let tourOn = true;
  let tourT0 = 0;
  let lastInput = 0;
  let lastText = '';
  let hoverRegion = null;

  // ------------------------------------------------------------ controls
  const ctl = $('ctl');
  const bt = {};
  const mkGroup = (label, inner) => {
    const g = document.createElement('div');
    g.className = 'grp';
    g.dataset.g = label;
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
  dr.appendChild(mkBtn('全部还原', '', () => resetView(), 'reset_view'));
  mkGroup('拆解', dr);

  const slider = (label, min, max, step, val, fmt, apply) => {
    const d = document.createElement('div');
    d.className = 'sl';
    d.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"><span></span>`;
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
  const sTime = slider('时间', 6.5, 17.5, 0.05, F.hour, (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`, (h) => (F.hour = h));
  const sCloud = slider('云量', 0, 1, 0.01, F.cloud, (c) => `${Math.round(c * 100)}%`, (c) => (F.cloud = c));
  const env = document.createElement('div');
  env.append(sTime, sCloud);
  mkGroup('天气', env);

  const sp = row();
  [1, 2, 6, 20].forEach((n) => sp.appendChild(mkBtn(`${n}×`, '', () => (speed = n), 'sp' + n)));
  mkGroup('时间流速', sp);

  const cr = row();
  [[1.5, '本地记录'], [2, '5.8G 图传'], [4, '4G 图传']].forEach(([w, n]) => cr.appendChild(mkBtn(`${n}`, '', () => (F.camW = w), 'cw' + w)));
  cr.appendChild(mkBtn('视觉找鸟', 'B', () => (F.vision = !F.vision), 'vision'));
  cr.appendChild(mkBtn('重新放飞', 'R', () => resetFlight(), 'reset'));
  mkGroup('相机 / 飞行', cr);

  const takeOver = () => {
    lastInput = tNow;
    if (tourOn) tourOn = false;
  };
  const startTour = () => {
    tourOn = true;
    tourT0 = tNow;
    lastInput = tNow;
    Object.assign(off, {az: 0, el: 0, k: 1});
    solo = [];
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
  const resetView = () => {
    Object.assign(target, {skin: 1, xray: 0, explode: 0, labels: 0, glow: 0, cg: 0});
    solo = [];
    setView('hero');
  };
  const resetFlight = () => {
    const keep = {hour: F.hour, cloud: F.cloud, camW: F.camW, vision: F.vision};
    F = newFlight();
    Object.assign(F, keep);
    solo = [];
  };
  let xrayBefore = 0;
  const pickRegion = (r) => {
    takeOver();
    const off = solo.length && solo[0] === r.id;
    if (off) target.xray = xrayBefore;
    solo = off ? [] : [r.id];
    if (!off) {
      xrayBefore = target.xray;
      target.labels = 1;
      if (r.id === 'cg') target.cg = 1;
      if (r.id === 'elec' || r.id === 'motor') target.xray = 1;
    }
  };
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      solo = [];
      return;
    }
    if (/^[1-6]$/.test(k)) bt['v_' + VKEYS[+k - 1]].click();
    else if (DISP.some((d) => d[2] === k)) bt['d_' + DISP.find((d) => d[2] === k)[0]].click();
    else if (k === 'b') bt.vision.click();
    else if (k === 'r') bt.reset.click();
    else return;
    e.preventDefault();
  });
  canvas.addEventListener('pointerdown', (e) => {
    takeOver();
    drag = {x: e.clientX, y: e.clientY};
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('drag');
  });
  let drag = null;
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    off.az -= (e.clientX - drag.x) * 0.4;
    off.el = clamp(off.el + (e.clientY - drag.y) * 0.3, -55, 80);
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
    off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.32, 2.6);
  }, {passive: false});

  // ------------------------------------------------------------ panels
  $('wt').innerHTML = PARTS.map((p) => `<span>${p.name}</span><span class="mono">${p.g} g</span><div class="bb"><i style="width:${(p.g / 215) * 100}%"></i></div>`).join('');
  $('mass').textContent = `${MASS_G} g`;
  $('cgl').textContent = `机翼 ${AREA.toFixed(2)} m² · 展弦比 ${AR.toFixed(1)} · 翼载 ${(MASS_G / AREA / 100).toFixed(1)} g/dm² · 重心 ${(CG_MAC * 100).toFixed(0)}% MAC`;

  const plist = $('plist');
  for (const r of REGIONS) {
    const el = document.createElement('div');
    el.className = 'prow';
    el.innerHTML = `<span class="nm">${r.name}</span><span class="lv"></span>`;
    el.addEventListener('click', () => pickRegion(r));
    el.addEventListener('pointerenter', () => (hoverRegion = r.id));
    el.addEventListener('pointerleave', () => (hoverRegion = null));
    r.el = el;
    r.lv = el.lastChild;
    plist.appendChild(el);
  }
  $('pnote').textContent = '每拆开一件，四周的数字就换成这一件在干活时的读数。';

  const fit = (c, h) => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.clientWidth || 260;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    c.style.height = `${h}px`;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    return [g, w, h];
  };
  const MONO = "'JetBrains Mono',monospace";
  const drawPower = () => {
    const [g, w, h] = fit($('chP'), 74);
    const maxP = 60;
    g.strokeStyle = 'rgba(36,28,20,.09)';
    g.lineWidth = 1;
    for (const p of [20, 40, 60]) {
      const y = h - (p / maxP) * (h - 5) - 2;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    g.fillStyle = 'rgba(36,28,20,.34)';
    g.font = `9px ${MONO}`;
    g.fillText('60 W', 2, 9);
    const H = F.hist;
    if (H.length < 2) return;
    const X = (i) => (i / Math.max(1, H.length - 1)) * w;
    g.fillStyle = 'rgba(43,92,138,.22)';
    g.beginPath();
    g.moveTo(X(0), h);
    H.forEach((p, i) => g.lineTo(X(i), h - (Math.min(p.solar, maxP) / maxP) * (h - 5) - 2));
    g.lineTo(X(H.length - 1), h);
    g.fill();
    g.strokeStyle = COL.accent;
    g.lineWidth = 1.7;
    g.beginPath();
    H.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](X(i), h - (Math.min(p.load, maxP) / maxP) * (h - 5) - 2));
    g.stroke();
    g.fillStyle = 'rgba(43,92,138,.9)';
    g.fillRect(w - 42, 4, 6, 2);
    g.fillStyle = 'rgba(36,28,20,.45)';
    g.fillText('发电', w - 33, 8);
    g.fillStyle = COL.accent;
    g.fillRect(w - 42, 14, 6, 2);
    g.fillStyle = 'rgba(36,28,20,.45)';
    g.fillText('用电', w - 33, 18);
  };
  const MODE_COL = {cruise: '#241c14', thermal: COL.accent, glide: '#2b5c8a'};
  const drawAlt = () => {
    const [g, w, h] = fit($('chA'), 70);
    const Y = (m) => h - 4 - (m / 440) * (h - 10);
    g.setLineDash([3, 3]);
    g.strokeStyle = 'rgba(36,28,20,.22)';
    for (const m of [FLOOR, CEIL]) {
      g.beginPath();
      g.moveTo(0, Y(m));
      g.lineTo(w, Y(m));
      g.stroke();
    }
    g.setLineDash([]);
    g.fillStyle = 'rgba(36,28,20,.4)';
    g.font = `8.5px ${MONO}`;
    g.fillText(`${CEIL} m 升限`, 2, Y(CEIL) - 2);
    g.fillText(`${FLOOR} m 电机接管`, 2, Y(FLOOR) - 2);
    const H = F.hist;
    if (H.length < 2) return;
    const X = (i) => (i / Math.max(1, H.length - 1)) * w;
    g.lineWidth = 1.8;
    for (let i = 1; i < H.length; i++) {
      g.strokeStyle = MODE_COL[H[i].mode];
      g.beginPath();
      g.moveTo(X(i - 1), Y(H[i - 1].h));
      g.lineTo(X(i), Y(H[i].h));
      g.stroke();
    }
    const y = Y(F.h);
    g.fillStyle = MODE_COL[F.mode];
    g.beginPath();
    g.arc(w - 3, y, 2.4, 0, 7);
    g.fill();
  };
  const drawMap = () => {
    const [g, w, h] = fit($('map'), 196);
    const k = Math.min(w, h) / 700;
    const cx = w / 2;
    const cy = h / 2;
    const P = (x, y) => [cx + (x - F.x) * k, cy - (y - F.y) * k];
    g.fillStyle = 'rgba(36,28,20,.035)';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(36,28,20,.09)';
    for (let r = 100; r <= 300; r += 100) {
      g.beginPath();
      g.arc(cx, cy, r * k, 0, 7);
      g.stroke();
    }
    let strong = 0;
    for (const th of F.thermals) {
      const s = F.strength(th);
      const [x, y] = P(th.x, th.y);
      if (x < -60 || x > w + 60 || y < -60 || y > h + 60) continue;
      const gr = g.createRadialGradient(x, y, 0, x, y, th.R * k);
      gr.addColorStop(0, `rgba(200,69,42,${0.08 + 0.5 * (s / 3.8)})`);
      gr.addColorStop(0.7, `rgba(200,69,42,${0.14 * (s / 3.8)})`);
      gr.addColorStop(1, 'rgba(200,69,42,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, th.R * k, 0, 7);
      g.fill();
      g.fillStyle = 'rgba(36,28,20,.5)';
      g.font = `9px ${MONO}`;
      g.fillText(`${s.toFixed(1)}`, x - 7, y + 3);
      if (s > 1.6) {
        strong++;
        for (let i = 0; i < 3; i++) {
          const a = tNow * 1.1 + (i * Math.PI * 2) / 3 + th.id;
          const bx = x + Math.cos(a) * th.R * k * 0.32;
          const by = y - Math.sin(a) * th.R * k * 0.32;
          g.strokeStyle = 'rgba(36,28,20,.62)';
          g.lineWidth = 1.1;
          g.beginPath();
          g.moveTo(bx - 3.6, by + 1);
          g.quadraticCurveTo(bx - 1.4, by - 2.6, bx, by);
          g.quadraticCurveTo(bx + 1.4, by - 2.6, bx + 3.6, by + 1);
          g.stroke();
        }
      }
    }
    $('mapn').textContent = `${strong} 处真鸟盘旋`;
    g.strokeStyle = MODE_COL[F.mode];
    g.lineWidth = 1.3;
    g.beginPath();
    F.trail.forEach(([x, y], i) => {
      const [px, py] = P(x, y);
      g[i ? 'lineTo' : 'moveTo'](px, py);
    });
    g.stroke();
    if (F.mode !== 'thermal') {
      const [wx, wy] = P(F.wp[0], F.wp[1]);
      if (wx > 5 && wx < w - 5 && wy > 5 && wy < h - 5) {
        g.strokeStyle = 'rgba(36,28,20,.5)';
        g.beginPath();
        g.moveTo(wx - 3.5, wy - 3.5);
        g.lineTo(wx + 3.5, wy + 3.5);
        g.moveTo(wx + 3.5, wy - 3.5);
        g.lineTo(wx - 3.5, wy + 3.5);
        g.stroke();
      }
    }
    g.save();
    g.translate(cx, cy);
    g.rotate(-F.psi);
    g.fillStyle = COL.ink;
    g.beginPath();
    g.moveTo(7, 0);
    g.lineTo(-4.5, 4.5);
    g.lineTo(-1.8, 0);
    g.lineTo(-4.5, -4.5);
    g.fill();
    g.restore();
    g.fillStyle = 'rgba(36,28,20,.42)';
    g.font = `9px ${MONO}`;
    g.fillText('200 m', cx + 140 * k + 2, cy - 140 * k);
  };

  // ------------------------------------------------------------ callouts
  const COS = [
    {id: 'spar', part: 'wingR', show: () => 1, title: '火烤竹篾主梁', sub: () => '30% 弦长 · 抗拉又抗弯'},
    {id: 'solar', part: 'wingR', show: (c) => c.skin, title: '柔性光伏蒙皮', sub: (f) => `${SOLAR_AREA.toFixed(2)} m² · 此刻 ${f.pSolar.toFixed(0)} W`},
    {id: 'rib', part: 'wingR', show: (c) => 1 - c.skin, title: '巴尔沙镂空翼肋', sub: () => '12 片 / 翼 · 1.5 mm'},
    {id: 'feather', part: 'wingR', show: () => 1, title: '指状翼尖', sub: () => '7 根初生羽 · 滑翔更稳'},
    {id: 'hoop', part: 'body', show: (c) => Math.max(c.xray, c.explode), title: '竹圈机身', sub: () => '8 道竹圈 + 三根龙骨'},
    {id: 'battery', part: 'elec', show: (c) => Math.max(c.xray, c.explode), title: '2S 800 mAh', sub: (f) => `${(f.soc * 100).toFixed(0)}% · ${(f.soc * BAT_WH).toFixed(1)} Wh`},
    {id: 'mppt', part: 'elec', show: (c) => Math.max(c.xray, c.explode), title: 'MPPT 升压板', sub: (f) => `${f.pAvail.toFixed(0)} W 进电池`},
    {id: 'fc', part: 'elec', show: (c) => Math.max(c.xray, c.explode), title: '飞控 F405 Wing', sub: (f) => `升降率 ${f.vario.toFixed(1)} m/s`},
    {id: 'motor', part: 'motor', show: () => 1, title: '折叠桨 · 无刷电机', sub: (f) => (f.motor ? `推进 ${f.pMotor.toFixed(1)} W` : '停转 0 W · 桨已收拢')},
    {id: 'cam', part: 'head', show: () => 1, title: '拇指相机 · 鸟头配重', sub: (f) => `15 g · ${f.camW} W`},
    {id: 'tail', part: 'tail', show: () => 1, title: '尾羽 · 舵面', sub: () => '2 × 4.3 g 舵机'},
    {id: 'cg', part: 'cg', show: (c) => c.cg, title: '重心 CG', sub: () => `${(CG_MAC * 100).toFixed(0)}% MAC(25~30% 为宜)`},
  ];
  const cosEl = $('cos');
  const lnEl = $('ln');
  for (const c of COS) {
    c.el = document.createElement('div');
    c.el.className = 'co';
    c.el.innerHTML = '<b></b><span></span>';
    cosEl.appendChild(c.el);
    c.t = c.el.firstChild;
    c.s = c.el.lastChild;
    c.t.textContent = c.title;
    c.o = 0;
  }
  const pv = new THREE.Vector3();
  const layoutCallouts = (c, soloParts) => {
    const w = innerWidth;
    const h = innerHeight;
    const L = [];
    const R = [];
    for (const co of COS) {
      const soloOk = !solo.length || soloParts.includes(co.part);
      const o = solo.length && !soloOk ? 0 : clamp(co.show(c) * c.labels, 0, 1);
      co.el.style.opacity = o;
      if (o < 0.02) {
        co.o = 0;
        continue;
      }
      pv.copy(bird.world(co.id)).project(camera);
      const p = [(pv.x * 0.5 + 0.5) * w, (-pv.y * 0.5 + 0.5) * h];
      if (pv.z > 1 || p[0] < 336 || p[0] > w - 336 || p[1] < 74 || p[1] > h - 150) {
        co.el.style.opacity = 0;
        co.o = 0;
        continue;
      }
      co.p = p;
      co.o = o;
      co.s.textContent = co.sub(F);
      (p[0] < w / 2 ? L : R).push(co);
    }
    const lines = [];
    const stack = (col, x, side) => {
      col.sort((a, b) => a.p[1] - b.p[1]);
      let y = 78;
      for (const co of col) {
        y = Math.max(y, Math.min(h - 172, co.p[1] - 20));
        if (y > h - 165) {
          co.el.style.opacity = 0;
          continue;
        }
        co.el.style.left = `${x}px`;
        co.el.style.top = `${y}px`;
        const ax = side > 0 ? x + 168 : x;
        lines.push(`<polyline fill="none" stroke="rgba(36,28,20,${0.5 * co.o})" stroke-width="1" points="${ax},${y + 18} ${ax + side * 12},${y + 18} ${co.p[0]},${co.p[1]}"/><circle cx="${co.p[0]}" cy="${co.p[1]}" r="3.2" fill="${COL.accent}" fill-opacity="${co.o}"/>`);
        y += 48;
      }
    };
    stack(L, 336, 1);
    stack(R, w - 336 - 168, -1);
    lnEl.innerHTML = lines.join('');
  };

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

    if (tier < 2 && tNow > 1.5) {
      perf.n++;
      perf.sum += dt;
      if (perf.sum > 1.2) {
        if (perf.sum / perf.n > 0.032) {
          tier++;
          if (tier === 1) renderer.setPixelRatio(1);
          else {
            key.shadow.mapSize.set(1024, 1024);
            key.shadow.map?.dispose();
            key.shadow.map = null;
          }
          renderer.setSize(innerWidth, innerHeight, false);
        }
        perf.n = 0;
        perf.sum = 0;
      }
    }

    let rem = dt * speed;
    while (rem > 1e-6) {
      const s = Math.min(0.25, rem);
      F.step(s);
      rem -= s;
    }

    let tourText = '';
    if (tourOn) {
      const c = (tNow - tourT0) % TOUR_LEN;
      let step = TOUR[0];
      for (const s of TOUR) if (s.t <= c) step = s;
      if (step.view !== view) setView(step.view);
      Object.assign(target, step.set);
      if (step.set.solo !== undefined) solo = step.set.solo;
      tourText = step.text(F);
    }
    for (const k in cur) cur[k] += (target[k] - cur[k]) * (1 - Math.exp(-dt / (k === 'explode' ? 0.38 : 0.2)));

    // pose: bank and pitch from the flight model, wings breathing in the air
    const bank = F.bank + Math.sin(tNow * 1.3) * 0.02 + Math.sin(tNow * 3.3) * 0.008;
    const pitch = -Math.atan2(F.sink, F.v) * (F.mode === 'cruise' ? 0.2 : 1) + 0.035 + Math.sin(tNow * 0.9) * 0.01;
    pivot.rotation.set(pitch, 0, bank * 0.9);
    pivot.position.y = Math.sin(tNow * 1.7) * 0.01;
    spin += dt * 75 * Math.pow(F.foldK, 2);
    const flex = Math.sin(tNow * 1.15) * 0.014 + Math.sin(tNow * 2.7) * 0.004;
    bird.wings[0].rotation.x = flex;
    bird.wings[1].rotation.x = -flex;
    const soloParts = solo.length ? REGIONS.filter((r) => solo.includes(r.id)).flatMap((r) => r.parts) : [];
    bird.pose({
      explode: cur.explode * cur.explode * (3 - 2 * cur.explode),
      skin: cur.skin,
      xray: cur.xray,
      cg: cur.cg,
      solo: soloParts,
      motor: F.foldK,
      spin,
      elev: 0.05 + Math.abs(bank) * 0.9,
      rud: clamp(F.omega * 0.8, -0.45, 0.45),
      glow: {solar: cur.glow * (0.1 + 0.45 * clamp(F.pAvail / 42, 0, 1)), motor: F.foldK > 0.5 ? 0.5 : 0},
    });

    const sun = sunAt(F.hour);
    const irr = irradiance(sun.elev, F.cloud);
    const gk = clamp((irr.dni * (1 - F.cloud * 0.4) + irr.dif) / 900, 0.18, 1);
    key.intensity = 0.85 + 1.6 * gk;
    const se = Math.max(sun.elev, 0.25);
    key.position.set(Math.cos(sun.az) * Math.cos(se) * 5, Math.sin(se) * 5 + 0.8, Math.sin(sun.az) * Math.cos(se) * 5);
    key.target.position.set(0, 0, 0);

    streaks.visible = cur.explode < 0.25;
    streaks.material.opacity = 0.12 * (1 - cur.explode);
    const vis = 0.5 + F.v * 0.12;
    for (let i = 0; i < NST; i++) {
      const [x0, y, z, len] = stSeed[i];
      const x = ((((x0 - tNow * vis * 1.3) % 3.2) + 3.2) % 3.2) - 1.6;
      stPos.set([x, y, z, x - len * 1.2, y, z], i * 6);
    }
    stGeo.attributes.position.needsUpdate = true;
    const mOn = F.mode === 'thermal' ? 1 : 0;
    motes.material.opacity += (0.75 * mOn - motes.material.opacity) * (1 - Math.exp(-dt / 0.5));
    motes.visible = motes.material.opacity > 0.02;
    for (let i = 0; i < NM; i++) {
      const [a, r, p] = moSeed[i];
      const yy = ((((p + tNow * (0.13 + F.climb * 0.05)) % 1) + 1) % 1) * 1.6 - 0.6;
      const ang = a + tNow * 0.5;
      moPos.set([Math.cos(ang) * r, yy, Math.sin(ang) * r], i * 3);
    }
    moGeo.attributes.position.needsUpdate = true;

    // camera
    const V = VIEWS[view];
    const k = 1 - Math.exp(-dt / 0.32);
    let dAz = V.az + off.az - cam.az;
    dAz = ((((dAz + 180) % 360) + 360) % 360) - 180;
    cam.az += dAz * k;
    cam.el += (V.el + off.el - cam.el) * k;
    cam.d += (V.d * off.k - cam.d) * k;
    for (let i = 0; i < 3; i++) cam.t[i] += (V.t[i] - cam.t[i]) * k;
    const fitK = innerWidth > 1240 ? clamp(1710 / innerWidth, 1, 1.36) : 1;
    const dd = cam.d * fitK * (1 + 0.5 * cur.explode);
    const az = cam.az * D2R;
    const el = cam.el * D2R;
    const camTarget = [cam.t[0], cam.t[1] - 0.02 * cur.explode, cam.t[2]];
    const elx = el + 0.1 * cur.explode;
    camera.position.set(camTarget[0] + dd * Math.cos(elx) * Math.cos(az), camTarget[1] + dd * Math.sin(elx), camTarget[2] + dd * Math.cos(elx) * Math.sin(az));
    camera.lookAt(camTarget[0], camTarget[1], camTarget[2]);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);

    layoutCallouts(cur, solo.length ? REGIONS.filter((r) => solo.includes(r.id)).flatMap((r) => r.parts) : []);

    if (++panelN % 2 === 0) {
      const net = F.pSolar - F.pLoad;
      $('pS').innerHTML = `${fmt(F.pSolar)}<small>W</small>`;
      $('pL').innerHTML = `${fmt(F.pLoad)}<small>W</small>`;
      $('pN').innerHTML = `<span class="${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}${fmt(net)}</span><small>W</small>`;
      $('ebal').textContent = net >= 0 ? '正循环' : '放电中';
      $('soc').textContent = `${(F.soc * 100).toFixed(0)}% · ${(F.soc * BAT_WH).toFixed(1)} Wh`;
      $('socb').style.width = `${F.soc * 100}%`;
      $('socb').style.background = F.soc < 0.2 ? COL.accent : '#3f7d4e';
      const hh = Math.floor(F.hour);
      const mm = Math.floor((F.hour % 1) * 60);
      $('sunl').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · 太阳高度 ${(sun.elev / D2R).toFixed(0)}° · 光照 ${(irr.dni + irr.dif).toFixed(0)} W/m² · 云 ${Math.round(F.cloud * 100)}%`;
      $('clk').innerHTML = `飞行 <b>${String(Math.floor(F.t / 60)).padStart(2, '0')}:${String(Math.floor(F.t % 60)).padStart(2, '0')}</b> · ${speed}× · 已爬升 ${F.gained.toFixed(0)} m`;
      $('mname').textContent = MODE_NAME[F.mode];
      $('mdot').style.background = MODE_COL[F.mode];
      $('mnote').textContent = F.mode === 'thermal' ? 'SOARING' : F.mode === 'glide' ? 'GLIDE' : 'CRUISE';
      $('alt').innerHTML = `${fmt(F.h, 0)}<small>m</small>`;
      $('vario').innerHTML = `<span class="${F.vario > VARIO_TRIGGER ? 'neg' : ''}">${F.vario >= 0 ? '+' : ''}${fmt(F.vario)}</span><small>m/s</small>`;
      $('ld').textContent = fmt(F.ld);
      $('vel').innerHTML = `${fmt(F.v)}<small>m/s</small>`;
      $('bank').innerHTML = `${fmt(Math.abs(F.bank) / D2R, 0)}<small>°</small>`;
      $('sink').innerHTML = `${fmt(F.sink, 2)}<small>m/s</small>`;
      $('log').innerHTML = F.notes.map((n) => `<div><b class="mono">${String(Math.floor(n.t / 60)).padStart(2, '0')}:${String(Math.floor(n.t % 60)).padStart(2, '0')}</b><span>${n.s}</span></div>`).join('') || '<div><span>起飞，阳光巡航中……</span></div>';
      drawPower();
      drawAlt();
      drawMap();
      VKEYS.forEach((v) => bt['v_' + v].classList.toggle('on', view === v));
      for (const [d] of DISP) bt['d_' + d].classList.toggle('on', !!target[d]);
      [1, 2, 6, 20].forEach((n) => bt['sp' + n].classList.toggle('on', speed === n));
      [1.5, 2, 4].forEach((w) => bt['cw' + w].classList.toggle('on', F.camW === w));
      bt.vision.classList.toggle('on', F.vision);
      if (document.activeElement !== sTime.querySelector('input')) sTime.set(F.hour);
      for (const r of REGIONS) {
        r.el.classList.toggle('on', solo.includes(r.id));
        r.lv.textContent = r.live(F);
      }
      $('pnote').textContent = solo.length ? REGIONS.find((r) => r.id === solo[0]).note : '每拆开一件，四周的数字就换成这一件在干活时的读数。';
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
    get F() { return F; },
    scene,
    target,
    setView,
    takeOver,
    pickRegion,
    set(state) {
      takeOver();
      Object.assign(target, state);
      if (state.solo) solo = state.solo;
      if (state.view) setView(state.view);
    },
  };
  void AERO;
  void hoverRegion;
}
