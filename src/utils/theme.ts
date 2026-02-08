export const colors = {
  // Primary (modern indigo - replaces #007bff blue)
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primaryLight: '#EEF2FF',

  // Success (modern emerald - replaces #28a745 green)
  success: '#10B981',
  successHover: '#059669',
  successLight: '#D1FAE5',

  // Danger (modern red - replaces #dc3545)
  danger: '#EF4444',
  dangerHover: '#DC2626',
  dangerLight: '#FEE2E2',

  // Info/Suspended (modern cyan - replaces ice blue)
  info: '#06B6D4',
  infoHover: '#0891B2',
  infoLight: '#CFFAFE',

  // Neutrals
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray600: '#4B5563',
  gray700: '#374151',
  gray900: '#111827',
};

export const spacing = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '16px',
};

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  base: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  md: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
};

export const transitions = {
  fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  base: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const buttonStates = {
  hover: {
    transform: 'translateY(-1px)',
    transition: transitions.fast,
  },
  active: {
    transform: 'scale(0.97)',
    transition: transitions.fast,
  },
};
