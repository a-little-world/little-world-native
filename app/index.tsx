// Page.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { DomCommunicationProvider, useDomCommunicationContext } from '@/src/components/blocks/DomCommunicationProvider';

export default function Page() {
  return (
    <DomCommunicationProvider>
      <View>
      </View>
    </DomCommunicationProvider>
  );
}