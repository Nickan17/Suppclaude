export const theme = {
  colors: {
    // Primary palette - soft and trustworthy
    primary: '#FF6B6B',     // Coral red for CTAs
    secondary: '#4ECDC4',   // Teal for success
    warning: '#FFE66D',     // Soft yellow
    danger: '#FF6B6B',      // Red for warnings
    
    // Grade colors
    gradeA: '#4ECDC4',
    gradeB: '#95E1D3',
    gradeC: '#FFE66D',
    gradeD: '#FFAB76',
    gradeF: '#FF6B6B',
    
    // Neutrals
    background: '#FAF9F9',
    surface: '#FFFFFF',
    text: '#2D3436',
    textMuted: '#636E72',
    border: '#E5E5E5',
    
    // Semantic colors
    success: '#4ECDC4',
    error: '#FF6B6B',
    info: '#74B9FF',
    
    // Shadows
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  radii: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
}

export type Theme = typeof theme
