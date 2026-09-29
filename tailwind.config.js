/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f6fc',
          100: '#e1eef9',
          200: '#b9dbf2',
          300: '#7cbfe8',
          400: '#389fda',
          500: '#1481c5',
          600: '#0b66a5',
          700: '#0a5286',
          800: '#0d4670',
          900: '#0f3a5d',
          950: '#09243c',
        },
        emblem: {
          gold: '#c59b27',
          ochre: '#b8600d',
          saffron: '#e06100',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-gov': '0 0 24px -4px rgba(10, 82, 134, 0.15)',
        'glow-amber': '0 0 24px -4px rgba(217, 119, 6, 0.15)',
      },
    },
  },
  plugins: [],
}
