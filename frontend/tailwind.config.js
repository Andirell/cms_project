/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        steel: '#1f2933',
        graphite: '#111827',
        blueprint: '#12324a',
        paper: '#eef2ee',
        concrete: '#d9dee3',
        caution: '#f4b400',
        moss: '#2f6f4e',
        clay: '#944507',
        danger: '#b42318',
      },
      boxShadow: {
        lift: '0 12px 32px rgba(17, 24, 39, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
