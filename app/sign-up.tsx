"use dom";

// import { CustomThemeProvider as WebThemProvider } from "@a-little-world/little-world-design-system";
import { LoginNativeWeb } from "littleplanet";

export default function LoginPage() {
  console.log("window", window);
  console.log("document", document);
  return <LoginNativeWeb />;
}
