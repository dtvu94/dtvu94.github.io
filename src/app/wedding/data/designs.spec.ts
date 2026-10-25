import { DESIGN_CATEGORIES, INVITATION_DESIGNS, getDesignById } from './designs';
import { isDarkColor } from '../theme';
import { DesignCategory, FontFamilyKey, LayoutVariant, OrnamentKey, PrintFinish } from './wedding.types';

const CATEGORIES: DesignCategory[] = [
  'letterpress', 'lasercut',
  'modern', 'minimalist', 'vintage', 'classic', 'floral', 'vietnamese', 'rustic', 'artdeco',
];
const LASER_LAYOUTS: LayoutVariant[] = ['laserLace', 'laserArch', 'laserLattice'];
const LAYOUTS: LayoutVariant[] = [
  'centeredClassic', 'framedBorder', 'splitVertical', 'minimalLine', 'crestTop', 'bandedHeader',
  'archFrame', 'editorialAsym', ...LASER_LAYOUTS,
];
const ORNAMENTS: OrnamentKey[] = [
  'none', 'floralCorner', 'lotus', 'rings', 'artDecoFan', 'leafyWreath',
  'botanicalSprig', 'geoFrame', 'hairlineFlourish', 'watercolorBlob', 'monogramRing',
  'grandAmpersand', 'laserDoily',
];
const FINISHES: PrintFinish[] = ['flat', 'letterpress', 'emboss'];
const VIVID_RED = '#d7151c';
const FONTS: FontFamilyKey[] = [
  'inter', 'beVietnamPro', 'montserrat', 'playfair', 'cormorant', 'lora',
  'dancingScript', 'greatVibes', 'sacramento', 'pinyonScript', 'parisienne',
];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe('INVITATION_DESIGNS', () => {
  it('contains at least 20 samples (34 exactly)', () => {
    expect(INVITATION_DESIGNS.length).toBeGreaterThanOrEqual(20);
    expect(INVITATION_DESIGNS).toHaveLength(34);
  });

  it('has unique ids', () => {
    const ids = INVITATION_DESIGNS.map((design) => design.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every category with the planned counts', () => {
    const counts: Record<string, number> = {};
    for (const design of INVITATION_DESIGNS) {
      counts[design.category] = (counts[design.category] ?? 0) + 1;
    }
    expect(counts).toEqual({
      letterpress: 4,
      lasercut: 4,
      modern: 5,
      minimalist: 3,
      vintage: 4,
      classic: 3,
      floral: 3,
      vietnamese: 4,
      rustic: 2,
      artdeco: 2,
    });
  });

  it('gives every letterpress design a pressed or raised finish', () => {
    for (const design of INVITATION_DESIGNS.filter((d) => d.category === 'letterpress')) {
      expect(['letterpress', 'emboss']).toContain(design.finish);
    }
  });

  it('builds every laser-cut design on a laser jacket, and only those', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(LASER_LAYOUTS.includes(design.layout)).toBe(design.category === 'lasercut');
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

  it('offers vivid red (đỏ tươi) across several collections', () => {
    const red = INVITATION_DESIGNS.filter((design) =>
      Object.values(design.palette).some((value) => value.toLowerCase() === VIVID_RED),
    );
    expect(red.length).toBeGreaterThanOrEqual(6);
    expect(new Set(red.map((design) => design.category)).size).toBeGreaterThanOrEqual(4);
  });

  it('keeps body ink readable on its paper', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(isDarkColor(design.palette.ink)).toBe(!isDarkColor(design.palette.surface));
    }
  });

  it('uses only known categories, layouts, ornaments and fonts', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(CATEGORIES).toContain(design.category);
      expect(LAYOUTS).toContain(design.layout);
      expect(ORNAMENTS).toContain(design.ornament);
      if (design.ornamentSecondary) {
        expect(ORNAMENTS).toContain(design.ornamentSecondary);
      }
      expect(FINISHES).toContain(design.finish ?? 'flat');
      expect(FONTS).toContain(design.fonts.display);
      expect(FONTS).toContain(design.fonts.body);
      if (design.fonts.accent) {
        expect(FONTS).toContain(design.fonts.accent);
      }
    }
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

  it('lists every category in DESIGN_CATEGORIES with labels in all three languages', () => {
    expect(DESIGN_CATEGORIES.map((category) => category.id).sort()).toEqual([...CATEGORIES].sort());
    for (const category of DESIGN_CATEGORIES) {
      expect(category.labels.vi.trim()).not.toBe('');
      expect(category.labels.en.trim()).not.toBe('');
      expect(category.labels.th.trim()).not.toBe('');
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
