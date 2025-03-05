import styled from 'styled-components/native';
import { Dimensions } from 'react-native';
import { Button, Card, Text } from '@a-little-world/little-world-design-system-native';
import { useWindowDimensions } from 'react-native';
import { useTheme } from 'styled-components/native';

import Header from '../Header';

const Wrapper = styled.View`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
`;

const Content = styled.View`
  display: flex;
  justify-content: center;
  flex: 1;
  overflow: hidden;

  ${({ theme }) => `
  padding: ${theme.spacing.small};
  `}
`;

const windowWidth = Dimensions.get('window').width;

export const StyledCard = styled(Card)`
  position: relative;
  max-width: 500px;
  align-self: flex-start;
  flex: 1;
  
  /* Apply conditional styling based on screen width */
  padding-top: ${({ theme }) => 
    windowWidth < parseInt(theme.breakpoints.small, 10) 
      ? theme.spacing.medium 
      : theme.spacing.small};
  padding-bottom: ${({ theme }) => 
    windowWidth < parseInt(theme.breakpoints.small, 10) 
      ? theme.spacing.medium 
      : theme.spacing.small};
`;

const FormLayout = ({ children }: { children: React.ReactNode }) => (
  <Wrapper>
    <Header />
    <Content>{children}</Content>
  </Wrapper>
);

export default FormLayout;

export function useResponsive() {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  
  return {
    isSmallScreen: width < parseInt(theme.breakpoints.small, 10),
    isMediumScreen: width >= parseInt(theme.breakpoints.small, 10) && width < parseInt(theme.breakpoints.medium, 10),
    isLargeScreen: width >= parseInt(theme.breakpoints.medium, 10),
    screenWidth: width,
    theme
  };
}

