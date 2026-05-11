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
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useDomCommunicationContext } from "../blocks/DomCommunicationCore";
import { IS_AUTHENTICATED_ENDPOINT } from "./AuthGuard";
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

// returns true if tokens could be verified (and possibly refreshed), otherwise false
async function verifyTokens(): Promise<TokenStatus> {
  const { accessToken, refreshToken } = await loadStoredTokensIntoStore();
  await updateTokens(accessToken, refreshToken);

  if (!accessToken || !refreshToken) {
    return TokenStatus.MISSING;
  }

  const authenticated = await apiFetch(IS_AUTHENTICATED_ENDPOINT);
  if (authenticated) {
    return TokenStatus.VALID;
  }
  return refreshAccessTokens();
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
      console.log(webViewReady, tokenStatus);
      (async () => {
        switch (tokenStatus) {
          case TokenStatus.VALID: {
            console.log("token valid");
            let route = BASE_ROUTE + APP_ROUTE;
            console.log(route);
            const userData = await apiFetch(USER_ENDPOINT);
            console.log(userData);
            if (!userData?.emailVerified) {
              route += `/${VERIFY_EMAIL_ROUTE}`;
            } else if (!userData.userFormCompleted) {
              route += `/${USER_FORM_ROUTE}`;
            }
            console.log(route);

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
