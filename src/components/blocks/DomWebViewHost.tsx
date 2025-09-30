import { useDomCommunicationContext } from "./DomCommunicationCore";
import LittleWorldWebLazy from "./LittleWorldWebLazy";

export default function DomWebViewHost() {
  const { sendToReactNative, sendToDom } = useDomCommunicationContext();

  return (
    <LittleWorldWebLazy
      sendToDom={sendToDom}
      sendToReactNative={sendToReactNative}
    />
  );
}
