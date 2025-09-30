// Page.tsx
import { DomCommunicationProvider } from "@/src/components/blocks/DomCommunicationCore";
import DomDebugPanel from "@/src/components/blocks/DomDebugPanel";
import DomWebViewHost from "@/src/components/blocks/DomWebViewHost";
import { View } from "react-native";

export default function Page() {
  return (
    <DomCommunicationProvider>
      <View>
        <DomWebViewHost />
        <DomDebugPanel />
      </View>
    </DomCommunicationProvider>
  );
}
