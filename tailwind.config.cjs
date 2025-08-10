/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    'bg-red-300',
    'bg-green-300',
    'bg-yellow-400'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
