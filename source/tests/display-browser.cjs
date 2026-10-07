const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict'),
  http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..'),
    gpu = process.argv.includes('--webgpu');
  const server = http.createServer((q, r) => {
    r.setHeader('Content-Type', 'text/html');
    r.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      ...(gpu
        ? [
            '--enable-unsafe-webgpu',
            '--enable-features=Vulkan',
            '--use-vulkan=swiftshader',
            '--disable-vulkan-surface',
          ]
        : []),
    ],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } }),
      errors = [];
    page.setDefaultTimeout(120000);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('auditor-graphics', 'balanced'));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'color-gamut', value: 'p3' }],
    });
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    assert.match(await page.evaluate(() => auditorDebug.renderer), gpu ? /WEBGPU/ : /WEBGL 2/);
    await page.waitForFunction(() => auditorDebug.display().colorSpace === 'display-p3');
    await page.click('#menuToggle');
    await page.click('#settings');
    await page.selectOption('#resolutionChoice', '4k');
    await page.click('#closeModal');
    await page.waitForFunction(
      () =>
        document.getElementById('world').width === 3840 &&
        document.getElementById('world').height === 2160,
    );
    await page.waitForTimeout(1800);
    console.log(await page.evaluate(() => auditorDebug.display()));
    await page.click('#menuToggle');
    await page.click('#settings');
    await page.selectOption('#resolutionChoice', 'native');
    await page.selectOption('#gamutChoice', 'srgb');
    await page.click('#closeModal');
    await page.waitForFunction(
      () =>
        auditorDebug.display().colorSpace === 'srgb' &&
        document.getElementById('world').width === 960,
    );
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.display().resolution), 'native');
    assert.equal(await page.evaluate(() => auditorDebug.display().colorSpace), 'srgb');
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'color-gamut', value: 'srgb' }],
    });
    await page.click('#menuToggle');
    await page.click('#settings');
    await page.selectOption('#gamutChoice', 'p3');
    await page.click('#closeModal');
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => auditorDebug.display().colorSpace), 'srgb');
    assert.deepEqual(errors, []);
    console.log(
      '4K framebuffer, P3 output, sRGB switching/fallback and persistence passed on ' +
        (gpu ? 'WebGPU' : 'WebGL2') +
        ' (emulated display gamut).',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
