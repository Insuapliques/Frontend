/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981', // green-500
          dark: '#059669',    // green-600
          light: '#34d399',   // green-400
        }
      }
    },
  },
  plugins: [],
}
