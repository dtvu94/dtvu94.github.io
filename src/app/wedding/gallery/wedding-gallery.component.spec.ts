import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { INVITATION_DESIGNS } from '../data/designs';
import { InvitationCardComponent } from '../invitation-card/invitation-card.component';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { OrnamentComponent } from '../ornaments/ornament.component';
import { WeddingGalleryComponent } from './wedding-gallery.component';

describe('WeddingGalleryComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      declarations: [
        WeddingGalleryComponent,
        InvitationCardComponent,
        OrnamentComponent,
        LanguageToggleComponent,
      ],
      imports: [RouterModule.forRoot([])],
    });
  });

  afterEach(() => localStorage.clear());

  function create() {
    const fixture = TestBed.createComponent(WeddingGalleryComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders all 24 invitation previews (at least 20 required)', () => {
    const cards = create().nativeElement.querySelectorAll('app-invitation-card');
    expect(cards.length).toBe(INVITATION_DESIGNS.length);
    expect(cards.length).toBeGreaterThanOrEqual(20);
  });

  it('defaults to Vietnamese: hero, date and lang attribute', () => {
    const root: HTMLElement = create().nativeElement;
    expect(root.querySelector('main')?.getAttribute('lang')).toBe('vi');
    expect(root.querySelector('.gallery__script')?.textContent).toContain('Vũ & Thảo');
    expect(root.querySelector('.gallery__title')?.textContent).toContain('Chọn Mẫu Thiệp Cưới');
    expect(root.querySelector('.gallery__meta')?.textContent).toContain('28 tháng 03 năm 2027');
    expect(root.textContent).toContain('TRÂN TRỌNG KÍNH MỜI');
  });

  it('switches the whole page language from the top-right toggle', () => {
    const fixture = create();
    const root: HTMLElement = fixture.nativeElement;

    (root.querySelector('button[data-lang="en"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('main')?.getAttribute('lang')).toBe('en');
    expect(root.querySelector('.gallery__title')?.textContent).toContain('Choose Our Wedding Invitation');
    expect(root.querySelector('.gallery__meta')?.textContent).toContain('March 28th, 2027');
    expect(root.textContent).toContain('WE CORDIALLY INVITE YOU');

    (root.querySelector('button[data-lang="th"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('main')?.getAttribute('lang')).toBe('th');
    expect(root.querySelector('.gallery__meta')?.textContent).toContain('พ.ศ. 2570');
    expect(root.textContent).toContain('ขอเรียนเชิญ');
  });

  it('filters the grid by category', () => {
    const fixture = create();
    fixture.componentInstance.setCategory('vietnamese');
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-invitation-card');
    const expected = INVITATION_DESIGNS.filter((design) => design.category === 'vietnamese').length;
    expect(cards.length).toBe(expected);
  });

  it('links every preview to its detail page', () => {
    const links: NodeListOf<HTMLAnchorElement> = create().nativeElement.querySelectorAll('a.gallery__link');
    expect(links.length).toBe(INVITATION_DESIGNS.length);
    expect(links[0].getAttribute('href')).toBe(`/wedding/${INVITATION_DESIGNS[0].id}`);
  });
});
