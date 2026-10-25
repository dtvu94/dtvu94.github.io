import { Point, fmt, pt } from './path-kit';

/**
 * Sketch map for the printed directions card (box MAP_W × MAP_H): rạch Bến
 * Nghé runs from the south-west (bottom left) to the north-east (top right),
 * Quận 1 on its north-west bank, Quận 4 on the south-east. Along the canal,
 * west to east: cầu Nguyễn Văn Cừ, Riverside Palace (360D Bến Vân Đồn, on
 * the Quận 4 bank), cầu Ông Lãnh (~600 m on), cầu Calmette (~1.2 km on).
 * Schematic, not to scale — the QR code links to the real map.
 */

export const MAP_W = 228;
export const MAP_H = 284;

type Cubic = [Point, Point, Point, Point];

/** Centre line of the canal. */
const CANAL: Cubic = [
  { x: -12, y: 238 },
  { x: 60, y: 212 },
  { x: 140, y: 124 },
  { x: 240, y: 54 },
];
const CANAL_WIDTH = 26;

function at([p0, p1, p2, p3]: Cubic, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

/** Unit normal pointing to the south-east bank (Quận 4). */
function normal(c: Cubic, t: number): Point {
  const a = at(c, Math.max(0, t - 0.01));
  const b = at(c, Math.min(1, t + 0.01));
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  // Travelling north-east, the right-hand side is south-east.
  return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
}

function offset(c: Cubic, d: number): string {
  // Offset each control point along the local normal — close enough for a sketch.
  const ts = [0, 1 / 3, 2 / 3, 1];
  const pts = c.map((p, i) => {
    const n = normal(c, ts[i]);
    return { x: p.x + n.x * d, y: p.y + n.y * d };
  });
  return `M${pt(pts[0])}C${pt(pts[1])} ${pt(pts[2])} ${pt(pts[3])}`;
}

export interface MapLabel {
  text: string;
  at: Point;
  /** Rotation in degrees (labels along the canal follow it). */
  angle: number;
  kind: 'district' | 'street' | 'bridge' | 'water' | 'venue';
}

export interface VenueMap {
  canal: string;
  canalWidth: number;
  streets: string;
  bridges: string;
  pin: Point;
  labels: MapLabel[];
}

/** Where things sit along the canal (0 = south-west edge, 1 = north-east). */
export const MAP_STOPS = { nguyenVanCu: 0.17, venue: 0.36, ongLanh: 0.6, calmette: 0.84 } as const;

function bridge(t: number): string {
  const c = at(CANAL, t);
  const n = normal(CANAL, t);
  const half = CANAL_WIDTH / 2 + 7;
  return `M${pt({ x: c.x - n.x * half, y: c.y - n.y * half })}L${pt({ x: c.x + n.x * half, y: c.y + n.y * half })}`;
}

function angleAt(t: number): number {
  const a = at(CANAL, t - 0.02);
  const b = at(CANAL, t + 0.02);
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/** Rough width of a label at the card's 8.5 px label size (no text metrics in tests). */
export function labelWidth(text: string): number {
  return text.length * 4.7;
}

/** Keeps a horizontal, centred label inside the map box. */
function inside(text: string, p: Point): Point {
  const half = labelWidth(text) / 2 + 4;
  return { x: Math.min(MAP_W - half, Math.max(half, p.x)), y: Math.min(MAP_H - 8, Math.max(8, p.y)) };
}

let cached: VenueMap | null = null;

export function venueMap(): VenueMap {
  if (cached) {
    return cached;
  }
  const v = at(CANAL, MAP_STOPS.venue);
  const n = normal(CANAL, MAP_STOPS.venue);
  // Pin on the Quận 4 bank, just past Bến Vân Đồn.
  const pin = { x: v.x + n.x * 30, y: v.y + n.y * 30 };
  const bridgeLabel = (t: number, text: string, side: 1 | -1, gap = 30): MapLabel => {
    const c = at(CANAL, t);
    const nn = normal(CANAL, t);
    return { text, at: inside(text, { x: c.x + nn.x * gap * side, y: c.y + nn.y * gap * side }), angle: 0, kind: 'bridge' };
  };
  const water = at(CANAL, 0.5);
  const vvk = at(CANAL, 0.27);
  const nvk = normal(CANAL, 0.27);
  const bvd = at(CANAL, 0.7);
  const nbvd = normal(CANAL, 0.7);
  cached = {
    canal: `M${pt(CANAL[0])}C${pt(CANAL[1])} ${pt(CANAL[2])} ${pt(CANAL[3])}`,
    canalWidth: CANAL_WIDTH,
    // Võ Văn Kiệt on the Quận 1 bank, Bến Vân Đồn on the Quận 4 bank.
    streets: offset(CANAL, -(CANAL_WIDTH / 2 + 9)) + offset(CANAL, CANAL_WIDTH / 2 + 9),
    bridges: [MAP_STOPS.nguyenVanCu, MAP_STOPS.ongLanh, MAP_STOPS.calmette].map(bridge).join(''),
    pin,
    labels: [
      { text: 'QUẬN 1', at: { x: 52, y: 70 }, angle: 0, kind: 'district' },
      { text: 'QUẬN 4', at: { x: 176, y: 214 }, angle: 0, kind: 'district' },
      { text: 'Rạch Bến Nghé', at: water, angle: angleAt(0.5), kind: 'water' },
      {
        text: 'Võ Văn Kiệt',
        at: { x: vvk.x - nvk.x * (CANAL_WIDTH / 2 + 17), y: vvk.y - nvk.y * (CANAL_WIDTH / 2 + 17) },
        angle: angleAt(0.27),
        kind: 'street',
      },
      {
        text: 'Bến Vân Đồn',
        at: { x: bvd.x + nbvd.x * (CANAL_WIDTH / 2 + 18), y: bvd.y + nbvd.y * (CANAL_WIDTH / 2 + 18) },
        angle: angleAt(0.7),
        kind: 'street',
      },
      // South of the canal: its north bank is crowded by Võ Văn Kiệt.
      bridgeLabel(MAP_STOPS.nguyenVanCu, 'Cầu Nguyễn Văn Cừ', 1, 44),
      bridgeLabel(MAP_STOPS.ongLanh, 'Cầu Ông Lãnh', -1, 36),
      bridgeLabel(MAP_STOPS.calmette, 'Cầu Calmette', -1, 34),
      { text: 'Riverside Palace', at: { x: pin.x, y: pin.y + 22 }, angle: 0, kind: 'venue' },
    ],
  };
  return cached;
}

/** Map pin (teardrop) with its tip at `p`. */
export function pinPath(p: Point, r = 9): string {
  const cy = p.y - r * 1.7;
  return (
    `M${pt(p)}C${fmt(p.x - r * 0.4)} ${fmt(p.y - r * 0.6)} ${fmt(p.x - r)} ${fmt(cy + r * 0.55)} ${fmt(p.x - r)} ${fmt(cy)}` +
    `A${fmt(r)} ${fmt(r)} 0 1 1 ${fmt(p.x + r)} ${fmt(cy)}` +
    `C${fmt(p.x + r)} ${fmt(cy + r * 0.55)} ${fmt(p.x + r * 0.4)} ${fmt(p.y - r * 0.6)} ${pt(p)}Z`
  );
}
