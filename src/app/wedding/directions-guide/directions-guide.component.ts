import { Component, HostBinding, Input, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MAPS_LINKS, getDirections } from '../data/directions';
import { InvitationDesign } from '../data/wedding.types';
import { LanguageService } from '../language.service';
import { invitationThemeStyle } from '../theme';

/**
 * The directions insert card — same content for every sample, localized via
 * the language service and themed to match the selected design through the
 * shared --inv-* variables.
 */
@Component({
  selector: 'app-directions-guide',
  templateUrl: './directions-guide.component.html',
  styleUrls: ['./directions-guide.component.css'],
  standalone: false,
})
export class DirectionsGuideComponent {
  @Input({ required: true }) design!: InvitationDesign;

  private readonly language = inject(LanguageService);

  readonly directions = computed(() => getDirections(this.language.lang()));
  /** The key-less Google Maps embed; iframe src must be explicitly trusted. */
  readonly embedUrl: SafeResourceUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    MAPS_LINKS.embedUrl,
  );

  @HostBinding('attr.style')
  get themeStyle(): string {
    return invitationThemeStyle(this.design);
  }
}
