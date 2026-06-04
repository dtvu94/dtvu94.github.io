import { Component, Input } from '@angular/core';
import { OrnamentKey } from '../data/wedding.types';

/**
 * Inline-SVG decorations. Every shape inherits `currentColor`, which the host
 * sets to the design's accent color — so ornaments never need per-design CSS.
 */
@Component({
  selector: 'app-ornament',
  templateUrl: './ornament.component.html',
  styles: [
    ':host { display: block; line-height: 0; color: var(--inv-accent, currentColor); }',
    'svg { display: block; width: 100%; height: 100%; }',
  ],
  standalone: false,
})
export class OrnamentComponent {
  @Input({ required: true }) ornament!: OrnamentKey;
}
