/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#2b6cee',
        'background-light': '#f6f6f8',
        'background-dark': '#0a0a0a',
        'brand-purple': '#8B5CF6',
        'brand-teal': '#14B8A6',
        'brand-lime': '#A3E635',
        'bank-green': '#10b981',
        'bank-dark': '#059669',
        'bust-red': '#ef4444',
        'game-bg': '#1f2937',
        'panel-bg': '#374151',
      },
      fontFamily: {
        'display': ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '1.5rem',
        xl: '3rem',
        full: '9999px',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(10px)' },
          '20%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
          '80%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
          '100%': { opacity: '0', transform: 'translateX(-50%) translateY(-10px)' },
        },
        'pulse-danger': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
          '50%': { opacity: '0.9', boxShadow: '0 0 20px 10px rgba(239, 68, 68, 0.3)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(20px)' },
        },
        'bank-flash': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '20%': { opacity: '1', transform: 'scale(1.1)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
          '80%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 2.5s ease-out forwards',
        'pulse-danger': 'pulse-danger 1s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'slide-out': 'slide-out 0.3s ease-out forwards',
        'bank-flash': 'bank-flash 2s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}

