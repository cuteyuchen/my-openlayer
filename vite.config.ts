import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import libCss from 'vite-plugin-libcss';
import path from "path";

const resolve = (dir: any) => path.join(__dirname, dir);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    libCss(),
  ],
  resolve: {
    alias: {
      "@": resolve("examples"),
      packages: resolve("packages")
    }
  },
})