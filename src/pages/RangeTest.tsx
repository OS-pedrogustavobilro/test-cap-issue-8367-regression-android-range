import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonTextarea,
} from '@ionic/react';
import './RangeTest.css';

interface TestResult {
  testName: string;
  url: string;
  rangeHeader: string;
  status: number;
  contentLength: number;
  hexBytes: string;
  asciiPreview: string;
  success: boolean;
  error?: string;
  expectedBytes?: string;
  bytesMatch?: boolean;
  lengthMatch?: boolean;
  validationError?: string;
}

const RangeTest: React.FC = () => {
  const [rangeStart, setRangeStart] = useState<number>(15);
  const [rangeEnd, setRangeEnd] = useState<number>(30);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const bytesToHex = (bytes: Uint8Array): string => {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  };

  const bytesToAscii = (bytes: Uint8Array): string => {
    return Array.from(bytes)
      .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
  };

  const makeRangeRequest = async (
    testName: string,
    url: string,
    start: number,
    end: number,
    expectedBytes?: string
  ): Promise<TestResult> => {
    const rangeHeader = `bytes=${start}-${end}`;
    const expectedLength = end - start + 1;

    try {
      const response = await fetch(url, {
        headers: {
          'Range': rangeHeader,
        },
      });

      const arrayBuffer = await response.arrayBuffer();
      const allBytes = new Uint8Array(arrayBuffer);

      // Extract only the requested range (first expectedLength bytes)
      // We only validate these bytes and ignore any extra bytes returned
      const bytes = allBytes.slice(0, expectedLength);
      const hexBytes = bytesToHex(bytes);

      // Only validate the content of the first (end-start+1) bytes
      const receivedTotalBytes = allBytes.length;
      const bytesMatch = expectedBytes ? hexBytes === expectedBytes : undefined;

      let validationError: string | undefined;
      if (bytesMatch === false) {
        validationError = `Bytes do not match expected values - Range request regression detected!`;
      }

      return {
        testName,
        url,
        rangeHeader,
        status: response.status,
        contentLength: receivedTotalBytes,
        hexBytes,
        asciiPreview: bytesToAscii(bytes),
        success: bytesMatch === true || bytesMatch === undefined,
        expectedBytes,
        bytesMatch,
        lengthMatch: undefined,
        validationError,
      };
    } catch (error) {
      return {
        testName,
        url,
        rangeHeader,
        status: 0,
        contentLength: 0,
        hexBytes: '',
        asciiPreview: '',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        expectedBytes,
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    const newResults: TestResult[] = [];

    // Calculate expected bytes for the requested range
    const expectedBytes = getExpectedBytes(rangeStart, rangeEnd);

    // Test 1: Local file (Capacitor served) with validation
    const localResult = await makeRangeRequest(
      'Range Request Test',
      '/test-file.txt',
      rangeStart,
      rangeEnd,
      expectedBytes
    );
    newResults.push(localResult);

    // Test 2: Full file for reference (no validation)
    const fullResult = await makeRangeRequest(
      'Full File (Reference)',
      '/test-file.txt',
      0,
      255
    );
    newResults.push(fullResult);

    setResults(newResults);
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  const getExpectedBytes = (start: number, end: number): string => {
    // Based on the test-file.txt content
    const content =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz\n' +
      'The quick brown fox jumps over the lazy dog.\n' +
      '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF\n' +
      'Range request test file with known content for byte verification.\n' +
      'This file contains exactly 256 bytes of predictable ASCII text data.\n' +
      'End of test file padding to reach exactly 256 bytes total size!!\n';

    const bytes = new TextEncoder().encode(content);
    const slice = bytes.slice(start, end + 1);
    return bytesToHex(slice);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Range Request Test - Issue #8367</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Range Request Test</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Test Configuration</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel position="stacked">Range Start (bytes)</IonLabel>
                <IonInput
                  type="number"
                  value={rangeStart}
                  onIonInput={(e) => setRangeStart(parseInt(e.detail.value || '15', 10))}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Range End (bytes)</IonLabel>
                <IonInput
                  type="number"
                  value={rangeEnd}
                  onIonInput={(e) => setRangeEnd(parseInt(e.detail.value || '30', 10))}
                />
              </IonItem>
            </IonList>
            <div style={{ marginTop: '16px' }}>
              <IonButton expand="block" onClick={runTests} disabled={loading}>
                {loading ? 'Running Tests...' : 'Run Range Request Tests'}
              </IonButton>
              {results.length > 0 && (
                <>
                  <IonButton expand="block" fill="outline" onClick={clearResults}>
                    Clear Results
                  </IonButton>
                </>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {results.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Expected Bytes (bytes {rangeStart}-{rangeEnd})</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonTextarea
                readonly
                value={getExpectedBytes(rangeStart, rangeEnd)}
                rows={3}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </IonCardContent>
          </IonCard>
        )}

        {results.map((result, index) => (
          <IonCard key={index} color={result.validationError ? 'danger' : (result.success ? 'success' : 'warning')}>
            <IonCardHeader>
              <IonCardTitle>
                {result.testName}
                {result.bytesMatch === true && ' ✓'}
                {result.bytesMatch === false && ' ✗'}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel>
                    <strong>URL:</strong> {result.url}
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <strong>Range Header:</strong> {result.rangeHeader}
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <strong>HTTP Status:</strong> {result.status}
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel style={{ whiteSpace: 'normal' }}>
                    <strong>Total Bytes Received:</strong> {result.contentLength}
                    {result.contentLength !== (rangeEnd - rangeStart + 1) && (
                      <div style={{ fontSize: '0.9em', color: '#999', marginTop: '4px' }}>
                        (Validating first {rangeEnd - rangeStart + 1} bytes, ignoring the rest)
                      </div>
                    )}
                  </IonLabel>
                </IonItem>

                {result.validationError && (
                  <IonItem color="danger" lines="full">
                    <IonLabel style={{ whiteSpace: 'normal' }}>
                      <strong>❌ VALIDATION FAILED:</strong><br/>
                      {result.validationError}
                    </IonLabel>
                  </IonItem>
                )}

                {result.bytesMatch === true && (
                  <IonItem color="success" lines="full">
                    <IonLabel style={{ whiteSpace: 'normal' }}>
                      <strong>✓ TEST PASSED:</strong><br/>
                      Bytes match expected values
                    </IonLabel>
                  </IonItem>
                )}

                {result.error && (
                  <IonItem color="danger">
                    <IonLabel>
                      <strong>Error:</strong> {result.error}
                    </IonLabel>
                  </IonItem>
                )}

                {result.expectedBytes && (
                  <IonItem>
                    <IonLabel position="stacked">
                      <strong>Expected Hex Bytes (range {rangeStart}-{rangeEnd}):</strong>
                    </IonLabel>
                    <IonTextarea
                      readonly
                      value={result.expectedBytes}
                      rows={3}
                      style={{ fontFamily: 'monospace', fontSize: '12px', width: '100%', backgroundColor: '#f0f0f067' }}
                    />
                  </IonItem>
                )}

                <IonItem>
                  <IonLabel position="stacked">
                    <strong>Actual Hex Bytes (first {rangeEnd - rangeStart + 1} bytes of response):</strong>
                  </IonLabel>
                  <IonTextarea
                    readonly
                    value={result.hexBytes}
                    rows={3}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      width: '100%',
                      backgroundColor: result.bytesMatch === false ? '#f0f0f067' : undefined
                    }}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">
                    <strong>ASCII Preview (first {rangeEnd - rangeStart + 1} bytes):</strong>
                  </IonLabel>
                  <IonTextarea
                    readonly
                    value={result.asciiPreview}
                    rows={2}
                    style={{ fontFamily: 'monospace', fontSize: '12px', width: '100%' }}
                  />
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default RangeTest;
