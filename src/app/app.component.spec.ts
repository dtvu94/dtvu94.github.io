import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    declarations: [AppComponent]
  }));

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the CV hero with name and role', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.hero__name')?.textContent).toContain('Vu Dang');
    expect(root.querySelector('.hero__role')?.textContent).toContain('Senior Software Engineer');
  });

  it('renders every experience entry', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.timeline__item');
    expect(items.length).toBe(fixture.componentInstance.experience.length);
  });

  it('exposes a LinkedIn URL on the contact row', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href*="linkedin.com"]');
    expect(link).toBeTruthy();
  });
});
