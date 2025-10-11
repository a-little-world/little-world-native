#!/usr/bin/env bash
set -euo pipefail

# generate-working-secret.sh - Working two-layer encryption
#
# Usage:
#   ./_scripts/generate-working-secret.sh "my secret"
#   ./_scripts/generate-working-secret.sh "my secret" --json

SECRET=${1:-}
JSON_ONLY=${2:-}

if [ -z "$SECRET" ]; then
  echo "Usage: ./_scripts/generate-working-secret.sh <plaintext-secret> [--json]" >&2
  exit 2
fi

node -e "
const secret = '$SECRET';
const jsonOnly = '$JSON_ONLY' === '--json';

// Generate random base64 keys (32 bytes each)
const outerKey = Buffer.from(require('crypto').randomBytes(32)).toString('base64');
const innerKey = Buffer.from(require('crypto').randomBytes(32)).toString('base64');

if (!jsonOnly) {
  console.log('Outer key:', outerKey);
  console.log('Inner key:', innerKey);
}

// Simple approach: encrypt with combined key (outer + inner)
const combinedKey = Buffer.concat([
  Buffer.from(outerKey, 'base64'),
  Buffer.from(innerKey, 'base64')
]).toString('base64');

const encrypted = encrypt(secret, combinedKey);

if (!jsonOnly) {
  console.log('Combined encrypted:', encrypted);
}

function encrypt(plaintext, keyBase64) {
  const keyBytes = Buffer.from(keyBase64, 'base64');
  const plaintextBytes = Buffer.from(plaintext, 'utf8');
  
  const encrypted = Buffer.alloc(plaintextBytes.length);
  for (let i = 0; i < plaintextBytes.length; i++) {
    encrypted[i] = plaintextBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  const nonce = keyBytes.slice(0, 12);
  const result = Buffer.concat([nonce, encrypted]);
  
  return result.toString('base64');
}

const result = {
  outerLayerDecryptionKey: outerKey,
  innerLayerDecryptionKey: innerKey,
  encryptedSecret: encrypted
};

if (!jsonOnly) {
  console.log('\\n=== RESULT ===');
}
console.log(JSON.stringify(result, null, 2));
"
