// Page.tsx
import environmentNative from "@/environments/env";
import AuthGuard from "@/src/components/atoms/AuthGuard";
import DomDebugPanel from "@/src/components/blocks/DomDebugPanel";
import DomWebViewHost from "@/src/components/blocks/DomWebViewHost";
import FireBase from "@/src/components/blocks/Firebase";

import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Page() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AuthGuard>
        <FireBase />
      </AuthGuard>
      <View style={{ height: insets.top, backgroundColor: "#fff" }} />
      <StatusBar style="dark" />
      <View style={{ flex: 1, width: "100%", display: "block" }}>
        <DomWebViewHost />
        {environmentNative.showDebugPanel && <DomDebugPanel />}
      </View>
    </View>
  );
}
