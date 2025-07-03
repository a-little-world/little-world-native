#!/bin/bash

echo "🔧 Development Build Troubleshooting Script"
echo "=========================================="

# Kill all Expo processes
echo "1. Killing all Expo processes..."
pkill -f "expo" || true
pkill -f "metro" || true

# Clear Watchman cache
echo "2. Clearing Watchman cache..."
watchman watch-del '/Users/seanblundell/Documents/LittleWorld/little-world-native' 2>/dev/null || true
watchman watch-project '/Users/seanblundell/Documents/LittleWorld/little-world-native' 2>/dev/null || true

# Clear Metro cache
echo "3. Clearing Metro cache..."
rm -rf ~/.expo/cache 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Clear React Native cache
echo "4. Clearing React Native cache..."
npx react-native start --reset-cache 2>/dev/null || true

# Reinstall node_modules if needed
echo "5. Checking node_modules..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "   Reinstalling node_modules..."
    npm install
fi

echo "✅ Troubleshooting complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run ios:dev-reliable"
echo "2. Or run: npm run android:dev-reliable"
echo "3. If still having issues, try: eas build:run -p ios" 