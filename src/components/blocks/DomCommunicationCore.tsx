import { saveJwtTokens } from "@/src/api/token";
import { computeNativeChallengeProof } from "@/src/messaging/nativeAuth";
import { JSONValue } from "expo/build/dom/dom.types";
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
  registerDomReceiveFunction: (
    handler: ((...args: JSONValue[]) => void) | null
  ) => void;
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
  const domReceiveHandler = useRef<((...args: JSONValue[]) => void) | null>(
    null
  );
  const domRef = useRef<LittleWorldDomRef | null>(null);

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
        throw new Error("DomCommunicationCore DOM not ready");
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

  const registerDomReceiveFunction = useCallback(
    (handler: ((...args: JSONValue[]) => void) | null) => {
      domReceiveHandler.current = handler;
    },
    []
  );

  const sendToReactNative: DomCommunicationMessageFn = useCallback(
    async (message: DomCommunicationMessage) => {
      const { action, payload } = message;
      switch (action) {
        case "SET_AUTH_TOKENS": {
          const { accessToken, refreshToken } = message.payload;
          saveJwtTokens(accessToken, refreshToken);
          return { ok: true };
        }
        case "NATIVE_CHALLENGE_PROOF": {
          const { challenge, email, timestamp } = message.payload;

          try {
            const proof = await computeNativeChallengeProof(
              challenge,
              timestamp,
              email
            );
            return { ok: true, data: { proof } };
          } catch (e: any) {
            return { ok: false, error: e };
          }
        }
        case "RESPONSE": {
          const requestId = message.requestId;

          const pendingRequest = pendingRequestsRef.current.get(requestId);

          if (pendingRequest) {
            pendingRequest.resolve(message.payload);
            pendingRequestsRef.current.delete(requestId);

            return message.payload;
          } else {
            console.error("Received delayed dom response", message);
            return {
              ok: false,
              error: "Could not find pending request for message",
              message,
            };
          }
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
    registerDomReceiveFunction,
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
