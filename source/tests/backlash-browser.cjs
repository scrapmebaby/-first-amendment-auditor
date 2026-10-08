const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const fs = require('node:fs'),
  http = require('node:http'),
  path = require('node:path'),
  assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..');
  const { fresh, transaction } = await import('../dist/core.js');
  const { homeIncident } = await import('../dist/campaign.js');
  const state = fresh();
  state.genderChosen = true;
  state.x = -25;
  state.z = 83;
  state.campaign.homeKnown = true;
  transaction(state, 100, 'Test starting income');
  homeIncident(state, () => 0.9);
  state.minutes = 719.9;
  state.campaign.hoaNextInspection = 2160;
  state.campaign.homeClock = 0;
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
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((s) => {
      if (!localStorage.getItem('first-amendment-auditor-v1'))
        localStorage.setItem('first-amendment-auditor-v1', JSON.stringify(s));
    }, state);
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug?.snapshot().campaign.hoaFines === 25);
    await page.click('#menuToggle');
    await page.click('#campaign');
    assert.equal(await page.locator('#cleanHome').isDisabled(), true);
    await page.click('#buyBags');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().cleanupBags), 5);
    assert.equal(await page.locator('#cleanHome').isDisabled(), false);
    await page.click('#closeModal');
    assert.equal(await page.locator('#quickClean').isVisible(), true);
    await page.click('#quickClean');
    await page.click('#menuToggle');
    await page.click('#campaign');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().cleanupBags), 4);
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().campaign.homeIncidents[0].cleaned),
      true,
    );
    assert.equal(await page.locator('#cleanHome').isDisabled(), true);
    await page.screenshot({ path: root + '/preview-yard-cleanup.png' });
    await page.click('#closeModal');
    await page.click('#menuToggle');
    await page.click('[data-panel=ledger]');
    const text = await page.locator('#modalBody').innerText();
    assert.match(text, /HOA fines/);
    assert.match(text, /Home security, cleanup/);
    assert.match(text, /Borrowing and principal repayment stay outside profit/);
    const s = await page.evaluate(() => auditorDebug.snapshot());
    assert.equal(s.accounts.hoa, 25);
    assert.equal(s.accounts.home, 6);
    assert.equal(s.cash, 69);
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().cleanupBags), 4);
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().campaign.homeIncidents[0].cleaned),
      true,
    );
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.hoaFines), 25);
    assert.deepEqual(errors, []);
    console.log(
      'Mobile HOA inspection, bag purchase, at-home cleanup, category ledger and reload persistence passed.',
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
