# Capacitor Issue #8367 - Range Request Regression Reproduction

This project reproduces the range request regression introduced in Capacitor 8.1.1-nightly.

## Issue Details

**GitHub Issue:** https://github.com/ionic-team/capacitor/issues/8367

**Problem:** The regression in PR #8357 causes HTTP range requests to fail on Android. The issue involves improper stream seeking when handling byte range requests, causing incorrect bytes to be returned at the requested positions.

**Expected Behavior:** Range requests should return the correct bytes for the requested range (e.g., bytes 15-30 should return the 16 bytes starting at position 15), matching what external servers (like Vite dev server) return.

**Actual Behavior:** Capacitor 8.1.1-nightly returns incorrect byte content due to double-seeking the response stream, causing the wrong data to be read from the file.

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

- The default range is 15-30 (16 bytes)
- Click "Run Range Request Tests"
- You should see a **green card with ✓** indicating the test passed
- Expected bytes for range 15-30: `50 51 52 53 54 55 56 57 58 59 5A 30 31 32 33 34`
- This is "PQRSTUVWXYZ01234" in ASCII

### 3. Test on Android (Regression Test)

Build and deploy to Android:

```bash
npm run build
npx cap sync android
npx cap open android
```

Run the app on an Android device or emulator, navigate to the Range Test page, and run the same test.

**If the bug exists**, you will see:
- A **red card with ✗** indicating test failure
- An error message: **"Bytes do not match expected values - Range request regression detected!"**
- The expected vs actual hex bytes will differ, showing the offset issue

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

If the regression exists on Android, you will see:

```
❌ VALIDATION FAILED:
Bytes do not match expected values - Range request regression detected!

Expected Hex Bytes (range 15-30):
50 51 52 53 54 55 56 57 58 59 5A 30 31 32 33 34

Actual Hex Bytes (first 16 bytes of response):
4B 4C 4D 4E 4F 50 51 52 53 54 55 56 57 58 59 5A

ASCII Expected: PQRSTUVWXYZ01234
ASCII Actual:   KLMNOPQRSTUVWXYZ (wrong bytes - offset issue!)
```

## How It Works

### The Test File

`public/test-file.txt` contains 256 bytes of predictable ASCII text:
- Lines starting with known patterns (ABCDEF..., 0123456789...)
- Allows easy verification of byte positions
- Small enough to test various range requests

### The Range Test Page

The React component at `/range-test`:
- Makes fetch requests with `Range` headers
- **Automatically validates results** against expected bytes
- **Shows pass/fail status** with green ✓ or red ✗ indicators
- Validates the first N bytes (where N = end - start + 1) against expected content
- Ignores any extra bytes beyond the requested range
- Detects if wrong bytes are returned (offset issues, double-seeking)
- Displays only the requested byte range for focused comparison
- Shows both hex and ASCII representations
- Calculates and displays expected bytes
- **No manual comparison needed** - validation is automatic
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

1. Run test in browser (should show green ✓ card with matching bytes)
2. Run same test on Android (will show red ✗ card if bytes don't match)
3. Compare the expected vs actual hex bytes in the UI
4. Optionally run comparison script to verify with external tool
5. Export results from app for documentation

**The test is fully automated** - you just need to look for green ✓ (pass) or red ✗ (fail)!

The test validates only the **content** of the first (end-start+1) bytes and ignores any extra bytes that may be returned.

## Expected vs Actual

### Browser (Working) - Green Card ✓
```
Range Request Test ✓

✓ TEST PASSED: Bytes match expected values

Range Header: bytes=15-30
HTTP Status: 206 (Partial Content)
Total Bytes Received: 16

Expected Hex Bytes (range 15-30):
50 51 52 53 54 55 56 57 58 59 5A 30 31 32 33 34

Actual Hex Bytes (first 16 bytes of response):
50 51 52 53 54 55 56 57 58 59 5A 30 31 32 33 34

ASCII Preview: PQRSTUVWXYZ01234
```

### Android with Regression (Broken) - Red Card ✗
```
Range Request Test ✗

❌ VALIDATION FAILED:
Bytes do not match expected values - Range request regression detected!

Range Header: bytes=15-30
HTTP Status: 206 (Partial Content)
Total Bytes Received: 358
(Validating first 16 bytes, ignoring the rest)

Expected Hex Bytes (range 15-30):
50 51 52 53 54 55 56 57 58 59 5A 30 31 32 33 34

Actual Hex Bytes (first 16 bytes of response):
4B 4C 4D 4E 4F 50 51 52 53 54 55 56 57 58 59 5A

ASCII Preview: KLMNOPQRSTUVWXYZ
```

### External curl (Working)
```bash
curl -r 15-30 http://localhost:5173/test-file.txt | xxd
# Shows: 50 51 52 53 54 55 56 57 58 59 5A 30 31 32 33 34
```

## Debugging

If tests don't work as expected:

1. Verify test file exists: `cat public/test-file.txt`
2. Check dev server is running: `curl http://localhost:5173/test-file.txt`
3. Verify range request works locally: `curl -r 0-15 http://localhost:5173/test-file.txt`
4. Check Capacitor version: `cat package.json | grep capacitor`
5. Rebuild app: `npm run build && npx cap sync`

## Files Created

- `public/test-file.txt` - Test data file with known byte content (373 bytes)
- `src/pages/RangeTest.tsx` - Interactive test UI with automatic validation
- `src/pages/RangeTest.css` - Styling for test page
- `scripts/compare-range-requests.sh` - External comparison tool (curl-based)
- `scripts/quick-test.sh` - Quick reference for expected byte values
- `REPRODUCTION.md` - This documentation file

## Key Features

✅ **Automatic Validation** - No manual comparison needed
✅ **Pass/Fail Indicators** - Green ✓ or red ✗ cards
✅ **Detailed Error Messages** - Know exactly what failed
✅ **Content Verification** - Validates byte values at requested positions
✅ **Focused Testing** - Only validates first N bytes, ignores extra data
✅ **No DevTools Required** - Everything visible in the UI

## Contributing

To improve this reproduction:

1. Add more test files (binary files, larger files, etc.)
2. Add iOS testing
3. Add performance metrics
4. Add network logging
5. Add automated CI/CD tests

## Related Issues

- Original PR: https://github.com/ionic-team/capacitor/pull/8357
- Issue: https://github.com/ionic-team/capacitor/issues/8367
