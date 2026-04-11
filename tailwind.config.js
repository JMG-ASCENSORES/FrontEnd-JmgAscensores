/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        // JMG Brand
        jmg: {
          DEFAULT: '#003B73',
          dark:    '#002a52',
          light:   '#0050a0',
          muted:   '#e8f0f9',
        },
        // Semantic (mantiene compatibilidad con código existente)
        primary:   '#003B73',
        secondary: '#334155',
        accent:    '#10b981',
        success:   '#22c55e',
        warning:   '#eab308',
        error:     '#ef4444',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(100%) scale(0.9)' },
          to:   { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.2s ease-out',
        'fade-in-up':     'fade-in-up 0.3s ease-out',
        'fadeInUp':       'fade-in-up 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.68,-0.55,0.265,1.55)',
      },
    },
  },
  plugins: [],
}
