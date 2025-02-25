import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import Login from '@/components/views/Login';
import { CustomThemeProvider } from '@a-little-world/little-world-design-system-native';
import { ThemeDebugger } from '@/components/ThemeDebugger';

// Simple styled component for testing
const StyledView = styled.View`
  padding: 10px;
  background-color: ${props => props.theme.color?.surface?.background || '#eee'};
`;

export default function Page() {
  return (
    <CustomThemeProvider>
      <StyledView>
        <Text>Testing styled component</Text>
      </StyledView>
      <ThemeDebugger />
      {/* <Login /> */}
    </CustomThemeProvider>
  );
}

