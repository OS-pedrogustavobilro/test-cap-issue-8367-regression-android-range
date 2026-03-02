# Capacitor Issue #8367 - Range Request Regression

Reproduction app for the range request regression in Capacitor 8.1.1-nightly that causes HTTP range requests to return incorrect bytes on Android due to improper stream seeking.

**Issue:** https://github.com/ionic-team/capacitor/issues/8367

**PR with regression:** https://github.com/ionic-team/capacitor/pull/8357

**PR with fix:** https://github.com/ionic-team/capacitor/pull/8369

## Reproduction Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Test in browser (baseline - should pass):
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:5173`, click "Open Range Request Test", then "Run Range Request Tests". You should see a green ✓ card.

3. Test on Android (regression - should fail):
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```
   Run the app and navigate to the Range Test page. If the bug exists, you'll see a red ✗ card with an error message showing incorrect bytes.

## What to Look For

- **Browser (working)**: Green card with ✓ and matching hex bytes
- **Android with bug**: Red card with ✗ and mismatched hex bytes (offset issue)

The test automatically validates byte content at the requested range positions and displays pass/fail results.

## Fixing

You may manually update the code in `WebViewLocalServer.java` to remove the problematic block, after which the tests should pass.

## Additional Info

- See [REPRODUCTION.md](./REPRODUCTION.md) for detailed documentation
- Test file: `public/test-file.txt` (256 bytes with predictable ASCII content)
- Test page: `src/pages/RangeTest.tsx` (automatic validation presentation UI)
- Comparison script: `scripts/compare-range-requests.sh` (external verification tool)
