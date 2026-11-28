// Retakes the screenshots listed in shots.json: serves the repo on a local port, opens each
// scene of tools/shot.html in Chrome through playwright-core, and saves 1280x720 JPEGs into
// screenshots/. Usage: node tools/take-screenshots.mjs [--chrome /path/to/chrome]
import { createServer } from 'node:http';
import { readFileSync, createReadStream, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = createServer((req, res) => {
  const path = resolve(join(repo, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(repo + sep) || !statSync(path, { throwIfNoEntry: false })?.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
  createReadStream(path).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise((ok) => server.once('listening', ok));
const base = `http://127.0.0.1:${server.address().port}`;

const list = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));
const args = process.argv.slice(2);
const chromeAt = args.indexOf('--chrome');
const chrome = chromeAt === -1 ? '/usr/bin/google-chrome' : args[chromeAt + 1];
const browser = await chromium.launch({ executablePath: chrome });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
for (const s of list) {
  await page.goto(`${base}/tools/shot.html${s.query}`);
  await page.waitForFunction(() => window.__shotReady, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(repo, 'screenshots', s.name), type: 'jpeg', quality: 86 });
  console.log('saved', s.name);
}
await browser.close();
server.close();
if (errors.length) { console.error(errors); process.exit(1); }
