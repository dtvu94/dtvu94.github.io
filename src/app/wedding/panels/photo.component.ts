import { Component, HostBinding, Input } from '@angular/core';
import { PhotoFrame } from '../data/wedding.types';
import { WEDDING_CONFIG } from '../data/wedding-config';

/**
 * The couple's photo, cut to a frame. Uses WEDDING_CONFIG.photos once the
 * photoshoot is done; until then an intentional placeholder (monogram on a
 * soft wash, with a "coming soon" caption) keeps every design presentable.
 * Colours come from the surrounding --inv-* variables.
 */
@Component({
  selector: 'app-photo',
  template: `
    @if (src; as url) {
      <img class="ph__img" [src]="url" alt="" loading="lazy" decoding="async" />
    } @else {
      <div class="ph__placeholder">
        <svg class="ph__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8h3l1.6-2h6.8L17 8h3v11H4z" />
          <circle cx="12" cy="13.2" r="3.4" />
        </svg>
        <p class="ph__monogram">{{ monogram }}</p>
        <p class="ph__caption">{{ caption }}</p>
      </div>
    }
  `,
  styleUrls: ['./photo.component.css'],
  standalone: false,
})
export class PhotoComponent {
  @Input() frame: PhotoFrame = 'rounded';
  /** Which configured photo to show (falls back to the first). */
  @Input() index = 0;
  @Input() monogram = '';
  @Input() caption = '';

  @HostBinding('class')
  get hostClass(): string {
    return `ph ph--${this.frame}`;
  }

  get src(): string | null {
    const photos = WEDDING_CONFIG.photos;
    return photos[this.index] ?? photos[0] ?? null;
  }
}
