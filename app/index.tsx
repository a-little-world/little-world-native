// Page.tsx
import { DomCommunicationProvider } from "@/src/components/blocks/DomCommunicationCore";
import DomDebugPanel from "@/src/components/blocks/DomDebugPanel";
import DomWebViewHost from "@/src/components/blocks/DomWebViewHost";
import FireBase from "@/src/components/blocks/Firebase";
import { environment } from "@/src/config/environment-native";

import { View } from "react-native";

export default function Page() {
  return (
    <DomCommunicationProvider>
      <FireBase />
      <View style={{ height: "100%", width: "100%", display: "block" }}>
        <DomWebViewHost />
        {environment.showDebugPanel && <DomDebugPanel />}
      </View>
    </DomCommunicationProvider>
  );
}
