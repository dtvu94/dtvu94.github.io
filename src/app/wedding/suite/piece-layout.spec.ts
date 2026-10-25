import { INVITATION_DESIGNS, getDesignById } from '../data/designs';
import { FoldSpec, InvitationDesign } from '../data/wedding.types';
import { foldBounds } from '../folded/fold-geometry';
import { PieceLayout, pieceKind, pieceLayout, pieceTransform } from './piece-layout';
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

describe('piece layout (gallery preview)', () => {
  it('keeps a flat card exactly where it always rested in front of its envelope', () => {
    expect(pieceTransform(pieceLayout(design('press-cotton')))).toBe(
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

  it('keeps every piece inside the scene', () => {
    for (const d of INVITATION_DESIGNS) {
      for (const [x, y] of corners(pieceLayout(d))) {
        expect(x).toBeGreaterThanOrEqual(-8);
        expect(x).toBeLessThanOrEqual(SCENE_W + 8);
        expect(y).toBeGreaterThanOrEqual(-8);
        expect(y).toBeLessThanOrEqual(SCENE_H + 8);
      }
    }
  });

  it('frames folded cards by their real on-screen bounds', () => {
    const fold = (variant: FoldSpec['variant']): FoldSpec => ({ variant, inside: ['photo', 'invite', 'calendar'], cover: 'announce' });
    expect(foldBounds(fold('bifold'), 'closed')).toEqual({ ox: 0, oy: 0, w: 400, h: 560 });
    // Laid flat, every panel side by side at full size.
    expect(foldBounds(fold('bifold'), 'flat')).toEqual({ ox: -400, oy: 0, w: 800, h: 560 });
    expect(foldBounds(fold('gatefold'), 'flat')).toEqual({ ox: -200, oy: 0, w: 800, h: 560 });
    expect(foldBounds(fold('accordion'), 'flat')).toEqual({ ox: -400, oy: 0, w: 1200, h: 560 });
    // Ajar, a lifted cover looms a little larger than the card.
    expect(foldBounds(fold('bifold'), 'ajar').h).toBeGreaterThan(560);
  });
});
