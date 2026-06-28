import {
  MuscleMap,
  MUSCLES,
  getMuscles,
  PX2MM,
  type BodyView,
  type Gender,
  type Theme,
  type MuscleDefinition,
} from 'js-rich-body-highlighter';

const mapHost = document.getElementById('map') as HTMLDivElement;
const panel = document.getElementById('panel') as HTMLElement;

// Working copy of the registry so we can live-edit offsets/spread without
// touching the real source. `spread` is an authoring aid (see applySpread).
type EditMuscle = MuscleDefinition & { spread: number };

const registry: EditMuscle[] = MUSCLES.map((m) => ({
  ...m,
  offset: { x: m.offset?.x ?? 0, y: m.offset?.y ?? 0 },
  spread: 0,
}));

function subpathCount(d: string): number {
  return (d.match(/[Mm]/g) ?? []).length;
}

/**
 * Move the two symmetric halves of a mask apart (+px) or together (-px). Each
 * subpath starts with an absolute moveto (M) — except possibly the first, a
 * lowercase `m` that is absolute as the first path element — so shifting the
 * leading X by ±spread/2 (depending on which side of the mask center it sits)
 * shifts the whole subpath. Final values get baked into `d` in the registry.
 */
function applySpread(d: string, spreadPx: number): string {
  if (!spreadPx) return d;
  const half = (spreadPx * PX2MM) / 2;
  const moveto = /([Mm])\s*(-?[\d.]+)([\s,]+)(-?[\d.]+)/g;
  const xs: number[] = [];
  for (let m = moveto.exec(d); m; m = moveto.exec(d)) xs.push(parseFloat(m[2]!));
  if (xs.length < 2) return d;
  const center = (Math.min(...xs) + Math.max(...xs)) / 2;
  return d.replace(moveto, (_full, cmd: string, x: string, _sep: string, y: string) => {
    const nx = parseFloat(x) + (parseFloat(x) < center ? -half : half);
    return `${cmd}${+nx.toFixed(4)} ${y}`;
  });
}

// The registry handed to the engine, with each mask's `spread` baked into its `d`.
function displayRegistry(): MuscleDefinition[] {
  return registry.map((m) => (m.spread ? { ...m, d: applySpread(m.d, m.spread) } : m));
}

let view: BodyView = 'front';
let gender: Gender = 'female';
let theme: Theme = 'dark';
let selectedId: string | null = null;
let baseIntensity = 55; // strength of non-selected masks (so you can see them)
let selectedIntensity = 100; // strength of the selected mask
let zoom = 4; // magnify the figure (with masks) for precise positioning

const map = new MuscleMap(mapHost, {
  view,
  gender,
  theme,
  registry,
  width: '100%',
  hoverHighlight: true,
  hoverIntensity: 80,
  highlights: computeHighlights(),
  onMuscleClick: (id) => selectMuscle(id),
});

function viewMuscles(): MuscleDefinition[] {
  return getMuscles(gender, view, registry);
}

function computeHighlights() {
  return viewMuscles().map((m) => ({
    id: m.id,
    intensity: m.id === selectedId ? selectedIntensity : baseIntensity,
  }));
}

function pushHighlights(): void {
  map.update({ highlights: computeHighlights() });
}

function rebuildPaths(): void {
  // New registry array reference triggers a path rebuild (picks up offsets/spread).
  map.update({ registry: displayRegistry(), highlights: computeHighlights() });
}

function applyTheme(): void {
  // Flip the whole page background to match the theme. The body image already
  // contrasts (dark UI -> light body, light UI -> dark body).
  document.body.classList.toggle('theme-light', theme === 'light');
}

function applyZoom(): void {
  // Scales the whole figure (image + masks share one viewBox); the stage scrolls.
  mapHost.style.setProperty('--zoom', String(zoom));
}

function setZoom(next: number): void {
  zoom = Math.min(5, Math.max(0.5, Math.round(next * 100) / 100));
  applyZoom();
  renderPanel();
}

function selectFirstOfView(): void {
  const first = viewMuscles()[0];
  selectedId = first ? first.id : null;
}

function selectMuscle(id: string | null): void {
  selectedId = id;
  renderPanel();
  pushHighlights();
}

function setView(next: BodyView): void {
  if (next === view) return;
  view = next;
  selectFirstOfView();
  map.update({ view, highlights: computeHighlights() });
  renderPanel();
}

function setGender(next: Gender): void {
  if (next === gender) return;
  gender = next;
  selectFirstOfView();
  map.update({ gender, highlights: computeHighlights() });
  renderPanel();
}

function setTheme(next: Theme): void {
  if (next === theme) return;
  theme = next;
  map.update({ theme });
  applyTheme();
  renderPanel();
}

// --- tiny DOM helper -------------------------------------------------------

type Attrs = Record<string, string | number | boolean | ((e: Event) => void)>;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (value === true) {
      node.setAttribute(key, '');
    } else if (value !== false) {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

function seg<T extends string>(
  current: T,
  options: Array<[label: string, value: T]>,
  onPick: (value: T) => void,
): HTMLElement {
  return el(
    'div',
    { class: 'seg' },
    options.map(([label, value]) =>
      el('button', { 'aria-pressed': current === value, onClick: () => onPick(value) }, [label]),
    ),
  );
}

// --- panel -----------------------------------------------------------------

function renderPanel(): void {
  const selected = selectedId ? registry.find((m) => m.id === selectedId) ?? null : null;
  panel.replaceChildren(
    el('h1', {}, [
      'js-rich-body-highlighter',
      el('small', {}, ['mask playground']),
    ]),
    group('Gender', seg(gender, [['Male', 'male'], ['Female', 'female']], setGender)),
    group('View', seg(view, [['Front', 'front'], ['Back', 'back']], setView)),
    group('Theme', seg(theme, [['Light', 'light'], ['Dark', 'dark']], setTheme)),
    zoomGroup(),
    muscleListGroup(),
    selectedGroup(selected),
    hintGroup(),
  );
}

function group(label: string, ...children: Array<Node | string>): HTMLElement {
  return el('div', { class: 'group' }, [el('span', { class: 'label' }, [label]), ...children]);
}

function zoomGroup(): HTMLElement {
  return group(
    'Zoom',
    el('div', { class: 'zoom' }, [
      el('button', { title: 'Zoom out', onClick: () => setZoom(zoom - 1) }, ['−']),
      el('span', { class: 'zoom-val' }, [`${Math.round(zoom * 100)}%`]),
      el('button', { title: 'Zoom in', onClick: () => setZoom(zoom + 1) }, ['+']),
    ]),
  );
}

function muscleListGroup(): HTMLElement {
  const muscles = viewMuscles();
  const items: Array<Node | string> = muscles.length
    ? muscles.map((m) =>
        el(
          'button',
          { 'aria-pressed': m.id === selectedId, onClick: () => selectMuscle(m.id) },
          [el('span', {}, [m.name]), el('span', { class: 'tag' }, [m.group])],
        ),
      )
    : [el('div', { class: 'empty' }, [`No ${gender} ${view} masks yet.`])];

  return el('div', { class: 'group' }, [
    el('span', { class: 'label' }, [`Muscles (${muscles.length})`]),
    el('div', { class: 'muscle-list' }, items),
  ]);
}

function selectedGroup(selected: EditMuscle | null): HTMLElement {
  if (!selected) {
    return el('div', { class: 'group' }, [
      el('span', { class: 'label' }, ['Selected']),
      el('div', { class: 'hint' }, ['Select a muscle to adjust it.']),
    ]);
  }

  const brightness = el('input', {
    type: 'range',
    min: 0,
    max: 100,
    value: selectedIntensity,
    onInput: (e) => {
      selectedIntensity = Number((e.target as HTMLInputElement).value);
      pushHighlights();
      updateReadout(selected);
    },
  });

  const base = el('input', {
    type: 'range',
    min: 0,
    max: 100,
    value: baseIntensity,
    onInput: (e) => {
      baseIntensity = Number((e.target as HTMLInputElement).value);
      pushHighlights();
    },
  });

  // Spread: move the two symmetric halves apart/together (only for masks that
  // actually have 2+ subpaths). An authoring aid; the value gets baked into `d`.
  const canSpread = subpathCount(selected.d) >= 2;
  const spreadLabel = el('span', {}, [spreadText(selected.spread)]);
  const spreadSlider = el('input', {
    type: 'range',
    min: -60,
    max: 60,
    value: selected.spread,
    onInput: (e) => {
      selected.spread = Number((e.target as HTMLInputElement).value);
      spreadLabel.textContent = spreadText(selected.spread);
      rebuildPaths();
      updateReadout(selected);
    },
  });
  const spreadControl: Array<Node | string> = canSpread
    ? [el('div', { class: 'row' }, [spreadLabel]), spreadSlider]
    : [];

  const readout = el('div', { class: 'readout', id: 'readout' }, [readoutText(selected)]);

  const copyBtn = el(
    'button',
    {
      class: 'btn',
      onClick: () => {
        void navigator.clipboard?.writeText(readoutText(selected));
        copyBtn.textContent = 'Copied ✓';
        window.setTimeout(() => (copyBtn.textContent = 'Copy offset snippet'), 1100);
      },
    },
    ['Copy offset snippet'],
  );

  const resetBtn = el(
    'button',
    {
      class: 'btn ghost',
      onClick: () => {
        selected.offset = { x: 0, y: 0 };
        rebuildPaths();
        updateReadout(selected);
      },
    },
    ['Reset offset'],
  );

  return el('div', { class: 'group' }, [
    el('span', { class: 'label' }, ['Selected']),
    el('div', { class: 'row' }, [el('span', {}, [`Brightness ${selectedIntensity}`])]),
    brightness,
    el('div', { class: 'row' }, [el('span', {}, [`Others ${baseIntensity}`])]),
    base,
    ...spreadControl,
    readout,
    el('div', { class: 'row' }, [copyBtn, resetBtn]),
  ]);
}

function spreadText(spread: number): string {
  return `Spread ${spread > 0 ? '+' : ''}${spread}px`;
}

function hintGroup(): HTMLElement {
  return el('div', { class: 'group' }, [
    el('div', { class: 'hint' }, [
      'Move the selected mask with arrow keys ',
      el('kbd', {}, ['←↑↓→']),
      ' (1px), hold ',
      el('kbd', {}, ['Shift']),
      ' for 10px. Masks are per gender + view; theme just swaps the image.',
    ]),
  ]);
}

function readoutText(m: EditMuscle): string {
  const x = m.offset?.x ?? 0;
  const y = m.offset?.y ?? 0;
  const tx = (x * PX2MM).toFixed(4);
  const ty = (y * PX2MM).toFixed(4);
  const spreadLine = m.spread ? `\nspread: ${m.spread}px` : '';
  return `${m.id}\noffset: { x: ${x}, y: ${y} }${spreadLine}\ntransform="translate(${tx} ${ty})"`;
}

function updateReadout(m: EditMuscle): void {
  const node = document.getElementById('readout');
  if (node) node.textContent = readoutText(m);
}

// --- keyboard nudging ------------------------------------------------------

window.addEventListener('keydown', (e) => {
  if (!selectedId) return;
  const step = e.shiftKey ? 10 : 1;
  let dx = 0;
  let dy = 0;
  switch (e.key) {
    case 'ArrowLeft':
      dx = -step;
      break;
    case 'ArrowRight':
      dx = step;
      break;
    case 'ArrowUp':
      dy = -step;
      break;
    case 'ArrowDown':
      dy = step;
      break;
    default:
      return;
  }
  e.preventDefault();
  const muscle = registry.find((m) => m.id === selectedId);
  if (!muscle) return;
  muscle.offset = { x: (muscle.offset?.x ?? 0) + dx, y: (muscle.offset?.y ?? 0) + dy };
  rebuildPaths();
  updateReadout(muscle);
});

// --- init ------------------------------------------------------------------

selectFirstOfView();
applyTheme();
applyZoom();
renderPanel();
