// LittleWorldWebLazy.tsx
"use dom";

import {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
} from "littleplanet";
import { Suspense, forwardRef, lazy, useRef } from "react";

import { JSONValue } from "expo/build/dom/dom.types";
import { useDOMImperativeHandle, type DOMImperativeFactory } from "expo/dom";

export interface LittleWorldDomRef extends DOMImperativeFactory {
  test: () => void;
  sendMessageToDom: (...args: JSONValue[]) => void;
  // sendMessageToDom: DomCommunicationMessageFn;
}

const LittleWorldWebNative = lazy(() =>
  import("littleplanet").then((m) => ({ default: m.LittleWorldWebNative }))
);

type Props = {
  sendToReactNative: DomCommunicationMessageFn;
  // sendToDom: RefObject<DomCommunicationMessageFn | null>;
  setDomReceiveHandler: (handler: DomCommunicationMessageFn | null) => void;
  // dom?: import("expo/dom").DOMProps;
  // ref: RefObject<LittleWorldDomRef | null>;
};

export default forwardRef<LittleWorldDomRef, Props>(function LittleWorldWebLazy(
  {
    sendToReactNative,
    // sendToDom,
    setDomReceiveHandler,
  },
  ref
) {
  console.log("weblazy");

  const domReceiveHandlerRef = useRef<DomCommunicationMessageFn | null>(null);

  // Allow inner component to override how actions are handled
  const registerReceiveHandler = (handler: DomCommunicationMessageFn) => {
    console.log("frontend message handler set", handler);
    // sendToDom.current = handler;
    // sendToDom

    // useDomCommunicationContext().sendToDom.current = null;
    // setDomReceiveHandler(handler);
    domReceiveHandlerRef.current = handler;

    handler({
      action: "TEST",
      payload: {
        initial: "Hallo von react native",
      },
    }).then((res) => console.log("frontend answered test message", res));
  };

  useDOMImperativeHandle<LittleWorldDomRef>(ref, () => {
    return {
      test: () => {},
      sendMessageToDom: (...args: JSONValue[]) => {
        if (
          args.length === 0 ||
          typeof args[0] === null ||
          typeof args[0] !== "object"
        ) {
          return;
        }

        const message: DomCommunicationMessage = args[0];
      },
    };
  });

  // Cast to any so we can pass extra helper prop without TS complaining about external component types
  const LW: any = LittleWorldWebNative;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <LW
        dom={{ style: { height: "100%" } }}
        sendMessageToReactNative={sendToReactNative}
        registerReceiveHandler={registerReceiveHandler}
      />
    </Suspense>
  );
});
