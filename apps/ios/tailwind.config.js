/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        base: '#ffffff',
        ink: '#0b0b0b',
        accent: '#00f5d4',
        muted: '#f4f4f5',
        border: '#0b0b0b',
      },
      borderRadius: {
        xl: '18px',
      },
      boxShadow: {
        neon: '0 0 0 1px #0b0b0b, 0 10px 30px rgba(0,0,0,0.18), 0 0 25px rgba(0,255,242,0.35)',
      },
    },
  },
  plugins: [],
};

