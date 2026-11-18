import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev the React app runs on 5173 and the API on 4000.
// The proxy forwards API calls so we don't have to deal with CORS.
const API_URL = 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/feed': API_URL,
      '/swipe': API_URL,
      '/matches': API_URL,
      '/reset': API_URL,
    },
  },
});
