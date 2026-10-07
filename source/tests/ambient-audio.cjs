const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(
      async (source) => {
        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        const { OutdoorAmbience } = await import(url);
        URL.revokeObjectURL(url);
        async function render(length, stateAt) {
          const rate = 22050,
            ctx = new OfflineAudioContext(1, rate * length, rate),
            scene = new OutdoorAmbience(ctx, ctx.destination, () => 0.2);
          for (let i = 0; i < length * 10; i++)
            scene.update(stateAt(i / 10), { rain: 0 }, false, i / 10);
          const buffer = await ctx.startRendering(),
            samples = buffer.getChannelData(0);
          return (a, b) => {
            let sum = 0;
            for (let i = Math.round(a * rate); i < Math.round(b * rate); i++)
              sum += samples[i] ** 2;
            return Math.sqrt(sum / Math.round((b - a) * rate));
          };
        }
        const birds = await render(8, (t) => ({ minutes: 700, music: false, driving: t >= 4 }));
        const music = await render(45, () => ({ minutes: 0, music: true, driving: false }));
        const off = await render(12, () => ({ minutes: 0, music: false, driving: false }));
        return {
          birds: birds(1.2, 2.2),
          driving: birds(6, 8),
          intro: music(0, 7),
          phrase: music(10, 20),
          gap: music(25, 44),
          off: off(0, 12),
        };
      },
      fs.readFileSync(path.resolve(__dirname, '../dist/audio.js'), 'utf8'),
    );
    assert.ok(result.birds > 0.0001);
    assert.ok(result.driving < 0.00001);
    assert.equal(result.intro, 0);
    assert.ok(result.phrase > 0.001);
    assert.equal(result.gap, 0);
    assert.equal(result.off, 0);
    console.log(
      'Ambient renders passed: daylight birds, driving fade, intermittent music, quiet gaps and music-off.',
      result,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
