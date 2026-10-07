const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..'),
    server = http.createServer((q, r) => {
      r.setHeader('Content-Type', 'text/html');
      r.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
    });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 950 } });
    p.setDefaultTimeout(15000);
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.addInitScript(() => {});
    await p.goto('http://127.0.0.1:' + server.address().port);
    await p.waitForFunction(() => window.auditorDebug);
    await p.evaluate(() => auditorDebug.setEncounterRoll(0.6));
    const s = await p.evaluate(() => auditorDebug.snapshot());
    s.health = 35;
    s.campaign.reputation = 55;
    await p.click('#menuToggle');
    await p.click('#settings');
    await p.setInputFiles('#file', {
      name: 'injury-fixture.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(s)),
    });
    await p.waitForFunction(() => !document.querySelector('#modal').open);
    await p.keyboard.press('f');
    for (let i = 0; i < 3; i++) {
      await p.keyboard.press('Space');
      await p.waitForTimeout(1400);
    }
    await p.evaluate(() => auditorDebug.setEncounterRoll(0.2));
    for (let i = 0; i < 2; i++) {
      if (await p.evaluate(() => auditorDebug.snapshot().campaign.hospitals)) break;
      await p.keyboard.press('Space');
      await p.waitForTimeout(1400);
    }
    await p.waitForFunction(() => auditorDebug.snapshot().campaign.hospitals === 1);
    const after = await p.evaluate(() => auditorDebug.snapshot());
    assert.equal(after.health, 100);
    assert.equal(after.x, -66);
    assert.equal(after.z, 40);
    assert.ok(after.ledger.some((l) => l.label.startsWith('Hospital:') && l.amount === -65));
    assert.ok(after.clips.some((c) => c.events.some((e) => e.event.includes('punches and kicks'))));
    assert.ok(after.clips.some((c) => c.events.some((e) => e.event.includes('calls police'))));
    assert.equal(await p.evaluate(() => auditorDebug.recording), false);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: severe civilian assault records evidence, auto-calls police, sends the auditor to hospital, charges treatment, and restores health.',
    );
  } finally {
    await b.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
