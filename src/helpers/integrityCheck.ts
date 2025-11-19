import * as AppIntegrity from "@expo/app-integrity";
import {
  IntegrityCheck,
  IntegrityCheckAndroid,
  IntegrityCheckIOS,
} from "littleplanet";
import { Platform } from "react-native";
import { apiFetch } from "../api/helpers";
import { environment } from "../config/environment";
import PlatformSecureStore from "./secureStore";

const APP_INTEGRITY_KEY_ID_KEY = "APP_INTEGRITY_KEY_ID";

export async function requestIntegrityCheck(): Promise<IntegrityCheck> {
  switch (Platform.OS) {
    case "android":
      return requestIntegrityCheckAndroid();
    case "macos":
    case "ios":
      return requestIntegrityCheckIOS();
    case "web":
      return requestIntegrityCheckWeb();
    default:
      throw new Error(
        `Platform ${Platform.OS} not supported for integrity check`
      );
  }
}

async function requestIntegrityCheckAndroid(): Promise<IntegrityCheckAndroid> {
  const requestHash = `native-secret-${Date.now()}-${Math.random()}`;
  const cloudProjectNumber = environment.googleCloudProjectNumber;
  await AppIntegrity.prepareIntegrityTokenProviderAsync(cloudProjectNumber);
  const integrityToken = await AppIntegrity.requestIntegrityCheckAsync(
    requestHash
  );

  return { platform: "android", integrityToken, requestHash };
}

async function requestIntegrityCheckIOS(): Promise<IntegrityCheckIOS> {
  if (!AppIntegrity.isSupported) {
    throw new Error("Integrity check not supported on device");
  }

  let keyId = await PlatformSecureStore.getItemAsync(APP_INTEGRITY_KEY_ID_KEY);
  if (!keyId) {
    keyId = await AppIntegrity.generateKeyAsync();

    await PlatformSecureStore.setItemAsync(APP_INTEGRITY_KEY_ID_KEY, keyId);
  }

  const { challenge } = await apiFetch("/api/integrity/challenge", {
    method: "POST",
    body: { keyId },
  });

  try {
    const attestationObject = await AppIntegrity.attestKeyAsync(
      keyId,
      challenge
    );
    return { platform: "ios", attestationObject, keyId };
  } catch (error) {
    if (error === "ERR_APP_INTEGRITY_SERVER_UNAVAILABLE") {
      // wait and try again later with same key
    } else {
      await PlatformSecureStore.deleteItemAsync(APP_INTEGRITY_KEY_ID_KEY);
      // try again
    }
    throw new Error("Integrity check failed", { cause: error });
  }
}

async function requestIntegrityCheckWeb(): Promise<IntegrityCheck> {
  return { platform: "web", bypassToken: "bypassChangeMe!" };
}
