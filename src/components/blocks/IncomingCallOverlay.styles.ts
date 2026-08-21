import { StyleSheet } from 'react-native';

import { DefaultTheme } from 'styled-components/native';

export const getIncomingCallOverlayStyles = (theme: DefaultTheme) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      // Above the WebView, below nothing else — this is a takeover screen.
      zIndex: 1000,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 64,
      paddingHorizontal: 24,
      backgroundColor: theme.color.surface.primary,
    },
    caller: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    avatar: {
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: theme.color.surface.secondary,
    },
    actions: {
      width: '100%',
      gap: 12,
    },
  });
