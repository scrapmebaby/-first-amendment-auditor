const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const { fresh, finishClip } = await import('../dist/core.js');
  const state = fresh();
  state.tutorial = false;
  for (let i = 0; i < 3; i++)
    finishClip(
      state,
      { seconds: 45, drama: 6, music: false, touched: false, place: 'CITY HALL', person: 'Pat' },
      0.5,
    );
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-webgl', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(
      (s) => localStorage.setItem('first-amendment-auditor-v1', JSON.stringify(s)),
      state,
    );
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    async function panel(selector) {
      await page.click('#menuToggle');
      await page.click(selector);
    }
    await panel('[data-panel=shop]');
    assert.equal(await page.locator('[data-buy=camera]').isDisabled(), true);
    await page.click('#closeModal');
    await panel('#campaign');
    assert.equal(await page.locator('#takeLoan').isDisabled(), true);
    await page.click('#closeModal');
    await panel('[data-panel=editor]');
    for (let i = 1; i <= 3; i++) await page.click('#publish-' + i);
    await page.click('#closeModal');
    let s = await page.evaluate(() => auditorDebug.snapshot());
    assert.equal(s.published, 3);
    assert.ok(s.likes >= 150);
    assert.ok(s.cash >= 45);
    await panel('[data-panel=shop]');
    assert.equal(await page.locator('[data-buy=mic]').isDisabled(), false);
    await page.click('[data-buy=mic]');
    s = await page.evaluate(() => auditorDebug.snapshot());
    assert.ok(s.gear.includes('mic'));
    assert.ok(s.cash >= 0);
    await page.click('#closeModal');
    await panel('#campaign');
    assert.equal(await page.locator('#takeLoan').isDisabled(), false);
    await page.click('#takeLoan');
    assert.equal(await page.locator('#takeLoan').isDisabled(), true);
    s = await page.evaluate(() => auditorDebug.snapshot());
    assert.ok(s.campaign.loanDebt > 0 && s.campaign.loanDebt <= 100);
    assert.deepEqual(errors, []);
    console.log(
      'Mobile: empty-wallet purchases/loans blocked; three uploads earn an upgrade; eligible loan succeeds once and locks again. No runtime errors.',
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
