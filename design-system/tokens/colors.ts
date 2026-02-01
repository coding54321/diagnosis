/**
 * Hyundai/Kia Design System - Color Tokens
 * 
 * 현대/기아 브랜드 컬러 및 시맨틱 컬러 정의
 * 참고: 현대/기아 공식 브랜드 가이드라인 기반
 */

export const colors = {
  // Hyundai Brand Colors
  hyundai: {
    blue: {
      50: '#E6F0F5',
      100: '#CCE1EB',
      200: '#99C3D7',
      300: '#66A5C3',
      400: '#3387AF',
      500: '#0069A3', // Primary Blue
      600: '#005482',
      700: '#003F62',
      800: '#002A41',
      900: '#001521',
    },
    gray: {
      50: '#F8F9FA',
      100: '#E5E5E5',
      200: '#CCCCCC',
      300: '#B3B3B3',
      400: '#999999',
      500: '#808080',
      600: '#666666',
      700: '#4D4D4D',
      800: '#333333',
      900: '#1A1A1A',
    },
  },

  // Kia Brand Colors
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

  // Semantic Colors (상태 표시용)
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
} as const;

// 타입 정의
export type ColorToken = typeof colors;
