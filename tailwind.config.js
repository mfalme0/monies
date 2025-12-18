/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}"  // <--- Crucial: Ensures components are styled
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}