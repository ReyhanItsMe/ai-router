/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F3F0E7',
          50: '#FAF8F1',
          100: '#F3F0E7',
          200: '#EDE9DE',
          300: '#E5E0D3',
          400: '#D6CFBF',
          500: '#C4BBA8',
        },
        ink: {
          DEFAULT: '#2A2529',
          900: '#131313',
          800: '#1E1A1D',
          700: '#2A2529',
          600: '#3A3338',
          500: '#544C52',
          400: '#6E646B',
        },
        muted: {
          DEFAULT: '#8F887B',
          2: '#A9A196',
        },
        line: {
          DEFAULT: '#DDD6C7',
          dark: '#3A3338',
        },
        ok: '#7C9A6C',
        warn: '#C99A4E',
        err: '#C25B4E',
      },
      fontFamily: {
        sans: ['Archivo', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 2px 24px rgba(38, 34, 31, 0.06)',
        card: '0 1px 2px rgba(38, 34, 31, 0.04), 0 12px 32px -12px rgba(38, 34, 31, 0.10)',
        pop: '0 8px 48px rgba(20, 17, 19, 0.16)',
        tile: '0 10px 30px -10px rgba(38, 34, 31, 0.18)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        fadeup: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blinkdot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        sheen: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shake: 'shake 0.45s ease-in-out',
        fadeup: 'fadeup 0.35s ease both',
        blinkdot: 'blinkdot 1.4s ease-in-out infinite',
        sheen: 'sheen 2.2s linear infinite',
      },
    },
  },
  plugins: [],
}
