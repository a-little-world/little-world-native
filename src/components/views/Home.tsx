import React from "react";
import {
  Button,
  Popover,
  Text,
} from "@a-little-world/little-world-design-system-native";
import { StyleSheet, View } from "react-native";
import { Link, router } from "expo-router";

import { ButtonAppearance } from "@a-little-world/little-world-design-system-core";
import { useTheme } from "@react-navigation/native";
import { getDevelopmentModeInfo } from "@/src/config/environment";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 20,
  },
  modeInfo: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  modeInfoText: {
    color: "#1976d2",
    textAlign: "center",
  },
});

function AppContent() {
  const theme = useTheme();
  const modeInfo = getDevelopmentModeInfo();

  return (
    <View style={styles.container}>
      <Text>Temporary Home Page to test different app pages</Text>
      
      <View style={styles.modeInfo}>
        <Text style={styles.modeInfoText}>
          Current Mode: {modeInfo.mode}
        </Text>
        <Text style={styles.modeInfoText}>
          {modeInfo.recommendation}
        </Text>
      </View>

      <Button onPress={() => router.push("/login")}>
        <Text>To Login</Text>
      </Button>
      <Button onPress={() => router.push("/faqs")}>
        <Text>To Faqs</Text>
      </Button>
      <Link href="/call-setup/123" asChild>
        <Button appearance={ButtonAppearance.Secondary}>
          <Text>To Call Setup</Text>
        </Button>
      </Link>
      
      <Link href="/call/123" asChild>
        <Button appearance={ButtonAppearance.Secondary}>
          <Text>To Video Call</Text>
        </Button>
      </Link>
      
      <Popover
        asToolTip
        showCloseButton={false}
        trigger={
          <Button appearance={ButtonAppearance.Secondary}>
            <Text>Open Popover</Text>
          </Button>
        }
      >
        <Text>This is tooltip text with tooltip styling</Text>
      </Popover>
    </View>
  );
}

function App() {
  return <AppContent />;
}

export default App;
