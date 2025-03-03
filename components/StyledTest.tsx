import styled, { css } from 'styled-components/native';
import { TextTypes, TextProps } from '@a-little-world/little-world-design-system-native';
import { Platform, StyleSheet } from 'react-native';
import React from 'react';

const isSmallScreen = true;

const BODY_SHARED_STYLES = css``;

const HEADING_SHARED_STYLES = css`
  font-weight: bold;
`;

// Define styles using StyleSheet
const styles = StyleSheet.create({
  base: {
    fontFamily: Platform.OS === 'ios' ? 'Signika Negative' : 'Signika-Negative',
  },
  bold: {
    fontWeight: 'bold',
  },
  center: {
    textAlign: 'center',
  },
  // Define styles for each text type
  heading1: {
    fontSize: isSmallScreen ? 32 : 40, // Convert rem to numeric values
  },
  // ... other text types
});

export const TextTest = React.forwardRef<any, TextProps>(({
  bold = false,
  center = false,
  children,
  color,
  className,
  disableParser = false,
  id,
  style,
  tag = 'p',
  type = TextTypes.Body5,
  ...restProps
}, ref) => {
  
  // Determine which styles to apply
  const textStyles = [
    styles.base,
    type === TextTypes.Heading1 && styles.heading1,
    // ... other type conditions
    bold && styles.bold,
    center && styles.center,
  ].filter(Boolean);
  
  return (
    <StyledElement
      ref={ref}
      style={[...textStyles, style]}
      $type={type}
      $bold={bold}
      $center={center}
      {...restProps}
    >
      {children}
    </StyledElement>
  );
});

export const StyledElement = styled.Text<{
  $bold: boolean;
  $center: boolean;
  $color?: string;
  $type: keyof typeof TextTypes;
}>`
  font-family: ${Platform.OS === 'ios' ? 'Signika Negative' : 'Signika-Negative'};
  color: ${({ theme, $color }) => $color || theme.color.text.primary};
  
  /* Apply text type styles */
  ${({ $type }) => {
    switch ($type) {
      case TextTypes.Heading1:
        return css`
          ${HEADING_SHARED_STYLES}
          font-size: ${isSmallScreen ? '2rem' : '2.5rem'};
        `;
      case TextTypes.Heading2:
        return css`
          ${HEADING_SHARED_STYLES}
          font-size: ${isSmallScreen ? '1.75rem' : '2rem'};
        `;
      case TextTypes.Heading3:
        return css`
          ${HEADING_SHARED_STYLES}
          font-size: ${isSmallScreen ? '1.5rem' : '1.75rem'};
        `;
      case TextTypes.Heading4:
        return css`
          ${HEADING_SHARED_STYLES}
          font-size: ${isSmallScreen ? '1.25rem' : '1.5rem'};
        `;
      case TextTypes.Heading5:
        return css`
          ${HEADING_SHARED_STYLES}
          font-size: ${isSmallScreen ? '1.1rem' : '1.25rem'};
        `;
      case TextTypes.Body1:
        return css`
          ${BODY_SHARED_STYLES}
          font-size: 1.5rem;
        `;
      case TextTypes.Body2:
        return css`
          ${BODY_SHARED_STYLES}
          font-size: 1.375rem;
        `;
      case TextTypes.Body3:
        return css`
          ${BODY_SHARED_STYLES}
          font-size: 1.25rem;
        `;
      case TextTypes.Body4:
        return css`
          ${BODY_SHARED_STYLES}
          font-size: 1.125rem;
        `;
      case TextTypes.Body5:
      default:
        return css`
          ${BODY_SHARED_STYLES}
          font-size: 1rem;
        `;
    }
  }}
  
  /* Apply bold styling if needed */
  ${({ $bold }) => $bold && css`
    font-weight: bold;
  `}
  
  /* Apply center alignment if needed */
  ${({ $center }) => $center && css`
    text-align: center;
  `}
`;

