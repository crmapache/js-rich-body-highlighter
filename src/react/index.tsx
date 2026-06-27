import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { MuscleMap as MuscleMapCore } from '../core/MuscleMap';
import type { MuscleMapOptions } from '../core/types';

export interface MuscleMapProps extends MuscleMapOptions {
  /** Class for the wrapper element. */
  className?: string;
  /** Inline style for the wrapper element. */
  style?: CSSProperties;
}

// Every option key is forwarded to the core engine. The `satisfies Record<...>`
// makes this EXHAUSTIVE: add an option to MuscleMapOptions and forget it here, and
// this fails to compile, so the wrapper can never silently drop a prop. `className`
// is deliberately excluded: in React it styles the wrapper element, not the <svg>.
const OPTION_KEY_SET = {
  view: true,
  gender: true,
  theme: true,
  highlights: true,
  width: true,
  height: true,
  color: true,
  blendMode: true,
  hoverHighlight: true,
  hoverIntensity: true,
  bodySrc: true,
  registry: true,
  onMuscleEnter: true,
  onMuscleLeave: true,
  onMuscleClick: true,
} satisfies Record<Exclude<keyof MuscleMapOptions, 'className'>, true>;

const OPTION_KEYS = Object.keys(OPTION_KEY_SET) as Array<keyof typeof OPTION_KEY_SET>;

function toOptions(props: MuscleMapProps): MuscleMapOptions {
  const out: MuscleMapOptions = {};
  for (const key of OPTION_KEYS) {
    // Forward every key, including `undefined`, so the engine can reset a prop
    // to its default when it goes from a value back to undefined (declarative).
    (out as Record<string, unknown>)[key] = props[key];
  }
  return out;
}

/**
 * Thin React wrapper around the framework-agnostic {@link MuscleMapCore}. It owns
 * no render logic: it creates the engine on mount, pushes prop changes through
 * `update()`, and tears the engine down on unmount.
 */
export function MuscleMap(props: MuscleMapProps): ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MuscleMapCore | null>(null);
  const latestProps = useRef(props);
  latestProps.current = props;

  // Create once, destroy on unmount.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const map = new MuscleMapCore(host, toOptions(latestProps.current));
    mapRef.current = map;
    return () => {
      map.destroy();
      mapRef.current = null;
    };
  }, []);

  // Sync prop changes. `update()` diffs internally, so running on every render
  // is cheap and keeps callbacks fresh without re-subscribing.
  useEffect(() => {
    mapRef.current?.update(toOptions(props));
  });

  return <div ref={hostRef} className={props.className} style={props.style} />;
}

export type { MuscleMapOptions, Highlight, BodySrc } from '../core/types';
export type {
  MuscleDefinition,
  MuscleGroup,
  MuscleSide,
  MuscleOffset,
  BodyView,
  Gender,
  Theme,
} from '../data/types';
export { MUSCLES, getMuscle, getMuscles } from '../data/registry';
