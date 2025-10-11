// Page.tsx
import { DomCommunicationProvider } from "@/src/components/blocks/DomCommunicationCore";
import DomDebugPanel from "@/src/components/blocks/DomDebugPanel";
import DomWebViewHost from "@/src/components/blocks/DomWebViewHost";
import { environment } from "@/src/config/environment";
import { View } from "react-native";

export default function Page() {
  return (
    <DomCommunicationProvider>
      <View style={{ flex: 1, height: 800 }}>
        <DomWebViewHost />
        {environment.showDebugPanel && <DomDebugPanel />}
      </View>
    </DomCommunicationProvider>
  );
}
