import { StyleSheet, Dimensions } from 'react-native';
import { DefaultTheme } from 'styled-components/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const getLoadingScreenStyles = (theme: DefaultTheme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      width: screenWidth,
      height: screenHeight,
      minWidth: screenWidth,
      minHeight: screenHeight,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.color.surface.primary,
    },
  });
};

