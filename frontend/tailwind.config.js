/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0B0D',
        surface: '#141416',
        surface2: '#1B1B1F',
        surface3: '#24242A',
        ink: '#F5F5F5',
        muted: '#B8B8C2',
        divider: 'rgba(255,255,255,0.06)',
        emerald: '#22C55E',
        'emerald-dark': '#2E7D32',
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#EF4444',
        'blue-accent': '#2563EB',
        gold: {
          300: '#F3CA7C',
          400: '#E8B355',
          500: '#D99B2B',
        },
        forest: {
          400: '#5FAE6E',
          500: '#3F8E4F',
          600: '#2E6E3C',
          700: '#1F4E2A',
        },
      },
      fontFamily: {
        display: ['"Inter"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 24px 80px rgba(0,0,0,0.35)',
        panel: '0 22px 68px rgba(0,0,0,0.22)',
      },
      backgroundImage: {
        'hero-fade': 'radial-gradient(circle at top, rgba(34,197,94,0.16), transparent 40%), radial-gradient(circle at bottom right, rgba(232,179,85,0.14), transparent 35%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        slideUpFade: 'slideUpFade 0.7s ease forwards',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};
