// A small self-contained 3D scene drawn on a 2D canvas: an original low-poly
// sports coupe on a turntable, turning a full 360 while it is foamed, rinsed
// and left sparkling. No 3D library is needed.

type Vec = [number, number, number];
type Face = { points: Vec[]; side?: number; kind: "paint" | "glass" | "dark" | "tire" | "rim" | "light" | "tail" };
type Projected = { x: number; y: number; depth: number };

const CYCLE = 12; // seconds: foam, rinse, shine
const SPIN = 16; // seconds per full turn
const CAMERA_DISTANCE = 8.4;
const PITCH = 0.3;
const LIGHT: Vec = normalize([-0.45, 0.8, 0.55]);

function normalize(v: Vec): Vec {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

// Deterministic pseudo-random numbers so the scene looks the same every visit.
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Body cross-sections from nose to tail:
// [x, half width, floor, shoulder height, roof height, roof half width]
const STATIONS: number[][] = [
  [-2.12, 0.62, 0.3, 0.5, 0.52, 0.5],
  [-1.92, 0.84, 0.24, 0.57, 0.61, 0.66],
  [-1.3, 0.92, 0.22, 0.65, 0.71, 0.7],
  [-0.62, 0.94, 0.22, 0.72, 0.78, 0.72],
  [-0.05, 0.94, 0.22, 0.76, 1.15, 0.6],
  [0.5, 0.94, 0.22, 0.78, 1.18, 0.62],
  [1.25, 0.95, 0.22, 0.81, 0.97, 0.66],
  [1.8, 0.92, 0.24, 0.8, 0.84, 0.7],
  [2.12, 0.76, 0.32, 0.7, 0.72, 0.58],
];
const GLASS_FROM = 3; // station intervals 3..5 carry the cabin glass
const GLASS_TO = 5;

function ring(station: number[]): Vec[] {
  const [x, w, floor, shoulder, roof, roofW] = station;
  const crown = roof + 0.035;
  return [
    [x, floor, w * 0.86], [x, floor + 0.13, w], [x, shoulder, w], [x, roof, roofW], [x, crown, 0],
    [x, roof, -roofW], [x, shoulder, -w], [x, floor + 0.13, -w], [x, floor, -w * 0.86],
  ];
}

function buildCar(): Face[] {
  const faces: Face[] = [];
  const rings = STATIONS.map(ring);
  for (let s = 0; s < rings.length - 1; s += 1) {
    const a = rings[s];
    const b = rings[s + 1];
    const cabin = s >= GLASS_FROM && s <= GLASS_TO;
    for (let i = 0; i < a.length - 1; i += 1) {
      const isSideWindow = cabin && (i === 2 || i === 5);
      const isScreen = (s === GLASS_FROM || s === GLASS_TO) && (i === 3 || i === 4);
      faces.push({ points: [a[i], a[i + 1], b[i + 1], b[i]], kind: isSideWindow || isScreen ? "glass" : "paint" });
    }
    faces.push({ points: [a[0], b[0], b[8], a[8]], kind: "dark" });
  }
  const nose = rings[0];
  const tail = rings[rings.length - 1];
  faces.push({ points: [...nose].reverse(), kind: "paint" });
  faces.push({ points: [...tail], kind: "paint" });
  // Headlights and a full-width tail light, set just proud of the bodywork.
  for (const side of [1, -1]) {
    faces.push({ points: [[-2.13, 0.43, side * 0.3], [-2.13, 0.5, side * 0.3], [-2.13, 0.5, side * 0.56], [-2.13, 0.43, side * 0.56]], kind: "light" });
  }
  faces.push({ points: [[2.13, 0.58, -0.6], [2.13, 0.65, -0.6], [2.13, 0.65, 0.6], [2.13, 0.58, 0.6]], kind: "tail" });

  // Wheels: a tread band, an outer tire face and a rim disc.
  const segments = 14;
  for (const wheelX of [-1.32, 1.36]) {
    for (const side of [1, -1]) {
      const inner = side * 0.74;
      const outer = side * 0.99;
      const radius = 0.36;
      const circle = (r: number, z: number): Vec[] => Array.from({ length: segments }, (_, k) => {
        const angle = (k / segments) * Math.PI * 2;
        return [wheelX + Math.cos(angle) * r, 0.36 + Math.sin(angle) * r, z] as Vec;
      });
      const outerRing = circle(radius, outer);
      const innerRing = circle(radius, inner);
      for (let k = 0; k < segments; k += 1) {
        const next = (k + 1) % segments;
        faces.push({ points: [outerRing[k], outerRing[next], innerRing[next], innerRing[k]], kind: "tire", side });
      }
      faces.push({ points: outerRing, kind: "tire", side });
      faces.push({ points: circle(0.23, outer + side * 0.012), kind: "rim", side });
    }
  }
  return faces;
}

const BASE_COLORS: Record<Face["kind"], [number, number, number]> = {
  paint: [214, 176, 104],
  glass: [38, 52, 66],
  dark: [14, 14, 14],
  tire: [26, 26, 28],
  rim: [196, 198, 204],
  light: [255, 244, 214],
  tail: [214, 52, 46],
};

export type CarWashScene = { start: () => void; stop: () => void; drawStill: () => void; drawAt: (seconds: number) => void; resize: () => void };

export function createCarWashScene(canvas: HTMLCanvasElement, onPhase?: (phase: number) => void): CarWashScene {
  const context = canvas.getContext("2d");
  const faces = buildCar();
  const random = makeRandom(7);

  // Spots on the bodywork where foam gathers and where sparkles appear.
  const bodyFaces = faces.filter((face) => face.kind === "paint" || face.kind === "glass");
  const anchors = Array.from({ length: 70 }, () => {
    const face = bodyFaces[Math.floor(random() * bodyFaces.length)];
    const u = random();
    const v = random();
    const [a, b, c, d] = face.points.length >= 4 ? face.points : [face.points[0], face.points[1], face.points[2], face.points[2]];
    const point: Vec = [0, 1, 2].map((axis) => (a[axis] * (1 - u) + d[axis] * u) * (1 - v) + (b[axis] * (1 - u) + c[axis] * u) * v) as Vec;
    return { point, size: 0.5 + random() * 0.9, delay: random(), twinkle: random() * Math.PI * 2 };
  });
  const bubbles = Array.from({ length: 46 }, () => ({
    angle: random() * Math.PI * 2, radius: 0.5 + random() * 2.3, life: 4 + random() * 4, offset: random() * 8,
    size: 0.05 + random() * 0.1, wobble: random() * Math.PI * 2,
  }));
  const streaks = Array.from({ length: 70 }, () => ({
    angle: random() * Math.PI * 2, radius: random() * 2.3, speed: 2.6 + random() * 1.6, offset: random() * 3,
  }));

  let width = 0;
  let height = 0;
  let frame = 0;
  let running = false;
  let startedAt = 0;
  let lastPhase = -1;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const draw = (time: number) => {
    if (!context || width < 2) return;
    const focal = Math.min(width * 1.2, height * 1.85);
    const centerX = width / 2;
    const centerY = height * 0.56;
    const turn = (time / SPIN) * Math.PI * 2 + 0.7;
    const cosTurn = Math.cos(turn);
    const sinTurn = Math.sin(turn);
    const cosPitch = Math.cos(PITCH);
    const sinPitch = Math.sin(PITCH);

    const spin = (p: Vec): Vec => [p[0] * cosTurn + p[2] * sinTurn, p[1], -p[0] * sinTurn + p[2] * cosTurn];
    const project = (p: Vec): Projected => {
      const y = (p[1] - 0.55) * cosPitch - p[2] * sinPitch;
      const z = (p[1] - 0.55) * sinPitch + p[2] * cosPitch;
      const depth = CAMERA_DISTANCE - z;
      return { x: centerX + (focal * p[0]) / depth, y: centerY - (focal * y) / depth, depth };
    };

    const cycle = (time % CYCLE) / CYCLE;
    const phase = cycle < 0.42 ? 0 : cycle < 0.7 ? 1 : 2;
    if (phase !== lastPhase) { lastPhase = phase; onPhase?.(phase); }
    const foamLevel = (delay: number) => smooth((cycle - delay * 0.16) / 0.14) * (1 - smooth((cycle - 0.46 - delay * 0.16) / 0.12));
    const rinse = smooth((cycle - 0.42) / 0.05) * (1 - smooth((cycle - 0.68) / 0.05));
    const shine = smooth((cycle - 0.7) / 0.06) * (1 - smooth((cycle - 0.95) / 0.05));
    const bubbleLevel = 0.3 + 0.7 * (1 - smooth((cycle - 0.5) / 0.15)) + 0.7 * smooth((cycle - 0.97) / 0.03);

    context.clearRect(0, 0, width, height);

    // Turntable.
    const disc = Array.from({ length: 56 }, (_, k) => {
      const angle = (k / 56) * Math.PI * 2;
      return project([Math.cos(angle) * 2.55, 0, Math.sin(angle) * 2.55]);
    });
    const tracePath = (points: Projected[]) => {
      context.beginPath();
      points.forEach((p, index) => (index ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y)));
      context.closePath();
    };
    const discCenter = project([0, 0, 0]);
    const discRadius = Math.abs(disc[0].x - discCenter.x);
    const floor = context.createRadialGradient(discCenter.x, discCenter.y, discRadius * 0.1, discCenter.x, discCenter.y, discRadius);
    floor.addColorStop(0, `rgba(${70 + rinse * 20}, ${72 + rinse * 34}, ${78 + rinse * 50}, 0.95)`);
    floor.addColorStop(1, "rgba(22, 22, 24, 0.95)");
    tracePath(disc);
    context.fillStyle = floor;
    context.fill();
    context.strokeStyle = "rgba(214, 183, 121, 0.55)";
    context.lineWidth = 1.5;
    context.stroke();
    // Soft shadow under the car.
    for (const [scale, alpha] of [[1.08, 0.16], [0.98, 0.2], [0.88, 0.26]]) {
      tracePath(Array.from({ length: 28 }, (_, k) => {
        const angle = (k / 28) * Math.PI * 2;
        return project(spin([Math.cos(angle) * 2.2 * scale, 0, Math.sin(angle) * 1.02 * scale]));
      }));
      context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      context.fill();
    }

    const drawBubble = (p: Projected, size: number, alpha: number) => {
      const r = Math.max(1.2, (focal * size) / p.depth);
      context.beginPath();
      context.arc(p.x, p.y, r, 0, Math.PI * 2);
      context.fillStyle = `rgba(190, 225, 255, ${0.1 * alpha})`;
      context.fill();
      context.strokeStyle = `rgba(235, 246, 255, ${0.75 * alpha})`;
      context.lineWidth = Math.max(0.8, r * 0.14);
      context.stroke();
      context.beginPath();
      context.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.22, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${0.85 * alpha})`;
      context.fill();
    };
    const bubblePoints = bubbles.map((bubble) => {
      const progress = ((time + bubble.offset) % bubble.life) / bubble.life;
      const sway = Math.sin(time * 1.3 + bubble.wobble) * 0.12;
      const world: Vec = [Math.cos(bubble.angle) * bubble.radius + sway, 0.25 + progress * 2.6, Math.sin(bubble.angle) * bubble.radius];
      const fade = Math.sin(progress * Math.PI);
      return { world, projected: project(world), size: bubble.size * (0.7 + progress * 0.6), alpha: fade * bubbleLevel };
    });
    bubblePoints.filter((b) => b.world[2] < 0).forEach((b) => drawBubble(b.projected, b.size, b.alpha));

    // The car, painted back to front.
    const drawn = faces.map((face) => {
      const world = face.points.map(spin);
      const projected = world.map(project);
      const center: Vec = [0, 1, 2].map((axis) => world.reduce((sum, p) => sum + p[axis], 0) / world.length) as Vec;
      let normal = normalize(cross(sub(world[1], world[0]), sub(world[2], world[0])));
      if (dot(normal, sub(center, [0, 0.55, 0])) < 0) normal = [-normal[0], -normal[1], -normal[2]];
      const depth = projected.reduce((sum, p) => sum + p.depth, 0) / projected.length;
      // Wheels on the far side go down first and near-side wheels last, so
      // they never poke through the bodywork.
      const layer = face.side ? (face.side * cosTurn > 0 ? 2 : 0) : 1;
      return { face, projected, normal, depth, layer };
    }).sort((a, b) => a.layer - b.layer || b.depth - a.depth);

    for (const item of drawn) {
      const base = BASE_COLORS[item.face.kind];
      const diffuse = Math.max(0, dot(item.normal, LIGHT));
      const half = normalize([LIGHT[0], LIGHT[1] + sinPitch, LIGHT[2] + cosPitch]);
      const gloss = item.face.kind === "tire" || item.face.kind === "dark" ? 0 : Math.pow(Math.max(0, dot(item.normal, half)), 18);
      const lit = item.face.kind === "light" || item.face.kind === "tail" ? 1 : 0.42 + 0.62 * diffuse;
      const boost = gloss * (item.face.kind === "glass" ? 150 : 95) * (0.75 + shine * 0.6);
      const wet = item.face.kind === "paint" ? rinse * 10 : 0;
      const color = base.map((channel, index) => Math.round(Math.min(255, channel * lit + boost + (index === 2 ? wet : 0))));
      tracePath(item.projected);
      context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      context.fill();
      context.strokeStyle = context.fillStyle;
      context.lineWidth = 0.8;
      context.stroke();
    }

    // Foam and sparkles sit on the surfaces that face the viewer.
    for (const anchor of anchors) {
      const world = spin(anchor.point);
      const outward = normalize(sub(world, [world[0] * 0.5, 0.45, 0]));
      const facing = outward[1] * sinPitch + outward[2] * cosPitch;
      if (facing < 0.12) continue;
      const p = project(world);
      const level = foamLevel(anchor.delay);
      if (level > 0.02) {
        const r = (focal * 0.11 * anchor.size * level) / p.depth;
        const drip = rinse * anchor.delay * r * 2.4;
        context.fillStyle = `rgba(255, 255, 255, ${0.92 * Math.min(1, level * 1.4)})`;
        for (const [dx, dy, scale] of [[0, 0, 1], [0.8, 0.2, 0.7], [-0.75, 0.25, 0.72], [0.15, -0.55, 0.62]]) {
          context.beginPath();
          context.arc(p.x + dx * r, p.y + dy * r + drip, r * scale, 0, Math.PI * 2);
          context.fill();
        }
      }
      if (shine > 0.02 && anchor.delay > 0.55) {
        const pulse = Math.max(0, Math.sin(time * 3.2 + anchor.twinkle)) * shine;
        const r = (focal * 0.13 * pulse) / p.depth;
        if (r > 0.6) {
          context.fillStyle = `rgba(255, 250, 232, ${0.95 * pulse})`;
          context.beginPath();
          context.moveTo(p.x, p.y - r);
          context.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
          context.quadraticCurveTo(p.x, p.y, p.x, p.y + r);
          context.quadraticCurveTo(p.x, p.y, p.x - r, p.y);
          context.quadraticCurveTo(p.x, p.y, p.x, p.y - r);
          context.fill();
        }
      }
    }

    // Rinse water falling across the car.
    if (rinse > 0.02) {
      context.lineCap = "round";
      for (const streak of streaks) {
        const fall = ((time * streak.speed + streak.offset) % 3) / 3;
        const x = Math.cos(streak.angle) * streak.radius;
        const z = Math.sin(streak.angle) * streak.radius;
        const top = project([x, 3.1 - fall * 3.1, z]);
        const bottom = project([x + 0.03, 3.1 - fall * 3.1 - 0.3, z]);
        context.strokeStyle = `rgba(170, 215, 255, ${0.55 * rinse * (1 - fall * 0.5)})`;
        context.lineWidth = Math.max(1, (focal * 0.018) / top.depth);
        context.beginPath();
        context.moveTo(top.x, top.y);
        context.lineTo(bottom.x, bottom.y);
        context.stroke();
      }
    }

    bubblePoints.filter((b) => b.world[2] >= 0).forEach((b) => drawBubble(b.projected, b.size, b.alpha));
  };

  const loop = (now: number) => {
    if (!running) return;
    draw((now - startedAt) / 1000);
    frame = requestAnimationFrame(loop);
  };

  return {
    resize,
    start: () => {
      if (running) return;
      running = true;
      if (!startedAt) startedAt = performance.now();
      frame = requestAnimationFrame(loop);
    },
    stop: () => { running = false; cancelAnimationFrame(frame); },
    drawStill: () => draw(CYCLE * 0.82),
    drawAt: draw,
  };
}
