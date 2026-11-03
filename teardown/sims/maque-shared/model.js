// 鲁班木鹊 LUBAN-QUE SR-1 — the airframe, built from code in metres.
// Forward +x, up +y, right +z. Every wing dimension comes from bird.js: the same planform that
// gives the area, the solar power and the mass also places the ribs, so nothing can disagree.
import * as THREE from 'three';
import {CG_X, chordAt, leAt, riseAt, W} from './bird.js';

const V3 = THREE.Vector3;
const D2R = Math.PI / 180;
const WING_Y = 0.03; // the wing sits at shoulder height, not through the middle of the chest
const WING_Z0 = 0.05; // and it starts at the shoulder, leaving the body visible between the wings

export const COL = {
  bg: '#f0e7d6',
  paper: '#f7efdd',
  balsa: '#e4c48d',
  balsaDark: '#c9a468',
  bamboo: '#c79a3c',
  bambooDark: '#8f6a22',
  ink: '#241c14',
  accent: '#c8452a',
  cellA: '#1b3560',
  cellB: '#24487c',
  pcb: '#2f6b4f',
  metal: '#9aa0a6',
};

// ------------------------------------------------------------ airfoil (NACA 4412-ish: 9 % thick, 4 % camber)
const yt = (x, t = 0.09) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
const yc = (x, m = 0.04, p = 0.4) => (x < p ? (m / (p * p)) * (2 * p * x - x * x) : (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x * x));
const upper = (x) => yc(x) + yt(x);
const lower = (x) => yc(x) - yt(x);
const cosx = (i, n) => 0.5 - 0.5 * Math.cos((Math.PI * i) / n);
const lerp = (a, b, t) => a + (b - a) * t;

/** a point on the wing: span fraction s (0 root .. 1 tip), chord fraction xc, height yv in chords */
export function wingPoint(s, xc, yv, side, out = new V3()) {
  const c = chordAt(s);
  const rise = riseAt(s) + WING_Y;
  const dRise = riseAt(s + 0.004) - riseAt(Math.max(0, s - 0.004));
  const ang = Math.atan2(dRise, 0.008 * W.half);
  const dy = yv * c;
  return out.set(leAt(s) - xc * c, rise + dy * Math.cos(ang), side * (WING_Z0 + s * W.half - dy * Math.sin(ang)));
}

// ------------------------------------------------------------ materials
function mat(color, o = {}) {
  return new THREE.MeshStandardMaterial({color, roughness: 0.62, metalness: 0, ...o});
}

function tex(draw, w = 256, h = 256, rep = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  t.anisotropy = 8;
  return t;
}

const bambooTex = () =>
  tex((g, w, h) => {
    g.fillStyle = '#d2a747';
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,240,190,.35)';
    g.fillRect(0, h * 0.18, w, h * 0.16);
    for (let i = 0; i < 5; i++) {
      const x = 18 + i * 52;
      g.fillStyle = 'rgba(120,84,24,.85)';
      g.fillRect(x, 0, 3, h);
      g.fillStyle = 'rgba(255,248,210,.5)';
      g.fillRect(x + 3, 0, 2, h);
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(120,84,24,${0.05 + (i % 3) * 0.03})`;
      g.fillRect(0, (i / 26) * h, w, 1);
    }
  }, 256, 32, [3, 1]);

const cellTex = () =>
  tex((g, w, h) => {
    g.fillStyle = '#dfe7ef';
    g.fillRect(0, 0, w, h);
    const cols = 5;
    const rows = 4;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const x = (i * w) / cols + 2;
        const y = (j * h) / rows + 2;
        const cw = w / cols - 4;
        const ch = h / rows - 4;
        const gr = g.createLinearGradient(x, y, x + cw, y + ch);
        gr.addColorStop(0, COL.cellB);
        gr.addColorStop(0.55, COL.cellA);
        gr.addColorStop(1, '#12233f');
        g.fillStyle = gr;
        g.fillRect(x, y, cw, ch);
        g.strokeStyle = 'rgba(255,255,255,.10)';
        g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
        g.fillStyle = 'rgba(180,200,225,.55)';
        g.fillRect(x + cw * 0.48, y, 1.2, ch);
      }
    g.fillStyle = 'rgba(200,215,235,.9)';
    for (let i = 0; i <= cols; i++) g.fillRect((i * w) / cols - 1, 0, 2, h);
  }, 256, 256, [3, 1]);

const paperTex = () =>
  tex((g, w, h) => {
    g.fillStyle = '#f8f1e0';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = (i * 97.13) % w;
      const y = (i * 41.77) % h;
      g.fillStyle = `rgba(150,120,70,${0.02 + ((i * 7) % 5) * 0.008})`;
      g.fillRect(x, y, 2, 1);
    }
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = 'rgba(160,130,80,.10)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, (i * h) / 14);
      g.lineTo(w, (i * h) / 14 + 6);
      g.stroke();
    }
  }, 256, 256, [2, 2]);

// ------------------------------------------------------------ one wing: skin, solar, ribs, spar, primaries
function buildWing(side, M) {
  const g = new THREE.Group();
  const NS = 26;
  const NP = 20;
  const surfLoft = (surf, x0, x1, s1 = 1) => {
    const pos = [];
    const uv = [];
    const idx = [];
    for (let i = 0; i <= NS; i++) {
      const s = (i / NS) * s1;
      for (let j = 0; j <= NP; j++) {
        const xc = x0 + (x1 - x0) * cosx(j, NP);
        const p = wingPoint(s, xc, surf(xc), side);
        pos.push(p.x, p.y + (surf === upper ? 0.0012 : -0.0012), p.z);
        uv.push(j / NP, (i / NS) * 1.6);
      }
    }
    for (let i = 0; i < NS; i++)
      for (let j = 0; j < NP; j++) {
        const a = i * (NP + 1) + j;
        idx.push(a, a + 1, a + NP + 1, a + 1, a + NP + 2, a + NP + 1);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  };

  const film = new THREE.Group();
  film.add(new THREE.Mesh(surfLoft(upper, 0, 1), M.film));
  film.add(new THREE.Mesh(surfLoft(lower, 0, 1), M.film));
  const solar = new THREE.Mesh(surfLoft(upper, W.cell0, W.cell1, 0.8), M.solar);
  solar.position.y = 0.0016;
  solar.userData.role = 'solar';
  g.add(film, solar);

  // balsa ribs with lightening holes, standing normal to the span line
  const ribs = new THREE.Group();
  const NR = 16;
  for (let i = 0; i < NR; i++) {
    const s = 0.015 + (i / (NR - 1)) * 0.83;
    const c = chordAt(s);
    const sh = new THREE.Shape();
    const N = 20;
    for (let k = 0; k <= N; k++) {
      const xc = cosx(k, N);
      const p = [-xc * c, upper(xc) * c];
      k ? sh.lineTo(...p) : sh.moveTo(...p);
    }
    for (let k = N - 1; k >= 0; k--) {
      const xc = cosx(k, N);
      sh.lineTo(-xc * c, lower(xc) * c);
    }
    for (const [hx, hr] of [[0.54, 0.0105], [0.75, 0.0078]]) {
      const hole = new THREE.Path();
      hole.absarc(-hx * c, yc(hx) * c, hr, 0, Math.PI * 2, true);
      sh.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.005, bevelEnabled: false});
    geo.translate(0, 0, -0.0025);
    const m = new THREE.Mesh(geo, M.balsa);
    const a = wingPoint(s, 0, 0, side);
    m.position.copy(a);
    const dRise = riseAt(s + 0.002) - riseAt(s - 0.002);
    m.rotation.x = -side * Math.atan2(dRise, 0.004 * W.half);
    ribs.add(m);
  }
  g.add(ribs);

  // bamboo spar, leading edge, trailing edge
  const sweepTube = (xc, yv, r, material, s1 = 0.995, nodes = 0) => {
    const pts = [];
    for (let i = 0; i <= 28; i++) pts.push(wingPoint((i / 28) * s1, xc, yv, side));
    const curve = new THREE.CatmullRomCurve3(pts);
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 56, r, 8, false), material));
    for (let i = 1; i <= nodes; i++) {
      const p = curve.getPointAt(i / (nodes + 1));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.2, r * 0.22, 5, 14), material);
      ring.position.copy(p);
      ring.rotation.y = Math.PI / 2;
      ring.scale.setScalar(1.0);
      grp.add(ring);
    }
    return grp;
  };
  const frame = new THREE.Group();
  frame.add(sweepTube(0.3, yc(0.3), 0.0068, M.bamboo, 0.99, 4));
  frame.add(sweepTube(0.006, 0, 0.005, M.bamboo, 0.99, 6));
  frame.add(sweepTube(0.995, 0, 0.003, M.balsaDark, 0.99));
  frame.add(sweepTube(0.66, yc(0.66), 0.0032, M.bamboo, 0.99, 3));
  g.add(frame);

  // primaries: 7 fanned feathers carrying the wingtip past the film, the bird's silhouette
  const feathers = new THREE.Group();
  const NF = 5;
  for (let i = 0; i < NF; i++) {
    const s0 = 0.48 + i * 0.075;
    const s1 = 0.78 + i * 0.055;
    const band0 = lerp(0.3, 0.18, i / (NF - 1));
    const mid = 0.48 + i * 0.03;
    const pos = [];
    const idx = [];
    const NSf = 10;
    for (let j = 0; j <= NSf; j++) {
      const u = j / NSf;
      const s = lerp(s0, s1, u);
      const band = lerp(band0, 0.004, Math.pow(u, 2.1));
      const droop = -0.0035 * i - 0.016 * u * u;
      for (const xc of [mid - band, mid, mid + band]) {
        const p = wingPoint(s, xc, upper(xc) - 0.0022 + droop / chordAt(s), side);
        pos.push(p.x, p.y, p.z);
      }
    }
    for (let j = 0; j < NSf; j++) {
      const a = j * 3;
      idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, i > 2 ? M.feather : M.featherIn);
    feathers.add(m);
  }
  g.add(feathers);
  g.userData = {film, solar, ribs, frame, feathers};
  return g;
}

// ------------------------------------------------------------ the bird
export function buildBird() {
  const M = {
    balsa: mat('#dcb87c', {roughness: 0.82}),
    balsaDark: mat(COL.balsaDark, {roughness: 0.75}),
    bamboo: mat('#ffffff', {roughness: 0.52, map: bambooTex()}),
    film: mat(COL.paper, {transparent: true, opacity: 0.4, side: THREE.DoubleSide, roughness: 0.45, depthWrite: false, map: paperTex()}),
    solar: mat('#ffffff', {map: cellTex(), roughness: 0.42, metalness: 0.12, side: THREE.DoubleSide, transparent: true, emissive: '#2b6cb0', emissiveIntensity: 0}),
    feather: mat('#f6ebd3', {roughness: 0.74, side: THREE.DoubleSide, transparent: true}),
    featherIn: mat('#e9d5ac', {roughness: 0.78, side: THREE.DoubleSide, transparent: true}),
    shell: mat('#eedcb4', {roughness: 0.7, side: THREE.DoubleSide, transparent: true, map: paperTex()}),
    ink: mat(COL.ink, {roughness: 0.48}),
    accent: mat(COL.accent, {roughness: 0.44, emissive: COL.accent, emissiveIntensity: 0}),
    pcb: mat(COL.pcb, {roughness: 0.55}),
    metal: mat(COL.metal, {roughness: 0.34, metalness: 0.85}),
    battery: mat('#2f4f87', {roughness: 0.42}),
    glass: mat('#0b1220', {roughness: 0.08, metalness: 0.5}),
    prop: mat('#33302c', {roughness: 0.55}),
    glow: mat(COL.accent, {roughness: 0.4, emissive: COL.accent, emissiveIntensity: 0}),
    disc: new THREE.MeshBasicMaterial({color: '#b8a88c', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false}),
  };
  const root = new THREE.Group();
  const parts = {};
  const anchors = {};
  const part = (name, dir, dist) => {
    const g = new THREE.Group();
    g.userData = {dir: new V3(...dir).normalize(), dist};
    parts[name] = g;
    root.add(g);
    return g;
  };
  const anchor = (parent, id, x, y, z) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    anchors[id] = o;
  };

  // ---- wings
  const wr = part('wingR', [0.16, 0.55, 1], 0.42);
  const wl = part('wingL', [0.16, 0.55, -1], 0.42);
  const WR = buildWing(1, M);
  const WL = buildWing(-1, M);
  wr.add(WR);
  wl.add(WL);
  anchor(wr, 'spar', leAt(0.42) - 0.3 * chordAt(0.42), riseAt(0.42) + WING_Y + yc(0.3) * chordAt(0.42), WING_Z0 + 0.42 * W.half);
  anchor(wr, 'solar', leAt(0.45) - 0.45 * chordAt(0.45), riseAt(0.45) + WING_Y + upper(0.45) * chordAt(0.45) + 0.012, WING_Z0 + 0.45 * W.half);
  anchor(wr, 'rib', leAt(0.24) - 0.6 * chordAt(0.24), riseAt(0.24) + WING_Y, WING_Z0 + 0.24 * W.half);
  anchor(wr, 'feather', leAt(1.02) - 0.5 * chordAt(1.02), riseAt(1.02) + WING_Y, WING_Z0 + 1.02 * W.half);

  // ---- fuselage: a lathed wooden body, deep at the chest and tapering to a bamboo boom
  const body = part('body', [0, -1, 0], 0.2);
  const BODY = [
    [0.255, 0.012], [0.235, 0.03], [0.2, 0.044], [0.15, 0.053], [0.08, 0.056], [0.0, 0.054],
    [-0.07, 0.048], [-0.14, 0.038], [-0.2, 0.026], [-0.25, 0.014], [-0.28, 0.007],
  ];
  const bodyCurve = new THREE.CatmullRomCurve3(BODY.map(([x, r]) => new V3(x, r, 0)));
  const prof = [];
  for (let i = 0; i <= 32; i++) {
    const p = bodyCurve.getPoint(i / 32);
    prof.push(new THREE.Vector2(Math.max(p.y, 0.003), p.x));
  }
  const rAt = (x) => {
    for (let i = 0; i < BODY.length - 1; i++) {
      const [x0, r0] = BODY[i];
      const [x1, r1] = BODY[i + 1];
      if (x <= x0 && x >= x1) return lerp(r0, r1, (x0 - x) / (x0 - x1));
    }
    return 0.004;
  };
  const bodyGeo = new THREE.LatheGeometry(prof, 36);
  bodyGeo.rotateZ(-Math.PI / 2);
  const shell = new THREE.Mesh(bodyGeo, M.shell);
  shell.scale.set(1, 1.08, 1);
  shell.position.y = -0.004;
  body.add(shell);

  const hoops = new THREE.Group();
  for (const x of [0.2, 0.13, 0.06, -0.01, -0.08, -0.15, -0.21]) {
    const r = rAt(x) * 0.98;
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0026, 6, 30), M.bamboo);
    t.rotation.y = Math.PI / 2;
    t.position.x = x;
    t.scale.set(1, 1.08, 1);
    hoops.add(t);
  }
  for (const a of [0.32, Math.PI - 0.32, Math.PI * 0.5 + 0.35, Math.PI * 1.5 - 0.35]) {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const x = 0.23 - (i / 18) * 0.46;
      pts.push(new V3(x, Math.sin(a) * rAt(x) * 1.05 - 0.004, Math.cos(a) * rAt(x)));
    }
    hoops.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.003, 6), M.bamboo));
  }
  body.add(hoops);
  anchor(body, 'hoop', 0.0, rAt(0.0) * 1.0, 0.03);

  // belly hatch + the shoulder fairings that make the wing meet the body
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.002, 0.05), M.balsaDark);
  hatch.position.set(0.04, -rAt(0.04) * 1.08 - 0.001, 0);
  body.add(hatch);
  for (const z of [-1, 1]) {
    const fair = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), M.balsa);
    fair.scale.set(0.07, 0.016, 0.042);
    fair.position.set(0.055, WING_Y - 0.006, z * (WING_Z0 + 0.015));
    fair.scale.set(0.075, 0.014, 0.055);
    body.add(fair);
  }

  // ---- head, neck, beak, camera
  const head = part('head', [1, 0.6, 0], 0.26);
  const neck = new THREE.CatmullRomCurve3([
    new V3(0.16, 0.028, 0),
    new V3(0.21, 0.055, 0),
    new V3(0.255, 0.095, 0),
    new V3(0.285, 0.128, 0),
    new V3(0.3, 0.142, 0),
  ]);
  head.add(new THREE.Mesh(new THREE.TubeGeometry(neck, 24, 0.027, 16), M.shell));
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.036, 24, 16), M.shell);
  skull.scale.set(1.45, 1.02, 1);
  skull.position.set(0.33, 0.152, 0);
  head.add(skull);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.0135, 0.062, 14), M.accent);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.394, 0.147, 0);
  head.add(beak);
  for (const z of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0056, 10, 8), M.ink);
    eye.position.set(0.345, 0.161, z * 0.0245);
    head.add(eye);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0082, 0.0015, 6, 14), M.balsaDark);
    ring.rotation.y = Math.PI / 2;
    ring.position.copy(eye.position);
    head.add(ring);
  }
  const cam = new THREE.Group();
  cam.position.set(0.322, 0.178, 0);
  cam.add(new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.014, 0.019), M.ink));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.008, 16), M.glass);
  lens.rotation.z = Math.PI / 2;
  lens.position.set(0.016, 0.001, 0);
  cam.add(lens);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 8, 6), M.accent);
  led.position.set(0.004, 0.0085, 0);
  cam.add(led);
  head.add(cam);
  anchor(head, 'cam', 0.33, 0.192, 0);

  // ---- tail: a balsa tail cone, a fan of feathers, and the two outer feathers hinged as control surfaces.
  // Both surfaces together give pitch, opposite each other give yaw — two 4.3 g servos, no extra fin.
  const tail = part('tail', [-1, 0.3, 0], 0.3);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.028, 0.2, 18), M.shell);
  cone.rotation.z = Math.PI / 2;
  cone.position.set(-0.35, 0.002, 0);
  tail.add(cone);
  for (const [x, r] of [[-0.29, 0.025], [-0.35, 0.018], [-0.41, 0.011]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0018, 5, 14), M.bamboo);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(x, 0.002, 0);
    tail.add(ring);
  }

  const featherShape = (len, half) => {
    const sh = new THREE.Shape();
    sh.moveTo(0.01, -half);
    sh.lineTo(-len * 0.55, -half * 1.05);
    sh.lineTo(-len, 0);
    sh.lineTo(-len * 0.55, half * 1.05);
    sh.lineTo(0.01, half);
    return sh;
  };
  const fanFeather = (len, half, mat) => {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(featherShape(len, half)), mat);
    m.rotation.x = -Math.PI / 2;
    return m;
  };
  // three fixed centre feathers
  for (const [ang, len] of [[-15, 0.19], [0, 0.225], [15, 0.19]]) {
    const f = fanFeather(len, 0.032, M.feather);
    f.rotation.z = ang * D2R;
    f.position.set(-0.4, 0.002 + Math.abs(ang) * 0.00004, 0);
    tail.add(f);
  }
  const hinges = [];
  for (const side of [1, -1]) {
    const hinge = new THREE.Group();
    hinge.position.set(-0.4, 0.004, 0);
    for (const [ang, len] of [[30, 0.2], [45, 0.15]]) {
      const f = fanFeather(len, 0.03, M.featherIn);
      f.rotation.z = side * ang * D2R;
      hinge.add(f);
      const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new V3(0.008, 0, side * 0.028), new V3(-len * 0.6, 0.001, side * (0.028 + len * 0.45)), new V3(-len, 0.002, side * (0.03 + len * 0.62))]), 10, 0.0026, 6), M.bamboo);
      hinge.add(edge);
    }
    hinges.push({hinge, side});
    tail.add(hinge);
  }
  // the hinge line, so the moving surfaces read as moving
  const hingeBar = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.16, 8), M.bambooDark);
  hingeBar.rotation.x = Math.PI / 2;
  hingeBar.position.set(-0.4, 0.004, 0);
  tail.add(hingeBar);
  for (const side of [1, -1]) {
    const servo = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.01, 0.008), M.ink);
    servo.position.set(-0.31, 0.006, side * 0.016);
    tail.add(servo);
  }
  anchor(tail, 'tail', -0.55, 0.03, 0.1);

  // ---- avionics inside the belly
  const elec = part('elec', [0, -1, 0], 0.34);
  const bat = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.021, 0.032), M.battery);
  bat.position.set(0.17, -0.004, 0);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.0225, 0.0335), M.accent);
  strap.position.copy(bat.position);
  const fc = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.004, 0.034), M.pcb);
  fc.position.set(0.03, 0.004, 0);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.003, 0.01), M.ink);
  chip.position.set(0.03, 0.0075, 0);
  const mppt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.004, 0.026), M.pcb);
  mppt.position.set(-0.025, 0.006, 0);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.0065, 0.0026, 6, 16), M.metal);
  coil.rotation.x = Math.PI / 2;
  coil.position.set(-0.018, 0.0115, 0);
  const esc = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.006, 0.016), M.ink);
  esc.position.set(-0.09, 0.008, 0);
  const gps = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.004, 0.017), M.ink);
  gps.position.set(-0.05, 0.018, 0);
  elec.add(bat, strap, fc, chip, mppt, coil, esc, gps);
  for (const [z, c] of [[0.013, M.accent], [-0.013, M.ink]]) {
    const pts = [new V3(0.11, -0.003, z * 0.6), new V3(0.06, 0.002, z), new V3(-0.02, 0.008, z * 0.7), new V3(-0.09, 0.01, z * 0.4)];
    elec.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.0011, 5), c));
  }
  anchor(elec, 'battery', 0.17, -0.009, 0.018);
  anchor(elec, 'fc', 0.03, 0.011, -0.011);
  anchor(elec, 'mppt', -0.025, 0.013, 0.015);

  // ---- power: a motor in the tail cone, the folding prop lying back along the boom
  const motor = part('motor', [-0.35, 1, 0], 0.42);
  const fairing = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.036, 6, 14), M.balsa);
  fairing.rotation.z = Math.PI / 2;
  fairing.position.set(-0.225, 0.012, 0);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.026, 16), M.metal);
  can.rotation.z = Math.PI / 2;
  can.position.set(-0.252, 0.012, 0);
  const hub = new THREE.Group();
  hub.position.set(-0.3, 0.012, 0);
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.0085, 0.014, 14), M.glow);
  spinner.userData.role = 'glow';
  spinner.rotation.z = Math.PI / 2;
  spinner.position.x = -0.005;
  hub.add(spinner);
  const blades = [];
  for (const k of [0, 1]) {
    const pivot = new THREE.Group();
    pivot.rotation.x = k * Math.PI;
    const fold = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.0032, 0.068, 0.012), M.prop);
    blade.position.y = 0.038;
    blade.rotation.y = 0.3;
    blade.userData.role = 'prop';
    fold.add(blade);
    pivot.add(fold);
    hub.add(pivot);
    blades.push({fold, k});
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.074, 48), M.disc);
  disc.rotation.y = Math.PI / 2;
  disc.position.set(-0.3, 0.012, 0);
  disc.userData.role = 'disc';
  motor.add(fairing, can, hub, disc);
  anchor(motor, 'motor', -0.25, 0.03, 0);

  // ---- centre of gravity
  const cgGroup = part('cg', [0, 0, 0], 0);
  const cg = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.003, 8, 30), M.accent);
  ring.rotation.y = Math.PI / 2;
  cg.add(ring);
  cg.position.set(CG_X, 0.002, 0);
  cgGroup.add(cg);
  anchor(cgGroup, 'cg', CG_X, 0.03, 0);

  // per-part material clones, so one subsystem can be isolated without fading the others
  for (const name in parts) {
    parts[name].traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material.clone();
      m.userData.base = o.material.opacity;
      o.material = m;
    });
  }

  // dashed guides that show where each part came from while the model is exploded
  const guideGeo = new THREE.BufferGeometry();
  const guidePos = new Float32Array(Object.keys(parts).length * 8);
  guideGeo.setAttribute('position', new THREE.BufferAttribute(guidePos, 3));
  guideGeo.boundingSphere = new THREE.Sphere(new V3(), 3);
  const guides = new THREE.LineSegments(guideGeo, new THREE.LineDashedMaterial({color: '#8b7355', dashSize: 0.02, gapSize: 0.016, transparent: true, opacity: 0, depthWrite: false}));
  guides.frustumCulled = false;
  root.add(guides);
  const guideParts = Object.keys(parts).filter((n) => n !== 'cg');

  const wp = new V3();
  const world = (id) => anchors[id].getWorldPosition(wp).clone();
  const TMP = new V3();

  const setPartOpacity = (g, k) => {
    g.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      const b = m.userData.base ?? 1;
      m.opacity = b * k;
      m.transparent = b < 0.999 || k < 0.999;
      m.depthWrite = m.opacity > 0.85;
    });
  };

  /**
   * pose: {explode 0..1, skin 0..1, xray 0..1, solo:[partNames], cg 0..1,
   *        motor 0..1 deployed, spin rad, elev, rud, glow:{solar, motor}}
   */
  function pose(v) {
    const solo = v.solo && v.solo.length ? v.solo : null;
    const fadeOf = (name) => (solo ? (solo.includes(name) ? 1 : 0.07) : 1);
    for (const name in parts) {
      const g = parts[name];
      g.position.copy(TMP.copy(g.userData.dir).multiplyScalar(g.userData.dist * v.explode));
      let k = fadeOf(name);
      if (name === 'cg') k = v.cg > 0.02 ? 1 : 0;
      setPartOpacity(g, k);
    }
    const skinK = v.skin;
    const wk = fadeOf('wingR');
    for (const w of [WR, WL]) {
      w.userData.film.children.forEach((m) => {
        m.material.opacity = 0.4 * skinK * wk;
        m.material.visible = skinK > 0.03;
      });
      w.userData.solar.material.opacity = skinK * wk;
      w.userData.solar.material.visible = skinK > 0.03;
      w.userData.feathers.children.forEach((f) => (f.material.opacity = (1 - 0.12 * (1 - skinK)) * wk));
    }
    // x-ray: the paper skin and the body shell go glassy, the parts inside keep their colour
    const xr = v.xray;
    for (const name of ['body', 'head', 'tail']) {
      const k = fadeOf(name);
      parts[name].traverse((o) => {
        if (o.isMesh && o.material.userData.base === 1 && o.material.map === M.shell.map) {
          o.material.opacity = (1 - 0.9 * xr) * k;
          o.material.transparent = true;
          o.material.depthWrite = xr < 0.35 && k > 0.5;
        }
      });
    }
    // guides: from the part's exploded position home to the airframe
    guideParts.forEach((name, i) => {
      const g = parts[name];
      const o = 4 * i;
      guidePos[o] = g.position.x;
      guidePos[o + 1] = g.position.y;
      guidePos[o + 2] = g.position.z;
      guidePos[o + 3] = 0;
      guidePos[o + 4] = 0;
      guidePos[o + 5] = 0;
    });
    guideGeo.attributes.position.needsUpdate = true;
    guides.material.opacity = 0.55 * v.explode;
    guides.visible = v.explode > 0.02;
    guides.computeLineDistances();
    cgGroup.scale.setScalar(0.45 + 0.55 * v.cg);
    for (const b of blades) b.fold.rotation.z = (1 - v.motor) * 1.48;
    hub.rotation.x = v.spin;
    root.traverse((o) => {
      if (!o.isMesh) return;
      const role = o.userData.role;
      const m = o.material;
      if (role === 'solar') m.emissiveIntensity = v.glow.solar;
      else if (role === 'glow') m.emissiveIntensity = v.glow.motor;
      else if (role === 'disc') {
        m.opacity = 0.34 * v.motor;
        m.transparent = true;
      } else if (role === 'prop') {
        m.opacity = 1 - 0.7 * v.motor;
        m.transparent = true;
      }
    });
    for (const h of hinges) {
      h.hinge.rotation.z = -v.elev * 0.9;
      h.hinge.rotation.y = h.side * v.rud * 0.7;
    }
  }
  return {root, parts, pose, world, mats: M, anchors, wings: [WR, WL], hinges};
}
