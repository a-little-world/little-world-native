// Page.tsx
import environmentNative from "@/environments/env";
import { DomCommunicationProvider } from "@/src/components/blocks/DomCommunicationCore";
import DomDebugPanel from "@/src/components/blocks/DomDebugPanel";
import DomWebViewHost from "@/src/components/blocks/DomWebViewHost";
import FireBase from "@/src/components/blocks/Firebase";

import { View } from "react-native";

export default function Page() {
  return (
    <DomCommunicationProvider>
      <FireBase />
      <View style={{ height: "100%", width: "100%", display: "block" }}>
        <DomWebViewHost />
        {environmentNative.showDebugPanel && <DomDebugPanel />}
      </View>
    </DomCommunicationProvider>
  );
}
