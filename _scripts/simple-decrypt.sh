#!/usr/bin/env bash
set -euo pipefail

# simple-decrypt.sh - Simple XOR-based decryption compatible with the app
#
# Usage:
#   ./_scripts/simple-decrypt.sh <base64Encrypted> <base64Key>
#
# Output: decrypted plaintext

ENCRYPTED_BASE64=${1:-}
KEY_BASE64=${2:-}

if [ -z "$ENCRYPTED_BASE64" ] || [ -z "$KEY_BASE64" ]; then
  echo "Usage: ./_scripts/simple-decrypt.sh <base64Encrypted> <base64Key>" >&2
  exit 2
fi

node -e "
const encryptedBase64 = '$ENCRYPTED_BASE64';
const keyBase64 = '$KEY_BASE64';

console.log('Encrypted:', encryptedBase64);
console.log('Key:', keyBase64);

try {
  // Convert inputs to bytes
  const encryptedBytes = Buffer.from(encryptedBase64, 'base64');
  const keyBytes = Buffer.from(keyBase64, 'base64');
  
  console.log('Encrypted bytes length:', encryptedBytes.length);
  console.log('Key bytes length:', keyBytes.length);
  
  // Extract nonce and ciphertext
  const nonce = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);
  
  console.log('Nonce length:', nonce.length);
  console.log('Ciphertext length:', ciphertext.length);
  
  // Simple XOR decryption
  const decrypted = Buffer.alloc(ciphertext.length);
  for (let i = 0; i < ciphertext.length; i++) {
    decrypted[i] = ciphertext[i] ^ keyBytes[i % keyBytes.length];
  }
  
  console.log('Decrypted:', decrypted.toString('utf8'));
} catch (error) {
  console.error('Decrypt failed:', error.message);
  process.exit(1);
}
"
