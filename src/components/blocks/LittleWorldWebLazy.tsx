// LittleWorldWebLazy.tsx
'use dom';

import React, { Suspense, lazy, forwardRef, useEffect, useRef } from 'react';
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
  useEffect(() => {
    console.log("LittleWorldWebLazy component mounted");
  }, []);

  // Allow inner component to override how actions are handled
  const customHandlerRef = useRef<((action: string, payload?: object) => DomResponse | Promise<DomResponse>) | null>(null);
  const registerReceiveHandler = (handler: (action: string, payload?: object) => DomResponse | Promise<DomResponse>) => {
    customHandlerRef.current = handler;
  };

  const getDefaultResponse = (action: string, payload?: object): DomResponse => {
    switch (action) {
      case 'PING':
        return { ok: true, data: `PONG window.location: ${window.location.href} originalPayload: ${JSON.stringify(payload)}` };
      case 'CUSTOM_ACTION':
        return { ok: true, data: `Custom action processed at ${new Date().toISOString()} with payload: ${JSON.stringify(payload)}` };
      case 'console.log':
        return { ok: true, data: { message: 'PONG' } };
      default:
        return { ok: false, error: 'Unknown action' };
    }
  };

  const receive = async (action: string, payload?: object) => {
    try {
      const handler = customHandlerRef.current;
      const result = handler ? await handler(action, payload) : getDefaultResponse(action, payload);
      sendToReactNative('response', {
        originalAction: action,
        originalPayload: payload,
        response: result,
      });
    } catch (error) {
      sendToReactNative('response', {
        originalAction: action,
        originalPayload: payload,
        response: { ok: false, error: String(error) } as DomResponse,
      });
    }
  };

  useDOMImperativeHandle(ref as any, () => {
    const factory = {
      receive: (...args: any[]) => {
        const [action, payload] = args;
        void receive(action as string, payload as object | undefined);
      },
    } as unknown as import('expo/dom').DOMImperativeFactory;
    return factory;
  }, []);

  useEffect(() => {
    onMessage('console.log', { message: `React Native Webview first render\n Window Info: ${JSON.stringify(window.location)}\n Dimensions: ${window.innerWidth}x${window.innerHeight}` });
  }, [onMessage]);

  // Cast to any so we can pass extra helper prop without TS complaining about external component types
  const LW: any = LittleWorldWebNative;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LW
        sendMessageToReactNative={sendToReactNative}
        registerReceiveHandler={registerReceiveHandler}
      />
    </Suspense>
  );
});