import { apiFetch, clearJwtTokens } from "@/src/api/helpers";
import { useAuthStore } from "@/src/store/authStore";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useDomCommunicationContext } from "../blocks/DomCommunicationCore";
import LoadingScreen from "./LoadingScreen";

interface Props {
  onTokensValidated: () => void;
  tokensLoaded: boolean;
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 999, // 1 lower than DomDebugPanel
  },
});

interface TokenVerificationData {
  access_token: string | undefined | null;
  refresh_token: string | undefined | null;
}

interface TokenVerificationResult {
  access_token_valid: boolean;
  refresh_token_valid: boolean;
}

// returns true if tokens could be verified (and possibly refreshed), otherwise false
async function verifyTokens(): Promise<boolean> {
  // saveJwtTokens("test1234", "test5678");
  // await loadStoredTokensIntoStore();

  const { accessToken, refreshToken } = useAuthStore.getState();
  console.log(
    `verifying tokens: authToken set: ${!!accessToken}, refreshToken set: ${!!refreshToken}`
  );
  // const tokenVerificationData: TokenVerificationData = {
  //   access_token: accessToken,
  //   refresh_token: refreshToken,
  // };

  if (!accessToken || !refreshToken) {
    return false;
  }

  // return apiFetch("/api/token/verify", {
  //   method: "POST",
  //   body: {
  //     token: accessToken,
  //   },
  // })
  //   .then((res) => {
  //     console.log("token verification successful", res);
  //     return true;
  //   })
  //   .catch((e) => {
  //     console.log("token verification failed. Refresh also invalid", e);
  //     return false;
  //   });

  return apiFetch("/api/user")
    .then((res) => {
      console.log("token verification successful", res);
      return true;
    })
    .catch((e) => {
      console.log("token verification failed. Refresh also invalid", e);
      return false;
    });
}

export function LoadingScreenTokenValidator({
  onTokensValidated,
  tokensLoaded,
}: Props) {
  // const { ready: webViewReady } = useWebViewStore();
  const webViewReady = true;
  const [tokenVerificationRequest, setTokenVerificationRequest] =
    useState<Promise<boolean> | null>(null);
  const { sendToDom } = useDomCommunicationContext();

  useEffect(() => {
    if (tokensLoaded) {
      setTokenVerificationRequest(verifyTokens());
      console.log("setting token verification request");
    }
  }, [tokensLoaded, setTokenVerificationRequest]);

  useEffect(() => {
    console.log(
      `webViewReady: ${webViewReady}, tokenVerifyRequest set: ${
        tokenVerificationRequest !== null
      }`
    );
    if (webViewReady && tokenVerificationRequest) {
      (async () => {
        const tokensVerified = await tokenVerificationRequest;
        console.log(`tokens valid: ${tokensVerified}`);
        if (tokensVerified) {
          const { accessToken, refreshToken } = useAuthStore.getState();
          await sendToDom({
            action: "SET_AUTH_TOKENS",
            payload: {
              accessToken: accessToken ?? null,
              refreshToken: refreshToken ?? null,
            },
          });
          await sendToDom({
            action: "NAVIGATE",
            payload: {
              path: "/app",
            },
          });
          // navigate to app
        } else {
          await clearJwtTokens();
          useAuthStore.setState({
            accessToken: undefined,
            refreshToken: undefined,
          });
          await sendToDom({
            action: "SET_AUTH_TOKENS",
            payload: {
              accessToken: null,
              refreshToken: null,
            },
          });
          await sendToDom({
            action: "NAVIGATE",
            payload: {
              path: "/login?sessionExpired=true",
            },
          });
        }

        onTokensValidated();
      })();
    }
  }, [webViewReady, tokenVerificationRequest, sendToDom]);

  // useEffect(() => {
  //   setTimeout(() => onTokensValidated(), 5000);
  // }, []);

  return (
    <View style={styles.overlayContainer}>
      <LoadingScreen />
    </View>
  );
}

export default LoadingScreenTokenValidator;
