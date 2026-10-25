let counter = 0;

/** Page-unique id for an inline SVG definition (filters, gradients, clips). */
export function uniqueSvgId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/**
 * `url(#id)` that survives `<base href="/">`: Safari and Firefox resolve
 * bare fragment references against the base URL rather than the page, so
 * deep links like /wedding/press-cotton would lose every filter. Prefix the
 * current path to keep the reference on this document.
 */
export function svgRef(id: string): string {
  const path = typeof window === 'undefined' ? '' : `${window.location.pathname}${window.location.search}`;
  return `url(${path}#${id})`;
}
