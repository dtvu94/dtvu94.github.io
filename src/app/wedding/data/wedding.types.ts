/** Supported invitation languages — hand-rolled i18n (3 languages), no library. */
export type Lang = 'vi' | 'en' | 'th';

/** A piece of copy in all three languages. */
export type LocalizedText = Record<Lang, string>;

/** Style family a design belongs to — drives the gallery filter. */
export type DesignCategory =
  | 'modern'
  | 'minimalist'
  | 'vintage'
  | 'classic'
  | 'floral'
  | 'vietnamese'
  | 'rustic'
  | 'artdeco';

export interface CategoryMeta {
  id: DesignCategory;
  labels: LocalizedText;
}

/** All values are hex colors (e.g. "#7a1220"). */
export interface Palette {
  /** Backdrop behind the card. */
  bg: string;
  /** The card "paper". */
  surface: string;
  /** Headline / couple names ink. */
  primary: string;
  /** Ornaments, rules, monogram. */
  accent: string;
  /** Body text ink. */
  ink: string;
}

/** Keys map to `--ff-*` CSS variables declared in wedding-theme.css. */
export type FontFamilyKey =
  | 'inter'
  | 'beVietnamPro'
  | 'montserrat'
  | 'playfair'
  | 'cormorant'
  | 'lora'
  | 'dancingScript'
  | 'greatVibes'
  | 'sacramento'
  | 'pinyonScript'
  | 'parisienne';

export interface FontPairing {
  /** Couple names / headline face. */
  display: FontFamilyKey;
  /** Paragraphs and details. */
  body: FontFamilyKey;
  /** Optional flourish face (monogram, "Thiệp Cưới"). Falls back to display. */
  accent?: FontFamilyKey;
}

/** Structural template of the card — see invitation-card.component.html. */
export type LayoutVariant =
  | 'centeredClassic'
  | 'framedBorder'
  | 'splitVertical'
  | 'minimalLine'
  | 'crestTop'
  | 'bandedHeader'
  /** Arch-shaped inner frame — the signature 2026 silhouette. */
  | 'archFrame'
  /** Left-aligned editorial layout with oversized names. */
  | 'editorialAsym';

/** Inline-SVG decorations — see ornament.component.html. */
export type OrnamentKey =
  | 'none'
  | 'floralCorner'
  | 'lotus'
  | 'rings'
  | 'artDecoFan'
  | 'leafyWreath'
  | 'botanicalSprig'
  | 'geoFrame'
  | 'hairlineFlourish'
  | 'watercolorBlob'
  | 'monogramRing'
  /** Giant translucent "&" watermark — typography as decoration. */
  | 'grandAmpersand';

/** Sheen treatment of accent-colored elements. */
export type AccentStyle = 'gold' | 'flat';

export interface InvitationDesign {
  /** Stable kebab-case id — used in the /wedding/:id URL. */
  id: string;
  /** Design name — a proper noun, shown as-is in every language. */
  nameVi: string;
  category: DesignCategory;
  /** One-line blurb shown on the gallery card, per language. */
  description: LocalizedText;
  palette: Palette;
  fonts: FontPairing;
  layout: LayoutVariant;
  ornament: OrnamentKey;
  ornamentSecondary?: OrnamentKey;
  accentStyle?: AccentStyle;
}

export interface PersonName {
  /** Short display name used on the big script line, e.g. "Vũ". */
  short: string;
  /** Full formal name — leave '' until decided; rendered only when set. */
  full: string;
}

export interface VenueInfo {
  name: LocalizedText;
  address: LocalizedText;
  lat: number;
  lng: number;
  /** Google Maps share link. */
  mapsShareUrl: string;
}

/** Single edit point for all wedding facts — see wedding-config.ts. */
export interface WeddingConfig {
  groom: PersonName;
  bride: PersonName;
  /** e.g. vi "11 giờ 00" / en "11:00 AM" / th "11:00 น." */
  timeText: LocalizedText;
  /** e.g. vi "Chủ Nhật" / en "Sunday" / th "วันอาทิตย์" */
  weekdayText: LocalizedText;
  /** e.g. vi "ngày 28 tháng 03 năm 2027" / en "March 28th, 2027" / th "ที่ 28 มีนาคม พ.ศ. 2570" */
  dateText: LocalizedText;
  /** Optional Vietnamese lunar date, e.g. "nhằm ngày … năm Đinh Mùi". Vi-only; hidden while ''. */
  lunarDateText: string;
  /** Banquet hall — placeholder until chosen. */
  hallText: LocalizedText;
  venue: VenueInfo;
  rsvpNote: LocalizedText;
}

/** Computed invitation copy (already in one language) handed to the card. */
export interface InvitationCopy {
  titleWord: string;
  inviteHeadline: string;
  /** Salutation before the handwritten guest name — guests are unknown, e.g. "Ông / Bà:". */
  guestPrefix: string;
  /** Suffix after the guest name line, e.g. "cùng gia đình" (with family). */
  guestSuffix: string;
  coupleLine: string;
  eventLine: string;
  dateLine: string;
  lunarLine?: string;
  venueLines: string[];
  closing: string;
  rsvp: string;
  monogram: string;
}

export interface RouteOption {
  id: string;
  title: string;
  approxKm: string;
  approxTime: string;
  steps: string[];
}

/** Content of the directions insert card — fully localized, including labels. */
export interface DirectionsContent {
  kicker: string;
  title: string;
  fromLabel: string;
  venueName: string;
  venueAddress: string;
  embedUrl: string;
  openMapsUrl: string;
  directionsUrl: string;
  openMapsLabel: string;
  directionsLabel: string;
  mapOnlineLabel: string;
  routes: RouteOption[];
  rideHailNote: string;
  metroNote: string;
  busNote: string;
  parkingNote: string;
}
