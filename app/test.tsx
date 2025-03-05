import React from 'react';
import { CustomThemeProvider } from '@a-little-world/little-world-design-system-native';
import Test from '@/components/views/Test';

export default function Page() {
  return (
    <CustomThemeProvider>
      <Test />
    </CustomThemeProvider>
  );
}

