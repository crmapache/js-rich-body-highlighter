import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MuscleMap, type BodyView, type MuscleEventTarget } from 'js-rich-body-highlighter/react';

function App() {
  const [view, setView] = useState<BodyView>('back');
  return (
    <div>
      <button id="toggle" onClick={() => setView((v) => (v === 'back' ? 'front' : 'back'))}>
        toggle view
      </button>
      <pre id="out"></pre>
      <MuscleMap
        gender="female"
        view={view}
        width={300}
        highlights={[
          { group: 'lats', intensity: 70 },
          { group: 'glutes', intensity: 50 },
        ]}
        onMuscleClick={(m: MuscleEventTarget) => {
          document.getElementById('out')!.textContent = JSON.stringify(m);
        }}
      />
    </div>
  );
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
