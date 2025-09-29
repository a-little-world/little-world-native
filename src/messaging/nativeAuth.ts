import { NATIVE_APP_SECRET } from "@/src/config/environment";
import { HmacSHA256, enc } from "crypto-js";
import { NativeModules } from "react-native";

type NativeAuthModuleType = {
  computeProof: (
    challenge: string,
    timestamp: string,
    email: string
  ) => Promise<string>;
};

const NativeAuth: NativeAuthModuleType | undefined = (NativeModules as any)
  .NativeAuth;

export async function computeNativeChallengeProof(
  challenge: string,
  timestamp: string,
  email: string
): Promise<string> {
  const message = `${challenge}${timestamp}${email.toLowerCase()}`;
  if (NativeAuth && typeof NativeAuth.computeProof === "function") {
    return NativeAuth.computeProof(challenge, timestamp, email.toLowerCase());
  }
  const proofWordArray = HmacSHA256(message, NATIVE_APP_SECRET);
  const proof = enc.Hex.stringify(proofWordArray);
  return proof.toLowerCase();
}
