import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign } from '../data/wedding.types';
import { EnvelopeLayer } from '../envelope/envelope.component';
import { SUITE_DECLARATIONS } from '../wedding.declarations';
import { SuiteComponent } from './suite.component';

@Component({
  template: `
    @if (layer) {
      <app-envelope [design]="design" [copy]="copy" [layer]="layer" [open]="open" />
    } @else if (pocketOnly) {
      <app-pocket [design]="design" [copy]="copy" [out]="open" />
    } @else {
      <app-suite [design]="design" [copy]="copy" [interactive]="interactive" />
    }
  `,
  standalone: false,
})
class HostComponent {
  design = getDesignById('press-cotton') as InvitationDesign;
  copy = buildWording(WEDDING_CONFIG);
  layer: EnvelopeLayer | null = null;
  pocketOnly = false;
  open = false;
  interactive = false;
}

describe('suite pieces', () => {
  beforeEach(() => TestBed.configureTestingModule({ declarations: [HostComponent, ...SUITE_DECLARATIONS] }));

  function render(id: string, setup: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, { design: getDesignById(id), ...setup });
    fixture.detectChanges();
    return fixture;
  }

  describe('EnvelopeComponent', () => {
    it('prints the guest line and the couple on the front pocket', () => {
      const root: HTMLElement = render('modern-red', { layer: 'pocket' }).nativeElement;
      expect(root.querySelector('.env__guest')?.textContent).toContain('Kính mời:');
      expect(root.querySelector('.env__names')?.textContent).toContain('Vũ & Thảo');
      expect((root.querySelector('.env__pocket') as HTMLElement).style.clipPath).toMatch(/^path\('M/);
    });

    it('prints a monogram crest, a fern or a framed title as the design asks', () => {
      expect(render('press-cotton', { layer: 'pocket' }).nativeElement.querySelector('.env__monogram')?.textContent).toContain('V & T');
      expect(render('rustic-kraft', { layer: 'pocket' }).nativeElement.querySelector('.env__script')?.textContent).toContain('Thiệp Cưới');
      expect(render('vn-hy-do', { layer: 'pocket' }).nativeElement.querySelector('.env__frame-title')).toBeTruthy();
    });

    it('lines the back panel and the inside of the flap', () => {
      expect(render('press-cotton', { layer: 'back' }).nativeElement.querySelector('.env__back-liner')).toBeTruthy();
      expect(render('rustic-kraft', { layer: 'back' }).nativeElement.querySelector('.env__back-liner')).toBeNull();
      expect(render('press-cotton', { layer: 'flap' }).nativeElement.querySelector('.env__flap-liner')).toBeTruthy();
    });

    it('swings the flap open and seals it with wax, a sticker, twine or nothing', () => {
      const closed: HTMLElement = render('press-cotton', { layer: 'flap' }).nativeElement;
      expect(closed.querySelector('.env__hinge--open')).toBeNull();
      expect(closed.querySelector('.env__wax')?.getAttribute('fill')).toBe('#24304d');
      expect(closed.querySelector('.env__seal-text')?.textContent).toContain('V & T');
      expect(render('press-cotton', { layer: 'flap', open: true }).nativeElement.querySelector('.env__hinge--open')).toBeTruthy();

      expect(render('press-red-ink', { layer: 'flap' }).nativeElement.querySelector('.env__sticker-ring')).toBeTruthy();
      expect(render('rustic-kraft', { layer: 'flap' }).nativeElement.querySelector('.env__seal')).toBeNull();
      expect(render('rustic-kraft', { layer: 'pocket' }).nativeElement.querySelector('.env__twine')).toBeTruthy();
    });
  });

  describe('PocketComponent', () => {
    it('cuts the sleeve window as an even-odd hole and prints the cover', () => {
      const root: HTMLElement = render('modern-sage', { pocketOnly: true }).nativeElement;
      expect((root.querySelector('.pk__sleeve') as HTMLElement).style.clipPath).toContain('evenodd');
      expect(root.querySelectorAll('.pk__shutter').length).toBe(2);
      expect(root.querySelector('.pk__title')?.textContent).toContain('Save the Date');
      expect(root.querySelector('.pk__date')?.textContent).toContain('28 · 03 · 2027');
      expect(root.querySelector('.pk__insert app-invitation-card')).toBeTruthy();
    });

    it('holds an invite in a lower pocket, printed in its own colours', () => {
      const root: HTMLElement = render('vn-hong-phuc', { pocketOnly: true }).nativeElement;
      const [base, insert] = Array.from(root.querySelectorAll('app-invitation-card'));
      expect(base.querySelector('.inv__kicker')).toBeTruthy();
      expect(insert.querySelector('.inv__headline')).toBeTruthy();
      expect(insert.getAttribute('style')).toContain('--inv-surface:#fbf1df');
      expect(base.getAttribute('style')).toContain('--inv-surface:#b3161b');
    });

    it('marks the opened state on the host', () => {
      expect(render('min-sand', { pocketOnly: true, open: true }).nativeElement.querySelector('app-pocket.pk--out')).toBeTruthy();
      expect(render('rustic-kraft', { pocketOnly: true }).nativeElement.querySelector('.pk__band-names')?.textContent).toContain(
        'Vũ & Thảo',
      );
    });
  });

  describe('SuiteComponent', () => {
    const suiteOf = (fixture: ReturnType<typeof render>) =>
      fixture.debugElement.query((el) => el.componentInstance instanceof SuiteComponent).componentInstance as SuiteComponent;

    it('stacks back panel, card, front pocket and flap', () => {
      const root: HTMLElement = render('press-cotton').nativeElement;
      const layers = Array.from(root.querySelector('.suite')!.children).map((el) => el.className.split(' ')[1] ?? el.className);
      expect(layers).toEqual(['suite__env--back', 'suite__slot', 'suite__env--pocket', 'suite__env--flap']);
    });

    it('shows the gallery pose: card out in front, sleeve card peeking', () => {
      const fixture = render('modern-sage');
      expect(fixture.nativeElement.querySelector('.suite--out.suite--front')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-pocket')?.getAttribute('style')).toContain('--pk-rest:-150px');
    });

    it('runs sealed → opened → out → unfolded and back to sealed', fakeAsync(() => {
      const fixture = render('min-sand', { interactive: true });
      const suite = suiteOf(fixture);
      expect(suite.state()).toBe('sealed');
      expect(suite.hasInside).toBe(true);

      suite.advance();
      expect(suite.state()).toBe('opened');
      tick(1500);
      expect(suite.state()).toBe('out');
      expect(suite.front()).toBe(true);

      suite.advance();
      expect(suite.state()).toBe('unfolded');

      suite.close();
      expect(suite.state()).toBe('out');
      tick(1250);
      expect(suite.state()).toBe('opened');
      expect(suite.direction()).toBe('in');
      tick(950);
      expect(suite.state()).toBe('sealed');
      expect(suite.front()).toBe(false);
    }));

    it('closes a flat card straight back into its envelope', fakeAsync(() => {
      const suite = suiteOf(render('press-cotton', { interactive: true }));
      expect(suite.hasInside).toBe(false);
      suite.open();
      tick(1500);
      suite.advance();
      expect(suite.state()).toBe('opened');
      tick(950);
      expect(suite.state()).toBe('sealed');
    }));
  });
});
