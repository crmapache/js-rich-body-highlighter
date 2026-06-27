import { fileURLToPath } from 'node:url';

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Alias the public package name to src, so the playground and the demo both
 * dogfood exactly what consumers import (and pick up changes instantly).
 */
export const libraryAlias = {
  'js-rich-body-highlighter/react': resolvePath('./src/react/index.tsx'),
  'js-rich-body-highlighter': resolvePath('./src/index.ts'),
};
