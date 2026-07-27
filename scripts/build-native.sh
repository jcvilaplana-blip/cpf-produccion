#!/bin/bash
# Build script for Capacitor native (output: export)
# API routes are incompatible with static export, so we temporarily exclude them

set -e

echo ">>> Preparing native build (output: export)..."

# 1. Move API routes out temporarily
if [ -d "app/api" ]; then
  mv app/api app/_api_backup
  echo ">>> Moved app/api -> app/_api_backup"
fi

# 2. Move auth callback out (server-only route)
if [ -d "app/auth/callback" ]; then
  mv app/auth/callback app/auth/_callback_backup
  echo ">>> Moved app/auth/callback -> app/auth/_callback_backup"
fi

# 3. Run the Next.js build with static export
echo ">>> Running BUILD_TARGET=native next build..."
BUILD_TARGET=native npx next build || BUILD_FAILED=1

# 4. Restore API routes
if [ -d "app/_api_backup" ]; then
  mv app/_api_backup app/api
  echo ">>> Restored app/api"
fi

if [ -d "app/auth/_callback_backup" ]; then
  mv app/auth/_callback_backup app/auth/callback
  echo ">>> Restored app/auth/callback"
fi

# 5. Check if build succeeded
if [ "${BUILD_FAILED}" = "1" ]; then
  echo ">>> Native build FAILED"
  exit 1
fi

echo ">>> Native build completed successfully!"
echo ">>> Static files in: out/"
