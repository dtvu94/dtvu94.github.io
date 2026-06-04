import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { WeddingDetailComponent } from './detail/wedding-detail.component';
import { DirectionsGuideComponent } from './directions-guide/directions-guide.component';
import { WeddingGalleryComponent } from './gallery/wedding-gallery.component';
import { InvitationCardComponent } from './invitation-card/invitation-card.component';
import { LanguageToggleComponent } from './language-toggle/language-toggle.component';
import { OrnamentComponent } from './ornaments/ornament.component';
import { WeddingRoutingModule } from './wedding-routing.module';

/** Lazy-loaded at /wedding — keeps the CV's initial bundle untouched. */
@NgModule({
  declarations: [
    WeddingGalleryComponent,
    WeddingDetailComponent,
    InvitationCardComponent,
    DirectionsGuideComponent,
    OrnamentComponent,
    LanguageToggleComponent,
  ],
  imports: [CommonModule, WeddingRoutingModule],
})
export class WeddingModule {}
