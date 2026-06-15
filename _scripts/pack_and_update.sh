#!/bin/bash
set -euo pipefail

# Navigate to frontend submodule
cd frontend || exit 1

# Use environment variables if set, otherwise fall back to defaults
SETUP_HOST_DOMAIN=${SETUP_HOST_DOMAIN:-true}
HTTP_SCHEME=${HTTP_SCHEME:-"https"}
HOST_DOMAIN=${HOST_DOMAIN:-"little-world.com"}
FULL_HOST_DOMAIN="$HTTP_SCHEME://$HOST_DOMAIN"

echo "SETUP_HOST_DOMAIN: $SETUP_HOST_DOMAIN"
echo "HTTP_SCHEME: $HTTP_SCHEME"
echo "HOST_DOMAIN: $HOST_DOMAIN"
echo "FULL_HOST_DOMAIN: $FULL_HOST_DOMAIN"

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Split version into parts
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Increment patch version
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
echo "New version: $NEW_VERSION"

# Update version in package.json
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
sed -i.bak "s|isNative: .*,|isNative: true,|" src/environment.ts
if [[ -n "$HOST_DOMAIN" && "$HOST_DOMAIN" == *ngrok* ]]; then
  echo "Host domain contains 'ngrok', allowing ngrok headers"
  sed -i.bak "s|allowNgrokRequests: .*,|allowNgrokRequests: true,|" src/environment.ts
else
  echo "Host domain does not contain 'ngrok', disallowing ngrok headers"
  sed -i.bak "s|allowNgrokRequests: .*,|allowNgrokRequests: false,|" src/environment.ts
fi
if [ "$SETUP_HOST_DOMAIN" = true ]; then
  sed -i.bak "s|backendUrl: '.*'|backendUrl: '$FULL_HOST_DOMAIN'|" src/environment.ts
fi

rm package.json.bak

# Run pnpm pack
pnpm run build

# Get the generated tarball filename
TARBALL="littleplanet-$NEW_VERSION.tgz"
echo "Generated tarball: $TARBALL"

# Navigate back to root directory
cd ..
rm littleplanet-*.tgz 2>/dev/null || true # delete old packages
mv frontend/$TARBALL .
cp frontend/src/environment.ts ./environment.ts

# Update the dependency reference in root package.json
sed -i.bak "s|\"littleplanet\":.*\.tgz\"|\"littleplanet\": \"file:./$TARBALL\"|" package.json
rm package.json.bak

if [ "${CI:-false}" = "true" ]; then
  pnpm install --no-frozen-lockfile
else
  pnpm install --no-frozen-lockfile --offline
fi

echo "Successfully updated to version $NEW_VERSION and installed the new package" 
