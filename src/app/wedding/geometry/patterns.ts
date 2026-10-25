import { EnvelopeLiner, PaperStock } from '../data/wedding.types';
import { Point, circlePath, fmt, lensPath, petalPath, polar, pt } from './path-kit';
import { blossom, lotusBloom } from './motifs';

/**
 * Repeating artwork rendered as CSS background images: envelope liners
 * (giấy lót) and paper-stock textures. Everything is plain SVG in a data URI,
 * so the browser rasterises each tile once and repeats it for free.
 */

export function svgDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function tile(size: number, body: string, height = size): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}">${body}</svg>`;
}

// ── liner motifs (line art, stroked in the liner ink) ──────────────────────

function outlineBlossom(c: Point, r: number, rotation: number): string {
  let d = circlePath(c, r * 0.16);
  for (let i = 0; i < 5; i++) {
    const a = rotation + (i * 2 * Math.PI) / 5;
    d += petalPath(polar(c, r * 0.24, a), polar(c, r, a), r * 0.7);
  }
  return d;
}

function sprig(base: Point, angle: number, len: number): string {
  const tip = polar(base, len, angle);
  let d = `M${pt(base)}L${pt(tip)}`;
  for (const t of [0.35, 0.6, 0.85]) {
    const at = polar(base, len * t, angle);
    d += lensPath(at, polar(at, len * 0.32, angle - 0.7), len * 0.13);
    d += lensPath(at, polar(at, len * 0.32, angle + 0.7), len * 0.13);
  }
  return d;
}

function cloudScroll(c: Point, s: number): string {
  // Stylised auspicious cloud (mây lành): a lobed base with two curls.
  const l = { x: c.x - s, y: c.y };
  const r = { x: c.x + s, y: c.y };
  return (
    `M${pt(l)}A${fmt(s * 0.5)} ${fmt(s * 0.5)} 0 1 1 ${pt({ x: c.x, y: c.y })}` +
    `A${fmt(s * 0.5)} ${fmt(s * 0.5)} 0 1 1 ${pt(r)}` +
    `M${pt({ x: c.x - s * 0.5, y: c.y })}a${fmt(s * 0.22)} ${fmt(s * 0.22)} 0 1 0 ${fmt(s * 0.22)} ${fmt(-s * 0.22)}` +
    `M${pt({ x: c.x + s * 0.5, y: c.y })}a${fmt(s * 0.22)} ${fmt(s * 0.22)} 0 1 1 ${fmt(-s * 0.22)} ${fmt(-s * 0.22)}` +
    `M${pt({ x: l.x - s * 0.3, y: c.y + s * 0.18 })}H${fmt(r.x + s * 0.3)}`
  );
}

function stroke(d: string, ink: string, width: number, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
}

function fill(d: string, ink: string, opacity = 1): string {
  return `<path d="${d}" fill="${ink}" opacity="${opacity}"/>`;
}

const LINERS: Record<Exclude<EnvelopeLiner, 'none' | 'solid'>, (bg: string, ink: string) => string> = {
  floral: (bg, ink) =>
    tile(
      140,
      `<rect width="140" height="140" fill="${bg}"/>` +
        stroke(outlineBlossom({ x: 36, y: 38 }, 15, 0.3) + outlineBlossom({ x: 106, y: 104 }, 12, 1.1), ink, 1.1) +
        stroke(sprig({ x: 92, y: 30 }, -0.4, 34) + sprig({ x: 26, y: 112 }, 2.6, 30), ink, 1, 0.8) +
        fill(circlePath({ x: 70, y: 72 }, 1.8) + circlePath({ x: 12, y: 70 }, 1.4) + circlePath({ x: 128, y: 12 }, 1.4), ink, 0.7),
    ),
  goldFlora: (bg, ink) =>
    tile(
      180,
      `<rect width="180" height="180" fill="${bg}"/>` +
        stroke(
          outlineBlossom({ x: 52, y: 54 }, 26, 0.2) +
            outlineBlossom({ x: 52, y: 54 }, 14, 0.8) +
            outlineBlossom({ x: 136, y: 132 }, 20, 1.3) +
            sprig({ x: 80, y: 80 }, 0.8, 58) +
            sprig({ x: 122, y: 30 }, -0.9, 40) +
            sprig({ x: 30, y: 150 }, 2.2, 42),
          ink,
          1.2,
        ) + fill(circlePath({ x: 160, y: 70 }, 2.2) + circlePath({ x: 96, y: 160 }, 2.2), ink, 0.85),
    ),
  lotus: (bg, ink) =>
    tile(
      120,
      `<rect width="120" height="120" fill="${bg}"/>` +
        stroke(lotusBloom({ x: 32, y: 50 }, 34) + lotusBloom({ x: 92, y: 110 }, 34), ink, 1.1) +
        stroke(`M8 52H56M68 112H116`, ink, 1, 0.6),
    ),
  damask: (bg, ink) => {
    let flowers = '';
    for (const c of [
      { x: 0, y: 0 },
      { x: 56, y: 0 },
      { x: 0, y: 56 },
      { x: 56, y: 56 },
      { x: 28, y: 28 },
    ]) {
      flowers += blossom(c, 7, 0, 4);
    }
    return tile(
      56,
      `<rect width="56" height="56" fill="${bg}"/>` +
        stroke('M0 28L28 0L56 28L28 56Z', ink, 0.9, 0.7) +
        fill(flowers, ink, 0.85),
    );
  },
  stripe: (bg, ink) =>
    tile(24, `<rect width="24" height="24" fill="${bg}"/>` + stroke('M-6 30L30 -6M-18 18L18 -18M6 42L42 6', ink, 5, 0.9)),
  sprig: (bg, ink) =>
    tile(
      100,
      `<rect width="100" height="100" fill="${bg}"/>` +
        stroke(sprig({ x: 18, y: 40 }, -0.8, 30) + sprig({ x: 66, y: 92 }, -2.2, 28) + sprig({ x: 70, y: 30 }, 0.4, 24), ink, 1.1),
    ),
  clouds: (bg, ink) =>
    tile(
      120,
      `<rect width="120" height="120" fill="${bg}"/>` +
        stroke(cloudScroll({ x: 34, y: 36 }, 20) + cloudScroll({ x: 94, y: 96 }, 20), ink, 1.4),
    ),
};

const linerCache = new Map<string, string>();

/** CSS background for a liner, or a flat colour for 'solid' / 'none'. */
export function linerBackground(kind: EnvelopeLiner, bg: string, ink: string): string {
  if (kind === 'none' || kind === 'solid') {
    return bg;
  }
  const key = `${kind}|${bg}|${ink}`;
  let css = linerCache.get(key);
  if (!css) {
    css = `${svgDataUri(LINERS[kind](bg, ink))} ${bg}`;
    linerCache.set(key, css);
  }
  return css;
}

// ── paper stocks ────────────────────────────────────────────────────────────

const NOISE = (frequency: string, octaves: number, alpha: number, extra = '') =>
  tile(
    200,
    `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="${octaves}" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 ${alpha} 0"/>${extra}</filter>` +
      `<rect width="200" height="200" filter="url(#n)"/>`,
  );

/** Felt / hammered paper: noise turned into lit bumps. */
const FELT = tile(
  200,
  `<filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="3" stitchTiles="stitch" result="t"/>` +
    `<feDiffuseLighting in="t" surfaceScale="1.6" lighting-color="#fff" result="l"><feDistantLight azimuth="225" elevation="56"/></feDiffuseLighting>` +
    `<feColorMatrix in="l" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.55 0 0 0 0.47"/></filter>` +
    `<rect width="200" height="200" filter="url(#f)"/>`,
);

const LINEN = tile(
  6,
  `<path d="M0 .5H6M0 3.5H6" stroke="#000" stroke-opacity=".05"/><path d="M.5 0V6M3.5 0V6" stroke="#fff" stroke-opacity=".08"/>`,
);

const KRAFT = tile(
  220,
  `<filter id="k" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.5" numOctaves="2" seed="4" stitchTiles="stitch"/>` +
    `<feColorMatrix values="0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0 0.1 0 0 0 0.7 -0.12"/></filter>` +
    `<rect width="220" height="220" filter="url(#k)"/>` +
    Array.from({ length: 26 }, (_, i) => {
      const x = (i * 83) % 220;
      const y = (i * 137) % 220;
      return `<circle cx="${x}" cy="${y}" r="${0.5 + (i % 3) * 0.35}" fill="#3a2a14" fill-opacity=".35"/>`;
    }).join(''),
);

/** Texture layers for each stock (stack above the paper colour). */
export const STOCK_TEXTURE: Record<PaperStock, string> = {
  smooth: '',
  cotton: svgDataUri(NOISE('0.85', 3, 0.16)),
  felt: `${svgDataUri(FELT)}, ${svgDataUri(NOISE('0.9', 2, 0.08))}`,
  linen: `${svgDataUri(LINEN)}, ${svgDataUri(NOISE('0.7', 2, 0.1))}`,
  pearl:
    'linear-gradient(115deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.38) 42%, rgba(232,226,255,0.22) 52%, rgba(255,255,255,0) 70%), ' +
    svgDataUri(NOISE('1.1', 2, 0.07)),
  kraft: svgDataUri(KRAFT),
};
