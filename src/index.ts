export { MuscleMap } from './core/MuscleMap';
export type { MuscleMapOptions, Highlight, BodySrc } from './core/types';

export {
  IMAGE_WIDTH_PX,
  IMAGE_HEIGHT_PX,
  PX2MM,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
  DEFAULT_COLOR,
  DEFAULT_BLEND_MODE,
  DEFAULT_VIEW,
} from './core/constants';

export { MUSCLES, getMuscle, getMusclesByView } from './data/registry';
export type {
  MuscleDefinition,
  MuscleGroup,
  MuscleSide,
  MuscleOffset,
  BodyView,
} from './data/types';

export { defaultBodyFront, defaultBodyBack } from './assets';
