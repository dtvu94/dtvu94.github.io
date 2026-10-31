import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { ZoomStrings } from '../data/ui-strings';
import { QUICK_ZOOM, Size, ZOOM_STEP, ZoomView, clampView, fitView, stageCentre, zoomAround } from './zoom-view';

/** One thing the viewer can show: its caption and its design size. */
export interface ZoomItem {
  /** Stable key (a piece kind, or 'online'). */
  key: string;
  label: string;
  w: number;
  h: number;
}

interface Point {
  x: number;
  y: number;
}

type Gesture =
  | { kind: 'pan'; start: Point; from: ZoomView; moved: boolean; afterPinch?: boolean }
  | { kind: 'pinch'; distance: number; centre: Point; from: ZoomView };

/** Keyboard pan step, in screen pixels. */
const KEY_PAN = 80;
/** Two taps closer than this (ms, px) make a double-tap. */
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 30;
/** Horizontal swipe (px) that turns to the next piece when nothing is zoomed. */
const SWIPE_PX = 60;

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Full-screen viewer for checking a printed piece (or the online card) up
 * close: the same vector art, re-drawn at up to 6× its design size, so lines
 * and type stay sharp. Drag to move; wheel, pinch, double-click/tap or the
 * +/− buttons to zoom; arrows to step through the pieces; Esc to close.
 *
 * Gestures run outside Angular and write the transform straight to the
 * canvas, so a drag never re-checks the page behind the viewer.
 */
@Component({
  selector: 'app-zoom-viewer',
  templateUrl: './zoom-viewer.component.html',
  styleUrls: ['./zoom-viewer.component.css'],
  standalone: false,
})
export class ZoomViewerComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) items!: ZoomItem[];
  /** Draws an item's art at its design size; context `$implicit` is the item. */
  @Input({ required: true }) art!: TemplateRef<{ $implicit: ZoomItem }>;
  @Input({ required: true }) strings!: ZoomStrings;

  @Input({ required: true })
  set index(value: number) {
    this.current = value;
    if (this.ready) {
      this.showWhole(false);
    }
  }
  get index(): number {
    return this.current;
  }

  @Output() readonly indexChange = new EventEmitter<number>();
  @Output() readonly closed = new EventEmitter<void>();

  @ViewChild('dialog', { static: true }) private dialogRef!: ElementRef<HTMLElement>;
  @ViewChild('stage', { static: true }) private stageRef!: ElementRef<HTMLElement>;
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLElement>;
  @ViewChild('level', { static: true }) private levelRef!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

  private current = 0;
  private ready = false;
  private view: ZoomView = { s: 1, x: 0, y: 0 };
  private fit: ZoomView = { s: 1, x: 0, y: 0 };
  private readonly pointers = new Map<number, Point>();
  private gesture?: Gesture;
  private lastTap = { t: 0, x: 0, y: 0 };
  private lastPointerType = '';
  /** When the last double-tap zoom ran, so the browser's own dblclick after it is skipped. */
  private lastQuickZoom = 0;
  private readonly cleanup: Array<() => void> = [];
  private readonly returnFocus: Element | null = this.document.activeElement;
  private savedOverflow = '';
  private context?: { $implicit: ZoomItem };

  get item(): ZoomItem {
    return this.items[this.current] ?? this.items[0];
  }

  /** Template context, rebuilt only when the item changes. */
  get artContext(): { $implicit: ZoomItem } {
    const item = this.item;
    if (this.context?.$implicit !== item) {
      this.context = { $implicit: item };
    }
    return this.context;
  }

  ngAfterViewInit(): void {
    this.ready = true;
    const root = this.document.documentElement;
    this.savedOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    this.showWhole(false);
    this.zone.runOutsideAngular(() => this.listen());
    // Focus the dialog itself: Tab then reaches its buttons, and no focus
    // ring lands on a button the user never chose.
    this.dialogRef.nativeElement.focus({ preventScroll: true });
  }

  ngOnDestroy(): void {
    this.cleanup.forEach((off) => off());
    this.document.documentElement.style.overflow = this.savedOverflow;
    const back = this.returnFocus as HTMLElement | null;
    if (back && back !== this.document.body && typeof back.focus === 'function' && back.isConnected) {
      back.focus({ preventScroll: true });
    }
  }

  // ── commands (buttons and keys) ─────────────────────────────────────

  zoomIn(): void {
    this.zoomBy(ZOOM_STEP);
  }

  zoomOut(): void {
    this.zoomBy(1 / ZOOM_STEP);
  }

  /** Back to the whole piece on screen. */
  reset(): void {
    this.showWhole(true);
  }

  /** Steps to the previous (-1) or next (+1) piece, wrapping around. */
  go(step: number): void {
    const count = this.items.length;
    if (count > 1) {
      this.indexChange.emit((this.current + step + count) % count);
    }
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const zoomed = this.isZoomed();
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
      case '_':
        this.zoomOut();
        break;
      case '0':
        this.reset();
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        const sign = event.key === 'ArrowLeft' ? 1 : -1;
        if (zoomed) {
          this.panBy(sign * KEY_PAN, 0, true);
        } else {
          this.go(-sign);
        }
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown':
        if (!zoomed) {
          return;
        }
        this.panBy(0, (event.key === 'ArrowUp' ? 1 : -1) * KEY_PAN, true);
        break;
      case 'Tab':
        this.trapFocus(event);
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  // ── view ────────────────────────────────────────────────────────────

  private stageSize(): Size {
    const rect = this.stageRef.nativeElement.getBoundingClientRect();
    // No layout (tests): fall back to the window.
    return rect.width > 0 && rect.height > 0
      ? { w: rect.width, h: rect.height }
      : { w: window.innerWidth || 1024, h: window.innerHeight || 768 };
  }

  private artSize(): Size {
    return { w: this.item.w, h: this.item.h };
  }

  private isZoomed(): boolean {
    return this.view.s > this.fit.s * 1.01;
  }

  private showWhole(animate: boolean): void {
    this.fit = fitView(this.stageSize(), this.artSize());
    this.apply(this.fit, animate);
  }

  private zoomBy(factor: number, at?: Point): void {
    const stage = this.stageSize();
    const point = at ?? stageCentre(stage);
    this.apply(zoomAround(this.view, factor, point.x, point.y, stage, this.artSize(), this.fit.s), true);
  }

  private panBy(dx: number, dy: number, animate: boolean): void {
    this.setView({ s: this.view.s, x: this.view.x + dx, y: this.view.y + dy }, animate);
  }

  private setView(view: ZoomView, animate = false): void {
    this.apply(clampView(view, this.stageSize(), this.artSize(), this.fit.s), animate);
  }

  private apply(view: ZoomView, animate: boolean): void {
    this.view = view;
    const canvas = this.canvasRef.nativeElement;
    canvas.classList.toggle('zv__canvas--ease', animate);
    canvas.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`;
    this.levelRef.nativeElement.textContent = `${Math.round((view.s / this.fit.s) * 100)}%`;
  }

  /** Double-click / double-tap: zoom in on that spot, or back to the whole piece. */
  private quickZoom(at: Point): void {
    this.lastQuickZoom = performance.now();
    if (this.isZoomed()) {
      this.showWhole(true);
    } else {
      this.zoomBy(QUICK_ZOOM, at);
    }
  }

  // ── gestures ────────────────────────────────────────────────────────

  private listen(): void {
    const stage = this.stageRef.nativeElement;
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      handler: (event: HTMLElementEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      stage.addEventListener(type, handler, options);
      this.cleanup.push(() => stage.removeEventListener(type, handler, options));
    };
    on('pointerdown', (e) => this.pointerDown(e));
    on('pointermove', (e) => this.pointerMove(e));
    on('pointerup', (e) => this.pointerUp(e));
    on('pointercancel', (e) => this.pointerUp(e, true));
    on('wheel', (e) => this.wheel(e), { passive: false });
    // Mouse double-clicks, and double-taps slower than the tap detector
    // allows (the browser still reports those as dblclick).
    on('dblclick', (e) => {
      if (performance.now() - this.lastQuickZoom > 600) {
        this.quickZoom(this.point(e));
      }
    });
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => this.resized());
      observer.observe(stage);
      this.cleanup.push(() => observer.disconnect());
    }
  }

  private point(event: MouseEvent): Point {
    const rect = this.stageRef.nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private pointerDown(event: PointerEvent): void {
    this.lastPointerType = event.pointerType;
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.stageRef.nativeElement.setPointerCapture?.(event.pointerId);
    this.pointers.set(event.pointerId, this.point(event));
    this.startGesture();
  }

  private startGesture(): void {
    const points = [...this.pointers.values()];
    const from = { ...this.view };
    // The finger left after a pinch is never a tap or a swipe.
    const afterPinch = this.gesture?.kind === 'pinch';
    if (points.length >= 2) {
      this.gesture = { kind: 'pinch', distance: distance(points[0], points[1]), centre: midpoint(points[0], points[1]), from };
    } else if (points.length === 1) {
      this.gesture = { kind: 'pan', start: points[0], from, moved: afterPinch, afterPinch };
    } else {
      this.gesture = undefined;
    }
    this.canvasRef.nativeElement.classList.remove('zv__canvas--ease');
  }

  private pointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) {
      return;
    }
    this.pointers.set(event.pointerId, this.point(event));
    const g = this.gesture;
    const points = [...this.pointers.values()];
    if (g?.kind === 'pinch' && points.length >= 2) {
      const centre = midpoint(points[0], points[1]);
      const factor = g.distance > 0 ? distance(points[0], points[1]) / g.distance : 1;
      // Keep the art point that was under the fingers' centre under it.
      const ax = (g.centre.x - g.from.x) / g.from.s;
      const ay = (g.centre.y - g.from.y) / g.from.s;
      const s = g.from.s * factor;
      this.setView({ s, x: centre.x - ax * s, y: centre.y - ay * s });
    } else if (g?.kind === 'pan') {
      const p = points[0];
      const dx = p.x - g.start.x;
      const dy = p.y - g.start.y;
      if (!g.moved && Math.hypot(dx, dy) > 4) {
        g.moved = true;
      }
      this.setView({ s: g.from.s, x: g.from.x + dx, y: g.from.y + dy });
    }
  }

  private pointerUp(event: PointerEvent, cancelled = false): void {
    if (!this.pointers.has(event.pointerId)) {
      return;
    }
    const g = this.gesture;
    const end = this.point(event);
    this.pointers.delete(event.pointerId);
    if (!cancelled && g?.kind === 'pan' && this.pointers.size === 0) {
      const dx = end.x - g.start.x;
      const dy = end.y - g.start.y;
      if (!g.moved) {
        this.tapped(event, end);
      } else if (!g.afterPinch && !this.isZoomed() && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
        this.zone.run(() => this.go(dx < 0 ? 1 : -1));
      }
    }
    // A finger still down carries on as a drag from where things are now.
    this.startGesture();
  }

  /** Touch and pen have no dblclick to rely on: spot the double-tap here. */
  private tapped(event: PointerEvent, at: Point): void {
    if (event.pointerType === 'mouse') {
      return;
    }
    const now = event.timeStamp || performance.now();
    if (now - this.lastTap.t < DOUBLE_TAP_MS && Math.hypot(at.x - this.lastTap.x, at.y - this.lastTap.y) < DOUBLE_TAP_PX) {
      this.lastTap = { t: 0, x: 0, y: 0 };
      this.quickZoom(at);
    } else {
      this.lastTap = { t: now, ...at };
    }
  }

  private wheel(event: WheelEvent): void {
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.stageSize().h : 1;
    // Pinch on a trackpad arrives as ctrl+wheel with small deltas.
    const factor = Math.exp(-event.deltaY * unit * (event.ctrlKey ? 0.01 : 0.0022));
    const stage = this.stageSize();
    const at = this.point(event);
    this.canvasRef.nativeElement.classList.remove('zv__canvas--ease');
    this.apply(zoomAround(this.view, factor, at.x, at.y, stage, this.artSize(), this.fit.s), false);
  }

  private resized(): void {
    const wasWhole = !this.isZoomed();
    const relative = this.view.s / this.fit.s;
    this.fit = fitView(this.stageSize(), this.artSize());
    if (wasWhole) {
      this.apply(this.fit, false);
    } else {
      this.setView({ ...this.view, s: this.fit.s * relative });
    }
  }

  /** Tab and Shift+Tab cycle through the viewer's buttons only. */
  private trapFocus(event: KeyboardEvent): void {
    const buttons = Array.from(this.dialogRef.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (buttons.length === 0) {
      return;
    }
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const dialog = this.dialogRef.nativeElement;
    const active = this.document.activeElement;
    const onButton = active instanceof HTMLElement && active !== dialog && dialog.contains(active);
    if (!onButton) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
