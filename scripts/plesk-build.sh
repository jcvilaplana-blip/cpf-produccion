#!/bin/bash
set -e
echo "==> Running next build..."
node_modules/.bin/next build
echo "==> Build complete!"
