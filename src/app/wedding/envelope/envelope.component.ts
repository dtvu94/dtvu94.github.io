import { Component, HostBinding, Input } from '@angular/core';
import { EnvelopeSpec, InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { cornerSpray, curlFrame, drawnBow, fern, lotusPrint, monogramCrest, waxSealPath } from '../geometry/envelope-art';
import { Motif, mergeMotifs } from '../geometry/motifs';
import { linerBackground, STOCK_TEXTURE } from '../geometry/patterns';
import { ENV_H, ENV_W, EnvelopeGeometry, envelopeGeometry } from '../geometry/shapes';
import { svgRef, uniqueSvgId } from '../relief/svg-ref';
import { invitationThemeStyle } from '../theme';

/** One physical layer of the envelope; the suite interleaves the card between them. */
export type EnvelopeLayer =
  /** Inside of the back panel, with the liner showing at the top. */
  | 'back'
  /** Front pocket (side and bottom flaps), with the print and guest line. */
  | 'pocket'
  /** The top flap, hinged at the top edge: outside face + lined inside face. */
  | 'flap';

const geometryCache = new Map<string, EnvelopeGeometry>();

/** Where the print sits, as fractions of the envelope height. */
const PRINT_Y: Record<string, number> = { names: 0.71, monogram: 0.745, fern: 0.66, frame: 0.56, florals: 0.71, lotus: 0.64 };

/**
 * One layer of a design's matching envelope, drawn at ENV_W × ENV_H design
 * pixels. Shapes come from geometry/shapes.ts as clip-paths over textured
 * paper; art is inline SVG; the flap swings open in 3-D.
 */
@Component({
  selector: 'app-envelope',
  templateUrl: './envelope.component.html',
  styleUrls: ['./envelope.component.css'],
  standalone: false,
})
export class EnvelopeComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input() layer: EnvelopeLayer = 'pocket';
  @Input() open = false;

  readonly w = ENV_W;
  readonly h = ENV_H;
  readonly foilId = uniqueSvgId('env-foil');
  readonly foilRef = svgRef(this.foilId);
  readonly waxId = uniqueSvgId('env-wax');
  readonly waxRef = svgRef(this.waxId);

  @HostBinding('class')
  get hostClass(): string {
    return `env env--${this.layer}${this.spec.vellum ? ' env--vellum' : ''}${this.open ? ' env--open' : ''}`;
  }

  /** Fonts from the design; paper and ink of the envelope itself. */
  @HostBinding('attr.style')
  get hostStyle(): string {
    return `${invitationThemeStyle(this.design)};--env-paper:${this.spec.paper};--env-ink:${this.spec.ink}`;
  }

  get spec(): EnvelopeSpec {
    return this.design.envelope;
  }

  get geo(): EnvelopeGeometry {
    let geo = geometryCache.get(this.spec.flap);
    if (!geo) {
      geo = envelopeGeometry(this.spec.flap);
      geometryCache.set(this.spec.flap, geo);
    }
    return geo;
  }

  get flapClip(): string {
    return `path('${this.geo.flap}')`;
  }

  get pocketClip(): string {
    return `path('${this.geo.pocket}')`;
  }

  get texture(): string | null {
    return STOCK_TEXTURE[this.spec.stock ?? 'smooth'] || null;
  }

  get liner(): string {
    const [bg, ink] = this.spec.linerColors ?? [this.design.palette.surface, this.design.palette.accent];
    return linerBackground(this.spec.liner, bg, ink);
  }

  get hasLiner(): boolean {
    return this.spec.liner !== 'none';
  }

  get edge(): string {
    return this.spec.edge ?? 'transparent';
  }

  get sealColor(): string {
    return this.spec.sealColor ?? this.design.palette.accent;
  }

  get printY(): number {
    return (PRINT_Y[this.spec.print] ?? 0.7) * ENV_H;
  }

  /** Line art for the print, in envelope pixels. */
  get printArt(): Motif | null {
    const cx = ENV_W / 2;
    const y = this.printY;
    switch (this.spec.print) {
      case 'monogram':
        return monogramCrest({ x: cx, y }, 30);
      case 'fern':
        return mergeMotifs(fern({ x: ENV_W - 70, y: ENV_H - 14 }, -1.85, 150, 0.35), fern({ x: ENV_W - 58, y: ENV_H - 16 }, -1.45, 112, -0.3));
      case 'frame':
        return curlFrame(cx - 128, ENV_H * 0.34, 256, ENV_H * 0.42);
      case 'florals':
        return mergeMotifs(cornerSpray({ x: 6, y: ENV_H - 6 }, -0.75, 96, 3), cornerSpray({ x: ENV_W - 6, y: ENV_H - 6 }, -2.4, 96, 8));
      case 'lotus':
        return lotusPrint({ x: cx, y }, 30);
      default:
        return null;
    }
  }

  get showsNames(): boolean {
    return this.spec.print === 'names' || this.spec.print === 'florals' || this.spec.print === 'lotus' || this.spec.print === 'frame';
  }

  get namesY(): number {
    if (this.spec.print === 'lotus') {
      return ENV_H * 0.8;
    }
    return this.spec.print === 'frame' ? ENV_H * 0.62 : this.printY;
  }

  get waxPath(): string {
    const { x, y } = this.geo.sealAt;
    return waxSealPath({ x, y }, this.spec.seal === 'bow' ? 17 : 27);
  }

  get bowPath(): string {
    return drawnBow(this.geo.sealAt, 46);
  }

  get twineY(): number {
    return ENV_H * 0.62;
  }
}
