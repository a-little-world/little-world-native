import * as SecureStore from './secureStore';
import { environment as nativeEnv } from '../config/environment';
import { environment as appEnv } from '@/environment';
import { supportsAppIntegrity } from './appInfos';

const NATIVE_SECRET_OUTER_LAYER_DECRYPTION_KEY_KEY = 'native_secret_outer_layer_decryption_key';

// App Integrity (only for production)
const AppIntegrity = (() => {
  try {
    return require('@expo/app-integrity');
  } catch {
    return {} as any;
  }
})();

// TODO: this is temporary will be replace with better authentication api or  better encryption api in the future
export async function encrypt(plaintext: string, keyBase64: string): Promise<string> {
  // Convert key to bytes using base64 decoding
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  const plaintextBytes = new TextEncoder().encode(plaintext);
  
  // Simple XOR encryption
  const encrypted = new Uint8Array(plaintextBytes.length);
  for (let i = 0; i < plaintextBytes.length; i++) {
    encrypted[i] = plaintextBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  // Add a simple nonce (first 12 bytes of key)
  const nonce = keyBytes.slice(0, 12);
  const result = new Uint8Array(nonce.length + encrypted.length);
  result.set(nonce);
  result.set(encrypted, nonce.length);
  
  return btoa(String.fromCharCode(...result));
}

function fromBase64(inputBase64: string): Uint8Array {
  const bin = atob(inputBase64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function utf8Decode(bytes: Uint8Array): string {
  try {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder().decode(bytes);
    }
  } catch {}
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  try {
    // Fallback for UTF-8 decoding
    return decodeURIComponent(escape(bin));
  } catch {
    return bin;
  }
}

export async function decrypt(encrypted: string, keyBase64: string): Promise<string> {
  try {
    // Handle simple XOR format
    const encryptedBytes = fromBase64(encrypted);
    const keyBytes = fromBase64(keyBase64);

    const nonce = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);

    console.log(
      'decrypt(): lengths',
      JSON.stringify({
        encryptedLen: encryptedBytes.length,
        keyLen: keyBytes.length,
        nonceLen: nonce.length,
        ciphertextLen: ciphertext.length,
      })
    );

    const decrypted = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      decrypted[i] = ciphertext[i] ^ keyBytes[i % keyBytes.length];
    }

    const result = utf8Decode(decrypted);

    if (!result || result.length === 0) {
      throw new Error('decrypt(): empty result after decryption');
    }

    return result;
  } catch (error) {
    console.warn('decrypt() failed:', error);
    throw error;
  }
}

export async function getNativeSecretTT(): Promise<string | null> {
  return "6KDEDwLGxE62nLwZZTB5mnHQNYXQuaR83JxdrshvFy"
}

export async function getNativeSecret(): Promise<string | null> {
  try {
    let outerLayerDecryptionKey = await SecureStore.getItemAsync(NATIVE_SECRET_OUTER_LAYER_DECRYPTION_KEY_KEY);

    if (!outerLayerDecryptionKey) {
      // Check if we're actually in a production environment with proper app integrity support
      const isProductionWithIntegrity = nativeEnv.production && supportsAppIntegrity();
      
      if (!isProductionWithIntegrity) {
        console.log('getNativeSecret: Using development fallback (production mode but no app integrity support)');
        outerLayerDecryptionKey = nativeEnv.developmentOnlyOuterLayerDecryptionKey;
        if (outerLayerDecryptionKey) {
          await SecureStore.setItemAsync(NATIVE_SECRET_OUTER_LAYER_DECRYPTION_KEY_KEY, outerLayerDecryptionKey);
        }
      } else {
        // Production mode with proper app integrity support
        try {
          // Android Attestation
          if (AppIntegrity.prepareIntegrityTokenProvider) {
            const cloudProjectNumber = nativeEnv.googleCloudProjectNumber;
            await AppIntegrity.prepareIntegrityTokenProvider(cloudProjectNumber);
            
            // Generate a unique request hash for this integrity check
            const requestHash = `native-secret-${Date.now()}-${Math.random()}`;
            const integrityToken = await AppIntegrity.requestIntegrityCheck(requestHash);
            
            const response = await fetch(`${appEnv.backendUrl}/api/app-integrity/verify-android`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                integrityToken,
                requestHash 
              }),
            });
            
            if (!response.ok){
              response.text().then(text => {
                console.log('Android integrity verification failed', text);
              });
              throw new Error('Android integrity verification failed');
            }
            const data = await response.json();
            outerLayerDecryptionKey = data.outerLayerDecryptionKey;
            
          } else if (AppIntegrity.generateKey && AppIntegrity.attestKey) {
            // IOS Attestation TODO: IOS Attestation is not implemented in Backend Yet!
            const keyId = await AppIntegrity.generateKey();
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

            // Send attestation to backend for verification and key exchange
            const response = await fetch(`${appEnv.backendUrl}/api/app-integrity/verify-ios`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ keyId, attestationObject }),
            });
            
            if (!response.ok) throw new Error('iOS integrity verification failed');
            const data = await response.json();
            outerLayerDecryptionKey = data.outerLayerDecryptionKey;
          } else {
            throw new Error('No supported app integrity method available');
          }

          if (!outerLayerDecryptionKey) throw new Error('Missing outer layer decryption key from backend');
          await SecureStore.setItemAsync(NATIVE_SECRET_OUTER_LAYER_DECRYPTION_KEY_KEY, outerLayerDecryptionKey);
          
        } catch (integrityError) {
          console.warn('App integrity failed, falling back to development mode:', integrityError);
        }
      }
    }

    if (!outerLayerDecryptionKey) return null;
    
    // Use combined key approach: combine outer + inner keys
    const outerKeyBytes = fromBase64(outerLayerDecryptionKey);
    const innerKeyBytes = fromBase64(nativeEnv.localInnerLayerDecryptionKey);    

    // Combine keys
    const combinedKeyBytes = new Uint8Array(outerKeyBytes.length + innerKeyBytes.length);
    combinedKeyBytes.set(outerKeyBytes);
    combinedKeyBytes.set(innerKeyBytes, outerKeyBytes.length);
    
    const combinedKeyBase64 = toBase64(combinedKeyBytes);
    
    // Decrypt with combined key
    console.log('getNativeSecret(): decrypting with combined key');
    const nativeSecret = await decrypt(nativeEnv.ecryptedNativeSecret, combinedKeyBase64);
    console.log('getNativeSecret(): decrypted native secret', nativeSecret);
  

    return nativeSecret;
  } catch (err) {
    console.warn('getNativeSecret failed', err);
    return null;
  }
}


