import { clearJwtTokens, saveJwtTokens } from "@/src/api/token";
import { requestIntegrityCheck } from "@/src/helpers/integrityCheck";
import { useAuthStore } from "@/src/store/authStore";
import {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
  DomCommunicationResponse,
} from "littleplanet";
import {
  createContext,
  ReactNode,
  Ref,
  useCallback,
  useContext,
  useRef,
} from "react";
import uuid from "react-native-uuid";
import { LittleWorldDomRef } from "./LittleWorldWebLazy";

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
      "useDomCommunicationContext must be used within a DomCommunicationProvider"
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

  const transferAccessTokenIfPresent = () => {
    const accessToken = authStore.accessToken ?? null;
    const refreshToken = authStore.refreshToken ?? null;

    console.log("auth tokens changed", accessToken, refreshToken);
    if (accessToken && refreshToken) {
      sendToDom({
        action: "SET_AUTH_TOKENS",
        payload: {
          accessToken,
          refreshToken,
        },
      })
        .then((res) => {
          if (!res.ok) {
            console.error("Failed to set auth tokens", res);
          }
        })
        .catch(() => {});
    }
  };
  const sendToDom: DomCommunicationMessageFn = useCallback(
    async (message: DomCommunicationMessage) => {
      const handler = domRef.current?.sendMessageToDom;
      if (!handler) {
        return { ok: false, error: "DomCommunicationCore DOM not ready" };
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
              pendingRequestsRef.current.delete(requestId);
              reject(new Error("Response timeout"));
            }
          }, REQUEST_TIMEOUT);
        }
      );
      const messageWithId = { ...message, requestId };

      // Send the request to DOM component (don't await the return value)
      handler(messageWithId);

      // Wait for the response to come via the callback
      return responsePromise;
    },
    []
  );

  const sendToReactNative: DomCommunicationMessageFn = useCallback(
    async (message: DomCommunicationMessage) => {
      const { action, payload } = message;
      switch (action) {
        case "SET_AUTH_TOKENS": {
          const { accessToken, refreshToken } = payload;
          saveJwtTokens(accessToken, refreshToken);
          return { ok: true };
        }
        case "GET_INTEGRITY_TOKEN": {
          const integrityData = await requestIntegrityCheck();
          return {
            ok: true,
            data: {
              ...integrityData,
            },
          };
        }
        case "CLEAR_AUTH_TOKENS": {
          clearJwtTokens();
          authStore.setAccessToken(undefined);
          authStore.setRefreshToken(undefined);
          return { ok: true };
        }
        case "WEBVIEW_READY": {
          transferAccessTokenIfPresent();
          return { ok: true };
        }
        case "RESPONSE": {
          const requestId = message.requestId;

          const pendingRequest = pendingRequestsRef.current.get(requestId);

          if (pendingRequest) {
            pendingRequest.resolve(payload);
            pendingRequestsRef.current.delete(requestId);

            return payload;
          } else {
            console.error("Received delayed dom response", message);
            return {
              ok: false,
              error: "Could not find pending request for message",
              message,
            };
          }
        }
        case "CONSOLE_LOG": {
          console.log(
            "console log from frontend",
            message.payload.message,
            ...(message.payload.params ?? [])
          );
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
    []
  );

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
