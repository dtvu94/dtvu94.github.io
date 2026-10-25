import { Component, HostBinding, Input } from '@angular/core';

/** Light from the top-left, as on a desk by a window. */
const AZIMUTH = 225;

interface LightingParams {
  blur: number;
  surfaceScale: number;
  elevation: number;
  /** Highlight / shadow gains: alpha reached at full light / full shade. */
  highlight: number;
  shadow: number;
  keepSource: boolean;
}

/**
 * The relief lighting model, as an SVG `<filter>`: the art's alpha is blurred
 * into a height map and lit by a distant light. What comes out is only the
 * light and shade the relief casts on the paper (blind), the same on top of
 * the inked art (ink), or a lit metallic body (foil).
 *
 * Usage (inside an `<svg><defs>`):
 * `<filter appReliefFilter [attr.id]="id" finish="blind" mode="raised" />`
 */
@Component({
  selector: '[appReliefFilter]',
  templateUrl: './relief-filter.component.html',
  standalone: false,
})
export class ReliefFilterComponent {
  @Input({ required: true }) finish!: 'blind' | 'ink' | 'foil';
  @Input() mode: 'raised' | 'pressed' = 'raised';
  /** Foil body colour. */
  @Input() metal = '#c9a032';
  /** Scales bevel width and depth, for art drawn at other sizes. */
  @Input() scale = 1;

  @HostBinding('attr.x') readonly x = '-6%';
  @HostBinding('attr.y') readonly y = '-6%';
  @HostBinding('attr.width') readonly width = '112%';
  @HostBinding('attr.height') readonly height = '112%';
  @HostBinding('attr.color-interpolation-filters') readonly space = 'sRGB';

  readonly azimuth = AZIMUTH;

  get params(): LightingParams {
    const raised = this.mode === 'raised';
    if (this.finish === 'ink') {
      return { blur: 1.2, surfaceScale: raised ? 2.4 : -2.6, elevation: 45, highlight: 0.85, shadow: 0.4, keepSource: true };
    }
    return raised
      ? { blur: 1.4, surfaceScale: 2.5, elevation: 48, highlight: 1, shadow: 0.42, keepSource: false }
      : { blur: 1.4, surfaceScale: -3, elevation: 50, highlight: 0.9, shadow: 0.4, keepSource: false };
  }

  get blur(): number {
    return this.params.blur * this.scale;
  }

  get surfaceScale(): number {
    return this.params.surfaceScale * this.scale;
  }

  /** feDiffuseLighting returns sin(elevation) on flat paper; shading is measured from there. */
  private get flat(): number {
    return Math.sin((this.params.elevation * Math.PI) / 180);
  }

  get highlightMatrix(): string {
    const gain = this.params.highlight / (1 - this.flat);
    return `0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${round(gain)} 0 0 0 ${round(-gain * this.flat)}`;
  }

  get shadowMatrix(): string {
    const gain = this.params.shadow / this.flat;
    return `0 0 0 0 0.16 0 0 0 0 0.11 0 0 0 0 0.05 ${round(-gain)} 0 0 0 ${round(gain * this.flat)}`;
  }

  /** A lighter tint of the metal for specular highlights. */
  get sheen(): string {
    return mix(this.metal, '#ffffff', 0.7);
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}
