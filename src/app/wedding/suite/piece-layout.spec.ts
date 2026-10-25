import { INVITATION_DESIGNS, getDesignById } from '../data/designs';
import { FoldSpec, InvitationDesign } from '../data/wedding.types';
import { foldBounds } from '../folded/fold-geometry';
import { PieceLayout, SuiteState, pieceKind, pieceLayout, piecePoses, pieceTransform } from './piece-layout';
import { SCENE_H, SCENE_W } from './suite.component';

const design = (id: string) => getDesignById(id) as InvitationDesign;

/** Screen-space corners of the piece's box after its transform. */
function corners({ box, place }: PieceLayout): Array<[number, number]> {
  const a = (place.r * Math.PI) / 180;
  const cx = box.ox + box.w / 2;
  const cy = box.oy + box.h / 2;
  return [
    [box.ox, box.oy],
    [box.ox + box.w, box.oy],
    [box.ox, box.oy + box.h],
    [box.ox + box.w, box.oy + box.h],
  ].map(([x, y]) => {
    const dx = (x - cx) * place.s;
    const dy = (y - cy) * place.s;
    return [place.cx + dx * Math.cos(a) - dy * Math.sin(a), place.cy + dx * Math.sin(a) + dy * Math.cos(a)];
  });
}

describe('piece layout', () => {
  it('keeps a flat card exactly where it always rested in front of its envelope', () => {
    expect(pieceTransform(pieceLayout(design('press-cotton'), 'out', false))).toBe(
      'translate(396px, 512px) rotate(3deg) scale(1) translate(-200px, -280px)',
    );
  });

  it('tells pieces apart by form', () => {
    expect(pieceKind(design('press-cotton'))).toBe('card');
    expect(pieceKind(design('modern-sage'))).toBe('pocket');
    expect(pieceKind(design('fold-red-bifold'))).toBe('folded');
    expect(pieceKind(design('pop-meadow'))).toBe('popup');
    expect(pieceKind(design('passport-red'))).toBe('passport');
  });

  it('shuts everything inside the envelope and previews a hint of the inside in the gallery', () => {
    expect(piecePoses('sealed', true)).toEqual({ fold: 'closed', popupOpen: false, passport: 'closed' });
    expect(piecePoses('out', true)).toEqual({ fold: 'closed', popupOpen: false, passport: 'peek' });
    expect(piecePoses('out', false)).toEqual({ fold: 'ajar', popupOpen: true, passport: 'peek' });
    expect(piecePoses('unfolded', true)).toEqual({ fold: 'open', popupOpen: true, passport: 'open' });
  });

  it('fits every piece upright inside the envelope, then raises its foot clear of the pocket', () => {
    for (const d of INVITATION_DESIGNS) {
      const sealed = pieceLayout(d, 'sealed', true);
      expect(sealed.place.s).toBe(1);
      expect(sealed.place.r).toBe(0);
      expect(sealed.box.w).toBeLessThanOrEqual(470 - 20);
      expect(sealed.place.cy - sealed.box.h / 2).toBe(414);
      const opened = pieceLayout(d, 'opened', true);
      expect(opened.place.cy + opened.box.h / 2).toBe(565);
      expect(opened.place.cx).toBe(sealed.place.cx);
    }
  });

  it.each<[SuiteState, boolean]>([
    ['out', false],
    ['out', true],
    ['unfolded', true],
  ])('keeps every piece inside the scene (%s, interactive %s)', (state, interactive) => {
    for (const d of INVITATION_DESIGNS) {
      for (const [x, y] of corners(pieceLayout(d, state, interactive))) {
        expect(x).toBeGreaterThanOrEqual(-8);
        expect(x).toBeLessThanOrEqual(SCENE_W + 8);
        expect(y).toBeGreaterThanOrEqual(-8);
        expect(y).toBeLessThanOrEqual(SCENE_H + 8);
      }
    }
  });

  it('frames an opened folded card by its spread', () => {
    const fold = (variant: FoldSpec['variant']): FoldSpec => ({ variant, inside: ['photo', 'invite', 'calendar'], cover: 'announce' });
    expect(foldBounds(fold('bifold'), 'closed')).toEqual({ ox: 0, oy: 0, w: 400, h: 560 });
    const bifold = foldBounds(fold('bifold'), 'open');
    expect(bifold.ox).toBeLessThanOrEqual(-400);
    expect(bifold.ox + bifold.w).toBeGreaterThanOrEqual(400);
    const gate = foldBounds(fold('gatefold'), 'open');
    expect(gate.ox).toBeLessThanOrEqual(-200);
    expect(gate.ox + gate.w).toBeGreaterThanOrEqual(600);
    // Zig-zag panels lean towards / away from the viewer: wider than two pages.
    expect(foldBounds(fold('accordion'), 'open').w).toBeGreaterThan(1000);
    // Ajar, a lifted cover looms a little larger than the card.
    expect(foldBounds(fold('bifold'), 'ajar').h).toBeGreaterThan(560);

    const spread = pieceLayout(design('fold-blush-zigzag'), 'unfolded', true);
    expect(spread.place.s).toBeLessThan(0.6);
  });
});
