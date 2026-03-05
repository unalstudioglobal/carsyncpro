import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    port: 5173,   // Vite dev server (ayrı port)
    host: '0.0.0.0',
    proxy: {
      // Dev'de /api isteklerini Express server'a yönlendir
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), tailwindcss()],
  // ⚠️  API_KEY artık client bundle'a GİRMİYOR
  // Gemini çağrıları /api/gemini/* üzerinden server'a gidiyor
  define: {
    // Sadece public olan Firebase config'i expose et (zaten public)
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.npm_package_version || '1.0.0'
    ),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    sourcemap: false,   // Production'da source map yayınlama
    chunkSizeWarningLimit: 1000, // Vercel chunk uyarı sınırını artırdık
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
