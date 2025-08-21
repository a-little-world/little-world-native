// Page.tsx
import React, { useCallback, useRef, useState } from 'react';
import { View, Button } from 'react-native';
import LittleWorldWebLazy, {
  type DomAPI, type DomResponse
} from '@/src/components/blocks/LittleWorldWebLazy';

export default function Page() {
  const domRef = useRef<DomAPI>(null);
  const pendingRequestsRef = useRef<Map<string, { resolve: (value: DomResponse) => void; reject: (reason: any) => void }>>(new Map());

  const handleDomMessage = useCallback(async (action: string, payload?: object): Promise<DomResponse> => {
    console.log("DOM MESSAGE", action, payload);
    return { ok: true };
  }, []);

  const sendToReactNative = useCallback((action: string, payload?: object) => {
    console.log("CALLBACK FUNC", action, payload);
    
    // Handle response from DOM component
    if (action === 'response') {
      console.log("Received response from DOM via callback:", payload);
      const responsePayload = payload as { originalAction: string; originalPayload: object; response: DomResponse };
      
      // Find and resolve the pending request
      const requestKey = `${responsePayload.originalAction}_${JSON.stringify(responsePayload.originalPayload)}`;
      const pendingRequest = pendingRequestsRef.current.get(requestKey);
      
      if (pendingRequest) {
        console.log("Resolving pending request:", requestKey);
        pendingRequest.resolve(responsePayload.response);
        pendingRequestsRef.current.delete(requestKey);
      } else {
        console.log("No pending request found for:", requestKey);
      }
    }
  }, []);

  const sendToDom = useCallback(async (action: string, payload?: object) => {
    console.log("Attempting to send to DOM:", action, payload);
    
    if (!domRef.current) {
      console.log("DOM ref not ready");
      return { ok: false, error: 'DOM not ready' };
    }
    
    try {
      // Create a promise that will be resolved when the response comes via callback
      const responsePromise = new Promise<DomResponse>((resolve, reject) => {
        const requestKey = `${action}_${JSON.stringify(payload)}`;
        console.log("Creating pending request:", requestKey);
        
        // Store the promise resolvers
        pendingRequestsRef.current.set(requestKey, { resolve, reject });
        
        // Set a timeout to reject the promise if no response comes
        setTimeout(() => {
          if (pendingRequestsRef.current.has(requestKey)) {
            console.log("Request timeout for:", requestKey);
            pendingRequestsRef.current.delete(requestKey);
            reject(new Error('Response timeout'));
          }
        }, 5000); // 5 second timeout
      });
      
      // Send the request to DOM component (don't await the return value)
      domRef.current.receive(action, payload);
      console.log("Request sent to DOM, waiting for response via callback...");
      
      // Wait for the response to come via the callback
      const response = await responsePromise;
      console.log("Received response from DOM via callback:", response);
      return response;
      
    } catch (error) {
      console.error("Error in sendToDom:", error);
      return { ok: false, error: String(error) };
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
        <Button
          title="Ping DOM"
          onPress={() => {
            console.log("Button pressed, sending request to DOM...");
            sendToDom('PING', { message: 'Hello from React Native' }).then((response) => {
              console.log('(BRIDGE) PING ->', response);
            }).catch((error) => {
              console.error('(BRIDGE) Error:', error);
            });
          }}
        />
      </View>
      <LittleWorldWebLazy 
        ref={domRef}
        onMessage={handleDomMessage} 
        sendToReactNative={sendToReactNative}
      />
    </View>
  );
}