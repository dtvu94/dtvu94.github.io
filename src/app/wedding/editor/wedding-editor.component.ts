import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
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
  EditorState,
  EditorTab,
  EnvelopeFace,
  Sticker,
  StickerColor,
  StickerFace,
  StickerKind,
  EditorDirections,
  clearEditorState,
  defaultEditorState,
  editorConfig,
  isDefaultVenue,
  loadEditorState,
  newStickerId,
  saveEditorState,
  startFrom,
  toDesign,
} from './editor-state';
import { STICKER_DRAG_TYPE, StickerDrop, StickerMove } from './editor-stage.component';
import { EditorPhotoStore } from './photo-store';
import { formatCoords, geocode } from '../geometry/osm';

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
  standalone: false,
})
export class WeddingEditorComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly route = inject(ActivatedRoute);
  private readonly photos = inject(EditorPhotoStore);

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;
  /** Sticker whose photo is being replaced (null: a new photo sticker; '#map': the directions map). */
  private photoTarget: string | null = null;

  readonly opt = OPT;
  readonly designs = INVITATION_DESIGNS;
  readonly dragType = STICKER_DRAG_TYPE;

  readonly state = signal<EditorState>(loadEditorState());
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

  private saveTimer?: ReturnType<typeof setTimeout>;
  private resetTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const state = this.state();
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => saveEditorState(state), 250);
    });
    effect(() => {
      const names = this.copy().coupleLine;
      this.title.setTitle(`Tự thiết kế thiệp — ${names}`);
    });
  }

  ngOnInit(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
    void this.photos.load();
    // /wedding/editor?from=<id>: start from that ready-made design.
    const from = this.route.snapshot.queryParamMap.get('from');
    const design = from ? getDesignById(from) : undefined;
    if (design && design.id !== this.state().from) {
      this.state.update((s) => ({ ...startFrom(s, design), tab: 'card', overview: false }));
    }
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="robots"');
    clearTimeout(this.saveTimer);
    clearTimeout(this.resetTimer);
    saveEditorState(this.state());
  }

  // ── navigation ─────────────────────────────────────────────────────────

  setMode(mode: EditorMode): void {
    this.state.update((s) => ({ ...s, mode, tab: mode === 'online' && s.tab === 'envelope' ? 'card' : s.tab }));
  }

  setTab(tab: EditorTab): void {
    this.state.update((s) => ({ ...s, tab, overview: false }));
    this.selectedId.set(null);
  }

  setEnvelopeFace(face: EnvelopeFace): void {
    this.state.update((s) => ({ ...s, envelopeFace: face, overview: false }));
    this.selectedId.set(null);
  }

  toggleOverview(): void {
    this.state.update((s) => ({ ...s, overview: !s.overview }));
    this.selectedId.set(null);
  }

  startFromId(id: string): void {
    const design = getDesignById(id);
    if (design) {
      this.state.update((s) => startFrom(s, design));
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
    clearEditorState();
    this.selectedId.set(null);
    this.state.set(defaultEditorState());
  }

  // ── pieces ─────────────────────────────────────────────────────────────

  setCard<K extends keyof EditorCard>(key: K, value: EditorCard[K]): void {
    this.state.update((s) => ({ ...s, card: { ...s.card, [key]: value } }));
  }

  setEnvelope<K extends keyof EditorEnvelope>(key: K, value: EditorEnvelope[K]): void {
    this.state.update((s) => {
      const envelope = { ...s.envelope, [key]: value };
      // Choosing a seal or a liner shows the side it is on (an open pocket shows its lining from the back).
      const inside: EnvelopeFace = envelope.opening === 'flap' && envelope.size !== 'round' ? 'envelopeOpen' : 'envelopeBack';
      const face: EnvelopeFace = key === 'seal' ? 'envelopeBack' : key === 'liner' && value !== 'none' ? inside : s.envelopeFace;
      return { ...s, envelope, envelopeFace: key === 'seal' || key === 'liner' ? face : s.envelopeFace };
    });
  }

  setDirections<K extends keyof EditorDirections>(key: K, value: EditorDirections[K]): void {
    this.state.update((s) => ({ ...s, directions: { ...s.directions, [key]: value } }));
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
      this.state.update((s) => (s.directions.map === 'sketch' ? { ...s, directions: { ...s.directions, map: 'tiles' } } : s));
      this.geocodeStatus.set(`Đã tìm thấy: ${hit.label}`);
    } catch {
      this.geocodeStatus.set('Không kết nối được OpenStreetMap. Thử lại sau, hoặc dán tọa độ từ Google Maps.');
    }
  }

  setPaletteColor(slot: keyof Palette, value: string): void {
    this.state.update((s) => ({ ...s, palette: { ...s.palette, [slot]: value } }));
  }

  applyPalette(palette: Palette): void {
    this.state.update((s) => ({ ...s, palette: { ...palette } }));
  }

  setFont(slot: keyof FontPairing, value: string): void {
    this.state.update((s) => ({ ...s, fonts: { ...s.fonts, [slot]: value as FontFamilyKey } }));
  }

  setContent(key: keyof EditorContent, value: string): void {
    this.state.update((s) => ({ ...s, content: { ...s.content, [key]: value } }));
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
      this.state.update((s) => ({ ...s, directions: { ...s.directions, map: 'image', mapPhoto: photo } }));
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
    this.state.update((s) => ({ ...s, stickers: [...s.stickers, sticker] }));
    this.selectedId.set(sticker.id);
  }

  moveSticker(move: StickerMove): void {
    this.updateSticker(move.id, { x: move.x, y: move.y });
  }

  updateSticker(id: string, patch: Partial<Omit<Sticker, 'id' | 'face' | 'kind'>>): void {
    this.state.update((s) => ({ ...s, stickers: s.stickers.map((st) => (st.id === id ? { ...st, ...patch } : st)) }));
  }

  setStickerColor(color: StickerColor): void {
    const id = this.selectedId();
    if (id) {
      this.updateSticker(id, { color });
    }
  }

  duplicateSticker(): void {
    const sticker = this.selected();
    if (sticker) {
      const copy = { ...sticker, id: newStickerId(), x: Math.min(1, sticker.x + 0.05), y: Math.min(1, sticker.y + 0.05) };
      this.state.update((s) => ({ ...s, stickers: [...s.stickers, copy] }));
      this.selectedId.set(copy.id);
    }
  }

  removeSticker(id: string | null = this.selectedId()): void {
    if (id) {
      this.state.update((s) => ({ ...s, stickers: s.stickers.filter((st) => st.id !== id) }));
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
