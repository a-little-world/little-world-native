#!/usr/bin/env bash
set -euo pipefail

# simple-encrypt.sh - Simple XOR-based encryption compatible with the app
#
# Usage:
#   ./_scripts/simple-encrypt.sh <plaintext> <base64Key>
#
# Output: base64-encoded encrypted data

PLAINTEXT=${1:-}
KEY_BASE64=${2:-}

if [ -z "$PLAINTEXT" ] || [ -z "$KEY_BASE64" ]; then
  echo "Usage: ./_scripts/simple-encrypt.sh <plaintext> <base64Key>" >&2
  exit 2
fi

node - <<'NODE'
const plaintext = process.argv[1];
const keyBase64 = process.argv[2];

// Convert key to bytes
const keyBytes = Buffer.from(keyBase64, 'base64');
const plaintextBytes = Buffer.from(plaintext, 'utf8');

// Simple XOR encryption
const encrypted = Buffer.alloc(plaintextBytes.length);
for (let i = 0; i < plaintextBytes.length; i++) {
  encrypted[i] = plaintextBytes[i] ^ keyBytes[i % keyBytes.length];
}

// Add a simple nonce (first 12 bytes of key)
const nonce = keyBytes.slice(0, 12);
const result = Buffer.concat([nonce, encrypted]);

console.log(result.toString('base64'));
NODE
