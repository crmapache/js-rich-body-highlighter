import {
  MuscleMap,
  MUSCLE_GROUPS,
  type Gender,
  type Theme,
  type Highlight,
  type MuscleGroup,
  type MuscleMapOptions,
} from 'js-rich-body-highlighter';

const frontHost = document.getElementById('map-front') as HTMLElement;
const backHost = document.getElementById('map-back') as HTMLElement;
const presetList = document.getElementById('presets') as HTMLElement;

let gender: Gender = 'female';
let theme: Theme = 'dark';

interface Preset {
  label: string;
  groups: MuscleGroup[];
}

// Classic training splits — each lights up the muscle groups it works. Targeting
// by `group` (not mask id) is the whole point: one entry covers both bodies.
const PRESETS: Preset[] = [
  { label: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
  { label: 'Pull', groups: ['lats', 'upper_back', 'biceps', 'forearms'] },
  { label: 'Ноги', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { label: 'Грудь + трицепс', groups: ['chest', 'triceps'] },
  { label: 'Спина + бицепс', groups: ['lats', 'upper_back', 'lower_back', 'biceps'] },
  { label: 'Плечи + руки', groups: ['shoulders', 'biceps', 'triceps', 'forearms'] },
  { label: 'Кор', groups: ['abs', 'obliques', 'lower_back'] },
  { label: 'Верх тела', groups: ['chest', 'upper_back', 'lats', 'shoulders', 'biceps', 'triceps', 'forearms'] },
  { label: 'Всё тело', groups: [...MUSCLE_GROUPS] },
];

let active: Preset = PRESETS[0]!;

function highlights(): Highlight[] {
  return active.groups.map((group) => ({ group, intensity: 88 }));
}

function shared(): MuscleMapOptions {
  return { gender, theme, highlights: highlights(), hoverHighlight: true, hoverIntensity: 100 };
}

const front = new MuscleMap(frontHost, { view: 'front', ...shared() });
const back = new MuscleMap(backHost, { view: 'back', ...shared() });

function sync(): void {
  front.update(shared());
  back.update(shared());
}

function applyTheme(): void {
  // Flip the page to match; the body image swaps itself (dark UI -> light body).
  document.body.classList.toggle('theme-light', theme === 'light');
}

// --- preset chips ----------------------------------------------------------

for (const preset of PRESETS) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip' + (preset === active ? ' active' : '');
  btn.textContent = preset.label;
  btn.addEventListener('click', () => {
    active = preset;
    presetList.querySelectorAll('.chip').forEach((b) => b.classList.toggle('active', b === btn));
    sync();
  });
  presetList.appendChild(btn);
}

// --- segmented switchers ---------------------------------------------------

function segmented(id: string, onPick: (value: string) => void): void {
  const seg = document.getElementById(id);
  seg?.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('button');
    if (!btn || !seg.contains(btn)) return;
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    onPick((btn as HTMLButtonElement).dataset.value ?? '');
  });
}

segmented('gender-seg', (value) => {
  gender = value as Gender;
  sync();
});

segmented('theme-seg', (value) => {
  theme = value as Theme;
  applyTheme();
  sync();
});

applyTheme();
