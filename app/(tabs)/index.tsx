import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Login from '@/main_frontend/src/components/views/Login';
import { Provider } from 'react-redux';
import store from '@/main_frontend/src/app/store';

import {
  CustomThemeProvider,
  GlobalStyles,
  Card,
  Button,
} from '@a-little-world/little-world-design-system';

import styled from 'styled-components/native';
import { ThemeProvider } from 'styled-components/native';

export const StyledCard = styled(Card)`
  position: relative;
  max-width: 500px;
  align-self: flex-start;
  flex: 1;
`;

export default function HomeScreen() {
  return (
    <Provider store={store}>
      <CustomThemeProvider>
        <GlobalStyles />
        <Login />
      </CustomThemeProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
