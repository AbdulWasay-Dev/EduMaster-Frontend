/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0281FF',
          600: '#0270e0',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a5f',
          950: '#0f172a',
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
          bg:     '#0f172a',
          border: '#1e293b',
          active: '#0281FF',
          text:   '#94a3b8',
          icon:   '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0281FF 100%)',
        'card-gradient': 'linear-gradient(135deg, #0281FF 0%, #0270e0 100%)',
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
        'brand': '0 4px 24px -4px rgba(2,129,255,0.25)',
        'brand-lg': '0 8px 40px -8px rgba(2,129,255,0.35)',
        'card': '0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.06)',
        'card-hover': '0 10px 40px -8px rgba(15,23,42,0.1)',
      },
    },
  },
  plugins: [],
}
