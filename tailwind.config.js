/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C5CE7',
          light: '#A29BFE',
          dark: '#5A4BD1',
        },
        secondary: {
          DEFAULT: '#00CEC9',
          light: '#55EFC4',
          dark: '#00B894',
        },
        accent: {
          DEFAULT: '#FD79A8',
          light: '#FAB1D0',
          dark: '#E84393',
        },
        background: {
          DEFAULT: '#F8F9FA',
          dark: '#1A1A2E',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#16213E',
        },
        muted: {
          DEFAULT: '#6C757D',
          light: '#ADB5BD',
        },
      },
    },
  },
  plugins: [],
};
