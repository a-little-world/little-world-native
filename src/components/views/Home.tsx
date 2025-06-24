import React from "react";
import {
  Button,
  Popover,
  Text,
} from "@a-little-world/little-world-design-system-native";
import { StyleSheet, View } from "react-native";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { ButtonAppearance } from "@a-little-world/little-world-design-system-core";
import { useNavigation, useTheme } from "@react-navigation/native";
import { LOGIN_ROUTE } from "@/src/routes";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});

function AppContent() {
  const navigation = useNavigation();
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <Text>Temporary Home Page to test different app pages</Text>
      <Button onPress={() => navigation.navigate(LOGIN_ROUTE)}>
        <Text>To Login</Text>
      </Button>
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
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

export default App;
