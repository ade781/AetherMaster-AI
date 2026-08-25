/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          dark: '#090a0f',
          surface: '#11131a',
          card: '#161922',
          elevated: '#1e2230',
          border: 'rgba(212, 175, 55, 0.25)',
          gold: '#e6c35c',
          goldHover: '#ffd978',
          goldDim: '#9c8236',
          crimson: '#c0392b',
          arcane: '#8e44ad',
          emerald: '#27ae60',
          sapphire: '#2980b9',
        }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        medieval: ['MedievalSharp', 'cursive'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(230, 195, 92, 0.35)',
        'crimson-glow': '0 0 20px rgba(192, 57, 43, 0.45)',
        'arcane-glow': '0 0 20px rgba(142, 68, 173, 0.4)',
      }
    },
  },
  plugins: [],
}
