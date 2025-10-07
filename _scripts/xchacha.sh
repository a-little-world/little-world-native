#!/usr/bin/env bash
set -euo pipefail

# xchacha.sh - Encrypt/Decrypt/Keygen using XChaCha20-Poly1305 (libsodium)
#
# Usage:
#   ./_scripts/xchacha.sh keygen                         # prints base64 key (32 bytes)
#   ./_scripts/xchacha.sh encrypt <base64Key> <plaintext>
#   ./_scripts/xchacha.sh decrypt <base64Key> <nonce:ciphertext>
#
# Output format for encrypt: nonce:ciphertext (both base64, colon-separated)

MODE=${1:-}
shift || true

node - "$MODE" "$@" <<'NODE'
(async () => {
  const sodium = require('libsodium-wrappers');
  await sodium.ready;

  function toBase64(u8) { return sodium.to_base64(u8, sodium.base64_variants.ORIGINAL); }
  function fromBase64(b64) { return sodium.from_base64(b64, sodium.base64_variants.ORIGINAL); }
  const argv = process.argv.slice(2);
  const mode = argv[0];
  const args = argv.slice(1);

  if (mode === 'keygen') {
    const key = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
    console.log(toBase64(key));
    return;
  }

  if (mode === 'encrypt') {
    const [keyB64, plaintext] = args;
    if (!keyB64 || typeof plaintext !== 'string') {
      console.error('Usage: ./_scripts/xchacha.sh encrypt <base64Key> <plaintext>');
      process.exit(2);
    }
    const key = fromBase64(keyB64);
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const message = sodium.from_string(plaintext);
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(message, null, null, nonce, key);
    console.log(`${toBase64(nonce)}:${toBase64(ciphertext)}`);
    return;
  }

  if (mode === 'decrypt') {
    const [keyB64, payload] = args;
    if (!keyB64 || !payload || !payload.includes(':')) {
      console.error('Usage: ./_scripts/xchacha.sh decrypt <base64Key> <nonce:ciphertext>');
      process.exit(2);
    }
    const [nonceB64, cipherB64] = payload.split(':');
    const key = fromBase64(keyB64);
    const nonce = fromBase64(nonceB64);
    const ciphertext = fromBase64(cipherB64);
    const message = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ciphertext, null, nonce, key);
    console.log(sodium.to_string(message));
    return;
  }

  console.error('Unknown mode. Use keygen|encrypt|decrypt');
  process.exit(2);
})().catch((e) => { console.error(e?.stack || e); process.exit(1); });
NODE


