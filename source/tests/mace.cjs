const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
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
    args: [
      '--no-sandbox',
      '--enable-unsafe-webgpu',
      '--use-angle=swiftshader',
      '--enable-features=Vulkan',
      '--use-vulkan=swiftshader',
      '--disable-vulkan-surface',
    ],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {});
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    await page.evaluate(() => auditorDebug.setEncounterRoll(0.45));
    await page.click('#menuToggle');
    await page.click('[data-panel=shop]');
    await page.click('[data-buy=spray]');
    await page.click('#closeModal');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().spray), 3);
    await page.keyboard.press('f');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1400);
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().spray),
      3,
      'Words alone should not trigger automatic mace',
    );
    for (let i = 0; i < 5; i++) {
      if (await page.evaluate(() => auditorDebug.snapshot().spray < 3)) break;
      await page.keyboard.press('Space');
      await page.waitForTimeout(1400);
    }
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().spray), 2);
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().expenses),
      20,
      'Retaliatory use should not receive an automatic unprovoked-use fine',
    );
    await page.waitForTimeout(1800);
    await page.evaluate(() => auditorDebug.setEncounterRoll(0.1));
    await page.click('#quickPolice');
    await page.waitForFunction(() => auditorDebug.snapshot().pendingReport, {}, { timeout: 45000 });
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().pendingReport.arrest),
      true,
      'Retaliatory mace does not prevent police from arresting the civilian',
    );
    await page.keyboard.press('f');
    const clip = await page.evaluate(() => auditorDebug.snapshot().clips[0]);
    assert.ok(clip.events.some((e) => e.event.includes('automatically maces')));
    assert.ok(clip.events.some((e) => e.event.includes('self-defense')));
    assert.ok(clip.events.some((e) => e.event.includes('retreats after being maced')));
    assert.deepEqual(errors, []);
    console.log(
      'PASS: equipped mace triggers on contact, consumes one charge, records both reactions, and preserves civilian charge/arrest flow.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
