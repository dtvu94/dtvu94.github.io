import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { DirectionsGuideComponent } from '../directions-guide/directions-guide.component';
import { LanguageService } from '../language.service';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { SUITE_DECLARATIONS } from '../wedding.declarations';
import { WeddingDetailComponent } from './wedding-detail.component';

describe('WeddingDetailComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  function setup(id: string) {
    TestBed.configureTestingModule({
      declarations: [WeddingDetailComponent, DirectionsGuideComponent, LanguageToggleComponent, ...SUITE_DECLARATIONS],
      imports: [RouterModule.forRoot([])],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    });
    return TestBed.createComponent(WeddingDetailComponent);
  }

  const action = (root: HTMLElement) => root.querySelector('.detail__action--primary') as HTMLButtonElement | null;

  it('renders the suite on a stage, sealed, next to the directions guide', () => {
    const fixture = setup('vn-sen-vang');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.detail__stage app-suite .suite--sealed')).toBeTruthy();
    expect(root.querySelector('app-directions-guide')).toBeTruthy();
    expect(root.querySelector('.detail__name')?.textContent).toContain('Sen Vàng');
    expect(root.querySelector('.detail__desc')?.textContent).toContain('Cắt bế · Truyền thống');
    expect(root.textContent).toContain('Riverside Palace');
    expect(root.textContent).toContain('TRÂN TRỌNG KÍNH MỜI');
    expect(action(root)?.textContent).toContain('Mở thiệp');
  });

  it('opens the envelope and brings the card out, then puts it back', fakeAsync(() => {
    const fixture = setup('press-cotton');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    action(root)?.click();
    fixture.detectChanges();
    expect(root.querySelector('.suite--opened')).toBeTruthy();
    expect(root.querySelector('app-envelope.env--flap.env--open')).toBeTruthy();

    tick(1600);
    fixture.detectChanges();
    expect(root.querySelector('.suite--out.suite--front')).toBeTruthy();
    // A flat card has no inside: only "back in the envelope" is offered.
    expect(action(root)).toBeNull();

    (root.querySelector('.detail__action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('.suite--opened.suite--dir-in')).toBeTruthy();
    tick(1000);
    fixture.detectChanges();
    expect(root.querySelector('.suite--sealed')).toBeTruthy();
    expect(root.querySelector('app-envelope.env--flap.env--open')).toBeNull();
  }));

  it('draws a pocketed card out of its sleeve', fakeAsync(() => {
    const fixture = setup('modern-sage');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    action(root)?.click();
    tick(1600);
    fixture.detectChanges();
    expect(action(root)?.textContent).toContain('Xem bên trong');

    action(root)?.click();
    fixture.detectChanges();
    expect(root.querySelector('.suite--unfolded app-pocket.pk--out')).toBeTruthy();
    expect(action(root)?.textContent).toContain('Cất thiệp lại');
  }));

  it('advances when the stage itself is tapped', fakeAsync(() => {
    const fixture = setup('modern-sage');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    (root.querySelector('.detail__stage') as HTMLElement).click();
    fixture.detectChanges();
    expect(root.querySelector('.suite--opened')).toBeTruthy();
    tick(1600);
  }));

  it('keeps a flat copy of the card for printing', () => {
    const fixture = setup('press-cotton');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detail__print app-invitation-card')).toBeTruthy();
  });

  it('renders the suite in Thai after switching language', () => {
    const fixture = setup('vn-sen-vang');
    fixture.detectChanges();

    TestBed.inject(LanguageService).setLang('th');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('main')?.getAttribute('lang')).toBe('th');
    expect(root.textContent).toContain('ขอเรียนเชิญ'); // card headline
    expect(root.textContent).toContain('พร้อมครอบครัว'); // guest "with family" suffix
    expect(root.textContent).toContain('การเดินทาง'); // directions kicker
    expect(action(root)?.textContent).toContain('เปิดการ์ด');
  });

  it('redirects to the gallery for an unknown id', () => {
    const fixture = setup('mau-khong-ton-tai');
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/wedding']);
    expect(fixture.componentInstance.design()).toBeNull();
  });
});
