import { USER_ENDPOINT } from "@/src/api";
import {
  apiFetch,
  loadStoredTokensIntoStore,
  navigateToLogin,
  refreshAccessTokens,
  TokenStatus,
  updateTokens,
} from "@/src/api/helpers";
import {
  APP_ROUTE,
  BASE_ROUTE,
  USER_FORM_ROUTE,
  VERIFY_EMAIL_ROUTE,
} from "@/src/routes";
import { useWebViewStore } from "@/src/store/webViewStore";
import JWT from "expo-jwt";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useDomCommunicationContext } from "../blocks/DomCommunicationCore";
import LoadingScreen from "./LoadingScreen";

interface Props {
  onTokensValidated: () => void;
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 999, // 1 lower than DomDebugPanel
  },
});

// consider valid as long as their expiry is at least 10 seconds into the future
const TOKEN_EXPIRY_THRESHOLD = 10;

// returns true if tokens could be verified (and possibly refreshed), otherwise false
async function verifyTokens(): Promise<TokenStatus> {
  const { accessToken, refreshToken } = await loadStoredTokensIntoStore();
  await updateTokens(accessToken, refreshToken);

  if (!accessToken || !refreshToken) {
    return TokenStatus.MISSING;
  }

  const now = new Date().getTime() / 1000;
  const isExpired = (expirationTime: number): boolean =>
    expirationTime - now < TOKEN_EXPIRY_THRESHOLD;
  try {
    const accessTokenExpiry = JWT.decode(accessToken, null).exp ?? 0;
    if (!isExpired(accessTokenExpiry)) {
      console.log("token valid");
      return TokenStatus.VALID;
    }
  } catch (_) {
    // expo-jwt throws an error if the token is expired because the decode function also performs validation...
  }

  try {
    const refreshTokenExpiry = JWT.decode(refreshToken, null).exp ?? 0;
    if (!isExpired(refreshTokenExpiry)) {
      return TokenStatus.VALID;
    }
    return refreshAccessTokens();
  } catch (_) {
    // expo-jwt throws an error if the token is expired because the decode function also performs validation...
  }

  return TokenStatus.EXPIRED;
}

export function LoadingScreenTokenValidator({ onTokensValidated }: Props) {
  const { ready: webViewReady } = useWebViewStore();
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const { sendToDom } = useDomCommunicationContext();

  useEffect(() => {
    verifyTokens().then((tokenStatus) => setTokenStatus(tokenStatus));
  }, [setTokenStatus]);

  useEffect(() => {
    if (webViewReady && tokenStatus !== null) {
      (async () => {
        switch (tokenStatus) {
          case TokenStatus.VALID: {
            let route = BASE_ROUTE + APP_ROUTE;
            const userData = await apiFetch(USER_ENDPOINT);
            if (!userData?.emailVerified) {
              route += `/${VERIFY_EMAIL_ROUTE}`;
            } else if (!userData.userFormCompleted) {
              route += `/${USER_FORM_ROUTE}`;
            }

            console.log("navigate to app", route);
            await sendToDom({
              action: "NAVIGATE",
              payload: {
                path: route,
              },
            });
            // navigate to app
            break;
          }
          case TokenStatus.EXPIRED:
          case TokenStatus.MISSING:
            await navigateToLogin(tokenStatus === TokenStatus.EXPIRED);
            break;
        }

        // hide the loading screen
        onTokensValidated();
      })();
    }
  }, [webViewReady, tokenStatus, sendToDom]);

  return (
    <View style={styles.overlayContainer}>
      <LoadingScreen />
    </View>
  );
}

export default LoadingScreenTokenValidator;
