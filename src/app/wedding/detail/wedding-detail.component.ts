import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { formLabel, styleLabel } from '../data/categories';
import { getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { GUEST_PARAM, WEDDING_UI } from '../data/ui-strings';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign } from '../data/wedding.types';
import { LanguageService } from '../language.service';
import { isDarkColor } from '../theme';

/** Longest guest name printed on the online card. */
const GUEST_MAX = 60;

/**
 * Cleans a guest name from the link (?khach=…): collapses whitespace, drops
 * control characters, caps the length. Angular escapes it when printed.
 */
export function guestName(raw: string | null): string {
  if (!raw) {
    return '';
  }
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, GUEST_MAX);
}

/**
 * One design, in two parts: the printed suite laid out flat (envelope front
 * and back, the invitation, the directions card), then the online
 * invitation — no envelope, optionally addressed to a guest via ?khach= —
 * beside the directions guide. The page URL (/wedding/:id) is the "share
 * this design" link.
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
  /** Guest's name from the link, for the online card. */
  readonly guest = signal('');

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
    this.guest.set(guestName(this.route.snapshot.queryParamMap.get(GUEST_PARAM)));
    // Private family page — keep it out of search engines.
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="robots"');
  }

  /** "Dập chìm nổi · Cổ điển" */
  categoryLabel(design: InvitationDesign): string {
    return `${formLabel(design.form, this.lang())} · ${styleLabel(design.style, this.lang())}`;
  }

  get isDark(): boolean {
    const design = this.design();
    return design !== null && isDarkColor(design.palette.bg);
  }

  /** Example personalised link shown to the couple. */
  guestExample(design: InvitationDesign): string {
    return `${location.origin}/wedding/${design.id}?${GUEST_PARAM}=Anh Minh`;
  }

  print(): void {
    window.print();
  }
}
