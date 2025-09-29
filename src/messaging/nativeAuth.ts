import { NativeModules } from 'react-native';
import { NATIVE_APP_SECRET } from '@/src/config/environment';

type NativeAuthModuleType = {
  computeProof: (challenge: string, timestamp: string, email: string) => Promise<string>;
};

const NativeAuth: NativeAuthModuleType | undefined = (NativeModules as any).NativeAuth;

export async function computeNativeChallengeProof(challenge: string, timestamp: string, email: string): Promise<string> {
  const message = `${challenge}${timestamp}${email.toLowerCase()}`;
  if (NativeAuth && typeof NativeAuth.computeProof === 'function') {
    return NativeAuth.computeProof(challenge, timestamp, email.toLowerCase());
  }
  const CryptoJS: any = require('crypto-js');
  const proofWordArray = CryptoJS.HmacSHA256(message, NATIVE_APP_SECRET);
  const proof = CryptoJS.enc.Hex.stringify(proofWordArray);
  return proof.toLowerCase();
}

