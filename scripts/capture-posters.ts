// npm run posters  (with `npm run dev` running)
// Captures the poster images (first screen, no-WebGL and context-loss fallbacks) from the real
// 3D scene, so posters always match the art. Writes public/posters/globe.jpg and world.jpg.

import { chromium } from '@playwright/test';
import { encode } from '../src/share/codec';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5191';
// A healthy, fixed world so the poster is stable: stress is applied live with a CSS filter.
const WORLD = encode({ seed: 20261002, biome: 'forest', buckets: { text: 1, images: 1, videos: 0 }, plan: { fewerPictures: false, fewerVideos: false, lighterAi: false } });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
const hideUi = () => page.addStyleTag({ content: '.nav,.zone,.world-ui,.skip-hint{visibility:hidden!important} body main{grid-template-rows:1fr 0!important}' });

await page.goto(`${BASE}/`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('body[data-view="3d"]', { timeout: 30_000 });
await hideUi();
await page.waitForTimeout(2500); // fade-in + warmup
await page.locator('#stage').screenshot({ path: 'public/posters/globe.jpg', type: 'jpeg', quality: 82 });

await page.evaluate((w) => localStorage.setItem('hum.world', w), WORLD);
await page.reload();
await page.waitForSelector('body[data-view="3d"]', { timeout: 30_000 });
await page.click('#primary');
await page.waitForSelector('body.landed', { timeout: 15_000 });
await hideUi();
await page.waitForTimeout(1800); // world settles
await page.locator('#stage').screenshot({ path: 'public/posters/world.jpg', type: 'jpeg', quality: 82 });

await browser.close();
console.log('wrote public/posters/globe.jpg, public/posters/world.jpg');
