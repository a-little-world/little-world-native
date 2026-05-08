// Page.tsx
import AuthGuard from "@/src/components/atoms/AuthGuard";
import DomWebViewHost from "@/src/components/blocks/DomWebViewHost";
import FireBase from "@/src/components/blocks/Firebase";
import { setupReactErrorTracking } from "@/src/store/debugStore";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

setupReactErrorTracking();

export default function Page() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AuthGuard>{Platform.OS !== "web" && <FireBase />}</AuthGuard>
      <View style={{ height: insets.top, backgroundColor: "#fff" }} />
      <StatusBar style="dark" />
      <View style={{ flex: 1, width: "100%", display: "block" }}>
        <DomWebViewHost />
      </View>
    </View>
  );
}
