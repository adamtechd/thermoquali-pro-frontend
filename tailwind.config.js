/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#2563EB',
        'brand-secondary': '#64748B',
        'brand-background': '#F1F5F9',
        'brand-surface': '#FFFFFF',
        'brand-text-primary': '#1E293B',
        'brand-text-secondary': '#475569',
        'brand-border': '#CBD5E1',
      }
    },
  },
  plugins: [],
}