// Page.tsx
import { DomCommunicationProvider } from "@/src/components/blocks/DomCommunicationCore";
import DomDebugPanel from "@/src/components/blocks/DomDebugPanel";
import DomWebViewHost from "@/src/components/blocks/DomWebViewHost";
import { environment } from "@/src/config/environment-native";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Page() {
  const insets = useSafeAreaInsets();

  return (
    <DomCommunicationProvider>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ height: insets.top, backgroundColor: "#fff" }} />
        <StatusBar style="dark" />
        <View style={{ flex: 1, width: "100%", display: "block" }}>
          <DomWebViewHost />
          {environment.showDebugPanel && <DomDebugPanel />}
        </View>
      </View>
    </DomCommunicationProvider>
  );
}
