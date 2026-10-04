import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for Kitna Hua PWA & Capacitor Native Build
export default defineConfig({
  plugins: [react()],
  base: './', // Enforces relative asset paths required by Capacitor WebViews
  server: {
    port: 3000,
    host: true, // Listens on 0.0.0.0 for local Wi-Fi mobile testing (http://<LOCAL_IP>:3000)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
  },
});
