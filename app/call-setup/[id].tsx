import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "@a-little-world/little-world-design-system-native";
import { useLocalSearchParams, router } from "expo-router";
import { isLiveKitEnabled, getDevelopmentModeInfo } from "@/src/config/environment";

// Only import CallSetup component when not in Expo Go mode
const CallSetup = isLiveKitEnabled() 
  ? require("@/src/components/views/CallSetup").default 
  : null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  warning: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  warningText: {
    color: "#856404",
    textAlign: "center",
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

export default function CallSetupPage() {
  const { id } = useLocalSearchParams();
  const modeInfo = getDevelopmentModeInfo();

  const handleStartCall = () => {
    router.push(`/call/${id}`);
  };

  if (!isLiveKitEnabled()) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Call Setup ({modeInfo.mode} Mode)</Text>
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ LiveKit is not available in {modeInfo.mode} mode
          </Text>
        </View>
        <View style={styles.modeInfo}>
          <Text style={styles.modeInfoText}>
            Mode: {modeInfo.mode}
          </Text>
          <Text style={styles.modeInfoText}>
            Recommendation: {modeInfo.recommendation}
          </Text>
        </View>
        <Text style={styles.description}>
          This is a mock call setup screen for testing navigation and UI components.
          To test actual video call functionality, use the development build.
        </Text>
        <Text style={styles.description}>
          Call ID: {id}
        </Text>
        <Button onPress={handleStartCall}>
          <Text>Start Mock Call</Text>
        </Button>
      </View>
    );
  }

  // Only render CallSetup component if it was successfully imported
  if (CallSetup) {
    return <CallSetup />;
  }

  // Fallback if CallSetup component couldn't be loaded
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Call Setup Component Not Available</Text>
      <Text style={styles.description}>
        The CallSetup component could not be loaded. Please check your development build setup.
      </Text>
    </View>
  );
}
