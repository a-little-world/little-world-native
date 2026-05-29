// LittleWorldWebLazy.tsx
"use dom";

import type {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
} from "littleplanet";
import { lazy, Ref, useEffect, useRef } from "react";

import {
  apiFetch,
  ApiFetchOptions,
  refreshAccessTokens,
} from "@/src/api/helpers";
import { applyFontInjectionWithRetry } from "@/src/utils/domFontInjection";
import { applyRootDisplayOverrideWithRetry } from "@/src/utils/domStyleOverride";
import { JSONValue } from "expo/build/dom/dom.types";
import { DOMImperativeFactory, useDOMImperativeHandle } from "expo/dom";
import { useDomCommunicationContext } from "./DomCommunicationCore";

export interface LittleWorldDomRef extends DOMImperativeFactory {
  sendMessageToDom: (...args: JSONValue[]) => void;
}

const LittleWorldWebNative = lazy(() =>
  import("littleplanet").then((m) => ({ default: m.LittleWorldWebNative })),
);

export default function LittleWorldWebLazy(props: {
  ref: Ref<LittleWorldDomRef>;
  dom?: import("expo/dom").DOMProps;
}) {
  const domReceiveHandlerRef = useRef<DomCommunicationMessageFn | null>(null);
  const { sendToReactNative } = useDomCommunicationContext();

  // Allow inner component to override how actions are handled
  const registerReceiveHandler = (handler: DomCommunicationMessageFn) => {
    domReceiveHandlerRef.current = handler;
  };

  // Inject CSS to override #root display property and fonts
  useEffect(() => {
    const cleanupRoot = applyRootDisplayOverrideWithRetry();
    const cleanupFonts = applyFontInjectionWithRetry();

    return () => {
      cleanupRoot();
      cleanupFonts();
    };
  }, []);

  useDOMImperativeHandle<LittleWorldDomRef>(props.ref, () => ({
    sendMessageToDom: (...args: JSONValue[]) => {
      if (
        args.length !== 1 ||
        args[0] === null ||
        typeof args[0] !== "object"
      ) {
        console.log("useDOMImperativeHandle args", args);
        return;
      }

      const handler = domReceiveHandlerRef.current;
      if (!handler) {
        // unfortunately errors thrown here cannot be caught in native since they occur in the webview,
        // so we just return here and let the requests timeout
        return;
      }
      const message = args[0] as DomCommunicationMessage;
      handler(message);
    },
  }));

  // Cast to any so we can pass extra helper prop without TS complaining about external component types
  const LW: any = LittleWorldWebNative;

  const fetcher = (endpoint: string, options: ApiFetchOptions = {}) =>
    apiFetch(endpoint, options, "frontend");

  return (
    <LW
      dom={{ matchContent: true }}
      sendMessageToReactNative={sendToReactNative}
      registerReceiveHandler={registerReceiveHandler}
      apiFetchNative={fetcher}
      refreshAccessToken={refreshAccessTokens}
    />
  );
}
