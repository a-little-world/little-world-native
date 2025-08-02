import { Button, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function Page() {
  return (
    <View>
      <Text>Hello World</Text>
      <Button title="To Login" onPress={() => router.navigate("/login")} />
      <Button title="To Signupkk" onPress={() => router.navigate("/sign-up")} />
      <Button title="To Home" onPress={() => router.navigate("/")} />
    </View>
  );
}
