/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 60-30-10 Design System Palette
        primary: '#FFFFFF', // 60% Pure White
        secondary: {        // 30% Slate Gray
          DEFAULT: '#334155',
          muted: '#64748B',
          dark: '#1E293B',
          light: '#F1F5F9',
        },
        surface: {
          white: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E2E8F0',
        },
        accent: {           // 10% Emerald Green
          DEFAULT: '#10B981',
          hover: '#059669',
          soft: '#D1FAE5',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
      },
    },
  },
  plugins: [],
}
