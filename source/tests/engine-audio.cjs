const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const fs = require('node:fs'),
  assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const results = await page.evaluate(
      async (source) => {
        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        const { RustEngine } = await import(url);
        URL.revokeObjectURL(url);
        const ctx = new OfflineAudioContext(1, 44100 * 4, 44100),
          output = ctx.createGain();
        output.connect(ctx.destination);
        const noise = ctx.createBuffer(1, 44100, 44100);
        let seed = 11;
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          data[i] = seed / 2 ** 31 - 1;
        }
        const engine = new RustEngine(ctx, output, noise);
        for (let i = 0; i < 240; i++) {
          const t = i / 60;
          engine.update(
            { driving: t >= 0.3 && t < 3, carSpeed: t < 1.3 ? 0 : Math.min(19, (t - 1.3) * 16) },
            t,
          );
        }
        const rendered = await ctx.startRendering(),
          samples = rendered.getChannelData(0);
        const rms = (a, b) => {
          let sum = 0;
          for (let i = Math.round(a * 44100); i < Math.round(b * 44100); i++)
            sum += samples[i] ** 2;
          return Math.sqrt(sum / ((b - a) * 44100));
        };
        return {
          before: rms(0, 0.2),
          idle: rms(0.7, 1.2),
          rev: rms(2, 2.8),
          after: rms(3.8, 4),
          peak: Math.max(...samples.slice(0, 100000).map(Math.abs)),
        };
      },
      fs.readFileSync(require('node:path').resolve(__dirname, '../dist/audio.js'), 'utf8'),
    );
    assert.equal(results.before, 0);
    assert.ok(results.idle > 0.005);
    assert.ok(results.rev > results.idle);
    assert.ok(results.after < 0.0001);
    assert.ok(results.peak < 1);
    console.log(
      'Offline audio render passed: idle burble, louder revs, silent exit, and no clipping.',
      results,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
