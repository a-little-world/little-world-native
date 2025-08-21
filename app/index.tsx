// Page.tsx
import React, { useCallback, useRef, useState } from 'react';
import { View, Button, TextInput, Text } from 'react-native';
import LittleWorldWebLazy, {
  type DomAPI, type DomResponse
} from '@/src/components/blocks/LittleWorldWebLazy';
import { useDomCommunication } from '@/src/hooks/useDomCommunication';

export default function Page() {
  const domRef = useRef<DomAPI>(null);
  const { handleDomResponse, sendToDom } = useDomCommunication();
  const [inputMessage, setInputMessage] = useState<string>('Hello from React Native');
  const [lastResponse, setLastResponse] = useState<DomResponse | null>(null);

  const handleDomMessage = useCallback(async (action: string, payload?: object): Promise<DomResponse> => {
    console.log("DOM MESSAGE", action, payload);
    return { ok: true };
  }, []);

  const sendToReactNative = useCallback((action: string, payload?: object) => {
    // Handle response from DOM component
    if (action === 'response') {
      handleDomResponse(action, payload);
    } else {
      console.log("Message from DOM:", action, payload);
    }
  }, [handleDomResponse]);

  const handlePingDom = useCallback(async () => {
    try {
      const response = await sendToDom(domRef, 'PING', { message: inputMessage });
      setLastResponse(response);
      console.log('(BRIDGE) PING ->', response);
    } catch (error) {
      const fallback: DomResponse = { ok: false, error: String(error) };
      setLastResponse(fallback);
      console.error('(BRIDGE) Error:', error);
    }
  }, [sendToDom, inputMessage]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ gap: 8, padding: 12 }}>
        <TextInput
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Message to send to DOM"
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 6,
            paddingHorizontal: 12,
            paddingVertical: 8
          }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            title="Ping DOM"
            onPress={handlePingDom}
          />
        </View>
        <Text style={{ marginTop: 8 }}>
          {lastResponse ? `Last response: ${JSON.stringify(lastResponse)}` : 'Last response: (none)'}
        </Text>
      </View>
      <LittleWorldWebLazy 
        ref={domRef}
        onMessage={handleDomMessage} 
        sendToReactNative={sendToReactNative}
      />
    </View>
  );
}