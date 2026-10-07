const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const gpu = process.argv.includes('--webgpu');
  const canvas = process.argv.includes('--canvas');
  const atmospheric = process.argv.includes('--atmospheric');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      ...(canvas ? ['--disable-webgl', '--disable-webgl2'] : []),
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
    const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.log('ERROR', e.message);
    });
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning')
        console.log(m.type(), m.text().slice(0, 600));
    });
    await page.addInitScript(
      ({ atmospheric }) => {
        localStorage.setItem('auditor-graphics', atmospheric ? 'cinematic' : 'balanced');
      },
      { atmospheric },
    );
    const requests = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    await page.waitForTimeout(4000);
    const backend = await page.evaluate(() => auditorDebug.renderer);
    console.log(backend);
    assert.match(backend, canvas ? /CANVAS/ : gpu ? /THREE.JS · WEBGPU/ : /THREE.JS · WEBGL 2/);
    async function shot(name) {
      const data = await page.evaluate(() => auditorDebug.captureFrame());
      fs.writeFileSync(root + '/' + name + '.png', Buffer.from(data.split(',')[1], 'base64'));
    }
    await shot(canvas ? 'three-canvas' : gpu ? 'three-webgpu' : 'three-webgl');
    const before = await page.evaluate(() => auditorDebug.snapshot());
    await page.keyboard.down('s');
    await page.waitForTimeout(1500);
    await page.keyboard.up('s');
    const after = await page.evaluate(() => auditorDebug.snapshot());
    assert.ok(Math.hypot(before.x - after.x, before.z - after.z) > 0.2);
    await page.click('#settings');
    await page.selectOption('#weatherChoice', 'golden');
    await page.click('#closeModal');
    await page.waitForTimeout(6000);
    await shot(canvas ? 'three-golden-canvas' : gpu ? 'three-golden-webgpu' : 'three-golden');
    if (!canvas) {
      await page.click('#settings');
      await page.selectOption('#graphicsChoice', atmospheric ? 'balanced' : 'cinematic');
      await page.click('#closeModal');
      await page.waitForTimeout(1500);
      await page.evaluate(() => auditorDebug.captureFrame());
    }
    assert.equal(requests.filter((u) => !u.startsWith('http://127.0.0.1:')).length, 0);
    assert.deepEqual(errors, []);
    console.log('PASS renderer, movement, golden weather, zero external requests.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
