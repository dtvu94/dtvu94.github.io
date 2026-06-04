// GitHub Pages SPA fallback: Pages serves docs/404.html for unknown paths.
// A byte-copy of index.html boots the Angular app so deep links like
// /wedding/sen-vang resolve client-side. Runs automatically via `postbuild`
// (CI does not build — docs/ is a committed artifact).
import { copyFileSync } from 'node:fs';

copyFileSync('docs/index.html', 'docs/404.html');
console.log('docs/404.html created (SPA fallback).');
