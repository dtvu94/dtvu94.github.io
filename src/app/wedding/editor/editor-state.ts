import { getDesignById } from '../data/designs';
import { WEDDING_CONFIG } from '../data/wedding-config';
import {
  AccentStyle,
  CardShape,
  DirectionsSpec,
  EnvelopeArt,
  EnvelopeFlap,
  EnvelopeLabel,
  EnvelopeLiner,
  EnvelopeRoses,
  EnvelopeSeal,
  EnvelopeSize,
  FontPairing,
  InvitationDesign,
  LayoutVariant,
  OrnamentKey,
  Palette,
  PaperStock,
  PrintFinish,
  ReliefMotif,
  ReliefSpec,
  WeddingConfig,
} from '../data/wedding.types';
import { envelopeFront } from '../envelope/envelope.component';

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
  | 'artDecoFan';

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
  /** Width in design pixels. */
  size: number;
  /** Degrees, clockwise. */
  rotate: number;
  color: StickerColor;
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
  directions: Required<DirectionsSpec>;
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
    directions: { shape: 'rect', frame: 'line', mapSide: 'left', ...design.directions },
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

/** The editor's pieces as an InvitationDesign the existing renderers draw. */
export function toDesign(state: EditorState): InvitationDesign {
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
    directions: { ...state.directions },
  };
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
];
const STICKER_FACES: readonly StickerFace[] = ['envelopeFront', 'envelopeBack', 'card', 'directions'];
const STICKER_COLORS: readonly StickerColor[] = ['accent', 'primary', 'ink', 'white'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keeps the keys of `defaults`, taking each value from `saved` only when it has the same type. */
function mergeSection<T extends object>(defaults: T, saved: unknown): T {
  const out = { ...defaults };
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = (saved as Record<keyof T, unknown>)[key];
      if (value !== undefined && typeof value === typeof defaults[key]) {
        out[key] = value as T[keyof T];
      }
    }
  }
  return out;
}

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
  return {
    id: s.id,
    face: s.face as StickerFace,
    kind: s.kind as StickerKind,
    x: clamp(s.x, 0, 1),
    y: clamp(s.y, 0, 1),
    size: clamp(typeof s.size === 'number' ? s.size : 60, 12, 320),
    rotate: clamp(typeof s.rotate === 'number' ? s.rotate : 0, -180, 180),
    color: STICKER_COLORS.includes(s.color as StickerColor) ? (s.color as StickerColor) : 'accent',
  };
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
  const base = mergeSection(defaults, saved);
  return {
    ...base,
    palette: mergeSection(defaults.palette, saved.palette),
    fonts: mergeSection(defaults.fonts, saved.fonts),
    card: mergeSection(defaults.card, saved.card),
    envelope: mergeSection(defaults.envelope, saved.envelope),
    directions: mergeSection(defaults.directions, saved.directions),
    content: mergeSection(defaults.content, saved.content),
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
