import qrcode from 'qrcode-generator';

export interface QrArt {
  /** One path of dark modules, in module units (one unit = one module). */
  d: string;
  /** Modules per side, quiet zone excluded. */
  size: number;
}

const cache = new Map<string, QrArt>();

/**
 * A QR code for `text` as SVG path data. Error correction M (15 %) keeps
 * the code small enough to print at ~2.5 cm while surviving foil and
 * textured paper. Runs of dark modules in a row become one rectangle.
 */
export function qrArt(text: string): QrArt {
  let art = cache.get(text);
  if (!art) {
    const qr = qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();
    const size = qr.getModuleCount();
    let d = '';
    for (let row = 0; row < size; row++) {
      let col = 0;
      while (col < size) {
        if (!qr.isDark(row, col)) {
          col++;
          continue;
        }
        const start = col;
        while (col < size && qr.isDark(row, col)) {
          col++;
        }
        d += `M${start} ${row}h${col - start}v1h${start - col}Z`;
      }
    }
    art = { d, size };
    cache.set(text, art);
  }
  return art;
}
