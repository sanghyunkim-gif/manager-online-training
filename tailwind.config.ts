import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#cce3ff',
          200: '#99c7ff',
          300: '#66aaff',
          400: '#338eff',
          500: '#1570FF',
          600: '#0056e0',
          700: '#0042ad',
          800: '#002e7a',
          900: '#001a47',
          950: '#000d24',
        },
        accent: {
          50: '#fff4f2',
          100: '#ffe9e5',
          200: '#ffd3cc',
          300: '#ffbdb2',
          400: '#ffa799',
          500: '#FF4D37',
          600: '#e63d27',
          700: '#cc2d17',
          800: '#b31d07',
          900: '#8a1500',
          950: '#4d0b00',
        },
        success: {
          50: '#e6fff5',
          100: '#ccffeb',
          200: '#99ffd7',
          300: '#66ffc3',
          400: '#33ffaf',
          500: '#00CC7B',
          600: '#00b36b',
          700: '#009959',
          800: '#008047',
          900: '#006635',
          950: '#003d20',
        },
        neutral: {
          50: '#f8fafb',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#282B33',
          900: '#22252A',
          950: '#1a1c20',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-premium': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-sport': 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
        'gradient-night': 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(20, 184, 166, 0.4)',
        'glow-md': '0 0 25px rgba(20, 184, 166, 0.5)',
        'glow-lg': '0 0 35px rgba(20, 184, 166, 0.6)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.5)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
