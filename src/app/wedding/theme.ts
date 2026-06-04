import { InvitationDesign } from './data/wedding.types';

/**
 * Builds the inline style string that projects a design's palette and fonts
 * onto the `--inv-*` CSS custom properties consumed by the invitation card
 * and the directions guide. Font keys resolve to the `--ff-*` variables
 * declared globally in wedding-theme.css.
 */
export function invitationThemeStyle(design: InvitationDesign): string {
  const palette = design.palette;
  const fonts = design.fonts;
  return [
    `--inv-bg:${palette.bg}`,
    `--inv-surface:${palette.surface}`,
    `--inv-primary:${palette.primary}`,
    `--inv-accent:${palette.accent}`,
    `--inv-ink:${palette.ink}`,
    `--inv-font-display:var(--ff-${fonts.display})`,
    `--inv-font-body:var(--ff-${fonts.body})`,
    `--inv-font-accent:var(--ff-${fonts.accent ?? fonts.display})`,
  ].join(';');
}

/** Rough perceived-luminance check, used to keep page chrome readable on dark backdrops. */
export function isDarkColor(hex: string): boolean {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}
