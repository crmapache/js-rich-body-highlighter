# js-rich-body-highlighter

A premium, framework-agnostic muscle map. Instead of flat polygon fills (the
look every other body-highlighter library ships), it highlights muscles with
`mix-blend-mode` over a **detailed body illustration**. The color settles into
the grooves between muscle bundles, so each muscle looks lit from within and
three-dimensional rather than painted flat. That richer look is the whole point.

- **Framework-agnostic core** in plain TypeScript, zero runtime dependencies.
- **Wrappers** for React, Vue, Svelte, and a `<muscle-map>` Web Component (which
  also covers Angular and anything else). Each framework runtime is an _optional_
  peer dependency, so you never pull in one you don't use.
- **Full body set**: male + female, front + back, light + dark, with 14 muscle
  groups masked on each view.
- **Data-driven**: highlight by muscle **group** (or individual mask id), each
  with its own intensity (0–100) and optional color.
- **Adaptive size** for free: image and masks share one SVG `viewBox`, so sizing
  the `<svg>` scales everything together — just give it a `width`.

## Install

```sh
npm install js-rich-body-highlighter
```

## Usage

### Core (any framework / vanilla)

```ts
import { MuscleMap } from 'js-rich-body-highlighter';

const map = new MuscleMap(document.querySelector('#app')!, {
  gender: 'female',
  view: 'front',
  width: 360,
  highlights: [
    { group: 'chest', intensity: 70 },
    { group: 'abs', intensity: 45, color: '#22c55e' },
  ],
  onMuscleClick: (muscle) => console.log(muscle.group), // 'chest', 'abs', …
});

map.update({ highlights: [{ group: 'quads', intensity: 60 }] });
map.destroy();
```

### React

```tsx
import { MuscleMap } from 'js-rich-body-highlighter/react';

<MuscleMap
  gender="female"
  view="back"
  width={360}
  highlights={[{ group: 'lats', intensity: 70 }]}
  onMuscleClick={(muscle) => console.log(muscle.group)}
/>;
```

### Vue 3

```vue
<script setup lang="ts">
import { MuscleMap } from 'js-rich-body-highlighter/vue';
</script>

<template>
  <MuscleMap gender="female" view="back" :width="360"
    :highlights="[{ group: 'lats', intensity: 70 }]"
    @muscle-click="(m) => console.log(m.group)" />
</template>
```

### Svelte (action — no Svelte runtime dependency)

```svelte
<script lang="ts">
  import { muscleMap } from 'js-rich-body-highlighter/svelte';
  const options = { gender: 'female', highlights: [{ group: 'chest', intensity: 70 }] };
</script>

<div use:muscleMap={options}></div>
```

### Web Component — `<muscle-map>` (and Angular)

The universal wrapper. Works in plain HTML and in any framework. Simple values
are attributes; complex values (`highlights`, `registry`, `bodySrc`) are
properties; hover/click are DOM `CustomEvent`s.

```ts
import 'js-rich-body-highlighter/web-component';

const el = document.querySelector('muscle-map')!;
el.highlights = [{ group: 'chest', intensity: 70 }];
el.addEventListener('muscleclick', (e) => console.log(e.detail.muscle.group));
```

```html
<muscle-map gender="female" view="front" width="360"></muscle-map>
```

In **Angular**, import the element once and add `CUSTOM_ELEMENTS_SCHEMA` to your
component/module, then use `<muscle-map>` in the template and set `[highlights]`
/ listen to `(muscleclick)` as usual. (A custom element is Angular's officially
supported way to use non-Angular UI and works in AOT/production builds.)

## Highlighting

A highlight targets a **group** (recommended — most callers think in groups) or a
single mask **id**, with an `intensity` of 0–100 and an optional per-entry
`color`:

```ts
highlights: [
  { group: 'chest', intensity: 70 },              // both pecs, red (the default)
  { group: 'biceps', intensity: 50, color: '#22c55e' }, // green
  { id: 'rectus_abdominis_female', intensity: 30 }, // one specific mask
];
```

Targeting by group resolves to every mask of that group in the current
gender + view, so one entry lights up both bodies and both genders. Hovering a
muscle highlights it too (`hoverHighlight`, `hoverIntensity`, optional
`hoverColor` for a distinct tint).

### Muscle groups

`chest`, `shoulders`, `biceps`, `triceps`, `forearms`, `abs`, `obliques`,
`upper_back`, `lats`, `lower_back`, `glutes`, `quads`, `hamstrings`, `calves`.

Exported as `MUSCLE_GROUPS` (in head-to-toe order) for building legends, pickers,
or presets.

## Options

| Option                                          | Type                                          | Default       | Notes |
| ----------------------------------------------- | --------------------------------------------- | ------------- | ----- |
| `gender`                                        | `'male' \| 'female'`                          | `'male'`      | picks body + mask set |
| `view`                                          | `'front' \| 'back'`                           | `'front'`     | |
| `theme`                                         | `'light' \| 'dark'`                           | `'light'`     | swaps body image only |
| `width`                                         | `number \| string`                            | `'100%'`      | px number or CSS string |
| `height`                                        | `number \| string`                            | `'auto'`      | derived from body aspect ratio |
| `highlights`                                    | `{ id?, group?, intensity, color? }[]`        | `[]`          | `intensity` 0–100 |
| `color`                                         | `string`                                      | `'#ff0000'`   | global highlight color |
| `blendMode`                                     | `string`                                      | `'multiply'`  | any CSS `mix-blend-mode` |
| `hoverHighlight`                                | `boolean`                                     | `true`        | highlight on hover |
| `hoverIntensity`                                | `number`                                      | `35`          | 0–100 |
| `hoverColor`                                    | `string`                                      | muscle color  | distinct tint for the hovered muscle |
| `bodySrc`                                        | `string \| { front?, back? }`                 | bundled image | bring your own image(s) |
| `registry`                                      | `MuscleDefinition[]`                          | built-in      | custom muscle set |
| `onMuscleEnter` / `onMuscleLeave` / `onMuscleClick` | `(muscle, event) => void`                 | —             | `muscle` is `{ id, group, name }` |

## How it works

- The body is a raster image at `(0,0)` inside an `<svg>`. Each muscle is a
  `<path>` traced over it, filled with the highlight color and blended with
  `mix-blend-mode: multiply`. Intensity is the path's opacity (0–100 → 0–1).
- The `<svg>` is `isolation: isolate`, so the blend only affects the body image,
  not the page behind it.
- Image and masks share one `viewBox` (`0 0 361.16 541.87`, the 1365×2048 body at
  96 DPI), so sizing the `<svg>` scales everything together.

## Bundle & images

The 8 bodies are WebP, ~0.66 MB **total** (≈100 KB each). They are referenced
with `new URL('./bodies/<file>', import.meta.url)`, which modern bundlers
(Vite / webpack 5 / Rollup) emit as **separate asset files — not inlined into your
JS bundle**. At runtime only the single visible body is fetched (~100 KB), not the
whole set. The JS engine itself is ~30 KB gzipped.

To keep images out of your build entirely (e.g. serve from a CDN), pass
`bodySrc` (a single URL, or `{ front, back }`); it wins over the bundled default.

## Adding a muscle

1. Trace the muscle in Inkscape over the body image, export Optimized SVG.
2. Add one entry to `src/data/muscles/front.ts` (or `back.ts`):

   ```ts
   {
     id: 'biceps_female',
     name: 'Biceps brachii',
     group: 'biceps',
     gender: 'female',
     side: null,
     view: 'front',
     offset: { x: 289, y: 110 },
     d: 'M... z',
   }
   ```

3. Run the playground, pick the matching gender + view, check the fit, nudge with
   arrow keys, and copy the ready-to-paste `offset`.

Masks are filtered by `gender` + `view`; male and female anatomy differ, so each
needs its own masks. `theme` only swaps the body image, so light/dark share masks.
`side` uses the depicted person's side: on the front view, the body's right
muscle is on the **left** of the screen.

## Development

```sh
npm install
npm run dev               # mask-authoring playground at http://localhost:5173
npm run dev:demo          # showcase/preview (deployed to Vercel)
npm run build             # build dist/ (core + all wrappers) with tsup
npm run typecheck
npm run convert:bodies    # re-export assets-src/*.png -> src/assets/bodies/*.webp
```

## License

[MIT](./LICENSE)
