// Design System Constants for Cutprint Photo App

export const Colors = {
  // Primary Brand Colors
  primary: '#3f3f42ff',        // Modern purple
  primaryLight: '#9a9aa1ff',
  primaryDark: '#27272aff',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',

  // Gray Scale
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Semantic Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Background Colors
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F9FA',

  // Text Colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textTertiary: '#BDBDBD',
  textInverse: '#FFFFFF',

  // Photo App Specific
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.8)',
};

export const Typography = {
  // Font Families
  fontFamily: {
    regular: 'Pretendard',
    medium: 'Pretendard-Medium',
    semiBold: 'Pretendard-SemiBold',
    bold: 'Pretendard-Bold',
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font Weights
  fontWeight: {
    normal: '400' as any,
    medium: '500' as any,
    semibold: '600' as any,
    bold: '700' as any,
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,

  // Component Specific
  containerPadding: 20,
  cardPadding: 16,
  sectionSpacing: 24,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  small: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  fab: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  }
};

export const Layout = {
  // Screen Dimensions
  screenPadding: 20,
  headerHeight: 60,
  tabBarHeight: 80,

  // Grid System
  gridGap: 8,
  photoAspectRatio: 1,

  // Animation Durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
  }
};

// Helper function for creating gradients
export const createGradient = (colors: string[]) => ({
  colors,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

export default {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadow,
  Layout,
  createGradient,
};