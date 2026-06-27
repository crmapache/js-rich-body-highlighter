import type { BodyView, Gender, Theme } from '../data/types';

// The 8 default bodies bundled with the package: male/female x front/back x
// light/dark, keyed `${gender}-${view}-${theme}`. Each is referenced via
// `new URL(..., import.meta.url)` so downstream bundlers (Vite/webpack5/Rollup)
// re-emit it; tsup copies them into dist/bodies. WebP keeps the whole set ~0.66 MB.
const BODIES: Record<string, string> = {
  'male-front-light': new URL('./bodies/male-front-light.webp', import.meta.url).href,
  'male-back-light': new URL('./bodies/male-back-light.webp', import.meta.url).href,
  'female-front-light': new URL('./bodies/female-front-light.webp', import.meta.url).href,
  'female-back-light': new URL('./bodies/female-back-light.webp', import.meta.url).href,
  'male-front-dark': new URL('./bodies/male-front-dark.webp', import.meta.url).href,
  'male-back-dark': new URL('./bodies/male-back-dark.webp', import.meta.url).href,
  'female-front-dark': new URL('./bodies/female-front-dark.webp', import.meta.url).href,
  'female-back-dark': new URL('./bodies/female-back-dark.webp', import.meta.url).href,
};

/** All bundled body image URLs, keyed `${gender}-${view}-${theme}`. */
export const DEFAULT_BODIES: Readonly<Record<string, string>> = BODIES;

/** Resolve the bundled body image for a gender/view/theme combination. */
export function defaultBody(gender: Gender, view: BodyView, theme: Theme): string {
  return BODIES[`${gender}-${view}-${theme}`] ?? BODIES['male-front-light']!;
}
