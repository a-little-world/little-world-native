import 'styled-components/native';

interface Theme {
  spacing: {
    xxxsmall: string;
    xxsmall: string;
    xsmall: string;
    small: string;
    medium: string;
    large: string;
    xlarge: string;
    xxlarge: string;
    xxxlarge: string;
  };
  color: {
    surface: {
      primary: string;
      secondary: string;
    };
    text: {
      primary: string;
      secondary: string;
      highlight: string;
    };
    border: {
      subtle: string;
      minimal: string;
    };
  };
  breakpoints: {
    small: string;
    medium: string;
    large: string;
  };
}

declare module 'styled-components/native' {
  export interface DefaultTheme extends Theme {}
} 