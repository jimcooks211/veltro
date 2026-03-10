import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
    },
    maskable: {
      sizes: [512],
      padding: 0.1,
      resizeOptions: { background: '#0A0F1E' },
    },
    apple: {
      sizes: [180],
      resizeOptions: { background: '#0A0F1E' },  // ← this fixes the white bg
    },
  },
  images: ['public/pwa-icon.svg'],
})