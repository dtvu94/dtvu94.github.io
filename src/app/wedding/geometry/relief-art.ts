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
      return mergeMotifs(
        blossomBranch({ x: -8, y: 132 }, { x: 40, y: 86 }, { x: 76, y: 40 }, { x: 176, y: 22 }, {
          width: 7,
          blossomRadius: 12,
          twigs: [0.3, 0.55, 0.78],
          seed: 4,
          blossoms: 2,
        }),
        blossomBranch({ x: 408, y: 430 }, { x: 362, y: 476 }, { x: 330, y: 520 }, { x: 222, y: 542 }, {
          width: 7,
          blossomRadius: 12,
          twigs: [0.3, 0.55, 0.78],
          seed: 9,
          blossoms: 2,
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
