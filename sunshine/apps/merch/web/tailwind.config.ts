import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf6ec',
          100: '#f9e2c5',
          200: '#f4ca99',
          300: '#eeb16d',
          400: '#e79a48',
          500: '#d97e21',
          600: '#ad6419',
          700: '#814912',
          800: '#55300b',
          900: '#2b1805',
        },
      },
      boxShadow: {
        card: '0 20px 45px -25px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
