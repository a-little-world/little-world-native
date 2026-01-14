import { View } from "react-native";
import { useDomCommunicationContext } from "./DomCommunicationCore";

export default function DomWebViewHost() {
  const { sendToReactNative, domRef } = useDomCommunicationContext();

  return (
    <View style={{ flex: 1, height: 800 }}>
      {/* <LittleWorldWebLazy ref={domRef} sendToReactNative={sendToReactNative} /> */}
    </View>
  );
}
