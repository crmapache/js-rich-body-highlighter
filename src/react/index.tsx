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

// Option keys forwarded to the core engine. `className`/`style` are intentionally
// excluded: they style the React wrapper element, not the inner <svg>.
const OPTION_KEYS = [
  'view',
  'highlights',
  'width',
  'height',
  'color',
  'blendMode',
  'hoverHighlight',
  'hoverIntensity',
  'bodySrc',
  'registry',
  'onMuscleEnter',
  'onMuscleLeave',
  'onMuscleClick',
] as const satisfies ReadonlyArray<keyof MuscleMapOptions>;

function toOptions(props: MuscleMapProps): MuscleMapOptions {
  const out: MuscleMapOptions = {};
  for (const key of OPTION_KEYS) {
    const value = props[key];
    if (value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
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

export type {
  MuscleMapOptions,
  Highlight,
  BodySrc,
} from '../core/types';
export type {
  MuscleDefinition,
  MuscleGroup,
  MuscleSide,
  MuscleOffset,
  BodyView,
} from '../data/types';
export { MUSCLES, getMuscle, getMusclesByView } from '../data/registry';
