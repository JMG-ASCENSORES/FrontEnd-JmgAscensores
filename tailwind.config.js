/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a', // Slate 900
        secondary: '#334155', // Slate 700
        accent: '#3b82f6', // Blue 500
        success: '#22c55e', // Green 500
        warning: '#eab308', // Yellow 500
        error: '#ef4444', // Red 500
      }
    },
  },
  plugins: [],
}
