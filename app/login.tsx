
import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import Login from '@/components/views/Login';
import { CustomThemeProvider } from '@a-little-world/little-world-design-system-native';
import { ThemeDebugger } from '@/components/ThemeDebugger';
import FormLayout from '@/components/blocks/Layout/FormLayout';

export default function Page() {
  return (
    <CustomThemeProvider>
      {/* <ThemeDebugger /> */}
      <FormLayout>
        <Login />
      </FormLayout>
    </CustomThemeProvider>
  );
}

