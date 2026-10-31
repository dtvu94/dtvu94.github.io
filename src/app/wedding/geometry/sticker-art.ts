import { blossom } from './motifs';
import { cornerSpray, drawnBow } from './envelope-art';
import { fmt } from './path-kit';

/**
 * Line art for the editor's stickers that have no card ornament of their
 * own: chữ Hỷ, a pair of swallows, a ribbon bow, an apricot blossom and a
 * flowering sprig. Each comes with its viewBox; filled parts and stroked
 * parts are kept apart.
 */
export interface StickerArt {
  box: string;
  /** Filled shapes. */
  fill: string;
  /** Stroked lines (round caps), with their width in box units. */
  stroke?: string;
  strokeWidth?: number;
}

function rect(x: number, y: number, w: number, h: number): string {
  return `M${fmt(x)} ${fmt(y)}h${fmt(w)}v${fmt(h)}h${fmt(-w)}Z`;
}

/** A square "口" outline: four bars of thickness t. */
function box(x: number, y: number, w: number, h: number, t: number): string {
  return rect(x, y, w, t) + rect(x, y + h - t, w, t) + rect(x, y, t, h) + rect(x + w - t, y, t, h);
}

/** One 喜 in a 46-wide column starting at x0 (the shared bars are drawn by `hy`). */
function hyHalf(x0: number): string {
  const t = 6;
  const mid = x0 + 23;
  return (
    // 士: the cross-bar's upright, and its shorter lower bar.
    rect(mid - t / 2, 2, t, 22) +
    rect(x0 + 8, 18, 30, 5) +
    // Upper 口.
    box(x0 + 9, 28, 28, 17, 5) +
    // 丷: two short strokes leaning in.
    `M${fmt(x0 + 11)} 49l5 0l4 7l-5 0Z` +
    `M${fmt(x0 + 35)} 49l-5 0l-4 7l5 0Z` +
    // Lower 口.
    box(x0 + 9, 71, 28, 25, 5)
  );
}

/** 囍 — song hỷ, double happiness — built from bars in a 100 × 100 box. */
export function hy(): StickerArt {
  // The top bars of the two 喜 and the long bar above the lower boxes run across both.
  const shared = rect(4, 6, 92, 6) + rect(2, 60, 96, 6);
  return { box: '0 0 100 100', fill: shared + hyHalf(4) + hyHalf(50) };
}

/** One swallow in flight, facing right, in a 60 × 38 box. */
function swallow(): string {
  return (
    'M58 15C53 11 47 10.5 41 13.5' +
    'C35 6 25 1.5 12 0.5C21 6 27.5 11 31 16' +
    'C23 17.5 13 21 1.5 29C9.5 26.5 15.5 25.5 20.5 25.5' +
    'C13.5 29.5 8.5 33.5 4 37.5C15.5 34 27 27.5 36.5 23' +
    'C44 21 51.5 18.5 58 15Z'
  );
}

/** A pair of swallows facing each other (chim én — spring and a happy union). */
export function birds(): StickerArt {
  const one = swallow();
  // The second bird mirrored across x = 64, a little higher.
  const mirrored = one.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${fmt(128 - Number(x))} ${fmt(Number(y) - 4)}`);
  return { box: '0 -6 128 46', fill: one + mirrored };
}

export function ribbon(): StickerArt {
  return { box: '0 4 100 82', fill: '', stroke: drawnBow({ x: 50, y: 30 }, 40), strokeWidth: 3 };
}

export function apricotBlossom(): StickerArt {
  return { box: '0 0 100 100', fill: blossom({ x: 50, y: 50 }, 46, -Math.PI / 2) };
}

/** A sprig of leaves and blossoms rising from the lower left. */
export function blossomSprig(): StickerArt {
  const spray = cornerSpray({ x: 8, y: 92 }, -0.78, 96, 5);
  return { box: '0 0 100 100', fill: spray.fill, stroke: spray.stroke, strokeWidth: spray.strokeWidth };
}

const ART: Record<string, () => StickerArt> = { hy, birds, ribbon, blossom: apricotBlossom, branch: blossomSprig };
const cache = new Map<string, StickerArt>();

/** Art for a sticker kind drawn here, or null for the card ornaments, logo, heart, text and photos. */
export function stickerArt(kind: string): StickerArt | null {
  const make = ART[kind];
  if (!make) {
    return null;
  }
  let art = cache.get(kind);
  if (!art) {
    art = make();
    cache.set(kind, art);
  }
  return art;
}
