/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0F6E56', light: '#1a9070', dark: '#0a4f3d' },
        secondary: { DEFAULT: '#185FA5', light: '#2177c7' },
        success: { DEFAULT: '#639922', light: '#7ab828' },
        warning: { DEFAULT: '#BA7517', light: '#d68a20' },
        danger: { DEFAULT: '#A32D2D', light: '#c43636' },
        neutral: { DEFAULT: '#5F5E5A', light: '#7a7975' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
