import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { INVITATION_DESIGNS, getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign } from '../data/wedding.types';
import { OrnamentComponent } from '../ornaments/ornament.component';
import { InvitationCardComponent } from './invitation-card.component';

@Component({
  template: '<app-invitation-card [design]="design" [copy]="copy" />',
  standalone: false,
})
class HostComponent {
  design: InvitationDesign = getDesignById('classic-ivory') as InvitationDesign;
  copy = buildWording(WEDDING_CONFIG);
}

describe('InvitationCardComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      declarations: [HostComponent, InvitationCardComponent, OrnamentComponent],
    }),
  );

  it('projects the palette and fonts as CSS variables on its host element', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('app-invitation-card');
    const style = host.getAttribute('style') ?? '';
    expect(style).toContain('--inv-surface:#ffffff');
    expect(style).toContain('--inv-accent:#b69256');
    expect(style).toContain('--inv-font-display:var(--ff-playfair)');
    expect(style).toContain('--inv-font-accent:var(--ff-greatVibes)');
  });

  it('places the names directly after the event line, completing the sentence', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    // "đến dự Lễ Thành Hôn của" must be immediately followed by "Vũ & Thảo".
    const couple = fixture.nativeElement.querySelector('.inv__event + .inv__couple');
    expect(couple?.textContent).toContain('Vũ & Thảo');
    const event = fixture.nativeElement.querySelector('.inv__event');
    expect(event?.textContent).toContain('đến dự Lễ Thành Hôn của');
    expect(event?.textContent).not.toContain('chúng tôi');
  });

  function render(id: string) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.design = getDesignById(id) as InvitationDesign;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('lays the laser-cut jacket over the card as a single evenodd path', () => {
    const root = render('laser-red-lace');
    const sheet = root.querySelectorAll('svg.inv__laser path');
    expect(sheet.length).toBe(1);
    expect(sheet[0].getAttribute('fill-rule')).toBe('evenodd');
    expect(sheet[0].getAttribute('d')?.length).toBeGreaterThan(1000);
    const host = root.querySelector('app-invitation-card');
    expect(host?.getAttribute('style')).toContain('--inv-overlay:#d7151c');
  });

  it('renders no jacket for non-laser layouts and falls back to the accent as overlay', () => {
    const root = render('classic-ivory');
    expect(root.querySelector('.inv__laser')).toBeNull();
    expect(root.querySelector('app-invitation-card')?.getAttribute('style')).toContain('--inv-overlay:#b69256');
  });

  it('flags the print finish and dark paper on the card', () => {
    expect(render('press-cotton').querySelector('.inv')?.className).toContain('inv--fin-letterpress');
    expect(render('press-blind-ivory').querySelector('.inv')?.className).toContain('inv--fin-emboss');
    expect(render('classic-ivory').querySelector('.inv')?.className).toContain('inv--fin-flat');

    const redFoil = render('press-red-foil').querySelector('.inv');
    expect(redFoil?.classList.contains('inv--dark-paper')).toBe(true);
    expect(render('press-cotton').querySelector('.inv')?.classList.contains('inv--dark-paper')).toBe(false);
  });

  it('cuts the monogram through the laser doily crest', () => {
    const root = render('laser-jade-doily');
    const crest = root.querySelector('.inv__crest');
    expect(crest?.classList.contains('inv__crest--laser')).toBe(true);
    expect(crest?.querySelector('.inv__monogram--crest')?.textContent).toContain('V & T');
    expect(crest?.querySelector('app-ornament path[fill-rule="evenodd"]')).toBeTruthy();
  });

  it('renders every design with its layout and the full copy', () => {
    for (const design of INVITATION_DESIGNS) {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.design = design;
      fixture.detectChanges();

      const card: HTMLElement | null = fixture.nativeElement.querySelector('.inv');
      expect(card?.className).toContain(`inv--${design.layout}`);
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Vũ & Thảo');
      expect(text).toContain('TRÂN TRỌNG KÍNH MỜI');
      expect(text).toContain('Ông / Bà:');
      expect(text).toContain('cùng gia đình');
      expect(text).toContain('Riverside Palace');
      fixture.destroy();
    }
  });
});
