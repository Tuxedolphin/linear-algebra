/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        graphite: 'var(--color-graphite)',
        chalk: 'var(--color-chalk)',
        paper: 'var(--color-paper)',
        rule: 'var(--color-rule)',
        brass: 'var(--color-brass)',
        teal: 'var(--color-teal)',
        wine: 'var(--color-wine)',
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
