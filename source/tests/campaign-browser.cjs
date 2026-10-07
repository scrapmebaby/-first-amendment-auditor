const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
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
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem('auditor-graphics', 'balanced');
    });
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    await page.evaluate(() => auditorDebug.setEncounterRoll(0.45));
    async function fixture(change) {
      const s = await page.evaluate(() => auditorDebug.snapshot());
      change(s);
      await page.click('#menuToggle');
      await page.click('#settings');
      await page.setInputFiles('#file', {
        name: 'career.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(s)),
      });
      await page.waitForFunction(() => !document.querySelector('#modal').open);
      await page.waitForTimeout(200);
    }
    await page.click('#menuToggle');
    await page.click('#campaign');
    await page.click('#takeLoan');
    await page.click('#takeLoan');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.loanRate), 0.08);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().revenue), 0);
    await page.click('#closeModal');
    // High reputation and the next home-event timer provide a reproducible real simulation trigger.
    await page.click('#menuToggle');
    await page.click('[data-panel=shop]');
    await page.click('[data-buy=security]');
    await page.click('#closeModal');
    await fixture((s) => {
      s.campaign.reputation = 35;
      s.campaign.homeKnown = true;
      s.campaign.homeClock = 109.8;
    });
    await page.waitForFunction(() => auditorDebug.snapshot().campaign.homeIncidents.length === 1);
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().campaign.homeIncidents[0].identified),
      true,
    );
    await fixture((s) => (s.campaign.homeClock = 109.8));
    await page.waitForFunction(() => auditorDebug.snapshot().campaign.homeIncidents.length === 2);
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().campaign.homeIncidents[0].masked),
      true,
    );
    await page.click('#menuToggle');
    await page.click('#campaign');
    await page.click('[data-evidence="2"]');
    await page.waitForSelector('#securityStill');
    await page.screenshot({ path: root + '/preview-home.png' });
    await page.click('#closeModal');
    // Severe contact, equipment damage, automatic police call, live paperwork, and escape.
    await fixture((s) => {
      s.x = 7;
      s.z = 10;
      s.health = 100;
      s.campaign.reputation = 55;
      s.campaign.condition = 100;
      s.campaign.homeClock = 0;
      s.clips = [];
      delete s.pendingReport;
    });
    await page.evaluate(() => auditorDebug.setEncounterRoll(0.6));
    await page.keyboard.press('f');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(1350);
    }
    await page.evaluate(() => auditorDebug.setEncounterRoll(0.1));
    for (let i = 0; i < 3; i++) {
      if (await page.evaluate(() => auditorDebug.snapshot().campaign.condition === 0)) break;
      await page.keyboard.press('Space');
      await page.waitForTimeout(1350);
    }
    await page.waitForFunction(() => auditorDebug.snapshot().campaign.condition === 0);
    assert.equal(await page.evaluate(() => auditorDebug.recording), false);
    await page.waitForFunction(
      () => document.querySelector('#police').textContent === 'Write report',
    );
    await page.click('#quickPolice');
    await page.waitForSelector('#statementText');
    await page.waitForFunction(
      () => auditorDebug.snapshot().pendingReport?.escaped,
      {},
      { timeout: 35000 },
    );
    await page.fill(
      '#statementText',
      'The civilian damaged my camera after I continued filming and provoking them.',
    );
    await page.check('#statementContext');
    await page.click('#statementForm button');
    assert.equal(
      await page.evaluate(() => auditorDebug.snapshot().pendingReport.statementFiled),
      true,
    );
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().pendingReport.arrest), false);
    await page.click('#menuToggle');
    await page.click('[data-panel=shop]');
    await page.click('#repairGear');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.condition), 100);
    await page.click('#closeModal');
    console.log('Home, loan, equipment and paperwork branches passed.');
    // Start one upload before the cutoff, then reach the real demonetization action through the editor.
    await fixture((s) => {
      s.x = 7;
      s.z = 10;
      s.published = 7;
      s.campaign.reputation = 60;
      s.campaign.warning = true;
      s.campaign.demonetized = false;
      s.campaign.career = 'auditor';
      s.campaign.strikes = 0;
      s.clips = [
        {
          id: 999,
          place: 'CITY HALL',
          person: 'Pat',
          seconds: 10,
          drama: 2,
          music: false,
          touched: false,
          day: 1,
          events: [],
        },
      ];
      s.nextId = 1000;
      delete s.pendingReport;
    });
    await page.click('#menuToggle');
    await page.click('[data-panel=editor]');
    await page.click('#publish-999');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.demonetized), true);
    await page.click('#closeModal');
    await page.click('#menuToggle');
    await page.click('#campaign');
    await page.click('#leaveCareer');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.career), 'service');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.loanRate), 0);
    await page.click('#closeModal');
    await fixture((s) => {
      s.x = 26;
      s.z = 38;
      s.driving = false;
    });
    for (let shift = 0; shift < 3; shift++) {
      await page.click('#menuToggle');
      await page.click('#campaign');
      await page.click('[data-start-job="coffee"]');
      for (let task = 0; task < 3; task++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(2800);
      }
    }
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.shifts), 3);
    await page.click('#menuToggle');
    await page.click('#campaign');
    await page.click('#finishCareer');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.career), 'won');
    await page.screenshot({ path: root + '/preview-ending.png' });
    await page.click('#peace');
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().campaign.career), 'won');
    assert.equal(await page.locator('#film').isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: demonetization, service career, three real task sequences, explicit give-up victory, and reload persistence.',
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
