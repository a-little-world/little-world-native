import Sodium from 'react-native-libsodium';
import * as SecureStore from 'expo-secure-store';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AppIntegrity = (() => {
  try {
    // Prefer runtime require so typecheck doesn't fail when the module isn't installed in dev
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@expo/app-integrity');
  } catch {
    return {} as any;
  }
})();
import { environment as nativeEnv } from '../config/environment';
import { environment as appEnv } from '@/environment';

const NATIVE_SECRET_OUTER_LAYER_DECRYPTION_KEY_KEY = 'native_secret_outer_layer_decryption_key';

export async function encrypt(plaintext: string, keyBase64: string): Promise<string> {
  await Sodium.ready;

  const key = Sodium.from_base64(keyBase64, Sodium.base64_variants.ORIGINAL);
  const nonce = Sodium.randombytes_buf(Sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const message = Sodium.from_string(plaintext);

  const ciphertext = Sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    message,
    null,
    null,
    nonce,
    key,
  );

  const nonceB64 = typeof nonce === 'string' ? nonce : Sodium.to_base64(nonce, Sodium.base64_variants.ORIGINAL);
  const cipherB64 = typeof ciphertext === 'string' ? ciphertext : Sodium.to_base64(ciphertext, Sodium.base64_variants.ORIGINAL);

  return `${nonceB64}:${cipherB64}`;
}

export async function decrypt(encrypted: string, keyBase64: string): Promise<string> {
  await Sodium.ready;

  const [nonceB64, cipherB64] = encrypted.split(':');
  if (!nonceB64 || !cipherB64) throw new Error('Invalid encrypted payload format. Expected "nonce:ciphertext"');

  const key = Sodium.from_base64(keyBase64, Sodium.base64_variants.ORIGINAL);
  const nonce = Sodium.from_base64(nonceB64, Sodium.base64_variants.ORIGINAL);
  const ciphertext = Sodium.from_base64(cipherB64, Sodium.base64_variants.ORIGINAL);

  const message = Sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    ciphertext,
    null,
    nonce,
    key,
  );

  return Sodium.to_string(message);
}



export async function getNativeSecret(): Promise<string | null> {
  try {
    let outerLayerDecryptionKey = await SecureStore.getItemAsync(NATIVE_SECRET_OUTER_LAYER_DECRYPTION_KEY_KEY);

    if (!outerLayerDecryptionKey) {
      if (!nativeEnv.production) {
        outerLayerDecryptionKey = nativeEnv.developmentOnlyOuterLayerDecryptionKey;
        if (outerLayerDecryptionKey) {
          await SecureStore.setItemAsync(NATIVE_SECRET_OUTER_LAYER_DECRYPTION_KEY_KEY, outerLayerDecryptionKey);
        }
      } else {
        if (!AppIntegrity.isSupported) {
          throw new Error('App Integrity not supported on this device/build');
        }

        const keyId = await AppIntegrity.generateKey();

        // TODO: backend api not yet implemented!
        const challenge = await fetch(`${appEnv.backendUrl}/api/app-integrity/challenge`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyId }),
        }).then(async (r) => {
          if (!r.ok) throw new Error('Failed to fetch integrity challenge');
          const data = await r.json();
          return data.challenge as string;
        });

        const attestationObject = await AppIntegrity.attestKey(keyId, challenge);

        // TODO: backend api not yet implemented!
        outerLayerDecryptionKey = await fetch(`${appEnv.backendUrl}/api/app-integrity/exchange`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyId, attestationObject }),
        }).then(async (r) => {
          if (!r.ok) throw new Error('Integrity verification failed');
          const data = await r.json();
          return data.outerLayerDecryptionKey as string;
        });

        if (!outerLayerDecryptionKey) throw new Error('Missing outer layer decryption key from backend');
        await SecureStore.setItemAsync(NATIVE_SECRET_OUTER_LAYER_DECRYPTION_KEY_KEY, outerLayerDecryptionKey);
      }
    }

    if (!outerLayerDecryptionKey) return null;

    // 1 - decrypt outer layer
    const innerLayerEncrypted = await decrypt(nativeEnv.ecryptedNativeSecret, outerLayerDecryptionKey);

    // 2 - decrypt inner layer
    const nativeSecret = await decrypt(innerLayerEncrypted, nativeEnv.localInnerLayerDecryptionKey);

    return nativeSecret;
  } catch (err) {
    console.warn('getNativeSecret failed', err);
    return null;
  }
}


