import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

/**
 * Vite 配置 — H5 开发环境
 *
 * 核心配置: 开发代理 — 解决 H5 跨域问题
 * 小程序不需要代理，直接请求后端域名
 */
export default defineConfig({
  plugins: [uni()],
  server: {
    port: 8080,
    proxy: {
      // 将 /api 请求代理到后端 NestJS 服务
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // WebSocket 代理（如果使用 socket.io）
      '/ws': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
