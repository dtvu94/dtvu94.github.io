import { Component, HostBinding, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign, PassportSpec } from '../data/wedding.types';
import { STOCK_TEXTURE } from '../geometry/patterns';
import { invitationThemeStyle } from '../theme';

/** Passport page in design pixels (≈ the booklet's 88 × 125 mm). */
export const PAGE_W = 300;
export const PAGE_H = 424;

/**
 * closed: booklet shut, boarding pass hidden inside (fits an envelope);
 * peek: shut, with the boarding pass sticking out on the right;
 * open: cover swung open to the left, boarding pass slid out below.
 */
export type PassportPose = 'closed' | 'peek' | 'open';

/** "Vũ & Thảo" → "VU<<THAO": machine-readable-zone style, ASCII only. */
export function mrzName(coupleLine: string): string {
  return coupleLine
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'D')
    .toUpperCase()
    .replace(/\s*&\s*/g, '<<')
    .replace(/[^A-Z<]/g, '<');
}

/**
 * Hộ chiếu & vé — a passport booklet whose cover opens like a book onto a
 * data page and the invitation, with a boarding pass tucked inside that
 * slides out when it opens. The cover emblem is the couple's own laurel and
 * monogram (no national arms).
 */
@Component({
  selector: 'app-passport',
  templateUrl: './passport.component.html',
  styleUrls: ['./passport.component.css'],
  standalone: false,
})
export class PassportComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input() pose: PassportPose = 'closed';

  readonly pageW = PAGE_W;
  readonly pageH = PAGE_H;

  @HostBinding('attr.style')
  get hostStyle(): string {
    const p = this.spec;
    return `${invitationThemeStyle(this.design)};--ps-cover:${p.cover};--ps-foil:${p.foil};--ps-page:${p.page};--ps-ticket:${p.ticket}`;
  }

  @HostBinding('class')
  get hostClass(): string {
    return `ps ps--${this.pose}`;
  }

  get spec(): PassportSpec {
    // Designs of form 'passport' always carry a passport spec (see designs.spec.ts).
    return this.design.passport as PassportSpec;
  }

  get texture(): string | null {
    return STOCK_TEXTURE.felt;
  }

  /** The design as printed on the pages: page paper instead of card stock. */
  get pageDesign(): InvitationDesign {
    if (this.pageCache?.source !== this.design) {
      this.pageCache = {
        source: this.design,
        value: { ...this.design, shape: 'rect', stock: 'smooth', palette: { ...this.design.palette, surface: this.spec.page } },
      };
    }
    return this.pageCache.value;
  }

  /** Laurel emblem lit as foil in the cover's foil colour. */
  get emblemPalette() {
    return { ...this.design.palette, accent: this.spec.foil };
  }

  get mrz(): [string, string] {
    const [day, month, year] = this.copy.shortDate.split(' · ');
    const names = `P<VNM${mrzName(this.copy.coupleLine)}`.padEnd(36, '<').slice(0, 36);
    const venue = this.copy.venueShort.toUpperCase().replace(/[^A-Z]/g, '<');
    return [names, `${day}${month}${year}<${venue}`.padEnd(36, '<').slice(0, 36)];
  }

  /** Barcode bars for the boarding pass stub (deterministic). */
  readonly bars = Array.from({ length: 34 }, (_, i) => ({ x: i * 3.4, w: [1, 2, 1, 3, 1, 1, 2][i % 7] }));

  private pageCache?: { source: InvitationDesign; value: InvitationDesign };
}
