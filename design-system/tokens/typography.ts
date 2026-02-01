/**
 * Hyundai/Kia Design System - Typography Tokens
 * 
 * Hyundai Sans 폰트 기반 타이포그래피 시스템
 */

export const typography = {
  fontFamily: {
    sans: ['HyundaiSans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
  },

  fontSize: {
    xs: {
      size: '0.75rem',    // 12px
      lineHeight: '1rem',  // 16px
    },
    sm: {
      size: '0.875rem',   // 14px
      lineHeight: '1.25rem', // 20px
    },
    base: {
      size: '1rem',       // 16px
      lineHeight: '1.5rem', // 24px
    },
    lg: {
      size: '1.125rem',   // 18px
      lineHeight: '1.75rem', // 28px
    },
    xl: {
      size: '1.25rem',    // 20px
      lineHeight: '1.75rem', // 28px
    },
    '2xl': {
      size: '1.5rem',     // 24px
      lineHeight: '2rem', // 32px
    },
    '3xl': {
      size: '1.875rem',   // 30px
      lineHeight: '2.25rem', // 36px
    },
    '4xl': {
      size: '2.25rem',    // 36px
      lineHeight: '2.5rem', // 40px
    },
    '5xl': {
      size: '3rem',       // 48px
      lineHeight: '1',    // 48px
    },
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// 타이포그래피 스타일 프리셋
export const textStyles = {
  // Display Styles
  display1: {
    fontSize: typography.fontSize['5xl'].size,
    lineHeight: typography.fontSize['5xl'].lineHeight,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  display2: {
    fontSize: typography.fontSize['4xl'].size,
    lineHeight: typography.fontSize['4xl'].lineHeight,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },

  // Heading Styles
  h1: {
    fontSize: typography.fontSize['3xl'].size,
    lineHeight: typography.fontSize['3xl'].lineHeight,
    fontWeight: typography.fontWeight.bold,
  },
  h2: {
    fontSize: typography.fontSize['2xl'].size,
    lineHeight: typography.fontSize['2xl'].lineHeight,
    fontWeight: typography.fontWeight.semibold,
  },
  h3: {
    fontSize: typography.fontSize.xl.size,
    lineHeight: typography.fontSize.xl.lineHeight,
    fontWeight: typography.fontWeight.semibold,
  },
  h4: {
    fontSize: typography.fontSize.lg.size,
    lineHeight: typography.fontSize.lg.lineHeight,
    fontWeight: typography.fontWeight.medium,
  },

  // Body Styles
  body1: {
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    fontWeight: typography.fontWeight.normal,
  },
  body2: {
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    fontWeight: typography.fontWeight.normal,
  },

  // Caption Styles
  caption: {
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    fontWeight: typography.fontWeight.normal,
  },
} as const;

export type TypographyToken = typeof typography;
export type TextStyle = typeof textStyles;
