import { QUICK_ZOOM, ZOOM_STEP, clampScale, clampView, fitView, maxScale, stageCentre, zoomAround, zoomInsets } from './zoom-view';

describe('zoom view maths', () => {
  const desktop = { w: 1300, h: 860 };
  const phone = { w: 390, h: 844 };
  const card = { w: 400, h: 560 };

  it('fits the whole piece in the free area between the bars, centred', () => {
    const fit = fitView(desktop, card);
    const ins = zoomInsets(desktop);
    expect(fit.s).toBeCloseTo((desktop.h - ins.top - ins.bottom) / card.h);
    expect(fit.y).toBeCloseTo(ins.top);
    expect(fit.x + (card.w * fit.s) / 2).toBeCloseTo(ins.left + (desktop.w - ins.left - ins.right) / 2);
    // On a phone the width is what limits.
    const narrow = fitView(phone, card);
    expect(narrow.s).toBeCloseTo((phone.w - 20) / card.w);
    expect(narrow.x).toBeCloseTo(10);
  });

  it('never zooms out past the fit, nor in past 6× (or 3× the fit)', () => {
    expect(maxScale(1)).toBe(6);
    expect(maxScale(2.5)).toBe(7.5);
    expect(clampScale(0.2, 1)).toBe(1);
    expect(clampScale(40, 1)).toBe(6);
  });

  it('keeps the point under the fingers in place while zooming', () => {
    const fit = fitView(phone, card);
    const at = { x: 180, y: 420 };
    const before = { x: (at.x - fit.x) / fit.s, y: (at.y - fit.y) / fit.s };
    const v = zoomAround(fit, ZOOM_STEP * ZOOM_STEP, at.x, at.y, phone, card, fit.s);
    expect(v.s).toBeCloseTo(fit.s * ZOOM_STEP * ZOOM_STEP);
    expect((at.x - v.x) / v.s).toBeCloseTo(before.x);
    expect((at.y - v.y) / v.s).toBeCloseTo(before.y);
  });

  it('centres a piece that fits and stops a larger one at the edges of the free area', () => {
    const fit = fitView(desktop, card);
    // At the fit, dragging does nothing.
    expect(clampView({ ...fit, x: fit.x + 300, y: fit.y - 200 }, desktop, card, fit.s)).toEqual(fit);
    // Zoomed in, a drag far to the right stops with the left edge at the free area's left edge.
    const s = fit.s * QUICK_ZOOM * 1.6;
    const ins = zoomInsets(desktop);
    const right = clampView({ s, x: 5000, y: -5000 }, desktop, card, fit.s);
    expect(right.x).toBe(ins.left);
    expect(right.y).toBeCloseTo(desktop.h - ins.bottom - card.h * s);
  });

  it('anchors button zooms at the centre of the free area', () => {
    const c = stageCentre(desktop);
    const ins = zoomInsets(desktop);
    expect(c.y).toBeCloseTo(ins.top + (desktop.h - ins.top - ins.bottom) / 2);
  });
});
