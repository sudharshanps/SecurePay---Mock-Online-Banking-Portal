/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e3656',
          900: '#0f2038',
          950: '#091322',
        },
        brand: {
          blue: '#1E40AF',
          blueHover: '#1D4ED8',
          teal: '#0D9488',
          tealLight: '#CCFBF1',
        }
      },
    },
  },
  plugins: [],
}
