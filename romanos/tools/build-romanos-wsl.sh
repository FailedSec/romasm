#!/bin/bash
# RomanOS Build System (WSL version)
# Usage: ./build-romanos-wsl.sh [example-name]

EXAMPLE=${1:-hello-world}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROMANOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$ROMANOS_DIR/.." && pwd)"

echo "RomanOS Build System (WSL)"
echo "=========================="
echo ""

cd "$ROMANOS_DIR"

# Convert Windows paths to WSL paths if needed
if [[ "$PROJECT_ROOT" == *"\\"* ]]; then
    # Convert Windows path to WSL path
    PROJECT_ROOT=$(wslpath -u "$PROJECT_ROOT" 2>/dev/null || echo "$PROJECT_ROOT" | sed 's|\\|/|g' | sed 's|^\([A-Z]\):|/mnt/\L\1|')
fi

# Run the Node.js build script
node tools/build-romanos.js "$EXAMPLE"

# If build succeeded, we can also run NASM here if needed
if [ $? -eq 0 ]; then
    echo ""
    echo "Build complete! Run with:"
    echo "  qemu-system-x86_64 -drive file=build/$EXAMPLE.img,format=raw,if=floppy"
fi

