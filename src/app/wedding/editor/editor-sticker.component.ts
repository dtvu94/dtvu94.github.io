import { Component, HostBinding, Input, inject } from '@angular/core';
import { FontPairing, OrnamentKey, Palette, PhotoFrame } from '../data/wedding.types';
import { HEART_FLOURISH_BOX, heartFlourish } from '../geometry/envelope-art';
import { StickerArt, stickerArt } from '../geometry/sticker-art';
import { photoAspect, stickerInk, stickerMeta } from './editor-options';
import { StickerColor, StickerFont, StickerKind } from './editor-state';
import { EditorPhotoStore } from './photo-store';

const HEART = heartFlourish();

/**
 * The art of one sticker at a given width: the couple's logo, the drawn
 * heart, a card ornament, chữ Hỷ / birds / ribbon / blossoms, a line of
 * text, or an uploaded photo in its frame — in one of the palette's inks.
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
      @case ('text') {
        <span class="stk__text" [style.font-family]="fontFamily">{{ text || 'Aa' }}</span>
      }
      @case ('photo') {
        <app-photo [frame]="frame" [image]="photoUrl" [monogram]="monogram" caption="Ảnh cưới" />
      }
      @default {
        @if (art; as a) {
          <svg [attr.viewBox]="a.box" aria-hidden="true">
            @if (a.fill) {
              <path [attr.d]="a.fill" fill="currentColor" />
            }
            @if (a.stroke) {
              <path [attr.d]="a.stroke" fill="none" stroke="currentColor" [attr.stroke-width]="a.strokeWidth" stroke-linecap="round" stroke-linejoin="round" />
            }
          </svg>
        } @else {
          <app-ornament [ornament]="ornament" />
        }
      }
    }
  `,
  styles: [
    ':host { display: block; line-height: 0; }',
    ':host > *, app-ornament, app-photo { width: 100%; height: 100%; }',
    'svg { display: block; overflow: visible; }',
    /* The logo is drawn 1em high: the host's font size is its height. */
    '.vt-logo { display: block; width: 100%; height: 1em; }',
    '.stk__text { display: block; width: auto; height: auto; white-space: pre; text-align: center; line-height: 1.15; }',
  ],
  standalone: false,
})
export class EditorStickerComponent {
  @Input({ required: true }) kind!: StickerKind;
  @Input({ required: true }) palette!: Palette;
  @Input() color: StickerColor = 'accent';
  /** Width in design pixels; for text, the font size. */
  @Input() size = 60;
  @Input() text = '';
  @Input() font: StickerFont = 'script';
  /** The design's faces, for text set in its display or body face. */
  @Input() fonts: FontPairing | null = null;
  /** Photo id in the photo store, and the frame it is cut to. */
  @Input() photo: string | null = null;
  @Input() frame: PhotoFrame = 'oval';
  @Input() monogram = 'V & T';

  private readonly photos = inject(EditorPhotoStore);

  readonly heart = HEART;
  readonly heartBox = `0 0 ${HEART_FLOURISH_BOX.w} ${HEART_FLOURISH_BOX.h}`;

  get ornament(): OrnamentKey {
    return this.kind as OrnamentKey;
  }

  get art(): StickerArt | null {
    return stickerArt(this.kind);
  }

  get photoUrl(): string | null {
    return this.photo ? (this.photos.urls()[this.photo] ?? null) : null;
  }

  get fontFamily(): string {
    if (this.font === 'display' && this.fonts) {
      return `var(--ff-${this.fonts.display})`;
    }
    if (this.font === 'body' && this.fonts) {
      return `var(--ff-${this.fonts.body})`;
    }
    return 'var(--ff-alexBrush)';
  }

  private get height(): number {
    return this.kind === 'photo' ? this.size * photoAspect(this.frame) : this.size * stickerMeta(this.kind).aspect;
  }

  /**
   * Size, ink, and the --inv-* colours a photo frame's placeholder and the
   * ornaments paint with. Text sizes itself from its font size.
   */
  @HostBinding('attr.style')
  get hostStyle(): string {
    const ink = stickerInk(this.color, this.palette);
    const box = this.kind === 'text' ? `font-size:${this.size}px` : `width:${this.size}px;height:${this.height}px;font-size:${this.height}px`;
    const theme =
      this.kind === 'photo'
        ? `--inv-accent:${this.palette.accent};--inv-surface:${this.palette.surface};--inv-primary:${this.palette.primary};--inv-font-accent:var(--ff-alexBrush)`
        : `--inv-accent:${ink}`;
    return `${box};color:${ink};${theme}`;
  }
}
