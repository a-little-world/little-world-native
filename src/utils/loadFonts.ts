import * as Font from 'expo-font';
import { fontFiles } from '@a-little-world/little-world-design-system-core';

export const loadFonts = async (): Promise<void> => {
  try {
    await Font.loadAsync(fontFiles);
    console.log('Fonts loaded successfully');
  } catch (error) {
    console.error('Error loading fonts:', error);
    throw error;
  }
};
