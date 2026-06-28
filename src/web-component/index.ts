import { MuscleMap as Core } from '../core/MuscleMap';
import type { BodySrc, Highlight, MuscleEventTarget, MuscleMapOptions } from '../core/types';
import type { BodyView, Gender, MuscleDefinition, Theme } from '../data/types';

const OBSERVED = [
  'view',
  'gender',
  'theme',
  'color',
  'blend-mode',
  'width',
  'height',
  'hover-highlight',
  'hover-intensity',
  'hover-color',
];

/** `300` -> 300 (px), `50%`/`20rem` -> kept as a CSS string. */
function dimension(value: string): number | string {
  return /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
}

/**
 * `<muscle-map>` custom element — the universal wrapper. Works in plain HTML and
 * in any framework (Angular, Solid, Qwik, Astro, …). Simple values are attributes
 * (`gender`, `view`, `theme`, `color`, `hover-color`, `width`, …); complex values
 * are properties (`.highlights`, `.registry`, `.bodySrc`). Hover/click are emitted
 * as DOM `CustomEvent`s (`muscleenter` / `muscleleave` / `muscleclick`) whose
 * `detail` is `{ muscle, originalEvent }`.
 */
export class MuscleMapElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return OBSERVED;
  }

  private map: Core | null = null;
  private _highlights: Highlight[] = [];
  private _registry: MuscleDefinition[] | undefined;
  private _bodySrc: BodySrc | undefined;

  connectedCallback(): void {
    if (this.map) return;
    if (!this.style.display) this.style.display = 'block';
    this.map = new Core(this, this.options());
  }

  disconnectedCallback(): void {
    this.map?.destroy();
    this.map = null;
  }

  attributeChangedCallback(): void {
    this.map?.update(this.options());
  }

  get highlights(): Highlight[] {
    return this._highlights;
  }
  set highlights(value: Highlight[]) {
    this._highlights = value ?? [];
    this.map?.update({ highlights: this._highlights });
  }

  get registry(): MuscleDefinition[] | undefined {
    return this._registry;
  }
  set registry(value: MuscleDefinition[] | undefined) {
    this._registry = value;
    this.map?.update({ registry: value });
  }

  get bodySrc(): BodySrc | undefined {
    return this._bodySrc;
  }
  set bodySrc(value: BodySrc | undefined) {
    this._bodySrc = value;
    this.map?.update({ bodySrc: value });
  }

  private options(): MuscleMapOptions {
    const o: MuscleMapOptions = {
      highlights: this._highlights,
      registry: this._registry,
      bodySrc: this._bodySrc,
      onMuscleEnter: (m, e) => this.emit('muscleenter', m, e),
      onMuscleLeave: (m, e) => this.emit('muscleleave', m, e),
      onMuscleClick: (m, e) => this.emit('muscleclick', m, e),
    };
    const view = this.getAttribute('view');
    if (view) o.view = view as BodyView;
    const gender = this.getAttribute('gender');
    if (gender) o.gender = gender as Gender;
    const theme = this.getAttribute('theme');
    if (theme) o.theme = theme as Theme;
    const color = this.getAttribute('color');
    if (color) o.color = color;
    const blend = this.getAttribute('blend-mode');
    if (blend) o.blendMode = blend;
    const hoverColor = this.getAttribute('hover-color');
    if (hoverColor) o.hoverColor = hoverColor;
    const width = this.getAttribute('width');
    if (width !== null) o.width = dimension(width);
    const height = this.getAttribute('height');
    if (height !== null) o.height = dimension(height);
    if (this.hasAttribute('hover-highlight')) {
      o.hoverHighlight = this.getAttribute('hover-highlight') !== 'false';
    }
    const hoverIntensity = this.getAttribute('hover-intensity');
    if (hoverIntensity !== null) o.hoverIntensity = Number(hoverIntensity);
    return o;
  }

  private emit(type: string, muscle: MuscleEventTarget, originalEvent?: Event): void {
    this.dispatchEvent(new CustomEvent(type, { detail: { muscle, originalEvent }, bubbles: true }));
  }
}

/** Register the element (idempotent). Auto-runs on import for the common case. */
export function defineMuscleMapElement(tag = 'muscle-map'): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, MuscleMapElement);
  }
}

defineMuscleMapElement();

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
