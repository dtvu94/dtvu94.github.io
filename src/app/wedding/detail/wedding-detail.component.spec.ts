import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { DirectionsGuideComponent } from '../directions-guide/directions-guide.component';
import { InvitationCardComponent } from '../invitation-card/invitation-card.component';
import { LanguageService } from '../language.service';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { OrnamentComponent } from '../ornaments/ornament.component';
import { WeddingDetailComponent } from './wedding-detail.component';

describe('WeddingDetailComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  function setup(id: string) {
    TestBed.configureTestingModule({
      declarations: [
        WeddingDetailComponent,
        InvitationCardComponent,
        DirectionsGuideComponent,
        OrnamentComponent,
        LanguageToggleComponent,
      ],
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

  it('renders the full suite (invitation card + directions guide) for a valid id', () => {
    const fixture = setup('vn-sen-vang');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('app-invitation-card')).toBeTruthy();
    expect(root.querySelector('app-directions-guide')).toBeTruthy();
    expect(root.querySelector('.detail__name')?.textContent).toContain('Sen Vàng');
    expect(root.textContent).toContain('Riverside Palace');
    expect(root.textContent).toContain('TRÂN TRỌNG KÍNH MỜI');
    expect(root.textContent).toContain('cùng gia đình');
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
