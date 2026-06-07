/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0b0f19',
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
        },
        indigo: {
          500: '#6366f1',
          600: '#4f46e5',
          400: '#818cf8',
        },
        neon: {
          green: '#10b981',
          cyan: '#06b6d4'
        }
      },
    },
  },
  plugins: [],
}