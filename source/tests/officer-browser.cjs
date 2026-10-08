const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const gpu = process.argv.includes('--gpu');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: gpu
      ? ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
      : ['--no-sandbox', '--disable-webgl', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    await page.click('#chooseFemale');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().gender), 'female');
    if (gpu) {
      await page.waitForFunction(() => auditorDebug.view().gender === 'female');
      await page.click('#findMirror');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: root + '/preview-female-auditor.png' });
    }
    const state = await page.evaluate(() => auditorDebug.snapshot());
    state.x = 7;
    state.z = -8;
    state.viewMode = 'overhead';
    state.health = 100;
    await page.click('#menuToggle');
    await page.click('#settings');
    await page.setInputFiles('#file', {
      name: 'officer.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(state)),
    });
    await page.waitForFunction(() => !document.querySelector('#modal').open);
    await page.waitForFunction(() => auditorDebug.officer().nearby);
    await page.evaluate(() => auditorDebug.setEncounterRoll(0.05));
    await page.click('#questionOfficer');
    await page.waitForFunction(() => auditorDebug.officer().contact?.report.officerMisconduct);
    assert.equal(await page.evaluate(() => auditorDebug.recording), true);
    await page.click('#askSupervisor');
    assert.equal(await page.locator('#askSupervisor').isDisabled(), true);
    await page.waitForFunction(() => auditorDebug.officer().contact.report.supervisorReviewed);
    assert.equal(await page.evaluate(() => auditorDebug.officer().supervisor), true);
    await page.screenshot({ path: root + '/preview-supervisor.png' });
    await page.click('#questionOfficer');
    await page.waitForFunction(
      () => auditorDebug.snapshot().health > 50 && auditorDebug.snapshot().health < 60,
    );
    await page.click('#questionOfficer');
    await page.waitForFunction(() => auditorDebug.snapshot().campaign.hospitals === 1);
    let s = await page.evaluate(() => auditorDebug.snapshot());
    assert.equal(s.hospitalBills, 65);
    assert.equal(s.health, 100);
    assert.equal(s.pendingReport.recordedForce, true);
    assert.ok(s.clips.at(-1).events.some((e) => e.event.includes('punches and kicks')));
    await page.click('#quickPolice');
    await page.click('#claim');
    await page.waitForFunction(() => auditorDebug.snapshot().claims === 1);
    s = await page.evaluate(() => auditorDebug.snapshot());
    assert.ok(s.settlementGross >= 600);
    assert.equal(s.taxpayerCost, s.settlementGross + 75);
    assert.equal(s.cash, Math.round((s.settlementGross - s.settlementFees - 12 - 65) * 100) / 100);
    assert.match(await page.locator('#modalBody').innerText(), /Taxpayer cost/);
    await page.screenshot({ path: root + '/preview-city-award.png' });
    await page.click('#backTown');
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.locator('#chooseFemale').isVisible(), false);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().gender), 'female');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().taxpayerCost), s.taxpayerCost);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().officerHistory.counts['92']), 3);
    assert.deepEqual(errors, []);
    console.log(
      'Female start/save, nearby officer recording, threat, supervisor, excessive force, hospital, city award and taxpayer accounting passed' +
        (gpu ? ' with WebGL rendering.' : '.'),
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
