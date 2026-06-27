import type { BodyView, MuscleDefinition } from './types';
import { FRONT_MUSCLES } from './muscles/front';
import { BACK_MUSCLES } from './muscles/back';

/** The full default muscle registry (all views). */
export const MUSCLES: MuscleDefinition[] = [...FRONT_MUSCLES, ...BACK_MUSCLES];

const byId = new Map<string, MuscleDefinition>(MUSCLES.map((m) => [m.id, m]));

/** Look up a muscle definition by id in the default registry. */
export function getMuscle(id: string): MuscleDefinition | undefined {
  return byId.get(id);
}

/** All muscles for a given view, from `registry` (defaults to the built-in one). */
export function getMusclesByView(
  view: BodyView,
  registry: MuscleDefinition[] = MUSCLES,
): MuscleDefinition[] {
  return registry.filter((m) => m.view === view);
}
