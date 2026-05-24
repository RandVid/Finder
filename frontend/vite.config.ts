import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/profiles': 'http://localhost:8000',
      '/discovery': 'http://localhost:8000',
      '/swipes': 'http://localhost:8000',
      '/matches': 'http://localhost:8000',
      '/messages': 'http://localhost:8000',
      '/stats': 'http://localhost:8000',
      '/static': 'http://localhost:8000',
    },
  },
})
