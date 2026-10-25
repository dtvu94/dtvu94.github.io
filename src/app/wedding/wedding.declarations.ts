import { WeddingDetailComponent } from './detail/wedding-detail.component';
import { DirectionsGuideComponent } from './directions-guide/directions-guide.component';
import { EnvelopeComponent } from './envelope/envelope.component';
import { WeddingGalleryComponent } from './gallery/wedding-gallery.component';
import { InvitationCardComponent } from './invitation-card/invitation-card.component';
import { LanguageToggleComponent } from './language-toggle/language-toggle.component';
import { OrnamentComponent } from './ornaments/ornament.component';
import { PocketComponent } from './pocket/pocket.component';
import { ReliefFilterComponent } from './relief/relief-filter.component';
import { ReliefComponent } from './relief/relief.component';
import { SceneFrameComponent } from './suite/scene-frame.component';
import { SuiteComponent } from './suite/suite.component';

/*
 * Declaration lists, kept apart from WeddingModule so specs can declare the
 * same components in a TestBed without importing (and registering) the
 * module itself.
 */

/** A printed card face and its art. */
export const CARD_DECLARATIONS = [InvitationCardComponent, OrnamentComponent, ReliefComponent, ReliefFilterComponent];

/** A whole suite: card, envelope, pocket and the scene around them. */
export const SUITE_DECLARATIONS = [...CARD_DECLARATIONS, EnvelopeComponent, PocketComponent, SuiteComponent, SceneFrameComponent];

/** Everything the lazy wedding feature declares. */
export const WEDDING_DECLARATIONS = [
  ...SUITE_DECLARATIONS,
  WeddingGalleryComponent,
  WeddingDetailComponent,
  DirectionsGuideComponent,
  LanguageToggleComponent,
];
