import type { BodyView, Gender, MuscleDefinition, MuscleGroup, Theme } from '../data/types';

export interface Highlight {
  /** Target one registry mask by its id. */
  id?: string;
  /**
   * Or target a whole muscle group (e.g. `'chest'`) — lights up every mask of
   * that group in the current gender + view. Most callers think in groups.
   */
  group?: MuscleGroup;
  /** 0–100. Mapped to layer opacity (0 = invisible, 100 = full strength). */
  intensity: number;
  /** Per-highlight color. Falls back to the global `color` option. */
  color?: string;
}

/** Identifies the muscle behind a hover/click event. */
export interface MuscleEventTarget {
  /** Registry mask id (e.g. `'pectoralis_female'`). */
  id: string;
  /** Muscle group (e.g. `'chest'`). */
  group: MuscleGroup;
  /** Human-readable name (e.g. `'Pectoralis major'`). */
  name: string;
}

/**
 * Body image source override. A single string is used for the currently shown
 * view; pass `{ front, back }` to set both. When set, it wins over the bundled
 * gender/theme default.
 */
export type BodySrc = string | Partial<Record<BodyView, string>>;

export interface MuscleMapOptions {
  /** Which view to render. Default `'front'`. */
  view?: BodyView;
  /** Which body to render. Default `'male'`. */
  gender?: Gender;
  /** Light or dark body illustration. Default `'light'`. */
  theme?: Theme;
  /** Data-driven highlights. */
  highlights?: Highlight[];
  /** Width of the map: number (px) or CSS string. Default `'100%'`. */
  width?: number | string;
  /** Height. Default `'auto'` (derived from the body aspect ratio). */
  height?: number | string;
  /** Highlight color. Default red (`#ff0000`). */
  color?: string;
  /** CSS blend mode for the highlight layer. Default `'multiply'`. */
  blendMode?: string;
  /** Whether hovering a muscle highlights it. Default `true`. */
  hoverHighlight?: boolean;
  /** Intensity (0–100) applied on hover. Default `35`. */
  hoverIntensity?: number;
  /** Override the body image(s). Defaults to the bundled illustration. */
  bodySrc?: BodySrc;
  /** Custom registry. Defaults to the built-in `MUSCLES`. */
  registry?: MuscleDefinition[];
  /** Extra class applied to the root `<svg>`. */
  className?: string;
  /** Fires when the pointer enters a muscle (no event when fired programmatically). */
  onMuscleEnter?: (muscle: MuscleEventTarget, event?: MouseEvent) => void;
  /** Fires when a muscle is left, incl. on view/gender/registry change while hovered. */
  onMuscleLeave?: (muscle: MuscleEventTarget, event?: MouseEvent) => void;
  /** Fires on click of a muscle. */
  onMuscleClick?: (muscle: MuscleEventTarget, event: MouseEvent) => void;
}
