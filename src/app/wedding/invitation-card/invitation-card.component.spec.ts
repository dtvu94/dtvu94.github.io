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

  it('renders every one of the 24 designs with its layout and the full copy', () => {
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
