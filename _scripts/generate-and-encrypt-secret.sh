#!/usr/bin/env bash
set -euo pipefail

# generate-and-encrypt-secret.sh
#
# Generates two random base64 keys (outer and inner) and encrypts the provided
# secret in two layers using simple XOR encryption:
#   inner = ENC(secret, innerKey)
#   outer = ENC(inner, outerKey)
# Prints JSON with keys and outputs.
#
# Usage:
#   ./_scripts/generate-and-encrypt-secret.sh "my super secret"

SECRET=${1:-}
if [ -z "$SECRET" ]; then
  echo "Usage: ./_scripts/generate-and-encrypt-secret.sh <plaintext-secret>" >&2
  exit 2
fi

node - "$SECRET" <<'NODE'
const secret = process.argv[1];

// Generate random base64 keys (32 bytes each)
const outerKey = Buffer.from(require('crypto').randomBytes(32)).toString('base64');
const innerKey = Buffer.from(require('crypto').randomBytes(32)).toString('base64');

console.log('Outer key:', outerKey);
console.log('Inner key:', innerKey);

// Encrypt inner layer: secret -> innerKey
const innerEncrypted = encrypt(secret, innerKey);

// For outer layer, we encrypt the inner encrypted data (which is base64)
const outerEncrypted = encrypt(innerEncrypted, outerKey);

console.log('Inner encrypted:', innerEncrypted);
console.log('Outer encrypted:', outerEncrypted);

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
  innerEncrypted: innerEncrypted,
  outerEncrypted: outerEncrypted
};

console.log('\n=== RESULT ===');
console.log(JSON.stringify(result, null, 2));
NODE