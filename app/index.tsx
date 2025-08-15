"use dom";

import React, { Suspense } from "react";
import { Button, Text } from "react-native";
import { router } from "expo-router";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Text>Hello World</Text>
      <Button
        title="Go to Login"
        onPress={() => {
          router.push("/login");
        }}
      />
    </Suspense>
  );
}
