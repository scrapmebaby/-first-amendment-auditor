const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict'),
  http = require('node:http'),
  fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(path.resolve(__dirname, '../1st-amendment-auditor.html')));
  });
  await new Promise((r) => server.listen(8083, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-webgl', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:8083');
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().profanity), false);
    await page.click('#menuToggle');
    await page.click('[data-panel=shop]');
    assert.match(await page.locator('#modalBody').innerText(), /Poop mask/);
    assert.doesNotMatch(await page.locator('#modalBody').innerText(), /shit/i);
    await page.click('#closeModal');
    await page.click('#menuToggle');
    await page.click('#settings');
    await page.selectOption('#languageChoice', 'explicit');
    await page.click('#ambientMusic');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().music), false);
    await page.click('#terms');
    assert.match(await page.locator('#modalBody').innerText(), /paid access/);
    await page.click('#closeModal');
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().profanity), true);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().music), false);
    await page.click('#menuToggle');
    await page.click('[data-panel=shop]');
    assert.match(await page.locator('#modalBody').innerText(), /Piece of shit mask/);
    await page.click('#closeModal');
    await page.click('#menuToggle');
    await page.click('#settings');
    await page.selectOption('#languageChoice', 'clean');
    const save = await page.evaluate(() => auditorDebug.snapshot());
    delete save.profanity;
    await page.setInputFiles('#file', {
      name: 'old.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(save)),
    });
    await page.waitForFunction(() => !document.getElementById('modal').open);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().profanity), false);
    await page.evaluate(() => auditorDebug.setEncounterRoll(0.7));
    await page.keyboard.press('f');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1800);
    assert.doesNotMatch(await page.locator('#speech').innerText(), /fuck|shit|asshole/i);
    await page.waitForTimeout(2000);
    await page.keyboard.press('f');
    assert.ok(
      await page.evaluate(() =>
        auditorDebug.snapshot().clips[0].events.some((e) => e.event.startsWith('AUDITOR:')),
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      'Language default/toggle, persistence, legacy import, clean shop, agreement, delayed dialogue and recording metadata passed.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
