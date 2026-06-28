export { MuscleMap } from './core/MuscleMap';
export type { MuscleMapOptions, Highlight, BodySrc, MuscleEventTarget } from './core/types';

export {
  PX2MM,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
  DEFAULT_COLOR,
  DEFAULT_BLEND_MODE,
  DEFAULT_VIEW,
  DEFAULT_GENDER,
  DEFAULT_THEME,
} from './core/constants';

export { MUSCLES, MUSCLE_GROUPS, getMuscle, getMuscles } from './data/registry';
export type {
  MuscleDefinition,
  MuscleGroup,
  MuscleSide,
  MuscleOffset,
  BodyView,
  Gender,
  Theme,
} from './data/types';

export { defaultBody, DEFAULT_BODIES } from './assets';
