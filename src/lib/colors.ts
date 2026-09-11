export const colors = {
  // Brand & Accent Colors (Insightlancer reference)
  primary: '#0C3464',       // Deep Cobalt Navy (Reference Hero)
  primaryAccent: '#1D58A7', // Vivid Blue
  primaryLight: '#EBF2FC',  // Pastel Soft Blue
  primaryGlow: 'rgba(12, 52, 100, 0.08)',
  
  // Secondary & Functional
  secondary: '#2563EB',    
  accent: '#10B981',       
  
  // Status Colors
  success: '#10B981',      
  successDim: 'rgba(16,185,129,0.12)',
  error: '#EF4444',        
  errorDim: 'rgba(239,68,68,0.10)',
  warning: '#F59E0B',      
  warningDim: 'rgba(245,158,11,0.12)',
  info: '#2563EB',         
  
  // Text Colors
  text: '#0B1527',         
  textSecondary: '#64748B',
  onSurface: '#0B1527',
  onSurfaceVariant: '#64748B',
  onPrimary: '#FFFFFF',
  
  // Surface Colors (Soft airy white & grey-blue backdrop)
  background: '#F5F8FC',   
  surface: '#FFFFFF',      
  surfaceHigh: '#F0F4FA',
  border: '#E2E8F0',       
  surfaceBorder: '#E5ECF6',
  
  // Hero / Card Navy Style from Reference
  navyCard: '#0C3464',
  navyCardBorder: '#144272',
  navyCardText: '#FFFFFF',
  navyCardSub: '#A5C4EC',
  
  // Shadows & backwards compatibility
  shadow: 'rgba(11, 21, 39, 0.08)',
  shadowDark: 'rgba(11, 21, 39, 0.15)',
  buttonText: '#FFFFFF',
  overlay: 'rgba(11, 21, 39, 0.45)',
  
  // Light Glassmorphism effects
  glass: 'rgba(255, 255, 255, 0.90)',
  glassBorder: 'rgba(229, 236, 246, 0.8)',
};

export const layout = {
  screenPadding: 20,       // 20px edge margin on all screens
  cardRadius: 20,          // standard 20px card radius
  cardInnerPadding: 16,    // consistent internal padding
  buttonHeight: 50,        // standard primary button height
  buttonRadius: 25,        // pill button radius
  iconBoxSize: 36,         // icon container dimensions
  iconBoxRadius: 12,       // icon container radius
  spacingUnit: 8,          // base 8px grid
};

export const theme = {
  dark: false,
  cardRadius: 20,
  badgeRadius: 12,
  pillRadius: 24,
  borderRadius: 16,
  buttonRadius: 25,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.error,
  },
};


