/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#1c0a00',
        },
        accent: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        sidebar: {
          bg:     '#1c0a00',
          border: '#3d1500',
          active: '#f97316',
          text:   '#fed7aa',
          icon:   '#fb923c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1c0a00 0%, #7c2d12 50%, #ea580c 100%)',
        'card-gradient': 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'brand': '0 4px 24px -4px rgba(249,115,22,0.35)',
        'brand-lg': '0 8px 40px -8px rgba(249,115,22,0.45)',
        'card': '0 1px 3px 0 rgba(28,10,0,0.08), 0 1px 2px -1px rgba(28,10,0,0.08)',
        'card-hover': '0 10px 40px -8px rgba(28,10,0,0.12)',
      },
    },
  },
  plugins: [],
}
