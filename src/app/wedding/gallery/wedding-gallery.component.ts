import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CARD_FORMS, DESIGN_STYLES, formLabel, styleLabel } from '../data/categories';
import { INVITATION_DESIGNS } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_UI, formatDateBadge } from '../data/ui-strings';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { CardForm, DesignStyle, InvitationDesign } from '../data/wedding.types';
import { LanguageService } from '../language.service';

type Filter<T> = T | 'all';

/**
 * The catalogue: two independent filter rows — kiểu thiệp (format) and
 * phong cách (style) — over a grid of suite previews (card on envelope).
 * Each chip shows how many designs it would leave given the other row.
 */
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

  readonly designs = INVITATION_DESIGNS;
  /** Formats without designs yet stay hidden. */
  readonly forms = CARD_FORMS.filter((form) => this.designs.some((d) => d.form === form.id));
  readonly styles = DESIGN_STYLES.filter((style) => this.designs.some((d) => d.style === style.id));

  readonly lang = this.language.lang;
  readonly ui = computed(() => WEDDING_UI[this.lang()]);
  readonly copy = computed(() => buildWording(WEDDING_CONFIG, this.lang()));
  readonly dateBadge = computed(() => formatDateBadge(WEDDING_CONFIG, this.lang()));

  readonly activeForm = signal<Filter<CardForm>>('all');
  readonly activeStyle = signal<Filter<DesignStyle>>('all');

  readonly filteredDesigns = computed(() =>
    this.designs.filter((design) => this.matches(design, this.activeForm(), this.activeStyle())),
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

  setForm(form: Filter<CardForm>): void {
    this.activeForm.set(form);
  }

  setStyle(style: Filter<DesignStyle>): void {
    this.activeStyle.set(style);
  }

  resetFilters(): void {
    this.activeForm.set('all');
    this.activeStyle.set('all');
  }

  /** Designs a format chip would show, given the selected style. */
  formCount(form: Filter<CardForm>): number {
    return this.designs.filter((design) => this.matches(design, form, this.activeStyle())).length;
  }

  /** Designs a style chip would show, given the selected format. */
  styleCount(style: Filter<DesignStyle>): number {
    return this.designs.filter((design) => this.matches(design, this.activeForm(), style)).length;
  }

  formLabelFor(form: CardForm): string {
    return formLabel(form, this.lang());
  }

  styleLabelFor(style: DesignStyle): string {
    return styleLabel(style, this.lang());
  }

  private matches(design: InvitationDesign, form: Filter<CardForm>, style: Filter<DesignStyle>): boolean {
    return (form === 'all' || design.form === form) && (style === 'all' || design.style === style);
  }
}
