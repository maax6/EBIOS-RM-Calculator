import { defineConfig } from 'vite';

// base relative : le build est déployable tel quel sur GitHub Pages ou n'importe quel hébergement statique.
export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  preview: { host: '0.0.0.0', port: 5173, strictPort: true },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
});
