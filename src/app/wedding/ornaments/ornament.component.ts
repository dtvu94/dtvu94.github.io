import { Component, Input } from '@angular/core';
import { OrnamentKey, Palette, ReliefSpec } from '../data/wedding.types';
import { LASER_SHAPES } from '../geometry/laser-cut';
import { LAUREL_CREST } from '../geometry/relief-art';
import { svgRef, uniqueSvgId } from '../relief/svg-ref';

interface OrnamentBox {
  viewBox: string;
  preserve?: string;
}

const BOXES: Record<Exclude<OrnamentKey, 'none' | 'grandAmpersand'>, OrnamentBox> = {
  hairlineFlourish: { viewBox: '0 0 160 16' },
  floralCorner: { viewBox: '0 0 100 100' },
  lotus: { viewBox: '0 0 100 64' },
  rings: { viewBox: '0 0 100 60' },
  artDecoFan: { viewBox: '0 0 100 52' },
  leafyWreath: { viewBox: '0 0 100 100' },
  botanicalSprig: { viewBox: '0 0 100 100' },
  geoFrame: { viewBox: '0 0 100 100' },
  watercolorBlob: { viewBox: '0 0 200 120', preserve: 'none' },
  monogramRing: { viewBox: '0 0 100 100' },
  laserDoily: { viewBox: '0 0 100 100' },
  laurel: { viewBox: '0 0 100 100' },
};

/**
 * Inline-SVG decorations. Every shape inherits `currentColor`, which the host
 * sets to the design's accent color — so ornaments never need per-design CSS.
 * With a relief spec the art is lit like the card's border relief (blind
 * emboss, pressed ink or foil).
 */
@Component({
  selector: 'app-ornament',
  templateUrl: './ornament.component.html',
  styles: [
    ':host { display: block; line-height: 0; color: var(--inv-accent, currentColor); }',
    'svg { display: block; width: 100%; height: 100%; overflow: visible; }',
  ],
  standalone: false,
})
export class OrnamentComponent {
  @Input({ required: true }) ornament!: OrnamentKey;
  @Input() relief: ReliefSpec | null = null;
  @Input() palette: Palette | null = null;

  readonly doily = LASER_SHAPES.doily;
  readonly laurel = LAUREL_CREST;
  readonly filterId = uniqueSvgId('orn');
  readonly filterRef = svgRef(this.filterId);

  get box(): OrnamentBox {
    return BOXES[this.ornament as keyof typeof BOXES] ?? { viewBox: '0 0 100 100' };
  }

  /** Laser and watercolour art are never pressed. */
  get lit(): boolean {
    return this.relief !== null && this.ornament !== 'laserDoily' && this.ornament !== 'watercolorBlob';
  }

  get metal(): string {
    return this.palette?.accent ?? '#c9a032';
  }
}
