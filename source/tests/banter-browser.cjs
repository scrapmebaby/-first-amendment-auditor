const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..'),
    server = http.createServer((q, r) => {
      r.setHeader('Content-Type', 'text/html');
      r.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
    });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-webgl', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      }),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    await page.click('#touchEngage');
    await page.waitForFunction(() => auditorDebug.conversation().lines.length >= 4);
    let lines = await page.evaluate(() => auditorDebug.conversation().lines);
    assert.deepEqual(
      lines.slice(0, 4).map((l) => l.auditor),
      [true, false, true, false],
    );
    assert.equal(await page.evaluate(() => auditorDebug.recording), false);
    await page.screenshot({ path: root + '/preview-banter-portrait.png' });
    await page.click('#conversationToggle');
    assert.equal(await page.locator('#conversationLines').isVisible(), false);
    await page.click('#conversationToggle');
    // A new take must include both speakers in its event history.
    await page.evaluate(() => auditorDebug.setEncounterRoll(0.7));
    await page.click('#touchFilm');
    await page.click('#touchEngage');
    await page.waitForTimeout(1900);
    assert.ok((await page.locator('#conversationLines .civilian-line').count()) > 0);
    await page.waitForTimeout(1700);
    await page.click('#touchFilm');
    const events = await page.evaluate(() => auditorDebug.snapshot().clips.at(-1).events);
    assert.ok(events.some((e) => e.event.startsWith('AUDITOR:')));
    assert.ok(events.some((e) => /office worker:/.test(e.event)));
    await page.setViewportSize({ width: 844, height: 390 });
    await page.screenshot({ path: root + '/preview-banter-landscape.png' });
    assert.ok(await page.locator('#thumbstick').isVisible());
    assert.ok(await page.locator('#conversation').isVisible());
    const panel = await page.locator('#conversation').boundingBox(),
      stick = await page.locator('#thumbstick').boundingBox();
    assert.ok(panel.x >= stick.x + stick.width);
    assert.deepEqual(errors, []);
    console.log(
      'Mobile two-way conversation, four coherent turns without recording, collapse, captured speakers and landscape layout passed.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
