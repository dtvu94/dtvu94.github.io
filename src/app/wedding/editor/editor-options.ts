import { INVITATION_DESIGNS } from '../data/designs';
import {
  CardShape,
  DirectionsSpec,
  EnvelopeArt,
  EnvelopeFlap,
  EnvelopeLabel,
  EnvelopeLiner,
  EnvelopeSeal,
  EnvelopeSize,
  FontFamilyKey,
  LayoutVariant,
  OrnamentKey,
  Palette,
  PaperStock,
  PrintFinish,
  ReliefSpec,
} from '../data/wedding.types';
import { CARD_H, CARD_W, cardSilhouette, directionsSilhouette, envelopeGeometry, envelopeSize } from '../geometry/shapes';
import { EditorTab, ReliefChoice, RosesTone, StickerColor, StickerKind } from './editor-state';

/**
 * Everything the editor offers, with the Vietnamese labels it shows. The
 * values are the same building blocks the ready-made designs are made of.
 */

export interface Choice<T> {
  value: T;
  label: string;
  /** Outline for a small thumbnail (viewBox `box`). */
  thumb?: { box: string; d: string; evenOdd?: boolean };
}

const c = <T>(value: T, label: string): Choice<T> => ({ value, label });

export const TABS: Choice<EditorTab>[] = [
  c('envelope', 'Bao thư'),
  c('card', 'Thiệp mời'),
  c('directions', 'Đường đi'),
  c('content', 'Nội dung'),
];

// ── card ────────────────────────────────────────────────────────────────────

export const LAYOUTS: Choice<LayoutVariant>[] = [
  c('centeredClassic', 'Cổ điển, canh giữa'),
  c('framedBorder', 'Khung viền'),
  c('crestTop', 'Huy hiệu trên đầu'),
  c('bandedHeader', 'Dải tiêu đề'),
  c('splitVertical', 'Chia cột'),
  c('minimalLine', 'Tối giản'),
  c('archFrame', 'Khung vòm'),
  c('editorialAsym', 'Lệch trái, tên lớn'),
  c('laserLace', 'Cắt laser: ren'),
  c('laserArch', 'Cắt laser: cổng vòm'),
  c('laserLattice', 'Cắt laser: song cửa'),
  c('laserBranch', 'Cắt laser: cành đào'),
  c('laserCloud', 'Cắt laser: mây'),
];

const CARD_SHAPE_LABELS: Record<CardShape, string> = {
  rect: 'Chữ nhật',
  rounded: 'Bo góc',
  scallop: 'Viền sóng',
  scallopFine: 'Vỏ sò',
  cloud: 'Mây',
  archTop: 'Đầu vòm',
  oval: 'Bầu dục',
  doily: 'Ren tròn',
  octagon: 'Bát giác',
  ticket: 'Vé',
  deckle: 'Giấy xé',
  stepped: 'Bậc thang',
};

export const CARD_SHAPES: Choice<CardShape>[] = (Object.keys(CARD_SHAPE_LABELS) as CardShape[]).map((shape) => {
  const s = cardSilhouette(shape);
  return { value: shape, label: CARD_SHAPE_LABELS[shape], thumb: { box: `0 0 ${CARD_W} ${CARD_H}`, d: s.d, evenOdd: s.evenOdd } };
});

export const STOCKS: Choice<PaperStock>[] = [
  c('smooth', 'Trơn'),
  c('cotton', 'Cotton'),
  c('linen', 'Vân vải'),
  c('pearl', 'Ánh ngọc trai'),
  c('kraft', 'Kraft'),
  c('felt', 'Vân nỉ'),
];

export const FINISHES: Choice<PrintFinish>[] = [c('flat', 'In phẳng'), c('letterpress', 'Ép chìm'), c('emboss', 'Dập nổi')];

export const ORNAMENTS: Choice<OrnamentKey>[] = [
  c('none', 'Không'),
  c('laurel', 'Nguyệt quế'),
  c('leafyWreath', 'Vòng lá'),
  c('monogramRing', 'Vòng logo'),
  c('lotus', 'Hoa sen'),
  c('rings', 'Nhẫn cưới'),
  c('artDecoFan', 'Quạt deco'),
  c('floralCorner', 'Hoa góc'),
  c('botanicalSprig', 'Nhành lá góc'),
  c('geoFrame', 'Góc hình học'),
  c('hairlineFlourish', 'Nét hoa văn'),
  c('watercolorBlob', 'Loang màu nước'),
  c('grandAmpersand', 'Chữ & lớn'),
  c('laserDoily', 'Ren laser'),
];

export const RELIEFS: Choice<ReliefChoice>[] = [
  c('off', 'Không'),
  c('crest', 'Chỉ huy hiệu'),
  c('vineFrame', 'Dây hoa quanh viền'),
  c('branches', 'Cành hoa hai góc'),
  c('lotusBorder', 'Sen chân thiệp'),
  c('pearlBorder', 'Viền ngọc trai'),
];

export const RELIEF_MODES: Choice<ReliefSpec['mode']>[] = [c('raised', 'Nổi'), c('pressed', 'Chìm')];
export const RELIEF_FINISHES: Choice<ReliefSpec['finish']>[] = [c('foil', 'Nhũ kim'), c('ink', 'Có mực'), c('blind', 'Không mực')];

export const FONTS: Choice<FontFamilyKey>[] = [
  c('playfair', 'Playfair Display'),
  c('cormorant', 'Cormorant Garamond'),
  c('lora', 'Lora'),
  c('beVietnamPro', 'Be Vietnam Pro'),
  c('montserrat', 'Montserrat'),
  c('inter', 'Inter'),
];

// ── envelope ────────────────────────────────────────────────────────────────

const SIZE_LABELS: Record<EnvelopeSize, string> = { standard: 'Chữ nhật', square: 'Vuông', long: 'Chữ nhật dài' };

export const ENVELOPE_SIZES: Choice<EnvelopeSize>[] = (Object.keys(SIZE_LABELS) as EnvelopeSize[]).map((size) => {
  const { w, h } = envelopeSize({ size });
  return { value: size, label: SIZE_LABELS[size], thumb: { box: `0 0 ${w} ${h}`, d: `M0 0H${w}V${h}H0Z` } };
});

const FLAP_LABELS: Record<EnvelopeFlap, string> = {
  pointed: 'Nắp nhọn',
  straight: 'Nắp chữ V',
  arch: 'Nắp vòm',
  cloud: 'Nắp mây',
  rounded: 'Nắp bo góc',
  tuck: 'Nắp gài',
};

export const FLAPS: Choice<EnvelopeFlap>[] = (Object.keys(FLAP_LABELS) as EnvelopeFlap[]).map((flap) => ({
  value: flap,
  label: FLAP_LABELS[flap],
  thumb: { box: '0 0 470 330', d: `M0 0H470V330H0Z${envelopeGeometry(flap).flap}`, evenOdd: true },
}));

export const LINERS: Choice<EnvelopeLiner>[] = [
  c('none', 'Không lót'),
  c('solid', 'Màu trơn'),
  c('floral', 'Hoa nhí'),
  c('sprig', 'Nhành lá'),
  c('lotus', 'Hoa sen'),
  c('damask', 'Gấm'),
  c('stripe', 'Sọc'),
  c('goldFlora', 'Hoa nhũ'),
  c('clouds', 'Mây'),
];

export const SEALS: Choice<EnvelopeSeal>[] = [c('wax', 'Sáp niêm'), c('sticker', 'Tem tròn'), c('bow', 'Nơ + sáp'), c('twine', 'Dây gai'), c('none', 'Không')];

export const ARTS: Choice<EnvelopeArt>[] = [c('none', 'Không'), c('florals', 'Hoa hai góc'), c('lotus', 'Hoa sen'), c('fern', 'Dương xỉ'), c('frame', 'Khung mây')];

export const ROSES: Choice<RosesTone>[] = [c('none', 'Không'), c('foil', 'Nhũ'), c('blush', 'Hồng phấn'), c('ivory', 'Ngà')];

export const LABELS: Choice<EnvelopeLabel>[] = [
  c('namesHeart', 'Tên ♡ ngày'),
  c('names', 'Tên'),
  c('logoNames', 'Logo + tên'),
  c('logo', 'Chỉ logo'),
  c('title', 'Chữ “Thiệp Cưới”'),
  c('none', 'Để trống'),
];

// ── directions ──────────────────────────────────────────────────────────────

const DIRECTION_SHAPE_LABELS: Record<NonNullable<DirectionsSpec['shape']>, string> = {
  rect: 'Chữ nhật',
  rounded: 'Bo góc',
  ticket: 'Vé',
  scallop: 'Vỏ sò',
  deckle: 'Giấy xé',
};

export const DIRECTION_SHAPES: Choice<NonNullable<DirectionsSpec['shape']>>[] = (
  Object.keys(DIRECTION_SHAPE_LABELS) as NonNullable<DirectionsSpec['shape']>[]
).map((shape) => ({ value: shape, label: DIRECTION_SHAPE_LABELS[shape], thumb: { box: '0 0 480 320', d: directionsSilhouette(shape, 480, 320).d } }));

export const DIRECTION_FRAMES: Choice<NonNullable<DirectionsSpec['frame']>>[] = [
  c('line', 'Viền mảnh'),
  c('double', 'Viền đôi'),
  c('corners', 'Hoa bốn góc'),
  c('none', 'Không viền'),
];

export const MAP_SIDES: Choice<NonNullable<DirectionsSpec['mapSide']>>[] = [c('left', 'Bản đồ bên trái'), c('right', 'Bản đồ bên phải')];

// ── stickers ────────────────────────────────────────────────────────────────

export interface StickerMeta {
  kind: StickerKind;
  label: string;
  /** Height over width of the art. */
  aspect: number;
  /** Width a new sticker starts at, in design pixels. */
  size: number;
}

export const STICKERS: StickerMeta[] = [
  { kind: 'logo', label: 'Logo V T', aspect: 339 / 569, size: 90 },
  { kind: 'heart', label: 'Trái tim', aspect: 30 / 56, size: 70 },
  { kind: 'rings', label: 'Nhẫn cưới', aspect: 0.6, size: 70 },
  { kind: 'lotus', label: 'Hoa sen', aspect: 0.64, size: 80 },
  { kind: 'laurel', label: 'Nguyệt quế', aspect: 1, size: 90 },
  { kind: 'leafyWreath', label: 'Vòng lá', aspect: 1, size: 90 },
  { kind: 'floralCorner', label: 'Hoa góc', aspect: 1, size: 70 },
  { kind: 'botanicalSprig', label: 'Nhành lá', aspect: 1, size: 70 },
  { kind: 'artDecoFan', label: 'Quạt deco', aspect: 0.52, size: 80 },
  { kind: 'hairlineFlourish', label: 'Nét hoa văn', aspect: 0.1, size: 140 },
];

export function stickerMeta(kind: StickerKind): StickerMeta {
  return STICKERS.find((s) => s.kind === kind) ?? STICKERS[0];
}

export const STICKER_COLORS: Choice<StickerColor>[] = [c('accent', 'Màu điểm'), c('primary', 'Màu tên'), c('ink', 'Màu chữ'), c('white', 'Trắng')];

/** The colour a sticker ink stands for, on a given palette. */
export function stickerInk(color: StickerColor, palette: Palette): string {
  return color === 'white' ? '#ffffff' : palette[color];
}

// ── palettes ────────────────────────────────────────────────────────────────

export interface PalettePreset {
  label: string;
  palette: Palette;
}

/** Every distinct palette of the ready-made designs, named after the first design that uses it. */
export const PALETTES: PalettePreset[] = (() => {
  const seen = new Set<string>();
  const out: PalettePreset[] = [];
  for (const design of INVITATION_DESIGNS) {
    const key = JSON.stringify(design.palette);
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ label: design.nameVi, palette: design.palette });
    }
  }
  return out;
})();

/** The palette slots the editor lets you recolour. */
export const PALETTE_SLOTS: Choice<keyof Palette>[] = [
  c('surface', 'Giấy thiệp'),
  c('primary', 'Tên & tiêu đề'),
  c('accent', 'Họa tiết'),
  c('ink', 'Chữ thường'),
  c('bg', 'Nền trang'),
];
