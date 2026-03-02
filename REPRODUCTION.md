# Capacitor Issue #8367 - Range Request Regression Reproduction

This project reproduces the range request regression introduced in Capacitor 8.1.1-nightly.

## Issue Details

**GitHub Issue:** https://github.com/ionic-team/capacitor/issues/8367

**Problem:** The regression in PR #8357 causes HTTP range requests to fail on Android. The issue involves improper stream seeking when handling byte range requests, causing incorrect bytes to be returned.

**Expected Behavior:** Range requests should return the correct file bytes matching what external servers (like Vite dev server) return.

**Actual Behavior:** Capacitor 8.1.1-nightly returns incorrect bytes due to double-seeking the response stream.

## Test Setup

This reproduction includes:

1. **Test File** (`public/test-file.txt`) - A 256-byte file with predictable ASCII content for byte verification
2. **Range Test Page** (`/range-test`) - Interactive UI to make range requests and display hex bytes
3. **Comparison Script** (`scripts/compare-range-requests.sh`) - External tool to verify expected bytes using curl

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Test in Browser (Baseline)

First, verify the test works correctly in a browser:

```bash
npm run dev
```

Navigate to `http://localhost:5173` and click "Open Range Request Test".

- Set range start: `0`
- Set range end: `15`
- Click "Run Range Request Tests"

The first 16 bytes should be: `41 42 43 44 45 46 47 48 49 4A 4B 4C 4D 4E 4F 50`
(This is "ABCDEFGHIJKLMNOP" in ASCII)

### 3. Test on Android (Regression Test)

Build and deploy to Android:

```bash
npm run build
npx cap sync android
npx cap open android
```

Run the app on an Android device or emulator, navigate to the Range Test page, and run the same test.

**If the bug exists**, the hex bytes will be different from the expected values.

### 4. Compare with External Request

While the dev server is running, use the comparison script to see what bytes should be returned:

```bash
./scripts/compare-range-requests.sh 0 15
```

This will:
- Make a range request using curl to the dev server
- Display the hex bytes that should be returned
- Show the expected bytes from the source file
- Provide comparison instructions

## Test Results

### Expected Results (Correct Behavior)

For range `bytes=0-15` of `test-file.txt`:

```
Hex: 41 42 43 44 45 46 47 48 49 4A 4B 4C 4D 4E 4F 50
ASCII: ABCDEFGHIJKLMNOP
```

### With Regression (Incorrect Behavior)

If the regression exists, you'll see different bytes returned on Android. The bytes will be offset incorrectly due to double-seeking.

## How It Works

### The Test File

`public/test-file.txt` contains 256 bytes of predictable ASCII text:
- Lines starting with known patterns (ABCDEF..., 0123456789...)
- Allows easy verification of byte positions
- Small enough to test various range requests

### The Range Test Page

The React component at `/range-test`:
- Makes fetch requests with `Range` headers
- Converts response bytes to hex for easy comparison
- Displays results without needing Chrome DevTools
- Shows both hex and ASCII representations
- Calculates and displays expected bytes
- Exports results to JSON for documentation

### The Comparison Script

`scripts/compare-range-requests.sh`:
- Uses curl to make external range requests
- Shows hex dump of received bytes
- Compares with actual file content
- Provides clear comparison instructions
- Works with any range values

## Testing Different Ranges

Try these test cases to thoroughly verify the bug:

1. **First 16 bytes**: `0-15` → Should start with `41 42 43 44...` (ABCD...)
2. **Offset range**: `10-25` → Should start with `4B 4C 4D 4E...` (KLMN...)
3. **End of file**: `240-255` → Should end with `21 21 0A` (!!\\n)
4. **Single byte**: `0-0` → Should be `41` (A)
5. **Full file**: `0-255` → All 256 bytes

## Verification Steps

1. Run test in browser (should work correctly)
2. Run same test on Android (will show regression if present)
3. Run comparison script to get expected bytes
4. Compare hex output between app and script
5. Export results from app for documentation

## Expected vs Actual

### Browser (Working)
```
Range: bytes=0-15
Status: 206 (Partial Content)
Hex: 41 42 43 44 45 46 47 48 49 4A 4B 4C 4D 4E 4F 50
```

### Android with Regression (Broken)
```
Range: bytes=0-15
Status: 206 (Partial Content)
Hex: [Different bytes - offset incorrectly]
```

### External curl (Working)
```bash
curl -r 0-15 http://localhost:5173/test-file.txt | xxd
# Shows: 41 42 43 44 45 46 47 48 49 4A 4B 4C 4D 4E 4F 50
```

## Debugging

If tests don't work as expected:

1. Verify test file exists: `cat public/test-file.txt`
2. Check dev server is running: `curl http://localhost:5173/test-file.txt`
3. Verify range request works locally: `curl -r 0-15 http://localhost:5173/test-file.txt`
4. Check Capacitor version: `cat package.json | grep capacitor`
5. Rebuild app: `npm run build && npx cap sync`

## Files Created

- `public/test-file.txt` - Test data file with known byte content
- `src/pages/RangeTest.tsx` - Interactive test UI component
- `src/pages/RangeTest.css` - Styling for test page
- `scripts/compare-range-requests.sh` - External comparison tool
- `REPRODUCTION.md` - This documentation file

## Contributing

To improve this reproduction:

1. Add more test files (binary files, larger files, etc.)
2. Add automated assertions for pass/fail
3. Add iOS testing
4. Add performance metrics
5. Add network logging

## Related Issues

- Original PR: https://github.com/ionic-team/capacitor/pull/8357
- Issue: https://github.com/ionic-team/capacitor/issues/8367
