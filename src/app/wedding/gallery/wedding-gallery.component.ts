import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DESIGN_CATEGORIES, INVITATION_DESIGNS } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_UI, formatDateBadge } from '../data/ui-strings';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { DesignCategory } from '../data/wedding.types';
import { LanguageService } from '../language.service';

@Component({
  selector: 'app-wedding-gallery',
  templateUrl: './wedding-gallery.component.html',
  styleUrls: ['./wedding-gallery.component.css'],
  standalone: false,
})
export class WeddingGalleryComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly categories = DESIGN_CATEGORIES;
  readonly designs = INVITATION_DESIGNS;

  readonly lang = this.language.lang;
  readonly ui = computed(() => WEDDING_UI[this.lang()]);
  readonly copy = computed(() => buildWording(WEDDING_CONFIG, this.lang()));
  readonly dateBadge = computed(() => formatDateBadge(WEDDING_CONFIG, this.lang()));

  readonly activeCategory = signal<DesignCategory | 'all'>('all');
  readonly filteredDesigns = computed(() => {
    const category = this.activeCategory();
    return category === 'all'
      ? this.designs
      : this.designs.filter((design) => design.category === category);
  });

  private readonly categoryLabels = new Map(
    DESIGN_CATEGORIES.map((category) => [category.id, category.labels] as const),
  );

  constructor() {
    effect(() => this.title.setTitle(this.ui().docTitle));
  }

  ngOnInit(): void {
    // Private family page — keep it out of search engines.
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="robots"');
  }

  setCategory(category: DesignCategory | 'all'): void {
    this.activeCategory.set(category);
  }

  labelFor(category: DesignCategory): string {
    return this.categoryLabels.get(category)?.[this.lang()] ?? category;
  }

  /** Staggers the cards' entrance animation; capped so late rows don't lag. */
  staggerDelay(index: number): string {
    return `${Math.min(index, 12) * 45}ms`;
  }
}
