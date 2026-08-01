import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        resume: resolve(import.meta.dirname, 'resume.html'),
        styleLab: resolve(import.meta.dirname, 'style-lab/index.html'),
        styleCity: resolve(import.meta.dirname, 'style-lab/city.html'),
        styleMedieval: resolve(import.meta.dirname, 'style-lab/medieval.html'),
        styleSpace: resolve(import.meta.dirname, 'style-lab/space.html'),
        styleNature: resolve(import.meta.dirname, 'style-lab/nature.html'),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
