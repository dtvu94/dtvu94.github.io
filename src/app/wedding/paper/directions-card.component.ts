import { Component, HostBinding, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { STOCK_TEXTURE } from '../geometry/patterns';
import { QrArt, qrArt } from '../geometry/qr';
import { MAP_H, MAP_W, MapLabel, VenueMap, pinPath, venueMap } from '../geometry/venue-map';
import { invitationThemeStyle } from '../theme';

/** Card size in design pixels (≈ 6 × 4 in, landscape). */
export const DIRECTIONS_CARD_W = 480;
export const DIRECTIONS_CARD_H = 320;

/**
 * Thiệp chỉ đường — the small printed insert that travels in the envelope
 * with the invitation: a sketch map of the canal and its bridges, the venue
 * and hall, and a QR code that opens the venue in Google Maps.
 */
@Component({
  selector: 'app-directions-card',
  templateUrl: './directions-card.component.html',
  styleUrls: ['./directions-card.component.css'],
  standalone: false,
})
export class DirectionsCardComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;

  readonly mapW = MAP_W;
  readonly mapH = MAP_H;
  readonly map: VenueMap = venueMap();
  readonly pin = pinPath(this.map.pin);
  readonly mapsUrl = WEDDING_CONFIG.venue.mapsShareUrl;
  readonly qr: QrArt = qrArt(WEDDING_CONFIG.venue.mapsShareUrl);

  @HostBinding('attr.style')
  get hostStyle(): string {
    return invitationThemeStyle(this.design);
  }

  get texture(): string | null {
    return STOCK_TEXTURE[this.design.stock ?? 'smooth'] || null;
  }

  /** QR viewBox with a 2-module quiet zone. */
  get qrBox(): string {
    return `-2 -2 ${this.qr.size + 4} ${this.qr.size + 4}`;
  }

  /** The hall line as printed on the invitation ("Tại Sảnh Danube" / "Danube Hall"). */
  get hallLine(): string {
    return this.copy.venueLines[0];
  }

  get address(): string {
    return this.copy.venueLines[this.copy.venueLines.length - 1];
  }

  /** Centred on its anchor point, turned to follow the canal or street. */
  labelTransform(label: MapLabel): string {
    return `translate(-50%, -50%) rotate(${label.angle}deg)`;
  }
}
