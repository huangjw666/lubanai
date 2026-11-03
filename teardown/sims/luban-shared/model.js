// 鲁班木鹊 geometry, built from code in metres. Forward is +x, up +y, the right wing +z.
// Every wing dimension comes from bird.js (the same planform the area, the solar power and the mass read).
import * as THREE from 'three';
import {CG_X, chordAt, leAt, riseAt, W} from './bird.js';

const V3 = THREE.Vector3;
export const COL = {
  bg: '#efe6d6',
  balsa: '#e6cb98',
  bamboo: '#c79a3c',
  bambooDark: '#8f6a22',
  ink: '#2b2118',
  accent: '#d9482b',
  film: '#fffaf0',
  pcb: '#2f6b4f',
};

// ------------------------------------------------------------ airfoil (NACA-style 4 digit, 8 % thick, 4 % camber)
const yt = (x, t = 0.08) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
const yc = (x, m = 0.04, p = 0.4) => (x < p ? (m / (p * p)) * (2 * p * x - x * x) : (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x * x));
const upper = (x) => yc(x) + yt(x);
const lower = (x) => yc(x) - yt(x);
const cosx = (i, n) => 0.5 - 0.5 * Math.cos((Math.PI * i) / n);

/** a point on the wing: span fraction s (0 root..1 tip), chord fraction xc, height yv (in chords), side +1 right / -1 left */
export function wingPoint(s, xc, yv, side, out = new V3()) {
  const c = chordAt(s);
  const rise = riseAt(s);
  const dRise = riseAt(Math.min(1, s + 0.001)) - riseAt(Math.max(0, s - 0.001));
  const ang = Math.atan2(dRise, 0.002 * W.half); // slope of the span line
  const dy = yv * c;
  // the section stands normal to the span line: rotate its up axis about x
  return out.set(leAt(s) - xc * c, rise + dy * Math.cos(ang), side * (s * W.half - dy * Math.sin(ang)));
}

function material(color, o = {}) {
  return new THREE.MeshStandardMaterial({color, roughness: 0.6, metalness: 0, ...o});
}

function bambooTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = '#d3a748';
  g.fillRect(0, 0, 256, 16);
  for (let i = 0; i < 6; i++) {
    const x = 20 + i * 42 + (i % 2) * 6;
    g.fillStyle = '#8f6a22';
    g.fillRect(x, 0, 4, 16);
    g.fillStyle = 'rgba(255,255,255,.18)';
    g.fillRect(x + 6, 0, 2, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function cellTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#c9d2dc';
  g.fillRect(0, 0, 128, 128);
  const grad = g.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, '#1d3a66');
  grad.addColorStop(1, '#14284a');
  g.fillStyle = grad;
  g.fillRect(3, 3, 122, 122);
  g.fillStyle = '#9fb2c8';
  for (const x of [34, 64, 94]) g.fillRect(x - 1, 3, 2, 122);
  g.fillStyle = 'rgba(255,255,255,.06)';
  for (let y = 8; y < 128; y += 6) g.fillRect(3, y, 122, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// ------------------------------------------------------------ one wing
function buildWing(side, mats) {
  const g = new THREE.Group();
  const NS = 22;
  const NP = 18;
  // skin surfaces as lofts
  const loft = (surf, x0, x1, uvScale) => {
    const pos = [];
    const uv = [];
    const idx = [];
    for (let i = 0; i <= NS; i++) {
      const s = (i / NS) * 0.985;
      for (let j = 0; j <= NP; j++) {
        const xc = x0 + (x1 - x0) * cosx(j, NP);
        const yv = surf(xc);
        const p = wingPoint(s, xc, yv, side);
        // lift the solar layer a hair off the film
        pos.push(p.x, p.y + (surf === upper ? 0.0016 : 0), p.z);
        uv.push(j / NP, s * uvScale);
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
  film.add(new THREE.Mesh(loft(upper, 0, 1, 1), mats.film));
  film.add(new THREE.Mesh(loft(lower, 0, 1, 1), mats.film));
  film.children.forEach((m) => (m.castShadow = true));
  const solar = new THREE.Mesh(loft(upper, W.cell0, W.cell1, 6), mats.solar);
  g.add(film, solar);

  // ribs: thin balsa plates with lightening holes, one per station, standing normal to the span line
  const ribs = new THREE.Group();
  const NR = 11;
  for (let i = 0; i < NR; i++) {
    const s = (i / (NR - 1)) * 0.96;
    const c = chordAt(s);
    const sh = new THREE.Shape();
    const N = 22;
    for (let k = 0; k <= N; k++) {
      const xc = cosx(k, N);
      const p = [-xc * c, upper(xc) * c];
      k ? sh.lineTo(...p) : sh.moveTo(...p);
    }
    for (let k = N - 1; k >= 0; k--) {
      const xc = cosx(k, N);
      sh.lineTo(-xc * c, lower(xc) * c);
    }
    for (const [hx, hr] of [[0.55, 0.026], [0.74, 0.02]]) {
      const hole = new THREE.Path();
      hole.absarc(-hx * c, yc(hx) * c, hr * c * 3.2, 0, Math.PI * 2, true);
      sh.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.0028, bevelEnabled: false});
    geo.translate(0, 0, -0.0014);
    const m = new THREE.Mesh(geo, mats.balsa);
    const a = wingPoint(s, 0, 0, side);
    m.position.copy(a);
    const dRise = riseAt(Math.min(1, s + 0.001)) - riseAt(Math.max(0, s - 0.001));
    m.rotation.x = -side * Math.atan2(dRise, 0.002 * W.half);
    m.castShadow = true;
    ribs.add(m);
  }
  g.add(ribs);

  // spar (bamboo, at 28 % chord), leading edge strip, trailing edge strip
  const tube = (xc, yv, r, mat, s1 = 0.985) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) pts.push(wingPoint((i / 24) * s1, xc, yv, side));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 8, false), mat);
    m.castShadow = true;
    return m;
  };
  const frame = new THREE.Group();
  const spar = tube(0.28, yc(0.28), 0.0068, mats.bamboo);
  frame.add(spar, tube(0.004, 0, 0.0052, mats.bamboo), tube(0.995, 0, 0.0034, mats.balsa), tube(0.62, yc(0.62), 0.0034, mats.bamboo));
  g.add(frame);
  g.userData = {film, solar, ribs, frame, spar};
  return g;
}

// ------------------------------------------------------------ the whole bird
export function buildBird() {
  const mats = {
    balsa: material(COL.balsa, {roughness: 0.75}),
    bamboo: material('#ffffff', {roughness: 0.5, map: bambooTexture()}),
    film: material(COL.film, {transparent: true, opacity: 0.34, side: THREE.DoubleSide, roughness: 0.35, depthWrite: false}),
    solar: material('#ffffff', {map: cellTexture(), roughness: 0.28, metalness: 0.25, transparent: true, side: THREE.DoubleSide, emissive: '#1d4ed8', emissiveIntensity: 0}),
    shell: material('#e9d3a2', {roughness: 0.6, transparent: true, opacity: 1, side: THREE.DoubleSide}),
    ink: material(COL.ink, {roughness: 0.5}),
    accent: material(COL.accent, {roughness: 0.4, emissive: COL.accent, emissiveIntensity: 0}),
    pcb: material(COL.pcb, {roughness: 0.5}),
    metal: material('#8a8d92', {roughness: 0.35, metalness: 0.8}),
    battery: material('#2f4f87', {roughness: 0.45}),
    glass: material('#0b1220', {roughness: 0.1, metalness: 0.4}),
    prop: material('#2a2a2a', {roughness: 0.5}),
    motorGlow: material(COL.accent, {roughness: 0.4, emissive: COL.accent, emissiveIntensity: 0}),
  };
  mats.bamboo.map.repeat.set(3, 1);
  const root = new THREE.Group();
  const parts = {};
  const part = (name, dir, dist) => {
    const g = new THREE.Group();
    g.userData = {dir: new V3(...dir), dist};
    parts[name] = g;
    root.add(g);
    return g;
  };
  const anchors = {};
  const anchor = (parent, id, x, y, z) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    anchors[id] = o;
  };

  // wings
  const wr = part('wingR', [0, 0.1, 1], 0.5);
  const wl = part('wingL', [0, 0.1, -1], 0.5);
  const WR = buildWing(1, mats);
  const WL = buildWing(-1, mats);
  wr.add(WR);
  wl.add(WL);
  anchor(wr, 'spar', leAt(0.4) - 0.28 * chordAt(0.4), yc(0.28) * chordAt(0.4) + riseAt(0.4), 0.4 * W.half);
  anchor(wr, 'solar', leAt(0.62) - 0.5 * chordAt(0.62), upper(0.5) * chordAt(0.62) + riseAt(0.62) + 0.01, 0.62 * W.half);
  anchor(wl, 'rib', leAt(0.5) - 0.55 * chordAt(0.5), riseAt(0.5), -0.5 * W.half);

  // body: a lathed goose torso with bamboo hoops and a keel
  const body = part('body', [0, -1, 0], 0.26);
  const R0 = 0.072;
  const prof = [];
  const X0 = 0.28;
  const X1 = -0.4;
  const rAt = (x) => {
    const u = (X0 - x) / (X0 - X1);
    return R0 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.78)), 0.8) + 0.002;
  };
  for (let i = 0; i <= 28; i++) {
    const x = X0 + (X1 - X0) * (i / 28);
    prof.push(new THREE.Vector2(rAt(x), x));
  }
  const bodyGeo = new THREE.LatheGeometry(prof, 28);
  bodyGeo.rotateZ(-Math.PI / 2); // lathe axis y -> x
  const shell = new THREE.Mesh(bodyGeo, mats.shell);
  shell.scale.set(1, 0.92, 1);
  shell.castShadow = true;
  body.add(shell);
  const hoops = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const x = 0.2 - i * 0.085;
    const r = rAt(x) * 0.97;
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0032, 6, 28), mats.bamboo);
    t.rotation.y = Math.PI / 2;
    t.position.x = x;
    t.scale.set(1, 0.92, 1);
    hoops.add(t);
  }
  const keelPts = [];
  for (let i = 0; i <= 12; i++) {
    const x = 0.26 - (i / 12) * 0.62;
    keelPts.push(new V3(x, -rAt(x) * 0.9, 0));
  }
  hoops.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(keelPts), 24, 0.0045, 6), mats.bamboo));
  body.add(hoops);
  anchor(body, 'hoop', -0.03, rAt(-0.03) * 0.9, 0.0);

  // head, neck, beak and the thumb camera
  const head = part('head', [1, 0.35, 0], 0.32);
  const neck = new THREE.CatmullRomCurve3([new V3(0.22, 0.02, 0), new V3(0.32, 0.07, 0), new V3(0.37, 0.15, 0), new V3(0.43, 0.2, 0)]);
  const neckM = new THREE.Mesh(new THREE.TubeGeometry(neck, 20, 0.024, 12), mats.shell);
  neckM.castShadow = true;
  head.add(neckM);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.033, 20, 14), mats.shell);
  skull.scale.set(1.35, 1, 1);
  skull.position.set(0.455, 0.205, 0);
  skull.castShadow = true;
  head.add(skull);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.0125, 0.075, 12), mats.accent);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.52, 0.2, 0);
  head.add(beak);
  for (const z of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 8, 6), mats.ink);
    eye.position.set(0.47, 0.215, z * 0.027);
    head.add(eye);
  }
  const cam = new THREE.Group();
  cam.position.set(0.443, 0.246, 0);
  const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.022), mats.ink);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.01, 16), mats.glass);
  lens.rotation.z = Math.PI / 2;
  lens.position.x = 0.018;
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 8, 6), mats.accent);
  led.position.set(0.002, 0.012, 0);
  cam.add(camBody, lens, led);
  head.add(cam);
  anchor(head, 'cam', 0.46, 0.25, 0);

  // tail boom and V-tail with ruddervators
  const tail = part('tail', [-1, 0.2, 0], 0.4);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.011, 0.34, 10), mats.bamboo);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(-0.55, 0.0, 0);
  boom.castShadow = true;
  tail.add(boom);
  const rudders = [];
  const poly = (pts) => {
    const sh = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    return new THREE.ShapeGeometry(sh);
  };
  const finGeo = poly([[0.03, 0], [-0.055, 0], [-0.055, 0.21], [-0.004, 0.21]]);
  const rudGeo = poly([[0, 0], [-0.05, 0.004], [-0.04, 0.21], [0, 0.21]]);
  for (const side of [1, -1]) {
    // each panel: span along local +y, 40° above the horizontal, spread to its side
    const v = new THREE.Group();
    v.position.set(-0.68, 0.0, 0);
    v.rotation.x = side * (Math.PI / 2 - 0.7);
    const fin = new THREE.Mesh(finGeo, mats.shell);
    const hinge = new THREE.Group();
    hinge.position.set(-0.055, 0, 0);
    const rud = new THREE.Mesh(rudGeo, mats.shell);
    hinge.add(rud);
    const stay = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.21, 6), mats.bamboo);
    stay.position.set(0.026, 0.105, 0);
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.21, 6), mats.bamboo);
    edge.position.set(-0.05, 0.105, 0);
    hinge.add(edge);
    v.add(fin, hinge, stay);
    rudders.push({hinge, side});
    tail.add(v);
  }
  for (const side of [1, -1]) {
    const servo = new THREE.Mesh(new THREE.BoxGeometry(0.023, 0.012, 0.0085), mats.ink);
    servo.position.set(-0.64, 0.002, side * 0.014);
    tail.add(servo);
  }
  anchor(tail, 'tail', -0.74, 0.07, 0.06);

  // electronics inside the belly
  const elec = part('elec', [0, 1, 0], 0.42);
  const bat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.024, 0.036), mats.battery);
  bat.position.set(0.14, -0.012, 0);
  const batBand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.0252, 0.0372), mats.accent);
  batBand.position.set(0.14, -0.012, 0);
  const fc = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.004, 0.036), mats.pcb);
  fc.position.set(0.065, 0.004, 0);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.003, 0.01), mats.ink);
  chip.position.set(0.065, 0.0085, 0);
  const mppt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.03), mats.pcb);
  mppt.position.set(0.0, 0.004, 0);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.0075, 0.003, 6, 14), mats.metal);
  coil.rotation.x = Math.PI / 2;
  coil.position.set(0.008, 0.011, 0);
  const esc = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.007, 0.018), mats.ink);
  esc.position.set(-0.07, 0.01, 0);
  elec.add(bat, batBand, fc, chip, mppt, coil, esc);
  anchor(elec, 'battery', 0.14, 0.0, 0.02);
  anchor(elec, 'fc', 0.065, 0.01, -0.016);
  anchor(elec, 'mppt', 0.0, 0.01, 0.02);

  // motor on a pylon above the wing, folding prop behind it
  const motor = part('motor', [0, 1, 0], 0.55);
  const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.012), mats.balsa);
  pylon.position.set(-0.035, 0.1, 0);
  pylon.castShadow = true;
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.03, 16), mats.metal);
  can.rotation.z = Math.PI / 2;
  can.position.set(-0.075, 0.155, 0);
  const hub = new THREE.Group();
  hub.position.set(-0.098, 0.155, 0);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.02, 14), mats.motorGlow);
  cone.rotation.z = Math.PI / 2;
  cone.position.x = -0.01;
  hub.add(cone);
  const blades = [];
  for (const k of [0, 1]) {
    const pivot = new THREE.Group();
    pivot.rotation.x = k * Math.PI;
    const fold = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.078, 0.014), mats.prop);
    blade.position.y = 0.039 + 0.006;
    blade.rotation.y = 0.35;
    fold.add(blade);
    pivot.add(fold);
    hub.add(pivot);
    blades.push(fold);
  }
  motor.add(pylon, can, hub);
  anchor(motor, 'motor', -0.09, 0.19, 0.0);

  // centre of gravity marker
  const cg = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.0035, 8, 28), mats.accent);
  ring.rotation.y = Math.PI / 2;
  cg.add(ring);
  cg.position.set(CG_X, 0.0, 0);
  const cgGroup = part('cg', [0, 0, 0], 0);
  cgGroup.add(cg);
  anchor(cgGroup, 'cg', CG_X, 0.03, 0);

  // shadow-casting setup
  root.traverse((o) => {
    if (o.isMesh && o.material !== mats.film) o.castShadow = true;
  });

  const wp = new V3();
  const world = (id) => anchors[id].getWorldPosition(wp).clone();
  const TMP = new V3();

  /**
   * Pose the bird: view = {explode 0..1, skin 0..1, xray 0..1, motor 0..1 fold, spin rad, elev, rud, glow:{solar,motor}}
   */
  function pose(v) {
    for (const name in parts) {
      const g = parts[name];
      g.position.copy(TMP.copy(g.userData.dir).multiplyScalar(g.userData.dist * v.explode));
    }
    mats.film.opacity = 0.34 * v.skin;
    mats.solar.opacity = v.skin;
    mats.solar.visible = v.skin > 0.02;
    mats.film.visible = v.skin > 0.02;
    mats.shell.opacity = (1 - 0.88 * v.xray) * Math.max(0.35, v.skin);
    mats.shell.depthWrite = v.xray < 0.5;
    mats.solar.emissiveIntensity = v.glow.solar;
    mats.accent.emissiveIntensity = 0.0;
    cgGroup.visible = v.cg > 0.02;
    cgGroup.scale.setScalar(0.4 + 0.6 * v.cg);
    // folding prop: unfolded (0) when spinning, laid back along the pylon (1.3 rad) when off
    const fold = (1 - v.motor) * 1.42;
    for (const b of blades) b.rotation.z = fold;
    hub.rotation.x = v.spin;
    // the hinge line is the span (local y): elevator moves both trailing edges up or down, rudder moves both sideways
    for (const r of rudders) r.hinge.rotation.y = -r.side * v.elev + v.rud;
    mats.motorGlow.emissiveIntensity = v.glow.motor;
  }
  return {root, parts, pose, world, mats, anchors, wings: [WR, WL], rudders};
}
