import { Motif, blossom, laurelWreath, leaf, lotusBloom } from './motifs';
import { Point, Track, circlePath, fmt, lensPath, polar, pt, roundedRectPath, seededRandom } from './path-kit';

/**
 * Art printed on envelopes and their seals. Coordinates are envelope pixels
 * (see ENV_W × ENV_H in shapes.ts) unless a function takes its own centre.
 */

/** Fern frond: a curved rachis with paired pinnae shrinking to the tip. */
export function fern(base: Point, angle: number, length: number, bend = 0.35): Motif {
  const tip = polar(base, length, angle);
  const ctrl = polar(polar(base, length * 0.55, angle), length * bend * 0.4, angle + Math.PI / 2);
  const rachis = Track.build(base, [{ kind: 'quad', c: ctrl, to: tip }]);
  let fill = '';
  const pairs = 13;
  for (let i = 1; i <= pairs; i++) {
    const s = rachis.length * (0.08 + (0.9 * i) / pairs);
    const st = rachis.at(Math.min(s, rachis.length - 1));
    const size = length * 0.17 * (1 - i / (pairs + 3));
    for (const side of [1, -1]) {
      const a = st.angle + side * 0.95;
      fill += lensPath(st.point, polar(st.point, size, a), size * 0.36);
    }
  }
  return { fill, stroke: rachis.toPath(), strokeWidth: Math.max(1, length * 0.012) };
}

/** Corner spray of leaves and small blossoms (florals print). */
export function cornerSpray(corner: Point, direction: number, size: number, seed: number): Motif {
  const rand = seededRandom(seed);
  let fill = '';
  let stroke = '';
  for (let k = -1; k <= 1; k++) {
    const a = direction + k * 0.42;
    const len = size * (k === 0 ? 1 : 0.72);
    const tip = polar(corner, len, a);
    stroke += `M${pt(corner)}Q${pt(polar(polar(corner, len * 0.5, a), len * 0.12, a + 1.2))} ${pt(tip)}`;
    for (let i = 1; i <= 4; i++) {
      const p = polar(corner, (len * i) / 5, a);
      const side = i % 2 === 0 ? 1 : -1;
      fill += leaf(p, polar(p, size * 0.2, a + side * 0.8), size * 0.06);
    }
    fill += blossom(tip, size * (0.1 + rand() * 0.04), rand() * Math.PI);
  }
  return { fill, stroke, strokeWidth: Math.max(1, size * 0.018) };
}

/** Double-line rounded frame with curled corners (thiệp mời label frame). */
export function curlFrame(x: number, y: number, w: number, h: number): Motif {
  const curl = (c: Point, sx: number, sy: number) =>
    `M${pt({ x: c.x, y: c.y + sy * 14 })}` +
    `C${pt({ x: c.x, y: c.y - sy * 6 })} ${pt({ x: c.x + sx * 22, y: c.y - sy * 4 })} ${pt({ x: c.x + sx * 16, y: c.y + sy * 8 })}` +
    `C${pt({ x: c.x + sx * 12, y: c.y + sy * 14 })} ${pt({ x: c.x + sx * 4, y: c.y + sy * 8 })} ${pt({ x: c.x + sx * 8, y: c.y + sy * 4 })}`;
  return {
    fill: '',
    stroke:
      roundedRectPath(x, y, w, h, 18) +
      roundedRectPath(x + 7, y + 7, w - 14, h - 14, 13) +
      curl({ x: x - 4, y: y - 4 }, 1, 1) +
      curl({ x: x + w + 4, y: y - 4 }, -1, 1) +
      curl({ x: x - 4, y: y + h + 4 }, 1, -1) +
      curl({ x: x + w + 4, y: y + h + 4 }, -1, -1),
    strokeWidth: 1.4,
  };
}

/** Lotus print: one bloom with two pads. */
export function lotusPrint(c: Point, size: number): Motif {
  return {
    fill: lotusBloom(c, size),
    stroke: `M${pt({ x: c.x - size * 1.3, y: c.y + size * 0.12 })}H${fmt(c.x + size * 1.3)}`,
    strokeWidth: 1.2,
  };
}

export function monogramCrest(c: Point, r: number): Motif {
  return laurelWreath(c, r, { leaves: 8, berries: true, seed: 3 });
}

/** Irregular wax seal outline (sáp niêm), radius ≈ r. */
export function waxSealPath(c: Point, r: number, seed = 5): string {
  const rand = seededRandom(seed);
  const steps = 28;
  const pts = Array.from({ length: steps }, (_, i) => polar(c, r * (0.93 + rand() * 0.12), (i * 2 * Math.PI) / steps));
  let d = `M${pt(lerpMid(pts[steps - 1], pts[0]))}`;
  for (let i = 0; i < steps; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % steps];
    d += `Q${pt(p)} ${pt(lerpMid(p, next))}`;
  }
  return `${d}Z`;
}

function lerpMid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Hand-drawn ribbon bow centred on `c` (two loops, two tails), as strokes. */
export function drawnBow(c: Point, size: number): string {
  const s = size;
  const loop = (dir: 1 | -1) =>
    `M${pt(c)}C${pt({ x: c.x + dir * s * 0.5, y: c.y - s * 0.55 })} ${pt({ x: c.x + dir * s * 1.25, y: c.y - s * 0.45 })} ${pt({ x: c.x + dir * s * 1.15, y: c.y })}` +
    `C${pt({ x: c.x + dir * s * 1.05, y: c.y + s * 0.4 })} ${pt({ x: c.x + dir * s * 0.45, y: c.y + s * 0.3 })} ${pt(c)}`;
  const tail = (dir: 1 | -1) =>
    `M${pt(c)}C${pt({ x: c.x + dir * s * 0.2, y: c.y + s * 0.5 })} ${pt({ x: c.x + dir * s * 0.55, y: c.y + s * 0.8 })} ${pt({ x: c.x + dir * s * 0.75, y: c.y + s * 1.25 })}` +
    `l${fmt(dir * -s * 0.12)} ${fmt(-s * 0.06)}`;
  return loop(1) + loop(-1) + tail(1) + tail(-1) + circlePath(c, s * 0.12);
}
