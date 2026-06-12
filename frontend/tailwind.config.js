/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        panel: 'var(--color-panel)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface-2)',
        ink: 'var(--color-ink)',
        graphite: 'var(--color-muted)',
        faint: 'var(--color-faint)',
        chalk: 'var(--color-bg)',
        paper: 'var(--color-panel)',
        rule: 'var(--color-border-2)',
        softRule: 'var(--color-border)',
        brass: 'var(--color-accent)',
        teal: 'var(--color-accent)',
        wine: 'var(--color-danger)',
        accent: 'var(--color-accent)',
        accentBg: 'var(--color-accent-bg)',
        accentRing: 'var(--color-accent-ring)',
        ok: 'var(--color-ok)',
        okBg: 'var(--color-ok-bg)',
        danger: 'var(--color-danger)',
        dangerBg: 'var(--color-danger-bg)',
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
      },
    },
  },
  plugins: [],
}
