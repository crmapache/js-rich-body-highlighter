import {
  MuscleMap,
  type BodyView,
  type Gender,
  type Theme,
  type Highlight,
  type MuscleGroup,
  type MuscleMapOptions,
} from 'js-rich-body-highlighter';

const frontHost = document.getElementById('map-front') as HTMLElement;
const backHost = document.getElementById('map-back') as HTMLElement;
const frontName = document.getElementById('name-front') as HTMLElement;
const backName = document.getElementById('name-back') as HTMLElement;
const presetList = document.getElementById('presets') as HTMLElement;

let gender: Gender = 'female';
let theme: Theme = 'dark';

// Three degrees of involvement per exercise (prime mover / synergist / stabilizer),
// capped at 70% so the richest blend never washes out the illustration.
const TIER = { primary: 70, secondary: 45, tertiary: 24 } as const;

interface Preset {
  label: string;
  primary: MuscleGroup[];
  secondary?: MuscleGroup[];
  tertiary?: MuscleGroup[];
}

// Classic training splits — each lights up the muscle groups it works, graded by
// how much. Targeting by `group` (not mask id) is the whole point: one entry
// covers both bodies and both genders.
const PRESETS: Preset[] = [
  { label: 'Push', primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  { label: 'Pull', primary: ['lats'], secondary: ['upper_back', 'biceps'], tertiary: ['forearms'] },
  { label: 'Legs', primary: ['quads', 'glutes'], secondary: ['hamstrings'], tertiary: ['calves'] },
  { label: 'Chest + Triceps', primary: ['chest'], secondary: ['triceps'], tertiary: ['shoulders'] },
  { label: 'Back + Biceps', primary: ['lats'], secondary: ['upper_back', 'biceps'], tertiary: ['lower_back', 'forearms'] },
  { label: 'Shoulders + Arms', primary: ['shoulders'], secondary: ['biceps', 'triceps'], tertiary: ['forearms'] },
  { label: 'Core', primary: ['abs'], secondary: ['obliques'], tertiary: ['lower_back'] },
  { label: 'Upper body', primary: ['chest', 'lats'], secondary: ['shoulders', 'upper_back'], tertiary: ['biceps', 'triceps', 'forearms'] },
  { label: 'Full body', primary: ['chest', 'lats', 'quads', 'glutes'], secondary: ['shoulders', 'upper_back', 'hamstrings', 'abs'], tertiary: ['biceps', 'triceps', 'forearms', 'lower_back', 'obliques', 'calves'] },
];

let active: Preset = PRESETS[0]!;

function highlights(): Highlight[] {
  const out: Highlight[] = [];
  for (const group of active.primary) out.push({ group, intensity: TIER.primary });
  for (const group of active.secondary ?? []) out.push({ group, intensity: TIER.secondary });
  for (const group of active.tertiary ?? []) out.push({ group, intensity: TIER.tertiary });
  return out;
}

// Hovering tints the muscle a distinct blue (separate from the red preset
// highlight) and shows its name.
const HOVER_COLOR = '#2b6cff';

function options(view: BodyView, label: HTMLElement): MuscleMapOptions {
  return {
    view,
    gender,
    theme,
    highlights: highlights(),
    hoverHighlight: true,
    hoverIntensity: 70,
    hoverColor: HOVER_COLOR,
    onMuscleEnter: (muscle) => {
      label.textContent = muscle.name;
      label.classList.add('on');
    },
    onMuscleLeave: () => label.classList.remove('on'),
  };
}

const front = new MuscleMap(frontHost, options('front', frontName));
const back = new MuscleMap(backHost, options('back', backName));

function sync(): void {
  front.update(options('front', frontName));
  back.update(options('back', backName));
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
