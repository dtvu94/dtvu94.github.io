import { CardShape, ReliefMotif } from '../data/wedding.types';
import { Motif, blossomBranch, laurelWreath, lotusRow, mergeMotifs, pearlRing, vine } from './motifs';
import { Track } from './path-kit';
import { CARD_H, CARD_W } from './shapes';

/**
 * Relief border art for a 400 × 560 card, fitted to the card's die-cut
 * silhouette so a vine follows an oval or arch instead of a rectangle.
 */

function frameTrack(shape: CardShape, inset: number): Track {
  const cx = CARD_W / 2;
  const cy = CARD_H / 2;
  switch (shape) {
    case 'oval':
    case 'doily':
      return Track.ellipse({ x: cx, y: cy }, cx - inset - (shape === 'doily' ? 22 : 4), cy - inset - (shape === 'doily' ? 22 : 4));
    case 'archTop': {
      const r = cx - inset;
      const top = 200;
      return Track.build(
        { x: inset, y: CARD_H - inset },
        [
          { kind: 'line', to: { x: inset, y: top } },
          { kind: 'arc', center: { x: cx, y: top }, radius: r, start: Math.PI, end: 2 * Math.PI },
          { kind: 'line', to: { x: CARD_W - inset, y: CARD_H - inset } },
          { kind: 'line', to: { x: inset, y: CARD_H - inset } },
        ],
        true,
      );
    }
    case 'scallop':
    case 'cloud':
      return Track.roundedRect(inset + 16, inset + 16, CARD_W - 2 * (inset + 16), CARD_H - 2 * (inset + 16), 26);
    default:
      return Track.roundedRect(inset, inset, CARD_W - 2 * inset, CARD_H - 2 * inset, 30);
  }
}

function build(motif: ReliefMotif, shape: CardShape): Motif {
  switch (motif) {
    case 'vineFrame':
      return vine(frameTrack(shape, 24), {
        pitch: 19,
        leafLength: 19,
        leafWidth: 7,
        blossomEvery: 4,
        blossomRadius: 11,
        wave: 6,
        waveLength: 58,
        stemWidth: 2.2,
        seed: 11,
        tendrils: 0.22,
      });
    case 'branches':
      // Two sprays hugging opposite corners: each stem runs close along two
      // edges with its twigs turned outwards, so the copy in between stays
      // clear in every language (footprint checked in shapes.spec.ts).
      return mergeMotifs(
        blossomBranch({ x: -6, y: 162 }, { x: 24, y: 92 }, { x: 66, y: 40 }, { x: 172, y: 26 }, {
          width: 6.5,
          blossomRadius: 11,
          twigs: [0.28, 0.52, 0.76],
          seed: 4,
          blossoms: 2,
          twigLength: 0.2,
          side: -1,
        }),
        blossomBranch({ x: 406, y: 412 }, { x: 378, y: 480 }, { x: 336, y: 530 }, { x: 226, y: 538 }, {
          width: 6.5,
          blossomRadius: 11,
          twigs: [0.28, 0.52, 0.76],
          seed: 9,
          blossoms: 2,
          twigLength: 0.2,
          side: -1,
        }),
      );
    case 'lotusBorder':
      return lotusRow(34, CARD_W - 34, CARD_H - 22, 62, 5);
    case 'pearlBorder':
      return pearlRing(frameTrack(shape, 18), 11, 2.6);
  }
}

const cache = new Map<string, Motif>();

export function reliefArt(motif: ReliefMotif, shape: CardShape): Motif {
  const key = `${motif}|${shape}`;
  let art = cache.get(key);
  if (!art) {
    art = build(motif, shape);
    cache.set(key, art);
  }
  return art;
}

/** Laurel crest art in a 100 × 100 box (ornament slot). */
export const LAUREL_CREST: Motif = laurelWreath({ x: 50, y: 52 }, 40, { leaves: 8, berries: true, seed: 5 });
