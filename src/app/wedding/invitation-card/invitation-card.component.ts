import { Component, HostBinding, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign, OrnamentKey } from '../data/wedding.types';
import { invitationThemeStyle } from '../theme';

type OrnamentSlot = 'crest' | 'corners' | 'divider' | 'backdrop' | 'watermark';

/** Where each ornament kind belongs on the card. */
const ORNAMENT_SLOTS: Record<OrnamentKey, OrnamentSlot | 'none'> = {
  none: 'none',
  floralCorner: 'corners',
  lotus: 'crest',
  rings: 'crest',
  artDecoFan: 'crest',
  leafyWreath: 'crest',
  botanicalSprig: 'corners',
  geoFrame: 'corners',
  hairlineFlourish: 'divider',
  watercolorBlob: 'backdrop',
  monogramRing: 'crest',
  // Rendered by the card itself as a giant translucent "&" (not an SVG).
  grandAmpersand: 'watermark',
};

/** Crest ornaments that frame the couple's monogram. */
const MONOGRAM_CRESTS: ReadonlySet<OrnamentKey> = new Set<OrnamentKey>(['monogramRing', 'leafyWreath']);

/**
 * Renders any of the 24 designs from pure data: the palette/fonts arrive as
 * `--inv-*` CSS variables (host style binding), the structure is one of six
 * layout variants, and decorations are slotted ornaments. The stylesheet is
 * structural only — keep colors out of it (anyComponentStyle budget).
 */
@Component({
  selector: 'app-invitation-card',
  templateUrl: './invitation-card.component.html',
  styleUrls: ['./invitation-card.component.css'],
  standalone: false,
})
export class InvitationCardComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;

  @HostBinding('attr.style')
  get themeStyle(): string {
    return invitationThemeStyle(this.design);
  }

  get crestOrnament(): OrnamentKey | null {
    return this.ornamentFor('crest');
  }

  get cornerOrnament(): OrnamentKey | null {
    return this.ornamentFor('corners');
  }

  get dividerOrnament(): OrnamentKey | null {
    return this.ornamentFor('divider');
  }

  get backdropOrnament(): OrnamentKey | null {
    return this.ornamentFor('backdrop');
  }

  get hasWatermark(): boolean {
    return this.ornamentFor('watermark') !== null;
  }

  get crestHoldsMonogram(): boolean {
    const crest = this.crestOrnament;
    return crest !== null && MONOGRAM_CRESTS.has(crest);
  }

  private ornamentFor(slot: OrnamentSlot): OrnamentKey | null {
    for (const candidate of [this.design.ornament, this.design.ornamentSecondary]) {
      if (candidate && ORNAMENT_SLOTS[candidate] === slot) {
        return candidate;
      }
    }
    return null;
  }
}
