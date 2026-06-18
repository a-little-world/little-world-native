// LittleWorldWebLazy.tsx
"use dom";

import type {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
  LittleWorldWebNativeProps,
} from "../../../frontend/src";
import React, { lazy, Ref, useEffect, useRef } from "react";

import { apiFetch, refreshAccessTokens, updateTokens } from "@/src/api/helpers";
import { applyFontInjectionWithRetry } from "@/src/utils/domFontInjection";
import { applyRootDisplayOverrideWithRetry } from "@/src/utils/domStyleOverride";
import { JSONValue } from "expo/build/dom/dom.types";
import { DOMImperativeFactory, useDOMImperativeHandle } from "expo/dom";

export interface LittleWorldDomRef extends DOMImperativeFactory {
  sendMessageToDom: (...args: JSONValue[]) => void;
}

const LittleWorldWebNative = lazy(() => {
  // SSR (Expo Router static generation) must not evaluate the frontend bundle —
  // "use dom" components are client-only and react-dom/server would fail on hooks.
  // if (typeof window === "undefined") {
  //   return Promise.resolve({ default: () => null });
  // }
  return import("../../../frontend/src").then((m) => ({
    default: m.LittleWorldWebNative,
  }));
});

/*
  IMPORTANT: 
  - All functions passed to this webview are async, even if they the "original" function is not.
  - functions created inside this component are bundled and isolated from the rest of the native app:
      const fetcher = () => apiFetch will use an isolated version of apiFetch that has its own context, tokens, etc.
*/
export default function LittleWorldWebLazy(props: {
  ref: Ref<LittleWorldDomRef>;
  sendToReactNative: DomCommunicationMessageFn;
  apiFetchNative: typeof apiFetch;
  refreshAccessToken: typeof refreshAccessTokens;
  getAccessToken: () => Promise<string | undefined>;
  setAccessTokens: typeof updateTokens;
  dom?: import("expo/dom").DOMProps;
}) {
  const domReceiveHandlerRef = useRef<DomCommunicationMessageFn | null>(null);

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

  const LW = LittleWorldWebNative as React.ComponentType<
    LittleWorldWebNativeProps & { dom?: import("expo/dom").DOMProps }
  >;

  return (
    <LW
      dom={{ matchContents: true }}
      sendMessageToReactNative={props.sendToReactNative}
      registerReceiveHandler={registerReceiveHandler}
      apiFetchNative={props.apiFetchNative}
      refreshAccessToken={props.refreshAccessToken}
      getAccessToken={props.getAccessToken}
      setAccessTokens={props.setAccessTokens}
    />
  );
}
