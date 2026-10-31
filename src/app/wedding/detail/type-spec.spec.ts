import { faceFor, facesUsed, fontFamilies, mainPiece, measureTypography, pxToMm, pxToPt } from './type-spec';

describe('type spec', () => {
  it('reads the faces of a CSS stack, without generic families', () => {
    expect(fontFamilies(`'Alex Brush', Charm, "Be Vietnam Pro", cursive`)).toEqual(['Alex Brush', 'Charm', 'Be Vietnam Pro']);
  });

  it('names the face that draws the text: Thai falls through to the Thai face', () => {
    const stack = `'Alex Brush', 'Charm', 'Be Vietnam Pro', cursive`;
    expect(faceFor(stack, 'Vũ & Thảo')).toBe('Alex Brush');
    expect(faceFor(stack, 'ขอเรียนเชิญ')).toBe('Charm');
    expect(faceFor(`'Playfair Display', 'Noto Serif Thai', serif`, 'การ์ด')).toBe('Noto Serif Thai');
  });

  it('converts design pixels to print sizes for a 5 × 7 in card (80 px per inch)', () => {
    expect(pxToPt(46)).toBeCloseTo(41.4);
    expect(pxToMm(80)).toBeCloseTo(25.4);
    expect(pxToMm(560)).toBeCloseTo(177.8);
  });

  function piece(kind: string, html: string): string {
    return `<figure class="paper__piece paper__piece--${kind}"><app-paper-art>${html}</app-paper-art><figcaption>label</figcaption></figure>`;
  }

  it('lists each distinct style once, in reading order, with the logo where it sits', () => {
    const root = document.createElement('div');
    root.innerHTML =
      piece('envelopeOpen', `<p style="font-family: Lora; font-size: 11px">skipped</p>`) +
      piece(
        'card',
        `<p><span class="vt-logo" style="height: 27px"></span></p>
         <p style="font-family: 'Alex Brush', Charm; font-size: 28px">Thiệp Cưới</p>
         <p style="font-family: Lora; font-size: 12.5px; font-weight: 600">Tại Sảnh Danube</p>
         <p style="font-family: Lora; font-size: 12.5px; font-weight: 600">Riverside Palace</p>
         <p style="font-family: Lora; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 3.15px">Trân trọng kính mời</p>`,
      ) +
      piece(
        'pocket',
        `<p style="font-family: 'Alex Brush'; font-size: 38px">Vũ &amp; Thảo</p>
         <app-invitation-card><p style="font-family: Lora; font-size: 14px">inside the sleeve</p></app-invitation-card>`,
      );
    document.body.appendChild(root);
    try {
      const pieces = measureTypography(root);
      expect(pieces.map((p) => p.kind)).toEqual(['card', 'pocket']);
      const [card, pocket] = pieces;
      expect(card.rows.map((row) => (row.logo ? 'logo' : row.sample))).toEqual([
        'logo',
        'Thiệp Cưới',
        'Tại Sảnh Danube · Riverside Palace',
        'Trân trọng kính mời',
      ]);
      expect(card.rows[0].px).toBe(27);
      expect(card.rows[1]).toEqual(expect.objectContaining({ font: 'Alex Brush', px: 28, weight: 400 }));
      expect(card.rows[3]).toEqual(expect.objectContaining({ upper: true, tracking: 0.3, weight: 600 }));
      // The card inside the sleeve is listed under "insert", not here.
      expect(pocket.rows.map((row) => row.sample)).toEqual(['Vũ & Thảo']);
      expect(facesUsed(pieces)).toEqual(['Alex Brush', 'Lora']);
      expect(mainPiece(pieces)).toBe('card');
    } finally {
      root.remove();
    }
  });
});
