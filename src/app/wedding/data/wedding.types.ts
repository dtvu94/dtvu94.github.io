/** Supported invitation languages — hand-rolled i18n (3 languages), no library. */
export type Lang = 'vi' | 'en' | 'th';

/** A piece of copy in all three languages. */
export type LocalizedText = Record<Lang, string>;

// ── the two gallery filters ─────────────────────────────────────────────────

/** Phong cách — the style family (second filter row). */
export type DesignStyle =
  | 'modern'
  | 'minimalist'
  | 'vintage'
  | 'classic'
  | 'floral'
  | 'vietnamese'
  | 'rustic'
  | 'artdeco';

/** Kiểu thiệp — the physical format of the suite (first filter row). */
export type CardForm =
  /** Cắt bế: a flat card die-cut to a silhouette. */
  | 'diecut'
  /** Dập chìm nổi: relief printing — letterpress, blind emboss, foil. */
  | 'letterpress'
  /** Cắt laser: laser-cut jackets and crests. */
  | 'lasercut'
  /** Thiệp gấp: bi-fold, tri-fold, gate-fold, accordion. */
  | 'folded'
  /** Pop-up 3D. */
  | 'popup'
  /** Thiệp rút & túi: sleeves, sliders, pockets, wraps. */
  | 'pocket'
  /** Hộ chiếu & vé: passport booklet with a boarding pass. */
  | 'passport';

export interface StyleMeta {
  id: DesignStyle;
  labels: LocalizedText;
}

export interface FormMeta {
  id: CardForm;
  labels: LocalizedText;
}

// ── the printed card ────────────────────────────────────────────────────────

/** All values are hex colors (e.g. "#7a1220"). */
export interface Palette {
  /** Backdrop behind the suite. */
  bg: string;
  /** The card "paper". */
  surface: string;
  /** Headline / couple names ink. */
  primary: string;
  /** Ornaments, rules, monogram. */
  accent: string;
  /** Body text ink. */
  ink: string;
  /** Laser-cut jacket paper (laser layouts, laserDoily). Defaults to `accent`. */
  overlay?: string;
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
  /** Headings and numerals (short date, venue name, panel headings). */
  display: FontFamilyKey;
  /** Paragraphs and details. */
  body: FontFamilyKey;
  /* The handwritten lines — the couple's names, "Thiệp Cưới", guest names —
     are the same on every design: Alex Brush, with Charm for Thai
     (--ff-alexBrush, see theme.ts). */
}

/** Structural template of the card face — see invitation-card.component.html. */
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
  | 'editorialAsym'
  /** Laser-cut lace jacket with a scalloped rectangular window. */
  | 'laserLace'
  /** Laser-cut jacket with an arched, scalloped window (cổng vòm). */
  | 'laserArch'
  /** Laser-cut window-lattice jacket (song cửa). */
  | 'laserLattice'
  /** Laser-cut jacket whose window follows a flowering branch (cành đào). */
  | 'laserBranch'
  /** Laser-cut jacket of auspicious clouds (mây) around an oval window. */
  | 'laserCloud';

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
  | 'grandAmpersand'
  /** Laser-cut paper doily crest; the monogram reads as cut through it. */
  | 'laserDoily'
  /** Laurel wreath crest around the monogram (made for relief finishes). */
  | 'laurel';

/** Sheen treatment of accent-colored elements. */
export type AccentStyle = 'gold' | 'flat';

/**
 * Physical print technique the copy imitates (see wedding-finishes.css).
 * - letterpress: ink pressed into thick cotton stock (dập chìm)
 * - emboss: raised, ink-free type (dập nổi không mực)
 */
export type PrintFinish = 'flat' | 'letterpress' | 'emboss';

/** Die-cut silhouette of a flat card (cắt bế) — see geometry/shapes.ts. */
export type CardShape =
  | 'rect'
  | 'rounded'
  /** Big scallops (viền sóng). */
  | 'scallop'
  /** Fine scallops (viền vỏ sò). */
  | 'scallopFine'
  /** Fat, pinched lobes (viền mây). */
  | 'cloud'
  /** Arched top (nắp vòm). */
  | 'archTop'
  | 'oval'
  /** Scalloped oval pierced with a ring of holes. */
  | 'doily'
  /** Cut corners (bát giác). */
  | 'octagon'
  /** Concave corner bites (vé / nhãn). */
  | 'ticket'
  /** Hand-torn deckle edge (giấy xé). */
  | 'deckle'
  /** Art-deco stepped corners. */
  | 'stepped';

/** Paper stock, rendered as a texture over the paper colour. */
export type PaperStock = 'smooth' | 'cotton' | 'linen' | 'pearl' | 'kraft' | 'felt';

/** Border art printed in relief — see geometry/motifs.ts. */
export type ReliefMotif =
  /** Flowering vine around the edge. */
  | 'vineFrame'
  /** Flowering branches from two opposite corners (mai / đào). */
  | 'branches'
  /** Lotus blooms and pads along the bottom edge. */
  | 'lotusBorder'
  /** A ring of pearls inside the edge. */
  | 'pearlBorder';

/** How relief art and relief crests are produced. */
export interface ReliefSpec {
  /** Border art; omit for crest-only relief. */
  motif?: ReliefMotif;
  /** raised = dập nổi, pressed = dập chìm. */
  mode: 'raised' | 'pressed';
  /** blind = paper only, ink = printed colour, foil = metallic foil. */
  finish: 'blind' | 'ink' | 'foil';
}

// ── envelope ────────────────────────────────────────────────────────────────

/** Silhouette of the envelope flap. */
export type EnvelopeFlap =
  /** Classic V (nắp nhọn). */
  | 'pointed'
  /** Rounded arch (nắp vòm). */
  | 'arch'
  /** Three-lobed cloud wave (nắp mây). */
  | 'cloud'
  /** Square flap with rounded corners (nắp bo góc). */
  | 'rounded'
  /** Shallow straight V of a long kraft envelope. */
  | 'straight'
  /** Short tuck flap of a pocket envelope with a thumb notch. */
  | 'tuck';

/** Pattern printed inside the flap and the back panel (giấy lót). */
export type EnvelopeLiner = 'none' | 'solid' | 'floral' | 'lotus' | 'damask' | 'stripe' | 'sprig' | 'goldFlora' | 'clouds';

export type EnvelopeSeal =
  | 'none'
  /** Wax seal with the monogram (sáp niêm). */
  | 'wax'
  /** Round monogram sticker. */
  | 'sticker'
  /** Twine tied round the envelope (dây gai). */
  | 'twine'
  /** Hand-drawn ribbon bow with a wax seal. */
  | 'bow';

/** Art printed on the envelope's front pocket. */
export type EnvelopePrint =
  | 'none'
  /** The couple's names in the display face. */
  | 'names'
  /** "Tuấn Vũ ♡ Nguyễn Thảo" with the date beneath, like a save-the-date. */
  | 'namesHeart'
  /** Fern spray with a script title (kraft style). */
  | 'fern'
  /** Double-line frame with cloud-curl corners round the title (thiệp mời). */
  | 'frame'
  /** Corner floral sprays. */
  | 'florals'
  /** A lotus over the names. */
  | 'lotus';

/** Envelope proportions: 470 × 330, 400 × 400, a long 500 × 260 or a round 380 (see shapes.ts). */
export type EnvelopeSize = 'standard' | 'square' | 'long' | 'round';

/**
 * How the envelope opens: a folded flap (nắp gập), a sleeve the card slides
 * out of sideways, pulled by a ribbon (bao thư kéo), or an open pocket with
 * a scooped mouth and no flap (bao thư mở).
 */
export type EnvelopeOpening = 'flap' | 'sleeve' | 'open';

/** Decoration printed on the envelope front, apart from any names or logo. */
export type EnvelopeArt =
  | 'none'
  /** Fern spray in the lower right corner. */
  | 'fern'
  /** Double-line frame with cloud-curl corners and the title inside. */
  | 'frame'
  /** Floral sprays in the two lower corners. */
  | 'florals'
  /** A lotus bloom with its pads. */
  | 'lotus';

/** What the envelope front says: names, logo, both, or a script title. */
export type EnvelopeLabel =
  | 'none'
  | 'names'
  /** "Tuấn Vũ ♡ Nguyễn Thảo" with the date beneath. */
  | 'namesHeart'
  /** The couple's V T logo. */
  | 'logo'
  /** The logo above the names. */
  | 'logoNames'
  /** "Thiệp Cưới" in script, set at a slant (kraft style). */
  | 'title';

export interface EnvelopeSpec {
  flap: EnvelopeFlap;
  /** Defaults to 'standard'. */
  size?: EnvelopeSize;
  /** Defaults to 'flap'. A round envelope always has its round flap or is open. */
  opening?: EnvelopeOpening;
  paper: string;
  /** Translucent vellum (giấy can): the card shows through. */
  vellum?: boolean;
  stock?: PaperStock;
  liner: EnvelopeLiner;
  /** Liner ground and pattern colours; defaults derive from the palette. */
  linerColors?: [string, string];
  /** Contrasting flap edge (nắp viền màu). */
  edge?: string;
  seal: EnvelopeSeal;
  sealColor?: string;
  print: EnvelopePrint;
  /** Ink of the envelope print and guest line. */
  ink: string;
  /** Print the envelope art in metallic foil. */
  foil?: boolean;
  /** Sprays of baby roses (hoa hồng baby) on both sides of the front. */
  roses?: EnvelopeRoses;
  /**
   * Front decoration and wording chosen separately (the editor's pieces);
   * when unset, both follow `print`.
   */
  art?: EnvelopeArt;
  label?: EnvelopeLabel;
}

/** Baby-rose sprays in the envelope's foil ink, or in their own colours. */
export type EnvelopeRoses =
  | { kind: 'foil' }
  | {
      kind: 'color';
      /** Outer petals, inner petals and buds, petal edges and hearts. */
      petal: string;
      petalInner: string;
      line: string;
      /** Leaves and stems. */
      leaf: string;
      /** Baby's breath florets. */
      breath: string;
    };

// ── pockets & sliders ───────────────────────────────────────────────────────

export type PocketVariant =
  /** Sleeve with a die-cut window; the card slides up out of it. */
  | 'sleeve'
  /** Card whose lower part is a wave-topped pocket holding an insert. */
  | 'lowerPocket'
  /** Translucent vellum jacket folded over the card, sealed. */
  | 'vellumWrap'
  /** Paper band around the card (đai giấy). */
  | 'bellyBand';

export type PocketWindow = 'none' | 'arch' | 'rect' | 'circle' | 'shutters';

export interface PocketSpec {
  variant: PocketVariant;
  /** Sleeve / pocket / band paper. */
  paper: string;
  /** Print on the sleeve / band. */
  ink: string;
  window?: PocketWindow;
  /** The window frames the couple's photo instead of the card behind. */
  windowPhoto?: boolean;
  stock?: PaperStock;
  /** Print the sleeve titles in foil. */
  foil?: boolean;
  /** Colours of the insert card, when it differs from the main card. */
  insert?: Partial<Palette>;
}

// ── folded cards, pop-ups, passports ────────────────────────────────────────

/** What a single panel of a folded card / passport page prints. */
export type PanelKind =
  /** Full invitation (InvitationCard 'full'). */
  | 'full'
  /** Announcement: kicker, names, short date, venue (InvitationCard 'announce'). */
  | 'announce'
  /** The invitation proper (InvitationCard 'invite'). */
  | 'invite'
  /** Month calendar with the day circled. */
  | 'calendar'
  /** The couple's photo (placeholder until configured). */
  | 'photo'
  /** Venue name, address and a little map. */
  | 'venue'
  /** Pattern with a large monogram. */
  | 'monogram';

/** Frame the couple's photo is cut to. */
export type PhotoFrame = 'oval' | 'arch' | 'rounded' | 'circle' | 'blob';

export type FoldVariant =
  /** Gấp đôi: a book-like card, cover hinged on the left. */
  | 'bifold'
  /** Gấp cửa: two half-width doors meeting in the middle. */
  | 'gatefold'
  /** Gấp ba zic-zac: three equal panels folded like a fan. */
  | 'accordion';

export interface FoldSpec {
  variant: FoldVariant;
  /** Inside panels, left to right — bifold 2, gatefold 3 (door, centre, door), accordion 3. */
  inside: PanelKind[];
  /** Front cover (bifold, accordion); gate-fold doors share one face split down the middle. */
  cover: PanelKind;
  /** Frame for any 'photo' panel. */
  photoFrame?: PhotoFrame;
}

export type PopupScene =
  /** Wildflower hills in front of the big date. */
  | 'meadow'
  /** Lotus pond under a moon bearing the monogram. */
  | 'lotus'
  /** Flower arbour framing the monogram. */
  | 'arbor'
  /** City skyline by the river under a moon. */
  | 'skyline'
  /** Hearts and tulips. */
  | 'hearts';

export interface PopupSpec {
  scene: PopupScene;
}

/** Silhouette of the directions card. */
export type DirectionsShape = 'rect' | 'rounded' | 'ticket' | 'scallop' | 'deckle';

/** The printed directions card's own look; every field is optional. */
export interface DirectionsSpec {
  /** Defaults to 'rect'. */
  shape?: DirectionsShape;
  /** Printed frame: a fine line (default), a double line, corner flowers or none. */
  frame?: 'line' | 'double' | 'corners' | 'none';
  /** Which side the sketch map sits on; defaults to 'left'. */
  mapSide?: 'left' | 'right';
  /**
   * The map: the hand-drawn sketch of Riverside Palace (default), real
   * OpenStreetMap tiles round a point, or an image (a map the couple chose).
   */
  map?: 'sketch' | 'tiles' | 'image';
  /** Tiles: the venue's point and the zoom level. */
  tiles?: { lat: number; lng: number; zoom: number };
  /** Image: its URL. */
  image?: string;
  /** Where the QR code leads; defaults to the venue's Google Maps link. */
  qrUrl?: string;
}

export interface PassportSpec {
  /** Booklet cover colour. */
  cover: string;
  /** Foil colour of the cover print. */
  foil: string;
  /** Inside page paper. */
  page: string;
  /** Accent of the boarding pass band. */
  ticket: string;
}

// ── the design ──────────────────────────────────────────────────────────────

export interface InvitationDesign {
  /** Stable kebab-case id — used in the /wedding/:id URL. Never rename. */
  id: string;
  /** Design name — a proper noun, shown as-is in every language. */
  nameVi: string;
  form: CardForm;
  style: DesignStyle;
  /** One-line blurb shown on the gallery card, per language. */
  description: LocalizedText;
  palette: Palette;
  fonts: FontPairing;
  layout: LayoutVariant;
  ornament: OrnamentKey;
  ornamentSecondary?: OrnamentKey;
  accentStyle?: AccentStyle;
  /** Defaults to 'flat'. */
  finish?: PrintFinish;
  /** Defaults to 'rect'. */
  shape?: CardShape;
  /** Defaults to 'smooth'. */
  stock?: PaperStock;
  relief?: ReliefSpec;
  envelope: EnvelopeSpec;
  /** Required when form === 'pocket'. */
  pocket?: PocketSpec;
  /** Required when form === 'folded'. */
  fold?: FoldSpec;
  /** Required when form === 'popup'. */
  popup?: PopupSpec;
  /** Required when form === 'passport'. */
  passport?: PassportSpec;
  /** Look of the printed directions card; defaults to a plain framed card. */
  directions?: DirectionsSpec;
}

// ── wedding facts & copy ────────────────────────────────────────────────────

export interface PersonName {
  /** Display name used on the big script line, e.g. "Tuấn Vũ". Its last word is the given name. */
  short: string;
  /** Full formal name — leave '' until decided; rendered only when set. */
  full: string;
}

export interface VenueInfo {
  name: LocalizedText;
  /** Brand name used on envelopes, tickets and covers, e.g. "Riverside Palace". */
  shortName: string;
  address: LocalizedText;
  lat: number;
  lng: number;
  /** Google Maps share link. */
  mapsShareUrl: string;
}

/** Single edit point for all wedding facts — see wedding-config.ts. */
/** A couple's parents, as printed under "Nhà trai" / "Nhà gái". */
export interface ParentNames {
  father: string;
  mother: string;
}

export interface WeddingConfig {
  groom: PersonName;
  bride: PersonName;
  /** Parents of the groom and of the bride, full names. */
  parents: { groom: ParentNames; bride: ParentNames };
  /** Calendar date of the reception, ISO "YYYY-MM-DD" — drives short dates. */
  isoDate: string;
  /** Party start and end, local time "HH:mm" (for calendar invites). */
  startTime: string;
  endTime: string;
  /** Venue's UTC offset, e.g. "+07:00". */
  utcOffset: string;
  /** e.g. vi "18h00" / en "6:00 PM" / th "18:00 น." */
  timeText: LocalizedText;
  /** e.g. vi "Chủ Nhật" / en "Sunday" / th "วันอาทิตย์" */
  weekdayText: LocalizedText;
  /** e.g. vi "ngày 28 tháng 03 năm 2027" / en "March 28th, 2027" / th "ที่ 28 มีนาคม พ.ศ. 2570" */
  dateText: LocalizedText;
  /** Optional Vietnamese lunar date, e.g. "nhằm ngày … năm Đinh Mùi". Vi-only; hidden while ''. */
  lunarDateText: string;
  /**
   * Banquet hall name at the venue, e.g. "Danube" — printed as "Sảnh Danube" /
   * "Danube Hall" / "ห้องจัดเลี้ยง Danube" and on the boarding pass. '' prints
   * a "to be announced" placeholder.
   */
  hall: string;
  venue: VenueInfo;
  rsvpNote: LocalizedText;
  /**
   * Wedding photos under src/assets/, e.g. 'assets/wedding/anh-cuoi-1.jpg'.
   * Empty until the photoshoot — every photo frame shows a placeholder.
   */
  photos: string[];
}

/** One family's heading and its parents' names, ready to print. */
export interface ParentsSide {
  label: string;
  names: string[];
}

/** Computed invitation copy (already in one language) handed to the card. */
export interface InvitationCopy {
  titleWord: string;
  inviteHeadline: string;
  coupleLine: string;
  /** Groom's and bride's display names, for layouts that set them apart. */
  coupleNames: [string, string];
  eventLine: string;
  /** Time and day on one line (calendar entries). */
  dateLine: string;
  /** Time and day as printed on the card: ["Vào lúc 18h00", "Chủ Nhật, ngày 28 tháng 03 năm 2027"]. */
  dateLines: [string, string];
  /** Groom's side then bride's side: "Nhà trai" + "Ông …", "Bà …". */
  parents: ParentsSide[];
  lunarLine?: string;
  venueLines: string[];
  closing: string;
  rsvp: string;
  monogram: string;
  /** Heading of the announcement face, e.g. "Lễ Thành Hôn". */
  kicker: string;
  /** "28 · 03 · 2027" (Thai uses the Buddhist Era year). */
  shortDate: string;
  /** "18:00 · Chủ Nhật". */
  timeWeekday: string;
  /** "Riverside Palace". */
  venueShort: string;
  saveTheDate: string;
  /** Label before the guest's name on envelopes and sleeves, e.g. "Kính mời". */
  guestLabel: string;
  /** Month heading for the calendar panel, e.g. "Tháng 03 · 2027". */
  monthTitle: string;
  /** Weekday initials Monday-first, e.g. ["T2", …, "CN"]. */
  weekdays: string[];
  /** Day of month (1-31) of the wedding. */
  day: number;
  /** Leading blank cells before day 1 in a Monday-first grid. */
  monthOffset: number;
  daysInMonth: number;
  /** Caption of an empty photo frame. */
  photoSoon: string;
  /** Heading of the venue panel, e.g. "Địa điểm". */
  venueLabel: string;
  /** Passport / boarding pass labels. */
  passport: PassportCopy;
  /** The printed directions card that goes in the envelope. */
  mapCard: MapCardCopy;
}

export interface MapCardCopy {
  /** e.g. "Đường đến tiệc cưới". */
  title: string;
  /** Caption under the QR code. */
  scan: string;
  /** Small print under the sketch map: not to scale. */
  sketch: string;
}

export interface PassportCopy {
  title: string;
  subtitle: string;
  boardingPass: string;
  airline: string;
  passenger: string;
  from: string;
  to: string;
  date: string;
  boarding: string;
  gate: string;
  seat: string;
  hall: string;
  fromPlace: string;
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
  /** Toggle of the collapsed guide (map, routes and notes). */
  expandLabel: string;
  collapseLabel: string;
  routes: RouteOption[];
  rideHailNote: string;
  metroNote: string;
  busNote: string;
  parkingNote: string;
}
