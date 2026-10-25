import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import qrcode from 'qrcode-generator';
import { getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { InvitationDesign, Lang } from '../data/wedding.types';
import { qrArt } from '../geometry/qr';
import { MAP_H, MAP_STOPS, MAP_W, labelWidth, venueMap } from '../geometry/venue-map';
import { DirectionsCardComponent } from './directions-card.component';

@Component({
  template: '<app-directions-card [design]="design" [copy]="copy" />',
  standalone: false,
})
class HostComponent {
  design = getDesignById('press-red-foil') as InvitationDesign;
  copy = buildWording(WEDDING_CONFIG);
}

describe('directions card', () => {
  beforeEach(() => TestBed.configureTestingModule({ declarations: [HostComponent, DirectionsCardComponent] }));

  function render(lang: Lang = 'vi') {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.copy = buildWording(WEDDING_CONFIG, lang);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('prints the venue, the hall, the address and the time', () => {
    const root = render();
    expect(root.querySelector('.dc__kicker')?.textContent).toContain('Đường đến tiệc cưới');
    expect(root.querySelector('.dc__venue')?.textContent).toContain('Riverside Palace');
    expect(root.querySelector('.dc__hall')?.textContent).toContain('Tại Sảnh Danube');
    expect(root.querySelector('.dc__address')?.textContent).toContain('360D Bến Vân Đồn');
    expect(root.querySelector('.dc__time')?.textContent).toContain('18 giờ 00 · Chủ Nhật · 28 · 03 · 2027');
    expect(render('en').querySelector('.dc__hall')?.textContent).toContain('Danube Hall');
  });

  it('carries a QR code for the venue on Google Maps, and the sketch map', () => {
    const root = render();
    const qr = root.querySelector('.dc__qr-dots')?.getAttribute('d') ?? '';
    expect(qr).toBe(qrArt(WEDDING_CONFIG.venue.mapsShareUrl).d);
    expect(root.querySelector('.dc__qr')?.getAttribute('aria-label')).toBe('Quét mã để mở Google Maps');
    const labels = Array.from(root.querySelectorAll('.dc__label')).map((el) => el.textContent?.trim());
    expect(labels).toEqual(expect.arrayContaining(['Cầu Ông Lãnh', 'Cầu Calmette', 'Cầu Nguyễn Văn Cừ', 'Riverside Palace']));
  });

  it('encodes exactly the module pattern of the URL', () => {
    const url = WEDDING_CONFIG.venue.mapsShareUrl;
    const art = qrArt(url);
    const ref = qrcode(0, 'M');
    ref.addData(url, 'Byte');
    ref.make();
    expect(art.size).toBe(ref.getModuleCount());
    // Count dark modules from the runs in the path.
    const dark = [...art.d.matchAll(/h(\d+)v1/g)].reduce((sum, m) => sum + Number(m[1]), 0);
    let expected = 0;
    for (let r = 0; r < art.size; r++) {
      for (let c = 0; c < art.size; c++) {
        expected += ref.isDark(r, c) ? 1 : 0;
      }
    }
    expect(dark).toBe(expected);
  });

  it('places the venue between cầu Nguyễn Văn Cừ and cầu Ông Lãnh, and keeps labels in the box', () => {
    expect(MAP_STOPS.nguyenVanCu).toBeLessThan(MAP_STOPS.venue);
    expect(MAP_STOPS.venue).toBeLessThan(MAP_STOPS.ongLanh);
    expect(MAP_STOPS.ongLanh).toBeLessThan(MAP_STOPS.calmette);
    const map = venueMap();
    // Pin on the Quận 4 (south-east) bank: below and right of the canal line.
    expect(map.pin.y).toBeGreaterThan(150);
    for (const label of map.labels.filter((l) => l.angle === 0)) {
      expect(label.at.x - labelWidth(label.text) / 2).toBeGreaterThanOrEqual(0);
      expect(label.at.x + labelWidth(label.text) / 2).toBeLessThanOrEqual(MAP_W);
      expect(label.at.y).toBeGreaterThan(0);
      expect(label.at.y).toBeLessThan(MAP_H);
    }
  });
});
