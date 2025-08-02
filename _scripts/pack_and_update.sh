#!/bin/bash

# Navigate to lw_components directory
cd ../little-world-frontend || exit 1

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
rm package.json.bak

# Run pnpm pack
pnpm run build

# Get the generated tarball filename
TARBALL="littleplanet-$NEW_VERSION.tgz"
echo "Generated tarball: $TARBALL"
cp littleplanet-$NEW_VERSION.tgz ../little-world-native/littleplanet-$NEW_VERSION.tgz

# Navigate back to root directory
cd ../little-world-native

# Update the dependency reference in root package.json
sed -i.bak "s|\"littleplanet\": \"file:./littleplanet-.*\.tgz\"|\"littleplanet\": \"file:./$TARBALL\"|" package.json
rm package.json.bak

pnpm install

echo "Successfully updated to version $NEW_VERSION and installed the new package" 