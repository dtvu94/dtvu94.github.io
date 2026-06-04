import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component';
import { WeddingGalleryComponent } from './wedding/gallery/wedding-gallery.component';

describe('App routing', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [AppRoutingModule],
      declarations: [HomeComponent],
    }),
  );

  it('routes the root URL to the CV', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', HomeComponent);
    expect(harness.routeNativeElement?.querySelector('.hero__name')?.textContent).toContain('Vu Dang');
  });

  it('lazy loads the wedding gallery (24 previews) at /wedding', async () => {
    const harness = await RouterTestingHarness.create();
    const gallery = await harness.navigateByUrl('/wedding', WeddingGalleryComponent);
    expect(gallery).toBeTruthy();
    expect(harness.routeNativeElement?.querySelectorAll('app-invitation-card').length).toBe(24);
  });

  it('redirects unknown paths to the CV', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/duong-dan-khong-ton-tai', HomeComponent);
    expect(harness.routeNativeElement?.querySelector('.hero__name')).toBeTruthy();
  });
});
