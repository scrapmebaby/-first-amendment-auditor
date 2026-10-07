const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const fs = require('node:fs');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(root + '/1st-amendment-auditor.html'));
  });
  await new Promise((r) => server.listen(8081, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: process.argv.includes('--canvas')
      ? ['--no-sandbox', '--disable-webgl', '--disable-gpu']
      : [
          '--no-sandbox',
          '--enable-unsafe-webgpu',
          '--use-angle=swiftshader',
          '--enable-features=Vulkan',
          '--use-vulkan=swiftshader',
          '--disable-vulkan-surface',
        ],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.log('PAGE ERROR', e.message);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') {
      errors.push(m.text());
      console.log('RENDER ERROR', m.text());
    }
  });
  await page.addInitScript(() => {
    localStorage.setItem('auditor-graphics', 'balanced');
  });
  await page.goto('http://127.0.0.1:8081');
  await page.waitForFunction(() => window.auditorDebug);
  await page.evaluate(() => auditorDebug.setEncounterRoll(0.45));
  await page.keyboard.press('f');
  for (let i = 0; i < 5; i++) {
    await page.waitForFunction(() => !document.getElementById('touchEngage').disabled);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1400);
  }
  assert.ok(await page.evaluate(() => auditorDebug.snapshot().health < 100));
  await page.click('#quickPolice');
  assert.equal(await page.evaluate(() => auditorDebug.recording), true);
  await page
    .waitForFunction(() => auditorDebug.snapshot().pendingReport, {}, { timeout: 50000 })
    .catch(async (e) => {
      console.log(
        'Timeout state',
        await page.evaluate(() => ({
          clock: document.getElementById('clock').textContent,
          rec: document.getElementById('recordTime').textContent,
          police: document.getElementById('police').textContent,
          hidden: document.hidden,
          modal: document.getElementById('modal').open,
          errors: document.getElementById('engine').textContent,
        })),
      );
      throw e;
    });
  assert.equal(await page.evaluate(() => auditorDebug.snapshot().pendingReport.arrest), true);
  await page.keyboard.press('f');
  const clip = await page.evaluate(() => auditorDebug.snapshot().clips[0]);
  assert.ok(clip.events.some((e) => /demands charges against the civilian/.test(e.event)));
  assert.ok(clip.events.some((e) => /AUDITOR:.*press charges/.test(e.event)));
  assert.ok(clip.events.some((e) => /exaggerated legal jargon/.test(e.event)));
  assert.ok(clip.events.some((e) => /Patrol car arrives/.test(e.event)));
  assert.ok(clip.events.some((e) => /escorted into patrol/.test(e.event)));
  await page.click('#menuToggle');
  await page.click('[data-panel=editor]');
  await page.waitForSelector('video');
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1);
  assert.ok((await page.evaluate(() => document.querySelector('video').videoWidth)) > 0);
  await page.screenshot({ path: root + '/preview-editor.png' });
  await page.click('#closeModal');
  await page.click('#quickPolice');
  await page.click('#claim');
  assert.equal(await page.evaluate(() => auditorDebug.snapshot().claims), 1);
  await page.click('#closeModal');
  // Isolated fixture: anxious librarian crying, then a cup thrown by an irritable subject.
  async function position(x, z) {
    const state = await page.evaluate(() => auditorDebug.snapshot());
    Object.assign(state, { x, z, health: 100, clips: [] });
    delete state.pendingReport;
    await page.click('#menuToggle');
    await page.click('#settings');
    await page.setInputFiles('#file', {
      name: 'fixture.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(state)),
    });
    await page.waitForFunction(
      () => !document.getElementById('modal').open,
      {},
      { timeout: 10000 },
    );
    await page.waitForTimeout(300);
  }
  await position(-22, -9);
  await page.evaluate(() => auditorDebug.setEncounterRoll(0.6));
  await page.keyboard.press('f');
  for (let i = 0; i < 3; i++) {
    await page.waitForFunction(() => !document.getElementById('touchEngage').disabled);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1400);
  }
  await page.evaluate(() => auditorDebug.setEncounterRoll(0.2));
  await page.waitForFunction(() => !document.getElementById('touchEngage').disabled);
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  await page.keyboard.press('f');
  assert.ok(
    await page.evaluate(() =>
      auditorDebug
        .snapshot()
        .clips.at(-1)
        .events.some((e) => e.event.includes('cries')),
    ),
  );
  await position(7, 10);
  await page.evaluate(() => auditorDebug.setEncounterRoll(0.45));
  await page.keyboard.press('f');
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction(() => !document.getElementById('touchEngage').disabled);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1400);
  }
  await page.evaluate(() => auditorDebug.setEncounterRoll(0.35));
  await page.waitForFunction(() => !document.getElementById('touchEngage').disabled);
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  await page.keyboard.press('f');
  assert.ok(
    await page.evaluate(() =>
      auditorDebug
        .snapshot()
        .clips.at(-1)
        .events.some((e) => e.event.includes('cup thrown')),
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    'Police arrival, filmed arrest escort, claim, playable video, crying, and thrown-cup checks passed.',
  );
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
