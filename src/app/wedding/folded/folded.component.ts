import { Component, HostBinding, Input } from '@angular/core';
import { FoldSpec, InvitationCopy, InvitationDesign, PanelKind } from '../data/wedding.types';
import { FoldPose, Leaf, LeafBack, PANEL_H, leavesFor } from './fold-geometry';
import { invitationThemeStyle } from '../theme';

/**
 * Thiệp gấp — a folded card in 3-D: the centre panel stays put and the
 * leaves swing on their hinges between closed, ajar (gallery) and open.
 */
@Component({
  selector: 'app-folded',
  templateUrl: './folded.component.html',
  styleUrls: ['./folded.component.css'],
  standalone: false,
})
export class FoldedComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input() pose: FoldPose = 'closed';

  readonly panelHeight = PANEL_H;

  @HostBinding('attr.style')
  get hostStyle(): string {
    return invitationThemeStyle(this.design);
  }

  @HostBinding('class')
  get hostClass(): string {
    return `fd fd--${this.fold.variant} fd--${this.pose}`;
  }

  get fold(): FoldSpec {
    // Designs of form 'folded' always carry a fold spec (see designs.spec.ts).
    return this.design.fold as FoldSpec;
  }

  /** The fixed panel: second of the inside panels (bifold: the right page). */
  get centre(): PanelKind {
    return this.fold.inside[1] ?? this.fold.inside[0];
  }

  get leaves(): Leaf[] {
    return leavesFor(this.fold);
  }

  leafLeft(leaf: Leaf): number {
    return leaf.side === 'left' ? -leaf.width : 400;
  }

  leafOrigin(leaf: Leaf): string {
    return leaf.side === 'left' ? '100% 50%' : '0 50%';
  }

  leafTransform(leaf: Leaf): string {
    return `rotateY(${leaf.angles[this.pose]}deg) translateZ(${leaf.nudge}px)`;
  }

  /** The cover face is split down the middle across the two gate doors. */
  coverOffset(back: LeafBack): number {
    return back === 'coverRight' ? -200 : 0;
  }

  isPanel(back: LeafBack): back is PanelKind {
    return back !== 'coverLeft' && back !== 'coverRight' && back !== 'blank';
  }
}
