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
  await new Promise((r) => server.listen(8089, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem('auditor-graphics', 'balanced');
      window.testPad = {
        index: 0,
        connected: true,
        mapping: 'standard',
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
      };
      Object.defineProperty(navigator, 'getGamepads', {
        value: () => (testPad.connected ? [testPad] : []),
      });
    });
    await page.goto('http://127.0.0.1:8089');
    await page.waitForFunction(() => window.auditorDebug);
    async function press(i) {
      await page.evaluate((i) => {
        testPad.buttons[i] = { pressed: true, value: 1 };
      }, i);
      await page.waitForFunction((i) => auditorDebug.controller().pressed[i], i);
      await page.evaluate((i) => {
        testPad.buttons[i] = { pressed: false, value: 0 };
      }, i);
      await page.waitForFunction((i) => !auditorDebug.controller().pressed[i], i);
    }
    assert.deepEqual(await page.locator('#game').boundingBox(), {
      x: 0,
      y: 0,
      width: 1100,
      height: 800,
    });
    await page.keyboard.press('Tab');
    assert.ok(await page.locator('#gameMenu').evaluate((e) => e.open));
    assert.ok(await page.locator('#missionTitle').isVisible());
    const paused = await page.evaluate(() => auditorDebug.snapshot().minutes);
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().minutes), paused);
    await page.screenshot({ path: root + '/preview-fullscreen-menu.png' });
    await press(13);
    assert.notEqual(await page.evaluate(() => document.activeElement.id), 'resumeGame');
    await press(9);
    assert.equal(await page.locator('#gameMenu').evaluate((e) => e.open), false);
    const start = await page.evaluate(() => auditorDebug.snapshot());
    await page.evaluate(() => (testPad.axes[0] = 0.7));
    await page.waitForTimeout(700);
    await page.evaluate(() => (testPad.axes[0] = 0));
    const moved = await page.evaluate(() => auditorDebug.snapshot());
    assert.ok(Math.hypot(start.x - moved.x, start.z - moved.z) > 0.2);
    await press(8);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().viewMode), 'first');
    const yaw = await page.evaluate(() => auditorDebug.snapshot().lookYaw);
    await page.evaluate(() => (testPad.axes[2] = 0.8));
    await page.waitForFunction((yaw) => auditorDebug.snapshot().lookYaw !== yaw, yaw);
    await page.evaluate(() => (testPad.axes[2] = 0));
    assert.notEqual(await page.evaluate(() => auditorDebug.snapshot().lookYaw), yaw);
    await press(9);
    await page.click('#settings');
    const state = await page.evaluate(() => auditorDebug.snapshot());
    Object.assign(state, { x: 0, z: -55, carX: 0, carZ: -55, carHeading: 0, driving: false });
    await page.setInputFiles('#file', {
      name: 'drive.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(state)),
    });
    await page.waitForFunction(() => !document.getElementById('modal').open);
    await press(3);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().driving), true);
    await page.evaluate(() => (testPad.buttons[7] = { pressed: true, value: 0.8 }));
    await page.waitForFunction(() => auditorDebug.snapshot().carSpeed > 2);
    await press(9);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().carSpeed), 0);
    await page.evaluate(() => {
      testPad.buttons[7] = { pressed: false, value: 0 };
      testPad.connected = false;
    });
    await page.waitForTimeout(250);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().carSpeed), 0);
    await page.click('#fullscreenToggle');
    await page.waitForTimeout(250);
    assert.ok(await page.evaluate(() => document.fullscreenElement));
    await page.evaluate(() => document.exitFullscreen());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    assert.deepEqual(await page.locator('#game').boundingBox(), {
      x: 0,
      y: 0,
      width: 390,
      height: 844,
    });
    await page.screenshot({ path: root + '/preview-fullscreen-mobile.png' });
    await page.click('#menuToggle');
    await page.click('[data-panel=shop]');
    assert.ok(await page.locator('#modal').evaluate((e) => e.open));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#modal').evaluate((e) => e.open), false);
    assert.deepEqual(errors, []);
    console.log(
      'Viewport, Tab/objectives, pause, controller movement/look/menu/car/triggers/disconnect, browser fullscreen and mobile menu passed (simulated standard gamepad).',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
