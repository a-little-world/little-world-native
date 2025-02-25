import { CustomThemeProvider, GlobalStyles} from '@/lw_components';
import { Provider } from 'react-redux';
import store from '@/components/store';

export const Root = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <Provider store={store}>
    <CustomThemeProvider>
      {children}
    </CustomThemeProvider>
  </Provider>
);
