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
  doubleHappiness: { viewBox: '0 0 100 100' },
};

/** Song hỷ (囍) as blocky strokes — no CJK font needed. */
const DOUBLE_HAPPINESS = [
  // 士: long bar, two verticals, short bars
  [10, 6, 80, 6],
  [25, 0, 6, 26],
  [69, 0, 6, 26],
  [16, 20, 24, 6],
  [60, 20, 24, 6],
  // 口
  [16, 30, 24, 5],
  [16, 41, 24, 5],
  [16, 30, 5, 16],
  [35, 30, 5, 16],
  [60, 30, 24, 5],
  [60, 41, 24, 5],
  [60, 30, 5, 16],
  [79, 30, 5, 16],
  // 䒑: ticks and the long bar
  [18, 49, 5, 8],
  [33, 49, 5, 8],
  [62, 49, 5, 8],
  [77, 49, 5, 8],
  [8, 57, 84, 6],
  // 口 (lower, larger)
  [14, 68, 28, 5],
  [14, 91, 28, 5],
  [14, 68, 5, 28],
  [37, 68, 5, 28],
  [58, 68, 28, 5],
  [58, 91, 28, 5],
  [58, 68, 5, 28],
  [81, 68, 5, 28],
]
  .map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}Z`)
  .join('');

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
  readonly doubleHappiness = DOUBLE_HAPPINESS;
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
