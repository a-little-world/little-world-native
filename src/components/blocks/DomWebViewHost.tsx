import { DomCommunicationMessageFn } from "littleplanet";
import { useCallback, useRef } from "react";
import { useDomCommunicationContext } from "./DomCommunicationCore";
import LittleWorldWebLazy, { LittleWorldDomRef } from "./LittleWorldWebLazy";

export default function DomWebViewHost() {
  const { sendToReactNative, sendToDom } = useDomCommunicationContext();
  // console.log("webViewHost", sendToReactNative, sendToDom.current);

  const domRef = useRef<LittleWorldDomRef | null>(null);

  const setDomReceiveHandler = useCallback(
    (handler: DomCommunicationMessageFn | null) => {
      console.log("setting dom receive handler", handler);
      sendToDom.current = handler;
    },
    []
  );

  return (
    <LittleWorldWebLazy
      // sendToDom={sendToDom}
      ref={domRef}
      setDomReceiveHandler={setDomReceiveHandler}
      sendToReactNative={sendToReactNative}
    />
  );
}
