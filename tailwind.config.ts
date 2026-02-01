import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Hyundai/Kia Brand Colors
        hyundai: {
          blue: {
            50: '#E6F0F5',
            100: '#CCE1EB',
            200: '#99C3D7',
            300: '#66A5C3',
            400: '#3387AF',
            500: '#002C5F', // Primary Blue (마이현대 네이비)
            600: '#002350',
            700: '#001A3D',
            800: '#001129',
            900: '#000814',
          },
          gray: {
            50: '#F5F5F5', // 마이현대 배경색
            100: '#EEEEEE',
            200: '#DDDDDD',
            300: '#BBBBBB',
            400: '#999999',
            500: '#888888',
            600: '#666666',
            700: '#444444',
            800: '#222222',
            900: '#111111',
          },
        },
        kia: {
          red: {
            50: '#FCE8E8',
            100: '#F9D1D1',
            200: '#F3A3A3',
            300: '#ED7575',
            400: '#E74747',
            500: '#E11919', // Primary Red
            600: '#B41414',
            700: '#870F0F',
            800: '#5A0A0A',
            900: '#2D0505',
          },
          dark: {
            50: '#E5E7E9',
            100: '#CCCFD3',
            200: '#999FA7',
            300: '#666F7B',
            400: '#333F4F',
            500: '#000F23', // Primary Dark
            600: '#000C1C',
            700: '#000915',
            800: '#00060E',
            900: '#000307',
          },
        },
        // Semantic Colors
        semantic: {
          success: {
            light: '#C8E6C9',
            main: '#00C853',
            dark: '#007E33',
          },
          warning: {
            light: '#FFE0B2',
            main: '#FFA726',
            dark: '#F57C00',
          },
          error: {
            light: '#FFCDD2',
            main: '#E53935',
            dark: '#C62828',
          },
          info: {
            light: '#BBDEFB',
            main: '#2196F3',
            dark: '#1976D2',
          },
        },
        // Neutral Colors
        neutral: {
          white: '#FFFFFF',
          black: '#000000',
        },
      },
      fontFamily: {
        sans: ['HyundaiSans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'card': '1rem', // 마이현대 스타일 카드
        'full': '9999px',
      },
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': 'none', // 마이현대 스타일: 그림자 없음
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'nav': '0 -1px 0 0 rgba(0, 0, 0, 0.06)', // 얇은 상단 라인만
        'lg': '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
        'xl': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'page': 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
