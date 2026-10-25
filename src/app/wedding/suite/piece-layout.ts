import { InvitationDesign } from '../data/wedding.types';
import { Bounds, FoldPose, foldBounds } from '../folded/fold-geometry';
import { CARD_H, CARD_W, SLEEVE_H, SLEEVE_W } from '../geometry/shapes';
import type { PassportPose } from '../passport/passport.component';

/**
 * Where the card (or sleeve, folded card, pop-up, passport) rests in front
 * of its envelope in a gallery preview. Each piece reports the box it
 * occupies on screen in its own pixels for its preview pose; the scene
 * places that box by its centre, so a landscape piece, a lifted cover and a
 * passport with its ticket all frame correctly.
 */

export type PieceKind = 'card' | 'pocket' | 'folded' | 'popup' | 'passport';

export interface Placement {
  cx: number;
  cy: number;
  r: number;
  s: number;
}

export interface PieceLayout {
  box: Bounds;
  place: Placement;
}

export interface PiecePoses {
  fold: FoldPose;
  popupOpen: boolean;
  passport: PassportPose;
}

export function pieceKind(design: InvitationDesign): PieceKind {
  if (design.form === 'pocket' && design.pocket) {
    return 'pocket';
  }
  if (design.form === 'folded' && design.fold) {
    return 'folded';
  }
  if (design.form === 'popup' && design.popup) {
    return 'popup';
  }
  if (design.form === 'passport' && design.passport) {
    return 'passport';
  }
  return 'card';
}

/** Preview poses: a hint of the inside — cover ajar, pop-up standing, ticket peeking out. */
export const PREVIEW_POSES: PiecePoses = { fold: 'ajar', popupOpen: true, passport: 'peek' };

export const CARD_BOX: Bounds = { ox: 0, oy: 0, w: CARD_W, h: CARD_H };
const SLEEVE_BOX: Bounds = { ox: 0, oy: 0, w: SLEEVE_W, h: SLEEVE_H };
/** Passport booklet shut (300 × 424) and with the ticket peeking out. */
const PASSPORT_PEEK_BOX: Bounds = { ox: 0, oy: 0, w: 490, h: 424 };

export function pieceBox(design: InvitationDesign, kind: PieceKind): Bounds {
  switch (kind) {
    case 'pocket':
      return design.pocket?.variant === 'sleeve' ? SLEEVE_BOX : CARD_BOX;
    case 'folded':
      return design.fold ? foldBounds(design.fold, PREVIEW_POSES.fold) : CARD_BOX;
    case 'passport':
      return PASSPORT_PEEK_BOX;
    default:
      return CARD_BOX;
  }
}

/** The card's resting spot in front of its envelope (centre of 400 × 560 at 196, 232). */
const OUT: Placement = { cx: 396, cy: 512, r: 3, s: 1 };

function placement(kind: PieceKind, box: Bounds): Placement {
  switch (kind) {
    case 'pocket':
      return box === SLEEVE_BOX ? { cx: 186 + SLEEVE_W / 2, cy: 214 + SLEEVE_H / 2, r: 3, s: 1 } : OUT;
    case 'folded':
      return { cx: 404, cy: 500, r: 2, s: Math.min(1, 580 / box.h) };
    case 'passport':
      return { cx: 392, cy: 474, r: 3, s: 0.95 };
    default:
      return OUT;
  }
}

export function pieceLayout(design: InvitationDesign): PieceLayout {
  const kind = pieceKind(design);
  const box = pieceBox(design, kind);
  return { box, place: placement(kind, box) };
}

const n = (value: number) => Math.round(value * 100) / 100;

/** The piece's transform (with transform-origin 0 0): its box centre moved to the placement centre, rotated and scaled there. */
export function pieceTransform({ box, place }: PieceLayout): string {
  const bx = box.ox + box.w / 2;
  const by = box.oy + box.h / 2;
  return `translate(${n(place.cx)}px, ${n(place.cy)}px) rotate(${n(place.r)}deg) scale(${n(place.s)}) translate(${n(-bx)}px, ${n(-by)}px)`;
}
