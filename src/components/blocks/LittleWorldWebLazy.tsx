// LittleWorldWebLazy.tsx
"use dom";

import {
  DomCommunicationMessage,
  DomCommunicationMessageFn,
} from "littleplanet";
import { RefObject, lazy } from "react";

const LittleWorldWebNative = lazy(() =>
  import("littleplanet").then((m) => ({ default: m.LittleWorldWebNative }))
);

export type DomAPI = { receive(message: DomCommunicationMessage): void };

type Props = {
  sendToReactNative: DomCommunicationMessageFn;
  sendToDom: RefObject<DomCommunicationMessageFn | null>;
  // dom?: import("expo/dom").DOMProps;
};

export default function LittleWorldWebLazy({
  sendToReactNative,
  sendToDom,
}: Props) {
  console.log("weblazy");
  // Allow inner component to override how actions are handled
  const registerReceiveHandler = (handler: DomCommunicationMessageFn) => {
    console.log("frontend message handler set", handler);
    sendToDom.current = handler;
    sendToDom
      .current({
        action: "TEST",
        payload: {
          initial: "Hallo von react native",
        },
      })
      .then((res) => console.log("frontend answered test message", res));
  };

  // Cast to any so we can pass extra helper prop without TS complaining about external component types
  const LW: any = LittleWorldWebNative;

  return (
    // <Suspense fallback={<div>Loading...</div>}>
    <>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
      <div>Lazy</div>
    </>

    /* <LW
        dom={{ style: { height: "100%" } }}
        sendMessageToReactNative={sendToReactNative}
        registerReceiveHandler={registerReceiveHandler}
      /> */
    /* </Suspense> */
  );
}
