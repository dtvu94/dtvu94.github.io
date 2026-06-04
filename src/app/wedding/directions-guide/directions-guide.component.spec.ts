import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getDesignById } from '../data/designs';
import { MAPS_LINKS, getDirections } from '../data/directions';
import { InvitationDesign } from '../data/wedding.types';
import { DirectionsGuideComponent } from './directions-guide.component';

@Component({
  template: '<app-directions-guide [design]="design" />',
  standalone: false,
})
class HostComponent {
  design: InvitationDesign = getDesignById('modern-blush') as InvitationDesign;
}

describe('DirectionsGuideComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      declarations: [HostComponent, DirectionsGuideComponent],
    });
  });

  afterEach(() => localStorage.clear());

  it('shows the venue, the routes from District 1, and the live map links (Vietnamese default)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('Riverside Palace');
    expect(root.textContent).toContain('360D Bến Vân Đồn');
    expect(root.textContent).toContain('Quận 1');
    expect(root.querySelectorAll('.guide__route').length).toBe(getDirections('vi').routes.length);

    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.guide__links a')).map(
      (anchor) => anchor.href,
    );
    expect(links).toContain(MAPS_LINKS.openMapsUrl);
    expect(links).toContain(MAPS_LINKS.directionsUrl);

    expect(root.querySelector('iframe')?.getAttribute('src')).toBe(MAPS_LINKS.embedUrl);
  });
});
