const tokens = [
  'background', 'foreground', 'card', 'card-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'border', 'input', 'ring',
];

module.exports = {
  darkMode: 'class',
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(tokens.map((token) => [token, `hsl(var(--${token}) / <alpha-value>)`])),
    },
  },
};
