/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '420px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        spruce: {
          50: '#f0f7f4',
          100: '#dceee6',
          200: '#bdddd0',
          500: '#1c6a54',
          700: '#144c3c',
          800: '#113e31',
          900: '#0F3A2E',
          950: '#07211a',
        },
        slateBrand: {
          900: '#0F172A',
        },
        scope1: {
          bg: '#F1F5F9',
          border: '#CBD5E1',
          text: '#334155',
        },
        scope2: {
          bg: '#EEF2FF',
          border: '#C7D2FE',
          text: '#3730A3',
        },
        scope3: {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#92400E',
        },
        removals: {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          text: '#065F46',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
