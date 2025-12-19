#!/bin/bash
# Build script for RomanOS
# Usage: ./build.sh [example-name]

EXAMPLE=${1:-hello-world}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROMANOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Building RomanOS example: $EXAMPLE"
echo "================================"
echo ""

cd "$ROMANOS_DIR"
node tools/build-romanos.js "$EXAMPLE"
