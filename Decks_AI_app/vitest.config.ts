import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// No @vitejs/plugin-react: its current release pulls a Babel 8 peer that
// conflicts with the tree. Vitest's built-in esbuild transform handles TSX
// fine with the automatic JSX runtime.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
})
