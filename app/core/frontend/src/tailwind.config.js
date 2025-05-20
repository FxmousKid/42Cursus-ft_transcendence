/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3490dc',
          '50': '#f0f7ff',
          '100': '#e0edff',
          '200': '#c7deff',
          '300': '#a4c6ff',
          '400': '#78a6ff',
          '500': '#5081f5',
          '600': '#3a5de8',
          '700': '#2c48d1',
          '800': '#2a3ea7',
          '900': '#283a82',
          '950': '#1d2451',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
} 