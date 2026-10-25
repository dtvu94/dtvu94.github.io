import { Component, HostBinding, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign, LayoutVariant, OrnamentKey } from '../data/wedding.types';
import { LASER_SHAPES, LaserShape } from '../ornaments/laser-cut';
import { invitationThemeStyle, isDarkColor } from '../theme';

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
  laserDoily: 'crest',
};

/** Crest ornaments that frame the couple's monogram. */
const MONOGRAM_CRESTS: ReadonlySet<OrnamentKey> = new Set<OrnamentKey>(['monogramRing', 'leafyWreath', 'laserDoily']);

/** Laser layouts: the jacket sheet laid over the card, framing its window. */
const LASER_SHEETS: Partial<Record<LayoutVariant, LaserShape>> = {
  laserLace: LASER_SHAPES.lace,
  laserArch: LASER_SHAPES.arch,
  laserLattice: LASER_SHAPES.lattice,
};

/**
 * Renders any design from pure data: the palette/fonts arrive as `--inv-*`
 * CSS variables (host style binding), the structure is one of the layout
 * variants, and decorations are slotted ornaments. The stylesheet is
 * structural only — keep colors out of it (anyComponentStyle budget). Print
 * finishes and the laser layouts are styled globally in wedding-finishes.css.
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

  get finish(): string {
    return this.design.finish ?? 'flat';
  }

  /** Shading for pressed/raised finishes flips on dark paper. */
  get isDarkPaper(): boolean {
    return isDarkColor(this.design.palette.surface);
  }

  get laserSheet(): LaserShape | null {
    return LASER_SHEETS[this.design.layout] ?? null;
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

  /** The monogram reads as cut through the laser-cut doily. */
  get crestIsLaserCut(): boolean {
    return this.crestOrnament === 'laserDoily';
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
