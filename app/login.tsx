"use dom";

import LoginWeb from "@/src/components/views/LoginWeb";
import { CustomThemeProvider as WebProvider } from "@a-little-world/little-world-design-system";

export default function LoginPage() {
  return (
    <>
      <WebProvider>
        <LoginWeb></LoginWeb>
      </WebProvider>
    </>
  );
}
