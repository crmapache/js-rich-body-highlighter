import type { BodyView, Gender, MuscleDefinition, Theme } from '../data/types';
import { MUSCLES, getMuscles } from '../data/registry';
import { defaultBody } from '../assets';
import {
  DEFAULT_BLEND_MODE,
  DEFAULT_COLOR,
  DEFAULT_GENDER,
  DEFAULT_HOVER_INTENSITY,
  DEFAULT_THEME,
  DEFAULT_VIEW,
  PX2MM,
  SVG_NS,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  XLINK_NS,
} from './constants';
import type { MuscleMapOptions } from './types';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function cssDimension(value: number | string | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Framework-agnostic muscle map engine.
 *
 * Renders a body image plus an overlay of muscle masks inside a single `<svg>`.
 * Each mask is a `<path>` filled with the highlight color and blended over the
 * image with `mix-blend-mode` (default `multiply`), so the red settles into the
 * grooves of the illustration and the muscle looks lit from within rather than
 * painted flat. Intensity is the path's opacity.
 *
 * The image and all masks share one `viewBox`, so sizing the `<svg>` scales
 * everything together; masks never need their own scale transform.
 */
export class MuscleMap {
  private readonly container: HTMLElement;
  private options: MuscleMapOptions;
  private view: BodyView;
  private gender: Gender;
  private theme: Theme;

  private svg!: SVGSVGElement;
  private image!: SVGImageElement;
  private layer!: SVGGElement;

  private readonly paths = new Map<string, SVGPathElement>();
  private readonly appliedOpacity = new Map<string, number>();
  private hoveredId: string | null = null;
  private destroyed = false;

  constructor(container: HTMLElement, options: MuscleMapOptions = {}) {
    if (!container) throw new Error('[MuscleMap] a container element is required');
    this.container = container;
    this.options = { ...options };
    this.view = options.view ?? DEFAULT_VIEW;
    this.gender = options.gender ?? DEFAULT_GENDER;
    this.theme = options.theme ?? DEFAULT_THEME;
    this.mount();
  }

  /** The root `<svg>` element. */
  get element(): SVGSVGElement {
    return this.svg;
  }

  // --- public API ----------------------------------------------------------

  /**
   * Merge new options and apply the minimal DOM updates needed. Change detection
   * compares *resolved* values (option ?? default), so setting an option back to
   * `undefined` correctly reverts it to its default.
   */
  update(partial: Partial<MuscleMapOptions> = {}): void {
    if (this.destroyed) return;
    const prev = this.options;
    const next = { ...prev, ...partial };
    this.options = next;

    const nextView = next.view ?? DEFAULT_VIEW;
    const nextGender = next.gender ?? DEFAULT_GENDER;
    const nextTheme = next.theme ?? DEFAULT_THEME;

    const viewChanged = nextView !== this.view;
    const genderChanged = nextGender !== this.gender;
    const themeChanged = nextTheme !== this.theme;
    const registryChanged = (next.registry ?? MUSCLES) !== (prev.registry ?? MUSCLES);
    const bodyChanged = next.bodySrc !== prev.bodySrc;

    this.view = nextView;
    this.gender = nextGender;
    this.theme = nextTheme;

    // The set of paths depends on gender + view + registry.
    if (viewChanged || genderChanged || registryChanged) {
      this.renderPaths(); // re-applies color/blend/highlights for the new set
    } else {
      if ((next.color ?? DEFAULT_COLOR) !== (prev.color ?? DEFAULT_COLOR)) this.applyColor();
      if ((next.blendMode ?? DEFAULT_BLEND_MODE) !== (prev.blendMode ?? DEFAULT_BLEND_MODE)) {
        this.applyBlend();
      }
      this.applyHighlights();
    }

    if (viewChanged || genderChanged || themeChanged || bodyChanged) this.applyImage();
    if (next.width !== prev.width || next.height !== prev.height) this.applySize();
    if ((next.className ?? '') !== (prev.className ?? '')) this.applyClassName();
  }

  /** Remove the SVG and detach listeners. Fires a paired leave if still hovered. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearHovered();
    this.layer.removeEventListener('pointerover', this.onPointerOver);
    this.layer.removeEventListener('pointerout', this.onPointerOut);
    this.layer.removeEventListener('click', this.onClick);
    this.svg.remove();
    this.paths.clear();
    this.appliedOpacity.clear();
  }

  // --- build ---------------------------------------------------------------

  private mount(): void {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.display = 'block';
    // Isolate so `mix-blend-mode` blends masks against the body image only,
    // never against whatever is painted behind the <svg> on the page.
    svg.style.isolation = 'isolate';
    svg.style.aspectRatio = `${VIEWBOX_WIDTH} / ${VIEWBOX_HEIGHT}`;

    const image = document.createElementNS(SVG_NS, 'image');
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', String(VIEWBOX_WIDTH));
    image.setAttribute('height', String(VIEWBOX_HEIGHT));
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.appendChild(image);

    const layer = document.createElementNS(SVG_NS, 'g');
    layer.setAttribute('class', 'mm-muscle-layer');
    svg.appendChild(layer);

    this.svg = svg;
    this.image = image;
    this.layer = layer;

    layer.addEventListener('pointerover', this.onPointerOver);
    layer.addEventListener('pointerout', this.onPointerOut);
    layer.addEventListener('click', this.onClick);

    this.applyClassName();
    this.applySize();
    this.applyImage();
    this.renderPaths();

    this.container.appendChild(svg);
  }

  private get registry(): MuscleDefinition[] {
    return this.options.registry ?? MUSCLES;
  }

  private renderPaths(): void {
    this.clearHovered();
    this.layer.replaceChildren();
    this.paths.clear();
    this.appliedOpacity.clear();

    const color = this.options.color ?? DEFAULT_COLOR;
    const blend = this.options.blendMode ?? DEFAULT_BLEND_MODE;

    for (const muscle of getMuscles(this.gender, this.view, this.registry)) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', muscle.d);
      path.setAttribute('fill', color);
      path.setAttribute('data-muscle-id', muscle.id);
      const transform = offsetToTransform(muscle.offset);
      if (transform) path.setAttribute('transform', transform);
      path.style.mixBlendMode = blend;
      path.style.opacity = '0';
      path.style.cursor = 'pointer';
      this.layer.appendChild(path);
      this.paths.set(muscle.id, path);
      this.appliedOpacity.set(muscle.id, 0);
    }

    this.applyHighlights();
  }

  // --- granular appliers ---------------------------------------------------

  private applyImage(): void {
    const src = this.resolveBodySrc();
    this.image.setAttribute('href', src);
    this.image.setAttributeNS(XLINK_NS, 'xlink:href', src);
  }

  private applySize(): void {
    this.svg.style.width = cssDimension(this.options.width, '100%');
    this.svg.style.height = cssDimension(this.options.height, 'auto');
  }

  private applyClassName(): void {
    this.svg.setAttribute('class', this.options.className ?? '');
  }

  private applyColor(): void {
    const color = this.options.color ?? DEFAULT_COLOR;
    for (const path of this.paths.values()) path.setAttribute('fill', color);
  }

  private applyBlend(): void {
    const blend = this.options.blendMode ?? DEFAULT_BLEND_MODE;
    for (const path of this.paths.values()) path.style.mixBlendMode = blend;
  }

  private applyHighlights(): void {
    const intensities = this.highlightMap();
    const hoverOn = this.options.hoverHighlight ?? true;
    const hoverIntensity = this.options.hoverIntensity ?? DEFAULT_HOVER_INTENSITY;

    for (const [id, path] of this.paths) {
      const data = intensities.get(id) ?? 0;
      const hover = hoverOn && this.hoveredId === id ? hoverIntensity : 0;
      const intensity = clamp(Math.max(data, hover), 0, 100);
      this.setOpacity(id, path, intensity / 100);
    }
  }

  private setOpacity(id: string, path: SVGPathElement, opacity: number): void {
    if (this.appliedOpacity.get(id) === opacity) return;
    path.style.opacity = String(opacity);
    this.appliedOpacity.set(id, opacity);
  }

  private highlightMap(): Map<string, number> {
    const map = new Map<string, number>();
    for (const h of this.options.highlights ?? []) {
      // Merge duplicates by max so callers can't accidentally dim a muscle.
      map.set(h.id, Math.max(map.get(h.id) ?? 0, h.intensity));
    }
    return map;
  }

  private resolveBodySrc(): string {
    const src = this.options.bodySrc;
    if (typeof src === 'string') return src;
    if (src && typeof src === 'object') {
      const v = src[this.view];
      if (v) return v;
    }
    return defaultBody(this.gender, this.view, this.theme);
  }

  // --- events --------------------------------------------------------------

  /** Clear hover state, firing a paired onMuscleLeave if one was active. */
  private clearHovered(event?: MouseEvent): void {
    if (this.hoveredId === null) return;
    const prev = this.hoveredId;
    this.hoveredId = null;
    this.options.onMuscleLeave?.(prev, event);
  }

  private setHovered(id: string | null, event?: MouseEvent): void {
    if (id === this.hoveredId) return;
    const prev = this.hoveredId;
    this.hoveredId = id;
    if (prev !== null) this.options.onMuscleLeave?.(prev, event);
    if (id !== null) this.options.onMuscleEnter?.(id, event);
    if (this.options.hoverHighlight ?? true) this.applyHighlights();
  }

  private readonly onPointerOver = (event: PointerEvent): void => {
    const el = (event.target as Element | null)?.closest('[data-muscle-id]');
    const id = el?.getAttribute('data-muscle-id') ?? null;
    if (id && id !== this.hoveredId) this.setHovered(id, event);
  };

  private readonly onPointerOut = (event: PointerEvent): void => {
    const related = event.relatedTarget as Element | null;
    const stillOnMuscle = related && related.closest && related.closest('[data-muscle-id]');
    if (!stillOnMuscle) this.setHovered(null, event);
  };

  private readonly onClick = (event: MouseEvent): void => {
    const el = (event.target as Element | null)?.closest('[data-muscle-id]');
    const id = el?.getAttribute('data-muscle-id');
    if (id) this.options.onMuscleClick?.(id, event);
  };
}

function offsetToTransform(offset: MuscleDefinition['offset']): string | null {
  if (!offset || (!offset.x && !offset.y)) return null;
  return `translate(${offset.x * PX2MM} ${offset.y * PX2MM})`;
}
