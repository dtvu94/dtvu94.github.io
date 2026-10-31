import { Component, HostBinding, Input } from '@angular/core';
import { OrnamentKey, Palette } from '../data/wedding.types';
import { HEART_FLOURISH_BOX, heartFlourish } from '../geometry/envelope-art';
import { stickerInk, stickerMeta } from './editor-options';
import { StickerColor, StickerKind } from './editor-state';

const HEART = heartFlourish();

/**
 * The art of one sticker at a given width: the couple's logo, the drawn
 * heart, or one of the card ornaments, in one of the palette's inks.
 * Position, rotation and selection belong to whoever places it.
 */
@Component({
  selector: 'app-editor-sticker',
  template: `
    @switch (kind) {
      @case ('logo') {
        <span class="vt-logo"></span>
      }
      @case ('heart') {
        <svg [attr.viewBox]="heartBox" aria-hidden="true">
          <path [attr.d]="heart" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      }
      @default {
        <app-ornament [ornament]="ornament" />
      }
    }
  `,
  styles: [
    ':host { display: block; line-height: 0; }',
    ':host > *, app-ornament { width: 100%; height: 100%; }',
    'svg { display: block; overflow: visible; }',
    /* The logo is drawn 1em high: the host's font size is its height. */
    '.vt-logo { display: block; width: 100%; height: 1em; }',
  ],
  standalone: false,
})
export class EditorStickerComponent {
  @Input({ required: true }) kind!: StickerKind;
  @Input({ required: true }) palette!: Palette;
  @Input() color: StickerColor = 'accent';
  /** Width in design pixels. */
  @Input() size = 60;

  readonly heart = HEART;
  readonly heartBox = `0 0 ${HEART_FLOURISH_BOX.w} ${HEART_FLOURISH_BOX.h}`;

  get ornament(): OrnamentKey {
    return this.kind as OrnamentKey;
  }

  @HostBinding('style.width.px')
  get width(): number {
    return this.size;
  }

  @HostBinding('style.height.px')
  get height(): number {
    return this.size * stickerMeta(this.kind).aspect;
  }

  @HostBinding('style.font-size.px')
  get fontSize(): number {
    return this.height;
  }

  @HostBinding('style.color')
  get ink(): string {
    return stickerInk(this.color, this.palette);
  }

  /** Ornaments paint with --inv-accent. */
  @HostBinding('style.--inv-accent')
  get accent(): string {
    return this.ink;
  }
}
