import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { formLabel, styleLabel } from '../data/categories';
import { getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { GUEST_PARAM, WEDDING_UI } from '../data/ui-strings';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign } from '../data/wedding.types';
import { CARD_H, CARD_W } from '../geometry/shapes';
import { LanguageService } from '../language.service';
import { PaperPiece, paperPieces } from '../paper/paper-suite.component';
import { isDarkColor } from '../theme';
import { ZoomItem } from '../zoom/zoom-viewer.component';
import {
  TypeSpecPiece,
  TypeSpecRow,
  facesUsed,
  isScriptFace,
  mainPiece,
  measureTypography,
  pxToMm,
  pxToPt,
} from './type-spec';

/** Weight names as type foundries and print shops use them. */
const WEIGHT_NAMES: Record<number, string> = {
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
};

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

/** What the zoom viewer can show on this page: a printed piece, or the online card (no `piece`). */
export interface DetailZoomItem extends ZoomItem {
  piece?: PaperPiece;
}

/**
 * One design, in two parts: the printed suite laid out flat (envelope front
 * and back, the invitation, the directions card), then the online
 * invitation — no envelope, optionally addressed to a guest via ?khach= —
 * beside the directions guide. The page URL (/wedding/:id) is the "share
 * this design" link. Any piece, and the online card, opens in the zoom
 * viewer for a close look.
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
  private readonly injector = inject(Injector);

  @ViewChild('paperSection') private paperSection?: ElementRef<HTMLElement>;

  readonly lang = this.language.lang;
  readonly ui = computed(() => WEDDING_UI[this.lang()]);
  readonly design = signal<InvitationDesign | null>(null);
  readonly copy = computed(() => buildWording(WEDDING_CONFIG, this.lang()));
  /** Guest's name from the link, for the online card. */
  readonly guest = signal('');
  /** The printed pieces in layout order, then the online card. */
  readonly zoomItems = computed<DetailZoomItem[]>(() => {
    const design = this.design();
    if (!design) {
      return [];
    }
    const ui = this.ui();
    return [
      ...paperPieces(design).map((piece) => ({ key: piece.kind, label: ui.paperLabels[piece.kind], w: piece.w, h: piece.h, piece })),
      { key: 'online', label: ui.onlineTitle, w: CARD_W, h: CARD_H },
    ];
  });
  /** Item shown in the zoom viewer, or null when it is closed. */
  readonly zoomIndex = signal<number | null>(null);
  /** Fonts and sizes of the printed pieces, measured once they are drawn. */
  readonly typeSpec = signal<TypeSpecPiece[]>([]);
  readonly faces = computed(() => facesUsed(this.typeSpec()));
  readonly openPiece = computed(() => mainPiece(this.typeSpec()));

  constructor() {
    effect(() => {
      const design = this.design();
      if (design) {
        this.title.setTitle(`${design.nameVi} — ${this.ui().detailTitleSuffix}`);
      }
    });
    // Re-measure the type whenever the pieces are redrawn (design, language).
    effect(() => {
      this.design();
      this.lang();
      afterNextRender(() => this.measureType(), { injector: this.injector });
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

  /** Number in the page's language ("41,4" in Vietnamese). */
  num(value: number): string {
    return new Intl.NumberFormat(this.lang(), { maximumFractionDigits: 1 }).format(value);
  }

  pt(px: number): string {
    return this.num(pxToPt(px));
  }

  mm(px: number): string {
    return this.num(pxToMm(px));
  }

  readonly isScript = isScriptFace;

  /** "SemiBold 600 · in hoa · giãn chữ 0,3em" */
  styleOf(row: TypeSpecRow): string {
    const strings = this.ui().typeSpec;
    const weight = WEIGHT_NAMES[row.weight] ?? '';
    return [
      `${weight} ${row.weight}`.trim(),
      row.italic ? strings.italic : '',
      row.upper ? strings.upper : '',
      row.tracking ? `${strings.tracking} ${this.num(row.tracking)}em` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  private measureType(): void {
    const root = this.paperSection?.nativeElement;
    if (root) {
      this.typeSpec.set(measureTypography(root));
    }
  }

  openZoom(index: number): void {
    this.zoomIndex.set(index);
  }

  print(): void {
    window.print();
  }
}
