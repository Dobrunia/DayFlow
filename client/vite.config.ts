import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // CodeMirror in separate chunk (loads only when modal opens)
          'codemirror': ['codemirror', '@codemirror/state', '@codemirror/view', '@codemirror/commands', '@codemirror/language', '@codemirror/lang-markdown'],
          // Syntax highlighting in separate chunk
          'highlight': ['highlight.js'],
          // Markdown parser
          'markdown': ['marked'],
          // UI library
          'radix': ['radix-vue'],
          // GraphQL
          'apollo': ['@apollo/client/core', 'graphql'],
        },
      },
    },
    // Reduce warning threshold since we split chunks
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
