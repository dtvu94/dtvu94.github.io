import {
  ARCH_WINDOW,
  CARD_H,
  CARD_W,
  LACE_WINDOW_INSET,
  LASER_SHAPES,
  LATTICE_WINDOW_INSET,
  LaserShapeKey,
  MotifBound,
  Point,
} from './laser-cut';

/** Shortest distance between segments p1-p2 and q1-q2. */
function segmentDistance(p1: Point, p2: Point, q1: Point, q2: Point): number {
  const pointToSegment = (p: Point, a: Point, b: Point): number => {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lengthSq = abx * abx + aby * aby;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSq));
    return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
  };
  return Math.min(
    pointToSegment(p1, q1, q2),
    pointToSegment(p2, q1, q2),
    pointToSegment(q1, p1, p2),
    pointToSegment(q2, p1, p2),
  );
}

/** Axis-aligned bounding box of a capsule. */
function extremes(m: MotifBound): { minX: number; maxX: number; minY: number; maxY: number } {
  return {
    minX: Math.min(m.a.x, m.b.x) - m.radius,
    maxX: Math.max(m.a.x, m.b.x) + m.radius,
    minY: Math.min(m.a.y, m.b.y) - m.radius,
    maxY: Math.max(m.a.y, m.b.y) + m.radius,
  };
}

/** True when the motif lies entirely in the paper band outside the rectangle inset `d`. */
function outsideInsetRect(m: MotifBound, d: number): boolean {
  const e = extremes(m);
  return e.maxX <= d || e.minX >= CARD_W - d || e.maxY <= d || e.minY >= CARD_H - d;
}

function outsideArchWindow(m: MotifBound): boolean {
  const { left, right, centerX, spring, radius, base } = ARCH_WINDOW;
  const e = extremes(m);
  const clearOfRect = e.maxX <= left || e.minX >= right || e.minY >= base || e.maxY <= spring;
  const center = { x: centerX, y: spring };
  const clearOfDome = segmentDistance(m.a, m.b, center, center) - m.radius >= radius || e.minY >= spring;
  return clearOfRect && clearOfDome;
}

const KEYS: LaserShapeKey[] = ['lace', 'arch', 'lattice', 'doily'];

describe('LASER_SHAPES', () => {
  it.each(KEYS)('%s: emits a well-formed path with finite coordinates', (key) => {
    const { d, viewBox } = LASER_SHAPES[key];
    expect(viewBox).toMatch(/^0 0 \d+ \d+$/);
    expect(d).toMatch(/^M/);
    expect(d).toMatch(/^[MmLlHhVvQqAaZz0-9 .\-e]+$/);
    expect(d).not.toMatch(/NaN|Infinity/);
  });

  it.each(KEYS)('%s: has decorative cut-outs that never overlap (evenodd would cancel them)', (key) => {
    const { motifs } = LASER_SHAPES[key];
    expect(motifs.length).toBeGreaterThan(20);
    for (let i = 0; i < motifs.length; i++) {
      for (let j = i + 1; j < motifs.length; j++) {
        const gap = segmentDistance(motifs[i].a, motifs[i].b, motifs[j].a, motifs[j].b);
        expect(gap).toBeGreaterThan(motifs[i].radius + motifs[j].radius);
      }
    }
  });

  it('keeps every motif inside its viewBox', () => {
    for (const key of KEYS) {
      const [, , width, height] = LASER_SHAPES[key].viewBox.split(' ').map(Number);
      for (const motif of LASER_SHAPES[key].motifs) {
        const e = extremes(motif);
        expect(e.minX).toBeGreaterThan(0);
        expect(e.minY).toBeGreaterThan(0);
        expect(e.maxX).toBeLessThan(width);
        expect(e.maxY).toBeLessThan(height);
      }
    }
  });

  it('keeps the lace and lattice motifs in the paper band around the window', () => {
    expect(LASER_SHAPES.lace.motifs.every((m) => outsideInsetRect(m, LACE_WINDOW_INSET))).toBe(true);
    expect(LASER_SHAPES.lattice.motifs.every((m) => outsideInsetRect(m, LATTICE_WINDOW_INSET))).toBe(true);
  });

  it('keeps the arch motifs clear of the arched window', () => {
    expect(LASER_SHAPES.arch.motifs.every(outsideArchWindow)).toBe(true);
  });

  it('leaves the doily centre solid for the cut-through monogram', () => {
    const center = { x: 50, y: 50 };
    for (const motif of LASER_SHAPES.doily.motifs) {
      expect(segmentDistance(motif.a, motif.b, center, center) - motif.radius).toBeGreaterThan(25);
    }
  });
});
