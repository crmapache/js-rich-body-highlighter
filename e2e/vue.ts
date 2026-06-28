import { createApp, h, ref } from 'vue';
import { MuscleMap, type BodyView, type MuscleEventTarget } from 'js-rich-body-highlighter/vue';

createApp({
  setup() {
    const view = ref<BodyView>('back');
    return () =>
      h('div', [
        h(
          'button',
          { id: 'toggle', onClick: () => (view.value = view.value === 'back' ? 'front' : 'back') },
          'toggle view',
        ),
        h('pre', { id: 'out' }),
        h(MuscleMap, {
          gender: 'female',
          view: view.value,
          width: 300,
          highlights: [
            { group: 'lats', intensity: 70 },
            { group: 'glutes', intensity: 50 },
          ],
          onMuscleClick: (m: MuscleEventTarget) => {
            document.getElementById('out')!.textContent = JSON.stringify(m);
          },
        }),
      ]);
  },
}).mount('#app');
