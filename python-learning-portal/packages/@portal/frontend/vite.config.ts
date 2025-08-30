import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@portal/types': '/packages/@portal/types/src/index.ts'
    }
  },
  server: {
    port: 3010,  // Frontend dedicated port range: 3010-3020
    proxy: {
      '/api': {
        target: 'http://localhost:3050',  // Backend dedicated port range starts at 3050
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['monaco-editor']
  }
})