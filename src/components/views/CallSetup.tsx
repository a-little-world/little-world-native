import {
  Button,
  Text,
} from "@a-little-world/little-world-design-system-native";
import { StyleSheet } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { ButtonAppearance } from "@a-little-world/little-world-design-system-core";
import { useNavigation, useTheme } from "@react-navigation/native";
import { CALL_ROUTE, LOGIN_ROUTE } from "@/src/routes";
import { Link, useLocalSearchParams } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});

function CallSetup() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <Link href={`/call/${id || "123"}`} asChild>
        <Button>
          Enter Call
        </Button>
      </Link>
    </SafeAreaView>
  );
}

export default CallSetup;
