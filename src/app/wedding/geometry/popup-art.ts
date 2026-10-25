import { Palette, PopupScene } from '../data/wedding.types';
import { blossom, leaf, lotusBloom } from './motifs';
import { Point, circlePath, ellipsePath, fmt, lensPath, pt, rectPath, seededRandom } from './path-kit';

/**
 * Pop-up scenes. Each layer is a piece of card standing on the open card,
 * drawn in its own box (x 0..400, y 0..height) with its foot on the bottom
 * edge; `foot` is where that foot stands on the 400 × 560 open card (the
 * fold is at y = 280, so larger feet stand further forward).
 */

export interface PopShape {
  d: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  evenOdd?: boolean;
}

export interface PopText {
  content: 'date' | 'names' | 'monogram';
  x: number;
  y: number;
  size: number;
  fill: string;
  stroke?: string;
  font: 'display' | 'accent';
}

export interface PopLayer {
  foot: number;
  height: number;
  shapes: PopShape[];
  texts?: PopText[];
}

const LEAF = '#6f8f5a';
const LEAF_DARK = '#4f6d42';
const PETAL = '#ee9fae';
const PEACH = '#f6c09a';
const WATER = '#7fb0cf';

export function heartPath(c: Point, w: number): string {
  const h = w * 0.92;
  const top = c.y - h * 0.42;
  return (
    `M${pt({ x: c.x, y: c.y + h * 0.5 })}` +
    `C${pt({ x: c.x - w * 0.62, y: c.y + h * 0.05 })} ${pt({ x: c.x - w * 0.55, y: top - h * 0.18 })} ${pt({ x: c.x - w * 0.25, y: top - h * 0.08 })}` +
    `C${pt({ x: c.x - w * 0.1, y: top - h * 0.04 })} ${pt({ x: c.x, y: top + h * 0.06 })} ${pt({ x: c.x, y: top + h * 0.12 })}` +
    `C${pt({ x: c.x, y: top + h * 0.06 })} ${pt({ x: c.x + w * 0.1, y: top - h * 0.04 })} ${pt({ x: c.x + w * 0.25, y: top - h * 0.08 })}` +
    `C${pt({ x: c.x + w * 0.55, y: top - h * 0.18 })} ${pt({ x: c.x + w * 0.62, y: c.y + h * 0.05 })} ${pt({ x: c.x, y: c.y + h * 0.5 })}Z`
  );
}

/** Rolling hill along the bottom of a layer box. */
function hill(width: number, height: number, crest: number, bumps: number, seed: number): string {
  const rand = seededRandom(seed);
  let d = `M0 ${fmt(height)}V${fmt(crest + 14)}`;
  const step = width / bumps;
  for (let i = 0; i < bumps; i++) {
    const x0 = i * step;
    const lift = crest - 6 - rand() * 18;
    d += `C${fmt(x0 + step * 0.3)} ${fmt(lift)} ${fmt(x0 + step * 0.7)} ${fmt(lift)} ${fmt(x0 + step)} ${fmt(crest + 8 + rand() * 6)}`;
  }
  return `${d}V${fmt(height)}Z`;
}

function wildflowers(width: number, ground: number, count: number, seed: number, colors: string[]): PopShape[] {
  const rand = seededRandom(seed);
  let stems = '';
  const heads: PopShape[] = [];
  for (let i = 0; i < count; i++) {
    const x = 14 + ((width - 28) * (i + rand() * 0.6)) / count;
    const h = 26 + rand() * 46;
    const top = { x: x + (rand() - 0.5) * 12, y: ground - h };
    stems += `M${fmt(x)} ${fmt(ground)}Q${fmt(x + 4)} ${fmt(ground - h / 2)} ${pt(top)}`;
    stems += leaf({ x, y: ground - h * 0.35 }, { x: x + (i % 2 ? 12 : -12), y: ground - h * 0.55 }, 4);
    heads.push({ d: blossom(top, 6 + rand() * 4, rand() * Math.PI), fill: colors[i % colors.length] });
  }
  return [{ d: stems, fill: 'none', stroke: LEAF, strokeWidth: 1.3 }, ...heads];
}

function tower(x: number, w: number, h: number, base: number, spire = false): string {
  let d = rectPath(x, base - h, w, h);
  if (spire) {
    d += `M${fmt(x + w / 2 - 3)} ${fmt(base - h)}L${fmt(x + w / 2)} ${fmt(base - h - 26)}L${fmt(x + w / 2 + 3)} ${fmt(base - h)}Z`;
  }
  return d;
}

function windows(x: number, w: number, h: number, base: number, seed: number): string {
  const rand = seededRandom(seed);
  let d = '';
  for (let yy = base - h + 10; yy < base - 8; yy += 11) {
    for (let xx = x + 5; xx < x + w - 5; xx += 8) {
      if (rand() > 0.45) d += rectPath(xx, yy, 3, 4);
    }
  }
  return d;
}

function tulip(base: Point, h: number, color: string): PopShape[] {
  const head = { x: base.x, y: base.y - h };
  const cup =
    `M${pt({ x: head.x - 9, y: head.y - 10 })}L${pt({ x: head.x - 4, y: head.y - 3 })}L${pt({ x: head.x, y: head.y - 12 })}` +
    `L${pt({ x: head.x + 4, y: head.y - 3 })}L${pt({ x: head.x + 9, y: head.y - 10 })}` +
    `Q${pt({ x: head.x + 10, y: head.y + 6 })} ${pt({ x: head.x, y: head.y + 7 })}Q${pt({ x: head.x - 10, y: head.y + 6 })} ${pt({ x: head.x - 9, y: head.y - 10 })}Z`;
  return [
    { d: `M${pt(base)}L${pt(head)}`, fill: 'none', stroke: LEAF, strokeWidth: 2 },
    { d: lensPath(base, { x: base.x + 14, y: base.y - h * 0.6 }, 7) + lensPath(base, { x: base.x - 12, y: base.y - h * 0.5 }, 6), fill: LEAF },
    { d: cup, fill: color },
  ];
}

const SCENES: Record<PopupScene, (p: Palette) => PopLayer[]> = {
  meadow: (p) => [
    {
      foot: 296,
      height: 200,
      shapes: [],
      texts: [{ content: 'date', x: 200, y: 130, size: 112, fill: p.surface, stroke: p.accent, font: 'display' }],
    },
    {
      foot: 318,
      height: 150,
      shapes: [
        { d: circlePath({ x: 178, y: 78 }, 40) + circlePath({ x: 178, y: 78 }, 34), fill: p.accent, evenOdd: true },
        { d: circlePath({ x: 222, y: 78 }, 40) + circlePath({ x: 222, y: 78 }, 34), fill: p.primary, evenOdd: true },
        { d: `M222 30L230 38L222 46L214 38Z`, fill: p.surface, stroke: p.primary, strokeWidth: 1.5 },
      ],
    },
    {
      foot: 350,
      height: 118,
      shapes: [
        { d: hill(400, 118, 48, 3, 4), fill: p.surface, stroke: '#00000018', strokeWidth: 1 },
        ...wildflowers(400, 108, 14, 9, [PETAL, PEACH, p.accent, '#ffffff']),
      ],
    },
  ],
  lotus: (p) => [
    {
      foot: 292,
      height: 210,
      shapes: [
        { d: circlePath({ x: 200, y: 92 }, 74), fill: p.primary },
        { d: circlePath({ x: 200, y: 92 }, 64), fill: 'none', stroke: p.accent, strokeWidth: 2 },
      ],
      texts: [{ content: 'monogram', x: 200, y: 98, size: 36, fill: p.accent, font: 'accent' }],
    },
    {
      foot: 322,
      height: 190,
      shapes: [
        { d: 'M118 190Q114 140 104 100M200 190Q202 150 200 116M282 190Q288 146 300 110', fill: 'none', stroke: LEAF_DARK, strokeWidth: 3 },
        { d: lotusBloom({ x: 200, y: 122 }, 40), fill: PETAL, stroke: '#c9677c', strokeWidth: 1 },
        { d: lensPath({ x: 104, y: 104 }, { x: 98, y: 62 }, 20), fill: PETAL, stroke: '#c9677c', strokeWidth: 1 },
        { d: lotusBloom({ x: 300, y: 116 }, 32), fill: '#f6c6cf', stroke: '#c9677c', strokeWidth: 1 },
        { d: ellipsePath({ x: 100, y: 150 }, 46, 15) + ellipsePath({ x: 306, y: 160 }, 40, 13), fill: LEAF },
      ],
    },
    {
      foot: 348,
      height: 70,
      shapes: [
        { d: ellipsePath({ x: 62, y: 52 }, 60, 16) + ellipsePath({ x: 330, y: 50 }, 66, 17) + ellipsePath({ x: 200, y: 58 }, 54, 12), fill: LEAF },
        { d: lotusBloom({ x: 110, y: 40 }, 26) + lotusBloom({ x: 288, y: 42 }, 24), fill: PETAL, stroke: '#c9677c', strokeWidth: 1 },
      ],
    },
  ],
  arbor: (p) => {
    const outer = `M85 196V114A115 115 0 0 1 315 114V196H289V118A89 89 0 0 0 111 118V196Z`;
    let leaves = '';
    let blooms = '';
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI + (i * Math.PI) / 18;
      const c = { x: 200 + 102 * Math.cos(a), y: 116 + 102 * Math.sin(a) };
      leaves += leaf(c, { x: c.x + 15 * Math.cos(a + 1), y: c.y + 15 * Math.sin(a + 1) }, 5);
      if (i % 3 === 0) blooms += blossom(c, 10, i);
    }
    return [
      {
        foot: 300,
        height: 196,
        shapes: [
          { d: outer, fill: p.surface, stroke: p.accent, strokeWidth: 1.2 },
          { d: leaves, fill: LEAF },
          { d: blooms, fill: PETAL },
        ],
        texts: [{ content: 'monogram', x: 200, y: 132, size: 36, fill: p.primary, font: 'accent' }],
      },
      {
        foot: 336,
        height: 120,
        shapes: [
          {
            d: [26, 58, 90, 310, 342, 374].map((x, i) => circlePath({ x, y: 72 - (i % 2) * 12 }, 30)).join(''),
            fill: LEAF,
          },
          { d: [40, 82, 324, 360].map((x, i) => blossom({ x, y: 54 + (i % 2) * 18 }, 11, i)).join(''), fill: PETAL },
          { d: [62, 344].map((x) => blossom({ x, y: 86 }, 9, 1)).join(''), fill: '#ffffff' },
        ],
      },
    ];
  },
  skyline: (p) => {
    const towers: Array<[number, number, number, boolean?]> = [
      [20, 34, 84], [58, 26, 116], [88, 40, 94], [132, 22, 136, true], [158, 44, 104], [206, 30, 146, true],
      [240, 46, 88], [290, 28, 124], [322, 36, 100], [362, 30, 76],
    ];
    const base = 210;
    return [
      {
        foot: 292,
        height: 230,
        shapes: [
          { d: circlePath({ x: 318, y: 46 }, 30), fill: '#f2d58a' },
          { d: towers.map(([x, w, h, s]) => tower(x, w, h, base, s)).join(''), fill: p.primary },
          { d: towers.map(([x, w, h], i) => windows(x, w, h, base, i + 1)).join(''), fill: '#f6e3a8' },
        ],
      },
      {
        foot: 318,
        height: 100,
        shapes: [
          { d: [30, 76, 124, 280, 330, 372].map((x, i) => circlePath({ x, y: 50 - (i % 2) * 10 }, 26)).join(''), fill: LEAF },
          { d: [30, 76, 124, 280, 330, 372].map((x) => rectPath(x - 2, 66, 4, 34)).join(''), fill: '#6b5236' },
        ],
      },
      {
        foot: 348,
        height: 64,
        shapes: [
          { d: 'M0 64V22C40 12 60 30 100 22S160 12 200 22S260 32 300 22S360 12 400 22V64Z', fill: WATER },
          { d: 'M30 40q12 -6 24 0M140 46q12 -6 24 0M250 38q12 -6 24 0M330 48q12 -6 24 0', fill: 'none', stroke: '#ffffff', strokeWidth: 2 },
          { d: 'M180 26h44l-8 10h-28z M200 26v-22l16 18z', fill: p.surface, stroke: p.primary, strokeWidth: 1.2 },
        ],
      },
    ];
  },
  hearts: (p) => [
    {
      foot: 296,
      height: 210,
      shapes: [{ d: heartPath({ x: 200, y: 122 }, 184), fill: p.primary }],
      texts: [{ content: 'names', x: 200, y: 122, size: 30, fill: p.surface, font: 'accent' }],
    },
    {
      foot: 318,
      height: 170,
      shapes: [
        { d: 'M74 170Q70 120 82 80M326 170Q330 116 316 70', fill: 'none', stroke: p.accent, strokeWidth: 1.4 },
        { d: heartPath({ x: 82, y: 56 }, 54), fill: PETAL },
        { d: heartPath({ x: 316, y: 46 }, 48), fill: p.accent },
      ],
    },
    {
      foot: 346,
      height: 96,
      shapes: [36, 88, 140, 260, 312, 364].flatMap((x, i) => tulip({ x, y: 96 }, 44 + (i % 3) * 12, i % 2 ? PETAL : p.accent)),
    },
  ],
};

export function popupLayers(scene: PopupScene, palette: Palette): PopLayer[] {
  return SCENES[scene](palette);
}
