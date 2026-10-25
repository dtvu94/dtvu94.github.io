import { CARD_FORMS, DESIGN_STYLES } from './categories';
import { INVITATION_DESIGNS, getDesignById } from './designs';
import { isDarkColor } from '../theme';
import {
  CardForm,
  CardShape,
  DesignStyle,
  EnvelopeFlap,
  EnvelopeLiner,
  EnvelopePrint,
  EnvelopeSeal,
  FontFamilyKey,
  LayoutVariant,
  OrnamentKey,
  PaperStock,
  PocketVariant,
  PrintFinish,
} from './wedding.types';

const FORMS: CardForm[] = ['diecut', 'letterpress', 'lasercut', 'folded', 'popup', 'pocket', 'passport'];
const STYLES: DesignStyle[] = ['modern', 'minimalist', 'vintage', 'classic', 'floral', 'vietnamese', 'rustic', 'artdeco'];
const LASER_LAYOUTS: LayoutVariant[] = ['laserLace', 'laserArch', 'laserLattice', 'laserBranch', 'laserCloud'];
const LAYOUTS: LayoutVariant[] = [
  'centeredClassic', 'framedBorder', 'splitVertical', 'minimalLine', 'crestTop', 'bandedHeader',
  'archFrame', 'editorialAsym', ...LASER_LAYOUTS,
];
const ORNAMENTS: OrnamentKey[] = [
  'none', 'floralCorner', 'lotus', 'rings', 'artDecoFan', 'leafyWreath', 'botanicalSprig', 'geoFrame',
  'hairlineFlourish', 'watercolorBlob', 'monogramRing', 'grandAmpersand', 'laserDoily', 'laurel', 'doubleHappiness',
];
const FONTS: FontFamilyKey[] = [
  'inter', 'beVietnamPro', 'montserrat', 'playfair', 'cormorant', 'lora',
  'dancingScript', 'greatVibes', 'sacramento', 'pinyonScript', 'parisienne',
];
const SHAPES: CardShape[] = [
  'rect', 'rounded', 'scallop', 'scallopFine', 'cloud', 'archTop', 'oval', 'doily', 'octagon', 'ticket', 'deckle', 'stepped',
];
const STOCKS: PaperStock[] = ['smooth', 'cotton', 'linen', 'pearl', 'kraft', 'felt'];
const FINISHES: PrintFinish[] = ['flat', 'letterpress', 'emboss'];
const FLAPS: EnvelopeFlap[] = ['pointed', 'arch', 'cloud', 'rounded', 'straight', 'tuck'];
const LINERS: EnvelopeLiner[] = ['none', 'solid', 'floral', 'lotus', 'damask', 'stripe', 'sprig', 'goldFlora', 'clouds'];
const SEALS: EnvelopeSeal[] = ['none', 'wax', 'sticker', 'twine', 'bow'];
const PRINTS: EnvelopePrint[] = ['none', 'names', 'monogram', 'fern', 'frame', 'florals', 'lotus'];
const POCKETS: PocketVariant[] = ['sleeve', 'lowerPocket', 'vellumWrap', 'bellyBand'];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const VIVID_RED = '#d7151c';

/** The ids shared before the redesign — links already sent must keep working. */
const LEGACY_IDS = [
  'press-cotton', 'press-blind-ivory', 'press-red-foil', 'press-red-ink',
  'laser-red-lace', 'laser-ivory-arch', 'laser-red-lattice', 'laser-jade-doily',
  'modern-red', 'modern-noir', 'modern-blush', 'modern-sage', 'modern-mono',
  'min-air', 'min-line', 'min-sand',
  'vintage-sepia', 'vintage-rose', 'vintage-teal', 'vintage-letter',
  'classic-ivory', 'classic-navy-gold', 'classic-bordeaux',
  'floral-peony', 'floral-eucalyptus', 'floral-watercolor',
  'vn-sen-vang', 'vn-hong-phuc', 'vn-luc-binh', 'vn-hy-do',
  'rustic-kraft', 'rustic-greenery', 'deco-gold', 'deco-emerald',
];

function countBy<T extends string>(pick: (design: (typeof INVITATION_DESIGNS)[number]) => T): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const design of INVITATION_DESIGNS) {
    counts[pick(design)] = (counts[pick(design)] ?? 0) + 1;
  }
  return counts;
}

/** Rough RGB distance, enough to tell "same colour" from "visibly different". */
function colorDistance(a: string, b: string): number {
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

describe('INVITATION_DESIGNS', () => {
  it('contains at least 20 samples (34 exactly)', () => {
    expect(INVITATION_DESIGNS.length).toBeGreaterThanOrEqual(20);
    expect(INVITATION_DESIGNS).toHaveLength(34);
  });

  it('has unique ids and keeps every previously shared id', () => {
    const ids = INVITATION_DESIGNS.map((design) => design.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of LEGACY_IDS) {
      expect(getDesignById(id)).toBeDefined();
    }
  });

  it('spreads the designs over the planned formats and styles', () => {
    expect(countBy((d) => d.form)).toEqual({ letterpress: 8, lasercut: 8, pocket: 6, diecut: 12 });
    expect(countBy((d) => d.style)).toEqual({
      modern: 6,
      minimalist: 3,
      vintage: 4,
      classic: 5,
      floral: 5,
      vietnamese: 7,
      rustic: 2,
      artdeco: 2,
    });
  });

  it('uses only known formats, styles, layouts, ornaments, fonts, shapes, stocks and finishes', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(FORMS).toContain(design.form);
      expect(STYLES).toContain(design.style);
      expect(LAYOUTS).toContain(design.layout);
      expect(ORNAMENTS).toContain(design.ornament);
      if (design.ornamentSecondary) {
        expect(ORNAMENTS).toContain(design.ornamentSecondary);
      }
      expect(FONTS).toContain(design.fonts.display);
      expect(FONTS).toContain(design.fonts.body);
      if (design.fonts.accent) {
        expect(FONTS).toContain(design.fonts.accent);
      }
      expect(SHAPES).toContain(design.shape ?? 'rect');
      expect(STOCKS).toContain(design.stock ?? 'smooth');
      expect(FINISHES).toContain(design.finish ?? 'flat');
    }
  });

  it('gives every design a complete matching envelope', () => {
    for (const { envelope } of INVITATION_DESIGNS) {
      expect(FLAPS).toContain(envelope.flap);
      expect(LINERS).toContain(envelope.liner);
      expect(SEALS).toContain(envelope.seal);
      expect(PRINTS).toContain(envelope.print);
      expect(STOCKS).toContain(envelope.stock ?? 'smooth');
      for (const color of [envelope.paper, envelope.ink, envelope.edge, envelope.sealColor, ...(envelope.linerColors ?? [])]) {
        if (color !== undefined) {
          expect(color).toMatch(HEX_COLOR);
        }
      }
    }
  });

  it('keeps each envelope visible against its backdrop', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(colorDistance(design.envelope.paper, design.palette.bg)).toBeGreaterThan(40);
    }
  });

  it('gives pocket designs a pocket spec, and only those', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(design.pocket !== undefined).toBe(design.form === 'pocket');
      if (design.pocket) {
        expect(POCKETS).toContain(design.pocket.variant);
        expect(design.pocket.paper).toMatch(HEX_COLOR);
        expect(design.pocket.ink).toMatch(HEX_COLOR);
      }
    }
  });

  it('gives every letterpress design real relief or a pressed finish', () => {
    for (const design of INVITATION_DESIGNS.filter((d) => d.form === 'letterpress')) {
      expect(design.relief !== undefined || (design.finish ?? 'flat') !== 'flat').toBe(true);
    }
  });

  it('builds every laser-cut design on a laser jacket, and only those', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(LASER_LAYOUTS.includes(design.layout)).toBe(design.form === 'lasercut');
    }
  });

  it('gives laser jackets their own paper color, distinct from the card beneath', () => {
    for (const design of INVITATION_DESIGNS) {
      const usesLaser = LASER_LAYOUTS.includes(design.layout) || design.ornament === 'laserDoily';
      if (usesLaser) {
        expect(design.palette.overlay).toBeDefined();
        expect(design.palette.overlay).not.toBe(design.palette.surface);
      }
    }
  });

  it('never puts the gold sheen on a cut-through doily monogram', () => {
    // The sheen's background-clip gradient would hide the cut-through effect.
    for (const design of INVITATION_DESIGNS) {
      if (design.ornament === 'laserDoily' || design.ornamentSecondary === 'laserDoily') {
        expect(design.accentStyle).not.toBe('gold');
      }
    }
  });

  it('offers vivid red (đỏ tươi) across several formats', () => {
    const red = INVITATION_DESIGNS.filter((design) =>
      Object.values(design.palette).some((value) => value.toLowerCase() === VIVID_RED),
    );
    expect(red.length).toBeGreaterThanOrEqual(6);
    expect(new Set(red.map((design) => design.form)).size).toBeGreaterThanOrEqual(3);
  });

  it('uses valid hex colors and non-empty naming in all three languages', () => {
    for (const design of INVITATION_DESIGNS) {
      for (const value of Object.values(design.palette)) {
        expect(value).toMatch(HEX_COLOR);
      }
      expect(design.nameVi.trim()).not.toBe('');
      expect(design.description.vi.trim()).not.toBe('');
      expect(design.description.en.trim()).not.toBe('');
      expect(design.description.th.trim()).not.toBe('');
    }
  });

  it('keeps body ink readable on its paper', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(isDarkColor(design.palette.ink)).toBe(!isDarkColor(design.palette.surface));
    }
  });
});

describe('filter metadata', () => {
  it('lists every format and style with labels in all three languages', () => {
    expect(CARD_FORMS.map((form) => form.id)).toEqual(FORMS);
    expect(DESIGN_STYLES.map((style) => style.id)).toEqual(STYLES);
    for (const meta of [...CARD_FORMS, ...DESIGN_STYLES]) {
      expect(meta.labels.vi.trim()).not.toBe('');
      expect(meta.labels.en.trim()).not.toBe('');
      expect(meta.labels.th.trim()).not.toBe('');
    }
  });
});

describe('getDesignById', () => {
  it('resolves an existing design', () => {
    expect(getDesignById('vn-sen-vang')?.nameVi).toBe('Sen Vàng');
  });

  it('returns undefined for unknown ids', () => {
    expect(getDesignById('khong-ton-tai')).toBeUndefined();
  });
});
