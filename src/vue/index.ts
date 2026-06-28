import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { PropType, Ref } from 'vue';
import { MuscleMap as Core } from '../core/MuscleMap';
import { pickOptions } from '../core/options';
import type { BodySrc, Highlight, MuscleEventTarget, MuscleMapOptions } from '../core/types';
import type { BodyView, Gender, MuscleDefinition, Theme } from '../data/types';

type MuscleHandler = (muscle: MuscleEventTarget, event?: MouseEvent) => void;

/**
 * Thin Vue 3 wrapper around the framework-agnostic engine. Props mirror
 * {@link MuscleMapOptions}; it owns no render logic, just creating, updating and
 * destroying the engine across the component lifecycle.
 */
export const MuscleMap = defineComponent({
  name: 'MuscleMap',
  props: {
    view: { type: String as PropType<BodyView>, default: undefined },
    gender: { type: String as PropType<Gender>, default: undefined },
    theme: { type: String as PropType<Theme>, default: undefined },
    highlights: { type: Array as PropType<Highlight[]>, default: undefined },
    width: { type: [Number, String], default: undefined },
    height: { type: [Number, String], default: undefined },
    color: { type: String, default: undefined },
    blendMode: { type: String, default: undefined },
    hoverHighlight: { type: Boolean, default: undefined },
    hoverIntensity: { type: Number, default: undefined },
    hoverColor: { type: String, default: undefined },
    bodySrc: { type: [String, Object] as PropType<BodySrc>, default: undefined },
    registry: { type: Array as PropType<MuscleDefinition[]>, default: undefined },
    className: { type: String, default: undefined },
    onMuscleEnter: { type: Function as PropType<MuscleHandler>, default: undefined },
    onMuscleLeave: { type: Function as PropType<MuscleHandler>, default: undefined },
    onMuscleClick: { type: Function as PropType<MuscleHandler>, default: undefined },
  },
  setup(props) {
    const host: Ref<HTMLDivElement | null> = ref(null);
    let map: Core | null = null;
    const toOptions = (): MuscleMapOptions =>
      pickOptions(props as unknown as Record<string, unknown>);

    onMounted(() => {
      if (host.value) map = new Core(host.value, toOptions());
    });
    watch(
      () => ({ ...props }),
      () => map?.update(toOptions()),
      { deep: true },
    );
    onBeforeUnmount(() => {
      map?.destroy();
      map = null;
    });

    return () => h('div', { ref: host, class: props.className });
  },
});

export default MuscleMap;
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
