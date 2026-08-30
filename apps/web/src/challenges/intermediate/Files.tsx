import { useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';

const TASK = `Files flow in both directions:

1. Choose a file in the single upload input — its name and size appear below.
2. Choose several files in the multi input (setInputFiles supports arrays).
3. Upload the chosen file to the server with "Upload to server" — the server responds with "Received <name> (<size> bytes)".
4. Download the quarterly report (a real PDF download) and the text logs. Assert download.suggestedFilename() and save the files.

Uploads need the practice API running (npm run dev).`;

interface Chosen {
  name: string;
  size: number;
}

export default function Files() {
  const [single, setSingle] = useState<Chosen | null>(null);
  const [multi, setMulti] = useState<Chosen[]>([]);
  const [dropped, setDropped] = useState<Chosen | null>(null);
  const [serverResult, setServerResult] = useState('');
  const [over, setOver] = useState(false);
  const lastUpload = useRef<File | null>(null);

  const toChosen = (file: File): Chosen => ({ name: file.name, size: file.size });

  const uploadToServer = async () => {
    const file = lastUpload.current;
    if (!file) {
      setServerResult('Choose a file first.');
      return;
    }
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await apiFetch<{ message: string }>('/api/upload', { method: 'POST', body });
      setServerResult(res.message);
    } catch (err) {
      setServerResult(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div className="card">
        <h3>Single upload</h3>
        <div className="field">
          <label htmlFor="single-file">Report file</label>
          <input
            id="single-file"
            type="file"
            data-testid="single-upload"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setSingle(toChosen(f));
                lastUpload.current = f;
              }
            }}
          />
        </div>
        {single && (
          <p data-testid="single-result">
            Chosen: <strong>{single.name}</strong> ({single.size} bytes)
          </p>
        )}
      </div>

      <div className="card">
        <h3>Multiple upload</h3>
        <div className="field">
          <label htmlFor="multi-file">Attachment files</label>
          <input
            id="multi-file"
            type="file"
            multiple
            data-testid="multi-upload"
            onChange={(e) => setMulti(Array.from(e.target.files ?? []).map(toChosen))}
          />
        </div>
        {multi.length > 0 && (
          <ul data-testid="multi-result">
            {multi.map((f) => (
              <li key={f.name}>
                {f.name} — {f.size} bytes
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Drag & drop upload</h3>
        <div
          className={`dropzone ${over ? 'over' : ''}`}
          data-testid="drop-upload"
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) {
              setDropped(toChosen(f));
              lastUpload.current = f;
            }
          }}
        >
          Drop a file here
        </div>
        {dropped && (
          <p data-testid="drop-result">
            Dropped: <strong>{dropped.name}</strong> ({dropped.size} bytes)
          </p>
        )}
      </div>

      <div className="card">
        <h3>Server upload & downloads</h3>
        <button type="button" className="btn" data-testid="upload-server" onClick={uploadToServer}>
          Upload to server
        </button>
        <p className="status-region" data-testid="upload-result">
          {serverResult || 'Server response appears here.'}
        </p>
        <p style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/api/files/report.pdf/download" data-testid="download-pdf">
            ⬇ quarterly-report.pdf
          </a>
          <a href="/api/files/logs.txt/download" data-testid="download-txt">
            ⬇ test-logs.txt
          </a>
        </p>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'files',
  track: 'intermediate',
  title: 'Files',
  summary: 'Upload single/multiple files (input and drag-drop), post multipart to a server, and assert real downloads.',
  concepts: ['setInputFiles', 'multipart upload', 'download events', 'saveAs', 'suggestedFilename'],
  task: TASK,
  hints: [
    'page.getByTestId("single-upload").setInputFiles({ name: "report.txt", mimeType: "text/plain", buffer: Buffer.from("hello") }) — buffers avoid fixture files.',
    'Downloads: start waiting BEFORE clicking: const downloadPromise = page.waitForEvent("download"); await link.click(); const download = await downloadPromise; then download.suggestedFilename() and download.saveAs(...).',
    'The server upload sends a real multipart request. Assert the response text contains your file name and byte size.',
  ],
  solution: `test('uploads and downloads', async ({ page }) => {
  await page.goto('/intermediate/files');

  const buffer = Buffer.from('playwright practice report');
  await page.getByTestId('single-upload').setInputFiles({
    name: 'report.txt', mimeType: 'text/plain', buffer,
  });
  await expect(page.getByTestId('single-result')).toContainText('report.txt (26 bytes)');

  await page.getByTestId('multi-upload').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71]) },
    { name: 'b.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71]) },
  ]);
  await expect(page.getByTestId('multi-result').locator('li')).toHaveCount(2);

  await page.getByTestId('upload-server').click();
  await expect(page.getByTestId('upload-result')).toContainText('Received report.txt (27 bytes)');

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-pdf').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('quarterly-report.pdf');
  await download.saveAs('artifacts/' + download.suggestedFilename());
});`,
  example: 'examples/intermediate/files.spec.ts',
  path: '/intermediate/files',
};
