#!/bin/bash

# Navigate to lw_components directory
cd ../little-world-frontend || exit 1

# Use environment variables if set, otherwise fall back to defaults
SETUP_HOST_DOMAIN=${SETUP_HOST_DOMAIN:-true}
HTTP_SCHEME=${HTTP_SCHEME:-"https"}
HOST_DOMAIN=${HOST_DOMAIN:-"56ad3d91246f.ngrok-free.app"}
USE_WSS_WEBSOCKET=false
FULL_HOST_DOMAIN="$HTTP_SCHEME://$HOST_DOMAIN"
if [ $HTTP_SCHEME = "https" ]; then
  USE_WSS_WEBSOCKET=true
fi

echo "SETUP_HOST_DOMAIN: $SETUP_HOST_DOMAIN"
echo "HTTP_SCHEME: $HTTP_SCHEME"
echo "HOST_DOMAIN: $HOST_DOMAIN"
echo "USE_WSS_WEBSOCKET: $USE_WSS_WEBSOCKET"
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
if [ "$SETUP_HOST_DOMAIN" = true ]; then
  sed -i.bak "s|backendUrl: '.*'|backendUrl: '$FULL_HOST_DOMAIN'|" src/environment.ts
fi

if [ "$USE_WSS_WEBSOCKET" = true ]; then
  sed -i.bak "s|coreWsScheme: '.*'|coreWsScheme: 'wss://'|" src/environment.ts
  sed -i.bak "s|websocketHost: '.*'|websocketHost: '$HOST_DOMAIN'|" src/environment.ts
fi

rm package.json.bak

# Run pnpm pack
npm run build

# Get the generated tarball filename
TARBALL="littleplanet-$NEW_VERSION.tgz"
echo "Generated tarball: $TARBALL"

# Navigate back to root directory
cd ../little-world-native
mv ../little-world-frontend/$TARBALL .
cp ../little-world-frontend/src/environment.ts ./environment.ts

# Update the dependency reference in root package.json
sed -i.bak "s|\"littleplanet\": \"file:./littleplanet-.*\.tgz\"|\"littleplanet\": \"file:./$TARBALL\"|" package.json
rm package.json.bak

pnpm install

echo "Successfully updated to version $NEW_VERSION and installed the new package" 
