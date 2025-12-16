/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        colors: {
          brand: {
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
          }
        }
      },
    },
    plugins: [],
  }