import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign, PanelKind } from '../data/wedding.types';
import { FoldPose } from '../folded/fold-geometry';
import { popupLayers } from '../geometry/popup-art';
import { PassportPose, mrzName } from '../passport/passport.component';
import { SUITE_DECLARATIONS } from '../wedding.declarations';
import { SuiteComponent } from './suite.component';

type Piece = 'folded' | 'popup' | 'passport' | 'panel' | 'suite';

@Component({
  template: `
    @switch (piece) {
      @case ('folded') {
        <app-folded [design]="design" [copy]="copy" [pose]="pose" />
      }
      @case ('popup') {
        <app-popup [design]="design" [copy]="copy" [open]="open" />
      }
      @case ('passport') {
        <app-passport [design]="design" [copy]="copy" [pose]="passportPose" />
      }
      @case ('panel') {
        <app-panel [design]="design" [copy]="copy" [kind]="kind" [width]="width" />
      }
      @default {
        <app-suite [design]="design" [copy]="copy" [interactive]="true" />
      }
    }
  `,
  standalone: false,
})
class HostComponent {
  piece: Piece = 'suite';
  design = getDesignById('fold-red-bifold') as InvitationDesign;
  copy = buildWording(WEDDING_CONFIG);
  pose: FoldPose = 'closed';
  open = false;
  passportPose: PassportPose = 'closed';
  kind: PanelKind = 'calendar';
  width = 400;
}

describe('folded cards, pop-ups and passports', () => {
  beforeEach(() => TestBed.configureTestingModule({ declarations: [HostComponent, ...SUITE_DECLARATIONS] }));

  function render(id: string, setup: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, { design: getDesignById(id), ...setup });
    fixture.detectChanges();
    return fixture;
  }

  describe('FoldedComponent', () => {
    it('hinges one leaf for a bifold and two half doors for a gate-fold', () => {
      const bifold: HTMLElement = render('fold-red-bifold', { piece: 'folded' }).nativeElement;
      expect(bifold.querySelectorAll('.fd__leaf').length).toBe(1);
      const gate: HTMLElement = render('fold-sage-gate', { piece: 'folded' }).nativeElement;
      const doors = gate.querySelectorAll<HTMLElement>('.fd__leaf');
      expect(doors.length).toBe(2);
      expect(doors[0].style.width).toBe('200px');
      expect(doors[1].style.left).toBe('400px');
    });

    it('swings the leaves from closed to ajar to open', () => {
      const fixture = render('fold-blush-zigzag', { piece: 'folded' });
      const leaf = () => fixture.nativeElement.querySelector('.fd__leaf') as HTMLElement;
      expect(fixture.nativeElement.querySelector('app-folded').classList).toContain('fd--closed');
      expect(leaf().style.transform).toContain('rotateY(180deg)');
      for (const pose of ['ajar', 'open'] as const) {
        fixture.componentInstance.pose = pose;
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('app-folded').classList).toContain(`fd--${pose}`);
      }
      expect(leaf().style.transform).toContain('rotateY(20deg)');
    });

    it('prints the cover outside and the panels inside', () => {
      const root: HTMLElement = render('fold-sage-gate', { piece: 'folded' }).nativeElement;
      const kinds = Array.from(root.querySelectorAll('app-panel')).map((el) => el.className.match(/pn--(?!narrow)(\w+)/)?.[1]);
      // centre, left door (inside, cover half), right door (inside, cover half)
      expect(kinds).toEqual(['invite', 'photo', 'announce', 'calendar', 'announce']);
      expect(root.querySelectorAll('.fd__half').length).toBe(2);
    });
  });

  describe('PanelComponent', () => {
    it('circles the wedding day on a Monday-first calendar', () => {
      const root: HTMLElement = render('fold-navy-deco', { piece: 'panel', kind: 'calendar' }).nativeElement;
      expect(root.querySelector('.pn__month')?.textContent).toContain('2027');
      expect(root.querySelector('.pn__d--on')?.textContent?.trim()).toBe('28');
      expect(root.querySelectorAll('.pn__d').length).toBe(31);
    });

    it('frames the photo placeholder until wedding photos are configured', () => {
      const root: HTMLElement = render('fold-sage-gate', { piece: 'panel', kind: 'photo' }).nativeElement;
      expect(root.querySelector('img')).toBeNull();
      expect(root.querySelector('.ph__monogram')?.textContent).toContain('V & T');
      expect(root.querySelector('.ph__caption')?.textContent?.trim()).not.toBe('');
    });

    it('switches every photo frame to the configured photo', () => {
      WEDDING_CONFIG.photos.push('assets/wedding/test.jpg');
      try {
        const root: HTMLElement = render('fold-sage-gate', { piece: 'panel', kind: 'photo' }).nativeElement;
        expect(root.querySelector('img')?.getAttribute('src')).toBe('assets/wedding/test.jpg');
        expect(root.querySelector('.ph__placeholder')).toBeNull();
      } finally {
        WEDDING_CONFIG.photos.length = 0;
      }
    });

    it('lays out the venue with its address and a narrow variant for gate doors', () => {
      const fixture = render('fold-wine-gate', { piece: 'panel', kind: 'venue', width: 200 });
      const root: HTMLElement = fixture.nativeElement;
      expect(root.querySelector('app-panel')?.classList).toContain('pn--narrow');
      expect(root.textContent).toContain(fixture.componentInstance.copy.venueLines[0]);
    });
  });

  describe('PopupComponent', () => {
    it('raises one cut-paper layer per scene layer, with the short date', () => {
      const fixture = render('pop-meadow', { piece: 'popup', open: true });
      const root: HTMLElement = fixture.nativeElement;
      const design = fixture.componentInstance.design;
      expect(root.querySelectorAll('svg.pp__layer').length).toBe(popupLayers('meadow', design.palette).length);
      expect(root.querySelector('.pp__text')?.textContent?.trim()).toBe('28.03');
      expect(root.querySelector('app-popup')?.classList).toContain('pp--open');
    });

    it('shows the save-the-date cover when shut', () => {
      const root: HTMLElement = render('pop-hearts', { piece: 'popup' }).nativeElement;
      expect(root.querySelector('app-popup')?.classList).toContain('pp--closed');
      expect(root.querySelector('.pp__face--out .pp__cover-names')?.textContent).toContain('Vũ & Thảo');
    });
  });

  describe('PassportComponent', () => {
    it('spells the couple machine-readable style', () => {
      expect(mrzName('Vũ & Thảo')).toBe('VU<<THAO');
      expect(mrzName('Đức & Hà')).toBe('DUC<<HA');
    });

    it('prints an own emblem on the cover, a data page and a boarding pass', () => {
      const root: HTMLElement = render('passport-red', { piece: 'passport' }).nativeElement;
      // The couple's laurel + monogram crest — never a national emblem.
      expect(root.querySelector('.ps__face--front app-ornament.ps__laurel svg')).toBeTruthy();
      expect(root.querySelector('.ps__face--front .ps__monogram')?.textContent).toContain('V & T');
      expect(root.querySelector('.ps__title')?.textContent?.trim()).not.toBe('');
      const mrz = root.querySelector('.ps__mrz')?.textContent ?? '';
      expect(mrz).toContain('VU<<THAO');
      expect(root.querySelector('.ps__band')?.textContent).toContain('V&T Airlines');
      expect(root.querySelector('.ps__ticket')?.textContent).toContain('Riverside Palace');
    });

    it('hides the ticket when closed, lets it peek out, and opens the cover', () => {
      const fixture = render('passport-navy', { piece: 'passport' });
      const host = () => fixture.nativeElement.querySelector('app-passport') as HTMLElement;
      expect(host().classList).toContain('ps--closed');
      for (const pose of ['peek', 'open'] as const) {
        fixture.componentInstance.passportPose = pose;
        fixture.detectChanges();
        expect(host().classList).toContain(`ps--${pose}`);
      }
    });
  });

  describe('in a suite', () => {
    const suiteOf = (fixture: ReturnType<typeof render>) =>
      fixture.debugElement.query((el) => el.componentInstance instanceof SuiteComponent).componentInstance as SuiteComponent;

    it.each([
      ['fold-red-bifold', 'app-folded', 'fd--closed', 'fd--open'],
      ['pop-skyline', 'app-popup', 'pp--closed', 'pp--open'],
      ['passport-emerald', 'app-passport', 'ps--peek', 'ps--open'],
    ])('%s comes out shut and opens on “Xem bên trong”', fakeAsync((id: string, selector: string, shut: string, opened: string) => {
      const fixture = render(id);
      const suite = suiteOf(fixture);
      const piece = () => fixture.nativeElement.querySelector(selector) as HTMLElement;
      const transform = () => (fixture.nativeElement.querySelector('.suite__piece') as HTMLElement).style.transform;
      expect(suite.hasInside).toBe(true);
      expect(piece()).toBeTruthy();

      suite.advance();
      tick(1500);
      fixture.detectChanges();
      expect(suite.state()).toBe('out');
      expect(piece().classList).toContain(shut);
      const outTransform = transform();

      suite.advance();
      fixture.detectChanges();
      expect(suite.state()).toBe('unfolded');
      expect(piece().classList).toContain(opened);
      expect(transform()).not.toBe(outTransform);

      suite.close();
      tick(1250 + 950);
      fixture.detectChanges();
      expect(suite.state()).toBe('sealed');
    }));
  });
});
