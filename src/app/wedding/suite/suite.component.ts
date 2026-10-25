import { Component, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { PREVIEW_POSES, PieceKind, pieceKind, pieceLayout, pieceTransform } from './piece-layout';

/** Scene size in design pixels — everything is laid out inside it. */
export const SCENE_W = 640;
export const SCENE_H = 820;

/**
 * Gallery preview of a design: its envelope lying open behind (back panel,
 * pocket and flap, liner showing) and the card — or sleeve, folded card,
 * pop-up, passport — resting in front of it. Static: no motion.
 */
@Component({
  selector: 'app-suite',
  templateUrl: './suite.component.html',
  styleUrls: ['./suite.component.css'],
  standalone: false,
})
export class SuiteComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;

  readonly poses = PREVIEW_POSES;

  get kind(): PieceKind {
    return pieceKind(this.design);
  }

  get pieceTransform(): string {
    return pieceTransform(pieceLayout(this.design));
  }
}
