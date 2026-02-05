import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // MVP-3.3: Toss-inspired neutral grays
        gray: {
          50: '#F9FAFB',
          100: '#F2F4F6',
          200: '#E5E8EB',
          300: '#D1D6DB',
          400: '#B0B8C1',
          500: '#8B95A1',
          600: '#6B7684',
          700: '#4E5968',
          800: '#333D4B',
          900: '#191F28',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      // MVP-3.1: Toss-style typography scale
      fontSize: {
        // Headlines - Bold, Large
        'toss-h1': ['1.75rem', { lineHeight: '1.3', fontWeight: '700' }],  // 28px
        'toss-h2': ['1.375rem', { lineHeight: '1.4', fontWeight: '700' }], // 22px
        'toss-h3': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }], // 18px
        // Body - Regular
        'toss-body1': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],     // 16px
        'toss-body2': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }], // 14px
        // Caption - Light
        'toss-caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }], // 12px
      },
      // MVP-3.2: Toss 8px grid spacing system
      spacing: {
        'toss-xs': '0.25rem',  // 4px
        'toss-sm': '0.5rem',   // 8px
        'toss-md': '1rem',     // 16px
        'toss-lg': '1.5rem',   // 24px
        'toss-xl': '2rem',     // 32px
        'toss-2xl': '3rem',    // 48px
        'toss-3xl': '4rem',    // 64px
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        // MVP-2: List animations
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'fade-in-down': 'fade-in-down 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'slide-out-left': 'slide-out-left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'slide-out-right': 'slide-out-right 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'shimmer': 'shimmer 1.5s infinite',
        // Staggered animations with delays
        'stagger-1': 'fade-in-up 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) 0.05s forwards',
        'stagger-2': 'fade-in-up 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s forwards',
        'stagger-3': 'fade-in-up 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) 0.15s forwards',
        'stagger-4': 'fade-in-up 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) 0.2s forwards',
        'stagger-5': 'fade-in-up 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) 0.25s forwards',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // MVP-2: List animation keyframes
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-out-left': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-20px)' },
        },
        'slide-out-right': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
