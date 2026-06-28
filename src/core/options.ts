import type { MuscleMapOptions } from './types';

// One source of truth for the option keys wrappers forward to the engine. The
// `satisfies Record<keyof MuscleMapOptions, 1>` makes it EXHAUSTIVE: add an
// option to MuscleMapOptions and forget it here and this fails to compile.
const OPTION_KEY_SET = {
  view: 1,
  gender: 1,
  theme: 1,
  highlights: 1,
  width: 1,
  height: 1,
  color: 1,
  blendMode: 1,
  hoverHighlight: 1,
  hoverIntensity: 1,
  hoverColor: 1,
  bodySrc: 1,
  registry: 1,
  className: 1,
  onMuscleEnter: 1,
  onMuscleLeave: 1,
  onMuscleClick: 1,
} satisfies Record<keyof MuscleMapOptions, 1>;

/** Every {@link MuscleMapOptions} key, for wrappers to forward exhaustively. */
export const MUSCLE_MAP_OPTION_KEYS = Object.keys(OPTION_KEY_SET) as Array<keyof MuscleMapOptions>;

/** Copy just the engine options out of a wider props object. */
export function pickOptions(source: Record<string, unknown>): MuscleMapOptions {
  const out: Record<string, unknown> = {};
  for (const key of MUSCLE_MAP_OPTION_KEYS) out[key] = source[key];
  return out as MuscleMapOptions;
}
