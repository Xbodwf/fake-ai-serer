import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  root: '.',
  
  build: {
    outDir: 'dist/server',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      input: {
        server: './src/frontend/entry-server.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
      onwarn(warning, warn) {
        // 忽略未使用的导入警告
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
          return
        }
        warn(warning)
      },
    },
    
    target: 'node18',
    ssr: true,
    ssrEmitAssets: false,
  },
  
  resolve: {
    alias: {
      '@': '/src/frontend',
    },
  },
})