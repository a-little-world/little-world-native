import * as AppIntegrity from "@expo/app-integrity";
import { Platform } from "react-native";
import { apiFetch } from "../api/helpers";
import { environment } from "../config/environment";
import PlatformSecureStore from "./secureStore";

export async function requestIntegrityCheck() {
  switch (Platform.OS) {
    case "android":
      return requestIntegrityCheckAndroid();
    case "macos":
    case "ios":
      return requestIntegrityCheckIOS();
    case "web":
      return requestIntegrityCheckWeb();
  }
}

async function requestIntegrityCheckAndroid() {
  const requestHash = `native-secret-${Date.now()}-${Math.random()}`;
  const cloudProjectNumber = environment.googleCloudProjectNumber;
  await AppIntegrity.prepareIntegrityTokenProvider(cloudProjectNumber);
  const integrityToken = await AppIntegrity.requestIntegrityCheck(requestHash);

  return { integrityToken, requestHash };
}

const APP_INTEGRITY_KEY_ID_KEY = "APP_INTEGRITY_KEY_ID";
async function requestIntegrityCheckIOS() {
  if (!AppIntegrity.isSupported) {
    throw new Error("Integrity check not supported on device");
  }

  let keyId = await PlatformSecureStore.getItemAsync(APP_INTEGRITY_KEY_ID_KEY);
  if (!keyId) {
    keyId = await AppIntegrity.generateKey();

    await PlatformSecureStore.setItemAsync(APP_INTEGRITY_KEY_ID_KEY, keyId);
  }

  const { challenge } = await apiFetch("/api/integrity/challenge", {
    method: "POST",
    body: { keyId },
  });

  try {
    const attestationObject = await AppIntegrity.attestKey(keyId, challenge);
    console.log("Successfully attested key");

    const { outerLayerDecryptionKey } = await apiFetch(
      "/api/integrity/verify_ios",
      {
        method: "POST",
        body: {
          keyId,
          attestationObject,
        },
      }
    );
    console.log(outerLayerDecryptionKey);
    // send attestationObject and keyId to backend for verification
  } catch (error) {
    console.log("Error attesting key", error);

    if (error === "ERR_APP_INTEGRITY_SERVER_UNAVAILABLE") {
      // wait and try again later with same key
    } else {
      await PlatformSecureStore.deleteItemAsync(APP_INTEGRITY_KEY_ID_KEY);
      // try again
    }
  }
}

async function requestIntegrityCheckWeb() {
  const requestHash = `native-secret-${Date.now()}-${Math.random()}`;
  return { integrityToken: "bypass", requestHash: requestHash };
}
