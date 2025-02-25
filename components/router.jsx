import {
  CustomThemeProvider,
  GlobalStyles,
} from '@a-little-world/little-world-design-system-native';
import React from 'react';

import RouterError from '@/components/blocks/ErrorView/ErrorView';
import FormLayout from '@/components/blocks/Layout/FormLayout';
import { LOGIN_ROUTE } from '@/components/routes';

export const Root = ({
  children,
  includeModeSwitch = true,
}) => (
  <CustomThemeProvider>
    <GlobalStyles />
    {children}
    {includeModeSwitch && <ModeSwitch />}
  </CustomThemeProvider>
);

export const ROUTES = [
  {
    path: LOGIN_ROUTE,
    element: (
      <FormLayout>
        <>LOgin VIEW</>
      </FormLayout>
    ),
    errorElement: <RouterError Layout={FormLayout} />,
  },
];