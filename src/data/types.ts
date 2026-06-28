export type BodyView = 'front' | 'back';

export type Gender = 'male' | 'female';

export type Theme = 'light' | 'dark';

export type MuscleSide = 'left' | 'right' | null;

/**
 * Known muscle groups for grouping/filtering. Arbitrary strings are also
 * allowed (the `string & {}` keeps editor autocomplete for the known set).
 */
export type MuscleGroup =
  | 'chest'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'obliques'
  | (string & {});

/** Per-mask nudge in source image pixels (1px === PX2MM viewBox units). */
export interface MuscleOffset {
  x: number;
  y: number;
}

/**
 * One registry entry. Adding a muscle = adding one of these. The playground and
 * the component pick it up automatically, with no changes to render code.
 */
export interface MuscleDefinition {
  /** Unique id, e.g. `pectoralis_right`. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Group, used for grouping/filtering. */
  group: MuscleGroup;
  /** Which body the mask is drawn for (male and female anatomy differ). */
  gender: Gender;
  /** Anatomical side (the person's side), or null for midline muscles. */
  side: MuscleSide;
  /** Which body view this mask belongs to. */
  view: BodyView;
  /** SVG path data, authored in the body viewBox coordinate system. */
  d: string;
  /** Optional fine-tuning nudge, in source-image pixels. */
  offset?: MuscleOffset;
}
