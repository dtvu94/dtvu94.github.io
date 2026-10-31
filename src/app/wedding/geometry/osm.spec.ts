import { geocode, googleMapsUrl, parseCoords, tileView, worldPixel } from './osm';

describe('OpenStreetMap helpers', () => {
  it('projects to world pixels (Web Mercator)', () => {
    expect(worldPixel(0, 0, 0)).toEqual({ x: 128, y: 128 });
    const p = worldPixel(10.7557295, 106.6903722, 16);
    // Riverside Palace sits in tile 52190 / 30798 at zoom 16 (the slippy-map tile formula).
    expect(Math.floor(p.x / 256)).toBe(52190);
    expect(Math.floor(p.y / 256)).toBe(30798);
  });

  it('covers the whole frame with tiles and pins the point in the middle', () => {
    const view = tileView(10.7557295, 106.6903722, 16, 228, 284);
    expect(view.pin).toEqual({ x: 114, y: 142 });
    expect(view.tiles.length).toBeGreaterThanOrEqual(2);
    expect(view.tiles.length).toBeLessThanOrEqual(4);
    expect(Math.min(...view.tiles.map((t) => t.left))).toBeLessThanOrEqual(0);
    expect(Math.min(...view.tiles.map((t) => t.top))).toBeLessThanOrEqual(0);
    expect(Math.max(...view.tiles.map((t) => t.left + 256))).toBeGreaterThanOrEqual(228);
    expect(Math.max(...view.tiles.map((t) => t.top + 256))).toBeGreaterThanOrEqual(284);
    expect(view.tiles[0].url).toMatch(/^https:\/\/tile\.openstreetmap\.org\/16\/\d+\/\d+\.png$/);
  });

  it('reads coordinates typed by hand', () => {
    expect(parseCoords('10.7557, 106.6904')).toEqual([10.7557, 106.6904]);
    expect(parseCoords(' -33.86 ; 151.2 ')).toEqual([-33.86, 151.2]);
    expect(parseCoords('abc')).toBeNull();
    expect(parseCoords('95, 10')).toBeNull();
  });

  it('links to Google Maps by point, or by address', () => {
    expect(googleMapsUrl([10.75, 106.69], 'x')).toBe('https://www.google.com/maps/search/?api=1&query=10.75%2C106.69');
    expect(googleMapsUrl(null, 'Nhà hàng A, Q.1')).toContain('query=Nh%C3%A0%20h%C3%A0ng%20A%2C%20Q.1');
  });

  it('looks an address up on Nominatim', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '10.77', lon: '106.70', display_name: 'Nhà hàng A, Quận 1' }],
    });
    await expect(geocode('Nhà hàng A', fetcher as unknown as typeof fetch)).resolves.toEqual({ lat: 10.77, lng: 106.7, label: 'Nhà hàng A, Quận 1' });
    expect(fetcher.mock.calls[0][0]).toContain('nominatim.openstreetmap.org/search?format=jsonv2');
    const none = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    await expect(geocode('?', none as unknown as typeof fetch)).resolves.toBeNull();
  });
});
