#!/usr/bin/env bash
set -euo pipefail

# generate-and-encrypt-secret.sh
#
# Generates two random base64 keys (outer and inner) and encrypts the provided
# secret in two layers using XChaCha20-Poly1305 (libsodium):
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

# Dependencies: libsodium-wrappers (via node), same as xchacha.sh

node - "$SECRET" <<'NODE'
(async () => {
  const sodium = require('libsodium-wrappers');
  await sodium.ready;

  function toBase64(u8) { return sodium.to_base64(u8, sodium.base64_variants.ORIGINAL); }

  const argv = process.argv.slice(2);
  const secret = argv[0];
  if (typeof secret !== 'string' || secret.length === 0) {
    console.error('Missing plaintext secret');
    process.exit(2);
  }

  // Generate keys
  const outerKey = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
  const innerKey = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);

  // inner = ENC(secret, innerKey)
  const innerNonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const secretBytes = sodium.from_string(secret);
  const innerCipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(secretBytes, null, null, innerNonce, innerKey);
  const innerPayload = `${toBase64(innerNonce)}:${toBase64(innerCipher)}`;

  // outer = ENC(innerPayload, outerKey)
  const outerNonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const innerPayloadBytes = sodium.from_string(innerPayload);
  const outerCipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(innerPayloadBytes, null, null, outerNonce, outerKey);
  const outerPayload = `${toBase64(outerNonce)}:${toBase64(outerCipher)}`;

  const result = {
    outerLayerDecryptionKey: toBase64(outerKey),
    innerLayerDecryptionKey: toBase64(innerKey),
    innerEncrypted: innerPayload,
    outerEncrypted: outerPayload
  };

  console.log(JSON.stringify(result, null, 2));
})().catch((e) => { console.error(e?.stack || e); process.exit(1); });
NODE


