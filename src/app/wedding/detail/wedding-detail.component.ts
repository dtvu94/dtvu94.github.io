import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { DESIGN_CATEGORIES, getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_UI } from '../data/ui-strings';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign } from '../data/wedding.types';
import { LanguageService } from '../language.service';
import { isDarkColor } from '../theme';

/**
 * One full invitation suite: the card plus the matching directions insert.
 * The page URL (/wedding/:id) is the "share this design" link.
 */
@Component({
  selector: 'app-wedding-detail',
  templateUrl: './wedding-detail.component.html',
  styleUrls: ['./wedding-detail.component.css'],
  standalone: false,
})
export class WeddingDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly language = inject(LanguageService);

  readonly lang = this.language.lang;
  readonly ui = computed(() => WEDDING_UI[this.lang()]);
  readonly design = signal<InvitationDesign | null>(null);
  readonly copy = computed(() => buildWording(WEDDING_CONFIG, this.lang()));

  private readonly categoryLabels = new Map(
    DESIGN_CATEGORIES.map((category) => [category.id, category.labels] as const),
  );

  constructor() {
    effect(() => {
      const design = this.design();
      if (design) {
        this.title.setTitle(`${design.nameVi} — ${this.ui().detailTitleSuffix}`);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const design = getDesignById(id);
    if (!design) {
      void this.router.navigate(['/wedding']);
      return;
    }
    this.design.set(design);
    // Private family page — keep it out of search engines.
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="robots"');
  }

  categoryLabel(design: InvitationDesign): string {
    return this.categoryLabels.get(design.category)?.[this.lang()] ?? '';
  }

  get isDark(): boolean {
    const design = this.design();
    return design !== null && isDarkColor(design.palette.bg);
  }

  print(): void {
    window.print();
  }
}
