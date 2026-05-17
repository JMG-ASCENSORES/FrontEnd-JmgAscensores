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
        // AI accent (used ONLY in AI-generated content / AI module branding)
        ai: {
          DEFAULT: '#06b6d4',
          dark:    '#0e7490',
          light:   '#67e8f9',
          muted:   '#ecfeff',
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
        // AI: shimmer bar that sweeps across an element (use with bg-gradient + bg-[length:200%_100%])
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // AI: orb pulse with soft expanding ring
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(6, 182, 212, 0)' },
        },
        // AI: panel entrance with scale + soft glow that fades out
        'ai-enter': {
          '0%':   { opacity: '0', transform: 'scale(0.97)', boxShadow: '0 0 0 0 rgba(6, 182, 212, 0)' },
          '40%':  { opacity: '1', transform: 'scale(1)',    boxShadow: '0 0 32px 4px rgba(6, 182, 212, 0.25)' },
          '100%': { opacity: '1', transform: 'scale(1)',    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.2s ease-out',
        'fade-in-up':     'fade-in-up 0.3s ease-out',
        'fadeInUp':       'fade-in-up 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.68,-0.55,0.265,1.55)',
        'shimmer':        'shimmer 2.2s linear infinite',
        'glow-pulse':     'glow-pulse 2s ease-in-out infinite',
        'ai-enter':       'ai-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
