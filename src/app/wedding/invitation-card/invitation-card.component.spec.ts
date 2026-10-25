import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { INVITATION_DESIGNS, getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign } from '../data/wedding.types';
import { CARD_DECLARATIONS } from '../wedding.declarations';
import { STOCK_TEXTURE } from '../geometry/patterns';
import { CardPart } from './invitation-card.component';

@Component({
  template: '<app-invitation-card [design]="design" [copy]="copy" [part]="part" />',
  standalone: false,
})
class HostComponent {
  design: InvitationDesign = getDesignById('classic-ivory') as InvitationDesign;
  copy = buildWording(WEDDING_CONFIG);
  part: CardPart = 'full';
}

describe('InvitationCardComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      declarations: [HostComponent, ...CARD_DECLARATIONS],
    }),
  );

  function render(id: string, part: CardPart = 'full') {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.design = getDesignById(id) as InvitationDesign;
    fixture.componentInstance.part = part;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('projects the palette and fonts as CSS variables on its host element', () => {
    const host = render('classic-ivory').querySelector('app-invitation-card');
    const style = host?.getAttribute('style') ?? '';
    expect(style).toContain('--inv-surface:#fdfbf6');
    expect(style).toContain('--inv-accent:#b69256');
    expect(style).toContain('--inv-font-display:var(--ff-playfair)');
    expect(style).toContain('--inv-font-accent:var(--ff-greatVibes)');
  });

  it('places the names directly after the event line, completing the sentence', () => {
    const root = render('classic-ivory');
    // "đến dự Lễ Thành Hôn của" must be immediately followed by "Vũ & Thảo".
    expect(root.querySelector('.inv__event + .inv__couple')?.textContent).toContain('Vũ & Thảo');
    const event = root.querySelector('.inv__event');
    expect(event?.textContent).toContain('đến dự Lễ Thành Hôn của');
    expect(event?.textContent).not.toContain('chúng tôi');
  });

  it('cuts die-cut silhouettes with a clip-path and pads the copy clear of the edge', () => {
    const scallop = render('modern-blush').querySelector('.inv') as HTMLElement;
    expect(scallop.style.clipPath).toContain('path(');
    expect(scallop.style.padding).toBe('10px');
    expect(scallop.className).toContain('inv--shape-scallop');

    // The doily is pierced, so it needs the even-odd rule.
    expect((render('classic-bordeaux').querySelector('.inv') as HTMLElement).style.clipPath).toContain('evenodd');
    // Plain rectangles are not clipped at all.
    expect((render('press-cotton').querySelector('.inv') as HTMLElement).style.clipPath).toBe('');
  });

  it('lays the paper stock texture over the card', () => {
    // (jsdom drops long data-URI backgrounds, so check the layer and its source.)
    expect(render('press-cotton').querySelector('.inv__stock')).toBeTruthy();
    expect(STOCK_TEXTURE.cotton).toContain('data:image/svg+xml');
    expect(render('modern-red').querySelector('.inv--stock-cotton')).toBeTruthy();
    expect(render('laser-red-lace').querySelector('.inv__stock')).toBeNull();
  });

  it('lights relief border art and relief crests with an SVG filter', () => {
    const root = render('press-blind-ivory');
    const relief = root.querySelector('app-relief');
    expect(relief).toBeTruthy();
    const group = relief?.querySelector('g[filter]');
    expect(group?.getAttribute('filter')).toMatch(/^url\(.*#relief-\d+\)$/);
    expect(relief?.querySelector('filter feDiffuseLighting')).toBeTruthy();
    // The laurel crest is lit by its own filter as well.
    expect(root.querySelector('.inv__crest app-ornament g[filter]')).toBeTruthy();

    // Foil relief uses the metallic (specular) model.
    expect(render('press-red-foil').querySelector('app-relief filter feSpecularLighting')).toBeTruthy();
    // No relief, no filters.
    expect(render('modern-blush').querySelector('[filter]')).toBeNull();
  });

  it('prints only the announcement on an "announce" face', () => {
    const root = render('vn-hong-phuc', 'announce');
    expect(root.querySelector('.inv__kicker')?.textContent).toContain('Lễ Thành Hôn');
    expect(root.querySelector('.inv__couple--hero')?.textContent).toContain('Vũ & Thảo');
    expect(root.querySelector('.inv__short-date')?.textContent).toContain('28 · 03 · 2027');
    expect(root.querySelector('.inv__venue-short')?.textContent).toContain('Riverside Palace');
    expect(root.querySelector('.inv__headline')).toBeNull();
    expect(root.querySelector('.inv__guest')).toBeNull();
  });

  it('prints the invitation without title or crest on an "invite" face', () => {
    const root = render('vn-hong-phuc', 'invite');
    expect(root.querySelector('.inv__headline')?.textContent).toContain('TRÂN TRỌNG KÍNH MỜI');
    expect(root.querySelector('.inv__title')).toBeNull();
    expect(root.querySelector('.inv__crest')).toBeNull();
  });

  it('lays the laser-cut jacket over the card as a single evenodd path', () => {
    const root = render('laser-red-lace');
    const sheet = root.querySelectorAll('svg.inv__laser path');
    expect(sheet.length).toBe(1);
    expect(sheet[0].getAttribute('fill-rule')).toBe('evenodd');
    expect(sheet[0].getAttribute('d')?.length).toBeGreaterThan(1000);
    expect(root.querySelector('app-invitation-card')?.getAttribute('style')).toContain('--inv-overlay:#d7151c');
  });

  it('prints line art on the blossom-branch jacket', () => {
    const root = render('floral-peony');
    expect(root.querySelector('svg.inv__laser path.inv__laser-print')).toBeTruthy();
  });

  it('renders no jacket for non-laser layouts and falls back to the accent as overlay', () => {
    const root = render('classic-ivory');
    expect(root.querySelector('.inv__laser')).toBeNull();
    expect(root.querySelector('app-invitation-card')?.getAttribute('style')).toContain('--inv-overlay:#b69256');
  });

  it('flags the print finish and dark paper on the card', () => {
    expect(render('press-cotton').querySelector('.inv')?.className).toContain('inv--fin-letterpress');
    expect(render('press-blind-ivory').querySelector('.inv')?.className).toContain('inv--fin-emboss');
    expect(render('modern-blush').querySelector('.inv')?.className).toContain('inv--fin-flat');

    expect(render('press-red-foil').querySelector('.inv')?.classList.contains('inv--dark-paper')).toBe(true);
    expect(render('press-cotton').querySelector('.inv')?.classList.contains('inv--dark-paper')).toBe(false);
  });

  it('cuts the monogram through the laser doily crest', () => {
    const crest = render('laser-jade-doily').querySelector('.inv__crest');
    expect(crest?.classList.contains('inv__crest--laser')).toBe(true);
    expect(crest?.querySelector('.inv__monogram--crest')?.textContent).toContain('V & T');
    expect(crest?.querySelector('app-ornament path[fill-rule="evenodd"]')).toBeTruthy();
  });

  it('draws the double-happiness crest as vector strokes', () => {
    const crest = render('press-red-foil').querySelector('.inv__crest app-ornament path');
    expect(crest?.getAttribute('d')?.split('M').length).toBeGreaterThan(20);
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
