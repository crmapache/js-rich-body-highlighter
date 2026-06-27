import {
  MuscleMap,
  MUSCLES,
  getMusclesByView,
  type BodyView,
} from 'js-rich-body-highlighter';

const host = document.getElementById('map') as HTMLElement;
const hoverLabel = document.getElementById('hover-label') as HTMLElement;
const snippetEl = document.getElementById('snippet') as HTMLElement;
const intensityVal = document.getElementById('intensity-val') as HTMLElement;

let view: BodyView = 'front';
let intensity = 72;
let color = '#ff2d2d';
let blendMode = 'multiply';

function demoHighlights() {
  // Light up every mask in the current view so the effect reads immediately.
  return getMusclesByView(view, MUSCLES).map((m) => ({ id: m.id, intensity }));
}

const map = new MuscleMap(host, {
  view,
  color,
  blendMode,
  hoverHighlight: true,
  hoverIntensity: 100,
  highlights: demoHighlights(),
  onMuscleEnter: (id) => {
    hoverLabel.textContent = MUSCLES.find((m) => m.id === id)?.name ?? id;
    hoverLabel.classList.add('on');
  },
  onMuscleLeave: () => hoverLabel.classList.remove('on'),
});

// --- controls --------------------------------------------------------------

function segmented(id: string, onPick: (value: string) => void): void {
  const seg = document.getElementById(id);
  seg?.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('button');
    if (!btn || !seg.contains(btn)) return;
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    onPick(btn.dataset.view ?? btn.dataset.blend ?? '');
  });
}

segmented('view-seg', (value) => {
  view = value as BodyView;
  map.update({ view, highlights: demoHighlights() });
  renderSnippet();
});

segmented('blend-seg', (value) => {
  blendMode = value;
  map.update({ blendMode });
});

const intensityInput = document.getElementById('intensity') as HTMLInputElement;
intensityInput.addEventListener('input', () => {
  intensity = Number(intensityInput.value);
  intensityVal.textContent = String(intensity);
  map.update({ highlights: demoHighlights() });
  renderSnippet();
});

const colorInput = document.getElementById('color') as HTMLInputElement;
colorInput.addEventListener('input', () => {
  color = colorInput.value;
  map.update({ color });
});

// --- code snippet ----------------------------------------------------------

function renderSnippet(): void {
  const firstId = getMusclesByView(view, MUSCLES)[0]?.id ?? 'pectoralis_right';
  snippetEl.innerHTML = [
    `<span class="k">import</span> { MuscleMap } <span class="k">from</span> <span class="s">'js-rich-body-highlighter/react'</span>;`,
    ``,
    `<span class="p">&lt;MuscleMap</span>`,
    `  view=<span class="s">"${view}"</span>`,
    `  highlights={[{ id: <span class="s">'${firstId}'</span>, intensity: ${intensity} }]}`,
    `<span class="p">/&gt;</span>`,
  ].join('\n');
}

renderSnippet();
