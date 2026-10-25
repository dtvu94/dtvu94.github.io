import { Component, HostBinding, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign, PanelKind, PhotoFrame } from '../data/wedding.types';
import { linerBackground, STOCK_TEXTURE } from '../geometry/patterns';
import { CardPart } from '../invitation-card/invitation-card.component';
import { invitationThemeStyle } from '../theme';

const CARD_PARTS: Partial<Record<PanelKind, CardPart>> = { full: 'full', announce: 'announce', invite: 'invite' };

/**
 * One printed panel of a folded card or passport, at any size. Text panels
 * reuse the invitation card (scaled from its 400 × 560 design size); the
 * rest — calendar, photo, venue, monogram — are laid out here for their
 * width, with a compact variant for half-width gate-fold doors.
 */
@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.css'],
  standalone: false,
})
export class PanelComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input({ required: true }) kind!: PanelKind;
  @Input() width = 400;
  @Input() height = 560;
  @Input() photoFrame: PhotoFrame = 'rounded';
  @Input() photoIndex = 0;

  @HostBinding('attr.style')
  get hostStyle(): string {
    return `${invitationThemeStyle(this.design)};width:${this.width}px;height:${this.height}px`;
  }

  @HostBinding('class')
  get hostClass(): string {
    return `pn pn--${this.kind}${this.width < 300 ? ' pn--narrow' : ''}`;
  }

  get cardPart(): CardPart | null {
    return CARD_PARTS[this.kind] ?? null;
  }

  /** Scale of the 400 × 560 card face to this panel. */
  get cardScale(): string {
    return `scale(${this.width / 400}, ${this.height / 560})`;
  }

  get texture(): string | null {
    return STOCK_TEXTURE[this.design.stock ?? 'smooth'] || null;
  }

  get blanks(): number[] {
    return Array.from({ length: this.copy.monthOffset }, (_, i) => i);
  }

  get days(): number[] {
    return Array.from({ length: this.copy.daysInMonth }, (_, i) => i + 1);
  }

  /** Damask ground for the monogram panel, in the design's own colours. */
  get pattern(): string {
    const { surface, accent } = this.design.palette;
    return linerBackground('damask', surface, `${accent}`);
  }
}
