import { View } from "react-native";
import { useDomCommunicationContext } from "./DomCommunicationCore";
import LittleWorldWebLazy from "./LittleWorldWebLazy";

export default function DomWebViewHost() {
  const { sendToReactNative, domRef } = useDomCommunicationContext();

  return (
    <View style={{ flex: 1, height: 800 }}>
      <LittleWorldWebLazy ref={domRef} sendToReactNative={sendToReactNative} />
    </View>
  );
}
