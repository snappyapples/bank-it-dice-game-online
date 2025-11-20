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
    },
  },
  plugins: [],
}

