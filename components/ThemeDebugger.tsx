import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from 'styled-components/native';

export const ThemeDebugger = () => {
  const theme = useTheme();
  
  return (
    <ScrollView style={{ maxHeight: 200, borderWidth: 1, borderColor: 'red', padding: 10 }}>
      <Text>Theme Debug:</Text>
      <Text>breakpoints: {JSON.stringify(theme.breakpoints)}</Text>
      <Text>spacing: {JSON.stringify(theme.spacing)}</Text>
      <Text>color: {JSON.stringify(theme.color?.surface)}</Text>
    </ScrollView>
  );
};
