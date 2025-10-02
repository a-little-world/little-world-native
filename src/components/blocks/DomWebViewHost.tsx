import { View } from "react-native";
import { useDomCommunicationContext } from "./DomCommunicationCore";
import LittleWorldWebLazy from "./LittleWorldWebLazy";

export default function DomWebViewHost() {
  const { sendToReactNative, registerDomReceiveFunction, domRef } =
    useDomCommunicationContext();

  // const domRef = useRef<LittleWorldDomRef | null>(null);

  // const setDomReceiveHandler = useCallback(
  //   (handler: DomCommunicationMessageFn | null) => {
  //     console.log("setting dom receive handler", handler);
  //     sendToDom.current = handler;
  //   },
  //   []
  // );
  // useEffect(() => {
  //   console.log(
  //     "registering dom receive function",
  //     domRef.current?.sendMessageToDom,
  //     "domRef.current",
  //     domRef.current
  //   );
  //   // Update the context's ref with your local element
  //   registerDomReceiveFunction(domRef.current?.sendMessageToDom ?? null);
  // }, [registerDomReceiveFunction]);

  return (
    <View style={{ flex: 1, height: 800 }}>
      <LittleWorldWebLazy
        // sendToDom={sendToDom}
        ref={domRef}
        // setDomReceiveHandler={setDomReceiveHandler}
        sendToReactNative={sendToReactNative}
      />
    </View>
  );
}
