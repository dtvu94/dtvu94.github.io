import { Point, circlePath, polar, pt, seededRandom } from './path-kit';
import { bud, leaf } from './motifs';

/**
 * Hoa hồng baby — a spray of small roses with buds, leaves and baby's breath
 * (hoa baby), for the sides of an envelope front. Each layer is one compound
 * path so a spray renders in a handful of SVG elements, either in colour or
 * as one foil ink under the relief filter.
 */
export interface RoseSpray {
  /** Stems and twigs (stroked). */
  stems: string;
  /** Leaves (filled, with a midrib groove). */
  leaves: string;
  /** Outer petals of every open rose (filled). */
  petals: string;
  /** Inner, deeper-coloured petals (filled). */
  petalsInner: string;
  /** Petal edges and the spiral heart (stroked). */
  lines: string;
  /** Closed buds with sepals (filled). */
  buds: string;
  /** Baby's breath florets (filled dots). */
  breath: string;
  /** Hair-thin stems of the baby's breath (stroked). */
  breathStems: string;
}

/** One rose petal, cupped: from the inner ring out to `rOut` and back. */
function petal(c: Point, rIn: number, rOut: number, angle: number, half: number): string {
  const a = polar(c, rIn, angle - half * 0.8);
  const b = polar(c, rIn, angle + half * 0.8);
  const c1 = polar(c, rOut * 1.12, angle - half * 1.2);
  const c2 = polar(c, rOut * 1.12, angle + half * 1.2);
  const back = polar(c, rIn * 0.55, angle);
  return `M${pt(a)}C${pt(c1)} ${pt(c2)} ${pt(b)}Q${pt(back)} ${pt(a)}Z`;
}

/** Edge of a petal only (no return stroke), for the line layer. */
function petalEdge(c: Point, rIn: number, rOut: number, angle: number, half: number): string {
  const a = polar(c, rIn, angle - half * 0.8);
  const b = polar(c, rIn, angle + half * 0.8);
  const c1 = polar(c, rOut * 1.12, angle - half * 1.2);
  const c2 = polar(c, rOut * 1.12, angle + half * 1.2);
  return `M${pt(a)}C${pt(c1)} ${pt(c2)} ${pt(b)}`;
}

/** Spiral heart of the rose, as a polyline. */
function heart(c: Point, r: number, rotation: number): string {
  const steps = 40;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = polar(c, r * (0.12 + 0.88 * t), rotation + t * Math.PI * 3.2);
    d += `${i ? 'L' : 'M'}${pt(p)}`;
  }
  return d;
}

/** An open rose seen from above: three rings of petals round a spiral heart. */
function rose(c: Point, r: number, rotation: number, out: RoseSpray): void {
  const rings = [
    { count: 5, rOut: r, rIn: r * 0.34, half: 0.62, layer: 'petals' as const },
    { count: 4, rOut: r * 0.7, rIn: r * 0.26, half: 0.7, layer: 'petalsInner' as const },
    { count: 3, rOut: r * 0.46, rIn: r * 0.16, half: 0.82, layer: 'petalsInner' as const },
  ];
  rings.forEach((ring, k) => {
    for (let i = 0; i < ring.count; i++) {
      const a = rotation + k * 0.6 + (i * 2 * Math.PI) / ring.count;
      out[ring.layer] += petal(c, ring.rIn, ring.rOut, a, ring.half);
      out.lines += petalEdge(c, ring.rIn, ring.rOut, a, ring.half);
    }
  });
  // Closed heart under the spiral, so no paper shows through the middle.
  out.petalsInner += circlePath(c, r * 0.22);
  out.lines += heart(c, r * 0.24, rotation);
}

/** A sprig of baby's breath: a few hair stems ending in tiny florets. */
function breathSprig(from: Point, to: Point, rand: () => number, out: RoseSpray): void {
  out.breathStems += `M${pt(from)}L${pt(to)}`;
  const florets = 5 + Math.floor(rand() * 4);
  for (let i = 0; i < florets; i++) {
    const a = rand() * Math.PI * 2;
    const p = polar(to, 3 + rand() * 7, a);
    out.breathStems += `M${pt(to)}L${pt(p)}`;
    out.breath += circlePath(p, 1.3 + rand() * 0.9);
  }
}

/**
 * Spray for the left side of an envelope front (`flip` mirrors it onto the
 * right side, about x = `width` / 2), laid out in envelope pixels: roses at
 * mid-height, buds rising above, baby's breath tucked between.
 */
export function roseSpray(width: number, flip: boolean, seed = 7): RoseSpray {
  const rand = seededRandom(seed);
  const out: RoseSpray = { stems: '', leaves: '', petals: '', petalsInner: '', lines: '', buds: '', breath: '', breathStems: '' };
  const X = (x: number) => (flip ? width - x : x);
  const P = (x: number, y: number): Point => ({ x: X(x), y });
  const A = (a: number) => (flip ? Math.PI - a : a);
  const jitter = () => (rand() - 0.5) * 4;

  // Main stem from the foot of the spray up to the top bud.
  out.stems += `M${pt(P(44, 244))}C${pt(P(66, 200))} ${pt(P(40, 122))} ${pt(P(70, 44))}`;

  // Roses [x, y, radius]: a full head at mid-height, smaller ones round it.
  const roses: [number, number, number][] = [
    [70, 160, 27],
    [106, 116, 20],
    [36, 118, 17],
    [100, 206, 16],
    [32, 202, 14],
    [80, 80, 13],
  ];
  // Twigs from the main stem out to every rose and bud.
  const twigs: [number, number, number, number][] = [
    [56, 150, 106, 116],
    [50, 136, 36, 118],
    [58, 196, 100, 206],
    [50, 210, 32, 202],
    [62, 88, 80, 80],
    [64, 70, 108, 66],
    [62, 76, 30, 70],
    [60, 166, 120, 158],
  ];
  for (const [x1, y1, x2, y2] of twigs) {
    const mid = P((x1 + x2) / 2 + jitter(), (y1 + y2) / 2 - 6);
    out.stems += `M${pt(P(x1, y1))}Q${pt(mid)} ${pt(P(x2, y2))}`;
  }

  // Leaves [x, y, angle, length, half-width], tucked under the roses.
  const leaves: [number, number, number, number, number][] = [
    [54, 232, -2.6, 26, 9],
    [60, 216, -0.3, 25, 8.5],
    [86, 184, 0.2, 24, 8],
    [46, 150, -2.9, 25, 8.5],
    [92, 140, -0.45, 21, 7],
    [52, 100, -2.5, 21, 7],
    [90, 98, -0.75, 19, 6.5],
    [60, 60, 0.35, 16, 6],
    [22, 162, -2.15, 19, 6.5],
    [118, 186, -0.55, 19, 6.5],
  ];
  for (const [x, y, angle, len, w] of leaves) {
    const base = P(x, y);
    out.leaves += leaf(base, polar(base, len, A(angle + (rand() - 0.5) * 0.15)), w);
  }

  for (const [x, y, r] of roses) {
    rose(P(x + jitter(), y + jitter()), r, rand() * Math.PI * 2, out);
  }

  // Buds at the twig ends [x, y, angle, length].
  const buds: [number, number, number, number][] = [
    [70, 44, -1.55, 17],
    [108, 66, -0.95, 14],
    [30, 70, -2.2, 14],
    [120, 158, -0.2, 13],
  ];
  for (const [x, y, angle, len] of buds) {
    out.buds += bud(P(x, y), A(angle), len);
  }

  // Baby's breath sprigs between the roses [from x, y, to x, y].
  const breath: [number, number, number, number][] = [
    [74, 128, 124, 96],
    [44, 140, 16, 146],
    [70, 190, 124, 232],
    [58, 82, 16, 88],
    [68, 52, 104, 36],
  ];
  for (const [x1, y1, x2, y2] of breath) {
    breathSprig(P(x1, y1), P(x2, y2), rand, out);
  }
  return out;
}

/** Both sides of an envelope front, mirrored, with a little variation. */
export function envelopeRoses(width: number): RoseSpray {
  const left = roseSpray(width, false, 7);
  const right = roseSpray(width, true, 11);
  const keys = Object.keys(left) as (keyof RoseSpray)[];
  return Object.fromEntries(keys.map((key) => [key, left[key] + right[key]])) as unknown as RoseSpray;
}
