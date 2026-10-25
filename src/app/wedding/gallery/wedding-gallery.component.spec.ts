import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { CARD_FORMS, hasWeddingPhoto } from '../data/categories';
import { INVITATION_DESIGNS } from '../data/designs';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { SUITE_DECLARATIONS } from '../wedding.declarations';
import { WeddingGalleryComponent } from './wedding-gallery.component';

describe('WeddingGalleryComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      declarations: [WeddingGalleryComponent, LanguageToggleComponent, ...SUITE_DECLARATIONS],
      imports: [RouterModule.forRoot([])],
    });
  });

  afterEach(() => localStorage.clear());

  function create() {
    const fixture = TestBed.createComponent(WeddingGalleryComponent);
    fixture.detectChanges();
    return fixture;
  }

  function click(fixture: ReturnType<typeof create>, selector: string) {
    (fixture.nativeElement.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  const suites = (fixture: ReturnType<typeof create>) => fixture.nativeElement.querySelectorAll('app-suite').length;

  it('renders every design as a suite preview — card on its envelope', () => {
    const fixture = create();
    expect(suites(fixture)).toBe(INVITATION_DESIGNS.length);
    expect(suites(fixture)).toBeGreaterThanOrEqual(20);
    const first: HTMLElement = fixture.nativeElement.querySelector('app-suite');
    expect(first.querySelectorAll('app-envelope').length).toBe(3);
  });

  it('defaults to Vietnamese: hero, date and lang attribute', () => {
    const root: HTMLElement = create().nativeElement;
    expect(root.querySelector('main')?.getAttribute('lang')).toBe('vi');
    expect(root.querySelector('.gallery__script')?.textContent).toContain('Vũ & Thảo');
    expect(root.querySelector('.gallery__title')?.textContent).toContain('Chọn Mẫu Thiệp Cưới');
    expect(root.querySelector('.gallery__meta')?.textContent).toContain('28 tháng 03 năm 2027');
    expect(root.querySelector('.gallery__meta')?.textContent).toContain('Riverside Palace');
    expect(root.textContent).toContain('TRÂN TRỌNG KÍNH MỜI');
    expect(root.textContent).toContain('Kiểu thiệp');
    expect(root.textContent).toContain('Phong cách');
  });

  it('switches the whole page language from the top-right toggle', () => {
    const fixture = create();
    const root: HTMLElement = fixture.nativeElement;

    click(fixture, 'button[data-lang="en"]');
    expect(root.querySelector('main')?.getAttribute('lang')).toBe('en');
    expect(root.querySelector('.gallery__title')?.textContent).toContain('Choose Our Wedding Invitation');
    expect(root.querySelector('.gallery__meta')?.textContent).toContain('March 28th, 2027');
    expect(root.textContent).toContain('WE CORDIALLY INVITE YOU');
    expect(root.querySelector('button[data-form="letterpress"]')?.textContent).toContain('Letterpress & Emboss');

    click(fixture, 'button[data-lang="th"]');
    expect(root.querySelector('main')?.getAttribute('lang')).toBe('th');
    expect(root.querySelector('.gallery__meta')?.textContent).toContain('พ.ศ. 2570');
    expect(root.textContent).toContain('ขอเรียนเชิญ');
  });

  it('offers a chip for every format, each with designs', () => {
    const root: HTMLElement = create().nativeElement;
    for (const { id } of CARD_FORMS) {
      expect(INVITATION_DESIGNS.some((d) => d.form === id)).toBe(true);
      expect(root.querySelector(`button[data-form="${id}"]`)).toBeTruthy();
    }
  });

  it('previews folded cards, pop-ups and passports in 3-D, each with its envelope', () => {
    const root: HTMLElement = create().nativeElement;
    const count = (form: string) => INVITATION_DESIGNS.filter((d) => d.form === form).length;
    expect(root.querySelectorAll('app-suite app-folded').length).toBe(count('folded'));
    expect(root.querySelectorAll('app-suite app-popup').length).toBe(count('popup'));
    expect(root.querySelectorAll('app-suite app-passport').length).toBe(count('passport'));
    // Gallery poses: folds ajar, pop-ups standing, passports with the ticket peeking out.
    expect(root.querySelectorAll('app-folded.fd--ajar').length).toBe(count('folded'));
    expect(root.querySelectorAll('app-popup.pp--open').length).toBe(count('popup'));
    expect(root.querySelectorAll('app-passport.ps--peek').length).toBe(count('passport'));
  });

  it('narrows to designs with a frame for the wedding photo, combined with the rows', () => {
    const fixture = create();
    const withPhoto = INVITATION_DESIGNS.filter(hasWeddingPhoto);
    expect(withPhoto.length).toBeGreaterThanOrEqual(10);
    const toggle = () => fixture.nativeElement.querySelector('button[data-photo]') as HTMLButtonElement;
    expect(toggle().textContent).toContain('Có ảnh cưới');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');

    click(fixture, 'button[data-photo]');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
    expect(suites(fixture)).toBe(withPhoto.length);

    click(fixture, 'button[data-form="folded"]');
    expect(suites(fixture)).toBe(withPhoto.filter((d) => d.form === 'folded').length);
    expect(suites(fixture)).toBeGreaterThan(0);

    click(fixture, 'button[data-photo]');
    expect(suites(fixture)).toBe(INVITATION_DESIGNS.filter((d) => d.form === 'folded').length);
  });

  it('filters by format and by style, and combines both rows', () => {
    const fixture = create();
    const expected = (form?: string, style?: string) =>
      INVITATION_DESIGNS.filter((d) => (!form || d.form === form) && (!style || d.style === style)).length;

    click(fixture, 'button[data-form="pocket"]');
    expect(suites(fixture)).toBe(expected('pocket'));

    click(fixture, 'button[data-style="vietnamese"]');
    expect(suites(fixture)).toBe(expected('pocket', 'vietnamese'));
    expect(suites(fixture)).toBeGreaterThan(0);

    click(fixture, 'button[data-form="all"]');
    expect(suites(fixture)).toBe(expected(undefined, 'vietnamese'));
  });

  it("counts each chip's designs given the other row's choice", () => {
    const fixture = create();
    const count = (selector: string) =>
      Number(fixture.nativeElement.querySelector(`${selector} .chip__count`)?.textContent?.trim());

    expect(count('button[data-style="vietnamese"]')).toBe(INVITATION_DESIGNS.filter((d) => d.style === 'vietnamese').length);
    click(fixture, 'button[data-form="lasercut"]');
    expect(count('button[data-style="vietnamese"]')).toBe(
      INVITATION_DESIGNS.filter((d) => d.style === 'vietnamese' && d.form === 'lasercut').length,
    );
    expect(count('button[data-form="all"]')).toBe(INVITATION_DESIGNS.length);
  });

  it('shows an empty state with a reset when nothing matches', () => {
    const fixture = create();
    click(fixture, 'button[data-form="pocket"]');
    click(fixture, 'button[data-style="artdeco"]');
    expect(suites(fixture)).toBe(0);
    expect(fixture.nativeElement.querySelector('.gallery__empty')?.textContent).toContain('Chưa có mẫu nào');

    click(fixture, '.gallery__empty .chip');
    expect(suites(fixture)).toBe(INVITATION_DESIGNS.length);
  });

  it('links every preview to its detail page and tags its format and style', () => {
    const root: HTMLElement = create().nativeElement;
    const links: NodeListOf<HTMLAnchorElement> = root.querySelectorAll('a.gallery__link');
    expect(links.length).toBe(INVITATION_DESIGNS.length);
    expect(links[0].getAttribute('href')).toBe(`/wedding/${INVITATION_DESIGNS[0].id}`);
    expect(links[0].querySelectorAll('.gallery__tag').length).toBe(2);
  });
});
