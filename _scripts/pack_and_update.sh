#!/bin/bash

# Navigate to lw_components directory
cd lw_components || exit 1

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
pnpm pack

# Get the generated tarball filename
TARBALL="a-little-world-little-world-design-system-native-$NEW_VERSION.tgz"
echo "Generated tarball: $TARBALL"

# Navigate back to root directory
cd ..

# Update the dependency reference in root package.json
sed -i.bak "s|\"@a-little-world/little-world-design-system-native\": \"file:./lw_components/a-little-world-little-world-design-system-native-.*\.tgz\"|\"@a-little-world/little-world-design-system-native\": \"file:./lw_components/$TARBALL\"|" package.json
rm package.json.bak

# Run pnpm install in root directory
pnpm install

echo "Successfully updated to version $NEW_VERSION and installed the new package" 