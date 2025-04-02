import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  define: {
    global: {}, // Define global to fix sockjs-client
  },
  server: {
    proxy: {
      "/ws-comments":{
        target: 'http://localhost:8080',
        ws: true, // Enable WebSocket proxying
        // changeOrigin: true, // Allow connecting to the backend server from the frontend server
        // rewrite: (path) => path.replace(/^\/ws-comments/, '') // Rewrite the path to match the backend server's endpoint
      }
    }
  }
})
