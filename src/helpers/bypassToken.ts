import {
  aesDecryptAsync,
  AESEncryptionKey,
  AESSealedData,
  CryptoDigestAlgorithm,
  digestStringAsync,
} from 'expo-crypto';

const ENCRYPTED_BYPASS_TOKEN =
  'Yr6A0jiOkZFKINRDfCS/Zoj8NzpN7zcS6espYnmxbQS9Eh3NipH9WIPu2MknC7eMVJ2IEJiYm5/LS9N63cfqYhmE5Za7MnBPmH+jY6gAUgg0K5fy4kq3D1etN5XhJqWh2yBXjrjFwjZNZC+Om5/rWw==';

// expo-crypto's fromCombined passes a string straight to native, which expects
// bytes — so decode the base64 constant to a Uint8Array here.
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function decryptBypassToken(password: string): Promise<string> {
  const keyHex = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    password,
  );
  const key = await AESEncryptionKey.import(keyHex, 'hex');
  const sealed = AESSealedData.fromCombined(
    base64ToBytes(ENCRYPTED_BYPASS_TOKEN),
  );
  const bytes = (await aesDecryptAsync(sealed, key)) as Uint8Array;
  return String.fromCharCode(...bytes);
}
