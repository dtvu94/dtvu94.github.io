import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { PaperPiece } from '../paper/paper-suite.component';
import { Sticker, StickerFace } from './editor-state';

/** Bleed beyond the trim, and the margin round it that holds the crop marks. */
export const BLEED_MM = 3;
export const MARGIN_MM = 10;

/** One page of the print-ready PDF: a piece at print size, its bleed and crop marks. */
export interface PrintPage {
  piece: PaperPiece;
  face: StickerFace | null;
  title: string;
  /** Trim size and page size, mm. */
  w: number;
  h: number;
  pageW: number;
  pageH: number;
  /** Colour carried into the bleed (rectangular pieces), or null for die-cut ones. */
  bleed: string | null;
  /** Crop marks, as SVG path data in mm. */
  marks: string;
}

/**
 * Bản in PDF: every piece at its print size (80 design px = 1 inch) on a
 * page of its own, the paper colour carried 3 mm past the trim, and crop
 * marks in the margin. The browser's print dialog saves it as a PDF; while
 * open, a print stylesheet gives each page its own size and hides the rest
 * of the editor.
 */
@Component({
  selector: 'app-editor-print',
  templateUrl: './editor-print.component.html',
  styleUrls: ['./editor-print.component.css'],
  standalone: false,
})
export class EditorPrintComponent implements OnInit, OnDestroy {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input({ required: true }) pages!: PrintPage[];
  @Input() stickers: Sticker[] = [];
  @Output() readonly closed = new EventEmitter<void>();

  readonly bleedMm = BLEED_MM;
  readonly marginMm = MARGIN_MM;

  private readonly document = inject(DOCUMENT);
  private style?: HTMLStyleElement;

  ngOnInit(): void {
    const style = this.document.createElement('style');
    style.textContent = this.printCss();
    this.document.head.appendChild(style);
    this.style = style;
  }

  ngOnDestroy(): void {
    this.style?.remove();
  }

  print(): void {
    const fonts = (this.document as Document & { fonts?: FontFaceSet }).fonts;
    void (fonts ? fonts.ready : Promise.resolve()).then(() => this.document.defaultView?.print());
  }

  /** One named page per piece, each at its own size; everything else hidden. */
  private printCss(): string {
    const pages = this.pages.map((page, i) => `@page ed${i}{size:${page.pageW}mm ${page.pageH}mm;margin:0}.ed-print__page--${i}{page:ed${i}}`).join('');
    return (
      '@media print{html,body{background:#fff!important;margin:0!important}' +
      'app-wedding-editor{min-height:0!important;background:none!important}.ed{padding:0!important;max-width:none!important}' +
      '.ed__head,.ed__body,.ed-print__bar,.ed-print__hint{display:none!important}' +
      '.ed-print{position:static!important;background:none!important;padding:0!important;overflow:visible!important}' +
      '.ed-print__pages{display:block!important;padding:0!important}' +
      '.ed-print__page{box-shadow:none!important;margin:0!important;break-after:page}' +
      '.ed-print__page:last-child{break-after:auto}' +
      `.ed-print .stage__art{filter:none!important}${pages}}`
    );
  }
}
