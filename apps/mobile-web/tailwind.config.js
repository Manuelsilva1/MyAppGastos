const tokens = require('./src/theme/tokens.json');

/** Cada color semántico lee su variable CSS, así el mismo nombre cambia entre claro y oscuro. */
const semantic = Object.fromEntries(
  Object.keys(tokens.light).map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ...semantic,
        ...tokens.palette,
      },
      fontSize: Object.fromEntries(
        Object.entries(tokens.typography)
          .filter(([, value]) => typeof value === 'object')
          .map(([name, style]) => [
            name,
            [
              `${style.fontSize}px`,
              {
                lineHeight: `${style.lineHeight}px`,
                fontWeight: style.fontWeight,
                ...(style.letterSpacing ? { letterSpacing: `${style.letterSpacing}px` } : {}),
              },
            ],
          ]),
      ),
      spacing: Object.fromEntries(Object.entries(tokens.spacing).map(([k, v]) => [k, `${v}px`])),
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
      borderRadius: {
        input: '10px',
        card: '16px',
        sheet: '24px',
      },
    },
  },
  plugins: [],
};
