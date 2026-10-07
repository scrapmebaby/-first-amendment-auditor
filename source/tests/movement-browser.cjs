const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict'),
  http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
  });
  await new Promise((r) => server.listen(8085, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-webgl', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:8085');
    await page.waitForFunction(() => window.auditorDebug);
    const before = await page.evaluate(() => auditorDebug.locals());
    await page.waitForTimeout(1800);
    const after = await page.evaluate(() => auditorDebug.locals());
    assert.ok(
      after.some((n, i) => Math.hypot(n.x - before[i].x, n.z - before[i].z) > 0.5),
      'locals walk purposefully',
    );
    const state = await page.evaluate(() => auditorDebug.snapshot());
    Object.assign(state, { x: 0, z: -55, carX: 0, carZ: -55, driving: false });
    delete state.carHeading;
    await page.click('#settings');
    await page.setInputFiles('#file', {
      name: 'old-save.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(state)),
    });
    await page.waitForFunction(() => !document.getElementById('modal').open);
    await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().driving), true);
    await page.keyboard.down('w');
    await page
      .waitForFunction(() => auditorDebug.snapshot().carSpeed > 7, {}, { timeout: 5000 })
      .catch(async (error) => {
        console.log(
          await page.evaluate(() => ({
            state: auditorDebug.snapshot(),
            hidden: document.hidden,
            modal: document.getElementById('modal').open,
            toast: document.getElementById('toast').textContent,
          })),
        );
        throw error;
      });
    await page.keyboard.down('a');
    await page.waitForFunction(() => auditorDebug.snapshot().carHeading > 0.3);
    await page.keyboard.up('a');
    await page.keyboard.up('w');
    const moving = await page.evaluate(() => auditorDebug.snapshot());
    assert.ok(moving.carSpeed > 5);
    assert.ok(moving.carHeading > 0.1);
    assert.ok(moving.z > -54);
    await page.keyboard.press('e');
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().driving),
      true,
      'cannot exit at speed',
    );
    await page.keyboard.down('Shift');
    await page.waitForFunction(() => auditorDebug.snapshot().carSpeed === 0);
    await page.keyboard.up('Shift');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().carSpeed), 0);
    await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().driving), false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#touchCar');
    await page.waitForTimeout(200);
    const button = page.locator('[data-move=ArrowUp]');
    assert.equal(await button.getAttribute('aria-label'), 'Accelerate');
    const box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() => auditorDebug.snapshot().carSpeed > 3);
    await page.mouse.up();
    assert.ok((await page.evaluate(() => auditorDebug.snapshot().carSpeed)) > 2, 'touch throttle');
    await page.click('#settings');
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().carSpeed),
      0,
      'menus stop vehicle',
    );
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().carSpeed), 0);
    assert.deepEqual(errors, []);
    console.log(
      'Browser: NPC walking, old save, acceleration, steering, safe exit, touch throttle, pause and reload passed.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
