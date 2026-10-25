import { Component, Input } from '@angular/core';
import { CardShape, Palette, ReliefMotif, ReliefSpec } from '../data/wedding.types';
import { Motif } from '../geometry/motifs';
import { reliefArt } from '../geometry/relief-art';
import { svgRef, uniqueSvgId } from './svg-ref';

/**
 * Border art in relief (dập nổi / dập chìm / ép kim) laid over the paper of a
 * 400 × 560 card. One compound fill + one compound stroke, lit by one filter.
 */
@Component({
  selector: 'app-relief',
  template: `
    <svg viewBox="0 0 400 560" aria-hidden="true">
      <defs>
        <filter appReliefFilter [attr.id]="filterId" [finish]="spec.finish" [mode]="spec.mode" [metal]="palette.accent" />
      </defs>
      <g [attr.filter]="filterRef" [attr.fill]="ink" [attr.stroke]="ink">
        <path [attr.d]="art.fill" stroke="none" />
        @if (art.stroke) {
          <path [attr.d]="art.stroke" fill="none" [attr.stroke-width]="art.strokeWidth" stroke-linecap="round" />
        }
      </g>
    </svg>
  `,
  styles: [':host { display: block; pointer-events: none; } svg { display: block; width: 100%; height: 100%; overflow: visible; }'],
  standalone: false,
})
export class ReliefComponent {
  @Input({ required: true }) spec!: ReliefSpec & { motif: ReliefMotif };
  @Input({ required: true }) palette!: Palette;
  @Input() shape: CardShape = 'rect';

  readonly filterId = uniqueSvgId('relief');
  readonly filterRef = svgRef(this.filterId);

  get art(): Motif {
    return reliefArt(this.spec.motif, this.shape);
  }

  /** Blind and foil only use the art's alpha; ink prints in the accent colour. */
  get ink(): string {
    return this.spec.finish === 'ink' ? this.palette.accent : '#000000';
  }
}
