import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  // 设置 base 路径为 './'，这样打包后的静态资源路径就是相对路径
  // 可以完美适配 GitHub Pages (无论仓库名是什么)
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: (id: string) => {
          if (id.includes('@cortex-js') || id.includes('mathjs')) {
            return 'math-vendor';
          }
          if (id.includes('react-markdown') || id.includes('remark-') || id.includes('rehype-') || id.includes('highlight.js') || id.includes('katex')) {
            return 'markdown-vendor';
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
  }
} as import('vite').UserConfig)
