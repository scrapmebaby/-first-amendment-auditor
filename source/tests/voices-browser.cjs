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
    await page.addInitScript(() => {
      window.spoken = [];
      let timer;
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        value: class {
          constructor(text) {
            this.text = text;
          }
        },
      });
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          getVoices: () =>
            ['A', 'B', 'C'].map((n) => ({
              name: n,
              voiceURI: n,
              lang: 'en-US',
              localService: true,
            })),
          addEventListener: () => {},
          speak: (u) => {
            window.spoken.push({ text: u.text, voice: u.voice?.voiceURI, volume: u.volume });
            timer = setTimeout(() => u.onend?.(), 80);
          },
          cancel: () => clearTimeout(timer),
        },
      });
    });
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.waitForFunction(() => window.auditorDebug);
    await page.click('#menuToggle');
    await page.click('#settings');
    await page.click('#previewVoices');
    await page.waitForFunction(() => spoken.filter((x) => x.volume > 0).length >= 3);
    let spoken = await page.evaluate(() => window.spoken.filter((x) => x.volume > 0));
    assert.equal(new Set(spoken.slice(0, 3).map((x) => x.voice)).size, 3);
    await page.locator('#voiceVolume').fill('0.4');
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().voiceVolume), 0.4);
    await page.click('#closeModal');
    await page.click('#touchEngage');
    await page.waitForFunction(() => auditorDebug.conversation().lines.length >= 4);
    spoken = await page.evaluate(() => window.spoken.filter((x) => x.volume > 0));
    assert.ok(spoken.length >= 7);
    assert.equal(spoken.at(-1).volume, 0.4);
    const count = spoken.length;
    await page.click('#soundToggle');
    await page.click('#touchEngage');
    await page.waitForTimeout(700);
    assert.equal(
      await page.evaluate(() => window.spoken.filter((x) => x.volume > 0).length),
      count,
    );
    await page.reload();
    await page.waitForFunction(() => window.auditorDebug);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().voices), true);
    assert.equal(await page.evaluate(() => auditorDebug.snapshot().voiceVolume), 0.4);
    assert.deepEqual(errors, []);
    console.log(
      'Mobile speech integration passed with a mock engine: three preview voices, two-way dialogue, volume, master mute and reload persistence. Hardware audio quality not tested.',
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
