#!/bin/bash
# ================================================================
# CamareroPorFavor - Capacitor Setup Script
# ================================================================
# Run this script after cloning the project to initialize
# native Android and iOS platforms for building .apk / .ipa
#
# Prerequisites:
#   - Node.js 18+
#   - npm or bun
#   - Android Studio (for Android / .apk)
#   - Xcode (for iOS / .ipa, macOS only)
# ================================================================

set -e

echo "========================================"
echo " CamareroPorFavor - Capacitor Setup"
echo "========================================"

# Step 1: Install dependencies
echo ""
echo "[1/5] Installing npm dependencies..."
npm install

# Step 2: Build static export for native
echo ""
echo "[2/5] Building Next.js static export..."
BUILD_TARGET=native npx next build

# Step 3: Initialize Capacitor (if not already done)
if [ ! -f "android/build.gradle" ] || [ ! -d "ios/App" ]; then
  echo ""
  echo "[3/5] Adding native platforms..."
  npx cap add android 2>/dev/null || echo "Android platform already exists"
  npx cap add ios 2>/dev/null || echo "iOS platform already exists"
else
  echo ""
  echo "[3/5] Native platforms already exist, skipping..."
fi

# Step 4: Sync web assets to native projects
echo ""
echo "[4/5] Syncing web assets to native projects..."
npx cap sync

# Step 5: Done
echo ""
echo "[5/5] Setup complete!"
echo ""
echo "========================================"
echo " Next steps:"
echo "========================================"
echo ""
echo " ANDROID (.apk):"
echo "   npm run cap:android"
echo "   -> Opens Android Studio"
echo "   -> Build > Generate Signed Bundle / APK"
echo "   -> Or: cd android && ./gradlew assembleRelease"
echo ""
echo " iOS (.ipa):"
echo "   npm run cap:ios"
echo "   -> Opens Xcode"
echo "   -> Product > Archive"
echo "   -> Distribute App"
echo ""
echo " DEVELOPMENT (live reload):"
echo "   1. Edit capacitor.config.ts"
echo "   2. Uncomment server.url and set your local IP"
echo "   3. Run: npx cap copy"
echo "   4. Run: npm run dev"
echo "   5. Build and run from Android Studio / Xcode"
echo ""
echo "========================================"
