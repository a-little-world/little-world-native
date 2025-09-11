// Page.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { DomCommunicationProvider } from '@/src/components/blocks/DomCommunicationCore';
import DomWebViewHost from '@/src/components/blocks/DomWebViewHost';
import DomDebugPanel from '@/src/components/blocks/DomDebugPanel';

export default function Page() {
  return (
    <DomCommunicationProvider>
      <View>
        <DomWebViewHost />
        <DomDebugPanel />
      </View>
    </DomCommunicationProvider>
  );
}