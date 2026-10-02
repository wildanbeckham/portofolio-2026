// Serve out/ on port 4173, then run with Playwright installed or PLAYWRIGHT_PATH set.
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || "playwright");
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
page.on("pageerror", (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error' && /THREE|shader|WebGL/i.test(message.text())) errors.push(message.text()); });
const url = process.env.PORTFOLIO_URL || "http://127.0.0.1:4173";
const names = ["Tentang", "Keahlian", "Proyek", "Kontak"];
const ids = ["about", "skills", "work", "contact"];
const scene = page.locator(".game-viewport");
const modal = page.getByRole("dialog");
const position = () => scene.evaluate((el) => ({ x: Number(el.dataset.playerX), z: Number(el.dataset.playerZ), y: Number(el.dataset.playerY) }));
async function open(name) {
  await page.getByRole("navigation", { name: "Akses cepat portfolio" }).getByRole("button", { name, exact: true }).click();
  await modal.waitFor();
}
async function close() {
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("dialog").open);
  await page.waitForFunction(() => document.activeElement === document.querySelector('.game-viewport'));
}

try {
  await page.goto(url);
  await page.waitForSelector('.game-exhibit[data-status="ready"]', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.game-viewport').dataset.playerX !== undefined);
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator("main > section").count(), 0, "No landing-page sections outside the game");
  assert.equal(await page.locator('.world-portal-labels button').count(), 4);
  assert.equal(await modal.count(), 0, "Content starts hidden");
  assert.equal(await scene.getAttribute('data-sky'), 'sun', 'Light theme shows the sun');
  const weatherBefore = await scene.getAttribute('data-weather');
  const portalBefore = await scene.getAttribute('data-portal-time');
  const npcsBefore = await scene.getAttribute('data-npcs');
  assert.equal(JSON.parse(npcsBefore).length, 5, 'Five ambient NPCs populate the island');
  const windmill = (await scene.getAttribute('data-windmill')).split(',').map(Number);
  assert.ok(Math.hypot(...windmill) + 1.5 < 11.6 * Math.cos(Math.PI / 8), 'Windmill and blade sweep fit inside the shore');
  await page.waitForTimeout(300);
  assert.notEqual(await scene.getAttribute('data-weather'), weatherBefore, 'Clouds, windmill, and trees animate');
  assert.notEqual(await scene.getAttribute('data-portal-time'), portalBefore, 'Portal energy animates in the world');
  assert.notEqual(await scene.getAttribute('data-npcs'), npcsBefore, 'Residents walk independently');
  const cameraBefore = await scene.getAttribute('data-camera');
  await page.mouse.move(1000, 300);
  await page.waitForTimeout(350);
  assert.notEqual(await scene.getAttribute('data-camera'), cameraBefore, 'Mouse parallax works');
  await page.keyboard.down("d");
  await page.waitForTimeout(500);
  await page.keyboard.up("d");
  assert.ok((await position()).x > .1, 'Keyboard moves immediately without click or focus');
  await page.keyboard.press("Space");
  await page.waitForFunction(() => Number(document.querySelector('.game-viewport').dataset.playerY) > .05);
  await page.waitForFunction(() => Number(document.querySelector('.game-viewport').dataset.playerY) === 0);

  await page.getByRole('button', { name: 'Reset posisi robot' }).click();
  await page.keyboard.down('d');
  await page.waitForFunction(() => Number(document.querySelector('.game-viewport').dataset.playerX) > 6, { timeout: 10000 });
  await page.keyboard.up('d');
  assert.ok((await position()).x > 6, 'New map is walkable beyond the previous boundary, including after clicking HUD');
  await page.keyboard.down('d');
  await page.waitForTimeout(4500);
  await page.keyboard.up('d');
  const edge = await position();
  assert.ok(Math.hypot(edge.x, edge.z) <= 10.32, 'Robot stays inside the larger shoreline');
  await page.getByRole('button', { name: 'Reset posisi robot' }).click();
  await page.keyboard.down('a');
  await page.waitForTimeout(150);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await position();
  await page.waitForTimeout(200);
  await page.keyboard.up('a');
  assert.deepEqual(await position(), blurred, 'Losing window focus clears held keys');
  await page.getByRole('button', { name: 'Reset posisi robot' }).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.game-exhibit').getAttribute('data-paused'), 'true', 'Escape pauses global controls');
  await page.getByRole('button', { name: 'Lanjutkan game' }).focus();
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('.game-exhibit').dataset.paused === 'false');
  assert.equal((await position()).y, 0, 'Space activates focused buttons without jumping');

  for (let index = 0; index < names.length; index++) {
    await open(names[index]);
    assert.equal(await modal.getAttribute('aria-labelledby'), 'portal-title');
    assert.equal(await page.locator('#portal-title').innerText(), names[index]);
    assert.ok(await modal.locator(`#${ids[index]}`).isVisible());
    const portrait = modal.locator('.interaction-portrait-stage');
    await modal.locator('[data-preview="ready"] canvas').waitFor();
    assert.equal(await modal.locator('.interaction-portrait').getAttribute('data-asset'), ['altar', 'portal', 'portal', 'npc'][index]);
    assert.equal(await page.locator('canvas').count(), 2, 'One world canvas and one asset canvas');
    const previewBefore = await portrait.getAttribute('data-preview-time');
    const stopped = await position();
    const weatherPaused = await scene.getAttribute('data-weather');
    const npcsPaused = await scene.getAttribute('data-npcs');
    await page.keyboard.press('w');
    await page.waitForTimeout(150);
    assert.deepEqual(await position(), stopped, 'Modal pauses the game');
    assert.equal(await scene.getAttribute('data-weather'), weatherPaused, 'Modal pauses environment animation');
    assert.equal(await scene.getAttribute('data-npcs'), npcsPaused, 'Modal pauses NPC movement');
    if (index !== 0) assert.notEqual(await portrait.getAttribute('data-preview-time'), previewBefore, 'Portrait animates while the world is paused');
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), 'Focus stays inside modal');
    }
    await close();
    assert.equal(await page.locator('canvas').count(), 1, 'Closing disposes the asset renderer');
    assert.ok(await scene.evaluate((el) => el === document.activeElement), 'Focus returns to game');
    // The altar and service NPC require interaction; portals still open on entry.
    await page.keyboard.down('w');
    if (index === 0 || index === 3) {
      await page.waitForTimeout(300);
      await page.keyboard.up('w');
      assert.equal(await modal.count(), 0, 'Approaching statue or NPC does not auto-open content');
      if (index === 0) {
        const p = await position();
        assert.ok(Math.hypot(p.x, p.z) >= 1.8, 'Central altar blocks walking through the statue');
        assert.ok(Math.hypot(p.x, p.z) < 2.15, 'Statue is reachable from outside its collision boundary');
        await page.keyboard.press('e');
      } else await page.getByRole('button', { name: 'Interaksi E', exact: true }).click();
    }
    await modal.waitFor({ timeout: 5000 });
    await page.keyboard.up('w');
    assert.equal(await page.locator('#portal-title').innerText(), names[index], 'Interaction opens the matching content');
    await close();
    await page.waitForTimeout(350);
    assert.equal(await modal.count(), 0, 'Closing does not immediately retrigger portal');
  }

  await open('Keahlian');
  for (const category of ['Styling', 'Mobile & CMS', 'Tools', 'Frontend']) {
    await modal.getByRole('button', { name: category, exact: false }).click();
    assert.ok(await modal.locator('.skill-token').count() > 0);
  }
  await close();
  await open('Proyek');
  for (const button of await modal.locator('.project-index button').all()) {
    await button.click();
    assert.equal(await modal.locator('.project-info h3').innerText(), (await button.innerText()).replace(/^\d+\s*/, '').trim());
  }
  await close();
  await open('Kontak');
  assert.equal(await modal.locator('.npc-services li').count(), 3, 'Contact NPC presents three services');
  assert.equal(await modal.getByRole('link', { name: /Email/ }).getAttribute('href'), 'mailto:wildanbeckham5@gmail.com');
  await page.evaluate(() => { window.open = (url) => { window.__draftUrl = url; return null; }; });
  await modal.getByLabel('Nama', { exact: true }).fill('Portal Check');
  await modal.getByLabel('Email', { exact: true }).fill('check@example.com');
  await modal.getByLabel('Pesan', { exact: true }).fill('Website React & Next.js');
  const writingPosition = await position();
  await modal.getByLabel('Pesan', { exact: true }).press('End');
  await page.keyboard.type(' wasd e');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await modal.getByLabel('Pesan', { exact: true }).inputValue(), 'Website React & Next.js wasd e', 'Game keys type normally in form fields');
  assert.deepEqual(await position(), writingPosition, 'Typing and cursor keys do not move the robot');
  await modal.getByRole('button', { name: 'Kirim ke WhatsApp' }).click();
  const draft = new URL(await page.evaluate(() => window.__draftUrl));
  assert.equal(draft.pathname, '/6285157283329');
  assert.ok(draft.searchParams.get('text').includes('React & Next.js'));
  await close();

  await page.getByRole('button', { name: 'Jeda game', exact: true }).click();
  await open('Tentang');
  await close();
  assert.equal(await page.locator('.game-exhibit').getAttribute('data-paused'), 'true', 'Manual pause survives modal');
  const manualWeather = await scene.getAttribute('data-weather');
  await page.waitForTimeout(200);
  assert.equal(await scene.getAttribute('data-weather'), manualWeather, 'Manual pause stops the environment');
  await page.getByRole('button', { name: 'Lanjutkan game' }).click();

  for (const [width, height] of [[320, 740], [390, 844], [768, 900], [1024, 768], [1440, 900], [844, 390]]) {
    await page.setViewportSize({ width, height });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight), `Game fits ${width}x${height}`);
    await open('Kontak');
    assert.ok(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth), 'Modal has no horizontal overflow');
    await modal.locator('[data-preview="ready"] canvas').waitFor();
    const content = await modal.locator('.portal-modal-content').boundingBox();
    const portrait = await modal.locator('.interaction-portrait').boundingBox();
    assert.ok(width < 768 ? portrait.y + portrait.height <= content.y + 1 : portrait.x >= content.x + content.width - 1, 'Asset sits above content on mobile and beside it on desktop');
    assert.ok(await modal.locator('.portal-modal-content').evaluate((el) => el.scrollWidth <= el.clientWidth), 'Content fits the narrower reading column');
    await close();
    console.log(`Game and modal layout ${width}x${height}: OK`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${url}/#skills`);
  await modal.waitFor();
  assert.equal(await page.locator('#portal-title').innerText(), 'Keahlian', 'Existing anchors open the matching portal');
  await modal.locator('[data-preview="ready"] canvas').waitFor();
  await close();
  await open('Proyek');
  await page.goBack();
  await page.waitForFunction(() => !document.querySelector('dialog').open);
  await page.goForward();
  await modal.waitFor();
  assert.equal(await page.locator('#portal-title').innerText(), 'Proyek');
  await close();

  await page.getByRole('button', { name: 'Aktifkan dark mode' }).click();
  await page.reload();
  await page.waitForSelector('.game-exhibit[data-status="ready"]');
  assert.ok(await page.locator('html').evaluate((el) => el.classList.contains('dark')));
  assert.equal(await scene.getAttribute('data-sky'), 'moon', 'Dark theme shows the moon');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(300);
  const staticCamera = await scene.getAttribute('data-camera');
  const staticWeather = await scene.getAttribute('data-weather');
  const staticNpcs = await scene.getAttribute('data-npcs');
  await page.mouse.move(200, 250);
  await page.waitForTimeout(200);
  assert.equal(await scene.getAttribute('data-camera'), staticCamera);
  assert.equal(await scene.getAttribute('data-weather'), staticWeather, 'Reduced motion stops clouds, trees, and windmill');
  assert.equal(await scene.getAttribute('data-npcs'), staticNpcs, 'Reduced motion stops ambient NPC wandering');
  await open('Proyek');
  await modal.locator('[data-preview="ready"] canvas').waitFor();
  const reducedPreview = await modal.locator('.interaction-portrait-stage').getAttribute('data-preview-time');
  await page.waitForTimeout(250);
  assert.equal(await modal.locator('.interaction-portrait-stage').getAttribute('data-preview-time'), reducedPreview, 'Reduced motion stops portrait animation');
  await modal.locator('canvas').evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  assert.ok(await modal.locator('.portrait-fallback').isVisible(), 'Lost portrait context has a readable fallback');
  assert.ok(await modal.locator('#work').isVisible(), 'Content survives portrait failure');
  await close();

  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await touch.goto(url);
  await touch.waitForSelector('.game-exhibit[data-status="ready"]');
  const bounds = await touch.getByRole('button', { name: 'Gerak kanan' }).boundingBox();
  const cdp = await touch.context().newCDPSession(touch);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
  await touch.waitForTimeout(600);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok(Number(await touch.locator('.game-viewport').getAttribute('data-player-x')) > .1);
  await touch.getByRole('navigation').getByRole('button', { name: 'Proyek', exact: true }).tap();
  assert.ok(await touch.getByRole('dialog').isVisible());
  await touch.getByRole('button', { name: 'Tutup modal dan kembali bermain' }).tap();
  await touch.close();

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : original.call(this, type, ...args); };
  });
  await fallback.goto(url);
  await fallback.waitForSelector('.game-exhibit[data-status="error"]');
  for (const name of names) {
    await fallback.getByRole('navigation').getByRole('button', { name, exact: true }).click();
    assert.ok(await fallback.getByRole('dialog').isVisible(), 'Content remains accessible without WebGL');
    assert.ok(await fallback.locator('.portrait-fallback').isVisible(), 'Asset fallback is available without WebGL');
    await fallback.keyboard.press('Escape');
  }
  await fallback.close();
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('Central altar, contact NPC, wandering residents, windmill bounds, portals, modals, mobile, and WebGL fallback: OK');
} finally {
  await browser.close();
}
