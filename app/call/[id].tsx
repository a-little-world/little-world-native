import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "@a-little-world/little-world-design-system-native";
import { useLocalSearchParams, router } from "expo-router";

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
});

export default function VideoCallPage() {
  const { id } = useLocalSearchParams();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Call Not Available</Text>
      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚠️ Native video calls are not supported in web version
        </Text>
      </View>
      <Text style={styles.description}>
        To use video call functionality, please use the mobile app or development build.
      </Text>
      <Button onPress={handleGoBack}>
        <Text>Go Back</Text>
      </Button>
    </View>
  );
}
