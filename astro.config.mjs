import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build
export default defineConfig({
  integrations: [tailwind()],
  site: 'https://github.io', // Switch to your custom domain later if needed
  base: '/',
});
