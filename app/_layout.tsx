import React from "react";
import Home from "@/src/components/views/Home";
import { CustomThemeProvider } from "@a-little-world/little-world-design-system-native";

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <Home />
    </CustomThemeProvider>
  );
}
