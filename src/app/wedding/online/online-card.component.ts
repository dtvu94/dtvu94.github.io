import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CalendarLinks, calendarLinks } from '../data/calendar';
import { MAPS_LINKS } from '../data/directions';
import { WeddingUiStrings } from '../data/ui-strings';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationCopy, InvitationDesign, Lang } from '../data/wedding.types';
import { CARD_H, CARD_W } from '../geometry/shapes';

/**
 * Thiệp online — the invitation as sent by link: the card on its own (no
 * envelope), optionally addressed to one guest, with buttons to open the
 * venue in Google Maps and save the date to a calendar.
 */
@Component({
  selector: 'app-online-card',
  templateUrl: './online-card.component.html',
  styleUrls: ['./online-card.component.css'],
  standalone: false,
})
export class OnlineCardComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input({ required: true }) lang!: Lang;
  @Input({ required: true }) ui!: WeddingUiStrings;
  /** Guest's name from the link, or '' for a blank dotted line. */
  @Input() guest = '';
  /** Whether a click on the card opens it in the zoom viewer (via `zoom`). */
  @Input() zoomable = false;
  @Output() readonly zoom = new EventEmitter<void>();

  readonly cardW = CARD_W;
  readonly cardH = CARD_H;
  readonly mapsUrl = MAPS_LINKS.openMapsUrl;

  private readonly location = inject(DOCUMENT).location;

  get calendar(): CalendarLinks {
    const key = `${this.design.id}|${this.lang}`;
    if (this.cache?.key !== key) {
      const venue = this.copy.venueLines.join(', ');
      const details = `${this.copy.titleWord} — ${this.copy.coupleLine}\n${this.copy.dateLine}`;
      const page = `${this.location.origin}/wedding/${this.design.id}`;
      this.cache = { key, links: calendarLinks(WEDDING_CONFIG, this.lang, venue, details, page) };
    }
    return this.cache.links;
  }

  open(): void {
    if (this.zoomable) {
      this.zoom.emit();
    }
  }

  private cache?: { key: string; links: CalendarLinks };
}
