import {
  Point,
  Track,
  circlePath,
  fmt,
  lensPath,
  lerp,
  petalPath,
  polar,
  pt,
  rotatedEllipsePath,
  seededRandom,
} from './path-kit';

/**
 * Procedural floral art for relief (dập nổi / dập chìm), foil and line
 * printing. A motif is two compound paths — filled shapes (leaves, petals,
 * berries) and stroked lines (stems, tendrils) — so a whole frame renders as
 * two SVG elements and one lighting filter.
 */
export interface Motif {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export function mergeMotifs(...parts: Motif[]): Motif {
  return {
    fill: parts.map((m) => m.fill).join(''),
    stroke: parts.map((m) => m.stroke).join(''),
    strokeWidth: Math.max(...parts.map((m) => m.strokeWidth)),
  };
}

// ── botanical primitives ────────────────────────────────────────────────────

/** Five-petal blossom (hoa mai / hoa đào) with a separate raised centre. */
export function blossom(c: Point, r: number, rotation = 0, petals = 5): string {
  let d = circlePath(c, r * 0.17);
  for (let i = 0; i < petals; i++) {
    const a = rotation + (i * 2 * Math.PI) / petals;
    d += petalPath(polar(c, r * 0.27, a), polar(c, r, a), r * 0.66);
  }
  return d;
}

/** Leaf split by a midrib groove: two half-lenses touching at base and tip. */
export function leaf(base: Point, tip: Point, width: number): string {
  const angle = Math.atan2(tip.y - base.y, tip.x - base.x);
  const mid = lerp(base, tip, 0.45);
  const gap = Math.max(0.5, width * 0.07);
  const left = polar(mid, width, angle - Math.PI / 2);
  const right = polar(mid, width, angle + Math.PI / 2);
  const ribL = polar(mid, gap, angle - Math.PI / 2);
  const ribR = polar(mid, gap, angle + Math.PI / 2);
  return (
    `M${pt(base)}Q${pt(left)} ${pt(tip)}Q${pt(ribL)} ${pt(base)}Z` +
    `M${pt(base)}Q${pt(ribR)} ${pt(tip)}Q${pt(right)} ${pt(base)}Z`
  );
}

/** Closed bud: a small lens with two sepals. */
export function bud(base: Point, angle: number, len: number): string {
  const tip = polar(base, len, angle);
  return (
    lensPath(polar(base, len * 0.15, angle), tip, len * 0.62) +
    lensPath(base, polar(base, len * 0.55, angle - 0.55), len * 0.3) +
    lensPath(base, polar(base, len * 0.55, angle + 0.55), len * 0.3)
  );
}

/** Spiral tendril starting at `p` heading `angle`, curling to `side` (±1). */
export function tendril(p: Point, angle: number, len: number, side: 1 | -1): string {
  let d = `M${pt(p)}`;
  let a = angle;
  let cur = p;
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const step = (len / steps) * (1 - i / (steps * 1.6));
    a += side * (0.12 + i * 0.035);
    cur = polar(cur, step, a);
    d += `L${pt(cur)}`;
  }
  return d;
}

// ── composite motifs ────────────────────────────────────────────────────────

export interface VineOptions {
  /** Distance between successive leaves along the stem. */
  pitch: number;
  leafLength: number;
  leafWidth: number;
  /** Every n-th station bears a blossom instead of a leaf (0 = none). */
  blossomEvery: number;
  blossomRadius: number;
  /** Stem wave amplitude and wavelength. */
  wave: number;
  waveLength: number;
  stemWidth: number;
  seed: number;
  /** Fraction of leaf stations that also sprout a tendril. */
  tendrils?: number;
  /** Clusters (blossom + leaves) at these arc-length positions. */
  clusters?: number[];
  clusterRadius?: number;
}

/** A leafy, flowering vine winding along `track`. */
export function vine(track: Track, o: VineOptions): Motif {
  const rand = seededRandom(o.seed);
  const wavy = (s: number) => {
    const st = track.at(s);
    const offset = o.wave * Math.sin((2 * Math.PI * s) / o.waveLength);
    return { point: polar(st.point, offset, st.angle + Math.PI / 2), angle: st.angle };
  };

  const stemPts: Point[] = [];
  const sampleStep = 4;
  const samples = Math.ceil(track.length / sampleStep);
  for (let i = 0; i <= samples; i++) {
    stemPts.push(wavy((i * track.length) / samples).point);
  }
  let stroke = `M${pt(stemPts[0])}` + stemPts.slice(1).map((p) => `L${pt(p)}`).join('');
  if (track.closed) {
    stroke += 'Z';
  }

  let fill = '';
  const count = Math.max(1, Math.round(track.length / o.pitch));
  const margin = track.closed ? 0 : o.pitch * 0.6;
  const usable = track.length - 2 * margin;
  const clusterAt = o.clusters ?? [];
  const nearCluster = (s: number) =>
    clusterAt.some((c) => Math.abs(c - s) < (o.clusterRadius ?? o.blossomRadius) * 2.2);

  for (let i = 0; i < count; i++) {
    const s = margin + (track.closed ? (i * track.length) / count : (usable * i) / Math.max(1, count - 1));
    if (nearCluster(s)) {
      continue;
    }
    const st = wavy(s);
    const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const jitter = 0.85 + rand() * 0.3;
    if (o.blossomEvery > 0 && i % o.blossomEvery === o.blossomEvery - 1) {
      const r = o.blossomRadius * (0.85 + rand() * 0.3);
      const c = polar(st.point, r * 1.05, st.angle + (side * Math.PI) / 2);
      fill += blossom(c, r, rand() * Math.PI);
      continue;
    }
    const leafAngle = st.angle + side * (0.7 + rand() * 0.25);
    const tip = polar(st.point, o.leafLength * jitter, leafAngle);
    fill += leaf(st.point, tip, o.leafWidth * jitter);
    if (o.tendrils && rand() < o.tendrils) {
      stroke += tendril(st.point, st.angle - side * 0.9, o.leafLength * 0.9, side === 1 ? -1 : 1);
    }
  }

  for (const s of clusterAt) {
    const st = wavy(s);
    const r = o.clusterRadius ?? o.blossomRadius * 1.4;
    fill += blossom(st.point, r, rand() * Math.PI);
    for (const side of [1, -1] as const) {
      const a = st.angle + side * 1.15;
      fill += leaf(polar(st.point, r * 0.9, a), polar(st.point, r * 0.9 + o.leafLength * 1.15, a), o.leafWidth);
      fill += bud(polar(st.point, r * 0.95, st.angle + Math.PI * (side === 1 ? 0.05 : 0.95)), st.angle + (side === 1 ? -0.4 : Math.PI + 0.4), r * 0.8);
    }
  }

  return { fill, stroke, strokeWidth: o.stemWidth };
}

/** Laurel wreath around a monogram centred at `c`, open at the top. */
export function laurelWreath(c: Point, radius: number, options: { leaves?: number; seed?: number; berries?: boolean } = {}): Motif {
  const rand = seededRandom(options.seed ?? 7);
  const leaves = options.leaves ?? 9;
  let fill = '';
  let stroke = '';
  for (const side of [1, -1] as const) {
    // From the bottom tie (≈ 100° / 80°) round the side to the top (≈ 255° / -75°).
    const start = Math.PI / 2 + side * 0.18;
    const end = Math.PI / 2 + side * (Math.PI - 0.55);
    const arc = Track.build(polar(c, radius, start), [{ kind: 'arc', center: c, radius, start, end }]);
    stroke += arc.toPath();
    arc.spaced(leaves, radius * 0.06).forEach((st, i) => {
      const len = radius * (0.36 - i * 0.012) * (0.9 + rand() * 0.2);
      const heading = st.angle;
      for (const lean of [1, -1] as const) {
        if (i === 0 && lean === -1) {
          continue;
        }
        const a = heading + lean * 0.62;
        fill += leaf(st.point, polar(st.point, len, a), len * 0.3);
      }
      if (options.berries && i % 3 === 1) {
        fill += circlePath(polar(st.point, radius * 0.1, heading + side * Math.PI / 2), radius * 0.035);
      }
    });
  }
  // Ribbon tie at the bottom.
  const tie = polar(c, radius, Math.PI / 2);
  fill += lensPath(tie, polar(tie, radius * 0.28, Math.PI * 0.82), radius * 0.13);
  fill += lensPath(tie, polar(tie, radius * 0.28, Math.PI * 0.18), radius * 0.13);
  fill += circlePath(tie, radius * 0.05);
  return { fill, stroke, strokeWidth: Math.max(1, radius * 0.025) };
}

/** Tapered filled stroke along a track, from width `w0` to `w1`. */
export function taperedStroke(track: Track, w0: number, w1: number, samples = 40): string {
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const s = (i / samples) * track.length;
    const st = track.at(s);
    const w = (w0 + (w1 - w0) * (i / samples)) / 2;
    left.push(polar(st.point, w, st.angle - Math.PI / 2));
    right.push(polar(st.point, w, st.angle + Math.PI / 2));
  }
  const pts = [...left, ...right.reverse()];
  return `M${pt(pts[0])}${pts.slice(1).map((p) => `L${pt(p)}`).join('')}Z`;
}

export interface BranchOptions {
  width: number;
  blossomRadius: number;
  /** Side twigs as fractions of the main length. */
  twigs: number[];
  seed: number;
  /** Blossoms along the main branch (in addition to twig tips). */
  blossoms: number;
  /** Twig length as a fraction of the main branch (default 0.28). */
  twigLength?: number;
}

/**
 * Flowering branch (cành mai / đào): a tapered woody stem with side twigs,
 * open blossoms and buds — the classic corner spray.
 */
export function blossomBranch(start: Point, c1: Point, c2: Point, end: Point, o: BranchOptions): Motif {
  const rand = seededRandom(o.seed);
  const main = Track.build(start, [{ kind: 'cubic', c1, c2, to: end }]);
  let fill = taperedStroke(main, o.width, o.width * 0.25);
  const bloom = (p: Point, scale = 1) => {
    fill += blossom(p, o.blossomRadius * scale * (0.85 + rand() * 0.3), rand() * Math.PI);
  };

  o.twigs.forEach((at, i) => {
    const st = main.at(at * main.length);
    const side = i % 2 === 0 ? 1 : -1;
    const reach = o.twigLength ?? 0.28;
    const len = main.length * reach * (1 - at * 0.43) * (0.85 + rand() * 0.3);
    const a = st.angle + side * (0.55 + rand() * 0.35);
    const tip = polar(st.point, len, a);
    const twig = Track.build(st.point, [
      { kind: 'quad', c: polar(lerp(st.point, tip, 0.5), len * 0.18, a - side * Math.PI / 2), to: tip },
    ]);
    fill += taperedStroke(twig, o.width * 0.55 * (1 - at * 0.4), o.width * 0.15);
    bloom(tip, 0.9);
    fill += bud(polar(twig.at(twig.length * 0.55).point, 2, a), a + side * 0.9, o.blossomRadius * 0.8);
  });

  for (let i = 1; i <= o.blossoms; i++) {
    const st = main.at((main.length * i) / (o.blossoms + 1));
    const side = i % 2 === 0 ? 1 : -1;
    bloom(polar(st.point, o.blossomRadius * 0.95, st.angle + side * Math.PI / 2), 0.8);
  }
  bloom(end, 1.1);
  fill += bud(end, main.at(main.length).angle + 0.5, o.blossomRadius);
  return { fill, stroke: '', strokeWidth: 0 };
}

/** Ring of evenly spaced dots (pearl border). */
export function pearlRing(track: Track, pitch: number, radius: number): Motif {
  return { fill: track.every(pitch).map((st) => circlePath(st.point, radius)).join(''), stroke: '', strokeWidth: 0 };
}

/** Lotus flower (open, front view) standing on `base`, height `h`. */
export function lotusBloom(base: Point, h: number): string {
  const w = h * 1.25;
  const petal = (angle: number, len: number, width: number) =>
    petalPath(polar(base, h * 0.05, angle), polar(base, len, angle), width);
  return (
    petal(-Math.PI / 2, h, w * 0.3) +
    petal(-Math.PI / 2 - 0.42, h * 0.92, w * 0.26) +
    petal(-Math.PI / 2 + 0.42, h * 0.92, w * 0.26) +
    petal(-Math.PI / 2 - 0.88, h * 0.78, w * 0.22) +
    petal(-Math.PI / 2 + 0.88, h * 0.78, w * 0.22) +
    rotatedEllipsePath({ x: base.x, y: base.y + h * 0.04 }, w * 0.42, h * 0.08, 0)
  );
}

/** Lotus pad seen at an angle: an ellipse with a wedge notch. */
export function lotusPad(c: Point, rx: number, ry: number, notch = 0.35): string {
  const a0 = -Math.PI / 2 - notch / 2;
  const a1 = -Math.PI / 2 + notch / 2;
  const p0 = { x: c.x + rx * Math.cos(a1), y: c.y + ry * Math.sin(a1) };
  const p1 = { x: c.x + rx * Math.cos(a0), y: c.y + ry * Math.sin(a0) };
  return `M${pt(c)}L${pt(p0)}A${fmt(rx)} ${fmt(ry)} 0 1 1 ${pt(p1)}Z`;
}

/** Bottom border of lotus blooms rising between pads. */
export function lotusRow(left: number, right: number, baseline: number, height: number, blooms: number, seed = 3): Motif {
  const rand = seededRandom(seed);
  let fill = '';
  let stroke = '';
  const span = right - left;
  for (let i = 0; i < blooms; i++) {
    const x = left + (span * (i + 0.5)) / blooms;
    const h = height * (i % 2 === 0 ? 1 : 0.78) * (0.92 + rand() * 0.16);
    const head = { x: x + (rand() - 0.5) * 6, y: baseline - h * 0.95 };
    stroke += `M${pt({ x, y: baseline })}Q${pt({ x: x + 4, y: baseline - h * 0.5 })} ${pt(head)}`;
    fill += lotusBloom(head, h * 0.55);
    if (i < blooms - 1) {
      // Pads sit between neighbouring blooms.
      const padX = left + (span * (i + 1)) / blooms;
      fill += lotusPad({ x: padX, y: baseline - height * 0.12 }, height * 0.38, height * 0.12, 0.5);
    }
  }
  return { fill, stroke, strokeWidth: Math.max(1, height * 0.035) };
}
