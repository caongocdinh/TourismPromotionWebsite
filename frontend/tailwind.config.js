/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af', // Màu chính (blue-800)
        'primary-dark': '#1e3a8a', // Màu đậm hơn (blue-900)
        'primary-light': '#3b82f6', // Màu nhạt hơn (blue-500)
        accent: '#fbbf24', // Màu nhấn (yellow-400)
        secondary: '#e5e7eb', // Màu phụ (gray-200)
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'), 
    require('@tailwindcss/typography')
  ],
  daisyui: { // Sửa chính tả từ "daisy" thành "daisyui"
    themes: [
      "pastel", // Theme mặc định
      "retro",
      "coffee",
      "forest",
      "cyberpunk",
      "synthwave",
      "luxury",
      "autumn",
      "valentine",
      "aqua",
      "business",
      "night",
      "dracula",
    ],
  },
};