import { ENV_H, ENV_W } from './shapes';
import { envelopeRoses, roseSpray } from './rose-spray';

/** Every point of the move/line/curve commands of a path (arcs skipped). */
function points(d: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const seg of d.split(/(?=[MLCQAZ])/)) {
    if (!/^[MLCQ]/.test(seg)) {
      continue;
    }
    const n = seg.slice(1).trim().split(/[\s,]+/).map(Number);
    for (let i = 0; i + 1 < n.length; i += 2) {
      out.push({ x: n[i], y: n[i + 1] });
    }
  }
  return out;
}

describe('baby-rose sprays', () => {
  const layers = (spray: ReturnType<typeof roseSpray>) => Object.values(spray).flatMap(points);

  it('keeps each spray on its own side, clear of the crest and names in the middle', () => {
    const left = layers(roseSpray(ENV_W, false));
    const right = layers(roseSpray(ENV_W, true));
    expect(left.length).toBeGreaterThan(100);
    expect(Math.max(...left.map((p) => p.x))).toBeLessThan(ENV_W * 0.3);
    expect(Math.min(...right.map((p) => p.x))).toBeGreaterThan(ENV_W * 0.7);
  });

  it('stays on the envelope and above the guest line', () => {
    const all = layers(envelopeRoses(ENV_W));
    expect(Math.min(...all.map((p) => p.x))).toBeGreaterThan(0);
    expect(Math.max(...all.map((p) => p.x))).toBeLessThan(ENV_W);
    expect(Math.min(...all.map((p) => p.y))).toBeGreaterThan(10);
    // The guest line ("Kính mời: ……") sits at 78% of the height.
    expect(Math.max(...all.map((p) => p.y))).toBeLessThan(ENV_H * 0.76);
  });

  it("has roses, buds, leaves and baby's breath", () => {
    const spray = roseSpray(ENV_W, false);
    for (const layer of ['petals', 'petalsInner', 'lines', 'buds', 'leaves', 'breath', 'stems'] as const) {
      expect(spray[layer]).toMatch(/^M/);
    }
  });
});
