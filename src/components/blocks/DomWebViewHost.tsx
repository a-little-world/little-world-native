import {
  ApiFetchOptions,
  apiFetch,
  refreshAccessTokens,
  updateTokens,
} from "@/src/api/helpers";
import { useAuthStore } from "@/src/store/authStore";
import { useState } from "react";
import { View } from "react-native";
import { useDomCommunicationContext } from "./DomCommunicationCore";
import LittleWorldWebLazy from "./LittleWorldWebLazy";

export default function DomWebViewHost() {
  const { domRef, sendToReactNative } = useDomCommunicationContext();

  // Frozen at mount: native already loaded stored tokens before this renders, so this
  // is the startup auth guess. Freezing avoids a later logout retroactively changing it.
  const [hasStoredToken] = useState(() => {
    const s = useAuthStore.getState();
    return !!(s.accessToken || s.refreshToken);
  });

  const fetcher = (endpoint: string, options: ApiFetchOptions = {}) =>
    apiFetch(endpoint, options, "frontend");

  const getAccessToken = async () => useAuthStore.getState().accessToken;

  const setAccessTokens = async (
    accessToken: string | undefined,
    refreshToken: string | undefined,
  ): Promise<void> => {
    console.log("frontend setting access tokens", accessToken, refreshToken);
    await updateTokens(accessToken, refreshToken);
  };

  return (
    <View style={{ flex: 1, height: 800 }}>
      <LittleWorldWebLazy
        ref={domRef}
        sendToReactNative={sendToReactNative}
        apiFetchNative={fetcher}
        refreshAccessToken={refreshAccessTokens}
        getAccessToken={getAccessToken}
        setAccessTokens={setAccessTokens}
        hasStoredToken={hasStoredToken}
      />
    </View>
  );
}
