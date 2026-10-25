import { Component, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { PaperPieceKind } from '../data/ui-strings';
import { foldBounds } from '../folded/fold-geometry';
import { CARD_H, CARD_W, ENV_H, ENV_W, SLEEVE_H, SLEEVE_W, envelopeGeometry } from '../geometry/shapes';
import { PocketInsert, pocketInsert } from '../pocket/pocket.component';
import { pieceKind } from '../suite/piece-layout';
import { DIRECTIONS_CARD_H, DIRECTIONS_CARD_W } from './directions-card.component';

export interface PaperPiece {
  kind: PaperPieceKind;
  /** On-screen box of the piece in its own design pixels. */
  w: number;
  h: number;
  /** Where that box starts in the piece's coordinates (spreads reach left of 0). */
  ox: number;
  oy: number;
}

const piece = (kind: PaperPieceKind, w: number, h: number, ox = 0, oy = 0): PaperPiece => ({ kind, w, h, ox, oy });

/** Everything that gets printed for a design, in the order it is laid out. */
export function paperPieces(design: InvitationDesign): PaperPiece[] {
  const pieces: PaperPiece[] = [piece('envelopeFront', ENV_W, ENV_H), piece('envelopeBack', ENV_W, ENV_H)];
  if (design.envelope.liner !== 'none') {
    const flap = envelopeGeometry(design.envelope.flap).flapDepth;
    pieces.push(piece('envelopeOpen', ENV_W, ENV_H + flap, 0, -flap));
  }
  switch (pieceKind(design)) {
    case 'pocket':
      pieces.push(
        design.pocket?.variant === 'sleeve' ? piece('pocket', SLEEVE_W, SLEEVE_H) : piece('pocket', CARD_W, CARD_H),
        piece('insert', CARD_W, CARD_H),
      );
      break;
    case 'folded': {
      const spread = foldBounds(design.fold!, 'flat');
      pieces.push(piece('foldClosed', CARD_W, CARD_H), piece('foldFlat', spread.w, spread.h, spread.ox, spread.oy));
      break;
    }
    case 'popup':
      // Shut, only the bottom half (y 280..560) remains, with the cover on it.
      pieces.push(piece('popupClosed', CARD_W, CARD_H / 2, 0, CARD_H / 2), piece('popupOpen', CARD_W, CARD_H));
      break;
    case 'passport':
      pieces.push(piece('passportClosed', 300, 424), piece('passportOpen', 600, 616, -300, 0));
      break;
    default:
      pieces.push(piece('card', CARD_W, CARD_H));
  }
  pieces.push(piece('directions', DIRECTIONS_CARD_W, DIRECTIONS_CARD_H));
  return pieces;
}

/**
 * Thiệp giấy — the printed suite laid out flat, piece by piece, like a
 * product photo: envelope front and back (and its liner), the invitation
 * in every part it has, and the directions card. Static, no motion.
 */
@Component({
  selector: 'app-paper-suite',
  templateUrl: './paper-suite.component.html',
  styleUrls: ['./paper-suite.component.css'],
  standalone: false,
})
export class PaperSuiteComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input({ required: true }) labels!: Record<PaperPieceKind, string>;

  get pieces(): PaperPiece[] {
    if (this.cache?.design !== this.design) {
      this.cache = { design: this.design, pieces: paperPieces(this.design) };
    }
    return this.cache.pieces;
  }

  get insert(): PocketInsert {
    return pocketInsert(this.design);
  }

  private cache?: { design: InvitationDesign; pieces: PaperPiece[] };
}
