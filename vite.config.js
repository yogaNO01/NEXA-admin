import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on every network interface so other devices on the LAN can use
    // this development server.
    host: '0.0.0.0',
    port: 5176,
  },
  preview: {
    host: '0.0.0.0',
    port: 4176,
  },
});
