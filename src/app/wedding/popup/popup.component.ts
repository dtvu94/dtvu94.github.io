import { Component, HostBinding, Input } from '@angular/core';
import { InvitationCopy, InvitationDesign, PopupSpec } from '../data/wedding.types';
import { PopLayer, PopText, popupLayers } from '../geometry/popup-art';
import { STOCK_TEXTURE } from '../geometry/patterns';
import { invitationThemeStyle } from '../theme';

const layerCache = new Map<string, PopLayer[]>();

/**
 * Pop-up 3D — a card that opens along a horizontal fold (y = 280 on the
 * 400 × 560 open card). The top half stands up, the bottom half lies flat,
 * and cut-paper layers rise from the fold, one after another.
 */
@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css'],
  standalone: false,
})
export class PopupComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input() open = false;

  @HostBinding('attr.style')
  get hostStyle(): string {
    return invitationThemeStyle(this.design);
  }

  @HostBinding('class')
  get hostClass(): string {
    return `pp pp--${this.spec.scene} ${this.open ? 'pp--open' : 'pp--closed'}`;
  }

  get spec(): PopupSpec {
    // Designs of form 'popup' always carry a popup spec (see designs.spec.ts).
    return this.design.popup as PopupSpec;
  }

  get layers(): PopLayer[] {
    let layers = layerCache.get(this.design.id);
    if (!layers) {
      layers = popupLayers(this.spec.scene, this.design.palette);
      layerCache.set(this.design.id, layers);
    }
    return layers;
  }

  get texture(): string | null {
    return STOCK_TEXTURE[this.design.stock ?? 'smooth'] || null;
  }

  textOf(text: PopText): string {
    switch (text.content) {
      case 'date': {
        const [day, month] = this.copy.shortDate.split(' · ');
        return `${day}.${month}`;
      }
      case 'names':
        return this.copy.coupleLine;
      case 'monogram':
        return this.copy.monogram;
    }
  }

  /** Back layers rise first when opening and fold last when closing. */
  delay(index: number): string {
    const count = this.layers.length;
    return `${this.open ? 0.35 + index * 0.14 : (count - 1 - index) * 0.06}s`;
  }
}
