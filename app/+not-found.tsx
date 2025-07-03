import React from "react";
import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  Card,
  CardHeader,
  CardContent,
  Text,
  CardFooter,
  Button,
} from "@a-little-world/little-world-design-system-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Card>
          <CardHeader>Uh oh!</CardHeader>
          <CardContent>
            <Text>This screen doesn't exist.</Text>
          </CardContent>
          <CardFooter>
            <Link asChild href="/">
              <Button>
                <Text>Return Home</Text>
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </View>
    </>
  );
}
