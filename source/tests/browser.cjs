const { chromium } = require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const file = req.url === '/' ? '1st-amendment-auditor.html' : req.url.split('?')[0].slice(1);
    const p = path.join(root, file);
    if (!p.startsWith(root)) {
      res.writeHead(403);
      return res.end();
    }
    try {
      const data = fs.readFileSync(p);
      res.setHeader(
        'Content-Type',
        p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html',
      );
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => server.listen(8080, '127.0.0.1', r));
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--enable-unsafe-webgpu',
      '--use-angle=swiftshader',
      '--enable-features=Vulkan',
      '--use-vulkan=swiftshader',
      '--disable-vulkan-surface',
      '--disable-dev-shm-usage',
    ],
  });
  async function screenshot(page, file, fullPage = false) {
    await page.evaluate(() => {
      const c = document.getElementById('world'),
        img = document.createElement('img');
      img.id = 'qa-frame';
      img.src = auditorDebug.captureFrame();
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      c.after(img);
      c.style.opacity = '0';
    });
    await page.screenshot({ path: file, fullPage });
    await page.evaluate(() => {
      document.getElementById('qa-frame').remove();
      document.getElementById('world').style.opacity = '1';
    });
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (true) console.log(m.type(), m.text());
  });
  await page.goto('http://127.0.0.1:8080');
  await page.waitForFunction(() => window.auditorDebug);
  await page.waitForTimeout(1500);
  console.log('Renderer:', await page.evaluate(() => auditorDebug.renderer));
  await screenshot(page, root + '/preview-desktop.png');
  fs.writeFileSync(
    root + '/gpu-scene.png',
    Buffer.from((await page.evaluate(() => auditorDebug.captureFrame())).split(',')[1], 'base64'),
  );
  assert.ok(await page.evaluate(() => auditorDebug.target));
  await page.click('#film');
  await page.waitForFunction(
    () => document.getElementById('recordTime').textContent >= '00:04',
    {},
    { timeout: 30000 },
  );
  await page.click('#engage');
  await page.click('#film');
  assert.equal(await page.evaluate(() => auditorDebug.snapshot().clips.length), 1);
  fs.writeFileSync(
    root + '/capture-canvas.png',
    Buffer.from((await page.evaluate(() => auditorDebug.recordedFrame())).split(',')[1], 'base64'),
  );
  await page.click('[data-panel=editor]');
  await page.waitForSelector('video');
  await page.evaluate(async () => {
    const blob = await fetch(document.querySelector('video').src).then((r) => r.blob());
    window.qaVideo = await new Promise((r) => {
      const f = new FileReader();
      f.onload = () => r(f.result);
      f.readAsDataURL(blob);
    });
  });
  fs.writeFileSync(
    root + '/capture-test.webm',
    Buffer.from((await page.evaluate(() => window.qaVideo)).split(',')[1], 'base64'),
  );
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1);
  assert.ok(await page.evaluate(() => document.querySelector('video').videoWidth > 0));
  await page.evaluate(async () => {
    const v = document.querySelector('video');
    v.muted = true;
    await v.play();
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector('video').pause());
  fs.writeFileSync(
    root + '/preview-recording.png',
    Buffer.from(
      (
        await page.evaluate(() => {
          const v = document.querySelector('video'),
            c = document.createElement('canvas');
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0);
          return c.toDataURL();
        })
      ).split(',')[1],
      'base64',
    ),
  );
  await page.check('[id^=cut-]');
  await page.click('[id^=publish-]');
  assert.equal(await page.evaluate(() => auditorDebug.snapshot().published), 1);
  await page.click('#closeModal');
  await page.click('[data-panel=shop]');
  await page.click('[data-buy=clown]');
  await page.click('[data-buy=crew]');
  assert.ok(await page.evaluate(() => auditorDebug.snapshot().gear.includes('crew')));
  await page.click('#closeModal');
  await page.click('#settings');
  await page.selectOption('#weatherChoice', 'rain');
  await page.click('#closeModal');
  await page.waitForTimeout(7000);
  await screenshot(page, root + '/preview-rain.png');
  await page.reload();
  await page.waitForFunction(() => window.auditorDebug);
  assert.equal(await page.evaluate(() => auditorDebug.snapshot().published), 1);
  assert.ok(await page.evaluate(() => auditorDebug.snapshot().gear.includes('clown')));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await screenshot(page, root + '/preview-mobile.png', true);
  console.log(
    'UI smoke tests and local video playback passed. File-URL boot is unverified: managed Chromium blocks file navigation. Errors:',
    errors,
  );
  assert.deepEqual(errors, []);
  await browser.close();
  await new Promise((r) => server.close(r));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
