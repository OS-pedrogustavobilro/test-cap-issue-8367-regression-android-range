#!/bin/bash

# Quick test script - shows expected bytes for common test ranges
# Usage: ./quick-test.sh

FILE="./public/test-file.txt"

if [ ! -f "${FILE}" ]; then
    echo "❌ Test file not found: ${FILE}"
    exit 1
fi

echo "========================================"
echo "Quick Range Test Reference"
echo "========================================"
echo ""

# Function to show range
show_range() {
    local start=$1
    local end=$2
    local count=$((end - start + 1))

    echo "Range: bytes=${start}-${end} (${count} bytes)"
    echo "----------------------------------------"

    # Hex
    HEX=$(dd if="${FILE}" bs=1 skip="${start}" count="${count}" 2>/dev/null | xxd -p -c 1000 | tr -d '\n' | sed 's/../& /g' | tr '[:lower:]' '[:upper:]' | sed 's/ $//')
    echo "Hex: ${HEX}"

    # ASCII
    ASCII=$(dd if="${FILE}" bs=1 skip="${start}" count="${count}" 2>/dev/null | tr -d '\n\r' | cat -v)
    echo "ASCII: ${ASCII}"
    echo ""
}

# Common test ranges
show_range 0 15
show_range 10 25
show_range 0 31
show_range 64 79

echo "File size: $(wc -c < "${FILE}") bytes"
echo ""
echo "📱 Use these values to verify the app output"
echo "🌐 Or run: npm run compare-range [start] [end]"
