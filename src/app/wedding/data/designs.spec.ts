import { DESIGN_CATEGORIES, INVITATION_DESIGNS, getDesignById } from './designs';
import { DesignCategory, FontFamilyKey, LayoutVariant, OrnamentKey } from './wedding.types';

const CATEGORIES: DesignCategory[] = [
  'modern', 'minimalist', 'vintage', 'classic', 'floral', 'vietnamese', 'rustic', 'artdeco',
];
const LAYOUTS: LayoutVariant[] = [
  'centeredClassic', 'framedBorder', 'splitVertical', 'minimalLine', 'crestTop', 'bandedHeader',
  'archFrame', 'editorialAsym',
];
const ORNAMENTS: OrnamentKey[] = [
  'none', 'floralCorner', 'lotus', 'rings', 'artDecoFan', 'leafyWreath',
  'botanicalSprig', 'geoFrame', 'hairlineFlourish', 'watercolorBlob', 'monogramRing',
  'grandAmpersand',
];
const FONTS: FontFamilyKey[] = [
  'inter', 'beVietnamPro', 'montserrat', 'playfair', 'cormorant', 'lora',
  'dancingScript', 'greatVibes', 'sacramento', 'pinyonScript', 'parisienne',
];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe('INVITATION_DESIGNS', () => {
  it('contains at least 20 samples (24 exactly)', () => {
    expect(INVITATION_DESIGNS.length).toBeGreaterThanOrEqual(20);
    expect(INVITATION_DESIGNS).toHaveLength(24);
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
      modern: 4,
      minimalist: 3,
      vintage: 4,
      classic: 3,
      floral: 3,
      vietnamese: 3,
      rustic: 2,
      artdeco: 2,
    });
  });

  it('uses only known categories, layouts, ornaments and fonts', () => {
    for (const design of INVITATION_DESIGNS) {
      expect(CATEGORIES).toContain(design.category);
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
