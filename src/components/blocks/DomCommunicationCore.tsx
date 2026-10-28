import {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { AppState, Platform } from 'react-native';

import * as Sentry from '@sentry/react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { setStatusBarStyle } from 'expo-status-bar';
import { JSONValue } from 'expo/build/dom/dom.types';
import uuid from 'react-native-uuid';

import type {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
  DomCommunicationResponse,
} from '@/frontend/src';
import { CallAudio } from '@/modules/call-audio';
import { requestIntegrityCheck, syncTokenStateToDom } from '@/src/api/helpers';
import { debugStore, useDebugStore } from '@/src/store/debugStore';
import { domCommunicationStore } from '@/src/store/domCommunicationStore';
import { useWebViewStore } from '@/src/store/webViewStore';
import {
  registerFirebaseDeviceToken,
  unregisterFirebaseDeviceToken,
} from '@/src/utils/firebase-util';

import { LittleWorldDomRef } from './LittleWorldWebLazy';

export interface DomCommunicationContextType {
  sendToDom: DomCommunicationMessageFn;
  sendToReactNative: DomCommunicationMessageFn;
  domRef: RefObject<LittleWorldDomRef | null>;
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

const REQUEST_TIMEOUT = 10000;

function waitForWebViewReady(action: string) {
  return new Promise<void>(resolve => {
    const reportTimer = setTimeout(() => {
      const message = `WebView not ready after ${(REQUEST_TIMEOUT * 2) / 1000}s`;
      console.warn(message, action);
      Sentry.captureMessage(message, { level: 'warning', tags: { action } });
    }, REQUEST_TIMEOUT * 2);
    const unsubscribe = useWebViewStore.subscribe(({ ready }) => {
      if (!ready) return;
      clearTimeout(reportTimer);
      unsubscribe();
      resolve();
    });
  });
}

export function DomCommunicationProvider({
  children,
}: DomCommunicationProviderProps) {
  const domRef = useRef<LittleWorldDomRef | null>(null);

  const pendingRequestsRef = useRef<
    Map<
      string,
      {
        resolve: (value: DomCommunicationResponse) => void;
        reject: (reason: any) => void;
        message: JSONValue;
      }
    >
  >(new Map());

  const sendToDom: DomCommunicationMessageFn = useCallback(
    async (message: DomCommunicationMessage) => {
      if (!useWebViewStore.getState().ready) {
        await waitForWebViewReady(message.action);
      }
      const handler = domRef.current?.sendMessageToDom;
      // should never happen: only if the webview unmounted without remounting
      // or the page sent WEBVIEW_READY before registering its imperative handle
      if (!handler) {
        console.warn('DOM bridge handler missing', message.action);
        Sentry.captureMessage('DOM bridge handler missing', {
          level: 'error',
          tags: { action: message.action },
        });
        return { ok: false, error: 'DomCommunicationCore DOM not ready' };
      }

      // Create a promise that will be resolved when the response comes via callback
      const requestId = uuid.v4();
      const messageWithId: JSONValue = { ...message, requestId } as JSONValue;
      const responsePromise = new Promise<DomCommunicationResponse>(
        (resolve, reject) => {
          message.requestId = requestId;

          // Store the promise resolvers
          pendingRequestsRef.current.set(requestId, {
            resolve,
            reject,
            message: messageWithId,
          });

          const startTimeout = () => {
            const startedAt = Date.now();
            setTimeout(() => {
              if (!pendingRequestsRef.current.has(requestId)) return;
              // webview frozen while backgrounded/suspended; don't count that time
              if (
                AppState.currentState !== 'active' ||
                Date.now() - startedAt > REQUEST_TIMEOUT * 2
              ) {
                startTimeout();
                return;
              }
              const error = new Error(
                `DOM bridge response timeout: ${message.action}`,
              );
              console.warn(error.message, requestId);
              // payload omitted: may contain tokens
              Sentry.captureException(error, {
                tags: { action: message.action },
                extra: { requestId },
              });
              pendingRequestsRef.current.delete(requestId);
              reject(error);
            }, REQUEST_TIMEOUT);
          };
          startTimeout();
        },
      );
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
        case 'CALL_STATE_CHANGED': {
          if (payload.inCall) {
            await CallAudio.start();
          } else {
            await CallAudio.stop();
          }
          return { ok: true };
        }
        case 'GET_AUDIO_STATE': {
          const state = await CallAudio.getAudioState();
          return { ok: true, data: state };
        }
        case 'WEBVIEW_READY': {
          useWebViewStore.setState({ ready: true });
          // new page (reload, remount, killed renderer): anything still pending never reached it
          pendingRequestsRef.current.forEach(({ message: pending }) =>
            domRef.current?.sendMessageToDom(pending),
          );
          // Sync debug config — also handles WebView reloads where `ready` was already true
          const { debugEnabled, backendUrlOverride } = debugStore.get();
          await sendToDom({
            action: 'SET_DEBUG_CONFIG',
            payload: { debugEnabled, backendUrlOverride },
          }).catch(error =>
            console.warn('SET_DEBUG_CONFIG failed during handshake', error),
          );

          await syncTokenStateToDom();

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
            console.warn('Received delayed dom response', requestId);
            Sentry.captureMessage('DOM bridge delayed response', {
              level: 'warning',
              extra: { requestId },
            });
            return {
              ok: false,
              error: 'Could not find pending request for message',
              message,
            };
          }
        }
        case 'SET_THEME': {
          const dark = message.payload.mode === 'dark';
          // keep status and navigation bar readable
          setStatusBarStyle(dark ? 'light' : 'dark');
          if (Platform.OS === 'android') {
            NavigationBar.setStyle(dark ? 'light' : 'dark');
          }
          return { ok: true };
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
    [sendToDom],
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
      }).catch(error => console.warn('SET_DEBUG_CONFIG failed', error));
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
