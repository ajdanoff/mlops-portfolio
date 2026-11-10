import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build
export default defineConfig({
  integrations: [tailwind()],
  site: 'https://ajdanoff.github.io', 
  base: '/mlops-portfolio', // ◄— Critical fix: Tells Astro to prepend this path to all assets
});
