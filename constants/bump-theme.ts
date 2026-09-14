/**
 * Shared visual tokens for Bump.
 *
 * `mint` is the one brand accent — teal/cyan rather than Spotify's green — used
 * everywhere from the audio visualiser to the dap action to match moments, so
 * the whole app reads as one consistent colour.
 */
export const BumpColors = {
  black: '#000000',
  charcoal: '#121212',
  surface: '#1A1A1A',
  raised: '#242424',
  border: '#282828',
  hairline: 'rgba(255,255,255,0.12)',

  white: '#FFFFFF',
  grey: '#A7A7A7',
  muted: '#777777',
  dim: 'rgba(255,255,255,0.66)',

  mint: '#6FFFB7',
  mintPressed: '#4FE49B',
  mintWash: 'rgba(111,255,183,0.14)',
  mintEdge: 'rgba(111,255,183,0.45)',

  /** Left-swipe / dismiss. Used sparingly — skipping should feel neutral. */
  skip: '#FF5A5F',
  skipWash: 'rgba(255,90,95,0.16)',

  scrim: 'rgba(0,0,0,0.64)',
  scrimHeavy: 'rgba(0,0,0,0.82)',
} as const;

/** Card chrome that several Match surfaces share. */
export const BumpRadii = {
  pill: 999,
  chip: 12,
  card: 16,
  sheet: 25,
} as const;

/**
 * Avatar tints. Artists have no uploaded images yet, so each one gets a stable
 * two-stop gradient derived from their id — recognisable without any assets.
 */
export const AVATAR_GRADIENTS: readonly (readonly [string, string])[] = [
  ['#1DB954', '#0B6E33'],
  ['#6FFFB7', '#1D8F72'],
  ['#4F8CFF', '#1B3A8F'],
  ['#B06BFF', '#4B2080'],
  ['#FF6B9D', '#8F1F46'],
  ['#FFB03A', '#8F5A0F'],
  ['#3AD8FF', '#0F5E7A'],
  ['#FF7A5A', '#8F2E1A'],
];

/** Picks a stable gradient for any string key (handle, id). */
export function gradientFor(key: string): readonly [string, string] {
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 100000;
  }

  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

/** Converts large numbers into short labels: 2418 -> "2.4k". */
export function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.0', '')}m`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace('.0', '')}k`;
  }

  return String(value);
}
