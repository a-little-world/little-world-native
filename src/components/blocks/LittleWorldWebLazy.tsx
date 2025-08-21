// LittleWorldWebLazy.tsx
'use dom';

import React, { Suspense, lazy, forwardRef, useEffect, useState, useCallback } from 'react';
import { useDOMImperativeHandle } from 'expo/dom';

const LittleWorldWebNative = lazy(() =>
  import('littleplanet').then((m) => ({ default: m.LittleWorldWebNative }))
);

export type NativeResponse = { ok: true; data?: unknown } | { ok: false; error: string };
export type DomResponse = NativeResponse;
export type DomAPI = { receive(action: string, payload?: object): void };

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
  }, []);

  // Set up imperative handle immediately (not in useEffect)
  
  const receive = (action: string, payload?: object) => {
    console.log("DOM: Processing request", action, payload);
    
    // Process the request in the DOM component and send response via sendToReactNative
    let response: DomResponse;
    
    switch (action) {
      case 'PING':
        response = { ok: true, data: `PONG window.location: ${window.location.href} originalPayload: ${JSON.stringify(payload)}` };
        break;
      case 'console.log':
        response = { ok: true, data: { "message": "PONG" } };
        break;
      default:
        response = { ok: false, error: 'Unknown action' };
        break;
    }
    
    // Send response back to native side via the working communication channel
    sendToReactNative('response', {
      originalAction: action,
      originalPayload: payload,
      response: response
    });
  };

  useDOMImperativeHandle(ref as any, () => {
    const factory = {
      receive: (...args: any[]) => {
        const [action, payload] = args;
        receive(action as string, payload as object | undefined);
      }
    } as unknown as import('expo/dom').DOMImperativeFactory;
    return factory;
  }, []);

  useEffect(() => { 
    onMessage('console.log', { message: `React Native Webview first render\n Window Info: ${JSON.stringify(window.location)}\n Dimensions: ${window.innerWidth}x${window.innerHeight}` });
  }, [onMessage]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LittleWorldWebNative sendMessageToReactNative={sendToReactNative} />
    </Suspense>
  );
});