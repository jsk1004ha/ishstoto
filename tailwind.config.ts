import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#06111f',
          900: '#08192c',
          800: '#10243c'
        },
        neon: {
          blue: '#38bdf8',
          mint: '#34f5c5',
          orange: '#ff9f1c',
          pink: '#fb5cff'
        }
      },
      boxShadow: {
        glow: '0 0 28px rgba(56, 189, 248, 0.38)',
        mint: '0 0 24px rgba(52, 245, 197, 0.26)',
        orange: '0 0 24px rgba(255, 159, 28, 0.24)'
      },
      backgroundImage: {
        'arena-radial': 'radial-gradient(circle at top left, rgba(56,189,248,0.25), transparent 28%), radial-gradient(circle at top right, rgba(255,159,28,0.18), transparent 26%), linear-gradient(180deg, #06111f 0%, #08192c 48%, #06111f 100%)'
      }
    }
  },
  plugins: [forms]
};

export default config;
