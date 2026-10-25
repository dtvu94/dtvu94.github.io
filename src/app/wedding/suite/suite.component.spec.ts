import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { INVITATION_DESIGNS, getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_UI } from '../data/ui-strings';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign } from '../data/wedding.types';
import { EnvelopeLayer } from '../envelope/envelope.component';
import { paperPieces } from '../paper/paper-suite.component';
import { pocketInsert } from '../pocket/pocket.component';
import { SUITE_DECLARATIONS } from '../wedding.declarations';

type Piece = 'envelope' | 'pocket' | 'suite' | 'paper';

@Component({
  template: `
    @switch (piece) {
      @case ('envelope') {
        <app-envelope [design]="design" [copy]="copy" [layer]="layer" [open]="open" />
      }
      @case ('pocket') {
        <app-pocket [design]="design" [copy]="copy" />
      }
      @case ('paper') {
        <app-paper-suite [design]="design" [copy]="copy" [labels]="labels" />
      }
      @default {
        <app-suite [design]="design" [copy]="copy" />
      }
    }
  `,
  standalone: false,
})
class HostComponent {
  piece: Piece = 'suite';
  design = getDesignById('press-cotton') as InvitationDesign;
  copy = buildWording(WEDDING_CONFIG);
  labels = WEDDING_UI.vi.paperLabels;
  layer: EnvelopeLayer = 'front';
  open = false;
}

describe('suite pieces', () => {
  beforeEach(() => TestBed.configureTestingModule({ declarations: [HostComponent, ...SUITE_DECLARATIONS] }));

  function render(id: string, setup: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, { design: getDesignById(id), ...setup });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  describe('EnvelopeComponent', () => {
    it('addresses the guest on the front: "Kính mời" line, the couple and the print', () => {
      const front = render('modern-red', { piece: 'envelope', layer: 'front' });
      expect(front.querySelector('.env__guest')?.textContent).toContain('Kính mời:');
      expect(front.querySelector('.env__names')?.textContent).toContain('Vũ & Thảo');
      expect(front.querySelector('.env__front')).toBeTruthy();
    });

    it('keeps the back plain: seams on the pocket, no guest line or names', () => {
      for (const id of ['modern-red', 'press-cotton', 'rustic-kraft']) {
        const back = render(id, { piece: 'envelope', layer: 'pocket' });
        expect(back.querySelector('.env__guest')).toBeNull();
        expect(back.querySelector('.env__names')).toBeNull();
        expect(back.querySelector('.env__monogram')).toBeNull();
        expect((back.querySelector('.env__pocket') as HTMLElement).style.clipPath).toMatch(/^path\('M/);
      }
    });

    it('prints a monogram crest, a fern or a framed title on the front as the design asks', () => {
      const front = (id: string) => render(id, { piece: 'envelope', layer: 'front' });
      expect(front('press-cotton').querySelector('.env__monogram')?.textContent).toContain('V & T');
      expect(front('rustic-kraft').querySelector('.env__script')?.textContent).toContain('Thiệp Cưới');
      expect(front('vn-hy-do').querySelector('.env__frame-title')).toBeTruthy();
    });

    it('lines the back panel and the inside of the flap', () => {
      expect(render('press-cotton', { piece: 'envelope', layer: 'back' }).querySelector('.env__back-liner')).toBeTruthy();
      expect(render('rustic-kraft', { piece: 'envelope', layer: 'back' }).querySelector('.env__back-liner')).toBeNull();
      expect(render('press-cotton', { piece: 'envelope', layer: 'flap' }).querySelector('.env__flap-liner')).toBeTruthy();
    });

    it('opens the flap and seals it with wax, a sticker, twine or nothing', () => {
      const closed = render('press-cotton', { piece: 'envelope', layer: 'flap' });
      expect(closed.querySelector('.env__hinge--open')).toBeNull();
      expect(closed.querySelector('.env__wax')?.getAttribute('fill')).toBe('#24304d');
      expect(closed.querySelector('.env__seal-text')?.textContent).toContain('V & T');
      expect(render('press-cotton', { piece: 'envelope', layer: 'flap', open: true }).querySelector('.env__hinge--open')).toBeTruthy();

      expect(render('press-red-ink', { piece: 'envelope', layer: 'flap' }).querySelector('.env__sticker-ring')).toBeTruthy();
      expect(render('rustic-kraft', { piece: 'envelope', layer: 'flap' }).querySelector('.env__seal')).toBeNull();
      // Twine wraps round: seen on the back and across the front.
      expect(render('rustic-kraft', { piece: 'envelope', layer: 'pocket' }).querySelector('.env__twine')).toBeTruthy();
      expect(render('rustic-kraft', { piece: 'envelope', layer: 'front' }).querySelector('.env__twine')).toBeTruthy();
    });
  });

  describe('PocketComponent', () => {
    it('cuts the sleeve window as an even-odd hole and prints the cover', () => {
      const root = render('modern-sage', { piece: 'pocket' });
      expect((root.querySelector('.pk__sleeve') as HTMLElement).style.clipPath).toContain('evenodd');
      expect(root.querySelectorAll('.pk__shutter').length).toBe(2);
      expect(root.querySelector('.pk__title')?.textContent).toContain('Save the Date');
      expect(root.querySelector('.pk__date')?.textContent).toContain('28 · 03 · 2027');
      expect(root.querySelector('.pk__insert app-invitation-card')).toBeTruthy();
    });

    it('holds an invite in a lower pocket, printed in its own colours', () => {
      const root = render('vn-hong-phuc', { piece: 'pocket' });
      const [base, insert] = Array.from(root.querySelectorAll('app-invitation-card'));
      expect(base.querySelector('.inv__kicker')).toBeTruthy();
      expect(insert.querySelector('.inv__headline')).toBeTruthy();
      expect(insert.getAttribute('style')).toContain('--inv-surface:#fbf1df');
      expect(base.getAttribute('style')).toContain('--inv-surface:#b3161b');
      expect(render('rustic-kraft', { piece: 'pocket' }).querySelector('.pk__band-names')?.textContent).toContain('Vũ & Thảo');
    });

    it('frames the couple’s photo in the window when the design asks', () => {
      const root = render('pocket-photo-arch', { piece: 'pocket' });
      expect(root.querySelector('.pk__window-photo')).toBeTruthy();
      expect(render('modern-sage', { piece: 'pocket' }).querySelector('.pk__window-photo')).toBeNull();
    });

    it('names the insert: own colours, and just the invitation for a lower pocket', () => {
      const lower = pocketInsert(getDesignById('vn-hong-phuc')!);
      expect(lower.part).toBe('invite');
      expect(lower.design.shape).toBe('rounded');
      const sleeve = getDesignById('modern-sage')!;
      expect(pocketInsert(sleeve)).toEqual({ design: sleeve, part: 'full' });
    });
  });

  describe('SuiteComponent (gallery preview)', () => {
    it('lays the open envelope behind and the card in front of it', () => {
      const root = render('press-cotton');
      const layers = Array.from(root.querySelector('.suite')!.children).map((el) => el.className.split(' ')[1]);
      expect(layers).toEqual(['suite__env--flap', 'suite__env--back', 'suite__env--pocket', 'suite__piece--card']);
      expect(root.querySelector('.env__hinge--open')).toBeTruthy();
      // From the back: no guest line on show.
      expect(root.querySelector('.env__guest')).toBeNull();
    });

    it('shows a sleeve’s card peeking out above it', () => {
      expect(render('modern-sage').querySelector('app-pocket')?.getAttribute('style')).toContain('--pk-rest:-150px');
    });

    it('is static: no interactive controls or state', () => {
      const root = render('fold-red-bifold');
      expect(root.querySelector('button')).toBeNull();
      expect(root.querySelector('app-folded.fd--ajar')).toBeTruthy();
    });
  });

  describe('PaperSuiteComponent (printed suite, laid flat)', () => {
    const kinds = (id: string) => paperPieces(getDesignById(id)!).map((p) => p.kind);

    it('lays out envelope front and back, liner, the pieces of each form and the directions card', () => {
      expect(kinds('press-cotton')).toEqual(['envelopeFront', 'envelopeBack', 'envelopeOpen', 'card', 'directions']);
      // Kraft envelope without a liner: no inside view.
      expect(kinds('rustic-kraft')).toEqual(['envelopeFront', 'envelopeBack', 'pocket', 'insert', 'directions']);
      expect(kinds('fold-sage-gate')).toContain('foldFlat');
      expect(kinds('pop-meadow')).toEqual(expect.arrayContaining(['popupClosed', 'popupOpen']));
      expect(kinds('passport-navy')).toEqual(expect.arrayContaining(['passportClosed', 'passportOpen']));
    });

    it('starts and ends every suite with the envelope and the directions card', () => {
      for (const design of INVITATION_DESIGNS) {
        const list = paperPieces(design).map((p) => p.kind);
        expect(list.slice(0, 2)).toEqual(['envelopeFront', 'envelopeBack']);
        expect(list[list.length - 1]).toBe('directions');
      }
    });

    it('sizes a flat folded spread to all its panels', () => {
      const flat = paperPieces(getDesignById('fold-blush-zigzag')!).find((p) => p.kind === 'foldFlat')!;
      expect(flat.w).toBe(1200);
      expect(flat.ox).toBe(-400);
    });

    it('renders every piece with its caption, the envelope front carrying the guest line', () => {
      const root = render('press-red-foil', { piece: 'paper' });
      const captions = Array.from(root.querySelectorAll('.paper__label')).map((el) => el.textContent?.trim());
      expect(captions).toEqual(['Bao thư · mặt trước', 'Bao thư · mặt sau', 'Bao thư · lót trong', 'Thiệp mời', 'Thiệp chỉ đường']);
      expect(root.querySelector('.paper__piece--envelopeFront .env__guest')?.textContent).toContain('Kính mời');
      expect(root.querySelector('.paper__piece--envelopeBack .env__guest')).toBeNull();
      expect(root.querySelector('.paper__piece--directions app-directions-card')).toBeTruthy();
      expect(root.querySelector('button')).toBeNull();
    });
  });
});
