import {
  createContext,
  ReactNode,
  Ref,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import uuid from 'react-native-uuid';

import type {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
  DomCommunicationResponse,
} from '@/frontend/src';
import { requestIntegrityCheck } from '@/src/api/helpers';
import { useAuthStore } from '@/src/store/authStore';
import { debugStore, useDebugStore } from '@/src/store/debugStore';
import { domCommunicationStore } from '@/src/store/domCommunicationStore';
import { useLockedSessionStore } from '@/src/store/lockedSessionStore';
import { useWebViewStore } from '@/src/store/webViewStore';
import {
  registerFirebaseDeviceToken,
  unregisterFirebaseDeviceToken,
} from '@/src/utils/firebase-util';
import { endLockScreenSession } from '@/src/utils/incomingCall';

import { LittleWorldDomRef } from './LittleWorldWebLazy';

export interface DomCommunicationContextType {
  sendToDom: DomCommunicationMessageFn;
  sendToReactNative: DomCommunicationMessageFn;
  domRef: Ref<LittleWorldDomRef | null>;
}

const DomCommunicationContext =
  createContext<DomCommunicationContextType | null>(null);

export function useDomCommunicationContext() {
  const context = useContext(DomCommunicationContext);
  if (!context)
    throw new Error(
      'useDomCommunicationContext must be used within a DomCommunicationProvider',
    );
  return context;
}

interface DomCommunicationProviderProps {
  children: ReactNode;
}

const REQUEST_TIMEOUT = 5000;

export function DomCommunicationProvider({
  children,
}: DomCommunicationProviderProps) {
  const domRef = useRef<LittleWorldDomRef | null>(null);
  const authStore = useAuthStore();

  const pendingRequestsRef = useRef<
    Map<
      string,
      {
        resolve: (value: DomCommunicationResponse) => void;
        reject: (reason: any) => void;
      }
    >
  >(new Map());

  const sendToDom: DomCommunicationMessageFn = useCallback(
    async (message: DomCommunicationMessage) => {
      const handler = domRef.current?.sendMessageToDom;
      if (!handler) {
        return { ok: false, error: 'DomCommunicationCore DOM not ready' };
      }

      // Create a promise that will be resolved when the response comes via callback
      const requestId = uuid.v4();
      const responsePromise = new Promise<DomCommunicationResponse>(
        (resolve, reject) => {
          message.requestId = requestId;

          // Store the promise resolvers
          pendingRequestsRef.current.set(requestId, { resolve, reject });

          // Set a timeout to reject the promise if no response comes
          setTimeout(() => {
            if (pendingRequestsRef.current.has(requestId)) {
              console.info('request timeout for requesId', requestId, message);
              pendingRequestsRef.current.delete(requestId);
              reject('Response timeout');
            }
          }, REQUEST_TIMEOUT);
        },
      );
      const messageWithId = { ...message, requestId };

      // Send the request to DOM component (don't await the return value)
      handler(messageWithId);

      // Wait for the response to come via the callback
      return responsePromise;
    },
    [],
  );
  domCommunicationStore.set({ sendToDom });

  const sendToReactNative: DomCommunicationMessageFn = useCallback(
    async (message: DomCommunicationMessage) => {
      const { action, payload } = message;
      switch (action) {
        case 'GET_INTEGRITY_TOKEN': {
          const integrityData = await requestIntegrityCheck();
          return {
            ok: true,
            data: {
              ...integrityData,
            },
          };
        }
        case 'REGISTER_DEVICE_PUSH_TOKEN': {
          await registerFirebaseDeviceToken();

          return {
            ok: true,
          };
        }
        case 'UNREGISTER_DEVICE_PUSH_TOKEN': {
          await unregisterFirebaseDeviceToken();

          return {
            ok: true,
          };
        }
        case 'CALL_ENDED': {
          endLockScreenSession();
          return { ok: true };
        }
        case 'WEBVIEW_READY': {
          useWebViewStore.setState({ ready: true });
          // Sync debug config — also handles WebView reloads where `ready` was already true
          const { debugEnabled, backendUrlOverride } = debugStore.get();
          await sendToDom({
            action: 'SET_DEBUG_CONFIG',
            payload: { debugEnabled, backendUrlOverride },
          });

          await sendToDom({
            action: 'SET_LOCKED_SESSION',
            payload: { locked: useLockedSessionStore.getState().locked },
          });

          await sendToDom({
            action: 'NATIVE_READY',
            payload: {},
          });
          return { ok: true };
        }
        case 'RESPONSE': {
          const requestId = message.requestId;

          const pendingRequest = pendingRequestsRef.current.get(requestId);

          if (pendingRequest) {
            pendingRequest.resolve(payload);
            pendingRequestsRef.current.delete(requestId);

            return payload;
          } else {
            console.error('Received delayed dom response', message);
            return {
              ok: false,
              error: 'Could not find pending request for message',
              message,
            };
          }
        }
        case 'CONSOLE_LOG': {
          console.log(
            'console log from frontend',
            message.payload.message,
            ...(message.payload.params ?? []),
          );
          return { ok: true };
        }
        case 'LOG_ERROR': {
          if (debugStore.get().debugEnabled) {
            const { payload } = message;
            if (payload.type === 'react') {
              debugStore.get().addReactError({
                source: 'frontend',
                message: payload.message,
                stack: payload.stack,
              });
            } else {
              debugStore.get().addFetchError({
                source: 'frontend',
                method: payload.method,
                endpoint: payload.endpoint,
                url: payload.url,
                headers: payload.headers,
                requestBody: payload.requestBody,
                status: payload.status,
                error: payload.error,
              });
            }
          }
          return { ok: true };
        }
        default: {
          return {
            ok: false,
            error: `Unhandled native DomCommunicationMessage: ${action}`,
          };
        }
      }
    },
    [],
  );

  // ── Sync debug config to frontend ────────────────────────────────────────
  const { ready } = useWebViewStore();

  useEffect(() => {
    if (!ready) return;

    const syncDebugConfig = async (
      debugEnabled: boolean,
      backendUrlOverride: string | null,
    ) => {
      await sendToDom({
        action: 'SET_DEBUG_CONFIG',
        payload: { debugEnabled, backendUrlOverride },
      });
    };

    // Subscribe to future changes
    return useDebugStore.subscribe((state, prev) => {
      if (
        state.debugEnabled !== prev.debugEnabled ||
        state.backendUrlOverride !== prev.backendUrlOverride
      ) {
        syncDebugConfig(state.debugEnabled, state.backendUrlOverride);
      }
    });
  }, [ready, sendToDom]);

  useEffect(() => {
    if (!ready) return;

    return useLockedSessionStore.subscribe((state, prev) => {
      if (state.locked !== prev.locked) {
        sendToDom({
          action: 'SET_LOCKED_SESSION',
          payload: { locked: state.locked },
        });
      }
    });
  }, [ready, sendToDom]);

  const contextValue: DomCommunicationContextType = {
    sendToDom,
    sendToReactNative,
    domRef,
  };

  return (
    <DomCommunicationContext.Provider value={contextValue}>
      {children}
    </DomCommunicationContext.Provider>
  );
}
