import type { BodyView, MuscleDefinition } from '../data/types';
import { MUSCLES, getMusclesByView } from '../data/registry';
import { defaultBodyBack, defaultBodyFront } from '../assets';
import {
  DEFAULT_BLEND_MODE,
  DEFAULT_COLOR,
  DEFAULT_HOVER_INTENSITY,
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
    this.mount();
  }

  /** The root `<svg>` element. */
  get element(): SVGSVGElement {
    return this.svg;
  }

  // --- public API ----------------------------------------------------------

  /** Merge new options and apply the minimal DOM updates needed. */
  update(partial: Partial<MuscleMapOptions> = {}): void {
    if (this.destroyed) return;
    const prev = this.options;
    this.options = { ...prev, ...partial };

    const nextView = this.options.view ?? DEFAULT_VIEW;
    const viewChanged = nextView !== this.view;
    const registryChanged = 'registry' in partial && partial.registry !== prev.registry;
    const bodyChanged = 'bodySrc' in partial && partial.bodySrc !== prev.bodySrc;

    if (viewChanged) this.view = nextView;

    if (viewChanged || registryChanged) {
      this.renderPaths(); // rebuilds paths and re-applies color/blend/highlights
    } else {
      if (partial.color !== undefined && partial.color !== prev.color) this.applyColor();
      if (partial.blendMode !== undefined && partial.blendMode !== prev.blendMode) this.applyBlend();
      this.applyHighlights();
    }

    if (viewChanged || bodyChanged) this.applyImage();
    if (partial.width !== undefined || partial.height !== undefined) this.applySize();
    if (partial.className !== undefined && partial.className !== prev.className) this.applyClassName();
  }

  /** Remove the SVG and detach listeners. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.layer.removeEventListener('pointerover', this.onPointerOver);
    this.layer.removeEventListener('pointerout', this.onPointerOut);
    this.layer.removeEventListener('click', this.onClick);
    this.svg.remove();
    this.paths.clear();
    this.appliedOpacity.clear();
    this.hoveredId = null;
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
    this.layer.replaceChildren();
    this.paths.clear();
    this.appliedOpacity.clear();
    this.hoveredId = null;

    const color = this.options.color ?? DEFAULT_COLOR;
    const blend = this.options.blendMode ?? DEFAULT_BLEND_MODE;

    for (const muscle of getMusclesByView(this.view, this.registry)) {
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
    const src = this.resolveBodySrc(this.view);
    if (src) {
      this.image.setAttribute('href', src);
      this.image.setAttributeNS(XLINK_NS, 'xlink:href', src);
      this.image.style.removeProperty('display');
    } else {
      this.image.removeAttribute('href');
      this.image.removeAttributeNS(XLINK_NS, 'href');
      this.image.style.display = 'none';
    }
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

  private resolveBodySrc(view: BodyView): string | null {
    const src = this.options.bodySrc;
    if (typeof src === 'string') return src;
    if (src && typeof src === 'object') {
      const v = src[view];
      if (v) return v;
    }
    return view === 'front' ? defaultBodyFront : defaultBodyBack;
  }

  // --- events --------------------------------------------------------------

  private setHovered(id: string | null, event: MouseEvent): void {
    if (id === this.hoveredId) return;
    const prev = this.hoveredId;
    this.hoveredId = id;
    if (prev) this.options.onMuscleLeave?.(prev, event);
    if (id) this.options.onMuscleEnter?.(id, event);
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
