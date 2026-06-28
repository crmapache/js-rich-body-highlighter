<script>
  import { muscleMap } from 'js-rich-body-highlighter/svelte';

  let view = 'back';
  let out = '';

  $: options = {
    gender: 'female',
    view,
    width: 300,
    highlights: [
      { group: 'lats', intensity: 70 },
      { group: 'glutes', intensity: 50 },
    ],
    onMuscleClick: (m) => {
      out = JSON.stringify(m);
    },
  };
</script>

<button id="toggle" on:click={() => (view = view === 'back' ? 'front' : 'back')}>toggle view</button>
<pre id="out">{out}</pre>
<div use:muscleMap={options}></div>
