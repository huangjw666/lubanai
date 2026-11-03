// 鲁班木鹊 LUBAN-QUE SR-1: the maths. Real numbers in real units, no three.js in here.
// One source for everything on screen: the weight list gives the mass and the centre of gravity, the planform gives
// the wing area and the solar area, the polar gives sink and motor power, and the flight sim integrates the battery.
import {rng} from '../kit/util.js';

const G = 9.81;
const RHO = 1.2;
const D2R = Math.PI / 180;
export const wrap = (d) => ((((d + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------ planform (metres)
export const W = {
  half: 0.7, // 1.5 m span with the 0.05 m shoulder offset
  chordRoot: 0.3,
  chordTip: 0.11,
  rootLE: 0.12, // leading edge of the root rib, x forward
  sweep: 10 * D2R, // swept back
  dihedral: 4 * D2R,
  tipUp: 0.05, // feather-like tip rise
  cell0: 0.12, // solar covers 12%..88% of the chord
  cell1: 0.88,
};
export const chordAt = (s) => W.chordRoot + (W.chordTip - W.chordRoot) * s;
export const leAt = (s) => W.rootLE - s * W.half * Math.tan(W.sweep);
export const riseAt = (s) => s * W.half * Math.tan(W.dihedral) + W.tipUp * Math.pow(s, 4);
export const AREA = 2 * W.half * ((W.chordRoot + W.chordTip) / 2); // m²
export const SOLAR_AREA = AREA * (W.cell1 - W.cell0) * 0.8 * 0.97; // m² of cells on the upper skin
export const AR = (2 * W.half) ** 2 / AREA;
// mean aerodynamic chord and where its leading edge sits
const MAC = (() => {
  let num = 0;
  let le = 0;
  const n = 200;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n;
    num += chordAt(s) ** 2;
    le += leAt(s) * chordAt(s);
  }
  const area = (AREA / 2 / W.half) * n; // Σ c ds, in units of n
  return {c: num / area, le: le / area};
})();
export {MAC};

// ------------------------------------------------------------ the weight list (g, x in metres, forward positive)
export const PARTS = [
  {id: 'skeleton', name: '竹木骨架', sub: '巴尔沙翼肋 + 火烤竹篾主梁', g: 215, x: -0.07},
  {id: 'film', name: '热缩薄膜 / 线材', sub: '蒙皮与走线', g: 20, x: -0.03},
  {id: 'solar', name: '柔性光伏层', sub: '12 片单晶硅 · 效率 22%', g: 135, x: -0.01},
  {id: 'battery', name: '2S 800mAh 电池', sub: '5.9 Wh 缓冲储能', g: 70, x: 0.2},
  {id: 'motor', name: '电机 · 电调 · 折叠桨', sub: '2204 无刷 + 6 寸折叠桨', g: 40, x: -0.06},
  {id: 'fc', name: '飞控 · GPS · 舵机', sub: 'F405 Wing + 2 × 4.3 g 舵机', g: 35, x: 0.07},
  {id: 'cam', name: '拇指相机', sub: '鸟头 · 兼作配重', g: 15, x: 0.5},
];
export const MASS_G = PARTS.reduce((a, p) => a + p.g, 0);
export const MASS = MASS_G / 1000;
export const WEIGHT = MASS * G;
export const CG_X = PARTS.reduce((a, p) => a + p.g * p.x, 0) / MASS_G;
/** centre of gravity as a fraction of the mean chord behind its leading edge */
export const CG_MAC = (MAC.le - CG_X) / MAC.c;

// ------------------------------------------------------------ the polar
export const AERO = {cd0: 0.022, e: 0.85, etaProp: 0.45, avionics: 1.6, solarEta: 0.22, mppt: 0.95};
const K = 1 / (Math.PI * AR * AERO.e);
/** drag, sink and lift-to-drag at airspeed v (m/s) and bank (rad) */
export function polar(v, bank = 0) {
  const n = 1 / Math.cos(bank);
  const q = 0.5 * RHO * v * v;
  const cl = (n * WEIGHT) / (q * AREA);
  const cd = AERO.cd0 + K * cl * cl;
  const drag = q * AREA * cd;
  return {cl, cd, drag, ld: cl / cd, sink: (drag * v) / WEIGHT, power: (drag * v) / AERO.etaProp};
}

// ------------------------------------------------------------ the sun
export const BAT_WH = 7.4 * 0.8 * 0.9; // 2S 800 mAh, 90 % usable
export function sunAt(hour) {
  const k = clamp((hour - 6) / 12, 0, 1);
  const elev = 68 * D2R * Math.sin(Math.PI * k); // mid-latitude summer day
  const az = (90 + 180 * k) * D2R; // east to west
  return {elev, az};
}
/** direct irradiance on a surface facing the sun (W/m², Meinel air mass) and the diffuse part */
export function irradiance(elev, cloud) {
  if (elev < 0.03) return {dni: 0, dif: 0};
  const am = 1 / Math.max(Math.sin(elev), 0.05);
  const dni = 1353 * Math.pow(0.7, Math.pow(am, 0.678)) * (1 - 0.85 * cloud);
  return {dni, dif: 110 * (1 - 0.35 * cloud) * Math.sin(elev) + 40 * cloud};
}
/** electrical power from the wing's cells: the sun's angle on a banked panel, MPPT loss included */
export function solarPower(hour, cloud, bank, heading) {
  const {elev, az} = sunAt(hour);
  const {dni, dif} = irradiance(elev, cloud);
  const b = Math.abs(bank);
  const cosT = Math.max(0, Math.sin(elev) * Math.cos(b) + Math.cos(elev) * Math.sin(b) * Math.cos(heading - az));
  return (dni * cosT + dif * 0.5) * SOLAR_AREA * AERO.solarEta * AERO.mppt;
}

// ------------------------------------------------------------ the air: four thermals that rise, peak and die
export const THERMAL_PERIOD = 420;
export const CEIL = 400; // m, soaring ceiling
export const FLOOR = 120; // m, motor takes over below this
export const CRUISE_ALT = 200;
export const VARIO_TRIGGER = 0.8; // m/s, as in the SOARING parameters
const BOX = 450;

export function createFlight(seed = 11) {
  const R = rng(seed);
  const mkThermal = (x, y, age) => ({x, y, w0: 2.3 + R() * 1.5, R: 55 + R() * 30, age, id: Math.floor(R() * 1e6)});
  const thermals = [
    mkThermal(170, 40, THERMAL_PERIOD * 0.3),
    mkThermal(-300, 260, THERMAL_PERIOD * 0.12),
    mkThermal(80, -330, THERMAL_PERIOD * 0.55),
    mkThermal(-260, -220, THERMAL_PERIOD * 0.8),
  ];
  const wind = [0.8, 0.3];
  const strength = (th) => th.w0 * Math.pow(Math.max(0, Math.sin((Math.PI * th.age) / THERMAL_PERIOD)), 0.6);
  const liftOf = (th, x, y) => {
    const d = Math.hypot(x - th.x, y - th.y);
    const s = strength(th);
    if (d < th.R) return s * (1 - (d / th.R) ** 2);
    if (d < th.R * 1.5) return -0.4 * Math.sin((Math.PI * (d - th.R)) / (th.R * 0.5)) * Math.min(1, s / 1.5);
    return 0;
  };
  const airAt = (x, y) => thermals.reduce((a, th) => a + liftOf(th, x, y), 0);

  const f = {
    thermals,
    strength,
    airAt,
    x: 0,
    y: 0,
    h: 215,
    psi: 0.2,
    v: 11,
    bank: 0,
    omega: 0,
    mode: 'cruise', // cruise | thermal | glide
    motor: true,
    foldK: 0,
    vario: 0,
    climb: 0,
    w: 0,
    ctr: null,
    thermalT: 0,
    lostT: 0,
    wp: [150, 40],
    wpT: 0,
    soc: 0.55,
    hour: 10.5,
    cloud: 0.15,
    camW: 2,
    vision: true,
    pSolar: 0,
    pLoad: 0,
    pMotor: 0,
    ld: 0,
    sink: 0,
    trail: [],
    hist: [],
    histT: 0,
    t: 0,
    gained: 0,
    notes: [],
  };
  const note = (s) => {
    f.notes.unshift({t: f.t, s});
    f.notes.length = Math.min(f.notes.length, 6);
  };
  const pickWaypoint = () => {
    f.wpT = 0;
    if (f.vision) {
      let best = null;
      for (const th of thermals) {
        const s = strength(th);
        const d = Math.hypot(th.x - f.x, th.y - f.y);
        if (s > 1.6 && d > 60 && d < 520 && (!best || d < best.d)) best = {th, d};
      }
      if (best) {
        f.wp = [best.th.x, best.th.y];
        f.seeking = true;
        return;
      }
    }
    f.seeking = false;
    f.wp = [(R() * 2 - 1) * BOX, (R() * 2 - 1) * BOX];
  };

  const steer = (dt, des, omegaMax) => {
    const want = clamp(wrap(des - f.psi) * 1.4, -omegaMax, omegaMax);
    f.omega += (want - f.omega) * (1 - Math.exp(-dt / 0.35));
    f.psi += f.omega * dt;
  };

  f.step = (dt) => {
    f.t += dt;
    f.hour += dt / 3600;
    for (const th of thermals) {
      th.age += dt;
      th.x += wind[0] * dt;
      th.y += wind[1] * dt;
      if (th.age > THERMAL_PERIOD) {
        Object.assign(th, mkThermal(f.x + (R() * 2 - 1) * 380, f.y + (R() * 2 - 1) * 380, 0));
      }
    }
    f.w = airAt(f.x, f.y);
    // the vario: barometer + accelerometer, noisy, low-passed over a second
    const noise = Math.sin(f.t * 3.1) * 0.12 + Math.sin(f.t * 7.7 + 1.3) * 0.08;
    f.vario += (f.w + noise - f.vario) * (1 - Math.exp(-dt / 1.0));

    // ---- mode logic
    if (f.mode !== 'thermal' && f.vario > VARIO_TRIGGER && f.h < CEIL - 15) {
      f.mode = 'thermal';
      f.thermalT = 0;
      f.lostT = 0;
      f.ctr = {x: f.x + Math.cos(f.psi) * 25 + (R() - 0.5) * 30, y: f.y + Math.sin(f.psi) * 25 + (R() - 0.5) * 30};
      note(`vario ${f.vario.toFixed(1)} m/s > ${VARIO_TRIGGER}: 电机停转,桨叶收拢,开始盘旋`);
    } else if (f.mode === 'thermal') {
      f.thermalT += dt;
      // the EKF's centre estimate converges on the thermal's true centre
      let best = null;
      for (const th of thermals) {
        const d = Math.hypot(th.x - f.x, th.y - f.y);
        if (d < th.R * 1.2 && (!best || d < best.d)) best = {th, d};
      }
      if (best) f.ctr = {x: f.ctr.x + (best.th.x - f.ctr.x) * (1 - Math.exp(-dt / 7)), y: f.ctr.y + (best.th.y - f.ctr.y) * (1 - Math.exp(-dt / 7))};
      f.lostT = f.w < 0.25 ? f.lostT + dt : 0;
      const weak = f.thermalT > 14 && f.climb < 0.2;
      if (f.h >= CEIL || f.lostT > 6 || weak) {
        f.mode = 'glide';
        pickWaypoint();
        note(f.h >= CEIL ? `到达 ${CEIL} m 高度上限:改平,展翅滑翔找下一股气流` : '热气流减弱:改平,展翅滑翔换场');
      }
    } else if (f.mode === 'glide' && f.h < FLOOR) {
      f.mode = 'cruise';
      note(`低于 ${FLOOR} m:电机接管,阳光巡航爬升`);
    }
    f.motor = f.mode === 'cruise';
    f.foldK += ((f.motor ? 1 : 0) - f.foldK) * (1 - Math.exp(-dt / 0.35));

    // ---- flight path
    const vT = f.mode === 'cruise' ? 11 : f.mode === 'glide' ? 9 : 8.5;
    f.v += (vT - f.v) * (1 - Math.exp(-dt / 1.5));
    const omegaMax = (G * Math.tan(35 * D2R)) / f.v;
    if (f.mode === 'thermal') {
      const dx = f.ctr.x - f.x;
      const dy = f.ctr.y - f.y;
      const dist = Math.hypot(dx, dy);
      const r0 = (f.v * f.v) / (G * Math.tan(30 * D2R));
      steer(dt, Math.atan2(dy, dx) - Math.PI / 2 + Math.atan((dist - r0) / (r0 * 0.8)), omegaMax);
    } else {
      f.wpT += dt;
      if (Math.hypot(f.wp[0] - f.x, f.wp[1] - f.y) < 45 || f.wpT > 25) pickWaypoint();
      steer(dt, Math.atan2(f.wp[1] - f.y, f.wp[0] - f.x), omegaMax * 0.6);
    }
    const bankWant = Math.atan((f.omega * f.v) / G);
    f.bank += (bankWant - f.bank) * (1 - Math.exp(-dt / 0.5));
    f.x += (f.v * Math.cos(f.psi) + wind[0]) * dt;
    f.y += (f.v * Math.sin(f.psi) + wind[1]) * dt;

    const pl = polar(f.v, f.bank);
    f.ld = pl.ld;
    f.sink = pl.sink;
    let dh;
    let pMotor = 0;
    if (f.mode === 'cruise') {
      dh = f.h < CRUISE_ALT ? 1.0 : 0;
      pMotor = pl.power + (WEIGHT * dh) / AERO.etaProp;
    } else dh = f.w - pl.sink;
    f.h = Math.max(0, f.h + dh * dt);
    f.climb += (dh - f.climb) * (1 - Math.exp(-dt / 2));
    if (f.h > 0 && dh > 0 && f.mode === 'thermal') f.gained += dh * dt;

    // ---- the energy ledger
    f.pMotor = pMotor;
    f.pLoad = pMotor + AERO.avionics + f.camW;
    const avail = solarPower(f.hour, f.cloud, f.bank, f.psi);
    const net = avail - f.pLoad;
    f.pAvail = avail;
    if (f.soc >= 0.999 && net > 0) f.pSolar = f.pLoad; // MPPT throttles when the pack is full
    else f.pSolar = avail;
    f.soc = clamp(f.soc + ((f.pSolar - f.pLoad) * dt) / (BAT_WH * 3600), 0, 1);

    f.trail.push([f.x, f.y]);
    if (f.trail.length > 500) f.trail.shift();
    f.histT += dt;
    if (f.histT >= 2) {
      f.histT = 0;
      f.hist.push({t: f.t, h: f.h, solar: f.pSolar, load: f.pLoad, climb: f.climb, mode: f.mode});
      if (f.hist.length > 150) f.hist.shift();
    }
  };
  pickWaypoint();
  return f;
}

export const MODE_NAME = {cruise: '阳光巡航', thermal: '追风盘旋', glide: '展翅滑翔'};
