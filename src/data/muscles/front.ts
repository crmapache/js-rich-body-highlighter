import type { MuscleDefinition } from '../types';

/**
 * Front-view muscle masks. Authored in Inkscape over the body illustration and
 * exported as Optimized SVG path data. Add new masks here one at a time.
 *
 * Note: `left` / `right` are the anatomical side (the depicted person's side).
 * On the front view, the body's right muscle sits on the LEFT of the screen.
 */
export const FRONT_MUSCLES: MuscleDefinition[] = [
  {
    id: 'pectoralis_right',
    name: 'Pectoralis major (right)',
    group: 'chest',
    side: 'right',
    view: 'front',
    d: 'm264.89 186.35 1.3615-0.34037-1.1062-3.5739-2.1273-2.8931-3.2335-2.4677-4.1695-2.0422-2.723-0.0851-0.93601-0.17018-0.68074-0.76583-6.467-1.2764-5.4459-0.68074-4.9353-0.34036-3.659 0.42546-3.7441 1.1062-7.3179 3.1484-5.0204 2.723-4.2546 3.0633-5.2757 5.6161-4.0844 5.0204-2.6379 4.595-1.872 3.8291-1.4466 5.1906 0.51055 0.17019 1.2764 2.4677 1.6168 3.8291 1.5317 3.2335 4.8502 8.339 3.9993 5.0204 4.8502 4.1695 3.4888 2.3826 4.7652 2.0422 6.3819 1.7869 5.6161 0.25527 6.0415-0.85092 6.7223-1.5316 5.531-1.9571 4.9353-2.2124 4.6801-3.1484 3.1484-3.9142 0.68075-2.2124 0.34036-1.6168 0.42548-1.5317 0.68072-3.5739 0.1702-6.2968v-3.5739l-0.76583-1.1062 0.17018-1.1062 0.59565-0.42546 0.25527-4.7652-0.0851-3.7441-0.25527-3.9142-0.42547-3.5739-0.68072-0.93602-1.6168-0.51055z',
  },
];
