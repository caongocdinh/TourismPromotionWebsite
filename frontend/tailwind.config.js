/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        'primary-dark': '#1e3a8a',
        'primary-light': '#3b82f6',
        accent: '#fbbf24',
        secondary: '#e5e7eb',
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in forwards',
        modalOpen: 'modalOpen 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        modalOpen: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};