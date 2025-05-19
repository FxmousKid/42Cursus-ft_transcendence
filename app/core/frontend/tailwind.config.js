module.exports = {
  content: [
    './src/**/*.{html,js,ts}',
    './src/components/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7ac6fc',
          400: '#38a5f8',
          500: '#0c87eb',
          600: '#0069cc',
          700: '#0055a6',
          800: '#064887',
          900: '#0c3d70',
          950: '#082649',
        },
        dark: {
          100: '#d5d6d8',
          200: '#abacb1',
          300: '#81838b',
          400: '#575964',
          500: '#2d303d',
          600: '#242631',
          700: '#1b1d25',
          800: '#12131a',
          900: '#09090d',
        },
        accent: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
} 