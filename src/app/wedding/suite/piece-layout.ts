import { InvitationDesign } from '../data/wedding.types';
import { Bounds, FoldPose, foldBounds } from '../folded/fold-geometry';
import { CARD_H, CARD_W, SLEEVE_H, SLEEVE_W } from '../geometry/shapes';
import type { PassportPose } from '../passport/passport.component';

/**
 * Where the card (or sleeve, folded card, pop-up, passport) sits in a suite
 * scene. Each piece reports the box it occupies on screen in its own pixels
 * for its current pose; the scene places that box by its centre, so a
 * landscape pop-up, an 800 px spread and a passport all frame correctly.
 */

export type SuiteState = 'sealed' | 'opened' | 'out' | 'unfolded';
export type PieceKind = 'card' | 'pocket' | 'folded' | 'popup' | 'passport';

/** Envelope as laid out in the scene while the piece is inside it. */
const ENV_LEFT = 85;
const ENV_WIDTH = 470;
/** Top of a piece inside the envelope, and the foot it rises to. */
const INSIDE_TOP = 414;
const RISEN_FOOT = 565;

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

export function hasInside(kind: PieceKind): boolean {
  return kind !== 'card';
}

/** Inside the envelope everything is shut; the gallery shows a hint of the inside. */
export function piecePoses(state: SuiteState, interactive: boolean): PiecePoses {
  const inEnvelope = state === 'sealed' || state === 'opened';
  const preview = state === 'out' && !interactive;
  return {
    fold: state === 'unfolded' ? 'open' : preview ? 'ajar' : 'closed',
    popupOpen: state === 'unfolded' || preview,
    passport: state === 'unfolded' ? 'open' : inEnvelope ? 'closed' : 'peek',
  };
}

const CARD_BOX: Bounds = { ox: 0, oy: 0, w: CARD_W, h: CARD_H };
const SLEEVE_BOX: Bounds = { ox: 0, oy: 0, w: SLEEVE_W, h: SLEEVE_H };

export function pieceBox(design: InvitationDesign, kind: PieceKind, poses: PiecePoses): Bounds {
  switch (kind) {
    case 'pocket':
      return design.pocket?.variant === 'sleeve' ? SLEEVE_BOX : CARD_BOX;
    case 'folded':
      return design.fold ? foldBounds(design.fold, poses.fold) : CARD_BOX;
    case 'popup':
      // Shut, only the bottom half (y 280..560) shows, with the cover on it.
      return poses.popupOpen ? CARD_BOX : { ox: 0, oy: CARD_H / 2, w: CARD_W, h: CARD_H / 2 };
    case 'passport':
      switch (poses.passport) {
        case 'closed':
          return { ox: 0, oy: 0, w: 300, h: 424 };
        case 'peek':
          return { ox: 0, oy: 0, w: 490, h: 424 };
        case 'open':
          return { ox: -300, oy: 0, w: 600, h: 616 };
      }
      break;
  }
  return CARD_BOX;
}

/** The card's resting spot in front of its envelope (centre of 400 × 560 at 196, 232). */
const OUT: Placement = { cx: 396, cy: 512, r: 3, s: 1 };

function outPlacement(kind: PieceKind, box: Bounds, poses: PiecePoses): Placement {
  switch (kind) {
    case 'pocket':
      return box === SLEEVE_BOX ? { cx: 186 + SLEEVE_W / 2, cy: 214 + SLEEVE_H / 2, r: 3, s: 1 } : OUT;
    case 'folded':
      return poses.fold === 'ajar' ? { cx: 404, cy: 500, r: 2, s: Math.min(1, 580 / box.h) } : OUT;
    case 'popup':
      return poses.popupOpen ? OUT : { cx: 404, cy: 486, r: 3, s: 1.06 };
    case 'passport':
      return { cx: 392, cy: 474, r: 3, s: 0.95 };
    case 'card':
      return OUT;
  }
}

function unfoldedPlacement(kind: PieceKind, box: Bounds): Placement {
  switch (kind) {
    case 'pocket':
      // Insert drawn out of the pocket to the right (see PocketComponent).
      return { cx: 14 + box.w / 2, cy: 206 + box.h / 2, r: 0, s: 1 };
    case 'folded': {
      const s = Math.min(1, 620 / box.w, 600 / box.h);
      return { cx: 320, cy: 380, r: 0, s };
    }
    case 'popup':
      return { cx: 380, cy: 430, r: 0, s: 1 };
    case 'passport':
      return { cx: 320, cy: 392, r: 0, s: 1 };
    case 'card':
      return OUT;
  }
}

export function pieceLayout(design: InvitationDesign, state: SuiteState, interactive: boolean): PieceLayout {
  const kind = pieceKind(design);
  const poses = piecePoses(state, interactive);
  const box = pieceBox(design, kind, poses);
  let place: Placement;
  switch (state) {
    case 'sealed':
      place = { cx: ENV_LEFT + ENV_WIDTH / 2, cy: INSIDE_TOP + box.h / 2, r: 0, s: 1 };
      break;
    case 'opened':
      place = { cx: ENV_LEFT + ENV_WIDTH / 2, cy: RISEN_FOOT - box.h / 2, r: 0, s: 1 };
      break;
    case 'out':
      place = outPlacement(kind, box, poses);
      break;
    case 'unfolded':
      place = unfoldedPlacement(kind, box);
      break;
  }
  return { box, place };
}

const n = (value: number) => Math.round(value * 100) / 100;

/**
 * The piece's transform (with transform-origin 0 0): its box centre is
 * moved to the placement centre, rotated and scaled there. Every state
 * yields the same function list, so CSS interpolates between them.
 */
export function pieceTransform({ box, place }: PieceLayout): string {
  const bx = box.ox + box.w / 2;
  const by = box.oy + box.h / 2;
  return `translate(${n(place.cx)}px, ${n(place.cy)}px) rotate(${n(place.r)}deg) scale(${n(place.s)}) translate(${n(-bx)}px, ${n(-by)}px)`;
}
