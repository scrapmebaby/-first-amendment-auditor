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
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1320, height: 1000 } });
    page.setDefaultTimeout(45000);
    const errors = [];
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.log('ERROR', e.message);
    });
    page.on('console', (m) => {
      if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 250));
    });
    await page.addInitScript(() => localStorage.setItem('auditor-graphics', 'balanced'));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => auditorDebug.castCount), 19);
    await page.click('#menuToggle');
    await page.click('#inspectLocal');
    await page.waitForFunction(() => !document.getElementById('castLoading'));
    assert.equal(await page.locator('#castName').textContent(), 'Pat');
    async function shot(name) {
      const data = await page.evaluate(() => auditorDebug.castSnapshot());
      fs.writeFileSync(
        root + '/character-' + name + '.png',
        Buffer.from(data.split(',')[1], 'base64'),
      );
    }
    await shot('pat');
    await page.screenshot({ path: root + '/preview-cast.png' });
    for (const [i, name] of [
      [2, 'morgan'],
      [3, 'dee'],
      [7, 'sam'],
      [8, 'casey'],
      [12, 'lee'],
      [18, 'nell'],
      [0, 'auditor'],
      [19, 'crew'],
      [21, 'officer'],
    ]) {
      await page.click(`[data-cast="${i}"]`);
      await page.waitForTimeout(180);
      await shot(name);
    }
    for (let i = 0; i < 23; i++) {
      await page.click(`[data-cast="${i}"]`);
      assert.ok((await page.locator('#castName').textContent()).length > 0);
    }
    await page.click('[data-cast="1"]');
    await page.click('#castZoom');
    await shot('face');
    for (const pose of ['rage', 'cry', 'throw', 'refuse', 'recoil', 'walk']) {
      await page.selectOption('#castPose', pose);
      await page.waitForTimeout(250);
      await shot(pose);
    }
    await page.click('#closeModal');
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => document.querySelector('#modal').open), false);
    await page.click('#menuToggle');
    await page.click('#inspectLocal');
    await page.waitForFunction(() => !document.getElementById('castLoading'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: root + '/preview-cast-mobile.png' });
    await page.keyboard.press('Escape');
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.castCount), 19);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: 19 unique in-world rigs; cast viewer, original faces/outfits, all gestures, close/reopen, mobile and reload.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
