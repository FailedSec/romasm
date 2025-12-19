#!/bin/bash
# Run script for RomanOS
# Usage: ./run.sh [example-name]

EXAMPLE=${1:-hello-world}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROMANOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IMG_FILE="$ROMANOS_DIR/build/$EXAMPLE.img"

if [ ! -f "$IMG_FILE" ]; then
    echo "Error: Image file not found: $IMG_FILE"
    echo "Please build first with: ./build.sh $EXAMPLE"
    exit 1
fi

echo "Running RomanOS example: $EXAMPLE"
echo "================================"
echo ""

qemu-system-x86_64 -drive file="$IMG_FILE",format=raw,if=floppy
