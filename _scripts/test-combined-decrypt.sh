#!/usr/bin/env bash
set -euo pipefail

# test-combined-decrypt.sh - Test the combined key decryption approach
#
# Usage:
#   ./_scripts/test-combined-decrypt.sh <encrypted> <outerKey> <innerKey>

ENCRYPTED=${1:-}
OUTER_KEY=${2:-}
INNER_KEY=${3:-}

if [ -z "$ENCRYPTED" ] || [ -z "$OUTER_KEY" ] || [ -z "$INNER_KEY" ]; then
  echo "Usage: ./_scripts/test-combined-decrypt.sh <encrypted> <outerKey> <innerKey>" >&2
  exit 2
fi

node -e "
const encrypted = '$ENCRYPTED';
const outerKey = '$OUTER_KEY';
const innerKey = '$INNER_KEY';

console.log('Encrypted:', encrypted);
console.log('Outer key:', outerKey);
console.log('Inner key:', innerKey);

// Combine keys (same as in the app)
const outerKeyBytes = Buffer.from(outerKey, 'base64');
const innerKeyBytes = Buffer.from(innerKey, 'base64');

const combinedKeyBytes = Buffer.concat([outerKeyBytes, innerKeyBytes]);
const combinedKeyBase64 = combinedKeyBytes.toString('base64');

console.log('Combined key:', combinedKeyBase64);

// Decrypt with combined key
const encryptedBytes = Buffer.from(encrypted, 'base64');
const keyBytes = Buffer.from(combinedKeyBase64, 'base64');

const nonce = encryptedBytes.slice(0, 12);
const ciphertext = encryptedBytes.slice(12);

console.log('Encrypted bytes length:', encryptedBytes.length);
console.log('Combined key bytes length:', keyBytes.length);
console.log('Nonce length:', nonce.length);
console.log('Ciphertext length:', ciphertext.length);

const decrypted = Buffer.alloc(ciphertext.length);
for (let i = 0; i < ciphertext.length; i++) {
  decrypted[i] = ciphertext[i] ^ keyBytes[i % keyBytes.length];
}

console.log('Decrypted:', decrypted.toString('utf8'));
"
