import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

test.describe('Intermediate · Files', () => {
  test('single and multi uploads via setInputFiles', async ({ page }) => {
    await page.goto('/intermediate/files');

    const buffer = Buffer.from('playwright practice report');
    await page.getByTestId('single-upload').setInputFiles({
      name: 'report.txt',
      mimeType: 'text/plain',
      buffer,
    });
    await expect(page.getByTestId('single-result')).toContainText('report.txt (26 bytes)');

    const pngBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    await page.getByTestId('multi-upload').setInputFiles([
      { name: 'a.png', mimeType: 'image/png', buffer: pngBytes },
      { name: 'b.png', mimeType: 'image/png', buffer: pngBytes },
    ]);
    await expect(page.getByTestId('multi-result').locator('li')).toHaveCount(2);
  });

  test('multipart upload reaches the server and round-trips', async ({ page }) => {
    await page.goto('/intermediate/files');
    await page.getByTestId('single-upload').setInputFiles({
      name: 'evidence.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('round trip payload'),
    });
    await page.getByTestId('upload-server').click();
    await expect(page.getByTestId('upload-result')).toContainText('Received evidence.txt (18 bytes)');
  });

  test('downloads: filename suggestion and saved content', async ({ page }, testInfo) => {
    // Playwright limitation: headless WebKit on Linux cannot produce downloads.
    // They work on Chromium/Firefox everywhere and on WebKit on macOS/Windows.
    test.skip(
      testInfo.project.name === 'webkit' && process.platform === 'linux',
      'headless WebKit on Linux does not support downloads',
    );

    await page.goto('/intermediate/files');

    const pdfPromise = page.waitForEvent('download');
    await page.getByTestId('download-pdf').click();
    const pdf = await pdfPromise;
    expect(pdf.suggestedFilename()).toBe('quarterly-report.pdf');
    await pdf.saveAs(testInfo.outputPath('quarterly-report.pdf'));

    const txtPromise = page.waitForEvent('download');
    await page.getByTestId('download-txt').click();
    const txt = await txtPromise;
    expect(txt.suggestedFilename()).toBe('test-logs.txt');
    await txt.saveAs(testInfo.outputPath('test-logs.txt'));

    const content = await readFile(testInfo.outputPath('test-logs.txt'), 'utf8');
    expect(content).toContain('test-runner started');
    expect(content.split('\n')).toHaveLength(5);
  });
});
