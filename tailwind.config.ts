import type { Config } from 'tailwindcss';

/**
 * Fundly design tokens. Colours are defined once as CSS variables in
 * src/styles/index.css and exposed here so components never hard-code hex values.
 */
const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: withVar('paper'),
        surface: withVar('surface'),
        mist: withVar('mist'),
        ink: withVar('ink'),
        slate: withVar('slate'),
        line: withVar('line'),
        brand: {
          DEFAULT: withVar('brand'),
          mark: withVar('brand-mark'),
          soft: withVar('brand-soft'),
          deep: withVar('brand-deep'),
        },
        sky: { soft: withVar('sky-soft') },
        ok: { DEFAULT: withVar('ok'), soft: withVar('ok-soft') },
        warn: { DEFAULT: withVar('warn'), soft: withVar('warn-soft') },
        bad: { DEFAULT: withVar('bad'), soft: withVar('bad-soft') },
        info: { DEFAULT: withVar('info'), soft: withVar('info-soft') },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk Variable"', '"Anek Bangla Variable"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Modular scale (~1.25) - hero is fluid and set in CSS.
        meta: ['0.8125rem', { lineHeight: '1.25rem' }],
        body: ['0.9375rem', { lineHeight: '1.6rem' }],
        lead: ['1.0625rem', { lineHeight: '1.75rem' }],
        card: ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        section: ['clamp(1.5rem, 1.2rem + 1.2vw, 1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        page: ['clamp(1.875rem, 1.5rem + 1.4vw, 2.5rem)', { lineHeight: '1.12', letterSpacing: '-0.025em' }],
        hero: ['clamp(2.5rem, 1.6rem + 3.4vw, 4rem)', { lineHeight: '1.04', letterSpacing: '-0.035em' }],
      },
      borderRadius: {
        control: '10px',
        card: '16px',
        panel: '24px',
      },
      boxShadow: {
        hair: '0 0 0 1px rgb(var(--ink) / 0.06)',
        lift: '0 1px 2px rgb(var(--ink) / 0.05), 0 4px 12px -4px rgb(var(--ink) / 0.08)',
        float: '0 1px 1px rgb(var(--ink) / 0.04), 0 12px 32px -12px rgb(var(--ink) / 0.18), 0 32px 64px -32px rgb(var(--ink) / 0.14)',
        glass: 'inset 0 1px 0 rgb(255 255 255 / 0.85), 0 0 0 1px rgb(var(--ink) / 0.06), 0 10px 30px -14px rgb(var(--ink) / 0.18)',
        focus: '0 0 0 3px rgb(var(--brand) / 0.28)',
      },
      maxWidth: {
        shell: '1200px',
        prose: '66ch',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
