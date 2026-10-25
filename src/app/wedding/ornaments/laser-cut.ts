/**
 * Laser-cut geometry (cắt laser).
 *
 * Every shape is ONE SVG path drawn with `fill-rule="evenodd"`: the first
 * subpath is the paper sheet and every further subpath is a cut-out — the
 * same model as a laser cutter's vector file. Under evenodd two overlapping
 * cut-outs would cancel back into paper, so motifs are placed on fixed
 * stations that never collide (laser-cut.spec.ts verifies this via each
 * motif's bounding capsule).
 *
 * Sheets use the card's design space (400 × 560, see `.card-frame` in
 * wedding-theme.css); the doily crest uses a 100 × 100 box. Paths are built
 * once at module load — the gallery renders them as static strings.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Conservative bound of one decorative cut-out: every point within `radius`
 * of the segment a→b (a capsule; a === b for round motifs).
 */
export interface MotifBound {
  a: Point;
  b: Point;
  radius: number;
}

export interface LaserShape {
  viewBox: string;
  /** Sheet outline followed by every cut-out; render with fill-rule="evenodd". */
  d: string;
  /** Decorative cut-outs (excludes the sheet, the window and edge bites). */
  motifs: MotifBound[];
}

export type LaserShapeKey = 'lace' | 'arch' | 'lattice' | 'doily';

export const CARD_W = 400;
export const CARD_H = 560;

/** laserLace: window inset from the card edge (scallops bulge further in). */
export const LACE_WINDOW_INSET = 32;
/** laserLattice: window inset from the card edge. */
export const LATTICE_WINDOW_INSET = 36;
/** laserArch: arched window — straight sides from `spring` down to `base`. */
export const ARCH_WINDOW = { left: 36, right: 364, centerX: 200, spring: 206, radius: 164, base: 528 } as const;

// ── path primitives ─────────────────────────────────────────────────────────

/** Round to 0.01 to keep the path strings compact. */
function n(value: number): number {
  return Math.round(value * 100) / 100;
}

function moveTo(p: Point): string {
  return `M${n(p.x)} ${n(p.y)}`;
}

function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;
}

function circlePath(c: Point, r: number): string {
  const rr = n(r);
  return `M${n(c.x - r)} ${n(c.y)}a${rr} ${rr} 0 1 0 ${n(2 * r)} 0a${rr} ${rr} 0 1 0 ${n(-2 * r)} 0Z`;
}

/** Lens ("mắt lá") of length `len` and max width `width`, its long axis at `angle` (rad). */
function leafPath(c: Point, len: number, width: number, angle: number): string {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  // A quadratic control point `width` off the chord bulges the curve by width / 2.
  const nx = -uy * width;
  const ny = ux * width;
  const a = { x: c.x - (ux * len) / 2, y: c.y - (uy * len) / 2 };
  const b = { x: c.x + (ux * len) / 2, y: c.y + (uy * len) / 2 };
  return (
    `${moveTo(a)}Q${n(c.x + nx)} ${n(c.y + ny)} ${n(b.x)} ${n(b.y)}` +
    `Q${n(c.x - nx)} ${n(c.y - ny)} ${n(a.x)} ${n(a.y)}Z`
  );
}

/** Axis-aligned diamond with half-diagonal `h`. */
function diamondPath(c: Point, h: number): string {
  return `M${n(c.x)} ${n(c.y - h)}L${n(c.x + h)} ${n(c.y)}L${n(c.x)} ${n(c.y + h)}L${n(c.x - h)} ${n(c.y)}Z`;
}

/**
 * Closed outline through `points` (listed clockwise on screen) where every
 * edge is a semicircular scallop. Scallops bulge into the enclosed area by
 * default (lace edging around a window); `outward` flips them (doily rim).
 */
function scallopLoop(points: Point[], outward = false): string {
  const sweep = outward ? 1 : 0;
  let d = moveTo(points[0]);
  for (let i = 1; i <= points.length; i++) {
    const prev = points[i - 1];
    const next = points[i % points.length];
    const r = n(Math.hypot(next.x - prev.x, next.y - prev.y) / 2);
    d += `A${r} ${r} 0 0 ${sweep} ${n(next.x)} ${n(next.y)}`;
  }
  return `${d}Z`;
}

// ── composite paths (lines + circular arcs) ─────────────────────────────────

type Segment =
  | { kind: 'line'; from: Point; to: Point }
  /** Angles in radians, screen coordinates; start < end runs clockwise. */
  | { kind: 'arc'; center: Point; radius: number; start: number; end: number };

interface Station {
  point: Point;
  /** Tangent direction (rad) of the path at this point. */
  angle: number;
}

function segmentLength(seg: Segment): number {
  return seg.kind === 'line'
    ? Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y)
    : seg.radius * Math.abs(seg.end - seg.start);
}

function stationAt(seg: Segment, t: number): Station {
  if (seg.kind === 'line') {
    return {
      point: { x: seg.from.x + (seg.to.x - seg.from.x) * t, y: seg.from.y + (seg.to.y - seg.from.y) * t },
      angle: Math.atan2(seg.to.y - seg.from.y, seg.to.x - seg.from.x),
    };
  }
  const theta = seg.start + (seg.end - seg.start) * t;
  return {
    point: { x: seg.center.x + seg.radius * Math.cos(theta), y: seg.center.y + seg.radius * Math.sin(theta) },
    angle: theta + (seg.end > seg.start ? Math.PI / 2 : -Math.PI / 2),
  };
}

/** Vertices every ≈`pitch` along a closed loop of segments (each segment's start included). */
function divideLoop(segments: Segment[], pitch: number): Point[] {
  const points: Point[] = [];
  for (const seg of segments) {
    const steps = Math.max(1, Math.round(segmentLength(seg) / pitch));
    for (let i = 0; i < steps; i++) {
      points.push(stationAt(seg, i / steps).point);
    }
  }
  return points;
}

/** Evenly spaced stations ≈`pitch` apart, keeping `margin` clear at both ends. */
function stations(seg: Segment, pitch: number, margin: number): Station[] {
  const length = segmentLength(seg);
  const usable = length - 2 * margin;
  if (usable < 0) {
    return [];
  }
  const count = Math.round(usable / pitch) + 1;
  if (count === 1) {
    return [stationAt(seg, 0.5)];
  }
  return Array.from({ length: count }, (_, i) => stationAt(seg, (margin + (usable * i) / (count - 1)) / length));
}

/** Clockwise sides of the rectangle inset `d` from the card edge. */
function rectSides(d: number): Segment[] {
  const x0 = d;
  const y0 = d;
  const x1 = CARD_W - d;
  const y1 = CARD_H - d;
  return [
    { kind: 'line', from: { x: x0, y: y0 }, to: { x: x1, y: y0 } },
    { kind: 'line', from: { x: x1, y: y0 }, to: { x: x1, y: y1 } },
    { kind: 'line', from: { x: x1, y: y1 }, to: { x: x0, y: y1 } },
    { kind: 'line', from: { x: x0, y: y1 }, to: { x: x0, y: y0 } },
  ];
}

const CARD_CORNERS = (inset: number): Point[] => [
  { x: inset, y: inset },
  { x: CARD_W - inset, y: inset },
  { x: CARD_W - inset, y: CARD_H - inset },
  { x: inset, y: CARD_H - inset },
];

// ── motif builder ───────────────────────────────────────────────────────────

/** Accumulates cut-out subpaths and their bounding circles. */
class Cutter {
  private readonly parts: string[] = [];
  readonly motifs: MotifBound[] = [];

  /** Structural subpath (sheet, window, edge bite) — not a motif. */
  raw(path: string): void {
    this.parts.push(path);
  }

  dot(c: Point, r: number): void {
    this.parts.push(circlePath(c, r));
    this.motifs.push({ a: c, b: c, radius: r });
  }

  leaf(c: Point, len: number, width: number, angle: number): void {
    this.parts.push(leafPath(c, len, width, angle));
    const dx = (Math.cos(angle) * len) / 2;
    const dy = (Math.sin(angle) * len) / 2;
    this.motifs.push({
      a: { x: c.x - dx, y: c.y - dy },
      b: { x: c.x + dx, y: c.y + dy },
      radius: width / 2,
    });
  }

  diamond(c: Point, h: number): void {
    this.parts.push(diamondPath(c, h));
    this.motifs.push({ a: c, b: c, radius: h });
  }

  /** Eight-petal rosette, `scale` 1 ≈ 25 px across. */
  rosette(c: Point, scale = 1): void {
    this.dot(c, 2.6 * scale);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = 8.6 * scale;
      this.leaf({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) }, 7.5 * scale, 3.6 * scale, a);
    }
  }

  /** Four-petal flower with axis dots (song cửa corner piece). */
  quatrefoil(c: Point): void {
    this.dot(c, 1.6);
    for (let i = 0; i < 4; i++) {
      const petal = Math.PI / 4 + (i * Math.PI) / 2;
      this.leaf({ x: c.x + 9 * Math.cos(petal), y: c.y + 9 * Math.sin(petal) }, 9, 4.4, petal);
      const axis = (i * Math.PI) / 2;
      this.dot({ x: c.x + 12.5 * Math.cos(axis), y: c.y + 12.5 * Math.sin(axis) }, 1.6);
    }
  }

  shape(viewBox: string): LaserShape {
    return { viewBox, d: this.parts.join(''), motifs: this.motifs };
  }
}

// ── sheets ──────────────────────────────────────────────────────────────────

/** Ren — deckled edge, two rows of lace, rosette corners, scalloped window. */
function buildLace(): LaserShape {
  const cut = new Cutter();
  cut.raw(rectPath(0, 0, CARD_W, CARD_H));
  // Deckle: semicircular bites centred on the card edge (their outer halves
  // fall outside the viewBox and are clipped away).
  for (const side of rectSides(0)) {
    for (const s of stations(side, 15, 7.5)) {
      cut.raw(circlePath(s.point, 4.2));
    }
  }
  cut.raw(scallopLoop(divideLoop(rectSides(LACE_WINDOW_INSET), 16)));
  for (const side of rectSides(13)) {
    for (const s of stations(side, 16, 30)) {
      cut.leaf(s.point, 9, 4, s.angle);
    }
  }
  for (const side of rectSides(24)) {
    for (const s of stations(side, 16, 16)) {
      cut.dot(s.point, 2.2);
    }
  }
  CARD_CORNERS(18).forEach((corner) => cut.rosette(corner));
  return cut.shape(`0 0 ${CARD_W} ${CARD_H}`);
}

/** Cổng vòm — arched scalloped window, leaf/dot filigree, spandrel rosettes. */
function buildArch(): LaserShape {
  const { left, right, centerX, spring, radius, base } = ARCH_WINDOW;
  const archLoop = (offset: number): Segment[] => {
    const l = left - offset;
    const r = right + offset;
    const b = base + offset;
    return [
      { kind: 'line', from: { x: l, y: b }, to: { x: l, y: spring } },
      { kind: 'arc', center: { x: centerX, y: spring }, radius: radius + offset, start: Math.PI, end: 2 * Math.PI },
      { kind: 'line', from: { x: r, y: spring }, to: { x: r, y: b } },
      { kind: 'line', from: { x: r, y: b }, to: { x: l, y: b } },
    ];
  };

  const cut = new Cutter();
  cut.raw(rectPath(0, 0, CARD_W, CARD_H));
  cut.raw(scallopLoop(divideLoop(archLoop(0), 16)));

  let index = 0;
  for (const seg of archLoop(18)) {
    for (const s of stations(seg, 15, 7.5)) {
      if (index++ % 2 === 0) {
        cut.leaf(s.point, 9, 4, s.angle);
      } else {
        cut.dot(s.point, 1.8);
      }
    }
  }
  // Outer ring of fine dots following the arch only.
  for (const s of stations(archLoop(30)[1], 13, 0)) {
    cut.dot(s.point, 1.5);
  }
  cut.rosette({ x: 40, y: 40 }, 1.4);
  cut.rosette({ x: CARD_W - 40, y: 40 }, 1.4);
  return cut.shape(`0 0 ${CARD_W} ${CARD_H}`);
}

/** Song cửa — staggered diamond lattice, flower corners, notched window. */
function buildLattice(): LaserShape {
  const inset = LATTICE_WINDOW_INSET;
  const notch = 12;
  const x0 = inset;
  const y0 = inset;
  const x1 = CARD_W - inset;
  const y1 = CARD_H - inset;
  // Window with concave ("ticket") corners: each corner arc is centred on the
  // corner itself and bites into the opening.
  const window =
    `M${x0 + notch} ${y0}H${x1 - notch}A${notch} ${notch} 0 0 0 ${x1} ${y0 + notch}` +
    `V${y1 - notch}A${notch} ${notch} 0 0 0 ${x1 - notch} ${y1}` +
    `H${x0 + notch}A${notch} ${notch} 0 0 0 ${x0} ${y1 - notch}` +
    `V${y0 + notch}A${notch} ${notch} 0 0 0 ${x0 + notch} ${y0}Z`;

  const cut = new Cutter();
  cut.raw(rectPath(0, 0, CARD_W, CARD_H));
  cut.raw(window);

  const pitch = 14;
  const half = 5.2;
  const clear = inset + 6; // keep the corner squares for the flowers
  // Two staggered rows per side: outer (offset 0) and inner (offset ½ pitch).
  const rows: Array<{ depth: number; shift: number }> = [
    { depth: 11, shift: 0 },
    { depth: 25, shift: pitch / 2 },
  ];
  for (const { depth, shift } of rows) {
    for (const along of latticePositions(CARD_W, pitch, shift, clear)) {
      cut.diamond({ x: along, y: depth }, half);
      cut.diamond({ x: along, y: CARD_H - depth }, half);
    }
    for (const along of latticePositions(CARD_H, pitch, shift, clear)) {
      cut.diamond({ x: depth, y: along }, half);
      cut.diamond({ x: CARD_W - depth, y: along }, half);
    }
  }
  CARD_CORNERS(18).forEach((corner) => cut.quatrefoil(corner));
  return cut.shape(`0 0 ${CARD_W} ${CARD_H}`);
}

/** Positions centred on the side's midpoint, `pitch` apart, within [clear, length − clear]. */
function latticePositions(length: number, pitch: number, shift: number, clear: number): number[] {
  const mid = length / 2 + shift;
  const positions: number[] = [];
  const reach = Math.ceil(length / pitch);
  for (let k = -reach; k <= reach; k++) {
    const p = mid + k * pitch;
    if (p >= clear && p <= length - clear) {
      positions.push(p);
    }
  }
  return positions;
}

/** Doily — scalloped rim, petal and dot rings, solid centre for the monogram. */
function buildDoily(): LaserShape {
  const c = { x: 50, y: 50 };
  const polar = (radius: number, deg: number): Point => ({
    x: c.x + radius * Math.cos((deg * Math.PI) / 180),
    y: c.y + radius * Math.sin((deg * Math.PI) / 180),
  });

  const cut = new Cutter();
  cut.raw(scallopLoop(Array.from({ length: 24 }, (_, i) => polar(43, -90 + i * 15)), true));
  for (let i = 0; i < 12; i++) {
    const deg = -90 + i * 30;
    cut.leaf(polar(33, deg), 10, 4.6, (deg * Math.PI) / 180);
    cut.dot(polar(35, deg + 15), 1.6);
    cut.dot(polar(27.5, deg + 15), 1.2);
  }
  for (let i = 0; i < 24; i++) {
    cut.dot(polar(40, -82.5 + i * 15), 1.3);
  }
  return cut.shape('0 0 100 100');
}

export const LASER_SHAPES: Readonly<Record<LaserShapeKey, LaserShape>> = {
  lace: buildLace(),
  arch: buildArch(),
  lattice: buildLattice(),
  doily: buildDoily(),
};
