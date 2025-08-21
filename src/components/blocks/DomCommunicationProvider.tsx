import React, { createContext, useContext, useCallback, useRef, useState, ReactNode } from 'react';
import { View, Button, TextInput, Text } from 'react-native';
import LittleWorldWebLazy, {
  type DomAPI, type DomResponse
} from './LittleWorldWebLazy';
import { useDomCommunication } from '@/src/hooks/useDomCommunication';

// Configuration flag to control debug UI visibility
const SHOW_DEBUG_UI = true; // Set to false to hide debug controls

interface DomCommunicationContextType {
  sendToDom: (action: string, payload?: object) => Promise<DomResponse>;
  domRef: React.RefObject<DomAPI>;
}

const DomCommunicationContext = createContext<DomCommunicationContextType | null>(null);

export function useDomCommunicationContext() {
  const context = useContext(DomCommunicationContext);
  if (!context) {
    throw new Error('useDomCommunicationContext must be used within a DomCommunicationProvider');
  }
  return context;
}

interface DomCommunicationProviderProps {
  children: ReactNode;
}

export function DomCommunicationProvider() {
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
    } else if (action === 'action_request') {
      // Forward action requests to the DOM component via handleDomMessage
      // This allows LittleWorldWebNative to intercept and handle actions
      console.log("Forwarding action request to DOM:", payload);
      handleDomMessage('action_request', payload);
    } else {
      console.log("Message from DOM:", action, payload);
    }
  }, [handleDomResponse, handleDomMessage]);

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

  const contextValue: DomCommunicationContextType = {
    sendToDom: (action: string, payload?: object) => sendToDom(domRef, action, payload),
    domRef
  };

  return (
    <DomCommunicationContext.Provider value={contextValue}>
      {SHOW_DEBUG_UI && (
        <View style={{ 
          position: 'absolute', 
          top: 50, 
          right: 20, 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          padding: 12, 
          borderRadius: 8, 
          borderWidth: 1, 
          borderColor: '#ccc',
          maxWidth: 300,
          zIndex: 1000
        }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>DOM Debug Panel</Text>
          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Message to send to DOM"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 6,
              marginBottom: 8,
              fontSize: 12
            }}
          />
          <Button
            title="Ping DOM"
            onPress={handlePingDom}
          />
          <Text style={{ marginTop: 8, fontSize: 11 }}>
            {lastResponse ? `Response: ${JSON.stringify(lastResponse)}` : 'Response: (none)'}
          </Text>
        </View>
      )}
      
      <LittleWorldWebLazy 
        ref={domRef}
        onMessage={handleDomMessage} 
        sendToReactNative={sendToReactNative}
      />
    </DomCommunicationContext.Provider>
  );
} 