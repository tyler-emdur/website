import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hub:     '#070710',
        run:     '#FF4422',
        build:   '#3B82F6',
        archive: '#C8A882',
        explore: '#22C55E',
        lab:     '#A855F7',
        ink:     '#F0EDE8',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans:  ['var(--font-sans)',  'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)',  'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
} satisfies Config
