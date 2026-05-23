/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EAF3FF',
          100: '#D6E9FF',
          200: '#ACD4FF',
          300: '#78B9FF',
          400: '#3E96F5',
          500: '#0A66C2',
          600: '#0859A6',
          700: '#074A8A',
          800: '#073D72',
          900: '#082F57',
          950: '#041B33',
        },
        primary: {
          DEFAULT: '#0A66C2',
          foreground: '#ffffff',
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
          bg:     '#0A66C2',
          border: 'rgba(255,255,255,0.15)',
          active: '#ffffff',
          text:   'rgba(255,255,255,0.7)',
          icon:   'rgba(255,255,255,0.5)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0A66C2 100%)',
        'card-gradient': 'linear-gradient(135deg, #0A66C2 0%, #0859A6 100%)',
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
        'brand': '0 4px 24px -4px rgba(10,102,194,0.25)',
        'brand-lg': '0 8px 40px -8px rgba(10,102,194,0.35)',
        'card': '0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.06)',
        'card-hover': '0 10px 40px -8px rgba(15,23,42,0.1)',
      },
    },
  },
  plugins: [],
}
