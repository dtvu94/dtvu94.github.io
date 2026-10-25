/**
 * Small 2-D path toolkit shared by the card silhouettes, envelope flaps,
 * relief motifs and laser sheets. Everything emits compact SVG path strings
 * in screen coordinates (y grows downwards, angles in radians, clockwise).
 */

export interface Point {
  x: number;
  y: number;
}

/** Point on a track: position plus the tangent direction (rad). */
export interface Station {
  point: Point;
  angle: number;
}

// ── formatting ──────────────────────────────────────────────────────────────

/** Round to 0.01 and drop the sign of zero, keeping path strings compact. */
export function fmt(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded === 0 ? 0 : rounded);
}

export function pt(p: Point): string {
  return `${fmt(p.x)} ${fmt(p.y)}`;
}

// ── vectors ─────────────────────────────────────────────────────────────────

export function polar(center: Point, radius: number, angle: number): Point {
  return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
}

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Deterministic PRNG (mulberry32) so generated art is stable between builds. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── primitive closed shapes ─────────────────────────────────────────────────

export function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${fmt(x)} ${fmt(y)}H${fmt(x + w)}V${fmt(y + h)}H${fmt(x)}Z`;
}

export function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  const a = `A${fmt(rr)} ${fmt(rr)} 0 0 1`;
  return (
    `M${fmt(x + rr)} ${fmt(y)}H${fmt(x + w - rr)}${a} ${fmt(x + w)} ${fmt(y + rr)}` +
    `V${fmt(y + h - rr)}${a} ${fmt(x + w - rr)} ${fmt(y + h)}` +
    `H${fmt(x + rr)}${a} ${fmt(x)} ${fmt(y + h - rr)}` +
    `V${fmt(y + rr)}${a} ${fmt(x + rr)} ${fmt(y)}Z`
  );
}

export function circlePath(c: Point, r: number): string {
  return ellipsePath(c, r, r);
}

export function ellipsePath(c: Point, rx: number, ry: number): string {
  const a = `A${fmt(rx)} ${fmt(ry)} 0 1 0`;
  return `M${fmt(c.x - rx)} ${fmt(c.y)}${a} ${fmt(c.x + rx)} ${fmt(c.y)}${a} ${fmt(c.x - rx)} ${fmt(c.y)}Z`;
}

/** Ellipse rotated by `angle`, drawn as two arcs. */
export function rotatedEllipsePath(c: Point, rx: number, ry: number, angle: number): string {
  const p1 = polar(c, rx, angle);
  const p2 = polar(c, -rx, angle);
  const deg = fmt((angle * 180) / Math.PI);
  const a = `A${fmt(rx)} ${fmt(ry)} ${deg} 1 0`;
  return `M${pt(p1)}${a} ${pt(p2)}${a} ${pt(p1)}Z`;
}

/** Lens ("mắt lá"): pointed at both ends, axis from `a` to `b`, max width `width`. */
export function lensPath(a: Point, b: Point, width: number): string {
  const mid = lerp(a, b, 0.5);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  // A quadratic control `width` off the chord bulges the curve by width / 2.
  const c1 = polar(mid, width, angle - Math.PI / 2);
  const c2 = polar(mid, width, angle + Math.PI / 2);
  return `M${pt(a)}Q${pt(c1)} ${pt(b)}Q${pt(c2)} ${pt(a)}Z`;
}

/** Teardrop petal: round end at `tip`, pointed at `base`. */
export function petalPath(base: Point, tip: Point, width: number): string {
  const angle = Math.atan2(tip.y - base.y, tip.x - base.x);
  const len = distance(base, tip);
  const shoulder = polar(base, len * 0.62, angle);
  const l = polar(shoulder, width / 2, angle - Math.PI / 2);
  const r = polar(shoulder, width / 2, angle + Math.PI / 2);
  const tl = polar(tip, width * 0.34, angle - Math.PI / 2);
  const tr = polar(tip, width * 0.34, angle + Math.PI / 2);
  return (
    `M${pt(base)}Q${pt(polar(base, len * 0.25, angle - 0.9))} ${pt(l)}` +
    `C${pt(polar(l, len * 0.3, angle))} ${pt(tl)} ${pt(tip)}` +
    `C${pt(tr)} ${pt(polar(r, len * 0.3, angle))} ${pt(r)}` +
    `Q${pt(polar(base, len * 0.25, angle + 0.9))} ${pt(base)}Z`
  );
}

/** Regular polygon / star with `points` tips; `inner` = 1 gives a polygon. */
export function starPath(c: Point, outer: number, inner: number, points: number, rotation = -Math.PI / 2): string {
  let d = '';
  const steps = inner === 1 ? points : points * 2;
  for (let i = 0; i < steps; i++) {
    const r = inner === 1 || i % 2 === 0 ? outer : outer * inner;
    d += `${i === 0 ? 'M' : 'L'}${pt(polar(c, r, rotation + (i * 2 * Math.PI) / steps))}`;
  }
  return `${d}Z`;
}

// ── tracks: polylines parameterised by arc length ──────────────────────────

/** Curve segment for building tracks; each starts where the previous ended. */
export type TrackSeg =
  | { kind: 'line'; to: Point }
  | { kind: 'quad'; c: Point; to: Point }
  | { kind: 'cubic'; c1: Point; c2: Point; to: Point }
  /** Circular arc about `center` from the current point's angle to `end`. */
  | { kind: 'arc'; center: Point; radius: number; start: number; end: number };

/**
 * A dense polyline with cumulative lengths, so decorations can be spaced
 * evenly along any curve. Accurate to well under a pixel at 32 samples/seg.
 */
export class Track {
  readonly length: number;
  private readonly cumulative: number[];

  private constructor(
    private readonly points: Point[],
    readonly closed: boolean,
  ) {
    const pts = closed ? [...points, points[0]] : points;
    this.cumulative = [0];
    for (let i = 1; i < pts.length; i++) {
      this.cumulative.push(this.cumulative[i - 1] + distance(pts[i - 1], pts[i]));
    }
    this.length = this.cumulative[this.cumulative.length - 1];
  }

  static polyline(points: Point[], closed = false): Track {
    return new Track(points, closed);
  }

  static build(start: Point, segments: TrackSeg[], closed = false, samples = 32): Track {
    const points: Point[] = [start];
    let current = start;
    for (const seg of segments) {
      for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        points.push(segmentPoint(current, seg, t));
      }
      current = points[points.length - 1];
    }
    if (closed && distance(points[0], points[points.length - 1]) < 1e-6) {
      points.pop();
    }
    return new Track(points, closed);
  }

  static ellipse(c: Point, rx: number, ry: number, startAngle = -Math.PI / 2, samples = 180): Track {
    const points = Array.from({ length: samples }, (_, i) => {
      const a = startAngle + (i / samples) * 2 * Math.PI;
      return { x: c.x + rx * Math.cos(a), y: c.y + ry * Math.sin(a) };
    });
    return new Track(points, true);
  }

  /** Clockwise rounded rectangle starting at the middle of the top edge. */
  static roundedRect(x: number, y: number, w: number, h: number, r: number): Track {
    const rr = Math.min(r, w / 2, h / 2);
    const q = Math.PI / 2;
    return Track.build(
      { x: x + w / 2, y },
      [
        { kind: 'line', to: { x: x + w - rr, y } },
        { kind: 'arc', center: { x: x + w - rr, y: y + rr }, radius: rr, start: -q, end: 0 },
        { kind: 'line', to: { x: x + w, y: y + h - rr } },
        { kind: 'arc', center: { x: x + w - rr, y: y + h - rr }, radius: rr, start: 0, end: q },
        { kind: 'line', to: { x: x + rr, y: y + h } },
        { kind: 'arc', center: { x: x + rr, y: y + h - rr }, radius: rr, start: q, end: 2 * q },
        { kind: 'line', to: { x, y: y + rr } },
        { kind: 'arc', center: { x: x + rr, y: y + rr }, radius: rr, start: 2 * q, end: 3 * q },
        { kind: 'line', to: { x: x + w / 2, y } },
      ],
      true,
    );
  }

  /** Station at arc length `s` (wraps on closed tracks, clamps on open ones). */
  at(s: number): Station {
    const total = this.length;
    let target = this.closed ? ((s % total) + total) % total : Math.max(0, Math.min(total, s));
    const pts = this.closed ? [...this.points, this.points[0]] : this.points;
    let lo = 0;
    let hi = this.cumulative.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cumulative[mid] <= target) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const segLen = this.cumulative[hi] - this.cumulative[lo] || 1;
    target = Math.min(target, this.cumulative[hi]);
    const t = (target - this.cumulative[lo]) / segLen;
    const a = pts[lo];
    const b = pts[hi];
    return { point: lerp(a, b, t), angle: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  /** `count` stations evenly spaced; open tracks keep `margin` clear at both ends. */
  spaced(count: number, margin = 0): Station[] {
    if (count <= 0) {
      return [];
    }
    if (this.closed) {
      return Array.from({ length: count }, (_, i) => this.at((i * this.length) / count));
    }
    const usable = this.length - 2 * margin;
    if (count === 1) {
      return [this.at(this.length / 2)];
    }
    return Array.from({ length: count }, (_, i) => this.at(margin + (usable * i) / (count - 1)));
  }

  /** Stations roughly `pitch` apart. */
  every(pitch: number, margin = 0): Station[] {
    const usable = this.closed ? this.length : this.length - 2 * margin;
    const count = Math.max(1, Math.round(usable / pitch) + (this.closed ? 0 : 1));
    return this.spaced(count, margin);
  }

  /** Smooth SVG path through the track's samples. */
  toPath(): string {
    const head = `M${pt(this.points[0])}`;
    const body = this.points.slice(1).map((p) => `L${pt(p)}`).join('');
    return head + body + (this.closed ? 'Z' : '');
  }
}

function segmentPoint(from: Point, seg: TrackSeg, t: number): Point {
  switch (seg.kind) {
    case 'line':
      return lerp(from, seg.to, t);
    case 'quad': {
      const u = 1 - t;
      return {
        x: u * u * from.x + 2 * u * t * seg.c.x + t * t * seg.to.x,
        y: u * u * from.y + 2 * u * t * seg.c.y + t * t * seg.to.y,
      };
    }
    case 'cubic': {
      const u = 1 - t;
      return {
        x: u * u * u * from.x + 3 * u * u * t * seg.c1.x + 3 * u * t * t * seg.c2.x + t * t * t * seg.to.x,
        y: u * u * u * from.y + 3 * u * u * t * seg.c1.y + 3 * u * t * t * seg.c2.y + t * t * t * seg.to.y,
      };
    }
    case 'arc':
      return polar(seg.center, seg.radius, seg.start + (seg.end - seg.start) * t);
  }
}

/**
 * Closed outline through `points` (clockwise on screen) where every edge is a
 * circular scallop. `roundness` 1 = semicircle; > 1 makes the arc radius that
 * many half-chords and draws the larger arc, giving fat, pinched lobes
 * (clouds); < 1 is not meaningful. Scallops bulge outwards by default.
 */
export function scallopLoop(points: Point[], options: { inward?: boolean; roundness?: number } = {}): string {
  const k = Math.max(1, options.roundness ?? 1);
  const sweep = options.inward ? 0 : 1;
  const large = k > 1 ? 1 : 0;
  let d = `M${pt(points[0])}`;
  for (let i = 1; i <= points.length; i++) {
    const prev = points[i - 1];
    const next = points[i % points.length];
    const r = (distance(prev, next) / 2) * k;
    d += `A${fmt(r)} ${fmt(r)} 0 ${large} ${sweep} ${pt(next)}`;
  }
  return `${d}Z`;
}

/** How far a scallop of chord `c` and `roundness` k bulges past its chord. */
export function scallopDepth(c: number, roundness = 1): number {
  const r = (c / 2) * Math.max(1, roundness);
  return r + Math.sqrt(Math.max(0, r * r - (c / 2) * (c / 2)));
}

/** Vertices every ≈`pitch` along a closed polygon, each corner kept as a vertex. */
export function subdivide(corners: Point[], pitch: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    const steps = Math.max(1, Math.round(distance(a, b) / pitch));
    for (let k = 0; k < steps; k++) {
      out.push(lerp(a, b, k / steps));
    }
  }
  return out;
}
