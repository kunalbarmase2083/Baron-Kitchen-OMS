/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'baron-navy': '#0A192F',
        'baron-navy-light': '#112240',
        'baron-gold': '#FACC15',
        'baron-neutral': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
