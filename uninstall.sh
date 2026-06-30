#!/bin/bash
set -e

SKILL_DIR="$HOME/.agents/skills/AutoMemHub"
CONFIG_DIR="$HOME/.config/AutoMemHub"
CACHE_DIR="$HOME/.cache/AutoMemHub"

echo "=== AutoMemHub Uninstaller ==="
echo ""

# Remove skill directory
if [ -d "$SKILL_DIR" ]; then
    rm -rf "$SKILL_DIR"
    echo "✓ Removed: $SKILL_DIR"
fi

# Remove config
if [ -d "$CONFIG_DIR" ]; then
    rm -rf "$CONFIG_DIR"
    echo "✓ Removed: $CONFIG_DIR"
fi

# Remove cache
if [ -d "$CACHE_DIR" ]; then
    rm -rf "$CACHE_DIR"
    echo "✓ Removed: $CACHE_DIR"
fi

echo ""
echo "=== Uninstall Complete ==="
echo ""
echo "Note: Your GitHub memory repo was not deleted."
echo "Delete it manually if needed: https://github.com/<owner>/<repo>"
