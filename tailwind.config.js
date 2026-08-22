/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // ← ESTA LÍNEA ES CLAVE
  theme: {
    extend: {
      // ── Paleta de marca Veliora (derivada de la landing) ──
      colors: {
        gold: {
          50: '#faf6ef',
          100: '#f5efe2',
          200: '#e8d8c0',
          300: '#dcc4a0',
          400: '#c8a476', // dorado principal de la landing
          500: '#b8925e', // gold-strong
          600: '#9a7748',
          700: '#7c5e39',
          800: '#5e472c',
          900: '#40301e',
        },
        espresso: {
          50: '#faf6ef',
          100: '#f3ede4',
          200: '#e0d5c5',
          300: '#c4b39c',
          400: '#96826a',
          500: '#6e5c48',
          600: '#4a3d30',
          700: '#2a2420', // foreground principal
          800: '#1a1612', // headlines / hover
          900: '#0d0b09', // fondo dark
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}