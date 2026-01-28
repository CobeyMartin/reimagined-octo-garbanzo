import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main/index.ts'),
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    outDir: '.vite/build',
    rollupOptions: {
      external: ['electron', 'path', 'fs', 'fs/promises', 'url', 'os', 'child_process', 'util'],
      output: {
        entryFileNames: 'main.js',
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
