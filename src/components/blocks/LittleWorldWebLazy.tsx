// LittleWorldWebLazy.tsx
"use dom";

import {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
} from "littleplanet";
import { Ref, Suspense, lazy, useRef } from "react";

import { JSONValue } from "expo/build/dom/dom.types";
import { DOMImperativeFactory, useDOMImperativeHandle } from "expo/dom";

export interface LittleWorldDomRef extends DOMImperativeFactory {
  sendMessageToDom: (...args: JSONValue[]) => void;
  test: () => void;
}

const LittleWorldWebNative = lazy(() =>
  import("littleplanet").then((m) => ({ default: m.LittleWorldWebNative }))
);

type Props = {
  sendToReactNative: DomCommunicationMessageFn;
  // sendToDom: RefObject<DomCommunicationMessageFn | null>;
  // setDomReceiveHandler: (handler: DomCommunicationMessageFn | null) => void;
  // dom?: import("expo/dom").DOMProps;
  // ref: RefObject<LittleWorldDomRef | null>;
};

export default function LittleWorldWebLazy(props: {
  sendToReactNative: DomCommunicationMessageFn;
  ref: Ref<LittleWorldDomRef>;
  dom?: import("expo/dom").DOMProps;
}) {
  console.log("weblazy");

  const domReceiveHandlerRef = useRef<DomCommunicationMessageFn | null>(null);

  // Allow inner component to override how actions are handled
  const registerReceiveHandler = (handler: DomCommunicationMessageFn) => {
    // sendToDom.current = handler;
    // sendToDom

    // useDomCommunicationContext().sendToDom.current = null;
    // setDomReceiveHandler(handler);
    domReceiveHandlerRef.current = handler;
  };

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
        throw new Error("LittleWorldWebLazy DOM not ready");
      }
      const message = args[0] as DomCommunicationMessage;
      handler(message);
    },
    test: () => {},
  }));

  // Cast to any so we can pass extra helper prop without TS complaining about external component types
  const LW: any = LittleWorldWebNative;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LW
        dom={{ style: { height: "100%" } }}
        sendMessageToReactNative={props.sendToReactNative}
        registerReceiveHandler={registerReceiveHandler}
      />
    </Suspense>
  );
}
