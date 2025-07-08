import { DefaultTheme } from 'styled-components/native';

export const theme: DefaultTheme = {
  spacing: {
    xxxsmall: '4px',
    xxsmall: '8px',
    xsmall: '12px',
    small: '16px',
    medium: '24px',
    large: '32px',
    xlarge: '48px',
    xxlarge: '64px',
    xxxlarge: '96px',
  },
  color: {
    surface: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
      highlight: '#007AFF',
    },
    border: {
      subtle: '#E0E0E0',
      minimal: '#F0F0F0',
    },
  },
  breakpoints: {
    small: '576px',
    medium: '768px',
    large: '1024px',
  },
  radius: {
    small: 4,
    medium: 8,
    large: 16,
  },
}; 