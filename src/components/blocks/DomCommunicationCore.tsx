import { saveJwtTokens } from "@/src/api/token";
import { computeNativeChallengeProof } from "@/src/messaging/nativeAuth";
import {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
} from "littleplanet";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from "react";

export interface DomCommunicationContextType {
  sendToDom: React.RefObject<DomCommunicationMessageFn | null>;
  sendToReactNative: DomCommunicationMessageFn;
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

export function DomCommunicationProvider({
  children,
}: DomCommunicationProviderProps) {
  const sendToDom = useRef<DomCommunicationMessageFn | null>(null);

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
        case "TEST": {
          return { ok: true, data: "answer from native" };
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
  };

  return (
    <DomCommunicationContext.Provider value={contextValue}>
      {children}
    </DomCommunicationContext.Provider>
  );
}
