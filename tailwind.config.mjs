/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B0F19',  // Deep high-end dark background
          slate: '#1E293B', // Component container fill
          accent: '#38BDF8' // Sharp cyan terminal accent lines
        }
      }
    },
  },
  plugins: [],
}
