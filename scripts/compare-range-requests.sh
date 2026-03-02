#!/bin/bash

# Script to compare range requests externally vs what the app sees
# Usage: ./compare-range-requests.sh [start] [end]
# Example: ./compare-range-requests.sh 0 15

START=${1:-0}
END=${2:-15}
FILE="test-file.txt"
SERVER_URL="http://localhost:5173"

echo "========================================"
echo "Range Request Comparison Script"
echo "Issue: https://github.com/ionic-team/capacitor/issues/8367"
echo "========================================"
echo ""
echo "Testing range: bytes=${START}-${END}"
echo "File: ${FILE}"
echo ""

# Check if dev server is running
if ! curl -s --head "${SERVER_URL}/${FILE}" > /dev/null; then
    echo "❌ Dev server not running at ${SERVER_URL}"
    echo "Please run: npm run dev"
    echo ""
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Make range request with curl
echo "📡 Making range request with curl..."
CURL_OUTPUT=$(mktemp)
curl -s -r "${START}-${END}" "${SERVER_URL}/${FILE}" > "${CURL_OUTPUT}"

# Get hex dump
echo ""
echo "Hex bytes from curl (external request):"
echo "========================================"
hexdump -C "${CURL_OUTPUT}" | head -n 10
echo ""

# Also show as hex string
HEX_STRING=$(xxd -p -c 1000 "${CURL_OUTPUT}" | tr -d '\n' | sed 's/../& /g' | tr '[:lower:]' '[:upper:]' | sed 's/ $//')
echo "Hex string (for comparison):"
echo "${HEX_STRING}"
echo ""

# Calculate expected bytes from the actual file
ACTUAL_FILE="./public/${FILE}"
if [ -f "${ACTUAL_FILE}" ]; then
    echo "📄 Expected bytes from source file:"
    echo "========================================"
    dd if="${ACTUAL_FILE}" bs=1 skip="${START}" count=$((END - START + 1)) 2>/dev/null | xxd -p -c 1000 | tr -d '\n' | sed 's/../& /g' | tr '[:lower:]' '[:upper:]' | sed 's/ $//'
    echo ""
    echo ""
fi

# Show ASCII preview
echo "ASCII preview:"
echo "========================================"
cat "${CURL_OUTPUT}"
echo ""
echo ""

# Show byte count
BYTE_COUNT=$(wc -c < "${CURL_OUTPUT}")
echo "Total bytes received: ${BYTE_COUNT}"
echo ""

# Instructions for app comparison
echo "📱 To compare with Capacitor app:"
echo "========================================"
echo "1. Build and deploy the app: npm run build && npx cap sync"
echo "2. Run the app on Android device/emulator"
echo "3. Navigate to /range-test page in the app"
echo "4. Use the same range (start: ${START}, end: ${END})"
echo "5. Compare the hex bytes displayed in the app with:"
echo ""
echo "   ${HEX_STRING}"
echo ""
echo "If the bytes differ, the regression is confirmed!"
echo ""

# Cleanup
rm "${CURL_OUTPUT}"
