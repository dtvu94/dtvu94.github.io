import { FoldSpec, PanelKind } from '../data/wedding.types';

/** How far a folded card is opened. */
export type FoldPose = 'closed' | 'ajar' | 'open';

/** What the outside face of a leaf shows. */
export type LeafBack = PanelKind | 'coverLeft' | 'coverRight' | 'blank';

/**
 * One hinged leaf. Leaves hang off the fixed centre panel's left or right
 * edge; rotateY about that edge folds them over the front (left leaves,
 * positive angles; right gate door, negative) or behind it (accordion's
 * right leaf, positive).
 */
export interface Leaf {
  side: 'left' | 'right';
  width: number;
  front: PanelKind;
  back: LeafBack;
  angles: Record<FoldPose, number>;
  /** Nudge (px, leaf-local) so a closed leaf never z-fights the centre. */
  nudge: number;
}

export const PANEL_W = 400;
export const PANEL_H = 560;
/** CSS perspective of the folded card and its origin (40 % down). */
export const FOLD_PERSPECTIVE = 2200;
export const FOLD_ORIGIN = { x: PANEL_W / 2, y: PANEL_H * 0.4 };

export function leavesFor(fold: FoldSpec): Leaf[] {
  const [first, second, third] = fold.inside;
  switch (fold.variant) {
    case 'bifold':
      return [{ side: 'left', width: 400, front: first, back: fold.cover, angles: { closed: 180, ajar: 150, open: 4 }, nudge: -1 }];
    case 'gatefold':
      return [
        { side: 'left', width: 200, front: first, back: 'coverLeft', angles: { closed: 180, ajar: 156, open: 3 }, nudge: -1 },
        { side: 'right', width: 200, front: third ?? first, back: 'coverRight', angles: { closed: -180, ajar: -156, open: -3 }, nudge: -1 },
      ];
    case 'accordion':
      return [
        { side: 'left', width: 400, front: first, back: fold.cover, angles: { closed: 180, ajar: 152, open: 20 }, nudge: -1 },
        { side: 'right', width: 400, front: third ?? second, back: 'monogram', angles: { closed: 180, ajar: 172, open: 20 }, nudge: 2 },
      ];
  }
}

export interface Bounds {
  ox: number;
  oy: number;
  w: number;
  h: number;
}

/**
 * Where a folded card appears on screen (card pixels, centre panel at
 * 0..400 × 0..560), from its leaves' far edges after rotateY and the
 * card's perspective — so a scene can frame it in any pose.
 */
export function foldBounds(fold: FoldSpec, pose: FoldPose): Bounds {
  let minX = 0;
  let maxX = PANEL_W;
  let minY = 0;
  let maxY = PANEL_H;
  for (const leaf of leavesFor(fold)) {
    const angle = (leaf.angles[pose] * Math.PI) / 180;
    // CSS rotateY: x' = x·cos θ, z' = −x·sin θ for a point at local x.
    const local = leaf.side === 'left' ? -leaf.width : leaf.width;
    const hinge = leaf.side === 'left' ? 0 : PANEL_W;
    const x = hinge + local * Math.cos(angle);
    const z = -local * Math.sin(angle);
    const f = FOLD_PERSPECTIVE / (FOLD_PERSPECTIVE - z);
    const px = FOLD_ORIGIN.x + (x - FOLD_ORIGIN.x) * f;
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, FOLD_ORIGIN.y - FOLD_ORIGIN.y * f);
    maxY = Math.max(maxY, FOLD_ORIGIN.y + (PANEL_H - FOLD_ORIGIN.y) * f);
  }
  const ox = Math.floor(minX);
  const oy = Math.floor(minY);
  return { ox, oy, w: Math.ceil(maxX) - ox, h: Math.ceil(maxY) - oy };
}
