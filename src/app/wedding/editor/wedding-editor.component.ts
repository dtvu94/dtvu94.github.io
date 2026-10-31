import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { INVITATION_DESIGNS, getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { PaperPieceKind, WEDDING_UI } from '../data/ui-strings';
import { FontFamilyKey, FontPairing, Palette } from '../data/wedding.types';
import { LanguageService } from '../language.service';
import { PaperPiece, paperPieces } from '../paper/paper-suite.component';
import * as OPT from './editor-options';
import {
  EditorCard,
  EditorContent,
  EditorEnvelope,
  EditorMode,
  EditorTab,
  EnvelopeFace,
  Sticker,
  StickerColor,
  StickerFace,
  StickerKind,
  EditorDirections,
  defaultEditorState,
  editorConfig,
  isDefaultVenue,
  newStickerId,
  startFrom,
  toDesign,
} from './editor-state';
import { photosInUse } from './editor-book';
import { SHARE_HASH } from './editor-share';
import { EditorStore } from './editor-store';
import { BLEED_MM, MARGIN_MM, PrintPage } from './editor-print.component';
import { STICKER_DRAG_TYPE, StickerDrop, StickerMove } from './editor-stage.component';
import { EditorPhotoStore } from './photo-store';
import { formatCoords, geocode } from '../geometry/osm';

/** Print scale: the designs are drawn at 80 design px per inch. */
const MM_PER_PX = 25.4 / 80;
const LASER_LAYOUTS = new Set(['laserLace', 'laserArch', 'laserLattice', 'laserBranch', 'laserCloud']);

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Envelope fields set with a colour picker (rapid changes merge into one undo step). */
const CONTINUOUS_ENVELOPE: ReadonlySet<string> = new Set(['paper', 'ink', 'edge', 'sealColor', 'linerBg', 'linerInk']);

/** Crop marks at the four trim corners, 3 mm off the trim, 5 mm long. */
function cropMarks(x: number, y: number, w: number, h: number): string {
  const off = BLEED_MM;
  const len = 5;
  let d = '';
  for (const [cx, sx] of [
    [x, -1],
    [x + w, 1],
  ] as const) {
    for (const [cy, sy] of [
      [y, -1],
      [y + h, 1],
    ] as const) {
      d += `M${cx + sx * off} ${cy}h${sx * len}M${cx} ${cy + sy * off}v${sy * len}`;
    }
  }
  return d;
}

/** What the stage is showing, and which face its stickers belong to. */
interface StageView {
  piece: PaperPiece;
  face: StickerFace | null;
  title: string;
}

const PIECE_TITLES: Partial<Record<PaperPieceKind, string>> = {
  envelopeFront: 'Bao thư · mặt trước',
  envelopeBack: 'Bao thư · mặt sau',
  envelopeOpen: 'Bao thư · bên trong',
  card: 'Thiệp mời',
  directions: 'Thiệp đường đi',
};

/**
 * Tự thiết kế thiệp (thử nghiệm) — /wedding/editor. Pick paper or online,
 * then each piece — envelope, invitation, directions card — and set its
 * shape, colours, decoration and wording; drag stickers (the logo, a heart,
 * flowers…) onto any face; type the wedding facts once. The stage shows the
 * piece being edited, the overview the whole suite. Everything is kept in
 * this browser's localStorage; nothing is uploaded.
 */
@Component({
  selector: 'app-wedding-editor',
  templateUrl: './wedding-editor.component.html',
  styleUrls: ['./wedding-editor.component.css'],
  providers: [EditorStore],
  standalone: false,
})
export class WeddingEditorComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly photos = inject(EditorPhotoStore);
  readonly store = inject(EditorStore);

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;
  /** Sticker whose photo is being replaced (null: a new photo sticker; '#map': the directions map). */
  private photoTarget: string | null = null;

  readonly opt = OPT;
  readonly designs = INVITATION_DESIGNS;
  readonly dragType = STICKER_DRAG_TYPE;

  readonly state = this.store.state;
  readonly lang = this.language.lang;
  readonly ui = computed(() => WEDDING_UI[this.lang()]);
  readonly config = computed(() => editorConfig(this.state().content));
  readonly copy = computed(() => buildWording(this.config(), this.lang()));
  readonly design = computed(() => toDesign(this.state(), this.photos.urls()));
  /** A venue other than Riverside Palace: its hand-drawn map no longer applies. */
  readonly newVenue = computed(() => !isDefaultVenue(this.state().content));
  /** Result of the last address lookup. */
  readonly geocodeStatus = signal('');
  readonly pieces = computed(() => paperPieces(this.design()));

  /** Tabs for the chosen kind: an online invitation has no envelope. */
  readonly tabs = computed(() => OPT.TABS.filter((tab) => this.state().mode === 'paper' || tab.value !== 'envelope'));

  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.state().stickers.find((s) => s.id === this.selectedId()) ?? null);
  /** "Làm lại từ đầu" asks once more before clearing everything. */
  readonly confirmReset = signal(false);

  readonly stage = computed<StageView>(() => {
    const state = this.state();
    const pieces = this.pieces();
    const find = (kind: PaperPieceKind) => pieces.find((p) => p.kind === kind) ?? pieces[0];
    let kind: PaperPieceKind = 'card';
    if (state.tab === 'envelope' && state.mode === 'paper') {
      kind = state.envelopeFace === 'envelopeOpen' && state.envelope.liner === 'none' ? 'envelopeFront' : state.envelopeFace;
    } else if (state.tab === 'directions') {
      kind = 'directions';
    }
    const piece = find(kind);
    const face: StickerFace | null = piece.kind === 'envelopeOpen' ? null : (piece.kind as StickerFace);
    return { piece, face, title: PIECE_TITLES[piece.kind] ?? '' };
  });

  /** Pieces of the overview: the printed suite, or the online card and the directions. */
  readonly overviewPieces = computed(() => {
    const pieces = this.pieces();
    return this.state().mode === 'paper' ? pieces : pieces.filter((p) => p.kind === 'directions');
  });

  private resetTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const names = this.copy().coupleLine;
      this.title.setTitle(`Tự thiết kế thiệp — ${names}`);
    });
  }

  ngOnInit(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
    // Photos no design uses any more are forgotten once the stored ones are read.
    void this.photos.load().then(() => this.photos.prune(photosInUse(this.store.book())));
    // /wedding/editor?from=<id>: start from that ready-made design.
    const from = this.route.snapshot.queryParamMap.get('from');
    const design = from ? getDesignById(from) : undefined;
    if (design && design.id !== this.state().from) {
      this.store.change((s) => ({ ...startFrom(s, design), tab: 'card', overview: false }));
    }
    // /wedding/editor#d=…: a design someone shared opens as a new phương án.
    const hash = this.document.location.hash;
    if (hash.startsWith(SHARE_HASH)) {
      void this.store.importShared(hash).then((ok) => {
        this.notice.set(ok ? 'Đã mở thiết kế được chia sẻ thành một phương án mới.' : 'Link chia sẻ bị lỗi hoặc không đầy đủ.');
        this.document.defaultView?.history.replaceState(null, '', this.document.location.pathname);
      });
    }
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="robots"');
    clearTimeout(this.resetTimer);
    clearTimeout(this.noticeTimer);
    this.store.flush();
  }

  /** Ctrl/⌘ + Z undoes, Ctrl/⌘ + Shift + Z or Ctrl + Y redoes (text fields keep their own undo). */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (!(event.ctrlKey || event.metaKey) || target?.closest('textarea, input:not([type=range]):not([type=color]):not([type=checkbox]), select')) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      this.redo();
    }
  }

  undo(): void {
    this.store.undo();
    this.dropMissingSelection();
  }

  redo(): void {
    this.store.redo();
    this.dropMissingSelection();
  }

  private dropMissingSelection(): void {
    if (this.selectedId() && !this.selected()) {
      this.selectedId.set(null);
    }
  }

  /** A short message under the bar (link copied, shared design opened…). */
  readonly notice = signal('');
  private noticeTimer?: ReturnType<typeof setTimeout>;

  private say(message: string): void {
    this.notice.set(message);
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => this.notice.set(''), 6000);
  }

  // ── phương án ──────────────────────────────────────────────────────────

  /** Second design shown next to the open one (null: not comparing). */
  readonly compareId = signal<string | null>(null);

  openDesign(id: string): void {
    this.store.open(id);
    this.onDesignOpened();
  }

  /** Another design is open: nothing selected, no comparison. */
  onDesignOpened(): void {
    this.selectedId.set(null);
    this.compareId.set(null);
  }

  /** The design compared with the open one, drawn the same way. */
  readonly compared = computed(() => {
    const id = this.compareId();
    const entry = id ? this.store.book().items.find((item) => item.id === id) : null;
    if (!entry) {
      return null;
    }
    const design = toDesign(entry.state, this.photos.urls());
    const copy = buildWording(editorConfig(entry.state.content), this.lang());
    const pieces = paperPieces(design).filter((p) => ['envelopeFront', 'card', 'directions'].includes(p.kind));
    return { entry, design, copy, pieces: entry.state.mode === 'paper' ? pieces : pieces.filter((p) => p.kind !== 'envelopeFront') };
  });

  /** Pieces of the open design shown in a comparison. */
  readonly comparePieces = computed(() => {
    const pieces = this.pieces().filter((p) => ['envelopeFront', 'card', 'directions'].includes(p.kind));
    return this.state().mode === 'paper' ? pieces : pieces.filter((p) => p.kind !== 'envelopeFront');
  });

  startCompare(): void {
    const other = this.store.book().items.find((item) => item.id !== this.store.book().active);
    if (other) {
      this.compareId.set(other.id);
      this.selectedId.set(null);
    }
  }

  async copyShareLink(): Promise<void> {
    const url = await this.store.shareUrl(this.document.location.origin);
    this.shareUrl.set(url);
    try {
      await this.document.defaultView?.navigator.clipboard.writeText(url);
      this.say('Đã sao chép link. Người nhận mở link sẽ thấy thiết kế này (ảnh cưới tải lên không đi kèm link).');
    } catch {
      this.say('Sao chép link ở ô bên dưới (ảnh cưới tải lên không đi kèm link).');
    }
  }

  /** The last share link, shown for copying by hand. */
  readonly shareUrl = signal('');

  // ── print-ready PDF ────────────────────────────────────────────────────

  /** The print preview is open (and printable). */
  readonly printing = signal(false);

  readonly printPages = computed<PrintPage[]>(() => {
    const state = this.state();
    const design = this.design();
    const kinds: PaperPieceKind[] = state.mode === 'paper' ? ['envelopeFront', 'envelopeBack', 'card', 'directions'] : ['card', 'directions'];
    return this.pieces()
      .filter((piece) => kinds.includes(piece.kind))
      .map((piece) => {
        const w = round1(piece.w * MM_PER_PX);
        const h = round1(piece.h * MM_PER_PX);
        const env = state.envelope;
        let bleed: string | null = null;
        if (piece.kind === 'card' && state.card.shape === 'rect') {
          bleed = LASER_LAYOUTS.has(state.card.layout) ? (design.palette.overlay ?? design.palette.accent) : design.palette.surface;
        } else if (piece.kind.startsWith('envelope') && env.size !== 'round' && env.opening !== 'sleeve') {
          bleed = env.paper;
        } else if (piece.kind === 'directions' && state.directions.shape === 'rect') {
          bleed = design.palette.surface;
        }
        return {
          piece,
          face: this.stickerFace(piece.kind),
          title: this.pieceTitle(piece.kind),
          w,
          h,
          pageW: round1(w + 2 * MARGIN_MM),
          pageH: round1(h + 2 * MARGIN_MM),
          bleed,
          marks: cropMarks(MARGIN_MM, MARGIN_MM, w, h),
        };
      });
  });

  /** Opens the print preview (its page sizes go to the browser's print stylesheet). */
  exportPdf(): void {
    this.selectedId.set(null);
    this.printing.set(true);
  }

  // ── navigation ─────────────────────────────────────────────────────────

  setMode(mode: EditorMode): void {
    this.store.change((s) => ({ ...s, mode, tab: mode === 'online' && s.tab === 'envelope' ? 'card' : s.tab }));
  }

  setTab(tab: EditorTab): void {
    this.store.navigate((s) => ({ ...s, tab, overview: false }));
    this.selectedId.set(null);
    this.compareId.set(null);
  }

  setEnvelopeFace(face: EnvelopeFace): void {
    this.store.navigate((s) => ({ ...s, envelopeFace: face, overview: false }));
    this.selectedId.set(null);
    this.compareId.set(null);
  }

  toggleOverview(): void {
    this.store.navigate((s) => ({ ...s, overview: !s.overview }));
    this.selectedId.set(null);
    this.compareId.set(null);
  }

  startFromId(id: string): void {
    const design = getDesignById(id);
    if (design) {
      this.store.change((s) => startFrom(s, design));
    }
  }

  reset(): void {
    if (!this.confirmReset()) {
      this.confirmReset.set(true);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.confirmReset.set(false), 4000);
      return;
    }
    this.confirmReset.set(false);
    this.selectedId.set(null);
    // Undoable, like any other change.
    this.store.change(() => defaultEditorState());
  }

  // ── pieces ─────────────────────────────────────────────────────────────

  setCard<K extends keyof EditorCard>(key: K, value: EditorCard[K]): void {
    this.store.change((s) => ({ ...s, card: { ...s.card, [key]: value } }));
  }

  setEnvelope<K extends keyof EditorEnvelope>(key: K, value: EditorEnvelope[K]): void {
    this.store.change((s) => {
      const envelope = { ...s.envelope, [key]: value };
      // Choosing a seal or a liner shows the side it is on (an open pocket shows its lining from the back).
      const inside: EnvelopeFace = envelope.opening === 'flap' && envelope.size !== 'round' ? 'envelopeOpen' : 'envelopeBack';
      const face: EnvelopeFace = key === 'seal' ? 'envelopeBack' : key === 'liner' && value !== 'none' ? inside : s.envelopeFace;
      return { ...s, envelope, envelopeFace: key === 'seal' || key === 'liner' ? face : s.envelopeFace };
      // A colour being dragged across the picker is one step; a choice is a step of its own.
    }, CONTINUOUS_ENVELOPE.has(key) ? `env.${key}` : '');
  }

  setDirections<K extends keyof EditorDirections>(key: K, value: EditorDirections[K]): void {
    this.store.change((s) => ({ ...s, directions: { ...s.directions, [key]: value } }), key === 'zoom' ? 'dir.zoom' : '');
  }

  /** Finds the venue's point on OpenStreetMap from its name and address. */
  async findOnMap(): Promise<void> {
    const { venueName, address } = this.state().content;
    const query = [venueName, address].filter((part) => part.trim()).join(', ');
    if (!query) {
      return;
    }
    this.geocodeStatus.set('Đang tìm trên OpenStreetMap…');
    try {
      // The full name first; failing that, the street address alone.
      const hit = (await geocode(query)) ?? (address.trim() ? await geocode(address) : null);
      if (!hit) {
        this.geocodeStatus.set('Không tìm thấy. Thử địa chỉ ngắn hơn, hoặc dán tọa độ từ Google Maps (bấm giữ vào địa điểm để thấy tọa độ).');
        return;
      }
      this.setContent('coords', formatCoords(hit.lat, hit.lng));
      this.store.change((s) => (s.directions.map === 'sketch' ? { ...s, directions: { ...s.directions, map: 'tiles' } } : s));
      this.geocodeStatus.set(`Đã tìm thấy: ${hit.label}`);
    } catch {
      this.geocodeStatus.set('Không kết nối được OpenStreetMap. Thử lại sau, hoặc dán tọa độ từ Google Maps.');
    }
  }

  setPaletteColor(slot: keyof Palette, value: string): void {
    this.store.change((s) => ({ ...s, palette: { ...s.palette, [slot]: value } }), `palette.${slot}`);
  }

  applyPalette(palette: Palette): void {
    this.store.change((s) => ({ ...s, palette: { ...palette } }));
  }

  setFont(slot: keyof FontPairing, value: string): void {
    this.store.change((s) => ({ ...s, fonts: { ...s.fonts, [slot]: value as FontFamilyKey } }));
  }

  setContent(key: keyof EditorContent, value: string): void {
    this.store.change((s) => ({ ...s, content: { ...s.content, [key]: value } }), `content.${key}`);
  }

  isPalette(palette: Palette): boolean {
    const current = this.state().palette;
    return (Object.keys(palette) as (keyof Palette)[]).every((key) => palette[key] === current[key]);
  }

  /** Value of a form control from its input event. */
  valueOf(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  checkedOf(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  // ── stickers ───────────────────────────────────────────────────────────

  onTrayDragStart(event: DragEvent, kind: StickerKind): void {
    event.dataTransfer?.setData(STICKER_DRAG_TYPE, kind);
    event.dataTransfer?.setData('text/plain', kind);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  /** A click on the tray (phones, keyboards) drops the sticker in the middle of the face; a photo asks for the file first. */
  onTrayClick(kind: StickerKind): void {
    if (kind === 'photo') {
      this.pickPhoto(null);
    } else {
      this.addSticker({ kind, x: 0.5, y: 0.5 });
    }
  }

  /** Width of a sticker's preview in the tray. */
  traySize(kind: StickerKind): number {
    return kind === 'text' ? 22 : kind === 'hairlineFlourish' || kind === 'birds' ? 60 : kind === 'photo' ? 30 : 34;
  }

  pickPhoto(stickerId: string | null): void {
    this.photoTarget = stickerId;
    const input = this.photoInput?.nativeElement;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  async onPhotoChosen(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const photo = await this.photos.add(file);
    if (this.photoTarget === '#map') {
      this.store.change((s) => ({ ...s, directions: { ...s.directions, map: 'image', mapPhoto: photo } }));
    } else if (this.photoTarget) {
      this.updateSticker(this.photoTarget, { photo });
    } else {
      this.addSticker({ kind: 'photo', x: 0.5, y: 0.5 }, { photo });
    }
  }

  addSticker(drop: StickerDrop, extra: Partial<Sticker> = {}): void {
    const face = this.stage().face;
    if (!face || this.state().overview) {
      return;
    }
    const sticker: Sticker = {
      id: newStickerId(),
      face,
      kind: drop.kind,
      x: drop.x,
      y: drop.y,
      size: OPT.stickerMeta(drop.kind).size,
      rotate: 0,
      color: drop.kind === 'text' ? 'primary' : 'accent',
      ...(drop.kind === 'text' ? { text: 'Thân mời', font: 'script' as const } : {}),
      ...(drop.kind === 'photo' ? { frame: 'oval' as const } : {}),
      ...extra,
    };
    this.store.change((s) => ({ ...s, stickers: [...s.stickers, sticker] }));
    this.selectedId.set(sticker.id);
  }

  moveSticker(move: StickerMove): void {
    this.updateSticker(move.id, { x: move.x, y: move.y });
  }

  updateSticker(id: string, patch: Partial<Omit<Sticker, 'id' | 'face' | 'kind'>>): void {
    // Dragging, sliding and typing merge into one step; other changes are steps of their own.
    const keys = Object.keys(patch);
    const continuous = keys.every((key) => ['x', 'y', 'size', 'rotate', 'text'].includes(key));
    this.store.change(
      (s) => ({ ...s, stickers: s.stickers.map((st) => (st.id === id ? { ...st, ...patch } : st)) }),
      continuous ? `sticker.${id}.${keys.sort().join(',')}` : '',
    );
  }

  setStickerColor(color: StickerColor): void {
    const id = this.selectedId();
    if (id) {
      this.updateSticker(id, { color });
    }
  }

  /** Snap to the centre lines, other stickers and a 5 % grid while dragging. */
  readonly snap = signal(true);

  /** Puts the selected sticker on top of all others (1) or beneath them (-1). */
  moveLayer(direction: 1 | -1): void {
    const id = this.selectedId();
    if (!id) {
      return;
    }
    this.store.change((s) => {
      const sticker = s.stickers.find((st) => st.id === id);
      if (!sticker) {
        return s;
      }
      const rest = s.stickers.filter((st) => st.id !== id);
      return { ...s, stickers: direction > 0 ? [...rest, sticker] : [sticker, ...rest] };
    });
  }

  duplicateSticker(): void {
    const sticker = this.selected();
    if (sticker) {
      const copy = { ...sticker, id: newStickerId(), x: Math.min(1, sticker.x + 0.05), y: Math.min(1, sticker.y + 0.05) };
      this.store.change((s) => ({ ...s, stickers: [...s.stickers, copy] }));
      this.selectedId.set(copy.id);
    }
  }

  removeSticker(id: string | null = this.selectedId()): void {
    if (id) {
      this.store.change((s) => ({ ...s, stickers: s.stickers.filter((st) => st.id !== id) }));
      this.selectedId.set(null);
    }
  }

  /** Stickers on the face shown, for the count under the tray. */
  faceCount(): number {
    const face = this.stage().face;
    return face ? this.state().stickers.filter((s) => s.face === face).length : 0;
  }

  stickerFace(kind: PaperPieceKind): StickerFace | null {
    return kind === 'envelopeOpen' ? null : (kind as StickerFace);
  }

  pieceTitle(kind: PaperPieceKind): string {
    return PIECE_TITLES[kind] ?? '';
  }
}
