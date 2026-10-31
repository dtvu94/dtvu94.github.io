import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { DirectionsGuideComponent } from '../directions-guide/directions-guide.component';
import { LanguageService } from '../language.service';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { SUITE_DECLARATIONS } from '../wedding.declarations';
import { WeddingDetailComponent, guestName } from './wedding-detail.component';

describe('WeddingDetailComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  function setup(id: string, query: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      declarations: [WeddingDetailComponent, DirectionsGuideComponent, LanguageToggleComponent, ...SUITE_DECLARATIONS],
      imports: [RouterModule.forRoot([])],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }), queryParamMap: convertToParamMap(query) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(WeddingDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the printed suite on top and the online card with directions below', () => {
    const root: HTMLElement = setup('vn-sen-vang').nativeElement;
    const sections = Array.from(root.querySelectorAll('.detail__section')).map((el) => el.querySelector('h2')?.textContent);
    expect(sections).toEqual(['Thiệp giấy', 'Thiệp online']);
    expect(root.querySelector('.detail__name')?.textContent).toContain('Sen Vàng');
    expect(root.querySelector('.detail__desc')?.textContent).toContain('Cắt bế · Truyền thống');

    // Paper: envelope front and back, invitation, directions card — no motion, no envelope buttons.
    const paper = root.querySelector('.detail__paper')!;
    expect(paper.querySelector('.paper__piece--envelopeFront .env__guest')?.textContent).toContain('Kính mời');
    expect(paper.querySelector('.paper__piece--card app-invitation-card')).toBeTruthy();
    expect(paper.querySelector('.paper__piece--directions app-directions-card')).toBeTruthy();
    expect(root.querySelector('app-suite')).toBeNull();

    // Online: the card without an envelope, next to the guide.
    const online = root.querySelector('.detail__online')!;
    expect(online.querySelector('app-online-card app-invitation-card')).toBeTruthy();
    expect(online.querySelector('app-envelope')).toBeNull();
    expect(online.querySelector('app-directions-guide')).toBeTruthy();
  });

  it('folds the directions guide by default — no map iframe until asked', () => {
    const fixture = setup('press-red-foil');
    const root: HTMLElement = fixture.nativeElement;
    const toggle = root.querySelector('.guide__toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toContain('Xem bản đồ và lộ trình');
    expect(root.querySelector('.detail__online iframe')).toBeNull();
    expect(root.querySelector('.guide__links a')).toBeTruthy();

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('.detail__online iframe')).toBeTruthy();
    expect(root.querySelectorAll('.guide__route').length).toBeGreaterThan(0);
    expect(root.querySelector(`#${toggle.getAttribute('aria-controls')}`)).toBeTruthy();
  });

  it('addresses the online card to the guest named in the link', () => {
    const root: HTMLElement = setup('press-red-foil', { khach: '  Anh   Minh ' }).nativeElement;
    expect(root.querySelector('.detail__online .inv__guest-name')?.textContent?.trim()).toBe('Anh Minh');
    // The printed cards keep a blank line to write on; the tip is for the couple only.
    expect(root.querySelector('.detail__paper .inv__guest-name')).toBeNull();
    expect(root.querySelector('.detail__tip')).toBeNull();
  });

  it('shows the couple how to personalise the link when no guest is named', () => {
    const root: HTMLElement = setup('press-red-foil').nativeElement;
    expect(root.querySelector('.detail__online .inv__guest-dots')).toBeTruthy();
    expect(root.querySelector('.detail__tip')?.textContent).toContain('/wedding/press-red-foil?khach=');
  });

  it('offers Google Maps and both calendar links on the online card', () => {
    const root: HTMLElement = setup('press-cotton').nativeElement;
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.online__btn'));
    expect(links.map((a) => a.textContent?.trim())).toEqual([
      '📍 Mở Google Maps',
      '📅 Lưu vào Google Calendar',
      '🗓️ Lưu vào lịch điện thoại',
    ]);
    expect(links[1].href).toContain('calendar.google.com');
    expect(links[1].href).toContain('20270328T110000Z%2F20270328T140000Z');
    expect(links[2].getAttribute('href')).toMatch(/^data:text\/calendar/);
    expect(links[2].getAttribute('download')).toBe('dam-cuoi-2027-03-28.ics');
  });

  it('renders both parts in Thai after switching language', () => {
    const fixture = setup('vn-sen-vang');
    TestBed.inject(LanguageService).setLang('th');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('main')?.getAttribute('lang')).toBe('th');
    expect(root.textContent).toContain('การ์ดกระดาษ');
    expect(root.textContent).toContain('การ์ดออนไลน์');
    expect(root.textContent).toContain('ขอเรียนเชิญ'); // card headline
    expect(root.textContent).toContain('สแกนเพื่อเปิด Google Maps'); // directions card
    expect(root.querySelector('.guide__toggle')?.textContent).toContain('ดูแผนที่และเส้นทาง');
  });

  describe('zoom viewer', () => {
    const viewer = (root: HTMLElement) => root.querySelector('app-zoom-viewer');
    const title = (root: HTMLElement) => root.querySelector('.zv__title')?.textContent?.replace(/\s+/g, ' ').trim();
    const transform = (root: HTMLElement) => (root.querySelector('.zv__canvas') as HTMLElement).style.transform;
    const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

    it('opens a printed piece from its magnifier button, steps through the pieces and closes on Esc', () => {
      const fixture = setup('press-red-foil');
      const root: HTMLElement = fixture.nativeElement;
      const buttons = root.querySelectorAll<HTMLButtonElement>('.paper__zoom');
      expect(buttons.length).toBe(root.querySelectorAll('.paper__piece').length);
      expect(buttons[0].getAttribute('aria-label')).toBe('Phóng to: Bao thư · mặt trước');
      expect(viewer(root)).toBeNull();

      root.querySelector<HTMLButtonElement>('.paper__piece--card .paper__zoom')!.click();
      fixture.detectChanges();
      const count = fixture.componentInstance.zoomItems().length;
      const cardAt = fixture.componentInstance.zoomItems().findIndex((item) => item.key === 'card');
      expect(title(root)).toBe(`${cardAt + 1} / ${count} Thiệp mời`);
      expect(root.querySelector('.zv')?.getAttribute('aria-label')).toBe('Xem chi tiết: Thiệp mời');
      // The same art as on the page, drawn at its design size.
      expect(root.querySelector('.zv__canvas app-paper-art app-invitation-card')).toBeTruthy();
      expect(document.documentElement.style.overflow).toBe('hidden');

      root.querySelector<HTMLButtonElement>('.zv__btn[aria-label="Tấm sau"]')!.click();
      fixture.detectChanges();
      expect(title(root)).toContain('Thiệp chỉ đường');
      expect(root.querySelector('.zv__canvas app-directions-card')).toBeTruthy();

      press('Escape');
      fixture.detectChanges();
      expect(viewer(root)).toBeNull();
      expect(document.documentElement.style.overflow).toBe('');
    });

    it('zooms in and out with the buttons and keys, never below the whole piece', () => {
      const fixture = setup('press-red-foil');
      const root: HTMLElement = fixture.nativeElement;
      root.querySelector<HTMLElement>('.paper__piece--envelopeFront .paper__zoomable')!.click();
      fixture.detectChanges();
      const level = () => root.querySelector('.zv__level')?.textContent?.trim();
      const fitted = transform(root);
      expect(level()).toBe('100%');

      root.querySelector<HTMLButtonElement>('.zv__btn[aria-label="Phóng to"]')!.click();
      expect(level()).toBe('150%');
      press('+');
      expect(level()).toBe('225%');
      expect(transform(root)).not.toBe(fitted);
      press('0');
      expect(level()).toBe('100%');
      expect(transform(root)).toBe(fitted);
      root.querySelector<HTMLButtonElement>('.zv__btn[aria-label="Thu nhỏ"]')!.click();
      expect(level()).toBe('100%');
    });

    it('wraps around from the last piece, the online card with the guest’s name', () => {
      const fixture = setup('press-red-foil', { khach: 'Anh Minh' });
      const root: HTMLElement = fixture.nativeElement;
      root.querySelector<HTMLButtonElement>('.online__zoom')!.click();
      fixture.detectChanges();
      const count = fixture.componentInstance.zoomItems().length;
      expect(title(root)).toBe(`${count} / ${count} Thiệp online`);
      expect(root.querySelector('.zv__canvas .inv__guest-name')?.textContent?.trim()).toBe('Anh Minh');

      root.querySelector<HTMLButtonElement>('.zv__btn[aria-label="Tấm sau"]')!.click();
      fixture.detectChanges();
      expect(title(root)).toBe(`1 / ${count} Bao thư · mặt trước`);

      root.querySelector<HTMLButtonElement>('.zv__top .zv__btn')!.click();
      fixture.detectChanges();
      expect(viewer(root)).toBeNull();
    });
  });

  it('redirects to the gallery for an unknown id', () => {
    TestBed.configureTestingModule({
      declarations: [WeddingDetailComponent, DirectionsGuideComponent, LanguageToggleComponent, ...SUITE_DECLARATIONS],
      imports: [RouterModule.forRoot([])],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'mau-khong-ton-tai' }), queryParamMap: convertToParamMap({}) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(WeddingDetailComponent);
    const navigateSpy = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/wedding']);
    expect(fixture.componentInstance.design()).toBeNull();
  });
});

describe('guestName', () => {
  it('tidies the name from the link and caps its length', () => {
    expect(guestName(null)).toBe('');
    expect(guestName('  Cô  Ba\n')).toBe('Cô Ba');
    expect(guestName('A\u0000B')).toBe('A B');
    expect(guestName('x'.repeat(200))).toHaveLength(60);
  });
});
