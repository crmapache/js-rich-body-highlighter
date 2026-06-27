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

// Working copy of the registry so we can live-edit offsets without touching the
// real source. Every muscle gets a concrete offset for easy nudging.
const registry: MuscleDefinition[] = MUSCLES.map((m) => ({
  ...m,
  offset: { x: m.offset?.x ?? 0, y: m.offset?.y ?? 0 },
}));

let view: BodyView = 'front';
let gender: Gender = 'male';
let theme: Theme = 'light';
let selectedId: string | null = null;
let baseIntensity = 55; // strength of non-selected masks (so you can see them)
let selectedIntensity = 100; // strength of the selected mask

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
  refreshOutline();
}

function rebuildPaths(): void {
  // New registry array reference triggers a path rebuild (picks up offsets).
  map.update({ registry: [...registry], highlights: computeHighlights() });
  refreshOutline();
}

function refreshOutline(): void {
  const svg = map.element;
  svg.querySelectorAll<SVGPathElement>('path[data-muscle-id]').forEach((path) => {
    if (path.getAttribute('data-muscle-id') === selectedId) {
      path.style.stroke = '#2b6cff';
      path.style.strokeWidth = '1.5';
      path.style.vectorEffect = 'non-scaling-stroke';
    } else {
      path.style.stroke = 'none';
    }
  });
}

function applyBackdrop(): void {
  // Dark bodies need a light backdrop to be visible (and vice versa).
  mapHost.style.background = theme === 'dark' ? '#e9edf3' : 'transparent';
  mapHost.style.borderRadius = '10px';
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
  refreshOutline();
}

function setGender(next: Gender): void {
  if (next === gender) return;
  gender = next;
  selectFirstOfView();
  map.update({ gender, highlights: computeHighlights() });
  renderPanel();
  refreshOutline();
}

function setTheme(next: Theme): void {
  if (next === theme) return;
  theme = next;
  map.update({ theme });
  applyBackdrop();
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
    muscleListGroup(),
    selectedGroup(selected),
    hintGroup(),
  );
}

function group(label: string, ...children: Array<Node | string>): HTMLElement {
  return el('div', { class: 'group' }, [el('span', { class: 'label' }, [label]), ...children]);
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

function selectedGroup(selected: MuscleDefinition | null): HTMLElement {
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

  const readout = el('div', { class: 'readout', id: 'readout' }, [readoutText(selected)]);

  const copyBtn = el(
    'button',
    {
      class: 'btn',
      onClick: () => {
        void navigator.clipboard?.writeText(registrySnippet(selected));
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
    readout,
    el('div', { class: 'row' }, [copyBtn, resetBtn]),
  ]);
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

function readoutText(m: MuscleDefinition): string {
  const x = m.offset?.x ?? 0;
  const y = m.offset?.y ?? 0;
  const tx = (x * PX2MM).toFixed(4);
  const ty = (y * PX2MM).toFixed(4);
  return `${m.id}\noffset: { x: ${x}, y: ${y} }\ntransform="translate(${tx} ${ty})"`;
}

function registrySnippet(m: MuscleDefinition): string {
  const x = m.offset?.x ?? 0;
  const y = m.offset?.y ?? 0;
  return `offset: { x: ${x}, y: ${y} }`;
}

function updateReadout(m: MuscleDefinition): void {
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
applyBackdrop();
renderPanel();
refreshOutline();
