import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/preload/index.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    outDir: '.vite/build',
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: 'preload.js',
      },
    },
    minify: false,
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@pdf-editor/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
