import React from "react";
import Login from "@/src/components/views/Login";
import FormLayout from "@/src/components/blocks/Layout/FormLayout";
import { Button as WebButton, CustomThemeProvider } from "@a-little-world/little-world-design-system";

export default function LoginPage() {
  return (
    <FormLayout>
      <CustomThemeProvider>
        <WebButton>Login</WebButton>
      </CustomThemeProvider>
      <Login />
    </FormLayout>
  );
}
