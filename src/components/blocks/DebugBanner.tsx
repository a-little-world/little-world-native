import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useDebugStore } from '@/src/store/debugStore';

const BANNER_HEIGHT = 20;

export function InsetsProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const bannerHeight = useDebugStore(s =>
    s.backendUrlOverride ? BANNER_HEIGHT : 0,
  );

  return (
    <SafeAreaInsetsContext.Provider
      value={{ ...insets, top: insets.top + bannerHeight }}
    >
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

export default function DebugBanner() {
  const override = useDebugStore(s => s.backendUrlOverride);
  const insets = useSafeAreaInsets();

  if (!override) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.banner, { top: insets.top, height: BANNER_HEIGHT }]}
    >
      <Text style={styles.text} numberOfLines={1}>
        ⚠️ Backend override: {override}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    zIndex: 10000,
  },
  text: { fontSize: 12, fontWeight: '600', color: '#000' },
});
