// LittleWorldWebLazy.tsx
"use dom";

import {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
} from "littleplanet";
import { Ref, Suspense, lazy, useRef, useEffect } from "react";

import { JSONValue } from "expo/build/dom/dom.types";
import { DOMImperativeFactory, useDOMImperativeHandle } from "expo/dom";
import { applyRootDisplayOverrideWithRetry } from "@/src/utils/domStyleOverride";

export interface LittleWorldDomRef extends DOMImperativeFactory {
  sendMessageToDom: (...args: JSONValue[]) => void;
}

const LittleWorldWebNative = lazy(() =>
  import("littleplanet").then((m) => ({ default: m.LittleWorldWebNative }))
);

export default function LittleWorldWebLazy(props: {
  sendToReactNative: DomCommunicationMessageFn;
  ref: Ref<LittleWorldDomRef>;
  dom?: import("expo/dom").DOMProps;
}) {
  const domReceiveHandlerRef = useRef<DomCommunicationMessageFn | null>(null);

  // Allow inner component to override how actions are handled
  const registerReceiveHandler = (handler: DomCommunicationMessageFn) => {
    domReceiveHandlerRef.current = handler;
  };

  // Inject CSS to override #root display property
  useEffect(() => {
    return applyRootDisplayOverrideWithRetry();
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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LW
        dom={{ matchContent: true }}
        sendMessageToReactNative={props.sendToReactNative}
        registerReceiveHandler={registerReceiveHandler}
      />
    </Suspense>
  );
}
