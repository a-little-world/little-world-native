import { View } from "react-native";
import { useDomCommunicationContext } from "./DomCommunicationCore";
import LittleWorldWebLazy from "./LittleWorldWebLazy";

export default function DomWebViewHost() {
  const { domRef } = useDomCommunicationContext();

  return (
    <View style={{ flex: 1, height: 800 }}>
      <LittleWorldWebLazy ref={domRef} />
    </View>
  );
}
