import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { PaperPiece } from '../paper/paper-suite.component';
import { Sticker, StickerFace, StickerKind } from './editor-state';

/** Data type of a sticker dragged in from the tray. */
export const STICKER_DRAG_TYPE = 'application/x-wedding-sticker';

export interface StickerDrop {
  kind: StickerKind;
  x: number;
  y: number;
}

export interface StickerMove {
  id: string;
  x: number;
  y: number;
}

interface Grab {
  id: string;
  pointer: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  rect: DOMRect;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** How close (in screen px) a dragged sticker must come to a line to snap to it. */
const SNAP_PX = 7;
/** The grid stickers snap to when no line is near: every 5 %. */
const GRID = 20;

/** The snap line nearest `value` within `reach`, or null. */
function nearestLine(value: number, lines: number[], reach: number): number | null {
  let best: number | null = null;
  for (const line of lines) {
    if (Math.abs(line - value) <= reach && (best === null || Math.abs(line - value) < Math.abs(best - value))) {
      best = line;
    }
  }
  return best;
}

/**
 * Snaps a dragged sticker's centre: to the face's centre lines and the other
 * stickers' centres (returned as guides to draw), else to a 5 % grid.
 */
export function snapPoint(
  x: number,
  y: number,
  others: { x: number; y: number }[],
  reachX: number,
  reachY: number,
): { x: number; y: number; guideX: number | null; guideY: number | null } {
  const guideX = nearestLine(x, [0.5, ...others.map((o) => o.x)], reachX);
  const guideY = nearestLine(y, [0.5, ...others.map((o) => o.y)], reachY);
  const grid = (v: number, reach: number) => {
    const g = Math.round(v * GRID) / GRID;
    return Math.abs(g - v) <= reach ? g : v;
  };
  return { x: guideX ?? grid(x, reachX), y: guideY ?? grid(y, reachY), guideX, guideY };
}

/**
 * One printed piece at a size that fits the screen, with its stickers laid
 * over it. Editable, a sticker can be dropped in from the tray, dragged
 * with mouse, pen or finger, nudged with the arrow keys and removed with
 * Delete; read-only, it is the same piece for the overview.
 */
@Component({
  selector: 'app-editor-stage',
  templateUrl: './editor-stage.component.html',
  styleUrls: ['./editor-stage.component.css'],
  standalone: false,
})
export class EditorStageComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input({ required: true }) piece!: PaperPiece;
  /** Face whose stickers are shown (null: this view takes none). */
  @Input() face: StickerFace | null = null;
  @Input() stickers: Sticker[] = [];
  @Input() selectedId: string | null = null;
  @Input() editable = false;
  /** Scale to fit this much of the window's height (editing); else fill the width. */
  @Input() fitHeight = false;
  /** Snap while dragging (Alt held: free). */
  @Input() snap = false;

  /** Snap lines shown while a sticker is dragged onto them (fractions of the face). */
  guideX: number | null = null;
  guideY: number | null = null;
  dragging = false;

  @Output() readonly add = new EventEmitter<StickerDrop>();
  @Output() readonly move = new EventEmitter<StickerMove>();
  @Output() readonly select = new EventEmitter<string | null>();
  @Output() readonly remove = new EventEmitter<string>();

  @ViewChild('layer') layer?: ElementRef<HTMLElement>;

  private grab: Grab | null = null;

  get faceStickers(): Sticker[] {
    return this.face ? this.stickers.filter((s) => s.face === this.face) : [];
  }

  /** Width that keeps the whole piece in view while editing. */
  get width(): string | null {
    return this.fitHeight ? `min(100%, calc(var(--stage-h, 64vh) * ${this.piece.w} / ${this.piece.h}))` : null;
  }

  onDragOver(event: DragEvent): void {
    if (this.editable && this.face && event.dataTransfer?.types.includes(STICKER_DRAG_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent): void {
    const kind = event.dataTransfer?.getData(STICKER_DRAG_TYPE) as StickerKind | undefined;
    if (!this.editable || !this.face || !kind || !this.layer) {
      return;
    }
    event.preventDefault();
    const rect = this.layer.nativeElement.getBoundingClientRect();
    this.add.emit({ kind, x: clamp01((event.clientX - rect.left) / rect.width), y: clamp01((event.clientY - rect.top) / rect.height) });
  }

  /** A press on bare paper clears the selection. */
  onLayerDown(event: PointerEvent): void {
    if (this.editable && event.target === event.currentTarget) {
      this.select.emit(null);
    }
  }

  onGrab(event: PointerEvent, sticker: Sticker): void {
    if (!this.editable || !this.layer) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.select.emit(sticker.id);
    // A locked sticker can be picked (to unlock it) but not moved.
    if (sticker.locked) {
      return;
    }
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.grab = {
      id: sticker.id,
      pointer: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: sticker.x,
      y: sticker.y,
      rect: this.layer.nativeElement.getBoundingClientRect(),
    };
  }

  onDrag(event: PointerEvent): void {
    const g = this.grab;
    if (!g || event.pointerId !== g.pointer) {
      return;
    }
    this.dragging = true;
    let x = clamp01(g.x + (event.clientX - g.startX) / g.rect.width);
    let y = clamp01(g.y + (event.clientY - g.startY) / g.rect.height);
    this.guideX = this.guideY = null;
    if (this.snap && !event.altKey) {
      const others = this.faceStickers.filter((s) => s.id !== g.id);
      const snapped = snapPoint(x, y, others, SNAP_PX / g.rect.width, SNAP_PX / g.rect.height);
      ({ x, y } = snapped);
      this.guideX = snapped.guideX;
      this.guideY = snapped.guideY;
    }
    this.move.emit({ id: g.id, x, y });
  }

  onRelease(event: PointerEvent): void {
    if (this.grab?.pointer === event.pointerId) {
      this.grab = null;
      this.dragging = false;
      this.guideX = this.guideY = null;
    }
  }

  /** Arrow keys move the sticker 1 % (10 % with Shift); Delete removes it. */
  onKey(event: KeyboardEvent, sticker: Sticker): void {
    const step = event.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const delta = moves[event.key];
    if (delta && !sticker.locked) {
      event.preventDefault();
      this.move.emit({ id: sticker.id, x: clamp01(sticker.x + delta[0]), y: clamp01(sticker.y + delta[1]) });
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.remove.emit(sticker.id);
    }
  }
}
