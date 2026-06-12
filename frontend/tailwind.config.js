/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#151515',
        graphite: '#272421',
        chalk: '#f6f1e8',
        paper: '#fffaf0',
        rule: '#d8ccbc',
        brass: '#b48a48',
        teal: '#126a62',
        wine: '#8a334c',
        sage: '#6f8063',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: '0 18px 54px rgba(33, 28, 23, 0.10)',
      },
    },
  },
  plugins: [],
}
