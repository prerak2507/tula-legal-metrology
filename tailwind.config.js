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
        // Landing and sign-in identity: certificate paper, ink, scale brass, wax seal.
        ink: { DEFAULT: '#0E1A2B', 900: '#0A1320', 800: '#16253A', 700: '#22344D', 600: '#3A4D68' },
        paper: { DEFAULT: '#F6F1E7', 50: '#FBF8F2', 100: '#F3ECDF', 200: '#ECE3D2', 300: '#DDD0B8', 400: '#C2B193' },
        brass: { DEFAULT: '#B07D2B', 200: '#F0DDB0', 300: '#E2C27F', 400: '#C99A45', 600: '#946620', 700: '#7A531A' },
        seal: { DEFAULT: '#A5302A', 50: '#FBEDEB', 700: '#83231E' },
        verify: { DEFAULT: '#1E6B47', 50: '#E8F3EC', 700: '#15523A' },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        plex: ['"IBM Plex Sans"', '"IBM Plex Sans Devanagari"', 'system-ui', 'sans-serif'],
        readout: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-gov': '0 0 24px -4px rgba(10, 82, 134, 0.15)',
        'glow-amber': '0 0 24px -4px rgba(217, 119, 6, 0.15)',
      },
    },
  },
  plugins: [],
}
