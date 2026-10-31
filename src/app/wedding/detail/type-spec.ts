import { PaperPieceKind } from '../data/ui-strings';

/**
 * Typography sheet for the printer: which face and size every line of a
 * design's printed pieces uses, measured from the rendered page, so it can
 * never drift from what is shown.
 */

/** One distinct type style on a piece, with the copy that uses it. */
export interface TypeSpecRow {
  /** Copy set in this style ("Vũ & Thảo", "Tại Sảnh Danube · …"). */
  sample: string;
  /** Face that draws it (first font of the stack that has the glyphs). */
  font: string;
  /** Full CSS stack, to show the sample in its own face. */
  stack: string;
  /** Size in design pixels (card 400 × 560). For the logo: its height. */
  px: number;
  weight: number;
  italic: boolean;
  upper: boolean;
  /** Letter-spacing in em (0 when normal). */
  tracking: number;
  /** The V T logo (vector art, not type). */
  logo?: boolean;
}

export interface TypeSpecPiece {
  kind: PaperPieceKind;
  rows: TypeSpecRow[];
}

/** Design pixels per inch: the card's 400 × 560 px is a 5 × 7 in invitation. */
export const DESIGN_PX_PER_INCH = 80;

/** Print size in points of a design-pixel size. */
export function pxToPt(px: number): number {
  return (px * 72) / DESIGN_PX_PER_INCH;
}

/** Print size in millimetres of a design-pixel length. */
export function pxToMm(px: number): number {
  return (px * 25.4) / DESIGN_PX_PER_INCH;
}

const THAI = /[฀-๿]/;
/** The Thai-capable faces every stack ends in (wedding-theme.css). */
const THAI_FACES = new Set(['Charm', 'Sarabun', 'Noto Serif Thai']);
const GENERIC = new Set(['serif', 'sans-serif', 'cursive', 'monospace', 'fantasy', 'system-ui']);
/** Pieces that repeat another one's type (the open envelope shows the back). */
const SKIP: ReadonlySet<string> = new Set(['envelopeOpen']);
const MAX_SAMPLE = 72;

export function fontFamilies(stack: string): string[] {
  return stack
    .split(',')
    .map((family) => family.trim().replace(/^['"]|['"]$/g, ''))
    .filter((family) => family && !GENERIC.has(family));
}

/** The face that draws `text`: Thai falls through to the stack's Thai face. */
export function faceFor(stack: string, text: string): string {
  const families = fontFamilies(stack);
  if (THAI.test(text)) {
    return families.find((family) => THAI_FACES.has(family)) ?? families[0] ?? stack;
  }
  return families[0] ?? stack;
}

function visible(el: Element): boolean {
  const check = (el as HTMLElement).checkVisibility;
  return typeof check === 'function' ? check.call(el, { opacityProperty: true, visibilityProperty: true }) : true;
}

/**
 * CSS zoom between an element and its piece: some frames shrink their copy
 * with `zoom` to fit a window, and computed sizes ignore it. Browsers without
 * `currentCSSZoom` (and jsdom) count as unzoomed.
 */
function zoomWithin(el: Element, art: Element): number {
  const zoom = (node: Element) => (node as Element & { currentCSSZoom?: number }).currentCSSZoom;
  const own = zoom(el);
  const base = zoom(art);
  return typeof own === 'number' && typeof base === 'number' && own > 0 && base > 0 ? own / base : 1;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

function trackingEm(style: CSSStyleDeclaration, px: number): number {
  const spacing = parseFloat(style.letterSpacing);
  return Number.isFinite(spacing) && px > 0 ? Math.round((spacing / px) * 100) / 100 : 0;
}

/**
 * Walks every printed piece under `root` (the flat lay of the paper suite)
 * and lists its distinct type styles in reading order, plus the logo.
 */
export function measureTypography(root: HTMLElement): TypeSpecPiece[] {
  const view = root.ownerDocument.defaultView;
  if (!view) {
    return [];
  }
  const pieces: TypeSpecPiece[] = [];
  for (const piece of Array.from(root.querySelectorAll<HTMLElement>('.paper__piece'))) {
    const kind = Array.from(piece.classList)
      .find((c) => c.startsWith('paper__piece--'))
      ?.slice('paper__piece--'.length) as PaperPieceKind | undefined;
    const art = piece.querySelector<HTMLElement>('app-paper-art');
    if (!kind || !art || SKIP.has(kind)) {
      continue;
    }
    // The sleeve shows the card inside it; the "insert" piece lists that card.
    const skipInside = kind === 'pocket' ? 'app-invitation-card' : null;
    const rows = new Map<string, TypeSpecRow & { samples: string[] }>();
    const add = (key: string, row: TypeSpecRow, text: string) => {
      const found = rows.get(key) ?? { ...row, samples: [] };
      if (text && !found.samples.includes(text)) {
        found.samples.push(text);
      }
      rows.set(key, found);
    };

    // Text and logos in reading (document) order.
    const walker = root.ownerDocument.createTreeWalker(art, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node instanceof view.HTMLElement && node.classList.contains('vt-logo')) {
        if ((!skipInside || !node.closest(skipInside)) && visible(node)) {
          const height = round1(parseFloat(view.getComputedStyle(node).height) * zoomWithin(node, art));
          if (height > 0) {
            add(`logo|${height}`, { sample: '', font: '', stack: '', px: height, weight: 400, italic: false, upper: false, tracking: 0, logo: true }, '');
          }
        }
        continue;
      }
      if (node.nodeType !== 3) {
        continue;
      }
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
      const el = node.parentElement;
      if (!text || !el || (skipInside && el.closest(skipInside)) || !visible(el)) {
        continue;
      }
      const style = view.getComputedStyle(el);
      const size = parseFloat(style.fontSize);
      // Printed size: what the copy is drawn at once the frame's zoom applies.
      const px = round1(size * zoomWithin(el, art));
      const weight = parseInt(style.fontWeight, 10) || 400;
      const italic = style.fontStyle === 'italic';
      // Thai has no letter case.
      const upper = style.textTransform === 'uppercase' && /[A-Za-zÀ-ỹ]/.test(text);
      // Letter-spacing and font-size are both unzoomed: their ratio holds.
      const tracking = trackingEm(style, size);
      const font = faceFor(style.fontFamily, text);
      const key = [font, px, weight, italic, upper, tracking].join('|');
      add(key, { sample: '', font, stack: style.fontFamily, px, weight, italic, upper, tracking }, text);
    }

    if (rows.size) {
      pieces.push({
        kind,
        rows: Array.from(rows.values()).map(({ samples, ...row }) => {
          const sample = samples.join(' · ');
          return { ...row, sample: sample.length > MAX_SAMPLE ? `${sample.slice(0, MAX_SAMPLE - 1)}…` : sample };
        }),
      });
    }
  }
  return pieces;
}

/** Pieces that carry the invitation itself, in order of preference. */
const MAIN_PIECES: PaperPieceKind[] = ['card', 'insert', 'foldFlat', 'popupOpen', 'passportOpen'];

/** The piece whose sheet opens first: the invitation itself. */
export function mainPiece(pieces: TypeSpecPiece[]): PaperPieceKind | undefined {
  return MAIN_PIECES.find((kind) => pieces.some((piece) => piece.kind === kind)) ?? pieces[0]?.kind;
}

/** Script faces have a small x-height: their samples are shown larger. */
const SCRIPT_FACES = new Set(['Alex Brush', 'Charm', 'Dancing Script', 'Great Vibes', 'Pinyon Script', 'Parisienne', 'Sacramento']);

export function isScriptFace(font: string): boolean {
  return SCRIPT_FACES.has(font);
}

/** Every face a design uses, in order of first appearance. */
export function facesUsed(pieces: TypeSpecPiece[]): string[] {
  const faces: string[] = [];
  for (const row of pieces.flatMap((piece) => piece.rows)) {
    if (!row.logo && !faces.includes(row.font)) {
      faces.push(row.font);
    }
  }
  return faces;
}
