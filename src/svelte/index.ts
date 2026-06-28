import { MuscleMap as Core } from '../core/MuscleMap';
import { pickOptions } from '../core/options';
import type { MuscleMapOptions } from '../core/types';

/**
 * Svelte action — use on any element:
 *
 * ```svelte
 * <script lang="ts">
 *   import { muscleMap } from 'js-rich-body-highlighter/svelte';
 *   let options = { gender: 'female', highlights: [{ group: 'chest', intensity: 70 }] };
 * </script>
 *
 * <div use:muscleMap={options}></div>
 * ```
 *
 * No Svelte runtime dependency — it's a plain action returning `{ update, destroy }`.
 */
export function muscleMap(
  node: HTMLElement,
  options: MuscleMapOptions = {},
): { update: (next?: MuscleMapOptions) => void; destroy: () => void } {
  const map = new Core(node, pickOptions(options as Record<string, unknown>));
  return {
    update(next: MuscleMapOptions = {}) {
      map.update(pickOptions(next as Record<string, unknown>));
    },
    destroy() {
      map.destroy();
    },
  };
}

export type { MuscleMapOptions, Highlight, BodySrc, MuscleEventTarget } from '../core/types';
export type {
  MuscleDefinition,
  MuscleGroup,
  MuscleSide,
  MuscleOffset,
  BodyView,
  Gender,
  Theme,
} from '../data/types';
export { MUSCLES, MUSCLE_GROUPS, getMuscle, getMuscles } from '../data/registry';
