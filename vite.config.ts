import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/mermaid') || id.includes('node_modules/@mermaid-js') || id.includes('node_modules/dagre') || id.includes('node_modules/cytoscape') || id.includes('node_modules/elkjs')) {
            return 'vendor-mermaid';
          }
          if (id.includes('node_modules/katex')) {
            return 'vendor-katex';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/dompurify') || id.includes('node_modules/marked') || id.includes('node_modules/qrcode') || id.includes('node_modules/lucide-react')) {
            return 'vendor-utils';
          }
        },
      },
    },
  },
});
