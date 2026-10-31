/**
 * Pan-and-zoom maths for the zoom viewer, kept free of the DOM so it can be
 * unit-tested. A view places a piece of art (w × h design pixels) on the
 * stage: the art's top-left corner sits at (x, y) and it is drawn at scale s.
 */

export interface ZoomView {
  s: number;
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

/** Room kept free around a fitted piece: title bar on top, controls below. */
export interface ZoomInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Multiplier of one zoom step (buttons, keys). */
export const ZOOM_STEP = 1.5;

/** Double-tap / double-click zooms to this multiple of the fitted size. */
export const QUICK_ZOOM = 2.5;

export function zoomInsets(stage: Size): ZoomInsets {
  const phone = stage.w < 640;
  return { top: 60, right: phone ? 10 : 24, bottom: phone ? 122 : 108, left: phone ? 10 : 24 };
}

/** Free area of the stage, between the bars. */
function freeArea(stage: Size): ZoomInsets & Size {
  const ins = zoomInsets(stage);
  return { ...ins, w: Math.max(40, stage.w - ins.left - ins.right), h: Math.max(40, stage.h - ins.top - ins.bottom) };
}

/** The whole piece, as large as it fits, centred in the free area. */
export function fitView(stage: Size, art: Size): ZoomView {
  const free = freeArea(stage);
  const s = Math.min(free.w / art.w, free.h / art.h);
  return { s, x: free.left + (free.w - art.w * s) / 2, y: free.top + (free.h - art.h * s) / 2 };
}

/** Closest zoom: 6× the design size (9 px print → 54 px), or 3× the fit on very large screens. */
export function maxScale(fit: number): number {
  return Math.max(6, fit * 3);
}

export function clampScale(s: number, fit: number): number {
  return Math.min(maxScale(fit), Math.max(fit, s));
}

/**
 * Keeps the piece in reach: along an axis where it fits the free area it is
 * centred there; where it is larger, it may move until its edge meets the
 * edge of the free area, never further.
 */
export function clampView(view: ZoomView, stage: Size, art: Size, fit: number): ZoomView {
  const s = clampScale(view.s, fit);
  const free = freeArea(stage);
  const axis = (pos: number, size: number, start: number, room: number): number => {
    if (size <= room + 0.5) {
      return start + (room - size) / 2;
    }
    return Math.min(start, Math.max(start + room - size, pos));
  };
  return {
    s,
    x: axis(view.x, art.w * s, free.left, free.w),
    y: axis(view.y, art.h * s, free.top, free.h),
  };
}

/** Scales by `factor` around the stage point (px, py), which stays put. */
export function zoomAround(view: ZoomView, factor: number, px: number, py: number, stage: Size, art: Size, fit: number): ZoomView {
  const s = clampScale(view.s * factor, fit);
  const k = s / view.s;
  return clampView({ s, x: px - (px - view.x) * k, y: py - (py - view.y) * k }, stage, art, fit);
}

/** Centre of the free area, where button and key zooms are anchored. */
export function stageCentre(stage: Size): { x: number; y: number } {
  const free = freeArea(stage);
  return { x: free.left + free.w / 2, y: free.top + free.h / 2 };
}
