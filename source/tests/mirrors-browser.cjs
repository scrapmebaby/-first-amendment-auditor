const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const fs = require('node:fs'),
  http = require('node:http'),
  path = require('node:path'),
  assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
  });
  await new Promise((r) => server.listen(8087, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: process.argv.includes('--webgpu')
      ? [
          '--no-sandbox',
          '--enable-unsafe-webgpu',
          '--use-angle=swiftshader',
          '--enable-features=Vulkan',
          '--use-vulkan=swiftshader',
          '--disable-vulkan-surface',
        ]
      : ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } }),
      errors = [];
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.log('ERROR', e.message);
    });
    page.on('console', (m) => {
      if (m.type() === 'error') {
        errors.push(m.text());
        console.log('CONSOLE', m.text());
      }
    });
    await page.addInitScript(() => localStorage.setItem('auditor-graphics', 'balanced'));
    await page.goto('http://127.0.0.1:8087');
    await page.waitForFunction(() => window.auditorDebug);
    if (process.argv.includes('--webgpu'))
      assert.match(await page.evaluate(() => auditorDebug.renderer), /WEBGPU/);
    await page.click('#findMirror');
    await page.waitForFunction(() => auditorDebug.snapshot().viewMode === 'first');
    await page.waitForFunction(() => auditorDebug.view().mode === 'first');
    await page.waitForTimeout(1800);
    async function shot(name) {
      const data = await page.evaluate(() => auditorDebug.captureFrame());
      fs.writeFileSync(
        root + '/' + (process.argv.includes('--webgpu') ? 'gpu-' : '') + name,
        Buffer.from(data.split(',')[1], 'base64'),
      );
    }
    await shot('preview-mirror.png');
    console.log('VIEW', await page.evaluate(() => auditorDebug.view()));
    assert.ok(await page.evaluate(() => auditorDebug.view().flies));
    await page.click('[data-panel=shop]');
    await page.click('[data-buy=merchPress]');
    await page.click('[data-buy=clown]');
    await page.click('#closeModal');
    await page.waitForFunction(() => auditorDebug.view().merch === 'merchPress');
    await page.waitForTimeout(1200);
    await shot('preview-mirror-merch.png');
    const old = await page.evaluate(() => auditorDebug.snapshot().lookYaw);
    await page.keyboard.down('r');
    await page.waitForTimeout(500);
    await page.keyboard.up('r');
    assert.notEqual(await page.evaluate(() => auditorDebug.snapshot().lookYaw), old);
    await page.keyboard.press('v');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().viewMode), 'overhead');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#viewToggle');
    await page.waitForTimeout(500);
    const game = await page.locator('#game').boundingBox();
    const yaw = await page.evaluate(() => auditorDebug.snapshot().lookYaw);
    await page.mouse.move(game.x + game.width * 0.4, game.y + game.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(game.x + game.width * 0.65, game.y + game.height * 0.5, { steps: 5 });
    await page.mouse.up();
    assert.notEqual(await page.evaluate(() => auditorDebug.snapshot().lookYaw), yaw);
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().merch), 'merchPress');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().viewMode), 'first');
    assert.deepEqual(errors, []);
    console.log(
      'Mirrors, visible flies, merch/mask, view switching, mobile drag and save persistence passed.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
