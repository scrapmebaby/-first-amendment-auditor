const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict'),
  http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((q, r) => {
    r.setHeader('Content-Type', 'text/html');
    r.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem('auditor-graphics', 'balanced');
      const NativeAudioContext = window.AudioContext;
      window.AudioContext = class extends NativeAudioContext {
        constructor(...args) {
          super(...args);
          window.testAudioContext = this;
        }
      };
    });
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    await page.click('#soundToggle');
    await page.waitForFunction(
      () =>
        auditorDebug.audio().enabled &&
        auditorDebug.audio().state === 'running' &&
        auditorDebug.audio().gain > 0.1,
    );
    await page.evaluate(() => testAudioContext.suspend());
    await page.locator('#thumbstick').tap();
    await page.waitForFunction(() => auditorDebug.audio().state === 'running');
    assert.equal(await page.locator('#thumbstick .minimap').count(), 0);
    assert.equal(await page.locator('#townMap').isVisible(), false);
    await page.click('#mapToggle');
    assert.ok(await page.locator('#townMap').isVisible());
    await page.screenshot({ path: root + '/preview-map-portrait.png' });
    await page.click('#closeMap');
    assert.equal(await page.locator('#townMap').isVisible(), false);
    assert.equal(
      await page.locator('#stickKnob').evaluate((e) => getComputedStyle(e).backgroundColor),
      'rgba(0, 0, 0, 0)',
    );
    const cdp = await page.context().newCDPSession(page);
    const send = (type, points) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    const box = await page.locator('#thumbstick').boundingBox(),
      left = { id: 1, x: box.x + 72, y: box.y + 72 };
    await page.click('#viewToggle');
    const yaw = await page.evaluate(() => auditorDebug.snapshot().lookYaw);
    await send('touchStart', [left]);
    await send('touchMove', [{ ...left, y: left.y - 35 }]);
    await page.waitForFunction(() => auditorDebug.snapshot().moving);
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().lookYaw),
      yaw,
      'movement thumb does not turn camera',
    );
    const right = { id: 2, x: 300, y: 420 };
    await send('touchStart', [{ ...left, y: left.y - 35 }, right]);
    await send('touchMove', [
      { ...left, y: left.y - 35 },
      { ...right, x: 335 },
    ]);
    await page.waitForFunction((y) => auditorDebug.snapshot().lookYaw !== y, yaw);
    await send('touchEnd', [{ ...right, x: 335 }]);
    assert.ok(await page.evaluate(() => auditorDebug.touch().y < 0), 'look release keeps walking');
    await send('touchStart', [{ ...left, y: left.y - 35 }, right]);
    await send('touchEnd', [{ ...left, y: left.y - 35 }]);
    assert.equal(await page.evaluate(() => auditorDebug.touch().y), 0);
    assert.equal(
      await page.evaluate(() => auditorDebug.touch().looking),
      true,
      'movement release keeps look',
    );
    await send('touchCancel', []);
    assert.equal(await page.evaluate(() => auditorDebug.touch().looking), false);
    await send('touchStart', [{ ...left, x: left.x + 40 }]);
    await page.click('#menuToggle');
    assert.equal(await page.evaluate(() => auditorDebug.touch().x), 0);
    await send('touchCancel', []);
    await page.click('#settings');
    const s = await page.evaluate(() => auditorDebug.snapshot());
    Object.assign(s, { x: 0, z: -55, carX: 0, carZ: -55, carHeading: 0, driving: true });
    await page.setInputFiles('#file', {
      name: 'drive.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(s)),
    });
    await page.waitForFunction(() => !document.getElementById('modal').open);
    await page.waitForFunction(
      () => !document.getElementById('touchPedals').classList.contains('hidden'),
    );
    const gas = await page.locator('[data-pedal=gas]').boundingBox(),
      accelerator = { id: 3, x: gas.x + gas.width / 2, y: gas.y + gas.height / 2 };
    await send('touchStart', [{ ...left, x: left.x - 38 }, accelerator]);
    await page.waitForFunction(
      () => auditorDebug.snapshot().carSpeed > 2 && auditorDebug.snapshot().carHeading > 0.1,
    );
    await send('touchEnd', []);
    assert.equal(await page.evaluate(() => auditorDebug.touch().gas), 0);
    assert.equal(await page.evaluate(() => auditorDebug.touch().x), 0);
    const stop = await page.locator('[data-pedal=brake]').boundingBox();
    await send('touchStart', [{ id: 4, x: stop.x + 20, y: stop.y + 20 }]);
    await page.waitForFunction(() => auditorDebug.snapshot().carSpeed === 0);
    await send('touchEnd', []);
    await page.screenshot({ path: root + '/preview-touch-portrait.png' });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    assert.ok(await page.locator('#thumbstick').isVisible());
    assert.ok(await page.locator('[data-pedal=gas]').isVisible());
    await page.click('#mapToggle');
    assert.ok(await page.locator('#townMap').isVisible());
    const mapBox = await page.locator('#townMap').boundingBox();
    assert.ok(
      mapBox.x >= 0 &&
        mapBox.y >= 0 &&
        mapBox.x + mapBox.width <= 844 &&
        mapBox.y + mapBox.height <= 390,
    );
    await page.screenshot({ path: root + '/preview-map-landscape.png' });
    await page.locator('#thumbstick').tap();
    assert.equal(await page.locator('#townMap').isVisible(), false);
    await page.screenshot({ path: root + '/preview-touch-landscape.png' });
    assert.deepEqual(errors, []);
    console.log(
      'Collapsible map, transparent stick, audio tap activation/recovery and real browser multitouch: simultaneous move/look, independent releases, cancellation, menu reset, steering+gas, brake and landscape passed. Physical iPhone untested.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
