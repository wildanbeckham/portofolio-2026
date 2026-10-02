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
  const faunaBefore = await scene.getAttribute('data-fauna');
  const waterBefore = await scene.getAttribute('data-waterlife');
  const castleBefore = JSON.parse(await scene.getAttribute('data-castle'));
  assert.ok(castleBefore.x > 6 && castleBefore.z < -8, 'Castle occupies the back-right corner');
  for (const dx of [-1.9, 1.9]) for (const dz of [-1.7, 1.7]) {
    const x = Math.abs(castleBefore.x + dx), z = Math.abs(castleBefore.z + dz);
    assert.ok(Math.max(x, z) + Math.min(x, z) * Math.tan(Math.PI / 8) < 15, 'Castle footprint fits the octagonal island');
  }
  assert.ok(Number(await scene.getAttribute('data-fisherman-clearance')) > 1.5, 'Fishing NPC is clear of tree trunks and crowns');
  const waterfall = JSON.parse(await scene.getAttribute('data-waterfall'));
  assert.ok(Math.abs(waterfall.outlet[1] - waterfall.height - waterfall.basin[1]) < .001, 'Waterfall terminates at the lower pool surface');
  assert.ok(waterfall.basin[1] < -5.85 && waterfall.landingRadius > 1, 'A lower rock pool catches the waterfall below the main island');
  assert.ok(waterfall.splash > 0 && waterfall.mist > 0, 'Waterfall impact includes spray and mist');
  assert.equal(JSON.parse(waterBefore).fish.length, 6, 'Six fish swim in the pond');
  assert.ok(Number(await scene.getAttribute('data-walk-radius')) > 13, 'The expanded island is walkable beyond thirteen units');
  assert.equal(JSON.parse(faunaBefore).butterflies.length, 7, 'Seven butterflies populate the gardens');
  assert.equal(JSON.parse(faunaBefore).foxes.length, 2, 'Two foxes populate the island');
  assert.equal(Number(await scene.getAttribute('data-butterfly-scale')), .45, 'Butterflies are less than half their previous size');
  assert.equal(new Set((await scene.getAttribute('data-npc-shapes')).split(',')).size, 5, 'Residents have five distinct silhouettes');
  await page.evaluate(() => {
    window.__residents = { worship: false, jump: false, trip: false, recovered: false, departed: false, wave: false, invalid: false };
    window.__residentCheck = setInterval(() => {
      const el = document.querySelector('.game-viewport');
      const positions = JSON.parse(el.dataset.npcs);
      const actors = JSON.parse(el.dataset.inhabitants);
      const castle = JSON.parse(el.dataset.castle);
      const [pondX, pondZ, pondRadius] = el.dataset.pond.split(',').map(Number);
      if (JSON.parse(el.dataset.waterlife).fish.some(([x, , z]) => Math.hypot(x - pondX, z - pondZ) > pondRadius - .3)) window.__residents.invalid = true;
      actors.forEach((actor, index) => {
        if (Math.hypot(actor.x - castle.x, actor.z - castle.z) < castle.radius + Math.max(0, actor.radius - .4) - .001) window.__residents.invalid = true;
        if (Math.hypot(actor.x - pondX, actor.z - pondZ) < pondRadius + Math.max(0, actor.radius - .4) - .001) window.__residents.invalid = true;
        if (actors.slice(index + 1).some((other) => Math.hypot(actor.x - other.x, actor.z - other.z) < actor.radius + other.radius - .001)) window.__residents.invalid = true;
      });
      JSON.parse(el.dataset.npcActions).forEach((npc, index) => {
        const [x, z] = positions[index];
        const seen = window.__residents;
        if (Math.hypot(x, z) < 1.8 || Math.hypot(x, z) > Number(el.dataset.walkRadius) || npc.y < 0) seen.invalid = true;
        if (index === 0 && npc.action === 'worship' && npc.bow > .3 && Math.hypot(x, z) <= 2.51 && Math.abs(Math.sin(npc.facing) + x / Math.hypot(x, z)) < .02 && Math.abs(Math.cos(npc.facing) + z / Math.hypot(x, z)) < .02) seen.worship = true;
        if (seen.worship && index === 0 && npc.action === 'walk' && npc.bow === 0 && Math.hypot(x, z) > 2.7) seen.departed = true;
        if (npc.action === 'jump' && npc.y > .15) seen.jump = true;
        if (index === 3 && npc.action === 'trip' && npc.bow > 1) seen.trip = true;
        if (seen.trip && index === 3 && npc.action !== 'trip' && npc.bow === 0 && npc.y === 0) seen.recovered = true;
        if (npc.action === 'wave') seen.wave = true;
      });
    }, 50);
  });
  const windmill = (await scene.getAttribute('data-windmill')).split(',').map(Number);
  assert.ok(Math.hypot(...windmill) + 1.5 < 11.6 * Math.cos(Math.PI / 8), 'Windmill and blade sweep fit inside the shore');
  await page.waitForTimeout(300);
  assert.notEqual(await scene.getAttribute('data-weather'), weatherBefore, 'Clouds, windmill, and trees animate');
  assert.notEqual(await scene.getAttribute('data-portal-time'), portalBefore, 'Portal energy animates in the world');
  assert.notEqual(await scene.getAttribute('data-npcs'), npcsBefore, 'Residents walk independently');
  assert.notEqual(await scene.getAttribute('data-fauna'), faunaBefore, 'Butterflies flutter and foxes roam');
  assert.notEqual(await scene.getAttribute('data-waterlife'), waterBefore, 'Fish, falling water, and fishing animate');
  const waterAfter = JSON.parse(await scene.getAttribute('data-waterlife'));
  assert.notEqual(waterAfter.stream, JSON.parse(waterBefore).stream, 'Stream waves and foam receive animation time');
  assert.notEqual(JSON.parse(await scene.getAttribute('data-castle')).flag, castleBefore.flag, 'Castle flag waves');
  assert.notEqual(waterAfter.fall, JSON.parse(waterBefore).fall, 'Curved waterfall shader receives animation time');
  assert.notDeepEqual(waterAfter.splash, JSON.parse(waterBefore).splash, 'Impact droplets animate');
  assert.notEqual(waterAfter.mist, JSON.parse(waterBefore).mist, 'Mist drifts around the lower pool');
  await page.waitForFunction(() => Object.entries(window.__residents).every(([key, value]) => key === 'invalid' || value), null, { timeout: 45000 });
  assert.equal(await page.evaluate(() => { clearInterval(window.__residentCheck); return window.__residents.invalid; }), false, 'Residents remain outside the altar, inside the shore, and never overlap');
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
  assert.ok(Math.hypot(edge.x, edge.z) <= Number(await scene.getAttribute('data-walk-radius')), 'Robot stays inside the larger shoreline');
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
    const actionsPaused = await scene.getAttribute('data-npc-actions');
    const faunaPaused = await scene.getAttribute('data-fauna');
    const waterPaused = await scene.getAttribute('data-waterlife');
    const castlePaused = await scene.getAttribute('data-castle');
    await page.keyboard.press('w');
    await page.waitForTimeout(150);
    assert.deepEqual(await position(), stopped, 'Modal pauses the game');
    assert.equal(await scene.getAttribute('data-weather'), weatherPaused, 'Modal pauses environment animation');
    assert.equal(await scene.getAttribute('data-npcs'), npcsPaused, 'Modal pauses NPC movement');
    assert.equal(await scene.getAttribute('data-npc-actions'), actionsPaused, 'Modal pauses NPC gestures');
    assert.equal(await scene.getAttribute('data-fauna'), faunaPaused, 'Modal pauses animals');
    assert.equal(await scene.getAttribute('data-waterlife'), waterPaused, 'Modal pauses fish, waterfall, and fishing');
    assert.equal(await scene.getAttribute('data-castle'), castlePaused, 'Modal pauses castle flag');
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
  const staticActions = await scene.getAttribute('data-npc-actions');
  const staticFauna = await scene.getAttribute('data-fauna');
  const staticWater = await scene.getAttribute('data-waterlife');
  const staticCastle = await scene.getAttribute('data-castle');
  await page.mouse.move(200, 250);
  await page.waitForTimeout(200);
  assert.equal(await scene.getAttribute('data-camera'), staticCamera);
  assert.equal(await scene.getAttribute('data-weather'), staticWeather, 'Reduced motion stops clouds, trees, and windmill');
  assert.equal(await scene.getAttribute('data-npcs'), staticNpcs, 'Reduced motion stops ambient NPC wandering');
  assert.equal(await scene.getAttribute('data-npc-actions'), staticActions, 'Reduced motion stops NPC gestures');
  assert.equal(await scene.getAttribute('data-fauna'), staticFauna, 'Reduced motion stops animal animation');
  assert.equal(await scene.getAttribute('data-waterlife'), staticWater, 'Reduced motion stops aquatic animation');
  assert.equal(await scene.getAttribute('data-castle'), staticCastle, 'Reduced motion stops castle flag');
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

  const collision = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  collision.on('pageerror', (error) => errors.push(error.message));
  // Approach frozen residents using real keyboard input, including attempts to jump through them.
  for (const [name, actorIndex] of [['NPC', 5], ['fox', 7], ['butterfly', 9]]) {
    await collision.goto(url);
    await collision.waitForSelector('.game-exhibit[data-status="ready"]');
    const actors = () => collision.locator('.game-viewport').evaluate((el) => JSON.parse(el.dataset.inhabitants));
    const target = (await actors())[actorIndex];
    for (let step = 0; step < 65; step++) {
      const player = (await actors())[0];
      const dx = target.x - player.x;
      const dz = target.z - player.z;
      const right = dx * .91 - dz * .41;
      const forward = dx * .41 + dz * .91;
      const move = [];
      if (Math.abs(right) > Math.abs(forward) * .4) move.push(right > 0 ? 'd' : 'a');
      if (Math.abs(forward) > Math.abs(right) * .4) move.push(forward > 0 ? 's' : 'w');
      for (const key of move) await collision.keyboard.down(key);
      if (step % 10 === 0) await collision.keyboard.press('Space');
      await collision.waitForTimeout(70);
      for (const key of move) await collision.keyboard.up(key);
      const current = (await actors())[0];
      assert.ok(Math.hypot(current.x - target.x, current.z - target.z) >= current.radius + target.radius - .001, `Player cannot penetrate ${name}, even when jumping`);
    }
    const player = (await actors())[0];
    assert.ok(Math.hypot(player.x - target.x, player.z - target.z) < player.radius + target.radius + .2, `Player reaches the ${name} collision boundary`);
    console.log(`Solid ${name} collision: OK`);
  }
  await collision.close();

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
  console.log('Altar worship, NPC gestures and recovery, butterflies, foxes, portals, modals, mobile, and WebGL fallback: OK');
} finally {
  await browser.close();
}
