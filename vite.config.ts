import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/octoflow/', // TODO: with your repository name
  build: {
    outDir: 'dist'
  }
})
