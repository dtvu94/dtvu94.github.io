import { Component, HostBinding, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { PocketInsert, pocketInsert } from '../pocket/pocket.component';
import { PaperPiece } from './paper-suite.component';

/**
 * The art of one printed piece (envelope face, card, insert, spread,
 * directions card…) at its design size. The flat lay shows it scaled down;
 * the zoom viewer shows the same piece scaled up.
 */
@Component({
  selector: 'app-paper-art',
  templateUrl: './paper-art.component.html',
  styleUrls: ['./paper-art.component.css'],
  standalone: false,
})
export class PaperArtComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input({ required: true }) piece!: PaperPiece;

  @HostBinding('style.width.px')
  get width(): number {
    return this.piece.w;
  }

  @HostBinding('style.height.px')
  get height(): number {
    return this.piece.h;
  }

  get insert(): PocketInsert {
    return pocketInsert(this.design);
  }
}
