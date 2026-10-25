import { Component, HostBinding, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign, PocketSpec } from '../data/wedding.types';
import { drawnBow, waxSealPath } from '../geometry/envelope-art';
import { STOCK_TEXTURE } from '../geometry/patterns';
import { CARD_H, CARD_W, SLEEVE_H, SLEEVE_W, WindowGeometry, lowerPocketPath, sleevePath, sleeveWindow } from '../geometry/shapes';
import { invitationThemeStyle } from '../theme';

/** Wave top of the lower pocket, in card pixels. */
const LOWER_POCKET_TOP = 318;

/**
 * Thiệp rút & túi — constructions that hold the invitation:
 * - sleeve: a window sleeve the card slides up out of,
 * - lowerPocket: an announcement card whose lower pocket holds the invite,
 * - vellumWrap: a vellum jacket folded over the card, tied and sealed,
 * - bellyBand: a paper band round the card.
 * `out` is the opened state (card drawn out, jacket opened, band slid off).
 */
@Component({
  selector: 'app-pocket',
  templateUrl: './pocket.component.html',
  styleUrls: ['./pocket.component.css'],
  standalone: false,
})
export class PocketComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input() out = false;
  /** Set once the viewer has interacted, so closing animates too (never on first paint). */
  @Input() animate = false;
  /** Gallery pose: the sleeve's card peeks out above it. */
  @Input() pulled = false;

  readonly sleeveW = SLEEVE_W;
  readonly sleeveH = SLEEVE_H;
  readonly cardW = CARD_W;
  readonly cardH = CARD_H;
  readonly lowerTop = LOWER_POCKET_TOP;

  @HostBinding('attr.style')
  get hostStyle(): string {
    const rest = this.pulled ? -150 : 0;
    return `${invitationThemeStyle(this.design)};--pk-paper:${this.spec.paper};--pk-ink:${this.spec.ink};--pk-rest:${rest}px`;
  }

  @HostBinding('class')
  get hostClass(): string {
    return `pk pk--${this.spec.variant}${this.out ? ' pk--out' : ''}${this.animate ? ' pk--anim' : ''}`;
  }

  /** Vertical rhythm of the sleeve print round its window. */
  get sleeveText(): { title: number; names: number; date: number } {
    const box = this.window?.box;
    if (!box) {
      return { title: 150, names: 270, date: 318 };
    }
    return { title: Math.max(56, box.y - 54), names: box.y + box.h + 50, date: box.y + box.h + 94 };
  }

  get spec(): PocketSpec {
    // Designs of form 'pocket' always carry a pocket spec (see designs.spec.ts).
    return this.design.pocket as PocketSpec;
  }

  /** The design as printed on the insert card (its own colours, if any). */
  get insertDesign(): InvitationDesign {
    const override = this.spec.insert;
    // Lower-pocket inserts are plain rounded cards whatever the main card's cut.
    const reshape = this.spec.variant === 'lowerPocket';
    if (!override && !reshape) {
      return this.design;
    }
    if (this.insertCache?.source !== this.design) {
      this.insertCache = {
        source: this.design,
        value: {
          ...this.design,
          palette: { ...this.design.palette, ...override },
          shape: reshape ? 'rounded' : this.design.shape,
        },
      };
    }
    return this.insertCache.value;
  }

  private insertCache?: { source: InvitationDesign; value: InvitationDesign };

  get texture(): string | null {
    return STOCK_TEXTURE[this.spec.stock ?? 'smooth'] || null;
  }

  get sleeveClip(): string {
    return `path(evenodd, '${sleevePath(this.spec.window ?? 'none')}')`;
  }

  get window(): WindowGeometry | null {
    return sleeveWindow(this.spec.window ?? 'none');
  }

  /** Louvred shutter panels either side of the window. */
  get shutters(): { left: string; right: string; slats: string } | null {
    const win = this.window;
    if (this.spec.window !== 'shutters' || !win) {
      return null;
    }
    const { x, y, w, h } = win.box;
    const top = y + w / 2;
    const sw = w * 0.42;
    const left = `M${x} ${top}L${x - sw} ${top - 12}V${y + h + 12}L${x} ${y + h}Z`;
    const right = `M${x + w} ${top}L${x + w + sw} ${top - 12}V${y + h + 12}L${x + w} ${y + h}Z`;
    let slats = '';
    for (let yy = top + 8; yy < y + h; yy += 9) {
      const t = (yy - top) / (y + h - top);
      const skew = 12 * (1 - t) - 12 * t;
      slats += `M${x - 4} ${yy}L${x - sw + 4} ${yy - skew * 0.5}`;
      slats += `M${x + w + 4} ${yy}L${x + w + sw - 4} ${yy - skew * 0.5}`;
    }
    return { left, right, slats };
  }

  /** Window frame with a cross mullion in the arch. */
  get windowFrame(): string | null {
    const win = this.window;
    // Plain outline for simple windows and for a photo in the window (no mullions across faces).
    if (!win || this.spec.window === 'rect' || this.spec.window === 'circle' || this.spec.windowPhoto) {
      return win ? win.d : null;
    }
    const { x, y, w } = win.box;
    const spring = y + w / 2;
    return `${win.d}M${x + w / 2} ${y}V${spring}M${x} ${spring}H${x + w}`;
  }

  get lowerPocketClip(): string {
    return `path('${lowerPocketPath(LOWER_POCKET_TOP)}')`;
  }

  /** Ribbon bow and seal on the vellum jacket's edge. */
  get vellumBow(): string {
    return drawnBow({ x: 288, y: 300 }, 58);
  }

  get vellumSeal(): string {
    return waxSealPath({ x: 288, y: 300 }, 26, 9);
  }
}
