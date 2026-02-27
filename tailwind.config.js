/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#e6f4f9',
          100: '#b3dce9',
          500: '#2596be',
          600: '#1a7a9e',
          700: '#15607a',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      boxShadow: {
        'teal-sm': '0 2px 8px rgba(37, 150, 190, 0.1)',
        'teal-md': '0 4px 12px rgba(37, 150, 190, 0.2)',
      },
      spacing: {
        'nav-width': '320px',
      },
    },
  },
  plugins: [],
};
