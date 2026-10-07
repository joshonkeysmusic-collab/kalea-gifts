import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `vite build --mode single` produces ONE script (no lazy chunks) in dist-single/, which
// scripts/single-file.mjs then inlines into a single HTML page for claude.ai previews.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: { include: ['src/**/*.test.ts'] },
  build: mode === 'single' ? { outDir: 'dist-single', rollupOptions: { output: { inlineDynamicImports: true } } } : undefined,
})) as never;
