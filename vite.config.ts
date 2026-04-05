import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 设置 base 路径为 './'，这样打包后的静态资源路径就是相对路径
  // 可以完美适配 GitHub Pages (无论仓库名是什么)
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tools: resolve(__dirname, 'tools/index.html')
      }
    }
  },
  test: {
    environment: 'jsdom',
  }
} as import('vite').UserConfig)
