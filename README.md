# js-rich-body-highlighter

A premium, framework-agnostic muscle map. Instead of flat polygon fills (the
look every other body-highlighter library ships), it highlights muscles with
`mix-blend-mode` over a **detailed body illustration**. The red settles into the
grooves between muscle bundles, so each muscle looks lit from within and three
dimensional rather than painted flat. That richer look is the whole point.

- **Framework-agnostic core** in plain TypeScript, zero runtime dependencies.
- **Tiny React wrapper** at `js-rich-body-highlighter/react` (React is an
  optional peer dependency, so non-React users never pull it in).
- **Data-driven**: highlight muscles by id + intensity.
- **Adaptive size** for free: image and masks share one SVG `viewBox`, so sizing
  the `<svg>` scales everything together.

> Status: early. Ships 8 bundled bodies (male/female × front/back × light/dark,
> ~0.66 MB total as WebP) and one front-view mask (`pectoralis_right`). Masks are
> added one at a time via the playground.

## Install

```sh
npm install js-rich-body-highlighter
```

## Usage — core (any framework / vanilla)

```ts
import { MuscleMap } from 'js-rich-body-highlighter';

const map = new MuscleMap(document.querySelector('#app')!, {
  view: 'front',
  highlights: [{ id: 'pectoralis_right', intensity: 70 }],
  onMuscleClick: (id) => console.log(id),
});

map.update({ highlights: [{ id: 'pectoralis_right', intensity: 40 }] });
map.destroy();
```

## Usage — React

```tsx
import { MuscleMap } from 'js-rich-body-highlighter/react';

<MuscleMap
  view="front"
  highlights={[{ id: 'pectoralis_right', intensity: 70 }]}
  onMuscleClick={(id) => console.log(id)}
/>;
```

## Options

| Option           | Type                                   | Default       | Notes |
| ---------------- | -------------------------------------- | ------------- | ----- |
| `view`           | `'front' \| 'back'`                    | `'front'`     | |
| `gender`         | `'male' \| 'female'`                   | `'male'`      | picks body + mask set |
| `theme`          | `'light' \| 'dark'`                    | `'light'`     | swaps body image only |
| `highlights`     | `{ id, intensity }[]`                  | `[]`          | `intensity` is 0–100 |
| `width`          | `number \| string`                     | `'100%'`      | px number or CSS string |
| `height`         | `number \| string`                     | `'auto'`      | derived from body aspect ratio |
| `color`          | `string`                               | `'#ff0000'`   | highlight color |
| `blendMode`      | `string`                               | `'multiply'`  | any CSS `mix-blend-mode` |
| `hoverHighlight` | `boolean`                              | `true`        | highlight on hover |
| `hoverIntensity` | `number`                               | `35`          | 0–100 |
| `bodySrc`        | `string \| { front?, back? }`          | bundled image | bring your own image |
| `registry`       | `MuscleDefinition[]`                   | built-in      | custom muscle set |
| `onMuscleEnter / onMuscleLeave / onMuscleClick` | `(id, event) => void` | — | |

## How highlighting works

- The body is a raster image placed at `(0,0)` inside an `<svg>`.
- Each muscle is a `<path>` traced over that image, filled with the highlight
  color and blended with `mix-blend-mode: multiply`. Intensity is the path's
  opacity (0–100 → 0–1).
- The `<svg>` is `isolation: isolate`, so the blend only affects the body image,
  not the page behind it.

### Coordinate system

- Bodies are 2:3 portrait, shipped at 1365×2048.
- SVG `viewBox` is the body at 96 DPI: `0 0 361.16 541.87` (1365×2048 × PX2MM),
  so `PX2MM = 25.4 / 96 ≈ 0.264583`. The `<image>` fills it, so a path traced in
  Inkscape over the body drops in at its native coordinates.
- Masks are authored in this viewBox, in Inkscape, over the **exact** body image
  version used by the package. A different image scale will not line up.
- Per-mask `offset` (in source pixels) becomes a `translate(dx dy)` in viewBox
  units (`px * PX2MM`), so it stays correct at any render size.

## Adding a muscle

1. Trace the muscle in Inkscape over the body image, export Optimized SVG.
2. Add one entry to `src/data/muscles/front.ts` (or `back.ts`):

   ```ts
   {
     id: 'biceps_left',
     name: 'Biceps brachii (left)',
     group: 'arms',
     gender: 'male',
     side: 'left',
     view: 'front',
     d: 'm... z',
   }
   ```

3. Run the playground, pick the matching gender + view, check the fit, nudge with
   arrow keys, copy the `offset`.

Masks are filtered by `gender` + `view` (`getMuscles(gender, view)`); male and
female anatomy differ, so each needs its own masks. The `theme` only swaps the
body image, so light/dark share the same masks.

`id` uses the anatomical side (the depicted person's side): on the front view,
the body's right muscle is on the **left** of the screen.

## Development

```sh
npm install
npm run dev               # playground at http://localhost:5173
npm run dev:demo          # showcase/preview (deployed to Vercel)
npm run build             # build dist/ (core + react) with tsup
npm run typecheck
npm run convert:bodies    # re-export assets-src/*.png -> src/assets/bodies/*.webp
```

### Playground

- Gender / view / theme switchers and a muscle list to pick each mask.
- Arrow keys move the selected mask 1px (`Shift` = 10px) and show the
  ready-to-paste `offset` / `translate(...)`.
- Zoom +/- to magnify the figure for precise positioning.
- Slider for highlight intensity (0–100).

## License

[MIT](./LICENSE)
