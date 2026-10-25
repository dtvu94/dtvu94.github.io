import { CardShape, EnvelopeFlap, PocketWindow } from '../data/wedding.types';
import { blossomBranch, laurelWreath, lotusRow, vine } from './motifs';
import { Track, scallopDepth, seededRandom } from './path-kit';
import { STOCK_TEXTURE, linerBackground } from './patterns';
import { reliefArt } from './relief-art';
import {
  CARD_H,
  CARD_W,
  ENV_H,
  ENV_W,
  SLEEVE_H,
  SLEEVE_W,
  cardSilhouette,
  clipPathCss,
  envelopeGeometry,
  lowerPocketPath,
  sleevePath,
  sleeveWindow,
} from './shapes';

const SHAPES: CardShape[] = [
  'rect', 'rounded', 'scallop', 'scallopFine', 'cloud', 'archTop', 'oval', 'doily', 'octagon', 'ticket', 'deckle', 'stepped',
];
const FLAPS: EnvelopeFlap[] = ['pointed', 'arch', 'cloud', 'rounded', 'straight', 'tuck'];
const WINDOWS: PocketWindow[] = ['arch', 'rect', 'circle', 'shutters'];

/** Every absolute x,y pair after M / L / A-endpoint / H / V commands. */
function vertices(d: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const re = /([MLAHVQCZ])([^MLAHVQCZ]*)/g;
  let x = 0;
  let y = 0;
  for (const [, cmd, args] of d.matchAll(re)) {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'M' || cmd === 'L') [x, y] = n;
    if (cmd === 'H') x = n[0];
    if (cmd === 'V') y = n[0];
    if (cmd === 'A') [x, y] = n.slice(5);
    if (cmd === 'Q') [x, y] = n.slice(2);
    if (cmd === 'C') [x, y] = n.slice(4);
    if (cmd !== 'Z') out.push([x, y]);
  }
  return out;
}

function expectWellFormed(d: string): void {
  expect(d).toMatch(/^M/);
  expect(d).not.toMatch(/NaN|Infinity|undefined/);
}

describe('card silhouettes', () => {
  it.each(SHAPES)('%s: a closed outline inside the 400 × 560 card', (shape) => {
    const s = cardSilhouette(shape);
    expectWellFormed(s.d);
    expect(s.evenOdd).toBe(shape === 'doily');
    for (const [x, y] of vertices(s.d)) {
      expect(x).toBeGreaterThanOrEqual(-0.01);
      expect(x).toBeLessThanOrEqual(CARD_W + 0.01);
      expect(y).toBeGreaterThanOrEqual(-0.01);
      expect(y).toBeLessThanOrEqual(CARD_H + 0.01);
    }
    expect(Object.values(s.inset).every((v) => v >= 0)).toBe(true);
  });

  it('leaves plain rectangles unclipped and marks the pierced doily even-odd', () => {
    expect(clipPathCss('rect')).toBe('');
    expect(clipPathCss('oval')).toMatch(/^path\('M/);
    expect(clipPathCss('doily')).toMatch(/^path\(evenodd, 'M/);
  });

  it('measures scallop depth: a semicircle bulges half its chord', () => {
    expect(scallopDepth(40)).toBeCloseTo(20);
    expect(scallopDepth(60, 1.12)).toBeGreaterThan(30);
  });
});

describe('envelope geometry', () => {
  it.each(FLAPS)('%s: flap, pocket and seal fit the envelope', (flap) => {
    const g = envelopeGeometry(flap);
    expectWellFormed(g.flap);
    expectWellFormed(g.pocket);
    expect(g.flapDepth).toBeGreaterThan(0);
    expect(g.flapDepth).toBeLessThan(ENV_H * 0.7);
    // The seal sits on the closed flap.
    expect(g.sealAt.y).toBeLessThan(g.flapDepth);
    expect(g.sealAt.x).toBeCloseTo(ENV_W / 2);
  });

  it('closes every flap far enough to hide the card through the pocket opening', () => {
    for (const flap of FLAPS) {
      const g = envelopeGeometry(flap);
      // V pockets dip to a point at the centre; straight-topped ones don't.
      const all = vertices(g.pocket);
      const centre = all.filter(([x]) => Math.abs(x - ENV_W / 2) < 1);
      const pocketTop = Math.min(...(centre.length ? centre : all).map(([, y]) => y));
      expect(g.flapDepth).toBeGreaterThanOrEqual(pocketTop - 1);
    }
  });
});

describe('sleeves and pockets', () => {
  it.each(WINDOWS)('%s window sits inside the sleeve, clear of the thumb notch', (window) => {
    const win = sleeveWindow(window);
    expect(win).not.toBeNull();
    const { x, y, w, h } = win!.box;
    expect(x).toBeGreaterThan(0);
    expect(x + w).toBeLessThan(SLEEVE_W);
    expect(y).toBeGreaterThan(40);
    expect(y + h).toBeLessThan(SLEEVE_H - 80);
    expect(sleevePath(window).match(/M/g)?.length).toBe(2);
  });

  it('draws a sleeve without a window as a single outline', () => {
    expect(sleeveWindow('none')).toBeNull();
    expect(sleevePath('none').match(/M/g)?.length).toBe(1);
  });

  it('draws the wave-topped lower pocket down to the card foot', () => {
    const d = lowerPocketPath(318);
    expectWellFormed(d);
    expect(d).toContain(`V${CARD_H}`);
  });
});

describe('motifs', () => {
  it('measures tracks by arc length', () => {
    const track = Track.roundedRect(0, 0, 100, 60, 10);
    expect(track.length).toBeCloseTo(2 * (80 + 40) + 2 * Math.PI * 10, 0);
    expect(track.at(0).point.x).toBeCloseTo(50);
    expect(track.every(20)).toHaveLength(Math.round(track.length / 20));
  });

  it('is deterministic', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('grows vines, wreaths, branches and lotus rows as finite paths', () => {
    const motifs = [
      vine(Track.roundedRect(20, 20, 360, 520, 30), {
        pitch: 19, leafLength: 19, leafWidth: 7, blossomEvery: 4, blossomRadius: 11, wave: 6, waveLength: 58, stemWidth: 2, seed: 1,
      }),
      laurelWreath({ x: 50, y: 50 }, 40),
      blossomBranch({ x: 0, y: 100 }, { x: 40, y: 60 }, { x: 70, y: 30 }, { x: 160, y: 20 }, {
        width: 6, blossomRadius: 10, twigs: [0.3, 0.6], seed: 2, blossoms: 2,
      }),
      lotusRow(20, 380, 540, 60, 5),
    ];
    for (const m of motifs) {
      expectWellFormed(m.fill);
      expect(m.fill.length).toBeGreaterThan(500);
    }
  });

  it('fits relief art to each card silhouette, and caches it', () => {
    for (const shape of ['rect', 'oval', 'archTop', 'scallop'] as CardShape[]) {
      const art = reliefArt('vineFrame', shape);
      expectWellFormed(art.fill);
      expect(reliefArt('vineFrame', shape)).toBe(art);
    }
    expect(reliefArt('vineFrame', 'oval').fill).not.toBe(reliefArt('vineFrame', 'rect').fill);
  });
});

describe('patterns', () => {
  it('returns flat colours for plain liners and SVG tiles for patterned ones', () => {
    expect(linerBackground('solid', '#ffffff', '#000000')).toBe('#ffffff');
    expect(linerBackground('none', '#eeeeee', '#000000')).toBe('#eeeeee');
    const floral = linerBackground('floral', '#ffffff', '#aa3344');
    expect(floral).toMatch(/^url\("data:image\/svg\+xml,.*"\) #ffffff$/);
    expect(decodeURIComponent(floral)).toContain('#aa3344');
    expect(linerBackground('floral', '#ffffff', '#aa3344')).toBe(floral);
  });

  it('has a texture for every stock but smooth', () => {
    expect(STOCK_TEXTURE.smooth).toBe('');
    for (const stock of ['cotton', 'linen', 'pearl', 'kraft', 'felt'] as const) {
      expect(STOCK_TEXTURE[stock]).toContain('data:image/svg+xml');
    }
  });
});
