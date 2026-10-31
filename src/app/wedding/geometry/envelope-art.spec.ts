import { HEART_FLOURISH_BOX, heartFlourish } from './envelope-art';

/** Every coordinate pair of an absolute M/C path. */
function points(d: string): { x: number; y: number }[] {
  const n = d.replace(/[MC]/g, ' ').trim().split(/[\s,]+/).map(Number);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) {
    out.push({ x: n[i], y: n[i + 1] });
  }
  return out;
}

describe('heart flourish (tên ♡ tên on the envelope)', () => {
  const d = heartFlourish();
  const pts = points(d);

  it('is one open stroke, drawn inside its box', () => {
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d).not.toMatch(/Z/i);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(HEART_FLOURISH_BOX.w);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(HEART_FLOURISH_BOX.h);
    }
  });

  it('runs from the left edge to the right edge, heart in the middle', () => {
    const first = pts[0];
    const last = pts[pts.length - 1];
    expect(first.x).toBeLessThan(4);
    expect(last.x).toBeGreaterThan(HEART_FLOURISH_BOX.w - 4);
    // The point of the heart sits on the centre line, below the lobes.
    const point = pts.reduce((low, p) => (p.y > low.y ? p : low));
    expect(point.x).toBeCloseTo(HEART_FLOURISH_BOX.w / 2, 0);
    const top = Math.min(...pts.map((p) => p.y));
    expect(point.y - top).toBeGreaterThan(HEART_FLOURISH_BOX.h * 0.6);
  });
});
