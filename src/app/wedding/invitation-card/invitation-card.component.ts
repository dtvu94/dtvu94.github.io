import { Component, HostBinding, Input } from '@angular/core';
import {
  CardShape,
  InvitationCopy,
  InvitationDesign,
  LayoutVariant,
  OrnamentKey,
  PaperStock,
  ReliefMotif,
  ReliefSpec,
} from '../data/wedding.types';
import { LASER_SHAPES, LaserShape } from '../geometry/laser-cut';
import { STOCK_TEXTURE } from '../geometry/patterns';
import { cardSilhouette, clipPathCss } from '../geometry/shapes';
import { invitationThemeStyle, isDarkColor } from '../theme';

type OrnamentSlot = 'crest' | 'corners' | 'divider' | 'backdrop' | 'watermark';

/** Which slice of the copy a face prints. */
export type CardPart =
  /** Everything: title, crest, invitation, date, venue. */
  | 'full'
  /** Announcement: crest, "Lễ Thành Hôn", names, short date, venue brand. */
  | 'announce'
  /** Invitation only: guest line, names, date and venue — no title or crest. */
  | 'invite';

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
  laurel: 'crest',
  doubleHappiness: 'crest',
};

/** Crest ornaments that frame the couple's monogram. */
const MONOGRAM_CRESTS: ReadonlySet<OrnamentKey> = new Set<OrnamentKey>(['monogramRing', 'leafyWreath', 'laserDoily', 'laurel']);

/** Laser layouts: the jacket sheet laid over the card, framing its window. */
const LASER_SHEETS: Partial<Record<LayoutVariant, LaserShape>> = {
  laserLace: LASER_SHAPES.lace,
  laserArch: LASER_SHAPES.arch,
  laserLattice: LASER_SHAPES.lattice,
  laserBranch: LASER_SHAPES.branch,
  laserCloud: LASER_SHAPES.cloud,
};

/**
 * Renders the printed face of any design from pure data: the palette/fonts
 * arrive as `--inv-*` CSS variables (host style binding), the structure is a
 * layout variant, decorations are slotted ornaments, and the paper itself —
 * die-cut silhouette, stock texture, relief border — comes from the design.
 * The stylesheet is structural only — keep colors out of it (anyComponentStyle
 * budget). Print finishes, stocks and the laser layouts are styled globally in
 * wedding-finishes.css.
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
  @Input() part: CardPart = 'full';
  /** Stack the copy from the top (cards partly hidden by a pocket). */
  @Input() valign: 'center' | 'top' = 'center';

  @HostBinding('attr.style')
  get themeStyle(): string {
    return invitationThemeStyle(this.design);
  }

  get finish(): string {
    return this.design.finish ?? 'flat';
  }

  get shape(): CardShape {
    return this.design.shape ?? 'rect';
  }

  get stock(): PaperStock {
    return this.design.stock ?? 'smooth';
  }

  get clip(): string | null {
    return clipPathCss(this.shape) || null;
  }

  /** Keeps the copy clear of scallops, arches and oval edges. */
  get padding(): string | null {
    const { top, side, bottom } = cardSilhouette(this.shape).inset;
    return top || side || bottom ? `${top}px ${side}px ${bottom}px` : null;
  }

  get stockTexture(): string | null {
    return STOCK_TEXTURE[this.stock] || null;
  }

  /** Shading for pressed/raised finishes flips on dark paper. */
  get isDarkPaper(): boolean {
    return isDarkColor(this.design.palette.surface);
  }

  get relief(): ReliefSpec | null {
    return this.design.relief ?? null;
  }

  /** The relief spec when it carries border art. */
  get reliefBorder(): (ReliefSpec & { motif: ReliefMotif }) | null {
    const relief = this.design.relief;
    return relief?.motif ? (relief as ReliefSpec & { motif: ReliefMotif }) : null;
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

  /** Title, crest and band are left to the announcement / cover faces. */
  get showsHeader(): boolean {
    return this.part === 'full';
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
