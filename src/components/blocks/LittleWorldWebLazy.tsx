// LittleWorldWebLazy.tsx
'use dom';

import React, { Suspense, lazy, forwardRef, useEffect, useState, useCallback } from 'react';
import { useDOMImperativeHandle } from 'expo/dom';

const LittleWorldWebNative = lazy(() =>
  import('littleplanet').then((m) => ({ default: m.LittleWorldWebNative }))
);

export type NativeResponse = { ok: true; data?: unknown } | { ok: false; error: string };
export type DomResponse = NativeResponse;
export type DomAPI = { receive(action: string, payload?: object): Promise<DomResponse> };

type Props = {
  sendToReactNative: (action: string, payload?: object) => void;
  onMessage: (action: string, payload?: object) => void;
  dom?: import('expo/dom').DOMProps;
};

export default forwardRef<DomAPI, Props>(function LittleWorldWebLazy(
  { sendToReactNative, onMessage },
  ref
) {

  // Debug: check which environment we're in
  useEffect(() => {
    console.log("LittleWorldWebLazy component mounted");
    console.log("window.ReactNativeWebView exists:", typeof (window as any).ReactNativeWebView !== 'undefined');
    console.log("globalThis._domRefProxy exists:", typeof (globalThis as any)._domRefProxy !== 'undefined');
  }, []);

  // Set up imperative handle immediately (not in useEffect)
  console.log("Setting up imperative handle immediately");
  
  const receive = async (action: string, payload?: object) => {
    console.log("RECEIVE called with:", action, payload);
    
    // Process the request in the DOM component and send response via sendToReactNative
    let response: DomResponse;
    
    switch (action) {
      case 'PING':
        console.log("DOM component handling PING request");
        response = { ok: true, data: 'PONG' };
        break;
      case 'console.log':
        console.log("DOM component handling console.log request:", payload);
        response = { ok: true, data: { "message": "PONG" } };
        break;
      default:
        console.log("DOM component unknown action:", action);
        response = { ok: false, error: 'Unknown action' };
        break;
    }
    
    console.log("DOM component sending response via sendToReactNative:", response);
    
    // Send response back to native side via the working communication channel
    sendToReactNative('response', {
      originalAction: action,
      originalPayload: payload,
      response: response
    });
    
    console.log("Response sent via callback, returning from receive method");
    
    // Return the actual response (though native side won't use this return value)
    return response;
  };

  useDOMImperativeHandle(ref, () => {
    console.log("Imperative handle factory called");
    return {
      receive
    };
  }, []);

  useEffect(() => { 
    const respo = onMessage('console.log', { message: `React Native Webview first render\n Window Info: ${JSON.stringify(window.location)}\n Dimensions: ${window.innerWidth}x${window.innerHeight}` });
    console.log("RESPONSE", respo);
  }, [onMessage]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LittleWorldWebNative sendMessageToReactNative={sendToReactNative} />
    </Suspense>
  );
});