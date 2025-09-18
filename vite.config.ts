import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/github-gantt-chart/', // TODO: Replace 'github-gantt-chart' with your repository name
  build: {
    outDir: 'dist'
  }
})
