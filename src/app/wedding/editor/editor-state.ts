import { getDesignById } from '../data/designs';
import { WEDDING_CONFIG } from '../data/wedding-config';
import {
  AccentStyle,
  CardShape,
  DirectionsShape,
  DirectionsSpec,
  EnvelopeArt,
  EnvelopeFlap,
  EnvelopeLabel,
  EnvelopeLiner,
  EnvelopeOpening,
  EnvelopeRoses,
  EnvelopeSeal,
  EnvelopeSize,
  FontPairing,
  InvitationDesign,
  LayoutVariant,
  OrnamentKey,
  Palette,
  PaperStock,
  PhotoFrame,
  PrintFinish,
  ReliefMotif,
  ReliefSpec,
  WeddingConfig,
} from '../data/wedding.types';
import { envelopeFront } from '../envelope/envelope.component';
import { formatCoords, googleMapsUrl, parseCoords } from '../geometry/osm';

/**
 * Trình thiết kế (thử nghiệm): a suite assembled from separate pieces —
 * envelope, invitation card and directions card — each with its own shape,
 * decoration and wording, over one palette, font pairing and set of wedding
 * facts. `toDesign()` turns the pieces back into an InvitationDesign, so the
 * same renderers as the 60 ready-made designs draw it. Kept in the browser
 * (localStorage) only.
 */

export type EditorMode = 'paper' | 'online';
export type EditorTab = 'envelope' | 'card' | 'directions' | 'content';
/** Faces of the suite that take stickers. */
export type StickerFace = 'envelopeFront' | 'envelopeBack' | 'card' | 'directions';
/** Which side of the envelope the stage shows. */
export type EnvelopeFace = 'envelopeFront' | 'envelopeBack' | 'envelopeOpen';

export type StickerKind =
  | 'logo'
  | 'heart'
  | 'lotus'
  | 'rings'
  | 'floralCorner'
  | 'botanicalSprig'
  | 'leafyWreath'
  | 'laurel'
  | 'hairlineFlourish'
  | 'artDecoFan'
  | 'hy'
  | 'birds'
  | 'ribbon'
  | 'blossom'
  | 'branch'
  /** A line or two of text, typed in the editor. */
  | 'text'
  /** A wedding photo uploaded in the editor, cut to a frame. */
  | 'photo';

/** Face of a text sticker: the handwritten script, or the design's display or body face. */
export type StickerFont = 'script' | 'display' | 'body';

/** Sticker ink: one of the palette's inks, or white. */
export type StickerColor = 'accent' | 'primary' | 'ink' | 'white';

/** A decoration placed by hand: position as a fraction of its face, size in design pixels. */
export interface Sticker {
  id: string;
  face: StickerFace;
  kind: StickerKind;
  /** Centre, 0..1 across and down the face. */
  x: number;
  y: number;
  /** Width in design pixels (text: the font size). */
  size: number;
  /** Degrees, clockwise. */
  rotate: number;
  color: StickerColor;
  /** Text stickers: the words (line breaks kept) and their face. */
  text?: string;
  font?: StickerFont;
  /** Photo stickers: the uploaded image's id (IndexedDB) and its frame. */
  photo?: string;
  frame?: PhotoFrame;
  /** Locked stickers stay put when dragged. */
  locked?: boolean;
}

/** Baby roses on the envelope front: none, in the envelope's foil, or in colour. */
export type RosesTone = 'none' | 'foil' | 'blush' | 'ivory';

/** Relief on the card: off, the crest only, or crest plus border art. */
export type ReliefChoice = 'off' | 'crest' | ReliefMotif;

export interface EditorCard {
  layout: LayoutVariant;
  shape: CardShape;
  stock: PaperStock;
  finish: PrintFinish;
  ornament: OrnamentKey;
  ornamentSecondary: OrnamentKey;
  accentStyle: AccentStyle;
  relief: ReliefChoice;
  reliefMode: ReliefSpec['mode'];
  reliefFinish: ReliefSpec['finish'];
}

export interface EditorEnvelope {
  size: EnvelopeSize;
  opening: EnvelopeOpening;
  flap: EnvelopeFlap;
  paper: string;
  ink: string;
  stock: PaperStock;
  liner: EnvelopeLiner;
  linerBg: string;
  linerInk: string;
  seal: EnvelopeSeal;
  sealColor: string;
  art: EnvelopeArt;
  label: EnvelopeLabel;
  foil: boolean;
  roses: RosesTone;
  /** Coloured edge band ('' for none). */
  edge: string;
}

/** The directions card: shape, frame, layout, and which map it prints. */
export interface EditorDirections {
  shape: DirectionsShape;
  frame: NonNullable<DirectionsSpec['frame']>;
  mapSide: NonNullable<DirectionsSpec['mapSide']>;
  map: NonNullable<DirectionsSpec['map']>;
  /** OpenStreetMap zoom level for the 'tiles' map. */
  zoom: number;
  /** Photo-store id of the map image for the 'image' map ('' for none). */
  mapPhoto: string;
}

/** The wedding facts, typed once in Vietnamese; dates and times are localized from them. */
export interface EditorContent {
  groom: string;
  bride: string;
  groomFather: string;
  groomMother: string;
  brideFather: string;
  brideMother: string;
  /** ISO "YYYY-MM-DD". */
  date: string;
  /** "HH:mm", 24-hour. */
  time: string;
  hall: string;
  venueShort: string;
  venueName: string;
  address: string;
  /** The venue's point, "lat, lng" ('' when unknown). */
  coords: string;
}

export interface EditorState {
  v: 1;
  mode: EditorMode;
  tab: EditorTab;
  envelopeFace: EnvelopeFace;
  /** Overview of the whole suite instead of one piece. */
  overview: boolean;
  /** Ready-made design the look started from. */
  from: string;
  palette: Palette;
  fonts: FontPairing;
  card: EditorCard;
  envelope: EditorEnvelope;
  directions: EditorDirections;
  content: EditorContent;
  stickers: Sticker[];
}

/** The part of the state that a ready-made design supplies. */
export type EditorLook = Pick<EditorState, 'from' | 'palette' | 'fonts' | 'card' | 'envelope' | 'directions'>;

export const EDITOR_STORAGE_KEY = 'wedding-editor-v1';
export const DEFAULT_START = 'press-red-foil';

/** The colour rose sprays of the two sample envelopes. */
const ROSE_TONES: Record<'blush' | 'ivory', Extract<EnvelopeRoses, { kind: 'color' }>> = {
  blush: { kind: 'color', petal: '#f6d3d6', petalInner: '#e8a2ad', line: '#c06c7b', leaf: '#8ea488', breath: '#fffdf8' },
  ivory: { kind: 'color', petal: '#f8f1e7', petalInner: '#ead7c3', line: '#b4926c', leaf: '#c9a24a', breath: '#ffffff' },
};

function rosesTone(roses: EnvelopeRoses | undefined): RosesTone {
  if (!roses) {
    return 'none';
  }
  if (roses.kind === 'foil') {
    return 'foil';
  }
  return roses.petal === ROSE_TONES.blush.petal ? 'blush' : 'ivory';
}

/** The look of a ready-made design, split into the editor's pieces. */
export function lookFromDesign(design: InvitationDesign): EditorLook {
  const env = design.envelope;
  const { art, label } = envelopeFront(env);
  const relief = design.relief;
  return {
    from: design.id,
    palette: { ...design.palette },
    fonts: { ...design.fonts },
    card: {
      layout: design.layout,
      shape: design.shape ?? 'rect',
      stock: design.stock ?? 'smooth',
      finish: design.finish ?? 'flat',
      ornament: design.ornament,
      ornamentSecondary: design.ornamentSecondary ?? 'none',
      accentStyle: design.accentStyle ?? 'flat',
      relief: relief ? (relief.motif ?? 'crest') : 'off',
      reliefMode: relief?.mode ?? 'raised',
      reliefFinish: relief?.finish ?? 'foil',
    },
    envelope: {
      size: env.size ?? 'standard',
      opening: env.opening ?? 'flap',
      flap: env.flap,
      paper: env.paper,
      ink: env.ink,
      stock: env.stock ?? 'smooth',
      liner: env.liner,
      linerBg: env.linerColors?.[0] ?? design.palette.surface,
      linerInk: env.linerColors?.[1] ?? design.palette.accent,
      seal: env.seal,
      sealColor: env.sealColor ?? design.palette.accent,
      art,
      label,
      foil: !!env.foil,
      roses: rosesTone(env.roses),
      edge: env.edge ?? '',
    },
    directions: {
      shape: design.directions?.shape ?? 'rect',
      frame: design.directions?.frame ?? 'line',
      mapSide: design.directions?.mapSide ?? 'left',
      map: 'sketch',
      zoom: 16,
      mapPhoto: '',
    },
  };
}

/** The wedding facts as they stand in wedding-config.ts. */
export function defaultContent(config: WeddingConfig = WEDDING_CONFIG): EditorContent {
  return {
    groom: config.groom.short,
    bride: config.bride.short,
    groomFather: config.parents.groom.father,
    groomMother: config.parents.groom.mother,
    brideFather: config.parents.bride.father,
    brideMother: config.parents.bride.mother,
    date: config.isoDate,
    time: config.startTime,
    hall: config.hall,
    venueShort: config.venue.shortName,
    venueName: config.venue.name.vi,
    address: config.venue.address.vi,
    coords: formatCoords(config.venue.lat, config.venue.lng),
  };
}

export function defaultEditorState(from = DEFAULT_START): EditorState {
  const design = getDesignById(from) ?? getDesignById(DEFAULT_START)!;
  return {
    v: 1,
    mode: 'paper',
    tab: 'envelope',
    envelopeFace: 'envelopeFront',
    overview: false,
    ...lookFromDesign(design),
    content: defaultContent(),
    stickers: [],
  };
}

/** Takes on a ready-made design's look; keeps the wedding facts, stickers and mode. */
export function startFrom(state: EditorState, design: InvitationDesign): EditorState {
  return { ...state, ...lookFromDesign(design) };
}

/** Whether the venue is still the configured one (its sketch map and share link apply). */
export function isDefaultVenue(content: EditorContent, config: WeddingConfig = WEDDING_CONFIG): boolean {
  const defaults = defaultContent(config);
  return content.venueName.trim() === defaults.venueName && content.address.trim() === defaults.address && content.coords.trim() === defaults.coords;
}

/**
 * The editor's pieces as an InvitationDesign the existing renderers draw.
 * `photoUrls` resolves the photo-store ids (the directions card's map image).
 */
export function toDesign(state: EditorState, photoUrls: Record<string, string> = {}): InvitationDesign {
  const { card, envelope: env } = state;
  const relief: ReliefSpec | undefined =
    card.relief === 'off'
      ? undefined
      : card.relief === 'crest'
        ? { mode: card.reliefMode, finish: card.reliefFinish }
        : { motif: card.relief, mode: card.reliefMode, finish: card.reliefFinish };
  return {
    id: 'editor',
    nameVi: 'Thiết kế riêng',
    form: 'diecut',
    style: 'modern',
    description: { vi: 'Thiết kế riêng', en: 'Custom design', th: 'ออกแบบเอง' },
    palette: { ...state.palette },
    fonts: { ...state.fonts },
    layout: card.layout,
    ornament: card.ornament,
    ornamentSecondary: card.ornamentSecondary,
    accentStyle: card.accentStyle,
    finish: card.finish,
    shape: card.shape,
    stock: card.stock,
    relief,
    envelope: {
      size: env.size,
      opening: env.opening,
      flap: env.flap,
      paper: env.paper,
      ink: env.ink,
      stock: env.stock,
      liner: env.liner,
      linerColors: [env.linerBg, env.linerInk],
      seal: env.seal,
      sealColor: env.sealColor,
      print: 'none',
      art: env.art,
      label: env.label,
      foil: env.foil,
      roses: env.roses === 'none' ? undefined : env.roses === 'foil' ? { kind: 'foil' } : ROSE_TONES[env.roses],
      edge: env.edge || undefined,
    },
    directions: directionsSpec(state, photoUrls),
  };
}

function directionsSpec(state: EditorState, photoUrls: Record<string, string>): DirectionsSpec {
  const d = state.directions;
  const coords = parseCoords(state.content.coords);
  const spec: DirectionsSpec = { shape: d.shape, frame: d.frame, mapSide: d.mapSide, map: d.map };
  if (coords) {
    spec.tiles = { lat: coords[0], lng: coords[1], zoom: d.zoom };
  }
  if (d.mapPhoto && photoUrls[d.mapPhoto]) {
    spec.image = photoUrls[d.mapPhoto];
  }
  // A new venue: the QR opens it in Google Maps (by its point, else by its address).
  if (!isDefaultVenue(state.content)) {
    spec.qrUrl = googleMapsUrl(coords, `${state.content.venueName}, ${state.content.address}`);
  }
  return spec;
}

// ── wedding facts → WeddingConfig ───────────────────────────────────────────

const VI_WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const EN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TH_WEEKDAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TH_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const pad = (n: number) => String(n).padStart(2, '0');

function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) {
    return 'th';
  }
  return ['th', 'st', 'nd', 'rd'][day % 10] ?? 'th';
}

/** Valid "YYYY-MM-DD" → [year, month, day], else null. */
function parseDate(iso: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    return null;
  }
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? [y, mo, d] : null;
}

function parseTime(hhmm: string): [number, number] | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) {
    return null;
  }
  return [Number(m[1]), Number(m[2])];
}

function coordsOf(text: string): { lat: number; lng: number } | null {
  const c = parseCoords(text);
  return c ? { lat: c[0], lng: c[1] } : null;
}

/** The same text in every language, unless it is still the default (which has translations). */
function localized(value: string, fallback: { vi: string; en: string; th: string }): { vi: string; en: string; th: string } {
  const text = value.trim();
  return !text || text === fallback.vi ? fallback : { vi: text, en: text, th: text };
}

/** The editor's facts as a WeddingConfig: dates, weekdays and times written out in vi, en and th. */
export function editorConfig(content: EditorContent, base: WeddingConfig = WEDDING_CONFIG): WeddingConfig {
  const date = parseDate(content.date);
  const time = parseTime(content.time);
  const config: WeddingConfig = {
    ...base,
    groom: { short: content.groom.trim() || base.groom.short, full: '' },
    bride: { short: content.bride.trim() || base.bride.short, full: '' },
    parents: {
      groom: { father: content.groomFather.trim(), mother: content.groomMother.trim() },
      bride: { father: content.brideFather.trim(), mother: content.brideMother.trim() },
    },
    hall: content.hall.trim(),
    venue: {
      ...base.venue,
      // A point typed or found for a new venue (the default stays exact).
      ...(content.coords.trim() !== formatCoords(base.venue.lat, base.venue.lng) ? (coordsOf(content.coords) ?? {}) : {}),
      shortName: content.venueShort.trim() || base.venue.shortName,
      name: localized(content.venueName, base.venue.name),
      address: localized(content.address, base.venue.address),
    },
  };
  if (date) {
    const [y, mo, d] = date;
    const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    config.isoDate = content.date;
    config.weekdayText = { vi: VI_WEEKDAYS[weekday], en: EN_WEEKDAYS[weekday], th: TH_WEEKDAYS[weekday] };
    config.dateText = {
      vi: `ngày ${pad(d)} tháng ${pad(mo)} năm ${y}`,
      en: `${EN_MONTHS[mo - 1]} ${d}${ordinal(d)}, ${y}`,
      th: `ที่ ${d} ${TH_MONTHS[mo - 1]} พ.ศ. ${y + 543}`,
    };
  }
  if (time) {
    const [h, m] = time;
    const h12 = h % 12 || 12;
    config.startTime = content.time;
    config.endTime = `${pad(Math.min(h + 3, 23))}:${pad(m)}`;
    config.timeText = { vi: `${pad(h)}h${pad(m)}`, en: `${h12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`, th: `${pad(h)}:${pad(m)} น.` };
  }
  return config;
}

// ── localStorage ────────────────────────────────────────────────────────────

const STICKER_KINDS: readonly StickerKind[] = [
  'logo',
  'heart',
  'lotus',
  'rings',
  'floralCorner',
  'botanicalSprig',
  'leafyWreath',
  'laurel',
  'hairlineFlourish',
  'artDecoFan',
  'hy',
  'birds',
  'ribbon',
  'blossom',
  'branch',
  'text',
  'photo',
];
const STICKER_FONTS: readonly StickerFont[] = ['script', 'display', 'body'];
const PHOTO_FRAMES: readonly PhotoFrame[] = ['oval', 'arch', 'rounded', 'circle', 'blob'];
const STICKER_FACES: readonly StickerFace[] = ['envelopeFront', 'envelopeBack', 'card', 'directions'];
const STICKER_COLORS: readonly StickerColor[] = ['accent', 'primary', 'ink', 'white'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keeps the keys of `defaults`, taking each value from `saved` only when it has the same type. */
/** Accepts a saved value for one field (beyond having the right type). */
type Rule = (value: unknown) => boolean;
type Rules<T> = Partial<Record<keyof T, Rule>>;

const oneOf =
  (...values: readonly string[]): Rule =>
  (value) =>
    values.includes(value as string);
const HEX = /^#[0-9a-f]{6}$/i;
const hex: Rule = (value) => HEX.test(value as string);
const hexOrNone: Rule = (value) => value === '' || hex(value);
const between =
  (min: number, max: number): Rule =>
  (value) =>
    Number.isFinite(value) && (value as number) >= min && (value as number) <= max;

/**
 * Keeps the keys of `defaults`, taking each value from `saved` only when it
 * has the same type and passes its rule (a known choice, a #rrggbb colour…):
 * a tampered link or an old save can't hand the renderers a value they
 * don't draw.
 */
function mergeSection<T extends object>(defaults: T, saved: unknown, rules: Rules<T> = {}): T {
  const out = { ...defaults };
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = (saved as Record<keyof T, unknown>)[key];
      const rule = rules[key];
      if (value !== undefined && typeof value === typeof defaults[key] && (!rule || rule(value))) {
        out[key] = value as T[keyof T];
      }
    }
  }
  return out;
}

const FONT_KEYS = ['inter', 'beVietnamPro', 'montserrat', 'playfair', 'cormorant', 'lora', 'dancingScript', 'greatVibes', 'sacramento', 'pinyonScript', 'parisienne'];
const ORNAMENT_KEYS = [
  'none',
  'floralCorner',
  'lotus',
  'rings',
  'artDecoFan',
  'leafyWreath',
  'botanicalSprig',
  'geoFrame',
  'hairlineFlourish',
  'watercolorBlob',
  'monogramRing',
  'grandAmpersand',
  'laserDoily',
  'laurel',
];
const STOCK_KEYS = ['smooth', 'cotton', 'linen', 'pearl', 'kraft', 'felt'];

const STATE_RULES: Rules<EditorState> = {
  mode: oneOf('paper', 'online'),
  tab: oneOf('envelope', 'card', 'directions', 'content'),
  envelopeFace: oneOf('envelopeFront', 'envelopeBack', 'envelopeOpen'),
};
const PALETTE_RULES: Rules<Palette> = { bg: hex, surface: hex, primary: hex, accent: hex, ink: hex, overlay: hex };
const FONT_RULES: Rules<FontPairing> = { display: oneOf(...FONT_KEYS), body: oneOf(...FONT_KEYS) };
const CARD_RULES: Rules<EditorCard> = {
  layout: oneOf(
    'centeredClassic',
    'framedBorder',
    'splitVertical',
    'minimalLine',
    'crestTop',
    'bandedHeader',
    'archFrame',
    'editorialAsym',
    'laserLace',
    'laserArch',
    'laserLattice',
    'laserBranch',
    'laserCloud',
  ),
  shape: oneOf('rect', 'rounded', 'scallop', 'scallopFine', 'cloud', 'archTop', 'oval', 'doily', 'octagon', 'ticket', 'deckle', 'stepped'),
  stock: oneOf(...STOCK_KEYS),
  finish: oneOf('flat', 'letterpress', 'emboss'),
  ornament: oneOf(...ORNAMENT_KEYS),
  ornamentSecondary: oneOf(...ORNAMENT_KEYS),
  accentStyle: oneOf('gold', 'flat'),
  relief: oneOf('off', 'crest', 'vineFrame', 'branches', 'lotusBorder', 'pearlBorder'),
  reliefMode: oneOf('raised', 'pressed'),
  reliefFinish: oneOf('blind', 'ink', 'foil'),
};
const ENVELOPE_RULES: Rules<EditorEnvelope> = {
  size: oneOf('standard', 'square', 'long', 'round'),
  opening: oneOf('flap', 'sleeve', 'open'),
  flap: oneOf('pointed', 'arch', 'cloud', 'rounded', 'straight', 'tuck'),
  paper: hex,
  ink: hex,
  stock: oneOf(...STOCK_KEYS),
  liner: oneOf('none', 'solid', 'floral', 'lotus', 'damask', 'stripe', 'sprig', 'goldFlora', 'clouds'),
  linerBg: hex,
  linerInk: hex,
  seal: oneOf('none', 'wax', 'sticker', 'twine', 'bow'),
  sealColor: hex,
  art: oneOf('none', 'fern', 'frame', 'florals', 'lotus'),
  label: oneOf('none', 'names', 'namesHeart', 'logo', 'logoNames', 'title'),
  roses: oneOf('none', 'foil', 'blush', 'ivory'),
  edge: hexOrNone,
};
const DIRECTIONS_RULES: Rules<EditorDirections> = {
  shape: oneOf('rect', 'rounded', 'ticket', 'scallop', 'deckle'),
  frame: oneOf('line', 'double', 'corners', 'none'),
  mapSide: oneOf('left', 'right'),
  map: oneOf('sketch', 'tiles', 'image'),
  zoom: between(2, 19),
};
/** The laser jacket's colour is optional: kept when the saved palette has a valid one. */
function withOverlay(palette: Palette, saved: unknown): Palette {
  const overlay = (saved as Partial<Palette> | undefined)?.overlay;
  return typeof overlay === 'string' && hex(overlay) ? { ...palette, overlay } : palette;
}

const short: Rule = (value) => (value as string).length <= 200;
const CONTENT_RULES: Rules<EditorContent> = Object.fromEntries(
  (Object.keys(defaultContent()) as (keyof EditorContent)[]).map((key) => [key, short]),
) as Rules<EditorContent>;

function validSticker(raw: unknown): Sticker | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const s = raw as Partial<Sticker>;
  if (
    typeof s.id !== 'string' ||
    !STICKER_KINDS.includes(s.kind as StickerKind) ||
    !STICKER_FACES.includes(s.face as StickerFace) ||
    typeof s.x !== 'number' ||
    typeof s.y !== 'number'
  ) {
    return null;
  }
  const sticker: Sticker = {
    id: s.id,
    face: s.face as StickerFace,
    kind: s.kind as StickerKind,
    x: clamp(s.x, 0, 1),
    y: clamp(s.y, 0, 1),
    size: clamp(typeof s.size === 'number' ? s.size : 60, 8, 360),
    rotate: clamp(typeof s.rotate === 'number' ? s.rotate : 0, -180, 180),
    color: STICKER_COLORS.includes(s.color as StickerColor) ? (s.color as StickerColor) : 'accent',
  };
  if (s.kind === 'text') {
    sticker.text = typeof s.text === 'string' ? s.text.slice(0, 400) : '';
    sticker.font = STICKER_FONTS.includes(s.font as StickerFont) ? (s.font as StickerFont) : 'script';
  }
  if (s.kind === 'photo') {
    if (typeof s.photo === 'string') {
      sticker.photo = s.photo;
    }
    sticker.frame = PHOTO_FRAMES.includes(s.frame as PhotoFrame) ? (s.frame as PhotoFrame) : 'oval';
  }
  if (s.locked === true) {
    sticker.locked = true;
  }
  return sticker;
}

/** A saved state, checked field by field against the defaults (anything odd falls back). */
export function restoreEditorState(raw: string | null): EditorState {
  const defaults = defaultEditorState();
  if (!raw) {
    return defaults;
  }
  let saved: Partial<EditorState>;
  try {
    saved = JSON.parse(raw) as Partial<EditorState>;
  } catch {
    return defaults;
  }
  if (!saved || saved.v !== 1) {
    return defaults;
  }
  const base = mergeSection(defaults, saved, STATE_RULES);
  return {
    ...base,
    palette: withOverlay(mergeSection(defaults.palette, saved.palette, PALETTE_RULES), saved.palette),
    fonts: mergeSection(defaults.fonts, saved.fonts, FONT_RULES),
    card: mergeSection(defaults.card, saved.card, CARD_RULES),
    envelope: mergeSection(defaults.envelope, saved.envelope, ENVELOPE_RULES),
    directions: mergeSection(defaults.directions, saved.directions, DIRECTIONS_RULES),
    content: mergeSection(defaults.content, saved.content, CONTENT_RULES),
    stickers: Array.isArray(saved.stickers) ? saved.stickers.map(validSticker).filter((s): s is Sticker => !!s) : [],
  };
}

export function loadEditorState(): EditorState {
  try {
    return restoreEditorState(localStorage.getItem(EDITOR_STORAGE_KEY));
  } catch {
    return defaultEditorState();
  }
}

export function saveEditorState(state: EditorState): void {
  try {
    localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode): the design lives for this visit only.
  }
}

export function clearEditorState(): void {
  try {
    localStorage.removeItem(EDITOR_STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
}

let stickerSeq = 0;

/** A new sticker id, unique within the page. */
export function newStickerId(): string {
  stickerSeq += 1;
  return `s${Date.now().toString(36)}${stickerSeq}`;
}
