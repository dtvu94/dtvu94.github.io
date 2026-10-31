/**
 * OpenStreetMap helpers for a venue the hand-drawn map doesn't cover: the
 * standard map tiles around a point (Web Mercator, 256 px tiles) and links
 * that open the place in Google Maps.
 */

export const TILE_SIZE = 256;

export interface MapTile {
  url: string;
  /** Where the tile's top-left corner sits in the frame, in px. */
  left: number;
  top: number;
}

export interface TileView {
  tiles: MapTile[];
  /** The point itself, in frame px (the centre). */
  pin: { x: number; y: number };
}

/** World pixel of a latitude/longitude at a zoom level. */
export function worldPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/** The tiles that fill a w × h frame centred on lat/lng. */
export function tileView(lat: number, lng: number, zoom: number, w: number, h: number): TileView {
  const z = Math.round(Math.max(2, Math.min(19, zoom)));
  const centre = worldPixel(lat, lng, z);
  const left = centre.x - w / 2;
  const top = centre.y - h / 2;
  const count = 2 ** z;
  const tiles: MapTile[] = [];
  for (let ty = Math.floor(top / TILE_SIZE); ty <= Math.floor((top + h) / TILE_SIZE); ty++) {
    for (let tx = Math.floor(left / TILE_SIZE); tx <= Math.floor((left + w) / TILE_SIZE); tx++) {
      if (ty < 0 || ty >= count) {
        continue;
      }
      const wrapped = ((tx % count) + count) % count;
      tiles.push({
        url: `https://tile.openstreetmap.org/${z}/${wrapped}/${ty}.png`,
        left: Math.round(tx * TILE_SIZE - left),
        top: Math.round(ty * TILE_SIZE - top),
      });
    }
  }
  return { tiles, pin: { x: w / 2, y: h / 2 } };
}

/** "10.7557, 106.6904" (or with a space or semicolon) → [lat, lng], else null. */
export function parseCoords(text: string): [number, number] | null {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
  if (!m) {
    return null;
  }
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** A Google Maps link that opens the point (or the address when there is no point). */
export function googleMapsUrl(coords: [number, number] | null, query: string): string {
  const q = coords ? `${coords[0]},${coords[1]}` : query;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export interface GeocodeHit {
  lat: number;
  lng: number;
  label: string;
}

/** Looks an address up on OpenStreetMap (Nominatim); null when nothing is found. */
export async function geocode(query: string, fetcher: typeof fetch = fetch): Promise<GeocodeHit | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=vi&q=${encodeURIComponent(query)}`;
  const response = await fetcher(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Nominatim ${response.status}`);
  }
  const hits = (await response.json()) as { lat: string; lon: string; display_name: string }[];
  const hit = hits[0];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name } : null;
}
