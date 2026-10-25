import { CardShape, EnvelopeFlap, PocketWindow } from '../data/wedding.types';
import {
  Point,
  circlePath,
  ellipsePath,
  fmt,
  pt,
  rectPath,
  roundedRectPath,
  scallopDepth,
  scallopLoop,
  seededRandom,
  subdivide,
} from './path-kit';

/** Every flat card is designed at 400 × 560 and scaled by app-scene-frame. */
export const CARD_W = 400;
export const CARD_H = 560;

export interface Silhouette {
  /** Outline for `clip-path: path(...)`, in card pixels. */
  d: string;
  /** Pierced shapes need the even-odd rule. */
  evenOdd: boolean;
  /** Extra padding (px) that keeps the copy clear of the cut edge. */
  inset: { top: number; side: number; bottom: number };
}

const NONE = { top: 0, side: 0, bottom: 0 };

function rectCorners(d: number, w = CARD_W, h = CARD_H): Point[] {
  return [
    { x: d, y: d },
    { x: w - d, y: d },
    { x: w - d, y: h - d },
    { x: d, y: h - d },
  ];
}

function scallopRect(pitch: number, roundness = 1): string {
  const depth = scallopDepth(pitch, roundness);
  return scallopLoop(subdivide(rectCorners(depth), pitch), { roundness });
}

function ellipsePoints(c: Point, rx: number, ry: number, pitch: number): Point[] {
  // Ramanujan's perimeter approximation is plenty for spacing scallops.
  const h = ((rx - ry) / (rx + ry)) ** 2;
  const perimeter = Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  const count = Math.round(perimeter / pitch);
  return Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    return { x: c.x + rx * Math.cos(a), y: c.y + ry * Math.sin(a) };
  });
}

function deckle(seed: number): string {
  const rand = seededRandom(seed);
  const pts: Point[] = [];
  const jag = () => 1 + rand() * 4.5;
  for (let x = 0; x < CARD_W; x += 5) pts.push({ x, y: jag() });
  for (let y = 0; y < CARD_H; y += 5) pts.push({ x: CARD_W - jag(), y });
  for (let x = CARD_W; x > 0; x -= 5) pts.push({ x, y: CARD_H - jag() });
  for (let y = CARD_H; y > 0; y -= 5) pts.push({ x: jag(), y });
  return `M${pts.map(pt).join('L')}Z`;
}

function stepped(step: number): string {
  const s = step;
  const w = CARD_W;
  const h = CARD_H;
  return (
    `M${2 * s} 0H${w - 2 * s}V${s}H${w - s}V${2 * s}H${w}V${h - 2 * s}H${w - s}V${h - s}H${w - 2 * s}V${h}` +
    `H${2 * s}V${h - s}H${s}V${h - 2 * s}H0V${2 * s}H${s}V${s}H${2 * s}Z`
  );
}

function ticket(r: number): string {
  const w = CARD_W;
  const h = CARD_H;
  const a = `A${r} ${r} 0 0 0`;
  return `M${r} 0H${w - r}${a} ${w} ${r}V${h - r}${a} ${w - r} ${h}H${r}${a} 0 ${h - r}V${r}${a} ${r} 0Z`;
}

function octagon(cut: number): string {
  const w = CARD_W;
  const h = CARD_H;
  return `M${cut} 0H${w - cut}L${w} ${cut}V${h - cut}L${w - cut} ${h}H${cut}L0 ${h - cut}V${cut}Z`;
}

function doily(): string {
  const c = { x: CARD_W / 2, y: CARD_H / 2 };
  const outer = scallopLoop(ellipsePoints(c, 191, 271, 17));
  const holes = ellipsePoints(c, 177, 257, 13)
    .map((p) => circlePath(p, 2.4))
    .join('');
  return outer + holes;
}

const SILHOUETTES: Record<CardShape, () => Silhouette> = {
  rect: () => ({ d: rectPath(0, 0, CARD_W, CARD_H), evenOdd: false, inset: NONE }),
  rounded: () => ({ d: roundedRectPath(0, 0, CARD_W, CARD_H, 22), evenOdd: false, inset: NONE }),
  scallop: () => ({ d: scallopRect(40), evenOdd: false, inset: { top: 10, side: 10, bottom: 10 } }),
  scallopFine: () => ({ d: scallopRect(18), evenOdd: false, inset: { top: 4, side: 4, bottom: 4 } }),
  cloud: () => ({ d: scallopRect(60, 1.12), evenOdd: false, inset: { top: 26, side: 22, bottom: 26 } }),
  archTop: () => ({
    d: `M0 ${CARD_H}V200A200 200 0 0 1 ${CARD_W} 200V${CARD_H}Z`,
    evenOdd: false,
    inset: { top: 56, side: 0, bottom: 0 },
  }),
  oval: () => ({
    d: ellipsePath({ x: CARD_W / 2, y: CARD_H / 2 }, CARD_W / 2, CARD_H / 2),
    evenOdd: false,
    inset: { top: 34, side: 20, bottom: 30 },
  }),
  doily: () => ({ d: doily(), evenOdd: true, inset: { top: 44, side: 28, bottom: 40 } }),
  octagon: () => ({ d: octagon(44), evenOdd: false, inset: { top: 6, side: 4, bottom: 6 } }),
  ticket: () => ({ d: ticket(30), evenOdd: false, inset: NONE }),
  deckle: () => ({ d: deckle(23), evenOdd: false, inset: NONE }),
  stepped: () => ({ d: stepped(14), evenOdd: false, inset: { top: 4, side: 4, bottom: 4 } }),
};

const silhouetteCache = new Map<CardShape, Silhouette>();

export function cardSilhouette(shape: CardShape): Silhouette {
  let s = silhouetteCache.get(shape);
  if (!s) {
    s = SILHOUETTES[shape]();
    silhouetteCache.set(shape, s);
  }
  return s;
}

/** CSS `clip-path` value for a silhouette ('' for plain rectangles). */
export function clipPathCss(shape: CardShape): string {
  if (shape === 'rect') {
    return '';
  }
  const s = cardSilhouette(shape);
  return `path(${s.evenOdd ? 'evenodd, ' : ''}'${s.d}')`;
}

// ── envelopes ───────────────────────────────────────────────────────────────

/** Envelope body in design pixels (C6-like proportions). */
export const ENV_W = 470;
export const ENV_H = 330;

export interface EnvelopeGeometry {
  /** Outer face of the closed flap, hanging from the top edge (y = 0). */
  flap: string;
  /** How far the flap reaches down when closed. */
  flapDepth: number;
  /** Front pocket seen from the back: everything but the top opening. */
  pocket: string;
  /** Seam lines (side and bottom flaps) drawn on the pocket. */
  seams: string;
  /** Where the seal sits on the closed flap. */
  sealAt: Point;
}

export function envelopeGeometry(flap: EnvelopeFlap, w = ENV_W, h = ENV_H): EnvelopeGeometry {
  const cx = w / 2;
  const vPocket =
    `M0 0Q${fmt(w * 0.24)} ${fmt(h * 0.36)} ${fmt(cx)} ${fmt(h * 0.5)}` +
    `Q${fmt(w * 0.76)} ${fmt(h * 0.36)} ${fmt(w)} 0V${fmt(h)}H0Z`;
  const vSeams =
    `M0 ${fmt(h)}Q${fmt(cx)} ${fmt(h * 0.36)} ${fmt(w)} ${fmt(h)}` +
    `M0 0Q${fmt(w * 0.24)} ${fmt(h * 0.36)} ${fmt(cx)} ${fmt(h * 0.5)}` +
    `M${fmt(w)} 0Q${fmt(w * 0.76)} ${fmt(h * 0.36)} ${fmt(cx)} ${fmt(h * 0.5)}`;

  switch (flap) {
    case 'pointed': {
      const d = h * 0.58;
      return {
        flap: `M0 0H${fmt(w)}L${fmt(cx + 16)} ${fmt(d - 7)}Q${fmt(cx)} ${fmt(d + 2)} ${fmt(cx - 16)} ${fmt(d - 7)}Z`,
        flapDepth: d,
        pocket: vPocket,
        seams: vSeams,
        sealAt: { x: cx, y: d - 18 },
      };
    }
    case 'straight': {
      const d = h * 0.52;
      return {
        flap: `M0 0H${fmt(w)}L${fmt(cx)} ${fmt(d)}Z`,
        flapDepth: d,
        pocket: vPocket,
        seams: vSeams,
        sealAt: { x: cx, y: d - 26 },
      };
    }
    case 'arch': {
      const d = h * 0.56;
      return {
        flap: `M0 0H${fmt(w)}V10A${fmt(cx)} ${fmt(d - 10)} 0 0 1 0 10Z`,
        flapDepth: d,
        pocket: vPocket,
        seams: vSeams,
        sealAt: { x: cx, y: d - 30 },
      };
    }
    case 'cloud': {
      const d = h * 0.52;
      const side = h * 0.2;
      return {
        flap:
          `M0 0H${fmt(w)}V${fmt(side)}` +
          `C${fmt(w)} ${fmt(side + 46)} ${fmt(w * 0.7)} ${fmt(side + 52)} ${fmt(w * 0.66)} ${fmt(d * 0.78)}` +
          `C${fmt(w * 0.63)} ${fmt(d + 4)} ${fmt(w * 0.37)} ${fmt(d + 4)} ${fmt(w * 0.34)} ${fmt(d * 0.78)}` +
          `C${fmt(w * 0.3)} ${fmt(side + 52)} 0 ${fmt(side + 46)} 0 ${fmt(side)}Z`,
        flapDepth: d,
        pocket: vPocket,
        seams: vSeams,
        sealAt: { x: cx, y: d - 30 },
      };
    }
    case 'rounded': {
      const d = h * 0.46;
      const r = 26;
      return {
        flap: `M0 0H${fmt(w)}V${fmt(d - r)}Q${fmt(w)} ${fmt(d)} ${fmt(w - r)} ${fmt(d)}H${r}Q0 ${fmt(d)} 0 ${fmt(d - r)}Z`,
        flapDepth: d,
        pocket: `M0 ${fmt(h * 0.08)}H${fmt(w)}V${fmt(h)}H0Z`,
        seams: `M0 ${fmt(h * 0.08)}L${fmt(w * 0.07)} ${fmt(h)}M${fmt(w)} ${fmt(h * 0.08)}L${fmt(w * 0.93)} ${fmt(h)}`,
        sealAt: { x: cx, y: d - 30 },
      };
    }
    case 'tuck': {
      const d = h * 0.24;
      const r = 16;
      const notch = 34;
      const top = h * 0.1;
      return {
        flap: `M0 0H${fmt(w)}V${fmt(d - r)}Q${fmt(w)} ${fmt(d)} ${fmt(w - r)} ${fmt(d)}H${r}Q0 ${fmt(d)} 0 ${fmt(d - r)}Z`,
        flapDepth: d,
        pocket:
          `M0 ${fmt(top)}H${fmt(cx - notch)}A${notch} ${notch} 0 0 0 ${fmt(cx + notch)} ${fmt(top)}` +
          `H${fmt(w)}V${fmt(h)}H0Z`,
        seams: '',
        sealAt: { x: cx, y: d - 22 },
      };
    }
  }
}

// ── sleeves & pockets ───────────────────────────────────────────────────────

/** A sleeve is slightly larger than the 400 × 560 card it holds. */
export const SLEEVE_W = 424;
export const SLEEVE_H = 586;

export interface WindowGeometry {
  d: string;
  /** Bounding box of the window, for placing shutters. */
  box: { x: number; y: number; w: number; h: number };
}

export function sleeveWindow(window: PocketWindow): WindowGeometry | null {
  const cx = SLEEVE_W / 2;
  switch (window) {
    case 'arch':
    case 'shutters': {
      const w = window === 'arch' ? 196 : 150;
      const h = window === 'arch' ? 250 : 190;
      const x = cx - w / 2;
      const y = window === 'arch' ? 132 : 176;
      const r = w / 2;
      return {
        d: `M${fmt(x)} ${fmt(y + h)}V${fmt(y + r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + w)} ${fmt(y + r)}V${fmt(y + h)}Z`,
        box: { x, y, w, h },
      };
    }
    case 'rect':
      return { d: roundedRectPath(cx - 130, 150, 260, 210, 14), box: { x: cx - 130, y: 150, w: 260, h: 210 } };
    case 'circle':
      return { d: circlePath({ x: cx, y: 250 }, 104), box: { x: cx - 104, y: 146, w: 208, h: 208 } };
    case 'none':
      return null;
  }
}

/** Sleeve outline with its thumb notch, plus the window as an even-odd hole. */
export function sleevePath(window: PocketWindow): string {
  const notch = 30;
  const cx = SLEEVE_W / 2;
  const body =
    `M0 0H${fmt(cx - notch)}A${notch} ${notch} 0 0 0 ${fmt(cx + notch)} 0` +
    `H${SLEEVE_W}V${SLEEVE_H}H0Z`;
  return body + (sleeveWindow(window)?.d ?? '');
}

/** Wave-topped lower pocket of a 400 × 560 card; top of the wave at `top`. */
export function lowerPocketPath(top: number): string {
  const w = CARD_W;
  const h = CARD_H;
  return (
    `M0 ${fmt(top + 26)}C${fmt(w * 0.16)} ${fmt(top - 6)} ${fmt(w * 0.3)} ${fmt(top + 40)} ${fmt(w * 0.5)} ${fmt(top + 16)}` +
    `C${fmt(w * 0.7)} ${fmt(top - 8)} ${fmt(w * 0.84)} ${fmt(top + 34)} ${fmt(w)} ${fmt(top + 8)}` +
    `V${fmt(h)}H0Z`
  );
}
