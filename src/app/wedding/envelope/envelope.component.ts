import { Component, HostBinding, Input } from '@angular/core';
import { EnvelopeArt, EnvelopeLabel, EnvelopeOpening, EnvelopePrint, EnvelopeSpec, InvitationCopy, InvitationDesign } from '../data/wedding.types';
import { HEART_FLOURISH_BOX, cornerSpray, curlFrame, drawnBow, fern, heartFlourish, lotusPrint, waxSealPath } from '../geometry/envelope-art';
import { Motif, mergeMotifs } from '../geometry/motifs';
import { linerBackground, STOCK_TEXTURE } from '../geometry/patterns';
import { RoseSpray, roseSpray } from '../geometry/rose-spray';
import { ENV_H, EnvelopeGeometry, envelopeLayout, envelopeOpening, envelopeSize } from '../geometry/shapes';
import { svgRef, uniqueSvgId } from '../relief/svg-ref';
import { invitationThemeStyle } from '../theme';

/**
 * One physical layer of the envelope. Seen from the back, the suite
 * interleaves the card between back panel, pocket and flap; the front is a
 * face of its own.
 */
export type EnvelopeLayer =
  /** Inside of the back panel, with the liner showing at the top. */
  | 'back'
  /** Back of the envelope: side and bottom flaps glued into a pocket (seams only). */
  | 'pocket'
  /** The top flap, hinged at the top edge: outside face + lined inside face. */
  | 'flap'
  /** Front of the envelope: the guest line ("Kính mời: …"), the couple and the print. */
  | 'front';

const geometryCache = new Map<string, EnvelopeGeometry>();

/** Where the art sits on the front, as fractions of the envelope height. */
const ART_Y: Record<EnvelopeArt, number> = { none: 0.42, fern: 0.42, frame: 0.36, florals: 0.42, lotus: 0.32 };

/** Front decoration and wording of the designs that set only `print`. */
const PRINT_PARTS: Record<EnvelopePrint, { art: EnvelopeArt; label: EnvelopeLabel }> = {
  none: { art: 'none', label: 'none' },
  names: { art: 'none', label: 'names' },
  namesHeart: { art: 'none', label: 'namesHeart' },
  fern: { art: 'fern', label: 'title' },
  frame: { art: 'frame', label: 'names' },
  florals: { art: 'florals', label: 'names' },
  lotus: { art: 'lotus', label: 'names' },
};

/** Decoration and wording of an envelope front: set apart, or from `print`. */
export function envelopeFront(spec: EnvelopeSpec): { art: EnvelopeArt; label: EnvelopeLabel } {
  const parts = PRINT_PARTS[spec.print];
  return { art: spec.art ?? parts.art, label: spec.label ?? parts.label };
}

/** A rose spray for one side, drawn for one envelope width. */
interface RoseSide {
  key: string;
  art: RoseSpray;
  /** Scales the spray down on short envelopes, about its outer top corner. */
  transform: string | null;
}

const roseCache = new Map<string, RoseSide[]>();

/** Both sprays for a w × h front: sized for 330 px tall, scaled to fit shorter ones. */
function roseSides(w: number, h: number, round: boolean): RoseSide[] {
  const key = `${w}x${h}${round ? 'o' : ''}`;
  let sides = roseCache.get(key);
  if (!sides) {
    const k = Math.min(1, h / ENV_H);
    // Taller fronts keep the sprays at full size, a little lower down.
    const dy = h > ENV_H ? (h - ENV_H) * 0.35 : 0;
    // A round front: smaller sprays, moved in from the edge to stay on the circle.
    const cy = h / 2;
    const at = (x: number) =>
      round
        ? `translate(${x === 0 ? 30 : w - 30} ${cy}) scale(0.72) translate(${-x} ${-cy})`
        : k === 1 && !dy
          ? null
          : `translate(${x} ${dy}) scale(${k}) translate(${-x} 0)`;
    sides = [
      { key: 'left', art: roseSpray(w, false, 7), transform: at(0) },
      { key: 'right', art: roseSpray(w, true, 11), transform: at(w) },
    ];
    roseCache.set(key, sides);
  }
  return sides;
}

/**
 * One layer of a design's matching envelope, drawn at ENV_W × ENV_H design
 * pixels. Shapes come from geometry/shapes.ts as clip-paths over textured
 * paper; art is inline SVG; the flap swings open in 3-D.
 */
const HEART = heartFlourish();

@Component({
  selector: 'app-envelope',
  templateUrl: './envelope.component.html',
  styleUrls: ['./envelope.component.css'],
  standalone: false,
})
export class EnvelopeComponent {
  @Input({ required: true }) design!: InvitationDesign;
  @Input({ required: true }) copy!: InvitationCopy;
  @Input() layer: EnvelopeLayer = 'pocket';
  @Input() open = false;

  readonly foilId = uniqueSvgId('env-foil');
  /** The drawn heart between the names on a "namesHeart" front. */
  readonly heartPath = HEART;
  readonly heartBox = `0 0 ${HEART_FLOURISH_BOX.w} ${HEART_FLOURISH_BOX.h}`;
  readonly foilRef = svgRef(this.foilId);
  readonly waxId = uniqueSvgId('env-wax');
  readonly waxRef = svgRef(this.waxId);

  @HostBinding('class')
  get hostClass(): string {
    return `env env--${this.layer}${this.spec.vellum ? ' env--vellum' : ''}${this.open ? ' env--open' : ''}`;
  }

  /** Fonts from the design; paper, ink and size of the envelope itself. */
  @HostBinding('attr.style')
  get hostStyle(): string {
    return (
      `${invitationThemeStyle(this.design)};--env-paper:${this.spec.paper};--env-ink:${this.spec.ink}` +
      `;width:${this.w}px;height:${this.h}px`
    );
  }

  get spec(): EnvelopeSpec {
    return this.design.envelope;
  }

  get w(): number {
    return envelopeSize(this.spec).w;
  }

  get h(): number {
    return envelopeSize(this.spec).h;
  }

  /** The front's decoration (`art`) and wording (`label`). */
  get front(): { art: EnvelopeArt; label: EnvelopeLabel } {
    return envelopeFront(this.spec);
  }

  /** Baby-rose sprays for both sides of the front. */
  get roseSides(): RoseSide[] {
    return roseSides(this.w, this.h, this.isRound);
  }

  get isRound(): boolean {
    return this.spec.size === 'round';
  }

  get opening(): EnvelopeOpening {
    return envelopeOpening(this.spec);
  }

  /** Sleeves and open pockets have no flap (and so no seal). */
  get hasFlap(): boolean {
    return !!this.geo.flap;
  }

  /** Clip for a body that is not a plain rectangle (round, notched sleeve). */
  get bodyClip(): string | null {
    return this.geo.body ? `path('${this.geo.body}')` : null;
  }

  /** Sleeve: the card (and its pull ribbon) seen through the thumb notch. */
  get peek(): { left: number; top: number; width: number; height: number } | null {
    const n = this.geo.notch;
    return n ? { left: n.x - n.r - 8, top: n.y - n.r - 10, width: n.r + 8, height: 2 * n.r + 20 } : null;
  }

  get geo(): EnvelopeGeometry {
    const key = `${this.spec.flap}|${this.spec.size ?? 'standard'}|${this.spec.opening ?? 'flap'}`;
    let geo = geometryCache.get(key);
    if (!geo) {
      geo = envelopeLayout(this.spec);
      geometryCache.set(key, geo);
    }
    return geo;
  }

  get flapClip(): string {
    return `path('${this.geo.flap}')`;
  }

  get pocketClip(): string {
    return `path('${this.geo.pocket}')`;
  }

  get texture(): string | null {
    return STOCK_TEXTURE[this.spec.stock ?? 'smooth'] || null;
  }

  get liner(): string {
    const [bg, ink] = this.spec.linerColors ?? [this.design.palette.surface, this.design.palette.accent];
    return linerBackground(this.spec.liner, bg, ink);
  }

  get hasLiner(): boolean {
    return this.spec.liner !== 'none';
  }

  get edge(): string {
    return this.spec.edge ?? 'transparent';
  }

  get sealColor(): string {
    return this.spec.sealColor ?? this.design.palette.accent;
  }

  /** Where the decoration sits, in envelope pixels. */
  get printY(): number {
    return ART_Y[this.front.art] * this.h;
  }

  /** Line art for the decoration, in envelope pixels. */
  get printArt(): Motif | null {
    const { w, h } = this;
    const cx = w / 2;
    switch (this.front.art) {
      case 'fern':
        return mergeMotifs(fern({ x: w - 70, y: h - 14 }, -1.85, 150, 0.35), fern({ x: w - 58, y: h - 16 }, -1.45, 112, -0.3));
      case 'frame':
        return curlFrame(cx - 128, h * 0.14, 256, h * 0.46);
      case 'florals':
        return mergeMotifs(cornerSpray({ x: 6, y: h - 6 }, -0.75, 96, 3), cornerSpray({ x: w - 6, y: h - 6 }, -2.4, 96, 8));
      case 'lotus':
        return lotusPrint({ x: cx, y: this.printY }, 30);
      default:
        return null;
    }
  }

  get showsNames(): boolean {
    return this.front.label === 'names' || this.front.label === 'logoNames';
  }

  get showsLogo(): boolean {
    return this.front.label === 'logo' || this.front.label === 'logoNames';
  }

  /** "28.03.2027" (Buddhist year in Thai), under the names on a "namesHeart" front. */
  get dotDate(): string {
    return this.copy.shortDate.split(' · ').join('.');
  }

  /** Below a lotus or inside a frame, the wording moves down; else mid-front. */
  private get labelSlot(): number | null {
    const { art } = this.front;
    return art === 'lotus' ? 0.56 : art === 'frame' ? 0.45 : null;
  }

  get namesY(): number {
    const slot = this.labelSlot;
    if (this.front.label === 'logoNames') {
      return (slot ?? 0.52) * this.h;
    }
    return (slot ?? (this.front.art === 'florals' ? 0.42 : 0.44)) * this.h;
  }

  get heartY(): number {
    const slot = this.labelSlot;
    return (slot === null ? 0.42 : slot + 0.02) * this.h;
  }

  /** The logo alone mid-front, or above the names. */
  get logoY(): number {
    return this.front.label === 'logoNames' ? this.namesY - 58 : (this.labelSlot ?? 0.42) * this.h;
  }

  /** A coloured edge band on the front, matching the flap's edge (drawn as a ring on a round one). */
  get edgeShadow(): string | null {
    return this.spec.edge && !this.isRound ? `inset 0 0 0 6px ${this.spec.edge}` : null;
  }

  get waxPath(): string {
    const { x, y } = this.geo.sealAt;
    return waxSealPath({ x, y }, this.spec.seal === 'bow' ? 17 : 27);
  }

  get bowPath(): string {
    return drawnBow(this.geo.sealAt, 46);
  }

  get twineY(): number {
    return this.h * 0.66;
  }
}
